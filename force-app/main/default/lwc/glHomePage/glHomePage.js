import { LightningElement } from 'lwc';

export default class GlHomePage extends LightningElement {
    eyebrow = 'The Victorian Bar';
    titleMain = 'Greens List Barristers';
    titleAccent = 'Leadership in the Profession';
    description =
        'Greens List is committed to working in partnership with its clients delivering the highest standard of advocacy and advisory work.';

    // Placeholders until the Ask Greens backend is built
    handleAsk(event) {
        // eslint-disable-next-line no-console
        console.log('Ask Greens question:', event.detail.question);
    }

    handleSuggestion(event) {
        // eslint-disable-next-line no-console
        console.log('Ask Greens suggestion:', event.detail.text);
    }
}