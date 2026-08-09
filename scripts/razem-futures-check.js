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

function newGame(seed) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([seed]);
  const choose = function(id) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(choice) { return choice.id === id; });
    assert(index >= 0, 'Missing choice ' + id + ' at ' + engine.state.sceneId);
    assert(choices[index].canChoose, 'Unavailable choice ' + id);
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  return {engine: engine, choose: choose, Q: engine.state.qualities};
}

function seatTotal(Q) {
  return Q.left_seats + Q.razem_party_seats + Q.tak_rozwoj_seats +
    Q.other_seats;
}

function prepare(ctx, pressure, actions) {
  ctx.Q.matysiak_development_pressure = pressure;
  ctx.Q.matysiak_caucus_actions = actions;
  ctx.Q.economic_issue_salience = 62;
  ctx.Q.cultural_issue_salience = 30;
  ctx.Q.left_right_score = 50;
  ctx.Q.left_poll = 18;
  ctx.Q.party_system_left_pull = 30;
  ctx.engine.goToScene('poland_events_2025.matysiak_razem_2025');
}

function refreshSuccessor(ctx) {
  ctx.Q.poll_state_month_key = -1;
  ctx.engine.goToScene('poland_polling');
  assert(ctx.Q.tak_rozwoj_component_vote_intent > 0,
    'successor did not enter generic polling');
  assert(Number.isFinite(ctx.Q.tak_rozwoj_projected_seats),
    'successor projection is not finite');
  ctx.engine.goToScene('poland_party_ai');
  assert.strictEqual(ctx.Q.tak_rozwoj_ai_active, 1,
    'successor did not enter generic party AI');
}

function queuedPayoffs(ctx) {
  return ctx.engine
    ._compileChoices(game.scenes['poland_event_queue.all_events'])
    .filter(function(choice) {
      return choice.canChoose &&
        choice.id.startsWith('poland_razem_futures.') &&
        choice.id.endsWith('_election_payoff');
    })
    .map(function(choice) { return choice.id; });
}

// 1. Matysiak wins Razem without dissolving its second chair or moving seats.
{
  const ctx = newGame('razem-future-matysiak-control');
  const beforeSeats = seatTotal(ctx.Q);
  const beforeStrength = ctx.Q.razem_strength;
  prepare(ctx, 45, 4);
  ctx.choose('poland_events_2025.matysiak_leadership');
  const Q = ctx.Q;
  assert.strictEqual(Q.razem_future_route, 'matysiak_razem');
  assert.strictEqual(Q.razem_leader, 'Paulina Matysiak');
  assert.notStrictEqual(Q.razem_co_leader, 'Vacant');
  assert(Q.razem_leadership_result.includes(Q.razem_co_leader));
  assert.strictEqual(Q.razem_legal_status, 'registered political party');
  assert.strictEqual(Q.razem_party_name, 'Razem');
  assert.strictEqual(Q.matysiak_party, 'Razem');
  assert.strictEqual(seatTotal(Q), beforeSeats);
  assert.strictEqual(
    Q.matysiak_developmentalist_strength + Q.zandberg_socialist_strength,
    beforeStrength
  );
  assert.strictEqual(Q.matysiak_project_active, 1);
  assert.strictEqual(Q.matysiak_project_ai_state,
    'Preparing a state-development convention');

  Q.time = Q.razem_future_start_time + 3;
  ctx.engine.goToScene('poland_razem_futures.matysiak_strategy');
  ctx.choose('poland_razem_futures.matysiak_labor_compact');
  Q.year = 2027;
  Q.month = 9;
  assert.deepStrictEqual(queuedPayoffs(ctx), [
    'poland_razem_futures.matysiak_election_payoff',
  ]);
  ctx.engine.goToScene('poland_razem_futures.matysiak_election_payoff');
  assert.strictEqual(Q.matysiak_election_payoff_done, 1);
  assert(Q.matysiak_election_advantage > 0);
  assert(Q.matysiak_election_endpoint.includes('Razem'));
}

// 2. Matysiak keeps Razem; Zandberg takes a real caucus and organisation into
// Akcja Socjalistyczna, which uses the generic successor systems.
{
  const ctx = newGame('razem-future-akcja');
  const beforeSeats = seatTotal(ctx.Q);
  const beforeStrength = ctx.Q.razem_strength;
  prepare(ctx, 30, 3);
  ctx.choose('poland_events_2025.matysiak_own_party');
  const Q = ctx.Q;
  assert.strictEqual(Q.razem_future_route, 'akcja_socjalistyczna');
  assert.strictEqual(Q.razem_leader, 'Paulina Matysiak');
  assert.notStrictEqual(Q.razem_co_leader, 'Vacant');
  assert.strictEqual(Q.akcja_socjalistyczna_party_formed, 1);
  assert.strictEqual(Q.tak_dla_rozwoju_legal_party_formed, 0);
  assert.strictEqual(Q.tak_rozwoj_party_name, 'Akcja Socjalistyczna');
  assert.strictEqual(Q.tak_rozwoj_leader, 'Adrian Zandberg');
  assert.strictEqual(Q.tak_rozwoj_legal_status, 'registered political party');
  assert.strictEqual(Q.zandberg_party, 'Akcja Socjalistyczna');
  assert(Q.zandberg_project_ai_state.includes('Akcja Socjalistyczna'));
  assert(Q.matysiak_project_ai_state.includes('Razem'));
  assert(Q.razem_future_departing_seats > 1,
    'Akcja received only an individual mandate');
  assert.strictEqual(seatTotal(Q), beforeSeats);
  assert.strictEqual(Q.razem_strength + Q.razem_future_activists, beforeStrength);
  refreshSuccessor(ctx);

  Q.time = Q.razem_future_start_time + 3;
  ctx.engine.goToScene('poland_razem_futures.zandberg_strategy');
  ctx.choose('poland_razem_futures.zandberg_movement');
  ctx.engine.goToScene('poland_razem_futures.matysiak_strategy');
  ctx.choose('poland_razem_futures.matysiak_labor_compact');
  Q.snap_campaign_active = 1;
  assert.deepStrictEqual(queuedPayoffs(ctx), [
    'poland_razem_futures.zandberg_election_payoff',
  ]);
  ctx.engine.goToScene('poland_razem_futures.zandberg_election_payoff');
  assert(Q.zandberg_election_endpoint.includes('Akcja'));
  assert.strictEqual(Q.matysiak_election_payoff_done, 0);
}

// 3. Zandberg keeps the dual-chair Razem; Matysiak's prior organising controls
// how much parliamentary and activist support Tak! Dla Rozwoju receives.
{
  const low = newGame('razem-future-tak-low');
  prepare(low, 5, 0);
  low.choose('poland_events_2025.matysiak_expulsion');

  const ctx = newGame('razem-future-tak-high');
  const beforeSeats = seatTotal(ctx.Q);
  const beforeStrength = ctx.Q.razem_strength;
  prepare(ctx, 55, 0);
  ctx.choose('poland_events_2025.matysiak_expulsion');
  const Q = ctx.Q;
  assert.strictEqual(Q.razem_future_route, 'tak_dla_rozwoju');
  assert.strictEqual(Q.razem_leader, 'Adrian Zandberg');
  assert.notStrictEqual(Q.razem_co_leader, 'Vacant');
  assert.strictEqual(Q.tak_dla_rozwoju_legal_party_formed, 1);
  assert.strictEqual(Q.akcja_socjalistyczna_party_formed, 0);
  assert.strictEqual(Q.tak_rozwoj_party_name, 'Tak! Dla Rozwoju');
  assert.strictEqual(Q.tak_rozwoj_leader, 'Paulina Matysiak');
  assert.strictEqual(Q.matysiak_party, 'tak_rozwoj');
  assert(Q.matysiak_project_ai_state.includes('Tak! Dla Rozwoju'));
  assert(Q.zandberg_project_ai_state.includes('Razem'));
  assert(Q.razem_future_departing_seats >= low.Q.razem_future_departing_seats);
  assert(Q.razem_future_activists > low.Q.razem_future_activists,
    'prior developmental organising did not alter the activist split');
  assert.strictEqual(seatTotal(Q), beforeSeats);
  assert.strictEqual(Q.razem_strength + Q.razem_future_activists, beforeStrength);
  refreshSuccessor(ctx);

  Q.time = Q.razem_future_start_time + 3;
  ctx.engine.goToScene('poland_razem_futures.zandberg_strategy');
  ctx.choose('poland_razem_futures.zandberg_electoral');
  ctx.engine.goToScene('poland_razem_futures.matysiak_strategy');
  ctx.choose('poland_razem_futures.matysiak_sovereignty');
  Q.snap_campaign_active = 1;
  assert.deepStrictEqual(queuedPayoffs(ctx), [
    'poland_razem_futures.matysiak_election_payoff',
  ]);
  ctx.engine.goToScene('poland_razem_futures.matysiak_election_payoff');
  assert(Q.matysiak_election_endpoint.includes('Tak!'));
  assert.strictEqual(Q.zandberg_election_payoff_done, 0);
  assert(Q.matysiak_election_advantage > 0);
}

console.log('Razem futures checks passed');
