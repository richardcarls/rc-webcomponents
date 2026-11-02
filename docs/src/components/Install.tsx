import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';

export interface InstallProps {
  tag: string;
}

const PACKAGE_NAME = '@rcarls/rc-webcomponents';

const PACKAGE_MANAGERS = [
  { value: 'npm', label: 'npm', command: `npm install ${PACKAGE_NAME}` },
  { value: 'yarn', label: 'Yarn', command: `yarn add ${PACKAGE_NAME}` },
  { value: 'pnpm', label: 'pnpm', command: `pnpm add ${PACKAGE_NAME}` },
];

/**
 * Installs the aggregate package and registers one element. The package-manager choice is shared
 * across pages and can be preselected with `?package-manager=pnpm`.
 */
export function Install({ tag }: InstallProps) {
  return (
    <>
      <Tabs groupId="package-manager" queryString>
        {PACKAGE_MANAGERS.map(({ value, label, command }) => (
          <TabItem key={value} value={value} label={label}>
            <CodeBlock language="sh">{command}</CodeBlock>
          </TabItem>
        ))}
      </Tabs>
      <CodeBlock language="js">{`import '${PACKAGE_NAME}/${tag}/define';`}</CodeBlock>
    </>
  );
}
