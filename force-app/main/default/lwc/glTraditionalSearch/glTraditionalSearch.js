import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getPageReference } from 'c/siteUtility';

// pageKey -> page API name is resolved in siteUtility
// BARRISTERS = barristers__c, EXPERTISE = expertise__c, CPD_LIBRARY = CPD_Online_Library__c
const CARDS = [
    {
        id: 'card-1',
        pageKey: 'BARRISTERS',
        number: '01',
        label: 'Find counsel',
        title: 'Browse barristers',
        description: 'Search by name, seniority, location and experience.'
    },
    {
        id: 'card-2',
        pageKey: 'EXPERTISE',
        number: '02',
        label: 'Explore the list',
        title: 'Practice expertise',
        description: 'View counsel across every major area of law.'
    },
    {
        id: 'card-3',
        pageKey: 'CPD_LIBRARY',
        number: '03',
        label: 'Keep learning',
        title: 'CPD library',
        description: 'Watch practical sessions led by our barristers.'
    }
];

export default class GlTraditionalSearch extends NavigationMixin(LightningElement) {
    heading = 'Or explore the traditional way';
    urls = {}; // pageKey -> generated URL

    connectedCallback() {
        this.generateUrls();
    }

    // Real hrefs so right-click / open in new tab work
    async generateUrls() {
        const entries = await Promise.all(
            CARDS.map(async (card) => {
                try {
                    const url = await this[NavigationMixin.GenerateUrl](
                        getPageReference(card.pageKey)
                    );
                    return [card.pageKey, url];
                } catch (e) {
                    return [card.pageKey, '#'];
                }
            })
        );
        this.urls = Object.fromEntries(entries);
    }

    get cards() {
        return CARDS.map((card) => ({
            ...card,
            href: this.urls[card.pageKey] || '#'
        }));
    }

    handleCardClick(event) {
        event.preventDefault();
        const pageKey = event.currentTarget.dataset.key;
        this[NavigationMixin.Navigate](getPageReference(pageKey));
    }
}