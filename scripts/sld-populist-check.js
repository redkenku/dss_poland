'use strict';

// Focused Stage 4 -> SPS route check. It drives the real entry decision,
// every orientation, both progressive settlements and escalation choices,
// 2023 list ratification, polling apportionment and election certification.

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

function newEngine() {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame(['sld-populist-check']);
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(choice) {
      return choice.id === sceneId;
    });
    assert(index >= 0, 'Missing choice ' + sceneId + ' among ' +
      choices.map(function(choice) { return choice.id; }).join(', '));
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  return { engine: engine, choose: choose, Q: engine.state.qualities };
}

function normalize(ctx) {
  ctx.engine.goToScene('poland_normalize');
}

function assertClose(actual, expected, message) {
  assert(Math.abs(actual - expected) < 1e-8,
    message + ' (expected ' + expected + ', got ' + actual + ')');
}

function assertSceneNamesMiller(sceneId) {
  const scene = game.scenes[sceneId];
  assert(scene, 'Missing SPS scene ' + sceneId);
  const visibleText = JSON.stringify([
    scene.title, scene.subtitle, scene.content,
  ]);
  assert(visibleText.includes('Miller'),
    sceneId + ' does not name Miller in its visible event text');
}

function advanceSequence(ctx, sceneId, redirectsImmediately) {
  const scene = game.scenes[sceneId];
  assert.strictEqual(scene.viewIf(ctx.engine, ctx.Q), false,
    sceneId + ' opened without waiting a month');
  ctx.Q.time = Number(ctx.Q.sld_populist_stage_time) + 1;
  assert.strictEqual(scene.viewIf(ctx.engine, ctx.Q), true,
    sceneId + ' remained guarded after its month elapsed');
  ctx.engine.goToScene('poland_caucus_dynamics.router');
  if (!redirectsImmediately) {
    assert.strictEqual(ctx.engine.state.sceneId, sceneId);
  }
}

function enterRoute(orientationChoice, escalationChoice, progressiveChoice) {
  const ctx = newEngine();
  Object.assign(ctx.Q, {
    old_left_route_state: 'miller_restoration',
    miller_restoration_done: 1,
    sld_populist_entry_done: 0,
    sld_populist_route_active: 0,
    sld_populist_entry_pending: 0,
    resources: 8,
  });
  normalize(ctx);
  assert.strictEqual(ctx.Q.sld_populist_entry_pending, 1,
    'the Stage 4 restoration contract must open the route');

  ctx.engine.goToScene('poland_caucus_dynamics.router');
  assert.strictEqual(ctx.engine.state.sceneId, 'poland_sld_populist.entry');
  const allFactionIds = [
    'barons', 'spring', 'labor', 'progressives', 'razem', 'pps',
    'social_patriot',
  ];
  const factionStrengthBefore = {};
  allFactionIds.forEach(function(faction) {
    factionStrengthBefore[faction] = ctx.Q[faction + '_strength'];
  });
  const progressiveDissentBefore = ctx.Q.progressives_dissent;
  const razemDissentBefore = ctx.Q.razem_dissent;
  const unionTrustBefore = ctx.Q.union_trust;
  const matysiakPartyBefore = ctx.Q.matysiak_party;

  ctx.choose('poland_sld_populist.refound');
  assert.strictEqual(ctx.Q.sld_populist_settlement_stage, 1);
  assert.strictEqual(
    game.scenes['poland_sld_populist.list_filing'].viewIf(ctx.engine, ctx.Q),
    false,
    'list filing opened before Miller consolidated SPS'
  );
  assertClose(ctx.Q.sld_populist_transfer_barons,
    factionStrengthBefore.barons * 0.52,
    'the baron transfer must come from the existing current');
  assertClose(ctx.Q.sld_populist_transfer_labor,
    factionStrengthBefore.labor * 0.18,
    'the labour transfer must come from the existing current');
  assertClose(ctx.Q.sld_populist_transfer_pps,
    factionStrengthBefore.pps * 0.30,
    'the PPS transfer must come from the existing current');
  const rawStrengthAfter = Object.assign({}, factionStrengthBefore);
  rawStrengthAfter.barons -= ctx.Q.sld_populist_transfer_barons;
  rawStrengthAfter.labor -= ctx.Q.sld_populist_transfer_labor;
  rawStrengthAfter.pps -= ctx.Q.sld_populist_transfer_pps;
  rawStrengthAfter.social_patriot +=
    ctx.Q.sld_populist_transfer_barons +
    ctx.Q.sld_populist_transfer_labor + ctx.Q.sld_populist_transfer_pps;
  rawStrengthAfter.spring = 0;
  const rawStrengthTotal = ctx.Q.factions.reduce(function(total, faction) {
    return total + rawStrengthAfter[faction];
  }, 0);
  ctx.Q.factions.forEach(function(faction) {
    assertClose(
      ctx.Q[faction + '_strength'],
      rawStrengthAfter[faction] * 100 / rawStrengthTotal,
      faction + ' must retain its proper share after transfer and normalization'
    );
  });
  assert.strictEqual(ctx.Q.left_party_name, 'Sojusz Polski Społecznej');
  assert.strictEqual(ctx.Q.social_patriot_party_name,
    'Sojusz Polski Społecznej');
  assert.strictEqual(ctx.Q.left_leader, 'Leszek Miller');
  assert.strictEqual(ctx.Q.social_patriot_leader, 'Leszek Miller');
  assert.strictEqual(ctx.Q.left_dominant_current, 'social_patriot');
  assert.strictEqual(ctx.Q.social_patriot_active, 1);
  assert.strictEqual(ctx.Q.social_patriot_party_formed, 0,
    'SPS must reuse the existing tendency, not create a duplicate successor');
  assert.strictEqual(ctx.Q.matysiak_party, matysiakPartyBefore,
    'the Miller route must not absorb Matysiak\'s developmental route');
  assert(ctx.Q.progressives_dissent > progressiveDissentBefore,
    'progressives must react visibly');
  assert(ctx.Q.razem_dissent > razemDissentBefore,
    'Razem must react visibly');
  assert(ctx.Q.union_trust < unionTrustBefore,
    'the labour movement must pay a visible trust cost');
  assert.strictEqual(ctx.Q.spring_in_left, 0,
    'Wiosna must be expelled from SPS');
  assert.strictEqual(ctx.Q.spring_party_formed, 1,
    'Wiosna must retain a successor party after expulsion');
  advanceSequence(ctx, 'poland_sld_populist.expel_razem');
  ctx.choose('poland_sld_populist.resolve_razem');
  assert.strictEqual(ctx.Q.sld_populist_settlement_stage, 2);
  assert.strictEqual(ctx.Q.razem_in_left, 0,
    'Razem must be expelled from SPS');
  assert.strictEqual(ctx.Q.razem_party_formed, 1,
    'Razem must retain an independent party after expulsion');

  advanceSequence(ctx, 'poland_sld_populist.progressives_settlement');
  const progressiveStrengthBefore = ctx.Q.progressives_strength;
  const socialPatriotBeforeProgressives = ctx.Q.social_patriot_strength;
  ctx.choose('poland_sld_populist.' + progressiveChoice);
  assert.strictEqual(ctx.Q.sld_populist_settlement_stage, 3);
  if (progressiveChoice === 'expel_progressives') {
    assert.strictEqual(ctx.Q.progressives_in_left, 0);
    assert.strictEqual(ctx.Q.progressives_party_formed, 1);
  } else {
    assert.strictEqual(ctx.Q.progressives_in_left, 1);
    assert.strictEqual(ctx.Q.progressives_party_formed, 0);
    assert(ctx.Q.progressives_strength < progressiveStrengthBefore);
    assertClose(
      ctx.Q.progressives_strength + ctx.Q.social_patriot_strength,
      progressiveStrengthBefore + socialPatriotBeforeProgressives,
      'marginalisation must transfer, not create, internal strength'
    );
  }

  advanceSequence(ctx, 'poland_sld_populist.consolidate_left', true);
  assert.strictEqual(ctx.Q.sld_populist_settlement_stage, 4);
  assert.strictEqual(ctx.Q.spring_joined_razem, 1);
  assert.strictEqual(ctx.Q.spring_list_committee, 'razem');
  if (progressiveChoice === 'expel_progressives') {
    assert.strictEqual(ctx.Q.progressives_joined_razem, 1);
    assert.strictEqual(ctx.Q.progressives_list_committee, 'razem');
  }
  advanceSequence(ctx, 'poland_sld_populist.orientation');
  ctx.choose('poland_sld_populist.' + orientationChoice);
  advanceSequence(ctx, 'poland_sld_populist.escalation');
  ctx.choose('poland_sld_populist.' + escalationChoice);
  assert.strictEqual(ctx.Q.sld_populist_route_active, 1);
  assert.strictEqual(ctx.Q.left_party_name, 'Sojusz Polski Społecznej');
  assert.strictEqual(ctx.Q.left_leader, 'Leszek Miller');
  assert(ctx.Q.sld_populist_ideology.includes('National welfare-populism'));
  assert.strictEqual(
    game.scenes['poland_sld_populist.list_filing'].viewIf(ctx.engine, ctx.Q),
    true,
    'list filing stayed guarded after consolidation and strategy choices'
  );
  return ctx;
}

function fileList(ctx, filingChoice) {
  Object.assign(ctx.Q, {
    continuous_campaign: 1,
    year: 2023,
    month: 8,
    time: 47,
    resources: Math.max(4, Number(ctx.Q.resources) || 0),
    pis_accept_social: 70,
    pis_solidarist_share: 65,
    konf_accept_order: 65,
    sejm_list_negotiation_done: 0,
  });
  if (ctx.Q.sld_populist_orientation === 'pis') ctx.Q.pis_relation = 70;
  if (ctx.Q.sld_populist_orientation === 'konfederacja') {
    ctx.Q.konf_relation = 70;
    ctx.Q.konf_mentzenite_share = 30;
  }
  ctx.engine.goToScene('poland_events_2023_2024.august_lists');
  assert.strictEqual(ctx.engine.state.sceneId,
    'poland_sld_populist.list_filing');
  ctx.choose('poland_sld_populist.' + filingChoice);
  assert.strictEqual(ctx.Q.sejm_list_negotiation_done, 1);
}

function assertElectionSync(ctx, committee, outcome) {
  assert.strictEqual(ctx.Q.sld_populist_planned_committee, committee);
  assert.strictEqual(ctx.Q.social_patriot_list_committee, committee);
  assert.strictEqual(ctx.Q.sejm_list_outcome, outcome);
  assert.strictEqual(ctx.Q.sejm_list_host, committee);

  ctx.Q.poll_state_month_key = -1;
  ctx.engine.goToScene('poland_polling');
  assert(Number.isFinite(ctx.Q.left_vote_intent));
  assert(Number.isFinite(ctx.Q.left_projected_seats));
  assert.strictEqual(ctx.Q.left_filed_committee_projected_seats,
    ctx.Q[committee + '_committee_projected_seats'],
    committee + ' projected committee seats must use the filed list');
  if (committee !== 'left') {
    assert.strictEqual(ctx.Q[committee + '_committee_projected_seats'],
      ctx.Q[committee + '_projected_seats'] + ctx.Q.left_projected_seats,
      committee + ' projection must preserve the SPS component allocation');
  }
  const democraticLeftProjected = ctx.Q.razem_projected_seats +
    ctx.Q.spring_breakaway_projected_seats +
    (ctx.Q.progressives_party_formed ? ctx.Q.young_left_projected_seats : 0);
  assert.strictEqual(ctx.Q.razem_committee_projected_seats,
    democraticLeftProjected,
    'the expelled democratic left must share Razem\'s projected committee');

  ctx.Q.election_2023_certified = 0;
  ctx.engine.goToScene('poland_government_formation.campaign_entry');
  assert.strictEqual(ctx.Q.election_2023_certified, 1);
  assert.strictEqual(ctx.Q.election_2023_filed_committee_seats,
    ctx.Q[committee + '_committee_seats']);
  if (committee !== 'left') {
    assert.strictEqual(ctx.Q[committee + '_committee_seats'],
      ctx.Q[committee + '_seats'] + ctx.Q.left_seats,
      committee + ' certified seats must preserve SPS seats');
  }
  const democraticLeftSeats = ctx.Q.razem_party_seats +
    ctx.Q.spring_breakaway_seats +
    (ctx.Q.progressives_party_formed ? ctx.Q.young_left_seats : 0);
  assert.strictEqual(ctx.Q.razem_committee_seats, democraticLeftSeats,
    'the expelled democratic left must share Razem\'s certified committee');
  assert(ctx.Q.left_social_patriot_seats >= 0,
    'the internal SPS caucus seat ledger must remain finite');
}

// 1. Radical Konfederacja alignment and optional conspiracy escalation.
{
  const ctx = enterRoute(
    'orient_konf', 'escalation_conspiracy', 'expel_progressives'
  );
  assert.strictEqual(ctx.Q.sld_populist_orientation, 'konfederacja');
  assert.strictEqual(ctx.Q.sld_populist_alliance_partner, 'Konfederacja');
  assert.strictEqual(ctx.Q.sld_populist_alliance_state, 'conditional pact');
  assert.strictEqual(ctx.Q.sld_populist_escalation,
    'anti-vaccine conspiratorial mobilisation');
  assert(ctx.Q.sld_populist_media_salience > 20);
  assert(ctx.Q.sld_populist_international_isolation > 20);
  assert(ctx.Q.pandemic_deaths_pressure > 0);
  fileList(ctx, 'file_konf');
  assert.strictEqual(ctx.Q.sld_populist_alliance_state, 'accepted');
  assertElectionSync(ctx, 'konf', 'konf_5');
}

// 2. Tactical PiS alignment with conspiracy explicitly rejected.
{
  const ctx = enterRoute(
    'orient_pis', 'escalation_reject', 'marginalise_progressives'
  );
  assert.strictEqual(ctx.Q.sld_populist_orientation, 'pis');
  assert.strictEqual(ctx.Q.sld_populist_alliance_partner,
    'Prawo i Sprawiedliwość');
  assert.strictEqual(ctx.Q.sld_populist_escalation,
    'bounded welfare populism');
  assert(ctx.Q.public_trust > 0,
    'rejecting conspiracy must preserve some public credibility');
  fileList(ctx, 'file_pis');
  assert.strictEqual(ctx.Q.sld_populist_alliance_state, 'accepted');
  assertElectionSync(ctx, 'pis', 'pis_5');
}

// 3. Independent Samoobrona-style campaign.
{
  const ctx = enterRoute(
    'orient_independent', 'escalation_reject', 'expel_progressives'
  );
  assert.strictEqual(ctx.Q.sld_populist_orientation, 'independent');
  assert.strictEqual(ctx.Q.sld_populist_alliance_state, 'independent');
  assert(ctx.Q.rural_support >= 20);
  assert(ctx.Q.social_patriot_local_organisation >= 30);
  fileList(ctx, 'file_independent');
  assertElectionSync(ctx, 'left', 'left_5');
}

// 4. A host can refuse: no alliance choice is available below the score gate,
// and filing alone synchronizes orientation and committee state.
{
  const ctx = enterRoute(
    'orient_konf', 'escalation_reject', 'marginalise_progressives'
  );
  Object.assign(ctx.Q, {
    continuous_campaign: 1,
    year: 2023,
    month: 8,
    time: 47,
    konf_relation: 0,
    konf_accept_order: 0,
    konf_mentzenite_share: 100,
    social_patriot_strength: 1,
  });
  ctx.engine.goToScene('poland_events_2023_2024.august_lists');
  const konfChoice = ctx.engine.getCurrentChoices().find(function(choice) {
    return choice.id === 'poland_sld_populist.file_konf';
  });
  assert(konfChoice && !konfChoice.canChoose,
    'Konfederacja must refuse an offer below 40');
  ctx.choose('poland_sld_populist.file_independent');
  assert.strictEqual(ctx.Q.sld_populist_orientation, 'independent');
  assert.strictEqual(ctx.Q.sld_populist_alliance_state, 'independent');
  assert.strictEqual(ctx.Q.social_patriot_list_committee, 'left');
}

// 5. Stage 5 doctrine is neither an entry gate nor a source of route labels.
{
  const ctx = newEngine();
  Object.assign(ctx.Q, {
    old_left_route_state: 'miller_restoration',
    miller_restoration_done: 1,
    sld_partocracy_stage: 3,
    sld_partocracy_doctrine: 'market_apparatus',
    resources: 8,
  });
  normalize(ctx);
  assert.strictEqual(ctx.Q.sld_populist_entry_pending, 1);
  ctx.engine.goToScene('poland_caucus_dynamics.router');
  ctx.choose('poland_sld_populist.refound');
  advanceSequence(ctx, 'poland_sld_populist.expel_razem');
  ctx.choose('poland_sld_populist.resolve_razem');
  advanceSequence(ctx, 'poland_sld_populist.progressives_settlement');
  ctx.choose('poland_sld_populist.marginalise_progressives');
  advanceSequence(ctx, 'poland_sld_populist.consolidate_left', true);
  advanceSequence(ctx, 'poland_sld_populist.orientation');
  ctx.choose('poland_sld_populist.orient_independent');
  advanceSequence(ctx, 'poland_sld_populist.escalation');
  ctx.choose('poland_sld_populist.escalation_reject');
  assert.strictEqual(ctx.Q.left_party_name, 'Sojusz Polski Społecznej');
  assert.strictEqual(ctx.Q.sld_partocracy_available, 0);
}

// 6. Outside the contract, normalization does not mutate either prospective
// host or invent an SPS entry.
{
  const ctx = newEngine();
  normalize(ctx);
  const pisLeader = ctx.Q.pis_leader;
  const konfLeader = ctx.Q.konf_leader;
  const pisIdeology = ctx.Q.pis_ideology;
  const konfIdeology = ctx.Q.konf_ideology;
  const springInLeft = ctx.Q.spring_in_left;
  const razemInLeft = ctx.Q.razem_in_left;
  const progressivesInLeft = ctx.Q.progressives_in_left;
  normalize(ctx);
  assert.strictEqual(ctx.Q.sld_populist_entry_pending, 0);
  assert.strictEqual(ctx.Q.sld_populist_route_active, 0);
  assert.strictEqual(ctx.Q.pis_leader, pisLeader);
  assert.strictEqual(ctx.Q.konf_leader, konfLeader);
  assert.strictEqual(ctx.Q.pis_ideology, pisIdeology);
  assert.strictEqual(ctx.Q.konf_ideology, konfIdeology);
  assert.strictEqual(ctx.Q.spring_in_left, springInLeft);
  assert.strictEqual(ctx.Q.razem_in_left, razemInLeft);
  assert.strictEqual(ctx.Q.progressives_in_left, progressivesInLeft);
}

// 7. SPS cannot survive without Miller's Stage 4 contract, and a valid active
// save always restores Miller as the leader.
{
  let ctx = newEngine();
  Object.assign(ctx.Q, {
    old_left_route_state: 'none',
    miller_restoration_done: 0,
    sld_populist_route_active: 1,
    sld_populist_entry_done: 1,
    left_party_name: 'Nowa Lewica',
    left_leader: 'Robert Biedroń',
  });
  normalize(ctx);
  assert.strictEqual(ctx.Q.sld_populist_route_active, 0,
    'a non-Miller save must not activate SPS');
  assert.notStrictEqual(ctx.Q.left_party_name, 'Sojusz Polski Społecznej');
  assert.notStrictEqual(ctx.Q.left_leader, 'Leszek Miller');

  ctx = newEngine();
  Object.assign(ctx.Q, {
    old_left_route_state: 'miller_restoration',
    miller_restoration_done: 1,
    sld_populist_route_active: 1,
    sld_populist_entry_done: 1,
    left_leader: 'Robert Biedroń',
  });
  normalize(ctx);
  assert.strictEqual(ctx.Q.sld_populist_route_active, 1);
  assert.strictEqual(ctx.Q.left_leader, 'Leszek Miller');
  assert.strictEqual(ctx.Q.social_patriot_leader, 'Leszek Miller');
}

[
  'entry', 'refound', 'stay_conventional', 'expel_razem', 'resolve_razem',
  'progressives_settlement', 'marginalise_progressives',
  'expel_progressives', 'orientation', 'orient_konf', 'orient_pis',
  'orient_independent', 'escalation', 'escalation_reject',
  'escalation_conspiracy', 'list_filing', 'file_konf', 'file_pis',
  'file_independent',
].forEach(function(localId) {
  assertSceneNamesMiller('poland_sld_populist.' + localId);
});

{
  const ctx = newEngine();
  ctx.Q.miller_advisor = 1;
  const scene = game.scenes['poland_advisors.miller'];
  assert(scene && scene.isPinnedCard,
    'Miller occupies an advisor slot without a pinned advisor card');
  assert.strictEqual(scene.viewIf(ctx.engine, ctx.Q), true);
  assert(ctx.engine._compileChoices(game.scenes.poland_hub).some(
    function(choice) { return choice.id === 'poland_advisors.miller'; }
  ), 'Miller advisor card did not appear on the leadership table');
  ctx.engine.goToScene('poland_advisors.miller');
  assert.deepStrictEqual(
    ctx.engine.getCurrentChoices().map(function(choice) { return choice.id; }),
    [
      'poland_advisors.miller_discipline',
      'poland_advisors.miller_counties',
      'poland_advisors.miller_broadcast',
      'poland_hub',
    ]
  );
}

console.log('sld-populist-check: all orientations and invariants OK');
