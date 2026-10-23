import { LightningElement, wire } from 'lwc';
import getClerksData from '@salesforce/apex/GlClerksController.getClerksData';

// Profile__c value that identifies directors, and the label the design shows for it
const DIRECTOR_PROFILE = 'Director | Barristers Clerk';
const DIRECTOR_LABEL = 'Director & Head Clerk';

export default class GlClerksBody extends LightningElement {
    directors = [];
    staff = [];
    isLoading = true;
    hasError = false;

    @wire(getClerksData)
    wiredData({ data, error }) {
        if (data) {
            console.log(JSON.stringify(data))
            // Order from the SOQL (Clerk_Order__c) is preserved
            this.directors = (data.directors || []).map((m) => this.toViewModel(m));
            this.staff = (data.staff || []).map((m) => this.toViewModel(m));
            this.hasError = false;
            this.isLoading = false;
        } else if (error) {
            // eslint-disable-next-line no-console
            console.error('glClerksBody: unable to load staff', error);
            this.hasError = true;
            this.isLoading = false;
        }
    }

    // ---------- View model ----------
    toViewModel(member) {
        const name = member.name || '';
        const firstName = name.trim().split(/\s+/)[0] || 'us';
        const photoUrl = this.extractImageUrl(member.photo);
        return {
            id: member.id,
            name,
            label:
                member.profile === DIRECTOR_PROFILE
                    ? DIRECTOR_LABEL
                    : member.profile || member.staffRole,
            phone: member.phone,
            phoneHref: member.phone ? 'tel:' + member.phone.replace(/[^\d+]/g, '') : null,
            email: member.email,
            emailHref: member.email ? 'mailto:' + member.email : null,
            photoUrl,
            initials: this.getInitials(name),
            contactLabel: 'Contact ' + firstName,
            contactHref: member.email ? 'mailto:' + member.email : null
        };
    }

    // Photo__c can be a plain URL or a rich text field holding an <img> tag
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

    // ---------- Template helpers ----------
    get hasDirectors() {
        return this.directors.length > 0;
    }

    get hasStaff() {
        return this.staff.length > 0;
    }

    get isEmpty() {
        return !this.isLoading && !this.hasError && !this.hasDirectors && !this.hasStaff;
    }

    // e.g. "Brett Bowker and Luke Hales lead Greens List's clerking team. ..."
    get directorsIntro() {
        const names = this.directors.map((d) => d.name);
        let list = names[0] || '';
        if (names.length === 2) {
            list = names.join(' and ');
        } else if (names.length > 2) {
            list = names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
        }
        const verb = names.length === 1 ? 'leads' : 'lead';
        return (
            list +
            ' ' +
            verb +
            ' Greens List\u2019s clerking team. Contact them for assistance with counsel selection, availability, fees and the management of briefs.'
        );
    }
}