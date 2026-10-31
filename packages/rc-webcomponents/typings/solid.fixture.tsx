/*
 * Type-checks the generated Solid typings: `yarn test:typings`. Each
 * expression must compile; each `@ts-expect-error` must stay an error.
 */
import type { RCSelect } from '@rcarls/rc-select';

declare let select: RCSelect | undefined;

export const attributes = (
  <rc-select popup-mode="dialog" multiple="" placeholder="Pick one" ref={select}>
    <select name="status" aria-label="Status" />
  </rc-select>
);

export const properties = (
  <rc-select prop:value={['a', 'b']} prop:options={[{ value: 'a', label: 'A' }]} />
);

export const events = (
  <rc-select
    on:rc-select-change={(event) => {
      const values: string[] = event.detail.selectedValues;

      return values;
    }}
  />
);

export const cssProperties = (
  <rc-navigation-rail style={{ '--rc-navigation-rail-expanded-inline-size': '15rem' }} />
);

// @ts-expect-error popup-mode only accepts the documented modes.
export const badAttribute = <rc-select popup-mode="sideways" />;

// @ts-expect-error the detail is typed, so a misspelled field fails.
export const badEvent = <rc-select on:rc-select-change={(event) => event.detail.selectedValue} />;
