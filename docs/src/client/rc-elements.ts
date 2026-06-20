interface DocusaurusRuntimeWindow extends Window {
  __docusaurus?: {
    siteConfig?: {
      baseUrl?: string;
    };
  };
}

const SCRIPT_ID = 'rc-webcomponents-define-script';

function normalizeBaseUrl(baseUrl: string | undefined): string {
  const value = baseUrl || '/rc-webcomponents/';
  return value.endsWith('/') ? value : `${value}/`;
}

if (typeof document !== 'undefined' && !document.getElementById(SCRIPT_ID)) {
  const runtimeWindow = window as DocusaurusRuntimeWindow;
  const script = document.createElement('script');

  script.id = SCRIPT_ID;
  script.type = 'module';
  script.src = `${normalizeBaseUrl(runtimeWindow.__docusaurus?.siteConfig?.baseUrl)}rc-webcomponents-dist/rc-webcomponents-define.js`;

  document.head.append(script);
}
