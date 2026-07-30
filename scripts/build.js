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

fs.copyFileSync(compiledGame, browserGame);
console.log('Copied out/game.json to out/html/game.json for the mod loader.');
