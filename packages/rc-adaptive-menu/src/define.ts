import { RCAdaptiveMenu } from './rc-adaptive-menu';

if (!customElements.get('rc-adaptive-menu')) {
  customElements.define('rc-adaptive-menu', RCAdaptiveMenu);
}

export * from './index.js';
