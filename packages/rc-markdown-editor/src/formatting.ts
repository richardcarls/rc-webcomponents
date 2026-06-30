import type { Decoration } from '@rcarls/rc-textarea';

import type { ActiveFormats, HeadingLevel } from './types.ts';


/**
 * Replaces the language token on the opening fence of the code block containing
 * `selectionStart`. Returns the updated string, or `null` if the cursor is not
 * inside a fenced code block.
 *
 * @param value - Full source editor value.
 * @param selectionStart - Cursor offset used to locate the containing fence.
 * @param language - Language string to write (empty string removes the token).
 */
export function setCodeBlockLanguage(
  value: string,
  selectionStart: number,
  language: string,
): string | null {
  const before = value.slice(0, selectionStart);
  const fencePattern = /^```[^\n]*(?:\n|$)/gm;
  let openingFence: RegExpExecArray | null = null;
  let fenceMatch: RegExpExecArray | null;

  while ((fenceMatch = fencePattern.exec(before)) !== null) {
    openingFence = openingFence === null ? fenceMatch : null;
  }

  if (openingFence === null) {
    return null;
  }

  const fenceStart = openingFence.index;
  const newlineIndex = openingFence[0].indexOf('\n');
  const fenceEnd = fenceStart + (newlineIndex === -1 ? openingFence[0].length : newlineIndex + 1);

  return value.slice(0, fenceStart) + '```' + language + '\n' + value.slice(fenceEnd);
}


/**
 * Derives active inline and block formats from the decoration array at a given
 * selection range in the markdown source editor. Used for toolbar state sync in
 * source mode.
 */
export function getFormatsFromDecorations(
  decorations: readonly Decoration[],
  start: number,
  end: number,
): Omit<ActiveFormats, 'codeLanguage'> {
  const marks = decorations.filter(
    (d): d is Extract<Decoration, { type: 'mark' }> =>
      d.type === 'mark' && d.from <= start && d.to >= end,
  );

  const headingMark = marks.find((d) => d.className?.startsWith('rme-heading-'));
  const headingLevel = headingMark?.className?.replace('rme-heading-', '') as HeadingLevel | undefined;

  return {
    bold:         marks.some((d) => d.bold),
    italic:       marks.some((d) => d.italic),
    underline:    marks.some((d) => d.className === 'rme-underline'),
    strikethrough: marks.some((d) => d.className === 'rme-strikethrough'),
    code:         marks.some((d) => d.className === 'rme-code'),
    link:         marks.some((d) => d.className === 'rme-link'),
    heading:      headingLevel ?? null,
    blockquote:   marks.some((d) => d.className === 'rme-blockquote'),
    bulletList:   marks.some((d) => d.className === 'rme-list-bullet'),
    orderedList:  marks.some((d) => d.className === 'rme-list-ordered'),
    codeBlock:    marks.some((d) => d.className === 'rme-code-block'),
  };
}
