# CLAUDE.md

WAI-ARIA compliant web components library built with Lit 3.x. Monorepo using Yarn workspaces with packages in `packages/`.

## Environment (Windows)

**Always use `yarn.cmd` instead of `yarn`** (and `npx.cmd` instead of `npx`). The Unix shim in `%APPDATA%\npm` is broken.

## Commands

```bash
yarn.cmd workspace @rcarls/<package> run dev           # Dev server with hot reload
yarn.cmd workspace @rcarls/<package> run build         # TypeScript check + Vite build
yarn.cmd workspace @rcarls/<package> run test:browser  # Run browser tests
yarn.cmd workspaces run build                          # Build all packages
```

## Packages

Dependencies listed as `→ dep1, dep2` (resolves to each dep's `dist/` output). **Rebuild a package before running tests in packages that depend on it.**

- **rc-common**: Shared directives (`KeyboardNavigationDirective`, `MouseMoveDirective`)
- **rc-menu**: Menu popup → rc-common
- **rc-menu-button**: Menu button → rc-common, rc-menu
- **rc-menubar**: Menubar → rc-common, rc-menu-button
- **rc-toolbar**: Toolbar → rc-common
- **rc-splitter**: Window splitter → rc-common
- **rc-textarea**: Enhanced textarea (standalone)
- **rc-virtual-canvas**: Virtual canvas (standalone)
