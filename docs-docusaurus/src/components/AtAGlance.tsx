import Link from '@docusaurus/Link';
import styles from './AtAGlance.module.css';

export interface AtAGlanceLink {
  label: string;
  href: string;
}

export interface AtAGlanceProps {
  packageName: string;
  tag: string;
  native?: string;
  state?: string;
  events?: string[];
  related?: AtAGlanceLink[];
}

export function AtAGlance({
  packageName,
  tag,
  native = 'No required native child',
  state = 'Uncontrolled by default',
  events = [],
  related = [],
}: AtAGlanceProps) {
  return (
    <dl className={styles.root} aria-label="Component summary">
      <div>
        <dt>Package</dt>
        <dd><code>{packageName}</code></dd>
      </div>
      <div>
        <dt>Element</dt>
        <dd><code>{`<${tag}>`}</code></dd>
      </div>
      <div>
        <dt>Native dependency</dt>
        <dd>{native}</dd>
      </div>
      <div>
        <dt>State model</dt>
        <dd>{state}</dd>
      </div>
      <div>
        <dt>Main events</dt>
        <dd>
          {events.length ? events.map((eventName) => <code key={eventName}>{eventName}</code>) : 'None'}
        </dd>
      </div>
      <div>
        <dt>Related</dt>
        <dd>
          {related.map((item) => (
            <Link key={item.href} to={item.href}>{item.label}</Link>
          ))}
          <Link to="/guide/theme-previews">Theme previews</Link>
        </dd>
      </div>
    </dl>
  );
}
