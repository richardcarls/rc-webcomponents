/*
 * Type-checks the generated React typings: `yarn test:typings`. Each
 * expression must compile; each `@ts-expect-error` must stay an error.
 */
import type { RCDialog } from '@rcarls/rc-dialog';
import type { RCSelect } from '@rcarls/rc-select';

declare const selectRef: { current: RCSelect | null };
declare const dialogRef: (element: RCDialog | null) => void;

export const attributes = (
  <rc-select popup-mode="dialog" multiple placeholder="Pick one" ref={selectRef}>
    <select name="status" aria-label="Status" />
  </rc-select>
);

export const properties = (
  <rc-select value={['a', 'b']} options={[{ value: 'a', label: 'A' }]} popupMode="popover" />
);

export const events = (
  <rc-select
    onrc-select-change={(event) => {
      const values: string[] = event.detail.selectedValues;

      return values;
    }}
  />
);

export const callbackRef = <rc-dialog ref={dialogRef} />;

export const cssProperties = (
  <rc-navigation-rail style={{ '--rc-navigation-rail-expanded-inline-size': '15rem' }} />
);

// @ts-expect-error popup-mode only accepts the documented modes.
export const badAttribute = <rc-select popup-mode="sideways" />;

// @ts-expect-error the detail is typed, so a misspelled field fails.
export const badEvent = <rc-select onrc-select-change={(event) => event.detail.selectedValue} />;
