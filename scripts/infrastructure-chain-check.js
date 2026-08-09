'use strict';

// Targeted check for the two capital-programme storylines: CPK
// (poland_cpk_2024_2027) and the nuclear programme (poland_nuclear_2024_2027).
//
// Both are staged chains routed through the #poland_event queue rather than
// single events, so the things that can silently break are the stage gates and
// the availability of a resolution. This drives every stage from every live
// political role and asserts that:
//
//   1. each event is eligible exactly at its stage and date floor;
//   2. every event keeps at least one selectable choice at zero resources, in
//      government and in opposition, so the queue can never dead-end;
//   3. cancellation and shelving stay reserved for a Lewica-led cabinet and
//      route into their own branch event rather than ending the chain;
//   4. opposition routes never move state delivery.

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

const ROLES = [
  {
    name: 'Lewica-led cabinet',
    state: { left_in_government: 1, government_party: 'lewica' },
  },
  {
    name: 'junior coalition partner',
    state: { left_in_government: 1, government_party: 'ko' },
  },
  {
    name: 'opposition under a right-wing cabinet',
    state: { left_in_government: 0, government_party: 'pis' },
  },
];

function newEngine(seed) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([seed]);
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices() || [];
    const index = choices.findIndex(function(c) { return c.id === sceneId; });
    assert(index >= 0, 'Missing choice ' + sceneId + ' among ' +
      choices.map(function(c) { return c.id; }).join(', '));
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  // Both ledgers are seeded by poland_normalize, which the hub and the event
  // queue call before any dated event runs. Entering the events directly has
  // to do the same or the chain would start from undefined.
  engine.goToScene('poland_normalize');
  return { engine: engine, choose: choose, Q: engine.state.qualities };
}

function setState(Q, state) {
  Object.assign(Q, state);
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

// Every dated event in both files, with the ledger state that makes it live.
const CHAIN = [
  {
    id: 'poland_cpk_2024_2027.cpk_audit_2024',
    live: { year: 2024, month: 3, cpk_stage: 0 },
    dead: { year: 2024, month: 2, cpk_stage: 0 },
  },
  {
    id: 'poland_cpk_2024_2027.cpk_programme_decision_2024',
    live: { year: 2024, month: 7, cpk_stage: 1 },
    dead: { year: 2024, month: 7, cpk_stage: 0 },
  },
  {
    id: 'poland_cpk_2024_2027.cpk_land_2025',
    live: { year: 2025, month: 6, cpk_stage: 2, cpk_cancelled: 0 },
    dead: { year: 2025, month: 6, cpk_stage: 2, cpk_cancelled: 1 },
  },
  {
    id: 'poland_cpk_2024_2027.cpk_after_cancellation_2025',
    live: { year: 2025, month: 6, cpk_stage: 2, cpk_cancelled: 1 },
    dead: { year: 2025, month: 6, cpk_stage: 2, cpk_cancelled: 0 },
  },
  {
    id: 'poland_cpk_2024_2027.cpk_finance_2026',
    live: { year: 2026, month: 3, cpk_stage: 3, cpk_cancelled: 0 },
    dead: { year: 2026, month: 3, cpk_stage: 3, cpk_cancelled: 1 },
  },
  {
    id: 'poland_cpk_2024_2027.cpk_delivery_2027',
    live: { year: 2027, month: 2, cpk_stage: 4 },
    dead: { year: 2027, month: 2, cpk_stage: 5 },
  },
  {
    id: 'poland_nuclear_2024_2027.nuclear_contract_2024',
    live: { year: 2024, month: 5, nuclear_stage: 0 },
    dead: { year: 2024, month: 4, nuclear_stage: 0 },
  },
  {
    id: 'poland_nuclear_2024_2027.nuclear_financing_2025',
    live: { year: 2025, month: 9, nuclear_stage: 1 },
    dead: { year: 2025, month: 8, nuclear_stage: 1 },
  },
  {
    id: 'poland_nuclear_2024_2027.nuclear_second_plant_2026',
    live: { year: 2026, month: 1, nuclear_stage: 2, nuclear_shelved: 0 },
    dead: { year: 2026, month: 1, nuclear_stage: 2, nuclear_shelved: 1 },
  },
  {
    id: 'poland_nuclear_2024_2027.nuclear_after_shelving_2026',
    live: { year: 2026, month: 1, nuclear_stage: 2, nuclear_shelved: 1 },
    dead: { year: 2026, month: 1, nuclear_stage: 2, nuclear_shelved: 0 },
  },
  {
    id: 'poland_nuclear_2024_2027.nuclear_site_2026',
    live: { year: 2026, month: 8, nuclear_stage: 3, nuclear_shelved: 0 },
    dead: { year: 2026, month: 8, nuclear_stage: 3, nuclear_shelved: 1 },
  },
  {
    id: 'poland_nuclear_2024_2027.nuclear_price_2027',
    live: { year: 2027, month: 4, nuclear_stage: 4 },
    dead: { year: 2027, month: 4, nuclear_stage: 5 },
  },
];

function checkGatesAndResolutions() {
  for (const event of CHAIN) {
    for (const role of ROLES) {
      const run = newEngine('infra-gate');
      setState(run.Q, role.state);
      setState(run.Q, event.live);
      run.Q.resources = 0;
      assert(
        eventIsLive(run.engine, event.id),
        event.id + ' is not eligible at its own stage (' + role.name + ')'
      );
      const open = selectableChoices(run.engine, event.id);
      assert(
        open.length > 0,
        event.id + ' has no selectable resolution at zero resources (' +
          role.name + '); the queue would fall back to root'
      );

      setState(run.Q, event.dead);
      assert(
        !eventIsLive(run.engine, event.id),
        event.id + ' stays eligible outside its stage or date window (' +
          role.name + ')'
      );
    }
  }
}

function checkChainProgression() {
  // Play the CPK chain forward through its default (non-cancelling) route and
  // confirm each result opens exactly the next file.
  const run = newEngine('infra-progression');
  setState(run.Q, { left_in_government: 1, government_party: 'ko' });
  setState(run.Q, { year: 2024, month: 3, cpk_stage: 0, resources: 5 });
  run.engine.goToScene('poland_cpk_2024_2027.cpk_audit_2024');
  assert.strictEqual(run.Q.cpk_stage, 1, 'The audit must advance the chain');
  run.choose('poland_cpk_2024_2027.cpk_audit_transparency');

  setState(run.Q, { year: 2024, month: 7 });
  run.engine.goToScene('poland_cpk_2024_2027.cpk_programme_decision_2024');
  assert.strictEqual(run.Q.cpk_stage, 2);
  run.choose('poland_cpk_2024_2027.cpk_decision_rail_only');
  assert(run.Q.cpk_rail_priority >= 40, 'Rail-first must move the ledger');
  assert.strictEqual(run.Q.cpk_cancelled, 0);

  setState(run.Q, { year: 2025, month: 6 });
  assert(eventIsLive(run.engine, 'poland_cpk_2024_2027.cpk_land_2025'));
  assert(!eventIsLive(
    run.engine, 'poland_cpk_2024_2027.cpk_after_cancellation_2025'
  ));
  run.engine.goToScene('poland_cpk_2024_2027.cpk_land_2025');
  assert.strictEqual(run.Q.cpk_stage, 3);
  run.choose('poland_cpk_2024_2027.cpk_land_replacement');

  setState(run.Q, { year: 2026, month: 3 });
  run.engine.goToScene('poland_cpk_2024_2027.cpk_finance_2026');
  assert.strictEqual(run.Q.cpk_stage, 4);
  run.choose('poland_cpk_2024_2027.cpk_finance_bonds');
  assert(run.Q.cpk_public_ownership >= 55, 'Bond financing keeps the asset');

  setState(run.Q, { year: 2027, month: 2 });
  run.engine.goToScene('poland_cpk_2024_2027.cpk_delivery_2027');
  assert.strictEqual(run.Q.cpk_stage, 5);
  assert(
    String(run.Q.cpk_settlement).length > 0 &&
      String(run.Q.cpk_settlement).indexOf('not yet met') < 0,
    'The delivery event must publish a settlement'
  );
}

function checkCancellationIsLeftLedAndSurvives() {
  // Only a Lewica prime minister may cancel the hub, and the cancellation must
  // route into its own aftermath rather than removing the storyline.
  const junior = newEngine('infra-cancel-junior');
  setState(junior.Q, {
    left_in_government: 1, government_party: 'ko',
    year: 2024, month: 7, cpk_stage: 1, resources: 5,
  });
  junior.engine.goToScene(
    'poland_cpk_2024_2027.cpk_programme_decision_2024'
  );
  assert(
    selectableChoices(
      junior.engine, 'poland_cpk_2024_2027.cpk_programme_decision_2024'
    ).indexOf('poland_cpk_2024_2027.cpk_decision_cancel') < 0,
    'A junior partner cannot cancel the hub'
  );

  const lewica = newEngine('infra-cancel-lewica');
  setState(lewica.Q, {
    left_in_government: 1, government_party: 'lewica',
    year: 2024, month: 7, cpk_stage: 1, resources: 5,
  });
  lewica.engine.goToScene(
    'poland_cpk_2024_2027.cpk_programme_decision_2024'
  );
  lewica.choose('poland_cpk_2024_2027.cpk_decision_cancel');
  assert.strictEqual(lewica.Q.cpk_cancelled, 1);
  setState(lewica.Q, { year: 2025, month: 6 });
  assert(eventIsLive(
    lewica.engine, 'poland_cpk_2024_2027.cpk_after_cancellation_2025'
  ), 'Cancellation must open its own aftermath event');
  assert(!eventIsLive(lewica.engine, 'poland_cpk_2024_2027.cpk_land_2025'));
  lewica.engine.goToScene(
    'poland_cpk_2024_2027.cpk_after_cancellation_2025'
  );
  assert.strictEqual(lewica.Q.cpk_stage, 3);
  setState(lewica.Q, { year: 2027, month: 2 });
  assert(
    eventIsLive(lewica.engine, 'poland_cpk_2024_2027.cpk_delivery_2027'),
    'A cancelled programme still reaches the election-year settlement'
  );
}

function checkShelvingIsLeftLedAndSurvives() {
  const junior = newEngine('infra-shelve-junior');
  setState(junior.Q, {
    left_in_government: 1, government_party: 'ko',
    year: 2025, month: 9, nuclear_stage: 1, resources: 5,
  });
  junior.engine.goToScene('poland_nuclear_2024_2027.nuclear_financing_2025');
  assert(
    selectableChoices(
      junior.engine, 'poland_nuclear_2024_2027.nuclear_financing_2025'
    ).indexOf('poland_nuclear_2024_2027.nuclear_finance_shelve') < 0,
    'A junior partner cannot shelve the nuclear programme'
  );

  const lewica = newEngine('infra-shelve-lewica');
  setState(lewica.Q, {
    left_in_government: 1, government_party: 'lewica',
    year: 2025, month: 9, nuclear_stage: 1, resources: 5,
  });
  lewica.engine.goToScene('poland_nuclear_2024_2027.nuclear_financing_2025');
  lewica.choose('poland_nuclear_2024_2027.nuclear_finance_shelve');
  assert.strictEqual(lewica.Q.nuclear_shelved, 1);
  setState(lewica.Q, { year: 2026, month: 1 });
  assert(eventIsLive(
    lewica.engine, 'poland_nuclear_2024_2027.nuclear_after_shelving_2026'
  ), 'Shelving must open its own aftermath event');
  assert(!eventIsLive(
    lewica.engine, 'poland_nuclear_2024_2027.nuclear_second_plant_2026'
  ));
  lewica.engine.goToScene(
    'poland_nuclear_2024_2027.nuclear_after_shelving_2026'
  );
  assert.strictEqual(lewica.Q.nuclear_stage, 3);
  setState(lewica.Q, { year: 2027, month: 4 });
  assert(
    eventIsLive(lewica.engine, 'poland_nuclear_2024_2027.nuclear_price_2027'),
    'A shelved programme still reaches the election-year settlement'
  );
}

function checkOppositionNeverImplements() {
  // Opposition routes may build credit, credibility and organisation, but they
  // cannot move project delivery or state capacity.
  const guarded = [
    'cpk_delivery', 'nuclear_delivery', 'government_delivery',
    'climate_state_capacity', 'household_security',
  ];
  const oppositionRoutes = [
    ['poland_cpk_2024_2027.cpk_audit_2024',
      'poland_cpk_2024_2027.cpk_audit_scrutiny'],
    ['poland_cpk_2024_2027.cpk_audit_2024',
      'poland_cpk_2024_2027.cpk_audit_defend'],
    ['poland_cpk_2024_2027.cpk_programme_decision_2024',
      'poland_cpk_2024_2027.cpk_decision_opposition_terms'],
    ['poland_cpk_2024_2027.cpk_land_2025',
      'poland_cpk_2024_2027.cpk_land_freeze'],
    ['poland_cpk_2024_2027.cpk_finance_2026',
      'poland_cpk_2024_2027.cpk_finance_opposition'],
    ['poland_nuclear_2024_2027.nuclear_contract_2024',
      'poland_nuclear_2024_2027.nuclear_opposition_backing'],
    ['poland_nuclear_2024_2027.nuclear_contract_2024',
      'poland_nuclear_2024_2027.nuclear_price_shield'],
    ['poland_nuclear_2024_2027.nuclear_financing_2025',
      'poland_nuclear_2024_2027.nuclear_finance_opposition'],
    ['poland_nuclear_2024_2027.nuclear_second_plant_2026',
      'poland_nuclear_2024_2027.nuclear_second_opposition'],
    ['poland_nuclear_2024_2027.nuclear_site_2026',
      'poland_nuclear_2024_2027.nuclear_site_organise'],
  ];
  const stageFor = {
    'poland_cpk_2024_2027.cpk_audit_2024': { year: 2024, month: 3, cpk_stage: 0 },
    'poland_cpk_2024_2027.cpk_programme_decision_2024':
      { year: 2024, month: 7, cpk_stage: 1 },
    'poland_cpk_2024_2027.cpk_land_2025':
      { year: 2025, month: 6, cpk_stage: 2, cpk_cancelled: 0 },
    'poland_cpk_2024_2027.cpk_finance_2026':
      { year: 2026, month: 3, cpk_stage: 3, cpk_cancelled: 0 },
    'poland_nuclear_2024_2027.nuclear_contract_2024':
      { year: 2024, month: 5, nuclear_stage: 0 },
    'poland_nuclear_2024_2027.nuclear_financing_2025':
      { year: 2025, month: 9, nuclear_stage: 1 },
    'poland_nuclear_2024_2027.nuclear_second_plant_2026':
      { year: 2026, month: 1, nuclear_stage: 2, nuclear_shelved: 0 },
    'poland_nuclear_2024_2027.nuclear_site_2026':
      { year: 2026, month: 8, nuclear_stage: 3, nuclear_shelved: 0 },
  };

  for (const route of oppositionRoutes) {
    const run = newEngine('infra-opposition');
    setState(run.Q, { left_in_government: 0, government_party: 'pis' });
    setState(run.Q, stageFor[route[0]]);
    run.Q.resources = 5;
    run.engine.goToScene(route[0]);
    const before = {};
    for (const key of guarded) before[key] = Number(run.Q[key]) || 0;
    run.choose(route[1]);
    for (const key of guarded) {
      assert(
        (Number(run.Q[key]) || 0) <= before[key],
        route[1] + ' lets the opposition raise ' + key
      );
    }
  }
}

checkGatesAndResolutions();
checkChainProgression();
checkCancellationIsLeftLedAndSurvives();
checkShelvingIsLeftLedAndSurvives();
checkOppositionNeverImplements();

console.log(
  'CPK and nuclear chain check passed (' + CHAIN.length +
  ' dated events, ' + ROLES.length + ' political roles).'
);
