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
    var engineAudio = ui.audio.bind(ui);
    ui.audio = function(audio) {
      var startScene = game.scenes['root.new_game'];
      if (ui.currentAudio && startScene && audio === startScene.audio) {
        return;
      }
      engineAudio(audio);
    };
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
  var radioVolume = 0.2;

  try {
    var savedRadioVolume = window.localStorage.getItem(
      TITLE + '_radio_volume'
    );
    var parsedRadioVolume = Number(savedRadioVolume);
    if (savedRadioVolume !== null && Number.isFinite(parsedRadioVolume)) {
      radioVolume = Math.max(0, Math.min(1, parsedRadioVolume));
    }
  } catch (_error) {
    // Storage can be unavailable for local files or locked-down browsers.
  }

  var applyRadioVolume = function(audio) {
    if (!audio) {
      return;
    }
    window.jQuery(audio).stop(true);
    audio.volume = radioVolume;
  };

  window.setRadioVolume = function(percent) {
    radioVolume = Math.max(0, Math.min(1, Number(percent) / 100));
    try {
      window.localStorage.setItem(TITLE + '_radio_volume', radioVolume);
    } catch (_error) {
      // Volume still works for this session when storage is unavailable.
    }
    applyRadioVolume(window.dendryUI.currentAudio);
    window.updateRadio();
  };

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
    var startScene = window.dendryUI.game.scenes['root.new_game'];
    document.getElementById('radio-volume').value =
      Math.round(radioVolume * 100);
    document.getElementById('radio-volume-value').textContent =
      Math.round(radioVolume * 100) + '%';
    radio.hidden = !audio && !(startScene && startScene.audio);
    if (!audio) {
      document.getElementById('radio-toggle').textContent = 'Play';
      document.getElementById('radio-next').disabled = true;
      document.getElementById('radio-track').textContent = 'Radio ready';
      return;
    }
    if (observedRadioAudio !== audio) {
      observedRadioAudio = audio;
      ['pause', 'ended'].forEach(function(eventName) {
        audio.addEventListener(eventName, window.updateRadio);
      });
      audio.addEventListener('play', function() {
        window.setTimeout(function() {
          applyRadioVolume(audio);
          window.updateRadio();
        }, 0);
      });
    }
    applyRadioVolume(audio);
    document.getElementById('radio-toggle').textContent =
      audio.paused ? 'Play' : 'Pause';
    document.getElementById('radio-next').disabled = playlist.length < 2;
    document.getElementById('radio-track').textContent =
      radioTrackTitle(window.dendryUI.currentAudioURL || audio.currentSrc);
  };

  window.toggleRadio = function() {
    var audio = window.dendryUI.currentAudio;
    if (!audio) {
      window.enableAudio();
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
      id: 'nowa-solidarnosc',
      className: 'party-nowa-solidarnosc',
      explanation: 'New Solidarity — the short-lived patriotic-left challenger launched in June 2023.',
      aliases: []
    },
    {
      id: 'nowa-lewica',
      className: 'party-nowa-lewica',
      explanation: 'New Left — the social-democratic party formed from SLD and Wiosna.',
      aliases: [
        ['Nowa Lewica – Odnowa', 'Nowa Lewica – Odnowa'],
        ['New Left Renewal', 'Nowa Lewica – Odnowa'],
        ['New Left', 'Nowa Lewica'],
        ['Nowa Lewica', 'Nowa Lewica']
      ]
    },
    {
      id: 'lewica',
      className: 'party-lewica',
      explanation: 'The Left — Poland’s broad left-wing electoral alliance.',
      aliases: [
        ['Zjednoczona Lewica', 'Zjednoczona Lewica'],
        ['Lewica w Rozsypce', 'Lewica w Rozsypce'],
        ['Wiosna-SLD', 'Wiosna-SLD'],
        ['Lewica Razem', 'Lewica Razem'],
        ['Wspólne Jutro', 'Wspólne Jutro'],
        ['Partia Pracy', 'Partia Pracy'],
        ['Lewica Lewic', 'Lewica Lewic'],
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
      aliases: [
        ['Wiosna / Spring', 'Wiosna'],
        ['Spring', 'Wiosna'],
        ['Wiosna', 'Wiosna']
      ]
    },
    {
      id: 'razem',
      className: 'party-razem',
      explanation: 'Together (Razem) — a democratic-socialist party.',
      aliases: [
        ['Together Party', 'Razem'],
        ['Together', 'Razem'],
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
      id: 'left-labor',
      className: 'party-left-labor',
      explanation: 'Lewica Pracy (Labour Left) — a possible labour-led splinter in the scenario.',
      aliases: [
        ['Labour Left', 'Lewica Pracy'],
        ['Lewica Pracy', 'Lewica Pracy']
      ]
    },
    {
      id: 'young-left',
      className: 'party-progressive',
      explanation: 'Młoda Lewica (Young Left) — a possible progressive splinter in the scenario.',
      aliases: [
        ['Young Left', 'Młoda Lewica'],
        ['Młoda Lewica', 'Młoda Lewica']
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
        ['Law & Justice', 'Prawo i Sprawiedliwość'],
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
      classAliases: ['party-korona'],
      explanation: 'Confederation of the Polish Crown (KKP) — Grzegorz Braun’s monarchist party.',
      aliases: [
        ['Confederation of the Polish Crown', 'Konfederacja Korony Polskiej'],
        ['Konfederacja Korony Polskiej', 'Konfederacja Korony Polskiej'],
        ['Korona', 'Korona'],
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
      classAliases: ['party-centrum'],
      explanation: 'Centre Union — a fictional centrist party in the scenario horizon.',
      aliases: [['Unia Centrum', 'Unia Centrum']]
    },
    {
      id: 'rozwoj-plus',
      className: 'party-rozwoj',
      explanation: 'Rozwój Plus — a possible developmentalist split from PiS in the scenario.',
      aliases: [['Rozwój Plus', 'Rozwój Plus']]
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
    (definition.classAliases || []).forEach(function(className) {
      partyDefinitionsByClass[className] = definition;
    });
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

  var genericLeftAliases = {
    'The Left': true,
    'the Left': true,
    'Left': true,
    'Lewica': true
  };
  var currentLeftName = function() {
    var engine = window.dendryUI && window.dendryUI.dendryEngine;
    var qualities = engine && engine.state && engine.state.qualities;
    var name = qualities && qualities.left_party_name;
    return typeof name === 'string' && name.trim()
      ? name
      : 'Zjednoczona Lewica';
  };
  var partyLabel = function(alias) {
    var match = partyAliases[alias];
    return match && match.definition.id === 'lewica' &&
      genericLeftAliases[alias]
      ? currentLeftName()
      : match.label;
  };

  var partyMarkup = function(alias) {
    var match = partyAliases[alias];
    if (!match) {
      return alias;
    }
    return '<span class="party ' + match.definition.className +
      '" title="' + escapeAttribute(match.definition.explanation) +
      '" data-party="' + match.definition.id + '">' +
      partyLabel(alias) + '</span>';
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
          : partyLabel(alias);
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

  var isPolishCampaignScene = function() {
    var engine = window.dendryUI && window.dendryUI.dendryEngine;
    var sceneId = engine && engine.state && engine.state.sceneId;
    return typeof sceneId === 'string' &&
      /^(root(?:\.|$)|poland_|status(?:\.|$)|library(?:\.|$)|modinfo(?:\.|$))/.test(
        sceneId
      );
  };

  // This function is called for narrative text, headings, inserts and choices.
  window.displayText = function(text) {
    if (typeof text !== 'string' || !text || !isPolishCampaignScene()) {
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

  var pressReviewOutlets = [
    {
      id: 'onet', name: 'Onet', mark: 'ONET', accent: '#d71920',
      from: 0, patron: 'ko'
    },
    {
      id: 'wp', name: 'WP', mark: 'WP', accent: '#7c2a90',
      from: 0, patron: 'neutral'
    },
    {
      id: 'rzeczpospolita',
      name: 'Rzeczpospolita',
      mark: 'RZ',
      accent: '#b51f24',
      from: 0,
      patron: 'konf'
    },
    {
      id: 'kanal-zero',
      name: 'Kanał Zero',
      mark: 'ZERO',
      accent: '#e8392f',
      from: 202402,
      patron: 'pis-or-konf'
    },
    {
      id: 'tvp', name: 'TVP', mark: 'TVP', accent: '#18549a',
      from: 0, patron: 'government'
    },
    {
      id: 'tvn', name: 'TVN', mark: 'TVN', accent: '#0069a8',
      from: 0, patron: 'ko'
    },
    {
      id: 'republika',
      name: 'Republika',
      mark: 'R',
      accent: '#c6232d',
      from: 0,
      patron: 'mostly-pis'
    }
  ];

  var pressStory = function(headline, text, sourceUrl, sourceDate) {
    return {
      headline: headline,
      text: text,
      sourceUrl: sourceUrl || '',
      sourceDate: sourceDate || ''
    };
  };

  var pressReviewStories = {
    201910: {
      onet: pressStory(
        'Olga Tokarczuk wins the Nobel. The story of a childhood that began far from Stockholm',
        'The new laureate spent her first years in Klenica, in a former hunting lodge that later entered her writing.',
        'https://kultura.onet.pl/wiadomosci/literacka-nagroda-nobla-2019-olga-tokarczuk-i-jej-dziecinstwo/8w5ml9e',
        '10 OCT 2019'
      ),
      wp: pressStory(
        'The Left is back in the Sejm. Forty-nine seats are only the beginning of the test',
        'The result restores a national platform, but voters will now judge whether Lewica can turn visibility into a durable programme.'
      )
    },
    201911: {
      rzeczpospolita: pressStory(
        'The Left reaches for the presidency. Razem has already named the ideological price',
        'A candidate built around new spending and cultural confrontation would drag the campaign onto the terrain the hard right wants.'
      ),
      tvp: pressStory(
        'PiS begins governing. The Left begins another argument over its candidate',
        'The governing camp presents continuity while Lewica struggles to decide who can carry its programme beyond a narrow electorate.'
      ),
      tvn: pressStory(
        'Forty-nine seats, one candidate and no margin for another wasted presidential race',
        'The democratic opposition needs a credible campaign; Lewica must decide whether it will reinforce that effort or compete with it.'
      )
    },
    201912: {
      tvn: pressStory(
        'PiS presents the bill for its promises. The opposition must show what the budget hides',
        'Voting no is easy. The real test is whether Lewica can produce priorities that complement a democratic alternative.'
      ),
      republika: pressStory(
        'The Left comes for the budget. Working Poles should check who receives the invoice',
        'Lewica demands another list of programmes while PiS defends the social transfers already reaching Polish families.'
      )
    },
    202001: {
      onet: pressStory(
        'KO searches for a route to the Palace. The Left could help—or split the opposition again',
        'The presidential campaign is becoming a test of whether Lewica wants democratic leverage or merely another separate television podium.'
      ),
      wp: pressStory(
        'Politics has moved online. The Left is discovering how expensive attention really is',
        'A newsroom, recognisable faces and rapid video cannot be improvised after the next crisis has already captured the feed.'
      ),
      rzeczpospolita: pressStory(
        'Lewica wants its own media machine. Taxpayers and donors should guard their wallets',
        'A party that cannot earn attention now dreams of buying infrastructure to push an agenda voters have repeatedly rejected.'
      )
    },
    202002: {
      rzeczpospolita: pressStory(
        'The budget reaches the roll call. Lewica discovers that slogans still require arithmetic',
        'Every new entitlement creates a permanent claim on taxpayers, however attractively the opposition packages the amendment.'
      ),
      tvp: pressStory(
        'A responsible budget against opposition theatre. PiS puts family policy to a vote',
        'The government asks the Sejm to fund its programme while Lewica searches for an amendment it can advertise as a victory.'
      )
    },
    202003: {
      tvn: pressStory(
        'The country closes down. Democratic oversight cannot be placed in quarantine',
        'Emergency measures require speed, but also transparent law, competent hospitals and an opposition capable of checking executive power.'
      ),
      republika: pressStory(
        'Poland fights the virus. The Left already uses the emergency to attack the government',
        'PiS mobilises the state while its opponents search every restriction for material against the governing camp.'
      ),
      onet: pressStory(
        'Lockdown exposes the state’s weakest seams. Mayors and hospitals need answers now',
        'The crisis is moving faster than Warsaw. KO-led cities demand rules, equipment and a government that shares usable information.'
      )
    },
    202004: {
      onet: pressStory(
        'The election by post is becoming a test of power, not democracy',
        'KO mayors refuse to legitimise an improvised ballot while Lewica must choose between a common front and its own tactical escape.'
      ),
      wp: pressStory(
        'Millions of ballots, missing rules and one impossible May deadline',
        'The postal vote plan collides with municipal registers, health restrictions and questions no minister has yet answered.'
      )
    },
    202005: {
      rzeczpospolita: pressStory(
        'Lewica sees the rescue shield and demands a permanent expansion of the state',
        'Temporary protection for firms and workers is becoming an excuse for controls and spending that will outlive the emergency.'
      ),
      tvp: pressStory(
        'The government shield protects jobs. The opposition keeps moving the price tag',
        'PiS delivers support during an unprecedented shutdown while Lewica claims every payment should have been larger.'
      ),
      tvn: pressStory(
        'Who actually receives the shield? The government’s headline numbers need scrutiny',
        'Workers, hospitals and local services cannot survive on a press conference; the democratic opposition wants the contracts and conditions.'
      )
    },
    202006: {
      tvn: pressStory(
        'The presidential campaign restarts. One opposition vote may now matter twice',
        'KO needs broad democratic transfers, while Lewica must prove its campaign expands the field instead of merely policing its border.'
      ),
      republika: pressStory(
        'Duda offers stability. The Left offers another experiment at Poland’s expense',
        'The president defends the government’s social mandate as opposition parties compete to dismantle the political settlement.'
      )
    },
    202007: {
      onet: pressStory(
        'Duda wins narrowly. The opposition now has to account for every vote it failed to unite',
        'KO came close to the Palace; Lewica must explain whether its campaign built a transfer bridge or another barrier.'
      ),
      wp: pressStory(
        'The election is over. The result leaves two Polands and no easy route between them',
        'The final count settles the presidency, not the argument over turnout, transfers and the opposition’s next strategy.'
      ),
      rzeczpospolita: pressStory(
        'The Left disappears in the presidential contest. Voters chose a real conflict instead',
        'Lewica’s programme failed to command the campaign, leaving the decisive argument to the liberal and national camps.'
      )
    },
    202008: {
      rzeczpospolita: pressStory(
        'A second Duda term begins. The Left remains trapped outside the national majority',
        'The oath confirms a conservative presidency and leaves Lewica searching for influence through protests and parliamentary bargains.'
      ),
      tvp: pressStory(
        'President Duda takes the oath. Poland chooses continuity over opposition chaos',
        'The head of state begins a second term with a democratic mandate and a promise to protect family and national development.'
      )
    },
    202009: {
      tvn: pressStory(
        'Lewica promises renewal. KO wants to know whether anything beyond the label changed',
        'A credible partner needs predictable commitments on democracy, Europe and the next election—not another rebranding exercise.'
      ),
      republika: pressStory(
        'New name, old left. Lewica repackages the same threat to faith and family',
        'The merger offers modern colours while preserving the programme rejected by Poland’s conservative majority.'
      ),
      onet: pressStory(
        'Lewica enters the field. The opposition has gained a partner and another rival',
        'KO will tolerate a stronger left only if it helps defeat PiS without turning every joint step into a bidding war.'
      )
    },
    202010: {
      onet: pressStory(
        'Świątek is the champion of Roland Garros. Watch the final point of a historic triumph',
        'The 19-year-old defeated Sofia Kenin 6–4, 6–1 and became the first Polish winner of a Grand Slam singles title.',
        'https://przegladsportowy.onet.pl/tenis/iga-swiatek-wygrala-french-open-pilka-na-wage-zwyciestwa-polki-w-turnieju/8qgc0sn',
        '10 OCT 2020'
      ),
      wp: pressStory(
        'The Tribunal ruling sends thousands into the streets. What happens next?',
        'The abortion decision has produced a movement larger than any party and a political crisis with no quick exit.'
      )
    },
    202011: {
      rzeczpospolita: pressStory(
        'The street tries to veto the law. Lewica races to become its parliamentary owner',
        'Protest leaders and left-wing politicians now compete to move Poland beyond even the old abortion compromise.'
      ),
      tvp: pressStory(
        'Flares, blockades and attacks on churches. The opposition excuses escalating disorder',
        'The government defends public safety while Lewica treats every confrontation as a recruitment opportunity.'
      ),
      tvn: pressStory(
        'The Women’s Strike changed the country. Parties must decide whether they will listen',
        'The movement demands rights and institutional repair; KO and Lewica now face a test of support without attempted capture.'
      )
    },
    202012: {
      tvn: pressStory(
        'A pandemic budget without trust. The opposition wants the missing receipts',
        'Hospitals and households need support, but PiS still expects parliament to accept opaque priorities and compressed scrutiny.'
      ),
      republika: pressStory(
        'Lewica exploits the pandemic budget to demand billions more',
        'PiS funds health and family security while the opposition converts every emergency line into another permanent entitlement.'
      )
    },
    202101: {
      onet: pressStory(
        'Vaccination begins with scarcity, confusion and a race against distrust',
        'KO demands a transparent queue and local capacity; Lewica can help public confidence or turn delivery into another partisan auction.'
      ),
      wp: pressStory(
        'Vaccines have arrived. Now millions of people need appointments that actually work',
        'Supply, registration and access outside the largest cities will determine whether the programme reaches beyond its opening photographs.'
      ),
      rzeczpospolita: pressStory(
        'Vaccination cannot become a passport to unlimited state control',
        'Public health requires competence and consent, not another bureaucracy empowered to divide citizens into approved categories.'
      )
    },
    202102: {
      rzeczpospolita: pressStory(
        'The vaccine state expands. Who will defend those asking legitimate questions?',
        'Warsaw’s political class treats every concern as ignorance while preparing rules that could survive long after the pandemic.'
      ),
      tvp: pressStory(
        'Poland accelerates vaccination. Opposition criticism cannot deliver a single dose',
        'The government expands access despite scarce European supply while Lewica searches for another failure to amplify.'
      )
    },
    202103: {
      tvn: pressStory(
        'Lewica registers its new structure. KO is waiting for evidence of a reliable partner',
        'The democratic opposition needs cooperation on courts and Europe; a logo cannot substitute for reliable parliamentary choices.'
      ),
      republika: pressStory(
        'They changed the sign, not the programme. The old left returns as “new”',
        'Lewica offers a polished brand for the same anti-conservative agenda and the same appetite for public money.'
      ),
      onet: pressStory(
        'Lewica relaunches. Its first real decision will matter more than the label',
        'KO sees room for a partner, but only if Lewica can choose democratic cooperation over permanent competition.'
      )
    },
    202104: {
      onet: pressStory(
        'Billions from Europe, one trap for the opposition: PiS needs votes and wants the credit',
        'KO demands common controls. Lewica must decide whether a separate bargain strengthens recovery or rescues the government.'
      ),
      wp: pressStory(
        'The recovery fund reaches parliament. Here is what the argument is really about',
        'Poland needs ratification, but parties still dispute oversight, local allocations and who may claim the eventual investment.'
      )
    },
    202105: {
      rzeczpospolita: pressStory(
        'The red-blue bargain: Lewica gives PiS the votes Brussels requires',
        'A party claiming to oppose the government now offers it survival in exchange for another catalogue of spending promises.'
      ),
      tvp: pressStory(
        'Recovery money above party warfare. The government invites responsible votes',
        'PiS secures Europe’s reconstruction funds while Lewica decides whether national investment matters more than opposition discipline.'
      ),
      tvn: pressStory(
        'Lewica can rescue PiS—or force one opposition standard for European money',
        'KO warns that private negotiations will divide democratic oversight and hand the government a free political victory.'
      )
    },
    202106: {
      tvn: pressStory(
        'KO, Poland 2050 and Lewica compete for the same future coalition',
        'The democratic camp needs coordination, but no party wants to become the quiet junior partner before an election date exists.'
      ),
      republika: pressStory(
        'The opposition table is back. Its only programme is removing PiS',
        'KO and Lewica conceal incompatible agendas behind another photograph of leaders promising democratic unity.'
      )
    },
    202107: {
      onet: pressStory(
        'Lewica turns on itself. KO watches a potential partner lose control',
        'Suspensions and rival mandates raise a simple question: who could sign—and keep—any future opposition agreement?'
      ),
      wp: pressStory(
        'A merger meant to end the dispute has produced another leadership crisis',
        'Lewica now faces competing claims to authority, with Razem deciding how far cooperation can survive the confrontation.'
      ),
      rzeczpospolita: pressStory(
        'Lewica cannot govern its own meeting. It still wants to govern the economy',
        'The latest leadership revolt exposes a party whose promises of state planning exceed its capacity for internal order.'
      )
    },
    202108: {
      rzeczpospolita: pressStory(
        'Gowin leaves and the majority frays. The Left sees another chance to trade votes',
        'A weakened government opens a market for parliamentary support, and Lewica is already calculating the price of relevance.'
      ),
      tvp: pressStory(
        'Fourteen medals. Poland closes Tokyo with its best Olympic result of the century',
        'A record 93 delegations won medals in Japan; Poland’s total was its strongest at a Summer Games in the 21st century.',
        'https://sport.tvp.pl/55268119/tokio-2020-nowy-rekord-igrzysk-olimpijskich-az-tyle-reprezentacji-zdobylo-medale-w-tokio',
        '8 AUG 2021'
      )
    },
    202109: {
      tvn: pressStory(
        'A state of emergency at the border. Security cannot erase humanitarian law',
        'KO demands state competence and allied pressure on Minsk; Lewica must defend rights without dismissing the engineered threat.'
      ),
      republika: pressStory(
        'Poland defends its border. The Left repeats the language Minsk wants to hear',
        'PiS backs the services facing a hybrid attack while opposition activists undermine confidence from television studios.'
      ),
      onet: pressStory(
        'The border crisis tests the whole opposition. Easy slogans have already failed',
        'KO seeks a line joining security and law; Lewica’s next move will decide whether cooperation survives the pressure.'
      )
    },
    202110: {
      onet: pressStory(
        'The Tribunal challenges EU law. PiS has opened a conflict Poland cannot control',
        'KO calls for a democratic European front; Lewica must choose whether to reinforce it or compete over the microphone.'
      ),
      wp: pressStory(
        'Poland and Brussels enter a new legal confrontation. What can happen now?',
        'The judgment raises questions over EU obligations, recovery money and the authority of courts on both sides of the dispute.'
      )
    },
    202111: {
      rzeczpospolita: pressStory(
        'Border pressure and street mobilisation expose the Left’s national blind spot',
        'Lewica talks about rights while conservative voters ask who will defend territory, order and the political community.'
      ),
      tvp: pressStory(
        'Polish services stop Lukashenko’s assault. The opposition still attacks the defenders',
        'The government protects the frontier as Lewica amplifies accusations against officers operating under unprecedented pressure.'
      ),
      tvn: pressStory(
        'A woman died in hospital. The abortion ruling now has a name and a human cost',
        'KO and Lewica demand answers, but only durable legal change can replace fear with clear medical standards.'
      )
    },
    202112: {
      tvn: pressStory(
        'A media law, a presidential veto and a surveillance file: democracy ends the year under pressure',
        'KO demands full accountability. Lewica can strengthen that front—or let tactical bargaining blur the central institutional question.'
      ),
      republika: pressStory(
        'Opposition television celebrates. The Left returns to its real priority: more spending',
        'PiS defends sovereignty and a wartime-ready budget while its opponents protect foreign media power and new entitlements.'
      )
    },
    202201: {
      onet: pressStory(
        'The Polish Deal reaches payslips—and the government’s flagship reform begins to unravel',
        'KO points to administrative chaos. Lewica must decide whether to defend redistribution or expose incompetent execution.'
      ),
      wp: pressStory(
        'New tax rules, lower transfers and confused payroll departments. Who gains?',
        'The reform changes thresholds and health contributions, but hurried corrections make household outcomes difficult to predict.'
      ),
      rzeczpospolita: pressStory(
        'The Polish Deal proves the state cannot redesign prosperity by decree',
        'Higher burdens, emergency patches and bureaucratic confusion vindicate every warning against fiscal social engineering.'
      )
    },
    202202: {
      rzeczpospolita: pressStory(
        'War returns to Europe. Poland needs strength, not the Left’s old illusions',
        'Russia’s invasion makes defence, energy independence and national cohesion the only serious political programme.'
      ),
      tvp: pressStory(
        'Poland stands with Ukraine. The government leads Europe’s answer to Russian aggression',
        'PiS mobilises aid, diplomacy and security while every opposition party is tested on national unity.'
      )
    },
    202203: {
      tvn: pressStory(
        'Millions flee Ukraine. Volunteers cannot substitute for a functioning state',
        'KO-led cities need money, schools and housing; Lewica can help build services if it works inside a common democratic response.'
      ),
      republika: pressStory(
        'Poland opens its homes to Ukraine. PiS turns solidarity into national action',
        'The government and ordinary citizens answer war at historic scale while the opposition searches for administrative complaints.'
      ),
      onet: pressStory(
        'The welcome is extraordinary. Now mayors warn that the system is reaching its limit',
        'KO demands direct support for local government; Lewica’s social proposals may help if they reinforce rather than fracture the response.'
      )
    },
    202204: {
      onet: pressStory(
        'Poland must leave Russian energy. The government still has no honest bill for the transition',
        'KO demands European coordination and protection for households; Lewica can add social guarantees without reviving coal dependency.'
      ),
      wp: pressStory(
        'Oil, gas and coal are being reordered by war. Prices will reach every household',
        'Sanctions and supply changes make the cost of separation unavoidable, but its distribution remains a political choice.'
      )
    },
    202205: {
      rzeczpospolita: pressStory(
        'One opposition list would hide every difference voters deserve to see',
        'KO and Lewica want electoral arithmetic to excuse an alliance spanning market liberals, socialists and Razem.'
      ),
      tvp: pressStory(
        'The opposition cannot agree on one list, one leader or one programme',
        'PiS governs through war and inflation while KO and Lewica negotiate how to divide positions they have not won.'
      ),
      tvn: pressStory(
        'One list or several? The democratic opposition is running out of time to choose',
        'KO wants maximum coordination; Lewica’s reliability will determine whether cooperation lowers risk or imports another veto.'
      )
    },
    202206: {
      tvn: pressStory(
        'Brussels approves the KPO plan. The money still depends on restoring the rule of law',
        'KO warns that milestones are not payment; Lewica can help enforce the conditions instead of giving PiS another shortcut.'
      ),
      republika: pressStory(
        'Brussels keeps Poland’s money behind political conditions. The opposition applauds',
        'PiS fights for equal treatment while KO and Lewica invite European institutions to discipline their own country.'
      )
    },
    202207: {
      onet: pressStory(
        'The Polish Deal needs another correction. KO says the chaos was designed in Warsaw',
        'Lewica must choose whether to rescue a redistributive idea or hold PiS responsible for its broken administration.'
      ),
      wp: pressStory(
        'Taxes change again while inflation erases the promised gains',
        'Households face new calculations, higher prices and another government explanation of who should now benefit.'
      ),
      rzeczpospolita: pressStory(
        'The great tax experiment retreats. The bill for central planning remains',
        'Corrections cannot restore confidence after the government proved how quickly political ambition can destabilise private decisions.'
      )
    },
    202208: {
      rzeczpospolita: pressStory(
        'The Oder disaster reveals a state that regulates everything and controls nothing',
        'Officials, inspectors and public companies traded responsibility while dead fish carried the cost downstream.'
      ),
      tvp: pressStory(
        'The government mobilises experts on the Oder. Germany’s early claims demand verification',
        'State services investigate an ecological disaster while opposition politicians announce conclusions before laboratories finish their work.'
      )
    },
    202209: {
      tvn: pressStory(
        'Energy prices explode. The government’s lost years are arriving in household bills',
        'KO presents a European alternative; Lewica can support protection if it does not turn emergency relief into another coalition ultimatum.'
      ),
      republika: pressStory(
        'Putin weaponises energy and Brussels sends the invoice. PiS shields Polish families',
        'The opposition blames Warsaw for a continental crisis while demanding still more expensive climate policy.'
      ),
      onet: pressStory(
        'Coal queues, power bills and a winter of government improvisation',
        'KO argues that PiS ignored every warning; Lewica’s price controls may be useful only inside a credible supply plan.'
      )
    },
    202210: {
      onet: pressStory(
        'Konfederacja chooses its future. The opposition should not underestimate the new radical right',
        'KO sees a threat built from inflation and distrust; Lewica must contest it without repeating the language that gives it oxygen.'
      ),
      wp: pressStory(
        'Inflation, coal queues and a changing Konfederacja reshape the autumn',
        'Economic anger is moving voters before the main opposition parties have agreed how to answer it.'
      )
    },
    202211: {
      rzeczpospolita: pressStory(
        'Two dead in Przewodów. Serious states verify before they escalate',
        'Poland must defend its territory and alliance while refusing the instant certainty demanded by every partisan camp.'
      ),
      tvp: pressStory(
        'Poland activates allied consultations after the Przewodów explosion',
        'The government secures the site, coordinates with NATO and asks politicians to wait for verified evidence.'
      ),
      tvn: pressStory(
        'Przewodów demands facts, allied unity and restraint from every party',
        'KO backs NATO coordination; Lewica will be judged on whether it strengthens verified policy or joins premature speculation.'
      )
    },
    202212: {
      tvn: pressStory(
        'France ends Poland’s World Cup run. Mbappé decides the last-16 match',
        'The defending champions won 3–1; Olivier Giroud opened the scoring before two goals from Kylian Mbappé.',
        'https://eurosport.tvn24.pl/pilka-nozna/mistrzostwa-swiata/2022/live-francja-polska_mtc1287442/live.shtml',
        '4 DEC 2022'
      ),
      republika: pressStory(
        'War, inflation and security: the Left still wants to rewrite the budget around itself',
        'PiS funds defence and household shields while Lewica turns national emergency into leverage for another ideological package.'
      )
    },
    202301: {
      onet: pressStory(
        'The KPO key is finally in the lock. PiS still cannot turn it',
        'KO says Warsaw could end the blockade tomorrow; Lewica must decide whether repairs matter more than denying PiS a rescue photograph.'
      ),
      wp: pressStory(
        'A judicial bill, billions from Brussels and no guarantee that either side will yield',
        'The Sejm can pass another compromise, but payment still depends on institutions that no Polish vote can command.'
      ),
      rzeczpospolita: pressStory(
        'Brussels names its price and Lewica reaches for the judges. Who still defends sovereignty?',
        'PiS has made too many concessions already; the hard right sees a settlement designed to preserve an activist legal caste.'
      )
    },
    202302: {
      rzeczpospolita: pressStory(
        'The court bill reaches the Palace. Conservatives are being asked to sign their own surrender',
        'The KPO bargain gives Brussels leverage over Polish institutions while Lewica demands that every remaining safeguard be dismantled.'
      ),
      tvp: pressStory(
        'President protects the constitution as government fights for Poland’s recovery funds',
        'The bill goes to constitutional review; PiS seeks European money without accepting the opposition’s assault on legal sovereignty.'
      )
    },
    202303: {
      tvn: pressStory(
        'A report about John Paul II becomes PiS’s newest loyalty test',
        'KO refuses a state-mandated memory; Lewica can defend investigation without treating every Catholic voter as the enemy.'
      ),
      republika: pressStory(
        'They have come for John Paul II. The Left helps turn accusation into a national verdict',
        'PiS defends a Polish symbol while liberal media and their parliamentary allies demand collective repentance before the evidence closes.'
      ),
      onet: pressStory(
        'The state cannot legislate history. PiS tries anyway',
        'A democratic majority should permit scrutiny and protect victims; Lewica is useful when it resists the temptation of cultural revenge.'
      )
    },
    202304: {
      onet: pressStory(
        'Third Way enters the race. The democratic opposition has another threshold to survive',
        'KO needs partners who can reach different voters; Lewica must decide whether cooperation strengthens the bloc or merely protects its own list.'
      ),
      wp: pressStory(
        'Two parties, one committee and an eight-percent trap',
        'Poland 2050 and PSL promise a new centre, but electoral law may decide whether their arithmetic becomes representation.'
      )
    },
    202305: {
      rzeczpospolita: pressStory(
        '“Lex Tusk” exposes the panic of the old establishment. Now it demands immunity from scrutiny',
        'KO calls the commission persecution and Lewica joins the outrage, but voters may still want to know who profited from Russian dependence.'
      ),
      tvp: pressStory(
        'Commission will examine Russian influence. Tusk’s camp answers with street mobilisation',
        'PiS demands accountability before the election while KO and Lewica try to turn a security inquiry into a campaign grievance.'
      ),
      tvn: pressStory(
        'A verdict before a hearing: PiS writes Tusk’s exclusion into law',
        'The democratic opposition needs one constitutional answer; Lewica can stand beside KO without surrendering its own programme.'
      )
    },
    202306: {
      tvn: pressStory(
        'The 4 June march fills Warsaw. The democratic opposition finally looks larger than fear',
        'KO owns the central image, but Lewica’s visible contingent can turn attendance into a broader promise of change.'
      ),
      republika: pressStory(
        'Tusk’s march and the Left’s banners: the old anti-PiS front drops the pretence',
        'A Warsaw spectacle unites liberals and radicals around one ambition—taking power from the government that restored social policy.'
      )
    },
    202307: {
      onet: pressStory(
        'Konfederacja’s summer surge is no longer an internet curiosity',
        'KO needs a competent democratic offer; Lewica must challenge the anger underneath the polling rise without copying its language.'
      ),
      wp: pressStory(
        'Eight hundred plus, border anxiety and a radical-right surge reset the campaign',
        'Each party now offers a different kind of security, and younger voters are listening before the manifestos are finished.'
      ),
      rzeczpospolita: pressStory(
        'The duopoly is afraid. Konfederacja names the taxes and taboos both sides protected',
        'PiS answers with another transfer while Lewica wants a larger state; the hard right is finally forcing an argument about the bill.'
      )
    },
    202308: {
      rzeczpospolita: pressStory(
        'Lewica chooses its threshold—and asks voters to underwrite another ideological coalition',
        'A common committee may protect mandates, but it also conceals how little the left agrees on sovereignty, spending and cultural power.'
      ),
      tvp: pressStory(
        'Opposition lists trade places while PiS goes to voters with one programme',
        'Lewica calculates thresholds and Senate bargains; the government presents a clear choice on security and social protection.'
      )
    },
    202309: {
      tvn: pressStory(
        'A sealed frontier, a growing queue and questions the government will not answer',
        'KO demands facts about the visa system; Lewica can defend humane law without excusing administrative failure.'
      ),
      republika: pressStory(
        'The opposition discovers the border weeks before polling day. Poles remember who defended it',
        'PiS kept pressure outside the frontier while KO and Lewica attacked every barrier and now weaponise individual failures.'
      ),
      onet: pressStory(
        'The visa scandal tears through PiS’s campaign of border competence',
        'KO sees a collapse of credibility; Lewica must connect accountability with a migration policy voters believe can function.'
      )
    },
    202310: {
      onet: pressStory(
        'Record turnout ends the PiS majority. Now the democratic parties must prove they can govern',
        'KO has the initiative, but Lewica’s seats and programme will shape whether the transfer becomes more than a change of personnel.'
      ),
      wp: pressStory(
        'The votes are counted. The president, not the campaign, controls the next clock',
        'PiS remains the largest party while KO, Third Way and Lewica hold a prospective majority that still needs a government.'
      )
    },
    202311: {
      rzeczpospolita: pressStory(
        'The right fills Warsaw while the parliamentary majority waits in the corridor',
        'Independence Day shows that electoral defeat did not erase conservative Poland; Konfederacja now contests who will represent it.'
      ),
      tvp: pressStory(
        'President follows the constitution as opposition demands immediate possession of the state',
        'PiS receives the first formation attempt; KO and Lewica call ordinary procedure obstruction before a vote has taken place.'
      ),
      tvn: pressStory(
        'Iga Świątek wins the WTA Finals and returns to world number one',
        'She defeated Jessica Pegula 6–1, 6–0 in Cancun, completing the tournament without losing a set.',
        'https://eurosport.tvn24.pl/tenis/mistrzostwa-wta/2023/wta-finals-2023.-iga-swiatek-jessica-pegula-wynik-i-relacja-z-meczu_sto9873483/story.shtml',
        '6 NOV 2023'
      )
    },
    202312: {
      tvn: pressStory(
        'The keys finally change hands. Public media cannot become the next government’s trophy',
        'KO promises lawful repair; Lewica should help remove party control without constructing a replacement partisan newsroom.'
      ),
      republika: pressStory(
        'Tusk takes power and immediately reaches for the signal. This is the “rule of law” they promised',
        'PiS viewers are being expelled from public media while Lewica supplies votes and demands an even deeper ideological purge.'
      )
    },
    202401: {
      onet: pressStory(
        'Two prosecutors, one office and a state still trapped between legal orders',
        'KO promised repair, not a second chain of command; Lewica must insist that urgency does not become another excuse for improvisation.'
      ),
      wp: pressStory(
        'The prosecutor’s door has two nameplates. Courts will inherit the argument',
        'Government resolutions, statutory terms and presidential resistance now collide in offices expected to enforce one law.'
      ),
      rzeczpospolita: pressStory(
        'Tusk’s prosecutors enter by force of resolution. The “restoration” looks exactly like a purge',
        'Lewica applauds the seizure of institutions while conservatives learn that liberal legality lasts only until it becomes inconvenient.'
      )
    },
    202402: {
      republika: pressStory(
        'Tractors surround the capital. The government listens to Brussels before Polish farmers',
        'PiS stands with producers squeezed by imports and climate rules while Lewica offers another committee and another environmental condition.'
      ),
      onet: pressStory(
        'Farmers bring their anger to Warsaw. The coalition needs answers, not inherited slogans',
        'KO can negotiate in Europe; Lewica should make the case for protection without letting the radical right own every rural grievance.'
      )
    },
    202403: {
      wp: pressStory(
        'The Sejm declares a constitutional rupture. A resolution cannot make the dispute disappear',
        'Judges, the Palace and the majority still disagree on which acts are valid and who has authority to repair them.'
      ),
      rzeczpospolita: pressStory(
        'The majority votes the Tribunal out of existence. So much for liberal restraint',
        'KO and Lewica call institutional conquest a resolution; the hard right sees proof that written limits survive only against conservatives.'
      ),
      'kanal-zero': pressStory(
        'Tribunal by resolution? The establishment found a shortcut—and expects applause',
        'PiS built the crisis, but the new majority’s answer is power without candour; Konfederacja can attack both sides of the closed system.'
      )
    },
    202404: {
      'kanal-zero': pressStory(
        'Local Poland votes after one hundred days of Warsaw theatre',
        'PiS can prove it still governs real communities; Lewica must explain why joining the national majority did not build a local machine.'
      ),
      tvp: pressStory(
        'The coalition faces its first local verdict—and asks voters to protect the work already begun',
        'Government parties present institutional repair and European funds; Lewica’s local result will decide how loudly it can negotiate inside that project.'
      )
    },
    202405: {
      tvn: pressStory(
        'Poland leaves the Article 7 procedure. The democratic repair now needs laws that last',
        'KO has restored European trust; Lewica can strengthen the record if it chooses durable legislation over symbolic maximalism.'
      ),
      republika: pressStory(
        'Brussels rewards Tusk before the courts are repaired. The political purpose is now obvious',
        'PiS was punished for resisting; KO and Lewica receive a certificate while replacing institutions through the same disputed shortcuts.'
      ),
      onet: pressStory(
        'Europe closes the rule-of-law case. Warsaw still has to close its legal divide',
        'The diplomatic victory belongs to the coalition, but voters will judge whether KO and Lewica can turn confidence into functioning courts.'
      )
    },
    202406: {
      onet: pressStory(
        'Iga Świątek rules Paris again. A fourth Roland Garros title after a ruthless final',
        'The world number one defeated Jasmine Paolini 6–2, 6–1 and extended her winning run at the tournament to 21 matches.',
        'https://przegladsportowy.onet.pl/tenis/roland-garros/genialna-iga-swiatek-to-najlepszy-dowod-dominacji-w-roland-garros/fgzhc54',
        '8 JUN 2024'
      ),
      wp: pressStory(
        'European votes, a railway promise and one question: what will actually be built?',
        'The campaign ends, but the CPK and rail review still has to distinguish sunk costs, useful routes and partisan branding.'
      )
    },
    202407: {
      rzeczpospolita: pressStory(
        'The abortion vote breaks the coalition. Lewica discovers that power has limits',
        'A free vote exposes the majority’s cultural fault line; the hard right now knows which deputies can still be made to hold it.'
      ),
      'kanal-zero': pressStory(
        'Coalition unity ends where conscience begins. The Left’s ultimatum fails on the floor',
        'Konfederacja sees a majority terrified of its own programme and a PiS opposition unsure whether to fight or merely count absences.'
      ),
      tvp: pressStory(
        'A difficult vote does not erase the government’s mandate to deliver',
        'Coalition parties will return to rights legislation after a defeat; Lewica is urged to negotiate a majority rather than threaten the whole cabinet.'
      )
    },
    202408: {
      tvp: pressStory(
        'Pension decisions reach millions of letterboxes. Government defends stability after inflation',
        'The cabinet presents indexed security and a credible budget path while Lewica presses for a larger permanent floor.'
      ),
      tvn: pressStory(
        'A ZUS letter becomes the coalition’s test of social credibility',
        'KO needs predictable finances; Lewica can win the argument for protection if it shows who pays and how delivery works.'
      )
    },
    202409: {
      republika: pressStory(
        'Flood water rises and ministers reach for cameras. Local Poland counts the missing preparation',
        'PiS demands a record of reservoirs and warnings while Lewica uses the disaster to advertise permanent spending without limits.'
      ),
      onet: pressStory(
        'The flood tests the state in hours, not press conferences',
        'KO-led government must coordinate rescue and reconstruction; Lewica’s role is to make support fast without turning every failure into coalition theatre.'
      ),
      wp: pressStory(
        'Warnings, evacuations and a reconstruction bill that will outlast the water',
        'The immediate emergency belongs to services and municipalities; the political argument will begin with who prepared and who now pays.'
      )
    },
    202410: {
      wp: pressStory(
        'The prime minister pivots on asylum as the coalition’s migration line fractures',
        'Security, European law and border pressure now sit in one proposal that governing parties interpret in sharply different ways.'
      ),
      rzeczpospolita: pressStory(
        'Tusk borrows the right’s border policy. Lewica threatens revolt after years of denial',
        'The turn proves PiS and Konfederacja framed the real question; the government now wants their answer without admitting the source.'
      )
    },
    202411: {
      'kanal-zero': pressStory(
        'Trzaskowski or Sikorski? The governing camp offers a primary without a change of direction',
        'Konfederacja sees two faces of the same establishment; Lewica must choose between junior partnership and an independent challenge.'
      ),
      tvp: pressStory(
        'A democratic primary opens the road to the Palace',
        'The governing camp lets members choose its strongest candidate; Lewica can cooperate on constitutional repair while retaining its own voice.'
      ),
      tvn: pressStory(
        'KO chooses its candidate in public. Lewica’s presidential dilemma just became harder',
        'A broad democratic campaign could end hostile cohabitation, but tolerance for the Left will depend on whether it contributes more than demands.'
      )
    },
    202412: {
      tvn: pressStory(
        'The budget reaches the chamber with KPO projects—and coalition promises—on the clock',
        'KO offers stability before the presidential race; Lewica must decide which deliverables justify pressure and which risk the entire majority.'
      ),
      republika: pressStory(
        'A record budget, European strings and the Left’s invoice: Poles will pay for coalition survival',
        'PiS warns that borrowed celebration conceals higher costs while Lewica treats every fiscal ceiling as an ideological provocation.'
      )
    },
    202501: {
      onet: pressStory(
        'The presidential race begins with one question: can the coalition defend its record?',
        'KO needs a campaign larger than anti-PiS mobilisation; Lewica will be tolerated where it adds delivery, not another internal veto.'
      ),
      wp: pressStory(
        'Government record or opposition programme: the Palace campaign chooses its first terrain',
        'Candidates are testing whether voters want institutional repair, social delivery or a brake on the governing majority.'
      ),
      rzeczpospolita: pressStory(
        'Two right-wing electorates, one Palace. PiS no longer owns the rebellion',
        'Konfederacja can force a real argument on sovereignty while Lewica and KO compete to manage the same exhausted liberal settlement.'
      )
    },
    202502: {
      rzeczpospolita: pressStory(
        'Warsaw writes another school rule. Families outside the capital get the experiment',
        'PiS should defend parental authority; Lewica’s national standard turns local education into one more field for ideological supervision.'
      ),
      'kanal-zero': pressStory(
        'The ministry promises equal access. Parents hear another order from Warsaw',
        'PiS can oppose the rule without defending local failure; the real test is whether government policy works beyond its own press conference.'
      )
    },
    202503: {
      tvp: pressStory(
        'Government suspends asylum access at the pressured border and promises legal safeguards',
        'The cabinet calls the measure temporary and necessary; Lewica is asked to shape oversight without weakening the state’s response.'
      ),
      tvn: pressStory(
        'Border pressure drives the coalition toward emergency law',
        'KO argues that democratic government can protect the frontier; Lewica must distinguish enforceable safeguards from a rupture staged for purity.'
      ),
      republika: pressStory(
        'Tusk adopts the border policy he condemned. PiS was right before it was fashionable',
        'Lewica objects only after helping install the government; conservatives should remember who built the barrier under real pressure.'
      )
    },
    202504: {
      republika: pressStory(
        'A campaign enters the hospital and the Left reaches for collective punishment',
        'PiS condemns disruption without accepting Lewica’s attempt to turn one provocation into a licence against every conservative organisation.'
      ),
      onet: pressStory(
        'Braun brings campaign spectacle into a hospital. Silence is no longer neutrality',
        'KO expects a democratic cordon; Lewica can defend patients and staff without allowing the provocateur to dictate the entire election.'
      )
    },
    202505: {
      wp: pressStory(
        'The first round settles the names, not the presidency',
        'Turnout reserves, defeated candidates and their conditions now matter more than the slogans that carried each camp into Sunday.'
      ),
      rzeczpospolita: pressStory(
        'The runoff belongs to the right—if it refuses the establishment’s terms',
        'Konfederacja voters can demand sovereignty and lower taxes instead of becoming an automatic reserve for a softer PiS campaign.'
      ),
      'kanal-zero': pressStory(
        'The eliminated candidates hold the keys. Nobody gets their voters for free',
        'The right’s runoff bargain must be public: taxes, Ukraine, institutions and the price of another five years at the Palace.'
      )
    },
    202506: {
      'kanal-zero': pressStory(
        'A confidence vote cannot erase the presidential result',
        'PiS says the country rejected the coalition’s direction; the government answers with arithmetic while Lewica negotiates what survival is worth.'
      ),
      tvp: pressStory(
        'Poland returns to space after nearly half a century',
        'Sławosz Uznański-Wiśniewski launched aboard Axiom-4 for the International Space Station, becoming the second Pole in space.',
        'https://tvpworld.com/87476742/poland-back-in-space-after-nearly-50-years-with-iss-bound-astronaut-video',
        '25 JUN 2025'
      )
    },
    202507: {
      tvn: pressStory(
        'A midnight meeting, a weakened coalition and questions nobody can dismiss',
        'KO needs a transparent account from its partners; Lewica should defend the majority only after the terms of loyalty are made public.'
      ),
      republika: pressStory(
        'The coalition meets after dark and calls it dialogue. PiS sees a majority bargaining for survival',
        'Lewica clings to office while potential defectors discover that the government fears a private conversation more than a public vote.'
      ),
      onet: pressStory(
        'The cabinet is reshuffled. Moving nameplates will not repair coalition trust',
        'KO can simplify government, but Lewica’s continued support depends on a delivery record rather than another ceremonial reset.'
      )
    },
    202508: {
      onet: pressStory(
        'The pen changes hands. The government’s laws now face a new constitutional battlefield',
        'KO needs disciplined majorities and lawful drafts; Lewica will be useful when it builds votes instead of treating every veto as betrayal.'
      ),
      wp: pressStory(
        'A new presidency begins with old disputes already waiting on the desk',
        'Appointments, social bills and judicial repair will show whether cohabitation becomes negotiation, paralysis or a permanent campaign.'
      )
    },
    202509: {
      rzeczpospolita: pressStory(
        'Russian drones cross the line. Security is no place for the coalition’s social wish list',
        'Defence requires command, industry and money; Lewica cannot pretend every budget choice can be solved by another tax on somebody else.'
      ),
      'kanal-zero': pressStory(
        'The sky is no longer an abstraction. Warsaw’s defence promises meet a real incursion',
        'Konfederacja asks where the money went and who commands the response; government ceremony will not answer either question.'
      ),
      tvp: pressStory(
        'State and allies answer the drone incursion. Government puts security above party conflict',
        'The cabinet coordinates defence and a resilient budget; Lewica is expected to support capacity while scrutinising procurement.'
      )
    },
    202510: {
      tvp: pressStory(
        'The governing centre consolidates before the next delivery test',
        'One political organisation can reduce coalition noise; Lewica remains a partner where its demands fit a stable programme and funded timetable.'
      ),
      tvn: pressStory(
        'KO becomes one larger party. Consolidation will not replace coalition management',
        'The prime minister strengthens the centre, but still needs a Left that can be tolerated as a negotiating partner rather than a permanent rebellion.'
      )
    },
    202511: {
      republika: pressStory(
        'The Marshal’s chair rotates and the coalition applauds its own timetable',
        'PiS sees offices traded to preserve a failing majority while Lewica celebrates procedure as if it were a programme for the country.'
      ),
      onet: pressStory(
        'The promised rotation reaches the Sejm. Now the new Marshal inherits every coalition fracture',
        'KO honours the agreement; Lewica must use the office to organise majorities, not convert visibility into another test of its partners.'
      ),
      wp: pressStory(
        'A new Marshal, three rivals on the right and a chamber already looking toward the next election',
        'Formal rotation changes the rostrum while party mergers, defections and presidential conflict reshape the votes beneath it.'
      )
    },
    202512: {
      wp: pressStory(
        'The budget, labour enforcement and the KPO clock all arrive at once',
        'The coalition must fund inspection capacity while proving that milestones and collective-bargaining promises exist beyond legislation.'
      ),
      rzeczpospolita: pressStory(
        'Lewica wants inspectors in every workplace. The bill for coalition survival grows again',
        'Employers receive new commands while the government races a European deadline and pretends administration has no economic cost.'
      )
    },
    202601: {
      'kanal-zero': pressStory(
        'A movement chooses a successor and discovers it was built around one man',
        'Konfederacja sees the centre’s recurring illusion: a television personality, a temporary pact and no answer to the political duopoly.'
      ),
      tvp: pressStory(
        'Coalition partner renews its leadership and keeps government stability in view',
        'The succession is presented as an orderly democratic choice; Lewica is asked to respect its partner’s autonomy while negotiating the next programme.'
      ),
      tvn: pressStory(
        'Poland 2050 after its founder: the coalition cannot afford another private succession war',
        'KO needs a reliable centre partner; Lewica can help preserve the majority if it does not treat every vacancy as territory to absorb.'
      )
    },
    202602: {
      tvn: pressStory(
        'The ambassador dispute becomes another Palace veto on ordinary government',
        'KO wants one foreign policy abroad; Lewica should defend constitutional roles without turning a serious alliance into domestic performance.'
      ),
      republika: pressStory(
        'The government cannot command the Palace, so it calls resistance a crisis',
        'PiS defends presidential authority while Lewica joins KO’s attempt to subordinate every independent office to the cabinet.'
      )
    },
    202603: {
      onet: pressStory(
        'A centrist party survives its personality test—and walks into a coalition test',
        'KO needs dependable votes; Lewica can tolerate the new leadership where it delivers rather than relitigates the whole governing agreement.'
      ),
      wp: pressStory(
        'New leadership, disputed Tribunal seats and arithmetic that refuses to stand still',
        'The governing majority must fill offices under contested rules while smaller parties decide whether survival means autonomy or alliance.'
      ),
      rzeczpospolita: pressStory(
        'The majority elects judges into a dispute it promised to end',
        'KO and Lewica change the names but preserve political capture; conservatives should reject the fiction that procedure cleanses an unlawful foundation.'
      )
    },
    202604: {
      rzeczpospolita: pressStory(
        'Morawiecki’s new association opens a civil war PiS postponed for years',
        'A developmental conservative project can challenge both party centralism and Konfederacja’s sterile protest—if it accepts the cost of independence.'
      ),
      'kanal-zero': pressStory(
        'Association or ultimatum? The former prime minister tests how much dissent PiS can contain',
        'The right needs renewal without handing government another term; personal ambition matters less than whether a real organisation follows.'
      )
    },
    202605: {
      tvp: pressStory(
        'A partnership compromise reaches the vote after months of coalition work',
        'Government presents practical protection with a viable majority; Lewica is credited where it builds enactment rather than demands a perfect defeat.'
      ),
      tvn: pressStory(
        'Partnership rights approach the chamber. The coalition’s patience finally has a text',
        'KO can deliver a democratic reform; Lewica’s pressure helped, provided it now protects the majority needed to enact it.'
      ),
      republika: pressStory(
        'Kanał Zero goes to television. The old gatekeepers just lost another wall',
        'Konfederacja gains a route around liberal newsrooms while PiS must learn that conservative viewers no longer belong to one party.'
      )
    },
    202606: {
      republika: pressStory(
        'The Tribunal answers the majority—and ministers suggest the ruling need not count',
        'PiS warns that KO and Lewica accept constitutional review only when it produces the result already agreed in cabinet.'
      ),
      onet: pressStory(
        'One ruling, two legal realities and no citizen who can wait for politicians to agree',
        'KO must finish institutional repair; Lewica should prioritise enforceable remedies over another declaration that its preferred authority is the only one.'
      )
    },
    202607: {
      wp: pressStory(
        'The partnership bill reaches the presidential pen. Signature and veto both carry a second clock',
        'Hospitals, registries and inheritance rules will depend on the decision—and on implementation that no ceremony can complete.'
      ),
      rzeczpospolita: pressStory(
        'The Palace faces the Left’s partnership law. Conservatives expect a line to be held',
        'A parliamentary compromise does not oblige the president to ratify cultural change packaged as administration.'
      ),
      'kanal-zero': pressStory(
        'A veto, a signature and the trap behind both choices',
        'Konfederacja demands a clear refusal; PiS weighs principle against a campaign that the Left is ready to stage around the pen.'
      )
    },
    202608: {
      'kanal-zero': pressStory(
        'PiS departures reach the point where “internal debate” stops convincing anyone',
        'Scenario horizon: the right must choose between a real split and another bargain that protects the same leadership circle.'
      ),
      tvp: pressStory(
        'Government asks the Palace to end the appointments blockade',
        'Scenario horizon: the cabinet defends continuity and lawful staffing while Lewica presses for deadlines that do not reopen the constitutional war.'
      )
    },
    202609: {
      tvn: pressStory(
        'A new conservative club redraws the opposition benches',
        'Scenario horizon: KO sees a divided right; Lewica can use the opening if it offers delivery instead of celebrating somebody else’s fracture.'
      ),
      republika: pressStory(
        'The right breaks its own monopoly. A new club says PiS forgot development',
        'Scenario horizon: Konfederacja welcomes competition that exposes career loyalty, but voters will demand more than recycled government biographies.'
      ),
      onet: pressStory(
        'The 2027 budget begins as the party system moves underneath it',
        'Scenario horizon: KO must fund governing priorities while Lewica decides whether leverage is worth risking the stability voters still expect.'
      )
    },
    202610: {
      onet: pressStory(
        'The judicial-status bill reaches the Palace. Poland cannot survive another improvised repair',
        'Scenario horizon: KO needs a defensible statute; Lewica should make individual rights the test rather than demand victory in every institutional claim.'
      ),
      wp: pressStory(
        'Sign, veto or refer: the courts wait behind three presidential doors',
        'Scenario horizon: each route changes the timetable, but none immediately resolves the status of every appointment and judgment.'
      )
    },
    202611: {
      rzeczpospolita: pressStory(
        'Lewica invites the centre into one party. The ideological bill comes after the merger',
        'Scenario horizon: a broad formation may win offices, but voters should ask which programme survives when every faction is promised a home.'
      ),
      'kanal-zero': pressStory(
        'Three right-wing columns fight for one Independence March',
        'Scenario horizon: Konfederacja refuses to surrender the street to PiS nostalgia or a new conservative project assembled from defectors.'
      ),
      tvp: pressStory(
        'A named replacement faces the Sejm. Government calls every partner to the roll',
        'Scenario horizon: the cabinet defends its mandate against a constructive motion while Lewica must choose whether coalition repair is still credible.'
      )
    },
    202612: {
      tvp: pressStory(
        'The final budget closes the playable years with government continuity on the line',
        'Scenario horizon: ministers defend funded delivery and constitutional deadlines as parties turn toward the election year.'
      ),
      tvn: pressStory(
        'The budget folders close. The election-year record remains open',
        'Scenario horizon: KO’s governing case and Lewica’s leverage are measured in the institutions, laws and alliances carried into 2027.'
      )
    },
    202701: {
      onet: pressStory(
        'Eight years of Left strategy enter one election year',
        'Scenario horizon: Lewica must decide whether voters should judge a governing record, an independent programme or the organisation built beneath both.'
      ),
      republika: pressStory(
        'The coalition enters 2027 asking voters to forget its internal bill',
        'Scenario horizon: the right will make every delayed reform and cabinet bargain part of the coming parliamentary campaign.'
      )
    },
    202702: {
      wp: pressStory(
        'Household security returns to the centre of the campaign',
        'Scenario horizon: wages, housing, prices and public services give smaller parties a route around another purely institutional contest.'
      ),
      'kanal-zero': pressStory(
        'A campaign about delivery meets voters who remember the promises',
        'Scenario horizon: government and opposition can no longer separate their programmes from the record accumulated since the last Sejm election.'
      )
    },
    202703: {
      tvn: pressStory(
        'The democratic majority rehearses unity before it negotiates the lists',
        'Scenario horizon: KO wants a clear governing alternative while Lewica and the centre calculate how much identity tactical coordination costs.'
      ),
      rzeczpospolita: pressStory(
        'Electoral arithmetic begins to discipline the coalition’s ambitions',
        'Scenario horizon: thresholds and Senate districts reward cooperation, but every shared banner creates a new argument over nominations and money.'
      )
    },
    202704: {
      onet: pressStory(
        'Local structures become the hidden primary before candidate lists close',
        'Scenario horizon: national leaders need councillors, organisers and volunteers who can convert recognition into an actual election operation.'
      ),
      republika: pressStory(
        'The right’s rival organisations discover that a logo is not a field campaign',
        'Scenario horizon: PiS, Konfederacja and their splinters compete for candidates, local money and the authority to define the opposition.'
      )
    },
    202705: {
      tvp: pressStory(
        'The cabinet turns implementation dates into campaign dates',
        'Scenario horizon: every ministry presents delivery as proof of competence while partners dispute who supplied the votes and who owns the result.'
      ),
      wp: pressStory(
        'A future election is already testing the state’s unfinished work',
        'Scenario horizon: judicial repair, equality, labour enforcement and public investment remain records to defend rather than boxes a slogan can close.'
      )
    },
    202706: {
      'kanal-zero': pressStory(
        'Candidate season arrives and every faction calls itself indispensable',
        'Scenario horizon: party leaders must decide which internal currents receive safe places and which are expected to campaign without leverage.'
      ),
      tvn: pressStory(
        'The opposition asks for one democratic story. Smaller parties ask for guarantees',
        'Scenario horizon: unity photographs cannot settle thresholds, subsidies, candidate order or the programme a future coalition would enact.'
      )
    },
    202707: {
      rzeczpospolita: pressStory(
        'The constitutional election window approaches with the party system unsettled',
        'Scenario horizon: the President must order a vote within the end-of-term rules while every camp still argues over the coalition it will present.'
      ),
      onet: pressStory(
        'The summer campaign begins before the formal posters appear',
        'Scenario horizon: polling, local nominations and tactical desertion are already moving voters among lists whose final shape is not yet secure.'
      )
    },
    202708: {
      tvp: pressStory(
        'The election order turns governing claims into ballot tests',
        'Scenario horizon: ministers defend continuity, opposition parties demand a verdict and Lewica tries to convert leverage into a distinct mandate.'
      ),
      republika: pressStory(
        'The campaign begins with three rights and no uncontested leader',
        'Scenario horizon: conservative voters choose among institutional restoration, developmental competence and anti-system confrontation.'
      )
    },
    202709: {
      wp: pressStory(
        'One last argument: social security, democratic continuity or party independence',
        'Scenario horizon: Lewica’s closing choice will affect turnout and tactical voting, but the count will still enforce every committee threshold.'
      ),
      'kanal-zero': pressStory(
        'The debates end. The thresholds do not negotiate',
        'Scenario horizon: parties that spent years multiplying organisations now face the arithmetic that converts votes into seats—or waste.'
      )
    },
    202710: {
      onet: pressStory(
        'Poland votes. The next Sejm will reveal which alliances survived the campaign',
        'Scenario horizon: the simulated count applies the live electorate, party splits and committee thresholds before the political record becomes an epilogue.'
      ),
      tvn: pressStory(
        'Election night closes the campaign and opens the verdict on eight years',
        'Scenario horizon: Sejm proportional seats and one hundred Senate districts now decide which organisations retain parliamentary power.'
      )
    }
  };

  var pressPatronParty = function(outlet, qualities) {
    var turn = Math.abs(Number(qualities.time) || 0);
    if (outlet.patron === 'government') {
      if (outlet.id === 'tvp' &&
          ['pis', 'ko', 'left', 'neutral'].indexOf(
            qualities.public_media_patron
          ) >= 0) {
        return qualities.public_media_patron;
      }
      return qualities.government_party === 'pis' ? 'pis' :
        (qualities.government_party === 'lewica' ? 'left' : 'ko');
    }
    if (outlet.patron === 'pis-or-konf') {
      return turn % 2 ? 'konf' : 'pis';
    }
    if (outlet.patron === 'mostly-pis') {
      return turn % 4 === 3 ? 'konf' : 'pis';
    }
    return outlet.patron;
  };

  var pressRelationshipFrame = function(outlet, qualities) {
    var party = pressPatronParty(outlet, qualities);
    if (party === 'neutral') {
      return {kicker: 'NEWS DESK', label: 'NEUTRAL', text: ''};
    }
    if (party === 'left') {
      return {
        kicker: 'GOVERNMENT LINE',
        label: 'GOVERNMENT · ALIGNED',
        text: 'Public television treats Lewica as part of the governing line.'
      };
    }

    var relation = Number(qualities[party + '_relation']);
    relation = Number.isFinite(relation) ? relation : 0;
    var stance = relation >= 40 ? 'TOLERATES LEFT' :
      (relation <= 15 ? 'HOSTILE TO LEFT' : 'WARY OF LEFT');
    var labels = {ko: 'KO LINE', pis: 'PiS LINE', konf: 'HARD-RIGHT LINE'};
    var tails = {
      ko: relation >= 40
        ? 'KO-aligned coverage treats Lewica as a tolerable partner—for now.'
        : (relation <= 15
          ? 'The KO camp now presents Lewica as an obstacle, not an ally.'
          : 'KO wants Lewica useful, quiet and firmly junior.'),
      pis: relation >= 40
        ? 'The PiS line leaves Lewica a narrow path to usefulness.'
        : (relation <= 15
          ? 'The PiS line casts Lewica as a threat, not a partner.'
          : 'PiS keeps Lewica at arm’s length and under suspicion.'),
      konf: relation >= 40
        ? 'The hard right finds Lewica briefly useful against the centre.'
        : (relation <= 15
          ? 'The hard right frames Lewica as an enemy of nation and market.'
          : 'The hard right treats Lewica as a convenient opponent.')
    };
    return {
      kicker: labels[party],
      label: labels[party] + ' · ' + stance,
      text: tails[party]
    };
  };

  var pressTVPStory = function(outlet, story, qualities) {
    if (!story || story.sourceUrl || outlet.id !== 'tvp') {
      return story;
    }
    var patron = pressPatronParty(outlet, qualities);
    var headlinePrefixes = {
      pis: 'Government under fire: ',
      ko: 'Government restores order: ',
      left: 'Lewica delivers: ',
      neutral: 'Public record: '
    };
    var leads = {
      pis: 'PiS-aligned public television presents the development as evidence against the governing camp and its Left partner.',
      ko: 'KO-aligned public television presents the development as proof that the governing coalition is restoring competent rule.',
      left: 'Left-aligned public television foregrounds Lewica’s role and the social case for government action.',
      neutral: 'The pluralist public broadcaster separates the institutional record from the governing parties’ claims.'
    };
    return {
      headline: (headlinePrefixes[patron] || '') + story.headline,
      text: (leads[patron] ? leads[patron] + ' ' : '') + story.text,
      sourceUrl: story.sourceUrl,
      sourceDate: story.sourceDate
    };
  };

  var appendPressSkeleton = function(host, className, widths) {
    var skeleton = document.createElement('span');
    skeleton.className = className;
    skeleton.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < widths.length; i++) {
      var line = document.createElement('i');
      line.style.width = widths[i] + '%';
      skeleton.appendChild(line);
    }
    host.appendChild(skeleton);
  };

  window.renderPressReview = function() {
    var panel = document.getElementById('qualities_right');
    var state = window.dendryUI && window.dendryUI.dendryEngine.state;
    var qualities = state && state.qualities ? state.qualities : {};
    if (!panel) {
      return;
    }

    panel.textContent = '';
    panel.className = 'press-review';

    var year = Number(qualities.year) || 2019;
    var month = Number(qualities.month) || 10;
    var turn = Number(qualities.time) || 0;
    var dateKey = year * 100 + month;
    var available = pressReviewOutlets.filter(function(outlet) {
      return outlet.from <= dateKey;
    });
    var count = Math.min(available.length, 2 + Math.abs(turn % 2));
    var start = Math.abs(turn * 2) % available.length;

    var heading = document.createElement('header');
    heading.className = 'press-review-heading';
    var eyebrow = document.createElement('span');
    eyebrow.textContent = 'POLSKA / MEDIA';
    var title = document.createElement('strong');
    title.textContent = 'The morning front pages';
    var edition = document.createElement('small');
    edition.textContent =
      (qualities.date_label || 'October 2019') + ' · ' + count + ' voices';
    heading.appendChild(eyebrow);
    heading.appendChild(title);
    heading.appendChild(edition);
    panel.appendChild(heading);

    for (var i = 0; i < count; i++) {
      var outlet = available[(start + i) % available.length];
      var stories = pressReviewStories[dateKey] || {};
      var story = pressTVPStory(outlet, stories[outlet.id], qualities);
      var frame = pressRelationshipFrame(outlet, qualities);
      var article = document.createElement('article');
      article.className = 'press-card press-' + outlet.id;
      article.style.setProperty('--press-accent', outlet.accent);
      article.setAttribute('data-outlet', outlet.id);
      article.setAttribute('aria-label', story
        ? outlet.name + (story.sourceUrl ? ' sourced report: ' :
          ' simulated article: ') + story.headline
        : outlet.name + ' article slot; editorial content is not yet written');

      var masthead = document.createElement('div');
      masthead.className = 'press-masthead';
      var mark = document.createElement('b');
      mark.textContent = outlet.mark;
      var source = document.createElement('span');
      source.textContent = outlet.name;
      var timing = document.createElement('time');
      timing.textContent = 'NOW';
      masthead.appendChild(mark);
      masthead.appendChild(source);
      masthead.appendChild(timing);
      article.appendChild(masthead);

      var kicker = document.createElement('p');
      kicker.className = 'press-kicker';
      kicker.textContent = story
        ? (story.sourceUrl ? 'FROM THE ARCHIVE' : frame.kicker)
        : 'EDITORIAL SLOT';
      article.appendChild(kicker);

      if (story) {
        var headline = document.createElement('h2');
        headline.className = 'press-headline';
        headline.textContent = story.headline;
        var tease = document.createElement('p');
        tease.className = 'press-tease';
        tease.textContent = story.text +
          (story.sourceUrl || !frame.text ? '' : ' ' + frame.text);
        article.appendChild(headline);
        article.appendChild(tease);
      } else {
        appendPressSkeleton(article, 'press-title-skeleton', [94, 72]);
        appendPressSkeleton(article, 'press-copy-skeleton', [100, 96, 82]);
      }

      var footer = document.createElement('footer');
      if (story && story.sourceUrl) {
        var sourceLink = document.createElement('a');
        sourceLink.href = story.sourceUrl;
        sourceLink.target = '_blank';
        sourceLink.rel = 'noopener noreferrer';
        sourceLink.textContent = 'SOURCED · ' + story.sourceDate;
        footer.appendChild(sourceLink);
      } else {
        footer.textContent = story
          ? 'SIMULATED · ' + frame.label
          : 'Turn-specific copy to follow';
      }
      article.appendChild(footer);
      panel.appendChild(article);
    }
  };

  window.updateSidebarRight = function() {
    $('#qualities_right').empty();
    if (window.statusTabRight === 'press_review') {
      window.renderPressReview();
      return;
    }
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
    document.getElementById('qualities_right').className = '';
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
        var rightPanel = document.getElementById('qualities_right');
        if (rightPanel) {
          rightPanel.setAttribute('aria-labelledby', tabId);
        }
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
      var content = document.getElementById('content');
      window.enhancePartyElements(content);
      if (content) {
        var heading = content.querySelector('h1, h2');
        var sceneImages = content.querySelectorAll('.face-img:not([alt])');
        for (var imageIndex = 0; imageIndex < sceneImages.length; imageIndex++) {
          sceneImages[imageIndex].alt = heading
            ? 'Illustration for ' + heading.textContent.trim()
            : 'Event illustration';
        }
      }
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
  window.statusTabRight = "press_review";
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
    window.statusTabRight = "press_review";
    window.updateSidebarRight();
    window.updateRadio();
  };

}());
