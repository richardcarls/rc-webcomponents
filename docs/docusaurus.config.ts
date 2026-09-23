import type { Config } from '@docusaurus/types';
import type { Preset } from '@docusaurus/types';

// Set by the docs deploy workflow's next-docs build only; everything else
// (local dev, the stable build) falls through to the stable variant.
const variant = process.env.RC_DOCS_VARIANT === 'next' ? 'next' : 'stable';

const config: Config = {
  title: 'rc-webcomponents',
  tagline: 'Themeable web components for app interfaces',
  url: 'https://richardcarls.github.io',
  baseUrl: variant === 'next' ? '/rc-webcomponents/next/' : '/rc-webcomponents/',
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
          editUrl: 'https://github.com/richardcarls/rc-webcomponents/edit/develop/docs/',
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
        { label: 'Guide', to: '/guide/installation' },
        { label: 'Theme previews', to: '/guide/theme-previews' },
        { label: 'Components', to: '/components/rc-select' },
        variant === 'next'
          ? {
              href: 'https://richardcarls.github.io/rc-webcomponents/',
              label: 'Stable docs',
              position: 'right',
            }
          : {
              href: 'https://richardcarls.github.io/rc-webcomponents/next/',
              label: '@next preview',
              position: 'right',
            },
        {
          href: 'https://ko-fi.com/rcarls',
          label: 'Donate',
          position: 'right',
        },
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
    ...(variant === 'next' && {
      announcementBar: {
        id: 'next-docs',
        content:
          'Preview docs for the npm <code>@next</code> channel. Install with <code>npm install @rcarls/rc-webcomponents@next</code>. APIs may change; see the <a href="https://richardcarls.github.io/rc-webcomponents/">stable docs</a>.',
        backgroundColor: '#fef6e4',
        textColor: '#3a2e00',
        isCloseable: false,
      },
    }),
  },
};

export default config;
