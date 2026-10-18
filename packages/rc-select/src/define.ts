import '@rcarls/rc-listbox/define';
import { RCSelect } from './index.js';

customElements.get('rc-select') || customElements.define('rc-select', RCSelect);

export * from './index.js';
