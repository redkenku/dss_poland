'use strict';

// Targeted playthrough for the Second War at the Top. The chain is relative-
// timed, so this checks both its political gates and the actual sequence rather
// than duplicating the predicates as static source assertions.

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

function newEngine(seed) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([seed]);
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices() || [];
    const index = choices.findIndex(function(choice) {
      return choice.id === sceneId;
    });
    assert(index >= 0, 'Missing choice ' + sceneId + ' among ' +
      choices.map(function(choice) { return choice.id; }).join(', '));
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  return { engine: engine, choose: choose, Q: engine.state.qualities };
}

function normalize(engine) {
  engine.goToScene('poland_normalize');
}

function eventIsLive(engine, sceneId) {
  const scene = game.scenes[sceneId];
  assert(scene, 'Missing scene ' + sceneId);
  return engine._runPredicate(scene.viewIf, true);
}

function selectableChoices(engine, sceneId) {
  return (engine._compileChoices(game.scenes[sceneId]) || [])
    .filter(function(choice) { return choice.canChoose; })
    .map(function(choice) { return choice.id; });
}

function visibleChoices(engine, sceneId) {
  return (engine._compileChoices(game.scenes[sceneId]) || [])
    .map(function(choice) { return choice.id; });
}

function contentText(content) {
  if (Array.isArray(content)) return content.map(contentText).join(' ');
  if (content && typeof content === 'object') {
    return contentText(content.content);
  }
  return content == null ? '' : String(content);
}

const CAMPS = {
  ko: {
    president_name: 'Rafał Trzaskowski',
    president_party: 'ko',
    prime_minister: 'Donald Tusk',
    government_party: 'ko',
    left_president: 0,
    left_in_government: 1,
  },
  lewica: {
    president_name: 'Adrian Zandberg',
    president_party: 'lewica',
    prime_minister: 'Krzysztof Gawkowski',
    government_party: 'lewica',
    left_president: 1,
    left_in_government: 1,
  },
  pis: {
    president_name: 'Karol Nawrocki',
    president_party: 'pis',
    prime_minister: 'Przemysław Czarnek',
    government_party: 'pis',
    left_president: 0,
    left_in_government: 0,
  },
};

function setCamp(Q, camp, overrides) {
  Object.assign(Q, {
    continuous_campaign: 1,
    government_has_confidence: 1,
    caretaker_government: 0,
    formation_in_progress: 0,
  }, CAMPS[camp], overrides || {});
}

function openAtTribunal(run, camp, overrides) {
  setCamp(run.Q, camp, overrides);
  normalize(run.engine);
  assert.strictEqual(run.Q.war_top_eligible, 1, camp + ' should be eligible');
  run.engine.goToScene('poland_events_2026.tribunal_competence_2026');
  assert.strictEqual(run.Q.war_top_stage, 1, camp + ' chain did not open');
  assert.strictEqual(run.Q.war_top_camp, camp);
}

// Cohabitation never opens the chain, while each same-camp pairing does.
for (const cohabitation of [
  { cabinet: 'ko', president_name: 'Andrzej Duda', president_party: 'pis' },
  { cabinet: 'pis', president_name: 'Rafał Trzaskowski', president_party: 'ko' },
  { cabinet: 'ko', president_name: 'Adrian Zandberg', president_party: 'lewica' },
]) {
  const run = newEngine('war-top-cohabitation-' + cohabitation.cabinet);
  setCamp(run.Q, cohabitation.cabinet, cohabitation);
  normalize(run.engine);
  assert.strictEqual(run.Q.war_top_eligible, 0);
  run.engine.goToScene('poland_events_2026.tribunal_competence_2026');
  assert.strictEqual(run.Q.war_top_stage, 0,
    'Cohabitation must not open the chain');
}

for (const camp of Object.keys(CAMPS)) {
  openAtTribunal(newEngine('war-top-open-' + camp), camp);
}

// Duda is excluded even when the cabinet is PiS.
{
  const run = newEngine('war-top-duda-gate');
  setCamp(run.Q, 'pis', { president_name: 'Andrzej Duda' });
  normalize(run.engine);
  assert.strictEqual(run.Q.war_top_eligible, 0,
    'Duda must remain outside the PiS version of the chain');
}

// The named-pair heat table sends Biejat to the quiet landing and Gawkowski
// into the declarations stage.
{
  const soft = newEngine('war-top-biejat');
  openAtTribunal(soft, 'lewica', { prime_minister: 'Magdalena Biejat' });
  soft.Q.time = soft.Q.war_top_started_time + 2;
  soft.engine.goToScene('poland_war_on_top.war_top_palace_alone');
  soft.Q.time = soft.Q.war_top_started_time + 5;
  assert(eventIsLive(
    soft.engine, 'poland_war_on_top.war_top_protocol_holds'
  ), 'Zandberg–Biejat should cool into the protocol settlement');
  soft.engine.goToScene('poland_war_on_top.war_top_protocol_holds');
  assert.strictEqual(soft.Q.war_top_stage, 5);

  const harsh = newEngine('war-top-gawkowski');
  openAtTribunal(harsh, 'lewica');
  harsh.Q.time = harsh.Q.war_top_started_time + 2;
  harsh.engine.goToScene('poland_war_on_top.war_top_palace_alone');
  harsh.Q.time = harsh.Q.war_top_started_time + 5;
  assert(eventIsLive(
    harsh.engine, 'poland_war_on_top.war_top_camp_splits'
  ), 'Zandberg–Gawkowski should reach the declarations split');
  harsh.engine.goToScene('poland_war_on_top.war_top_camp_splits');
  assert.strictEqual(harsh.Q.war_top_stage, 3);
}

// A camp nominee who already holds either office falls back to Bodnar.
{
  const run = newEngine('war-top-nominee-fallback');
  setCamp(run.Q, 'lewica', {
    president_name: 'Marcelina Zawisza',
    president_party: 'lewica',
    left_president: 1,
  });
  Object.assign(run.Q, {
    war_top_stage: 3,
    war_top_camp: 'lewica',
    war_top_started_time: 50,
    war_top_palace_bloc: 70,
    war_top_heat: 70,
    time: 57,
  });
  normalize(run.engine);
  run.engine.goToScene('poland_war_on_top.war_top_nomination');
  assert.strictEqual(run.Q.war_top_nominee, 'Adam Bodnar');

  const incumbent = newEngine('war-top-nominee-incumbent-fallback');
  setCamp(incumbent.Q, 'lewica', {
    prime_minister: 'Marcelina Zawisza',
  });
  Object.assign(incumbent.Q, {
    war_top_stage: 3,
    war_top_camp: 'lewica',
    war_top_started_time: 50,
    war_top_palace_bloc: 70,
    war_top_heat: 70,
    time: 57,
  });
  normalize(incumbent.engine);
  incumbent.engine.goToScene('poland_war_on_top.war_top_nomination');
  assert.strictEqual(incumbent.Q.war_top_nominee, 'Adam Bodnar');
}

// Play one complete KO chain, including visible relative dates, a passed roll
// call and monotonic stage movement.
{
  const run = newEngine('war-top-full-playthrough');
  openAtTribunal(run, 'ko');
  const stages = [run.Q.war_top_stage];

  run.Q.time = run.Q.war_top_started_time + 2;
  run.Q.date_label = 'August 2026';
  assert(eventIsLive(run.engine,
    'poland_war_on_top.war_top_palace_alone'));
  run.engine.goToScene('poland_war_on_top.war_top_palace_alone');
  assert(contentText(run.engine.state.currentContent).includes('August 2026'),
    'The stage-two heading did not render date_label');
  stages.push(run.Q.war_top_stage);
  run.choose('poland_war_on_top.war_top_back_palace');

  run.Q.time = run.Q.war_top_started_time + 5;
  run.Q.date_label = 'November 2026';
  assert(eventIsLive(run.engine,
    'poland_war_on_top.war_top_camp_splits'));
  run.engine.goToScene('poland_war_on_top.war_top_camp_splits');
  assert(contentText(run.engine.state.currentContent).includes('November 2026'),
    'The split heading did not render date_label');
  stages.push(run.Q.war_top_stage);
  run.choose('poland_war_on_top.war_top_split_side');

  run.Q.time = run.Q.war_top_started_time + 7;
  run.Q.date_label = 'January 2027';
  run.Q.coalition_seats = 460;
  assert(eventIsLive(run.engine,
    'poland_war_on_top.war_top_nomination'));
  run.engine.goToScene('poland_war_on_top.war_top_nomination');
  assert(contentText(run.engine.state.currentContent).includes('January 2027'),
    'The nomination heading did not render date_label');
  stages.push(run.Q.war_top_stage);
  run.Q.war_top_roll_base = 460;
  run.choose('poland_war_on_top.war_top_nomination_back');
  run.choose('poland_war_on_top.war_top_roll');
  assert.strictEqual(run.Q.war_top_nomination_passed, 1);
  assert.strictEqual(run.Q.prime_minister, run.Q.war_top_nominee,
    'A passed confidence roll must install the nominee');

  run.Q.date_label = 'February 2027';
  assert(eventIsLive(run.engine,
    'poland_war_on_top.war_top_settlement'));
  run.engine.goToScene('poland_war_on_top.war_top_settlement');
  assert(contentText(run.engine.state.currentContent).includes('February 2027'),
    'The settlement heading did not render date_label');
  stages.push(run.Q.war_top_stage);
  for (let index = 1; index < stages.length; index += 1) {
    assert(stages[index] >= stages[index - 1],
      'The chain moved backwards: ' + stages.join(' → '));
  }
}

// Losing either office suspends an unfinished war.
{
  const run = newEngine('war-top-suspension');
  openAtTribunal(run, 'ko');
  run.Q.government_party = 'pis';
  normalize(run.engine);
  assert.strictEqual(run.Q.war_top_suspended, 1,
    'The chain must suspend when its camp loses the cabinet');
}

// Every decision stage keeps at least two visible responses and at least one
// selectable response with no money in a Left cabinet, as a junior coalition
// partner and in opposition.
const configurations = [
  { name: 'Left cabinet', camp: 'lewica' },
  { name: 'junior coalition partner', camp: 'ko' },
  { name: 'opposition', camp: 'pis' },
];
const decisionScenes = [
  'poland_events_2026.tribunal_competence_2026',
  'poland_war_on_top.war_top_palace_alone',
  'poland_war_on_top.war_top_camp_splits',
  'poland_war_on_top.war_top_nomination',
];
for (const configuration of configurations) {
  const run = newEngine('war-top-options-' + configuration.camp);
  setCamp(run.Q, configuration.camp, {
    resources: 0,
    justice_minister_party: configuration.camp == 'lewica'
      ? 'Lewica' : configuration.camp.toUpperCase(),
  });
  Object.assign(run.Q, {
    war_top_stage: 3,
    war_top_camp: configuration.camp,
    war_top_started_time: 40,
    war_top_palace_bloc: 70,
    war_top_heat: 70,
    time: 47,
  });
  normalize(run.engine);
  for (const sceneId of decisionScenes) {
    assert(
      visibleChoices(run.engine, sceneId).length >= 2,
      sceneId + ' has fewer than two visible choices in ' +
        configuration.name
    );
    assert(
      selectableChoices(run.engine, sceneId).length >= 1,
      sceneId + ' has no selectable choice in ' + configuration.name
    );
  }
}

// The settled record reaches the real 2027 vote bonus and the ending text.
{
  const run = newEngine('war-top-2027-callback');
  Object.assign(run.Q, {
    year: 2027,
    month: 9,
    war_top_stage: 5,
    war_top_camp: 'ko',
    war_top_settlement: 'Rupture — KO enters the election divided',
    war_top_split: 1,
    war_top_left_side: 'institutions',
    snap_campaign_left_bonus: 0.5,
  });
  run.engine.goToScene('poland_events_2027.campaign_closes_2027');
  assert.strictEqual(run.Q.war_top_2027_bonus, 0.85);
  assert.strictEqual(run.Q.snap_campaign_left_bonus, 1.35);
  assert(contentText(run.engine.state.currentContent)
    .includes('Rupture — KO enters the election divided'));

  Object.assign(run.Q, {
    war_top_camp: 'lewica',
    war_top_left_side: 'institutions',
    war_top_settlement: 'Rupture — the Left enters the election divided',
  });
  run.engine.goToScene('poland_ending.prepare_epilogue');
  assert(run.Q.ending_war_top_legacy.includes('Left enters the election'),
    'The ending must retain the war settlement');
  assert(run.Q.ending_achievements.includes('constitutional protocol'),
    'An institutional settlement must reach the achievements record');
  assert(run.Q.ending_failures.includes('Left split'),
    'A Left rupture must reach the failures record');
}

console.log('war-on-top-check: all assertions passed');
