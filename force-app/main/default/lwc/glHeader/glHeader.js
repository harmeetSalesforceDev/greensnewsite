import { LightningElement, wire } from 'lwc';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import isGuest from '@salesforce/user/isGuest';
import { LOGO_URL, getNavItems, getPageReference } from 'c/siteUtility';
import { loadStyle } from 'lightning/platformResourceLoader';
import glNewWebsiteDesign from '@salesforce/resourceUrl/glNewWebsiteDesign';
export default class GlHeader extends NavigationMixin(LightningElement) {
    cssLoaded = false;
    logoUrl = LOGO_URL;
    isGuestUser = isGuest;
    menuOpen = false;

    currentPageName;
    currentPath;
    urls = {}; // apiName -> generated URL (for right-click / open in new tab)

    @wire(CurrentPageReference)
    handlePageRef(pageRef) {
        this.currentPageName = pageRef?.attributes?.name;
        this.currentPath = this.normalizePath(window.location.pathname);
    }

    connectedCallback() {
        this.generateUrls();
    }

    // Pre-generate real hrefs so links behave like normal anchors
    async generateUrls() {
        const targets = [
            ...getNavItems().map((i) => ({ name: i.apiName, ref: i.pageReference }))
        ];
        const entries = await Promise.all(
            targets.map(async (t) => {
                try {
                    return [t.name, await this[NavigationMixin.GenerateUrl](t.ref)];
                } catch (e) {
                    return [t.name, '#'];
                }
            })
        );
        this.urls = Object.fromEntries(entries);
    }

    get navItems() {
        return getNavItems().map((item) => {
            const href = this.urls[item.apiName] || '#';
            const active = this.isActive(item.apiName, href);
            return {
                ...item,
                href,
                cssClass: active ? 'nav-link active' : 'nav-link',
                ariaCurrent: active ? 'page' : null
            };
        });
    }

    // Active when the page API name matches, or (fallback) the URL path matches
    isActive(apiName, href) {
        console.log('apiname ' + apiName    )
        console.log('currentPageName ' + this.currentPageName)
        if (
            this.currentPageName &&
            this.currentPageName.toLowerCase() === apiName.toLowerCase()
        ) {
            return true;
        }
        if (href && href !== '#' && this.currentPath) {
            const target = this.normalizePath(href);
            return (
                !!target &&
                (this.currentPath === target ||
                    this.currentPath.startsWith(target + '/'))
            );
        }
        return false;
    }

    normalizePath(url) {
        if (!url) return '';
        const path = url.split('?')[0].split('#')[0];
        return path.length > 1 ? path.replace(/\/+$/, '').toLowerCase() : path;
    }

    get homeHref() {
        return this.urls.Home || '#';
    }

    get menuClass() {
        return this.menuOpen ? 'nav is-open' : 'nav';
    }

    get menuButtonLabel() {
        return this.menuOpen ? 'Close menu' : 'Open menu';
    }

    // ---- Handlers ----
    handleHomeClick(event) {
        event.preventDefault();
        this.navigateTo(getPageReference('HOME'));
    }

    handleNavClick(event) {
        event.preventDefault();
        const apiName = event.currentTarget.dataset.api;
        this.navigateTo({
            type: 'comm__namedPage',
            attributes: { name: apiName }
        });
    }

    handleLogin() {
        this.navigateTo({
            type: 'comm__loginPage',
            attributes: { actionName: 'login' }
        });
    }

    handleSignup() {
        this.navigateTo({
            type: 'comm__loginPage',
            attributes: { actionName: 'register' }
        });
    }

    handleSearch() {
        // No search page was specified: parent pages/flows can listen for this
        this.dispatchEvent(new CustomEvent('searchclick'));
    }

    toggleMenu() {
        this.menuOpen = !this.menuOpen;
    }

    navigateTo(pageReference) {
        this.menuOpen = false;
        this[NavigationMixin.Navigate](pageReference);
    }

     renderedCallback() {
        if (this.cssLoaded) {
            return;
        }

        this.cssLoaded = true;

        loadStyle(this, glNewWebsiteDesign)
            .then(() => {
                console.log('Static resource CSS loaded');
            })
            .catch(error => {
                console.error('Error loading CSS:', error);
            });
    }
}