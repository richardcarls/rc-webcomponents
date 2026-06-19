import type { Config } from '@docusaurus/types';
import type { Preset } from '@docusaurus/types';

const config: Config = {
  title: 'rc-webcomponents',
  tagline: 'WAI-ARIA compliant headless web components built with Lit',
  url: 'https://richardcarls.github.io',
  baseUrl: '/rc-webcomponents/',
  organizationName: 'richardcarls',
  projectName: 'rc-webcomponents',
  trailingSlash: false,
  onBrokenLinks: 'warn',
  markdown: {
    mermaid: false,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  clientModules: ['./src/client/rc-elements.ts'],
  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/richardcarls/rc-webcomponents/edit/develop/docs-docusaurus/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ] satisfies Preset.Options,
  ],
  themeConfig: {
    navbar: {
      title: 'rc-webcomponents',
      items: [
        { label: 'Guide', to: '/guide/progressive-enhancement' },
        { label: 'Theme previews', to: '/guide/theme-previews' },
        { label: 'Components', to: '/components/rc-select' },
        {
          href: 'https://github.com/richardcarls/rc-webcomponents',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
    },
    prism: {
      additionalLanguages: ['bash'],
    },
  },
};

export default config;
