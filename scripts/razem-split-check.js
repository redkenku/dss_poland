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
const json = fs.readFileSync(path.join(projectRoot, 'out', 'game.json'), 'utf8');

let game;
dendry.convertJSONToGame(json, function(error, converted) {
  if (error) throw error;
  game = converted;
});

const cooperativePoliticians = [
  'biejat_party',
  'gosek_popiolek_party',
  'olko_party',
  'wicha_party',
  'stozek_party',
];

function newGame(seed) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([seed]);
  const choose = function(id) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(choice) { return choice.id === id; });
    assert(index >= 0, 'Missing choice ' + id);
    assert(choices[index].canChoose, 'Unavailable choice ' + id);
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  return { engine: engine, choose: choose, Q: engine.state.qualities };
}

function snapshot(Q) {
  return {
    leftSeats: Q.left_seats,
    partySeats: Q.razem_party_seats,
    razemSeats: Q.razem_seats,
    nowaSeats: Q.nowa_lewica_seats,
    cooperativeSeats: Q.left_cooperative_independent_seats,
    progressivesStrength: Q.progressives_strength,
    razemStrength: Q.razem_strength,
  };
}

function chooseOutcome(id) {
  const ctx = newGame(id);
  ctx.Q.resources = 6;
  ctx.Q.razem_cooperation = 60;
  ctx.Q.party_unity = 60;
  ctx.before = snapshot(ctx.Q);
  ctx.engine.goToScene('poland_events_2023_2024.razem_split_2024');
  ctx.choose('poland_events_2023_2024.' + id);
  return ctx;
}

function assertClose(actual, expected, message) {
  assert(Math.abs(actual - expected) < 1e-7,
    message + ': expected ' + expected + ', got ' + actual);
}

function assertFamilyConserved(ctx) {
  const Q = ctx.Q;
  const before = ctx.before;
  assert.strictEqual(Q.left_seats + Q.razem_party_seats,
    before.leftSeats + before.partySeats, 'Left-family Sejm seats');
  assertClose(Q.progressives_strength + Q.razem_exit_strength,
    before.progressivesStrength + before.razemStrength,
    'Razem/progressive strength');
  assert.strictEqual(Q.left_seats,
    Q.nowa_lewica_seats + Q.razem_seats + Q.left_pps_seats +
      Q.left_cooperative_independent_seats,
    'Left club components');
}

function assertAffiliations(Q, organisation) {
  cooperativePoliticians.forEach(function(quality) {
    assert.strictEqual(Q[quality], organisation, quality);
  });
}

// Foundation: both chairs are initialised and visible, while the primary-chair
// quality remains the legacy assignment point.
{
  const ctx = newGame('dual-chair-foundation');
  assert.strictEqual(ctx.Q.razem_leader, 'Adrian Zandberg');
  assert.strictEqual(ctx.Q.razem_co_leader, 'Magdalena Biejat');
  ctx.engine.goToScene('status');
  assert.strictEqual(ctx.Q.status_razem_leader, 'Adrian Zandberg');
  assert.strictEqual(ctx.Q.status_razem_co_leader, 'Magdalena Biejat');
}

// A Razem-led merger carries both offices into the leadership of the whole Left.
{
  const ctx = newGame('dual-chair-merger');
  ctx.Q.razem_can_lead_merger = 1;
  ctx.Q.merger_razem_present = 1;
  ctx.engine.goToScene('poland_merger_events.merger_all');
  assert.strictEqual(ctx.Q.left_constitution, 'razem_dual_chairs');
  assert(ctx.Q.left_leader.includes('Adrian Zandberg'));
  assert(ctx.Q.left_leader.includes('Magdalena Biejat'));
}

// Historical separation: four Sejm MPs stay with Biejat, while the other five
// Razem seats and the conserved organisational share create the outside party.
{
  const ctx = chooseOutcome('razem_historical');
  const Q = ctx.Q;
  assert.strictEqual(Q.razem_split_outcome, 'historical');
  assert.strictEqual(Q.razem_party_formed, 1);
  assert.strictEqual(Q.razem_party_seats, ctx.before.razemSeats - 4);
  assert.strictEqual(Q.left_cooperative_independent_seats,
    ctx.before.cooperativeSeats + 4);
  assert.strictEqual(Q.wspolne_jutro_formed, 1);
  assert.strictEqual(Q.progressives_name, 'Wspólne Jutro');
  assert.strictEqual(Q.progressives_leader, 'Magdalena Biejat');
  assert.strictEqual(Q.razem_leader, 'Adrian Zandberg');
  assert.strictEqual(Q.razem_co_leader, 'Vacant');
  assertAffiliations(Q, 'Wspólne Jutro');
  assertFamilyConserved(ctx);

  ctx.engine.goToScene('poland_normalize');
  assert.strictEqual(Q.progressives_name, 'Wspólne Jutro');
  assert(!Q.caucus_ids.includes('wspolne_jutro'),
    'Wspólne Jutro must reuse the progressive current');

  ctx.engine.goToScene('poland_party_ai');
  assert.strictEqual(Q.razem_ai_active, 1, 'independent Razem enters party AI');
  ctx.engine.goToScene('poland_events_2023_2024.august_lists');
  const razemList = ctx.engine.getCurrentChoices().find(function(choice) {
    return choice.id === 'poland_events_2023_2024.list_target_razem_host';
  });
  assert(razemList && razemList.canChoose,
    'independent Razem enters list bargaining');

  Q.razem_exit_strength = 200;
  Q.poll_state_month_key = -1;
  ctx.engine.goToScene('poland_polling');
  assert(Q.razem_poll >= 5, 'Razem can clear its party threshold');
  assert(Q.razem_projected_seats > 0, 'Razem enters seat projection');
}

// The signed protocol is a persistent protection, not a one-scene postponement.
{
  const ctx = chooseOutcome('razem_protocol');
  const Q = ctx.Q;
  assert.strictEqual(Q.razem_split_outcome, 'protocol');
  assert.strictEqual(Q.razem_split, 0);
  assert.strictEqual(Q.razem_cooperation_protocol, 1);
  assert.strictEqual(Q.razem_breakaway_protected, 1);
  assert.strictEqual(Q.razem_party_formed, 0);
  assert.strictEqual(Q.razem_leader, 'Adrian Zandberg');
  assert.strictEqual(Q.razem_co_leader, 'Magdalena Biejat');
  assertAffiliations(Q, 'Razem');
  assert.deepStrictEqual(snapshot(Q), ctx.before,
    'the prevented split must not move seats or faction strength');
  Q.razem_dissent = 100;
  Q.razem_cooperation = 0;
  ctx.engine.goToScene('poland_normalize');
  assert.strictEqual(Q.razem_breakaway_protected, 1,
    'the binding protocol survives ordinary dissent normalization');
}

// Absorption moves the four Sejm MPs into the existing main party and leaves
// no parallel cooperative organisation behind.
{
  const ctx = chooseOutcome('razem_absorb');
  const Q = ctx.Q;
  const host = Q.biejat_party;
  assert.strictEqual(Q.razem_split_outcome, 'absorbed');
  assert.strictEqual(Q.razem_party_formed, 1);
  assert.strictEqual(Q.razem_party_seats, ctx.before.razemSeats - 4);
  assert.strictEqual(Q.nowa_lewica_seats, ctx.before.nowaSeats + 4);
  assert.strictEqual(Q.left_cooperative_independent_seats,
    ctx.before.cooperativeSeats);
  assert.strictEqual(Q.wspolne_jutro_formed, 0);
  assert.notStrictEqual(host, 'Razem');
  assert.notStrictEqual(host, 'Wspólne Jutro');
  assertAffiliations(Q, host);
  assert.strictEqual(Q.razem_co_leader, 'Vacant');
  assertFamilyConserved(ctx);
}

console.log('Razem split checks passed');
