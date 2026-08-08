'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sceneParser = require('dendrynexus/lib/parsers/scene');

const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(
  projectRoot,
  'source/scenes/poland_conflict_climate_events.scene.dry'
);

sceneParser.parseFromContent(
  sourcePath,
  fs.readFileSync(sourcePath, 'utf8'),
  function(error, parsed) {
    if (error) throw error;
    runChecks(parsed);
  }
);

function runChecks(parsed) {
  const scenes = new Map((parsed.sections || []).map(function(scene) {
    return [scene.id, scene];
  }));
  const prefix = 'poland_conflict_climate_events.';
  const partyRelations = [
    'ko_relation', 'psl_relation', 'p2050_relation', 'pis_relation',
  ];

  function scene(localId) {
    const result = scenes.get(prefix + localId);
    assert(result, 'Missing scene ' + localId);
    return result;
  }

  function apply(localId, Q) {
    (scene(localId).onArrival || []).forEach(function(action) {
      action({}, Q);
    });
  }

  function baseline() {
    return {
      ko_relation: 50,
      psl_relation: 50,
      p2050_relation: 50,
      pis_relation: 50,
      konf_relation: 50,
      left_poll: 10,
      left_poll_momentum: 0,
      razem_dissent: 40,
      barons_dissent: 40,
      party_unity: 50,
      resources: 3,
    };
  }

  const gazaChoices = [
    {
      event: 'gaza_war_2023',
      palestine: 'gaza_2023_palestine',
      israel: 'gaza_2023_israel',
      neutral: 'gaza_2023_neutral',
    },
    {
      event: 'gaza_wck_2024',
      palestine: 'gaza_wck_palestine',
      israel: 'gaza_wck_israel',
      neutral: 'gaza_wck_neutral',
    },
    {
      event: 'gaza_campus_2024',
      palestine: 'gaza_campus_palestine',
      israel: 'gaza_campus_israel',
      neutral: 'gaza_campus_neutral',
    },
  ];

  gazaChoices.forEach(function(test) {
    assert.strictEqual(scene(test.event).options.length, 3);

    const palestine = baseline();
    apply(test.palestine, palestine);
    partyRelations.forEach(function(quality) {
      assert(palestine[quality] < 50,
        quality + ' did not fall after Palestine support in ' + test.event);
    });
    assert(palestine.konf_relation > 50);
    assert(palestine.left_poll > 10);
    assert(palestine.razem_dissent < 40);
    assert(palestine.barons_dissent > 40);

    const israel = baseline();
    apply(test.israel, israel);
    partyRelations.forEach(function(quality) {
      assert.strictEqual(israel[quality], 50,
        quality + ' moved after Israel support in ' + test.event);
    });
    assert(israel.konf_relation < 50);
    assert(israel.razem_dissent >= 50);
    assert(israel.barons_dissent < 40);

    const neutral = baseline();
    apply(test.neutral, neutral);
    assert(neutral.left_poll < 10);
    assert(neutral.razem_dissent > 40);
    assert(neutral.barons_dissent > 40);
  });

  [
    'last_generation_mermaid_2024',
    'last_generation_bridges_2024',
    'last_generation_wislostrada_2024',
  ].forEach(function(localId) {
    assert.strictEqual(scene(localId).options.length, 3,
      localId + ' must offer three consequential responses');
  });

  const wislostrada = scene('last_generation_wislostrada_2024');
  assert.strictEqual(
    wislostrada.content.stateDependencies[0].fn.logicSource,
    'prime_minister'
  );
  assert(!JSON.stringify(wislostrada.content).includes('Donald Tusk'));

  const climateMiddle = baseline();
  climateMiddle.progressives_dissent = 40;
  apply('bridges_observers', climateMiddle);
  assert.strictEqual(climateMiddle.resources, 2);
  assert(climateMiddle.party_unity < 50);
  assert(climateMiddle.progressives_dissent > 40);
  assert(climateMiddle.barons_dissent > 40);

  console.log('conflict-climate-check: all checks passed');
}
