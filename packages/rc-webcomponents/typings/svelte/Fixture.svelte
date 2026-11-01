<!--
  Type-checks the generated Svelte typings: `yarn test:typings`. Each
  attribute must compile; each `@ts-expect-error` must stay an error.
-->
<script lang="ts">
  import type { SvelteHTMLElements } from 'svelte/elements';
  import type { RCSelect, RCSelectChangeEvent } from '@rcarls/rc-select';

  let select: RCSelect | undefined = $state();

  function onChange(event: CustomEvent<RCSelectChangeEvent>) {
    const values: string[] = event.detail.selectedValues;

    return values;
  }

  // Markup has no expect-error comment, so the failing cases check the props type.
  // @ts-expect-error popup-mode only accepts the documented modes.
  export const badAttribute: SvelteHTMLElements['rc-select'] = { 'popup-mode': 'sideways' };

  export const badEvent: SvelteHTMLElements['rc-select'] = {
    // @ts-expect-error the detail is typed, so a misspelled field fails.
    'onrc-select-change': (event) => event.detail.selectedValue,
  };
</script>

<rc-select bind:this={select} popup-mode="dialog" multiple placeholder="Pick one" onrc-select-change={onChange}>
  <select name="status" aria-label="Status"></select>
</rc-select>

<rc-select value={['a', 'b']} options={[{ value: 'a', label: 'A' }]}></rc-select>

<rc-pagination page={2} total={12} onrc-pagination-change={(event) => event.detail.page}></rc-pagination>
