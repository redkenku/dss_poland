'use strict';

// Targeted check for the reworked major-reform negotiation.
//
// The old model derived a hard tier cap from the president's name and the
// premiership alone, tested it before reading a single commitment, and so made
// every negotiating round mathematically incapable of changing the outcome: the
// player spent resources forever and the same partner blocked the same bill.
//
// These checks pin the three properties that fix has to have:
//   1. bargaining moves the blocking actor's score and can lift the ceiling;
//   2. "find the common line" lands on the reachable tier in one move;
//   3. a conservative Palace still holds a hard veto that no spending lifts.

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

function newEngine(name) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([name]);
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

// A left-led cabinet with KO and PSL inside it and a friendly Palace: the
// configuration in which the maximal bill has to be reachable at a price.
function leftLedCabinet(Q) {
  Q.left_in_government = 1;
  Q.government_has_confidence = 1;
  Q.caretaker_government = 0;
  Q.government_party = 'lewica';
  Q.prime_minister_party = 'lewica';
  Q.prime_minister = 'Włodzimierz Czarzasty';
  Q.ministry_ko_in_cabinet = 1;
  Q.ministry_psl_in_cabinet = 1;
  Q.ministry_p2050_in_cabinet = 0;
  Q.president_name = 'Magdalena Biejat';
  Q.left_president = 1;
  Q.president_relation = 70;
  Q.pres_2025_hostile_president = 0;
  Q.left_poll = 16;
  Q.coalition_blur = 0;
  Q.eu_progressive_headwind = 0;
}

function scoreCeiling(engine, Q, issue, target) {
  Q.reform_ceiling_issue = issue;
  Q.reform_ceiling_target = target;
  engine.goToScene('poland_reform_ceiling');
  return {
    tier: Q.reform_ceiling_tier,
    blocker: Q.reform_ceiling_blocker,
    score: Q.reform_ceiling_blocker_score,
    need: Q.reform_ceiling_need,
    locked: Q.reform_ceiling_palace_locked,
  };
}

// --- 1. every negotiating lever moves the blocking actor's score -----------
{
  const { engine, Q } = newEngine('reform-ceiling-levers');
  leftLedCabinet(Q);
  engine.goToScene('poland_normalize');
  Q.marriage_on_slate = 1;
  Q.marriage_reform_defined = 1;
  Q.marriage_reform_progress = 40;

  const opening = scoreCeiling(engine, Q, 'marriage', 4);
  assert(opening.tier < 4,
    'A tier-4 recognition bill must not be free at opening commitments');

  // A commitment is worth nine points, so four rounds of bargaining must move
  // the score by a visible, monotonic amount.
  let previous = opening.score;
  for (let commitment = 1; commitment <= 4; commitment += 1) {
    Q.marriage_ko_commitment = commitment;
    Q.marriage_third_way_commitment = commitment;
    const round = scoreCeiling(engine, Q, 'marriage', 4);
    assert(round.score > previous,
      'Bargaining round ' + commitment + ' did not raise the blocker score (' +
      previous + ' -> ' + round.score + ')');
    previous = round.score;
  }

  // Public mandate has to be a real lever too, or the mood board is decoration.
  const beforeMandate = scoreCeiling(engine, Q, 'marriage', 4).score;
  Q.lgbt_equality_support = 68;
  Q.lgbt_equality_backlash = 34;
  Q.lgbt_equality_left_ownership = 62;
  Q.marriage_referendum_mandate = 1;
  const afterMandate = scoreCeiling(engine, Q, 'marriage', 4);
  assert(afterMandate.score > beforeMandate + 15,
    'A won referendum and a public majority barely moved the score (' +
    beforeMandate + ' -> ' + afterMandate.score + ')');

  // With the premiership, a friendly Palace, maxed commitments and a public
  // mandate, the maximal settlement must actually become reachable.
  Q.ko_relation = 88;
  Q.psl_relation = 88;
  Q.ko_accept_rights = 78;
  Q.psl_accept_rights = 72;
  Q.psl_conservative_share = 10;
  Q.equality_minister_party = 'Lewica';
  Q.justice_minister_party = 'Lewica';
  Q.marriage_reform_progress = 100;
  const maxed = scoreCeiling(engine, Q, 'marriage', 4);
  assert.strictEqual(maxed.tier, 4,
    'Tier 4 stayed unreachable with every lever near its limit; ceiling was ' +
    maxed.tier + ' (blocker ' + maxed.blocker + ' at ' + maxed.score +
    '/' + maxed.need + ')');
}

// --- 2. a conservative Palace is a hard veto, not a price -----------------
{
  const { engine, Q } = newEngine('reform-ceiling-palace-veto');
  leftLedCabinet(Q);
  Q.president_name = 'Karol Nawrocki';
  Q.left_president = 0;
  Q.pres_2025_hostile_president = 1;
  engine.goToScene('poland_normalize');
  Q.abortion_on_slate = 1;
  Q.abortion_reform_defined = 1;

  // Buy absolutely everything that money can buy.
  Q.president_relation = 100;
  Q.abortion_palace_president = 'Karol Nawrocki';
  Q.abortion_palace_commitment = 4;
  Q.abortion_ko_commitment = 4;
  Q.abortion_third_way_commitment = 4;
  Q.abortion_referendum_mandate = 1;
  Q.abortion_rights_support = 75;
  Q.abortion_rights_backlash = 25;
  Q.abortion_reform_progress = 100;
  Q.ko_relation = 90;
  Q.psl_relation = 90;

  const bought = scoreCeiling(engine, Q, 'abortion', 4);
  assert.strictEqual(bought.tier, 1,
    'A right-wing Palace must cap rights reform at tier 1 no matter what is ' +
    'spent; ceiling was ' + bought.tier);
  assert.strictEqual(bought.blocker, 'president',
    'The president must be named as the binding veto player');
  assert.strictEqual(bought.locked, 1,
    'The profile veto must be reported as a lock, not as a price');

  // The lawful three-fifths override is the one route past it. It lifts the
  // Palace and nothing else: the coalition still has to carry the bill.
  Q.reform_pressure_palace_override = 1;
  const overridden = scoreCeiling(engine, Q, 'abortion', 4);
  assert.strictEqual(Q.reform_ceiling_palace_tier, 4,
    'A three-fifths override must lift the presidential ceiling to tier 4');
  assert(overridden.blocker !== 'president',
    'After an override the Palace must stop being the binding veto player');
  assert(overridden.tier > bought.tier,
    'An override must raise the settlement ceiling above the vetoed tier');
  Q.reform_pressure_palace_override = 0;
}

// --- 3. partner conservatism survives the rework --------------------------
{
  const { engine, Q } = newEngine('reform-ceiling-partner-conservatism');
  leftLedCabinet(Q);
  engine.goToScene('poland_normalize');

  // KO is cold on economics: a KO-in-cabinet labour bill must not reach the
  // full package on relationship alone.
  Q.labor_on_slate = 1;
  Q.labor_reform_defined = 1;
  Q.ko_relation = 80;
  Q.ko_classical_liberal_share = 70;
  Q.ko_accept_social = 35;
  Q.ministry_psl_in_cabinet = 0;
  const koLabour = scoreCeiling(engine, Q, 'labor', 4);
  assert(koLabour.tier < 4,
    'A classical-liberal KO must not carry the full labour package on ' +
    'relationship alone; ceiling was ' + koLabour.tier);

  // PSL's conservative wing is the arithmetic problem on rights.
  Q.ministry_psl_in_cabinet = 1;
  Q.ministry_ko_in_cabinet = 0;
  Q.marriage_on_slate = 1;
  Q.marriage_reform_defined = 1;
  Q.psl_relation = 60;
  Q.psl_conservative_share = 55;
  Q.psl_accept_rights = 30;
  Q.lgbt_equality_support = 48;
  Q.lgbt_equality_backlash = 62;
  const pslRights = scoreCeiling(engine, Q, 'marriage', 3);
  assert(pslRights.tier < 3,
    'A conservative PSL must block civil partnerships at a cold public ' +
    'climate; ceiling was ' + pslRights.tier);
  assert.strictEqual(pslRights.blocker, 'psl',
    'PSL must be named as the binding veto player, not the Palace');
}

// --- 4. "find the common line" lands on the reachable tier in one move ----
{
  const { engine, choose, Q } = newEngine('reform-common-line');
  leftLedCabinet(Q);
  engine.goToScene('poland_normalize');
  Q.marriage_on_slate = 1;
  Q.marriage_reform_defined = 1;
  Q.ministry_ko_in_cabinet = 1;
  Q.ministry_psl_in_cabinet = 1;
  // PSL will carry a closest-person agreement and nothing above it; KO would go
  // much further. The reachable settlement is therefore PSL's tier.
  Q.psl_conservative_share = 40;
  Q.psl_accept_rights = 45;
  Q.psl_relation = 60;
  Q.ko_relation = 70;
  Q.ko_accept_rights = 60;
  Q.ko_social_liberal_share = 60;
  Q.ko_classical_liberal_share = 30;
  Q.marriage_ko_commitment = 2;
  Q.marriage_third_way_commitment = 2;
  Q.marriage_reform_progress = 30;
  Q.lgbt_equality_support = 50;
  Q.lgbt_equality_backlash = 58;
  Q.resources = 4;

  Q.reform_pressure_issue = 'marriage';
  Q.reform_pressure_target_stage = 4;
  Q.reform_pressure_previous_stage = 0;
  Q.reform_pressure_return_mode = 'card';
  engine.goToScene('poland_major_reforms.resolve');
  assert.strictEqual(engine.state.sceneId,
    'poland_major_reforms.objection_queued',
    'A tier-4 bill against a conservative PSL should be blocked, not enacted');
  assert.strictEqual(Q.reform_pressure_pending, 1);

  const reachable = Q.reform_ceiling_tier;
  assert(reachable >= 1 && reachable < 4,
    'This setup needs a partial ceiling to test narrowing; got ' + reachable);

  Q.reform_pressure_return_mode = 'pressure';
  engine.goToScene('poland_reform_pressure');
  assert.strictEqual(engine.state.sceneId, 'poland_reform_pressure.objection');
  choose('poland_reform_pressure.objection_narrow');

  // One press, and the bill is enacted at exactly the reachable tier.
  assert.strictEqual(Q.marriage_reform_stage, reachable,
    'The common line did not settle at the reachable tier (' +
    Q.marriage_reform_stage + ' vs ' + reachable + ')');
  assert.strictEqual(Q.marriage_reform_settled, 1,
    'The common-line settlement must close the project');
  assert.strictEqual(Q.reform_pressure_pending, 0);
}

// --- 5. the negotiation is finite ----------------------------------------
{
  const { engine, choose, Q } = newEngine('reform-rounds-finite');
  leftLedCabinet(Q);
  engine.goToScene('poland_normalize');
  Q.marriage_on_slate = 1;
  Q.marriage_reform_defined = 1;
  Q.ministry_psl_in_cabinet = 1;
  Q.psl_conservative_share = 60;
  Q.psl_relation = 40;
  Q.resources = 20;

  Q.reform_pressure_issue = 'marriage';
  Q.reform_pressure_target_stage = 4;
  Q.reform_pressure_previous_stage = 0;
  Q.reform_pressure_pending = 1;
  Q.reform_pressure_mode = 'partner_objection';
  Q.reform_pressure_actor = 'psl';
  Q.reform_pressure_actor_name = 'PSL';
  Q.reform_pressure_return_mode = 'pressure';
  Q.reform_pressure_rounds = 0;

  let bargains = 0;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    engine.goToScene('poland_reform_pressure');
    if (engine.state.sceneId !== 'poland_reform_pressure.objection') break;
    const bargain = engine.getCurrentChoices().find(function(c) {
      return c.id === 'poland_reform_pressure.objection_bargain';
    });
    if (!bargain || !bargain.canChoose) break;
    choose('poland_reform_pressure.objection_bargain');
    bargains += 1;
    if (Q.reform_pressure_pending !== 1) break;
    Q.reform_pressure_return_mode = 'pressure';
  }
  assert(bargains > 0, 'Bargaining must be available at least once');
  assert(bargains <= 3,
    'Bargaining must be capped at three rounds per bill, got ' + bargains);
  assert.strictEqual(Q.reform_pressure_rounds_left, 0,
    'The round counter must be exhausted after three paid rounds');
}

console.log('reform-ceiling-check: all checks passed');
