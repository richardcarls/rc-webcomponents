import { LitElement, html, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';

import {
  NativeChildController,
  getDirectChildren,
  warnMissingDirectChild,
} from '@rcarls/rc-common';

import fieldStyles from './rc-field.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-field': RCField;
  }
}

export type RCFieldControl = HTMLInputElement | HTMLTextAreaElement;

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

/**
 * Accessible field wrapper for a native input or textarea with labels and supporting text.
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
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-field rc-field docs}
 * @see {@link https://m3.material.io/components/text-fields/overview Material Design 3 text fields}
 *
 * @slot - Required direct native `<input>` or `<textarea>` control
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
 * @attr [data-populated] - Present while the native control has a value
 * @attr [data-disabled] - Mirrors the native control's disabled state
 * @attr [data-readonly] - Mirrors the native control's readonly state
 * @attr [data-required] - Mirrors the native control's required state
 * @attr [data-invalid] - Present while an attempted or forced validation state is invalid
 * @attr [data-multiline] - Present when the native control is a textarea
 * @attr [data-has-label] - Present when the field has content in its label slot
 * @attr [data-validation-attempted] - Present after the native control dispatches `invalid`
 *
 * @cssprop [--rc-field-min-block-size=2.5rem] - Minimum field surface block size
 * @cssprop [--rc-field-gap=0.5rem] - Gap between leading, content, and trailing regions
 * @cssprop [--rc-field-padding=0.5rem 0.75rem] - Field surface padding
 * @cssprop [--rc-field-border=1px solid ButtonBorder] - Field surface border
 * @cssprop [--rc-field-radius=0.125rem] - Field surface corner radius
 * @cssprop [--rc-field-background=Field] - Field surface background
 * @cssprop [--rc-field-color=FieldText] - Input and affix text color
 * @cssprop [--rc-field-label-color=CanvasText] - Label color
 * @cssprop [--rc-field-control-gap=0.25rem] - Gap between control and prefix or suffix
 * @cssprop [--rc-field-supporting-gap=0.5rem] - Gap between supporting text and counter
 * @cssprop [--rc-field-supporting-padding-block-start=0.25rem] - Supporting text top padding
 * @cssprop [--rc-field-supporting-padding-inline=0.75rem] - Supporting text inline padding
 * @cssprop [--rc-field-supporting-color=CanvasText] - Hint and counter color
 * @cssprop [--rc-field-supporting-font-size=0.75rem] - Hint, error, and counter font size
 * @cssprop [--rc-field-error-color=Mark] - Invalid outline, label, and error color
 * @cssprop [--rc-field-disabled-opacity=0.6] - Disabled field opacity
 * @cssprop [--rc-field-focus-outline=2px solid Highlight] - Focus outline
 * @cssprop [--rc-field-focus-outline-offset=0] - Focus outline offset
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
  private _validationAttempted = false;

  @state()
  private _nativeInvalid = false;

  @state()
  private _validationMessage = '';

  private _$controlRef: WeakRef<RCFieldControl> | null = null;

  private _$formRef: WeakRef<HTMLFormElement> | null = null;

  private _controlObserver: MutationObserver | null = null;

  private _compositionObserver: MutationObserver | null = null;

  private _managedDescriptionIds = new Set<string>();

  private _managedIds: Array<{ $element: HTMLElement; id: string }> = [];

  private _managedLabel: { $label: HTMLLabelElement; htmlFor: string } | null = null;

  private _managedControlId: string | null = null;

  private _managedAriaInvalid = false;

  private readonly _controlController = new NativeChildController<RCFieldControl>(this, {
    selector: ':scope > input, :scope > textarea',
    observe: { childList: true },
    onChange: ($control, $previousControl) => this._setupControl($control, $previousControl),
    onMissing: () => {
      if (import.meta.env.DEV) {
        warnMissingDirectChild(this, {
          selector: ':scope > input, :scope > textarea',
          childDescription: 'native <input> or <textarea>',
        });
      }
    },
  });

  /** Returns the direct native control, or `null` when the field is incomplete. */
  get control(): RCFieldControl | null {
    return this._$controlRef?.deref() ?? null;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this._compositionObserver ??= new MutationObserver(() => this._queueSync());
    this._compositionObserver.observe(this, {
      childList: true,
      attributes: true,
      attributeFilter: ['slot'],
    });
  }

  override disconnectedCallback(): void {
    this._compositionObserver?.disconnect();
    this._teardownControl(this.control);

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
    this.control?.focus(options);
  }

  /** Removes focus from the native control. */
  override blur(): void {
    this.control?.blur();
  }

  /** Re-reads native value, validity, attributes, slots, and accessible relationships. */
  public sync(): void {
    this._controlController.sync();
    this._syncSlots();
    this._syncForm();
    this._syncState();
    this._syncAssociations();
  }

  private _setupControl(
    $control: RCFieldControl | null,
    $previousControl: RCFieldControl | null,
  ): void {
    if ($previousControl) {
      this._teardownControl($previousControl);
    }

    this._$controlRef = $control ? new WeakRef($control) : null;
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

    if (!this.control?.validity.valid) {
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

  private readonly _onControlInvalid = (): void => {
    this._validationAttempted = true;
    this._nativeInvalid = true;
    this._validationMessage = this.control?.validationMessage ?? '';
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
    this._populated = Boolean($control?.value);
    this._disabled = $control?.disabled ?? false;
    this._readOnly = $control?.readOnly ?? false;
    this._required = $control?.required ?? false;
    this._multiline = $control instanceof HTMLTextAreaElement;

    if ($control && this._validationAttempted) {
      this._nativeInvalid = !$control.validity.valid;
      this._validationMessage = this._nativeInvalid ? $control.validationMessage : '';
    }

    this._reflectStates();
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

    this._restoreAssociations($control, false);

    const $label = this.querySelector<HTMLLabelElement>(":scope > label[slot='label']");

    if ($label && !$label.htmlFor) {
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
      const authorIds = ($control.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter(Boolean);
      const ids = [...new Set([...authorIds, ...descriptionIds])];

      $control.setAttribute('aria-describedby', ids.join(' '));
      this._managedDescriptionIds = new Set(descriptionIds);
    }

    if (this._effectiveInvalid() && !$control.hasAttribute('aria-invalid')) {
      $control.setAttribute('aria-invalid', 'true');
      this._managedAriaInvalid = true;
    }
  }

  private _restoreAssociations($control: RCFieldControl, restoreIds = true): void {
    if (this._managedDescriptionIds.size) {
      const ids = ($control.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter((id) => id && !this._managedDescriptionIds.has(id));

      if (ids.length) {
        $control.setAttribute('aria-describedby', ids.join(' '));
      } else {
        $control.removeAttribute('aria-describedby');
      }
    }

    this._managedDescriptionIds.clear();

    if (this._managedAriaInvalid) {
      if ($control.getAttribute('aria-invalid') === 'true') {
        $control.removeAttribute('aria-invalid');
      }

      this._managedAriaInvalid = false;
    }

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

      if (this._managedControlId && $control.id === this._managedControlId) {
        $control.removeAttribute('id');
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

  private _warnComposition($control: RCFieldControl): void {
    if (!import.meta.env.DEV) {
      return;
    }

    const $controls = getDirectChildren<RCFieldControl>(this, ':scope > input, :scope > textarea');

    if ($controls.length > 1) {
      console.warn(
        '[rc-field] Multiple direct native controls found. Place exactly one input or textarea inside <rc-field>.',
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

    if ($origin.closest('button, a, input, textarea, select, [contenteditable], [tabindex]')) {
      return;
    }

    $control.focus();
  }

  private _slotClass(hasContent: boolean): string {
    return hasContent ? '' : 'empty-slot';
  }

  protected override render() {
    const invalid = this._effectiveInvalid();
    const $control = this.control;
    const length = $control?.value.length ?? 0;
    const maxLength = $control?.maxLength ?? -1;
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
