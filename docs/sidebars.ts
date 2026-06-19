import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: 'Start here',
      items: [
        'guide/progressive-enhancement',
        'guide/theme-previews',
      ],
    },
    {
      type: 'category',
      label: 'Choose and edit values',
      items: [
        'components/rc-select',
        'components/rc-combobox',
        'components/rc-search-bar',
        'components/rc-slider',
        'components/rc-range-slider',
        'components/rc-textarea',
        'components/rc-transfer-list',
      ],
    },
    {
      type: 'category',
      label: 'Build command surfaces',
      items: [
        'components/rc-app-bar',
        'components/rc-fab',
        'components/rc-menu',
        'components/rc-menu-button',
        'components/rc-menubar',
        'components/rc-toolbar',
      ],
    },
    {
      type: 'category',
      label: 'Structure content',
      items: [
        'components/rc-splitter',
        'components/rc-dialog',
        'components/rc-disclosure',
        'components/rc-accordion',
        'components/rc-virtual-canvas',
      ],
    },
    {
      type: 'category',
      label: 'Edit rich text',
      items: [
        'components/rc-markdown-editor',
      ],
    },
  ],
};

export default sidebars;
