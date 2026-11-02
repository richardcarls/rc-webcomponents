/**
 * Renders the partials in the server templates guide
 * (`docs/docs/guide/server-templates.mdx` and its `server-templates/` pages)
 * with ActionView, Blade, and the Razor `HtmlRenderer`, and checks the output
 * against the markup the components document. Each framework's port of
 * `paginationRange()` is also compared with the original over a grid of inputs.
 *
 * Needs Ruby with Bundler, PHP with Composer, and the .NET 10 SDK. Gems and
 * Composer packages install into a cache outside the checkout
 * (`RC_SERVER_TEMPLATES_CACHE`, default `~/.cache/rc-webcomponents/server-templates`).
 *
 *   node scripts/test-server-templates.mjs
 */
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

// Node strips the types, so this needs no build.
import { paginationRange } from '../packages/rc-pagination/src/range.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HARNESS = join(ROOT, 'scripts', 'server-templates');
const GUIDE_DIR = join(ROOT, 'docs', 'docs', 'guide');
const GUIDES = [
  join(GUIDE_DIR, 'server-templates.mdx'),
  ...readdirSync(join(GUIDE_DIR, 'server-templates'))
    .filter((name) => name.endsWith('.mdx'))
    .map((name) => join(GUIDE_DIR, 'server-templates', name)),
];
const CASES = join(HARNESS, 'cases.json');
const CACHE =
  process.env.RC_SERVER_TEMPLATES_CACHE ??
  join(homedir(), '.cache', 'rc-webcomponents', 'server-templates');

const FRAMEWORKS = {
  rails: ['app/helpers/', 'app/views/rc/'],
  laravel: ['app/Support/', 'resources/views/components/'],
  razor: ['Components/Rc/'],
};

/** Fenced code blocks with a `title`, keyed by title. */
export function titledBlocks(markdown) {
  const blocks = new Map();

  for (const match of markdown.matchAll(
    /^```\w*[^\n]*\btitle="([^"]+)"[^\n]*\n([\s\S]*?)^```$/gm,
  )) {
    blocks.set(match[1], match[2]);
  }

  return blocks;
}

/** The first fenced block in a language, for component docs examples. */
function firstBlock(markdown, language) {
  return new RegExp(`^\`\`\`${language}\\n([\\s\\S]*?)^\`\`\`$`, 'm').exec(markdown)?.[1];
}

function decode(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&hellip;', '…')
    .replaceAll('&amp;', '&');
}

/**
 * One line per tag or text run, with attributes sorted and entities decoded,
 * so markup that differs only in whitespace, quoting, attribute order, or
 * escaping style compares equal.
 */
export function canonicalHtml(html) {
  const lines = [];
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');

  for (const match of withoutComments.matchAll(/<(\/?)([a-z][\w-]*)([^>]*)>|([^<]+)/gi)) {
    const [, closing, tag, attributes, text] = match;

    if (text !== undefined) {
      const normalized = decode(text).replace(/\s+/g, ' ').trim();

      if (normalized) {
        lines.push(`"${normalized}"`);
      }

      continue;
    }

    if (closing) {
      lines.push(`</${tag.toLowerCase()}>`);

      continue;
    }

    const parsed = [
      ...attributes.matchAll(/([^\s=/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g),
    ]
      .map(
        ([, name, double, single, bare]) =>
          `${name.toLowerCase()}=${JSON.stringify(decode(double ?? single ?? bare ?? ''))}`,
      )
      .sort();

    lines.push(`<${[tag.toLowerCase(), ...parsed].join(' ')}>`);
  }

  return lines.join('\n');
}

function escape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function attrs(values) {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([name, value]) => ` ${name}="${escape(value)}"`)
    .join('');
}

function fill(pattern, values) {
  return Object.entries(values).reduce(
    (url, [name, value]) => url.replaceAll(`{${name}}`, String(value)),
    pattern,
  );
}

/** The markup each partial must produce, built from the component contracts. */
export const expected = {
  pagination({ page, total, href, label }) {
    if (total < 2) {
      return '';
    }

    const url = (value) => fill(href, { page: value });
    const items = [];

    if (page > 1) {
      items.push(
        `<li><a${attrs({ href: url(page - 1), 'data-rc-page': 'previous', rel: 'prev' })}>Previous</a></li>`,
      );
    }

    for (const item of paginationRange({ page, total })) {
      items.push(
        item === 'ellipsis'
          ? '<li aria-hidden="true">…</li>'
          : `<li><a${attrs({
              href: url(item),
              'data-rc-page': item,
              'aria-current': item === page ? 'page' : null,
            })}>${item}</a></li>`,
      );
    }

    if (page < total) {
      items.push(
        `<li><a${attrs({ href: url(page + 1), 'data-rc-page': 'next', rel: 'next' })}>Next</a></li>`,
      );
    }

    return `<rc-pagination${attrs({ page, total })}><nav${attrs({ 'aria-label': label })}><ul>${items.join('')}</ul></nav></rc-pagination>`;
  },

  breadcrumbs({ items, label }) {
    const links = items.map(
      ([text, href], index) =>
        `<li><a${attrs({ href, 'aria-current': index === items.length - 1 ? 'page' : null })}>${escape(text)}</a></li>`,
    );

    return `<rc-breadcrumbs><nav${attrs({ 'aria-label': label })}><ol>${links.join('')}</ol></nav></rc-breadcrumbs>`;
  },

  sortHeader({ key, label, sort, direction, href, first = 'ascending' }) {
    const next = key !== sort ? first : direction === 'ascending' ? 'descending' : 'ascending';

    return `<th${attrs({
      scope: 'col',
      'data-rc-sort-key': key,
      'data-rc-sort-first': first === 'descending' ? first : null,
      'aria-sort': key === sort ? direction : null,
    })}><a${attrs({ href: fill(href, { key, direction: next }) })}>${escape(label)}</a></th>`;
  },
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
    env: { ...process.env, ...options.env },
  });

  if (result.error) {
    throw new Error(`Could not run ${command}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
  }

  return result.stdout;
}

function writeTemplates(blocks, framework, directory) {
  const prefixes = FRAMEWORKS[framework];
  let count = 0;

  for (const [title, source] of blocks) {
    if (prefixes.some((prefix) => title.startsWith(prefix))) {
      const path = join(directory, title);

      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, source);
      count += 1;
    }
  }

  if (count === 0) {
    throw new Error(`The guide has no ${framework} templates.`);
  }
}

const renderers = {
  rails(directory) {
    const env = {
      BUNDLE_GEMFILE: join(HARNESS, 'rails', 'Gemfile'),
      BUNDLE_PATH: join(CACHE, 'bundle'),
      BUNDLE_FROZEN: 'true',
    };

    if (
      spawnSync('bundle', ['check'], { env: { ...process.env, ...env }, stdio: 'ignore' })
        .status !== 0
    ) {
      run('bundle', ['install', '--quiet'], { env });
    }

    return run('bundle', ['exec', 'ruby', join(HARNESS, 'rails', 'render.rb'), directory, CASES], {
      env,
    });
  },

  laravel(directory) {
    const env = { COMPOSER_VENDOR_DIR: join(CACHE, 'vendor') };

    run('composer', ['install', '--no-interaction', '--quiet', '--no-progress'], {
      cwd: join(HARNESS, 'laravel'),
      env,
    });

    return run('php', [join(HARNESS, 'laravel', 'render.php'), directory, CASES], { env });
  },

  razor(directory) {
    for (const file of ['Render.csproj', 'Program.cs', '_Imports.razor']) {
      cpSync(join(HARNESS, 'razor', file), join(directory, file));
    }

    run('dotnet', ['build', directory, '-nologo', '-v', 'quiet', '-o', join(directory, 'out')]);

    return run('dotnet', [join(directory, 'out', 'Render.dll'), CASES]);
  },
};

function compare(framework, output, cases, failures) {
  const { html, ranges } = JSON.parse(output);

  const checks = [
    ...cases.pagination.map((c) => [`pagination/${c.name}`, expected.pagination(c)]),
    ...cases.breadcrumbs.map((c) => [`breadcrumbs/${c.name}`, expected.breadcrumbs(c)]),
    ...cases.sortHeaders.map((c) => [`sort-header/${c.name}`, expected.sortHeader(c)]),
  ];

  for (const [name, markup] of checks) {
    const actual = canonicalHtml(html[name] ?? '');
    const wanted = canonicalHtml(markup);

    if (actual !== wanted) {
      failures.push(`${framework} ${name}:\n--- expected\n${wanted}\n--- actual\n${actual}`);
    }
  }

  for (const [key, actual] of Object.entries(ranges)) {
    const [total, page, siblings, boundaries] = key.split(',').map(Number);
    const wanted = paginationRange({ page, total, siblings, boundaries });

    if (!isDeepStrictEqual(actual, wanted)) {
      failures.push(
        `${framework} range(page ${page}, total ${total}, siblings ${siblings}, boundaries ${boundaries}): ` +
          `${JSON.stringify(actual)}, expected ${JSON.stringify(wanted)}`,
      );
    }
  }

  return Object.keys(ranges).length;
}

function main() {
  const cases = JSON.parse(readFileSync(CASES, 'utf8'));
  const blocks = titledBlocks(GUIDES.map((path) => readFileSync(path, 'utf8')).join('\n'));
  const failures = [];

  // The reference markup must match the examples on the component pages.
  const docs = join(ROOT, 'docs', 'docs', 'components');
  const paginationExample = firstBlock(
    readFileSync(join(docs, 'rc-pagination.mdx'), 'utf8'),
    'html',
  );
  const breadcrumbsExample = firstBlock(
    readFileSync(join(docs, 'rc-breadcrumbs.mdx'), 'utf8'),
    'html',
  );

  for (const [name, example, markup] of [
    [
      'rc-pagination',
      paginationExample,
      expected.pagination(cases.pagination.find((c) => c.name === 'middle')),
    ],
    [
      'rc-breadcrumbs',
      breadcrumbsExample,
      expected.breadcrumbs(cases.breadcrumbs.find((c) => c.name === 'docs')),
    ],
  ]) {
    if (canonicalHtml(example ?? '') !== canonicalHtml(markup)) {
      failures.push(`The reference markup no longer matches the ${name} docs example.`);
    }
  }

  const scratch = mkdtempSync(join(tmpdir(), 'rc-server-templates-'));

  try {
    for (const framework of Object.keys(FRAMEWORKS)) {
      const directory = join(scratch, framework);

      writeTemplates(blocks, framework, directory);

      const count = compare(framework, renderers[framework](directory), cases, failures);

      console.log(
        `${framework}: rendered ${Object.values(cases).flat().length} cases, compared ${count} ranges`,
      );
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    console.error(failures.join('\n\n'));
    process.exit(1);
  }

  console.log('Every server template renders the documented markup.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
