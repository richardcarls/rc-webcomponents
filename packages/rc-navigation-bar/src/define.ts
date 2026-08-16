import { RCNavigationBar } from './index.js';

customElements.get('rc-navigation-bar') ||
  customElements.define('rc-navigation-bar', RCNavigationBar);

export * from './index.js';
