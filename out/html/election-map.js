/* Offline Sejm and presidential maps. Geometry is generated from PRG data. */
(function(root) {
  'use strict';

  var colors = {
    left: '#c52a35', ko: '#e69f00', pis: '#315f9f', psl: '#4c9b48',
    p2050: '#d4ad00', konf: '#66408d', minority: '#2f8f83', other: '#777777'
  };
  var names = {
    left: 'Lewica', ko: 'Koalicja Obywatelska', pis: 'Prawo i Sprawiedliwość',
    psl: 'PSL', p2050: 'Polska 2050', konf: 'Konfederacja',
    minority: 'German Minority', other: 'Other', democratic_list: 'Democratic list',
    left_coalition: 'Left coalition', third_way: 'Third Way',
    right_2027: 'Prawica', common_centre_2027: 'Common Centre 2027',
    third_way_2027: 'Third Way 2027'
  };
  var mapSerial = 0;

  function state() {
    var engine = root.dendryUI && root.dendryUI.dendryEngine;
    return engine && engine.state ? engine.state.qualities : null;
  }

  function model() {
    return root.polandElectionModel;
  }

  function geography() {
    return root.polandElectionGeography;
  }

  function text(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(character) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character];
    });
  }

  function sum(object) {
    return Object.keys(object || {}).reduce(function(total, id) {
      return total + (Number(object[id]) || 0);
    }, 0);
  }

  function label(snapshot, id) {
    var candidate = (snapshot.candidates || []).find(function(row) {
      return row.id === id;
    });
    return candidate ? candidate.name : (names[id] || String(id).replace(/_/g, ' '));
  }

  function family(snapshot, id) {
    var candidate = (snapshot.candidates || []).find(function(row) {
      return row.id === id;
    });
    if (candidate) return candidate.family;
    var electionModel = model();
    return electionModel && electionModel.familyFor
      ? electionModel.familyFor(id) : id;
  }

  function color(snapshot, id) {
    var target = family(snapshot, id);
    if (target === 'p2050') return colors.p2050;
    if (colors[target]) return colors[target];
    if (/left|democratic/.test(id)) return colors.left;
    if (/right|social_conservative/.test(id)) return colors.pis;
    if (/third|centre|centrum/.test(id)) return colors.p2050;
    return colors.other;
  }

  function winner(row) {
    if (row.winnerId) return row.winnerId;
    return Object.keys(row.votes || {}).sort(function(left, right) {
      return (Number(row.votes[right]) || 0) - (Number(row.votes[left]) || 0);
    })[0] || 'other';
  }

  function ranked(row) {
    return Object.keys(row.votes || {}).sort(function(left, right) {
      return (Number(row.votes[right]) || 0) - (Number(row.votes[left]) || 0) ||
        left.localeCompare(right);
    }).slice(0, 4);
  }

  function official2019() {
    var electionModel = model();
    var source = electionModel && electionModel.geography &&
      electionModel.geography.archive2019;
    if (!source) return null;
    var districts = source.districts.map(function(row) {
      var votes = {};
      Object.keys(row.votes).forEach(function(id) { votes[id] = row.votes[id] * 100; });
      return {
        id: row.id, name: 'Sejm district ' + row.id,
        provinceId: row.provinceId, electorate: row.electorate,
        votes: votes, seats: row.seats, partySeats: row.seats,
        winnerId: winner({votes: votes})
      };
    });
    var provinces = electionModel.geography.provinces.map(function(province) {
      var rows = districts.filter(function(row) { return row.provinceId === province.id; });
      var counts = {};
      var seats = {};
      rows.forEach(function(row) {
        Object.keys(row.votes).forEach(function(id) {
          counts[id] = (counts[id] || 0) + row.votes[id] * row.electorate;
        });
        Object.keys(row.seats).forEach(function(id) {
          seats[id] = (seats[id] || 0) + row.seats[id];
        });
      });
      var electorate = rows.reduce(function(total, row) { return total + row.electorate; }, 0);
      var votes = {};
      Object.keys(counts).forEach(function(id) { votes[id] = counts[id] / Math.max(1, electorate); });
      return {
        id: province.id, name: province.name, electorate: electorate,
        votes: votes, seats: seats, partySeats: seats, winnerId: winner({votes: votes})
      };
    });
    return {
      type: 'sejm', key: source.key, label: source.label, system: 'proportional',
      districts: districts, listDistricts: districts, provinces: provinces,
      committees: ['left', 'ko', 'pis', 'psl', 'konf', 'minority']
    };
  }

  function archives(qualities) {
    var result = [];
    var baseline = official2019();
    if (baseline) result.push(baseline);
    result = result.concat(qualities.poland_election_map_archive || []);
    result = result.concat(qualities.poland_presidential_map_archive || []);
    return result.sort(function(left, right) {
      return String(left.key).localeCompare(String(right.key)) ||
        (Number(left.round) || 0) - (Number(right.round) || 0);
    });
  }

  function sourceSnapshot(host, qualities) {
    var source = host.getAttribute('data-election-map-source') || 'archive';
    var all = archives(qualities);
    if (source === 'campaign') {
      return (qualities.poland_election_current_forecast &&
        qualities.poland_election_current_forecast.point) || official2019();
    }
    if (source === 'sejm-2023') {
      return all.find(function(row) { return row.type === 'sejm' && row.key === '2023-10'; });
    }
    if (source === 'sejm-latest') {
      return all.filter(function(row) { return row.type === 'sejm'; }).slice(-1)[0];
    }
    if (source.indexOf('president-') === 0) {
      var key = {
        'president-2020-r1': '2020-06-r1',
        'president-2020-r2': '2020-07-r2',
        'president-2025-r1': '2025-05-r1',
        'president-2025-r2': '2025-06-r2'
      }[source];
      return all.find(function(row) { return row.type === 'president' && row.key === key; });
    }
    var index = host._electionMapArchiveIndex;
    return all[Math.max(0, Math.min(all.length - 1,
      Number.isFinite(index) ? index : all.length - 1))];
  }

  function forecastFor(host, qualities, snapshot) {
    if (host.getAttribute('data-election-map-source') !== 'campaign') return null;
    var current = qualities.poland_election_current_forecast;
    if (!current || !snapshot) return null;
    var draft = qualities.regional_campaign_draft;
    if (!draft || !draft.issue || !draft.provinceId || !qualities.poland_election_forecast_input) {
      return current;
    }
    var options = Object.assign({}, qualities.poland_election_forecast_input, {
      state: qualities,
      includeDraft: true,
      seed: current.seed
    });
    var after = model().forecastSejm(options);
    return {
      type: 'forecast', key: current.key, system: after.point.system,
      point: model().snapshot(after.point, 'forecast-draft', 'Draft forecast'),
      committeeRanges: after.committeeRanges,
      districtConfidence: after.districtConfidence,
      provinceConfidence: after.provinceConfidence,
      seed: after.seed, draws: after.draws,
      before: current
    };
  }

  function regionData(snapshot, view, selectedProvince) {
    var geo = geography();
    if (view === 'province') {
      return {collection: geo.provinces, rows: snapshot.provinces || [], property: 'id'};
    }
    if (snapshot.type === 'president') {
      return {
        collection: geo.counties,
        rows: (snapshot.counties || []).filter(function(row) {
          return !selectedProvince || row.provinceId === selectedProvince;
        }),
        property: 'id'
      };
    }
    var collection = snapshot.system === 'proportional' ? geo.municipalities : geo.units;
    var property = snapshot.system === 'mixed_230' ? 'mixed' :
      (snapshot.system === 'fptp_460' ? 'fptp' : 'district');
    return {
      collection: collection,
      rows: (snapshot.districts || []).filter(function(row) {
        return !selectedProvince || row.provinceId === selectedProvince;
      }),
      property: property
    };
  }

  function confidence(forecast, view, id) {
    if (!forecast) return null;
    var table = view === 'province' ? forecast.provinceConfidence : forecast.districtConfidence;
    return table && table[id];
  }

  function resultDetails(snapshot, row, forecast, view) {
    if (!row) return '<p>Point to or focus a region to inspect it.</p>';
    var prediction = confidence(forecast, view, String(row.id));
    var html = '<h3>' + text(row.name) + '</h3>' +
      '<p><b>Leader:</b> ' + text(label(snapshot, prediction ? prediction.winnerId : winner(row))) + '</p>';
    if (forecast) {
      html += prediction
        ? '<p><b>Win confidence:</b> ' + Math.round(prediction.probability * 100) +
          '% · ' + text(prediction.band) + '</p>'
        : '<p>Forecast confidence is unavailable for this aggregate.</p>';
      html += '<p class="map-forecast-note">Exact forecast vote shares are hidden.</p>';
    } else {
      html += '<ol class="map-top-four">' + ranked(row).map(function(id) {
        return '<li><span>' + text(label(snapshot, id)) + '</span><b>' +
          (Number(row.votes[id]) || 0).toFixed(1) + '%</b></li>';
      }).join('') + '</ol>';
    }
    html += '<p><b>Electorate:</b> ' + Math.round(Number(row.electorate) || 0)
      .toLocaleString('en-GB') + '</p>';
    var seats = row.partySeats || row.seats || {};
    var elected = Object.keys(seats).filter(function(id) { return Number(seats[id]) > 0; })
      .sort(function(left, right) { return seats[right] - seats[left]; });
    if (elected.length) {
      html += '<h4>MPs elected</h4><ul class="map-mp-list">' + elected.map(function(id) {
        return '<li><span>' + text(label(snapshot, id)) + '</span><b>' + seats[id] + '</b></li>';
      }).join('') + '</ul>';
    }
    return html;
  }

  function rangeSummary(snapshot, forecast, heading) {
    if (!forecast) return '';
    var ids = Object.keys(forecast.committeeRanges || {}).sort(function(left, right) {
      return forecast.committeeRanges[right].point - forecast.committeeRanges[left].point;
    }).slice(0, 6);
    return '<section class="map-range-summary"><h4>' + text(heading) + '</h4>' +
      '<ul>' + ids.map(function(id) {
        var range = forecast.committeeRanges[id];
        return '<li><span>' + text(label(snapshot, id)) + '</span><b>' +
          range.low + '–' + range.high + ' MPs</b></li>';
      }).join('') + '</ul></section>';
  }

  function textualTable(snapshot, rows, forecast, view) {
    return '<details class="map-text-results"><summary>Accessible textual results table</summary>' +
      '<div class="map-table-scroll"><table><thead><tr><th>Region</th><th>Leader</th>' +
      (forecast ? '<th>Confidence</th>' : '<th>Top four</th>') +
      '<th>MPs</th></tr></thead><tbody>' + rows.map(function(row) {
        var prediction = confidence(forecast, view, String(row.id));
        var lead = prediction ? prediction.winnerId : winner(row);
        var top = forecast
          ? (prediction ? Math.round(prediction.probability * 100) + '% ' + prediction.band : '—')
          : ranked(row).map(function(id) {
            return label(snapshot, id) + ' ' + (Number(row.votes[id]) || 0).toFixed(1) + '%';
          }).join('; ');
        return '<tr><th scope="row">' + text(row.name) + '</th><td>' +
          text(label(snapshot, lead)) + '</td><td>' + text(top) + '</td><td>' +
          Math.round(sum(row.partySeats || row.seats || {})) + '</td></tr>';
      }).join('') + '</tbody></table></div></details>';
  }

  function campaignControls(host, qualities, snapshot, forecast) {
    var electionModel = model();
    var draft = qualities.regional_campaign_draft || {};
    var issueButtons = Object.keys(electionModel.issues).map(function(id) {
      var selected = draft.issue === id;
      return '<button type="button" data-campaign-issue="' + text(id) + '"' +
        (selected ? ' class="selected" aria-pressed="true"' : ' aria-pressed="false"') +
        '>' + text(electionModel.issues[id].label) + '</button>';
    }).join('');
    var provinceOptions = electionModel.geography.provinces.map(function(row) {
      return '<option value="' + text(row.id) + '"' +
        (String(draft.provinceId) === String(row.id) ? ' selected' : '') + '>' +
        text(row.name) + '</option>';
    }).join('');
    var before = forecast && forecast.before ? forecast.before :
      qualities.poland_election_current_forecast;
    var complete = Boolean(draft.issue && draft.provinceId);
    return '<section class="regional-campaign-controls" aria-label="Regional campaign choices">' +
      '<fieldset><legend>National campaign issue</legend><div class="campaign-issue-grid">' +
      issueButtons + '</div></fieldset><label>Free province tour<select data-campaign-province>' +
      '<option value="">Choose a voivodeship</option>' + provinceOptions + '</select></label>' +
      '<div class="map-range-comparison">' + rangeSummary(snapshot, before, 'Before selection') +
      rangeSummary(snapshot, forecast && forecast.before ? forecast : null, 'After draft') + '</div>' +
      '<button type="button" class="campaign-confirm" data-campaign-confirm' +
      (complete ? '' : ' disabled') + '>Confirm issue and tour</button></section>';
  }

  function render(host) {
    var qualities = state();
    var geo = geography();
    var electionModel = model();
    if (!qualities || !geo || !electionModel || typeof d3 === 'undefined') {
      host.innerHTML = '<p class="map-unavailable">Election map data is unavailable.</p>';
      return;
    }
    var snapshot = sourceSnapshot(host, qualities);
    if (!snapshot) {
      host.innerHTML = '<p class="map-unavailable">No certified regional result is available yet.</p>';
      return;
    }
    var source = host.getAttribute('data-election-map-source');
    var campaign = source === 'campaign';
    var forecast = forecastFor(host, qualities, snapshot);
    if (forecast && forecast.point) snapshot = forecast.point;
    var ui = host._electionMapState || {view: 'province', province: '', locked: ''};
    host._electionMapState = ui;
    host._electionMapId = host._electionMapId || ++mapSerial;
    var allArchives = archives(qualities);
    var archiveControl = '';
    if (source === 'archive') {
      var currentIndex = allArchives.indexOf(sourceSnapshot(host, qualities));
      archiveControl = '<label class="map-archive-label">Election archive<select data-map-archive>' +
        allArchives.map(function(row, index) {
          return '<option value="' + index + '"' + (index === currentIndex ? ' selected' : '') + '>' +
            text(row.label + (row.round ? ' · round ' + row.round : '')) + '</option>';
        }).join('') + '</select></label>';
    }
    var detailLabel = snapshot.type === 'president' ? 'Counties' :
      (snapshot.system === 'mixed_230' ? '230 constituencies' :
        (snapshot.system === 'fptp_460' ? '460 constituencies' : '41 Sejm districts'));
    host.innerHTML = (campaign ? campaignControls(host, qualities, snapshot, forecast) : '') +
      '<section class="election-map" aria-label="' + text(snapshot.label || 'Election map') + '">' +
      '<header><div><span class="map-kicker">' +
      text(snapshot.type === 'president' ? 'Presidential election' : 'Sejm election') +
      '</span><h2>' + text(snapshot.label || 'Regional result') + '</h2></div>' + archiveControl + '</header>' +
      '<div class="map-view-controls" role="group" aria-label="Map detail">' +
      '<button type="button" data-map-view="province" aria-pressed="' + (ui.view === 'province') +
      '">Voivodeships</button><button type="button" data-map-view="district" aria-pressed="' +
      (ui.view === 'district') + '">' + text(detailLabel) + '</button></div>' +
      '<div class="map-layout"><div class="map-svg-wrap"><svg role="img" aria-label="Interactive map of election winners"></svg>' +
      '<div class="map-legend" aria-label="Winner legend"></div></div>' +
      '<aside class="map-details" aria-live="polite"><p>Hover, focus, or tap a region.</p></aside></div>' +
      '<div class="map-text-host"></div></section>';

    var data = regionData(snapshot, ui.view, ui.province);
    var rowById = {};
    data.rows.forEach(function(row) { rowById[String(row.id)] = row; });
    var features = data.collection.features.filter(function(feature) {
      var properties = feature.properties || {};
      var id = String(properties[data.property] == null ? '' : properties[data.property]);
      return rowById[id] && (!ui.province || String(properties.province || properties.id) === ui.province);
    });
    var svg = d3.select(host.querySelector('svg'));
    var width = 720;
    var height = 650;
    svg.attr('viewBox', '0 0 ' + width + ' ' + height);
    var collection = {type: 'FeatureCollection', features: features};
    var projection = d3.geoMercator().fitExtent([[10, 10], [width - 10, height - 10]], collection);
    var path = d3.geoPath(projection);
    var visibleWinners = [];
    data.rows.forEach(function(row) {
      var id = forecast && confidence(forecast, ui.view, String(row.id))
        ? confidence(forecast, ui.view, String(row.id)).winnerId : winner(row);
      if (!visibleWinners.includes(id)) visibleWinners.push(id);
    });
    var defs = svg.append('defs');
    visibleWinners.forEach(function(id, index) {
      var pattern = defs.append('pattern').attr(
        'id', 'winner-' + host._electionMapId + '-' + index
      )
        .attr('patternUnits', 'userSpaceOnUse').attr('width', 8).attr('height', 8);
      pattern.append('rect').attr('width', 8).attr('height', 8).attr('fill', color(snapshot, id));
      pattern.append('path').attr('d', index % 3 === 0 ? 'M-2,2 L2,-2 M0,8 L8,0 M6,10 L10,6' :
        (index % 3 === 1 ? 'M0,2 L8,2 M0,6 L8,6' : 'M2,0 L2,8 M6,0 L6,8'))
        .attr('stroke', 'rgba(255,255,255,.48)').attr('stroke-width', 1.15);
    });
    var patternFor = function(id) {
      return 'url(#winner-' + host._electionMapId + '-' + visibleWinners.indexOf(id) + ')';
    };
    var details = host.querySelector('.map-details');
    var show = function(row) {
      details.innerHTML = resultDetails(snapshot, row, forecast, ui.view);
    };
    var paths = svg.append('g').selectAll('path').data(features).enter().append('path')
      .attr('d', path).attr('class', 'election-region')
      .attr('fill', function(feature) {
        var row = rowById[String(feature.properties[data.property])];
        var prediction = row && confidence(forecast, ui.view, String(row.id));
        return patternFor(prediction ? prediction.winnerId : winner(row));
      })
      .attr('data-region', function(feature) { return feature.properties[data.property]; })
      .attr('tabindex', function(feature, index, nodes) {
        var id = String(feature.properties[data.property]);
        return nodes.findIndex(function(node) { return String(node.__data__.properties[data.property]) === id; }) === index ? 0 : -1;
      })
      .attr('aria-label', function(feature) {
        var row = rowById[String(feature.properties[data.property])];
        var prediction = confidence(forecast, ui.view, String(row.id));
        return row.name + '. Leader ' +
          label(snapshot, prediction ? prediction.winnerId : winner(row)) + '.';
      })
      .on('mouseenter focus', function(event, feature) {
        if (!ui.locked) show(rowById[String(feature.properties[data.property])]);
      })
      .on('mouseleave blur', function() {
        if (!ui.locked) details.innerHTML = '<p>Hover, focus, or tap a region.</p>';
      })
      .on('keydown', function(event, feature) {
        if (event.key === 'Escape') { ui.locked = ''; details.innerHTML = '<p>Selection cleared.</p>'; }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.dispatchEvent(new MouseEvent('click', {bubbles: true}));
        }
      })
      .on('click', function(event, feature) {
        var id = String(feature.properties[data.property]);
        var row = rowById[id];
        if (campaign && ui.view === 'province') {
          electionModel.setCampaignProvince(qualities, id);
          render(host);
          return;
        }
        if (ui.view === 'province') {
          ui.province = id;
          ui.view = 'district';
          ui.locked = '';
          render(host);
          return;
        }
        ui.locked = ui.locked === id ? '' : id;
        show(row);
      });

    if (data.rows.length <= 41) {
      var firstFeature = {};
      features.forEach(function(feature) {
        var id = String(feature.properties[data.property]);
        if (!firstFeature[id]) firstFeature[id] = feature;
      });
      svg.append('g').attr('class', 'map-winner-labels').selectAll('text')
        .data(Object.keys(firstFeature)).enter().append('text')
        .attr('transform', function(id) { return 'translate(' + path.centroid(firstFeature[id]) + ')'; })
        .text(function(id) {
          var row = rowById[id];
          var prediction = confidence(forecast, ui.view, id);
          return label(snapshot, prediction ? prediction.winnerId : winner(row)).slice(0, 4).toUpperCase();
        });
    }
    host.querySelector('.map-legend').innerHTML = visibleWinners.map(function(id, index) {
      return '<span><i style="--winner-color:' + color(snapshot, id) +
        ';--pattern-angle:' + (45 + index * 45) + 'deg"></i>' +
        text(label(snapshot, id)) + '</span>';
    }).join('');
    host.querySelector('.map-text-host').innerHTML = textualTable(snapshot, data.rows, forecast, ui.view);

    host.querySelectorAll('[data-map-view]').forEach(function(button) {
      button.addEventListener('click', function() {
        ui.view = button.getAttribute('data-map-view');
        if (ui.view === 'province') ui.province = '';
        ui.locked = '';
        render(host);
      });
    });
    var archiveSelect = host.querySelector('[data-map-archive]');
    if (archiveSelect) archiveSelect.addEventListener('change', function() {
      host._electionMapArchiveIndex = Number(archiveSelect.value);
      ui.view = 'province'; ui.province = ''; ui.locked = '';
      render(host);
    });
    host.querySelectorAll('[data-campaign-issue]').forEach(function(button) {
      button.addEventListener('click', function() {
        electionModel.setCampaignIssue(qualities, button.getAttribute('data-campaign-issue'));
        render(host);
      });
    });
    var provinceSelect = host.querySelector('[data-campaign-province]');
    if (provinceSelect) provinceSelect.addEventListener('change', function() {
      electionModel.setCampaignProvince(qualities, provinceSelect.value);
      render(host);
    });
    var confirm = host.querySelector('[data-campaign-confirm]');
    if (confirm) confirm.addEventListener('click', function() {
      var engine = root.dendryUI && root.dendryUI.dendryEngine;
      var choices = engine ? engine.getCurrentChoices() : [];
      var index = choices.findIndex(function(choice) {
        return choice.id === 'poland_regional_campaign.confirm';
      });
      if (index >= 0) engine.choose(index);
    });
  }

  root.renderElectionMaps = function(container) {
    (container || document).querySelectorAll('.election-map-host').forEach(render);
  };
}(typeof window !== 'undefined' ? window : globalThis));
