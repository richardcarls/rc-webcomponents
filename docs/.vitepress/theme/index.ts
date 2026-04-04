import DefaultTheme from 'vitepress/theme';
import ApiTable from './components/ApiTable.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  async enhanceApp({ app }: { app: any }) {
    app.component('ApiTable', ApiTable);
    if (!import.meta.env.SSR) {
      await Promise.all([
        import('@rcarls/rc-webcomponents/define'),
        import('@rcarls/rc-virtual-canvas/define'),
      ]);
    }
  },
};
