'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const read = function(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
};
const game = require(path.join(projectRoot, 'out', 'game.json'));
const catalogue = game.scenes.poland_achievements;
const menu = game.scenes['root.start_menu'];
const catalogueSource = read('source/scenes/poland_achievements.scene.dry');
const normalizeSource = read('source/scenes/poland_normalize.scene.dry');
const browserJavaScript = read('out/html/game.js');
const browserCss = read('out/html/game.css');

const catalogueIds = Array.from(
  catalogueSource.matchAll(/^\s*\["([a-z0-9_]+)",/gm),
  function(match) { return match[1]; }
);
const catalogueNames = new Map(Array.from(
  catalogueSource.matchAll(
    /^\s*\["([a-z0-9_]+)", "[^"]+", "([^"]+)",/gm
  ),
  function(match) { return [match[1], match[2]]; }
));
const evaluatorStart = normalizeSource.indexOf('const checks = [',
  normalizeSource.indexOf('polandAchievementEvaluator'));
const evaluatorEnd = normalizeSource.indexOf('\n        ];', evaluatorStart);
const evaluatorBlock = normalizeSource.slice(evaluatorStart, evaluatorEnd);
const evaluatorIds = Array.from(
  evaluatorBlock.matchAll(/^\s*\["([a-z0-9_]+)"/gm),
  function(match) { return match[1]; }
);
const toastStart = browserJavaScript.indexOf('var achievementDefinitions = {');
const toastEnd = browserJavaScript.indexOf('var achievementToastQueue', toastStart);
const toastBlock = browserJavaScript.slice(toastStart, toastEnd);
const toastIds = Array.from(
  toastBlock.matchAll(/^\s*([a-z0-9_]+): \{name:/gm),
  function(match) { return match[1]; }
);
const toastNames = new Map(Array.from(
  toastBlock.matchAll(/^\s*([a-z0-9_]+): \{name: "([^"]+)"/gm),
  function(match) { return [match[1], match[2]]; }
));
const sorted = function(values) { return values.slice().sort(); };

assert(catalogue, 'compiled achievement catalogue is missing');
assert(
  menu.options.some(function(option) {
    return option.id === '@poland_achievements';
  }),
  'title menu does not link to achievements'
);
assert.strictEqual(catalogue.viewIf, undefined,
  'achievement catalogue must be visible from the title screen');
assert.strictEqual(catalogueIds.length, 84,
  'catalogue must contain exactly 84 achievements');
assert.strictEqual(new Set(catalogueIds).size, 84,
  'catalogue achievement IDs must be unique');
assert.deepStrictEqual(sorted(evaluatorIds), sorted(catalogueIds),
  'evaluator IDs differ from the catalogue');
assert.deepStrictEqual(sorted(toastIds), sorted(catalogueIds),
  'toast IDs differ from the catalogue');
assert.deepStrictEqual(toastNames, catalogueNames,
  'toast names differ from the authoritative catalogue');
assert(JSON.stringify(catalogue).includes('game_achievement_'),
  'catalogue does not distinguish the current playthrough');
assert(JSON.stringify(catalogue).includes('achievement_catalogue_html'),
  'catalogue does not render visible locked requirements');
assert(catalogueSource.includes('id="achievement-catalogue-list"') &&
  catalogueSource.includes('catalogueList.innerHTML = Q.achievement_catalogue_html'),
  'catalogue HTML has no rendered mount point');
assert(catalogueSource.includes('<table class=\\"achievement-table\\">') &&
  catalogueSource.includes('achievement-table-requirement'),
  'catalogue is not rendered as a two-line achievement table');
assert(!catalogueSource.includes('Q.achievement_catalogue_html += "<h2>"'),
  'catalogue still renders category headings');
assert(!catalogueSource.includes('{! return Q.achievement_'),
  'catalogue uses non-evaluating inline Dendry magic');

for (const sceneId of [
  'poland_election.sejm_threshold_defeat',
  'poland_ending.final_assessment',
]) {
  assert.strictEqual(game.scenes[sceneId].achievement, undefined,
    sceneId + ' still has an unconditional achievement');
}
assert(read('source/scenes/poland_ending.scene.dry').includes(
  'polandAchievementEvaluator(this, Q)'
), 'completed epilogue does not invoke the gated evaluator');

for (const marker of [
  'nuclear_ever_shelved',
  'petrochemical_statute_enacted',
  'petrochemical_unlawful_seizure',
  'nationalisation_doctrine_adopted',
  'hostile_policy_interview_done',
  'budget_concession_after_defeat',
  'emergency_capital_controls',
  'government_removed_by_vonc',
  'left_club_collapsed',
  'ukraine_neutrality_demanded',
]) {
  assert(read('source/scenes/root.scene.dry').includes('Q.' + marker + ' = 0;'),
    marker + ' is not initialised');
  assert(normalizeSource.includes('q.' + marker),
    marker + ' is not consumed by the evaluator');
}

assert(browserJavaScript.includes("'game_achievement_' + achievementName"),
  'achievement hook does not suppress repeat toasts');
assert(browserJavaScript.includes('window.showAchievementToast(achievementName)'),
  'achievement hook does not show the toast');
assert(browserJavaScript.includes("'img/achievement/' + achievementName + '.png'"),
  'achievement toast does not probe for an optional image');
assert(browserJavaScript.includes('image.onerror'),
  'achievement toast has no text-only image fallback');
assert(/\.achievement-toast\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?left:\s*50%;/.test(
  browserCss
), 'achievement toast is not fixed at the bottom centre');

for (const match of toastBlock.matchAll(/image: "([^"]+)"/g)) {
  assert(fs.existsSync(path.join(projectRoot, 'out', 'html', match[1])),
    'toast image does not exist: ' + match[1]);
}

const evaluatorMarker = normalizeSource.indexOf(
  '// Achievements use Dendry\'s native persistent and per-run qualities.'
);
const evaluatorTail = normalizeSource.slice(
  evaluatorMarker,
  normalizeSource.lastIndexOf('\n!}')
);
const evaluatorHost = {};
new Function('budgetHost', 'Q', evaluatorTail).call(
  {achieve: function() {}},
  evaluatorHost,
  {started: 0}
);
const evaluate = evaluatorHost.polandAchievementEvaluator;
assert.strictEqual(typeof evaluate, 'function',
  'achievement evaluator was not exposed');

const run = function(overrides) {
  const qualities = Object.assign({
    started: 1,
    scenario_mode: 'campaign_2019',
  }, overrides || {});
  const earned = [];
  const engine = {
    achieve: function(id) {
      qualities['achievement_' + id] = 1;
      qualities['game_achievement_' + id] = 1;
      earned.push(id);
    },
  };
  evaluate(engine, qualities);
  return {earned: earned, qualities: qualities, engine: engine};
};
const cases = [];
const add = function(id, yes, no) {
  cases.push({id: id, yes: yes, no: no});
};
const cabinet = {government_has_confidence: 1, caretaker_government: 0};
const terminal = {game_over: 1, ending_exit_type: 'Natural conclusion'};

add('left_eight_percent_2020',
  {pres_first_round_complete: 1, pres_r1_display_left: 8},
  {pres_first_round_complete: 1, pres_r1_display_left: 7.99});
add('biedron_below_historical_2020', {
  pres_first_round_complete: 1, presidential_candidate: 'Robert Biedroń',
  pres_r1_display_left: 2.21,
}, {
  pres_first_round_complete: 1, presidential_candidate: 'Robert Biedroń',
  pres_r1_display_left: 2.22,
});
add('biedron_beats_bosak_2020', {
  pres_first_round_complete: 1, presidential_candidate: 'Robert Biedroń',
  pres_r1_display_left: 7.01, pres_r1_display_bosak: 7,
}, {
  pres_first_round_complete: 1, presidential_candidate: 'Robert Biedroń',
  pres_r1_display_left: 7, pres_r1_display_bosak: 6.9,
});
add('trzaskowski_president_2020', {trz_inaugurated: 1},
  {trz_inaugurated: 0});
add('left_president_2025', {pres_2025_winner_key: 'left'},
  {pres_2025_winner_key: 'razem'});
add('first_round_president_2025',
  {pres_2025_winner_key: 'left', pres_2025_first_round_winner: 1},
  {pres_2025_winner_key: 'left', pres_2025_first_round_winner: 0});
add('back_in_the_ring', {
  prawica_formed: 1, prawica_leader: 'Andrzej Duda',
  prawica_pis_government_block: 0,
}, {
  prawica_formed: 1, prawica_leader: 'Andrzej Duda',
  prawica_pis_government_block: 1,
});
add('ill_be_back', {
  third_way_split: 1,
  third_way_response: 'PSL recognised as the parliamentary hinge',
  pres_2025_winner_key: 'holownia',
}, {
  third_way_split: 1,
  third_way_response: 'Equal bilateral agreements',
  pres_2025_winner_key: 'holownia',
});
add('enter_government', Object.assign({}, cabinet, {left_in_government: 1}),
  {government_has_confidence: 0, left_in_government: 1});
add('left_prime_minister', Object.assign({}, cabinet,
  {left_in_government: 1, government_party: 'lewica'}),
  Object.assign({}, cabinet, {left_in_government: 1, government_party: 'ko'}));
for (const entry of [
  ['left_only_government', 'left_only'],
  ['democratic_coalition', 'democratic_2023'],
  ['split_third_way_coalition', 'ko_psl_left'],
  ['left_pis_coalition', 'left_pis'],
  ['five_party_coalition', 'left_pis_konf_third'],
  ['third_way_left_pis', 'third_left_pis'],
]) {
  add(entry[0], Object.assign({}, cabinet, {formation_coalition_code: entry[1]}),
    {government_has_confidence: 0, formation_coalition_code: entry[1]});
}
add('wina_tuska', Object.assign({}, cabinet, {
  sejm_list_outcome: 'democratic_8', left_in_government: 1,
  formation_coalition_members: ['p2050', 'psl', 'lewica'],
}), Object.assign({}, cabinet, {
  sejm_list_outcome: 'democratic_8', left_in_government: 1,
  formation_coalition_members: ['ko', 'p2050', 'psl', 'lewica'],
}));
add('borrowed_left_pm', Object.assign({}, cabinet, {left_pm_borrowed_mandate: 1}),
  Object.assign({}, cabinet, {left_pm_borrowed_mandate: 0}));
add('confidence_and_supply', Object.assign({}, cabinet, {
  left_in_government: 0,
  left_cabinet_model: 'Confidence and supply from opposition',
}), Object.assign({}, cabinet, {
  left_in_government: 1,
  left_cabinet_model: 'Confidence and supply from opposition',
}));
add('no_third_way', {
  third_way_split: 1, formation_coalition_code: 'ko_p2050_left',
  psl_2023_exclusion_crisis_done: 1, psl_right_alignment_locked: 1,
}, {
  third_way_split: 1, formation_coalition_code: 'ko_p2050_left',
  psl_2023_exclusion_crisis_done: 1, psl_right_alignment_locked: 0,
});
add('budget_concession', {budget_concession_after_defeat: 1},
  {budget_concession_after_defeat: 0});
add('marshal_rotation', {marshal_rotation_vote_passed: 1},
  {marshal_rotation_vote_passed: 0});
add('sejmflix', {
  sejm_speaker: 'Szymon Hołownia', sejmflix_2023_done: 1,
  parliament_visibility: 65,
}, {
  sejm_speaker: 'Szymon Hołownia', sejmflix_2023_done: 1,
  parliament_visibility: 64,
});
add('german_agent', Object.assign({}, cabinet, {
  government_party: 'ko', prime_minister: 'Donald Tusk',
  pis_leader: 'Jarosław Kaczyński', pis_seats: 150, pis_relation: 10,
}), Object.assign({}, cabinet, {
  government_party: 'ko', prime_minister: 'Donald Tusk',
  pis_leader: 'Jarosław Kaczyński', pis_seats: 150, pis_relation: 11,
}));
add('power_holding_group', Object.assign({}, cabinet, {
  government_party: 'lewica', left_president: 1,
  sejm_speaker: 'Marta Stożek',
}), Object.assign({}, cabinet, {
  government_party: 'lewica', left_president: 0,
  sejm_speaker: 'Marta Stożek',
}));
add('nocna_zmiana', {government_removed_by_vonc: 1},
  {government_removed_by_vonc: 0});
add('sejm_freezer', {
  sejm_speaker: 'Marta Stożek', reform_pressure_frozen: 1,
  frozen_demand_count: 1,
}, {
  sejm_speaker: 'Marta Stożek', reform_pressure_frozen: 1,
  frozen_demand_count: 0,
});
for (const issue of [
  'abortion', 'marriage', 'church', 'asylum', 'border',
  'defence', 'labor', 'health', 'courts',
]) {
  const yes = {};
  const no = {};
  yes[issue + '_reform_stage'] = 4;
  no[issue + '_reform_stage'] = 3;
  add('full_' + issue + '_reform', yes, no);
}
add('three_max_reforms',
  {major_reforms_complete: 1, reform_slate_count: 3, reform_slate_weight: 12},
  {major_reforms_complete: 1, reform_slate_count: 3, reform_slate_weight: 11});
add('referendum_reform',
  {abortion_referendum_mandate: 1, abortion_reform_stage: 4},
  {abortion_referendum_mandate: 1, abortion_reform_stage: 3});
add('trzaskowski_freebie', {trz_rights_bill_outcome: 'Passed and signed'},
  {trz_rights_bill_outcome: 'Defeated in the Sejm'});
add('nuclear_complete',
  {nuclear_stage: 5, nuclear_shelved: 0, nuclear_delivery: 15},
  {nuclear_stage: 5, nuclear_shelved: 0, nuclear_delivery: 14});
add('peoples_atom', {
  nuclear_stage: 5, nuclear_shelved: 0, nuclear_delivery: 15,
  nuclear_public_ownership: 20, nuclear_price_shield: 15,
  nuclear_labour_standard: 25, nuclear_just_transition: 20,
}, {
  nuclear_stage: 5, nuclear_shelved: 0, nuclear_delivery: 15,
  nuclear_public_ownership: 20, nuclear_price_shield: 15,
  nuclear_labour_standard: 25, nuclear_just_transition: 19,
});
add('second_nuclear_plant', {
  nuclear_shelved: 0,
  nuclear_second_plant: 'Pątnów–Konin with a Korean partner and a public majority',
}, {
  nuclear_shelved: 1,
  nuclear_second_plant: 'Pątnów–Konin with a Korean partner and a public majority',
});
add('nuclear_shelved', {nuclear_ever_shelved: 1}, {nuclear_ever_shelved: 0});
add('cpk_complete', {cpk_stage: 5, cpk_cancelled: 0, cpk_delivery: 15},
  {cpk_stage: 5, cpk_cancelled: 0, cpk_delivery: 14});
add('peoples_cpk', {
  cpk_stage: 5, cpk_cancelled: 0, cpk_delivery: 15,
  cpk_scope: 'Hub airport and high-speed rail, publicly owned',
  cpk_public_ownership: 15, cpk_labour_standard: 25,
}, {
  cpk_stage: 5, cpk_cancelled: 0, cpk_delivery: 15,
  cpk_scope: 'Hub airport and high-speed rail, publicly owned',
  cpk_public_ownership: 15, cpk_labour_standard: 24,
});
add('rail_first', {
  cpk_scope: 'Rail programme first, hub airport staged behind demonstrated demand',
}, {cpk_scope: 'Programme continued as inherited, without Left conditions'});
add('cpk_public_works', {cpk_cancelled: 1, cpk_public_works: 1},
  {cpk_cancelled: 1, cpk_public_works: 0});
for (const entry of [
  ['compensated_nationalisation', 'petrochemical_statute_enacted'],
  ['unlawful_nationalisation', 'petrochemical_unlawful_seizure'],
  ['ownership_doctrine', 'nationalisation_doctrine_adopted'],
  ['mmt_doctrine', 'mmt_doctrine_adopted'],
]) {
  const yes = {};
  const no = {};
  yes[entry[1]] = 1;
  no[entry[1]] = 0;
  add(entry[0], yes, no);
}
add('five_nationalisations', {strategic_nationalisations: 5},
  {strategic_nationalisations: 4});
add('developmental_state', {
  nuclear_stage: 5, nuclear_shelved: 0, nuclear_delivery: 15,
  nuclear_public_ownership: 20, nuclear_price_shield: 15,
  nuclear_labour_standard: 25, nuclear_just_transition: 20,
  nuclear_second_plant: 'Pątnów–Konin with a Korean partner and a public majority',
  cpk_stage: 5, cpk_cancelled: 0, cpk_delivery: 15,
  cpk_scope: 'Hub airport and high-speed rail, publicly owned',
  cpk_public_ownership: 15, cpk_labour_standard: 25,
  strategic_nationalisations: 5,
}, {
  nuclear_stage: 5, nuclear_shelved: 0, nuclear_delivery: 15,
  nuclear_public_ownership: 20, nuclear_price_shield: 15,
  nuclear_labour_standard: 25, nuclear_just_transition: 20,
  nuclear_second_plant: 'Pątnów–Konin with a Korean partner and a public majority',
  cpk_stage: 5, cpk_cancelled: 0, cpk_delivery: 15,
  cpk_scope: 'Hub airport and high-speed rail, publicly owned',
  cpk_public_ownership: 15, cpk_labour_standard: 25,
  strategic_nationalisations: 4,
});
add('bez_zadnego_trybu', {emergency_capital_controls: 1},
  {emergency_capital_controls: 0});
add('unified_left_party',
  {left_common_party_exists: 1, left_merger_structure: 'unified_party'},
  {left_common_party_exists: 0, left_merger_structure: 'unified_party'});
add('member_led_unification', {federation_peaceful_unification: 1},
  {federation_peaceful_unification: 0, historical_peaceful_unification: 0});
add('binding_federation', {left_constitution: 'member-ratified_federation'},
  {left_constitution: 'federal_council', left_structural_endpoint: 'Federation'});
add('razem_leaves', {razem_split: 1, razem_in_left: 0},
  {razem_split: 0, razem_in_left: 0});
add('razem_leadership', {left_dominant_current: 'razem'},
  {left_dominant_current: 'members'});
add('miller_restoration', {miller_restoration_done: 1},
  {miller_restoration_done: 0});
add('miller_akcja', {
  miller_restoration_done: 1, razem_future_route: 'akcja_socjalistyczna',
  zandberg_project_active: 1,
}, {
  miller_restoration_done: 1, razem_future_route: 'akcja_socjalistyczna',
  zandberg_project_active: 0,
});
add('tak_dla_rozwoju',
  {razem_future_route: 'tak_dla_rozwoju', matysiak_project_active: 1},
  {razem_future_route: 'tak_dla_rozwoju', matysiak_project_active: 0});
add('biggest_tent', {
  p2050_joined_left: 1,
}, {
  p2050_joined_left: 0, p2050_social_joined_left: 0,
  rozwoj_joined_left: 0, ipl_joined_left: 0, greens_joined_left: 0,
});
add('ground_game', {media_capacity: 55, local_network: 55},
  {media_capacity: 55, local_network: 54});
add('miller_imprisoned', {
  miller_imprisonment_recorded: 1, leszek_miller_imprisoned: 1,
}, {
  miller_imprisonment_recorded: 1, leszek_miller_imprisoned: 0,
});
add('pps_circle', {pps_party_formed: 1, pps_party_seats: 3},
  {pps_party_formed: 1, pps_party_seats: 2});
add('club_collapse', {left_club_collapsed: 1}, {left_club_collapsed: 0});
add('rownosc_founded', {rownosc_media_active: 1}, {rownosc_media_active: 0});
add('ja_panu_nie_przerywalem', {hostile_policy_interview_done: 1},
  {hostile_policy_interview_done: 0});
add('jest_pan_zerem', {miller_restoration_done: 1, ziobro_world_tour_updates: 2},
  {miller_restoration_done: 1, ziobro_world_tour_updates: 1});
add('kurica_nie_ptica', {ukraine_neutrality_demanded: 1},
  {ukraine_neutrality_demanded: 0});
add('ten_defections', {individual_defections: 10}, {individual_defections: 9});
add('three_left_splits', {organised_left_splits: 3}, {organised_left_splits: 2});
add('three_right_splits', {
  republikanie_formed: 1, suwerenna_walkout: 1, far_right_split: 1,
}, {
  republikanie_formed: 1, suwerenna_walkout: 1, far_right_split: 0,
});
add('cabinet_collapse',
  {coalition_status: 'Cabinet lost confidence', caretaker_government: 1},
  {coalition_status: 'Cabinet lost confidence', caretaker_government: 0});
add('piwo_z_mentzenem', {pres_2025_torun_route: 'democratic'},
  {pres_2025_torun_route: 'pis'});
add('bedziesz_siedzial', {nik_removal_response: 'Immunity stripped'},
  {nik_removal_response: 'Referral channel opened'});
add('szczesc_boze', {
  braun_compulsion_strategy: 'Pre-trial detention and one broad extremist case',
  braun_outcome: 'Braun leaves Poland before the compelled appearance',
}, {
  braun_compulsion_strategy: 'Ordinary compelled appearance',
  braun_outcome: 'Braun leaves Poland before the compelled appearance',
});
add('wniosek_formalny', {marshal_2019_response: 'Standing orders'},
  {marshal_2019_response: 'Asset register demanded'});
add('mokry_sen_kukiza', {
  electoral_reform_stage: 'enacted', sejm_electoral_system: 'mixed_230',
}, {
  electoral_reform_stage: 'referendum_won', sejm_electoral_system: 'proportional',
});
add('impossible_majority', Object.assign({}, terminal,
  {ending_name: 'The impossible majority'}), Object.assign({}, terminal,
  {ending_name: 'A Left that can govern'}));
add('red_tide', Object.assign({}, terminal, {
  ending_family_vote: 20, ending_family_seats: 1, ending_threshold_losses: 0,
}), Object.assign({}, terminal, {
  ending_family_vote: 19, ending_family_seats: 1, ending_threshold_losses: 0,
}));
add('below_threshold', {game_over: 1, ending_exit_type: 'Voted out'},
  {game_over: 1, ending_exit_type: 'Natural conclusion'});
add('game_completed', terminal, {game_over: 0, ending_exit_type: 'Natural conclusion'});

assert.strictEqual(cases.length, 84, 'predicate fixture count must be 84');
for (const testCase of cases) {
  assert(run(testCase.yes).earned.includes(testCase.id),
    testCase.id + ' did not unlock for its positive fixture');
  assert(!run(testCase.no).earned.includes(testCase.id),
    testCase.id + ' unlocked for its near-miss fixture');
}

const repeat = run({pres_first_round_complete: 1, pres_r1_display_left: 8});
assert(repeat.earned.includes('left_eight_percent_2020'),
  'repeat-unlock fixture did not earn initially');
assert.deepStrictEqual(evaluate(repeat.engine, repeat.qualities), [],
  'evaluator repeated an achievement in the same playthrough');

assert.deepStrictEqual(run({
  scenario_mode: 'formation_2023',
  pres_first_round_complete: 1,
  pres_r1_display_left: 12,
  pres_2025_winner_key: 'left',
  government_has_confidence: 1,
  left_in_government: 1,
  game_over: 1,
  ending_exit_type: 'Natural conclusion',
}).earned, [], 'formation_2023 unlocked achievements');

console.log('Achievement scaffold passed: 84 catalogue entries and predicate fixtures.');
