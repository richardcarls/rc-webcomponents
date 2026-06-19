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
      ],
    },
    {
      type: 'category',
      label: 'Structure content',
      items: [
        'components/rc-accordion',
      ],
    },
  ],
};

export default sidebars;
