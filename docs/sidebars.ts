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
        'components/rc-fab',
        'components/rc-select',
        'components/rc-combobox',
        'components/rc-search-bar',
        'components/rc-slider',
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
        'components/rc-menu',
        'components/rc-menubar',
        'components/rc-toolbar',
        'components/rc-transfer-list',
      ],
    },
    {
      type: 'category',
      label: 'Views',
      collapsible: false,
      items: [
        'components/rc-app-bar',
        'components/rc-virtual-canvas',
      ],
    },
    {
      type: 'category',
      label: 'Modules',
      collapsible: false,
      items: [
        'components/rc-dialog',
        'components/rc-disclosure',
        'components/rc-markdown-editor',
        'components/rc-menu-button',
        'components/rc-splitter',
      ],
    },
  ],
};

export default sidebars;
