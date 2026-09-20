import { LitElement, css, html, nothing } from 'lit';
import type { ComplexAttributeConverter, PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { NativeChildController, warnMissingDirectChild } from '@rcarls/rc-common';

declare global {
  interface HTMLElementTagNameMap {
    'rc-progress': RCProgress;
  }

  interface HTMLElementEventMap {
    'rc-progress-complete': CustomEvent<Record<string, never>>;
  }
}

type DisplayValue = 'inline-start' | 'inline-end' | 'overlay' | null;

/**
 * Normalises the `display` attribute.
 * A bare boolean attribute (`display` with no value) maps to `'overlay'` so
 * the reflected attribute is always an explicit string, never an empty string.
 */
const displayConverter: ComplexAttributeConverter<DisplayValue> = {
  fromAttribute(v: string | null): DisplayValue {
    if (v === null) {
      return null;
    }

    if (v === '' || v === 'overlay') {
      return 'overlay';
    }

    if (v === 'inline-start') {
      return 'inline-start';
    }

    if (v === 'inline-end') {
      return 'inline-end';
    }

    return null;
  },
  toAttribute(v: DisplayValue): string | null {
    return v;
  },
};

/**
 * Enhances a native `<progress>` with a custom track/fill and an optional
 * formatted value display, following the same progressive-enhancement shape
 * as `rc-slider`.
 *
 * Deliberately does one job: it does not render a dialog, own any phase
 * state, or assume anything about where it's placed. Compose it with
 * `rc-dialog`, a card, or an inline status row as needed.
 *
 * Label association:
 * - Explicit `for`/`id`: `<label for="sync">Sync</label><rc-progress><progress id="sync" …></rc-progress>`
 * - Direct `aria-label` on the `<progress>`: `<progress aria-label="Sync" …>`
 *
 * These patterns all work without JavaScript. The component does not render
 * a label itself — the consumer is responsible for accessible naming.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-progress rc-progress docs}
 *
 * @slot - Place a `<progress>` element here.
 * @slot value-display - Optional replacement for the rendered value text.
 *
 * @fires rc-progress-complete - Fires once when `value` reaches `max` while
 *   not indeterminate. Does not re-fire on subsequent updates while already
 *   at max.
 *
 * @attr value - Current progress value. Host writes are silent.
 * @attr default-value - Initial uncontrolled value. Has no effect after the first
 *   host write.
 * @attr indeterminate - When present, the component removes the native `<progress>`'s
 *   `value` attribute instead of asking the consumer to bind `undefined` to it.
 * @attr display - Controls the live value display: absent (none), `overlay` (centered on
 *   the bar), `inline-start`, or `inline-end`.
 * @attr value-text - Screen-reader value text, forwarded as `aria-valuetext` on the
 *   native `<progress>`. Also used as the default formatted display text when set.
 * @attr orientation - Orientation, forwarded to `aria-orientation`: `horizontal` or
 *   `vertical`.
 * @attr disabled - Visual-only dimming; native `<progress>` has no functional disabled state.
 *
 * @cssprop [--rc-progress-control-size=0.5rem] - Track hit-area block size.
 * @cssprop [--rc-progress-vertical-size=12.5rem] - Track length when `orientation="vertical"`.
 * @cssprop [--rc-progress-gap=var(--rc-control-gap)] - Gap between track and inline value display.
 * @cssprop [--rc-progress-track-background=CanvasText] - Unfilled track color.
 * @cssprop [--rc-progress-track-opacity=0.25] - Unfilled track opacity.
 * @cssprop [--rc-progress-track-radius=var(--rc-control-radius)] - Track border radius.
 * @cssprop [--rc-progress-fill-background=var(--rc-accent)] - Filled track color.
 * @cssprop [--rc-progress-fill-transition-duration=150ms] - Determinate fill transition duration.
 * @cssprop [--rc-progress-fill-transition-easing=ease-out] - Determinate fill transition easing.
 * @cssprop [--rc-progress-value-color=var(--rc-text-disabled)] - Value display text color.
 *
 * @csspart root - Root layout wrapper.
 * @csspart control - Track positioning wrapper.
 * @csspart track - Visual track.
 * @csspart fill - Filled progress segment.
 * @csspart value-display - Rendered value text.
 */
export class RCProgress extends LitElement {
  static override styles = css`
    :host {
      display: block;
      /*
       * translate() percentages resolve against the element's own box, not
       * the parent's, and its direction is physical, not logical — it does
       * not flip for RTL the way inset-inline-start does on its own. This
       * sign flips the indeterminate sweep's direction so it still travels
       * start-to-end in the document's actual writing direction.
       */
      --_rc-progress-indeterminate-direction: 1;
    }

    :host(:dir(rtl)) {
      --_rc-progress-indeterminate-direction: -1;
    }

    .rc-progress-root {
      display: grid;
      gap: var(--rc-progress-gap, var(--rc-control-gap, 0.5rem));
      align-items: center;
      font-family: var(--rc-font-family, inherit);
      font-size: var(--rc-font-size, inherit);
      line-height: var(--rc-line-height, normal);
    }

    .rc-progress-root[data-display='inline-start'] {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .rc-progress-root[data-display='inline-end'] {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .rc-progress-control {
      position: relative;
      display: block;
      min-width: 0;
      /*
       * Everything this wraps (the track, the fill, the slotted <progress>)
       * is position: absolute, contributing nothing to normal-flow height.
       * Without an explicit block-size here, this collapses to 0px and the
       * whole bar renders invisible whenever no value-display text (the
       * only other thing that could give the shared grid row a height) is
       * shown alongside it — the default, since display is unset unless a
       * consumer opts into inline-start/inline-end/overlay.
       */
      block-size: var(--rc-progress-control-size, 0.5rem);
    }

    .rc-progress-track,
    .rc-progress-fill {
      position: absolute;
      pointer-events: none;
    }

    .rc-progress-track {
      inset: 0;
      block-size: var(--rc-progress-control-size, 0.5rem);
      background: var(--rc-progress-track-background, CanvasText);
      opacity: var(--rc-progress-track-opacity, 0.25);
      border-radius: var(--rc-progress-track-radius, var(--rc-control-radius, 0));
      overflow: hidden;
      z-index: 0;
    }

    ::slotted(progress) {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      margin: 0;
      opacity: 0;
      z-index: 2;
    }

    .rc-progress-fill {
      inset-block: 0;
      inset-inline-start: 0;
      background: var(--rc-progress-fill-background, var(--rc-accent, Highlight));
      border-radius: inherit;
      z-index: 1;
      transition: inline-size var(--rc-progress-fill-transition-duration, 150ms)
        var(--rc-progress-fill-transition-easing, ease-out);
    }

    :host([indeterminate]) .rc-progress-fill {
      inline-size: 40% !important;
      /*
       * A loop has no beginning or end to decelerate into or accelerate out
       * of, so it uses a constant, linear pace; an eased loop visibly pulses
       * at each cycle boundary.
       */
      animation: rc-progress-indeterminate 1.4s linear infinite;
    }

    /*
     * translate() moves on the compositor; inset-inline-start forces layout
     * on every frame. The fill's own box is 40% of the track (its inline-
     * size), so a translate of N% moves it N% of that 40%, not of the
     * track: -100% (of self) lands at -40% of the track, matching where
     * this keyframe used to start, and 250% (of self) lands at 100%.
     */
    @keyframes rc-progress-indeterminate {
      0% {
        translate: calc(var(--_rc-progress-indeterminate-direction) * -100%) 0;
      }
      100% {
        translate: calc(var(--_rc-progress-indeterminate-direction) * 250%) 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      /*
       * The determinate fill's inline-size transition is spatial (a real
       * width change), so it drops to 0ms. The indeterminate loop is an
       * unbounded, continuous translate sweeping most of the track, which
       * has no meaningful "shortened" form, so it stops outright rather
       * than looping faster; the fill still shows a static bar via its
       * existing 40% inline-size.
       */
      :host(:not([indeterminate])) .rc-progress-fill {
        transition-duration: 0ms;
      }

      :host([indeterminate]) .rc-progress-fill {
        animation: none;
        translate: none;
      }
    }

    .rc-progress-value {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      color: var(--rc-progress-value-color, var(--rc-text-disabled, GrayText));
    }

    .rc-progress-root[data-display='overlay'] .rc-progress-value {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 3;
    }

    :host([orientation='vertical']) {
      display: inline-block;
    }

    :host([orientation='vertical']) .rc-progress-control {
      inline-size: var(--rc-progress-control-size, 0.5rem);
      block-size: var(--rc-progress-vertical-size, 12.5rem);
    }

    :host([orientation='vertical']) .rc-progress-track {
      inline-size: var(--rc-progress-control-size, 0.5rem);
      block-size: auto;
    }

    :host([orientation='vertical']) .rc-progress-fill {
      inset-inline: 0;
      inset-block-start: auto;
    }

    :host([disabled]) {
      opacity: 0.5;
    }
  `;

  private _value: number | undefined;
  private _defaultValue: number | undefined;
  private _valueInitialized = false;

  /** Current progress value. */
  @property({ type: Number })
  get value(): number {
    return this._value ?? this._defaultValue ?? this._nativeProgressValue;
  }

  set value(value: number | undefined) {
    const oldValue = this.value;

    this._value = value ?? undefined;
    this._valueInitialized = true;
    this._applyValueToNative(this.value);
    this.requestUpdate('value', oldValue);
  }

  /** Initial uncontrolled value. Has no effect after the first host write. */
  @property({ type: Number, attribute: 'default-value' })
  get defaultValue(): number | undefined {
    return this._defaultValue;
  }

  set defaultValue(value: number | undefined) {
    const oldValue = this._defaultValue;

    this._defaultValue = value;

    if (!this._valueInitialized && this._value === undefined && value !== undefined) {
      this._applyValueToNative(value);
      this.requestUpdate('value', undefined);
    }

    this.requestUpdate('defaultValue', oldValue);
  }

  /**
   * Maximum progress value, read directly from the native `<progress>`
   * child's own `max` IDL property (native default `1`) rather than
   * duplicated as a separate host attribute — the consumer already owns it
   * by setting `max` on the slotted `<progress>` element.
   */
  get max(): number {
    return this._$nativeProgress?.max ?? 1;
  }

  /**
   * When present, the component removes the native `<progress>`'s `value`
   * attribute instead of asking the consumer to bind `undefined` to it —
   * binding `undefined` to a live `<progress>.value` throws.
   */
  @property({ type: Boolean, reflect: true }) indeterminate = false;

  /** Visual-only dimming; native `<progress>` has no functional disabled state. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /**
   * Controls the live value display.
   *
   * - Absent (default) — no value shown.
   * - `overlay` (or bare `display`) — centered on the bar.
   * - `display="inline-start"` — rendered before the track, inline in the grid.
   * - `display="inline-end"` — rendered after the track, inline in the grid.
   */
  @property({ reflect: true, converter: displayConverter })
  display: DisplayValue = null;

  /**
   * Screen-reader value text. When set, forwarded as `aria-valuetext` on the
   * native `<progress>` and used as the default formatted display text.
   */
  @property({ attribute: 'value-text' }) valueText = '';

  /** Orientation; reflected as an attribute and forwarded to `aria-orientation`. */
  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  private _$nativeProgress: HTMLProgressElement | null = null;
  private _completedDispatched = false;
  private _nativeValueBeforeIndeterminate: number | undefined;
  private _progressObserver: MutationObserver | null = null;

  private readonly _nativeProgressController = new NativeChildController<HTMLProgressElement>(
    this,
    {
      selector: ':scope > progress',
      observe: true,
      onChange: ($progress, $previous) => this._setupProgress($progress, $previous),
      onMissing: () => {
        if (import.meta.env.DEV) {
          warnMissingDirectChild(this, {
            selector: ':scope > progress',
            message: '[rc-progress] Requires a child <progress> element.',
          });
        }
      },
    },
  );

  override disconnectedCallback(): void {
    this._progressObserver?.disconnect();

    super.disconnectedCallback();
  }

  override updated(changed: PropertyValues): void {
    const $progress = this._$nativeProgress;

    if ($progress) {
      this._syncAriaAttributes($progress);
    }

    if (changed.has('indeterminate')) {
      this._applyIndeterminate();
    }

    if (changed.has('value') || changed.has('indeterminate')) {
      this._checkComplete();
    }
  }

  override render() {
    const $progress = this._$nativeProgress;

    if (!$progress) {
      return nothing;
    }

    const valueDisplay = html`
      <span part="value-display" class="rc-progress-value" aria-hidden="true">
        <slot name="value-display">${this._displayText}</slot>
      </span>
    `;

    return html`
      <div
        part="root"
        class="rc-progress-root"
        data-display=${this.display ?? nothing}
        data-orientation=${this.orientation}
        data-disabled=${this.disabled ? '' : nothing}
        data-has-value-text=${this.valueText ? '' : nothing}
      >
        ${this.display === 'inline-start' ? valueDisplay : nothing}

        <span part="control" class="rc-progress-control">
          <span part="track" class="rc-progress-track" aria-hidden="true">
            <span
              part="fill"
              class="rc-progress-fill"
              style=${ifDefined(this.indeterminate ? undefined : this._fillStyle())}
            ></span>
          </span>

          <slot @slotchange=${this._onDefaultSlotChange}></slot>
          ${this.display === 'overlay' ? valueDisplay : nothing}
        </span>

        ${this.display === 'inline-end' ? valueDisplay : nothing}
      </div>
    `;
  }

  private get _displayText(): string {
    if (this.valueText) {
      return this.valueText;
    }

    if (this.indeterminate) {
      return '';
    }

    const percent = this.max > 0 ? (this.value / this.max) * 100 : 0;

    return `${Math.round(percent)}%`;
  }

  private get _nativeProgressValue(): number {
    const value = this._$nativeProgress?.value;

    return value === undefined || isNaN(value) ? 0 : value;
  }

  private _setupProgress(
    $progress: HTMLProgressElement | null,
    $previous?: HTMLProgressElement | null,
  ): void {
    void $previous;

    this._progressObserver?.disconnect();
    this._progressObserver = null;

    if (!$progress) {
      this._$nativeProgress = null;

      return;
    }

    this._$nativeProgress = $progress;
    this._applyInitialValueToNative();
    this._applyIndeterminate();

    if (typeof MutationObserver === 'function') {
      this._progressObserver = new MutationObserver(() => {
        if (this.indeterminate) {
          this._applyIndeterminate();
        }

        this.requestUpdate();
        this._checkComplete();
      });

      this._progressObserver.observe($progress, {
        attributes: true,
        attributeFilter: ['max', 'value'],
      });
    }

    this.requestUpdate();
  }

  private _onDefaultSlotChange = (): void => {
    this._nativeProgressController.sync();
    this.requestUpdate();
  };

  private _applyInitialValueToNative(): void {
    if (this._value !== undefined) {
      this._applyValueToNative(this._value);

      return;
    }

    if (this._defaultValue !== undefined) {
      this._applyValueToNative(this._defaultValue);

      return;
    }

    // With no host-owned value, keep reading the live native control rather
    // than copying its initial value into component state. This preserves the
    // native element as the uncontrolled source of truth.
  }

  private _applyValueToNative(value: number): void {
    if (!this._$nativeProgress || this.indeterminate) {
      return;
    }

    this._$nativeProgress.value = value;
  }

  /**
   * Adds or removes the native `<progress>`'s `value` attribute/property to
   * reflect `indeterminate` — the one piece of state this component owns so
   * consumers never bind `undefined` to a live `<progress>.value` themselves.
   */
  private _applyIndeterminate(): void {
    const $progress = this._$nativeProgress;

    if (!$progress) {
      return;
    }

    if (this.indeterminate) {
      if ($progress.hasAttribute('value')) {
        this._nativeValueBeforeIndeterminate = $progress.value;
      }

      $progress.removeAttribute('value');
    } else {
      $progress.value =
        this._value ??
        this._defaultValue ??
        this._nativeValueBeforeIndeterminate ??
        this._nativeProgressValue;

      this._nativeValueBeforeIndeterminate = undefined;
    }
  }

  private _syncAriaAttributes($progress: HTMLProgressElement): void {
    if (this.valueText) {
      $progress.setAttribute('aria-valuetext', this.valueText);
    } else {
      $progress.removeAttribute('aria-valuetext');
    }

    if (this.orientation === 'vertical') {
      $progress.setAttribute('aria-orientation', 'vertical');
    } else {
      $progress.removeAttribute('aria-orientation');
    }
  }

  private _checkComplete(): void {
    const isComplete = !this.indeterminate && this.max > 0 && this.value >= this.max;

    if (isComplete && !this._completedDispatched) {
      this._completedDispatched = true;

      this.dispatchEvent(
        new CustomEvent('rc-progress-complete', { bubbles: true, composed: true }),
      );
    } else if (!isComplete) {
      this._completedDispatched = false;
    }
  }

  private _fillStyle(): string {
    const percent = this.max > 0 ? Math.min(100, Math.max(0, (this.value / this.max) * 100)) : 0;

    if (this.orientation === 'vertical') {
      return `inset-block-start:${(100 - percent).toFixed(3)}%;block-size:${percent.toFixed(3)}%`;
    }

    return `inline-size:${percent.toFixed(3)}%`;
  }
}

export default RCProgress;
