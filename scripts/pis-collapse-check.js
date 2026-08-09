'use strict';
// PiS succession / collapse chain check: npm run check:pis
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
let randomState = 0x504953;
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
  if (choices().some(function(c) {
    return c.id === 'root.campaign_game' && c.canChoose;
  })) {
    choose('root.campaign_game');
  } else { choose('root.new_game'); }
  choose('root.standard');
  choose('poland_hub');
  return engine.state.qualities;
}
function group(q, id) {
  return (q.rival_group_records || []).find(function(r) { return r.id === id; });
}
// Put PiS in the state the event is meant to read, then re-derive.
function stress(q) {
  q.continuous_campaign = 1;
  q.year = 2026;
  q.month = 9;
  q.government_party = 'ko';
  q.government_has_confidence = 1;
  q.pis_poll = 22;
  q.konf_poll = 24;
  q.united_right_cohesion = 30;
  q.pis_split = 1;
  q.rozwoj_definitive_departures = 12;
  q.pres_2025_winner_key = 'left';
  engine.goToScene('poland_normalize');
  return q;
}

// 1. A governing, cohesive PiS is not at breaking point.
let q = start('pis-baseline');
engine.goToScene('poland_normalize');
console.log('  baseline pressure:', q.pis_collapse_pressure,
  '(' + q.pis_condition_label + ')');
assert(q.pis_collapse_pressure < 68, 'a governing PiS must not collapse');

// 2. Rupture, lost presidency, Konfederacja level and no successor cross the
//    line, and the event becomes visible on the events desk.
q = start('pis-stressed');
stress(q);
console.log('  stressed pressure:', q.pis_collapse_pressure,
  '(' + q.pis_condition_label + ')');
assert(q.pis_collapse_pressure >= 68,
  'a ruptured, outbid, leaderless PiS must reach collapse: ' +
  q.pis_collapse_pressure);
engine.goToScene('poland_event_queue');
assert(
  String(q.poland_event_queue_titles || '').indexOf('congress') >= 0,
  'the congress must reach the events desk: ' + q.poland_event_queue_titles
);

// 3. The congress splits the caucus without inventing or losing mandates.
q = start('pis-collapse');
stress(q);
const pisBefore = q.pis_seats;
const suwerennaBefore = q.suwerenna_seats || 0;
const rozwojBefore = q.rozwoj_seats || 0;
const otherBefore = q.other_seats || 0;
const leftBefore = q.left_seats;
engine.goToScene('poland_pis_collapse.pis_collapse');
assert.strictEqual(choices().length, 4, 'the congress offers four stances');
assert(q.pis_contested_caucus > 0, 'a contested caucus is fixed before choice');
choose('poland_pis_collapse.pis_collapse_record');
choose('poland_pis_collapse.pis_collapse_result');
assert.strictEqual(q.pis_collapsed, 1);
assert.strictEqual(q.suwerenna_walkout, 1);
assert.strictEqual(q.suwerenna_own_list, 1);
assert(q.pis_seats < pisBefore, 'the rump loses mandates');
assert.strictEqual(q.left_seats, leftBefore, 'nobody crosses to Lewica');
const moved = (q.suwerenna_seats - suwerennaBefore) +
  (q.rozwoj_seats - rozwojBefore) + (q.other_seats - otherBefore);
assert.strictEqual(pisBefore - q.pis_seats, moved,
  'every departing mandate must land somewhere: ' +
  (pisBefore - q.pis_seats) + ' vs ' + moved);
assert.notStrictEqual(q.pis_leader, 'Jarosław Kaczyński');
assert.strictEqual(group(q, 'solidarna').independent, 1);
assert.strictEqual(group(q, 'solidarna').exclusive_seats, q.suwerenna_seats);
console.log('  result:', q.pis_collapse_result);
console.log('  successor:', q.pis_leader, '·', q.pis_ideology);

// 4. A collapsed party stops reporting collapse pressure and does not fire
//    the congress twice.
engine.goToScene('poland_normalize');
assert.strictEqual(q.pis_collapse_pressure, 0);
assert.strictEqual(q.pis_condition_label,
  'broken into rival right-wing parties');
engine.goToScene('poland_event_queue');
assert(
  String(q.poland_event_queue_titles || '').indexOf('congress') < 0,
  'the congress must not return after the split'
);

console.log('PiS collapse checks passed');
