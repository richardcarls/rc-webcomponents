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

// ---- Ref types --------------------------------------------------------------

/** Public API surface of `<rc-listbox>`. */
export type RCListboxRef = HTMLElement & {
  multiple: boolean;
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
export type RCSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type RCSelectValue = string | string[];

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

export type RCDialogToggleDetail = {
  open: boolean;
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

/** Public API surface of `<rc-menu-button>`. */
export type RCMenuButtonRef = HTMLElement & {
  open: boolean | undefined;
  defaultOpen: boolean;
  orientation: 'horizontal' | 'vertical' | undefined;
};

/** Public API surface of `<rc-menubar>`. */
export type RCMenubarRef = HTMLElement;

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
};

// ---- JSX augmentation -------------------------------------------------------

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'rc-listbox': JSX.HTMLAttributes<RCListboxRef> & {
        multiple?: boolean | string;
        'filter-strategy'?: 'prefix' | 'contains';
        value?: RCSelectValue;
        defaultValue?: RCSelectValue;
        options?: RCSelectOption[];
        'prop:value'?: RCSelectValue | undefined;
        'prop:defaultValue'?: RCSelectValue | undefined;
        'prop:options'?: RCSelectOption[] | undefined;
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
        'on:rc-combobox-create'?: (e: CustomEvent<{ text: string }>) => void;
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
        'on:rc-dialog-close'?: (e: CustomEvent<{ returnValue: string }>) => void;
        'on:rc-dialog-request-close'?: (e: CustomEvent<{ returnValue: string }>) => void;
        'on:rc-dialog-cancel'?: (e: CustomEvent) => void;
      };

      'rc-menu': JSX.HTMLAttributes<RCMenuRef> & {
        label?: string;
        'on:rc-menu-activate'?: (e: CustomEvent<RCMenuActivateDetail>) => void;
        'on:rc-menu-close'?: (e: CustomEvent<{ reason: 'escape' }>) => void;
      };

      'rc-menu-button': JSX.HTMLAttributes<RCMenuButtonRef> & {
        open?: boolean | string;
        defaultOpen?: boolean | string;
        'prop:open'?: boolean | undefined;
        'prop:defaultOpen'?: boolean | undefined;
        orientation?: 'horizontal' | 'vertical';
        'on:rc-menu-button-toggle'?: (e: CustomEvent<{ open: boolean }>) => void;
      };

      'rc-menubar': JSX.HTMLAttributes<RCMenubarRef>;

      'rc-toolbar': JSX.HTMLAttributes<RCToolbarRef> & {
        label?: string;
        orientation?: string;
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
        'on:rc-splitter-change'?: (e: CustomEvent<{ value: number; valueText: string }>) => void;
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
        'on:rc-textarea-change'?: (e: CustomEvent<{ value: string }>) => void;
        'on:rc-textarea-focus'?: (e: CustomEvent) => void;
        'on:rc-textarea-blur'?: (e: CustomEvent) => void;
        'on:rc-textarea-select'?: (e: CustomEvent<{ selectionStart: number; selectionEnd: number }>) => void;
      };
    }
  }
}
