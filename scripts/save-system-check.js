'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class MemoryStorage {
  constructor() {
    this.values = new Map();
    this.failNextWrite = false;
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return Array.from(this.values.keys())[index] || null;
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    if (this.failNextWrite) {
      this.failNextWrite = false;
      const error = new Error('Storage full');
      error.name = 'QuotaExceededError';
      throw error;
    }
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const storage = new MemoryStorage();
const alerts = [];
const elements = {};
const ids = ['a0', 'a1'].concat(
  Array.from({length: 8}, function(_, index) { return String(index); })
);
ids.forEach(function(id) {
  ['save_info_', 'save_button_', 'delete_button_', 'export_button_']
    .forEach(function(prefix) {
      elements[prefix + id] = {
        disabled: false,
        onclick: null,
        textContent: '',
      };
    });
});

const windowObject = {
  alert: function(message) { alerts.push(message); },
  localStorage: storage,
  showAchievementToast: function() {},
};
const context = {
  Blob,
  Date,
  FileReader: function() {},
  URL,
  console,
  document: {
    createElement: function() { return {click: function() {}}; },
    getElementById: function(id) { return elements[id] || null; },
  },
  window: windowObject,
};

const gameJsPath = path.resolve(__dirname, '..', 'out', 'html', 'game.js');
const source = fs.readFileSync(gameJsPath, 'utf8');
const prelude = source.slice(0, source.indexOf('  var TITLE ='));
vm.runInNewContext(
  prelude + '  window.__saveSystemMain = main;\n}());',
  context,
  {filename: gameJsPath}
);

const validState = function(marker) {
  return {
    currentContent: [],
    currentHands: {},
    currentRandomState: [1, 2, 3, 4, 5],
    qualities: {marker: marker},
    sceneId: 'root',
    visits: {},
  };
};
const engine = {
  achieve: function() {},
  getExportableState: function() { return this.state; },
  setState: function(state) {
    this.state = state;
    if (windowObject.onNewPage) windowObject.onNewPage();
  },
  state: validState(1),
};
let hidden = 0;
const ui = {
  DateOptions: {},
  audio: function() {},
  dendryEngine: engine,
  game: {
    ifid: 'test-ifid',
    scenes: {root: {}, 'root.new_game': {}},
  },
  hideSaveSlots: function() { hidden += 1; },
  max_slots: 8,
};

storage.setItem('Polish Red Autumn_redkenku_save_0', 'legacy');
storage.setItem('Polish_Red_Autumn_budget_v2_save_a0', 'legacy');
storage.setItem('Polish_Red_Autumn_save_v3_0', 'legacy');
storage.setItem('Polish Red Autumn_achievements', '{"kept":true}');
windowObject.__saveSystemMain(ui);

assert.strictEqual(storage.getItem('Polish Red Autumn_redkenku_save_0'), null);
assert.strictEqual(
  storage.getItem('Polish_Red_Autumn_budget_v2_save_a0'),
  null
);
assert.strictEqual(storage.getItem('Polish_Red_Autumn_save_v3_0'), null);
assert.strictEqual(
  storage.getItem('Polish Red Autumn_achievements'),
  '{"kept":true}'
);

ui.populateSaveSlots(8, 2);
elements.save_button_0.onclick();
elements.save_button_1.onclick();
assert.strictEqual(elements.save_button_0.textContent, 'Load');
assert.strictEqual(elements.save_button_1.textContent, 'Load');
assert.strictEqual(
  JSON.parse(storage.getItem('Polish_Red_Autumn_save_v4_0')).format,
  'polish-red-autumn-save'
);

elements.delete_button_0.onclick();
assert.strictEqual(storage.getItem('Polish_Red_Autumn_save_v4_0'), null);
assert.strictEqual(elements.save_button_0.textContent, 'Save');
elements.save_button_0.onclick();
assert(storage.getItem('Polish_Red_Autumn_save_v4_0'));

let autosaves = 0;
ui.autosave = function() { autosaves += 1; };
windowObject.justLoaded = false;
windowObject.onNewPage = function() {
  if (!windowObject.justLoaded) ui.autosave();
  if (windowObject.justLoaded) windowObject.justLoaded = false;
};
engine.state = validState(9);
ui.loadSlot(0);
assert.strictEqual(engine.state.qualities.marker, 1);
assert.strictEqual(autosaves, 0);
assert.strictEqual(hidden, 1);

storage.setItem('Polish_Red_Autumn_save_v4_1', JSON.stringify({
  format: 'polish-red-autumn-save',
  version: 1,
  ifid: 'test-ifid',
  state: validState(7),
}));
const stateBeforeBadLoad = engine.state;
ui.loadSlot(1);
assert.strictEqual(engine.state, stateBeforeBadLoad);
assert(alerts.includes(
  'This save is damaged or belongs to another game version.'
));

storage.failNextWrite = true;
ui.saveSlot(2);
assert.strictEqual(storage.getItem('Polish_Red_Autumn_save_v4_2'), null);
assert(alerts.includes(
  'Browser storage is full. Delete an unused save slot and try again.'
));

console.log('Save-slot cleanup, reuse, validation and quota checks passed.');
