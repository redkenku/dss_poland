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

{
  const deals = engineAtBudget('deal-round-trip', {
    left_in_government: 1,
    government_party: 'ko',
    prime_minister_party: 'ko',
    finance_minister_party: 'KO',
    ministry_ko_in_cabinet: 1,
    ministry_psl_in_cabinet: 1,
  });
  const Q = deals.Q;
  const before = JSON.stringify(Q.budget_game.tiers);
  const roomBefore = deals.model.preview(Q).remaining;
  deals.model.toggleDeal(Q, 'psl');
  assert.notStrictEqual(JSON.stringify(Q.budget_game.tiers), before,
    'Stamping a deal changed no allocation');
  deals.model.setTier(Q, 'energy', 'fund');
  deals.model.toggleDeal(Q, 'psl');
  assert.strictEqual(Q.budget_game.tiers.energy, 'fund',
    'Cancelling a deal discarded a later manual edit');
  deals.model.setTier(Q, 'energy', 'maintain');
  assert.strictEqual(JSON.stringify(Q.budget_game.tiers), before,
    'Cancelling a deal did not return the points it spent');
  assert.strictEqual(deals.model.preview(Q).remaining, roomBefore);
}

{
  // An outside club does not lend its votes for free.
  const politics = engineAtBudget('deal-politics', {
    left_in_government: 1,
    government_party: 'ko',
    prime_minister_party: 'ko',
    finance_minister_party: 'KO',
    government_support_seats: 220,
    coalition_seats: 220,
    ko_seats: 220,
    psl_seats: 30,
    pis_seats: 150,
    konf_seats: 20,
    ministry_ko_in_cabinet: 1,
  });
  const Q = politics.Q;
  const before = {
    konf: Q.konf_relation,
    dissent: Q.government_coalition_dissent,
    razem: Q.razem_dissent,
    progressives: Q.progressives_dissent,
    blur: Q.coalition_blur,
    credibility: Q.progressive_credibility,
    favors: Q.government_favors,
  };
  politics.model.toggleDeal(Q, 'konf');
  assert.strictEqual(Q.konf_relation, before.konf,
    'Stamping alone moved a relation before the roll call');
  politics.model.setFinancing(Q, 'broad');
  assert(politics.model.preview(Q).affordable,
    JSON.stringify(politics.model.preview(Q).breaches));
  assert(politics.model.submit(Q).ok);
  assert(Q.konf_relation > before.konf, 'A whole-club deal bought nothing');
  assert(Q.government_coalition_dissent > before.dissent,
    'An outside deal produced no coalition dissent');
  assert(Q.razem_dissent > before.razem, 'Razem ignored a deal with the right');
  assert(Q.progressives_dissent > before.progressives);
  assert(Q.coalition_blur > before.blur);
  assert(Q.progressive_credibility < before.credibility);
  assert(Q.government_favors > before.favors);
  const afterFirst = Q.government_coalition_dissent;
  politics.model.startRevision(Q);
  politics.model.setTier(Q, 'energy', 'fund');
  politics.model.setFinancing(Q, 'progressive');
  politics.model.submit(Q);
  assert.strictEqual(Q.government_coalition_dissent, afterFirst,
    'An unchanged deal was charged twice across a revision');
}

{
  // Sustaining someone else's budget from opposition is also a public act.
  const posture = engineAtBudget('posture-politics', {
    negotiation_leverage: 70,
    government_support_seats: 220,
    coalition_seats: 220,
  });
  const Q = posture.Q;
  const before = {
    pis: Q.pis_relation,
    razem: Q.razem_dissent,
    blur: Q.coalition_blur,
    credibility: Q.progressive_credibility,
  };
  posture.model.selectStrategy(Q, 'bargain');
  assert(posture.model.toggleDemand(Q, 'health'));
  posture.model.setPosture(Q, 'support');
  assert(posture.model.submit(Q).ok);
  assert(Q.pis_relation > before.pis,
    'Sustaining the cabinet moved no relation');
  assert(Q.razem_dissent > before.razem,
    'Razem accepted a vote for a PiS budget without complaint');
  assert(Q.coalition_blur > before.blur);
  assert(Q.progressive_credibility < before.credibility);

  const refusal = engineAtBudget('posture-refusal');
  refusal.model.selectStrategy(refusal.Q, 'no');
  const pisBefore = refusal.Q.pis_relation;
  const razemBefore = refusal.Q.razem_dissent;
  assert(refusal.model.submit(refusal.Q).ok);
  assert(refusal.Q.pis_relation < pisBefore, 'A no vote cost nothing');
  assert(refusal.Q.razem_dissent < razemBefore,
    'Razem did not notice the refusal');
}

{
  // The board must be able to print the reason the model would refuse with.
  const amend = engineAtBudget('amendment-reasons', {
    negotiation_leverage: 0,
    negotiation_capital: 0,
    government_support_seats: 260,
    coalition_seats: 260,
  });
  const Q = amend.Q;
  amend.model.selectStrategy(Q, 'bargain');
  assert.strictEqual(amend.model.leverage(Q), 1);
  const funded = amend.model.lines.find(function(line) {
    return amend.model.tiers[Q.budget_game.tiers[line.id]] >= 1;
  });
  if (funded) {
    const state = amend.model.demandState(Q, funded.id);
    assert.strictEqual(state.allowed, false);
    assert(/already funds/.test(state.reason));
  }
  assert(amend.model.toggleDemand(Q, 'health'));
  assert.strictEqual(amend.model.leverageSpent(Q.budget_game), 1);
  const second = amend.model.demandState(Q, 'education');
  assert.strictEqual(second.allowed, false);
  assert(/leverage/.test(second.reason), second.reason);
  assert.strictEqual(amend.model.toggleDemand(Q, 'education'), false);
}

{
  const billing = engineAtBudget('strategy-billing');
  const Q = billing.Q;
  const resources = Q.resources;
  billing.model.selectStrategy(Q, 'wedge');
  assert.strictEqual(billing.model.submit(Q).error, 'wedge');
  assert.strictEqual(Q.resources, resources,
    'An unsubmittable wedge was billed a resource');
  billing.model.selectStrategy(Q, 'bargain');
  assert.strictEqual(billing.model.submit(Q).error, 'demand');
  assert.strictEqual(Q.resources, resources);
}

{
  const pressures = engineAtBudget('pressure-effects', {
    left_in_government: 1,
    government_party: 'ko',
    prime_minister_party: 'ko',
    finance_minister_party: 'KO',
    ministry_ko_in_cabinet: 1,
    year: 2026,
    annual_budget_year: 2026,
  });
  const Q = pressures.Q;
  const model = pressures.model;
  const cards = model.pressureStatus(Q.budget_game);
  assert.strictEqual(cards.length, 3);
  for (const card of cards) model.setTier(Q, card.line, 'maintain');
  assert(model.pressureStatus(Q.budget_game).every(function(card) {
    return !card.met;
  }), 'Maintained lines still answered their pressure cards');
  model.setFinancing(Q, 'progressive');
  const trust = Q.public_trust;
  const delivery = Q.government_delivery;
  assert(model.preview(Q).affordable);
  const budgetRoom = Number(Q.budget) || 0;
  assert(model.submit(Q).ok);
  model.resolveSenate(Q, 'accept');
  const room = model.preview(Q).remaining;
  assert(model.enact(Q));
  assert.strictEqual(Q.annual_budget_pressures_met, 0);
  assert.strictEqual(Q.public_trust, trust - 3,
    'Ignored annual pressures cost nothing');
  assert.strictEqual(Q.government_delivery, delivery - 3);
  assert(Q.budget >= budgetRoom + Math.max(0, room),
    'Unspent budget room did not reach the spendable position');
  assert(/accepted in full|No Senate/.test(Q.annual_budget_senate),
    'The Senate answer was not recorded');
}

{
  const senate = engineAtBudget('senate-compromise', {
    left_in_government: 1,
    government_party: 'ko',
    prime_minister_party: 'ko',
    finance_minister_party: 'KO',
    ministry_ko_in_cabinet: 1,
  });
  const Q = senate.Q;
  assert(senate.model.submit(Q).ok);
  const resources = Q.resources;
  assert(senate.model.resolveSenate(Q, 'compromise'));
  assert.strictEqual(Q.resources, resources - 1);
  assert(/compromise/i.test(Q.annual_budget_senate),
    'A narrower Senate compromise left no record');
}

{
  // Every enacted budget must open its own implementation ledger, not just the
  // first one in a campaign.
  const ledger = engineAtBudget('two-ledgers', {
    left_in_government: 1,
    government_party: 'ko',
    prime_minister_party: 'ko',
    finance_minister_party: 'KO',
    ministry_ko_in_cabinet: 1,
  });
  const Q = ledger.Q;
  const model = ledger.model;
  const executionScene = game.scenes['poland_budget_2023_2026.execution_event'];
  assert.strictEqual(executionScene.maxVisits, undefined,
    'The implementation ledger can only be visited once per campaign');
  for (const year of [2024, 2025]) {
    Q.year = year;
    Q.month = 12;
    Q.annual_budget_year = year;
    ledger.engine.goToScene('poland_budget_2023_2026.annual_budget');
    assert(model.submit(Q).ok);
    model.resolveSenate(Q, 'accept');
    assert(model.enact(Q), 'Budget ' + year + ' did not enact');
    Q.year = year + 1;
    Q.month = 1;
    ledger.engine.goToScene('poland_budget_2023_2026.execution_event');
    assert.strictEqual(ledger.engine.state.sceneId,
      'poland_budget_2023_2026.execution_open',
      'Budget ' + year + ' never reached its implementation ledger');
    const choices = ledger.engine.getCurrentChoices()
      .map(function(choice) { return choice.id; });
    assert(choices.includes('poland_budget_2023_2026.finish_execution'));
    ledger.engine.choose(choices.indexOf(
      'poland_budget_2023_2026.finish_execution'));
  }
  assert.strictEqual(Q.budget_history.filter(function(item) {
    return item.executionStatus === 'Pending';
  }).length, 0, 'An enacted budget was left permanently pending');
}

{
  // A rejected submission has to keep its reason long enough to display it.
  const errors = engineAtBudget('submit-error-visible', {
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
  const Q = errors.Q;
  errors.model.selectPreset(Q, 'ko_proposal');
  function choose(id) {
    const choices = errors.engine.getCurrentChoices();
    const index = choices.findIndex(function(choice) { return choice.id === id; });
    assert(index >= 0, 'Missing choice ' + id);
    errors.engine.choose(index);
  }
  choose('poland_budget_2023_2026.submit_budget');
  assert.strictEqual(errors.engine.state.sceneId,
    'poland_budget_2023_2026.defeat');
  assert(errors.engine.getCurrentChoices().some(function(choice) {
    return choice.id === 'poland_budget_2023_2026.limp_on';
  }), 'A defeated cabinet cannot continue on its submitted draft');
  choose('poland_budget_2023_2026.revise_budget');
  errors.model.setFinancing(Q, 'progressive');
  choose('poland_budget_2023_2026.submit_budget');
  assert.strictEqual(errors.engine.state.sceneId,
    'poland_budget_2023_2026.budget_open');
  assert.strictEqual(Q.budget_submit_error, 'revision',
    'The rejection reason was cleared before the board could show it');
}

for (const id of [
  'poland_budget_2023_2026.limp_on',
  'poland_events_2020_02.budget_2019_sejm_vote_2020',
  'poland_events_2020_11.budget_2020',
  'poland_events_2021_12.budget_2021',
  'poland_events_2022_11.december_2022',
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
