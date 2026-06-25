/**
 * React JSX type augmentation for rc-webcomponents.
 *
 * Add a triple-slash reference once in your React project (e.g. vite-env.d.ts):
 *
 *   /// <reference types="@rcarls/rc-webcomponents/react" />
 *
 * Ref types use HTMLElement intersections — not LitElement — so TypeScript
 * resolves correctly without requiring `lit` in your tsconfig paths.
 *
 * Import ref and event detail types directly for use with useRef and
 * addEventListener:
 *
 *   import type { RCComboboxRef, RCComboboxCreateDetail } from '@rcarls/rc-webcomponents/react';
 *
 *   const ref = useRef<RCComboboxRef>(null);
 *   el.addEventListener('rc-combobox-create', (e: CustomEvent<RCComboboxCreateDetail>) => { ... });
 */

import type { RCTextareaPlugin } from '@rcarls/rc-textarea';

// ── Shared value types ───────────────────────────────────────────────────────

export type RCSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type RCSelectValue = string | string[];

// ── Event detail types ───────────────────────────────────────────────────────

export type RCDisclosureToggleDetail = {
  open: boolean;
};

export type RCSelectChangeDetail = {
  value: RCSelectValue;
  selectedValues: string[];
  selectedOptions: RCSelectOption[];
};

export type RCListboxChangeDetail = RCSelectChangeDetail & {
  selected: boolean;
  optionValue: string;
  option: RCSelectOption | null;
};

export type RCComboboxCreateDetail = {
  text: string;
};

export type RCDialogToggleDetail = {
  open: boolean;
  returnValue: string;
};

export type RCDialogCloseDetail = {
  returnValue: string;
};

export type RCMenuActivateDetail = {
  item: HTMLElement;
  value: string;
  text: string;
};

export type RCMenuCloseDetail = {
  reason: 'escape';
};

export type RCMenuButtonToggleDetail = {
  open: boolean;
};

export type RCSliderChangeDetail = {
  value: number;
};

export type RCRangeSliderChangeDetail = {
  value: [number, number];
};

export type RCTransferListOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type RCTransferListChangeDetail = {
  selected: RCTransferListOption[];
};

export type RCSplitterChangeDetail = {
  value: number;
  valueText: string;
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

export type RCAppBarScrollDetail = {
  scrolled: boolean;
};

export type RCSearchBarInputDetail = {
  value: string;
};

export type RCTextareaChangeDetail = {
  value: string;
};

export type RCTextareaSelectDetail = {
  selectionStart: number;
  selectionEnd: number;
};

// ── Ref types ────────────────────────────────────────────────────────────────

/** Public API surface of `<rc-disclosure>`. */
export type RCDisclosureRef = HTMLElement & {
  open: boolean;
  fragment: boolean;
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
  options: RCSelectOption[];
  readonly allOptions: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
  readonly filteredOptions: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
  readonly selectedValues: string[];
  readonly navigableItems: Element[];
  toggleOption(value: string): void;
  clearSelection(): void;
  filterOptions(text: string): void;
  clearFilter(): void;
  setCreateOption(label: string | null): void;
};

/** Public API surface of `<rc-select>`. */
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

/** Public API surface of `<rc-menu>`. */
export type RCMenuRef = HTMLElement & {
  label: string;
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

/** Public API surface of `<rc-slider>`. */
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

/** Public API surface of `<rc-range-slider>`. */
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

/** Public API surface of `<rc-transfer-list>`. */
export type RCTransferListRef = HTMLElement & {
  multiple: boolean;
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

/** Public API surface of `<rc-textarea>`. */
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

/** Public API surface of `<rc-markdown-editor>`. */
export type RCMarkdownEditorRef = HTMLElement & {
  value: string;
  defaultValue: string;
  toolbar: boolean;
  sourceMode: boolean;
  defaultSourceMode: boolean;
  readOnly: boolean;
};

/** Public API surface of `<rc-virtual-canvas>`. */
export type RCVirtualCanvasRef = HTMLElement & {
  contentWidth: number;
  contentHeight: number;
  autoResizeCanvas: boolean;
  renderMode: 'continuous' | 'viewport-change' | 'manual';
  imageRendering: 'auto' | 'crisp-edges' | 'pixelated';
  getViewRect(): RCVirtualCanvasViewRect;
  scrollToContent(x: number, y: number, options?: ScrollToOptions): void;
  centerOnContent(x: number, y: number, options?: ScrollToOptions): void;
  clientToContent(clientX: number, clientY: number): Readonly<{ x: number; y: number }>;
  contentToClient(x: number, y: number): Readonly<{ x: number; y: number }>;
  requestRender(reason?: 'animation-frame' | 'viewport-change' | 'manual'): void;
};

/** Public API surface of `<rc-app-bar>`. */
export type RCAppBarRef = HTMLElement & {
  variant: 'compact' | 'expanded';
  scrollBehavior: 'pinned' | 'collapse' | 'hide';
  scrolled: boolean | undefined;
  scrollTarget: Element | Document | Window | string | null;
  scrollThreshold: number;
};

/** Public API surface of `<rc-search-bar>`. */
export type RCSearchBarRef = HTMLElement & {
  value: string;
  defaultValue: string | undefined;
  debounce: number;
  clearLabel: string;
  placeholder: string | undefined;
};

// ── React JSX declarations ───────────────────────────────────────────────────

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'rc-disclosure': React.DetailedHTMLProps<React.HTMLAttributes<RCDisclosureRef>, RCDisclosureRef> & {
        open?: boolean;
        fragment?: boolean;
      };

      'rc-accordion': React.DetailedHTMLProps<React.HTMLAttributes<RCAccordionRef>, RCAccordionRef> & {
        name?: string;
        multiple?: boolean;
      };

      'rc-listbox': React.DetailedHTMLProps<React.HTMLAttributes<RCListboxRef>, RCListboxRef> & {
        multiple?: boolean;
        checkmark?: boolean;
        'filter-strategy'?: 'prefix' | 'contains';
        value?: RCSelectValue;
        'default-value'?: RCSelectValue;
        options?: RCSelectOption[];
      };

      'rc-select': React.DetailedHTMLProps<React.HTMLAttributes<RCSelectRef>, RCSelectRef> & {
        open?: boolean;
        multiple?: boolean;
        disabled?: boolean;
        placeholder?: string;
        display?: 'auto' | 'chips' | 'compact';
        value?: RCSelectValue;
        'default-value'?: RCSelectValue;
        options?: RCSelectOption[];
      };

      'rc-combobox': React.DetailedHTMLProps<React.HTMLAttributes<RCComboboxRef>, RCComboboxRef> & {
        open?: boolean;
        multiple?: boolean;
        disabled?: boolean;
        placeholder?: string;
        display?: 'auto' | 'chips' | 'compact';
        'allow-create'?: boolean;
        'filter-strategy'?: 'prefix' | 'contains';
        value?: RCSelectValue;
        'default-value'?: RCSelectValue;
        options?: RCSelectOption[];
      };

      'rc-dialog': React.DetailedHTMLProps<React.HTMLAttributes<RCDialogRef>, RCDialogRef> & {
        open?: boolean;
        'default-open'?: boolean;
        movable?: boolean;
        'move-handle'?: string;
        'move-bounds'?: 'viewport' | 'parent';
        'move-step'?: number | string;
        resize?: 'none' | 'both' | 'horizontal' | 'vertical';
        'resize-threshold'?: number | string;
        'resize-step'?: number | string;
        'closed-by'?: 'any' | 'closerequest' | 'none';
        'light-dismiss'?: boolean;
      };

      'rc-menu': React.DetailedHTMLProps<React.HTMLAttributes<RCMenuRef>, RCMenuRef> & {
        label?: string;
      };

      'rc-menu-button': React.DetailedHTMLProps<React.HTMLAttributes<RCMenuButtonRef>, RCMenuButtonRef> & {
        open?: boolean;
        'default-open'?: boolean;
        orientation?: 'horizontal' | 'vertical';
        placement?: RCMenuButtonPlacement;
      };

      'rc-menubar': React.DetailedHTMLProps<React.HTMLAttributes<RCMenubarRef>, RCMenubarRef> & {
        label?: string;
        orientation?: 'horizontal' | 'vertical';
      };

      'rc-toolbar': React.DetailedHTMLProps<React.HTMLAttributes<RCToolbarRef>, RCToolbarRef> & {
        label?: string;
        orientation?: string;
      };

      'rc-slider': React.DetailedHTMLProps<React.HTMLAttributes<RCSliderRef>, RCSliderRef> & {
        min?: number | string;
        max?: number | string;
        step?: number | string;
        value?: number | string;
        'default-value'?: number | string;
        disabled?: boolean;
        readonly?: boolean;
        display?: 'float' | 'inline-start' | 'inline-end';
        'value-text'?: string;
        orientation?: 'horizontal' | 'vertical';
      };

      'rc-range-slider': React.DetailedHTMLProps<React.HTMLAttributes<RCRangeSliderRef>, RCRangeSliderRef> & {
        min?: number | string;
        max?: number | string;
        step?: number | string;
        value?: [number, number];
        'default-value'?: [number, number];
        disabled?: boolean;
        'low-label'?: string;
        'high-label'?: string;
        'low-value-text'?: string;
        'high-value-text'?: string;
        display?: 'float' | 'inline-start' | 'inline-end';
        orientation?: 'horizontal' | 'vertical';
      };

      'rc-transfer-list': React.DetailedHTMLProps<React.HTMLAttributes<RCTransferListRef>, RCTransferListRef> & {
        multiple?: boolean;
        'available-label'?: string;
        'selected-label'?: string;
        available?: RCTransferListOption[];
        selected?: RCTransferListOption[];
        'default-selected'?: RCTransferListOption[];
      };

      'rc-splitter': React.DetailedHTMLProps<React.HTMLAttributes<RCSplitterRef>, RCSplitterRef> & {
        label?: string;
        orientation?: 'horizontal' | 'vertical';
        mode?: 'length' | 'percent';
        step?: number | string;
        value?: number | string;
        'default-value'?: number | string;
        fixed?: boolean;
      };

      'rc-editor-toolbar': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string;
      };

      'rc-markdown-editor': React.DetailedHTMLProps<React.HTMLAttributes<RCMarkdownEditorRef>, RCMarkdownEditorRef> & {
        value?: string;
        'default-value'?: string;
        toolbar?: boolean;
        'source-mode'?: boolean;
        'default-source-mode'?: boolean;
        'read-only'?: boolean;
      };

      'rc-fab': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        position?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';
        'scroll-reveal'?: boolean;
      };

      'rc-app-bar': React.DetailedHTMLProps<React.HTMLAttributes<RCAppBarRef>, RCAppBarRef> & {
        variant?: 'compact' | 'expanded';
        'scroll-behavior'?: 'pinned' | 'collapse' | 'hide';
        'scroll-target'?: string;
        'scroll-threshold'?: number | string;
        scrollTarget?: Element | Document | Window | string | null;
      };

      'rc-search-bar': React.DetailedHTMLProps<React.HTMLAttributes<RCSearchBarRef>, RCSearchBarRef> & {
        debounce?: number | string;
        'clear-label'?: string;
        placeholder?: string;
        'default-value'?: string;
        value?: string;
      };

      'rc-virtual-canvas': React.DetailedHTMLProps<React.HTMLAttributes<RCVirtualCanvasRef>, RCVirtualCanvasRef> & {
        'content-width'?: number | string;
        'content-height'?: number | string;
        'auto-resize-canvas'?: boolean;
        'render-mode'?: 'continuous' | 'viewport-change' | 'manual';
        'image-rendering'?: 'auto' | 'crisp-edges' | 'pixelated';
      };

      'rc-textarea': React.DetailedHTMLProps<React.HTMLAttributes<RCTextareaRef>, RCTextareaRef> & {
        value?: string;
        'default-value'?: string;
        plugin?: RCTextareaPlugin | null;
        'line-numbers'?: boolean;
        'list-numbers'?: boolean;
        gutter?: boolean;
        'word-wrap'?: boolean;
        'auto-grow'?: boolean;
        'read-only'?: boolean;
        /** @deprecated Set `aria-label` on the slotted `<textarea>` or use a `<label for>` pair instead. */
        label?: string;
      };
    }
  }
}
