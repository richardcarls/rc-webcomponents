import type { CSSProperties } from 'react';
import type * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import rust from 'highlight.js/lib/languages/rust';

import type {
  RCAppBarRef,
  RCBottomSheetRef,
  RCBottomSheetSnapDetail,
  RCButtonRef,
  RCButtonToggleDetail,
  RCDialogRef,
  RCDisclosureRef,
  RCListboxRef,
  RCMenuActivateDetail,
  RCMenuRef,
  RCNavigationRailRef,
  RCNavigationRailToggleDetail,
  RCRangeSliderRef,
  RCSearchBarRef,
  RCSegmentedButtonChangeDetail,
  RCSliderRef,
  RCSnackbarActionDetail,
  RCSnackbarCloseDetail,
  RCSnackbarRef,
  RCSwitchChangeDetail,
  RCTextareaRef,
  RCTransferListChangeDetail,
  RCTransferListRef,
  RCVirtualCanvasRef,
  RCVirtualCanvasRenderDetail,
  RCVirtualCanvasPointerDetail,
} from '@rcarls/rc-webcomponents/react';
import type { RCTextareaPluginAPI } from '@rcarls/rc-textarea';

hljs.registerLanguage('rust', rust);

import { createMarkdownPlugin } from '@rcarls/rc-textarea-plugin-markdown';
import { DemoFrame } from './DemoFrame';

type DetailEvent<T> = CustomEvent<T>;
type EventLogTarget = HTMLElement | null;

function useEventLog<T>(target: EventLogTarget, eventName: string, format: (detail: T) => string) {
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const $element = target;

    if (!$element) {
      return;
    }

    const handleEvent = (event: Event) => {
      setLog((current) => [format((event as DetailEvent<T>).detail), ...current].slice(0, 8));
    };

    $element.addEventListener(eventName, handleEvent);

    return () => {
      $element.removeEventListener(eventName, handleEvent);
    };
  }, [eventName, format, target]);

  return log;
}

function EventLog({
  entries,
  placeholder = 'Events will appear here...',
}: {
  entries: string[];
  placeholder?: string;
}) {
  return (
    <div className="demo-event-log">
      {entries.length ? (
        entries.map((entry, i) => <p key={i}>{entry}</p>)
      ) : (
        <p className="demo-placeholder">{placeholder}</p>
      )}
    </div>
  );
}

export function BottomSheetDemo() {
  const [sheetEl, setSheetEl] = useState<RCBottomSheetRef | null>(null);
  const log = useEventLog<RCBottomSheetSnapDetail>(
    sheetEl,
    'rc-bottom-sheet-snap',
    ({ index, height, trigger }) =>
      `rc-bottom-sheet-snap -> ${index} (${Math.round(height)}px, ${trigger})`,
  );

  return (
    <DemoFrame>
      <button type="button" onClick={() => sheetEl?.showModal()}>
        Open filter sheet
      </button>
      <rc-bottom-sheet ref={setSheetEl} snap-points="240px 360px 480px" swipe-dismiss={false}>
        <dialog aria-label="Filter recipes">
          <button
            type="button"
            data-rc-bottom-sheet-handle
            data-rc-dialog-resize-axis="y"
            data-rc-dialog-resize-origin="top"
            aria-label="Resize filter sheet"
          ></button>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <strong>Filter recipes</strong>
            <label>
              <input type="checkbox" /> Vegetarian
            </label>
            <label>
              <input type="checkbox" /> Ready in 30 minutes
            </label>
            <div>
              <button type="button" onClick={() => sheetEl?.snapTo(0)}>
                Compact
              </button>{' '}
              <button type="button" onClick={() => sheetEl?.snapTo(2)}>
                Expand
              </button>{' '}
              <button type="button" onClick={() => sheetEl?.close()}>
                Done
              </button>
            </div>
          </div>
        </dialog>
      </rc-bottom-sheet>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function ButtonDemo() {
  const [buttonEl, setButtonEl] = useState<RCButtonRef | null>(null);
  const [selected, setSelected] = useState(false);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const setButtonRef = useCallback(
    (element: HTMLElement | null) => setButtonEl(element as RCButtonRef | null),
    [],
  );

  useEffect(() => {
    if (!buttonEl) {
      return;
    }

    const handleToggle = (event: Event) => {
      setSelected((event as CustomEvent<RCButtonToggleDetail>).detail.selected);
    };

    buttonEl.addEventListener('rc-button-toggle', handleToggle);

    return () => buttonEl.removeEventListener('rc-button-toggle', handleToggle);
  }, [buttonEl]);

  useEffect(() => {
    if (!progress) {
      setProgressValue(0);

      return;
    }

    let value = 0;
    const timer = window.setInterval(() => {
      value = Math.min(100, value + 5);
      setProgressValue(value);

      if (value === 100) {
        window.clearInterval(timer);
      }
    }, 125);

    return () => window.clearInterval(timer);
  }, [progress]);

  return (
    <DemoFrame>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <rc-button
          ref={setButtonRef}
          toggle
          selected={selected}
          pending={pending}
          progress={progress}
          progress-value={progress ? progressValue : undefined}
        >
          <button type="button">
            <span data-rc-button-icon className="material-symbols-outlined" aria-hidden="true">
              favorite_border
            </span>
            <span
              data-rc-button-selected-icon
              className="material-symbols-outlined material-symbols-filled"
              aria-hidden="true"
            >
              favorite
            </span>
            <span data-rc-button-label>Save recipe</span>
          </button>
        </rc-button>
        <rc-button icon-only>
          <button type="button" aria-label="Share recipe">
            <span data-rc-button-icon className="material-symbols-outlined" aria-hidden="true">
              share
            </span>
          </button>
        </rc-button>
      </div>
      <fieldset style={{ marginBlockStart: '1rem' }}>
        <legend>Button state</legend>
        <label>
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => setSelected(event.currentTarget.checked)}
          />{' '}
          Selected
        </label>{' '}
        <label>
          <input
            type="checkbox"
            checked={pending}
            onChange={(event) => {
              setPending(event.currentTarget.checked);

              if (event.currentTarget.checked) {
                setProgress(false);
              }
            }}
          />{' '}
          Pending
        </label>{' '}
        <label>
          <input
            type="checkbox"
            checked={progress}
            onChange={(event) => {
              setProgress(event.currentTarget.checked);

              if (event.currentTarget.checked) {
                setPending(false);
              }
            }}
          />{' '}
          Progress (0–100%)
        </label>
      </fieldset>
    </DemoFrame>
  );
}

const CARD_DEMO_CSS = `
.card-demo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(12rem, 1fr));
  grid-template-rows: auto auto 1fr auto;
  gap: 1rem;
  overflow-x: auto;
  padding: 0.25rem;
}

.card-demo-grid rc-card {
  grid-row: 1 / -1;
  grid-template-rows: subgrid;
  --rc-card-grid-template-rows: subgrid;
  --rc-card-media-grid-row: 1;
  --rc-card-title-grid-row: 2;
  --rc-card-body-grid-row: 3;
  --rc-card-actions-grid-row: 4;
}

.card-demo-media {
  position: relative;
  display: grid;
  min-block-size: 8rem;
  place-items: center;
  background: color-mix(in srgb, Highlight 18%, Canvas);
}

.card-demo-media > .material-symbols-outlined {
  font-size: 3rem;
}

.card-demo-favorite {
  position: absolute;
  inset-block-start: 0.5rem;
  inset-inline-end: 0.5rem;
}

.card-demo-favorite[selected] .material-symbols-outlined {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.card-demo-grid .card-demo-minimal {
  --rc-card-title-grid-row: 1 / 3;
  --rc-card-body-grid-row: 3 / 5;
}

.card-demo-status {
  margin-block-end: 0;
}
`;

export function CardDemo() {
  const [message, setMessage] = useState('Activate the card surface or Save.');
  const [favorite, setFavorite] = useState(false);

  return (
    <DemoFrame defaultTheme="substrate">
      <style>{CARD_DEMO_CSS}</style>
      <div className="card-demo-grid">
        <rc-card interactive action-target="demo-recipe-link">
          <div slot="media" className="card-demo-media" aria-hidden="true">
            <span className="material-symbols-outlined">skillet</span>
          </div>
          <a
            id="demo-recipe-link"
            slot="title"
            href="#lemon-pasta"
            onClick={(event) => {
              event.preventDefault();
              setMessage('Opened Lemon pasta.');
            }}
          >
            Lemon pasta
          </a>
          <p>Silky pasta with lemon, pepper, and parmesan.</p>
          <rc-button slot="actions">
            <button type="button" onClick={() => setMessage('Saved Lemon pasta.')}>
              Save
            </button>
          </rc-button>
        </rc-card>

        <rc-card>
          <div slot="media" className="card-demo-media">
            <span className="material-symbols-outlined" aria-hidden="true">
              soup_kitchen
            </span>
            <rc-button className="card-demo-favorite" icon-only selected={favorite}>
              <button
                type="button"
                aria-label={favorite ? 'Remove tomato soup from favorites' : 'Favorite tomato soup'}
                aria-pressed={favorite}
                onClick={() => {
                  setFavorite((current) => !current);

                  setMessage(
                    `${favorite ? 'Removed' : 'Added'} Tomato soup ${
                      favorite ? 'from' : 'to'
                    } favorites.`,
                  );
                }}
              >
                <span data-rc-button-icon className="material-symbols-outlined" aria-hidden="true">
                  favorite
                </span>
              </button>
            </rc-button>
          </div>
          <a
            slot="title"
            href="#tomato-soup"
            onClick={(event) => {
              event.preventDefault();
              setMessage('Opened Tomato soup.');
            }}
          >
            Tomato soup
          </a>
          <p>A classic soup card whose link and favorite button remain independent targets.</p>
        </rc-card>

        <rc-card className="card-demo-minimal">
          <strong slot="title">Pantry note</strong>
          <p>A minimal card can omit media and actions while sharing the same parent grid.</p>
        </rc-card>
      </div>
      <p className="card-demo-status" aria-live="polite">
        {message}
      </p>
    </DemoFrame>
  );
}

export function ChipDemo() {
  const [toolbarEl, setToolbarEl] = useState<HTMLElement | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!toolbarEl) {
      return;
    }

    const handleChange = (event: Event) => {
      const chip = event.target as HTMLElement;
      const { selected } = (event as CustomEvent<{ selected: boolean }>).detail;

      setLog((current) =>
        [
          `${chip.textContent?.trim()} -> ${selected ? 'selected' : 'not selected'}`,
          ...current,
        ].slice(0, 8),
      );
    };

    const handleRemove = (event: Event) => {
      const chip = (event as CustomEvent<{ chip: HTMLElement }>).detail.chip;

      setLog((current) => [`Removed ${chip.textContent?.trim()}`, ...current].slice(0, 8));
    };

    toolbarEl.addEventListener('rc-chip-change', handleChange);
    toolbarEl.addEventListener('rc-chip-remove', handleRemove);

    return () => {
      toolbarEl.removeEventListener('rc-chip-change', handleChange);
      toolbarEl.removeEventListener('rc-chip-remove', handleRemove);
    };
  }, [toolbarEl]);

  return (
    <DemoFrame>
      <rc-toolbar
        ref={setToolbarEl}
        label="Recipe filters"
        style={{ '--rc-toolbar-gap-inline': '0.5rem' } as CSSProperties}
      >
        <rc-chip variant="filter">
          <button type="button">Quick</button>
        </rc-chip>
        <rc-chip variant="filter">
          <button type="button">Vegetarian</button>
        </rc-chip>
        <rc-chip variant="input" removable>
          <button type="button" aria-label="Remove basil">
            Basil
          </button>
          <span slot="remove-icon" className="material-symbols-outlined" aria-hidden="true">
            close
          </span>
        </rc-chip>
      </rc-toolbar>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function FabMenuDemo() {
  const [menuEl, setMenuEl] = useState<HTMLElement | null>(null);
  const log = useEventLog<RCMenuActivateDetail>(
    menuEl,
    'rc-menu-activate',
    ({ value }) => `rc-menu-activate -> ${value}`,
  );

  return (
    <DemoFrame>
      <div
        style={{
          position: 'relative',
          minBlockSize: '16rem',
          border: '1px solid ButtonBorder',
          overflow: 'clip',
        }}
      >
        <rc-fab-menu
          ref={setMenuEl}
          style={{ '--rc-fab-menu-position-css': 'absolute' } as CSSProperties}
        >
          <button slot="trigger" type="button" aria-label="Create">
            <span className="material-symbols-outlined" aria-hidden="true">
              add
            </span>
          </button>
          <rc-menu label="Create">
            <button data-value="recipe">Recipe</button>
            <button data-value="collection">Collection</button>
            <button data-value="meal-plan">Meal plan</button>
          </rc-menu>
        </rc-fab-menu>
      </div>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

const navigationDestinations = [
  { href: '#recipes', label: 'Recipes', icon: 'restaurant' },
  { href: '#shopping', label: 'Shopping', icon: 'shopping_cart' },
  { href: '#settings', label: 'Settings', icon: 'settings' },
];

export function NavigationBarDemo() {
  const [active, setActive] = useState('#recipes');

  return (
    <DemoFrame>
      <nav aria-label="Demo navigation">
        <rc-navigation-bar>
          {navigationDestinations.map(({ href, label, icon }) => (
            <a
              key={href}
              href={href}
              aria-current={active === href ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault();
                setActive(href);
              }}
            >
              <span
                data-rc-navigation-icon
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                {icon}
              </span>
              <span>{label}</span>
            </a>
          ))}
        </rc-navigation-bar>
      </nav>
      <p>
        Current destination: {navigationDestinations.find(({ href }) => href === active)?.label}
      </p>
    </DemoFrame>
  );
}

export function NavigationRailDemo() {
  const [railEl, setRailEl] = useState<RCNavigationRailRef | null>(null);
  const [active, setActive] = useState('#recipes');
  const [expanded, setExpanded] = useState(false);
  const log = useEventLog<RCNavigationRailToggleDetail>(
    railEl,
    'rc-navigation-rail-toggle',
    ({ expanded: next }) => `rc-navigation-rail-toggle -> ${next}`,
  );

  useEffect(() => {
    if (!railEl) {
      return;
    }

    const handleToggle = (event: Event) => {
      setExpanded((event as CustomEvent<RCNavigationRailToggleDetail>).detail.expanded);
    };

    railEl.addEventListener('rc-navigation-rail-toggle', handleToggle);

    return () => railEl.removeEventListener('rc-navigation-rail-toggle', handleToggle);
  }, [railEl]);

  return (
    <DemoFrame>
      <rc-navigation-rail
        ref={setRailEl}
        label="Demo navigation"
        expanded={expanded}
        style={{ minBlockSize: '22rem' }}
      >
        <rc-button slot="toggle" icon-only>
          <button type="button" aria-label="Toggle navigation">
            <span
              data-rc-button-icon
              data-rc-navigation-expand-icon
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              menu
            </span>
            <span
              data-rc-button-selected-icon
              data-rc-navigation-collapse-icon
              className="material-symbols-outlined"
              aria-hidden="true"
            >
              menu_open
            </span>
          </button>
        </rc-button>
        {navigationDestinations.map(({ href, label, icon }) => (
          <a
            key={href}
            href={href}
            aria-current={active === href ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault();
              setActive(href);
            }}
          >
            <span data-rc-navigation-indicator>
              <span
                data-rc-navigation-icon
                className="material-symbols-outlined"
                aria-hidden="true"
              >
                {icon}
              </span>
              <span>{label}</span>
            </span>
          </a>
        ))}
      </rc-navigation-rail>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function AdaptiveNavigationDemo() {
  const [active, setActive] = useState('#recipes');
  const [showRail, setShowRail] = useState(false);

  const switchLayout = () => {
    const update = () => setShowRail((current) => !current);
    const documentWithTransitions = document as Document & {
      startViewTransition?: (callback: () => void) => void;
    };

    if (documentWithTransitions.startViewTransition) {
      documentWithTransitions.startViewTransition(update);
    } else {
      update();
    }
  };

  const renderLinks = (forRail: boolean) =>
    navigationDestinations.map(({ href, label, icon }) => {
      const iconElement = (
        <span data-rc-navigation-icon className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      );

      return (
        <a
          key={href}
          href={href}
          aria-current={active === href ? 'page' : undefined}
          onClick={(event) => {
            event.preventDefault();
            setActive(href);
          }}
        >
          {forRail ? (
            <span data-rc-navigation-indicator>
              {iconElement}
              <span>{label}</span>
            </span>
          ) : (
            <>
              {iconElement}
              <span>{label}</span>
            </>
          )}
        </a>
      );
    });

  return (
    <DemoFrame>
      <div
        style={
          {
            display: 'grid',
            gridTemplateColumns: showRail ? 'auto 1fr' : '1fr',
            minBlockSize: '22rem',
            border: '1px solid color-mix(in srgb, currentColor 20%, transparent)',
            borderRadius: '1rem',
            overflow: 'hidden',
          } as CSSProperties
        }
      >
        {showRail ? (
          <rc-navigation-rail
            label="Adaptive demo navigation"
            style={{ viewTransitionName: 'adaptive-navigation' }}
          >
            <rc-fab
              slot="header"
              position="top-start"
              style={{ '--rc-fab-position': 'static' } as CSSProperties}
            >
              <button type="button" aria-label="New recipe">
                <span data-rc-button-icon className="material-symbols-outlined" aria-hidden="true">
                  add
                </span>
              </button>
            </rc-fab>
            {renderLinks(true)}
          </rc-navigation-rail>
        ) : null}
        <main
          style={{
            position: 'relative',
            display: 'grid',
            alignContent: 'start',
            gap: '1rem',
            minInlineSize: 0,
            padding: '1.5rem',
          }}
        >
          <rc-button>
            <button type="button" onClick={switchLayout}>
              Switch to {showRail ? 'navigation bar' : 'navigation rail'}
            </button>
          </rc-button>
          <h3 style={{ margin: 0 }}>
            {navigationDestinations.find(({ href }) => href === active)?.label}
          </h3>
          <p style={{ margin: 0 }}>
            The app owns the responsive switch while both navigation surfaces reuse the same
            destinations and active state.
          </p>
          {!showRail ? (
            <rc-fab
              position="block-end"
              style={
                {
                  '--rc-fab-position': 'absolute',
                  viewTransitionName: 'adaptive-fab',
                } as CSSProperties
              }
            >
              <button type="button" aria-label="New recipe">
                <span data-rc-button-icon className="material-symbols-outlined" aria-hidden="true">
                  add
                </span>
              </button>
            </rc-fab>
          ) : null}
        </main>
        {!showRail ? (
          <nav aria-label="Adaptive demo navigation" style={{ gridColumn: '1 / -1' }}>
            <rc-navigation-bar style={{ viewTransitionName: 'adaptive-navigation' }}>
              {renderLinks(false)}
            </rc-navigation-bar>
          </nav>
        ) : null}
      </div>
    </DemoFrame>
  );
}

export function SegmentedButtonDemo() {
  const [groupEl, setGroupEl] = useState<HTMLElement | null>(null);
  const [value, setValue] = useState('medium');
  const log = useEventLog<RCSegmentedButtonChangeDetail>(
    groupEl,
    'rc-segmented-button-change',
    ({ value: next }) => `rc-segmented-button-change -> ${next}`,
  );

  useEffect(() => {
    if (!groupEl) {
      return;
    }

    const handleChange = (event: Event) => {
      setValue((event as CustomEvent<RCSegmentedButtonChangeDetail>).detail.value);
    };

    groupEl.addEventListener('rc-segmented-button-change', handleChange);

    return () => groupEl.removeEventListener('rc-segmented-button-change', handleChange);
  }, [groupEl]);

  return (
    <DemoFrame>
      <rc-segmented-button ref={setGroupEl}>
        <fieldset>
          <legend>Text size</legend>
          <label>
            <input type="radio" name="demo-text-size" value="small" /> Small
          </label>
          <label>
            <input type="radio" name="demo-text-size" value="medium" defaultChecked /> Medium
          </label>
          <label>
            <input type="radio" name="demo-text-size" value="large" /> Large
          </label>
        </fieldset>
      </rc-segmented-button>
      <p>Selected size: {value}</p>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function SnackbarDemo() {
  const [snackbarEl, setSnackbarEl] = useState<RCSnackbarRef | null>(null);
  const actionLog = useEventLog<RCSnackbarActionDetail>(
    snackbarEl,
    'rc-snackbar-action',
    ({ message }) => `rc-snackbar-action -> ${message}`,
  );
  const closeLog = useEventLog<RCSnackbarCloseDetail>(
    snackbarEl,
    'rc-snackbar-close',
    ({ reason, message }) => `rc-snackbar-close -> ${reason}: ${message}`,
  );

  return (
    <DemoFrame>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => snackbarEl?.show({ message: 'Recipe saved', duration: 2500 })}
        >
          Show message
        </button>
        <button
          type="button"
          onClick={() =>
            snackbarEl?.show({
              message: 'Recipe deleted',
              actionLabel: 'Undo',
              duration: 0,
            })
          }
        >
          Show action
        </button>
        <button
          type="button"
          onClick={() => {
            if (!snackbarEl) {
              return;
            }

            snackbarEl.queuePolicy = 'queue';
            snackbarEl.show({ message: 'First queued message', duration: 1200 });
            snackbarEl.show({ message: 'Second queued message', duration: 1200 });
          }}
        >
          Queue two
        </button>
        <button
          type="button"
          onClick={() => {
            if (!snackbarEl) {
              return;
            }

            snackbarEl.queuePolicy = 'replace';
            snackbarEl.show({ message: 'Original message', duration: 3000 });
            snackbarEl.show({ message: 'Replacement message', duration: 3000 });
          }}
        >
          Replace
        </button>
      </div>
      <rc-snackbar ref={setSnackbarEl}></rc-snackbar>
      <EventLog entries={[...actionLog, ...closeLog]} />
    </DemoFrame>
  );
}

export function SwitchDemo() {
  const [switchEl, setSwitchEl] = useState<HTMLElement | null>(null);
  const [checked, setChecked] = useState(false);
  const log = useEventLog<RCSwitchChangeDetail>(
    switchEl,
    'rc-switch-change',
    ({ checked: next }) => `rc-switch-change -> ${next}`,
  );

  useEffect(() => {
    if (!switchEl) {
      return;
    }

    const handleChange = (event: Event) => {
      setChecked((event as CustomEvent<RCSwitchChangeDetail>).detail.checked);
    };

    switchEl.addEventListener('rc-switch-change', handleChange);

    return () => switchEl.removeEventListener('rc-switch-change', handleChange);
  }, [switchEl]);

  return (
    <DemoFrame>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <label htmlFor="demo-dark-mode">Dark mode</label>
        <rc-switch ref={setSwitchEl}>
          <input id="demo-dark-mode" name="darkMode" type="checkbox" />
        </rc-switch>
      </div>
      <p>Dark mode is {checked ? 'on' : 'off'}.</p>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function AppBarDemo() {
  const [barEl, setBarEl] = useState<RCAppBarRef | null>(null);
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!barEl) {
      return;
    }

    barEl.scrollTarget = scrollEl;
    barEl.scrolled = undefined;

    return () => {
      barEl.scrollTarget = null;
    };
  }, [barEl, scrollEl]);

  return (
    <DemoFrame>
      <div
        ref={setScrollEl}
        style={{
          blockSize: '22rem',
          border: '1px solid ButtonBorder',
          overflowY: 'auto',
        }}
      >
        <rc-app-bar
          ref={setBarEl}
          variant="expanded"
          scroll-behavior="collapse"
          scroll-threshold="1"
          style={{ position: 'sticky', insetBlockStart: 0, zIndex: 1 }}
        >
          <button slot="leading" type="button" aria-label="Back">
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_back
            </span>
          </button>
          <div>
            <strong>Recipes</strong>
            <small style={{ display: 'block' }}>Summer collection</small>
          </div>
          <button slot="trailing" type="button" aria-label="Edit">
            <span className="material-symbols-outlined" aria-hidden="true">
              edit
            </span>
          </button>
        </rc-app-bar>
        <div style={{ padding: '1rem', display: 'grid', gap: '0.75rem' }}>
          <p style={{ margin: 0 }}>
            Scroll this panel to watch the expanded app bar collapse into its compact row.
          </p>
          {[
            'Prep ingredients and group tasks before the kitchen gets busy.',
            'Review active orders, pinned notes, and handoff details in one place.',
            'Let the expanded title collapse while primary actions remain available.',
            'Use the scrolled divider as a quiet boundary between controls and content.',
            'Return to the top to let the expanded title settle back into view.',
            'The app bar observes this container directly, so the page itself stays still.',
          ].map((text) => (
            <section
              key={text}
              style={{
                minBlockSize: '5rem',
                padding: '0.75rem',
                border: '1px solid color-mix(in srgb, CanvasText 16%, transparent)',
                borderRadius: '0.5rem',
              }}
            >
              {text}
            </section>
          ))}
        </div>
      </div>
      <p>
        <button type="button" onClick={() => scrollEl?.scrollTo({ top: 120, behavior: 'smooth' })}>
          Compact endpoint
        </button>{' '}
        <button type="button" onClick={() => scrollEl?.scrollTo({ top: 0, behavior: 'smooth' })}>
          Expanded endpoint
        </button>
      </p>
    </DemoFrame>
  );
}

export function AppBarSearchDemo() {
  return (
    <DemoFrame>
      <rc-app-bar>
        <button slot="leading" type="button" aria-label="Open navigation">
          <span className="material-symbols-outlined" aria-hidden="true">
            menu
          </span>
        </button>
        <rc-search-bar slot="center" style={{ inlineSize: 'min(28rem, 100%)' }}>
          <input type="search" aria-label="Search recipes" placeholder="Search recipes" />
        </rc-search-bar>
        <button slot="trailing" type="button" aria-label="Filter results">
          <span className="material-symbols-outlined" aria-hidden="true">
            tune
          </span>
        </button>
      </rc-app-bar>
    </DemoFrame>
  );
}

export function ComboboxDemo() {
  const [comboEl, setComboEl] = useState<HTMLElement | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!comboEl) {
      return;
    }

    const handleChange = (event: Event) => {
      const { value } = (event as CustomEvent<{ value: string | string[] }>).detail;
      const display = Array.isArray(value) ? value.join(', ') : value;

      setLog((current) => [`rc-select-change -> ${display}`, ...current].slice(0, 8));
    };

    comboEl.addEventListener('rc-select-change', handleChange);

    return () => comboEl.removeEventListener('rc-select-change', handleChange);
  }, [comboEl]);

  return (
    <DemoFrame>
      <div className="demo-row">
        <label className="demo-col">
          <span>Ingredient</span>
          <rc-combobox
            ref={(el) => setComboEl(el as HTMLElement | null)}
            placeholder="Choose an ingredient"
          >
            <select name="ingredient">
              <option value="carrot">Carrot</option>
              <option value="ginger">Ginger</option>
              <option value="garlic">Garlic</option>
              <option value="onion">Onion</option>
            </select>
          </rc-combobox>
        </label>
        <label className="demo-col">
          <span>Multiple</span>
          <rc-combobox placeholder="Add tags" allow-create>
            <select name="tags" multiple>
              <option value="vegetarian">Vegetarian</option>
              <option value="quick">Quick</option>
              <option value="dinner">Dinner</option>
            </select>
          </rc-combobox>
        </label>
      </div>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function DialogDemo() {
  const [dialogEl, setDialogEl] = useState<RCDialogRef | null>(null);
  const [confirmEl, setConfirmEl] = useState<RCDialogRef | null>(null);
  const log = useEventLog<{ returnValue: string }>(
    dialogEl,
    'rc-dialog-close',
    ({ returnValue }) => `rc-dialog-close -> ${returnValue || '(empty)'}`,
  );
  const confirmLog = useEventLog<{ returnValue: string }>(
    confirmEl,
    'rc-dialog-close',
    ({ returnValue }) => `rc-dialog-close (confirm) -> ${returnValue || '(empty)'}`,
  );

  return (
    <DemoFrame>
      <p style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: 0 }}>
        <button type="button" onClick={() => dialogEl?.showModal()}>
          Open draggable dialog
        </button>
        <button type="button" onClick={() => confirmEl?.showModal()}>
          Open confirm dialog
        </button>
      </p>
      <rc-dialog
        ref={(el) => setDialogEl(el as RCDialogRef | null)}
        movable
        move-handle="[data-titlebar]"
        resize="both"
      >
        <dialog aria-labelledby="dialog-demo-title">
          <div data-titlebar style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <strong id="dialog-demo-title" style={{ flex: 1 }}>
              Native dialog
            </strong>
            <button
              type="button"
              aria-label="Close"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.125rem',
              }}
              onClick={() => dialogEl?.close('dismiss')}
            >
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
                style={{ fontSize: '1rem' }}
              >
                close
              </span>
            </button>
          </div>
          <p>Drag the titlebar, resize the edges, or press Escape.</p>
          <button
            type="button"
            style={{ display: 'block', marginInlineStart: 'auto' }}
            onClick={() => dialogEl?.close('ok')}
          >
            OK
          </button>
        </dialog>
      </rc-dialog>
      <rc-dialog ref={(el) => setConfirmEl(el as RCDialogRef | null)}>
        <dialog aria-label="Confirm delete" style={{ maxInlineSize: '24rem' }}>
          <p style={{ marginBlockStart: 0 }}>This will permanently delete the recipe. Continue?</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => confirmEl?.close('cancel')}>
              Cancel
            </button>
            <button type="button" onClick={() => confirmEl?.close('delete')}>
              Delete
            </button>
          </div>
        </dialog>
      </rc-dialog>
      <EventLog entries={[...log, ...confirmLog]} />
    </DemoFrame>
  );
}

export function DisclosureDemo() {
  const disclosureRef = useRef<RCDisclosureRef>(null);

  return (
    <DemoFrame>
      <rc-disclosure ref={disclosureRef}>
        <details>
          <summary>Shipping details</summary>
          <p>Content remains in the native details element.</p>
        </details>
      </rc-disclosure>
      <p>
        <button
          type="button"
          onClick={() => {
            if (disclosureRef.current) {
              disclosureRef.current.open = true;
            }
          }}
        >
          Open
        </button>{' '}
        <button
          type="button"
          onClick={() => {
            if (disclosureRef.current) {
              disclosureRef.current.open = false;
            }
          }}
        >
          Close
        </button>
      </p>
    </DemoFrame>
  );
}

export function FabDemo() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  return (
    <DemoFrame>
      <div
        ref={scrollerRef}
        style={{
          position: 'relative',
          blockSize: '18rem',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Tall inner content to enable scrolling */}
        <div
          style={{
            blockSize: '54rem',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>
            ↓ Scroll down to reveal the back-to-top button
          </p>
        </div>

        {/*
         * Zero-height sticky trap. Sticks at bottom:0 of the scroll viewport so
         * absolutely-positioned FABs inside it stay visually pinned to the
         * container's bottom corner while remaining inside the scroll container
         * (which is required for scroll(nearest block) and _findScrollTarget()).
         */}
        <div style={{ position: 'sticky', bottom: 0, blockSize: 0 }}>
          {/* Back-to-top FAB — hidden until 100 px into the demo scroll */}
          <rc-fab
            scroll-reveal
            style={
              {
                '--rc-fab-position': 'absolute',
                '--rc-fab-scroll-threshold': '100px',
                '--rc-fab-scroll-timeline': 'scroll(nearest block)',
              } as CSSProperties
            }
          >
            <button
              type="button"
              aria-label="Back to top"
              onClick={() => scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              ↑
            </button>
          </rc-fab>

          {/* Extended FAB — always visible */}
          <rc-fab
            position="bottom-start"
            style={{ '--rc-fab-position': 'absolute' } as CSSProperties}
          >
            <button type="button">
              <span className="material-symbols-outlined" aria-hidden="true">
                add
              </span>
              Create
            </button>
          </rc-fab>
        </div>
      </div>
    </DemoFrame>
  );
}

export function ListboxDemo() {
  const [listboxEl, setListboxEl] = useState<RCListboxRef | null>(null);
  const seedListbox = useCallback((listbox: RCListboxRef | null) => {
    setListboxEl(listbox);

    if (!listbox) {
      return;
    }

    async function applyOptions() {
      if (typeof customElements !== 'undefined') {
        await customElements.whenDefined('rc-listbox');
      }

      if (!listbox.isConnected) {
        return;
      }

      listbox.options = [
        { value: 'apples', label: 'Apples' },
        { value: 'berries', label: 'Berries' },
        { value: 'citrus', label: 'Citrus' },
        { value: 'dates', label: 'Dates', disabled: true },
        { value: 'elderflower', label: 'Elderflower' },
        { value: 'figs', label: 'Figs' },
        { value: 'grapes', label: 'Grapes' },
      ];

      listbox.setSelectedValues(['berries']);
    }

    void applyOptions();
  }, []);
  const log = useEventLog<{
    optionValue: string;
    selected: boolean;
    selectedValues: string[];
  }>(
    listboxEl,
    'rc-listbox-change',
    ({ optionValue, selected, selectedValues }) =>
      `${selected ? 'Selected' : 'Deselected'} ${optionValue}; current: ${selectedValues.join(', ') || '(none)'}`,
  );

  return (
    <DemoFrame>
      <rc-listbox
        ref={seedListbox}
        multiple
        checkmark
        tabIndex={0}
        aria-label="Fruit choices"
        style={{ maxHeight: '12rem', border: '1px solid ButtonBorder' }}
      ></rc-listbox>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

const MARKDOWN_EDITOR_DEMO_CONTENT = `\
# Getting Started

A **rich** and *source* Markdown editor backed by a native \`<textarea>\`. Toggle modes with the toolbar's source button or \`Ctrl+Shift+S\`.

## Inline Formatting

Use **bold**, *italic*, ~~strikethrough~~, and \`inline code\`. Links like [Markdown Guide](https://markdownguide.org) are clickable in rich mode. Underline uses <u>HTML passthrough</u>.

## Lists

- Unordered item
- Another item

1. First step
2. Second step

## Code Block

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

> Switch to source mode to see the markdown highlighted in color.
`;

export function MarkdownEditorDemo() {
  const [editorEl, setEditorEl] = useState<HTMLElement | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!editorEl) {
      return;
    }

    const handleChange = (e: Event) => {
      const { value = '' } = (e as CustomEvent<{ value?: string }>).detail;
      const preview = value.slice(0, 40).replace(/\n/g, '↵');

      setLog((prev) => [`rc-change -> ${preview}`, ...prev].slice(0, 8));
    };

    const handleModeChange = (e: Event) => {
      const { mode } = (e as CustomEvent<{ mode: string }>).detail;

      setLog((prev) => [`rc-mode-change -> ${mode}`, ...prev].slice(0, 8));
    };

    editorEl.addEventListener('rc-change', handleChange);
    editorEl.addEventListener('rc-mode-change', handleModeChange);

    return () => {
      editorEl.removeEventListener('rc-change', handleChange);
      editorEl.removeEventListener('rc-mode-change', handleModeChange);
    };
  }, [editorEl]);

  return (
    <DemoFrame>
      <rc-markdown-editor ref={(el) => setEditorEl(el as HTMLElement | null)}>
        <textarea defaultValue={MARKDOWN_EDITOR_DEMO_CONTENT} />
      </rc-markdown-editor>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function MenuDemo() {
  const [menuEl, setMenuEl] = useState<HTMLElement | null>(null);
  const setMenuRef = useCallback((element: RCMenuRef | null) => {
    setMenuEl(element as HTMLElement | null);
  }, []);
  const log = useEventLog<{ value?: string }>(
    menuEl,
    'rc-menu-activate',
    ({ value }) => `rc-menu-activate -> ${value ?? '(no value)'}`,
  );

  return (
    <DemoFrame>
      <rc-menu ref={setMenuRef} label="Example menu">
        <button type="button" value="new">
          New recipe
        </button>
        <button type="button" value="duplicate">
          Duplicate
        </button>
        <button type="button" value="delete" disabled>
          Delete
        </button>
      </rc-menu>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function MenuButtonDemo() {
  const [menuButtonEl, setMenuButtonEl] = useState<HTMLElement | null>(null);
  const setMenuButtonRef = useCallback((element: HTMLElement | null) => {
    setMenuButtonEl(element);
  }, []);
  const toggleLog = useEventLog<{ open: boolean }>(
    menuButtonEl,
    'rc-menu-button-toggle',
    ({ open }) => `rc-menu-button-toggle -> ${open ? 'open' : 'closed'}`,
  );
  const activateLog = useEventLog<{ value?: string; checked?: string }>(
    menuButtonEl,
    'rc-menu-activate',
    ({ checked, value }) =>
      `rc-menu-activate -> ${value ?? '(no value)'}${checked ? ` (${checked})` : ''}`,
  );

  return (
    <DemoFrame>
      <rc-menu-button ref={setMenuButtonRef}>
        <button slot="trigger" type="button">
          Actions
        </button>
        <rc-menu label="Actions">
          <button type="button" value="edit">
            <span>Edit</span>
            <span data-menu-shortcut>Ctrl+E</span>
          </button>
          <button type="button" value="share">
            Share
          </button>
          <hr />
          <button type="button" role="menuitemcheckbox" aria-checked="true" value="show-details">
            Show details
          </button>
          <button type="button" value="more" aria-haspopup="menu">
            More actions
          </button>
          <button type="button" disabled>
            Archive
          </button>
        </rc-menu>
      </rc-menu-button>
      <EventLog entries={[...activateLog, ...toggleLog]} />
    </DemoFrame>
  );
}

export function MenubarDemo() {
  const [menubarEl, setMenubarEl] = useState<HTMLElement | null>(null);
  const setMenubarRef = useCallback((element: HTMLElement | null) => {
    setMenubarEl(element);
  }, []);
  const log = useEventLog<{ value?: string; checked?: string }>(
    menubarEl,
    'rc-menu-activate',
    ({ checked, value }) =>
      `rc-menu-activate -> ${value ?? '(no value)'}${checked ? ` (${checked})` : ''}`,
  );

  return (
    <DemoFrame>
      <rc-menubar ref={setMenubarRef} label="Recipe menu">
        <rc-menu-button>
          <button slot="trigger" type="button">
            File
          </button>
          <rc-menu label="File">
            <button type="button" value="new">
              <span>New</span>
              <span data-menu-shortcut>Ctrl+N</span>
            </button>
            <button type="button" value="open">
              <span>Open</span>
              <span data-menu-shortcut>Ctrl+O</span>
            </button>
            <hr />
            <button type="button" value="close" disabled>
              Close
            </button>
          </rc-menu>
        </rc-menu-button>
        <rc-menu-button>
          <button slot="trigger" type="button">
            Edit
          </button>
          <rc-menu label="Edit">
            <button type="button" value="undo">
              <span>Undo</span>
              <span data-menu-shortcut>Ctrl+Z</span>
            </button>
            <button type="button" value="redo">
              <span>Redo</span>
              <span data-menu-shortcut>Ctrl+Y</span>
            </button>
          </rc-menu>
        </rc-menu-button>
        <rc-menu-button>
          <button slot="trigger" type="button">
            View
          </button>
          <rc-menu label="View">
            <button type="button" role="menuitemcheckbox" aria-checked="true" value="show-notes">
              Show notes
            </button>
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked="false"
              value="compact-layout"
            >
              Compact layout
            </button>
            <div role="group" aria-label="Sort order">
              <div data-group-label>Sort order</div>
              <button type="button" role="menuitemradio" aria-checked="true" value="sort-recent">
                Recent
              </button>
              <button type="button" role="menuitemradio" aria-checked="false" value="sort-name">
                Name
              </button>
            </div>
          </rc-menu>
        </rc-menu-button>
      </rc-menubar>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function RangeSliderDemo() {
  const [sliderEl, setSliderEl] = useState<RCRangeSliderRef | null>(null);
  const log = useEventLog<{ value: [number, number] }>(
    sliderEl,
    'rc-range-slider-change',
    ({ value }) => `rc-range-slider-change -> ${value.join(' - ')}`,
  );

  return (
    <DemoFrame>
      <rc-range-slider ref={setSliderEl} display="inline-end">
        <input type="range" min="0" max="100" defaultValue="20" aria-label="Minimum price" />
        <input type="range" min="0" max="100" defaultValue="80" aria-label="Maximum price" />
      </rc-range-slider>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function SearchBarDemo() {
  const [searchEl, setSearchEl] = useState<RCSearchBarRef | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    if (!searchEl) {
      return;
    }

    const onInput = (e: Event) => {
      const { value } = (e as CustomEvent<{ value: string }>).detail;

      setLog((prev) => [`rc-search-bar-input -> ${value}`, ...prev].slice(0, 8));
    };

    const onClear = () => {
      setLog((prev) => ['rc-search-bar-clear', ...prev].slice(0, 8));
    };

    searchEl.addEventListener('rc-search-bar-input', onInput);
    searchEl.addEventListener('rc-search-bar-clear', onClear);

    return () => {
      searchEl.removeEventListener('rc-search-bar-input', onInput);
      searchEl.removeEventListener('rc-search-bar-clear', onClear);
    };
  }, [searchEl]);

  return (
    <DemoFrame>
      <rc-search-bar ref={setSearchEl}>
        <span slot="leading" aria-hidden="true" className="material-symbols-outlined">
          search
        </span>
        <input type="search" name="q" defaultValue="tomato" aria-label="Search recipes" />
      </rc-search-bar>
      <p>
        <button
          type="button"
          onClick={() => {
            if (searchEl) {
              searchEl.value = 'pasta';
            }
          }}
        >
          Set pasta
        </button>{' '}
        <button
          type="button"
          onClick={() => {
            if (searchEl) {
              searchEl.value = '';
            }
          }}
        >
          Clear
        </button>
      </p>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function SliderDemo() {
  const [sliderEl, setSliderEl] = useState<RCSliderRef | null>(null);
  const log = useEventLog<{ value: number }>(
    sliderEl,
    'rc-slider-change',
    ({ value }) => `rc-slider-change -> ${value}`,
  );

  return (
    <DemoFrame>
      <rc-slider ref={setSliderEl} display="inline-end">
        <input type="range" min="0" max="100" defaultValue="64" aria-label="Priority" />
      </rc-slider>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

export function SplitterDemo() {
  return (
    <DemoFrame>
      <rc-splitter
        label="Preview panes"
        style={{ blockSize: '12rem', border: '1px solid ButtonBorder' }}
      >
        <div style={{ padding: '0.75rem' }}>Recipe</div>
        <div slot="secondary" style={{ padding: '0.75rem' }}>
          Notes
        </div>
      </rc-splitter>
    </DemoFrame>
  );
}

export function TextareaDemo() {
  return (
    <DemoFrame>
      <rc-textarea label="Notes" line-numbers>
        <textarea defaultValue={'TODO: test seasoning\nSimmer until tender.'} />
      </rc-textarea>
    </DemoFrame>
  );
}

// ── rc-textarea feature demos ─────────────────────────────────────────────────

export function TextareaBasicDemo() {
  return (
    <DemoFrame>
      <rc-textarea auto-grow>
        <textarea
          rows={4}
          aria-label="Text editor"
          defaultValue={
            'The woods are lovely, dark and deep,\n' +
            'But I have promises to keep,\n' +
            'And miles to go before I sleep.\n\n' +
            '— Robert Frost'
          }
        />
      </rc-textarea>
    </DemoFrame>
  );
}

const MARKDOWN_SEED =
  '# Shopping list\n\n- **Carrots** — 1 bunch\n- *Ginger* — 2 cm piece\n- Garlic — 4 cloves\n\n> Buy organic where possible.';

export function TextareaMarkdownDemo() {
  const [editor, setEditor] = useState<RCTextareaRef | null>(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!editor) {
      return;
    }

    const plugin = createMarkdownPlugin();

    editor.usePlugin(plugin);
    setPreview(plugin.getPreviewHtml(MARKDOWN_SEED));

    const onchange = (e: Event) => {
      const value = (e as CustomEvent<{ value: string }>).detail.value;

      setPreview(plugin.getPreviewHtml(value));
    };

    editor.addEventListener('rc-textarea-change', onchange);

    return () => editor.removeEventListener('rc-textarea-change', onchange);
  }, [editor]);

  return (
    <DemoFrame>
      <rc-textarea ref={setEditor} line-numbers auto-grow>
        <textarea rows={7} aria-label="Markdown editor" defaultValue={MARKDOWN_SEED} />
      </rc-textarea>
      {preview && (
        <div
          style={{ padding: '0.75em 1em', borderTop: '1px solid ButtonBorder' }}
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      )}
    </DemoFrame>
  );
}

const RUST_SNIPPET = `struct Matrix {
    data: Vec<Vec<f64>>,
    rows: usize,
    cols: usize,
}

impl Matrix {
    fn new(rows: usize, cols: usize) -> Self {
        Matrix {
            data: vec![vec![0.0; cols]; rows],
            rows,
            cols,
        }
    }

    fn get(&self, row: usize, col: usize) -> f64 {
        self.data[row][col]
    }
}

fn main() {
    let m = Matrix::new(3, 3);
    // Access element at (1, 1)
    println!("m[1][1] = {}", m.get(1, 1));
}`;

const HLJS_DEMO_CSS = `
  .hljs-keyword, .hljs-type { color: light-dark(#7c3aed, #cba6f7); }
  .hljs-string { color: light-dark(#0f766e, #a6e3a1); }
  .hljs-number { color: light-dark(#b45309, #fab387); }
  .hljs-comment { color: light-dark(#64748b, #6c7086); font-style: italic; }
  .hljs-title, .hljs-title.function_ { color: light-dark(#2563eb, #89b4fa); font-weight: bold; }
  .hljs-built_in { color: light-dark(#0891b2, #89dceb); }
  .hljs-literal { color: light-dark(#be185d, #f5c2e7); }
  .hljs-variable, .hljs-punctuation { color: light-dark(#334155, #cdd6f4); }
  .hljs-operator { color: light-dark(#0369a1, #89dceb); }

  @media (forced-colors: active) {
    .hljs-keyword,
    .hljs-type,
    .hljs-string,
    .hljs-number,
    .hljs-title,
    .hljs-title.function_,
    .hljs-built_in,
    .hljs-literal,
    .hljs-variable,
    .hljs-punctuation,
    .hljs-operator {
      color: CanvasText;
    }

    .hljs-comment {
      color: GrayText;
    }
  }
`;

export function TextareaHljsDemo() {
  const [editor, setEditor] = useState<RCTextareaRef | null>(null);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.usePlugin({
      mount(api: RCTextareaPluginAPI) {
        api.adoptStyleSheet(HLJS_DEMO_CSS);
      },
      highlight(value: string) {
        return hljs.highlight(value, { language: 'rust' }).value;
      },
    });
  }, [editor]);

  return (
    <DemoFrame>
      <rc-textarea
        ref={setEditor}
        line-numbers
        auto-grow
        style={
          {
            '--rc-textarea-font-family': "'Fira Code', 'Cascadia Code', monospace",
            '--rc-textarea-font-size': '13px',
            '--rc-textarea-background': 'light-dark(#ffffff, #1e1e2e)',
            '--rc-textarea-color': 'light-dark(#1f2937, #cdd6f4)',
            '--rc-textarea-caret-color': 'light-dark(#2563eb, #89b4fa)',
            '--rc-textarea-border': '1px solid light-dark(#cbd5e1, #313244)',
            '--rc-textarea-active-line-bg':
              'light-dark(rgb(37 99 235 / 0.08), rgb(255 255 255 / 0.04))',
            '--rc-textarea-gutter-bg': 'light-dark(#f8fafc, #181825)',
            '--rc-textarea-gutter-color': 'light-dark(#64748b, #6c7086)',
            '--rc-textarea-gutter-border': '1px solid light-dark(#cbd5e1, #313244)',
          } as CSSProperties
        }
      >
        <textarea rows={12} aria-label="Rust code editor" defaultValue={RUST_SNIPPET} />
      </rc-textarea>
    </DemoFrame>
  );
}

export function ToolbarDemo() {
  const [clicked, setClicked] = useState('Nothing clicked yet.');

  return (
    <DemoFrame>
      <rc-toolbar label="Formatting">
        <button type="button" aria-label="Bold" onClick={() => setClicked('Bold')}>
          <span className="material-symbols-outlined" aria-hidden="true">
            format_bold
          </span>
        </button>
        <button type="button" aria-label="Italic" onClick={() => setClicked('Italic')}>
          <span className="material-symbols-outlined" aria-hidden="true">
            format_italic
          </span>
        </button>
        <hr />
        <button type="button" aria-label="Link" onClick={() => setClicked('Link')}>
          <span className="material-symbols-outlined" aria-hidden="true">
            link
          </span>
        </button>
      </rc-toolbar>
      <p>{clicked}</p>
    </DemoFrame>
  );
}

export function TransferListDemo() {
  const [transferEl, setTransferEl] = useState<RCTransferListRef | null>(null);
  const [compact, setCompact] = useState(false);
  const log = useEventLog<RCTransferListChangeDetail>(
    transferEl,
    'rc-transfer-list-change',
    ({ selected }) =>
      `rc-transfer-list-change -> ${selected.map(({ label }) => label).join(', ') || '(none)'}`,
  );

  return (
    <DemoFrame>
      <label>
        <input
          type="checkbox"
          checked={compact}
          onChange={(event) => setCompact(event.currentTarget.checked)}
        />{' '}
        Compact layout
      </label>
      <rc-transfer-list ref={setTransferEl} multiple compact={compact ? true : undefined}>
        <select multiple aria-label="Available sections">
          <option value="breakfast">Breakfast</option>
          <option value="dinner" selected>
            Dinner
          </option>
          <option value="dessert">Dessert</option>
        </select>
      </rc-transfer-list>
      <EventLog entries={log} />
    </DemoFrame>
  );
}

const VC_CONTENT_W = 4000;
const VC_CONTENT_H = 3000;
const VC_MINOR = 100;
const VC_MAJOR = 500;

export function VirtualCanvasDemo() {
  const [vcEl, setVcEl] = useState<Element | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLSpanElement | null>(null);
  const dotsRef = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    if (!vcEl) {
      return;
    }

    const vc = vcEl as RCVirtualCanvasRef;

    vc.contentWidth = VC_CONTENT_W;
    vc.contentHeight = VC_CONTENT_H;

    function drawGrid(e: Event) {
      const { viewRect } = (e as CustomEvent<RCVirtualCanvasRenderDetail>).detail;
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return;
      }

      const scaleX = vc.canvasScaleX;
      const scaleY = vc.canvasScaleY;
      const viewW = viewRect.width / scaleX;
      const viewH = viewRect.height / scaleY;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scaleX, scaleY);

      // Minor grid lines
      ctx.beginPath();
      ctx.strokeStyle = '#dde1e7';
      ctx.lineWidth = 1;

      const minorX0 = Math.floor(viewRect.x / VC_MINOR) * VC_MINOR;
      const minorY0 = Math.floor(viewRect.y / VC_MINOR) * VC_MINOR;

      for (let x = minorX0; x <= viewRect.x + viewW + VC_MINOR; x += VC_MINOR) {
        ctx.moveTo(x - viewRect.x, 0);
        ctx.lineTo(x - viewRect.x, viewH);
      }

      for (let y = minorY0; y <= viewRect.y + viewH + VC_MINOR; y += VC_MINOR) {
        ctx.moveTo(0, y - viewRect.y);
        ctx.lineTo(viewW, y - viewRect.y);
      }

      ctx.stroke();

      // Major grid lines
      ctx.beginPath();
      ctx.strokeStyle = '#a8b0bc';
      ctx.lineWidth = 2;

      const majorX0 = Math.floor(viewRect.x / VC_MAJOR) * VC_MAJOR;
      const majorY0 = Math.floor(viewRect.y / VC_MAJOR) * VC_MAJOR;

      for (let x = majorX0; x <= viewRect.x + viewW + VC_MAJOR; x += VC_MAJOR) {
        ctx.moveTo(x - viewRect.x, 0);
        ctx.lineTo(x - viewRect.x, viewH);
      }

      for (let y = majorY0; y <= viewRect.y + viewH + VC_MAJOR; y += VC_MAJOR) {
        ctx.moveTo(0, y - viewRect.y);
        ctx.lineTo(viewW, y - viewRect.y);
      }

      ctx.stroke();

      // Coordinate labels at major intersections
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px monospace';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      for (let x = majorX0; x <= viewRect.x + viewW + VC_MAJOR; x += VC_MAJOR) {
        for (let y = majorY0; y <= viewRect.y + viewH + VC_MAJOR; y += VC_MAJOR) {
          ctx.fillText(`${x},${y}`, x - viewRect.x + 4, y - viewRect.y + 4);
        }
      }

      // Dots placed via clicks
      ctx.fillStyle = '#e53935';

      for (const dot of dotsRef.current) {
        const px = dot.x - viewRect.x;
        const py = dot.y - viewRect.y;

        if (px >= -8 && px <= viewW + 8 && py >= -8 && py <= viewH + 8) {
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    function handlePointer(e: Event) {
      const { type, contentX, contentY } = (e as CustomEvent<RCVirtualCanvasPointerDetail>).detail;

      if (overlayRef.current) {
        overlayRef.current.textContent = `${Math.round(contentX)}, ${Math.round(contentY)}`;
      }

      if (type === 'click') {
        dotsRef.current.push({ x: contentX, y: contentY });
        vc.requestRender();
      }
    }

    vcEl.addEventListener('rc-virtual-canvas-render', drawGrid);
    vcEl.addEventListener('rc-virtual-canvas-pointer', handlePointer);

    return () => {
      vcEl.removeEventListener('rc-virtual-canvas-render', drawGrid);
      vcEl.removeEventListener('rc-virtual-canvas-pointer', handlePointer);
    };
  }, [vcEl]);

  return (
    <DemoFrame>
      <rc-virtual-canvas
        ref={(el) => setVcEl(el)}
        render-mode="viewport-change"
        style={{ display: 'block', blockSize: '14rem', inlineSize: '100%' }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        <span
          ref={overlayRef}
          slot="overlay"
          style={
            {
              display: 'inline-block',
              margin: '6px',
              padding: '2px 6px',
              background: 'Canvas',
              color: 'CanvasText',
              border: '1px solid ButtonBorder',
              borderRadius: '3px',
              font: '11px/1.4 monospace',
              pointerEvents: 'none',
            } as CSSProperties
          }
        >
          0, 0
        </span>
      </rc-virtual-canvas>
    </DemoFrame>
  );
}

export function FormDataDemo() {
  const [output, setOutput] = useState('Submit to inspect FormData.');

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const lines = Array.from(data.entries()).map(([key, value]) => `${key}: ${value}`);

    setOutput(lines.join('\n') || '(empty)');
  };

  return (
    <DemoFrame>
      <form onSubmit={handleSubmit}>
        <label className="demo-col">
          <span>Status</span>
          <rc-select>
            <select name="status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </rc-select>
        </label>
        <button type="submit">Submit</button>
      </form>
      <pre className="demo-form-output">{output}</pre>
    </DemoFrame>
  );
}
