import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const packages = [
  ['rc-select', 'Select-only combobox backed by native <select>', '/components/rc-select'],
  ['rc-combobox', 'Editable combobox with filtering and optional allow-create behavior', '/components/rc-combobox'],
  ['rc-search-bar', 'Search field wrapper for native <input type="search">', '/components/rc-search-bar'],
  ['rc-app-bar', 'App bar modeled after Material 3 Top app bar', '/components/rc-app-bar'],
  ['rc-fab', 'Sticky floating action button modeled after Material 3 FAB', '/components/rc-fab'],
  ['rc-slider', 'Single-thumb slider backed by native <input type="range">', '/components/rc-slider'],
  ['rc-range-slider', 'Two-thumb range slider backed by native range inputs', '/components/rc-range-slider'],
  ['rc-textarea', 'Textarea wrapper with line decorations and plugin hooks', '/components/rc-textarea'],
  ['rc-transfer-list', 'Transfer list enhancing native <select multiple>', '/components/rc-transfer-list'],
  ['rc-menu', 'Menu popup for command surfaces', '/components/rc-menu'],
  ['rc-menu-button', 'Trigger button that opens an rc-menu popup', '/components/rc-menu-button'],
  ['rc-menubar', 'Menubar coordinator for rc-menu-button children', '/components/rc-menubar'],
  ['rc-toolbar', 'Toolbar that groups controls into one tab stop', '/components/rc-toolbar'],
  ['rc-splitter', 'Resizable pane splitter with pointer and keyboard controls', '/components/rc-splitter'],
  ['rc-dialog', 'Draggable, resizable wrapper for native <dialog>', '/components/rc-dialog'],
  ['rc-disclosure', 'Disclosure wrapper for native <details>/<summary>', '/components/rc-disclosure'],
  ['rc-accordion', 'Accordion coordinator for native <details> panels', '/components/rc-accordion'],
  ['rc-virtual-canvas', 'Scrollable virtual canvas for large coordinate spaces', '/components/rc-virtual-canvas'],
  ['rc-markdown-editor', 'Rich/source Markdown editor backed by rc-textarea', '/components/rc-markdown-editor'],
  ['rc-theme-material', 'Material 3 CSS theme and token bridge', '/guide/theme-previews'],
  ['rc-theme-substrate', 'Lightweight CSS reference theme for app layouts', '/guide/theme-previews'],
];

export default function Home() {
  return (
    <Layout
      title="Themeable web components for app interfaces"
      description="Themeable web components that enhance native HTML controls and implement APG patterns where they apply"
    >
      <header className={styles.hero}>
        <div className={styles.inner}>
          <h1>rc-webcomponents</h1>
          <p>Themeable web components that enhance native HTML controls and implement APG patterns where they apply.</p>
          <div className={styles.actions}>
            <Link className="button button--primary" to="/components/rc-select">Browse components</Link>
            <Link className="button button--secondary" to="/guide/progressive-enhancement">Progressive enhancement</Link>
            <a className="button button--secondary" href="https://github.com/richardcarls/rc-webcomponents">GitHub</a>
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <section className={styles.features} aria-label="Design principles">
          <article>
            <h2>Accessible by default</h2>
            <p>Components implement relevant WAI-ARIA patterns with keyboard support, focus management, and screen reader behavior.</p>
          </article>
          <article>
            <h2>Design-system neutral</h2>
            <p>No imposed colors, fonts, or spacing. Components fit plain HTML pages and design systems.</p>
          </article>
          <article>
            <h2>Progressive enhancement</h2>
            <p>Native controls remain in the DOM so forms, labels, and assistive technology keep working before upgrade.</p>
          </article>
        </section>
        <section>
          <h2>Packages</h2>
          <table>
            <thead>
              <tr><th>Package</th><th>Description</th></tr>
            </thead>
            <tbody>
              {packages.map(([name, description, href]) => (
                <tr key={name}>
                  <td>{href ? <Link to={href}>{name}</Link> : <span>{name}</span>}</td>
                  <td>{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </Layout>
  );
}
