import { useMemo, useState } from 'react';

import type { RCDataTableSortDirection } from '@rcarls/rc-webcomponents/rc-data-table';
import { DemoFrame } from './DemoFrame';

const rows = [
  { name: 'Aster', category: 'Perennial', price: 12 },
  { name: 'Begonia', category: 'Annual', price: 8 },
  { name: 'Cosmos', category: 'Annual', price: 6 },
  { name: 'Dahlia', category: 'Tuber', price: 15 },
];

type Key = keyof (typeof rows)[number];

/** React owns the rows and the sort state; rc-data-table reflects it and reports requests. */
export function DataTableDemo() {
  const [sort, setSort] = useState<{ key: Key; direction: RCDataTableSortDirection }>({
    key: 'name',
    direction: 'ascending',
  });
  const sorted = useMemo(() => {
    const factor = sort.direction === 'ascending' ? 1 : -1;

    return [...rows].sort((a, b) =>
      a[sort.key] < b[sort.key] ? -factor : a[sort.key] > b[sort.key] ? factor : 0,
    );
  }, [sort]);

  return (
    <DemoFrame>
      <rc-data-table
        sort-key={sort.key}
        sort-direction={sort.direction}
        announce
        onrc-data-table-sort={(event) =>
          setSort({ key: event.detail.key as Key, direction: event.detail.direction })
        }
      >
        <table>
          <caption>Plants. Column headers with buttons are sortable.</caption>
          <thead>
            <tr>
              <th scope="col" data-rc-sort-key="name">
                <button type="button">Name</button>
              </th>
              <th scope="col" data-rc-sort-key="category">
                <button type="button">Category</button>
              </th>
              <th scope="col" data-rc-sort-key="price" data-rc-sort-first="descending">
                <button type="button">Price</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.category}</td>
                <td>${row.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </rc-data-table>
    </DemoFrame>
  );
}
