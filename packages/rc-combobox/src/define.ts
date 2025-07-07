import '@rcarls/rc-listbox/define';
import { RCCombobox } from './index.js';

customElements.get('rc-combobox') || customElements.define('rc-combobox', RCCombobox);

export * from './index.js';
