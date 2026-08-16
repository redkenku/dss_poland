'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dendry = require('dendrynexus/lib/engine');

const root = path.resolve(__dirname, '..');
let game;
dendry.convertJSONToGame(
  fs.readFileSync(path.join(root, 'out/game.json'), 'utf8'),
  function(error, converted) {
    if (error) throw error;
    game = converted;
  }
);

function run(seed) {
  const ui = new dendry.UserInterface();
  ui.newPage = function() {};
  const engine = new dendry.DendryEngine(ui, game);
  engine.beginGame([seed]);
  function choose(id) {
    const choices = engine.getCurrentChoices() || [];
    const index = choices.findIndex(function(choice) { return choice.id === id; });
    assert(index >= 0, 'missing ' + id + ' in ' + engine.state.sceneId +
      ' :: ' + choices.map(function(choice) { return choice.id; }).join(', '));
    assert(choices[index].canChoose, 'unavailable ' + id);
    engine.choose(index);
  }
  choose('root.campaign_game');
  choose('root.standard');
  choose('poland_intro.short_brief');
  choose('poland_hub');
  return {engine: engine, Q: engine.state.qualities, choose: choose};
}

function applyRightsBill(bill, enacted) {
  const current = run('rights-' + bill + '-' + enacted);
  Object.assign(current.Q, {
    trz_rights_bill: bill,
    legvote_enacted: enacted ? 1 : 0,
    legvote_sejm_passed: enacted ? 1 : 0,
    legvote_effects_applied: 0,
    legvote_sejm_yes: enacted ? 231 : 220,
    legvote_pis_yes: enacted ? 3 : 0,
    legvote_pis_abstain: 0
  });
  current.engine.goToScene('poland_trzaskowski.rights_vote_apply');
  return current.Q;
}

// Only an enacted rights law activates the ratchet; marriage starts higher.
let q = applyRightsBill('Abortion-law restoration', false);
assert.strictEqual(q.trz_freebie_law, '');
q = applyRightsBill('Judicial repair', true);
assert.strictEqual(q.trz_freebie_law, '');
const abortion = applyRightsBill('Abortion-law restoration', true);
const marriage = applyRightsBill('Marriage equality', true);
assert.strictEqual(abortion.trz_freebie_law, 'abortion');
assert.strictEqual(abortion.trz_freebie_realign_pressure, 15);
assert.strictEqual(marriage.trz_freebie_law, 'marriage');
assert.strictEqual(marriage.trz_freebie_realign_pressure, 20);
assert(marriage.marriage_reform_stage >= 4, 'marriage must be recorded as enacted');

function monthlyGain(law, pisCabinet) {
  const current = run('gain-' + law + '-' + pisCabinet);
  Object.assign(current.Q, {
    continuous_campaign: 0,
    year: 2024,
    month: 1,
    month_actions: 1,
    formation_complete: 1,
    trz_freebie_law: law,
    trz_freebie_realign_pressure: 20,
    government_party: pisCabinet ? 'pis' : 'ko',
    government_has_confidence: 1,
    caretaker_government: 0,
    pis_split: 0,
    pis_collapsed: 0,
    rozwoj_party_formed: 0
  });
  current.engine.goToScene('poland_advance');
  return current.Q.trz_freebie_realign_pressure - 20;
}

const lossAbortionGain = monthlyGain('abortion', false);
const lossMarriageGain = monthlyGain('marriage', false);
const cabinetAbortionGain = monthlyGain('abortion', true);
assert(lossMarriageGain > lossAbortionGain, 'marriage pressure must advance faster');
assert(lossAbortionGain > cabinetAbortionGain,
  'a PiS defeat must advance faster than a confident PiS cabinet');
assert(
  Math.ceil((75 - 15) / lossAbortionGain) <
    Math.ceil((75 - 15) / cabinetAbortionGain),
  'the defeated-PiS route must reach the crossover stage earlier'
);

// The poll transfer is bounded and support remains normalized to 100.
{
  const current = run('freebie-poll');
  Object.assign(current.Q, {
    year: 2025,
    month: 7,
    election_2023_certified: 1,
    trz_freebie_law: 'abortion',
    trz_freebie_realign_pressure: 100
  });
  current.engine.goToScene('poland_polling');
  assert(current.Q.trz_freebie_poll_transfer > 0);
  assert(current.Q.trz_freebie_poll_transfer <= 0.25);
  const savedTransfer = current.Q.trz_freebie_poll_transfer_total;
  assert(Math.abs(current.Q.nationwide_vote_intent_total - 100) < 0.001);
  assert(Math.abs(current.Q.nationwide_poll_total - 100) < 0.001);
  current.Q.month += 1;
  current.Q.trz_freebie_realign_pressure = 0;
  current.Q.konf_poll_momentum = 100;
  current.engine.goToScene('poland_polling');
  assert(current.Q.trz_freebie_poll_transfer_total >= savedTransfer,
    'the structural transfer must never reverse: ' + savedTransfer +
      ' -> ' + current.Q.trz_freebie_poll_transfer_total);
}

// A ruptured family excludes both the old committee and Korona residuals.
{
  const current = run('split-family');
  Object.assign(current.Q, {
    mentzen_bosak_split: 1,
    new_hope_seats: 13,
    national_movement_seats: 11,
    konf_seats: 77,
    korona_seats: 4
  });
  current.engine.goToScene('poland_normalize');
  assert.strictEqual(current.Q.konf_family_seats, 24);
}

// Suwerenna moves only recorded mandates in every legal state.
for (const state of [
  {name: 'independent', seats: 9, walkout: 1, merged: 0,
    result: 'Refused merger', route: 'whole_party', moved: 9},
  {name: 'federated', seats: 0, walkout: 0, merged: 0,
    result: 'Federated United Right member', route: 'whole_party', moved: 12},
  {name: 'merged', seats: 0, walkout: 0, merged: 1,
    result: 'Full merger into PiS', route: 'jaki_current', moved: 4}
]) {
  const current = run('suwerenna-' + state.name);
  const record = current.Q.rival_group_records.find(function(item) {
    return item.id === 'solidarna';
  });
  Object.assign(record, {sejm_mps: 12, mp_count: 12});
  Object.assign(current.Q, {
    year: 2025,
    trz_freebie_law: 'marriage',
    trz_freebie_realign_pressure: 50,
    trz_freebie_suwerenna_done: 0,
    suwerenna_seats: state.seats,
    suwerenna_walkout: state.walkout,
    suwerenna_merged: state.merged,
    suwerenna_merger_result: state.result,
    pis_seats: 190,
    konf_seats: 18,
    government_party: 'ko'
  });
  const before = current.Q.pis_seats + current.Q.suwerenna_seats +
    current.Q.konf_seats;
  current.engine.goToScene('poland_trz_freebie.freebie_suwerenna_crossing');
  const after = current.Q.pis_seats + current.Q.suwerenna_seats +
    current.Q.konf_seats;
  assert.strictEqual(after, before, state.name + ' must conserve Sejm seats');
  assert.strictEqual(current.Q.trz_freebie_suwerenna_route, state.route);
  assert.strictEqual(current.Q.trz_freebie_suwerenna_seats, state.moved);
}

// KO and PSL lines are state-owned and open only in their authored scenes.
{
  const current = run('partner-lines');
  Object.assign(current.Q, {
    year: 2025,
    trz_freebie_law: 'marriage',
    trz_freebie_realign_pressure: 70,
    konf_dominant_wing: 'Mentzenites',
    konf_braunist_share: 12,
    konf_normalisation: 40,
    ko_classical_liberal_share: 60,
    ko_social_liberal_share: 40,
    mentzen_kingmaker_active: 1,
    rival_relation_psl_konf: 30,
    rival_relation_ko_konf: 30,
    trz_freebie_konf_hegemon: 1
  });
  assert.strictEqual(current.Q.psl_konf_partner_line, 'closed');
  assert.strictEqual(current.Q.ko_konf_partner_line, 'closed');
  current.engine.goToScene('poland_trz_freebie.freebie_konf_crossover');
  assert.strictEqual(current.Q.psl_konf_partner_line, 'closed');
  assert.strictEqual(current.Q.ko_konf_partner_line, 'closed');
  current.engine.goToScene('poland_trz_freebie.freebie_psl_channel');
  assert.notStrictEqual(current.Q.psl_konf_partner_line, 'closed');
  current.engine.goToScene('poland_trz_freebie.freebie_ko_channel');
  assert.notStrictEqual(current.Q.ko_konf_partner_line, 'closed');
}

function sikorskiRun(choice, seed) {
  const current = run(seed);
  Object.assign(current.Q, {
    year: 2026,
    month: 11,
    government_party: 'lewica',
    government_has_confidence: 1,
    caretaker_government: 0,
    formation_in_progress: 0,
    left_in_government: 1,
    ministry_ko_in_cabinet: 1,
    president_name: 'Andrzej Duda',
    prime_minister: 'Włodzimierz Czarzasty',
    government_coalition_dissent: 65,
    ko_seats: 154,
    psl_seats: 30,
    p2050_seats: 25,
    centrum_seats: 10,
    konf_seats: 25,
    ko_relation: 10,
    psl_relation: 10,
    p2050_relation: 10,
    centrum_relation: 10,
    coalition_viable_ko_konf: 1,
    konf_normalisation: 55,
    ko_konf_partner_line: 'governing',
    psl_konf_partner_line: 'open'
  });
  current.engine.goToScene('poland_events_2026_11.constructive_motion_2026');
  assert.strictEqual(current.Q.constructive_candidate, 'Radosław Sikorski');
  current.choose(choice);
  current.choose('poland_events_2026_11.constructive_roll_2026');
  return current.Q;
}

const repaired = sikorskiRun(
  'poland_events_2026_11.constructive_defend_2026', 'sikorski-repair'
);
assert.strictEqual(repaired.constructive_passed, 0,
  'a full coalition repair must be able to stop Sikorski');
const mishandled = sikorskiRun(
  'poland_events_2026_11.constructive_sikorski_dismiss', 'sikorski-dismiss'
);
assert.strictEqual(mishandled.constructive_passed, 1);
assert.strictEqual(mishandled.sikorski_nightmare, 1);

// The dominant component supplies an available Konfederacja-family premier.
for (const nominee of [
  {name: 'Sławomir Mentzen', mentzen: 62, bosak: 28},
  {name: 'Krzysztof Bosak', mentzen: 28, bosak: 62}
]) {
  const current = run('pm-' + nominee.name);
  Object.assign(current.Q, {
    konf_mentzenite_share: nominee.mentzen,
    konf_nationalist_share: nominee.bosak,
    konf_seats: 120,
    pis_seats: 100,
    president_name: 'Andrzej Duda'
  });
  current.engine.goToScene('poland_normalize');
  assert.strictEqual(current.Q.konf_pm_candidate, nominee.name);
  Object.assign(current.Q, {
    formation_coalition_code: 'pis_konf',
    formation_coalition_members: ['pis', 'konf'],
    formation_government_party: 'konf',
    formation_coalition_label: 'Konfederacja + PiS',
    formation_coalition_support_seats: 250,
    sejm_statutory_majority: 231,
    left_committed_seats: 0
  });
  current.engine.goToScene('poland_government_formation.formation_pm_alt');
  const option = current.engine.getCurrentChoices().find(function(choice) {
    return choice.id === 'poland_government_formation.formation_pm_alt_konf';
  });
  assert(option && option.canChoose, nominee.name + ' must be an available PM');
  assert.strictEqual(current.Q.formation_pm_konf_name, nominee.name);
}

// The accelerated fixture reaches a real two-committee rupture.
{
  const current = run('freebie-rupture');
  const newHope = current.Q.rival_group_records.find(function(item) {
    return item.id === 'nowa_nadzieja';
  });
  const national = current.Q.rival_group_records.find(function(item) {
    return item.id === 'ruch_narodowy';
  });
  newHope.organisation = 40;
  national.organisation = 38;
  Object.assign(current.Q, {
    year: 2025,
    mentzen_bosak_split: 0,
    konf_seats: 30,
    trz_freebie_law: 'marriage',
    trz_freebie_realign_pressure: 75,
    trz_freebie_konf_hegemon: 1,
    far_right_fragmentation: 35,
    election_2027_terminal: 0
  });
  current.engine.goToScene(
    'poland_scenario_party_gaps.mentzen_bosak_rupture'
  );
  assert.strictEqual(current.Q.mentzen_bosak_split, 1);
  assert.strictEqual(current.Q.konf_seats, 0);
  assert.strictEqual(current.Q.new_hope_seats +
    current.Q.national_movement_seats, 30);
  assert.strictEqual(newHope.list_committee, 'new_hope');
  assert.strictEqual(national.list_committee, 'national_movement');
}

console.log('Trzaskowski freebie realignment checks passed');
