'use strict';

// Coalition dissent has to cost something every month it stays high. This
// drives the monthly tick twice with the same state except the dissent level
// and asserts the high-dissent month is strictly worse for the cabinet.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sceneParser = require('dendrynexus/lib/parsers/scene');

const sourcePath = path.resolve(
  __dirname,
  '../source/scenes/poland_advance.scene.dry'
);

sceneParser.parseFromContent(
  sourcePath,
  fs.readFileSync(sourcePath, 'utf8'),
  function(error, parsed) {
    if (error) throw error;
    runChecks(parsed.onArrival || []);
  }
);

function runChecks(onArrival) {
  // The monthly tick reads hundreds of qualities. Missing ones read as 0,
  // which is what the game's own normalisation guarantees anyway.
  function runMonth(dissent) {
    const store = {
      year: 2025,
      month: 5,
      left_in_government: 1,
      caretaker_government: 0,
      government_party: 'lewica',
      factions: ['barons', 'spring', 'progressives', 'labor'],
      government_has_confidence: 1,
      government_coalition_dissent: dissent,
      early_election_risk: 20,
      government_delivery: 50,
      ko_seats: 157,
      psl_seats: 32,
      p2050_seats: 33,
      ko_relation: 50,
      psl_relation: 50,
      p2050_relation: 50
    };
    const Q = new Proxy(store, {
      get: function(target, key) {
        if (typeof key === 'symbol' || key in target) return target[key];
        return 0;
      }
    });
    onArrival.forEach(function(action) {
      action({}, Q);
    });
    return store;
  }

  const calm = runMonth(20);
  const strained = runMonth(80);

  assert(
    strained.early_election_risk > calm.early_election_risk,
    'High coalition dissent did not move the early-election ledger'
  );
  ['ko_relation', 'psl_relation', 'p2050_relation'].forEach(function(quality) {
    assert(
      strained[quality] < calm[quality],
      'High coalition dissent did not cool ' + quality
    );
  });
  assert(
    strained.government_delivery < calm.government_delivery,
    'High coalition dissent did not slow government delivery'
  );
  assert.strictEqual(
    strained.coalition_break_threat,
    1,
    'Dissent above 70 did not register a coalition break threat'
  );
  assert(
    !calm.coalition_break_threat,
    'Low coalition dissent registered a coalition break threat'
  );
  assert(
    strained.government_coalition_dissent < 80,
    'Coalition dissent never cools, so a single bad month is permanent'
  );

  console.log('coalition-dissent-check: ok');
}
