'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dendry = require('dendrynexus/lib/engine');

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: undefined,
});

const root = path.resolve(__dirname, '..');
let game;
dendry.convertJSONToGame(
  fs.readFileSync(path.join(root, 'out', 'game.json'), 'utf8'),
  function(error, converted) {
    if (error) throw error;
    game = converted;
  }
);

function start(seed) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([seed]);
  function choose(id) {
    const choices = engine.getCurrentChoices() || [];
    const index = choices.findIndex(function(choice) { return choice.id === id; });
    assert(index >= 0, 'missing ' + id + ' in ' + engine.state.sceneId);
    assert(choices[index].canChoose, 'unavailable ' + id);
    engine.choose(index);
  }
  choose('root.campaign_game');
  choose('root.standard');
  engine.goToScene('poland_normalize');
  return {engine: engine, Q: engine.state.qualities, choose: choose};
}

function openSuccession(seed, year, fixture, forceBiejat) {
  const run = start(seed);
  Object.assign(run.Q, {
    president_name: 'Rafał Trzaskowski',
    warsaw_mayor: 'Rafał Trzaskowski',
    warsaw_mayor_party: 'ko',
    warsaw_succession_due_time: -1,
    warsaw_succession_campaign_done: 0,
    warsaw_succession_result_done: 0,
    year: year,
    month: 8,
    time: year === 2020 ? 7 : 67,
    last_local_affairs_time: -1,
  }, fixture || {});
  run.engine.goToScene('poland_normalize');
  assert.strictEqual(run.Q.warsaw_succession_due_time, run.Q.time + 1);
  run.Q.time += 1;
  run.Q.month += 1;
  run.engine.goToScene('poland_normalize');
  assert.strictEqual(run.Q.local_affairs_dispatchable, 1);
  if (forceBiejat) run.Q.left_dominant_current = 'razem';
  run.engine.goToScene('poland_local_affairs.router');
  assert.strictEqual(run.engine.state.sceneId,
    'poland_local_affairs.warsaw_campaign');
  return run;
}

const campaign2020 = openSuccession('warsaw-2020', 2020, {
  razem_strength: 23,
}, true);
assert.strictEqual(campaign2020.Q.warsaw_pis_candidate, 'Patryk Jaki');
assert.strictEqual(campaign2020.Q.warsaw_left_candidate, 'Magdalena Biejat');
const pisChoice = campaign2020.engine.getCurrentChoices().find(function(choice) {
  return choice.id === 'poland_local_affairs.warsaw_support_pis';
});
assert(pisChoice && !pisChoice.canChoose);
assert.strictEqual(game.scenes['poland_local_affairs.warsaw_support_pis']
  .unavailableSubtitle,
  "PiS would not accept Lewica's support anyway.");

const campaign2025 = openSuccession('warsaw-2025', 2025, {
  biejat_party: 'Nowa Lewica',
});
assert.strictEqual(campaign2025.Q.warsaw_pis_candidate, 'Tobiasz Bocheński');
assert.strictEqual(campaign2025.Q.warsaw_left_candidate,
  'Agata Diduszko-Zyglewska');
const fallback = openSuccession('warsaw-left-fallback', 2025, {
  biejat_party: 'Nowa Lewica', spring_active: 0, spring_in_left: 0,
});
assert.strictEqual(fallback.Q.warsaw_left_candidate, 'Anna-Maria Żukowska');

function resolve(seed, strategy, roll, expected, fixture) {
  const run = start(seed);
  Object.assign(run.Q, {
    warsaw_succession_campaign_done: 1,
    warsaw_succession_result_done: 0,
    warsaw_succession_strategy: strategy,
    warsaw_succession_roll: roll,
    warsaw_pis_candidate: 'Patryk Jaki',
    warsaw_left_candidate: 'Magdalena Biejat',
    regional_effect_log: [],
  }, fixture || {});
  run.engine.goToScene('poland_local_affairs.warsaw_result');
  assert.strictEqual(run.Q.warsaw_succession_result, expected,
    strategy + ' roll ' + roll);
  return run;
}

[
  [64, 'ko'], [65, 'pis'], [79, 'pis'], [80, 'left'],
  [89, 'left'], [90, 'p2050'],
].forEach(function(test) {
  resolve('run-left-' + test[0], 'Run Left', test[0], test[1]);
});
[
  [74, 'ko'], [75, 'pis'], [89, 'pis'], [90, 'p2050'],
].forEach(function(test) {
  resolve('support-ko-' + test[0], 'Support KO', test[0], test[1]);
});

const leftWin = resolve('left-win', 'Run Left', 80, 'left');
assert.strictEqual(leftWin.Q.warsaw_mayoral_income_bonus, 1);
assert(leftWin.Q.regional_effect_log.some(function(effect) {
  return effect.key === 'warsaw-mayor-left' && effect.families.left === 0.15;
}));
leftWin.Q.last_local_affairs_time = -1;
leftWin.engine.goToScene('poland_normalize');
assert.strictEqual(leftWin.Q.local_affairs_dispatchable, 0,
  'completed succession was offered twice');

for (const month of [6, 12]) {
  const income = start('income-' + month);
  Object.assign(income.Q, {
    year: 2026,
    month: month,
    resources: 0,
    warsaw_mayoral_income_bonus: 1,
    left_seats: 25,
    last_resource_restore_year: 2025,
    last_midyear_resource_restore_year: 2025,
  });
  income.engine.goToScene('poland_advance');
  assert.strictEqual(income.Q.last_mayoral_income_payout, 1);
  assert(income.Q.last_annual_payout_label.includes('Warsaw mayor'));
}

const mayor = resolve('holownia-mayor', 'Run Left', 90, 'p2050', {
  sejm_speaker: 'Szymon Hołownia',
  formation_marshal_nominee: 'Szymon Hołownia',
});
assert.strictEqual(mayor.Q.p2050_warsaw_mayor_poll_bonus, 2);
assert.strictEqual(mayor.Q.holownia_sejm_eligible, 0);
assert.strictEqual(mayor.Q.formation_marshal_nominee, 'Marek Sawicki');
assert.strictEqual(mayor.Q.office_incompatibility_pending, 1);
assert(mayor.engine.getCurrentChoices().some(function(choice) {
  return choice.id === 'poland_local_affairs.warsaw_result_vacancy' &&
    choice.canChoose;
}));
Object.assign(mayor.Q, {
  formation_coalition_code: 'democratic_2023',
  office_incompatibility_pending: 0,
});
mayor.engine.goToScene('poland_government_formation.formation_marshal_ballot');
assert.strictEqual(mayor.Q.formation_marshal_nominee, 'Marek Sawicki');

function pollWithBonus(seed, bonus) {
  const run = start(seed);
  Object.assign(run.Q, {
    year: 2025,
    p2050_emerged: 1,
    p2050_active: 1,
    p2050_vote_intent: 7,
    p2050_component_vote_intent: 7,
    third_way_active: 1,
    third_way_joint_list: 1,
    third_way_split: 0,
    p2050_warsaw_mayor_poll_bonus: bonus,
  });
  run.engine.goToScene('poland_polling');
  return run.Q;
}
const pollBase = pollWithBonus('p2050-bonus', 0);
const pollMayor = pollWithBonus('p2050-bonus', 2);
assert(pollMayor.p2050_component_vote_intent > pollBase.p2050_component_vote_intent);
assert(pollMayor.third_way_vote_intent > pollBase.third_way_vote_intent,
  'Poland 2050 bonus did not follow it into Third Way');

const router = start('local-router');
Object.assign(router.Q, {
  year: 2026, month: 8, time: 80, last_local_affairs_time: -1,
  sutryk_term_limit_done: 0, krakow_clean_transport_done: 0,
  rural_bus_exclusion_done: 0, warsaw_alcohol_policy_done: 0,
  warsaw_succession_campaign_done: 1, warsaw_succession_result_done: 1,
});
router.engine.goToScene('poland_normalize');
router.engine.goToScene('poland_local_affairs.router');
assert.strictEqual(router.engine.state.sceneId,
  'poland_local_affairs.sutryk_term_limit');
router.engine.goToScene('poland_local_affairs.sutryk_audit');
router.engine.goToScene('poland_normalize');
assert.strictEqual(router.Q.local_affairs_dispatchable, 0);
router.Q.time += 1;
router.Q.month += 1;
router.engine.goToScene('poland_normalize');
router.engine.goToScene('poland_local_affairs.router');
assert.strictEqual(router.engine.state.sceneId,
  'poland_local_affairs.krakow_clean_transport');

for (const branch of [
  ['sutryk_resign', -0.12, 'Retain two terms; Sutryk should resign'],
  ['sutryk_audit', -0.06, 'Decide after an independent audit'],
  ['sutryk_defend', 0.08, 'Abolish the two-term mayoral limit'],
]) {
  const run = start('sutryk-' + branch[0]);
  run.engine.goToScene('poland_local_affairs.' + branch[0]);
  const effect = run.Q.regional_effect_log.slice(-1)[0];
  assert.strictEqual(effect.countyIds[0], '0264');
  assert.strictEqual(effect.families.left, branch[1]);
  assert.strictEqual(run.Q.mayor_term_limit_stance, branch[2]);
}

for (const branch of [
  ['local_rebuild', 0.12], ['local_ko', 0.04], ['local_blame', -0.08],
]) {
  const run = start('wroclaw-' + branch[0]);
  run.Q.resources = 10;
  run.engine.goToScene('poland_events_2023_2024.' + branch[0]);
  const effect = run.Q.regional_effect_log.slice(-1)[0];
  assert.strictEqual(effect.countyIds[0], '0264');
  assert.strictEqual(effect.families.left, branch[1]);
}

console.log('Local affairs check passed.');
