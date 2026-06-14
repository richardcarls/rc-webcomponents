import '@rcarls/rc-menu/define';
import { RCMenuButton } from './index.js';

customElements.get('rc-menu-button') || customElements.define('rc-menu-button', RCMenuButton);

export * from './index.js';
