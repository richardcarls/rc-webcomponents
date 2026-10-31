import { RCBreadcrumbs } from './index.js';

if (!customElements.get('rc-breadcrumbs')) {
  customElements.define('rc-breadcrumbs', RCBreadcrumbs);
}

export * from './index.js';
