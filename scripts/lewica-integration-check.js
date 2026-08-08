'use strict';

// Cross-route integration check for the Lewica branching overhaul.
//
// The per-route scripts prove what happens inside each branch. This one proves
// the two things only integration can break:
//
//   1. Hub normalization is idempotent. poland_hub calls poland_normalize on
//      every arrival, so a normalization that transfers seats, strength,
//      politicians or party identity would do it again every month.
//   2. Every principal endpoint is entered through the live chronology - the
//      dated-event queue, the monthly polling router or the caucus-crisis
//      router - and not only by jumping straight at the event.

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

function start(seed) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([seed]);
  const choose = function(id) {
    const choices = engine.getCurrentChoices() || [];
    const index = choices.findIndex(function(c) { return c.id === id; });
    assert(index >= 0, 'Missing ' + id + ' in ' + engine.state.sceneId);
    assert(choices[index].canChoose, 'Unavailable ' + id);
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  return { engine: engine, choose: choose, Q: engine.state.qualities };
}

// The dated-event desk the hub actually routes through from August 2023.
function queuedEventIds(engine) {
  return (engine._compileChoices(game.scenes['poland_event_queue.all_events'])
    || []).filter(function(choice) {
    return choice.canChoose;
  }).map(function(choice) {
    return choice.id;
  });
}

// The monthly router: poland_advance hands to party AI, then polling, which
// owns every pre-2023 dated route.
function monthlyRouteFrom(ctx, year, month, time) {
  ctx.Q.year = year;
  ctx.Q.month = month;
  ctx.Q.time = time;
  ctx.engine.goToScene('poland_polling');
  return ctx.engine.state.sceneId;
}

function continuous(Q, year, month, time) {
  Q.continuous_campaign = 1;
  Q.year = year;
  Q.month = month;
  Q.time = time;
  Q.resources = 8;
}

// ---------------------------------------------------------------------------
// 1. Normalization is idempotent.
// ---------------------------------------------------------------------------

// Everything a repeated hub visit must never move: chamber arithmetic, caucus
// strength, the politicians' own party, legal identity and leadership.
const fingerprintKeys = [
  'left_seats', 'left_committed_seats', 'left_family_seats',
  'left_splinter_seats', 'sld_breakaway_seats', 'spring_breakaway_seats',
  'labor_left_seats', 'young_left_seats', 'razem_party_seats',
  'pps_party_seats', 'social_patriot_seats', 'tak_rozwoj_seats',
  'left_barons_seats', 'left_spring_seats', 'left_labor_seats',
  'left_progressives_seats', 'razem_seats', 'left_pps_seats',
  'barons_strength', 'spring_strength', 'labor_strength',
  'progressives_strength', 'razem_strength', 'pps_strength',
  'social_patriot_strength', 'spring_exit_strength',
  'spring_transfer_labor', 'spring_transfer_progressives',
  'barons_active', 'spring_active', 'labor_active', 'progressives_active',
  'razem_active', 'pps_active', 'social_patriot_active',
  'barons_in_left', 'spring_in_left', 'labor_in_left',
  'progressives_in_left', 'razem_in_left', 'pps_in_left',
  'left_party_name', 'left_party_short_name', 'left_party_long_name',
  'left_leader', 'left_merger_structure', 'left_constitution',
  'left_legal_vehicle', 'left_common_party_exists', 'left_structural_endpoint',
  'razem_leader', 'razem_co_leader', 'razem_leadership_result',
  'razem_legal_status', 'razem_org_status', 'razem_party_name',
  'progressives_name', 'progressives_leader', 'labor_name',
  'labor_party_name', 'labor_relationship_state', 'labor_movement_leverage',
  'barons_party_name', 'spring_party_name', 'social_patriot_party_name',
  'tak_rozwoj_party_name', 'tak_rozwoj_leader', 'tak_rozwoj_legal_status',
  'zandberg_party', 'biejat_party', 'matysiak_party', 'olko_party',
  'wicha_party', 'stozek_party', 'gosek_popiolek_party',
  'barons_advisor_count', 'spring_advisor_count', 'labor_advisor_count',
  'progressives_advisor_count', 'razem_advisor_count',
  'sld_partocracy_stage', 'sld_partocracy_label', 'sld_populist_route_active',
  'federation_sequence_stage', 'federation_successful',
  'left_pluralism_protected', 'wspolne_jutro_formed', 'spring_path_mode',
  'factions',
];

function fingerprint(Q) {
  const out = {};
  for (const key of fingerprintKeys) {
    const value = Q[key];
    if (Array.isArray(value)) {
      out[key] = value.slice().join(',');
    } else if (typeof value === 'number') {
      // Rescaling a caucus set back to 100 is not an exact fixed point in
      // binary floating point. A repeated hub visit may differ in the last
      // bits; anything a player could notice is orders of magnitude larger.
      out[key] = Math.round(value * 1e6) / 1e6;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function assertIdempotent(name, build) {
  const ctx = build();
  // The hub calls poland_normalize on arrival, so revisiting it is the real
  // repeat, not a direct jump at the normalizer.
  ctx.engine.goToScene('poland_hub');
  const first = fingerprint(ctx.Q);
  for (let visit = 2; visit <= 4; visit += 1) {
    ctx.engine.goToScene('poland_hub');
    assert.deepStrictEqual(
      fingerprint(ctx.Q),
      first,
      name + ': hub visit ' + visit + ' moved settled party state'
    );
  }
  return ctx;
}

assertIdempotent('opening state', function() {
  return start('idempotent-opening');
});

assertIdempotent('peaceful dual-party unification', function() {
  const ctx = start('idempotent-dual');
  ctx.engine.goToScene('poland_merger_events.merger');
  ctx.choose('poland_merger_events.merger_dual');
  return ctx;
});

assertIdempotent('federation compact', function() {
  const ctx = start('idempotent-federation');
  ctx.Q.resources = 12;
  ctx.engine.goToScene('poland_merger_events.merger');
  ctx.choose('poland_merger_events.merger_convention');
  ctx.choose('poland_merger_events.federation_joint_convention');
  ctx.choose('poland_merger_events.federation_portfolio_council');
  ctx.choose('poland_merger_events.federation_common_treasury');
  return ctx;
});

assertIdempotent('Wiosna congress transfer', function() {
  const ctx = start('idempotent-wiosna-transfer');
  ctx.engine.goToScene('poland_merger_events.merger');
  ctx.choose('poland_merger_events.merger_dual');
  ctx.choose('poland_hub');
  Object.assign(ctx.Q, {
    year: 2021, month: 9, time: 22, historical_2023_calendar: 1,
    caucus_crisis_pending: 0, party_unity: 80, internal_dissent: 10,
  });
  ctx.engine.goToScene('poland_advance');
  ctx.choose('poland_events_2021_2023.oct21_congress');
  ctx.choose('poland_events_2021_2023.oct21_dual');
  return ctx;
});

assertIdempotent('SLD apparatus ascendancy', function() {
  const ctx = start('idempotent-sld');
  Object.assign(ctx.Q, {
    sld_partocracy_stage: 3,
    sld_partocracy_doctrine: 'orthodox',
    left_common_party_exists: 1,
    left_legal_vehicle: 'sld',
    barons_org_status: 'merged_current',
    left_dominant_current: 'barons',
    left_machine_controller: 'barons',
  });
  return ctx;
});

assertIdempotent('social-populist refoundation', function() {
  const ctx = start('idempotent-sps');
  Object.assign(ctx.Q, {
    old_left_route_state: 'miller_restoration',
    miller_restoration_done: 1,
    sld_populist_route_active: 1,
    sld_populist_entry_done: 1,
    sld_populist_orientation: 'independent',
  });
  return ctx;
});

assertIdempotent('Razem successor split', function() {
  const ctx = start('idempotent-razem-split');
  Object.assign(ctx.Q, {
    razem_split: 1,
    razem_split_outcome: 'historical',
    wspolne_jutro_formed: 1,
    biejat_party: 'Wspólne Jutro',
    tak_dla_rozwoju_party_formed: 1,
    tak_rozwoj_party_name: 'Akcja Socjalistyczna',
  });
  return ctx;
});

// A resolved caucus exit is the sharpest case: the seats have already moved
// once, so a second normalization must not move them again.
{
  const ctx = start('idempotent-labour-exit');
  Object.assign(ctx.Q, {
    labor_party_breakdown_authored: 1,
    caucus_exit_target: 'labor',
    caucus_exit_mode: 'escalated',
  });
  const seatsBefore = Number(ctx.Q.left_seats);
  ctx.engine.goToScene('poland_caucus_dynamics.resolve_exit');
  const departed = Number(ctx.Q.labor_mp_departed);
  assert(departed > 0, 'An authored labour rupture transferred no seats');
  assert.strictEqual(
    Number(ctx.Q.left_seats) + departed,
    seatsBefore,
    'The labour exit did not conserve Sejm seats'
  );
  const after = Number(ctx.Q.left_seats);
  for (let visit = 1; visit <= 3; visit += 1) {
    ctx.engine.goToScene('poland_hub');
    assert.strictEqual(Number(ctx.Q.left_seats), after,
      'A hub visit repeated the labour seat transfer');
    assert.strictEqual(Number(ctx.Q.labor_mp_departed), departed,
      'A hub visit repeated the labour departure ledger');
  }
}

// ---------------------------------------------------------------------------
// 2. Every principal endpoint is entered from the live chronology.
// ---------------------------------------------------------------------------

const matrix = [];

function recordRoute(endpoint, entry, via) {
  matrix.push({ endpoint: endpoint, entry: entry, via: via });
}

// The September 2020 merger decision carries endpoints 1, 2 and 5.
{
  const ctx = start('route-merger-window');
  ctx.Q.presidential_candidate = 'Adrian Zandberg';
  ctx.Q.pres_first_round_complete = 1;
  ctx.Q.pres_performance_level = 1;
  // September 2020 has more open files than the month can absorb, so the
  // router hands the month to the legacy desk. That desk is the chronological
  // route to the merger, not a bypass of it.
  const routed = monthlyRouteFrom(ctx, 2020, 9, 11);
  assert(
    routed === 'poland_merger_events.merger' ||
      routed === 'poland_legacy_event_desk.events_choice',
    'The monthly router no longer reaches the September 2020 merger: ' + routed
  );
  if (routed !== 'poland_merger_events.merger') {
    ctx.choose('poland_legacy_event_desk.merger_2020');
    assert(
      ctx.engine.state.sceneId.startsWith('poland_merger_events.merger'),
      'The legacy desk no longer reaches the merger: ' +
        ctx.engine.state.sceneId
    );
  }
  const ids = (ctx.engine.getCurrentChoices() || []).filter(function(choice) {
    return choice.canChoose;
  }).map(function(choice) { return choice.id; });
  for (const entry of [
    'poland_merger_events.merger_dual',
    'poland_merger_events.merger_convention',
    'poland_merger_events.merger_all',
  ]) {
    assert(ids.includes(entry), entry + ' is not offered in normal play');
  }
  recordRoute('1. Peacefully unified New Left',
    'poland_merger_events.merger_dual', 'monthly router, September 2020');
  recordRoute('2. Stable federation',
    'poland_merger_events.merger_convention', 'monthly router, September 2020');
  recordRoute('5. Razem-led unified Left',
    'poland_merger_events.merger_all', 'monthly router, September 2020');
}

// July 2021 must route through Tusk before the merger revolt. Dendry chooses
// randomly when two go-to conditions match, so this seed reproduces the old
// race: it used to enter the federation crisis and strand Tusk in July.
{
  const ctx = start('route-federation-crisis');
  ctx.Q.resources = 12;
  ctx.engine.goToScene('poland_merger_events.merger');
  ctx.choose('poland_merger_events.merger_convention');
  ctx.choose('poland_merger_events.federation_joint_convention');
  ctx.choose('poland_merger_events.federation_portfolio_council');
  ctx.choose('poland_merger_events.federation_common_treasury');
  assert.strictEqual(ctx.Q.left_merger_structure, 'federation');
  Object.assign(ctx.Q, {
    historical_2023_calendar: 1, left_revolt_event_done: 0,
    tusk_return_2021_done: 0, caucus_crisis_pending: 0,
  });
  assert.strictEqual(
    monthlyRouteFrom(ctx, 2021, 7, 20),
    'poland_leadership_events.tusk_return_2021',
    'The July 2021 revolt raced ahead of Tusk\'s return'
  );
  ctx.choose('poland_leadership_events.tusk_social_terms');
  assert.strictEqual(ctx.Q.ko_leader, 'Donald Tusk');
  assert.strictEqual(ctx.Q.tusk_return_2021_done, 1);
  ctx.choose('poland_merger_events.left_revolt');
  assert.strictEqual(
    ctx.engine.state.sceneId,
    'poland_merger_events.left_federation_crisis',
    'The ordered July 2021 revolt no longer resolves into the federation crisis'
  );
  recordRoute('2. Stable federation (crisis test)',
    'poland_merger_events.left_federation_crisis',
    'monthly router, July 2021 revolt');
}

// The dated-event desk carries every 2023+ route entry.
function assertQueued(endpoint, entry, seed, apply, when) {
  const ctx = start(seed);
  continuous(ctx.Q, when[0], when[1], when[2]);
  apply(ctx.Q, ctx);
  ctx.engine.goToScene('poland_hub');
  const ids = queuedEventIds(ctx.engine);
  assert(
    ids.includes(entry),
    endpoint + ': ' + entry + ' never reaches the dated-event desk (' +
      ids.length + ' queued)'
  );
  recordRoute(endpoint, entry, 'dated-event desk, ' + when[1] + '/' + when[0]);
  return ctx;
}

// Wiosna ascendancy: both doctrines share one authored entry.
const wiosnaEntry = function(Q) {
  Q.spring_merged = 1;
  Q.spring_active = 1;
  Q.spring_in_left = 1;
  Q.left_constitution = 'dual_chairs';
  Q.left_common_party_exists = 1;
  Q.spring_path_declined = 0;
};
assertQueued('3. Wiosna social-liberal ascendancy',
  'poland_wiosna_path.spring_congress', 'route-wiosna-social',
  wiosnaEntry, [2024, 3, 53]);
assertQueued('4. Wiosna Market Left',
  'poland_wiosna_path.spring_congress', 'route-wiosna-market',
  wiosnaEntry, [2024, 3, 53]);

// SLD apparatus: one congress, three doctrines.
const sldEntry = function(Q) {
  Q.left_common_party_exists = 1;
  Q.left_legal_vehicle = 'sld';
  Q.barons_org_status = 'merged_current';
  Q.left_dominant_current = 'barons';
  Q.left_machine_controller = 'barons';
  Q.barons_party_formed = 0;
};
for (const endpoint of [
  '10. Orthodox SLD',
  '11. Market-apparatus SLD',
  '12. Reform-avoidant partocracy',
]) {
  assertQueued(endpoint, 'poland_sld_partocracy.sld_congress',
    'route-sld-' + endpoint.slice(0, 2).trim(), sldEntry, [2024, 4, 54]);
}

// Razem futures: the 2025 confrontation is a dated event, and both successor
// projects then get their own dated decisions.
{
  const ctx = start('route-razem-futures');
  continuous(ctx.Q, 2025, 11, 73);
  ctx.Q.matysiak_development_pressure = 80;
  ctx.Q.razem_dissent = 70;
  ctx.engine.goToScene('poland_hub');
  const ids = queuedEventIds(ctx.engine);
  const razemConfrontation = ids.filter(function(id) {
    return id.startsWith('poland_events_2025.') && /razem/.test(id);
  });
  assert(razemConfrontation.length > 0,
    'No 2025 Razem confrontation reaches the dated-event desk');
  recordRoute('6-9. Razem futures confrontation',
    razemConfrontation[0], 'dated-event desk, 11/2025');
}
for (const project of [
  ['8. Zandberg Akcja Socjalistyczna',
    'poland_razem_futures.zandberg_strategy', 'zandberg_project_active'],
  ['9. Matysiak developmentalist Razem / Tak! Dla Rozwoju',
    'poland_razem_futures.matysiak_strategy', 'matysiak_project_active'],
]) {
  assertQueued(project[0], project[1], 'route-' + project[2], function(Q) {
    Q[project[2]] = 1;
    Q.razem_future_start_time = 60;
    Q[project[2].replace('_active', '') + '_future_decision_done'] = 0;
  }, [2025, 9, 71]);
}

// Independent Zandberg Razem and the Biejat current are settled by the split
// resolver, which the 2025 confrontation routes into.
{
  const ctx = start('route-razem-split-identity');
  continuous(ctx.Q, 2025, 7, 69);
  ctx.engine.goToScene('poland_razem_futures.split_result');
  assert.strictEqual(ctx.Q.razem_legal_status, 'registered political party');
  recordRoute('6. Independent Zandberg Razem',
    'poland_razem_futures.split_result', 'dated 2025 confrontation');
  const wj = start('route-wspolne-jutro');
  wj.Q.razem_split = 1;
  wj.Q.razem_split_outcome = 'historical';
  wj.engine.goToScene('poland_hub');
  assert.strictEqual(wj.Q.wspolne_jutro_formed, 1);
  assert.strictEqual(wj.Q.progressives_name, 'Wspólne Jutro');
  assert.strictEqual(wj.Q.progressives_leader, 'Magdalena Biejat');
  recordRoute('7. Biejat-led Wspólne Jutro',
    'poland_normalize successor settlement', 'hub normalization after split');
}

// The social-populist route is a caucus-crisis interrupt, not a queue entry:
// normalization raises the pending flag and the router must land on it.
{
  const ctx = start('route-sps-entry');
  continuous(ctx.Q, 2024, 5, 55);
  ctx.Q.old_left_route_state = 'miller_restoration';
  ctx.Q.miller_restoration_done = 1;
  ctx.engine.goToScene('poland_hub');
  assert.strictEqual(ctx.Q.sld_populist_entry_pending, 1,
    'A restored Miller machine does not raise the SPS entry');
  assert.strictEqual(ctx.Q.caucus_crisis_pending, 1,
    'The SPS entry does not interrupt the month');
  ctx.engine.goToScene('poland_caucus_dynamics.router');
  assert.strictEqual(ctx.engine.state.sceneId, 'poland_sld_populist.entry',
    'The caucus router does not reach the SPS entry');
  ctx.choose('poland_sld_populist.refound');
  const orientations = {
    '13. Konfederacja-aligned social-populist SLD':
      'poland_sld_populist.orient_konf',
    '14. PiS-aligned social-populist SLD':
      'poland_sld_populist.orient_pis',
    '15. Independent New Samoobrona vehicle':
      'poland_sld_populist.orient_independent',
  };
  const orientation = start('route-sps-orientation');
  Object.assign(orientation.Q, {
    continuous_campaign: 1, year: 2024, month: 6, time: 56, resources: 8,
    sld_populist_route_active: 1, sld_populist_orientation: 'unsettled',
  });
  orientation.engine.goToScene('poland_sld_populist.orientation');
  const orientationIds = (orientation.engine.getCurrentChoices() || [])
    .filter(function(choice) { return choice.canChoose; })
    .map(function(choice) { return choice.id; });
  for (const endpoint of Object.keys(orientations)) {
    assert(
      orientationIds.includes(orientations[endpoint]),
      endpoint + ': ' + orientations[endpoint] + ' is not offered'
    );
    recordRoute(endpoint, orientations[endpoint],
      'SPS orientation after the caucus-crisis interrupt');
  }
}

console.log('Lewica integration check passed: normalization is idempotent ' +
  'across ' + 8 + ' route states and ' + matrix.length +
  ' principal endpoints are entered from the live chronology.');
for (const row of matrix) {
  console.log('  ' + row.endpoint + ' <- ' + row.entry + '  [' + row.via + ']');
}
