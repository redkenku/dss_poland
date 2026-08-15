'use strict';

// Smoke check for the Kwaśniewski chain and its two party-relations cards.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true, value: undefined,
});

const dendry = require('dendrynexus/lib/engine');
const projectRoot = path.resolve(__dirname, '..');
const json = fs.readFileSync(path.join(projectRoot, 'out', 'game.json'), 'utf8');

let game;
dendry.convertJSONToGame(json, function(error, converted) {
  if (error) throw error;
  game = converted;
});

function newEngine() {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame(['kwas-check']);
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(c) { return c.id === sceneId; });
    assert(index >= 0, 'Missing choice ' + sceneId + ' among ' +
      choices.map(function(c) { return c.id; }).join(', '));
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  return { engine: engine, choose: choose, Q: engine.state.qualities };
}

function viewIf(ctx, id) {
  const scene = game.scenes[id];
  assert(scene, 'Missing scene ' + id);
  if (!scene.viewIf) return true;
  return !!scene.viewIf(ctx.engine, ctx.Q);
}

// --- 1. every new scene exists and compiles
const sceneIds = [
  'poland_kwasniewski', 'poland_kwasniewski.approval_2020',
  'poland_kwasniewski.congress_2021', 'poland_kwasniewski.runoff_2025',
  'poland_kwasniewski.broker', 'poland_kwasniewski.road_sign',
  'poland_kwasniewski.approval_take', 'poland_kwasniewski.congress_concede',
  'poland_kwasniewski.road_sign_break',
  'poland_kwasniewski_call', 'poland_kwasniewski_reproach',
  'poland_kwasniewski_call.call_candidate',
  'poland_kwasniewski_call.call_unity',
  'poland_kwasniewski_reproach.reproach_flat',
];
for (const id of sceneIds) assert(game.scenes[id], 'Missing scene ' + id);

// --- 2. alignment is derived and banded
let ctx = newEngine();
ctx.engine.goToScene('poland_normalize');
assert(Number.isFinite(ctx.Q.kwasniewski_alignment),
  'alignment not numeric: ' + ctx.Q.kwasniewski_alignment);
assert(ctx.Q.kwasniewski_alignment_band, 'no band');
assert(ctx.Q.kwasniewski_call_title, 'no call title');
assert(ctx.Q.kwasniewski_reproach_title, 'no reproach title');
console.log('baseline alignment', ctx.Q.kwasniewski_alignment,
  ctx.Q.kwasniewski_alignment_band, '|', ctx.Q.kwasniewski_call_title,
  '|', ctx.Q.kwasniewski_reproach_title);

// --- 3. a right-wing bargain drives it hostile; the reproach card unlocks
ctx.Q.kwasniewski_channel = 1;
ctx.Q.konf_relation = 40;
ctx.Q.sejm_list_host = 'konf';
ctx.Q.ko_relation = 10;
ctx.engine.goToScene('poland_normalize');
assert(ctx.Q.kwasniewski_alignment < 40,
  'right bargain did not lower alignment: ' + ctx.Q.kwasniewski_alignment);
assert.strictEqual(ctx.Q.kwasniewski_charge, 'konf');
assert.strictEqual(ctx.Q.kwasniewski_reproach_title,
  'You Cannot Govern With Them');
assert(viewIf(ctx, 'poland_kwasniewski_reproach'),
  'reproach card not visible when hostile');
assert(!viewIf(ctx, 'poland_kwasniewski_call'),
  'aligned card visible when hostile');
console.log('hostile alignment', ctx.Q.kwasniewski_alignment,
  ctx.Q.kwasniewski_alignment_band, '|', ctx.Q.kwasniewski_reproach_title);

// --- 4. the reproach card applies damage and its options resolve
const trustBefore = ctx.Q.public_trust;
const koBefore = ctx.Q.ko_relation;
ctx.engine.goToScene('poland_kwasniewski_reproach');
assert(ctx.Q.public_trust < trustBefore, 'reproach did no trust damage');
assert(ctx.Q.ko_relation < koBefore, 'reproach did no KO damage');
assert.strictEqual(ctx.Q.kwasniewski_card_timer, 7);
ctx.Q.resources = 5;
const flatIds = ctx.engine.getCurrentChoices().map(function(c) { return c.id; });
assert(flatIds.indexOf('poland_kwasniewski_reproach.reproach_flat') >= 0,
  'no mitigation route: ' + flatIds.join(', '));

// --- 5. an aligned run reaches the call card, and each topic has an option
ctx = newEngine();
ctx.Q.kwasniewski_channel = 1;
ctx.Q.kwasniewski_alignment_bias = 10;
ctx.engine.goToScene('poland_normalize');
assert(ctx.Q.kwasniewski_alignment >= 50,
  'aligned run below threshold: ' + ctx.Q.kwasniewski_alignment);
assert(viewIf(ctx, 'poland_kwasniewski_call'), 'call card not visible');
assert(!viewIf(ctx, 'poland_kwasniewski_reproach'),
  'reproach visible while aligned');

const topics = ['candidate', 'bloc', 'ko', 'partner', 'old_electorate',
  'surge', 'unity'];
for (const topic of topics) {
  const probe = newEngine();
  probe.Q.kwasniewski_channel = 1;
  probe.Q.kwasniewski_alignment_bias = 10;
  probe.engine.goToScene('poland_normalize');
  probe.Q.kwasniewski_topic = topic;
  probe.Q.resources = 5;
  probe.engine.goToScene('poland_kwasniewski_call');
  const ids = probe.engine.getCurrentChoices().map(function(c) { return c.id; });
  const tailored = 'poland_kwasniewski_call.call_' + topic;
  assert(ids.indexOf(tailored) >= 0,
    topic + ' has no tailored option; saw ' + ids.join(', '));
  assert(ids.indexOf('poland_kwasniewski_call.call_decline') >= 0,
    topic + ' has no decline route');
  probe.choose(tailored);
}
console.log('all seven aligned topics offer a tailored route');

// --- 6. every charge produces a distinct title and lands damage
const charges = ['konf', 'road', 'institutions', 'different_left',
  'concerns', 'tvn'];
const seenTitles = {};
for (const charge of charges) {
  const probe = newEngine();
  probe.Q.kwasniewski_channel = 1;
  probe.engine.goToScene('poland_normalize');
  probe.Q.kwasniewski_charge = charge;
  probe.Q.kwasniewski_reproach_title = 'x';
  const before = JSON.stringify([probe.Q.public_trust, probe.Q.ko_relation,
    probe.Q.party_unity, probe.Q.local_network, probe.Q.media_access,
    probe.Q.urban_progressive_support]);
  probe.engine.goToScene('poland_kwasniewski_reproach');
  const after = JSON.stringify([probe.Q.public_trust, probe.Q.ko_relation,
    probe.Q.party_unity, probe.Q.local_network, probe.Q.media_access,
    probe.Q.urban_progressive_support]);
  assert(before !== after, charge + ' charge applied no damage');
  assert(probe.Q.kwasniewski_verdict, charge + ' recorded no verdict');
  seenTitles[charge] = probe.Q.kwasniewski_verdict;
}
console.log('charges:', Object.keys(seenTitles).length, 'distinct verdicts',
  new Set(Object.values(seenTitles)).size);

// --- 7. the 2020 approval gate: only above a defensible result
ctx = newEngine();
ctx.Q.year = 2020; ctx.Q.month = 7;
ctx.Q.reckoning_event_done = 1;
ctx.Q.pres_first_round_complete = 1;
ctx.Q.pres_performance_level = -3;
assert(!viewIf(ctx, 'poland_kwasniewski.approval_2020'),
  'approval fired after a disaster');
ctx.Q.pres_performance_level = 1;
assert(viewIf(ctx, 'poland_kwasniewski.approval_2020'),
  'approval did not fire after a satisfactory result');
ctx.Q.pres_r1_display_left = 6.4;
ctx.Q.pres_performance_band = 'Base held; broadly satisfying';
ctx.Q.presidential_candidate = 'Robert Biedroń';
ctx.engine.goToScene('poland_kwasniewski.approval_2020');
assert.strictEqual(ctx.Q.kwasniewski_channel, 1, 'approval did not open channel');
ctx.choose('poland_kwasniewski.approval_take');
assert(ctx.Q.kwasniewski_alignment_bias > 0, 'endorsement gave no bias');

// --- 8. the 2021 congress: three faces, all opening the channel
const faces = [
  { mandate: 'disciplinary', expect: 'condemn' },
  { mandate: 'member_ballot', expect: 'approve' },
  { mandate: 'electoral_agreement', expect: 'scold' },
];
for (const face of faces) {
  const probe = newEngine();
  probe.Q.year = 2021; probe.Q.month = 7;
  probe.Q.left_revolt_event_done = 1;
  probe.Q.kukiz_negotiation_done = 1;
  probe.Q.left_mandate = face.mandate;
  probe.Q.merger_resolution = 'test';
  assert(viewIf(probe, 'poland_kwasniewski.congress_2021'),
    'congress did not fire for ' + face.mandate);
  probe.engine.goToScene('poland_kwasniewski.congress_2021');
  assert.strictEqual(probe.Q.kwasniewski_congress_face, face.expect,
    face.mandate + ' produced ' + probe.Q.kwasniewski_congress_face);
  assert.strictEqual(probe.Q.kwasniewski_channel, 1,
    face.mandate + ' did not open the channel');
  const ids = probe.engine.getCurrentChoices().map(function(c) { return c.id; });
  assert(ids.indexOf('poland_kwasniewski.congress_break') >= 0);
}
console.log('2021 congress: condemn / approve / scold all reachable');

// --- 9. the road sign cannot block the ballot, and the break is permanent
ctx = newEngine();
ctx.Q.continuous_campaign = 1;
ctx.Q.sld_populist_route_active = 1;
ctx.Q.sld_populist_orientation = 'konfederacja';
ctx.Q.sld_populist_escalation = 'bounded welfare populism';
ctx.Q.sld_populist_settlement_stage = 4;
ctx.Q.sejm_list_negotiation_done = 0;
assert(viewIf(ctx, 'poland_kwasniewski.road_sign'), 'road sign did not fire');
ctx.engine.goToScene('poland_kwasniewski.road_sign');
ctx.choose('poland_kwasniewski.road_sign_break');
assert.strictEqual(ctx.Q.kwasniewski_estranged, 1, 'break not permanent');
assert.strictEqual(ctx.Q.kwasniewski_channel, 0, 'channel survived the break');
assert(viewIf(ctx, 'poland_sld_populist.list_filing'),
  'the road sign blocked the ballot deadline');
ctx.engine.goToScene('poland_normalize');
assert.strictEqual(ctx.Q.kwasniewski_alignment, 0, 'estranged alignment not 0');
assert(!viewIf(ctx, 'poland_kwasniewski_call'), 'call card survived estrangement');
assert(!viewIf(ctx, 'poland_kwasniewski_reproach'),
  'reproach card survived estrangement');
assert(!viewIf(ctx, 'poland_kwasniewski.road_sign'), 'road sign repeatable');

// --- 10. the 2025 runoff beat and the broker
ctx = newEngine();
ctx.Q.continuous_campaign = 1;
ctx.Q.year = 2025;
ctx.Q.kwasniewski_channel = 1;
ctx.Q.pres_2025_round_one_done = 1;
ctx.Q.pres_2025_runoff_done = 0;
ctx.Q.pres_2025_first_round_winner = 0;
ctx.Q.pres_2025_candidate_level = 2;
ctx.Q.pres_2025_player_result = 8.1;
ctx.Q.pres_2025_candidate_band = 'Strong result';
assert(viewIf(ctx, 'poland_kwasniewski.runoff_2025'), 'runoff beat did not fire');
ctx.engine.goToScene('poland_kwasniewski.runoff_2025');
assert.strictEqual(ctx.Q.kwasniewski_2025_tone, 'vindicated');
ctx.Q.resources = 5;
ctx.choose('poland_kwasniewski.runoff_price');
assert(!viewIf(ctx, 'poland_kwasniewski.runoff_2025'), 'runoff beat repeatable');

ctx = newEngine();
ctx.Q.continuous_campaign = 1;
ctx.Q.year = 2024;
ctx.Q.kwasniewski_channel = 1;
ctx.Q.kwasniewski_alignment = 60;
ctx.Q.government_coalition_dissent = 40;
ctx.Q.left_in_government = 1;
assert(viewIf(ctx, 'poland_kwasniewski.broker'), 'broker did not fire');
ctx.engine.goToScene('poland_kwasniewski.broker');
assert.strictEqual(ctx.Q.kwasniewski_broker_subject, 'coalition');
ctx.choose('poland_kwasniewski.broker_use');
assert(!viewIf(ctx, 'poland_kwasniewski.broker'), 'broker repeatable');

// --- 11. both cards actually reach the Party Affairs deck, with the title the
// player is meant to read in the hand (Dendry renders a title with magic as an
// array of parts, so compare the joined text).
function deckTitle(ctx, cardId) {
  const compiled = ctx.engine._compileChoices(game.scenes.poland_party_deck) || [];
  const card = compiled.find(function(c) { return c.id === cardId; });
  if (!card) return null;
  return Array.isArray(card.title) ? card.title.join('') : String(card.title);
}

ctx = newEngine();
ctx.Q.kwasniewski_channel = 1;
ctx.Q.kwasniewski_alignment_bias = 10;
ctx.engine.goToScene('poland_normalize');
assert.strictEqual(deckTitle(ctx, 'poland_kwasniewski_call'),
  ctx.Q.kwasniewski_call_title, 'aligned card title did not render in the deck');
assert.strictEqual(deckTitle(ctx, 'poland_kwasniewski_reproach'), null,
  'hostile card offered while aligned');

ctx.Q.kwasniewski_alignment_bias = -40;
ctx.Q.konf_relation = 40;
ctx.engine.goToScene('poland_normalize');
assert.strictEqual(deckTitle(ctx, 'poland_kwasniewski_reproach'),
  ctx.Q.kwasniewski_reproach_title,
  'hostile card title did not render in the deck');
assert.strictEqual(deckTitle(ctx, 'poland_kwasniewski_call'), null,
  'aligned card offered while hostile');

// The channel gates both decks entirely.
ctx = newEngine();
ctx.engine.goToScene('poland_normalize');
assert.strictEqual(deckTitle(ctx, 'poland_kwasniewski_call'), null,
  'aligned card drawn before the channel exists');
assert.strictEqual(deckTitle(ctx, 'poland_kwasniewski_reproach'), null,
  'hostile card drawn before the channel exists');

console.log('both decks reach Party Affairs with rendered titles');

console.log('\nKwaśniewski check: OK');
