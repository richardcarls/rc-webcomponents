import { RCDisclosure } from './index.js';

if (!customElements.get('rc-disclosure')) {
  customElements.define('rc-disclosure', RCDisclosure);
}

export * from './index.js';
