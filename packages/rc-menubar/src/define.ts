import '@rcarls/rc-menu-button/define';
import { RCMenubar } from './index.js';

customElements.get('rc-menubar') || customElements.define('rc-menubar', RCMenubar);

export * from './index.js';
