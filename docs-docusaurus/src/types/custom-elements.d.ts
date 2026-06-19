import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'rc-accordion': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        multiple?: boolean | string;
        name?: string;
      };
      'rc-disclosure': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
      'rc-select': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        display?: 'chips' | 'compact';
        placeholder?: string;
      };
    }
  }
}
