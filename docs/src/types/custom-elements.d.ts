import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type RcElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  [attribute: string]: unknown;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'rc-accordion': RcElementProps;
      'rc-app-bar': RcElementProps;
      'rc-combobox': RcElementProps;
      'rc-dialog': RcElementProps;
      'rc-disclosure': RcElementProps;
      'rc-fab': RcElementProps;
      'rc-markdown-editor': RcElementProps;
      'rc-menu': RcElementProps;
      'rc-menu-button': RcElementProps;
      'rc-menubar': RcElementProps;
      'rc-range-slider': RcElementProps;
      'rc-search-bar': RcElementProps;
      'rc-select': RcElementProps;
      'rc-slider': RcElementProps;
      'rc-splitter': RcElementProps;
      'rc-textarea': RcElementProps;
      'rc-toolbar': RcElementProps;
      'rc-transfer-list': RcElementProps;
      'rc-virtual-canvas': RcElementProps;
    }
  }
}
