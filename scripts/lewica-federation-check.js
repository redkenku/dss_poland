'use strict';

// Focused structural-route check: federation sequence, delayed list payoff,
// peaceful unity, orderly successor exit, and every 2026 realignment name.

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
    const index = choices.findIndex(function(choice) { return choice.id === id; });
    assert(index >= 0, 'Missing ' + id + ' in ' + engine.state.sceneId +
      ': ' + choices.map(function(choice) { return choice.id; }).join(', '));
    assert(choices[index].canChoose, 'Unavailable ' + id);
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  return { engine: engine, choose: choose, Q: engine.state.qualities };
}

function openMerger(ctx) {
  ctx.Q.resources = 12;
  ctx.engine.goToScene('poland_merger_events.merger');
  assert.strictEqual(ctx.engine.state.sceneId, 'poland_merger_events.merger_full');
}

function buildFederation(seed, leadership, finance, registration, candidate,
  membership) {
  const ctx = start(seed);
  openMerger(ctx);
  ctx.choose('poland_merger_events.merger_convention');
  assert.strictEqual(ctx.Q.sejm_list_threshold, 8);
  assert.strictEqual(ctx.Q.sejm_list_structure, 'Coalition committee');
  ctx.choose('poland_merger_events.federation_joint_convention');
  ctx.choose('poland_merger_events.' + leadership);
  ctx.choose('poland_merger_events.' + finance);

  assert.strictEqual(ctx.Q.left_merger_structure, 'federation');
  assert.strictEqual(ctx.Q.left_common_party_exists, 0);
  assert.strictEqual(ctx.Q.federation_sequence_stage, 3);
  assert.strictEqual(ctx.Q.razem_org_status, 'federal_partner');

  ctx.engine.goToScene('poland_merger_events.rename');
  ctx.choose('poland_merger_events.' + registration);
  ctx.choose('poland_merger_events.federation_candidate_selection');
  ctx.choose('poland_merger_events.' + candidate);
  ctx.choose('poland_merger_events.' + membership);
  assert.strictEqual(ctx.Q.federation_sequence_stage, 6);
  return ctx;
}

function resolveLeftCoalitionList(ctx) {
  ctx.engine.goToScene('poland_events_2023_2024.august_lists');
  const choices = (ctx.engine.getCurrentChoices() || []).map(function(choice) {
    return choice.id;
  });
  for (const forbidden of [
    'poland_events_2023_2024.list_target_left_host',
    'poland_events_2023_2024.list_target_razem_host',
    'poland_events_2023_2024.list_target_ko_host',
    'poland_events_2023_2024.list_target_third_host',
    'poland_events_2023_2024.list_target_pis_host',
    'poland_events_2023_2024.list_target_alone',
  ]) {
    assert(!choices.includes(forbidden), forbidden + ' remained available');
  }
  ctx.choose('poland_events_2023_2024.list_target_left_coalition');
  ctx.choose('poland_events_2023_2024.list_terms');
  ctx.choose('poland_events_2023_2024.list_terms_equal');
  ctx.choose('poland_events_2023_2024.list_resolution');
  assert.strictEqual(ctx.Q.sejm_list_threshold, 8);
  assert.strictEqual(ctx.Q.sejm_list_structure, 'Coalition committee');
}

// Historical peaceful unity and the loose alliance remain direct outcomes.
{
  const ctx = start('historical-peaceful-new-left');
  openMerger(ctx);
  ctx.choose('poland_merger_events.merger_dual');
  assert.strictEqual(ctx.Q.historical_peaceful_unification, 1);
  assert.strictEqual(ctx.Q.left_merger_structure, 'dual_party');
  assert.strictEqual(ctx.Q.barons_merged, 1);
  assert.strictEqual(ctx.Q.spring_merged, 1);
  assert.strictEqual(ctx.Q.razem_org_status, 'federal_partner');
  assert.strictEqual(ctx.Q.left_pluralism_protected, 1);
}
{
  const ctx = start('loose-left-alliance');
  openMerger(ctx);
  ctx.choose('poland_merger_events.merger_no_deal');
  assert.strictEqual(ctx.Q.left_merger_structure, 'separate_parties');
  assert.strictEqual(ctx.Q.left_common_party_exists, 0);
  assert.strictEqual(ctx.Q.nowa_lewica_merger_agreed, 0);
}

// A coherent federation turns early rules into 2021 coalition reach and a
// positive 2023 list modifier.
const strong = buildFederation(
  'strong-federation',
  'federation_portfolio_council',
  'federation_common_treasury',
  'rename_federal_members',
  'federation_joint_primary',
  'federation_membership_passport'
);
assert.strictEqual(strong.Q.federation_leadership_model,
  'Portfolio federal council');
assert.strictEqual(strong.Q.federation_finance_model,
  'Audited common treasury');
assert.strictEqual(strong.Q.federation_candidate_rule,
  'Joint federal primary');
assert.strictEqual(strong.Q.federation_membership_model,
  'Reciprocal organising passport');
strong.engine.goToScene('poland_merger_events.left_federation_crisis');
strong.choose('poland_merger_events.federation_enforce');
assert.strictEqual(strong.Q.federation_successful, 1);
assert.strictEqual(strong.Q.federation_coalition_reach, 1);
assert(strong.Q.negotiation_capital >= 3);
resolveLeftCoalitionList(strong);
assert(strong.Q.sejm_list_federal_bonus > 0,
  'A coherent federation should improve a coalition-committee bargain');

// The tempting short route is cheaper but carries vetoes, branding costs and
// a negative later list modifier: federation is not a universal optimum.
const weak = buildFederation(
  'weak-federation',
  'federation_weighted_council',
  'federation_host_assets',
  'rename_federal_compact',
  'federation_delegate_candidate',
  'federation_parallel_branches'
);
weak.engine.goToScene('poland_merger_events.left_federation_crisis');
weak.choose('poland_merger_events.federation_enforce');
assert.strictEqual(weak.Q.federation_successful, 0);
assert(weak.Q.federation_veto_pressure >= 6);
assert(weak.Q.federation_brand_dilution >= 7);
resolveLeftCoalitionList(weak);
assert(weak.Q.sejm_list_federal_bonus < 0,
  'A captured, parallel federation should hurt later list bargaining');
assert(strong.Q.sejm_list_partner_score > weak.Q.sejm_list_partner_score,
  'The early structural choices did not alter the later list result');

// A failed outside bargain still leaves the legal federation on its own 8%
// coalition committee; it cannot silently fall back to a 5% party list.
{
  const ctx = buildFederation(
    'federal-list-lock',
    'federation_rotating_presidium',
    'federation_matching_grants',
    'rename_federal_compact',
    'federation_delegate_candidate',
    'federation_parallel_branches'
  );
  Object.assign(ctx.Q, {
    sejm_list_outcome: 'left_5',
    sejm_list_structure: 'Host-party list',
    sejm_list_threshold: 5,
  });
  ctx.engine.goToScene('poland_normalize');
  assert.strictEqual(ctx.Q.sejm_list_outcome, 'left_coalition_8');
  assert.strictEqual(ctx.Q.sejm_list_threshold, 8);
  ctx.engine.goToScene('status');
  assert.strictEqual(ctx.Q.status_sejm_list_visible, 1);
  assert.strictEqual(ctx.Q.status_sejm_list_threshold, 8);
  assert(ctx.Q.status_sejm_list_result.includes('8% coalition committee'));
  ctx.Q.razem_cooperation = -100;
  ctx.Q.internal_dissent = 100;
  ctx.Q.faction_vetoes = 10;
  ctx.engine.goToScene('poland_events_2023_2024.august_lists');
  ctx.choose('poland_events_2023_2024.list_target_left_coalition');
  ctx.choose('poland_events_2023_2024.list_terms');
  ctx.choose('poland_events_2023_2024.list_terms_command');
  ctx.choose('poland_events_2023_2024.list_resolution');
  assert.strictEqual(ctx.Q.sejm_list_outcome, 'left_coalition_8');
  assert.strictEqual(ctx.Q.sejm_list_threshold, 8);
  assert(ctx.Q.sejm_list_result.includes('federation files'));
}

// A functioning federation may later unify by member consent while retaining
// constitutionally meaningful internal currents.
{
  const ctx = buildFederation(
    'federal-peaceful-unity',
    'federation_rotating_presidium',
    'federation_common_treasury',
    'rename_federal_members',
    'federation_rotate_candidate',
    'federation_local_specialists'
  );
  ctx.Q.party_unity = 70;
  ctx.engine.goToScene('poland_merger_events.left_federation_crisis');
  ctx.choose('poland_merger_events.federation_unify');
  assert.strictEqual(ctx.Q.left_merger_structure, 'unified_party');
  assert.strictEqual(ctx.Q.federation_peaceful_unification, 1);
  assert.strictEqual(ctx.Q.left_pluralism_protected, 1);
  assert.strictEqual(ctx.Q.razem_org_status, 'merged_current');
  assert(ctx.Q.left_constitution.includes('protected'));
}

// A partner exit delegates seat and legal-identity work to the canonical
// caucus successor resolver.
{
  const ctx = buildFederation(
    'federal-orderly-exit',
    'federation_portfolio_council',
    'federation_matching_grants',
    'rename_federal_compact',
    'federation_joint_primary',
    'federation_local_specialists'
  );
  Object.assign(ctx.Q, {
    left_seats: 26,
    razem_seats: 8,
    razem_dissent: 95,
    barons_dissent: 5,
    spring_dissent: 5,
    pps_dissent: 5,
    razem_breakaway_protected: 0,
  });
  const totalSeats = ctx.Q.left_seats + ctx.Q.razem_party_seats;
  ctx.engine.goToScene('poland_merger_events.left_federation_crisis');
  ctx.choose('poland_merger_events.federation_exit');
  assert.strictEqual(ctx.Q.caucus_exit_target, 'razem');
  ctx.choose('poland_caucus_dynamics.resolve_exit');
  assert.strictEqual(ctx.Q.razem_party_formed, 1);
  assert.strictEqual(ctx.Q.razem_in_left, 0);
  assert.strictEqual(ctx.Q.razem_party_name, 'Razem');
  assert.strictEqual(ctx.Q.left_seats + ctx.Q.razem_party_seats, totalSeats);
}

function realignmentName(name, targets, options) {
  const ctx = start('realignment-' + name);
  const Q = ctx.Q;
  Object.assign(Q, {
    left_merger_structure: 'federation',
    federation_successful: 1,
    left_realign_targets: targets,
    left_realign_p2050_accepted: targets.includes('Poland 2050') ? 1 : 0,
    left_realign_greens_accepted: targets.includes('Zieloni') ? 1 : 0,
    left_realign_rozwoj_accepted: targets.includes('Rozwój+') ? 1 : 0,
    p2050_seats: targets.includes('Poland 2050') ? 6 : 0,
    rozwoj_seats: targets.includes('Rozwój+') ? 5 : 0,
    barons_active: options.lowEstablishment ? 0 : 1,
    barons_strength: options.lowEstablishment ? 15 : 35,
  });
  const greens = (Q.rival_group_records || []).find(function(record) {
    return record.id === 'greens';
  });
  if (greens) {
    greens.active = targets.includes('Zieloni') ? 1 : 0;
    greens.exclusive_seats = targets.includes('Zieloni') ? 1 : 0;
  }
  ctx.engine.goToScene('poland_events_2026.left_realign_result');
  assert.strictEqual(Q.left_realign_name, name);
  assert.strictEqual(Q.left_merger_structure, 'unified_party');
  assert.strictEqual(Q.left_constitution, 'protected_currents');
  assert.strictEqual(Q.left_pluralism_protected, 1);
  assert.strictEqual(Q.federation_peaceful_unification, 1);
  assert(Q.left_structural_endpoint.includes(name));
}

realignmentName('Wspólna Polska', 'Poland 2050', { lowEstablishment: false });
realignmentName('Nowa Solidarność', 'Rozwój+', { lowEstablishment: true });
realignmentName('Solidarność Społeczna',
  'Poland 2050, Zieloni and Rozwój+', { lowEstablishment: false });
realignmentName('Lewica Rozwoju', 'Rozwój+', { lowEstablishment: false });

// The route extends the canonical structure field; it never invents the
// forbidden parallel quality.
const structuralSources = [
  'source/scenes/poland_merger_events.scene.dry',
  'source/scenes/poland_events_2023_2024.scene.dry',
  'source/scenes/poland_events_2026.scene.dry',
  'source/scenes/poland_normalize.scene.dry',
].map(function(file) {
  return fs.readFileSync(path.join(projectRoot, file), 'utf8');
}).join('\n');
assert(!/Q\.party_structure\b/.test(structuralSources),
  'A parallel party_structure quality was introduced');

console.log('Lewica federation structural-route checks passed.');
