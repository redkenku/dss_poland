#!/usr/bin/env node
'use strict';

// Every outcome the player can produce — card branch, hub action or dated
// historical event — must give TVP Wiadomości something specific to smear
// while PiS holds public media. This check extracts every news_headline in the
// scene tree, runs each one through the pasek matcher in out/html/game.js, and
// fails when a headline falls through to the generic public-mood banner.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.join(__dirname, '..');
const sceneRoot = path.join(projectRoot, 'source', 'scenes');

const sceneFiles = function(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(function(entry) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return sceneFiles(full);
    }
    return entry.name.endsWith('.scene.dry') ? [full] : [];
  });
};

const collectHeadlines = function() {
  const headlines = new Map();
  sceneFiles(sceneRoot).forEach(function(file) {
    const source = fs.readFileSync(file, 'utf8');
    const pattern = /news_headline\s*=\s*"([^"]+)"/g;
    let match = pattern.exec(source);
    while (match) {
      if (!headlines.has(match[1])) {
        headlines.set(match[1], path.basename(file, '.scene.dry'));
      }
      match = pattern.exec(source);
    }
  });
  return headlines;
};

const loadPaski = function() {
  const source = fs.readFileSync(
    path.join(projectRoot, 'out', 'html', 'game.js'),
    'utf8'
  ).replace(
    '  window.renderPressReview = function() {',
    '  window.__paskiSubjects = pressPaskiSubjects;\n' +
      '  window.__paskiByEvent = pressPaskiByEvent;\n' +
      '  window.__paskiPasek = pressWiadomosciPasek;\n' +
      '  window.renderPressReview = function() {'
  );
  const sandbox = {
    console: {log: function() {}, error: function() {}},
    document: {},
    window: {dendryUI: {dendryEngine: {state: {sceneId: 'poland_hub'}}}},
  };
  vm.runInNewContext(source, sandbox);
  return sandbox.window;
};

const main = function() {
  const headlines = collectHeadlines();
  const paski = loadPaski();
  const subjects = paski.__paskiSubjects;
  const events = paski.__paskiByEvent;
  const misses = [];
  const byFrame = new Map();
  const banners = new Map();
  let authored = 0;

  // A neutral hostile state: no campaign month, no warm channel, so the
  // reported banner is the one the subject rules produce on their own.
  const state = {government_party: 'pis', public_media_patron: 'pis'};

  // The banner holds for three months at a time, so a single turn under-counts
  // the variety a playthrough actually sees: sample across the hammer clock.
  const strips = new Map();
  headlines.forEach(function(scene, headline) {
    [7, 19, 31, 43].forEach(function(turn) {
      const pasek = paski.__paskiPasek(
        Object.assign({news_headline: headline}, state),
        202100 + (turn % 12) + 1,
        turn,
        null
      );
      banners.set(pasek.lines[0], (banners.get(pasek.lines[0]) || 0) + 1);
      strips.set(pasek.lines[1], (strips.get(pasek.lines[1]) || 0) + 1);
    });
    if (events[headline]) {
      authored += 1;
      return;
    }
    const index = subjects.findIndex(function(entry) {
      return entry[0].test(headline.toLowerCase());
    });
    if (index < 0) {
      misses.push([headline, scene]);
      return;
    }
    byFrame.set(subjects[index][2], (byFrame.get(subjects[index][2]) || 0) + 1);
  });

  const ranked = Array.from(byFrame.entries()).sort(function(a, b) {
    return b[1] - a[1];
  });
  console.log(
    'Pasek coverage: ' + (headlines.size - misses.length) + '/' +
      headlines.size + ' outcome headlines produce a specific banner (' +
      authored + ' authored outright).'
  );
  console.log(
    'Distinct lines across the corpus: ' + banners.size + ' banners and ' +
      strips.size + ' yellow strips, from ' + subjects.length +
      ' frames and ' + Object.keys(events).length + ' authored outcomes.'
  );
  console.log('Frames in use: ' + ranked.length + '/' + subjects.length);
  ranked.slice(0, 6).forEach(function(row) {
    console.log('  ' + String(row[1]).padStart(4) + '  ' + row[0]);
  });

  if (misses.length) {
    console.error('\nHeadlines that reached no frame at all:');
    misses.slice(0, 60).forEach(function(row) {
      console.error('  [' + row[1] + '] ' + row[0]);
    });
    process.exitCode = 1;
    return;
  }

  // The catch-all frame is the honest measure of how much of the game still
  // gets a reflex banner instead of one about what actually happened.
  const generic = byFrame.get('general') || 0;
  console.log(
    'Reflex fallback: ' + generic + ' outcomes (' +
      (generic / headlines.size * 100).toFixed(1) + '%).'
  );
  if (generic / headlines.size > 0.05) {
    console.error(
      '\nOver 5% of outcomes fall back on the generic banner. Add frames.'
    );
    process.exitCode = 1;
    return;
  }

  // The yellow strip is the line a player reads most often, so it needs the
  // deepest pool: six per frame plus the mood and campaign registers.
  if (strips.size < 300) {
    console.error(
      '\nOnly ' + strips.size + ' distinct yellow strips; the pools were thinned.'
    );
    process.exitCode = 1;
    return;
  }

  // An unreachable frame would silently make every quiet month read the same.
  if (ranked.length < subjects.length) {
    console.error(
      '\nUnreachable pasek frames: ' +
        subjects.filter(function(entry) {
          return !byFrame.has(entry[2]);
        }).map(function(entry) { return entry[2]; }).join(', ')
    );
    process.exitCode = 1;
    return;
  }
  // One frame swallowing the corpus is the failure the authored table and the
  // narrower terms exist to prevent.
  const worst = ranked[0];
  if (worst[1] / headlines.size > 0.09) {
    console.error(
      '\nFrame "' + worst[0] + '" absorbs ' + worst[1] + ' of ' +
        headlines.size + ' outcomes; split it or narrow the frames above it.'
    );
    process.exitCode = 1;
    return;
  }
  console.log('\nEvery player action, card and event has a Wiadomości banner.');
};

main();
