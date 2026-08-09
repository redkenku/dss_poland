'use strict';

// The queer anomaly: a chamber in which Lewica, on its own or with the Left
// splitter clubs tolerating it from outside, holds an absolute majority. This
// drives the whole route — coalition menu, Marshal, premier, a thirteen-office
// single-party cabinet, confidence — and then the annual budget, which must
// pass once the internal caucuses are whipped and no partner exists to defect.

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

const PORTFOLIOS = [
  'labor', 'equality', 'housing', 'health', 'digital', 'science',
  'interior', 'finance', 'economy', 'justice', 'foreign',
  'agriculture', 'defence',
];

function newEngine() {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame(['left-majority-check']);
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

function choiceById(engine, id) {
  const found = engine.getCurrentChoices().find(function(c) {
    return c.id === id;
  });
  assert(found, 'Missing choice ' + id + ' among ' +
    engine.getCurrentChoices().map(function(c) { return c.id; }).join(', '));
  return found;
}

// A 2027 chamber where the Left family cleared 231 without anybody else.
function anomalyChamber(Q, splitterSeats) {
  Q.year = 2027;
  Q.month = 10;
  Q.left_seats = 240 - splitterSeats;
  Q.razem_party_seats = splitterSeats;
  Q.razem_party_relation = 70;
  Q.razem_party_formed = splitterSeats > 0 ? 1 : 0;
  // The menu's on-arrival runs before its poland_normalize call, so the
  // election result has to be handed over already aggregated, exactly as the
  // election scenes publish it.
  Q.left_splinter_seats = splitterSeats;
  Q.left_family_seats = 240;
  Q.left_splinter_support_votes = splitterSeats;
  Q.left_committed_seats = 240;
  Q.ko_seats = 90;
  Q.p2050_seats = 20;
  Q.psl_seats = 20;
  Q.pis_seats = 70;
  Q.konf_seats = 20;
  Q.left_leader = 'Agnieszka Dziemianowicz-Bąk';
}

function formCabinet(engine, Q, splitterSeats) {
  anomalyChamber(Q, splitterSeats);
  engine.goToScene('poland_government_formation.formation_coalition_menu');

  assert.strictEqual(Q.formation_option_left_only, 240,
    'The menu must publish the whole committed Left as one seat block');
  assert.strictEqual(Q.formation_left_splitter_votes, splitterSeats,
    'Splitter toleration must be reported separately from the club itself');
  assert.strictEqual(
    choiceById(engine, 'poland_government_formation.formation_pick_left_only')
      .canChoose,
    true,
    'A Left majority must be able to sign a Lewica-only contract'
  );

  engine.goToScene('poland_government_formation.formation_pick_left_only');
  assert.strictEqual(Q.formation_player_in_government, 1);
  assert.strictEqual(Q.formation_coalition_support_seats, 240);
  if (splitterSeats > 0) {
    assert(Q.razem_party_relation >= 60,
      'The toleration protocol must hold the splitter club above the ' +
      'relation threshold that keeps its seats committed');
  }

  engine.goToScene('poland_government_formation.formation_marshal_support');
  assert.strictEqual(Q.formation_marshal_elected, 1,
    'A 240-seat contract must carry its own Marshal');
  assert.strictEqual(Q.formation_coalition_locked, 0);

  engine.goToScene('poland_government_formation.formation_pm_alt');
  assert.strictEqual(Q.formation_pm_loss_left, 0,
    'A Lewica-only contract has no partner deputies for a Left premier to lose');
  engine.goToScene('poland_government_formation.formation_pm_left_dziemianowicz');
  assert.strictEqual(Q.candidate_vote_passed, 1,
    'The whip count must return an appointable Left premier');

  engine.goToScene('poland_government_formation.formation_pm_alt_success');
  engine.goToScene('poland_government_formation.formation_pm_alt_success_continue');
  assert.strictEqual(Q.ministry_ko_in_cabinet, 0, 'No KO ministers');
  assert.strictEqual(Q.ministry_psl_in_cabinet, 0, 'No PSL ministers');
  assert.strictEqual(Q.ministry_p2050_in_cabinet, 0, 'No Poland 2050 ministers');
  assert.strictEqual(Q.ministry_left_cabinet_seats, 240,
    'The whole committed Left, splitters included, is the government');
  assert.strictEqual(Q.ministry_base_leverage, 99,
    'A single-party cabinet is entitled to every portfolio');

  engine.goToScene('poland_ministries.take_all_left');
  assert.strictEqual(Q.ministry_count, 13,
    'One signature must fill all thirteen offices');
  for (const portfolio of PORTFOLIOS) {
    assert.strictEqual(Q[portfolio + '_minister_party'], 'Lewica',
      portfolio + ' must be held by Lewica');
    assert(String(Q[portfolio + '_minister'] || '').trim().length > 0,
      portfolio + ' must have a named minister');
  }

  engine.goToScene('poland_ministries.finalize');
  engine.goToScene('poland_government_formation.cabinet_signed_agreement');
  engine.goToScene('poland_government_formation.cabinet_confidence_roll');
  assert.strictEqual(Q.cabinet_confidence_passed, 1,
    'A 240-seat single-party cabinet must win confidence');
  engine.goToScene('poland_government_formation.cabinet_success');
  assert.strictEqual(Q.left_in_government, 1);
  assert.strictEqual(Q.government_party, 'lewica');
}

// --- 1. Lewica alone -----------------------------------------------------
{
  const { engine, Q } = newEngine();
  formCabinet(engine, Q, 0);
  assert.strictEqual(Q.formation_coalition_label, 'Lewica');
}

// --- 2. Lewica with a splitter club tolerating from outside --------------
{
  const { engine, Q } = newEngine();
  formCabinet(engine, Q, 35);
  assert.strictEqual(
    Q.formation_coalition_label,
    'Lewica, tolerated by the Left splitter clubs'
  );

  // Every Government Affairs portfolio card must be reachable.
  engine.goToScene('poland_normalize');
  assert(Q.coalition_seats >= 231,
    'Toleration must keep counting as government seats after normalisation, ' +
    'not evaporate into an outside-support number');

  // --- 3. the budget passes once the internal caucuses are whipped -------
  Q.time = 96;
  engine.goToScene('poland_budget_2023_2026.annual_budget');
  assert.strictEqual(Q.annual_budget_left_cabinet_authority, 1,
    'A Lewica cabinet writes its own budget');
  engine.goToScene('poland_budget_2023_2026.government_social_protocol');
  engine.goToScene('poland_budget_2023_2026.finance_progressive_revenue');
  engine.goToScene('poland_budget_2023_2026.internal_ratification');
  engine.goToScene('poland_budget_2023_2026.internal_lock');
  assert.strictEqual(Q.annual_budget_predicted_partner_defectors, 0,
    'There is no coalition partner left to defect');
  assert.strictEqual(Q.annual_budget_predicted_passed, 1,
    'A whipped single-party majority must carry its own budget');
}

console.log('left-majority-check: all assertions passed');
