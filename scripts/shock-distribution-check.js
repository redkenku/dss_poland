'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: undefined,
});

const dendry = require('dendrynexus/lib/engine');
const projectRoot = path.resolve(__dirname, '..');
let game;
dendry.convertJSONToGame(fs.readFileSync(
  path.join(projectRoot, 'out', 'game.json'), 'utf8'
), function(error, converted) {
  if (error) throw error;
  game = converted;
});

const shockIds = ['04', '05', '06', '13', '16', '17', '19', '21', '22',
  '24', '25', '27', '28'];
const sceneFor = {
  '04': 'poland_scenario_shocks.security_shock',
  '05': 'poland_scenario_shocks.security_shock',
  '06': 'poland_scenario_shocks.security_shock',
  '21': 'poland_scenario_shocks.security_shock',
  '22': 'poland_scenario_shocks.security_shock',
  '13': 'poland_scenario_shocks.domestic_shock',
  '16': 'poland_scenario_shocks.domestic_shock',
  '17': 'poland_scenario_shocks.domestic_shock',
  '19': 'poland_scenario_shocks.domestic_shock',
  '28': 'poland_scenario_shocks.domestic_shock',
  '24': 'poland_scenario_shocks.constitutional_shock',
  '25': 'poland_scenario_shocks.constitutional_shock',
  '27': 'poland_scenario_shocks.constitutional_shock',
};

function run(seed) {
  const ui = new dendry.UserInterface();
  ui.newPage = function() {};
  const engine = new dendry.DendryEngine(ui, game);
  engine.beginGame([seed]);
  function choose(id) {
    const choices = engine.getCurrentChoices() || [];
    const index = choices.findIndex(function(choice) {
      return choice.id === id && choice.canChoose;
    });
    assert(index >= 0, 'Missing choice ' + id);
    engine.choose(index);
  }
  choose('root.campaign_game');
  choose('root.standard');
  return {engine: engine, Q: engine.state.qualities};
}

function prepare(test, target) {
  Object.assign(test.Q, {
    continuous_campaign: 1,
    election_2027_terminal: 0,
    year: 2026,
    month: 7,
    ukraine_invasion_event_done: 1,
    war_escalation_risk: 20,
    war_fatigue: 25,
    us_alliance_reliability: 45,
    unemployment: 6,
    health_capacity: 45,
    vaccination_support: 45,
    odra_2022_done: 1,
    climate_state_capacity: 40,
    energy_2022_stance: 'Closure timetable',
    union_trust: 40,
    energy_security: 40,
    police_trust: 40,
    president_name: 'Rafał Trzaskowski',
    media_harassment_done: 1,
    media_harassment_target: 'a local reporter',
    far_right_street_capacity: 40,
    media_pluralism_pressure: 20,
    leader: 'Włodzimierz Czarzasty',
  });
  for (const id of shockIds) {
    test.Q['shock_' + id + '_roll'] = id === target ? 0 : 999;
    test.Q['shock_' + id + '_done'] = 0;
    test.Q['shock_' + id + '_outcome'] = 'Not triggered';
  }
  test.engine.goToScene('poland_normalize');
}

// Every shock can be forced independently from its setup roll, and resolving
// one never mutates any of the thirteen stored rolls.
for (const id of shockIds) {
  const test = run('shock-fixture-' + id);
  prepare(test, id);
  assert.strictEqual(test.Q['shock_' + id + '_ready'], 1,
    'Shock ' + id + ' did not become independently eligible');
  const before = shockIds.map(function(shock) {
    return test.Q['shock_' + shock + '_roll'];
  });
  test.engine.goToScene(sceneFor[id]);
  assert.strictEqual(test.Q.shock_active_code, id);
  assert.strictEqual(test.Q['shock_' + id + '_done'], 1);
  assert.deepStrictEqual(shockIds.map(function(shock) {
    return test.Q['shock_' + shock + '_roll'];
  }), before, 'Resolving shock ' + id + ' changed a setup roll');
}

// Independent shocks can coexist. Resolving the higher-priority strike leaves
// the already-eligible cyberattack to fire on the next queue visit.
{
  const test = run('shock-coexistence');
  prepare(test, '04');
  test.Q.shock_21_roll = 0;
  test.engine.goToScene('poland_normalize');
  assert.strictEqual(test.Q.shock_04_ready, 1);
  assert.strictEqual(test.Q.shock_21_ready, 1);
  test.engine.goToScene(sceneFor['04']);
  assert.strictEqual(test.Q.shock_active_code, '04');
  test.engine.goToScene('poland_normalize');
  assert.strictEqual(test.Q.shock_21_ready, 1);
  test.engine.goToScene(sceneFor['21']);
  assert.strictEqual(test.Q.shock_active_code, '21');
}

// A recorded ceasefire closes only later battlefield-collapse eligibility.
{
  const test = run('shock-ceasefire-cancellation');
  prepare(test, '06');
  test.Q.shock_05_done = 1;
  test.Q.shock_05_outcome = 'Ceasefire lines halt large-scale fighting';
  test.engine.goToScene('poland_normalize');
  assert.strictEqual(test.Q.shock_06_ready, 0);
  assert.strictEqual(test.Q.shock_21_ready, 0,
    'Unforced independent shock should remain below threshold');
}

// A complete 0–999 roll space gives exact baseline rates: 6% exceptional,
// 12% plausible and 18% repeat/history. Exceptional risk is capped at 22%.
function rate(threshold) {
  let hits = 0;
  for (let roll = 0; roll < 1000; roll += 1) {
    if (roll < threshold) hits += 1;
  }
  return hits / 1000;
}
assert.strictEqual(rate(60), 0.06);
assert.strictEqual(rate(120), 0.12);
assert.strictEqual(rate(180), 0.18);
assert.strictEqual(rate(220), 0.22);
assert(rate(220) <= 0.22);

console.log('Shock fixtures and persisted-roll distribution checks passed.');
