/**
 * Server-render hydration fixtures. Each component package keeps an
 * `ssr-fixtures.ts` at its root that default-exports one of these, keyed by
 * tag, covering every element the package defines.
 */
export interface SsrFixture {
  /** Page markup holding the element, as an author would write it. */
  markup: string;
  /**
   * Why the element does not hydrate to the same result as a client render
   * yet. Its test then runs as an expected failure, so a fix shows up as a
   * failing test until this note is removed.
   */
  pending?: string;
}

export type SsrFixtures = Record<string, SsrFixture>;
