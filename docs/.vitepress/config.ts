export default {
  title: 'rc-webcomponents',
  description: 'WAI-ARIA compliant headless web components built with Lit',
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith('rc-'),
      },
    },
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Components', link: '/components/rc-select' },
    ],
    sidebar: [
      {
        text: 'Form & Selection',
        items: [
          { text: 'rc-select', link: '/components/rc-select' },
          { text: 'rc-combobox', link: '/components/rc-combobox' },
          { text: 'rc-slider', link: '/components/rc-slider' },
          { text: 'rc-range-slider', link: '/components/rc-range-slider' },
          { text: 'rc-textarea', link: '/components/rc-textarea' },
          { text: 'rc-transfer-list', link: '/components/rc-transfer-list' },
        ],
      },
      {
        text: 'Navigation & Menu',
        items: [
          { text: 'rc-menu', link: '/components/rc-menu' },
          { text: 'rc-menu-button', link: '/components/rc-menu-button' },
          { text: 'rc-menubar', link: '/components/rc-menubar' },
          { text: 'rc-toolbar', link: '/components/rc-toolbar' },
        ],
      },
      {
        text: 'Layout & Structure',
        items: [
          { text: 'rc-splitter', link: '/components/rc-splitter' },
          { text: 'rc-dialog', link: '/components/rc-dialog' },
          { text: 'rc-disclosure', link: '/components/rc-disclosure' },
          { text: 'rc-accordion', link: '/components/rc-accordion' },
          { text: 'rc-virtual-canvas', link: '/components/rc-virtual-canvas' },
        ],
      },
      {
        text: 'Editors',
        items: [
          { text: 'rc-markdown-editor', link: '/components/rc-markdown-editor' },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/richardcarls/rc-webcomponents' },
    ],
  },
};
