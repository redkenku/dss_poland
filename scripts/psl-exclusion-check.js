'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dendry = require('dendrynexus/lib/engine');

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: undefined,
});

const gameJson = fs.readFileSync(
  path.resolve(__dirname, '..', 'out', 'game.json'),
  'utf8'
);
let game;
dendry.convertJSONToGame(gameJson, function(error, converted) {
  if (error) throw error;
  game = converted;
});

function newRun(overrides) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame(['psl-exclusion-check']);
  for (const sceneId of ['root.campaign_game', 'root.standard']) {
    const index = engine.getCurrentChoices().findIndex(function(choice) {
      return choice.id === sceneId;
    });
    assert(index >= 0, 'Missing setup choice ' + sceneId);
    engine.choose(index);
  }
  Object.assign(engine.state.qualities, overrides);
  return {engine: engine, Q: engine.state.qualities};
}

const eventId =
  'poland_events_2023_2024.psl_exclusion_succession_2023';
const event = game.scenes[eventId];
assert(event, 'Compiled PSL exclusion event is missing');
const koExclusionId =
  'poland_events_2023_2024.ko_exclusion_radicalisation_2023';
const thirdWayExclusionId =
  'poland_events_2023_2024.third_way_excluded_by_ko_left_2023';
const koExclusion = game.scenes[koExclusionId];
const thirdWayExclusion = game.scenes[thirdWayExclusionId];
assert(koExclusion, 'Compiled KO exclusion event is missing');
assert(thirdWayExclusion, 'Compiled whole-Third-Way exclusion event is missing');

const zgorzelski = newRun({
  continuous_campaign: 1,
  year: 2023,
  month: 12,
  formation_complete: 1,
  formation_coalition_code: 'ko_p2050_left',
  psl_2023_exclusion_crisis_done: 0,
  psl_conservative_share: 51,
  psl_agrarian_pragmatist_share: 35,
});
assert(event.viewIf(zgorzelski.engine, zgorzelski.Q));
zgorzelski.engine.goToScene(eventId);
assert.strictEqual(zgorzelski.Q.psl_leader, 'Piotr Zgorzelski');
assert.strictEqual(zgorzelski.Q.psl_right_alignment_locked, 1);
zgorzelski.engine.goToScene('poland_normalize');
for (const pair of ['left_psl', 'ko_psl', 'psl_p2050']) {
  assert.strictEqual(zgorzelski.Q['coalition_viable_' + pair], 0);
}
assert.strictEqual(zgorzelski.Q.coalition_viable_pis_psl, 1);
assert.strictEqual(zgorzelski.Q.coalition_viable_psl_konf, 1);

const sawicki = newRun({
  continuous_campaign: 1,
  year: 2023,
  month: 12,
  formation_complete: 1,
  formation_coalition_code: 'ko_p2050_left',
  psl_2023_exclusion_crisis_done: 0,
  psl_conservative_share: 30,
  psl_agrarian_pragmatist_share: 55,
});
sawicki.engine.goToScene(eventId);
assert.strictEqual(sawicki.Q.psl_leader, 'Marek Sawicki');

sawicki.Q.formation_coalition_code = 'democratic_2023';
sawicki.Q.psl_2023_exclusion_crisis_done = 0;
assert(!event.viewIf(sawicki.engine, sawicki.Q));

const noKo = newRun({
  continuous_campaign: 1,
  year: 2023,
  month: 12,
  formation_complete: 1,
  formation_coalition_code: 'left_p2050',
  psl_2023_exclusion_crisis_done: 0,
  psl_conservative_share: 51,
  psl_agrarian_pragmatist_share: 35,
});
assert(event.viewIf(noKo.engine, noKo.Q),
  'PSL must still turn right when Lewica and Poland 2050 exclude it with KO');
noKo.engine.goToScene(eventId);
assert.strictEqual(noKo.Q.psl_right_alignment_locked, 1);

const radicalKo = newRun({
  continuous_campaign: 1,
  year: 2023,
  month: 12,
  formation_complete: 1,
  formation_coalition_code: 'left_third',
  sejm_list_outcome: 'democratic_8',
  ko_exclusion_radicalisation_done: 0,
  ko_right_score: 50,
});
assert(koExclusion.viewIf(radicalKo.engine, radicalKo.Q));
radicalKo.engine.goToScene(koExclusionId);
assert.strictEqual(radicalKo.Q.ko_opposition_hardline, 1);
assert.strictEqual(radicalKo.Q.ko_right_score, 58);
assert(radicalKo.Q.ko_opposition_strategy.includes('Common-list betrayal'));

const wholeThirdWay = newRun({
  continuous_campaign: 1,
  year: 2023,
  month: 12,
  formation_complete: 1,
  formation_coalition_code: 'ko_left',
  formation_coalition_seats: 259,
  formation_coalition_support_seats: 259,
  third_way_split: 0,
  third_way_ko_left_exclusion_done: 0,
  third_way_cohesion: 58,
});
assert(thirdWayExclusion.viewIf(wholeThirdWay.engine, wholeThirdWay.Q));
wholeThirdWay.engine.goToScene(thirdWayExclusionId);
assert.strictEqual(wholeThirdWay.Q.third_way_split, 0);
assert.strictEqual(wholeThirdWay.Q.third_way_active, 1);
assert.strictEqual(wholeThirdWay.Q.third_way_cohesion, 68);
wholeThirdWay.Q.third_way_ko_left_exclusion_done = 0;
wholeThirdWay.Q.formation_coalition_support_seats = 260;
assert(!thirdWayExclusion.viewIf(wholeThirdWay.engine, wholeThirdWay.Q),
  'Third Way is not wholly left behind when the cabinet borrows its votes');

console.log('psl-exclusion-check: all assertions passed');
