---
'@rcarls/rc-webcomponents': minor
---

Add a per-component subpath for every component in the aggregate package.

Registering elements from `@rcarls/rc-webcomponents` was previously
all-or-nothing: the only side-effectful entry was `./define`, which imports all
37 components, so an app using three of them still paid for the collection.
Anyone who wanted tree-shaking had to install the standalone packages instead,
trading one dependency for 37.

Each component now has its own subpath (`@rcarls/rc-webcomponents/rc-button`
for the classes, `@rcarls/rc-webcomponents/rc-button/define` to register the
element), mirroring the `.` and `./define` pair each standalone package already
exposes. The subpath is the package name, so migrating between the two spellings
is a prefix swap, and the generated entries are re-exports rather than copies:
importing `@rcarls/rc-webcomponents/rc-button/define` produces a byte-identical
bundle to importing `@rcarls/rc-button/define`, 11.7 kB compressed against
192 kB for the collection-wide `./define`.

Installing the aggregate and installing individual packages now cost the same
bundle bytes, so the choice is about dependency management rather than size.
`./define` still registers everything for apps that want it.
