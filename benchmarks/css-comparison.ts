export {};

const mode = new URL(location.href).searchParams.get('mode');

if (mode !== 'css' && mode !== 'component') {
  throw new Error('Expected mode=css or mode=component.');
}

await import('@rcarls/rc-theme-material/theme.css');

if (mode === 'css') {
  await import('@rcarls/rc-theme-material/css-components.css');
  await import('@rcarls/rc-theme-material/native.css');
} else {
  await Promise.all([import('@rcarls/rc-button/define'), import('@rcarls/rc-select/define')]);
}

const root = document.querySelector<HTMLElement>('#comparison');

if (!root) {
  throw new Error('Missing comparison root.');
}

Object.assign(window, {
  rcCssComparisonMode: mode,
  runRcCssComparison: async () => {
    const startedAt = performance.now();
    const fragment = document.createDocumentFragment();
    const hosts: Array<HTMLElement & { updateComplete?: Promise<boolean> }> = [];

    for (let index = 0; index < 100; index += 1) {
      const button = document.createElement('button');

      button.type = 'button';
      button.textContent = `Action ${index}`;

      if (mode === 'css') {
        button.className = 'rc-button';
        fragment.append(button);
      } else {
        const host = document.createElement('rc-button');

        host.append(button);
        fragment.append(host);
        hosts.push(host);
      }
    }

    for (let index = 0; index < 50; index += 1) {
      const select = document.createElement('select');

      select.setAttribute('aria-label', `Choice ${index}`);

      select.innerHTML = Array.from(
        { length: 20 },
        (_, optionIndex) => `<option value="${optionIndex}">Option ${optionIndex}</option>`,
      ).join('');

      if (mode === 'css') {
        select.className = 'rc-select';
        fragment.append(select);
      } else {
        const host = document.createElement('rc-select');

        host.append(select);
        fragment.append(host);
        hosts.push(host);
      }
    }

    root.replaceChildren(fragment);
    await Promise.all(hosts.map((host) => host.updateComplete));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    // Force style and layout before recording the completed mount time.
    root.getBoundingClientRect();

    return { mountMs: performance.now() - startedAt, controls: root.childElementCount };
  },
});
