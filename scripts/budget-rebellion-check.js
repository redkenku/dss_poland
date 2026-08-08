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
