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
const manifest = JSON.parse(fs.readFileSync(
  path.join(projectRoot, 'docs', 'EVENT_MANIFEST.json'), 'utf8'
));
let game;
dendry.convertJSONToGame(fs.readFileSync(
  path.join(projectRoot, 'out', 'game.json'), 'utf8'
), function(error, converted) {
  if (error) throw error;
  game = converted;
});

function newRun(seed) {
  const ui = new dendry.UserInterface();
  ui.newPage = function() {};
  const engine = new dendry.DendryEngine(ui, game);
  engine.beginGame([seed]);
  const choose = function(id) {
    const choices = engine.getCurrentChoices() || [];
    const index = choices.findIndex(function(choice) {
      return choice.id === id && choice.canChoose;
    });
    assert(index >= 0, 'Missing available choice ' + id + ' in ' +
      engine.state.sceneId + ': ' + choices.map(function(choice) {
        return choice.id + (choice.canChoose ? '' : ' (unavailable)');
      }).join(', '));
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  return {engine: engine, Q: engine.state.qualities, choose: choose};
}

function normalize(run) {
  run.engine.goToScene('poland_normalize');
}

function live(run, id) {
  const scene = game.scenes[id];
  assert(scene, 'Missing scene ' + id);
  return run.engine._runPredicate(scene.viewIf, true);
}

function record(Q, id) {
  return (Q.rival_group_records || []).find(function(entry) {
    return entry && entry.id === id;
  });
}

// Every audited row has one owner, a campaign/date-or-stage gate and a
// no-resource way out. The manifest generator separately validates authored
// subtitles and delayed memory for every strategic choice.
assert.strictEqual(manifest.schemaVersion, 2);
assert.strictEqual(new Set(manifest.auditedScenarioIds).size,
  manifest.auditedScenarioIds.length);
const coverage = new Map();
for (const entry of manifest.scenarioCoverage) {
  if (!coverage.has(entry.id)) coverage.set(entry.id, []);
  coverage.get(entry.id).push(entry);
}
const events = new Map(manifest.events.map(function(event) {
  return [event.id, event];
}));
for (const id of manifest.auditedScenarioIds) {
  const owners = coverage.get(id) || [];
  assert.strictEqual(owners.length, 1, id + ' coverage owners: ' +
    owners.map(function(owner) { return owner.scene; }).join(', '));
  const owner = owners[0];
  const sourcePath = owner.source.replace(/:\d+$/, '');
  const source = fs.readFileSync(path.join(projectRoot, sourcePath), 'utf8');
  assert(source.includes('# scenario-ledger:'), id + ' lacks source metadata');
  const event = events.get(owner.scene);
  if (!event) {
    assert(/Continue|poland_event_queue|election/i.test(source),
      id + ' direct/dossier scene has no route');
    continue;
  }
  assert(/continuous_campaign/.test(event.availabilityConditions),
    id + ' lacks the continuous-campaign guard');
  assert(/year|month|time|stage|terminal/.test(event.availabilityConditions),
    id + ' lacks a date, due-time, stage or terminal gate');
  assert(event.choices.some(function(choice) {
    return !/resources\s*[><=]|budget\s*[><=]/i.test(
      choice.availabilityConditions
    );
  }), id + ' has no zero-resource resolution');
}

// PSL resignation removes portfolios and cabinet membership, but confidence
// cannot fall until the existing constitutional route does so.
{
  const run = newRun('scenario-psl-toleration');
  normalize(run);
  Object.assign(run.Q, {
    continuous_campaign: 1,
    election_2027_terminal: 0,
    ministry_psl_in_cabinet: 1,
    agriculture_minister_party: 'PSL',
    agriculture_minister: 'A PSL minister',
    psl_ratchet_score: 70,
    psl_stage: 0,
    government_has_confidence: 1,
    prime_minister: 'Donald Tusk',
  });
  const confidence = run.Q.government_has_confidence;
  run.engine.goToScene('poland_scenario_party_gaps.psl_exit_toleration');
  assert.strictEqual(run.Q.government_has_confidence, confidence);
  assert.strictEqual(run.Q.psl_support_mode, 'toleration');
  assert.strictEqual(run.Q.agriculture_minister_party, 'vacant');
  assert.strictEqual(record(run.Q, 'psl_party').support_mode, 'toleration');

  run.Q.time = run.Q.psl_due_time;
  run.Q.pis_seats = 120;
  run.Q.konf_seats = 25;
  run.Q.psl_seats = 30;
  run.Q.rozwoj_seats = 8;
  run.Q.suwerenna_seats = 4;
  const primeMinister = run.Q.prime_minister;
  run.engine.goToScene('poland_scenario_party_gaps.psl_right_bridge');
  assert(run.Q.psl_bridge_candidate);
  assert(run.Q.psl_bridge_votes < 231);
  assert.strictEqual(run.Q.prime_minister, primeMinister,
    'Bridge talks cannot install a prime minister');
  assert(run.Q.psl_outcome.includes('leverage'));
}

// Braun's stored roll is not rerolled; appearance, charge and first instance
// are ordered, and a detention description never becomes a guilty verdict.
{
  const run = newRun('scenario-braun-procedure');
  Object.assign(run.Q, {
    continuous_campaign: 1,
    election_2027_terminal: 0,
    braun_stage: 1,
    braun_due_time: 0,
    time: 10,
    braun_done: 0,
    braun_legal_roll: 20,
    braun_procedure_score: 0,
    braun_legal_preparation: 0,
    prosecution_independence: 0,
    government_procedural_restraint: 0,
    braun_compulsion_strategy: 'Ordinary compelled appearance',
  });
  const roll = run.Q.braun_legal_roll;
  run.engine.goToScene('poland_scenario_party_gaps.braun_appearance');
  assert.strictEqual(run.Q.braun_stage, 2);
  assert(!/guilt|convict/i.test(run.Q.braun_outcome));
  run.choose('poland_scenario_party_gaps.braun_appearance_restraint');
  run.choose('poland_scenario_party_gaps.braun_charge');
  assert.strictEqual(run.Q.braun_stage, 3);
  assert.strictEqual(run.Q.braun_legal_roll, roll);
  run.Q.time = run.Q.braun_due_time;
  run.engine.goToScene('poland_scenario_party_gaps.braun_first_instance');
  assert.strictEqual(run.Q.braun_stage, 4);
  assert.strictEqual(run.Q.braun_done, 1);
  assert.strictEqual(run.Q.braun_legal_roll, roll);
  assert(run.Q.braun_appeal_status);
}

// Documentation and officer clarity can independently prevent a fatal-force
// result without erasing hostile crossing pressure.
function borderFixture(seed, documented) {
  const run = newRun(seed);
  Object.assign(run.Q, {
    continuous_campaign: 1,
    election_2027_terminal: 0,
    border_stage: 4,
    border_due_time: 0,
    time: 10,
    border_force_pressure: 90,
    border_documentation: documented ? 100 : 0,
    border_officer_clarity: documented ? 100 : 0,
    border_death_roll: 100,
  });
  const securityBefore = run.Q.border_security_confidence;
  run.engine.goToScene('poland_scenario_civic_gaps.border_escalation_2025');
  return {run: run, securityBefore: securityBefore};
}
{
  const exposed = borderFixture('scenario-border-exposed', false);
  const guarded = borderFixture('scenario-border-guarded', true);
  assert.strictEqual(exposed.run.Q.border_death_occurred, 1);
  assert.strictEqual(guarded.run.Q.border_death_occurred, 0);
  assert(exposed.run.Q.border_force_pressure > 90,
    'Belarusian pressure must remain despite safeguards');
  assert.strictEqual(exposed.run.Q.border_security_confidence,
    exposed.securityBefore - 3);
}

// A rules-based reset closes the ambassador chain before its delayed events.
{
  const run = newRun('scenario-ambassador-reset');
  Object.assign(run.Q, {
    continuous_campaign: 1,
    year: 2026,
    month: 2,
    election_2027_terminal: 0,
    sejm_speaker: 'Włodzimierz Czarzasty',
    us_president: 'Donald Trump',
    resources: 2,
  });
  run.engine.goToScene('poland_events_2026.ambassador_crisis_2026');
  run.choose('poland_events_2026.ambassador_rules');
  assert.strictEqual(run.Q.ambassador_done, 1);
  assert.strictEqual(run.Q.ambassador_stage, 5);
  run.Q.time = Number(run.Q.ambassador_due_time) + 10;
  assert.strictEqual(live(run,
    'poland_scenario_civic_gaps.ambassador_month_one'), false);
}

// The deepfake source is a pure function of the setup roll and opening the
// scene does not mutate that roll.
{
  const run = newRun('scenario-deepfake-stability');
  Object.assign(run.Q, {
    continuous_campaign: 1,
    year: 2027,
    month: 9,
    election_2027_terminal: 0,
    media_deepfake_done: 0,
    media_deepfake_roll: 417,
    trans_candidate_name: 'Maja Heban',
  });
  const roll = run.Q.media_deepfake_roll;
  run.engine.goToScene('poland_scenario_civic_gaps.media_deepfake_2027');
  const source = run.Q.media_deepfake_source;
  assert.strictEqual(run.Q.media_deepfake_roll, roll);
  run.Q.media_deepfake_done = 0;
  run.engine.goToScene('poland_scenario_civic_gaps.media_deepfake_2027');
  assert.strictEqual(run.Q.media_deepfake_roll, roll);
  assert.strictEqual(run.Q.media_deepfake_source, source);
}

// Shared committees are projected once, then allocated back to persistent
// component records; the certified Sejm still conserves exactly 460 seats.
{
  const run = newRun('scenario-shared-committee');
  Object.assign(run.Q, {
    continuous_campaign: 1,
    year: 2027,
    month: 6,
    election_2027_terminal: 0,
    right_reunification_outcome: 'Joint right committee',
    mentzen_bosak_split: 1,
    poll_state_month_key: -1,
  });
  normalize(run);
  const sharedIds = ['pis_party', 'nowa_nadzieja', 'ruch_narodowy'];
  const sharedShares = [50, 30, 20];
  sharedIds.forEach(function(id, index) {
    const party = record(run.Q, id);
    party.active = 1;
    party.contesting = 1;
    party.list_committee = 'right_2027';
    party.organisation = Math.max(40, Number(party.organisation) || 0);
    party.negotiated_list_share = sharedShares[index];
  });
  run.Q.poll_state_month_key = -1;
  run.engine.goToScene('poland_polling');
  const componentSeats = ['pis_party', 'konf_committee', 'nowa_nadzieja',
    'ruch_narodowy'].reduce(function(total, id) {
    return total + Number(record(run.Q, id).projected_seats || 0);
  }, 0);
  assert.strictEqual(componentSeats, run.Q.right_2027_committee_projected_seats,
    'Shared right-list seats must be allocated once among components');
  assert(Math.abs(
    Number(record(run.Q, 'nowa_nadzieja').projected_seats || 0) /
      Math.max(1, componentSeats) - 0.30
  ) < 0.02, 'Projection ignored negotiated component list shares: ' +
    sharedIds.map(function(id) {
      const party = record(run.Q, id);
      return id + '=' + party.projected_seats + '/' +
        party.negotiated_list_share;
    }).join(', ') + '; committee=' + componentSeats);
  run.engine.goToScene('poland_events_2026.snap_result_2026');
  assert.strictEqual(
    Number(run.Q.snap_election_right_2027_seats || 0),
    Number(run.Q.pis_seats || 0) + Number(run.Q.new_hope_seats || 0) +
      Number(run.Q.national_movement_seats || 0),
    'Certified shared committee was counted more than once'
  );
  const seats = [
    'pis_seats', 'ko_seats', 'p2050_seats', 'psl_seats', 'left_seats',
    'konf_seats', 'other_seats', 'sld_breakaway_seats',
    'social_patriot_seats', 'spring_breakaway_seats', 'labor_left_seats',
    'young_left_seats', 'razem_party_seats', 'pps_party_seats',
    'tak_rozwoj_seats', 'centrum_seats', 'rozwoj_seats', 'korona_seats',
    'ko_splinter_seats', 'new_hope_seats', 'national_movement_seats',
    'duda_seats', 'social_conservative_seats',
  ].reduce(function(total, quality) {
    return total + Number(run.Q[quality] || 0);
  }, 0);
  assert.strictEqual(seats, 460, 'Certified Sejm seats must sum to 460');
}

// Dossier pages are narrative-only: no arrival mutation, randomness or time
// movement can alter the certified election before the final assessment.
{
  const source = fs.readFileSync(path.join(
    projectRoot, 'source/scenes/poland_scenario_epilogue.scene.dry'
  ), 'utf8');
  assert(!/^on-arrival:/m.test(source));
  assert(!/this\.random|\btime\s*[+\-]?=|_seats\s*=|_vote\s*=/m.test(source));
  assert.strictEqual((source.match(/: Continue\b/g) || []).length, 4);
}

console.log('Scenario-gap playthrough passed for ' +
  manifest.auditedScenarioIds.length + ' audited ledger IDs.');
