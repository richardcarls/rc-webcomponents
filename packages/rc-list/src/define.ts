import { RCList, RCListItem } from './index.js';

customElements.get('rc-list-item') || customElements.define('rc-list-item', RCListItem);
customElements.get('rc-list') || customElements.define('rc-list', RCList);

export * from './index.js';
