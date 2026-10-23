import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { FOOTER_BRAND, FOOTER_ADDRESS, getFooterLinks } from 'c/siteUtility';

export default class GlFooter extends NavigationMixin(LightningElement) {
    brand = FOOTER_BRAND;
    address = FOOTER_ADDRESS;
    urls = {}; // apiName -> generated URL

    connectedCallback() {
        this.generateUrls();
    }

    // Real hrefs so right-click / open in new tab work
    async generateUrls() {
        const entries = await Promise.all(
            getFooterLinks().map(async (link) => {
                try {
                    return [link.apiName, await this[NavigationMixin.GenerateUrl](link.pageReference)];
                } catch (e) {
                    return [link.apiName, '#'];
                }
            })
        );
        this.urls = Object.fromEntries(entries);
    }

    get links() {
        return getFooterLinks().map((link) => ({
            ...link,
            href: this.urls[link.apiName] || '#'
        }));
    }

    handleLinkClick(event) {
        event.preventDefault();
        const key = event.currentTarget.dataset.key;
        const link = getFooterLinks().find((l) => l.key === key);
        if (link) {
            this[NavigationMixin.Navigate](link.pageReference);
        }
    }
}