import { RCVirtualScroller } from './index.js';

customElements.get('rc-virtual-scroller') ||
  customElements.define('rc-virtual-scroller', RCVirtualScroller);

export * from './index.js';
