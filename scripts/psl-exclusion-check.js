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

function contentText(content) {
  if (Array.isArray(content)) return content.map(contentText).join(' ');
  if (content && typeof content === 'object') return contentText(content.content);
  return content == null ? '' : String(content);
}

const eventId =
  'poland_events_2023_12.psl_exclusion_succession_2023';
const event = game.scenes[eventId];
assert(event, 'Compiled PSL exclusion event is missing');
const koExclusionId =
  'poland_events_2023_12.ko_exclusion_radicalisation_2023';
const thirdWayExclusionId =
  'poland_events_2023_12.third_way_excluded_by_ko_left_2023';
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

const equalityBase = {
  left_in_government: 1,
  government_has_confidence: 1,
  caretaker_government: 0,
  government_party: 'ko',
  ministry_ko_in_cabinet: 1,
  equality_minister_party: 'Lewica',
  left_is_junior_partner: 1,
  coalition_senior_partner: 'KO',
  coalition_objection_risk: 100,
  coalition_values_veto: 1,
  lgbt_equality_support: 55,
  lgbt_equality_salience: 50,
  lgbt_equality_backlash: 35,
  psl_coalition_dissent: 11,
};
const equalityWithoutPsl = newRun(Object.assign({}, equalityBase, {
  ministry_psl_in_cabinet: 0,
}));
equalityWithoutPsl.engine.goToScene('poland_equality_bill');
assert(!contentText(equalityWithoutPsl.engine.state.currentContent)
  .includes("PSL's negotiators regard values legislation"));
equalityWithoutPsl.engine.goToScene('poland_equality_bill.full');
assert.strictEqual(equalityWithoutPsl.Q.last_card_objector, 'KO');
assert.strictEqual(equalityWithoutPsl.Q.psl_coalition_dissent, 11);

const equalityWithPsl = newRun(Object.assign({}, equalityBase, {
  ministry_psl_in_cabinet: 1,
}));
equalityWithPsl.engine.goToScene('poland_equality_bill');
assert(contentText(equalityWithPsl.engine.state.currentContent)
  .includes("PSL's negotiators regard values legislation"));
equalityWithPsl.engine.goToScene('poland_equality_bill.full');
assert.strictEqual(
  equalityWithPsl.Q.last_card_objector,
  "PSL's conscience clause"
);
assert(equalityWithPsl.Q.psl_coalition_dissent > 11);

const ratchetBase = {
  left_in_government: 1,
  government_party: 'ko',
  psl_coalition_dissent: 60,
  government_coalition_dissent: 50,
  psl_relation: 45,
  rural_support: 35,
  coalition_break_threat: 1,
  abortion_cabinet_deadline: 1,
  third_way_response: '',
};
const ratchetWithoutPsl = newRun(Object.assign({}, ratchetBase, {
  ministry_psl_in_cabinet: 0,
}));
ratchetWithoutPsl.engine.goToScene(
  'poland_events_2025_06.td_psl_accounting'
);
assert.strictEqual(ratchetWithoutPsl.Q.psl_ratchet_score, 0);
assert(contentText(ratchetWithoutPsl.engine.state.currentContent)
  .includes('bargaining from outside government'));

const ratchetWithPsl = newRun(Object.assign({}, ratchetBase, {
  ministry_psl_in_cabinet: 1,
}));
ratchetWithPsl.engine.goToScene('poland_events_2025_06.td_psl_accounting');
assert(ratchetWithPsl.Q.psl_ratchet_score > ratchetWithoutPsl.Q.psl_ratchet_score);

const ruralBudgetWithoutPsl = newRun({
  left_in_government: 1,
  government_party: 'ko',
  ministry_psl_in_cabinet: 0,
  horizon_budget_authority: 1,
  government_coalition_dissent: 20,
});
ruralBudgetWithoutPsl.engine.goToScene(
  'poland_events_2026_09.horizon_rural'
);
assert.strictEqual(ruralBudgetWithoutPsl.Q.government_coalition_dissent, 20);
assert(contentText(ruralBudgetWithoutPsl.engine.state.currentContent)
  .includes('cannot turn that choice into a cabinet ultimatum'));

const ruralBudgetWithPsl = newRun({
  left_in_government: 1,
  government_party: 'ko',
  ministry_psl_in_cabinet: 1,
  horizon_budget_authority: 1,
  government_coalition_dissent: 20,
});
ruralBudgetWithPsl.engine.goToScene('poland_events_2026_09.horizon_rural');
assert.strictEqual(ruralBudgetWithPsl.Q.government_coalition_dissent, 18);

const farmersWithoutPsl = newRun({
  farmers_psl_in_cabinet: 0,
  psl_coalition_dissent: 10,
});
farmersWithoutPsl.engine.goToScene('poland_events_2024_02.farmers_psl');
assert.strictEqual(farmersWithoutPsl.Q.psl_coalition_dissent, 10);
assert(contentText(farmersWithoutPsl.engine.state.currentContent)
  .includes('parliamentary interlocutor'));

const farmersWithPsl = newRun({
  farmers_psl_in_cabinet: 1,
  psl_coalition_dissent: 10,
});
farmersWithPsl.engine.goToScene('poland_events_2024_02.farmers_psl');
assert.strictEqual(farmersWithPsl.Q.psl_coalition_dissent, 5);

console.log('psl-exclusion-check: all assertions passed');
