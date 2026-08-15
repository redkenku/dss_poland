'use strict';

// The local-affairs desk is one queue entry that dispatches six separate
// municipal files. What can silently break is reachability: a file whose due
// condition never becomes true, a dispatch id with no matching go-to branch,
// a choice list that is empty for the live role, or a result that routes
// straight into the next clean page and erases itself.
//
// This drives the real engine and asserts that:
//
//   1. every local file becomes the dispatched file from a live campaign
//      state, and lands on its own scene;
//   2. every file offers at least one selectable choice in government, in
//      opposition and at zero resources and budget;
//   3. every choice ends on a retained result the player has to leave
//      deliberately, rather than a go-to into the desk's clean page;
//   4. the desk dispatches one file per month and stands down once the last
//      one is resolved;
//   5. the Warsaw succession only opens when Trzaskowski's presidency
//      actually vacates City Hall, and its stored roll resolves a real field.

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
  {name: 'Lewica-led cabinet', state: {left_in_government: 1, government_party: 'lewica'}},
  {name: 'junior coalition partner', state: {left_in_government: 1, government_party: 'ko'}},
  {name: 'opposition under a right cabinet', state: {left_in_government: 0, government_party: 'pis'}},
];

// Every local file, the state that makes it due, and the scene it must reach.
const FILES = [
  {
    id: 'warsaw_campaign',
    scene: 'poland_local_affairs.warsaw_campaign',
    year: 2025, month: 9,
    state: {
      president_name: 'Rafał Trzaskowski',
      warsaw_mayor: 'Rafał Trzaskowski',
      warsaw_mayor_party: 'ko',
      sutryk_term_limit_done: 1,
      // The presidency schedules the vacancy one month out; this fixture is
      // the month the file actually reaches the desk.
      warsaw_succession_due_time: (2025 - 2019) * 12 + 9,
    },
  },
  {
    id: 'warsaw_result',
    scene: 'poland_local_affairs.warsaw_result',
    year: 2025, month: 11,
    state: {
      warsaw_succession_campaign_done: 1,
      warsaw_succession_result_done: 0,
      warsaw_succession_strategy: 'Run Left',
      warsaw_succession_result_due_time: (2025 - 2019) * 12 + 11,
      warsaw_succession_roll: 85,
      warsaw_left_candidate: 'Anna-Maria Żukowska',
      warsaw_pis_candidate: 'Tobiasz Bocheński',
      sutryk_term_limit_done: 1,
    },
  },
  {
    id: 'sutryk',
    scene: 'poland_local_affairs.sutryk_term_limit',
    year: 2024, month: 11,
    state: {},
  },
  {
    id: 'krakow',
    scene: 'poland_local_affairs.krakow_clean_transport',
    year: 2026, month: 1,
    state: {sutryk_term_limit_done: 1},
  },
  {
    id: 'buses',
    scene: 'poland_local_affairs.rural_bus_exclusion',
    year: 2026, month: 2,
    state: {sutryk_term_limit_done: 1, krakow_clean_transport_done: 1},
  },
  {
    id: 'alcohol',
    scene: 'poland_local_affairs.warsaw_alcohol_policy',
    year: 2026, month: 6,
    state: {
      sutryk_term_limit_done: 1,
      krakow_clean_transport_done: 1,
      rural_bus_exclusion_done: 1,
    },
  },
];

function newEngine(seed) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([seed]);
  return engine;
}

function choices(engine) {
  return engine.getCurrentChoices() || [];
}

function applyState(Q, state) {
  Object.keys(state).forEach(function(key) {
    Q[key] = state[key];
  });
}

// Put the engine into a live campaign month with the given local file due,
// then run the desk router the way poland_event_queue would.
function openFile(file, role, extra) {
  const engine = newEngine('local-affairs-' + file.id + '-' + role.name);
  const Q = engine.state.qualities;
  Q.continuous_campaign = 1;
  Q.year = file.year;
  Q.month = file.month;
  Q.time = (file.year - 2019) * 12 + file.month;
  Q.government_has_confidence = 1;
  Q.caretaker_government = 0;
  applyState(Q, role.state);
  applyState(Q, file.state);
  applyState(Q, extra || {});
  Q.last_local_affairs_time = -1;

  // poland_event_queue and the legacy desk both normalise before compiling
  // their choices; that pass is what schedules the due local file.
  engine.goToScene('poland_normalize');
  applyState(engine.state.qualities, file.state);
  applyState(engine.state.qualities, extra || {});
  engine.goToScene('poland_local_affairs.router');
  return engine;
}

const dispatched = new Set();

FILES.forEach(function(file) {
  ROLES.forEach(function(role) {
    // 1. Reachability: the router must land on this file's own scene.
    const engine = openFile(file, role);
    assert.strictEqual(
      engine.state.qualities.local_affairs_next,
      file.id,
      file.id + ' is not the dispatched file in ' + role.name
    );
    assert.strictEqual(
      engine.state.sceneId,
      file.scene,
      file.id + ' did not open its own scene in ' + role.name +
        ' (landed on ' + engine.state.sceneId + ')'
    );
    dispatched.add(file.id);

    // 2. Every file keeps a selectable choice with no resources and no budget.
    const broke = openFile(file, role, {resources: 0, budget: 0});
    const selectable = choices(broke).filter(function(choice) {
      return choice.canChoose;
    });
    assert(
      selectable.length > 0,
      file.id + ' dead-ends at zero resources in ' + role.name
    );

    // 3. Every choice ends on a retained result with an explicit exit.
    selectable.forEach(function(choice, index) {
      const walk = openFile(file, role, {resources: 0, budget: 0});
      const options = choices(walk).filter(function(option) {
        return option.canChoose;
      });
      walk.choose(choices(walk).indexOf(options[index]));
      const landed = walk.state.sceneId;
      const exits = choices(walk);
      assert(
        exits.length > 0,
        file.id + ' choice ' + choice.id + ' left the player with no exit (' +
          landed + ')'
      );
      // A substantive decision must land on a retained result the player
      // leaves deliberately. Pure exit buttons on an already-authored result
      // page (Close the Warsaw count) are the retained beat's own exit and
      // are allowed to route straight on to the desk.
      const pureExit = /^(Close|Continue|Return|Begin|Remove)\b/
        .test(String(choice.title || ''));
      const retained = landed.startsWith('poland_local_affairs.') ||
        landed.startsWith('poland_office_authority.');
      assert(
        pureExit || retained,
        file.id + ' choice ' + choice.id + ' routes into a clean page before ' +
          'its result can be read (' + landed + ')'
      );
    });
  });
});

assert.strictEqual(dispatched.size, FILES.length,
  'Not every local file was reachable');

// 4. One file per month, and the desk stands down when the last is resolved.
// Kraków and the rural buses are both overdue here; the desk may still serve
// only one of them this month. The dispatch stamps the month, and the next
// normalise pass — which every desk runs on arrival — stands the entry down.
const busy = openFile(FILES[4], ROLES[0], {krakow_clean_transport_done: 0});
assert.strictEqual(busy.state.qualities.local_affairs_next, 'krakow',
  'Two overdue local files must still be served oldest-first, one per month');
assert.strictEqual(
  Number(busy.state.qualities.last_local_affairs_time),
  Number(busy.state.qualities.time),
  'The dispatch must stamp the month it served'
);
busy.state.qualities.krakow_clean_transport_done = 1;
busy.goToScene('poland_normalize');
assert.strictEqual(busy.state.qualities.local_affairs_dispatchable, 0,
  'The desk must stand down for the rest of the month after one dispatch');
assert.strictEqual(busy.state.qualities.local_affairs_next, 'buses',
  'The file that had to wait must still be due next month');

const cleared = newEngine('local-affairs-cleared');
const clearedQ = cleared.state.qualities;
clearedQ.continuous_campaign = 1;
clearedQ.year = 2026;
clearedQ.month = 7;
clearedQ.time = (2026 - 2019) * 12 + 7;
clearedQ.sutryk_term_limit_done = 1;
clearedQ.krakow_clean_transport_done = 1;
clearedQ.rural_bus_exclusion_done = 1;
clearedQ.warsaw_alcohol_policy_done = 1;
cleared.goToScene('poland_normalize');
assert.strictEqual(clearedQ.local_affairs_next, '',
  'No local file may remain due once all six are resolved');
assert.strictEqual(clearedQ.local_affairs_dispatchable, 0,
  'The local desk must not queue itself with nothing to dispatch');

// The router covers every id the scheduler can produce.
const routerSource = fs.readFileSync(
  path.join(projectRoot, 'source/scenes/poland_local_affairs.scene.dry'), 'utf8'
);
const routerGoTo = (routerSource.match(/^go-to: warsaw_campaign.*$/m) || [''])[0];
const normalizeSource = fs.readFileSync(
  path.join(projectRoot, 'source/scenes/poland_normalize.scene.dry'), 'utf8'
);
const scheduledIds = Array.from(
  normalizeSource.matchAll(/localAffairsDue\.push\(\{\s*\n?\s*id: "([a-z_]+)"/g),
  function(match) { return match[1]; }
);
assert(scheduledIds.length >= FILES.length,
  'The scheduler no longer offers every local file');
scheduledIds.forEach(function(id) {
  assert(
    routerGoTo.includes('"' + id + '"'),
    'The router has no branch for scheduled local file ' + id
  );
});

// The scheduler compares a `time`-based Warsaw due date with a calendar month
// index. Unless both are converted to the same scale, every Warsaw file sorts
// ahead of a dated file that has been waiting since 2024.
const queueOrder = newEngine('local-affairs-order');
const orderQ = queueOrder.state.qualities;
orderQ.continuous_campaign = 1;
orderQ.year = 2025;
orderQ.month = 9;
orderQ.time = (2025 - 2019) * 12 + 9;
orderQ.president_name = 'Rafał Trzaskowski';
orderQ.warsaw_mayor = 'Rafał Trzaskowski';
orderQ.last_local_affairs_time = -1;
queueOrder.goToScene('poland_normalize');
assert.strictEqual(orderQ.local_affairs_next, 'sutryk',
  'The oldest unresolved local file must be served first');

// 5. The Warsaw succession is conditional on a real vacancy, and its stored
// roll must be able to produce every candidate in the field.
const noVacancy = newEngine('local-affairs-no-vacancy');
const noVacancyQ = noVacancy.state.qualities;
noVacancyQ.continuous_campaign = 1;
noVacancyQ.year = 2025;
noVacancyQ.month = 9;
noVacancyQ.time = (2025 - 2019) * 12 + 9;
noVacancyQ.president_name = 'Karol Nawrocki';
noVacancyQ.warsaw_mayor = 'Rafał Trzaskowski';
noVacancyQ.sutryk_term_limit_done = 1;
noVacancy.goToScene('poland_normalize');
assert(Number(noVacancyQ.warsaw_succession_due_time) < 0,
  'The Warsaw succession cannot be scheduled while Trzaskowski keeps City Hall');
assert.notStrictEqual(noVacancyQ.local_affairs_next, 'warsaw_campaign');

const winners = new Map([[10, 'ko'], [70, 'pis'], [85, 'left'], [95, 'p2050']]);
winners.forEach(function(expected, roll) {
  const run = openFile(FILES[1], ROLES[0], {warsaw_succession_roll: roll});
  assert.strictEqual(
    run.state.qualities.warsaw_succession_result,
    expected,
    'Roll ' + roll + ' must elect the ' + expected + ' candidate'
  );
  assert(
    String(run.state.qualities.warsaw_mayor || '').length > 0 &&
      run.state.qualities.warsaw_mayor !== 'Rafał Trzaskowski',
    'The Warsaw result must install a named successor'
  );
});

// A left mayoralty is what unlocks the citywide alcohol rule; the check that
// the gate is real and not decorative.
const leftCityHall = openFile(FILES[5], ROLES[2], {warsaw_mayor_party: 'left'});
const otherCityHall = openFile(FILES[5], ROLES[2], {warsaw_mayor_party: 'ko'});
const citywideId = 'poland_local_affairs.alcohol_citywide';
const findChoice = function(engine) {
  return choices(engine).find(function(choice) {
    return choice.id === citywideId;
  });
};
assert(findChoice(leftCityHall) && findChoice(leftCityHall).canChoose,
  'A Left City Hall must be able to adopt the citywide rule');
assert(!findChoice(otherCityHall) || !findChoice(otherCityHall).canChoose,
  'Advice to another mayor cannot be implementation');

console.log('local-affairs-check: all checks passed (' + FILES.length +
  ' files x ' + ROLES.length + ' roles)');
