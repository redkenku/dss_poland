'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const game = require(path.join(projectRoot, 'out', 'game.json'));
const intro = game.scenes['poland_prime_minister_intro.show'];

assert(intro, 'compiled Prime Minister introduction scene is missing');
assert.strictEqual(
  intro.faceImage,
  'img/poland/events/chancellery-2022.webp',
  'Prime Minister introduction does not use the standard event portrait slot'
);
assert.strictEqual(
  intro.content.content[0].type,
  'heading',
  'Prime Minister introduction has no visible event heading'
);
const thirdMorawiecki = game.scenes[
  'poland_events_2021_2023.aug21_cabinet_result'
];
assert(
  thirdMorawiecki.onArrival.some(function(action) {
    return (action.$code || '').includes(
      'Q.prime_minister_cabinet_label = "The third Morawiecki cabinet";'
    );
  }),
  'the 2021 Third Morawiecki Cabinet is not counted'
);
Object.values(game.scenes).forEach(function(scene) {
  const actions = (scene.onArrival || []).map(function(action) {
    return action.$code || '';
  }).join('\n');
  if (actions.includes('Q.prime_minister_intro_return =')) {
    assert(
      actions.includes('Q.prime_minister_intro_pending ='),
      'cabinet is not marked for counting in ' + scene.id
    );
  }
});
const onArrival = intro.onArrival.map(function(action) {
  return action.$code || '';
}).join('\n');
const numberCabinet = new Function('Q', onArrival);

function install(name, counts) {
  const qualities = {
    prime_minister: name,
    prime_minister_cabinet_counts: Object.assign({}, counts),
    prime_minister_intro_pending: 1,
  };
  numberCabinet(qualities);
  return qualities;
}

const tusk = install('Donald Tusk', {'Donald Tusk': 2});
assert.strictEqual(tusk.prime_minister_cabinet_label, 'The third Tusk cabinet');
numberCabinet(tusk);
assert.strictEqual(tusk.prime_minister_cabinet_label, 'The third Tusk cabinet');
tusk.prime_minister_intro_pending = 1;
numberCabinet(tusk);
assert.strictEqual(tusk.prime_minister_cabinet_label, 'The fourth Tusk cabinet');

assert.strictEqual(
  install('Mateusz Morawiecki', {'Mateusz Morawiecki': 2})
    .prime_minister_cabinet_label,
  'The third Morawiecki cabinet'
);
assert.strictEqual(
  install('Beata Szydło', {'Beata Szydło': 1})
    .prime_minister_cabinet_label,
  'The second Szydło cabinet'
);
assert.strictEqual(
  install('Barbara Nowacka', {}).prime_minister_cabinet_label,
  'The first Nowacka cabinet'
);

const browserJavaScript = fs.readFileSync(
  path.join(projectRoot, 'out', 'html', 'game.js'),
  'utf8'
);
const imageMap = browserJavaScript.match(
  /var primeMinisterImages = \{([\s\S]*?)\n        \};/
);
assert(imageMap, 'Prime Minister portrait map is missing');
const portraitPaths = Array.from(
  imageMap[1].matchAll(/:\s*'([^']+\.webp)'/g),
  function(match) { return match[1]; }
);
const portraitNames = Array.from(
  imageMap[1].matchAll(/'([^']+)'\s*:/g),
  function(match) { return match[1]; }
);
assert.strictEqual(portraitPaths.length, 29, 'portrait map coverage changed');
portraitPaths.forEach(function(portraitPath) {
  assert(
    fs.existsSync(path.join(projectRoot, 'out', 'html', portraitPath)),
    'missing Prime Minister portrait: ' + portraitPath
  );
});
const personDefinitions = browserJavaScript.slice(
  browserJavaScript.indexOf('var personDefinitions = ['),
  browserJavaScript.indexOf('personDefinitions.forEach')
);
const bioAliases = new Set();
for (const aliases of personDefinitions.matchAll(/aliases:\s*\[([^\]]*)\]/g)) {
  for (const alias of aliases[1].matchAll(/['"]([^'"]+)['"]/g)) {
    bioAliases.add(alias[1]);
  }
}
portraitNames.forEach(function(name) {
  assert(bioAliases.has(name), 'missing Prime Minister bio: ' + name);
});

console.log('Prime Minister introduction cabinet counts passed.');
