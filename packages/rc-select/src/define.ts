import '@rcarls/rc-listbox/define';
import '@rcarls/rc-chip-group/define';
import { RCSelect } from './index.js';

customElements.get('rc-select') || customElements.define('rc-select', RCSelect);

export * from './index.js';
