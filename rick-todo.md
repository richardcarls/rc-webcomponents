# Rick's notes

## @rcarls/rc-common

- [x] Refactor KeyboardNavigationDirective to use the term "navigation axis" to describe sets of arrow key functionality like next, prev, and open-first, open-last

## @rcarls/rc-splitter

- [ ] Add new handler just for viewport/window resize events, recalculate value based on current *ratio*

## @rcarls/rc-textarea

- [ ] Consider refactoring to contenteditable instead of textarea + mirror div for e.g. inline widgets and better UX selecting bold text or text with different text formatting.
- [ ] Make sure gutter (line numbers) padding is removed absent the boolean attribute.

## Ideas

- [ ] Filterable single/multi-select (https://josh.ch/dropdown/multi.html)
  - Graceful degradation of new customizable select usage (https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select)
  - Also https://open-ui.org/components/customizableselect/
- [ ] Responsive and accessible table (see https://adrianroselli.com/2017/11/a-responsive-accessible-table.html)
  - Also sortable? (see https://adrianroselli.com/2021/04/sortable-table-columns.html)
- [ ] Mostly CSS implemented toggle (see codepen at bottom of https://adrianroselli.com/2019/03/under-engineered-toggles.html)
- [ ] Masked input (https://robinherbots.github.io/Inputmask/)
- [ ] Multi-thumb Slider (https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/)
  - Disabled state, for Stars! project