'use strict';

// Cross-file chain callbacks: choices whose consequence is only visible in a
// later event, in another file, sometimes years later. Each assertion below
// pairs one earlier decision with the later scene that reads it, so a rename
// or a deleted assignment fails here instead of silently unchaining the story.
//
//   1. the January 2023 KPO bill price -> the April 2024 payment and, through
//      kpo_shortcut_debt, the October 2025 midterm review;
//   2. the 2023-2024 Gaza record -> the February 2026 ambassador boycott;
//   3. the 2024 Ostatnie Pokolenie protest stance -> the April 2027 repeal
//      crackdown;
//   4. the April 2024 transport bill -> the 2026 gmina service floor;
//   5. the 2023 referendum answer -> the May 2026 SAFE veto route;
//   6. breaking a host list's discipline at the march -> 2023 seat arithmetic.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sceneParser = require('dendrynexus/lib/parsers/scene');

const projectRoot = path.resolve(__dirname, '..');
const scenes = new Map();

function load(fileName) {
  const sourcePath = path.join(projectRoot, 'source/scenes', fileName);
  sceneParser.parseFromContent(
    sourcePath,
    fs.readFileSync(sourcePath, 'utf8'),
    function(error, parsed) {
      if (error) throw error;
      (parsed.sections || []).forEach(function(section) {
        scenes.set(section.id, section);
      });
    }
  );
}

[
  'poland_conflict_climate_events.scene.dry',
  'poland_kpo_2024_2026.scene.dry',
  'poland_events_2026.scene.dry',
  'poland_events_2027.scene.dry',
  'poland_local_affairs.scene.dry',
  'poland_election.scene.dry',
].forEach(load);

function scene(id) {
  const result = scenes.get(id);
  assert(result, 'Missing scene ' + id);
  return result;
}

function apply(id, Q) {
  (scene(id).onArrival || []).forEach(function(action) {
    action({}, Q);
  });
  return Q;
}

function has(id, localChoiceId) {
  return (scene(id).options || []).some(function(option) {
    return String(option.id || '').endsWith(localChoiceId);
  });
}

// 1. The 2023 disciplinary bill is still on the file in 2024.
function kpoBase(quality) {
  return {
    kpo_bill_2023_done: 1,
    kpo_bill_quality: quality,
    kpo_delivery: 4,
    kpo_milestones: 4,
    kpo_funds_available: 0,
    kpo_funds_spent: 0,
    kpo_public_credit: 0,
    kpo_deadline_pressure: 8,
    kpo_shortcut_debt: 0,
    kpo_funds_delayed: 0,
    judicial_legitimacy: 35,
    government_procedural_restraint: 45,
    legal_dualism: 50,
    government_party: 'ko',
  };
}

const verified = apply('poland_kpo_2024_2026.kpo_first_payment_2024', kpoBase(3));
const unverified = apply('poland_kpo_2024_2026.kpo_first_payment_2024', kpoBase(2));
const refused = apply('poland_kpo_2024_2026.kpo_first_payment_2024', kpoBase(0));
const noPosition = apply('poland_kpo_2024_2026.kpo_first_payment_2024', (function() {
  const state = kpoBase(0);
  state.kpo_bill_2023_done = 0;
  return state;
})());

assert(unverified.kpo_shortcut_debt > verified.kpo_shortcut_debt,
  'Voting for the unverified 2023 bill must leave more KPO technical debt');
assert(unverified.kpo_deadline_pressure < refused.kpo_deadline_pressure,
  'Taking the 2023 deal must buy time that refusing it does not');
assert(verified.kpo_milestones > unverified.kpo_milestones,
  'Independently verified milestones must count in the 2024 dossier');
assert.strictEqual(noPosition.kpo_shortcut_debt, 0,
  'A campaign that never reached the 2023 bill cannot inherit its debt');
assert(String(noPosition.kpo_bill_2023_legacy).includes('No Lewica position'),
  'The 2024 payment must state when there is no 2023 record to read');
// The October 2025 review scores kpo_shortcut_debt at -2 each; that is the
// delayed cost of the fast 2023 route.
assert(
  fs.readFileSync(
    path.join(projectRoot, 'source/scenes/poland_kpo_2024_2026.scene.dry'),
    'utf8'
  ).includes('Q.kpo_shortcut_debt * 2 - Q.kpo_deadline_pressure'),
  'The midterm review must still price shortcut debt'
);

// 2. Three years of Gaza statements decide how February 2026 reads.
function ambassadorBase(score) {
  return {
    gaza_chain_stage: 3,
    gaza_stance_score: score,
    sejm_speaker: 'Marta Stożek',
    us_ambassador_channel: 10,
    us_congress_channel: 48,
    us_defence_channel: 72,
    us_alliance_reliability: 60,
    left_atlanticist_dissent: 12,
    razem_dissent: 40,
    barons_dissent: 40,
    party_unity: 50,
    progressive_credibility: 50,
    public_trust: 50,
    media_capacity: 50,
    young_support: 50,
    ko_relation: 50,
    foreign_policy_responsibility: 20,
    resources: 3,
    parliament_visibility: 40,
    constitutional_restraint: 40,
  };
}

const standConsistent = apply('poland_events_2026.ambassador_stand', ambassadorBase(3));
const standReversal = apply('poland_events_2026.ambassador_stand', ambassadorBase(-2));
assert(standConsistent.party_unity > standReversal.party_unity,
  'Defending the text after a pro-Israel record must cost more unity');
assert(standConsistent.progressive_credibility > standReversal.progressive_credibility,
  'A consistent Gaza record must be worth credibility in 2026');

const clarifyAligned = apply('poland_events_2026.ambassador_clarify', ambassadorBase(-3));
const clarifyCeasefire = apply('poland_events_2026.ambassador_clarify', ambassadorBase(3));
assert(clarifyAligned.us_ambassador_channel > clarifyCeasefire.us_ambassador_channel,
  'The embassy must believe a clarification from a party it has agreed with');

const withdrawCeasefire = apply('poland_events_2026.ambassador_apologise', ambassadorBase(3));
const withdrawAligned = apply('poland_events_2026.ambassador_apologise', ambassadorBase(-2));
assert(withdrawCeasefire.razem_dissent > withdrawAligned.razem_dissent,
  'Withdrawing the text must cost most where the record was strongest');

const rulesUnsettled = apply('poland_events_2026.ambassador_rules',
  Object.assign(ambassadorBase(0), {institutional_trust: 40}));
const rulesCeasefire = apply('poland_events_2026.ambassador_rules',
  Object.assign(ambassadorBase(3), {institutional_trust: 40}));
assert(rulesUnsettled.us_ambassador_channel > rulesCeasefire.us_ambassador_channel,
  'A party with no settled Gaza line must be the better procedural broker');
assert(rulesUnsettled.party_unity < rulesCeasefire.party_unity,
  'Being the broker because you never chose must still cost internally');

assert(has('poland_events_2026.ambassador_crisis_2026', 'ambassador_committee') &&
  has('poland_events_2026.ambassador_crisis_stozek_2026', 'ambassador_committee'),
  'Both ambassador openings must offer the committee route');
const committeeGate = scene('poland_events_2026.ambassador_committee');
assert(/gaza_chain_stage/.test(committeeGate.viewIf.logicSource) &&
  /gaza_stance_score/.test(committeeGate.viewIf.logicSource),
  'The committee inquiry must stay gated on the completed Gaza record');
const committee = apply('poland_events_2026.ambassador_committee', ambassadorBase(3));
assert.strictEqual(committee.gaza_committee_inquiry, 1);
assert.strictEqual(committee.resources, 2);
assert(committee.us_congress_channel > 48 && committee.us_ambassador_channel < 10,
  'The inquiry must trade the embassy channel for the congressional one');

// 3. The 2024 protest stance is the 2027 crackdown's legal precedent.
function repealBase(stance) {
  return {
    last_generation_stance: stance,
    last_generation_chain_stage: 3,
    sikorski_abortion_stage_before_repeal: 1,
    sikorski_marriage_stage_before_repeal: 0,
    sikorski_left_veto_count: 0,
    sikorski_protest_strength: 40,
    sikorski_police_militarisation: 4,
    movement_autonomy: 40,
    feminist_trust: 50,
    progressives_dissent: 40,
    progressive_credibility: 50,
    minority_safety: 50,
    public_trust: 50,
    government_delivery: 50,
    climate_activist_support: 0,
    left_poll: 10,
    left_poll_momentum: 0,
    abortion_reform_stage: 3,
    abortion_reform_progress: 60,
    president_name: 'Radosław Sikorski',
  };
}

const punitive = apply('poland_events_2027.sikorski_black_march_2027',
  repealBase('Decisive removal and civil damages'));
const solidarity = apply('poland_events_2027.sikorski_black_march_2027',
  repealBase('Solidarity with the blockade campaign'));
const noRecord = apply('poland_events_2027.sikorski_black_march_2027', (function() {
  const state = repealBase('');
  state.last_generation_chain_stage = 0;
  return state;
})());

assert.strictEqual(punitive.sikorski_protest_law_precedent, 1);
assert.strictEqual(solidarity.sikorski_protest_movement_ally, 1);
assert.strictEqual(noRecord.sikorski_protest_law_precedent, 0);
assert.strictEqual(noRecord.sikorski_protest_movement_ally, 0);
assert(solidarity.sikorski_protest_strength > noRecord.sikorski_protest_strength,
  'Movements defended in 2024 must turn out in 2027');
assert(punitive.sikorski_protest_strength < noRecord.sikorski_protest_strength,
  'A party that wrote the penalty regime must mobilise less against it');
assert(punitive.sikorski_police_militarisation > noRecord.sikorski_police_militarisation,
  'The normalised penalty regime must be visible in the policing response');

const blockadePunitive = apply('poland_events_2027.sikorski_black_blockade_2027',
  Object.assign(repealBase(''), {
    sikorski_protest_law_precedent: 1,
    sikorski_protest_movement_ally: 0,
    workers_support: 50,
    party_unity: 50,
  }));
const blockadeClean = apply('poland_events_2027.sikorski_black_blockade_2027',
  Object.assign(repealBase(''), {
    sikorski_protest_law_precedent: 0,
    sikorski_protest_movement_ally: 0,
    workers_support: 50,
    party_unity: 50,
  }));
assert(blockadePunitive.public_trust < blockadeClean.public_trust,
  'Blockading under a penalty regime we demanded must cost more trust');
assert(blockadePunitive.progressive_credibility < blockadeClean.progressive_credibility,
  'The 2024 penalty demand must still be quoted against us on the road');

// 4. The April 2024 transport bill is the 2026 floor's costing.
const transportBill = apply(
  'poland_conflict_climate_events.bridges_transport_bill',
  {
    resources: 2, climate_activist_support: 0, climate_policy_pressure: 0,
    climate_pressure_unmet: 6, progressive_credibility: 50,
    progressives_dissent: 40, barons_dissent: 40, psl_relation: 50,
    ko_relation: 50, budget_promises: 0, public_trust: 50,
  }
);
assert.strictEqual(transportBill.transport_bill_2024_filed, 1,
  'The 2024 transport bill must record itself for later transport events');

function floorBase(billFiled) {
  return {
    left_in_government: 1,
    budget: 3,
    resources: 2,
    transport_bill_2024_filed: billFiled,
    gmina_transport_floor_enacted: 0,
    climate_pressure_unmet: 10,
    climate_policy_pressure: 10,
    rural_support: 40,
    local_network: 40,
    household_security: 40,
    spring_strength: 20,
    spring_dissent: 40,
    government_delivery: 50,
    progressive_credibility: 50,
  };
}
const floorWithBill = apply('poland_local_affairs.bus_floor', floorBase(1));
const floorWithout = apply('poland_local_affairs.bus_floor', floorBase(0));
assert(floorWithBill.budget > floorWithout.budget,
  'The 2024 costing must make the 2026 service floor cheaper');
assert(floorWithBill.climate_pressure_unmet < floorWithout.climate_pressure_unmet,
  'Delivering the blockade demands must answer the climate pressure behind them');
assert(floorWithout.rural_support < floorBase(0).rural_support + 5,
  'Unanswered climate pressure must cost rural organisation in 2026');

// 5. The 2023 referendum answer buys a 2026 defence bargain.
const socialFloor = scene('poland_events_2026.safe_veto_social_floor');
assert(/pension_defence_credit/.test(socialFloor.viewIf.logicSource),
  'The SAFE social-floor route must stay gated on the 2023 referendum answer');
assert(has('poland_events_2026.safe_financing_veto_2026', 'safe_veto_social_floor'),
  'The SAFE veto event must offer the social-floor route');
const floorDeal = apply('poland_events_2026.safe_veto_social_floor', {
  pension_defence_credit: 4, defence_readiness: 45, pensioner_support: 40,
  workers_support: 40, household_security: 40, labor_credibility: 40,
  budget_promises: 0, social_patriot_support: 40, public_trust: 50,
  president_relation: 30, ko_relation: 50, fiscal_stress: 20,
  left_poll_momentum: 0, public_mood_pending_social_spending_support: 0,
  public_mood_pending_social_spending_salience: 0,
  public_mood_pending_national_security_left_ownership: 0,
  left_in_government: 1,
});
assert(floorDeal.defence_readiness > 45 && floorDeal.pensioner_support > 40,
  'The social floor must move both the defence programme and the pension side');
assert(floorDeal.fiscal_stress > 20 && floorDeal.ko_relation < 50,
  'Guns and butter must still be paid for');

// 6. Breaking a host list's discipline changes who owns the seats.
function resultBase(broke) {
  return {
    sejm_list_outcome: 'pis_5',
    campaign_march_broke_host_discipline: broke,
    ko_relation: 60,
    left_seats: 30, left_splinter_support_votes: 0,
    ko_seats: 150, p2050_seats: 30, psl_seats: 30, centrum_seats: 0,
    pis_seats: 180, konf_seats: 20, rozwoj_seats: 0, korona_seats: 0,
    social_patriot_list_committee: 'left',
    sld_breakaway_seats: 0, social_patriot_seats: 0, spring_breakaway_seats: 0,
    labor_left_seats: 0, young_left_seats: 0, razem_party_seats: 0,
    pps_party_seats: 0, tak_rozwoj_seats: 0,
    left_committed_seats: 30,
  };
}
const loyalHost = apply('poland_election.results_2023', resultBase(0));
const brokeHost = apply('poland_election.results_2023', resultBase(1));
assert.strictEqual(loyalHost.left_host_list_defection, 0);
assert.strictEqual(brokeHost.left_host_list_defection, 1);
assert(brokeHost.coalition_right_seats < loyalHost.coalition_right_seats,
  'A host list cannot count deputies who publicly broke its discipline');
assert(brokeHost.coalition_democratic_seats > loyalHost.coalition_democratic_seats,
  'With KO trust intact the defecting deputies count on the democratic side');
const brokeHostDistrusted = apply('poland_election.results_2023', (function() {
  const state = resultBase(1);
  state.ko_relation = 30;
  return state;
})());
assert.strictEqual(
  brokeHostDistrusted.coalition_democratic_seats,
  loyalHost.coalition_democratic_seats,
  'Without KO trust the defecting deputies belong to no bloc'
);

console.log('chain-callback-check: all checks passed');
