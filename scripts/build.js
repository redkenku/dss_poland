'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const packageRoot = path.dirname(require.resolve('dendrynexus/package.json'));
const cliPath = path.join(packageRoot, 'lib', 'cli', 'main.js');
const extraArguments = process.argv.slice(2);
const legacyRadioDirectory = path.join(
  projectRoot,
  'out',
  'html',
  'music',
  '1928_1930'
);
const legacyRadio = fs.existsSync(legacyRadioDirectory)
  ? fs.readdirSync(legacyRadioDirectory).map(function(file) {
    return [file, fs.readFileSync(path.join(legacyRadioDirectory, file))];
  })
  : [];

const result = childProcess.spawnSync(
  process.execPath,
  [cliPath, 'make-html', '--pretty'].concat(extraArguments),
  {
    cwd: projectRoot,
    stdio: 'inherit',
  }
);

if (result.error) {
  console.error('Could not start the DendryNexus compiler:', result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status === null ? 1 : result.status);
}

// The bundled DendryNexus template contains a few CSS declarations that are
// harmless in browsers but reported as compile errors by VS Code's CSS
// validator. Normalize the generated stylesheet so a fresh build remains
// diagnostics-clean without modifying node_modules.
const browserCss = path.join(projectRoot, 'out', 'html', 'game.css');
if (fs.existsSync(browserCss)) {
  let css = fs.readFileSync(browserCss, 'utf8')
    .replace(/\n\.(?:b|save_button|delete_button|hand|pinned-cards|deck) \{\}\n/g, '\n')
    .replace(/(float:\s*(?:left|right);\n)\s*display:\s*inline-block;\n/g, '$1')
    .replace(/\bmarginRight\s*:/g, 'margin-right:')
    .replace(
      /\.candidate-copy small,\n\.candidate-minor small \{/,
      '.candidate-copy small {'
    )
    .replace(
      /\.candidate-minor-grid \{[\s\S]*?\n\}\n\n@media \(max-width: 520px\) \{\n  \.candidate-minor-grid \{[\s\S]*?\n  \}\n\n  \.candidate-minor:nth-child\(odd\) \{\n    border-right: none;\n  \}\n/,
      `.candidate-minor-list {
  display: grid;
  grid-template-columns: 1fr;
}

.candidate-minor {
  display: grid;
  grid-template-columns: minmax(10.5em, 42%) minmax(0, 1fr);
  gap: 0.55em;
  align-items: baseline;
  min-width: 0;
  padding: 0.3em 0.75em;
  border-bottom: 1px solid var(--ledger-rule-color);
  font-size: 0.82em;
  line-height: 1.15;
}

.candidate-minor:last-child {
  border-bottom: none;
}

.candidate-minor b {
  min-width: 0;
  font-size: 1em;
  font-weight: bold;
}

.candidate-minor small {
  display: block;
  min-width: 0;
  margin: 0;
  color: var(--ledger-muted-color);
  font-size: 0.85em;
  line-height: 1.15;
}

@media (max-width: 430px) {
  .candidate-minor {
    grid-template-columns: 1fr;
    gap: 0.05em;
    padding-top: 0.38em;
    padding-bottom: 0.38em;
  }
}
`
    )
    .replace(
      /\.candidate-field \{[\s\S]*?\n\}/,
      `.candidate-field {
  margin: 0.75em 0;
  border: 1px solid var(--ledger-rule-color);
  border-radius: 4px;
  overflow: hidden;
  background: var(--signal-surface);
  line-height: 1.2;
}`
    )
    .replace(/\.candidate-field-heading \{[\s\S]*?\n\}/, `.candidate-field-heading {
  padding: 0.4em 0.65em;
  border-bottom: 3px double var(--ledger-rule-color);
  font-size: 0.78em;
  font-weight: bold;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}`)
    .replace(/\.candidate-field-group \{[\s\S]*?\n\}/, `.candidate-field-group {
  padding: 0.24em 0.65em;
  border-bottom: 1px solid var(--ledger-rule-color);
  color: var(--ledger-muted-color);
  font-size: 0.68em;
  font-weight: bold;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}`)
    .replace(/\.candidate-entry \{[\s\S]*?\n\}/, `.candidate-entry {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.45em;
  align-items: center;
  padding: 0.38em 0.65em;
  border-bottom: 1px solid var(--ledger-rule-color);
}`)
    .replace(/\.candidate-copy small \{[\s\S]*?\n\}/, `.candidate-copy small {
  display: block;
  margin-top: 0.02em;
  color: var(--ledger-muted-color);
  font-size: 0.72em;
  line-height: 1.08;
}`)
    .replace(/\.candidate-badge \{[\s\S]*?\n\}/, `.candidate-badge {
  padding: 0.1em 0.35em;
  border: 1px solid var(--ledger-rule-color);
  border-radius: 999px;
  white-space: nowrap;
  font-size: 0.58em;
  font-weight: bold;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}`);
  const seenRules = new Set();
  const duplicateGovernmentRule = new RegExp(
    '(?:\\n|^)(\\.government-detail (?:\\.disclosure-body|\\.ledger-row(?: > :(?:first|last)-child)?|\\.government-role-row > :last-child|\\.ledger-subrow)) \\{[^{}]*\\}\\n?',
    'g'
  );
  css = css.replace(duplicateGovernmentRule, function(rule, selector) {
    if (seenRules.has(selector)) return '\n';
    seenRules.add(selector);
    return rule;
  });
  fs.writeFileSync(browserCss, css);
}

if (legacyRadio.length) {
  fs.mkdirSync(legacyRadioDirectory, {recursive: true});
  legacyRadio.forEach(function(asset) {
    fs.writeFileSync(path.join(legacyRadioDirectory, asset[0]), asset[1]);
  });
}

const compiledGame = path.join(projectRoot, 'out', 'game.json');
const browserGame = path.join(projectRoot, 'out', 'html', 'game.json');

if (!fs.existsSync(compiledGame)) {
  console.error('Build completed without producing out/game.json.');
  process.exit(1);
}

// Dendry expands tag lookups by object iteration, so compiler insertion order
// can otherwise change a seeded card draw between identical builds. Canonical
// JSON key order makes the compiled game and its replay order reproducible.
function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce(function(sorted, key) {
      sorted[key] = canonicalize(value[key]);
      return sorted;
    }, {});
  }
  return value;
}

const compiledJson = JSON.parse(fs.readFileSync(compiledGame, 'utf8'));
fs.writeFileSync(
  compiledGame,
  JSON.stringify(canonicalize(compiledJson), null, 2) + '\n'
);
fs.copyFileSync(compiledGame, browserGame);
console.log(
  'Canonicalized out/game.json and copied it to out/html/game.json.'
);
