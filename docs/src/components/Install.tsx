import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';

export interface InstallProps {
  tag: string;
}

const PACKAGE_NAME = '@rcarls/rc-webcomponents';

const PACKAGE_MANAGERS = [
  { value: 'npm', label: 'npm', command: 'npm install' },
  { value: 'yarn', label: 'Yarn', command: 'yarn add' },
  { value: 'pnpm', label: 'pnpm', command: 'pnpm add' },
];

/**
 * Installs the aggregate package and registers one element. The package-manager choice is shared
 * across pages and can be preselected with `?package-manager=pnpm`.
 * Preview documentation installs `@next`; stable documentation uses the default npm channel.
 */
export function Install({ tag }: InstallProps) {
  const { siteConfig } = useDocusaurusContext();
  const packageSpecifier =
    siteConfig.customFields?.releaseChannel === 'next' ? `${PACKAGE_NAME}@next` : PACKAGE_NAME;

  return (
    <>
      <Tabs groupId="package-manager" queryString>
        {PACKAGE_MANAGERS.map(({ value, label, command }) => (
          <TabItem key={value} value={value} label={label}>
            <CodeBlock language="sh">{`${command} ${packageSpecifier}`}</CodeBlock>
          </TabItem>
        ))}
      </Tabs>
      <CodeBlock language="js">{`import '${PACKAGE_NAME}/${tag}/define';`}</CodeBlock>
    </>
  );
}
