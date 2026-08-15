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

function choiceText(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(choiceText).join(' ');
  return choiceText(value.content);
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

function setPiSRivalGates(Q, enabled) {
  const gates = [
    'pis_psl', 'pis_p2050', 'psl_p2050',
    'pis_konf', 'psl_konf', 'konf_p2050'
  ];
  for (const gate of gates) {
    Q['coalition_viable_' + gate] = enabled.includes(gate) ? 1 : 0;
  }
}

function preparePiSRoute(seats, gates, code, lifecycle) {
  const run = newEngine();
  const Q = run.Q;
  Object.assign(Q, {
    year: 2023,
    sejm_total: 460,
    sejm_statutory_majority: 231,
    formation_majority_needed: 231,
    formation_pending_pis_code: code || 'left_pis',
    formation_solpol_exit_seats: 0,
    suwerenna_walkout: 1,
    left_committed_seats: seats.left,
    left_seats: seats.left,
    pis_seats: seats.pis,
    psl_seats: seats.psl,
    p2050_seats: seats.p2050,
    konf_seats: seats.konf
  });
  Object.assign(Q, lifecycle || {});
  setPiSRivalGates(Q, gates);
  run.engine.goToScene(
    'poland_government_formation.formation_prepare_pis_route'
  );
  assert.strictEqual(
    run.engine.state.sceneId,
    'poland_government_formation.formation_pis_safeguard_institutions'
  );
  return run;
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
  assert.strictEqual(Q.formation_status_democratic, 'Passes');
  assert.strictEqual(Q.formation_status_left_pis_psl, 'Passes');
  assert.strictEqual(Q.formation_status_left_pis_p2050, 'No path');
  assert(
    engine.getCurrentChoices().filter(function(choice) {
      return choice.id.includes('.formation_pick_');
    }).every(function(choice) { return choice.canChoose; }),
    'The coalition menu must hide rather than grey out impossible routes'
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
    engine.getCurrentChoices().some(function(choice) {
      return choice.id ===
        'poland_government_formation.formation_fallback_ko_konf';
    }),
    false,
    'KO + Konfederacja must be hidden at opening relations'
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

// --- 5a. the menu shows the viable NL-TD route, not dead arithmetic -------
{
  const { engine, Q } = newEngine();
  seedRivalRelations(Q, OPENING_RELATIONS_2023);
  Object.assign(Q, {
    year: 2023,
    month: 10,
    sejm_total: 460,
    sejm_statutory_majority: 231,
    ko_seats: 135,
    p2050_seats: 64,
    psl_seats: 57,
    left_seats: 115,
    left_committed_seats: 115,
    pis_seats: 71,
    konf_seats: 18,
    suwerenna_walkout: 1
  });
  engine.goToScene('poland_government_formation.formation_coalition_menu');
  const choices = engine.getCurrentChoices();
  const ids = choices.map(function(choice) { return choice.id; });
  const leftThird = choices.find(function(choice) {
    return choice.id ===
      'poland_government_formation.formation_pick_left_third';
  });
  assert(leftThird && leftThird.canChoose, 'The NL + TD majority is missing');
  assert.strictEqual(String(leftThird.title), 'Build Lewica + Third Way');
  for (const hidden of [
    'formation_pick_left_only',
    'formation_pick_left_p2050',
    'formation_pick_left_psl',
    'formation_pick_left_pis'
  ]) {
    assert(!ids.includes('poland_government_formation.' + hidden),
      hidden + ' should be hidden when it cannot reach 231');
  }
  engine.goToScene(
    'poland_government_formation.formation_fallback_right_menu'
  );
  const fallbackIds = engine.getCurrentChoices().map(function(choice) {
    return choice.id;
  });
  assert(!fallbackIds.includes(
    'poland_government_formation.formation_fallback_pis_konf'
  ), 'A fallback that cannot reach 231 even with NL must be hidden');
  const pslFallback = choiceById(
    engine,
    'poland_government_formation.formation_fallback_pis_konf_psl'
  );
  engine.choose(engine.getCurrentChoices().findIndex(function(choice) {
    return choice.id === pslFallback.id;
  }));
  const roleIds = engine.getCurrentChoices().map(function(choice) {
    return choice.id;
  });
  assert(!roleIds.includes(
    'poland_government_formation.formation_fallback_formal'
  ), 'A sub-majority fallback must not offer a formal cabinet');
  assert(roleIds.includes(
    'poland_government_formation.formation_fallback_tolerate'
  ), 'A fallback reaching 231 with NL toleration must remain available');
}

// --- 6. PiS rival search is arithmetic-first and preference-ordered -------
{
  const center = preparePiSRoute(
    { pis: 210, psl: 25, p2050: 10, konf: 12, left: 30 },
    ['pis_psl']
  );
  assert.strictEqual(center.Q.formation_pis_rival_code, 'pis_psl');
  assert.strictEqual(center.Q.formation_pis_rival_pressure, 2,
    'A centrist replacement must need two deterrence commitments');

  const wholeThird = preparePiSRoute(
    { pis: 200, psl: 15, p2050: 20, konf: 10, left: 35 },
    ['pis_psl', 'pis_p2050', 'psl_p2050']
  );
  assert.strictEqual(wholeThird.Q.formation_pis_rival_code, 'pis_third');

  const pslKonf = preparePiSRoute(
    { pis: 190, psl: 20, p2050: 10, konf: 25, left: 45 },
    ['pis_psl', 'pis_konf', 'psl_konf']
  );
  assert.strictEqual(pslKonf.Q.formation_pis_rival_code, 'pis_psl_konf');
  assert.strictEqual(pslKonf.Q.formation_pis_rival_pressure, 1,
    'A Konfederacja-assisted replacement must need one deterrence commitment');

  const fullThirdKonf = preparePiSRoute(
    { pis: 180, psl: 20, p2050: 20, konf: 20, left: 55 },
    ['pis_psl', 'pis_p2050', 'psl_p2050',
      'pis_konf', 'psl_konf', 'konf_p2050']
  );
  assert.strictEqual(
    fullThirdKonf.Q.formation_pis_rival_code,
    'pis_third_konf'
  );

  const blockedP2050Konf = preparePiSRoute(
    { pis: 180, psl: 20, p2050: 20, konf: 20, left: 55 },
    ['pis_psl', 'pis_p2050', 'psl_p2050', 'pis_konf', 'psl_konf']
  );
  assert.strictEqual(blockedP2050Konf.Q.formation_pis_rival_code, 'none',
    'Full Third Way plus Konfederacja must retain the P2050-Konf veto');

  const standaloneKonf = preparePiSRoute(
    { pis: 220, psl: 5, p2050: 5, konf: 15, left: 30 },
    ['pis_konf']
  );
  assert.strictEqual(standaloneKonf.Q.formation_pis_rival_code, 'pis_konf',
    'Standalone PiS-Konf must be the last compatible majority');

  const noRival = preparePiSRoute(
    { pis: 180, psl: 20, p2050: 20, konf: 10, left: 60 },
    ['pis_psl', 'pis_p2050', 'psl_p2050',
      'pis_konf', 'psl_konf', 'konf_p2050']
  );
  assert.strictEqual(noRival.Q.formation_pis_rival_code, 'none');
  assert.strictEqual(noRival.Q.formation_pis_rival_pressure, 0,
    'Sub-majority alternatives must not start an escalation');

  center.choose('poland_government_formation.formation_pis_institutions_firm');
  center.choose('poland_government_formation.formation_pis_welfare_firm');
  assert.strictEqual(center.Q.formation_pis_rival_pressure, 0);
  center.choose('poland_government_formation.formation_pis_exclusive_firm');
  assert.strictEqual(center.Q.formation_pis_rival_process_resolved, 1);
  assert.strictEqual(center.Q.formation_pis_left_taboo_broken, 1);
  center.Q.formation_pending_pis_code = 'left_pis';
  center.engine.goToScene(
    'poland_government_formation.formation_prepare_pis_route'
  );
  assert.strictEqual(center.Q.formation_pis_rival_code, 'none',
    'A resolved rival contest must not replay in a later formation');

  standaloneKonf.choose(
    'poland_government_formation.formation_pis_institutions_firm'
  );
  assert.strictEqual(standaloneKonf.Q.formation_pis_rival_pressure, 0,
    'One firm commitment must close a Konfederacja alternative');

  const earlyGowinEntry = preparePiSRoute(
    { pis: 210, psl: 25, p2050: 10, konf: 12, left: 30 },
    ['pis_psl'],
    'left_pis',
    {
      formation_pis_left_taboo_broken: 1,
      formation_pis_left_taboo_origin:
        'Joined PiS after Gowin\'s exit in 2021'
    }
  );
  assert.strictEqual(earlyGowinEntry.Q.formation_pis_rival_code, 'none',
    'The post-Gowin cabinet entry must suppress the later rival minigame');
  assert.strictEqual(
    earlyGowinEntry.Q.formation_pis_rival_process_resolved || 0,
    0,
    'Breaking the taboo early is distinct from playing the rival contest'
  );

  const laterFirstPivot = preparePiSRoute(
    { pis: 210, psl: 25, p2050: 10, konf: 12, left: 30 },
    ['pis_psl'],
    'left_pis',
    {
      year: 2026,
      formation_pis_left_taboo_broken: 0,
      formation_pis_rival_process_resolved: 0
    }
  );
  assert.strictEqual(laterFirstPivot.Q.formation_pis_rival_code, 'pis_psl',
    'A first PiS-Lewica pivot in a later snap formation still needs the contest');
}

// --- 7. Solidarna Polska exits once and its MPs are real arithmetic -------
{
  const { engine, Q } = newEngine();
  seedRivalRelations(Q, OPENING_RELATIONS_2023);
  formationChamber(Q);
  Q.left_seats = 60;
  Q.left_committed_seats = 60;
  const solidarna = Q.rival_group_records.find(function(record) {
    return record.id === 'solidarna';
  });
  assert(solidarna, 'The canonical Solidarna Polska organisation is missing');
  Object.assign(solidarna, {
    allied: 1, independent: 0, in_cabinet: 1,
    mp_count: 18, sejm_mps: 18, exclusive_seats: 18
  });
  Q.suwerenna_walkout = 0;
  engine.goToScene('poland_government_formation.formation_coalition_menu');
  assert.strictEqual(Q.formation_solpol_exit_seats, 18);
  assert.strictEqual(
    Q.formation_option_left_pis,
    Q.pis_seats - 18 + Q.left_committed_seats,
    'PiS-Lewica must be gated on support after the Solidarna walkout'
  );
  assert.strictEqual(
    choiceById(engine,
      'poland_government_formation.formation_pick_left_pis').canChoose,
    true
  );
  const pisBefore = Q.pis_seats;
  const optionIndex = engine.getCurrentChoices().findIndex(function(choice) {
    return choice.id ===
      'poland_government_formation.formation_pick_left_pis';
  });
  engine.choose(optionIndex);
  assert.strictEqual(Q.pis_seats, pisBefore - 18);
  assert.strictEqual(Q.suwerenna_walkout, 1);
  assert.strictEqual(Q.suwerenna_seats, 18);
  assert.strictEqual(Q.formation_solpol_exit_triggered, 1);
  assert.deepStrictEqual(Q.formation_coalition_members, ['pis', 'lewica']);
  const netPiS = Q.pis_seats;
  engine.goToScene('poland_government_formation.formation_coalition_menu');
  assert.strictEqual(Q.formation_solpol_exit_seats, 0,
    'An already independent Solidarna Polska caucus must not be deducted twice');
  assert.strictEqual(
    Q.formation_option_left_pis,
    netPiS + Q.left_committed_seats
  );
}

// --- 8. Miller-Konf mirrors stay visible but require the signed pact ------
{
  const { engine, Q } = newEngine();
  seedRivalRelations(Q, OPENING_RELATIONS_2023);
  formationChamber(Q);
  Q.suwerenna_walkout = 1;
  engine.goToScene('poland_government_formation.formation_coalition_menu');
  const mirrors = [
    'formation_pick_left_pis_konf',
    'formation_pick_left_pis_konf_psl',
    'formation_pick_left_pis_konf_p2050',
    'formation_pick_left_pis_konf_third'
  ];
  for (const id of mirrors) {
    assert.strictEqual(
      engine.getCurrentChoices().some(function(choice) {
        return choice.id === 'poland_government_formation.' + id;
      }),
      false,
      id + ' escaped the Miller pact visibility gate'
    );
  }

  Q.sld_populist_route_active = 1;
  Q.miller_restoration_done = 1;
  Q.old_left_route_state = 'miller_restoration';
  Q.sld_populist_orientation = 'konfederacja';
  Q.sld_populist_alliance_state = 'accepted';
  Q.sejm_list_outcome = 'konf_5';
  engine.goToScene('poland_government_formation.formation_coalition_menu');
  assert.strictEqual(Q.formation_miller_konf_exception, 1);
  assert.strictEqual(
    choiceById(engine,
      'poland_government_formation.formation_pick_left_pis_konf').canChoose,
    true,
    'The base Miller-PiS-Konf cabinet should unlock on the completed pact'
  );
  assert.strictEqual(Q.formation_status_left_pis_konf, 'Passes');
  assert.strictEqual(Q.coalition_viable_left_konf, 0,
    'The exception must not globally legalize Lewica-Konfederacja');
}

// --- 9. nominee and ministry menus read only formal members ---------------
{
  const plain = newEngine();
  Object.assign(plain.Q, {
    year: 2023,
    president_name: 'Andrzej Duda',
    presidential_majority_designation: 0,
    formation_coalition_selected: 1,
    formation_coalition_code: 'left_pis',
    formation_coalition_label: 'PiS + Lewica',
    formation_coalition_members: ['pis', 'lewica'],
    formation_coalition_support_seats: 240,
    formation_player_in_government: 1,
    formation_government_party: 'pis',
    sejm_statutory_majority: 231,
    pis_seats: 180,
    left_seats: 60,
    left_committed_seats: 60,
    psl_seats: 20,
    p2050_seats: 20
  });
  plain.engine.goToScene('poland_government_formation.formation_pm_alt');
  const plainChoices = plain.engine.getCurrentChoices().map(function(choice) {
    return choice.id;
  });
  assert(!plainChoices.includes(
    'poland_government_formation.formation_pm_alt_kosiniak'
  ), 'Plain PiS-Lewica leaked WKK into its nominee slate');
  assert(!plainChoices.includes(
    'poland_government_formation.formation_pm_alt_p2050_menu'
  ), 'Plain PiS-Lewica leaked Poland 2050 nominees');
  for (const id of [
    'formation_pm_alt_morawiecki', 'formation_pm_alt_szydlo',
    'formation_pm_alt_czarnek', 'formation_pm_alt_kowalczyk'
  ]) {
    assert(plainChoices.includes('poland_government_formation.' + id),
      'The PiS slate is missing ' + id);
  }

  Object.assign(plain.Q, {
    left_cabinet_committed: 1,
    left_cabinet_model_code: 'ordinary_left_delegation',
    ministry_return_mode: 'cabinet_program',
    ministry_allocation_mode: 'formation',
    formation_in_progress: 1,
    prime_minister_party: 'pis',
    government_party: 'pis'
  });
  plain.engine.goToScene('poland_ministries');
  assert.strictEqual(plain.Q.ministry_pis_in_cabinet, 1);
  assert.strictEqual(plain.Q.ministry_psl_in_cabinet, 0);
  assert.strictEqual(plain.Q.agriculture_minister_party, 'PiS',
    'Plain PiS-Lewica leaked PSL Agriculture ownership');

  const miller = newEngine();
  Object.assign(miller.Q, {
    year: 2023,
    formation_coalition_selected: 1,
    formation_coalition_code: 'left_pis_konf_third',
    formation_coalition_members: ['pis', 'lewica', 'konf', 'psl', 'p2050'],
    formation_coalition_support_seats: 280,
    formation_player_in_government: 1,
    formation_government_party: 'pis',
    formation_miller_konf_exception: 1,
    sejm_statutory_majority: 231,
    pis_seats: 170,
    left_seats: 45,
    left_committed_seats: 45,
    psl_seats: 25,
    p2050_seats: 25,
    konf_seats: 15,
    presidential_majority_designation: 0
  });
  miller.engine.goToScene('poland_government_formation.formation_pm_alt');
  const millerChoices = miller.engine.getCurrentChoices().map(function(choice) {
    return choice.id;
  });
  assert(millerChoices.includes(
    'poland_government_formation.formation_pm_alt_sps_menu'
  ));
  assert(!millerChoices.includes(
    'poland_government_formation.formation_pm_alt_left_menu'
  ));

  Object.assign(miller.Q, {
    left_cabinet_committed: 1,
    left_cabinet_model_code: 'ordinary_left_delegation',
    ministry_return_mode: 'cabinet_program',
    ministry_allocation_mode: 'formation',
    formation_in_progress: 1,
    prime_minister_party: 'pis',
    government_party: 'pis'
  });
  miller.engine.goToScene('poland_ministries');
  assert.strictEqual(miller.Q.ministry_konf_in_cabinet, 1);
  assert.strictEqual(miller.Q.finance_minister_party, 'Konfederacja');
  assert.strictEqual(miller.Q.finance_minister, 'Sławomir Mentzen');
  assert.strictEqual(miller.Q.economy_minister_party, 'Konfederacja');
  assert.strictEqual(miller.Q.agriculture_minister_party, 'PSL');
  assert.strictEqual(miller.Q.digital_minister_party, 'Poland 2050');
}

// --- 10. Duda's designation precedes the wider Sejm nominee slate --------
{
  const { engine, Q, choose } = newEngine();
  Object.assign(Q, {
    year: 2023,
    president_name: 'Andrzej Duda',
    presidential_majority_designation: 1,
    formation_presidential_attempt_resolved: 0,
    formation_coalition_selected: 1,
    formation_coalition_code: 'left_pis',
    formation_coalition_members: ['pis', 'lewica'],
    formation_pis_cabinet_committed: 1,
    formation_coalition_support_seats: 240,
    formation_government_party: 'pis'
  });
  engine.goToScene('poland_government_formation.formation_pm_stage');
  assert.strictEqual(
    engine.state.sceneId,
    'poland_government_formation.formation_duda_first_attempt'
  );
  choose('poland_government_formation.formation_duda_attempt_lapses');
  assert.strictEqual(Q.presidential_majority_designation, 0);
  assert.strictEqual(Q.formation_coalition_code, 'left_pis',
    'Letting Duda\'s attempt lapse must preserve the signed coalition');
  assert.strictEqual(
    engine.state.sceneId,
    'poland_government_formation.formation_pm_alt'
  );
}

// --- 11. formal seats never manufacture outside toleration ----------------
{
  const majority = newEngine();
  seedRivalRelations(majority.Q, OPENING_RELATIONS_2023);
  Object.assign(majority.Q, {
    year: 2023,
    month: 10,
    sejm_total: 460,
    sejm_statutory_majority: 231,
    ko_seats: 200,
    left_seats: 59,
    left_committed_seats: 59,
    p2050_seats: 25,
    psl_seats: 15,
    pis_seats: 140,
    konf_seats: 21
  });
  majority.engine.goToScene(
    'poland_government_formation.formation_coalition_menu'
  );
  assert.strictEqual(majority.Q.formation_option_ko_left_formal, 259);
  assert.strictEqual(majority.Q.formation_option_ko_left_outside, 0);
  assert.strictEqual(majority.Q.formation_status_ko_left, 'Passes');
  const majorityChoice = choiceById(
    majority.engine,
    'poland_government_formation.formation_pick_ko_left'
  );
  assert.strictEqual(majorityChoice.canChoose, true);
  majority.engine.choose(majority.engine.getCurrentChoices().findIndex(
    function(choice) { return choice.id === majorityChoice.id; }
  ));
  assert.strictEqual(majority.Q.formation_coalition_seats, 259);
  assert.strictEqual(majority.Q.formation_coalition_support_seats, 259);
  assert.deepStrictEqual(majority.Q.formation_coalition_members, [
    'ko', 'lewica'
  ]);
  assert.strictEqual(majority.Q.coalition_status,
    'Self-sufficient KO-Lewica majority');

  const tolerated = newEngine();
  seedRivalRelations(tolerated.Q, OPENING_RELATIONS_2023);
  Object.assign(tolerated.Q, {
    year: 2023,
    month: 10,
    sejm_total: 460,
    sejm_statutory_majority: 231,
    ko_seats: 190,
    left_seats: 35,
    left_committed_seats: 35,
    p2050_seats: 20,
    psl_seats: 15,
    pis_seats: 180,
    konf_seats: 20
  });
  tolerated.engine.goToScene(
    'poland_government_formation.formation_coalition_menu'
  );
  assert.strictEqual(tolerated.Q.formation_option_ko_left_formal, 225);
  assert.strictEqual(tolerated.Q.formation_option_ko_left_outside, 6);
  assert.strictEqual(tolerated.Q.formation_status_ko_left, 'Needs support');
  const toleratedChoice = choiceById(
    tolerated.engine,
    'poland_government_formation.formation_pick_ko_left'
  );
  tolerated.engine.choose(tolerated.engine.getCurrentChoices().findIndex(
    function(choice) { return choice.id === toleratedChoice.id; }
  ));
  assert.strictEqual(tolerated.Q.formation_coalition_support_seats, 231);
  Object.assign(tolerated.Q, {
    democratic_candidate: 'Donald Tusk',
    confidence_candidate: 'Donald Tusk',
    formation_pm_candidate_loss: 0,
    presidential_majority_designation: 0
  });
  tolerated.engine.goToScene(
    'poland_government_formation.formation_pm_alt_roll'
  );
  assert.strictEqual(
    tolerated.Q.candidate_p2050_votes + tolerated.Q.candidate_psl_votes,
    6,
    'The nominee roll must add the exact six-vote shortfall, not a fixed ten'
  );
}

// --- 12. every KO-free center-left majority has a formal route ------------
for (const route of [
  ['left_p2050', 'formation_pick_left_p2050', ['p2050', 'lewica'], 240, 1],
  ['left_psl', 'formation_pick_left_psl', ['psl', 'lewica'], 235, 1],
  ['left_third', 'formation_pick_left_third',
    ['p2050', 'psl', 'lewica'], 275, 0]
]) {
  const run = newEngine();
  seedRivalRelations(run.Q, OPENING_RELATIONS_2023);
  Object.assign(run.Q, {
    year: 2023,
    month: 10,
    sejm_total: 460,
    sejm_statutory_majority: 231,
    ko_seats: 80,
    left_seats: 200,
    left_committed_seats: 200,
    p2050_seats: 40,
    psl_seats: 35,
    pis_seats: 90,
    konf_seats: 15
  });
  run.engine.goToScene(
    'poland_government_formation.formation_coalition_menu'
  );
  const choice = choiceById(
    run.engine,
    'poland_government_formation.' + route[1]
  );
  assert.strictEqual(choice.canChoose, true, route[0] + ' must be signable');
  run.engine.choose(run.engine.getCurrentChoices().findIndex(
    function(candidate) { return candidate.id === choice.id; }
  ));
  assert.strictEqual(run.Q.formation_coalition_code, route[0]);
  assert.deepStrictEqual(run.Q.formation_coalition_members, route[2]);
  assert.strictEqual(run.Q.formation_coalition_seats, route[3]);
  assert.strictEqual(run.Q.formation_coalition_support_seats, route[3]);
  assert.strictEqual(run.Q.third_way_split, route[4]);
}

// --- 13. cabinet programme names and moves only real supporters ----------
function cabinetProgrammeRun(members, p2050Votes, pslVotes) {
  const run = newEngine();
  Object.assign(run.Q, {
    formation_pis_player_coalition: 0,
    formation_coalition_selected: 1,
    formation_coalition_members: members,
    formation_coalition_support_seats: 300,
    democratic_votes: 300,
    democratic_candidate: 'Coalition nominee',
    sejm_total: 460,
    sejm_quorum_floor: 230,
    coalition_right_seats: 160,
    candidate_right_absent: 0,
    candidate_ko_votes: members.includes('ko') ? 100 : 0,
    candidate_p2050_votes: p2050Votes,
    candidate_psl_votes: pslVotes,
    candidate_left_votes: 100,
    razem_seats: 0,
    ministry_ko_in_cabinet: members.includes('ko') ? 1 : 0,
    ministry_p2050_in_cabinet: members.includes('p2050') ? 1 : 0,
    ministry_psl_in_cabinet: members.includes('psl') ? 1 : 0,
    psl_coalition_dissent: 20,
    p2050_coalition_dissent: 20,
    ko_coalition_dissent: 20,
    psl_relation: 50,
    p2050_relation: 50
  });
  run.engine.goToScene('poland_government_formation.cabinet_program');
  return run;
}

for (const route of [
  [['ko', 'lewica'], 0, 0],
  [['p2050', 'lewica'], 40, 0],
  [['psl', 'lewica'], 0, 35],
  [['p2050', 'psl', 'lewica'], 40, 35],
  [['ko', 'p2050', 'psl', 'lewica'], 40, 35],
  [['ko', 'psl', 'lewica'], 4, 35],
  [['ko', 'p2050', 'lewica'], 40, 4]
]) {
  const run = cabinetProgrammeRun(route[0], route[1], route[2]);
  const social = choiceText(choiceById(
    run.engine,
    'poland_government_formation.cabinet_social_deadlines'
  ).subtitle);
  const rural = choiceById(
    run.engine,
    'poland_government_formation.cabinet_rural_priority'
  );
  const ruralText = choiceText(rural.title) + ' ' +
    choiceText(rural.subtitle);
  assert.strictEqual(social.includes('Poland 2050'), route[1] > 0,
    'Social-deadline prose leaked or omitted Poland 2050');
  assert.strictEqual(social.includes('PSL'), route[2] > 0,
    'Social-deadline prose leaked or omitted PSL');
  if (route[2] === 0) {
    assert(!ruralText.includes('PSL'), 'Rural prose leaked absent PSL');
  }
  run.engine.goToScene(
    'poland_government_formation.cabinet_social_deadlines'
  );
  const p2050Loss = Math.min(2, route[1]);
  const pslLoss = Math.min(12, route[2]);
  assert.strictEqual(run.Q.p2050_coalition_dissent,
    20 + (route[0].includes('p2050') ? p2050Loss : 0));
  assert.strictEqual(run.Q.psl_coalition_dissent,
    20 + (route[0].includes('psl') ? pslLoss : 0));
  assert.strictEqual(run.Q.p2050_relation,
    50 - (route[0].includes('p2050') ? 0 : Math.min(3, p2050Loss)));
  assert.strictEqual(run.Q.psl_relation,
    50 - (route[0].includes('psl') ? 0 : Math.min(6, pslLoss)));
}

for (const choice of [
  'cabinet_minimum_text', 'cabinet_rural_priority'
]) {
  const run = cabinetProgrammeRun(['ko', 'lewica'], 0, 0);
  run.engine.goToScene('poland_government_formation.' + choice);
  assert.strictEqual(run.Q.psl_coalition_dissent, 20,
    choice + ' moved absent PSL coalition dissent');
  assert.strictEqual(run.Q.p2050_coalition_dissent, 20,
    choice + ' moved absent Poland 2050 coalition dissent');
  assert.strictEqual(run.Q.psl_relation, 50,
    choice + ' moved the relation with non-supporting PSL');
  assert.strictEqual(run.Q.p2050_relation, 50,
    choice + ' moved the relation with non-supporting Poland 2050');
}

// --- 14. reusable agreement model: roster, vetoes, names and annexes ------
{
  const run = newEngine();
  normalize(run.engine);
  const Q = run.Q;
  const model = globalThis.polandCoalitionModel;
  assert(model, 'The shared coalition model was not published');
  assert.strictEqual(
    Q.parliamentary_party_records.reduce(function(total, party) {
      return total + Number(party.sejm_mps || 0);
    }, 0),
    Number(Q.sejm_total),
    'The parliamentary roster must equal the statutory Sejm total'
  );
  assert.deepStrictEqual(model.names['ko+konf'],
    ['Pakt Wolności i Reform', 'Freedom and Reform Pact']);
  assert.deepStrictEqual(model.names['pis+p2050'],
    ['Koalicja Nowej Wspólnoty', 'New Community Coalition']);
  assert.deepStrictEqual(model.names['lewica+ko+p2050+psl'],
    ['Pełna Koalicja Demokratyczna', 'Full Democratic Coalition']);
  assert.strictEqual(model.templates(Q).some(function(template) {
    return template.code.indexOf('left_pis_konf') === 0;
  }), false, 'SPS templates leaked into an ordinary Lewica game');

  Object.assign(Q, {
    year: 2024, sejm_total: 460, sejm_statutory_majority: 231,
    left_seats: 0, ko_seats: 130, pis_seats: 130,
    p2050_seats: 100, psl_seats: 100, konf_seats: 0,
    ko_coalition_openness: 100, pis_coalition_openness: 100,
    p2050_coalition_openness: 100,
    rival_relation_pis_ko: 100, rival_relation_pis_p2050: 100,
    coalition_viable_pis_ko: 1, coalition_viable_pis_p2050: 1,
    pis_economic_position: 50, pis_cultural_position: 50,
    ko_economic_position: 50, ko_cultural_position: 50,
    p2050_economic_position: 50, p2050_cultural_position: 50
  });
  model.initialise(Q, {mode: 'replacement', sponsor: 'pis', seed_current: false,
    roles: {pis: 'cabinet', ko: 'cabinet'}});
  assert(model.preview(Q).blockers.some(function(reason) {
    return reason.includes('KO and PiS');
  }), 'KO–PiS lost its permanent cabinet veto');

  model.initialise(Q, {mode: 'replacement', sponsor: 'pis', seed_current: false,
    roles: {pis: 'cabinet', p2050: 'cabinet'}});
  assert.strictEqual(model.preview(Q).blockers.some(function(reason) {
    return reason.includes('cannot share') || reason.includes('will not enter');
  }), false, 'PiS–Poland 2050 was incorrectly made a permanent veto');

  Object.assign(Q, {
    ko_seats: 130, pis_seats: 0, p2050_seats: 100,
    psl_seats: 100, konf_seats: 130,
    konf_coalition_openness: 100, rival_relation_ko_konf: 100,
    coalition_viable_ko_konf: 1,
    konf_economic_position: 50, konf_cultural_position: 50
  });
  model.initialise(Q, {mode: 'replacement', sponsor: 'ko', seed_current: false,
    roles: {ko: 'cabinet', konf: 'cabinet'}});
  assert.strictEqual(model.preview(Q).blockers.length, 0,
    'A dynamically compatible KO–Konfederacja cabinet should be viable');

  model.initialise(Q, {mode: 'replacement', sponsor: 'p2050', seed_current: false,
    roles: {p2050: 'cabinet', konf: 'cabinet'}});
  assert(model.preview(Q).blockers.some(function(reason) {
    return reason.includes('Poland 2050 will not enter');
  }), 'Poland 2050–Konfederacja lost its permanent cabinet veto');

  Object.assign(Q, {
    p2050_seats: 101, pis_seats: 130, psl_seats: 99, konf_seats: 0,
    p2050_coalition_openness: 100, rival_relation_pis_p2050: 10,
    coalition_viable_pis_p2050: 1
  });
  model.initialise(Q, {mode: 'replacement', sponsor: 'pis', seed_current: false,
    roles: {pis: 'cabinet', p2050: 'cabinet'}});
  assert(model.preview(Q).blockers.some(function(reason) {
    return reason.includes('Poland 2050') && reason.includes('relations are too low');
  }), 'A relationship refusal must name the party and explain the low relations');

  Object.assign(Q, {
    p2050_coalition_openness: 0, rival_relation_pis_p2050: 50,
    pis_economic_position: 50, pis_cultural_position: 50,
    p2050_economic_position: 50, p2050_cultural_position: 50
  });
  model.initialise(Q, {mode: 'replacement', sponsor: 'pis', seed_current: false,
    roles: {pis: 'cabinet', p2050: 'cabinet'}});
  assert.strictEqual(model.preview(Q).decisions.p2050.accepted, 1,
    'An aligned, trusted party should accept when no veto or red line applies');

  Object.assign(Q, {
    year: 2023, left_seats: 56, ko_seats: 130, psl_seats: 40,
    p2050_seats: 30, pis_seats: 204, konf_seats: 0,
    ko_relation: 100, psl_relation: 100, p2050_relation: 100,
    ko_coalition_openness: 100, psl_coalition_openness: 100,
    p2050_coalition_openness: 100,
    coalition_viable_left_ko: 1, coalition_viable_left_psl: 1,
    coalition_viable_ko_psl: 1
  });
  model.initialise(Q, {mode: 'formation', sponsor: 'lewica', seed_current: false,
    roles: {lewica: 'cabinet'}, locked: ['lewica']});
  model.applyTemplate(Q, 'ko_psl_left');
  const cappedProtocol = model.preview(Q);
  assert.strictEqual(cappedProtocol.route_code, 'ko_psl_left');
  assert.strictEqual(cappedProtocol.decisions.p2050.pledged, 5,
    'The existing Poland 2050 protocol must pledge only the votes needed, capped at six');
  assert.strictEqual(cappedProtocol.effective_seats, 231);
}

{
  const run = newEngine();
  normalize(run.engine);
  const Q = run.Q;
  const model = globalThis.polandCoalitionModel;
  Object.assign(Q, {
    sejm_total: 460, sejm_statutory_majority: 231,
    left_seats: 220, ko_seats: 229, pis_seats: 0,
    p2050_seats: 0, psl_seats: 0, konf_seats: 0
  });
  Q.parliamentary_party_records = [
    {id: 'left_party', name: 'Lewica', family: 'left', sejm_mps: 220},
    {id: 'ko_party', name: 'KO', family: 'ko', sejm_mps: 229},
    {id: 'porozumienie', name: 'Porozumienie', family: 'independent', sejm_mps: 11}
  ];
  const porozumienie = Q.rival_group_records.find(function(record) {
    return record.id === 'porozumienie';
  });
  Object.assign(porozumienie, {
    active: 1, independent: 1, relation: 100, coalition_openness: 100,
    economic_position: 52, cultural_position: 52, exclusive_seats: 11
  });
  model.initialise(Q, {mode: 'replacement', sponsor: 'lewica', seed_current: false,
    roles: {lewica: 'cabinet', porozumienie: 'cabinet'}});
  const committed = model.commit(Q);
  assert.strictEqual(committed.committed, 1);
  assert.strictEqual(Q.coalition_name_polish, 'Rząd Społecznej Odbudowy',
    'A minor annex renamed the major-party core');
  const annex = Q.government_agreement_records.find(function(record) {
    return record.party_id === 'porozumienie';
  });
  assert.strictEqual(annex.annex, 'Coalition Annex');
  assert.strictEqual(annex.junior_office, 'Minister without portfolio');
}

console.log('coalition-gate-check: all assertions passed');
