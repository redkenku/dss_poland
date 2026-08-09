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
  choose('poland_hub');
  return engine.state.qualities;
}
function group(q, id) {
  return (q.rival_group_records || []).find(function(r) { return r.id === id; });
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

console.log('KO chain checks passed');
