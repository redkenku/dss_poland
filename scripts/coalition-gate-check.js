'use strict';

// Targeted check for the coalition viability gate. poland_normalize publishes
// coalition_viable_<a>_<b> from the pairwise relation and the ideological
// distance between two parties; the formation menu and the snap-formation
// join options read those flags. This drives the gate itself and the formation
// menu that consumes it.

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

// poland_party_ai seeds the hidden rival matrix on its first monthly run. A
// check that never advances a month has to supply the same opening values.
const OPENING_RELATIONS_2019 = {
  pis_ko: 8, pis_psl: 24, pis_konf: 34, pis_p2050: 12,
  ko_psl: 62, ko_konf: 7, ko_p2050: 54,
  psl_konf: 22, psl_p2050: 58, konf_p2050: 10
};
const OPENING_RELATIONS_2023 = {
  pis_ko: 5, pis_psl: 26, pis_konf: 31, pis_p2050: 9,
  ko_psl: 68, ko_konf: 5, ko_p2050: 73,
  psl_konf: 19, psl_p2050: 82, konf_p2050: 7
};

function seedRivalRelations(Q, opening) {
  for (const pair of Object.keys(opening)) {
    Q['rival_relation_' + pair] = opening[pair];
  }
}

function newEngine() {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame(['coalition-gate-check']);
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(c) { return c.id === sceneId; });
    assert(index >= 0, 'Missing choice ' + sceneId + ' among ' +
      choices.map(function(c) { return c.id; }).join(', '));
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  return { engine: engine, choose: choose, Q: engine.state.qualities };
}

function normalize(engine) {
  engine.goToScene('poland_normalize');
}

function choiceById(engine, id) {
  const found = engine.getCurrentChoices().find(function(c) {
    return c.id === id;
  });
  assert(found, 'Missing choice ' + id + ' among ' +
    engine.getCurrentChoices().map(function(c) { return c.id; }).join(', '));
  return found;
}

function formationChamber(Q) {
  Q.year = 2023;
  Q.month = 10;
  Q.ko_seats = 157;
  Q.p2050_seats = 33;
  Q.psl_seats = 32;
  Q.left_seats = 26;
  Q.left_committed_seats = 26;
  Q.pis_seats = 194;
  Q.konf_seats = 18;
}

// --- 1. opening positions ------------------------------------------------
{
  const { engine, Q } = newEngine();
  seedRivalRelations(Q, OPENING_RELATIONS_2019);
  normalize(engine);

  assert.strictEqual(Q.coalition_viable_ko_konf, 0,
    'KO and Konfederacja must not be coalition-viable at opening relations');
  assert.strictEqual(Q.coalition_viable_pis_ko, 0,
    'PiS and KO must not be coalition-viable at opening relations');
  assert.strictEqual(Q.coalition_viable_konf_p2050, 0,
    'Konfederacja and Poland 2050 must not be coalition-viable at opening relations');
  assert.strictEqual(Q.coalition_viable_pis_konf, 1,
    'PiS and Konfederacja must stay coalition-viable at opening relations');
  assert.strictEqual(Q.coalition_viable_ko_psl, 1,
    'KO and PSL must stay coalition-viable at opening relations');

  // The player's own bloc must not be gated shut by the opening relations it
  // is handed, or the authored democratic coalition becomes unreachable.
  assert.strictEqual(Q.coalition_viable_left_ko, 1, 'Lewica-KO must open viable');
  assert.strictEqual(Q.coalition_viable_left_psl, 1, 'Lewica-PSL must open viable');
  assert.strictEqual(Q.coalition_viable_left_p2050, 1,
    'Lewica-Poland 2050 must open viable');
  assert.strictEqual(Q.coalition_viable_left_konf, 0,
    'Lewica-Konfederacja must never open viable');
}

// --- 2. relation alone cannot buy an ideologically impossible cabinet -----
{
  const { engine, Q } = newEngine();
  seedRivalRelations(Q, OPENING_RELATIONS_2019);
  Q.rival_relation_ko_konf = 100;
  Q.ko_cultural_position = 30;
  Q.konf_cultural_position = 91;
  normalize(engine);

  assert(Q.coalition_distance_ko_konf > 55,
    'A socially liberal KO must sit past the hard distance veto from Konfederacja');
  assert.strictEqual(Q.coalition_viable_ko_konf, 0,
    'Distance must veto KO-Konfederacja even at a perfect relation');
}

// --- 3. distance alone is not a veto; the relation still has to be there --
{
  const { engine, Q } = newEngine();
  seedRivalRelations(Q, OPENING_RELATIONS_2019);
  Q.ko_cultural_position = 50;
  Q.konf_cultural_position = 88;
  Q.ko_economic_position = 60;
  Q.konf_economic_position = 86;
  Q.rival_relation_ko_konf = 5;
  normalize(engine);
  assert(Q.coalition_distance_ko_konf <= 55, 'Test setup: parties moved together');
  assert(Q.coalition_required_relation_ko_konf > 5,
    'Test setup: the pair must still be far enough apart to demand trust');
  assert.strictEqual(Q.coalition_viable_ko_konf, 0,
    'A close but distrusted pair must still be blocked');

  Q.rival_relation_ko_konf = 80;
  normalize(engine);
  assert.strictEqual(Q.coalition_viable_ko_konf, 1,
    'A close and trusting pair must be allowed');
}

// --- 4. the formation menu greys the blocked arrangements ----------------
{
  const { engine, Q } = newEngine();
  seedRivalRelations(Q, OPENING_RELATIONS_2023);
  formationChamber(Q);
  engine.goToScene('poland_government_formation.formation_coalition_menu');

  assert.strictEqual(
    choiceById(engine, 'poland_government_formation.formation_pick_democratic').canChoose,
    true,
    'The authored democratic coalition must remain signable'
  );
  assert.strictEqual(
    engine.getCurrentChoices().some(function(c) {
      return c.id === 'poland_government_formation.formation_no_arrangement';
    }),
    false,
    'The hung-chamber escape must stay hidden while an arrangement is signable'
  );

  const fallbackChoice =
    'poland_government_formation.formation_fallback_menu';
  const coalitionMenu =
    'poland_government_formation.formation_coalition_menu';
  const chooseIndex = engine.getCurrentChoices().findIndex(function(c) {
    return c.id === fallbackChoice;
  });
  assert(chooseIndex >= 0, 'The coalition menu lost its fallback browser');
  engine.choose(chooseIndex);
  const backIndex = engine.getCurrentChoices().findIndex(function(c) {
    return c.id === coalitionMenu;
  });
  assert(backIndex >= 0, 'Fallback exploration has no back step');
  engine.choose(backIndex);
  assert.strictEqual(engine.state.sceneId, coalitionMenu);

  engine.goToScene('poland_government_formation.formation_fallback_ko_menu');
  assert.strictEqual(
    choiceById(engine, 'poland_government_formation.formation_fallback_ko_konf').canChoose,
    false,
    'KO + Konfederacja must be visible but unsignable at opening relations'
  );
  assert.strictEqual(
    choiceById(engine, 'poland_government_formation.formation_fallback_ko_third').canChoose,
    true,
    'KO + Third Way must stay signable at opening relations'
  );

  engine.goToScene('poland_government_formation.formation_fallback_right_menu');
  assert.strictEqual(
    choiceById(engine, 'poland_government_formation.formation_fallback_pis_konf').canChoose,
    true,
    'PiS + Konfederacja must stay signable at opening relations'
  );
}

// --- 5. a chamber where nothing is compatible still has an exit ----------
{
  const { engine, Q } = newEngine();
  formationChamber(Q);
  // The menu calls poland_normalize, so drive the inputs rather than the
  // published flags: no trust anywhere, and every party in its own corner.
  for (const pair of Object.keys(OPENING_RELATIONS_2023)) {
    Q['rival_relation_' + pair] = 0;
  }
  Q.ko_relation = 0;
  Q.psl_relation = 0;
  Q.p2050_relation = 0;
  Q.pis_relation = 0;
  Q.konf_relation = 0;
  Q.left_economic_position = 5;
  Q.left_cultural_position = 5;
  Q.pis_economic_position = 95;
  Q.pis_cultural_position = 95;
  Q.ko_economic_position = 5;
  Q.ko_cultural_position = 95;
  Q.psl_economic_position = 95;
  Q.psl_cultural_position = 5;
  Q.konf_economic_position = 50;
  Q.konf_cultural_position = 95;
  Q.p2050_economic_position = 95;
  Q.p2050_cultural_position = 50;
  engine.goToScene('poland_government_formation.formation_coalition_menu');

  const available = engine.getCurrentChoices().filter(function(c) {
    return c.canChoose;
  }).map(function(c) { return c.id; });
  assert(
    available.includes('poland_government_formation.formation_no_arrangement'),
    'A chamber with no compatible bloc must expose the hung-chamber exit; got ' +
      available.join(', ')
  );
}

console.log('coalition-gate-check: all assertions passed');
