'use strict';

// The Giertych arc: an August 2023 list place, a January 2024 chairmanship, a
// missed rights vote, two beats of a reckoning that produces no verdict, and
// the June 2026 decision about who runs the Ministry of Justice.
//
// What this asserts is the part that cannot be read from the prose: that the
// crisis is decided by state the player actually moved, that the veto is only a
// lever while the cabinet parties are short of 231, and that breaking the
// coalition produces the real minority arithmetic rather than a headline.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sceneParser = require('dendrynexus/lib/parsers/scene');

const projectRoot = path.resolve(__dirname, '..');
const scenes = new Map();

function load(relativePath) {
  const sourcePath = path.join(projectRoot, 'source/scenes', relativePath);
  sceneParser.parseFromContent(
    sourcePath,
    fs.readFileSync(sourcePath, 'utf8'),
    function(error, parsed) {
      if (error) throw error;
      (parsed.sections || []).forEach(function(section) {
        scenes.set(section.id, section);
      });
    }
  );
}

[
  'poland_events/poland_events_2023_08.scene.dry',
  'poland_events/poland_events_2024_01.scene.dry',
  'poland_events/poland_events_2024_07.scene.dry',
  'poland_events/poland_events_2025_02.scene.dry',
  'poland_events/poland_events_2026_01.scene.dry',
  'poland_events/poland_events_2026_06.scene.dry',
].forEach(load);

function scene(id) {
  const result = scenes.get(id);
  assert(result, 'Missing scene ' + id);
  return result;
}

function apply(id, Q) {
  (scene(id).onArrival || []).forEach(function(action) {
    action({}, Q);
  });
  return Q;
}

// The October 2023 result the campaign actually produces: PiS 194, KO 157,
// Poland 2050 33, PSL 32, Lewica 26, Konfederacja 18. The four cabinet parties
// hold 248 and the Left is 26 of them.
function coalition2023(overrides) {
  return Object.assign({
    sejm_total: 460,
    pis_seats: 194,
    ko_seats: 157,
    p2050_seats: 33,
    psl_seats: 32,
    left_seats: 26,
    konf_seats: 18,
    coalition_seats: 248,
    mentzen_bosak_split: 0,
    ko_konf_partner_line: 'closed',
    ko_leader: 'Donald Tusk',
    prime_minister: 'Donald Tusk',
    government_party: 'ko',
    ko_relation: 48,
    ko_right_score: 50,
    ko_channel_target: 'Nowacka progressive channel',
    ko_social_liberal_share: 42,
    ko_classical_liberal_share: 58,
    ko_cultural_position: 43,
    ko_coalition_dissent: 10,
    ko_collapse_shock: 0,
    ko_poll_momentum: 0,
    government_coalition_dissent: 20,
    early_election_risk: 20,
    konf_normalisation: 20,
    far_right_agenda: 20,
    resources: 5,
    giertych_standing: 46,
    giertych_line: '',
    giertych_justice_outcome: '',
    giertych_in_government: 0,
    justice_minister: 'Adam Bodnar',
    justice_minister_party: 'KO',
    ministry_psl_in_cabinet: 1,
    ministry_p2050_in_cabinet: 1,
    ministry_ko_in_cabinet: 1,
    ministry_count: 4,
    left_in_government: 1,
    razem_in_government: 1,
    prosecutor_general_separated: 0,
    prosecution_independence: 40,
    government_procedural_restraint: 40,
    reckoning_team_active: 1,
    reckoning_stage: 3,
    reckoning_delivery: 10,
    reckoning_noise: 20,
    reckoning_pm_pressure: 45,
    reckoning_convictions: 0,
    reckoning_case_outcome: 'returned',
    reckoning_case_response: '',
    reckoning_route: '',
    romanowski_case_stage: 2,
    ziobro_whereabouts_stage: 2,
    // Everything below is only touched additively by the arc.
    public_trust: 40,
    institutional_trust: 40,
    judicial_legitimacy: 40,
    judicial_repair_mandate: 20,
    prosecution_command_clarity: 30,
    prosecution_oversight_capacity: 20,
    constitutional_restraint: 40,
    progressive_credibility: 50,
    feminist_trust: 50,
    movement_autonomy: 47,
    razem_cooperation: 40,
    razem_dissent: 35,
    progressives_dissent: 14,
    spring_dissent: 16,
    labor_dissent: 18,
    pps_dissent: 20,
    barons_dissent: 12,
    internal_dissent: 18,
    left_coalition_dissent: 0,
    party_unity: 60,
    coalition_blur: 10,
    left_poll_momentum: 0,
    pis_poll_momentum: 0,
    psl_relation: 45,
    p2050_relation: 45,
    government_delivery: 20,
    government_minority: 0,
    government_support_seats: 248,
    left_minority_posture: '',
    ko_konf_line_opened_by_rupture: 0,
    left_cabinet_committed: 1,
    coalition_broken: 0,
    budget: 1,
    snap_election_requested: 0,
    public_mood_pending_rule_of_law_salience: 0,
    public_mood_pending_rule_of_law_backlash: 0,
    public_mood_pending_lgbt_equality_backlash: 0,
    public_mood_pending_lgbt_equality_salience: 0,
    public_mood_pending_lgbt_equality_left_ownership: 0,
    public_mood_pending_abortion_rights_salience: 0,
    news_headline: '',
  }, overrides || {});
}

function openCrisis(overrides) {
  const Q = coalition2023(overrides);
  apply('poland_events_2026_06.justice_ministry_crisis_2026', Q);
  apply('poland_events_2026_06.justice_crisis_names', Q);
  return Q;
}

// 1. The arithmetic printed to the player is the arithmetic of the actual
//    chamber, not a constant.
{
  const Q = openCrisis();
  assert.strictEqual(Q.justice_crisis_majority, 231);
  assert.strictEqual(Q.justice_crisis_cabinet_seats, 248);
  assert.strictEqual(Q.justice_crisis_left_seats, 26);
  assert.strictEqual(Q.justice_crisis_without_left, 222);
  assert.strictEqual(Q.justice_crisis_gap, 9, 'the cabinet is nine short without the Left');
  assert.strictEqual(Q.justice_crisis_konf_seats, 18);
  assert.strictEqual(Q.justice_crisis_left_pivotal, 1);
  // 222 + 18 = 240 clears 231, so an already-open KO channel to Konfederacja
  // removes the leverage even though the gap is unchanged.
  const open = openCrisis({ko_konf_partner_line: 'talks'});
  assert.strictEqual(open.justice_crisis_gap, 9);
  assert.strictEqual(open.justice_crisis_left_pivotal, 0,
    'an open Konfederacja channel makes the same nine-seat gap closable without us');
}

// 2. A cabinet that does not need the Left at all is reported as such.
{
  const Q = openCrisis({left_seats: 12, coalition_seats: 248});
  assert.strictEqual(Q.justice_crisis_without_left, 236);
  assert.strictEqual(Q.justice_crisis_gap, 0);
  assert.strictEqual(Q.justice_crisis_left_pivotal, 0);
}

// 3. Saving the incumbent costs two resources and a relationship, and is not
//    offered to a party that has neither the channel nor a KO it recognises.
{
  const Q = openCrisis();
  const before = Q.ko_relation;
  apply('poland_events_2026_06.jc_save', Q);
  assert.strictEqual(Q.giertych_justice_outcome, 'incumbent');
  assert.strictEqual(Q.justice_minister, 'Adam Bodnar');
  assert.strictEqual(Q.resources, 3);
  assert.ok(Q.ko_relation < before, 'defending another party\'s minister costs relation');
  assert.ok(Q.giertych_standing < 46);
}

// 4. Żurek is the compromise: the office changes hands and Giertych does not
//    get it.
{
  const Q = openCrisis();
  apply('poland_events_2026_06.jc_zurek', Q);
  assert.strictEqual(Q.giertych_justice_outcome, 'zurek');
  assert.strictEqual(Q.justice_minister, 'Waldemar Żurek');
  assert.strictEqual(Q.justice_minister_party, 'KO');
  assert.ok(Q.reckoning_pm_pressure < 45, 'the Prime Minister gets his change');
}

// 5. The public veto is a lever only while the Left is pivotal and KO's own
//    centre of gravity has not moved past it.
{
  const held = openCrisis();
  apply('poland_events_2026_06.jc_veto', held);
  assert.notStrictEqual(held.giertych_justice_outcome, 'giertych',
    'a pivotal Left with a centrist KO can hold the line');

  const rightKo = openCrisis({ko_right_score: 62});
  apply('poland_events_2026_06.jc_veto', rightKo);
  assert.strictEqual(rightKo.giertych_justice_outcome, 'giertych',
    'a significantly right-wing KO crosses the line');

  const notPivotal = openCrisis({left_seats: 12});
  apply('poland_events_2026_06.jc_veto', notPivotal);
  assert.strictEqual(notPivotal.giertych_justice_outcome, 'giertych',
    'a veto without the arithmetic behind it is a sentence');

  const strongChairman = openCrisis({giertych_standing: 70});
  apply('poland_events_2026_06.jc_veto', strongChairman);
  assert.strictEqual(strongChairman.giertych_justice_outcome, 'giertych');
}

// 6. Taking no position hands the decision to KO's own balance.
{
  const quiet = openCrisis({reckoning_pm_pressure: 12});
  apply('poland_events_2026_06.jc_abstain', quiet);
  assert.strictEqual(quiet.giertych_justice_outcome, 'incumbent');

  const pressured = openCrisis({reckoning_pm_pressure: 28});
  apply('poland_events_2026_06.jc_abstain', pressured);
  assert.strictEqual(pressured.giertych_justice_outcome, 'zurek');

  const badRelations = openCrisis({ko_relation: 22});
  apply('poland_events_2026_06.jc_abstain', badRelations);
  assert.strictEqual(badRelations.giertych_justice_outcome, 'giertych',
    'bad relations plus a panicking Chancellery produce the appointment');
}

// 7. The appointment shifts KO's actual wing shares, not only a label, because
//    the monthly drift model reads the shares and would erase anything else.
{
  const Q = openCrisis({ko_right_score: 62});
  apply('poland_events_2026_06.jc_veto', Q);
  apply('poland_events_2026_06.giertych_appointment_2026', Q);
  assert.strictEqual(Q.justice_minister, 'Roman Giertych');
  assert.strictEqual(Q.giertych_in_government, 1);
  assert.ok(Q.ko_social_liberal_share < 42, 'KO moves right at the wing level');
  assert.ok(Q.ko_classical_liberal_share > 58);
  assert.ok(Q.ko_right_score > 62);
  assert.ok(Q.ko_cultural_position > 43);
  // Without the 2025 statute the ministry takes the prosecutors with it.
  assert.ok(Q.prosecution_independence < 40);

  const separated = openCrisis({ko_right_score: 62, prosecutor_general_separated: 1});
  apply('poland_events_2026_06.jc_veto', separated);
  apply('poland_events_2026_06.giertych_appointment_2026', separated);
  assert.strictEqual(separated.prosecution_independence, 40,
    'the independent prosecution statute survives the appointment');
}

// 8. Staying and breaking are genuinely different states, and the internal
//    damage of staying falls hardest on the left flank.
{
  const stay = openCrisis({ko_right_score: 62});
  apply('poland_events_2026_06.jc_veto', stay);
  apply('poland_events_2026_06.giertych_appointment_2026', stay);
  const credibilityBeforeStaying = stay.progressive_credibility;
  const momentumBeforeStaying = stay.left_poll_momentum;
  apply('poland_events_2026_06.rupture_stay', stay);
  assert.strictEqual(stay.left_in_government, 1);
  assert.ok(stay.razem_dissent - 35 > stay.barons_dissent - 12,
    'the left flank takes more of it than the old guard');
  assert.ok(credibilityBeforeStaying - stay.progressive_credibility >= 20,
    'staying costs the party its progressive credibility');
  assert.ok(momentumBeforeStaying - stay.left_poll_momentum >= 1.5,
    'and a polling hit larger than anything else in the chapter');

  const brk = openCrisis({ko_right_score: 62});
  apply('poland_events_2026_06.jc_veto', brk);
  apply('poland_events_2026_06.giertych_appointment_2026', brk);
  apply('poland_events_2026_06.rupture_break', brk);
  assert.strictEqual(brk.left_in_government, 0);
  assert.strictEqual(brk.razem_in_government, 0);
  assert.strictEqual(brk.coalition_broken, 1);
  assert.strictEqual(brk.ministry_count, 0);
  assert.strictEqual(brk.coalition_seats, 222, 'the cabinet keeps only its own parties');
  assert.strictEqual(brk.government_minority, 1);
  assert.strictEqual(brk.justice_minister, 'Roman Giertych');
  assert.strictEqual(brk.labor_minister_party, 'KO');
  assert.strictEqual(brk.agriculture_minister_party, 'PSL');
  assert.ok(brk.progressive_credibility > 50, 'leaving repairs what staying destroys');
}

// 9. The three postures after a rupture reach three different institutional
//    futures, and only one of them opens the door to Konfederacja.
{
  function ruptured(overrides) {
    const Q = openCrisis(Object.assign({ko_right_score: 62}, overrides || {}));
    apply('poland_events_2026_06.jc_veto', Q);
    apply('poland_events_2026_06.giertych_appointment_2026', Q);
    apply('poland_events_2026_06.rupture_break', Q);
    apply('poland_events_2026_06.rupture_posture', Q);
    return Q;
  }

  const supply = ruptured();
  apply('poland_events_2026_06.posture_supply', supply);
  assert.strictEqual(supply.government_support_seats, 248);
  assert.strictEqual(supply.government_minority, 0);
  assert.strictEqual(supply.ko_konf_partner_line, 'closed');
  assert.strictEqual(supply.snap_election_requested, 0);

  const snap = ruptured();
  apply('poland_events_2026_06.posture_snap', snap);
  assert.strictEqual(snap.snap_election_requested, 1,
    'refusing supply opens the constitutional snap-election route');
  assert.ok(snap.early_election_risk >= 70);
  assert.strictEqual(snap.ko_konf_partner_line, 'closed');

  const dare = ruptured();
  apply('poland_events_2026_06.posture_dare', dare);
  assert.strictEqual(dare.ko_konf_line_opened_by_rupture, 1);
  assert.strictEqual(dare.ko_konf_partner_line, 'talks',
    '222 + 18 clears 231, so refusing the floor sends the cabinet to Konfederacja');
  assert.strictEqual(dare.snap_election_requested, 0);

  // Where Konfederacja cannot close the gap, the same refusal opens no door.
  const unreachable = ruptured({konf_seats: 4});
  apply('poland_events_2026_06.posture_dare', unreachable);
  assert.strictEqual(unreachable.ko_konf_line_opened_by_rupture, 0);
  assert.strictEqual(unreachable.ko_konf_partner_line, 'closed');
}

// 10. The chain is a chain: what the reckoning was told to do in February 2025
//     decides whether anything survives the courtroom in January 2026, and the
//     courtroom decides how much patience the Prime Minister has in June.
{
  function reckoning(route) {
    const Q = coalition2023({
      reckoning_stage: 1,
      reckoning_delivery: 0,
      reckoning_noise: 8,
      reckoning_pm_pressure: 0,
      reckoning_case_outcome: '',
      nik_independence: 30,
      administrative_reform_pressure: 20,
      justice_fund_salience: 20,
    });
    apply('poland_events_2025_02.reckoning_audit_2025', Q);
    apply('poland_events_2025_02.' + route, Q);
    apply('poland_events_2026_01.reckoning_case_returns_2026', Q);
    return Q;
  }

  const triaged = reckoning('reckoning_triage');
  const accelerated = reckoning('reckoning_accelerate');
  assert.strictEqual(triaged.reckoning_case_outcome, 'narrowed');
  assert.strictEqual(triaged.reckoning_convictions, 1);
  assert.strictEqual(accelerated.reckoning_case_outcome, 'collapsed');
  assert.strictEqual(accelerated.reckoning_convictions, 0);
  assert.ok(
    accelerated.reckoning_pm_pressure > triaged.reckoning_pm_pressure,
    'a collapsed flagship indictment makes the Prime Minister far angrier'
  );
  assert.ok(accelerated.giertych_standing > triaged.giertych_standing);

  // The statute route is the one that changes what is available later rather
  // than only what is written in the aftermath.
  const statute = reckoning('reckoning_separate_pg');
  assert.strictEqual(statute.prosecutor_general_separated, 1);

  // And the January response feeds the June crisis rather than sitting in prose.
  const blamed = reckoning('reckoning_accelerate');
  apply('poland_events_2026_01.reckoning_case_blame', blamed);
  assert.ok(blamed.reckoning_pm_pressure >= 40);
  const reset = reckoning('reckoning_triage');
  apply('poland_events_2026_01.reckoning_case_expectation', reset);
  assert.ok(reset.reckoning_pm_pressure < blamed.reckoning_pm_pressure);
}

// 11. The tease, the chairmanship and the missed vote all move the same
//     standing figure, and none of them resets it.
{
  const Q = coalition2023({giertych_standing: 0, reckoning_team_active: 0});
  apply('poland_events_2023_08.giertych_list_place_2023', Q);
  assert.strictEqual(Q.giertych_standing, 38);
  apply('poland_events_2023_08.giertych_2023_public', Q);
  const afterTease = Q.giertych_standing;
  assert.ok(afterTease < 38, 'stating the pact refusal costs him standing');
  apply('poland_events_2024_01.giertych_reckoning_team_2024', Q);
  assert.strictEqual(Q.reckoning_team_active, 1);
  assert.strictEqual(Q.giertych_standing, afterTease + 8,
    'the chairmanship adds to the August figure instead of overwriting it');
  const beforeAbsence = Q.giertych_standing;
  apply('poland_events_2024_07.giertych_absent_2024', Q);
  assert.strictEqual(Q.giertych_standing, beforeAbsence - 5);
  assert.ok(Q.ko_right_score > 50, 'each beat moves KO right');
  assert.ok(Q.ko_social_liberal_share < 42);
}

// 12. The arc is gated on the people who would actually do it. Nobody but a
//     Tusk- or Sikorski-led KO puts him on a list, gives him the reckoning team
//     or hands him a ministry, and no cabinet containing Poland 2050 without
//     PSL clears the motion.
{
  function viewIf(id) {
    const condition = scene(id).viewIf;
    assert(condition, 'Scene ' + id + ' has no view-if to gate on');
    return function(Q) {
      return Boolean(condition({}, Q));
    };
  }

  const teaseVisible = viewIf('poland_events_2023_08.giertych_list_place_2023');
  const teaseBase = {
    continuous_campaign: 1, year: 2023, month: 8, giertych_teased_2023: 0,
  };
  assert.ok(teaseVisible(Object.assign({}, teaseBase, {ko_leader: 'Donald Tusk'})));
  assert.ok(teaseVisible(Object.assign({}, teaseBase, {ko_leader: 'Radosław Sikorski'})));
  ['Barbara Nowacka', 'Rafał Trzaskowski', 'Borys Budka', 'Adam Szłapka'].forEach(
    function(leader) {
      assert.ok(!teaseVisible(Object.assign({}, teaseBase, {ko_leader: leader})),
        leader + '’s KO does not give Giertych a winnable place');
    }
  );

  const chairVisible = viewIf('poland_events_2024_01.giertych_reckoning_team_2024');
  const chairBase = {
    continuous_campaign: 1, year: 2024, month: 1,
    government_party: 'ko', reckoning_team_2024_done: 0,
  };
  assert.ok(chairVisible(Object.assign({}, chairBase, {ko_leader: 'Donald Tusk'})));
  assert.ok(!chairVisible(Object.assign({}, chairBase, {ko_leader: 'Barbara Nowacka'})),
    'a Nowacka-led KO never gives him the reckoning team');

  // The reckoning itself is a government programme, not his: its two beats
  // still run where no such team exists, and only the June ministry crisis
  // depends on him having chaired one.
  const auditVisible = viewIf('poland_events_2025_02.reckoning_audit_2025');
  assert.ok(auditVisible({
    continuous_campaign: 1, year: 2025, month: 2,
    government_party: 'ko', caretaker_government: 0,
    reckoning_audit_2025_done: 0, reckoning_team_active: 0,
  }), 'a reckoning with no coordinating team still has to be audited');
  const caseVisible = viewIf('poland_events_2026_01.reckoning_case_returns_2026');
  assert.ok(caseVisible({
    continuous_campaign: 1, year: 2026, month: 1,
    government_party: 'ko', caretaker_government: 0,
    reckoning_stage: 2, reckoning_case_2026_done: 0, reckoning_team_active: 0,
  }));

  const crisisVisible = viewIf('poland_events_2026_06.justice_ministry_crisis_2026');
  const crisisBase = coalition2023({
    continuous_campaign: 1, year: 2026, month: 6,
    government_has_confidence: 1, caretaker_government: 0, ko_collapsed: 0,
    justice_crisis_2026_done: 0,
  });
  assert.ok(crisisVisible(Object.assign({}, crisisBase, {prime_minister: 'Donald Tusk'})));
  assert.ok(crisisVisible(Object.assign({}, crisisBase, {prime_minister: 'Radosław Sikorski'})));
  ['Barbara Nowacka', 'Rafał Trzaskowski', 'Magdalena Biejat', 'Adam Szłapka'].forEach(
    function(pm) {
      assert.ok(!crisisVisible(Object.assign({}, crisisBase, {prime_minister: pm})),
        'no reason for ' + pm + ' to open the ministry for him');
    }
  );
  const oppositionVisible =
    viewIf('poland_events_2026_06.justice_ministry_crisis_opposition_2026');
  assert.ok(!oppositionVisible(Object.assign({}, crisisBase, {
    left_in_government: 0, prime_minister: 'Barbara Nowacka',
  })), 'the opposition sibling carries the same prime-ministerial gate');

  // Poland 2050 in the cabinet without PSL closes the appointment entirely: a
  // maximally right-wing KO with a strong chairman still cannot get him sworn in.
  const blocked = openCrisis({
    ko_right_score: 70,
    giertych_standing: 80,
    ko_relation: 20,
    ministry_psl_in_cabinet: 0,
    ministry_p2050_in_cabinet: 1,
  });
  assert.strictEqual(blocked.justice_crisis_appointment_possible, 0);
  const blockedVeto = Object.assign({}, blocked);
  apply('poland_events_2026_06.jc_veto', blockedVeto);
  assert.notStrictEqual(blockedVeto.giertych_justice_outcome, 'giertych',
    'a cabinet Poland 2050 would have to sign for cannot appoint him');
  const blockedAbstain = Object.assign({}, blocked);
  apply('poland_events_2026_06.jc_abstain', blockedAbstain);
  assert.notStrictEqual(blockedAbstain.giertych_justice_outcome, 'giertych');

  // PSL at the same table restores it.
  const carried = openCrisis({
    ko_right_score: 70,
    giertych_standing: 80,
    ko_relation: 20,
    ministry_psl_in_cabinet: 1,
    ministry_p2050_in_cabinet: 1,
  });
  assert.strictEqual(carried.justice_crisis_appointment_possible, 1);
  apply('poland_events_2026_06.jc_veto', carried);
  assert.strictEqual(carried.giertych_justice_outcome, 'giertych');
}

console.log('giertych-crisis-check: all checks passed');
