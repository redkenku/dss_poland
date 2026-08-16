'use strict';

// Drives the 2027 pre-election list chain: the August scramble
// (poland_events_2027_08.list_scramble_2027, with its Gowin beat) and the
// September registration (poland_events_2027_09.list_registration_2027).
//
// The point of the chain is that every stranded organisation has more than one
// door, that each door is gated on something the eight-year game produced, and
// that a committee assignment actually reaches the polling and count model.

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

function newRun(seed) {
  const ui = new dendry.UserInterface();
  ui.newPage = function() {};
  const engine = new dendry.DendryEngine(ui, game);
  engine.beginGame([seed]);
  const choose = function(id) {
    const choices = engine.getCurrentChoices() || [];
    const index = choices.findIndex(function(choice) {
      return choice.id === id && choice.canChoose;
    });
    assert(index >= 0, 'Missing available choice ' + id + ' in ' +
      engine.state.sceneId + ': ' + choices.map(function(choice) {
        return choice.id + (choice.canChoose ? '' : ' (unavailable)');
      }).join(', '));
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  return {engine: engine, Q: engine.state.qualities, choose: choose};
}

function record(Q, id) {
  return (Q.rival_group_records || []).find(function(entry) {
    return entry && entry.id === id;
  });
}

function committee(Q, id, fallback) {
  const entry = record(Q, id);
  return String(entry && entry.list_committee || fallback);
}

function live(run, sceneId) {
  const scene = game.scenes[sceneId];
  assert(scene, 'Missing scene ' + sceneId);
  return run.engine._runPredicate(scene.viewIf, true);
}

// A 2027 opposition campaign with every small organisation alive, filing under
// its own name and short of the threshold. Individual cases override from here.
function fixture(seed, overrides) {
  const run = newRun(seed);
  Object.assign(run.Q, {
    continuous_campaign: 1,
    year: 2027,
    month: 8,
    snap_election_cycle: 0,
    election_2027_terminal: 0,
    prime_minister: 'Donald Tusk',
    government_party: 'ko',
    ministry_psl_in_cabinet: 0,
    prawica_stage: 1,
    prawica_formed: 0,
    prawica_member_source_ids: [],
    third_way_alternative_stage: 1,
    third_way_cohesion: 58,
    pis_leader: 'Mateusz Morawiecki',
    pis_poll: 26,
    ko_poll: 28,
    psl_poll: 3.4,
    p2050_poll: 3.2,
    konf_poll: 11,
    p0_poll: 2.6,
    kukiz_poll: 1.4,
    porozumienie_poll: 1.6,
    rozwoj_poll: 3.0,
    tak_rozwoj_poll: 1.2,
    suwerenna_poll: 2.4,
  }, overrides || {});
  run.engine.goToScene('poland_normalize');
  return run;
}

// Puts an organisation into the state the chain treats as a free agent.
function activate(Q, recordId, patch) {
  const entry = record(Q, recordId);
  assert(entry, 'Missing rival group record ' + recordId);
  Object.assign(entry, {active: 1, contesting: 1}, patch || {});
  return entry;
}

function scramble(run, posture) {
  run.engine.goToScene('poland_events_2027_08.list_scramble_2027');
  run.choose('poland_events_2027_08.scramble_' + posture + '_2027');
}

function register(run) {
  run.Q.month = 9;
  run.engine.goToScene('poland_events_2027_09.list_registration_2027');
}

// --- The August scramble reads live state and opens a posture ---------------
{
  const run = fixture('scramble-basics');
  activate(run.Q, 'p0_party', {list_committee: 'p0'});
  run.Q.p0_formed = 1;
  assert(live(run, 'poland_events_2027_08.list_scramble_2027'),
    'the August scramble must be available in an ordinary 2027 campaign');
  scramble(run, 'silence');
  assert.strictEqual(run.Q.list_scramble_stage, 1);
  assert.strictEqual(run.Q.list_scramble_posture, 'silence');
  assert(run.Q.list_scramble_stranded > 0,
    'at least one organisation is filing alone');
  assert(/Partia Zero/.test(run.Q.list_scramble_report),
    'the report names the stranded organisations: ' + run.Q.list_scramble_report);
  assert(!live(run, 'poland_events_2027_08.list_scramble_2027'),
    'the scramble does not fire twice');
}

// A weak, divided common-centre cartel comes apart before registration; a
// cohesive one does not.
{
  const broken = fixture('cartel-breaks', {third_way_cohesion: 20});
  for (const id of ['psl_party', 'p2050_party', 'ko_party']) {
    activate(broken.Q, id, {list_committee: 'common_centre_2027'});
  }
  broken.Q.ko_poll = 14;
  scramble(broken, 'silence');
  assert.strictEqual(broken.Q.centre_cartel_broken, 1);
  assert.strictEqual(committee(broken.Q, 'psl_party', 'psl'), 'psl');
  assert.strictEqual(committee(broken.Q, 'p2050_party', 'p2050'), 'p2050');

  const held = fixture('cartel-holds', {
    third_way_cohesion: 80,
    p2050_coalition_dissent: 0,
    psl_coalition_dissent: 0,
  });
  for (const id of ['psl_party', 'p2050_party', 'ko_party']) {
    activate(held.Q, id, {list_committee: 'common_centre_2027'});
  }
  scramble(held, 'silence');
  assert.strictEqual(held.Q.centre_cartel_broken, 0);
  assert.strictEqual(committee(held.Q, 'psl_party', 'psl'),
    'common_centre_2027');
}

// --- Poland 2050 and PSL: three mutually exclusive destinations -------------
{
  const revived = fixture('third-way-revived');
  activate(revived.Q, 'psl_party', {list_committee: 'psl'});
  activate(revived.Q, 'p2050_party', {list_committee: 'p2050'});
  scramble(revived, 'silence');
  register(revived);
  assert.strictEqual(revived.Q.third_way_2027_revived, 1);
  assert.strictEqual(committee(revived.Q, 'psl_party', 'psl'),
    'third_way_2027');
  assert.strictEqual(committee(revived.Q, 'p2050_party', 'p2050'),
    'third_way_2027');

  // No trust left between them, and KO is large: Poland 2050 is absorbed.
  const absorbed = fixture('p2050-into-ko', {
    third_way_cohesion: 10,
    p2050_poll: 2.2,
    psl_poll: 6.0,
    ko_poll: 30,
    p2050_seats: 12,
  });
  activate(absorbed.Q, 'psl_party', {list_committee: 'psl'});
  activate(absorbed.Q, 'p2050_party', {list_committee: 'p2050'});
  activate(absorbed.Q, 'ko_party', {list_committee: 'ko'});
  scramble(absorbed, 'silence');
  const koSeatsBefore = Number(absorbed.Q.ko_seats) || 0;
  register(absorbed);
  assert.strictEqual(absorbed.Q.third_way_2027_revived, 0);
  assert.strictEqual(committee(absorbed.Q, 'p2050_party', 'p2050'), 'ko');
  assert.strictEqual(absorbed.Q.p2050_seats, 9,
    'absorption moves only the deputies declared in the record');
  assert.strictEqual(absorbed.Q.ko_seats, koSeatsBefore + 3);

  // A scorned PSL under a conservative successor has one door on the right.
  const konfPsl = fixture('psl-into-konf', {
    third_way_cohesion: 10,
    psl_poll: 3.0,
    p2050_poll: 1.0,
    psl_leader: 'Piotr Zgorzelski',
    psl_leader_route: 'Zgorzelski conservative opposition',
    psl_2023_exclusion_crisis_done: 1,
    psl_konf_partner_line: 'open',
    rival_relation_psl_konf: 60,
  });
  activate(konfPsl.Q, 'psl_party', {list_committee: 'psl'});
  activate(konfPsl.Q, 'konf_committee', {list_committee: 'konf'});
  scramble(konfPsl, 'silence');
  register(konfPsl);
  assert.strictEqual(committee(konfPsl.Q, 'psl_party', 'psl'), 'konf');

  // The same PSL with the Konfederacja channel closed stays where it is.
  const closed = fixture('psl-konf-closed', {
    third_way_cohesion: 10,
    psl_poll: 3.0,
    p2050_poll: 1.0,
    psl_leader: 'Piotr Zgorzelski',
    psl_leader_route: 'Zgorzelski conservative opposition',
    psl_2023_exclusion_crisis_done: 1,
    psl_konf_partner_line: 'closed',
    rival_relation_psl_konf: 60,
  });
  activate(closed.Q, 'psl_party', {list_committee: 'psl'});
  activate(closed.Q, 'konf_committee', {list_committee: 'konf'});
  scramble(closed, 'silence');
  register(closed);
  assert.strictEqual(committee(closed.Q, 'psl_party', 'psl'), 'psl');
}

// --- Porozumienie: Lewica's August answer opens or closes the centre --------
{
  const base = {
    porozumienie_active: 1,
    porozumienie_exit_done: 1,
    porozumienie_acceptance: 70,
    porozumienie_relation: 50,
    psl_relation: 40,
    ko_relation: 60,
  };
  const open = fixture('gowin-open', base);
  activate(open.Q, 'porozumienie', {list_committee: 'porozumienie', relation: 50});
  open.Q.porozumienie_relation = 50;
  activate(open.Q, 'psl_party', {list_committee: 'psl'});
  activate(open.Q, 'p2050_party', {list_committee: 'p2050'});
  scramble(open, 'silence');
  assert(live(open, 'poland_events_2027_08.gowin_returns_2027'),
    'Gowin asks for a door when Porozumienie is alive and below the threshold');
  open.engine.goToScene('poland_events_2027_08.gowin_returns_2027');
  open.choose('poland_events_2027_08.gowin_bless_2027');
  register(open);
  assert.strictEqual(open.Q.third_way_2027_revived, 1);
  assert.strictEqual(open.Q.porozumienie_list_committee, 'third_way_2027');
  assert.strictEqual(committee(open.Q, 'porozumienie', 'porozumienie'),
    'third_way_2027');

  const vetoed = fixture('gowin-vetoed', base);
  activate(vetoed.Q, 'porozumienie', {list_committee: 'porozumienie', relation: 50});
  vetoed.Q.porozumienie_relation = 50;
  activate(vetoed.Q, 'psl_party', {list_committee: 'psl'});
  activate(vetoed.Q, 'p2050_party', {list_committee: 'p2050'});
  activate(vetoed.Q, 'pis_party', {list_committee: 'pis'});
  scramble(vetoed, 'silence');
  vetoed.engine.goToScene('poland_events_2027_08.gowin_returns_2027');
  vetoed.choose('poland_events_2027_08.gowin_veto_2027');
  register(vetoed);
  assert.notStrictEqual(vetoed.Q.porozumienie_list_committee, 'third_way_2027');
  assert.strictEqual(vetoed.Q.porozumienie_list_committee, 'pis',
    'a blocked centre route sends the fragment to the right instead');
}

// --- Kukiz'15: the interesting outcome is the one where nothing happens -----
{
  const stays = fixture('kukiz-stays', {kukiz_active: 1, kukiz_left_kp: 0});
  activate(stays.Q, 'kukiz15', {list_committee: 'kukiz'});
  activate(stays.Q, 'psl_party', {list_committee: 'psl'});
  activate(stays.Q, 'p2050_party', {list_committee: 'p2050'});
  scramble(stays, 'silence');
  register(stays);
  assert.strictEqual(stays.Q.kukiz_list_committee, 'third_way_2027',
    'a Kukiz who never left Koalicja Polska is carried into the rebuilt list');

  const toPis = fixture('kukiz-to-pis', {
    kukiz_active: 1,
    kukiz_left_kp: 1,
    kukiz_alignment: 'pis_current',
  });
  activate(toPis.Q, 'kukiz15', {list_committee: 'kukiz'});
  activate(toPis.Q, 'pis_party', {list_committee: 'pis'});
  scramble(toPis, 'silence');
  register(toPis);
  assert.strictEqual(toPis.Q.kukiz_list_committee, 'pis');

  const toKonf = fixture('kukiz-to-konf', {
    kukiz_active: 1,
    kukiz_left_kp: 1,
    kukiz_alignment: 'refused',
    kukiz_programme_credit: 0,
    far_right_agenda: 70,
    psl_relation: 0,
  });
  activate(toKonf.Q, 'kukiz15', {list_committee: 'kukiz', relation: 0});
  toKonf.Q.kukiz_relation = 0;
  activate(toKonf.Q, 'konf_committee', {list_committee: 'konf'});
  scramble(toKonf, 'silence');
  register(toKonf);
  assert.strictEqual(toKonf.Q.kukiz_list_committee, 'konf');
}

// --- Morawiecki, and Matysiak following him ---------------------------------
{
  const toCentre = fixture('rozwoj-to-third-way', {
    rozwoj_party_formed: 1,
    pis_morawiecki_reconciled: 0,
  });
  activate(toCentre.Q, 'rozwoj_plus', {list_committee: 'rozwoj'});
  activate(toCentre.Q, 'psl_party', {list_committee: 'psl'});
  activate(toCentre.Q, 'p2050_party', {list_committee: 'p2050'});
  scramble(toCentre, 'silence');
  register(toCentre);
  assert.strictEqual(committee(toCentre.Q, 'rozwoj_plus', 'rozwoj'),
    'third_way_2027');

  const toP2050 = fixture('rozwoj-to-p2050', {
    rozwoj_party_formed: 1,
    third_way_cohesion: 10,
    p2050_poll: 4.0,
    psl_poll: 1.0,
    p2050_state_capacity_share: 60,
    ko_poll: 12,
  });
  activate(toP2050.Q, 'rozwoj_plus', {list_committee: 'rozwoj'});
  activate(toP2050.Q, 'p2050_party', {list_committee: 'p2050'});
  scramble(toP2050, 'silence');
  register(toP2050);
  assert.strictEqual(committee(toP2050.Q, 'rozwoj_plus', 'rozwoj'), 'p2050');

  // Matysiak follows the railway, but only after our government cancelled it.
  const matysiak = fixture('matysiak-to-rozwoj', {
    rozwoj_party_formed: 1,
    third_way_cohesion: 10,
    p2050_poll: 4.0,
    psl_poll: 1.0,
    p2050_state_capacity_share: 60,
    ko_poll: 12,
    tak_dla_rozwoju_legal_party_formed: 1,
    tak_rozwoj_development_credibility: 60,
    cpk_cancelled: 1,
  });
  activate(matysiak.Q, 'rozwoj_plus', {list_committee: 'rozwoj'});
  activate(matysiak.Q, 'p2050_party', {list_committee: 'p2050'});
  activate(matysiak.Q, 'tak_rozwoj_party', {list_committee: 'tak_rozwoj'});
  scramble(matysiak, 'silence');
  register(matysiak);
  assert.strictEqual(matysiak.Q.tak_rozwoj_list_committee, 'p2050',
    'Matysiak files wherever the developmental committee ended up');

  // With the railway still being built she has no reason to cross the aisle,
  // and the Left's shelter offer takes precedence anyway.
  const sheltered = fixture('matysiak-shelter', {
    rozwoj_party_formed: 1,
    tak_dla_rozwoju_legal_party_formed: 1,
    tak_rozwoj_development_credibility: 60,
    cpk_cancelled: 0,
  });
  activate(sheltered.Q, 'rozwoj_plus', {list_committee: 'rozwoj'});
  activate(sheltered.Q, 'tak_rozwoj_party', {list_committee: 'tak_rozwoj'});
  scramble(sheltered, 'shelter');
  register(sheltered);
  assert.strictEqual(sheltered.Q.tak_rozwoj_list_committee, 'left');
}

// --- Partia Zero, Suwerenna Polska, and winding up --------------------------
{
  const toKonf = fixture('p0-to-konf', {p0_formed: 1, far_right_agenda: 30});
  activate(toKonf.Q, 'p0_party', {list_committee: 'p0'});
  activate(toKonf.Q, 'konf_committee', {list_committee: 'konf'});
  scramble(toKonf, 'silence');
  register(toKonf);
  assert.strictEqual(committee(toKonf.Q, 'p0_party', 'p0'), 'konf');

  // A clerical-nationalist federation repels a libertarian media party, and a
  // post-Kaczyński PiS is the only remaining door.
  const toZp = fixture('p0-to-zp', {
    p0_formed: 1,
    p0_poll: 2.0,
    far_right_agenda: 80,
    pis_leader: 'Mateusz Morawiecki',
    pis_poll: 26,
  });
  activate(toZp.Q, 'p0_party', {list_committee: 'p0'});
  activate(toZp.Q, 'konf_committee', {list_committee: 'konf'});
  activate(toZp.Q, 'pis_party', {list_committee: 'pis'});
  scramble(toZp, 'silence');
  register(toZp);
  assert.strictEqual(committee(toZp.Q, 'p0_party', 'p0'), 'pis');

  // Kaczyński's PiS is not an option for Stanowski at any polling number.
  const alone = fixture('p0-alone', {
    p0_formed: 1,
    p0_poll: 2.0,
    far_right_agenda: 80,
    pis_leader: 'Jarosław Kaczyński',
  });
  activate(alone.Q, 'p0_party', {list_committee: 'p0'});
  activate(alone.Q, 'konf_committee', {list_committee: 'konf'});
  activate(alone.Q, 'pis_party', {list_committee: 'pis'});
  scramble(alone, 'silence');
  register(alone);
  assert.strictEqual(committee(alone.Q, 'p0_party', 'p0'), 'p0');

  const wound = fixture('p0-wound-up', {
    p0_formed: 1,
    p0_poll: 0.4,
    far_right_agenda: 80,
    pis_leader: 'Jarosław Kaczyński',
  });
  activate(wound.Q, 'p0_party', {list_committee: 'p0'});
  scramble(wound, 'silence');
  register(wound);
  assert.strictEqual(wound.Q.p0_formed, 0);
  assert.strictEqual(record(wound.Q, 'p0_party').active, 0);
  assert(wound.Q.list_registration_dissolved > 0);

  const ziobro = fixture('suwerenna-to-konf', {
    suwerenna_walkout: 1,
    suwerenna_own_list: 1,
    suwerenna_merged: 0,
    suwerenna_poll: 3.0,
    far_right_agenda: 60,
    pis_sovereigntist_leader: 'Zbigniew Ziobro',
  });
  activate(ziobro.Q, 'solidarna', {
    list_committee: 'suwerenna',
    leader: 'Zbigniew Ziobro',
  });
  activate(ziobro.Q, 'konf_committee', {list_committee: 'konf'});
  scramble(ziobro, 'silence');
  register(ziobro);
  assert.strictEqual(committee(ziobro.Q, 'solidarna', 'suwerenna'), 'konf');
  assert.strictEqual(ziobro.Q.suwerenna_own_list, 1,
    'the vote has to leave the PiS list with the party');
}

// --- The committee assignment reaches the polling model ---------------------
// Two identical campaigns, differing only in whether Partia Zero registered
// its own committee, are polled once each. A hosted party has no committee of
// its own, and its support is counted on the host's line instead of vanishing.
{
  const polled = function(seed, hosted) {
    const run = fixture(seed, {p0_formed: 1, far_right_agenda: 30});
    activate(run.Q, 'p0_party', {list_committee: 'p0'});
    activate(run.Q, 'konf_committee', {list_committee: 'konf'});
    scramble(run, 'shelter');
    if (hosted) {
      register(run);
      assert.strictEqual(committee(run.Q, 'p0_party', 'p0'), 'konf');
    }
    run.Q.poll_state_month_key = -1;
    run.engine.goToScene('poland_polling');
    return {
      p0: Number(run.Q.p0_poll) || 0,
      konf: Number(run.Q.konf_poll) || 0,
    };
  };
  const alone = polled('p0-files-alone', false);
  const hosted = polled('p0-files-with-konf', true);
  assert(alone.p0 > 0, 'Partia Zero polls separately before registration');
  assert.strictEqual(hosted.p0, 0,
    'a hosted party no longer has a committee of its own');
  assert(hosted.konf > alone.konf,
    'its vote arrives on the host committee: ' + alone.konf + ' -> ' +
      hosted.konf);
}

console.log('list-registration-check: August scramble and cartel rupture OK');
console.log('list-registration-check: PSL, Poland 2050 and the rebuilt Third Way OK');
console.log('list-registration-check: Porozumienie routes gated on the Gowin answer OK');
console.log('list-registration-check: Kukiz, Morawiecki and Matysiak OK');
console.log('list-registration-check: Partia Zero, Suwerenna Polska and wind-ups OK');
console.log('list-registration-check: committee assignments reach the polling model OK');
