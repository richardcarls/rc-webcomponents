const NAVIGATION_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'] as const;

type NavigationKey = (typeof NAVIGATION_KEYS)[number];

type RCDisclosureElement = HTMLElement & {
  open: boolean;
};

function isNavigationKey(key: string): key is NavigationKey {
  return NAVIGATION_KEYS.includes(key as NavigationKey);
}

function isRCDisclosureElement($el: Element | null): $el is RCDisclosureElement {
  return $el?.localName === 'rc-disclosure';
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-accordion': RCAccordion;
  }
}

/**
 * Coordinates direct child details as a single-open group by default.
 *
 * Supports native details and rc-disclosure wrappers.
 *
 * @attr {boolean} multiple - Allows more than one panel open at a time.
 */
export class RCAccordion extends HTMLElement {
  private _$managedGroupNames = new Map<HTMLDetailsElement, string>();

  private _childrenObserver = new MutationObserver((records) => this._onChildrenChanged(records));

  static get observedAttributes(): string[] {
    return ['multiple', 'name'];
  }

  /** Allows more than one panel open at a time. */
  get multiple(): boolean {
    return this.hasAttribute('multiple');
  }

  set multiple(value: boolean) {
    this.toggleAttribute('multiple', value);
  }

  connectedCallback(): void {
    this._childrenObserver.observe(this, { childList: true, subtree: true });

    this.addEventListener('toggle', this._onDetailsToggle, true);
    this.addEventListener('keydown', this._onKeydown);

    this._syncNativeGroupNames();
    this._enforceSingleOpen();
  }

  disconnectedCallback(): void {
    this._childrenObserver.disconnect();

    this.removeEventListener('toggle', this._onDetailsToggle, true);
    this.removeEventListener('keydown', this._onKeydown);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) {
      return;
    }

    if (name === 'name' || name === 'multiple') {
      this._syncNativeGroupNames();
    }

    if (name === 'multiple' && !this.multiple) {
      this._enforceSingleOpen();
    }
  }

  private _$details(): HTMLDetailsElement[] {
    return Array.from(
      this.querySelectorAll<HTMLDetailsElement>(
        ':scope > details, :scope > rc-disclosure > details',
      ),
    );
  }

  private _$summaries(): HTMLElement[] {
    return this._$details()
      .map(($details) => $details.querySelector<HTMLElement>(':scope > summary'))
      .filter(($summary): $summary is HTMLElement => $summary !== null);
  }

  private _syncNativeGroupNames(): void {
    const groupName = this.getAttribute('name');
    const $details = this._$details();
    const $currentDetails = new Set($details);

    for (const [$el, managedName] of this._$managedGroupNames) {
      const shouldReleaseName =
        !$currentDetails.has($el) ||
        this.multiple ||
        !groupName ||
        managedName !== groupName ||
        $el.getAttribute('name') !== managedName;

      if (!shouldReleaseName) {
        continue;
      }

      if ($el.getAttribute('name') === managedName) {
        $el.removeAttribute('name');
      }

      this._$managedGroupNames.delete($el);
    }

    if (this.multiple || !groupName) {
      return;
    }

    for (const $el of $details) {
      if ($el.hasAttribute('name') && !this._$managedGroupNames.has($el)) {
        continue;
      }

      $el.setAttribute('name', groupName);
      this._$managedGroupNames.set($el, groupName);
    }
  }

  private _onKeydown = (e: KeyboardEvent): void => {
    if (e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    if (!isNavigationKey(e.key)) {
      return;
    }

    const $summaries = this._$summaries();

    if ($summaries.length === 0) {
      return;
    }

    const $active = document.activeElement as HTMLElement | null;
    const index = $active ? $summaries.indexOf($active) : -1;

    if (index === -1) {
      return;
    }

    e.preventDefault();

    if (e.key === 'Home') {
      const $firstSummary = $summaries.at(0);

      if (!$firstSummary) {
        return;
      }

      $firstSummary.focus();

      return;
    }

    if (e.key === 'End') {
      const $lastSummary = $summaries.at(-1);

      if (!$lastSummary) {
        return;
      }

      $lastSummary.focus();

      return;
    }

    const next =
      e.key === 'ArrowDown'
        ? (index + 1) % $summaries.length
        : (index - 1 + $summaries.length) % $summaries.length;

    const $nextSummary = $summaries.at(next);

    if (!$nextSummary) {
      return;
    }

    $nextSummary.focus();
  };

  private _onDetailsToggle = (e: Event): void => {
    const $opened = e.target;

    if (!($opened instanceof HTMLDetailsElement)) {
      return;
    }

    if (this.multiple) {
      return;
    }

    if (!$opened.open) {
      return;
    }

    this._enforceSingleOpen($opened);
  };

  private _setDetailsOpen($target: HTMLDetailsElement, open: boolean): void {
    const $parent = $target.parentElement;

    if (isRCDisclosureElement($parent)) {
      $parent.open = open;

      return;
    }

    $target.open = open;
  }

  private _onChildrenChanged(records: MutationRecord[]): void {
    this._syncNativeGroupNames();

    if (this.multiple) {
      return;
    }

    this._enforceSingleOpen(this._findAddedOpenDetails(records));
  }

  private _findAddedOpenDetails(records: MutationRecord[]): HTMLDetailsElement | undefined {
    const $details = this._$details();

    const $added = $details.filter(($el) =>
      records.some((record) =>
        Array.from(record.addedNodes).some(
          ($node) => $node === $el || ($node instanceof Element && $node.contains($el)),
        ),
      ),
    );

    for (let i = $added.length - 1; i >= 0; i -= 1) {
      const $el = $added.at(i);

      if (!$el) {
        continue;
      }

      if ($el.open) {
        return $el;
      }
    }

    return undefined;
  }

  private _enforceSingleOpen($target?: HTMLDetailsElement): void {
    const $details = this._$details();

    if ($target && !$details.includes($target)) {
      return;
    }

    const $openDetails = $details.filter(($el) => $el.open);

    if ($openDetails.length <= 1) {
      return;
    }

    const $keepOpen = $target ?? $openDetails.at(0);

    if (!$keepOpen) {
      return;
    }

    for (const $el of $openDetails) {
      if ($el !== $keepOpen) {
        this._setDetailsOpen($el, false);
      }
    }
  }
}

export default RCAccordion;
