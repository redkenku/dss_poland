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
};

const foreignRelationshipCardIds = [
  'poland_eastern_flank',
  'poland_european_campaign',
  'poland_european_right',
  'poland_white_house_pressure',
];

const pollingPartyIds = [
  'left', 'pis', 'ko', 'psl', 'konf', 'p2050', 'p0', 'other',
  'sld_breakaway', 'social_patriot', 'spring_breakaway', 'labor_left',
  'young_left', 'razem', 'pps', 'left_coalition', 'democratic_list',
  'third_way', 'tak_rozwoj', 'centrum', 'rozwoj', 'korona',
  'ko_splinter', 'suwerenna', 'porozumienie', 'kukiz',
  'new_hope', 'national_movement', 'duda', 'social_conservative',
  'right_2027', 'common_centre_2027', 'third_way_2027',
  'social_conservative_2027',
];

// Reform projects only exist for the fields the party actually put on its
// slate. Before any pick the deck offers the slate card itself; these tests
// choose three fields explicitly and then expect exactly those projects.
const slatedReformIssues = ['abortion', 'labor', 'marriage'];
const majorReformCardIds = slatedReformIssues.map(function(issue) {
  return 'poland_' + issue + '_reform';
}).sort();

function openReformSlate(qualities, issues) {
  (issues || slatedReformIssues).forEach(function(issue) {
    qualities[issue + '_on_slate'] = 1;
    qualities['poland_' + issue + '_reform_timer'] = 0;
    qualities[issue + '_reform_settled'] = 0;
  });
  qualities.poland_reform_slate_timer = 99;
  qualities.reform_pressure_pending = 0;
}

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

const hardLeftGovernmentCardIds = [
  'poland_hard_left_government.coinpurses',
  'poland_hard_left_government.eastern_wall',
  'poland_hard_left_government.mmt',
  'poland_hard_left_government.nationalisation',
  'poland_hard_left_government.petrochemical',
];

const hardLeftOneShotTimerIds = [
  'poland_forgotten_poland_timer',
  'poland_specter_timer',
  'poland_decommunisation_timer',
  'poland_internationale_timer',
  'poland_pps_question_timer',
  'poland_eastern_wall_timer',
  'poland_coinpurses_timer',
  'poland_petrochemical_timer',
  'poland_nationalisation_timer',
  'poland_mmt_timer',
];

const pathGovernmentCardIds = [
  'poland_path_government.market_competition_state',
  'poland_path_government.market_fiscal_council',
  'poland_path_government.market_one_rate',
  'poland_path_government.market_private_supply',
  'poland_path_government.market_social_budget',
  'poland_path_government.populist_foreign_capital',
  'poland_path_government.populist_people_bank',
  'poland_path_government.populist_people_tariff',
  'poland_path_government.populist_referendum_state',
  'poland_path_government.populist_sovereign_welfare',
  'poland_path_government.sld_administrative_republic',
  'poland_path_government.sld_mayors_cabinet',
  'poland_path_government.sld_national_champions',
  'poland_path_government.sld_pension_guarantee',
  'poland_path_government.sld_public_boards',
  'poland_path_government.wiosna_equal_citizenship',
  'poland_path_government.wiosna_open_republic',
  'poland_path_government.wiosna_rainbow_school',
  'poland_path_government.wiosna_reproductive_state',
  'poland_path_government.wiosna_secular_republic',
];

const constituentPartyCardIds = [
  'poland_constituent_party.nowa_lewica_body_positive_school',
  'poland_constituent_party.nowa_lewica_caring_state',
  'poland_constituent_party.nowa_lewica_equal_leave',
  'poland_constituent_party.nowa_lewica_first_bell',
  'poland_constituent_party.nowa_lewica_two_traditions',
  'poland_constituent_party.razem_ninety_nine_one',
  'poland_constituent_party.razem_no_billboards',
  'poland_constituent_party.razem_thirty_two_hours',
  'poland_constituent_party.razem_union_notice',
  'poland_constituent_party.razem_zloty_stays',
  'poland_constituent_party.pps_cooperative_restart',
  'poland_constituent_party.pps_lobbyists_notebook',
  'poland_constituent_party.pps_more_than_pennies',
  'poland_constituent_party.pps_no_private_primacy',
  'poland_constituent_party.pps_socialist_not_social_democratic',
  'poland_constituent_party.sld_abolish_ipn',
  'poland_constituent_party.sld_bank_transaction_tax',
  'poland_constituent_party.sld_broadband_gmina',
  'poland_constituent_party.sld_economic_freedom',
  'poland_constituent_party.sld_markets_serve_people',
  'poland_constituent_party.wiosna_2035_clock',
  'poland_constituent_party.wiosna_polish_polish_war',
  'poland_constituent_party.wiosna_public_salary_glass',
  'poland_constituent_party.wiosna_stamp_museum',
  'poland_constituent_party.wiosna_thirteen_bills',
];

const constituentGovernmentCardIds = [
  'poland_constituent_government.nowa_lewica_empty_homes',
  'poland_constituent_government.nowa_lewica_school_health',
  'poland_constituent_government.nowa_lewica_second_breakfast',
  'poland_constituent_government.nowa_lewica_student_ticket',
  'poland_constituent_government.nowa_lewica_widow_pension',
  'poland_constituent_government.razem_choose_waiting_room',
  'poland_constituent_government.razem_eight_reactors',
  'poland_constituent_government.razem_one_percent_housing',
  'poland_constituent_government.razem_public_code',
  'poland_constituent_government.razem_twenty_desks',
  'poland_constituent_government.pps_housing_first',
  'poland_constituent_government.pps_maximum_wage',
  'poland_constituent_government.pps_public_fibre',
  'poland_constituent_government.pps_six_hour_day',
  'poland_constituent_government.pps_workers_councils',
  'poland_constituent_government.sld_inspector_prosecutor',
  'poland_constituent_government.sld_national_housebuilding',
  'poland_constituent_government.sld_public_investment_work',
  'poland_constituent_government.sld_public_ivf',
  'poland_constituent_government.sld_three_percent_research',
  'poland_constituent_government.wiosna_alimony_tax',
  'poland_constituent_government.wiosna_conscience_clause',
  'poland_constituent_government.wiosna_personal_assistant',
  'poland_constituent_government.wiosna_thirty_days',
  'poland_constituent_government.wiosna_train_every_powiat',
];

const constituentOneShotTimerIds = [
  'poland_sld_markets_timer',
  'poland_sld_economic_freedom_timer',
  'poland_sld_bank_tax_timer',
  'poland_sld_broadband_timer',
  'poland_sld_ipn_timer',
  'poland_sld_housebuilding_timer',
  'poland_sld_inspector_timer',
  'poland_sld_public_work_timer',
  'poland_sld_ivf_timer',
  'poland_sld_research_timer',
  'poland_wiosna_dialogue_timer',
  'poland_wiosna_thirteen_bills_timer',
  'poland_wiosna_2035_timer',
  'poland_wiosna_transparency_timer',
  'poland_wiosna_stamps_timer',
  'poland_wiosna_powiat_train_timer',
  'poland_wiosna_specialist_timer',
  'poland_wiosna_alimony_timer',
  'poland_wiosna_assistant_timer',
  'poland_wiosna_conscience_timer',
  'poland_pps_socialist_timer',
  'poland_pps_local_democracy_timer',
  'poland_pps_lobbying_timer',
  'poland_pps_property_timer',
  'poland_pps_cooperative_timer',
  'poland_pps_six_hour_timer',
  'poland_pps_councils_timer',
  'poland_pps_maximum_wage_timer',
  'poland_pps_housing_first_timer',
  'poland_pps_public_fibre_timer',
  'poland_nowa_lewica_caring_state_timer',
  'poland_nowa_lewica_first_bell_timer',
  'poland_nowa_lewica_equal_leave_timer',
  'poland_nowa_lewica_body_positive_timer',
  'poland_nowa_lewica_two_traditions_timer',
  'poland_nowa_lewica_second_breakfast_timer',
  'poland_nowa_lewica_student_ticket_timer',
  'poland_nowa_lewica_school_health_timer',
  'poland_nowa_lewica_widow_pension_timer',
  'poland_nowa_lewica_empty_homes_timer',
  'poland_razem_ninety_nine_one_timer',
  'poland_razem_thirty_two_hours_timer',
  'poland_razem_no_billboards_timer',
  'poland_razem_zloty_stays_timer',
  'poland_razem_union_notice_timer',
  'poland_razem_eight_reactors_timer',
  'poland_razem_public_code_timer',
  'poland_razem_twenty_desks_timer',
  'poland_razem_one_percent_housing_timer',
  'poland_razem_choose_waiting_room_timer',
];

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
  'hard_left_turn_open',
  'hard_left_current_share',
  'hard_left_line',
  'hard_left_exposure',
  'hard_left_refusals',
  'gierek_rehabilitation',
  'pps_heritage_claimed',
  'mmt_doctrine_adopted',
  'strategic_nationalisations',
  'poland_forgotten_poland_timer',
  'poland_specter_timer',
  'poland_decommunisation_timer',
  'poland_internationale_timer',
  'poland_pps_question_timer',
  'poland_eastern_wall_timer',
  'poland_coinpurses_timer',
  'poland_petrochemical_timer',
  'poland_nationalisation_timer',
  'poland_mmt_timer',
  'poland_sld_membership_timer',
  'poland_sld_memory_timer',
  'poland_sld_public_boards_timer',
  'poland_sld_mayors_timer',
  'poland_wiosna_open_party_timer',
  'poland_wiosna_movement_veto_timer',
  'poland_wiosna_equal_citizenship_timer',
  'poland_wiosna_secular_state_timer',
  'poland_market_startup_timer',
  'poland_market_taxpayers_timer',
  'poland_market_social_budget_timer',
  'poland_market_competition_timer',
  'poland_populist_red_white_timer',
  'poland_populist_samoobrona_timer',
  'poland_populist_tariff_timer',
  'poland_populist_welfare_timer',
  'poland_sld_pensioners_timer',
  'poland_sld_secular_timer',
  'poland_sld_safe_places_timer',
  'poland_sld_pension_guarantee_timer',
  'poland_sld_national_champions_timer',
  'poland_sld_administrative_republic_timer',
  'poland_wiosna_two_bills_timer',
  'poland_wiosna_metropolitan_timer',
  'poland_wiosna_friends_timer',
  'poland_wiosna_reproductive_timer',
  'poland_wiosna_rainbow_school_timer',
  'poland_wiosna_open_republic_timer',
  'poland_market_merit_timer',
  'poland_market_money_timer',
  'poland_market_forms_timer',
  'poland_market_one_rate_timer',
  'poland_market_private_supply_timer',
  'poland_market_fiscal_council_timer',
  'poland_populist_experts_timer',
  'poland_populist_sovereignty_timer',
  'poland_populist_live_timer',
  'poland_populist_bank_timer',
  'poland_populist_foreign_capital_timer',
  'poland_populist_referendum_timer',
  'ideological_path_government_open',
  'poland_sld_markets_timer',
  'poland_sld_economic_freedom_timer',
  'poland_sld_bank_tax_timer',
  'poland_sld_broadband_timer',
  'poland_sld_ipn_timer',
  'poland_sld_housebuilding_timer',
  'poland_sld_inspector_timer',
  'poland_sld_public_work_timer',
  'poland_sld_ivf_timer',
  'poland_sld_research_timer',
  'poland_wiosna_dialogue_timer',
  'poland_wiosna_thirteen_bills_timer',
  'poland_wiosna_2035_timer',
  'poland_wiosna_transparency_timer',
  'poland_wiosna_stamps_timer',
  'poland_wiosna_powiat_train_timer',
  'poland_wiosna_specialist_timer',
  'poland_wiosna_alimony_timer',
  'poland_wiosna_assistant_timer',
  'poland_wiosna_conscience_timer',
  'poland_pps_socialist_timer',
  'poland_pps_local_democracy_timer',
  'poland_pps_lobbying_timer',
  'poland_pps_property_timer',
  'poland_pps_cooperative_timer',
  'poland_pps_six_hour_timer',
  'poland_pps_councils_timer',
  'poland_pps_maximum_wage_timer',
  'poland_pps_housing_first_timer',
  'poland_pps_public_fibre_timer',
  'poland_nowa_lewica_caring_state_timer',
  'poland_nowa_lewica_first_bell_timer',
  'poland_nowa_lewica_equal_leave_timer',
  'poland_nowa_lewica_body_positive_timer',
  'poland_nowa_lewica_two_traditions_timer',
  'poland_nowa_lewica_second_breakfast_timer',
  'poland_nowa_lewica_student_ticket_timer',
  'poland_nowa_lewica_school_health_timer',
  'poland_nowa_lewica_widow_pension_timer',
  'poland_nowa_lewica_empty_homes_timer',
  'poland_razem_ninety_nine_one_timer',
  'poland_razem_thirty_two_hours_timer',
  'poland_razem_no_billboards_timer',
  'poland_razem_zloty_stays_timer',
  'poland_razem_union_notice_timer',
  'poland_razem_eight_reactors_timer',
  'poland_razem_public_code_timer',
  'poland_razem_twenty_desks_timer',
  'poland_razem_one_percent_housing_timer',
  'poland_razem_choose_waiting_room_timer',
  'constituent_programme_government_open',
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
  'caucus_crisis_deferred',
  'caucus_crisis_dispatchable',
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
  'civic_independence_years',
  'civic_independence_investment',
  'independence_day_reclaimed',
  'independence_main_march_pluralized',
  'independence_monitor_institution',
  'independence_counter_coalition',
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
  'poland_budget_2023_2026.budget_open',
  'poland_events.covid',
  'poland_gowin_crisis.postal_crisis',
  'poland_leadership_events.ko_candidate_replacement_2020',
  'poland_presidential_election.setup',
  'poland_presidential_election.runoff_setup',
  'poland_leadership_events.p2050_foundation_2020',
  'poland_merger_events.merger',
  'poland_events.abortion',
  'poland_events.strike',
  'poland_events.budget_2020',
  'poland_events.vaccine',
  'poland_monthly_briefing',
  'poland_merger_events.rename',
  'poland_monthly_briefing',
  'poland_events.recovery_fund',
  'poland_events.opposition_reset',
  'poland_leadership_events.tusk_return_2021',
  'poland_minority_sejm.lex_tvn_crisis',
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

  // With an untouched slate the deck offers the slate choice and nothing else.
  const emptySlateDraws = engine._compileChoices(
    game.scenes.poland_major_reform_deck
  ).filter(function(choice) {
    return choice.canChoose && game.scenes[choice.id].isCard;
  }).map(function(choice) {
    return choice.id;
  }).sort();
  assert.deepStrictEqual(
    emptySlateDraws,
    ['poland_reform_slate'],
    'An unchosen slate must offer the slate card and no reform projects'
  );

  openReformSlate(engine.state.qualities);
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
    'The Major Reforms deck did not draw the three chosen projects'
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
  const radioMarkup = fs.readFileSync(
    path.join(projectRoot, 'out', 'html', 'index.html'),
    'utf8'
  );
  assert(
    radioMarkup.includes('id="radio-volume"') &&
      radioMarkup.includes('id="radio-song-list"'),
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
    'window.setRadioTrackEnabled',
    'var radioVolume = 0.2',
    "TITLE + '_radio_disabled_tracks'",
    'audio === startScene.audio',
    'Radio ready',
  ]
    .forEach(function(requiredSource) {
      assert(
        radioSource.includes(requiredSource),
        'Radio behavior missing from game.js: ' + requiredSource
      );
    });

  const storedSettings = {};
  const radioSandbox = {
    console: {log: function() {}, error: function() {}},
    document: {getElementById: function() { return null; }},
    window: {
      localStorage: {
        getItem: function(key) { return storedSettings[key] || null; },
        setItem: function(key, value) { storedSettings[key] = value; },
      },
    },
  };
  vm.runInNewContext(radioSource, radioSandbox);
  const playedAudio = [];
  const radioUI = {
    game: game,
    dendryEngine: {
      state: {qualities: {}},
      achieve: function() {},
    },
    audio: function(value) { playedAudio.push(value); },
    audioPlaylist: [],
    currentAudio: null,
  };
  radioSandbox.window.dendryUI = radioUI;
  radioSandbox.window.dendryModifyUI(radioUI);
  radioUI.audio(audio);
  radioSandbox.window.setRadioTrackEnabled(tracks[0], false);
  radioUI.audio(audio);
  assert.strictEqual(playedAudio.length, 2);
  assert(
    !playedAudio[1].includes(tracks[0]),
    'A disabled radio track remained in the soundtrack passed to the engine'
  );
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
        'story = pressTVPStory(outlet, story, qualities);'
      ),
    'TVP framing and simulated copy do not follow the public-media patron'
  );
  assert(
    presentationSource.includes("accent: '#ffd200'") &&
      presentationSource.includes("accent: '#d71920'") &&
      presentationSource.includes("accent: '#343434'") &&
      !presentationSource.includes('HARD-RIGHT LINE') &&
      !presentationSource.includes('PiS LINE') &&
      !presentationSource.includes('KO LINE'),
    'Press colors or reader-facing editorial labels regressed'
  );
  const testablePresentationSource = presentationSource.replace(
    '  window.renderPressReview = function() {',
      '  window.__testPressTVPStory = pressTVPStory;\n' +
      '  window.__testPressLiveStory = pressLiveStory;\n' +
      '  window.__testPressChoiceStory = pressChoiceStory;\n' +
      '  window.__testPressEventStories = pressEventStories;\n' +
      '  window.__testPressReviewStories = pressReviewStories;\n' +
      '  window.__testPressReviewOutlets = pressReviewOutlets;\n' +
      '  window.__testPressEditionOutlets = pressEditionOutlets;\n' +
      '  window.__testPressMoodSentence = pressMoodSentence;\n' +
      '  window.__testPressRelevantIssue = pressRelevantIssue;\n' +
      '  window.__testTVPOutlet = pressReviewOutlets.filter(function(outlet) {' +
      ' return outlet.id === \'tvp\'; })[0];\n\n' +
      '  window.renderPressReview = function() {'
  );
  vm.runInNewContext(testablePresentationSource, sandbox);

  const sourcedStoryCountByYear = {};
  Object.keys(sandbox.window.__testPressReviewStories).forEach(function(dateKey) {
    Object.values(sandbox.window.__testPressReviewStories[dateKey]).forEach(
      function(story) {
        if (story.sourceUrl) {
          const year = Math.floor(Number(dateKey) / 100);
          sourcedStoryCountByYear[year] =
            (sourcedStoryCountByYear[year] || 0) + 1;
        }
      }
    );
  });
  let sourcedMonthCount = 0;
  for (let year = 2019; year <= 2026; year += 1) {
    const firstMonth = year === 2019 ? 10 : 1;
    const lastMonth = year === 2026 ? 8 : 12;
    for (let month = firstMonth; month <= lastMonth; month += 1) {
      const dateKey = year * 100 + month;
      const stories = sandbox.window.__testPressReviewStories[dateKey];
      assert(
        stories && Object.values(stories).some(function(story) {
          return story.sourceUrl;
        }),
        'The ' + dateKey + ' press review has no real sourced report'
      );
      sourcedMonthCount += 1;
    }
  }
  assert.strictEqual(
    sourcedMonthCount,
    83,
    'The historical sourced-news horizon no longer covers every month'
  );
  assert.strictEqual(
    sourcedStoryCountByYear[2027] || 0,
    0,
    'A future 2027 scenario report is incorrectly presented as sourced news'
  );

  Object.keys(sandbox.window.__testPressReviewStories).forEach(function(dateKey) {
    const stories = sandbox.window.__testPressReviewStories[dateKey];
    const hasSourcedStory = Object.values(stories).some(function(story) {
      return story.sourceUrl;
    });
    if (!hasSourcedStory) {
      return;
    }
    const numericDateKey = Number(dateKey);
    const available = sandbox.window.__testPressReviewOutlets.filter(
      function(outlet) {
        return outlet.from <= numericDateKey && !outlet.requires;
      }
    );
    const firstOutlet = sandbox.window.__testPressEditionOutlets(
      available,
      {news_headline: 'The Left follows contracts, names and consular files'},
      numericDateKey,
      87
    )[0];
    assert(
      firstOutlet && stories[firstOutlet.id] && stories[firstOutlet.id].sourceUrl,
      'The sourced report is not visible in the ' + dateKey + ' edition'
    );
  });

  for (let year = 2024; year <= 2027; year += 1) {
    const lastMonth = year === 2027 ? 10 : 12;
    for (let month = 1; month <= lastMonth; month += 1) {
      const dateKey = year * 100 + month;
      const stories = sandbox.window.__testPressReviewStories[dateKey];
      assert(
        stories && Object.keys(stories).filter(function(outletId) {
          return outletId !== 'rownosc';
        }).length >= 3,
        'Press review lacks three authored reports for ' + dateKey
      );
      [0, 1, 48, 87].forEach(function(turn) {
        const available = sandbox.window.__testPressReviewOutlets.filter(
          function(outlet) {
            return outlet.from <= dateKey && !outlet.requires;
          }
        );
        const count = Math.min(available.length, 2 + Math.abs(turn % 2));
        const edition = sandbox.window.__testPressEditionOutlets(
          available,
          {news_headline: ''},
          dateKey,
          turn
        ).slice(0, count);
        assert.strictEqual(edition.length, count);
        edition.forEach(function(outlet) {
          assert(
            stories[outlet.id],
            'Press review used live filler for ' + dateKey + ' / ' + outlet.id
          );
        });
      });
    }
  }

  const rownoscDate = 202701;
  const rownoscStories = sandbox.window.__testPressReviewStories[rownoscDate];
  const rownoscAvailable = sandbox.window.__testPressReviewOutlets.filter(
    function(outlet) {
      return outlet.from <= rownoscDate &&
        (!outlet.requires || outlet.id === 'rownosc');
    }
  );
  assert(
    [0, 1, 2, 3].some(function(turn) {
      const count = 2 + Math.abs(turn % 2);
      return sandbox.window.__testPressEditionOutlets(
        rownoscAvailable,
        {news_headline: '', rownosc_media_active: 1},
        rownoscDate,
        turn
      ).slice(0, count).some(function(outlet) {
        return outlet.id === 'rownosc' && rownoscStories[outlet.id];
      });
    }),
    'The authored Rownosc desk never rotates into a visible edition'
  );

  const eventHeadline = "Biedroń becomes the Left's presidential candidate";
  const eventEdition = sandbox.window.__testPressEditionOutlets(
    sandbox.window.__testPressReviewOutlets.filter(function(outlet) {
      return !outlet.requires && outlet.from <= 201911;
    }),
    {news_headline: eventHeadline},
    201911,
    0
  ).slice(0, 3);
  eventEdition.forEach(function(outlet) {
    assert(
      sandbox.window.__testPressEventStories[eventHeadline][outlet.id],
      'Monthly copy displaced an authored outcome reaction for ' + outlet.id
    );
  });

  assert.strictEqual(
    sandbox.window.moodBackgroundColor(35),
    'rgb(113, 118, 124)',
    'Extremely hostile public mood does not reach dark gray'
  );
  assert.strictEqual(
    sandbox.window.moodBackgroundColor(45),
    'rgb(211, 220, 232)',
    'Hostile public mood does not reach the pastel Konfederacja blue'
  );
  assert.strictEqual(
    sandbox.window.moodBackgroundColor(50),
    'rgb(243, 243, 227)',
    'Neutral public mood no longer preserves the original beige-yellow'
  );
  assert.strictEqual(
    sandbox.window.moodBackgroundColor(55),
    'rgb(239, 211, 215)',
    'Favourable public mood does not reach the pastel Left red'
  );
  assert.strictEqual(
    sandbox.window.moodBackgroundColor(65),
    'rgb(228, 204, 224)',
    'Strongly favourable public mood does not reach the pastel Razem purple'
  );
  assert.strictEqual(
    sandbox.window.moodBackgroundColor(40),
    'rgb(162, 169, 178)',
    'Hostile public mood does not interpolate from blue to dark gray'
  );
  assert.strictEqual(
    sandbox.window.moodBackgroundColor(52.5),
    'rgb(241, 227, 221)',
    'Public-mood background does not interpolate smoothly between stops'
  );

  const baseTVPStory = {
    headline: 'The coalition files its bill',
    text: 'Parliament begins the count.',
    sourceUrl: '',
    sourceDate: '',
    live: true,
  };
  [
    ['pis', 'Government under fire: ', 'Opposition parties'],
    ['ko', 'Government moves: ', 'Ministers say'],
    ['left', 'The Left responds: ', 'Opposition parties'],
    ['neutral', 'The coalition files its bill', 'next institutional stage'],
  ].forEach(function(expected) {
    const story = sandbox.window.__testPressTVPStory(
      sandbox.window.__testTVPOutlet,
      baseTVPStory,
      {time: 0, government_party: 'ko', public_media_patron: expected[0]}
    );
    assert(story.headline.startsWith(expected[1]));
    assert(story.text.includes(expected[2]));
  });

  const moodQualities = {
    news_headline: 'The housing bill survives a coalition revolt',
    government_party: 'ko',
    ko_relation: 45,
    social_spending_support: 76,
    social_spending_salience: 90,
    social_spending_backlash: 30,
  };
  const wpOutlet = {id: 'wp', patron: 'neutral'};
  const liveStory = sandbox.window.__testPressLiveStory(
    wpOutlet,
    moodQualities,
    202501,
    1
  );
  assert(liveStory.headline.includes(moodQualities.news_headline));
  assert(
    sandbox.window.__testPressMoodSentence(
      wpOutlet,
      moodQualities,
      'social_spending'
    ).includes('social spending and public services'),
    'Press copy does not follow the hottest public-mood issue'
  );
  moodQualities.abortion_rights_support = 25;
  moodQualities.abortion_rights_salience = 100;
  moodQualities.abortion_rights_backlash = 100;
  assert(
    sandbox.window.__testPressMoodSentence(
      wpOutlet,
      moodQualities,
      'abortion_rights'
    ).includes('abortion rights'),
    'Press copy did not react when the public mood changed'
  );
  assert.strictEqual(
    sandbox.window.__testPressRelevantIssue(
      {headline: 'Biedroń becomes the Left’s presidential candidate', text: ''},
      {news_headline: 'Biedroń becomes the Left’s presidential candidate'}
    ),
    '',
    'Unrelated public mood leaked into candidate coverage'
  );
  const candidateHeadlines = ['rzeczpospolita', 'tvp', 'tvn'].map(
    function(id) {
      return sandbox.window.__testPressChoiceStory(
        {id: id},
        baseTVPStory,
        {news_headline: "Biedroń becomes the Left's presidential candidate"},
        201911
      ).headline;
    }
  );
  assert.strictEqual(new Set(candidateHeadlines).size, 3);
  candidateHeadlines.forEach(function(headline) {
    assert(headline.includes('Biedroń'));
  });
  const eventStorySets = Object.values(
    sandbox.window.__testPressEventStories
  );
  assert(eventStorySets.length >= 58, 'Too few authored event outcomes');
  assert(
    eventStorySets.reduce(function(total, stories) {
      return total + Object.keys(stories).length;
    }, 0) >= 160,
    'Too few authored outlet reports'
  );
  eventStorySets.forEach(function(stories) {
    const reports = Object.values(stories);
    assert.strictEqual(
      new Set(reports.map(function(story) { return story.headline; })).size,
      reports.length,
      'An authored outcome repeats a headline across outlets'
    );
    assert.strictEqual(
      new Set(reports.map(function(story) { return story.text; })).size,
      reports.length,
      'An authored outcome repeats article prose across outlets'
    );
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
      (rendered.includes('class="party ' + expected[1] + '"') ||
        rendered.includes('class="party party-name ' + expected[1] + '"')) &&
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
  const agrounia = sandbox.window.displayText(
    'AgroUnia founder Michał Kołodziejczak'
  );
  assert(agrounia.includes('class="party party-name party-agrounia"'));
  assert(agrounia.includes('data-party-logo="agrounia"'));
  assert(agrounia.includes('class="party party-agrounia person-name"'));
  assert(agrounia.includes('data-party-person="kolodziejczak"'));

  sandbox.window.dendryUI.dendryEngine.state.qualities = {
    nowa_lewica_merger_agreed: 1,
    progressives_active: 1,
  };
  const miller = sandbox.window.displayText('Miller');
  assert(miller.includes('class="party party-sld person-name"'),
    'Miller lost the old-SLD badge after the merger');

  const addedLogos = sandbox.window.displayText(
    "Koalicja Polska; Kukiz'15; OdNowa RP; Partia Republikańska; " +
      'Wolność; KORWiN; Nowa Nadzieja; Mniejszość Niemiecka; ' +
      'Zjednoczona Prawica; Prawica; Unia Europejskich Demokratów.'
  );
  [
    ['polish-coalition', 'party-polish-coalition', 'KP', 'Koalicja Polska'],
    ['kukiz', 'party-kukiz', 'Kukiz’15', 'Kukiz’15'],
    ['odnowa', 'party-odnowa', 'OdNowa RP', 'OdNowa Rzeczypospolitej Polskiej'],
    ['republicans', 'party-republicans', 'PR', 'Partia Republikańska'],
    ['new-hope', 'party-new-hope', 'NN', 'Nowa Nadzieja'],
    ['german-minority', 'party-german-minority', 'MN', 'Mniejszość Niemiecka'],
    ['united-right', 'party-united-right', 'ZP', 'Zjednoczona Prawica'],
    ['prawica', 'party-prawica', 'Prawica', 'Prawica'],
    ['ued', 'party-ued', 'UED', 'Unia Europejskich Demokratów'],
  ].forEach(function(expected) {
    assert(addedLogos.includes('class="party party-name ' + expected[1] + '"'));
    assert(addedLogos.includes('data-party="' + expected[0] + '"'));
    assert(addedLogos.includes('data-party-logo="' + expected[0] + '"'));
    assert(addedLogos.includes('data-party-short-name="' + expected[2] + '"'));
    assert(addedLogos.includes('data-party-long-name="' + expected[3] + '"'));
  });
  assert.strictEqual(
    (addedLogos.match(/data-party-logo="new-hope"/g) || []).length,
    3,
    'Wolność, KORWiN and Nowa Nadzieja must share the Nowa Nadzieja logo'
  );
  const logoCss = fs.readFileSync(
    path.join(projectRoot, 'out', 'html', 'game.css'),
    'utf8'
  );
  [
    'koalicjapolska.jpg', 'kukiz.png', 'odnowa.png',
    'partiarepublikanska.webp', 'nowanadzieja.jpg',
    'mniejszoscniemiecka.png', 'zjednoczonaprawica.png', 'prawica.webp', 'ued.jpg',
    'agrounia.jpg',
  ].forEach(function(file) {
    assert(logoCss.includes("url('img/partylogo/" + file + "')"));
    assert(fs.existsSync(path.join(projectRoot, 'out', 'html', 'img', 'partylogo', file)));
  });

  sandbox.window.dendryUI.dendryEngine.state.qualities = {
    prawica_formed: 1,
    prawica_member_party_keys: ['pis', 'rozwoj-plus', 'prawica'],
    prawica_member_source_ids: ['pis', 'rozwoj'],
  };
  const prawicaBranding = sandbox.window.displayText(
    'PiS; Rozwój Plus; Prawica; Korona.'
  );
  assert(prawicaBranding.includes(
    'class="party party-name party-pis party-prawica"'
  ), 'PiS did not adopt Prawica presentation after formation');
  assert(prawicaBranding.includes(
    'class="party party-name party-rozwoj party-prawica"'
  ), 'Rozwój+ did not adopt Prawica presentation after formation');
  assert.strictEqual(
    (prawicaBranding.match(/data-party-logo="prawica"/g) || []).length,
    3,
    'Prawica founders and the coalition must use prawica.webp'
  );
  assert(prawicaBranding.includes(
    'class="party party-name party-kkp"'
  ), 'Korona must retain its own branding outside Prawica');

  sandbox.window.dendryUI.dendryEngine.state.qualities = {
    left_party_name: 'Lewica Razem',
    left_party_short_name: 'LR',
    left_party_long_name: 'Lewica Razem',
  };
  const dynamicLeft = sandbox.window.displayText(
    'Lewica negotiates while The Left prepares its vote.'
  );
  assert.strictEqual(
    (dynamicLeft.match(/>Lewica Razem<\/span>/g) || []).length,
    2,
    'Generic Left labels did not follow the live campaign identity'
  );
  assert(dynamicLeft.includes('data-party-short-name="LR"'));
  assert(dynamicLeft.includes('data-party-long-name="Lewica Razem"'));

  sandbox.window.dendryUI.dendryEngine.state.qualities = {};
  const nowackaInKo = sandbox.window.displayText('Barbara Nowacka');
  assert(nowackaInKo.includes('class="party party-ko person-name"'));
  assert(nowackaInKo.includes('data-party-person="nowacka"'));
  assert(nowackaInKo.includes('within Civic Coalition'));

  sandbox.window.dendryUI.dendryEngine.state.qualities = {
    ko_splinter_active: 1,
    ko_splinter_type: 'Progressive',
    ko_break_leader: 'Barbara Nowacka',
  };
  const nowackaInIpl = sandbox.window.displayText('Barbara Nowacka');
  assert(nowackaInIpl.includes(
    'class="party party-inicjatywa-polska person-name"'
  ));
  assert(nowackaInIpl.includes('independent Inicjatywa Polska'));

  sandbox.window.dendryUI.dendryEngine.state.qualities = {
    ipl_joined_left: 1,
    left_party_name: 'Lewica Razem',
  };
  const nowackaCurrent = sandbox.window.displayText('Barbara Nowacka');
  assert(nowackaCurrent.includes(
    'class="party party-inicjatywa-polska person-name"'
  ));
  assert(nowackaCurrent.includes(
    'internal progressive current in Lewica Razem'
  ));

  sandbox.window.dendryUI.dendryEngine.state.sceneId = 'main';
  const legacy = 'Together, they welcomed the Prussian Spring.';
  assert.strictEqual(sandbox.window.displayText(legacy), legacy);
}

function testPickingEnemiesChoices(game) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame(['picking-enemies-choice-check']);
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(choice) {
      return choice.id === sceneId;
    });
    assert(index >= 0, 'Missing setup choice: ' + sceneId);
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');

  const qualities = engine.state.qualities;
  Object.assign(qualities, {
    konf_seats: 18,
    konf_poll: 8,
    p0_formed: 0,
    p0_seats: 0,
    p0_poll: 0,
    far_right_split: 0,
    korona_seats: 0,
    korona_poll: 0,
    suwerenna_walkout: 0,
    suwerenna_merger_result: 'None',
  });
  const enemyChoices = function() {
    return engine._compileChoices(game.scenes.poland_picking_enemies)
      .map(function(choice) { return choice.id; });
  };
  assert(enemyChoices().includes('poland_picking_enemies.konf'));
  assert(!enemyChoices().includes('poland_picking_enemies.far_right'));

  qualities.p0_formed = 1;
  assert(enemyChoices().includes('poland_picking_enemies.far_right'));
}

function testCheatMenu(game) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices() || [];
    const index = choices.findIndex(function(choice) {
      return choice.id === sceneId && choice.canChoose;
    });
    assert(index >= 0, 'Missing cheat-menu choice: ' + sceneId);
    engine.choose(index);
  };

  engine.beginGame(['cheat-menu-disabled-check']);
  choose('root.campaign_game');
  choose('root.standard');
  assert.strictEqual(engine.state.qualities.cheat_enabled, 0);
  engine.goToScene('poland_hub');
  assert(!engine.getCurrentChoices().some(function(choice) {
    return choice.id === 'poland_hub.cheats';
  }));

  engine.beginGame(['cheat-menu-enabled-check']);
  choose('root.cheat_setup');
  choose('root.cheats_on');
  choose('root.campaign_game');
  choose('root.standard');
  assert.strictEqual(engine.state.qualities.cheat_enabled, 1);
  engine.goToScene('poland_hub');
  assert(engine.getCurrentChoices().some(function(choice) {
    return choice.id === 'poland_hub.cheats' && choice.canChoose;
  }));
  engine.playPinnedCard('poland_hub.cheats');
  choose('cheat_menu.money');
  choose('cheat_menu.resources_up');
  assert.strictEqual(engine.state.qualities.resources, 15);
  choose('cheat_menu');
  choose('cheat_menu.polls');
  const pollTotal = function() {
    return pollingPartyIds.reduce(function(total, id) {
      return total + (engine.state.qualities[id + '_poll'] || 0);
    }, 0);
  };
  const leftBeforeCheat = engine.state.qualities.left_poll;
  choose('cheat_menu.left_poll_up_ten');
  assert.strictEqual(
    engine.state.qualities.left_poll,
    leftBeforeCheat + 10
  );
  assert(Math.abs(pollTotal() - 100) < 0.000001);
  choose('cheat_menu.left_poll_up');
  assert.strictEqual(
    engine.state.qualities.left_poll,
    leftBeforeCheat + 11
  );
  assert.strictEqual(
    engine.state.qualities.left_vote_intent,
    engine.state.qualities.left_poll,
    'Cheated polling did not reach the electorate used by elections'
  );
  assert(Math.abs(pollTotal() - 100) < 0.000001);
  choose('cheat_menu');
  engine.state.qualities.ko_relation = 95;
  choose('cheat_menu.relations');
  choose('cheat_menu.ko_relation_up');
  assert.strictEqual(engine.state.qualities.ko_relation, 100);
  choose('cheat_menu');
  engine.state.qualities.party_unity = 95;
  choose('cheat_menu.party_state');
  choose('cheat_menu.unity_up');
  assert.strictEqual(engine.state.qualities.party_unity, 100);
  choose('cheat_menu');
  engine.state.qualities.barons_strength = 95;
  engine.state.qualities.barons_dissent = 95;
  choose('cheat_menu.factions');
  choose('cheat_menu.faction_barons');
  choose('cheat_menu.faction_strength_up');
  assert.strictEqual(engine.state.qualities.barons_strength, 100);
  choose('cheat_menu.faction_dissent_down');
  assert.strictEqual(engine.state.qualities.barons_dissent, 85);
  choose('cheat_menu.faction_loyal_dominant');
  assert.strictEqual(engine.state.qualities.barons_strength, 100);
  assert.strictEqual(engine.state.qualities.barons_dissent, 0);
  choose('cheat_menu.factions');
  choose('cheat_menu');
  choose('cheat_menu.god_mode');
  assert.strictEqual(engine.state.qualities.resources, 99);
  assert.strictEqual(engine.state.qualities.left_poll, 35);
  assert.strictEqual(engine.state.qualities.party_unity, 100);
  choose('cheat_menu.disable');
  assert.strictEqual(engine.state.qualities.cheat_enabled, 0);
  assert(!engine.getCurrentChoices().some(function(choice) {
    return choice.id === 'poland_hub.cheats';
  }));
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

  function completeLegislativeVote(useBargain) {
    assert.strictEqual(
      engine.state.sceneId,
      'poland_legislative_vote.forecast'
    );
    if (useBargain) {
      const bargain = currentChoices().find(function(choice) {
        return choice.id === 'poland_legislative_vote.bargain';
      });
      if (bargain && bargain.canChoose) {
        choose(bargain.id);
      }
    }
    choose('poland_legislative_vote.hold_vote');
    if (!engine.state.qualities.legvote_sejm_passed) {
      choose('poland_legislative_vote.finish_failed');
    } else {
      choose('poland_legislative_vote.senate_vote');
      if (
        engine.state.qualities.legvote_senate_decision !==
        'Accepted without amendment'
      ) {
        choose('poland_legislative_vote.senate_return');
      }
      if (
        engine.state.qualities.legvote_senate_decision ===
          'Accepted without amendment' ||
        engine.state.qualities.legvote_survived_senate
      ) {
        assert.strictEqual(
          engine.state.qualities.legvote_survived_senate,
          1,
          'a bill sent to the President must have survived the Senate'
        );
        choose('poland_legislative_vote.president');
        if (engine.state.qualities.legvote_president_veto) {
          chooseFirstAvailable([
            'poland_legislative_vote.override_veto',
            'poland_legislative_vote.accept_veto',
          ]);
        } else {
          choose('poland_legislative_vote.finish_enacted');
        }
      } else {
        choose('poland_legislative_vote.finish_failed');
      }
    }
    chooseFirstAvailable([
      'poland_legislative_vote.finish_callback',
      'poland_legislative_vote.finish_queue',
    ]);
  }

  function returnToHub() {
    choose('poland_hub');
    assert.strictEqual(engine.state.sceneId, 'poland_hub', JSON.stringify({
      budgetYear: engine.state.qualities.annual_budget_year,
      budgetResult: engine.state.qualities.annual_budget_result,
      budgetVote: [
        engine.state.qualities.annual_budget_yes,
        engine.state.qualities.annual_budget_no,
        engine.state.qualities.annual_budget_abstain,
      ],
      deadline: [
        engine.state.qualities.budget_deadline_active,
        engine.state.qualities.budget_deadline_time,
        engine.state.qualities.time,
      ],
      snapRequested: engine.state.qualities.snap_election_requested,
    }));
  }

  function resolveLeftRevolt() {
    if (engine.state.sceneId === 'poland_merger_events.pps_democratic_split') {
      chooseFirstAvailable([
        'poland_merger_events.pps_associate',
        'poland_merger_events.pps_accept_split',
        'poland_merger_events.pps_membership_settlement',
        'poland_merger_events.revolt_restore_miller',
        'poland_merger_events.pps_crush',
      ]);
    } else {
      assert.strictEqual(
        engine.state.sceneId,
        'poland_merger_events.left_revolt_live'
      );
      chooseFirstAvailable([
        'poland_merger_events.revolt_mediate',
        'poland_merger_events.revolt_ballot',
        'poland_merger_events.revolt_suspend',
      ]);
    }
    choose('poland_hub');
    if (engine.state.sceneId ===
        'poland_porozumienie_war.kukiz_negotiation') {
      choose('poland_porozumienie_war.kukiz_stand_aside');
      choose('poland_porozumienie_war.kukiz_resolution');
      choose('poland_hub');
    }
    if (engine.state.sceneId === 'poland_kwasniewski.congress_2021') {
      chooseFirstAvailable([
        'poland_kwasniewski.congress_concede',
        'poland_kwasniewski.congress_answer',
        'poland_kwasniewski.congress_break',
      ]);
      choose('poland_hub');
    }
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
      game.scenes.poland_foreign_deck,
      undefined,
      'Foreign Affairs should no longer be a separate deck'
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
    const qualities = engine.state.qualities;
    const plainBand = function(value, qdisplay) {
      return engine._getQDisplay(value, qdisplay).replace(/<[^>]+>/g, '');
    };
    assert.deepStrictEqual(
      ['barons', 'spring', 'progressives', 'razem', 'pps'].map(function(id) {
        return plainBand(qualities[id + '_strength'], 'strength') + '/' +
          plainBand(qualities[id + '_dissent'], 'dissent');
      }),
      [
        'very strong/low',
        'strong/medium',
        'very weak/low',
        'weak/high',
        'very weak/medium',
      ]
    );
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
    const stablePoliticalState = function(source) {
      return Object.fromEntries(
        Object.entries(source)
          .filter(function(entry) {
            return !entry[0].startsWith('poland_discard_');
          })
          .map(function(entry) {
            return [
              entry[0],
              typeof entry[1] === 'number'
                ? Number(entry[1].toFixed(12))
                : entry[1],
            ];
          })
      );
    };
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
      stablePoliticalState(
        JSON.parse(JSON.stringify(engine.state.qualities))
      ),
      stablePoliticalState(emptyQualities),
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
    // This fixture isolates ministry-owned cards from programme cards, whose
    // gate is constituent strength or a completed New Left merger.
    qualities.barons_strength = 0;
    qualities.spring_strength = 0;
    qualities.pps_strength = 0;
    qualities.razem_strength = 0;
    qualities.nowa_lewica_merger_agreed = 0;
    qualities.left_common_party_exists = 0;
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
      !foreignMinistryTags.includes('poland_party_card'),
      'The Foreign Ministry portfolio card leaked into Party Affairs'
    );

    ministryPortfolioCases.forEach(function(testCase) {
      qualities[testCase.portfolio + '_minister_party'] = 'Unassigned';
    });
    qualities.labor_minister_party = 'Lewica';
    qualities.ministry_count = 1;
    engine.goToScene('poland_hub');
    const partyCard = drawFromDeck('poland_party_deck');
    const governmentCard = drawFromDeck('poland_government_deck');
    const governmentCardTags = game.scenes[governmentCard.id].tags || [];
    assert(
      expectedGovernmentCardIds.includes(governmentCard.id) ||
        governmentCardTags.includes('poland_major_reform_card')
    );
    qualities.left_in_government = 0;
    engine.goToScene('poland_hub');
    const expectedOppositionHand = [partyCard.id];
    if (governmentCardTags.includes('poland_major_reform_card')) {
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

  function testPressureAndRadicalisation() {
    // Unanswered policy pressure must do three things: decay, drive the
    // radicalisation transfer, and open a pressure event that a real answer
    // then closes. Anything less and the opposition ledgers are decoration.
    startStandard('pressure-ledger');
    const qualities = engine.state.qualities;
    qualities.year = 2024;
    qualities.month = 7;
    qualities.health_policy_pressure = 40;
    qualities.household_policy_pressure = 30;
    engine.goToScene('poland_advance');
    qualities.year = 2024;
    qualities.month = 7;
    engine.goToScene('poland_normalize');
    assert(
      qualities.health_pressure_unmet >= 20,
      'Unanswered health demand did not reach the grievance ledger'
    );
    assert(
      qualities.social_grievance > 0 && qualities.radicalisation_index > 0,
      'Unanswered demand did not raise grievance and radicalisation'
    );
    assert.strictEqual(
      qualities.pressure_top_domain,
      'health',
      'The loudest unanswered demand was not selected for an event'
    );

    // Delivering the answer must pull the same numbers back down.
    const radicalPeak = qualities.radicalisation_index;
    qualities.health_capacity = 85;
    qualities.household_security = 80;
    qualities.public_trust = 65;
    qualities.institutional_trust = 65;
    engine.goToScene('poland_normalize');
    assert(
      qualities.radicalisation_index < radicalPeak,
      'Delivery and trust did not reduce radicalisation'
    );

    // Monthly decay is real, so nothing ratchets for ever.
    qualities.health_capacity = 48;
    qualities.household_security = 45;
    const beforeDecay = qualities.health_policy_pressure;
    engine.goToScene('poland_advance');
    assert(
      qualities.health_policy_pressure < beforeDecay,
      'Policy pressure did not decay across a month'
    );

    // Campaign posture does not ratchet either: the excess above the party's
    // unassisted baseline erodes, while a ledger already below it is left for
    // play to repair rather than being pushed further down.
    qualities.public_trust = 90;
    qualities.media_capacity = 90;
    qualities.local_network = 90;
    qualities.progressives_strength = 0;
    qualities.progressive_credibility = 30;
    engine.goToScene('poland_advance');
    assert(
      qualities.public_trust < 90 &&
        qualities.media_capacity < 90 &&
        qualities.local_network < 90,
      'High campaign posture did not decay across a month'
    );
    assert(
      qualities.progressive_credibility >= 30,
      'Posture decay pushed a below-baseline ledger further down'
    );

    // The event fires, and funding the settlement closes the demand.
    startStandard('pressure-event');
    const q2 = engine.state.qualities;
    q2.year = 2024;
    q2.month = 7;
    q2.health_policy_pressure = 45;
    q2.left_in_government = 1;
    q2.government_has_confidence = 1;
    q2.caretaker_government = 0;
    q2.government_party = 'ko';
    q2.ministries_finalized = 1;
    q2.ministry_count = 2;
    q2.health_minister_party = 'Lewica';
    q2.budget = 6;
    engine.goToScene('poland_advance');
    q2.year = 2024;
    q2.month = 7;
    engine.goToScene('poland_normalize');
    const pending = (engine._compileChoices(
      game.scenes['poland_event_queue.all_events']
    ) || []).map(function(choice) {
      return choice.id;
    });
    assert(
      pending.includes('poland_pressure_events.health_strike'),
      'Unanswered health demand did not open the strike event'
    );
    engine.goToScene('poland_pressure_events.health_strike');
    const pressureBefore = q2.health_policy_pressure;
    choose('poland_pressure_events.health_settlement');
    assert(
      q2.health_policy_pressure <= pressureBefore - 20,
      'A funded settlement did not answer the health demand'
    );
    assert.strictEqual(
      q2.government_goal_health,
      2,
      'A funded settlement did not record full delivery credit'
    );

    // Junior-partner authority: a written dispute protocol lowers the risk of
    // being overruled, which is what makes the formation bargain worth buying.
    q2.government_coalition_dissent = 30;
    q2.ko_relation = 25;
    q2.coalition_dispute_protocol = 0;
    engine.goToScene('poland_normalize');
    assert.strictEqual(
      q2.left_is_junior_partner,
      1,
      'A Lewica ministry under a KO premiership is not marked junior'
    );
    const riskWithout = q2.coalition_objection_risk;
    q2.coalition_dispute_protocol = 1;
    engine.goToScene('poland_normalize');
    assert(
      q2.coalition_objection_risk < riskWithout,
      'The written dispute protocol did not reduce the objection risk'
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
    // Goal credit is tiered: a funded programme records 2, a cheaper or
    // overruled version records 1. Either satisfies the burden goal.
    assert(
      qualities.government_goal_health >= 1,
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
    assert.strictEqual(
      qualities.left_poll,
      favourablePoll,
      'Cards must not duplicate the later mood-to-poll conversion'
    );
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
    assert.strictEqual(
      qualities.left_poll,
      hostilePoll,
      'Hostile reception must reach polling through issue reception only'
    );
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
    assert(
      qualities.refugee_solidarity_salience <= refugeeSalience &&
        qualities.refugee_solidarity_backlash <= refugeeBacklash,
      'The diagnostic bridge still applied an additive public-mood shift'
    );
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
        scene: 'poland_merger_events.merger',
        choice: 'poland_merger_events.merger_central',
        gain: 2,
      },
      {
        // @rename is a dispatcher: it routes to rename_party, rename_federation
        // or rename_separate. Only the common-party branch offers rename_drive.
        scene: 'poland_merger_events.rename_party',
        choice: 'poland_merger_events.rename_drive',
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
    engine.state.qualities.progressives_strength = 12;
    engine.goToScene('poland_faction_congress');
    checkNumbers();
    assert.strictEqual(engine.state.sceneId, 'poland_faction_congress');
    choose('poland_faction_congress.progressive_timetable');
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
    assert.strictEqual(engine.state.sceneId, 'poland_primary.ballot');
    assert.strictEqual(qualities.primary_access_code, 2);
    assert.strictEqual(qualities.presidential_candidate, 'Undecided');

    // @ballot presents the qualified field before the campaign arena is chosen.
    choose('poland_primary.campaign');
    assert.strictEqual(engine.state.sceneId, 'poland_primary.campaign');
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

  function testLegislativeVoteRouter() {
    ['rights_fracture', 'legalist_fracture', 'rights_result'].forEach(
      function(sceneId) {
        assert.deepStrictEqual(
          (game.scenes['poland_trzaskowski.' + sceneId].options || []).map(
            function(option) { return option.id; }
          ),
          ['@poland_events.dworczyk_hack_2021'],
          sceneId + ' can skip the mandatory Dworczyk leak'
        );
      }
    );

    startStandard('legislative-router-bargain');
    let qualities = engine.state.qualities;
    qualities.resources = 5;
    qualities.psl_relation = 60;
    qualities.legvote_bill_name = 'Marriage-equality test bill';
    qualities.legvote_profile = 'marriage';
    qualities.legvote_callback = 'test';
    qualities.legvote_president_commitment = 0;
    qualities.legvote_campaign_bonus = 0;
    qualities.legvote_palace_bonus = 0;
    qualities.legvote_prepared = 0;
    engine.goToScene('poland_legislative_vote');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_legislative_vote.forecast'
    );
    const forecastBefore = qualities.legvote_forecast_yes;
    choose('poland_legislative_vote.bargain');
    assert(qualities.legvote_bargain_gain > 0);
    assert.strictEqual(
      qualities.legvote_forecast_yes,
      forecastBefore + qualities.legvote_bargain_gain
    );

    startStandard('legislative-router-veto-override');
    qualities = engine.state.qualities;
    qualities.left_seats = 60;
    qualities.left_splinter_support_votes = 0;
    qualities.ko_seats = 150;
    qualities.p2050_seats = 40;
    qualities.psl_seats = 40;
    qualities.pis_seats = 150;
    qualities.konf_seats = 20;
    qualities.sejm_total = 460;
    qualities.president_name = 'Andrzej Duda';
    qualities.president_relation = 0;
    qualities.pres_2025_hostile_president = 1;
    qualities.legvote_bill_name = 'Institutional-repair test bill';
    qualities.legvote_profile = 'institutions';
    qualities.legvote_callback = 'test';
    qualities.legvote_president_commitment = 0;
    qualities.legvote_campaign_bonus = 2;
    qualities.legvote_palace_bonus = 0;
    qualities.legvote_prepared = 0;
    engine.goToScene('poland_legislative_vote');
    choose('poland_legislative_vote.hold_vote');
    assert(qualities.legvote_sejm_passed);
    assert(
      qualities.legvote_sejm_yes >= 276,
      'Override fixture produced only ' + qualities.legvote_sejm_yes +
        ' yes votes from ' + JSON.stringify({
          left: qualities.legvote_left_seats,
          ko: qualities.legvote_ko_seats,
          p2050: qualities.legvote_p2050_seats,
          psl: qualities.legvote_psl_seats,
          pis: qualities.legvote_pis_seats,
          konf: qualities.legvote_konf_seats,
          other: qualities.legvote_other_seats,
        })
    );
    choose('poland_legislative_vote.senate_vote');
    if (qualities.legvote_senate_decision !== 'Accepted without amendment') {
      choose('poland_legislative_vote.senate_return');
    }
    assert(
      qualities.legvote_senate_decision === 'Accepted without amendment' ||
        qualities.legvote_survived_senate
    );
    choose('poland_legislative_vote.president');
    assert.strictEqual(qualities.legvote_president_veto, 1);
    assert.strictEqual(qualities.legvote_override_available, 1);
    choose('poland_legislative_vote.override_veto');
    assert.strictEqual(qualities.legvote_enacted, 1);
    assert.strictEqual(qualities.legvote_veto_overridden, 1);

    startStandard('legislative-router-trzaskowski-event');
    qualities = engine.state.qualities;
    qualities.trz_abortion_signature = 1;
    qualities.trz_right_fragmentation = 100;
    qualities.president_name = 'Rafał Trzaskowski';
    engine.goToScene('poland_trzaskowski.rights_vote');
    choose('poland_trzaskowski.rights_vote_abortion');
    completeLegislativeVote();
    assert.strictEqual(engine.state.sceneId, 'poland_trzaskowski.rights_fracture');
    assert.strictEqual(qualities.trz_rights_bill_outcome, 'Passed and signed');
    assert.strictEqual(qualities.abortion_law_enacted, 1);
    assert.deepStrictEqual(
      [
        qualities.legvote_sejm_yes,
        qualities.legvote_sejm_no,
        qualities.legvote_sejm_abstain,
        qualities.legvote_pis_yes,
        qualities.legvote_pis_abstain,
      ],
      [225, 223, 12, 33, 8],
      'The abortion freebie was not a narrow passage with bounded PiS rebels'
    );
    assert.strictEqual(qualities.trz_pis_vote_rebels, 41);
    assert.strictEqual(qualities.trz_pis_suspensions, 6);
    assert(
      contentText(engine.state.currentContent).includes(
        'Expelling the rebels would cost Morawiecki his majority'
      ),
      'The rights aftermath did not explain why discipline amounted to nothing'
    );
    engine.goToScene('poland_normalize');
    assert.strictEqual(
      qualities.abortion_on_slate,
      0,
      'Trzaskowski\'s one-off bill silently consumed a Major Reform slot'
    );
    assert.strictEqual(qualities.reform_slate_count, 0);
    assert.strictEqual(
      game.scenes['poland_reform_slate.pick_abortion'].viewIf(engine, qualities),
      false,
      'An externally settled law remained selectable as a new Major Reform'
    );
    qualities.month_actions = 0;
    qualities.poland_abortion_reform_timer = 0;
    assert(
      !drawableCardIds('poland_major_reform_deck').includes(
        'poland_abortion_reform'
      ),
      'The Trzaskowski bill appeared as an unpicked Major Reform project'
    );

    startStandard('legislative-router-trzaskowski-no-fracture');
    qualities = engine.state.qualities;
    qualities.trz_abortion_signature = 1;
    qualities.trz_right_fragmentation = 0;
    qualities.president_name = 'Rafał Trzaskowski';
    engine.goToScene('poland_trzaskowski.rights_vote');
    choose('poland_trzaskowski.rights_vote_abortion');
    assert.strictEqual(qualities.legvote_forecast_passed, 0);
    assert.strictEqual(qualities.legvote_forecast_yes, 201);
    assert.strictEqual(qualities.legvote_forecast_no, 244);

    startStandard('legislative-router-trzaskowski-legalist-no-fracture');
    qualities = engine.state.qualities;
    qualities.trz_right_fragmentation = 0;
    qualities.president_name = 'Rafał Trzaskowski';
    engine.goToScene('poland_trzaskowski.rights_vote');
    choose('poland_trzaskowski.rights_vote_institutions');
    assert.strictEqual(qualities.legvote_forecast_passed, 0);
    assert.strictEqual(qualities.legvote_forecast_yes, 222);
    assert.strictEqual(qualities.legvote_forecast_no, 225);

    startStandard('legislative-router-trzaskowski-legalist');
    qualities = engine.state.qualities;
    qualities.trz_right_fragmentation = 100;
    qualities.president_name = 'Rafał Trzaskowski';
    engine.goToScene('poland_trzaskowski.rights_vote');
    choose('poland_trzaskowski.rights_vote_institutions');
    completeLegislativeVote();
    assert.strictEqual(engine.state.sceneId, 'poland_trzaskowski.legalist_fracture');
    assert.deepStrictEqual(
      [
        qualities.legvote_sejm_yes,
        qualities.legvote_sejm_no,
        qualities.legvote_sejm_abstain,
        qualities.legvote_pis_yes,
      ],
      [226, 225, 9, 28],
      'The legalist freebie did not keep its narrow, broader PiS coalition'
    );
    assert.strictEqual(qualities.trz_pis_suspensions, 3);
    assert(
      contentText(engine.state.currentContent).includes(
        'PiS cannot afford to turn a dispute over courts'
      ),
      'The legalist aftermath did not explain why discipline amounted to nothing'
    );

    startStandard('legislative-router-movement-event');
    qualities = engine.state.qualities;
    qualities.ko_seats = 200;
    qualities.p2050_seats = 50;
    qualities.psl_seats = 50;
    qualities.pis_seats = 100;
    qualities.konf_seats = 11;
    qualities.president_name = 'Andrzej Duda';
    qualities.president_relation = 0;
    qualities.pres_2025_hostile_president = 1;
    qualities.local_network = 70;
    qualities.movement_leverage = 65;
    engine.goToScene('poland_events_2025.movement_spring_roll_call');
    completeLegislativeVote();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.movement_spring_vote_result'
    );
    assert.strictEqual(qualities.abortion_spring_passed, 1);
    assert.strictEqual(qualities.legvote_veto_overridden, 1);
    assert.strictEqual(qualities.abortion_law_enacted, 1);
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
    startStandard('shared-budget-senate-stage');
    const qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2024,
      month: 12,
      annual_budget_year: 2024,
      left_in_government: 1,
      government_party: 'lewica',
      prime_minister_party: 'lewica',
      finance_minister_party: 'Lewica',
      government_has_confidence: 1,
      caretaker_government: 0,
      government_support_seats: 260,
      coalition_seats: 260,
      left_seats: 260,
      senate_total: 100,
      senate_government_seats: 45,
      senate_ko_seats: 40,
    });
    engine.goToScene('poland_budget_2023_2026.annual_budget');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_budget_2023_2026.budget_open'
    );
    qualities.government_support_seats = 260;
    qualities.coalition_seats = 260;
    qualities.left_seats = 260;
    assert.strictEqual(globalThis.polandBudgetModel.version, 4);
    const first = globalThis.polandBudgetModel.preview(qualities);
    assert(first.affordable);
    assert(first.vote.passed);
    choose('poland_budget_2023_2026.submit_budget');
    assert.strictEqual(engine.state.sceneId, 'poland_budget_2023_2026.senate');
    assert.deepStrictEqual(
      currentChoices().map(function(choice) { return choice.id; }),
      [
        'poland_budget_2023_2026.senate_accept',
        'poland_budget_2023_2026.senate_compromise',
        'poland_budget_2023_2026.senate_reject',
      ]
    );
    choose('poland_budget_2023_2026.senate_accept');
    assert.strictEqual(engine.state.sceneId, 'poland_budget_2023_2026.enact');
    assert.strictEqual(qualities.annual_budget_passed, 1);
    assert.strictEqual(qualities.budget_execution_pending, 1);
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
      Object.assign(budget, {
        year: 2024,
        annual_budget_year: 2024,
        left_in_government: 1,
        government_has_confidence: 1,
        caretaker_government: 0,
        government_party: 'ko',
        prime_minister_party: 'ko',
        finance_minister_party: 'Lewica',
        government_support_seats: 260,
        coalition_seats: 260,
        left_seats: 60,
        ko_seats: 200,
        ministry_ko_in_cabinet: 1,
        senate_total: 100,
        senate_government_seats: 100 - rightSeats,
        senate_pis_seats: rightSeats,
        senate_ko_seats: 100 - rightSeats,
        senate_left_seats: 0,
      });
      engine.goToScene('poland_budget_2023_2026.annual_budget');
      budget.budget_game.sejm = {
        yes: sejmYes,
        no: 460 - sejmYes,
        abstain: 0,
        present: 460,
        passed: true,
      };
      engine.goToScene('poland_budget_2023_2026.senate');
      return budget;
    };

    qualities = openGovernmentSenate(
      'friendly-government-senate',
      40,
      235
    );
    assert.strictEqual(
      globalThis.polandBudgetModel.senatePreview(qualities).target,
      ''
    );
    assert(globalThis.polandBudgetModel.resolveSenate(qualities, 'accept'));

    qualities = openGovernmentSenate(
      'hostile-government-senate-adheres',
      55,
      235
    );
    const hostileSenate =
      globalThis.polandBudgetModel.senatePreview(qualities);
    assert(hostileSenate.target);
    assert.strictEqual(hostileSenate.amendmentParty, 'pis');
    assert(globalThis.polandBudgetModel.resolveSenate(qualities, 'accept'));

    qualities = openGovernmentSenate(
      'hostile-government-senate-no-override',
      55,
      230
    );
    assert.strictEqual(
      globalThis.polandBudgetModel.resolveSenate(qualities, 'reject'),
      false
    );
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
    const sourceParties = [
      'left', 'pis', 'ko', 'psl', 'konf', 'p2050', 'p0', 'other',
    ];
    const parties = pollingPartyIds;
    const intentTotal = qualities.nationwide_vote_intent_total;
    const headlineTotal = qualities.nationwide_poll_total;
    const projectionComponents = parties.filter(function(party) {
      return !['left_coalition', 'democratic_list', 'third_way'].includes(
        party
      );
    });
    const projectedTotal = projectionComponents.reduce(function(total, party) {
      return total + qualities[party + '_projected_seats'];
    }, 0);

    assert(
      Math.abs(intentTotal - 100) <= 0.12,
      'Likely-voter intentions do not sum to 100: ' + intentTotal +
        (options && options.context ? ' after ' + options.context : '') +
        ' (' + parties.map(function(party) {
          return party + '=' + qualities[party + '_vote_intent'];
        }).join(', ') + ')'
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
      'National d’Hondt projection does not allocate all Sejm seats' +
        (options && options.context ? ' after ' + options.context : '') +
        ' (' + parties.map(function(party) {
          return party + '=' + qualities[party + '_projected_seats'];
        }).join(', ') + ')'
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
      const blocShareTotal = sourceParties.reduce(function(total, party) {
        return total + qualities[bloc + '_' + party];
      }, 0);
      assert(
        Math.abs(blocShareTotal - 100) < 0.000001,
        bloc + ' party shares do not sum to 100: ' + blocShareTotal
      );
      sourceParties.forEach(function(party) {
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
      'poland_gowin_crisis.postal_crisis',
      'poland_events.shield',
    ]);
    const abortionCrisis = governmentCrisisPoll([
      'poland_events.abortion',
      'poland_events.strike',
    ]);
    const combined2020Crisis = governmentCrisisPoll([
      'poland_events.covid',
      'poland_gowin_crisis.postal_crisis',
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

    const namedPisControversies = governmentCrisisPoll([
      'poland_events.nik_banas_2019',
      'poland_events.marshal_2019',
      'poland_events.nik_removal_2020',
      'poland_events.ventilators_2020',
      'poland_events.animals_2020',
      'poland_events.churches_2020',
      'poland_events.eu_budget_veto_2020',
      'poland_events.dworczyk_hack_2021',
      'poland_events_2021_2023.dec21_media',
      'poland_events_2021_2023.dec21_pegasus',
      'poland_events_2021_2023.january_2022',
      'poland_events_2021_2023.august_2022',
      'poland_events_2023_2024.september_visa',
    ]);
    assert(
      Math.abs(namedPisControversies.momentum + 4.85) < 0.000001,
      'Named early PiS controversies did not reach PiS momentum'
    );
    assert(
      noGovernmentCrisis.governmentPoll -
        namedPisControversies.governmentPoll >= 2,
      'Named early PiS controversies did not lower its polling'
    );

    const noKoCrisis = governmentCrisisPoll([], 'ko');
    const koPandemicCrisis = governmentCrisisPoll([
      'poland_events.covid',
      'poland_gowin_crisis.postal_crisis',
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

    const democraticControversyPoll = function(scenes) {
      startStandard('democratic-camp-controversy-poll');
      const camp = engine.state.qualities;
      Object.assign(camp, {
        year: 2024,
        month: 11,
        date_label: 'November 2024',
        government_party: 'ko',
        pm_political_family: 'ko',
        caretaker_government: 0,
        left_in_government: 1,
        ministry_ko_in_cabinet: 1,
        ministry_psl_in_cabinet: 1,
        ministry_p2050_in_cabinet: 1,
        p2050_emerged: 1,
        poll_state_month_key: -1,
      });
      scenes.forEach(function(sceneId) {
        engine.goToScene(sceneId);
      });
      const momentum = ['ko', 'left', 'psl', 'p2050'].reduce(
        function(result, party) {
          result[party] = camp[party + '_poll_momentum'];
          return result;
        }, {}
      );
      camp.poll_state_month_key = -1;
      engine.goToScene('poland_polling');
      return {
        momentum: momentum,
        poll: camp.ko_poll + camp.left_poll +
          camp.psl_poll + camp.p2050_poll,
      };
    };
    const cleanDemocraticCamp = democraticControversyPoll([]);
    const controversialDemocraticCamp = democraticControversyPoll([
      'poland_events_2023_2024.media_fast',
      'poland_events_2023_2024.republika_pressure',
      'poland_events_2023_2024.romanowski_immunity_2024',
      'poland_events_2023_2024.migration_pivot_2024',
    ]);
    const expectedCampMomentum = {
      ko: -1.6,
      left: -0.6,
      psl: -0.4,
      p2050: -0.4,
    };
    Object.keys(expectedCampMomentum).forEach(function(party) {
      assert(
        Math.abs(
          controversialDemocraticCamp.momentum[party] -
            expectedCampMomentum[party]
        ) < 0.000001,
        party + ' did not share the democratic-camp controversy cost'
      );
    });
    assert(
      cleanDemocraticCamp.poll - controversialDemocraticCamp.poll >= 1,
      'KO controversies did not lower combined democratic-camp polling: ' +
        JSON.stringify({
          clean: cleanDemocraticCamp.poll,
          controversial: controversialDemocraticCamp.poll,
        })
    );
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
    thirdWay.konf_poll_momentum = 30;
    thirdWay.psl_poll_momentum = 30;
    thirdWay.p2050_poll_momentum = 30;
    thirdWay.poll_state_month_key = -1;
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(thirdWay.third_way_joint_list, 1);
    assert.strictEqual(thirdWay.third_way_threshold, 8);
    assert(thirdWay.konf_poll_resistance > 0);
    assert(thirdWay.third_way_poll_resistance > 0);
    assert(
      thirdWay.konf_vote_intent > 10,
      'An exceptional Konfederacja surge could not break 10%'
    );
    assert(
      thirdWay.third_way_vote_intent > 15,
      'An exceptional Third Way surge could not break 15%'
    );
    assert(
      Math.abs(
        thirdWay.third_way_vote_intent -
          thirdWay.psl_component_vote_intent -
          thirdWay.p2050_component_vote_intent
      ) < 0.000001,
      'Third Way components bypassed committee polling resistance'
    );
    assert.strictEqual(
      thirdWay.third_way_projected_seats,
      thirdWay.psl_projected_seats +
        thirdWay.p2050_projected_seats
    );
    thirdWay.month = 11;
    thirdWay.date_label = 'November 2023';
    thirdWay.election_2023_certified = 1;
    thirdWay.election_2023_konf_vote = 12.5;
    thirdWay.election_2023_third_way_vote = 17.5;
    thirdWay.poll_state_month_key = -1;
    engine.goToScene('poland_polling');
    assert.strictEqual(thirdWay.konf_poll_resistance_point, 12.5);
    assert.strictEqual(thirdWay.third_way_poll_resistance_point, 17.5);
    thirdWay.year = 2024;
    thirdWay.month = 2;
    thirdWay.date_label = 'February 2024';
    thirdWay.konf_vote_intent = 14;
    thirdWay.third_way_vote_intent = 19;
    thirdWay.poll_state_month_key = -1;
    engine.goToScene('poland_polling');
    assert(
      Math.abs(thirdWay.konf_poll_resistance_point - 13.025) < 0.011
    );
    assert(
      Math.abs(thirdWay.third_way_poll_resistance_point - 18.025) < 0.011
    );
    assert.strictEqual(
      thirdWay.poll_resistance_next_update_month,
      2024 * 12 + 5
    );
    thirdWay.month = 3;
    thirdWay.date_label = 'March 2024';
    thirdWay.third_way_split = 1;
    thirdWay.poll_state_month_key = -1;
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
    qualities.left_issue_reception_baseline = -999;
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
        leftFamily: qualities.left_family_vote_intent,
        fragmentationLoss: qualities.left_fragmentation_loss,
        razemParty: qualities.razem_party_formed,
        laborParty: qualities.labor_party_formed,
        progressiveParty: qualities.progressives_party_formed,
        leftCalibration: qualities.poll_calibration_left,
        radicalisation: qualities.radicalisation_transfer_last,
        economicPenalty: qualities.government_economic_poll_penalty,
        leftMomentum: qualities.left_poll_momentum,
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
      distressedKo.konf - healthyKo.konf >= 0.5,
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
    assert(
      qualities.konf_resource_business_support >
        qualities.ko_resource_business_support &&
      qualities.ko_resource_business_support >
        qualities.psl_resource_business_support &&
      qualities.psl_resource_business_support >
        qualities.pis_resource_business_support,
      'Market positioning did not produce proportionate business support'
    );
    assert.strictEqual(qualities.pis_resource_media_support, 8);
    assert.strictEqual(qualities.ko_resource_media_support, 8);
    assert.strictEqual(qualities.psl_resource_media_support, 0);
    assert.strictEqual(qualities.konf_resource_media_support, 0);
    assert.strictEqual(qualities.pis_resource_president_support, 10);
    assert.strictEqual(qualities.pis_resource_pm_support, 12);
    assert.strictEqual(qualities.pis_resource_marshal_support, 8);
    assert(
      qualities.pis_resource_parliament_support >
        qualities.ko_resource_parliament_support &&
      qualities.ko_resource_parliament_support >
        qualities.psl_resource_parliament_support &&
      qualities.psl_resource_parliament_support >
        qualities.konf_resource_parliament_support,
      'Sejm size was not preserved by resource normalization'
    );
    assert(
      qualities.pis_resource_poll_support >
        qualities.ko_resource_poll_support &&
      qualities.ko_resource_poll_support >
        qualities.psl_resource_poll_support &&
      qualities.psl_resource_poll_support >
        qualities.konf_resource_poll_support,
      'Current polling was not preserved by resource normalization'
    );
    assert(
      qualities.pis_org_income > qualities.ko_org_income &&
      qualities.ko_org_income > qualities.psl_org_income &&
      qualities.psl_org_income > qualities.konf_org_income,
      'Opening rival income did not reflect the normalized resource order'
    );
    assert.strictEqual(qualities.p2050_resource_score, 0);
    assert.strictEqual(qualities.p2050_org_income, 0);
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
    const previousIncomeMonth = qualities.rival_income_last_month_index;
    const incomeMonthsElapsed = Math.min(
      24,
      qualities.year * 12 + qualities.month - previousIncomeMonth
    );
    const annualIncome = {};
    ['pis', 'ko', 'psl', 'konf'].forEach(function(party) {
      qualities[party + '_org_resources'] = 0;
      annualIncome[party] = qualities[party + '_org_income'];
    });
    engine.goToScene('poland_party_ai');
    checkNumbers();
    const maintenanceRecovery = {pis: 0.25, ko: 0.22, psl: 0.25, konf: 0.24};
    ['pis', 'ko', 'psl', 'konf'].forEach(function(party) {
      assert.strictEqual(
        qualities[party + '_org_resources'] +
          qualities[party + '_ai_last_spend'],
        annualIncome[party] * incomeMonthsElapsed / 12 +
          (qualities[party + '_ai_acted'] ? 0 : maintenanceRecovery[party]),
        party + ' monthly organisational accrual drifted'
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

    qualities.year = 2023;
    qualities.month = 12;
    qualities.president_name = 'Szymon Hołownia';
    qualities.president_party = 'p2050';
    qualities.prime_minister = 'Donald Tusk';
    qualities.pm_political_family = 'ko';
    qualities.sejm_speaker = 'Marek Sawicki';
    // Deliberately stale: the live office holder must win over this old field.
    qualities.sejm_speaker_party = 'pis';
    qualities.government_party = 'ko';
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.ministry_ko_in_cabinet = 1;
    qualities.ministry_psl_in_cabinet = 1;
    qualities.ministry_p2050_in_cabinet = 1;
    qualities.third_way_active = 1;
    qualities.third_way_split = 0;
    engine.goToScene('poland_party_ai');
    ['ko', 'psl', 'p2050'].forEach(function(party) {
      assert.strictEqual(qualities[party + '_resource_president_support'], 10);
      assert.strictEqual(qualities[party + '_resource_pm_support'], 12);
      assert.strictEqual(qualities[party + '_resource_marshal_support'], 8);
    });
    assert.strictEqual(qualities.pis_resource_president_support, 0);
    assert.strictEqual(qualities.pis_resource_pm_support, 0);
    assert.strictEqual(qualities.pis_resource_marshal_support, 0);

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
    leftPressure.rival_ai_initialized = 1;
    leftPressure.rival_ai_monthly_income_migrated = 1;
    leftPressure.rival_income_last_month_index =
      leftPressure.year * 12 + leftPressure.month;
    ['pis', 'ko', 'psl', 'konf'].forEach(function(party) {
      leftPressure[party + '_org_resources'] = 0;
    });
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
    rightPressure.rival_ai_initialized = 1;
    rightPressure.rival_ai_monthly_income_migrated = 1;
    rightPressure.rival_income_last_month_index =
      rightPressure.year * 12 + rightPressure.month;
    ['pis', 'ko', 'psl', 'konf'].forEach(function(party) {
      rightPressure[party + '_org_resources'] = 0;
    });
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
      'A Konf surge did not strengthen PSL conservatives: ' +
        JSON.stringify({
          before: rightBefore.pslConservative,
          after: rightPressure.psl_conservative_share,
          pendulum: rightPressure.party_system_pendulum,
          pslVote: rightPressure.psl_vote_intent,
          culturalSalience: rightPressure.cultural_issue_salience,
          pslAction: rightPressure.psl_ai_strategy,
        })
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
    proposalFit.constitutional_restraint = 63;
    engine.goToScene('poland_gowin_crisis.postal_crisis');
    let constitutionalBargain = currentChoices().find(function(choice) {
      return choice.id === 'poland_gowin_crisis.postal_constitutional';
    });
    assert(constitutionalBargain);
    assert.strictEqual(
      constitutionalBargain.canChoose,
      false,
      'Established restraint did not block an ad hoc constitutional bargain'
    );
    proposalFit.constitutional_restraint = 62;
    engine.goToScene('poland_gowin_crisis.postal_crisis');
    constitutionalBargain = currentChoices().find(function(choice) {
      return choice.id === 'poland_gowin_crisis.postal_constitutional';
    });
    assert.strictEqual(constitutionalBargain.canChoose, true);

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

  const presWinnerImages2020 = {
    'Andrzej Duda': 'img/poland/events/pres-candidate-duda-2020.webp',
    'Rafał Trzaskowski': 'img/poland/events/pres-candidate-trzaskowski.webp',
    'Małgorzata Kidawa-Błońska':
      'img/poland/events/pres-candidate-kidawa-2020.webp',
    'Szymon Hołownia':
      'img/poland/events/pres-candidate-holownia-2020.webp',
    'Krzysztof Bosak': 'img/poland/events/pres-candidate-bosak.webp',
    'Władysław Kosiniak-Kamysz':
      'img/poland/events/pres-candidate-kosiniak-2020.webp',
    'Robert Biedroń': 'img/poland/events/pres-candidate-biedron-2020.webp',
    'Adrian Zandberg': 'img/poland/events/adrian-zandberg-2020.webp',
    'Agnieszka Dziemianowicz-Bąk':
      'img/poland/cards/advisor-dziemianowicz-bak.webp',
    'Anna-Maria Żukowska': 'img/poland/cards/advisor-zukowska.webp',
    'Katarzyna Kotula': 'img/poland/cards/advisor-kotula.webp',
    'Magdalena Biejat': 'img/poland/cards/advisor-biejat.webp',
  };

  const presWinnerImages2025 = {
    'Rafał Trzaskowski':
      'img/poland/events/pres-candidate-trzaskowski-2025.webp',
    'Radosław Sikorski': 'img/poland/events/pres-candidate-sikorski.webp',
    'Barbara Nowacka': 'img/poland/events/pres-candidate-nowacka.webp',
    'Karol Nawrocki': 'img/poland/events/pres-candidate-nawrocki.webp',
    'Mateusz Morawiecki': 'img/poland/cards/advisor-morawiecki.webp',
    'Przemysław Czarnek': 'img/poland/events/pres-candidate-czarnek.webp',
    'Tobiasz Bocheński': 'img/poland/events/pres-candidate-bochenski.webp',
    'Magdalena Biejat':
      'img/poland/events/pres-candidate-biejat-2025.webp',
    'Agnieszka Dziemianowicz-Bąk':
      'img/poland/cards/advisor-dziemianowicz-bak.webp',
    'Adrian Zandberg':
      'img/poland/events/pres-candidate-zandberg-2025.webp',
    'Sławomir Mentzen':
      'img/poland/events/pres-candidate-mentzen-2025.webp',
    'Krzysztof Bosak': 'img/poland/events/pres-candidate-bosak.webp',
    'Grzegorz Braun': 'img/poland/events/grzegorz-braun-2025.webp',
    'Szymon Hołownia':
      'img/poland/events/pres-candidate-holownia-2025.webp',
    'Ryszard Petru': 'img/poland/events/pres-candidate-petru.webp',
    'Krzysztof Stanowski':
      'img/poland/events/pres-candidate-stanowski.webp',
  };

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
    assert.strictEqual(
      game.scenes['poland_presidential_election.first_count'].faceImage,
      qualities.pres_first_round_majority
        ? presWinnerImages2020[qualities.pres_runoff_winner_name]
        : 'img/poland/events/presidential-ballot-2020.webp'
    );
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
    assert(Number.isFinite(qualities.pres_runoff_target_leverage));
    assert(
      qualities.pres_runoff_target_leverage >= 0.25 &&
        qualities.pres_runoff_target_leverage <= 1,
      'Runoff campaign leverage escaped its electoral base'
    );
    if (qualities.pres_runoff_support_key !== 'left') {
      assert(
        qualities.pres_runoff_target_leverage < 1,
        'A minor Left first-round result carried full-ticket runoff weight'
      );
    }
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
    assert.strictEqual(
      game.scenes['poland_presidential_election.runoff_count'].faceImage,
      ['duda', 'bosak'].includes(qualities.pres_runoff_winner_key)
        ? 'img/poland/events/wajda.jpg'
        : presWinnerImages2020[qualities.pres_runoff_winner_name]
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
    choose('poland_presidential_election.debate_rights_health');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_presidential_election.debate_rights_health'
    );

    choose(settings.rights);
    assert.strictEqual(qualities.pres_debate_stops_remaining, 1);
    choose('poland_presidential_election.debate_economy_close');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_presidential_election.debate_economy_close'
    );

    choose(settings.close);
    assert.strictEqual(qualities.pres_debate_stops_remaining, 0);
    choose('poland_presidential_election.debate_verdict');
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
    const koProfile = engine.state.qualities.pres_2020_ko_kidawa
      ? 'poland_presidential_election.candidate_kidawa'
      : 'poland_presidential_election.candidate_trzaskowski';
    const sequence = [
      'poland_presidential_election.candidate_duda',
      koProfile,
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

  function runHistoricalPresidentialElection(seed, fightForTrzaskowski) {
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
    choose('poland_presidential_election.campaign_next');
    choose('poland_presidential_election.campaign_constitution');
    assert.strictEqual(qualities.pres_first_actions_remaining, 0);
    choose('poland_presidential_election.campaign_done');
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
    const rankedFinalists = [
      'duda',
      'trzaskowski',
      'holownia',
      'bosak',
      'kosiniak',
      'left',
    ].sort(function(a, b) {
      return qualities['pres_r1_raw_' + b] - qualities['pres_r1_raw_' + a];
    }).slice(0, 2).sort();
    assert.deepStrictEqual(
      [
        qualities.pres_finalist_a_key,
        qualities.pres_finalist_b_key,
      ].sort(),
      rankedFinalists,
      'The randomized 2020 finalists do not match the first-round ranking'
    );
    assert(
      rankedFinalists.includes('duda'),
      'The incumbent unexpectedly missed the historical-line runoff'
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
    choose(
      fightForTrzaskowski
        ? 'poland_presidential_election.endorse_accord'
        : 'poland_presidential_election.endorse_free'
    );
    choose('poland_presidential_election.support_market');
    chooseFirstAvailable(fightForTrzaskowski
      ? [
        'poland_presidential_election.support_holownia',
        'poland_presidential_election.support_movements',
      ]
      : ['poland_presidential_election.support_turnout']);
    assert.strictEqual(qualities.pres_support_actions_remaining, 1);
    choose('poland_presidential_election.support_next');
    chooseFirstAvailable(fightForTrzaskowski
      ? [
        'poland_presidential_election.support_movements',
        'poland_presidential_election.support_turnout',
      ]
      : ['poland_presidential_election.support_release']);
    assert.strictEqual(qualities.pres_support_actions_remaining, 0);
    choose('poland_presidential_election.support_done');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_presidential_election.runoff_poll'
    );
    assert.strictEqual(
      qualities.pres_runoff_poll_a + qualities.pres_runoff_poll_b,
      100
    );
    if (qualities.pres_runoff_support_key === 'trzaskowski') {
      if (fightForTrzaskowski) {
        assert.strictEqual(qualities.pres_razem_trzaskowski_reluctance, 20);
      } else {
        assert(
          qualities.pres_razem_trzaskowski_reluctance >= 50 &&
            qualities.pres_razem_trzaskowski_reluctance <= 70,
          'Unpromised Razem abstention escaped its 50-70% range'
        );
        assert(
          qualities.pres_transfer_left_target < 65,
          'A free vote transferred implausibly many Left voters to Trzaskowski'
        );
      }
    }
    choose(fightForTrzaskowski
      ? 'poland_presidential_election.final_push_gamble'
      : 'poland_presidential_election.final_push_safe');
    choose('poland_presidential_election.runoff_count');
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
    return {
      margin: qualities.pres_runoff_margin,
      winner: qualities.pres_runoff_winner_key,
    };
  }

  function testPresidentialElectionCorpora() {
    const leftResultAt = function(intent, candidate, candidateBase) {
      candidate = candidate || 'Adrian Zandberg';
      candidateBase = candidateBase || 3.2;
      startStandard(
        'presidential-left-conversion-' + intent + '-' + candidate
      );
      const qualities = engine.state.qualities;
      Object.assign(qualities, {
        presidential_candidate: candidate,
        presidential_candidate_base: candidateBase,
        left_vote_intent: intent,
        pres_first_calc_mode: 'first_result',
        pres_first_round_complete: 0,
        pres_ko_joint_candidate: 0,
        pres_breakout_key: 'none',
        pres_bonus_left: 3.4,
        pres_r1_turnout_shock: 0,
      });
      [
        'duda',
        'trzaskowski',
        'holownia',
        'bosak',
        'kosiniak',
        'left',
        'other',
      ].forEach(function(candidate) {
        qualities['pres_r1_shock_' + candidate] = 0;
      });
      engine.goToScene('poland_presidential_election.calculate_first');
      return qualities.presidential_result;
    };
    const squeezedLeft = leftResultAt(15);
    const breakthroughLeft = leftResultAt(18);
    const breakthroughBiedron = leftResultAt(18, 'Robert Biedroń', 2.2);
    const majorLeft = leftResultAt(40);
    assert(
      squeezedLeft < 7,
      'A sub-breakthrough Left campaign escaped the squeeze: ' +
        squeezedLeft + '%'
    );
    assert(
      breakthroughLeft >= 8,
      'An 18% Lewica could not earn Eight Is Enough: ' +
        breakthroughLeft + '%'
    );
    assert(
      breakthroughBiedron >= 8,
      'Biedroń could not earn Eight Is Enough at 18%: ' +
        breakthroughBiedron + '%'
    );
    assert(
      majorLeft >= 25,
      'A 40% Lewica still produced only ' + majorLeft + '% for Zandberg'
    );

    let historicalDudaWins = 0;
    let historicalTrzaskowskiWins = 0;
    let historicalHolowniaWins = 0;
    const historicalSeedCount = 100;
    for (let index = 0; index < historicalSeedCount; index += 1) {
      const result = runHistoricalPresidentialElection(
        'presidential-historical-' + index
      );
      if (result.winner === 'duda') {
        historicalDudaWins += 1;
      } else if (result.winner === 'trzaskowski') {
        historicalTrzaskowskiWins += 1;
      } else if (result.winner === 'holownia') {
        historicalHolowniaWins += 1;
      }
    }
    assert(
      historicalDudaWins >= 90,
      'Duda won only ' + historicalDudaWins +
        ' of ' + historicalSeedCount + ' historical-line seeds'
    );
    assert(
      historicalTrzaskowskiWins >= historicalHolowniaWins,
      'Passive play favoured Hołownia over Trzaskowski'
    );
    let fightDudaWins = 0;
    let fightTrzaskowskiWins = 0;
    let largestTrzaskowskiMargin = 0;
    for (let index = 0; index < 20; index += 1) {
      const result = runHistoricalPresidentialElection(
        'presidential-fight-for-trzaskowski-' + index,
        true
      );
      if (result.winner === 'duda') fightDudaWins += 1;
      if (result.winner === 'trzaskowski') {
        fightTrzaskowskiWins += 1;
        largestTrzaskowskiMargin = Math.max(
          largestTrzaskowskiMargin,
          result.margin
        );
      }
    }
    assert(
      fightTrzaskowskiWins > 0,
      'Maximum effort could not elect Trzaskowski'
    );
    assert(
      fightDudaWins > fightTrzaskowskiWins,
      'Trzaskowski stopped being the maximum-effort underdog'
    );
    assert(
      largestTrzaskowskiMargin <= 7,
      'Trzaskowski won a maximum-effort seed by an implausible landslide'
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
      choose('poland_presidential_election.campaign_next');
      choose('poland_presidential_election.campaign_work');
      choose('poland_presidential_election.campaign_done');
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
      choose('poland_presidential_election.support_market');
      choose('poland_presidential_election.support_ko');
      assert.strictEqual(qualities.pres_support_actions_remaining, 1);
      choose('poland_presidential_election.support_next');
      choose('poland_presidential_election.support_holownia');
      assert.strictEqual(qualities.pres_support_actions_remaining, 0);
      choose('poland_presidential_election.support_done');
      choose('poland_presidential_election.final_push_gamble');
      choose('poland_presidential_election.runoff_count');
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

    startStandard('presidential-august-race-0');
    let oathQualities = engine.state.qualities;
    Object.assign(oathQualities, {
      year: 2020,
      month: 8,
      p2050_foundation_2020_done: 0,
      pres_runoff_complete: 1,
      pres_runoff_winner_key: 'trzaskowski',
      trzaskowski_won: 1,
      trz_certification_event_done: 0,
      caucus_crisis_pending: 0,
    });
    engine.goToScene('poland_polling');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_leadership_events.p2050_foundation_2020',
      'Presidential certification raced ahead of the August event chain'
    );

    startStandard('presidential-oath-fallback');
    oathQualities = engine.state.qualities;
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
    assert.strictEqual(
      game.scenes[
        'poland_events_2025.presidential_runoff_2025'
      ].faceImage,
      ['right', 'mentzen', 'braun'].includes(
        oathQualities.pres_2025_winner_key
      )
        ? 'img/poland/events/wajda.jpg'
        : presWinnerImages2025[presidentElect2025]
    );
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
    assert.strictEqual(
      game.scenes['poland_presidential_election.first_count'].faceImage,
      presWinnerImages2020['Rafał Trzaskowski']
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
    // With two Left candidacies the roster must carry the extra ballot row.
    engine.goToScene('poland_events_2025.presidential_field_2025');
    const splitRoster = contentText(engine.state.currentContent);
    assert(
      splitRoster.includes('Adrian Zandberg'),
      'A separate Razem candidacy was missing from the printed ballot'
    );
    assert(
      splitRoster.includes('thirteen candidates') ||
        splitRoster.includes('Thirteen candidates'),
      'The split-Left ballot was still described as a twelve-name field'
    );

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
    const konfCandidates = new Set();
    for (let index = 0; index < 24; index += 1) {
      startStandard('presidential-2025-konf-draw-' + index);
      const drawQualities = engine.state.qualities;
      Object.assign(drawQualities, {
        year: 2025,
        month: 1,
        continuous_campaign: 1,
      });
      engine.goToScene('poland_events_2025.left_presidential_split');
      konfCandidates.add(drawQualities.pres_2025_konf_candidate);
    }
    assert.deepStrictEqual(
      Array.from(konfCandidates).sort(),
      ['Krzysztof Bosak', 'Sławomir Mentzen']
    );

    [
      ['federated-razem', {
        left_merger_structure: 'federation',
        merger_razem_present: 1,
        razem_org_status: 'federal_partner',
        razem_in_left: 1,
        razem_strength: 20,
        razem_dissent: 70,
        razem_cooperation: 25,
      }],
      ['cohesive-independent-razem', {
        razem_split: 1,
        razem_party_formed: 1,
        razem_in_left: 0,
        razem_exit_strength: 14,
        razem_cooperation: 65,
      }],
      ['low-dissent-razem', {
        razem_in_left: 1,
        razem_strength: 20,
        razem_dissent: 20,
        razem_cooperation: 30,
      }],
      ['low-dissent-independent-razem', {
        razem_split: 1,
        razem_party_formed: 1,
        razem_in_left: 0,
        razem_exit_strength: 14,
        razem_dissent: 20,
        razem_cooperation: 30,
      }],
      ['weak-independent-razem', {
        razem_split: 1,
        razem_party_formed: 1,
        razem_in_left: 0,
        razem_exit_strength: 5,
        razem_vote_intent: 3,
        razem_cooperation: 30,
      }],
    ].forEach(function(testCase) {
      startStandard('presidential-2025-' + testCase[0]);
      const unitedQualities = engine.state.qualities;
      Object.assign(unitedQualities, {
        year: 2024,
        month: 12,
        continuous_campaign: 1,
        resources: 10,
      }, testCase[1]);
      engine.goToScene('poland_events_2023_2024.left_nomination_2024');
      assert.strictEqual(
        unitedQualities.pres_2025_razem_separate_eligible,
        0,
        testCase[0] + ' incorrectly produced a separate Razem campaign'
      );
      choose('poland_events_2023_2024.biejat_confirm');
      assert.strictEqual(unitedQualities.pres_2025_united_left, 1);
      assert.strictEqual(unitedQualities.pres_2025_razem_candidate, 'None');
    });

    startStandard('presidential-2025-credible-razem-rupture');
    const splitQualities = engine.state.qualities;
    Object.assign(splitQualities, {
      year: 2024,
      month: 12,
      continuous_campaign: 1,
      razem_split: 1,
      razem_party_formed: 1,
      razem_in_left: 0,
      razem_exit_strength: 14,
      razem_dissent: 60,
      razem_cooperation: 35,
    });
    engine.goToScene('poland_events_2023_2024.left_nomination_2024');
    assert.strictEqual(splitQualities.pres_2025_razem_separate_eligible, 1);
    choose('poland_events_2023_2024.biejat_confirm');
    assert.strictEqual(splitQualities.pres_2025_united_left, 0);
    assert.strictEqual(
      splitQualities.pres_2025_razem_candidate,
      'Adrian Zandberg'
    );

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
    const rosterText = contentText(engine.state.currentContent);
    assert(
      rosterText.includes('candidate-field'),
      'The 2025 roster did not render the styled candidate field'
    );
    assert(
      rosterText.includes('Joanna Senyszyn') &&
        rosterText.includes('Marek Woch'),
      'The 2025 roster dropped the smaller committees'
    );
    choose('poland_events_2025.pres25_meet_candidates');
    assert.strictEqual(
      game.scenes['poland_events_2025.pres25_meet_trzaskowski'].faceImage,
      'img/poland/events/pres-candidate-trzaskowski-2025.webp'
    );
    assert.strictEqual(
      game.scenes['poland_events_2025.pres25_meet_mentzen'].faceImage,
      'img/poland/events/pres-candidate-mentzen-2025.webp'
    );
    assert.strictEqual(
      game.scenes['poland_events_2025.pres25_meet_holownia'].faceImage,
      'img/poland/events/pres-candidate-holownia-2025.webp'
    );
    choose('poland_events_2025.pres25_meet_trzaskowski');
    choose('poland_events_2025.pres25_meet_nawrocki');
    choose(
      qualities.pres_2025_konf_candidate === 'Krzysztof Bosak'
        ? 'poland_events_2025.pres25_meet_bosak'
        : 'poland_events_2025.pres25_meet_mentzen'
    );
    choose('poland_events_2025.pres25_meet_braun');
    choose('poland_events_2025.pres25_meet_holownia');
    choose('poland_events_2025.pres25_meet_stanowski');
    choose('poland_events_2025.pres25_meet_minor');
    choose('poland_events_2025.pres25_meet_left');
    choose('poland_events_2025.pres25_opening_poll');
    assert(qualities.pres_2025_poll_left > 0);
    assert.strictEqual(qualities.pres_2025_poll_razem, 0);
    choose('poland_events_2025.pres25_campaign_menu');
    choose('poland_events_2025.pres25_campaign_work');
    choose('poland_events_2025.pres25_campaign_next');
    choose('poland_events_2025.pres25_campaign_constitution');
    assert.strictEqual(qualities.pres_2025_campaign_actions_remaining, 0);
    choose('poland_events_2025.pres25_campaign_done');

    qualities.year = 2025;
    qualities.month = 4;
    engine.goToScene('poland_events_2025.presidential_debate_2025');
    choose('poland_events_2025.pres25_debate_security');
    choose('poland_events_2025.pres25_security_signature');
    choose('poland_events_2025.pres25_debate_economy');
    choose('poland_events_2025.pres25_economy_signature');
    choose('poland_events_2025.pres25_debate_rights');
    choose('poland_events_2025.pres25_rights_signature');
    choose('poland_events_2025.pres25_debate_questions');
    const questionChoices = currentChoices().map(function(choice) {
      return choice.id;
    });
    assert(!questionChoices.includes(
      'poland_events_2025.pres25_question_zandberg'
    ));
    choose('poland_events_2025.pres25_question_mentzen');
    choose('poland_events_2025.pres25_debate_close');
    choose('poland_events_2025.pres25_close_signature');
    choose('poland_events_2025.pres25_debate_verdict');
    choose('poland_events_2025.pres25_tracking_poll');
    const pollTotal = [
      'ko', 'right', 'left', 'razem', 'mentzen',
      'braun', 'holownia', 'stanowski', 'other'
    ].reduce(function(sum, key) {
      return sum + qualities['pres_2025_poll_' + key];
    }, 0);
    assert(Math.abs(pollTotal - 100) < 0.01);
    assert.strictEqual(qualities.pres_2025_poll_razem, 0);
    assert.notStrictEqual(qualities.pres_2025_debate_outcome, undefined);
    assert.notStrictEqual(qualities.pres_2025_debate_upset, 'None');

    // The first round opens a two-stage inter-round bargain: a published line,
    // then a two-move market over the electorates nobody now represents.
    qualities.month = 5;
    engine.goToScene('poland_events_2025.presidential_first_round_2025');
    assert.strictEqual(qualities.pres_2025_round_one_done, 1);
    assert.strictEqual(
      game.scenes[
        'poland_events_2025.presidential_first_round_2025'
      ].faceImage,
      qualities.pres_2025_first_round_winner
        ? presWinnerImages2025[qualities.pres_2025_winner]
        : 'img/poland/events/presidential-ballot-2025.webp'
    );
    // The first-round table owns its own Status column.
    [
      'ko', 'right', 'left', 'razem', 'mentzen',
      'braun', 'holownia', 'stanowski'
    ].forEach(function(key) {
      assert(
        ['elected', 'runoff', 'eliminated', 'no candidate'].includes(
          qualities['pres_2025_status_' + key]
        ),
        key + ' had no first-round status when the result table was printed'
      );
    });
    if (!qualities.pres_2025_first_round_winner) {
      choose('poland_events_2025.runoff_broker');
      assert.strictEqual(qualities.pres_2025_support_actions_remaining, 2);
      const brokerChoices = currentChoices().map(function(choice) {
        return choice.id;
      });
      assert(brokerChoices.length > 0, 'The runoff broker offered no line');
      choose(brokerChoices[0]);
      choose('poland_events_2025.pres25_support_market');
      choose('poland_events_2025.pres25_support_turnout');
      assert.strictEqual(qualities.pres_2025_support_actions_remaining, 1);
      assert(qualities.pres_2025_runoff_target_bonus > 0);
      choose('poland_events_2025.pres25_support_next');
      choose('poland_events_2025.pres25_support_release');
      assert.strictEqual(qualities.pres_2025_support_actions_remaining, 0);
      choose('poland_events_2025.pres25_support_done');

      qualities.month = 6;
      engine.goToScene('poland_events_2025.pres25_runoff_campaign');
      assert.strictEqual(qualities.pres_2025_runoff_done, 0);
      assert.strictEqual(
        Math.round(
          (qualities.pres_2025_runoff_poll_a +
            qualities.pres_2025_runoff_poll_b) * 10
        ) / 10,
        100,
        'The inter-round tracking poll did not sum to 100'
      );
      choose('poland_events_2025.pres25_push_ground');
      assert.strictEqual(qualities.pres_2025_runoff_final_push, 'Ground operation');
      choose('poland_events_2025.presidential_runoff_2025');
      assert.strictEqual(qualities.pres_2025_runoff_done, 1);
      assert.strictEqual(
        qualities.pres_2025_runoff_votes_a + qualities.pres_2025_runoff_votes_b,
        qualities.pres_2025_runoff_valid_votes
      );
      assert(
        Math.abs(
          qualities.pres_2025_runoff_a_share +
            qualities.pres_2025_runoff_b_share - 100
        ) < 0.02
      );
      assert(String(qualities.pres_2025_winner).length > 0);
      assert.strictEqual(
        game.scenes[
          'poland_events_2025.presidential_runoff_2025'
        ].faceImage,
        ['right', 'mentzen', 'braun'].includes(
          qualities.pres_2025_winner_key
        )
          ? 'img/poland/events/wajda.jpg'
          : presWinnerImages2025[qualities.pres_2025_winner]
      );
    }
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
    assert.strictEqual(
      engine.state.sceneId,
      'poland_gowin_crisis.gowin_returns'
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
    choose('poland_events.left_discipline_2021');
    assert.strictEqual(qualities.left_discipline_2021_done, 1);
    choose('poland_events.discipline_lift');
    choose('poland_hub');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_porozumienie_war.republikanie_split'
    );
    choose('poland_hub');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_civic_marches.labor_day'
    );
    chooseFirstAvailable([
      'poland_civic_marches.labor_day_institution',
      'poland_civic_marches.labor_day_union',
      'poland_civic_marches.labor_day_autonomous',
      'poland_civic_marches.labor_day_ceremony',
    ]);
    choose('poland_civic_marches.return_to_dated_desk');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');

    setCampaignDate(qualities, 2021, 6, 'June');
    qualities.opposition_reset_event_done = 0;
    engine.goToScene('poland_polling');
    checkNumbers();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.rights_vote'
    );
    choose('poland_trzaskowski.rights_vote_marriage');
    completeLegislativeVote();
    assert.strictEqual(
      engine.state.sceneId,
      'poland_trzaskowski.rights_fracture'
    );
    assert(qualities.trz_rights_bill_votes >= 170);
    assert.strictEqual(
      qualities.trz_rights_bill_outcome,
      'Passed and signed',
      'The deliberately maximised cohabitation route never converted its ' +
        'United Right fracture into a rights majority: ' +
        JSON.stringify({
          yes: qualities.legvote_sejm_yes,
          no: qualities.legvote_sejm_no,
          abstain: qualities.legvote_sejm_abstain,
          left: qualities.legvote_left_yes,
          ko: qualities.legvote_ko_yes,
          p2050: qualities.legvote_p2050_yes,
          psl: qualities.legvote_psl_yes,
          pis: qualities.legvote_pis_yes,
          other: qualities.legvote_other_yes,
          fragmentation: qualities.trz_right_fragmentation,
        })
    );
    assert(qualities.trz_right_backlash > 0);
    choose('poland_events.dworczyk_hack_2021');
    choose('poland_events.dworczyk_infosec');
    choose('poland_hub');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_porozumienie_war.kp_rupture'
    );
    choose('poland_porozumienie_war.kukiz_leave_alone');
    choose('poland_hub');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_civic_marches.pride'
    );
    chooseFirstAvailable([
      'poland_civic_marches.pride_community_institution',
      'poland_civic_marches.pride_movement',
      'poland_civic_marches.pride_party',
    ]);
    choose('poland_civic_marches.return_to_dated_desk');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
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
    assert.strictEqual(engine.state.sceneId, 'poland_monthly_briefing');
    choose('poland_monthly_briefing.briefing_return');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert(qualities.national_crisis_pressure >= 38);

    setCampaignDate(qualities, 2020, 9, 'September');
    qualities.merger_event_done = 1;
    // September 2020 opens the legacy desk when two or more files are still
    // pending; this test exercises the repeat-election route on its own.
    qualities.czajka_2020_done = 1;
    qualities.animals_2020_done = 1;
    qualities.fiore_braun_2020_done = 1;
    qualities.emilewicz_left_porozumienie = 1;
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

  function testThirdWayFormationSplit() {
    [
      {
        scene: 'formation_pick_ko_p2050_left',
        inside: 'p2050',
        outside: 'psl',
        partners: 'KO · Poland 2050 · Lewica',
      },
      {
        scene: 'formation_pick_ko_psl_left',
        inside: 'psl',
        outside: 'p2050',
        partners: 'KO · PSL · Lewica',
      },
    ].forEach(function(testCase) {
      startStandard('third-way-split-' + testCase.inside);
      const qualities = engine.state.qualities;
      qualities.year = 2023;
      qualities.p2050_emerged = 1;
      qualities.third_way_2023_done = 1;
      qualities.third_way_active = 1;
      qualities.third_way_joint_list = 1;
      qualities.third_way_split = 0;
      qualities.ko_seats = 170;
      qualities.p2050_seats = 30;
      qualities.psl_seats = 30;
      qualities.left_seats = 60;
      qualities.left_committed_seats = 60;
      qualities.nowa_lewica_seats = 60;
      qualities.razem_seats = 0;
      qualities.left_cabinet_committed = 1;
      qualities.left_cabinet_model = 'Formation coalition cabinet';
      qualities.formation_in_progress = 1;
      qualities.ministry_allocation_mode = 'formation';
      qualities.ministry_return_mode = 'cabinet_program';

      engine.goToScene(
        'poland_government_formation.' + testCase.scene
      );
      assert.strictEqual(qualities.third_way_split, 1);
      assert.strictEqual(qualities.third_way_active, 0);
      assert.strictEqual(qualities.third_way_joint_list, 0);
      assert.strictEqual(
        qualities.formation_coalition_support_seats,
        qualities.formation_coalition_seats,
        'A majority split cabinet requested unnecessary outside votes'
      );

      qualities.democratic_candidate = 'Donald Tusk';
      qualities.formation_pm_candidate_loss = 0;
      engine.goToScene(
        'poland_government_formation.formation_pm_alt_roll'
      );
      assert.strictEqual(
        qualities['candidate_' + testCase.outside + '_votes'],
        0,
        'The excluded Third Way party supplied phantom confidence votes'
      );

      engine.goToScene('poland_ministries');
      assert.strictEqual(qualities.ministry_ko_in_cabinet, 1);
      assert.strictEqual(
        qualities['ministry_' + testCase.inside + '_in_cabinet'],
        1
      );
      assert.strictEqual(
        qualities['ministry_' + testCase.outside + '_in_cabinet'],
        0
      );
      assert.strictEqual(
        qualities.ministry_coalition_partners,
        testCase.partners
      );

      engine.goToScene('poland_normalize');
      assert.strictEqual(
        qualities.third_way_display_name,
        'PSL and Poland 2050'
      );
      engine.goToScene('status.polls');
      assert.strictEqual(qualities.status_third_way_visible, 0);
      assert.strictEqual(qualities.status_p2050_visible, 1);
      assert(
        JSON.stringify(engine.state.currentContent).includes('party-p2050'),
        'Poland 2050 did not return to polling in its own party colour'
      );
      engine.goToScene('status.relations');
      assert(contentText(engine.state.currentContent).includes('Poland 2050'));
    });
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
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.formation_coalition_menu'
    );
    choose('poland_government_formation.formation_pick_democratic');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.formation_marshal_ballot'
    );
    choose('poland_government_formation.formation_marshal_support');
    assert.strictEqual(qualities.formation_marshal_nominee, 'Szymon Hołownia');
    assert.strictEqual(qualities.formation_marshal_yes, 248);
    assert.strictEqual(qualities.formation_marshal_elected, 1);
    choose('poland_government_formation.formation_after_marshal');
    choose('poland_government_formation.formation_vice_witek_reject');
    choose('poland_government_formation.formation_vice_bosak_reject');
    assert.deepStrictEqual(
      [qualities.year, qualities.president_name,
        qualities.presidential_majority_designation,
        qualities.formation_presidential_attempt_resolved],
      [2023, 'Andrzej Duda', 1, 0]
    );
    choose('poland_government_formation.formation_pm_stage');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.formation_duda_first_attempt'
    );
    choose('poland_government_formation.formation_duda_attempt_lapses');
    choose('poland_government_formation.formation_pm_alt_tusk');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.formation_pm_alt_roll'
    );
    assert.strictEqual(qualities.confidence_candidate, 'Donald Tusk');
    assert.strictEqual(qualities.confidence_yes, 248);
    assert.strictEqual(qualities.confidence_no, 212);
    assert.strictEqual(qualities.confidence_abstain, 0);
    assert.strictEqual(qualities.confidence_present, 460);
    assert.strictEqual(qualities.confidence_threshold, 231);
    assert.strictEqual(qualities.democratic_votes, 248);
    assert.strictEqual(qualities.candidate_vote_passed, 1);

    choose('poland_government_formation.formation_pm_alt_continue');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.formation_pm_alt_success'
    );
    choose('poland_government_formation.formation_pm_alt_success_continue');
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
      'KO + Poland 2050 + PSL + Lewica'
    );
    assert.strictEqual(qualities.left_in_government, 1);
    assert.strictEqual(qualities.budget, 6);
    assert.strictEqual(
      qualities.budget_authority,
      'Governing coalition — negotiated fiscal capacity'
    );
    assert.strictEqual(
      qualities.prime_minister_intro_return,
      'formation_government'
    );

    choose('poland_prime_minister_intro.show');
    assert.strictEqual(
      qualities.prime_minister_intro_return,
      'formation_government'
    );
    choose('poland_prime_minister_intro.continue');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.formation_tusk_suit'
    );
    choose('poland_government_formation.formation_hundred_days');
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
    assert.strictEqual(qualities.annual_budget_internal_backing, 75);
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
        annual_budget_passed: 1,
        annual_budget_senate_stage_done: 1,
        annual_budget_effects_applied: 0,
        annual_budget_social_share: 17,
        annual_budget_defence_share: 4.6,
        annual_budget_deficit_share: 4.5,
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

    startStandard('razem-supply-pact-budget');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2024,
      month: 12,
      annual_budget_year: 2024,
      left_in_government: 0,
      government_party: 'ko',
      prime_minister_party: 'ko',
      finance_minister_party: 'KO',
      government_has_confidence: 1,
      caretaker_government: 0,
      government_support_seats: 225,
      coalition_seats: 225,
      ko_seats: 225,
      left_seats: 26,
      razem_seats: 7,
      razem_budget_support_pact: 1,
      razem_red_line_broken: 0,
    });
    engine.goToScene('poland_budget_2023_2026.annual_budget');
    globalThis.polandBudgetModel.selectStrategy(qualities, 'no');
    const pactVote = globalThis.polandBudgetModel.submit(qualities).vote;
    assert.strictEqual(pactVote.externalYes, 7);
    assert(pactVote.reasons.some(function(reason) {
      return reason.includes('previously signed supply pact');
    }));
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
      ['poland_ministries.opposition_allocation_continue']
    );
    choose('poland_ministries.opposition_allocation_continue');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_government_formation.formation_external_cabinet_program'
    );
    assert(
      currentChoices().some(function(choice) {
        return choice.canChoose;
      }),
      'Non-player ministry route dead-ended before the confidence vote'
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
      qualities.formation_coalition_selected = 1;
      qualities.formation_coalition_code = 'democratic_2023';
      qualities.formation_coalition_members = [
        'ko', 'p2050', 'psl', 'lewica',
      ];
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
      'KO · Poland 2050 · PSL · Lewica'
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
    qualities.formation_coalition_selected = 1;
    qualities.formation_coalition_code = 'democratic_2023';
    qualities.formation_coalition_members = [
      'ko', 'p2050', 'psl', 'lewica',
    ];
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
    qualities.formation_coalition_selected = 1;
    qualities.formation_coalition_code = 'ko_left';
    qualities.formation_coalition_members = ['ko', 'lewica'];
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
    qualities.formation_coalition_selected = 1;
    qualities.formation_coalition_code = 'left_only';
    qualities.formation_coalition_members = ['lewica'];
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
    qualities.formation_coalition_code = 'ko_left';
    qualities.formation_coalition_members = ['ko', 'lewica'];
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
    assert.strictEqual(healthChoice.canChoose, true);
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
        qualities.formation_coalition_code = 'ko_left';
        qualities.formation_coalition_members = ['ko', 'lewica'];
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
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.reshuffle_opposition_entry'
    );
    choose('poland_ministries');
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
      assert.strictEqual(engine.state.sceneId, route.choice);
      choose('poland_events_2025.formation_designation_2025');
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
        'poland_events_2025.formation_palace_accept_2025'
      );
      choose('poland_events_2025.formation_investiture_2025');
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
      choose('poland_prime_minister_intro.show');
      choose('poland_prime_minister_intro.continue');
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
      'poland_events_2025.formation_return_2025'
    );
    choose('poland_events_2025.formation_designation_2025');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.formation_designation_2025'
    );
    assert.strictEqual(qualities.caretaker_government, 1);
    assert.strictEqual(qualities.formation_2025_designation_accepted, 1);
    choose('poland_events_2025.formation_palace_accept_2025');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.formation_palace_accept_2025'
    );
    choose('poland_events_2025.formation_investiture_2025');
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
    choose('poland_prime_minister_intro.show');
    choose('poland_prime_minister_intro.continue');
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
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.formation_replacement_2025'
    );
    choose('poland_events_2025.formation_designation_2025');
    assert.strictEqual(qualities.formation_2025_designation_accepted, 0);
    assert.strictEqual(qualities.prime_minister, refusalCaretaker);
    choose('poland_events_2025.formation_palace_refuse_2025');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.formation_palace_refuse_2025'
    );
    choose('poland_events_2026.snap_formation_attempt_two');
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
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.formation_return_2025'
    );
    choose('poland_events_2025.formation_designation_2025');
    assert.strictEqual(qualities.formation_2025_designation_accepted, 1);
    choose('poland_events_2025.formation_palace_accept_2025');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.formation_palace_accept_2025'
    );
    choose('poland_events_2025.formation_investiture_2025');
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
      choose('poland_government_formation.third_attempt_menu');
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

      choose('poland_prime_minister_intro.show');
      choose('poland_prime_minister_intro.continue');
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
      if (testCase.party === 'other') {
        assert(rendered.includes('<b>' + testCase.name + '</b>'));
        assert(rendered.includes('<b>' + testCase.government + '</b>'));
      } else {
        const marker = '<span class="party party-' + testCase.party + '">';
        assert(
          rendered.includes(marker) && rendered.includes(testCase.name),
          'Prime-minister color did not follow ' + testCase.party
        );
        assert(
          rendered.includes(marker) && rendered.includes(testCase.government),
          'Cabinet color did not follow ' + testCase.party
        );
      }
    });
  }

  function testDynamicLeftIdentity() {
    const cases = [
      ['Lewica', {}],
      ['SLD', {
        spring_active: 0,
        spring_in_left: 0,
        spring_party_formed: 1,
      }],
      ['Nowa Lewica', {rename_event_done: 1, spring_merged: 1}],
      ['Lewica Razem', {
        rename_event_done: 1,
        spring_merged: 1,
        nowa_lewica_merger_agreed: 1,
        merger_leader: 'Razem',
      }],
      ['Wspólne Jutro', {
        rename_event_done: 1,
        spring_merged: 1,
        progressives_strength: 60,
        zukowska_advisor: 1,
      }],
      ['Wiosna-SLD', {spring_strength: 60}],
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
    let qualities = engine.state.qualities;
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

    startStandard('dynamic-parliament-seat-chart');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      pis_seats: 224,
      porozumienie_seats: 6,
      porozumienie_exit_done: 1,
      suwerenna_seats: 5,
      suwerenna_walkout: 1,
      ko_seats: 125,
      ko_splinter_seats: 9,
      ko_splinter_active: 1,
      ko_splinter_type: 'Classical-liberal',
      left_seats: 42,
      razem_party_seats: 7,
      razem_party_formed: 1,
      psl_seats: 25,
      kukiz_seats: 5,
      kukiz_left_kp: 1,
      other_seats: 1,
    });
    engine.goToScene('poland_normalize');
    engine.goToScene('status');
    let dynamicRendered = contentText(engine.state.currentContent)
      .replace(/\s+/g, ' ');
    const hasPulseSeatRow = function(content, name, seats) {
      const start = content.indexOf(name);
      if (start < 0) return false;
      const row = content.slice(start, start + 180);
      return seats === undefined
        ? /\d+ seats/.test(row)
        : row.includes(seats + ' seats');
    };
    [
      ['Porozumienie', 6],
      ['Suwerenna Polska', 5],
      [qualities.ko_splinter_name, 9],
      ['Razem', 7],
      ["Kukiz'15", 5],
    ].forEach(function(entry) {
      assert(
        hasPulseSeatRow(dynamicRendered, entry[0], entry[1]),
        'Pulse omitted the live ' + entry[0] + ' caucus'
      );
    });
    assert.strictEqual(
      qualities.status_pis_seats + qualities.status_porozumienie_seats +
        qualities.status_suwerenna_seats + qualities.status_ko_seats +
        qualities.status_ko_splinter_seats + qualities.status_left_seats +
        qualities.status_razem_party_seats + qualities.status_psl_seats +
        qualities.status_kukiz_seats + qualities.status_konf_seats +
        qualities.status_other_seats,
      460,
      'Named Pulse caucuses did not reconcile to the 460-seat Sejm'
    );

    Object.assign(qualities, {
      pis_seats: 235,
      porozumienie_seats: 0,
      suwerenna_seats: 0,
      ko_seats: 134,
      ko_splinter_seats: 0,
      ko_splinter_active: 0,
      left_seats: 49,
      razem_party_seats: 0,
      razem_party_formed: 0,
      psl_seats: 30,
      kukiz_seats: 0,
    });
    engine.goToScene('poland_normalize');
    engine.goToScene('status');
    dynamicRendered = contentText(engine.state.currentContent)
      .replace(/\s+/g, ' ');
    ['Porozumienie', 'Suwerenna Polska', qualities.ko_splinter_name,
      'Razem', "Kukiz'15"].forEach(function(name) {
      assert(
        !hasPulseSeatRow(dynamicRendered, name),
        'Pulse retained the absorbed ' + name + ' caucus'
      );
    });
    assert.deepStrictEqual(
      [qualities.status_pis_seats, qualities.status_ko_seats,
        qualities.status_left_seats],
      [235, 134, 49],
      'Pulse did not return absorbed MPs to their live host caucuses'
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
    const cardTags = cardScene.tags || [];
    const injectedMajorReform =
      !engine.state.qualities.major_reforms_complete &&
      ['poland_government_deck', 'poland_negotiation_deck'].includes(deckId) &&
      cardTags.includes('poland_major_reform_card');
    assert(
      cardTags.includes(deckTags[deckId]) || injectedMajorReform,
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
    assert.strictEqual(
      engine.state.qualities.month_actions,
      1,
      card.id + ' did not consume the monthly leadership action'
    );

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
    assertPollingModel({
      requireNormalizedHeadline: false,
      context: card.id + ' on agenda turn ' + (cardsPlayed.length + 1),
    });

    cardsPlayed.push(card.id);
  }

  function playOppositionBudgetStages(preserveChronology) {
    assert.strictEqual(
      engine.state.sceneId,
      'poland_budget_2023_2026.budget_open'
    );
    globalThis.polandBudgetModel.selectStrategy(
      engine.state.qualities,
      'no'
    );
    if (preserveChronology && !globalThis.polandBudgetModel.preview(
      engine.state.qualities
    ).vote.passed) {
      globalThis.polandBudgetModel.selectStrategy(
        engine.state.qualities,
        'bargain'
      );
      const amendment = globalThis.polandBudgetModel.lines.find(
        function(line) {
          return globalThis.polandBudgetModel.toggleDemand(
            engine.state.qualities,
            line.id
          );
        }
      );
      assert(amendment, 'Minority budget exposed no affordable amendment');
      globalThis.polandBudgetModel.setPosture(
        engine.state.qualities,
        'support'
      );
    }
    choose('poland_budget_2023_2026.submit_budget');
    if (engine.state.sceneId === 'poland_budget_2023_2026.defeat') {
      choose('poland_budget_2023_2026.close_opposition_defeat');
    } else {
      assert.strictEqual(
        engine.state.sceneId,
        'poland_budget_2023_2026.enact'
      );
      choose('poland_budget_2023_2026.return_queue');
    }
    if (engine.state.sceneId === 'poland_monthly_briefing') {
      choose('poland_monthly_briefing.briefing_return');
    }
  }
  function resolveEvent(sceneId) {
    switch (sceneId) {
    case 'poland_budget_2023_2026.budget_open': {
      playOppositionBudgetStages(true);
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
      choose('poland_events.nik_banas_2019');
      chooseFirstAvailable([
        'poland_events.nik19_institution',
        'poland_events.nik19_resignation',
        'poland_events.nik19_campaign',
        'poland_events.nik19_ignore',
      ]);
      choose('poland_events.marshal_2019');
      chooseFirstAvailable([
        'poland_events.marshal19_register',
        'poland_events.marshal19_rules',
        'poland_events.marshal19_candidate',
        'poland_events.marshal19_pass',
      ]);
      returnToHub();
      break;
    case 'poland_events.budget_2019':
      chooseFirstAvailable([
        'poland_events.budget_2019_shadow',
        'poland_events.budget_2019_deal',
        'poland_events.budget_2019_fragments',
      ]);
      choose('poland_events.lgbt_zones_2019');
      chooseFirstAvailable([
        'poland_events.zones_legal',
        'poland_events.zones_local',
        'poland_events.zones_national',
        'poland_events.zones_europe',
      ]);
      if (engine.state.sceneId !== 'poland_hub') {
        choose('poland_hub');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_leadership_events.po_handoff_2020':
      choose('poland_leadership_events.budka_social');
      choose('poland_leadership_events.po_handoff_continue');
      assert.strictEqual(engine.state.sceneId, 'poland_events.media');
      assert.strictEqual(engine.state.qualities.ko_leader, 'Borys Budka');
      chooseFirstAvailable([
        'poland_events.media_newsroom',
        'poland_events.media_personalities',
        'poland_events.media_wait',
      ]);
      choose('poland_events.nik_removal_2020');
      chooseFirstAvailable([
        'poland_events.nik20_hold_term',
        'poland_events.nik20_strip',
        'poland_events.nik20_refer_audits',
        'poland_events.nik20_watch',
      ]);
      returnToHub();
      break;
    case 'poland_events.media':
      chooseFirstAvailable([
        'poland_events.media_newsroom',
        'poland_events.media_personalities',
        'poland_events.media_wait',
      ]);
      choose('poland_events.nik_removal_2020');
      chooseFirstAvailable([
        'poland_events.nik20_hold_term',
        'poland_events.nik20_strip',
        'poland_events.nik20_refer_audits',
        'poland_events.nik20_watch',
      ]);
      returnToHub();
      break;
    case 'poland_monthly_briefing':
      choose('poland_monthly_briefing.briefing_return');
      if (engine.state.sceneId ===
          'poland_budget_2023_2026.budget_open') {
        resolveEvent(engine.state.sceneId);
        break;
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
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
    case 'poland_gowin_crisis.postal_crisis':
      chooseFirstAvailable([
        'poland_gowin_crisis.postal_tactical',
        'poland_gowin_crisis.postal_refuse',
        'poland_gowin_crisis.postal_emergency',
        'poland_gowin_crisis.postal_break',
        'poland_gowin_crisis.postal_constitutional',
      ]);
      choose('poland_gowin_crisis.gowin_resignation');
      chooseFirstAvailable([
        'poland_gowin_crisis.gowin_read_conservative',
        'poland_gowin_crisis.gowin_read_credit',
        'poland_gowin_crisis.gowin_read_silent',
      ]);
      returnToHub();
      break;
    case 'poland_gowin_crisis.postal_resolution':
      returnToHub();
      break;
    case 'poland_leadership_events.ko_candidate_replacement_2020':
      choose('poland_leadership_events.kidawa_rules');
      choose('poland_events.shield');
      assert.strictEqual(engine.state.sceneId, 'poland_events.shield');
      assert.strictEqual(
        engine.state.qualities.ko_presidential_candidate_2020,
        engine.state.qualities.pres_2020_ko_kidawa
          ? 'Małgorzata Kidawa-Błońska'
          : 'Rafał Trzaskowski'
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
      choose('poland_presidential_election.campaign_next');
      choose('poland_presidential_election.campaign_constitution');
      choose('poland_presidential_election.campaign_done');
      playPresidentialDebate();
      choose('poland_presidential_election.first_count');
      choose('poland_presidential_election.wait_for_runoff');
      if (engine.state.sceneId === 'poland_civic_marches.pride') {
        chooseFirstAvailable([
          'poland_civic_marches.pride_movement',
          'poland_civic_marches.pride_party',
          'poland_civic_marches.pride_corporate',
        ]);
        choose('poland_civic_marches.return_to_dated_desk');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_presidential_election.runoff_setup':
      choose('poland_presidential_election.endorsement_choice');
      choose('poland_presidential_election.endorse_free');
      choose('poland_presidential_election.support_market');
      choose('poland_presidential_election.support_turnout');
      choose('poland_presidential_election.support_next');
      choose('poland_presidential_election.support_release');
      choose('poland_presidential_election.support_done');
      choose('poland_presidential_election.final_push_safe');
      choose('poland_presidential_election.runoff_count');
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
        if (engine.state.sceneId === 'poland_monthly_briefing') {
          choose('poland_monthly_briefing.briefing_return');
        }
        assert.strictEqual(engine.state.sceneId, 'poland_hub');
      } else {
        if (engine.state.sceneId ===
            'poland_presidential_election.challenger_inauguration_2020') {
          choose(
            'poland_presidential_election.challenger_inauguration_record'
          );
          if (engine.state.sceneId === 'poland_office_authority.resolve') {
            choose('poland_office_authority.accept');
          }
          if (engine.state.sceneId === 'poland_event_queue.events_choice') {
            choose('poland_budget_2023_2026.execution_event');
            choose('poland_budget_2023_2026.finish_execution');
            choose('poland_budget_2023_2026.execution_return');
          }
        }
        if (engine.state.sceneId === 'poland_monthly_briefing') {
          choose('poland_monthly_briefing.briefing_return');
        }
        assert.strictEqual(engine.state.sceneId, 'poland_hub');
        assert.strictEqual(
          engine.state.qualities.p2050_foundation_2020_done,
          1,
          'Foundation flag reset on return to the hub'
        );
      }
      break;
    case 'poland_merger_events.merger':
      choose('poland_merger_events.merger_dual');
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
      if (engine.state.sceneId === 'poland_gowin_crisis.gowin_returns') {
        choose('poland_hub');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events.abortion':
      choose('poland_events.abortion_front');
      choose('poland_hub');
      if (engine.state.sceneId === 'poland_gowin_crisis.gowin_returns') {
        choose('poland_hub');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
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
      choose('poland_events_2021_2023.independence_2020');
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
      choose('poland_hub');
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events.budget_2020':
      playOppositionBudgetStages(true);
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events.vaccine':
      chooseFirstAvailable([
        'poland_events.vaccine_public',
        'poland_events.vaccine_local',
        'poland_events.vaccine_liberty',
      ]);
      choose('poland_events.vaccine_aftershock');
      chooseFirstAvailable([
        'poland_events.vaccine_aftershock_staff',
        'poland_events.vaccine_aftershock_income',
        'poland_events.vaccine_aftershock_message',
      ]);
      returnToHub();
      break;
    case 'poland_trzaskowski.judicial_war':
      chooseFirstAvailable([
        'poland_trzaskowski.judicial_veto_front',
        'poland_trzaskowski.judicial_europe',
        'poland_trzaskowski.judicial_trade',
      ]);
      choose('poland_hub');
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_merger_events.rename':
      chooseFirstAvailable([
        'poland_merger_events.rename_members',
        'poland_merger_events.rename_dual',
        'poland_merger_events.rename_machine',
      ]);
      choose('poland_hub');
      if (engine.state.sceneId ===
          'poland_porozumienie_war.bielan_rebellion') {
        choose('poland_porozumienie_war.bielan_expose');
        choose('poland_hub');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events.recovery_fund':
      chooseFirstAvailable([
        'poland_events.recovery_palace',
        'poland_events.recovery_opposition',
        'poland_events.recovery_deal',
        'poland_events.recovery_abstain',
      ]);
      choose('poland_events.left_discipline_2021');
      chooseFirstAvailable([
        'poland_events.discipline_settlement',
        'poland_events.discipline_arbitration',
        'poland_events.discipline_lift',
        'poland_events.discipline_uphold',
      ]);
      choose('poland_hub');
      if (engine.state.sceneId ===
          'poland_porozumienie_war.republikanie_split') {
        choose('poland_hub');
      }
      if (engine.state.sceneId === 'poland_civic_marches.labor_day') {
        chooseFirstAvailable([
          'poland_civic_marches.labor_day_union',
          'poland_civic_marches.labor_day_autonomous',
          'poland_civic_marches.labor_day_ceremony',
        ]);
        choose('poland_civic_marches.return_to_dated_desk');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_trzaskowski.palace_offensive':
      chooseFirstAvailable([
        'poland_trzaskowski.palace_social',
        'poland_trzaskowski.palace_institutions',
        'poland_trzaskowski.palace_rights',
      ]);
      choose('poland_hub');
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_trzaskowski.rights_vote':
      chooseFirstAvailable([
        'poland_trzaskowski.rights_vote_abortion',
        'poland_trzaskowski.rights_vote_marriage',
        'poland_trzaskowski.rights_vote_institutions',
      ]);
      completeLegislativeVote();
      choose('poland_hub');
      if (engine.state.sceneId === 'poland_porozumienie_war.kp_rupture') {
        choose('poland_porozumienie_war.kukiz_open_channel');
        choose('poland_hub');
      }
      if (engine.state.sceneId === 'poland_civic_marches.pride') {
        chooseFirstAvailable([
          'poland_civic_marches.pride_movement',
          'poland_civic_marches.pride_party',
          'poland_civic_marches.pride_corporate',
        ]);
        choose('poland_civic_marches.return_to_dated_desk');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events.opposition_reset':
      chooseFirstAvailable([
        'poland_events.reset_democratic',
        'poland_events.reset_social',
        'poland_events.reset_local',
      ]);
      choose('poland_events.dworczyk_hack_2021');
      chooseFirstAvailable([
        'poland_events.dworczyk_infosec',
        'poland_events.dworczyk_use',
        'poland_events.dworczyk_refuse',
        'poland_events.dworczyk_committee',
      ]);
      choose('poland_hub');
      if (engine.state.sceneId === 'poland_porozumienie_war.kp_rupture') {
        choose('poland_porozumienie_war.kukiz_open_channel');
        choose('poland_hub');
      }
      if (engine.state.sceneId === 'poland_civic_marches.pride') {
        chooseFirstAvailable([
          'poland_civic_marches.pride_movement',
          'poland_civic_marches.pride_party',
          'poland_civic_marches.pride_corporate',
        ]);
        choose('poland_civic_marches.return_to_dated_desk');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_merger_events.left_revolt':
    case 'poland_merger_events.left_revolt_live':
      resolveLeftRevolt();
      break;
    case 'poland_leadership_events.tusk_return_2021':
      choose('poland_leadership_events.tusk_social_terms');
      choose('poland_merger_events.left_revolt');
      assert.strictEqual(engine.state.qualities.ko_leader, 'Donald Tusk');
      resolveLeftRevolt();
      break;
    case 'poland_minority_sejm.lex_tvn_crisis':
      chooseFirstAvailable([
        'poland_minority_sejm.lex_tvn_watch',
        'poland_minority_sejm.lex_tvn_back_oecd',
        'poland_minority_sejm.lex_tvn_oppose_both',
      ]);
      choose('poland_minority_sejm.gowin_dismissed');
      if (engine.state.qualities.oecd_compromise_accepted) {
        choose('poland_minority_sejm.lex_tvn_amended_close');
      } else {
        choose('poland_minority_sejm.august_11_sejm');
        chooseFirstAvailable([
          'poland_minority_sejm.aug11_condemn_procedure',
          'poland_minority_sejm.aug11_press_kukiz',
          'poland_minority_sejm.aug11_bank_arithmetic',
        ]);
        choose('poland_minority_sejm.minority_parliament_opens');
        choose('poland_events_2021_2023.august_2021');
      }
      resolveEvent('poland_events_2021_2023.august_2021');
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
      choose('poland_events_2021_2023.october_2021_hub');
      choose('poland_events_2021_2023.oct21_eu');
      chooseFirstAvailable([
        'poland_events_2021_2023.oct21_common_front',
        'poland_events_2021_2023.oct21_material',
        'poland_events_2021_2023.oct21_dialogue',
      ]);
      choose('poland_events_2021_2023.october_2021_hub');
      choose('poland_events_2021_2023.oct21_turow');
      chooseFirstAvailable([
        'poland_events_2021_2023.turow_transition',
        'poland_events_2021_2023.turow_diplomacy',
        'poland_events_2021_2023.turow_sovereignty',
        'poland_events_2021_2023.turow_workers',
      ]);
      choose('poland_events_2021_2023.october_2021_hub');
      choose('poland_events_2021_2023.oct21_zones');
      chooseFirstAvailable([
        'poland_events_2021_2023.zones21_replace',
        'poland_events_2021_2023.zones21_claim',
        'poland_events_2021_2023.zones21_audit',
      ]);
      choose('poland_events_2021_2023.october_2021_hub');
      choose('poland_events_2021_2023.oct21_finish');
      returnToHub();
      break;
    case 'poland_events_2021_2023.november_2021_hub':
      if (currentChoices().some(function(choice) {
        return choice.id === 'poland_events_2021_2023.nov21_sajbor';
      })) {
        choose('poland_events_2021_2023.nov21_sajbor');
        chooseFirstAvailable([
          'poland_events_2021_2023.nov21_protocols',
          'poland_events_2021_2023.nov21_march',
          'poland_events_2021_2023.nov21_party',
        ]);
        choose('poland_events_2021_2023.november_2021_hub');
      }
      if (currentChoices().some(function(choice) {
        return choice.id === 'poland_events_2021_2023.nov21_border';
      })) {
        choose('poland_events_2021_2023.nov21_border');
        chooseFirstAvailable([
          'poland_events_2021_2023.nov21_corridor',
          'poland_events_2021_2023.nov21_uniforms',
          'poland_events_2021_2023.nov21_observers',
        ]);
        choose('poland_events_2021_2023.november_2021_hub');
      }
      if (currentChoices().some(function(choice) {
        return choice.id === 'poland_events_2021_2023.nov21_independence';
      })) {
        choose('poland_events_2021_2023.nov21_independence');
        chooseFirstAvailable([
          'poland_events_2021_2023.nov21_civic',
          'poland_events_2021_2023.nov21_counter',
          'poland_events_2021_2023.nov21_monitor',
          'poland_events_2021_2023.nov21_ban',
        ]);
        choose('poland_events_2021_2023.november_2021_hub');
      }
      if (currentChoices().some(function(choice) {
        return choice.id === 'poland_events_2021_2023.nov21_konf';
      })) {
        choose('poland_events_2021_2023.nov21_konf');
        chooseFirstAvailable([
          'poland_events_2021_2023.nov21_konf_expose',
          'poland_events_2021_2023.nov21_konf_protect',
          'poland_events_2021_2023.nov21_konf_dismiss',
        ]);
        choose('poland_events_2021_2023.november_2021_hub');
      }
      choose('poland_events_2021_2023.nov21_finish');
      choose('poland_hub');
      if (engine.state.sceneId ===
          'poland_porozumienie_after.porozumienie_search') {
        choose('poland_porozumienie_after.gowin_after_conditional');
        choose('poland_hub');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events_2021_2023.december_2021_hub':
      choose('poland_events_2021_2023.dec21_pps');
      chooseFirstAvailable([
        'poland_events_2021_2023.dec21_amnesty',
        'poland_events_2021_2023.dec21_accept',
        'poland_events_2021_2023.dec21_punish',
      ]);
      choose('poland_events_2021_2023.december_2021_hub');
      choose('poland_events_2021_2023.dec21_media');
      chooseFirstAvailable([
        'poland_events_2021_2023.dec21_palace',
        'poland_events_2021_2023.dec21_inquiry',
        'poland_events_2021_2023.dec21_media_front',
      ]);
      choose('poland_events_2021_2023.december_2021_hub');
      choose('poland_events_2021_2023.dec21_pegasus');
      chooseFirstAvailable([
        'poland_events_2021_2023.dec21_technical',
        'poland_events_2021_2023.dec21_commission',
        'poland_events_2021_2023.dec21_own_phones',
      ]);
      choose('poland_events_2021_2023.december_2021_hub');
      choose('poland_events_2021_2023.budget_2021');
      playOppositionBudgetStages(true);
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events_2021_2023.december_2021_hub'
      );
      choose('poland_events_2021_2023.dec21_finish');
      choose('poland_hub');
      if (engine.state.sceneId ===
          'poland_scenario_civic_gaps.border_person_2021') {
        choose('poland_scenario_civic_gaps.border_person_observe');
        choose('poland_events_2021_2023.router');
      }
      if (engine.state.sceneId === 'poland_minority_sejm.minority_vote_night') {
        chooseFirstAvailable([
          'poland_minority_sejm.minority_obstruct',
          'poland_minority_sejm.minority_trade',
        ]);
        choose('poland_hub');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events_2021_2023.january_2022':
      chooseFirstAvailable([
        'poland_events_2021_2023.jan22_progressive',
        'poland_events_2021_2023.jan22_competence',
        'poland_events_2021_2023.jan22_workers',
        'poland_events_2021_2023.jan22_tax_revolt',
      ]);
      choose('poland_events_2021_2023.jan22_resignation');
      chooseFirstAvailable([
        'poland_events_2021_2023.jan22_capacity_bill',
        'poland_events_2021_2023.jan22_blame',
        'poland_events_2021_2023.jan22_compensation',
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
      choose('poland_foreign_events.hungary_election_2022');
      chooseFirstAvailable([
        'poland_foreign_events.hungary_2022_democrats',
        'poland_foreign_events.hungary_2022_pragmatic',
        'poland_foreign_events.hungary_2022_fidesz',
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
      choose('poland_hub');
      if (engine.state.sceneId === 'poland_porozumienie_after.gowin_steps_down') {
        choose('poland_hub');
      }
      if (engine.state.sceneId === 'poland_civic_marches.labor_day') {
        chooseFirstAvailable([
          'poland_civic_marches.labor_day_union',
          'poland_civic_marches.labor_day_autonomous',
          'poland_civic_marches.labor_day_ceremony',
        ]);
        choose('poland_civic_marches.return_to_dated_desk');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events_2021_2023.june_2022':
      chooseFirstAvailable([
        'poland_events_2021_2023.jun22_enforce',
        'poland_events_2021_2023.jun22_opposition',
        'poland_events_2021_2023.jun22_speed',
        'poland_events_2021_2023.jun22_refuse',
      ]);
      choose('poland_hub');
      if (engine.state.sceneId === 'poland_civic_marches.pride') {
        chooseFirstAvailable([
          'poland_civic_marches.pride_community_institution',
          'poland_civic_marches.pride_movement',
          'poland_civic_marches.pride_party',
          'poland_civic_marches.pride_corporate',
          'poland_civic_marches.pride_worker_compact',
        ]);
        choose('poland_civic_marches.return_to_dated_desk');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
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
      choose('poland_events_2021_2023.sep22_reparations');
      chooseFirstAvailable([
        'poland_events_2021_2023.rep22_survivors',
        'poland_events_2021_2023.rep22_refuse_frame',
        'poland_events_2021_2023.rep22_support',
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
      choose('poland_events_2021_2023.oct22_coal');
      chooseFirstAvailable([
        'poland_events_2021_2023.coal22_deliver',
        'poland_events_2021_2023.coal22_audit',
        'poland_events_2021_2023.coal22_blame',
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
      choose('poland_events_2021_2023.nov22_return');
      choose('poland_events_2021_2023.nov22_przewodow');
      chooseFirstAvailable([
        'poland_events_2021_2023.nov22_verify',
        'poland_events_2021_2023.nov22_russia',
        'poland_events_2021_2023.nov22_ukraine_blame',
      ]);
      choose('poland_events_2021_2023.nov22_return');
      choose('poland_events_2021_2023.nov22_konf');
      chooseFirstAvailable([
        'poland_events_2021_2023.nov22_konf_preempt',
        'poland_events_2021_2023.nov22_konf_record',
        'poland_events_2021_2023.nov22_konf_shrug',
      ]);
      choose('poland_events_2021_2023.nov22_return');
      choose('poland_events_2021_2023.nov22_finish');
      choose('poland_hub');
      if (engine.state.sceneId === 'poland_minority_sejm.minority_vote_night') {
        chooseFirstAvailable([
          'poland_minority_sejm.minority_obstruct',
          'poland_minority_sejm.minority_trade',
        ]);
        choose('poland_hub');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events_2021_2023.december_2022':
      playOppositionBudgetStages(true);
      assert.strictEqual(
        engine.state.sceneId,
        'poland_events_2021_2023.dec22_szymczyk'
      );
      chooseFirstAvailable([
        'poland_events_2021_2023.szymczyk_oversight',
        'poland_events_2021_2023.szymczyk_resign',
        'poland_events_2021_2023.szymczyk_mock',
      ]);
      returnToHub();
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
      choose('poland_events_2021_2023.feb23_return');
      choose('poland_events_2021_2023.feb23_konf');
      chooseFirstAvailable([
        'poland_events_2021_2023.feb23_expose',
        'poland_events_2021_2023.feb23_court',
        'poland_events_2021_2023.feb23_ignore',
      ]);
      choose('poland_events_2021_2023.feb23_return');
      choose('poland_events_2021_2023.feb23_left');
      chooseFirstAvailable([
        'poland_events_2021_2023.feb23_autonomy',
        'poland_events_2021_2023.feb23_lead',
        'poland_events_2021_2023.feb23_social',
        'poland_events_2021_2023.feb23_delay',
      ]);
      choose('poland_events_2021_2023.feb23_return');
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
      choose('poland_events_2021_2023.mar23_resolution');
      chooseFirstAvailable([
        'poland_events_2021_2023.mar23_res_against',
        'poland_events_2021_2023.mar23_res_testimony',
        'poland_events_2021_2023.mar23_res_free_vote',
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
      choose('poland_events_2021_2023.apr23_grain');
      chooseFirstAvailable([
        'poland_events_2021_2023.grain23_transit',
        'poland_events_2021_2023.grain23_farmers',
        'poland_events_2021_2023.grain23_ban',
      ]);
      choose('poland_events_2021_2023.apr23_missile');
      chooseFirstAvailable([
        'poland_events_2021_2023.missile23_review',
        'poland_events_2021_2023.missile23_blame',
        'poland_events_2021_2023.missile23_civil',
      ]);
      choose('poland_hub');
      if (engine.state.sceneId ===
          'poland_porozumienie_after.agrounia_experiment') {
        choose('poland_hub');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events_2021_2023.may_2023':
      chooseFirstAvailable([
        'poland_events_2021_2023.may23_front',
        'poland_events_2021_2023.may23_legal',
        'poland_events_2021_2023.may23_contingent',
        'poland_events_2021_2023.may23_caution',
      ]);
      choose('poland_hub');
      if (engine.state.sceneId === 'poland_civic_marches.labor_day') {
        chooseFirstAvailable([
          'poland_civic_marches.labor_day_institution',
          'poland_civic_marches.labor_day_union',
          'poland_civic_marches.labor_day_revive',
          'poland_civic_marches.labor_day_autonomous',
          'poland_civic_marches.labor_day_ceremony',
        ]);
        choose('poland_civic_marches.return_to_dated_desk');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events_2021_2023.june_2023_hub':
      if (currentChoices().some(function(choice) {
        return choice.id === 'poland_events_2021_2023.jun23_march';
      })) {
        choose('poland_events_2021_2023.jun23_march');
        choose('poland_events_2021_2023.june_2023_hub');
      }
      if (currentChoices().some(function(choice) {
        return choice.id === 'poland_events_2021_2023.jun23_promises';
      })) {
        choose('poland_events_2021_2023.jun23_promises');
        choose('poland_events_2021_2023.june_2023_hub');
      }
      if (currentChoices().some(function(choice) {
        return choice.id === 'poland_events_2021_2023.jun23_dorota';
      })) {
        choose('poland_events_2021_2023.jun23_dorota');
        chooseFirstAvailable([
          'poland_events_2021_2023.jun23_protocol',
          'poland_events_2021_2023.jun23_autonomy',
          'poland_events_2021_2023.jun23_bill',
        ]);
        choose('poland_events_2021_2023.jun23_return');
      }
      if (currentChoices().some(function(choice) {
        return choice.id ===
          'poland_events_2021_2023.jun23_nowa_solidarnosc';
      })) {
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
      }
      choose('poland_events_2021_2023.jun23_finish');
      choose('poland_hub');
      if (engine.state.sceneId === 'poland_minority_sejm.minority_vote_night') {
        chooseFirstAvailable([
          'poland_minority_sejm.minority_obstruct',
          'poland_minority_sejm.minority_trade',
        ]);
        choose('poland_hub');
      }
      if (engine.state.sceneId === 'poland_civic_marches.pride') {
        chooseFirstAvailable([
          'poland_civic_marches.pride_community_institution',
          'poland_civic_marches.pride_movement',
          'poland_civic_marches.pride_party',
          'poland_civic_marches.pride_corporate',
          'poland_civic_marches.pride_worker_compact',
        ]);
        choose('poland_civic_marches.return_to_dated_desk');
      }
      assert.strictEqual(engine.state.sceneId, 'poland_hub');
      break;
    case 'poland_events_2021_2023.july_2023':
      chooseFirstAvailable([
        'poland_events_2021_2023.jul23_material',
        'poland_events_2021_2023.jul23_competence',
        'poland_events_2021_2023.jul23_cordon',
        'poland_events_2021_2023.jul23_copy',
      ]);
      choose('poland_events_2021_2023.router');
      assert.strictEqual(
        engine.state.sceneId,
        'poland_porozumienie_after.porozumienie_list_2023'
      );
      choose('poland_hub');
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
    choose('poland_manage_advisors.remove_zandberg');
    assert.strictEqual(engine.state.sceneId, 'poland_manage_advisors');
    assert.strictEqual(engine.state.qualities.n_advisors, 2);
    assert.strictEqual(engine.state.qualities.zandberg_advisor, 0);

    choose('poland_manage_advisors.add');
    choose('poland_manage_advisors.add_progressives');
    choose('poland_manage_advisors.add_gawkowski');
    assert.strictEqual(engine.state.sceneId, 'poland_manage_advisors');
    choose('poland_manage_advisors.remove');
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
    engine.goToScene('poland_merger_events.merger');
    let mergerChoice = currentChoices().find(function(choice) {
      return choice.id === 'poland_merger_events.merger_all';
    });
    assert(mergerChoice, 'The all-wing merger option is missing');
    assert.strictEqual(
      mergerChoice.canChoose,
      false,
      'Razem accepted a full merger without organisational or electoral mandate'
    );

    startStandard('razem-merger-presidential-mandate');
    qualities = engine.state.qualities;
    qualities.presidential_candidate = 'Adrian Zandberg';
    qualities.pres_first_round_complete = 1;
    qualities.pres_performance_level = 1;
    engine.goToScene('poland_merger_events.merger');
    mergerChoice = currentChoices().find(function(choice) {
      return choice.id === 'poland_merger_events.merger_all';
    });
    assert(
      qualities.razem_strength < qualities.barons_strength,
      'Presidential-mandate fixture accidentally made Razem the strongest wing'
    );
    assert(
      mergerChoice && mergerChoice.canChoose,
      'A successful Razem presidential campaign did not unlock merger leadership'
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
    const razemDissentBefore = qualities.razem_dissent;
    engine.goToScene('poland_merger_events.merger');
    mergerChoice = currentChoices().find(function(choice) {
      return choice.id === 'poland_merger_events.merger_all';
    });
    assert(mergerChoice && mergerChoice.canChoose);
    choose('poland_merger_events.merger_all');
    assert.strictEqual(qualities.razem_merged, 1);
    assert.strictEqual(qualities.left_project, 'Unified Razem-led Left');
    assert.strictEqual(qualities.party_unity, unityBefore + 10);
    assert.strictEqual(qualities.razem_dissent, razemDissentBefore - 18);
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
    engine.goToScene('poland_merger_events.left_revolt');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_merger_events.left_revolt_skipped'
    );
    assert.strictEqual(qualities.left_revolt_event_done, 1);
    assert.strictEqual(
      qualities.merger_resolution,
      'Separate parties, no internal revolt'
    );

    startStandard('merger-revolt-czarzasty');
    qualities = engine.state.qualities;
    qualities.nowa_lewica_merger_agreed = 1;
    qualities.merger_leader = 'Włodzimierz Czarzasty';
    engine.goToScene('poland_merger_events.left_revolt');
    assert.strictEqual(qualities.merger_revolt_leader, 'Włodzimierz Czarzasty');
    assert(currentChoices().some(function(choice) {
      return choice.id === 'poland_merger_events.revolt_suspend';
    }));
    const unavailableMiller = currentChoices().find(function(choice) {
      return choice.id === 'poland_merger_events.revolt_restore_miller';
    });
    assert(unavailableMiller,
      'A generic merger revolt did not show the unavailable Miller route');
    assert.strictEqual(unavailableMiller.canChoose, false,
      'Miller was selectable without PPS backing');
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_merger_events.revolt_razem_enforce';
    }));

    startStandard('old-left-collapse-with-calm-pps');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      nowa_lewica_merger_agreed: 1,
      left_merger_structure: 'unified_party',
      left_common_party_exists: 1,
      merger_leader: 'Włodzimierz Czarzasty',
      merger_barons_present: 1,
      barons_org_status: 'merged_current',
      party_unity: 44,
      pps_active: 1,
      pps_in_left: 1,
      pps_dissent: 20,
      pps_escalation_stage: 0,
      barons_strength: 35,
      left_machine_controller: 'barons',
    });
    engine.goToScene('poland_merger_events.left_revolt');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_merger_events.pps_democratic_split'
    );
    assert.strictEqual(currentChoices().find(function(choice) {
      return choice.id === 'poland_merger_events.revolt_restore_miller';
    }).canChoose, true, 'Party collapse did not unlock Miller with calm PPS');

    startStandard('old-left-pps-restoration');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      nowa_lewica_merger_agreed: 1,
      left_merger_structure: 'unified_party',
      left_common_party_exists: 1,
      merger_leader: 'Włodzimierz Czarzasty',
      merger_barons_present: 1,
      barons_org_status: 'merged_current',
      party_unity: 50,
      pps_active: 1,
      pps_in_left: 1,
      pps_dissent: 65,
      pps_escalation_stage: 2,
      barons_strength: 35,
      left_machine_controller: 'barons',
    });
    engine.goToScene('poland_merger_events.left_revolt');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_merger_events.pps_democratic_split',
      JSON.stringify({
        oldLeft: qualities.pps_old_left_revolt_2021,
        available: qualities.miller_restoration_available_2021,
        structure: qualities.left_merger_structure,
        common: qualities.left_common_party_exists,
        baronsPresent: qualities.merger_barons_present,
        baronsStatus: qualities.barons_org_status,
        baronsStrength: qualities.barons_strength,
        machine: qualities.left_machine_controller,
        unity: qualities.party_unity,
        ppsActive: qualities.pps_active,
        ppsInLeft: qualities.pps_in_left,
        ppsDissent: qualities.pps_dissent,
        ppsStage: qualities.pps_escalation_stage,
      })
    );
    assert.deepStrictEqual(
      currentChoices().map(function(choice) { return choice.id; }),
      [
        'poland_merger_events.pps_associate',
        'poland_merger_events.pps_accept_split',
        'poland_merger_events.pps_membership_settlement',
        'poland_merger_events.revolt_restore_miller',
        'poland_merger_events.pps_crush',
      ],
      'Miller did not compete with PPS autonomy, separation, democracy and repression'
    );
    const dissentBeforeRestoration = {
      spring: qualities.spring_dissent,
      labor: qualities.labor_dissent,
      progressives: qualities.progressives_dissent,
      razem: qualities.razem_dissent,
    };
    choose('poland_merger_events.revolt_restore_miller');
    assert.strictEqual(qualities.miller_restoration_done, 1);
    assert.strictEqual(qualities.old_left_route_state, 'miller_restoration');
    assert.strictEqual(qualities.pps_democratic_split_done, 1);
    assert.strictEqual(qualities.pps_in_left, 1);
    assert.strictEqual(qualities.pps_party_formed, 0);
    assert.strictEqual(qualities.miller_advisor, 1);
    assert.strictEqual(qualities.advisor_slot_1_locked, 1);
    assert.strictEqual(qualities.advisor_slot_1, 'miller');
    assert.strictEqual(qualities.n_advisors, 3);
    assert.strictEqual(qualities.party_unity, 34,
      'The forced restoration did not apply its extra unity cost');
    assert.strictEqual(qualities.spring_dissent,
      dissentBeforeRestoration.spring + 12);
    assert.strictEqual(qualities.labor_dissent,
      dissentBeforeRestoration.labor + 8);
    assert.strictEqual(qualities.progressives_dissent,
      dissentBeforeRestoration.progressives + 12);
    assert.strictEqual(qualities.razem_dissent,
      dissentBeforeRestoration.razem + 14);

    engine.goToScene('poland_manage_advisors');
    choose('poland_manage_advisors.remove');
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_manage_advisors.remove_miller';
    }));
    const removeCzarzastyChoice = currentChoices().find(function(choice) {
      return choice.id === 'poland_manage_advisors.remove_czarzasty';
    });
    assert(removeCzarzastyChoice);
    assert.strictEqual(removeCzarzastyChoice.canChoose, true);

    startStandard('pps-friendly-separation-and-reunion');
    qualities = engine.state.qualities;
    const leftBeforePpsSeparation = qualities.left_seats;
    const trackedPpsSeats = qualities.left_pps_seats;
    engine.goToScene('poland_merger_events.pps_democratic_split');
    choose('poland_merger_events.pps_accept_split');
    assert.strictEqual(qualities.pps_active, 0);
    assert.strictEqual(qualities.pps_in_left, 0);
    assert.strictEqual(qualities.pps_party_formed, 1);
    assert.strictEqual(qualities.pps_party_seats, trackedPpsSeats);
    assert.strictEqual(
      qualities.left_seats,
      leftBeforePpsSeparation - trackedPpsSeats
    );
    engine.goToScene('poland_events_2021_2023.december_2021_hub');
    assert.strictEqual(qualities.december_2021_pps_done, 1);
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_events_2021_2023.dec21_pps';
    }), 'December repeated a PPS split already negotiated in July');
    engine.goToScene('poland_events_2021_2023.feb23_left');
    choose('poland_events_2021_2023.feb23_autonomy');
    assert.strictEqual(qualities.pps_active, 1);
    assert.strictEqual(qualities.pps_in_left, 1);
    assert.strictEqual(qualities.pps_party_formed, 0);
    assert.strictEqual(qualities.pps_org_status, 'associated_current');
    assert.strictEqual(qualities.left_seats, leftBeforePpsSeparation);

    startStandard('merger-revolt-dual-without-czarzasty');
    qualities = engine.state.qualities;
    qualities.nowa_lewica_merger_agreed = 1;
    qualities.merger_leader = 'Dual chairs';
    qualities.czarzasty_advisor = 0;
    engine.goToScene('poland_merger_events.left_revolt');
    assert.strictEqual(qualities.merger_revolt_leader, 'Dual chairs');

    startStandard('merger-revolt-razem');
    qualities = engine.state.qualities;
    qualities.nowa_lewica_merger_agreed = 1;
    qualities.razem_merged = 1;
    qualities.merger_leader = 'Razem';
    engine.goToScene('poland_merger_events.left_revolt');
    assert.strictEqual(qualities.merger_revolt_leader, 'Razem');
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_merger_events.revolt_suspend';
    }));
    assert(currentChoices().some(function(choice) {
      return choice.id === 'poland_merger_events.revolt_razem_enforce';
    }));
    choose('poland_merger_events.revolt_razem_pact');
    assert.strictEqual(qualities.merger_resolution, 'Razem-led current pact');
  }

  function testGowinEventExcludesMiller() {
    startStandard('august-no-miller-route');
    const qualities = engine.state.qualities;
    qualities.year = 2021;
    qualities.month = 8;
    qualities.august_2021_done = 0;
    engine.goToScene('poland_events_2021_2023.august_2021');
    assert.strictEqual(engine.state.sceneId, 'poland_events_2021_2023.august_2021');
    assert(!currentChoices().some(function(choice) {
      return choice.id.includes('miller');
    }), 'The Gowin/minority-government event still offered Miller restoration');
    assert.strictEqual(
      game.scenes['poland_events_2021_2023.aug21_restore_miller'],
      undefined
    );
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
    choose('poland_manage_advisors.remove_czarzasty');
    choose('poland_manage_advisors.remove');
    choose('poland_manage_advisors.remove_biedron');
    choose('poland_manage_advisors.add');
    choose('poland_manage_advisors.add_razem_left');
    choose('poland_manage_advisors.add_biejat');
    choose('poland_manage_advisors.add');
    choose('poland_manage_advisors.add_razem_left');
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
    ['barons', 'spring', 'labor', 'progressives', 'pps'].forEach(function(faction) {
      assert.strictEqual(
        qualities[faction + '_dissent'],
        dissentBeforeFinish[faction] + 10,
        faction + ' did not receive the lopsided-bureau dissent penalty'
      );
    });
    assert.strictEqual(qualities.razem_dissent, dissentBeforeFinish.razem);
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
      drawableCardIds('poland_party_deck').filter(function(cardId) {
        return foreignRelationshipCardIds.includes(cardId);
      }),
      ['poland_european_campaign', 'poland_white_house_pressure'],
      'Opening Party Affairs should expose the EU and US relationship cards'
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
      drawableCardIds('poland_party_deck').filter(function(cardId) {
        return foreignRelationshipCardIds.includes(cardId);
      }),
      foreignRelationshipCardIds,
      'The four foreign relationships did not enter Party Affairs'
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

    const usWinnerImages = {
      'Joe Biden': 'img/poland/events/us-election-2020.webp',
      'Donald Trump': 'img/poland/events/us-election-2024.webp',
      'Kamala Harris': 'img/poland/events/us-candidate-harris.webp',
      'Nikki Haley': 'img/poland/events/us-candidate-haley.webp',
      'Ron DeSantis': 'img/poland/events/us-candidate-desantis.webp',
      'Marco Rubio': 'img/poland/events/us-candidate-rubio.webp',
      'JD Vance': 'img/poland/events/us-candidate-vance.webp',
      'Vivek Ramaswamy': 'img/poland/events/us-candidate-ramaswamy.webp',
    };
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
        game.scenes['poland_foreign_events.us_election_2020'].faceImage,
        usWinnerImages[qualities.us_election_2020_winner]
      );
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
        game.scenes['poland_foreign_events.us_election_2024'].faceImage,
        usWinnerImages[qualities.us_election_2024_winner]
      );
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
      assert.strictEqual(
        game.scenes['poland_foreign_events.us_election_2024'].faceImage,
        usWinnerImages[qualities.us_election_2024_winner]
      );
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
    assert(!foreignEventIds.includes(
      'poland_events_2026.ambassador_crisis_stozek_2026'
    ));

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
    assert(!foreignEventIds.includes(
      'poland_events_2026.ambassador_crisis_stozek_2026'
    ));
    assert(!foreignEventIds.includes('poland_foreign_events.us_review_2026'));

    startStandard('us-2026-trump-stozek-route');
    qualities = engine.state.qualities;
    qualities.year = 2026;
    qualities.month = 2;
    qualities.us_election_2024_done = 1;
    qualities.us_president = 'Donald Trump';
    qualities.us_administration = 'America First';
    qualities.sejm_speaker = 'Marta Stożek';
    engine.goToScene('poland_event_queue');
    foreignEventIds = (
      engine._compileChoices(game.scenes['poland_event_queue.all_events']) || []
    ).map(function(choice) {
      return choice.id;
    });
    assert(foreignEventIds.includes(
      'poland_events_2026.ambassador_crisis_stozek_2026'
    ));
    assert(!foreignEventIds.includes(
      'poland_events_2026.ambassador_crisis_2026'
    ));
    engine.goToScene(
      'poland_events_2026.ambassador_crisis_stozek_2026'
    );
    assert(contentText(engine.state.currentContent).includes(
      'A resolution becomes a diplomatic address'
    ));
    assert.strictEqual(currentChoices().length, 4);
    const stozekRazemDissent = qualities.razem_dissent;
    const stozekBaronsDissent = qualities.barons_dissent;
    engine.goToScene('poland_events_2026.ambassador_stand');
    assert.strictEqual(qualities.razem_dissent, stozekRazemDissent - 2);
    assert.strictEqual(qualities.barons_dissent, stozekBaronsDissent + 2);
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
      ],
      'Opposition should see Party, negotiation and Major Reforms decks'
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
        'poland_government_deck',
        'poland_major_reform_deck',
        'poland_party_deck',
      ],
      'Government participation did not reveal Party, Government and Major Reforms'
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
      // Major-reform fixtures exercise policy effects and pressure mechanics.
      // Give their synthetic Left-led Sejm a recorded majority now that
      // enactment goes through the parliamentary router.
      qualities.left_seats = 260;
      qualities.left_committed_seats = 260;
      qualities.ko_seats = 80;
      qualities.p2050_seats = 30;
      qualities.psl_seats = 30;
      qualities.pis_seats = 50;
      qualities.konf_seats = 10;
      qualities.sejm_total = 460;
    }

    function setProject(qualities, issue, proposal) {
      // A reform field must be on the slate before its project card exists.
      qualities[issue + '_on_slate'] = 1;
      qualities[issue + '_reform_defined'] = 1;
      qualities[issue + '_reform_goal_stage'] = 4;
      qualities[issue + '_reform_proposal_stage'] = proposal;
      qualities[issue + '_reform_next_stage'] = proposal;
      qualities[issue + '_reform_stage'] = 0;
      qualities[issue + '_reform_settled'] = 0;
      qualities['poland_' + issue + '_reform_timer'] = 0;
      qualities.reform_pressure_pending = 0;
      qualities.reform_pressure_cooldown = 0;
      qualities.major_reform_vote_ready = 0;
      qualities.major_reform_vote_complete = 0;
      qualities.legvote_enacted = 0;
      qualities.legvote_prepared = 0;
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

    function completeMajorReformVote() {
      if (engine.state.sceneId === 'poland_legislative_vote.forecast') {
        completeLegislativeVote();
      }
      assert.strictEqual(
        engine.state.qualities.legvote_profile,
        'major_reform',
        'A reachable Major Reform bypassed the legislative router: ' +
          JSON.stringify({
            sceneId: engine.state.sceneId,
            issue: engine.state.qualities.reform_pressure_issue,
            actor: engine.state.qualities.reform_pressure_actor,
            tier: engine.state.qualities.reform_ceiling_tier,
            target: engine.state.qualities.reform_pressure_target_stage,
            palaceCommitment:
              engine.state.qualities.labor_palace_commitment,
            palaceScore:
              engine.state.qualities.reform_ceiling_palace_score,
            mandate: engine.state.qualities.reform_ceiling_mandate,
            support: engine.state.qualities.reform_ceiling_support,
            salience: engine.state.qualities.reform_ceiling_salience,
            backlash: engine.state.qualities.reform_ceiling_backlash,
            progressiveOwnership:
              engine.state.qualities.reform_ceiling_progressive_ownership,
            conservativeOwnership:
              engine.state.qualities.reform_ceiling_conservative_ownership,
            majorReformVoteReady:
              engine.state.qualities.major_reform_vote_ready,
          })
      );
      assert.strictEqual(
        engine.state.qualities.legvote_enacted,
        1,
        'A majority-backed Major Reform fixture failed in Parliament'
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

    [
      ['psl', 'Third Way (PSL)', 'PSL'],
      ['p2050', 'Third Way (Poland 2050)', 'Poland 2050'],
    ].forEach(function(testCase) {
      [1, 0].forEach(function(thirdWayActive) {
        const party = testCase[0];
        const expectedName = testCase[thirdWayActive ? 1 : 2];
        startStandard(
          'major-reform-' + party + '-veto-name-' + thirdWayActive
        );
        const vetoQualities = engine.state.qualities;
        setExecutive(vetoQualities, 'lewica');
        vetoQualities['ministry_' + party + '_in_cabinet'] = 1;
        vetoQualities.third_way_active = thirdWayActive;
        vetoQualities.third_way_display_name = thirdWayActive
          ? 'Third Way'
          : 'PSL and Poland 2050';
        vetoQualities.reform_ceiling_issue = 'marriage';
        vetoQualities.reform_ceiling_target = 4;
        vetoQualities[party + '_relation'] = 0;
        vetoQualities[party + '_accept_rights'] = 0;
        vetoQualities[party === 'psl'
          ? 'psl_conservative_share'
          : 'p2050_christian_dem_share'] = 100;
        engine.goToScene('poland_reform_ceiling');
        assert.strictEqual(vetoQualities.reform_ceiling_blocker, party);
        assert.strictEqual(
          vetoQualities.reform_ceiling_blocker_name,
          expectedName,
          'Major Reforms did not identify the vetoing Third Way party'
        );
        engine.goToScene('poland_major_reforms.objection_queued');
        assert(
          contentText(engine.state.currentContent).replace(/\s+/g, ' ').includes(
            expectedName + ' blocks the bill'
          ),
          'The Major Reforms veto page did not show the named objector'
        );
      });
    });

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
    completeLegislativeVote();
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

    // The programme closes when the chosen slate is settled, not when all nine
    // public-mood fields are legislated, and the closing reward scales with how
    // far those settlements actually went.
    startStandard('major-reform-slate-completion');
    qualities = engine.state.qualities;
    ['abortion', 'marriage', 'labor'].forEach(function(issue) {
      qualities[issue + '_on_slate'] = 1;
      qualities[issue + '_reform_settled'] = 1;
      qualities[issue + '_reform_stage'] = 3;
    });
    qualities.major_reforms_complete = 0;
    const completionScale = Math.max(0.4, Math.min(1.6, 9 / 7.5));
    const completionPollBefore = qualities.left_poll;
    const completionTrustBefore = qualities.public_trust;
    const completionReputationBefore = qualities.winner_reputation;
    const completionOwnershipBefore = qualities.issue_ownership;
    const completionAffinityBefore = qualities.voter_groups.map(
      function(group) {
        return qualities[group + '_left_affinity'];
      }
    );
    const assertCompletionReward = function(note) {
      assert.strictEqual(qualities.major_reforms_complete, 1, note);
      assert.strictEqual(
        qualities.left_poll,
        completionPollBefore + 2 * completionScale,
        note
      );
      assert.strictEqual(
        qualities.public_trust,
        completionTrustBefore + Math.round(4 * completionScale),
        note
      );
      assert.strictEqual(
        qualities.winner_reputation,
        completionReputationBefore + Math.round(5 * completionScale),
        note
      );
      assert.strictEqual(
        qualities.issue_ownership,
        completionOwnershipBefore + Math.round(5 * completionScale),
        note
      );
      qualities.voter_groups.forEach(function(group, index) {
        assert.strictEqual(
          qualities[group + '_left_affinity'],
          completionAffinityBefore[index] + 2 * completionScale,
          note + ' — ' + group
        );
      });
    };
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.reform_slate_count, 3);
    assert.strictEqual(qualities.reform_slate_settled, 3);
    assert.strictEqual(qualities.reform_slate_weight, 9);
    assertCompletionReward('Completing the reform slate did not reward the party');
    assert.strictEqual(
      game.scenes.poland_major_reform_deck.viewIf(engine, qualities),
      false
    );
    engine.goToScene('poland_normalize');
    assertCompletionReward('The slate completion reward repeated');

    // A slate of token compromises must not pay the same as a maximal one.
    startStandard('major-reform-slate-compromise-reward');
    qualities = engine.state.qualities;
    ['abortion', 'marriage', 'labor'].forEach(function(issue) {
      qualities[issue + '_on_slate'] = 1;
      qualities[issue + '_reform_settled'] = 1;
      qualities[issue + '_reform_stage'] = 1;
    });
    qualities.major_reforms_complete = 0;
    const compromiseTrustBefore = qualities.public_trust;
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.major_reforms_complete, 1);
    assert.strictEqual(qualities.reform_slate_weight, 3);
    assert(
      qualities.public_trust - compromiseTrustBefore <
        Math.round(4 * completionScale),
      'Three token settlements paid the same as three strong ones'
    );

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
    // Passage power buys the right to table the bill. Whether it passes is a
    // separate question answered by the veto players: Lewica is the junior
    // partner in a KO-led cabinet here, and a liberal Palace will not sign the
    // maximal rights bill, so the ceiling is tier 3 and tier 4 is refused.
    assert.strictEqual(qualities.reform_ceiling_authority_tier, 3,
      'A junior coalition partner must not hold tier-4 authority');
    assert.strictEqual(qualities.reform_ceiling_palace_cap, 3,
      'A liberal Palace must cap rights reform at tier 3');
    choose('poland_abortion_reform.advance');
    assert.strictEqual(qualities.abortion_reform_stage, 0,
      'A tier-4 bill must not pass over the authority and Palace ceilings');
    assert.strictEqual(qualities.reform_pressure_pending, 1);
    assert.strictEqual(qualities.reform_ceiling_tier, 3);

    // Settling on the reachable tier closes the project in one move.
    qualities.reform_pressure_return_mode = 'pressure';
    engine.goToScene('poland_reform_pressure');
    assert.strictEqual(engine.state.sceneId, 'poland_reform_pressure.objection');
    choose('poland_reform_pressure.objection_narrow');
    completeMajorReformVote();
    assert.strictEqual(qualities.abortion_reform_stage, 3);
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
      // This fixture measures what an enacted settlement does, not whether it
      // can be reached, so every veto player is cleared out of the way: a Left
      // premiership, a Left Palace with a maximal written commitment and no
      // coalition partner holding a portfolio.
      settlementQualities.president_name = 'Magdalena Biejat';
      settlementQualities.left_president = 1;
      settlementQualities.pres_2025_hostile_president = 0;
      settlementQualities.president_relation = 80;
      settlementQualities[issue + '_palace_president'] = 'Magdalena Biejat';
      settlementQualities[issue + '_palace_commitment'] = 4;
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
      completeMajorReformVote();
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

    startStandard('major-reform-parliamentary-defeat');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'lewica');
    setProject(qualities, 'asylum', 1);
    qualities.president_name = 'Magdalena Biejat';
    qualities.left_president = 1;
    qualities.asylum_palace_president = 'Magdalena Biejat';
    qualities.asylum_palace_commitment = 4;
    qualities.left_seats = 40;
    qualities.left_committed_seats = 40;
    qualities.ko_seats = 50;
    qualities.p2050_seats = 20;
    qualities.psl_seats = 20;
    qualities.pis_seats = 300;
    qualities.konf_seats = 30;
    qualities.asylum_reform_progress = 40;
    qualities.reform_pressure_issue = 'asylum';
    qualities.reform_pressure_target_stage = 1;
    qualities.reform_pressure_previous_stage = 0;
    qualities.reform_pressure_return_mode = 'card';
    const defeatTrustBefore = qualities.public_trust;
    engine.goToScene('poland_major_reforms.resolve');
    assert.strictEqual(engine.state.sceneId, 'poland_legislative_vote.forecast');
    completeLegislativeVote();
    assert.strictEqual(engine.state.sceneId, 'poland_major_reforms.defeated');
    assert.strictEqual(qualities.legvote_enacted, 0);
    assert.strictEqual(qualities.asylum_reform_stage, 0);
    assert.strictEqual(qualities.asylum_reform_settled, 0);
    assert.strictEqual(qualities.asylum_on_slate, 1);
    assert.strictEqual(qualities.asylum_reform_progress, 30);
    assert.strictEqual(qualities.asylum_reform_proposal_stage, 4);
    assert.strictEqual(qualities.poland_asylum_reform_timer, 5);
    assert.strictEqual(qualities.public_trust, defeatTrustBefore - 1);

    startStandard('major-reform-forced-maximal-reward');
    qualities = engine.state.qualities;
    // Forcing tables the unchanged bill over a coalition veto. It does not
    // manufacture partner support, so this fixture gives Lewica enough MPs to
    // pass despite KO voting against it.
    setExecutive(qualities, 'lewica');
    qualities.left_seats = 300;
    qualities.left_committed_seats = 300;
    qualities.ko_seats = 60;
    qualities.p2050_seats = 20;
    qualities.psl_seats = 20;
    qualities.ministry_ko_in_cabinet = 1;
    setProject(qualities, 'labor', 4);
    qualities.president_name = 'Andrzej Duda';
    qualities.left_president = 0;
    qualities.pres_2025_hostile_president = 1;
    qualities.president_relation = 0;
    qualities.labor_palace_president = '';
    qualities.labor_palace_commitment = 0;
    qualities.ko_relation = 20;
    qualities.ko_accept_social = 10;
    qualities.ko_classical_liberal_share = 90;
    qualities.labor_ko_commitment = 0;
    qualities.ministry_psl_in_cabinet = 1;
    qualities.psl_relation = 20;
    qualities.psl_accept_social = 10;
    qualities.psl_agrarian_pragmatist_share = 0;
    qualities.labor_third_way_commitment = 0;
    qualities.resources = 0;
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
    const forcedRelationBefore = qualities.ko_relation;
    const forcedPslRelationBefore = qualities.psl_relation;
    const forcedDissentBefore = qualities.government_coalition_dissent;
    const forcedAffinityBefore = qualities.voter_groups.map(
      function(group) {
        return qualities[group + '_left_affinity'];
      }
    );
    engine.goToScene('poland_major_reforms.resolve');
    assert.strictEqual(qualities.reform_pressure_actor, 'ko');
    engine.goToScene('poland_reform_pressure');
    assert.strictEqual(
      currentChoices().find(function(choice) {
        return choice.id === 'poland_reform_pressure.objection_force';
      }).canChoose,
      true,
      'A coalition veto did not offer an unconditional forced vote'
    );
    choose('poland_reform_pressure.objection_force');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_reform_pressure.objection',
      'Ignoring the first veto did not continue to the next partner'
    );
    assert.strictEqual(qualities.ko_relation, forcedRelationBefore - 10);
    assert.strictEqual(qualities.reform_pressure_actor, 'psl');
    assert.strictEqual(
      qualities.government_coalition_dissent,
      forcedDissentBefore + 24
    );
    assert.strictEqual(
      currentChoices().find(function(choice) {
        return choice.id === 'poland_reform_pressure.objection_force';
      }).canChoose,
      true,
      'The second coalition veto did not offer the same forced-vote button'
    );
    choose('poland_reform_pressure.objection_force');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_reform_pressure.objection',
      'Clearing the partner vetoes did not move the count to the President'
    );
    assert.strictEqual(
      qualities.psl_relation,
      forcedPslRelationBefore - 10
    );
    assert.strictEqual(
      qualities.government_coalition_dissent,
      forcedDissentBefore + 48
    );
    assert.strictEqual(qualities.reform_pressure_actor, 'president');
    qualities.resources = 2;
    engine.goToScene('poland_reform_pressure');
    choose('poland_reform_pressure.palace_override');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_legislative_vote.forecast',
      'Clearing the presidential veto did not proceed to Parliament'
    );
    assert(
      qualities.legvote_ko_rate < 0.5,
      'Forcing the vote silently converted the vetoing partner into supporters'
    );
    completeMajorReformVote();
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

    // The negotiation has to be able to change the answer. This is the exact
    // scenario the old model could not represent: PSL blocks the maximal bill,
    // paid bargaining raises PSL's own score, and the ceiling that bargaining
    // lifts is the ceiling the common line then settles on.
    startStandard('major-reform-bargaining-lifts-the-ceiling');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'ko');
    setProject(qualities, 'marriage', 4);
    qualities.president_name = 'Rafał Trzaskowski';
    qualities.pres_2025_hostile_president = 0;
    qualities.ministry_psl_in_cabinet = 1;
    qualities.ko_relation = 80;
    qualities.ko_accept_rights = 80;
    qualities.ko_social_liberal_share = 60;
    qualities.ko_classical_liberal_share = 20;
    qualities.marriage_ko_commitment = 4;
    qualities.psl_relation = 70;
    qualities.psl_accept_rights = 65;
    qualities.psl_conservative_share = 25;
    qualities.marriage_third_way_commitment = 2;
    // The Palace has to have been worked too, or the presidency is the binding
    // constraint and no amount of coalition bargaining shows up in the ceiling.
    qualities.president_relation = 60;
    qualities.marriage_palace_president = 'Rafał Trzaskowski';
    qualities.marriage_palace_commitment = 2;
    qualities.resources = 5;
    qualities.reform_pressure_issue = 'marriage';
    qualities.reform_pressure_target_stage = 4;
    qualities.reform_pressure_previous_stage = 0;
    qualities.reform_pressure_return_mode = 'card';
    const dissentBeforeBargain = qualities.government_coalition_dissent;
    const resourcesBeforeBargain = qualities.resources;
    engine.goToScene('poland_major_reforms.resolve');
    assert.strictEqual(qualities.reform_pressure_pending, 1);
    assert.strictEqual(qualities.reform_pressure_actor, 'psl',
      'PSL must be the named blocker, not KO or the Palace');
    assert.strictEqual(qualities.reform_pressure_target_stage, 4);
    assert.strictEqual(qualities.marriage_reform_proposal_stage, 4);
    const ceilingBeforeBargain = qualities.reform_ceiling_tier;
    const pslScoreBeforeBargain = qualities.reform_ceiling_blocker_score;
    assert.strictEqual(ceilingBeforeBargain, 1,
      'This fixture needs a tier-1 opening ceiling; got ' +
      ceilingBeforeBargain);

    qualities.reform_pressure_return_mode = 'pressure';
    engine.goToScene('poland_reform_pressure');
    choose('poland_reform_pressure.objection_bargain');
    assert.strictEqual(qualities.marriage_third_way_commitment, 3);
    assert.strictEqual(qualities.reform_pressure_pending, 1);
    assert(qualities.reform_ceiling_blocker_score > pslScoreBeforeBargain,
      'A paid bargaining round did not move the blocker score');

    qualities.reform_pressure_return_mode = 'pressure';
    engine.goToScene('poland_reform_pressure');
    choose('poland_reform_pressure.objection_bargain');
    assert.strictEqual(qualities.marriage_third_way_commitment, 4);
    assert.strictEqual(qualities.reform_pressure_pending, 1);
    assert.strictEqual(qualities.reform_ceiling_tier, 2,
      'Two bargaining rounds must have lifted the ceiling to tier 2');
    assert.strictEqual(qualities.resources, resourcesBeforeBargain - 2);
    assert(
      qualities.government_coalition_dissent > dissentBeforeBargain,
      'Bargaining must still cost coalition dissent'
    );

    // Now the common line settles on the tier the bargaining actually bought.
    qualities.reform_pressure_return_mode = 'pressure';
    engine.goToScene('poland_reform_pressure');
    choose('poland_reform_pressure.objection_narrow');
    completeMajorReformVote();
    assert.strictEqual(qualities.marriage_reform_stage, 2);
    assert.strictEqual(qualities.marriage_reform_settled, 1);
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

    // A written Palace commitment belongs to the person who signed it. A new
    // president inherits nothing. The bill is tabled at tier 1 here because a
    // right-wing Palace has a hard profile ceiling of tier 1 on rights, and
    // above that ceiling the Chancellery protocol is refused outright instead of
    // taking another resource for nothing.
    startStandard('major-reform-palace-commitment-ownership');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'lewica');
    setProject(qualities, 'marriage', 1);
    qualities.president_name = 'Karol Nawrocki';
    qualities.pres_2025_hostile_president = 1;
    qualities.president_relation = 0;
    qualities.marriage_palace_commitment = 4;
    qualities.marriage_palace_president = 'Andrzej Duda';
    qualities.resources = 5;
    qualities.reform_pressure_issue = 'marriage';
    qualities.reform_pressure_target_stage = 1;
    qualities.reform_pressure_previous_stage = 0;
    qualities.reform_pressure_return_mode = 'card';
    engine.goToScene('poland_major_reforms.resolve');
    assert.strictEqual(qualities.reform_pressure_actor, 'president');
    assert.strictEqual(qualities.marriage_reform_stage, 0);
    assert.strictEqual(qualities.reform_ceiling_palace_locked, 0,
      'A tier at the Palace profile ceiling must not be reported as locked');
    qualities.reform_pressure_return_mode = 'pressure';
    engine.goToScene('poland_reform_pressure');
    choose('poland_reform_pressure.palace_reconsider');
    assert.strictEqual(qualities.marriage_palace_president, 'Karol Nawrocki');
    assert.strictEqual(qualities.marriage_palace_commitment, 1);
    assert.strictEqual(qualities.marriage_reform_stage, 0);
    assert.strictEqual(qualities.reform_pressure_pending, 1);
    assert.strictEqual(qualities.reform_pressure_actor, 'president');

    // Above the profile ceiling the same protocol must be refused rather than
    // sold. This is the resource sink the old model created.
    startStandard('major-reform-palace-profile-veto-refuses-spending');
    qualities = engine.state.qualities;
    setExecutive(qualities, 'lewica');
    setProject(qualities, 'marriage', 4);
    qualities.president_name = 'Karol Nawrocki';
    qualities.pres_2025_hostile_president = 1;
    qualities.president_relation = 100;
    qualities.resources = 5;
    qualities.reform_pressure_issue = 'marriage';
    qualities.reform_pressure_target_stage = 4;
    qualities.reform_pressure_previous_stage = 0;
    qualities.reform_pressure_return_mode = 'card';
    engine.goToScene('poland_major_reforms.resolve');
    assert.strictEqual(qualities.reform_pressure_actor, 'president');
    assert.strictEqual(qualities.reform_ceiling_palace_locked, 1);
    qualities.reform_pressure_return_mode = 'pressure';
    engine.goToScene('poland_reform_pressure');
    const lockedResources = qualities.resources;
    ['palace_reconsider', 'palace_relation'].forEach(function(option) {
      const choice = engine.getCurrentChoices().find(function(c) {
        return c.id === 'poland_reform_pressure.' + option;
      });
      assert(choice && !choice.canChoose,
        option + ' must be visible but refused against a profile veto');
    });
    assert.strictEqual(qualities.resources, lockedResources,
      'A profile veto must not consume resources');

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
    qualities.rival_ai_last_month_key = -1;
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
    // Keep bloc ownership neutral in this fixture: it isolates whether one
    // authored Palace commitment can move a tier-2 labour bill to a vote.
    qualities.social_spending_progressive_ownership = 40;
    qualities.social_spending_conservative_ownership = 40;
    qualities.left_poll = 20;
    qualities.labor_minister_party = 'Lewica';
    engine.goToScene('poland_labor_reform');
    assert.strictEqual(qualities.labor_reform_next_stage, 4);
    assert(qualities.labor_reform_power >= qualities.labor_reform_threshold);
    choose('poland_labor_reform.advance');
    assert.strictEqual(qualities.reform_pressure_target_stage, 4);
    // PiS's social-solidarist wing really will carry a strong labour bill — it
    // scores tier 3 here — so the binding veto player is the right-wing Palace,
    // whose profile ceiling on material questions is tier 2.
    assert.strictEqual(qualities.reform_ceiling_pis_tier, 3,
      'A solidarist-led PiS must reach tier 3 on labour');
    assert.strictEqual(qualities.reform_pressure_actor, 'president',
      'The Palace, not PiS, is the tighter constraint in this configuration');
    // A cold relationship and no implementation file mean Duda only signs tier
    // 1 today, even though his profile ceiling on material questions is tier 2.
    assert.strictEqual(qualities.reform_ceiling_tier, 1);
    assert.strictEqual(qualities.reform_ceiling_negotiable, 2);
    assert.strictEqual(qualities.reform_ceiling_palace_locked, 1,
      'A tier-4 labour bill is above this Palace profile ceiling');
    qualities.reform_pressure_return_mode = 'pressure';
    engine.goToScene('poland_reform_pressure');

    // Cutting the bill back to what the Palace could ever sign reopens the
    // Chancellery route instead of banking tier 1 immediately.
    choose('poland_reform_pressure.objection_narrow_to_cap');
    assert.strictEqual(qualities.reform_pressure_target_stage, 2);
    assert.strictEqual(qualities.labor_reform_stage, 0,
      'Cutting the bill back must not settle it');
    assert.strictEqual(qualities.reform_pressure_pending, 1);
    qualities.reform_pressure_return_mode = 'pressure';
    engine.goToScene('poland_reform_pressure');
    assert.strictEqual(qualities.reform_ceiling_palace_locked, 0,
      'Inside the profile ceiling the Palace must be negotiable again');

    // One Palace protocol lifts the presidential score over the tier-2 bar.
    qualities.resources = 5;
    choose('poland_reform_pressure.palace_reconsider');
    completeMajorReformVote();
    assert.strictEqual(qualities.labor_palace_commitment, 1);
    assert.strictEqual(qualities.labor_reform_stage, 2,
      'Working the Palace inside its profile ceiling must carry the bill');
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
    assert(
      partyCardIds.length >= 19,
      'Party Affairs lost part of its minimum native card set'
    );
    assert.deepStrictEqual(
      governmentCardIds.slice().sort(),
      expectedGovernmentCardIds
        .concat(
          hardLeftGovernmentCardIds,
          pathGovernmentCardIds,
          constituentGovernmentCardIds
        )
        .sort(),
      'Government Affairs did not contain its cabinet and gated-path card corpus'
    );
    assert.strictEqual(
      negotiationCardIds.length,
      6,
      'Pressure & Negotiate did not contain its six native cards'
    );
    majorReformCardIds.forEach(function(cardId) {
      assert(
        majorReformIds.includes(cardId),
        'Major Reforms lost persistent project ' + cardId
      );
    });
    foreignRelationshipCardIds.forEach(function(cardId) {
      assert(
        partyCardIds.includes(cardId),
        cardId + ' did not move into Party Affairs'
      );
    });
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

  function testHardLeftTurnCards() {
    startStandard('hard-left-turn-gate');
    const qualities = engine.state.qualities;
    assert.strictEqual(
      qualities.hard_left_turn_open,
      0,
      'The socialist-turn gate opened on the initial faction balance'
    );

    Object.assign(qualities, {
      continuous_campaign: 1,
      barons_strength: 25,
      spring_strength: 10,
      labor_strength: 15,
      progressives_strength: 20,
      razem_strength: 25,
      pps_strength: 5,
      razem_active: 1,
      razem_in_left: 1,
      razem_party_formed: 0,
      progressives_active: 1,
      progressives_in_left: 1,
      spring_path_stage: 0,
      spring_path_route: 'none',
      razem_cooperation: 70,
      opzz_cooperation: 70,
      union_trust: 70,
      labor_dissent: 20,
      left_in_government: 1,
      government_has_confidence: 1,
      caretaker_government: 0,
      ministries_finalized: 1,
      ministry_count: 1,
    });
    ministryPortfolioCases.forEach(function(testCase) {
      qualities[testCase.portfolio + '_minister_party'] = 'Unassigned';
    });
    qualities.labor_minister_party = 'Lewica';
    cabinetTimerIds.forEach(function(timerId) {
      qualities[timerId] = 12;
    });
    engine.goToScene('poland_normalize');

    assert.strictEqual(
      qualities.hard_left_turn_open,
      1,
      'An ascendant socialist current with cooperative labour did not open the gate'
    );
    assert(qualities.hard_left_current_share >= 22);

    const partyIds = drawableCardIds('poland_party_deck');
    [
      'poland_hard_left_party.decommunisation',
      'poland_hard_left_party.forgotten_poland',
      'poland_hard_left_party.internationale',
      'poland_hard_left_party.pps_question',
      'poland_hard_left_party.specter',
    ].forEach(function(cardId) {
      assert(partyIds.includes(cardId), cardId + ' was not drawable');
    });

    const governmentIds = drawableCardIds('poland_government_deck');
    hardLeftGovernmentCardIds.forEach(function(cardId) {
      assert(governmentIds.includes(cardId), cardId + ' was not drawable');
    });

    engine.goToScene('poland_hub');
    assert(currentChoices().some(function(choice) {
      return choice.id === 'poland_government_deck' && choice.canChoose;
    }), 'Government Affairs hid when only socialist-turn cards were ready');

    hardLeftOneShotTimerIds.forEach(function(timerId) {
      qualities[timerId] = -1;
    });
    engine.goToScene('poland_advance');
    hardLeftOneShotTimerIds.forEach(function(timerId) {
      assert.strictEqual(
        qualities[timerId],
        -1,
        timerId + ' counted down despite being a resolved one-shot card'
      );
    });
    engine.goToScene('poland_normalize');
    assert(!drawableCardIds('poland_party_deck').some(function(cardId) {
      return cardId.startsWith('poland_hard_left_party.');
    }), 'A resolved socialist-turn Party Affairs card became drawable again');
    assert(!drawableCardIds('poland_government_deck').some(function(cardId) {
      return hardLeftGovernmentCardIds.includes(cardId);
    }), 'A resolved socialist-turn Government Affairs card became drawable again');
    hardLeftOneShotTimerIds.forEach(function(timerId) {
      qualities[timerId] = 1;
    });
    engine.goToScene('poland_advance');
    engine.goToScene('poland_normalize');
    hardLeftOneShotTimerIds.forEach(function(timerId) {
      assert.strictEqual(qualities[timerId], 0,
        timerId + ' did not reopen after a refusal cooldown');
    });
    assert(drawableCardIds('poland_party_deck').some(function(cardId) {
      return cardId.startsWith('poland_hard_left_party.');
    }), 'Refused socialist-turn Party Affairs cards never reopened');
    assert(drawableCardIds('poland_government_deck').some(function(cardId) {
      return hardLeftGovernmentCardIds.includes(cardId);
    }), 'Refused socialist-turn Government Affairs cards never reopened');
    assert.strictEqual(
      game.scenes['poland_hard_left_party.decommunisation'].title,
      'The Names They Took Down'
    );
    assert.strictEqual(
      game.scenes['poland_hard_left_party.pps_question'].title,
      'Neither Polish, nor Socialist'
    );

    startStandard('hard-left-refusal-escalation');
    const refusalQualities = engine.state.qualities;
    refusalQualities.hard_left_refusals = 0;
    refusalQualities.razem_dissent = 0;
    engine.goToScene('poland_hard_left_party.forgotten_refuse');
    const firstRefusalPenalty = refusalQualities.razem_dissent;
    refusalQualities.hard_left_refusals = 3;
    refusalQualities.razem_dissent = 0;
    engine.goToScene('poland_hard_left_party.forgotten_refuse');
    assert(
      refusalQualities.razem_dissent > firstRefusalPenalty,
      'Repeated socialist-turn refusals did not compound Razem dissent'
    );

    startStandard('hard-left-unlawful-route');
    const unlawfulQualities = engine.state.qualities;
    const exposureBefore = unlawfulQualities.hard_left_exposure;
    const restraintBefore = unlawfulQualities.constitutional_restraint;
    const dualismBefore = unlawfulQualities.legal_dualism;
    engine.goToScene('poland_hard_left_government.mmt_unlawful');
    checkNumbers();
    assert(unlawfulQualities.hard_left_exposure > exposureBefore);
    assert(unlawfulQualities.constitutional_restraint < restraintBefore);
    assert(unlawfulQualities.legal_dualism > dualismBefore);
  }

  function testIdeologicalPathCards() {
    const partyCardIds = [
      'poland_path_party.market_bonfire_forms',
      'poland_path_party.market_meritocratic_left',
      'poland_path_party.market_money_without_shame',
      'poland_path_party.market_startup_left',
      'poland_path_party.market_taxpayers',
      'poland_path_party.populist_experts_turn',
      'poland_path_party.populist_miller_live',
      'poland_path_party.populist_neither_brussels',
      'poland_path_party.populist_new_samoobrona',
      'poland_path_party.populist_red_white',
      'poland_path_party.sld_candidate_lists',
      'poland_path_party.sld_membership_machine',
      'poland_path_party.sld_pensioners_congress',
      'poland_path_party.sld_secular_continuity',
      'poland_path_party.sld_state_memory',
      'poland_path_party.wiosna_friends_aisle',
      'poland_path_party.wiosna_metropolitan_generation',
      'poland_path_party.wiosna_movement_veto',
      'poland_path_party.wiosna_open_party',
      'poland_path_party.wiosna_two_bills',
    ];
    const routeCases = [
      {
        name: 'sld-partocracy',
        timers: [
          'poland_sld_membership_timer',
          'poland_sld_memory_timer',
          'poland_sld_pensioners_timer',
          'poland_sld_secular_timer',
          'poland_sld_safe_places_timer',
          'poland_sld_public_boards_timer',
          'poland_sld_mayors_timer',
          'poland_sld_pension_guarantee_timer',
          'poland_sld_national_champions_timer',
          'poland_sld_administrative_republic_timer',
        ],
        party: [
          'poland_path_party.sld_candidate_lists',
          'poland_path_party.sld_membership_machine',
          'poland_path_party.sld_pensioners_congress',
          'poland_path_party.sld_secular_continuity',
          'poland_path_party.sld_state_memory',
        ],
        government: [
          'poland_path_government.sld_administrative_republic',
          'poland_path_government.sld_mayors_cabinet',
          'poland_path_government.sld_national_champions',
          'poland_path_government.sld_pension_guarantee',
          'poland_path_government.sld_public_boards',
        ],
        apply: function(qualities) {
          qualities.sld_partocracy_stage = 3;
          qualities.sld_partocracy_doctrine = 'partocracy';
        },
      },
      {
        name: 'wiosna-social-liberal',
        timers: [
          'poland_wiosna_open_party_timer',
          'poland_wiosna_movement_veto_timer',
          'poland_wiosna_two_bills_timer',
          'poland_wiosna_metropolitan_timer',
          'poland_wiosna_friends_timer',
          'poland_wiosna_equal_citizenship_timer',
          'poland_wiosna_secular_state_timer',
          'poland_wiosna_reproductive_timer',
          'poland_wiosna_rainbow_school_timer',
          'poland_wiosna_open_republic_timer',
        ],
        party: [
          'poland_path_party.wiosna_friends_aisle',
          'poland_path_party.wiosna_metropolitan_generation',
          'poland_path_party.wiosna_movement_veto',
          'poland_path_party.wiosna_open_party',
          'poland_path_party.wiosna_two_bills',
        ],
        government: [
          'poland_path_government.wiosna_equal_citizenship',
          'poland_path_government.wiosna_open_republic',
          'poland_path_government.wiosna_rainbow_school',
          'poland_path_government.wiosna_reproductive_state',
          'poland_path_government.wiosna_secular_republic',
        ],
        apply: function(qualities) {
          qualities.spring_path_stage = 3;
          qualities.spring_path_route = 'social_liberal';
        },
      },
      {
        name: 'market-left',
        timers: [
          'poland_market_startup_timer',
          'poland_market_taxpayers_timer',
          'poland_market_merit_timer',
          'poland_market_money_timer',
          'poland_market_forms_timer',
          'poland_market_social_budget_timer',
          'poland_market_competition_timer',
          'poland_market_one_rate_timer',
          'poland_market_private_supply_timer',
          'poland_market_fiscal_council_timer',
        ],
        party: [
          'poland_path_party.market_bonfire_forms',
          'poland_path_party.market_meritocratic_left',
          'poland_path_party.market_money_without_shame',
          'poland_path_party.market_startup_left',
          'poland_path_party.market_taxpayers',
        ],
        government: [
          'poland_path_government.market_competition_state',
          'poland_path_government.market_fiscal_council',
          'poland_path_government.market_one_rate',
          'poland_path_government.market_private_supply',
          'poland_path_government.market_social_budget',
        ],
        apply: function(qualities) {
          qualities.market_liberal_active = 1;
        },
      },
      {
        name: 'sld-social-populist',
        timers: [
          'poland_populist_red_white_timer',
          'poland_populist_samoobrona_timer',
          'poland_populist_experts_timer',
          'poland_populist_sovereignty_timer',
          'poland_populist_live_timer',
          'poland_populist_tariff_timer',
          'poland_populist_welfare_timer',
          'poland_populist_bank_timer',
          'poland_populist_foreign_capital_timer',
          'poland_populist_referendum_timer',
        ],
        party: [
          'poland_path_party.populist_experts_turn',
          'poland_path_party.populist_miller_live',
          'poland_path_party.populist_neither_brussels',
          'poland_path_party.populist_new_samoobrona',
          'poland_path_party.populist_red_white',
        ],
        government: [
          'poland_path_government.populist_foreign_capital',
          'poland_path_government.populist_people_bank',
          'poland_path_government.populist_people_tariff',
          'poland_path_government.populist_referendum_state',
          'poland_path_government.populist_sovereign_welfare',
        ],
        apply: function(qualities) {
          qualities.old_left_route_state = 'miller_restoration';
          qualities.miller_restoration_done = 1;
          qualities.sld_populist_route_active = 1;
          qualities.sld_populist_settlement_stage = 4;
          qualities.sld_populist_orientation = 'independent';
          qualities.sld_populist_escalation = 'bounded welfare populism';
        },
      },
    ];

    startStandard('ideological-path-cards-closed');
    assert(!drawableCardIds('poland_party_deck').some(function(cardId) {
      return partyCardIds.includes(cardId);
    }), 'An ideological path card appeared before its route opened');
    assert(!drawableCardIds('poland_government_deck').some(function(cardId) {
      return pathGovernmentCardIds.includes(cardId);
    }), 'An ideological government card appeared before its route opened');

    routeCases.forEach(function(routeCase) {
      startStandard('ideological-path-' + routeCase.name);
      const qualities = engine.state.qualities;
      Object.assign(qualities, {
        continuous_campaign: 1,
        left_in_government: 1,
        government_has_confidence: 1,
        caretaker_government: 0,
        ministries_finalized: 1,
        ministry_count: 1,
        month_actions: 0,
      });
      ministryPortfolioCases.forEach(function(testCase) {
        qualities[testCase.portfolio + '_minister_party'] = 'Unassigned';
      });
      qualities.labor_minister_party = 'Lewica';
      cabinetTimerIds.forEach(function(timerId) {
        qualities[timerId] = 12;
      });
      routeCase.apply(qualities);
      engine.goToScene('poland_normalize');
      assert.strictEqual(
        qualities.ideological_path_government_open,
        1,
        routeCase.name + ' did not open Government Affairs'
      );

      const visiblePartyCards = drawableCardIds('poland_party_deck');
      routeCase.party.forEach(function(cardId) {
        assert(visiblePartyCards.includes(cardId), cardId + ' was not drawable');
      });
      partyCardIds.filter(function(cardId) {
        return !routeCase.party.includes(cardId);
      }).forEach(function(cardId) {
        assert(!visiblePartyCards.includes(cardId),
          cardId + ' leaked into ' + routeCase.name);
      });

      const visibleGovernmentCards = drawableCardIds(
        'poland_government_deck'
      );
      routeCase.government.forEach(function(cardId) {
        assert(visibleGovernmentCards.includes(cardId),
          cardId + ' was not drawable');
      });
      pathGovernmentCardIds.filter(function(cardId) {
        return !routeCase.government.includes(cardId);
      }).forEach(function(cardId) {
        assert(!visibleGovernmentCards.includes(cardId),
          cardId + ' leaked into ' + routeCase.name);
      });

      const governmentDeck = (engine._compileChoices(
        game.scenes.poland_hub
      ) || []).find(function(choice) {
        return choice.id === 'poland_government_deck';
      });
      assert(governmentDeck && governmentDeck.canChoose,
        'Government Affairs hid for ' + routeCase.name);

      routeCase.timers.forEach(function(timerId) {
        qualities[timerId] = -1;
      });
      engine.goToScene('poland_advance');
      routeCase.timers.forEach(function(timerId) {
        assert.strictEqual(
          qualities[timerId],
          -1,
          timerId + ' counted down despite being a resolved one-shot card'
        );
      });
      engine.goToScene('poland_normalize');
      assert(!drawableCardIds('poland_party_deck').some(function(cardId) {
        return routeCase.party.includes(cardId);
      }), routeCase.name + ' redrew a resolved Party Affairs card');
      assert(!drawableCardIds('poland_government_deck').some(function(cardId) {
        return routeCase.government.includes(cardId);
      }), routeCase.name + ' redrew a resolved Government Affairs card');

      routeCase.timers.forEach(function(timerId) {
        qualities[timerId] = 1;
      });
      engine.goToScene('poland_advance');
      engine.goToScene('poland_normalize');
      routeCase.timers.forEach(function(timerId) {
        assert.strictEqual(qualities[timerId], 0,
          timerId + ' did not reopen after a refusal cooldown');
      });
      routeCase.party.forEach(function(cardId) {
        assert(drawableCardIds('poland_party_deck').includes(cardId),
          cardId + ' did not reopen after refusal');
      });
      routeCase.government.forEach(function(cardId) {
        assert(drawableCardIds('poland_government_deck').includes(cardId),
          cardId + ' did not reopen after refusal');
      });
    });
  }

  function testConstituentProgrammeCards() {
    const programmeCases = [
      {
        name: 'sld',
        strength: 'barons_strength',
        active: 'barons_active',
        inside: 'barons_in_left',
        threshold: 38,
      },
      {
        name: 'wiosna',
        strength: 'spring_strength',
        active: 'spring_active',
        inside: 'spring_in_left',
        threshold: 25,
      },
      {
        name: 'pps',
        strength: 'pps_strength',
        active: 'pps_active',
        inside: 'pps_in_left',
        threshold: 6,
      },
      {
        name: 'razem',
        strength: 'razem_strength',
        active: 'razem_active',
        inside: 'razem_in_left',
        threshold: 15,
      },
      {
        name: 'nowa_lewica',
        setup: function(qualities) {
          qualities.nowa_lewica_merger_agreed = 1;
          qualities.left_common_party_exists = 1;
          // Prove the merger gate suppresses the predecessor cards even when
          // both founding currents would otherwise meet their strength gates.
          qualities.barons_strength = 100;
          qualities.spring_strength = 100;
        },
        disable: function(qualities) {
          qualities.left_common_party_exists = 0;
        },
      },
    ];

    function partyCardsFor(name) {
      return constituentPartyCardIds.filter(function(cardId) {
        return cardId.includes('.' + name + '_');
      });
    }

    function governmentCardsFor(name) {
      return constituentGovernmentCardIds.filter(function(cardId) {
        return cardId.includes('.' + name + '_');
      });
    }

    function timersFor(name) {
      return constituentOneShotTimerIds.filter(function(timerId) {
        return timerId.startsWith('poland_' + name + '_');
      });
    }

    startStandard('constituent-programmes-weak');
    let qualities = engine.state.qualities;
    Object.assign(qualities, {
      barons_strength: 0,
      spring_strength: 0,
      pps_strength: 0,
      razem_strength: 0,
      left_in_government: 1,
      government_has_confidence: 1,
      caretaker_government: 0,
      ministries_finalized: 1,
      ministry_count: 1,
    });
    engine.goToScene('poland_normalize');
    assert.strictEqual(
      qualities.constituent_programme_government_open,
      0,
      'Constituent programme gate opened while every current was below threshold'
    );
    assert(!drawableCardIds('poland_party_deck').some(function(cardId) {
      return constituentPartyCardIds.includes(cardId);
    }), 'A constituent programme Party Affairs card appeared below threshold');
    assert(!drawableCardIds('poland_government_deck').some(function(cardId) {
      return constituentGovernmentCardIds.includes(cardId);
    }), 'A constituent programme Government Affairs card appeared below threshold');

    programmeCases.forEach(function(programmeCase) {
      startStandard('constituent-programme-' + programmeCase.name);
      qualities = engine.state.qualities;
      Object.assign(qualities, {
        continuous_campaign: 1,
        barons_strength: 0,
        spring_strength: 0,
        pps_strength: 0,
        razem_strength: 0,
        barons_active: 1,
        spring_active: 1,
        pps_active: 1,
        razem_active: 1,
        barons_in_left: 1,
        spring_in_left: 1,
        pps_in_left: 1,
        razem_in_left: 1,
        nowa_lewica_merger_agreed: 0,
        left_common_party_exists: 0,
        left_in_government: 1,
        government_has_confidence: 1,
        caretaker_government: 0,
        ministries_finalized: 1,
        ministry_count: 1,
        month_actions: 0,
        government_coalition_dissent: 0,
      });
      if (programmeCase.strength) {
        qualities[programmeCase.strength] = programmeCase.threshold;
      }
      if (programmeCase.setup) {
        programmeCase.setup(qualities);
      }
      ministryPortfolioCases.forEach(function(testCase) {
        qualities[testCase.portfolio + '_minister_party'] = 'Unassigned';
      });
      qualities.labor_minister_party = 'Lewica';
      cabinetTimerIds.forEach(function(timerId) {
        qualities[timerId] = 12;
      });
      hardLeftOneShotTimerIds.forEach(function(timerId) {
        qualities[timerId] = -1;
      });
      constituentOneShotTimerIds.forEach(function(timerId) {
        qualities[timerId] = 0;
      });
      engine.goToScene('poland_normalize');

      assert.strictEqual(
        qualities.constituent_programme_government_open,
        1,
        programmeCase.name + ' strength did not open Government Affairs'
      );

      const expectedParty = partyCardsFor(programmeCase.name);
      const expectedGovernment = governmentCardsFor(programmeCase.name);
      const expectedTimers = timersFor(programmeCase.name);
      assert.strictEqual(expectedParty.length, 5);
      assert.strictEqual(expectedGovernment.length, 5);
      assert.strictEqual(expectedTimers.length, 10);

      const visibleParty = drawableCardIds('poland_party_deck');
      expectedParty.forEach(function(cardId) {
        assert(visibleParty.includes(cardId), cardId + ' was not drawable');
      });
      constituentPartyCardIds.filter(function(cardId) {
        return !expectedParty.includes(cardId);
      }).forEach(function(cardId) {
        assert(!visibleParty.includes(cardId),
          cardId + ' leaked into the ' + programmeCase.name + ' strength gate');
      });

      const visibleGovernment = drawableCardIds('poland_government_deck');
      expectedGovernment.forEach(function(cardId) {
        assert(visibleGovernment.includes(cardId), cardId + ' was not drawable');
      });
      constituentGovernmentCardIds.filter(function(cardId) {
        return !expectedGovernment.includes(cardId);
      }).forEach(function(cardId) {
        assert(!visibleGovernment.includes(cardId),
          cardId + ' leaked into the ' + programmeCase.name + ' strength gate');
      });

      const governmentDeck = (engine._compileChoices(
        game.scenes.poland_hub
      ) || []).find(function(choice) {
        return choice.id === 'poland_government_deck';
      });
      assert(governmentDeck && governmentDeck.canChoose,
        'Government Affairs hid for strong ' + programmeCase.name);

      expectedTimers.forEach(function(timerId) {
        qualities[timerId] = -1;
      });
      engine.goToScene('poland_advance');
      expectedTimers.forEach(function(timerId) {
        assert.strictEqual(
          qualities[timerId],
          -1,
          timerId + ' counted down despite being a resolved one-shot card'
        );
      });
      engine.goToScene('poland_normalize');
      assert(!drawableCardIds('poland_party_deck').some(function(cardId) {
        return expectedParty.includes(cardId);
      }), programmeCase.name + ' redrew a resolved Party Affairs card');
      assert(!drawableCardIds('poland_government_deck').some(function(cardId) {
        return expectedGovernment.includes(cardId);
      }), programmeCase.name + ' redrew a resolved Government Affairs card');

      expectedTimers.forEach(function(timerId) {
        qualities[timerId] = 1;
      });
      engine.goToScene('poland_advance');
      engine.goToScene('poland_normalize');
      expectedTimers.forEach(function(timerId) {
        assert.strictEqual(
          qualities[timerId],
          0,
          timerId + ' did not reopen after a refusal cooldown'
        );
      });
      expectedParty.forEach(function(cardId) {
        assert(drawableCardIds('poland_party_deck').includes(cardId),
          cardId + ' did not reopen after refusal');
      });
      expectedGovernment.forEach(function(cardId) {
        assert(drawableCardIds('poland_government_deck').includes(cardId),
          cardId + ' did not reopen after refusal');
      });

      if (programmeCase.active) {
        qualities[programmeCase.active] = 0;
      } else {
        programmeCase.disable(qualities);
      }
      engine.goToScene('poland_normalize');
      assert(!drawableCardIds('poland_party_deck').some(function(cardId) {
        return expectedParty.includes(cardId);
      }), programmeCase.name + ' cards remained after the constituent left');
    });

    constituentPartyCardIds.concat(constituentGovernmentCardIds)
      .forEach(function(cardId) {
        startStandard('constituent-outcomes-' + cardId);
        qualities = engine.state.qualities;
        qualities.resources = 100;
        qualities.budget = 100;
        engine.goToScene(cardId);
        const outcomeIds = currentChoices().map(function(choice) {
          return choice.id;
        });
        assert.strictEqual(
          outcomeIds.length,
          3,
          cardId + ' did not present exactly three authored outcomes'
        );
        outcomeIds.forEach(function(outcomeId) {
          startStandard('constituent-outcome-' + outcomeId);
          qualities = engine.state.qualities;
          qualities.resources = 100;
          qualities.budget = 100;
          engine.goToScene(outcomeId);
          checkNumbers();
        });
      });

    [
      ['sld_homes_national', 'government_goal_housing'],
      ['pps_six_hour_law', 'government_goal_labor'],
      ['wiosna_thirty_guarantee', 'government_goal_health'],
      ['nowa_lewica_breakfast_universal', 'government_goal_welfare'],
      ['wiosna_assistant_right', 'government_goal_equality'],
    ].forEach(function(testCase) {
      startStandard('constituent-burden-' + testCase[0]);
      qualities = engine.state.qualities;
      qualities.budget = 100;
      engine.goToScene('poland_constituent_government.' + testCase[0]);
      assert.strictEqual(
        qualities[testCase[1]],
        1,
        testCase[0] + ' did not fulfill ' + testCase[1]
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
    let qualities;
    startStandard('shared-opposition-budget-fast-lane');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2024,
      month: 12,
      annual_budget_year: 2024,
      left_in_government: 0,
      government_party: 'ko',
      prime_minister_party: 'ko',
      finance_minister_party: 'KO',
      government_has_confidence: 1,
      caretaker_government: 0,
      government_support_seats: 240,
      coalition_seats: 240,
      ko_seats: 205,
      psl_seats: 35,
      left_seats: 26,
      ministry_ko_in_cabinet: 1,
      ministry_psl_in_cabinet: 1,
      resources: 5,
    });
    engine.goToScene('poland_budget_2023_2026.annual_budget');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_budget_2023_2026.budget_open'
    );
    const resourcesBefore = qualities.resources;
    globalThis.polandBudgetModel.selectStrategy(qualities, 'no');
    choose('poland_budget_2023_2026.submit_budget');
    assert.strictEqual(qualities.resources, resourcesBefore);
    assert.strictEqual(qualities.annual_budget_posture, 'Vote no');
    assert.strictEqual(
      qualities.annual_budget_concession,
      'No amendments or programme credit'
    );
    assert(!qualities.budget_game.sejm.reasons.some(function(reason) {
      return /rebel/i.test(reason);
    }));

    if (process.env.DSS_BUDGET_SMOKE === '1') {
      return;
    }

    startStandard('article-160-is-not-a-budget-vote');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      left_in_government: 1,
      government_has_confidence: 1,
      caretaker_government: 0,
      annual_budget_left_cabinet_authority: 1,
      annual_budget_passed: 0,
      budget_deadline_active: 1,
      government_support_seats: 235,
      coalition_seats: 235,
      budget_game: {year: 2024},
    });
    engine.goToScene('poland_budget_2023_2026.confidence_vote');
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
    choose('poland_events_2026.constructive_roll_2026');
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
    choose('poland_events_2026.constructive_szydlo');
    choose('poland_events_2026.constructive_roll_2026');
    assert.strictEqual(qualities.constructive_passed, 0);
    assert.strictEqual(qualities.government_has_confidence, 1);
    assert.strictEqual(qualities.caretaker_government, 0);
    assert.strictEqual(qualities.coalition_seats, 250);

    startStandard('constructive-sikorski-nightmare-repeals-reforms');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2026,
      month: 11,
      continuous_campaign: 1,
      left_in_government: 1,
      government_has_confidence: 1,
      caretaker_government: 0,
      formation_in_progress: 0,
      formation_complete: 1,
      coalition_broken: 0,
      government_party: 'lewica',
      government_coalition_dissent: 75,
      ministry_ko_in_cabinet: 1,
      president_name: 'Karol Nawrocki',
      prime_minister: 'Agnieszka Dziemianowicz-Bąk',
      left_seats: 60,
      pis_seats: 155,
      ko_seats: 130,
      psl_seats: 35,
      p2050_seats: 25,
      centrum_seats: 10,
      konf_seats: 45,
      ko_relation: 18,
      psl_relation: 22,
      p2050_relation: 24,
      centrum_relation: 20,
      coalition_viable_ko_konf: 1,
      konf_normalisation: 55,
      ko_konf_partner_line: 'governing',
      psl_konf_partner_line: 'open',
      abortion_reform_stage: 4,
      abortion_reform_settled: 1,
      abortion_law_enacted: 1,
      marriage_reform_stage: 3,
      marriage_reform_settled: 1,
      partnership_sejm_passed: 1,
      partnership_implementation_complete: 1,
      labor_reform_stage: 4,
      labor_reform_settled: 1,
      pip_law_enacted: 1,
    });
    engine.goToScene(
      'poland_events_2026.constructive_motion_2026'
    );
    assert.strictEqual(qualities.constructive_candidate, 'Radosław Sikorski');
    choose('poland_events_2026.constructive_sikorski');
    choose('poland_events_2026.constructive_roll_2026');
    assert.strictEqual(qualities.constructive_passed, 1);
    assert.strictEqual(qualities.government_party, 'ko');
    assert.strictEqual(qualities.sikorski_konf_cabinet, 1);
    assert.strictEqual(qualities.finance_minister_party, 'Konfederacja');
    choose('poland_events_2026.constructive_result_continue_2026');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_prime_minister_intro.show'
    );
    choose('poland_prime_minister_intro.continue');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2026.sikorski_compact_2026'
    );
    assert.strictEqual(qualities.sikorski_reforms_at_risk, 3);
    assert.strictEqual(qualities.ko_relation, 0);
    assert.strictEqual(qualities.psl_relation, 0);
    assert.strictEqual(qualities.p2050_relation, 0);
    choose('poland_events_2026.sikorski_ledger_2026');
    assert.strictEqual(
      qualities.abortion_reform_stage,
      4,
      'The Sikorski compact repealed reforms before its dated calendar'
    );
    engine.goToScene('poland_events_2026.sikorski_freeze_2026');
    assert.strictEqual(qualities.sikorski_repeal_stage, 2);
    assert.strictEqual(qualities.abortion_reform_stage, 4);
    choose('poland_events_2026.sikorski_freeze_courts_2026');
    engine.goToScene('poland_events_2027.sikorski_marriage_revolt_2027');
    assert.strictEqual(qualities.sikorski_marriage_bill_pending, 1);
    assert.strictEqual(qualities.marriage_reform_stage, 3);
    choose('poland_events_2027.sikorski_marriage_left_line_2027');
    const koBeforeTrzaskowskiExodus = qualities.ko_seats;
    const leftBeforeTrzaskowskiExodus = qualities.left_seats;
    const supportBeforeTrzaskowskiExodus =
      qualities.government_support_seats;
    const razemDissentBeforeLiberalRefugees = qualities.razem_dissent;
    const razemCooperationBeforeLiberalRefugees =
      qualities.razem_cooperation;
    engine.goToScene(
      'poland_events_2027.sikorski_trzaskowski_crosses_2027'
    );
    assert.strictEqual(qualities.trzaskowski_joined_left, 1);
    assert(qualities.left_trzaskowski_current_seats > 0);
    assert(!qualities.trzaskowski_affiliation.includes('KO'));
    assert(
      qualities.trzaskowski_affiliation.includes(qualities.left_party_name)
    );
    assert(qualities.razem_dissent > razemDissentBeforeLiberalRefugees);
    assert(
      qualities.razem_cooperation < razemCooperationBeforeLiberalRefugees
    );
    assert.strictEqual(
      qualities.ko_seats,
      koBeforeTrzaskowskiExodus - qualities.left_trzaskowski_current_seats
    );
    assert.strictEqual(
      qualities.left_seats,
      leftBeforeTrzaskowskiExodus +
        qualities.left_trzaskowski_current_seats
    );
    assert.strictEqual(
      qualities.government_support_seats,
      supportBeforeTrzaskowskiExodus -
        qualities.left_trzaskowski_current_seats
    );
    assert.strictEqual(qualities.sikorski_refugee_wave, 1);
    assert.strictEqual(
      qualities.sikorski_minority_government,
      qualities.government_support_seats < 231 ? 1 : 0
    );
    choose('poland_events_2027.sikorski_trz_platform_2027');
    engine.goToScene('poland_events_2027.sikorski_black_march_2027');
    assert.strictEqual(qualities.abortion_reform_stage, 0);
    assert.strictEqual(qualities.marriage_reform_stage, 0);
    assert.strictEqual(qualities.abortion_law_enacted, 0);
    assert.strictEqual(qualities.partnership_sejm_passed, 0);
    assert.strictEqual(
      qualities.labor_reform_stage,
      4,
      'The labour reform fell before the final repeal event'
    );
    choose('poland_events_2027.sikorski_black_autonomy_2027');
    const koBeforeComponentExodus = qualities.ko_seats;
    engine.goToScene(
      'poland_events_2027.sikorski_ko_currents_flee_2027'
    );
    assert.strictEqual(qualities.ipl_joined_left, 1);
    assert.strictEqual(qualities.greens_joined_left, 1);
    assert(qualities.left_ipl_current_seats > 0);
    assert(qualities.left_green_current_seats > 0);
    assert.strictEqual(
      qualities.ko_seats,
      koBeforeComponentExodus - qualities.left_ipl_current_seats -
        qualities.left_green_current_seats
    );
    assert.strictEqual(qualities.sikorski_refugee_wave, 2);
    choose('poland_events_2027.sikorski_ko_federation_2027');
    engine.goToScene('poland_events_2027.sikorski_security_state_2027');
    assert.strictEqual(qualities.labor_reform_stage, 0);
    assert.strictEqual(qualities.pip_law_enacted, 0);
    assert(qualities.sikorski_police_militarisation >= 6);
    choose('poland_events_2027.sikorski_security_nonviolence_2027');
    const p2050BeforeSocialExodus = qualities.p2050_seats;
    engine.goToScene(
      'poland_events_2027.sikorski_p2050_refugees_2027'
    );
    assert.strictEqual(qualities.p2050_social_joined_left, 1);
    assert(qualities.left_p2050_current_seats > 0);
    assert.strictEqual(
      qualities.p2050_seats,
      p2050BeforeSocialExodus - qualities.left_p2050_current_seats
    );
    assert.strictEqual(qualities.sikorski_refugee_wave, 3);
    assert(qualities.razem_dissent > razemDissentBeforeLiberalRefugees);
    assert(
      qualities.razem_cooperation < razemCooperationBeforeLiberalRefugees
    );
    assert.strictEqual(
      qualities.sikorski_minority_government,
      qualities.government_support_seats < 231 ? 1 : 0
    );
    assert.strictEqual(
      qualities.sikorski_minority_government,
      1,
      'The tested refugee wave did not leave Sikorski with a minority cabinet'
    );
    choose('poland_events_2027.sikorski_p2050_social_floor_2027');
    engine.goToScene('poland_normalize');
    assert(!qualities.trzaskowski_affiliation.includes('KO'));
    assert.strictEqual(qualities.finance_minister_party, 'Konfederacja');
    assert.strictEqual(
      qualities.coalition_seats,
      qualities.ko_seats + qualities.psl_seats +
        qualities.p2050_seats + qualities.konf_seats,
      'Normalization erased or miscounted the Sikorski compact'
    );

    startStandard('sikorski-marriage-repeal-meets-trzaskowski-veto');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2027,
      continuous_campaign: 1,
      president_name: 'Rafał Trzaskowski',
      sikorski_nightmare: 1,
      sikorski_repeal_stage: 2,
      sikorski_reforms_at_risk: 2,
      sikorski_abortion_stage_before_repeal: 4,
      sikorski_marriage_stage_before_repeal: 4,
      sikorski_labor_stage_before_repeal: 0,
      abortion_reform_stage: 4,
      abortion_reform_progress: 80,
      abortion_law_enacted: 1,
      marriage_reform_stage: 4,
      marriage_reform_progress: 80,
      partnership_sejm_passed: 1,
      partnership_implementation_complete: 1,
      partnership_revision_enacted: 1,
      pis_seats: 100,
      konf_seats: 30,
      psl_seats: 20,
      ko_seats: 130,
      p2050_seats: 25,
    });
    engine.goToScene('poland_events_2027.sikorski_marriage_revolt_2027');
    assert.strictEqual(qualities.sikorski_marriage_veto_promised, 1);
    choose('poland_events_2027.sikorski_marriage_join_2027');
    engine.goToScene('poland_events_2027.sikorski_black_march_2027');
    assert.strictEqual(qualities.sikorski_abortion_vetoed, 1);
    assert.strictEqual(qualities.abortion_reform_stage, 4);
    assert.strictEqual(qualities.abortion_law_enacted, 1);
    assert.strictEqual(qualities.sikorski_marriage_vetoed, 1);
    assert.strictEqual(qualities.marriage_reform_stage, 4);
    choose('poland_events_2027.sikorski_black_document_2027');
    engine.goToScene('poland_events_2027.sikorski_security_state_2027');
    assert(qualities.sikorski_marriage_override_votes < 276);
    assert.strictEqual(
      qualities.marriage_reform_stage,
      4,
      'A failed override silently defeated President Trzaskowski\'s veto'
    );

    startStandard('left-president-vetoes-every-sikorski-repeal');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2027,
      continuous_campaign: 1,
      president_name: 'Magdalena Biejat',
      pres_2025_winner: 'Magdalena Biejat',
      pres_2025_winner_key: 'left',
      pres_2025_inaugurated: 1,
      left_president: 1,
      sikorski_nightmare: 1,
      sikorski_repeal_stage: 2,
      sikorski_reforms_at_risk: 3,
      sikorski_abortion_stage_before_repeal: 4,
      sikorski_marriage_stage_before_repeal: 4,
      sikorski_labor_stage_before_repeal: 4,
      abortion_reform_stage: 4,
      abortion_reform_progress: 100,
      abortion_law_enacted: 1,
      marriage_reform_stage: 4,
      marriage_reform_progress: 100,
      partnership_sejm_passed: 1,
      partnership_implementation_complete: 1,
      partnership_revision_enacted: 1,
      labor_reform_stage: 4,
      labor_reform_progress: 100,
      pip_law_enacted: 1,
      left_poll: 15,
      left_poll_momentum: 0,
      pis_seats: 155,
      konf_seats: 45,
      psl_seats: 35,
      ko_seats: 130,
      p2050_seats: 25,
    });
    const leftPollBeforeRepealVetoes = qualities.left_poll;
    engine.goToScene('poland_events_2027.sikorski_marriage_revolt_2027');
    assert.strictEqual(qualities.sikorski_marriage_veto_promised, 1);
    choose('poland_events_2027.sikorski_marriage_left_line_2027');
    engine.goToScene('poland_events_2027.sikorski_black_march_2027');
    assert.strictEqual(qualities.sikorski_abortion_vetoed, 1);
    assert.strictEqual(qualities.sikorski_marriage_vetoed, 1);
    assert.strictEqual(qualities.abortion_reform_stage, 4);
    assert.strictEqual(qualities.marriage_reform_stage, 4);
    assert.strictEqual(qualities.sikorski_left_veto_count, 2);
    assert.strictEqual(qualities.sikorski_veto_president_branded, 1);
    choose('poland_events_2027.sikorski_black_autonomy_2027');
    engine.goToScene('poland_events_2027.sikorski_security_state_2027');
    assert.strictEqual(qualities.sikorski_labor_vetoed, 1);
    assert.strictEqual(qualities.labor_reform_stage, 4);
    assert.strictEqual(qualities.pip_law_enacted, 1);
    assert.strictEqual(qualities.marriage_reform_stage, 4);
    assert.strictEqual(qualities.sikorski_left_veto_count, 3);
    assert.strictEqual(qualities.sikorski_reforms_repealed, 0);
    assert(qualities.left_poll < leftPollBeforeRepealVetoes);
    choose('poland_events_2027.sikorski_security_nonviolence_2027');
    const leftPollBeforeVetoBrandCampaign = qualities.left_poll;
    engine.goToScene(
      'poland_events_2027.sikorski_veto_president_campaign_2027'
    );
    assert(qualities.left_poll < leftPollBeforeVetoBrandCampaign);
    assert.strictEqual(qualities.sikorski_veto_president_branded, 1);
    choose('poland_events_2027.sikorski_veto_own_2027');
    if (process.env.DSS_SIKORSKI_SMOKE === '1') {
      return;
    }

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
    qualities.budget_game = {year: 2026};
    engine.goToScene('poland_budget_2023_2026.self_dissolution');
    assert.strictEqual(qualities.snap_self_dissolution_threshold, 307);
    assert.strictEqual(
      qualities.snap_self_dissolution_yes +
        qualities.snap_self_dissolution_no +
        qualities.snap_self_dissolution_abstain,
      460
    );
    assert.strictEqual(
      qualities.caretaker_government,
      0,
      'Requesting election talks improperly dismissed the cabinet'
    );

    startStandard('coalition-affairs-hidden-in-opposition');
    qualities = engine.state.qualities;
    qualities.left_in_government = 0;
    qualities.internal_dissent = 35;
    qualities.government_coalition_dissent = 30;
    qualities.early_election_risk = 80;
    qualities.month_actions = 0;
    qualities.max_month_actions = 1;
    qualities.poland_coalition_affairs_timer = 0;
    engine.goToScene('poland_party_deck');
    assert(
      !currentChoices().some(function(choice) {
        return choice.id === 'poland_coalition_affairs';
      }),
      'Coalition Affairs remained available while Lewica was in opposition'
    );

    startStandard('coalition-affairs-snap-launches-campaign');
    qualities = engine.state.qualities;
    qualities.left_in_government = 1;
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.month_actions = 0;
    qualities.max_month_actions = 1;
    qualities.poland_coalition_affairs_timer = 0;
    qualities.internal_dissent = 28;
    qualities.government_coalition_dissent = 15;
    qualities.early_election_risk = 60;
    qualities.snap_election_requested = 0;
    qualities.snap_campaign_active = 0;
    qualities.snap_election_held = 0;
    qualities.snap_event_deferred_time = -1;
    qualities.continuous_campaign = 1;
    engine.goToScene('poland_coalition_affairs');
    choose('poland_coalition_affairs.snap');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2026.snap_campaign_launch',
      'Coalition Affairs snap failed to open the snap campaign launch'
    );
    assert.strictEqual(qualities.snap_election_requested, 0);
    assert.strictEqual(qualities.snap_campaign_active, 1);
    assert(qualities.snap_election_request_time >= 0);

    startStandard('coalition-affairs-stale-opposition-safe-exit');
    qualities = engine.state.qualities;
    qualities.left_in_government = 0;
    qualities.resources = 0;
    qualities.month_actions = 1;
    qualities.max_month_actions = 1;
    engine.goToScene('poland_coalition_affairs');
    const staleChoices = currentChoices().map(function(choice) {
      return choice.id;
    });
    assert(staleChoices.includes('poland_coalition_affairs.stand_down'));
    choose('poland_coalition_affairs.stand_down');
    assert.notStrictEqual(engine.state.sceneId, 'poland_coalition_affairs');
    assert.strictEqual(
      qualities.month_actions,
      0,
      'Stale opposition entry to Coalition Affairs still consumed the turn'
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
    qualities.snap_election_requested = 1;
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
    engine.goToScene('poland_budget_2023_2026.annual_budget');
    assert.strictEqual(
      globalThis.polandBudgetModel.preview(qualities).vote.governmentYes,
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
    assert.strictEqual(qualities.snap_pm_candidate, qualities.ko_leader);
    assert.strictEqual(qualities.snap_pm_is_right, 0);
    assert.strictEqual(qualities.snap_pm_base, 224);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_government_formation.formation_coalition_menu']
    );
    assert.strictEqual(
      qualities.formation_president_nominee,
      qualities.snap_pm_candidate
    );
    assert.strictEqual(qualities.formation_continuous, 1);
    assert.strictEqual(qualities.formation_in_progress, 1);

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
    choose('poland_regional_campaign.snap_open');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_regional_campaign.board'
    );
    globalThis.polandElectionModel.setCampaignIssue(
      qualities,
      'living_standards'
    );
    globalThis.polandElectionModel.setCampaignProvince(qualities, '14');
    choose('poland_regional_campaign.confirm');
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
    choose('poland_regional_campaign.snap_close');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_regional_campaign.board'
    );
    globalThis.polandElectionModel.setCampaignIssue(
      qualities,
      'living_standards'
    );
    globalThis.polandElectionModel.setCampaignProvince(qualities, '14');
    choose('poland_regional_campaign.confirm');
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

    startStandard('timeline-climate-live-prime-minister');
    qualities = engine.state.qualities;
    qualities.prime_minister = 'Władysław Kosiniak-Kamysz';
    engine.goToScene(
      'poland_conflict_climate_events.last_generation_bridges_2024'
    );
    copy = contentText(engine.state.currentContent);
    assert(copy.includes('Władysław Kosiniak-Kamysz'));
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
    const laborNominee = qualities.ministry_labor_nominee;
    assert.notStrictEqual(laborNominee, qualities.president_name);
    choose('poland_ministries.take_labor');
    assert.strictEqual(qualities.labor_minister, laborNominee);
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
    qualities.pres_2025_right_candidate = 'Karol Nawrocki';
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

  function openDatedEventQueue(year, month, allowEmpty) {
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
    if (allowEmpty && engine.state.sceneId === 'poland_hub') return qualities;
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
    assert(
      typeof qualities.news_headline === 'string' &&
        qualities.news_headline.length > 0,
      'The dated-event queue has no consequence headline'
    );
    if (engine.state.sceneId !== expectedSceneId) {
      const retainedResultScene = engine.state.sceneId;
      assert(
        currentChoices().some(function(choice) {
          return choice.id === 'poland_event_queue' && choice.canChoose;
        }),
        'A dated result has no retained exit back to the queue: ' +
          retainedResultScene
      );
      try {
        choose('poland_event_queue');
      } catch (error) {
        error.message += ' ' + JSON.stringify({
          date: qualities.date_label,
          count: qualities.poland_event_queue_count,
          headline: qualities.news_headline,
          expectedSceneId: expectedSceneId,
        });
        throw error;
      }
    }
    assert.strictEqual(
      engine.state.sceneId,
      expectedSceneId,
      'The dated result did not open the expected next screen'
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

  function testHistoricalDatedEventContinuity() {
    const monthNames = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const cases = [
      [2020, 1, {
        media_event_done: 1,
        po_leadership_2020_done: 0,
      }, 'poland_leadership_events.po_handoff_2020'],
      [2020, 6, {
        election_event_done: 1,
        last_pride_year: 2019,
      }, 'poland_civic_marches.pride'],
      [2020, 8, {
        p2050_foundation_2020_done: 0,
        pres_runoff_complete: 1,
        pres_runoff_winner_key: 'left',
        pres_generic_inauguration_done: 1,
        trzaskowski_won: 0,
      }, 'poland_leadership_events.p2050_foundation_2020'],
      [2020, 10, {
        abortion_event_done: 1,
        gowin_return_resolved: 0,
      }, 'poland_gowin_crisis.gowin_returns'],
      [2021, 3, {
        rename_event_done: 1,
        bielan_rebellion_done: 0,
      }, 'poland_porozumienie_war.bielan_rebellion'],
      [2021, 5, {
        recovery_fund_event_done: 1,
        republikanie_event_done: 0,
      }, 'poland_porozumienie_war.republikanie_split'],
      [2021, 5, {
        recovery_fund_event_done: 1,
        republikanie_event_done: 1,
        last_labor_day_year: 2020,
      }, 'poland_civic_marches.labor_day'],
      [2021, 6, {
        opposition_reset_event_done: 1,
        kp_rupture_done: 0,
      }, 'poland_porozumienie_war.kp_rupture'],
      [2021, 6, {
        opposition_reset_event_done: 1,
        kp_rupture_done: 1,
        last_pride_year: 2020,
      }, 'poland_civic_marches.pride'],
      [2021, 11, {
        november_2021_done: 1,
        porozumienie_exit_done: 1,
        porozumienie_active: 1,
        porozumienie_search_done: 0,
      }, 'poland_porozumienie_after.porozumienie_search'],
      [2021, 12, {
        december_2021_done: 1,
        minority_parliament: 1,
        minority_vote_nights: 0,
      }, 'poland_scenario_civic_gaps.border_person_2021'],
      [2022, 5, {
        rates_lists_2022_done: 1,
        porozumienie_exit_done: 1,
        porozumienie_active: 1,
        gowin_stepdown_done: 0,
      }, 'poland_porozumienie_after.gowin_steps_down'],
      [2022, 5, {
        rates_lists_2022_done: 1,
        porozumienie_exit_done: 0,
        last_labor_day_year: 2021,
      }, 'poland_civic_marches.labor_day'],
      [2022, 6, {
        kpo_2022_done: 1,
        last_pride_year: 2021,
      }, 'poland_civic_marches.pride'],
      [2022, 11, {
        november_2022_done: 1,
        minority_parliament: 1,
        minority_vote_nights: 1,
      }, 'poland_minority_sejm.minority_vote_night'],
      [2023, 4, {
        third_way_2023_done: 1,
        porozumienie_exit_done: 1,
        porozumienie_active: 1,
        agrounia_experiment_done: 0,
      }, 'poland_porozumienie_after.agrounia_experiment'],
      [2023, 5, {
        lex_tusk_2023_done: 1,
        last_labor_day_year: 2022,
      }, 'poland_civic_marches.labor_day'],
      [2023, 6, {
        june_2023_done: 1,
        minority_parliament: 1,
        minority_vote_nights: 2,
      }, 'poland_minority_sejm.minority_vote_night'],
      [2023, 6, {
        june_2023_done: 1,
        minority_parliament: 0,
        last_pride_year: 2022,
      }, 'poland_civic_marches.pride'],
      [2023, 7, {
        july_2023_done: 1,
        porozumienie_2023_placed: 0,
      }, 'poland_porozumienie_after.porozumienie_list_2023'],
    ];

    cases.forEach(function(testCase, index) {
      startStandard('historical-event-continuity-' + index);
      const qualities = engine.state.qualities;
      setCampaignDate(
        qualities,
        testCase[0],
        testCase[1],
        monthNames[testCase[1]]
      );
      Object.assign(qualities, testCase[2], {
        caucus_crisis_pending: 0,
        historical_2023_calendar: 1,
        poland_historical_event_phase: 1,
      });
      engine.goToScene('poland_hub');
      assert.strictEqual(
        engine.state.sceneId,
        testCase[3],
        testCase[0] + '-' + testCase[1] +
          ' returned to the table before routing ' + testCase[3]
      );
      if (testCase[3] ===
          'poland_scenario_civic_gaps.border_person_2021') {
        choose('poland_scenario_civic_gaps.border_person_observe');
        choose('poland_events_2021_2023.router');
        assert.strictEqual(
          engine.state.sceneId,
          'poland_minority_sejm.minority_vote_night',
          'The new border file swallowed the existing December vote night'
        );
      }
    });

    startStandard('historical-event-caucus-deferral');
    let qualities = engine.state.qualities;
    setCampaignDate(qualities, 2021, 3, 'March');
    Object.assign(qualities, {
      barons_active: 1,
      barons_in_left: 1,
      barons_escalation_stage: 2,
      barons_demand_answered: 0,
      barons_demand_deadline: qualities.time,
      bielan_rebellion_done: 0,
      caucus_crisis_pending: 1,
      caucus_split_pending: 0,
      poland_historical_event_phase: 1,
      rename_event_done: 1,
    });
    engine.goToScene('poland_hub');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_porozumienie_war.bielan_rebellion',
      'A caucus deadline interrupted the dated March event'
    );
    choose('poland_porozumienie_war.bielan_ignore');
    choose('poland_hub');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_caucus_dynamics.barons_crisis',
      'The deferred caucus deadline did not fire after the dated event'
    );
    choose('poland_caucus_dynamics.barons_punish');

    startStandard('historical-february-budget-continuity');
    qualities = engine.state.qualities;
    setCampaignDate(qualities, 2020, 2, 'February');
    Object.assign(qualities, {
      annual_budget_done_2019: 0,
      budget_2019_done: 1,
      poland_historical_event_phase: 1,
    });
    engine.goToScene('poland_monthly_briefing');
    choose('poland_monthly_briefing.briefing_return');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_budget_2023_2026.budget_open',
      'The February briefing still bypassed the mandatory budget vote'
    );

    startStandard('historical-july-list-continuity');
    qualities = engine.state.qualities;
    setCampaignDate(qualities, 2023, 7, 'July');
    Object.assign(qualities, {
      historical_2023_calendar: 1,
      july_2023_done: 0,
      porozumienie_2023_placed: 0,
    });
    engine.goToScene('poland_events_2021_2023.router');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2021_2023.july_2023'
    );
    choose('poland_events_2021_2023.jul23_material');
    choose('poland_events_2021_2023.router');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_porozumienie_after.porozumienie_list_2023',
      'July jumped to the campaign projection before list registration'
    );
    choose('poland_hub');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_election.campaign_projection'
    );
    assert.strictEqual(qualities.poland_historical_event_phase, 0);
    choose('poland_hub');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_hub',
      'The completed historical chain reopened the campaign projection'
    );
  }

  function testLeadershipDramaEvents() {
    function prepareHistoricalTuskReturn(qualities) {
      qualities.ko_poll = 22;
      const po = (qualities.rival_group_records || []).find(function(record) {
        return record && record.id === 'po';
      });
      if (po) po.organisation = 45;
    }

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
      qualities.pres_2020_ko_kidawa
        ? 'Małgorzata Kidawa-Błońska'
        : 'Rafał Trzaskowski'
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
      'poland_leadership_events.tusk_return_2021',
      prepareHistoricalTuskReturn
    );
    assert.strictEqual(qualities.ko_outgoing_leader, 'Borys Budka');
    assert.strictEqual(qualities.ko_leader, 'Donald Tusk');
    assert.strictEqual(qualities.ko_right_score, 62);
    assert.strictEqual(qualities.ko_social_liberal_share, 30);
    assert.strictEqual(qualities.ko_classical_liberal_share, 70);

    startStandard('tusk-race-0');
    qualities = engine.state.qualities;
    setCampaignDate(qualities, 2021, 7, 'July');
    Object.assign(qualities, {
      ko_leader: 'Borys Budka',
      ko_poll: 22,
      tusk_return_2021_done: 0,
      left_revolt_event_done: 0,
      kukiz_negotiation_done: 0,
      caucus_crisis_pending: 0,
    });
    prepareHistoricalTuskReturn(qualities);
    engine.goToScene('poland_polling');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_leadership_events.tusk_return_2021',
      'The July merger revolt raced ahead of Tusk\'s return'
    );
    choose('poland_leadership_events.tusk_social_terms');
    assert.strictEqual(qualities.ko_leader, 'Donald Tusk');
    assert.strictEqual(qualities.tusk_return_2021_done, 1);

    startStandard('july-kukiz-chain');
    qualities = engine.state.qualities;
    setCampaignDate(qualities, 2021, 7, 'July');
    Object.assign(qualities, {
      tusk_return_2021_done: 1,
      left_revolt_event_done: 1,
      kukiz_negotiation_done: 0,
      caucus_crisis_pending: 0,
    });
    engine.goToScene('poland_hub');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_porozumienie_war.kukiz_negotiation'
    );

    startStandard('tusk-race-save-recovery');
    qualities = engine.state.qualities;
    setCampaignDate(qualities, 2021, 8, 'August');
    Object.assign(qualities, {
      ko_leader: 'Borys Budka',
      ko_org_resources: 10,
      tusk_return_2021_done: 0,
    });
    engine.goToScene('poland_hub');
    assert.strictEqual(qualities.ko_leader, 'Donald Tusk');
    assert.strictEqual(qualities.tusk_return_2021_done, 1);
    assert.strictEqual(qualities.ko_org_resources, 13);
    engine.goToScene('poland_hub');
    assert.strictEqual(qualities.ko_org_resources, 13);

    qualities = openLeadershipScene(
      'leadership-gowin',
      'poland_events_2021_2023.august_2021',
      function(qualities) {
        qualities.porozumienie_exit_done = 1;
      }
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

    qualities = openLeadershipScene(
      'leadership-sovereign-merger',
      'poland_events_2023_2024.sovereign_merger_2024'
    );
    assert.strictEqual(qualities.sovereign_merger_2024_done, 1);
    assert(qualities.sovereign_poland_status.includes('Absorbed into PiS'));

    qualities = openLeadershipScene(
      'leadership-third-way-ends',
      'poland_events_2025.third_way_ends',
      function(qualities) {
        qualities.third_way_cohesion = 25;
        qualities.p2050_coalition_dissent = 45;
        qualities.psl_coalition_dissent = 40;
      }
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
    engine.state.qualities.ko_leader = 'Donald Tusk';
    assert.strictEqual(currentChoices().length, 3);
    engine.state.qualities.ko_cohesion = 70;
    engine.state.qualities.ko_poll = 26;
    choose('poland_events_2025.ko_consolidation_back');
    choose('poland_events_2025.ko_consolidation_result');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.ko_consolidation_result'
    );
    checkNumbers();
    qualities = engine.state.qualities;
    assert.strictEqual(qualities.ko_merger_result, 'One registered KO party');
    assert.strictEqual(qualities.ko_consolidated, 1);
    assert.strictEqual(qualities.ko_leader, 'Donald Tusk');
    assert.strictEqual(qualities.ko_leader_changed, 0);
    assert(qualities.ko_consolidation_outgoing_leaders.includes('Nowacka'));

    // A convention held by a party nobody is happy with replaces its leader
    // instead of confirming him.
    startStandard('leadership-ko-succession');
    engine.goToScene('poland_events_2025.ko_consolidation_2025');
    engine.state.qualities.ko_leader = 'Donald Tusk';
    qualities = engine.state.qualities;
    qualities.ko_cohesion = 42;
    qualities.ko_poll = 18;
    qualities.ko_social_liberal_share = 30;
    qualities.ko_classical_liberal_share = 70;
    choose('poland_events_2025.ko_consolidation_abstain');
    choose('poland_events_2025.ko_consolidation_result');
    assert.strictEqual(
      qualities.ko_merger_result,
      'Convention adjourned without a decision'
    );
    assert.strictEqual(qualities.ko_convention_failed, 1);
    assert.strictEqual(qualities.ko_leader_changed, 1);
    assert.notStrictEqual(qualities.ko_leader, 'Donald Tusk');
    assert(qualities.ko_collapse_shock >= 22);

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
      'poland_events_2026.pis_rupture_2026',
      function(qualities) {
        qualities.pis_seats = 180;
      }
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
    choose('poland_events_2026.pis_named_loyalties_2026');
    assert(
      qualities.rozwoj_definitive_departures > 0,
      'PiS rupture first batch did not resolve in ' + engine.state.sceneId
    );
  }

  function testPersistentRivalOrganisations() {
    const commonFields = [
      'id', 'bloc', 'kind', 'name', 'short_name', 'long_name',
      'leader', 'broker', 'parent',
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
    assert.strictEqual(qualities.rival_group_schema_version, 4);
    assert.strictEqual(qualities.rival_group_records.length, 31);
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
      'po', 'nowoczesna', 'ipl', 'greens', 'ko_party', 'ko_splinter',
      'tak_rozwoj_party', 'p0_party', 'prawica_committee'
    ].forEach(function(id) {
      assert(group(qualities, id), 'Missing persistent group ' + id);
    });

    const pisBeforePorozumienie = qualities.pis_seats;
    const otherBeforePorozumienie = qualities.other_seats;
    const supportBeforePorozumienie = qualities.government_support_seats;
    qualities.porozumienie_rebel_mps = 5;
    qualities.porozumienie_mediator_mps = 0;
    qualities.gowin_standing = 67;
    qualities.kukiz_alignment = 'pis_current';
    engine.goToScene('poland_minority_sejm.lex_tvn_crisis');
    choose('poland_minority_sejm.lex_tvn_watch');
    choose('poland_minority_sejm.gowin_dismissed');
    assert.strictEqual(qualities.porozumienie_seats, 6);
    assert.strictEqual(qualities.pis_seats, pisBeforePorozumienie - 6);
    assert.strictEqual(qualities.other_seats, otherBeforePorozumienie);
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
      otherSeatsBeforeRefusal,
      'Named Suwerenna MPs were also counted under Others'
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
    engine.state.qualities.ko_leader = 'Donald Tusk';
    qualities.ko_cohesion = 75;
    qualities.ko_poll = 26;
    choose('poland_events_2025.ko_consolidation_abstain');
    choose('poland_events_2025.ko_consolidation_result');
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

    // KO's collapse is one shared scene reachable whenever the pressure
    // meter trips, not a convention-only outcome.
    startStandard('phase7-ko-splinter');
    qualities = engine.state.qualities;
    const koBeforeSplinter = qualities.ko_seats;
    qualities.ko_social_liberal_share = 70;
    qualities.ko_classical_liberal_share = 30;
    qualities.ko_collapse_pressure = 80;
    engine.goToScene('poland_ko_collapse.ko_collapse');
    assert.strictEqual(qualities.ko_break_wing, 'Classical-liberal');
    assert(qualities.ko_break_size > 0);
    choose('poland_ko_collapse.ko_collapse_finish');
    choose('poland_ko_collapse.ko_collapse_result');
    assert.strictEqual(qualities.ko_collapsed, 1);
    assert.strictEqual(qualities.ko_splinter_active, 1);
    assert(qualities.ko_splinter_seats > 0);
    assert.strictEqual(
      qualities.ko_seats + qualities.ko_splinter_seats,
      koBeforeSplinter
    );
    assert.strictEqual(group(qualities, 'ko_splinter').active, 1);

    // The departing progressives can be sheltered on the Left list, and the
    // settlement that follows moves those mandates once and only once.
    startStandard('phase7-ko-collapse-settlement');
    qualities = engine.state.qualities;
    const leftBeforeShelter = qualities.left_seats;
    qualities.ko_social_liberal_share = 30;
    qualities.ko_classical_liberal_share = 70;
    qualities.ko_collapse_pressure = 80;
    engine.goToScene('poland_ko_collapse.ko_collapse');
    assert.strictEqual(qualities.ko_break_wing, 'Progressive');
    choose('poland_ko_collapse.ko_collapse_shelter');
    choose('poland_ko_collapse.ko_collapse_result');
    assert(qualities.ko_collapse_defectors > 0);
    assert.strictEqual(
      qualities.left_seats,
      leftBeforeShelter + qualities.ko_collapse_defectors
    );
    const shelteredSplinterSeats = qualities.ko_splinter_seats;
    const leftBeforeSettlement = qualities.left_seats;
    qualities.left_poll = 14;
    engine.goToScene('poland_ko_collapse.ko_splinter_settlement');
    choose('poland_ko_collapse.ko_splinter_list');
    assert.strictEqual(qualities.ko_splinter_settled, 1);
    assert.strictEqual(qualities.ko_splinter_active, 0);
    assert.strictEqual(qualities.ko_splinter_seats, 0);
    assert.strictEqual(
      qualities.left_seats,
      leftBeforeSettlement + shelteredSplinterSeats
    );

    startStandard('phase7-ko-individuals');
    qualities = engine.state.qualities;
    const koBeforeIndividuals = qualities.ko_seats;
    const leftBeforeIndividuals = qualities.left_seats;
    const progressivesBeforeIndividuals =
      qualities.left_progressives_seats;
    engine.goToScene('poland_events_2025.ko_consolidation_2025');
    engine.state.qualities.ko_leader = 'Donald Tusk';
    qualities.ko_cohesion = 50;
    choose('poland_events_2025.ko_consolidation_open_door');
    choose('poland_events_2025.ko_consolidation_result');
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
    qualities.left_in_government = 0;
    qualities.prime_minister = 'Mariusz Błaszczak';
    qualities.rozwoj_split_blocked = 0;
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
    qualities.government_party = 'pis';
    qualities.government_has_confidence = 1;
    qualities.caretaker_government = 0;
    qualities.government_support_seats = qualities.pis_seats;
    qualities.coalition_seats = qualities.pis_seats;
    [
      'poland_events.covid',
      'poland_gowin_crisis.postal_crisis',
      'poland_events.shield',
      'poland_events.abortion',
      'poland_events.strike',
    ].forEach(function(sceneId) {
      engine.goToScene(sceneId);
    });
    qualities.porozumienie_rebel_mps = 5;
    qualities.porozumienie_mediator_mps = 0;
    qualities.gowin_standing = 67;
    qualities.kukiz_alignment = 'pis_current';
    engine.goToScene('poland_minority_sejm.lex_tvn_crisis');
    choose('poland_minority_sejm.lex_tvn_watch');
    choose('poland_minority_sejm.gowin_dismissed');
    choose('poland_minority_sejm.august_11_sejm');
    choose('poland_minority_sejm.aug11_bank_arithmetic');
    choose('poland_minority_sejm.minority_parliament_opens');
    assert.strictEqual(
      qualities.coalition_status,
      'PiS minority government after the Porozumienie exit'
    );
    assert.strictEqual(qualities.government_support_seats, 229);
    qualities.prime_minister = 'Mariusz Błaszczak';
    qualities.rozwoj_split_blocked = 0;
    engine.goToScene('poland_events_2026.rozwoj_association_2026');
    assert(
      qualities.rozwoj_departure_pressure >= 49,
      'Earlier governing crises did not reach the later PiS rupture: ' +
        qualities.rozwoj_departure_pressure
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
    qualities.prime_minister = 'Mariusz Błaszczak';
    qualities.left_in_government = 0;
    qualities.rozwoj_split_blocked = 0;
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
    assert(qualities.razem_ideology.includes('State-led development'));
    assert.notStrictEqual(qualities.razem_co_leader, 'Vacant');
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
    assert.strictEqual(qualities.akcja_socjalistyczna_party_formed, 1);
    assert.strictEqual(qualities.tak_rozwoj_party_name, 'Akcja Socjalistyczna');
    assert.strictEqual(qualities.tak_rozwoj_leader, 'Adrian Zandberg');
    assert(qualities.tak_rozwoj_seats > 1);
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
    qualities.rozwoj_split_blocked = 0;
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
    assert.strictEqual(qualities.aug21_vonc_initiator, 'KO parliamentary club');
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
    assert.strictEqual(qualities.labor_minister, qualities.ministry_labor_nominee);
    assert.strictEqual(qualities.health_minister, qualities.ministry_health_nominee);
    assert.strictEqual(qualities.digital_minister, qualities.ministry_digital_nominee);
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
      cabinetDissentBeforeInspection +
        (qualities.last_card_objection ? 4 : 3)
    );

    engine.goToScene('poland_events_2021_2023.budget_2021');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_budget_2023_2026.budget_open'
    );
    assert.strictEqual(qualities.budget_game.role, 'government');
    assert(globalThis.polandBudgetModel.submit(qualities).ok);
    assert.strictEqual(qualities.annual_budget_left_cabinet_authority, 1);

    engine.goToScene('poland_events_2021_2023.december_2022');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_budget_2023_2026.budget_open'
    );
    assert.strictEqual(qualities.budget_game.year, 2022);
    assert.strictEqual(qualities.budget_game.role, 'government');

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
      'poland_scenario_civic_gaps.election_parallel_realities'
    );
    choose('poland_scenario_civic_gaps.parallel_results_protocol');
    choose('poland_events_2026.snap_result_2026');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2026.snap_result_2026_display'
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
    assert.strictEqual(
      engine.state.sceneId,
      'poland_scenario_epilogue.legal'
    );
    choose('poland_scenario_epilogue.party');
    choose('poland_scenario_epilogue.institutions');
    choose('poland_scenario_epilogue.media');
    choose('poland_ending.final_assessment');
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
    const queueProse = contentText(
      game.scenes['poland_event_queue.events_choice'].content
    );
    assert(
      !queueProse.includes('morning meeting is held') &&
        !queueProse.includes('holds the Palace') &&
        !queueProse.includes('Our standing is'),
      'The dated-event queue reintroduced a raw cabinet-status preamble'
    );
    const taggedEvents = Object.keys(game.tagLookup.poland_event || {});
    const repeatableDatedEvents = {
      'poland_events_2026.snap_campaign_result_due_2026': 2,
      'poland_government_burden.entry': 8,
      'poland_government_burden.review': 8,
      // This institutional repair event must be available again if a later
      // election or reshuffle creates a different incompatibility.
      'poland_office_authority.resolve': 8,
      // The two annual street files run once a year from 2020 to 2026; their
      // own last_*_year guard is what stops a second visit inside one year.
      'poland_civic_marches.labor_day': 7,
      'poland_civic_marches.pride': 7,
      'poland_wiosna_path.spring_doctrine': 3,
      'poland_ziobro_whereabouts.world_tour': 2,
      // Each audited shock hub resolves at most one independent persisted
      // shock per visit; recurrence lets multiple causally compatible shocks
      // coexist without adding another queue/router.
      // One dispatch per local file: the Warsaw succession campaign and its
      // result, Sutryk, Kraków, the rural buses and Warsaw night sales. Raise
      // this when a seventh local file is added.
      'poland_local_affairs.router': 6,
      'poland_scenario_shocks.security_shock': 5,
      'poland_scenario_shocks.domestic_shock': 5,
      'poland_scenario_shocks.constitutional_shock': 3,
    };
    const unlimitedDatedEvents = new Set([
      // Every enacted budget opens its own implementation ledger, so this card
      // recurs once per enactment and is gated by budget_execution_pending.
      'poland_budget_2023_2026.execution_event',
      'poland_events_2026.snap_election_2026',
      'poland_pressure_events.admin_collapse',
      'poland_pressure_events.climate_energy_failure',
      'poland_pressure_events.coalition_showdown',
      'poland_pressure_events.health_strike',
      'poland_pressure_events.household_protest',
      'poland_pressure_events.justice_case_collapse',
      'poland_pressure_events.kpo_audit',
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

    // A queued calendar file owns the screen until it is resolved. A faction
    // deadline remains pending and fires immediately after the queue clears.
    startStandard('dated-queue-caucus-deferral');
    isolateDatedEventFixture([
      'poland_events_2023_2024.december_braun',
    ]);
    let qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2023,
      month: 12,
      month_name: 'December',
      date_label: 'December 2023',
      continuous_campaign: 1,
      barons_active: 1,
      barons_in_left: 1,
      barons_escalation_stage: 2,
      barons_demand_answered: 0,
      barons_demand_deadline: qualities.time,
      caucus_crisis_pending: 1,
      caucus_split_pending: 0,
    });
    engine.goToScene('poland_polling');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_event_queue.events_choice',
      'A caucus deadline interrupted the modern dated-event queue'
    );
    engine.goToScene('poland_hub');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_event_queue.events_choice',
      'The leadership hand interrupted an active dated-event queue'
    );
    choose('poland_events_2023_2024.december_braun');
    choose('poland_events_2023_2024.braun_rules');
    choose('poland_event_queue');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_caucus_dynamics.barons_crisis',
      'The deferred caucus deadline did not fire after the queue cleared'
    );
    choose('poland_caucus_dynamics.barons_punish');

    startStandard('campus-health-partners-gated');
    isolateDatedEventFixture([
      'poland_events_2025.campus_health_partners_2025',
    ]);
    qualities = engine.state.qualities;
    qualities.pres_2025_ko_candidate = 'Radosław Sikorski';
    openDatedEventQueue(2025, 9, true);
    assert.strictEqual(
      engine.state.sceneId,
      'poland_hub',
      'The Campus health-partner event ignored KO\'s candidate'
    );

    startStandard('campus-health-partners-silence');
    isolateDatedEventFixture([
      'poland_events_2025.campus_health_partners_2025',
    ]);
    qualities = engine.state.qualities;
    qualities.pres_2025_ko_candidate = 'Rafał Trzaskowski';
    openDatedEventQueue(2025, 9);
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2025.campus_health_partners_2025']
    );
    choose('poland_events_2025.campus_health_partners_2025');
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      [
        'poland_events_2025.campus_health_condemn',
        'poland_events_2025.campus_health_firewall',
        'poland_events_2025.campus_health_stage',
        'poland_events_2025.campus_health_silence',
      ]
    );
    const silentRazemBefore = qualities.razem_dissent;
    const silentLaborBefore = qualities.labor_dissent;
    const silentPublicSectorBefore = qualities.public_sector_support;
    choose('poland_events_2025.campus_health_silence');
    assert(qualities.razem_dissent > silentRazemBefore);
    assert(qualities.labor_dissent > silentLaborBefore);
    assert(qualities.public_sector_support < silentPublicSectorBefore);

    startStandard('campus-health-partners-condemnation');
    qualities = engine.state.qualities;
    qualities.pres_2025_ko_candidate = 'Rafał Trzaskowski';
    const condemnRazemBefore = qualities.razem_dissent;
    const condemnLaborBefore = qualities.labor_dissent;
    const condemnBaronsBefore = qualities.barons_dissent;
    const condemnKoBefore = qualities.ko_relation;
    engine.goToScene('poland_events_2025.campus_health_partners_2025');
    choose('poland_events_2025.campus_health_condemn');
    assert(qualities.razem_dissent < condemnRazemBefore);
    assert(qualities.labor_dissent < condemnLaborBefore);
    assert(qualities.barons_dissent > condemnBaronsBefore);
    assert(qualities.ko_relation < condemnKoBefore);

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
    qualities = openDatedEventQueue(2024, 4);
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
    playOppositionBudgetStages();
    continueDatedEventAfterword('poland_hub');
    assert.strictEqual(engine.state.sceneId, 'poland_hub');
    assert.strictEqual(qualities.poland_event_phase, 0);

    // Resolving one file can unlock a new, lower-priority file in the same
    // month. The queue must recompute rather than relying on its first draw.
    startStandard('dated-queue-same-month-unlock');
    isolateDatedEventFixture([
      'poland_events_2025.pres25_runoff_campaign',
      'poland_events_2025.post_presidential_live_contract',
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
      ['poland_events_2025.pres25_runoff_campaign']
    );
    choose('poland_events_2025.pres25_runoff_campaign');
    choose('poland_events_2025.pres25_push_protect');
    choose('poland_events_2025.presidential_runoff_2025');
    continueDatedEventAfterword('poland_event_queue.events_choice');
    assert.deepStrictEqual(
      currentChoices().map(function(choice) {
        return choice.id;
      }),
      ['poland_events_2025.post_presidential_live_contract']
    );
    choose('poland_events_2025.post_presidential_live_contract');
    choose('poland_events_2025.post_presidential_continue_vote');
    assert.strictEqual(
      engine.state.sceneId,
      'poland_events_2025.confidence_after_presidential'
    );
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
    playOppositionBudgetStages();
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

    startStandard('independence-civic-march-becomes-self-funding');
    let qualities = engine.state.qualities;
    qualities.resources = 3;
    [
      [
        'poland_events_2021_2023.independence_2019',
        'poland_events_2021_2023.ind19_civic',
      ],
      [
        'poland_events_2021_2023.independence_2020',
        'poland_events_2021_2023.ind20_civic',
      ],
      [
        'poland_events_2021_2023.nov21_independence',
        'poland_events_2021_2023.nov21_civic',
      ],
    ].forEach(function(route) {
      engine.goToScene(route[0]);
      choose(route[1]);
    });
    assert.strictEqual(qualities.resources, 0);
    assert.strictEqual(qualities.civic_independence_investment, 3);
    assert.strictEqual(qualities.civic_independence_years, 3);
    engine.goToScene('poland_events_2021_2023.nov22_independence');
    const selfFundingChoice = currentChoices().find(function(choice) {
      return choice.id === 'poland_events_2021_2023.nov22_civic';
    });
    assert(selfFundingChoice && selfFundingChoice.canChoose);
    choose('poland_events_2021_2023.nov22_civic');
    assert.strictEqual(qualities.resources, 0);
    assert.strictEqual(qualities.civic_independence_investment, 3);
    assert.strictEqual(qualities.civic_independence_years, 4);

    startStandard('independence-day-reclaimed');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      resources: 0,
      civic_independence_investment: 3,
      civic_independence_years: 5,
    });
    engine.goToScene('poland_events_2026.independence_2026');
    assert(currentChoices().some(function(choice) {
      return choice.id === 'poland_events_2026.ind26_reclaimed' &&
        choice.canChoose;
    }));
    assert(!currentChoices().some(function(choice) {
      return choice.id === 'poland_events_2026.ind26_civic';
    }));
    choose('poland_events_2026.ind26_reclaimed');
    assert.strictEqual(qualities.resources, 0);
    assert.strictEqual(qualities.independence_day_reclaimed, 1);
    assert.strictEqual(qualities.civic_independence_years, 6);
    assert.strictEqual(
      qualities.news_headline,
      "Poland's largest Independence Day march is now the democratic civic procession"
    );

    [
      {
        seed: 'independence-main-march-pluralized',
        counter: 'independence_join_years',
        years: 4,
        payoff: 'poland_events_2026.ind26_join_pluralized',
        ordinary: 'poland_events_2026.ind26_join',
        flag: 'independence_main_march_pluralized',
      },
      {
        seed: 'independence-monitoring-becomes-institution',
        counter: 'independence_monitor_years',
        years: 4,
        payoff: 'poland_events_2026.ind26_monitor_institution',
        ordinary: 'poland_events_2026.ind26_rules',
        flag: 'independence_monitor_institution',
      },
      {
        seed: 'independence-counter-coalition-matures',
        counter: 'independence_counter_years',
        years: 3,
        payoff: 'poland_events_2026.ind26_counter_coalition',
        ordinary: 'poland_events_2026.ind26_divide',
        flag: 'independence_counter_coalition',
      },
    ].forEach(function(route) {
      startStandard(route.seed);
      qualities = engine.state.qualities;
      qualities[route.counter] = route.years;
      engine.goToScene('poland_events_2026.independence_2026');
      assert(currentChoices().some(function(choice) {
        return choice.id === route.payoff && choice.canChoose;
      }));
      assert(!currentChoices().some(function(choice) {
        return choice.id === route.ordinary;
      }));
      choose(route.payoff);
      assert.strictEqual(qualities[route.flag], 1);
      assert.strictEqual(qualities[route.counter], route.years + 1);
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
    qualities = engine.state.qualities;
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
    choose('poland_hub');
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
    choose('poland_events_2021_2023.nov22_return');
    assert.strictEqual(engine.state.sceneId, 'poland_events_2021_2023.november_2022_hub');

    delete qualities.independence_join_years;
    qualities.civic_independence_years = 4;
    delete qualities.civic_independence_investment;
    delete qualities.independence_day_reclaimed;
    delete qualities.independence_main_march_pluralized;
    delete qualities.independence_monitor_institution;
    delete qualities.independence_counter_coalition;
    delete qualities.independence_2020_riot_done;
    delete qualities.independence_2020_riot_response;
    engine.goToScene('poland_normalize');
    assert.strictEqual(qualities.independence_join_years, 0);
    assert.strictEqual(qualities.civic_independence_investment, 3);
    assert.strictEqual(qualities.independence_day_reclaimed, 0);
    assert.strictEqual(qualities.independence_main_march_pluralized, 0);
    assert.strictEqual(qualities.independence_monitor_institution, 0);
    assert.strictEqual(qualities.independence_counter_coalition, 0);
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
    choose('poland_events_2023_2024.list_terms');
    choose('poland_events_2023_2024.list_terms_equal');
    choose('poland_events_2023_2024.list_resolution');
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
    choose('poland_events_2023_2024.list_terms');
    choose('poland_events_2023_2024.list_terms_equal');
    choose('poland_events_2023_2024.list_resolution');
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
    choose('poland_events_2023_2024.list_terms');
    choose('poland_events_2023_2024.list_terms_equal');
    choose('poland_events_2023_2024.list_resolution');
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
    choose('poland_events_2023_2024.list_terms');
    choose('poland_events_2023_2024.list_terms_equal');
    choose('poland_events_2023_2024.list_resolution');
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
    choose('poland_events_2023_2024.list_terms');
    choose('poland_events_2023_2024.list_terms_command');
    choose('poland_events_2023_2024.list_resolution');
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
    choose('poland_events_2023_2024.list_terms');
    choose('poland_events_2023_2024.list_terms_equal');
    choose('poland_events_2023_2024.list_resolution');
    assert.strictEqual(qualities.sejm_list_outcome, 'left_5');
    assert.strictEqual(qualities.sejm_list_threshold, 5);
    assert(qualities.sejm_list_result.includes('rejected'));

    startStandard('october-mobilisation-relations-gates');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2023,
      month: 10,
      ko_relation: 44,
      pis_relation: 60,
      sejm_list_outcome: 'left_5',
      pis_seats: 194,
      ko_seats: 157,
      p2050_seats: 33,
      psl_seats: 32,
      left_seats: 26,
      konf_seats: 18,
    });
    engine.goToScene(
      'poland_events_2023_2024.october_mobilisations_2023'
    );
    let mobilisationChoices = currentChoices();
    assert.strictEqual(
      mobilisationChoices.find(function(choice) {
        return choice.id ===
          'poland_events_2023_2024.march23_million_hearts';
      }).canChoose,
      false,
      'KO admitted a delegation below the relationship gate'
    );
    assert(
      !mobilisationChoices.some(function(choice) {
        return choice.id ===
          'poland_events_2023_2024.march23_pis_convention';
      }),
      'The PiS convention appeared without a PiS host list'
    );
    qualities.ko_relation = 45;
    engine.goToScene(
      'poland_events_2023_2024.october_mobilisations_2023'
    );
    assert(currentChoices().find(function(choice) {
      return choice.id ===
        'poland_events_2023_2024.march23_million_hearts';
    }).canChoose);
    choose('poland_events_2023_2024.march23_million_hearts');
    assert.strictEqual(
      qualities.election_march_alignment,
      'Million Hearts March'
    );
    assert.strictEqual(qualities.election_2023_left_mobilisation_bonus, 0.45);
    qualities.resources = 0;
    engine.goToScene('poland_government_formation.first_sitting');
    assert(currentChoices().find(function(choice) {
      return choice.id ===
        'poland_government_formation.first_democratic_protocol';
    }).canChoose, 'The Warsaw operation did not lower the formation cost');

    startStandard('october-mobilisation-pis-list');
    qualities = engine.state.qualities;
    Object.assign(qualities, {
      year: 2023,
      month: 10,
      ko_relation: 60,
      pis_relation: 44,
      sejm_list_outcome: 'pis_5',
    });
    engine.goToScene(
      'poland_events_2023_2024.october_mobilisations_2023'
    );
    mobilisationChoices = currentChoices();
    assert.strictEqual(
      mobilisationChoices.find(function(choice) {
        return choice.id ===
          'poland_events_2023_2024.march23_pis_convention';
      }).canChoose,
      false,
      'PiS admitted a delegation below the relationship gate'
    );
    qualities.pis_relation = 45;
    engine.goToScene(
      'poland_events_2023_2024.october_mobilisations_2023'
    );
    choose('poland_events_2023_2024.march23_pis_convention');
    assert.strictEqual(qualities.election_march_alignment, 'PiS convention');
    assert.strictEqual(qualities.election_2023_left_mobilisation_bonus, 0.15);
    qualities.left_seats = 20;
    engine.goToScene('poland_government_formation.left_courting');
    choose('poland_government_formation.left_issue_pact');
    assert.strictEqual(
      qualities.first_left_yes,
      14,
      'The Katowice channel did not affect Morawiecki courtship'
    );

    const certifyMobilisationVote = function(bonus) {
      startStandard('october-mobilisation-election-bonus');
      const election = engine.state.qualities;
      Object.assign(election, {
        election_2023_certified: 0,
        election_2023_left_mobilisation_bonus: bonus,
        sejm_list_outcome: 'left_5',
      });
      engine.goToScene('poland_government_formation.campaign_entry');
      return election.election_2023_left_vote;
    };
    const baselineMobilisationVote = certifyMobilisationVote(0);
    const marchMobilisationVote = certifyMobilisationVote(0.45);
    assert(
      marchMobilisationVote > baselineMobilisationVote,
      'March attendance did not reach the certified election result'
    );

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
      if (outcome.id === 'democratic_8') {
        const thirdWayComponents =
          Number(qualities.election_2023_psl_vote || 0) +
          Number(qualities.election_2023_p2050_vote || 0);
        assert(thirdWayComponents > 0,
          'Broad-list Third Way components lost their certified vote');
        assert(
          Math.abs(
            Number(qualities.election_2023_third_way_vote || 0) -
              thirdWayComponents
          ) < 0.011,
          'Broad-list Third Way displayed a nonexistent standalone vote'
        );
      }
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
      'poland_events.covid',
      'The faction split interrupted the dated March 2020 event'
    );
    choose('poland_events.covid_legal');
    choose('poland_hub');
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
    qualities.third_way_split = 1;
    qualities.p2050_formal_split_chain = 1;
    qualities.p2050_joined_left = 0;
    qualities.p2050_leader = 'Katarzyna Pełczyńska-Nałęcz';
    qualities.left_poll = 11.8;
    qualities.p2050_coalition_dissent = 30;
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
    if (process.env.DSS_HARD_LEFT_SMOKE === '1') {
      testZeroResourceCardFallbacks();
      testHardLeftTurnCards();
      return {
        ending: 'Socialist-turn card fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_PATH_CARD_SMOKE === '1') {
      testZeroResourceCardFallbacks();
      testIdeologicalPathCards();
      return {
        ending: 'Ideological path-card fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_CONSTITUENT_CARD_SMOKE === '1') {
      testZeroResourceCardFallbacks();
      testConstituentProgrammeCards();
      return {
        ending: 'Constituent programme-card fixtures passed',
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
      testHistoricalDatedEventContinuity();
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
    if (process.env.DSS_PRESSURE_SMOKE === '1') {
      testPressureAndRadicalisation();
      return {
        ending: 'Pressure and radicalisation fixtures passed',
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
      testGowinEventExcludesMiller();
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
    if (process.env.DSS_LEGISLATIVE_SMOKE === '1') {
      testLegislativeVoteRouter();
      return {
        ending: 'Legislative vote-router fixtures passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
        cardsPlayed: 0,
      };
    }
    if (process.env.DSS_SENATE_SMOKE === '1') {
      testLegislativeVoteRouter();
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
      testPersistentParliamentSeatChart();
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
    if (process.env.DSS_SIKORSKI_SMOKE === '1') {
      testBudgetOppositionAndConstitutionalRoutes();
      return {
        ending: 'Sikorski nightmare fixture passed',
        score: 0,
        unity: engine.state.qualities.party_unity,
        polling: engine.state.qualities.left_poll,
        budget2019: 0,
        budget2020: 0,
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
    testLegislativeVoteRouter();
    testSenateDocketCard();
    testSenateBudgetStages();
    testPresidentialElectionCorpora();
    testPresidential2025PollingConversion();
    testPresidentialDebateMinigame();
    testTrzaskowskiWarOfPowers();
    testTrzaskowskiBlockedPresidency();
    testThirdWayFormationSplit();
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
    testHardLeftTurnCards();
    testIdeologicalPathCards();
    testNegotiationAndCohabitation();
    testBudgetOppositionAndConstitutionalRoutes();
    testLateAuthorityBoundaries();
    testTimelineOfficeContinuity();
    testCommittedSeatsAndOfficeCompatibility();
    testHistoricalDatedEventContinuity();
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
    testGowinEventExcludesMiller();
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

      const expectedSceneId = expectedEvents[turn];
      let routedSceneId = engine.state.sceneId;
      let legacyDeskBypassed = false;
      if (routedSceneId === 'poland_legacy_event_desk.events_choice') {
        // The dedicated queue fixtures cover legacy congestion. This broad
        // chronology smoke follows its one expected monthly spine.
        engine.state.qualities.poland_legacy_event_phase = 0;
        engine.goToScene(expectedSceneId);
        routedSceneId = engine.state.sceneId;
        legacyDeskBypassed = true;
      }
      const historicalBridgeChoices = {
        'poland_scenario_civic_gaps.border_barrier_2022':
          'poland_scenario_civic_gaps.barrier_audit',
        'poland_scenario_civic_gaps.pushback_judgment_2022':
          'poland_scenario_civic_gaps.pushback_litigation',
        'poland_scenario_civic_gaps.covid_aftermath_2023':
          'poland_scenario_civic_gaps.covid_after_close',
      };
      if (historicalBridgeChoices[routedSceneId]) {
        choose(historicalBridgeChoices[routedSceneId]);
        choose('poland_events_2021_2023.router');
        routedSceneId = engine.state.sceneId;
      }
      if (
        routedSceneId === 'poland_monthly_briefing' &&
        expectedSceneId === 'poland_budget_2023_2026.budget_open'
      ) {
        eventsSeen.push(expectedSceneId);
        resolveEvent(routedSceneId);
        continue;
      }
      const sharedBudgetRoute =
        routedSceneId === 'poland_budget_2023_2026.budget_open' &&
        [
          'poland_events.budget_2019',
          'poland_events.budget_2020',
          'poland_events_2021_2023.december_2022',
        ].includes(expectedSceneId);
      const routedInsideExpected =
        routedSceneId.startsWith(expectedSceneId + '_');
      const resolvedSceneId = sharedBudgetRoute || legacyDeskBypassed ||
          routedInsideExpected
        ? expectedSceneId
        : routedSceneId;
      eventsSeen.push(resolvedSceneId);
      resolveEvent(resolvedSceneId);
    }
  } finally {
    console.log = originalLog;
    Math.random = originalRandom;
  }

  const expectedCampaignEvents = expectedEvents.slice();
  if (engine.state.qualities.trzaskowski_won) {
    if (eventsSeen[9] === 'poland_leadership_events.p2050_foundation_2020') {
      eventsSeen[9] = 'poland_trzaskowski.certification';
    }
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
testPickingEnemiesChoices(game);
testCheatMenu(game);
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
