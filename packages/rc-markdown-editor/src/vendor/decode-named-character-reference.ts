/**
 * Lazy copy of the DOM build of `decode-named-character-reference` (MIT, by
 * Titus Wormer), which micromark uses to decode named character references.
 *
 * The published DOM build creates its decoding element when the module is
 * evaluated, so importing this package anywhere without a `document` (a server
 * render that evaluates client modules) threw before any element was defined.
 * This copy creates the element on first use instead. The non-DOM build avoids
 * `document` too, but it bundles the full HTML entity table.
 */
let element: HTMLElement | undefined;

export function decodeNamedCharacterReference(value: string): string | false {
  const characterReference = `&${value};`;

  element ??= document.createElement('i');
  element.innerHTML = characterReference;

  const character = element.textContent ?? '';

  // Some named references do not need their closing semicolon (`&not`), so
  // `&notit;` decodes to `¬it;`. A trailing semicolon after decoding, for any
  // reference other than `&semi;` itself, means the match was incomplete.
  if (character.charCodeAt(character.length - 1) === 59 && value !== 'semi') {
    return false;
  }

  // An unchanged string means the reference was not valid.
  return character === characterReference ? false : character;
}
