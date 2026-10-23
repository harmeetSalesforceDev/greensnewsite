import { LightningElement } from 'lwc';

/**
 * glAskGreens - UI only.
 * No backend yet. It only tracks the typed text and fires events
 * the parent (or a later backend layer) can listen to:
 *   - 'suggestionselect' { text }
 *   - 'ask'              { question }
 */
export default class GlAskGreens extends LightningElement {
    question = '';

    suggestions = [
        { id: 'sg1', text: 'Find planning barristers' },
        { id: 'sg2', text: 'Show junior criminal law barristers' },
        { id: 'sg3', text: 'Is Tiphanie Acreman an Accredited Mediator?' }
    ];

    handleInput(event) {
        this.question = event.target.value;
    }

    handleKeyDown(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleSubmit();
        }
    }

    handleSuggestion(event) {
        const text = event.currentTarget.dataset.text;
        this.dispatchEvent(
            new CustomEvent('suggestionselect', { detail: { text } })
        );
    }

    handleSubmit() {
        const question = this.question.trim();
        if (!question) {
            return;
        }
        this.dispatchEvent(new CustomEvent('ask', { detail: { question } }));
    }
}