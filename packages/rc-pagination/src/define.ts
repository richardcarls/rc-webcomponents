import { RCPagination } from './index.js';

if (!customElements.get('rc-pagination')) {
  customElements.define('rc-pagination', RCPagination);
}

export * from './index.js';
