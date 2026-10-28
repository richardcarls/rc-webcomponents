import { RCPageTurner, RCPageTurnerPage } from './index.js';

customElements.get('rc-page-turner-page') ||
  customElements.define('rc-page-turner-page', RCPageTurnerPage);

customElements.get('rc-page-turner') || customElements.define('rc-page-turner', RCPageTurner);

export * from './index.js';
