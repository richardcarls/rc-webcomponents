import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const packages = [
  ['rc-select', 'Select-only ARIA combobox backed by native <select>', '/components/rc-select'],
  ['rc-accordion', 'Native <details> accordion coordinator with single or multiple open panels', '/components/rc-accordion'],
  ['rc-combobox', 'Editable combobox with filtering and allow-create', undefined],
  ['rc-search-bar', 'Enhances a native search input with icon chrome and debounced events', undefined],
  ['rc-dialog', 'Draggable and resizable <dialog> wrapper', undefined],
  ['rc-theme-material', 'Optional CSS-only Material 3 token bridge', undefined],
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
