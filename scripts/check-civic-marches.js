"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const civic = read("source/scenes/poland_civic_marches.scene.dry");
const setup = read("source/scenes/root.scene.dry");
const normalize = read("source/scenes/poland_normalize.scene.dry");
const polling = read("source/scenes/poland_polling.scene.dry");
const legacyDesk = read("source/scenes/poland_legacy_event_desk.scene.dry");
const extension = require("./event-sources").eventSource();

const occurrences = (text, pattern) => (text.match(pattern) || []).length;

assert.match(civic, /@labor_day\b[\s\S]*?tags: poland_event/);
assert.match(civic, /@pride\b[\s\S]*?tags: poland_event/);

for (let year = 2020; year <= 2026; year += 1) {
  assert.ok(
    occurrences(civic, new RegExp(`if year = ${year}:`, "g")) >= 2,
    `Labor Day and Pride both need ${year} prose`,
  );
}

for (const token of [
  "pride_social_mood",
  'pride_social_mood = "favourable"',
  'pride_social_mood = "contested"',
  'pride_social_mood = "hostile"',
  "@pride_corporate",
  "@pride_worker_compact",
]) {
  assert.ok(civic.includes(token), `Missing Pride branch: ${token}`);
}

for (const token of [
  "labor_relationship_state",
  'labor_day_entry_relationship = "cooperative"',
  'labor_day_entry_relationship = "ignored"',
  'labor_day_entry_relationship = "hostile"',
  "@labor_day_union",
  "@labor_day_revive",
  "@labor_day_autonomous",
  "union_trust",
  "opzz_cooperation",
  "labor_dissent",
  "labor_conflict",
]) {
  assert.ok(civic.includes(token), `Missing Labor Day wiring: ${token}`);
}

for (const token of [
  "last_labor_day_year = 2019",
  "last_pride_year = 2019",
]) {
  assert.ok(setup.includes(token), `Missing campaign default: ${token}`);
}

assert.match(
  normalize,
  /Q\.labor_conflict = Q\.labor_dissent;/,
);
assert.match(
  normalize,
  /Q\.labor_conflict >= 75 \|\|[\s\S]*?Q\.union_trust <= 20 \|\|[\s\S]*?Q\.opzz_cooperation <= 20/,
);
assert.match(
  normalize,
  /Q\.union_trust >= 60 &&[\s\S]*?Q\.opzz_cooperation >= 55 &&[\s\S]*?Q\.labor_conflict <= 40/,
);

const relationship = ({ trust, opzz, dissent }) => {
  if (dissent >= 75 || trust <= 20 || opzz <= 20) return "hostile";
  if (trust >= 60 && opzz >= 55 && dissent <= 40) return "cooperative";
  return "ignored";
};

assert.equal(
  relationship({ trust: 44, opzz: 42, dissent: 18 }),
  "ignored",
  "New campaigns should inherit the canonical neutral union state",
);
assert.equal(
  relationship({ trust: 27, opzz: 26, dissent: 72 }),
  "ignored",
  "The hostile-state union-led outcome should repair the live relationship",
);
assert.equal(
  relationship({ trust: 57, opzz: 53, dissent: 46 }),
  "ignored",
  "A party takeover should be able to lose a cooperative relationship",
);

assert.ok(legacyDesk.includes("poland_civic_marches.labor_day"));
assert.ok(polling.includes("poland_civic_marches.labor_day"));
assert.ok(polling.includes("poland_civic_marches.pride"));
assert.ok(extension.includes("poland_civic_marches.labor_day"));
assert.ok(extension.includes("poland_civic_marches.pride"));
assert.match(
  civic,
  /@return_to_dated_desk[\s\S]*?call: poland_normalize/,
);

console.log("Civic march chains and canonical union-state wiring: OK");
