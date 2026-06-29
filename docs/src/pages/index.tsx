import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const packages = [
  ['rc-select', 'Select-only ARIA combobox backed by native <select>', '/components/rc-select'],
  ['rc-combobox', 'Editable combobox with filtering and allow-create', '/components/rc-combobox'],
  ['rc-search-bar', 'Enhances a native search input with icon chrome and debounced events', '/components/rc-search-bar'],
  ['rc-app-bar', 'Headless grid app bar with exact-center composition and scroll behaviors', '/components/rc-app-bar'],
  ['rc-fab', 'Floating action button with regular and extended variants', '/components/rc-fab'],
  ['rc-slider', 'Single-thumb slider wrapping native <input type="range">', '/components/rc-slider'],
  ['rc-range-slider', 'Two-thumb range slider backed by native range inputs', '/components/rc-range-slider'],
  ['rc-textarea', 'Enhanced textarea with line decorations and plugin API', '/components/rc-textarea'],
  ['rc-transfer-list', 'Native-select-backed transfer list', '/components/rc-transfer-list'],
  ['rc-menu', 'ARIA menu popup', '/components/rc-menu'],
  ['rc-menu-button', 'Button that opens an ARIA menu', '/components/rc-menu-button'],
  ['rc-menubar', 'ARIA menubar with roving tabindex', '/components/rc-menubar'],
  ['rc-toolbar', 'ARIA toolbar', '/components/rc-toolbar'],
  ['rc-splitter', 'Resizable pane splitter', '/components/rc-splitter'],
  ['rc-dialog', 'Draggable and resizable <dialog> wrapper', '/components/rc-dialog'],
  ['rc-disclosure', 'Disclosure widget wrapping <details>/<summary>', '/components/rc-disclosure'],
  ['rc-accordion', 'Native <details> accordion coordinator with single or multiple open panels', '/components/rc-accordion'],
  ['rc-virtual-canvas', 'Virtualized canvas for large datasets', '/components/rc-virtual-canvas'],
  ['rc-markdown-editor', 'Rich/source Markdown editor', '/components/rc-markdown-editor'],
  ['rc-theme-material', 'Optional CSS-only Material 3 token bridge', '/guide/theme-previews'],
  ['rc-theme-substrate', 'Lightweight CSS-only reference theme for app foundations', '/guide/theme-previews'],
];

export default function Home() {
  return (
    <Layout
      title="WAI-ARIA compliant headless web components"
      description="WAI-ARIA compliant headless web components built with Lit"
    >
      <header className={styles.hero}>
        <div className={styles.inner}>
          <h1>rc-webcomponents</h1>
          <p>WAI-ARIA compliant headless web components built with Lit.</p>
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
            <h2>Headless</h2>
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
