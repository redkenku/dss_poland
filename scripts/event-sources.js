'use strict';

// The dated Polish events live in one file per month (plus a themed file per
// arc that is triggered by flags rather than by the calendar). Checks that used
// to read a single yearly file read the whole directory through here instead.

const fs = require('fs');
const path = require('path');

const eventsDir = path.resolve(__dirname, '..', 'source', 'scenes', 'poland_events');

// Absolute paths of every dated-event scene file, in name order. `filter` is an
// optional predicate over the scene id, e.g. id => id.startsWith('poland_events_2026').
function eventFiles(filter) {
  return fs.readdirSync(eventsDir)
    .filter(function(name) { return name.endsWith('.scene.dry'); })
    .map(function(name) { return name.replace(/\.scene\.dry$/, ''); })
    .filter(function(id) { return filter ? filter(id) : true; })
    .sort()
    .map(function(id) { return path.join(eventsDir, id + '.scene.dry'); });
}

// The concatenated source of those files.
function eventSource(filter) {
  return eventFiles(filter).map(function(file) {
    return fs.readFileSync(file, 'utf8');
  }).join('\n');
}

module.exports = { eventsDir, eventFiles, eventSource };
