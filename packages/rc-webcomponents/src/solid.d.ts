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

// ---- Ref types --------------------------------------------------------------

/** Public API surface of `<rc-listbox>`. */
export type RCListboxRef = HTMLElement & {
  multiple: boolean;
  filterStrategy: 'prefix' | 'contains' | ((label: string, query: string) => boolean);
  readonly allOptions: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
  readonly filteredOptions: ReadonlyArray<{ value: string; label: string; disabled?: boolean }>;
  readonly selectedValues: string[];
  readonly navigableItems: Element[];
  setSelectedValues(values: string[]): void;
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
  openPopup(): void;
  closePopup(returnFocus?: boolean): void;
  setSelected(values: string[]): void;
};

/** Public API surface of `<rc-combobox>`. */
export type RCComboboxRef = RCSelectRef & {
  allowCreate: boolean;
  filterStrategy: 'prefix' | 'contains' | ((label: string, query: string) => boolean);
};

/** Public API surface of `<rc-dialog>`. */
export type RCDialogRef = HTMLElement & {
  open: boolean;
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
export type RCMenuButtonRef = HTMLElement & {
  open: boolean;
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
  fixed: boolean;
};

// ---- JSX augmentation -------------------------------------------------------

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'rc-listbox': JSX.HTMLAttributes<RCListboxRef> & {
        multiple?: boolean | string;
        'filter-strategy'?: 'prefix' | 'contains';
        'on:rc-listbox-change'?: (e: CustomEvent<{ value: string; selected: boolean }>) => void;
      };

      'rc-select': JSX.HTMLAttributes<RCSelectRef> & {
        open?: boolean | string;
        multiple?: boolean | string;
        disabled?: boolean | string;
        placeholder?: string;
        display?: 'auto' | 'chips' | 'compact';
        'on:rc-select-change'?: (e: CustomEvent<{ value: string | string[] }>) => void;
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
        'on:rc-select-change'?: (e: CustomEvent<{ value: string | string[] }>) => void;
        'on:rc-select-open'?: (e: CustomEvent) => void;
        'on:rc-select-close'?: (e: CustomEvent) => void;
        'on:rc-combobox-create'?: (e: CustomEvent<{ text: string }>) => void;
      };

      'rc-dialog': JSX.HTMLAttributes<RCDialogRef> & {
        open?: boolean | string;
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
        'on:rc-dialog-close'?: (e: CustomEvent<{ returnValue: string }>) => void;
        'on:rc-dialog-request-close'?: (e: CustomEvent<{ returnValue: string }>) => void;
        'on:rc-dialog-cancel'?: (e: CustomEvent) => void;
      };

      'rc-menu': JSX.HTMLAttributes<RCMenuRef> & {
        label?: string;
        'on:rc-menu-activate'?: (e: CustomEvent<{ item: HTMLElement }>) => void;
        'on:rc-menu-close'?: (e: CustomEvent) => void;
      };

      'rc-menu-button': JSX.HTMLAttributes<RCMenuButtonRef> & {
        open?: boolean | string;
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
        fixed?: boolean | string;
        'on:rc-splitter-change'?: (e: CustomEvent<{ value: number; valueText: string }>) => void;
      };
    }
  }
}
