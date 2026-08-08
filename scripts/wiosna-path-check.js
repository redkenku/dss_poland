'use strict';

// Targeted check for the Wiosna ascendancy path. The full smoke suite is
// currently red on an unrelated pre-existing budget assertion, so this drives
// only the new path: availability from each starting position, both doctrine
// routes, every branch event, and the card.

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

function newEngine() {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame(['wiosna-path-check']);
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

function normalize(engine) {
  engine.goToScene('poland_normalize');
}

function pendingEventIds(engine) {
  return (engine._compileChoices(game.scenes['poland_event_queue.all_events']) || [])
    .map(function(c) { return c.id; });
}

function setContinuous(Q) {
  Q.continuous_campaign = 1;
  Q.year = 2024;
  Q.month = 6;
  Q.time = 56;
  Q.resources = 6;
}

// --- 1. availability from each starting position ------------------------
const modes = [
  {
    name: 'dual chairs',
    apply: function(Q) {
      Q.left_constitution = 'dual_chairs';
      Q.spring_merged = 1;
      Q.left_dominant_current = 'none';
    },
    expect: 'dual',
  },
  {
    name: 'Wiosna-led successor',
    apply: function(Q) {
      Q.left_dominant_current = 'spring';
      Q.spring_merged = 1;
    },
    expect: 'sole',
  },
  {
    name: 'independent and strongest',
    apply: function(Q) {
      Q.spring_merged = 0;
      Q.spring_active = 1;
      Q.spring_in_left = 1;
      Q.spring_strength = 40;
      Q.left_dominant_current = 'none';
      Q.left_constitution = 'none';
    },
    expect: 'independent',
  },
];

for (const mode of modes) {
  const ctx = newEngine();
  setContinuous(ctx.Q);
  mode.apply(ctx.Q);
  normalize(ctx.engine);
  assert.strictEqual(ctx.Q.spring_path_mode, mode.expect,
    mode.name + ' should derive mode ' + mode.expect +
    ' (got ' + ctx.Q.spring_path_mode + ')');
  assert.strictEqual(ctx.Q.spring_path_available, 1, mode.name + ' available');
  assert(pendingEventIds(ctx.engine).includes('poland_wiosna_path.spring_congress'),
    mode.name + ' should queue the congress');
}

// The machine-led settlement must not offer it.
{
  const ctx = newEngine();
  setContinuous(ctx.Q);
  ctx.Q.left_dominant_current = 'barons';
  ctx.Q.left_constitution = 'single_leadership';
  ctx.Q.spring_merged = 1;
  ctx.Q.spring_active = 0;
  normalize(ctx.engine);
  assert.strictEqual(ctx.Q.spring_path_mode, 'none', 'barons-led is not a Wiosna path');
  assert.strictEqual(ctx.Q.spring_path_available, 0);
  assert(!pendingEventIds(ctx.engine).includes('poland_wiosna_path.spring_congress'));
}

// --- 2. congress, doctrine fork and both branches ------------------------
function openPath(routeChoice, extra) {
  const ctx = newEngine();
  setContinuous(ctx.Q);
  ctx.Q.left_dominant_current = 'spring';
  ctx.Q.spring_merged = 1;
  normalize(ctx.engine);

  ctx.engine.goToScene('poland_wiosna_path.spring_congress');
  ctx.choose('poland_wiosna_path.congress_take');
  assert.strictEqual(ctx.Q.spring_path_stage, 2, 'congress opens the path');
  assert.strictEqual(ctx.Q.spring_path_started_time, 56);

  // The doctrine convention waits two months.
  ctx.Q.time = 57;
  normalize(ctx.engine);
  assert(!pendingEventIds(ctx.engine).includes('poland_wiosna_path.spring_doctrine'),
    'doctrine must wait for the cooldown');
  ctx.Q.time = 59;
  if (extra) extra(ctx.Q);
  normalize(ctx.engine);
  assert(pendingEventIds(ctx.engine).includes('poland_wiosna_path.spring_doctrine'),
    'doctrine convention should be queued');

  ctx.engine.goToScene('poland_wiosna_path.spring_doctrine');
  const choices = ctx.engine.getCurrentChoices();
  const market = choices.find(function(c) {
    return c.id === 'poland_wiosna_path.doctrine_market';
  });
  assert(market, 'the market doctrine is always listed');
  if (routeChoice) ctx.choose(routeChoice);
  return { ctx: ctx, marketChoosable: market.canChoose };
}

// Social-democratic economics must lock the Ruch Postępu doctrine out.
{
  const opened = openPath(null, function(Q) { Q.left_economic_position = 40; });
  assert.strictEqual(opened.marketChoosable, false,
    'the market doctrine needs an economic record to the right');
}

// Social-liberal branch.
{
  const opened = openPath('poland_wiosna_path.doctrine_equality_first');
  const ctx = opened.ctx;
  assert.strictEqual(ctx.Q.spring_path_route, 'social_liberal');
  assert.strictEqual(ctx.Q.spring_path_stage, 3);
  normalize(ctx.engine);
  assert.strictEqual(ctx.Q.left_party_name, 'Wiosna', 'doctrine renames the party');
  assert(ctx.Q.spring_path_label.includes('Equality-first'));

  ctx.Q.time = ctx.Q.spring_route_time + 3;
  normalize(ctx.engine);
  const queued = pendingEventIds(ctx.engine);
  assert(queued.includes('poland_wiosna_path.spring_two_bills'));
  assert(!queued.includes('poland_wiosna_path.spring_market_turn'),
    'the market branch must stay closed on the social-liberal route');

  const koBefore = ctx.Q.marriage_ko_commitment;
  ctx.engine.goToScene('poland_wiosna_path.spring_two_bills');
  ctx.choose('poland_wiosna_path.bills_liberal_bloc');
  assert(ctx.Q.marriage_ko_commitment > koBefore, 'the bloc buys a KO commitment');

  ctx.Q.time = ctx.Q.spring_route_time + 6;
  normalize(ctx.engine);
  assert(pendingEventIds(ctx.engine).includes('poland_wiosna_path.spring_concordat'));
  ctx.engine.goToScene('poland_wiosna_path.spring_concordat');
  ctx.choose('poland_wiosna_path.concordat_timetable');
  assert(Number.isFinite(ctx.Q.secular_state_left_ownership));

  // The counterattack and the KO offer.
  ctx.Q.spring_liberal_bridge = 70;
  normalize(ctx.engine);
  const late = pendingEventIds(ctx.engine);
  assert(late.includes('poland_wiosna_path.spring_right_counterattack'));
  assert(late.includes('poland_wiosna_path.spring_ko_offer'));
  ctx.engine.goToScene('poland_wiosna_path.spring_ko_offer');
  ctx.choose('poland_wiosna_path.ko_offer_price');
  assert(ctx.Q.marriage_ko_commitment >= 3, 'pricing the list adds commitments');
}

// Market / Ruch Postępu branch, including the Razem rupture.
{
  const opened = openPath('poland_wiosna_path.doctrine_market', function(Q) {
    Q.left_economic_position = 60;
  });
  const ctx = opened.ctx;
  assert.strictEqual(ctx.Q.spring_path_route, 'market_liberal');
  normalize(ctx.engine);
  assert.strictEqual(ctx.Q.left_party_name, 'Ruch Postępu');
  assert(ctx.Q.spring_path_label.includes('Fiscally conservative'));
  assert(ctx.Q.razem_dissent > 28, 'Razem reacts to the doctrine');

  ctx.Q.time = ctx.Q.spring_route_time + 3;
  normalize(ctx.engine);
  const queued = pendingEventIds(ctx.engine);
  assert(queued.includes('poland_wiosna_path.spring_market_turn'));
  assert(!queued.includes('poland_wiosna_path.spring_two_bills'));

  ctx.engine.goToScene('poland_wiosna_path.spring_market_turn');
  const econBefore = ctx.Q.left_economic_position;
  ctx.choose('poland_wiosna_path.market_full');
  assert(ctx.Q.left_economic_position > econBefore);

  ctx.Q.time = ctx.Q.spring_route_time + 5;
  ctx.Q.razem_active = 1;
  ctx.Q.razem_in_left = 1;
  normalize(ctx.engine);
  assert(pendingEventIds(ctx.engine).includes('poland_wiosna_path.spring_razem_rupture'),
    'the rupture must be offered while Razem is still inside');
  ctx.engine.goToScene('poland_wiosna_path.spring_razem_rupture');
  ctx.choose('poland_wiosna_path.rupture_let_go');
  assert.strictEqual(ctx.Q.razem_escalation_stage, 7);
  normalize(ctx.engine);
  assert.strictEqual(ctx.Q.caucus_crisis_pending, 1,
    'the existing split ladder must pick the rupture up');
}

// --- 3. the negotiated divorce reuses the caucus exit machinery ----------
{
  const opened = openPath('poland_wiosna_path.doctrine_market', function(Q) {
    Q.left_economic_position = 62;
  });
  const ctx = opened.ctx;
  ctx.Q.time = ctx.Q.spring_route_time + 5;
  ctx.Q.razem_active = 1;
  ctx.Q.razem_in_left = 1;
  normalize(ctx.engine);
  ctx.engine.goToScene('poland_wiosna_path.spring_razem_rupture');
  ctx.choose('poland_wiosna_path.rupture_divorce');
  assert.strictEqual(ctx.Q.caucus_exit_target, 'razem');
  ctx.choose('poland_caucus_dynamics.resolve_exit');
  assert.strictEqual(ctx.Q.razem_party_formed, 1, 'the divorce registers a party');
  assert.strictEqual(ctx.Q.razem_in_left, 0);
}

// --- 4. the standing card ------------------------------------------------
{
  const ctx = newEngine();
  setContinuous(ctx.Q);
  ctx.Q.left_dominant_current = 'spring';
  ctx.Q.spring_merged = 1;
  normalize(ctx.engine);
  const deck = game.scenes.poland_party_deck;
  const before = (ctx.engine._compileChoices(deck) || [])
    .map(function(c) { return c.id; });
  assert(!before.includes('poland_wiosna_project'),
    'the card must stay out of the deck before the path opens');

  ctx.Q.spring_path_stage = 2;
  ctx.Q.spring_path_route = 'social_liberal';
  ctx.Q.month_actions = 0;
  normalize(ctx.engine);
  const after = (ctx.engine._compileChoices(deck) || [])
    .map(function(c) { return c.id; });
  assert(after.includes('poland_wiosna_project'), 'the card joins the party deck');

  ctx.engine.goToScene('poland_wiosna_project');
  const cardChoices = ctx.engine.getCurrentChoices();
  const business = cardChoices.find(function(c) {
    return c.id === 'poland_wiosna_project.project_business';
  });
  assert(business && !business.canChoose,
    'the equality-first route closes the market action');
  ctx.choose('poland_wiosna_project.project_bills');
  assert.strictEqual(ctx.Q.poland_wiosna_project_timer, 4);
  assert.strictEqual(ctx.Q.month_actions, 1);
}

// --- 5. the 2027 verdict -------------------------------------------------
{
  const ctx = newEngine();
  setContinuous(ctx.Q);
  ctx.Q.year = 2027;
  ctx.Q.month = 8;
  ctx.Q.spring_path_stage = 3;
  ctx.Q.spring_path_route = 'social_liberal';
  ctx.Q.marriage_reform_stage = 4;
  ctx.Q.abortion_reform_stage = 3;
  ctx.Q.left_dominant_current = 'spring';
  ctx.Q.spring_merged = 1;
  normalize(ctx.engine);
  assert(pendingEventIds(ctx.engine).includes('poland_wiosna_path.spring_verdict'));
  ctx.engine.goToScene('poland_wiosna_path.spring_verdict');
  assert(ctx.Q.spring_verdict_rights.includes('Both settlements were carried'));
  ctx.choose('poland_wiosna_path.verdict_record');
  assert(ctx.Q.spring_path_verdict.includes('record'));
}

console.log('Wiosna path checks passed.');
