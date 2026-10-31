import { useState } from 'react';

import { DemoFrame } from './DemoFrame';

const pages = [
  { href: '/workspace', label: 'Workspace' },
  { href: '/workspace/settings', label: 'Settings' },
  { href: '/workspace/settings/members', label: 'Members' },
];

/** A breadcrumb trail whose current page follows client-side navigation through current-href. */
export function BreadcrumbsDemo() {
  const [current, setCurrent] = useState('/workspace/settings/members');

  return (
    <DemoFrame>
      <rc-breadcrumbs current-href={current}>
        <nav>
          <ol>
            {pages.map((page) => (
              <li key={page.href}>
                <a
                  href={page.href}
                  onClick={(event) => {
                    event.preventDefault();
                    setCurrent(page.href);
                  }}
                >
                  {page.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </rc-breadcrumbs>
      <p>
        Current page: <code>{current}</code>
      </p>
    </DemoFrame>
  );
}
