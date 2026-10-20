import { LightningElement, api } from 'lwc';

export default class GlBarristerBanner extends LightningElement {
    // Editable in Experience Builder (defaults match the design)
    @api eyebrow = 'Our Barristers';
    @api headingMain = 'Exceptional advocates.';
    @api headingAccent = 'Distinct expertise.';
    @api description =
        'Search the List by name or expertise, or ask our clerking team to help match the right counsel to your matter.';
}