import { LitElement, html } from 'lit';

import { syncDefaultAttribute } from '@rcarls/rc-common';

import pageTurnerPageStyles from './rc-page-turner-page.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-page-turner-page': RCPageTurnerPage;
  }
}

/** How the parent `rc-page-turner` currently presents a page. */
export type RCPageTurnerPagePresentation =
  | 'hidden'
  | 'adjacent'
  | 'active'
  | 'revealed'
  | 'turning';

const PRESENTATION_STATES = ['adjacent', 'active', 'revealed', 'turning'] as const;

/**
 * One page of an `rc-page-turner`. Authored content stays exactly as slotted,
 * never cloned or re-parented, and stays connected while the page is hidden,
 * so form state, focusable descendants, and `id` references survive every
 * turn.
 *
 * While not shown, the page is `inert` and `aria-hidden`, skips its own
 * rendering with `content-visibility: hidden`, and paints nothing.
 *
 * Custom states, set by the parent `rc-page-turner`:
 *
 * - `active`: the current page.
 * - `adjacent`: a page next to the current one, laid out but not painted, so
 *   turning to it only has to paint it.
 * - `revealed`: the page a turn uncovers or covers, shown beneath the
 *   turning page for the length of the turn.
 * - `turning`: the page moving during a turn, lifted above the page beneath
 *   it.
 *
 * @slot - Page content.
 *
 * @cssprop [--rc-page-turner-page-background=Canvas] - Page surface. Keep it
 *   opaque: a turning page has to hide the page beneath it.
 * @cssprop [--rc-page-turner-page-color=CanvasText] - Page foreground color.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-page-turner rc-page-turner documentation}
 */
export class RCPageTurnerPage extends LitElement {
  static override styles = pageTurnerPageStyles;

  private readonly _internals: ElementInternals;
  private _presentation: RCPageTurnerPagePresentation = 'hidden';
  private _writtenLabel: string | null = null;
  private _writtenRoleDescription: string | null = null;
  private _writtenTabIndex: string | null = null;

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._internals.role = 'group';
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'group');
    }

    // A focus target when a turn moves focus out of the departing page.
    this._writtenTabIndex = syncDefaultAttribute(this, 'tabindex', '-1', this._writtenTabIndex);
  }

  /** Current presentation. Internal integration point for `rc-page-turner`. */
  get presentation(): RCPageTurnerPagePresentation {
    return this._presentation;
  }

  /**
   * Applies a presentation synchronously, without a render pass, so a turn's
   * writes land in the same frame as its animation. `current` is whether the
   * page is the turner's current page, which alone decides whether it is
   * reachable: a page turning in is current while it moves, a page turning
   * away is not. Internal integration point for `rc-page-turner`, not a
   * public API.
   */
  present(presentation: RCPageTurnerPagePresentation, current = presentation === 'active'): void {
    this._presentation = presentation;

    const shown = presentation !== 'hidden' && presentation !== 'adjacent';

    this.toggleAttribute('inert', !current);
    this.toggleAttribute('aria-hidden', !current);

    const states = this._internals.states;

    if (!states) {
      // Without CustomStateSet, keep the page usable: shown pages stay
      // visible through an inline override of the hidden default.
      this.style.visibility = shown ? 'visible' : '';
      this.style.contentVisibility = shown || presentation === 'adjacent' ? 'visible' : '';

      return;
    }

    for (const state of PRESENTATION_STATES) {
      if (state === presentation) {
        states.add(state);
      } else {
        states.delete(state);
      }
    }
  }

  /**
   * Sets the default accessible name and role description. Internal
   * integration point for `rc-page-turner`; an author `aria-label`,
   * `aria-labelledby`, or `aria-roledescription` wins.
   */
  describe(label: string, roleDescription: string): void {
    if (!this.hasAttribute('aria-labelledby')) {
      this._writtenLabel = syncDefaultAttribute(this, 'aria-label', label, this._writtenLabel);
    }

    this._writtenRoleDescription = syncDefaultAttribute(
      this,
      'aria-roledescription',
      roleDescription,
      this._writtenRoleDescription,
    );
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}
