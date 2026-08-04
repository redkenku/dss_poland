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
  const css = fs.readFileSync(browserCss, 'utf8')
    .replace(/\n\.(?:b|save_button|delete_button|hand|pinned-cards|deck) \{\}\n/g, '\n')
    .replace(/(float:\s*(?:left|right);\n)\s*display:\s*inline-block;\n/g, '$1')
    .replace(/\bmarginRight\s*:/g, 'margin-right:');
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
