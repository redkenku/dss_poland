'use strict';

// Focused Stage 5 check: every Stage 4 entry contract, rival disposition,
// all three doctrines, the repeatable card and the 2027 electoral endpoint.

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

function start(seed) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([seed]);
  const choose = function(id) {
    const choices = engine.getCurrentChoices() || [];
    const index = choices.findIndex(function(choice) { return choice.id === id; });
    assert(index >= 0, 'Missing ' + id + ' in ' + engine.state.sceneId +
      ': ' + choices.map(function(choice) { return choice.id; }).join(', '));
    assert(choices[index].canChoose, 'Unavailable ' + id);
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  return { engine: engine, choose: choose, Q: engine.state.qualities };
}

function normalize(ctx) {
  ctx.engine.goToScene('poland_normalize');
}

function pendingEventIds(ctx) {
  return (ctx.engine._compileChoices(game.scenes['poland_event_queue.all_events']) || [])
    .map(function(choice) { return choice.id; });
}

function configureMachine(ctx, origin) {
  const Q = ctx.Q;
  Object.assign(Q, {
    continuous_campaign: 1,
    year: 2024,
    month: 6,
    time: 56,
    resources: 8,
    left_common_party_exists: 1,
    left_legal_vehicle: 'sld',
    left_merger_structure: 'unified_party',
    left_constitution: 'single_leadership',
    left_machine_controller: 'barons',
    left_mandate: 'executive',
    left_dominant_current: 'barons',
    barons_active: 1,
    barons_in_left: 1,
    barons_org_status: 'merged_current',
    barons_party_formed: 0,
    spring_path_stage: 0,
    spring_path_declined: 0,
    sld_partocracy_stage: 0,
    sld_partocracy_declined: 0,
    sld_populist_entry_done: 1,
    sld_populist_entry_pending: 0,
    sld_populist_route_active: 0,
    old_left_route_state: 'none',
    miller_restoration_done: 0,
    rename_displaced_leader: '',
  });
  if (origin === 'asset_led_executive') {
    Q.left_constitution = 'temporary_executive';
    Q.left_mandate = 'administrative';
    Q.left_merger_structure = 'partial_party';
  } else if (origin === 'machine_counter_coup') {
    Q.rename_displaced_leader = 'Robert Biedroń';
  } else if (origin === 'baron_ascendancy') {
    Q.left_constitution = 'single_leadership_protected_currents';
    Q.left_mandate = 'member_ballot';
  } else if (origin === 'miller_restoration') {
    Q.old_left_route_state = 'miller_restoration';
    Q.miller_restoration_done = 1;
    Q.advisor_slot_1_locked = 1;
    Q.sld_populist_entry_done = 0;
    Q.sld_populist_entry_pending = 1;
  }
  normalize(ctx);
}

const origins = [
  'centralized_executive',
  'asset_led_executive',
  'machine_counter_coup',
  'baron_ascendancy',
  'miller_restoration',
];
for (const origin of origins) {
  const ctx = start('sld-entry-' + origin);
  configureMachine(ctx, origin);
  assert.strictEqual(ctx.Q.sld_partocracy_origin, origin, origin + ' origin');
  assert.strictEqual(ctx.Q.sld_partocracy_available, 1, origin + ' available');
  assert(pendingEventIds(ctx).includes('poland_sld_partocracy.sld_congress'),
    origin + ' must queue the SLD congress');
}

function openRoute(seed, settlement) {
  const ctx = start(seed);
  configureMachine(ctx, 'centralized_executive');
  const preserved = {
    assets: ctx.Q.resources,
    seats: ctx.Q.left_seats,
    list: ctx.Q.sejm_list_outcome,
    listResult: ctx.Q.sejm_list_result,
    poll: ctx.Q.left_poll,
  };
  ctx.engine.goToScene('poland_sld_partocracy.sld_congress');
  ctx.choose('poland_sld_partocracy.sld_claim');
  assert.strictEqual(ctx.Q.resources, preserved.assets);
  assert.strictEqual(ctx.engine.state.sceneId,
    'poland_sld_partocracy.sld_rivals');
  ctx.choose('poland_sld_partocracy.' + settlement);
  assert.strictEqual(ctx.Q.left_common_party_exists, 1);
  assert.strictEqual(ctx.Q.left_legal_vehicle, 'sld');
  assert.strictEqual(ctx.Q.left_seats, preserved.seats);
  assert.strictEqual(ctx.Q.sejm_list_outcome, preserved.list);
  assert.strictEqual(ctx.Q.sejm_list_result, preserved.listResult);
  assert.strictEqual(ctx.Q.left_poll, preserved.poll);
  assert.strictEqual(ctx.Q.sld_partocracy_stage, 2);
  return ctx;
}

// Submission and survival are explicit and keep the legal/electoral state.
{
  const ctx = openRoute('sld-coopt', 'rivals_coopt');
  assert.strictEqual(ctx.Q.sld_partocracy_rival_settlement, 'coopted');
  assert.strictEqual(ctx.Q.progressives_org_status, 'subordinate_current');
  assert.strictEqual(ctx.Q.razem_org_status, 'subordinate_current');
  assert.strictEqual(ctx.Q.labor_org_status, 'subordinate_current');
}
{
  const ctx = openRoute('sld-marginalize', 'rivals_marginalize');
  assert.strictEqual(ctx.Q.sld_partocracy_rival_settlement, 'marginalized');
  assert.strictEqual(ctx.Q.progressives_org_status, 'marginalized_current');
  assert.strictEqual(ctx.Q.razem_org_status, 'marginalized_current');
  assert.strictEqual(ctx.Q.labor_org_status, 'marginalized_current');
}

// Choosing the authored SLD route from Miller's restoration closes the
// mutually exclusive social-populist refoundation without altering Miller's
// leadership contract.
{
  const ctx = start('sld-miller-claim');
  configureMachine(ctx, 'miller_restoration');
  ctx.engine.goToScene('poland_sld_partocracy.sld_congress');
  ctx.choose('poland_sld_partocracy.sld_claim');
  assert.strictEqual(ctx.Q.sld_populist_entry_done, 1);
  assert.strictEqual(ctx.Q.sld_populist_entry_pending, 0);
  assert.strictEqual(ctx.Q.merger_leader, 'Leszek Miller');
}

// Expulsion delegates seats, party registration, polling and committee status
// to the canonical caucus resolver rather than deleting the rival.
{
  const ctx = start('sld-expel-progressives');
  configureMachine(ctx, 'centralized_executive');
  ctx.Q.progressives_active = 1;
  ctx.Q.progressives_in_left = 1;
  ctx.Q.progressives_strength = 22;
  ctx.Q.left_progressives_seats = 8;
  const familySeats = ctx.Q.left_seats + ctx.Q.young_left_seats;
  ctx.engine.goToScene('poland_sld_partocracy.sld_congress');
  ctx.choose('poland_sld_partocracy.sld_claim');
  ctx.choose('poland_sld_partocracy.expel_progressives');
  assert.strictEqual(ctx.Q.progressives_party_formed, 1);
  assert.strictEqual(ctx.Q.progressives_in_left, 0);
  assert.strictEqual(ctx.Q.progressives_org_status, 'expelled_party');
  assert.strictEqual(ctx.Q.left_seats + ctx.Q.young_left_seats, familySeats,
    'expulsion must conserve Left-family Sejm seats');
  assert.strictEqual(ctx.Q.progressives_list_committee, 'young_left');
}

function chooseDoctrine(doctrine) {
  const ctx = openRoute('sld-doctrine-' + doctrine, 'rivals_marginalize');
  ctx.Q.time = ctx.Q.sld_partocracy_started_time + 1;
  normalize(ctx);
  assert(pendingEventIds(ctx).includes('poland_sld_partocracy.sld_doctrine'));
  ctx.engine.goToScene('poland_sld_partocracy.sld_doctrine');
  const choiceId = 'poland_sld_partocracy.doctrine_' + doctrine;
  const choice = (ctx.engine.getCurrentChoices() || []).find(function(entry) {
    return entry.id === choiceId;
  });
  assert(choice && choice.canChoose, doctrine + ' doctrine must be reachable');
  ctx.beforeDoctrine = {
    resources: ctx.Q.resources,
    local: ctx.Q.local_network,
    list: ctx.Q.list_confidence,
    pensioner: ctx.Q.pensioner_support,
    organiser: ctx.Q.organiser_energy,
    admin: ctx.Q.administrative_capacity,
    union: ctx.Q.union_trust,
    trust: ctx.Q.public_trust,
    patronage: ctx.Q.sld_patronage_exposure,
  };
  ctx.choose(choiceId);
  assert.strictEqual(ctx.Q.sld_partocracy_stage, 3);
  normalize(ctx);
  assert.strictEqual(ctx.Q.left_party_name, 'SLD');
  return ctx;
}

const orthodox = chooseDoctrine('orthodox');
assert(orthodox.Q.pensioner_support > orthodox.beforeDoctrine.pensioner);
assert(orthodox.Q.organiser_energy < orthodox.beforeDoctrine.organiser);

const market = chooseDoctrine('market');
assert.strictEqual(market.Q.sld_partocracy_doctrine, 'market_apparatus');
assert(market.Q.resources > market.beforeDoctrine.resources);
assert(market.Q.administrative_capacity > market.beforeDoctrine.admin);
assert(market.Q.union_trust < market.beforeDoctrine.union);

const partocracy = chooseDoctrine('partocracy');
assert(partocracy.Q.local_network > partocracy.beforeDoctrine.local);
assert(partocracy.Q.list_confidence > partocracy.beforeDoctrine.list);
assert(partocracy.Q.sld_patronage_exposure > partocracy.beforeDoctrine.patronage);
assert(partocracy.Q.public_trust < partocracy.beforeDoctrine.trust);

// The compact project card joins the shared party deck and respects doctrine.
{
  const ctx = orthodox;
  ctx.Q.month_actions = 0;
  ctx.Q.poland_sld_machine_timer = 0;
  normalize(ctx);
  const deck = (ctx.engine._compileChoices(game.scenes.poland_party_deck) || [])
    .map(function(choice) { return choice.id; });
  assert(deck.includes('poland_sld_machine'), 'SLD machine card missing');
  ctx.engine.goToScene('poland_sld_machine');
  const marketChoice = (ctx.engine.getCurrentChoices() || []).find(function(choice) {
    return choice.id === 'poland_sld_machine.market_mayors';
  });
  assert(marketChoice && !marketChoice.canChoose,
    'orthodox SLD must not use the market-only card action');
  ctx.choose('poland_sld_machine.orthodox_tour');
  assert.strictEqual(ctx.Q.poland_sld_machine_timer, 4);
}

// The route reaches a scored election endpoint with a real vote/leverage fork.
{
  const ctx = partocracy;
  ctx.Q.year = 2027;
  ctx.Q.month = 8;
  normalize(ctx);
  assert(pendingEventIds(ctx).includes('poland_sld_partocracy.sld_election_endpoint'));
  ctx.engine.goToScene('poland_sld_partocracy.sld_election_endpoint');
  assert(Number.isFinite(ctx.Q.sld_election_payoff));
  const momentum = ctx.Q.left_poll_momentum;
  ctx.choose('poland_sld_partocracy.endpoint_turnout');
  assert.strictEqual(ctx.Q.sld_election_endpoint_done, 1);
  assert.notStrictEqual(ctx.Q.left_poll_momentum, momentum);
}

console.log('SLD partocracy route checks passed.');
