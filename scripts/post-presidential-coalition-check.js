'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sceneParser = require('dendrynexus/lib/parsers/scene');

const sourcePaths = require('./event-sources').eventFiles(function(id) {
  return id.startsWith('poland_events_2025_');
});
const formationSourcePath = path.resolve(
  __dirname,
  '../source/scenes/poland_government_formation.scene.dry'
);

const CASES = [
  ['democratic_2023', 'ko', 'post_presidential_democratic_2023'],
  ['ko_psl_left', 'psl', 'post_presidential_ko_psl_left'],
  ['ko_p2050_left', 'ko', 'post_presidential_ko_p2050_left'],
  ['left_p2050', 'lewica', 'post_presidential_left_p2050'],
  ['left_psl', 'lewica', 'post_presidential_left_psl'],
  ['left_third', 'lewica', 'post_presidential_left_third'],
  ['third_left_pis', 'lewica', 'post_presidential_third_left_pis'],
  ['left_pis', 'pis', 'post_presidential_left_pis'],
  ['ko_left', 'ko', 'post_presidential_ko_left'],
  ['left_only', 'lewica', 'post_presidential_left_only'],
  ['pis_konf', 'pis', 'post_presidential_pis_konf'],
  ['pis_konf_tolerated', 'pis', 'post_presidential_pis_konf'],
  ['pis_konf_third', 'pis', 'post_presidential_pis_konf_third'],
  ['pis_konf_third_tolerated', 'pis', 'post_presidential_pis_konf_third'],
  ['pis_konf_psl', 'pis', 'post_presidential_pis_konf_psl'],
  ['pis_konf_psl_tolerated', 'pis', 'post_presidential_pis_konf_psl'],
  ['ko_third', 'ko', 'post_presidential_ko_third'],
  ['ko_third_tolerated', 'ko', 'post_presidential_ko_third'],
  ['ko_konf', 'ko', 'post_presidential_ko_konf'],
  ['ko_konf_tolerated', 'ko', 'post_presidential_ko_konf'],
];

const parsedSections = [];
sourcePaths.forEach(function(sourcePath) {
  sceneParser.parseFromContent(
    sourcePath,
    fs.readFileSync(sourcePath, 'utf8'),
    function(error, parsed) {
      if (error) throw error;
      parsedSections.push.apply(parsedSections, parsed.sections || []);
    }
  );
});
runChecks(parsedSections);

function runChecks(parsedSections) {
  // Sections now live in per-month files, so index them by their local id.
  const scenes = new Map(parsedSections.map(function(scene) {
    return [scene.id.slice(scene.id.indexOf('.') + 1), scene];
  }));
  const localIds = Array.from(new Set(CASES.map(function(entry) {
    return entry[2];
  }))).concat('post_presidential_live_contract');
  const formationSource = fs.readFileSync(formationSourcePath, 'utf8');
  const authoredFormationCodes = Array.from(
    formationSource.matchAll(
      /(?:formation_coalition_code|formation_fallback_code)\s*=\s*"([^"]+)"/g
    ),
    function(match) { return match[1]; }
  ).filter(function(code) {
    return code !== 'none';
  });
  // The basic PiS-Lewica route is selected through formation_pending_pis_code.
  authoredFormationCodes.push('left_pis');
  const coveredFormationCodes = CASES.map(function(entry) {
    return entry[0].replace(/_tolerated$/, '');
  });

  assert.deepStrictEqual(
    Array.from(new Set(coveredFormationCodes)).sort(),
    Array.from(new Set(authoredFormationCodes)).sort(),
    'The briefing matrix must cover every coalition authored by formation'
  );

  function scene(localId) {
    const result = scenes.get(localId);
    assert(result, 'Missing scene ' + localId);
    return result;
  }

  function state(code, governmentParty, hostile) {
    return {
      continuous_campaign: 1,
      year: 2025,
      month: 6,
      pres_2025_runoff_done: 1,
      pres_2025_hostile_president: hostile ? 1 : 0,
      coalition_confidence_2025_done: 0,
      caretaker_government: 0,
      government_has_confidence: 1,
      government_party: governmentParty,
      formation_coalition_selected: code === 'none' ? 0 : 1,
      formation_coalition_code: code,
    };
  }

  function isLive(localId, Q) {
    const predicate = scene(localId).viewIf;
    return !predicate || predicate({}, Q);
  }

  function liveCoalitionEvents(Q) {
    return localIds.filter(function(localId) {
      return isLive(localId, Q);
    });
  }

  for (const [code, governmentParty, localId] of CASES) {
    for (const hostile of [false, true]) {
      const Q = state(code, governmentParty, hostile);
      assert.deepStrictEqual(
        liveCoalitionEvents(Q),
        [localId],
        code + ' must receive exactly its own coalition briefing'
      );
      const activeContinuations = [
        'post_presidential_continue_status',
        'post_presidential_continue_vote',
      ].filter(function(continuationId) {
        return isLive(continuationId, Q);
      });
      assert.deepStrictEqual(
        activeContinuations,
        [
          governmentParty === 'pis' || !hostile
            ? 'post_presidential_continue_status'
            : 'post_presidential_continue_vote',
        ],
        code + ' must keep the correct confidence route'
      );
      assert.deepStrictEqual(
        scene(localId).options.map(function(option) { return option.id; }),
        [
          '@post_presidential_continue_status',
          '@post_presidential_continue_vote',
        ],
        code + ' must expose the shared constitutional continuations'
      );
    }
  }

  {
    const Q = state('none', 'independent', false);
    assert.deepStrictEqual(
      liveCoalitionEvents(Q),
      ['post_presidential_live_contract'],
      'A custom cabinet needs the live-contract fallback'
    );
  }

  {
    const Q = state('left_pis', 'pis', true);
    Q.caretaker_government = 1;
    Q.government_has_confidence = 0;
    assert.deepStrictEqual(liveCoalitionEvents(Q), []);
    assert(
      isLive('post_presidential_caretaker_status', Q),
      'A PiS caretaker must use the same constitutional caretaker event'
    );
  }

  const titles = localIds.map(function(localId) {
    return scene(localId).title;
  });
  assert.strictEqual(
    new Set(titles).size,
    titles.length,
    'Every coalition briefing needs a unique title'
  );
  assert.deepStrictEqual(
    scene('confidence_after_presidential').tags || [],
    [],
    'The shared confidence scene must be reached through a coalition briefing'
  );

  console.log('post-presidential-coalition-check: ok');
}
