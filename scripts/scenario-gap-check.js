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

function prawicaFixture(seed, overrides) {
  const run = newRun(seed);
  Object.assign(run.Q, {
    continuous_campaign: 1,
    year: 2027,
    month: 6,
    election_2027_terminal: 0,
    president_name: 'Rafał Trzaskowski',
    prime_minister: 'Donald Tusk',
    government_party: 'ko',
    ministry_pis_in_cabinet: 0,
    ministry_psl_in_cabinet: 0,
    duda_stage: 1,
    duda_done: 1,
    duda_programme_reach: 80,
    duda_organisation: 80,
    prawica_stage: 0,
    prawica_formed: 0,
    prawica_attempt_roll: 0,
    pis_collapsed: 1,
    pis_split: 1,
    pis_collapse_pressure: 100,
    pis_leader: 'Mateusz Morawiecki',
    pis_poll: 4,
    far_right_split: 0,
    mentzen_bosak_split: 0,
    third_way_split: 1,
    third_way_active: 0,
    p0_formed: 1,
    p0_poll: 3,
    tak_dla_rozwoju_party_formed: 1,
    tak_dla_rozwoju_legal_party_formed: 1,
    tak_rozwoj_party_name: 'Tak! Dla Rozwoju',
    tak_rozwoj_poll: 3,
    tak_rozwoj_activists: 35,
    rozwoj_association_active: 1,
    rozwoj_party_formed: 1,
    rozwoj_poll: 3,
    kukiz_active: 1,
    kukiz_poll: 2,
    porozumienie_active: 1,
    porozumienie_poll: 2,
    suwerenna_merged: 0,
    suwerenna_poll: 3,
    ko_splinter_active: 1,
    ko_splinter_poll: 4,
  }, overrides || {});
  const sikorski = record(run.Q, 'ko_splinter');
  if (sikorski) {
    sikorski.active = 1;
    sikorski.independent = 1;
    sikorski.leader = 'Radosław Sikorski';
    sikorski.name = 'Nowa Platforma';
    sikorski.list_committee = 'ko_splinter';
    sikorski.contesting = 1;
  }
  normalize(run);
  const normalizedSikorski = record(run.Q, 'ko_splinter');
  if (normalizedSikorski) {
    normalizedSikorski.active = 1;
    normalizedSikorski.independent = 1;
    normalizedSikorski.leader = 'Radosław Sikorski';
    normalizedSikorski.name = 'Nowa Platforma';
    normalizedSikorski.list_committee = 'ko_splinter';
    normalizedSikorski.contesting = 1;
  }
  return run;
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
// Duda's Prawica route is separately gated, transactional and auditable.
{
  const low = newRun('scenario-prawica-low-fragmentation');
  Object.assign(low.Q, {
    continuous_campaign: 1,
    year: 2027,
    month: 6,
    election_2027_terminal: 0,
    president_name: 'Rafał Trzaskowski',
    prime_minister: 'Donald Tusk',
    government_party: 'ko',
    ministry_pis_in_cabinet: 0,
    duda_stage: 1,
    duda_programme_reach: 80,
    duda_organisation: 80,
    prawica_attempt_roll: 0,
  });
  normalize(low);
  assert(low.Q.prawica_fragmentation_score < 55);
  assert.strictEqual(live(low,
    'poland_scenario_party_gaps.right_reunification_2027'), false);

  const qualifying = prawicaFixture('scenario-prawica-roll-occurs', {
    prawica_attempt_roll: 0,
  });
  assert(qualifying.Q.prawica_fragmentation_score >= 55);
  assert(qualifying.Q.prawica_attempt_threshold >= 400);
  assert(qualifying.Q.prawica_attempt_threshold <= 600);
  assert.strictEqual(live(qualifying,
    'poland_scenario_party_gaps.right_reunification_2027'), true,
  JSON.stringify({
    year: qualifying.Q.year,
    month: qualifying.Q.month,
    score: qualifying.Q.prawica_fragmentation_score,
    roll: qualifying.Q.prawica_attempt_roll,
    threshold: qualifying.Q.prawica_attempt_threshold,
    dudaStage: qualifying.Q.duda_stage,
    reach: qualifying.Q.duda_programme_reach,
    organisation: qualifying.Q.duda_organisation,
    president: qualifying.Q.president_name,
    primeMinister: qualifying.Q.prime_minister,
    governmentBlock: qualifying.Q.prawica_pis_government_block,
    terminal: qualifying.Q.election_2027_terminal,
  }));

  const failedRoll = prawicaFixture('scenario-prawica-roll-fails', {
    prawica_attempt_roll: 999,
  });
  assert.strictEqual(live(failedRoll,
    'poland_scenario_party_gaps.right_reunification_2027'), false);

  const jow = newRun('scenario-prawica-jow-attempt');
  Object.assign(jow.Q, {
    continuous_campaign: 1,
    year: 2027,
    month: 6,
    election_2027_terminal: 0,
    president_name: 'Rafał Trzaskowski',
    prime_minister: 'Donald Tusk',
    government_party: 'ko',
    ministry_pis_in_cabinet: 0,
    duda_stage: 1,
    duda_programme_reach: 80,
    duda_organisation: 80,
    prawica_attempt_roll: 949,
    electoral_reform_stage: 'enacted',
    sejm_electoral_system: 'mixed_230',
  });
  normalize(jow);
  assert.strictEqual(jow.Q.prawica_attempt_threshold, 950);
  assert.strictEqual(live(jow,
    'poland_scenario_party_gaps.right_reunification_2027'), true,
  'JOW pragmatism should bypass the ordinary fragmentation gate');

  const pisLed = prawicaFixture('scenario-prawica-pis-led', {
    government_party: 'pis',
  });
  assert.strictEqual(pisLed.Q.prawica_pis_government_block, 1);
  assert.strictEqual(live(pisLed,
    'poland_scenario_party_gaps.right_reunification_2027'), false);

  const pisParticipant = prawicaFixture('scenario-prawica-pis-cabinet', {
    government_party: 'ko',
    ministry_pis_in_cabinet: 1,
  });
  assert.strictEqual(pisParticipant.Q.prawica_pis_government_block, 1);
  assert.strictEqual(live(pisParticipant,
    'poland_scenario_party_gaps.right_reunification_2027'), false);
}

{
  const run = prawicaFixture('scenario-prawica-success');
  run.Q.konf_seats = 10;
  run.Q.korona_seats = 0;
  const kkp = record(run.Q, 'kkp');
  kkp.exclusive_seats = 1;
  kkp.mp_count = 1;
  kkp.sejm_mps = 1;
  run.engine.goToScene('poland_scenario_party_gaps.right_reunification_2027');
  assert.strictEqual(run.Q.prawica_formed, 1);
  assert.strictEqual(run.Q.prawica_leader, 'Andrzej Duda');
  assert.strictEqual(run.Q.prawica_pm_candidate, 'Andrzej Duda');
  assert(run.Q.prawica_member_ids.includes('pis_party'));
  assert(run.Q.prawica_member_ids.filter(function(id) {
    return id !== 'pis_party' && id !== 'duda_movement';
  }).length >= 2, 'Prawica formed without PiS plus two acceptors');
  const kkpDecision = run.Q.prawica_decision_records.find(function(decision) {
    return decision.id === 'kkp';
  });
  assert.strictEqual(kkpDecision.eligible, 0);
  assert.strictEqual(kkpDecision.accepted, 0);
  assert(!run.Q.prawica_member_ids.includes('kkp'));
  assert.strictEqual(record(run.Q, 'kkp').list_committee, 'korona');
  assert.strictEqual(run.Q.korona_seats, 1,
    'Only KKP\'s one declared seat should follow Korona');
  assert.strictEqual(run.Q.konf_seats, 9);
  const p0Decision = run.Q.prawica_decision_records.find(function(decision) {
    return decision.id === 'p0_party';
  });
  assert.strictEqual(p0Decision.accepted, 1,
    'A compatible sub-5% party should normally accept');
  const solidarnaDecision = run.Q.prawica_decision_records.find(function(decision) {
    return decision.id === 'solidarna';
  });
  assert.strictEqual(solidarnaDecision.accepted, 0,
    'Ziobro/Jaki-style red lines must remain capable of defeating threshold pressure');
  assert(solidarnaDecision.negative_reasons.some(function(reason) {
    return /hard-line leadership/.test(reason);
  }));
}

{
  const run = prawicaFixture('scenario-prawica-psl-cabinet');
  run.Q.electoral_reform_stage = 'enacted';
  run.Q.sejm_electoral_system = 'mixed_230';
  run.Q.ministry_psl_in_cabinet = 1;
  record(run.Q, 'psl_party').in_cabinet = 1;
  run.engine.goToScene('poland_scenario_party_gaps.right_reunification_2027');
  const pslDecision = run.Q.prawica_decision_records.find(function(decision) {
    return decision.id === 'psl_party';
  });
  assert.strictEqual(pslDecision.eligible, 0);
  assert.strictEqual(pslDecision.accepted, 0);
}

{
  const run = prawicaFixture('scenario-prawica-jow-sweep', {
    electoral_reform_stage: 'enacted',
    sejm_electoral_system: 'fptp_460',
    sejm_list_outcome: 'democratic_8',
    sejm_list_host: 'democratic_list',
    sejm_list_members: 'KO, Poland 2050, PSL and the coordinating Left',
    sejm_list_result: 'Broad democratic coalition accepted',
    pis_collapsed: 0,
    pis_split: 0,
    pis_collapse_pressure: 0,
    pis_leader: 'Jarosław Kaczyński',
    pis_poll: 30,
    third_way_active: 1,
    third_way_split: 0,
    third_way_cohesion: 100,
    cultural_issue_salience: 100,
    far_right_agenda: 100,
  });
  run.engine.goToScene('poland_scenario_party_gaps.right_reunification_2027');
  const eligible = run.Q.prawica_decision_records.filter(function(decision) {
    return decision.eligible;
  });
  assert(eligible.length >= 3);
  assert(eligible.every(function(decision) { return decision.accepted; }),
    'Every eligible organisation must accept Prawica under JOWs');
  assert(eligible.every(function(decision) {
    return decision.positive_reasons.some(function(reason) {
      return /Duda's JOW warning/.test(reason);
    });
  }), 'Every JOW acceptance must record its pragmatic reason');
  const kkpDecision = run.Q.prawica_decision_records.find(function(decision) {
    return decision.id === 'kkp';
  });
  const pslDecision = eligible.find(function(decision) {
    return decision.id === 'psl_party';
  });
  assert.strictEqual(kkpDecision.eligible, 0);
  assert.strictEqual(kkpDecision.accepted, 0);
  assert(kkpDecision.negative_reasons.some(function(reason) {
    return /expelled before Duda offered the JOW district pact/.test(reason);
  }), 'The JOW vote must record Korona / KKP\'s earlier expulsion');
  assert(pslDecision && pslDecision.accepted,
    'PSL outside government must join the JOW sweep');
  assert.match(run.Q.right_reunification_outcome,
    /one-candidate JOW argument wins every invited party/);
  assert(!run.Q.prawica_member_ids.includes('kkp'));
  normalize(run);
  assert.strictEqual(record(run.Q, 'kkp').list_committee, 'korona',
    'Normalization restored expelled Korona / KKP to the JOW pact');
  assert(!run.Q.sejm_list_members.includes('PSL'),
    'PSL remained on the broad opposition pact after joining Prawica: ' +
      JSON.stringify({
        formed: run.Q.prawica_formed,
        sources: run.Q.prawica_member_source_ids,
        outcome: run.Q.sejm_list_outcome,
        members: run.Q.sejm_list_members,
      }));
  assert.match(run.Q.sejm_list_result, /continues without PSL/);
}

for (const displaced of [
  {outcome: 'third_host_5', host: 'psl'},
  {outcome: 'pis_5', host: 'pis'},
  {outcome: 'konf_5', host: 'konf'},
]) {
  const run = prawicaFixture('scenario-prawica-displaces-' + displaced.host, {
    electoral_reform_stage: 'enacted',
    sejm_electoral_system: 'fptp_460',
    sejm_list_outcome: displaced.outcome,
    sejm_list_host: displaced.host,
    sejm_list_has_partners: 1,
  });
  run.engine.goToScene('poland_scenario_party_gaps.right_reunification_2027');
  assert.strictEqual(run.Q.prawica_formed, 1);
  normalize(run);
  assert.strictEqual(run.Q.sejm_list_outcome, 'left_5',
    'Lewica stayed on the ' + displaced.host +
      ' host list after that host joined Prawica');
  assert.strictEqual(run.Q.sejm_list_host, 'left');
  assert.strictEqual(run.Q.sejm_list_has_partners, 0);
}

{
  const run = prawicaFixture('scenario-prawica-transaction-fails', {
    pis_collapsed: 0,
    pis_split: 0,
    pis_collapse_pressure: 0,
    pis_leader: 'Jarosław Kaczyński',
    pis_poll: 30,
  });
  const before = (run.Q.rival_group_records || []).map(function(entry) {
    return [entry.id, entry.list_committee, entry.club, entry.parent];
  });
  run.engine.goToScene('poland_scenario_party_gaps.right_reunification_2027');
  assert.strictEqual(run.Q.prawica_formed, 0);
  assert.strictEqual(run.Q.prawica_member_ids.length, 0);
  assert.deepStrictEqual((run.Q.rival_group_records || []).map(function(entry) {
    return [entry.id, entry.list_committee, entry.club, entry.parent];
  }), before, 'A failed congress mutated an affiliation');
}

{
  const run = prawicaFixture('scenario-prawica-too-few-acceptors');
  Object.assign(run.Q, {
    p0_formed: 0,
    tak_dla_rozwoju_legal_party_formed: 0,
    kukiz_active: 0,
    porozumienie_active: 0,
    republikanie_formed: 0,
    odnowa_formed: 0,
    ko_splinter_active: 0,
  });
  [
    'rozwoj_plus', 'konf_committee', 'nowa_nadzieja', 'ruch_narodowy',
    'psl_party', 'kukiz15', 'solidarna', 'porozumienie', 'republikanie',
    'odnowa', 'ko_splinter', 'tak_rozwoj_party', 'p0_party',
  ].forEach(function(id) {
    const party = record(run.Q, id);
    if (party) party.active = 0;
  });
  run.engine.goToScene('poland_scenario_party_gaps.right_reunification_2027');
  assert.strictEqual(run.Q.prawica_decision_records.find(function(decision) {
    return decision.id === 'pis_party';
  }).accepted, 1);
  assert.strictEqual(run.Q.prawica_formed, 0,
    'PiS without two other acceptors must not found Prawica');
  assert.deepStrictEqual(run.Q.prawica_member_party_keys, [],
    'A failed congress must not trigger Prawica branding');
}

{
  const wrongLeader = prawicaFixture('scenario-prawica-wrong-ko-splinter');
  record(wrongLeader.Q, 'ko_splinter').leader = 'Borys Budka';
  wrongLeader.engine.goToScene(
    'poland_scenario_party_gaps.right_reunification_2027'
  );
  assert.strictEqual(wrongLeader.Q.prawica_decision_records.find(
    function(decision) { return decision.id === 'ko_splinter'; }
  ).eligible, 0);
  const sikorski = prawicaFixture('scenario-prawica-sikorski');
  sikorski.engine.goToScene(
    'poland_scenario_party_gaps.right_reunification_2027'
  );
  assert.strictEqual(sikorski.Q.prawica_decision_records.find(
    function(decision) { return decision.id === 'ko_splinter'; }
  ).eligible, 1);
}

{
  const run = prawicaFixture('scenario-prawica-committee');
  run.engine.goToScene('poland_scenario_party_gaps.right_reunification_2027');
  assert.strictEqual(run.Q.prawica_formed, 1);
  run.Q.poll_state_month_key = -1;
  run.engine.goToScene('poland_polling');
  const componentSeats = run.Q.prawica_member_source_ids.reduce(
    function(total, id) {
      return total + Number(run.Q[id + '_projected_seats'] || 0);
    }, 0
  );
  assert.strictEqual(componentSeats, run.Q.right_2027_committee_projected_seats,
    'Prawica seats must be allocated once among vote-bearing components');
  const componentVote = run.Q.prawica_member_source_ids.reduce(
    function(total, id) {
      return total + Number(run.Q[id + '_component_vote_intent'] || 0);
    }, 0
  );
  assert(Math.abs(componentVote - Number(run.Q.right_2027_vote_intent || 0)) < 0.001,
    'Prawica vote was not aggregated exactly once');
  const projectedSeats = [
    'left_projected_seats', 'pis_projected_seats', 'ko_projected_seats',
    'p2050_projected_seats', 'psl_projected_seats', 'konf_projected_seats',
    'p0_projected_seats', 'other_projected_seats',
    'sld_breakaway_projected_seats', 'social_patriot_projected_seats',
    'spring_breakaway_projected_seats', 'labor_left_projected_seats',
    'young_left_projected_seats', 'razem_projected_seats',
    'pps_projected_seats', 'tak_rozwoj_projected_seats',
    'centrum_projected_seats', 'rozwoj_projected_seats',
    'korona_projected_seats', 'ko_splinter_projected_seats',
    'suwerenna_projected_seats', 'porozumienie_projected_seats',
    'republikanie_projected_seats', 'odnowa_projected_seats',
    'kukiz_projected_seats', 'new_hope_projected_seats',
    'national_movement_projected_seats', 'duda_projected_seats',
    'social_conservative_projected_seats',
  ].reduce(function(total, quality) {
    return total + Number(run.Q[quality] || 0);
  }, 0);
  assert.strictEqual(projectedSeats, 460,
    'Projected Sejm seats must sum to 460');
  run.engine.goToScene('poland_events_2026.snap_result_2026');
  assert.strictEqual(
    Number(run.Q.snap_election_right_2027_seats || 0),
    run.Q.prawica_member_source_ids.reduce(function(total, id) {
      return total + Number(run.Q[id + '_seats'] || 0);
    }, 0),
    'Certified Prawica committee was counted more than once'
  );
  const seats = [
    'pis_seats', 'ko_seats', 'p2050_seats', 'psl_seats', 'left_seats',
    'konf_seats', 'other_seats', 'sld_breakaway_seats',
    'social_patriot_seats', 'spring_breakaway_seats', 'labor_left_seats',
    'young_left_seats', 'razem_party_seats', 'pps_party_seats',
    'tak_rozwoj_seats', 'centrum_seats', 'rozwoj_seats', 'korona_seats',
    'ko_splinter_seats', 'p0_seats', 'suwerenna_seats',
    'porozumienie_seats', 'kukiz_seats',
    'republikanie_seats', 'odnowa_seats',
    'new_hope_seats', 'national_movement_seats',
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
