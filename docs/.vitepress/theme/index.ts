import { h } from 'vue';
import DefaultTheme from 'vitepress/theme';
import ApiTable from './components/ApiTable.vue';
import AtAGlance from './components/AtAGlance.vue';
import DemoFrame from './components/DemoFrame.vue';
import ThemeSwitcher from './components/ThemeSwitcher.vue';
import { installPreviewThemeController } from './preview-theme-controller';
import './style.css';
import '@rcarls/rc-theme-material/defaults.css';
import '@rcarls/rc-theme-material/bridge.css';
import '@rcarls/rc-theme-material/components.css';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'nav-bar-content-after': () => h(ThemeSwitcher),
  }),
  async enhanceApp({ app }: { app: any }) {
    app.component('ApiTable', ApiTable);
    app.component('AtAGlance', AtAGlance);
    app.component('DemoFrame', DemoFrame);
    if (!import.meta.env.SSR) {
      await Promise.all([
        import('@rcarls/rc-webcomponents/define'),
        import('@rcarls/rc-virtual-canvas/define'),
      ]);
      installPreviewThemeController();
      const { defineThemePreview } = await import('./components/theme-preview');
      defineThemePreview();
    }
  },
};
