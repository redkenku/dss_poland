(function() {
  var game;
  var ui;

  var DateOptions = {hour: 'numeric',
                 minute: 'numeric',
                 second: 'numeric',
                 year: 'numeric',
                 month: 'short',
                 day: 'numeric' };

  var main = function(dendryUI) {
    ui = dendryUI;
    game = ui.game;

    // Add your custom code here.
  };

  var TITLE = "Polish Red Autumn" + '_' + "redkenku";

  // the url is a link to game.json
  // test url: https://aucchen.github.io/social_democracy_mods/v0.1.json
  window.loadMod = function(url) {
      ui.loadGame(url);
  };

  window.showStats = function() {
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('library')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('library');
    }
  };
  
  window.showMods = function() {
    window.hideOptions();
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('mod_loader')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('mod_loader');
    }
  };
  
  window.showOptions = function() {
      var save_element = document.getElementById('options');
      window.populateOptions();
      save_element.style.display = "block";
      if (!save_element.onclick) {
          save_element.onclick = function(evt) {
              var target = evt.target;
              var save_element = document.getElementById('options');
              if (target == save_element) {
                  window.hideOptions();
              }
          };
      }
  };

  window.hideOptions = function() {
      var save_element = document.getElementById('options');
      save_element.style.display = "none";
  };

  window.disableBg = function() {
      window.dendryUI.disable_bg = true;
      document.body.style.backgroundImage = 'none';
      window.dendryUI.saveSettings();
  };

  window.enableBg = function() {
      window.dendryUI.disable_bg = false;
      window.dendryUI.setBg(window.dendryUI.dendryEngine.state.bg);
      window.dendryUI.saveSettings();
  };

  window.disableAnimate = function() {
      window.dendryUI.animate = false;
      window.dendryUI.saveSettings();
  };

  window.enableAnimate = function() {
      window.dendryUI.animate = true;
      window.dendryUI.saveSettings();
  };

  window.disableAnimateBg = function() {
      window.dendryUI.animate_bg = false;
      window.dendryUI.saveSettings();
  };

  window.enableAnimateBg = function() {
      window.dendryUI.animate_bg = true;
      window.dendryUI.saveSettings();
  };

  window.disableAudio = function() {
      window.dendryUI.toggle_audio(false);
      window.dendryUI.saveSettings();
      window.updateRadio();
  };

  window.enableAudio = function() {
      window.dendryUI.toggle_audio(true);
      if (!window.dendryUI.currentAudio) {
        var startScene = window.dendryUI.game.scenes['root.new_game'];
        if (startScene && startScene.audio) {
          window.dendryUI.audio(startScene.audio);
        }
      }
      window.dendryUI.saveSettings();
      window.updateRadio();
  };

  var observedRadioAudio = null;

  var radioTrackTitle = function(url) {
    var path = decodeURIComponent(String(url || '').split(/[?#]/)[0]);
    var filename = path.slice(path.lastIndexOf('/') + 1);
    return filename
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ');
  };

  window.updateRadio = function() {
    var radio = document.getElementById('radio');
    if (!radio || !window.dendryUI) {
      return;
    }
    var audio = window.dendryUI.currentAudio;
    var playlist = window.dendryUI.audioPlaylist || [];
    radio.hidden = !audio;
    if (!audio) {
      return;
    }
    if (observedRadioAudio !== audio) {
      observedRadioAudio = audio;
      ['play', 'pause', 'ended'].forEach(function(eventName) {
        audio.addEventListener(eventName, window.updateRadio);
      });
    }
    document.getElementById('radio-toggle').textContent =
      audio.paused ? 'Play' : 'Pause';
    document.getElementById('radio-next').disabled = playlist.length < 2;
    document.getElementById('radio-track').textContent =
      radioTrackTitle(window.dendryUI.currentAudioURL || audio.currentSrc);
  };

  window.toggleRadio = function() {
    var audio = window.dendryUI.currentAudio;
    if (!audio) {
      return;
    }
    window.dendryUI.toggle_audio(audio.paused);
    window.dendryUI.saveSettings();
    window.updateRadio();
  };

  window.nextRadioTrack = function() {
    var audio = window.dendryUI.currentAudio;
    var playlist = window.dendryUI.audioPlaylist || [];
    if (!audio || playlist.length < 2) {
      return;
    }
    var current = window.dendryUI.currentAudioURL ||
      audio.getAttribute('src') || audio.currentSrc;
    var index = playlist.findIndex(function(track) {
      return current === track || current.endsWith('/' + track);
    });
    var next = playlist[(index + 1) % playlist.length];
    audio.pause();
    audio.src = next;
    window.dendryUI.currentAudioURL = next;
    window.dendryUI.disable_audio = false;
    audio.play();
    window.dendryUI.saveSettings();
    window.updateRadio();
  };

  window.enableImages = function() {
    window.dendryUI.show_portraits = true;
    window.dendryUI.saveSettings();
   };

  window.disableImages = function() {
    window.dendryUI.show_portraits = false;
    window.dendryUI.saveSettings();
};

window.enableLightMode = function() {
    window.dendryUI.dark_mode = false;
    document.body.classList.remove('dark-mode');
    window.dendryUI.saveSettings();
};
window.enableDarkMode = function() {
    window.dendryUI.dark_mode = true;
    document.body.classList.add('dark-mode');
    window.dendryUI.saveSettings();
};

window.enableGrayMode = function() {
    window.dendryUI.gray_mode = true;
    document.body.classList.add('gray-mode');
    window.dendryUI.saveSettings();
};
window.disableGrayMode = function() {
    window.dendryUI.gray_mode = false;
    document.body.classList.remove('gray-mode');
    window.dendryUI.saveSettings();
};

  // populates the checkboxes in the options view
  window.populateOptions = function() {
    var disable_bg = window.dendryUI.disable_bg;
    var animate = window.dendryUI.animate;
    var disable_audio = window.dendryUI.disable_audio;
    var show_portraits = window.dendryUI.show_portraits;
    if (disable_bg) {
        $('#backgrounds_no')[0].checked = true;
    } else {
        $('#backgrounds_yes')[0].checked = true;
    }
    if (animate) {
        $('#animate_yes')[0].checked = true;
    } else {
        $('#animate_no')[0].checked = true;
    }
    if (disable_audio) {
        $('#audio_no')[0].checked = true;
    } else {
        $('#audio_yes')[0].checked = true;
    }
    if (show_portraits) {
        $('#images_yes')[0].checked = true;
    } else {
        $('#images_no')[0].checked = true;
    }
    if (window.dendryUI.dark_mode) {
        $('#dark_mode')[0].checked = true;
    } else {
        $('#light_mode')[0].checked = true;
    }
    if (window.dendryUI.gray_mode) {
        $('#gray_on')[0].checked = true;
    } else {
        $('#gray_no')[0].checked = true;
    }
  };

  /*
   * Party names are authored across scene prose, choice titles, dynamic
   * headlines and hand-built HTML tables. Keep their public labels, colours
   * and English explanations in one place so every one of those surfaces
   * presents them consistently.
   */
  var partyDefinitions = [
    {
      id: 'nowa-lewica',
      className: 'party-nowa-lewica',
      explanation: 'New Left — the social-democratic party formed from SLD and Wiosna.',
      aliases: [
        ['New Left', 'Nowa Lewica'],
        ['Nowa Lewica', 'Nowa Lewica']
      ]
    },
    {
      id: 'lewica',
      className: 'party-lewica',
      explanation: 'The Left — Poland’s broad left-wing electoral alliance.',
      aliases: [
        ['The Left', 'Lewica'],
        ['the Left', 'Lewica'],
        ['Left', 'Lewica'],
        ['Lewica', 'Lewica']
      ]
    },
    {
      id: 'sld',
      className: 'party-sld',
      explanation: 'Democratic Left Alliance (SLD) — the predecessor of New Left.',
      aliases: [
        ['Democratic Left Alliance', 'Sojusz Lewicy Demokratycznej'],
        ['Sojusz Lewicy Demokratycznej', 'Sojusz Lewicy Demokratycznej'],
        ['SLD', 'SLD']
      ]
    },
    {
      id: 'wiosna',
      className: 'party-wiosna',
      explanation: 'Spring — the progressive party founded by Robert Biedroń.',
      aliases: [['Wiosna', 'Wiosna']]
    },
    {
      id: 'razem',
      className: 'party-razem',
      explanation: 'Together (Razem) — a democratic-socialist party.',
      aliases: [
        ['Together Party', 'Razem'],
        ['Partia Razem', 'Partia Razem'],
        ['Razem', 'Razem']
      ]
    },
    {
      id: 'pps',
      className: 'party-pps',
      explanation: 'Polish Socialist Party (PPS) — a historic socialist party.',
      aliases: [
        ['Polish Socialist Party', 'Polska Partia Socjalistyczna'],
        ['Polska Partia Socjalistyczna', 'Polska Partia Socjalistyczna'],
        ['PPS', 'PPS']
      ]
    },
    {
      id: 'unia-pracy',
      className: 'party-unia-pracy',
      explanation: 'Labour Union — a Polish social-democratic party.',
      aliases: [
        ['Labour Union', 'Unia Pracy'],
        ['Unia Pracy', 'Unia Pracy']
      ]
    },
    {
      id: 'ko',
      className: 'party-ko',
      explanation: 'Civic Coalition (KO) — a broad liberal and pro-European electoral alliance.',
      aliases: [
        ['Civic Coalition', 'Koalicja Obywatelska'],
        ['Koalicja Obywatelska', 'Koalicja Obywatelska'],
        ['KO', 'KO']
      ]
    },
    {
      id: 'po',
      className: 'party-po',
      explanation: 'Civic Platform (PO) — the principal party in Civic Coalition.',
      aliases: [
        ['Civic Platform', 'Platforma Obywatelska'],
        ['Platforma Obywatelska', 'Platforma Obywatelska'],
        ['PO', 'PO']
      ]
    },
    {
      id: 'nowoczesna',
      className: 'party-nowoczesna',
      explanation: 'Modern — a liberal party within Civic Coalition.',
      aliases: [
        ['Modern party', 'Nowoczesna'],
        ['Nowoczesna', 'Nowoczesna']
      ]
    },
    {
      id: 'inicjatywa-polska',
      className: 'party-inicjatywa-polska',
      explanation: 'Polish Initiative — a social-liberal party within Civic Coalition.',
      aliases: [
        ['Polish Initiative', 'Inicjatywa Polska'],
        ['Inicjatywa Polska', 'Inicjatywa Polska']
      ]
    },
    {
      id: 'zieloni',
      className: 'party-zieloni',
      explanation: 'The Greens — Poland’s green party and a member of Civic Coalition.',
      aliases: [
        ['The Greens', 'Zieloni'],
        ['Polish Greens', 'Zieloni'],
        ['Zieloni', 'Zieloni']
      ]
    },
    {
      id: 'pis',
      className: 'party-pis',
      explanation: 'Law and Justice (PiS) — a national-conservative party.',
      aliases: [
        ['Law and Justice', 'Prawo i Sprawiedliwość'],
        ['Prawo i Sprawiedliwość', 'Prawo i Sprawiedliwość'],
        ['PiS', 'PiS']
      ]
    },
    {
      id: 'psl',
      className: 'party-psl',
      explanation: 'Polish People’s Party (PSL) — an agrarian-centrist party.',
      aliases: [
        ["Polish People's Party", 'Polskie Stronnictwo Ludowe'],
        ['Polish People’s Party', 'Polskie Stronnictwo Ludowe'],
        ['Polskie Stronnictwo Ludowe', 'Polskie Stronnictwo Ludowe'],
        ['PSL', 'PSL']
      ]
    },
    {
      id: 'p2050',
      className: 'party-p2050',
      explanation: 'Poland 2050 — the centrist party founded by Szymon Hołownia.',
      aliases: [
        ['Poland 2050 RP', 'Polska 2050 RP'],
        ['Poland 2050', 'Polska 2050'],
        ['Polska 2050 RP', 'Polska 2050 RP'],
        ['Polska 2050', 'Polska 2050'],
        ['PL2050', 'PL2050']
      ]
    },
    {
      id: 'third-way',
      className: 'party-third-way',
      explanation: 'Third Way — the electoral alliance of PSL and Poland 2050.',
      aliases: [
        ['Third Way', 'Trzecia Droga'],
        ['Trzecia Droga', 'Trzecia Droga']
      ]
    },
    {
      id: 'konf',
      className: 'party-konf',
      explanation: 'Confederation — a federation of parties on the radical right.',
      aliases: [
        ['Confederation', 'Konfederacja'],
        ['Konfederacja', 'Konfederacja'],
        ['Konf.', 'Konf.']
      ]
    },
    {
      id: 'united-right',
      className: 'party-united-right',
      explanation: 'United Right — the governing alliance led by Law and Justice.',
      aliases: [
        ['United Right', 'Zjednoczona Prawica'],
        ['Zjednoczona Prawica', 'Zjednoczona Prawica']
      ]
    },
    {
      id: 'sovereign-poland',
      className: 'party-sovereign-poland',
      explanation: 'Sovereign Poland — a right-wing party allied with Law and Justice.',
      aliases: [
        ['Sovereign Poland', 'Suwerenna Polska'],
        ['Suwerenna Polska', 'Suwerenna Polska']
      ]
    },
    {
      id: 'solidary-poland',
      className: 'party-solidary-poland',
      explanation: 'Solidary Poland — the former name of Sovereign Poland.',
      aliases: [
        ['Solidary Poland', 'Solidarna Polska'],
        ['Solidarna Polska', 'Solidarna Polska']
      ]
    },
    {
      id: 'agreement',
      className: 'party-agreement',
      explanation: 'Agreement — Jarosław Gowin’s centre-right party.',
      aliases: [
        ['Agreement party', 'Porozumienie'],
        ['Porozumienie', 'Porozumienie']
      ]
    },
    {
      id: 'republicans',
      className: 'party-republicans',
      explanation: 'Republican Party — a centre-right party formed by former Agreement politicians.',
      aliases: [
        ['Republican Party', 'Partia Republikańska'],
        ['Partia Republikańska', 'Partia Republikańska']
      ]
    },
    {
      id: 'national-movement',
      className: 'party-national-movement',
      explanation: 'National Movement — the nationalist component of Confederation.',
      aliases: [
        ['National Movement', 'Ruch Narodowy'],
        ['Ruch Narodowy', 'Ruch Narodowy']
      ]
    },
    {
      id: 'new-hope',
      className: 'party-new-hope',
      explanation: 'New Hope — the libertarian-right component of Confederation.',
      aliases: [
        ['New Hope', 'Nowa Nadzieja'],
        ['Nowa Nadzieja', 'Nowa Nadzieja']
      ]
    },
    {
      id: 'kkp',
      className: 'party-kkp',
      explanation: 'Confederation of the Polish Crown (KKP) — Grzegorz Braun’s monarchist party.',
      aliases: [
        ['Confederation of the Polish Crown', 'Konfederacja Korony Polskiej'],
        ['Konfederacja Korony Polskiej', 'Konfederacja Korony Polskiej'],
        ['KKP', 'KKP']
      ]
    },
    {
      id: 'freedomites',
      className: 'party-freedomites',
      explanation: 'Freedomites — a libertarian party formed by Confederation defectors.',
      aliases: [
        ['Freedomites', 'Wolnościowcy'],
        ['Wolnościowcy', 'Wolnościowcy']
      ]
    },
    {
      id: 'kukiz',
      className: 'party-kukiz',
      explanation: 'Kukiz’15 — Paweł Kukiz’s anti-establishment political movement.',
      aliases: [
        ["Kukiz'15", 'Kukiz’15'],
        ['Kukiz’15', 'Kukiz’15']
      ]
    },
    {
      id: 'unia-centrum',
      className: 'party-unia-centrum',
      explanation: 'Centre Union — a fictional centrist party in the scenario horizon.',
      aliases: [['Unia Centrum', 'Unia Centrum']]
    },
    {
      id: 'german-minority',
      className: 'party-german-minority',
      explanation: 'German Minority — the electoral committee representing Poland’s German minority.',
      aliases: [
        ['German Minority', 'Mniejszość Niemiecka'],
        ['Mniejszość Niemiecka', 'Mniejszość Niemiecka']
      ]
    },
    {
      id: 'nonpartisan',
      className: 'party-nonpartisan',
      explanation: 'Nonpartisan Local Government Activists — a local-government electoral movement.',
      aliases: [
        ['Nonpartisan Local Government Activists', 'Bezpartyjni Samorządowcy'],
        ['Bezpartyjni Samorządowcy', 'Bezpartyjni Samorządowcy']
      ]
    }
  ];

  var partyAliases = {};
  var partyDefinitionsByClass = {};
  var partyAliasPattern = [];
  var escapeRegExp = function(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  var escapeAttribute = function(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  partyDefinitions.forEach(function(definition) {
    partyDefinitionsByClass[definition.className] = definition;
    definition.aliases.forEach(function(alias) {
      partyAliases[alias[0]] = {
        definition: definition,
        label: alias[1]
      };
      partyAliasPattern.push(alias[0]);
    });
  });
  partyAliasPattern.sort(function(left, right) {
    return right.length - left.length;
  });
  partyAliasPattern = new RegExp(
    '(^|[^A-Za-zÀ-ž0-9_])(' +
      partyAliasPattern.map(escapeRegExp).join('|') +
      ')(?=$|[^A-Za-zÀ-ž0-9_])',
    'g'
  );

  var partyMarkup = function(alias) {
    var match = partyAliases[alias];
    if (!match) {
      return alias;
    }
    return '<span class="party ' + match.definition.className +
      '" title="' + escapeAttribute(match.definition.explanation) +
      '" data-party="' + match.definition.id + '">' +
      match.label + '</span>';
  };

  var replacePartyAliases = function(text, addMarkup) {
    return text.replace(
      partyAliasPattern,
      function(fullMatch, prefix, alias, offset, original) {
        if (
          (alias === 'Left' || alias === 'The Left' || alias === 'the Left') &&
          original.slice(offset + fullMatch.length).indexOf('-wing') === 0
        ) {
          return fullMatch;
        }
        var replacement = addMarkup
          ? partyMarkup(alias)
          : partyAliases[alias].label;
        return prefix + replacement;
      }
    );
  };

  var partyDefinitionFromTag = function(tag) {
    var classMatch = tag.match(/\bclass=(["'])(.*?)\1/i);
    if (!classMatch) {
      return null;
    }
    var classes = classMatch[2].split(/\s+/);
    for (var i = 0; i < classes.length; i++) {
      if (partyDefinitionsByClass[classes[i]]) {
        return partyDefinitionsByClass[classes[i]];
      }
    }
    return null;
  };

  var addPartyExplanation = function(tag, definition) {
    if (!definition || /\btitle=(["']).*?\1/i.test(tag)) {
      return tag;
    }
    return tag.replace(
      /^<([A-Za-z][^\s/>]*)/,
      '<$1 title="' + escapeAttribute(definition.explanation) +
        '" data-party="' + definition.id + '"'
    );
  };

  // This function is called for narrative text, headings, inserts and choices.
  window.displayText = function(text) {
    if (typeof text !== 'string' || !text) {
      return text;
    }

    var htmlTokens = text.split(/(<[^>]+>)/g);
    var elementStack = [];
    return htmlTokens.map(function(token) {
      if (token.charAt(0) !== '<') {
        var insideParty = elementStack.length &&
          elementStack[elementStack.length - 1].party;
        return replacePartyAliases(token, !insideParty);
      }

      var closingTag = token.match(/^<\/\s*([A-Za-z][^\s>]*)/);
      if (closingTag) {
        for (var closeIndex = elementStack.length - 1;
          closeIndex >= 0; closeIndex--) {
          if (
            elementStack[closeIndex].tag.toLowerCase() ===
            closingTag[1].toLowerCase()
          ) {
            elementStack.splice(closeIndex);
            break;
          }
        }
        return token;
      }

      var openingTag = token.match(/^<\s*([A-Za-z][^\s/>]*)/);
      if (!openingTag) {
        return token;
      }
      var ownParty = partyDefinitionFromTag(token);
      var inheritedParty = elementStack.length
        ? elementStack[elementStack.length - 1].party
        : null;
      var activeParty = ownParty || inheritedParty;
      var voidElement = /\/\s*>$/.test(token) ||
        /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i
          .test(openingTag[1]);
      if (!voidElement) {
        elementStack.push({
          tag: openingTag[1],
          party: activeParty
        });
      }
      return addPartyExplanation(token, ownParty);
    }).join('');
  };

  window.enhancePartyElements = function(root) {
    if (!root || !root.querySelectorAll) {
      return;
    }
    var elements = root.querySelectorAll('.party');
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      var definition = null;
      var text = element.textContent.replace(/\s+/g, ' ').trim();
      var exactAlias = partyAliases[text];
      if (exactAlias) {
        definition = exactAlias.definition;
      }
      if (!definition) {
        for (var className in partyDefinitionsByClass) {
          if (
            Object.prototype.hasOwnProperty.call(
              partyDefinitionsByClass,
              className
            ) &&
            element.classList.contains(className)
          ) {
            definition = partyDefinitionsByClass[className];
            break;
          }
        }
      }
      if (definition) {
        element.title = definition.explanation;
        element.setAttribute('data-party', definition.id);
      }
    }
  };

  var sidebarNumber = function(value) {
    var match = String(value || '').replace(',', '.').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  };

  var clampSidebarNumber = function(value, min, max) {
    return Math.min(max, Math.max(min, value));
  };

  var appendSemanticMeter = function(host, value, max, tone, label, threshold) {
    if (
      !host ||
      !Number.isFinite(value) ||
      !Number.isFinite(max) ||
      max <= 0 ||
      host.querySelector('.semantic-meter')
    ) {
      return;
    }

    var meter = document.createElement('span');
    meter.className = 'semantic-meter meter-' + (tone || 'scale');
    meter.setAttribute('role', 'meter');
    meter.setAttribute('aria-label', label);
    meter.setAttribute('aria-valuemin', '0');
    meter.setAttribute('aria-valuemax', String(max));
    meter.setAttribute('aria-valuenow', String(value));

    var fill = document.createElement('span');
    fill.className = 'semantic-meter-fill';
    fill.style.width =
      clampSidebarNumber(value / max * 100, 0, 100) + '%';
    meter.appendChild(fill);

    if (Number.isFinite(threshold)) {
      var marker = document.createElement('span');
      marker.className = 'semantic-meter-threshold';
      marker.title = threshold + '% threshold';
      marker.style.left =
        clampSidebarNumber(threshold / max * 100, 0, 100) + '%';
      meter.appendChild(marker);
    }

    if (tone === 'positive' || tone === 'risk') {
      var favorable = tone === 'positive' ? value : max - value;
      if (favorable < max * 0.35) {
        meter.classList.add('meter-critical');
      } else if (favorable < max * 0.7) {
        meter.classList.add('meter-caution');
      } else {
        meter.classList.add('meter-healthy');
      }
    }

    host.appendChild(meter);
  };

  var sidebarRiskLabel = function(label) {
    return /(backlash|breach|dissent|dualism|hostility|panic|pressure|risk|stress|far-right agenda|vacanc|backlog)/i
      .test(label);
  };

  /*
   * Turn dense ledger values into a small set of repeatable visual signals.
   * The original values stay in the DOM; meters supplement precision instead
   * of replacing it, which keeps saves, authored copy and screen readers sane.
   */
  window.enhanceStatusPanel = function(root) {
    if (!root || !root.querySelectorAll) {
      return;
    }

    var pulseCards = root.querySelectorAll('[data-meter]');
    for (var i = 0; i < pulseCards.length; i++) {
      var card = pulseCards[i];
      var valueElement = card.querySelector('.pulse-number');
      var value = sidebarNumber(
        valueElement ? valueElement.textContent : ''
      );
      var max = sidebarNumber(card.getAttribute('data-meter'));
      var threshold = sidebarNumber(card.getAttribute('data-threshold'));
      var labelElement = card.querySelector('.pulse-label');
      var label = labelElement
        ? labelElement.textContent.trim() + ': ' + value + ' out of ' + max
        : value + ' out of ' + max;
      appendSemanticMeter(
        card,
        value,
        max,
        card.getAttribute('data-tone') || 'scale',
        label,
        threshold
      );
    }

    var rows = root.querySelectorAll('.ledger-row');
    for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      var row = rows[rowIndex];
      if (
        row.classList.contains('has-ledger-meter') ||
        row.getAttribute('data-no-meter') === 'true'
      ) {
        continue;
      }
      var valueCell = row.lastElementChild;
      var valueText = valueCell ? valueCell.textContent.trim() : '';
      var issueValues = valueText.match(
        /^(\d+(?:\.\d+)?)\s*·\s*(\d+(?:\.\d+)?)\s*·\s*(\d+(?:\.\d+)?)$/
      );
      if (issueValues) {
        var issueLabel = row.firstElementChild
          ? row.firstElementChild.textContent.trim()
          : 'Public issue';
        var issueDescription = row.nextElementSibling;
        var issueDescriptionText = '';
        if (
          issueDescription &&
          issueDescription.classList.contains('ledger-subrow')
        ) {
          issueDescription.classList.add('issue-description');
          issueDescriptionText = issueDescription.textContent.trim();
        }

        row.classList.add('issue-signal-row');
        row.setAttribute('tabindex', '0');
        row.setAttribute(
          'aria-label',
          issueLabel +
          '. Support ' + issueValues[1] +
          ', salience ' + issueValues[2] +
          ', backlash ' + issueValues[3] +
          (issueDescriptionText ? '. ' + issueDescriptionText : '')
        );
        valueCell.classList.add('issue-values-source');
        valueCell.setAttribute('aria-hidden', 'true');

        var triplet = document.createElement('span');
        triplet.className = 'issue-triplet';
        triplet.setAttribute('aria-hidden', 'true');
        var issueChannels = [
          ['support', 'Support', Number(issueValues[1])],
          ['salience', 'Salience', Number(issueValues[2])],
          ['backlash', 'Backlash', Number(issueValues[3])]
        ];
        for (var channelIndex = 0;
          channelIndex < issueChannels.length;
          channelIndex++) {
          var channel = document.createElement('span');
          channel.className =
            'issue-channel issue-' + issueChannels[channelIndex][0];
          channel.title =
            issueChannels[channelIndex][1] +
            ': ' + issueChannels[channelIndex][2];
          var channelFill = document.createElement('span');
          channelFill.style.width =
            clampSidebarNumber(issueChannels[channelIndex][2], 0, 100) +
            '%';
          channel.appendChild(channelFill);
          triplet.appendChild(channel);
        }
        row.appendChild(triplet);
        continue;
      }
      var bounded = valueText.match(
        /^(-?\d+(?:\.\d+)?)\s*\/\s*(100)\s*$/
      );
      if (!bounded) {
        continue;
      }
      var rowLabel = row.firstElementChild
        ? row.firstElementChild.textContent.trim()
        : 'Status';
      var polarity = row.getAttribute('data-polarity');
      if (!polarity) {
        polarity = sidebarRiskLabel(rowLabel) ? 'risk' : 'positive';
      }
      row.classList.add('has-ledger-meter');
      appendSemanticMeter(
        row,
        Number(bounded[1]),
        Number(bounded[2]),
        polarity,
        rowLabel + ': ' + bounded[1] + ' out of ' + bounded[2],
        NaN
      );
    }

    var firstIssueRow = root.querySelector('.issue-signal-row');
    if (firstIssueRow) {
      var issueLegend = document.createElement('div');
      issueLegend.className = 'issue-legend';
      issueLegend.setAttribute(
        'aria-label',
        'Issue channels: support, salience and backlash'
      );
      issueLegend.innerHTML =
        '<span class="issue-support">Support</span>' +
        '<span class="issue-salience">Salience</span>' +
        '<span class="issue-backlash">Backlash</span>';
      firstIssueRow.parentNode.insertBefore(issueLegend, firstIssueRow);
    }

    var sections = root.querySelectorAll('.ledger-section');
    for (var sectionIndex = 0;
      sectionIndex < sections.length;
      sectionIndex++) {
      var pollRows = sections[sectionIndex].querySelectorAll('.poll-row');
      var comparableRows = [];
      for (var pollIndex = 0; pollIndex < pollRows.length; pollIndex++) {
        var cells = pollRows[pollIndex].children;
        if (cells.length < 2 || !/%/.test(cells[1].textContent)) {
          continue;
        }
        var percentages = cells[1].textContent.match(
          /-?\d+(?:\.\d+)?(?=%)/g
        );
        if (!percentages || !percentages.length) {
          continue;
        }
        comparableRows.push({
          row: pollRows[pollIndex],
          cells: cells,
          value: Number(percentages[0]),
          percentages: percentages
        });
      }

      if (comparableRows.length < 2) {
        continue;
      }

      for (var compareIndex = 0;
        compareIndex < comparableRows.length;
        compareIndex++) {
        var comparison = comparableRows[compareIndex];
        var comparisonRow = comparison.row;
        comparisonRow.classList.add('has-poll-meter');

        if (
          comparison.percentages.length > 1 &&
          Math.abs(
            Number(comparison.percentages[0]) -
            Number(comparison.percentages[1])
          ) < 0.05
        ) {
          comparison.cells[1].title =
            'Poll and modelled vote are both ' +
            comparison.percentages[0] + '%';
          comparison.cells[1].textContent =
            comparison.percentages[0] + '%';
        }

        var pollMeter = document.createElement('span');
        pollMeter.className = 'poll-comparison-meter';
        var partyClasses = comparison.cells[0].className.split(/\s+/);
        for (var partyIndex = 0;
          partyIndex < partyClasses.length;
          partyIndex++) {
          if (/^party-/.test(partyClasses[partyIndex])) {
            pollMeter.classList.add(partyClasses[partyIndex]);
            break;
          }
        }
        pollMeter.setAttribute('aria-hidden', 'true');

        var pollFill = document.createElement('span');
        pollFill.style.width =
          clampSidebarNumber(comparison.value / 50 * 100, 0, 100) + '%';
        pollMeter.appendChild(pollFill);

        var thresholdMarker = document.createElement('i');
        thresholdMarker.className = 'poll-threshold';
        thresholdMarker.title = '5% national threshold';
        pollMeter.appendChild(thresholdMarker);
        comparisonRow.appendChild(pollMeter);
      }
    }
  };

  window.initializeStatusTabs = function() {
    var tabLists = document.querySelectorAll('.tab_container[role="tablist"]');
    for (var listIndex = 0; listIndex < tabLists.length; listIndex++) {
      var tabList = tabLists[listIndex];
      if (tabList.getAttribute('data-keyboard-ready') === 'true') {
        continue;
      }
      tabList.setAttribute('data-keyboard-ready', 'true');
      tabList.addEventListener('keydown', function(event) {
        if (
          event.key !== 'ArrowLeft' &&
          event.key !== 'ArrowRight' &&
          event.key !== 'Home' &&
          event.key !== 'End'
        ) {
          return;
        }
        var tabs = Array.prototype.slice.call(
          event.currentTarget.querySelectorAll('[role="tab"]')
        );
        var current = tabs.indexOf(document.activeElement);
        if (current < 0) {
          return;
        }
        var next = current;
        if (event.key === 'Home') {
          next = 0;
        } else if (event.key === 'End') {
          next = tabs.length - 1;
        } else if (event.key === 'ArrowRight') {
          next = (current + 1) % tabs.length;
        } else {
          next = (current - 1 + tabs.length) % tabs.length;
        }
        event.preventDefault();
        tabs[next].focus();
        tabs[next].click();
      });
    }
  };

  // This function allows you to do something in response to signals.
  window.handleSignal = function(signal, event, scene_id) {
  };
  
  // This function runs on a new page. Right now, this auto-saves.
  window.onNewPage = function() {
    var scene = window.dendryUI.dendryEngine.state.sceneId;
    if (scene != 'root' && !window.justLoaded) {
        window.dendryUI.autosave();
    }
    if (window.justLoaded) {
        window.justLoaded = false;
    }
  };

  window.updateSidebar = function() {
      $('#qualities').empty();
      var baseStatus = dendryUI.game.scenes.status;
      var scene = dendryUI.game.scenes[window.statusTab] || baseStatus;
      if (baseStatus.onArrival) {
          dendryUI.dendryEngine._runActions(baseStatus.onArrival);
      }
      if (scene !== baseStatus && scene.onArrival) {
          dendryUI.dendryEngine._runActions(scene.onArrival);
      }
      var displayContent = dendryUI.dendryEngine._makeDisplayContent(scene.content, true);
      $('#qualities').append(dendryUI.contentToHTML.convert(displayContent));
      window.enhancePartyElements(document.getElementById('qualities'));
      window.enhanceStatusPanel(document.getElementById('qualities'));
  };

  window.updateSidebarRight = function() {
    $('#qualities_right').empty();
    var baseStatus = dendryUI.game.scenes.status;
    var scene = dendryUI.game.scenes[window.statusTabRight] || baseStatus;
    if (baseStatus.onArrival) {
      dendryUI.dendryEngine._runActions(baseStatus.onArrival);
    }
    if (scene !== baseStatus && scene.onArrival) {
      dendryUI.dendryEngine._runActions(scene.onArrival);
    }
    var displayContent = dendryUI.dendryEngine._makeDisplayContent(scene.content, true);
    $('#qualities_right').append(dendryUI.contentToHTML.convert(displayContent));
    window.enhancePartyElements(document.getElementById('qualities_right'));
};

  window.changeTab = function(newTab, tabId, isRight) {
      var tabButton = document.getElementById(tabId);
      var sidebar = document.getElementById(
        isRight ? 'stats_sidebar_right' : 'stats_sidebar'
      );
      if (!tabButton || !sidebar) {
        return;
      }
      var tabButtons = sidebar.querySelectorAll('.tab_button');
      for (var i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
        tabButtons[i].setAttribute('aria-selected', 'false');
        tabButtons[i].setAttribute('tabindex', '-1');
      }
      tabButton.classList.add('active');
      tabButton.setAttribute('aria-selected', 'true');
      tabButton.setAttribute('tabindex', '0');
      if (isRight) {
        window.statusTabRight = newTab;
        window.updateSidebarRight();
        } else {
          window.statusTab = newTab;
          var panel = document.getElementById('qualities');
          if (panel) {
            panel.setAttribute('aria-labelledby', tabId);
          }
          window.updateSidebar();
    }
  };

  window.onDisplayContent = function() {
      window.updateSidebar();
      window.updateSidebarRight();
      window.enhancePartyElements(document.getElementById('content'));
      window.updateRadio();
      window.setTimeout(window.updateRadio, 0);
  };

  /*
   * Dendry renders card subtitles as large custom hover panels. Replace those
   * panels with native title text and an accessible name so hovering never
   * covers the card artwork.
   */
  window.enhanceCardElements = function(root) {
    if (!root) {
      return;
    }
    var cards = root.querySelectorAll('a.card');
    for (var cardIndex = 0; cardIndex < cards.length; cardIndex++) {
      var card = cards[cardIndex];
      var subtitleElement = card.querySelector('.card-tooltip');
      var cardTitle = card.getAttribute('data-card-title');
      if (!cardTitle) {
        cardTitle = card.getAttribute('title') || '';
        card.setAttribute('data-card-title', cardTitle);
      }
      if (!subtitleElement) {
        continue;
      }
      var subtitle = subtitleElement.textContent.trim();
      if (subtitle) {
        card.setAttribute('title', subtitle);
        card.setAttribute(
          'aria-label',
          cardTitle ? cardTitle + '. ' + subtitle : subtitle
        );
      }
      subtitleElement.remove();
    }
  };

  window.initializeCardEnhancements = function() {
    var content = document.getElementById('content');
    if (!content) {
      return;
    }
    window.enhanceCardElements(content);
    window.cardEnhancementObserver = new MutationObserver(function() {
      window.enhanceCardElements(content);
    });
    window.cardEnhancementObserver.observe(content, {
      childList: true,
      subtree: true
    });
  };

  window.toggleDem = function toggleDemographicTable() {
      const resultsDiv = document.getElementById('results');
      // Toggle display between 'none' and 'block'
      if (resultsDiv.style.display === 'none' || resultsDiv.style.display === '') {
          resultsDiv.style.display = 'block'; // or 'table' for the table specifically
      } else {
          resultsDiv.style.display = 'none';
      }
  };
  window.toggleGraph = function toggleGraph() {
      const svgElement = document.getElementById('party_support_history');
      if (svgElement.style.display === 'none' || svgElement.style.display === '') {
          svgElement.style.display = 'block';
      } else {
          svgElement.style.display = 'none';
      }
  };
  window.toggleElectionGraph = function toggleElectionGraph() {
      const svgElement = document.getElementById('election_history');
      if (svgElement.style.display === 'none' || svgElement.style.display === '') {
          svgElement.style.display = 'block';
      } else {
          svgElement.style.display = 'none';
      }
  };
  window.toggleNews = function toggleNews() {
      const elements = document.querySelectorAll('.dnvp');
      const elements2 = document.querySelectorAll('.other');
      const button = document.getElementById('news_tab');

      if (!button) {
          console.error('Button with id "news_tab" not found.');
          return;
      }

      elements.forEach(function (element) {
          if (element.style.display !== 'block') {
              element.style.display = 'block';
              button.innerHTML = "View Other News";
          } else {
              element.style.display = 'none';
              button.innerHTML = "View Right-Wing News";
          }
      });

      elements2.forEach(function (element) {
          if (element.style.display !== 'none') {
              element.style.display = 'none';
          } else {
              element.style.display = 'block';
          }
      });

      button.style.backgroundColor = '#dddddd';
  };

  /*
   * This function copied from the code for Infinite Space Battle Simulator
   *
   * quality - a number between max and min
   * qualityName - the name of the quality
   * max and min - numbers
   * colors - if true/1, will use some color scheme - green to yellow to red for high to low
   * */
  window.generateBar = function(quality, qualityName, max, min, colors) {
      var bar = document.createElement('div');
      bar.className = 'bar';
      var value = document.createElement('div');
      value.className = 'barValue';
      var width = (quality - min)/(max - min);
      if (width > 1) {
          width = 1;
      } else if (width < 0) {
          width = 0;
      }
      value.style.width = Math.round(width*100) + '%';
      if (colors) {
          value.style.backgroundColor = window.probToColor(width*100);
      }
      bar.textContent = qualityName + ': ' + quality;
      if (colors) {
          bar.textContent += '/' + max;
      }
      bar.appendChild(value);
      return bar;
  };


  window.justLoaded = true;
  window.statusTab = "status";
  window.statusTabRight = "status_right";
  window.dendryModifyUI = main;
  console.log("Modifying stats: see dendryUI.dendryEngine.state.qualities");

  window.onload = function() {
    window.dendryUI.loadSettings({show_portraits: true});
    if (window.dendryUI.dark_mode) {
        document.body.classList.add('dark-mode');
    }
    if (window.dendryUI.gray_mode) {
        document.body.classList.add('gray-mode');
    }
    window.pinnedCardsDescription = "Leadership bureau";
    window.statusTab = "status";
    window.initializeStatusTabs();
    window.initializeCardEnhancements();
    window.updateSidebar();
    window.statusTabRight = "status_right";
    window.updateSidebarRight();
    window.updateRadio();
  };

}());
