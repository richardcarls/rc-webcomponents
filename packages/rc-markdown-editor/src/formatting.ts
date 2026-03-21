import type { Decoration } from '@rcarls/rc-textarea';

import type { ActiveFormats, HeadingLevel } from './types.ts';


/**
 * Derives active inline and block formats from the decoration array at a given
 * selection range in the markdown source editor. Used for toolbar state sync in
 * source mode.
 */
export function getFormatsFromDecorations(
  decorations: readonly Decoration[],
  start: number,
  end: number,
): ActiveFormats {
  const marks = decorations.filter(
    (d): d is Extract<Decoration, { type: 'mark' }> =>
      d.type === 'mark' && d.from <= start && d.to >= end,
  );

  const headingMark = marks.find((d) => d.className?.startsWith('rme-heading-'));
  const headingLevel = headingMark?.className?.replace('rme-heading-', '') as HeadingLevel | undefined;

  return {
    bold:         marks.some((d) => d.bold),
    italic:       marks.some((d) => d.italic),
    code:         marks.some((d) => d.className === 'rme-code'),
    link:         marks.some((d) => d.className === 'rme-link'),
    heading:      headingLevel ?? null,
    blockquote:   marks.some((d) => d.className === 'rme-blockquote'),
    bulletList:   marks.some((d) => d.className === 'rme-list-bullet'),
    orderedList:  marks.some((d) => d.className === 'rme-list-ordered'),
    codeBlock:    marks.some((d) => d.className === 'rme-code-block'),
  };
}
