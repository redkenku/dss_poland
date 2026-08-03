'use strict';

const fs = require('fs');
const path = require('path');

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: undefined,
});

const dendry = require('dendrynexus/lib/engine');

const projectRoot = path.resolve(__dirname, '..');
const compiledPath = path.join(projectRoot, 'out', 'game.json');

const argv = process.argv.slice(2);
const runsArg = Number(argv[0]);
const runs = Number.isFinite(runsArg) && runsArg > 0 ? Math.floor(runsArg) : 500;
const seedPrefix = argv[1] || 'mc-balance';

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(compiledPath)) {
  fail('Missing out/game.json. Run `npm run build` first.');
}

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

const game = convertGame(fs.readFileSync(compiledPath, 'utf8'));

function makeEngine() {
  return new dendry.DendryEngine(new dendry.UserInterface(), game);
}

function currentChoices(engine) {
  return (engine.getCurrentChoices() || []).filter(function(choice) {
    return !!choice.canChoose;
  });
}

function chooseById(engine, id) {
  const allChoices = engine.getCurrentChoices() || [];
  const choices = allChoices.filter(function(choice) {
    return !!choice.canChoose;
  });
  const idx = choices.findIndex(function(choice) {
    return choice.id === id;
  });
  if (idx < 0) return false;
  const fullIdx = allChoices.findIndex(function(choice) {
    return choice.id === id;
  });
  if (fullIdx < 0 || !allChoices[fullIdx].canChoose) return false;
  engine.choose(fullIdx);
  return true;
}

function chooseDeterministic(engine, preferred) {
  const allChoices = engine.getCurrentChoices() || [];
  const choices = allChoices.filter(function(choice) {
    return !!choice.canChoose;
  });
  if (!choices.length) return false;
  for (const id of preferred) {
    const idx = allChoices.findIndex(function(choice) {
      return choice.id === id;
    });
    if (idx >= 0 && allChoices[idx].canChoose) {
      engine.choose(idx);
      return true;
    }
  }
  const firstAvailable = allChoices.findIndex(function(choice) {
    return !!choice.canChoose;
  });
  if (firstAvailable < 0) return false;
  engine.choose(firstAvailable);
  return true;
}

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed) {
  let state = hashSeed(seed) || 1;
  return function() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pickRandomIndex(indexes, rng) {
  if (!indexes.length) return -1;
  return indexes[Math.floor(rng() * indexes.length)];
}

function startCampaign(engine, seed) {
  engine.beginGame([seed]);
  if (!chooseById(engine, 'root.campaign_game')) {
    if (!chooseById(engine, 'root.new_game')) {
      return false;
    }
  }
  if (!chooseById(engine, 'root.standard')) {
    return false;
  }
  return chooseById(engine, 'poland_hub');
}

function toNum(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function runOne(seed) {
  const engine = makeEngine();
  const rng = makeRng(seed);
  if (!startCampaign(engine, seed)) {
    return { ok: false, reason: 'start-failed' };
  }

  const preferred = [
    'poland_advance',
    'poland_event_queue',
    'poland_hub',
    'poland_polling',
    'poland_card_finish',
  ];

  let steps = 0;
  while (steps < 9000) {
    steps += 1;
    const q = engine.state.qualities || {};
    const year = toNum(q.year, 2019);
    const month = toNum(q.month, 1);

    if (year > 2023 || (year === 2023 && month >= 10)) {
      break;
    }

    const allChoices = engine.getCurrentChoices() || [];
    const available = allChoices
      .map(function(choice, idx) {
        return { choice, idx };
      })
      .filter(function(entry) {
        return !!entry.choice.canChoose;
      });

    if (!available.length) {
      return { ok: false, reason: 'no-choices', scene: engine.state.sceneId };
    }

    const sceneId = String(engine.state.sceneId || '');
    let picked = -1;

    if (sceneId === 'poland_hub') {
      const cardIndexes = available
        .filter(function(entry) {
          return !!(game.scenes[entry.choice.id] && game.scenes[entry.choice.id].isCard);
        })
        .map(function(entry) {
          return entry.idx;
        });
      const advanceEntry = available.find(function(entry) {
        return entry.choice.id === 'poland_advance';
      });
      const monthActions = toNum(q.month_actions, 0);
      const maxMonthActions = toNum(q.max_month_actions, 0);
      const shouldPlayCard = cardIndexes.length > 0 && (
        !advanceEntry || monthActions < maxMonthActions || rng() < 0.70
      );
      if (shouldPlayCard) {
        picked = pickRandomIndex(cardIndexes, rng);
      } else if (advanceEntry) {
        picked = advanceEntry.idx;
      }
    } else {
      const preferredEntry = preferred.map(function(id) {
        return available.find(function(entry) {
          return entry.choice.id === id;
        });
      }).find(Boolean);
      if (preferredEntry && rng() < 0.75) {
        picked = preferredEntry.idx;
      }
    }

    if (picked < 0) {
      picked = pickRandomIndex(available.map(function(entry) {
        return entry.idx;
      }), rng);
    }

    if (picked < 0) {
      return { ok: false, reason: 'stuck', scene: engine.state.sceneId };
    }
    engine.choose(picked);
  }

  if (steps >= 9000) {
    return { ok: false, reason: 'step-limit' };
  }

  const qualities = engine.state.qualities || {};
  qualities.election_2023_certified = 0;
  qualities.senate_election_2023_certified = 0;
  engine.goToScene('poland_government_formation.campaign_entry');

  const left = toNum(qualities.election_2023_left_vote, toNum(qualities.left_vote_intent, 0));
  const konf = toNum(qualities.election_2023_konf_vote, toNum(qualities.konf_vote_intent, 0));
  const twJoint = toNum(qualities.election_2023_third_way_vote, 0);
  const p2050 = toNum(qualities.election_2023_p2050_vote, toNum(qualities.p2050_vote_intent, 0));
  const psl = toNum(qualities.election_2023_psl_vote, toNum(qualities.psl_vote_intent, 0));
  const thirdWayComparable = qualities.third_way_split ? Math.max(p2050, psl) : twJoint;

  const pis = toNum(qualities.election_2023_pis_vote, toNum(qualities.pis_vote_intent, 0));
  const ko = toNum(qualities.election_2023_ko_vote, toNum(qualities.ko_vote_intent, 0));

  const ranking = [
    { key: 'pis', vote: pis },
    { key: 'ko', vote: ko },
    { key: 'left', vote: left },
    { key: 'konf', vote: konf },
    { key: 'third_way', vote: thirdWayComparable },
  ].sort(function(a, b) {
    return b.vote - a.vote;
  });
  const leftRank = ranking.findIndex(function(p) {
    return p.key === 'left';
  }) + 1;

  return {
    ok: true,
    left,
    konf,
    thirdWayComparable,
    leftRank,
    leftInBand: left >= 8 && left <= 12,
    beatenByKonf: konf > left,
    beatenByThirdWay: thirdWayComparable > left,
  };
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

const results = [];
let failures = 0;
const failureReasons = {};

for (let i = 0; i < runs; i += 1) {
  const run = runOne(seedPrefix + '-' + i);
  if (!run.ok) {
    failures += 1;
    failureReasons[run.reason] = (failureReasons[run.reason] || 0) + 1;
    continue;
  }
  results.push(run);
}

if (!results.length) {
  fail('All runs failed. Failure reasons: ' + JSON.stringify(failureReasons));
}

const leftVotes = results.map(function(r) { return r.left; }).sort(function(a, b) { return a - b; });
const konfVotes = results.map(function(r) { return r.konf; }).sort(function(a, b) { return a - b; });
const thirdWayVotes = results.map(function(r) { return r.thirdWayComparable; }).sort(function(a, b) { return a - b; });
const meanLeft = leftVotes.reduce(function(sum, n) { return sum + n; }, 0) / leftVotes.length;
const meanKonf = konfVotes.reduce(function(sum, n) { return sum + n; }, 0) / konfVotes.length;
const meanThirdWay = thirdWayVotes.reduce(function(sum, n) { return sum + n; }, 0) / thirdWayVotes.length;
const inBand = results.filter(function(r) { return r.leftInBand; }).length;
const leftTop2 = results.filter(function(r) { return r.leftRank <= 2; }).length;
const leftAtLeast3rd = results.filter(function(r) { return r.leftRank <= 3; }).length;
const beatenByKonf = results.filter(function(r) { return r.beatenByKonf; }).length;
const beatenByThirdWay = results.filter(function(r) { return r.beatenByThirdWay; }).length;
const beatenByEither = results.filter(function(r) {
  return r.beatenByKonf || r.beatenByThirdWay;
}).length;

console.log('Monte Carlo balance report (2019->2023)');
console.log('Runs requested: ' + runs);
console.log('Runs completed: ' + results.length);
console.log('Runs failed: ' + failures + (failures ? ' ' + JSON.stringify(failureReasons) : ''));
console.log('');
console.log('Lewica 2023 vote %');
console.log('mean: ' + meanLeft.toFixed(2));
console.log('p10:  ' + percentile(leftVotes, 0.10).toFixed(2));
console.log('p25:  ' + percentile(leftVotes, 0.25).toFixed(2));
console.log('p50:  ' + percentile(leftVotes, 0.50).toFixed(2));
console.log('p75:  ' + percentile(leftVotes, 0.75).toFixed(2));
console.log('p90:  ' + percentile(leftVotes, 0.90).toFixed(2));
console.log('');
console.log('Konfederacja 2023 vote %');
console.log('mean: ' + meanKonf.toFixed(2));
console.log('p10:  ' + percentile(konfVotes, 0.10).toFixed(2));
console.log('p50:  ' + percentile(konfVotes, 0.50).toFixed(2));
console.log('p90:  ' + percentile(konfVotes, 0.90).toFixed(2));
console.log('');
console.log('Third Way comparable 2023 vote %');
console.log('mean: ' + meanThirdWay.toFixed(2));
console.log('p10:  ' + percentile(thirdWayVotes, 0.10).toFixed(2));
console.log('p50:  ' + percentile(thirdWayVotes, 0.50).toFixed(2));
console.log('p90:  ' + percentile(thirdWayVotes, 0.90).toFixed(2));
console.log('');
console.log('Historical 2023 Sejm comparison');
console.log('Left delta vs 8.61:      ' + (meanLeft - 8.61).toFixed(2));
console.log('Konf delta vs 7.16:      ' + (meanKonf - 7.16).toFixed(2));
console.log('ThirdWay delta vs 14.40: ' + (meanThirdWay - 14.40).toFixed(2));
console.log('');
console.log('Target metrics');
console.log('Lewica in 8-12% band: ' + ((inBand / results.length) * 100).toFixed(1) + '%');
console.log('Lewica top-2:          ' + ((leftTop2 / results.length) * 100).toFixed(1) + '%');
console.log('Lewica top-3:          ' + ((leftAtLeast3rd / results.length) * 100).toFixed(1) + '%');
console.log('Outpolled by Konf.:    ' + ((beatenByKonf / results.length) * 100).toFixed(1) + '%');
console.log('Outpolled by ThirdWay: ' + ((beatenByThirdWay / results.length) * 100).toFixed(1) + '%');
console.log('Outpolled by either:   ' + ((beatenByEither / results.length) * 100).toFixed(1) + '%');
