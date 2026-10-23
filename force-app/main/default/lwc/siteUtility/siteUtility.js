/**
 * siteUtility
 * Shared, non-visual helpers for the Greens List Experience Cloud site.
 * Import with:  import { getNavItems, getPageReference } from 'c/siteUtility';
 */

// Logo hosted as a static resource URL
export const LOGO_URL =
    'https://greenslistmedia.s3.ap-southeast-2.amazonaws.com/onboarding/logo+1.svg';

// Single source of truth: key -> page API name used by NavigationMixin
export const PAGE_API_NAMES = Object.freeze({
    HOME: 'Home',
    BARRISTERS: 'barristers__c',
    READERS: 'readers__c',
    CLERKS: 'clerks__c',
    MEDIATORS: 'mediators__c',
    EXPERTISE: 'expertise__c',
    SEMINARS: 'events__c',
    BLOGS: 'greens_blog__c',
    PODCAST: 'podcast__c',
    CPD_LIBRARY: 'CPD_Online_Library__c',
    GREEN_CLOUD: 'greencloud__c',
    APPLY: 'coming_to_the_bar__c',
    ABOUT: 'add_subscriber_mailing_list__c',
    CONTACT_US: 'contact_us__c'
});

// Header menu items, in display order (labels match the header design)
const NAV_ITEMS = [
    { key: 'HOME', label: 'Home' },
    { key: 'BARRISTERS', label: 'Barristers' },
    { key: 'READERS', label: 'Readers' },
    { key: 'CLERKS', label: 'Clerks' },
    { key: 'MEDIATORS', label: 'Mediators' },
    { key: 'EXPERTISE', label: 'Expertise' },
    { key: 'SEMINARS', label: 'Seminars' },
    { key: 'BLOGS', label: 'Blogs' },
    { key: 'PODCAST', label: 'Podcast' },
    { key: 'CPD_LIBRARY', label: 'CPD Library' },
    { key: 'GREEN_CLOUD', label: 'Green Cloud' },
    { key: 'APPLY', label: 'Apply' },
    { key: 'ABOUT', label: 'About' },
    { key: 'CONTACT_US', label: 'Contact Us' }
];

/** Returns the page API name for a key, e.g. getPageApiName('CLERKS') -> 'clerks__c' */
export function getPageApiName(key) {
    return PAGE_API_NAMES[key];
}

/** Returns a NavigationMixin page reference for a key. */
export function getPageReference(key) {
    return {
        type: 'comm__namedPage',
        attributes: { name: PAGE_API_NAMES[key] }
    };
}

/** Returns header menu items: [{ key, label, apiName, pageReference }] */
export function getNavItems() {
    return NAV_ITEMS.map((item) => ({
        ...item,
        apiName: PAGE_API_NAMES[item.key],
        pageReference: getPageReference(item.key)
    }));
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER_BRAND = 'Greens List Barristers';
export const FOOTER_ADDRESS = '205 William Street, Melbourne VIC 3000';

export const FOOTER_LINKS = [
    { key: 'HOME', label: 'About the List' },
    { key: 'CLERKS', label: 'Speak with our clerking team \u2192' }
];

/** Returns footer links: [{ key, label, apiName, pageReference }] */
export function getFooterLinks() {
    return FOOTER_LINKS.map((link) => ({
        ...link,
        apiName: PAGE_API_NAMES[link.key],
        pageReference: getPageReference(link.key)
    }));
}