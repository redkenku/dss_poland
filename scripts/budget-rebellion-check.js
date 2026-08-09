'use strict';

// Targeted check for the reworked budget rebellion.
//
// The old model derived coalition defections from a static stress number, so
// the same government deputies abstained no matter what Lewica did: abstain
// and they walked, vote no and they walked anyway. Nothing the player did
// reached the government benches.
//
// Rebellion is now priced by pivotality. A backbencher pays nothing for a
// protest while the majority is comfortable, and comes home once the bill
// could actually fall. These checks pin the three properties that follow:
//   1. a hard Lewica line disciplines the coalition's own malcontents;
//   2. a soft Lewica line frees them to break ranks in public;
//   3. a split the chamber can see costs the cabinet its cohesion.

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

// A KO-led cabinet with a workable but not crushing majority, a badly split
// coalition and Lewica sitting outside it holding the pivotal bloc.
function openRoll(seed, posture) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([seed]);
  const Q = engine.state.qualities;
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(c) { return c.id === sceneId; });
    assert(index >= 0, 'Missing choice ' + sceneId + ' among ' +
      choices.map(function(c) { return c.id; }).join(', '));
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');

  Q.year = 2024;
  Q.month = 12;
  Q.annual_budget_year = 2024;
  Q.sejm_total = 460;
  Q.sejm_quorum_floor = 230;
  Q.left_seats = 26;
  Q.left_in_government = 0;
  Q.government_party = 'ko';
  Q.government_has_confidence = 1;
  Q.caretaker_government = 0;
  Q.coalition_seats = 235;
  Q.government_support_seats = 235;

  engine.goToScene('poland_budget_2023_2026.annual_budget');
  // A coalition with real malcontents to lose: 55 stress puts seven of them
  // on the record as unhappy with this bill.
  Q.government_coalition_dissent = 55;
  choose('poland_opposition_budget.start');
  choose('poland_opposition_budget.priorities');
  choose('poland_opposition_budget.priority_wages');
  choose('poland_opposition_budget.priority_services');
  choose('poland_opposition_budget.conference_discipline');
  choose(posture);
  return Q;
}

const malcontents =
  openRoll('rebellion-pool', 'poland_opposition_budget.tactic_against')
    .opposition_budget_government_malcontents;
assert(
  malcontents > 0,
  'A coalition at 55 dissent recorded no malcontents at all; the pool is dead'
);

// 1. Lewica votes no. The margin collapses, so a coalition rebel would be
//    voting down their own government: they come home.
const hard = openRoll(
  'rebellion-hard-line',
  'poland_opposition_budget.tactic_against'
);
assert(hard.annual_budget_left_no > hard.annual_budget_left_abstain,
  'A declared no did not dominate Lewica\'s roll call');

// 2. Lewica abstains. The bill is safe, so protesting is free.
const soft = openRoll(
  'rebellion-soft-line',
  'poland_opposition_budget.tactic_abstain'
);
assert(soft.annual_budget_left_abstain > soft.annual_budget_left_no,
  'A declared abstention did not dominate Lewica\'s roll call');

assert(
  soft.annual_budget_recorded_defectors > hard.annual_budget_recorded_defectors,
  'A hard Lewica line did not discipline the coalition: ' +
    hard.annual_budget_recorded_defectors + ' rebels against a no vote vs ' +
    soft.annual_budget_recorded_defectors + ' against an abstention'
);
assert(
  soft.annual_budget_recorded_defectors > 0,
  'A comfortable majority produced no rebellion at all'
);
assert(
  soft.annual_budget_government_no + soft.annual_budget_government_abstain ===
    soft.annual_budget_recorded_defectors,
  'Recorded defectors do not match the published cabinet roll call'
);

// 3. The split is the opposition's return: a cabinet that keeps its budget
//    still pays for the roll call.
assert(
  soft.government_coalition_dissent > 55,
  'A visible coalition split cost the cabinet no cohesion'
);
assert(
  soft.opposition_budget_split_note.indexOf('broke ranks') >= 0,
  'The roll call did not report the split it produced'
);

// An open no vote is the boldest form of the protest, so it thins out fastest
// as the margin tightens: a rebel who would abstain on a safe bill will not
// put their name against a bill that can fall.
assert(
  hard.annual_budget_government_no < soft.annual_budget_government_no,
  'Tightening the margin did not reduce open votes against the cabinet: ' +
    hard.annual_budget_government_no + ' vs ' + soft.annual_budget_government_no
);

// A better whip narrows uncertainty instead of revealing a point result.
{
  const model = globalThis.polandBudgetModel;
  assert(model, 'poland_normalize did not publish the shared budget model');
  const base = {
    sejmTotal: 460,
    quorum: 230,
    governmentSeats: 250,
    malcontents: 10,
    externalNo: 210,
  };
  const loose = model.forecast(Object.assign({}, base, {
    partyUnity: 40,
    whipBonus: 0,
  }));
  const informed = model.forecast(Object.assign({}, base, {
    partyUnity: 80,
    whipBonus: 4,
  }));
  assert(informed.width < loose.width,
    'Unity and whip investment did not narrow the forecast: ' +
    loose.width + ' vs ' + informed.width);
}

// Coalition partners become much easier to whip once relations are genuinely
// good, while ordinary relations still receive only a small loyalty benefit.
function partnerBudgetSupport(seed, relation, coalitionDissent, coalitionSeats) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([seed]);
  const Q = engine.state.qualities;
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(c) { return c.id === sceneId; });
    assert(index >= 0, 'Missing choice ' + sceneId + ' among ' +
      choices.map(function(c) { return c.id; }).join(', '));
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  Object.assign(Q, {
    year: 2024,
    month: 12,
    annual_budget_year: 2024,
    left_in_government: 1,
    government_party: 'lewica',
    prime_minister_party: 'lewica',
    finance_minister_party: 'Lewica',
    government_has_confidence: 1,
    caretaker_government: 0,
  });
  engine.goToScene('poland_budget_2023_2026.annual_budget');
  const governmentSeats = coalitionSeats === undefined ? 250 : coalitionSeats;
  Object.assign(Q, {
    coalition_seats: governmentSeats,
    government_support_seats: governmentSeats,
    government_coalition_dissent: coalitionDissent || 0,
    ministry_left_cabinet_seats: 30,
    left_seats: 30,
    ko_seats: 80,
    ministry_ko_in_cabinet: 1,
    ko_relation: relation,
    ko_coalition_dissent: 20,
  });
  choose('poland_budget_2023_2026.government_minimum');
  choose('poland_budget_2023_2026.finance_progressive_revenue');
  choose('poland_budget_2023_2026.internal_lock');
  return {
    support: Q.annual_budget_ko_cabinet_support,
    relation: Q.ko_relation,
    passed: Q.annual_budget_predicted_passed,
    partnerDefectors: Q.annual_budget_predicted_partner_defectors,
  };
}

{
  const neutral = partnerBudgetSupport('budget-relation-neutral', 40);
  const fair = partnerBudgetSupport('budget-relation-fair', 60);
  const good = partnerBudgetSupport('budget-relation-good', 90);
  assert(fair.support > neutral.support,
    'Better relations did not make a coalition partner more cooperative');
  assert(good.support - fair.support >
    (fair.support - neutral.support) * 2,
    'Good relations did not make the coalition partner very cooperative: ' +
      neutral.support + '@' + neutral.relation + ' / ' +
      fair.support + '@' + fair.relation + ' / ' +
      good.support + '@' + good.relation);

  const functional = partnerBudgetSupport(
    'budget-functional-coalition', 40, 40, 231
  );
  const dysfunctional = partnerBudgetSupport(
    'budget-dysfunctional-coalition', 10, 80, 231
  );
  assert.strictEqual(functional.passed, 1,
    'A functional coalition could not carry its own budget');
  assert.strictEqual(dysfunctional.passed, 0,
    'A genuinely dysfunctional coalition still carried its budget cleanly');
  assert(dysfunctional.partnerDefectors > functional.partnerDefectors,
    'Coalition dysfunction did not produce additional budget rebels');
}

// Every available bargain publishes the same vote commitment it will make.
// The democratic-centre option must also ignore a zero-seat club even when
// that club has the warmer relationship.
{
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame(['budget-deal-preview']);
  const Q = engine.state.qualities;
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(c) { return c.id === sceneId; });
    assert(index >= 0, 'Missing choice ' + sceneId + ' among ' +
      choices.map(function(c) { return c.id; }).join(', '));
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');

  Q.year = 2024;
  Q.month = 12;
  Q.annual_budget_year = 2024;
  Q.left_in_government = 1;
  Q.government_party = 'lewica';
  Q.prime_minister_party = 'lewica';
  Q.finance_minister_party = 'Lewica';
  Q.government_has_confidence = 1;
  Q.caretaker_government = 0;
  engine.goToScene('poland_budget_2023_2026.annual_budget');

  Object.assign(Q, {
    coalition_seats: 210,
    government_support_seats: 210,
    ministry_left_cabinet_seats: 30,
    left_seats: 30,
    ko_seats: 40,
    p2050_seats: 0,
    psl_seats: 32,
    razem_seats: 6,
    pis_seats: 142,
    konf_seats: 30,
    ministry_ko_in_cabinet: 0,
    ministry_p2050_in_cabinet: 0,
    ministry_psl_in_cabinet: 0,
    ministry_pis_in_cabinet: 0,
    ministry_konf_in_cabinet: 0,
    razem_in_government: 0,
    ko_relation: 40,
    p2050_relation: 90,
    resources: 3,
    budget: 5,
  });

  choose('poland_budget_2023_2026.government_minimum');
  choose('poland_budget_2023_2026.finance_progressive_revenue');
  choose('poland_budget_2023_2026.internal_lock');
  assert.strictEqual(Q.annual_budget_predicted_passed, 0,
    'Minority-cabinet fixture unexpectedly had a safe budget');
  choose('poland_budget_2023_2026.budget_deal_market');

  assert.strictEqual(Q.annual_budget_deal_democratic_target, 'ko',
    'Deal preview targeted a zero-seat club over an available club');
  assert(Q.annual_budget_deal_psl_votes >= 4,
    'Major PSL concession still returned only one or two MPs');
  assert(Q.annual_budget_deal_pis_votes >= 4,
    'Major PiS concession still returned only one or two MPs');
  assert(Q.annual_budget_deal_democratic_votes >= 3,
    'Democratic-centre deal returned fewer than its viable cohort floor');
  assert.strictEqual(Q.annual_budget_deal_democratic_seats, Q.ko_seats,
    'Deal preview did not publish the target club\'s actual seats');
  const previewVotes = Q.annual_budget_deal_democratic_votes;
  const democraticChoice = engine.getCurrentChoices().find(function(choice) {
    return choice.id ===
      'poland_budget_2023_2026.deal_democratic_green_register';
  });
  assert(democraticChoice &&
    String(democraticChoice.subtitle).includes(String(previewVotes)),
  'Deal choice did not publish its vote commitment');
  choose('poland_budget_2023_2026.deal_democratic_green_register');
  assert.strictEqual(Q.annual_budget_external_votes_committed, previewVotes,
    'Accepted deal did not commit the number of votes it previewed');
  choose('poland_budget_2023_2026.internal_lock');
  assert.strictEqual(Q.annual_budget_external_votes_live, previewVotes,
    'The re-whip discarded votes from a concession whose terms still held');
}

// The cabinet route exercises the spending envelope through the complete
// parliamentary procedure. Seat fixtures are deliberately applied after the
// annual-budget entry because poland_normalize rebuilds the coalition first.
{
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame(['budget-envelope-cabinet']);
  const Q = engine.state.qualities;
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(c) { return c.id === sceneId; });
    assert(index >= 0, 'Missing choice ' + sceneId + ' among ' +
      choices.map(function(c) { return c.id; }).join(', '));
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');

  Q.year = 2024;
  Q.month = 12;
  Q.annual_budget_year = 2024;
  Q.left_in_government = 1;
  Q.government_party = 'lewica';
  Q.prime_minister_party = 'lewica';
  Q.finance_minister_party = 'Lewica';
  Q.government_has_confidence = 1;
  Q.caretaker_government = 0;

  engine.goToScene('poland_budget_2023_2026.annual_budget');
  Q.coalition_seats = 250;
  Q.ministry_left_cabinet_seats = 30;

  choose('poland_budget_2023_2026.government_social_protocol');
  choose('poland_budget_2023_2026.finance_progressive_revenue');
  choose('poland_budget_2023_2026.internal_lock');
  const forecast = {
    yesLow: Q.annual_budget_forecast_yes_low,
    yesHigh: Q.annual_budget_forecast_yes_high,
    noLow: Q.annual_budget_forecast_no_low,
    noHigh: Q.annual_budget_forecast_no_high,
    abstainLow: Q.annual_budget_forecast_abstain_low,
    abstainHigh: Q.annual_budget_forecast_abstain_high,
    defectorLow: Q.annual_budget_forecast_defectors_low,
    defectorHigh: Q.annual_budget_forecast_defectors_high,
  };
  choose('poland_budget_2023_2026.budget_vote');
  assert(Q.annual_budget_yes >= forecast.yesLow &&
    Q.annual_budget_yes <= forecast.yesHigh,
  'Actual yes vote fell outside the published range');
  assert(Q.annual_budget_no >= forecast.noLow &&
    Q.annual_budget_no <= forecast.noHigh,
  'Actual no vote fell outside the published range');
  assert(Q.annual_budget_abstain >= forecast.abstainLow &&
    Q.annual_budget_abstain <= forecast.abstainHigh,
  'Actual abstention vote fell outside the published range');
  assert(Q.annual_budget_recorded_defectors >= forecast.defectorLow &&
    Q.annual_budget_recorded_defectors <= forecast.defectorHigh,
  'Actual defectors fell outside the published range');
  choose('poland_budget_2023_2026.budget_vote_continue');
  choose('poland_budget_2023_2026.senate_budget_review');
  choose(Q.annual_budget_senate_corrections_pending
    ? 'poland_budget_2023_2026.senate_budget_accept'
    : 'poland_budget_2023_2026.senate_budget_unchanged');

  for (const key of [
    'annual_budget_social_floor',
    'annual_budget_defence_floor',
    'annual_budget_deficit_ceiling',
    'annual_budget_claimed_room',
    'annual_budget_social_breach',
    'annual_budget_defence_breach',
    'annual_budget_deficit_breach',
    'annual_budget_enacted_social_share',
    'annual_budget_enacted_defence_share',
    'annual_budget_enacted_deficit_share',
  ]) {
    assert(Number.isFinite(Number(Q[key])), key + ' is not numeric: ' + Q[key]);
  }
  assert(Q.annual_budget_social_share >= Q.annual_budget_social_floor,
    'The social-protocol path unexpectedly breached its social floor');
  assert(typeof Q.annual_budget_envelope_status === 'string' &&
    Q.annual_budget_envelope_status.length > 20,
  'Envelope status was not published');
  assert(typeof Q.annual_budget_breach_report === 'string' &&
    Q.annual_budget_breach_report.length > 20,
  'Final breach report was not published');
  assert.strictEqual(Q.annual_budget_wage_guarantee_owed, 1,
    'The enacted wage guarantee did not become a claim on next year');
  assert.strictEqual(engine.state.sceneId,
    'poland_budget_2023_2026.budget_enact');

  console.log(
    'budget envelope path passed: floor ' + Q.annual_budget_social_floor +
    '/' + Q.annual_budget_defence_floor + ', ceiling ' +
    Q.annual_budget_deficit_ceiling + '; ' + Q.annual_budget_envelope_status +
    ' Enacted ' + Q.annual_budget_enacted_social_share + '/' +
    Q.annual_budget_enacted_defence_share + '/' +
    Q.annual_budget_enacted_deficit_share + '. ' +
    Q.annual_budget_breach_report
  );
}

console.log(
  'budget rebellion check passed: ' + malcontents + ' malcontents, ' +
  hard.annual_budget_recorded_defectors + ' rebel against a Lewica no, ' +
  soft.annual_budget_recorded_defectors + ' against a Lewica abstention.'
);
