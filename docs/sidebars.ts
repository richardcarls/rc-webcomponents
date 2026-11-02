import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guide: [
    {
      type: 'category',
      label: 'Get started',
      collapsed: false,
      link: {
        type: 'generated-index',
        slug: '/guide/get-started',
        description: 'Install the components and learn the rules every page follows.',
      },
      items: [
        'guide/installation',
        'guide/usage-rules',
        'guide/progressive-enhancement',
        'guide/compatibility',
      ],
    },
    {
      type: 'category',
      label: 'Frameworks',
      link: {
        type: 'generated-index',
        slug: '/guide/frameworks',
        description: 'Use the components from a framework, a server template, or server rendering.',
      },
      items: [
        'guide/react',
        'guide/angular',
        'guide/vue',
        'guide/svelte',
        'guide/blazor',
        'guide/server-templates',
        'guide/ssr',
      ],
    },
    {
      type: 'category',
      label: 'Styling & theming',
      link: {
        type: 'generated-index',
        slug: '/guide/styling-and-theming',
        description: 'Adapt the components to a design system with tokens, parts, and themes.',
      },
      items: ['guide/styling', 'guide/motion', 'guide/theme-previews'],
    },
    {
      type: 'category',
      label: 'Quality',
      link: {
        type: 'generated-index',
        slug: '/guide/quality',
        description: 'Accessibility testing, localization, and performance budgets.',
      },
      items: ['guide/accessibility-testing', 'guide/localization', 'guide/performance'],
    },
  ],
  components: [
    'components',
    {
      type: 'category',
      label: 'Elements',
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
        {
          type: 'category',
          label: 'rc-textarea',
          link: { type: 'doc', id: 'components/rc-textarea' },
          items: ['components/rc-textarea/plugins'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Collections',
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
      items: [
        'components/rc-app-bar',
        'components/rc-carousel',
        'components/rc-page-turner',
        'components/rc-breadcrumbs',
        'components/rc-data-table',
        'components/rc-pagination',
        'components/rc-navigation-bar',
        'components/rc-navigation-rail',
        'components/rc-scroller',
        'components/rc-virtual-scroller',
        'components/rc-virtual-canvas',
      ],
    },
    {
      type: 'category',
      label: 'Modules',
      items: [
        'components/rc-dialog',
        'components/rc-bottom-sheet',
        'components/rc-disclosure',
        'components/rc-markdown-editor',
        'components/rc-menu-button',
        'components/rc-tooltip',
        'components/rc-popover',
        'components/rc-snackbar',
        'components/rc-splitter',
      ],
    },
  ],
};

export default sidebars;
