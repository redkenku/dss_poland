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
  Q.left_seats = 260;
  Q.left_committed_seats = 260;
  Q.ko_seats = 80;
  Q.p2050_seats = 30;
  Q.psl_seats = 30;
  Q.pis_seats = 50;
  Q.konf_seats = 10;
  Q.sejm_total = 460;
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

function completeMajorReformVote(engine, choose, Q) {
  if (engine.state.sceneId === 'poland_legislative_vote.forecast') {
    choose('poland_legislative_vote.hold_vote');
    if (!Q.legvote_sejm_passed) {
      choose('poland_legislative_vote.finish_failed');
    } else {
      choose('poland_legislative_vote.senate_vote');
      if (Q.legvote_senate_decision !== 'Accepted without amendment') {
        choose('poland_legislative_vote.senate_return');
      }
      if (Q.legvote_survived_senate) {
        choose('poland_legislative_vote.president');
        choose(Q.legvote_president_veto
          ? 'poland_legislative_vote.override_veto'
          : 'poland_legislative_vote.finish_enacted');
      } else {
        choose('poland_legislative_vote.finish_failed');
      }
    }
    choose('poland_legislative_vote.finish_callback');
  }
  assert.strictEqual(Q.legvote_profile, 'major_reform',
    'The common-line settlement bypassed the legislative router');
  assert.strictEqual(Q.legvote_enacted, 1,
    'The common-line settlement failed in Parliament: ' + JSON.stringify({
      scene: engine.state.sceneId,
      outcome: Q.legvote_outcome,
      yes: Q.legvote_sejm_yes,
      no: Q.legvote_sejm_no,
      senate: Q.legvote_senate_decision,
      veto: Q.legvote_president_veto,
      ready: Q.major_reform_vote_ready,
      complete: Q.major_reform_vote_complete,
      pending: Q.reform_pressure_pending,
      returnMode: Q.reform_pressure_return_mode,
    }));
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

// --- 3. an aligned Left President signs the Left's flagship programme -----
{
  const { engine, Q } = newEngine('reform-left-president-alignment');
  leftLedCabinet(Q);
  Q.ministry_ko_in_cabinet = 0;
  Q.ministry_psl_in_cabinet = 0;
  Q.president_name = 'Adrian Zandberg';
  Q.left_president = 0;
  Q.president_relation = 18;
  Q.labor_reform_progress = 60;
  Q.social_spending_support = 96;
  Q.social_spending_salience = 100;
  Q.social_spending_backlash = 100;
  Q.social_spending_left_ownership = 6;
  Q.social_spending_progressive_ownership = 0;
  Q.social_spending_conservative_ownership = 100;
  Q.eu_progressive_headwind = 6;
  engine.goToScene('poland_normalize');
  assert.strictEqual(Q.left_president, 1,
    'An existing Zandberg save was not repaired as a Left presidency');

  const labor = scoreCeiling(engine, Q, 'labor', 4);
  assert.strictEqual(Q.reform_ceiling_palace_tier, 4,
    'Zandberg vetoed the full Left labour programme despite an electoral mandate');
  assert(labor.blocker !== 'president',
    'The aligned Left Palace remained the labour bill\'s veto player');
  assert(Q.reform_ceiling_breakdown.includes('backlash cost -14'),
    'The score hid the public backlash cost');
  assert(Q.reform_ceiling_breakdown.includes('left-President alignment +36'),
    'The score hid the aligned Palace boost');
  assert(Q.reform_ceiling_breakdown.includes('presidential relationship -8'),
    'The score hid the separate relationship cost');
}

// --- 4. partner conservatism survives the rework --------------------------
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

// --- 5. "find the common line" lands on the reachable tier in one move ----
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
  Q.major_reform_vote_ready = 0;
  Q.major_reform_vote_complete = 0;
  Q.legvote_enacted = 0;
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
  completeMajorReformVote(engine, choose, Q);

  // One negotiation choice tables the common line; Parliament then enacts it.
  assert.strictEqual(Q.marriage_reform_stage, reachable,
    'The common line did not settle at the reachable tier (' +
    Q.marriage_reform_stage + ' vs ' + reachable + ')');
  assert.strictEqual(Q.marriage_reform_settled, 1,
    'The common-line settlement must close the project');
  assert.strictEqual(Q.reform_pressure_pending, 0);
}

// --- 6. the negotiation is finite ----------------------------------------
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

// --- 7. the slate is three of nine, and it is permanent -------------------
{
  const { engine, choose, Q } = newEngine('reform-slate-cap');
  engine.goToScene('poland_normalize');
  assert.strictEqual(Q.reform_slate_max, 3);
  assert.strictEqual(Q.reform_slate_count, 0);
  assert.strictEqual(Q.reform_slate_slots_left, 3);

  const picks = ['pick_courts', 'pick_health', 'pick_asylum'];
  picks.forEach(function(pick, index) {
    Q.month_actions = 0;
    Q.poland_reform_slate_timer = 0;
    Q.reform_pressure_pending = 0;
    engine.goToScene('poland_reform_slate');
    assert.strictEqual(engine.state.sceneId, 'poland_reform_slate',
      'The slate card must be reachable while slots remain');
    choose('poland_reform_slate.' + pick);
    engine.goToScene('poland_normalize');
    assert.strictEqual(Q.reform_slate_count, index + 1);
    assert.strictEqual(Q.reform_slate_slots_left, 3 - (index + 1));
  });
  assert.strictEqual(Q.reform_slate_closed, 1,
    'A full slate must close');
  assert.strictEqual(Q.courts_on_slate, 1);
  assert.strictEqual(Q.health_on_slate, 1);
  assert.strictEqual(Q.asylum_on_slate, 1);
  assert.strictEqual(Q.abortion_on_slate, 0,
    'An unpicked field must stay off the slate');

  // A field that was never chosen has no project card.
  Q.month_actions = 0;
  Q.poland_abortion_reform_timer = 0;
  assert.strictEqual(
    game.scenes.poland_abortion_reform.viewIf(engine, Q),
    false,
    'An unpicked reform must not offer a project card'
  );
  Q.poland_courts_reform_timer = 0;
  assert.strictEqual(
    game.scenes.poland_courts_reform.viewIf(engine, Q),
    true,
    'A picked reform must offer its project card'
  );
  const visibleProjects = [
    'abortion', 'marriage', 'church', 'asylum', 'border',
    'defence', 'labor', 'health', 'courts',
  ].filter(function(issue) {
    Q['poland_' + issue + '_reform_timer'] = 0;
    return game.scenes['poland_' + issue + '_reform'].viewIf(engine, Q);
  }).sort();
  assert.deepStrictEqual(
    visibleProjects,
    ['asylum', 'courts', 'health'],
    'Major Reforms must contain the player picks, not the old default trio'
  );
  // And the slate card itself is gone for good.
  Q.poland_reform_slate_timer = 0;
  assert.strictEqual(
    game.scenes.poland_reform_slate.viewIf(engine, Q),
    false,
    'The slate must not reopen once it is full'
  );
}

// --- 8. Trzaskowski's explicit signature pledge binds the Palace ----------
{
  const { engine, Q } = newEngine('reform-trzaskowski-signature-pledge');
  leftLedCabinet(Q);
  Q.ministry_ko_in_cabinet = 0;
  Q.ministry_psl_in_cabinet = 0;
  Q.president_name = 'Rafał Trzaskowski';
  Q.left_president = 0;
  Q.president_relation = 30;
  Q.trz_marriage_signature = 1;
  Q.trz_abortion_signature = 1;
  scoreCeiling(engine, Q, 'marriage', 4);
  assert.strictEqual(Q.reform_ceiling_palace_cap, 4);
  assert.strictEqual(Q.reform_ceiling_palace_tier, 4,
    'Trzaskowski reneged on his explicit marriage-equality signature pledge');
  scoreCeiling(engine, Q, 'abortion', 3);
  assert(Q.reform_ceiling_palace_tier >= 3,
    'Trzaskowski reneged on his abortion-restoration signature pledge');
}

// --- 9. enacted marriage equality supersedes the EU-recognition event -----
{
  const { engine, Q } = newEngine('marriage-equality-supersedes-eu-event');
  Object.assign(Q, {
    continuous_campaign: 1,
    year: 2025,
    month: 11,
    marriage_reform_settled: 1,
    marriage_reform_stage: 2,
  });
  const event = game.scenes['poland_events_2025.marriage_eu_2025'];
  assert(event.viewIf(engine, Q),
    'Registered partnerships should not suppress the EU marriage ruling');
  Q.marriage_reform_stage = 3;
  assert(!event.viewIf(engine, Q),
    'Signed marriage equality must suppress the obsolete EU ruling event');
}

// --- 10. a written coalition promise breaks one partner veto, up to tier 3 -
{
  const { engine, choose, Q } = newEngine('reform-coalition-promise');
  leftLedCabinet(Q);
  engine.goToScene('poland_normalize');
  Q.marriage_on_slate = 1;
  Q.marriage_reform_defined = 1;
  Q.ministry_ko_in_cabinet = 0;
  Q.ministry_psl_in_cabinet = 1;
  Q.psl_conservative_share = 60;
  Q.psl_relation = 40;
  Q.psl_accept_rights = 30;
  Q.lgbt_equality_support = 48;
  Q.lgbt_equality_backlash = 62;
  // The Palace is not the question here: give it enough to sign a tier-3 bill
  // so the only binding veto left is the coalition partner.
  Q.marriage_palace_president = 'Magdalena Biejat';
  Q.marriage_palace_commitment = 2;

  const blocked = scoreCeiling(engine, Q, 'marriage', 3);
  assert(blocked.tier < 3 && blocked.blocker === 'psl',
    'This setup needs PSL blocking a tier-3 bill; got tier ' + blocked.tier +
    ' blocked by ' + blocked.blocker);

  Q.reform_pressure_promise_psl = 1;
  const promised = scoreCeiling(engine, Q, 'marriage', 3);
  assert.strictEqual(promised.tier, 3,
    'A cashed written promise must carry the blocking partner to tier 3; ' +
    'ceiling was ' + promised.tier);
  assert(Q.reform_ceiling_psl_score >= Q.reform_ceiling_need,
    'The promise must also lift the Sejm forecast, not only the pre-vote tier');
  const overreach = scoreCeiling(engine, Q, 'marriage', 4);
  assert(overreach.tier < 4,
    'The promise must buy tier 3 and nothing above it; ceiling was ' +
    overreach.tier);
  Q.reform_pressure_promise_psl = 0;

  // The promise is one per partner: cashing it in the objection spends it.
  Q.coalition_promises_signed = 1;
  Q.coalition_promise_spent_psl = 0;
  Q.reform_pressure_issue = 'marriage';
  Q.reform_pressure_target_stage = 3;
  Q.reform_pressure_previous_stage = 0;
  Q.reform_pressure_pending = 1;
  Q.reform_pressure_mode = 'partner_objection';
  Q.reform_pressure_actor = 'psl';
  Q.reform_pressure_actor_name = 'PSL';
  Q.reform_pressure_return_mode = 'pressure';
  Q.reform_pressure_rounds = 0;

  engine.goToScene('poland_reform_pressure');
  assert.strictEqual(engine.state.sceneId, 'poland_reform_pressure.objection');
  const offer = engine.getCurrentChoices().find(function(c) {
    return c.id === 'poland_reform_pressure.objection_promise';
  });
  assert(offer && offer.canChoose,
    'A signed, unspent coalition promise must be cashable against the blocker');
  choose('poland_reform_pressure.objection_promise');
  assert.strictEqual(Q.coalition_promise_spent_psl, 1,
    'Cashing the promise must consume this partner\'s only written promise');
  assert.strictEqual(Q.major_reform_vote_ready, 1,
    'The promised bill must clear the partner veto and reach Parliament');
  assert.strictEqual(Q.reform_ceiling_target_resolved, 3,
    'The bill must reach Parliament at tier 3, not at the old reachable tier');
  completeMajorReformVote(engine, choose, Q);
  assert.strictEqual(Q.marriage_reform_settled, 1,
    'The promised bill must close the project');
  assert(Q.marriage_reform_stage >= 2,
    'A tier-3 bill may lose one tier to a Senate amendment, no more; got ' +
    Q.marriage_reform_stage);
  assert.strictEqual(Q.reform_pressure_promise_psl, 0,
    'The per-bill promise binding must be cleared once the bill resolves');
}

console.log('reform-ceiling-check: all checks passed');
