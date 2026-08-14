'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dendry = require('dendrynexus/lib/engine');

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: undefined,
});

const json = fs.readFileSync(
  path.join(__dirname, '..', 'out', 'game.json'), 'utf8'
);
let game;
dendry.convertJSONToGame(json, function(error, converted) {
  if (error) throw error;
  game = converted;
});
const reformProse = [
  'poland_porozumienie_war.scene.dry',
  'poland_events_2021_2023.scene.dry',
].map(function(file) {
  return fs.readFileSync(path.join(__dirname, '..', 'source', 'scenes', file),
    'utf8');
}).join('\n');
for (const partyClass of [
  'party party-kukiz', 'party party-pis', 'party party-ko',
  'party party-lewica', 'party party-razem', 'party party-agreement',
]) {
  assert(reformProse.includes('class="' + partyClass + '"'),
    'Reform prose is missing styled actor class ' + partyClass);
}

function newEngine(name) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([name]);
  function choose(id) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(choice) { return choice.id === id; });
    assert(index >= 0, 'Missing choice ' + id + ' among ' +
      choices.map(function(choice) { return choice.id; }).join(', '));
    engine.choose(index);
  }
  choose('root.campaign_game');
  choose('root.standard');
  engine.goToScene('poland_normalize');
  return {engine: engine, Q: engine.state.qualities, choose: choose};
}

function sum(object) {
  return Object.keys(object).reduce(function(total, id) {
    return total + Number(object[id] || 0);
  }, 0);
}

function dhondt(votes, seats) {
  const result = Object.fromEntries(Object.keys(votes).map(function(id) {
    return [id, 0];
  }));
  for (let seat = 0; seat < seats; seat += 1) {
    let winner = Object.keys(votes)[0];
    for (const id of Object.keys(votes)) {
      if (votes[id] / (result[id] + 1) >
          votes[winner] / (result[winner] + 1)) winner = id;
    }
    result[winner] += 1;
  }
  return result;
}

function sejmTotal(Q, ids) {
  return ids.reduce(function(total, id) {
    const quality = id === 'razem' ? 'razem_party_seats' :
      (id === 'pps' ? 'pps_party_seats' : id + '_seats');
    return total + Number(Q[quality] || 0);
  }, 0);
}

function allocation(Q, system, votes, mapping, listOptions) {
  const ids = ['left', 'pis', 'ko', 'psl', 'konf', 'other'];
  const committeeFor = Object.assign({}, mapping);
  const committeeVotes = {};
  for (const id of ids) {
    const committee = committeeFor[id] || id;
    committeeVotes[committee] = (committeeVotes[committee] || 0) + votes[id];
  }
  return globalThis.polandElectionModel.allocateSejm({
    state: Q,
    system: system,
    partyIds: ids,
    committeeFor: committeeFor,
    componentVotes: votes,
    committeeVotes: committeeVotes,
    qualifiedCommittees: Object.keys(committeeVotes),
    negotiatedShares: {},
    eligiblePartyIds: ids,
    committeeThresholds: listOptions && listOptions.thresholds || {},
    committeeHosts: listOptions && listOptions.hosts || {},
  });
}

const fixture = newEngine('electoral-model');
assert.strictEqual(globalThis.polandElectionModel.konfederacjaListThreshold(
  10.5, 2.6), 5);
assert.strictEqual(globalThis.polandElectionModel.konfederacjaListThreshold(
  10.7, 2.6), 8);
const baseVotes = {left: 12, pis: 36, ko: 31, psl: 8, konf: 7, other: 6};
const proportional = allocation(fixture.Q, 'proportional', baseVotes, {});
const mixed = allocation(fixture.Q, 'mixed_230', baseVotes, {});
const full = allocation(fixture.Q, 'fptp_460', baseVotes, {});
assert.strictEqual(sum(proportional.partySeats), 460);
assert.strictEqual(proportional.districtResults.length, 41,
  'The proportional model did not allocate through 41 districts');
const proportionalProvinceSeats = {};
for (const province of proportional.provinceResults) {
  for (const id of Object.keys(province.seats)) {
    proportionalProvinceSeats[id] =
      (proportionalProvinceSeats[id] || 0) + province.seats[id];
  }
}
assert.deepStrictEqual(proportionalProvinceSeats, proportional.committeeSeats,
  'Province seats do not reconcile with the national result');
assert.deepStrictEqual(
  [mixed.listSeatCount, mixed.urbanSeatCount, mixed.ruralSeatCount,
    sum(mixed.partySeats)],
  [230, 138, 92, 460]
);
assert.deepStrictEqual(
  [full.listSeatCount, full.urbanSeatCount, full.ruralSeatCount,
    sum(full.partySeats)],
  [0, 276, 184, 460]
);

const coalitionMapping = {
  left: 'democratic_list', ko: 'democratic_list', psl: 'democratic_list',
};
const coalitionOptions = {thresholds: {democratic_list: 8}};
for (const system of ['proportional', 'mixed_230', 'fptp_460']) {
  const result = allocation(fixture.Q, system,
    {left: 20, pis: 10, ko: 50, psl: 15, konf: 3, other: 2},
    coalitionMapping, coalitionOptions);
  const memberSeats = ['left', 'ko', 'psl'].map(function(id) {
    return result.partySeats[id];
  });
  const committeeSeats = result.committeeSeats.democratic_list;
  assert(memberSeats.every(function(seats) {
    return seats >= committeeSeats * 0.25 && seats <= committeeSeats * 0.42;
  }), 'An 8% coalition did not divide mandates roughly equally under ' + system);
}

const hostResult = allocation(fixture.Q, 'proportional',
  {left: 35, pis: 35, ko: 15, psl: 7, konf: 6, other: 2},
  {left: 'pis'}, {
    thresholds: {pis: 5},
    hosts: {pis: 'pis'},
  });
assert(hostResult.partySeats.pis >= hostResult.committeeSeats.pis * 0.80,
  'A 5% host list did not leave the lion\'s share to its host');
assert(hostResult.partySeats.left <= hostResult.committeeSeats.pis * 0.20,
  'A 5% host-list guest received more than scraps');
assert.strictEqual(full.districtResults.length, 460,
  'FPTP did not use the committed 460 constituencies');
assert.strictEqual(
  allocation(fixture.Q, 'fptp_460',
    {left: 2, pis: 40, ko: 34, psl: 9, konf: 9, other: 6}, {}).partySeats.left,
  0,
  'Strongholds became an artificial rescue floor'
);
const seededStandalone = [-2, -1, 0, 1, 2].map(function(shock) {
  return allocation(fixture.Q, 'fptp_460', {
    left: 12 + shock, pis: 36 - shock / 2, ko: 31 - shock / 2,
    psl: 8, konf: 7, other: 6,
  }, {}).partySeats.left;
});
assert(seededStandalone.every(function(seats, index) {
  return index === 0 || seats >= seededStandalone[index - 1];
}), 'More Left votes reduced its deterministic FPTP seat count');

for (const pact of [
  {left: 'ko'},
  {left: 'democratic_list', ko: 'democratic_list', psl: 'democratic_list'},
  {left: 'pis'},
]) {
  const pactSeats = allocation(fixture.Q, 'fptp_460', baseVotes, pact)
    .partySeats.left;
  assert(pactSeats >= full.partySeats.left,
    'A filed pact reduced the Left result');
}

const narrowLeader = allocation(fixture.Q, 'fptp_460',
  {left: 37, pis: 36, ko: 20, psl: 3, konf: 2, other: 2}, {});
const dominantLeader = allocation(fixture.Q, 'fptp_460',
  {left: 43, pis: 24, ko: 19, psl: 6, konf: 5, other: 3}, {});
assert(narrowLeader.partySeats.left > full.partySeats.left,
  'Becoming the leading party did not improve the Left result');
assert(dominantLeader.partySeats.left > narrowLeader.partySeats.left,
  'A dominant lead did not improve on a narrow lead');
assert.deepStrictEqual(
  dominantLeader,
  allocation(fixture.Q, 'fptp_460',
    {left: 43, pis: 24, ko: 19, psl: 6, konf: 5, other: 3}, {}),
  'Identical polls redrew the synthetic districts'
);

function enact(choice, system) {
  const run = newEngine('electoral-chain-' + system);
  run.Q.kukiz_channel = 30;
  run.Q.resources = 5;
  run.engine.goToScene('poland_porozumienie_war.kukiz_negotiation');
  const pisOffer = run.Q.kukiz_pis_offer;
  run.choose(choice);
  assert.strictEqual(run.Q.electoral_reform_proposal, system);
  assert(run.Q.kukiz_left_bid >= pisOffer + (system === 'mixed_230' ? 8 : 12));
  run.choose('poland_porozumienie_war.kukiz_resolution');
  assert.strictEqual(run.Q.kukiz_alignment, 'refused');
  const before = run.Q.resources;
  run.engine.goToScene('poland_events_2021_2023.electoral_reform_ko_talks');
  run.choose('poland_events_2021_2023.electoral_reform_ko_accept');
  assert.strictEqual(run.Q.resources, before - 2);
  assert.strictEqual(run.Q.electoral_reform_boundary_safeguards, 1);
  assert.strictEqual(run.Q.electoral_reform_opposition_pact_channel, 1);
  run.engine.goToScene('poland_events_2021_2023.electoral_reform_referendum');
  assert.deepStrictEqual(
    [run.Q.electoral_reform_referendum_turnout,
      run.Q.electoral_reform_referendum_yes],
    [56, 52]
  );
  Object.assign(run.Q, {
    pis_seats: 224, ko_seats: 134, left_seats: 49, psl_seats: 30,
    p2050_seats: 0, porozumienie_seats: 11, kukiz_seats: 5,
    senate_pis_seats: 48, senate_ko_seats: 43, senate_left_seats: 2,
    senate_psl_seats: 3, senate_p2050_seats: 1,
    senate_independent_seats: 3,
  });
  run.engine.goToScene('poland_events_2021_2023.electoral_reform_constitution');
  assert(run.Q.electoral_reform_sejm_yes >= 307);
  assert(run.Q.electoral_reform_senate_yes >= 51);
  assert.strictEqual(run.Q.electoral_reform_stage, 'enacted');
  assert.strictEqual(run.Q.sejm_electoral_system, system);
  assert.strictEqual(run.Q.electoral_reform_constitution_passed, 1);
  assert.strictEqual(run.Q.electoral_reform_president_signed, 1);
  assert.strictEqual(run.Q.electoral_reform_code_enacted, 1);
  run.engine.goToScene('poland_normalize');
  assert.strictEqual(run.Q.game_achievement_mokry_sen_kukiza, 1);
  return run;
}

enact('poland_porozumienie_war.kukiz_bid_mixed_jow', 'mixed_230');
const enactedFull = enact(
  'poland_porozumienie_war.kukiz_bid_full_jow', 'fptp_460'
);

const failed = newEngine('electoral-chain-no-ko');
Object.assign(failed.Q, {
  electoral_reform_proposal: 'fptp_460',
  electoral_reform_stage: 'referendum_won',
  electoral_reform_ko_support: 0,
  pis_seats: 224, ko_seats: 134, left_seats: 49, psl_seats: 30,
  p2050_seats: 0, porozumienie_seats: 11, kukiz_seats: 5,
  senate_pis_seats: 48, senate_ko_seats: 43, senate_left_seats: 2,
  senate_psl_seats: 3, senate_p2050_seats: 1,
  senate_independent_seats: 3,
});
failed.engine.goToScene(
  'poland_events_2021_2023.electoral_reform_constitution'
);
assert.strictEqual(failed.Q.electoral_reform_stage, 'failed');
assert.strictEqual(failed.Q.sejm_electoral_system, 'proportional');

const incomplete = newEngine('electoral-incomplete-save');
incomplete.Q.sejm_electoral_system = 'fptp_460';
incomplete.Q.electoral_reform_stage = 'ko_compromise';
incomplete.engine.goToScene('poland_normalize');
assert.strictEqual(incomplete.Q.sejm_electoral_system, 'proportional');
delete incomplete.Q.sejm_electoral_system;
delete incomplete.Q.electoral_reform_stage;
incomplete.engine.goToScene('poland_normalize');
assert.strictEqual(incomplete.Q.sejm_electoral_system, 'proportional');

enactedFull.Q.election_2023_certified = 0;
enactedFull.engine.goToScene('poland_government_formation.campaign_entry');
assert.strictEqual(enactedFull.Q.sejm_result_system, 'fptp_460');
assert.deepStrictEqual(
  [enactedFull.Q.sejm_result_list_seats,
    enactedFull.Q.sejm_result_urban_seats,
    enactedFull.Q.sejm_result_rural_seats],
  [0, 276, 184]
);
const formationIds = [
  'pis', 'ko', 'p2050', 'psl', 'left', 'konf', 'other',
  'sld_breakaway', 'social_patriot', 'spring_breakaway', 'labor_left',
  'young_left', 'razem', 'pps', 'centrum', 'rozwoj', 'korona', 'ko_splinter',
  'kukiz',
];
assert.strictEqual(sejmTotal(enactedFull.Q, formationIds), 460);

const kukizReturn = newEngine('electoral-kukiz-third-way');
Object.assign(kukizReturn.Q, {
  year: 2023,
  p2050_emerged: 1,
  third_way_active: 1,
  third_way_2023_done: 1,
  third_way_split: 0,
  third_way_joint_list: 1,
  kukiz_left_kp: 1,
  kukiz_active: 1,
  kukiz_list_committee: 'psl',
  election_2023_certified: 0,
});
const kukizRecord = kukizReturn.Q.rival_group_records.find(function(record) {
  return record.id === 'kukiz15';
});
kukizRecord.list_committee = 'psl';
kukizRecord.contesting = 1;
kukizReturn.engine.goToScene('poland_normalize');
assert.strictEqual(kukizReturn.Q.kukiz_list_committee, 'third_way',
  'Kukiz scalar list did not follow his live record into Third Way');
kukizReturn.engine.goToScene('poland_government_formation.campaign_entry');
assert.strictEqual(sejmTotal(kukizReturn.Q, formationIds), 460,
  'Kukiz survived certification as phantom MPs');
assert(kukizReturn.Q.kukiz_seats > 0,
  'Kukiz was ejected from the Third Way candidate allocation');
assert.strictEqual(kukizRecord.exclusive_seats, kukizReturn.Q.kukiz_seats,
  'Kukiz party record disagrees with the certified result');

const kukizAlone = newEngine('electoral-kukiz-alone');
Object.assign(kukizAlone.Q, {
  year: 2023,
  kukiz_left_kp: 1,
  kukiz_active: 1,
  kukiz_list_committee: 'kukiz',
  kukiz_vote_intent: 2,
  kukiz_component_vote_intent: 2,
  kukiz_seats: 6,
  election_2023_certified: 0,
});
const loneKukizRecord = kukizAlone.Q.rival_group_records.find(
  function(record) { return record.id === 'kukiz15'; }
);
loneKukizRecord.list_committee = 'kukiz';
loneKukizRecord.contesting = 1;
loneKukizRecord.exclusive_seats = 6;
loneKukizRecord.mp_count = 6;
kukizAlone.engine.goToScene('poland_government_formation.campaign_entry');
assert.strictEqual(kukizAlone.Q.kukiz_seats, 0,
  'A failed independent Kukiz list retained MPs from the outgoing Sejm');
assert.strictEqual(loneKukizRecord.exclusive_seats, 0,
  'The Kukiz party record retained phantom MPs after certification');
assert.strictEqual(sejmTotal(kukizAlone.Q, formationIds), 460);

const snapIds = formationIds.concat([
  'p0', 'tak_rozwoj', 'suwerenna', 'porozumienie', 'republikanie', 'odnowa',
  'new_hope', 'national_movement', 'duda', 'social_conservative',
]);
for (const year of [2023, 2024, 2025, 2026, 2027]) {
  const snap = newEngine('electoral-snap-' + year);
  snap.Q.year = year;
  snap.Q.electoral_reform_stage = 'enacted';
  snap.Q.electoral_reform_proposal = 'mixed_230';
  snap.Q.sejm_electoral_system = 'mixed_230';
  snap.engine.goToScene('poland_events_2026.snap_result_2026');
  assert.strictEqual(snap.Q.sejm_result_system, 'mixed_230');
  assert.deepStrictEqual(
    [snap.Q.sejm_result_list_seats, snap.Q.sejm_result_urban_seats,
      snap.Q.sejm_result_rural_seats],
    [230, 138, 92]
  );
  assert.strictEqual(sejmTotal(snap.Q, snapIds), 460);
  assert.strictEqual(
    snap.Q.senate_pis_seats + snap.Q.senate_konf_seats +
      snap.Q.senate_ko_seats + snap.Q.senate_p2050_seats +
      snap.Q.senate_psl_seats + snap.Q.senate_left_seats +
      snap.Q.senate_independent_seats,
    100
  );
}

const commonCentre = newEngine('electoral-live-common-centre');
Object.assign(commonCentre.Q, {
  year: 2027,
  month: 6,
  continuous_campaign: 1,
  p2050_emerged: 1,
  third_way_active: 1,
  third_way_2023_done: 1,
  third_way_split: 0,
  third_way_joint_list: 1,
  third_way_alternative_outcome:
    'Common-centre list preserving autonomous components',
  sejm_list_outcome: 'democratic_8',
  sejm_list_host: 'democratic_list',
  poll_state_month_key: -1,
});
commonCentre.engine.goToScene('poland_normalize');
commonCentre.engine.goToScene('poland_polling');
assert.strictEqual(
  commonCentre.Q.poland_election_forecast_input.committeeFor.left,
  'left',
  'A dissolved broad list left Lewica stranded on a ghost 8% committee'
);
commonCentre.engine.goToScene('poland_events_2026.snap_result_2026');
assert.strictEqual(sejmTotal(commonCentre.Q, snapIds), 460,
  'A live common-centre list orphaned seats from the certified Sejm');
assert.strictEqual(commonCentre.Q.snap_third_way_joint_list, 0,
  'The obsolete 2023 Third Way committee survived the common-centre filing');

const konfFamily = newEngine('electoral-konf-family');
Object.assign(konfFamily.Q, {
  election_2023_certified: 1,
  konf_seats: 90,
  senate_konf_seats: 9,
  konf_list_threshold: 5,
  far_right_split: 0,
});
konfFamily.engine.goToScene('poland_normalize');
assert(Math.abs(konfFamily.Q.result_member_nowa_nadzieja_sejm -
  konfFamily.Q.result_member_ruch_narodowy_sejm) <= 1,
  'The 5% Konfederacja list did not balance New Hope and National Movement');
assert(konfFamily.Q.result_member_kkp_sejm <= 10,
  'Braun did not receive the thin share of a 5% Konfederacja list');
assert.strictEqual(
  konfFamily.Q.result_member_nowa_nadzieja_sejm +
    konfFamily.Q.result_member_ruch_narodowy_sejm +
    konfFamily.Q.result_member_kkp_sejm,
  90
);
konfFamily.Q.konf_list_threshold = 8;
konfFamily.engine.goToScene('poland_normalize');
const equalKonfSeats = [
  konfFamily.Q.result_member_nowa_nadzieja_sejm,
  konfFamily.Q.result_member_ruch_narodowy_sejm,
  konfFamily.Q.result_member_kkp_sejm,
];
assert(Math.max.apply(null, equalKonfSeats) -
  Math.min.apply(null, equalKonfSeats) <= 1,
  'A reliable 8% Konfederacja list did not use equal member shares');

console.log('Electoral reform check passed.');
