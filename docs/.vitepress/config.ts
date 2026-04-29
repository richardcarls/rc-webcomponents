export default {
  title: 'rc-webcomponents',
  titleTemplate: ':title | rc-webcomponents',
  description: 'WAI-ARIA compliant headless web components built with Lit',
  lastUpdated: true,
  cleanUrls: true,
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => tag.startsWith('rc-') || tag === 'theme-preview',
      },
    },
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/progressive-enhancement' },
      { text: 'Theme previews', link: '/guide/theme-previews' },
      { text: 'Components', link: '/components/rc-select' },
    ],
    outline: {
      level: [2, 3],
      label: 'On this page',
    },
    editLink: {
      pattern: 'https://github.com/richardcarls/rc-webcomponents/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    lastUpdated: {
      text: 'Updated',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short',
      },
    },
    sidebar: [
      {
        text: 'Start here',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Progressive enhancement', link: '/guide/progressive-enhancement' },
          { text: 'Theme previews', link: '/guide/theme-previews' },
        ],
      },
      {
        text: 'Choose and edit values',
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
        text: 'Build command surfaces',
        items: [
          { text: 'rc-menu', link: '/components/rc-menu' },
          { text: 'rc-menu-button', link: '/components/rc-menu-button' },
          { text: 'rc-menubar', link: '/components/rc-menubar' },
          { text: 'rc-toolbar', link: '/components/rc-toolbar' },
        ],
      },
      {
        text: 'Structure content',
        items: [
          { text: 'rc-splitter', link: '/components/rc-splitter' },
          { text: 'rc-dialog', link: '/components/rc-dialog' },
          { text: 'rc-disclosure', link: '/components/rc-disclosure' },
          { text: 'rc-accordion', link: '/components/rc-accordion' },
          { text: 'rc-virtual-canvas', link: '/components/rc-virtual-canvas' },
        ],
      },
      {
        text: 'Edit rich text',
        items: [
          { text: 'rc-markdown-editor', link: '/components/rc-markdown-editor' },
        ],
      },
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Search components',
            buttonAriaLabel: 'Search component documentation',
          },
          modal: {
            displayDetails: 'Display detailed list',
            resetButtonTitle: 'Reset search',
            backButtonTitle: 'Close search',
            noResultsText: 'No component docs found for',
            footer: {
              selectText: 'to select',
              selectKeyAriaLabel: 'enter',
              navigateText: 'to navigate',
              navigateUpKeyAriaLabel: 'up arrow',
              navigateDownKeyAriaLabel: 'down arrow',
              closeText: 'to close',
              closeKeyAriaLabel: 'escape',
            },
          },
        },
      },
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/richardcarls/rc-webcomponents' },
    ],
  },
};
