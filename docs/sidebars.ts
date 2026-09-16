import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Start here',
      collapsible: false,
      items: [
        'guide/installation',
        'guide/progressive-enhancement',
        'guide/compatibility',
        'guide/accessibility-testing',
        'guide/performance',
        'guide/react',
        'guide/styling',
        'guide/theme-previews',
      ],
    },
    {
      type: 'category',
      label: 'Elements',
      collapsible: false,
      items: [
        'components/rc-button',
        'components/rc-chip',
        'components/rc-fab',
        'components/rc-fab-menu',
        'components/rc-select',
        'components/rc-combobox',
        'components/rc-search-bar',
        'components/rc-field',
        'components/rc-switch',
        'components/rc-segmented-button',
        'components/rc-slider',
        'components/rc-progress',
        'components/rc-range-slider',
        'components/rc-textarea',
      ],
    },
    {
      type: 'category',
      label: 'Collections',
      collapsible: false,
      items: [
        'components/rc-accordion',
        'components/rc-card',
        'components/rc-list',
        'components/rc-listbox',
        'components/rc-menu',
        'components/rc-menubar',
        'components/rc-toolbar',
        'components/rc-adaptive-menu',
        'components/rc-chip-group',
        'components/rc-transfer-list',
      ],
    },
    {
      type: 'category',
      label: 'Views',
      collapsible: false,
      items: [
        'components/rc-app-bar',
        'components/rc-carousel',
        'components/rc-navigation-bar',
        'components/rc-navigation-rail',
        'components/rc-scroller',
        'components/rc-virtual-canvas',
      ],
    },
    {
      type: 'category',
      label: 'Modules',
      collapsible: false,
      items: [
        'components/rc-dialog',
        'components/rc-bottom-sheet',
        'components/rc-disclosure',
        'components/rc-markdown-editor',
        'components/rc-menu-button',
        'components/rc-snackbar',
        'components/rc-splitter',
      ],
    },
  ],
};

export default sidebars;
