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
  engine.goToScene('poland_normalize');
  return {engine: engine, choose: choose, Q: engine.state.qualities};
}

function launch(ctx, mayDayYears) {
  const Q = ctx.Q;
  Q.year = 2025;
  Q.month = 6;
  Q.time = 78;
  Q.continuous_campaign = 1;
  Q.election_2027_terminal = 0;
  Q.public_climate_direction = 'progressive wave';
  Q.public_climate_progressive_index = 66;
  Q.public_climate_left_ownership_index = 46;
  Q.public_climate_progressive_trend = 1.4;
  Q.progressive_credibility = 72;
  Q.labor_credibility = 68;
  Q.government_delivery = 14;
  Q.public_trust = 58;
  Q.labor_day_union_years = mayDayYears;
  Q.labor_day_autonomous_years = mayDayYears;
  Q.labor_day_revival_years = mayDayYears;
  ctx.engine.goToScene(
    'poland_events_2025_red_renaissance.red_smoke'
  );
}

// May Day infrastructure strengthens an Akcja launch, which then enters the
// existing successor-party polling and AI systems and completes the full arc.
{
  const baseline = newGame('red-renaissance-baseline');
  launch(baseline, 0);

  const ctx = newGame('red-renaissance-akcja');
  launch(ctx, 2);
  const Q = ctx.Q;
  assert.strictEqual(Q.red_renaissance_identity, 'Akcja Socjalistyczna');
  assert.strictEqual(Q.red_renaissance_leader, 'Paweł Preneta');
  assert(Q.red_renaissance_strength > baseline.Q.red_renaissance_strength,
    'May Day record did not strengthen the launch');
  ctx.choose('poland_events_2025_red_renaissance.red_smoke_claim');

  Q.time = Q.red_renaissance_next_time;
  ctx.engine.goToScene(
    'poland_events_2025_red_renaissance.red_foundation'
  );
  ctx.choose('poland_events_2025_red_renaissance.red_foundation_deliver');
  assert.strictEqual(Q.red_renaissance_party_formed, 1);
  assert.strictEqual(Q.tak_rozwoj_party_name, 'Akcja Socjalistyczna');
  assert.strictEqual(Q.tak_rozwoj_leader, 'Paweł Preneta');

  Q.poll_state_month_key = -1;
  ctx.engine.goToScene('poland_polling');
  assert(Q.tak_rozwoj_component_vote_intent > 0,
    'Akcja did not begin taking voters through generic polling');
  assert(Number.isFinite(Q.tak_rozwoj_projected_seats));
  ctx.engine.goToScene('poland_party_ai');
  assert.strictEqual(Q.tak_rozwoj_ai_active, 1);

  Q.time = Q.red_renaissance_next_time;
  ctx.engine.goToScene('poland_events_2025_red_renaissance.red_cities');
  ctx.choose('poland_events_2025_red_renaissance.red_cities_delivery');
  Q.left_in_government = 1;
  Q.movement_followthrough_2025 =
    'The post-defeat promise was formally breached';
  Q.time = Q.red_renaissance_next_time;
  assert(ctx.engine
    ._compileChoices(game.scenes['poland_event_queue.all_events'])
    .some(function(choice) {
      return choice.canChoose && choice.id ===
        'poland_events_2025_red_renaissance.red_government_protest';
    }), 'The government protest was not queued as a playable event');
  ctx.engine.goToScene(
    'poland_events_2025_red_renaissance.red_government_protest'
  );
  assert.strictEqual(Q.red_renaissance_protest_issue, 'rights');
  assert(Q.red_renaissance_protest_turnout >= 14000);
  ctx.choose('poland_events_2025_red_renaissance.red_protest_deadline');
  Q.time = Q.red_renaissance_next_time;
  ctx.engine.goToScene('poland_events_2025_red_renaissance.red_voters');
  ctx.choose('poland_events_2025_red_renaissance.red_voters_debate');
  const dissentBefore = Q.razem_dissent;
  Q.razem_active = 1;
  Q.time = Q.red_renaissance_next_time;
  ctx.engine.goToScene('poland_events_2025_red_renaissance.red_razem_wavers');
  assert(Q.razem_dissent > dissentBefore);
  ctx.choose('poland_events_2025_red_renaissance.red_razem_floor');
  Q.time = Q.red_renaissance_next_time;
  ctx.engine.goToScene('poland_events_2025_red_renaissance.red_ban_debate');
  assert.strictEqual(Q.red_renaissance_stage, 7);
  assert(Q.red_renaissance_ban_pressure > 0);
}

// A rapid reversal ends the convergence before party formation.
{
  const ctx = newGame('red-renaissance-withers');
  launch(ctx, 0);
  ctx.choose('poland_events_2025_red_renaissance.red_smoke_dismiss');
  ctx.Q.time = ctx.Q.red_renaissance_next_time;
  ctx.Q.public_climate_progressive_index =
    ctx.Q.red_renaissance_launch_index - 6;
  ctx.Q.public_climate_progressive_trend = -2;
  ctx.engine.goToScene('poland_events_2025_red_renaissance.red_withering');
  ctx.choose('poland_events_2025_red_renaissance.red_wither_cells');
  assert.strictEqual(ctx.Q.red_renaissance_stage, 9);
  assert.strictEqual(ctx.Q.red_renaissance_withered, 1);
  assert.strictEqual(ctx.Q.red_renaissance_party_formed, 0);
}

// An already independent Razem supplies the party instead of creating Akcja.
{
  const ctx = newGame('red-renaissance-razem');
  ctx.Q.razem_party_formed = 1;
  ctx.Q.razem_exit_strength = 18;
  ctx.Q.razem_party_seats = 4;
  launch(ctx, 1);
  assert.strictEqual(ctx.Q.red_renaissance_identity, 'Razem');
  const momentumBefore = Number(ctx.Q.razem_poll_momentum) || 0;
  ctx.choose('poland_events_2025_red_renaissance.red_smoke_claim');
  ctx.Q.time = ctx.Q.red_renaissance_next_time;
  ctx.engine.goToScene(
    'poland_events_2025_red_renaissance.red_foundation'
  );
  assert.strictEqual(ctx.Q.akcja_socjalistyczna_party_formed, 0);
  assert(ctx.Q.razem_poll_momentum > momentumBefore);
}

console.log('Red Renaissance checks passed');
