'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const mapshaper = path.join(projectRoot, 'node_modules', '.bin', 'mapshaper');
const outputScene = path.join(
  projectRoot, 'source', 'scenes', 'poland_election_geography.scene.dry'
);
const outputBrowser = path.join(
  projectRoot, 'out', 'html', 'poland-election-geography.js'
);

const sources = {
  naturalEarthLand: {
    url: 'https://naturalearth.s3.amazonaws.com/10m_physical/ne_10m_land.zip',
    sha256: 'e547d749445eaa0964aba76738090ec88f5e63c4585122170f98c67a7ea922dc',
  },
  prg2023: {
    url: 'https://opendata.geoportal.gov.pl/prg/granice_archiwalne/' +
      'PRG_jednostki_administracyjne_2023.zip',
    sha256: 'f33fcf1aa2428b1647d2ce8960082207e8085c9cdb81c249636be0eadc66fb88',
  },
  pkw2019Districts: {
    url: 'https://sejmsenat2019.pkw.gov.pl/sejmsenat2019/data/csv/' +
      'wyniki_gl_na_listy_po_okregach_sejm_csv.zip',
    sha256: 'f39c4550be83bcfe6def6ce0d08e64fb67834202d7bacd00b0c8704537520d98',
  },
  pkw2019Municipalities: {
    url: 'https://sejmsenat2019.pkw.gov.pl/sejmsenat2019/data/csv/' +
      'wyniki_gl_na_listy_po_gminach_sejm_csv.zip',
    sha256: 'c5bcb3bfc47e101a641f75ff80959d12f69c0c938c0758933c89025abf7bf9fd',
  },
  pkw2023Districts: {
    url: 'https://sejmsenat2023.pkw.gov.pl/sejmsenat2023/data/csv/' +
      'okregi_sejm_csv.zip',
    sha256: '083fd1f701d8322193e65005df3757878ef57fa3350f4f1306555620344277e1',
  },
  pkw2023Municipalities: {
    url: 'https://sejmsenat2023.pkw.gov.pl/sejmsenat2023/data/csv/' +
      'wyniki_gl_na_listy_po_gminach_sejm_csv.zip',
    sha256: '511d3c016c0878d246c63b668a69718faf14a999724b006ac4a9acdcffdb9db1',
  },
};

function run(command, args, options) {
  const result = childProcess.spawnSync(command, args, Object.assign({
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
  }, options));
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(command + ' failed: ' + (result.stderr || result.stdout));
  }
  return result.stdout;
}

function digest(file) {
  const hash = crypto.createHash('sha256');
  const descriptor = fs.openSync(file, 'r');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let read = 0;
  while ((read = fs.readSync(descriptor, buffer, 0, buffer.length, null)) > 0) {
    hash.update(buffer.subarray(0, read));
  }
  fs.closeSync(descriptor);
  return hash.digest('hex');
}

function download(temp, id) {
  const source = sources[id];
  const destination = path.join(temp, id + '.zip');
  run('curl', ['-fsSL', source.url, '-o', destination], {stdio: 'inherit'});
  assert.strictEqual(digest(destination), source.sha256, id + ' checksum changed');
  return destination;
}

function csvFromZip(zip) {
  return run('unzip', ['-p', zip]).replace(/^\uFEFF/, '');
}

function parseDelimited(input) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ';' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && input[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift().map(function(header) {
    return header.replace(/^\uFEFF/, '');
  });
  return rows.map(function(values) {
    const result = {};
    headers.forEach(function(header, index) { result[header] = values[index] || ''; });
    return result;
  });
}

function number(value) {
  const parsed = Number(String(value || '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function familyForHeader(header) {
  const value = header.toUpperCase();
  if (value.includes('KOALICJA OBYWATELSKA')) return 'ko';
  if (value.includes('KONFEDERACJA WOLNO')) return 'konf';
  if (value.includes('POLSKIE STRONNICTWO LUDOWE')) return 'psl';
  if (value.includes('PRAWO I SPRAWIEDLIWO')) return 'pis';
  if (value.includes('SOJUSZ LEWICY DEMOKRATYCZNEJ')) return 'left';
  if (value.includes('MNIEJSZOŚĆ NIEMIECKA')) return 'minority';
  return null;
}

function voteColumns(row) {
  const columns = {};
  Object.keys(row).forEach(function(header) {
    const family = familyForHeader(header);
    if (family) columns[family] = header;
  });
  return columns;
}

function familyVotes(row) {
  const columns = voteColumns(row);
  const valid = number(row['Liczba głosów ważnych oddanych łącznie na wszystkie listy kandydatów']);
  const result = {left: 0, ko: 0, pis: 0, psl: 0, konf: 0, other: 0};
  Object.keys(columns).forEach(function(family) {
    const votes = number(row[columns[family]]);
    result[family === 'minority' ? 'other' : family] += votes;
  });
  const named = Object.keys(result).reduce(function(sum, id) { return sum + result[id]; }, 0);
  result.other += Math.max(0, valid - named);
  return {valid: valid, votes: result, columns: columns};
}

function shares(votes) {
  const total = Object.keys(votes).reduce(function(sum, id) { return sum + votes[id]; }, 0) || 1;
  const result = {};
  Object.keys(votes).forEach(function(id) {
    result[id] = Math.round(votes[id] * 1000000 / total) / 1000000;
  });
  return result;
}

function dhondt(votes, ids, count) {
  const result = {};
  ids.forEach(function(id) { result[id] = 0; });
  for (let seat = 0; seat < count; seat += 1) {
    let winner = ids[0];
    ids.forEach(function(id) {
      if (number(votes[id]) / (result[id] + 1) >
          number(votes[winner]) / (result[winner] + 1)) winner = id;
    });
    result[winner] += 1;
  }
  return result;
}

function coordinates(geometry) {
  if (!geometry) return [];
  const result = [];
  (function visit(value) {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === 'number') {
      result.push(value);
    } else {
      value.forEach(visit);
    }
  }(geometry.coordinates));
  return result;
}

function center(geometry) {
  const points = coordinates(geometry);
  if (!points.length) return [19, 52];
  return points.reduce(function(total, point) {
    total[0] += point[0] / points.length;
    total[1] += point[1] / points.length;
    return total;
  }, [0, 0]);
}

function roughArea(geometry) {
  let area = 0;
  function ringArea(ring) {
    let value = 0;
    for (let index = 0; index < ring.length; index += 1) {
      const first = ring[index];
      const second = ring[(index + 1) % ring.length];
      value += first[0] * second[1] - second[0] * first[1];
    }
    return Math.abs(value / 2);
  }
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(function(ring) { area += ringArea(ring); });
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(function(polygon) {
      polygon.forEach(function(ring) { area += ringArea(ring); });
    });
  }
  return Math.max(area, 0.0000001);
}

function clipRing(ring, middle, keepLeft) {
  const output = [];
  const inside = function(point) {
    return keepLeft ? point[0] <= middle : point[0] >= middle;
  };
  const intersection = function(first, second) {
    const distance = second[0] - first[0];
    const ratio = Math.abs(distance) < 0.000000001
      ? 0 : (middle - first[0]) / distance;
    return [middle, first[1] + (second[1] - first[1]) * ratio];
  };
  for (let index = 0; index < ring.length; index += 1) {
    const current = ring[index];
    const previous = ring[(index + ring.length - 1) % ring.length];
    const currentInside = inside(current);
    const previousInside = inside(previous);
    if (currentInside) {
      if (!previousInside) output.push(intersection(previous, current));
      output.push(current);
    } else if (previousInside) {
      output.push(intersection(previous, current));
    }
  }
  if (output.length < 3) return null;
  const first = output[0];
  const last = output[output.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) output.push(first.slice());
  return output.length >= 4 ? output : null;
}

function clipGeometry(geometry, middle, keepLeft) {
  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates] : geometry.coordinates;
  const clipped = polygons.map(function(polygon) {
    const rings = polygon.map(function(ring) {
      return clipRing(ring, middle, keepLeft);
    }).filter(Boolean);
    return rings.length ? rings : null;
  }).filter(Boolean);
  return geometry.type === 'Polygon'
    ? {type: 'Polygon', coordinates: clipped[0] || []}
    : {type: 'MultiPolygon', coordinates: clipped};
}

function splitUnitRow(row, features) {
  const points = coordinates(row.feature.geometry);
  const xs = points.map(function(point) { return point[0]; });
  const middle = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
  const geometries = [
    clipGeometry(row.feature.geometry, middle, true),
    clipGeometry(row.feature.geometry, middle, false),
  ];
  const areas = geometries.map(roughArea);
  const totalArea = areas[0] + areas[1];
  const split = geometries.map(function(geometry, index) {
    const feature = {
      type: 'Feature', geometry: geometry,
      properties: Object.assign({}, row.feature.properties, {
        id: row.id + (index ? 'b' : 'a'),
      }),
    };
    return Object.assign({}, row, {
      id: feature.properties.id,
      feature: feature,
      electorate: row.electorate * areas[index] / Math.max(0.0000001, totalArea),
      center: center(geometry),
    });
  });
  const featureIndex = features.indexOf(row.feature);
  assert(featureIndex >= 0, 'unit geometry missing during city split');
  features.splice(featureIndex, 1, split[0].feature, split[1].feature);
  return split;
}

function apportion(total, rows, weightFor) {
  const divisor = rows.reduce(function(sum, row) { return sum + weightFor(row); }, 0) || 1;
  const apportioned = rows.map(function(row) {
    const exact = total * weightFor(row) / divisor;
    return {row: row, value: Math.floor(exact), remainder: exact - Math.floor(exact)};
  });
  let used = apportioned.reduce(function(sum, item) { return sum + item.value; }, 0);
  apportioned.sort(function(a, b) { return b.remainder - a.remainder; });
  for (let index = 0; used < total; index += 1, used += 1) {
    apportioned[index % apportioned.length].value += 1;
  }
  const result = new Map();
  apportioned.forEach(function(item) { result.set(item.row, item.value); });
  return result;
}

function rings(geometry) {
  if (geometry.type === 'Polygon') return geometry.coordinates;
  return geometry.coordinates.reduce(function(all, polygon) {
    return all.concat(polygon);
  }, []);
}

function connectedGraph(rows) {
  const graph = rows.map(function() { return new Set(); });
  const edges = new Map();
  const pointOwners = new Map();
  const pointKey = function(point) {
    return Number(point[0]).toFixed(6) + ',' + Number(point[1]).toFixed(6);
  };
  rows.forEach(function(row, rowIndex) {
    const ownedPoints = new Set();
    rings(row.feature.geometry).forEach(function(ring) {
      for (let index = 1; index < ring.length; index += 1) {
        const first = pointKey(ring[index - 1]);
        const second = pointKey(ring[index]);
        ownedPoints.add(first);
        ownedPoints.add(second);
        const edge = first < second ? first + '|' + second : second + '|' + first;
        if (!edges.has(edge)) edges.set(edge, []);
        edges.get(edge).push(rowIndex);
      }
    });
    ownedPoints.forEach(function(point) {
      if (!pointOwners.has(point)) pointOwners.set(point, []);
      pointOwners.get(point).push(rowIndex);
    });
  });
  edges.forEach(function(owners) {
    for (let left = 0; left < owners.length; left += 1) {
      for (let right = left + 1; right < owners.length; right += 1) {
        graph[owners[left]].add(owners[right]);
        graph[owners[right]].add(owners[left]);
      }
    }
  });
  const sharedPoints = new Map();
  pointOwners.forEach(function(owners) {
    for (let left = 0; left < owners.length; left += 1) {
      for (let right = left + 1; right < owners.length; right += 1) {
        const first = Math.min(owners[left], owners[right]);
        const second = Math.max(owners[left], owners[right]);
        const key = first + '|' + second;
        sharedPoints.set(key, (sharedPoints.get(key) || 0) + 1);
      }
    }
  });
  sharedPoints.forEach(function(count, key) {
    if (count < 2) return;
    const pair = key.split('|').map(Number);
    graph[pair[0]].add(pair[1]);
    graph[pair[1]].add(pair[0]);
  });
  const componentFor = function() {
    const component = Array(rows.length).fill(-1);
    let id = 0;
    for (let start = 0; start < rows.length; start += 1) {
      if (component[start] >= 0) continue;
      const queue = [start];
      component[start] = id;
      while (queue.length) {
        const current = queue.shift();
        graph[current].forEach(function(next) {
          if (component[next] < 0) {
            component[next] = id;
            queue.push(next);
          }
        });
      }
      id += 1;
    }
    return {ids: component, count: id};
  };
  // Coastal islands and PRG topology repairs can be separate pieces. Join
  // each such source component to its nearest mainland unit before growing
  // constituencies; no already-connected land is bridged this way.
  let components = componentFor();
  while (components.count > 1) {
    let pair = null;
    let distance = Infinity;
    for (let left = 0; left < rows.length; left += 1) {
      for (let right = left + 1; right < rows.length; right += 1) {
        if (components.ids[left] === components.ids[right]) continue;
        const dx = rows[left].center[0] - rows[right].center[0];
        const dy = rows[left].center[1] - rows[right].center[1];
        const candidate = dx * dx + dy * dy;
        if (candidate < distance) {
          distance = candidate;
          pair = [left, right];
        }
      }
    }
    graph[pair[0]].add(pair[1]);
    graph[pair[1]].add(pair[0]);
    components = componentFor();
  }
  return graph;
}

function weightedGroups(rows, count, minimumUnits) {
  const minimum = minimumUnits || 1;
  assert(rows.length >= count * minimum,
    'not enough administrative units for ' + count + ' seats');
  const graph = connectedGraph(rows);
  const groups = [];
  const remaining = new Set(rows.map(function(row, index) { return index; }));
  for (let groupIndex = 0; groupIndex < count - 1; groupIndex += 1) {
    const groupsLeft = count - groupIndex;
    const target = Array.from(remaining).reduce(function(sum, index) {
      return sum + rows[index].electorate;
    }, 0) / groupsLeft;
    const root = Array.from(remaining).sort(function(left, right) {
      return rows[left].center[0] - rows[right].center[0] ||
        rows[left].center[1] - rows[right].center[1];
    })[0];
    const parent = new Map([[root, -1]]);
    const order = [];
    const stack = [root];
    while (stack.length) {
      const current = stack.pop();
      order.push(current);
      const neighbors = Array.from(graph[current]).filter(function(next) {
        return remaining.has(next) && !parent.has(next);
      }).sort(function(left, right) {
        const leftDistance = Math.pow(
          rows[left].center[0] - rows[current].center[0], 2
        ) + Math.pow(rows[left].center[1] - rows[current].center[1], 2);
        const rightDistance = Math.pow(
          rows[right].center[0] - rows[current].center[0], 2
        ) + Math.pow(rows[right].center[1] - rows[current].center[1], 2);
        return rightDistance - leftDistance;
      });
      neighbors.forEach(function(next) {
        parent.set(next, current);
        stack.push(next);
      });
    }
    assert.strictEqual(order.length, remaining.size, 'remainder lost contiguity');
    const subtree = new Map();
    const subtreeWeight = new Map();
    order.slice().reverse().forEach(function(index) {
      const members = [index];
      let weight = rows[index].electorate;
      order.forEach(function(child) {
        if (parent.get(child) === index && subtree.has(child)) {
          members.push.apply(members, subtree.get(child));
          weight += subtreeWeight.get(child);
        }
      });
      subtree.set(index, members);
      subtreeWeight.set(index, weight);
    });
    const candidates = order.filter(function(index) {
      const size = subtree.get(index).length;
      return index !== root && size >= minimum &&
        remaining.size - size >= (groupsLeft - 1) * minimum;
    }).sort(function(left, right) {
      return Math.abs(subtreeWeight.get(left) - target) -
        Math.abs(subtreeWeight.get(right) - target) || left - right;
    });
    assert(candidates.length, 'no connected constituency cut found');
    const chosen = subtree.get(candidates[0]);
    groups.push(chosen.map(function(index) { return rows[index]; }));
    chosen.forEach(function(index) { remaining.delete(index); });
  }
  groups.push(Array.from(remaining).map(function(index) { return rows[index]; }));
  return groups;
}

function aggregateProfile(rows) {
  const result = {left: 0, ko: 0, pis: 0, psl: 0, konf: 0, other: 0};
  let total = 0;
  rows.forEach(function(row) {
    const weight = row.electorate;
    total += weight;
    Object.keys(result).forEach(function(id) {
      result[id] += number(row.profile[id]) * weight;
    });
  });
  Object.keys(result).forEach(function(id) {
    result[id] = Math.round(result[id] / Math.max(1, total) * 1000000) / 1000000;
  });
  return result;
}

function compactGeometry(collection, propertyNames) {
  collection.features.forEach(function(feature) {
    const properties = {};
    propertyNames.forEach(function(name) { properties[name] = feature.properties[name]; });
    feature.properties = properties;
  });
  delete collection.crs;
  return collection;
}

function mapshaperFile(shapefile, output, simplify, landMask) {
  run(mapshaper, [
    shapefile,
    '-clip', landMask,
    '-filter-fields', 'JPT_KOD_JE,JPT_NAZWA_',
    '-rename-fields', 'teryt=JPT_KOD_JE,name=JPT_NAZWA_',
    '-simplify', simplify, 'keep-shapes',
    '-o', output, 'format=geojson', 'precision=0.0005',
  ], {stdio: 'inherit'});
}

function dissolveGeometry(collection, temp, name, field, copyFields) {
  const input = path.join(temp, name + '-parts.geojson');
  const output = path.join(temp, name + '.geojson');
  fs.writeFileSync(input, JSON.stringify(collection));
  run(mapshaper, [
    input, '-dissolve', field, 'copy-fields=' + copyFields.join(','),
    '-o', output, 'format=geojson', 'precision=0.0005',
  ], {stdio: 'inherit'});
  return JSON.parse(fs.readFileSync(output, 'utf8'));
}

function sceneSource(data) {
  return 'title: Load Polish electoral geography\n' +
    'on-arrival: {!\n' +
    'const electionGeographyHost = typeof window !== "undefined"\n' +
    '    ? window\n' +
    '    : (typeof globalThis !== "undefined" ? globalThis : this);\n' +
    'if (!electionGeographyHost.polandElectionGeographyData ||\n' +
    '    electionGeographyHost.polandElectionGeographyData.version != ' + data.version + ') {\n' +
    '    electionGeographyHost.polandElectionGeographyData = ' +
    JSON.stringify(data) + ';\n' +
    '}\n' +
    'if (this.game && this.game.scenes.poland_election_model &&\n' +
    '    typeof this._runActions == "function") {\n' +
    '    this._runActions(this.game.scenes.poland_election_model.onArrival);\n' +
    '}\n' +
    '!}\n';
}

function browserSource(geometry, metadata) {
  return '/* Generated by scripts/generate-election-geography.js. */\n' +
    '(function(root) {\n' +
    '  root.polandElectionGeography = ' + JSON.stringify({
      version: metadata.version,
      sources: metadata.sources,
      provinces: geometry.provinces,
      counties: geometry.counties,
      municipalities: geometry.municipalities,
      units: geometry.units,
      sejmDistricts: geometry.sejmDistricts,
      mixedConstituencies: geometry.mixedConstituencies,
      fptpConstituencies: geometry.fptpConstituencies,
    }) + ';\n' +
    '}(typeof window !== "undefined" ? window : globalThis));\n';
}

function provinceForDistrict(id) {
  if (id <= 3) return '02';
  if (id <= 5) return '04';
  if (id <= 7) return '06';
  if (id === 8) return '08';
  if (id <= 11) return '10';
  if (id <= 15) return '12';
  if (id <= 20) return '14';
  if (id === 21) return '16';
  if (id <= 23) return '18';
  if (id === 24) return '20';
  if (id <= 26) return '22';
  if (id <= 32) return '24';
  if (id === 33) return '26';
  if (id <= 35) return '28';
  if (id <= 39) return '30';
  return '32';
}

function main() {
  assert(fs.existsSync(mapshaper), 'Run npm install before generating geography');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dss-election-map-'));
  try {
    const archives = {};
    Object.keys(sources).forEach(function(id) { archives[id] = download(temp, id); });
    run('unzip', ['-q', archives.naturalEarthLand, 'ne_10m_land.*', '-d', temp]);
    run('unzip', [
      '-q', archives.prg2023,
      '*/A01_Granice_wojewodztw.*',
      '*/A02_Granice_powiatow.*',
      '*/A03_Granice_gmin.*',
      '*/A05_Granice_jednostek_ewidencyjnych.*',
      '-d', temp,
    ]);
    const prgDirectory = fs.readdirSync(temp).map(function(name) {
      return path.join(temp, name);
    }).find(function(candidate) {
      return fs.statSync(candidate).isDirectory() &&
        fs.existsSync(path.join(candidate, 'A03_Granice_gmin.shp'));
    });
    assert(prgDirectory, 'PRG shapefiles missing');
    const landSource = path.join(temp, 'ne_10m_land.shp');
    const landMask = path.join(temp, 'land-mask.shp');
    assert(fs.existsSync(landSource), 'Natural Earth land mask missing');
    // Keep sub-pixel peninsulas such as Hel visible on the national map.
    run(mapshaper, [landSource, '-buffer', '1200m', '-o', landMask], {stdio: 'inherit'});

    const provinceFile = path.join(temp, 'provinces.geojson');
    const countyFile = path.join(temp, 'counties.geojson');
    const municipalityFile = path.join(temp, 'municipalities.geojson');
    const unitFile = path.join(temp, 'units.geojson');
    mapshaperFile(path.join(prgDirectory, 'A01_Granice_wojewodztw.shp'), provinceFile, '5%', landMask);
    mapshaperFile(path.join(prgDirectory, 'A02_Granice_powiatow.shp'), countyFile, '2%', landMask);
    mapshaperFile(path.join(prgDirectory, 'A03_Granice_gmin.shp'), municipalityFile, '1%', landMask);
    mapshaperFile(path.join(prgDirectory, 'A05_Granice_jednostek_ewidencyjnych.shp'), unitFile, '1%', landMask);

    const provinces = JSON.parse(fs.readFileSync(provinceFile, 'utf8'));
    const counties = JSON.parse(fs.readFileSync(countyFile, 'utf8'));
    const municipalities = JSON.parse(fs.readFileSync(municipalityFile, 'utf8'));
    const units = JSON.parse(fs.readFileSync(unitFile, 'utf8'));
    const rows2019District = parseDelimited(csvFromZip(archives.pkw2019Districts));
    const rows2019Municipality = parseDelimited(csvFromZip(archives.pkw2019Municipalities));
    const rows2023District = parseDelimited(csvFromZip(archives.pkw2023Districts));
    const rows2023Municipality = parseDelimited(csvFromZip(archives.pkw2023Municipalities));

    const municipality2019 = new Map();
    rows2019Municipality.forEach(function(row) {
      const id = String(row['Kod TERYT'] || '').padStart(6, '0');
      if (!/^\d{6}$/.test(id)) return;
      const current = familyVotes(row);
      const previous = municipality2019.get(id);
      if (!previous) {
        municipality2019.set(id, current);
        return;
      }
      previous.valid += current.valid;
      Object.keys(previous.votes).forEach(function(family) {
        previous.votes[family] += current.votes[family];
      });
    });
    const municipality2023 = new Map();
    rows2023Municipality.forEach(function(row) {
      const id = String(row['TERYT Gminy'] || '').padStart(6, '0');
      if (!/^\d{6}$/.test(id)) return;
      const previous = municipality2023.get(id);
      if (!previous) {
        row._districtWeights = {};
        row._districtWeights[row['Nr okręgu']] = number(
          row['Liczba wyborców uprawnionych do głosowania']
        );
        municipality2023.set(id, row);
        return;
      }
      const electorate = number(row['Liczba wyborców uprawnionych do głosowania']);
      previous['Liczba wyborców uprawnionych do głosowania'] =
        number(previous['Liczba wyborców uprawnionych do głosowania']) + electorate;
      previous._districtWeights[row['Nr okręgu']] =
        (previous._districtWeights[row['Nr okręgu']] || 0) + electorate;
      previous['Nr okręgu'] = Object.keys(previous._districtWeights).sort(function(left, right) {
        return previous._districtWeights[right] - previous._districtWeights[left];
      })[0];
    });
    const district2023 = new Map();
    rows2023District.forEach(function(row) {
      district2023.set(number(row['Numer okręgu']), row);
    });

    provinces.features.forEach(function(feature) {
      feature.properties.id = String(feature.properties.teryt).slice(0, 2);
      feature.properties.name = feature.properties.name;
    });
    const provinceNames = new Map(provinces.features.map(function(feature) {
      return [feature.properties.id, feature.properties.name];
    }));
    counties.features.forEach(function(feature) {
      feature.properties.id = String(feature.properties.teryt).slice(0, 4);
      feature.properties.province = feature.properties.id.slice(0, 2);
    });

    const pkwMunicipalityMeta = new Map();
    municipality2023.forEach(function(row, id) {
      const election2019 = municipality2019.get(id) || {valid: 0, votes: {other: 1}};
      pkwMunicipalityMeta.set(id, {
        id: id,
        name: row.Gmina,
        provinceId: id.slice(0, 2),
        districtId: number(row['Nr okręgu']),
        electorate: number(row['Liczba wyborców uprawnionych do głosowania']),
        type: id.startsWith('1465') ? '8' : '',
        profile: shares(election2019.votes),
        rawVotes: election2019.votes,
      });
    });
    const municipalityMeta = new Map();
    municipalities.features = municipalities.features.filter(function(feature) {
      const prg = String(feature.properties.teryt || '');
      const id = prg.slice(0, 6);
      let meta = pkwMunicipalityMeta.get(id);
      if (!meta && id === '146501') {
        const children = Array.from(pkwMunicipalityMeta.values()).filter(function(row) {
          return row.id.startsWith('1465');
        });
        const votes = {left: 0, ko: 0, pis: 0, psl: 0, konf: 0, other: 0};
        children.forEach(function(row) {
          Object.keys(votes).forEach(function(party) {
            votes[party] += number(row.rawVotes[party]);
          });
        });
        meta = {
          id: id, name: feature.properties.name, provinceId: '14',
          districtId: 19,
          electorate: children.reduce(function(sum, row) { return sum + row.electorate; }, 0),
          type: '1', profile: shares(votes), rawVotes: votes,
        };
      }
      if (!meta) return false;
      meta = Object.assign({}, meta, {
        name: feature.properties.name,
        type: prg.slice(6, 7),
      });
      municipalityMeta.set(id, meta);
      feature.properties = {
        id: id, name: meta.name, province: meta.provinceId,
        county: id.slice(0, 4), district: meta.districtId,
      };
      return true;
    });

    const unitCounts = new Map();
    units.features.forEach(function(feature) {
      const id = String(feature.properties.teryt || '').match(/^\d{6}/);
      if (id && municipalityMeta.has(id[0])) {
        unitCounts.set(id[0], (unitCounts.get(id[0]) || 0) + roughArea(feature.geometry));
      }
    });
    const unitRows = [];
    units.features = units.features.filter(function(feature, index) {
      const match = String(feature.properties.teryt || '').match(/^\d{6}/);
      if (!match) return false;
      const municipality = pkwMunicipalityMeta.get(match[0]) ||
        municipalityMeta.get(match[0]);
      if (!municipality) return false;
      const area = roughArea(feature.geometry);
      const electorate = Math.max(
        1,
        municipality.electorate * area / Math.max(area, unitCounts.get(match[0]) || area)
      );
      const name = feature.properties.name;
      const row = {
        feature: feature,
        id: 'u' + String(index + 1).padStart(4, '0'),
        municipalityId: municipality.id,
        provinceId: municipality.provinceId,
        districtId: municipality.districtId,
        electorate: electorate,
        profile: municipality.profile,
        center: center(feature.geometry),
        urbanScore: /miasto|dzielnica/i.test(name) || ['1', '4', '8', '9'].includes(municipality.type)
          ? 1 : (municipality.type === '3' ? 0.5 : 0),
      };
      unitRows.push(row);
      feature.properties = {
        id: row.id,
        municipality: row.municipalityId,
        province: row.provinceId,
        district: row.districtId,
      };
      return true;
    });
    const unitMunicipalities = new Set(unitRows.map(function(row) {
      return row.municipalityId;
    }));
    municipalityMeta.forEach(function(municipality, municipalityId) {
      if (unitMunicipalities.has(municipalityId) ||
          (municipalityId === '146501' && unitRows.some(function(row) {
            return row.municipalityId.startsWith('1465');
          }))) return;
      const municipalityFeature = municipalities.features.find(function(feature) {
        return feature.properties.id === municipalityId;
      });
      assert(municipalityFeature, 'municipality geometry missing for ' + municipalityId);
      const feature = {
        type: 'Feature',
        geometry: JSON.parse(JSON.stringify(municipalityFeature.geometry)),
        properties: {}
      };
      const row = {
        feature: feature,
        id: 'ux' + String(unitRows.length + 1).padStart(4, '0'),
        municipalityId: municipality.id,
        provinceId: municipality.provinceId,
        districtId: municipality.districtId,
        electorate: municipality.electorate,
        profile: municipality.profile,
        center: center(feature.geometry),
        urbanScore: ['1', '4', '8', '9'].includes(municipality.type)
          ? 1 : (municipality.type === '3' ? 0.5 : 0),
      };
      feature.properties = {
        id: row.id, municipality: municipality.id,
        province: municipality.provinceId, district: municipality.districtId,
      };
      units.features.push(feature);
      unitRows.push(row);
    });

    const districtRows = rows2019District.map(function(row) {
      const id = number(row['Numer okręgu']);
      const result2019 = familyVotes(row);
      const magnitude = number((district2023.get(id) || {})['Liczba mandatów']);
      const committeeVotes = {
        left: result2019.votes.left,
        ko: result2019.votes.ko,
        pis: result2019.votes.pis,
        psl: result2019.votes.psl,
        konf: result2019.votes.konf,
        minority: result2019.columns.minority ? number(row[result2019.columns.minority]) : 0,
      };
      return {
        id: id,
        name: 'Sejm district ' + id + ' — ' + (district2023.get(id) || {})['Siedziba OKW'],
        provinceId: provinceForDistrict(id),
        magnitude: magnitude,
        electorate: number((district2023.get(id) || {})['Wyborcy']) ||
          number(row['Liczba wyborców uprawnionych do głosowania']),
        profile: shares(result2019.votes),
        result2019: {
          votes: shares(result2019.votes),
          seats: dhondt(
            committeeVotes,
            ['left', 'ko', 'pis', 'psl', 'konf'].concat(committeeVotes.minority ? ['minority'] : []),
            magnitude
          ),
        },
      };
    }).sort(function(a, b) { return a.id - b.id; });

    assert.strictEqual(districtRows.length, 41);
    assert.strictEqual(districtRows.reduce(function(sum, row) { return sum + row.magnitude; }, 0), 460);
    districtRows.forEach(function(row) {
      const localUnits = unitRows.filter(function(unit) {
        return unit.districtId === row.id;
      });
      row.localElectorate = Math.round(localUnits.reduce(function(sum, unit) {
        return sum + unit.electorate;
      }, 0));
      row.urbanScore = localUnits.reduce(function(sum, unit) {
        return sum + unit.urbanScore * unit.electorate;
      }, 0) / Math.max(1, row.localElectorate);
      row.countyIds = Array.from(new Set(localUnits.map(function(unit) {
        return unit.municipalityId.slice(0, 4);
      }))).sort();
    });
    const districtCounts = apportion(230, districtRows, function(row) {
      return row.localElectorate;
    });
    const parentSeats = [];
    districtRows.forEach(function(district) {
      const districtUnits = unitRows.filter(function(row) { return row.districtId === district.id; });
      const seatCount = districtCounts.get(district);
      const targetElectorate = district.localElectorate / seatCount;
      // A few city counties are one cadastral unit in PRG. Split only those
      // oversized units so every hypothetical constituency has visible land.
      while (districtUnits.length < seatCount) {
        districtUnits.sort(function(a, b) { return b.electorate - a.electorate; });
        const split = splitUnitRow(districtUnits.shift(), units.features);
        districtUnits.push(split[0], split[1]);
      }
      let oversized = districtUnits.find(function(row) {
        return row.electorate > targetElectorate * 1.15;
      });
      while (oversized) {
        const split = splitUnitRow(oversized, units.features);
        districtUnits.splice(districtUnits.indexOf(oversized), 1, split[0], split[1]);
        oversized = districtUnits.find(function(row) {
          return row.electorate > targetElectorate * 1.15;
        });
      }
      const groups = weightedGroups(districtUnits, seatCount, 1);
      groups.forEach(function(group) {
        const parentId = 's' + String(parentSeats.length + 1).padStart(3, '0');
        if (group.length === 1) {
          group = splitUnitRow(group[0], units.features);
        }
        const childTarget = group.reduce(function(sum, row) {
          return sum + row.electorate;
        }, 0) / 2;
        let oversizedChild = group.find(function(row) {
          return row.electorate > childTarget * 1.15;
        });
        while (oversizedChild) {
          const split = splitUnitRow(oversizedChild, units.features);
          group.splice(group.indexOf(oversizedChild), 1, split[0], split[1]);
          oversizedChild = group.find(function(row) {
            return row.electorate > childTarget * 1.15;
          });
        }
        const children = weightedGroups(group, 2, 1);
        const parent = {
          id: parentId,
          name: 'Constituency ' + (parentSeats.length + 1),
          provinceId: district.provinceId,
          districtId: district.id,
          electorate: Math.round(group.reduce(function(sum, row) { return sum + row.electorate; }, 0)),
          profile: aggregateProfile(group),
          urbanScore: group.reduce(function(sum, row) {
            return sum + row.urbanScore * row.electorate;
          }, 0) / group.reduce(function(sum, row) { return sum + row.electorate; }, 0),
          countyIds: Array.from(new Set(group.map(function(row) {
            return row.municipalityId.slice(0, 4);
          }))).sort(),
          contiguous: true,
          children: [],
        };
        parent.targetElectorate = Math.round(
          district.localElectorate / seatCount
        );
        parent.electorateDeviationPct = Math.round(
          (parent.electorate - parent.targetElectorate) * 10000 /
            Math.max(1, parent.targetElectorate)
        ) / 100;
        children.forEach(function(child, childIndex) {
          const childId = 'j' + String(parentSeats.length * 2 + childIndex + 1).padStart(3, '0');
          const childSeat = {
            id: childId,
            name: 'Constituency ' + (parentSeats.length * 2 + childIndex + 1),
            provinceId: district.provinceId,
            districtId: district.id,
            parentId: parentId,
            electorate: Math.round(child.reduce(function(sum, row) { return sum + row.electorate; }, 0)),
            profile: aggregateProfile(child),
            urbanScore: child.reduce(function(sum, row) {
              return sum + row.urbanScore * row.electorate;
            }, 0) / child.reduce(function(sum, row) { return sum + row.electorate; }, 0),
            countyIds: Array.from(new Set(child.map(function(row) {
              return row.municipalityId.slice(0, 4);
            }))).sort(),
            contiguous: true,
          };
          childSeat.targetElectorate = Math.round(parent.electorate / 2);
          childSeat.electorateDeviationPct = Math.round(
            (childSeat.electorate - childSeat.targetElectorate) * 10000 /
              Math.max(1, childSeat.targetElectorate)
          ) / 100;
          parent.children.push(childSeat);
          child.forEach(function(row) {
            row.feature.properties.mixed = parentId;
            row.feature.properties.fptp = childId;
          });
        });
        parentSeats.push(parent);
      });
    });
    assert.strictEqual(parentSeats.length, 230);
    parentSeats.slice().sort(function(a, b) {
      return b.urbanScore - a.urbanScore || a.id.localeCompare(b.id);
    }).forEach(function(row, index) {
      row.pool = index < 138 ? 'urban' : 'rural';
      row.children.forEach(function(child) { child.pool = row.pool; });
    });
    const childSeats = parentSeats.reduce(function(all, row) {
      return all.concat(row.children);
    }, []);
    assert.strictEqual(childSeats.length, 460);

    const listMagnitudes = apportion(230, districtRows, function(row) { return row.electorate; });
    districtRows.forEach(function(row) { row.mixedMagnitude = listMagnitudes.get(row); });
    assert.strictEqual(districtRows.reduce(function(sum, row) {
      return sum + row.mixedMagnitude;
    }, 0), 230);

    const provinceRows = Array.from(provinceNames).map(function(entry) {
      const provinceDistricts = districtRows.filter(function(row) { return row.provinceId === entry[0]; });
      return {
        id: entry[0], name: entry[1],
        districtIds: provinceDistricts.map(function(row) { return row.id; }),
        electorate: provinceDistricts.reduce(function(sum, row) { return sum + row.electorate; }, 0),
      };
    }).sort(function(a, b) { return a.id.localeCompare(b.id); });
    assert.strictEqual(provinceRows.length, 16);

    const countyRows = counties.features.map(function(feature) {
      const id = feature.properties.id;
      const rows = Array.from(municipalityMeta.values()).filter(function(row) {
        return row.id.slice(0, 4) === id;
      });
      const electorate = rows.reduce(function(sum, row) {
        return sum + row.electorate;
      }, 0);
      const votes = {left: 0, ko: 0, pis: 0, psl: 0, konf: 0, other: 0};
      rows.forEach(function(row) {
        Object.keys(votes).forEach(function(family) {
          votes[family] += number(row.rawVotes[family]);
        });
      });
      return {
        id: id,
        name: feature.properties.name,
        provinceId: id.slice(0, 2),
        electorate: electorate,
        profile: shares(votes),
        districtIds: Array.from(new Set(rows.map(function(row) {
          return row.districtId;
        }))).sort(function(a, b) { return a - b; }),
        countyIds: [id],
        urbanScore: rows.reduce(function(sum, row) {
          const score = ['1', '4', '8', '9'].includes(row.type)
            ? 1 : (row.type === '3' ? 0.5 : 0);
          return sum + score * row.electorate;
        }, 0) / Math.max(1, electorate),
      };
    }).filter(function(row) { return row.electorate > 0; })
      .sort(function(a, b) { return a.id.localeCompare(b.id); });
    const countyIds = new Set(countyRows.map(function(row) { return row.id; }));
    counties.features = counties.features.filter(function(feature) {
      return countyIds.has(feature.properties.id);
    });
    assert(countyRows.length >= 370 && countyRows.length <= 380,
      'unexpected county count');

    const data = {
      version: 3,
      sourceVersion: 'PRG-2023-PKW-2019-2023',
      families: ['left', 'ko', 'pis', 'psl', 'konf', 'other'],
      provinces: provinceRows,
      counties: countyRows,
      districts: districtRows,
      mixedDistricts: parentSeats.map(function(row) {
        const result = Object.assign({}, row);
        delete result.children;
        return result;
      }),
      fptpDistricts: childSeats,
      archive2019: {
        key: '2019-10', label: '2019 parliamentary election', system: 'proportional',
        districts: districtRows.map(function(row) {
          return {
            id: row.id, provinceId: row.provinceId, electorate: row.electorate,
            votes: row.result2019.votes, seats: row.result2019.seats,
          };
        }),
      },
    };
    const sourceMetadata = Object.keys(sources).map(function(id) {
      return {id: id, url: sources[id].url, sha256: sources[id].sha256};
    });
    const metadata = {version: data.version, sources: sourceMetadata};
    const sejmDistricts = dissolveGeometry(
      municipalities, temp, 'sejm-districts', 'district', ['province']
    );
    const mixedConstituencies = dissolveGeometry(
      units, temp, 'mixed-constituencies', 'mixed', ['province', 'district']
    );
    const fptpConstituencies = dissolveGeometry(
      units, temp, 'fptp-constituencies', 'fptp', ['province', 'district', 'mixed']
    );
    assert.deepStrictEqual([
      sejmDistricts.features.length,
      mixedConstituencies.features.length,
      fptpConstituencies.features.length,
    ], [41, 230, 460]);
    compactGeometry(provinces, ['id', 'name']);
    compactGeometry(counties, ['id', 'name', 'province']);
    compactGeometry(municipalities, ['id', 'name', 'province', 'county', 'district']);
    compactGeometry(units, ['id', 'municipality', 'province', 'district', 'mixed', 'fptp']);
    fs.writeFileSync(outputScene, sceneSource(data));
    fs.writeFileSync(outputBrowser, browserSource({
      provinces: provinces, counties: counties,
      municipalities: municipalities, units: units,
      sejmDistricts: sejmDistricts,
      mixedConstituencies: mixedConstituencies,
      fptpConstituencies: fptpConstituencies,
    }, metadata));
    console.log('Wrote ' + path.relative(projectRoot, outputScene));
    console.log('Wrote ' + path.relative(projectRoot, outputBrowser));
  } finally {
    fs.rmSync(temp, {recursive: true, force: true});
  }
}

main();
