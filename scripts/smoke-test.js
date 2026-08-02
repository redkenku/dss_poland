'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Node 26 exposes an experimental browser localStorage getter. Dendry only
// needs it in the browser, so keep headless tests quiet and in-memory.
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: undefined,
});

const dendry = require('dendrynexus/lib/engine');

const projectRoot = path.resolve(__dirname, '..');
const compiledPath = path.join(projectRoot, 'out', 'game.json');

const deckIds = [
  'poland_party_deck',
];

const deckTags = {
  poland_party_deck: 'poland_party_card',
  poland_government_deck: 'poland_government_card',
  poland_negotiation_deck: 'poland_negotiation_card',
  poland_major_reform_deck: 'poland_major_reform_card',
  poland_foreign_deck: 'poland_foreign_card',
};

const majorReformCardIds = [
  'poland_abortion_reform',
  'poland_labor_reform',
  'poland_marriage_reform',
];

const ministryPortfolioCases = [
  {
    portfolio: 'labor',
    cardId: 'poland_labor_inspection',
    cost: 5,
  },
  {
    portfolio: 'equality',
    cardId: 'poland_equality_bill',
    cost: 3,
  },
  {
    portfolio: 'housing',
    cardId: 'poland_housing_fund',
    cost: 6,
  },
  {
    portfolio: 'health',
    cardId: 'poland_health_compact',
    cost: 7,
  },
  {
    portfolio: 'digital',
    cardId: 'poland_digital_state',
    cost: 4,
  },
  {
    portfolio: 'science',
    cardId: 'poland_science_compact',
    cost: 4,
  },
  {
    portfolio: 'interior',
    cardId: 'poland_internal_security',
    cost: 5,
  },
  {
    portfolio: 'finance',
    cardId: 'poland_fiscal_policy',
    cost: 10,
  },
  {
    portfolio: 'economy',
    cardId: 'poland_economic_programme',
    cost: 10,
  },
  {
    portfolio: 'justice',
    cardId: 'poland_justice_repair',
    cost: 10,
  },
  {
    portfolio: 'foreign',
    cardId: 'poland_foreign_ministry_line',
    cost: 10,
  },
  {
    portfolio: 'agriculture',
    cardId: 'poland_agricultural_bargain',
    cost: 10,
  },
  {
    portfolio: 'defence',
    cardId: 'poland_defence_policy',
    cost: 15,
  },
];

function assertNamedCabinet(qualities, context) {
  ministryPortfolioCases.forEach(function(testCase) {
    const minister = qualities[testCase.portfolio + '_minister'];
    const party = qualities[testCase.portfolio + '_minister_party'];
    assert(
      typeof minister === 'string' && minister.length > 0 &&
        !/(nominee|unassigned|development ministry)/i.test(minister),
      context + ' left ' + testCase.portfolio + ' without a named minister'
    );
    assert(
      typeof party === 'string' && party.length > 0 &&
        party.toLowerCase() !== 'unassigned',
      context + ' left ' + testCase.portfolio + ' without an owner'
    );
  });
}

const genericGovernmentCardIds = [
  'poland_cabinet_reshuffle',
  'poland_coalition_council',
  'poland_social_welfare_review',
];

const expectedGovernmentCardIds = ministryPortfolioCases
  .map(function(testCase) {
    return testCase.cardId;
  })
  .concat(genericGovernmentCardIds)
  .sort();

const cabinetTimerIds = expectedGovernmentCardIds.map(function(cardId) {
  return cardId + '_timer';
});

const requiredNumericQualities = [
  'year',
  'month',
  'resources',
  'party_income',
  'member_dues',
  'seat_subvention',
  'seat_subvention_seats',
  'last_dues_payout',
  'last_subvention_payout',
  'last_annual_payout',
  'last_resource_restore_year',
  'last_midyear_resource_restore_year',
  'budget',
  'fiscal_stress',
  'party_unity',
  'left_poll',
  'public_trust',
  'media_capacity',
  'local_network',
  'labor_credibility',
  'progressive_credibility',
  'feminist_trust',
  'ko_relation',
  'psl_relation',
  'president_relation',
  'judicial_legitimacy',
  'constitutional_restraint',
  'health_capacity',
  'household_security',
  'barons_strength',
  'barons_dissent',
  'spring_strength',
  'spring_dissent',
  'labor_strength',
  'labor_dissent',
  'progressives_strength',
  'progressives_dissent',
  'razem_strength',
  'razem_dissent',
  'pps_strength',
  'pps_dissent',
  'barons_active',
  'spring_active',
  'labor_active',
  'progressives_active',
  'razem_active',
  'pps_active',
  'left_family_seats',
  'left_splinter_seats',
  'left_splinter_support_votes',
  'left_committed_seats',
  'left_cooperative_independent_seats',
  'left_p2050_current_seats',
  'left_green_current_seats',
  'left_rozwoj_current_seats',
  'p2050_split_occurred',
  'centrum_independent_vote_base',
  'centrum_supports_government',
  'left_splinter_support_projected_seats',
  'left_committed_projected_seats',
  'sld_breakaway_vote_intent',
  'spring_breakaway_vote_intent',
  'labor_left_vote_intent',
  'young_left_vote_intent',
  'razem_vote_intent',
  'pps_vote_intent',
  'tak_rozwoj_vote_intent',
  'centrum_vote_intent',
  'rozwoj_vote_intent',
  'korona_vote_intent',
  'ko_splinter_vote_intent',
  'sld_breakaway_projected_seats',
  'spring_breakaway_projected_seats',
  'labor_left_projected_seats',
  'young_left_projected_seats',
  'razem_projected_seats',
  'pps_projected_seats',
  'tak_rozwoj_projected_seats',
  'centrum_projected_seats',
  'rozwoj_projected_seats',
  'korona_projected_seats',
  'ko_splinter_projected_seats',
  'ko_splinter_poll',
  'ko_splinter_seats',
  'poland_rival_organisations_timer',
  'poland_picking_enemies_timer',
  'poland_inter_party_relations_timer',
  'rival_individual_recruits',
  'porozumienie_seats',
  'porozumienie_active',
  'porozumienie_exit_done',
  'suwerenna_merge_support',
  'suwerenna_merge_dissent',
  'suwerenna_renamed',
  'suwerenna_merged',
  'suwerenna_individual_joiners',
  'ko_merger_stage',
  'ko_merger_integration',
  'ko_merger_federalism',
  'ko_merger_dissent',
  'ko_merger_recruitment',
  'ko_splinter_active',
  'ko_individual_defectors',
  'rozwoj_association_active',
  'rozwoj_association_members',
  'rozwoj_loyalty_declarations',
  'rozwoj_disciplinary_cases',
  'rozwoj_cases_resolved',
  'rozwoj_definitive_departures',
  'rozwoj_pending_seats',
  'rozwoj_departure_pressure',
  'rozwoj_party_readiness',
  'rozwoj_first_departure_batch',
  'rozwoj_last_departure_batch',
  'rozwoj_club_formed',
  'rozwoj_party_formed',
  'rozwoj_chain_stage',
  'tak_dla_rozwoju_party_formed',
  'tak_rozwoj_seats',
  'matysiak_development_pressure',
  'matysiak_development_score',
  'matysiak_resolution_done',
  'matysiak_has_sejm_mandate',
  'razem_right_score',
  'left_realign_formed',
  'p2050_joined_left',
  'greens_joined_left',
  'rozwoj_joined_left',
  'internal_dissent',
  'faction_vetoes',
  'party_action_effectiveness',
  'message_discipline',
  'razem_in_government',
  'razem_join_vote_score',
  'razem_pivotal_to_coalition',
  'razem_budget_support_pact',
  'razem_red_line_broken',
  'caucus_split_pending',
  'faction_stage_highwater',
  'faction_leaks',
  'faction_public_criticisms',
  'contradictory_media_appearances',
  'failed_whips',
  'adviser_resignations',
  'individual_defections',
  'parliamentary_circles',
  'organised_left_splits',
  'campaign_capacity_loss',
  'dues_withheld',
  'lost_dues_total',
  'left_lists_contesting',
  'left_lists_above_threshold',
  'left_threshold_wasted_vote',
  'left_family_vote_intent',
  'left_family_projected_seats',
  'barons_escalation_stage',
  'spring_escalation_stage',
  'labor_escalation_stage',
  'progressives_escalation_stage',
  'razem_escalation_stage',
  'pps_escalation_stage',
  'razem_office_hold',
  'razem_local_organisation',
  'razem_personal_following',
  'razem_ideological_intensity',
  'razem_list_dependence',
  'razem_grievance_memory',
  'razem_individual_defections',
  'razem_mp_departed',
  'razem_mp_retained',
  'poland_event_phase',
  'poland_event_queue_count',
  'poland_event_queue_tier_count',
  'poland_event_months_cleared',
  'poland_discard_slot_count',
  'poland_hand_count',
  'poland_hand_full',
  'poland_discard_month_key',
  'poland_discard_current_month_key',
  'poland_discard_allowed',
  'poland_discard_used_this_month',
  'poland_discard_available',
  'poll_state_month_key',
  'leadership_actions_taken',
  'neglected_months',
  'advisor_action_timer',
  'leadership_reshuffle_timer',
  'emergency_fundraising_timer',
  ...cabinetTimerIds,
  'abortion_reform_stage',
  'abortion_reform_defined',
  'abortion_reform_goal_stage',
  'abortion_reform_proposal_stage',
  'abortion_reform_settled',
  'abortion_reform_progress',
  'abortion_reform_power',
  'abortion_reform_threshold',
  'abortion_reform_next_stage',
  'abortion_ko_commitment',
  'abortion_pis_commitment',
  'abortion_third_way_commitment',
  'abortion_palace_commitment',
  'abortion_referendum_mandate',
  'abortion_referendum_score',
  'marriage_reform_stage',
  'marriage_reform_defined',
  'marriage_reform_goal_stage',
  'marriage_reform_proposal_stage',
  'marriage_reform_settled',
  'marriage_reform_progress',
  'marriage_reform_power',
  'marriage_reform_threshold',
  'marriage_reform_next_stage',
  'marriage_ko_commitment',
  'marriage_pis_commitment',
  'marriage_third_way_commitment',
  'marriage_palace_commitment',
  'marriage_referendum_mandate',
  'marriage_referendum_score',
  'labor_reform_stage',
  'labor_reform_defined',
  'labor_reform_goal_stage',
  'labor_reform_proposal_stage',
  'labor_reform_settled',
  'labor_reform_progress',
  'labor_reform_power',
  'labor_reform_threshold',
  'labor_reform_next_stage',
  'labor_ko_commitment',
  'labor_pis_commitment',
  'labor_third_way_commitment',
  'labor_palace_commitment',
  'reform_pressure_pending',
  'reform_pressure_actor_live',
  'reform_pressure_authority_live',
  'reform_pressure_intensity',
  'reform_pressure_illegality',
  'reform_pressure_target_stage',
  'reform_pressure_previous_stage',
  'reform_pressure_cooldown',
  'reform_pressure_due_time',
  'reform_pressure_demands',
  'reform_pressure_objections',
  'reform_pressure_palace_override',
  'reform_pressure_referendum_used',
  'reform_pressure_bargain_available',
  'reform_pressure_override_votes',
  'reform_pressure_override_available',
  'reform_pressure_abandoned',
  'major_reforms_complete',
  'coalition_judicial_pressure_concessions',
  'coalition_media_takeover_concessions',
  'marketisation_concessions',
  'pegasus_legal_framework',
  'anticlerical_edge',
  'pzpr_history_concessions',
  'poland_fundraising_timer',
  'poland_campaigning_timer',
  'poland_rally_timer',
  'poland_crisis_compact_timer',
  'poland_oversight_bargain_timer',
  'poland_palace_mediation_timer',
  'poland_pis_social_channel_timer',
  'poland_pis_right_faultline_timer',
  'poland_tvp_appearance_timer',
  'poland_european_campaign_timer',
  'poland_eastern_flank_timer',
  'poland_white_house_pressure_timer',
  'poland_european_right_timer',
  'eu_campaign_progress',
  'eu_campaign_complete',
  'eu_influence',
  'eu_institutional_trust',
  'eu_left_network',
  'eu_progressive_headwind',
  'eu_right_shift_done',
  'western_economic_access',
  'western_economic_drag',
  'western_economic_shock_done',
  'hungary_relation',
  'hungary_democratic_network',
  'hungary_fidesz_channel',
  'hungary_fidesz_in_power',
  'hungary_election_2022_done',
  'hungary_election_2026_done',
  'hungary_election_2026_score',
  'hungary_tisza_seats',
  'hungary_fidesz_seats',
  'foreign_pressure',
  'foreign_cards_resolved',
  'foreign_ministry_override_risk',
  'foreign_portfolio_resistance',
  'foreign_policy_responsibility',
  'us_alliance_reliability',
  'us_rule_of_law_pressure',
  'us_ambassador_channel',
  'us_defence_channel',
  'us_congress_channel',
  'left_atlanticist_dissent',
  'us_election_2020_done',
  'us_election_2024_done',
  'us_2020_popular_margin',
  'us_2020_battleground_roll',
  'us_2020_democratic_tipping_margin',
  'us_2020_democratic_electors',
  'us_2020_republican_electors',
  'us_2020_popular_electoral_split',
  'us_2024_popular_margin',
  'us_2024_battleground_roll',
  'us_2024_democratic_tipping_margin',
  'us_2024_democratic_electors',
  'us_2024_republican_electors',
  'us_2024_popular_electoral_split',
  'national_crisis_pressure',
  'oath_crisis_pressure',
  'government_negotiation_hostility',
  'pis_negotiation_hostility_relief',
  'negotiation_leverage',
  'negotiation_capital',
  'negotiation_attempts',
  'negotiation_successes',
  'pis_cohabitation_stress',
  'pis_cohabitation_rally',
  'pis_cohabitation_last_shift',
  'n_advisors',
  'barons_advisor_count',
  'spring_advisor_count',
  'labor_advisor_count',
  'progressives_advisor_count',
  'razem_advisor_count',
  'pis_poll',
  'ko_poll',
  'psl_poll',
  'konf_poll',
  'p2050_poll',
  'other_poll',
  'left_vote_intent',
  'pis_vote_intent',
  'ko_vote_intent',
  'psl_vote_intent',
  'konf_vote_intent',
  'p2050_vote_intent',
  'other_vote_intent',
  'party_system_left_pull',
  'party_system_konf_pull',
  'party_system_pendulum',
  'covid_anti_system_pressure',
  'democratic_rightward_pressure',
  'left_right_score',
  'pis_right_score',
  'ko_right_score',
  'psl_right_score',
  'konf_right_score',
  'p2050_right_score',
  'pis_solidarist_share',
  'pis_market_hardliner_share',
  'ko_social_liberal_share',
  'ko_classical_liberal_share',
  'psl_agrarian_pragmatist_share',
  'psl_conservative_share',
  'psl_coalition_manager_share',
  'konf_braunist_share',
  'konf_mentzenite_share',
  'konf_nationalist_share',
  'p2050_state_capacity_share',
  'p2050_christian_dem_share',
  'p2050_personalist_share',
  'pis_accept_social',
  'pis_accept_rights',
  'pis_accept_order',
  'pis_accept_market',
  'pis_coalition_openness',
  'ko_accept_social',
  'ko_accept_rights',
  'ko_accept_order',
  'ko_accept_market',
  'ko_coalition_openness',
  'psl_accept_social',
  'psl_accept_rights',
  'psl_accept_order',
  'psl_accept_market',
  'psl_coalition_openness',
  'konf_accept_social',
  'konf_accept_rights',
  'konf_accept_order',
  'konf_accept_market',
  'konf_coalition_openness',
  'p2050_accept_social',
  'p2050_accept_rights',
  'p2050_accept_order',
  'p2050_accept_market',
  'p2050_coalition_openness',
  'left_projected_seats',
  'pis_projected_seats',
  'ko_projected_seats',
  'psl_projected_seats',
  'konf_projected_seats',
  'p2050_projected_seats',
  'other_projected_seats',
  'pis_seats',
  'ko_seats',
  'psl_seats',
  'konf_seats',
  'p2050_seats',
  'other_seats',
  'economic_growth',
  'inflation',
  'unemployment',
  'public_debt',
  'budget_balance',
  'macro_baseline_year',
  'united_right_cohesion',
  'civic_patriotism',
  'far_right_street_capacity',
  'braun_martyrdom',
  'braun_legal_preparation',
  'braun_hospital_2025_done',
  'braun_indictment_2025_done',
  'braun_procedure_score',
  'last_independence_march_year',
  'independence_march_2019_done',
  'independence_march_2020_done',
  'independence_join_years',
  'independence_2020_riot_done',
  'konf_last_march_wing_year',
  'konf_border_wing_applied',
  'konf_ukraine_wing_applied',
  'kpo_milestones',
  'kpo_delivery',
  'ukraine_solidarity',
  'refugee_service_capacity',
  'war_fatigue',
  'war_escalation_risk',
  'energy_security',
  'climate_state_capacity',
  'opposition_list_pressure',
  'workers_support',
  'public_sector_support',
  'young_support',
  'women_support',
  'urban_progressive_support',
  'rural_support',
  'pensioner_support',
  'turnout_readiness',
  'senate_total',
  'senate_pis_seats',
  'senate_konf_seats',
  'senate_ko_seats',
  'senate_p2050_seats',
  'senate_psl_seats',
  'senate_left_seats',
  'senate_independent_seats',
  'senate_democratic_seats',
  'senate_right_seats',
  'senate_government_seats',
  'senate_opposition_seats',
  'senate_coordinated_seats',
  'senate_working_votes',
  'senate_cohesion',
  'senate_left_leverage',
  'senate_amendment_credit',
  'senate_pact_2023_done',
  'senate_pact_coordinated',
  'senate_pact_strength',
  'senate_election_2023_certified',
  'senate_snap_election_cycle',
  'senate_election_closest_margin',
  'primary_active',
  'primary_turnout',
  'primary_random_roll',
  'primary_total_votes',
  'primary_biedron_tally',
  'primary_zandberg_tally',
  'primary_adb_tally',
  'primary_zukowska_tally',
  'primary_kotula_tally',
  'primary_biejat_tally',
  'primary_franchise_code',
  'primary_access_code',
  'primary_campaign_code',
  'primary_mandate',
  'primary_winner_share',
  'primary_runner_share',
  'primary_biedron_weight',
  'primary_zandberg_weight',
  'primary_adb_weight',
  'primary_zukowska_weight',
  'primary_kotula_weight',
  'primary_biejat_weight',
  'primary_total_weight',
  'primary_biedron_eligible',
  'primary_zandberg_eligible',
  'primary_adb_eligible',
  'primary_zukowska_eligible',
  'primary_kotula_eligible',
  'primary_biejat_eligible',
  'government_coalition_dissent',
  'government_has_confidence',
  'coalition_broken',
  'government_achievements',
  'government_burden_active',
  'government_burden_timer',
  'government_burden_cycle',
  'government_burden_required',
  'government_burden_completed',
  'government_burden_breached',
  'government_burden_review_pending',
  'government_burden_failures',
  'government_burden_last_completed',
  'government_burden_last_breached',
  'government_goal_health',
  'government_goal_housing',
  'government_goal_labor',
  'government_goal_welfare',
  'government_goal_equality',
  'government_burden_health_market_seen',
  'government_burden_social_delay_seen',
  'government_burden_tenant_seen',
  'ministry_leverage',
  'ministry_base_leverage',
  'ministry_count',
  'ministries_finalized',
  'ministry_maximal_mandate',
  'ministry_whole_left_mandate',
  'ministry_left_cabinet_seats',
  'ministry_coalition_seats',
  'ministry_ko_in_cabinet',
  'ministry_p2050_in_cabinet',
  'ministry_psl_in_cabinet',
  'formation_psl_cabinet_committed',
  'ministry_reshuffle_previous_count',
  'ministry_reshuffle_changes',
  'psl_agriculture_released',
  'third_way_cohesion',
  'third_way_joint_list',
  'third_way_vote_intent',
  'third_way_threshold',
  'third_way_projected_seats',
  'ko_coalition_dissent',
  'psl_coalition_dissent',
  'p2050_coalition_dissent',
  'left_coalition_dissent',
  'coalition_seats',
  'sejm_total',
  'sejm_quorum_floor',
  'sejm_statutory_majority',
  'confidence_stage',
  'confidence_present',
  'confidence_threshold',
  'confidence_yes',
  'confidence_no',
  'confidence_abstain',
  'morawiecki_votes',
  'democratic_votes',
  'morawiecki_left_defectors',
  'morawiecki_psl_defectors',
  'formation_complete',
  'constructive_vonc_cooldown',
  'constructive_left_defections',
  'caretaker_government',
  'early_election_risk',
  'annual_budget_year',
  'annual_budget_fiscal_year',
  'annual_budget_passed',
  'annual_budget_margin',
  'annual_budget_yes',
  'annual_budget_no',
  'annual_budget_abstain',
  'annual_budget_left_cabinet_authority',
  'annual_budget_concession_code',
  'annual_budget_negotiation_success',
  'annual_budget_negotiation_outcome',
  'annual_budget_concession_strength',
  'annual_budget_left_yes',
  'annual_budget_left_no',
  'annual_budget_left_abstain',
  'annual_budget_government_yes',
  'annual_budget_government_abstain',
  'annual_budget_threshold',
  'annual_budget_present',
  'annual_budget_shortfall',
  'annual_budget_preview_government_yes',
  'annual_budget_preview_government_abstain',
  'annual_budget_preview_other_no',
  'annual_budget_preview_left_seats',
  'annual_budget_preview_reject_no',
  'annual_budget_preview_support_yes',
  'annual_budget_revision_pending',
  'opposition_budget_stage',
  'opposition_budget_government_seats',
  'opposition_budget_left_seats',
  'opposition_budget_other_opposition_seats',
  'opposition_budget_government_margin',
  'opposition_budget_left_is_pivotal',
  'opposition_budget_priority_count',
  'opposition_budget_priority_1_code',
  'opposition_budget_priority_2_code',
  'opposition_budget_priority_candidate_code',
  'opposition_budget_conference_code',
  'opposition_budget_rebel_count',
  'opposition_budget_tactic_code',
  'opposition_budget_amendment_1_passed',
  'opposition_budget_amendment_2_passed',
  'opposition_budget_amendments_passed',
  'opposition_budget_negotiation_score',
  'opposition_budget_negotiation_threshold',
  'opposition_budget_issue_ownership',
  'opposition_budget_credibility',
  'opposition_budget_media_attention',
  'opposition_budget_audit_pending',
  'opposition_budget_audit_done',
  'opposition_budget_audit_year',
  'opposition_budget_audit_fiscal_year',
  'opposition_budget_audit_tactic_code',
  'opposition_budget_audit_budget_passed',
  'opposition_budget_audit_priority_1_code',
  'opposition_budget_audit_priority_2_code',
  'opposition_budget_audit_priority_1_enacted',
  'opposition_budget_audit_priority_2_enacted',
  'opposition_budget_audit_enacted',
  'opposition_budget_audit_capacity_gain',
  'opposition_budget_senate_amendment_strength',
  'opposition_budget_senate_final_enacted',
  'budget_submission_time',
  'budget_submission_year',
  'budget_submission_month',
  'budget_deadline_time',
  'budget_deadline_year',
  'budget_deadline_month',
  'budget_deadline_active',
  'budget_rescue_attempted',
  'budget_rescue_bonus',
  'annual_budget_senate_stage_done',
  'annual_budget_senate_corrections_pending',
  'annual_budget_senate_corrections_accepted',
  'annual_budget_senate_correction_strength',
  'annual_budget_senate_government_votes',
  'annual_budget_senate_hostile_votes',
  'annual_budget_senate_override_yes',
  'annual_budget_senate_override_no',
  'annual_budget_senate_override_abstain',
  'annual_budget_senate_override_threshold',
  'annual_budget_senate_override_passed',
  'budget_confidence_triggered',
  'snap_election_requested',
  'snap_election_held',
  'snap_election_request_time',
  'snap_election_request_year',
  'snap_election_request_month',
  'snap_event_deferred_time',
  'snap_campaign_active',
  'snap_campaign_start_time',
  'snap_campaign_due_time',
  'snap_campaign_start_year',
  'snap_campaign_start_month',
  'snap_campaign_left_bonus',
  'election_2027_terminal',
  'election_2027_campaign_open',
  'snap_self_dissolution_support',
  'snap_budget_deadline_ready',
  'snap_budget_petition_roll',
  'snap_budget_petition_score',
  'snap_budget_petition_approved',
  'snap_budget_petition_advocacy',
  'snap_left_can_resign_cabinet',
  'snap_third_player_nomination_authority',
  'snap_formation_nominee_is_left',
  'snap_campaign_beyond_horizon',
  'office_sejm_marshal_yes',
  'office_sejm_marshal_no',
  'office_sejm_marshal_absent',
  'office_sejm_marshal_present',
  'office_sejm_marshal_threshold',
  'office_senate_marshal_yes',
  'office_senate_marshal_no',
  'office_senate_marshal_threshold',
  'snap_formation_attempt',
  'snap_formation_base',
  'snap_formation_left_votes',
  'snap_formation_left_abstentions',
  'snap_formation_variance',
  'snap_formation_first_right',
  'snap_election_complete',
  'snap_election_cycle',
  'snap_senate_marshal_return',
  'snap_repeat_campaign_roll',
  'snap_repeated_deadlock',
  'snap_pm_base',
  'snap_left_transfer',
  'snap_left_abstentions',
  'snap_first_variance',
  'snap_dem_base',
  'snap_dem_variance',
  'snap_left_cabinet_commitment',
  'formation_2025_psl_committed',
  'formation_2025_p2050_committed',
  'formation_2025_centrum_committed',
  'partnership_revision_pending',
  'partnership_revision_due_time',
  'partnership_revision_yes',
  'partnership_revision_no',
  'partnership_revision_passed',
  'partnership_revision_enacted',
  'partnership_revision_gain',
  'left_realign_p2050_score',
  'left_realign_greens_score',
  'left_realign_rozwoj_score',
  'left_realign_p2050_accepted',
  'left_realign_greens_accepted',
  'left_realign_rozwoj_accepted',
  'judiciary_horizon_cabinet_authority',
  'horizon_budget_authority',
  'boards_law_enacted',
  'judiciary_horizon_score',
  'judiciary_horizon_roll',
  'judiciary_status_law_enacted',
  'snap_pm_is_right',
  'snap_dem_candidate_left',
  'snap_dem_left_support',
  'local_election_seats',
  'eu_left_result',
  'eu_konf_result',
  'abortion_vote_left',
  'abortion_vote_ko',
  'abortion_vote_p2050',
  'abortion_vote_psl',
  'abortion_vote_yes',
  'abortion_vote_no',
  'abortion_vote_abstain',
  'abortion_vote_passed',
  'abortion_implementation_prepared',
  'abortion_presidential_score',
  'abortion_law_enacted',
  'abortion_rewrite_pending',
  'pip_sejm_yes',
  'pip_sejm_no',
  'pip_sejm_abstain',
  'pip_sejm_absent',
  'pip_sejm_present',
  'pip_sejm_quorum',
  'pip_sejm_threshold',
  'pip_sejm_passed',
  'pip_coalition_defections',
  'pip_senate_yes',
  'pip_senate_no',
  'pip_senate_threshold',
  'pip_senate_return_yes',
  'pip_senate_return_threshold',
  'pip_senate_return_passed',
  'pip_parliament_passed',
  'pip_final_retry_resolved',
  'krs_signed_protocol_2026',
  'krs_palace_hostile_2026',
  'krs_appointments_blocked_2026',
  'pres_2025_inaugurated',
  'pres_2025_oath_crisis',
  'pres_2025_runoff_historical_pair',
  'pres_2025_runoff_r1_a',
  'pres_2025_runoff_r1_b',
  'pres_2025_runoff_transfer_a',
  'pres_2025_runoff_transfer_b',
  'pres_2025_runoff_variance',
  'marshal_rotation_whip_bonus',
  'marshal_rotation_left_yes',
  'marshal_rotation_non_left_base',
  'marshal_rotation_defections',
  'marshal_rotation_yes',
  'marshal_rotation_no',
  'marshal_rotation_abstain',
  'marshal_rotation_absent',
  'marshal_rotation_present',
  'marshal_rotation_threshold',
  'marshal_rotation_vote_passed',
  'abortion_spring_no',
  'abortion_spring_abstain',
  'abortion_spring_absent',
  'abortion_spring_present',
  'abortion_spring_threshold',
  'confidence_2025_bonus',
  'confidence_2025_governing_base',
  'confidence_2025_dissent_loss',
  'confidence_2025_random_loss',
  'confidence_2025_absent',
  'confidence_2025_left_pool',
  'confidence_2025_left_yes',
  'confidence_2025_left_no',
  'confidence_2025_left_abstain',
  'formation_2025_left_pool',
  'formation_2025_left_yes',
  'formation_2025_left_no',
  'formation_2025_left_abstain',
  'formation_2025_left_cabinet',
  'formation_2025_core_pool',
  'formation_2025_core_yes',
  'formation_2025_core_loss',
  'formation_2025_variance',
  'formation_2025_absent',
  'formation_2025_passed',
  'formation_2025_designation_support',
  'formation_2025_designation_continuity',
  'formation_2025_designation_cohabitation',
  'formation_2025_designation_score',
  'formation_2025_designation_roll',
  'formation_2025_designation_total',
  'formation_2025_designation_accepted',
  'ivf_expansion_pressure',
  'third_way_split_pressure',
  'third_way_2026_pressure',
  'p2050_leadership_pelczynska_score',
  'p2050_leadership_hennig_score',
  'p2050_leadership_margin',
  'partnership_sejm_yes',
  'partnership_sejm_no',
  'partnership_sejm_abstain',
  'partnership_sejm_passed',
  'partnership_palace_lobby',
  'partnership_presidential_roll',
  'partnership_presidential_lobby_bonus',
  'partnership_presidential_score',
  'partnership_implementation_pending',
  'partnership_implementation_due_time',
  'partnership_implementation_complete',
  'office_incompatibility_pending',
  'office_incompatibility_resolved',
  'health_policy_pressure',
  'household_policy_pressure',
  'kpo_scrutiny',
  'administrative_reform_pressure',
  'administrative_capacity',
  'climate_policy_pressure',
  'trz_pandemic_bargain_pending',
  'trz_pandemic_bargain_implemented',
  'budget_2019_concession_pending',
  'budget_2020_concession_pending',
  'pis_social_amendment_pending',
  'pis_social_amendment_due_time',
  'pis_social_amendment_implemented',
  'budget_2021_concession_pending',
  'budget_2021_concession_implemented',
  'kpo_2022_concession_pending',
  'kpo_2022_concession_implemented',
  'budget_2022_concession_pending',
  'budget_2022_concession_implemented',
  'political_bulletin_pending',
  'political_bulletin_seen',
  'political_bulletin_year',
  'budget_2019_backing',
  'budget_backing',
  'budget_2021_backing',
  'budget_2022_backing',
  'extension_route_pending',
  'pres_candidate_tour_seen',
  'pres_razem_trzaskowski_reluctance',
  'pres_debate_initialized',
  'pres_debate_frame_done',
  'pres_debate_rights_done',
  'pres_debate_close_done',
  'pres_debate_stops_remaining',
  'pres_debate_score',
  'pres_debate_roll',
  'pres_debate_upset_roll',
  'pres_debate_resolved',
  'pres_debate_effective_score',
  'pres_debate_committed_bonus',
  'pres_debate_poll_before_left',
  'pres_debate_poll_shift',
  'trz_inaugurated',
  'trz_blocked',
  'trz_oath_crisis_launched',
  'trz_obstruction_pressure',
  'trz_defence_score',
  'trz_cohabitation_temperature',
  'trz_right_fragmentation',
  'trz_right_backlash',
  'trz_vetoes',
  'trz_abortion_signature',
  'trz_marriage_signature',
  'trz_rights_bill_votes',
];

const expectedEvents = [
  'poland_events.candidate',
  'poland_events.budget_2019',
  'poland_leadership_events.po_handoff_2020',
  'poland_opposition_budget.read_draft',
  'poland_events.covid',
  'poland_events.postal',
  'poland_leadership_events.ko_candidate_replacement_2020',
  'poland_presidential_election.setup',
  'poland_presidential_election.runoff_setup',
  'poland_leadership_events.p2050_foundation_2020',
  'poland_events.merger',
  'poland_events.abortion',
  'poland_events.strike',
  'poland_events.budget_2020',
  'poland_events.vaccine',
  'poland_monthly_briefing',
  'poland_events.rename',
  'poland_monthly_briefing',
  'poland_events.recovery_fund',
  'poland_events.opposition_reset',
  'poland_leadership_events.tusk_return_2021',
  'poland_events_2021_2023.august_2021',
  'poland_events_2021_2023.september_2021',
  'poland_events_2021_2023.october_2021_hub',
  'poland_events_2021_2023.november_2021_hub',
  'poland_events_2021_2023.december_2021_hub',
  'poland_events_2021_2023.january_2022',
  'poland_events_2021_2023.february_2022',
  'poland_events_2021_2023.march_2022',
  'poland_events_2021_2023.april_2022',
  'poland_events_2021_2023.may_2022',
  'poland_events_2021_2023.june_2022',
  'poland_events_2021_2023.july_2022',
  'poland_events_2021_2023.august_2022',
  'poland_events_2021_2023.september_2022',
  'poland_events_2021_2023.october_2022',
  'poland_events_2021_2023.november_2022_hub',
  'poland_events_2021_2023.december_2022',
  'poland_events_2021_2023.january_2023',
  'poland_events_2021_2023.february_2023_hub',
  'poland_events_2021_2023.march_2023',
  'poland_events_2021_2023.april_2023',
  'poland_events_2021_2023.may_2023',
  'poland_events_2021_2023.june_2023_hub',
  'poland_events_2021_2023.july_2023',
];

function convertGame(json) {
  let converted;
  let conversionError;

  dendry.convertJSONToGame(json, function(error, game) {
    conversionError = error;
    converted = game;
  });

  if (conversionError) {
    throw conversionError;
  }
  return converted;
}

function testPartyDeckWeights(game) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(choice) {
      return choice.id === sceneId;
    });
    assert(index >= 0, 'Missing setup choice: ' + sceneId);
    engine.choose(index);
  };
  const featured = new Set([
    'poland_picking_enemies',
    'poland_inter_party_relations',
    'poland_campaigning',
    'poland_fundraising',
    'poland_local_media_ecosystem',
  ]);

  featured.forEach(function(cardId) {
    assert.strictEqual(game.scenes[cardId].frequency, 200);
  });
  majorReformCardIds.forEach(function(cardId) {
    const tags = game.scenes[cardId].tags || [];
    assert.strictEqual(game.scenes[cardId].frequency, 135);
    assert.deepStrictEqual(tags, ['poland_major_reform_card']);
  });

  engine.beginGame(['weighted-party-deck-check']);
  choose('root.campaign_game');
  choose('root.standard');
  choose('poland_hub');

  const weight = function(choice) {
    return game.scenes[choice.id].frequency || 100;
  };
  const assertWeightedShare = function(deckId, featuredIds, label) {
    const eligible = engine._compileChoices(game.scenes[deckId])
      .filter(function(choice) {
        return choice.canChoose && game.scenes[choice.id].isCard;
      });
    const expected = eligible.reduce(function(total, choice) {
      return total + (featuredIds.has(choice.id) ? weight(choice) : 0);
    }, 0) / eligible.reduce(function(total, choice) {
      return total + weight(choice);
    }, 0);
    const samples = 4096;
    let featuredDraws = 0;

    for (let draw = 0; draw < samples; draw += 1) {
      if (featuredIds.has(engine._drawFromDeck(deckId).id)) {
        featuredDraws += 1;
      }
    }
    assert(
      Math.abs(featuredDraws / samples - expected) < 0.03,
      label + ' deck draw frequencies were not applied'
    );
  };

  assertWeightedShare('poland_party_deck', featured, 'Party');

  const majorDraws = engine._compileChoices(
    game.scenes.poland_major_reform_deck
  ).filter(function(choice) {
    return choice.canChoose && game.scenes[choice.id].isCard;
  }).map(function(choice) {
    return choice.id;
  }).sort();
  assert.deepStrictEqual(
    majorDraws,
    majorReformCardIds,
    'The separate Major Reforms deck did not draw all three projects'
  );

  const assertReformInjection = function(deckId, label) {
    engine.state.currentHands[engine.state.sceneId] = [];
    const candidates = [
      ...(engine._compileChoices(game.scenes[deckId]) || []),
      ...(engine._compileChoices(game.scenes.poland_major_reform_deck) || []),
    ].filter(function(choice, index, all) {
      return choice.canChoose && game.scenes[choice.id].isCard &&
        all.findIndex(function(candidate) {
          return candidate.id === choice.id;
        }) === index;
    });
    const reformWeight = candidates.reduce(function(total, choice) {
      return total + (majorReformCardIds.includes(choice.id)
        ? weight(choice) : 0);
    }, 0);
    const expected = reformWeight / candidates.reduce(function(total, choice) {
      return total + weight(choice);
    }, 0);
    const samples = 4096;
    let reformDraws = 0;
    for (let draw = 0; draw < samples; draw += 1) {
      if (majorReformCardIds.includes(engine._drawFromDeck(deckId).id)) {
        reformDraws += 1;
      }
    }
    assert(
      Math.abs(reformDraws / samples - expected) < 0.03,
      label + ' did not inject weighted major-reform projects'
    );
  };

  assertReformInjection('poland_negotiation_deck', 'Negotiation');
  const qualities = engine.state.qualities;
  qualities.left_in_government = 1;
  qualities.government_has_confidence = 1;
  qualities.caretaker_government = 0;
  qualities.ministries_finalized = 1;
  qualities.ministry_count = 1;
  qualities.labor_minister_party = 'Lewica';
  assertReformInjection('poland_government_deck', 'Government Affairs');
}

function contentText(value) {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(contentText).join(' ');
  }
  if (typeof value === 'object' && value.content !== undefined) {
    return contentText(value.content);
  }
  return '';
}

function testRadioFiles(game) {
  const audio = game.scenes['root.new_game'].audio;
  const tracks = audio.split(/\s+/).filter(function(token) {
    return token.startsWith('music/');
  });

  assert(audio.startsWith('clear shuffle '));
  assert(tracks.length > 1, 'Radio needs at least two tracks for Next');
  tracks.forEach(function(track) {
    assert(
      fs.existsSync(path.join(
        projectRoot,
        'out',
        'html',
        decodeURIComponent(track)
      )),
      'Missing radio track: ' + track
    );
  });
  assert(
    fs.readFileSync(
      path.join(projectRoot, 'out', 'html', 'index.html'),
      'utf8'
    ).includes('id="radio-volume"'),
    'Radio controls missing from index.html'
  );
  const radioSource = fs.readFileSync(
    path.join(projectRoot, 'out', 'html', 'game.js'),
    'utf8'
  );
  [
    'window.toggleRadio',
    'window.nextRadioTrack',
    'window.setRadioVolume',
    'var radioVolume = 0.2',
    'audio === startScene.audio',
    'Radio ready',
  ]
    .forEach(function(requiredSource) {
      assert(
        radioSource.includes(requiredSource),
        'Radio behavior missing from game.js: ' + requiredSource
      );
    });
}

function testPartyPresentationAssets() {
  const presentationSource = fs.readFileSync(
    path.join(projectRoot, 'out', 'html', 'game.js'),
    'utf8'
  );
  for (let month = 1; month <= 10; month += 1) {
    assert(
      presentationSource.includes(String(202700 + month) + ': {'),
      'The press cycle stops before 2027 election month ' + month
    );
  }
  const sandbox = {
    console: {log: function() {}, error: function() {}},
    document: {},
    window: {
      dendryUI: {
        dendryEngine: {state: {sceneId: 'poland_hub'}},
      },
    },
  };
  assert(
    /outlet\.id === 'tvp'[\s\S]{0,300}qualities\.public_media_patron/.test(
      presentationSource
    ) && presentationSource.includes('return qualities.public_media_patron;') &&
      presentationSource.includes('var pressTVPStory = function') &&
      presentationSource.includes(
        'var story = pressTVPStory(outlet, stories[outlet.id], qualities);'
      ),
    'TVP framing and simulated copy do not follow the public-media patron'
  );
  const testablePresentationSource = presentationSource.replace(
    '  window.renderPressReview = function() {',
    '  window.__testPressTVPStory = pressTVPStory;\n' +
      '  window.__testTVPOutlet = pressReviewOutlets.filter(function(outlet) {' +
      ' return outlet.id === \'tvp\'; })[0];\n\n' +
      '  window.renderPressReview = function() {'
  );
  vm.runInNewContext(testablePresentationSource, sandbox);

  const baseTVPStory = {
    headline: 'The coalition files its bill',
    text: 'Parliament begins the count.',
    sourceUrl: '',
    sourceDate: '',
  };
  [
    ['pis', 'Government under fire: ', 'PiS-aligned public television'],
    ['ko', 'Government restores order: ', 'KO-aligned public television'],
    ['left', 'Lewica delivers: ', 'Left-aligned public television'],
    ['neutral', 'Public record: ', 'pluralist public broadcaster'],
  ].forEach(function(expected) {
    const story = sandbox.window.__testPressTVPStory(
      sandbox.window.__testTVPOutlet,
      baseTVPStory,
      {time: 0, government_party: 'ko', public_media_patron: expected[0]}
    );
    assert(story.headline.startsWith(expected[1]));
    assert(story.text.includes(expected[2]));
  });

  const rendered = sandbox.window.displayText(
    'Together, Spring, Law and Justice, Labour Left, Young Left and ' +
      'New Left Renewal.'
  );
  [
    ['razem', 'party-razem', 'Razem'],
    ['wiosna', 'party-wiosna', 'Wiosna'],
    ['pis', 'party-pis', 'Prawo i Sprawiedliwość'],
    ['left-labor', 'party-left-labor', 'Lewica Pracy'],
    ['young-left', 'party-progressive', 'Młoda Lewica'],
    ['nowa-lewica', 'party-nowa-lewica', 'Nowa Lewica – Odnowa'],
  ].forEach(function(expected) {
    assert(
      rendered.includes('class="party ' + expected[1] + '"') &&
        rendered.includes('data-party="' + expected[0] + '"') &&
        rendered.includes('>' + expected[2] + '</span>'),
      'Party alias was not translated and colored: ' + expected[2]
    );
  });

  const authored = sandbox.window.displayText(
    '<span class="party party-korona">Korona</span>'
  );
  assert(authored.includes('data-party="kkp"'));
  assert(!authored.includes('<span class="party party-kkp"'));
  const nowaSolidarnosc = sandbox.window.displayText(
    '<span class="party party-nowa-solidarnosc">Nowa Solidarność</span>'
  );
  assert(nowaSolidarnosc.includes('data-party="nowa-solidarnosc"'));
  assert(nowaSolidarnosc.includes('short-lived patriotic-left challenger'));
  const bilingual = sandbox.window.displayText('Wiosna / Spring');
  assert.strictEqual((bilingual.match(/data-party="wiosna"/g) || []).length, 1);
  assert(!bilingual.includes('Wiosna / Wiosna'));

  sandbox.window.dendryUI.dendryEngine.state.qualities = {
    left_party_name: 'Lewica Razem',
  };
  const dynamicLeft = sandbox.window.displayText(
    'Lewica negotiates while The Left prepares its vote.'
  );
  assert.strictEqual(
    (dynamicLeft.match(/>Lewica Razem<\/span>/g) || []).length,
    2,
    'Generic Left labels did not follow the live campaign identity'
  );

  sandbox.window.dendryUI.dendryEngine.state.sceneId = 'main';
  const legacy = 'Together, they welcomed the Prussian Spring.';
  assert.strictEqual(sandbox.window.displayText(legacy), legacy);
}

function runSmoke(game) {
  const ui = new dendry.UserInterface();
  let pageBreakCount = 0;
  ui.newPage = function() {
    pageBreakCount += 1;
  };
  const engine = new dendry.DendryEngine(ui, game);
  const visited = [];
  const eventsSeen = [];
  const cardsPlayed = [];
  const decksUsed = new Set();
  const primaryWinners = new Set();
  const engineLogs = [];
  const originalLog = console.log;
  const originalRandom = Math.random;
  const originalChangeScene = engine.__changeScene.bind(engine);
  let randomState = 0x505241;

  console.log = function() {
    engineLogs.push(Array.prototype.join.call(arguments, ' '));
  };
  Math.random = function() {
    randomState =
      (Math.imul(1664525, randomState) + 1013904223) >>> 0;
    return randomState / 0x100000000;
  };
  engine.__changeScene = function(sceneId) {
    visited.push(sceneId);
    return originalChangeScene(sceneId);
  };

  function checkNumbers() {
    const qualities = engine.state.qualities;

    requiredNumericQualities.forEach(function(id) {
      assert.notStrictEqual(
        qualities[id],
        undefined,
        'Missing active numeric quality: ' + id
      );
      assert(
        Number.isFinite(qualities[id]),
        'Non-finite active quality ' + id + ': ' + qualities[id] +
          (id === 'confidence_present'
            ? ' (yes=' + qualities.confidence_yes +
              ', no=' + qualities.confidence_no +
              ', abstain=' + qualities.confidence_abstain +
              ', sejm=' + qualities.sejm_total + ')'
            : '')
      );
    });

    Object.keys(qualities).forEach(function(id) {
      if (typeof qualities[id] === 'number') {
        assert(
          Number.isFinite(qualities[id]),
          'Non-finite numeric game state ' + id + ': ' + qualities[id]
        );
      }
    });
  }

  function currentChoices() {
    return engine.getCurrentChoices() || [];
  }

  function choose(sceneId) {
    const choices = currentChoices();
    const index = choices.findIndex(function(choice) {
      return choice.id === sceneId;
    });

    assert(
      index >= 0,
      'Choice ' + sceneId + ' missing from ' + engine.state.sceneId +
        '; choices: ' + choices.map(function(choice) {
          return choice.id;
        }).join(', ')
    );
    assert(choices[index].canChoose, 'Choice unavailable: ' + sceneId);
    engine.choose(index);
    checkNumbers();
  }

  function chooseFirstAvailable(sceneIds) {
    const choices = currentChoices();
    const selectedId = sceneIds.find(function(sceneId) {
      return choices.some(function(choice) {
        return choice.id === sceneId && choice.canChoose;
      });
    });

    assert(
      selectedId,
      'No preferred legal choice in ' + engine.state.sceneId +
        '; choices: ' + choices.map(function(choice) {
          return choice.id + (choice.canChoose ? '' : ' [unavailable]');
        }).join(', ')
    );
    choose(selectedId);
    return selectedId;
  }

  function returnToHub() {
    choose('poland_hub');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
  }

  function assertHandHub() {
    const hub = game.scenes.poland_hub;
    assert(hub, 'Missing Polish leadership hub');
    assert.strictEqual(hub.isHand, true, 'Polish hub is not a native hand');
    assert.strictEqual(hub.maxCards, 3, 'Polish hub should hold three cards');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert(Array.isArray(engine.state.currentHands.poland_hub));

    deckIds.forEach(function(deckId) {
      const deck = game.scenes[deckId];
      assert(deck, 'Missing deck: ' + deckId);
      assert.strictEqual(deck.isDeck, true, deckId + ' is not a native deck');
    });
    assert.strictEqual(
      game.scenes.poland_government_deck.isDeck,
      true,
      'Missing contextual Government deck'
    );
    assert.strictEqual(
      game.scenes.poland_negotiation_deck.isDeck,
      true,
      'Missing contextual Negotiation deck'
    );
    assert.strictEqual(
      game.scenes.poland_major_reform_deck.isDeck,
      true,
      'Missing separate Major Reforms deck'
    );
    assert.strictEqual(
      game.scenes.poland_foreign_deck.isDeck,
      true,
      'Missing Foreign Affairs deck'
    );
  }

  function startStandard(seed) {
    engine.beginGame([seed]);
    assert.strictEqual(engine.state.sceneId, 'root.start_menu');
    if (currentChoices().some(function(choice) {
      return choice.id === 'root.campaign_game' && choice.canChoose;
    })) {
      choose('root.campaign_game');
    } else {
      choose('root.new_game');
    }
    choose('root.standard');
    assert.strictEqual(engine.state.sceneId, 'poland_intro');
    choose('poland_hub');
    assertHandHub();
  }

  function drawableCardIds(deckId) {
    return (engine._compileChoices(game.scenes[deckId]) || [])
      .filter(function(choice) {
        return choice.canChoose &&
          game.scenes[choice.id] &&
          game.scenes[choice.id].isCard;
      })
      .map(function(choice) {
        return choice.id;
      })
      .sort();
  }

  function testMonthlyCardDiscard() {
    startStandard('monthly-card-discard');
    const qualities = engine.state.qualities;
    qualities.candidate_event_done = 1;
    const cards = [
      drawFromDeck('poland_party_deck'),
      drawFromDeck('poland_party_deck'),
      drawFromDeck('poland_party_deck'),
    ];
    const beforeQualities = JSON.parse(JSON.stringify(qualities));
    const beforeLastDrawn = JSON.parse(
      JSON.stringify(engine.state.lastDrawnCard)
    );
    const beforeLastPlayed = engine.state.lastPlayedCard;
    const beforeResources = qualities.resources;
    const beforeActions = qualities.month_actions;
    const discardedId = cards[1].id;
    const discardedVisits = engine.state.visits[discardedId] || 0;

    engine.playPinnedCard('poland_discard_card');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_discard_card');
    assert.deepStrictEqual(
      currentChoices().filter(function(choice) {
        return choice.id.startsWith('poland_discard_card.slot_');
      }).map(function(choice) {
        return choice.id;
      }),
      [
        'poland_discard_card.slot_1',
        'poland_discard_card.slot_2',
        'poland_discard_card.slot_3',
      ]
    );
    choose('poland_discard_card.slot_2');

    assert.strictEqual(engine.state.sceneId, 'poland_discard_card.commit');
    assert.deepStrictEqual(
      engine.state.currentHands.poland_hub.map(function(card) {
        return card.id;
      }),
      [cards[0].id, cards[2].id],
      'Discarding the middle opportunity damaged hand order'
    );
    assert.deepStrictEqual(
      Object.fromEntries(
        Object.entries(JSON.parse(JSON.stringify(qualities))).filter(
          function(entry) {
            return entry[0] !== 'resources' &&
              entry[0] !== 'month_actions' &&
              entry[0] !== 'poland_hand_count' &&
              entry[0] !== 'poland_hand_full' &&
              !entry[0].startsWith('poland_discard_');
          }
        )
      ),
      Object.fromEntries(
        Object.entries(beforeQualities).filter(function(entry) {
          return entry[0] !== 'resources' &&
            entry[0] !== 'month_actions' &&
            entry[0] !== 'poland_hand_count' &&
            entry[0] !== 'poland_hand_full' &&
            !entry[0].startsWith('poland_discard_');
        })
      ),
      'Discarding a held opportunity changed unrelated political state'
    );
    assert.strictEqual(
      qualities.resources,
      beforeResources - 1,
      'Discarding did not charge exactly 1 party resource'
    );
    assert.strictEqual(
      qualities.month_actions,
      beforeActions + 1,
      'Discarding did not consume the monthly action'
    );
    assert.strictEqual(
      qualities.poland_discard_month_key,
      Number(qualities.year) * 100 + Number(qualities.month),
      'Discarding did not record this calendar month'
    );
    assert.strictEqual(qualities.poland_discard_allowed, 0);
    assert.deepStrictEqual(
      JSON.parse(JSON.stringify(engine.state.lastDrawnCard)),
      beforeLastDrawn,
      'Discarding a held opportunity changed the last draw'
    );
    assert.strictEqual(
      engine.state.lastPlayedCard,
      beforeLastPlayed,
      'Discarding was incorrectly recorded as playing a card'
    );
    assert.strictEqual(
      engine.state.visits[discardedId] || 0,
      discardedVisits,
      'Discarding triggered the held card'
    );

    const savedState = JSON.parse(
      JSON.stringify(engine.getExportableState())
    );
    engine.setState(savedState);
    assert.deepStrictEqual(
      engine.state.currentHands.poland_hub.map(function(card) {
        return card.id;
      }),
      [cards[0].id, cards[2].id],
      'A discarded opportunity returned after save/load'
    );

    choose('poland_card_finish');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(engine.state.qualities.month_actions, 0);
    assert.deepStrictEqual(
      engine.state.currentHands.poland_hub.map(function(card) {
        return card.id;
      }),
      [cards[0].id, cards[2].id],
      'Turning the month after a discard removed the remaining hand'
    );
    const replacement = drawFromDeck('poland_party_deck');
    assert(replacement && replacement.id);
    assert.strictEqual(engine.state.currentHands.poland_hub.length, 3);
    assert.strictEqual(
      engine.state.currentHands.poland_hub.filter(function(card) {
        return card.id === cards[0].id;
      }).length,
      1
    );
    assert.strictEqual(
      engine.state.currentHands.poland_hub.filter(function(card) {
        return card.id === cards[2].id;
      }).length,
      1
    );

    startStandard('monthly-discard-empty-cancel');
    const emptyQualities = JSON.parse(
      JSON.stringify(engine.state.qualities)
    );
    engine.playPinnedCard('poland_discard_card');
    assert.strictEqual(engine.state.sceneId, 'poland_discard_card');
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_discard_card.cancel']
    );
    choose('poland_discard_card.cancel');
    assert.deepStrictEqual(
      Object.fromEntries(
        Object.entries(
          JSON.parse(JSON.stringify(engine.state.qualities))
        ).filter(function(entry) {
          return !entry[0].startsWith('poland_discard_');
        })
      ),
      Object.fromEntries(
        Object.entries(emptyQualities).filter(function(entry) {
          return !entry[0].startsWith('poland_discard_');
        })
      ),
      'Cancelling an empty discard menu changed unrelated political state'
    );
  }

  function testOpportunityCardGating() {
    startStandard('opportunity-party-gates');
    let qualities = engine.state.qualities;
    let partyCards = drawableCardIds('poland_party_deck');

    [
      'poland_cost_the_programme',
      'poland_hostile_interview',
      'poland_local_media_ecosystem',
      'poland_presidential_channel',
      'poland_rapid_response',
    ].forEach(function(cardId) {
      assert(
        !partyCards.includes(cardId),
        cardId + ' appeared before its political context existed'
      );
    });
    [
      'poland_campaigning',
      'poland_opposition_coordination',
      'poland_programme_convention',
      'poland_rally',
      'poland_senate_docket',
    ].forEach(function(cardId) {
      assert(
        partyCards.includes(cardId),
        cardId + ' was missing from its opening context'
      );
    });

    qualities.budget_promises = 1;
    engine.goToScene('poland_hub');
    assert(
      drawableCardIds('poland_party_deck')
        .includes('poland_cost_the_programme')
    );

    startStandard('cost-programme-no-dead-end-gate');
    qualities = engine.state.qualities;
    qualities.resources = 0;
    qualities.budget_promises = 0;
    qualities.budget_breaches = 0;
    qualities.social_floor_written = 1;
    qualities.fiscal_stress = 15;
    engine.goToScene('poland_hub');
    assert(
      !drawableCardIds('poland_party_deck')
        .includes('poland_cost_the_programme'),
      'Cost the Programme appeared with every authored choice disabled'
    );

    qualities.media_event_done = 1;
    qualities.media_capacity = 16;
    engine.goToScene('poland_hub');
    partyCards = drawableCardIds('poland_party_deck');
    assert(partyCards.includes('poland_local_media_ecosystem'));
    assert(partyCards.includes('poland_rapid_response'));

    qualities.prime_minister = 'Donald Tusk';
    engine.goToScene('poland_hub');
    assert(
      !drawableCardIds('poland_party_deck')
        .includes('poland_opposition_coordination'),
      'PiS-opposition coordination appeared under a KO prime minister'
    );
    qualities.prime_minister = 'Beata Szydło';
    engine.goToScene('poland_hub');
    assert(
      drawableCardIds('poland_party_deck')
        .includes('poland_opposition_coordination')
    );

    qualities.president_name = 'Magdalena Biejat';
    qualities.president_relation = 30;
    qualities.presidential_channel_open = 1;
    qualities.trz_blocked = 0;
    engine.goToScene('poland_hub');
    assert(
      drawableCardIds('poland_party_deck')
        .includes('poland_presidential_channel')
    );
    engine.goToScene('poland_presidential_channel');
    const presidentialText = contentText(engine.state.currentContent);
    assert(presidentialText.includes('Magdalena Biejat'));
    assert(
      !presidentialText.includes("Duda's conflict"),
      'The presidential card ignored the actual office-holder'
    );

    qualities.president_name = 'Rafał Trzaskowski';
    qualities.government_party = 'ko';
    qualities.government_name = 'Donald Tusk democratic coalition';
    qualities.left_in_government = 1;
    qualities.government_coalition_dissent = 0;
    qualities.government_delivery = 10;
    qualities.ko_relation = 50;
    qualities.ko_coalition_dissent = 0;
    const pisRelationBeforeDemocraticVeto = qualities.pis_relation;
    engine.goToScene('poland_presidential_channel');
    const democraticPresidentialText = contentText(
      engine.state.currentContent
    );
    assert(democraticPresidentialText.includes('democratic coalition'));
    assert(!democraticPresidentialText.includes('inside a PiS state'));
    choose('poland_presidential_channel.trz_veto_channel');
    assert.strictEqual(qualities.pis_relation, pisRelationBeforeDemocraticVeto);
    assert.strictEqual(qualities.ko_relation, 47);
    assert.strictEqual(qualities.ko_coalition_dissent, 4);
    assert.strictEqual(qualities.government_coalition_dissent, 4);
    assert.strictEqual(qualities.government_delivery, 9);

    startStandard('opportunity-senate-cooldown');
    qualities = engine.state.qualities;
    qualities.poland_senate_docket_timer = 2;
    engine.goToScene('poland_hub');
    assert(
      !drawableCardIds('poland_party_deck')
        .includes('poland_senate_docket'),
      'The Senate docket ignored its negotiation cooldown'
    );

    startStandard('opportunity-government-gates');
    qualities = engine.state.qualities;
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.ministries_finalized = 1;
    qualities.ministry_count = 0;
    ministryPortfolioCases.forEach(function(testCase) {
      qualities[testCase.portfolio + '_minister_party'] = 'Unassigned';
    });
    engine.goToScene('poland_hub');
    assert.deepStrictEqual(
      drawableCardIds('poland_government_deck').filter(function(cardId) {
        return !majorReformCardIds.includes(cardId);
      }),
      [],
      'Portfolio government cards appeared without a Lewica ministry'
    );
    assert(
      !currentChoices().some(function(choice) {
        return choice.id === 'poland_government_deck';
      }),
      'An empty Government Affairs deck remained visible'
    );

    ministryPortfolioCases.forEach(function(testCase) {
      ministryPortfolioCases.forEach(function(otherCase) {
        qualities[otherCase.portfolio + '_minister_party'] =
          'Unassigned';
      });
      qualities.ministry_count = 1;
      qualities[testCase.portfolio + '_minister_party'] = 'Lewica';
      engine.goToScene('poland_hub');
      assert(
        drawableCardIds('poland_government_deck')
          .includes(testCase.cardId),
        testCase.cardId + ' did not follow ministry ownership'
      );
    });

    const foreignMinistryTags =
      game.scenes.poland_foreign_ministry_line.tags || [];
    assert(foreignMinistryTags.includes('poland_government_card'));
    assert(
      !foreignMinistryTags.includes('poland_foreign_card'),
      'The Foreign Ministry portfolio card leaked into Foreign Affairs'
    );

    ministryPortfolioCases.forEach(function(testCase) {
      qualities[testCase.portfolio + '_minister_party'] = 'Unassigned';
    });
    qualities.labor_minister_party = 'Lewica';
    qualities.ministry_count = 1;
    engine.goToScene('poland_hub');
    const partyCard = drawFromDeck('poland_party_deck');
    const governmentCard = drawFromDeck('poland_government_deck');
    assert(expectedGovernmentCardIds.includes(governmentCard.id));
    qualities.left_in_government = 0;
    engine.goToScene('poland_hub');
    const expectedOppositionHand = [partyCard.id];
    if (majorReformCardIds.includes(governmentCard.id)) {
      expectedOppositionHand.push(governmentCard.id);
    }
    assert.deepStrictEqual(
      engine.state.currentHands.poland_hub.map(function(card) {
        return card.id;
      }),
      expectedOppositionHand,
      'Leaving office did not preserve only cross-tagged opportunities'
    );
  }

  function testGovernmentBurden() {
    startStandard('government-burden-entry');
    let qualities = engine.state.qualities;
    qualities.year = 2024;
    qualities.month = 1;
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.government_party = 'ko';
    qualities.third_way_active = 1;
    qualities.budget = 6;
    qualities.ministries_finalized = 1;
    qualities.ministry_count = 2;
    qualities.health_minister_party = 'Lewica';
    qualities.housing_minister_party = 'Lewica';

    const pendingBurdenEvents = function() {
      return (engine._compileChoices(
        game.scenes['poland_event_queue.all_events']
      ) || []).map(function(choice) {
        return choice.id;
      });
    };

    assert(
      pendingBurdenEvents().includes('poland_government_burden.entry'),
      'Entering a functioning cabinet did not open government burden'
    );
    engine.goToScene('poland_government_burden.entry');
    assert.strictEqual(qualities.government_burden_active, 1);
    assert.strictEqual(qualities.government_burden_timer, 6);
    assert.strictEqual(qualities.government_burden_cycle, 1);
    assert(
      !pendingBurdenEvents().includes('poland_government_burden.entry'),
      'Government burden entry remained pending after activation'
    );

    qualities.government_burden_timer = 5;
    assert(
      pendingBurdenEvents().includes(
        'poland_government_burden.health_market'
      ),
      'Guarded health-market coalition event did not open on schedule'
    );
    qualities.caretaker_government = 1;
    assert(
      !pendingBurdenEvents().includes(
        'poland_government_burden.health_market'
      ),
      'Government burden event appeared under a caretaker cabinet'
    );
    qualities.caretaker_government = 0;

    engine.goToScene('poland_health_compact');
    choose('poland_health_compact.capacity');
    assert.strictEqual(
      qualities.government_goal_health,
      1,
      'Public-health delivery did not advance government burden'
    );
    engine.goToScene('poland_housing_fund');
    choose('poland_housing_fund.guarantee');
    assert.strictEqual(
      qualities.government_goal_housing,
      1,
      'Tenant guarantees did not advance government burden'
    );

    startStandard('government-burden-success');
    qualities = engine.state.qualities;
    qualities.year = 2024;
    qualities.month = 1;
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.government_party = 'ko';
    qualities.government_burden_active = 1;
    qualities.government_burden_timer = 1;
    qualities.government_goal_health = 1;
    qualities.government_goal_housing = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.government_burden_review_pending, 1);
    assert.strictEqual(qualities.government_burden_last_completed, 2);
    assert.strictEqual(qualities.government_achievements, 1);
    assert.strictEqual(qualities.government_burden_failures, 0);
    assert(
      qualities.left_poll >= 13.8,
      'Burden polling and bloc rewards resolved to only ' +
        qualities.left_poll
    );
    assert.strictEqual(qualities.public_service_families_left_affinity, 6);
    assert.strictEqual(qualities.older_welfare_households_left_affinity, 6);
    assert.strictEqual(qualities.rural_localists_left_affinity, 6);
    assert.strictEqual(qualities.metropolitan_liberals_left_affinity, 6);
    assert.strictEqual(qualities.anti_establishment_youth_left_affinity, 6);
    assert.strictEqual(qualities.provincial_welfare_left_affinity, 5);
    assert.strictEqual(qualities.industrial_logistics_left_affinity, 0);
    assert.strictEqual(qualities.liberal_professionals_left_affinity, 0);

    startStandard('government-burden-breach');
    qualities = engine.state.qualities;
    qualities.year = 2024;
    qualities.month = 1;
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.government_party = 'ko';
    qualities.government_burden_active = 1;
    qualities.government_burden_timer = 1;
    qualities.government_goal_health = 1;
    qualities.government_goal_housing = 1;
    qualities.government_goal_labor = 1;
    qualities.government_burden_breached = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.government_burden_last_completed, 3);
    assert.strictEqual(qualities.government_burden_last_breached, 1);
    assert.strictEqual(qualities.government_achievements, 0);
    assert.strictEqual(qualities.government_burden_failures, 1);
    qualities.voter_groups.forEach(function(group) {
      assert.strictEqual(
        qualities[group + '_left_affinity'],
        -3,
        'A failed government burden did not immediately hurt ' + group
      );
    });

    qualities.government_burden_health_market_seen = 1;
    qualities.left_in_government = 0;
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.government_burden_active, 0);
    assert.strictEqual(qualities.government_burden_timer, 0);
    assert.strictEqual(qualities.government_burden_review_pending, 0);
    assert.strictEqual(
      qualities.government_burden_health_market_seen,
      1,
      'Leaving government repeated a one-time coalition pressure event'
    );
  }

  function testResourceCadence() {
    startStandard('resource-cadence-no-monthly-restore');

    // The normalizer protects against invalid or negative values, but political
    // resources are intentionally not capped at the old inherited limit of 10.
    engine.state.qualities.resources = 13;
    engine.goToScene('poland_hub');
    checkNumbers();
    assert.strictEqual(
      engine.state.qualities.resources,
      13,
      'Polish normalization still caps resources at the inherited limit'
    );

    // An ordinary month turn consumes time, not an automatic resource grant.
    engine.playPinnedCard('poland_hub.end_month');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_events.candidate');
    assert.strictEqual(
      engine.state.qualities.resources,
      13,
      'Ordinary month turn incorrectly restored political resources'
    );
    assert.strictEqual(engine.state.qualities.last_resource_restore_year, 2019);

    // January and July each collect the current party income. Low internal
    // dissent earns the documented one-resource bonus on each payout.
    startStandard('resource-cadence-annual-restore');
    const qualities = engine.state.qualities;
    qualities.resources = 13;
    qualities.year = 2019;
    qualities.month = 12;
    qualities.last_resource_restore_year = 2019;
    qualities.member_dues = 2;
    qualities.left_seats = 49;
    qualities.left_projected_seats = 49;
    qualities.internal_dissent = 18;
    engine.goToScene('poland_advance');
    checkNumbers();
    assert.strictEqual(qualities.year, 2020);
    assert.strictEqual(qualities.month, 1);
    assert.strictEqual(
      qualities.resources,
      18,
      'Annual restore should be party income plus the low-dissent bonus'
    );
    assert.strictEqual(qualities.last_resource_restore_year, 2020);
    assert.strictEqual(qualities.last_dues_payout, 3);
    assert.strictEqual(qualities.last_subvention_payout, 2);
    assert.strictEqual(qualities.last_annual_payout, 5);
    assert(qualities.last_annual_payout_label.startsWith('January 2020:'));

    const afterAnnualRestore = qualities.resources;
    engine.goToScene('poland_advance');
    checkNumbers();
    assert.strictEqual(qualities.month, 2);
    assert.strictEqual(
      qualities.resources,
      afterAnnualRestore,
      'Annual party income restored more than once in the same year'
    );

    qualities.month = 6;
    engine.goToScene('poland_advance');
    checkNumbers();
    assert.strictEqual(qualities.month, 7);
    assert.strictEqual(
      qualities.resources,
      afterAnnualRestore + 5,
      'The July half-year point did not repeat the current income payout'
    );
    assert.strictEqual(qualities.last_midyear_resource_restore_year, 2020);
    assert(qualities.last_annual_payout_label.startsWith('July 2020:'));
    const afterMidyearRestore = qualities.resources;
    engine.goToScene('poland_advance');
    checkNumbers();
    assert.strictEqual(qualities.month, 8);
    assert.strictEqual(
      qualities.resources,
      afterMidyearRestore,
      'The July income payout repeated within the same year'
    );

    // The Polish subvention abstraction follows seats actually won, not a
    // volatile polling projection.
    startStandard('resource-cadence-seat-subvention');
    const reducedSeats = engine.state.qualities;
    reducedSeats.resources = 0;
    reducedSeats.year = 2019;
    reducedSeats.month = 12;
    reducedSeats.last_resource_restore_year = 2019;
    reducedSeats.member_dues = 2;
    reducedSeats.left_seats = 26;
    reducedSeats.left_projected_seats = 100;
    reducedSeats.internal_dissent = 30;
    engine.goToScene('poland_advance');
    checkNumbers();
    assert.strictEqual(reducedSeats.seat_subvention_seats, 26);
    assert.strictEqual(reducedSeats.seat_subvention, 1);
    assert.strictEqual(reducedSeats.last_dues_payout, 2);
    assert.strictEqual(reducedSeats.last_subvention_payout, 1);
    assert.strictEqual(
      reducedSeats.resources,
      3,
      'Annual subvention followed projected rather than electoral seats'
    );
  }

  function testFundraisingEconomy() {
    startStandard('fundraising-raise-dues');
    let qualities = engine.state.qualities;
    const openingResources = qualities.resources;
    engine.goToScene('poland_fundraising');
    choose('poland_fundraising.raise');
    assert.strictEqual(qualities.member_dues, 3);
    assert.strictEqual(qualities.seat_subvention, 2);
    assert.strictEqual(qualities.party_income, 5);
    assert.strictEqual(qualities.resources, openingResources + 1);
    assert.strictEqual(qualities.poland_fundraising_timer, 12);

    startStandard('fundraising-lower-dues');
    qualities = engine.state.qualities;
    qualities.member_dues = 3;
    qualities.resources = 2;
    qualities.barons_dissent = 30;
    qualities.spring_dissent = 30;
    qualities.labor_dissent = 30;
    qualities.progressives_dissent = 30;
    qualities.razem_dissent = 30;
    engine.goToScene('poland_hub');
    engine.goToScene('poland_fundraising');
    choose('poland_fundraising.lower');
    assert.strictEqual(qualities.member_dues, 2);
    assert.strictEqual(qualities.party_income, 4);
    assert.strictEqual(qualities.resources, 1);
    [
      'barons',
      'spring',
      'labor',
      'progressives',
      'razem',
    ].forEach(function(faction) {
      assert.strictEqual(qualities[faction + '_dissent'], 26);
    });

    startStandard('fundraising-emergency-lock');
    qualities = engine.state.qualities;
    qualities.resources = 3;
    engine.goToScene('poland_fundraising');
    choose('poland_fundraising.emergency');
    assert.strictEqual(qualities.resources, 5);
    assert.strictEqual(qualities.emergency_fundraising_timer, 16);
    qualities.advisor_action_timer = 0;
    engine.goToScene('poland_advisors');
    const lockedFundraiser = currentChoices().find(function(choice) {
      return choice.id === 'poland_advisors.czarzasty_fundraising';
    });
    assert(lockedFundraiser);
    assert.strictEqual(lockedFundraiser.canChoose, false);
    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.emergency_fundraising_timer, 15);

    startStandard('generic-campaigning-card');
    qualities = engine.state.qualities;
    const industrialAffinity =
      qualities.industrial_logistics_left_affinity;
    engine.goToScene('poland_campaigning');
    choose('poland_campaigning.industrial');
    assert.strictEqual(
      qualities.industrial_logistics_left_affinity,
      industrialAffinity + 5
    );
    assert.strictEqual(qualities.resources, 4);
    assert.strictEqual(qualities.poland_campaigning_timer, 2);

    startStandard('generic-rally-card');
    qualities = engine.state.qualities;
    const workerSupport = qualities.workers_support;
    engine.goToScene('poland_rally');
    choose('poland_rally.work');
    assert.strictEqual(
      qualities.workers_support,
      workerSupport + 4,
      'Favourable social-spending opinion did not scale the rally gain'
    );
    assert.strictEqual(qualities.card_public_response, 'breakthrough');
    assert.strictEqual(qualities.poland_rally_timer, 6);
  }

  function testPublicOpinionSystem() {
    const issueKeys = [
      'abortion_rights',
      'refugee_solidarity',
      'border_security',
      'vaccination',
      'social_spending',
      'lgbt_equality',
      'secular_state',
      'rule_of_law',
      'national_security',
    ];

    startStandard('public-opinion-initialization');
    let qualities = engine.state.qualities;
    issueKeys.forEach(function(issue) {
      ['support', 'salience', 'backlash'].forEach(function(measure) {
        const value = qualities[issue + '_' + measure];
        assert(Number.isFinite(value));
        assert(value >= 0 && value <= 100);
      });
    });
    [
      'capitalism_acceptance',
      'welfare_expectation',
      'cultural_conservatism',
      'order_threat_sensitivity',
      'universal_solidarity',
      'institutional_trust',
      'change_appetite',
    ].forEach(function(attitude) {
      assert(Number.isFinite(qualities[attitude]));
      assert(qualities[attitude] >= 0 && qualities[attitude] <= 100);
    });
    assert(
      qualities.capitalism_acceptance > 50 &&
        qualities.cultural_conservatism > 50 &&
        qualities.welfare_expectation > 70,
      'Opening attitudes do not preserve capitalist, conservative welfare support'
    );
    [
      'electoral_viability',
      'winner_reputation',
      'issue_ownership',
      'leadership_authority',
      'coalition_blur',
      'media_access',
      'list_confidence',
    ].forEach(function(pressure) {
      assert(Number.isFinite(qualities[pressure]));
    });
    engine.goToScene('status.opinion');
    assert.strictEqual(
      qualities.status_public_hottest,
      'Social spending and public services'
    );
    assert.strictEqual(
      qualities.status_lgbt_equality_support_band,
      'closely contested'
    );

    startStandard('multiplicative-story-contest-favourable');
    qualities = engine.state.qualities;
    const openingCapitalism = qualities.capitalism_acceptance;
    const openingConservatism = qualities.cultural_conservatism;
    qualities.story_queue = [{
      title: 'Deterministic favourable test',
      issue: 'social_spending',
      label: 'Social-spending test',
      reach: 100,
      audienceTrust: 100,
      frame: 100,
      messengerCredibility: 100,
      issueSalience: 100,
      leftCredibility: 100,
    }];
    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.story_last_signal, 100);
    assert(qualities.story_persuasion > qualities.story_backlash);
    assert(qualities.story_mobilisation > 0);
    assert(qualities.story_abstention < 0);
    assert(qualities.story_issue_ownership > 0);
    assert.strictEqual(qualities.capitalism_acceptance, openingCapitalism);
    assert.strictEqual(qualities.cultural_conservatism, openingConservatism);

    startStandard('multiplicative-story-contest-hostile');
    qualities = engine.state.qualities;
    qualities.story_queue = [{
      title: 'Deterministic hostile test',
      issue: 'social_spending',
      label: 'Social-spending test',
      reach: 100,
      audienceTrust: 100,
      frame: -100,
      messengerCredibility: 100,
      issueSalience: 100,
      leftCredibility: 100,
    }];
    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(
      qualities.story_last_signal,
      -50,
      'Hostile framing ignored the model\'s credibility discount'
    );
    assert(qualities.story_backlash > 0);
    assert(qualities.story_mobilisation < 0);
    assert(qualities.story_abstention > 0);
    assert(qualities.story_issue_ownership < 0);

    startStandard('public-opinion-card-scaling-favourable');
    qualities = engine.state.qualities;
    qualities.social_spending_support = 84;
    qualities.social_spending_salience = 80;
    qualities.social_spending_backlash = 18;
    const favourableWorkers = qualities.workers_support;
    const favourablePoll = qualities.left_poll;
    engine.goToScene('poland_rally');
    choose('poland_rally.work');
    const favourableGain = qualities.workers_support - favourableWorkers;
    assert.strictEqual(qualities.card_public_response, 'breakthrough');
    assert(qualities.left_poll > favourablePoll);
    assert(
      contentText(engine.state.currentContent).includes(
        'public majority already looking for a political owner'
      ),
      'Favourable public climate did not render breakthrough prose'
    );

    startStandard('public-opinion-card-scaling-hostile');
    qualities = engine.state.qualities;
    qualities.social_spending_support = 24;
    qualities.social_spending_salience = 82;
    qualities.social_spending_backlash = 88;
    const hostileWorkers = qualities.workers_support;
    const hostilePoll = qualities.left_poll;
    engine.goToScene('poland_rally');
    choose('poland_rally.work');
    const hostileGain = qualities.workers_support - hostileWorkers;
    assert(
      qualities.card_public_response === 'backlash' ||
        qualities.card_public_response === 'reversal'
    );
    assert(qualities.left_poll < hostilePoll);
    assert(
      contentText(engine.state.currentContent).includes(
        'hostile, panicked climate'
      ),
      'Hostile public climate did not render reversal prose'
    );
    assert(
      favourableGain > hostileGain,
      'Public perceptions did not scale the same card in opposite climates'
    );

    const pollAfterStory = function(frame) {
      startStandard('public-opinion-poll-media-link');
      const storyQualities = engine.state.qualities;
      engine.goToScene('poland_polling');
      storyQualities.story_queue = [{
        title: 'Deterministic polling link',
        issue: 'social_spending',
        label: 'Social-spending polling link',
        reach: 100,
        audienceTrust: 100,
        frame,
        messengerCredibility: 100,
        issueSalience: 100,
        leftCredibility: 100,
      }];
      storyQualities.month_actions = 1;
      engine.goToScene('poland_advance');
      storyQualities.poll_state_month_key = -1;
      engine.goToScene('poland_polling');
      return {
        vote: storyQualities.left_vote_intent,
        ownership: storyQualities.social_spending_left_ownership,
      };
    };
    const favourableStoryPoll = pollAfterStory(100);
    const hostileStoryPoll = pollAfterStory(-100);
    assert(
      favourableStoryPoll.ownership > hostileStoryPoll.ownership &&
        favourableStoryPoll.vote > hostileStoryPoll.vote,
      'Media reception and issue ownership did not feed through to Left polling'
    );

    startStandard('prolonged-pandemic-defensive-drift');
    qualities = engine.state.qualities;
    qualities.year = 2021;
    qualities.month = 1;
    qualities.covid_event_done = 1;
    qualities.pandemic_attitude_opening_applied = 1;
    qualities.labor_credibility = 20;
    qualities.health_capacity = 20;
    qualities.social_spending_left_ownership = 20;
    qualities.vaccination_left_ownership = 20;
    const prePandemicCapitalism = qualities.capitalism_acceptance;
    const prePandemicConservatism = qualities.cultural_conservatism;
    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert(
      qualities.capitalism_acceptance > prePandemicCapitalism &&
        qualities.cultural_conservatism > prePandemicConservatism,
      'An unowned prolonged pandemic did not produce the defensive rightward drift'
    );

    startStandard('public-opinion-legacy-bridge');
    qualities = engine.state.qualities;
    const refugeeSupport = qualities.refugee_solidarity_support;
    const refugeeSalience = qualities.refugee_solidarity_salience;
    const refugeeBacklash = qualities.refugee_solidarity_backlash;
    qualities.refugee_empathy += 10;
    qualities.far_right_agenda += 8;
    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert(qualities.refugee_solidarity_support > refugeeSupport);
    assert(qualities.refugee_solidarity_salience > refugeeSalience);
    assert(qualities.refugee_solidarity_backlash > refugeeBacklash);
    assert(qualities.public_opinion_bridge_pressure > 0);

    startStandard('public-opinion-old-save-normalization');
    qualities = engine.state.qualities;
    delete qualities.lgbt_equality_support;
    delete qualities.lgbt_equality_salience;
    delete qualities.lgbt_equality_backlash;
    delete qualities.public_opinion_issues;
    engine.goToScene('poland_normalize');
    assert(Number.isFinite(qualities.lgbt_equality_support));
    assert(Number.isFinite(qualities.lgbt_equality_salience));
    assert(Number.isFinite(qualities.lgbt_equality_backlash));
    assert(qualities.public_opinion_issues.includes('lgbt_equality'));
  }

  function testDatedCashOptions() {
    const routes = [
      {
        scene: 'poland_events.media',
        choice: 'poland_events.media_subscription',
        gain: 1,
      },
      {
        scene: 'poland_events.merger',
        choice: 'poland_events.merger_assets',
        gain: 2,
      },
      {
        scene: 'poland_events.rename',
        choice: 'poland_events.rename_drive',
        gain: 1,
      },
    ];
    routes.forEach(function(route, index) {
      startStandard('dated-cash-option-' + index);
      const qualities = engine.state.qualities;
      const before = qualities.resources;
      engine.goToScene(route.scene);
      choose(route.choice);
      assert.strictEqual(
        qualities.resources,
        before + route.gain,
        route.choice + ' did not raise the advertised party cash'
      );
    });
  }

  function reachPreparedPrimary(seed) {
    startStandard(seed);
    engine.goToScene('poland_faction_congress');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_faction_congress');
    choose('poland_faction_congress.new_generation');
    choose('poland_card_finish');
    assert.strictEqual(engine.state.sceneId, 'poland_events.candidate');
    assert.strictEqual(engine.state.qualities.primary_new_generation, 1);
  }

  function runPreparedPrimary(seed) {
    reachPreparedPrimary(seed);
    const qualities = engine.state.qualities;
    const resourcesBeforePrimary = qualities.resources;

    choose('poland_events.candidate_primary');
    assert.strictEqual(engine.state.sceneId, 'poland_primary.franchise');
    assert.strictEqual(qualities.resources, resourcesBeforePrimary - 2);
    assert.strictEqual(qualities.presidential_candidate, 'Undecided');
    assert.strictEqual(qualities.primary_active, 1);

    choose('poland_primary.members');
    assert.strictEqual(engine.state.sceneId, 'poland_primary.access');
    assert.strictEqual(qualities.primary_franchise_code, 2);
    assert.strictEqual(qualities.presidential_candidate, 'Undecided');

    choose('poland_primary.cross_current');
    assert.strictEqual(engine.state.sceneId, 'poland_primary.campaign');
    assert.strictEqual(qualities.primary_access_code, 2);
    assert.strictEqual(qualities.presidential_candidate, 'Undecided');

    choose('poland_primary.issues');
    assert.strictEqual(engine.state.sceneId, 'poland_primary.result');
    assert.strictEqual(qualities.primary_campaign_code, 3);
    assert.strictEqual(qualities.primary_active, 0);

    const candidates = [
      {
        name: 'Robert Biedroń',
        eligible: 'primary_biedron_eligible',
        weight: 'primary_biedron_weight',
      },
      {
        name: 'Adrian Zandberg',
        eligible: 'primary_zandberg_eligible',
        weight: 'primary_zandberg_weight',
      },
      {
        name: 'Agnieszka Dziemianowicz-Bąk',
        eligible: 'primary_adb_eligible',
        weight: 'primary_adb_weight',
      },
      {
        name: 'Anna-Maria Żukowska',
        eligible: 'primary_zukowska_eligible',
        weight: 'primary_zukowska_weight',
      },
      {
        name: 'Katarzyna Kotula',
        eligible: 'primary_kotula_eligible',
        weight: 'primary_kotula_weight',
      },
      {
        name: 'Magdalena Biejat',
        eligible: 'primary_biejat_eligible',
        weight: 'primary_biejat_weight',
      },
    ];
    const eligible = candidates.filter(function(candidate) {
      return qualities[candidate.eligible] === 1;
    });

    assert.strictEqual(qualities.primary_biedron_eligible, 1);
    assert.strictEqual(qualities.primary_zandberg_eligible, 1);
    assert.strictEqual(
      qualities.primary_adb_eligible,
      1,
      'Women-led congress preparation did not open ADB candidacy'
    );
    assert(eligible.length >= 3, 'Prepared primary has too narrow a field');
    candidates.forEach(function(candidate) {
      const expectedPositive = qualities[candidate.eligible] === 1;
      assert.strictEqual(
        qualities[candidate.weight] > 0,
        expectedPositive,
        candidate.name + ' weight disagrees with eligibility'
      );
    });

    const weightSum = candidates.reduce(function(total, candidate) {
      return total + qualities[candidate.weight];
    }, 0);
    assert.strictEqual(qualities.primary_total_weight, weightSum);
    assert(qualities.primary_total_weight > 0);
    assert(qualities.primary_random_roll >= 0);
    assert(qualities.primary_random_roll < qualities.primary_total_weight);
    const tallySum = candidates.reduce(function(total, candidate) {
      return total + (
        qualities[candidate.eligible] === 1
          ? qualities[
            'primary_' + candidate.weight
              .replace('primary_', '')
              .replace('_weight', '') + '_tally'
          ]
          : 0
      );
    }, 0);
    assert.strictEqual(qualities.primary_total_votes, tallySum);
    assert.strictEqual(
      qualities.primary_total_votes,
      qualities.primary_turnout,
      'The primary count created or lost ballots'
    );
    assert(
      eligible.some(function(candidate) {
        return candidate.name === qualities.primary_winner;
      }),
      'Primary selected an ineligible winner: ' + qualities.primary_winner
    );
    assert.strictEqual(
      qualities.presidential_candidate,
      qualities.primary_winner
    );
    assert.notStrictEqual(qualities.primary_runner_up, qualities.primary_winner);
    assert(Number.isFinite(qualities.primary_winner_share));
    assert(Number.isFinite(qualities.primary_runner_share));
    assert(qualities.resources >= 0);

    primaryWinners.add(qualities.primary_winner);
    return qualities.primary_winner;
  }

  function testStagedPrimaryCorpus() {
    const repeatSeed = 'prepared-primary-repeat';
    const firstWinner = runPreparedPrimary(repeatSeed);
    const repeatedWinner = runPreparedPrimary(repeatSeed);
    assert.strictEqual(
      repeatedWinner,
      firstWinner,
      'Dendry seed did not reproduce the primary result'
    );

    for (let index = 0; index < 24; index += 1) {
      runPreparedPrimary('prepared-primary-corpus-' + index);
    }
    assert(
      primaryWinners.size >= 2,
      'Seeded primary corpus never produced a varied winner'
    );
    assert(
      !(primaryWinners.size === 1 &&
        primaryWinners.has('Agnieszka Dziemianowicz-Bąk')),
      'Open primary still assigns ADB by default'
    );
  }

  function drawSenateDocket(seedPrefix) {
    for (let attempt = 0; attempt < 32; attempt += 1) {
      startStandard(seedPrefix + '-' + attempt);
      const parliamentCards = [];

      while (engine.state.currentHands.poland_hub.length < 3) {
        parliamentCards.push(drawFromDeck('poland_party_deck'));
      }

      const docket = parliamentCards.find(function(card) {
        return card.id === 'poland_senate_docket';
      });
      if (docket) {
        return docket;
      }
    }

    assert.fail(
      'A deterministic 32-seed corpus never drew the Senate docket card'
    );
  }

  function testSenateDocketCard() {
    const senateCard = game.scenes.poland_senate_docket;
    assert(senateCard, 'Missing native Senate docket card');
    assert.strictEqual(senateCard.isCard, true);
    assert(
      (senateCard.tags || []).includes('poland_party_card'),
      'Senate docket is not in the consolidated Party deck'
    );

    const card = drawSenateDocket('senate-working-majority');
    const qualities = engine.state.qualities;
    const previousActions = qualities.leadership_actions_taken;
    const previousNeglect = qualities.neglected_months;

    engine.playCard(card.id);
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_senate.ordinary_bill');
    assert.strictEqual(qualities.month_actions, 1);
    assert.strictEqual(qualities.senate_docket_ready, 1);
    assert.strictEqual(qualities.poland_senate_docket_timer, 3);
    assert.strictEqual(qualities.senate_majority_threshold, 51);
    assert.strictEqual(qualities.senate_opposition_seats, 52);
    assert.strictEqual(qualities.senate_working_votes, 51);
    assert.strictEqual(qualities.senate_left_is_pivotal, 1);

    choose('poland_senate.ordinary_common_amendment');
    assert.strictEqual(qualities.senate_cohesion, 57);
    assert.strictEqual(qualities.senate_left_leverage, 22);
    assert.strictEqual(qualities.senate_amendment_credit, 1);
    assert.strictEqual(
      qualities.senate_last_vote,
      'A common opposition amendment passed'
    );
    choose('poland_card_finish');

    assert.strictEqual(engine.state.sceneId, 'poland_events.candidate');
    assert.strictEqual(
      qualities.leadership_actions_taken,
      previousActions + 1
    );
    assert.strictEqual(qualities.neglected_months, previousNeglect);
    assert.strictEqual(qualities.month_actions, 0);
    assert.strictEqual(qualities.poland_senate_docket_timer, 2);

    // A docket used during its cooldown must still offer the documented
    // no-cost minority-note fallback and consume a normal monthly action.
    const coolingCard = drawSenateDocket('senate-cooldown-fallback');
    const coolingQualities = engine.state.qualities;
    coolingQualities.poland_senate_docket_timer = 2;
    const leverageBeforeFallback = coolingQualities.senate_left_leverage;

    engine.playCard(coolingCard.id);
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_senate.ordinary_bill');
    assert.strictEqual(coolingQualities.senate_docket_ready, 0);

    const choices = currentChoices();
    [
      'poland_senate.ordinary_left_amendment',
      'poland_senate.ordinary_common_amendment',
      'poland_senate.ordinary_rejection',
    ].forEach(function(sceneId) {
      const choice = choices.find(function(candidate) {
        return candidate.id === sceneId;
      });
      assert(choice, 'Missing Senate ordinary-bill choice: ' + sceneId);
      assert.strictEqual(
        choice.canChoose,
        false,
        'Senate cooldown allowed substantive negotiation: ' + sceneId
      );
    });
    const fallback = choices.find(function(candidate) {
      return candidate.id === 'poland_senate.ordinary_fallback';
    });
    assert(fallback && fallback.canChoose, 'Senate fallback is unavailable');

    choose('poland_senate.ordinary_fallback');
    assert.strictEqual(
      coolingQualities.senate_left_leverage,
      leverageBeforeFallback + 1
    );
    choose('poland_card_finish');
    assert.strictEqual(engine.state.sceneId, 'poland_events.candidate');
    assert.strictEqual(coolingQualities.poland_senate_docket_timer, 1);

    startStandard('senate-role-aware-ko-government');
    const koGovernment = engine.state.qualities;
    koGovernment.government_party = 'ko';
    koGovernment.left_in_government = 0;
    koGovernment.ministry_ko_in_cabinet = 1;
    koGovernment.ministry_psl_in_cabinet = 1;
    koGovernment.ministry_p2050_in_cabinet = 0;
    koGovernment.ko_relation = 40;
    koGovernment.psl_relation = 25;
    koGovernment.p2050_relation = 25;
    koGovernment.public_trust = 43;
    engine.goToScene('poland_senate.ordinary_bill');
    assert.strictEqual(koGovernment.senate_government_seats, 46);
    assert.strictEqual(koGovernment.senate_opposition_seats, 54);
    assert.strictEqual(koGovernment.senate_coordinated_seats, 2);
    assert.strictEqual(
      koGovernment.senate_working_votes,
      1,
      'Relations with cabinet parties penalized senators outside the working bloc'
    );
  }

  function testSenateBudgetStages() {
    startStandard('senate-2019-budget-stage');
    const firstBudget = engine.state.qualities;
    firstBudget.budget_2019_ratified = 1;
    firstBudget.budget_2019_backing = 68;
    firstBudget.budget_2019_vetoes = 0;
    engine.goToScene('poland_senate.budget_2019');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_senate.budget_2019');
    assert(
      currentChoices().every(function(choice) {
        return !choice.id.toLowerCase().includes('reject');
      }),
      'The Senate was incorrectly allowed to reject a budget bill'
    );
    choose('poland_senate.budget_2019_common');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_senate.budget_2019_common',
      'The first Senate budget outcome skipped its reaction beat'
    );
    choose('poland_senate.budget_2019_return_vote');
    choose('poland_senate.budget_2019_complete');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(firstBudget.senate_budget_2019_done, 1);
    assert.strictEqual(
      firstBudget.senate_budget_2019_result,
      'Common costed amendments passed the Senate but was removed by the Sejm'
    );
    assert.strictEqual(firstBudget.senate_left_leverage, 8);
    assert.strictEqual(firstBudget.senate_amendment_credit, 3);

    startStandard('senate-2020-budget-stage');
    const pandemicBudget = engine.state.qualities;
    pandemicBudget.budget_package_code = 1;
    pandemicBudget.budget_2020_ratified = 1;
    engine.goToScene('poland_senate.budget_2020');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_senate.budget_2020');
    assert(
      currentChoices().every(function(choice) {
        return !choice.id.toLowerCase().includes('reject');
      }),
      'The Senate was incorrectly allowed to reject the pandemic budget'
    );
    choose('poland_senate.budget_2020_social');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_senate.budget_2020_social',
      'The pandemic Senate outcome skipped its reaction beat'
    );
    choose('poland_senate.budget_2020_return_vote');
    choose('poland_senate.budget_2020_complete');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(pandemicBudget.senate_budget_2020_done, 1);
    assert.strictEqual(
      pandemicBudget.senate_budget_2020_result,
      'Social-shield amendments passed the Senate but was removed by the Sejm'
    );
    assert.strictEqual(pandemicBudget.senate_left_leverage, 8);
    assert.strictEqual(pandemicBudget.senate_amendment_credit, 3);
  }

  function testSenateElectionAndGovernmentCorrections() {
    startStandard('senate-pact-event');
    let qualities = engine.state.qualities;
    qualities.year = 2023;
    qualities.month = 8;
    qualities.senate_pact_2023_done = 0;
    engine.goToScene('poland_events_2023_2024.august_senate_pact');
    choose('poland_events_2023_2024.senate_three_lists_pact');
    assert.strictEqual(qualities.senate_pact_coordinated, 1);
    assert.strictEqual(
      qualities.senate_pact_strategy,
      'Senate Pact with Lewica as a full partner'
    );
    assert.strictEqual(qualities.senate_left_pact_mode, 'full');

    startStandard('weak-left-bilateral-senate-pact');
    const weakLeft = engine.state.qualities;
    weakLeft.year = 2023;
    weakLeft.month = 8;
    weakLeft.left_poll = 4.8;
    weakLeft.left_projected_seats = 12;
    weakLeft.senate_pact_2023_done = 0;
    engine.goToScene('poland_events_2023_2024.august_senate_pact');
    assert(
      currentChoices().some(function(choice) {
        return choice.id === 'poland_events_2023_2024.senate_weak_run';
      }),
      'A weak Lewica was not offered a response to the bilateral pact'
    );
    assert(
      currentChoices().every(function(choice) {
        return choice.id !==
          'poland_events_2023_2024.senate_three_lists_pact';
      }),
      'A weak Lewica was still treated as an automatic full pact partner'
    );
    choose('poland_events_2023_2024.senate_weak_run');
    assert.strictEqual(weakLeft.senate_pact_coordinated, 1);
    assert.strictEqual(weakLeft.senate_left_pact_mode, 'outside');
    assert.strictEqual(
      weakLeft.senate_pact_strategy,
      'KO–Third Way Senate Pact with a separate Lewica slate'
    );

    engine.beginGame(['senate-standalone-result-route']);
    choose('root.formation_game');
    choose('root.formation_standard');
    assert.strictEqual(engine.state.sceneId, 'poland_election.results_2023');
    choose('poland_election.summary_2023');
    choose('poland_election.senate_results_2023');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_election.senate_results_2023'
    );
    assert(currentChoices().some(function(choice) {
      return choice.id === 'poland_election.coalitions_2023';
    }));

    startStandard('sejm-threshold-defeat');
    const defeatedLeft = engine.state.qualities;
    defeatedLeft.left_vote_intent = 0.1;
    defeatedLeft.party_unity = 10;
    defeatedLeft.organised_left_splits = 5;
    defeatedLeft.barons_party_formed = 1;
    defeatedLeft.spring_party_formed = 1;
    defeatedLeft.labor_party_formed = 1;
    defeatedLeft.progressives_party_formed = 1;
    defeatedLeft.razem_party_formed = 1;
    defeatedLeft.sld_breakaway_vote_intent = 0.1;
    defeatedLeft.spring_breakaway_vote_intent = 0.1;
    defeatedLeft.labor_left_vote_intent = 0.1;
    defeatedLeft.young_left_vote_intent = 0.1;
    defeatedLeft.razem_vote_intent = 0.1;
    defeatedLeft.spring_list_committee = 'spring_breakaway';
    defeatedLeft.labor_list_committee = 'labor_left';
    defeatedLeft.progressives_list_committee = 'young_left';
    defeatedLeft.razem_list_committee = 'razem';
    defeatedLeft.left_in_government = 1;
    defeatedLeft.government_party = 'pis';
    defeatedLeft.government_name = 'Third Morawiecki Cabinet';
    defeatedLeft.election_2023_certified = 0;
    defeatedLeft.senate_election_2023_certified = 0;
    engine.goToScene('poland_government_formation.campaign_entry');
    assert.strictEqual(defeatedLeft.left_seats, 0);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_election.sejm_threshold_defeat'],
      'A Left list below the Sejm threshold could continue the campaign'
    );
    choose('poland_election.sejm_threshold_defeat');
    assert.strictEqual(engine.isGameOver(), true);
    assert.strictEqual(defeatedLeft.ending_exit_type, 'Voted out');
    assert(defeatedLeft.ending_achievements.length > 20);
    assert(defeatedLeft.ending_failures.includes('Sejm threshold'));
    assert(defeatedLeft.ending_future_path.includes('2030'));
    assert.strictEqual(defeatedLeft.ending_electoral_organisations, 6);
    assert.strictEqual(defeatedLeft.ending_fragmentation_lists, 6);
    assert(defeatedLeft.ending_2015_comparison.includes('7.55%'));
    assert(defeatedLeft.ending_left_organisations.includes('Razem'));
    assert(defeatedLeft.ending_chamber_result.includes('PiS'));
    assert(defeatedLeft.ending_chamber_result.includes('KO'));
    assert(defeatedLeft.ending_next_government.includes('cabinet') ||
      defeatedLeft.ending_next_government.includes('government'));
    assert(defeatedLeft.ending_outgoing_cabinet.includes(
      'electoral annexation'
    ));
    const defeatText = contentText(engine.state.currentContent);
    assert(defeatText.includes('Several defeats wearing the same colour'));
    assert(defeatText.includes('The Sejm that replaces you'));
    assert(!defeatText.includes('player-controlled list'));

    startStandard('snap-sejm-threshold-defeat');
    const defeatedSnapLeft = engine.state.qualities;
    defeatedSnapLeft.left_vote_intent = 0.1;
    engine.goToScene('poland_events_2026.snap_result_2026');
    assert.strictEqual(defeatedSnapLeft.left_seats, 0);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_election.sejm_threshold_defeat'],
      'A snap election that removed the Left from the Sejm could continue'
    );
    choose('poland_election.sejm_threshold_defeat');
    assert.strictEqual(engine.isGameOver(), true);
    assert.strictEqual(defeatedSnapLeft.ending_exit_type, 'Voted out');
    assert(defeatedSnapLeft.ending_future_path.includes('2030'));

    const certifySenate = function(coordinated) {
      startStandard('senate-fptp-comparison');
      const election = engine.state.qualities;
      election.pis_vote_intent = 35.4;
      election.ko_vote_intent = 30.7;
      election.p2050_vote_intent = 7.2;
      election.psl_vote_intent = 7.2;
      election.left_vote_intent = 8.6;
      election.konf_vote_intent = 7.2;
      election.other_vote_intent = 3.7;
      election.p2050_emerged = 1;
      election.third_way_joint_list = 1;
      election.third_way_split = 0;
      election.election_2023_certified = 0;
      election.senate_election_2023_certified = 0;
      election.senate_pact_2023_done = 1;
      election.senate_pact_coordinated = coordinated ? 1 : 0;
      election.senate_pact_strength = coordinated ? 78 : 18;
      election.senate_pact_strategy = coordinated
        ? 'Senate Pact with three Sejm lists'
        : 'Three separate democratic Senate slates';
      election.senate_left_pact_mode = 'full';
      engine.goToScene('poland_government_formation.campaign_entry');
      checkNumbers();
      assert.strictEqual(election.senate_election_2023_certified, 1);
      assert.strictEqual(
        election.senate_pis_seats + election.senate_konf_seats +
          election.senate_ko_seats + election.senate_p2050_seats +
          election.senate_psl_seats + election.senate_left_seats +
          election.senate_independent_seats,
        100,
        'The district count did not award exactly 100 Senate seats'
      );
      return election.senate_democratic_seats;
    };

    const pactSeats = certifySenate(true);
    const separateSeats = certifySenate(false);
    assert(
      pactSeats > separateSeats,
      'Coordinating one FPTP candidate did not outperform three split slates'
    );

    startStandard('weak-left-stands-down-from-senate-pact');
    const bilateralPact = engine.state.qualities;
    bilateralPact.pis_vote_intent = 35.4;
    bilateralPact.ko_vote_intent = 35;
    bilateralPact.p2050_vote_intent = 8;
    bilateralPact.psl_vote_intent = 7;
    bilateralPact.left_vote_intent = 4;
    bilateralPact.konf_vote_intent = 7;
    bilateralPact.other_vote_intent = 3.6;
    bilateralPact.election_2023_certified = 0;
    bilateralPact.senate_election_2023_certified = 0;
    bilateralPact.senate_pact_2023_done = 1;
    bilateralPact.senate_pact_coordinated = 1;
    bilateralPact.senate_pact_strength = 78;
    bilateralPact.senate_left_pact_mode = 'stand_down';
    bilateralPact.senate_pact_strategy =
      'KO–Third Way Senate Pact; Lewica stands down';
    engine.goToScene('poland_government_formation.campaign_entry');
    assert.strictEqual(
      bilateralPact.senate_left_seats,
      0,
      'Lewica received pact nominations after standing down'
    );

    const openGovernmentSenate = function(seed, rightSeats, sejmYes) {
      startStandard(seed);
      const budget = engine.state.qualities;
      budget.left_in_government = 1;
      budget.government_has_confidence = 1;
      budget.caretaker_government = 0;
      budget.government_party = 'ko';
      budget.coalition_status = 'Democratic coalition';
      budget.annual_budget_left_cabinet_authority = 1;
      budget.annual_budget_passed = 1;
      budget.annual_budget_senate_stage_done = 0;
      budget.annual_budget_package_code = 1;
      budget.annual_budget_yes = sejmYes;
      budget.annual_budget_no = 460 - sejmYes;
      budget.annual_budget_abstain = 0;
      budget.annual_budget_present = 460;
      budget.senate_total = 100;
      budget.senate_pis_seats = rightSeats;
      budget.senate_konf_seats = 0;
      budget.senate_ko_seats = 100 - rightSeats;
      budget.senate_p2050_seats = 0;
      budget.senate_psl_seats = 0;
      budget.senate_left_seats = 0;
      budget.senate_independent_seats = 0;
      engine.goToScene('poland_budget_2023_2026.senate_budget_review');
      checkNumbers();
      return budget;
    };

    qualities = openGovernmentSenate(
      'friendly-government-senate',
      40,
      235
    );
    assert.strictEqual(
      qualities.annual_budget_senate_corrections_pending,
      0
    );
    choose('poland_budget_2023_2026.senate_budget_unchanged');
    assert.strictEqual(qualities.annual_budget_senate_stage_done, 1);

    qualities = openGovernmentSenate(
      'hostile-government-senate-adheres',
      55,
      235
    );
    assert.strictEqual(
      qualities.annual_budget_senate_corrections_pending,
      1
    );
    choose('poland_budget_2023_2026.senate_budget_accept');
    assert.strictEqual(
      qualities.annual_budget_senate_corrections_accepted,
      1
    );
    assert.strictEqual(qualities.annual_budget_senate_stage_done, 1);

    qualities = openGovernmentSenate(
      'hostile-government-senate-deadlock',
      55,
      234
    );
    choose('poland_budget_2023_2026.senate_budget_override');
    assert.strictEqual(
      qualities.annual_budget_senate_override_passed,
      0
    );
    assert.strictEqual(
      qualities.annual_budget_senate_corrections_accepted,
      1
    );
    assert.strictEqual(qualities.coalition_break_threat, 1);

    startStandard('budget-senate-counts-only-cabinet-parties');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2024,
      government_party: 'ko',
      left_in_government: 1,
      ministry_ko_in_cabinet: 1,
      ministry_psl_in_cabinet: 0,
      ministry_p2050_in_cabinet: 0,
      government_has_confidence: 1,
      caretaker_government: 0,
      annual_budget_left_cabinet_authority: 1,
      annual_budget_passed: 1,
      annual_budget_senate_stage_done: 0,
      annual_budget_package_code: 2,
      annual_budget_yes: 235,
      annual_budget_no: 225,
      annual_budget_abstain: 0,
      annual_budget_present: 460,
      senate_total: 100,
      senate_pis_seats: 42,
      senate_konf_seats: 0,
      senate_ko_seats: 41,
      senate_p2050_seats: 10,
      senate_psl_seats: 5,
      senate_left_seats: 2,
      senate_independent_seats: 0,
      senate_cohesion: 100,
    });
    engine.goToScene('poland_budget_2023_2026.senate_budget_review');
    assert.strictEqual(
      qualities.annual_budget_senate_government_votes,
      43,
      'The budget whip treated opposition democratic senators as government votes'
    );
    assert.strictEqual(qualities.annual_budget_senate_hostile_votes, 57);
    assert.strictEqual(qualities.annual_budget_senate_corrections_pending, 1);

    startStandard('hung-snap-senate-resolves-marshal');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      continuous_campaign: 1,
      third_way_split: 1,
      senate_pact_coordinated: 0,
      pis_vote_intent: 35,
      ko_vote_intent: 30,
      left_vote_intent: 10,
      p2050_vote_intent: 5,
      psl_vote_intent: 5,
      konf_vote_intent: 7,
      other_vote_intent: 8,
    });
    engine.goToScene('poland_events_2026.snap_result_2026');
    assert.strictEqual(qualities.senate_control, 'Hung Senate');
    assert.strictEqual(
      qualities.senate_marshal,
      'Vacant — Senate election pending'
    );
    assert.strictEqual(qualities.office_incompatibility_pending, 1);
    assert.strictEqual(
      qualities.office_incompatibility_kind,
      'Senate Marshal'
    );
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2026.snap_resolve_senate_marshal']
    );
    choose('poland_events_2026.snap_resolve_senate_marshal');
    assert.strictEqual(qualities.office_incompatibility_pending, 0);
    assert.strictEqual(qualities.office_incompatibility_resolved, 1);
    assert(!qualities.senate_marshal.includes('pending'));
    assert(!qualities.senate_marshal.includes('unresolved'));
    choose('poland_office_authority.accept');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2026.snap_palace_pick'
    );
    assert.strictEqual(qualities.snap_senate_marshal_return, 0);
  }

  function assertPollingModel(options) {
    const qualities = engine.state.qualities;
    const requireNormalizedHeadline =
      !options || options.requireNormalizedHeadline !== false;
    const parties = ['left', 'pis', 'ko', 'psl', 'konf', 'p2050', 'other'];
    const intentTotal = parties.reduce(function(total, party) {
      return total + qualities[party + '_vote_intent'];
    }, 0);
    const headlineTotal = parties.reduce(function(total, party) {
      return total + qualities[party + '_poll'];
    }, 0);
    const projectedTotal = parties.reduce(function(total, party) {
      return total + qualities[party + '_projected_seats'];
    }, 0);

    assert(
      Math.abs(intentTotal - 100) <= 0.12,
      'Likely-voter intentions do not sum to 100: ' + intentTotal
    );
    if (requireNormalizedHeadline) {
      assert(
        Math.abs(headlineTotal - 100) < 0.000001,
        'Published poll does not sum to 100: ' + headlineTotal + ' (' +
          parties.map(function(party) {
            return party + '=' + qualities[party + '_poll'] +
              '/i' + qualities[party + '_vote_intent'] +
              '/c' + qualities['poll_calibration_' + party] +
              '/m' + qualities[party + '_poll_momentum'];
          }).join(', ') + ')'
      );
    }
    assert.strictEqual(
      projectedTotal,
      460,
      'National d’Hondt projection does not allocate all Sejm seats'
    );
    assert.strictEqual(
      qualities.poll_last_updated,
      qualities.date_label,
      'Polling model was not rebuilt at the monthly boundary'
    );

    const nationwideBlocs = [
      'metropolitan_liberals',
      'liberal_professionals',
      'public_service_families',
      'industrial_logistics',
      'provincial_welfare',
      'rural_localists',
      'older_welfare_households',
      'anti_establishment_youth',
    ];
    const blocSizeTotal = nationwideBlocs.reduce(function(total, bloc) {
      return total + qualities[bloc + '_size'];
    }, 0);
    assert.strictEqual(
      blocSizeTotal,
      100,
      'Nationwide electorate blocs do not conserve population size'
    );
    nationwideBlocs.forEach(function(bloc) {
      const blocShareTotal = parties.reduce(function(total, party) {
        return total + qualities[bloc + '_' + party];
      }, 0);
      assert(
        Math.abs(blocShareTotal - 100) < 0.000001,
        bloc + ' party shares do not sum to 100: ' + blocShareTotal
      );
      parties.forEach(function(party) {
        assert(
          Number.isFinite(qualities[bloc + '_' + party]),
          'Missing ' + party + ' competition inside ' + bloc
        );
      });
      if (!qualities.p2050_emerged) {
        assert.strictEqual(
          qualities[bloc + '_p2050'],
          0,
          'Poland 2050 competed before it existed in ' + bloc
        );
      }
    });
  }

  function testGovernmentCrisisConsequences() {
    const governmentCrisisPoll = function(scenes, governmentParty) {
      startStandard('government-crisis-poll');
      const crisisQualities = engine.state.qualities;
      crisisQualities.government_party = governmentParty || 'pis';
      const governmentPollId = crisisQualities.government_party === 'lewica'
        ? 'left'
        : (['independent', 'other'].includes(
          crisisQualities.government_party
        ) ? 'other' : crisisQualities.government_party);
      if (governmentPollId === 'left') {
        crisisQualities.left_in_government = 1;
      }
      scenes.forEach(function(sceneId) {
        engine.goToScene(sceneId);
      });
      const beforePoll = {
        momentum: crisisQualities[governmentPollId + '_poll_momentum'],
        dissent: crisisQualities.government_coalition_dissent,
        cohesion: crisisQualities.united_right_cohesion,
      };
      crisisQualities.year = 2020;
      crisisQualities.month = 12;
      crisisQualities.month_name = 'December';
      crisisQualities.date_label = 'December 2020';
      crisisQualities.poll_state_month_key = -1;
      engine.goToScene('poland_polling');
      checkNumbers();
      return {
        governmentPoll: crisisQualities[governmentPollId + '_poll'],
        momentum: beforePoll.momentum,
        dissent: beforePoll.dissent,
        cohesion: beforePoll.cohesion,
      };
    };
    const noGovernmentCrisis = governmentCrisisPoll([]);
    const pandemicCrisis = governmentCrisisPoll([
      'poland_events.covid',
      'poland_events.postal',
      'poland_events.shield',
    ]);
    const abortionCrisis = governmentCrisisPoll([
      'poland_events.abortion',
      'poland_events.strike',
    ]);
    const combined2020Crisis = governmentCrisisPoll([
      'poland_events.covid',
      'poland_events.postal',
      'poland_events.shield',
      'poland_events.abortion',
      'poland_events.strike',
    ]);
    assert(
      noGovernmentCrisis.governmentPoll - pandemicCrisis.governmentPoll >= 4,
      'The pandemic response did not cost PiS at least four poll points'
    );
    assert(
      noGovernmentCrisis.governmentPoll - abortionCrisis.governmentPoll >= 4,
      'The abortion ruling and Women\'s Strike did not cost PiS four points'
    );
    assert.strictEqual(combined2020Crisis.momentum, -15.5);
    assert.strictEqual(
      combined2020Crisis.dissent - noGovernmentCrisis.dissent,
      32,
      'The 2020 governing crises did not destabilise the cabinet'
    );
    assert.strictEqual(
      noGovernmentCrisis.cohesion - combined2020Crisis.cohesion,
      28,
      'The 2020 governing crises did not weaken United Right cohesion'
    );
    assert(
      noGovernmentCrisis.governmentPoll -
        combined2020Crisis.governmentPoll >= 8,
      'The combined 2020 crisis record did not make a drastic hit to PiS'
    );

    const noKoCrisis = governmentCrisisPoll([], 'ko');
    const koPandemicCrisis = governmentCrisisPoll([
      'poland_events.covid',
      'poland_events.postal',
      'poland_events.shield',
    ], 'ko');
    assert.strictEqual(koPandemicCrisis.momentum, -7.5);
    assert(
      noKoCrisis.governmentPoll - koPandemicCrisis.governmentPoll >= 4,
      'The pandemic response did not follow a KO-led government'
    );

    const noLewicaCrisis = governmentCrisisPoll([], 'lewica');
    const lewicaAbortionCrisis = governmentCrisisPoll([
      'poland_events.abortion',
      'poland_events.strike',
    ], 'lewica');
    assert.strictEqual(lewicaAbortionCrisis.momentum, -8);
    assert(
      noLewicaCrisis.governmentPoll -
        lewicaAbortionCrisis.governmentPoll >= 4,
      'The abortion crisis did not follow a Lewica-led government'
    );
    [
      'pis', 'ko', 'psl', 'p2050', 'konf', 'lewica', 'independent',
    ].forEach(function(governmentParty) {
      assert.strictEqual(
        governmentCrisisPoll([
          'poland_events.abortion',
        ], governmentParty).momentum,
        -5,
        'The abortion crisis missed the governing party: ' + governmentParty
      );
    });
  }

  function testPollingModelInvariants() {
    startStandard('polling-model-invariants');
    const qualities = engine.state.qualities;
    qualities.year = 2020;
    qualities.month = 2;
    qualities.month_name = 'February';
    qualities.date_label = 'February 2020';
    qualities.left_poll += 2;
    qualities.young_support += 5;

    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_monthly_briefing');
    assertPollingModel();
    assert.strictEqual(qualities.poll_model_initialized, 1);
    assert(
      qualities.left_poll_momentum > 1.5,
      'First model rebuild erased authored polling momentum'
    );
    const firstMonthlyModel = [
      'left_vote_intent',
      'pis_vote_intent',
      'ko_vote_intent',
      'psl_vote_intent',
      'konf_vote_intent',
      'p2050_vote_intent',
      'left_projected_seats',
      'pis_projected_seats',
      'ko_projected_seats',
      'psl_projected_seats',
      'konf_projected_seats',
      'p2050_projected_seats',
      'poll_danger_months',
    ].reduce(function(snapshot, id) {
      snapshot[id] = qualities[id];
      return snapshot;
    }, {});
    const firstMonthKey = qualities.poll_state_month_key;
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(qualities.poll_state_month_key, firstMonthKey);
    Object.keys(firstMonthlyModel).forEach(function(id) {
      assert.strictEqual(
        qualities[id],
        firstMonthlyModel[id],
        'Polling changed twice in one calendar month: ' + id
      );
    });

    const budgetPoll = function(crisis) {
      startStandard('budget-crisis-poll-penalty');
      const budgetQualities = engine.state.qualities;
      Object.assign(budgetQualities, {
        year: 2020,
        month: 2,
        month_name: 'February',
        date_label: 'February 2020',
        annual_budget_year: 2019,
        annual_budget_done_2019: 1,
        annual_budget_passed_2019: crisis ? 0 : 1,
        budget_deadline_active: crisis ? 1 : 0,
        government_party: 'pis',
        poll_state_month_key: -1,
      });
      engine.goToScene('poland_polling');
      checkNumbers();
      return budgetQualities.pis_poll;
    };
    const enactedBudgetPiS = budgetPoll(false);
    const failedBudgetPiS = budgetPoll(true);
    assert(
      enactedBudgetPiS - failedBudgetPiS >= 7,
      'An active Article 225 crisis did not make a drastic hit to PiS polling'
    );

    testGovernmentCrisisConsequences();

    startStandard('third-way-list-threshold');
    const thirdWay = engine.state.qualities;
    thirdWay.year = 2023;
    thirdWay.month = 10;
    thirdWay.date_label = 'October 2023';
    thirdWay.p2050_emerged = 1;
    thirdWay.third_way_active = 1;
    thirdWay.third_way_2023_done = 1;
    thirdWay.third_way_split = 0;
    thirdWay.poll_state_month_key = -1;
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(thirdWay.third_way_joint_list, 1);
    assert.strictEqual(thirdWay.third_way_threshold, 8);
    assert.strictEqual(
      thirdWay.third_way_projected_seats,
      thirdWay.psl_projected_seats +
        thirdWay.p2050_projected_seats
    );
    thirdWay.month = 11;
    thirdWay.date_label = 'November 2023';
    thirdWay.third_way_split = 1;
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(thirdWay.third_way_joint_list, 0);
    assert.strictEqual(thirdWay.third_way_threshold, 0);
    assert.strictEqual(thirdWay.third_way_projected_seats, 0);
  }

  function testNationwideOpeningCalibration() {
    startStandard('nationwide-opening-calibration');
    const qualities = engine.state.qualities;
    const economicDefaults = {
      left: 52,
      pis: 31,
      ko: 60,
      psl: 49,
      konf: 86,
      p2050: 55,
    };
    const culturalDefaults = {
      left: 52.3,
      pis: 86,
      ko: 43,
      psl: 68,
      konf: 91,
      p2050: 51,
    };
    Object.keys(economicDefaults).forEach(function(party) {
      qualities[party + '_economic_position'] = economicDefaults[party];
      qualities[party + '_cultural_position'] = culturalDefaults[party];
    });
    qualities.national_turnout_climate = 61;
    qualities.economic_issue_salience = 38;
    qualities.cultural_issue_salience = 24;
    qualities.institutional_issue_salience = 42;
    qualities.nationwide_poll_model_initialized = 0;

    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assertPollingModel();
    assert.strictEqual(qualities.nationwide_poll_model_initialized, 1);
    assert.strictEqual(qualities.nationwide_poll_model_era, '2019');
    assert(
      Math.abs(qualities.left_vote_intent - 12.6) < 0.000001,
      'Opening calibration drifted: ' + JSON.stringify({
        left: qualities.left_vote_intent,
        pis: qualities.pis_vote_intent,
        ko: qualities.ko_vote_intent,
        psl: qualities.psl_vote_intent,
        konf: qualities.konf_vote_intent,
        p2050: qualities.p2050_vote_intent,
        other: qualities.other_vote_intent,
        issueBaseline: qualities.left_issue_reception_baseline,
      })
    );
    assert(Math.abs(qualities.pis_vote_intent - 43.6) < 0.000001);
    assert(Math.abs(qualities.ko_vote_intent - 27.4) < 0.000001);
    assert(Math.abs(qualities.psl_vote_intent - 8.6) < 0.000001);
    assert(Math.abs(qualities.konf_vote_intent - 6.8) < 0.000001);
    assert.strictEqual(qualities.p2050_vote_intent, 0);
    assert(Math.abs(qualities.other_vote_intent - 1.0) < 0.000001);
  }

  function testPollingGovernmentOwnership() {
    startStandard('polling-government-owner-baseline');
    let qualities = engine.state.qualities;
    qualities.year = 2024;
    qualities.month = 1;
    qualities.date_label = 'January 2024';
    qualities.government_party = 'ko';
    qualities.left_in_government = 0;
    qualities.government_delivery = 0;
    qualities.poll_state_month_key = -1;
    engine.goToScene('poland_polling');
    const baselinePis = qualities.pis_vote_intent;
    const baselineKo = qualities.ko_vote_intent;

    startStandard('polling-government-owner-delivery');
    qualities = engine.state.qualities;
    qualities.year = 2024;
    qualities.month = 1;
    qualities.date_label = 'January 2024';
    qualities.government_party = 'ko';
    qualities.left_in_government = 0;
    qualities.government_delivery = 30;
    qualities.poll_state_month_key = -1;
    engine.goToScene('poland_polling');
    assert(
      qualities.ko_vote_intent > baselineKo,
      'KO delivery did not benefit the party that owned the government'
    );
    assert(
      qualities.pis_vote_intent < baselinePis,
      'PiS still received the succeeding government\'s delivery credit'
    );

    const leftGovernmentPoll = function(delivery, kpoCredit) {
      startStandard('polling-left-government-credit');
      const leftQualities = engine.state.qualities;
      leftQualities.year = 2024;
      leftQualities.month = 1;
      leftQualities.date_label = 'January 2024';
      leftQualities.government_party = 'ko';
      leftQualities.left_in_government = 1;
      leftQualities.government_delivery = delivery;
      leftQualities.kpo_public_credit = kpoCredit;
      leftQualities.poll_state_month_key = -1;
      engine.goToScene('poland_polling');
      return leftQualities;
    };
    const voterBlocs = [
      'metropolitan_liberals',
      'liberal_professionals',
      'public_service_families',
      'industrial_logistics',
      'provincial_welfare',
      'rural_localists',
      'older_welfare_households',
      'anti_establishment_youth',
    ];
    const leftBaseline = leftGovernmentPoll(0, 0);
    const ordinaryDelivery = leftGovernmentPoll(3, 0);
    voterBlocs.forEach(function(bloc) {
      assert(
        ordinaryDelivery[bloc + '_left'] > leftBaseline[bloc + '_left'],
        'An ordinary government delivery did not move ' + bloc
      );
    });
    const ownedKpoMilestone = leftGovernmentPoll(3, 4);
    voterBlocs.forEach(function(bloc) {
      assert(
        ownedKpoMilestone[bloc + '_left'] > ordinaryDelivery[bloc + '_left'],
        'Owned KPO credit did not move ' + bloc
      );
    });
    assert(
      ownedKpoMilestone.left_vote_intent > ordinaryDelivery.left_vote_intent,
      'Owned KPO credit did not reach nationwide vote intent'
    );
  }

  function testEconomicAccountability() {
    const economicPoll = function(governmentParty, distressed, splitRight) {
      startStandard(
        'economic-accountability-' + governmentParty + '-' + splitRight
      );
      const qualities = engine.state.qualities;
      const governmentPollId = governmentParty === 'lewica'
        ? 'left'
        : governmentParty;
      qualities.year = 2024;
      qualities.month = 1;
      qualities.date_label = 'January 2024';
      qualities.government_party = governmentParty;
      qualities.left_in_government = governmentParty === 'lewica' ? 1 : 0;
      qualities.government_delivery = 0;
      qualities.inflation = distressed ? 15 : 3;
      qualities.unemployment = distressed ? 7 : 5;
      qualities.economic_growth = distressed ? 0 : 2;
      qualities.household_security = distressed ? 35 : 42;
      qualities.far_right_split = splitRight ? 1 : 0;
      qualities.poll_state_month_key = -1;
      engine.goToScene('poland_polling');
      checkNumbers();
      return {
        government: qualities[governmentPollId + '_vote_intent'],
        konf: qualities.konf_vote_intent,
        korona: qualities.korona_vote_intent,
        penalty: qualities.government_economic_poll_penalty,
        extremistBonus: qualities.economic_extremist_poll_bonus,
      };
    };

    ['pis', 'ko', 'lewica'].forEach(function(governmentParty) {
      const healthy = economicPoll(governmentParty, false, false);
      const distressed = economicPoll(governmentParty, true, false);
      assert(
        healthy.government - distressed.government >= 5,
        'Economic distress did not punish the government owner: ' +
          governmentParty
      );
    });

    const healthyKo = economicPoll('ko', false, false);
    const distressedKo = economicPoll('ko', true, false);
    assert(distressedKo.penalty >= 8);
    assert(distressedKo.extremistBonus >= 3);
    assert(
      distressedKo.konf - healthyKo.konf >= 2,
      'Inflation and recession did not produce an anti-system polling pulse'
    );

    const healthySplit = economicPoll('ko', false, true);
    const distressedSplit = economicPoll('ko', true, true);
    assert(distressedSplit.konf > healthySplit.konf);
    assert(
      distressedSplit.korona > healthySplit.korona,
      'The economic anger dividend did not reach the Korona splinter'
    );
  }

  function testRivalPartyAI() {
    startStandard('rival-party-ai');
    const qualities = engine.state.qualities;
    const openingPools = {
      pis: [9, 7],
      ko: [7, 5],
      psl: [5, 3],
      konf: [4, 3],
      p2050: [0, 4],
    };
    Object.keys(openingPools).forEach(function(party) {
      assert.strictEqual(
        qualities[party + '_org_resources'],
        openingPools[party][0]
      );
      assert.strictEqual(
        qualities[party + '_org_income'],
        openingPools[party][1]
      );
    });
    engine.goToScene('poland_party_ai');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assertPollingModel();
    assert.strictEqual(qualities.rival_ai_initialized, 1);
    assert.strictEqual(qualities.rival_ai_era, '2019');
    assert.strictEqual(qualities.rival_ai_tick, 1);
    assert.strictEqual(qualities.party_ai_last_updated, 'October 2019');
    assert(Array.isArray(qualities.rival_strategy_log));
    assert.strictEqual(qualities.rival_strategy_log.length, 1);
    assert(
      typeof qualities.rival_month_headline === 'string' &&
      qualities.rival_month_headline.length > 0
    );
    assert(
      typeof qualities.rival_coalition_signal === 'string' &&
      qualities.rival_coalition_signal.length > 0
    );

    const rivals = ['pis', 'ko', 'psl', 'konf', 'p2050'];
    let actedTotal = 0;
    rivals.forEach(function(party) {
      assert(Number.isFinite(qualities[party + '_org_resources']));
      assert(Number.isFinite(qualities[party + '_org_income']));
      assert(qualities[party + '_org_resources'] >= 0);
      assert(qualities[party + '_org_income'] >= 0);
      assert(qualities[party + '_ai_acted'] === 0 ||
        qualities[party + '_ai_acted'] === 1);
      assert(qualities[party + '_ai_last_spend'] >= 0);
      assert(qualities[party + '_ai_last_spend'] <= 2);
      if (qualities[party + '_ai_acted']) {
        assert(qualities[party + '_ai_last_spend'] > 0);
      }
      actedTotal += qualities[party + '_ai_acted'];
      assert(qualities[party + '_economic_position'] >= 0);
      assert(qualities[party + '_economic_position'] <= 100);
      assert(qualities[party + '_cultural_position'] >= 0);
      assert(qualities[party + '_cultural_position'] <= 100);
    });
    assert.strictEqual(qualities.p2050_ai_acted, 0);
    assert.strictEqual(qualities.p2050_ai_last_spend, 0);
    assert.strictEqual(
      qualities.rival_actions_this_month,
      actedTotal
    );

    [
      'pis_ko',
      'pis_psl',
      'pis_konf',
      'pis_p2050',
      'ko_psl',
      'ko_konf',
      'ko_p2050',
      'psl_konf',
      'psl_p2050',
      'konf_p2050',
    ].forEach(function(pair) {
      const relation = qualities['rival_relation_' + pair];
      assert(Number.isFinite(relation));
      assert(relation >= 0 && relation <= 100);
      assert.strictEqual(
        qualities['relation_' + pair],
        relation,
        'Election compatibility mirror drifted from hidden relation ' + pair
      );
    });

    qualities.year = 2020;
    qualities.month = 2;
    qualities.month_name = 'February';
    qualities.date_label = 'February 2020';
    qualities.rival_income_last_year = 2019;
    const annualIncome = {};
    ['pis', 'ko', 'psl', 'konf'].forEach(function(party) {
      qualities[party + '_org_resources'] = 0;
      annualIncome[party] = qualities[party + '_org_income'];
    });
    engine.goToScene('poland_party_ai');
    checkNumbers();
    ['pis', 'ko', 'psl', 'konf'].forEach(function(party) {
      assert.strictEqual(
        qualities[party + '_org_resources'] +
          qualities[party + '_ai_last_spend'],
        annualIncome[party],
        party + ' annual organisational income was not conserved'
      );
    });
    assert.strictEqual(qualities.rival_income_last_year, 2020);

    qualities.pis_org_resources = 250;
    engine.goToScene('poland_normalize');
    assert.strictEqual(
      qualities.pis_org_resources,
      250,
      'Rival organisational resources were incorrectly capped'
    );

    qualities.p2050_emerged = 1;
    qualities.p2050_ai_active = 0;
    qualities.p2050_org_resources = 0;
    qualities.year = 2020;
    qualities.month = 8;
    qualities.month_name = 'August';
    qualities.date_label = 'August 2020';
    engine.goToScene('poland_party_ai');
    checkNumbers();
    assert.strictEqual(qualities.p2050_ai_active, 1);
    assert(qualities.p2050_org_resources >= 4);
    assert.notStrictEqual(
      qualities.p2050_ai_strategy,
      'Movement not yet formed'
    );
    assert.strictEqual(qualities.poll_calibration_p2050, 0);
    assert(
      qualities.p2050_vote_intent > 4,
      'Poland 2050 remained hidden by its pre-launch calibration'
    );
    assertPollingModel();

    // The same party system must react in opposite directions depending on
    // which pole is gaining strength. These are hidden strategic balances;
    // public polling continues to use the separate economic/cultural axes.
    startStandard('rival-party-ai-strong-left');
    const leftPressure = engine.state.qualities;
    leftPressure.left_vote_intent = 24;
    leftPressure.left_projected_seats = 92;
    leftPressure.labor_credibility = 76;
    leftPressure.party_unity = 78;
    leftPressure.konf_vote_intent = 4;
    leftPressure.far_right_agenda = 14;
    leftPressure.covid_anti_system_pressure = 0;
    leftPressure.party_system_pendulum = 0;
    const leftBefore = {
      koSocial: leftPressure.ko_social_liberal_share,
      pisSolidarist: leftPressure.pis_solidarist_share,
      pslConservative: leftPressure.psl_conservative_share,
    };
    engine.goToScene('poland_party_ai');
    checkNumbers();
    assert(leftPressure.party_system_pendulum < 0);
    assert(
      leftPressure.ko_social_liberal_share > leftBefore.koSocial,
      'A strong Left did not strengthen KO social liberals'
    );
    assert(
      leftPressure.pis_solidarist_share > leftBefore.pisSolidarist,
      'A strong Left did not strengthen PiS solidarists'
    );
    assert(
      leftPressure.psl_conservative_share < leftBefore.pslConservative,
      'A strong Left did not pull PSL away from its conservative pole'
    );

    startStandard('rival-party-ai-strong-konf');
    const rightPressure = engine.state.qualities;
    rightPressure.left_vote_intent = 5;
    rightPressure.left_projected_seats = 12;
    rightPressure.labor_credibility = 35;
    rightPressure.party_unity = 32;
    rightPressure.konf_vote_intent = 21;
    rightPressure.far_right_agenda = 76;
    rightPressure.covid_anti_system_pressure = 72;
    rightPressure.party_system_pendulum = 0;
    const rightBefore = {
      koClassical: rightPressure.ko_classical_liberal_share,
      pisMarket: rightPressure.pis_market_hardliner_share,
      pslConservative: rightPressure.psl_conservative_share,
    };
    engine.goToScene('poland_party_ai');
    checkNumbers();
    assert(rightPressure.party_system_pendulum > 0);
    assert(
      rightPressure.ko_classical_liberal_share > rightBefore.koClassical,
      'A Konf surge did not strengthen KO classical liberals'
    );
    assert(
      rightPressure.pis_market_hardliner_share > rightBefore.pisMarket,
      'A Konf surge did not strengthen PiS market hardliners'
    );
    assert(
      rightPressure.psl_conservative_share > rightBefore.pslConservative,
      'A Konf surge did not strengthen PSL conservatives'
    );
    assert(
      Math.abs(
        rightPressure.konf_braunist_share +
          rightPressure.konf_mentzenite_share +
          rightPressure.konf_nationalist_share -
          100
      ) < 0.000001,
      'Konfederacja faction shares do not sum to 100'
    );
    [
      'pis',
      'ko',
      'psl',
      'konf',
      'p2050',
    ].forEach(function(party) {
      [
        'accept_social',
        'accept_rights',
        'accept_order',
        'accept_market',
        'coalition_openness',
      ].forEach(function(metric) {
        const value = rightPressure[party + '_' + metric];
        assert(Number.isFinite(value));
        assert(value >= 0 && value <= 100);
      });
    });

    startStandard('rival-party-ai-covid-recruitment');
    const covidRecruitment = engine.state.qualities;
    const konfResourcesBeforeCovid = covidRecruitment.konf_org_resources;
    engine.goToScene('poland_events.covid');
    checkNumbers();
    assert.strictEqual(
      covidRecruitment.konf_org_resources,
      konfResourcesBeforeCovid + 3,
      'The first lockdown did not create a Konf recruitment shock'
    );
    assert(covidRecruitment.covid_anti_system_pressure >= 10);

    const independenceWingOutcome = function(seed, choiceId) {
      startStandard(seed);
      const march = engine.state.qualities;
      engine.goToScene('poland_events_2021_2023.independence_2019');
      choose(choiceId);
      assert.notStrictEqual(
        march.independence_march_strategy,
        'No strategy',
        'Independence Day choice did not record a strategic line'
      );
      returnToHub();
      march.rival_ai_initialized = 1;
      march.rival_income_last_year = march.year;
      ['pis', 'ko', 'psl', 'konf', 'p2050'].forEach(function(party) {
        march[party + '_org_resources'] = 0;
      });
      engine.goToScene('poland_party_ai');
      checkNumbers();
      return {
        braunist: march.konf_braunist_share,
        nationalist: march.konf_nationalist_share,
      };
    };
    const civicMarch = independenceWingOutcome(
      'rival-party-ai-civic-march',
      'poland_events_2021_2023.ind19_civic'
    );
    const counterMarch = independenceWingOutcome(
      'rival-party-ai-counter-march',
      'poland_events_2021_2023.ind19_counter'
    );
    assert(
      counterMarch.braunist > civicMarch.braunist,
      'Counter-mobilisation did not strengthen Konf Braunists relative to a civic strategy'
    );

    startStandard('rival-party-ai-proposal-fit');
    const proposalFit = engine.state.qualities;
    proposalFit.ko_relation = 80;
    proposalFit.ko_coalition_openness = 20;
    engine.goToScene('poland_events.postal');
    let commonFront = currentChoices().find(function(choice) {
      return choice.id === 'poland_events.postal_front';
    });
    assert(commonFront);
    assert.strictEqual(
      commonFront.canChoose,
      false,
      'Raw relations still override KO issue-specific willingness'
    );
    proposalFit.ko_coalition_openness = 80;
    engine.goToScene('poland_events.postal');
    commonFront = currentChoices().find(function(choice) {
      return choice.id === 'poland_events.postal_front';
    });
    assert.strictEqual(commonFront.canChoose, true);

    startStandard('rival-party-ai-braunist-compatibility');
    const braunistCompatibility = engine.state.qualities;
    braunistCompatibility.rival_relation_pis_konf = 50;
    braunistCompatibility.pis_economic_position = 50;
    braunistCompatibility.konf_economic_position = 50;
    braunistCompatibility.pis_cultural_position = 80;
    braunistCompatibility.konf_cultural_position = 80;
    braunistCompatibility.konf_braunist_share = 80;
    braunistCompatibility.konf_mentzenite_share = 10;
    braunistCompatibility.konf_nationalist_share = 10;
    engine.goToScene('poland_polling');
    checkNumbers();
    const braunistRightScore =
      braunistCompatibility.coalition_right_score;

    startStandard('rival-party-ai-nationalist-compatibility');
    const nationalistCompatibility = engine.state.qualities;
    nationalistCompatibility.rival_relation_pis_konf = 50;
    nationalistCompatibility.pis_economic_position = 50;
    nationalistCompatibility.konf_economic_position = 50;
    nationalistCompatibility.pis_cultural_position = 80;
    nationalistCompatibility.konf_cultural_position = 80;
    nationalistCompatibility.konf_braunist_share = 5;
    nationalistCompatibility.konf_mentzenite_share = 10;
    nationalistCompatibility.konf_nationalist_share = 85;
    engine.goToScene('poland_polling');
    checkNumbers();
    assert(
      nationalistCompatibility.coalition_right_score >
        braunistRightScore + 10,
      'Konf factional control did not affect PiS-Konf coalition viability'
    );

    startStandard('rival-party-ai-democratic-policy-fit');
    const democraticPolicyFit = engine.state.qualities;
    democraticPolicyFit.rival_relation_ko_psl = 60;
    democraticPolicyFit.ko_relation = 60;
    democraticPolicyFit.psl_relation = 60;
    democraticPolicyFit.ko_coalition_openness = 60;
    democraticPolicyFit.psl_coalition_openness = 60;
    democraticPolicyFit.left_right_score = 25;
    democraticPolicyFit.ko_right_score = 30;
    democraticPolicyFit.psl_right_score = 35;
    engine.goToScene('poland_polling');
    checkNumbers();
    const alignedDemocraticScore =
      democraticPolicyFit.coalition_democratic_score;

    startStandard('rival-party-ai-democratic-policy-distance');
    const democraticPolicyDistance = engine.state.qualities;
    democraticPolicyDistance.rival_relation_ko_psl = 60;
    democraticPolicyDistance.ko_relation = 60;
    democraticPolicyDistance.psl_relation = 60;
    democraticPolicyDistance.ko_coalition_openness = 60;
    democraticPolicyDistance.psl_coalition_openness = 60;
    democraticPolicyDistance.left_right_score = 5;
    democraticPolicyDistance.ko_right_score = 90;
    democraticPolicyDistance.psl_right_score = 90;
    engine.goToScene('poland_polling');
    checkNumbers();
    assert(
      alignedDemocraticScore >
        democraticPolicyDistance.coalition_democratic_score + 15,
      'Hidden ideological distance did not affect democratic coalition viability'
    );

    const statusSource = fs.readFileSync(
      path.join(projectRoot, 'source', 'scenes', 'status.scene.dry'),
      'utf8'
    );
    assert(
      !statusSource.includes('· E[+'),
      'The public ledger still exposes hidden rival ideology scores'
    );
  }

  function assertFirstRoundAccounting(qualities) {
    const candidates = [
      'duda',
      'trzaskowski',
      'holownia',
      'bosak',
      'kosiniak',
      'left',
      'other',
    ];
    const rawTotal = candidates.reduce(function(total, candidate) {
      const value = qualities['pres_r1_raw_' + candidate];
      assert(Number.isFinite(value));
      assert(value >= 0);
      return total + value;
    }, 0);
    const displayTotal = candidates.reduce(function(total, candidate) {
      const value = qualities['pres_r1_display_' + candidate];
      assert(Number.isFinite(value));
      assert(value >= 0);
      return total + value;
    }, 0);
    const voteTotal = candidates.reduce(function(total, candidate) {
      const value = qualities['pres_r1_votes_' + candidate];
      assert(Number.isInteger(value));
      assert(value >= 0);
      return total + value;
    }, 0);

    assert(Math.abs(rawTotal - 100) < 0.000001);
    assert(Math.abs(displayTotal - 100) < 0.000001);
    assert.strictEqual(voteTotal, qualities.pres_r1_valid_votes);

    const ordered = candidates.slice().sort(function(left, right) {
      const difference =
        qualities['pres_r1_raw_' + right] -
        qualities['pres_r1_raw_' + left];
      if (Math.abs(difference) > 0.0000001) {
        return difference;
      }
      return candidates.indexOf(left) - candidates.indexOf(right);
    });
    assert.strictEqual(qualities.pres_finalist_a_key, ordered[0]);
    assert.strictEqual(qualities.pres_finalist_b_key, ordered[1]);
    assert.notStrictEqual(
      qualities.pres_finalist_a_key,
      qualities.pres_finalist_b_key
    );
    assert.strictEqual(
      qualities.pres_first_round_majority,
      qualities['pres_r1_raw_' + ordered[0]] > 50 ? 1 : 0,
      'First-round victory was not decided by a strict raw-vote majority'
    );
    assert.strictEqual(qualities.pres_first_round_complete, 1);
  }

  function assertRunoffAccounting(qualities) {
    assert(Number.isFinite(qualities.pres_runoff_raw_a));
    assert(Number.isFinite(qualities.pres_runoff_raw_b));
    assert(qualities.pres_runoff_raw_a >= 0);
    assert(qualities.pres_runoff_raw_b >= 0);
    assert(
      Math.abs(
        qualities.pres_runoff_raw_a +
        qualities.pres_runoff_raw_b -
        100
      ) < 0.000001
    );
    assert.strictEqual(
      qualities.pres_runoff_display_a +
        qualities.pres_runoff_display_b,
      100
    );
    assert.strictEqual(
      qualities.pres_runoff_votes_a + qualities.pres_runoff_votes_b,
      qualities.pres_runoff_valid_votes
    );
    [
      'left',
      'holownia',
      'psl',
      'ko',
      'bosak',
      'other',
    ].forEach(function(source) {
      const transfer = qualities['pres_transfer_' + source + '_target'];
      assert(Number.isFinite(transfer));
      assert(
        transfer >= 0 && transfer <= 100,
        source + ' runoff transfer escaped its source electorate'
      );
    });
    assert(Number.isFinite(qualities.pres_transfer_abstention));
    assert(
      qualities.pres_transfer_abstention >= 0 &&
      qualities.pres_transfer_abstention <= 100
    );
    assert.strictEqual(qualities.pres_runoff_complete, 1);
    assert.strictEqual(
      qualities.pres_runoff_winner_key,
      qualities.pres_runoff_raw_a > qualities.pres_runoff_raw_b
        ? qualities.pres_finalist_a_key
        : qualities.pres_finalist_b_key
    );
    assert.strictEqual(qualities.president_name, 'Andrzej Duda');
    assert.strictEqual(
      qualities.pres_2020_president_elect_name,
      qualities.pres_runoff_winner_name
    );
    if (qualities.pres_runoff_winner_key === 'trzaskowski') {
      assert.strictEqual(
        qualities.trz_inauguration_status,
        'President-elect — certification pending'
      );
    }
    assert.strictEqual(
      qualities.trzaskowski_won,
      qualities.pres_runoff_winner_key === 'trzaskowski' ? 1 : 0
    );
  }

  function playPresidentialDebate(options) {
    const settings = Object.assign({
      frame: 'poland_presidential_election.debate_frame_material',
      rights: 'poland_presidential_election.debate_rights_dignity',
      close: 'poland_presidential_election.debate_close_social',
    }, options || {});
    const qualities = engine.state.qualities;

    assert.strictEqual(
      engine.state.sceneId,
      'poland_presidential_election.debate'
    );
    assert.strictEqual(qualities.year, 2020);
    assert.strictEqual(qualities.month, 6);
    choose('poland_presidential_election.debate_begin');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_presidential_election.debate_frame'
    );
    assert.strictEqual(qualities.pres_debate_stops_remaining, 3);
    assert(qualities.pres_debate_poll_before_left > 0);

    choose(settings.frame);
    assert.strictEqual(qualities.pres_debate_stops_remaining, 2);
    assert.strictEqual(
      engine.state.sceneId,
      'poland_presidential_election.debate_rights_health'
    );

    choose(settings.rights);
    assert.strictEqual(qualities.pres_debate_stops_remaining, 1);
    assert.strictEqual(
      engine.state.sceneId,
      'poland_presidential_election.debate_economy_close'
    );

    choose(settings.close);
    assert.strictEqual(qualities.pres_debate_stops_remaining, 0);
    assert.strictEqual(
      engine.state.sceneId,
      'poland_presidential_election.debate_verdict'
    );

    assert.strictEqual(qualities.pres_debate_resolved, 1);
    assert.notStrictEqual(qualities.pres_debate_outcome, 'Not held');
    const committedBonus = qualities.pres_bonus_left;
    choose('poland_presidential_election.tracking_poll');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_presidential_election.tracking_poll'
    );
    const trackingTotal = [
      'duda',
      'trzaskowski',
      'holownia',
      'bosak',
      'kosiniak',
      'left',
      'other',
    ].reduce(function(total, candidate) {
      return total + qualities['pres_poll_' + candidate];
    }, 0);
    assert(Math.abs(trackingTotal - 100) < 0.000001);
    assert.strictEqual(
      qualities.pres_debate_poll_shift,
      Math.round(
        (
          qualities.pres_poll_left -
          qualities.pres_debate_poll_before_left
        ) * 10
      ) / 10
    );
    assert.strictEqual(qualities.year, 2020);
    assert.strictEqual(qualities.month, 6);

    return {
      bonusAfterVerdict: committedBonus,
      committedBonus: qualities.pres_debate_committed_bonus,
      effectiveScore: qualities.pres_debate_effective_score,
      outcome: qualities.pres_debate_outcome,
      pollShift: qualities.pres_debate_poll_shift,
      upset: qualities.pres_debate_upset,
    };
  }

  function playPresidentialCandidateRollout() {
    const pageBreaksBeforeRollout = pageBreakCount;
    choose('poland_presidential_election.meet_candidates');
    const sequence = [
      'poland_presidential_election.candidate_duda',
      'poland_presidential_election.candidate_trzaskowski',
      'poland_presidential_election.candidate_holownia',
      'poland_presidential_election.candidate_bosak',
      'poland_presidential_election.candidate_kosiniak',
      'poland_presidential_election.candidate_other',
      'poland_presidential_election.candidate_left',
      'poland_presidential_election.candidate_alignment',
    ];
    sequence.forEach(function(sceneId) {
      const available = currentChoices().filter(function(choice) {
        return choice.canChoose;
      }).map(function(choice) {
        return choice.id;
      });
      assert.deepStrictEqual(
        available,
        [sceneId],
        'Candidate rollout broke before ' + sceneId
      );
      choose(sceneId);
    });
    assert.strictEqual(
      engine.state.sceneId,
      'poland_presidential_election.candidate_alignment'
    );
    assert.strictEqual(
      engine.state.qualities.pres_candidate_tour_seen,
      1
    );
    assert.strictEqual(
      pageBreakCount,
      pageBreaksBeforeRollout,
      'Candidate profiles must accumulate above the electoral-line decision'
    );
  }

  function runHistoricalPresidentialElection(seed) {
    startStandard(seed);
    engine.goToScene('poland_presidential_election.setup');
    checkNumbers();
    const qualities = engine.state.qualities;
    qualities.year = 2020;
    qualities.month = 6;
    qualities.month_name = 'June';
    qualities.date_label = 'June 2020';

    playPresidentialCandidateRollout();
    choose('poland_presidential_election.separate_candidate');
    const openingTotal = [
      'duda',
      'trzaskowski',
      'holownia',
      'bosak',
      'kosiniak',
      'left',
      'other',
    ].reduce(function(total, candidate) {
      return total + qualities['pres_poll_' + candidate];
    }, 0);
    assert(Math.abs(openingTotal - 100) < 0.000001);
    choose('poland_presidential_election.campaign_menu');
    assert.strictEqual(qualities.pres_first_actions_remaining, 2);
    choose('poland_presidential_election.campaign_work');
    assert.strictEqual(qualities.pres_first_actions_remaining, 1);
    choose('poland_presidential_election.campaign_constitution');
    assert.strictEqual(qualities.pres_first_actions_remaining, 0);
    assert.strictEqual(engine.state.sceneId, 'poland_presidential_election.debate');
    assert.strictEqual(
      [
        qualities.pres_campaign_digital,
        qualities.pres_campaign_work,
        qualities.pres_campaign_equality,
        qualities.pres_campaign_counties,
        qualities.pres_campaign_constitution,
        qualities.pres_campaign_insurgent,
      ].reduce(function(total, used) {
        return total + used;
      }, 0),
      2
    );
    playPresidentialDebate();
    choose('poland_presidential_election.first_count');
    assertFirstRoundAccounting(qualities);
    assert.deepStrictEqual(
      [
        qualities.pres_finalist_a_key,
        qualities.pres_finalist_b_key,
      ].sort(),
      ['duda', 'trzaskowski']
    );
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_presidential_election.wait_for_runoff'],
      'First-round result offered a replay or dead-end branch'
    );
    choose('poland_presidential_election.wait_for_runoff');

    engine.goToScene('poland_presidential_election.runoff_setup');
    checkNumbers();
    assert.strictEqual(qualities.pres_support_actions_remaining, 2);
    choose('poland_presidential_election.endorsement_choice');
    choose('poland_presidential_election.endorse_free');
    choose('poland_presidential_election.support_turnout');
    assert.strictEqual(qualities.pres_support_actions_remaining, 1);
    choose('poland_presidential_election.support_release');
    assert.strictEqual(qualities.pres_support_actions_remaining, 0);
    assert.strictEqual(
      engine.state.sceneId,
      'poland_presidential_election.runoff_poll'
    );
    assert.strictEqual(
      qualities.pres_runoff_poll_a + qualities.pres_runoff_poll_b,
      100
    );
    if (qualities.pres_runoff_support_key === 'trzaskowski') {
      assert(
        qualities.pres_razem_trzaskowski_reluctance >= 5,
        'Razem reluctance did not strand a meaningful share of Left voters'
      );
      assert(
        qualities.pres_transfer_left_target < 65,
        'A free vote transferred implausibly many Left voters to Trzaskowski'
      );
    }
    choose('poland_presidential_election.final_push_safe');
    assertRunoffAccounting(qualities);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_presidential_election.runoff_consequences']
    );
    choose('poland_presidential_election.runoff_consequences');
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_hub']
    );
    choose('poland_hub');
    return qualities.pres_runoff_winner_key;
  }

  function testPresidentialElectionCorpora() {
    let historicalDudaWins = 0;
    for (let index = 0; index < 8; index += 1) {
      if (
        runHistoricalPresidentialElection(
          'presidential-historical-' + index
        ) === 'duda'
      ) {
        historicalDudaWins += 1;
      }
    }
    assert(
      historicalDudaWins >= 5,
      'Duda won only ' + historicalDudaWins +
        ' of 8 historical-line seeds'
    );
    assert(
      historicalDudaWins <= 7,
      'Historical-line slack disappeared: Duda won all 8 seeded runoffs'
    );

    const nominees = [
      'Robert Biedroń',
      'Adrian Zandberg',
      'Agnieszka Dziemianowicz-Bąk',
      'Anna-Maria Żukowska',
      'Katarzyna Kotula',
      'Magdalena Biejat',
    ];
    nominees.forEach(function(nominee, index) {
      startStandard('presidential-joint-left-' + index);
      const qualities = engine.state.qualities;
      qualities.resources = 30;
      qualities.presidential_candidate = nominee;
      qualities.presidential_candidate_base = 16;
      qualities.presidential_campaign_bonus = 4;
      qualities.left_vote_intent = 18;
      qualities.pis_vote_intent = 38;
      qualities.ko_vote_intent = 30;
      qualities.ko_relation = 80;
      qualities.public_trust = 75;
      qualities.party_unity = 80;
      qualities.media_capacity = 60;
      qualities.turnout_readiness = 75;
      qualities.primary_mandate = 50;

      engine.goToScene('poland_presidential_election.setup');
      checkNumbers();
      qualities.year = 2020;
      qualities.month = 6;
      qualities.month_name = 'June';
      qualities.date_label = 'June 2020';
      playPresidentialCandidateRollout();
      choose('poland_presidential_election.joint_request');
      choose('poland_presidential_election.joint_social');
      choose('poland_presidential_election.campaign_menu');
      choose('poland_presidential_election.campaign_digital');
      choose('poland_presidential_election.campaign_work');
      playPresidentialDebate();
      choose('poland_presidential_election.first_count');
      assertFirstRoundAccounting(qualities);
      assert.strictEqual(qualities.presidential_candidate, nominee);
      assert.strictEqual(qualities.pres_ko_joint_candidate, 1);
      assert.strictEqual(qualities.pres_r1_raw_trzaskowski, 0);
      assert(
        qualities.pres_finalist_a_key === 'left' ||
        qualities.pres_finalist_b_key === 'left',
        nominee + ' did not reach the runoff on the forced joint ticket'
      );
      choose('poland_presidential_election.wait_for_runoff');

      engine.goToScene('poland_presidential_election.runoff_setup');
      checkNumbers();
      choose('poland_presidential_election.left_runoff_frame');
      choose('poland_presidential_election.left_frame_social');
      choose('poland_presidential_election.support_ko');
      assert.strictEqual(qualities.pres_support_actions_remaining, 1);
      choose('poland_presidential_election.support_holownia');
      assert.strictEqual(qualities.pres_support_actions_remaining, 0);
      choose('poland_presidential_election.final_push_gamble');
      assertRunoffAccounting(qualities);
      assert.strictEqual(
        qualities.pres_runoff_winner_key,
        'left',
        nominee + ' lost a deliberately exceptional Left runoff corpus'
      );
      assert.strictEqual(qualities.president_name, 'Andrzej Duda');
      choose('poland_presidential_election.runoff_consequences');
      choose('poland_hub');

      engine.goToScene(
        'poland_presidential_election.challenger_inauguration_2020'
      );
      assert.strictEqual(qualities.president_name, nominee);
      assert.strictEqual(qualities.left_president, 1);

      const completedWinner = qualities.pres_runoff_winner_key;
      const completedResult = qualities.pres_runoff_raw_a;
      engine.goToScene('poland_election.presidential_2020');
      checkNumbers();
      assert.strictEqual(
        engine.state.sceneId,
        'poland_presidential_election.runoff_consequences',
        'Legacy presidential result did not redirect by saved phase'
      );
      assert.strictEqual(qualities.pres_runoff_winner_key, completedWinner);
      assert.strictEqual(qualities.pres_runoff_raw_a, completedResult);
    });

    startStandard('presidential-oath-fallback');
    let oathQualities = engine.state.qualities;
    oathQualities.year = 2020;
    oathQualities.month = 8;
    oathQualities.p2050_foundation_2020_done = 1;
    oathQualities.pres_runoff_complete = 1;
    oathQualities.pres_runoff_winner_key = 'left';
    oathQualities.pres_runoff_winner_name = 'Magdalena Biejat';
    oathQualities.pres_2020_president_elect_key = 'left';
    oathQualities.pres_2020_president_elect_name = 'Magdalena Biejat';
    assert.strictEqual(oathQualities.president_name, 'Andrzej Duda');
    engine.goToScene('poland_polling');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_presidential_election.challenger_inauguration_2020',
      'August oath route missed: ' + JSON.stringify({
        year: oathQualities.year,
        month: oathQualities.month,
        complete: oathQualities.pres_runoff_complete,
        winner: oathQualities.pres_runoff_winner_key,
        inaugurated: oathQualities.pres_generic_inauguration_done,
        caucus: oathQualities.caucus_crisis_pending,
      })
    );
    assert.strictEqual(oathQualities.president_name, 'Magdalena Biejat');
    assert.strictEqual(oathQualities.pres_generic_inauguration_done, 1);

    startStandard('presidential-2025-oath-handover');
    oathQualities = engine.state.qualities;
    oathQualities.pres_2025_round_one_done = 1;
    oathQualities.pres_2025_finalist_a_key = 'ko';
    oathQualities.pres_2025_finalist_b_key = 'right';
    oathQualities.pres_2025_ko_candidate = 'Rafał Trzaskowski';
    oathQualities.pres_2025_left_candidate = 'Magdalena Biejat';
    oathQualities.pres_2025_r1_ko = 31;
    oathQualities.pres_2025_r1_right = 30;
    engine.goToScene('poland_events_2025.presidential_runoff_2025');
    const presidentElect2025 = oathQualities.pres_2025_winner;
    assert.strictEqual(oathQualities.president_name, 'Andrzej Duda');
    assert.strictEqual(oathQualities.pres_2025_inaugurated, 0);
    isolateDatedEventFixture([
      'poland_events_2025.presidential_inauguration_2025',
    ]);
    openDatedEventQueue(2025, 8);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2025.presidential_inauguration_2025']
    );
    choose('poland_events_2025.presidential_inauguration_2025');
    assert.strictEqual(oathQualities.president_name, presidentElect2025);
    assert.strictEqual(oathQualities.pres_2025_inaugurated, 1);

    function prepareNawrockiOathCrisis(seed, governmentParty) {
      startStandard(seed);
      const qualities = engine.state.qualities;
      Object.assign(qualities, {
        pres_2025_round_one_done: 1,
        pres_2025_runoff_done: 1,
        pres_2025_winner: 'Karol Nawrocki',
        pres_2025_winner_key: 'right',
        pres_2025_hostile_president: 1,
        pres_2025_inaugurated: 0,
        government_party: governmentParty,
        government_has_confidence: 1,
        caretaker_government: 0,
        sejm_speaker: 'Szymon Hołownia',
        p2050_leader: 'Szymon Hołownia',
        resources: 10,
      });
      isolateDatedEventFixture([
        'poland_events_2025.presidential_oath_crisis_2025',
        'poland_events_2025.presidential_inauguration_2025',
      ]);
      return qualities;
    }

    oathQualities = prepareNawrockiOathCrisis(
      'presidential-2025-oath-refusal',
      'ko'
    );
    openDatedEventQueue(2025, 8);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2025.presidential_oath_crisis_2025']
    );
    choose('poland_events_2025.presidential_oath_crisis_2025');
    choose('poland_events_2025.oath_fixed_date_2025');
    assert.strictEqual(oathQualities.pres_2025_oath_crisis, 1);
    assert.strictEqual(oathQualities.pres_2025_inaugurated, 0);
    continueDatedEventAfterword('poland_event_queue.events_choice');
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2025.presidential_inauguration_2025']
    );
    choose('poland_events_2025.presidential_inauguration_2025');
    assert.strictEqual(oathQualities.president_name, 'Karol Nawrocki');
    assert.strictEqual(oathQualities.pres_2025_inaugurated, 1);
    assert.strictEqual(oathQualities.pres_2025_oath_crisis, 1);

    oathQualities = prepareNawrockiOathCrisis(
      'presidential-2025-oath-acting-window',
      'ko'
    );
    const foreignPressureBefore = oathQualities.foreign_pressure;
    const institutionalTrustBefore = oathQualities.institutional_trust;
    openDatedEventQueue(2025, 8);
    choose('poland_events_2025.presidential_oath_crisis_2025');
    choose('poland_events_2025.oath_acting_window_2025');
    assert.strictEqual(oathQualities.pres_2025_oath_crisis, 2);
    assert.strictEqual(oathQualities.pres_2025_inaugurated, 0);
    assert.strictEqual(
      oathQualities.president_name,
      'Presidential office disputed during oath delay'
    );
    assert.strictEqual(oathQualities.sejm_speaker, 'Szymon Hołownia');
    assert.strictEqual(oathQualities.p2050_leader, 'Szymon Hołownia');
    assert(oathQualities.foreign_pressure > foreignPressureBefore);
    assert(oathQualities.institutional_trust < institutionalTrustBefore);
    assert(oathQualities.oath_crisis_pressure >= 55);
    continueDatedEventAfterword('poland_event_queue.events_choice');
    assert(oathQualities.national_crisis_pressure >= 55);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2025.presidential_inauguration_2025']
    );
    choose('poland_events_2025.presidential_inauguration_2025');
    assert.strictEqual(oathQualities.president_name, 'Karol Nawrocki');
    assert.strictEqual(oathQualities.pres_2025_inaugurated, 1);
    assert.strictEqual(oathQualities.pres_2025_oath_crisis, 3);
    assert.strictEqual(
      oathQualities.pres_2025_oath_strategy,
      'Disputed acts during the interregnum'
    );
    assert(oathQualities.oath_crisis_pressure >= 47);

    oathQualities = prepareNawrockiOathCrisis(
      'presidential-2025-oath-pis-government',
      'pis'
    );
    openDatedEventQueue(2025, 8);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2025.presidential_inauguration_2025'],
      'A PiS government incorrectly received Hołownia\'s coalition crisis'
    );

    startStandard('presidential-first-round-majority-and-reinforcement');
    const majorityQualities = engine.state.qualities;
    majorityQualities.presidential_candidate = 'Robert Biedroń';
    majorityQualities.presidential_candidate_base = 2.2;
    majorityQualities.pres_first_calc_mode = 'first_result';
    majorityQualities.pres_first_round_complete = 0;
    majorityQualities.pres_bonus_trzaskowski = 100;
    majorityQualities.pres_bonus_duda = -100;
    majorityQualities.pres_feedback_active = 1;
    majorityQualities.pres_feedback_direction = -1;
    engine.goToScene('poland_presidential_election.calculate_first');
    assert.strictEqual(majorityQualities.pres_first_round_majority, 1);
    assert.strictEqual(majorityQualities.pres_r1_leader_key, 'trzaskowski');
    assert.strictEqual(majorityQualities.president_name, 'Andrzej Duda');
    assert.strictEqual(
      majorityQualities.pres_2020_president_elect_name,
      'Rafał Trzaskowski'
    );
    assert.strictEqual(majorityQualities.pres_feedback_reinforcements, 1);
  }

  function testPresidential2025PollingConversion() {
    startStandard('presidential-2025-major-party-conversion');
    const qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2025,
      month: 5,
      continuous_campaign: 1,
      pres_2025_round_one_done: 0,
      pres_2025_left_candidate: 'Magdalena Biejat',
      pres_2025_candidate: 'Magdalena Biejat',
      pres_2025_razem_candidate: 'Adrian Zandberg',
      pres_2025_united_left: 0,
      pres_2025_campaign_strength: 8,
      pres_2025_debate_shift: 2,
      left_vote_intent: 20,
      pis_vote_intent: 35,
      ko_vote_intent: 12,
      konf_vote_intent: 7,
      p2050_vote_intent: 10,
      razem_party_formed: 1,
      razem_vote_intent: 3.5,
      razem_strength: 20,
      ko_relation: 50,
      far_right_agenda: 32,
      konf_mentzenite_share: 47,
      konf_braunist_share: 18,
      kanal_zero_capacity: 12,
    });
    engine.goToScene(
      'poland_events_2025.presidential_first_round_2025'
    );
    assert(
      qualities.pres_2025_candidate_expectation >= 19,
      'A 20% Lewica was still converted into a minor presidential candidacy: ' +
        qualities.pres_2025_candidate_expectation + '% expected, ' +
        qualities.pres_2025_player_result + '% actual'
    );
    assert(
      qualities.pres_2025_player_result >= 18,
      'Election variance restored the historical penalty at 20% polling'
    );
    assert.strictEqual(
      qualities.pres_2025_player_finalist,
      1,
      'A well-run candidate from the second-largest party could not reach the runoff'
    );
    assert(
      qualities.pres_2025_r1_razem < 6,
      'Separate Razem support was still double-counted from Lewica polling'
    );
  }

  function testPresidential2025Experience() {
    startStandard('presidential-2025-full-experience');
    const qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2024,
      month: 12,
      continuous_campaign: 1,
      resources: 10,
      razem_cooperation: 60,
    });
    engine.goToScene('poland_events_2023_2024.left_nomination_2024');
    const nominationChoices = currentChoices().map(function(choice) {
      return choice.id;
    });
    assert(nominationChoices.includes(
      'poland_events_2023_2024.biejat_confirm'
    ));
    assert(nominationChoices.includes(
      'poland_events_2023_2024.dziemianowicz_bak_nomination'
    ));
    assert(nominationChoices.includes(
      'poland_events_2023_2024.biejat_primary'
    ));
    assert(nominationChoices.includes(
      'poland_events_2023_2024.biejat_zandberg'
    ));
    choose('poland_events_2023_2024.biejat_zandberg');
    assert.strictEqual(qualities.pres_2025_left_candidate, 'Adrian Zandberg');
    assert.strictEqual(qualities.pres_2025_united_left, 1);
    assert.strictEqual(qualities.pres_2025_razem_candidate, 'None');

    // Old saves with both Zandberg rows are repaired before the next event.
    qualities.pres_2025_united_left = 0;
    qualities.pres_2025_razem_candidate = 'Adrian Zandberg';
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.pres_2025_united_left, 1);
    assert.strictEqual(qualities.pres_2025_razem_candidate, 'None');

    qualities.year = 2025;
    qualities.month = 1;
    engine.goToScene('poland_events_2025.left_presidential_split');
    choose('poland_events_2025.left_campaign_shared');
    choose('poland_events_2025.presidential_field_2025');
    choose('poland_events_2025.pres25_meet_leaders');
    choose('poland_events_2025.pres25_meet_right');
    choose('poland_events_2025.pres25_meet_outsiders');
    choose('poland_events_2025.pres25_meet_minor');
    choose('poland_events_2025.pres25_meet_left');
    choose('poland_events_2025.pres25_opening_poll');
    assert(qualities.pres_2025_poll_left > 0);
    assert.strictEqual(qualities.pres_2025_poll_razem, 0);
    choose('poland_events_2025.pres25_campaign_menu');
    choose('poland_events_2025.pres25_campaign_work');
    choose('poland_events_2025.pres25_campaign_constitution');
    assert.strictEqual(qualities.pres_2025_campaign_actions_remaining, 0);

    qualities.year = 2025;
    qualities.month = 4;
    engine.goToScene('poland_events_2025.presidential_debate_2025');
    choose('poland_events_2025.pres25_debate_security');
    choose('poland_events_2025.pres25_security_signature');
    choose('poland_events_2025.pres25_economy_signature');
    choose('poland_events_2025.pres25_rights_signature');
    const questionChoices = currentChoices().map(function(choice) {
      return choice.id;
    });
    assert(!questionChoices.includes(
      'poland_events_2025.pres25_question_zandberg'
    ));
    choose('poland_events_2025.pres25_question_mentzen');
    choose('poland_events_2025.pres25_close_signature');
    choose('poland_events_2025.pres25_tracking_poll');
    const pollTotal = [
      'ko', 'right', 'left', 'razem', 'mentzen',
      'braun', 'holownia', 'stanowski', 'other'
    ].reduce(function(sum, key) {
      return sum + qualities['pres_2025_poll_' + key];
    }, 0);
    assert(Math.abs(pollTotal - 100) < 0.01);
    assert.strictEqual(qualities.pres_2025_poll_razem, 0);
  }

  function testPresidentialDebateMinigame() {
    const nominees = [
      'Robert Biedroń',
      'Adrian Zandberg',
      'Agnieszka Dziemianowicz-Bąk',
      'Anna-Maria Żukowska',
      'Katarzyna Kotula',
      'Magdalena Biejat',
    ];
    const pickKeys = [
      'pres_debate_frame_signature_title',
      'pres_debate_frame_reply_title',
      'pres_debate_frame_cautious_title',
      'pres_debate_rights_signature_title',
      'pres_debate_rights_reply_title',
      'pres_debate_rights_cautious_title',
      'pres_debate_close_signature_title',
      'pres_debate_close_duda_title',
      'pres_debate_close_holownia_title',
    ];
    const nomineePicks = nominees.map(function(nominee, index) {
      startStandard('candidate-specific-debate-picks-' + index);
      const qualities = engine.state.qualities;
      engine.goToScene('poland_presidential_election.setup');
      checkNumbers();
      qualities.presidential_candidate = nominee;
      engine.goToScene('poland_presidential_election.debate');
      choose('poland_presidential_election.debate_begin');
      const picks = pickKeys.map(function(key) {
        return qualities[key];
      });
      assert(picks.every(function(pick) {
        return typeof pick === 'string' && pick.length > 0;
      }), nominee + ' did not receive a full set of debate choices');
      assert(picks[1].includes('Duda'));
      assert(picks[4].includes('Bosak'));
      assert(picks[7].includes('Duda'));
      assert(picks[8].includes('Hołownia'));
      return picks;
    });
    pickKeys.forEach(function(key, pickIndex) {
      assert.strictEqual(
        new Set(nomineePicks.map(function(picks) {
          return picks[pickIndex];
        })).size,
        nominees.length,
        'Nominees share the same authored choice for ' + key
      );
    });

    function runCandidate(nominee) {
      startStandard('paired-presidential-debate');
      const qualities = engine.state.qualities;
      engine.goToScene('poland_presidential_election.setup');
      checkNumbers();
      qualities.year = 2020;
      qualities.month = 6;
      qualities.month_name = 'June';
      qualities.date_label = 'June 2020';
      qualities.presidential_candidate = nominee;
      qualities.presidential_candidate_base = 3.2;
      qualities.pres_debate_roll = 0.5;
      qualities.pres_debate_upset_roll = 0.5;
      engine.goToScene('poland_presidential_election.debate');
      return playPresidentialDebate();
    }

    const biedron = runCandidate('Robert Biedroń');
    const zandberg = runCandidate('Adrian Zandberg');
    assert.strictEqual(biedron.outcome, 'Clear debate win');
    assert.strictEqual(zandberg.outcome, 'Viral upset');
    assert(
      zandberg.effectiveScore > biedron.effectiveScore + 2.5,
      'Zandberg did not receive his debate-specific performance edge'
    );
    assert(
      zandberg.committedBonus > biedron.committedBonus,
      'Zandberg did not receive the higher debate ceiling'
    );
    assert(
      zandberg.pollShift >= biedron.pollShift,
      'Zandberg debate edge failed to reach the final tracking poll'
    );

    const zandbergQualities = engine.state.qualities;
    const committedOnce = zandbergQualities.pres_bonus_left;
    engine.goToScene('poland_presidential_election.debate_verdict');
    checkNumbers();
    assert.strictEqual(
      zandbergQualities.pres_bonus_left,
      committedOnce,
      'Revisiting the verdict applied the debate bonus twice'
    );

    startStandard('adverse-presidential-debate');
    const qualities = engine.state.qualities;
    engine.goToScene('poland_presidential_election.setup');
    checkNumbers();
    qualities.year = 2020;
    qualities.month = 6;
    qualities.month_name = 'June';
    qualities.date_label = 'June 2020';
    qualities.presidential_candidate = 'Robert Biedroń';
    qualities.pres_debate_roll = 0;
    qualities.pres_debate_upset_roll = 0.1;
    const dudaBonusBefore = qualities.pres_bonus_duda;
    engine.goToScene('poland_presidential_election.debate');
    const adverse = playPresidentialDebate({
      frame: 'poland_presidential_election.debate_frame_reassure',
      rights: 'poland_presidential_election.debate_rights_cautious',
      close: 'poland_presidential_election.debate_close_duopoly',
    });
    assert.strictEqual(adverse.outcome, 'Stumble');
    assert(adverse.upset.includes('Duda'));
    assert(qualities.pres_bonus_duda > dudaBonusBefore);
  }

  function setCampaignDate(qualities, year, month, monthName) {
    qualities.year = year;
    qualities.month = month;
    qualities.month_name = monthName;
    qualities.date_label = monthName + ' ' + year;
    qualities.poll_danger_months = 0;
    qualities.party_unity = Math.max(qualities.party_unity, 75);
    qualities.left_vote_intent = Math.max(
      qualities.left_vote_intent,
      10
    );
  }

  function testTrzaskowskiWarOfPowers() {
    startStandard('trzaskowski-war-of-powers');
    const qualities = engine.state.qualities;
    qualities.resources = 20;
    qualities.trzaskowski_won = 1;
    qualities.pres_runoff_complete = 1;
    qualities.pres_runoff_winner_key = 'trzaskowski';
    qualities.pres_runoff_winner_name = 'Rafał Trzaskowski';
    qualities.pres_runoff_margin = 4;
    qualities.pres_2020_phase = 'Certification pending';
    qualities.trz_inauguration_status =
      'President-elect — certification pending';

    setCampaignDate(qualities, 2020, 8, 'August');
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_leadership_events.p2050_foundation_2020'
    );
    choose('poland_leadership_events.p2050_institutions');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_leadership_events.p2050_institutions',
      'The Polska 2050 response was cleared before it could be read'
    );
    choose('poland_leadership_events.p2050_2020_continue');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.certification'
    );
    choose('poland_trzaskowski.certification_legal');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.certification_result'
    );
    assert.strictEqual(qualities.trz_inaugurated, 1);
    assert.strictEqual(qualities.president_name, 'Rafał Trzaskowski');
    choose('poland_trzaskowski.begin_cohabitation');

    setCampaignDate(qualities, 2020, 10, 'October');
    qualities.abortion_event_done = 0;
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.tribunal_showdown'
    );
    choose('poland_trzaskowski.tribunal_palace_bill');
    assert.strictEqual(qualities.trz_abortion_signature, 1);
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.tribunal_palace_bill',
      'The Tribunal response was cleared before it could be read'
    );
    choose('poland_hub');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');

    setCampaignDate(qualities, 2021, 2, 'February');
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.judicial_war'
    );
    choose('poland_trzaskowski.judicial_veto_front');
    assert.strictEqual(qualities.trz_vetoes, 2);
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.judicial_veto_front',
      'The judicial-war response was cleared before it could be read'
    );
    choose('poland_hub');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');

    setCampaignDate(qualities, 2021, 4, 'April');
    assert.strictEqual(qualities.trz_inaugurated, 1);
    assert.strictEqual(qualities.trz_palace_offensive_done, 0);
    assert.strictEqual(
      engine.state.visits['poland_trzaskowski.palace_offensive'] || 0,
      0
    );
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(qualities.trz_inaugurated, 1);
    assert.strictEqual(qualities.trz_palace_offensive_done, 1);
    assert(qualities.poll_danger_months < 2);
    assert(qualities.party_unity > 12);
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.palace_offensive',
      JSON.stringify({
        year: qualities.year,
        month: qualities.month,
        unity: qualities.party_unity,
        danger: qualities.poll_danger_months,
        inaugurated: qualities.trz_inaugurated,
        palaceDone: qualities.trz_palace_offensive_done,
        visits:
          engine.state.visits['poland_trzaskowski.palace_offensive'] || 0,
      })
    );
    choose('poland_trzaskowski.palace_rights');
    assert.strictEqual(qualities.trz_abortion_signature, 1);
    assert.strictEqual(qualities.trz_marriage_signature, 1);
    assert.strictEqual(
      qualities.trz_marriage_veto_policy,
      'Will sign marriage equality'
    );
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.palace_rights',
      'The Palace response was cleared before it could be read'
    );
    choose('poland_hub');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');

    setCampaignDate(qualities, 2021, 5, 'May');
    qualities.recovery_fund_event_done = 0;
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_events.recovery_fund');
    choose('poland_events.recovery_palace');
    returnToHub();

    setCampaignDate(qualities, 2021, 6, 'June');
    qualities.opposition_reset_event_done = 0;
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.rights_vote'
    );
    choose('poland_trzaskowski.rights_vote_marriage');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.rights_result'
    );
    assert(qualities.trz_rights_bill_votes >= 170);
    assert.strictEqual(
      qualities.trz_rights_bill_outcome,
      'Passed and signed',
      'The deliberately maximised cohabitation route never converted its ' +
        'United Right fracture into a rights majority'
    );
    assert(qualities.trz_right_backlash > 0);
    choose('poland_hub');
  }

  function testTrzaskowskiBlockedPresidency() {
    startStandard('trzaskowski-blocked-presidency');
    const qualities = engine.state.qualities;
    qualities.trzaskowski_won = 1;
    qualities.pres_runoff_complete = 1;
    qualities.pres_runoff_winner_key = 'trzaskowski';
    qualities.pres_runoff_winner_name = 'Rafał Trzaskowski';
    qualities.pres_runoff_margin = 0.1;
    qualities.p2050_foundation_2020_done = 1;
    qualities.p2050_emerged = 1;
    qualities.p2050_leader = 'Szymon Hołownia';
    qualities.constitutional_restraint = 50;
    qualities.judicial_legitimacy = 36;
    qualities.pis_org_resources = 14;
    const foreignPressureBefore = qualities.foreign_pressure;
    const euTrustBefore = qualities.eu_institutional_trust;

    setCampaignDate(qualities, 2020, 8, 'August');
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.certification'
    );
    assert(qualities.trz_obstruction_pressure >= 68);
    choose('poland_trzaskowski.certification_bargain');
    assert.strictEqual(qualities.trz_inaugurated, 0);
    choose('poland_trzaskowski.accept_repeat');
    assert.strictEqual(qualities.trz_blocked, 1);
    assert.strictEqual(qualities.trz_oath_crisis_launched, 1);
    assert(qualities.oath_crisis_pressure >= 38);
    assert(qualities.foreign_pressure > foreignPressureBefore);
    assert(qualities.eu_institutional_trust < euTrustBefore);
    assert.strictEqual(
      qualities.president_name,
      'Elżbieta Witek (acting)'
    );
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.accept_repeat',
      'The Witek interregnum consequence was cleared before it could be read'
    );
    choose('poland_trzaskowski.certification_continue');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert(qualities.national_crisis_pressure >= 38);

    setCampaignDate(qualities, 2020, 9, 'September');
    qualities.merger_event_done = 1;
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.repeat_election_2020'
    );
    assert(
      qualities.trz_oath_crisis_outcome.includes('Supreme Court panel')
    );
    choose('poland_trzaskowski.repeat_withdraw');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.repeat_withdraw',
      'The rerun response was cleared before it could be read'
    );
    choose('poland_trzaskowski.repeat_election_count');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.repeat_election_count'
    );
    assert.strictEqual(qualities.president_name, 'Andrzej Duda');
    assert.strictEqual(qualities.trz_repeat_election_pending, 0);
    assert.strictEqual(qualities.trz_blocked, 0);
    assert.notStrictEqual(qualities.president_name, 'Elżbieta Witek (acting)');
    qualities.presidential_channel_open = 1;
    assert(
      game.scenes.poland_presidential_channel.viewIf(engine, qualities),
      'The ended interregnum still disabled the elected President\'s channel'
    );
    choose('poland_hub');

    setCampaignDate(qualities, 2020, 10, 'October');
    qualities.abortion_event_done = 0;
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events.abortion',
      'Blocked presidency incorrectly entered the cohabitation route'
    );
  }

  function testJuly2023CampaignContinuation() {
    startStandard('july-2023-campaign-continuation');
    const qualities = engine.state.qualities;
    qualities.year = 2023;
    qualities.month = 7;
    qualities.month_name = 'July';
    qualities.date_label = 'July 2023';
    qualities.poll_last_updated = 'Before the readiness report';
    qualities.vaccine_event_done = 1;
    qualities.rename_event_done = 1;
    qualities.recovery_fund_event_done = 1;
    qualities.opposition_reset_event_done = 1;
    qualities.left_revolt_event_done = 1;
    qualities.merger_resolution = 'Membership ballot';
    [
      'august_2021_done',
      'border_2021_done',
      'october_2021_done',
      'november_2021_done',
      'december_2021_done',
      'polish_deal_2022_done',
      'ukraine_invasion_done',
      'ukraine_refugees_done',
      'war_economy_2022_done',
      'rates_lists_2022_done',
      'kpo_2022_done',
      'inflation_2022_done',
      'odra_2022_done',
      'energy_2022_done',
      'konf_succession_2022_done',
      'november_2022_done',
      'budget_2022_done',
      'kpo_bill_2023_done',
      'february_2023_done',
      'church_2023_done',
      'third_way_2023_done',
      'lex_tusk_2023_done',
      'june_2023_done',
      'july_2023_done',
    ].forEach(function(flag) {
      qualities[flag] = 1;
    });

    engine.goToScene('poland_election.campaign_projection');
    checkNumbers();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_election.campaign_projection'
    );
    assert.strictEqual(qualities.timeline_complete, 0);
    assert.strictEqual(qualities.poll_last_updated, 'July 2023');
    [
      'pis_vote_intent_display',
      'ko_vote_intent_display',
      'left_vote_intent_display',
      'konf_vote_intent_display',
    ].forEach(function(key) {
      assert.match(qualities[key], /^\d+\.\d$/);
    });
    assert.strictEqual(
      qualities.left_projected_seats +
        qualities.pis_projected_seats +
        qualities.ko_projected_seats +
        qualities.psl_projected_seats +
        qualities.konf_projected_seats +
        qualities.p2050_projected_seats +
        qualities.other_projected_seats,
      460
    );
    assert.strictEqual(
      qualities.coalition_democratic_seats,
      qualities.ko_projected_seats +
        qualities.p2050_projected_seats +
        qualities.psl_projected_seats +
        qualities.left_projected_seats
    );
    assert.strictEqual(
      qualities.coalition_center_seats,
      qualities.ko_projected_seats +
        qualities.p2050_projected_seats +
        qualities.psl_projected_seats
    );
    assert.strictEqual(
      qualities.coalition_right_seats,
      qualities.pis_projected_seats +
        qualities.konf_projected_seats
    );
    assert.strictEqual(
      qualities.coalition_pis_psl_seats,
      qualities.pis_projected_seats +
        qualities.psl_projected_seats
    );
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_hub']
    );
    choose('poland_hub');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(qualities.prototype_complete, 0);
    assert.strictEqual(qualities.continuous_campaign, 1);
  }

  function testHistoricalFormationRoute() {
    engine.beginGame(['formation-historical-democratic-success']);
    assert.strictEqual(engine.state.sceneId, 'root.start_menu');
    choose('root.formation_game');
    choose('root.formation_standard');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_election.results_2023'
    );
    const qualities = engine.state.qualities;
    assert.strictEqual(qualities.election_2023_seen, 1);
    assert.strictEqual(
      qualities.pis_projected_seats +
        qualities.ko_projected_seats +
        qualities.p2050_projected_seats +
        qualities.psl_projected_seats +
        qualities.left_projected_seats +
        qualities.konf_projected_seats,
      460
    );
    choose('poland_election.summary_2023');
    assert.strictEqual(qualities.election_summary_seen, 1);
    choose('poland_election.senate_results_2023');
    assert.strictEqual(qualities.election_senate_seen, 1);
    assert.strictEqual(qualities.senate_election_2023_certified, 1);
    assert.strictEqual(
      qualities.senate_pis_seats +
        qualities.senate_konf_seats +
        qualities.senate_ko_seats +
        qualities.senate_p2050_seats +
        qualities.senate_psl_seats +
        qualities.senate_left_seats +
        qualities.senate_independent_seats,
      100
    );
    assert.strictEqual(
      qualities.senate_election_rule,
      '100 single-member districts; the leading candidate wins'
    );
    choose('poland_election.coalitions_2023');
    assert.strictEqual(qualities.election_coalition_seen, 1);
    assert.strictEqual(qualities.coalition_democratic_seats, 248);
    assert.strictEqual(qualities.coalition_center_seats, 222);
    assert.strictEqual(qualities.coalition_pis_psl_seats, 226);
    assert.strictEqual(qualities.coalition_right_seats, 212);
    choose('poland_government_formation.first_sitting');

    assert.strictEqual(qualities.year, 2023);
    assert.strictEqual(qualities.left_in_government, 0);
    assert.strictEqual(qualities.caretaker_government, 1);
    assert.strictEqual(qualities.budget, 0);
    assert.strictEqual(qualities.p2050_emerged, 1);
    assert.strictEqual(qualities.economic_growth, 0.2);
    assert.strictEqual(qualities.inflation, 11.4);
    assert.strictEqual(qualities.unemployment, 5.1);
    assert.strictEqual(qualities.public_debt, 49.7);
    assert.strictEqual(qualities.budget_balance, -5.3);
    const formationParties = {
      left: {intent: 8.6, seats: 26},
      pis: {intent: 35.4, seats: 194},
      ko: {intent: 30.7, seats: 157},
      psl: {intent: 7.2, seats: 32},
      konf: {intent: 7.2, seats: 18},
      p2050: {intent: 7.2, seats: 33},
      other: {intent: 3.7, seats: 0},
    };
    Object.keys(formationParties).forEach(function(party) {
      const expected = formationParties[party];
      assert.strictEqual(qualities[party + '_vote_intent'], expected.intent);
      assert.strictEqual(
        qualities[party + '_projected_seats'],
        expected.seats
      );
      assert.strictEqual(qualities[party + '_poll_momentum'], 0);
      assert.strictEqual(
        qualities['poll_last_model_' + party],
        qualities[party + '_poll']
      );
    });
    const formationIntentTotal =
      Object.keys(formationParties).reduce(function(total, party) {
        return total + qualities[party + '_vote_intent'];
      }, 0);
    assert(
      Math.abs(formationIntentTotal - 100) < 0.000001,
      'Formation vote intentions do not sum to 100: ' +
        formationIntentTotal
    );
    assert.strictEqual(
      Object.keys(formationParties).reduce(function(total, party) {
        return total + qualities[party + '_projected_seats'];
      }, 0),
      460
    );
    assert.strictEqual(
      qualities.poll_last_updated,
      '15 October 2023 election baseline'
    );

    choose('poland_government_formation.first_democratic_protocol');
    choose('poland_government_formation.psl_public_lock');
    choose('poland_government_formation.left_united_rejection');
    choose('poland_government_formation.konf_isolate');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.first_confidence_roll'
    );
    assert.strictEqual(qualities.confidence_yes, 190);
    assert.strictEqual(qualities.confidence_no, 266);
    assert.strictEqual(qualities.confidence_abstain, 0);
    assert.strictEqual(qualities.confidence_present, 456);
    assert.strictEqual(qualities.confidence_threshold, 229);
    assert.strictEqual(qualities.morawiecki_votes, 190);
    assert.strictEqual(qualities.first_confidence_passed, 0);
    assert.strictEqual(qualities.government_has_confidence, 0);

    choose('poland_government_formation.first_confidence_continue');
    choose('poland_government_formation.nominate_tusk');
    choose('poland_government_formation.left_new_left_cabinet');
    choose('poland_government_formation.psl_full_protocol');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.democratic_candidate_roll'
    );
    assert.strictEqual(qualities.confidence_candidate, 'Donald Tusk');
    assert.strictEqual(qualities.confidence_yes, 248);
    assert.strictEqual(qualities.confidence_no, 201);
    assert.strictEqual(qualities.confidence_abstain, 0);
    assert.strictEqual(qualities.confidence_threshold, 225);
    assert.strictEqual(qualities.democratic_votes, 248);
    assert.strictEqual(qualities.candidate_vote_passed, 1);

    choose('poland_government_formation.candidate_vote_continue');
    assert.strictEqual(engine.state.sceneId, 'poland_ministries.menu');
    assert.strictEqual(qualities.ministry_leverage, 10);
    assert.strictEqual(qualities.ministry_count, 0);
    assert.strictEqual(
      currentChoices().find(function(choice) {
        return choice.id === 'poland_ministries.finalize';
      }).canChoose,
      false
    );
    choose('poland_ministries.take_labor');
    assert.strictEqual(qualities.ministry_leverage, 5);
    assert.strictEqual(qualities.ministry_count, 1);
    choose('poland_ministries.take_equality');
    assert.strictEqual(qualities.ministry_leverage, 2);
    assert.strictEqual(qualities.ministry_count, 2);
    choose('poland_ministries.drop_equality');
    assert.strictEqual(qualities.ministry_leverage, 5);
    assert.strictEqual(qualities.ministry_count, 1);
    assert.strictEqual(qualities.equality_minister_party, 'KO');
    choose('poland_ministries.take_digital');
    assert.strictEqual(qualities.ministry_leverage, 1);
    assert.strictEqual(qualities.ministry_count, 2);
    choose('poland_ministries.finalize');
    assert.strictEqual(qualities.ministries_finalized, 1);
    assert.strictEqual(qualities.ministry_leverage, 0);
    assert.strictEqual(qualities.labor_minister_party, 'Lewica');
    assert.strictEqual(qualities.equality_minister_party, 'KO');
    assert.strictEqual(qualities.digital_minister_party, 'Lewica');
    assert.strictEqual(qualities.science_minister_party, 'KO');
    choose('poland_government_formation.cabinet_signed_agreement');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.cabinet_confidence_roll'
    );
    assert.strictEqual(qualities.confidence_yes, 248);
    assert.strictEqual(qualities.confidence_no, 201);
    assert.strictEqual(qualities.confidence_abstain, 0);
    assert.strictEqual(qualities.confidence_threshold, 225);
    assert.strictEqual(qualities.cabinet_confidence_passed, 1);

    choose('poland_government_formation.cabinet_vote_continue');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.cabinet_success'
    );
    assert.strictEqual(qualities.formation_complete, 1);
    assert.strictEqual(qualities.government_has_confidence, 1);
    assert.strictEqual(qualities.caretaker_government, 0);
    assert.strictEqual(qualities.prime_minister, 'Donald Tusk');
    assert.strictEqual(qualities.government_party, 'ko');
    assert.strictEqual(
      qualities.government_owner,
      'KO-led democratic coalition'
    );
    assert.strictEqual(qualities.left_in_government, 1);
    assert.strictEqual(qualities.budget, 6);
    assert.strictEqual(
      qualities.budget_authority,
      'Governing coalition — negotiated fiscal capacity'
    );

    choose('poland_government_formation.government_entry_gate');
    choose('poland_government_formation.agreement_dispute_protocol');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.annual_budget'
    );
    assert.strictEqual(qualities.year, 2024);
    assert.strictEqual(qualities.month, 12);

    choose('poland_government_formation.budget_rural_care');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.budget_internal_roll'
    );
    assert.strictEqual(qualities.annual_budget_internal_backing, 74);
    assert.strictEqual(qualities.annual_budget_internal_vetoes, 0);
    choose('poland_government_formation.budget_ratify_clean');
    choose('poland_government_formation.budget_psl_guarantee');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.budget_sejm_roll'
    );
    assert.strictEqual(qualities.annual_budget_yes, 248);
    assert.strictEqual(qualities.annual_budget_no, 212);
    assert.strictEqual(qualities.annual_budget_abstain, 0);
    assert.strictEqual(qualities.annual_budget_threshold, 213);
    assert.strictEqual(qualities.annual_budget_passed, 1);

    choose('poland_government_formation.budget_vote_continue');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.budget_passed'
    );
    assert.strictEqual(qualities.coalition_break_threat, 1);
    choose('poland_government_formation.coalition_break');
    choose('poland_government_formation.coalition_repair');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.assessment'
    );
    assert.strictEqual(qualities.prototype_complete, 1);
    assert.strictEqual(qualities.left_in_government, 1);
    assert.strictEqual(qualities.coalition_broken, 0);
    assert.strictEqual(qualities.budget, 0);
    assert.strictEqual(
      qualities.coalition_status,
      'Four-party coalition with PSL annex'
    );
    assert.strictEqual(
      qualities.ending_name,
      'The coalition survives its first budget'
    );
  }

  function testRazemCoalitionProtocol() {
    function setFormationFixture(qualities) {
      qualities.resources = 3;
      qualities.razem_seats = 7;
      qualities.razem_dissent = 20;
      qualities.left_splinter_support_votes =
        qualities.left_splinter_seats;
      qualities.coalition_democratic_seats = 248;
      qualities.sejm_statutory_majority = 231;
    }

    function setRedLineFixture(qualities) {
      Object.assign(qualities, {
        annual_budget_left_cabinet_authority: 1,
        annual_budget_package_code: 3,
        razem_seats: 7,
        razem_in_government: 1,
        razem_budget_support_pact: 1,
        razem_red_line_broken: 0,
        year: 2024,
        caretaker_government: 0,
        government_has_confidence: 1,
        left_in_government: 1,
        government_party: 'ko',
        ko_seats: 214,
        left_seats: 25,
        p2050_seats: 0,
        psl_seats: 0,
        ministry_ko_in_cabinet: 1,
        coalition_seats: 232,
        ministry_left_cabinet_seats: 18,
      });
    }

    startStandard('razem-high-cooperation-entry');
    let qualities = engine.state.qualities;
    setFormationFixture(qualities);
    qualities.razem_cooperation = 70;
    qualities.ko_social_liberal_share = 35;
    qualities.ko_classical_liberal_share = 65;
    engine.goToScene(
      'poland_government_formation.democratic_left_mandate'
    );
    choose('poland_government_formation.left_whole_cabinet');
    assert.strictEqual(qualities.razem_in_government, 1);
    assert.strictEqual(
      qualities.razem_join_vote_result,
      'Razem ratifies cabinet entry'
    );

    startStandard('razem-social-liberal-entry');
    qualities = engine.state.qualities;
    setFormationFixture(qualities);
    qualities.razem_cooperation = 35;
    qualities.ko_social_liberal_share = 60;
    qualities.ko_classical_liberal_share = 40;
    engine.goToScene(
      'poland_government_formation.democratic_left_mandate'
    );
    choose('poland_government_formation.left_whole_cabinet');
    assert.strictEqual(qualities.razem_in_government, 1);

    startStandard('razem-confidence-and-supply');
    qualities = engine.state.qualities;
    setFormationFixture(qualities);
    qualities.razem_cooperation = 35;
    qualities.ko_social_liberal_share = 35;
    qualities.ko_classical_liberal_share = 65;
    engine.goToScene(
      'poland_government_formation.democratic_left_mandate'
    );
    choose('poland_government_formation.left_whole_cabinet');
    assert.strictEqual(qualities.razem_in_government, 0);
    assert.strictEqual(qualities.razem_budget_support_pact, 1);
    assert.strictEqual(
      qualities.razem_join_vote_result,
      'Razem chooses confidence and supply'
    );

    startStandard('razem-pivotal-budget');
    qualities = engine.state.qualities;
    qualities.coalition_seats = 225;
    qualities.ministry_left_cabinet_seats = 18;
    qualities.government_support_seats = 207;
    qualities.razem_seats = 7;
    qualities.razem_in_government = 0;
    qualities.razem_budget_support_pact = 1;
    qualities.razem_red_line_broken = 0;
    qualities.annual_budget_internal_backing = 100;
    qualities.annual_budget_internal_vetoes = 0;
    qualities.annual_budget_strategy = 'Funded social protocol';
    qualities.government_coalition_dissent = 0;
    qualities.ko_relation = 60;
    qualities.psl_relation = 60;
    engine.goToScene('poland_budget_2023_2026.budget_vote');
    assert.strictEqual(qualities.annual_budget_yes, 232);
    assert.strictEqual(qualities.razem_pivotal_to_coalition, 1);

    startStandard('razem-pivotal-cabinet-budget');
    qualities = engine.state.qualities;
    qualities.annual_budget_left_cabinet_authority = 1;
    qualities.annual_budget_package_code = 1;
    qualities.razem_in_government = 1;
    qualities.razem_pivotal_to_coalition = 1;
    qualities.razem_budget_support_pact = 1;
    engine.goToScene('poland_budget_2023_2026.internal_ratification');
    assert.strictEqual(qualities.annual_budget_razem_backing, 100);

    startStandard('razem-red-line-exit');
    qualities = engine.state.qualities;
    setRedLineFixture(qualities);
    qualities.razem_cooperation = 30;
    qualities.razem_dissent = 50;
    engine.goToScene('poland_budget_2023_2026.internal_ratification');
    assert.strictEqual(qualities.razem_in_government, 0);
    assert.strictEqual(qualities.razem_budget_support_pact, 0);
    assert.strictEqual(qualities.razem_red_line_broken, 1);
    assert.strictEqual(qualities.coalition_seats, 225);
    assert.strictEqual(qualities.ministry_left_cabinet_seats, 11);
    assert.strictEqual(qualities.coalition_break_threat, 1);

    startStandard('cooperative-razem-keeps-budget-pact');
    qualities = engine.state.qualities;
    setRedLineFixture(qualities);
    qualities.razem_cooperation = 70;
    qualities.razem_dissent = 10;
    engine.goToScene('poland_budget_2023_2026.internal_ratification');
    assert.strictEqual(qualities.razem_breakaway_protected, 1);
    assert.strictEqual(qualities.razem_in_government, 1);
    assert.strictEqual(qualities.razem_budget_support_pact, 1);
    assert.strictEqual(qualities.razem_red_line_broken, 0);

    startStandard('party-leading-razem-keeps-budget-pact');
    qualities = engine.state.qualities;
    setRedLineFixture(qualities);
    qualities.razem_merged = 1;
    qualities.merger_leader = 'Razem';
    qualities.razem_cooperation = 10;
    qualities.razem_dissent = 90;
    engine.goToScene('poland_budget_2023_2026.internal_ratification');
    assert.strictEqual(qualities.razem_breakaway_protected, 1);
    assert.strictEqual(qualities.razem_in_government, 1);
    assert.strictEqual(qualities.razem_budget_support_pact, 1);
    assert.strictEqual(qualities.razem_red_line_broken, 0);
  }

  function testDissentEffectiveness() {
    startStandard('dissent-effectiveness');
    const qualities = engine.state.qualities;
    qualities.party_unity = 70;
    qualities.barons_advisor_count = 0;
    qualities.labor_advisor_count = 0;
    qualities.progressives_advisor_count = 0;
    qualities.razem_advisor_count = 0;
    qualities.factions.forEach(function(faction) {
      qualities[faction + '_dissent'] = 70;
    });
    engine.goToScene('poland_normalize');
    assert(qualities.party_action_effectiveness < 100);
    assert(qualities.message_discipline < 100);
    assert(qualities.message_discipline < qualities.party_action_effectiveness);
    const baronsDissent = qualities.barons_dissent;
    const capacityLoss = qualities.campaign_capacity_loss;
    engine.goToScene('poland_advance');
    assert(qualities.barons_dissent < baronsDissent);
    assert(qualities.campaign_capacity_loss > capacityLoss);
  }

  function testTrzaskowskiJudiciaryEventGates() {
    startStandard('trzaskowski-judiciary-event-gates');
    const qualities = engine.state.qualities;
    qualities.year = 2024;
    qualities.month = 1;
    qualities.government_party = 'ko';
    const pendingEvents = function() {
      return (
        engine._compileChoices(
          game.scenes['poland_event_queue.all_events']
        ) || []
      ).map(function(choice) {
        return choice.id;
      });
    };
    qualities.president_name = 'Andrzej Duda';
    assert(pendingEvents().includes('poland_judiciary_2024_2026'));
    assert(
      pendingEvents().includes(
        'poland_judiciary_2024_2026.palace_warrants_2024'
      )
    );
    qualities.president_name = 'Rafał Trzaskowski';
    assert(!pendingEvents().includes('poland_judiciary_2024_2026'));
    assert(
      !pendingEvents().includes(
        'poland_judiciary_2024_2026.palace_warrants_2024'
      )
    );
  }

  function testOppositionMinistryAllocation() {
    startStandard('opposition-ministry-allocation');
    const qualities = engine.state.qualities;
    qualities.left_cabinet_committed = 0;
    qualities.left_cabinet_model = 'Confidence and supply';
    engine.goToScene('poland_ministries');
    checkNumbers();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_ministries.opposition_allocation'
    );
    assert.strictEqual(qualities.ministries_finalized, 1);
    assert.strictEqual(qualities.ministry_count, 0);
    assert.strictEqual(qualities.ministry_leverage, 0);
    ministryPortfolioCases.forEach(function(testCase) {
      assert.notStrictEqual(
        qualities[testCase.portfolio + '_minister_party'],
        'Lewica'
      );
    });
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_government_formation.cabinet_program']
    );
    choose('poland_government_formation.cabinet_program');
    assert(
      currentChoices().some(function(choice) {
        return choice.canChoose;
      }),
      'Confidence-and-supply ministry route dead-ended at the exposé'
    );
  }

  function testExpandedMinistryAllocation() {
    function set2023CabinetFixture(qualities) {
      qualities.left_seats = 26;
      qualities.left_committed_seats = 26;
      qualities.nowa_lewica_seats = 18;
      qualities.razem_seats = 7;
      qualities.left_pps_seats = 1;
      qualities.ko_seats = 157;
      qualities.p2050_seats = 33;
      qualities.psl_seats = 32;
      qualities.candidate_ko_votes = 157;
      qualities.candidate_p2050_votes = 33;
      qualities.candidate_psl_votes = 32;
      qualities.candidate_left_votes = 26;
      qualities.formation_psl_cabinet_committed = 1;
      qualities.government_party = 'ko';
    }

    startStandard('expanded-ministry-allocation');
    let qualities = engine.state.qualities;
    set2023CabinetFixture(qualities);
    qualities.left_cabinet_committed = 1;
    qualities.left_cabinet_model =
      'New Left ministers · Razem external support';
    qualities.ministry_allocation_mode = 'formation';
    qualities.ministry_return_mode = 'cabinet_program';
    qualities.razem_in_left_club = 1;
    qualities.razem_split = 0;
    qualities.psl_seats = Math.max(1, qualities.psl_seats);
    qualities.government_party = 'pis';
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.cabinet_roster_government_party = 'pis';
    engine.goToScene('poland_ministries');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_ministries.menu');
    assert.strictEqual(qualities.ministry_pis_in_cabinet, 0);
    assert.strictEqual(qualities.ministry_ko_in_cabinet, 1);
    assert.strictEqual(
      qualities.ministry_coalition_partners,
      'KO · Polska 2050 · PSL · Lewica'
    );
    assert.strictEqual(qualities.ministry_leverage, 10);
    assert.strictEqual(qualities.ministry_base_leverage, 10);
    assertNamedCabinet(qualities, 'Democratic coalition roster');

    const expectedTakeChoices = ministryPortfolioCases
      .map(function(testCase) {
        return 'poland_ministries.take_' + testCase.portfolio;
      })
      .sort();
    const takeChoices = currentChoices().filter(function(choice) {
      return choice.id.startsWith('poland_ministries.take_');
    });
    assert.deepStrictEqual(
      takeChoices.map(function(choice) {
        return choice.id;
      }).sort(),
      expectedTakeChoices,
      'The cabinet allocator did not expose all thirteen portfolios'
    );

    [
      {
        portfolio: 'finance',
        owner: 'KO',
        minister: 'Andrzej Domański',
      },
      {
        portfolio: 'foreign',
        owner: 'KO',
        minister: 'Radosław Sikorski',
      },
      {
        portfolio: 'agriculture',
        owner: 'PSL',
        minister: 'Czesław Siekierski',
      },
    ].forEach(function(testCase) {
      const choice = takeChoices.find(function(candidate) {
        return candidate.id ===
          'poland_ministries.take_' + testCase.portfolio;
      });
      assert(choice, 'Missing senior-office claim: ' + testCase.portfolio);
      assert.strictEqual(
        choice.canChoose,
        false,
        testCase.portfolio + ' ignored its coalition veto'
      );
      assert.strictEqual(
        qualities[testCase.portfolio + '_minister_party'],
        testCase.owner
      );
      assert.strictEqual(
        qualities[testCase.portfolio + '_minister'],
        testCase.minister
      );
    });

    const accountingBefore = {
      ministry_leverage: qualities.ministry_leverage,
      ministry_count: qualities.ministry_count,
      ko_relation: qualities.ko_relation,
      ko_coalition_dissent: qualities.ko_coalition_dissent,
      government_coalition_dissent:
        qualities.government_coalition_dissent,
    };
    choose('poland_ministries.take_interior');
    assert.strictEqual(
      qualities.ministry_leverage,
      accountingBefore.ministry_leverage - 5
    );
    assert.strictEqual(
      qualities.ministry_count,
      accountingBefore.ministry_count + 1
    );
    assert.strictEqual(qualities.interior_minister_party, 'Lewica');
    assert.strictEqual(qualities.interior_minister, 'Wiesław Szczepański');
    assert.strictEqual(
      qualities.ko_relation,
      accountingBefore.ko_relation - 3
    );
    assert.strictEqual(
      qualities.ko_coalition_dissent,
      accountingBefore.ko_coalition_dissent + 5
    );
    assert.strictEqual(
      qualities.government_coalition_dissent,
      accountingBefore.government_coalition_dissent + 2
    );

    choose('poland_ministries.drop_interior');
    Object.keys(accountingBefore).forEach(function(id) {
      assert.strictEqual(
        qualities[id],
        accountingBefore[id],
        'Taking and returning Interior did not restore ' + id
      );
    });
    assert.strictEqual(qualities.interior_minister_party, 'KO');
    assert.strictEqual(qualities.interior_minister, 'Marcin Kierwiński');

    [
      {
        model: 'Whole cooperating Left coalition delegation',
        leverage: 16,
      },
      {
        model: 'Programme-bound cooperating Left entry',
        leverage: 18,
      },
    ].forEach(function(route) {
      startStandard('continuous-ministry-model-' + route.leverage);
      qualities = engine.state.qualities;
      set2023CabinetFixture(qualities);
      qualities.left_cabinet_committed = 1;
      qualities.left_cabinet_model = route.model;
      qualities.ministry_allocation_mode = 'formation';
      engine.goToScene('poland_ministries');
      checkNumbers();
      assert.strictEqual(engine.state.sceneId, 'poland_ministries.menu');
      assert.strictEqual(qualities.ministry_leverage, route.leverage);
      assert.strictEqual(qualities.ministry_base_leverage, route.leverage);
    });

    startStandard('ministry-large-left-victory');
    qualities = engine.state.qualities;
    qualities.left_cabinet_committed = 1;
    qualities.left_cabinet_model =
      'Programme-bound cooperating Left entry';
    qualities.ministry_allocation_mode = 'formation';
    qualities.left_seats = 120;
    qualities.left_committed_seats = 120;
    qualities.ko_seats = 80;
    qualities.p2050_seats = 20;
    qualities.psl_seats = 20;
    qualities.candidate_left_votes = 120;
    qualities.candidate_ko_votes = 80;
    qualities.candidate_p2050_votes = 20;
    qualities.candidate_psl_votes = 20;
    qualities.formation_psl_cabinet_committed = 1;
    qualities.government_has_confidence = 0;
    qualities.democratic_candidate = 'Agnieszka Dziemianowicz-Bąk';
    engine.goToScene('poland_ministries');
    checkNumbers();
    assert.strictEqual(qualities.ministry_left_cabinet_seats, 120);
    assert.strictEqual(qualities.ministry_coalition_seats, 240);
    assert.strictEqual(qualities.ministry_leverage, 63);
    assert(
      qualities.ministry_leverage > 18,
      'A large Left victory was still capped at the historical mandate'
    );

    startStandard('ministry-excluded-psl');
    qualities = engine.state.qualities;
    qualities.left_cabinet_committed = 1;
    qualities.left_cabinet_model =
      'New Left ministers · Razem external support';
    qualities.ministry_allocation_mode = 'formation';
    qualities.left_seats = 60;
    qualities.left_committed_seats = 60;
    qualities.nowa_lewica_seats = 40;
    qualities.razem_seats = 20;
    qualities.ko_seats = 180;
    qualities.p2050_seats = 0;
    qualities.psl_seats = 20;
    qualities.candidate_left_votes = 60;
    qualities.candidate_ko_votes = 180;
    qualities.candidate_p2050_votes = 0;
    qualities.candidate_psl_votes = 6;
    qualities.formation_psl_cabinet_committed = 0;
    qualities.government_has_confidence = 0;
    qualities.democratic_candidate = 'Donald Tusk';
    engine.goToScene('poland_ministries');
    checkNumbers();
    assert.strictEqual(qualities.ministry_psl_in_cabinet, 0);
    assert.strictEqual(qualities.ministry_left_cabinet_seats, 40);
    assert.strictEqual(qualities.ministry_coalition_seats, 220);
    assert.strictEqual(qualities.ministry_leverage, 21);
    assert.strictEqual(qualities.economy_minister_party, 'KO');
    assert.strictEqual(qualities.agriculture_minister_party, 'KO');
    assert.strictEqual(qualities.defence_minister_party, 'KO');
    assert.strictEqual(
      currentChoices().find(function(choice) {
        return choice.id === 'poland_ministries.take_agriculture';
      }).canChoose,
      true,
      'An excluded PSL retained its Agriculture veto'
    );

    startStandard('ministry-left-majority');
    qualities = engine.state.qualities;
    qualities.left_cabinet_committed = 1;
    qualities.left_cabinet_model =
      'Programme-bound cooperating Left entry';
    qualities.ministry_allocation_mode = 'formation';
    qualities.left_seats = 240;
    qualities.left_committed_seats = 240;
    qualities.ko_seats = 100;
    qualities.p2050_seats = 40;
    qualities.psl_seats = 30;
    qualities.candidate_left_votes = 240;
    qualities.candidate_ko_votes = 100;
    qualities.candidate_p2050_votes = 40;
    qualities.candidate_psl_votes = 30;
    qualities.formation_psl_cabinet_committed = 1;
    qualities.government_party = 'lewica';
    qualities.democratic_candidate = 'Agnieszka Dziemianowicz-Bąk';
    engine.goToScene('poland_ministries');
    checkNumbers();
    assert.strictEqual(qualities.ministry_coalition_seats, 240);
    assert.strictEqual(qualities.ministry_leverage, 99);
    assert.strictEqual(qualities.ministry_ko_in_cabinet, 0);
    assert.strictEqual(qualities.ministry_p2050_in_cabinet, 0);
    assert.strictEqual(qualities.ministry_psl_in_cabinet, 0);
    assert.strictEqual(qualities.finance_minister_party, 'Cabinet');
    assertNamedCabinet(qualities, 'Left-majority roster');
    ['finance', 'agriculture', 'defence'].forEach(function(portfolio) {
      assert.strictEqual(
        currentChoices().find(function(choice) {
          return choice.id === 'poland_ministries.take_' + portfolio;
        }).canChoose,
        true,
        'A Left majority could not claim ' + portfolio
      );
    });

    startStandard('ministry-full-slate-without-partners');
    qualities = engine.state.qualities;
    set2023CabinetFixture(qualities);
    qualities.left_cabinet_committed = 1;
    qualities.left_cabinet_model =
      'New Left ministers · Razem external support';
    qualities.ministry_allocation_mode = 'formation';
    qualities.psl_seats = 0;
    qualities.p2050_seats = 0;
    qualities.razem_in_left_club = 0;
    qualities.razem_split = 1;
    engine.goToScene('poland_ministries');
    checkNumbers();
    const splitTakeChoices = currentChoices().filter(function(choice) {
      return choice.id.startsWith('poland_ministries.take_');
    });
    assert.strictEqual(
      splitTakeChoices.length,
      ministryPortfolioCases.length,
      'The post-Razem-split allocator hid part of the full slate'
    );
    const healthChoice = splitTakeChoices.find(function(choice) {
      return choice.id === 'poland_ministries.take_health';
    });
    assert(healthChoice, 'Health disappeared after the Razem split');
    assert.strictEqual(healthChoice.canChoose, false);
    ['digital', 'economy', 'agriculture', 'defence'].forEach(
      function(portfolio) {
        assert.strictEqual(
          qualities[portfolio + '_minister_party'],
          'KO',
          portfolio + ' was assigned to a zero-seat coalition partner'
        );
      }
    );

    ['digital', 'economy', 'agriculture', 'defence'].forEach(
      function(portfolio) {
        startStandard('ministry-return-after-partner-exit-' + portfolio);
        qualities = engine.state.qualities;
        set2023CabinetFixture(qualities);
        qualities.left_in_government = 1;
        qualities.left_cabinet_committed = 1;
        qualities.coalition_broken = 1;
        qualities.psl_seats = 0;
        qualities.p2050_seats = 0;
        qualities.ministry_allocation_mode = 'formation';
        engine.goToScene('poland_ministries');
        qualities.ministry_count = 1;
        qualities.ministry_leverage = 0;
        qualities[portfolio + '_minister_party'] = 'Lewica';
        qualities[portfolio + '_minister'] = 'Lewica incumbent';
        engine.goToScene('poland_ministries.drop_' + portfolio);
        assert.strictEqual(
          qualities[portfolio + '_minister_party'],
          'KO',
          'Returned ' + portfolio + ' to a partner that had left cabinet'
        );
      }
    );
  }

  function testCabinetReshuffle() {
    const partnerCabinet = {
      labor: ['KO', 'Marzena Okła-Drewnowicz'],
      equality: ['KO', 'Monika Rosa'],
      housing: ['KO', 'Krystyna Sibińska'],
      health: ['KO', 'Izabela Leszczyna'],
      digital: ['Poland 2050', 'Michał Gramatyka'],
      science: ['KO', 'Barbara Nowacka'],
      interior: ['KO', 'Marcin Kierwiński'],
      finance: ['KO', 'Andrzej Domański'],
      economy: ['PSL', 'Krzysztof Hetman'],
      justice: ['KO', 'Adam Bodnar'],
      foreign: ['KO', 'Radosław Sikorski'],
      agriculture: ['PSL', 'Czesław Siekierski'],
      defence: ['PSL', 'Władysław Kosiniak-Kamysz'],
    };

    function rosterSnapshot(qualities) {
      return ministryPortfolioCases.map(function(testCase) {
        return {
          portfolio: testCase.portfolio,
          party: qualities[testCase.portfolio + '_minister_party'],
          minister: qualities[testCase.portfolio + '_minister'],
        };
      });
    }

    function setupCabinet(seed) {
      startStandard(seed);
      const qualities = engine.state.qualities;
      qualities.left_in_government = 1;
      qualities.government_has_confidence = 1;
      qualities.caretaker_government = 0;
      qualities.government_party = 'ko';
      qualities.government_owner = 'KO-led democratic coalition';
      qualities.government_name = 'KO-led democratic coalition';
      qualities.prime_minister = 'Donald Tusk';
      qualities.cabinet_roster_government_party = 'ko';
      qualities.left_cabinet_committed = 1;
      qualities.left_cabinet_model =
        'New Left ministers · Razem external support';
      qualities.coalition_broken = 0;
      qualities.p2050_seats = 18;
      qualities.psl_seats = 28;
      qualities.ministry_ko_in_cabinet = 1;
      qualities.ministry_p2050_in_cabinet = 1;
      qualities.ministry_psl_in_cabinet = 1;
      qualities.ministries_finalized = 1;
      qualities.ministry_allocation_mode = 'settled';
      qualities.ministry_return_mode = 'cabinet_program';
      Object.keys(partnerCabinet).forEach(function(portfolio) {
        qualities[portfolio + '_minister_party'] =
          partnerCabinet[portfolio][0];
        qualities[portfolio + '_minister'] = partnerCabinet[portfolio][1];
      });
      qualities.labor_minister_party = 'Lewica';
      qualities.labor_minister = 'Agnieszka Dziemianowicz-Bąk';
      qualities.family_minister_party = 'Lewica';
      qualities.family_minister = 'Agnieszka Dziemianowicz-Bąk';
      qualities.digital_minister_party = 'Lewica';
      qualities.digital_minister = 'Krzysztof Gawkowski';
      qualities.ministry_count = 2;
      qualities.month_actions = 0;
      qualities.leadership_reshuffle_timer = 3;
      qualities.poland_cabinet_reshuffle_timer = 0;
      engine.goToScene('poland_hub');
      checkNumbers();
      assert.strictEqual(qualities.ministry_count, 2);
      return qualities;
    }

    let qualities = setupCabinet('cabinet-reshuffle-trade');
    assert(
      drawableCardIds('poland_government_deck')
        .includes('poland_cabinet_reshuffle'),
      'Cabinet Reshuffle was not drawable for a settled Lewica cabinet'
    );
    const rosterBefore = rosterSnapshot(qualities);
    const previousLeadershipActions = qualities.leadership_actions_taken;
    const visitStart = visited.length;
    engine.goToScene('poland_cabinet_reshuffle');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_cabinet_reshuffle');
    assert.strictEqual(qualities.poland_cabinet_reshuffle_timer, 6);
    assert.strictEqual(qualities.leadership_reshuffle_timer, 3);
    assert.strictEqual(
      qualities.month_actions,
      0,
      'Opening the reshuffle dossier consumed the action before acceptance'
    );

    choose('poland_cabinet_reshuffle.renegotiate');
    assert.strictEqual(engine.state.sceneId, 'poland_ministries.menu');
    assert.strictEqual(qualities.month_actions, 1);
    assert.strictEqual(qualities.leadership_reshuffle_timer, 3);
    assert.strictEqual(qualities.ministry_reshuffle_previous_count, 2);
    assert.deepStrictEqual(
      rosterSnapshot(qualities),
      rosterBefore,
      'Entering a live reshuffle replaced the sitting cabinet'
    );
    const reshuffleLeverage = qualities.ministry_base_leverage - 9;
    assert.strictEqual(qualities.ministry_leverage, reshuffleLeverage);

    choose('poland_ministries.drop_digital');
    assert.strictEqual(qualities.ministry_count, 1);
    assert.strictEqual(qualities.ministry_leverage, reshuffleLeverage + 4);
    choose('poland_ministries.take_science');
    assert.strictEqual(qualities.ministry_count, 2);
    assert.strictEqual(qualities.ministry_leverage, reshuffleLeverage);
    assert.strictEqual(qualities.digital_minister_party, 'Poland 2050');
    assert.strictEqual(qualities.science_minister_party, 'Lewica');
    assert.strictEqual(qualities.ministry_reshuffle_changes, 2);

    choose('poland_ministries.finalize');
    const monthlyRoute = visited.slice(visitStart);
    assert(monthlyRoute.includes('poland_cabinet_reshuffle'));
    assert(monthlyRoute.includes('poland_ministries'));
    assert(
      monthlyRoute.includes('poland_card_finish'),
      'Accepted reshuffle bypassed the normal card finish'
    );
    assert(
      monthlyRoute.includes('poland_advance'),
      'Accepted reshuffle did not turn the month'
    );
    assert(
      monthlyRoute.includes('poland_party_ai'),
      'Accepted reshuffle bypassed the monthly political flow'
    );
    assert.strictEqual(engine.state.sceneId, 'poland_events.candidate');
    assert.strictEqual(qualities.ministry_count, 2);
    assert.strictEqual(qualities.labor_minister_party, 'Lewica');
    assert.strictEqual(qualities.digital_minister_party, 'Poland 2050');
    assert.strictEqual(qualities.science_minister_party, 'Lewica');
    assert.strictEqual(qualities.month_actions, 0);
    assert.strictEqual(qualities.poland_cabinet_reshuffle_timer, 5);
    assert.strictEqual(qualities.leadership_reshuffle_timer, 2);
    assert.strictEqual(
      qualities.leadership_actions_taken,
      previousLeadershipActions + 1
    );

    qualities = setupCabinet('cabinet-reshuffle-decline');
    const declinedRoster = rosterSnapshot(qualities);
    engine.goToScene('poland_cabinet_reshuffle');
    checkNumbers();
    assert.strictEqual(qualities.month_actions, 0);
    choose('poland_cabinet_reshuffle.keep');
    assert.strictEqual(engine.state.sceneId, 'poland_cabinet_reshuffle.keep');
    assert.strictEqual(qualities.month_actions, 1);
    assert.strictEqual(qualities.poland_cabinet_reshuffle_timer, 6);
    assert.strictEqual(qualities.leadership_reshuffle_timer, 3);
    assert.deepStrictEqual(rosterSnapshot(qualities), declinedRoster);
    choose('poland_card_finish');
    assert.strictEqual(engine.state.sceneId, 'poland_events.candidate');
    assert.strictEqual(qualities.month_actions, 0);
    assert.strictEqual(qualities.poland_cabinet_reshuffle_timer, 5);

    qualities = setupCabinet('cabinet-dated-exit-after-psl-resignation');
    qualities.formation_continuous = 1;
    qualities.coalition_seats = qualities.sejm_total;
    engine.goToScene('poland_government_formation.coalition_break');
    choose('poland_government_formation.coalition_minority');
    assert.strictEqual(qualities.coalition_broken, 1);
    ['economy', 'agriculture', 'defence'].forEach(function(portfolio) {
      assert.strictEqual(
        qualities[portfolio + '_minister_party'],
        'KO',
        'PSL resignation left ' + portfolio + ' in PSL hands'
      );
    });
    const exitPartnerSeats = Math.min(
      qualities.sejm_total,
      qualities.ko_seats +
        (qualities.ministry_p2050_in_cabinet
          ? qualities.p2050_seats
          : 0)
    );
    engine.goToScene('poland_events_2025.cabinet_reshuffle_2025');
    choose('poland_events_2025.reshuffle_exit');
    checkNumbers();
    assert.strictEqual(qualities.left_in_government, 0);
    assert.strictEqual(
      qualities.left_cabinet_model,
      'Confidence and supply from opposition'
    );
    assert.strictEqual(
      qualities.coalition_seats,
      exitPartnerSeats,
      'Leaving the July cabinet retained stale confidence-vote seats'
    );
    ['economy', 'agriculture', 'defence'].forEach(function(portfolio) {
      assert.notStrictEqual(
        qualities[portfolio + '_minister_party'],
        'PSL',
        'July exit silently readmitted PSL to ' + portfolio
      );
    });

    qualities = setupCabinet('cabinet-reshuffle-opposition-entry');
    qualities.coalition_broken = 0;
    qualities.left_in_government = 0;
    qualities.left_cabinet_committed = 0;
    qualities.ko_relation = 50;
    qualities.labor_minister_party = 'KO';
    qualities.labor_minister = 'Marzena Okła-Drewnowicz';
    qualities.family_minister_party = 'KO';
    qualities.family_minister = 'Marzena Okła-Drewnowicz';
    qualities.digital_minister_party = 'Poland 2050';
    qualities.digital_minister = 'Michał Gramatyka';
    qualities.ministry_count = 0;
    qualities.budget = 0;
    const partnerCabinetSeats = Math.min(
      qualities.sejm_total,
      qualities.ko_seats +
        qualities.p2050_seats +
        qualities.psl_seats
    );
    engine.goToScene('poland_events_2025.cabinet_reshuffle_2025');
    checkNumbers();
    assert.strictEqual(qualities.poland_cabinet_reshuffle_timer, 6);
    choose('poland_events_2025.reshuffle_opposition_entry');
    assert.strictEqual(engine.state.sceneId, 'poland_ministries.menu');
    assert.strictEqual(qualities.left_in_government, 1);
    assert.strictEqual(qualities.left_cabinet_committed, 1);
    assert.strictEqual(qualities.coalition_broken, 0);
    assert.strictEqual(
      qualities.left_cabinet_model,
      'New Left ministers · Razem external support'
    );
    assert.strictEqual(qualities.position, 'Coalition government');
    assert(qualities.budget >= 2);
    assert.strictEqual(
      qualities.coalition_seats,
      partnerCabinetSeats,
      'July cabinet entry double-counted external confidence votes'
    );
    choose('poland_ministries.take_labor');
    choose('poland_ministries.finalize');
    checkNumbers();
    assert.strictEqual(
      qualities.left_in_government,
      1,
      'July opposition entry was erased after normalization'
    );
    assert.strictEqual(
      qualities.labor_minister_party,
      'Lewica',
      'July opposition entry did not preserve its negotiated ministry'
    );
    assert.strictEqual(
      qualities.coalition_seats,
      Math.min(
        qualities.sejm_total,
        partnerCabinetSeats + qualities.ministry_left_cabinet_seats
      ),
      'Finalising a Left portfolio did not add its cabinet delegation once'
    );

    [
      {
        seed: 'cabinet-formation-supply',
        choice: 'poland_events_2025.formation_supply_2025',
        model: 'Confidence and supply from opposition',
      },
      {
        seed: 'cabinet-formation-replacement',
        choice: 'poland_events_2025.formation_replacement_2025',
        model: 'Opposition to a replacement cabinet',
      },
    ].forEach(function(route) {
      startStandard(route.seed);
      qualities = engine.state.qualities;
      qualities.government_has_confidence = 0;
      qualities.caretaker_government = 1;
      qualities.left_in_government = 1;
      qualities.left_cabinet_committed = 1;
      qualities.left_seats = 30;
      qualities.left_committed_seats = qualities.left_seats;
      qualities.ko_seats = 170;
      qualities.p2050_seats = 30;
      qualities.psl_seats = 30;
      qualities.centrum_seats = 0;
      qualities.p2050_relation = 70;
      qualities.psl_relation = 70;
      qualities.p2050_coalition_dissent = 10;
      qualities.psl_coalition_dissent = 10;
      qualities.president_name = 'Andrzej Duda';
      qualities.president_relation = 100;
      qualities.pres_2025_hostile_president = 0;
      qualities.left_cabinet_model =
        'New Left ministers · Razem external support';
      qualities.coalition_seats = qualities.sejm_total;
      const expectedPartnerSeats = Math.min(
        qualities.sejm_total,
        qualities.ko_seats +
          qualities.p2050_seats +
          qualities.centrum_seats +
          qualities.psl_seats
      );
      engine.goToScene('poland_events_2025.cabinet_reshuffle_2025');
      choose(route.choice);
      checkNumbers();
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events_2025.formation_designation_2025'
      );
      assert.strictEqual(
        qualities.caretaker_government,
        1,
        'A formation offer installed a cabinet before investiture'
      );
      assert.strictEqual(qualities.government_has_confidence, 0);
      assert.strictEqual(
        qualities.formation_2025_designation_accepted,
        1,
        route.seed + ' was unexpectedly refused by the Palace'
      );
      choose('poland_events_2025.formation_palace_accept_2025');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events_2025.formation_investiture_2025'
      );
      assert.strictEqual(
        qualities.confidence_threshold,
        Math.floor(qualities.confidence_present / 2) + 1,
        'Article 154 investiture did not use an absolute majority of votes'
      );
      assert.strictEqual(
        qualities.formation_2025_passed,
        1,
        route.seed + ' investiture failed unexpectedly: ' +
          qualities.confidence_yes + '/' +
          qualities.confidence_no + '/' +
          qualities.confidence_abstain +
          ', threshold ' + qualities.confidence_threshold +
          ', core ' + qualities.formation_2025_core_pool +
          ', left ' + qualities.formation_2025_left_pool
      );
      choose('poland_events_2025.formation_record_2025');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events_2025.formation_success_2025'
      );
      choose('poland_events_2025.formation_success_opposition_2025');
      assert.strictEqual(qualities.left_in_government, 0);
      assert.strictEqual(qualities.left_cabinet_committed, 0);
      assert.strictEqual(qualities.left_cabinet_model, route.model);
      assert.strictEqual(
        qualities.coalition_seats,
        expectedPartnerSeats,
        route.choice + ' retained phantom Left cabinet seats'
      );
    });

    startStandard('cabinet-formation-return');
    qualities = engine.state.qualities;
    qualities.government_has_confidence = 0;
    qualities.caretaker_government = 1;
    qualities.coalition_broken = 1;
    qualities.left_in_government = 0;
    qualities.left_cabinet_committed = 0;
    qualities.left_seats = 30;
    qualities.left_committed_seats = qualities.left_seats;
    qualities.nowa_lewica_seats = 20;
    qualities.razem_seats = 10;
    qualities.ko_seats = 170;
    qualities.p2050_seats = 30;
    qualities.psl_seats = 30;
    qualities.centrum_seats = 0;
    qualities.p2050_relation = 70;
    qualities.psl_relation = 70;
    qualities.p2050_coalition_dissent = 10;
    qualities.psl_coalition_dissent = 10;
    qualities.president_name = 'Andrzej Duda';
    qualities.president_relation = 100;
    qualities.pres_2025_hostile_president = 0;
    qualities.coalition_seats = 0;
    const rebuiltCabinetSeats = Math.min(
      qualities.sejm_total,
      qualities.ko_seats +
        qualities.p2050_seats +
        qualities.centrum_seats +
        qualities.psl_seats +
        qualities.nowa_lewica_seats
    );
    engine.goToScene('poland_events_2025.cabinet_reshuffle_2025');
    choose('poland_events_2025.formation_return_2025');
    checkNumbers();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.formation_designation_2025'
    );
    assert.strictEqual(qualities.caretaker_government, 1);
    assert.strictEqual(qualities.formation_2025_designation_accepted, 1);
    choose('poland_events_2025.formation_palace_accept_2025');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.formation_investiture_2025'
    );
    assert.strictEqual(qualities.formation_2025_passed, 1);
    choose('poland_events_2025.formation_record_2025');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.formation_success_2025'
    );
    choose('poland_events_2025.formation_success_ministries_2025');
    assert.strictEqual(engine.state.sceneId, 'poland_ministries.menu');
    assert.strictEqual(qualities.left_in_government, 1);
    assert.strictEqual(qualities.coalition_broken, 0);
    assert.strictEqual(qualities.caretaker_government, 0);
    assert.strictEqual(
      qualities.coalition_seats,
      rebuiltCabinetSeats,
      'Rebuilt July cabinet did not derive its formal party seats'
    );

    startStandard('cabinet-formation-palace-refusal');
    qualities = engine.state.qualities;
    qualities.government_has_confidence = 0;
    qualities.caretaker_government = 1;
    qualities.left_in_government = 0;
    qualities.left_seats = 20;
    qualities.left_committed_seats = 20;
    qualities.ko_seats = 100;
    qualities.p2050_seats = 10;
    qualities.psl_seats = 10;
    qualities.centrum_seats = 0;
    qualities.president_name = 'Andrzej Duda';
    qualities.president_relation = 0;
    qualities.pres_2025_hostile_president = 1;
    const refusalCaretaker = qualities.prime_minister;
    engine.goToScene('poland_events_2025.cabinet_reshuffle_2025');
    choose('poland_events_2025.formation_replacement_2025');
    assert.strictEqual(qualities.formation_2025_designation_accepted, 0);
    assert.strictEqual(qualities.prime_minister, refusalCaretaker);
    choose('poland_events_2025.formation_palace_refuse_2025');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2026.snap_formation_attempt_two'
    );
    assert.strictEqual(qualities.caretaker_government, 1);
    assert.strictEqual(qualities.government_has_confidence, 0);
    assert.strictEqual(qualities.formation_in_progress, 1);
    assert.strictEqual(qualities.prime_minister, refusalCaretaker);

    startStandard('cabinet-formation-failed-first-attempt');
    qualities = engine.state.qualities;
    qualities.government_has_confidence = 0;
    qualities.caretaker_government = 1;
    qualities.left_in_government = 0;
    qualities.left_seats = 30;
    qualities.left_committed_seats = 30;
    qualities.ko_seats = 150;
    qualities.p2050_seats = 20;
    qualities.psl_seats = 20;
    qualities.centrum_seats = 0;
    qualities.prime_minister = 'Donald Tusk';
    qualities.president_name = 'Andrzej Duda';
    qualities.president_relation = 100;
    qualities.pres_2025_hostile_president = 0;
    engine.goToScene('poland_events_2025.cabinet_reshuffle_2025');
    choose('poland_events_2025.formation_return_2025');
    assert.strictEqual(qualities.formation_2025_designation_accepted, 1);
    choose('poland_events_2025.formation_palace_accept_2025');
    assert.strictEqual(qualities.formation_2025_passed, 0);
    choose('poland_events_2025.formation_record_2025');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.formation_failure_2025'
    );
    choose('poland_events_2025.formation_failure_return_2025');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2026.snap_formation_attempt_two'
    );
    assert.strictEqual(qualities.caretaker_government, 1);
    assert.strictEqual(qualities.government_has_confidence, 0);
    assert.strictEqual(qualities.formation_in_progress, 1);
  }

  function testArticle155MinistryAllocation() {
    const routes = [
      {
        id: 'poland_government_formation.third_reassemble',
        candidate: 'Donald Tusk',
        model: 'Whole Left coalition delegation',
        leverage: 16,
      },
      {
        id: 'poland_government_formation.third_presidential_compromise',
        candidate: 'Władysław Kosiniak-Kamysz',
        model: 'New Left ministers · Razem external support',
        leverage: 10,
        palace: true,
      },
    ];

    routes.forEach(function(route) {
      engine.beginGame(['article-155-ministry-' + route.candidate]);
      assert.strictEqual(engine.state.sceneId, 'root.start_menu');
      choose('root.formation_game');
      choose('root.formation_standard');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_election.results_2023'
      );
      const qualities = engine.state.qualities;
      if (route.palace) {
        qualities.president_relation = 28;
      }

      engine.goToScene('poland_government_formation.third_attempt');
      checkNumbers();
      choose(route.id);
      assert.strictEqual(
        engine.state.sceneId,
        'poland_government_formation.third_confidence_roll'
      );
      assert.strictEqual(qualities.third_confidence_passed, 1);
      assert.strictEqual(qualities.confidence_stage, 4);
      assert.strictEqual(qualities.left_cabinet_committed, 1);
      assert.strictEqual(qualities.left_cabinet_model, route.model);
      assert.strictEqual(
        qualities.ministry_return_mode,
        'governing_agreement'
      );

      choose('poland_government_formation.third_vote_continue');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_government_formation.third_success'
      );
      assert.strictEqual(qualities.prime_minister, route.candidate);
      assert.strictEqual(qualities.left_in_government, 1);
      assert.strictEqual(qualities.ministries_finalized, 0);
      assert.strictEqual(qualities.budget, 5);

      choose('poland_government_formation.government_entry_gate');
      assert.strictEqual(engine.state.sceneId, 'poland_ministries.menu');
      assert.strictEqual(qualities.ministry_leverage, route.leverage);
      choose('poland_ministries.take_labor');
      choose('poland_ministries.finalize');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_government_formation.governing_agreement'
      );
      assert.strictEqual(qualities.ministries_finalized, 1);
      assert.strictEqual(qualities.ministry_count, 1);
      assert.strictEqual(qualities.labor_minister_party, 'Lewica');
      assert.strictEqual(qualities.confidence_stage, 4);
      assert.strictEqual(qualities.budget, 5);
    });
  }

  function testDynamicGovernmentPartyColors() {
    const cases = [
      {
        name: 'Mateusz Morawiecki',
        government: 'PiS–United Right majority',
        party: 'pis',
      },
      {
        name: 'Donald Tusk',
        government: 'Donald Tusk democratic coalition',
        party: 'ko',
      },
      {
        name: 'Agnieszka Dziemianowicz-Bąk',
        government: 'Lewica-led democratic coalition',
        party: 'lewica',
      },
      {
        name: 'Jan Kowalski',
        government: 'Non-partisan caretaker cabinet',
        party: 'other',
      },
    ];

    cases.forEach(function(testCase) {
      startStandard('status-government-color-' + testCase.party);
      const qualities = engine.state.qualities;
      qualities.prime_minister = testCase.name;
      qualities.government_name = testCase.government;
      // Exercise legacy-save inference only when no authoritative cabinet
      // owner is recorded.  A valid explicit owner (especially
      // "independent") must survive normalisation unchanged.
      qualities.government_party = '';
      qualities.government_owner = '';
      engine.goToScene('status');
      checkNumbers();
      assert.strictEqual(
        qualities.status_prime_minister_party,
        testCase.party
      );
      assert.strictEqual(qualities.status_government_party, testCase.party);

      const rendered = contentText(engine.state.currentContent);
      const partyClass = testCase.party === 'other'
        ? 'party'
        : 'party party-' + testCase.party;
      assert(
        rendered.includes('<span class="' + partyClass + '">') &&
          rendered.includes(testCase.name),
        'Prime-minister color did not follow ' + testCase.party
      );
      assert(
        rendered.includes('<span class="' + partyClass + '">') &&
          rendered.includes(testCase.government),
        'Cabinet color did not follow ' + testCase.party
      );
    });
  }

  function testDynamicLeftIdentity() {
    const cases = [
      ['Zjednoczona Lewica', {}],
      ['SLD', {
        spring_active: 0,
        spring_in_left: 0,
        spring_party_formed: 1,
      }],
      ['Nowa Lewica', {rename_event_done: 1, spring_merged: 1}],
      ['Lewica Razem', {
        rename_event_done: 1,
        spring_merged: 1,
        razem_strength: 45,
      }],
      ['Partia Pracy', {
        rename_event_done: 1,
        spring_merged: 1,
        labor_strength: 50,
        dziemianowicz_bak_advisor: 1,
      }],
      ['Wspólne Jutro', {
        rename_event_done: 1,
        spring_merged: 1,
        progressives_strength: 50,
        zukowska_advisor: 1,
      }],
      ['Wiosna-SLD', {spring_strength: 50}],
    ];

    cases.forEach(function(testCase, index) {
      startStandard('dynamic-left-identity-' + index);
      const expected = testCase[0];
      const qualities = engine.state.qualities;
      Object.assign(qualities, testCase[1]);
      engine.goToScene('poland_normalize');
      assert.strictEqual(qualities.left_party_name, expected);
      engine.goToScene('status');
      assert.strictEqual(qualities.status_left_party_name, expected);
      const statusContent = contentText(engine.state.currentContent);
      const pulseNameStart = statusContent.indexOf(
        '<span class="party party-lewica pulse-party-name">'
      );
      assert(
        pulseNameStart >= 0 &&
          statusContent.slice(pulseNameStart, pulseNameStart + 180)
            .includes(expected),
        'Campaign pulse omitted the live Left identity: ' + expected
      );
    });
  }

  function testPersistentParliamentSeatChart() {
    startStandard('persistent-parliament-seat-chart');
    const qualities = engine.state.qualities;
    qualities.pis_seats = 194;
    qualities.ko_seats = 157;
    qualities.left_seats = 26;
    qualities.senate_pis_seats = 34;
    qualities.senate_ko_seats = 41;
    qualities.senate_left_seats = 9;
    engine.goToScene('status');
    checkNumbers();

    const rendered = contentText(engine.state.currentContent)
      .replace(/\s+/g, ' ');
    assert(
      rendered.includes('Parliament seats') &&
        rendered.includes('Sejm 460 · Senate'),
      'The persistent status view omitted the combined parliament chart'
    );
    assert(
      rendered.includes('194 seats') && rendered.includes('157 seats') &&
        rendered.includes('34 seats') && rendered.includes('41 seats'),
      'The persistent parliament chart did not use live chamber seat totals'
    );
  }

  function testLiveDossier() {
    startStandard('live-dossier');
    let qualities = engine.state.qualities;
    assert.deepStrictEqual(
      qualities.poll_history.map(function(record) { return record.date; }),
      ['2019-10-01'],
      'The campaign did not seed its opening poll history'
    );

    engine.goToScene('library');
    assert.strictEqual(engine.state.sceneId, 'library.menu');
    const dossierChoices = currentChoices().map(function(choice) {
      return choice.id;
    });
    [
      'library.overview',
      'library.parliament',
      'library.cabinet',
      'library.polling',
      'library.parties',
      'library.institutions',
      'library.economy',
      'library.foreign',
      'library.rules',
    ].forEach(function(sceneId) {
      assert(
        dossierChoices.includes(sceneId),
        'The dossier index omitted ' + sceneId
      );
    });

    choose('library.parliament');
    assert.strictEqual(
      qualities.dossier_sejm_chart_data.reduce(function(total, party) {
        return total + party.seats;
      }, 0),
      460,
      'The opening Sejm chart did not contain all 460 MPs'
    );
    assert.strictEqual(
      qualities.dossier_senate_chart_data.reduce(function(total, party) {
        return total + party.seats;
      }, 0),
      100,
      'The opening Senate chart did not contain all 100 senators'
    );
    let rendered = contentText(engine.state.currentContent);
    assert(
      rendered.includes('dossier-sejm') &&
        rendered.includes('dossier-senate') &&
        rendered.includes('Majority:'),
      'The dossier did not render both chamber chart containers'
    );

    qualities.year = 2019;
    qualities.month = 11;
    qualities.month_name = 'November';
    qualities.date_label = 'November 2019';
    qualities.candidate_event_done = 1;
    qualities.poll_state_month_key = -1;
    engine.goToScene('poland_polling');
    assert.deepStrictEqual(
      qualities.poll_history.map(function(record) { return record.date; }),
      ['2019-10-01', '2019-11-01'],
      'The monthly poll did not append exactly one dated history point'
    );

    qualities.year = 2023;
    qualities.month = 12;
    qualities.date_label = 'December 2023';
    qualities.government_party = 'ko';
    qualities.government_name = 'Democratic coalition cabinet';
    qualities.caretaker_government = 0;
    qualities.left_in_government = 0;
    qualities.cabinet_roster_government_party = 'unassigned';
    engine.goToScene('library');
    choose('library.cabinet');
    rendered = contentText(engine.state.currentContent);
    assert(
      rendered.includes('Council of Ministers') &&
        rendered.includes('Andrzej Domański') &&
        rendered.includes('Radosław Sikorski'),
      'The dossier cabinet page did not use the live minister roster: ' +
        qualities.finance_minister + ' / ' + qualities.foreign_minister +
        ' in ' + rendered
    );

    engine.goToScene('library');
    choose('library.polling');
    rendered = contentText(engine.state.currentContent);
    assert(
      rendered.includes('dossier-poll-history') &&
        rendered.includes('Projected MPs') &&
        qualities.dossier_poll_points === 2,
      'The dossier poll page did not expose its graph and live projection'
    );
  }

  function drawFromDeck(deckId) {
    assertHandHub();
    const hand = engine.state.currentHands.poland_hub;
    const previousLength = hand.length;
    assert(previousLength < 3, 'Smoke test attempted to overfill the hand');

    const card = engine.drawCard(deckId);
    assert(card && card.id, 'No drawable card in ' + deckId);
    assert.strictEqual(hand.length, previousLength + 1);
    assert.strictEqual(hand[hand.length - 1].id, card.id);

    const cardScene = game.scenes[card.id];
    assert(cardScene, 'Drawn card scene is missing: ' + card.id);
    assert.strictEqual(cardScene.isCard, true, card.id + ' is not a native card');
    assert(
      (cardScene.tags || []).includes(deckTags[deckId]),
      card.id + ' was drawn from the wrong Polish deck'
    );
    assert(
      card.id.startsWith('poland_'),
      'Polish deck drew a legacy card: ' + card.id
    );

    decksUsed.add(deckId);
    return card;
  }

  function resourceCost(choice) {
    const description =
      contentText(choice.title) + ' ' + contentText(choice.subtitle);
    const match = description.match(/\bCost:\s*(\d+)/i);
    return match ? Number(match[1]) : 0;
  }

  function chooseResourceSafeOutcome() {
    const choices = currentChoices();
    const choosable = choices.filter(function(choice) {
      return choice.canChoose && choice.id !== 'root';
    });
    assert(
      choosable.length > 0,
      'Played card ' + engine.state.sceneId + ' has no choosable outcome'
    );

    const cheapestCost = Math.min.apply(
      null,
      choosable.map(resourceCost)
    );
    const selected = choosable.find(function(choice) {
      return resourceCost(choice) === cheapestCost;
    });

    choose(selected.id);
    return selected.id;
  }

  function playAgendaCard(card) {
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    const hand = engine.state.currentHands.poland_hub;
    assert(
      hand.some(function(heldCard) {
        return heldCard.id === card.id;
      }),
      'Card is not present in hand: ' + card.id
    );

    const previousActions =
      engine.state.qualities.leadership_actions_taken;
    const previousNeglect = engine.state.qualities.neglected_months;
    const visitStart = visited.length;

    engine.playCard(card.id);
    checkNumbers();
    const expectedScene = card.id === 'poland_senate_docket'
      ? 'poland_senate.ordinary_bill'
      : card.id;
    assert.strictEqual(engine.state.sceneId, expectedScene);
    assert(
      !engine.state.currentHands.poland_hub.some(function(heldCard) {
        return heldCard.id === card.id;
      }),
      'Played card remained in the hand: ' + card.id
    );
    assert.strictEqual(engine.state.qualities.month_actions, 1);

    const outcomeId = chooseResourceSafeOutcome();
    assert.notStrictEqual(outcomeId, card.id);
    choose('poland_card_finish');

    const route = visited.slice(visitStart);
    assert(route.includes(card.id), 'Card scene was not entered: ' + card.id);
    assert(
      route.includes('poland_card_finish'),
      'Card outcome bypassed poland_card_finish: ' + card.id
    );
    assert(
      route.includes('poland_advance'),
      'Card outcome bypassed poland_advance: ' + card.id
    );
    assert(
      route.includes('poland_party_ai'),
      'Monthly advance bypassed rival-party AI: ' + card.id
    );
    assert.strictEqual(
      engine.state.qualities.leadership_actions_taken,
      previousActions + 1,
      'Playing a card did not consume exactly one monthly leadership action'
    );
    assert.strictEqual(
      engine.state.qualities.neglected_months,
      previousNeglect,
      'Playing a card incorrectly counted as neglect'
    );
    assert.strictEqual(engine.state.qualities.month_actions, 0);
    assertPollingModel({requireNormalizedHeadline: false});

    cardsPlayed.push(card.id);
  }

  function playOppositionBudgetStages(priorityOne, priorityTwo, tactic) {
    if (engine.state.sceneId === 'poland_opposition_budget.audit') {
      choose('poland_opposition_budget.audit_continue');
    }
    assert.strictEqual(
      engine.state.sceneId,
      'poland_opposition_budget.read_draft'
    );
    choose('poland_opposition_budget.priorities');
    choose(priorityOne || 'poland_opposition_budget.priority_wages');
    choose(priorityTwo || 'poland_opposition_budget.priority_services');
    choose('poland_opposition_budget.conference_free_vote');
    choose(tactic || 'poland_opposition_budget.tactic_against');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_opposition_budget.resolve'
    );
    choose('poland_opposition_budget.complete');
  }

  function resolveEvent(sceneId) {
    switch (sceneId) {
    case 'poland_opposition_budget.audit':
    case 'poland_opposition_budget.read_draft': {
      // The dated budget wrapper deliberately routes straight into the
      // shared opposition process. Preserve the logical dated-event identity
      // in the corpus while testing the staged implementation it advertises.
      const routedBudgetYear = engine.state.qualities.annual_budget_year;
      playOppositionBudgetStages(
        routedBudgetYear === 2022
          ? 'poland_opposition_budget.priority_security'
          : undefined,
        routedBudgetYear === 2022
          ? 'poland_opposition_budget.priority_energy_refugees'
          : undefined
      );
      if (routedBudgetYear === 2019 || routedBudgetYear === 2020) {
        const senateBudget =
          'poland_senate.budget_' + routedBudgetYear;
        assert.strictEqual(engine.state.sceneId, senateBudget);
        chooseFirstAvailable(
          routedBudgetYear === 2019
            ? [
                'poland_senate.budget_2019_common',
                'poland_senate.budget_2019_broker',
                'poland_senate.budget_2019_record',
              ]
            : [
                'poland_senate.budget_2020_social',
                'poland_senate.budget_2020_local',
                'poland_senate.budget_2020_equality',
                'poland_senate.budget_2020_selective',
                'poland_senate.budget_2020_record',
              ]
        );
        choose(senateBudget + '_return_vote');
        choose(senateBudget + '_complete');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    }
    case 'poland_events.candidate':
      choose('poland_events.candidate_biedron');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events.candidate_biedron',
        'The nominee response was cleared before it could be read'
      );
      choose('poland_events_2021_2023.independence_2019');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events_2021_2023.independence_2019'
      );
      chooseFirstAvailable([
        'poland_events_2021_2023.ind19_civic',
        'poland_events_2021_2023.ind19_counter',
        'poland_events_2021_2023.ind19_monitor',
      ]);
      returnToHub();
      break;
    case 'poland_events.budget_2019':
      chooseFirstAvailable([
        'poland_events.budget_2019_shadow',
        'poland_events.budget_2019_deal',
        'poland_events.budget_2019_fragments',
      ]);
      if (engine.state.sceneId !== 'poland_hub') {
        choose('poland_hub');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_leadership_events.po_handoff_2020':
      choose('poland_leadership_events.budka_social');
      assert.strictEqual(engine.state.sceneId, 'poland_events.media');
      assert.strictEqual(engine.state.qualities.ko_leader, 'Borys Budka');
      chooseFirstAvailable([
        'poland_events.media_newsroom',
        'poland_events.media_personalities',
        'poland_events.media_wait',
      ]);
      returnToHub();
      break;
    case 'poland_events.media':
      chooseFirstAvailable([
        'poland_events.media_newsroom',
        'poland_events.media_personalities',
        'poland_events.media_wait',
      ]);
      returnToHub();
      break;
    case 'poland_monthly_briefing':
      returnToHub();
      break;
    case 'poland_events.covid':
      chooseFirstAvailable([
        'poland_events.covid_social',
        'poland_events.covid_legal',
        'poland_events.covid_unity',
        'poland_events.covid_liberty',
      ]);
      returnToHub();
      break;
    case 'poland_events.postal':
      chooseFirstAvailable([
        'poland_events.postal_front',
        'poland_events.postal_gowin',
        'poland_events.postal_boycott',
        'poland_events.postal_compete',
      ]);
      returnToHub();
      break;
    case 'poland_leadership_events.ko_candidate_replacement_2020':
      choose('poland_leadership_events.kidawa_rules');
      assert.strictEqual(engine.state.sceneId, 'poland_events.shield');
      assert.strictEqual(
        engine.state.qualities.ko_presidential_candidate_2020,
        'Rafał Trzaskowski'
      );
      chooseFirstAvailable([
        'poland_events.shield_local',
        'poland_events.shield_wages',
        'poland_events.shield_maximal',
        'poland_events.shield_wait',
      ]);
      returnToHub();
      break;
    case 'poland_events.shield':
      chooseFirstAvailable([
        'poland_events.shield_local',
        'poland_events.shield_wages',
        'poland_events.shield_maximal',
        'poland_events.shield_wait',
      ]);
      returnToHub();
      break;
    case 'poland_presidential_election.setup':
      playPresidentialCandidateRollout();
      choose('poland_presidential_election.separate_candidate');
      choose('poland_presidential_election.campaign_menu');
      choose('poland_presidential_election.campaign_work');
      choose('poland_presidential_election.campaign_constitution');
      playPresidentialDebate();
      choose('poland_presidential_election.first_count');
      choose('poland_presidential_election.wait_for_runoff');
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_presidential_election.runoff_setup':
      choose('poland_presidential_election.endorsement_choice');
      choose('poland_presidential_election.endorse_free');
      choose('poland_presidential_election.support_turnout');
      choose('poland_presidential_election.support_release');
      choose('poland_presidential_election.final_push_safe');
      choose('poland_presidential_election.runoff_consequences');
      returnToHub();
      break;
    case 'poland_trzaskowski.certification':
      chooseFirstAvailable([
        'poland_trzaskowski.certification_legal',
        'poland_trzaskowski.certification_public',
        'poland_trzaskowski.certification_bargain',
      ]);
      chooseFirstAvailable([
        'poland_trzaskowski.begin_cohabitation',
        'poland_trzaskowski.force_oath',
        'poland_trzaskowski.mobilised_oath',
        'poland_trzaskowski.accept_repeat',
      ]);
      if ([
        'poland_trzaskowski.force_oath',
        'poland_trzaskowski.mobilised_oath',
        'poland_trzaskowski.accept_repeat',
      ].includes(engine.state.sceneId)) {
        choose('poland_trzaskowski.certification_continue');
      }
      if (engine.state.sceneId ===
          'poland_leadership_events.p2050_foundation_2020') {
        choose('poland_leadership_events.p2050_institutions');
        choose('poland_leadership_events.p2050_2020_continue');
        returnToHub();
        break;
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_leadership_events.p2050_foundation_2020':
      assert.strictEqual(
        engine.state.qualities.p2050_foundation_2020_done,
        1,
        'Poland 2050 foundation on-arrival did not execute'
      );
      choose('poland_leadership_events.p2050_institutions');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_leadership_events.p2050_institutions',
        'The Polska 2050 response was cleared before it could be read'
      );
      choose('poland_leadership_events.p2050_2020_continue');
      assert.strictEqual(
        engine.state.qualities.p2050_foundation_2020_done,
        1,
        'Foundation flag reset while leaving its response choice'
      );
      assert.strictEqual(
        engine.state.qualities.p2050_leader,
        'Szymon Hołownia'
      );
      if (engine.state.sceneId === 'poland_trzaskowski.certification') {
        chooseFirstAvailable([
          'poland_trzaskowski.certification_legal',
          'poland_trzaskowski.certification_public',
          'poland_trzaskowski.certification_bargain',
        ]);
        chooseFirstAvailable([
          'poland_trzaskowski.begin_cohabitation',
          'poland_trzaskowski.force_oath',
          'poland_trzaskowski.mobilised_oath',
          'poland_trzaskowski.accept_repeat',
        ]);
        if ([
          'poland_trzaskowski.force_oath',
          'poland_trzaskowski.mobilised_oath',
          'poland_trzaskowski.accept_repeat',
        ].includes(engine.state.sceneId)) {
          choose('poland_trzaskowski.certification_continue');
        }
        assert.strictEqual(engine.state.sceneId, 'poland_hub');
      } else {
        assert.strictEqual(engine.state.sceneId, 'poland_monthly_briefing');
        returnToHub();
        assert.strictEqual(
          engine.state.qualities.p2050_foundation_2020_done,
          1,
          'Foundation flag reset on return to the hub'
        );
      }
      break;
    case 'poland_events.merger':
      choose('poland_events.merger_dual');
      returnToHub();
      break;
    case 'poland_trzaskowski.tribunal_showdown':
      chooseFirstAvailable([
        'poland_trzaskowski.tribunal_palace_bill',
        'poland_trzaskowski.tribunal_movement',
        'poland_trzaskowski.tribunal_compromise',
      ]);
      assert(
        engine.state.sceneId.startsWith('poland_trzaskowski.tribunal_'),
        'The Tribunal response was cleared before it could be read'
      );
      choose('poland_hub');
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events.abortion':
      choose('poland_events.abortion_front');
      returnToHub();
      break;
    case 'poland_events.strike':
      choose('poland_events.strike_programme');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events.strike_programme',
        'The Women’s Strike response was cleared before it could be read'
      );
      choose('poland_foreign_events.us_election_2020');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_foreign_events.us_election_2020'
      );
      chooseFirstAvailable([
        'poland_foreign_events.biden_front',
        'poland_foreign_events.biden_social',
        'poland_foreign_events.trump_institutions',
        'poland_foreign_events.trump_bilateral',
        'poland_foreign_events.european_insurance',
      ]);
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events_2021_2023.independence_2020'
      );
      chooseFirstAvailable([
        'poland_events_2021_2023.ind20_civic',
        'poland_events_2021_2023.ind20_join',
        'poland_events_2021_2023.ind20_consistent',
        'poland_events_2021_2023.ind20_monitor',
        'poland_events_2021_2023.ind20_ignore',
      ]);
      choose('poland_events_2021_2023.ind20_riot');
      chooseFirstAvailable([
        'poland_events_2021_2023.ind20_riot_break',
        'poland_events_2021_2023.ind20_riot_inquiry',
        'poland_events_2021_2023.ind20_riot_defend',
      ]);
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events.budget_2020':
      playOppositionBudgetStages();
      assert.strictEqual(
        engine.state.sceneId,
        'poland_senate.budget_2020'
      );
      chooseFirstAvailable([
        'poland_senate.budget_2020_social',
        'poland_senate.budget_2020_local',
        'poland_senate.budget_2020_equality',
        'poland_senate.budget_2020_selective',
        'poland_senate.budget_2020_record',
      ]);
      choose('poland_senate.budget_2020_return_vote');
      choose('poland_senate.budget_2020_complete');
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events.vaccine':
      chooseFirstAvailable([
        'poland_events.vaccine_public',
        'poland_events.vaccine_local',
        'poland_events.vaccine_liberty',
      ]);
      returnToHub();
      break;
    case 'poland_trzaskowski.judicial_war':
      chooseFirstAvailable([
        'poland_trzaskowski.judicial_veto_front',
        'poland_trzaskowski.judicial_europe',
        'poland_trzaskowski.judicial_trade',
      ]);
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events.rename':
      chooseFirstAvailable([
        'poland_events.rename_members',
        'poland_events.rename_dual',
        'poland_events.rename_machine',
      ]);
      returnToHub();
      break;
    case 'poland_events.recovery_fund':
      chooseFirstAvailable([
        'poland_events.recovery_palace',
        'poland_events.recovery_opposition',
        'poland_events.recovery_deal',
        'poland_events.recovery_abstain',
      ]);
      returnToHub();
      break;
    case 'poland_trzaskowski.palace_offensive':
      chooseFirstAvailable([
        'poland_trzaskowski.palace_social',
        'poland_trzaskowski.palace_institutions',
        'poland_trzaskowski.palace_rights',
      ]);
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_trzaskowski.rights_vote':
      chooseFirstAvailable([
        'poland_trzaskowski.rights_vote_abortion',
        'poland_trzaskowski.rights_vote_marriage',
        'poland_trzaskowski.rights_vote_institutions',
      ]);
      returnToHub();
      break;
    case 'poland_events.opposition_reset':
      chooseFirstAvailable([
        'poland_events.reset_democratic',
        'poland_events.reset_social',
        'poland_events.reset_local',
      ]);
      returnToHub();
      break;
    case 'poland_events.left_revolt':
    case 'poland_events.left_revolt_live':
      chooseFirstAvailable([
        'poland_events.revolt_mediate',
        'poland_events.revolt_ballot',
        'poland_events.revolt_suspend',
      ]);
      returnToHub();
      break;
    case 'poland_leadership_events.tusk_return_2021':
      choose('poland_leadership_events.tusk_social_terms');
      assert.strictEqual(engine.state.sceneId, 'poland_events.left_revolt_live');
      assert.strictEqual(engine.state.qualities.ko_leader, 'Donald Tusk');
      chooseFirstAvailable([
        'poland_events.revolt_mediate',
        'poland_events.revolt_ballot',
        'poland_events.revolt_suspend',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.august_2021':
      if (currentChoices().some(function(choice) {
        return choice.id ===
          'poland_events_2021_2023.aug21_constructive';
      })) {
        choose('poland_events_2021_2023.aug21_constructive');
        chooseFirstAvailable([
          'poland_events_2021_2023.aug21_vonc_file',
          'poland_events_2021_2023.aug21_vonc_compact',
          'poland_events_2021_2023.aug21_vonc_ai',
        ]);
        choose('poland_events_2021_2023.aug21_constructive_return');
        assert.strictEqual(engine.state.sceneId, 'poland_hub');
        break;
      }
      chooseFirstAvailable([
        'poland_events_2021_2023.aug21_health',
        'poland_events_2021_2023.aug21_majority',
        'poland_events_2021_2023.aug21_workers',
        'poland_events_2021_2023.aug21_liberty',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.september_2021':
      chooseFirstAvailable([
        'poland_events_2021_2023.border_both',
        'poland_events_2021_2023.border_rights',
        'poland_events_2021_2023.border_security',
        'poland_events_2021_2023.border_defer',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.october_2021_hub':
      choose('poland_events_2021_2023.oct21_congress');
      chooseFirstAvailable([
        'poland_events_2021_2023.oct21_members',
        'poland_events_2021_2023.oct21_dual',
        'poland_events_2021_2023.oct21_machine',
      ]);
      choose('poland_events_2021_2023.oct21_eu');
      chooseFirstAvailable([
        'poland_events_2021_2023.oct21_common_front',
        'poland_events_2021_2023.oct21_material',
        'poland_events_2021_2023.oct21_dialogue',
      ]);
      choose('poland_events_2021_2023.oct21_finish');
      returnToHub();
      break;
    case 'poland_events_2021_2023.november_2021_hub':
      choose('poland_events_2021_2023.nov21_sajbor');
      chooseFirstAvailable([
        'poland_events_2021_2023.nov21_protocols',
        'poland_events_2021_2023.nov21_march',
        'poland_events_2021_2023.nov21_party',
      ]);
      choose('poland_events_2021_2023.nov21_border');
      chooseFirstAvailable([
        'poland_events_2021_2023.nov21_corridor',
        'poland_events_2021_2023.nov21_uniforms',
        'poland_events_2021_2023.nov21_observers',
      ]);
      choose('poland_events_2021_2023.nov21_independence');
      chooseFirstAvailable([
        'poland_events_2021_2023.nov21_civic',
        'poland_events_2021_2023.nov21_counter',
        'poland_events_2021_2023.nov21_monitor',
        'poland_events_2021_2023.nov21_ban',
      ]);
      choose('poland_events_2021_2023.nov21_finish');
      returnToHub();
      break;
    case 'poland_events_2021_2023.december_2021_hub':
      choose('poland_events_2021_2023.dec21_pps');
      chooseFirstAvailable([
        'poland_events_2021_2023.dec21_amnesty',
        'poland_events_2021_2023.dec21_accept',
        'poland_events_2021_2023.dec21_punish',
      ]);
      choose('poland_events_2021_2023.dec21_media');
      chooseFirstAvailable([
        'poland_events_2021_2023.dec21_palace',
        'poland_events_2021_2023.dec21_inquiry',
        'poland_events_2021_2023.dec21_media_front',
      ]);
      choose('poland_events_2021_2023.budget_2021');
      playOppositionBudgetStages();
      assert.strictEqual(engine.state.sceneId, 'poland_senate.budget_2021_2022');
      chooseFirstAvailable([
        'poland_senate.budget_later_common',
        'poland_senate.budget_later_narrow',
        'poland_senate.budget_later_record',
      ]);
      choose('poland_senate.budget_later_complete');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events_2021_2023.december_2021_hub'
      );
      choose('poland_events_2021_2023.dec21_finish');
      returnToHub();
      break;
    case 'poland_events_2021_2023.january_2022':
      chooseFirstAvailable([
        'poland_events_2021_2023.jan22_progressive',
        'poland_events_2021_2023.jan22_competence',
        'poland_events_2021_2023.jan22_workers',
        'poland_events_2021_2023.jan22_tax_revolt',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.february_2022':
      chooseFirstAvailable([
        'poland_events_2021_2023.feb22_solidarity',
        'poland_events_2021_2023.feb22_humanitarian',
        'poland_events_2021_2023.feb22_unity',
        'poland_events_2021_2023.feb22_neutral',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.march_2022':
      chooseFirstAvailable([
        'poland_events_2021_2023.mar22_services',
        'poland_events_2021_2023.mar22_volunteers',
        'poland_events_2021_2023.mar22_equal',
        'poland_events_2021_2023.mar22_screen',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.april_2022':
      chooseFirstAvailable([
        'poland_events_2021_2023.apr22_windfall',
        'poland_events_2021_2023.apr22_public',
        'poland_events_2021_2023.apr22_coal',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.may_2022':
      chooseFirstAvailable([
        'poland_events_2021_2023.may22_identity',
        'poland_events_2021_2023.may22_front',
        'poland_events_2021_2023.may22_conditions',
        'poland_events_2021_2023.may22_pis_independent',
        'poland_events_2021_2023.may22_pis_terms',
        'poland_events_2021_2023.may22_pis_list',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.june_2022':
      chooseFirstAvailable([
        'poland_events_2021_2023.jun22_enforce',
        'poland_events_2021_2023.jun22_opposition',
        'poland_events_2021_2023.jun22_speed',
        'poland_events_2021_2023.jun22_refuse',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.july_2022':
      chooseFirstAvailable([
        'poland_events_2021_2023.jul22_index',
        'poland_events_2021_2023.jul22_tax',
        'poland_events_2021_2023.jul22_investment',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.august_2022':
      chooseFirstAvailable([
        'poland_events_2021_2023.aug22_transparency',
        'poland_events_2021_2023.aug22_local',
        'poland_events_2021_2023.aug22_joint',
        'poland_events_2021_2023.aug22_attack',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.september_2022':
      chooseFirstAvailable([
        'poland_events_2021_2023.sep22_cap',
        'poland_events_2021_2023.sep22_public',
        'poland_events_2021_2023.sep22_target',
        'poland_events_2021_2023.sep22_deregulate',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.october_2022':
      chooseFirstAvailable([
        'poland_events_2021_2023.oct22_economics',
        'poland_events_2021_2023.oct22_isolate',
        'poland_events_2021_2023.oct22_youth',
        'poland_events_2021_2023.oct22_ignore',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.november_2022_hub':
      choose('poland_events_2021_2023.nov22_independence');
      chooseFirstAvailable([
        'poland_events_2021_2023.nov22_civic',
        'poland_events_2021_2023.nov22_counter',
        'poland_events_2021_2023.nov22_monitor',
        'poland_events_2021_2023.nov22_ukraine',
      ]);
      choose('poland_events_2021_2023.nov22_przewodow');
      chooseFirstAvailable([
        'poland_events_2021_2023.nov22_verify',
        'poland_events_2021_2023.nov22_russia',
        'poland_events_2021_2023.nov22_ukraine_blame',
      ]);
      choose('poland_events_2021_2023.nov22_finish');
      returnToHub();
      break;
    case 'poland_events_2021_2023.december_2022':
      playOppositionBudgetStages(
        'poland_opposition_budget.priority_security',
        'poland_opposition_budget.priority_energy_refugees'
      );
      assert.strictEqual(engine.state.sceneId, 'poland_senate.budget_2021_2022');
      chooseFirstAvailable([
        'poland_senate.budget_later_common',
        'poland_senate.budget_later_narrow',
        'poland_senate.budget_later_record',
      ]);
      choose('poland_senate.budget_later_complete');
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events_2021_2023.january_2023':
      chooseFirstAvailable([
        'poland_events_2021_2023.jan23_verify',
        'poland_events_2021_2023.jan23_unlock',
        'poland_events_2021_2023.jan23_palace',
        'poland_events_2021_2023.jan23_oppose',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.february_2023_hub':
      choose('poland_events_2021_2023.feb23_palace');
      chooseFirstAvailable([
        'poland_events_2021_2023.feb23_negotiate',
        'poland_events_2021_2023.feb23_condemn',
        'poland_events_2021_2023.feb23_wait',
      ]);
      choose('poland_events_2021_2023.feb23_konf');
      chooseFirstAvailable([
        'poland_events_2021_2023.feb23_expose',
        'poland_events_2021_2023.feb23_court',
        'poland_events_2021_2023.feb23_ignore',
      ]);
      choose('poland_events_2021_2023.feb23_left');
      chooseFirstAvailable([
        'poland_events_2021_2023.feb23_autonomy',
        'poland_events_2021_2023.feb23_lead',
        'poland_events_2021_2023.feb23_social',
        'poland_events_2021_2023.feb23_delay',
      ]);
      choose('poland_events_2021_2023.feb23_finish');
      returnToHub();
      break;
    case 'poland_events_2021_2023.march_2023':
      chooseFirstAvailable([
        'poland_events_2021_2023.mar23_scrutiny',
        'poland_events_2021_2023.mar23_survivors',
        'poland_events_2021_2023.mar23_distinguish',
        'poland_events_2021_2023.mar23_avoid',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.april_2023':
      chooseFirstAvailable([
        'poland_events_2021_2023.apr23_nonaggression',
        'poland_events_2021_2023.apr23_counties',
        'poland_events_2021_2023.apr23_one_list',
        'poland_events_2021_2023.apr23_peel',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.may_2023':
      chooseFirstAvailable([
        'poland_events_2021_2023.may23_front',
        'poland_events_2021_2023.may23_legal',
        'poland_events_2021_2023.may23_contingent',
        'poland_events_2021_2023.may23_caution',
      ]);
      returnToHub();
      break;
    case 'poland_events_2021_2023.june_2023_hub':
      choose('poland_events_2021_2023.jun23_march');
      choose('poland_events_2021_2023.june_2023_hub');
      choose('poland_events_2021_2023.jun23_dorota');
      chooseFirstAvailable([
        'poland_events_2021_2023.jun23_protocol',
        'poland_events_2021_2023.jun23_autonomy',
        'poland_events_2021_2023.jun23_bill',
      ]);
      choose('poland_events_2021_2023.jun23_nowa_solidarnosc');
      engine.goToScene('status.polls');
      assert(
        contentText(engine.state.currentContent)
          .includes('party party-nowa-solidarnosc'),
        'Nowa Solidarność was absent from polling during its launch event'
      );
      engine.goToScene('backSpecialScene');
      checkNumbers();
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events_2021_2023.jun23_nowa_solidarnosc'
      );
      choose('poland_events_2021_2023.jun23_nowa_solidarnosc_dissolves');
      engine.goToScene('status.party_archive');
      assert(
        contentText(engine.state.currentContent)
          .includes('party party-nowa-solidarnosc'),
        'Nowa Solidarność disappeared before its dissolution event ended'
      );
      engine.goToScene('backSpecialScene');
      checkNumbers();
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events_2021_2023.jun23_nowa_solidarnosc_dissolves'
      );
      choose('poland_events_2021_2023.jun23_nowa_solidarnosc_closes');
      assert.strictEqual(engine.state.qualities.nowa_solidarnosc_formed, 1);
      assert.strictEqual(engine.state.qualities.nowa_solidarnosc_dissolved, 1);
      engine.goToScene('status.polls');
      assert(
        !contentText(engine.state.currentContent)
          .includes('party party-nowa-solidarnosc'),
        'Nowa Solidarność remained in polling after dissolution'
      );
      engine.goToScene('backSpecialScene');
      checkNumbers();
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events_2021_2023.june_2023_hub'
      );
      choose('poland_events_2021_2023.jun23_finish');
      returnToHub();
      break;
    case 'poland_events_2021_2023.july_2023':
      chooseFirstAvailable([
        'poland_events_2021_2023.jul23_material',
        'poland_events_2021_2023.jul23_competence',
        'poland_events_2021_2023.jul23_cordon',
        'poland_events_2021_2023.jul23_copy',
      ]);
      assert.strictEqual(
        engine.state.sceneId,
        'poland_election.campaign_projection'
      );
      choose('poland_hub');
      break;
    default:
      assert.fail(
        'Unexpected routed scene: ' + sceneId + ' at ' +
          engine.state.qualities.date_label +
          ' after ' + eventsSeen.length + ' routed events; route tail: ' +
          visited.slice(-12).join(' -> ') +
          '; aug21=' + engine.state.qualities.august_2021_done +
          ' (' + typeof engine.state.qualities.august_2021_done + ')' +
          ', year=' + engine.state.qualities.year +
          ' (' + typeof engine.state.qualities.year + ')' +
          ', month=' + engine.state.qualities.month +
          ' (' + typeof engine.state.qualities.month + ')' +
          ', augVisits=' +
          engine.state.visits['poland_events_2021_2023.august_2021'] +
          ', routerVisits=' +
          engine.state.visits['poland_events_2021_2023.router'] +
          ', predicate=' +
          game.scenes['poland_events_2021_2023.router'].goTo[0].predicate(
            engine,
            engine.state.qualities
          ) +
          ', sinceGoTo=' + JSON.stringify(engine.state.sceneIdsSinceGoTo)
      );
    }
  }

  function resolveInterveningCaucusCrises() {
    let safety = 0;
    while (
      engine.state.sceneId.startsWith('poland_caucus_dynamics.') &&
      (
        engine.state.sceneId.endsWith('_crisis') ||
        engine.state.sceneId.endsWith('_split')
      )
    ) {
      safety += 1;
      assert(safety <= 6, 'Caucus crisis router did not return to dated events');
      const choices = currentChoices();
      if (engine.state.sceneId.endsWith('_split')) {
        choose('poland_caucus_dynamics.resolve_exit');
        continue;
      }
      const settlement = choices.find(function(choice) {
        return choice.canChoose && choice.id.endsWith('_compromise');
      }) || choices.find(function(choice) {
        return choice.canChoose && choice.id.endsWith('_leave');
      });
      assert(settlement, 'No legal settlement for ' + engine.state.sceneId);
      choose(settlement.id);
    }
  }

  function testPinnedSystemsAndPersistence() {
    // A pinned special scene must preserve the hand scene as its return point.
    engine.playPinnedCard('poland_hub.dossier');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'library.menu');
    choose('backSpecialScene');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');

    // The three active personalities appear directly, as in the base mod.
    const openingAdvisorCards = currentChoices().filter(function(choice) {
      return (game.scenes[choice.id].tags || []).includes(
        'poland_advisor'
      );
    }).map(function(choice) {
      return choice.id;
    }).sort();
    assert.deepStrictEqual(openingAdvisorCards, [
      'poland_advisors',
      'poland_advisors.biedron',
      'poland_advisors.zandberg',
    ]);

    // One advisor acts; a second advisor must see the same shared cooldown.
    engine.playPinnedCard('poland_advisors');
    checkNumbers();
    const advisorAction = currentChoices().find(function(choice) {
      return choice.canChoose && choice.id !== 'poland_hub';
    });
    assert(advisorAction, 'Initial advisor has no available intervention');
    choose(advisorAction.id);
    assert.strictEqual(engine.state.qualities.advisor_action_timer, 6);
    returnToHub();

    engine.playPinnedCard('poland_advisors.biedron');
    checkNumbers();
    const cooledDownActions = currentChoices().filter(function(choice) {
      return choice.id !== 'poland_hub';
    });
    assert.strictEqual(cooledDownActions.length, 3);
    assert(
      cooledDownActions.every(function(choice) {
        return !choice.canChoose;
      }),
      'Advisor cooldown was not shared across the active bureau'
    );
    returnToHub();

    // Merely inspecting the slate does not start the reshuffle cooldown.
    engine.playPinnedCard('poland_manage_advisors');
    choose('poland_manage_advisors.finish');
    assert.strictEqual(
      engine.state.qualities.leadership_reshuffle_timer,
      0
    );

    // The full-slate editor uses political caucuses and permits multiple
    // changes before one final confirmation.
    engine.playPinnedCard('poland_manage_advisors');
    checkNumbers();
    [
      'poland_manage_advisors.remove',
      'poland_manage_advisors.add',
      'poland_manage_advisors.finish',
    ].forEach(function(sceneId) {
      assert(
        currentChoices().some(function(choice) {
          return choice.id === sceneId;
        }),
        'Full-slate control is missing from reshuffle: ' + sceneId
      );
    });

    choose('poland_manage_advisors.remove');
    choose('poland_manage_advisors.remove_razem');
    choose('poland_manage_advisors.remove_zandberg');
    assert.strictEqual(engine.state.sceneId, 'poland_manage_advisors');
    assert.strictEqual(engine.state.qualities.n_advisors, 2);
    assert.strictEqual(engine.state.qualities.zandberg_advisor, 0);

    choose('poland_manage_advisors.add');
    choose('poland_manage_advisors.add_progressives');
    choose('poland_manage_advisors.add_gawkowski');
    assert.strictEqual(engine.state.sceneId, 'poland_manage_advisors');
    choose('poland_manage_advisors.remove');
    choose('poland_manage_advisors.remove_spring');
    choose('poland_manage_advisors.remove_biedron');
    choose('poland_manage_advisors.add');
    choose('poland_manage_advisors.add_labor');
    choose('poland_manage_advisors.add_adb');
    assert.strictEqual(engine.state.qualities.n_advisors, 3);
    assert.strictEqual(engine.state.qualities.leadership_reshuffle_timer, 0);
    choose('poland_manage_advisors.finish');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(engine.state.qualities.n_advisors, 3);
    assert.strictEqual(engine.state.qualities.zandberg_advisor, 0);
    assert.strictEqual(engine.state.qualities.gawkowski_advisor, 1);
    assert.strictEqual(
      engine.state.qualities.dziemianowicz_bak_advisor,
      1
    );
    assert.strictEqual(engine.state.qualities.leadership_reshuffle_timer, 6);

    const changedAdvisorCards = currentChoices().filter(function(choice) {
      return (game.scenes[choice.id].tags || []).includes(
        'poland_advisor'
      );
    }).map(function(choice) {
      return choice.id;
    }).sort();
    assert.deepStrictEqual(changedAdvisorCards, [
      'poland_advisors',
      'poland_advisors.dziemianowicz_bak',
      'poland_advisors.gawkowski',
    ]);

    // Native hand objects survive an export/import cycle exactly.
    const first = drawFromDeck(deckIds[0]);
    const second = drawFromDeck(deckIds[0]);
    const expectedHand = [first.id, second.id];
    const savedState = JSON.parse(
      JSON.stringify(engine.getExportableState())
    );

    drawFromDeck(deckIds[0]);
    assert.strictEqual(engine.state.currentHands.poland_hub.length, 3);
    engine.setState(savedState);
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.deepStrictEqual(
      engine.state.currentHands.poland_hub.map(function(card) {
        return card.id;
      }),
      expectedHand,
      'Save/load did not restore the persistent agenda'
    );

    // A genuinely fresh run must not inherit any cards from that save.
    engine.beginGame(['polish-red-autumn-new-game-reset']);
    assert.deepStrictEqual(
      engine.state.currentHands,
      {},
      'beginGame retained cards from the previous game'
    );
    assert.strictEqual(engine.state.sceneId, 'root.start_menu');
    if (currentChoices().some(function(choice) {
      return choice.id === 'root.campaign_game' && choice.canChoose;
    })) {
      choose('root.campaign_game');
    } else {
      choose('root.new_game');
    }
    assert.deepStrictEqual(
      engine.state.currentHands,
      {},
      'New-game setup retained cards from the previous game'
    );
    choose('root.standard');
    choose('poland_hub');
    assertHandHub();
    assert.strictEqual(
      engine.state.currentHands.poland_hub.length,
      0,
      'Fresh Polish campaign did not start with an empty hand'
    );
  }

  function testRazemLedMerger() {
    startStandard('razem-merger-blocked');
    let qualities = engine.state.qualities;
    engine.goToScene('poland_events.merger');
    let mergerChoice = currentChoices().find(function(choice) {
      return choice.id === 'poland_events.merger_all';
    });
    assert(mergerChoice, 'The all-wing merger option is missing');
    assert.strictEqual(
      mergerChoice.canChoose,
      false,
      'Razem accepted a full merger without being the strongest wing'
    );

    startStandard('razem-merger-leading');
    qualities = engine.state.qualities;
    qualities.razem_strength = 35;
    qualities.barons_strength = 34;
    qualities.spring_strength = 19;
    qualities.labor_strength = 14;
    qualities.progressives_strength = 18;
    qualities.pps_strength = 2;
    const unityBefore = qualities.party_unity;
    engine.goToScene('poland_events.merger');
    mergerChoice = currentChoices().find(function(choice) {
      return choice.id === 'poland_events.merger_all';
    });
    assert(mergerChoice && mergerChoice.canChoose);
    choose('poland_events.merger_all');
    assert.strictEqual(qualities.razem_merged, 1);
    assert.strictEqual(qualities.left_project, 'Unified Razem-led Nowa Lewica');
    assert.strictEqual(qualities.party_unity, unityBefore + 10);
    assert.strictEqual(qualities.razem_dissent, 10);
    assert.strictEqual(qualities.barons_dissent, 24);
    choose('poland_hub');
    assert.strictEqual(qualities.razem_merged, 1);
    assert.strictEqual(qualities.left_family_name, 'Lewica Razem');
    assert.strictEqual(qualities.razem_breakaway_protected, 1);
    Object.assign(qualities, {
      continuous_campaign: 1,
      year: 2024,
      month: 10,
      government_party: 'ko',
      caretaker_government: 0,
      razem_split: 0,
    });
    engine.goToScene('poland_normalize');
    const octoberSplit =
      game.scenes['poland_events_2023_2024.razem_split_2024'];
    assert.strictEqual(
      octoberSplit.viewIf(engine, qualities),
      false,
      'The dated Razem split ignored Razem control of the merged party'
    );

    startStandard('cooperative-razem-split-gate');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      continuous_campaign: 1,
      year: 2024,
      month: 10,
      government_party: 'ko',
      caretaker_government: 0,
      razem_split: 0,
      razem_cooperation: 70,
      razem_dissent: 10,
    });
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.razem_breakaway_protected, 1);
    assert.strictEqual(octoberSplit.viewIf(engine, qualities), false);

    qualities.razem_cooperation = 30;
    qualities.razem_dissent = 50;
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.razem_breakaway_protected, 0);
    assert.strictEqual(
      octoberSplit.viewIf(engine, qualities),
      true,
      'Low-cooperation Razem lost its intended easy breakaway route'
    );
  }

  function testMergerRevoltGates() {
    startStandard('merger-revolt-without-merger');
    let qualities = engine.state.qualities;
    qualities.merger_event_done = 1;
    qualities.nowa_lewica_merger_agreed = 0;
    engine.goToScene('poland_events.left_revolt');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(qualities.left_revolt_event_done, 1);
    assert.strictEqual(qualities.merger_resolution, 'No merger, no revolt');

    startStandard('merger-revolt-czarzasty');
    qualities = engine.state.qualities;
    qualities.nowa_lewica_merger_agreed = 1;
    qualities.merger_leader = 'Włodzimierz Czarzasty';
    engine.goToScene('poland_events.left_revolt');
    assert.strictEqual(qualities.merger_revolt_leader, 'Włodzimierz Czarzasty');
    assert(currentChoices().some(function(choice) {
      return choice.id === 'poland_events.revolt_suspend';
    }));
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_events.revolt_razem_enforce';
    }));

    startStandard('merger-revolt-dual-without-czarzasty');
    qualities = engine.state.qualities;
    qualities.nowa_lewica_merger_agreed = 1;
    qualities.merger_leader = 'Dual chairs';
    qualities.czarzasty_advisor = 0;
    engine.goToScene('poland_events.left_revolt');
    assert.strictEqual(qualities.merger_revolt_leader, 'Dual chairs');

    startStandard('merger-revolt-razem');
    qualities = engine.state.qualities;
    qualities.nowa_lewica_merger_agreed = 1;
    qualities.razem_merged = 1;
    qualities.merger_leader = 'Razem';
    engine.goToScene('poland_events.left_revolt');
    assert.strictEqual(qualities.merger_revolt_leader, 'Razem');
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_events.revolt_suspend';
    }));
    assert(currentChoices().some(function(choice) {
      return choice.id === 'poland_events.revolt_razem_enforce';
    }));
    choose('poland_events.revolt_razem_pact');
    assert.strictEqual(qualities.merger_resolution, 'Razem-led current pact');
  }

  function testOctoberMergerCongress() {
    startStandard('october-congress-without-merger');
    let qualities = engine.state.qualities;
    qualities.nowa_lewica_merger_agreed = 0;
    qualities.october_2021_congress_done = 0;
    engine.goToScene('poland_events_2021_2023.october_2021_hub');
    assert.strictEqual(qualities.october_2021_congress_done, 1);
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_events_2021_2023.oct21_congress';
    }));

    startStandard('october-congress-after-wiosna-exit');
    qualities = engine.state.qualities;
    qualities.nowa_lewica_merger_agreed = 1;
    qualities.spring_active = 0;
    qualities.spring_in_left = 0;
    qualities.spring_party_formed = 1;
    qualities.october_2021_congress_done = 0;
    engine.goToScene('poland_events_2021_2023.october_2021_hub');
    assert.strictEqual(qualities.october_2021_congress_done, 1);
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_events_2021_2023.oct21_congress';
    }));

    startStandard('october-congress-dual');
    qualities = engine.state.qualities;
    qualities.nowa_lewica_merger_agreed = 1;
    qualities.merger_leader = 'Dual chairs';
    engine.goToScene('poland_events_2021_2023.oct21_congress');
    assert(contentText(engine.state.currentContent).includes(
      'One party, two chairs'
    ));

    startStandard('october-congress-razem');
    qualities = engine.state.qualities;
    qualities.nowa_lewica_merger_agreed = 1;
    qualities.razem_merged = 1;
    qualities.merger_leader = 'Razem';
    const springBefore = qualities.spring_strength;
    const successorBefore =
      qualities.labor_strength + qualities.progressives_strength;
    engine.goToScene('poland_events_2021_2023.oct21_congress');
    assert(contentText(engine.state.currentContent).includes(
      "One party under Razem's lead"
    ));
    const razemRatification = currentChoices().find(function(choice) {
      return choice.id === 'poland_events_2021_2023.oct21_razem';
    });
    assert(razemRatification && razemRatification.canChoose);
    choose('poland_events_2021_2023.oct21_razem');
    assert.strictEqual(qualities.merger_leader, 'Razem');
    assert.strictEqual(qualities.spring_merged, 1);
    assert(
      Math.abs(
        qualities.labor_strength + qualities.progressives_strength -
          successorBefore - springBefore
      ) < 0.000001,
      'Razem-led congress lost Wiosna strength during formal merger'
    );
  }

  function testAdvisorRepresentationDrift() {
    startStandard('advisor-representation-opening');
    let qualities = engine.state.qualities;
    assert.strictEqual(qualities.barons_advisor_count, 1);
    assert.strictEqual(qualities.spring_advisor_count, 1);
    assert.strictEqual(qualities.labor_advisor_count, 0);
    assert.strictEqual(qualities.progressives_advisor_count, 0);
    assert.strictEqual(qualities.razem_advisor_count, 1);
    qualities.barons_dissent = 20;
    qualities.spring_dissent = 20;
    qualities.labor_dissent = 20;
    qualities.progressives_dissent = 20;
    qualities.razem_dissent = 20;
    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.barons_dissent, 20);
    assert.strictEqual(qualities.spring_dissent, 20);
    assert(Math.abs(qualities.labor_dissent - 20.7) < 0.000001);
    assert(
      Math.abs(qualities.progressives_dissent - 20.7) < 0.000001
    );
    assert.strictEqual(qualities.razem_dissent, 20);

    startStandard('advisor-representation-double');
    qualities = engine.state.qualities;
    [
      'czarzasty',
      'biedron',
      'zandberg',
      'dziemianowicz_bak',
      'zukowska',
      'kotula',
      'biejat',
      'wieczorek',
      'gawkowski',
      'nowicka',
      'zawisza',
      'matysiak',
    ].forEach(function(advisor) {
      qualities[advisor + '_advisor'] = 0;
    });
    qualities.dziemianowicz_bak_advisor = 1;
    qualities.zukowska_advisor = 1;
    qualities.kotula_advisor = 1;
    engine.goToScene('poland_hub');
    assert.strictEqual(qualities.n_advisors, 3);
    assert.strictEqual(qualities.labor_advisor_count, 1);
    assert.strictEqual(qualities.progressives_advisor_count, 2);
    qualities.barons_dissent = 20;
    qualities.spring_dissent = 20;
    qualities.labor_dissent = 20;
    qualities.progressives_dissent = 20;
    qualities.razem_dissent = 20;
    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.barons_dissent, 21);
    assert.strictEqual(qualities.spring_dissent, 21);
    assert.strictEqual(qualities.labor_dissent, 20);
    assert.strictEqual(qualities.progressives_dissent, 19.75);
    assert.strictEqual(qualities.razem_dissent, 21);

    startStandard('advisor-czarzasty-removal');
    qualities = engine.state.qualities;
    const baronsBeforeRemoval = qualities.barons_dissent;
    engine.goToScene('poland_manage_advisors');
    choose('poland_manage_advisors.remove');
    choose('poland_manage_advisors.remove_barons');
    choose('poland_manage_advisors.remove_czarzasty');
    assert.strictEqual(
      qualities.barons_dissent,
      baronsBeforeRemoval + 12,
      'Removing Czarzasty did not trigger great establishment dissent'
    );

    startStandard('advisor-lopsided-slate');
    qualities = engine.state.qualities;
    engine.goToScene('poland_manage_advisors');
    choose('poland_manage_advisors.remove');
    choose('poland_manage_advisors.remove_barons');
    choose('poland_manage_advisors.remove_czarzasty');
    choose('poland_manage_advisors.remove');
    choose('poland_manage_advisors.remove_spring');
    choose('poland_manage_advisors.remove_biedron');
    choose('poland_manage_advisors.add');
    choose('poland_manage_advisors.add_razem');
    choose('poland_manage_advisors.add_biejat');
    choose('poland_manage_advisors.add');
    choose('poland_manage_advisors.add_razem');
    choose('poland_manage_advisors.add_zawisza');
    const dissentBeforeFinish = {
      barons: qualities.barons_dissent,
      spring: qualities.spring_dissent,
      labor: qualities.labor_dissent,
      progressives: qualities.progressives_dissent,
      razem: qualities.razem_dissent,
      pps: qualities.pps_dissent,
    };
    choose('poland_manage_advisors.finish');
    ['barons', 'spring', 'labor', 'progressives'].forEach(function(faction) {
      assert.strictEqual(
        qualities[faction + '_dissent'],
        dissentBeforeFinish[faction] + 10,
        faction + ' did not receive the lopsided-bureau dissent penalty'
      );
    });
    assert.strictEqual(qualities.razem_dissent, dissentBeforeFinish.razem);
    assert.strictEqual(qualities.pps_dissent, dissentBeforeFinish.pps);
    assert.strictEqual(
      qualities.news_headline,
      'A lopsided bureau shuts whole wings out of the leadership'
    );
  }

  function testForeignAuthorityMatrix() {
    const cases = [
      {
        name: 'ordinary-opposition',
        expected: 'ordinary_opposition',
        state: {
          left_in_government: 0,
          position: 'Parliamentary opposition',
          caretaker_government: 0,
          left_president: 0,
          prime_minister: 'Mateusz Morawiecki',
          government_name: 'PiS cabinet',
          government_party: 'pis',
          foreign_minister_party: 'PiS',
        },
      },
      {
        name: 'confidence-opposition',
        expected: 'confidence_opposition',
        state: {
          left_in_government: 0,
          position: 'Confidence-and-supply opposition',
          caretaker_government: 0,
          left_president: 0,
          prime_minister: 'Donald Tusk',
          government_name: 'KO-led cabinet',
          government_party: 'ko',
          foreign_minister_party: 'KO',
        },
      },
      {
        name: 'junior-no-mfa',
        expected: 'junior_no_mfa',
        state: {
          left_in_government: 1,
          position: 'Coalition government',
          caretaker_government: 0,
          left_president: 0,
          prime_minister: 'Donald Tusk',
          government_name: 'KO-led democratic coalition',
          government_party: 'ko',
          foreign_minister_party: 'KO',
        },
      },
      {
        name: 'junior-mfa',
        expected: 'junior_mfa',
        state: {
          left_in_government: 1,
          position: 'Coalition government',
          caretaker_government: 0,
          left_president: 0,
          prime_minister: 'Donald Tusk',
          government_name: 'KO-led democratic coalition',
          government_party: 'ko',
          foreign_minister_party: 'Lewica',
        },
      },
      {
        name: 'lead-no-mfa',
        expected: 'lead_no_mfa',
        state: {
          left_in_government: 1,
          position: 'Governing coalition',
          caretaker_government: 0,
          left_president: 0,
          prime_minister: 'Agnieszka Dziemianowicz-Bąk',
          government_name: 'Lewica-led coalition',
          government_party: 'lewica',
          foreign_minister_party: 'KO',
        },
      },
      {
        name: 'lead-mfa',
        expected: 'lead_mfa',
        state: {
          left_in_government: 1,
          position: 'Governing coalition',
          caretaker_government: 0,
          left_president: 0,
          prime_minister: 'Agnieszka Dziemianowicz-Bąk',
          government_name: 'Lewica-led coalition',
          government_party: 'lewica',
          foreign_minister_party: 'Lewica',
        },
      },
      {
        name: 'caretaker',
        expected: 'caretaker',
        state: {
          left_in_government: 1,
          position: 'Caretaker cabinet',
          caretaker_government: 1,
          left_president: 0,
          prime_minister: 'Agnieszka Dziemianowicz-Bąk',
          government_name: 'Caretaker cabinet',
          government_party: 'lewica',
          foreign_minister_party: 'Lewica',
        },
      },
      {
        name: 'left-president-in-opposition',
        expected: 'ordinary_opposition',
        presidentialChannel: 1,
        state: {
          left_in_government: 0,
          position: 'Parliamentary opposition',
          caretaker_government: 0,
          left_president: 1,
          president_name: 'Magdalena Biejat',
          prime_minister: 'Donald Tusk',
          government_name: 'KO-led cabinet',
          government_party: 'ko',
          foreign_minister_party: 'KO',
        },
      },
      {
        name: 'left-president-junior-mfa',
        expected: 'junior_mfa',
        presidentialChannel: 1,
        state: {
          left_in_government: 1,
          position: 'Coalition government',
          caretaker_government: 0,
          left_president: 1,
          president_name: 'Magdalena Biejat',
          prime_minister: 'Donald Tusk',
          government_name: 'KO-led democratic coalition',
          government_party: 'ko',
          foreign_minister_party: 'Lewica',
        },
      },
      {
        name: 'left-president-lead-mfa',
        expected: 'lead_mfa',
        presidentialChannel: 1,
        state: {
          left_in_government: 1,
          position: 'Governing coalition',
          caretaker_government: 0,
          left_president: 1,
          president_name: 'Magdalena Biejat',
          prime_minister: 'Agnieszka Dziemianowicz-Bąk',
          government_name: 'Lewica-led coalition',
          government_party: 'lewica',
          foreign_minister_party: 'Lewica',
        },
      },
    ];

    cases.forEach(function(testCase) {
      startStandard('foreign-authority-' + testCase.name);
      Object.assign(engine.state.qualities, testCase.state);
      engine.goToScene('poland_hub');
      assert.strictEqual(
        engine.state.qualities.foreign_authority_role,
        testCase.expected,
        'External dossier misrouted ' + testCase.name
      );
      assert.strictEqual(
        engine.state.qualities.foreign_left_presidential_channel,
        testCase.presidentialChannel || 0,
        'Presidential channel erased or invented cabinet authority for ' +
          testCase.name
      );
    });

    startStandard('foreign-authority-left-president-washington');
    let qualities = engine.state.qualities;
    qualities.us_election_2020_done = 1;
    qualities.left_president = 1;
    qualities.president_name = 'Magdalena Biejat';
    qualities.left_in_government = 0;
    qualities.caretaker_government = 0;
    qualities.government_party = 'ko';
    qualities.foreign_minister_party = 'KO';
    engine.goToScene('poland_hub');
    const presidentialResources = qualities.resources;
    const presidentialDelivery = qualities.government_delivery;
    engine.goToScene('poland_white_house_pressure');
    choose('poland_white_house_pressure.presidential');
    assert.strictEqual(qualities.resources, presidentialResources);
    assert.strictEqual(qualities.government_delivery, presidentialDelivery);
    assert(
      qualities.foreign_authority_last_outcome.includes(
        'President represents Poland and convenes'
      ),
      'The Left President used party or cabinet authority in Washington'
    );

    startStandard('foreign-authority-opposition-washington');
    qualities = engine.state.qualities;
    qualities.us_election_2020_done = 1;
    qualities.left_in_government = 0;
    qualities.position = 'Parliamentary opposition';
    qualities.caretaker_government = 0;
    qualities.left_president = 0;
    qualities.prime_minister = 'Mateusz Morawiecki';
    qualities.government_name = 'PiS cabinet';
    qualities.government_party = 'pis';
    qualities.foreign_minister_party = 'PiS';
    engine.goToScene('poland_hub');
    const oppositionResources = qualities.resources;
    const oppositionDelivery = qualities.government_delivery;
    engine.goToScene('poland_white_house_pressure');
    choose('poland_white_house_pressure.white_house');
    assert.strictEqual(qualities.resources, oppositionResources);
    assert.strictEqual(qualities.government_delivery, oppositionDelivery);
    assert(
      qualities.foreign_authority_last_outcome.includes(
        'without giving a national pledge'
      ),
      'Ordinary opposition gave Washington an executive pledge'
    );

    startStandard('foreign-authority-lead-mfa-washington');
    qualities = engine.state.qualities;
    qualities.us_election_2020_done = 1;
    qualities.left_in_government = 1;
    qualities.position = 'Governing coalition';
    qualities.caretaker_government = 0;
    qualities.left_president = 0;
    qualities.prime_minister = 'Agnieszka Dziemianowicz-Bąk';
    qualities.government_name = 'Lewica-led coalition';
    qualities.government_party = 'lewica';
    qualities.foreign_minister_party = 'Lewica';
    qualities.budget = 4;
    engine.goToScene('poland_hub');
    const deliveryBefore = qualities.government_delivery;
    engine.goToScene('poland_white_house_pressure');
    choose('poland_white_house_pressure.white_house');
    assert.strictEqual(qualities.budget, 3);
    assert.strictEqual(qualities.government_delivery, deliveryBefore + 4);
    assert.strictEqual(qualities.foreign_policy_responsibility, 6);
    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.foreign_policy_responsibility, 0);
    assert.notStrictEqual(
      qualities.foreign_followthrough_last,
      'No pending foreign-policy follow-through'
    );

    startStandard('us-review-ordinary-opposition-authority');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2026,
      month: 2,
      left_in_government: 0,
      position: 'Parliamentary opposition',
      caretaker_government: 0,
      left_president: 0,
      prime_minister: 'Mateusz Morawiecki',
      government_name: 'PiS cabinet',
      government_party: 'pis',
      foreign_minister_party: 'PiS',
    });
    engine.goToScene('poland_hub');
    assert.strictEqual(qualities.foreign_authority_role, 'ordinary_opposition');
    const reviewOppositionDissent = qualities.government_coalition_dissent;
    const reviewOppositionDelivery = qualities.government_delivery;
    engine.goToScene('poland_foreign_events.us_review_2026');
    choose('poland_foreign_events.review_compact');
    assert.strictEqual(
      qualities.government_coalition_dissent,
      reviewOppositionDissent
    );
    assert.strictEqual(qualities.government_delivery, reviewOppositionDelivery);
    assert(qualities.foreign_authority_last_outcome.includes(
      'without claiming national agreement'));

    startStandard('us-review-lead-government-and-mfa');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2026,
      month: 2,
      left_in_government: 1,
      position: 'Governing coalition',
      caretaker_government: 0,
      prime_minister: 'Agnieszka Dziemianowicz-Bąk',
      government_name: 'Lewica-led coalition',
      government_party: 'lewica',
      foreign_minister_party: 'Lewica',
    });
    engine.goToScene('poland_hub');
    assert.strictEqual(qualities.foreign_authority_role, 'lead_mfa');
    const reviewReliability = qualities.us_alliance_reliability;
    const reviewResponsibility = qualities.foreign_policy_responsibility;
    engine.goToScene('poland_foreign_events.us_review_2026');
    choose('poland_foreign_events.review_compact');
    assert.strictEqual(
      qualities.us_alliance_reliability,
      reviewReliability + 5
    );
    assert.strictEqual(
      qualities.foreign_policy_responsibility,
      reviewResponsibility + 5
    );

    startStandard('us-review-left-president-separate-channel');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2026,
      month: 2,
      left_in_government: 0,
      position: 'Parliamentary opposition',
      caretaker_government: 0,
      left_president: 1,
      president_name: 'Magdalena Biejat',
      prime_minister: 'Donald Tusk',
      government_name: 'KO-led cabinet',
      government_party: 'ko',
      foreign_minister_party: 'KO',
    });
    engine.goToScene('poland_hub');
    const presidentialReviewDelivery = qualities.government_delivery;
    const presidentialReviewDissent = qualities.government_coalition_dissent;
    engine.goToScene('poland_foreign_events.us_review_2026');
    assert(currentChoices().some(function(choice) {
      return choice.id === 'poland_foreign_events.review_presidential' &&
        choice.canChoose;
    }));
    choose('poland_foreign_events.review_presidential');
    assert.strictEqual(qualities.government_delivery, presidentialReviewDelivery);
    assert.strictEqual(
      qualities.government_coalition_dissent,
      presidentialReviewDissent
    );
    assert(qualities.foreign_authority_last_outcome.includes(
      'without directing ministries'));
  }

  function testForeignAffairsAndUSElections() {
    startStandard('foreign-affairs-opening');
    let qualities = engine.state.qualities;
    assert.deepStrictEqual(
      drawableCardIds('poland_foreign_deck'),
      ['poland_european_campaign', 'poland_white_house_pressure'],
      'The opening Foreign Affairs deck should expose the EU and US'
    );

    [
      'democratic',
      'social',
    ].forEach(function(mission) {
      qualities.month_actions = 0;
      qualities.poland_european_campaign_timer = 0;
      engine.goToScene('poland_european_campaign');
      choose('poland_european_campaign.' + mission);
      engine.goToScene('poland_hub');
    });
    assert.strictEqual(qualities.eu_campaign_progress, 2);
    assert.strictEqual(
      qualities.eu_campaign_stage,
      'Two working EU channels'
    );
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.government_party = 'lewica';
    qualities.eu_institutional_trust = 45;
    qualities.month_actions = 0;
    qualities.poland_european_campaign_timer = 0;
    engine.goToScene('poland_hub');
    engine.goToScene('poland_european_campaign');
    const settlement = currentChoices().find(function(choice) {
      return choice.id === 'poland_european_campaign.settlement';
    });
    assert(settlement && settlement.canChoose,
      'The coalition EU settlement did not unlock');
    choose('poland_european_campaign.settlement');
    assert.strictEqual(qualities.eu_campaign_complete, 1);
    assert(qualities.economic_growth > 3.7);

    qualities.year = 2023;
    qualities.month = 1;
    qualities.month_actions = 0;
    qualities.ukraine_invasion_event_done = 1;
    [
      'poland_european_campaign_timer',
      'poland_eastern_flank_timer',
      'poland_white_house_pressure_timer',
      'poland_european_right_timer',
    ].forEach(function(timer) {
      qualities[timer] = 0;
    });
    engine.goToScene('poland_hub');
    assert.deepStrictEqual(
      drawableCardIds('poland_foreign_deck'),
      [
        'poland_eastern_flank',
        'poland_european_campaign',
        'poland_european_right',
        'poland_white_house_pressure',
      ],
      'The four foreign relationships did not enter the deck'
    );

    startStandard('eu-rightward-headwind');
    qualities = engine.state.qualities;
    qualities.year = 2024;
    qualities.month = 6;
    qualities.eu_progressive_headwind = 0;
    engine.goToScene('poland_events_2023_2024.european_election_2024');
    assert.strictEqual(qualities.eu_progressive_headwind, 8);
    choose('poland_events_2023_2024.eu_left');
    assert.strictEqual(qualities.eu_progressive_headwind, 6);

    startStandard('reform-without-eu-headwind');
    qualities = engine.state.qualities;
    qualities.eu_progressive_headwind = 0;
    engine.goToScene('poland_abortion_reform');
    const reformPowerWithoutHeadwind = qualities.abortion_reform_power;
    startStandard('reform-with-eu-headwind');
    qualities = engine.state.qualities;
    qualities.eu_progressive_headwind = 8;
    engine.goToScene('poland_abortion_reform');
    assert.strictEqual(
      qualities.abortion_reform_power,
      Math.max(0, reformPowerWithoutHeadwind - 8),
      'The EU rightward shift did not reduce progressive reform passage power'
    );

    startStandard('hungary-election-2022-result');
    qualities = engine.state.qualities;
    qualities.year = 2022;
    qualities.month = 4;
    qualities.war_economy_2022_done = 1;
    qualities.hungary_election_2022_done = 0;
    engine.goToScene('poland_foreign_events.hungary_election_2022');
    assert.strictEqual(qualities.hungary_fidesz_seats, 135);
    assert(qualities.hungary_election_2022_result.includes('57'));
    choose('poland_foreign_events.hungary_2022_democrats');
    assert(qualities.hungary_democratic_network > 12);

    const hungaryOutcomes = new Set();
    for (let seed = 0; seed < 80; seed += 1) {
      startStandard('hungary-election-2026-variable-' + seed);
      qualities = engine.state.qualities;
      qualities.year = 2026;
      qualities.month = 4;
      qualities.hungary_election_2026_done = 0;
      engine.goToScene('poland_foreign_events.hungary_election_2026');
      hungaryOutcomes.add(qualities.hungary_fidesz_in_power);
      assert.strictEqual(
        qualities.hungary_tisza_seats + qualities.hungary_fidesz_seats + 6,
        199
      );
      if (!qualities.hungary_fidesz_in_power) {
        assert.strictEqual(qualities.hungary_tisza_seats, 141);
        assert.strictEqual(qualities.hungary_fidesz_seats, 52);
      }
    }
    assert.deepStrictEqual(
      Array.from(hungaryOutcomes).sort(),
      [0, 1],
      'The seeded 2026 Hungarian election did not allow Fidesz to fall or survive'
    );

    startStandard('hostile-west-economic-shock');
    qualities = engine.state.qualities;
    qualities.year = 2025;
    qualities.month = 9;
    qualities.eu_institutional_trust = 10;
    qualities.us_alliance_reliability = 20;
    qualities.western_economic_shock_done = 0;
    engine.goToScene('poland_hub');
    const growthBeforeIsolation = qualities.economic_growth;
    const unemploymentBeforeIsolation = qualities.unemployment;
    engine.goToScene('poland_foreign_events.western_economic_isolation');
    assert(qualities.economic_growth < growthBeforeIsolation);
    assert(qualities.unemployment > unemploymentBeforeIsolation);
    assert(qualities.western_economic_drag > 0);
    const growthAfterIsolation = qualities.economic_growth;
    choose('poland_foreign_events.west_repair');
    assert.strictEqual(
      qualities.economic_growth,
      growthAfterIsolation,
      'Opposition diplomacy directly reversed a national economic shock'
    );

    const winners2020 = new Set();
    let splitSeen2020 = false;
    for (let seed = 0; seed < 40; seed += 1) {
      startStandard('us-election-2020-variable-' + seed);
      qualities = engine.state.qualities;
      qualities.year = 2020;
      qualities.month = 11;
      qualities.us_election_2020_done = 0;
      engine.goToScene('poland_foreign_events.us_election_2020');
      checkNumbers();
      winners2020.add(qualities.us_election_2020_winner);
      assert.strictEqual(
        Math.round(
          (
            qualities.us_2020_democratic_vote +
            qualities.us_2020_republican_vote
          ) * 10
        ) / 10,
        100
      );
      assert.strictEqual(
        qualities.us_2020_democratic_electors +
          qualities.us_2020_republican_electors,
        538
      );
      assert.strictEqual(
        qualities.us_election_2020_winner === 'Joe Biden',
        qualities.us_2020_democratic_electors >= 270
      );
      splitSeen2020 = splitSeen2020 ||
        qualities.us_2020_popular_electoral_split === 1;
      const branchChoices = currentChoices().map(function(choice) {
        return choice.id;
      });
      if (qualities.us_administration === 'Democratic') {
        assert(branchChoices.includes('poland_foreign_events.biden_front'));
        assert(!branchChoices.includes('poland_foreign_events.trump_bilateral'));
      } else {
        assert(branchChoices.includes('poland_foreign_events.trump_institutions'));
        assert(!branchChoices.includes('poland_foreign_events.biden_front'));
      }
    }
    assert.deepStrictEqual(
      Array.from(winners2020).sort(),
      ['Donald Trump', 'Joe Biden'],
      'The seeded 2020 American election did not produce both outcomes'
    );
    assert(
      splitSeen2020,
      'The 2020 model still forced the popular and electoral winners together'
    );

    const winners2024 = new Set();
    let splitSeen2024 = false;
    for (let seed = 0; seed < 40; seed += 1) {
      startStandard('us-election-2024-variable-' + seed);
      qualities = engine.state.qualities;
      qualities.year = 2024;
      qualities.month = 11;
      qualities.us_election_2020_done = 1;
      qualities.us_election_2020_winner = 'Joe Biden';
      qualities.us_election_2024_done = 0;
      engine.goToScene('poland_foreign_events.us_election_2024');
      checkNumbers();
      winners2024.add(qualities.us_election_2024_winner);
      assert.strictEqual(
        Math.round(
          (
            qualities.us_2024_democratic_vote +
            qualities.us_2024_republican_vote
          ) * 10
        ) / 10,
        100
      );
      assert.strictEqual(
        qualities.us_2024_democratic_electors +
          qualities.us_2024_republican_electors,
        538
      );
      assert.strictEqual(
        qualities.us_election_2024_winner === 'Kamala Harris',
        qualities.us_2024_democratic_electors >= 270
      );
      splitSeen2024 = splitSeen2024 ||
        qualities.us_2024_popular_electoral_split === 1;
    }
    assert.deepStrictEqual(
      Array.from(winners2024).sort(),
      ['Donald Trump', 'Kamala Harris'],
      'The seeded 2024 American election did not produce both outcomes'
    );
    assert(
      splitSeen2024,
      'The 2024 model still forced the popular and electoral winners together'
    );

    const republicanSuccessors = [
      'JD Vance',
      'Marco Rubio',
      'Nikki Haley',
      'Ron DeSantis',
      'Vivek Ramaswamy',
    ];
    const successorsSeen = new Set();
    for (let seed = 0; seed < 40; seed += 1) {
      startStandard('us-election-2024-term-limit-' + seed);
      qualities = engine.state.qualities;
      qualities.year = 2024;
      qualities.month = 11;
      qualities.us_election_2020_done = 1;
      qualities.us_election_2020_winner = 'Donald Trump';
      qualities.us_election_2024_done = 0;
      engine.goToScene('poland_foreign_events.us_election_2024');
      successorsSeen.add(qualities.us_2024_republican_candidate);
      assert(republicanSuccessors.includes(
        qualities.us_2024_republican_candidate
      ));
      assert.notStrictEqual(qualities.us_election_2024_winner, 'Donald Trump');
      assert(contentText(engine.state.currentContent).includes(
        qualities.us_2024_republican_candidate
      ));
    }
    assert.deepStrictEqual(
      Array.from(successorsSeen).sort(),
      republicanSuccessors,
      'The seeded Republican sortition did not produce every successor'
    );

    startStandard('us-2026-harris-route');
    qualities = engine.state.qualities;
    qualities.year = 2026;
    qualities.month = 2;
    qualities.us_election_2024_done = 1;
    qualities.us_president = 'Kamala Harris';
    qualities.us_administration = 'Democratic';
    engine.goToScene('poland_event_queue');
    let foreignEventIds = (
      engine._compileChoices(game.scenes['poland_event_queue.all_events']) || []
    ).map(function(choice) {
      return choice.id;
    });
    assert(foreignEventIds.includes('poland_foreign_events.us_review_2026'));
    assert(!foreignEventIds.includes('poland_events_2026.ambassador_crisis_2026'));

    startStandard('us-2026-trump-route');
    qualities = engine.state.qualities;
    qualities.year = 2026;
    qualities.month = 2;
    qualities.us_election_2024_done = 1;
    qualities.us_president = 'Donald Trump';
    qualities.us_administration = 'America First';
    qualities.sejm_speaker = 'Włodzimierz Czarzasty';
    engine.goToScene('poland_event_queue');
    foreignEventIds = (
      engine._compileChoices(game.scenes['poland_event_queue.all_events']) || []
    ).map(function(choice) {
      return choice.id;
    });
    assert(foreignEventIds.includes('poland_events_2026.ambassador_crisis_2026'));
    assert(!foreignEventIds.includes('poland_foreign_events.us_review_2026'));
  }

  function testContextualDecks() {
    startStandard('contextual-deck-gate');
    const qualities = engine.state.qualities;
    const oppositionDecks = currentChoices().filter(function(choice) {
      return game.scenes[choice.id].isDeck;
    }).map(function(choice) {
      return choice.id;
    });
    assert.deepStrictEqual(
      oppositionDecks,
      [
        'poland_party_deck',
        'poland_negotiation_deck',
        'poland_major_reform_deck',
        'poland_foreign_deck',
      ],
      'Opposition should see Party, negotiation, Major Reforms and Foreign Affairs decks'
    );
    assert(
      qualities.negotiation_leverage > 0 &&
        qualities.negotiation_leverage < 24,
      'Opening PiS leverage should be useful pressure, not zero or an immediate deal'
    );
    assert.deepStrictEqual(
      drawableCardIds('poland_negotiation_deck'),
      [
        'poland_oversight_bargain',
        'poland_pis_right_faultline',
        'poland_tvp_appearance',
      ],
      'Opening negotiation draws should be pressure cards, not duplicate reform projects'
    );
    assert(
      !(game.scenes.poland_pis_social_channel.tags || []).includes(
        'poland_negotiation_card'
      ),
      'The legacy PiS social channel still duplicated the Party Affairs route'
    );

    qualities.left_in_government = 1;
    qualities.budget = 6;
    qualities.labor_minister_party = 'Lewica';
    qualities.equality_minister_party = 'Lewica';
    qualities.housing_minister_party = 'Lewica';
    qualities.health_minister_party = 'Lewica';
    qualities.ministries_finalized = 1;
    qualities.ministry_count = 4;
    engine.goToScene('poland_hub');
    checkNumbers();

    const governingDecks = currentChoices().filter(function(choice) {
      return game.scenes[choice.id].isDeck;
    }).map(function(choice) {
      return choice.id;
    }).sort();
    assert.deepStrictEqual(
      governingDecks,
      [
        'poland_foreign_deck',
        'poland_government_deck',
        'poland_major_reform_deck',
        'poland_party_deck',
      ],
      'Government participation did not reveal Party, Government, Major Reforms and Foreign Affairs'
    );

    const governmentCard = drawFromDeck('poland_government_deck');
    assert(
      (game.scenes[governmentCard.id].tags || []).includes(
        'poland_government_card'
      ),
      'Government deck drew a non-executive card'
    );

    qualities.left_in_government = 0;
    engine.goToScene('poland_hub');
    assert.strictEqual(
      engine.state.currentHands.poland_hub.length,
      0,
      'A government-only dossier remained in hand after leaving office'
    );

    qualities.left_in_government = 1;
    qualities.budget = 4;
    qualities.labor_minister_party = 'Lewica';
    qualities.month_actions = 0;
    engine.goToScene('poland_labor_inspection');
    choose('poland_labor_inspection.fund');
    assert.strictEqual(
      qualities.budget,
      2,
      'Executive labour card did not spend government budget capacity'
    );
    assert.strictEqual(qualities.resources, 5);
  }

  function testMajorReformProjects() {
    function setExecutive(qualities, party) {
      qualities.left_in_government = 1;
      qualities.government_has_confidence = 1;
      qualities.caretaker_government = 0;
      qualities.government_party = party || 'lewica';
      qualities.ministry_ko_in_cabinet = 0;
      qualities.ministry_psl_in_cabinet = 0;
      qualities.ministry_p2050_in_cabinet = 0;
    }

    function setProject(qualities, issue, proposal) {
      qualities[issue + '_reform_defined'] = 1;
      qualities[issue + '_reform_goal_stage'] = 4;
      qualities[issue + '_reform_proposal_stage'] = proposal;
      qualities[issue + '_reform_next_stage'] = proposal;
      qualities[issue + '_reform_stage'] = 0;
      qualities[issue + '_reform_settled'] = 0;
      qualities['poland_' + issue + '_reform_timer'] = 0;
      qualities.reform_pressure_pending = 0;
      qualities.reform_pressure_cooldown = 0;
      qualities.month_actions = 0;
    }

    function assertProjectHidden(qualities, issue) {
      qualities['poland_' + issue + '_reform_timer'] = 0;
      qualities.reform_pressure_pending = 0;
      qualities.month_actions = 0;
      assert(
        !drawableCardIds('poland_major_reform_deck').includes(
          'poland_' + issue + '_reform'
        ),
        issue + ' project returned after its settlement'
      );
    }

    function queueDemand(qualities, actor, issue) {
      qualities.reform_pressure_pending = 1;
      qualities.reform_pressure_mode = 'partner_demand';
      qualities.reform_pressure_actor = actor;
      qualities.reform_pressure_actor_name = actor === 'pis' ? 'PiS' : 'KO';
      qualities.reform_pressure_issue = issue;
      qualities.reform_pressure_intensity = 60;
      qualities.reform_pressure_illegality = 40;
      qualities.reform_pressure_due_time = qualities.time;
    }

    startStandard('major-reform-goal-definition');
    let qualities = engine.state.qualities;
    qualities.left_in_government = 0;
    qualities.abortion_reform_defined = 0;
    qualities.abortion_reform_goal_stage = 4;
    qualities.abortion_reform_proposal_stage = 4;
    qualities.abortion_reform_next_stage = 4;
    qualities.abortion_reform_stage = 0;
    qualities.abortion_reform_settled = 0;
    qualities.abortion_reform_progress = 0;
    qualities.poland_abortion_reform_timer = 0;
    qualities.reform_pressure_pending = 0;
    qualities.month_actions = 0;
    engine.goToScene('poland_abortion_reform');
    assert.strictEqual(qualities.abortion_reform_next_stage, 4);
    assert(
      currentChoices().some(function(choice) {
        return choice.id === 'poland_abortion_reform.define_goal';
      })
    );
    assert(
      !currentChoices().some(function(choice) {
        return choice.id === 'poland_abortion_reform.advance';
      }),
      'An undefined reform exposed its enactment choice'
    );
    choose('poland_abortion_reform.define_goal');
    assert.strictEqual(qualities.abortion_reform_defined, 1);
    assert.strictEqual(qualities.abortion_reform_goal_stage, 4);
    assert.strictEqual(qualities.abortion_reform_proposal_stage, 4);
    assert.strictEqual(qualities.abortion_reform_next_stage, 4);
    assert.strictEqual(qualities.abortion_reform_progress, 12);
    assert.strictEqual(qualities.abortion_reform_stage, 0);
    assert.strictEqual(qualities.abortion_reform_settled, 0);

    ['marriage', 'labor'].forEach(function(issue) {
      startStandard('major-reform-' + issue + '-goal-definition');
      const goalQualities = engine.state.qualities;
      goalQualities[issue + '_reform_defined'] = 0;
      goalQualities[issue + '_reform_goal_stage'] = 4;
      goalQualities[issue + '_reform_proposal_stage'] = 4;
      goalQualities[issue + '_reform_next_stage'] = 4;
      goalQualities[issue + '_reform_stage'] = 0;
      goalQualities[issue + '_reform_settled'] = 0;
      goalQualities[issue + '_reform_progress'] = 0;
      goalQualities['poland_' + issue + '_reform_timer'] = 0;
      goalQualities.reform_pressure_pending = 0;
      goalQualities.month_actions = 0;
      engine.goToScene('poland_' + issue + '_reform');
      assert.strictEqual(goalQualities[issue + '_reform_next_stage'], 4);
      assert(
        !currentChoices().some(function(choice) {
          return choice.id === 'poland_' + issue + '_reform.advance';
        })
      );
      choose('poland_' + issue + '_reform.define_goal');
      assert.strictEqual(goalQualities[issue + '_reform_defined'], 1);
      assert.strictEqual(goalQualities[issue + '_reform_goal_stage'], 4);
      assert.strictEqual(goalQualities[issue + '_reform_proposal_stage'], 4);
      assert.strictEqual(goalQualities[issue + '_reform_next_stage'], 4);
      assert.strictEqual(goalQualities[issue + '_reform_progress'], 12);
      assert.strictEqual(goalQualities[issue + '_reform_stage'], 0);
      assert.strictEqual(goalQualities[issue + '_reform_settled'], 0);
    });

    startStandard('major-reform-early-trzaskowski-abortion-settlement');
    qualities = engine.state.qualities;
    setProject(qualities, 'abortion', 4);
    qualities.trz_abortion_signature = 1;
    qualities.trz_right_fragmentation = 100;
    engine.goToScene('poland_trzaskowski.rights_vote');
    choose('poland_trzaskowski.rights_vote_abortion');
    assert.strictEqual(qualities.trz_rights_bill_outcome, 'Passed and signed');
    assert.strictEqual(qualities.abortion_law_enacted, 1);
    assert.strictEqual(qualities.abortion_reform_stage, 3);
    assert.strictEqual(qualities.abortion_reform_settled, 1);
    assert.strictEqual(qualities.abortion_reform_proposal_stage, 3);
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.abortion_event_done, 1);
    assert.strictEqual(qualities.strike_event_done, 1);
    assert.strictEqual(qualities.november_2021_sajbor_done, 1);
    assert.strictEqual(qualities.dorota_2023_done, 1);
    engine.goToScene('poland_events_2021_2023.november_2021_hub');
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_events_2021_2023.nov21_sajbor';
    }));
    engine.goToScene('poland_events_2021_2023.june_2023_hub');
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_events_2021_2023.jun23_dorota';
    }));
    qualities.continuous_campaign = 1;
    qualities.government_party = 'ko';
    qualities.caretaker_government = 0;
    qualities.year = 2024;
    qualities.month = 4;
    assert.strictEqual(
      game.scenes['poland_events_2023_2024.abortion_first_reading']
        .viewIf(engine, qualities),
      false
    );
    qualities.month = 8;
    assert.strictEqual(
      game.scenes['poland_events_2023_2024.movement_reckoning_2024']
        .viewIf(engine, qualities),
      false
    );
    qualities.year = 2025;
    qualities.month = 3;
    qualities.movement_reckoning_2024_done = 1;
    assert.strictEqual(
      game.scenes['poland_events_2025.movement_spring_audit_2025']
        .viewIf(engine, qualities),
      false
    );

    startStandard('major-reform-three-question-completion');
    qualities = engine.state.qualities;
    qualities.abortion_reform_settled = 1;
    qualities.marriage_reform_settled = 1;
    qualities.labor_reform_settled = 1;
    qualities.major_reforms_complete = 0;
    const completionPollBefore = qualities.left_poll;
    const completionTrustBefore = qualities.public_trust;
    const completionReputationBefore = qualities.winner_reputation;
    const completionOwnershipBefore = qualities.issue_ownership;
    const completionAffinityBefore = qualities.voter_groups.map(
      function(group) {
        return qualities[group + '_left_affinity'];
      }
    );
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.major_reforms_complete, 1);
    assert.strictEqual(qualities.left_poll, completionPollBefore + 2);
    assert.strictEqual(qualities.public_trust, completionTrustBefore + 4);
    assert.strictEqual(
      qualities.winner_reputation,
      completionReputationBefore + 5
    );
    assert.strictEqual(
      qualities.issue_ownership,
      completionOwnershipBefore + 5
    );
    qualities.voter_groups.forEach(function(group, index) {
      assert.strictEqual(
        qualities[group + '_left_affinity'],
        completionAffinityBefore[index] + 2,
        'Completing all major reforms did not reward ' + group
      );
    });
    assert.strictEqual(
      game.scenes.poland_major_reform_deck.viewIf(engine, qualities),
      false
    );
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.left_poll, completionPollBefore + 2);
    assert.strictEqual(qualities.public_trust, completionTrustBefore + 4);
    assert.strictEqual(
      qualities.winner_reputation,
      completionReputationBefore + 5
    );
    assert.strictEqual(
      qualities.issue_ownership,
      completionOwnershipBefore + 5
    );
    qualities.voter_groups.forEach(function(group, index) {
      assert.strictEqual(
        qualities[group + '_left_affinity'],
        completionAffinityBefore[index] + 2,
        'The major-reform completion reward repeated for ' + group
      );
    });

    const abortionPassagePower = function(ministryOwner, seed) {
      startStandard(seed);
      const passageQualities = engine.state.qualities;
      setExecutive(passageQualities, 'ko');
      setProject(passageQualities, 'abortion', 4);
      passageQualities.president_name = 'Rafał Trzaskowski';
      passageQualities.pres_2025_hostile_president = 0;
      passageQualities.ko_relation = 90;
      passageQualities.psl_relation = 90;
      passageQualities.president_relation = 90;
      passageQualities.ko_accept_rights = 80;
      passageQualities.ko_classical_liberal_share = 20;
      passageQualities.abortion_ko_commitment = 4;
      passageQualities.abortion_third_way_commitment = 4;
      passageQualities.abortion_palace_commitment = 1;
      passageQualities.abortion_palace_president = 'Rafał Trzaskowski';
      passageQualities.abortion_rights_support = 80;
      passageQualities.abortion_rights_backlash = 20;
      passageQualities.left_poll = 25;
      passageQualities.abortion_reform_progress = 20;
      passageQualities.equality_minister_party = ministryOwner;
      passageQualities.health_minister_party = ministryOwner;
      passageQualities.justice_minister_party = ministryOwner;
      engine.goToScene('poland_abortion_reform');
      return {
        power: passageQualities.abortion_reform_power,
        qualities: passageQualities,
      };
    };
    const outsideMinistries = abortionPassagePower(
      'KO',
      'major-reform-no-ministry-power'
    );
    const insideMinistries = abortionPassagePower(
      'Lewica',
      'major-reform-ministry-power'
    );
    qualities = insideMinistries.qualities;
    assert.strictEqual(qualities.abortion_reform_next_stage, 4);
    assert.strictEqual(
      insideMinistries.power - outsideMinistries.power,
      20,
      'Equality, Health and Justice ownership did not add passage power'
    );
    assert(qualities.abortion_reform_power >= qualities.abortion_reform_threshold);
    choose('poland_abortion_reform.advance');
    assert.strictEqual(qualities.abortion_reform_stage, 4);
    assert.strictEqual(qualities.abortion_reform_settled, 1);
    assertProjectHidden(qualities, 'abortion');

    [
      ['abortion', 1],
      ['marriage', 2],
      ['labor', 3],
      ['labor', 4],
      ['labor', 1],
    ].forEach(function(testCase) {
      const issue = testCase[0];
      const settlement = testCase[1];
      startStandard('major-reform-' + issue + '-level-' + settlement);
      const settlementQualities = engine.state.qualities;
      setExecutive(settlementQualities, 'lewica');
      setProject(settlementQualities, issue, settlement);
      settlementQualities.president_name = 'Rafał Trzaskowski';
      settlementQualities.pres_2025_hostile_president = 0;
      if (issue === 'abortion') {
        settlementQualities.abortion_cabinet_deadline = 1;
      }
      if (issue === 'labor') {
        settlementQualities.pip_reform_pending = 1;
      }
      settlementQualities.reform_pressure_issue = issue;
      settlementQualities.reform_pressure_target_stage = settlement;
      settlementQualities.reform_pressure_previous_stage = 0;
      settlementQualities.reform_pressure_return_mode = 'card';
      ['pis', 'ko', 'psl', 'p2050', 'konf'].forEach(function(rival) {
        settlementQualities[rival + '_poll'] = 10;
      });
      const opinionKey = {
        abortion: 'abortion_rights',
        marriage: 'lgbt_equality',
        labor: 'social_spending',
      }[issue];
      settlementQualities[opinionKey + '_support'] = 50;
      settlementQualities[opinionKey + '_backlash'] = 50;
      settlementQualities[opinionKey + '_left_ownership'] = 50;
      const leftPollBefore = settlementQualities.left_poll;
      const publicTrustBefore = settlementQualities.public_trust;
      const affinityBefore = settlementQualities.voter_groups.map(
        function(group) {
          return settlementQualities[group + '_left_affinity'];
        }
      );
      engine.goToScene('poland_major_reforms.resolve');
      assert.strictEqual(settlementQualities[issue + '_reform_stage'], settlement);
      assert.strictEqual(settlementQualities[issue + '_reform_settled'], 1);
      assert.strictEqual(settlementQualities[issue + '_reform_goal_stage'], 4);
      assert.strictEqual(
        settlementQualities[issue + '_reform_proposal_stage'],
        settlement
      );
      const expectedPollSwing = [0, -0.8, 0.6, 1.2, 3.0][settlement];
      assert(
        Math.abs(
          settlementQualities.left_poll - leftPollBefore - expectedPollSwing
        ) < 0.000001,
        issue + ' level ' + settlement + ' applied the wrong polling reward'
      );
      assert.strictEqual(
        settlementQualities.public_trust - publicTrustBefore,
        [0, -2, 1, 2, 5][settlement],
        issue + ' level ' + settlement + ' applied the wrong trust reward'
      );
      const expectedRivalPenalty = [0, -0.15, 0.10, 0.25, 0.55][settlement];
      ['pis', 'ko', 'psl', 'p2050', 'konf'].forEach(function(rival) {
        assert(
          Math.abs(
            settlementQualities[rival + '_poll'] -
              (10 - expectedRivalPenalty)
          ) < 0.000001,
          rival + ' received the wrong level ' + settlement + ' poll effect'
        );
      });
      const expectedOpinionShift = [0, -3, 2, 4, 7][settlement];
      assert.strictEqual(
        settlementQualities[opinionKey + '_support'],
        50 + expectedOpinionShift
      );
      assert.strictEqual(
        settlementQualities[opinionKey + '_backlash'],
        50 - expectedOpinionShift
      );
      const expectedBlocBoost = [0, 0, 0.5, 1, 2][settlement];
      settlementQualities.voter_groups.forEach(function(group, index) {
        assert.strictEqual(
          settlementQualities[group + '_left_affinity'],
          affinityBefore[index] + expectedBlocBoost,
          issue + ' level ' + settlement + ' did not reward ' + group
        );
      });
      if (issue === 'abortion' || issue === 'labor') {
        engine.goToScene('poland_normalize');
      }
      if (issue === 'abortion') {
        assert.strictEqual(settlementQualities.abortion_cabinet_deadline, 0);
      }
      if (issue === 'labor') {
        assert.strictEqual(settlementQualities.pip_reform_pending, 0);
        assert.strictEqual(
          settlementQualities.pip_law_enacted,
          settlement >= 2 ? 1 : 0
        );
      }
      assertProjectHidden(settlementQualities, issue);
    });

    startStandard('major-reform-forced-maximal-reward');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'ko');
    setProject(qualities, 'labor', 4);
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.pres_2025_hostile_president = 0;
    qualities.ko_relation = 0;
    qualities.ko_classical_liberal_share = 80;
    qualities.labor_ko_commitment = 0;
    qualities.resources = 5;
    qualities.left_poll = 10;
    ['pis', 'ko', 'psl', 'p2050', 'konf'].forEach(function(rival) {
      qualities[rival + '_poll'] = 10;
    });
    qualities.social_spending_support = 50;
    qualities.social_spending_backlash = 50;
    qualities.social_spending_left_ownership = 50;
    qualities.reform_pressure_issue = 'labor';
    qualities.reform_pressure_target_stage = 4;
    qualities.reform_pressure_previous_stage = 0;
    qualities.reform_pressure_return_mode = 'card';
    const forcedTrustBefore = qualities.public_trust;
    const forcedAffinityBefore = qualities.voter_groups.map(
      function(group) {
        return qualities[group + '_left_affinity'];
      }
    );
    engine.goToScene('poland_major_reforms.resolve');
    assert.strictEqual(qualities.reform_pressure_actor, 'ko');
    engine.goToScene('poland_reform_pressure');
    choose('poland_reform_pressure.objection_force');
    assert.strictEqual(qualities.labor_reform_stage, 4);
    assert.strictEqual(qualities.left_poll, 14.5);
    ['pis', 'ko', 'psl', 'p2050', 'konf'].forEach(function(rival) {
      assert.strictEqual(
        qualities[rival + '_poll'],
        9.25,
        rival + ' escaped the forced maximal reform polling penalty'
      );
    });
    assert.strictEqual(qualities.public_trust, forcedTrustBefore + 7);
    assert.strictEqual(qualities.social_spending_support, 61);
    assert.strictEqual(qualities.social_spending_backlash, 39);
    assert.strictEqual(qualities.social_spending_left_ownership, 64);
    qualities.voter_groups.forEach(function(group, index) {
      assert.strictEqual(
        qualities[group + '_left_affinity'],
        forcedAffinityBefore[index] + 3,
        'A forced maximal reform did not reward ' + group
      );
    });
    assert(qualities.news_headline.includes('survives coalition opposition'));

    startStandard('major-reform-forced-fallback');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'ko');
    setProject(qualities, 'marriage', 4);
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.pres_2025_hostile_president = 0;
    qualities.ministry_psl_in_cabinet = 1;
    qualities.ko_relation = 80;
    qualities.ko_classical_liberal_share = 20;
    qualities.psl_relation = 40;
    qualities.marriage_ko_commitment = 4;
    qualities.marriage_third_way_commitment = 0;
    qualities.reform_pressure_issue = 'marriage';
    qualities.reform_pressure_target_stage = 4;
    qualities.reform_pressure_previous_stage = 0;
    qualities.reform_pressure_return_mode = 'card';
    const dissentBeforeBargain = qualities.government_coalition_dissent;
    const resourcesBeforeBargain = qualities.resources;
    engine.goToScene('poland_major_reforms.resolve');
    assert.strictEqual(qualities.reform_pressure_pending, 1);
    assert.strictEqual(qualities.reform_pressure_actor, 'psl');
    assert.strictEqual(qualities.reform_pressure_target_stage, 4);
    assert.strictEqual(qualities.marriage_reform_proposal_stage, 4);
    engine.goToScene('poland_reform_pressure');
    choose('poland_reform_pressure.objection_narrow');
    assert.strictEqual(qualities.reform_pressure_target_stage, 3);
    assert.strictEqual(qualities.marriage_reform_proposal_stage, 3);
    assert.strictEqual(qualities.reform_pressure_pending, 1);
    assert.strictEqual(engine.state.sceneId, 'poland_reform_pressure.objection');
    choose('poland_reform_pressure.objection_narrow');
    assert.strictEqual(qualities.reform_pressure_target_stage, 2);
    assert.strictEqual(qualities.marriage_reform_proposal_stage, 2);
    assert.strictEqual(qualities.reform_pressure_pending, 1);
    choose('poland_reform_pressure.objection_bargain');
    assert.strictEqual(qualities.marriage_third_way_commitment, 1);
    assert.strictEqual(qualities.reform_pressure_pending, 1);
    choose('poland_reform_pressure.objection_bargain');
    assert.strictEqual(qualities.marriage_third_way_commitment, 2);
    assert.strictEqual(qualities.marriage_reform_stage, 2);
    assert.strictEqual(qualities.marriage_reform_settled, 1);
    assert.strictEqual(qualities.resources, resourcesBeforeBargain - 2);
    assert.strictEqual(
      qualities.government_coalition_dissent,
      dissentBeforeBargain + 16
    );
    assertProjectHidden(qualities, 'marriage');

    const assertReferendumLoss = function(
      issue,
      supportKey,
      backlashKey,
      trustKey,
      supportFloor
    ) {
      startStandard('major-reform-' + issue + '-referendum-loss');
      const referendumQualities = engine.state.qualities;
      setExecutive(referendumQualities, 'ko');
      setProject(referendumQualities, issue, 2);
      referendumQualities.left_poll = 0;
      referendumQualities.resources = 5;
      referendumQualities[issue + '_reform_progress'] = 45;
      referendumQualities[issue + '_referendum_mandate'] = 0;
      referendumQualities[supportKey] = supportFloor;
      referendumQualities[backlashKey] = 100;
      referendumQualities.public_trust = 50;
      referendumQualities[trustKey] = 50;
      engine.goToScene('poland_' + issue + '_reform');
      const publicTrustBefore = referendumQualities.public_trust;
      const movementTrustBefore = referendumQualities[trustKey];
      choose('poland_' + issue + '_reform.referendum');
      assert(referendumQualities[issue + '_referendum_score'] < 50);
      assert.strictEqual(referendumQualities[issue + '_reform_stage'], 0);
      assert.strictEqual(referendumQualities[issue + '_reform_settled'], 0);
      assert.strictEqual(referendumQualities[issue + '_reform_progress'], 37);
      assert.strictEqual(
        referendumQualities[issue + '_reform_proposal_stage'],
        4
      );
      assert.strictEqual(
        referendumQualities['poland_' + issue + '_reform_timer'],
        6
      );
      assert.strictEqual(
        referendumQualities.public_trust,
        publicTrustBefore - 2
      );
      assert.strictEqual(
        referendumQualities[trustKey],
        movementTrustBefore - 2
      );
    };
    assertReferendumLoss(
      'abortion',
      'abortion_rights_support',
      'abortion_rights_backlash',
      'feminist_trust',
      50
    );
    assertReferendumLoss(
      'marriage',
      'lgbt_equality_support',
      'lgbt_equality_backlash',
      'progressive_credibility',
      52
    );

    startStandard('major-reform-withdrawal-cooldown');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'ko');
    setProject(qualities, 'abortion', 2);
    qualities.ministry_psl_in_cabinet = 1;
    qualities.abortion_reform_progress = 25;
    qualities.reform_pressure_pending = 1;
    qualities.reform_pressure_mode = 'partner_objection';
    qualities.reform_pressure_actor = 'psl';
    qualities.reform_pressure_actor_name = 'PSL / Third Way';
    qualities.reform_pressure_issue = 'abortion';
    qualities.reform_pressure_target_stage = 2;
    qualities.reform_pressure_previous_stage = 0;
    qualities.reform_pressure_return_mode = 'pressure';
    const publicTrustBeforeWithdrawal = qualities.public_trust;
    const feministTrustBeforeWithdrawal = qualities.feminist_trust;
    engine.goToScene('poland_reform_pressure');
    choose('poland_reform_pressure.objection_withdraw');
    assert.strictEqual(qualities.reform_pressure_abandoned, 1);
    assert.strictEqual(qualities.abortion_reform_stage, 0);
    assert.strictEqual(qualities.abortion_reform_settled, 0);
    assert.strictEqual(qualities.abortion_reform_proposal_stage, 4);
    assert.strictEqual(qualities.abortion_reform_progress, 15);
    assert.strictEqual(qualities.poland_abortion_reform_timer, 5);
    assert.strictEqual(qualities.public_trust, publicTrustBeforeWithdrawal - 1);
    assert.strictEqual(
      qualities.feminist_trust,
      feministTrustBeforeWithdrawal - 4
    );
    assert(
      !drawableCardIds('poland_major_reform_deck').includes(
        'poland_abortion_reform'
      )
    );
    qualities.poland_abortion_reform_timer = 0;
    qualities.month_actions = 0;
    assert(
      drawableCardIds('poland_major_reform_deck').includes(
        'poland_abortion_reform'
      )
    );
    engine.goToScene('poland_abortion_reform');
    assert.strictEqual(qualities.abortion_reform_next_stage, 4);

    startStandard('major-reform-delayed-authority-loss');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'ko');
    setProject(qualities, 'labor', 3);
    qualities.reform_pressure_pending = 1;
    qualities.reform_pressure_mode = 'partner_objection';
    qualities.reform_pressure_actor = 'ko';
    qualities.reform_pressure_actor_name = 'KO';
    qualities.reform_pressure_issue = 'labor';
    qualities.reform_pressure_target_stage = 3;
    qualities.reform_pressure_previous_stage = 0;
    qualities.reform_pressure_return_mode = 'pressure';
    qualities.left_in_government = 0;
    qualities.government_has_confidence = 0;
    const deliveryBeforeAuthorityLoss = qualities.government_delivery;
    engine.goToScene('poland_reform_pressure');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_major_reforms.authority_lost'
    );
    assert.strictEqual(qualities.labor_reform_stage, 0);
    assert.strictEqual(qualities.labor_reform_settled, 0);
    assert.strictEqual(qualities.labor_reform_proposal_stage, 4);
    assert.strictEqual(qualities.reform_pressure_pending, 0);
    assert.strictEqual(qualities.government_delivery, deliveryBeforeAuthorityLoss);

    startStandard('major-reform-palace-commitment-ownership');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'lewica');
    setProject(qualities, 'marriage', 4);
    qualities.president_name = 'Karol Nawrocki';
    qualities.pres_2025_hostile_president = 1;
    qualities.president_relation = 0;
    qualities.marriage_palace_commitment = 4;
    qualities.marriage_palace_president = 'Andrzej Duda';
    qualities.reform_pressure_issue = 'marriage';
    qualities.reform_pressure_target_stage = 4;
    qualities.reform_pressure_previous_stage = 0;
    qualities.reform_pressure_return_mode = 'card';
    engine.goToScene('poland_major_reforms.resolve');
    assert.strictEqual(qualities.reform_pressure_actor, 'president');
    assert.strictEqual(qualities.marriage_reform_stage, 0);
    engine.goToScene('poland_reform_pressure');
    choose('poland_reform_pressure.palace_reconsider');
    assert.strictEqual(qualities.marriage_palace_president, 'Karol Nawrocki');
    assert.strictEqual(qualities.marriage_palace_commitment, 1);
    assert.strictEqual(qualities.marriage_reform_stage, 0);
    assert.strictEqual(qualities.reform_pressure_pending, 1);
    assert.strictEqual(qualities.reform_pressure_actor, 'president');

    startStandard('major-reform-lawful-override-count');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'lewica');
    setProject(qualities, 'abortion', 4);
    qualities.president_name = 'Andrzej Duda';
    qualities.pres_2025_hostile_president = 1;
    qualities.resources = 5;
    qualities.government_support_seats = 250;
    qualities.coalition_seats = 245;
    qualities.left_committed_seats = 0;
    qualities.ministry_left_cabinet_seats = 0;
    qualities.coalition_democratic_seats = 320;
    qualities.coalition_right_seats = 320;
    qualities.reform_pressure_pending = 1;
    qualities.reform_pressure_mode = 'partner_objection';
    qualities.reform_pressure_actor = 'president';
    qualities.reform_pressure_actor_name = 'President Andrzej Duda';
    qualities.reform_pressure_issue = 'abortion';
    qualities.reform_pressure_target_stage = 4;
    qualities.reform_pressure_previous_stage = 0;
    engine.goToScene('poland_reform_pressure');
    assert.strictEqual(qualities.reform_pressure_override_votes, 250);
    assert.strictEqual(qualities.reform_pressure_override_available, 0);
    const overrideChoice = currentChoices().find(function(choice) {
      return choice.id === 'poland_reform_pressure.palace_override';
    });
    assert(overrideChoice && !overrideChoice.canChoose);

    qualities.left_cabinet_committed = 0;
    qualities.left_committed_seats = 30;
    qualities.ministry_left_cabinet_seats = 0;
    engine.goToScene('poland_reform_pressure');
    assert.strictEqual(
      qualities.reform_pressure_override_votes,
      280,
      'External committed Left MPs were omitted from the veto count'
    );
    assert.strictEqual(qualities.reform_pressure_override_available, 1);
    assert.strictEqual(
      currentChoices().find(function(choice) {
        return choice.id === 'poland_reform_pressure.palace_override';
      }).canChoose,
      true
    );

    startStandard('major-reform-pegasus-amendments');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'pis');
    qualities.resources = 5;
    qualities.pegasus_legal_framework = 0;
    queueDemand(qualities, 'pis', 'pegasus_legalisation');
    engine.goToScene('poland_reform_pressure');
    choose('poland_reform_pressure.demand_amend');
    assert.strictEqual(qualities.pegasus_legal_framework, 1);
    setExecutive(qualities, 'pis');
    qualities.reform_pressure_cooldown = 0;
    queueDemand(qualities, 'pis', 'pegasus_legalisation');
    engine.goToScene('poland_reform_pressure');
    choose('poland_reform_pressure.demand_amend');
    assert.strictEqual(qualities.pegasus_legal_framework, 2);

    startStandard('major-reform-ai-needs-live-sponsor');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'lewica');
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.pres_2025_hostile_president = 0;
    qualities.rival_ai_initialized = 1;
    qualities.rival_ai_tick = 4;
    qualities.reform_pressure_pending = 0;
    qualities.reform_pressure_cooldown = 0;
    engine.goToScene('poland_party_ai');
    assert.strictEqual(qualities.reform_pressure_pending, 0);

    startStandard('major-reform-demand-lapses-with-sponsor');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'lewica');
    qualities.public_media_patron = 'pis';
    qualities.coalition_media_takeover_concessions = 0;
    queueDemand(qualities, 'ko', 'public_media_takeover');
    engine.goToScene('poland_reform_pressure');
    assert.strictEqual(engine.state.sceneId, 'poland_reform_pressure.demand_lapsed');
    assert.strictEqual(qualities.reform_pressure_pending, 0);
    assert.strictEqual(qualities.public_media_patron, 'pis');
    assert.strictEqual(qualities.coalition_media_takeover_concessions, 0);

    startStandard('major-reform-ai-stops-completed-pis-goals');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'pis');
    qualities.rival_ai_initialized = 1;
    qualities.rival_ai_tick = 4;
    qualities.reform_pressure_pending = 0;
    qualities.reform_pressure_cooldown = 0;
    qualities.pegasus_legal_framework = 2;
    qualities.anticlerical_edge = 20;
    qualities.pzpr_history_concessions = 2;
    qualities.barons_party_formed = 0;
    engine.goToScene('poland_party_ai');
    assert.strictEqual(qualities.reform_pressure_pending, 0);

    startStandard('major-reform-ko-demand-recurrence');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'ko');
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.pres_2025_hostile_president = 0;
    qualities.rival_ai_initialized = 1;
    qualities.rival_ai_tick = 4;
    qualities.reform_pressure_pending = 0;
    qualities.reform_pressure_cooldown = 0;
    qualities.coalition_judicial_pressure_concessions = 2;
    qualities.coalition_media_takeover_concessions = 0;
    qualities.marketisation_concessions = 2;
    qualities.public_media_patron = 'pis';
    engine.goToScene('poland_party_ai');
    assert.strictEqual(qualities.reform_pressure_actor, 'ko');
    assert.strictEqual(qualities.reform_pressure_issue, 'public_media_takeover');
    choose('poland_reform_pressure.demand_refuse');
    assert.strictEqual(qualities.coalition_media_takeover_concessions, 0);
    assert.strictEqual(qualities.public_media_patron, 'pis');
    setExecutive(qualities, 'ko');
    qualities.rival_ai_initialized = 1;
    qualities.rival_ai_tick = 8;
    qualities.reform_pressure_pending = 0;
    qualities.reform_pressure_cooldown = 0;
    engine.goToScene('poland_party_ai');
    assert.strictEqual(qualities.reform_pressure_actor, 'ko');
    assert.strictEqual(qualities.reform_pressure_issue, 'public_media_takeover');
    choose('poland_reform_pressure.demand_accept');
    assert.strictEqual(qualities.public_media_patron, 'ko');
    assert.strictEqual(qualities.coalition_media_takeover_concessions, 2);

    startStandard('major-reform-pis-pzpr-demand');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'pis');
    qualities.pis_relation = 8;
    qualities.rival_ai_initialized = 1;
    qualities.rival_ai_tick = 8;
    qualities.reform_pressure_pending = 0;
    qualities.reform_pressure_cooldown = 0;
    engine.goToScene('poland_party_ai');
    assert.strictEqual(qualities.reform_pressure_actor, 'pis');
    assert.strictEqual(qualities.reform_pressure_issue, 'pzpr_condemnation');
    assert(qualities.reform_pressure_intensity >= 70);
    choose('poland_reform_pressure.demand_accept');
    assert.strictEqual(qualities.pzpr_history_concessions, 2);
    assert.strictEqual(qualities.barons_escalation_stage, 7);
    assert.strictEqual(qualities.caucus_crisis_pending, 1);

    startStandard('major-reform-pis-labour-route');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'pis');
    setProject(qualities, 'labor', 4);
    qualities.pis_relation = 30;
    qualities.pis_accept_social = 70;
    qualities.pis_solidarist_share = 80;
    qualities.pis_market_hardliner_share = 20;
    qualities.labor_reform_progress = 40;
    qualities.labor_credibility = 80;
    qualities.workers_support = 80;
    qualities.social_spending_support = 80;
    qualities.left_poll = 20;
    qualities.labor_minister_party = 'Lewica';
    engine.goToScene('poland_labor_reform');
    assert.strictEqual(qualities.labor_reform_next_stage, 4);
    assert(qualities.labor_reform_power >= qualities.labor_reform_threshold);
    choose('poland_labor_reform.advance');
    assert.strictEqual(qualities.reform_pressure_target_stage, 4);
    assert.strictEqual(qualities.reform_pressure_actor, 'pis');
    engine.goToScene('poland_reform_pressure');
    choose('poland_reform_pressure.objection_narrow');
    assert.strictEqual(qualities.reform_pressure_target_stage, 3);
    assert.strictEqual(qualities.labor_reform_proposal_stage, 3);
    assert.strictEqual(qualities.reform_pressure_pending, 1);
    choose('poland_reform_pressure.objection_narrow');
    assert.strictEqual(qualities.labor_reform_stage, 2);
    assert.strictEqual(qualities.labor_reform_proposal_stage, 2);
    assert.strictEqual(qualities.labor_reform_settled, 1);
    assertProjectHidden(qualities, 'labor');

    [
      'abortion',
      'labor',
      'marriage',
    ].forEach(function(issue) {
      startStandard('major-reform-pis-round-gate-' + issue);
      const gateQualities = engine.state.qualities;
      gateQualities[issue + '_reform_defined'] = 1;
      gateQualities.resources = 2;
      gateQualities.month_actions = 0;
      engine.goToScene('poland_' + issue + '_reform');
      choose('poland_' + issue + '_reform.coalition_round');
      let pisRound = currentChoices().find(function(choice) {
        return choice.id === 'poland_' + issue + '_reform.round_pis';
      });
      assert(
        pisRound && !pisRound.canChoose,
        'PiS recorded an opening ' + issue + ' promise without a channel'
      );
      gateQualities.left_in_government = 1;
      gateQualities.government_party = 'ko';
      engine.goToScene('poland_' + issue + '_reform.coalition_round');
      pisRound = currentChoices().find(function(choice) {
        return choice.id === 'poland_' + issue + '_reform.round_pis';
      });
      assert(
        pisRound && !pisRound.canChoose,
        'A non-PiS coalition unlocked a PiS ' + issue + ' promise'
      );
      gateQualities.left_in_government = 0;
      gateQualities.pis_relation = 15;
      engine.goToScene('poland_' + issue + '_reform.coalition_round');
      pisRound = currentChoices().find(function(choice) {
        return choice.id === 'poland_' + issue + '_reform.round_pis';
      });
      assert(
        pisRound && pisRound.canChoose,
        'An established PiS relationship did not unlock the ' + issue + ' round'
      );
    });
  }

  function testZeroResourceCardFallbacks() {
    assert.strictEqual(game.scenes.poland_government_deck.isDeck, true);
    const cardIds = Object.keys(game.scenes).filter(function(sceneId) {
      const scene = game.scenes[sceneId];
      return scene.isCard &&
        (scene.tags || []).some(function(tag) {
          return Object.values(deckTags).includes(tag);
        });
    });

    const partyCardIds = cardIds.filter(function(cardId) {
      return (game.scenes[cardId].tags || []).includes(
        'poland_party_card'
      );
    });
    const governmentCardIds = cardIds.filter(function(cardId) {
      return (game.scenes[cardId].tags || []).includes(
        'poland_government_card'
      );
    });
    const negotiationCardIds = cardIds.filter(function(cardId) {
      return (game.scenes[cardId].tags || []).includes(
        'poland_negotiation_card'
      );
    });
    const majorReformIds = cardIds.filter(function(cardId) {
      return (game.scenes[cardId].tags || []).includes(
        'poland_major_reform_card'
      );
    });
    const foreignCardIds = cardIds.filter(function(cardId) {
      return (game.scenes[cardId].tags || []).includes(
        'poland_foreign_card'
      );
    });
    assert(
      partyCardIds.length >= 19,
      'Party Affairs lost part of its minimum native card set'
    );
    assert.deepStrictEqual(
      governmentCardIds.slice().sort(),
      expectedGovernmentCardIds,
      'Government Affairs did not contain exactly the sixteen cabinet cards'
    );
    assert.strictEqual(
      negotiationCardIds.length,
      5,
      'Pressure & Negotiate did not contain its five native cards'
    );
    assert.deepStrictEqual(
      majorReformIds.slice().sort(),
      majorReformCardIds,
      'Major Reforms did not contain the three persistent projects'
    );
    assert.strictEqual(
      foreignCardIds.length,
      4,
      'Foreign Affairs did not contain exactly EU, Hungary, USA and Ukraine'
    );
    assert(
      cardIds.includes('poland_senate_docket'),
      'Native card corpus omitted the Senate docket'
    );
    cardIds.forEach(function(cardId) {
      startStandard('zero-resource-' + cardId);
      engine.state.qualities.resources = 0;
      if (cardId === 'poland_cost_the_programme') {
        engine.state.qualities.budget_promises = 1;
      }
      engine.goToScene(cardId);
      checkNumbers();

      const fallback = currentChoices().find(function(choice) {
        return choice.canChoose && choice.id !== 'root';
      });
      assert(
        fallback,
        cardId + ' has no legal political outcome at zero resources'
      );
    });
  }

  function testNegotiationAndCohabitation() {
    startStandard('opposition-negotiation-resolution');
    let qualities = engine.state.qualities;
    qualities.left_in_government = 0;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.prime_minister = 'Mateusz Morawiecki';
    qualities.government_name = 'Morawiecki PiS cabinet';
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.inflation = 15;
    qualities.economic_growth = -2;
    qualities.resources = 5;
    engine.goToScene('poland_hub');
    assert.strictEqual(qualities.government_party, 'pis');
    assert(
      qualities.left_role.toLowerCase().includes('opposition') &&
        qualities.left_role.toLowerCase().includes('without ministers'),
      'Opposition role copy claimed cabinet or spending authority'
    );
    assert(
      currentChoices().some(function(choice) {
        return choice.id === 'poland_negotiation_deck';
      }),
      'Opposition negotiation deck did not appear under a functioning PiS cabinet'
    );
    qualities.negotiation_leverage = 60;
    const securityBefore = qualities.household_security;
    engine.goToScene('poland_crisis_compact');
    choose('poland_crisis_compact.targeted');
    assert.strictEqual(qualities.negotiation_attempts, 1);
    assert.strictEqual(qualities.negotiation_last_threshold, 42);
    assert.strictEqual(qualities.negotiation_success, 1);
    assert.strictEqual(
      qualities.household_security,
      securityBefore + 5,
      'Successful crisis compact did not deliver its published material effect'
    );
    assert.strictEqual(qualities.left_in_government, 0);

    startStandard('tvp-prepared-pressure-to-bargain');
    qualities = engine.state.qualities;
    const openingLeverage = qualities.negotiation_leverage;
    const openingCapital = qualities.negotiation_capital;
    qualities.resources = 5;
    engine.goToScene('poland_tvp_appearance');
    choose('poland_tvp_appearance.dossier');
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.negotiation_capital, openingCapital + 7);
    assert(
      qualities.negotiation_leverage >= openingLeverage + 7,
      'A prepared TVP appearance did not create visible bargaining leverage'
    );
    qualities.month_actions = 0;
    engine.goToScene('poland_oversight_bargain');
    const amendment = currentChoices().find(function(choice) {
      return choice.id === 'poland_oversight_bargain.amendment';
    });
    assert(
      amendment && amendment.canChoose,
      'Earned TVP pressure did not unlock the bounded oversight bargain'
    );
    choose('poland_oversight_bargain.amendment');
    assert.strictEqual(qualities.negotiation_success, 1);
    assert.strictEqual(
      qualities.negotiation_capital,
      openingCapital + 4,
      'The successful bargain did not spend its published three capital'
    );

    startStandard('tvp-unprepared-ambush');
    qualities = engine.state.qualities;
    const leverageBeforeAmbush = qualities.negotiation_leverage;
    const capitalBeforeAmbush = qualities.negotiation_capital;
    qualities.media_capacity = 16;
    engine.goToScene('poland_tvp_appearance');
    choose('poland_tvp_appearance.live');
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.hostile_interview_success, 0);
    assert.strictEqual(
      qualities.negotiation_capital,
      capitalBeforeAmbush - 5
    );
    assert(
      qualities.negotiation_leverage < leverageBeforeAmbush,
      'Losing the TVP frame did not reduce visible bargaining leverage'
    );

    startStandard('pis-party-channel-builds-capital');
    qualities = engine.state.qualities;
    const capitalBeforeChannel = qualities.negotiation_capital;
    qualities.resources = 5;
    engine.goToScene('poland_inter_party_relations');
    choose('poland_inter_party_relations.pis_solidarists');
    assert.strictEqual(
      qualities.negotiation_capital,
      capitalBeforeChannel + 6,
      'The Party Affairs PiS channel did not build bargaining capital'
    );

    startStandard('pis-social-channel-effects');
    qualities = engine.state.qualities;
    qualities.left_in_government = 0;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.government_party = 'pis';
    const hostilityBefore = qualities.government_negotiation_hostility;
    const pisRelationBefore = qualities.pis_relation;
    const solidaristsBefore = qualities.pis_solidarist_share;
    const koRelationBefore = qualities.ko_relation;
    const cultureRight = qualities.rival_group_records.find(
      function(record) {
        return record.id === 'pis_culture';
      }
    );
    const rightGrievanceBefore = cultureRight.grievance_memory;
    engine.goToScene('poland_pis_social_channel');
    let socialChannelCopy = contentText(engine.state.currentContent) + ' ' +
      contentText(currentChoices().find(function(choice) {
        return choice.id === 'poland_pis_social_channel.protocol';
      }).subtitle);
    assert(socialChannelCopy.includes('KO and PSL will each'));
    assert(socialChannelCopy.includes('Relations with KO and PSL fall'));
    assert(!socialChannelCopy.includes('Third Way'));
    assert(!socialChannelCopy.includes('Poland 2050'));
    choose('poland_pis_social_channel.protocol');
    engine.goToScene('poland_normalize');
    assert.strictEqual(
      qualities.government_negotiation_hostility,
      hostilityBefore - 12
    );
    assert.strictEqual(qualities.pis_relation, pisRelationBefore + 8);
    assert.strictEqual(
      qualities.pis_solidarist_share,
      solidaristsBefore + 5
    );
    assert.strictEqual(qualities.ko_relation, koRelationBefore - 4);
    assert.strictEqual(
      cultureRight.grievance_memory,
      rightGrievanceBefore + 8,
      'The social channel did not raise dissent in the PiS culture right'
    );

    startStandard('pis-social-channel-third-way-copy');
    qualities = engine.state.qualities;
    qualities.third_way_active = 1;
    qualities.p2050_emerged = 1;
    engine.goToScene('poland_pis_social_channel');
    socialChannelCopy = contentText(engine.state.currentContent) + ' ' +
      contentText(currentChoices().find(function(choice) {
        return choice.id === 'poland_pis_social_channel.protocol';
      }).subtitle);
    assert(socialChannelCopy.includes('KO and the Third Way will'));
    assert(socialChannelCopy.includes(
      'Relations with KO and the Third Way fall'
    ));

    startStandard('pis-social-channel-successor-copy');
    qualities = engine.state.qualities;
    qualities.third_way_active = 0;
    qualities.p2050_emerged = 1;
    engine.goToScene('poland_pis_social_channel');
    socialChannelCopy = contentText(engine.state.currentContent) + ' ' +
      contentText(currentChoices().find(function(choice) {
        return choice.id === 'poland_pis_social_channel.protocol';
      }).subtitle);
    assert(socialChannelCopy.includes('KO, Poland 2050 and PSL will each'));
    assert(socialChannelCopy.includes(
      'Relations with KO, Poland 2050 and PSL fall'
    ));

    startStandard('trzaskowski-pis-fracture');
    qualities = engine.state.qualities;
    qualities.left_in_government = 0;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.prime_minister = 'Mateusz Morawiecki';
    qualities.government_name = 'Morawiecki PiS cabinet';
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.trz_cohabitation_temperature = 70;
    qualities.trz_right_fragmentation = 85;
    qualities.trz_right_backlash = 0;
    qualities.public_trust = 25;
    qualities.month_actions = 1;
    engine.goToScene('poland_hub');
    const stressBefore = qualities.pis_cohabitation_stress;
    engine.goToScene('poland_advance');
    assert(
      qualities.pis_cohabitation_stress > stressBefore &&
        qualities.pis_cohabitation_last_shift > 0,
      'Trzaskowski–PiS fracture pressure did not produce internal stress'
    );

    startStandard('trzaskowski-pis-rally');
    qualities = engine.state.qualities;
    qualities.left_in_government = 0;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.prime_minister = 'Mateusz Morawiecki';
    qualities.government_name = 'Morawiecki PiS cabinet';
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.trz_cohabitation_temperature = 70;
    qualities.trz_right_fragmentation = 0;
    qualities.trz_right_backlash = 90;
    qualities.far_right_agenda = 80;
    qualities.president_relation = 0;
    qualities.month_actions = 1;
    engine.goToScene('poland_hub');
    const rallyBefore = qualities.pis_cohabitation_rally;
    engine.goToScene('poland_advance');
    assert(
      qualities.pis_cohabitation_rally > rallyBefore &&
        qualities.pis_cohabitation_last_shift < 0,
      'Trzaskowski–PiS backlash did not produce a defensive rally'
    );

    startStandard('cooperative-president-partnership-signature');
    qualities = engine.state.qualities;
    qualities.president_name = 'Magdalena Biejat';
    qualities.pres_2025_winner = 'Magdalena Biejat';
    qualities.left_president = 1;
    qualities.pres_2025_hostile_president = 0;
    qualities.president_relation = 100;
    qualities.psl_relation = 100;
    qualities.partnership_palace_lobby = 1;
    const partnershipDeliveryBefore = qualities.government_delivery;
    engine.goToScene('poland_events_2026.partnership_veto_2026');
    assert.strictEqual(qualities.partnership_presidential_outcome, 'Signed');
    assert.strictEqual(qualities.partnership_presidential_lobby_bonus, 12);
    assert(qualities.partnership_presidential_score >= 50);
    assert.strictEqual(
      qualities.government_delivery,
      partnershipDeliveryBefore,
      'A presidential signature instantly implemented the partnership law'
    );
    assert.strictEqual(qualities.partnership_implementation_pending, 1);
    assert(
      currentChoices().some(function(choice) {
        return choice.id ===
          'poland_events_2026.partnership_signed_implement';
      }) &&
      !currentChoices().some(function(choice) {
        return choice.id === 'poland_events_2026.partnership_campaign';
      }),
      'A cooperative Trzaskowski presidency did not open the signature path'
    );
    choose('poland_events_2026.partnership_signed_implement');
    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.partnership_implementation_pending, 0);
    assert.strictEqual(qualities.partnership_implementation_complete, 1);
    assert.strictEqual(
      qualities.government_delivery,
      partnershipDeliveryBefore + 4,
      'The next-month cabinet callback did not implement the signed law'
    );

    startStandard('hostile-president-partnership-veto');
    qualities = engine.state.qualities;
    qualities.president_name = 'Karol Nawrocki';
    qualities.pres_2025_hostile_president = 1;
    qualities.president_relation = 0;
    qualities.psl_relation = 0;
    qualities.partnership_palace_lobby = 0;
    engine.goToScene('poland_events_2026.partnership_veto_2026');
    assert.strictEqual(qualities.partnership_presidential_outcome, 'Vetoed');
    assert.strictEqual(qualities.partnership_presidential_lobby_bonus, 0);
    assert(qualities.partnership_presidential_score < 50);
    assert(
      currentChoices().some(function(choice) {
        return choice.id === 'poland_events_2026.partnership_campaign';
      }) &&
      !currentChoices().some(function(choice) {
        return choice.id ===
          'poland_events_2026.partnership_signed_implement';
      }),
      'A hostile presidency did not preserve the veto path'
    );
  }

  function testLateAuthorityBoundaries() {
    [
      {
        name: 'pis',
        expectedAuthority: 'opposition',
        state: {
          government_party: 'pis',
          left_in_government: 0,
          government_has_confidence: 1,
          caretaker_government: 0,
        },
      },
      {
        name: 'caretaker',
        expectedAuthority: 'caretaker',
        state: {
          government_party: 'ko',
          left_in_government: 1,
          government_has_confidence: 0,
          caretaker_government: 1,
        },
      },
    ].forEach(function(testCase) {
      startStandard('boards-authority-' + testCase.name);
      const qualities = engine.state.qualities;
      Object.assign(qualities, testCase.state, {year: 2026, month: 9});
      engine.goToScene('poland_events_2026.women_boards_2026');
      assert.strictEqual(
        qualities.boards_law_enacted,
        0,
        testCase.name + ' route enacted the company-board law by fiat'
      );
      choose('poland_events_2026.boards_defend');
      assert.strictEqual(qualities.last_policy_implementation, 0);
      assert(
        qualities.last_policy_authority.toLowerCase().includes(
          testCase.expectedAuthority
        ),
        'The board proposal mislabeled ' + testCase.name + ' authority'
      );
    });

    startStandard('boards-authority-functioning-coalition');
    let qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2026,
      month: 9,
      government_party: 'ko',
      left_in_government: 1,
      government_has_confidence: 1,
      caretaker_government: 0,
    });
    engine.goToScene('poland_events_2026.women_boards_2026');
    assert.strictEqual(qualities.boards_law_enacted, 1);

    [
      'poland_events_2026.horizon_social',
      'poland_events_2026.horizon_rural',
      'poland_events_2026.horizon_fiscal',
    ].forEach(function(choiceId, index) {
      startStandard('budget-horizon-opposition-' + index);
      const opposition = engine.state.qualities;
      Object.assign(opposition, {
        year: 2026,
        month: 9,
        government_party: 'pis',
        left_in_government: 0,
        government_has_confidence: 1,
        caretaker_government: 0,
        fiscal_stress: 12,
        government_coalition_dissent: 22,
      });
      engine.goToScene('poland_events_2026.september_budget_horizon');
      assert.strictEqual(opposition.horizon_budget_authority, 0);
      choose(choiceId);
      assert.strictEqual(
        opposition.fiscal_stress,
        12,
        'An opposition horizon choice changed state fiscal stress'
      );
      assert.strictEqual(
        opposition.government_coalition_dissent,
        22,
        'An opposition horizon choice managed the sitting cabinet'
      );
    });

    startStandard('budget-horizon-government-authority');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2026,
      month: 9,
      government_party: 'ko',
      left_in_government: 1,
      government_has_confidence: 1,
      caretaker_government: 0,
      fiscal_stress: 12,
    });
    engine.goToScene('poland_events_2026.september_budget_horizon');
    assert.strictEqual(qualities.horizon_budget_authority, 1);
    choose('poland_events_2026.horizon_fiscal');
    assert.strictEqual(qualities.fiscal_stress, 8);
  }

  function testBudgetOppositionAndConstitutionalRoutes() {
    function openOppositionBudget(
      seed,
      governingSeats,
      caretaker,
      externalLeftSupport
    ) {
      startStandard(seed);
      const qualities = engine.state.qualities;
      qualities.year = 2024;
      qualities.month = 12;
      qualities.time = 62;
      qualities.annual_budget_year = 2024;
      qualities.left_seats = 26;
      qualities.left_in_government = 0;
      qualities.government_party = 'ko';
      qualities.prime_minister = 'Donald Tusk';
      qualities.government_name = 'KO-led democratic coalition';
      qualities.government_owner = 'KO-led democratic coalition';
      qualities.government_has_confidence = caretaker ? 0 : 1;
      qualities.caretaker_government = caretaker ? 1 : 0;
      qualities.coalition_seats = governingSeats;
      qualities.government_support_seats = governingSeats;
      qualities.left_committed_seats = 26;
      if (externalLeftSupport) {
        qualities.position = 'Confidence-and-supply opposition';
        qualities.left_cabinet_model =
          'Confidence and supply from opposition';
      }
      qualities.sejm_total = 460;
      qualities.sejm_quorum_floor = 230;
      engine.goToScene('poland_budget_2023_2026.annual_budget');
      checkNumbers();
      assert.strictEqual(qualities.annual_budget_fiscal_year, 2025);
      assert.strictEqual(
        qualities.budget_submission_time,
        59,
        'The Article 225 clock did not start at the autumn draft submission'
      );
      assert.strictEqual(qualities.budget_deadline_time, 63);
      assert.strictEqual(qualities.budget_deadline_label, 'January 2025');
      return qualities;
    }

    function openSixStageProcess(qualities) {
      const annualChoices = currentChoices().map(function(choice) {
        return choice.id;
      });
      assert(annualChoices.includes('poland_opposition_budget.start'));
      assert(!annualChoices.includes(
        'poland_budget_2023_2026.government_social_protocol'
      ));
      choose('poland_opposition_budget.start');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_opposition_budget.read_draft'
      );
      assert.strictEqual(
        qualities.opposition_budget_draft_title,
        "the coalition's first full 2025 budget"
      );
      choose('poland_opposition_budget.priorities');
      const priorityChoices = currentChoices().map(function(choice) {
        return choice.id;
      });
      [
        'poland_opposition_budget.priority_flood',
        'poland_opposition_budget.priority_security',
        'poland_opposition_budget.priority_kpo',
        'poland_opposition_budget.priority_razem_promises',
      ].forEach(function(choiceId) {
        assert(
          priorityChoices.includes(choiceId),
          'The 2024 crisis menu omitted ' + choiceId
        );
      });
      assert(!priorityChoices.includes(
        'poland_opposition_budget.priority_pandemic'
      ));
      assert.strictEqual(qualities.opposition_budget_priority_count, 0);
    }

    function finishConferenceAndChoose(tactic) {
      choose('poland_opposition_budget.priority_flood');
      choose('poland_opposition_budget.priority_kpo');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_opposition_budget.conference'
      );
      choose('poland_opposition_budget.conference_discipline');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_opposition_budget.conference_result'
      );
      choose(tactic);
      assert.strictEqual(
        engine.state.sceneId,
        'poland_opposition_budget.resolve'
      );
    }

    startStandard('opposition-budget-retains-2019-senate');
    let qualities = engine.state.qualities;
    qualities.resources = 5;
    engine.goToScene('poland_events.budget_2019');
    assert.strictEqual(engine.state.sceneId, 'poland_events.budget_2019');
    choose('poland_events.budget_2019_shadow');
    assert.strictEqual(
      qualities.annual_budget_done_2019,
      0,
      'The December draft was incorrectly treated as the Sejm vote'
    );
    assert.strictEqual(qualities.budget_submission_month, 12);
    assert.strictEqual(qualities.budget_deadline_label, 'April 2020');
    engine.goToScene('poland_events.budget_2019_sejm_vote_2020');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_opposition_budget.read_draft'
    );
    choose('poland_opposition_budget.priorities');
    choose('poland_opposition_budget.priority_wages');
    choose('poland_opposition_budget.priority_services');
    choose('poland_opposition_budget.conference_free_vote');
    assert(qualities.opposition_budget_named_rebels.includes('Adrian Zandberg'));
    choose('poland_opposition_budget.tactic_shadow');
    choose('poland_opposition_budget.complete');
    assert.strictEqual(engine.state.sceneId, 'poland_senate.budget_2019');
    assert(currentChoices().every(function(choice) {
      return !choice.id.toLowerCase().includes('reject');
    }));
    choose('poland_senate.budget_2019_record');
    choose('poland_senate.budget_2019_return_vote');
    choose('poland_senate.budget_2019_complete');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');

    qualities = openOppositionBudget(
      'opposition-budget-rejection',
      222,
      false
    );
    qualities.resources = 5;
    openSixStageProcess(qualities);
    const beforeShadowCapacity = {
      household: qualities.household_security,
      health: qualities.health_capacity,
      local: qualities.local_network,
      military: qualities.military_trust,
      delivery: qualities.government_delivery,
      kpo: qualities.kpo_delivery,
    };
    finishConferenceAndChoose('poland_opposition_budget.tactic_shadow');
    assert.strictEqual(qualities.annual_budget_yes, 222);
    assert.strictEqual(
      qualities.annual_budget_no + qualities.annual_budget_abstain,
      238,
      'Named Lewica rebels were lost from the rejection roll call'
    );
    assert.strictEqual(
      qualities.annual_budget_yes + qualities.annual_budget_no +
        qualities.annual_budget_abstain,
      460
    );
    assert.strictEqual(qualities.annual_budget_passed, 0);
    assert.deepStrictEqual(
      {
        household: qualities.household_security,
        health: qualities.health_capacity,
        local: qualities.local_network,
        military: qualities.military_trust,
        delivery: qualities.government_delivery,
        kpo: qualities.kpo_delivery,
      },
      beforeShadowCapacity,
      'A shadow budget changed public capacity before enactment'
    );
    assert.strictEqual(qualities.opposition_budget_issue_ownership, 5);
    assert.strictEqual(qualities.opposition_budget_credibility, 4);
    assert.strictEqual(qualities.opposition_budget_media_attention, 4);
    assert.strictEqual(qualities.annual_budget_year, 2024);
    assert.strictEqual(qualities.annual_budget_left_cabinet_authority, 0);
    choose('poland_opposition_budget.complete');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_budget_2023_2026.opposition_budget_failed'
    );
    assert.strictEqual(qualities.government_has_confidence, 1);
    assert.strictEqual(qualities.caretaker_government, 0);
    assert.strictEqual(qualities.snap_election_requested, 0);

    qualities = openOppositionBudget(
      'opposition-budget-external-support-not-double-counted',
      222,
      false,
      true
    );
    assert.strictEqual(
      qualities.annual_budget_preview_government_yes,
      222,
      'The budget preview counted Lewica both inside coalition_seats and separately'
    );
    qualities.resources = 5;
    openSixStageProcess(qualities);
    finishConferenceAndChoose('poland_opposition_budget.tactic_against');
    assert.strictEqual(qualities.opposition_budget_government_seats, 222);
    assert.strictEqual(qualities.annual_budget_yes, 222);
    assert.strictEqual(
      qualities.annual_budget_no + qualities.annual_budget_abstain,
      238
    );
    assert.strictEqual(
      qualities.annual_budget_yes + qualities.annual_budget_no +
        qualities.annual_budget_abstain,
      460
    );
    assert.strictEqual(qualities.annual_budget_passed, 0);

    qualities = openOppositionBudget(
      'opposition-budget-toleration',
      222,
      false
    );
    qualities.resources = 5;
    openSixStageProcess(qualities);
    finishConferenceAndChoose('poland_opposition_budget.tactic_abstain');
    assert.strictEqual(qualities.annual_budget_yes, 222);
    assert.strictEqual(
      qualities.annual_budget_no + qualities.annual_budget_abstain,
      238,
      'The toleration posture did not account for the full non-government bloc'
    );
    assert.strictEqual(
      qualities.annual_budget_threshold,
      qualities.annual_budget_no + 1
    );
    assert.strictEqual(
      qualities.annual_budget_passed,
      1,
      'An ordinary bill with more yes than no incorrectly required 231 yes'
    );

    qualities = openOppositionBudget(
      'opposition-budget-negotiation-and-audit',
      222,
      false
    );
    qualities.resources = 5;
    openSixStageProcess(qualities);
    qualities.negotiation_capital = 100;
    const beforeConcession = {
      household: qualities.household_security,
      health: qualities.health_capacity,
      local: qualities.local_network,
      delivery: qualities.government_delivery,
      kpo: qualities.kpo_delivery,
    };
    finishConferenceAndChoose('poland_opposition_budget.tactic_bargain');
    assert.strictEqual(qualities.opposition_budget_amendments_passed, 2);
    assert.strictEqual(qualities.annual_budget_passed, 1);
    assert.strictEqual(qualities.opposition_budget_audit_enacted, 1);
    const budgetResultCopy = contentText(engine.state.currentContent);
    assert(budgetResultCopy.includes('What your choice achieved'));
    assert(budgetResultCopy.includes('Full Sejm roll call'));
    assert(budgetResultCopy.includes('Next: Senate review'));
    assert(!budgetResultCopy.includes('Government acceptance score'));
    assert.deepStrictEqual(
      {
        household: qualities.household_security,
        health: qualities.health_capacity,
        local: qualities.local_network,
        delivery: qualities.government_delivery,
        kpo: qualities.kpo_delivery,
      },
      beforeConcession,
      'An enacted opposition clause changed capacity before next year\'s audit'
    );
    qualities.year = 2025;
    qualities.annual_budget_year = 2025;
    engine.goToScene('poland_opposition_budget.start');
    assert.strictEqual(engine.state.sceneId, 'poland_opposition_budget.audit');
    assert.strictEqual(qualities.opposition_budget_audit_capacity_gain, 4);
    assert.strictEqual(qualities.local_network, beforeConcession.local + 2);
    assert.strictEqual(
      qualities.government_delivery,
      beforeConcession.delivery + 3
    );
    assert.strictEqual(qualities.opposition_budget_audit_pending, 0);

    qualities = openOppositionBudget(
      'opposition-budget-one-technical-revision',
      216,
      false
    );
    qualities.resources = 5;
    const beforeRevisionHousehold = qualities.household_security;
    openSixStageProcess(qualities);
    finishConferenceAndChoose('poland_opposition_budget.tactic_shadow');
    choose('poland_opposition_budget.complete');
    assert.strictEqual(qualities.annual_budget_passed, 0);
    choose('poland_budget_2023_2026.opposition_revision_hearing');
    choose('poland_budget_2023_2026.opposition_revision_abstain');
    assert.strictEqual(qualities.budget_rescue_attempted, 1);
    assert.strictEqual(qualities.annual_budget_yes, 216);
    assert.strictEqual(qualities.annual_budget_no, 214);
    assert.strictEqual(
      qualities.annual_budget_passed,
      1,
      'The cabinet technical revision did not change the second roll-call arithmetic'
    );
    choose('poland_budget_2023_2026.opposition_roll_continue');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_budget_2023_2026.opposition_budget_passed'
    );
    assert.strictEqual(
      qualities.household_security,
      beforeRevisionHousehold,
      'A technical revision granted capacity before its next-year audit'
    );

    qualities = openOppositionBudget(
      'caretaker-budget-rejection',
      222,
      true
    );
    qualities.resources = 5;
    openSixStageProcess(qualities);
    finishConferenceAndChoose('poland_opposition_budget.tactic_against');
    assert.strictEqual(qualities.annual_budget_passed, 0);
    choose('poland_opposition_budget.complete');
    assert.strictEqual(qualities.caretaker_government, 1);
    assert.strictEqual(qualities.snap_election_requested, 0);

    if (process.env.DSS_BUDGET_SMOKE === '1') {
      return;
    }

    startStandard('article-160-is-not-a-budget-vote');
    qualities = engine.state.qualities;
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.annual_budget_left_cabinet_authority = 1;
    qualities.annual_budget_passed = 0;
    qualities.annual_budget_yes = 220;
    qualities.annual_budget_no = 212;
    qualities.annual_budget_abstain = 28;
    qualities.budget_deadline_active = 1;
    qualities.party_unity = 50;
    qualities.ko_relation = 40;
    qualities.psl_relation = 40;
    qualities.p2050_relation = 40;
    engine.goToScene('poland_budget_2023_2026.confidence_roll');
    checkNumbers();
    assert.strictEqual(qualities.government_has_confidence, 1);
    assert.strictEqual(
      qualities.annual_budget_passed,
      0,
      'Article 160 confidence silently enacted the defeated budget'
    );
    assert.strictEqual(qualities.budget_deadline_active, 1);
    assert.strictEqual(
      qualities.confidence_threshold,
      qualities.confidence_no + 1
    );

    startStandard('constructive-motion-requires-sitting-cabinet');
    qualities = engine.state.qualities;
    qualities.year = 2026;
    qualities.month = 11;
    qualities.continuous_campaign = 1;
    qualities.government_coalition_dissent = 60;
    qualities.coalition_broken = 1;
    qualities.government_has_confidence = 0;
    qualities.caretaker_government = 1;
    qualities.formation_in_progress = 1;
    const horizonConstructive =
      game.scenes['poland_events_2026.constructive_motion_2026'];
    assert.strictEqual(
      horizonConstructive.viewIf(engine.state, qualities),
      false,
      'A caretaker without confidence received a constructive no-confidence vote'
    );
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.formation_in_progress = 0;
    qualities.government_party = 'ko';
    assert.strictEqual(
      horizonConstructive.viewIf(engine.state, qualities),
      true,
      'A sitting cabinet crisis could not trigger the constructive vote'
    );
    qualities.government_party = 'pis';
    assert.strictEqual(
      horizonConstructive.viewIf(engine.state, qualities),
      false,
      'Opposition PiS moved against an existing PiS cabinet'
    );

    startStandard('constructive-motion-success-cleans-state');
    qualities = engine.state.qualities;
    qualities.year = 2026;
    qualities.month = 11;
    qualities.continuous_campaign = 1;
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.formation_in_progress = 0;
    qualities.formation_complete = 1;
    qualities.coalition_broken = 1;
    qualities.government_party = 'ko';
    qualities.government_coalition_dissent = 45;
    qualities.pis_seats = 240;
    qualities.psl_seats = 40;
    qualities.pis_morawiecki_camp = 0;
    qualities.pis_split = 0;
    qualities.far_right_agenda = 0;
    qualities.psl_relation = 100;
    qualities.p2050_relation = 100;
    const preConstructiveLeftSeats = qualities.left_seats;
    const preConstructiveOtherSeats = qualities.other_seats;
    engine.goToScene(
      'poland_events_2026.constructive_motion_2026'
    );
    choose('poland_events_2026.constructive_szydlo');
    assert.strictEqual(qualities.constructive_passed, 1);
    assert(qualities.constructive_left_defections > 0);
    assert.strictEqual(
      qualities.left_seats,
      preConstructiveLeftSeats - qualities.constructive_left_defections
    );
    assert.strictEqual(
      qualities.other_seats,
      preConstructiveOtherSeats + qualities.constructive_left_defections
    );
    assert.strictEqual(
      qualities.coalition_seats,
      qualities.pis_seats,
      'PiS cabinet-party seats were confused with constructive yes votes'
    );
    assert.strictEqual(qualities.caretaker_government, 0);
    assert.strictEqual(qualities.formation_in_progress, 0);
    assert.strictEqual(qualities.formation_complete, 1);
    assert.strictEqual(qualities.coalition_broken, 0);

    startStandard('constructive-motion-failure-preserves-cabinet');
    qualities = engine.state.qualities;
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.formation_in_progress = 0;
    qualities.formation_complete = 1;
    qualities.coalition_seats = 250;
    qualities.government_coalition_dissent = 45;
    qualities.pis_seats = 100;
    qualities.psl_seats = 0;
    qualities.pis_morawiecki_camp = 0;
    qualities.pis_split = 0;
    qualities.far_right_agenda = 0;
    qualities.psl_relation = 100;
    qualities.p2050_relation = 100;
    engine.goToScene(
      'poland_events_2026.constructive_motion_2026'
    );
    choose('poland_events_2026.constructive_morawiecki');
    assert.strictEqual(qualities.constructive_passed, 0);
    assert.strictEqual(qualities.government_has_confidence, 1);
    assert.strictEqual(qualities.caretaker_government, 0);
    assert.strictEqual(qualities.coalition_seats, 250);

    startStandard('legacy-constructive-success-updates-majority');
    qualities = engine.state.qualities;
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.formation_in_progress = 0;
    qualities.constructive_candidate = 'Beata Szydło';
    qualities.constructive_sponsors = 100;
    qualities.constructive_yes = 235;
    qualities.constructive_no = 200;
    qualities.constructive_abstain = 25;
    qualities.constructive_democratic = 0;
    qualities.government_support_seats = 222;
    engine.goToScene('poland_government_formation.constructive_roll');
    assert.strictEqual(qualities.constructive_passed, 1);
    assert.strictEqual(qualities.coalition_seats, 235);
    assert.strictEqual(
      qualities.government_support_seats,
      235,
      'A successful right replacement inherited the old cabinet support count'
    );
    assert.strictEqual(qualities.caretaker_government, 0);
    assert.strictEqual(qualities.formation_in_progress, 0);
    assert.strictEqual(qualities.coalition_broken, 0);

    startStandard('legacy-democratic-replacement-updates-support');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      left_in_government: 1,
      government_has_confidence: 1,
      caretaker_government: 0,
      formation_in_progress: 0,
      constructive_candidate: 'Rafał Trzaskowski',
      constructive_sponsors: 100,
      constructive_yes: 250,
      constructive_no: 180,
      constructive_abstain: 30,
      constructive_democratic: 1,
      left_committed_seats: 26,
      government_support_seats: 194,
    });
    engine.goToScene('poland_government_formation.constructive_roll');
    assert.strictEqual(qualities.constructive_passed, 1);
    assert.strictEqual(
      qualities.government_support_seats,
      224,
      'A democratic replacement counted Lewica twice or kept stale support'
    );

    startStandard('snap-request-preserves-office');
    qualities = engine.state.qualities;
    qualities.year = 2026;
    qualities.month = 12;
    qualities.time = 86;
    qualities.annual_budget_year = 2026;
    qualities.annual_budget_left_cabinet_authority = 1;
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    engine.goToScene('poland_budget_2023_2026.confidence_snap');
    assert.strictEqual(qualities.snap_election_requested, 1);
    assert.strictEqual(
      qualities.caretaker_government,
      0,
      'Requesting election talks improperly dismissed the cabinet'
    );
    qualities.left_committed_seats = 26;
    qualities.ko_seats = 100;
    qualities.psl_seats = 25;
    qualities.p2050_seats = 25;
    qualities.ko_relation = 0;
    qualities.psl_relation = 0;
    qualities.p2050_relation = 0;
    qualities.ko_poll_momentum = 0;
    qualities.psl_poll_momentum = 0;
    qualities.p2050_poll_momentum = 0;
    qualities.pis_poll_momentum = 0;
    qualities.konf_poll_momentum = 0;
    qualities.budget_deadline_time = qualities.time + 4;
    qualities.snap_event_deferred_time = -1;
    engine.goToScene('poland_events_2026.snap_election_2026');
    let selfDissolve = currentChoices().find(function(choice) {
      return choice.id === 'poland_events_2026.snap_self_dissolve';
    });
    let budgetDeadline = currentChoices().find(function(choice) {
      return choice.id === 'poland_events_2026.snap_budget_deadline';
    });
    assert(selfDissolve && !selfDissolve.canChoose);
    assert(budgetDeadline && !budgetDeadline.canChoose);
    choose('poland_events_2026.snap_defer');
    assert.strictEqual(
      qualities.caretaker_government,
      0,
      'Waiting for a lawful trigger improperly created a caretaker'
    );

    startStandard('snap-self-dissolution-seat-count');
    qualities = engine.state.qualities;
    qualities.year = 2026;
    qualities.month = 12;
    qualities.time = 86;
    qualities.continuous_campaign = 1;
    qualities.snap_election_requested = 1;
    qualities.snap_election_held = 0;
    qualities.snap_event_deferred_time = -1;
    qualities.left_committed_seats = 49;
    qualities.government_party = 'pis';
    qualities.ko_seats = 180;
    qualities.psl_seats = 40;
    qualities.p2050_seats = 40;
    qualities.psl_relation = 60;
    qualities.p2050_relation = 60;
    qualities.early_election_risk = 50;
    engine.goToScene('poland_events_2026.snap_election_2026');
    selfDissolve = currentChoices().find(function(choice) {
      return choice.id === 'poland_events_2026.snap_self_dissolve';
    });
    assert(qualities.snap_self_dissolution_support >= 307);
    assert(selfDissolve && selfDissolve.canChoose);

    startStandard('first-attempt-cabinet-entry');
    qualities = engine.state.qualities;
    qualities.government_party = 'ko';
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.pres_2025_hostile_president = 0;
    qualities.prime_minister = 'Donald Tusk';
    engine.goToScene('poland_events_2026.snap_formation_attempt_one');
    assert(
      currentChoices().some(function(choice) {
        return choice.id ===
          'poland_events_2026.snap_attempt_one_join';
      }),
      'A non-hostile first-attempt nominee offered no cabinet entry'
    );

    startStandard('left-second-attempt-requires-entry');
    qualities = engine.state.qualities;
    qualities.ko_relation = 0;
    qualities.left_committed_seats = 49;
    engine.goToScene('poland_events_2026.snap_formation_attempt_two');
    assert.strictEqual(qualities.snap_formation_nominee_is_left, 1);
    assert(
      currentChoices().some(function(choice) {
        return choice.id ===
          'poland_events_2026.snap_attempt_two_join';
      })
    );
    assert(
      !currentChoices().some(function(choice) {
        return choice.id ===
          'poland_events_2026.snap_attempt_two_support';
      }),
      'Lewica could install its own prime minister while claiming opposition'
    );

    startStandard('third-formation-simple-majority');
    qualities = engine.state.qualities;
    qualities.left_committed_seats = 26;
    qualities.ko_seats = 170;
    qualities.psl_seats = 20;
    qualities.p2050_seats = 20;
    qualities.centrum_seats = 0;
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.pres_2025_hostile_president = 0;
    engine.goToScene(
      'poland_events_2026.snap_formation_attempt_three'
    );
    choose('poland_events_2026.snap_third_president_nominee');
    choose('poland_events_2026.snap_attempt_three_abstain');
    assert.strictEqual(
      qualities.confidence_threshold,
      Math.floor(
        (qualities.confidence_yes + qualities.confidence_no) / 2
      ) + 1
    );
    assert.strictEqual(
      qualities.government_has_confidence,
      qualities.confidence_yes > qualities.confidence_no ? 1 : 0
    );

    startStandard('third-formation-uses-incumbent-president');
    qualities = engine.state.qualities;
    qualities.government_has_confidence = 0;
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.pres_2025_winner = 'Karol Nawrocki';
    qualities.pres_2025_hostile_president = 1;
    engine.goToScene(
      'poland_events_2026.snap_formation_attempt_three'
    );
    const compromiseChoices = currentChoices().map(function(choice) {
      return choice.id;
    });
    assert.deepStrictEqual(compromiseChoices, [
      'poland_events_2026.snap_third_president_nominee',
    ]);
    assert.strictEqual(
      qualities.snap_formation_candidate,
      'Władysław Kosiniak-Kamysz',
      'A non-player President did not choose the Article 155 nominee'
    );

    startStandard('third-formation-duda-remains-in-office');
    qualities = engine.state.qualities;
    qualities.government_has_confidence = 0;
    qualities.president_name = 'Andrzej Duda';
    qualities.pres_2025_winner = 'Rafał Trzaskowski';
    qualities.pres_2025_hostile_president = 0;
    qualities.pis_split = 0;
    engine.goToScene(
      'poland_events_2026.snap_formation_attempt_three'
    );
    assert.strictEqual(
      qualities.snap_formation_candidate,
      'Beata Szydło',
      'The president-elect made Duda choose the democratic nominee early'
    );

    startStandard('snap-formation-success-updates-majority');
    qualities = engine.state.qualities;
    qualities.left_committed_seats = 26;
    qualities.ko_seats = 220;
    qualities.psl_seats = 20;
    qualities.p2050_seats = 20;
    qualities.centrum_seats = 0;
    qualities.ko_relation = 60;
    qualities.rival_relation_ko_psl = 60;
    qualities.rival_relation_ko_p2050 = 60;
    qualities.psl_coalition_dissent = 0;
    qualities.p2050_coalition_dissent = 0;
    qualities.caretaker_government = 1;
    qualities.government_has_confidence = 0;
    qualities.formation_in_progress = 1;
    engine.goToScene(
      'poland_events_2026.snap_formation_attempt_two'
    );
    choose('poland_events_2026.snap_attempt_two_support');
    assert.strictEqual(qualities.government_has_confidence, 1);
    choose('poland_events_2026.snap_formation_success');
    assert.strictEqual(
      qualities.coalition_seats,
      qualities.ko_seats + qualities.p2050_seats + qualities.psl_seats,
      'Snap formation confused investiture yes votes with cabinet-party seats'
    );
    assert.strictEqual(qualities.caretaker_government, 0);
    assert.strictEqual(qualities.formation_in_progress, 0);
    assert.strictEqual(qualities.formation_complete, 1);

    startStandard('snap-formation-does-not-reward-withheld-partners');
    qualities = engine.state.qualities;
    qualities.left_committed_seats = 26;
    qualities.ko_seats = 220;
    qualities.psl_seats = 20;
    qualities.p2050_seats = 20;
    qualities.centrum_seats = 0;
    qualities.rival_relation_ko_psl = 0;
    qualities.rival_relation_ko_p2050 = 0;
    qualities.psl_coalition_dissent = 100;
    qualities.p2050_coalition_dissent = 100;
    qualities.caretaker_government = 1;
    qualities.government_has_confidence = 0;
    qualities.formation_in_progress = 1;
    engine.goToScene(
      'poland_events_2026.snap_formation_attempt_two'
    );
    choose('poland_events_2026.snap_attempt_two_support');
    assert.strictEqual(qualities.government_has_confidence, 1);
    choose('poland_events_2026.snap_formation_success');
    assert.strictEqual(qualities.coalition_seats, qualities.ko_seats);
    ['digital', 'economy', 'agriculture', 'defence'].forEach(
      function(portfolio) {
        assert(
          !['PSL', 'Poland 2050'].includes(
            qualities[portfolio + '_minister_party']
          ),
          'A party that withheld confidence received ' + portfolio
        );
      }
    );

    startStandard('snap-left-nominee-supply-no-cabinet-authority');
    qualities = engine.state.qualities;
    qualities.pres_2025_left_candidate =
      'Agnieszka Dziemianowicz-Bąk';
    qualities.confidence_candidate =
      'Agnieszka Dziemianowicz-Bąk';
    qualities.confidence_yes = 240;
    qualities.confidence_no = 200;
    qualities.confidence_abstain = 20;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 1;
    qualities.formation_in_progress = 1;
    qualities.snap_formation_attempt = 2;
    qualities.snap_formation_base = 222;
    qualities.snap_formation_left_votes = 26;
    qualities.snap_left_cabinet_commitment = 0;
    engine.goToScene('poland_events_2026.snap_formation_success');
    assert.strictEqual(qualities.left_in_government, 0);
    assert.strictEqual(qualities.government_party, 'independent');
    assert.strictEqual(qualities.budget, 0);
    assert.strictEqual(qualities.ministries_finalized, 1);
    assert.strictEqual(
      qualities.position,
      'Confidence-and-supply opposition'
    );
    assert.strictEqual(
      qualities.left_cabinet_model,
      'Confidence and supply from opposition'
    );
    assert.strictEqual(qualities.government_support_seats, 222);
    engine.goToScene('poland_hub');
    assert.strictEqual(
      qualities.government_support_seats,
      222,
      'Normalisation erased an independent cabinet support ledger'
    );
    qualities.annual_budget_year = 2024;
    engine.goToScene('poland_opposition_budget.start');
    assert.strictEqual(
      qualities.opposition_budget_government_seats,
      222,
      'The opposition budget treated an independent cabinet as seatless'
    );

    startStandard('office-successor-biejat-remains-left-nominee');
    qualities = engine.state.qualities;
    qualities.office_incompatibility_pm_nominee = 'Magdalena Biejat';
    qualities.office_incompatibility_pm_nominee_party = 'lewica';
    qualities.confidence_candidate = 'Magdalena Biejat';
    qualities.confidence_yes = 240;
    qualities.confidence_no = 200;
    qualities.confidence_abstain = 20;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 1;
    qualities.formation_in_progress = 1;
    qualities.snap_formation_attempt = 1;
    qualities.snap_formation_base = 214;
    qualities.snap_formation_left_votes = 26;
    qualities.snap_left_cabinet_commitment = 0;
    engine.goToScene('poland_events_2026.snap_formation_success');
    assert.strictEqual(qualities.prime_minister, 'Magdalena Biejat');
    assert.strictEqual(
      qualities.government_party,
      'independent',
      'A Left office successor was reclassified as KO'
    );

    startStandard('article-225-clock-only-palace-decision');
    qualities = engine.state.qualities;
    qualities.year = 2025;
    qualities.month = 1;
    qualities.time = 63;
    qualities.continuous_campaign = 1;
    qualities.snap_election_requested = 0;
    qualities.snap_election_held = 0;
    qualities.budget_deadline_active = 1;
    qualities.budget_deadline_time = 63;
    qualities.left_in_government = 0;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.government_party = 'ko';
    qualities.president_name = 'Andrzej Duda';
    engine.goToScene('poland_events_2026.snap_election_2026');
    let snapChoices = currentChoices().map(function(choice) {
      return choice.id;
    });
    assert(snapChoices.includes(
      'poland_events_2026.snap_budget_deadline'
    ));
    assert(snapChoices.includes(
      'poland_events_2026.snap_waive_deadline'
    ));
    assert(!snapChoices.includes(
      'poland_events_2026.snap_formation_ladder'
    ));
    choose('poland_events_2026.snap_waive_deadline');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2026.snap_budget_palace_decision'
    );
    assert.strictEqual(qualities.snap_budget_petition_advocacy, -8);
    assert.strictEqual(
      qualities.budget_deadline_active,
      1,
      'Lewica argument improperly closed the independent Article 225 window'
    );
    assert.strictEqual(
      qualities.snap_budget_petition_approved,
      qualities.snap_budget_petition_score >= 35 ? 1 : 0
    );

    startStandard('friendly-palace-recognises-democratic-majority');
    qualities = engine.state.qualities;
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.pres_2025_hostile_president = 0;
    qualities.coalition_democratic_seats = 250;
    qualities.coalition_right_seats = 190;
    qualities.left_committed_seats = 26;
    qualities.pis_seats = 175;
    qualities.ko_seats = 170;
    qualities.psl_seats = 28;
    qualities.p2050_seats = 26;
    qualities.rival_relation_ko_psl = 60;
    qualities.rival_relation_ko_p2050 = 60;
    qualities.psl_coalition_dissent = 10;
    qualities.p2050_coalition_dissent = 10;
    qualities.democratic_committed_seats = 224;
    qualities.right_committed_seats = 175;
    engine.goToScene('poland_events_2026.snap_palace_pick');
    assert.strictEqual(qualities.snap_pm_candidate, 'Donald Tusk');
    assert.strictEqual(qualities.snap_pm_is_right, 0);
    assert.strictEqual(qualities.snap_pm_base, 224);
    choose('poland_events_2026.snap_left_offer');
    snapChoices = currentChoices().map(function(choice) {
      return choice.id;
    });
    assert(snapChoices.includes(
      'poland_events_2026.snap_left_supply_democratic'
    ));
    assert(!snapChoices.includes(
      'poland_events_2026.snap_left_welfare'
    ));
    choose('poland_events_2026.snap_left_supply_democratic');
    assert.strictEqual(qualities.government_has_confidence, 1);
    choose('poland_events_2026.snap_first_pass');
    assert.strictEqual(qualities.government_party, 'ko');
    assert.strictEqual(qualities.left_in_government, 0);
    assert.strictEqual(qualities.budget, 0);
    assert.strictEqual(
      qualities.position,
      'Confidence-and-supply opposition'
    );

    startStandard('sejm-cabinet-external-left-support');
    qualities = engine.state.qualities;
    qualities.coalition_democratic_seats = 248;
    qualities.democratic_committed_seats = 222;
    qualities.left_committed_seats = 26;
    qualities.caretaker_government = 1;
    qualities.government_has_confidence = 0;
    engine.goToScene('poland_events_2026.snap_sejm_tusk');
    choose('poland_events_2026.snap_dem_supply');
    assert.strictEqual(qualities.government_has_confidence, 1);
    assert.strictEqual(qualities.left_in_government, 0);
    assert.strictEqual(qualities.budget, 0);
    assert.strictEqual(
      qualities.budget_authority,
      'Opposition — no state spending authority'
    );

    startStandard('repeat-election-finite-and-fresh');
    qualities = engine.state.qualities;
    [
      'sld_breakaway',
      'social_patriot',
      'spring_breakaway',
      'labor_left',
      'young_left',
      'razem',
      'pps',
      'centrum',
      'rozwoj',
      'korona',
      'other',
    ].forEach(function(id) {
      qualities[id + '_projected_seats'] = 0;
    });
    qualities.pis_projected_seats = 190;
    qualities.ko_projected_seats = 180;
    qualities.left_projected_seats = 30;
    qualities.psl_projected_seats = 25;
    qualities.p2050_projected_seats = 20;
    qualities.konf_projected_seats = 15;
    qualities.year = 2025;
    qualities.month = 3;
    qualities.month_name = 'March';
    qualities.date_label = 'March 2025';
    qualities.time = 65;
    qualities.continuous_campaign = 1;
    qualities.senate_pis_seats = 0;
    qualities.senate_konf_seats = 0;
    qualities.senate_ko_seats = 0;
    qualities.senate_p2050_seats = 0;
    qualities.senate_psl_seats = 0;
    qualities.senate_left_seats = 0;
    qualities.senate_independent_seats = 100;
    engine.goToScene('poland_events_2026.snap_result_2026');
    const firstKoVote = qualities.snap_election_ko_vote;
    const firstCountSummary = qualities.snap_election_day_summary;
    assert.strictEqual(qualities.snap_election_cycle, 1);
    assert.strictEqual(qualities.senate_snap_election_cycle, 1);
    assert.strictEqual(
      qualities.senate_pis_seats + qualities.senate_konf_seats +
        qualities.senate_ko_seats + qualities.senate_p2050_seats +
        qualities.senate_psl_seats + qualities.senate_left_seats +
        qualities.senate_independent_seats,
      100,
      'The first snap election did not certify all 100 Senate districts'
    );
    assert.notStrictEqual(
      qualities.senate_independent_seats,
      100,
      'The snap election retained the stale pre-dissolution Senate'
    );
    isolateDatedEventFixture([
      'poland_events_2026.snap_campaign_result_due_2026',
    ]);
    qualities.government_has_confidence = 0;
    engine.goToScene(
      'poland_events_2026.snap_formation_mandatory_election'
    );
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2026.snap_campaign_launch'
    );
    const secondCampaignStart = qualities.time;
    assert.strictEqual(
      qualities.snap_campaign_due_time,
      secondCampaignStart + 1
    );
    choose('poland_events_2026.snap_campaign_social');
    assert.strictEqual(
      qualities.snap_election_cycle,
      1,
      'The mandatory rerun was counted on the dissolution date'
    );
    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.time, secondCampaignStart + 1);
    assert.strictEqual(
      engine.state.sceneId,
      'poland_event_queue.events_choice'
    );
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2026.snap_campaign_result_due_2026']
    );
    choose('poland_events_2026.snap_campaign_result_due_2026');
    choose('poland_events_2026.snap_campaign_count');
    assert.strictEqual(qualities.snap_election_cycle, 2);
    assert.strictEqual(qualities.senate_snap_election_cycle, 2);
    assert.strictEqual(
      qualities.senate_pis_seats + qualities.senate_konf_seats +
        qualities.senate_ko_seats + qualities.senate_p2050_seats +
        qualities.senate_psl_seats + qualities.senate_left_seats +
        qualities.senate_independent_seats,
      100,
      'The repeated election did not recertify all 100 Senate districts'
    );
    assert(
      Math.abs(qualities.snap_repeat_campaign_roll) > 0 &&
        Math.abs(qualities.snap_repeat_campaign_roll) <= 2.2,
      'The repeated campaign did not record its bounded election-day shock'
    );
    assert.notStrictEqual(
      qualities.snap_election_ko_vote,
      firstKoVote,
      'The mandatory second election reused the identical KO vote count'
    );
    assert.notStrictEqual(
      qualities.snap_election_day_summary,
      firstCountSummary,
      'The mandatory second election reused the first count report'
    );
    assert.strictEqual(
      [
        'pis', 'ko', 'left', 'psl', 'p2050', 'konf',
        'sld_breakaway', 'social_patriot', 'spring_breakaway', 'labor_left',
        'young_left', 'razem_party', 'pps_party', 'centrum',
        'rozwoj', 'korona', 'ko_splinter', 'other',
      ].reduce(function(total, id) {
        return total + Number(qualities[id + '_seats'] || 0);
      }, 0),
      460,
      'The alternative election count did not conserve every Sejm seat'
    );
    assert.strictEqual(
      qualities.left_barons_seats + qualities.left_spring_seats +
        qualities.left_labor_seats + qualities.left_progressives_seats +
        qualities.razem_seats + qualities.left_pps_seats +
        qualities.left_social_patriot_seats,
      qualities.left_seats,
      'The snap election retained an internal caucus from the old Sejm'
    );
    assert.strictEqual(
      qualities.nowa_lewica_seats,
      qualities.left_barons_seats + qualities.left_spring_seats +
        qualities.left_labor_seats + qualities.left_progressives_seats,
      'The snap election left the New Left organisational ledger stale'
    );
    assert(
      Math.abs([
        'pis', 'ko', 'left', 'psl', 'p2050', 'konf', 'other',
        'sld_breakaway', 'social_patriot', 'spring_breakaway', 'labor_left',
        'young_left', 'razem', 'pps', 'centrum', 'rozwoj',
        'korona', 'ko_splinter',
      ].reduce(function(total, id) {
        return total + Number(
          qualities['snap_election_' + id + '_vote'] || 0
        );
      }, 0) - 100) < 0.12,
      'The alternative election vote report omitted or invented vote share'
    );
    qualities.government_has_confidence = 0;
    engine.goToScene(
      'poland_events_2026.snap_formation_mandatory_election'
    );
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2026.snap_repeated_deadlock_ending'
    );
    assert.strictEqual(qualities.snap_repeated_deadlock, 1);
  }

  function testTimelineOfficeContinuity() {
    startStandard('timeline-live-president-2021');
    let qualities = engine.state.qualities;
    qualities.president_name = 'Rafał Trzaskowski';
    engine.goToScene('poland_events_2021_2023.september_2021');
    let copy = contentText(engine.state.currentContent);
    assert(copy.includes('Rafał Trzaskowski'));
    assert(!copy.includes('President Andrzej Duda'));

    startStandard('timeline-lex-tusk-live-president');
    qualities = engine.state.qualities;
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.trz_vetoes = 0;
    engine.goToScene('poland_events_2021_2023.may_2023');
    copy = contentText(engine.state.currentContent);
    assert(copy.includes('Rafał Trzaskowski'));
    assert(copy.includes('promises a veto'));
    assert(!copy.includes('Duda says he will sign'));
    assert.strictEqual(qualities.trz_vetoes, 1);

    startStandard('timeline-kpo-left-prime-minister');
    qualities = engine.state.qualities;
    qualities.government_party = 'lewica';
    qualities.left_in_government = 1;
    qualities.prime_minister = 'Magdalena Biejat';
    engine.goToScene('poland_kpo_2024_2026.kpo_article7_credit_2024');
    let primeMinisterChoice = currentChoices().find(function(choice) {
      return choice.id === 'poland_kpo_2024_2026.article7_pm_credit';
    });
    assert(contentText(primeMinisterChoice.title).includes('Magdalena Biejat'));
    const leftCreditBefore = qualities.kpo_public_credit;
    choose('poland_kpo_2024_2026.article7_pm_credit');
    assert.strictEqual(qualities.kpo_public_credit, leftCreditBefore + 4);

    startStandard('timeline-kpo-psl-prime-minister');
    qualities = engine.state.qualities;
    qualities.government_party = 'psl';
    qualities.left_in_government = 1;
    qualities.prime_minister = 'Władysław Kosiniak-Kamysz';
    engine.goToScene('poland_kpo_2024_2026.kpo_article7_credit_2024');
    primeMinisterChoice = currentChoices().find(function(choice) {
      return choice.id === 'poland_kpo_2024_2026.article7_pm_credit';
    });
    assert(contentText(primeMinisterChoice.title).includes(
      'Władysław Kosiniak-Kamysz'
    ));
    const pslRelationBefore = qualities.psl_relation;
    const koRelationBefore = qualities.ko_relation;
    choose('poland_kpo_2024_2026.article7_pm_credit');
    assert.strictEqual(qualities.psl_relation, pslRelationBefore + 7);
    assert.strictEqual(qualities.ko_relation, koRelationBefore);

    startStandard('timeline-live-ko-prime-minister');
    qualities = engine.state.qualities;
    qualities.government_party = 'ko';
    qualities.prime_minister = 'Rafał Trzaskowski';
    engine.goToScene('poland_events_2023_2024.migration_pivot_2024');
    copy = contentText(engine.state.currentContent);
    assert(copy.includes('Rafał Trzaskowski'));
    assert(!copy.includes('Prime Minister Donald Tusk'));

    startStandard('timeline-incumbent-primary-role');
    qualities = engine.state.qualities;
    qualities.president_name = 'Rafał Trzaskowski';
    engine.goToScene('poland_events_2023_2024.ko_primary_2024');
    copy = contentText(engine.state.currentContent);
    assert(copy.includes('the incumbent President'));
    assert(!copy.includes("Warsaw's mayor"));

    startStandard('timeline-outgoing-president-oath');
    qualities = engine.state.qualities;
    qualities.president_name = 'Rafał Trzaskowski';
    engine.goToScene('poland_events_2025.presidential_oath_crisis_2025');
    copy = contentText(engine.state.currentContent);
    assert(copy.includes("outgoing President's term"));
    assert(!copy.includes("Andrzej Duda's term"));

    startStandard('timeline-constructive-live-prime-minister');
    qualities = engine.state.qualities;
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.formation_in_progress = 0;
    qualities.prime_minister = 'Władysław Kosiniak-Kamysz';
    qualities.president_name = 'Andrzej Duda';
    engine.goToScene('poland_government_formation.constructive_motion');
    const trzaskowskiChoice = currentChoices().find(function(choice) {
      return choice.id ===
        'poland_government_formation.constructive_trzaskowski';
    });
    const constructiveTitle = contentText(trzaskowskiChoice.title);
    assert(
      /Replace\s+Władysław Kosiniak-Kamysz/.test(constructiveTitle),
      'Constructive title ignored the live prime minister: ' +
        constructiveTitle
    );
    assert(!currentChoices().some(function(choice) {
      return choice.id ===
        'poland_government_formation.constructive_kosiniak';
    }));
  }

  function testCommittedSeatsAndOfficeCompatibility() {
    startStandard('whole-left-cabinet-keeps-allied-delegation');
    let qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2024,
      government_party: 'ko',
      cabinet_roster_government_party: 'ko',
      government_has_confidence: 1,
      caretaker_government: 0,
      left_in_government: 1,
      left_cabinet_committed: 1,
      left_cabinet_model: 'Whole cooperating Left coalition delegation',
      left_seats: 30,
      razem_party_seats: 10,
      razem_party_relation: 50,
      ministry_left_cabinet_seats: 40,
      ministry_whole_left_mandate: 1,
      ministry_ko_in_cabinet: 1,
      government_support_seats: 430,
    });
    ministryPortfolioCases.forEach(function(testCase) {
      qualities[testCase.portfolio + '_minister_party'] = 'KO';
    });
    qualities.labor_minister_party = 'Lewica';
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.left_committed_seats, 40);
    assert.strictEqual(
      qualities.ministry_left_cabinet_seats,
      40,
      'Normalisation discarded cooperating separate-party Left ministers'
    );
    assert.strictEqual(
      qualities.government_support_seats,
      420,
      'The non-Lewica support cap ignored the full Left cabinet delegation'
    );

    startStandard('relation-gated-left-splinters');
    qualities = engine.state.qualities;
    qualities.left_seats = 30;
    qualities.razem_party_seats = 10;
    qualities.razem_party_relation = 20;
    qualities.ko_seats = 160;
    qualities.psl_seats = 30;
    qualities.p2050_seats = 30;
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.left_family_seats, 40);
    assert.strictEqual(qualities.left_committed_seats, 30);
    assert.strictEqual(qualities.coalition_democratic_seats, 250);
    qualities.razem_party_relation = 50;
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.left_committed_seats, 40);
    assert.strictEqual(qualities.coalition_democratic_seats, 260);

    startStandard('presidential-office-compatibility');
    qualities = engine.state.qualities;
    qualities.president_name = 'Szymon Hołownia';
    qualities.sejm_speaker = 'Szymon Hołownia';
    qualities.p2050_leader = 'Szymon Hołownia';
    engine.goToScene('poland_normalize');
    assert.notStrictEqual(qualities.sejm_speaker, qualities.president_name);
    assert.notStrictEqual(qualities.p2050_leader, qualities.president_name);
    assert.strictEqual(qualities.office_incompatibility_pending, 1);
    assert.strictEqual(qualities.office_incompatibility_resolved, 0);
    engine.goToScene('poland_office_authority.resolve');
    assert.strictEqual(qualities.office_incompatibility_pending, 0);
    assert.strictEqual(qualities.office_incompatibility_resolved, 1);
    assert.notStrictEqual(qualities.sejm_speaker, qualities.president_name);
    assert.notStrictEqual(qualities.p2050_leader, qualities.president_name);

    startStandard('independent-cabinet-identity');
    qualities = engine.state.qualities;
    qualities.year = 2025;
    qualities.government_party = 'independent';
    qualities.government_owner = 'Independent parliamentary cabinet';
    qualities.prime_minister = 'Agnieszka Dziemianowicz-Bąk';
    qualities.left_in_government = 0;
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.government_party, 'independent');
    assert.strictEqual(
      qualities.government_owner,
      'Independent parliamentary cabinet'
    );
    assertNamedCabinet(qualities, 'Independent cabinet roster');

    startStandard('psl-led-democratic-cabinet-roster');
    qualities = engine.state.qualities;
    qualities.year = 2024;
    qualities.government_party = 'psl';
    qualities.government_owner = 'PSL-led democratic coalition';
    qualities.left_in_government = 0;
    qualities.caretaker_government = 0;
    qualities.ko_seats = 160;
    qualities.psl_seats = 30;
    qualities.p2050_seats = 30;
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.foreign_minister_party, 'KO');
    assert.strictEqual(qualities.defence_minister_party, 'PSL');
    assert.strictEqual(qualities.coalition_seats, 220);
    assertNamedCabinet(qualities, 'PSL-led coalition roster');

    startStandard('named-cabinet-save-migration');
    qualities = engine.state.qualities;
    qualities.year = 2025;
    qualities.government_party = 'ko';
    qualities.cabinet_roster_government_party = 'ko';
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.left_in_government = 0;
    ministryPortfolioCases.forEach(function(testCase) {
      qualities[testCase.portfolio + '_minister_party'] = 'KO';
      qualities[testCase.portfolio + '_minister'] =
        'Coalition ' + testCase.portfolio + ' nominee';
    });
    engine.goToScene('poland_normalize');
    assertNamedCabinet(qualities, 'Migrated cabinet roster');

    startStandard('adb-supply-only-cabinet-identity');
    qualities = engine.state.qualities;
    qualities.democratic_candidate = 'Agnieszka Dziemianowicz-Bąk';
    qualities.left_cabinet_committed = 0;
    qualities.formation_continuous = 0;
    engine.goToScene('poland_government_formation.cabinet_success');
    assert.strictEqual(qualities.government_party, 'independent');
    assert.strictEqual(qualities.left_in_government, 0);
    assert.strictEqual(qualities.budget, 0);

    startStandard('president-filtered-from-prime-minister-nomination');
    qualities = engine.state.qualities;
    qualities.president_name = 'Agnieszka Dziemianowicz-Bąk';
    engine.goToScene('poland_government_formation.sejm_candidate');
    assert(
      !currentChoices().some(function(choice) {
        return choice.id ===
          'poland_government_formation.nominate_left_compromise';
      }),
      'The sitting President remained available for Prime Minister'
    );

    startStandard('departed-razem-minister');
    qualities = engine.state.qualities;
    qualities.year = 2024;
    qualities.government_party = 'ko';
    qualities.left_in_government = 1;
    qualities.labor_minister_party = 'Lewica';
    qualities.labor_minister = 'Agnieszka Dziemianowicz-Bąk';
    qualities.health_minister_party = 'Lewica';
    qualities.health_minister = 'Marcelina Zawisza';
    qualities.ministry_count = 2;
    qualities.razem_split = 1;
    qualities.razem_in_left_club = 0;
    qualities.razem_active = 0;
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.health_minister_party, 'Vacant');
    assert(qualities.health_minister.includes('appointment pending'));
    assert.strictEqual(qualities.office_incompatibility_pending, 1);
    assert.strictEqual(qualities.ministry_count, 1);
    engine.goToScene('poland_office_authority.resolve');
    assert.strictEqual(
      qualities.health_minister_party,
      'Lewica',
      'A junior-party vacancy was reassigned to the lead party'
    );
    assert.notStrictEqual(qualities.health_minister, 'Marcelina Zawisza');

    startStandard('president-cannot-remain-defence-minister');
    qualities = engine.state.qualities;
    qualities.year = 2025;
    qualities.government_party = 'ko';
    qualities.cabinet_roster_government_party = 'ko';
    qualities.president_name = 'Radosław Sikorski';
    qualities.defence_minister_party = 'KO';
    qualities.defence_minister = 'Radosław Sikorski';
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.defence_minister_party, 'Vacant');
    assert.strictEqual(qualities.office_incompatibility_portfolio, 'defence');
    engine.goToScene('poland_office_authority.resolve');
    assert.notStrictEqual(qualities.defence_minister, qualities.president_name);

    startStandard('president-filtered-from-new-ministry-choice');
    qualities = engine.state.qualities;
    qualities.year = 2025;
    qualities.president_name = 'Agnieszka Dziemianowicz-Bąk';
    qualities.left_cabinet_committed = 1;
    qualities.left_cabinet_model = 'Programme-bound Left cabinet entry';
    engine.goToScene('poland_ministries');
    assert.strictEqual(qualities.ministry_labor_nominee, 'Katarzyna Ueberhan');
    choose('poland_ministries.take_labor');
    assert.strictEqual(qualities.labor_minister, 'Katarzyna Ueberhan');
    assert.notStrictEqual(qualities.labor_minister, qualities.president_name);

    startStandard('prime-minister-elected-president-needs-confidence');
    qualities = engine.state.qualities;
    qualities.year = 2025;
    qualities.government_party = 'ko';
    qualities.prime_minister = 'Rafał Trzaskowski';
    qualities.president_name = 'Rafał Trzaskowski';
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.government_has_confidence, 0);
    assert.strictEqual(qualities.office_incompatibility_pm_formation, 1);
    engine.goToScene('poland_office_authority.resolve');
    assert(qualities.prime_minister.includes('Vacant'));
    assert.strictEqual(
      qualities.office_incompatibility_pm_nominee,
      'Donald Tusk'
    );
    choose('poland_office_authority.accept');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2026.snap_formation_attempt_one'
    );
    assert.strictEqual(qualities.snap_formation_candidate, 'Donald Tusk');

    startStandard('macroeconomic-shock-convergence');
    qualities = engine.state.qualities;
    qualities.year = 2024;
    qualities.month = 1;
    qualities.inflation = 17.2;
    qualities.economic_growth = -2;
    qualities.unemployment = 6.5;
    qualities.fiscal_stress = 20;
    qualities.government_delivery = 30;
    qualities.war_escalation_risk = 20;
    qualities.month_actions = 1;
    const inflationBefore = qualities.inflation;
    const growthBefore = qualities.economic_growth;
    engine.goToScene('poland_advance');
    assert(qualities.inflation < inflationBefore);
    assert(qualities.economic_growth > growthBefore);
    assert.strictEqual(qualities.macro_baseline_year, 2024);

    startStandard('pis-prosecution-counterfactual');
    isolateDatedEventFixture([
      'poland_judiciary_2024_2026',
      'poland_judiciary_2024_2026.pis_prosecution_status_2024',
    ]);
    qualities = engine.state.qualities;
    qualities.government_party = 'pis';
    qualities.prime_minister = 'Mateusz Morawiecki';
    qualities.government_name = 'Morawiecki PiS cabinet';
    qualities.left_in_government = 0;
    qualities.caretaker_government = 0;
    openDatedEventQueue(2024, 1);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      [
        'poland_judiciary_2024_2026.pis_prosecution_status_2024',
      ],
      'A surviving PiS cabinet received the successor government repair scene'
    );

    startStandard('pis-public-media-counterfactual');
    isolateDatedEventFixture([
      'poland_events_2023_2024.december_public_media',
      'poland_events_2023_2024.december_public_media_pis',
    ]);
    qualities = engine.state.qualities;
    qualities.government_party = 'pis';
    qualities.prime_minister = 'Mateusz Morawiecki';
    qualities.government_name = 'Morawiecki PiS cabinet';
    qualities.left_in_government = 0;
    qualities.caretaker_government = 0;
    openDatedEventQueue(2023, 12);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2023_2024.december_public_media_pis']
    );

    startStandard('kpo-opposition-audit-cost');
    qualities = engine.state.qualities;
    qualities.left_in_government = 0;
    qualities.government_party = 'pis';
    qualities.resources = 0;
    engine.goToScene(
      'poland_kpo_2024_2026.kpo_payment_dossier_2024'
    );
    let kpoAudit = currentChoices().find(function(choice) {
      return choice.id ===
        'poland_kpo_2024_2026.dossier_opposition_audit';
    });
    assert(kpoAudit && !kpoAudit.canChoose);
    assert(
      currentChoices().some(function(choice) {
        return choice.id ===
          'poland_kpo_2024_2026.dossier_opposition_record' &&
          choice.canChoose;
      }),
      'A zero-resource opposition was locked in the KPO dossier'
    );
    qualities.resources = 1;
    engine.goToScene(
      'poland_kpo_2024_2026.kpo_payment_dossier_2024'
    );
    const oppositionMilestonesBefore = qualities.kpo_milestones;
    const oppositionScrutinyBefore = qualities.kpo_scrutiny;
    choose('poland_kpo_2024_2026.dossier_opposition_audit');
    assert.strictEqual(qualities.resources, 0);
    assert.strictEqual(
      qualities.kpo_milestones,
      oppositionMilestonesBefore,
      'Opposition scrutiny completed a government/EU milestone'
    );
    assert.strictEqual(
      qualities.kpo_scrutiny,
      oppositionScrutinyBefore + 2
    );

    startStandard('kpo-pip-failed-law-no-milestone');
    qualities = engine.state.qualities;
    qualities.left_in_government = 0;
    qualities.government_party = 'ko';
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.government_support_seats = 180;
    qualities.coalition_seats = 180;
    qualities.left_seats = 26;
    qualities.president_name = 'Karol Nawrocki';
    qualities.president_relation = 0;
    const pipMilestonesBefore = qualities.kpo_milestones;
    engine.goToScene('poland_kpo_2024_2026.kpo_pip_milestone_2026');
    assert.strictEqual(qualities.pip_law_enacted, 0);
    assert.strictEqual(qualities.kpo_milestones, pipMilestonesBefore);
    assert(
      currentChoices().some(function(choice) {
        return choice.id ===
          'poland_kpo_2024_2026.pip_opposition_campaign';
      }),
      'Failed PIP legislation had no authored opposition route'
    );

    startStandard('pip-zero-non-left-support');
    qualities = engine.state.qualities;
    qualities.government_party = 'lewica';
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.government_support_seats = 0;
    qualities.coalition_seats = 30;
    qualities.ministry_left_cabinet_seats = 30;
    qualities.left_seats = 30;
    qualities.left_committed_seats = 30;
    qualities.government_coalition_dissent = 0;
    engine.goToScene('poland_kpo_2024_2026.kpo_pip_milestone_2026');
    assert.strictEqual(
      qualities.pip_sejm_yes,
      30,
      'A valid zero non-Left support ledger double-counted Lewica'
    );

    startStandard('pip-completes-bicameral-procedure');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2026,
      government_party: 'ko',
      left_in_government: 1,
      ministry_ko_in_cabinet: 1,
      ministry_psl_in_cabinet: 0,
      ministry_p2050_in_cabinet: 0,
      government_has_confidence: 1,
      caretaker_government: 0,
      government_support_seats: 220,
      coalition_seats: 246,
      left_seats: 26,
      left_committed_seats: 26,
      ministry_left_cabinet_seats: 26,
      government_coalition_dissent: 0,
      president_name: 'Rafał Trzaskowski',
      president_relation: 60,
      senate_total: 100,
      senate_pis_seats: 43,
      senate_konf_seats: 0,
      senate_ko_seats: 55,
      senate_p2050_seats: 0,
      senate_psl_seats: 0,
      senate_left_seats: 2,
      senate_independent_seats: 0,
    });
    const bicameralMilestonesBefore = qualities.kpo_milestones;
    engine.goToScene('poland_kpo_2024_2026.kpo_pip_milestone_2026');
    assert.strictEqual(qualities.pip_sejm_passed, 1);
    assert.strictEqual(qualities.pip_senate_yes, 57);
    assert.strictEqual(
      qualities.pip_senate_action,
      'Senate accepted the bill without amendment'
    );
    assert.strictEqual(qualities.pip_parliament_passed, 1);
    assert.strictEqual(qualities.pip_presidential_action, 'Signed into law');
    assert.strictEqual(qualities.pip_law_enacted, 1);
    assert.strictEqual(
      qualities.kpo_milestones,
      bicameralMilestonesBefore + 2
    );

    startStandard('pip-senate-rejection-needs-absolute-majority');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2026,
      government_party: 'ko',
      left_in_government: 1,
      ministry_ko_in_cabinet: 1,
      ministry_psl_in_cabinet: 0,
      ministry_p2050_in_cabinet: 0,
      government_has_confidence: 1,
      caretaker_government: 0,
      government_support_seats: 194,
      coalition_seats: 220,
      left_seats: 26,
      left_committed_seats: 26,
      ministry_left_cabinet_seats: 26,
      government_coalition_dissent: 0,
      president_name: 'Rafał Trzaskowski',
      president_relation: 60,
      senate_total: 100,
      senate_pis_seats: 53,
      senate_konf_seats: 0,
      senate_ko_seats: 45,
      senate_p2050_seats: 0,
      senate_psl_seats: 0,
      senate_left_seats: 2,
      senate_independent_seats: 0,
    });
    const rejectedMilestonesBefore = qualities.kpo_milestones;
    engine.goToScene('poland_kpo_2024_2026.kpo_pip_milestone_2026');
    assert.strictEqual(qualities.pip_sejm_passed, 1);
    assert.strictEqual(qualities.pip_senate_action, 'Senate rejected the bill');
    assert.strictEqual(qualities.pip_senate_return_yes, 220);
    assert.strictEqual(qualities.pip_senate_return_threshold, 226);
    assert.strictEqual(qualities.pip_senate_return_passed, 0);
    assert.strictEqual(qualities.pip_parliament_passed, 0);
    assert.strictEqual(
      qualities.pip_presidential_action,
      'No bill reached the President'
    );
    assert.strictEqual(qualities.pip_law_enacted, 0);
    assert.strictEqual(qualities.kpo_milestones, rejectedMilestonesBefore);

    startStandard('pis-kpo-payment-freeze');
    qualities = engine.state.qualities;
    qualities.government_party = 'pis';
    qualities.prime_minister = 'Mateusz Morawiecki';
    qualities.government_name = 'Morawiecki PiS cabinet';
    qualities.left_in_government = 0;
    qualities.kpo_milestones = 20;
    qualities.kpo_delivery = 20;
    qualities.judicial_legitimacy = 60;
    engine.goToScene('poland_kpo_2024_2026.kpo_first_payment_2024');
    assert.strictEqual(qualities.kpo_first_payment_paid, 0);
    assert(
      !currentChoices().some(function(choice) {
        return choice.id ===
          'poland_kpo_2024_2026.payment_social_capacity';
      }),
      'The PiS counterfactual received a successor cabinet KPO spending menu'
    );
  }

  function openDatedEventQueue(year, month) {
    const qualities = engine.state.qualities;
    const monthNames = [
      '',
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    qualities.year = year;
    qualities.month = month;
    qualities.month_name = monthNames[month];
    qualities.date_label = monthNames[month] + ' ' + year;
    qualities.continuous_campaign = 1;
    qualities.poland_event_phase = 0;
    engine.goToScene('poland_event_queue');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_event_queue.events_choice',
      'Dated queue opened the leadership hand before its events: ' +
        JSON.stringify({
          date: qualities.date_label,
          government: qualities.government_party,
          continuous: qualities.continuous_campaign,
          count: qualities.poland_event_queue_count,
          titles: qualities.poland_event_queue_titles,
        })
    );
    assert.strictEqual(qualities.poland_event_phase, 1);
    return qualities;
  }

  function continueDatedEventAfterword(expectedSceneId) {
    const qualities = engine.state.qualities;
    if (engine.state.sceneId !== 'poland_event_queue.afterword') {
      const retainedResultScene = engine.state.sceneId;
      assert(
        currentChoices().some(function(choice) {
          return choice.id === 'poland_event_queue' && choice.canChoose;
        }),
        'A dated result has neither a retained exit nor a queue afterword: ' +
          retainedResultScene
      );
      choose('poland_event_queue');
    }
    assert.strictEqual(
      engine.state.sceneId,
      'poland_event_queue.afterword',
      'A dated decision did not retain its result beat'
    );
    assert.strictEqual(qualities.poland_event_return_beat, 1);
    assert(
      typeof qualities.news_headline === 'string' &&
        qualities.news_headline.length > 0,
      'The dated-event queue has no consequence headline'
    );
    try {
      choose(
        qualities.poland_event_queue_count > 0
          ? 'poland_event_queue.afterword_desk'
          : 'poland_event_queue.afterword_complete'
      );
    } catch (error) {
      error.message += ' ' + JSON.stringify({
        date: qualities.date_label,
        count: qualities.poland_event_queue_count,
        headline: qualities.news_headline,
        expectedSceneId: expectedSceneId,
      });
      throw error;
    }
    assert.strictEqual(
      engine.state.sceneId,
      expectedSceneId,
      'The result beat did not open the expected next screen'
    );
  }

  function isolateDatedEventFixture(activeSceneIds) {
    Object.keys(game.tagLookup.poland_event || {}).forEach(function(sceneId) {
      engine.state.visits[sceneId] = game.scenes[sceneId].maxVisits || 1;
    });
    activeSceneIds.forEach(function(sceneId) {
      delete engine.state.visits[sceneId];
    });
  }

  function testLeadershipDramaEvents() {
    function openLeadershipScene(seed, sceneId, prepare) {
      startStandard(seed);
      if (prepare) prepare(engine.state.qualities);
      engine.goToScene(sceneId);
      checkNumbers();
      assert(
        currentChoices().length >= 2,
        sceneId + ' does not give Lewica a credible response choice'
      );
      return engine.state.qualities;
    }

    let qualities = openLeadershipScene(
      'leadership-budka',
      'poland_leadership_events.po_handoff_2020'
    );
    assert.strictEqual(qualities.ko_outgoing_leader, 'Grzegorz Schetyna');
    assert.strictEqual(qualities.ko_leader, 'Borys Budka');
    assert(qualities.ko_incoming_bloc.includes('renewal'));

    qualities = openLeadershipScene(
      'leadership-kidawa',
      'poland_leadership_events.ko_candidate_replacement_2020'
    );
    assert.strictEqual(
      qualities.ko_presidential_outgoing_2020,
      'Małgorzata Kidawa-Błońska'
    );
    assert.strictEqual(
      qualities.ko_presidential_candidate_2020,
      'Rafał Trzaskowski'
    );

    qualities = openLeadershipScene(
      'leadership-p2050-foundation',
      'poland_leadership_events.p2050_foundation_2020'
    );
    assert.strictEqual(qualities.p2050_leader, 'Szymon Hołownia');
    assert.strictEqual(qualities.p2050_emerged, 1);
    assert(qualities.p2050_incoming_bloc.includes('state-capacity'));

    qualities = openLeadershipScene(
      'leadership-tusk',
      'poland_leadership_events.tusk_return_2021'
    );
    assert.strictEqual(qualities.ko_outgoing_leader, 'Borys Budka');
    assert.strictEqual(qualities.ko_leader, 'Donald Tusk');
    assert.strictEqual(qualities.ko_right_score, 62);
    assert.strictEqual(qualities.ko_social_liberal_share, 30);
    assert.strictEqual(qualities.ko_classical_liberal_share, 70);

    qualities = openLeadershipScene(
      'leadership-gowin',
      'poland_events_2021_2023.august_2021'
    );
    assert.strictEqual(qualities.porozumienie_exit_done, 1);
    assert(qualities.porozumienie_status.includes('outside the United Right'));

    qualities = openLeadershipScene(
      'leadership-mentzen',
      'poland_events_2021_2023.october_2022'
    );
    assert.strictEqual(
      qualities.konf_libertarian_outgoing_leader,
      'Janusz Korwin-Mikke'
    );
    assert.strictEqual(qualities.konf_libertarian_leader, 'Sławomir Mentzen');

    qualities = openLeadershipScene(
      'leadership-korwin-countercoup',
      'poland_events_2021_2023.october_2022',
      function(qualities) {
        qualities.covid_policy = 'Restrictions with a social shield';
        qualities.vaccination_strategy = 'Public-health mobilisation';
        qualities.konf_mentzenite_share = 45;
        qualities.anti_establishment_youth_konf_affinity = 3;
      }
    );
    assert.strictEqual(qualities.konf_korwin_countercoup_2022, 1);
    assert.strictEqual(qualities.konf_libertarian_leader, 'Janusz Korwin-Mikke');
    assert.strictEqual(qualities.wolnosciowcy_seats, 3);
    assert(qualities.wolnosciowcy_status.includes('radical-libertarian rump'));
    assert.strictEqual(qualities.february_2023_konf_done, 1);

    qualities = openLeadershipScene(
      'leadership-third-way-forms',
      'poland_events_2021_2023.april_2023'
    );
    assert.strictEqual(qualities.third_way_active, 1);
    assert.strictEqual(qualities.third_way_split, 0);
    assert(currentChoices().some(function(choice) {
      return choice.id == 'poland_events_2021_2023.apr23_one_list';
    }));
    assert(!currentChoices().some(function(choice) {
      return choice.id == 'poland_events_2021_2023.apr23_governing_attack';
    }));

    qualities = openLeadershipScene(
      'leadership-third-way-pis-alignment',
      'poland_events_2021_2023.april_2023',
      function(qualities) {
        qualities.left_in_government = 1;
        qualities.government_party = 'pis';
      }
    );
    assert.strictEqual(qualities.third_way_pis_aligned_left, 1);
    assert(!currentChoices().some(function(choice) {
      return choice.id == 'poland_events_2021_2023.apr23_one_list';
    }));
    assert(currentChoices().some(function(choice) {
      return choice.id == 'poland_events_2021_2023.apr23_governing_attack';
    }));

    qualities = openLeadershipScene(
      'bulletin-sovereign-rename',
      'poland_events_2021_2023.may_2023'
    );
    assert.strictEqual(qualities.sovereign_rename_2023_done, 1);
    assert(qualities.sovereign_poland_status.includes('Suwerenna Polska'));
    assert.strictEqual(qualities.political_bulletin_pending, 1);
    const bulletinActionBefore = qualities.month_actions;
    engine.goToScene('poland_political_bulletin');
    choose('poland_political_bulletin.record');
    assert.strictEqual(qualities.political_bulletin_pending, 0);
    assert.strictEqual(qualities.political_bulletin_seen, 1);
    assert.strictEqual(qualities.month_actions, bulletinActionBefore);

    qualities = openLeadershipScene(
      'leadership-sovereign-merger',
      'poland_events_2023_2024.sovereign_merger_2024'
    );
    assert.strictEqual(qualities.sovereign_merger_2024_done, 1);
    assert(qualities.sovereign_poland_status.includes('Absorbed into PiS'));

    qualities = openLeadershipScene(
      'leadership-third-way-ends',
      'poland_events_2025.third_way_ends'
    );
    assert.strictEqual(qualities.third_way_split, 1);
    assert.strictEqual(qualities.third_way_active, 0);
    assert(qualities.third_way_outgoing_leadership.includes('Hołownia'));
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      [
        'poland_events_2025.td_bilateral',
        'poland_events_2025.td_psl',
        'poland_events_2025.td_rebuild',
      ]
    );

    startStandard('leadership-ko-consolidation');
    engine.goToScene('poland_events_2025.ko_consolidation_2025');
    assert.strictEqual(currentChoices().length, 3);
    choose('poland_events_2025.ko_leadership_plural');
    assert.strictEqual(engine.state.sceneId, 'poland_events_2025.ko_merger_programme');
    assert.strictEqual(engine.state.qualities.ko_merger_stage, 2);
    choose('poland_events_2025.ko_programme_balance');
    assert.strictEqual(engine.state.qualities.ko_merger_stage, 3);
    choose('poland_events_2025.ko_local_guarantees');
    assert.strictEqual(engine.state.qualities.ko_merger_stage, 4);
    choose('poland_events_2025.ko_assets_audit');
    assert.strictEqual(engine.state.qualities.ko_merger_stage, 5);
    choose('poland_events_2025.ko_dissolution_respect');
    assert.strictEqual(engine.state.qualities.ko_merger_stage, 6);
    choose('poland_events_2025.ko_dissenters_protection');
    checkNumbers();
    qualities = engine.state.qualities;
    assert.strictEqual(qualities.ko_merger_stage, 7);
    assert.strictEqual(qualities.ko_consolidated, 1);
    assert.strictEqual(qualities.ko_leader, 'Donald Tusk');
    assert(qualities.ko_consolidation_outgoing_leaders.includes('Nowacka'));

    qualities = openLeadershipScene(
      'leadership-holownia-departs',
      'poland_events_2025.holownia_succession_2025'
    );
    assert.strictEqual(qualities.p2050_outgoing_leader, 'Szymon Hołownia');
    assert(qualities.p2050_succession_blocs.includes('Hennig-Kloska'));

    qualities = openLeadershipScene(
      'leadership-p2050-successor',
      'poland_events_2026.p2050_leadership_2026'
    );
    assert([
      'Katarzyna Pełczyńska-Nałęcz',
      'Paulina Hennig-Kloska',
    ].includes(qualities.p2050_leader));
    assert.notStrictEqual(qualities.p2050_incoming_bloc, 'Not yet formed');

    startStandard('leadership-p2050-president-still-gets-successor');
    qualities = engine.state.qualities;
    qualities.president_name = 'Szymon Hołownia';
    qualities.left_president = 0;
    qualities.p2050_leader = 'Szymon Hołownia';
    engine.goToScene('poland_hub');
    assert.notStrictEqual(
      qualities.p2050_leader,
      'Szymon Hołownia',
      'The President remained daily Poland 2050 leader'
    );
    engine.goToScene('poland_events_2025.holownia_succession_2025');
    choose('poland_events_2025.holownia_neutral');
    engine.goToScene('poland_events_2026.p2050_leadership_2026');
    assert([
      'Katarzyna Pełczyńska-Nałęcz',
      'Paulina Hennig-Kloska',
    ].includes(qualities.p2050_leader));
    assert.notStrictEqual(qualities.p2050_leader, qualities.president_name);

    startStandard('leadership-left-generational-handover');
    qualities = engine.state.qualities;
    qualities.president_name = 'Agnieszka Dziemianowicz-Bąk';
    engine.goToScene('poland_events_2025.left_leadership_2025');
    choose('poland_events_2025.leader_transition');
    assert.strictEqual(qualities.left_leader, 'Krzysztof Gawkowski');
    assert(qualities.left_leadership_result.includes('elected'));

    startStandard('leadership-left-membership-primary');
    qualities = engine.state.qualities;
    qualities.resources = 5;
    qualities.president_name = 'Agnieszka Dziemianowicz-Bąk';
    qualities.advisor_reshuffle_removed_czarzasty = 1;
    engine.goToScene('poland_events_2025.left_leadership_2025');
    choose('poland_events_2025.leader_primary');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.leader_primary_result'
    );
    assert.strictEqual(qualities.left_leader, qualities.left_primary_winner);
    assert.notStrictEqual(qualities.left_leader, qualities.president_name);
    choose('poland_events_2025.leader_primary_finish');

    qualities = openLeadershipScene(
      'leadership-pis-rupture',
      'poland_events_2026.pis_rupture_2026'
    );
    assert(
      qualities.pis_rupture_outgoing_leadership.includes('Kaczyński'),
      'PiS rupture outgoing leadership: ' +
        qualities.pis_rupture_outgoing_leadership
    );
    assert(qualities.pis_rupture_incoming_leadership.includes('Rozwój'));
    choose('poland_events_2026.pis_attack_ultimatum');
    assert.strictEqual(qualities.pis_split_crisis, 1);
    assert(qualities.pis_rupture_response.includes('apparatus purge'));
    assert(
      qualities.rozwoj_definitive_departures > 0,
      'PiS rupture first batch did not resolve in ' + engine.state.sceneId
    );
  }

  function testPersistentRivalOrganisations() {
    const commonFields = [
      'id', 'bloc', 'kind', 'name', 'leader', 'broker', 'parent',
      'legal_status', 'active', 'allied', 'organisation', 'cohesion',
      'relation', 'mp_count', 'sejm_mps', 'senators', 'meps',
      'exclusive_seats', 'local_base', 'offices', 'media_reach',
      'policy_priorities', 'red_lines', 'electoral_outside_option',
      'defection_readiness', 'grievance_memory',
    ];
    const group = function(qualities, id) {
      return qualities.rival_group_records.find(function(record) {
        return record.id === id;
      });
    };

    startStandard('phase7-common-records');
    let qualities = engine.state.qualities;
    assert.strictEqual(qualities.rival_group_schema_version, 2);
    assert.strictEqual(qualities.rival_group_records.length, 14);
    qualities.rival_group_records.forEach(function(record) {
      commonFields.forEach(function(field) {
        assert.notStrictEqual(
          record[field],
          undefined,
          record.id + ' lacks common rival field ' + field
        );
      });
    });
    ['pis_apparatus', 'porozumienie', 'solidarna', 'morawiecki',
      'pis_welfare', 'pis_security', 'pis_culture', 'rozwoj_plus',
      'po', 'nowoczesna', 'ipl', 'greens', 'ko_party', 'ko_splinter'
    ].forEach(function(id) {
      assert(group(qualities, id), 'Missing persistent group ' + id);
    });

    const pisBeforePorozumienie = qualities.pis_seats;
    const otherBeforePorozumienie = qualities.other_seats;
    const supportBeforePorozumienie = qualities.government_support_seats;
    engine.goToScene('poland_events_2021_2023.august_2021');
    assert.strictEqual(qualities.porozumienie_seats, 6);
    assert.strictEqual(qualities.pis_seats, pisBeforePorozumienie - 6);
    assert.strictEqual(qualities.other_seats, otherBeforePorozumienie + 6);
    assert.strictEqual(
      qualities.government_support_seats,
      supportBeforePorozumienie - 6
    );
    assert.strictEqual(group(qualities, 'porozumienie').exclusive_seats, 6);
    assert.strictEqual(
      qualities.rival_person_records.filter(function(person) {
        return person.party === 'porozumienie';
      }).length,
      6
    );
    assert(
      qualities.rival_person_records.some(function(person) {
        return person.id === 'ociepa' && person.party === 'pis';
      }),
      'The Porozumienie exit moved a named PiS loyalist wholesale'
    );

    startStandard('phase7-sovereign-rename');
    qualities = engine.state.qualities;
    const pisLeaderBeforeRename = qualities.pis_leader;
    engine.goToScene('poland_events_2021_2023.may_2023');
    assert.strictEqual(qualities.suwerenna_renamed, 1);
    assert.strictEqual(group(qualities, 'solidarna').name, 'Suwerenna Polska');
    assert.strictEqual(qualities.pis_leader, pisLeaderBeforeRename);

    startStandard('phase7-sovereign-refusal');
    qualities = engine.state.qualities;
    qualities.suwerenna_renamed = 1;
    qualities.suwerenna_merge_support = 30;
    qualities.suwerenna_merge_dissent = 70;
    qualities.government_party = 'pis';
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.government_support_seats = qualities.pis_seats;
    qualities.coalition_seats = qualities.pis_seats;
    const pisLeaderBeforeRefusal = qualities.pis_leader;
    const pisSeatsBeforeRefusal = qualities.pis_seats;
    const otherSeatsBeforeRefusal = qualities.other_seats;
    const supportBeforeRefusal = qualities.government_support_seats;
    const coalitionBeforeRefusal = qualities.coalition_seats;
    engine.goToScene(
      'poland_events_2023_2024.suwerenna_merger_decision_2024'
    );
    assert.strictEqual(qualities.suwerenna_merger_result, 'Merger refused');
    assert.strictEqual(group(qualities, 'solidarna').active, 1);
    assert.strictEqual(group(qualities, 'solidarna').allied, 0);
    assert(qualities.suwerenna_seats > 0);
    assert.strictEqual(
      qualities.pis_seats + qualities.suwerenna_seats,
      pisSeatsBeforeRefusal
    );
    assert.strictEqual(
      qualities.other_seats,
      otherSeatsBeforeRefusal + qualities.suwerenna_seats
    );
    assert.strictEqual(
      qualities.government_support_seats,
      supportBeforeRefusal - qualities.suwerenna_seats,
      'Independent Suwerenna MPs remained in PiS government support'
    );
    assert.strictEqual(
      qualities.coalition_seats,
      coalitionBeforeRefusal - qualities.suwerenna_seats,
      'Independent Suwerenna MPs remained in the PiS cabinet-party ledger'
    );
    assert.strictEqual(qualities.pis_leader, pisLeaderBeforeRefusal);

    startStandard('phase7-ko-historical');
    qualities = engine.state.qualities;
    engine.goToScene('poland_events_2025.ko_consolidation_2025');
    choose('poland_events_2025.ko_leadership_plural');
    choose('poland_events_2025.ko_programme_balance');
    choose('poland_events_2025.ko_local_guarantees');
    choose('poland_events_2025.ko_assets_audit');
    choose('poland_events_2025.ko_dissolution_respect');
    choose('poland_events_2025.ko_dissenters_protection');
    assert.strictEqual(qualities.ko_consolidated, 1);
    assert.strictEqual(group(qualities, 'ko_party').active, 1);
    ['nowoczesna', 'ipl'].forEach(function(componentId) {
      const component = group(qualities, componentId);
      assert.strictEqual(component.active, 1);
      assert.strictEqual(component.kind, 'current');
      assert.strictEqual(component.parent, 'Koalicja Obywatelska');
      assert.strictEqual(component.exclusive_seats, 0);
    });
    assert.strictEqual(group(qualities, 'greens').active, 1);
    assert.strictEqual(
      group(qualities, 'greens').legal_status,
      'allied separate party'
    );

    startStandard('phase7-ko-splinter');
    qualities = engine.state.qualities;
    const koBeforeSplinter = qualities.ko_seats;
    qualities.ko_merger_dissent = 80;
    qualities.ko_merger_recruitment = 18;
    qualities.ko_social_liberal_share = 70;
    qualities.ko_classical_liberal_share = 30;
    engine.goToScene('poland_events_2025.ko_merger_result_2025');
    assert.strictEqual(qualities.ko_splinter_active, 1);
    assert(qualities.ko_splinter_seats > 0);
    assert.strictEqual(
      qualities.ko_seats + qualities.ko_splinter_seats,
      koBeforeSplinter
    );
    assert.strictEqual(group(qualities, 'ko_splinter').active, 1);

    startStandard('phase7-ko-escalated-path');
    qualities = engine.state.qualities;
    qualities.ko_coalition_dissent = 20;
    engine.goToScene('poland_events_2025.ko_consolidation_2025');
    choose('poland_events_2025.ko_leadership_recruit');
    choose('poland_events_2025.ko_programme_attack');
    choose('poland_events_2025.ko_local_attack');
    choose('poland_events_2025.ko_assets_attack');
    choose('poland_events_2025.ko_dissolution_recruit');
    choose('poland_events_2025.ko_dissenters_attack');
    assert.strictEqual(
      qualities.ko_splinter_active,
      1,
      'Sustained KO dissent and an escalated convention still could not split KO'
    );

    startStandard('phase7-ko-individuals');
    qualities = engine.state.qualities;
    const koBeforeIndividuals = qualities.ko_seats;
    const leftBeforeIndividuals = qualities.left_seats;
    const progressivesBeforeIndividuals =
      qualities.left_progressives_seats;
    qualities.ko_merger_integration = 20;
    qualities.ko_merger_federalism = 20;
    qualities.ko_merger_dissent = 30;
    qualities.ko_merger_recruitment = 12;
    engine.goToScene('poland_events_2025.ko_merger_result_2025');
    assert(qualities.ko_individual_defectors > 0);
    assert.strictEqual(
      qualities.ko_seats,
      koBeforeIndividuals - qualities.ko_individual_defectors
    );
    assert.strictEqual(
      qualities.left_seats,
      leftBeforeIndividuals + qualities.ko_individual_defectors
    );
    assert.strictEqual(
      qualities.left_progressives_seats,
      progressivesBeforeIndividuals + qualities.ko_individual_defectors,
      'KO recruits joined no internal Lewica caucus'
    );
    assert.strictEqual(group(qualities, 'nowoczesna').active, 1);
    assert.strictEqual(group(qualities, 'ipl').active, 1);

    startStandard('phase7-rozwoj-bounded');
    qualities = engine.state.qualities;
    const pisBeforeRozwoj = qualities.pis_seats;
    const otherBeforeRozwoj = qualities.other_seats;
    qualities.government_party = 'pis';
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.government_support_seats = pisBeforeRozwoj;
    qualities.coalition_seats = pisBeforeRozwoj;
    const supportBeforeRozwoj = qualities.government_support_seats;
    const coalitionBeforeRozwoj = qualities.coalition_seats;
    engine.goToScene('poland_events_2026.rozwoj_association_2026');
    assert.strictEqual(qualities.pis_seats, pisBeforeRozwoj);
    assert.strictEqual(qualities.rozwoj_seats, 0);
    assert.strictEqual(group(qualities, 'morawiecki').active, 0);
    assert.strictEqual(group(qualities, 'morawiecki').mp_count, 0);
    engine.goToScene('poland_events_2026.pis_rupture_2026');
    choose('poland_events_2026.pis_due_process');
    choose('poland_events_2026.pis_named_loyalties_2026');
    assert(qualities.rozwoj_first_departure_batch >= 3);
    assert(qualities.rozwoj_first_departure_batch <= 8);
    assert(qualities.rozwoj_definitive_departures < 40);
    assert.strictEqual(qualities.pis_split, 0);
    assert.strictEqual(qualities.rozwoj_seats, 0);
    assert.strictEqual(
      qualities.rozwoj_pending_seats,
      qualities.rozwoj_definitive_departures
    );
    assert.strictEqual(
      qualities.pis_seats,
      pisBeforeRozwoj - qualities.rozwoj_definitive_departures
    );
    assert.strictEqual(
      qualities.other_seats,
      otherBeforeRozwoj + qualities.rozwoj_definitive_departures
    );
    assert.strictEqual(
      qualities.government_support_seats,
      supportBeforeRozwoj - qualities.rozwoj_definitive_departures
    );
    assert.strictEqual(
      qualities.coalition_seats,
      coalitionBeforeRozwoj - qualities.rozwoj_definitive_departures
    );
    engine.goToScene('poland_events_2026.pis_hearings_2026');
    assert(qualities.rozwoj_last_departure_batch >= 6);
    assert(qualities.rozwoj_last_departure_batch <= 14);
    assert(qualities.rozwoj_definitive_departures < 40);
    assert.strictEqual(
      qualities.government_support_seats,
      supportBeforeRozwoj - qualities.rozwoj_definitive_departures,
      'Rozwój+ hearing departures left phantom PiS support votes'
    );
    assert.strictEqual(
      qualities.coalition_seats,
      coalitionBeforeRozwoj - qualities.rozwoj_definitive_departures
    );
    engine.goToScene('poland_events_2026.pis_club_2026');
    assert.strictEqual(qualities.rozwoj_club_formed, 0);
    assert.strictEqual(qualities.pis_split, 0);
    assert.strictEqual(qualities.rozwoj_seats, 0);

    startStandard('phase7-rozwoj-crisis-history');
    qualities = engine.state.qualities;
    [
      'poland_events.covid',
      'poland_events.postal',
      'poland_events.shield',
      'poland_events.abortion',
      'poland_events.strike',
    ].forEach(function(sceneId) {
      engine.goToScene(sceneId);
    });
    engine.goToScene('poland_events_2021_2023.august_2021');
    assert.strictEqual(
      qualities.coalition_status,
      'PiS minority government after Porozumienie exit'
    );
    assert.strictEqual(qualities.government_support_seats, 229);
    assert.strictEqual(qualities.coalition_seats, 229);
    engine.goToScene('poland_events_2026.rozwoj_association_2026');
    assert(
      qualities.rozwoj_departure_pressure >= 50,
      'Earlier governing crises did not reach the later PiS rupture'
    );
    engine.goToScene('poland_events_2026.pis_rupture_2026');
    choose('poland_events_2026.pis_due_process');
    choose('poland_events_2026.pis_named_loyalties_2026');
    engine.goToScene('poland_events_2026.pis_hearings_2026');
    engine.goToScene('poland_events_2026.pis_club_2026');
    assert.strictEqual(
      qualities.pis_split,
      1,
      'A severely weakened United Right still avoided the Rozwój+ split'
    );

    startStandard('phase7-rozwoj-club-party');
    qualities = engine.state.qualities;
    const otherBeforeClub = qualities.other_seats;
    engine.goToScene('poland_events_2026.rozwoj_association_2026');
    engine.goToScene('poland_events_2026.pis_rupture_2026');
    choose('poland_events_2026.pis_attack_ultimatum');
    choose('poland_events_2026.pis_named_loyalties_2026');
    assert(qualities.rozwoj_definitive_departures < 40);
    engine.goToScene('poland_events_2026.pis_hearings_2026');
    engine.goToScene('poland_events_2026.pis_club_2026');
    assert.strictEqual(qualities.rozwoj_club_formed, 1);
    assert.strictEqual(qualities.pis_split, 1);
    assert.strictEqual(
      qualities.rozwoj_seats,
      qualities.rozwoj_definitive_departures
    );
    assert.strictEqual(qualities.rozwoj_pending_seats, 0);
    assert.strictEqual(qualities.other_seats, otherBeforeClub);
    engine.goToScene('poland_events_2026.pis_party_2026');
    assert.strictEqual(qualities.rozwoj_party_formed, 1);
    assert.strictEqual(group(qualities, 'rozwoj_plus').kind, 'party');
    assert(
      qualities.rival_person_records.some(function(person) {
        return person.id === 'lorek' && person.party === 'pis';
      }),
      'Named PiS loyalty disappeared during the Rozwój+ chain'
    );

    startStandard('phase7-matysiak-leads-razem');
    qualities = engine.state.qualities;
    qualities.matysiak_development_pressure = 40;
    qualities.economic_issue_salience = 60;
    qualities.cultural_issue_salience = 30;
    qualities.left_right_score = 50;
    qualities.left_poll = 18;
    qualities.party_system_left_pull = 30;
    engine.goToScene('poland_events_2025.matysiak_razem_2025');
    choose('poland_events_2025.matysiak_leadership');
    assert.strictEqual(qualities.razem_leader, 'Paulina Matysiak');
    assert.strictEqual(
      qualities.razem_ideology,
      'Developmentalist social conservatism'
    );
    assert(qualities.razem_right_score >= 60);

    startStandard('phase7-matysiak-splitter');
    qualities = engine.state.qualities;
    qualities.matysiak_development_pressure = 30;
    qualities.economic_issue_salience = 55;
    qualities.cultural_issue_salience = 35;
    const matysiakSeatTotal = qualities.left_seats +
      qualities.razem_party_seats + qualities.tak_rozwoj_seats +
      qualities.other_seats;
    engine.goToScene('poland_events_2025.matysiak_razem_2025');
    choose('poland_events_2025.matysiak_own_party');
    assert.strictEqual(qualities.tak_dla_rozwoju_party_formed, 1);
    assert.strictEqual(qualities.tak_rozwoj_seats, 1);
    assert.strictEqual(
      qualities.left_seats + qualities.razem_party_seats +
        qualities.tak_rozwoj_seats + qualities.other_seats,
      matysiakSeatTotal,
      'The Matysiak split created or destroyed a Sejm seat'
    );
    qualities.left_poll_momentum = 35;
    qualities.tak_rozwoj_poll_momentum = 10;
    qualities.matysiak_development_pressure = 100;
    qualities.poll_state_month_key = -1;
    engine.goToScene('poland_polling');
    assert(
      qualities.tak_rozwoj_poll >= 5,
      'The high-support Tak! projection fixture missed the threshold'
    );
    assert(
      Number.isFinite(qualities.tak_rozwoj_projected_seats) &&
        qualities.tak_rozwoj_projected_seats > 0,
      'A qualified Tak! list corrupted d’Hondt apportionment'
    );

    startStandard('phase7-matysiak-no-mandate-resurrection');
    qualities = engine.state.qualities;
    qualities.rozwoj_chain_stage = 4;
    qualities.rozwoj_club_formed = 1;
    qualities.rozwoj_party_readiness = 100;
    qualities.rozwoj_seats = 3;
    qualities.other_seats = 7;
    qualities.matysiak_party = 'independent';
    qualities.matysiak_has_sejm_mandate = 0;
    const rozwojOrganisation = group(qualities, 'rozwoj_plus');
    rozwojOrganisation.organisation = 100;
    rozwojOrganisation.cohesion = 100;
    engine.goToScene('poland_events_2026.pis_party_2026');
    assert.strictEqual(qualities.rozwoj_party_formed, 1);
    assert.strictEqual(qualities.rozwoj_seats, 3);
    assert.strictEqual(
      qualities.other_seats,
      7,
      'Matysiak took another independent MP\'s mandate after losing her own'
    );

    startStandard('phase7-left-realignment');
    qualities = engine.state.qualities;
    qualities.left_realign_invite_p2050 = 1;
    qualities.left_realign_invite_greens = 1;
    qualities.left_realign_invite_rozwoj = 1;
    qualities.left_poll = 20;
    qualities.party_system_left_pull = 30;
    qualities.party_unity = 60;
    qualities.public_trust = 50;
    qualities.social_spending_support = 60;
    qualities.economic_issue_salience = 60;
    qualities.cultural_issue_salience = 25;
    qualities.left_right_score = 50;
    qualities.barons_active = 0;
    qualities.p2050_seats = 20;
    qualities.p2050_relation = 80;
    qualities.p2050_coalition_dissent = 0;
    qualities.p2050_vote_intent = 3;
    qualities.p2050_split = 1;
    qualities.p2050_split_occurred = 1;
    qualities.unia_centrum_formed = 1;
    qualities.centrum_seats = 5;
    qualities.centrum_vote_intent = 2;
    qualities.centrum_poll = 2;
    qualities.ko_seats = 100;
    qualities.rozwoj_seats = 10;
    qualities.rozwoj_party_formed = 1;
    qualities.rozwoj_relation = 80;
    const greens = group(qualities, 'greens');
    greens.relation = 80;
    greens.exclusive_seats = 3;
    greens.mp_count = 3;
    const realignmentSeatTotal = qualities.left_seats +
      qualities.p2050_seats + qualities.ko_seats +
      qualities.rozwoj_seats;
    engine.goToScene('poland_events_2026.left_realign_2026');
    choose('poland_events_2026.realign_grand_merger');
    assert.strictEqual(qualities.left_realign_name, 'Nowa Solidarność');
    assert.strictEqual(qualities.p2050_joined_left, 1);
    assert.strictEqual(qualities.greens_joined_left, 1);
    assert.strictEqual(qualities.rozwoj_joined_left, 1);
    assert.strictEqual(qualities.p2050_seats, 0);
    assert.strictEqual(qualities.rozwoj_seats, 0);
    assert.strictEqual(
      qualities.left_seats + qualities.p2050_seats + qualities.ko_seats +
        qualities.rozwoj_seats,
      realignmentSeatTotal,
      'The broad Left merger created or destroyed Sejm seats'
    );
    assert.strictEqual(qualities.left_p2050_current_seats, 20);
    assert.strictEqual(qualities.left_green_current_seats, 3);
    assert.strictEqual(qualities.left_rozwoj_current_seats, 10);
    assert.strictEqual(
      qualities.left_barons_seats + qualities.left_spring_seats +
        qualities.left_labor_seats + qualities.left_progressives_seats +
        qualities.razem_seats + qualities.left_pps_seats,
      qualities.left_seats,
      'Merged currents were not recorded inside a live Left caucus'
    );
    qualities.poll_state_month_key = -1;
    engine.goToScene('poland_polling');
    assert(
      qualities.centrum_vote_intent > 0,
      'Independent Unia Centrum lost its electorate when P2050 merged'
    );

    startStandard('opposition-p2050-merger-preserves-government-support');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      government_party: 'pis',
      government_has_confidence: 1,
      caretaker_government: 0,
      left_in_government: 0,
      ministry_p2050_in_cabinet: 0,
      government_support_seats: 235,
      p2050_seats: 20,
      p2050_joined_left: 0,
      left_realign_targets: 'Poland 2050',
      left_realign_p2050_accepted: 1,
      left_realign_greens_accepted: 0,
      left_realign_rozwoj_accepted: 0,
    });
    const p2050MergerSeatTotal = qualities.left_seats +
      qualities.p2050_seats;
    engine.goToScene('poland_events_2026.left_realign_result');
    assert.strictEqual(
      qualities.left_seats + qualities.p2050_seats,
      p2050MergerSeatTotal
    );
    assert.strictEqual(
      qualities.government_support_seats,
      235,
      'An opposition P2050 merger removed unrelated PiS government votes'
    );

    startStandard('phase7-named-left-pm');
    qualities = engine.state.qualities;
    qualities.democratic_committed_seats = 205;
    qualities.left_committed_seats = 26;
    qualities.ko_seats = 150;
    engine.goToScene('poland_events_2026.snap_sejm_left');
    const leftPmChoices = currentChoices().map(function(choice) {
      return choice.id;
    });
    assert(leftPmChoices.includes('poland_events_2026.snap_left_biejat'));
    assert(leftPmChoices.includes(
      'poland_events_2026.snap_left_dziemianowicz'
    ));
    assert(leftPmChoices.includes('poland_events_2026.snap_left_gawkowski'));
    assert(leftPmChoices.includes('poland_events_2026.snap_left_kotula'));
    choose('poland_events_2026.snap_left_biejat');
    assert.strictEqual(qualities.snap_dem_candidate, 'Magdalena Biejat');
    assert.strictEqual(qualities.snap_dem_candidate_left, 1);

    startStandard('phase7-lewica-influence-bounds');
    qualities = engine.state.qualities;
    const leadersBeforeInfluence = Object.fromEntries(
      qualities.rival_group_records.map(function(record) {
        return [record.id, record.leader];
      })
    );
    const membersBeforeInfluence = qualities.rival_group_records.reduce(
      function(total, record) {
        return total + record.mp_count;
      },
      0
    );
    engine.goToScene('poland_rival_organisations');
    choose('poland_rival_organisations.recruit');
    assert.deepStrictEqual(
      Object.fromEntries(
        qualities.rival_group_records.map(function(record) {
          return [record.id, record.leader];
        })
      ),
      leadersBeforeInfluence
    );
    assert.strictEqual(
      qualities.rival_group_records.reduce(function(total, record) {
        return total + record.mp_count;
      }, 0),
      membersBeforeInfluence - 1
    );
    assert.strictEqual(qualities.rival_individual_recruits, 1);

    startStandard('phase7-low-pis-seat-conservation');
    qualities = engine.state.qualities;
    qualities.pis_seats = 2;
    qualities.other_seats = 11;
    qualities.rozwoj_association_members = 40;
    qualities.rozwoj_definitive_departures = 0;
    qualities.rozwoj_pending_seats = 0;
    qualities.rozwoj_departure_pressure = 100;
    const lowPisSeatTotal = qualities.pis_seats + qualities.other_seats;
    engine.goToScene('poland_events_2026.pis_named_loyalties_2026');
    assert.strictEqual(qualities.rozwoj_first_departure_batch, 2);
    assert.strictEqual(
      qualities.pis_seats + qualities.other_seats,
      lowPisSeatTotal,
      'Rozwój+ created seats when PiS had fewer MPs than its departure batch'
    );

    startStandard('phase7-low-pis-hearing-conservation');
    qualities = engine.state.qualities;
    qualities.pis_seats = 3;
    qualities.other_seats = 9;
    qualities.rozwoj_association_members = 40;
    qualities.rozwoj_definitive_departures = 4;
    qualities.rozwoj_pending_seats = 4;
    qualities.rozwoj_departure_pressure = 100;
    qualities.rozwoj_party_readiness = 100;
    const lowPisHearingTotal = qualities.pis_seats + qualities.other_seats;
    engine.goToScene('poland_events_2026.pis_hearings_2026');
    assert.strictEqual(qualities.rozwoj_last_departure_batch, 3);
    assert.strictEqual(
      qualities.pis_seats + qualities.other_seats,
      lowPisHearingTotal,
      'PiS disciplinary hearings created Sejm seats'
    );
  }

  function testTrzaskowskiPorozumienieConfidenceVote() {
    startStandard('trzaskowski-porozumienie-player-vonc');
    let qualities = engine.state.qualities;
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.trz_inaugurated = 1;
    engine.goToScene('poland_events_2021_2023.august_2021');
    choose('poland_events_2021_2023.aug21_constructive');
    assert.strictEqual(qualities.aug21_vonc_left_can_sponsor, 1);
    choose('poland_events_2021_2023.aug21_vonc_compact');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2021_2023.aug21_constructive_roll'
    );
    assert.strictEqual(qualities.confidence_mode.includes('Article 158'), true);
    assert.strictEqual(qualities.confidence_threshold, 231);
    assert(qualities.confidence_yes < qualities.confidence_threshold);
    assert.strictEqual(qualities.constructive_passed, 0);
    assert.strictEqual(qualities.prime_minister, 'Mateusz Morawiecki');
    assert.strictEqual(qualities.government_party, 'pis');
    assert.strictEqual(qualities.left_in_government, 0);
    choose('poland_events_2021_2023.aug21_constructive_return');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(qualities.government_party, 'pis');

    startStandard('trzaskowski-porozumienie-ai-vonc');
    qualities = engine.state.qualities;
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.trz_inaugurated = 1;
    engine.goToScene('poland_events_2021_2023.august_2021');
    choose('poland_events_2021_2023.aug21_constructive');
    choose('poland_events_2021_2023.aug21_vonc_ai');
    assert.strictEqual(qualities.aug21_vonc_initiator, 'KO parliamentary AI');
    assert.strictEqual(qualities.confidence_threshold, 231);
    assert(qualities.confidence_yes < qualities.confidence_threshold);
    assert.strictEqual(qualities.constructive_passed, 0);
    assert.strictEqual(qualities.prime_minister, 'Mateusz Morawiecki');
    assert.strictEqual(qualities.government_party, 'pis');
  }

  function testPiSNewLeftCoalitionEntry() {
    startStandard('pis-new-left-coalition-locked');
    let qualities = engine.state.qualities;
    engine.goToScene('poland_events_2021_2023.august_2021');
    let joinChoice = currentChoices().find(function(choice) {
      return choice.id === 'poland_events_2021_2023.aug21_join';
    });
    assert(joinChoice, 'August 2021 coalition route is hidden');
    assert.strictEqual(joinChoice.canChoose, false);

    startStandard('pis-new-left-coalition-open');
    qualities = engine.state.qualities;
    qualities.year = 2021;
    qualities.month = 8;
    qualities.pis_relation = 55;
    qualities.government_negotiation_hostility = 45;
    engine.goToScene('poland_events_2021_2023.august_2021');
    joinChoice = currentChoices().find(function(choice) {
      return choice.id === 'poland_events_2021_2023.aug21_join';
    });
    assert(joinChoice && joinChoice.canChoose);
    choose('poland_events_2021_2023.aug21_join');

    const expectedLeftCabinetSeats = Math.min(
      qualities.left_seats,
      qualities.nowa_lewica_seats
    );
    assert.strictEqual(qualities.left_in_government, 1);
    assert.strictEqual(qualities.razem_in_government, 0);
    assert.strictEqual(qualities.government_party, 'pis');
    assert.strictEqual(qualities.ministries_finalized, 0);
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2021_2023.aug21_join'
    );
    choose('poland_ministries');
    assert.strictEqual(engine.state.sceneId, 'poland_ministries.menu');
    assert.strictEqual(qualities.ministry_leverage, 17);
    assertNamedCabinet(qualities, 'Morawiecki coalition roster');
    assert.strictEqual(qualities.labor_minister_party, 'PiS');
    assert.strictEqual(qualities.health_minister_party, 'PiS');
    assert.strictEqual(qualities.digital_minister_party, 'PiS');
    assert.strictEqual(qualities.defence_minister_party, 'PiS');
    assert.strictEqual(
      currentChoices().find(function(choice) {
        return choice.id === 'poland_ministries.take_justice';
      }).canChoose,
      false,
      'PiS released Justice during the accession negotiation'
    );
    choose('poland_ministries.take_labor');
    choose('poland_ministries.take_health');
    choose('poland_ministries.take_digital');
    assert.strictEqual(qualities.ministry_leverage, 1);
    choose('poland_ministries.finalize');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2021_2023.aug21_cabinet_result'
    );
    assert.strictEqual(qualities.ministries_finalized, 1);
    assert.strictEqual(qualities.ministry_count, 3);
    assert.strictEqual(
      qualities.ministry_left_cabinet_seats,
      expectedLeftCabinetSeats
    );
    assert.strictEqual(qualities.labor_minister_party, 'Lewica');
    assert.strictEqual(qualities.health_minister_party, 'Lewica');
    assert.strictEqual(qualities.digital_minister_party, 'Lewica');
    assert.strictEqual(qualities.labor_minister, 'Agnieszka Dziemianowicz-Bąk');
    assert.strictEqual(qualities.health_minister, 'Marek Rutka');
    assert.strictEqual(qualities.digital_minister, 'Krzysztof Gawkowski');
    assert.strictEqual(qualities.defence_minister_party, 'PiS');
    assert.strictEqual(qualities.government_name, 'Third Morawiecki Cabinet');
    assert.strictEqual(
      qualities.coalition_seats,
      qualities.pis_seats + expectedLeftCabinetSeats
    );
    assert(qualities.coalition_seats >= 231);

    choose('poland_event_queue');
    assert.strictEqual(engine.state.sceneId, 'poland_event_queue.events_choice');
    choose('poland_government_burden.entry');
    assert.strictEqual(qualities.government_burden_active, 1);
    choose('poland_government_burden.entry_continue');
    if (engine.state.sceneId !== 'poland_hub') {
      engine.goToScene('poland_hub');
    }
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(qualities.left_in_government, 1);
    assert.strictEqual(qualities.ministry_count, 3);
    assert(
      currentChoices().some(function(choice) {
        return choice.id === 'poland_government_deck' && choice.canChoose;
      }),
      'PiS cabinet entry did not unlock Government Affairs'
    );
    assert(
      !currentChoices().some(function(choice) {
        return choice.id === 'poland_negotiation_deck';
      }),
      'Opposition negotiations remained open from inside the PiS cabinet'
    );
    assert(
      qualities.coalition_cabinet_parties.includes('PiS') &&
        qualities.coalition_cabinet_parties.includes('Lewica')
    );

    const koDissentBeforeInspection = qualities.ko_coalition_dissent;
    const cabinetDissentBeforeInspection =
      qualities.government_coalition_dissent;
    qualities.budget = Math.max(3, qualities.budget);
    engine.goToScene('poland_labor_inspection');
    choose('poland_labor_inspection.fund');
    assert.strictEqual(
      qualities.ko_coalition_dissent,
      koDissentBeforeInspection,
      'A PiS cabinet dispute was incorrectly charged to KO'
    );
    assert.strictEqual(
      qualities.government_coalition_dissent,
      cabinetDissentBeforeInspection + 3
    );

    engine.goToScene('poland_events_2021_2023.budget_2021');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2021_2023.budget_2021_cabinet'
    );
    choose('poland_events_2021_2023.budget21_cabinet_social');
    assert.strictEqual(qualities.budget_2021_ratified, 1);
    assert.strictEqual(qualities.annual_budget_left_cabinet_authority, 1);
    assert.strictEqual(
      qualities.last_policy_authority,
      'Third Morawiecki Cabinet'
    );

    engine.goToScene('poland_events_2021_2023.december_2022');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2021_2023.budget_2022_cabinet'
    );
    choose('poland_events_2021_2023.budget22_cabinet_shield');
    assert.strictEqual(qualities.budget_2022_ratified, 1);
    assert.strictEqual(qualities.budget_2022_concession_pending, 1);

    engine.goToScene('poland_coalition_council');
    choose('poland_coalition_council.leave_pis_cabinet');
    assert.strictEqual(qualities.left_in_government, 0);
    assert.strictEqual(qualities.ministry_count, 0);
    assert.strictEqual(qualities.labor_minister_party, 'PiS');
    assert.strictEqual(qualities.health_minister_party, 'PiS');
    assert.strictEqual(qualities.digital_minister_party, 'PiS');
    assert.strictEqual(
      qualities.government_name,
      'Third Morawiecki Cabinet — PiS minority'
    );
    assert.strictEqual(qualities.budget, 0);
  }

  function testBraunLegalChain() {
    Object.keys(game.scenes).forEach(function(sceneId) {
      const faceImage = game.scenes[sceneId].faceImage;
      if (faceImage && faceImage.startsWith('img/poland/events/')) {
        assert(
          fs.existsSync(path.join(projectRoot, 'out', 'html', faceImage)),
          sceneId + ' references a missing event image: ' + faceImage
        );
      }
    });

    startStandard('braun-legal-chain');
    const qualities = engine.state.qualities;

    engine.goToScene('poland_events_2023_2024.december_braun');
    choose('poland_events_2023_2024.braun_rules');
    assert.strictEqual(qualities.braun_legal_preparation, 4);

    engine.goToScene('poland_events_2025.braun_breaks_konf');
    choose('poland_events_2025.braun_watch');
    assert.strictEqual(qualities.braun_legal_preparation, 8);

    engine.goToScene('poland_events_2025.braun_hospital_2025');
    choose('poland_events_2025.braun_hospital_evidence');
    assert.strictEqual(qualities.braun_hospital_2025_done, 1);
    assert.strictEqual(qualities.braun_legal_preparation, 13);

    engine.goToScene('poland_events_2025.braun_indictment_2025');
    assert(qualities.braun_procedure_score > 0);
    choose('poland_events_2025.braun_indictment_calendar');
    assert.strictEqual(qualities.braun_indictment_2025_done, 1);
    assert.strictEqual(qualities.braun_legal_preparation, 16);

    engine.goToScene('poland_events_2026.braun_detention_2026');
    const caseSeparation = currentChoices().find(function(choice) {
      return choice.id === 'poland_events_2026.braun_case_separation';
    });
    assert(caseSeparation && caseSeparation.canChoose);
    choose('poland_events_2026.braun_case_separation');
    assert.strictEqual(
      qualities.braun_compulsion_strategy,
      'Separate cases and independent victim representation'
    );
    assert.strictEqual(qualities.braun_legal_preparation, 19);
  }

  function test2027ElectionHorizon() {
    // The 2027 router and event desk carry the election-year opening.
    startStandard('dated-queue-2027-campaign-opening');
    isolateDatedEventFixture([
      'poland_events_2027.election_year_opens_2027',
    ]);
    let qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2027,
      month: 1,
      month_name: 'January',
      date_label: 'January 2027',
      continuous_campaign: 1,
      poland_event_phase: 0,
      poll_state_month_key: -1,
    });
    engine.goToScene('poland_polling');
    assert.strictEqual(engine.state.sceneId, 'poland_event_queue.events_choice');
    assert.strictEqual(qualities.poland_event_phase, 1);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2027.election_year_opens_2027']
    );
    choose('poland_events_2027.election_year_opens_2027');
    choose('poland_events_2027.opening_organisation_2027');
    continueDatedEventAfterword('poland_hub');
    assert.strictEqual(qualities.election_2027_campaign_open, 1);
    assert.strictEqual(
      qualities.election_2027_campaign_strategy,
      'Organised social base'
    );

    // The scheduled count certifies both chambers and the surviving Left then
    // receives the end-game epilogue instead of a new formation chapter.
    startStandard('dated-queue-2027-election-epilogue');
    isolateDatedEventFixture([
      'poland_events_2027.parliamentary_election_2027',
    ]);
    qualities = openDatedEventQueue(2027, 10);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2027.parliamentary_election_2027']
    );
    choose('poland_events_2027.parliamentary_election_2027');
    choose('poland_events_2027.count_parliamentary_election_2027');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2026.snap_result_2026'
    );
    assert.strictEqual(qualities.election_2027_terminal, 1);
    assert.strictEqual(qualities.snap_election_complete, 1);
    assert.strictEqual(
      [
        'pis', 'ko', 'left', 'psl', 'p2050', 'konf',
        'sld_breakaway', 'social_patriot', 'spring_breakaway',
        'labor_left', 'young_left', 'razem_party', 'pps_party',
        'tak_rozwoj', 'centrum', 'rozwoj', 'korona', 'ko_splinter',
        'other',
      ].reduce(function(total, id) {
        return total + Number(qualities[id + '_seats'] || 0);
      }, 0),
      460,
      'The 2027 election did not certify all Sejm seats'
    );
    assert.strictEqual(
      qualities.senate_pis_seats + qualities.senate_konf_seats +
        qualities.senate_ko_seats + qualities.senate_p2050_seats +
        qualities.senate_psl_seats + qualities.senate_left_seats +
        qualities.senate_independent_seats,
      100,
      'The 2027 election did not certify all Senate districts'
    );
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2026.election_2027_epilogue']
    );
    choose('poland_events_2026.election_2027_epilogue');
    assert.strictEqual(engine.state.sceneId, 'poland_ending.final_assessment');
    assert.strictEqual(engine.isGameOver(), true);
    assert.strictEqual(qualities.poland_event_phase, 0);
    assert.strictEqual(qualities.timeline_complete, 1);
    assert.strictEqual(qualities.prototype_complete, 1);
    assert.strictEqual(qualities.ending_exit_type, 'Natural conclusion');
    assert(qualities.ending_opening.includes('counts are certified'));
    assert(qualities.ending_achievements.length > 20);
    assert(qualities.ending_failures.length > 20);
    assert(qualities.ending_future_path.includes('2030'));
  }

  function testMandatoryDatedEventQueue() {
    const taggedEvents = Object.keys(game.tagLookup.poland_event || {});
    const repeatableDatedEvents = {
      'poland_events_2026.snap_campaign_result_due_2026': 2,
      'poland_government_burden.entry': 8,
      'poland_government_burden.review': 8,
      // This institutional repair event must be available again if a later
      // election or reshuffle creates a different incompatibility.
      'poland_office_authority.resolve': 8,
    };
    const unlimitedDatedEvents = new Set([
      'poland_events_2026.snap_election_2026',
    ]);
    assert(taggedEvents.length > 0, 'No Polish dated events are tagged');
    taggedEvents.forEach(function(sceneId) {
      const scene = game.scenes[sceneId];
      assert.strictEqual(
        scene.maxVisits,
        unlimitedDatedEvents.has(sceneId)
          ? undefined
          : (repeatableDatedEvents[sceneId] || 1),
        sceneId + ' has an unintended recurrence limit'
      );
      assert(
        Number.isFinite(scene.priority) && scene.priority > 0,
        sceneId + ' has no explicit non-zero queue priority'
      );
      assert.strictEqual(
        scene.chooseIf,
        undefined,
        sceneId + ' locks the queue entry instead of its internal outcomes'
      );
    });

    // The local result must resolve before the later abortion reading, while
    // both remain independently visitable in the same month.
    startStandard('dated-queue-april-order');
    isolateDatedEventFixture([
      'poland_events_2023_2024.local_election_2024',
      'poland_events_2023_2024.abortion_first_reading',
    ]);
    engine.state.qualities.government_party = 'ko';
    engine.state.qualities.prime_minister = 'Donald Tusk';
    engine.state.qualities.government_name = 'KO-led democratic coalition';
    engine.state.qualities.left_in_government = 1;
    engine.state.qualities.caretaker_government = 0;
    let qualities = openDatedEventQueue(2024, 4);
    assert.strictEqual(qualities.poland_event_queue_count, 2);
    assert.strictEqual(qualities.poland_event_queue_tier_count, 1);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2023_2024.local_election_2024']
    );

    // Even an implicit return to the root cannot reopen the card hand while
    // the mandatory event phase is active.
    engine.goToScene('root');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_event_queue.events_choice'
    );
    assert.strictEqual(qualities.poland_event_phase, 1);

    choose('poland_events_2023_2024.local_election_2024');
    choose('poland_events_2023_2024.local_ko');
    continueDatedEventAfterword('poland_event_queue.events_choice');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_event_queue.events_choice'
    );
    assert.strictEqual(qualities.poland_event_queue_count, 1);
    assert.strictEqual(qualities.poland_event_queue_tier_count, 1);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2023_2024.abortion_first_reading']
    );

    // Visit counts and the event-phase lock must survive a save/load while
    // other files from the same month are still pending.
    const savedQueueState = JSON.parse(
      JSON.stringify(engine.getExportableState())
    );
    engine.setState(savedQueueState);
    qualities = engine.state.qualities;
    assert.strictEqual(qualities.poland_event_phase, 1);
    assert.strictEqual(
      engine.state.visits[
        'poland_events_2023_2024.local_election_2024'
      ],
      1
    );
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2023_2024.abortion_first_reading']
    );
    choose('poland_events_2023_2024.abortion_first_reading');
    choose('poland_events_2023_2024.abortion_sequence');
    continueDatedEventAfterword('poland_hub');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(qualities.poland_event_phase, 0);

    // The counter includes every pending priority tier, while the visible
    // choice list exposes only the current tier, as in the base mod.
    startStandard('dated-queue-priority-tiers');
    isolateDatedEventFixture([
      'poland_events_2023_2024.december_braun',
      'poland_events_2023_2024.december_public_media',
      'poland_events_2023_2024.independence_2023',
      'poland_budget_2023_2026.budget_2023',
    ]);
    engine.state.qualities.government_party = 'ko';
    engine.state.qualities.prime_minister = 'Donald Tusk';
    engine.state.qualities.government_name = 'KO-led democratic coalition';
    engine.state.qualities.left_in_government = 0;
    engine.state.qualities.caretaker_government = 0;
    qualities = openDatedEventQueue(2023, 12);
    assert.strictEqual(qualities.poland_event_queue_count, 4);
    assert.strictEqual(qualities.poland_event_queue_tier_count, 2);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      [
        'poland_events_2023_2024.december_braun',
        'poland_events_2023_2024.december_public_media',
      ]
    );
    choose('poland_events_2023_2024.december_braun');
    choose('poland_events_2023_2024.braun_rules');
    continueDatedEventAfterword('poland_event_queue.events_choice');
    assert.strictEqual(qualities.poland_event_queue_count, 3);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2023_2024.december_public_media']
    );
    choose('poland_events_2023_2024.december_public_media');
    choose('poland_events_2023_2024.media_opposition_bill');
    continueDatedEventAfterword('poland_event_queue.events_choice');
    assert.strictEqual(qualities.poland_event_queue_count, 2);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2023_2024.independence_2023']
    );
    choose('poland_events_2023_2024.independence_2023');
    choose('poland_events_2023_2024.ind23_monitor');
    continueDatedEventAfterword('poland_event_queue.events_choice');
    assert.strictEqual(qualities.poland_event_queue_count, 1);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_budget_2023_2026.budget_2023']
    );
    choose('poland_budget_2023_2026.budget_2023');
    assert.strictEqual(qualities.poland_event_phase, 1);
    choose('poland_opposition_budget.start');
    playOppositionBudgetStages(
      'poland_opposition_budget.priority_transition',
      'poland_opposition_budget.priority_housing',
      'poland_opposition_budget.tactic_abstain'
    );
    if (
      engine.state.sceneId ===
      'poland_budget_2023_2026.opposition_budget_failed'
    ) {
      choose('poland_budget_2023_2026.opposition_hold_deadline');
    }
    continueDatedEventAfterword('poland_hub');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(qualities.poland_event_phase, 0);

    // Resolving one file can unlock a new, lower-priority file in the same
    // month. The queue must recompute rather than relying on its first draw.
    startStandard('dated-queue-same-month-unlock');
    isolateDatedEventFixture([
      'poland_events_2025.presidential_runoff_2025',
      'poland_events_2025.confidence_after_presidential',
      'poland_events_2025.third_way_ends',
    ]);
    qualities = engine.state.qualities;
    qualities.pres_2025_round_one_done = 1;
    qualities.pres_2025_runoff_done = 0;
    qualities.pres_2025_finalist_a_key = 'ko';
    qualities.pres_2025_finalist_b_key = 'right';
    qualities.pres_2025_ko_candidate = 'Rafał Trzaskowski';
    qualities.pres_2025_left_candidate = 'Magdalena Biejat';
    qualities.pres_2025_transfer_strength = 0;
    qualities.coalition_confidence_2025_done = 0;
    qualities.third_way_split = 0;
    qualities.left_in_government = 0;
    qualities.government_party = 'ko';
    qualities.prime_minister = 'Donald Tusk';
    qualities.government_name = 'KO-led democratic coalition';
    qualities.caretaker_government = 0;
    qualities.coalition_seats = 248;
    openDatedEventQueue(2025, 6);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2025.presidential_runoff_2025']
    );
    choose('poland_events_2025.presidential_runoff_2025');
    continueDatedEventAfterword('poland_event_queue.events_choice');
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2025.confidence_after_presidential']
    );
    choose('poland_events_2025.confidence_after_presidential');
    choose('poland_events_2025.confidence_opposition');
    choose('poland_events_2025.confidence_oppose_2025');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.confidence_oppose_2025',
      'The confidence-vote posture was cleared before it could be read'
    );
    choose('poland_events_2025.confidence_2025_roll');
    choose('poland_events_2025.confidence_return');
    continueDatedEventAfterword('poland_event_queue.events_choice');
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2025.third_way_ends']
    );
    choose('poland_events_2025.third_way_ends');
    chooseFirstAvailable([
      'poland_events_2025.td_bilateral',
      'poland_events_2025.td_renew',
    ]);
    if (qualities.third_way_split) {
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events_2025.td_bilateral',
        'The Third Way split response was cleared before it could be read'
      );
      choose('poland_events_2025.td_psl_accounting');
      choose('poland_events_2025.td_roll_calls');
    }
    continueDatedEventAfterword('poland_hub');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(qualities.poland_event_phase, 0);

    // The October election leaves the event phase open during formation.
    // Its common campaign exit must land on December's unresolved queue.
    startStandard('dated-queue-formation-return');
    isolateDatedEventFixture([
      'poland_events_2023_2024.election_2023',
      'poland_events_2023_2024.december_braun',
      'poland_events_2023_2024.december_public_media',
      'poland_events_2023_2024.independence_2023',
      'poland_budget_2023_2026.budget_2023',
    ]);
    qualities = openDatedEventQueue(2023, 10);
    choose('poland_events_2023_2024.election_2023');
    choose('poland_events_2023_2024.election_night');
    assert.strictEqual(qualities.poland_event_phase, 1);
    const formationReturnTime = qualities.time;
    engine.goToScene('poland_government_formation.campaign_return');
    assert.strictEqual(qualities.year, 2023);
    assert.strictEqual(qualities.month, 12);
    assert.strictEqual(
      qualities.time,
      formationReturnTime + 2,
      'The October-to-December formation return did not advance campaign time'
    );
    continueDatedEventAfterword('poland_event_queue.events_choice');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_event_queue.events_choice'
    );
    assert.strictEqual(qualities.poland_event_phase, 1);
    assert(qualities.poland_event_queue_count >= 3);
    engine.goToScene('root');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_event_queue.events_choice'
    );

    startStandard('article-155-failure-launches-mandatory-election');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      formation_continuous: 1,
      continuous_campaign: 1,
      year: 2023,
      month: 10,
      month_name: 'October',
      date_label: 'October 2023',
      time: 48,
    });
    engine.goToScene('poland_government_formation.early_election');
    assert.strictEqual(qualities.snap_election_trigger,
      'Mandatory dissolution after failed Article 155 third attempt');
    assert.strictEqual(qualities.year, 2023);
    assert.strictEqual(qualities.month, 12);
    assert.strictEqual(qualities.time, 50);
    assert.strictEqual(qualities.caretaker_government, 1);
    choose('poland_government_formation.early_election_campaign');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2026.snap_campaign_launch'
    );
    assert.strictEqual(qualities.snap_campaign_active, 1);
    assert.strictEqual(qualities.snap_campaign_start_time, 50);
    assert.strictEqual(qualities.snap_campaign_due_time, 51);
    assert.strictEqual(qualities.snap_election_held, 0);

    // The final December budget remains mandatory, but it now returns to the
    // campaign instead of ending play before the 2027 election.
    startStandard('dated-queue-december-2026-continues');
    isolateDatedEventFixture([
      'poland_budget_2023_2026.budget_2026',
    ]);
    qualities = engine.state.qualities;
    qualities.left_in_government = 0;
    openDatedEventQueue(2026, 12);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_budget_2023_2026.budget_2026']
    );
    choose('poland_budget_2023_2026.budget_2026');
    choose('poland_opposition_budget.start');
    playOppositionBudgetStages(
      'poland_opposition_budget.priority_inspection',
      'poland_opposition_budget.priority_partnerships',
      'poland_opposition_budget.tactic_abstain'
    );
    if (
      engine.state.sceneId ===
      'poland_budget_2023_2026.opposition_budget_failed'
    ) {
      choose('poland_budget_2023_2026.opposition_hold_deadline');
    }
    if (engine.state.sceneId === 'poland_senate.budget_2021_2022') {
      choose('poland_senate.budget_later_record');
      choose('poland_senate.budget_later_complete');
    }
    continueDatedEventAfterword('poland_hub');
    assert.strictEqual(qualities.poland_event_phase, 0);
    assert.strictEqual(qualities.timeline_complete, 0);
    assert.strictEqual(qualities.prototype_complete, 0);

    test2027ElectionHorizon();
  }

  function testIndependenceMarchChain() {
    const annualJoinRoutes = [
      [
        'poland_events_2021_2023.independence_2019',
        'poland_events_2021_2023.ind19_social_patriot',
      ],
      [
        'poland_events_2021_2023.independence_2020',
        'poland_events_2021_2023.ind20_join',
      ],
      [
        'poland_events_2021_2023.nov21_independence',
        'poland_events_2021_2023.nov21_join',
      ],
      [
        'poland_events_2021_2023.nov22_independence',
        'poland_events_2021_2023.nov22_join',
      ],
      [
        'poland_events_2023_2024.independence_2023',
        'poland_events_2023_2024.ind23_join',
      ],
      [
        'poland_events_2023_2024.independence_2024',
        'poland_events_2023_2024.ind24_join',
      ],
      [
        'poland_events_2025.independence_2025',
        'poland_events_2025.ind25_join',
      ],
      [
        'poland_events_2026.independence_2026',
        'poland_events_2026.ind26_join',
      ],
    ];
    annualJoinRoutes.forEach(function(route, index) {
      startStandard('independence-join-route-' + index);
      engine.goToScene(route[0]);
      const joinChoice = currentChoices().find(function(choice) {
        return choice.id === route[1];
      });
      assert(
        joinChoice && joinChoice.canChoose,
        route[0] + ' does not allow the Left to enter the main march'
      );
    });

    [
      'poland_events_2021_2023.ind20_civic',
      'poland_events_2021_2023.ind20_join',
      'poland_events_2021_2023.ind20_consistent',
      'poland_events_2021_2023.ind20_monitor',
      'poland_events_2021_2023.ind20_ignore',
    ].forEach(function(openingChoice, index) {
      startStandard('independence-riot-route-' + index);
      engine.goToScene('poland_events_2021_2023.independence_2020');
      choose(openingChoice);
      assert(currentChoices().some(function(choice) {
        return choice.id === 'poland_events_2021_2023.ind20_riot';
      }), openingChoice + ' bypasses the 2020 riot follow-up');
    });

    startStandard('independence-riot-inquiry');
    let qualities = engine.state.qualities;
    engine.goToScene('poland_events_2021_2023.independence_2020');
    choose('poland_events_2021_2023.ind20_join');
    choose('poland_events_2021_2023.ind20_riot');
    assert.strictEqual(qualities.independence_2020_riot_done, 1);
    assert.strictEqual(currentChoices().length, 3);
    choose('poland_events_2021_2023.ind20_riot_inquiry');
    assert.strictEqual(
      qualities.independence_2020_riot_response,
      'Independent inquiry into riot and policing'
    );
    assert.strictEqual(engine.state.sceneId, 'poland_hub');

    startStandard('wartime-social-patriot-march');
    qualities = engine.state.qualities;
    const socialPatriotBefore = qualities.social_patriot_support;
    const progressiveDissentBefore = qualities.progressives_dissent;
    engine.goToScene('poland_events_2021_2023.nov22_independence');
    choose('poland_events_2021_2023.nov22_join');
    assert.strictEqual(qualities.independence_join_years, 1);
    assert.strictEqual(
      qualities.independence_march_strategy,
      'Join the Independence March'
    );
    assert(qualities.social_patriot_support > socialPatriotBefore);
    assert(qualities.progressives_dissent > progressiveDissentBefore);
    assert.strictEqual(engine.state.sceneId, 'poland_events_2021_2023.november_2022_hub');

    delete qualities.independence_join_years;
    delete qualities.independence_2020_riot_done;
    delete qualities.independence_2020_riot_response;
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.independence_join_years, 0);
    assert.strictEqual(qualities.independence_2020_riot_done, 0);
    assert.strictEqual(
      qualities.independence_2020_riot_response,
      'No riot response'
    );
  }

  function testRightTurnAndListNegotiation() {
    startStandard('hostile-ko-opens-pis-list-talks');
    let qualities = engine.state.qualities;
    Object.assign(qualities, {
      recovery_fund_strategy: 'Negotiated PiS deal',
      ko_relation: 32,
      pis_relation: 18,
    });
    engine.goToScene('poland_events_2021_2023.may_2022');
    assert.deepStrictEqual(
      currentChoices().map(function(choice) { return choice.id; }),
      [
        'poland_events_2021_2023.may22_pis_list',
        'poland_events_2021_2023.may22_pis_terms',
        'poland_events_2021_2023.may22_pis_independent',
      ]
    );
    choose('poland_events_2021_2023.may22_pis_list');
    assert.strictEqual(qualities.may22_list_strategy, 'PiS host-list talks');

    startStandard('market-left-caucus-emerges');
    qualities = engine.state.qualities;
    qualities.market_liberal_support = 8;
    const laborDissentBefore = qualities.labor_dissent;
    engine.goToScene('poland_events.shield');
    choose('poland_events.shield_enterprise');
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.market_liberal_active, 1);
    assert(qualities.left_economic_position >= 58);
    assert(qualities.labor_dissent > laborDissentBefore);

    startStandard('social-patriot-caucus-emerges');
    qualities = engine.state.qualities;
    qualities.social_patriot_support = 8;
    qualities.left_right_score = 40;
    const progressiveDissentBefore = qualities.progressives_dissent;
    engine.goToScene('poland_events.abortion');
    choose('poland_events.abortion_caution');
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.social_patriot_active, 1);
    assert(qualities.factions.includes('social_patriot'));
    assert.strictEqual(
      qualities.social_patriot_party_name,
      'Lewica Patriotyczna'
    );
    assert.strictEqual(qualities.social_patriot_launch_pending, 1);
    assert(qualities.progressives_dissent > progressiveDissentBefore);
    engine.goToScene('poland_caucus_dynamics.router');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_caucus_dynamics.social_patriot_launch'
    );
    choose('poland_caucus_dynamics.social_patriot_matysiak');
    assert.strictEqual(qualities.social_patriot_launch_pending, 0);
    assert.strictEqual(qualities.matysiak_party, 'Lewica Patriotyczna');
    assert(qualities.social_patriot_referrals > 0);
    engine.goToScene('poland_party_actions.social_patriot');
    assert(currentChoices().some(function(choice) {
      return choice.id === 'poland_party_actions.social_patriot_welfare';
    }));
    const referralsBeforeAction = qualities.social_patriot_referrals;
    choose('poland_party_actions.social_patriot_welfare');
    assert.strictEqual(
      qualities.social_patriot_referrals,
      referralsBeforeAction + 4
    );

    qualities.year = 2025;
    qualities.month = 11;
    qualities.matysiak_resolution_done = 0;
    engine.goToScene(
      'poland_events_2025.social_patriot_leadership_2025'
    );
    choose('poland_events_2025.social_patriot_leader_matysiak');
    assert.strictEqual(
      qualities.matysiak_status,
      'Leader of Lewica Patriotyczna'
    );

    qualities.resources = 5;
    qualities.social_patriot_strength = 80;
    qualities.social_patriot_local_organisation = 90;
    qualities.social_patriot_dissent = 0;
    qualities.barons_strength = 1;
    qualities.labor_strength = 1;
    qualities.progressives_strength = 1;
    engine.goToScene('poland_events_2025.leader_primary_result');
    assert.strictEqual(qualities.left_primary_winner, 'Paulina Matysiak');
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.left_party_name, 'Lewica Patriotyczna');

    startStandard('social-patriot-breakaway');
    qualities = engine.state.qualities;
    qualities.social_patriot_support = 24;
    qualities.left_right_score = 52;
    engine.goToScene('poland_normalize');
    engine.goToScene('poland_caucus_dynamics.router');
    choose('poland_caucus_dynamics.social_patriot_collective');
    qualities.social_patriot_escalation_stage = 7;
    qualities.social_patriot_dissent = 100;
    engine.goToScene('poland_caucus_dynamics.router');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_caucus_dynamics.social_patriot_split'
    );
    choose('poland_caucus_dynamics.resolve_exit');
    assert.strictEqual(qualities.social_patriot_party_formed, 1);
    assert.strictEqual(qualities.social_patriot_active, 0);
    assert(qualities.social_patriot_seats > 0);
    assert.strictEqual(qualities.barons_party_formed, 0);
    engine.goToScene('poland_polling');
    assert(Number.isFinite(qualities.social_patriot_vote_intent));
    engine.goToScene('poland_party_ai');
    assert.notStrictEqual(
      qualities.social_patriot_ai_strategy,
      'Organisation not active'
    );
    assert.strictEqual(
      qualities.social_patriot_party_name,
      'Lewica Patriotyczna'
    );
    assert.strictEqual(
      qualities.social_patriot_list_committee,
      qualities.social_patriot_vote_intent < 5
        ? 'pis'
        : 'social_patriot'
    );

    startStandard('social-patriot-name-migration');
    qualities = engine.state.qualities;
    qualities.left_party_name = 'Lewica Lewic';
    qualities.social_patriot_party_name = 'Lewica Lewic Patriotyczna';
    engine.goToScene('poland_normalize');
    assert.strictEqual(
      qualities.social_patriot_party_name,
      'Lewica Patriotyczna'
    );

    startStandard('viable-social-patriot-runs-alone');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2024,
      social_patriot_party_formed: 1,
      social_patriot_vote_intent: 5.2,
      social_patriot_poll: 5.2,
      social_patriot_list_committee: 'pis',
    });
    engine.goToScene('poland_party_ai');
    assert.strictEqual(
      qualities.social_patriot_list_committee,
      'social_patriot'
    );
    assert.strictEqual(
      qualities.social_patriot_electoral_strategy,
      'Independent party list above 5%'
    );

    startStandard('autonomous-left-coalition-list');
    qualities = engine.state.qualities;
    engine.goToScene('poland_events_2023_2024.august_lists');
    choose('poland_events_2023_2024.list_target_left_coalition');
    choose('poland_events_2023_2024.list_terms_equal');
    assert.strictEqual(qualities.sejm_list_outcome, 'left_coalition_8');
    assert.strictEqual(qualities.sejm_list_threshold, 8);
    assert(qualities.sejm_list_partner_score >= 50);
    assert(qualities.sejm_list_internal_score >= 45);

    startStandard('lewica-host-list-needs-minor-consent');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      progressives_party_formed: 1,
      progressives_active: 0,
      progressives_in_left: 0,
      pps_party_formed: 1,
      pps_active: 0,
      pps_in_left: 0,
      barons_party_formed: 1,
      barons_active: 0,
      barons_in_left: 0,
    });
    engine.goToScene('poland_events_2023_2024.august_lists');
    choose('poland_events_2023_2024.list_target_left_host');
    choose('poland_events_2023_2024.list_terms_equal');
    assert.strictEqual(qualities.progressives_list_committee, 'left');
    assert.strictEqual(qualities.sejm_list_has_partners, 1);
    assert.strictEqual(qualities.pps_list_committee, 'pps');
    assert.strictEqual(qualities.pps_joined_razem, 0);

    startStandard('razem-host-list-is-negotiated');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      razem_party_formed: 1,
      razem_active: 0,
      razem_in_left: 0,
      progressives_party_formed: 1,
      progressives_active: 0,
      progressives_in_left: 0,
      pps_party_formed: 1,
      pps_active: 0,
      pps_in_left: 0,
      barons_party_formed: 1,
      barons_active: 0,
      barons_in_left: 0,
    });
    engine.goToScene('poland_events_2023_2024.august_lists');
    choose('poland_events_2023_2024.list_target_razem_host');
    choose('poland_events_2023_2024.list_terms_equal');
    assert.strictEqual(qualities.sejm_list_outcome, 'razem_5');
    assert.strictEqual(qualities.progressives_joined_razem, 1);
    assert.strictEqual(qualities.progressives_list_committee, 'razem');
    assert.strictEqual(qualities.pps_joined_razem, 0);
    assert.strictEqual(qualities.pps_list_committee, 'pps');
    assert.strictEqual(qualities.barons_party_formed, 1);
    engine.goToScene('poland_normalize');
    assert(!qualities.razem_alliance_members.includes('PPS'));

    startStandard('social-patriot-prefers-pis-to-razem');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      razem_party_formed: 1,
      razem_active: 0,
      razem_in_left: 0,
      social_patriot_party_formed: 1,
      social_patriot_active: 0,
      social_patriot_in_left: 0,
      social_patriot_vote_intent: 4.2,
      social_patriot_poll: 4.2,
      social_patriot_exit_strength: 25,
    });
    engine.goToScene('poland_events_2023_2024.august_lists');
    choose('poland_events_2023_2024.list_target_razem_host');
    choose('poland_events_2023_2024.list_terms_equal');
    assert.strictEqual(qualities.sejm_list_outcome, 'razem_5');
    assert.strictEqual(qualities.social_patriot_joined_razem, 0);
    assert.strictEqual(qualities.social_patriot_list_committee, 'pis');
    assert.strictEqual(
      qualities.social_patriot_electoral_strategy,
      'Protected places on the PiS party list'
    );
    qualities.poll_state_month_key = -1;
    engine.goToScene('poland_polling');
    assert.strictEqual(
      qualities.pis_committee_projected_seats,
      qualities.pis_projected_seats +
        qualities.social_patriot_projected_seats
    );
    qualities.election_2023_certified = 0;
    engine.goToScene('poland_government_formation.campaign_entry');
    assert.strictEqual(
      qualities.pis_committee_seats,
      qualities.pis_seats + qualities.social_patriot_seats
    );

    startStandard('razem-host-minor-party-refuses');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      razem_party_formed: 1,
      razem_active: 0,
      razem_in_left: 0,
      progressives_party_formed: 1,
      progressives_active: 0,
      progressives_in_left: 0,
      progressives_party_relation: 0,
    });
    engine.goToScene('poland_events_2023_2024.august_lists');
    choose('poland_events_2023_2024.list_target_razem_host');
    choose('poland_events_2023_2024.list_terms_command');
    assert.strictEqual(qualities.sejm_list_outcome, 'razem_5');
    assert.strictEqual(qualities.progressives_joined_razem, 0);
    assert.strictEqual(
      qualities.progressives_list_committee,
      'young_left'
    );

    startStandard('pis-list-talks-can-fail');
    qualities = engine.state.qualities;
    engine.goToScene('poland_events_2023_2024.august_lists');
    choose('poland_events_2023_2024.list_target_pis_host');
    choose('poland_events_2023_2024.list_terms_equal');
    assert.strictEqual(qualities.sejm_list_outcome, 'left_5');
    assert.strictEqual(qualities.sejm_list_threshold, 5);
    assert(qualities.sejm_list_result.includes('rejected'));

    const sourceSeatIds = [
      'left', 'pis', 'ko', 'psl', 'konf', 'p2050', 'other',
      'sld_breakaway', 'social_patriot', 'spring_breakaway', 'labor_left',
      'young_left', 'razem', 'pps', 'tak_rozwoj', 'centrum',
      'rozwoj', 'korona', 'ko_splinter',
    ];
    const certifiedSeatIds = sourceSeatIds.map(function(id) {
      if (id === 'razem') return 'razem_party';
      if (id === 'pps') return 'pps_party';
      return id;
    });
    const outcomes = [
      {id: 'left_5', host: 'left', threshold: 5, members: ['left']},
      {
        id: 'left_coalition_8', host: 'left_coalition', threshold: 8,
        members: ['left'],
      },
      {
        id: 'razem_5', host: 'razem', threshold: 5,
        members: ['left', 'razem'],
      },
      {
        id: 'democratic_8', host: 'democratic_list', threshold: 8,
        members: ['left', 'ko', 'psl', 'p2050'],
      },
      {id: 'ko_5', host: 'ko', threshold: 5, members: ['left', 'ko']},
      {
        id: 'third_way_8', host: 'third_way', threshold: 8,
        members: ['left', 'psl', 'p2050'],
      },
      {
        id: 'third_host_5', host: 'psl', threshold: 5,
        members: ['left', 'psl'],
      },
      {id: 'pis_5', host: 'pis', threshold: 5, members: ['left', 'pis']},
    ];
    outcomes.forEach(function(outcome) {
      startStandard('list-arithmetic-' + outcome.id);
      qualities = engine.state.qualities;
      Object.assign(qualities, {
        year: 2023,
        month: 8,
        p2050_emerged: 1,
        third_way_active: 1,
        third_way_split: 0,
        sejm_list_outcome: outcome.id,
        sejm_list_host: outcome.host,
        sejm_list_threshold: outcome.threshold,
        poll_state_month_key: -1,
      });
      if (outcome.id === 'razem_5') {
        qualities.razem_party_formed = 1;
        qualities.razem_active = 0;
        qualities.razem_in_left = 0;
      }
      engine.goToScene('poland_polling');
      assert.strictEqual(
        sourceSeatIds.reduce(function(total, id) {
          return total + Number(qualities[id + '_projected_seats'] || 0);
        }, 0),
        460,
        'Projected seats were not conserved for ' + outcome.id
      );
      assert.strictEqual(
        outcome.members.reduce(function(total, id) {
          return total + Number(qualities[id + '_projected_seats'] || 0);
        }, 0),
        qualities.left_filed_committee_projected_seats,
        'Filed committee seats did not match its components for ' + outcome.id
      );
      qualities.election_2023_certified = 0;
      engine.goToScene('poland_government_formation.campaign_entry');
      assert.strictEqual(
        certifiedSeatIds.reduce(function(total, id) {
          return total + Number(qualities[id + '_seats'] || 0);
        }, 0),
        460,
        'Certified seats were not conserved for ' + outcome.id
      );
    });
  }

  function testDynamicCaucusAndSplitArithmetic() {
    const electionIds = [
      'left', 'pis', 'ko', 'psl', 'konf', 'p2050',
      'sld_breakaway', 'social_patriot', 'spring_breakaway', 'labor_left',
      'young_left', 'razem', 'pps', 'centrum', 'rozwoj', 'korona',
    ];
    const crisisScenes = [
      'barons_crisis',
      'spring_crisis',
      'labor_crisis',
      'progressives_crisis',
      'razem_crisis',
      'pps_crisis',
      'social_patriot_crisis',
      'barons_split',
      'spring_split',
      'labor_split',
      'progressives_split',
      'razem_split',
      'pps_split',
      'social_patriot_split',
    ];
    assert.strictEqual(game.scenes['poland_ending.fracture'], undefined);
    assert.strictEqual(game.scenes['poland_ending.collapse'], undefined);
    crisisScenes.forEach(function(scene) {
      assert(
        game.scenes['poland_caucus_dynamics.' + scene],
        'Missing repeatable caucus crisis: ' + scene
      );
    });

    startStandard('election-count-excludes-inactive-shells');
    let qualities = engine.state.qualities;
    qualities.election_2023_certified = 0;
    qualities.third_way_joint_list = 1;
    qualities.third_way_split = 0;
    qualities.pis_vote_intent = 35;
    qualities.ko_vote_intent = 30;
    qualities.left_vote_intent = 10;
    qualities.konf_vote_intent = 8;
    qualities.psl_vote_intent = 7;
    qualities.p2050_vote_intent = 7;
    qualities.other_vote_intent = 3;
    const inactiveElectionIds = [
      'sld_breakaway', 'social_patriot', 'spring_breakaway', 'labor_left',
      'young_left', 'razem', 'pps', 'centrum', 'rozwoj',
      'korona', 'ko_splinter',
    ];
    inactiveElectionIds.forEach(function(id) {
      qualities[id + '_vote_intent'] = 0;
      qualities[id + '_projected_seats'] = 9;
    });
    qualities.pis_projected_seats = 1;
    engine.goToScene('poland_government_formation.campaign_entry');
    inactiveElectionIds.forEach(function(id) {
      assert.strictEqual(
        qualities['election_2023_' + id + '_vote'],
        0,
        'An inactive committee received an election-day shock: ' + id
      );
    });
    const certifiedSeatIds = [
      'pis', 'ko', 'left', 'psl', 'p2050', 'konf', 'other',
      'sld_breakaway', 'social_patriot', 'spring_breakaway', 'labor_left',
      'young_left', 'razem_party', 'pps_party', 'centrum',
      'rozwoj', 'korona', 'ko_splinter',
    ];
    assert.strictEqual(
      certifiedSeatIds.reduce(function(total, id) {
        return total + Number(qualities[id + '_seats'] || 0);
      }, 0),
      460,
      'The certified 2023 count did not conserve every Sejm seat'
    );
    assert.notStrictEqual(
      qualities.pis_seats,
      1,
      'The certified result copied the polling seat projection'
    );
    const firstCertifiedSeats = certifiedSeatIds.map(function(id) {
      return qualities[id + '_seats'];
    });
    engine.goToScene('poland_government_formation.campaign_entry');
    assert.deepStrictEqual(
      certifiedSeatIds.map(function(id) {
        return qualities[id + '_seats'];
      }),
      firstCertifiedSeats,
      'Re-entering formation rerolled a certified election result'
    );

    startStandard('cooperative-razem-deescalates');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      razem_cooperation: 80,
      razem_dissent: 10,
      razem_escalation_stage: 6,
      razem_grievance_memory: 100,
      party_unity: 5,
      poll_danger_months: 2,
      time: 20,
      month_actions: 1,
    });
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.razem_breakaway_protected, 1);
    engine.goToScene('poland_advance');
    assert.strictEqual(
      qualities.razem_escalation_stage,
      5,
      'High cooperation did not unwind Razem breakaway escalation'
    );
    assert.notStrictEqual(
      engine.state.sceneId,
      'poland_caucus_dynamics.razem_split'
    );

    startStandard('party-leading-razem-cannot-split');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      razem_merged: 1,
      merger_leader: 'Razem',
      razem_cooperation: 10,
      razem_dissent: 100,
      razem_escalation_stage: 7,
      razem_grievance_memory: 100,
      party_unity: 5,
      poll_danger_months: 2,
      time: 20,
      month_actions: 1,
    });
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.razem_breakaway_protected, 1);
    assert.strictEqual(qualities.caucus_split_pending, 0);
    assert.strictEqual(qualities.caucus_crisis_pending, 0);
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.razem_escalation_stage, 6);
    assert.notStrictEqual(
      engine.state.sceneId,
      'poland_caucus_dynamics.razem_split'
    );

    startStandard('dynamic-caucus-arithmetic');
    qualities = engine.state.qualities;
    assert(qualities.factions.includes('pps'));
    assert(qualities.pps_strength > 0 && qualities.pps_strength < 5);

    [
      'poland_events_2021_2023.dec21_accept',
      'poland_events_2021_2023.dec21_punish',
    ].forEach(function(ppsChoice, index) {
      startStandard('pps-split-ledger-' + index);
      const ppsQualities = engine.state.qualities;
      ppsQualities.pps_dissent = 100;
      ppsQualities.merger_resolution = 'Leadership pact';
      const leftFamilyBefore =
        ppsQualities.left_seats + ppsQualities.pps_party_seats;
      engine.goToScene('poland_events_2021_2023.dec21_pps');
      choose(ppsChoice);
      assert.strictEqual(ppsQualities.left_pps_seats, 0);
      assert.strictEqual(ppsQualities.pps_party_seats, 3);
      assert.strictEqual(
        ppsQualities.left_seats + ppsQualities.pps_party_seats,
        leftFamilyBefore,
        'The PPS split created or destroyed Sejm seats'
      );
      assert.strictEqual(
        ppsQualities.left_barons_seats + ppsQualities.left_spring_seats +
          ppsQualities.left_labor_seats +
          ppsQualities.left_progressives_seats +
          ppsQualities.razem_seats + ppsQualities.left_pps_seats,
        ppsQualities.left_seats,
        'The PPS split left a phantom internal caucus seat'
      );
    });

    [
      'poland_events_2021_2023.feb23_autonomy',
      'poland_events_2021_2023.feb23_lead',
      'poland_events_2021_2023.feb23_social',
    ].forEach(function(reunionChoice, index) {
      startStandard('pps-reunion-ledger-' + index);
      const ppsQualities = engine.state.qualities;
      ppsQualities.pps_dissent = 100;
      ppsQualities.merger_resolution = 'Leadership pact';
      const leftBefore = ppsQualities.left_seats;
      const senateLeftBefore = ppsQualities.senate_left_seats;
      const senateIndependentBefore =
        ppsQualities.senate_independent_seats;
      engine.goToScene('poland_events_2021_2023.dec21_pps');
      choose('poland_events_2021_2023.dec21_accept');
      engine.goToScene('poland_events_2021_2023.feb23_left');
      choose(reunionChoice);
      assert.strictEqual(ppsQualities.left_seats, leftBefore);
      assert.strictEqual(ppsQualities.left_pps_seats, 3);
      assert.strictEqual(ppsQualities.pps_party_seats, 0);
      assert.strictEqual(
        ppsQualities.left_barons_seats + ppsQualities.left_spring_seats +
          ppsQualities.left_labor_seats +
          ppsQualities.left_progressives_seats +
          ppsQualities.razem_seats + ppsQualities.left_pps_seats,
        ppsQualities.left_seats,
        'The PPS reunion did not restore its MPs to the internal caucus ledger'
      );
      assert.strictEqual(ppsQualities.senate_left_seats, senateLeftBefore);
      assert.strictEqual(
        ppsQualities.senate_independent_seats,
        senateIndependentBefore
      );
      assert.strictEqual(ppsQualities.pps_senate_seats, 0);
    });

    startStandard('dynamic-caucus-arithmetic-after-pps');
    qualities = engine.state.qualities;

    const springBefore = qualities.spring_strength;
    const successorBefore =
      qualities.labor_strength + qualities.progressives_strength;
    engine.goToScene('poland_events_2021_2023.oct21_congress');
    choose('poland_events_2021_2023.oct21_dual');
    assert.strictEqual(qualities.spring_active, 0);
    assert.strictEqual(qualities.spring_strength, 0);
    assert.strictEqual(qualities.spring_merged, 1);
    assert(!qualities.factions.includes('spring'));
    assert(
      Math.abs(
        qualities.labor_strength + qualities.progressives_strength -
          successorBefore - springBefore
      ) < 0.000001,
      'The Wiosna merger did not transfer its full live strength'
    );

    qualities.razem_seats = 9;
    qualities.left_seats = 49;
    qualities.seat_subvention_seats = 49;
    qualities.razem_dissent = 82;
    qualities.time = 20;
    qualities.razem_last_crisis_time = -99;
    qualities.razem_escalation_stage = 2;
    qualities.razem_demand_answered = 0;
    qualities.razem_demand_deadline = 22;
    engine.goToScene('poland_normalize');
    assert.strictEqual(
      qualities.caucus_crisis_pending,
      0,
      'A faction ultimatum ignored its stated response deadline'
    );
    qualities.time = 22;
    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(
      qualities.razem_escalation_stage,
      2,
      'Monthly advance skipped an unanswered faction ultimatum at its deadline'
    );
    qualities.time = 22;
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.caucus_crisis_pending, 1);
    engine.goToScene('poland_caucus_dynamics.razem_crisis');
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      [
        'poland_caucus_dynamics.razem_compromise',
        'poland_caucus_dynamics.razem_leave',
        'poland_caucus_dynamics.razem_punish',
      ]
    );
    choose('poland_caucus_dynamics.razem_punish');
    assert.strictEqual(qualities.razem_active, 1);
    assert.strictEqual(qualities.razem_party_formed, 0);
    assert.strictEqual(qualities.razem_escalation_stage, 3);
    assert(qualities.factions.includes('razem'));

    // Sustained pressure walks the remaining rungs one month at a time.
    // Stage five moves only MPs willing to defect individually; the circle
    // and party come later.
    qualities.party_unity = 5;
    qualities.razem_dissent = 100;
    qualities.razem_grievance_memory = 100;
    qualities.poll_danger_months = 2;
    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.razem_escalation_stage, 4);
    assert(qualities.razem_failed_whips >= 1);
    assert.strictEqual(qualities.zandberg_advisor, 0);

    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.razem_escalation_stage, 5);
    assert(qualities.razem_individual_defections > 0);
    assert(qualities.razem_individual_defections < 9);
    const individualDefections = qualities.razem_individual_defections;
    assert.strictEqual(qualities.left_seats, 49 - individualDefections);
    assert.strictEqual(
      qualities.razem_party_seats,
      individualDefections,
      'Individually defecting MPs disappeared before forming a circle'
    );

    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    assert.strictEqual(qualities.razem_escalation_stage, 6);
    assert.strictEqual(qualities.razem_circle_formed, 1);
    assert.strictEqual(qualities.razem_party_seats, individualDefections);

    qualities.month_actions = 1;
    engine.goToScene('poland_advance');
    const caucusRouteMatches = game.scenes[
      'poland_caucus_dynamics.router'
    ].goTo.filter(function(route) {
      return !route.predicate || route.predicate(engine, qualities);
    }).map(function(route) {
      return route.id;
    });
    assert.strictEqual(
      engine.state.sceneId,
      'poland_caucus_dynamics.razem_split',
      JSON.stringify({
        stage: qualities.razem_escalation_stage,
        last: qualities.razem_last_escalation_time,
        time: qualities.time,
        dissent: qualities.razem_dissent,
        grievance: qualities.razem_grievance_memory,
        unity: qualities.party_unity,
        active: qualities.razem_active,
        formed: qualities.razem_party_formed,
        splitVisits:
          engine.state.visits['poland_caucus_dynamics.razem_split'] || 0,
        ppsStage: qualities.pps_escalation_stage,
        matches: caucusRouteMatches,
      })
    );
    choose('poland_caucus_dynamics.resolve_exit');
    assert.strictEqual(qualities.razem_active, 0);
    assert.strictEqual(qualities.razem_party_formed, 1);
    assert.strictEqual(qualities.razem_in_left_club, 0);
    assert(!qualities.factions.includes('razem'));
    assert(qualities.razem_mp_departed > individualDefections);
    assert(qualities.razem_mp_departed < 9);
    assert(qualities.razem_mp_retained > 0);
    assert.strictEqual(
      qualities.left_seats,
      49 - qualities.razem_mp_departed
    );
    assert.strictEqual(
      qualities.razem_party_seats,
      qualities.razem_mp_departed
    );
    assert.strictEqual(qualities.seat_subvention_seats, qualities.left_seats);
    // The split happened after this month's poll. Exercise the next refresh,
    // when the competing list receives its first independent polling estimate.
    qualities.poll_state_month_key = -1;
    engine.goToScene('poland_polling');
    assert(qualities.razem_vote_intent > 0);
    assert.strictEqual(qualities.left_lists_contesting, 2);
    assert.strictEqual(
      qualities.left_lists_above_threshold +
        (qualities.left_threshold_wasted_vote > 0 ? 1 : 0) > 0,
      true
    );
    assert.strictEqual(
      electionIds.reduce(function(total, party) {
        return total + qualities[party + '_projected_seats'];
      }, 0),
      460,
      'A Left breakaway disappeared from the projected Sejm'
    );
    assert(qualities.campaign_capacity_loss > 0);
    assert(qualities.contradictory_media_appearances > 0);
    assert(qualities.dues_withheld > 0);

    startStandard('cabinet-faction-exit-shrinks-delegation');
    qualities = engine.state.qualities;
    qualities.left_in_government = 1;
    qualities.left_cabinet_model = 'Whole Left coalition delegation';
    qualities.ministry_left_cabinet_seats = 49;
    qualities.caucus_exit_target = 'labor';
    qualities.caucus_exit_mode = 'escalated';
    const cabinetSeatsBeforeExit = qualities.ministry_left_cabinet_seats;
    engine.goToScene('poland_caucus_dynamics.resolve_exit');
    assert(qualities.labor_mp_departed > 0);
    assert.strictEqual(
      qualities.ministry_left_cabinet_seats,
      cabinetSeatsBeforeExit - qualities.labor_mp_departed,
      'A departing cabinet faction left phantom ministers behind'
    );

    startStandard('external-razem-exit-preserves-cabinet-delegation');
    qualities = engine.state.qualities;
    qualities.left_in_government = 1;
    qualities.left_cabinet_model =
      'New Left ministers · Razem external support';
    qualities.razem_in_government = 0;
    qualities.ministry_left_cabinet_seats = 39;
    qualities.caucus_exit_target = 'razem';
    qualities.caucus_exit_mode = 'escalated';
    engine.goToScene('poland_caucus_dynamics.resolve_exit');
    assert(qualities.razem_mp_departed > 0);
    assert.strictEqual(
      qualities.ministry_left_cabinet_seats,
      39,
      'External Razem MPs were subtracted from the New Left cabinet caucus'
    );

    startStandard('low-unity-and-subthreshold-continuation');
    qualities = engine.state.qualities;
    qualities.party_unity = 4;
    qualities.poll_danger_months = 3;
    qualities.left_vote_intent = 3.8;
    qualities.poll_state_month_key = qualities.year * 100 + qualities.month;
    engine.goToScene('poland_polling');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(qualities.prototype_complete, 0);
    assert.strictEqual(qualities.party_unity, 4);
    assert.strictEqual(qualities.poll_danger_months, 3);

    startStandard('dynamic-rival-split-arithmetic');
    qualities = engine.state.qualities;
    qualities.year = 2026;
    qualities.month = 2;
    qualities.p2050_emerged = 1;
    qualities.p2050_seats = 33;
    qualities.centrum_seats = 0;
    engine.goToScene('poland_events_2026.p2050_split_2026');
    assert.strictEqual(qualities.p2050_split, 1);
    assert(qualities.p2050_split_defectors_2026 > 0);
    assert(qualities.p2050_split_defectors_2026 <= 15);
    assert([
      'Katarzyna Pełczyńska-Nałęcz',
      'Paulina Hennig-Kloska',
    ].includes(qualities.centrum_leader));
    choose('poland_events_2026.center_split_accept');
    assert.strictEqual(
      qualities.p2050_seats + qualities.centrum_seats,
      33
    );
    qualities.unia_centrum_formed = 1;
    qualities.pis_split = 1;
    qualities.rozwoj_party_formed = 1;
    qualities.pis_morawiecki_camp = 38;
    qualities.far_right_split = 1;
    engine.goToScene('poland_polling');
    assert(qualities.centrum_vote_intent > 0);
    assert(qualities.rozwoj_vote_intent > 0);
    assert(qualities.korona_vote_intent > 0);
    assert.strictEqual(
      electionIds.reduce(function(total, party) {
        return total + qualities[party + '_projected_seats'];
      }, 0),
      460,
      'A rival-party split disappeared from the projected Sejm'
    );
    qualities.centrum_org_resources = 4;
    qualities.rozwoj_org_resources = 4;
    qualities.korona_org_resources = 4;
    engine.goToScene('poland_party_ai');
    ['centrum', 'rozwoj', 'korona'].forEach(function(party) {
      assert(Number.isFinite(qualities[party + '_org_resources']));
      assert(
        Number.isFinite(qualities[party + '_organisation']),
        party + ' did not receive persistent organisation'
      );
      assert(
        Number.isFinite(qualities[party + '_parent_relation']),
        party + ' did not receive a parent relationship'
      );
      assert.notStrictEqual(
        qualities[party + '_ai_strategy'],
        'Organisation not active',
        party + ' remained an inert seat container after its split'
      );
      assert(
        qualities[party + '_electoral_strategy'].includes('five'),
        party + ' did not receive a threshold strategy'
      );
    });
    assert(
      ['centrum', 'rozwoj', 'korona'].some(function(party) {
        return qualities[party + '_ai_acted'] === 1;
      }),
      'No active successor party took an autonomous monthly action'
    );

    startStandard('successor-background-building-has-effects');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2026,
      unia_centrum_formed: 1,
      centrum_seats: 7,
      centrum_org_resources: 0,
      centrum_org_income: 1,
      centrum_organisation: 10,
      centrum_poll_momentum: 0,
    });
    engine.goToScene('poland_party_ai');
    assert.strictEqual(qualities.centrum_ai_acted, 0);
    assert(qualities.centrum_org_resources > 0);
    assert(qualities.centrum_org_income > 1);
    assert(qualities.centrum_organisation > 10);
    assert(qualities.centrum_poll_momentum > 0);
    assert(qualities.rival_month_headline.includes('local branches'));

    startStandard('successor-razem-list-arithmetic');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2024,
      razem_party_formed: 1,
      spring_party_formed: 1,
      pps_party_formed: 1,
      barons_party_formed: 1,
      razem_component_vote_intent: 3.1,
      spring_breakaway_component_vote_intent: 2.2,
      razem_cooperation: 60,
      spring_breakaway_razem_relation: 60,
      spring_breakaway_org_resources: 0,
      razem_org_resources: 0,
      pps_org_resources: 0,
      sld_breakaway_org_resources: 0,
    });
    engine.goToScene('poland_party_ai');
    assert.strictEqual(qualities.spring_list_committee, 'razem');
    assert.strictEqual(qualities.spring_joined_razem, 1);
    assert.strictEqual(
      qualities.spring_breakaway_electoral_strategy,
      'Join a viable independent Razem list'
    );
    assert.strictEqual(qualities.pps_list_committee, 'pps');
    assert.strictEqual(qualities.pps_joined_razem, 0);
    assert.strictEqual(
      qualities.sld_breakaway_electoral_strategy,
      'Remain a separate party and contest independently'
    );

    startStandard('successor-filed-list-is-locked');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2023,
      sejm_list_negotiation_done: 1,
      razem_party_formed: 1,
      spring_party_formed: 1,
      razem_component_vote_intent: 3.1,
      spring_breakaway_component_vote_intent: 2.2,
      razem_cooperation: 60,
      spring_breakaway_razem_relation: 60,
      spring_list_committee: 'left',
      spring_breakaway_org_resources: 0,
      razem_org_resources: 0,
    });
    engine.goToScene('poland_party_ai');
    assert.strictEqual(qualities.spring_list_committee, 'left');

    startStandard('tak-rozwoj-counts-as-left-successor');
    qualities = engine.state.qualities;
    qualities.tak_dla_rozwoju_party_formed = 1;
    qualities.tak_rozwoj_seats = 3;
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.left_splinter_seats, 3);
    assert.strictEqual(qualities.left_family_seats, qualities.left_seats + 3);

    [
      'poland_events_2026.center_split_accept',
      'poland_events_2026.center_split_broker',
      'poland_events_2026.center_split_ministries',
    ].forEach(function(response, index) {
      startStandard('autonomous-p2050-split-' + index);
      const splitQualities = engine.state.qualities;
      splitQualities.year = 2026;
      splitQualities.month = 2;
      splitQualities.p2050_emerged = 1;
      splitQualities.p2050_seats = 33;
      splitQualities.centrum_seats = 0;
      splitQualities.p2050_relation = 50;
      splitQualities.p2050_coalition_dissent = 70;
      splitQualities.resources = 5;
      splitQualities.left_in_government = 1;
      splitQualities.government_has_confidence = 1;
      splitQualities.caretaker_government = 0;
      engine.goToScene('poland_events_2026.p2050_split_2026');
      assert.strictEqual(splitQualities.p2050_split, 1);
      assert.strictEqual(
        splitQualities.p2050_seats + splitQualities.centrum_seats,
        33
      );
      choose(response);
      assert.strictEqual(splitQualities.p2050_split, 1);
      assert.strictEqual(
        splitQualities.p2050_seats + splitQualities.centrum_seats,
        33,
        'Lewica response created or destroyed centrist seats'
      );
      if (response === 'poland_events_2026.center_split_broker') {
        engine.goToScene(
          'poland_events_2026.centrum_club_settlement_2026'
        );
        assert.strictEqual(splitQualities.unia_centrum_formed, 0);
        choose('poland_events_2026.centrum_reunite');
        assert.strictEqual(splitQualities.p2050_split, 0);
        assert.strictEqual(splitQualities.p2050_split_occurred, 1);
      } else {
        engine.goToScene('poland_events_2026.unia_centrum_2026');
        assert.strictEqual(splitQualities.unia_centrum_formed, 1);
      }
    });

    startStandard('opposition-centrum-does-not-remove-pis-votes');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2026,
      month: 2,
      government_party: 'pis',
      government_has_confidence: 1,
      caretaker_government: 0,
      left_in_government: 0,
      ministry_p2050_in_cabinet: 0,
      p2050_emerged: 1,
      p2050_seats: 33,
      centrum_seats: 0,
      p2050_relation: 20,
      p2050_coalition_dissent: 70,
      pis_seats: 194,
      government_support_seats: 194,
      coalition_seats: 194,
    });
    engine.goToScene('poland_events_2026.p2050_split_2026');
    assert.strictEqual(qualities.centrum_supports_government, 0);
    choose('poland_events_2026.center_split_accept');
    qualities.centrum_party_readiness = 10;
    engine.goToScene('poland_events_2026.unia_centrum_2026');
    choose('poland_events_2026.centrum_ignore');
    assert.strictEqual(qualities.government_support_seats, 194);
    assert.strictEqual(qualities.coalition_seats, 194);

    startStandard('governing-left-p2050-opposition-split');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2026,
      month: 2,
      government_party: 'lewica',
      left_in_government: 1,
      government_has_confidence: 1,
      caretaker_government: 0,
      ministry_p2050_in_cabinet: 0,
      p2050_emerged: 1,
      p2050_seats: 33,
      centrum_seats: 0,
      p2050_relation: 20,
      p2050_coalition_dissent: 70,
      government_coalition_dissent: 10,
      government_support_seats: 0,
    });
    engine.goToScene('poland_events_2026.p2050_split_2026');
    const oppositionCentrumSeats = qualities.centrum_seats;
    assert.strictEqual(qualities.centrum_supports_government, 0);
    choose('poland_events_2026.center_split_accept');
    assert.strictEqual(
      qualities.government_coalition_dissent,
      10,
      'An opposition caucus split created cabinet dissent'
    );

    startStandard('centrum-new-outside-support-is-counted');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2026,
      month: 2,
      government_party: 'lewica',
      left_in_government: 1,
      government_has_confidence: 1,
      caretaker_government: 0,
      ministry_p2050_in_cabinet: 0,
      p2050_emerged: 1,
      p2050_seats: 33,
      centrum_seats: 0,
      p2050_relation: 20,
      p2050_coalition_dissent: 70,
      government_support_seats: 0,
    });
    engine.goToScene('poland_events_2026.p2050_split_2026');
    assert.strictEqual(qualities.centrum_seats, oppositionCentrumSeats);
    choose('poland_events_2026.center_split_ministries');
    assert.strictEqual(qualities.centrum_supports_government, 1);
    assert.strictEqual(
      qualities.government_support_seats,
      qualities.centrum_seats,
      'New Centrum outside support was absent from the support ledger'
    );

    startStandard('third-way-autonomous-survival');
    qualities = engine.state.qualities;
    qualities.third_way_cohesion = 100;
    qualities.p2050_coalition_dissent = 0;
    qualities.psl_coalition_dissent = 0;
    qualities.p2050_relation = 100;
    qualities.psl_relation = 100;
    qualities.government_has_confidence = 1;
    engine.goToScene('poland_events_2025.third_way_ends');
    assert.strictEqual(qualities.third_way_split, 0);
    choose('poland_events_2025.td_renew');
    assert.strictEqual(qualities.third_way_split, 0);

    qualities.resources = 5;
    const cohesionBeforeNightAudit = qualities.third_way_cohesion;
    engine.goToScene(
      'poland_events_2025.third_way_night_meeting_2025'
    );
    assert(currentChoices().some(function(choice) {
      return choice.id === 'poland_events_2025.night_joint_audit';
    }));
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_events_2025.night_minutes';
    }));
    choose('poland_events_2025.night_joint_audit');
    assert.strictEqual(
      qualities.third_way_cohesion,
      Math.min(100, cohesionBeforeNightAudit + 8)
    );
    Object.assign(qualities, {
      third_way_cohesion: 100,
      p2050_coalition_dissent: 0,
      psl_coalition_dissent: 0,
      rival_relation_psl_p2050: 100,
      p2050_leadership_margin: 20,
      p2050_leader: 'Katarzyna Pełczyńska-Nałęcz',
      psl_vote_intent: 4,
      p2050_vote_intent: 3,
    });
    engine.goToScene('poland_events_2026.third_way_future_2026');
    assert.strictEqual(qualities.third_way_split, 0);
    choose('poland_events_2026.td2026_joint_platform');
    assert.strictEqual(qualities.third_way_active, 1);

    startStandard('third-way-late-gameplay-split');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      third_way_active: 1,
      third_way_split: 0,
      third_way_response: 'Separate channels under a loose electoral pact',
      third_way_cohesion: 0,
      p2050_coalition_dissent: 100,
      psl_coalition_dissent: 100,
      rival_relation_psl_p2050: 0,
      p2050_leadership_margin: 0,
      p2050_leader: 'Paulina Hennig-Kloska',
      psl_vote_intent: 6,
      p2050_vote_intent: 6,
    });
    engine.goToScene('poland_events_2026.third_way_future_2026');
    assert.strictEqual(qualities.third_way_split, 1);
    assert.strictEqual(qualities.third_way_active, 0);
    choose('poland_events_2026.td2026_bilateral');

    startStandard('third-way-autonomous-split');
    qualities = engine.state.qualities;
    qualities.third_way_cohesion = 0;
    qualities.p2050_coalition_dissent = 100;
    qualities.psl_coalition_dissent = 100;
    qualities.p2050_relation = 0;
    qualities.psl_relation = 0;
    qualities.government_has_confidence = 0;
    engine.goToScene('poland_events_2025.third_way_ends');
    assert.strictEqual(qualities.third_way_split, 1);
    choose('poland_events_2025.td_bilateral');
    assert.strictEqual(qualities.third_way_split, 1);
    qualities.resources = 5;
    engine.goToScene(
      'poland_events_2025.third_way_night_meeting_2025'
    );
    assert(currentChoices().some(function(choice) {
      return choice.id === 'poland_events_2025.night_minutes';
    }));
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_events_2025.night_joint_audit';
    }));
    choose('poland_events_2025.night_minutes');
    assert.strictEqual(
      qualities.third_way_night_meeting_response,
      'Private minutes and arithmetic investigation'
    );

    startStandard('left-versus-ko-presidential-runoff');
    qualities = engine.state.qualities;
    qualities.pres_2025_finalist_a_key = 'ko';
    qualities.pres_2025_finalist_b_key = 'left';
    qualities.pres_2025_player_finalist = 1;
    qualities.pres_2025_left_candidate = 'Magdalena Biejat';
    qualities.pres_2025_ko_candidate = 'Rafał Trzaskowski';
    qualities.pres_2025_transfer_strength = 1.2;
    engine.goToScene('poland_events_2025.presidential_runoff_2025');
    assert.strictEqual(qualities.pres_2025_runoff_a_key, 'ko');
    assert.strictEqual(qualities.pres_2025_runoff_b_key, 'left');

    startStandard('ko-versus-razem-presidential-runoff');
    qualities = engine.state.qualities;
    qualities.resources = 5;
    qualities.pres_2025_finalist_a_key = 'ko';
    qualities.pres_2025_finalist_b_key = 'razem';
    qualities.pres_2025_player_finalist = 0;
    qualities.pres_2025_razem_finalist = 1;
    qualities.pres_2025_runoff_support_target = 'razem';
    qualities.pres_2025_razem_candidate = 'Adrian Zandberg';
    qualities.pres_2025_ko_candidate = 'Rafał Trzaskowski';
    engine.goToScene('poland_events_2025.runoff_broker');
    const runoffChoices = currentChoices().map(function(choice) {
      return choice.id;
    });
    assert(runoffChoices.includes(
      'poland_events_2025.runoff_razem_accord'
    ));
    assert(!runoffChoices.includes('poland_events_2025.runoff_accord'));
    choose('poland_events_2025.runoff_razem_accord');
    engine.goToScene('poland_events_2025.presidential_runoff_2025');
    assert.strictEqual(qualities.pres_2025_runoff_a_key, 'ko');
    assert.strictEqual(qualities.pres_2025_runoff_b_key, 'razem');
  }

  try {
    if (process.env.DSS_TIMELINE_CONTINUITY_SMOKE === '1') {
      testTimelineOfficeContinuity();
      return {
        ending: 'Timeline office-continuity fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_2027_SMOKE === '1') {
      test2027ElectionHorizon();
      return {
        ending: '2027 election-horizon fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_OATH_SMOKE === '1') {
      testPresidentialElectionCorpora();
      testPresidential2025PollingConversion();
      testTrzaskowskiBlockedPresidency();
      return {
        ending: 'Presidential oath-crisis fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_PRES_2025_SMOKE === '1') {
      testPresidential2025PollingConversion();
      testPresidential2025Experience();
      return {
        ending: '2025 presidential campaign fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_MAJOR_REFORM_SMOKE === '1') {
      testContextualDecks();
      testMajorReformProjects();
      testZeroResourceCardFallbacks();
      testNegotiationAndCohabitation();
      return {
        ending: 'Major-reform and negotiation fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_EVENT_UI_SMOKE === '1') {
      testPresidentialElectionCorpora();
      testTrzaskowskiWarOfPowers();
      testTrzaskowskiBlockedPresidency();
      testMandatoryDatedEventQueue();
      return {
        ending: 'Event presentation and queue fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_IDENTITY_SMOKE === '1') {
      testDynamicLeftIdentity();
      return {
        ending: 'Dynamic Left identity fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_BURDEN_SMOKE === '1') {
      testGovernmentBurden();
      return {
        ending: 'Government burden fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_BRAUN_SMOKE === '1') {
      testBraunLegalChain();
      return {
        ending: 'Braun legal-chain fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_TRZ_VONC_SMOKE === '1') {
      testTrzaskowskiPorozumienieConfidenceVote();
      return {
        ending: 'Trzaskowski constructive-vote fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_CRISIS_SMOKE === '1') {
      testGovernmentCrisisConsequences();
      testEconomicAccountability();
      testPersistentRivalOrganisations();
      return {
        ending: 'Governing crisis, economy and fracture fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_ECONOMY_SMOKE === '1') {
      testPollingGovernmentOwnership();
      testEconomicAccountability();
      return {
        ending: 'Economic accountability fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_RESOURCE_SMOKE === '1') {
      testResourceCadence();
      return {
        ending: 'Semiannual resource fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_PHASE7_SMOKE === '1') {
      testPersistentRivalOrganisations();
      testTrzaskowskiPorozumienieConfidenceVote();
      testLateAuthorityBoundaries();
      return {
        ending: 'Persistent rival organisation fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_FOREIGN_SMOKE === '1') {
      testForeignAuthorityMatrix();
      testForeignAffairsAndUSElections();
      return {
        ending: 'Foreign authority fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_LEADERSHIP_SMOKE === '1') {
      testLeadershipDramaEvents();
      return {
        ending: 'Leadership drama fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_LEFT_ORG_SMOKE === '1') {
      testRazemLedMerger();
      testMergerRevoltGates();
      testOctoberMergerCongress();
      testAdvisorRepresentationDrift();
      return {
        ending: 'Left organisation fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_FACTION_SMOKE === '1') {
      testDynamicCaucusAndSplitArithmetic();
      return {
        ending: 'Faction escalation fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_MARCH_SMOKE === '1') {
      testIndependenceMarchChain();
      return {
        ending: 'Independence March fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_LIST_SMOKE === '1') {
      testRightTurnAndListNegotiation();
      return {
        ending: 'Right-turn and list-negotiation fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_SENATE_SMOKE === '1') {
      testSenateDocketCard();
      testSenateBudgetStages();
      testSenateElectionAndGovernmentCorrections();
      testPersistentParliamentSeatChart();
      return {
        ending: 'Senate election and budget fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: engine.state.qualities.budget_2019_backing,
        budget2020: engine.state.qualities.budget_backing,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_DOSSIER_SMOKE === '1') {
      testLiveDossier();
      return {
        ending: 'Live dossier fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_BUDGET_SMOKE === '1') {
      testBudgetOppositionAndConstitutionalRoutes();
      testLateAuthorityBoundaries();
      return {
        ending: 'Opposition budget fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: engine.state.qualities.budget_2019_backing,
        budget2020: engine.state.qualities.budget_backing,
        cardsPlayed: 0,
      };
    }
    testMonthlyCardDiscard();
    testOpportunityCardGating();
    testGovernmentBurden();
    testResourceCadence();
    testFundraisingEconomy();
    testPublicOpinionSystem();
    testDatedCashOptions();
    testStagedPrimaryCorpus();
    testSenateDocketCard();
    testSenateBudgetStages();
    testPresidentialElectionCorpora();
    testPresidential2025PollingConversion();
    testPresidentialDebateMinigame();
    testTrzaskowskiWarOfPowers();
    testTrzaskowskiBlockedPresidency();
    testHistoricalFormationRoute();
    testRazemCoalitionProtocol();
    testDissentEffectiveness();
    testTrzaskowskiJudiciaryEventGates();
    testOppositionMinistryAllocation();
    testExpandedMinistryAllocation();
    testCabinetReshuffle();
    testArticle155MinistryAllocation();
    testDynamicGovernmentPartyColors();
    testDynamicLeftIdentity();
    testJuly2023CampaignContinuation();
    testPollingModelInvariants();
    testNationwideOpeningCalibration();
    testPollingGovernmentOwnership();
    testEconomicAccountability();
    testRivalPartyAI();
    testForeignAuthorityMatrix();
    testForeignAffairsAndUSElections();
    testContextualDecks();
    testMajorReformProjects();
    testZeroResourceCardFallbacks();
    testNegotiationAndCohabitation();
    testBudgetOppositionAndConstitutionalRoutes();
    testLateAuthorityBoundaries();
    testTimelineOfficeContinuity();
    testCommittedSeatsAndOfficeCompatibility();
    testLeadershipDramaEvents();
    testPersistentRivalOrganisations();
    testTrzaskowskiPorozumienieConfidenceVote();
    testPiSNewLeftCoalitionEntry();
    testBraunLegalChain();
    testMandatoryDatedEventQueue();
    testIndependenceMarchChain();
    testRightTurnAndListNegotiation();
    testDynamicCaucusAndSplitArithmetic();
    testLiveDossier();
    testRazemLedMerger();
    testMergerRevoltGates();
    testOctoberMergerCongress();
    testAdvisorRepresentationDrift();
    decksUsed.clear();
    cardsPlayed.length = 0;
    startStandard('polish-red-autumn-native-preflight');
    testPinnedSystemsAndPersistence();

    for (let turn = 0; turn < expectedEvents.length; turn += 1) {
      assertHandHub();
      const deckId = deckIds[0];
      const card = drawFromDeck(deckId);
      playAgendaCard(card);
      resolveInterveningCaucusCrises();

      const routedSceneId = engine.state.sceneId;
      const expectedSceneId = expectedEvents[turn];
      const sharedBudgetRoute =
        [
          'poland_opposition_budget.audit',
          'poland_opposition_budget.read_draft',
        ].includes(routedSceneId) &&
        [
          'poland_events.budget_2019',
          'poland_events.budget_2020',
          'poland_events_2021_2023.december_2022',
        ].includes(expectedSceneId);
      eventsSeen.push(sharedBudgetRoute ? expectedSceneId : routedSceneId);
      resolveEvent(sharedBudgetRoute ? expectedSceneId : routedSceneId);
    }
  } finally {
    console.log = originalLog;
    Math.random = originalRandom;
  }

  const expectedCampaignEvents = expectedEvents.slice();
  if (engine.state.qualities.trzaskowski_won) {
    expectedCampaignEvents[9] = 'poland_trzaskowski.certification';
    expectedCampaignEvents[11] = 'poland_trzaskowski.tribunal_showdown';
    expectedCampaignEvents[15] = 'poland_trzaskowski.judicial_war';
    expectedCampaignEvents[17] = 'poland_trzaskowski.palace_offensive';
    expectedCampaignEvents[19] = 'poland_trzaskowski.rights_vote';
  }
  assert.deepStrictEqual(eventsSeen, expectedCampaignEvents);
  assert.deepStrictEqual(Array.from(decksUsed).sort(), deckIds.slice().sort());
  assert.strictEqual(cardsPlayed.length, expectedEvents.length);
  assert.strictEqual(engine.state.qualities.prototype_complete, 0);
  assert.strictEqual(
    engine.state.qualities.p2050_foundation_2020_done,
    1,
    'The August 2020 presidential route skipped Poland 2050 formation'
  );
  assert.strictEqual(engine.state.sceneId, 'poland_hub');
  assert.strictEqual(engine.state.qualities.leadership_actions_taken, 45);
  assert.strictEqual(engine.state.qualities.neglected_months, 0);
  [
    'independence_march_2019_done',
    'independence_march_2020_done',
    'independence_march_2021_done',
    'independence_march_2022_done',
  ].forEach(function(flag) {
    assert.strictEqual(
      engine.state.qualities[flag],
      1,
      'Annual Independence Day route was skipped: ' + flag
    );
  });
  assert.strictEqual(engine.state.qualities.last_independence_march_year, 2022);
  assert.strictEqual(
    engine.state.qualities.ko_leader,
    'Donald Tusk',
    'The continuous campaign did not update KO leadership in July 2021'
  );
  assert.strictEqual(
    engineLogs.length,
    0,
    'Engine errors: ' + engineLogs.join('\n')
  );

  const unexpectedScene = visited.find(function(sceneId) {
    return sceneId !== 'backSpecialScene' &&
      !sceneId.startsWith('root') &&
      !sceneId.startsWith('poland_') &&
      !sceneId.startsWith('library') &&
      sceneId !== 'status' &&
      !sceneId.startsWith('status.');
  });
  assert.strictEqual(
    unexpectedScene,
    undefined,
    'Polish route entered legacy scene: ' + unexpectedScene
  );

  return {
    ending: engine.state.qualities.prototype_complete
      ? engine.state.qualities.ending_name
      : engine.state.qualities.date_label + ' continuation checkpoint',
    score: engine.state.qualities.ending_score,
    unity: engine.state.qualities.party_unity,
    polling: engine.state.qualities.left_poll,
    budget2019: engine.state.qualities.budget_2019_backing,
    budget2020: engine.state.qualities.budget_backing,
    cardsPlayed: cardsPlayed.length,
  };
}

if (!fs.existsSync(compiledPath)) {
  console.error('out/game.json is missing. Run npm run build first.');
  process.exit(1);
}

const game = convertGame(fs.readFileSync(compiledPath, 'utf8'));
if (process.env.DSS_DECK_WEIGHT_SMOKE === '1') {
  testPartyDeckWeights(game);
  console.log('Polish deck weighting smoke passed.');
  process.exit(0);
}
if (
  process.env.DSS_DOSSIER_SMOKE !== '1' &&
  process.env.DSS_MAJOR_REFORM_SMOKE !== '1' &&
  process.env.DSS_FOREIGN_SMOKE !== '1'
) {
  testRadioFiles(game);
}
testPartyPresentationAssets();
if (process.env.DSS_RADIO_SMOKE === '1') {
  console.log('Embedded radio smoke passed.');
  process.exit(0);
}
const result = runSmoke(game);

console.log(
  'Polish native gameplay smoke passed: ' + result.ending +
  ' (score ' + result.score +
  ', unity ' + result.unity +
  ', poll ' + result.polling + '%' +
  ', budgets ' + result.budget2019 + '%/' + result.budget2020 + '%' +
  ', cards played ' + result.cardsPlayed + ').'
);
