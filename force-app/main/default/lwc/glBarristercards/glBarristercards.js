import { LightningElement, api } from 'lwc';

const SECTION_SILKS = 'SILKS / QC & SC';
const SECTION_SENIOR_JUNIOR = 'SENIOR / JUNIOR';
const STATIC_TITLE = 'Senior Counsel';

/**
 * Child of glBarristerListing. Receives Contact records from the parent:
 *   Id, Name, Barrister_Photo_Small__c, Bar_Role_Date__c, QC_Date__c
 * Order from the parent is kept inside each section.
 */
export default class GlBarristerCards extends LightningElement {
    @api loading = false;

    _barristers = [];

    @api
    get barristers() {
        return this._barristers;
    }
    set barristers(value) {
        this._barristers = Array.isArray(value) ? value : [];
    }

    silksTitle = SECTION_SILKS;
    seniorJuniorTitle = SECTION_SENIOR_JUNIOR;

    // ---------- Sections ----------
    get silks() {
        return this._barristers.filter((b) => !!b.QC_Date__c).map((b) => this.toCard(b));
    }

    get seniorJunior() {
        return this._barristers.filter((b) => !b.QC_Date__c).map((b) => this.toCard(b));
    }

    get hasSilks() {
        return this.silks.length > 0;
    }

    get hasSeniorJunior() {
        return this.seniorJunior.length > 0;
    }

    get showEmpty() {
        return !this.loading && this._barristers.length === 0;
    }

    // ---------- Card view model ----------
    toCard(contact) {
        const name = contact.Name || '';
        const years = this.yearsAtBar(contact.Bar_Role_Date__c);
        let eyebrow = STATIC_TITLE;
        if (years !== null) {
            eyebrow += ' \u00B7 ' + years + (years === 1 ? ' year' : ' years') + ' at bar';
        }
        return {
            id: contact.Id,
            name,
            eyebrow,
            photoUrl: this.extractImageUrl(contact.Barrister_Photo_Small__c),
            initials: this.getInitials(name),
            profileLabel: 'View profile of ' + name
        };
    }

    // Full years between Bar_Role_Date__c (YYYY-MM-DD) and today
    yearsAtBar(dateValue) {
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateValue || '');
        if (!match) {
            return null;
        }
        const now = new Date();
        const month = Number(match[2]);
        const day = Number(match[3]);
        let years = now.getFullYear() - Number(match[1]);
        const beforeAnniversary =
            now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day);
        if (beforeAnniversary) {
            years -= 1;
        }
        return years >= 0 ? years : null;
    }

    // Photo field can be a plain URL or a rich text field holding an <img> tag
    extractImageUrl(raw) {
        if (!raw) {
            return null;
        }
        if (raw.indexOf('<img') !== -1) {
            const match = raw.match(/src\s*=\s*["']([^"']+)["']/i);
            return match ? match[1].replace(/&amp;/g, '&') : null;
        }
        return raw.trim();
    }

    getInitials(name) {
        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
    }

    // ---------- Events ----------
    handleViewProfile(event) {
        const { id, name } = event.currentTarget.dataset;
        this.dispatchEvent(new CustomEvent('viewprofile', { detail: { id, name } }));
    }
}