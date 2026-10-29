import { LightningElement, api } from 'lwc';
import getBarristers from '@salesforce/apex/GlBarristerListingController.getBarristers';
import getAreasOfPractice from '@salesforce/apex/GlBarristerListingController.getAreasOfPractice';
import getBarristerListing from '@salesforce/apex/GlBarristerListingController.getBarristerListing';

const NONE = '-None-';
const SENIORITY = [NONE, '0-3', '04-07', '08-11', '12-19', '20+'];
const BARRISTER_TYPES = [
    NONE,
    'Accredited Mediator',
    'Advanced Mediator',
    'Arbitrator',
    'Former Judge',
    'Junior',
    'List Committee',
    'Reader',
    'Silk'
];
const GENDERS = ['', 'Male', 'Female'];
const AZ = [NONE, ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

const DEBOUNCE_MS = 300;
const MAX_CHIPS = 3;
const SELECT_FIELDS = ['seniority', 'barristerType', 'gender', 'az'];

export default class GlBarristerListing extends LightningElement {
    // ---------- Filter state ----------
    selectedBarristers = []; // [{ id, name }]
    selectedKeys = []; // area-of-practice selection keys (record Id, or 'self:<mainId>' for a main area's own sub row)
    seniority = NONE;
    barristerType = NONE;
    gender = '';
    az = NONE;
    keyword = '';

    /** Last JSON saved by the Search button */
    searchFilters;

    // ---------- Listing (passed to the child glBarristerCards) ----------
    // Base query result; replace this array with the search result when the search is built
    barristerListing = [];
    listingLoading = true;

    // ---------- Barrister dropdown ----------
    barristerTerm = '';
    barristerOpen = false;
    barristerResults = [];
    barristerLoading = false;
    barristerError = false;
    barristersLoaded = false;
    barristerReq = 0;
    barristerTimer;

    // ---------- Area of practice dropdown ----------
    areaTerm = '';
    areaOpen = false;
    allAreas = []; // every record from the default query
    areaMatchIds = null; // null = not searching, otherwise Set of ids matched by the search query
    expandedIds = [];
    areaLoading = false;
    areaError = false;
    areasLoaded = false;
    areaReq = 0;
    areaTimer;

    connectedCallback() {
        this.loadListing();
    }

    async loadListing() {
        this.listingLoading = true;
        try {
            this.barristerListing = (await getBarristerListing()) || [];
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('glBarristerListing: unable to load barristers', e);
            this.barristerListing = [];
        } finally {
            this.listingLoading = false;
        }
    }

    handleViewProfile(event) {
        // Profile page was not specified yet: re-fire so it can be wired to NavigationMixin later
        // eslint-disable-next-line no-console
        console.log('View profile:', event.detail.id, event.detail.name);
    }

    // =====================================================================
    // Public API
    // =====================================================================

    /** Current filters in the saved JSON shape */
    @api
    get filters() {
        return this.buildFilterJson();
    }

    // =====================================================================
    // Barrister name
    // =====================================================================

    handleBarristerBoxClick() {
        this.focusInput('barrister');
    }

    handleBarristerFocus() {
        this.areaOpen = false;
        this.barristerOpen = true;
        if (!this.barristersLoaded) {
            this.loadBarristers(this.barristerTerm.trim());
        }
    }

    handleBarristerInput(event) {
        this.barristerTerm = event.target.value;
        this.barristerOpen = true;
        clearTimeout(this.barristerTimer);
        this.barristerTimer = setTimeout(() => {
            this.loadBarristers(this.barristerTerm.trim());
        }, DEBOUNCE_MS);
    }

    async loadBarristers(term) {
        const req = ++this.barristerReq;
        this.barristerLoading = true;
        this.barristerError = false;
        try {
            const data = await getBarristers({ searchTerm: term });
            if (req !== this.barristerReq) {
                return;
            }
            this.barristerResults = data || [];
            this.barristersLoaded = true;
        } catch (e) {
            if (req === this.barristerReq) {
                this.barristerResults = [];
                this.barristerError = true;
            }
        } finally {
            if (req === this.barristerReq) {
                this.barristerLoading = false;
            }
        }
    }

    handleBarristerToggle(event) {
        const { id, name } = event.target.dataset;
        const others = this.selectedBarristers.filter((b) => b.id !== id);
        this.selectedBarristers = event.target.checked ? [...others, { id, name }] : others;
    }

    handleRemoveBarrister(event) {
        const id = event.currentTarget.dataset.id;
        this.selectedBarristers = this.selectedBarristers.filter((b) => b.id !== id);
    }

    handleBarristerFocusOut(event) {
        const wrap = this.template.querySelector('[data-field="barrister"]');
        if (!wrap || !wrap.contains(event.relatedTarget)) {
            this.barristerOpen = false;
        }
    }

    handleBarristerKeyDown(event) {
        if (event.key === 'Escape') {
            this.barristerOpen = false;
        }
    }

    get barristerOptions() {
        const selected = new Set(this.selectedBarristers.map((b) => b.id));
        return this.barristerResults.map((b) => ({
            id: b.id,
            name: b.name,
            checked: selected.has(b.id)
        }));
    }

    get barristerChips() {
        return this.selectedBarristers.slice(0, MAX_CHIPS).map((b) => ({
            ...b,
            removeLabel: 'Remove ' + b.name
        }));
    }

    get barristerMore() {
        const extra = this.selectedBarristers.length - MAX_CHIPS;
        return extra > 0 ? '+' + extra + ' more' : '';
    }

    get barristerEmpty() {
        return !this.barristerLoading && !this.barristerError && this.barristerResults.length === 0;
    }

    get barristerExpanded() {
        return String(this.barristerOpen);
    }

    // =====================================================================
    // Area of practice
    // =====================================================================

    handleAreaBoxClick() {
        this.focusInput('area');
    }

    handleAreaFocus() {
        this.barristerOpen = false;
        this.areaOpen = true;
        if (!this.areasLoaded) {
            this.runAreaSearch(this.areaTerm.trim());
        }
    }

    handleAreaInput(event) {
        this.areaTerm = event.target.value;
        this.areaOpen = true;
        clearTimeout(this.areaTimer);
        this.areaTimer = setTimeout(() => {
            this.runAreaSearch(this.areaTerm.trim());
        }, DEBOUNCE_MS);
    }

    async ensureAreasLoaded() {
        if (this.areasLoaded) {
            return;
        }
        const data = await getAreasOfPractice({ searchTerm: '' }); // default query
        this.allAreas = data || [];
        this.areasLoaded = true;
    }

    async runAreaSearch(term) {
        const req = ++this.areaReq;
        this.areaLoading = true;
        this.areaError = false;
        try {
            await this.ensureAreasLoaded();
            if (req !== this.areaReq) {
                return;
            }
            if (!term) {
                this.areaMatchIds = null;
            } else {
                const matches = await getAreasOfPractice({ searchTerm: term }); // search query
                if (req !== this.areaReq) {
                    return;
                }
                this.areaMatchIds = new Set((matches || []).map((m) => m.id));
            }
        } catch (e) {
            if (req === this.areaReq) {
                this.areaError = true;
            }
        } finally {
            if (req === this.areaReq) {
                this.areaLoading = false;
            }
        }
    }

    handleAreaToggleExpand(event) {
        const id = event.currentTarget.dataset.id;
        this.expandedIds = this.expandedIds.includes(id)
            ? this.expandedIds.filter((x) => x !== id)
            : [...this.expandedIds, id];
    }

    // Main area checkbox: selects / clears ALL of its sub areas
    handleAreaMainToggle(event) {
        const node = this.buildFullTree().find((n) => n.id === event.target.dataset.id);
        if (!node) {
            return;
        }
        const nodeKeys = new Set(node.allKeys);
        const others = this.selectedKeys.filter((k) => !nodeKeys.has(k));
        this.selectedKeys = event.target.checked ? [...others, ...node.allKeys] : others;
    }

    // Sub area checkbox
    handleAreaSubToggle(event) {
        const key = event.target.dataset.key;
        const others = this.selectedKeys.filter((k) => k !== key);
        this.selectedKeys = event.target.checked ? [...others, key] : others;
    }

    handleRemoveArea(event) {
        const name = event.currentTarget.dataset.name;
        const keys = new Set(
            this.selectedAreaItems.filter((i) => i.name === name && i.key).map((i) => i.key)
        );
        this.selectedKeys = this.selectedKeys.filter((k) => !keys.has(k));
    }

    handleAreaFocusOut(event) {
        const wrap = this.template.querySelector('[data-field="area"]');
        if (!wrap || !wrap.contains(event.relatedTarget)) {
            this.areaOpen = false;
        }
    }

    handleAreaKeyDown(event) {
        if (event.key === 'Escape') {
            this.areaOpen = false;
        }
    }

    /**
     * Full tree of main areas (Main_Area__c = true) and their sub areas.
     * - A sub area is linked to its main area through Area_of_Practices__c
     *   (matches the main area's Id or, if the field holds text, its Name).
     * - Every main area also appears as a sub area of itself: if no sub area with the
     *   same name exists, a "self" row (key 'self:<mainId>', record = the main area) is added first.
     * - allKeys = every sub row key; the main checkbox selects / clears all of them.
     */
    buildFullTree() {
        const mains = this.allAreas.filter((a) => a.isMain);
        const mainById = new Map(mains.map((m) => [m.id, m]));
        const mainByName = new Map(mains.map((m) => [m.name, m]));
        const subsOf = new Map(mains.map((m) => [m.id, []]));
        const orphans = [];

        this.allAreas
            .filter((a) => !a.isMain)
            .forEach((a) => {
                const parent = mainById.get(a.parent) || mainByName.get(a.parent);
                if (parent) {
                    subsOf.get(parent.id).push({ id: a.id, name: a.name, key: a.id, isSelf: false });
                } else {
                    orphans.push(a); // sub area without a main area: show at top level
                }
            });

        const nodes = mains.map((m) => {
            const children = subsOf.get(m.id).sort((x, y) => x.name.localeCompare(y.name));
            const hasSameName = children.some((c) => c.name.toLowerCase() === m.name.toLowerCase());
            if (!hasSameName) {
                children.unshift({ id: m.id, name: m.name, key: 'self:' + m.id, isSelf: true });
            }
            return { id: m.id, name: m.name, children, allKeys: children.map((c) => c.key) };
        });

        orphans.forEach((o) => {
            nodes.push({ id: o.id, name: o.name, children: [], allKeys: [o.id] });
        });

        return nodes.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Tree filtered by the search query: matches only, auto-opened (see areaRows)
    buildVisibleTree() {
        const full = this.buildFullTree();
        if (!this.areaMatchIds) {
            return full;
        }
        const matched = this.areaMatchIds;
        return full
            .map((node) => {
                if (matched.has(node.id)) {
                    return node; // main area matched: show all of its sub areas
                }
                const kids = node.children.filter((c) => matched.has(c.id));
                return kids.length ? { ...node, children: kids } : null;
            })
            .filter(Boolean);
    }

    /**
     * Everything currently selected as [{ id, name, key }] in tree order.
     * A main area is included (last) when all of its sub areas are selected.
     */
    get selectedAreaItems() {
        const selected = new Set(this.selectedKeys);
        const items = [];
        this.buildFullTree().forEach((node) => {
            if (node.children.length === 0) {
                if (selected.has(node.id)) {
                    items.push({ id: node.id, name: node.name, key: node.id });
                }
                return;
            }
            node.children.forEach((c) => {
                if (selected.has(c.key)) {
                    items.push({ id: c.id, name: c.name, key: c.key });
                }
            });
            const allSelected = node.allKeys.every((k) => selected.has(k));
            if (allSelected && !selected.has('self:' + node.id)) {
                items.push({ id: node.id, name: node.name, key: null });
            }
        });
        return items;
    }

    // Distinct by name (a main area and a same-named sub area count once)
    get selectedAreas() {
        const byName = new Map();
        this.selectedAreaItems.forEach((i) => {
            if (!byName.has(i.name)) {
                byName.set(i.name, { name: i.name });
            }
        });
        return [...byName.values()];
    }

    get selectedAreaIds() {
        return [...new Set(this.selectedAreaItems.map((i) => i.id))];
    }

    get areaRows() {
        const selected = new Set(this.selectedKeys);
        const searching = this.areaMatchIds !== null;
        const rows = [];

        this.buildVisibleTree().forEach((node) => {
            const count = node.allKeys.filter((k) => selected.has(k)).length;
            const checked = count > 0 && count === node.allKeys.length;
            const partial = count > 0 && !checked;
            const hasChildren = node.children.length > 0;
            const expanded = hasChildren && (searching || this.expandedIds.includes(node.id));

            rows.push({
                rowKey: 'main:' + node.id,
                id: node.id,
                name: node.name,
                isMain: true,
                rowClass: 'area-row area-main',
                nameClass: 'main-name',
                markClass: partial ? 'mark is-partial' : 'mark',
                hasChildren,
                ariaExpanded: String(expanded),
                caretClass: expanded ? 'caret is-open' : 'caret',
                toggleLabel: (expanded ? 'Collapse ' : 'Expand ') + node.name,
                checked
            });

            if (expanded) {
                node.children.forEach((child) => {
                    rows.push({
                        rowKey: 'sub:' + node.id + ':' + child.key,
                        key: child.key,
                        name: child.name,
                        isMain: false,
                        rowClass: 'area-row area-sub',
                        nameClass: 'sub-name',
                        markClass: 'mark',
                        checked: selected.has(child.key)
                    });
                });
            }
        });
        return rows;
    }

    get areaChips() {
        return this.selectedAreas.map((a) => ({
            name: a.name,
            removeLabel: 'Remove ' + a.name
        }));
    }

    get areaEmpty() {
        return !this.areaLoading && !this.areaError && this.areaRows.length === 0;
    }

    get areaExpanded() {
        return String(this.areaOpen);
    }

    // =====================================================================
    // Picklists + keyword
    // =====================================================================

    get seniorityOptions() {
        return this.toOptions(SENIORITY, this.seniority);
    }
    get barristerTypeOptions() {
        return this.toOptions(BARRISTER_TYPES, this.barristerType);
    }
    get genderOptions() {
        return this.toOptions(GENDERS, this.gender);
    }
    get azOptions() {
        return this.toOptions(AZ, this.az);
    }

    toOptions(values, current) {
        return values.map((value) => ({
            key: value || 'blank',
            value,
            label: value,
            selected: value === current
        }));
    }

    handleSelectChange(event) {
        const field = event.target.dataset.field;
        if (SELECT_FIELDS.includes(field)) {
            this[field] = event.target.value;
        }
    }

    handleKeywordInput(event) {
        this.keyword = event.target.value;
    }

    handleKeywordKeyDown(event) {
        if (event.key === 'Enter') {
            this.handleSearch();
        }
    }

    // =====================================================================
    // Buttons
    // =====================================================================

    handleSearch() {
        const json = this.buildFilterJson();
        this.searchFilters = json; // saved JSON
        this.barristerOpen = false;
        this.areaOpen = false;

        // eslint-disable-next-line no-console
        console.log('glBarristerListing filters:', JSON.stringify(json));

        // Names are in the JSON (as specified); ids are provided alongside for the search logic
        this.dispatchEvent(
            new CustomEvent('barristersearch', {
                detail: {
                    filters: json,
                    barristerIds: this.selectedBarristers.map((b) => b.id),
                    areaOfPracticeIds: this.selectedAreaIds
                }
            })
        );
    }

    handleClear() {
        clearTimeout(this.barristerTimer);
        clearTimeout(this.areaTimer);
        this.barristerReq++;
        this.areaReq++;

        this.selectedBarristers = [];
        this.selectedKeys = [];
        this.seniority = NONE;
        this.barristerType = NONE;
        this.gender = '';
        this.az = NONE;
        this.keyword = '';
        this.barristerTerm = '';
        this.areaTerm = '';
        this.areaMatchIds = null;
        this.expandedIds = [];
        this.barristerOpen = false;
        this.areaOpen = false;
        this.barristerLoading = false;
        this.areaLoading = false;
        this.barristersLoaded = false; // reload the default list next time
        this.searchFilters = this.buildFilterJson();

        this.dispatchEvent(new CustomEvent('filterclear', { detail: { filters: this.searchFilters } }));
    }

    buildFilterJson() {
        return {
            barristename: this.selectedBarristers.map((b) => b.name),
            areaOfPractice: this.selectedAreas.map((a) => a.name),
            seniority: this.seniority,
            barristerType: this.barristerType,
            gender: this.gender,
            az: this.az,
            keyword: this.keyword
        };
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    // Keep focus on the text box when the dropdown is clicked (stops it closing)
    handlePanelMouseDown(event) {
        event.preventDefault();
    }

    focusInput(name) {
        const input = this.template.querySelector('[data-input="' + name + '"]');
        if (input) {
            input.focus();
        }
    }
}