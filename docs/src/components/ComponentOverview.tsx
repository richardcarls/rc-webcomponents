import type { PropSidebarItemCategory } from '@docusaurus/plugin-content-docs';
import { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import DocCardList from '@theme/DocCardList';
import Heading from '@theme/Heading';

/**
 * Lists every category of the current sidebar as a heading and a card grid, so the overview
 * follows `sidebars.ts` without a second list to maintain.
 */
export function ComponentOverview() {
  const categories = (useDocsSidebar()?.items ?? []).filter(
    (item): item is PropSidebarItemCategory => item.type === 'category',
  );

  return (
    <>
      {categories.map((category) => (
        <section key={category.label}>
          <Heading as="h2">{category.label}</Heading>
          <DocCardList items={category.items} />
        </section>
      ))}
    </>
  );
}
