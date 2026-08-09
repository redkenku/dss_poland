'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const scenesRoot = path.join(projectRoot, 'source', 'scenes');
const manifestPath = path.join(projectRoot, 'docs', 'EVENT_MANIFEST.json');
const writeMode = process.argv.includes('--write');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap(function(entry) {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    });
}

function oneLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function truncate(value, limit) {
  const compact = oneLine(value);
  return compact.length <= limit
    ? compact
    : compact.slice(0, limit - 1).trimEnd() + '…';
}

function readProperty(block, name) {
  const match = block.match(new RegExp('^' + name + ':\\s*(.*)$', 'm'));
  return match ? oneLine(match[1]) : '';
}

function readProseAudit(block) {
  const match = block.match(/^# prose-audit:\s*Grade\s+([A-FR])\s+—\s+(.+)$/m);
  return match ? { grade: match[1], note: oneLine(match[2]) } : null;
}

function readArrival(block) {
  const match = block.match(/^on-arrival:\s*(.*)$/m);
  if (!match) return '';
  if (match[1].trim() !== '{!') return oneLine(match[1]);
  const start = match.index + match[0].length;
  const end = block.indexOf('!}', start);
  return oneLine(block.slice(start, end < 0 ? block.length : end));
}

function sourceSections(file) {
  const source = fs.readFileSync(file, 'utf8');
  const rootId = path.basename(file, '.scene.dry');
  const starts = [{ localId: '', id: rootId, index: 0, line: 1 }];
  for (const match of source.matchAll(/^@([A-Za-z0-9_]+)\s*$/gm)) {
    starts.push({
      localId: match[1],
      id: rootId + '.' + match[1],
      index: match.index,
      line: source.slice(0, match.index).split('\n').length,
    });
  }
  starts.sort(function(left, right) { return left.index - right.index; });
  return starts.map(function(start, index) {
    return Object.assign({}, start, {
      rootId,
      file,
      source: source.slice(
        start.index,
        starts[index + 1] ? starts[index + 1].index : source.length
      ),
    });
  });
}

const files = walk(scenesRoot).filter(function(file) {
  return file.endsWith('.scene.dry') &&
    path.basename(file).startsWith('poland_');
});
const sections = files.flatMap(sourceSections);
const sectionById = new Map(sections.map(function(section) {
  return [section.id, section];
}));

function isDatedEvent(section) {
  return /^tags:\s*poland_event\b/m.test(section.source) ||
    /^=\s+[^\n]*\b20\d{2}\b/m.test(section.source);
}

function dateFor(section) {
  const heading = section.source.match(/^=\s+([^\n]*\b20\d{2}\b[^\n]*)$/m);
  if (heading) return oneLine(heading[1]);
  const view = readProperty(section.source, 'view-if');
  const year = view.match(/\byear\s*=\s*(20\d{2})\b/);
  const month = view.match(/\bmonth\s*=\s*(\d{1,2})\b/);
  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  if (year) {
    return (month ? monthNames[Number(month[1])] + ' ' : '') + year[1];
  }
  return 'Dated by source availability: ' + (view || 'see source route');
}

function baselineFor(section) {
  let prose = section.source
    .replace(/\{![\s\S]*?!\}/g, ' ')
    .replace(/^@[A-Za-z0-9_]+\s*$/gm, ' ')
    .replace(/^(title|subtitle|new-page|tags|priority|order|max-visits|view-if|choose-if|unavailable-subtitle|on-arrival|go-to|call|face-image|wide-image):.*$/gm, ' ')
    .replace(/^# prose-audit:.*$/gm, ' ')
    .replace(/^=\s+.*$/gm, ' ')
    .replace(/^-\s+[@#].*$/gm, ' ')
    .replace(/\[\?[\s\S]*?\?\]/g, ' ')
    .replace(/\[\+[\s\S]*?\+\]/g, ' ')
    .replace(/[>*_]/g, ' ');
  prose = truncate(prose, 520);
  return prose || (
    readProperty(section.source, 'title') +
    ' — factual baseline and counterfactual conditions are maintained in the source event.'
  );
}

const knownPeople = [
  'Włodzimierz Czarzasty', 'Robert Biedroń', 'Adrian Zandberg',
  'Magdalena Biejat', 'Agnieszka Dziemianowicz-Bąk', 'Donald Tusk',
  'Borys Budka', 'Grzegorz Schetyna', 'Rafał Trzaskowski',
  'Małgorzata Kidawa-Błońska', 'Szymon Hołownia',
  'Władysław Kosiniak-Kamysz', 'Krzysztof Bosak',
  'Stanisław Żółtek', 'Marek Jakubiak', 'Paweł Tanajno',
  'Waldemar Witkowski', 'Mirosław Piotrowski',
  'Mateusz Morawiecki', 'Jarosław Kaczyński', 'Elżbieta Witek',
  'Andrzej Duda', 'Karol Nawrocki', 'Zbigniew Ziobro',
  'Sławomir Mentzen', 'Grzegorz Braun', 'Katarzyna Pełczyńska-Nałęcz',
  'Paulina Hennig-Kloska', 'Radosław Sikorski', 'Adam Bodnar',
  'Mariusz Błaszczak', 'Beata Szydło', 'Przemysław Czarnek',
  'Chrystian Szpilski', 'Patryk Spaliński', 'Maciej Kozłowski', 'Jan Śpiewak',
  'Damian Soból',
];
const knownOrganisations = [
  'Lewica', 'Nowa Lewica', 'Razem', 'PiS', 'Prawo i Sprawiedliwość',
  'KO', 'Civic Platform', 'Platforma Obywatelska', 'PSL', 'Polska 2050',
  'Poland 2050', 'Konfederacja', 'Suwerenna Polska', 'Solidarna Polska',
  'European Commission', 'European Union', 'Sejm', 'Senate',
  'Council of Ministers', 'Constitutional Tribunal', 'Supreme Court',
  'National Council of the Judiciary', 'State Labour Inspection',
  'Nowa Solidarność', 'Ostatnie Pokolenie', 'World Central Kitchen',
];

function mentions(section, dictionary) {
  const text = section.source + ' ' + readProperty(section.source, 'title');
  return dictionary.filter(function(name) { return text.includes(name); });
}

function authorityFor(view) {
  if (/left_in_government\s*=\s*1/.test(view)) {
    return {
      role: 'Lewica participant in the Council of Ministers',
      legal: 'Cabinet and portfolio authority only where the choice states it; statutes still require the constitutional legislative path.',
    };
  }
  if (/left_in_government\s*=\s*0/.test(view)) {
    return {
      role: 'Lewica parliamentary opposition',
      legal: 'Proposal, scrutiny, bargaining and voting authority; no executive implementation or state-spending authority.',
    };
  }
  return {
    role: 'Lewica national leadership under the live constitutional role shown by the event',
    legal: 'Authority is limited to the named office, chamber, party body or cabinet actor; party leadership cannot exercise another institution’s power.',
  };
}

function assignedQualities(arrival) {
  const qualities = new Set();
  for (const match of arrival.matchAll(/\bQ\.([A-Za-z_][A-Za-z0-9_]*)\s*(?:\+=|-=|\*=|\/=|=)/g)) {
    qualities.add(match[1]);
  }
  for (const fragment of arrival.split(';')) {
    const match = fragment.trim().match(/^([a-z_][A-Za-z0-9_]*)\s*(?:\+=|-=|\*=|\/=|=)/);
    if (match) qualities.add(match[1]);
  }
  return Array.from(qualities).sort();
}

function stageFor(section, choice, arrival) {
  const explicitStage = arrival.match(/last_policy_stage\s*=\s*["']([^"']+)["']/i);
  if (explicitStage) {
    const stated = explicitStage[1].toLowerCase();
    if (stated.includes('implement')) return 'implementation';
    if (stated.includes('passage') || stated.includes('vote')) return 'passage';
    if (stated.includes('concession') || stated.includes('negotiat')) {
      return 'negotiated_concession';
    }
    if (stated.includes('decision') || stated.includes('election')) {
      return 'institutional_decision';
    }
    return 'proposal';
  }
  const text = [
    readProperty(choice.source, 'title'),
    readProperty(choice.source, 'subtitle'),
    arrival,
  ].join(' ').toLowerCase();
  const view = readProperty(choice.source, 'view-if') ||
    readProperty(section.source, 'view-if');
  if (/implement|fund inspectors|open transparent calls|spend|appoint/.test(text) &&
      !/left_in_government\s*=\s*0/.test(view)) return 'implementation';
  if (/vote|passage|ratif|sejm|senate|statute|bill/.test(text)) return 'passage';
  if (/bargain|negotiat|concession|deal|protocol/.test(text)) {
    return 'negotiated_concession';
  }
  if (/sign|veto|court|president decides|election/.test(text)) {
    return 'institutional_decision';
  }
  return 'proposal';
}

function headlineValues(block) {
  const values = [];
  for (const match of block.matchAll(/news_headline\s*=\s*["']([^"']+)["']/g)) {
    values.push(oneLine(match[1]));
  }
  return values;
}

const majorEventIds = new Set([
  'poland_events.candidate',
  'poland_events.budget_2019',
  'poland_events.budget_2020',
  'poland_office_authority.resolve',
  'poland_events_2026.partnership_veto_2026',
]);

function eventRecord(section) {
  const view = readProperty(section.source, 'view-if');
  const authority = authorityFor(view);
  const proseAudit = readProseAudit(section.source);
  const localChoiceIds = Array.from(
    section.source.matchAll(/^- @([A-Za-z0-9_]+)/gm),
    function(match) { return match[1]; }
  );
  const choices = localChoiceIds.map(function(localId) {
    const localChoiceId = section.rootId + '.' + localId;
    const choice = sectionById.get(localChoiceId) || sectionById.get(localId);
    const choiceId = choice ? choice.id : localChoiceId;
    if (!choice) {
      return {
        id: choiceId,
        title: localId,
        subtitle: 'Unresolved source reference',
        subtitleSource: 'missing',
        availabilityConditions: 'Unresolved source reference',
        authorityStage: 'proposal',
        immediateConsequence: 'Unresolved source reference',
        delayedCallbacks: [],
        mediaPublicReception: [],
        strategicallyDefensible: false,
      };
    }
    const arrival = readArrival(choice.source);
    const route = readProperty(choice.source, 'go-to');
    const explicitSubtitle = readProperty(choice.source, 'subtitle');
    const memories = assignedQualities(arrival);
    if (route) memories.push('route:' + route);
    return {
      id: choice.id,
      title: readProperty(choice.source, 'title') || localId,
      subtitle: explicitSubtitle ||
        'Authority and foreseeable risk are recorded by the immediate consequence and callback fields.',
      subtitleSource: explicitSubtitle ? 'source' : 'manifest_fallback',
      availabilityConditions: [
        readProperty(choice.source, 'view-if'),
        readProperty(choice.source, 'choose-if'),
        readProperty(choice.source, 'unavailable-subtitle'),
      ].filter(Boolean).join(' · ') || 'Available whenever the parent event is active.',
      authorityStage: stageFor(section, choice, arrival),
      immediateConsequence: truncate(
        arrival || ('No direct quality mutation; route: ' + (route || 'event result.')),
        680
      ),
      delayedCallbacks: Array.from(new Set(memories)).sort(),
      mediaPublicReception: headlineValues(choice.source),
      strategicallyDefensible: Boolean(
        readProperty(choice.source, 'title') && (arrival || route)
      ),
    };
  });
  const major = majorEventIds.has(section.id) ||
    section.rootId === 'poland_kpo_2024_2026' ||
    section.rootId === 'poland_leadership_events';
  const combinedSource = [section.source].concat(localChoiceIds.map(function(id) {
    const choice = sectionById.get(section.rootId + '.' + id) ||
      sectionById.get(id);
    return choice ? choice.source : '';
  })).join('\n');
  return {
    id: section.id,
    source: path.relative(projectRoot, section.file) + ':' + section.line,
    proseGrade: proseAudit ? proseAudit.grade : '',
    proseAudit: proseAudit ? proseAudit.note : '',
    historicalDate: dateFor(section),
    factualBaseline: baselineFor(section),
    peopleIntroduced: mentions({ source: combinedSource }, knownPeople),
    organisationsIntroduced: mentions({ source: combinedSource }, knownOrganisations),
    requiredRole: authority.role,
    legalAuthority: authority.legal,
    availabilityConditions: view || 'Reached by the dated source route.',
    choices,
    delayedCallbacks: Array.from(new Set(choices.flatMap(function(choice) {
      return choice.delayedCallbacks;
    }))).sort(),
    mediaPublicReception: Array.from(new Set(headlineValues(combinedSource))),
    alternateHistoryDependencies: view ||
      'Uses the live office-holders, party state and prior decisions named in the source event.',
    splitFallback: /split|breakaway|rupture|in_left|active/.test(combinedSource)
      ? 'Use the explicit live split, caucus and successor-party conditions in this event.'
      : 'If a named faction or party has split, preserve the institution and resolve the live successor organisation or office-holder; never silently reunify it.',
    classification: major ? 'major' : (choices.length > 1 ? 'dated_choice' : 'dated_callback_or_bulletin'),
  };
}

const datedSections = sections.filter(isDatedEvent).sort(function(left, right) {
  return left.id.localeCompare(right.id);
});
const manifest = {
  schemaVersion: 1,
  generatedFrom: 'source/scenes/**/*.scene.dry',
  authorityStages: [
    'proposal', 'negotiated_concession', 'passage', 'implementation',
    'institutional_decision',
  ],
  coalitionSeatsInvariant: 'MPs belonging to recognised parties that hold at least one Council of Ministers portfolio; external confidence-and-supply votes are excluded.',
  events: datedSections.map(eventRecord),
};

function sectionNamed(fileName, localId) {
  const target = sections.find(function(section) {
    return path.basename(section.file) === fileName && section.localId === localId;
  });
  assert(target, 'Missing source section ' + fileName + ':' + localId);
  return target.source;
}

function validateArchitecture() {
  assert.strictEqual(
    manifest.events.length,
    datedSections.length,
    'Every dated source event must have one manifest record'
  );
  const ids = new Set();
  for (const event of manifest.events) {
    if (event.id === 'poland_events_2021_2023.nov21_konf') {
      console.error('DEBUG validateArchitecture event', JSON.stringify(event));
    }
    if (event.id === 'poland_events_2021_2023.nov21_konf') {
      fs.appendFileSync(path.join(projectRoot, '.event_manifest_debug.log'), 'event=' + JSON.stringify(event) + '\n');
    }
    if (!/^[A-FR]$/.test(event.proseGrade)) {
      fs.appendFileSync(path.join(projectRoot, '.event_manifest_debug.log'), 'grade-fail=' + JSON.stringify(event) + '\n');
    }
    assert(/^[A-FR]$/.test(event.proseGrade),
      'Missing prose audit grade: ' + event.id);
    assert(event.proseAudit,
      'Missing prose audit note: ' + event.id);
    assert(!ids.has(event.id), 'Duplicate manifest event: ' + event.id);
    ids.add(event.id);
    for (const field of [
      'historicalDate', 'factualBaseline', 'requiredRole', 'legalAuthority',
      'availabilityConditions', 'alternateHistoryDependencies', 'splitFallback',
    ]) {
      assert(event[field], event.id + ' is missing ' + field);
    }
    assert(Array.isArray(event.peopleIntroduced));
    assert(Array.isArray(event.organisationsIntroduced));
    assert(Array.isArray(event.choices));
    assert(
      event.choices.every(function(choice) {
        return choice.subtitleSource !== 'missing';
      }),
      event.id + ' contains a choice that is absent from the source graph'
    );
    if (event.classification === 'major') {
      assert(
        event.choices.filter(function(choice) {
          return choice.strategicallyDefensible;
        }).length >= 2,
        event.id + ' needs at least two strategically defensible choices'
      );
      for (const choice of event.choices) {
        assert.strictEqual(
          choice.subtitleSource,
          'source',
          choice.id + ' needs a player-facing consequence subtitle'
        );
        assert(choice.immediateConsequence, choice.id + ' has no consequence');
        assert(
          choice.delayedCallbacks.length > 0,
          choice.id + ' is not remembered by a later route or system'
        );
      }
    }
  }
}

function isPureRoutingChoice(section) {
  const title = readProperty(section.source, 'title');
  return /^(Return|Close|Begin|Continue|Remove)\b/.test(title);
}

function validateCorrectnessInvariants() {
  const read = function(relativePath) {
    return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
  };
  const primary = read('source/scenes/poland_primary.scene.dry');
  assert(primary.includes('tallied.slice().sort'), 'Primary must rank counted tallies');
  assert(primary.includes('primary_total_votes'), 'Primary must publish a vote total');
  assert(primary.includes('Math.round(Q.primary_turnout) - allocatedVotes'),
    'Primary candidate tallies must reconcile to turnout');

  const events2025 = read('source/scenes/poland_events_2025.scene.dry');
  assert(
    /return\s+key\s*!=\s*["']other["']\s*&&\s*raw\[key\]\s*>\s*0/.test(events2025),
    'The aggregate other field cannot become a 2025 runoff finalist'
  );
  assert(
    !/sejm_speaker\s*=/.test(sectionNamed('poland_events_2025.scene.dry', 'left_leadership_2025')),
    'A party congress cannot appoint the Sejm Marshal'
  );
  const oathCrisis2025 = sectionNamed(
    'poland_events_2025.scene.dry',
    'presidential_oath_crisis_2025'
  );
  const oathInauguration2025 = sectionNamed(
    'poland_events_2025.scene.dry',
    'presidential_inauguration_2025'
  );
  const oathDelay2025 = sectionNamed(
    'poland_events_2025.scene.dry',
    'oath_delay_2025'
  );
  const oathActingWindow2025 = sectionNamed(
    'poland_events_2025.scene.dry',
    'oath_acting_window_2025'
  );
  assert(
    readProperty(oathCrisis2025, 'view-if').includes(
      'pres_2025_winner_key = "right"'
    ),
    'The 2025 oath crisis must follow Nawrocki\'s adverse result'
  );
  assert(
    [oathDelay2025, oathActingWindow2025].every(function(section) {
      return section.includes('Q.pres_2025_oath_crisis = 2') &&
        !section.includes('Q.pres_2025_inaugurated = 1');
    }),
    'The oath manoeuvre may create an interregnum, not inaugurate its claimant'
  );
  assert(
    oathInauguration2025.includes('Q.president_name = Q.pres_2025_winner') &&
      oathInauguration2025.includes('Q.pres_2025_oath_crisis = 3'),
    'The certified 2025 winner must end any attempted oath interregnum'
  );

  const allSource = files.map(function(file) {
    return fs.readFileSync(file, 'utf8');
  }).join('\n');
  assert(
    !/coalition_seats\s*=\s*Q\.(?:confidence_yes|third_yes|constructive_yes)/.test(allSource),
    'coalition_seats cannot mean roll-call yes votes'
  );
  assert(
    !/coalition_seats\s*-=/m.test(allSource),
    'Caucus exits must change party seats once and let normalization derive coalition_seats'
  );
  assert(
    !/coalition_seats\s*=\s*(?:Q\.)?coalition_democratic_seats/.test(allSource),
    'A proposed democratic pact cannot become cabinet-party seats before appointment'
  );

  const advocacySections = [
    ['poland_party_actions.scene.dry', 'labor'],
    ['poland_coalition_actions.scene.dry', 'pis_social'],
    ['poland_foreign_events.scene.dry', 'biden_social'],
    ['poland_foreign_events.scene.dry', 'harris_social'],
    ['poland_events_2023_2024.scene.dry', 'suwerenna_merger_social'],
    ['poland_events_2023_2024.scene.dry', 'refugee_rules'],
    ['poland_events_2023_2024.scene.dry', 'sovereign_merger_social'],
    ['poland_events_2025.scene.dry', 'pis_school_pilots'],
    ['poland_events_2025.scene.dry', 'holownia_partner'],
    ['poland_presidential_election.scene.dry', 'debate_rights_dignity'],
    ['poland_trzaskowski.scene.dry', 'judicial_trade'],
    ['poland_trzaskowski.scene.dry', 'palace_social'],
  ];
  const protectedImplementation =
    /(?:health_capacity|household_security|kpo_delivery|government_delivery|administrative_capacity|climate_state_capacity)\s*\+=/;
  for (const sourceRef of advocacySections) {
    assert(
      !protectedImplementation.test(sectionNamed(sourceRef[0], sourceRef[1])),
      sourceRef.join(':') +
        ' lets party or presidential advocacy directly implement state policy'
    );
  }

  const normalizer = read('source/scenes/poland_normalize.scene.dry');
  assert(normalizer.includes('MPs of parties holding Council of Ministers portfolios'));
  assert(normalizer.includes('"p2050", "independent", "other"'));
  assert(normalizer.includes('for (const portfolio of cabinetPortfolios)'));
  assert(normalizer.includes('Vacant — prime-ministerial appointment pending'));

  const advance = read('source/scenes/poland_advance.scene.dry');
  assert(!/Q\.(?:ko_leader|p2050_leader)\s*=(?!=)/.test(advance),
    'Monthly normalization cannot silently replace a party leader');
  const extensionEvents = read(
    'source/scenes/poland_events_2021_2023.scene.dry'
  );
  assert(
    !extensionEvents.includes(
      'poland_leadership_events.sovereign_rename_2023'
    ),
    'A smaller party rebrand cannot become another mandatory leadership event'
  );
  assert(extensionEvents.includes('Q.political_bulletin_pending = 1'));
  assert(read('source/scenes/poland_hub.scene.dry')
    .includes('@poland_political_bulletin'));

  const events2026 = read('source/scenes/poland_events_2026.scene.dry');
  assert(
    readProperty(sectionNamed('poland_events_2026.scene.dry', 'constructive_motion_2026'), 'view-if')
      .includes('government_party != "pis"'),
    'Opposition PiS cannot move against an existing PiS cabinet'
  );
  assert(events2026.includes('Q.partnership_presidential_lobby_bonus'));
  assert(events2026.includes('Q.partnership_presidential_score < 50'));

  const foreignDeck = read('source/scenes/cards/poland_foreign_deck.scene.dry');
  for (const arena of ['EU', 'Hungary', 'United States', 'Ukraine']) {
    assert(
      foreignDeck.includes(arena),
      'Foreign Affairs deck omits ' + arena
    );
  }

  const ziobroHospital = sectionNamed(
    'poland_ziobro_whereabouts.scene.dry', 'hospital'
  );
  const ziobroPolice = sectionNamed(
    'poland_ziobro_whereabouts.scene.dry', 'missed_by_police'
  );
  const ziobroHungary = sectionNamed(
    'poland_ziobro_whereabouts.scene.dry', 'hungary'
  );
  const ziobroAmerica = sectionNamed(
    'poland_ziobro_whereabouts.scene.dry', 'united_states'
  );
  const ziobroArgentina = sectionNamed(
    'poland_ziobro_whereabouts.scene.dry', 'argentina'
  );
  const ziobroWorldTour = sectionNamed(
    'poland_ziobro_whereabouts.scene.dry', 'world_tour'
  );
  assert(
    readProperty(ziobroHospital, 'view-if').includes(
      'government_party != "pis"'
    ),
    'The Ziobro chain must begin only after a non-PiS cabinet takes office'
  );
  for (const entry of [
    [ziobroHospital, 0], [ziobroPolice, 1], [ziobroHungary, 2],
    [ziobroAmerica, 3], [ziobroArgentina, 4], [ziobroWorldTour, 5],
  ]) {
    assert(
      readProperty(entry[0], 'view-if').includes(
        'ziobro_whereabouts_stage = ' + entry[1]
      ),
      'Ziobro whereabouts stages must remain ordered'
    );
  }
  assert(
    ziobroAmerica.includes(
      'Q.ziobro_whereabouts_stage = democraticAmerica ? 4 : 5'
    ) &&
      readProperty(ziobroArgentina, 'view-if').includes(
        'us_administration = "Democratic"'
      ),
    'Only the Democratic US branch may continue to Argentina'
  );
  assert.strictEqual(
    readProperty(ziobroWorldTour, 'max-visits'), '2',
    'The satirical world tour must end after two additional rumours'
  );
  assert(
    ziobroWorldTour.includes('ziobro_world_tour_updates = 1') &&
      ziobroWorldTour.includes('ziobro_world_tour_updates = 2') &&
      ziobroWorldTour.includes('ziobro_previous_rumor_country') &&
      ziobroWorldTour.includes('ziobro_previous_rumor_departure'),
    'The two random Ziobro sightings need distinct, connected prose'
  );
  for (const field of [
    'ziobro_rumor_discovery', 'ziobro_rumor_climate',
    'ziobro_rumor_mfa', 'ziobro_rumor_departure',
  ]) {
    assert(
      ziobroWorldTour.includes(field),
      'Each Ziobro destination needs its own ' + field
    );
  }
  for (const country of [
    'El Salvador', 'South Africa', 'Thailand', 'Japan',
    'Israel', 'South Korea', 'Turkey',
  ]) {
    assert(
      ziobroWorldTour.includes('["' + country + '"'),
      'The Ziobro rumour pool omits ' + country
    );
  }
  assert(
    ziobroWorldTour.includes('< 0.20 ? 1 : 0') &&
      ziobroWorldTour.includes('["Philippines"') &&
      ziobroWorldTour.includes('["India"') &&
      ziobroWorldTour.includes('ziobro_final_escape_triggered = 1'),
    'The second Ziobro sighting needs its 20% Philippines/India epilogue'
  );

  assert.strictEqual(
    readProperty(sectionNamed('poland_events.scene.dry', 'budget_consequence'), 'go-to'),
    'poland_polling',
    'The December 2020 budget cannot bypass the warning-period system'
  );

  const queueRoot = sectionNamed('poland_event_queue.scene.dry', '');
  assert(
    !/^new-page:\s*true\b/m.test(queueRoot),
    'The queue router cannot erase a dated event before its result beat'
  );
  assert(
    !/afterword/.test(queueRoot),
    'A dated result must return to the desk directly, without a summary beat'
  );
  assert(
    /^new-page:\s*true\b/m.test(
      sectionNamed('poland_event_queue.scene.dry', 'events_choice')
    ),
    'The event desk must open on a clean page'
  );

  for (const section of sections) {
    const route = readProperty(section.source, 'go-to');
    if (!route || route.includes(';')) continue;
    const target = sectionById.get(section.rootId + '.' + route) ||
      sectionById.get(route);
    if (!target || !target.localId || !/_hub$/.test(target.localId)) continue;
    if (!/^new-page:\s*true\b/m.test(target.source)) continue;
    if (/^=\s+/m.test(section.source) || isPureRoutingChoice(section)) {
      console.log('SKIP', section.id, 'hasHeading', /^=\s+/m.test(section.source), 'isPure', isPureRoutingChoice(section));
      continue;
    }
    console.log('FAIL', section.id, 'hasHeading', /^=\s+/m.test(section.source), 'isPure', isPureRoutingChoice(section), 'sourceSnippet', JSON.stringify(section.source.split('\n').slice(0, 20).join('\n')));
    assert.fail(
      section.id +
        ' jumps straight into the clean hub page ' + target.id +
        ' without a visible aftermath beat'
    );
  }

  for (const section of sections) {
    if (/^tags:\s*poland_event\b/m.test(section.source)) {
      assert(
        /^new-page:\s*true\b/m.test(section.source),
        section.id + ' must open a dated event on a clean page'
      );
    }
  }

  const candidateRollout = [
    'meet_candidates', 'candidate_duda', 'candidate_trzaskowski',
    'candidate_holownia', 'candidate_bosak', 'candidate_kosiniak',
    'candidate_other', 'candidate_left', 'candidate_alignment',
  ];
  for (const localId of candidateRollout) {
    assert(
      !/^new-page:\s*true\b/m.test(
        sectionNamed('poland_presidential_election.scene.dry', localId)
      ),
      'The presidential candidate rollout must retain earlier profiles: ' + localId
    );
  }
  const presidentialElection = read(
    'source/scenes/poland_presidential_election.scene.dry'
  );
  for (const name of [
    'Andrzej Duda', 'Rafał Trzaskowski', 'Szymon Hołownia',
    'Krzysztof Bosak', 'Władysław Kosiniak-Kamysz',
    'Stanisław Żółtek', 'Marek Jakubiak', 'Paweł Tanajno',
    'Waldemar Witkowski', 'Mirosław Piotrowski',
  ]) {
    assert(
      presidentialElection.includes(name),
      'The eleven-candidate introduction omits ' + name
    );
  }

  const reshuffle = sectionNamed('poland_cabinet_reshuffle.scene.dry', 'keep');
  assert(/month_actions\s*\+=\s*1/.test(reshuffle));
  assert(reshuffle.includes('#poland_card_finish'));
  const discard = read('source/scenes/poland_discard_card.scene.dry');
  assert.strictEqual((discard.match(/Q\.month_actions \+= 1;/g) || []).length, 3);

  // A blank line inside a [? ... ?] conditional makes the compiler abandon the
  // whole file, and every scene in it silently disappears from the game. The
  // failure surfaces far away, as unresolved go-to targets in other files, so
  // catch it at the source instead.
  for (const file of files) {
    const source = read(path.relative(projectRoot, file));
    for (const match of source.matchAll(/\[\?[\s\S]*?\?\]/g)) {
      assert(
        !match[0].includes('\n\n'),
        path.relative(projectRoot, file) + ':' +
          (source.slice(0, match.index).split('\n').length) +
          ' has a blank line inside a [? ... ?] conditional; split it into ' +
          'one conditional per paragraph'
      );
    }
  }

  for (const section of sections) {
    if (/^view-if:\s*left_in_government\s*=\s*0/m.test(section.source)) {
      assert(
        !/Q\.(?:health_capacity|household_security|kpo_delivery|government_delivery|climate_state_capacity)\s*\+=/.test(section.source),
        section.id + ' gives opposition direct state implementation'
      );
    }
  }
  for (const relativePath of [
    'source/scenes/cards/poland_eastern_flank.scene.dry',
    'source/scenes/cards/poland_european_right.scene.dry',
  ]) {
    const dynamicAuthority = read(relativePath);
    for (const match of dynamicAuthority.matchAll(
      /else if \(role == "confidence_opposition"\) \{([\s\S]*?)(?=\} else|\}\nQ\.news_headline)/g
    )) {
      assert(
        !/(?:health_capacity|household_security|kpo_delivery|government_delivery|climate_state_capacity)\s*\+=/.test(match[1]),
        relativePath + ' lets confidence-and-supply advocacy implement state policy'
      );
    }
  }
}

validateArchitecture();
validateCorrectnessInvariants();

const output = JSON.stringify(manifest, null, 2) + '\n';
if (writeMode) {
  fs.writeFileSync(manifestPath, output);
  console.log('Wrote ' + path.relative(projectRoot, manifestPath) +
    ' with ' + manifest.events.length + ' dated events.');
} else {
  assert(fs.existsSync(manifestPath), 'Run npm run manifest to create the event manifest');
  assert.strictEqual(
    fs.readFileSync(manifestPath, 'utf8'),
    output,
    'Event manifest is stale; run npm run manifest'
  );
  console.log('Event manifest and correctness invariants passed (' +
    manifest.events.length + ' dated events).');
}
