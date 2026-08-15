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
assert.strictEqual(model.version, 5);
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
data.counties.concat(data.districts, data.mixedDistricts, data.fptpDistricts)
  .forEach(function(row) {
    assert(Number.isFinite(row.urbanScore) && row.urbanScore >= 0 &&
      row.urbanScore <= 1, row.id + ' lacks a valid urbanScore');
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

function aggregateShare(result, id, predicate) {
  const rows = result.districtResults.filter(predicate);
  const partyVotes = rows.reduce(function(sum, row) {
    return sum + Number(row.voteCounts[id] || 0);
  }, 0);
  const allVotes = rows.reduce(function(sum, row) {
    return sum + total(row.voteCounts);
  }, 0);
  return partyVotes / allVotes;
}

const cleanState = JSON.parse(JSON.stringify(state));
cleanState.regional_effect_log = [];
cleanState.poland_election_geographic_prior = null;
const proportionalCleanBase = allocation(
  model, cleanState, 'proportional', votes
);
const mixedBase = allocation(model, cleanState, 'mixed_230', votes);
const ruralState = JSON.parse(JSON.stringify(cleanState));
ruralState.rural_support = 25;
ruralState.local_network = 62;
const mixedRural = allocation(model, ruralState, 'mixed_230', votes);
assert(aggregateShare(mixedRural, 'left', function(row) {
  return row.urbanScore < 0.5;
}) > aggregateShare(mixedBase, 'left', function(row) {
  return row.urbanScore < 0.5;
}), 'rural service gains did not move Left support outside cities');

const eastState = JSON.parse(JSON.stringify(cleanState));
Object.assign(eastState, {
  border_security_support: 80,
  refugee_solidarity_support: 30,
  border_security_salience: 80,
  refugee_solidarity_salience: 30,
});
const eastResult = allocation(model, eastState, 'proportional', votes);
const eastIds = ['06', '18', '20', '28'];
for (const id of ['konf', 'pis']) {
  assert(aggregateShare(eastResult, id, function(row) {
    return eastIds.includes(row.provinceId);
  }) > aggregateShare(proportionalCleanBase, id, function(row) {
    return eastIds.includes(row.provinceId);
  }), 'anti-migrant dominance did not move ' + id + ' eastward');
}
const koronaVotes = Object.assign({}, votes, {korona: votes.konf});
delete koronaVotes.konf;
const koronaBase = allocation(model, cleanState, 'proportional', koronaVotes);
const koronaEast = allocation(model, eastState, 'proportional', koronaVotes);
assert(aggregateShare(koronaEast, 'korona', function(row) {
  return eastIds.includes(row.provinceId);
}) > aggregateShare(koronaBase, 'korona', function(row) {
  return eastIds.includes(row.provinceId);
}), 'anti-migrant dominance did not move Korona eastward');

const selectorState = JSON.parse(JSON.stringify(cleanState));
for (const effect of [
  ['warsaw-check', '1465'], ['wroclaw-check', '0264'],
  ['krakow-check', '1261'],
]) {
  assert(model.recordRegionalEffect(selectorState, {
    key: effect[0], families: {left: 0.15}, countyIds: [effect[1]],
  }));
  assert(!model.recordRegionalEffect(selectorState, {
    key: effect[0], families: {left: 0.15}, countyIds: [effect[1]],
  }), 'regional effect key was not deduplicated');
}
const selectorBase = allocation(model, cleanState, 'fptp_460', votes);
const selectorResult = allocation(model, selectorState, 'fptp_460', votes);
for (const countyId of ['1465', '0264', '1261']) {
  const targets = selectorResult.districtResults.filter(function(row) {
    return row.countyIds.includes(countyId);
  });
  assert(targets.length, 'missing selector rows for ' + countyId);
  assert(targets.every(function(row) {
    const base = selectorBase.districtResults.find(function(candidate) {
      return candidate.id === row.id;
    });
    return row.votes.left > base.votes.left;
  }), countyId + ' effect missed its selected rows');
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

const archiveState = JSON.parse(JSON.stringify(cleanState));
model.recordRegionalEffect(archiveState, {
  key: 'archive-once', families: {left: 0.15}, countyIds: ['1465'],
});
const firstEffect = allocation(model, archiveState, 'proportional', votes);
model.archiveSejm(archiveState, firstEffect, 'effect-archive', 'Effect archive');
const reusedEffect = allocation(model, archiveState, 'proportional', votes);
const firstWarsaw = firstEffect.districtResults.find(function(row) {
  return row.countyIds.includes('1465');
});
const reusedWarsaw = reusedEffect.districtResults.find(function(row) {
  return row.id === firstWarsaw.id;
});
assert(Math.abs(firstWarsaw.votes.left - reusedWarsaw.votes.left) < 0.00001,
  'archived regional effect was applied twice');

const p2050ArchiveState = JSON.parse(JSON.stringify(cleanState));
model.recordRegionalEffect(p2050ArchiveState, {
  key: 'p2050-warsaw-once', families: {p2050: 0.15}, countyIds: ['1465'],
});
const p2050First = allocation(model, p2050ArchiveState, 'proportional', votes);
model.archiveSejm(p2050ArchiveState, p2050First,
  'p2050-effect-archive', 'Poland 2050 effect archive');
const p2050Reused = allocation(model, p2050ArchiveState, 'proportional', votes);
const p2050Warsaw = p2050First.districtResults.find(function(row) {
  return row.countyIds.includes('1465');
});
const p2050WarsawReused = p2050Reused.districtResults.find(function(row) {
  return row.id === p2050Warsaw.id;
});
assert(Math.abs(p2050Warsaw.votes.p2050 - p2050WarsawReused.votes.p2050) <
  0.00001, 'archived Poland 2050 effect was lost or compounded');

const president = model.allocatePresident({
  state: selectorState,
  key: 'president-check', round: 1,
  candidates: [
    {id: 'candidate-left', name: 'Left', family: 'left', share: 34},
    {id: 'candidate-right', name: 'Right', family: 'pis', share: 38},
    {id: 'candidate-centre', name: 'Centre', family: 'ko', share: 28},
  ],
});
assert.strictEqual(president.counties.length, 380);
president.counties.forEach(function(row) {
  assert(Number.isFinite(row.urbanScore) && row.urbanScore >= 0 &&
    row.urbanScore <= 1, row.id + ' presidential row lacks urbanScore');
});
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
