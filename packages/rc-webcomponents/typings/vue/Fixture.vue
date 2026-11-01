<!--
  Type-checks the generated Vue typings: `yarn test:typings`. Each binding
  must compile; each `@vue-expect-error` must stay an error.
-->
<script setup lang="ts">
import type { RCSelectChangeEvent } from '@rcarls/rc-select';

function onChange(event: CustomEvent<RCSelectChangeEvent>) {
  const values: string[] = event.detail.selectedValues;

  return values;
}
</script>

<template>
  <rc-select popup-mode="dialog" multiple placeholder="Pick one" @rc-select-change="onChange">
    <select name="status" aria-label="Status"></select>
  </rc-select>

  <rc-select :value="['a', 'b']" :options="[{ value: 'a', label: 'A' }]" />

  <rc-pagination :page="2" :total="12" @rc-pagination-change="(event) => event.detail.page" />

  <rc-navigation-rail :style="{ '--rc-navigation-rail-expanded-inline-size': '15rem' }" />

  <!-- @vue-expect-error popup-mode only accepts the documented modes. -->
  <rc-select popup-mode="sideways" />

  <!-- @vue-expect-error the detail is typed, so a misspelled field fails. -->
  <rc-select @rc-select-change="(event) => event.detail.selectedValue" />
</template>
