'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dendry = require('dendrynexus/lib/engine');

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: undefined,
});

const gameJson = fs.readFileSync(
  path.resolve(__dirname, '..', 'out', 'game.json'),
  'utf8'
);
let game;
dendry.convertJSONToGame(gameJson, function(error, converted) {
  if (error) throw error;
  game = converted;
});

function newRun(overrides) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame(['p2050-comeback-check']);
  for (const sceneId of ['root.campaign_game', 'root.standard']) {
    const index = engine.getCurrentChoices().findIndex(function(choice) {
      return choice.id === sceneId;
    });
    assert(index >= 0, 'Missing setup choice ' + sceneId);
    engine.choose(index);
  }
  Object.assign(engine.state.qualities, overrides);
  return {engine: engine, Q: engine.state.qualities};
}

const relaunchId =
  'poland_events_2023_12.p2050_exclusion_comeback_2023';
const jointOppositionId =
  'poland_events_2023_12.p2050_excluded_with_ko_2023';
const greensId =
  'poland_events_2024_03.p2050_greens_absorption_2024';
const fieldId = 'poland_events_2025_01.left_presidential_split';
const pollId = 'poland_events_2025_01.calculate_presidential_poll_2025';
const successionId = 'poland_events_2025_09.holownia_succession_2025';
const leadershipId = 'poland_events_2026_01.p2050_leadership_2026';
for (const sceneId of [
  relaunchId, jointOppositionId, greensId, fieldId, pollId, successionId,
  leadershipId,
]) {
  assert(game.scenes[sceneId], 'Compiled scene is missing: ' + sceneId);
}

const run = newRun({
  continuous_campaign: 1,
  year: 2023,
  month: 12,
  formation_complete: 1,
  formation_coalition_code: 'ko_psl_left',
  p2050_2023_exclusion_comeback_done: 0,
  p2050_holownia_retention_roll: 600,
  p2050_holownia_retention_ceiling: 0,
  p2050_poll_momentum: 0,
  konf_poll_momentum: 0,
});
const relaunch = game.scenes[relaunchId];
assert(relaunch.viewIf(run.engine, run.Q));
run.engine.goToScene(relaunchId);
assert.strictEqual(run.Q.p2050_leader, 'Szymon Hołownia');
assert.strictEqual(run.Q.p2050_comeback_stage, 1);
assert.strictEqual(run.Q.p2050_holownia_retention_ceiling, 520);
assert.strictEqual(run.Q.p2050_holownia_presidential_bonus, 9);
assert.strictEqual(run.Q.p2050_poll_momentum, 0.8);
assert.strictEqual(run.Q.konf_poll_momentum, -0.8);

Object.assign(run.Q, {
  year: 2024,
  month: 3,
  ko_seats: 157,
  p2050_seats: 33,
  government_party: 'ko',
  government_has_confidence: 1,
  caretaker_government: 0,
  government_support_seats: 248,
  coalition_seats: 248,
});
const greens = game.scenes[greensId];
assert(greens.viewIf(run.engine, run.Q));
run.engine.goToScene(greensId);
assert.strictEqual(run.Q.p2050_greens_absorbed, 1);
assert.strictEqual(run.Q.p2050_greens_transferred_mps, 3);
assert.strictEqual(run.Q.ko_seats, 154);
assert.strictEqual(run.Q.p2050_seats, 36);
assert.strictEqual(run.Q.p2050_holownia_retention_ceiling, 720);
assert.strictEqual(run.Q.p2050_holownia_presidential_bonus, 13);
assert.strictEqual(run.Q.government_support_seats, 245);

run.Q.left_realign_invite_greens = 1;
run.Q.greens_joined_left = 1;
run.Q.left_green_current_seats = 3;
run.engine.goToScene('poland_normalize');
const greensRecord = run.Q.rival_group_records.find(function(record) {
  return record.id === 'greens';
});
const p2050Record = run.Q.rival_group_records.find(function(record) {
  return record.id === 'p2050_party';
});
assert.strictEqual(greensRecord.active, 0);
assert.strictEqual(greensRecord.mp_count, 0);
assert.strictEqual(run.Q.left_realign_invite_greens, 0);
assert.strictEqual(run.Q.greens_joined_left, 0);
assert.strictEqual(p2050Record.mp_count, 36);

const surplus = newRun({
  continuous_campaign: 1,
  year: 2023,
  month: 12,
  formation_complete: 1,
  formation_coalition_code: 'ko_psl_left',
});
surplus.engine.goToScene(relaunchId);
const surplusGreens = surplus.Q.rival_group_records.find(function(record) {
  return record.id === 'greens';
});
const surplusNowoczesna = surplus.Q.rival_group_records.find(function(record) {
  return record.id === 'nowoczesna';
});
surplusGreens.mp_count = 7;
surplusGreens.sejm_mps = 7;
const nowoczesnaBefore = surplusNowoczesna.mp_count;
Object.assign(surplus.Q, {
  year: 2024,
  month: 3,
  ko_seats: 157,
  p2050_seats: 33,
});
surplus.engine.goToScene(greensId);
assert.strictEqual(surplus.Q.p2050_greens_transferred_mps, 4);
assert.strictEqual(surplus.Q.greens_nowoczesna_transferred_mps, 3);
assert.strictEqual(surplus.Q.ko_seats, 153);
assert.strictEqual(surplus.Q.p2050_seats, 37);
assert.strictEqual(surplusNowoczesna.mp_count, nowoczesnaBefore + 3);

Object.assign(run.Q, {
  year: 2025,
  month: 1,
  pres_2025_centre_candidate: 'Undecided',
});
run.engine.goToScene(fieldId);
assert.strictEqual(run.Q.pres_2025_centre_candidate, 'Szymon Hołownia');
run.Q.pres_2025_poll_stage = 'opening';
run.engine.goToScene(pollId);
const comebackPoll = run.Q.pres_2025_poll_holownia;

const baseline = newRun({
  continuous_campaign: 1,
  year: 2025,
  month: 1,
  pres_2025_poll_stage: 'opening',
  p2050_vote_intent: run.Q.p2050_vote_intent,
  p2050_holownia_presidential_bonus: 0,
});
baseline.engine.goToScene(pollId);
assert(
  comebackPoll >= baseline.Q.pres_2025_poll_holownia + 8,
  'The comeback should make Hołownia a serious 2025 contender'
);

const succession = game.scenes[successionId];
Object.assign(run.Q, {
  year: 2025,
  month: 9,
  president_name: 'Andrzej Duda',
  p2050_leader: 'Szymon Hołownia',
  p2050_succession_opened: 0,
  p2050_holownia_retention_roll: 600,
  p2050_holownia_retention_ceiling: 720,
});
assert(!succession.viewIf(run.engine, run.Q));
run.Q.p2050_holownia_retention_ceiling = 520;
assert(succession.viewIf(run.engine, run.Q));
run.Q.p2050_holownia_retention_ceiling = 720;
run.Q.president_name = 'Szymon Hołownia';
assert(succession.viewIf(run.engine, run.Q));

const leadership = game.scenes[leadershipId];
Object.assign(run.Q, {
  year: 2026,
  month: 1,
  president_name: 'Andrzej Duda',
  p2050_leader: 'Szymon Hołownia',
  p2050_succession_opened: 0,
});
assert(!leadership.viewIf(run.engine, run.Q));
run.Q.p2050_succession_opened = 1;
assert(leadership.viewIf(run.engine, run.Q));

run.Q.year = 2023;
run.Q.month = 12;
run.Q.formation_coalition_code = 'democratic_2023';
run.Q.p2050_2023_exclusion_comeback_done = 0;
assert(!relaunch.viewIf(run.engine, run.Q));

const excludedWithKo = newRun({
  continuous_campaign: 1,
  year: 2023,
  month: 12,
  formation_complete: 1,
  formation_coalition_code: 'left_psl',
  p2050_2023_exclusion_with_ko_done: 0,
  p2050_2023_exclusion_comeback_done: 0,
  p2050_holownia_retention_ceiling: 0,
  p2050_holownia_presidential_bonus: 0,
  p2050_poll_momentum: 0,
});
const jointOpposition = game.scenes[jointOppositionId];
assert(jointOpposition.viewIf(excludedWithKo.engine, excludedWithKo.Q));
assert(!relaunch.viewIf(excludedWithKo.engine, excludedWithKo.Q),
  'Hołownia must not receive the solo comeback when KO is excluded too');
excludedWithKo.engine.goToScene(jointOppositionId);
assert.strictEqual(excludedWithKo.Q.p2050_ko_opposition_compact, 1);
assert.strictEqual(excludedWithKo.Q.p2050_comeback_stage, 0);
assert.strictEqual(excludedWithKo.Q.p2050_holownia_retention_ceiling, 0);
assert.strictEqual(excludedWithKo.Q.p2050_holownia_presidential_bonus, 0);
assert.strictEqual(excludedWithKo.Q.p2050_poll_momentum, 0);

console.log('p2050-comeback-check: all assertions passed');
