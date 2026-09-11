import '@rcarls/rc-chip/define';
import { RCChipGroup } from './index.js';

customElements.get('rc-chip-group') || customElements.define('rc-chip-group', RCChipGroup);

export * from './index.js';
