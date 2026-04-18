---
layout: home

hero:
  name: rc-webcomponents
  text: WAI-ARIA compliant headless web components
  tagline: Built with Lit 3 · Accessible by default · Framework-agnostic · Zero visual opinions
  actions:
    - theme: brand
      text: Browse components
      link: /components/rc-select
    - theme: alt
      text: GitHub
      link: https://github.com/richardcarls/rc-webcomponents

features:
  - title: Accessible by default
    details: Every component implements the relevant WAI-ARIA Authoring Practices Guide pattern — correct roles, keyboard navigation, focus management, and screen reader support included.
  - title: Headless
    details: No imposed colors, fonts, or spacing. Components use CSS system color keywords so they adapt to light and dark mode automatically, and slot into any design system.
  - title: Progressive enhancement
    details: Each component wraps a native HTML element. Forms, labels, and assistive technology work before the custom element upgrades and without JavaScript.
  - title: Framework-agnostic
    details: Standard custom elements. Drop them into plain HTML, React, Vue, Svelte, Solid, or any other framework without adapters.
---

## Packages

| Package | Description |
| --- | --- |
| [rc-select](/components/rc-select) | Select-only ARIA combobox backed by native `<select>` |
| [rc-combobox](/components/rc-combobox) | Editable combobox with filtering and allow-create |
| [rc-slider](/components/rc-slider) | Single-thumb slider wrapping native `<input type="range">` |
| [rc-range-slider](/components/rc-range-slider) | Two-thumb range slider |
| [rc-textarea](/components/rc-textarea) | Enhanced textarea with line decorations and plugin API |
| [rc-transfer-list](/components/rc-transfer-list) | ARIA transfer list (dual listbox) |
| [rc-menu](/components/rc-menu) | ARIA menu popup |
| [rc-menu-button](/components/rc-menu-button) | Button that opens an ARIA menu |
| [rc-menubar](/components/rc-menubar) | ARIA menubar with roving tabindex |
| [rc-toolbar](/components/rc-toolbar) | ARIA toolbar |
| [rc-splitter](/components/rc-splitter) | Resizable pane splitter |
| [rc-dialog](/components/rc-dialog) | Draggable and resizable `<dialog>` wrapper |
| [rc-disclosure](/components/rc-disclosure) | Disclosure widget wrapping `<details>`/`<summary>` |
| [rc-accordion](/components/rc-accordion) | Accordion coordinator for disclosure groups |
| [rc-virtual-canvas](/components/rc-virtual-canvas) | Virtual canvas for large datasets |
| [rc-markdown-editor](/components/rc-markdown-editor) | WYSIWYG Markdown editor |
