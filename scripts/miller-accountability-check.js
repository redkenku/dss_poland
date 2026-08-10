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

function enableEvent(Q) {
  Q.continuous_campaign = 1;
  Q.left_in_government = 1;
  Q.government_has_confidence = 1;
  Q.caretaker_government = 0;
  Q.justice_minister_party = 'Lewica';
  Q.justice_minister = 'Katarzyna Ueberhan';
  Q.razem_active = 1;
  Q.left_dominant_current = 'razem';
  Q.razem_strength = 23;
  Q.miller_accountability_done = 0;
  Q.miller_accountability_pending = 0;
}

// The desk starts the clock, refuses to join a busy month at month three and
// launches in month four when every other event guard is clear.
{
  const ctx = newGame('miller-launch-guard');
  const Q = ctx.Q;
  const desk = game.scenes.poland_event_queue;
  const queueScene = game.scenes['poland_event_queue.events_choice'];
  const allEventsScene = game.scenes['poland_event_queue.all_events'];
  const originalCompile = ctx.engine._compileChoices;
  enableEvent(Q);

  function visitDesk(busy) {
    ctx.engine._compileChoices = function(scene) {
      if (scene === allEventsScene && !Q.miller_accountability_pending) {
        return busy ? [{id: 'other.event', title: 'Other event'}] : [];
      }
      if (scene === allEventsScene || scene === queueScene) {
        return Q.miller_accountability_pending
          ? [{id: 'poland_miller_accountability', title: 'Miller'}]
          : [];
      }
      return originalCompile.call(this, scene);
    };
    desk.onArrival[0].call(ctx.engine, ctx.engine.state, Q);
  }

  Q.left_dominant_current = 'barons';
  Q.time = 39;
  visitDesk(false);
  assert.strictEqual(Q.miller_accountability_due_time, -1);

  Q.left_dominant_current = 'razem';
  Q.time = 40;
  visitDesk(false);
  assert.strictEqual(Q.miller_accountability_due_time, 43);
  assert.strictEqual(Q.miller_accountability_pending, 0);

  Q.time = 43;
  visitDesk(true);
  assert.strictEqual(Q.miller_launch_guard_count, 1);
  assert.strictEqual(Q.miller_accountability_pending, 0);

  Q.time = 44;
  visitDesk(false);
  assert.strictEqual(Q.miller_launch_guard_count, 0);
  assert.strictEqual(Q.miller_accountability_pending, 1);
  assert.strictEqual(Q.miller_accountability_elapsed_months, 4);
  assert.strictEqual(Q.poland_event_queue_count, 1);
  ctx.engine._compileChoices = originalCompile;
}

// The event offers the abusive route and both due-process routes; the abusive
// choice persists the requested imprisonment record.
{
  const ctx = newGame('miller-imprisonment-record');
  enableEvent(ctx.Q);
  ctx.Q.miller_accountability_pending = 1;
  ctx.Q.left_dominant_current = 'barons';
  let queued = ctx.engine
    ._compileChoices(game.scenes['poland_event_queue.all_events'])
    .map(function(choice) { return choice.id; });
  assert(!queued.includes('poland_miller_accountability'));

  ctx.Q.left_dominant_current = 'razem';
  queued = ctx.engine
    ._compileChoices(game.scenes['poland_event_queue.all_events'])
    .map(function(choice) { return choice.id; });
  assert(queued.includes('poland_miller_accountability'));

  ctx.engine.goToScene('poland_miller_accountability');
  assert.deepStrictEqual(
    ctx.engine.getCurrentChoices().map(function(choice) { return choice.id; }),
    [
      'poland_miller_accountability.imprison',
      'poland_miller_accountability.independent_case',
      'poland_miller_accountability.public_account',
    ]
  );
  ctx.choose('poland_miller_accountability.imprison');
  assert.strictEqual(ctx.Q.miller_accountability_done, 1);
  assert.strictEqual(ctx.Q.leszek_miller_imprisoned, 1);
  assert.strictEqual(ctx.Q.miller_imprisonment_recorded, 1);
  assert.strictEqual(
    ctx.Q.miller_detention_status,
    'Imprisoned by ministerial order'
  );
}

for (const choice of [
  'poland_miller_accountability.independent_case',
  'poland_miller_accountability.public_account',
]) {
  const ctx = newGame('miller-sane-route-' + choice);
  enableEvent(ctx.Q);
  ctx.Q.miller_accountability_pending = 1;
  ctx.engine.goToScene('poland_miller_accountability');
  ctx.choose(choice);
  assert.strictEqual(ctx.Q.miller_accountability_done, 1);
  assert.strictEqual(ctx.Q.leszek_miller_imprisoned, 0);
  assert.strictEqual(ctx.Q.miller_imprisonment_recorded, 0);
}

console.log('Miller accountability checks passed');
