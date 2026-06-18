import '@rcarls/rc-disclosure/define';

import { RCAccordion } from './index.js';

if (!customElements.get('rc-accordion')) {
  customElements.define('rc-accordion', RCAccordion);
}
