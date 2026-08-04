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
      id: 'us-dem',
      className: 'party-us-dem',
      explanation: 'The Democratic Party is one of the two major political parties in the United States.',
      aliases: [
        ['Democratic Party', 'Democratic Party'],
        ['Democrats', 'Democrats']
      ]
    },
    {
      id: 'us-gop',
      className: 'party-us-gop',
      explanation: 'The Republican Party, or GOP, is one of the two major political parties in the United States.',
      aliases: [
        ['Republican Party', 'Republican Party'],
        ['Republicans', 'Republicans'],
        ['GOP', 'GOP']
      ]
    },
    {
      id: 'knp',
      className: 'party-knp',
      explanation: 'Congress of the New Right (KNP) is a historically significant Polish libertarian and national-conservative party associated with Janusz Korwin-Mikke and Stanisław Żółtek.',
      aliases: [
        ['Congress of the New Right', 'Kongres Nowej Prawicy'],
        ['Kongres Nowej Prawicy', 'Kongres Nowej Prawicy'],
        ['KNP', 'KNP']
      ]
    },
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
        ['Młoda Lewica', 'Młoda Lewica'],
        ['Younger progressives', 'Younger progressives'],
        ['Younger progressive', 'Younger progressives'],
        ['Young progressives', 'Young progressives']
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
      id: 'tak-dla-rozwoju',
      className: 'party-tak-rozwoj',
      explanation: 'Tak! Dla Rozwoju — a development-focused splinter built around infrastructure, investment and Paulina Matysiak\'s break with Razem.',
      aliases: [
        ['Tak! Dla Rozwoju', 'Tak! Dla Rozwoju'],
        ['Tak Dla Rozwoju', 'Tak! Dla Rozwoju']
      ]
    },
    {
      id: 'akcja-socjalistyczna',
      className: 'party-akcja-socjalistyczna',
      explanation: 'Akcja Socjalistyczna — the original-left split that can emerge from the Razem-Matysiak conflict in the scenario.',
      aliases: [['Akcja Socjalistyczna', 'Akcja Socjalistyczna']]
    },
    {
      id: 'partia-zero',
      className: 'party-p0',
      explanation: 'Partia Zero — the political vehicle associated with Krzysztof Stanowski and the Kanał Zero media ecosystem.',
      aliases: [
        ['Partia Zero', 'Partia Zero'],
        ['P0', 'P0']
      ]
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
  var entityAliases = {};
  var entityAliasPattern = [];
  var personAliases = {};
  var personDefinitionsById = {};
  var personAliasPattern = [];
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

  var entityDefinitions = [
    {
      id: 'kpo',
      explanation: 'KPO is Poland\'s National Recovery Plan, the package tied to EU post-pandemic recovery funds and reform milestones.',
      aliases: ['KPO', 'National Recovery Plan']
    },
    {
      id: 'pip',
      explanation: 'PIP (Państwowa Inspekcja Pracy) is Poland\'s state labour-inspection authority. It checks compliance with labour law, occupational safety, employment documentation and related worker protections, and can issue orders, fines and other enforcement measures within its legal powers.',
      aliases: [
        'PIP',
        'Państwowa Inspekcja Pracy',
        'State Labour Inspection',
        'State Labour Inspectorate'
      ]
    },
    {
      id: 'zelensky',
      explanation: 'Volodymyr Zelensky is the president of Ukraine during Russia\'s full-scale invasion and a central wartime diplomatic figure.',
      aliases: ['Zelensky', 'Zelenskyy', 'Volodymyr Zelensky', 'Volodymyr Zelenskyy']
    },
    {
      id: 'putin',
      explanation: 'Vladimir Putin is the president of Russia who ordered the 2022 full-scale invasion of Ukraine.',
      aliases: ['Putin', 'Vladimir Putin']
    },
    {
      id: 'european_commission',
      explanation: 'The European Commission is the EU\'s executive institution that proposes legislation and oversees treaty and budget enforcement.',
      aliases: [
        'European Commission',
        'European Comission',
        'Commission'
      ]
    },
    {
      id: 'constitutional_tribunal',
      explanation: 'The Constitutional Tribunal is Poland\'s court for constitutional review and a major flashpoint in rule-of-law disputes.',
      aliases: ['Constitutional Tribunal', 'Tribunal']
    },
    {
      id: 'nato',
      explanation: 'NATO is the North Atlantic Treaty Organization, the military alliance that includes Poland under collective defense obligations.',
      aliases: ['NATO', 'North Atlantic Treaty Organization']
    },
    {
      id: 'eu',
      explanation: 'The EU is the European Union, the political and economic bloc whose rules, funds, and institutions shape Polish policy choices.',
      aliases: ['EU', 'European Union']
    },
    {
      id: 'independence_day',
      explanation: 'Independence Day marks Poland\'s restoration of statehood in 1918 and is observed annually on 11 November.',
      aliases: ['Independence Day']
    },
    {
      id: 'independence_march_association',
      explanation: 'The Independence March Association is the nationalist organising body behind Warsaw\'s annual 11 November Independence March and its route, stage and public-facing coalition of organisers.',
      aliases: ['Independence March Association']
    },
    {
      id: 'daszynski',
      explanation: 'Ignacy Daszyński was a Polish socialist leader, co-founder of the Polish Socialist Party and the first prime minister of independent Poland in November 1918.',
      aliases: ['Ignacy Daszyński', 'Ignacy Daszynski', 'Daszyński', 'Daszynski']
    },
    {
      id: 'jakubiak',
      explanation: 'Marek Jakubiak is a Polish entrepreneur and former MP who combines a business background with national-conservative politics.',
      aliases: ['Marek Jakubiak', 'Jakubiak']
    },
    {
      id: 'tanajno',
      explanation: 'Paweł Tanajno is an independent Polish entrepreneur and anti-establishment activist who has run for national office outside the main parties.',
      aliases: ['Paweł Tanajno', 'Pawel Tanajno', 'Tanajno']
    },
    {
      id: 'witkowski',
      explanation: 'Waldemar Witkowski is a Polish labour politician and housing-cooperative manager who leads the historic Labour Union (Unia Pracy) tradition.',
      aliases: ['Waldemar Witkowski', 'Witkowski']
    },
    {
      id: 'piotrowski',
      explanation: 'Mirosław Piotrowski is a Polish academic and former MEP associated with the Movement of True Europe and socially conservative politics.',
      aliases: ['Mirosław Piotrowski', 'Miroslaw Piotrowski', 'Piotrowski']
    },
    {
      id: 'federation_for_the_republic',
      explanation: 'Federation for the Republic is the national-conservative political organisation associated with Marek Jakubiak and his presidential candidacy.',
      aliases: ['Federation for the Republic', 'Federacja dla Rzeczypospolitej']
    },
    {
      id: 'movement_of_true_europe',
      explanation: 'The Movement of True Europe is a socially conservative political formation associated with academic and former MEP Mirosław Piotrowski.',
      aliases: ['Movement of True Europe', 'Ruch Prawdziwa Europa']
    },
    {
      id: 'gutowski',
      explanation: 'Marcin Gutowski is a Polish investigative journalist associated with major public-interest reporting projects.',
      aliases: ['Marcin Gutowski', 'Gutowski']
    }
  ];

  entityDefinitions.forEach(function(definition) {
    definition.aliases.forEach(function(alias) {
      entityAliases[alias] = definition;
      entityAliasPattern.push(alias);
    });
  });
  entityAliasPattern.sort(function(left, right) {
    return right.length - left.length;
  });
  entityAliasPattern = new RegExp(
    '(^|[^A-Za-zÀ-ž0-9_])(' +
      entityAliasPattern.map(escapeRegExp).join('|') +
    ')(?=$|[^A-Za-zÀ-ž0-9_])',
    'g'
  );

  var personDefinitions = [
    {
      id: 'duda',
      className: 'party-pis',
      explanation: 'Andrzej Duda is the Polish president elected in 2015 and re-elected in 2020 with support from PiS.',
      aliases: ['Andrzej Duda', 'Duda']
    },
    {
      id: 'nawrocki',
      className: 'party-pis',
      explanation: 'Karol Nawrocki is a PiS-backed Polish politician and historian who led the 2025 presidential campaign on a civic committee ticket.',
      aliases: ['Karol Nawrocki', 'Nawrocki']
    },
    {
      id: 'bielan',
      className: 'party-pis',
      explanation: 'Adam Bielan is a Polish PiS politician and European Parliament member associated with the party’s organisational and campaign apparatus.',
      aliases: ['Adam Bielan', 'Bielan']
    },
    {
      id: 'kaczynski',
      className: 'party-pis',
      explanation: 'Jarosław Kaczyński is the long-time leader and chief strategist of Law and Justice (PiS).',
      aliases: [
        'Jaroslaw Kaczynski',
        'Jarosław Kaczyński',
        'Kaczynski',
        'Kaczyński'
      ]
    },
    {
      id: 'morawiecki',
      className: 'party-pis',
      explanation: 'Mateusz Morawiecki served as prime minister of Poland from 2017 to 2023 under PiS governments.',
      aliases: ['Mateusz Morawiecki', 'Morawiecki']
    },
    {
      id: 'pelczynska_nalecz',
      className: 'party-p2050',
      explanation: 'Katarzyna Pełczyńska-Nałęcz is a Poland 2050 leader associated with institutional reform and state-capacity policy.',
      aliases: [
        'Katarzyna Pelczynska-Nalecz',
        'Katarzyna Pełczyńska-Nałęcz',
        'Pelczynska-Nalecz',
        'Pełczyńska-Nałęcz'
      ]
    },
    {
      id: 'hennig_kloska',
      className: 'party-p2050',
      explanation: 'Paulina Hennig-Kloska is a Poland 2050 politician associated with climate and public-administration policy.',
      aliases: [
        'Paulina Hennig-Kloska',
        'Paulina Hennig-Kłoska',
        'Hennig-Kloska',
        'Hennig-Kłoska'
      ]
    },
    {
      id: 'zielinska',
      className: 'party-ko',
      explanation: 'Urszula Zielińska is a Polish Green politician associated with climate, municipal and equality-focused policy work.',
      aliases: ['Urszula Zielinska', 'Urszula Zielińska', 'Zielinska', 'Zielińska']
    },
    {
      id: 'blaszczak',
      className: 'party-pis',
      explanation: 'Mariusz Błaszczak is a senior PiS politician who served as defence minister and party organizer.',
      aliases: ['Mariusz Blaszczak', 'Mariusz Błaszczak', 'Blaszczak', 'Błaszczak']
    },
    {
      id: 'wawrzyk',
      className: 'party-pis',
      explanation: 'Piotr Wawrzyk is a PiS politician and former deputy foreign minister associated with administrative and consular policy controversies.',
      aliases: ['Piotr Wawrzyk', 'Wawrzyk']
    },
    {
      id: 'szydlo',
      className: 'party-pis',
      explanation: 'Beata Szydło was prime minister in 2015 to 2017 and remains a prominent welfare-conservative figure in PiS.',
      aliases: ['Beata Szydlo', 'Beata Szydło', 'Szydlo', 'Szydło']
    },
    {
      id: 'ziobro',
      className: 'party-sovereign-poland',
      explanation: 'Zbigniew Ziobro is a former justice minister and prosecutor general who led Solidarna Polska later renamed Suwerenna Polska.',
      aliases: ['Zbigniew Ziobro', 'Ziobro']
    },
    {
      id: 'warchol',
      className: 'party-sovereign-poland',
      explanation: 'Marcin Warchoł is a politician from the Solidarna Polska and Suwerenna Polska camp focused on justice policy.',
      aliases: ['Marcin Warchol', 'Marcin Warchoł', 'Warchol', 'Warchoł']
    },
    {
      id: 'jaki',
      className: 'party-sovereign-poland',
      explanation: 'Patryk Jaki is a Suwerenna Polska politician and MEP known for hard-line law-and-order messaging.',
      aliases: ['Patryk Jaki', 'Jaki']
    },
    {
      id: 'barski',
      className: 'party-pis',
      explanation: 'Dariusz Barski is a prosecutor associated with the contested National Prosecutor appointment in the PiS-era judiciary dispute.',
      aliases: ['Dariusz Barski', 'Barski']
    },
    {
      id: 'gowin',
      className: 'party-pis',
      explanation: 'Jarosław Gowin is the founder of Agreement (Porozumienie) and a former deputy prime minister in the United Right camp.',
      aliases: ['Jaroslaw Gowin', 'Jarosław Gowin', 'Gowin']
    },
    {
      id: 'tusk',
      className: 'party-ko',
      explanation: 'Donald Tusk is a former Polish prime minister and former European Council president who leads Civic Platform in KO.',
      aliases: ['Donald Tusk', 'Tusk']
    },
    {
      id: 'miller',
      className: 'party-sld',
      explanation: 'Leszek Miller is a former Polish prime minister and a defining figure of the post-communist SLD establishment.',
      aliases: ['Leszek Miller', 'Miller']
    },
    {
      id: 'trzaskowski',
      className: 'party-ko',
      explanation: 'Rafał Trzaskowski is the mayor of Warsaw and a leading KO figure who narrowly lost the 2020 presidential election.',
      aliases: ['Rafal Trzaskowski', 'Rafał Trzaskowski', 'Trzaskowski']
    },
    {
      id: 'sikorski',
      className: 'party-ko',
      explanation: 'Radosław Sikorski is a veteran Polish diplomat and KO politician known for foreign policy roles.',
      aliases: ['Radoslaw Sikorski', 'Radosław Sikorski', 'Sikorski']
    },
    {
      id: 'budka',
      className: 'party-ko',
      explanation: 'Borys Budka is a Civic Platform politician who led PO in 2020 to 2021 before Donald Tusk returned.',
      aliases: ['Borys Budka', 'Budka']
    },
    {
      id: 'schetyna',
      className: 'party-ko',
      explanation: 'Grzegorz Schetyna is a senior Civic Platform organizer and former PO leader in the late 2010s.',
      aliases: ['Grzegorz Schetyna', 'Schetyna']
    },
    {
      id: 'grodzki',
      className: 'party-ko',
      explanation: 'Tomasz Grodzki is a KO senator who served as Marshal of the Senate after the 2019 election.',
      aliases: ['Tomasz Grodzki', 'Grodzki']
    },
    {
      id: 'kidawa_blonska',
      className: 'party-ko',
      explanation: 'Małgorzata Kidawa-Błońska is a Civic Platform politician, former Sejm deputy marshal, and KO presidential nominee before withdrawal in 2020.',
      aliases: [
        'Małgorzata Kidawa-Błońska',
        'Malgorzata Kidawa-Blonska',
        'Kidawa-Błońska',
        'Kidawa-Blonska',
        'Kidawa'
      ]
    },
    {
      id: 'holownia',
      className: 'party-p2050',
      explanation: 'Szymon Hołownia is a former media presenter who founded Poland 2050 and became one of the main centrist opposition leaders.',
      aliases: ['Szymon Holownia', 'Szymon Hołownia', 'Holownia', 'Hołownia']
    },
    {
      id: 'kosiniak',
      className: 'party-psl',
      explanation: 'Władysław Kosiniak-Kamysz leads the agrarian-centrist PSL and is a key architect of its alliances with centrist partners.',
      aliases: [
        'Wladyslaw Kosiniak-Kamysz',
        'Władysław Kosiniak-Kamysz',
        'Kosiniak-Kamysz',
        'Kosiniak',
        'Kamysz'
      ]
    },
    {
      id: 'czarzasty',
      className: 'party-lewica',
      explanation: 'Włodzimierz Czarzasty is a co-leader of the New Left and one of the main parliamentary negotiators on the Polish left.',
      aliases: ['Wlodzimierz Czarzasty', 'Włodzimierz Czarzasty', 'Czarzasty']
    },
    {
      id: 'biedron',
      className: 'party-lewica',
      explanation: 'Robert Biedroń is the founder of Wiosna, former mayor of Słupsk, and a leading New Left politician at national and EU level.',
      aliases: ['Robert Biedron', 'Robert Biedroń', 'Biedron', 'Biedroń']
    },
    {
      id: 'smiszek',
      className: 'party-lewica',
      explanation: 'Krzysztof Śmiszek is a New Left politician known for legal rights advocacy and parliamentary work on justice issues.',
      aliases: ['Krzysztof Smiszek', 'Krzysztof Śmiszek', 'Smiszek', 'Śmiszek']
    },
    {
      id: 'scheuring_wielgus',
      className: 'party-lewica',
      explanation: 'Joanna Scheuring-Wielgus is a New Left politician known for secular and civil-rights advocacy.',
      aliases: [
        'Joanna Scheuring-Wielgus',
        'Joanna Scheuring Wielgus',
        'Scheuring-Wielgus',
        'Scheuring Wielgus'
      ]
    },
    {
      id: 'zandberg',
      className: 'party-razem',
      explanation: 'Adrian Zandberg is a co-founder and principal ideological voice of Razem on labor, welfare, and public investment.',
      aliases: ['Adrian Zandberg', 'Zandberg']
    },
    {
      id: 'matysiak',
      className: 'party-razem',
      explanation: 'Paulina Matysiak is a left-wing MP identified with rail and infrastructure policy and later split currents in this scenario.',
      aliases: [
        'Paulina Matysiak',
        'Pola Matysiak',
        'Matysiak'
      ]
    },
    {
      id: 'biejat',
      className: 'party-lewica',
      explanation: 'Magdalena Biejat is a New Left politician known for social policy, tenant rights, and welfare-state advocacy.',
      aliases: ['Magdalena Biejat', 'Biejat']
    },
    {
      id: 'zukowska',
      className: 'party-lewica',
      explanation: 'Anna-Maria Żukowska is a New Left parliamentarian known for combative media performances and caucus messaging discipline.',
      aliases: ['Anna-Maria Żukowska', 'Anna-Maria Zukowska', 'Żukowska', 'Zukowska']
    },
    {
      id: 'kotula',
      className: 'party-lewica',
      explanation: 'Katarzyna Kotula is a New Left politician associated with feminist mobilisation and equality-policy campaigning.',
      aliases: ['Katarzyna Kotula', 'Kotula']
    },
    {
      id: 'wieczorek',
      className: 'party-sld',
      explanation: 'Dariusz Wieczorek is an SLD-rooted organiser focused on regional machinery and parliamentary management.',
      aliases: ['Dariusz Wieczorek', 'Wieczorek']
    },
    {
      id: 'gawkowski',
      className: 'party-lewica',
      explanation: 'Krzysztof Gawkowski is a New Left politician active in parliamentary coordination and digital-policy debates.',
      aliases: ['Krzysztof Gawkowski', 'Gawkowski']
    },
    {
      id: 'nowicka',
      className: 'party-lewica',
      explanation: 'Wanda Nowicka is a veteran feminist and parliamentary advocate for reproductive rights and secular civil law.',
      aliases: ['Wanda Nowicka', 'Nowicka']
    },
    {
      id: 'zawisza',
      className: 'party-razem',
      explanation: 'Marcelina Zawisza is a Razem MP focused on health care, social services, and care-economy policy.',
      aliases: ['Marcelina Zawisza', 'Zawisza']
    },
    {
      id: 'dziemianowicz',
      className: 'party-lewica',
      explanation: 'Agnieszka Dziemianowicz-Bąk is a New Left politician focused on labor rights, education, and social policy reform.',
      aliases: [
        'Agnieszka Dziemianowicz-Bak',
        'Agnieszka Dziemianowicz-Bąk',
        'Dziemianowicz-Bak',
        'Dziemianowicz-Bąk',
        'Dziemianowicz'
      ]
    },
    {
      id: 'mentzen',
      className: 'party-konf',
      explanation: 'Sławomir Mentzen is a libertarian-right leader of New Hope and one of the most prominent faces of Konfederacja.',
      aliases: ['Slawomir Mentzen', 'Sławomir Mentzen', 'Mentzen']
    },
    {
      id: 'korwin_mikke',
      className: 'party-konf',
      explanation: 'Janusz Korwin-Mikke is a veteran libertarian politician and founder of KORWiN whose rhetoric shaped the Polish far-right scene.',
      aliases: [
        'Janusz Korwin-Mikke',
        'Janusz Korwin Mikke',
        'Korwin-Mikke',
        'Korwin Mikke',
        'Korwin'
      ]
    },
    {
      id: 'witek',
      className: 'party-pis',
      explanation: 'Elżbieta Witek is a PiS politician and former Sejm Marshal who features in government-formation and constitutional-crisis branches.',
      aliases: ['Elżbieta Witek', 'Elzbieta Witek', 'Witek']
    },
    {
      id: 'bosak',
      className: 'party-konf',
      explanation: 'Krzysztof Bosak is a nationalist leader in Konfederacja and a former presidential candidate.',
      aliases: ['Krzysztof Bosak', 'Bosak']
    },
    {
      id: 'braun',
      className: 'party-konf',
      explanation: 'Grzegorz Braun is a monarchist-nationalist politician whose faction later forms the Korona track after the Konfederacja split.',
      aliases: ['Grzegorz Braun', 'Braun']
    },
    {
      id: 'dziambor',
      className: 'party-konf',
      explanation: 'Artur Dziambor is a libertarian politician who left KORWiN and helped build the Wolnościowcy breakaway.',
      aliases: ['Artur Dziambor', 'Dziambor']
    },
    {
      id: 'kulesza',
      className: 'party-konf',
      explanation: 'Jakub Kulesza is a libertarian right politician linked to KORWiN and later Wolnościowcy circles.',
      aliases: ['Jakub Kulesza', 'Kulesza']
    },
    {
      id: 'sosnierz',
      className: 'party-konf',
      explanation: 'Dobromir Sośnierz is a libertarian right politician associated with KORWiN and Wolnościowcy currents.',
      aliases: ['Dobromir Sosnierz', 'Dobromir Sośnierz', 'Sosnierz', 'Sośnierz']
    },
    {
      id: 'stanowski',
      className: 'party-p0',
      explanation: 'Krzysztof Stanowski is a sports journalist and media entrepreneur represented in this scenario as the Partia Zero figure.',
      aliases: ['Krzysztof Stanowski', 'Stanowski']
    },
    {
      id: 'szpilski',
      className: 'party-nowa-solidarnosc',
      explanation: 'Chrystian Szpilski is a founder character of the in-game Nowa Solidarność formation in the 2023 split event.',
      aliases: ['Chrystian Szpilski', 'Szpilski']
    },
    {
      id: 'spalinski',
      className: 'party-nowa-solidarnosc',
      explanation: 'Patryk Spaliński is a founder character of the in-game Nowa Solidarność formation in the 2023 split event.',
      aliases: ['Patryk Spalinski', 'Patryk Spaliński', 'Spalinski', 'Spaliński']
    },
    {
      id: 'kozlowski',
      className: 'party-nowa-solidarnosc',
      explanation: 'Maciej Kozłowski is a founder character of the in-game Nowa Solidarność formation in the 2023 split event.',
      aliases: ['Maciej Kozlowski', 'Maciej Kozłowski', 'Kozlowski', 'Kozłowski']
    },
    {
      id: 'rozenek',
      className: 'party-pps',
      explanation: 'Andrzej Rozenek is a left-wing parliamentarian tied in this scenario to the PPS parliamentary breakaway move.',
      aliases: ['Andrzej Rozenek', 'Rozenek']
    },
    {
      id: 'kwiatkowski',
      className: 'party-pps',
      explanation: 'Robert Kwiatkowski is a Polish political and media figure included here in the PPS breakaway parliamentary bloc.',
      aliases: ['Robert Kwiatkowski', 'Kwiatkowski']
    },
    {
      id: 'senyszyn',
      className: 'party-pps',
      explanation: 'Joanna Senyszyn is a veteran left politician and economist appearing here as part of the PPS breakaway grouping.',
      aliases: ['Joanna Senyszyn', 'Senyszyn']
    },
    {
      id: 'konieczny',
      className: 'party-pps',
      explanation: 'Wojciech Konieczny is a physician-politician and senator aligned with the PPS support line in this event chain.',
      aliases: ['Wojciech Konieczny', 'Konieczny']
    },
    {
      id: 'morawska_stanecka',
      className: 'party-pps',
      explanation: 'Gabriela Morawska-Stanecka is a senator and former deputy senate marshal appearing in the PPS support coalition context.',
      aliases: [
        'Gabriela Morawska-Stanecka',
        'Gabriela Morawska Stanecka',
        'Morawska-Stanecka',
        'Morawska Stanecka'
      ]
    },
    {
      id: 'zoltek',
      className: 'party-knp',
      explanation: 'Stanisław Żółtek is a Polish libertarian-right politician associated with the Congress of the New Right and a small anti-establishment presidential campaign.',
      aliases: ['Stanisław Żółtek', 'Stanislaw Zoltek', 'Żółtek', 'Zoltek']
    },
    {
      id: 'witkowski',
      className: 'party-unia-pracy',
      explanation: 'Waldemar Witkowski is a Polish labour politician and housing-cooperative manager who leads the historic Labour Union (Unia Pracy) tradition.',
      aliases: ['Waldemar Witkowski', 'Witkowski']
    },
    {
      id: 'biden',
      className: 'party-us-dem',
      explanation: 'Joe Biden served as the 46th president of the United States and is identified with the Democratic Party.',
      aliases: [
        'Joe Biden',
        'Joseph Biden',
        'Joseph R. Biden',
        'Joe R. Biden',
        'Biden'
      ]
    },
    {
      id: 'trump',
      className: 'party-us-gop',
      explanation: 'Donald Trump served as the 45th president of the United States and is the dominant figure in recent Republican politics.',
      aliases: ['Donald Trump', 'Trump']
    },
    {
      id: 'harris',
      className: 'party-us-dem',
      explanation: 'Kamala Harris served as vice president of the United States and is a leading figure in the Democratic Party.',
      aliases: ['Kamala Harris', 'Harris']
    },
    {
      id: 'ramaswamy',
      className: 'party-us-gop',
      explanation: 'Vivek Ramaswamy is a Republican candidate-entrepreneur known for anti-establishment campaign messaging.',
      aliases: ['Vivek Ramaswamy', 'Vivek', 'Ramaswamy']
    },
    {
      id: 'desantis',
      className: 'party-us-gop',
      explanation: 'Ron DeSantis is the governor of Florida and a major conservative contender in Republican presidential politics.',
      aliases: ['Ron DeSantis', 'Ronald DeSantis', 'DeSantis']
    },
    {
      id: 'haley',
      className: 'party-us-gop',
      explanation: 'Nikki Haley is a former South Carolina governor and former US ambassador to the UN in Republican politics.',
      aliases: ['Nikki Haley', 'Haley']
    },
    {
      id: 'rubio',
      className: 'party-us-gop',
      explanation: 'Marco Rubio is a Republican senator from Florida known for foreign policy and national-security positioning.',
      aliases: ['Marco Rubio', 'Rubio']
    },
    {
      id: 'vance',
      className: 'party-us-gop',
      explanation: 'J. D. Vance is a Republican politician associated with populist-national conservative currents in US politics.',
      aliases: ['J. D. Vance', 'JD Vance', 'J.D. Vance', 'Vance']
    },
    {
      id: 'obama',
      className: 'party-us-dem',
      explanation: 'Barack Obama served as the 44th president of the United States and remains a defining Democratic figure.',
      aliases: ['Barack Obama', 'Obama']
    },
    {
      id: 'george_w_bush',
      className: 'party-us-gop',
      explanation: 'George W. Bush served as the 43rd president of the United States and led the GOP in the post-9/11 era.',
      aliases: ['George W. Bush', 'George Bush', 'Bush']
    },
    {
      id: 'bill_clinton',
      className: 'party-us-dem',
      explanation: 'Bill Clinton served as the 42nd president of the United States and shaped centrist Democratic politics in the 1990s.',
      aliases: ['Bill Clinton', 'William Clinton', 'Clinton']
    },
    {
      id: 'george_h_w_bush',
      className: 'party-us-gop',
      explanation: 'George H. W. Bush served as the 41st president of the United States after prior roles in diplomacy and intelligence.',
      aliases: ['George H. W. Bush']
    },
    {
      id: 'reagan',
      className: 'party-us-gop',
      explanation: 'Ronald Reagan served as the 40th president of the United States and became an icon of modern conservative politics.',
      aliases: ['Ronald Reagan', 'Reagan']
    },
    {
      id: 'carter',
      className: 'party-us-dem',
      explanation: 'Jimmy Carter served as the 39th president of the United States and later became globally known for humanitarian work.',
      aliases: ['Jimmy Carter', 'James Carter', 'Carter']
    },
    {
      id: 'ford',
      className: 'party-us-gop',
      explanation: 'Gerald Ford served as the 38th president of the United States after succeeding Richard Nixon.',
      aliases: ['Gerald Ford', 'Ford']
    },
    {
      id: 'nixon',
      className: 'party-us-gop',
      explanation: 'Richard Nixon served as the 37th president of the United States and resigned during the Watergate scandal.',
      aliases: ['Richard Nixon', 'Nixon']
    },
    {
      id: 'lbj',
      className: 'party-us-dem',
      explanation: 'Lyndon B. Johnson served as the 36th president of the United States and drove the Great Society reforms.',
      aliases: ['Lyndon B. Johnson', 'Lyndon Johnson', 'Johnson']
    },
    {
      id: 'jfk',
      className: 'party-us-dem',
      explanation: 'John F. Kennedy served as the 35th president of the United States and became a lasting symbol of Cold War era liberal leadership.',
      aliases: ['John F. Kennedy', 'John Kennedy', 'Kennedy']
    }
  ];

  personDefinitions.forEach(function(definition) {
    personDefinitionsById[definition.id] = definition;
    definition.aliases.forEach(function(alias) {
      personAliases[alias] = definition;
      personAliasPattern.push(alias);
    });
  });
  personAliasPattern.sort(function(left, right) {
    return right.length - left.length;
  });
  personAliasPattern = new RegExp(
    '(^|[^A-Za-zÀ-ž0-9_])(' +
      personAliasPattern.map(escapeRegExp).join('|') +
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

  var partyLogoIdForAlias = function(match, alias) {
    if (!match) {
      return '';
    }
    if (match.definition.id === 'lewica' && alias === 'Lewica Razem') {
      return 'razem';
    }
    return match.definition.id;
  };

  var partyLogoIds = {
    'nowa-solidarnosc': true,
    'lewica': true,
    'sld': true,
    'wiosna': true,
    'razem': true,
    'pps': true,
    'unia-pracy': true,
    'left-labor': true,
    'young-left': true,
    'tak-dla-rozwoju': true,
    'akcja-socjalistyczna': true,
    'ko': true,
    'po': true,
    'nowoczesna': true,
    'inicjatywa-polska': true,
    'zieloni': true,
    'pis': true,
    'psl': true,
    'p2050': true,
    'third-way': true,
    'konf': true,
    'kkp': true,
    'national-movement': true,
    'agreement': true,
    'sovereign-poland': true,
    'solidary-poland': true,
    'rozwoj-plus': true,
    'partia-zero': true,
    'us-dem': true,
    'us-gop': true,
    'knp': true
  };

  var partyMarkup = function(alias) {
    var match = partyAliases[alias];
    if (!match) {
      return alias;
    }
    var logoId = partyLogoIdForAlias(match, alias);
    var logoMarkup = partyLogoIds[logoId]
      ? '<span class="party-name-logo" aria-hidden="true"></span>'
      : '';
    return '<span class="party party-name ' + match.definition.className +
      '" title="' + escapeAttribute(match.definition.explanation) +
      '" data-party="' + match.definition.id +
      '" data-party-logo="' + logoId + '">' +
      logoMarkup +
      '<span class="party-name-label">' + partyLabel(alias) + '</span>' +
      '</span>';
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

  var entityMarkup = function(alias) {
    var definition = entityAliases[alias];
    if (!definition) {
      return alias;
    }
    return '<span class="entity-name" title="' +
      escapeAttribute(definition.explanation) +
      '" data-entity="' + definition.id + '">' +
      alias + '</span>';
  };

  var replaceEntityAliases = function(text, addMarkup) {
    return text.replace(
      entityAliasPattern,
      function(fullMatch, prefix, alias) {
        var replacement = addMarkup ? entityMarkup(alias) : alias;
        return prefix + replacement;
      }
    );
  };

  var personTooltip = function(definition) {
    if (!definition || typeof definition.explanation !== 'string') {
      return '';
    }
    return definition.explanation.trim();
  };

  var resolvePersonDefinition = function(definition) {
    if (!definition) {
      return definition;
    }

    var engine = window.dendryUI && window.dendryUI.dendryEngine;
    var qualities = engine && engine.state && engine.state.qualities;

    var isRazemLedMerger =
      Number(qualities && qualities.nowa_lewica_merger_agreed) > 0 &&
      (String(qualities && qualities.merger_leader || '') === 'Razem' ||
      /\bLewica Razem\b/i.test(String(qualities && qualities.left_party_name || '')));
    var mergedLeft =
      Number(qualities && qualities.nowa_lewica_merger_agreed) > 0;
    var youngLeftVisible =
      Number(qualities && qualities.progressives_active) > 0 ||
      Number(qualities && qualities.progressives_party_formed) > 0;

    var thirdWayJoint =
      Number(qualities && qualities.third_way_joint_list) > 0 ||
      ((Number(qualities && qualities.third_way_active) > 0 ||
      Number(qualities && qualities.third_way_2023_done) > 0) &&
      Number(qualities && qualities.third_way_split) === 0);

    var morawieckiSplit =
      Number(qualities && qualities.pis_morawiecki_camp) > 0 ||
      Number(qualities && qualities.rozwoj_club_formed) > 0 ||
      Number(qualities && qualities.rozwoj_association_members) > 0;

    if (definition.id === 'gowin') {
      var porozumienieStatus = String(
        qualities && qualities.porozumienie_status || ''
      ).toLowerCase();
      if (
        porozumienieStatus.indexOf('outside') >= 0 ||
        porozumienieStatus.indexOf('opposition') >= 0 ||
        porozumienieStatus.indexOf('independent') >= 0
      ) {
        return {
          id: definition.id,
          className: 'party-agreement',
          explanation: 'Jarosław Gowin now leads an independent Porozumienie current outside the PiS cabinet bloc.',
          aliases: definition.aliases
        };
      }
    }

    if (definition.id === 'holownia') {
      return {
        id: definition.id,
        className: thirdWayJoint ? 'party-third-way' : 'party-p2050',
        explanation: thirdWayJoint
          ? 'Szymon Hołownia appears as the Poland 2050 co-leader inside the Third Way alliance.'
          : 'Szymon Hołownia appears as the standalone leader of Poland 2050 after the Third Way split.',
        aliases: definition.aliases
      };
    }

    if (definition.id === 'kosiniak') {
      return {
        id: definition.id,
        className: thirdWayJoint ? 'party-third-way' : 'party-psl',
        explanation: thirdWayJoint
          ? 'Władysław Kosiniak-Kamysz appears as the PSL co-leader inside the Third Way alliance.'
          : 'Władysław Kosiniak-Kamysz appears as the standalone PSL leader after the Third Way split.',
        aliases: definition.aliases
      };
    }

    if (definition.id === 'morawiecki' && morawieckiSplit) {
      return {
        id: definition.id,
        className: 'party-rozwoj',
        explanation: 'Mateusz Morawiecki now fronts the Rozwój+ developmental bloc after splitting from the unified PiS parliamentary camp.',
        aliases: definition.aliases
      };
    }

    if (definition.id === 'ziobro') {
      return {
        id: definition.id,
        className: Number(qualities && qualities.suwerenna_renamed) > 0
          ? 'party-sovereign-poland'
          : 'party-solidary-poland',
        explanation: 'Zbigniew Ziobro leads Solidarna Polska/Suwerenna Polska and is rendered with that distinct current rather than default PiS styling.',
        aliases: definition.aliases
      };
    }

    if (
      mergedLeft &&
      (
        definition.id === 'miller' ||
        definition.id === 'wieczorek' ||
        definition.id === 'czarzasty' ||
        definition.id === 'biedron' ||
        definition.id === 'smiszek' ||
        definition.id === 'scheuring_wielgus'
      )
    ) {
      if (isRazemLedMerger) {
        return {
          id: definition.id,
          className: 'party-razem',
          explanation: 'After the Razem-led merger, this former SLD/Wiosna figure is rendered under the Razem-led unified party line.',
          aliases: definition.aliases
        };
      }
      return {
        id: definition.id,
        className: youngLeftVisible ? 'party-progressive' : 'party-nowa-lewica',
        explanation: youngLeftVisible
          ? 'After the merger, this former SLD/Wiosna figure is aligned with the progressive current branding.'
          : 'After the merger, this former SLD/Wiosna figure is aligned with the establishment New Left branding.',
        aliases: definition.aliases
      };
    }

    if (definition.id !== 'braun') {
      return definition;
    }

    var braunSplitActive =
      Number(qualities && qualities.far_right_split) > 0 ||
      Number(qualities && qualities.korona_seats) > 0 ||
      Number(qualities && qualities.korona_poll) > 0 ||
      Number(qualities && qualities.korona_vote_intent) > 0;
    if (!braunSplitActive) {
      return definition;
    }
    return {
      id: definition.id,
      className: 'party-kkp',
      explanation: 'Grzegorz Braun leads the Korona current after splitting from Konfederacja and becomes a separate far-right pole.',
      aliases: definition.aliases
    };
  };

  var personMarkup = function(alias) {
    var definition = resolvePersonDefinition(personAliases[alias]);
    if (!definition) {
      return alias;
    }
    return '<span class="party ' + definition.className +
      ' person-name" title="' + escapeAttribute(personTooltip(definition)) +
      '" data-party-person="' + definition.id + '">' +
      alias + '</span>';
  };

  var replacePersonAliases = function(text, addMarkup) {
    return text.replace(
      personAliasPattern,
      function(fullMatch, prefix, alias) {
        var replacement = addMarkup ? personMarkup(alias) : alias;
        return prefix + replacement;
      }
    );
  };

  var replaceOutsideTags = function(text, replacer) {
    return text.split(/(<[^>]+>)/g).map(function(part) {
      if (!part || part.charAt(0) === '<') {
        return part;
      }
      return replacer(part);
    }).join('');
  };

  var hasClassName = function(tag, className) {
    var classMatch = tag.match(/\bclass=(["'])(.*?)\1/i);
    if (!classMatch) {
      return false;
    }
    var classes = classMatch[2].split(/\s+/);
    for (var i = 0; i < classes.length; i++) {
      if (classes[i] === className) {
        return true;
      }
    }
    return false;
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
        var insidePerson = elementStack.length &&
          elementStack[elementStack.length - 1].person;
        var insideEntity = elementStack.length &&
          elementStack[elementStack.length - 1].entity;
        var withEntityAliases = replaceOutsideTags(
          token,
          function(part) {
            return replaceEntityAliases(part, !insideEntity);
          }
        );
        var withPersonAliases = replaceOutsideTags(
          withEntityAliases,
          function(part) {
            return replacePersonAliases(part, !insidePerson);
          }
        );
        return replaceOutsideTags(
          withPersonAliases,
          function(part) {
            return replacePartyAliases(part, !insideParty);
          }
        );
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
      var ownPerson = hasClassName(token, 'person-name');
      var ownEntity = hasClassName(token, 'entity-name');
      var inheritedParty = elementStack.length
        ? elementStack[elementStack.length - 1].party
        : null;
      var inheritedPerson = elementStack.length
        ? elementStack[elementStack.length - 1].person
        : null;
      var inheritedEntity = elementStack.length
        ? elementStack[elementStack.length - 1].entity
        : null;
      var activeParty = ownParty || inheritedParty;
      var activePerson = ownPerson || inheritedPerson;
      var activeEntity = ownEntity || inheritedEntity;
      var voidElement = /\/\s*>$/.test(token) ||
        /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i
          .test(openingTag[1]);
      if (!voidElement) {
        elementStack.push({
          tag: openingTag[1],
          party: activeParty,
          person: activePerson,
          entity: activeEntity
        });
      }
      return addPartyExplanation(token, ownParty);
    }).join('');
  };

  window.enhancePartyElements = function(root) {
    if (!root || !root.querySelectorAll) {
      return;
    }
    var candidates = root.querySelectorAll('[class], .party');
    var elements = Array.prototype.filter.call(candidates, function(element) {
      if (element.classList.contains('party')) {
        return true;
      }
      for (var i = 0; i < element.classList.length; i++) {
        if (partyDefinitionsByClass[element.classList[i]]) {
          return true;
        }
      }
      return false;
    });
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
      var personDefinition = null;
      var definition = null;
      var text = element.textContent.replace(/\s+/g, ' ').trim();
      var personId = element.getAttribute('data-party-person');
      if (personId && personDefinitionsById[personId]) {
        personDefinition = resolvePersonDefinition(
          personDefinitionsById[personId]
        );
      } else if (personAliases[text]) {
        personDefinition = resolvePersonDefinition(personAliases[text]);
      }
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
      if (personDefinition) {
        element.title = personTooltip(personDefinition);
        element.setAttribute('data-party-person', personDefinition.id);
        element.classList.add('person-name');
      }
      if (definition) {
        element.classList.add('party');
        if (!personDefinition) {
          element.title = definition.explanation;
        }
        element.setAttribute('data-party', definition.id);
        if (exactAlias) {
          var logoOverride = partyLogoIdForAlias(exactAlias, text);
          if (logoOverride) {
            element.setAttribute('data-party-logo', logoOverride);
          }
        }
        if (
          partyLogoIds[
            element.getAttribute('data-party-logo') || definition.id
          ] &&
          !element.classList.contains('party-name') &&
          !element.querySelector('.party-name, .party-name-logo')
        ) {
          element.classList.add('has-party-logo');
        }
      }
    }
    for (var j = 0; j < elements.length; j++) {
      var container = elements[j];
      if (container.querySelector('.party')) {
        container.classList.remove('has-party-logo');
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
      id: 'rownosc',
      name: 'Równość',
      mark: 'RÓWNOŚĆ',
      accent: '#b0005a',
      from: 202605,
      patron: 'left-friendly',
      requires: 'rownosc_media_active'
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
        'The runoff is settled by a narrow margin. The opposition now has to account for every vote it failed to unite',
        'The democratic camp came close to the Palace; Lewica must explain whether its campaign built a transfer bridge or another barrier.'
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
        'A new presidential term begins. The Left remains trapped outside the national majority',
        'The oath confirms the next presidency and leaves Lewica searching for influence through protests and parliamentary bargains.'
      ),
      tvp: pressStory(
        'The President takes the oath. Poland chooses continuity over opposition chaos',
        'The head of state begins the new term with a democratic mandate and a promise to protect family and national development.'
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
    if (party === 'left-friendly') {
      return {
        kicker: 'HARD-LEFT LINE',
        label: 'HARD LEFT · FRIENDLY',
        text: 'Równość treats Lewica’s media investment as proof that the Left is finally building power of its own.'
      };
    }
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

  var pressNarrativeBeat = function(outlet, qualities, dateKey, turn) {
    var beatsByOutlet = {
      onet: [
        'Editors frame the next forty-eight hours as a coalition stress test.',
        'The desk tracks who can still coordinate after the latest parliamentary clash.',
        'Coverage leans into tactical consequences rather than party mythology.'
      ],
      wp: [
        'Producers follow logistics first: calendar math, signatures and vote margins.',
        'The bulletin treats implementation capacity as the real plot behind speeches.',
        'The newsroom watches institutions as systems, not only as campaign stages.'
      ],
      rzeczpospolita: [
        'Columnists translate every promise into mandate, cost and enforceability.',
        'Commentary asks which actor can carry legal risk once slogans expire.',
        'Analysis reframes applause lines as long-run institutional commitments.'
      ],
      'kanal-zero': [
        'Panel television blurs reporting and performance, amplifying personality over paperwork.',
        'Stream-format debate turns procedural disputes into audience theatre.',
        'The format rewards confrontation clips before committee detail.'
      ],
      tvp: [
        'The public bulletin casts procedural choices as a mandate question.',
        'Broadcast framing centers continuity, state capacity and cabinet authority.',
        'Coverage packages institutional friction as a test of governing competence.'
      ],
      tvn: [
        'Evening segments chase documentary detail before accepting cabinet spin.',
        'Reporters foreground witness accounts and procedural contradictions.',
        'The editorial line treats oversight as part of democratic normality.'
      ],
      republika: [
        'Commentary prioritizes identity conflict over inter-party compromise mechanics.',
        'Producers push the argument toward values, sovereignty and cultural threat.',
        'The segment style rewards rhetorical escalation over coalition arithmetic.'
      ]
    };
    var commonBeats = [
      'By evening, every caucus must convert tone into a countable majority.',
      'Before the next sitting, party discipline matters more than conference rhetoric.',
      'The next vote will test not the slogan, but the machinery behind it.',
      'The morning line is loud; the legislative calendar is louder.',
      'As the cycle closes, visible momentum and legal durability are no longer the same thing.'
    ];
    var seasonalBeats = [
      'Campaign tempo is rising faster than coalition trust can regenerate.',
      'Policy bandwidth narrows as concurrent crises compete for administrative attention.',
      'Media oxygen now rewards clear sequencing over maximalist demand lists.',
      'Institutional fatigue is becoming a political variable of its own.'
    ];

    var outletBeats = beatsByOutlet[outlet.id] || commonBeats;
    var seed = Math.abs((Number(turn) || 0) * 17 + (Number(dateKey) || 0) +
      (outlet.id ? outlet.id.length * 11 : 0));
    var outletLine = outletBeats[seed % outletBeats.length];
    var commonLine = commonBeats[(seed + 3) % commonBeats.length];
    var seasonalLine = seasonalBeats[(seed + 5) % seasonalBeats.length];

    if (qualities.left_in_government) {
      return outletLine + ' ' + commonLine;
    }
    return outletLine + ' ' + seasonalLine;
  };

  var pressComposeTease = function(outlet, story, frame, qualities, dateKey, turn) {
    if (!story) {
      return '';
    }
    if (story.sourceUrl) {
      return story.text;
    }

    var parts = [story.text];
    if (frame && frame.text) {
      parts.push(frame.text);
    }
    parts.push(pressNarrativeBeat(outlet, qualities, dateKey, turn));
    return parts.join(' ');
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
      return outlet.from <= dateKey &&
        (!outlet.requires || qualities[outlet.requires]);
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
      if (!story && outlet.id === 'rownosc') {
        story = pressStory(
          'The Left finally has a media network willing to fight for its own side',
          'Równość praises the shared broadcaster for putting tenants, workers and organisers on air without asking liberal editors for permission.'
        );
      }
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
        tease.textContent = pressComposeTease(
          outlet,
          story,
          frame,
          qualities,
          dateKey,
          turn
        );
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
        var engine = window.dendryUI && window.dendryUI.dendryEngine;
        var state = engine && engine.state;
        var candidateImages = {
          'Robert Biedroń': 'img/poland/cards/advisor-biedron.webp',
          'Adrian Zandberg': 'img/poland/cards/advisor-zandberg.webp',
          'Agnieszka Dziemianowicz-Bąk': 'img/poland/cards/advisor-dziemianowicz-bak.webp',
          'Anna-Maria Żukowska': 'img/poland/cards/advisor-zukowska.webp',
          'Katarzyna Kotula': 'img/poland/cards/advisor-kotula.webp',
          'Magdalena Biejat': 'img/poland/cards/advisor-biejat.webp'
        };
        var currentSceneId = state && state.sceneId;
        var isLeftCandidatePage = currentSceneId &&
          currentSceneId.indexOf('poland_presidential_election.candidate_left') !== -1;
        if (isLeftCandidatePage) {
          var candidateName = state.qualities &&
            state.qualities.presidential_candidate;
          if (!candidateName) {
            var knownCandidates = Object.keys(candidateImages);
            var pageText = content.textContent;
            for (var nameIndex = 0; nameIndex < knownCandidates.length;
              nameIndex++) {
              if (pageText.indexOf(knownCandidates[nameIndex]) !== -1) {
                candidateName = knownCandidates[nameIndex];
                break;
              }
            }
          }
          var candidateImage = candidateImages[candidateName];
          if (candidateImage) {
            var candidateFigure = content.querySelector(
              '[data-candidate-figure="left"]'
            );
            var candidateFace;
            if (!candidateFigure) {
              candidateFigure = document.createElement('div');
              candidateFigure.className = 'face-figure';
              candidateFigure.setAttribute('data-candidate-figure', 'left');
              candidateFace = document.createElement('img');
              candidateFace.className = 'face-img';
              candidateFigure.appendChild(candidateFace);
              var candidateHeading = null;
              var candidateParagraphs = content.querySelectorAll('p');
              for (var paragraphIndex = candidateParagraphs.length - 1;
                paragraphIndex >= 0; paragraphIndex--) {
                var paragraphText = candidateParagraphs[paragraphIndex]
                  .textContent.trim();
                if (/lewica.?s nominee/i.test(paragraphText)) {
                  candidateHeading = candidateParagraphs[paragraphIndex];
                  break;
                }
              }
              if (candidateHeading && candidateHeading.parentNode) {
                candidateHeading.parentNode.insertBefore(
                  candidateFigure,
                  candidateHeading
                );
              } else {
                content.appendChild(candidateFigure);
              }
            } else {
              candidateFace = candidateFigure.querySelector('.face-img');
            }
            if (candidateFace) {
              candidateFace.src = candidateImage;
              candidateFace.setAttribute('data-candidate-image', 'true');
            }
            var candidateStrong = null;
            var candidateStrongElements = content.querySelectorAll('b, strong');
            for (var strongIndex = candidateStrongElements.length - 1;
              strongIndex >= 0; strongIndex--) {
              if (/lewica.?s nominee/i.test(
                candidateStrongElements[strongIndex].textContent.trim()
              )) {
                candidateStrong = candidateStrongElements[strongIndex];
                break;
              }
            }
            if (candidateStrong && candidateStrong.nextSibling &&
              candidateStrong.nextSibling.nodeType === 1 &&
              candidateStrong.nextSibling.classList.contains('candidate-break')) {
              candidateStrong.nextSibling.setAttribute(
                'data-candidate-break', 'true'
              );
            } else if (candidateStrong) {
              var candidateBreak = document.createElement('div');
              candidateBreak.className = 'candidate-break';
              candidateBreak.setAttribute('data-candidate-break', 'true');
              candidateStrong.parentNode.insertBefore(
                candidateBreak,
                candidateStrong.nextSibling
              );
            } else {
              var candidateHeadings = content.querySelectorAll('h1, h2, p');
              for (var headingIndex = candidateHeadings.length - 1;
                headingIndex >= 0; headingIndex--) {
                if (/lewica.?s nominee/i.test(
                  candidateHeadings[headingIndex].textContent.trim()
                )) {
                  var headingBreak = document.createElement('div');
                  headingBreak.className = 'candidate-break';
                  headingBreak.setAttribute(
                    'data-candidate-break', 'true'
                  );
                  candidateHeadings[headingIndex].appendChild(headingBreak);
                  break;
                }
              }
            }
          }
        }
        var candidatePageNames = [
          'Andrzej Duda',
          'Rafał Trzaskowski',
          'Szymon Hołownia',
          'Krzysztof Bosak',
          'Władysław Kosiniak-Kamysz'
        ];
        var isMajorCandidatePage = currentSceneId &&
          /poland_presidential_election\.candidate_(duda|trzaskowski|holownia|bosak|kosiniak)/
            .test(currentSceneId);
        if (isMajorCandidatePage) {
          var candidateIntro = null;
          var candidateBoldElements = content.querySelectorAll('b, strong');
          for (var candidateBoldIndex = candidateBoldElements.length - 1;
            candidateBoldIndex >= 0; candidateBoldIndex--) {
            var candidateBoldText = candidateBoldElements[candidateBoldIndex]
              .textContent.trim();
            for (var candidateNameIndex = 0;
              candidateNameIndex < candidatePageNames.length;
              candidateNameIndex++) {
              if (candidateBoldText.indexOf(candidatePageNames[candidateNameIndex]) === 0) {
                candidateIntro = candidateBoldElements[candidateBoldIndex];
                break;
              }
            }
            if (candidateIntro) {
              break;
            }
          }
          if (candidateIntro) {
            candidateIntro.style.display = 'block';
            var candidateSeparator = candidateIntro.nextSibling;
            if (!candidateSeparator || candidateSeparator.nodeType !== 1 ||
              !candidateSeparator.classList.contains('candidate-break')) {
              candidateSeparator = document.createElement('div');
              candidateSeparator.className = 'candidate-break';
              candidateSeparator.setAttribute('data-candidate-break', 'true');
              candidateIntro.parentNode.insertBefore(
                candidateSeparator,
                candidateIntro.nextSibling
              );
            }
          }
        }
        var nomineeHeading = null;
        var nomineeElements = content.querySelectorAll('b, strong');
        for (var nomineeIndex = nomineeElements.length - 1;
          nomineeIndex >= 0; nomineeIndex--) {
          if (/lewica.?s nominee/i.test(
            nomineeElements[nomineeIndex].textContent.trim()
          )) {
            nomineeHeading = nomineeElements[nomineeIndex];
            break;
          }
        }
        if (nomineeHeading) {
          nomineeHeading.style.display = 'block';
          nomineeHeading.setAttribute('data-candidate-heading', 'true');
          var nomineeBreak = nomineeHeading.nextSibling;
          if (!nomineeBreak || nomineeBreak.nodeType !== 1 ||
            !nomineeBreak.classList.contains('candidate-break')) {
            nomineeBreak = document.createElement('div');
            nomineeBreak.className = 'candidate-break';
            nomineeBreak.setAttribute('data-candidate-break', 'true');
            nomineeHeading.parentNode.insertBefore(
              nomineeBreak,
              nomineeHeading.nextSibling
            );
          } else {
            nomineeBreak.setAttribute('data-candidate-break', 'true');
          }
        }
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
