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
const budgetOnly = argv.includes('--budget-only');

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

for (let i = 0; i < (budgetOnly ? 0 : runs); i += 1) {
  const run = runOne(seedPrefix + '-' + i);
  if (!run.ok) {
    failures += 1;
    failureReasons[run.reason] = (failureReasons[run.reason] || 0) + 1;
    continue;
  }
  results.push(run);
}

if (!budgetOnly && !results.length) {
  fail('All runs failed. Failure reasons: ' + JSON.stringify(failureReasons));
}

if (!budgetOnly) {
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
}

// Four enacted budgets in one cabinet, with the prior frame, debt and fiscal
// stress carried forward. The responsive cohort treats the published deficit
// ceiling as a constraint; the random cohort shows what happens when it does
// not. Together they expose both an ineffective brake and faction red lines
// that fire regardless of player choices.
const budgetPackages = [
  'poland_budget_2023_2026.government_social_protocol',
  'poland_budget_2023_2026.government_rural_compact',
  'poland_budget_2023_2026.government_minimum',
  'poland_budget_2023_2026.government_dare',
];
const budgetPackageDeficitDelta = {
  'poland_budget_2023_2026.government_social_protocol': 1.0,
  'poland_budget_2023_2026.government_rural_compact': 0.7,
  'poland_budget_2023_2026.government_minimum': 0.2,
  'poland_budget_2023_2026.government_dare': -1.2,
};
const budgetFinancing = [
  'poland_budget_2023_2026.finance_progressive_revenue',
  'poland_budget_2023_2026.finance_kpo_cofinance',
  'poland_budget_2023_2026.finance_borrowing',
  'poland_budget_2023_2026.finance_spending_restraint',
];

function runBudgetTrajectory(seed, responsive) {
  const engine = makeEngine();
  const rng = makeRng(seed);
  engine.beginGame([seed]);
  if (!chooseById(engine, 'root.campaign_game') ||
      !chooseById(engine, 'root.standard')) {
    return { ok: false, reason: 'budget-start-failed' };
  }
  const q = engine.state.qualities;
  q.left_in_government = 1;
  q.government_party = 'lewica';
  q.prime_minister_party = 'lewica';
  q.finance_minister_party = 'Lewica';
  q.government_has_confidence = 1;
  q.caretaker_government = 0;
  q.left_seats = 30;
  q.ministry_left_cabinet_seats = 30;
  q.kpo_uncommitted = 4;
  q.razem_in_government = 1;
  q.razem_budget_support_pact = 1;
  q.razem_breakaway_protected = 0;
  q.party_unity = 45 + Math.round(rng() * 40);
  q.public_debt = 48.5 + Math.round(rng() * 25) / 10;
  q.fiscal_stress = 6 + Math.round(rng() * 80) / 10;

  const years = [];
  let razemBroke = false;
  for (let year = 2023; year <= 2026; year += 1) {
    q.year = year;
    q.month = 12;
    q.annual_budget_year = year;
    q.inflation = 2.5 + Math.round(rng() * 45) / 10;
    engine.goToScene('poland_budget_2023_2026.annual_budget');
    q.coalition_seats = 250;
    q.ministry_left_cabinet_seats = 30;

    let packageId = budgetPackages[Math.floor(rng() * budgetPackages.length)];
    if (responsive) {
      const ceiling = toNum(q.annual_budget_deficit_ceiling, 5.6);
      const draftDeficit = toNum(q.annual_budget_draft_deficit_share, 5.1);
      const viablePackages = budgetPackages.filter(function(id) {
        return draftDeficit + budgetPackageDeficitDelta[id] - 1.2 <= ceiling;
      });
      const packagePool = viablePackages.length ? viablePackages : [
        'poland_budget_2023_2026.government_dare',
      ];
      packageId = packagePool[Math.floor(rng() * packagePool.length)];
    }
    if (!chooseById(engine, packageId)) {
      return { ok: false, reason: 'budget-package-failed', scene: engine.state.sceneId };
    }

    let financeId = budgetFinancing[Math.floor(rng() * budgetFinancing.length)];
    if (responsive) {
      const ceiling = toNum(q.annual_budget_deficit_ceiling, 5.6);
      const deficit = toNum(q.annual_budget_deficit_share, 5.1);
      if (deficit - 1.2 > ceiling) {
        financeId = 'poland_budget_2023_2026.finance_spending_restraint';
      } else if (deficit > ceiling) {
        financeId = 'poland_budget_2023_2026.finance_progressive_revenue';
      } else {
        const safeFinancing = budgetFinancing.filter(function(id) {
          if (id.endsWith('finance_borrowing')) return deficit + 0.8 <= ceiling;
          return true;
        });
        financeId = safeFinancing[Math.floor(rng() * safeFinancing.length)];
      }
    }
    if (!chooseById(engine, financeId)) {
      financeId = 'poland_budget_2023_2026.finance_progressive_revenue';
      if (!chooseById(engine, financeId)) {
        return { ok: false, reason: 'budget-finance-failed', scene: engine.state.sceneId };
      }
    }

    const internalRazem = toNum(q.annual_budget_razem_backing, 100);
    const internalVetoes = toNum(q.annual_budget_internal_vetoes, 0);
    q.annual_budget_passed = 1;
    q.annual_budget_senate_stage_done = 1;
    engine.goToScene('poland_budget_2023_2026.budget_enact');
    razemBroke = razemBroke || !!q.razem_red_line_broken;
    years.push({
      year,
      packageId,
      financeId,
      social: toNum(q.annual_budget_enacted_social_share, 0),
      socialFloor: toNum(q.annual_budget_social_floor, 0),
      deficit: toNum(q.annual_budget_enacted_deficit_share, 0),
      ceiling: toNum(q.annual_budget_deficit_ceiling, 0),
      deficitBreach: toNum(q.annual_budget_deficit_breach, 0),
      internalRazem,
      finalRazem: toNum(q.annual_budget_razem_final_backing, 100),
      internalVetoes,
      marketCuts: !!q.annual_budget_market_cuts,
      debt: toNum(q.public_debt, 0),
      fiscalStress: toNum(q.fiscal_stress, 0),
    });
  }
  return { ok: true, responsive, years, razemBroke };
}

function reportBudgetCohort(label, trajectories) {
  console.log('');
  console.log(label + ' budget trajectories (2023->2026)');
  for (let year = 2023; year <= 2026; year += 1) {
    const rows = trajectories.map(function(run) { return run.years[year - 2023]; });
    const mean = function(key) {
      return rows.reduce(function(sum, row) { return sum + row[key]; }, 0) / rows.length;
    };
    const breaches = rows.filter(function(row) { return row.deficitBreach > 0; }).length;
    const vetoes = rows.filter(function(row) { return row.internalVetoes > 0; }).length;
    const razemRed = rows.filter(function(row) {
      return row.internalRazem < 30 || row.finalRazem < 30;
    }).length;
    const marketCuts = rows.filter(function(row) { return row.marketCuts; });
    const noMarketCuts = rows.filter(function(row) { return !row.marketCuts; });
    const underThirty = function(row) {
      return row.internalRazem < 30 || row.finalRazem < 30;
    };
    console.log(
      year + ': social ' + mean('social').toFixed(2) +
      ' (floor ' + mean('socialFloor').toFixed(2) + ')' +
      ' · deficit ' + mean('deficit').toFixed(2) +
      ' / ceiling ' + mean('ceiling').toFixed(2) +
      ' · ceiling breaches ' + (breaches / rows.length * 100).toFixed(1) + '%' +
      ' · any faction veto ' + (vetoes / rows.length * 100).toFixed(1) + '%' +
      ' · Razem under 30 ' + (razemRed / rows.length * 100).toFixed(1) + '%' +
      ' (cuts ' +
      (marketCuts.filter(underThirty).length / Math.max(1, marketCuts.length) * 100).toFixed(0) +
      '%, no cuts ' +
      (noMarketCuts.filter(underThirty).length / Math.max(1, noMarketCuts.length) * 100).toFixed(0) + '%)'
    );
  }
  const socialGrowth = trajectories.map(function(run) {
    return run.years[3].social - run.years[0].social;
  });
  const meanGrowth = socialGrowth.reduce(function(sum, value) {
    return sum + value;
  }, 0) / socialGrowth.length;
  const razemBreaks = trajectories.filter(function(run) { return run.razemBroke; }).length;
  console.log(
    'Mean 2023->2026 social ratchet: +' + meanGrowth.toFixed(2) +
    ' points · Razem breakaway in ' +
    (razemBreaks / trajectories.length * 100).toFixed(1) + '% of cabinets'
  );
}

const budgetRuns = [];
const responsiveBudgetRuns = [];
for (let i = 0; i < runs; i += 1) {
  const randomRun = runBudgetTrajectory(seedPrefix + '-budget-random-' + i, false);
  const responsiveRun = runBudgetTrajectory(seedPrefix + '-budget-responsive-' + i, true);
  if (randomRun.ok) budgetRuns.push(randomRun);
  if (responsiveRun.ok) responsiveBudgetRuns.push(responsiveRun);
}
if (!budgetRuns.length || !responsiveBudgetRuns.length) {
  fail('All multi-year budget trajectories failed.');
}
reportBudgetCohort('Random-choice', budgetRuns);
reportBudgetCohort('Ceiling-responsive', responsiveBudgetRuns);
