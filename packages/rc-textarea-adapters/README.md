# @rcarls/rc-textarea-adapters

Adapter factories that connect Lezer, unified, and Shiki tokenizers to `rc-textarea`.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-textarea](https://richardcarls.github.io/rc-webcomponents/components/rc-textarea).

Part of the [rc-webcomponents](https://github.com/richardcarls/rc-webcomponents) library.

## Documentation

Full API, usage examples, and keyboard/accessibility notes are on the
[rc-webcomponents docs site](https://richardcarls.github.io/rc-webcomponents/).

## Peer dependencies

Install `@rcarls/rc-textarea` alongside this package. The tokenizer integrations
are optional, so install only the additional peer used by your chosen adapter:

| Adapter | Peer dependency |
| ------- | --------------- |
| Lezer   | `@lezer/common` |
| Unified | `unified`       |
| Shiki   | `shiki`         |

## License

MIT
