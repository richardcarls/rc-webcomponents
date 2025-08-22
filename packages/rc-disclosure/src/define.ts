import { RCAccordion, RCDisclosure } from './index.js';

customElements.get('rc-disclosure') || customElements.define('rc-disclosure', RCDisclosure);
customElements.get('rc-accordion') || customElements.define('rc-accordion', RCAccordion);

export * from './index.js';
