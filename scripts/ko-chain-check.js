'use strict';
// KO consolidation / collapse chain check. Runs the whole path without the
// full smoke suite: npm run check:ko
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
const ui = new dendry.UserInterface();
ui.newPage = function() {};
const engine = new dendry.DendryEngine(ui, game);
let randomState = 0x505241;
Math.random = function() {
  randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
  return randomState / 0x100000000;
};

function choices() { return engine.getCurrentChoices() || []; }
function choose(id) {
  const list = choices();
  const index = list.findIndex(function(c) { return c.id === id; });
  assert(index >= 0, 'missing ' + id + ' in ' + engine.state.sceneId +
    ' :: ' + list.map(function(c) { return c.id; }).join(', '));
  assert(list[index].canChoose, 'unavailable ' + id);
  engine.choose(index);
}
function start(seed) {
  engine.beginGame([seed]);
  if (choices().some(function(c) { return c.id === 'root.campaign_game' && c.canChoose; })) {
    choose('root.campaign_game');
  } else { choose('root.new_game'); }
  choose('root.standard');
  choose('poland_intro.short_brief');
  choose('poland_hub');
  return engine.state.qualities;
}
function group(q, id) {
  return (q.rival_group_records || []).find(function(r) { return r.id === id; });
}
function flatten(node) {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flatten).join('');
  return flatten(node.content);
}
function pageText() {
  return flatten(engine.state.currentContent);
}

// 1. A cohesive convention produces one party and keeps the incumbent.
let q = start('ko-consolidate');
engine.goToScene('poland_events_2025.ko_consolidation_2025');
    engine.state.qualities.ko_leader = 'Donald Tusk';
assert.strictEqual(choices().length, 3, 'convention offers three stances');
q.ko_cohesion = 70;
q.ko_poll = 26;
choose('poland_events_2025.ko_consolidation_back');
    choose('poland_events_2025.ko_consolidation_result');
assert.strictEqual(engine.state.sceneId, 'poland_events_2025.ko_consolidation_result');
assert.strictEqual(q.ko_merger_result, 'One registered KO party');
assert.strictEqual(q.ko_consolidated, 1);
assert.strictEqual(q.ko_leader, 'Donald Tusk');
assert.strictEqual(q.ko_leader_changed, 0);
assert.strictEqual(group(q, 'ko_party').active, 1);
['nowoczesna', 'ipl', 'po'].forEach(function(id) {
  const c = group(q, id);
  assert.strictEqual(c.kind, 'current');
  assert.strictEqual(c.parent, 'Koalicja Obywatelska');
  assert.strictEqual(c.exclusive_seats, 0);
});
assert.strictEqual(group(q, 'greens').legal_status, 'allied separate party');

// 2. A weak convention replaces the leader and records a shock.
q = start('ko-succession');
engine.goToScene('poland_events_2025.ko_consolidation_2025');
    engine.state.qualities.ko_leader = 'Donald Tusk';
q.ko_cohesion = 42;
q.ko_poll = 18;
q.ko_social_liberal_share = 30;
q.ko_classical_liberal_share = 70;
choose('poland_events_2025.ko_consolidation_abstain');
    choose('poland_events_2025.ko_consolidation_result');
assert.strictEqual(q.ko_merger_result, 'Convention adjourned without a decision');
assert.strictEqual(q.ko_convention_failed, 1);
assert.strictEqual(q.ko_leader_changed, 1);
assert.notStrictEqual(q.ko_leader, 'Donald Tusk');
assert(q.ko_collapse_shock >= 22, 'shock recorded: ' + q.ko_collapse_shock);

// 3. A broken convention drives the pressure meter over the collapse line.
q = start('ko-broken');
engine.goToScene('poland_events_2025.ko_consolidation_2025');
    engine.state.qualities.ko_leader = 'Donald Tusk';
q.ko_cohesion = 20;
q.ko_poll = 20;
q.ko_coalition_dissent = 30;
choose('poland_events_2025.ko_consolidation_abstain');
    choose('poland_events_2025.ko_consolidation_result');
assert.strictEqual(q.ko_merger_result, 'The convention broke up');
engine.goToScene('poland_normalize');
console.log('  pressure after broken convention:', q.ko_collapse_pressure,
  '(collapse fires at 68)');
assert(q.ko_collapse_pressure >= 68, 'broken convention must reach collapse');

// 4. The open door moves mandates.
q = start('ko-open-door');
const koBefore = q.ko_seats;
const leftBefore = q.left_seats;
engine.goToScene('poland_events_2025.ko_consolidation_2025');
    engine.state.qualities.ko_leader = 'Donald Tusk';
q.ko_cohesion = 50;
choose('poland_events_2025.ko_consolidation_open_door');
    choose('poland_events_2025.ko_consolidation_result');
assert(q.ko_individual_defectors > 0);
assert.strictEqual(q.ko_seats, koBefore - q.ko_individual_defectors);
assert.strictEqual(q.left_seats, leftBefore + q.ko_individual_defectors);

// 5. Collapse: the losing wing leaves, seats reconcile, splinter is real.
q = start('ko-collapse');
const koBeforeSplit = q.ko_seats;
q.ko_social_liberal_share = 70;
q.ko_classical_liberal_share = 30;
q.ko_collapse_pressure = 80;
engine.goToScene('poland_ko_collapse.ko_collapse');
assert.strictEqual(q.ko_break_wing, 'Classical-liberal');
assert(q.ko_break_size > 0);
assert(!choices().some(function(c) { return c.id === 'poland_ko_collapse.ko_collapse_shelter'; }),
  'a liberal wing cannot be sheltered by Lewica');
choose('poland_ko_collapse.ko_collapse_finish');
choose('poland_ko_collapse.ko_collapse_result');
assert.strictEqual(q.ko_collapsed, 1);
assert.strictEqual(q.ko_splinter_active, 1);
assert.strictEqual(q.ko_seats + q.ko_splinter_seats, koBeforeSplit);
assert.strictEqual(group(q, 'ko_splinter').active, 1);
q.month += 1;
q.date_label = 'November 2019';
engine.goToScene('poland_polling');
assert(q.ko_splinter_poll > 0, 'KO breakaway received no polling share');
assert(q.ko_fracture_poll_loss > 0,
  'KO collapse did not leak any support outside the broken family');
assert(q.left_vote_intent > q.ko_vote_intent,
  'a strong Left did not overtake the KO rump: ' + JSON.stringify({
    left: q.left_vote_intent,
    ko: q.ko_vote_intent,
    splinter: q.ko_splinter_vote_intent,
    lost: q.ko_fracture_poll_loss,
  }));
engine.goToScene('status.polls');
const pollingLedger = pageText();
assert(
  pollingLedger.includes(q.ko_splinter_name) &&
    pollingLedger.includes(String(q.status_ko_splinter_poll) + '%'),
  'KO breakaway is missing from the polling ledger'
);
engine.goToScene('library.polling');
assert(
  pageText().includes(q.ko_splinter_name),
  'KO breakaway is missing from the dossier poll tracker'
);
engine.goToScene('poland_normalize');
assert.strictEqual(q.ko_collapse_pressure, 0);

// 6. Shelter + settlement: mandates move once, and only once.
q = start('ko-shelter');
const leftBeforeShelter = q.left_seats;
q.ko_social_liberal_share = 30;
q.ko_classical_liberal_share = 70;
q.ko_collapse_pressure = 80;
assert.strictEqual(q.snap_progressive_ko_candidate, 'Barbara Nowacka');
engine.goToScene('poland_ko_collapse.ko_collapse');
assert.strictEqual(q.ko_break_wing, 'Progressive');
choose('poland_ko_collapse.ko_collapse_shelter');
choose('poland_ko_collapse.ko_collapse_result');
assert(q.ko_collapse_defectors > 0);
assert.strictEqual(q.ko_splinter_name, 'Inicjatywa Polska');
assert.strictEqual(q.snap_progressive_ko_candidate, 'Monika Rosa');
engine.goToScene('poland_normalize');
assert.strictEqual(group(q, 'ko_splinter').active, 0);
assert.strictEqual(group(q, 'ipl').active, 1);
assert.strictEqual(group(q, 'ipl').name, 'Inicjatywa Polska');
assert.strictEqual(group(q, 'ipl').leader, 'Barbara Nowacka');
assert.strictEqual(group(q, 'ipl').list_committee, 'ko_splinter');
assert.strictEqual(group(q, 'ipl').exclusive_seats, q.ko_splinter_seats);
assert(q.independent_bucket_members.includes('Inicjatywa Polska'));
assert(!q.independent_bucket_members.includes('Progressive KO splinter'));
assert.strictEqual(q.left_seats, leftBeforeShelter + q.ko_collapse_defectors);
const splinterSeats = q.ko_splinter_seats;
const leftBeforeSettlement = q.left_seats;
q.left_poll = 14;
engine.goToScene('poland_ko_collapse.ko_splinter_settlement');
choose('poland_ko_collapse.ko_splinter_list');
assert.strictEqual(q.ko_splinter_settled, 1);
assert.strictEqual(q.ko_splinter_active, 0);
assert.strictEqual(q.ko_splinter_seats, 0);
engine.goToScene('poland_normalize');
assert.strictEqual(q.ipl_joined_left, 1);
assert.strictEqual(group(q, 'ipl').kind, 'current');
assert.strictEqual(group(q, 'ipl').bloc, 'left');
assert.strictEqual(q.snap_progressive_ko_candidate, 'Monika Rosa');
assert.strictEqual(q.left_seats, leftBeforeSettlement + splinterSeats);
q.ko_relation = 60;
q.president_name = q.ko_leader;
q.government_has_confidence = 0;
engine.goToScene('poland_events_2026.snap_formation_attempt_two');
assert.strictEqual(q.snap_formation_candidate, 'Monika Rosa');
engine.goToScene('poland_events_2026.snap_sejm_nowacka');
assert.strictEqual(q.snap_dem_candidate, 'Monika Rosa');

// 7. Ignoring a breakaway with a warm KO sends it home.
q = start('ko-reabsorb');
q.ko_collapse_pressure = 80;
engine.goToScene('poland_ko_collapse.ko_collapse');
choose('poland_ko_collapse.ko_collapse_ground');
choose('poland_ko_collapse.ko_collapse_result');
const rumpSeats = q.ko_seats;
const strandedSeats = q.ko_splinter_seats;
q.ko_relation = 60;
engine.goToScene('poland_ko_collapse.ko_splinter_settlement');
choose('poland_ko_collapse.ko_splinter_ignore');
assert.strictEqual(q.ko_seats, rumpSeats + strandedSeats);
assert.strictEqual(q.ko_splinter_active, 0);
assert.strictEqual(group(q, 'ipl').active, 1);
assert.strictEqual(group(q, 'ipl').list_committee, 'ko');
assert.strictEqual(group(q, 'ko_splinter').active, 0);
engine.goToScene('poland_normalize');
assert.strictEqual(q.snap_progressive_ko_candidate, 'Barbara Nowacka');

// 8. The April 2026 channel event exists for both a live and a split KO.
q = start('ko-2026-live');
engine.goToScene('poland_events_2026.ko_leadership_2026');
assert(choices().length >= 3);
q = start('ko-2026-split');
q.ko_collapsed = 1;
engine.goToScene('poland_ko_collapse.ko_after_collapse_channels');
assert.strictEqual(choices().length, 3);

// 9. A functioning KO never trips the collapse line.
q = start('ko-healthy');
engine.goToScene('poland_normalize');
console.log('  baseline pressure:', q.ko_collapse_pressure);
assert(q.ko_collapse_pressure < 68, 'healthy KO must not collapse');
q.ko_leader = 'Donald Tusk';
q.year = 2026;
q.government_party = 'ko';
q.government_has_confidence = 1;
q.ko_poll = 26;
q.ko_coalition_dissent = 25;
engine.goToScene('poland_normalize');
console.log('  governing-KO pressure:', q.ko_collapse_pressure);
assert(q.ko_collapse_pressure < 68, 'a governing KO under normal strain holds');

// 10. Consolidation buys KO durability against the same failures.
q = start('ko-durability');
q.ko_coalition_dissent = 45;
q.ko_poll = 19;
q.ko_cohesion = 50;
engine.goToScene('poland_normalize');
const looseP = q.ko_collapse_pressure;
q.ko_consolidated = 1;
engine.goToScene('poland_normalize');
console.log('  pressure loose/consolidated:', looseP, q.ko_collapse_pressure);
assert(q.ko_collapse_pressure < looseP);

// 11. The classical-liberal walkout registers a party rather than a wing name.
q = start('ko-nowa-platforma');
q.continuous_campaign = 1;
q.year = 2026;
q.month = 6;
q.ko_collapse_pressure = 80;
q.ko_social_liberal_share = 62;
q.ko_classical_liberal_share = 38;
engine.goToScene('poland_ko_collapse.ko_collapse');
assert.strictEqual(q.ko_break_wing, 'Classical-liberal');
choose('poland_ko_collapse.ko_collapse_ground');
choose('poland_ko_collapse.ko_collapse_result');
assert.strictEqual(q.ko_splinter_name, 'Nowa Platforma');
assert.strictEqual(q.ko_splinter_class, 'party-np');
assert.strictEqual(group(q, 'ko_splinter').name, 'Nowa Platforma');
assert.strictEqual(
  group(q, 'ko_splinter').legal_status,
  'registered party re-founding Platforma Obywatelska'
);
// The name and colour must survive the monthly normalise pass.
engine.goToScene('poland_normalize');
assert.strictEqual(q.ko_splinter_name, 'Nowa Platforma');
assert.strictEqual(q.ko_splinter_class, 'party-np');
assert(fs.existsSync(path.join(root, 'out/html/img/partylogo/np.png')),
  'Nowa Platforma badge asset is missing');
console.log('  breakaway:', q.ko_splinter_name, '·', q.ko_break_leader,
  '·', q.ko_splinter_seats, 'MPs');

// 12. The 2020 first round: KO missing the runoff ends its hegemony for good.
function play2020Miss(seed, koShare) {
  const q = start(seed);
  q.pres_ko_joint_candidate = 0;
  q.pres_2020_ko_kidawa = 1;
  q.pres_2020_ko_name = 'Małgorzata Kidawa-Błońska';
  q.pres_first_round_complete = 0;
  q.pres_first_calc_mode = 'first_result';
  // Force the count: PiS and Hołownia take the runoff places, KO takes the
  // share this case is testing.
  q.pis_vote_intent = 43.6;
  q.ko_vote_intent = 27.4;
  q.pres_bonus_holownia = 20;
  q.pres_bonus_trzaskowski = koShare - 8.4;
  engine.goToScene('poland_presidential_election.calculate_first');
  return q;
}

let missed = play2020Miss('ko-2020-humiliation', 8.4);
assert.strictEqual(missed.ko_2020_runoff_miss, 1,
  'KO reached the runoff in a run designed to keep it out: ' +
  missed.pres_r1_leader_key + '/' + missed.pres_r1_runner_key);
assert.strictEqual(missed.ko_hegemony_broken, 1);
assert(missed.ko_2020_humiliation >= 14);
assert(missed.ko_coalition_dissent > 0);
assert(missed.ko_cohesion < 62, 'cohesion untouched: ' + missed.ko_cohesion);
console.log('  2020 miss:', missed.ko_2020_r1_share + '%',
  '·', missed.ko_2020_miss_band, '· humiliation', missed.ko_2020_humiliation);

// The broken hegemony must survive a normalise pass and raise KO's structural
// collapse pressure rather than decaying with the monthly shock.
const pressureBroken = (function() {
  engine.goToScene('poland_normalize');
  const broken = missed.ko_collapse_pressure;
  missed.ko_collapse_shock = 0;
  missed.ko_hegemony_broken = 0;
  engine.goToScene('poland_normalize');
  const intact = missed.ko_collapse_pressure;
  missed.ko_hegemony_broken = 1;
  engine.goToScene('poland_normalize');
  return [broken, intact, missed.ko_collapse_pressure];
})();
assert(pressureBroken[2] > pressureBroken[1],
  'a broken hegemony must permanently raise KO collapse pressure: ' +
  pressureBroken.join('/'));
assert.notStrictEqual(missed.ko_condition_label, 'in working order',
  'the ledger still calls a KO that missed the runoff healthy');

// 13. Tactical desertion to KO is permanently capped once the claim is gone.
q = start('ko-2020-tactical');
q.electoral_viability = 20;
q.winner_reputation = 20;
q.list_confidence = 20;
q.issue_ownership = 20;
q.ko_leader = 'Donald Tusk';
for (let i = 0; i < 40; i += 1) engine.goToScene('poland_advance');
const tacticalIntact = q.tactical_desertion_to_ko;
q = start('ko-2020-tactical-broken');
q.electoral_viability = 20;
q.winner_reputation = 20;
q.list_confidence = 20;
q.issue_ownership = 20;
q.ko_leader = 'Donald Tusk';
q.ko_hegemony_broken = 1;
for (let i = 0; i < 40; i += 1) engine.goToScene('poland_advance');
console.log('  tactical desertion intact/broken:',
  tacticalIntact.toFixed(2), q.tactical_desertion_to_ko.toFixed(2));
assert(q.tactical_desertion_to_ko < tacticalIntact * 0.6,
  'KO keeps its tactical squeeze after losing the runoff claim');

// 14. An annihilating result breaks the Civic Coalition itself, and only the
// recruitment line converts the orphans into Left mandates.
q = start('ko-2020-alliance');
q.ko_2020_runoff_miss = 1;
q.ko_2020_r1_share = 6.1;
q.ko_2020_miss_band = 'Annihilation';
q.ko_2020_humiliation = 56;
q.ko_hegemony_broken = 1;
q.pres_r1_leader_name = 'Andrzej Duda';
q.pres_r1_runner_name = 'Szymon Hołownia';
const koSeatsBefore2020 = q.ko_seats;
const leftSeatsBefore2020 = q.left_seats;
engine.goToScene('poland_presidential_election.ko_ballot_collapse');
assert.strictEqual(q.ko_2020_alliance_broken, 1);
assert(q.ko_2020_alliance_leavers > 0);
assert.strictEqual(q.ko_seats, koSeatsBefore2020 - q.ko_2020_alliance_leavers);
// All three junior parties leave: the committee is gone, not reshaped.
['nowoczesna', 'ipl', 'greens'].forEach(function(id) {
  assert.strictEqual(group(q, id).list_committee, id,
    id + ' stayed inside a committee that no longer exists');
  assert.strictEqual(group(q, id).allied, 0);
});
assert.strictEqual(group(q, 'ko_party').active, 0);
assert.strictEqual(group(q, 'po').parent, 'Platforma Obywatelska');
choose('poland_presidential_election.ko_collapse_2020_absorb');
choose('poland_presidential_election.ko_collapse_2020_result');
assert.strictEqual(q.ipl_joined_left, 1);
assert.strictEqual(q.greens_joined_left, 1);
// Only the progressive parties are recruitable; Nowoczesna stays outside.
assert(q.ko_2020_alliance_recruits > 0);
assert(q.ko_2020_alliance_recruits < q.ko_2020_alliance_leavers,
  'Nowoczesna was absorbed into the Left along with the progressives');
assert.strictEqual(q.left_seats,
  leftSeatsBefore2020 + q.ko_2020_alliance_recruits);
engine.goToScene('poland_normalize');
assert.strictEqual(group(q, 'ipl').bloc, 'left');
console.log('  alliance break:', q.ko_2020_crisis_result);

// The other two lines leave the orphans independent rather than taking them.
q = start('ko-2020-alliance-refused');
q.ko_2020_runoff_miss = 1;
q.ko_2020_r1_share = 5.4;
q.ko_2020_miss_band = 'Annihilation';
q.ko_2020_humiliation = 58;
q.ko_hegemony_broken = 1;
const leftSeatsRefused = q.left_seats;
engine.goToScene('poland_presidential_election.ko_ballot_collapse');
choose('poland_presidential_election.ko_collapse_2020_inherit');
choose('poland_presidential_election.ko_collapse_2020_result');
assert.strictEqual(q.ko_2020_alliance_recruits, 0);
assert.strictEqual(q.ipl_joined_left, 0);
assert.strictEqual(q.left_seats, leftSeatsRefused);
engine.goToScene('poland_normalize');
assert(q.independent_bucket_members.includes('Inicjatywa Polska'),
  'orphaned IPL never reached the independent bucket: ' +
  q.independent_bucket_members);

// 15. The defeat is still being paid for years later.
q = start('ko-2020-long-tail');
q.continuous_campaign = 1;
q.year = 2021;
q.month = 7;
q.ko_hegemony_broken = 1;
q.ko_2020_humiliation = 46;
q.ko_2020_r1_share = 8.4;
q.ko_poll = 20;
engine.goToScene('poland_leadership_events.tusk_return_2021');
assert.strictEqual(q.ko_alternative_2021_outcome, 'Donald Tusk returns');
assert(q.ko_poll_momentum < 1.5,
  'the founder still bought a full return bonus: ' + q.ko_poll_momentum);
assert(pageText().includes('8.4%'),
  'Tusk\'s return does not mention the result that cost him the argument');
q.year = 2025;
q.month = 10;
q.ko_collapsed = 0;
engine.goToScene('poland_events_2025.ko_consolidation_2025');
assert(pageText().includes('8.4%'),
  'KO\'s 2025 convention has forgotten 2020');
q.ko_collapse_pressure = 80;
q.ko_convention_failed = 0;
q.ko_poll = 22;
q.ko_coalition_dissent = 20;
engine.goToScene('poland_ko_collapse.ko_collapse');
assert.strictEqual(q.ko_collapse_cause, 'hegemony_2020');
assert(pageText().includes('8.4%'),
  'the eventual KO split does not name the defeat that caused it');

console.log('KO chain checks passed');
