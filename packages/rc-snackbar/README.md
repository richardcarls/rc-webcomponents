# @rcarls/rc-snackbar

Live-region host for brief status messages and optional actions.

```html
<rc-snackbar id="snackbar"></rc-snackbar>
<script type="module">
  import '@rcarls/rc-snackbar/define';

  document.querySelector('#snackbar').show({
    message: 'Recipe saved',
    actionLabel: 'Undo',
  });
</script>
```
