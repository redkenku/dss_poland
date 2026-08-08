'use strict';

// Targeted check for Wiosna's merger and ascendancy outcomes. The full smoke
// suite currently has an unrelated pre-existing ministry-allocation failure,
// so this drives the real merger-to-congress month turn, exact-once transfer,
// both doctrine routes, their branch events, the card, and both 2027 verdicts.

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

function factionTotal(Q) {
  return Q.factions.reduce(function(total, faction) {
    return total + (Number(Q[faction + '_strength']) || 0);
  }, 0);
}

function transferLedgerTotal(Q) {
  const laborOutsidePartyCaucuses = Q.factions.includes('labor')
    ? 0
    : (Number(Q.labor_strength) || 0);
  return factionTotal(Q) + laborOutsidePartyCaucuses;
}

function assertClose(actual, expected, message) {
  assert(Math.abs(actual - expected) < 1e-8,
    message + ' (expected ' + expected + ', got ' + actual + ')');
}

function turnSeptemberIntoOctober(ctx) {
  ctx.Q.year = 2021;
  ctx.Q.month = 9;
  ctx.Q.time = 22;
  ctx.Q.historical_2023_calendar = 1;
  ctx.Q.caucus_crisis_pending = 0;
  ctx.Q.party_unity = 80;
  ctx.Q.internal_dissent = 10;
  ctx.engine.goToScene('poland_hub');
  // This is the scene used by the hub's pinned End month action. It runs the
  // monthly normalization, party AI, polling and dated-event router.
  ctx.engine.goToScene('poland_advance');
  assert.strictEqual(ctx.engine.state.sceneId,
    'poland_events_2021_2023.october_2021_hub');
}

function beginMerger(ctx, outcome) {
  ctx.engine.goToScene('poland_merger_events.merger');
  ctx.choose(outcome);
  ctx.choose('poland_hub');
}

function normalWiosnaSettlement() {
  const ctx = newEngine();
  // Sole Wiosna leadership needs Wiosna at least as strong as every other
  // surviving current. Assert the ordering rather than a fixed number: the
  // opening caucus balance is tuned elsewhere.
  for (const caucus of ['barons', 'progressives', 'razem', 'pps']) {
    ctx.Q[caucus + '_strength'] = 10;
  }
  ctx.Q.spring_strength = 60;
  beginMerger(ctx, 'poland_merger_events.merger_spring');
  assert.strictEqual(ctx.Q.spring_path_mode, 'sole');
  assert.strictEqual(ctx.Q.spring_transfer_complete, 0);
  assert.strictEqual(ctx.Q.spring_active, 1);

  turnSeptemberIntoOctober(ctx);
  ctx.choose('poland_events_2021_2023.oct21_congress');
  ctx.choose('poland_events_2021_2023.oct21_spring');
  assert.strictEqual(ctx.Q.spring_transfer_complete, 0,
    'ratifying Wiosna leadership must not dissolve its current');
  assert.strictEqual(ctx.Q.spring_active, 1);
  assert.strictEqual(ctx.Q.left_dominant_current, 'spring');
  assert.strictEqual(ctx.Q.left_leader, 'Robert Biedroń');
  normalize(ctx.engine);
  assert.strictEqual(ctx.Q.spring_path_mode, 'sole');
  return ctx;
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

// --- 1. Pawłowska's Wiosna defection and unity gate ----------------------
{
  const highUnity = newEngine();
  highUnity.Q.party_unity = 71;
  highUnity.Q.october_2021_pawlowska_done = 0;
  highUnity.engine.goToScene(
    'poland_events_2021_2023.october_2021_hub'
  );
  assert(!highUnity.engine.getCurrentChoices().some(function(choice) {
    return choice.id === 'poland_events_2021_2023.oct21_pawlowska';
  }), 'Pawłowska must not launch above 70% unity');

  const threshold = newEngine();
  threshold.Q.party_unity = 70;
  threshold.Q.left_dominant_current = 'spring';
  threshold.Q.october_2021_pawlowska_done = 0;
  const leftBefore = threshold.Q.left_seats;
  const pisBefore = threshold.Q.pis_seats;
  threshold.engine.goToScene(
    'poland_events_2021_2023.october_2021_hub'
  );
  threshold.choose('poland_events_2021_2023.oct21_pawlowska');
  assert.strictEqual(threshold.Q.party_unity, 65,
    'the event must reduce unity at the 70% threshold');
  assert.strictEqual(threshold.Q.left_seats, leftBefore - 1);
  assert.strictEqual(threshold.Q.pis_seats, pisBefore + 1);
  assert(threshold.engine.getCurrentChoices().every(function(choice) {
    return choice.title.includes("Wiosna's leadership");
  }), 'Wiosna leadership must own every response on its route');
  threshold.choose('poland_events_2021_2023.pawlowska_audit');
  assert.strictEqual(threshold.Q.party_unity, 66,
    'even the restorative response must leave unity below its prior level');
  assert.strictEqual(threshold.Q.pawlowska_response,
    'Wiosna recruitment audit');

  const razem = newEngine();
  razem.Q.party_unity = 70;
  razem.Q.left_dominant_current = 'razem';
  razem.Q.october_2021_pawlowska_done = 0;
  razem.engine.goToScene('poland_events_2021_2023.oct21_pawlowska');
  assert(razem.engine.getCurrentChoices().every(function(choice) {
    return choice.title.includes("Razem's leadership");
  }), 'Razem leadership must receive its own response framing');
}

// --- 2. normal merger chronology and exact-once transfer -----------------
{
  const ctx = newEngine();
  beginMerger(ctx, 'poland_merger_events.merger_dual');

  assert.strictEqual(ctx.Q.spring_merged, 1,
    'the merger agreement records Wiosna as an organisational component');
  assert.strictEqual(ctx.Q.spring_transfer_complete, 0,
    'the September agreement is not the October transfer');
  assert.strictEqual(ctx.Q.spring_active, 1,
    'hub normalization must preserve Wiosna until congress');
  assert(ctx.Q.spring_strength > 0,
    'Wiosna strength must survive the first post-merger hub');
  assertClose(factionTotal(ctx.Q), 100,
    'normalization conserves total faction strength before congress');

  turnSeptemberIntoOctober(ctx);
  assert(ctx.engine.getCurrentChoices().some(function(choice) {
    return choice.id === 'poland_events_2021_2023.oct21_congress';
  }), 'normal month progression must reach the October congress');

  ctx.choose('poland_events_2021_2023.oct21_congress');
  const totalBefore = transferLedgerTotal(ctx.Q);
  const springBefore = ctx.Q.spring_strength;
  const laborBefore = ctx.Q.labor_strength;
  const progressivesBefore = ctx.Q.progressives_strength;
  const mpsBefore = ctx.Q.spring_estimated_mps;
  const successorMpsBefore =
    ctx.Q.labor_estimated_mps + ctx.Q.progressives_estimated_mps;
  ctx.choose('poland_events_2021_2023.oct21_dual');

  assert.strictEqual(ctx.Q.spring_transfer_complete, 1);
  assert.strictEqual(ctx.Q.spring_active, 0);
  assert.strictEqual(ctx.Q.spring_in_left, 0);
  assert.strictEqual(ctx.Q.spring_strength, 0);
  assert.strictEqual(ctx.Q.spring_exit_strength, springBefore);
  assertClose(ctx.Q.spring_transfer_labor,
    springBefore * 0.35, 'the labour allocation is recorded');
  assertClose(ctx.Q.spring_transfer_progressives,
    springBefore * 0.65, 'the progressive allocation is recorded');
  assertClose(ctx.Q.labor_strength - laborBefore,
    ctx.Q.spring_transfer_labor, 'labour receives its recorded allocation');
  assertClose(ctx.Q.progressives_strength - progressivesBefore,
    ctx.Q.spring_transfer_progressives,
    'progressives receive their recorded allocation');
  assertClose(transferLedgerTotal(ctx.Q), totalBefore,
    'the raw congress transfer conserves party and labour-network strength');
  assert.strictEqual(
    ctx.Q.labor_estimated_mps + ctx.Q.progressives_estimated_mps,
    successorMpsBefore + mpsBefore,
    'the Wiosna delegation is reassigned without losing MPs'
  );
  assert.strictEqual(ctx.Q.progressives_leader, 'Robert Biedroń');
  assert(ctx.Q.progressives_broker.includes('Kotula') &&
    ctx.Q.progressives_broker.includes('Gawkowski') &&
    ctx.Q.progressives_broker.includes('Nowicka') &&
    ctx.Q.progressives_broker.includes('Śmiszek'),
    'the Wiosna political network moves into the progressive current');

  const laborAfter = ctx.Q.labor_strength;
  const progressivesAfter = ctx.Q.progressives_strength;
  ctx.engine.goToScene('poland_events_2021_2023.oct21_dual');
  assert.strictEqual(ctx.Q.labor_strength, laborAfter,
    'a repeated settlement cannot transfer Wiosna twice');
  assert.strictEqual(ctx.Q.progressives_strength, progressivesAfter,
    'a repeated settlement cannot transfer Wiosna twice');

  normalize(ctx.engine);
  assertClose(factionTotal(ctx.Q), 100,
    'normalization preserves the post-transfer total');
  assert.strictEqual(ctx.Q.progressives_name, 'New Left progressives');
  assert(ctx.Q.progressives_advisor_count >= 1,
    'Biedro\u0144 is counted in the successor progressive current');

  ctx.Q.razem_split_outcome = 'historical';
  ctx.Q.wspolne_jutro_formed = 1;
  ctx.Q.biejat_party = 'Wspólne Jutro';
  normalize(ctx.engine);
  assert.strictEqual(ctx.Q.progressives_name, 'Wspólne Jutro');
  assert.strictEqual(ctx.Q.progressives_leader, 'Magdalena Biejat',
    'Biejat durably leads the named cooperative progressive current');
}

// --- 3. availability from each starting position ------------------------
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
      // Strongest by construction, not by a hard-coded number: the opening
      // caucus balance is tuned elsewhere, and normalization rescales the
      // whole set, so only the ordering may be assumed here.
      for (const caucus of ['barons', 'progressives', 'razem', 'pps']) {
        Q[caucus + '_strength'] = 10;
      }
      Q.spring_strength = 60;
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

// --- 4. congress, doctrine fork and both branches ------------------------
function openPath(routeChoice, extra) {
  const ctx = normalWiosnaSettlement();
  setContinuous(ctx.Q);
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

// --- 5. the negotiated divorce reuses the caucus exit machinery ----------
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

// --- 6. the standing card ------------------------------------------------
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

// --- 7. both routes reach their 2027 verdicts ----------------------------
{
  const opened = openPath('poland_wiosna_path.doctrine_equality_first');
  const ctx = opened.ctx;
  ctx.Q.year = 2027;
  ctx.Q.month = 8;
  ctx.Q.marriage_reform_stage = 4;
  ctx.Q.abortion_reform_stage = 3;
  normalize(ctx.engine);
  assert(pendingEventIds(ctx.engine).includes('poland_wiosna_path.spring_verdict'));
  ctx.engine.goToScene('poland_wiosna_path.spring_verdict');
  assert(ctx.Q.spring_verdict_rights.includes('Both settlements were carried'));
  assert(ctx.Q.spring_verdict_doctrine.includes('equality-first'));
  ctx.choose('poland_wiosna_path.verdict_record');
  assert(ctx.Q.spring_path_verdict.includes('record'));
}

{
  const opened = openPath('poland_wiosna_path.doctrine_market', function(Q) {
    Q.left_economic_position = 62;
  });
  const ctx = opened.ctx;
  ctx.Q.year = 2027;
  ctx.Q.month = 8;
  ctx.Q.marriage_reform_stage = 3;
  ctx.Q.abortion_reform_stage = 1;
  normalize(ctx.engine);
  assert(pendingEventIds(ctx.engine).includes('poland_wiosna_path.spring_verdict'));
  ctx.engine.goToScene('poland_wiosna_path.spring_verdict');
  assert(ctx.Q.spring_verdict_doctrine.includes('Ruch Postępu'),
    'the market route reaches a distinct Ruch Postępu verdict');
  ctx.choose('poland_wiosna_path.verdict_next');
  assert(ctx.Q.spring_path_verdict.includes('unfinished business'));
}

console.log('Wiosna path checks passed.');
