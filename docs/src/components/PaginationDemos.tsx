import { useState } from 'react';

import { paginationRange } from '@rcarls/rc-webcomponents/rc-pagination';
import { DemoFrame } from './DemoFrame';

const TOTAL = 12;

/** Client-side pagination: buttons rendered from paginationRange, page owned by React state. */
export function PaginationDemo() {
  const [page, setPage] = useState(6);

  return (
    <DemoFrame>
      <rc-pagination
        total={TOTAL}
        page={page}
        announce
        onrc-pagination-change={(event) => setPage(event.detail.page)}
      >
        <nav>
          <ul>
            <li>
              <button type="button" data-rc-page="previous">
                Previous
              </button>
            </li>
            {paginationRange({ page, total: TOTAL }).map((item, index) =>
              item === 'ellipsis' ? (
                <li key={`gap-${index}`} aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={item}>
                  <button type="button" data-rc-page={item}>
                    {item}
                  </button>
                </li>
              ),
            )}
            <li>
              <button type="button" data-rc-page="next">
                Next
              </button>
            </li>
          </ul>
        </nav>
      </rc-pagination>
      <p>
        Showing page <strong>{page}</strong> of {TOTAL}.
      </p>
    </DemoFrame>
  );
}
