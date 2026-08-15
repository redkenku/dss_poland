'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dendry = require('dendrynexus/lib/engine');

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: undefined,
});

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
  function choose(id) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(choice) { return choice.id === id; });
    assert(index >= 0, 'Missing choice ' + id);
    engine.choose(index);
  }
  choose('root.campaign_game');
  choose('root.standard');
  engine.goToScene('poland_normalize');
  return {engine, Q: engine.state.qualities};
}

function nextMonth(Q, model, effect) {
  Q.month += 1;
  if (Q.month > 12) {
    Q.month = 1;
    Q.year += 1;
  }
  if (effect) model.enqueue(Q, effect);
  model.resolve(Q, {advance: true, finalize: true});
}

{
  const {Q} = newEngine('mood-v3-shares');
  const model = globalThis.polandPublicMoodModel;
  assert(model, 'Public mood model was not installed by normalization');
  assert.strictEqual(Q.public_opinion_version, 3);
  Object.keys(model.issues).forEach(function(issue) {
    const total = ['progressive', 'centrist', 'conservative'].reduce(
      function(sum, bloc) { return sum + Q[issue + '_' + bloc + '_ownership']; },
      0
    );
    assert(Math.abs(total - 100) < 0.000001, issue + ' ownership does not sum to 100');
  });
}

{
  const {engine, Q} = newEngine('mood-v3-legacy-capture');
  const model = globalThis.polandPublicMoodModel;
  const before = Q.lgbt_equality_support;
  Q.lgbt_equality_support += 4;
  engine.goToScene('poland_normalize');
  assert.strictEqual(Q.lgbt_equality_support, before,
    'Legacy direct write bypassed the queue');
  assert(Q.public_mood_effect_queue.some(function(effect) {
    return effect.issue === 'lgbt_equality' && effect.support === 4;
  }), 'Legacy direct write was not captured as an effect');
  model.resolve(Q, {advance: false, finalize: false});
  assert.strictEqual(Q.lgbt_equality_support, before + 4);
}

{
  const {engine, Q} = newEngine('mood-v3-authored-pending');
  const model = globalThis.polandPublicMoodModel;
  const before = Q.lgbt_equality_support;
  Q.public_mood_pending_lgbt_equality_support += 4;
  engine.goToScene('poland_normalize');
  assert.strictEqual(Q.lgbt_equality_support, before);
  assert.strictEqual(Q.public_mood_pending_lgbt_equality_support, 0);
  assert(Q.public_mood_effect_queue.some(function(effect) {
    return effect.issue === 'lgbt_equality' && effect.support === 4;
  }), 'Authored pending movement did not enter the canonical effect queue');
  model.resolve(Q, {advance: false, finalize: false});
  assert.strictEqual(Q.lgbt_equality_support, before + 4);
  model.resolve(Q, {advance: false, finalize: false});
  assert.strictEqual(Q.lgbt_equality_support, before + 4,
    'Repeated queue flushing applied an authored effect twice');
}

{
  const {Q} = newEngine('mood-v3-durable-support');
  const model = globalThis.polandPublicMoodModel;
  model.enqueue(Q, {
    mode: 'delta', source: 'event', actor: 'left', bloc: 'progressive',
    issue: 'lgbt_equality', title: 'Durability test', support: 20,
    salience: 5, backlash: 0, blocOwnership: 4, leftOwnership: 4,
  });
  model.resolve(Q, {advance: true, finalize: true});
  const shocked = Q.lgbt_equality_support;
  for (let month = 0; month < 24; month += 1) nextMonth(Q, model);
  assert(Q.lgbt_equality_support - 48 > (shocked - 48) / 2,
    'A durable support shock lost more than half its movement in 24 months');
}

{
  const {Q} = newEngine('mood-v3-structural-driver');
  const model = globalThis.polandPublicMoodModel;
  const supportBefore = Q.refugee_solidarity_support;
  Q.refugee_empathy += 10;
  nextMonth(Q, model);
  assert(Q.refugee_solidarity_support > supportBefore,
    'The established refugee-empathy tracker did not move the slow support target');
  assert(Q.public_opinion_bridge_pressure > 0,
    'Structural tracker movement was not retained as bridge diagnostics');
}

{
  const {Q} = newEngine('mood-v3-repeated-counter-campaign');
  const model = globalThis.polandPublicMoodModel;
  const supportBefore = Q.lgbt_equality_support;
  const leftBefore = Q.lgbt_equality_left_ownership;
  const conservativeBefore = Q.lgbt_equality_conservative_ownership;
  for (let month = 0; month < 12; month += 1) {
    nextMonth(Q, model, {
      mode: 'delta', source: 'ai', actor: 'pis', bloc: 'conservative',
      issue: 'lgbt_equality', title: 'Repeated conservative campaign',
      support: -0.5, salience: 2, backlash: 2,
      blocOwnership: 3, leftOwnership: -2,
    });
  }
  assert(Q.lgbt_equality_support <= supportBefore - 3);
  assert(Q.lgbt_equality_left_ownership <= leftBefore - 10);
  assert(Q.lgbt_equality_conservative_ownership >= conservativeBefore + 10);
}

{
  const {engine, Q} = newEngine('mood-v3-story-and-trend');
  const model = globalThis.polandPublicMoodModel;
  Q.vaccination_strategy = 'Public-health mobilisation';
  nextMonth(Q, model, {
    mode: 'story', source: 'event', actor: 'left', bloc: 'progressive',
    kind: 'pandemic_aftershock', issue: 'vaccination',
    title: 'Hospital overload and delayed care',
  });
  assert.notStrictEqual(Q.story_last_signal, 0,
    'Pandemic aftershock resolved to a zero signal');
  model.enqueue(Q, {
    mode: 'delta', source: 'event', actor: 'left', bloc: 'progressive',
    issue: 'abortion_rights', title: 'Trend test', support: 6,
    blocOwnership: 2, leftOwnership: 2,
  });
  nextMonth(Q, model);
  const trend = Q.public_climate_progressive_trend;
  assert(trend > 0, 'Progressive support did not create a positive trend');
  engine.goToScene('poland_normalize');
  assert.strictEqual(Q.public_climate_progressive_trend, trend,
    'Normalization erased the monthly climate trend');
}

{
  const {Q} = newEngine('mood-v3-formation-baseline');
  const model = globalThis.polandPublicMoodModel;
  Q.scenario_mode = 'formation_2023';
  Q.public_opinion_version = 2;
  model.normalize(Q);
  assert.strictEqual(Q.abortion_rights_support, 54);
  assert.strictEqual(Q.national_security_support, 82);
  assert.strictEqual(Q.public_climate_previous_index,
    Q.public_climate_progressive_index);
}

{
  const {engine, Q} = newEngine('mood-v3-hostile-salience');
  Q.social_spending_support = 45;
  Q.social_spending_salience = 100;
  Q.social_spending_backlash = 20;
  engine.goToScene('poland_rally');
  const choices = engine.getCurrentChoices();
  const index = choices.findIndex(function(choice) {
    return choice.id === 'poland_rally.work';
  });
  assert(index >= 0);
  engine.choose(index);
  assert.notStrictEqual(Q.card_public_response, 'breakthrough',
    'High salience converted minority support into a breakthrough');
}

function configureRivalMoodTest(engine, Q) {
  globalThis.polandPublicMoodModel.resolve(
    Q, {advance: false, finalize: false}
  );
  Q.public_mood_effect_log = [];
  Q.rival_ai_initialized = 1;
  Q.rival_ai_monthly_income_migrated = 1;
  ['pis', 'ko', 'psl', 'konf', 'p2050'].forEach(function(id) {
    Q[id + '_org_resources'] = 0;
    Q[id + '_org_income'] = 0;
  });
  Q.rival_income_last_month_index = Q.year * 12 + Q.month;
  Q.rival_ai_last_month_key = '';
  engine.random.uint32 = function() { return 0; };
}

{
  const {engine, Q} = newEngine('mood-v3-zero-resource-ai');
  configureRivalMoodTest(engine, Q);
  engine.goToScene('poland_party_ai');
  assert(!Q.public_mood_effect_log.some(function(effect) {
    return effect.source === 'ai';
  }), 'A maintenance or unaffordable AI action changed public mood');
}

{
  const {engine, Q} = newEngine('mood-v3-one-resource-ai');
  configureRivalMoodTest(engine, Q);
  Q.pis_org_resources = 1;
  Q.pis_solidarist_share = 90;
  Q.pis_market_hardliner_share = 10;
  Q.social_spending_salience = 0;
  Q.vaccination_salience = 0;
  ['abortion_rights', 'lgbt_equality', 'secular_state',
    'refugee_solidarity'].forEach(function(issue) {
    Q[issue + '_salience'] = 100;
  });
  engine.goToScene('poland_party_ai');
  const effect = Q.public_mood_effect_log.find(function(entry) {
    return entry.source === 'ai' && entry.actor === 'pis';
  });
  assert(effect, 'A funded one-resource rival campaign produced no mood effect');
  assert.strictEqual(effect.blocOwnership, 3);
  assert.strictEqual(effect.salience, 4);
  assert.strictEqual(effect.backlash, 3);
  assert.strictEqual(effect.leftOwnership, -2);
  assert(Q.rival_month_headline.includes('Mood contest:'),
    'The rival headline omitted the resolved mood target and effect');
}

{
  const {engine, Q} = newEngine('mood-v3-hard-two-resource-ai');
  configureRivalMoodTest(engine, Q);
  Q.hard_mode = 1;
  Q.pis_org_resources = 2;
  Q.pis_solidarist_share = 90;
  Q.pis_market_hardliner_share = 10;
  Q.social_spending_salience = 100;
  Q.vaccination_salience = 100;
  ['abortion_rights', 'lgbt_equality', 'secular_state',
    'refugee_solidarity'].forEach(function(issue) {
    Q[issue + '_salience'] = 0;
  });
  engine.goToScene('poland_party_ai');
  const effect = Q.public_mood_effect_log.find(function(entry) {
    return entry.source === 'ai' && entry.actor === 'pis';
  });
  assert(effect, 'A funded hard-mode rival campaign produced no mood effect');
  assert.strictEqual(effect.blocOwnership, 6);
  assert.strictEqual(effect.salience, 8);
  assert.strictEqual(effect.support, 6);
  assert.strictEqual(effect.backlash, 1.5);
  assert.strictEqual(effect.leftOwnership, -4);
}

{
  const {engine, Q} = newEngine('mood-v3-ko-equality-ai');
  configureRivalMoodTest(engine, Q);
  Q.ko_org_resources = 1;
  Q.ko_social_liberal_share = 90;
  Q.ko_classical_liberal_share = 10;
  Q.social_spending_salience = 0;
  Q.vaccination_salience = 0;
  ['abortion_rights', 'lgbt_equality', 'secular_state',
    'refugee_solidarity'].forEach(function(issue) {
    Q[issue + '_salience'] = 100;
  });
  const before = {};
  ['abortion_rights', 'lgbt_equality', 'secular_state'].forEach(function(issue) {
    before[issue] = {
      support: Q[issue + '_support'],
      progressive: Q[issue + '_progressive_ownership'],
      left: Q[issue + '_left_ownership'],
    };
  });
  engine.goToScene('poland_party_ai');
  const effect = Q.public_mood_effect_log.find(function(entry) {
    return entry.source === 'ai' && entry.actor === 'ko';
  });
  assert(effect && before[effect.issue],
    'KO did not select an equality issue for its social-liberal campaign');
  assert(Q[effect.issue + '_support'] > before[effect.issue].support);
  assert(Q[effect.issue + '_progressive_ownership'] >
    before[effect.issue].progressive);
  assert(Q[effect.issue + '_left_ownership'] < before[effect.issue].left);
}

{
  const {engine, Q} = newEngine('mood-v3-group-reception');
  const model = globalThis.polandPublicMoodModel;
  engine.goToScene('poland_polling');
  const metroBefore = Q.metropolitan_liberals_left;
  const ruralBefore = Q.rural_localists_left;
  model.enqueue(Q, {
    mode: 'delta', source: 'event', actor: 'left', bloc: 'progressive',
    issue: 'lgbt_equality', title: 'Equality reception contrast',
    support: 15, salience: 35, backlash: 0,
    blocOwnership: 25, leftOwnership: 25,
  });
  model.resolve(Q, {advance: false, finalize: false});
  Q.poll_state_month_key = -1;
  engine.goToScene('poland_polling');
  const metroMovement = Q.metropolitan_liberals_left - metroBefore;
  const ruralMovement = Q.rural_localists_left - ruralBefore;
  assert(metroMovement > ruralMovement,
    'Metropolitan and rural blocs did not react differently to equality mood');
}

{
  const {engine, Q} = newEngine('mood-v3-reform-mandate');
  const model = globalThis.polandPublicMoodModel;
  Q.reform_ceiling_issue = 'marriage';
  Q.reform_ceiling_target = 3;
  engine.goToScene('poland_reform_ceiling');
  const mandateBefore = Q.reform_ceiling_mandate;
  model.enqueue(Q, {
    mode: 'delta', source: 'reform', actor: 'left', bloc: 'progressive',
    issue: 'lgbt_equality', title: 'Public mandate test',
    support: 10, salience: 5, backlash: -10,
    blocOwnership: 15, leftOwnership: 10,
  });
  engine.goToScene('poland_reform_ceiling');
  assert(Q.reform_ceiling_mandate > mandateBefore,
    'Queued mood changes did not alter the reform mandate ceiling');
}

const source = fs.readFileSync(
  path.join(projectRoot, 'source', 'scenes', 'poland_advance.scene.dry'),
  'utf8'
);
assert(!source.includes('kind == "pandemic_aftershock"') ||
  globalThis.polandPublicMoodModel.storyKinds.includes('pandemic_aftershock'));
for (const file of [
  'poland_rally.scene.dry', 'poland_equality_bill.scene.dry',
  'poland_health_compact.scene.dry', 'poland_workers_public_services.scene.dry',
  'poland_programme_convention.scene.dry', 'poland_rural_hinge.scene.dry',
]) {
  const card = fs.readFileSync(path.join(projectRoot, 'source', 'scenes', 'cards', file), 'utf8');
  assert(!card.includes('salience / 55 - backlash / 60'),
    file + ' still treats salience as favourable evidence');
}

function sceneFiles(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(function(entry) {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sceneFiles(file) :
      (entry.name.endsWith('.scene.dry') ? [file] : []);
  });
}
const knownKinds = new Set(globalThis.polandPublicMoodModel.storyKinds);
sceneFiles(path.join(projectRoot, 'source', 'scenes')).forEach(function(file) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/story_queue\.push\(\{([\s\S]*?)\}\);/g)) {
    const kind = match[1].match(/kind:\s*"([^"]+)"/);
    assert(!kind || knownKinds.has(kind[1]),
      path.relative(projectRoot, file) + ' queues unknown story kind ' +
        (kind ? kind[1] : 'none'));
  }
  if (!['root.scene.dry', 'poland_normalize.scene.dry',
    'poland_advance.scene.dry'].includes(path.basename(file))) {
    const directWrite = text.match(/\b(?:Q\.)?(?:abortion_rights|refugee_solidarity|border_security|vaccination|social_spending|lgbt_equality|secular_state|rule_of_law|national_security)_(?:support|salience|backlash|left_ownership)\s*(?:\+\+|--|[+\-*/]?=)/);
    assert(!directWrite,
      path.relative(projectRoot, file) + ' still writes an issue field directly');
  }
});

console.log('Public mood v3 checks passed.');
