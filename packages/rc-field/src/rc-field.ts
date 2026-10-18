import { LitElement, html, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';

import {
  cssText,
  getDirectChildren,
  NativeChildController,
  warnMissingDirectChild,
} from '@rcarls/rc-common';

import fieldStyles from './rc-field.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-field': RCField;
  }
}

export type RCFieldControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const CONTROL_SELECTOR = [
  ':scope > input',
  ':scope > textarea',
  ':scope > select',
  ':scope > [data-rc-field-control] > input',
  ':scope > [data-rc-field-control] > textarea',
  ':scope > [data-rc-field-control] > select',
  ':scope > fieldset',
].join(', ');

/**
 * Structural light-DOM CSS for group mode. `::slotted()` reaches only the fieldset, so its
 * legend and controls are laid out from the containing document or shadow root, in `rc-base`
 * below every theme layer.
 */
const LIGHT_DOM_CSS = cssText`
@layer rc-base {
  rc-field > fieldset {
    box-sizing: border-box;
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 var(--rc-field-control-gap, var(--rc-control-gap, 0.25rem));
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  /* A floated legend is not the fieldset's rendered legend, so it lays out as a flex item
     on its own row, where the field label sits. */
  rc-field > fieldset > legend {
    float: inline-start;
    flex: 0 0 100%;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    color: var(--rc-field-label-color, var(--rc-field-text, CanvasText));
    line-height: 1.25;
  }

  rc-field > fieldset > :is(input, textarea, select) {
    box-sizing: border-box;
    min-inline-size: 0;
    max-inline-size: 100%;
    padding: 0;
    border: 0;
    border-radius: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    box-shadow: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* Text-like controls grow; selects and enhanced controls attach as leading or trailing
     addons in source order. */
  rc-field > fieldset > :is(input, textarea) {
    flex: 1 1 0;
  }

  rc-field > fieldset > :is(select, [data-rc-field-control]) {
    flex: none;
  }
}
`;

const TEXT_INPUT_TYPES = new Set([
  'date',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
]);

let fieldId = 0;

/** The native controls a fieldset groups, including those owned by enhancing providers. */
function groupControls($group: HTMLFieldSetElement): RCFieldControl[] {
  return [...$group.elements].filter(
    ($element): $element is RCFieldControl =>
      $element instanceof HTMLInputElement ||
      $element instanceof HTMLTextAreaElement ||
      $element instanceof HTMLSelectElement,
  );
}

/**
 * Accessible field wrapper for a native input, textarea, or select with labels and supporting
 * text.
 *
 * The native control remains connected in light DOM and owns its value, form association,
 * autofill, constraint validation, and native events. `rc-field` derives visual state from that
 * control and wires a slotted label, hint, and error without replacing author-provided ARIA
 * references. Programmatic native value writes are visible after calling `sync()`.
 *
 * Derived host attributes expose `data-focused`, `data-populated`, `data-disabled`,
 * `data-readonly`, `data-required`, `data-invalid`, `data-multiline`, `data-has-label`, and
 * `data-validation-attempted` for themes.
 *
 * A direct `<fieldset>` child groups several native controls into one field, such as an amount
 * and its unit. Its `<legend>` names the group and shows as the field label, and each control
 * keeps its own accessible name. The first text-like input or textarea is the primary control,
 * and the others attach before or after it in source order. Supporting text describes the
 * fieldset.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-field rc-field docs}
 * @see {@link https://m3.material.io/components/text-fields/overview Material Design 3 text fields}
 *
 * @slot - Required native `<input>`, `<textarea>`, or `<select>` control. An enhancing direct
 *   child marked `data-rc-field-control` may own the native control as its direct child. A
 *   `<fieldset>` with a `<legend>` instead groups several controls into one field.
 * @slot label - Visible label; use a native `<label>` unless an ancestor label wraps the field
 * @slot leading - Leading icon or control outside the editable content
 * @slot trailing - Trailing icon or control outside the editable content
 * @slot prefix - Text or content immediately before the native control
 * @slot suffix - Text or content immediately after the native control
 * @slot hint - Supporting guidance associated with the native control
 * @slot error - Error text shown and associated after validation is attempted
 *
 * @attr counter - Shows the current native value length and `maxlength`, when present
 * @attr invalid - Forces invalid presentation and supplies native `aria-invalid` when absent
 * @attr [data-focused] - Present while the native control has focus
 * @attr [data-populated] - Present while the native control has a value, or a single select's
 *   selected option has visible label text
 * @attr [data-disabled] - Mirrors the native control's disabled state
 * @attr [data-readonly] - Mirrors the native control's readonly state
 * @attr [data-required] - Mirrors the native control's required state
 * @attr [data-invalid] - Present while an attempted or forced validation state is invalid
 * @attr [data-multiline] - Present when the native control is a textarea
 * @attr [data-has-label] - Present when the field has content in its label slot
 * @attr [data-validation-attempted] - Present after the native control dispatches `invalid`
 * @attr [data-control-provider] - Present when an enhancing direct child owns the native control
 * @attr [data-group] - Present when a `<fieldset>` groups several controls into the field
 *
 * @cssprop [--rc-field-min-block-size=var(--rc-control-block-size, 2.5rem)] - Minimum field surface block size
 * @cssprop [--rc-field-gap=var(--rc-control-gap, 0.5rem)] - Gap between leading, content, and trailing regions
 * @cssprop [--rc-field-padding=var(--rc-control-padding-block, 0.5rem) var(--rc-control-padding-inline, 0.75rem)] - Field surface padding
 * @cssprop [--rc-field-border=var(--rc-border, 1px solid ButtonBorder)] - Field surface border
 * @cssprop [--rc-field-radius=var(--rc-control-radius, 0.125rem)] - Field surface corner radius
 * @cssprop [--rc-field-background=var(--rc-field, Field)] - Field surface background
 * @cssprop [--rc-field-color=var(--rc-field-text, FieldText)] - Input and affix text color
 * @cssprop [--rc-field-label-color=var(--rc-field-text, CanvasText)] - Label color
 * @cssprop [--rc-field-control-gap=var(--rc-control-gap, 0.25rem)] - Gap between control and prefix or suffix
 * @cssprop [--rc-field-supporting-gap=var(--rc-control-gap, 0.5rem)] - Gap between supporting text and counter
 * @cssprop [--rc-field-supporting-padding-block-start=0.25rem] - Supporting text top padding
 * @cssprop [--rc-field-supporting-padding-inline=var(--rc-control-padding-inline, 0.75rem)] - Supporting text inline padding
 * @cssprop [--rc-field-supporting-color=var(--rc-field-text, CanvasText)] - Hint and counter color
 * @cssprop [--rc-field-supporting-font-size=0.75rem] - Hint, error, and counter font size
 * @cssprop [--rc-field-error-color=Mark] - Invalid outline, label, and error color
 * @cssprop [--rc-field-disabled-opacity=var(--rc-disabled-opacity, 0.6)] - Disabled field opacity
 * @cssprop [--rc-field-focus-outline=var(--rc-focus-ring, 2px solid Highlight)] - Focus outline
 * @cssprop [--rc-field-focus-outline-offset=var(--rc-focus-ring-offset, 0)] - Focus outline offset
 *
 * @csspart field - Field surface
 * @csspart content - Label and editable content column
 * @csspart label - Label container
 * @csspart control - Native control, prefix, and suffix row
 * @csspart leading - Leading content container
 * @csspart trailing - Trailing content container
 * @csspart prefix - Prefix content container
 * @csspart suffix - Suffix content container
 * @csspart supporting-text - Supporting text row
 * @csspart hint - Hint container
 * @csspart error - Error container
 * @csspart counter - Character counter
 */
export class RCField extends LitElement {
  static styles = [fieldStyles];

  private static readonly _styledRoots = new WeakSet<Document | ShadowRoot>();

  private static _ensureBaseStyles(root: Node): void {
    if (
      !(root instanceof Document || root instanceof ShadowRoot) ||
      RCField._styledRoots.has(root)
    ) {
      return;
    }

    RCField._styledRoots.add(root);

    const $style = (root instanceof Document ? root : root.ownerDocument).createElement('style');

    $style.setAttribute('data-rc-light-dom-base', 'rc-field');
    $style.textContent = LIGHT_DOM_CSS;

    if (root instanceof Document) {
      root.head.append($style);
    } else {
      root.append($style);
    }
  }

  /** Shows the current native value length and `maxlength`, when present. */
  @property({ type: Boolean, reflect: true })
  counter = false;

  /** Forces invalid presentation and supplies native `aria-invalid` when absent. */
  @property({ type: Boolean, reflect: true })
  invalid = false;

  @state()
  private _hasControl = false;

  @state()
  private _hasLabel = false;

  @state()
  private _hasLeading = false;

  @state()
  private _hasTrailing = false;

  @state()
  private _hasPrefix = false;

  @state()
  private _hasSuffix = false;

  @state()
  private _hasHint = false;

  @state()
  private _hasError = false;

  @state()
  private _focused = false;

  @state()
  private _populated = false;

  @state()
  private _disabled = false;

  @state()
  private _readOnly = false;

  @state()
  private _required = false;

  @state()
  private _multiline = false;

  @state()
  private _grouped = false;

  @state()
  private _validationAttempted = false;

  @state()
  private _nativeInvalid = false;

  @state()
  private _validationMessage = '';

  private _$controlRef: WeakRef<RCFieldControl> | null = null;

  private _$controlProviderRef: WeakRef<HTMLElement> | null = null;

  private _$groupRef: WeakRef<HTMLFieldSetElement> | null = null;

  private _groupObserver: MutationObserver | null = null;

  private _$formRef: WeakRef<HTMLFormElement> | null = null;

  private _controlObserver: MutationObserver | null = null;

  private _compositionObserver: MutationObserver | null = null;

  private _managedDescriptionIds = new Set<string>();

  private _managedIds: Array<{ $element: HTMLElement; id: string }> = [];

  private _managedLabel: { $label: HTMLLabelElement; htmlFor: string } | null = null;

  private _managedControlId: string | null = null;

  private _managedAriaInvalid = new Set<RCFieldControl>();

  private readonly _controlController = new NativeChildController<
    RCFieldControl | HTMLFieldSetElement
  >(this, {
    selector: CONTROL_SELECTOR,
    observe: { childList: true, subtree: true },
    onChange: ($root, $previousRoot) => this._setupRoot($root, $previousRoot),
    onMissing: () => {
      if (import.meta.env.DEV) {
        warnMissingDirectChild(this, {
          selector: CONTROL_SELECTOR,
          childDescription:
            'native <input> or <textarea>, optionally inside a data-rc-field-control provider, ' +
            'or a <fieldset> grouping several controls',
        });
      }
    },
  });

  /**
   * Returns the native control, or `null` when the field is incomplete. In a group, this is the
   * primary control: the first text-like input or textarea, or else the first control.
   */
  get control(): RCFieldControl | null {
    return this._$controlRef?.deref() ?? null;
  }

  /** Returns the `<fieldset>` that groups the field's controls, or `null` for a single control. */
  get group(): HTMLFieldSetElement | null {
    return this._$groupRef?.deref() ?? null;
  }

  /** Returns every native control the field manages, in source order. */
  get controls(): RCFieldControl[] {
    const $group = this.group;

    if ($group) {
      return groupControls($group);
    }

    const $control = this.control;

    return $control ? [$control] : [];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    RCField._ensureBaseStyles(this.getRootNode());

    this._compositionObserver ??= new MutationObserver(() => this._queueSync());

    this._compositionObserver.observe(this, {
      childList: true,
      attributes: true,
      attributeFilter: ['slot'],
    });
  }

  override disconnectedCallback(): void {
    this._compositionObserver?.disconnect();

    const $group = this.group;

    if ($group) {
      this._teardownGroup($group);
    } else {
      this._teardownControl(this.control);
    }

    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('invalid') || changed.has('counter')) {
      this._syncState();
      this._syncAssociations();
    }
  }

  /** Focuses the native control. */
  override focus(options?: FocusOptions): void {
    (this._$controlProviderRef?.deref() ?? this.control)?.focus(options);
  }

  /** Removes focus from the native control. */
  override blur(): void {
    (this._$controlProviderRef?.deref() ?? this.control)?.blur();
  }

  /** Re-reads native value, validity, attributes, slots, and accessible relationships. */
  public sync(): void {
    this._controlController.sync();
    this._syncGroupControl();
    this._syncSlots();
    this._syncForm();
    this._syncState();
    this._syncAssociations();
  }

  private _setupRoot(
    $root: RCFieldControl | HTMLFieldSetElement | null,
    $previousRoot: RCFieldControl | HTMLFieldSetElement | null,
  ): void {
    if ($previousRoot instanceof HTMLFieldSetElement) {
      this._teardownGroup($previousRoot);
    } else if ($previousRoot) {
      this._teardownControl($previousRoot);
    }

    if ($root instanceof HTMLFieldSetElement) {
      this._setupGroup($root);
    } else {
      this._setupControl($root);
    }
  }

  private _setupGroup($group: HTMLFieldSetElement): void {
    this._$groupRef = new WeakRef($group);
    this._$controlProviderRef = null;
    this._grouped = true;
    this._focused = $group.matches(':focus-within');
    this._validationAttempted = false;
    this._nativeInvalid = false;
    this._validationMessage = '';

    $group.addEventListener('input', this._onControlInput);
    $group.addEventListener('change', this._onControlChange);
    $group.addEventListener('focusin', this._onGroupFocusIn);
    $group.addEventListener('focusout', this._onGroupFocusOut);
    $group.addEventListener('invalid', this._onControlInvalid, true);
    $group.addEventListener('compositionend', this._onCompositionEnd);

    this._groupObserver ??= new MutationObserver(() => this._queueSync());

    this._groupObserver.observe($group, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'maxlength', 'placeholder', 'readonly', 'required', 'type'],
    });

    this.sync();
    this._warnGroupComposition($group);
  }

  private _teardownGroup($group: HTMLFieldSetElement): void {
    $group.removeEventListener('input', this._onControlInput);
    $group.removeEventListener('change', this._onControlChange);
    $group.removeEventListener('focusin', this._onGroupFocusIn);
    $group.removeEventListener('focusout', this._onGroupFocusOut);
    $group.removeEventListener('invalid', this._onControlInvalid, true);
    $group.removeEventListener('compositionend', this._onCompositionEnd);
    this._groupObserver?.disconnect();
    this._$groupRef = null;
    this._grouped = false;
    this._$formRef?.deref()?.removeEventListener('reset', this._onFormReset);
    this._$formRef = null;
    this._restoreAssociations($group);
    this._$controlRef = null;
  }

  /** Re-resolves a group's primary control after its contents change. */
  private _syncGroupControl(): void {
    const $group = this.group;

    if (!$group) {
      return;
    }

    const $controls = groupControls($group);
    const $primary =
      $controls.find(
        ($control) =>
          $control instanceof HTMLTextAreaElement ||
          ($control instanceof HTMLInputElement && TEXT_INPUT_TYPES.has($control.type)),
      ) ??
      $controls[0] ??
      null;

    this._$controlRef = $primary ? new WeakRef($primary) : null;
    this._hasControl = $primary !== null;
  }

  private _setupControl($control: RCFieldControl | null): void {
    this._$controlRef = $control ? new WeakRef($control) : null;

    const $provider = $control?.parentElement?.matches('[data-rc-field-control]')
      ? $control.parentElement
      : null;

    this._$controlProviderRef = $provider ? new WeakRef($provider) : null;
    this._hasControl = $control !== null;
    this._focused = false;
    this._validationAttempted = false;
    this._nativeInvalid = false;
    this._validationMessage = '';

    if (!$control) {
      this._syncSlots();
      this._syncState();

      return;
    }

    $control.addEventListener('input', this._onControlInput);
    $control.addEventListener('change', this._onControlChange);
    $control.addEventListener('focus', this._onControlFocus);
    $control.addEventListener('blur', this._onControlBlur);
    $control.addEventListener('invalid', this._onControlInvalid);
    $control.addEventListener('compositionend', this._onCompositionEnd);

    $provider?.addEventListener('focusin', this._onProviderFocusIn);
    $provider?.addEventListener('focusout', this._onProviderFocusOut);

    this._controlObserver ??= new MutationObserver(() => this._queueSync());

    this._controlObserver.observe($control, {
      attributes: true,
      attributeFilter: ['disabled', 'maxlength', 'placeholder', 'readonly', 'required', 'type'],
    });

    this.sync();
    this._warnComposition($control);
  }

  private _teardownControl($control: RCFieldControl | null): void {
    if (!$control) {
      return;
    }

    $control.removeEventListener('input', this._onControlInput);
    $control.removeEventListener('change', this._onControlChange);
    $control.removeEventListener('focus', this._onControlFocus);
    $control.removeEventListener('blur', this._onControlBlur);
    $control.removeEventListener('invalid', this._onControlInvalid);
    $control.removeEventListener('compositionend', this._onCompositionEnd);

    const $provider = this._$controlProviderRef?.deref();

    $provider?.removeEventListener('focusin', this._onProviderFocusIn);
    $provider?.removeEventListener('focusout', this._onProviderFocusOut);
    this._$controlProviderRef = null;
    this._controlObserver?.disconnect();
    this._$formRef?.deref()?.removeEventListener('reset', this._onFormReset);
    this._$formRef = null;
    this._restoreAssociations($control);
  }

  private _syncForm(): void {
    const $form = this.control?.form ?? null;
    const $previousForm = this._$formRef?.deref() ?? null;

    if ($form === $previousForm) {
      return;
    }

    $previousForm?.removeEventListener('reset', this._onFormReset);
    $form?.addEventListener('reset', this._onFormReset);
    this._$formRef = $form ? new WeakRef($form) : null;
  }

  private _queueSync(): void {
    queueMicrotask(() => {
      if (this.isConnected) {
        this.sync();
      }
    });
  }

  private readonly _onControlInput = (): void => {
    this._syncState();

    if (this.controls.some(($control) => !$control.validity.valid)) {
      return;
    }

    this._nativeInvalid = false;
    this._validationMessage = '';
    this._syncState();
    this._syncAssociations();
  };

  private readonly _onControlChange = (): void => this.sync();

  private readonly _onControlFocus = (): void => {
    this._focused = true;
    this._reflectStates();
  };

  private readonly _onControlBlur = (): void => {
    this._focused = false;
    this._syncState();
  };

  private readonly _onProviderFocusIn = (): void => {
    this._focused = true;
    this._reflectStates();
  };

  private readonly _onProviderFocusOut = (): void => {
    this._focused = false;
    this._syncState();
  };

  private readonly _onGroupFocusIn = (): void => {
    this._focused = true;
    this._reflectStates();
  };

  /** Moving focus between the group's own controls keeps the field focused. */
  private readonly _onGroupFocusOut = (event: FocusEvent): void => {
    const $next = event.relatedTarget;

    if ($next instanceof Node && this.group?.contains($next)) {
      return;
    }

    this._focused = false;
    this._syncState();
  };

  private readonly _onControlInvalid = (event: Event): void => {
    const $target = event.target;

    const message =
      $target instanceof HTMLInputElement ||
      $target instanceof HTMLTextAreaElement ||
      $target instanceof HTMLSelectElement
        ? $target.validationMessage
        : (this.control?.validationMessage ?? '');

    this._validationAttempted = true;
    this._nativeInvalid = true;
    this._validationMessage = message;
    this._syncState();
    this._syncAssociations();
  };

  private readonly _onCompositionEnd = (): void => this._syncState();

  private readonly _onFormReset = (): void => {
    this._validationAttempted = false;
    this._nativeInvalid = false;
    this._validationMessage = '';
    this._queueSync();
  };

  private _syncState(): void {
    const $control = this.control;

    this._hasControl = $control !== null;

    this._populated =
      $control instanceof HTMLSelectElement
        ? $control.multiple
          ? $control.selectedOptions.length > 0
          : Boolean($control.selectedOptions[0]?.label.trim())
        : Boolean($control?.value);

    const $group = this.group;
    const $controls = this.controls;

    this._disabled = $group
      ? $group.disabled || ($controls.length > 0 && $controls.every(($item) => $item.disabled))
      : this._effectiveDisabled($control);

    this._readOnly = $control instanceof HTMLSelectElement ? false : ($control?.readOnly ?? false);
    this._required = $controls.some(($item) => $item.required);
    this._multiline = !$group && $control instanceof HTMLTextAreaElement;

    if ($control && this._validationAttempted) {
      const $invalid = $controls.find(($item) => !$item.validity.valid);

      this._nativeInvalid = $invalid !== undefined;
      this._validationMessage = $invalid?.validationMessage ?? '';
    }

    this._reflectStates();
  }

  /**
   * A control provider may disable its native control for a reason unrelated to the field's
   * own enabled/disabled intent (`rc-select`'s picker guard force-disables a `multiple` native
   * select to defeat a GeckoView label-activation bug, entirely independent of author intent).
   * Prefer the provider's own `disabled` property, when it exposes one, over the raw control's
   * — the same precedence `focus()`/`blur()` already give the provider over the control.
   */
  private _effectiveDisabled($control: RCFieldControl | null): boolean {
    const $provider = this._$controlProviderRef?.deref();

    if ($provider && 'disabled' in $provider && typeof $provider.disabled === 'boolean') {
      return $provider.disabled;
    }

    return $control?.disabled ?? false;
  }

  private _reflectStates(): void {
    this.toggleAttribute('data-focused', this._focused);
    this.toggleAttribute('data-populated', this._populated);
    this.toggleAttribute('data-disabled', this._disabled);
    this.toggleAttribute('data-readonly', this._readOnly);
    this.toggleAttribute('data-required', this._required);
    this.toggleAttribute('data-invalid', this._effectiveInvalid());
    this.toggleAttribute('data-multiline', this._multiline);
    this.toggleAttribute('data-has-label', this._hasLabel);
    this.toggleAttribute('data-validation-attempted', this._validationAttempted);
    this.toggleAttribute('data-control-provider', this._$controlProviderRef?.deref() !== undefined);
    this.toggleAttribute('data-group', this._grouped);
  }

  private _effectiveInvalid(): boolean {
    return this.invalid || (this._validationAttempted && this._nativeInvalid);
  }

  private _syncSlots(): void {
    this._hasLabel = this._hasSlottedContent('label');
    this._hasLeading = this._hasSlottedContent('leading');
    this._hasTrailing = this._hasSlottedContent('trailing');
    this._hasPrefix = this._hasSlottedContent('prefix');
    this._hasSuffix = this._hasSlottedContent('suffix');
    this._hasHint = this._hasSlottedContent('hint');
    this._hasError = this._hasSlottedContent('error');
  }

  private _hasSlottedContent(slotName: string): boolean {
    return this.querySelector(`:scope > [slot='${slotName}']`) !== null;
  }

  private _syncAssociations(): void {
    const $control = this.control;

    if (!$control) {
      return;
    }

    const $group = this.group;
    // A group's description belongs to the fieldset, announced on entering the group.
    const $described: HTMLElement = $group ?? $control;

    this._restoreAssociations($described, false);

    const $label = this.querySelector<HTMLLabelElement>(":scope > label[slot='label']");

    if ($label && !$label.htmlFor && !$group) {
      const controlId = this._ensureId($control, 'control');

      $label.htmlFor = controlId;
      this._managedLabel = { $label, htmlFor: controlId };
    }

    const descriptionIds: string[] = [];
    const $hint = this.querySelector<HTMLElement>(":scope > [slot='hint']");
    const $error = this.querySelector<HTMLElement>(":scope > [slot='error']");

    if ($hint && !this._effectiveInvalid()) {
      descriptionIds.push(this._ensureId($hint, 'hint'));
    }

    if ($error && this._effectiveInvalid()) {
      descriptionIds.push(this._ensureId($error, 'error'));
    }

    if (descriptionIds.length) {
      const authorIds = ($described.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter(Boolean);
      const ids = [...new Set([...authorIds, ...descriptionIds])];

      $described.setAttribute('aria-describedby', ids.join(' '));
      this._managedDescriptionIds = new Set(descriptionIds);
    }

    if (this._effectiveInvalid()) {
      // A forced `invalid` marks the primary control; native failures mark each failing one.
      const $invalid = $group
        ? this.controls.filter(($item) => this._validationAttempted && !$item.validity.valid)
        : [$control];

      for (const $item of $invalid.length ? $invalid : [$control]) {
        if (!$item.hasAttribute('aria-invalid')) {
          $item.setAttribute('aria-invalid', 'true');
          this._managedAriaInvalid.add($item);
        }
      }
    }
  }

  private _restoreAssociations($described: HTMLElement, restoreIds = true): void {
    if (this._managedDescriptionIds.size) {
      const ids = ($described.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((id) => id && !this._managedDescriptionIds.has(id));

      if (ids.length) {
        $described.setAttribute('aria-describedby', ids.join(' '));
      } else {
        $described.removeAttribute('aria-describedby');
      }
    }

    this._managedDescriptionIds.clear();

    for (const $item of this._managedAriaInvalid) {
      if ($item.getAttribute('aria-invalid') === 'true') {
        $item.removeAttribute('aria-invalid');
      }
    }

    this._managedAriaInvalid.clear();

    const managedLabel = this._managedLabel;

    if (managedLabel && managedLabel.$label.htmlFor === managedLabel.htmlFor) {
      managedLabel.$label.removeAttribute('for');
    }

    this._managedLabel = null;

    if (restoreIds) {
      for (const { $element, id } of this._managedIds) {
        if ($element.id === id) {
          $element.removeAttribute('id');
        }
      }

      this._managedIds = [];

      if (this._managedControlId && $described.id === this._managedControlId) {
        $described.removeAttribute('id');
      }

      this._managedControlId = null;
    }
  }

  private _ensureId($element: HTMLElement, purpose: string): string {
    if ($element.id) {
      return $element.id;
    }

    const id = `rc-field-${++fieldId}-${purpose}`;

    $element.id = id;

    if ($element === this.control) {
      this._managedControlId = id;
    } else {
      this._managedIds.push({ $element, id });
    }

    return id;
  }

  private _warnGroupComposition($group: HTMLFieldSetElement): void {
    if (!import.meta.env.DEV) {
      return;
    }

    if (!$group.querySelector(':scope > legend')) {
      console.warn(
        '[rc-field] A grouped field needs a <legend> as the first child of its <fieldset> to name the group.',
        $group,
      );
    }

    if (this.querySelector(":scope > [slot='label']")) {
      console.warn(
        '[rc-field] A grouped field is labeled by its <legend>; remove the slotted label.',
        this,
      );
    }

    for (const $control of groupControls($group)) {
      if (
        !$control.labels?.length &&
        !$control.getAttribute('aria-label') &&
        !$control.getAttribute('aria-labelledby')
      ) {
        console.warn(
          '[rc-field] Each grouped control needs its own accessible name, such as aria-label.',
          $control,
        );
      }
    }
  }

  private _warnComposition($control: RCFieldControl): void {
    if (!import.meta.env.DEV) {
      return;
    }

    const $controls = getDirectChildren<RCFieldControl>(this, CONTROL_SELECTOR);

    if ($controls.length > 1) {
      console.warn(
        '[rc-field] Multiple native controls found. Place exactly one input or textarea inside <rc-field>.',
        this,
      );
    }

    if ($control instanceof HTMLInputElement && !TEXT_INPUT_TYPES.has($control.type)) {
      console.warn(
        `[rc-field] Input type "${$control.type}" is not a text-field control. Use a text-like input or textarea.`,
        $control,
      );
    }

    if (
      !$control.labels?.length &&
      !$control.getAttribute('aria-label') &&
      !$control.getAttribute('aria-labelledby')
    ) {
      console.warn(
        '[rc-field] Native control has no accessible name. Add a slotted label, an ancestor label, aria-label, or aria-labelledby.',
        $control,
      );
    }
  }

  private _handleSurfaceClick(event: MouseEvent): void {
    const $control = this.control;
    const $origin = event.composedPath()[0];

    if (!$control || !($origin instanceof Element) || $origin === $control) {
      return;
    }

    const $provider = this._$controlProviderRef?.deref();

    if ($provider && $origin.closest("label[slot='label']")) {
      event.preventDefault();
      $provider.focus();

      return;
    }

    if ($origin.closest('button, a, input, textarea, select, [contenteditable], [tabindex]')) {
      return;
    }

    ($provider ?? $control).focus();
  }

  private _slotClass(hasContent: boolean): string {
    return hasContent ? '' : 'empty-slot';
  }

  protected override render() {
    const invalid = this._effectiveInvalid();
    const $control = this.control;
    const length = $control?.value.length ?? 0;
    const maxLength = $control instanceof HTMLSelectElement ? -1 : ($control?.maxLength ?? -1);
    const counterText = maxLength >= 0 ? `${length} / ${maxLength}` : String(length);
    const hasError = invalid && (this._hasError || this._validationMessage);
    const hasSupporting = this._hasHint || hasError || this.counter;

    return html`
      <div
        id="field"
        part="field"
        class=${this._hasControl ? '' : 'empty'}
        @click=${this._handleSurfaceClick}
      >
        <span id="leading" part="leading" class=${this._slotClass(this._hasLeading)}>
          <slot name="leading" @slotchange=${this._queueSync}></slot>
        </span>
        <span id="content" part="content">
          <span id="label" part="label" class=${this._slotClass(this._hasLabel)}>
            <slot name="label" @slotchange=${this._queueSync}></slot>
          </span>
          <span id="control" part="control">
            <span id="prefix" part="prefix" class=${this._slotClass(this._hasPrefix)}>
              <slot name="prefix" @slotchange=${this._queueSync}></slot>
            </span>
            <slot @slotchange=${this._queueSync}></slot>
            <span id="suffix" part="suffix" class=${this._slotClass(this._hasSuffix)}>
              <slot name="suffix" @slotchange=${this._queueSync}></slot>
            </span>
          </span>
        </span>
        <span id="trailing" part="trailing" class=${this._slotClass(this._hasTrailing)}>
          <slot name="trailing" @slotchange=${this._queueSync}></slot>
        </span>
      </div>
      <div id="supporting" part="supporting-text" ?hidden=${!hasSupporting}>
        <span id="hint" part="hint" ?hidden=${hasError}>
          <slot name="hint" @slotchange=${this._queueSync}></slot>
        </span>
        <span id="error" part="error" ?hidden=${!hasError}>
          <slot name="error" @slotchange=${this._queueSync}>${this._validationMessage}</slot>
        </span>
        <span id="counter" part="counter" ?hidden=${!this.counter}>${counterText}</span>
      </div>
    `;
  }
}
