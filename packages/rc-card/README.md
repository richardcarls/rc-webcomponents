# @rcarls/rc-card

Design-system-neutral card shell with structural slots and parts.

```html
<rc-card interactive action-target="recipe-link">
  <img slot="media" src="recipe.jpg" alt="" />
  <a id="recipe-link" slot="title" href="/recipes/pie">Apple pie</a>
  <p>Flaky crust, bright apples.</p>
</rc-card>
```

The host owns structure and layout, including one `rem` of default body padding.
Authors provide native anchors or buttons for semantics and keyboard access.
