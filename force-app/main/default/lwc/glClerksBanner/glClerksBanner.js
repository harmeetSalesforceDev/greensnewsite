import { LightningElement, api } from 'lwc';

export default class GlClerksBanner extends LightningElement {
    // Editable in Experience Builder (defaults match the design)
    @api eyebrow = 'Clerks & Staff';
    @api headingMain = 'Experience at your service.';
    @api headingAccent = 'People who know the List.';
    @api description =
        'Our clerks and staff work closely with solicitors, barristers and clients to make finding and briefing the right counsel straightforward.';
}