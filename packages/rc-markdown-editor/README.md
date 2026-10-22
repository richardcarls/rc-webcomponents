# @rcarls/rc-markdown-editor

Rich/source Markdown editor with a formatting toolbar, backed by `rc-textarea`.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-markdown-editor](https://richardcarls.github.io/rc-webcomponents/components/rc-markdown-editor).

Part of the [rc-webcomponents](https://github.com/richardcarls/rc-webcomponents) library.

## Localization

Built-in text follows the element's own `lang`, else `<html lang>`, and never an
ancestor's `lang`, which usually marks content. Override it per element with the
`messages` property, or for every instance with `registerMessages()` from
`@rcarls/rc-common` under `rc-markdown-editor`. Keys: `source`, `linkPopover`, `url`, `applyLink`, `openLink`, `removeLink`, `shortcut`. The toolbar resolves `rc-editor-toolbar` (`toolbar`, `bold`, `heading`, and the other button names) and takes the editor's `lang`. See the
[rc-common Localization section](https://github.com/richardcarls/rc-webcomponents/tree/develop/packages/rc-common#localization).

## Documentation

Full API, usage examples, and keyboard/accessibility notes are on the
[rc-webcomponents docs site](https://richardcarls.github.io/rc-webcomponents/).

## Attributions

The `rc-markdown-editor` toolbar uses icons from [Bootstrap Icons](https://icons.getbootstrap.com/) by the Bootstrap Authors, licensed under the [MIT License](https://github.com/twbs/icons/blob/main/LICENSE).

## License

MIT
