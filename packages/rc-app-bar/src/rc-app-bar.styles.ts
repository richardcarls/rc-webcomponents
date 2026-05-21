import { css } from 'lit';

export const appBarStyles = css`
  :host {
    display: block;
    background: var(--rc-app-bar-bg, Canvas);
    color: var(--rc-app-bar-color, CanvasText);
  }

  #root {
    /* Transparent reserve keeps the bar height stable when the divider
       appears; in forced-colors mode it surfaces as a constant divider. */
    border-block-end: 1px solid transparent;
  }

  :host([data-scrolled]) #root {
    border-block-end: var(--rc-app-bar-divider-scrolled, 1px solid GrayText);
    box-shadow: var(--rc-app-bar-shadow-scrolled, none);
  }

  #title-row {
    display: flex;
    align-items: center;
    gap: var(--rc-app-bar-gap, 0.5em);
    block-size: var(--rc-app-bar-height, 64px);
    padding-inline: var(--rc-app-bar-padding-inline, 0.75em);
  }

  #leading,
  #trailing {
    flex: none;
    display: flex;
    align-items: center;
  }

  #leading.empty,
  #trailing.empty {
    display: none;
  }

  #title {
    flex: 1 1 auto;
    /* min-inline-size overrides the flex-item auto minimum so long titles
       shrink instead of pushing the trailing actions out of the bar. */
    min-inline-size: 0;
    overflow: clip;
    font-size: var(--rc-app-bar-title-font-size, 1.375rem);
    opacity: 1;
    transition: opacity var(--rc-app-bar-transition-duration, 200ms) ease;
  }

  #root[data-expanded-active] #title {
    opacity: 0;
    visibility: hidden;
  }

  #expanded {
    display: none;
  }

  :host([variant='medium']) #expanded {
    display: block;
    overflow: clip;
    block-size: 0;
    visibility: hidden;
    padding-inline: var(--rc-app-bar-padding-inline, 0.75em);
    font-size: var(--rc-app-bar-expanded-title-font-size, 1.5rem);
    transition:
      block-size var(--rc-app-bar-transition-duration, 200ms) ease,
      visibility 0s var(--rc-app-bar-transition-duration, 200ms);
  }

  #root[data-expanded-active] #expanded {
    block-size: var(--rc-app-bar-expanded-height, 48px);
    visibility: visible;
    transition:
      block-size var(--rc-app-bar-transition-duration, 200ms) ease,
      visibility 0s;
  }

  @media (prefers-reduced-motion: reduce) {
    #title,
    :host([variant='medium']) #expanded,
    #root[data-expanded-active] #expanded {
      transition-duration: 0s;
      transition-delay: 0s;
    }
  }
`;

export default appBarStyles;
