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
//   6. breaking a host list's discipline at the march -> 2023 seat arithmetic;
//   7. the December 2023 answer to KO's hundred konkrety -> the hundredth-day
//      audit in March 2024, which decides who KO deflects onto, and the April
//      local-election campaign that follows it;
//   8. the February 2024 KPO dossier route -> every later event in the recovery
//      chain, and the September 2025 HoReCa answer -> the October review.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sceneParser = require('dendrynexus/lib/parsers/scene');

const projectRoot = path.resolve(__dirname, '..');
const scenes = new Map();

function load(fileName) {
  const sourcePath = path.isAbsolute(fileName)
    ? fileName
    : path.join(projectRoot, 'source/scenes', fileName);
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
  'poland_local_affairs.scene.dry',
  'poland_election.scene.dry',
].concat(require('./event-sources').eventFiles(function(id) {
  return /^poland_events_(2026|2027)_/.test(id) ||
    id === 'poland_events_2023_12' ||
    /^poland_events_2024_0[1234]$/.test(id);
})).forEach(load);

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

const standConsistent = apply('poland_events_2026_02.ambassador_stand', ambassadorBase(3));
const standReversal = apply('poland_events_2026_02.ambassador_stand', ambassadorBase(-2));
assert(standConsistent.party_unity > standReversal.party_unity,
  'Defending the text after a pro-Israel record must cost more unity');
assert(standConsistent.progressive_credibility > standReversal.progressive_credibility,
  'A consistent Gaza record must be worth credibility in 2026');

const clarifyAligned = apply('poland_events_2026_02.ambassador_clarify', ambassadorBase(-3));
const clarifyCeasefire = apply('poland_events_2026_02.ambassador_clarify', ambassadorBase(3));
assert(clarifyAligned.us_ambassador_channel > clarifyCeasefire.us_ambassador_channel,
  'The embassy must believe a clarification from a party it has agreed with');

const withdrawCeasefire = apply('poland_events_2026_02.ambassador_apologise', ambassadorBase(3));
const withdrawAligned = apply('poland_events_2026_02.ambassador_apologise', ambassadorBase(-2));
assert(withdrawCeasefire.razem_dissent > withdrawAligned.razem_dissent,
  'Withdrawing the text must cost most where the record was strongest');

const rulesUnsettled = apply('poland_events_2026_02.ambassador_rules',
  Object.assign(ambassadorBase(0), {institutional_trust: 40}));
const rulesCeasefire = apply('poland_events_2026_02.ambassador_rules',
  Object.assign(ambassadorBase(3), {institutional_trust: 40}));
assert(rulesUnsettled.us_ambassador_channel > rulesCeasefire.us_ambassador_channel,
  'A party with no settled Gaza line must be the better procedural broker');
assert(rulesUnsettled.party_unity < rulesCeasefire.party_unity,
  'Being the broker because you never chose must still cost internally');

assert(has('poland_events_2026_02.ambassador_crisis_2026', 'ambassador_committee') &&
  has('poland_events_2026_02.ambassador_crisis_stozek_2026', 'ambassador_committee'),
  'Both ambassador openings must offer the committee route');
const committeeGate = scene('poland_events_2026_02.ambassador_committee');
assert(/gaza_chain_stage/.test(committeeGate.viewIf.logicSource) &&
  /gaza_stance_score/.test(committeeGate.viewIf.logicSource),
  'The committee inquiry must stay gated on the completed Gaza record');
const committee = apply('poland_events_2026_02.ambassador_committee', ambassadorBase(3));
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

const punitive = apply('poland_events_2027_04.sikorski_black_march_2027',
  repealBase('Decisive removal and civil damages'));
const solidarity = apply('poland_events_2027_04.sikorski_black_march_2027',
  repealBase('Solidarity with the blockade campaign'));
const noRecord = apply('poland_events_2027_04.sikorski_black_march_2027', (function() {
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

const blockadePunitive = apply('poland_events_2027_04.sikorski_black_blockade_2027',
  Object.assign(repealBase(''), {
    sikorski_protest_law_precedent: 1,
    sikorski_protest_movement_ally: 0,
    workers_support: 50,
    party_unity: 50,
  }));
const blockadeClean = apply('poland_events_2027_04.sikorski_black_blockade_2027',
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
const socialFloor = scene('poland_events_2026_05.safe_veto_social_floor');
assert(/pension_defence_credit/.test(socialFloor.viewIf.logicSource),
  'The SAFE social-floor route must stay gated on the 2023 referendum answer');
assert(has('poland_events_2026_05.safe_financing_veto_2026', 'safe_veto_social_floor'),
  'The SAFE veto event must offer the social-floor route');
const floorDeal = apply('poland_events_2026_05.safe_veto_social_floor', {
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

// 7. The December answer to the hundred konkrety is read on the hundredth day.
const fakeEngine = { random: { uint32: function() { return 2147483648; } } };
function applyIn(id, Q) {
  (scene(id).onArrival || []).forEach(function(action) {
    action.call(fakeEngine, fakeEngine, Q);
  });
  return Q;
}
function konkretyBase() {
  return {
    konkrety_stage: 0, konkrety_line: 'No position on the hundred konkrety',
    konkrety_answer: '', konkrety_ownership: 0, konkrety_receipts: 0,
    konkrety_scoreboard: 0, konkrety_left_items: 0, konkrety_left_credit: 0,
    konkrety_kwota_wolna: 'Undecided', konkrety_blame: '',
    konkrety_delivered: 0, konkrety_audit_response: '',
    public_media_transition: 'PiS-controlled public broadcasting',
    kpo_bill_quality: 0, abortion_delay_months: 0, abortion_cabinet_deadline: 0,
    government_coalition_dissent: 20, psl_relation: 45, psl_coalition_dissent: 10,
    ko_relation: 55, p2050_relation: 45, resources: 3, left_in_government: 1,
    left_holds_marshal: 0, razem_in_left: 1, movement_autonomy: 47,
    progressive_credibility: 30, progressives_dissent: 14, coalition_blur: 8,
    public_trust: 50, institutional_trust: 40, media_capacity: 30,
    parliament_visibility: 30, negotiation_capital: 0, government_delivery: 40,
    feminist_trust: 50, party_unity: 60, issue_ownership: 30,
    left_poll_momentum: 0, ko_poll_momentum: 0, local_network: 30,
    turnout_readiness: 40, left_poll: 12, pension_defence_credit: 0,
    public_mood_pending_social_spending_salience: 0,
    public_mood_pending_social_spending_support: 0,
  };
}
function throughDecember(choiceId) {
  const Q = applyIn('poland_events_2023_12.konkrety_programme_2023',
    konkretyBase());
  return applyIn('poland_events_2023_12.' + choiceId, Q);
}

// The written annex is the gate on both later evidence routes.
const annexed = throughDecember('konkrety_annex');
const konkretyRefused = throughDecember('konkrety_refuse');
assert.strictEqual(annexed.konkrety_receipts, 1);
assert.strictEqual(konkretyRefused.konkrety_receipts, 0);
assert(/konkrety_receipts/.test(
  scene('poland_events_2024_01.fifty_ledger').chooseIf.logicSource),
'Publishing the annex in January must stay gated on having written one');
assert(/konkrety_receipts|konkrety_scoreboard/.test(
  scene('poland_events_2024_03.days_counter').chooseIf.logicSource),
'The hundred-day counter-audit must stay gated on a written record');

// Selling the signature writes a cabinet deadline that February already reads.
const priced = throughDecember('konkrety_price');
assert.strictEqual(priced.abortion_cabinet_deadline, 1,
  'The December price must minute an abortion deadline');
assert(
  fs.readFileSync(
    path.join(
      projectRoot,
      'source/scenes/poland_events/poland_events_2024_02.scene.dry'
    ),
    'utf8'
  ).includes('[? if abortion_cabinet_deadline = 1:'),
  'February\'s postponement must still read the cabinet deadline'
);

// The hundredth day aims KO's deflection at whoever the record exposes.
function hundredthDay(state) {
  return applyIn('poland_events_2024_03.konkrety_hundred_days_2024', state);
}
const konkretyRefusedDay = hundredthDay(konkretyRefused);
assert.strictEqual(konkretyRefusedDay.konkrety_blame, 'Lewica',
  'A public December refusal must make Lewica the named target');
assert(/konkrety_blame/.test(
  scene('poland_events_2024_03.days_confront').chooseIf.logicSource),
'The chamber confrontation must only open when the Prime Minister aimed at us');

const cosignedDay = hundredthDay(throughDecember('konkrety_cosign'));
assert.strictEqual(cosignedDay.konkrety_blame, 'The whole coalition, us included',
  'Co-signing the list must put Lewica inside the failure rather than beside it');
assert(cosignedDay.konkrety_delivered > konkretyRefusedDay.konkrety_delivered,
  'Adopting and staffing the programme must deliver more konkrety than refusing it');

const annexedDay = hundredthDay(annexed);
assert(annexedDay.konkrety_left_credit > konkretyRefusedDay.konkrety_left_credit,
  'The annex must convert into provable Left credit on the hundredth day');

// A published table removes the deflection entirely.
const scoreboardDay = hundredthDay((function() {
  const Q = throughDecember('konkrety_annex');
  return applyIn('poland_events_2024_01.fifty_scoreboard', Q);
})());
assert.strictEqual(scoreboardDay.konkrety_blame, 'The published table');
assert(scoreboardDay.konkrety_delivered > annexedDay.konkrety_delivered,
  'A monthly scoreboard must close konkrety rather than only describe them');

// April reads March: the same party, three weeks later, on a different ballot.
function aprilSeats(response) {
  const Q = hundredthDay(throughDecember('konkrety_annex'));
  Q.konkrety_audit_response = response;
  applyIn('poland_events_2024_04.local_election_2024', Q);
  return Q.local_election_seats;
}
const separateSeats = aprilSeats('Separate campaign');
const defendedSeats = aprilSeats('Defended the count');
assert(separateSeats > defendedSeats,
  'Campaigning on our own items must beat defending KO\'s count: ' +
  separateSeats + ' vs ' + defendedSeats);

// 8. The KPO chain reads itself. February 2024 decides who owns the file and
// who is owed an argument; those two records are still being charged for at
// the December budget table, in the October review, in the April 2026 division
// list and at the August deadline.
function kpoChainBase(overrides) {
  return Object.assign({
    year: 2024, month: 2, continuous_campaign: 1,
    left_in_government: 1, government_party: 'ko', prime_minister: 'Donald Tusk',
    ko_leader: 'Donald Tusk', psl_leader: 'Władysław Kosiniak-Kamysz',
    p2050_leader: 'Szymon Hołownia', razem_leader: 'Adrian Zandberg',
    finance_minister: 'Andrzej Domański', finance_minister_party: 'KO',
    economy_minister: 'Katarzyna Pełczyńska-Nałęcz', labor_minister: 'Agnieszka Dziemianowicz-Bąk',
    ministry_ko_in_cabinet: 1, ministry_psl_in_cabinet: 1, ministry_p2050_in_cabinet: 1,
    ko_seats: 157, psl_seats: 32, p2050_seats: 33, pis_seats: 194, konf_seats: 18,
    resources: 3, budget: 3, public_trust: 45, media_capacity: 40,
    kpo_delivery: 8, kpo_milestones: 8, kpo_funds_available: 6, kpo_funds_spent: 0,
    kpo_public_credit: 0, kpo_deadline_pressure: 8, kpo_shortcut_debt: 0,
    kpo_funds_delayed: 0, kpo_scrutiny: 0, government_coalition_dissent: 20,
    ko_relation: 45, psl_relation: 40, p2050_relation: 40, pis_relation: 8,
    razem_dissent: 30, labor_credibility: 40, local_network: 30,
    government_delivery: 35, fiscal_stress: 20, public_sector_support: 40,
    judicial_legitimacy: 35, government_procedural_restraint: 45, legal_dualism: 50,
  }, overrides || {});
}

function throughFebruary2024(route, overrides) {
  const Q = kpoChainBase(overrides);
  apply('poland_kpo_2024_2026.kpo_payment_dossier_2024', Q);
  if (route) apply('poland_kpo_2024_2026.' + route, Q);
  return Q;
}

const ledgerFiled = throughFebruary2024('dossier_public_ledger');
const annexRaid = throughFebruary2024('dossier_left_earmarks');
assert.strictEqual(ledgerFiled.kpo_ledger_public, 1,
  'The February ledger must persist as a readable record');
assert.strictEqual(annexRaid.kpo_ledger_public, 0,
  'Claiming the annexes must not also publish a common ledger');
assert.strictEqual(annexRaid.kpo_grudge_active, 1,
  'A raid on the social annexes must leave a named partner owed an argument');
assert.strictEqual(annexRaid.kpo_grudge_code, 'ko',
  'The grudge must name the live senior partner, not a hardcoded party');
assert.strictEqual(ledgerFiled.kpo_grudge_active, 0,
  'A ledger every party signed cannot leave a partner owed an argument');

// The May scoreboard is a route, not a sentence: with no ledger there is
// nothing to put columns on.
const scoreboardGate = scene('poland_kpo_2024_2026.article7_shared_scoreboard');
assert(/kpo_ledger_public/.test(scoreboardGate.chooseIf.logicSource),
  'The Article 7 scoreboard must require February\'s ledger to exist');

// The opposition audit team is capacity that outlives its own month.
const auditTeam = throughFebruary2024('dossier_opposition_audit',
  {left_in_government: 0, resources: 1});
const questionsOnly = throughFebruary2024('dossier_opposition_record',
  {left_in_government: 0, resources: 1});
assert.strictEqual(auditTeam.kpo_opposition_file, 1,
  'A staffed February audit must leave a standing monitoring capacity');
assert.strictEqual(questionsOnly.kpo_opposition_file, 0,
  'Written questions must not leave a monitoring team behind them');
const dashboardGate = scene('poland_kpo_2024_2026.payment_opposition_dashboard');
assert(/kpo_opposition_file/.test(dashboardGate.chooseIf.logicSource),
  'The April dashboard must open on the February team as well as on resources');
function dashboardResourceCost(state) {
  const Q = Object.assign(state, {month: 4, resources: 2});
  apply('poland_kpo_2024_2026.payment_opposition_dashboard', Q);
  return 2 - Q.resources;
}
assert.strictEqual(dashboardResourceCost(auditTeam), 0,
  'A standing February team must make the April dashboard free to extend');
assert.strictEqual(dashboardResourceCost(questionsOnly), 1,
  'Without a team the dashboard must still be built and paid for');

// December 2024: the finance ministry is where an unpaid February is charged.
function december2024(state) {
  const Q = Object.assign(state, {year: 2024, month: 12});
  apply('poland_kpo_2024_2026.kpo_budget_gate_2024', Q);
  return Q;
}
const hostileTable = december2024(throughFebruary2024('dossier_left_earmarks'));
const settledTable = december2024(throughFebruary2024('dossier_public_ledger'));
assert.strictEqual(hostileTable.kpo_finance_hostile, 1,
  'A raided partner holding finance must still be charging for it in December');
assert.strictEqual(settledTable.kpo_finance_hostile, 0,
  'A signed common ledger must leave the budget table clean');
// The two February routes leave different totals behind them, so the December
// package is measured by what it adds rather than by where it lands.
function matchedPackageGain(table) {
  const before = {budget: table.budget, delivery: table.kpo_delivery};
  apply('poland_kpo_2024_2026.budget_gate_social', table);
  return {
    budget: table.budget - before.budget,
    delivery: table.kpo_delivery - before.delivery,
  };
}
const hostileMatch = matchedPackageGain(hostileTable);
const settledMatch = matchedPackageGain(settledTable);
assert(settledMatch.budget > hostileMatch.budget,
  'The same matched package must buy less through a hostile finance ministry');
assert(settledMatch.delivery > hostileMatch.delivery,
  'Ten days of ministry attrition must cost delivery, not only temper');

// A published ledger makes the paper route expensive rather than free.
function paperRouteCredit(route) {
  const table = december2024(throughFebruary2024(route));
  const before = table.kpo_public_credit;
  apply('poland_kpo_2024_2026.budget_gate_paper', table);
  return table.kpo_public_credit - before;
}
assert(paperRouteCredit('dossier_public_ledger') <
  paperRouteCredit('dossier_fast_claim'),
'Counting adoption as delivery must cost more where we published the dates');

// September 2025 is read by October 2025.
function midterm(horeca) {
  const Q = kpoChainBase({year: 2025, month: 10, horeca_response_2025: horeca});
  apply('poland_kpo_2024_2026.kpo_midterm_review_2025', Q);
  return Q;
}
const horecaControlled = midterm('Risk-based payment freeze');
const horecaCampaigned = midterm('KPO yacht campaign');
assert.strictEqual(horecaControlled.kpo_horeca_control, 1,
  'A September control mechanism must be visible to the October assessors');
assert.strictEqual(horecaCampaigned.kpo_horeca_control, 0,
  'A campaign is not a control system and must not score as one');
assert(horecaControlled.kpo_funds_available >= horecaCampaigned.kpo_funds_available,
  'Building the HoReCa control must never be worth less at the review');

// The reallocation is arithmetic with a ledger and an accusation without one.
function octoberReallocation(ledger) {
  const Q = kpoChainBase({
    year: 2025, month: 10, kpo_ledger_public: ledger,
    kpo_funds_available: 8, kpo_funds_spent: 2,
  });
  apply('poland_kpo_2024_2026.kpo_midterm_review_2025', Q);
  apply('poland_kpo_2024_2026.midterm_ready_projects', Q);
  return Q;
}
const evidencedMove = octoberReallocation(1);
const disputedMove = octoberReallocation(0);
assert(evidencedMove.government_coalition_dissent <
  disputedMove.government_coalition_dissent,
'Stripping a scheme against a published date must cost less coalition damage');
assert(evidencedMove.kpo_delivery > disputedMove.kpo_delivery,
  'A reallocation nobody can dispute must move more work');

// April 2026: an unpaid credit fight is collected in the division list.
function pipVote(grudge) {
  const Q = kpoChainBase({
    year: 2026, month: 4, labor_reform_settled: 0,
    government_has_confidence: 1, coalition_seats: 248,
    government_support_seats: 210, ministry_left_cabinet_seats: 26,
    left_committed_seats: 26, left_seats: 26, sejm_total: 460,
    senate_total: 100, senate_ko_seats: 43, senate_psl_seats: 3,
    senate_p2050_seats: 0, senate_left_seats: 2, senate_pis_seats: 48,
    senate_independent_seats: 4, president_name: 'Karol Nawrocki',
    president_relation: 20, government_coalition_dissent: 44,
    kpo_grudge_active: grudge, kpo_grudge_code: grudge ? 'ko' : '',
    kpo_grudge_name: grudge ? 'KO' : '', kpo_grudge_leader: grudge ? 'Donald Tusk' : '',
    kpo_grudge_reason: grudge ? 'the February 2024 raid on the social annexes' : '',
  });
  apply('poland_kpo_2024_2026.kpo_pip_milestone_2026', Q);
  return Q;
}
const whippedVote = pipVote(0);
const unwhippedVote = pipVote(1);
assert.strictEqual(unwhippedVote.pip_grudge_defections, 4,
  'An unpaid KPO credit fight must remove votes from the PIP division list');
assert(unwhippedVote.pip_sejm_yes < whippedVote.pip_sejm_yes,
  'Those missing deputies must show up in the count, not only in the prose');

// July 2026: two and a half years of record decide what an audit can confirm.
function finalWindow(ledger, route) {
  const Q = kpoChainBase({
    year: 2026, month: 7, kpo_ledger_public: ledger,
    kpo_delivery: 20, kpo_milestones: 18, kpo_shortcut_debt: 8,
    kpo_funds_available: 10, kpo_funds_spent: 4,
  });
  apply('poland_kpo_2024_2026.kpo_final_window_2026', Q);
  apply('poland_kpo_2024_2026.' + route, Q);
  return Q;
}
const auditedOnRecord = finalWindow(1, 'final_independent_audit');
const auditedFromMemory = finalWindow(0, 'final_independent_audit');
assert(auditedOnRecord.kpo_shortcut_debt < auditedFromMemory.kpo_shortcut_debt,
  'An audit against a published record must close more of the debt');
assert(auditedOnRecord.public_trust > auditedFromMemory.public_trust,
  'Verifying a story beats reconstructing one');
const closedOnRecord = finalWindow(1, 'final_paper_close');
const closedInSilence = finalWindow(0, 'final_paper_close');
assert(closedOnRecord.public_trust < closedInSilence.public_trust,
  'Certifying lines we published as late must cost more than certifying in silence');

console.log('chain-callback-check: all checks passed');
