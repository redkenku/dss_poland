'use strict';

// Targeted check for the Gowin crisis / collapse of the United Right
// expansion. The full smoke suite is currently red on an unrelated
// pre-existing budget assertion (annual_budget_internal_backing 75 vs 74,
// reproducible at HEAD), so this drives only the new material: the affiliation
// model, Koalicja Polska, and every branch of the 2020-2023 chain.

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
  engine.beginGame(['gowin-path-check']);
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

function group(Q, id) {
  const record = (Q.rival_group_records || []).find(function(candidate) {
    return candidate && candidate.id === id;
  });
  assert(record, 'Missing rival group record ' + id);
  return record;
}

function person(Q, id) {
  return (Q.rival_person_records || []).find(function(candidate) {
    return candidate && candidate.id === id;
  });
}

// The invariant the whole expansion rests on: a record's five affiliations are
// independent facts, and the seats attached to a committee are the seats of
// the records that say they are attached to it.
function assertAffiliationConsistency(Q, label) {
  const records = (Q.rival_group_records || []).filter(function(record) {
    return record.active;
  });
  for (const record of records) {
    assert(
      typeof record.list_committee === 'string' && record.list_committee,
      label + ': ' + record.id + ' has no list committee'
    );
    assert(
      typeof record.club === 'string' && record.club,
      label + ': ' + record.id + ' has no parliamentary club'
    );
    assert(
      ['coalition', 'toleration', 'opposition', 'none']
        .includes(record.support_mode),
      label + ': ' + record.id + ' has an unknown support mode ' +
        record.support_mode
    );
    assert(
      record.in_cabinet === 0 || record.in_cabinet === 1,
      label + ': ' + record.id + ' has a non-boolean in_cabinet'
    );
    assert(
      record.independent === 0 || record.independent === 1,
      label + ': ' + record.id + ' has a non-boolean independent'
    );
    assert(
      record.exclusive_seats >= 0,
      label + ': ' + record.id + ' has negative exclusive seats'
    );
    // Holding portfolios means supporting the government it sits in.
    if (record.in_cabinet) {
      assert.strictEqual(
        record.support_mode, 'coalition',
        label + ': ' + record.id + ' holds portfolios without a coalition ' +
          'support mode'
      );
    }
  }
  const attached = function(field, value) {
    return records
      .filter(function(record) { return record[field] === value; })
      .reduce(function(total, record) {
        return total + Math.max(0, Number(record.exclusive_seats) || 0);
      }, 0);
  };
  // Only parties are counted on the PiS committee; internal currents share
  // the parent party's mandates rather than bringing their own.
  const pisPartySeats = records
    .filter(function(record) {
      return record.list_committee === 'pis' && record.kind === 'party';
    })
    .reduce(function(total, record) {
      return total + Math.max(0, Number(record.exclusive_seats) || 0);
    }, 0);
  assert.strictEqual(
    Q.pis_list_attached_seats, pisPartySeats,
    label + ': pis_list_attached_seats disagrees with the records'
  );
  assert.strictEqual(
    Q.kp_list_attached_seats, attached('list_committee', 'psl'),
    label + ': kp_list_attached_seats disagrees with the records'
  );
  assert.strictEqual(
    Q.government_toleration_seats, attached('support_mode', 'toleration'),
    label + ': government_toleration_seats disagrees with the records'
  );
  const sejmTotal =
    Math.max(0, Number(Q.pis_seats) || 0) +
    Math.max(0, Number(Q.ko_seats) || 0) +
    Math.max(0, Number(Q.psl_seats) || 0) +
    Math.max(0, Number(Q.konf_seats) || 0) +
    Math.max(0, Number(Q.left_seats) || 0) +
    Math.max(0, Number(Q.p2050_seats) || 0) +
    Math.max(0, Number(Q.other_seats) || 0) +
    Math.max(0, Number(Q.porozumienie_seats) || 0) +
    Math.max(0, Number(Q.kukiz_seats) || 0);
  assert.strictEqual(
    sejmTotal, 460,
    label + ': the Sejm no longer has 460 seats (' + sejmTotal + ')'
  );
}

// --- 1. the 2019 opening configuration ---------------------------------
{
  const { engine, Q } = newEngine();
  normalize(engine);

  const porozumienie = group(Q, 'porozumienie');
  const solidarna = group(Q, 'solidarna');

  // Both United Right juniors are separate registered parties from month one,
  // and both are inside the cabinet, the PiS club and the PiS list.
  for (const record of [porozumienie, solidarna]) {
    assert.strictEqual(record.independent, 1, record.id + ' should be its own party');
    assert.strictEqual(record.list_committee, 'pis', record.id + ' list');
    assert.strictEqual(record.club, 'pis', record.id + ' club');
    assert.strictEqual(record.in_cabinet, 1, record.id + ' cabinet');
    assert.strictEqual(record.support_mode, 'coalition', record.id + ' support');
  }

  // Koalicja Polska is a committee containing several surviving parties.
  const psl = group(Q, 'psl_party');
  const kukiz = group(Q, 'kukiz15');
  assert.strictEqual(psl.list_committee, 'psl');
  assert.strictEqual(kukiz.list_committee, 'psl');
  assert.strictEqual(kukiz.club, 'kp');
  assert.strictEqual(kukiz.independent, 1);
  assert.strictEqual(kukiz.active, 1);
  assert.strictEqual(Q.kp_coalition_active, 1,
    'Koalicja Polska should start with more than one component');
  assert(
    String(Q.kp_list_members).includes("Kukiz'15"),
    'Kukiz\'15 should be listed as a Koalicja Polska component'
  );
  assert(
    String(Q.pis_list_members).includes('Solidarna Polska') &&
      String(Q.pis_list_members).includes('Porozumienie'),
    'Both United Right juniors should be listed on the PiS committee'
  );

  // Nothing has left anything yet.
  assert.strictEqual(Q.kukiz_left_kp, 0);
  assert.strictEqual(Q.kukiz_seats, 0);
  assert.strictEqual(Q.porozumienie_seats, 0);
  assert.strictEqual(Q.suwerenna_own_list, 0);

  assertAffiliationConsistency(Q, '2019 opening');
  assert(person(Q, 'gowin'), 'Gowin should exist as a named politician');
}

// --- 2. independence does not imply leaving the list --------------------
{
  const { engine, Q } = newEngine();

  // Solidarna Polska walks out of the cabinet and the club but keeps the
  // shared electoral committee, which is what actually happened.
  Q.suwerenna_renamed = 1;
  Q.suwerenna_walkout = 1;
  Q.suwerenna_seats = 18;
  normalize(engine);

  const solidarna = group(Q, 'solidarna');
  assert.strictEqual(solidarna.independent, 1);
  assert.strictEqual(solidarna.in_cabinet, 0);
  assert.strictEqual(solidarna.support_mode, 'opposition');
  assert.strictEqual(solidarna.club, 'sp');
  assert.strictEqual(
    solidarna.list_committee, 'pis',
    'A walkout must not remove Solidarna Polska from the PiS list'
  );
  assert(
    String(Q.pis_list_members).includes('Suwerenna Polska'),
    'An independent Suwerenna Polska is still a PiS committee component'
  );

  // Only an explicit decision to file its own committee detaches it.
  Q.suwerenna_own_list = 1;
  normalize(engine);
  assert.strictEqual(group(Q, 'solidarna').list_committee, 'solidarna');
  assert(
    !String(Q.pis_list_members).includes('Suwerenna Polska'),
    'After filing its own committee it should leave the PiS list'
  );
}

console.log('gowin-path-check: affiliation model OK');

// --- 3. Act I: resignation does not remove Porozumienie ------------------
function runPostalCrisis(stanceChoice, readChoice) {
  const { engine, choose, Q } = newEngine();
  engine.goToScene('poland_gowin_crisis.postal_crisis');
  choose('poland_gowin_crisis.' + stanceChoice);
  choose('poland_gowin_crisis.gowin_resignation');
  choose('poland_gowin_crisis.' + readChoice);
  return { engine: engine, choose: choose, Q: Q };
}

for (const stance of [
  'postal_tactical', 'postal_refuse', 'postal_emergency', 'postal_break'
]) {
  const { engine, Q } = runPostalCrisis(stance, 'gowin_read_credit');
  normalize(engine);

  assert.strictEqual(Q.gowin_resigned_2020, 1, stance + ': Gowin should resign');
  assert.strictEqual(Q.gowin_in_cabinet, 0, stance + ': he leaves the cabinet');

  // The whole point of April 2020: the party stays where it was.
  const porozumienie = group(Q, 'porozumienie');
  assert.strictEqual(porozumienie.in_cabinet, 1,
    stance + ': Porozumienie must keep its portfolios');
  assert.strictEqual(porozumienie.support_mode, 'coalition',
    stance + ': Porozumienie must stay in the coalition');
  assert.strictEqual(porozumienie.list_committee, 'pis',
    stance + ': Porozumienie must stay on the PiS list');
  assert.strictEqual(porozumienie.club, 'pis',
    stance + ': Porozumienie must stay in the PiS club');
  assert.strictEqual(Q.porozumienie_exit_done, 0,
    stance + ': no party exit in 2020');
  assert.strictEqual(Q.porozumienie_seats, 0,
    stance + ': no mandates transfer in 2020');

  // The internal split exists and accounts for every deputy.
  assert.strictEqual(
    Q.porozumienie_rebel_mps + Q.porozumienie_loyalist_mps +
      Q.porozumienie_mediator_mps,
    12,
    stance + ': the internal tendencies do not account for all 12 deputies'
  );
  assert(Q.porozumienie_rebel_mps >= 2 && Q.porozumienie_loyalist_mps >= 2,
    stance + ': both wings must exist');
  assert(person(Q, 'bielan').loyalty === 'United Right first',
    stance + ': Bielan should sit on the pro-government side');
  assert(person(Q, 'gowin').loyalty === 'Gowin',
    stance + ': Gowin should lead his own tendency');

  assertAffiliationConsistency(Q, 'after ' + stance);
}

// Refusing to deal with Gowin must leave a weaker count than cooperating.
{
  const cooperative = runPostalCrisis('postal_tactical', 'gowin_read_credit');
  const refusing = runPostalCrisis('postal_refuse', 'gowin_read_conservative');
  assert(
    cooperative.Q.postal_resistance > refusing.Q.postal_resistance,
    'Cooperation must produce more parliamentary resistance than refusal'
  );
  assert.strictEqual(refusing.Q.gowin_channel, 0,
    'Refusal must leave no working channel');
}

// --- 4. the four May outcomes -------------------------------------------
function resolveMay(setup) {
  const { engine, Q } = newEngine();
  setup(Q);
  engine.goToScene('poland_gowin_crisis.postal_resolution');
  return Q;
}

assert.strictEqual(
  resolveMay(function (Q) {
    Q.postal_resistance = 38; Q.gowin_standing = 62; Q.gowin_channel = 26;
  }).postal_outcome,
  'compromise',
  'A contested but undecided spring should reach the 6 May compromise'
);
assert.strictEqual(
  resolveMay(function (Q) {
    Q.postal_resistance = 50; Q.gowin_standing = 72;
  }).postal_outcome,
  'clean',
  'Strong resistance plus a strong Gowin should postpone the vote cleanly'
);
assert.strictEqual(
  resolveMay(function (Q) {
    Q.postal_resistance = 22; Q.gowin_standing = 40;
  }).postal_outcome,
  'forced',
  'A collapsed count should let PiS force the postal election through'
);
assert.strictEqual(
  resolveMay(function (Q) {
    Q.constitutional_bargain_2020 = 1;
    Q.postal_resistance = 54; Q.gowin_standing = 76; Q.gowin_channel = 52;
  }).postal_outcome,
  'constitutional',
  'The constitutional bargain should be reachable when it was actually struck'
);

// --- 5. Act II: Emilewicz and the autumn reconstruction ------------------
{
  const { engine, choose, Q } = newEngine();
  engine.goToScene('poland_gowin_crisis.emilewicz_exit');
  choose('poland_gowin_crisis.emilewicz_note_pattern');
  normalize(engine);

  const emilewicz = person(Q, 'emilewicz');
  assert.strictEqual(emilewicz.organisation, 'pis-aligned independent',
    'Emilewicz should leave the party');
  assert.strictEqual(emilewicz.party, 'pis',
    'Emilewicz should stay inside the PiS parliamentary camp');
  assert.strictEqual(group(Q, 'porozumienie').list_committee, 'pis',
    'One defection must not detach Porozumienie from the list');
  assert.strictEqual(group(Q, 'porozumienie').in_cabinet, 1,
    'One defection must not remove Porozumienie from the cabinet');
  assertAffiliationConsistency(Q, 'after Emilewicz');
}

{
  // A Gowin who survived the spring returns to the cabinet.
  const strong = newEngine();
  strong.Q.gowin_standing = 66;
  strong.Q.porozumienie_cohesion_2020 = 54;
  strong.engine.goToScene('poland_gowin_crisis.gowin_returns');
  assert.strictEqual(strong.Q.gowin_returned_2020, 1);
  assert.strictEqual(strong.Q.gowin_in_cabinet, 1);
  normalize(strong.engine);
  assert.strictEqual(group(strong.Q, 'porozumienie').in_cabinet, 1);
  assertAffiliationConsistency(strong.Q, 'Gowin returns');

  // A destroyed Gowin does not.
  const weak = newEngine();
  weak.Q.gowin_standing = 30;
  weak.Q.porozumienie_cohesion_2020 = 30;
  weak.engine.goToScene('poland_gowin_crisis.gowin_returns');
  assert.strictEqual(weak.Q.gowin_returned_2020, 0);
  normalize(weak.engine);
  // Excluded from the cabinet, still on the list and in the club.
  assert.strictEqual(group(weak.Q, 'porozumienie').list_committee, 'pis');
  assertAffiliationConsistency(weak.Q, 'Gowin excluded');
}

console.log('gowin-path-check: Act I and Act II OK');

// --- 6. Act III: the split that moves nobody between camps ---------------
function runToSplit(setup) {
  const { engine, choose, Q } = newEngine();
  normalize(engine);
  if (setup) setup(Q);
  engine.goToScene('poland_porozumienie_war.bielan_rebellion');
  choose('poland_porozumienie_war.bielan_ignore');
  engine.goToScene('poland_porozumienie_war.republikanie_split');
  normalize(engine);
  return { engine: engine, choose: choose, Q: Q };
}

{
  // A Porozumienie damaged by 2020 splits, and Partia Republikańska comes out
  // of deputies Gowin already had rather than out of nowhere.
  const { Q } = runToSplit(function (Q) {
    Q.porozumienie_cohesion_2020 = 40;
    Q.gowin_standing = 44;
  });
  assert.strictEqual(Q.republikanie_formed, 1, 'A damaged Gowin should split');
  const republikanie = group(Q, 'republikanie');
  const porozumienie = group(Q, 'porozumienie');
  assert(Q.republikanie_seats >= 2, 'The splinter needs deputies');
  assert.strictEqual(
    republikanie.mp_count + porozumienie.mp_count, 12,
    'The splinter must be taken out of Porozumienie, not invented'
  );
  // The split is inside the United Right, so nothing in the count moves.
  assert.strictEqual(republikanie.list_committee, 'pis');
  assert.strictEqual(republikanie.club, 'pis');
  assert.strictEqual(republikanie.support_mode, 'coalition');
  assert.strictEqual(republikanie.independent, 1);
  assert.strictEqual(republikanie.exclusive_seats, 0,
    'Republikanie sit on PiS mandates, so they transfer none');
  assert.strictEqual(person(Q, 'bielan').organisation, 'republikanie');
  assertAffiliationConsistency(Q, 'after the Republican split');
}

{
  // An unusually successful Gowin keeps his party.
  const { Q } = runToSplit(function (Q) {
    Q.porozumienie_cohesion_2020 = 82;
    Q.gowin_standing = 84;
    Q.gowin_returned_2020 = 1;
  });
  assert.strictEqual(Q.republikanie_formed, 0,
    'A strong Gowin should be able to survive the rebellion');
  assert.strictEqual(group(Q, 'republikanie').active, 0);
  assertAffiliationConsistency(Q, 'rebellion survived');
}

// --- 7. Act IV: Koalicja Polska splits without destroying anybody --------
function runToKukiz(setup) {
  const { engine, choose, Q } = runToSplit(function (Q) {
    Q.porozumienie_cohesion_2020 = 40;
    Q.gowin_standing = 44;
  });
  engine.goToScene('poland_porozumienie_war.kp_rupture');
  choose('poland_porozumienie_war.kukiz_open_channel');
  if (setup) setup(Q);
  engine.goToScene('poland_porozumienie_war.kukiz_negotiation');
  return { engine: engine, choose: choose, Q: Q };
}

{
  const { Q } = runToKukiz();
  assert.strictEqual(Q.kukiz_left_kp, 1, 'Kukiz should leave Koalicja Polska');
  assert.strictEqual(Q.kukiz_seats, 6, 'Six mandates should move to Kukiz');
  assert.strictEqual(Q.psl_seats, 24, 'PSL keeps the rest of the committee');
  const kukiz = group(Q, 'kukiz15');
  const psl = group(Q, 'psl_party');
  assert.strictEqual(kukiz.active, 1, 'Kukiz\'15 survives the separation');
  assert.strictEqual(psl.active, 1, 'PSL survives the separation');
  assert.strictEqual(kukiz.club, 'kukiz15');
  assert.strictEqual(kukiz.list_committee, 'kukiz');
  assert.strictEqual(psl.list_committee, 'psl');
  assertAffiliationConsistency(Q, 'after the Koalicja Polska rupture');
}

// The three Kukiz outcomes, each produced by what was actually offered.
function kukizOutcome(setup, resolutionChoice) {
  const { engine, choose, Q } = runToKukiz(setup);
  choose('poland_porozumienie_war.' + resolutionChoice);
  choose('poland_porozumienie_war.kukiz_resolution');
  normalize(engine);
  return Q;
}

{
  const aligned = kukizOutcome(function (Q) {
    Q.kukiz_channel = 0;
    Q.kukiz_programme_credit = 0;
    Q.united_right_cohesion = 30;
    Q.gowin_standing = 20;
  }, 'kukiz_stand_aside');
  assert.strictEqual(aligned.kukiz_alignment, 'pis_current',
    'An unopposed PiS with a failing majority should buy Kukiz');
  assert.strictEqual(group(aligned, 'kukiz15').support_mode, 'coalition');
  assert.strictEqual(aligned.kukiz_list_committee, 'pis',
    'A PiS-aligned Kukiz should reach the historical list arrangement');
  assert.strictEqual(group(aligned, 'kukiz15').independent, 1,
    'He is on the PiS list and is still his own party');
  assertAffiliationConsistency(aligned, 'Kukiz as a PiS current');
}

{
  const tolerating = kukizOutcome(function (Q) {
    Q.kukiz_channel = 26;
    Q.kukiz_programme_credit = 12;
    Q.united_right_cohesion = 52;
    Q.gowin_standing = 46;
  }, 'kukiz_bid_institutions');
  assert.strictEqual(tolerating.kukiz_alignment, 'toleration');
  assert.strictEqual(group(tolerating, 'kukiz15').support_mode, 'toleration');
  assert.strictEqual(tolerating.kukiz_list_committee, 'kukiz',
    'A merely tolerating Kukiz must not appear on the PiS list');
  assert.strictEqual(
    tolerating.government_toleration_seats, tolerating.kukiz_seats,
    'Toleration seats should be counted separately from the coalition'
  );
  assertAffiliationConsistency(tolerating, 'Kukiz tolerating');
}

{
  const refusing = kukizOutcome(function (Q) {
    Q.kukiz_channel = 46;
    Q.kukiz_programme_credit = 40;
    Q.resources = 8;
    Q.united_right_cohesion = 60;
    Q.gowin_standing = 60;
  }, 'kukiz_bid_hard');
  assert.strictEqual(refusing.kukiz_alignment, 'refused',
    'A successful Lewica bid should be able to deny PiS his votes');
  assert.strictEqual(group(refusing, 'kukiz15').support_mode, 'opposition');
  assert.strictEqual(refusing.kukiz_list_committee, 'kukiz');
  assertAffiliationConsistency(refusing, 'Kukiz refusing');
}

console.log('gowin-path-check: Act III and Act IV OK');

// --- 8. Acts V-VII: the dismissal, 11 August and minority government -----
function runAugust2021(kukizAlignment, lexChoice) {
  const { engine, choose, Q } = newEngine();
  normalize(engine);
  // Reach August with the state each route would actually have produced.
  Q.porozumienie_cohesion_2020 = 44;
  Q.gowin_standing = 46;
  Q.porozumienie_rebel_mps = 5;
  Q.porozumienie_loyalist_mps = 5;
  Q.porozumienie_mediator_mps = 2;
  Q.kukiz_alignment = kukizAlignment;
  Q.kukiz_left_kp = 1;
  Q.kukiz_seats = 6;
  Q.psl_seats = 24;
  const kukiz = group(Q, 'kukiz15');
  kukiz.club = 'kukiz15';
  kukiz.list_committee = kukizAlignment === 'pis_current' ? 'pis' : 'kukiz';
  kukiz.exclusive_seats = 6;
  kukiz.support_mode = kukizAlignment === 'pis_current'
    ? 'coalition'
    : (kukizAlignment === 'toleration' ? 'toleration' : 'opposition');
  engine.goToScene('poland_minority_sejm.lex_tvn_crisis');
  choose('poland_minority_sejm.' + lexChoice);
  choose('poland_minority_sejm.gowin_dismissed');
  return { engine: engine, choose: choose, Q: Q };
}

// Historical route: PiS no longer needs Gowin, so it refuses the amendment.
{
  const { engine, choose, Q } = runAugust2021('pis_current', 'lex_tvn_watch');
  assert.strictEqual(Q.oecd_compromise_accepted, 0,
    'A PiS with Kukiz should be able to refuse the OECD amendment');
  assert.strictEqual(Q.porozumienie_exit_done, 1);
  // @august_11_sejm calls poland_normalize itself, so the roll-ups are fresh
  // once we are inside it.
  choose('poland_minority_sejm.august_11_sejm');

  const porozumienie = group(Q, 'porozumienie');
  // Porozumienie leaves all five affiliations at once.
  assert.strictEqual(porozumienie.in_cabinet, 0);
  assert.strictEqual(porozumienie.support_mode, 'opposition');
  assert.strictEqual(porozumienie.club, 'porozumienie');
  assert.strictEqual(porozumienie.list_committee, 'porozumienie',
    'Porozumienie must genuinely leave the PiS committee');
  assert(!String(Q.pis_list_members).includes('Porozumienie'));

  // The loyal components stay on it.
  assert.strictEqual(group(Q, 'solidarna').list_committee, 'pis',
    'Solidarna Polska must stay attached to the PiS list');
  assert.strictEqual(group(Q, 'odnowa').list_committee, 'pis');
  assert.strictEqual(group(Q, 'odnowa').independent, 1,
    'OdNowa is its own party and still on the PiS list');
  assert(Q.odnowa_seats > 0, 'OdNowa should be generated from the stayers');
  assert.strictEqual(person(Q, 'ociepa').organisation, 'odnowa');
  // This route skipped the Emilewicz and Republikanie beats, so the party is
  // still at its full twelve; the split must account for all of them.
  assert.strictEqual(
    Q.porozumienie_seats + Q.odnowa_seats, 12,
    'Every remaining Porozumienie deputy must end up somewhere'
  );
  assert(Q.government_support_seats < 231,
    'The government should lose its majority');
  assertAffiliationConsistency(Q, 'after the dismissal');

  assert.strictEqual(Q.reassumption_result, 'government',
    'An aligned Kukiz should reproduce the historical reassumption');
  choose('poland_minority_sejm.aug11_condemn_procedure');
  choose('poland_minority_sejm.minority_parliament_opens');
  assert.strictEqual(Q.minority_parliament, 1);
  assert.strictEqual(Q.pis_konf_coalition_available, 0,
    'A PiS-Konfederacja coalition must never be the automatic answer');
  assert.strictEqual(Q.caretaker_government || 0, 0,
    'A lost majority must not collapse the government');
  assertAffiliationConsistency(Q, 'minority parliament');
}

// Toleration: PiS has to pay for the afternoon.
{
  const { choose, Q } = runAugust2021('toleration', 'lex_tvn_oppose_both');
  choose('poland_minority_sejm.august_11_sejm');
  assert.strictEqual(Q.reassumption_result, 'bought');
}

// Refusal: the adjournment stands and Lex TVN is not passed that day.
{
  const { engine, choose, Q } = runAugust2021('refused', 'lex_tvn_oppose_both');
  assert.strictEqual(Q.oecd_compromise_accepted, 0,
    'Maximal opposition should remove PiS\'s incentive to concede');
  choose('poland_minority_sejm.august_11_sejm');
  assert.strictEqual(Q.reassumption_result, 'stands',
    'A refusing Kukiz should let the adjournment hold');
  assert.strictEqual(Q.lex_tvn_result, 'pending',
    'Lex TVN must not pass on a day the chamber adjourned');
  choose('poland_minority_sejm.aug11_bank_arithmetic');
  choose('poland_minority_sejm.minority_parliament_opens');
  normalize(engine);
  assert.strictEqual(Q.minority_parliament, 1);
  assertAffiliationConsistency(Q, 'minority parliament without Kukiz');
}

// PiS still needs him: the amendment is taken and the coalition survives.
{
  const { engine, Q } = runAugust2021('refused', 'lex_tvn_watch');
  assert.strictEqual(Q.oecd_compromise_accepted, 1,
    'A PiS that still needs Gowin should take the OECD compromise');
  assert.strictEqual(Q.porozumienie_exit_done, 0);
  normalize(engine);
  assert.strictEqual(group(Q, 'porozumienie').list_committee, 'pis');
  assert.strictEqual(group(Q, 'porozumienie').in_cabinet, 1);
  assertAffiliationConsistency(Q, 'coalition survives August');
}

console.log('gowin-path-check: Acts V-VII OK');

// --- 9. Act VIII: what becomes of Porozumienie and Kukiz ----------------
function runAftermath(setup) {
  const { engine, choose, Q } = newEngine();
  normalize(engine);
  Q.porozumienie_exit_done = 1;
  Q.porozumienie_active = 1;
  Q.porozumienie_seats = 6;
  Q.pis_seats = 229;
  Q.kukiz_left_kp = 1;
  Q.kukiz_seats = 6;
  Q.psl_seats = 24;
  const porozumienie = group(Q, 'porozumienie');
  porozumienie.mp_count = 6;
  porozumienie.exclusive_seats = 6;
  const kukiz = group(Q, 'kukiz15');
  kukiz.exclusive_seats = 6;
  kukiz.club = 'kukiz15';
  if (setup) setup(Q);
  return { engine: engine, choose: choose, Q: Q };
}

// The centrist route: a well-regarded Porozumienie reaches Third Way.
{
  const { engine, choose, Q } = runAftermath(function (Q) {
    Q.gowin_channel = 60;
    Q.psl_relation = 48;
    Q.kukiz_alignment = 'refused';
    Q.kukiz_relation = 30;
    Q.kukiz_programme_credit = 40;
  });
  engine.goToScene('poland_porozumienie_after.porozumienie_search');
  choose('poland_porozumienie_after.gowin_after_tolerate');
  engine.goToScene('poland_porozumienie_after.gowin_steps_down');
  engine.goToScene('poland_porozumienie_after.porozumienie_list_2023');
  normalize(engine);

  assert.strictEqual(Q.porozumienie_route_2023, 'third_way',
    'A rehabilitated Porozumienie should reach the centrist bloc');
  assert.strictEqual(group(Q, 'porozumienie').list_committee, 'third_way');
  assert.strictEqual(Q.tyszka_defected, 0,
    'Tyszka stays while Kukiz is genuinely independent');
  assert.notStrictEqual(Q.kukiz_list_committee, 'pis',
    'A Kukiz who refused PiS must not appear on its list');
  assertAffiliationConsistency(Q, 'Porozumienie into Third Way');
}

// The historical route: Kukiz reaches the PiS list and Tyszka leaves.
{
  const { engine, Q } = runAftermath(function (Q) {
    Q.gowin_channel = 0;
    Q.psl_relation = 18;
    Q.ko_relation = 30;
    Q.kukiz_alignment = 'pis_current';
  });
  engine.goToScene('poland_porozumienie_after.porozumienie_list_2023');
  normalize(engine);
  assert.strictEqual(Q.kukiz_list_committee, 'pis');
  assert.strictEqual(Q.kukiz_route_2023, 'pis');
  assert.strictEqual(group(Q, 'kukiz15').independent, 1,
    'Kukiz is on the PiS list and still his own party');
  assert.strictEqual(Q.tyszka_defected, 1);
  assert.strictEqual(person(Q, 'tyszka').party, 'konf');
  assert.strictEqual(Q.porozumienie_route_2023, 'alone',
    'An unforgiven Porozumienie has to file alone');
  assertAffiliationConsistency(Q, 'historical 2023 placement');
}

// A party that dissolved through defections is removed cleanly.
{
  const { engine, Q } = runAftermath(function (Q) {
    Q.porozumienie_active = 0;
    Q.porozumienie_seats = 0;
    Q.pis_seats = 235;
    group(Q, 'porozumienie').mp_count = 0;
    group(Q, 'porozumienie').exclusive_seats = 0;
  });
  engine.goToScene('poland_porozumienie_after.porozumienie_list_2023');
  normalize(engine);
  assert.strictEqual(Q.porozumienie_route_2023, 'dissolved');
  assertAffiliationConsistency(Q, 'Porozumienie dissolved');
}

// The commission reads back what the 2020 chain recorded.
{
  const { engine, choose, Q } = newEngine();
  normalize(engine);
  Q.continuous_campaign = 1;
  Q.year = 2024;
  Q.postal_event_done = 1;
  Q.postal_outcome = 'compromise';
  Q.postal_pressure_record = 'a distinctive recorded contact';
  Q.government_party = 'lewica';
  engine.goToScene('poland_porozumienie_after.postal_commission_2024');
  const text = JSON.stringify(engine.state.currentContent || '');
  assert(text.includes('a distinctive recorded contact'),
    'The commission must report what the 2020 chain actually recorded');
  choose('poland_porozumienie_after.commission_institutions');
  assert.strictEqual(Q.electoral_law_reformed, 1);
}

console.log('gowin-path-check: Act VIII OK');

// --- 10. the minority parliament has recurring consequences -------------
{
  const { engine, choose, Q } = newEngine();
  normalize(engine);
  Q.minority_parliament = 1;
  Q.minority_since_year = 2021;
  Q.government_support_seats = 227;
  Q.government_toleration_seats = 0;
  Q.kukiz_alignment = 'refused';
  Q.pis_relation = 8;
  engine.goToScene('poland_minority_sejm.minority_vote_night');
  assert.strictEqual(Q.minority_bill_passed, 0,
    'A government 4 short with no toleration should have to withdraw the bill');
  assert.strictEqual(Q.minority_lost_votes, 1);
  choose('poland_minority_sejm.minority_obstruct');
  assert.strictEqual(Q.minority_lost_votes, 2);
  assert(Q.minority_record_penalty > 0,
    'A record of lost votes must weigh on the 2023 campaign');
}
{
  // A tolerating Kukiz supplies the votes and is paid for them.
  const { engine, Q } = newEngine();
  normalize(engine);
  Q.minority_parliament = 1;
  Q.government_support_seats = 227;
  Q.government_toleration_seats = 6;
  Q.kukiz_alignment = 'toleration';
  Q.pis_relation = 8;
  engine.goToScene('poland_minority_sejm.minority_vote_night');
  assert.strictEqual(Q.minority_bill_passed, 1);
  assert(String(Q.minority_bill_cost).includes('Kukiz'),
    'Toleration should be paid for in the currency Kukiz accepts');
}

console.log('gowin-path-check: minority parliament OK');

// --- 11. one committee record, two names --------------------------------
{
  const { engine, Q } = newEngine();
  normalize(engine);
  // 2019: Koalicja Polska is a real committee with several components.
  assert.strictEqual(group(Q, 'kp_committee').active, 1);
  assert.strictEqual(group(Q, 'kp_committee').name, 'Koalicja Polska');
  assert.strictEqual(Q.third_way_committee_active, 0);
  assert.strictEqual(group(Q, 'p2050_party').active, 0,
    'Polska 2050 does not exist in 2019');

  // Trzecia Droga is the same record under a different name.
  Q.p2050_emerged = 1;
  Q.third_way_active = 1;
  normalize(engine);
  const committee = group(Q, 'kp_committee');
  assert.strictEqual(committee.name, 'Trzecia Droga');
  assert.strictEqual(committee.list_committee, 'third_way');
  assert.strictEqual(committee.active, 1);
  assert.strictEqual(Q.third_way_committee_active, 1);
  assert.strictEqual(group(Q, 'psl_party').list_committee, 'third_way',
    'PSL follows its committee into the centrist bloc');
  assert.strictEqual(group(Q, 'p2050_party').list_committee, 'third_way');
  assert.strictEqual(group(Q, 'psl_party').active, 1,
    'PSL survives as its own party inside Trzecia Droga');
  assert(String(Q.kp_list_members).includes('Polska 2050'));
}

{
  // Koalicja Polska empties out before any successor is agreed: the committee
  // record deactivates rather than leaving a Third Way behind.
  const { engine, Q } = newEngine();
  normalize(engine);
  Q.kukiz_left_kp = 1;
  group(Q, 'kukiz15').list_committee = 'kukiz';
  group(Q, 'kp_partners').active = 0;
  normalize(engine);
  assert.strictEqual(group(Q, 'kp_committee').active, 0,
    'A committee with one component is not a committee');
  assert.strictEqual(Q.kp_committee_name, 'No shared committee');
  assert.strictEqual(Q.third_way_committee_active, 0,
    'No Third Way may appear just because Koalicja Polska ended');
  assert.strictEqual(group(Q, 'psl_party').active, 1,
    'PSL survives the committee it belonged to');
  assertAffiliationConsistency(Q, 'committee dissolved');
}

console.log('gowin-path-check: Koalicja Polska / Trzecia Droga committee OK');

// --- 12. Konfederacja as a party family with a renaming component -------
{
  const { engine, Q } = newEngine();
  normalize(engine);
  assert.strictEqual(group(Q, 'konf_committee').active, 1);
  assert.strictEqual(group(Q, 'konf_committee').name,
    'Konfederacja Wolność i Niepodległość');
  for (const id of ['nowa_nadzieja', 'ruch_narodowy', 'kkp']) {
    const record = group(Q, id);
    assert.strictEqual(record.list_committee, 'konf', id + ' list');
    assert.strictEqual(record.club, 'konf', id + ' club');
    assert.strictEqual(record.independent, 1, id + ' is its own party');
  }
  assert(String(Q.konf_list_members).includes('Ruch Narodowy'));

  // The libertarian component is one organisation with three names.
  assert.strictEqual(group(Q, 'nowa_nadzieja').name, 'Wolność',
    'It is Wolność at the 2019 start');
  Q.year = 2021; Q.month = 11;
  normalize(engine);
  assert.strictEqual(group(Q, 'nowa_nadzieja').name, 'Wolność');
  Q.month = 12;
  normalize(engine);
  assert.strictEqual(group(Q, 'nowa_nadzieja').name, 'KORWiN',
    'It becomes KORWiN in December 2021');
  Q.year = 2022; Q.month = 10;
  normalize(engine);
  assert.strictEqual(group(Q, 'nowa_nadzieja').name, 'KORWiN');
}

{
  // Mentzen wins the congress: the same record becomes Nowa Nadzieja.
  const { engine, Q } = newEngine();
  normalize(engine);
  Q.year = 2022; Q.month = 11;
  Q.konf_succession_2022_done = 1;
  Q.konf_korwin_countercoup_2022 = 0;
  Q.konf_libertarian_leader = 'Sławomir Mentzen';
  normalize(engine);
  assert.strictEqual(group(Q, 'nowa_nadzieja').name, 'Nowa Nadzieja');
  assert.strictEqual(group(Q, 'nowa_nadzieja').leader, 'Sławomir Mentzen');

  // Korwin survives the challenge: it stays KORWiN.
  Q.konf_korwin_countercoup_2022 = 1;
  Q.konf_libertarian_leader = 'Janusz Korwin-Mikke';
  normalize(engine);
  assert.strictEqual(group(Q, 'nowa_nadzieja').name, 'KORWiN');
  assert.strictEqual(group(Q, 'nowa_nadzieja').leader, 'Janusz Korwin-Mikke');
}

{
  // Braun's organisation leaves the committee without ceasing to exist.
  const { engine, Q } = newEngine();
  normalize(engine);
  Q.far_right_split = 1;
  Q.korona_seats = 4;
  normalize(engine);
  const kkp = group(Q, 'kkp');
  assert.strictEqual(kkp.name, 'Korona');
  assert.strictEqual(kkp.active, 1, 'Korona survives the split');
  assert.strictEqual(kkp.list_committee, 'korona');
  assert.strictEqual(kkp.club, 'korona');
  assert(!String(Q.konf_list_members).includes('Korona'));
  assert(String(Q.konf_list_members).includes('Ruch Narodowy'),
    'The rest of the federation stays on the committee');
  assert.strictEqual(group(Q, 'konf_committee').active, 1);
}

console.log('gowin-path-check: Konfederacja family OK');

// --- 13. alliances carry their full names, and isolation stays visible ---
{
  const { engine, Q } = newEngine();
  normalize(engine);
  assert.strictEqual(group(Q, 'zp_committee').name, 'Zjednoczona Prawica');
  assert.strictEqual(group(Q, 'zp_committee').active, 1);
  assert.strictEqual(Q.zp_committee_name, 'Zjednoczona Prawica');
  assert.strictEqual(group(Q, 'ko_party').name, 'Koalicja Obywatelska');
  assert.strictEqual(group(Q, 'kp_committee').name, 'Koalicja Polska');
  assert.strictEqual(Q.kp_committee_class, 'party-psl',
    'Koalicja Polska is green');
  assert.strictEqual(group(Q, 'konf_committee').name,
    'Konfederacja Wolność i Niepodległość');

  // Trzecia Droga keeps its own colour.
  Q.p2050_emerged = 1;
  Q.third_way_active = 1;
  normalize(engine);
  assert.strictEqual(Q.kp_committee_class, 'party-third-way');

  // Nothing has isolated itself at the start.
  const fresh = newEngine();
  normalize(fresh.engine);
  assert.strictEqual(fresh.Q.independent_bucket_count, 0,
    'Everything starts on a shared committee');

  // A party that leaves every committee stays visible in the bucket.
  fresh.Q.porozumienie_exit_done = 1;
  fresh.Q.porozumienie_active = 1;
  fresh.Q.porozumienie_seats = 5;
  fresh.Q.pis_seats = 230;
  group(fresh.Q, 'porozumienie').mp_count = 5;
  group(fresh.Q, 'porozumienie').exclusive_seats = 5;
  fresh.Q.kukiz_left_kp = 1;
  fresh.Q.kukiz_seats = 6;
  fresh.Q.psl_seats = 24;
  group(fresh.Q, 'kukiz15').list_committee = 'kukiz';
  group(fresh.Q, 'kukiz15').exclusive_seats = 6;
  normalize(fresh.engine);
  assert.strictEqual(fresh.Q.independent_bucket_count, 2);
  assert.strictEqual(fresh.Q.independent_bucket_seats, 11);
  assert(String(fresh.Q.independent_bucket_members).includes('Porozumienie'));
  assert(String(fresh.Q.independent_bucket_members).includes("Kukiz'15"));
  assertAffiliationConsistency(fresh.Q, 'independent bucket');
}

console.log('gowin-path-check: alliance names and independent bucket OK');

// --- 14. an alliance split by a cabinet only one component joined -------
{
  const { engine, Q } = newEngine();
  normalize(engine);
  Q.p2050_emerged = 1;
  Q.third_way_active = 1;
  normalize(engine);
  assert.strictEqual(Q.third_way_split, 0);
  assert.strictEqual(group(Q, 'psl_party').list_committee, 'third_way');

  // Poland 2050 joins a cabinet; PSL does not.
  Q.ministry_p2050_in_cabinet = 1;
  Q.ministry_psl_in_cabinet = 0;
  normalize(engine);
  assert.strictEqual(Q.third_way_split, 1,
    'A cabinet only one component joined must break the alliance');
  assert.strictEqual(Q.third_way_active, 0);
  // Both survive as separate, visible, separately-filing parties.
  assert.strictEqual(group(Q, 'psl_party').list_committee, 'psl');
  assert.strictEqual(group(Q, 'p2050_party').list_committee, 'p2050');
  assert.strictEqual(group(Q, 'psl_party').active, 1);
  assert.strictEqual(group(Q, 'p2050_party').active, 1,
    'Poland 2050 must not vanish when the alliance breaks');
  assert(String(Q.independent_bucket_members).includes('Polska 2050'),
    'A now-isolated Poland 2050 is visible in the independent bucket');
}

console.log('gowin-path-check: alliance split invariant OK');
