/**
 * SolidJS JSX type augmentation for rc-webcomponents.
 *
 * Import this file once in your SolidJS project (e.g. in vite.config.ts or
 * a global types file):
 *
 *   /// <reference types="@rcarls/rc-webcomponents/solid" />
 *
 * Ref types use HTMLElement intersections — not LitElement — so TypeScript
 * resolves correctly without requiring `lit` in your tsconfig paths.
 *
 * Boolean attributes are typed as `boolean | string` because SolidJS passes
 * `""` (empty string) for a boolean `true`.
 */

import type { RCTextareaPlugin } from '@rcarls/rc-textarea';

/** Public API surface of `<rc-disclosure>`. */
export type RCDisclosureRef = HTMLElement & {
  open: boolean;
  fragment: boolean;
};

export type RCDisclosureToggleDetail = {
  open: boolean;
};

/** Public API surface of `<rc-accordion>`. */
export type RCAccordionRef = HTMLElement & {
  multiple: boolean;
};

/** Public API surface of `<rc-listbox>`. */
export type RCListboxRef = HTMLElement & {
  multiple: boolean;
  checkmark: boolean;
  filterStrategy: 'prefix' | 'contains' | ((label: string, query: string) => boolean);
  value: RCSelectValue;
  defaultValue: RCSelectValue | undefined;
  options: RCListboxOption[];
  readonly allOptions: ReadonlyArray<RCListboxOption>;
  readonly filteredOptions: ReadonlyArray<RCListboxOption>;
  readonly selectedValues: string[];
  readonly navigableItems: Element[];
  toggleOption(value: string): void;
  clearSelection(): void;
  filterOptions(text: string): void;
  clearFilter(): void;
  setCreateOption(label: string | null): void;
};

/** Public API surface of `<rc-select>`. */
export type RCSelectOption = {
  kind?: 'option';
  value: string;
  label: string;
  disabled?: boolean;
  data?: unknown;
};

export type RCListboxActionOption<Action extends string = string> = {
  kind: 'action';
  action: Action;
  value: string;
  label: string;
  disabled?: boolean;
  data?: unknown;
};

export type RCListboxOption = RCSelectOption | RCListboxActionOption;

export type RCSelectValue = string | string[];

export type RCSelectChangeDetail = {
  value: RCSelectValue;
  selectedValues: string[];
  selectedOptions: RCSelectOption[];
};

export type RCListboxSelectChangeDetail = RCSelectChangeDetail & {
  reason: 'select';
  selected: boolean;
  optionValue: string;
  option: RCSelectOption;
};

export type RCListboxActionChangeDetail<Action extends string = string> = RCSelectChangeDetail & {
  reason: 'action';
  selected: false;
  optionValue: string;
  option: RCListboxActionOption<Action>;
  action: Action;
};

export type RCListboxChangeDetail =
  | RCListboxSelectChangeDetail
  | RCListboxActionChangeDetail;

export type RCSelectRef = HTMLElement & {
  open: boolean;
  multiple: boolean;
  disabled: boolean;
  placeholder: string;
  display: 'auto' | 'chips' | 'compact';
  value: RCSelectValue;
  defaultValue: RCSelectValue | undefined;
  options: RCSelectOption[] | undefined;
  readonly selectedValues: string[];
  openPopup(): void;
  closePopup(returnFocus?: boolean): void;
};

/** Public API surface of `<rc-combobox>`. */
export type RCComboboxRef = RCSelectRef & {
  allowCreate: boolean;
  filterStrategy: 'prefix' | 'contains' | ((label: string, query: string) => boolean);
};

export type RCComboboxCreateDetail = {
  text: string;
};

/** Public API surface of `<rc-dialog>`. */
export type RCDialogRef = HTMLElement & {
  open: boolean | undefined;
  defaultOpen: boolean;
  movable: boolean;
  moveHandle: string;
  moveBounds: 'viewport' | 'parent';
  moveStep: number;
  resize: 'none' | 'both' | 'horizontal' | 'vertical';
  resizeThreshold: number;
  resizeStep: number;
  closedBy: 'any' | 'closerequest' | 'none' | '';
  lightDismiss: boolean;
  readonly returnValue: string;
  showModal(): void;
  show(): void;
  close(returnValue?: string): void;
  requestClose(returnValue?: string): void;
};

export type RCDialogToggleDetail = {
  open: boolean;
  returnValue: string;
};

export type RCDialogCloseDetail = {
  returnValue: string;
};

/** Public API surface of `<rc-menu>`. */
export type RCMenuRef = HTMLElement & {
  label: string;
};

export type RCMenuActivateDetail = {
  item: HTMLElement;
  value: string;
  text: string;
};

export type RCMenuCloseDetail = {
  reason: 'escape';
};

/** Public API surface of `<rc-menu-button>`. */
export type RCMenuButtonPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export type RCMenuButtonRef = HTMLElement & {
  open: boolean | undefined;
  defaultOpen: boolean;
  orientation: 'horizontal' | 'vertical' | undefined;
  placement: RCMenuButtonPlacement;
};

export type RCMenuButtonToggleDetail = {
  open: boolean;
};

/** Public API surface of `<rc-menubar>`. */
export type RCMenubarRef = HTMLElement & {
  label: string;
  orientation: 'horizontal' | 'vertical';
};

/** Public API surface of `<rc-toolbar>`. */
export type RCToolbarRef = HTMLElement & {
  label: string;
  orientation: string;
};

/** Public API surface of `<rc-splitter>`. */
export type RCSplitterRef = HTMLElement & {
  label: string;
  orientation: 'horizontal' | 'vertical';
  mode: 'length' | 'percent';
  step: number;
  value: number;
  defaultValue: number | undefined;
  fixed: boolean;
};

export type RCTextareaRef = HTMLElement & {
  value: string;
  defaultValue: string | undefined;
  plugin: RCTextareaPlugin | null;
  lineNumbers: boolean;
  listNumbers: boolean;
  gutter: boolean;
  wordWrap: boolean;
  autoGrow: boolean;
  readOnly: boolean;
  label: string | null;
  usePlugin(plugin: RCTextareaPlugin): void;
  removePlugin(): void;
  wrapSelection(prefix: string, suffix: string): void;
  replaceSelection(text: string): void;
};

export type RCMarkdownEditorRef = HTMLElement & {
  value: string;
  defaultValue: string;
  toolbar: boolean;
  sourceMode: boolean;
  defaultSourceMode: boolean;
  readOnly: boolean;
};

export type RCMarkdownEditorFormats = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  link?: boolean;
  heading?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | null;
  blockquote?: boolean;
  bulletList?: boolean;
  orderedList?: boolean;
  codeBlock?: boolean;
  codeLanguage?: string | null;
};

export type RCMarkdownEditorChangeDetail = {
  value: string;
};

export type RCMarkdownEditorModeChangeDetail = {
  mode: 'rich' | 'source';
};

export type RCVirtualCanvasViewRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type RCVirtualCanvasRenderDetail = {
  time: DOMHighResTimeStamp;
  reason: 'animation-frame' | 'viewport-change' | 'manual';
  viewRect: RCVirtualCanvasViewRect;
  contentRect: RCVirtualCanvasViewRect;
};

export type RCVirtualCanvasPointerDetail = {
  type: string;
  clientX: number;
  clientY: number;
  contentX: number;
  contentY: number;
  viewRect: RCVirtualCanvasViewRect;
  button: number;
  buttons: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  sourceEvent: PointerEvent | MouseEvent;
};

export type RCVirtualCanvasRef = HTMLElement & {
  contentWidth: number;
  contentHeight: number;
  autoResizeCanvas: boolean;
  renderMode: 'continuous' | 'viewport-change' | 'manual';
  imageRendering: 'auto' | 'crisp-edges' | 'pixelated';
  readonly canvasScaleX: number;
  readonly canvasScaleY: number;
  getViewRect(): RCVirtualCanvasViewRect;
  scrollToContent(x: number, y: number, options?: ScrollToOptions): void;
  centerOnContent(x: number, y: number, options?: ScrollToOptions): void;
  clientToContent(clientX: number, clientY: number): Readonly<{ x: number; y: number }>;
  contentToClient(x: number, y: number): Readonly<{ x: number; y: number }>;
  requestRender(reason?: 'animation-frame' | 'viewport-change' | 'manual'): void;
};

export type RCSliderRef = HTMLElement & {
  min: number;
  max: number;
  step: number;
  value: number;
  defaultValue: number | undefined;
  disabled: boolean;
  readonly: boolean;
  display: 'float' | 'inline-start' | 'inline-end' | null;
  valueText: string;
  orientation: 'horizontal' | 'vertical';
};

export type RCSliderChangeDetail = {
  value: number;
};

export type RCRangeSliderRef = HTMLElement & {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  defaultValue: [number, number] | undefined;
  disabled: boolean;
  lowLabel: string;
  highLabel: string;
  lowValueText: string;
  highValueText: string;
  display: 'float' | 'inline-start' | 'inline-end' | null;
  orientation: 'horizontal' | 'vertical';
};

export type RCRangeSliderChangeDetail = {
  value: [number, number];
};

export type RCTransferListOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type RCTransferListRef = HTMLElement & {
  multiple: boolean;
  compact: boolean;
  availableLabel: string;
  selectedLabel: string;
  available: RCTransferListOption[];
  selected: RCTransferListOption[];
  defaultSelected: RCTransferListOption[] | undefined;
  addSelected(): void;
  addAll(): void;
  removeSelected(): void;
  clearSelected(): void;
  moveSelected(delta: number): void;
};

export type RCTransferListChangeDetail = {
  selected: RCTransferListOption[];
};

/** Public API surface of `<rc-app-bar>`. */
export type RCAppBarRef = HTMLElement & {
  variant: 'compact' | 'expanded';
  scrollBehavior: 'pinned' | 'collapse' | 'hide';
  scrolled: boolean | undefined;
  scrollTarget: Element | Document | Window | string | null;
  scrollThreshold: number;
};

export type RCAppBarScrollDetail = {
  scrolled: boolean;
};

/** Public API surface of `<rc-search-bar>`. */
export type RCSearchBarRef = HTMLElement & {
  value: string;
  defaultValue: string | undefined;
  debounce: number;
  clearLabel: string;
  placeholder: string | undefined;
};

export type RCSearchBarInputDetail = {
  value: string;
};

export type RCSplitterChangeDetail = {
  value: number;
  valueText: string;
};

export type RCTextareaChangeDetail = {
  value: string;
};

export type RCTextareaSelectDetail = {
  selectionStart: number;
  selectionEnd: number;
};

/** SolidJS JSX declarations for rc-webcomponents elements. */

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'rc-disclosure': JSX.HTMLAttributes<RCDisclosureRef> & {
        open?: boolean | string;
        fragment?: boolean | string;
        'on:rc-disclosure-toggle'?: (e: CustomEvent<RCDisclosureToggleDetail>) => void;
      };

      'rc-accordion': JSX.HTMLAttributes<RCAccordionRef> & {
        name?: string;
        multiple?: boolean | string;
        'on:rc-disclosure-toggle'?: (e: CustomEvent<RCDisclosureToggleDetail>) => void;
      };

      'rc-listbox': JSX.HTMLAttributes<RCListboxRef> & {
        multiple?: boolean | string;
        checkmark?: boolean | string;
        'filter-strategy'?: 'prefix' | 'contains';
        value?: RCSelectValue;
        defaultValue?: RCSelectValue;
        options?: RCListboxOption[];
        'prop:value'?: RCSelectValue | undefined;
        'prop:defaultValue'?: RCSelectValue | undefined;
        'prop:options'?: RCListboxOption[] | undefined;
        'on:rc-listbox-change'?: (e: CustomEvent<RCListboxChangeDetail>) => void;
      };

      'rc-select': JSX.HTMLAttributes<RCSelectRef> & {
        open?: boolean | string;
        multiple?: boolean | string;
        disabled?: boolean | string;
        placeholder?: string;
        display?: 'auto' | 'chips' | 'compact';
        value?: RCSelectValue;
        defaultValue?: RCSelectValue;
        options?: RCSelectOption[];
        'prop:value'?: RCSelectValue | undefined;
        'prop:defaultValue'?: RCSelectValue | undefined;
        'prop:options'?: RCSelectOption[] | undefined;
        'on:rc-select-change'?: (e: CustomEvent<RCSelectChangeDetail>) => void;
        'on:rc-select-open'?: (e: CustomEvent) => void;
        'on:rc-select-close'?: (e: CustomEvent) => void;
      };

      'rc-combobox': JSX.HTMLAttributes<RCComboboxRef> & {
        open?: boolean | string;
        multiple?: boolean | string;
        disabled?: boolean | string;
        placeholder?: string;
        display?: 'auto' | 'chips' | 'compact';
        allowcreate?: boolean | string;
        'filter-strategy'?: 'prefix' | 'contains';
        value?: RCSelectValue;
        defaultValue?: RCSelectValue;
        options?: RCSelectOption[];
        'prop:value'?: RCSelectValue | undefined;
        'prop:defaultValue'?: RCSelectValue | undefined;
        'prop:options'?: RCSelectOption[] | undefined;
        'on:rc-select-change'?: (e: CustomEvent<RCSelectChangeDetail>) => void;
        'on:rc-select-open'?: (e: CustomEvent) => void;
        'on:rc-select-close'?: (e: CustomEvent) => void;
        'on:rc-combobox-create'?: (e: CustomEvent<RCComboboxCreateDetail>) => void;
      };

      'rc-dialog': JSX.HTMLAttributes<RCDialogRef> & {
        open?: boolean | string;
        defaultOpen?: boolean | string;
        'prop:open'?: boolean | undefined;
        'prop:defaultOpen'?: boolean | undefined;
        movable?: boolean | string;
        'move-handle'?: string;
        'move-bounds'?: 'viewport' | 'parent';
        'move-step'?: number | string;
        resize?: 'none' | 'both' | 'horizontal' | 'vertical';
        'resize-threshold'?: number | string;
        'resize-step'?: number | string;
        'closed-by'?: 'any' | 'closerequest' | 'none';
        'light-dismiss'?: boolean | string;
        'on:rc-dialog-open'?: (e: CustomEvent) => void;
        'on:rc-dialog-toggle'?: (e: CustomEvent<RCDialogToggleDetail>) => void;
        'on:rc-dialog-close'?: (e: CustomEvent<RCDialogCloseDetail>) => void;
        'on:rc-dialog-request-close'?: (e: CustomEvent<RCDialogCloseDetail>) => void;
        'on:rc-dialog-cancel'?: (e: CustomEvent) => void;
      };

      'rc-menu': JSX.HTMLAttributes<RCMenuRef> & {
        label?: string;
        'on:rc-menu-activate'?: (e: CustomEvent<RCMenuActivateDetail>) => void;
        'on:rc-menu-close'?: (e: CustomEvent<RCMenuCloseDetail>) => void;
      };

      'rc-menu-button': JSX.HTMLAttributes<RCMenuButtonRef> & {
        open?: boolean | string;
        defaultOpen?: boolean | string;
        'prop:open'?: boolean | undefined;
        'prop:defaultOpen'?: boolean | undefined;
        orientation?: 'horizontal' | 'vertical';
        placement?: RCMenuButtonPlacement;
        'on:rc-menu-button-toggle'?: (e: CustomEvent<RCMenuButtonToggleDetail>) => void;
      };

      'rc-menubar': JSX.HTMLAttributes<RCMenubarRef> & {
        label?: string;
        orientation?: 'horizontal' | 'vertical';
      };

      'rc-toolbar': JSX.HTMLAttributes<RCToolbarRef> & {
        label?: string;
        orientation?: string;
      };

      'rc-slider': JSX.HTMLAttributes<RCSliderRef> & {
        min?: number | string;
        max?: number | string;
        step?: number | string;
        value?: number | string;
        defaultValue?: number | string;
        'default-value'?: number | string;
        'prop:value'?: number | undefined;
        'prop:defaultValue'?: number | undefined;
        disabled?: boolean | string;
        readonly?: boolean | string;
        display?: 'float' | 'inline-start' | 'inline-end';
        'value-text'?: string;
        orientation?: 'horizontal' | 'vertical';
        'on:rc-slider-input'?: (e: CustomEvent<RCSliderChangeDetail>) => void;
        'on:rc-slider-change'?: (e: CustomEvent<RCSliderChangeDetail>) => void;
      };

      'rc-range-slider': JSX.HTMLAttributes<RCRangeSliderRef> & {
        min?: number | string;
        max?: number | string;
        step?: number | string;
        'prop:value'?: [number, number] | undefined;
        'prop:defaultValue'?: [number, number] | undefined;
        disabled?: boolean | string;
        'low-label'?: string;
        'high-label'?: string;
        'low-value-text'?: string;
        'high-value-text'?: string;
        display?: 'float' | 'inline-start' | 'inline-end';
        orientation?: 'horizontal' | 'vertical';
        'on:rc-range-slider-input'?: (e: CustomEvent<RCRangeSliderChangeDetail>) => void;
        'on:rc-range-slider-change'?: (e: CustomEvent<RCRangeSliderChangeDetail>) => void;
      };

      'rc-transfer-list': JSX.HTMLAttributes<RCTransferListRef> & {
        multiple?: boolean | string;
        compact?: boolean | string;
        'available-label'?: string;
        'selected-label'?: string;
        'prop:compact'?: boolean | undefined;
        'prop:available'?: RCTransferListOption[] | undefined;
        'prop:selected'?: RCTransferListOption[] | undefined;
        'prop:defaultSelected'?: RCTransferListOption[] | undefined;
        'on:rc-transfer-list-change'?: (e: CustomEvent<RCTransferListChangeDetail>) => void;
      };

      'rc-splitter': JSX.HTMLAttributes<RCSplitterRef> & {
        label?: string;
        orientation?: 'horizontal' | 'vertical';
        mode?: 'length' | 'percent';
        step?: number | string;
        value?: number | string;
        defaultValue?: number | string;
        'default-value'?: number | string;
        'prop:value'?: number | undefined;
        'prop:defaultValue'?: number | undefined;
        fixed?: boolean | string;
        'on:rc-splitter-change'?: (e: CustomEvent<RCSplitterChangeDetail>) => void;
      };

      'rc-editor-toolbar': JSX.HTMLAttributes<HTMLElement> & {
        label?: string;
        'on:rc-toolbar-action'?: (e: CustomEvent<{ action: string }>) => void;
      };

      'rc-markdown-editor': JSX.HTMLAttributes<RCMarkdownEditorRef> & {
        value?: string;
        defaultValue?: string;
        'default-value'?: string;
        'prop:value'?: string | undefined;
        'prop:defaultValue'?: string | undefined;
        toolbar?: boolean | string;
        'source-mode'?: boolean | string;
        'default-source-mode'?: boolean | string;
        'prop:sourceMode'?: boolean | undefined;
        'prop:defaultSourceMode'?: boolean | undefined;
        'read-only'?: boolean | string;
        'on:rc-change'?: (e: CustomEvent<RCMarkdownEditorChangeDetail>) => void;
        'on:rc-mode-change'?: (e: CustomEvent<RCMarkdownEditorModeChangeDetail>) => void;
        'on:rc-formatting-change'?: (e: CustomEvent<RCMarkdownEditorFormats>) => void;
      };

      'rc-fab': JSX.HTMLAttributes<HTMLElement> & {
        position?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start' | string;
        'scroll-reveal'?: boolean | string;
      };

      'rc-app-bar': JSX.HTMLAttributes<RCAppBarRef> & {
        variant?: 'compact' | 'expanded';
        'scroll-behavior'?: 'pinned' | 'collapse' | 'hide';
        'scroll-target'?: string;
        'scroll-threshold'?: number | string;
        'prop:scrolled'?: boolean | undefined;
        'prop:scrollTarget'?: Element | Document | Window | string | null;
        'on:rc-app-bar-scroll'?: (e: CustomEvent<RCAppBarScrollDetail>) => void;
      };

      'rc-search-bar': JSX.HTMLAttributes<RCSearchBarRef> & {
        debounce?: number | string;
        'clear-label'?: string;
        placeholder?: string;
        'default-value'?: string;
        'prop:value'?: string | undefined;
        'prop:defaultValue'?: string | undefined;
        'on:rc-search-bar-input'?: (e: CustomEvent<RCSearchBarInputDetail>) => void;
        'on:rc-search-bar-clear'?: (e: CustomEvent) => void;
      };

      'rc-virtual-canvas': JSX.HTMLAttributes<RCVirtualCanvasRef> & {
        contentWidth?: number | string;
        contentHeight?: number | string;
        'auto-resize-canvas'?: boolean | string;
        'render-mode'?: 'continuous' | 'viewport-change' | 'manual';
        'image-rendering'?: 'auto' | 'crisp-edges' | 'pixelated';
        'on:rc-virtual-canvas-render'?: (e: CustomEvent<RCVirtualCanvasRenderDetail>) => void;
        'on:rc-virtual-canvas-pointer'?: (e: CustomEvent<RCVirtualCanvasPointerDetail>) => void;
      };

      'rc-textarea': JSX.HTMLAttributes<RCTextareaRef> & {
        value?: string;
        defaultValue?: string;
        plugin?: RCTextareaPlugin | null;
        'prop:value'?: string | undefined;
        'prop:defaultValue'?: string | undefined;
        'prop:plugin'?: RCTextareaPlugin | null;
        'line-numbers'?: boolean | string;
        'list-numbers'?: boolean | string;
        gutter?: boolean | string;
        'word-wrap'?: boolean | string;
        'auto-grow'?: boolean | string;
        'read-only'?: boolean | string;
        label?: string;
        'on:rc-textarea-change'?: (e: CustomEvent<RCTextareaChangeDetail>) => void;
        'on:rc-textarea-focus'?: (e: CustomEvent) => void;
        'on:rc-textarea-blur'?: (e: CustomEvent) => void;
        'on:rc-textarea-select'?: (e: CustomEvent<RCTextareaSelectDetail>) => void;
      };
    }
  }
}
