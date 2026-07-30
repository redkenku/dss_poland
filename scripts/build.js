'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const packageRoot = path.dirname(require.resolve('dendrynexus/package.json'));
const cliPath = path.join(packageRoot, 'lib', 'cli', 'main.js');
const extraArguments = process.argv.slice(2);

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
