import { RCAdaptiveMenu } from './rc-adaptive-menu.js';

if (!customElements.get('rc-adaptive-menu')) {
  customElements.define('rc-adaptive-menu', RCAdaptiveMenu);
}

export * from './index.js';
