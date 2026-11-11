/**
 * The shared RC token contract: every `--rc-*` semantic token, its default,
 * and the CSS grammar it accepts. This file is the single owner of shared
 * token defaults. `scripts/generate-token-contract.mjs` writes `base.css`,
 * the component fallbacks in `@rcarls/rc-common` (`rcToken()`), and the
 * styling guide's token table from it.
 *
 * - `default` is CSS text. It may reference other shared tokens with
 *   `var(--rc-*)`; such a derived token is not declared in `base.css`, so it
 *   resolves where a component reads it and follows a scoped override of the
 *   token it references. `null` leaves the token unset (guaranteed-invalid),
 *   so a component reading it falls back to inherited or native styling.
 * - `syntax` is a CSS Properties and Values API syntax string describing the
 *   accepted values, written by hand. `*` means the grammar cannot be
 *   expressed (shorthands, font lists, easing functions). The tokens are not
 *   registered; the syntax is metadata for documentation and editors.
 * - `conditional` declares an override inside `@supports` in `base.css`.
 *   Component fallbacks always use `default`.
 */

const COLOR = '<color>';
const LENGTH = '<length-percentage>';
const TIME = '<time>';
const ANY = '*';
const FONT_SIZE =
  '<length-percentage> | xx-small | x-small | small | medium | large | x-large | xx-large | xxx-large | smaller | larger';
const FONT_WEIGHT = '<number> | normal | bold | bolder | lighter';
const LINE_HEIGHT = '<number> | <length-percentage> | normal';

/** Table rows in the styling guide, in order. */
export const groups = [
  { id: 'surfaces', title: 'Surfaces' },
  { id: 'text', title: 'Text' },
  { id: 'accent', title: 'Accent and selection' },
  { id: 'border', title: 'Border and elevation' },
  { id: 'type', title: 'Type' },
  { id: 'controls', title: 'Controls' },
  { id: 'items', title: 'Items' },
  {
    id: 'item-type',
    title: 'Item type',
    note: 'Menu, listbox, and adaptive-menu items follow the shared type tokens unless a theme sets an item type scale.',
  },
  { id: 'shape', title: 'Shape' },
  {
    id: 'popups',
    title: 'Popups',
    note: 'Menus, adaptive-menu popups, popovers, and select and combobox listboxes read these before their own fallbacks.',
  },
  { id: 'focus', title: 'Focus and disabled' },
  { id: 'effects-motion', title: 'Effects motion' },
  { id: 'spatial-motion', title: 'Spatial motion' },
  {
    id: 'directional-easing',
    title: 'Directional easing',
    note: 'No matching enter/exit duration tokens; pair `-easing-exit` with `-duration-fast`.',
  },
  { id: 'compatibility-motion', title: 'Compatibility motion' },
];

/** @type {Record<`--rc-${string}`, { group: string, default: string | null, syntax: string, description: string, conditional?: { supports: string, value: string }[] }>} */
export const tokens = {
  '--rc-surface': {
    group: 'surfaces',
    default: 'Canvas',
    syntax: COLOR,
    description: 'Background of component surfaces and popups.',
  },
  '--rc-field': {
    group: 'surfaces',
    default: 'Field',
    syntax: COLOR,
    description: 'Background of text fields and other editable controls.',
  },
  '--rc-button-bg': {
    group: 'surfaces',
    default: 'ButtonFace',
    syntax: COLOR,
    description: 'Background of button-like controls.',
  },
  '--rc-field-text': {
    group: 'text',
    default: 'FieldText',
    syntax: COLOR,
    description: 'Text color on fields and component surfaces.',
  },
  '--rc-button-text': {
    group: 'text',
    default: 'ButtonText',
    syntax: COLOR,
    description: 'Text color of button-like controls.',
  },
  '--rc-highlight-text': {
    group: 'text',
    default: 'HighlightText',
    syntax: COLOR,
    description: 'Text color on selected items.',
  },
  '--rc-text-disabled': {
    group: 'text',
    default: 'GrayText',
    syntax: COLOR,
    description: 'Text color of disabled content.',
  },
  '--rc-accent': {
    group: 'accent',
    default: 'Highlight',
    syntax: COLOR,
    description: 'Primary action and checked-state color.',
    conditional: [{ supports: '(color: AccentColor)', value: 'AccentColor' }],
  },
  '--rc-highlight': {
    group: 'accent',
    default: 'Highlight',
    syntax: COLOR,
    description: 'Background of selected items.',
  },
  '--rc-border-color': {
    group: 'border',
    default: 'ButtonBorder',
    syntax: COLOR,
    description: 'Color of component borders.',
  },
  '--rc-border-width': {
    group: 'border',
    default: '1px',
    syntax: '<length> | thin | medium | thick',
    description: 'Width of component borders.',
  },
  '--rc-border-style': {
    group: 'border',
    default: 'solid',
    syntax: 'none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset',
    description: 'Style of component borders.',
  },
  '--rc-border': {
    group: 'border',
    default: 'var(--rc-border-width) var(--rc-border-style) var(--rc-border-color)',
    syntax: ANY,
    description: 'Border shorthand composed from the border width, style, and color tokens.',
  },
  '--rc-shadow': {
    group: 'border',
    default: '0 2px 8px color-mix(in srgb, CanvasText 15%, transparent)',
    syntax: ANY,
    description: 'Box shadow of floating surfaces.',
  },
  '--rc-font-family': {
    group: 'type',
    default: null,
    syntax: ANY,
    description: 'Component font family. Unset, so components inherit the page font.',
  },
  '--rc-font-size': {
    group: 'type',
    default: '1em',
    syntax: FONT_SIZE,
    description: 'Component font size.',
  },
  '--rc-font-weight': {
    group: 'type',
    default: '400',
    syntax: FONT_WEIGHT,
    description: 'Component font weight.',
  },
  '--rc-line-height': {
    group: 'type',
    default: 'normal',
    syntax: LINE_HEIGHT,
    description: 'Component line height.',
  },
  '--rc-control-block-size': {
    group: 'controls',
    default: '2.25em',
    syntax: LENGTH,
    description: 'Minimum block size of buttons, fields, and other controls.',
  },
  '--rc-control-padding-block': {
    group: 'controls',
    default: '0.25em',
    syntax: LENGTH,
    description: 'Block-axis padding inside controls.',
  },
  '--rc-control-padding-inline': {
    group: 'controls',
    default: '0.5em',
    syntax: LENGTH,
    description: 'Inline-axis padding inside controls.',
  },
  '--rc-control-gap': {
    group: 'controls',
    default: '0.25em',
    syntax: LENGTH,
    description: 'Gap between a control and its parts or neighbors.',
  },
  '--rc-item-padding-block': {
    group: 'items',
    default: '0.3em',
    syntax: LENGTH,
    description: 'Block-axis padding of menu, listbox, and adaptive-menu items.',
  },
  '--rc-item-padding-inline': {
    group: 'items',
    default: '0.75em',
    syntax: LENGTH,
    description: 'Inline-axis padding of menu, listbox, and adaptive-menu items.',
  },
  '--rc-item-gap': {
    group: 'items',
    default: '0.4em',
    syntax: LENGTH,
    description: 'Gap between an item icon, label, and trailing content.',
  },
  '--rc-item-font-family': {
    group: 'item-type',
    default: 'var(--rc-font-family)',
    syntax: ANY,
    description: 'Item font family.',
  },
  '--rc-item-font-size': {
    group: 'item-type',
    default: 'var(--rc-font-size)',
    syntax: FONT_SIZE,
    description: 'Item font size.',
  },
  '--rc-item-font-weight': {
    group: 'item-type',
    default: null,
    syntax: FONT_WEIGHT,
    description: 'Item font weight.',
  },
  '--rc-item-line-height': {
    group: 'item-type',
    default: 'var(--rc-line-height)',
    syntax: LINE_HEIGHT,
    description: 'Item line height.',
  },
  '--rc-item-letter-spacing': {
    group: 'item-type',
    default: null,
    syntax: '<length> | normal',
    description: 'Item letter spacing.',
  },
  '--rc-item-icon-size': {
    group: 'item-type',
    default: null,
    syntax: FONT_SIZE,
    description: 'Font size of item icons.',
  },
  '--rc-radius-sm': {
    group: 'shape',
    default: '0.125em',
    syntax: LENGTH,
    description: 'Small corner radius.',
  },
  '--rc-radius-md': {
    group: 'shape',
    default: '0.25em',
    syntax: LENGTH,
    description: 'Medium corner radius.',
  },
  '--rc-control-radius': {
    group: 'shape',
    default: 'var(--rc-radius-sm)',
    syntax: LENGTH,
    description: 'Corner radius of controls.',
  },
  '--rc-popup-background': {
    group: 'popups',
    default: 'var(--rc-surface)',
    syntax: COLOR,
    description: 'Background of floating surfaces.',
  },
  '--rc-popup-color': {
    group: 'popups',
    default: 'var(--rc-field-text)',
    syntax: COLOR,
    description: 'Text color of floating surfaces.',
  },
  '--rc-popup-border': {
    group: 'popups',
    default: 'var(--rc-border)',
    syntax: ANY,
    description: 'Border of floating surfaces.',
  },
  '--rc-popup-radius': {
    group: 'popups',
    default: 'var(--rc-radius-sm)',
    syntax: LENGTH,
    description: 'Corner radius of floating surfaces.',
  },
  '--rc-popup-shadow': {
    group: 'popups',
    default: 'var(--rc-shadow)',
    syntax: ANY,
    description: 'Box shadow of floating surfaces.',
  },
  '--rc-popup-padding-block': {
    group: 'popups',
    default: 'var(--rc-control-padding-block)',
    syntax: LENGTH,
    description: 'Block-axis padding inside floating surfaces.',
  },
  '--rc-focus-ring': {
    group: 'focus',
    default: 'auto',
    syntax: ANY,
    description: 'Outline shorthand for focus indicators. `auto` uses the platform focus ring.',
  },
  '--rc-focus-ring-offset': {
    group: 'focus',
    default: '0',
    syntax: '<length>',
    description: 'Offset of focus indicators.',
  },
  '--rc-disabled-opacity': {
    group: 'focus',
    default: '0.5',
    syntax: '<number> | <percentage>',
    description: 'Opacity of disabled controls.',
  },
  '--rc-motion-effects-duration-fast': {
    group: 'effects-motion',
    default: '80ms',
    syntax: TIME,
    description: 'Short duration for color and opacity changes.',
  },
  '--rc-motion-effects-duration-default': {
    group: 'effects-motion',
    default: '120ms',
    syntax: TIME,
    description: 'Default duration for color and opacity changes.',
  },
  '--rc-motion-effects-duration-slow': {
    group: 'effects-motion',
    default: '200ms',
    syntax: TIME,
    description: 'Long duration for color and opacity changes, such as dialog fades.',
  },
  '--rc-motion-effects-easing-fast': {
    group: 'effects-motion',
    default: 'ease-out',
    syntax: ANY,
    description: 'Easing paired with the fast effects duration.',
  },
  '--rc-motion-effects-easing-default': {
    group: 'effects-motion',
    default: 'ease-out',
    syntax: ANY,
    description: 'Easing paired with the default effects duration.',
  },
  '--rc-motion-effects-easing-slow': {
    group: 'effects-motion',
    default: 'ease-out',
    syntax: ANY,
    description: 'Easing paired with the slow effects duration.',
  },
  '--rc-motion-spatial-duration-fast': {
    group: 'spatial-motion',
    default: '180ms',
    syntax: TIME,
    description: 'Short duration for movement and size changes.',
  },
  '--rc-motion-spatial-duration-default': {
    group: 'spatial-motion',
    default: '300ms',
    syntax: TIME,
    description: 'Default duration for movement and size changes.',
  },
  '--rc-motion-spatial-duration-slow': {
    group: 'spatial-motion',
    default: '450ms',
    syntax: TIME,
    description: 'Long duration for movement and size changes.',
  },
  '--rc-motion-spatial-easing-fast': {
    group: 'spatial-motion',
    default: 'cubic-bezier(0.2, 0, 0, 1)',
    syntax: ANY,
    description: 'Easing paired with the fast spatial duration.',
  },
  '--rc-motion-spatial-easing-default': {
    group: 'spatial-motion',
    default: 'cubic-bezier(0.2, 0, 0, 1)',
    syntax: ANY,
    description: 'Easing paired with the default spatial duration.',
  },
  '--rc-motion-spatial-easing-slow': {
    group: 'spatial-motion',
    default: 'cubic-bezier(0.2, 0, 0, 1)',
    syntax: ANY,
    description: 'Easing paired with the slow spatial duration.',
  },
  '--rc-motion-spatial-easing-enter': {
    group: 'directional-easing',
    default: 'cubic-bezier(0, 0, 0, 1)',
    syntax: ANY,
    description: 'Decelerating easing for elements moving into place.',
  },
  '--rc-motion-spatial-easing-exit': {
    group: 'directional-easing',
    default: 'cubic-bezier(0.3, 0, 1, 1)',
    syntax: ANY,
    description: 'Accelerating easing for elements moving out.',
  },
  '--rc-motion-effects-easing-enter': {
    group: 'directional-easing',
    default: 'ease-out',
    syntax: ANY,
    description: 'Easing for content fading in.',
  },
  '--rc-motion-effects-easing-exit': {
    group: 'directional-easing',
    default: 'ease-in',
    syntax: ANY,
    description: 'Easing for content fading out.',
  },
  '--rc-motion-duration': {
    group: 'compatibility-motion',
    default: 'var(--rc-motion-effects-duration-default)',
    syntax: TIME,
    description:
      'Single motion duration kept for themes written before the effects and spatial bands.',
  },
};
