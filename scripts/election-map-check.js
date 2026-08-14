'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const dendry = require('dendrynexus/lib/engine');

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: undefined,
});

const projectRoot = path.resolve(__dirname, '..');
let game;
dendry.convertJSONToGame(
  fs.readFileSync(path.join(projectRoot, 'out', 'game.json'), 'utf8'),
  function(error, converted) {
    if (error) throw error;
    game = converted;
  }
);
require(path.join(projectRoot, 'out', 'html', 'poland-election-geography.js'));

function engine() {
  const instance = new dendry.DendryEngine(new dendry.UserInterface(), game);
  instance.beginGame(['election-map-check']);
  function choose(id) {
    const choices = instance.getCurrentChoices();
    const index = choices.findIndex(function(choice) { return choice.id === id; });
    assert(index >= 0, 'missing choice ' + id);
    instance.choose(index);
  }
  choose('root.campaign_game');
  choose('root.standard');
  instance.goToScene('poland_normalize');
  return instance;
}

function total(object) {
  return Object.keys(object || {}).reduce(function(sum, id) {
    return sum + Number(object[id] || 0);
  }, 0);
}

function allocation(model, state, system, votes, campaignLog) {
  const ids = Object.keys(votes);
  return model.allocateSejm({
    state: state,
    system: system,
    partyIds: ids,
    committeeFor: {},
    componentVotes: votes,
    committeeVotes: votes,
    qualifiedCommittees: ids.filter(function(id) {
      return id !== 'other' && votes[id] >= 5;
    }),
    negotiatedShares: {},
    campaignLog: campaignLog || [],
  });
}

const run = engine();
const state = run.state.qualities;
const model = globalThis.polandElectionModel;
assert.strictEqual(model.version, 4);
const data = model.geography;
const geometry = globalThis.polandElectionGeography;

assert.deepStrictEqual(
  [data.provinces.length, data.counties.length, data.districts.length,
    data.mixedDistricts.length, data.fptpDistricts.length],
  [16, 380, 41, 230, 460]
);
assert.deepStrictEqual(
  [geometry.provinces.features.length, geometry.counties.features.length,
    geometry.municipalities.features.length],
  [16, 380, 2477]
);
assert.deepStrictEqual(
  [geometry.sejmDistricts.features.length,
    geometry.mixedConstituencies.features.length,
    geometry.fptpConstituencies.features.length],
  [41, 230, 460]
);
assert.strictEqual(total(Object.fromEntries(data.districts.map(function(row) {
  return [row.id, row.magnitude];
}))), 460);
assert.strictEqual(data.mixedDistricts.filter(function(row) {
  return row.pool === 'urban';
}).length, 138);
assert.strictEqual(data.mixedDistricts.filter(function(row) {
  return row.pool === 'rural';
}).length, 92);
assert.strictEqual(data.fptpDistricts.filter(function(row) {
  return row.pool === 'urban';
}).length, 276);
assert.strictEqual(data.fptpDistricts.filter(function(row) {
  return row.pool === 'rural';
}).length, 184);
data.mixedDistricts.concat(data.fptpDistricts).forEach(function(row) {
  assert(row.contiguous, row.id + ' is not contiguous');
  assert(data.provinces.some(function(province) {
    return province.id === row.provinceId;
  }), row.id + ' crosses or lacks a province');
  assert(Number.isFinite(row.electorateDeviationPct), row.id + ' lacks deviation data');
});
geometry.counties.features.forEach(function(feature) {
  assert.strictEqual(feature.properties.province, feature.properties.id.slice(0, 2));
});
geometry.municipalities.features.forEach(function(feature) {
  assert.strictEqual(feature.properties.province, feature.properties.id.slice(0, 2));
  assert.strictEqual(feature.properties.county, feature.properties.id.slice(0, 4));
  assert(feature.properties.district >= 1 && feature.properties.district <= 41);
});
geometry.units.features.forEach(function(feature) {
  assert(data.provinces.some(function(province) {
    return province.id === feature.properties.province;
  }));
  assert(feature.properties.mixed && feature.properties.fptp);
});

const officialSeats = {};
data.archive2019.districts.forEach(function(row) {
  Object.keys(row.seats).forEach(function(id) {
    officialSeats[id] = (officialSeats[id] || 0) + row.seats[id];
  });
});
assert.deepStrictEqual(officialSeats, {
  left: 49, ko: 134, pis: 235, psl: 30, konf: 11, minority: 1,
});

const votes = {left: 13, pis: 35, ko: 31, psl: 8, p2050: 6, konf: 7, other: 4};
for (const system of ['proportional', 'mixed_230', 'fptp_460']) {
  const result = allocation(model, state, system, votes);
  assert.strictEqual(total(result.partySeats), 460, system + ' did not allocate 460 MPs');
  assert.strictEqual(total(result.committeeSeats), 460);
  const provinceSeats = {};
  result.provinceResults.forEach(function(row) {
    Object.keys(row.seats).forEach(function(id) {
      provinceSeats[id] = (provinceSeats[id] || 0) + row.seats[id];
    });
  });
  assert.deepStrictEqual(provinceSeats, result.committeeSeats);
  const voteRows = system === 'fptp_460'
    ? result.districtResults : result.listDistrictResults;
  const aggregateVotes = {};
  voteRows.forEach(function(row) {
    Object.keys(row.voteCounts).forEach(function(id) {
      aggregateVotes[id] = (aggregateVotes[id] || 0) + row.voteCounts[id];
    });
  });
  const aggregateTotal = total(aggregateVotes);
  const nationalTotal = total(votes);
  Object.keys(votes).forEach(function(id) {
    assert(Math.abs(
      aggregateVotes[id] / aggregateTotal - votes[id] / nationalTotal
    ) < 0.00001, system + ' changed national vote totals for ' + id);
  });
  assert.deepStrictEqual(
    result,
    allocation(model, state, system, votes),
    system + ' is not deterministic'
  );
}

const unqualified = allocation(model, state, 'proportional', {
  left: 4.9, pis: 42, ko: 38, psl: 5.1, konf: 5, other: 5,
});
assert.strictEqual(unqualified.partySeats.left, 0, 'threshold was applied regionally');

const provinceId = '14';
const tourShare = function(visits) {
  const log = Array.from({length: visits}, function() {
    return {issue: 'tour-only-test', provinceId: provinceId};
  });
  return allocation(model, state, 'proportional', votes, log)
    .provinceResults.find(function(row) { return row.id === provinceId; }).votes.left;
};
const tourShares = [0, 1, 2, 3].map(tourShare);
assert(tourShares[1] > tourShares[0]);
assert(tourShares[2] - tourShares[1] < tourShares[1] - tourShares[0]);
assert(tourShares[3] - tourShares[2] < tourShares[2] - tourShares[1]);

const issueResult = allocation(model, state, 'proportional', votes, [
  {issue: 'equality', provinceId: ''},
]);
const baseResult = allocation(model, state, 'proportional', votes);
const issueMoves = issueResult.districtResults.map(function(row, index) {
  return row.votes.left - baseResult.districtResults[index].votes.left;
});
assert(Math.max.apply(Math, issueMoves) > 0 && Math.min.apply(Math, issueMoves) < 0,
  'issue affinity did not redistribute support');

const forecastOptions = {
  state: state,
  system: 'mixed_230',
  partyIds: Object.keys(votes),
  committeeFor: {},
  componentVotes: votes,
  committeeVotes: votes,
  qualifiedCommittees: Object.keys(votes).filter(function(id) {
    return id !== 'other' && votes[id] >= 5;
  }),
  negotiatedShares: {},
  seed: 'stable-election-map-check',
};
assert.deepStrictEqual(model.forecastSejm(forecastOptions), model.forecastSejm(forecastOptions));

const certified = allocation(model, state, 'proportional', votes);
const snapshot = model.archiveSejm(state, certified, '2023-10', 'Test election');
assert.strictEqual(state.poland_election_map_archive.slice(-1)[0].key, '2023-10');
assert.strictEqual(state.poland_election_geographic_prior.system, snapshot.system);
const later = allocation(model, state, 'proportional', votes);
assert.deepStrictEqual(later, allocation(model, state, 'proportional', votes));

const president = model.allocatePresident({
  key: 'president-check', round: 1,
  candidates: [
    {id: 'candidate-left', name: 'Left', family: 'left', share: 34},
    {id: 'candidate-right', name: 'Right', family: 'pis', share: 38},
    {id: 'candidate-centre', name: 'Centre', family: 'ko', share: 28},
  ],
});
assert.strictEqual(president.counties.length, 380);
const presidentialTotals = {};
president.counties.forEach(function(row) {
  Object.keys(row.voteCounts).forEach(function(id) {
    presidentialTotals[id] = (presidentialTotals[id] || 0) + row.voteCounts[id];
  });
});
const presidentialTotal = total(presidentialTotals);
assert(Math.abs(presidentialTotals['candidate-left'] / presidentialTotal - 0.34) < 0.00001);
assert(Math.abs(presidentialTotals['candidate-right'] / presidentialTotal - 0.38) < 0.00001);
model.archivePresident(state, president);
assert.strictEqual(state.poland_presidential_map_archive.slice(-1)[0].key, 'president-check');

console.log('Election map check passed.');
