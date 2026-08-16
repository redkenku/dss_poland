'use strict';

// Focused regression check for Lewica Pracy's movement relationship. It pins
// the three relationship states, their labour-reform and strike consequences,
// cross-current organising, and the exceptional-only independent-party route.

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

function newEngine(name) {
  const engine = new dendry.DendryEngine(new dendry.UserInterface(), game);
  engine.beginGame([name]);
  const choose = function(sceneId) {
    const choices = engine.getCurrentChoices();
    const index = choices.findIndex(function(choice) {
      return choice.id === sceneId;
    });
    assert(index >= 0, 'Missing choice ' + sceneId + ' among ' +
      choices.map(function(choice) { return choice.id; }).join(', '));
    assert(choices[index].canChoose !== false, 'Choice is unavailable: ' + sceneId);
    engine.choose(index);
  };
  choose('root.campaign_game');
  choose('root.standard');
  return {engine: engine, choose: choose, Q: engine.state.qualities};
}

function normalize(ctx) {
  ctx.engine.goToScene('poland_normalize');
}

function setRelationship(ctx, state) {
  ctx.Q.labor_credibility = state.credibility;
  ctx.Q.union_trust = state.unionTrust;
  ctx.Q.opzz_cooperation = state.opzz;
  ctx.Q.labor_mobilization = state.mobilization;
  ctx.Q.labor_dissent = state.conflict;
  ctx.Q.labor_party_breakdown_authored = 0;
  ctx.Q.labor_party_formed = 0;
  normalize(ctx);
}

function choiceAvailable(engine, sceneId) {
  const choice = engine.getCurrentChoices().find(function(candidate) {
    return candidate.id === sceneId;
  });
  return !!choice && choice.canChoose !== false;
}

function strikeAvailable(ctx) {
  ctx.Q.sikorski_labor_stage_before_repeal = 0;
  ctx.engine.goToScene('poland_events_2027_06.sikorski_security_state_2027');
  return choiceAvailable(
    ctx.engine,
    'poland_events_2027_06.sikorski_security_general_strike_2027'
  );
}

function reformPower(ctx) {
  ctx.Q.labor_reform_proposal_stage = 3;
  ctx.Q.labor_reform_progress = 45;
  ctx.Q.labor_minister_party = 'Lewica';
  ctx.Q.economy_minister_party = 'KO';
  ctx.Q.finance_minister_party = 'KO';
  ctx.Q.government_party = 'ko';
  ctx.Q.ministry_ko_in_cabinet = 1;
  ctx.Q.ministry_psl_in_cabinet = 0;
  ctx.Q.ministry_p2050_in_cabinet = 0;
  ctx.Q.labor_ko_commitment = 1;
  ctx.Q.eu_progressive_headwind = 0;
  ctx.engine.goToScene('poland_labor_reform');
  return ctx.Q.labor_reform_power;
}

const relationshipInputs = {
  cooperative: {
    credibility: 72, unionTrust: 70, opzz: 65,
    mobilization: 68, conflict: 25,
  },
  ignored: {
    credibility: 50, unionTrust: 44, opzz: 40,
    mobilization: 42, conflict: 48,
  },
  hostile: {
    credibility: 35, unionTrust: 15, opzz: 12,
    mobilization: 70, conflict: 84,
  },
};

const matrix = [];
for (const name of Object.keys(relationshipInputs)) {
  const ctx = newEngine('labor-' + name);
  setRelationship(ctx, relationshipInputs[name]);
  assert.strictEqual(ctx.Q.labor_relationship_state, name);
  assert(!ctx.Q.factions.includes('labor'),
    'Lewica Pracy must not enter the ordinary member-caucus list');
  assert.strictEqual(ctx.Q.labor_party_formed, 0,
    name + ' relations must not create a party');
  const leverage = ctx.Q.labor_movement_leverage;
  const power = reformPower(ctx);

  const strikeCtx = newEngine('labor-' + name + '-strike');
  setRelationship(strikeCtx, relationshipInputs[name]);
  const strike = strikeAvailable(strikeCtx);
  matrix.push({
    relationship: name,
    leverage: leverage,
    reformPower: power,
    generalStrike: strike ? 'available' : 'blocked',
    laborParty: 'no',
  });
}

assert(matrix[0].leverage > matrix[1].leverage &&
  matrix[1].leverage > matrix[2].leverage,
'Movement leverage must distinguish cooperative, ignored and hostile relations');
assert(matrix[0].reformPower > matrix[1].reformPower &&
  matrix[1].reformPower > matrix[2].reformPower,
'Union relations must materially change labour-reform power');
assert.strictEqual(matrix[0].generalStrike, 'available');
assert.strictEqual(matrix[1].generalStrike, 'blocked');
assert.strictEqual(matrix[2].generalStrike, 'blocked');

// The organising table is available under every major party current and its
// effects cross all of them, including Wspólne Jutro's progressive structure.
for (const current of ['barons', 'razem', 'spring', 'progressives']) {
  const ctx = newEngine('labor-action-' + current);
  ctx.Q.left_dominant_current = current;
  ctx.Q.resources = 3;
  ctx.engine.goToScene('poland_party_actions');
  assert(choiceAvailable(ctx.engine, 'poland_party_actions.labor'),
    'Union organising unavailable under ' + current + ' control');
}

{
  const ctx = newEngine('labor-action-effects');
  setRelationship(ctx, relationshipInputs.ignored);
  ctx.Q.resources = 3;
  ctx.Q.left_in_government = 1;
  const before = {
    trust: ctx.Q.union_trust,
    opzz: ctx.Q.opzz_cooperation,
    mobilization: ctx.Q.labor_mobilization,
    razem: ctx.Q.razem_cooperation,
    progressives: ctx.Q.progressives_dissent,
    spring: ctx.Q.spring_dissent,
    barons: ctx.Q.barons_dissent,
    government: ctx.Q.government_coalition_dissent,
  };
  ctx.engine.goToScene('poland_party_actions.labor');
  assert(ctx.Q.union_trust > before.trust &&
    ctx.Q.opzz_cooperation > before.opzz &&
    ctx.Q.labor_mobilization > before.mobilization,
  'The organising table must build durable workplace power');
  assert(ctx.Q.razem_cooperation > before.razem &&
    ctx.Q.progressives_dissent < before.progressives &&
    ctx.Q.spring_dissent < before.spring &&
    ctx.Q.barons_dissent > before.barons &&
    ctx.Q.government_coalition_dissent > before.government,
  'The organising table must create cross-current benefits and constraints');
}

// Claiming a bargaining framework without implementation records neglect and
// damages the same persistent relationship used by later reform and strikes.
{
  const ctx = newEngine('labor-bargaining-ignored');
  setRelationship(ctx, relationshipInputs.ignored);
  ctx.Q.left_in_government = 0;
  ctx.Q.resources = 3;
  const before = {
    trust: ctx.Q.union_trust,
    opzz: ctx.Q.opzz_cooperation,
    conflict: ctx.Q.labor_dissent,
  };
  ctx.engine.goToScene('poland_events_2025_12.collective_bargaining_2025');
  ctx.choose('poland_events_2025_12.bargaining_claim');
  assert(ctx.Q.union_trust < before.trust &&
    ctx.Q.opzz_cooperation < before.opzz &&
    ctx.Q.labor_dissent > before.conflict,
  'Ignoring bargaining implementation must damage the union relationship');
  assert.strictEqual(ctx.Q.collective_bargaining_implementation, 0);
}

// Even maximum legacy dissent cannot feed the generic split router.
{
  const ctx = newEngine('labor-hostility-no-split');
  setRelationship(ctx, relationshipInputs.hostile);
  ctx.Q.labor_escalation_stage = 7;
  ctx.Q.labor_demand_answered = 0;
  normalize(ctx);
  assert.strictEqual(ctx.Q.labor_escalation_stage, 0);
  assert.strictEqual(ctx.Q.labor_party_breakdown_authored, 0);
  ctx.engine.goToScene('poland_caucus_dynamics.router');
  assert.notStrictEqual(
    ctx.engine.state.sceneId,
    'poland_caucus_dynamics.labor_split'
  );
  assert.strictEqual(ctx.Q.labor_party_formed, 0);
}

// The one party-formation route is an explicit authored institutional rupture.
{
  const ctx = newEngine('labor-exceptional-breakdown');
  setRelationship(ctx, relationshipInputs.hostile);
  ctx.engine.goToScene('poland_party_actions');
  assert(choiceAvailable(ctx.engine, 'poland_party_actions.labor_breakdown'));
  ctx.choose('poland_party_actions.labor_breakdown');
  assert.strictEqual(
    ctx.engine.state.sceneId,
    'poland_caucus_dynamics.labor_split'
  );
  ctx.choose('poland_caucus_dynamics.resolve_exit');
  assert.strictEqual(ctx.Q.labor_party_breakdown_authored, 1);
  assert.strictEqual(ctx.Q.labor_party_formed, 1);
  assert.strictEqual(ctx.Q.labor_party_name, 'Independent Labour Left');
  matrix.push({
    relationship: 'exceptional authored rupture',
    leverage: 'n/a',
    reformPower: 'n/a',
    generalStrike: 'n/a',
    laborParty: 'yes',
  });
}

// Existing saves that already contain the former generic breakaway keep their
// party and are marked as historical exceptions by the compatibility layer.
{
  const ctx = newEngine('labor-legacy-breakaway');
  ctx.Q.labor_party_formed = 1;
  ctx.Q.labor_party_breakdown_authored = 0;
  normalize(ctx);
  assert.strictEqual(ctx.Q.labor_party_formed, 1);
  assert.strictEqual(ctx.Q.labor_party_breakdown_authored, 1);
  assert.strictEqual(ctx.Q.labor_party_name, 'Independent Labour Left');
}

console.log('Labor movement interaction matrix');
console.table(matrix);
console.log('labor-movement-check: all checks passed');
