'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: undefined,
});

const dendry = require('dendrynexus/lib/engine');
const projectRoot = path.resolve(__dirname, '..');
let game;
dendry.convertJSONToGame(fs.readFileSync(
  path.join(projectRoot, 'out', 'game.json'), 'utf8'
), function(error, converted) {
  if (error) throw error;
  game = converted;
});

const PORTFOLIOS = [
  'labor', 'equality', 'housing', 'health', 'digital', 'science',
  'interior', 'finance', 'economy', 'justice', 'foreign',
  'agriculture', 'defence',
];

function newRun(seed) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([seed]);
  for (const id of ['root.campaign_game', 'root.standard']) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(choice) { return choice.id === id; });
    assert(index >= 0, 'Missing setup choice ' + id);
    engine.choose(index);
  }
  return {engine: engine, Q: engine.state.qualities};
}

function setChamber(Q, seats) {
  Object.assign(Q, seats, {
    year: 2023,
    month: 11,
    sejm_total: 460,
    sejm_quorum_floor: 230,
    sejm_statutory_majority: 231,
    left_committed_seats: seats.left_seats,
    third_way_split: 0,
    trz_inaugurated: 0,
    president_name: 'Andrzej Duda',
    formation_in_progress: 1,
    formation_continuous: 1,
  });
}

function formRivalMajority(fixture) {
  const run = newRun('rival-majority-' + fixture.code);
  setChamber(run.Q, fixture.seats);
  Object.assign(run.Q, fixture.relations || {});
  run.engine.goToScene('poland_government_formation.first_sitting');
  assert.strictEqual(
    run.engine.state.sceneId,
    'poland_government_formation.autonomous_majority',
    fixture.code + ' did not form an autonomous government: checked=' +
      run.Q.formation_autonomous_coalition_checked + ', code=' +
      run.Q.formation_autonomous_code + ', gate=' +
      run.Q['coalition_viable_' + Object.keys(fixture.relations || {})[0]
        ?.replace('rival_relation_', '')]
  );
  assert.strictEqual(run.Q.formation_coalition_code, fixture.code,
    fixture.code + ' fixture selected ' + run.Q.formation_coalition_code +
      ' from ' + JSON.stringify(run.Q.formation_autonomous_members) +
      ' at seats ' + [run.Q.pis_seats, run.Q.ko_seats,
        run.Q.p2050_seats, run.Q.psl_seats, run.Q.left_seats,
        run.Q.konf_seats].join('/'));
  assert.deepStrictEqual(run.Q.formation_coalition_members, fixture.members);
  assert.strictEqual(run.Q.formation_player_in_government, 0);
  assert.strictEqual(run.Q.left_role_code, 'opposition');

  run.engine.goToScene(
    'poland_government_formation.' + fixture.vote
  );
  assert.strictEqual(
    run.engine.state.sceneId,
    'poland_ministries.opposition_allocation'
  );
  assert.strictEqual(run.Q.ministry_count, 0);
  for (const portfolio of PORTFOLIOS) {
    assert.notStrictEqual(
      run.Q[portfolio + '_minister_party'],
      'Lewica',
      portfolio + ' must not be handed to an opposition party'
    );
    assert(
      fixture.partyLabels.includes(run.Q[portfolio + '_minister_party']),
      portfolio + ' belongs to an unexpected party: ' +
        run.Q[portfolio + '_minister_party']
    );
  }

  run.engine.goToScene('poland_ministries.opposition_allocation_continue');
  assert.strictEqual(
    run.engine.state.sceneId,
    'poland_government_formation.formation_external_cabinet_program'
  );
  run.engine.goToScene('poland_government_formation.cabinet_confidence_roll');
  assert.strictEqual(run.Q.cabinet_confidence_passed, 1,
    fixture.code + ' confidence failed: yes=' + run.Q.confidence_yes +
      ', present=' + run.Q.confidence_present +
      ', threshold=' + run.Q.confidence_threshold +
      ', contracted=' + run.Q.formation_coalition_support_seats +
      ', formal=' + run.Q.formation_coalition_seats);
  assert.strictEqual(
    run.Q.confidence_yes,
    run.Q.formation_coalition_seats +
      (fixture.vote === 'autonomous_majority_support'
        ? run.Q.left_committed_seats : 0)
  );
  run.engine.goToScene('poland_government_formation.cabinet_success');
  assert.strictEqual(run.Q.left_in_government, 0);
  assert.strictEqual(run.Q.position, 'Parliamentary opposition');
  assert.strictEqual(run.Q.budget, 0);
  assert.strictEqual(run.Q.government_support_seats,
    run.Q.formation_coalition_seats,
    'A one-off Lewica vote must not become permanent government support');
  assert.deepStrictEqual(run.Q.government_members, fixture.members);

  if (fixture.exerciseOpposition) {
    run.engine.goToScene(
      'poland_government_formation.opposition_mandate'
    );
    assert.strictEqual(
      run.engine.state.sceneId,
      'poland_government_formation.opposition_mandate'
    );
    run.engine.goToScene(
      'poland_government_formation.opposition_mandate_watchdog'
    );
    assert.strictEqual(run.Q.opposition_2023_strategy_code, 'watchdog');
    assert.strictEqual(run.Q.left_role_code, 'opposition');

    run.Q.time = 100;
    run.Q.resources = 3;
    run.Q.month_actions = 0;
    run.engine.goToScene('poland_opposition_operation');
    assert(run.engine.getCurrentChoices().some(function(choice) {
      return choice.id === 'poland_opposition_operation.committee_hearing';
    }), 'The opposition mandate did not produce a standing operation');
    const capitalBefore = run.Q.negotiation_capital;
    run.engine.goToScene('poland_opposition_operation.committee_hearing');
    assert.strictEqual(run.Q.negotiation_capital, capitalBefore + 4);
    assert.strictEqual(run.Q.opposition_operation_last_time, 100);
    assert.strictEqual(run.Q.last_policy_authority,
      'Parliamentary opposition');
  }
}

for (const fixture of [
  {
    code: 'pis_majority',
    members: ['pis'],
    partyLabels: ['PiS'],
    vote: 'autonomous_majority_oppose',
    exerciseOpposition: true,
    seats: {pis_seats: 250, ko_seats: 100, p2050_seats: 30,
      psl_seats: 20, left_seats: 40, konf_seats: 20},
  },
  {
    code: 'ko_majority',
    members: ['ko'],
    partyLabels: ['KO'],
    vote: 'autonomous_majority_support',
    seats: {pis_seats: 100, ko_seats: 250, p2050_seats: 30,
      psl_seats: 20, left_seats: 40, konf_seats: 20},
  },
  {
    code: 'third_way_majority',
    members: ['p2050', 'psl'],
    partyLabels: ['Poland 2050', 'PSL'],
    vote: 'autonomous_majority_abstain',
    seats: {pis_seats: 100, ko_seats: 80, p2050_seats: 130,
      psl_seats: 110, left_seats: 20, konf_seats: 20},
  },
  {
    code: 'ko_p2050',
    members: ['ko', 'p2050'],
    partyLabels: ['KO', 'Poland 2050'],
    vote: 'autonomous_majority_oppose',
    relations: {rival_relation_ko_p2050: 90},
    seats: {pis_seats: 120, ko_seats: 190, p2050_seats: 50,
      psl_seats: 20, left_seats: 40, konf_seats: 40},
  },
  {
    code: 'pis_konf',
    members: ['pis', 'konf'],
    partyLabels: ['PiS', 'Konfederacja'],
    vote: 'autonomous_majority_abstain',
    relations: {rival_relation_pis_konf: 90},
    seats: {pis_seats: 200, ko_seats: 120, p2050_seats: 25,
      psl_seats: 25, left_seats: 50, konf_seats: 40},
  },
  {
    code: 'ko_third',
    members: ['ko', 'p2050', 'psl'],
    partyLabels: ['KO', 'Poland 2050', 'PSL'],
    vote: 'autonomous_majority_oppose',
    relations: {
      rival_relation_ko_p2050: 90,
      rival_relation_ko_psl: 90,
      rival_relation_psl_p2050: 90,
    },
    seats: {pis_seats: 130, ko_seats: 180, p2050_seats: 35,
      psl_seats: 25, left_seats: 40, konf_seats: 50},
  },
]) {
  formRivalMajority(fixture);
}

{
  const run = newRun('rival-majority-control');
  setChamber(run.Q, {pis_seats: 194, ko_seats: 157, p2050_seats: 33,
    psl_seats: 32, left_seats: 26, konf_seats: 18});
  run.engine.goToScene('poland_government_formation.first_sitting');
  assert.strictEqual(
    run.engine.state.sceneId,
    'poland_government_formation.first_sitting',
    'A chamber without a self-sufficient rival must retain coalition play'
  );
}

{
  const run = newRun('opposition-strategy-reviews');
  Object.assign(run.Q, {
    continuous_campaign: 1,
    formation_in_progress: 0,
    left_in_government: 0,
    government_has_confidence: 1,
    caretaker_government: 0,
    opposition_2023_mandate_set: 1,
    opposition_2023_strategy: 'Social and movement opposition',
    opposition_2023_strategy_code: 'social',
    year: 2024,
    month: 4,
  });
  run.engine.goToScene('poland_opposition_strategy.review_2024');
  assert(run.engine.getCurrentChoices().some(function(choice) {
    return choice.id === 'poland_opposition_strategy.review_watchdog';
  }), 'The first opposition strategy review has no playable choice');
  run.engine.goToScene('poland_opposition_strategy.review_watchdog');
  assert.strictEqual(run.Q.opposition_strategy_review_2024_done, 1);
  assert.strictEqual(run.Q.opposition_2023_strategy_code, 'watchdog');

  run.Q.year = 2026;
  run.Q.month = 9;
  run.engine.goToScene('poland_opposition_strategy.convention_2026');
  run.engine.goToScene('poland_opposition_strategy.convention_shadow_team');
  assert.strictEqual(run.Q.opposition_convention_2026_done, 1);
  assert.strictEqual(
    run.Q.opposition_2027_offer,
    'Named shadow cabinet with a hundred-day programme'
  );
}

{
  const run = newRun('opposition-save-migration');
  delete run.Q.opposition_operation_last_time;
  delete run.Q.opposition_strategy_review_2024_done;
  delete run.Q.opposition_2027_offer;
  delete run.Q.formation_autonomous_members;
  run.engine.goToScene('poland_normalize');
  assert.strictEqual(run.Q.opposition_operation_last_time, -99);
  assert.strictEqual(run.Q.opposition_strategy_review_2024_done, 0);
  assert.strictEqual(run.Q.opposition_2027_offer,
    'No alternative-government offer');
  assert.deepStrictEqual(run.Q.formation_autonomous_members, []);
}

console.log('rival-majority-check: all assertions passed');
