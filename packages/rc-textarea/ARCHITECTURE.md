# rc-textarea Architecture

Internal reference for contributors and AI agents working on `rc-textarea` internals. For
consumer usage, see [README.md](README.md). For plugin authors, see
[PLUGIN_AUTHORING.md](PLUGIN_AUTHORING.md).

`rc-textarea` is heavier than most component packages in this repo because it owns an editing
surface, a shadow-DOM rendering layer, a synthetic undo stack, plugin decoration state, and
native textarea synchronization at the same time.

## Core Invariants

- A consumer-provided native `<textarea>` remains connected as the form control whenever the
  component is used in editable/form mode.
- The public value is plain text. Marks, line diagnostics, widgets, gutter labels, and syntax
  colors are visual decorations only.
- Host writes to `value` are silent. User editing dispatches `rc-textarea-change`.
- Selection is stored as plain-text offsets so it can survive full DOM rebuilds.
- Plugin, pattern, and external decorations are merged for rendering but keep separate sources.
- Runtime inline styles are limited to geometry and native textarea hiding/synchronization work.

## DOM Structure

```text
rc-textarea (LitElement shadow host, delegatesFocus=true)
└── #root part="root"
    ├── #gutter part="gutter" aria-hidden="true"
    │   └── #gutter-cells part="gutter-cells"
    │       └── .gutter-cell spans
    └── #editor-area part="editor-area"
        ├── #editor part="editor" contenteditable role="textbox"
        │   └── .line divs
        │       ├── text nodes
        │       ├── .mark spans
        │       ├── .widget spans contenteditable="false"
        │       └── data-message / data-message-class line metadata
        └── <slot>
            └── consumer <textarea> in light DOM
```

The shadow editor is the interactive surface after upgrade. The slotted textarea remains the
submission and validation surface and is visually hidden after slot resolution.

## File Map

| File                             | Purpose                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/rc-textarea.ts`             | Main LitElement: value state, native textarea sync, editing events, plugin lifecycle, render loop, gutter, undo/redo, event dispatch. |
| `src/document.ts`                | `RCDocument` builder and `getText()` extraction for the editor DOM.                                                                   |
| `src/blots.ts`                   | Parchment blot classes and registry for lines, marks, widgets, and the scroll root.                                                   |
| `src/selection.ts`               | `saveSelection()` / `restoreSelection()` plain-text offset conversion.                                                                |
| `src/decoration.ts`              | Decoration ID assignment, set replacement, and remapping through text edits.                                                          |
| `src/pattern-matcher.ts`         | Regex `TextPattern` matching and capture-group decoration expansion.                                                                  |
| `src/line-decorator.ts`          | `createLineDecoratorPlugin()` helper for line-relative decoration logic.                                                              |
| `src/line-actions-controller.ts` | Controller for action UI anchored to editor lines.                                                                                    |
| `src/types.ts`                   | Public interfaces and utility types.                                                                                                  |
| `src/rc-textarea.styles.ts`      | Shadow DOM layout, parts, tokens, and internal decoration selectors.                                                                  |

## Value Lifecycle

`value`, `defaultValue`, and slotted textarea content have precedence:

1. A host write to `value` wins and marks the component controlled.
2. `defaultValue` seeds the internal value only before value initialization.
3. Slotted textarea content seeds the internal value when neither `value` nor `defaultValue`
   already initialized it.

The initialization flags do not reset on reconnect. User edits update `_value`, sync the
textarea, dispatch `rc-textarea-change`, push undo state, and schedule a render. Programmatic
`value` writes sync the textarea and schedule render without dispatching change events.

## Editing Loop

1. Browser editing, paste, or plugin text mutation changes the contenteditable surface or the
   value model.
2. `_onInput()` extracts plain text with `getText()`, saves selection offsets, remaps existing
   plugin decorations through the edit, syncs the slotted textarea, pushes undo state, and
   dispatches `rc-textarea-change`.
3. `_scheduleRender()` batches work into one animation frame.
4. `_performRender()` resolves the display value, runs patterns, runs the active plugin, merges
   all decoration sources, rebuilds the Parchment document, restores selection, reapplies active
   line state, and syncs gutter labels/heights.

The editor DOM is rebuilt on each render frame because decoration changes can alter the
Parchment tree shape. Preserve DOM node identity only where source code explicitly supports it.

## Decoration Sources

Render-time decorations are merged in this order:

1. Plugin-owned decorations in `_pluginDecorations`.
2. Pattern-generated decorations in `_patternDecorations`.
3. External decorations from the `decorations` property.

Plugin decorations are mutable state owned by the active plugin API. Pattern decorations are
fully recomputed from regexes on each render. External decorations are generated from the
property value and receive fresh IDs during render.

`LineDecoration.gutterContent` can override gutter cells:

- `string` renders custom cell text.
- `null` renders an empty cell, suppressing built-in content.
- `undefined` lets the current gutter mode decide.

## Plugin Lifecycle

`usePlugin(plugin)`:

1. Calls `destroy()` on the current plugin.
2. Clears plugin styles, plugin decorations, cursor callbacks, and stale async sequence state.
3. Builds a live `RCTextareaPluginAPI`.
4. Calls `plugin.mount(api)`.
5. Schedules a render.

`removePlugin()` performs the same cleanup without mounting a replacement.

`plugin` is a property wrapper around the imperative API for framework integrations. Assigning
`null` removes the active plugin.

Async plugin hooks are guarded by `_pluginSeq`; stale async results return early when a newer
render or plugin change has advanced the sequence.

## Parchment Integration

Parchment provides the DOM shape and blot registry, but `rc-textarea` owns the render loop.

- The scroll/root blot wraps `#editor`.
- Block blots render `.line` elements.
- Inline blots render `.mark` spans.
- Widget blots render `.widget` spans with `contenteditable=false`.
- `RCDocument.build(text, decorations)` creates the new tree from scratch.

Parchment mutation observation is suppressed so browser DOM mutations do not fight the
component's scheduled render pass.

## Selection Management

The component cannot keep DOM `Range` objects across rebuilds, so selection is saved as
plain-text offsets:

- `saveSelection()` maps the active DOM selection to `{ anchorOffset, focusOffset }`.
- `restoreSelection()` maps saved offsets back into the rebuilt editor DOM.
- Widget decorations do not contribute characters to the plain-text coordinate space.
- Plugin API `selectionStart` and `selectionEnd` expose normalized offsets.

`selectionchange` is listened for at the document level. The handler ignores events unless the
host is focused, then updates active line state, emits `rc-textarea-select`, and notifies plugin
cursor subscribers.

## Undo And Redo

The browser's native contenteditable undo history is invalidated by full DOM rebuilds. The
component keeps its own stack of:

```ts
interface UndoEntry {
  value: string;
  anchorOffset: number;
  focusOffset: number;
}
```

The stack stores plain text and selection offsets only. Decorations are remapped or recomputed
from the restored value. The stack is capped at `MAX_UNDO` entries.

## Gutter Synchronization

The gutter is shadow DOM and `aria-hidden`. It can be enabled by `lineNumbers`, deprecated
`listNumbers`, or `gutter`.

`_computeGutterLabels()` produces one label per logical line, accounting for built-in modes and
`LineDecoration.gutterContent` overrides. `_syncGutter()` mutates only the cell count and text
that changed.

`_syncGutterHeights()` mirrors editor padding and line heights. In word-wrap mode it measures
each `.line` element and assigns explicit cell heights so wrapped lines stay aligned.

## Styling Contract

The public styling surface is CSS custom properties plus these parts:

- `root`
- `gutter`
- `gutter-cells`
- `editor-area`
- `editor`

Internal selectors such as `.line`, `.mark`, `.widget`, `.gutter-cell`, and `.line--active`
are implementation details, except that plugin authors may target them through
`api.adoptStyleSheet()` for decoration CSS.

Default colors use system colors. Keep new default styles forced-colors-safe and prefer
inherited custom properties over fixed palette choices.

## Deprecated Compatibility Surface

`listNumbers` / `list-numbers` and `label` are kept for compatibility and warn when used. New
docs and examples should prefer:

- `lineNumbers` for sequential numbering.
- `gutter` plus `LineDecoration.gutterContent` for sparse or custom gutter content.
- A real `<label for>` association or `aria-label` on the slotted textarea.

## Verification Checklist

When changing internals, cover the affected behavior with browser tests:

- Native textarea remains connected and synced for forms.
- Host `value` writes are silent; user edits dispatch `rc-textarea-change`.
- Selection survives rebuilds for typing, paste, undo/redo, and plugin text mutation.
- Pattern, plugin, and external decorations render together.
- Line diagnostics and gutter content align with wrapped and unwrapped lines.
- Accessibility audit covers the live enhanced editor, not only unupgraded markup.
