'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dendry = require('dendrynexus/lib/engine');

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: undefined,
});

const root = path.resolve(__dirname, '..');
const json = fs.readFileSync(path.join(root, 'out', 'game.json'), 'utf8');
let game;
dendry.convertJSONToGame(json, function(error, converted) {
  if (error) throw error;
  game = converted;
});

function engineAtBudget(seed, fixture) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([seed]);
  function choose(id) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(choice) { return choice.id === id; });
    assert(index >= 0, 'Missing choice ' + id);
    engine.choose(index);
  }
  choose('root.campaign_game');
  choose('root.standard');
  const Q = engine.state.qualities;
  Object.assign(Q, {
    year: 2024,
    month: 12,
    annual_budget_year: 2024,
    sejm_total: 460,
    sejm_quorum_floor: 230,
    senate_total: 100,
    senate_government_seats: 48,
    senate_ko_seats: 43,
    senate_left_seats: 2,
    public_debt: 45.7,
    annual_budget_deficit_share: 4.5,
    resources: 6,
    government_has_confidence: 1,
    caretaker_government: 0,
    government_party: 'pis',
    prime_minister_party: 'pis',
    finance_minister_party: 'PiS',
    government_support_seats: 235,
    coalition_seats: 235,
    left_in_government: 0,
    left_seats: 26,
    pis_seats: 235,
    ko_seats: 134,
    psl_seats: 30,
    p2050_seats: 0,
    konf_seats: 11,
  }, fixture || {});
  engine.goToScene('poland_budget_2023_2026.annual_budget');
  assert.strictEqual(engine.state.sceneId,
    'poland_budget_2023_2026.budget_open');
  return {engine: engine, Q: Q, model: globalThis.polandBudgetModel};
}

for (let year = 2019; year <= 2026; year += 1) {
  const run = engineAtBudget('budget-year-' + year, {
    year: year,
    annual_budget_year: year,
  });
  assert.strictEqual(run.Q.budget_game.year, year);
  assert.strictEqual(run.Q.budget_game.fiscalYear, year + 1);
  assert(run.model.pressure[year].length >= 2,
    'Missing pressure cards for ' + year);
  assert(run.model.preview(run.Q).affordable,
    'Starting proposal is unaffordable in ' + year);
}

{
  const run = engineAtBudget('government-board', {
    left_in_government: 1,
    government_party: 'ko',
    prime_minister_party: 'ko',
    finance_minister_party: 'Lewica',
    government_support_seats: 252,
    coalition_seats: 252,
    left_seats: 45,
    ko_seats: 150,
    psl_seats: 35,
    p2050_seats: 22,
    ministry_ko_in_cabinet: 1,
    ministry_psl_in_cabinet: 1,
    ministry_p2050_in_cabinet: 1,
  });
  const model = run.model;
  const Q = run.Q;
  assert.strictEqual(Q.budget_game.role, 'government');
  assert(Q.budget_game.presets.length >= 2 &&
    Q.budget_game.presets.length <= 4);
  assert.strictEqual(new Set(Q.budget_game.presets.map(function(preset) {
    return preset.author;
  })).size, Q.budget_game.presets.length);
  for (const preset of Q.budget_game.presets) {
    model.selectPreset(Q, preset.id);
    assert(model.preview(Q).affordable,
      preset.label + ' did not start affordable');
  }

  model.selectPreset(Q, Q.budget_game.presets[0].id);
  const initial = JSON.stringify(model.vote(Q, Q.budget_game));
  assert.strictEqual(JSON.stringify(model.vote(Q, Q.budget_game)), initial,
    'Identical state did not produce an identical vote');

  assert.strictEqual(model.setTier(Q, 'income', 'cut'), false,
    'Statutory income floor was cut');
  const beforeReset = JSON.stringify(Q.budget_game.tiers);
  model.setTier(Q, 'health', 'flagship');
  model.reset(Q);
  assert.strictEqual(JSON.stringify(Q.budget_game.tiers), beforeReset,
    'Reset did not restore the selected proposal');

  model.setFinancing(Q, 'none');
  model.setTier(Q, 'health', 'flagship');
  assert(!model.preview(Q).affordable,
    'Overspending passed allocation validation');
  model.reset(Q);
  const vote = model.preview(Q).vote;
  for (const reason of vote.reasons) {
    assert(/abstains|deal/.test(reason),
      'A posture changed without a displayed cause: ' + reason);
  }
}

{
  const no = engineAtBudget('opposition-fast-lane');
  const resources = no.Q.resources;
  const credibility = no.Q.labor_credibility;
  no.model.selectStrategy(no.Q, 'no');
  const result = no.model.submit(no.Q);
  assert(result.ok);
  assert.strictEqual(no.Q.resources, resources);
  assert.strictEqual(no.Q.budget_game.posture, 'no');
  assert.strictEqual(no.Q.annual_budget_concession,
    'No amendments or programme credit');
  assert.strictEqual(no.Q.labor_credibility, credibility);
  assert(!no.Q.budget_game.sejm.reasons.some(function(reason) {
    return /Lewica.*abstains|rebel/i.test(reason);
  }), 'Fast lane manufactured a Lewica rebellion');
}

{
  const bargain = engineAtBudget('opposition-bargain', {
    government_support_seats: 220,
    coalition_seats: 220,
  });
  bargain.Q.negotiation_leverage = 70;
  bargain.Q.government_support_seats = 220;
  bargain.Q.coalition_seats = 220;
  bargain.Q.left_seats = 26;
  assert.strictEqual(bargain.model.leverage(bargain.Q), 4);
  bargain.model.selectStrategy(bargain.Q, 'bargain');
  assert(bargain.model.toggleDemand(bargain.Q, 'health'));
  bargain.model.setPosture(bargain.Q, 'support');
  assert(bargain.model.submit(bargain.Q).ok);
  assert.strictEqual(bargain.Q.budget_game.posture, 'support');
  assert(bargain.Q.budget_game.demands.includes('health'));
}

{
  const shadow = engineAtBudget('opposition-shadow');
  const actual = JSON.stringify(shadow.Q.budget_game.draftTiers);
  const resources = shadow.Q.resources;
  shadow.model.selectStrategy(shadow.Q, 'shadow');
  shadow.model.setTier(shadow.Q, 'labour', 'flagship');
  assert(shadow.model.submit(shadow.Q).ok);
  assert.strictEqual(shadow.Q.resources, resources - 1);
  assert.strictEqual(JSON.stringify(shadow.Q.budget_game.tiers), actual,
    'Shadow allocations leaked into state spending');
  assert.strictEqual(shadow.Q.budget_game.shadow.tiers.labour, 'flagship');
}

{
  const wedge = engineAtBudget('opposition-wedge', {
    government_party: 'ko',
    prime_minister_party: 'ko',
    finance_minister_party: 'KO',
    government_support_seats: 240,
    coalition_seats: 240,
    ko_seats: 205,
    psl_seats: 35,
    ministry_ko_in_cabinet: 1,
    ministry_psl_in_cabinet: 1,
  });
  wedge.model.selectStrategy(wedge.Q, 'wedge');
  assert(wedge.model.setWedge(wedge.Q, 'psl'),
    'A genuinely unmet PSL red line was not targetable');
  assert(wedge.model.submit(wedge.Q).ok);
  assert(wedge.Q.budget_game.sejm.reasons.some(function(reason) {
    return /PSL abstains 35 MPs/.test(reason);
  }), 'Wedge did not disclose the exact affected delegation');
}

{
  const minority = engineAtBudget('minority-compromise', {
    left_in_government: 1,
    government_party: 'ko',
    prime_minister_party: 'ko',
    finance_minister_party: 'KO',
    government_support_seats: 220,
    coalition_seats: 220,
    ko_seats: 220,
    psl_seats: 30,
    ministry_ko_in_cabinet: 1,
  });
  minority.model.selectPreset(minority.Q, 'ko_proposal');
  let first = minority.model.submit(minority.Q);
  assert(first.ok && !first.vote.passed, 'Minority first vote did not fail');
  assert(minority.model.startRevision(minority.Q));
  minority.model.setFinancing(minority.Q, 'progressive');
  assert.strictEqual(minority.model.submit(minority.Q).error, 'revision',
    'One-decision revision was accepted');
  minority.model.toggleDeal(minority.Q, 'psl');
  const revised = minority.model.submit(minority.Q);
  assert(revised.ok && revised.vote.passed,
    'Displayed cross-party compromise did not produce a majority');
  assert.strictEqual(
    revised.vote.externalYes, minority.Q.psl_seats,
    'Outside deal did not move the whole PSL club'
  );

  const senate = minority.model.senatePreview(minority.Q);
  assert.strictEqual(senate.canOverride,
    minority.Q.budget_game.sejm.yes >= senate.overrideRequired);
  assert(minority.model.resolveSenate(minority.Q,
    senate.canOverride ? 'reject' : 'accept'));
  const debtBefore = minority.Q.public_debt;
  assert(minority.model.enact(minority.Q));
  assert.strictEqual(minority.model.enact(minority.Q), false,
    'Enactment effects ran twice');
  assert(minority.Q.public_debt >= debtBefore);
  assert.strictEqual(minority.Q.budget_execution_pending, 1);
  assert.strictEqual(minority.Q.budget_execution_due_year,
    minority.Q.budget_game.fiscalYear);
  assert.strictEqual(minority.Q.budget_execution_due_month, 1);

  minority.Q.year = minority.Q.budget_game.fiscalYear;
  minority.Q.month = 1;
  assert(minority.model.beginExecution(minority.Q));
  const execution = minority.Q.budget_game.execution;
  const commitment = minority.model.lines.find(function(line) {
    return minority.model.tiers[minority.Q.budget_game.tiers[line.id]] > 0;
  });
  if (commitment) {
    minority.model.setDelivery(minority.Q, commitment.id, 0);
  }
  const implementation = minority.model.finishExecution(minority.Q);
  assert(implementation);
  assert.strictEqual(minority.model.finishExecution(minority.Q), false,
    'Execution effects ran twice');
  assert(['Implemented', 'Partially implemented', 'Frozen']
    .includes(implementation.executionStatus));
}

{
  const delayed = engineAtBudget('delayed-2020-execution', {
    year: 2020,
    month: 2,
    annual_budget_year: 2019,
  });
  delayed.model.selectStrategy(delayed.Q, 'no');
  assert(delayed.model.submit(delayed.Q).ok);
  const senate = delayed.model.senatePreview(delayed.Q);
  assert(delayed.model.resolveSenate(delayed.Q,
    senate.canOverride ? 'reject' : 'accept'));
  assert(delayed.model.enact(delayed.Q));
  assert.strictEqual(delayed.Q.budget_execution_due_year, 2020);
  assert.strictEqual(delayed.Q.budget_execution_due_month, 3,
    'A delayed budget was executable in its enactment month');
}

for (const id of [
  'poland_events.budget_2019_sejm_vote_2020',
  'poland_events.budget_2020',
  'poland_events_2021_2023.budget_2021',
  'poland_events_2021_2023.december_2022',
  'poland_budget_2023_2026.budget_2023',
  'poland_budget_2023_2026.budget_2024',
  'poland_budget_2023_2026.budget_2025',
  'poland_budget_2023_2026.budget_2026',
  'poland_budget_2023_2026.execution_event',
]) {
  assert(game.scenes[id], 'Missing budget route ' + id);
}

const browserJs = fs.readFileSync(path.join(root, 'out', 'html', 'game.js'), 'utf8');
const browserCss = fs.readFileSync(path.join(root, 'out', 'html', 'game.css'), 'utf8');
assert(browserJs.includes('aria-live'));
assert(browserJs.includes('aria-pressed'));
assert(browserCss.includes('@media (max-width: 430px)'));
assert(browserCss.includes('@media (prefers-reduced-motion: reduce)'));
assert.strictEqual(
  (browserCss.match(/^\.government-detail \.disclosure-body/gm) || []).length,
  1,
  'Tracked stylesheet still contains duplicated build-appended rules'
);

console.log('budget board check passed: years, roles, votes, Senate and execution');
