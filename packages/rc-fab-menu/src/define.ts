import '@rcarls/rc-menu/define';
import { RCFabMenu } from './index.js';

customElements.get('rc-fab-menu') || customElements.define('rc-fab-menu', RCFabMenu);

export * from './index.js';
