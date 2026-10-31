import { RCDataTable } from './index.js';

if (!customElements.get('rc-data-table')) {
  customElements.define('rc-data-table', RCDataTable);
}

export * from './index.js';
