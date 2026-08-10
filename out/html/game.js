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
    var achievementEngine = ui.dendryEngine;
    var engineAchieve = achievementEngine.achieve.bind(achievementEngine);
    achievementEngine.achieve = function(achievementName) {
      var alreadyEarned = this.state.qualities[
        'game_achievement_' + achievementName
      ] === 1;
      var result = engineAchieve(achievementName);
      if (!alreadyEarned) {
        window.showAchievementToast(achievementName);
      }
      return result;
    };
    var engineAudio = ui.audio.bind(ui);
    ui.audio = function(audio) {
      var startScene = game.scenes['root.new_game'];
      if (startScene && audio === startScene.audio) {
        radioTracks = radioAudioTracks(audio);
      }
      if (ui.currentAudio && startScene && audio === startScene.audio) {
        return;
      }
      var enabledAudio = radioFilteredAudio(audio, startScene);
      if (enabledAudio) {
        engineAudio(enabledAudio);
      } else {
        ui.audioPlaylist = [];
      }
    };
  };

  var TITLE = "Polish Red Autumn" + '_' + "redkenku";

  var achievementDefinitions = {
    game_completed: {name: "Red Autumn", image: "img/poland/cards/campaigning.webp"},
    left_eight_percent_2020: {name: "Eight Is Enough", image: "img/poland/events/presidential-ballot-2020.webp"},
    biedron_below_historical_2020: {name: "Jeszcze Mniej", image: "img/poland/events/pres-candidate-biedron-2020.webp"},
    biedron_beats_bosak_2020: {name: "Wiosna Przyszła", image: "img/poland/events/pres-candidate-biedron-2020.webp"},
    trzaskowski_president_2020: {name: "CZASKOSKI", image: "img/poland/events/pres-candidate-trzaskowski.webp"},
    left_president_2025: {name: "Pałac dla Lewicy", image: "img/poland/events/presidential-ballot-2025.webp"},
    first_round_president_2025: {name: "Kwaśniewski Numbers", image: "img/poland/events/presidential-ballot-2025.webp"},
    impossible_majority: {name: "The Impossible Majority", image: "img/poland/cards/campaigning.webp"},
    red_tide: {name: "Red Tide", image: "img/poland/cards/campaigning.webp"},
    below_threshold: {name: "2015, Again", image: "img/poland/cards/campaigning.webp"},
    back_in_the_ring: {name: "Back in the Ring"},
    ill_be_back: {name: "I'll be back", image: "img/poland/events/pres-candidate-holownia-2025.webp"},
    enter_government: {name: "Stołki i koryto", image: "img/poland/cards/coalition-council.webp"},
    left_prime_minister: {name: "Premier Lewicy", image: "img/poland/cards/coalition-council.webp"},
    left_only_government: {name: "Tym razem bez PSLu", image: "img/poland/cards/coalition-council.webp"},
    democratic_coalition: {name: "Trzynastego Grudnia", image: "img/poland/cards/coalition-council.webp"},
    wina_tuska: {name: "Wina Tuska", image: "img/poland/cards/coalition-council.webp"},
    split_third_way_coalition: {name: "Trzecia Droga, Two Exits", image: "img/poland/cards/coalition-council.webp"},
    left_pis_coalition: {name: "Lewica Razem z PiS", image: "img/poland/cards/coalition-council.webp"},
    five_party_coalition: {name: "Byle nie Tusk", image: "img/poland/cards/coalition-council.webp"},
    third_way_left_pis: {name: "The Enemy of My Confidence Vote", image: "img/poland/cards/coalition-council.webp"},
    borrowed_left_pm: {name: "The Borrowed Throne", image: "img/poland/cards/coalition-council.webp"},
    confidence_and_supply: {name: "Nie Chcem, Ale Muszem", image: "img/poland/cards/coalition-council.webp"},
    no_third_way: {name: "Nie Ma Trzeciej Drogi", image: "img/poland/events/pres-candidate-kosiniak.webp"},
    budget_concession: {name: "Trzeba anulować, bo przegramy"},
    marshal_rotation: {name: "Marszałek Rotacyjny", image: "img/poland/events/sejm-chamber.webp"},
    sejmflix: {name: "Sejmflix", image: "img/poland/events/sejm-chamber.webp"},
    german_agent: {name: "Pan Jest Niemieckim Agentem"},
    power_holding_group: {name: "Grupa Trzymająca Władzę"},
    nocna_zmiana: {name: "Nocna Zmiana"},
    sejm_freezer: {name: "Zamrażarka Sejmowa", image: "img/poland/events/sejm-chamber.webp"},
    full_abortion_reform: {name: "O Canada", image: "img/poland/cards/equality-bill.webp"},
    full_marriage_reform: {name: "Love Wins", image: "img/poland/cards/equality-bill.webp"},
    full_church_reform: {name: "2137", image: "img/poland/cards/group-equality.webp"},
    full_asylum_reform: {name: "No Human Is Illegal", image: "img/poland/cards/crisis-compact.webp"},
    full_border_reform: {name: "The Thin Red Line", image: "img/poland/cards/oversight-delivery.webp"},
    full_defence_reform: {name: "Europe Has an Army?", image: "img/poland/cards/polish-dossier.webp"},
    full_labor_reform: {name: "Ciężka praca popłaca", image: "img/poland/cards/labour-inspection.webp"},
    full_health_reform: {name: "The Queue Ends Here", image: "img/poland/cards/health-compact.webp"},
    full_courts_reform: {name: "Koniec Magdalenki", image: "img/poland/cards/group-institutional.webp"},
    three_max_reforms: {name: "Trzy Razy Tak"},
    referendum_reform: {name: "Vox Populi"},
    trzaskowski_freebie: {name: "The Trzaskowski Freebie", image: "img/poland/events/pres-candidate-trzaskowski.webp"},
    nuclear_complete: {name: "Żarnowiec 2: Electric Boogaloo", image: "img/poland/events/lubiatowo-kopalino-2025.webp"},
    peoples_atom: {name: "Turbo Polska Odjebana", image: "img/poland/events/lubiatowo-kopalino-2025.webp"},
    second_nuclear_plant: {name: "The People’s Atom", image: "img/poland/events/lubiatowo-kopalino-2025.webp"},
    nuclear_shelved: {name: "Atom? Nie, Dziękuję", image: "img/poland/events/lubiatowo-kopalino-2025.webp"},
    cpk_complete: {name: "Lasek pokonany", image: "img/poland/events/cpk-baranow-2017.webp"},
    peoples_cpk: {name: "The People’s Airport", image: "img/poland/events/cpk-baranow-2017.webp"},
    rail_first: {name: "Railways Before Runways", image: "img/poland/events/cpk-baranow-2017.webp"},
    cpk_public_works: {name: "CPKn’t", image: "img/poland/events/cpk-baranow-2017.webp"},
    compensated_nationalisation: {name: "Compensation Included", image: "img/poland/cards/workers-public-services.webp"},
    unlawful_nationalisation: {name: "Article 21 Has Left the Chat", image: "img/poland/cards/workers-public-services.webp"},
    ownership_doctrine: {name: "Balcerowicz Musi Odejść", image: "img/poland/cards/government-affairs.webp"},
    five_nationalisations: {name: "Jezu, kominizm"},
    mmt_doctrine: {name: "Money Printer Goes Brrr", image: "img/poland/cards/government-affairs.webp"},
    developmental_state: {name: "Polska w Budowie"},
    bez_zadnego_trybu: {name: "Bez żadnego trybu", image: "img/poland/cards/cost-programme.webp"},
    unified_left_party: {name: "All Together Now"},
    member_led_unification: {name: "Power to the Members"},
    binding_federation: {name: "United We Stand, Separately"},
    razem_leaves: {name: "Osobno", image: "img/poland/events/adrian-zandberg-2020.webp"},
    razem_leadership: {name: "Duńsko się czuję", image: "img/poland/events/left-congress.webp"},
    miller_restoration: {name: "SLD Nie Lewica"},
    miller_akcja: {name: "Znajdzie Się Cela dla Leszka Millera"},
    tak_dla_rozwoju: {name: "Tak! Dla Rozwoju", image: "img/poland/events/paulina-matysiak-2019.webp"},
    biggest_tent: {name: "The Biggest Tent"},
    ground_game: {name: "Ground Game", image: "img/poland/cards/campaigning.webp"},
    miller_imprisoned: {name: "Znalazła Się Cela dla Leszka Millera", image: "img/poland/events/supreme-court.webp"},
    pps_circle: {name: "Trzech To Już Koło"},
    club_collapse: {name: "Klub Był, Koło Zostało"},
    rownosc_founded: {name: "Lub Czasopisma"},
    ja_panu_nie_przerywalem: {name: "Ja Panu Nie Przerywałem", image: "img/poland/cards/hostile-interview.webp"},
    jest_pan_zerem: {name: "Jest Pan Zerem, Panie Ziobro", image: "img/poland/events/zbigniew-ziobro-2015.webp"},
    kurica_nie_ptica: {name: "Kurica Nie Ptica", image: "img/poland/events/ukraine-refugees-2022.webp"},
    ten_defections: {name: "Wolny Mandat"},
    three_left_splits: {name: "Judean People’s Front"},
    three_right_splits: {name: "People's Front of Judea"},
    cabinet_collapse: {name: "This Is Fine", image: "img/poland/cards/coalition-council.webp"},
    piwo_z_mentzenem: {name: "Piwo z Mentzenem", image: "img/poland/events/pres-candidate-mentzen-2025.webp"},
    bedziesz_siedzial: {name: "Będziesz Siedział!", image: "img/poland/events/marian-banas-2019.webp"},
    szczesc_boze: {name: "Szczęść Boże i Ratuj Się Kto Może", image: "img/poland/events/grzegorz-braun-2025.webp"},
    wniosek_formalny: {name: "Wniosek formalny", image: "img/poland/events/sejm-chamber.webp"},
    mokry_sen_kukiza: {name: "Mokry sen Kukiza", image: "img/poland/events/sejm-chamber.webp"},
  };
  var achievementToastQueue = [];
  var achievementToastVisible = false;

  var achievementDetails = function(achievementName) {
    var definition = achievementDefinitions[achievementName] || {};
    var fallbackName = String(achievementName)
      .replace(/^achievement_/, '')
      .split('_')
      .map(function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
    return {
      name: definition.name || fallbackName,
      image: definition.image ||
        'img/achievement/' + achievementName + '.png',
    };
  };

  var showNextAchievementToast = function() {
    if (achievementToastVisible || !achievementToastQueue.length) {
      return;
    }
    achievementToastVisible = true;
    var details = achievementDetails(achievementToastQueue.shift());
    var toast = document.getElementById('achievement-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'achievement-toast';
      toast.className = 'achievement-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.setAttribute('aria-atomic', 'true');
      document.body.appendChild(toast);
    }
    toast.textContent = '';

    var image = document.createElement('img');
    image.alt = '';
    image.hidden = true;
    image.onload = function() {
      image.hidden = false;
    };
    image.onerror = function() {
      image.remove();
    };
    image.src = details.image;

    var copy = document.createElement('span');
    copy.className = 'achievement-toast-copy';
    var label = document.createElement('small');
    label.textContent = 'Achievement:';
    var name = document.createElement('strong');
    name.textContent = details.name;
    copy.appendChild(label);
    copy.appendChild(name);
    toast.appendChild(image);
    toast.appendChild(copy);

    window.requestAnimationFrame(function() {
      toast.classList.add('is-visible');
    });
    window.setTimeout(function() {
      toast.classList.remove('is-visible');
      window.setTimeout(function() {
        achievementToastVisible = false;
        showNextAchievementToast();
      }, 250);
    }, 3600);
  };

  window.showAchievementToast = function(achievementName) {
    achievementToastQueue.push(achievementName);
    showNextAchievementToast();
  };

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
  var radioTracks = [];
  var radioDisabledTracks = {};
  var radioAudioCommands = {
    clear: true,
    loop: true,
    nofade: true,
    queue: true,
    shuffle: true,
  };

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

  try {
    JSON.parse(window.localStorage.getItem(
      TITLE + '_radio_disabled_tracks'
    ) || '[]').forEach(function(track) {
      radioDisabledTracks[track] = true;
    });
  } catch (_error) {
    // Invalid or unavailable storage falls back to every song enabled.
  }

  var radioAudioTracks = function(audio) {
    return String(audio || '').split(/\s+/).filter(function(token) {
      return token && !radioAudioCommands[token];
    });
  };

  var enabledRadioTracks = function() {
    return radioTracks.filter(function(track) {
      return !radioDisabledTracks[track];
    });
  };

  var radioFilteredAudio = function(audio, startScene) {
    if (!startScene || audio !== startScene.audio) {
      return audio;
    }
    if (!enabledRadioTracks().length) {
      return '';
    }
    return audio.split(/\s+/).filter(function(token) {
      return radioTracks.indexOf(token) === -1 || !radioDisabledTracks[token];
    }).join(' ');
  };

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

  var currentRadioTrack = function(audio) {
    var current = window.dendryUI.currentAudioURL ||
      (audio && (audio.getAttribute('src') || audio.currentSrc)) || '';
    return radioTracks.find(function(track) {
      return current === track || current.endsWith('/' + track);
    });
  };

  var renderRadioTracks = function() {
    var list = document.getElementById('radio-song-list');
    var summary = document.getElementById('radio-songs-summary');
    if (!list || !summary) {
      return;
    }
    if (list.children.length !== radioTracks.length) {
      list.textContent = '';
      radioTracks.forEach(function(track) {
        var label = document.createElement('label');
        var input = document.createElement('input');
        var title = document.createElement('span');
        label.className = 'radio-song';
        input.type = 'checkbox';
        input.value = track;
        input.addEventListener('change', function() {
          window.setRadioTrackEnabled(track, input.checked);
        });
        title.textContent = radioTrackTitle(track);
        title.title = title.textContent;
        label.appendChild(input);
        label.appendChild(title);
        list.appendChild(label);
      });
    }
    Array.prototype.forEach.call(
      list.querySelectorAll('input'),
      function(input) {
        input.checked = !radioDisabledTracks[input.value];
      }
    );
    summary.textContent = 'Songs ' + enabledRadioTracks().length +
      '/' + radioTracks.length;
  };

  var playRadioTrack = function(audio, track) {
    audio.pause();
    audio.src = track;
    window.dendryUI.currentAudioURL = track;
    window.dendryUI.disable_audio = false;
    audio.play();
    window.dendryUI.saveSettings();
  };

  var nextEnabledRadioTrack = function(current) {
    var index = radioTracks.indexOf(current);
    for (var offset = 1; offset <= radioTracks.length; offset += 1) {
      var track = radioTracks[(index + offset) % radioTracks.length];
      if (!radioDisabledTracks[track]) {
        return track;
      }
    }
  };

  window.setRadioTrackEnabled = function(track, enabled) {
    if (radioTracks.indexOf(track) === -1) {
      return;
    }
    if (enabled) {
      delete radioDisabledTracks[track];
    } else {
      radioDisabledTracks[track] = true;
    }
    try {
      window.localStorage.setItem(
        TITLE + '_radio_disabled_tracks',
        JSON.stringify(Object.keys(radioDisabledTracks))
      );
    } catch (_error) {
      // The selection still works for this session when storage is unavailable.
    }
    var audio = window.dendryUI.currentAudio;
    var playlist = window.dendryUI.audioPlaylist || [];
    var playlistIndex = playlist.indexOf(track);
    if (!enabled && playlistIndex !== -1) {
      playlist.splice(playlistIndex, 1);
    } else if (enabled && playlistIndex === -1 &&
        (!playlist.length || playlist.some(function(item) {
          return radioTracks.indexOf(item) !== -1;
        }))) {
      playlist.push(track);
    }
    if (!enabled && audio && currentRadioTrack(audio) === track) {
      var next = nextEnabledRadioTrack(track);
      if (next) {
        playRadioTrack(audio, next);
      } else {
        audio.pause();
      }
    }
    renderRadioTracks();
    window.updateRadio();
  };

  window.updateRadio = function() {
    var radio = document.getElementById('radio');
    if (!radio || !window.dendryUI) {
      return;
    }
    var audio = window.dendryUI.currentAudio;
    var startScene = window.dendryUI.game.scenes['root.new_game'];
    if (!radioTracks.length && startScene && startScene.audio) {
      radioTracks = radioAudioTracks(startScene.audio);
    }
    var enabledTracks = enabledRadioTracks();
    renderRadioTracks();
    document.getElementById('radio-volume').value =
      Math.round(radioVolume * 100);
    document.getElementById('radio-volume-value').textContent =
      Math.round(radioVolume * 100) + '%';
    radio.hidden = !audio && !(startScene && startScene.audio);
    if (!audio) {
      document.getElementById('radio-toggle').textContent = 'Play';
      document.getElementById('radio-toggle').disabled = !enabledTracks.length;
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
    document.getElementById('radio-toggle').disabled =
      Boolean(currentRadioTrack(audio)) && !enabledTracks.length;
    document.getElementById('radio-next').disabled = enabledTracks.length < 2;
    document.getElementById('radio-track').textContent =
      radioTrackTitle(window.dendryUI.currentAudioURL || audio.currentSrc);
  };

  window.toggleRadio = function() {
    var audio = window.dendryUI.currentAudio;
    if (!audio) {
      window.enableAudio();
      return;
    }
    var current = currentRadioTrack(audio);
    if (audio.paused && current && radioDisabledTracks[current]) {
      var next = nextEnabledRadioTrack(current);
      if (next) {
        playRadioTrack(audio, next);
      }
      window.updateRadio();
      return;
    }
    window.dendryUI.toggle_audio(audio.paused);
    window.dendryUI.saveSettings();
    window.updateRadio();
  };

  window.nextRadioTrack = function() {
    var audio = window.dendryUI.currentAudio;
    var enabledTracks = enabledRadioTracks();
    if (!audio || enabledTracks.length < 2) {
      return;
    }
    playRadioTrack(audio, nextEnabledRadioTrack(currentRadioTrack(audio)));
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
        ['Porozumienie Lewicy', 'Porozumienie Lewicy'],
        ['Federacja Lewicy', 'Federacja Lewicy'],
        ['Wiosna-SLD', 'Wiosna-SLD'],
        ['Lewica Razem', 'Lewica Razem'],
        ['Wspólne Jutro', 'Wspólne Jutro'],
        ['Lewica Patriotyczna', 'Lewica Patriotyczna'],
        ['Sojusz Polski Społecznej', 'Sojusz Polski Społecznej'],
        ['Solidarność Społeczna', 'Solidarność Społeczna'],
        ['Lewica Rozwoju', 'Lewica Rozwoju'],
        ['Wspólna Polska', 'Wspólna Polska'],
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
        ['Ruch Postępu', 'Ruch Postępu'],
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
      explanation: 'Lewica Pracy (Labour Left) — a possible labour-led breakaway from Lewica.',
      aliases: [
        ['Labour Left', 'Lewica Pracy'],
        ['Lewica Pracy', 'Lewica Pracy']
      ]
    },
    {
      id: 'young-left',
      className: 'party-progressive',
      explanation: 'Młoda Lewica (Young Left) — a possible progressive breakaway from Lewica.',
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
      id: 'nowa-platforma',
      className: 'party-np',
      explanation: 'Nowa Platforma (NP) — the classical-liberal breakaway that re-founds Platforma Obywatelska outside the Civic bloc, keeping the old party’s regional barons and donors under a new name and badge.',
      aliases: [
        ['Nowa Platforma', 'Nowa Platforma'],
        ['New Platform', 'Nowa Platforma'],
        ['NP', 'NP']
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
      id: 'agrounia',
      className: 'party-agrounia',
      explanation: 'AgroUnia is the agrarian protest movement founded by Michał Kołodziejczak.',
      aliases: [
        ['AgroUnia', 'AgroUnia']
      ]
    },
    {
      id: 'polish-coalition',
      className: 'party-polish-coalition',
      explanation: 'Polish Coalition (KP) — the PSL-led electoral alliance formed with Kukiz’15 and smaller centrist partners.',
      aliases: [
        ['Polish Coalition', 'Koalicja Polska'],
        ['Koalicja Polska', 'Koalicja Polska']
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
      id: 'prawica',
      className: 'party-prawica',
      explanation: 'Prawica — Andrzej Duda’s centre-right electoral coalition and parliamentary club for the 2027 election.',
      aliases: [['Prawica', 'Prawica']]
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
      id: 'odnowa',
      className: 'party-odnowa',
      explanation: 'OdNowa RP — the centre-right party formed by former Agreement politicians who remained allied with Law and Justice.',
      aliases: [
        ['OdNowa Rzeczypospolitej Polskiej', 'OdNowa Rzeczypospolitej Polskiej'],
        ['OdNowa RP', 'OdNowa RP'],
        ['OdNowa', 'OdNowa']
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
        ['Nowa Nadzieja', 'Nowa Nadzieja'],
        ['KORWiN', 'KORWiN'],
        ['Wolność', 'Wolność']
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
      id: 'ued',
      className: 'party-ued',
      explanation: 'Union of European Democrats (UED) — a small social-liberal party allied with PSL in the Polish Coalition.',
      aliases: [
        ['Union of European Democrats', 'Unia Europejskich Demokratów'],
        ['Unia Europejskich Demokratów', 'Unia Europejskich Demokratów']
      ]
    },
    {
      id: 'unia-centrum',
      className: 'party-unia-centrum',
      classAliases: ['party-centrum'],
      explanation: 'Centre Union — a centrist formation assembled from the surviving centre.',
      aliases: [['Unia Centrum', 'Unia Centrum']]
    },
    {
      id: 'rozwoj-plus',
      className: 'party-rozwoj',
      explanation: 'Rozwój Plus — a possible developmentalist split from PiS.',
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
      explanation: 'Akcja Socjalistyczna — the original-left split that can emerge from the Razem-Matysiak conflict.',
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

  // Every recognised party has one compact ledger label and one canonical
  // public name. Additional aliases above remain valid historical, English or
  // typographical forms of the same organisation.
  var partyCanonicalNames = {
    'us-dem': ['Democrats', 'Democratic Party'],
    'us-gop': ['GOP', 'Republican Party'],
    'knp': ['KNP', 'Kongres Nowej Prawicy'],
    'nowa-solidarnosc': ['NS', 'Nowa Solidarność'],
    'nowa-lewica': ['NL', 'Nowa Lewica'],
    'lewica': ['Lewica', 'Lewica'],
    'sld': ['SLD', 'Sojusz Lewicy Demokratycznej'],
    'wiosna': ['Wiosna', 'Wiosna'],
    'razem': ['Razem', 'Partia Razem'],
    'pps': ['PPS', 'Polska Partia Socjalistyczna'],
    'unia-pracy': ['UP', 'Unia Pracy'],
    'left-labor': ['LP', 'Lewica Pracy'],
    'young-left': ['Młoda Lewica', 'Młoda Lewica'],
    'ko': ['KO', 'Koalicja Obywatelska'],
    'po': ['PO', 'Platforma Obywatelska'],
    'nowa-platforma': ['NP', 'Nowa Platforma'],
    'nowoczesna': ['.N', 'Nowoczesna'],
    'inicjatywa-polska': ['iPL', 'Inicjatywa Polska'],
    'zieloni': ['Zieloni', 'Partia Zieloni'],
    'pis': ['PiS', 'Prawo i Sprawiedliwość'],
    'psl': ['PSL', 'Polskie Stronnictwo Ludowe'],
    'agrounia': ['AgroUnia', 'AgroUnia'],
    'polish-coalition': ['KP', 'Koalicja Polska'],
    'p2050': ['PL2050', 'Polska 2050'],
    'third-way': ['TD', 'Trzecia Droga'],
    'konf': ['Konf.', 'Konfederacja Wolność i Niepodległość'],
    'united-right': ['ZP', 'Zjednoczona Prawica'],
    'prawica': ['Prawica', 'Prawica'],
    'sovereign-poland': ['SP', 'Suwerenna Polska'],
    'solidary-poland': ['SP', 'Solidarna Polska'],
    'agreement': ['Porozumienie', 'Porozumienie'],
    'republicans': ['PR', 'Partia Republikańska'],
    'odnowa': ['OdNowa RP', 'OdNowa Rzeczypospolitej Polskiej'],
    'national-movement': ['RN', 'Ruch Narodowy'],
    'new-hope': ['NN', 'Nowa Nadzieja'],
    'kkp': ['KKP', 'Konfederacja Korony Polskiej'],
    'freedomites': ['Wolnościowcy', 'Wolnościowcy'],
    'kukiz': ['Kukiz’15', 'Kukiz’15'],
    'ued': ['UED', 'Unia Europejskich Demokratów'],
    'unia-centrum': ['UC', 'Unia Centrum'],
    'rozwoj-plus': ['Rozwój+', 'Rozwój Plus'],
    'tak-dla-rozwoju': ['T!DR', 'Tak! Dla Rozwoju'],
    'akcja-socjalistyczna': ['AS', 'Akcja Socjalistyczna'],
    'partia-zero': ['P0', 'Partia Zero'],
    'german-minority': ['MN', 'Mniejszość Niemiecka'],
    'nonpartisan': ['BS', 'Bezpartyjni Samorządowcy']
  };

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
    var canonicalNames = partyCanonicalNames[definition.id] || [
      definition.id,
      definition.id
    ];
    definition.shortName = canonicalNames[0];
    definition.longName = canonicalNames[1];
    [definition.longName, definition.shortName].forEach(function(name) {
      if (!definition.aliases.some(function(alias) { return alias[0] === name; })) {
        definition.aliases.push([name, name]);
      }
    });
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
      id: 'sasin',
      className: 'party-pis',
      explanation: 'Jacek Sasin is a senior PiS politician who served as deputy prime minister and minister responsible for state assets.',
      aliases: ['Jacek Sasin', 'Sasin']
    },
    {
      id: 'henryk_kowalczyk',
      className: 'party-pis',
      explanation: 'Henryk Kowalczyk is a senior PiS politician who served as deputy prime minister and led the environment and agriculture ministries.',
      aliases: ['Henryk Kowalczyk', 'Kowalczyk']
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
      id: 'nowacka',
      className: 'party-ko',
      explanation: 'Barbara Nowacka leads Inicjatywa Polska within Civic Coalition and represents KO’s social-liberal wing.',
      aliases: ['Barbara Nowacka', 'Nowacka']
    },
    {
      id: 'rosa',
      className: 'party-ko',
      explanation: 'Monika Rosa is a KO politician associated with its progressive, equality and civil-rights wing.',
      aliases: ['Monika Rosa']
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
      id: 'kolodziejczak',
      className: 'party-agrounia',
      explanation: 'Michał Kołodziejczak founded AgroUnia and became its main public voice in farmer protests and electoral negotiations.',
      aliases: [
        'Michał Kołodziejczak',
        'Michal Kolodziejczak',
        'Kołodziejczak',
        'Kolodziejczak'
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
      explanation: 'Paulina Matysiak is a left-wing MP identified with rail, infrastructure policy and later split currents.',
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
      aliases: [
        'Anna-Maria Żukowska',
        'Anna-Maria Zukowska',
        'Anna Maria Żukowska',
        'Anna Maria Zukowska',
        'Żukowska',
        'Zukowska'
      ]
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
      explanation: 'Krzysztof Stanowski is a sports journalist, media entrepreneur and the public face of Partia Zero.',
      aliases: ['Krzysztof Stanowski', 'Stanowski']
    },
    {
      id: 'szpilski',
      className: 'party-nowa-solidarnosc',
      explanation: 'Chrystian Szpilski is a founder of Nowa Solidarność.',
      aliases: ['Chrystian Szpilski', 'Szpilski']
    },
    {
      id: 'spalinski',
      className: 'party-nowa-solidarnosc',
      explanation: 'Patryk Spaliński is a founder of Nowa Solidarność.',
      aliases: ['Patryk Spalinski', 'Patryk Spaliński', 'Spalinski', 'Spaliński']
    },
    {
      id: 'kozlowski',
      className: 'party-nowa-solidarnosc',
      explanation: 'Maciej Kozłowski is a founder of Nowa Solidarność.',
      aliases: ['Maciej Kozlowski', 'Maciej Kozłowski', 'Kozlowski', 'Kozłowski']
    },
    {
      id: 'rozenek',
      className: 'party-pps',
      explanation: 'Andrzej Rozenek is a left-wing parliamentarian tied to the PPS parliamentary breakaway.',
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
    },

    // Ministers and named deputies. Every roster in poland_ministries and the
    // faction nominee pools is represented here, so a cabinet list renders in
    // party colour with a hover line instead of as plain text.
    {
      id: 'czarnek',
      className: 'party-pis',
      explanation: 'Przemysław Czarnek was PiS education and science minister from 2020 to 2023 and is the party’s most prominent culture-war and church-schools voice.',
      aliases: ['Przemysław Czarnek', 'Przemyslaw Czarnek', 'Czarnek']
    },
    {
      id: 'cieszynski',
      className: 'party-pis',
      explanation: 'Janusz Cieszyński was PiS digitisation minister and earlier the health ministry deputy responsible for pandemic procurement.',
      aliases: ['Janusz Cieszyński', 'Janusz Cieszynski', 'Cieszyński', 'Cieszynski']
    },
    {
      id: 'malag',
      className: 'party-pis',
      explanation: 'Marlena Maląg was PiS family and social policy minister from 2019 to 2023, responsible for the cash-transfer programmes.',
      aliases: ['Marlena Maląg', 'Marlena Malag', 'Maląg']
    },
    {
      id: 'schmidt',
      className: 'party-pis',
      explanation: 'Anna Schmidt served as the PiS government’s plenipotentiary for equal treatment.',
      aliases: ['Anna Schmidt']
    },
    {
      id: 'uscinski',
      className: 'party-pis',
      explanation: 'Piotr Uściński is a PiS MP who served as deputy development minister with responsibility for housing.',
      aliases: ['Piotr Uściński', 'Piotr Uscinski', 'Uściński']
    },
    {
      id: 'niedzielski',
      className: 'party-pis',
      explanation: 'Adam Niedzielski was health minister through the pandemic years and resigned in 2023 over a disclosed prescription record.',
      aliases: ['Adam Niedzielski', 'Niedzielski']
    },
    {
      id: 'mariusz_kaminski',
      className: 'party-pis',
      explanation: 'Mariusz Kamiński was PiS interior minister and coordinator of the special services, and previously headed the Central Anti-Corruption Bureau.',
      aliases: ['Mariusz Kamiński', 'Mariusz Kaminski']
    },
    {
      id: 'koscinski',
      className: 'party-pis',
      explanation: 'Tadeusz Kościński served as finance minister from 2019 to 2022, through the pandemic packages and the Polish Deal tax changes.',
      aliases: ['Tadeusz Kościński', 'Tadeusz Koscinski', 'Kościński']
    },
    {
      id: 'piotr_nowak',
      className: 'party-pis',
      explanation: 'Piotr Nowak served as PiS development and technology minister after a career in the finance ministry.',
      aliases: ['Piotr Nowak']
    },
    {
      id: 'rau',
      className: 'party-pis',
      explanation: 'Zbigniew Rau was PiS foreign minister from 2020 to 2023 and chaired the OSCE during Poland’s presidency.',
      aliases: ['Zbigniew Rau']
    },
    {
      id: 'puda',
      className: 'party-pis',
      explanation: 'Grzegorz Puda served as PiS agriculture minister and then as minister for regional funds and policy.',
      aliases: ['Grzegorz Puda', 'Puda']
    },
    {
      id: 'semeniuk',
      className: 'party-pis',
      explanation: 'Olga Semeniuk-Patkowska was PiS deputy development minister for small business and is one of the named organisers of Morawiecki’s Rozwój+ current.',
      aliases: [
        'Olga Semeniuk-Patkowska',
        'Olga Semeniuk',
        'Semeniuk-Patkowska',
        'Semeniuk'
      ]
    },
    {
      id: 'jablonski',
      className: 'party-pis',
      explanation: 'Paweł Jabłoński was PiS deputy foreign minister and is one of the party’s principal media performers on European affairs.',
      aliases: ['Paweł Jabłoński', 'Pawel Jablonski', 'Jabłoński']
    },
    {
      id: 'szczucki',
      className: 'party-pis',
      explanation: 'Krzysztof Szczucki is a PiS MP and former head of the Government Legislation Centre.',
      aliases: ['Krzysztof Szczucki', 'Szczucki']
    },
    {
      id: 'szefernaker',
      className: 'party-pis',
      explanation: 'Paweł Szefernaker was PiS deputy interior minister and ran the party’s presidential campaign organisation.',
      aliases: ['Paweł Szefernaker', 'Pawel Szefernaker', 'Szefernaker']
    },
    {
      id: 'szynkowski',
      className: 'party-pis',
      explanation: 'Szymon Szynkowski vel Sęk handled European affairs at the PiS foreign ministry and briefly led it in 2023.',
      aliases: [
        'Szymon Szynkowski vel Sęk',
        'Szymon Szynkowski',
        'Szynkowski vel Sęk',
        'Szynkowski'
      ]
    },
    {
      id: 'gembicka',
      className: 'party-pis',
      explanation: 'Anna Gembicka served as PiS agriculture minister in the final months of the United Right government.',
      aliases: ['Anna Gembicka', 'Gembicka']
    },
    {
      id: 'bochenski',
      className: 'party-pis',
      explanation: 'Tobiasz Bocheński was PiS voivode of Łódź and then Mazovia and became one of the party’s younger big-city candidates.',
      aliases: ['Tobiasz Bocheński', 'Tobiasz Bochenski', 'Bocheński']
    },
    {
      id: 'emilewicz',
      className: 'party-agreement',
      explanation: 'Jadwiga Emilewicz was development minister and a Porozumienie deputy prime minister before the party broke with PiS.',
      aliases: ['Jadwiga Emilewicz', 'Emilewicz']
    },
    {
      id: 'kosztowniak',
      className: 'party-pis',
      explanation: 'Andrzej Kosztowniak is a PiS MP and former mayor of Radom.',
      aliases: ['Andrzej Kosztowniak', 'Kosztowniak']
    },
    {
      id: 'bojemska',
      className: 'party-nonpartisan',
      explanation: 'Dorota Bojemska chairs the Family Council and is a leading conservative voice in family policy consultations.',
      aliases: ['Dorota Bojemska', 'Bojemska']
    },
    {
      id: 'ewa_krajewska',
      className: 'party-nonpartisan',
      explanation: 'Ewa Krajewska is a pharmacist who served as Poland’s Chief Sanitary Inspector.',
      aliases: ['Ewa Krajewska']
    },

    {
      id: 'kierwinski',
      className: 'party-ko',
      explanation: 'Marcin Kierwiński is KO’s secretary-general and served as interior minister; he runs the party’s organisational apparatus and regional structures.',
      aliases: ['Marcin Kierwiński', 'Marcin Kierwinski', 'Kierwiński', 'Kierwinski']
    },
    {
      id: 'szlapka',
      className: 'party-nowoczesna',
      explanation: 'Adam Szłapka leads Nowoczesna inside the Civic bloc and served as minister for European Union affairs.',
      aliases: ['Adam Szłapka', 'Adam Szlapka', 'Szłapka', 'Szlapka']
    },
    {
      id: 'siemoniak',
      className: 'party-ko',
      explanation: 'Tomasz Siemoniak is a KO politician who served as defence minister, then interior minister and coordinator of the special services.',
      aliases: ['Tomasz Siemoniak', 'Siemoniak']
    },
    {
      id: 'bodnar',
      className: 'party-ko',
      explanation: 'Adam Bodnar is the justice minister and prosecutor general who previously served as Commissioner for Human Rights during the rule-of-law conflict.',
      aliases: ['Adam Bodnar', 'Bodnar']
    },
    {
      id: 'domanski',
      className: 'party-ko',
      explanation: 'Andrzej Domański is the KO finance minister who wrote the coalition’s first budgets.',
      aliases: ['Andrzej Domański', 'Andrzej Domanski', 'Domański']
    },
    {
      id: 'leszczyna',
      className: 'party-ko',
      explanation: 'Izabela Leszczyna is the KO health minister and a long-standing finance-committee figure.',
      aliases: ['Izabela Leszczyna', 'Leszczyna']
    },
    {
      id: 'grabiec',
      className: 'party-ko',
      explanation: 'Jan Grabiec heads the Prime Minister’s Chancellery and was previously KO’s parliamentary spokesman.',
      aliases: ['Jan Grabiec', 'Grabiec']
    },
    {
      id: 'okla_drewnowicz',
      className: 'party-ko',
      explanation: 'Marzena Okła-Drewnowicz is the KO minister responsible for senior policy.',
      aliases: ['Marzena Okła-Drewnowicz', 'Marzena Okla-Drewnowicz', 'Okła-Drewnowicz']
    },
    {
      id: 'sibinska',
      className: 'party-ko',
      explanation: 'Krystyna Sibińska is a KO MP from Gorzów who works on housing and local government.',
      aliases: ['Krystyna Sibińska', 'Krystyna Sibinska', 'Sibińska']
    },
    {
      id: 'niedziela',
      className: 'party-ko',
      explanation: 'Dorota Niedziela is a KO MP and veterinarian who leads the party’s agriculture and animal-welfare work.',
      aliases: ['Dorota Niedziela']
    },
    {
      id: 'tracz',
      className: 'party-zieloni',
      explanation: 'Małgorzata Tracz co-leads Zieloni and sits in the Sejm on the Civic list.',
      aliases: ['Małgorzata Tracz', 'Malgorzata Tracz', 'Tracz']
    },
    {
      id: 'spurek',
      className: 'party-zieloni',
      explanation: 'Sylwia Spurek is a Green MEP and former deputy Commissioner for Human Rights, elected originally on a Wiosna ticket.',
      aliases: ['Sylwia Spurek', 'Spurek']
    },
    {
      id: 'sroka',
      className: 'party-agreement',
      explanation: 'Magdalena Sroka is a former head of the Central Anti-Corruption Bureau who sat with Porozumienie and later the Civic bloc.',
      aliases: ['Magdalena Sroka', 'Sroka']
    },

    {
      id: 'sawicki',
      className: 'party-psl',
      explanation: 'Marek Sawicki is a veteran PSL agriculture minister and Sejm deputy marshal.',
      aliases: ['Marek Sawicki', 'Sawicki']
    },
    {
      id: 'siekierski',
      className: 'party-psl',
      explanation: 'Czesław Siekierski is the PSL agriculture minister and a former chair of the European Parliament’s agriculture committee.',
      aliases: ['Czesław Siekierski', 'Czeslaw Siekierski', 'Siekierski']
    },
    {
      id: 'hetman',
      className: 'party-psl',
      explanation: 'Krzysztof Hetman is a PSL deputy leader who served as development and technology minister.',
      aliases: ['Krzysztof Hetman', 'Hetman']
    },
    {
      id: 'zgorzelski',
      className: 'party-psl',
      explanation: 'Piotr Zgorzelski is a PSL deputy marshal of the Sejm and one of the party’s chief negotiators.',
      aliases: ['Piotr Zgorzelski', 'Zgorzelski']
    },
    {
      id: 'paslawska',
      className: 'party-psl',
      explanation: 'Urszula Pasławska is a PSL MP and former deputy treasury minister.',
      aliases: ['Urszula Pasławska', 'Urszula Paslawska', 'Pasławska']
    },
    {
      id: 'klopotek',
      className: 'party-psl',
      explanation: 'Agnieszka Kłopotek is a PSL politician with a background in social and family policy.',
      aliases: ['Agnieszka Kłopotek', 'Agnieszka Klopotek', 'Kłopotek']
    },
    {
      id: 'paszyk',
      className: 'party-psl',
      explanation: 'Krzysztof Paszyk is the PSL minister of development and technology.',
      aliases: ['Krzysztof Paszyk', 'Paszyk']
    },
    {
      id: 'stefan_krajewski',
      className: 'party-psl',
      explanation: 'Stefan Krajewski is a PSL agriculture minister and MP from Podlasie.',
      aliases: ['Stefan Krajewski']
    },
    {
      id: 'klimczak',
      className: 'party-psl',
      explanation: 'Dariusz Klimczak is the PSL infrastructure minister.',
      aliases: ['Dariusz Klimczak', 'Klimczak']
    },
    {
      id: 'piechocinski',
      className: 'party-psl',
      explanation: 'Janusz Piechociński is a former PSL leader who served as deputy prime minister and economy minister.',
      aliases: ['Janusz Piechociński', 'Janusz Piechocinski', 'Piechociński']
    },
    {
      id: 'tomczak',
      className: 'party-psl',
      explanation: 'Jacek Tomczak is a PSL MP from Poznań working on justice and local-government files.',
      aliases: ['Jacek Tomczak']
    },
    {
      id: 'bartoszewski',
      className: 'party-psl',
      explanation: 'Władysław Teofil Bartoszewski is a PSL deputy foreign minister and the son of Władysław Bartoszewski.',
      aliases: [
        'Władysław Teofil Bartoszewski',
        'Wladyslaw Teofil Bartoszewski',
        'Teofil Bartoszewski'
      ]
    },

    {
      id: 'petru',
      className: 'party-p2050',
      explanation: 'Ryszard Petru founded Nowoczesna and now sits for Poland 2050 as its principal economic-liberal voice.',
      aliases: ['Ryszard Petru', 'Petru']
    },
    {
      id: 'gramatyka',
      className: 'party-p2050',
      explanation: 'Michał Gramatyka is the Poland 2050 minister of digital affairs.',
      aliases: ['Michał Gramatyka', 'Michal Gramatyka', 'Gramatyka']
    },
    {
      id: 'kobosko',
      className: 'party-p2050',
      explanation: 'Michał Kobosko is a Poland 2050 MEP and one of the party’s founding organisers.',
      aliases: ['Michał Kobosko', 'Michal Kobosko', 'Kobosko']
    },
    {
      id: 'mucha',
      className: 'party-p2050',
      explanation: 'Joanna Mucha is a Poland 2050 politician and education deputy minister who came to the party from PO.',
      aliases: ['Joanna Mucha']
    },
    {
      id: 'buczynska',
      className: 'party-p2050',
      explanation: 'Agnieszka Buczyńska is the Poland 2050 minister for civil society.',
      aliases: ['Agnieszka Buczyńska', 'Agnieszka Buczynska', 'Buczyńska']
    },
    {
      id: 'leo',
      className: 'party-p2050',
      explanation: 'Aleksandra Leo is a Poland 2050 MP working on equality and culture policy.',
      aliases: ['Aleksandra Leo']
    },
    {
      id: 'cwalina',
      className: 'party-p2050',
      explanation: 'Żaneta Cwalina-Śliwowska is a Poland 2050 MP from Podlasie.',
      aliases: [
        'Żaneta Cwalina-Śliwowska',
        'Zaneta Cwalina-Sliwowska',
        'Cwalina-Śliwowska'
      ]
    },
    {
      id: 'suchon',
      className: 'party-p2050',
      explanation: 'Mirosław Suchoń is a Poland 2050 MP from Silesia.',
      aliases: ['Mirosław Suchoń', 'Miroslaw Suchon', 'Suchoń']
    },
    {
      id: 'sliz',
      className: 'party-p2050',
      explanation: 'Paweł Śliz chairs the Poland 2050 parliamentary club.',
      aliases: ['Paweł Śliz', 'Pawel Sliz', 'Śliz']
    },
    {
      id: 'zalewski',
      className: 'party-p2050',
      explanation: 'Paweł Zalewski is a Poland 2050 deputy defence minister with a long parliamentary record on foreign affairs.',
      aliases: ['Paweł Zalewski', 'Pawel Zalewski', 'Zalewski']
    },
    {
      id: 'zywno',
      className: 'party-p2050',
      explanation: 'Maciej Żywno is a Poland 2050 deputy marshal of the Senate and former voivode of Podlasie.',
      aliases: ['Maciej Żywno', 'Maciej Zywno', 'Żywno']
    },
    {
      id: 'pietrykowski',
      className: 'party-p2050',
      explanation: 'Norbert Pietrykowski is a Poland 2050 politician working on rural and agricultural policy.',
      aliases: ['Norbert Pietrykowski', 'Pietrykowski']
    },

    {
      id: 'trela',
      className: 'party-lewica',
      explanation: 'Tomasz Trela is an SLD-rooted Left MP from Łódź and one of the caucus’s parliamentary managers.',
      aliases: ['Tomasz Trela', 'Trela']
    },
    {
      id: 'ueberhan',
      className: 'party-lewica',
      explanation: 'Katarzyna Ueberhan is a Left MP focused on social policy, disability support and reproductive rights.',
      aliases: ['Katarzyna Ueberhan', 'Ueberhan']
    },
    {
      id: 'standerski',
      className: 'party-lewica',
      explanation: 'Dariusz Standerski is a Left MP and deputy minister of digital affairs who works on tax and technology regulation.',
      aliases: ['Dariusz Standerski', 'Standerski']
    },
    {
      id: 'szejna',
      className: 'party-sld',
      explanation: 'Andrzej Szejna is an SLD politician and deputy foreign minister with a long European parliamentary record.',
      aliases: ['Andrzej Szejna', 'Szejna']
    },
    {
      id: 'balt',
      className: 'party-sld',
      explanation: 'Marek Balt is an SLD member of the European Parliament from Silesia.',
      aliases: ['Marek Balt']
    },
    {
      id: 'kulasek',
      className: 'party-lewica',
      explanation: 'Marcin Kulasek is the New Left’s secretary-general and a deputy science minister.',
      aliases: ['Marcin Kulasek', 'Kulasek']
    },
    {
      id: 'szczepanski',
      className: 'party-sld',
      explanation: 'Wiesław Szczepański is an SLD-rooted Left MP who leads the caucus’s interior and administration work.',
      aliases: ['Wiesław Szczepański', 'Wieslaw Szczepanski', 'Szczepański']
    },
    {
      id: 'szymanski',
      className: 'party-lewica',
      explanation: 'Tomasz Szymański is a Left MP from Pomerania working on public administration.',
      aliases: ['Tomasz Szymański', 'Tomasz Szymanski']
    },
    {
      id: 'litewka',
      className: 'party-lewica',
      explanation: 'Łukasz Litewka is a Left MP from Sosnowiec known for constituency casework and a large online following.',
      aliases: ['Łukasz Litewka', 'Lukasz Litewka', 'Litewka']
    },
    {
      id: 'gdula',
      className: 'party-lewica',
      explanation: 'Maciej Gdula is a sociologist, Left MP and deputy science minister who writes on the politics of the Polish provinces.',
      aliases: ['Maciej Gdula', 'Gdula']
    },
    {
      id: 'rutka',
      className: 'party-lewica',
      explanation: 'Marek Rutka is a Left MP from Gdynia working on health and sport policy.',
      aliases: ['Marek Rutka', 'Rutka']
    },
    {
      id: 'buz',
      className: 'party-sld',
      explanation: 'Wiesław Buż is an SLD-rooted Left MP from Rzeszów.',
      aliases: ['Wiesław Buż', 'Wieslaw Buz']
    },
    {
      id: 'wolski',
      className: 'party-sld',
      explanation: 'Zdzisław Wolski is an SLD politician active in rural and regional organisation.',
      aliases: ['Zdzisław Wolski', 'Zdzislaw Wolski']
    },
    {
      id: 'kucharska_dziedzic',
      className: 'party-lewica',
      explanation: 'Anita Kucharska-Dziedzic is a Left MP and founder of a women’s-rights organisation in Zielona Góra.',
      aliases: [
        'Anita Kucharska-Dziedzic',
        'Kucharska-Dziedzic'
      ]
    },

    {
      id: 'gertruda_uscinska',
      className: 'party-nonpartisan',
      explanation: 'Gertruda Uścińska is a social-insurance scholar and former president of the social insurance institution ZUS.',
      aliases: ['Gertruda Uścińska', 'Gertruda Uscinska', 'Uścińska']
    },
    {
      id: 'rudzinska_bluszcz',
      className: 'party-nonpartisan',
      explanation: 'Zuzanna Rudzińska-Bluszcz is a lawyer and civil-rights litigator serving as a deputy justice minister.',
      aliases: [
        'Zuzanna Rudzińska-Bluszcz',
        'Zuzanna Rudzinska-Bluszcz',
        'Rudzińska-Bluszcz'
      ]
    },
    {
      id: 'erbel',
      className: 'party-nonpartisan',
      explanation: 'Joanna Erbel is a housing and urban-policy researcher associated with tenant and public-housing campaigns.',
      aliases: ['Joanna Erbel', 'Erbel']
    },
    {
      id: 'libura',
      className: 'party-nonpartisan',
      explanation: 'Maria Libura is a health-policy expert who writes on the organisation and financing of public health care.',
      aliases: ['Maria Libura', 'Libura']
    },
    {
      id: 'tarkowski',
      className: 'party-nonpartisan',
      explanation: 'Alek Tarkowski is a digital-policy researcher and co-founder of Poland’s open-knowledge movement.',
      aliases: ['Alek Tarkowski', 'Tarkowski']
    },
    {
      id: 'kleiber',
      className: 'party-nonpartisan',
      explanation: 'Michał Kleiber is a former science minister and president of the Polish Academy of Sciences.',
      aliases: ['Michał Kleiber', 'Michal Kleiber', 'Kleiber']
    },
    {
      id: 'biernacki',
      className: 'party-polish-coalition',
      explanation: 'Marek Biernacki is a former interior and justice minister who sits with the Polish Coalition.',
      aliases: ['Marek Biernacki', 'Biernacki']
    },
    {
      id: 'pawel_wojciechowski',
      className: 'party-nonpartisan',
      explanation: 'Paweł Wojciechowski is an economist and former finance minister and chief economist of the social insurance institution.',
      aliases: ['Paweł Wojciechowski', 'Pawel Wojciechowski']
    },
    {
      id: 'hausner',
      className: 'party-nonpartisan',
      explanation: 'Jerzy Hausner is an economist and former deputy prime minister who authored the mid-2000s public-finance reform plan.',
      aliases: ['Jerzy Hausner', 'Hausner']
    },
    {
      id: 'letowska',
      className: 'party-nonpartisan',
      explanation: 'Ewa Łętowska is a jurist who was Poland’s first Commissioner for Human Rights and later a Constitutional Tribunal judge.',
      aliases: ['Ewa Łętowska', 'Ewa Letowska', 'Łętowska']
    },
    {
      id: 'czaputowicz',
      className: 'party-nonpartisan',
      explanation: 'Jacek Czaputowicz is a political scientist who served as foreign minister from 2018 to 2020.',
      aliases: ['Jacek Czaputowicz', 'Czaputowicz']
    },
    {
      id: 'stanny',
      className: 'party-nonpartisan',
      explanation: 'Monika Stanny is a rural-development scholar who directs research on the social geography of the Polish countryside.',
      aliases: ['Monika Stanny']
    },
    {
      id: 'koziej',
      className: 'party-nonpartisan',
      explanation: 'Stanisław Koziej is a retired general and former head of the National Security Bureau.',
      aliases: ['Stanisław Koziej', 'Stanislaw Koziej', 'Koziej']
    },

    {
      id: 'pawel_kukiz',
      className: 'party-kukiz',
      explanation: 'Paweł Kukiz is a rock musician turned politician who leads Kukiz’15 and trades parliamentary support for institutional demands rather than ministries.',
      aliases: ['Paweł Kukiz', 'Pawel Kukiz']
    },
    {
      id: 'lempart',
      className: 'party-progressive',
      explanation: 'Marta Lempart co-founded the All-Poland Women’s Strike and leads its street mobilisation against the abortion ruling.',
      aliases: ['Marta Lempart', 'Lempart']
    },
    {
      id: 'karczewski',
      className: 'party-pis',
      explanation: 'Stanisław Karczewski is a PiS senator and former marshal of the Senate.',
      aliases: ['Stanisław Karczewski', 'Stanislaw Karczewski', 'Karczewski']
    },
    {
      id: 'wasik',
      className: 'party-pis',
      explanation: 'Maciej Wąsik was PiS deputy interior minister and Mariusz Kamiński’s long-standing deputy at the Central Anti-Corruption Bureau.',
      aliases: ['Maciej Wąsik', 'Maciej Wasik', 'Wąsik']
    },
    {
      id: 'ociepa',
      className: 'party-odnowa',
      explanation: 'Marcin Ociepa leads OdNowa RP, the small conservative party that stayed with PiS after the Porozumienie split.',
      aliases: ['Marcin Ociepa', 'Ociepa']
    },
    {
      id: 'bortniczuk',
      className: 'party-republicans',
      explanation: 'Kamil Bortniczuk is a Republican Party politician who served as sport and tourism minister in the United Right government.',
      aliases: ['Kamil Bortniczuk', 'Bortniczuk']
    },
    {
      id: 'horala',
      className: 'party-pis',
      explanation: 'Marcin Horała is the PiS MP who served as government plenipotentiary for the Central Communications Port.',
      aliases: ['Marcin Horała', 'Marcin Horala', 'Horała']
    },
    {
      id: 'pawlowska',
      className: 'party-pis',
      explanation: 'Monika Pawłowska is an MP who left the Left for Porozumienie and then PiS, and became the standing example of a mandate changing camp without an election.',
      aliases: ['Monika Pawłowska', 'Monika Pawlowska', 'Pawłowska']
    },
    {
      id: 'przylebska',
      className: 'party-nonpartisan',
      explanation: 'Julia Przyłębska presided over the Constitutional Tribunal through the 2020 abortion ruling and the disputes over the court’s own composition.',
      aliases: ['Julia Przyłębska', 'Julia Przylebska', 'Przyłębska']
    },
    {
      id: 'banas',
      className: 'party-nonpartisan',
      explanation: 'Marian Banaś is the president of the Supreme Audit Office, appointed by PiS and then in open conflict with it.',
      aliases: ['Marian Banaś', 'Marian Banas', 'Banaś']
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
      : 'Lewica';
  };
  var partyNamesForDefinition = function(definition) {
    if (definition.id !== 'lewica') {
      return {
        shortName: definition.shortName,
        longName: definition.longName
      };
    }
    var engine = window.dendryUI && window.dendryUI.dendryEngine;
    var qualities = engine && engine.state && engine.state.qualities;
    return {
      shortName: String(
        qualities && qualities.left_party_short_name || currentLeftName()
      ),
      longName: String(
        qualities && qualities.left_party_long_name || currentLeftName()
      )
    };
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
    'agrounia': true,
    'polish-coalition': true,
    'p2050': true,
    'third-way': true,
    'konf': true,
    'united-right': true,
    'prawica': true,
    'kkp': true,
    'national-movement': true,
    'new-hope': true,
    'agreement': true,
    'republicans': true,
    'odnowa': true,
    'sovereign-poland': true,
    'solidary-poland': true,
    'kukiz': true,
    'ued': true,
    'german-minority': true,
    'rozwoj-plus': true,
    'partia-zero': true,
    'us-dem': true,
    'us-gop': true,
    'knp': true
  };

  var currentGameQualities = function() {
    var engine = window.dendryUI && window.dendryUI.dendryEngine;
    return engine && engine.state && engine.state.qualities
      ? engine.state.qualities
      : {};
  };

  var isPrawicaPresentationMember = function(definition) {
    var qualities = currentGameQualities();
    return !!(
      definition &&
      definition.id !== 'kkp' &&
      Number(qualities.prawica_formed) === 1 &&
      Array.isArray(qualities.prawica_member_party_keys) &&
      qualities.prawica_member_party_keys.indexOf(definition.id) !== -1
    );
  };

  var syncPrawicaPresentationState = function() {
    if (!document.body) {
      return;
    }
    Array.prototype.slice.call(document.body.classList).forEach(function(name) {
      if (name === 'prawica-formed' || name.indexOf('prawica-member-') === 0) {
        document.body.classList.remove(name);
      }
    });
    var qualities = currentGameQualities();
    if (Number(qualities.prawica_formed) !== 1) {
      return;
    }
    document.body.classList.add('prawica-formed');
    (qualities.prawica_member_source_ids || []).forEach(function(id) {
      document.body.classList.add(
        'prawica-member-' + String(id).replace(/[^a-z0-9_-]+/gi, '-').toLowerCase()
      );
    });
  };

  var partyMarkup = function(alias) {
    var match = partyAliases[alias];
    if (!match) {
      return alias;
    }
    var prawicaMember = isPrawicaPresentationMember(match.definition);
    var logoId = prawicaMember
      ? 'prawica'
      : partyLogoIdForAlias(match, alias);
    var canonicalNames = partyNamesForDefinition(match.definition);
    var logoMarkup = partyLogoIds[logoId]
      ? '<span class="party-name-logo" aria-hidden="true"></span>'
      : '';
    return '<span class="party party-name ' + match.definition.className +
      (prawicaMember ? ' party-prawica' : '') +
      '" title="' + escapeAttribute(match.definition.explanation +
        (prawicaMember ? ' Founding member of Prawica.' : '')) +
      '" data-party="' + match.definition.id +
      (prawicaMember ? '" data-party-presentation="prawica' : '') +
      '" data-party-logo="' + logoId +
      '" data-party-short-name="' +
        escapeAttribute(canonicalNames.shortName) +
      '" data-party-long-name="' +
        escapeAttribute(canonicalNames.longName) + '">' +
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

    // The classical-liberal walkout is a party, not a caucus: whoever leads it
    // stops being rendered in KO's colour the day Nowa Platforma registers.
    var npLeaders = {
      sikorski: 'Radosław Sikorski',
      szlapka: 'Adam Szłapka',
      kierwinski: 'Marcin Kierwiński',
      trzaskowski: 'Rafał Trzaskowski'
    };
    if (
      npLeaders[definition.id] &&
      Number(qualities && qualities.ko_splinter_active) > 0 &&
      String(qualities && qualities.ko_splinter_type) === 'Classical-liberal' &&
      String(qualities && qualities.ko_break_leader) === npLeaders[definition.id]
    ) {
      return {
        id: definition.id,
        className: 'party-np',
        explanation: npLeaders[definition.id] +
          ' leads Nowa Platforma, the classical-liberal breakaway that re-founded Platforma Obywatelska outside the Civic bloc.',
        aliases: definition.aliases
      };
    }

    if (definition.id === 'nowacka') {
      var nowackaLeadsIpl =
        Number(qualities && qualities.ipl_joined_left) > 0 ||
        (
          Number(qualities && qualities.ko_splinter_active) > 0 &&
          String(qualities && qualities.ko_splinter_type) === 'Progressive' &&
          String(qualities && qualities.ko_break_leader) === 'Barbara Nowacka'
        );
      if (nowackaLeadsIpl) {
        return {
          id: definition.id,
          className: 'party-inicjatywa-polska',
          explanation: Number(qualities && qualities.ipl_joined_left) > 0
            ? 'Barbara Nowacka leads Inicjatywa Polska as an internal progressive current in ' + currentLeftName() + '.'
            : 'Barbara Nowacka leads an independent Inicjatywa Polska after its progressive break with KO.',
          aliases: definition.aliases
        };
      }
    }

    if (
      mergedLeft &&
      (
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
    syncPrawicaPresentationState();
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
        var prawicaMember = isPrawicaPresentationMember(definition);
        var canonicalNames = partyNamesForDefinition(definition);
        element.classList.add('party');
        if (!personDefinition) {
          element.title = definition.explanation;
        }
        element.setAttribute('data-party', definition.id);
        if (prawicaMember) {
          element.classList.add('party-prawica');
          element.setAttribute('data-party-presentation', 'prawica');
          element.setAttribute('data-party-logo', 'prawica');
          element.title = definition.explanation + ' Founding member of Prawica.';
        }
        element.setAttribute('data-party-short-name', canonicalNames.shortName);
        element.setAttribute('data-party-long-name', canonicalNames.longName);
        if (exactAlias && !prawicaMember) {
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

  var moodBackgroundStops = [
    [35, [113, 118, 124]], // Dark gray at the most hostile extreme.
    [45, [211, 220, 232]], // Konfederacja blue, softened for a large surface.
    [50, [243, 243, 227]], // The original beige-yellow neutral.
    [55, [239, 211, 215]], // The Left's red, kept pastel.
    [65, [228, 204, 224]]  // Razem purple at the most favourable end.
  ];

  window.moodBackgroundColor = function(value) {
    var score = Number(value);
    if (!Number.isFinite(score)) {
      score = 50;
    }
    score = Math.max(
      moodBackgroundStops[0][0],
      Math.min(moodBackgroundStops[moodBackgroundStops.length - 1][0], score)
    );
    var lower = moodBackgroundStops[0];
    var upper = moodBackgroundStops[moodBackgroundStops.length - 1];
    for (var i = 1; i < moodBackgroundStops.length; i++) {
      if (score <= moodBackgroundStops[i][0]) {
        lower = moodBackgroundStops[i - 1];
        upper = moodBackgroundStops[i];
        break;
      }
    }
    var progress = (score - lower[0]) / (upper[0] - lower[0]);
    var color = lower[1].map(function(channel, channelIndex) {
      return Math.round(
        channel + (upper[1][channelIndex] - channel) * progress
      );
    });
    return 'rgb(' + color.join(', ') + ')';
  };

  window.updateMoodBackground = function() {
    var engine = window.dendryUI && window.dendryUI.dendryEngine;
    var qualities = engine && engine.state && engine.state.qualities;
    var score = qualities && qualities.public_climate_progressive_index;
    document.body.style.setProperty(
      '--mood-bg-color',
      window.moodBackgroundColor(score)
    );
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
      id: 'onet', name: 'Onet', mark: 'ONET', accent: '#ffd200',
      foreground: '#171717',
      from: 0, patron: 'ko'
    },
    {
      id: 'wp', name: 'WP', mark: 'WP', accent: '#d71920',
      from: 0, patron: 'neutral'
    },
    {
      id: 'rzeczpospolita',
      name: 'Rzeczpospolita',
      mark: 'RZ',
      accent: '#343434',
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
        'Lewandowski completes the treble with Bayern and becomes the FIFA award favourite',
        'Bayern’s Champions League victory completed a historic treble, with Robert Lewandowski’s goals making him the leading candidate for The Best FIFA Men’s Player.',
        'https://sport.tvp.pl/49538775/fifa-the-best-dla-roberta-lewandowskiego-przegrywal-bo-nie-bylo-go-na-chipsach',
        '24 AUG 2020'
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
        'Lewandowski scores 41 and breaks Gerd Müller’s Bundesliga record',
        'The Polish striker scored in Bayern’s final league match to finish the season with 41 goals, one more than Müller’s 49-year-old mark.',
        'https://eurosport.tvn24.pl/pilka-nozna/robert-lewandowski-pobil-rekord-gerda-muellera-wszystkie-jego-gole-w-sezonie-20202021_sto9459646/story.shtml',
        '22 MAY 2021'
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
      onet: pressStory(
        'Świątek wins Roland Garros after a commanding final against Gauff',
        'Iga Świątek defeated Coco Gauff 6–1, 6–3 in Paris to claim her second Grand Slam singles title.',
        'https://przegladsportowy.onet.pl/tenis/iga-swiatek-cori-gauff-na-zywo-relacja-i-wynik-meczu-final-roland-garros/dhe2bt6',
        '4 JUN 2022'
      ),
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
        'Poland takes silver at the volleyball World Championship',
        'The defending champions lost the Katowice final 1–3 to Italy and completed the tournament with the silver medal.',
        'https://eurosport.tvn24.pl/siatkowka/siatkowka-polska-wlochy-wynik-meczu-i-relacja-final-ms-siatkarzy-2022_sto9492496/story.shtml',
        '11 SEP 2022'
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
      tvp: pressStory(
        'Poland wins the Volleyball Nations League for the first time',
        'The national team defeated the United States in the final in Gdańsk, giving captain Bartosz Kurek another landmark trophy.',
        'https://sport.tvp.pl/71514009/bartosz-kurek-przeszedl-do-historii-polskiej-siatkowki-dokonal-tego-jako-pierwszy/amp',
        '24 JUL 2023'
      ),
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
        'Poland sweeps Italy to become European volleyball champion',
        'The men’s national team won the Rome final 3–0, securing Poland’s second European title.',
        'https://eurosport.tvn24.pl/siatkowka/mistrzostwa-europy/2023/me-siatkarzy-2023-terminarz-wyniki-i-tabela-mistrzostw-europy-w-siatkowce-mezczyzn_sto9763987/story.shtml',
        '16 SEP 2023'
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
      ),
      wp: pressStory(
        'Roads close, grain waits and the farmers’ demands no longer fit one slogan',
        'Ukrainian imports, European climate rules and supermarket bargaining power have converged in one protest whose organisers do not agree on the remedy.'
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
      ),
      onet: pressStory(
        'The local count redraws the map beneath the national coalition',
        'Mayors and regional assemblies expose where government recognition became organisation—and where Lewica still depends on partners to reach the ballot.'
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
      ),
      tvn: pressStory(
        'The European result strengthens the centre—and leaves Lewica searching for its voters',
        'KO can claim a national victory, but governing partners must explain why office did not give each of them an equally visible European record.'
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
        'Poland finishes the Paris Olympics with ten medals',
        'Aleksandra Mirosław supplied Poland’s gold in speed climbing as the team closed the Games with ten medals overall.',
        'https://eurosport.tvn24.pl/igrzyska-olimpijskie/igrzyska-olimpijskie-paryz-2024/2024/medale-polakow-kto-zdobyl-ile-medali-ma-polska_sto20022245/story.shtml',
        '11 AUG 2024'
      ),
      wp: pressStory(
        'The pension promise reaches households—and the next budget spreadsheet',
        'Recipients can count the payment now; coalition parties still have to say whether the guarantee survives slower growth and competing public-service bills.'
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
      ),
      tvn: pressStory(
        'Suspending asylum tests both the border and the coalition’s legal promises',
        'KO calls the restriction necessary; Lewica must decide whether safeguards can repair a policy it believes crosses the government’s democratic line.'
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
      tvp: pressStory(
        'Polish women learn their opponents for a first European Championship',
        'Poland will face Germany, Denmark and Sweden at Euro 2025 after qualifying for the tournament for the first time.',
        'https://sport.tvp.pl/84053146/rozlosowano-grupy-euro-2025-wiadomo-z-kim-reprezentacja-polski-kobiet-zagra-na-przyszlorocznym-turnieju',
        '16 DEC 2024'
      ),
      tvn: pressStory(
        'The budget reaches the chamber with KPO projects—and coalition promises—on the clock',
        'KO offers stability before the presidential race; Lewica must decide which deliverables justify pressure and which risk the entire majority.'
      ),
      republika: pressStory(
        'A record budget, European strings and the Left’s invoice: Poles will pay for coalition survival',
        'PiS warns that borrowed celebration conceals higher costs while Lewica treats every fiscal ceiling as an ideological provocation.'
      ),
      wp: pressStory(
        'One budget carries reconstruction, wages and the coalition’s unfinished first year',
        'The roll call will settle the legal appropriation; ministries will still have to prove that the money reaches schools, counties and projects on schedule.'
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
      ),
      onet: pressStory(
        'A new classroom rule opens an old coalition argument about equality and control',
        'Lewica wants one enforceable national floor while ministers and municipalities dispute staffing, parental consent and what schools can actually deliver.'
      )
    },
    202503: {
      tvp: pressStory(
        'Bogdanka LUK Lublin wins the Challenge Cup',
        'The Lublin club completed a historic European triumph, beating Cucine Lube Civitanova in the two-leg final.',
        'https://sport.tvp.pl/85687847/historyczny-sukces-bogdanki-luk-lublin-wilfredo-leon-i-spolka-triumfowali-w-pucharze-challenge',
        '19 MAR 2025'
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
      ),
      tvn: pressStory(
        'The hospital incident forces every presidential campaign to name its limits',
        'Condemnation is easy; parties must now decide whether democratic isolation, prosecution or another televised confrontation best protects patients without feeding the spectacle.'
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
      ),
      wp: pressStory(
        'The Palace result becomes a confidence count inside the Sejm',
        'The presidential ballot changed political authority, not parliamentary seats; coalition leaders must now show whether their majority still exists on a named programme.'
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
      ),
      rzeczpospolita: pressStory(
        'A new President inherits every limit the campaign pretended the Palace could remove',
        'Vetoes and appointments matter, but neither writes a budget nor supplies a Sejm majority; the first hundred days will expose which promises require cooperation.'
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
        'Polish women beat Wales 5–2 after their European Championship debut',
        'The national team won the friendly in Newport, continuing its first season after appearing at a major tournament.',
        'https://sport.tvp.pl/89719960/reprezentacja-polski-kobiet-pokonala-walie-w-meczu-towarzyskim',
        '28 OCT 2025'
      ),
      tvn: pressStory(
        'KO becomes one larger party. Consolidation will not replace coalition management',
        'The prime minister strengthens the centre, but still needs a Left that can be tolerated as a negotiating partner rather than a permanent rebellion.'
      ),
      'kanal-zero': pressStory(
        'The centre merges its logos and calls the organisation new',
        'A larger KO can discipline candidates and money, but it cannot make coalition partners disappear or turn internal agreement into public enthusiasm.'
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
      ),
      tvn: pressStory(
        'The labour promise reaches its decisive line: staff, powers and money',
        'Lewica can claim a law only if the inspectorate can enforce it; KO must decide whether European milestones and domestic delivery share the same budget priority.'
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
        'Poland ends the Winter Olympics with four medals',
        'Three silver medals and one bronze placed Poland 21st in the final table, led by Kacper Tomasiak’s two ski-jumping medals.',
        'https://eurosport.tvn24.pl/igrzyska-olimpijskie/mediolan-cortina-2026/2026/klasyfikacja-medalowa-zimowych-igrzysk-olimpijskich-2026.-ktore-miejsce-zajeli-polacy_sto23264771/story.shtml',
        '22 FEB 2026'
      ),
      republika: pressStory(
        'The government cannot command the Palace, so it calls resistance a crisis',
        'PiS defends presidential authority while Lewica joins KO’s attempt to subordinate every independent office to the cabinet.'
      ),
      wp: pressStory(
        'Two signatures, one embassy and a dispute allies can no longer ignore',
        'The cabinet directs foreign policy while the President participates in appointments; neither side has explained how an ambassador serves through an indefinite institutional standoff.'
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
      ),
      onet: pressStory(
        'Morawiecki builds outside the party room. PiS must decide whether this is leverage or departure',
        'An association can collect experts and local allies without moving a single MP; the test begins when loyalty, candidates and money can no longer belong to both organisations.'
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
      ),
      rownosc: pressStory(
        'Partnership is not a photograph. Families need the registry, inheritance and hospital rules',
        'The compromise matters because people can use it, but only a funded implementation timetable will turn the chamber’s recognition into equal treatment at the counter.'
      )
    },
    202606: {
      tvp: pressStory(
        'Poland comes back from two sets down to beat Ukraine',
        'The men’s national team recovered from 0–2 to win its Nations League match 3–2 in Ottawa.',
        'https://sport.tvp.pl/93800463/polscy-siatkarze-wygrali-z-ukraina-w-lidze-narodow-znakomity-powrot/amp',
        '14 JUN 2026'
      ),
      republika: pressStory(
        'The Tribunal answers the majority—and ministers suggest the ruling need not count',
        'PiS warns that KO and Lewica accept constitutional review only when it produces the result already agreed in cabinet.'
      ),
      onet: pressStory(
        'One ruling, two legal realities and no citizen who can wait for politicians to agree',
        'KO must finish institutional repair; Lewica should prioritise enforceable remedies over another declaration that its preferred authority is the only one.'
      ),
      wp: pressStory(
        'The judgment lands. Offices still need one rule for Monday morning',
        'Ministers and the Palace can dispute the panel’s authority for years; registries, courts and families need to know which decision governs the next application.'
      ),
      rownosc: pressStory(
        'Rights cannot depend on which half of the state answers the telephone',
        'The constitutional conflict is already material: partners, patients and applicants face delay while institutions argue over whose seal makes their lives valid.'
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
      ),
      rownosc: pressStory(
        'The President now decides whether thousands of families can use the law they were promised',
        'Signature opens the implementation fight and veto opens the mobilisation fight; neither outcome makes the people waiting for legal security disappear.'
      )
    },
    202608: {
      'kanal-zero': pressStory(
        'PiS departures reach the point where “internal debate” stops convincing anyone',
        'The right must choose between a real split and another bargain that protects the same leadership circle.'
      ),
      tvp: pressStory(
        'Government asks the Palace to end the appointments blockade',
        'The cabinet defends continuity and lawful staffing while Lewica presses for deadlines that do not reopen the constitutional war.'
      ),
      tvn: pressStory(
        'Vacant offices turn presidential resistance into a state-capacity test',
        'KO wants appointments completed; Lewica must show which deadline protects public service and which shortcut would deepen the next legal dispute.'
      ),
      rownosc: pressStory(
        'An appointments blockade is paid for in queues, missing staff and delayed rights',
        'Institutional cohabitation sounds remote until an office cannot decide a benefit, inspection or protection claim because nobody may lawfully sign it.'
      )
    },
    202609: {
      tvn: pressStory(
        'A new conservative club redraws the opposition benches',
        'KO sees a divided right; Lewica can use the opening if it offers delivery instead of celebrating somebody else’s fracture.'
      ),
      republika: pressStory(
        'The right breaks its own monopoly. A new club says PiS forgot development',
        'Konfederacja welcomes competition that exposes career loyalty, but voters will demand more than recycled government biographies.'
      ),
      onet: pressStory(
        'The 2027 budget begins as the party system moves underneath it',
        'KO must fund governing priorities while Lewica decides whether leverage is worth risking the stability voters still expect.'
      ),
      rownosc: pressStory(
        'A new club changes the seating plan. The budget still decides who gets security',
        'Party defections dominate the cameras, but workers, tenants and public services will judge the new alignment by the appropriations it supports.'
      )
    },
    202610: {
      onet: pressStory(
        'The judicial-status bill reaches the Palace. Poland cannot survive another improvised repair',
        'KO needs a defensible statute; Lewica should make individual rights the test rather than demand victory in every institutional claim.'
      ),
      wp: pressStory(
        'Sign, veto or refer: the courts wait behind three presidential doors',
        'Each route changes the timetable, but none immediately resolves the status of every appointment and judgment.'
      ),
      rzeczpospolita: pressStory(
        'The majority calls its judicial settlement final. The Palace still has three ways to refuse',
        'A statute cannot erase contested appointments by declaration; conservatives expect the President to test both the text and the authority claimed behind it.'
      ),
      rownosc: pressStory(
        'Judicial repair has one measure: whether ordinary people keep their judgments and rights',
        'The parties are counting offices while families and workers need a settlement that protects decided cases, timely hearings and access to an independent court.'
      )
    },
    202611: {
      rzeczpospolita: pressStory(
        'Lewica invites the centre into one party. The ideological bill comes after the merger',
        'A broad formation may win offices, but voters should ask which programme survives when every faction is promised a home.'
      ),
      'kanal-zero': pressStory(
        'Three right-wing columns fight for one Independence March',
        'Konfederacja refuses to surrender the street to PiS nostalgia or a new conservative project assembled from defectors.'
      ),
      tvp: pressStory(
        'A named replacement faces the Sejm. Government calls every partner to the roll',
        'The cabinet defends its mandate against a constructive motion while Lewica must choose whether coalition repair is still credible.'
      ),
      rownosc: pressStory(
        'A larger Left must protect the movements and workers it is asking to come inside',
        'Realignment can widen power only if representation, internal democracy and the social programme survive the merger rather than becoming campaign decoration.'
      )
    },
    202612: {
      tvp: pressStory(
        'The final pre-election budget puts government continuity on the line',
        'Ministers defend funded delivery and constitutional deadlines as parties turn toward the election year.'
      ),
      tvn: pressStory(
        'The budget folders close. The election-year record remains open',
        'KO’s governing case and Lewica’s leverage are measured in the institutions, laws and alliances carried into 2027.'
      ),
      wp: pressStory(
        'The pre-election budget passes from coalition promise to household timetable',
        'Schools, hospitals, inspectors and local projects now have appropriations; delivery before the campaign will decide whether voters recognise them.'
      ),
      rownosc: pressStory(
        'The budget is a rights document written in numbers',
        'Every equality promise depends on staffed offices, accessible services and workers paid to deliver them; the election-year audit starts with those lines.'
      )
    },
    202701: {
      onet: pressStory(
        'Eight years of Left strategy enter one election year',
        'Lewica must decide whether voters should judge a governing record, an independent programme or the organisation built beneath both.'
      ),
      republika: pressStory(
        'The coalition enters 2027 asking voters to forget its internal bill',
        'The right will make every delayed reform and cabinet bargain part of the coming parliamentary campaign.'
      ),
      tvn: pressStory(
        'The election year begins with a record no coalition partner can edit alone',
        'KO wants continuity, Lewica wants distinct ownership and the centre wants survival; voters will compare all three claims with the same years in office.'
      ),
      rownosc: pressStory(
        'Election year starts where the governing record meets everyday life',
        'Partnership, wages, housing and public services will matter only where people can point to a right gained, a queue shortened or power organised beyond a slogan.'
      )
    },
    202702: {
      wp: pressStory(
        'Household security returns to the centre of the campaign',
        'Wages, housing, prices and public services give smaller parties a route around another purely institutional contest.'
      ),
      'kanal-zero': pressStory(
        'A campaign about delivery meets voters who remember the promises',
        'Government and opposition can no longer separate their programmes from the record accumulated since the last Sejm election.'
      ),
      onet: pressStory(
        'Rents, wages and waiting lists interrupt the campaign leaders planned to run',
        'Lewica sees an opening in material security, but it must connect every promise to delivery rather than ask voters to reward pressure alone.'
      ),
      rownosc: pressStory(
        'Household security is political power measured at the end of the month',
        'Tenants, carers and low-paid workers are setting the campaign test: stable homes, enforceable wages and services available before a crisis.'
      )
    },
    202703: {
      tvn: pressStory(
        'The democratic majority rehearses unity before it negotiates the lists',
        'KO wants a clear governing alternative while Lewica and the centre calculate how much identity tactical coordination costs.'
      ),
      rzeczpospolita: pressStory(
        'Electoral arithmetic begins to discipline the coalition’s ambitions',
        'Thresholds and Senate districts reward cooperation, but every shared banner creates a new argument over nominations and money.'
      ),
      onet: pressStory(
        'The unity photograph is easy. The candidate spreadsheet begins underneath it',
        'Democratic parties agree on the threat of a divided vote while disputing thresholds, safe places and which promises a common campaign must carry.'
      ),
      rownosc: pressStory(
        'No democratic list is complete without guarantees for the people asked to defend it',
        'Equality groups, unions and local organisers want programme commitments and winnable representation before their work becomes somebody else’s unity photograph.'
      )
    },
    202704: {
      onet: pressStory(
        'Local structures become the hidden primary before candidate lists close',
        'National leaders need councillors, organisers and volunteers who can convert recognition into an actual election operation.'
      ),
      republika: pressStory(
        'The right’s rival organisations discover that a logo is not a field campaign',
        'PiS, Konfederacja and their splinters compete for candidates, local money and the authority to define the opposition.'
      ),
      wp: pressStory(
        'Candidate lists are being written in county offices, not television studios',
        'Safe places, local records and volunteer networks now decide which national promise reaches a doorstep with a recognisable name beside it.'
      ),
      rownosc: pressStory(
        'Winnable places are the campaign’s first equality vote',
        'Parties praising women, workers and minority organisers must now decide whether those people receive resources and positions capable of winning seats.'
      )
    },
    202705: {
      tvp: pressStory(
        'The cabinet turns implementation dates into campaign dates',
        'Every ministry presents delivery as proof of competence while partners dispute who supplied the votes and who owns the result.'
      ),
      wp: pressStory(
        'A future election is already testing the state’s unfinished work',
        'Judicial repair, equality, labour enforcement and public investment remain records to defend rather than boxes a slogan can close.'
      ),
      republika: pressStory(
        'Ministers convert every administrative deadline into a campaign launch',
        'The coalition calls implementation proof of competence; the right will ask why rights and projects promised years ago arrive only when ballots approach.'
      ),
      rownosc: pressStory(
        'Implementation is the difference between a manifesto and a usable right',
        'Registries, inspectors and local services need staff, rules and dates that survive the campaign tour and remain after ministers stop cutting ribbons.'
      )
    },
    202706: {
      'kanal-zero': pressStory(
        'Candidate season arrives and every faction calls itself indispensable',
        'Party leaders must decide which internal currents receive safe places and which are expected to campaign without leverage.'
      ),
      tvn: pressStory(
        'The opposition asks for one democratic story. Smaller parties ask for guarantees',
        'Unity photographs cannot settle thresholds, subsidies, candidate order or the programme a future coalition would enact.'
      ),
      onet: pressStory(
        'The list talks reach the names—and every abstract alliance becomes personal',
        'Leaders can trade committee formulas in private; candidates and local organisations will decide whether the settlement survives its first publication.'
      ),
      rownosc: pressStory(
        'Candidate negotiations reveal whose work the alliance considers expendable',
        'Movement organisers and workplace voices need more than symbolic last places if the campaign expects them to mobilise people whom party brands do not reach.'
      )
    },
    202707: {
      rzeczpospolita: pressStory(
        'The constitutional election window approaches with the party system unsettled',
        'The President must order a vote within the end-of-term rules while every camp still argues over the coalition it will present.'
      ),
      onet: pressStory(
        'The summer campaign begins before the formal posters appear',
        'Polling, local nominations and tactical desertion are already moving voters among lists whose final shape is not yet secure.'
      ),
      tvn: pressStory(
        'The election date approaches while the democratic lists remain unfinished',
        'KO wants clarity before voters tune out for summer; Lewica must balance tactical coordination against the distinct mandate it says the next coalition needs.'
      ),
      rownosc: pressStory(
        'The election calendar is fixed. The social deadline was already here',
        'People facing eviction, discrimination or unsafe work cannot wait for campaign season, so organisers are judging parties by what they deliver before asking for another mandate.'
      )
    },
    202708: {
      tvp: pressStory(
        'The election order turns governing claims into ballot tests',
        'Ministers defend continuity, opposition parties demand a verdict and Lewica tries to convert leverage into a distinct mandate.'
      ),
      republika: pressStory(
        'The campaign begins with three rights and no uncontested leader',
        'Conservative voters choose among institutional restoration, developmental competence and anti-system confrontation.'
      ),
      wp: pressStory(
        'The election is ordered. Committees now face dates no negotiation can move',
        'Registrations, signatures, broadcasts and candidate filings turn months of strategic ambiguity into one enforceable campaign calendar.'
      ),
      rownosc: pressStory(
        'The campaign opens with a simple demand: put material equality on the ballot',
        'Candidates will be asked for enforceable commitments on work, housing, care and family security—not another promise to settle them after coalition talks.'
      )
    },
    202709: {
      wp: pressStory(
        'One last argument: social security, democratic continuity or party independence',
        'Lewica’s closing choice will affect turnout and tactical voting, but the count will still enforce every committee threshold.'
      ),
      'kanal-zero': pressStory(
        'The debates end. The thresholds do not negotiate',
        'Parties that spent years multiplying organisations now face the arithmetic that converts votes into seats—or waste.'
      ),
      tvp: pressStory(
        'The closing campaign asks voters to connect four years of delivery with one ballot',
        'Government parties defend continuity while rivals promise correction; each list now has days, not months, to prove its vote will count.'
      ),
      rownosc: pressStory(
        'The final mobilisation belongs to people politics usually treats as an audience',
        'Workers, tenants, carers and equality organisers are turning promises into turnout—and recording which candidates stood beside them before the cameras arrived.'
      )
    },
    202710: {
      onet: pressStory(
        'Poland votes. The next Sejm will reveal which alliances survived the campaign',
        'Votes are counted across a fragmented party field, with every committee threshold enforced before seats are apportioned.'
      ),
      tvn: pressStory(
        'Election night closes the campaign and opens the verdict on eight years',
        'Sejm proportional seats and one hundred Senate districts now decide which organisations retain parliamentary power.'
      ),
      rzeczpospolita: pressStory(
        'The ballots are cast. Coalition promises now meet constitutional arithmetic',
        'No television declaration can change a missed threshold or manufacture 231 seats; the next government begins with the count parties actually earned.'
      ),
      rownosc: pressStory(
        'Election night counts seats—and the movements that made those votes possible',
        'Whatever coalition follows, organisers will measure the result by representation, usable rights and whether the people mobilised today retain power tomorrow.'
      )
    }
  };

  // One contemporaneous outlet report for every historical/current month.
  // These are stored locally so the game never depends on a live news request.
  [
    [201911, 'tvp',
      'Polish sprint cyclists set a national record at the World Cup',
      'The women’s team sprint squad lowered the Polish record during the opening round of the track-cycling World Cup.',
      'https://sport.tvp.pl/45134102/puchar-swiata-w-kolarstwie-torowym-rekord-polski-druzyny-sprinterek',
      '1 NOV 2019'],
    [201912, 'tvp',
      'Lewandowski closes 2019 as the world’s leading goalscorer',
      'Robert Lewandowski finished the calendar year with more goals than any other player in world football.',
      'https://sport.tvp.pl/45935597/najlepszy-pilkarzy-2019-roku-na-swiecie-wedlug-dziennikarzy-tvp-sport',
      '27 DEC 2019'],
    [202001, 'tvp',
      'Bundesliga recognises another record-breaking month for Lewandowski',
      'The German league honoured Robert Lewandowski after another prolific run for Bayern Munich.',
      'https://sport.tvp.pl/46006939/robert-lewandowski-wyrozniony-przez-lige-niemiecka',
      '1 JAN 2020'],
    [202002, 'tvp',
      'Kubacki reaches a tenth consecutive World Cup podium',
      'Dawid Kubacki extended his remarkable ski-jumping streak with a tenth straight podium finish in Sapporo.',
      'https://sport.tvp.pl/46456750/puchar-swiata-w-skokach-sapporo-piekna-seria-kubackiego-trwa-10-podium-z-rzedu',
      '1 FEB 2020'],
    [202003, 'tvp',
      'Milik and Zieliński help Napoli continue its climb',
      'The Polish internationals earned praise as Napoli continued its recovery in the Serie A table.',
      'https://sport.tvp.pl/46910745/arkadiusz-milik-i-piotr-zielinski-pochwaleni-napoli-pnie-sie-w-tabeli-serie-a',
      '1 MAR 2020'],
    [202004, 'tvp',
      'Table-tennis season ends early with champions declared',
      'Enea Siarka Tarnobrzeg and Kolping Frac Jarosław were named Polish champions after the pandemic stopped the season.',
      'https://sport.tvp.pl/47370707/koronawirus-enea-siarka-tarnobrzeg-i-kolping-frac-jaroslaw-mistrzami-polski-rozgrywki-tenisa-stolowego-zaknczone',
      '1 APR 2020'],
    [202005, 'tvp',
      'Vital Heynen will lead Poland’s volleyball team through 2021',
      'The Polish federation extended the national-team coach’s contract through the rescheduled Olympic season.',
      'https://sport.tvp.pl/47840906/vital-heynen-selekcjonerem-polski-do-2021-roku-pzps-przedluzyl-umowe',
      '1 MAY 2020'],
    [202006, 'tvp',
      'Polish volleyball selects its team of the league’s first twenty years',
      'A retrospective vote assembled the standout players from two decades of Poland’s professional volleyball league.',
      'https://sport.tvp.pl/48324328/druzyna-20-lecia-polskiej-ligi-siatkowki',
      '1 JUN 2020'],
    [202007, 'tvp',
      'Lewandowski revisits the transfer that never happened at Legia',
      'The Bayern striker recalled why an early-career move to Legia Warsaw did not materialise.',
      'https://sport.tvp.pl/48767909/robert-lewandowski-legia-nie-do-konca-chcialem-tam-isc-wideo',
      '1 JUL 2020'],
    [202009, 'tvp',
      'The Netherlands enters Poland’s Nations League match without Koeman',
      'Poland prepared to face a Dutch side beginning a new chapter after Ronald Koeman’s departure.',
      'https://sport.tvp.pl/49647029/liga-narodow-holandia-bez-ronalda-koemana-jaki-zespol-zagra-z-polska',
      '1 SEP 2020'],
    [202011, 'tvp',
      'Poland wins ten medals at the junior fitness world championships',
      'The Polish team collected ten medals, including four golds, at the junior bodybuilding and fitness championships.',
      'https://sport.tvp.pl/50599357/mistrzostwa-swiata-juniorow-w-kulturystyce-i-fitness-dziesiec-medali-dla-polski-w-tym-cztery-zlote',
      '1 NOV 2020'],
    [202012, 'tvp',
      'Lewandowski is nominated for UEFA’s Team of the Year',
      'Robert Lewandowski joined the candidates for UEFA’s annual selection after Bayern’s trophy-winning season.',
      'https://sport.tvp.pl/51118984/pilka-nozna-lewandowski-nominowany-do-druzyny-roku-uefa',
      '1 DEC 2020'],
    [202101, 'tvp',
      'Kubacki wins in Garmisch-Partenkirchen as Żyła joins him on the podium',
      'Dawid Kubacki won the New Year’s ski-jumping contest and Piotr Żyła completed a double Polish podium.',
      'https://sport.tvp.pl/51605935/skoki-69-turniej-czterech-skoczni-dawid-kubacki-wygral-konkurs-w-ga-pa-piotr-zyla-na-podium',
      '1 JAN 2021'],
    [202102, 'tvp',
      'Cycling legend Ryszard Szurkowski dies',
      'Polish sport mourned one of its most decorated cyclists, an Olympic medallist and four-time Peace Race winner.',
      'https://sport.tvp.pl/52073332/zmarl-ryszard-szurkowski-najbardziej-utytulowany-polski-kolarz',
      '1 FEB 2021'],
    [202103, 'tvp',
      'England beats Poland 2–1 at Wembley',
      'Poland pushed the hosts after Jakub Moder’s equaliser, but Harry Maguire settled the World Cup qualifier late.',
      'https://sport.tvp.pl/53074694/anglia-polska-21-kamil-jozwiak-naprawde-nacisnelismy-anglikow',
      '31 MAR 2021'],
    [202104, 'tvp',
      'Volleyball Nations League schedules are finally confirmed',
      'Poland’s women’s and men’s national teams learned their full programmes for the returning international competition.',
      'https://sport.tvp.pl/53586886/siatkowka-trzeba-bylo-dlugo-czekac-ale-znamy-terminarz-ligi-narodow-reprezentacji-polski-siatkarzy-i-siatkarek',
      '30 APR 2021'],
    [202106, 'tvp',
      'Świątek opens Wimbledon with victory over Zvonareva',
      'Iga Świątek made a winning start on the grass at Wimbledon against former finalist Vera Zvonareva.',
      'https://sport.tvp.pl/54617502/iga-swiatek-wiera-zwonariowa-wypowiedzi-po-meczu',
      '30 JUN 2021'],
    [202107, 'tvp',
      'Zmarzlik wins the Polish Grand Prix again in Wrocław',
      'Bartosz Zmarzlik repeated his Speedway Grand Prix victory at the Wrocław round.',
      'https://sport.tvp.pl/55147355/grand-prix-polski-bartosz-zmarzlik-ponownie-najlepszy-we-wroclawiu',
      '31 JUL 2021'],
    [202109, 'tvp',
      'Legia opens the Europa League group with two victories',
      'The Warsaw club won its first two group matches, a feat rarely achieved by a Polish side in European competition.',
      'https://sport.tvp.pl/56137864/liga-europy-legia-warszawa-wygrala-dwa-pierwsze-mecze-fazy-grupowej-drugi-przypadek-w-historii-polskiej-pilki',
      '30 SEP 2021'],
    [202110, 'tvp',
      'Zieliński passes Boniek among Polish Serie A goalscorers',
      'Piotr Zieliński moved ahead of Zbigniew Boniek in the historical ranking of Polish scorers in Italy’s top flight.',
      'https://sport.tvp.pl/56687844/serie-a-piotr-zielinski-wyprzedzil-zbigniewa-bonka-w-klasyfikacji-polskich-strzelcow-w-serie-a',
      '31 OCT 2021'],
    [202111, 'tvp',
      'Hurkacz remains tenth in the ATP ranking',
      'Hubert Hurkacz held a career-best place inside the world top ten as the season approached its finale.',
      'https://sport.tvp.pl/56694554/atp-hubert-hurkacz-pozostal-na-10-miejscu-stan-na-1112021',
      '1 NOV 2021'],
    [202112, 'tvp',
      'Brighton signs Kacper Kozłowski in an £8 million deal',
      'The teenage Poland international joined Brighton and was set to continue his development on loan in Belgium.',
      'https://sport.tvp.pl/57731643/premier-league-brighton-zaplaci-8-milionow-funtow-za-kacpra-kozlowskiego-reprezentant-polski-zostanie-wypozyczony-do-belgii',
      '31 DEC 2021'],
    [202201, 'tvp',
      'Czesław Michniewicz becomes Poland’s national-team coach',
      'The new manager took charge with Poland’s World Cup play-off campaign immediately ahead.',
      'https://sport.tvp.pl/58250240/czeslaw-michniewicz-selekcjoner-reprezentacji-polski-czeslaw-michniewicz-wszystko-zalezy-od-jednego-meczu',
      '31 JAN 2022'],
    [202202, 'tvp',
      'FIFA and UEFA suspend Russia as Poland awaits a play-off decision',
      'Football’s governing bodies removed Russian teams from competition after Poland refused to play its scheduled World Cup qualifier.',
      'https://sport.tvp.pl/58782807/cezary-kulesza-po-zawieszeniu-reprezentacji-rosji-przez-fifa-i-uefa-co-z-barazami-kadry-polski',
      '28 FEB 2022'],
    [202203, 'tvp',
      'Lewandowski receives Poland’s Wiktory sportsman award',
      'Robert Lewandowski was named sportsman of the year at the revived Wiktory awards ceremony.',
      'https://sport.tvp.pl/59372171/wiktory-robert-lewandowski-sportowcem-roku-w-polsce-dariusz-szpakowski-wreczyl-statuetke-na-kolanach-wideo',
      '31 MAR 2022'],
    [202204, 'tvp',
      'Zmarzlik wins the Gorican Grand Prix with Janowski second',
      'Bartosz Zmarzlik led a Polish one-two at the opening Speedway Grand Prix round in Croatia.',
      'https://sport.tvp.pl/59931842/grand-prix-na-zuzlu-bartosz-zmarzlik-najlepszy-w-gorican-maciej-janowski-drugi',
      '30 APR 2022'],
    [202205, 'tvp',
      'Pia Skrzyszowska runs the fourth-fastest hurdles time in Polish history',
      'The young hurdler set a personal best that placed her fourth on Poland’s all-time list.',
      'https://sport.tvp.pl/60499054/lekkoatletyka-pia-skrzyszowska-z-nowym-rekordem-zyciowym-4-wynik-w-historii-polski',
      '31 MAY 2022'],
    [202207, 'tvp',
      'Polish teams start the Chess Olympiad with three perfect rounds',
      'Both national squads remained unbeaten through the first three rounds of the Olympiad in Chennai.',
      'https://sport.tvp.pl/61586619/olimpiada-szachowa-polskie-druzyny-z-kompletem-zwyciestw-po-trzech-rundach',
      '31 JUL 2022'],
    [202208, 'tvp',
      'Milik scores for Juventus as Szczęsny leaves injured',
      'Arkadiusz Milik found the net in a win over Spezia, while goalkeeper Wojciech Szczęsny was forced off.',
      'https://sport.tvp.pl/62143686/serie-a-juventus-wygral-ze-spezia-kontuzja-szczesnego-i-bramka-milika',
      '31 AUG 2022'],
    [202210, 'tvp',
      'Świątek arrives at the WTA Finals as the player to beat',
      'The world number one entered the season finale with a commanding record against the rest of her group.',
      'https://sport.tvp.pl/64251745/iga-swiatek-na-wta-finals-2022-bilans-spotkan-z-rywalkami-z-grupy-lista-szanse-igi-swiatek-na-wta-finals-2022',
      '31 OCT 2022'],
    [202211, 'tvp',
      'Poland advances to the World Cup round of sixteen',
      'Despite defeat by Argentina, the national team progressed from its group and returned to the knockout stage.',
      'https://sport.tvp.pl/64836124/mundial-2022-podsumowanie-11-dnia-mundialu-polska-awansowala-do-18-po-46-latach',
      '30 NOV 2022'],
    [202301, 'tvp',
      'Polish mountaineer Anna Czerwińska dies at 73',
      'One of Poland’s most accomplished Himalayan climbers died aged 73 after a lifetime in the world’s highest mountains.',
      'https://sport.tvp.pl/65963261/nie-zyje-anna-czerwinska-polska-himalaistka-miala-73-lata',
      '31 JAN 2023'],
    [202302, 'tvp',
      'Hurkacz wins his opening match in Dubai',
      'Hubert Hurkacz defeated Alexander Shevchenko to advance from the first round of the ATP tournament.',
      'https://sport.tvp.pl/66908854/hubert-hurkacz-wygral-z-aleksandrem-szewcznko-w-1-rundzie-turnieju-w-dubaju',
      '28 FEB 2023'],
    [202303, 'tvp',
      'Świątek tops the entry list for the Madrid Open',
      'The world number one headed the field announced for the season’s major clay-court tournament in Madrid.',
      'https://sport.tvp.pl/68887720/iga-swiatek-pierwsza-na-liscie-zgloszen-turnieju-w-wta-w-madrycie',
      '31 MAR 2023'],
    [202304, 'tvp',
      'Poland takes Britain to overtime at the ice-hockey world championship',
      'The national team recovered from two goals down before losing a dramatic Division IA match 5–4 in overtime.',
      'https://sport.tvp.pl/69554002/wielka-brytania-polska-hokej-na-lodzie-mistrzostwa-swiata-dywizji-1a-skrot',
      '30 APR 2023'],
    [202305, 'tvp',
      'Świątek adds a grass-court tournament before Wimbledon',
      'Iga Świątek entered the Bad Homburg event as part of her preparation for the grass-court Grand Slam.',
      'https://sport.tvp.pl/70244319/iga-swiatek-zgloszona-do-turnieju-na-trawie-w-bad-homburg',
      '31 MAY 2023'],
    [202306, 'tvp',
      'Polish volleyball women finish the Nations League round among the leaders',
      'The national team completed an outstanding preliminary phase and secured its place in the finals.',
      'https://sport.tvp.pl/70956773/to-juz-pewne-znakomity-wynik-polskich-siatkarek-po-fazie-zasadniczej-ligi-narodow',
      '30 JUN 2023'],
    [202308, 'tvp',
      'Poland opens the European volleyball championship by beating Czechia',
      'The men’s national team began the tournament with a straight-sets victory in its opening group match.',
      'https://sport.tvp.pl/72404975/mistrzostwa-europy-siatkarzy-2023-polska-czechy-skrot',
      '31 AUG 2023'],
    [202310, 'tvp',
      'Polish women beat Serbia in the Nations League',
      'Natalia Padilla-Bidas headed the only goal as Poland earned a 1–0 away victory.',
      'https://sport.tvp.pl/73809736/liga-narodow-kobiet-serbia-polska-01-gol-glowa-natalii-padilli-bidas',
      '31 OCT 2023'],
    [202312, 'tvp',
      'Inside the working lives of Poland’s women ice-hockey players',
      'A TVP report followed national-team players balancing elite hockey with ordinary jobs away from the rink.',
      'https://sport.tvp.pl/75103225/z-biura-prosto-na-lod-czyli-codziennosc-reprezentantek-polski-w-hokeju',
      '31 DEC 2023'],
    [202401, 'tvp',
      'Natalia Kaczmarek breaks a 49-year Polish mark over 300 metres',
      'Kaczmarek ran 35.52 in Potchefstroom, improving the unofficial national best set by Irena Szewińska in 1975.',
      'https://sport.tvp.pl/75691204/kaczmarek-pobila-rekord-szewinskiej-licze-na-poprawke-w-paryzu',
      '31 JAN 2024'],
    [202402, 'tvp',
      'Iwan Rakitski becomes junior European shooting champion',
      'The 17-year-old Pole won air-pistol gold at the European championships in Győr.',
      'https://sport.tvp.pl/76155206/wielki-sukces-17-letni-polak-mistrzem-europy',
      '27 FEB 2024'],
    [202403, 'tvp',
      'Zniszczoł earns his first ski-jumping World Cup podium',
      'Aleksander Zniszczoł finished third in Lahti to end Poland’s long wait for a podium that season.',
      'https://sport.tvp.pl/76244563/zniszczol-z-zyciowym-wynikiem-pierwsze-polskie-podium',
      '3 MAR 2024'],
    [202404, 'tvp',
      'Polish track sprinters secure their Paris Olympic place',
      'Marlena Karwacka, Urszula Łoś and Nikola Sibiak clinched qualification in the women’s team sprint.',
      'https://sport.tvp.pl/76966786/polskie-kolarki-torowe-wywalczyly-kwalifikacje-na-igrzyska-olimpijskie-w-paryzu',
      '13 APR 2024'],
    [202405, 'tvp',
      'Poland’s volleyball women beat Germany and remain unbeaten',
      'The national team extended its perfect start to the Nations League with another victory.',
      'https://sport.tvp.pl/77840539/reprezentacja-polski-siatkarek-pokonala-niemki-jest-wciaz-niepokonana',
      '31 MAY 2024'],
    [202407, 'tvp',
      'Świątek reaches the Olympic singles semi-final',
      'Iga Świątek defeated Danielle Collins in Paris to move within one win of the gold-medal match.',
      'https://sport.tvp.pl/79571679/iga-swiatek-pokonala-danielle-collins-i-awansowala-do-polfinalu-igrzysk-olimpijskich-w-paryzu',
      '31 JUL 2024'],
    [202409, 'tvp',
      'Bartosz Kapustka returns to the Poland squad after eight years',
      'The Legia midfielder earned a national-team recall eight years after his previous appearance.',
      'https://sport.tvp.pl/82589797/bartosz-kapustka-w-reprezentacji-polski-po-8-latach-przerwy-pilkarz-legii-spelnil-marzenie-i-trafil-na-podium',
      '30 SEP 2024'],
    [202410, 'tvp',
      'Majchrzak wins the ATP Challenger in Villena',
      'Kamil Majchrzak defeated Nicolas Moreno de Alboran 6–4, 6–2 to claim the tournament in Spain.',
      'https://sport.tvp.pl/82704492/kamil-majchrzak-wygral-turniej-w-hiszpanii-to-dla-mnie-wielka-sprawa',
      '7 OCT 2024'],
    [202411, 'tvp',
      'Polish mixed relay finishes ninth at the Biathlon World Cup',
      'The national quartet opened the World Cup season with a top-ten result in Kontiolahti.',
      'https://sport.tvp.pl/83760593/ps-w-biathlonie-dziewiate-miejsce-polskiej-sztafety-mieszanej-w-kontiolahti',
      '30 NOV 2024'],
    [202501, 'tvp',
      'Szymon Palka lowers his 1500-metre personal best in Calgary',
      'The Polish speed skater recorded 1:45.68 and finished fourteenth in the World Cup B group.',
      'https://sport.tvp.pl/84681516/szymon-palka-pobil-rekord-zyciowy-na-1500-metrow-zajal-14-miejsce-w-grupie-b-pucharu-swiata-w-calgary',
      '25 JAN 2025'],
    [202502, 'tvp',
      'Bogdanka LUK Lublin reaches the Challenge Cup final',
      'The volleyball club secured its place in the European final during a breakthrough season.',
      'https://sport.tvp.pl/85333768/bogdanka-luk-lublin-awansowala-do-finalu-pucharu-challenge-krzysztof-skubiszewski-o-przedluzeniu-kontraktu-z-wilfredo-leonem',
      '28 FEB 2025'],
    [202504, 'tvp',
      'Świątek beats Madison Keys to reach the Madrid semi-final',
      'The Polish number one won their quarter-final and advanced to the last four of the WTA 1000 tournament.',
      'https://sport.tvp.pl/86460849/wta-madryt-iga-swiatek-pokonala-madison-keys-podsumowanie-meczu-cwiercfinalowego-wideo',
      '30 APR 2025'],
    [202505, 'tvp',
      'Mateusz Cierniak advances to the European speedway final',
      'The Polish rider qualified from the meeting in Stralsund to continue his challenge for the continental title.',
      'https://sport.tvp.pl/87025596/mateusz-cierniak-pojedzie-o-tytul-mistrza-europy-awans-polskiego-zuzlowca-w-stralsund',
      '31 MAY 2025'],
    [202507, 'tvp',
      'Polish volleyball women take Nations League bronze at home',
      'Victory over Japan ended a sixteen-year wait for a senior women’s national-team medal on home soil.',
      'https://sport.tvp.pl/88049182/stefano-lavarini-przerwal-16-letnie-oczekiwanie-naprawde-nie-wiedzialem-tego',
      '28 JUL 2025'],
    [202508, 'tvn',
      'Poland beats Iceland 84–75 at EuroBasket',
      'A third consecutive group victory left the hosts leading their section in Katowice.',
      'https://eurosport.tvn24.pl/koszykowka/eurobasket/2025/polska-islandia_mtc1602848/live.shtml',
      '31 AUG 2025'],
    [202509, 'tvp',
      'Kamil Herzyk breaks Poland’s 51-year-old 3000-metre record',
      'The 21-year-old ran 7:40.22 in Trier to improve the national mark held by Bronisław Malinowski since 1974.',
      'https://sport.tvp.pl/88691462/lekkoatletyka-kamil-herzyk-pobil-rekord-polski-w-biegu-na-3000-metrow-poprawil-rezultat-legendy',
      '2 SEP 2025'],
    [202511, 'tvp',
      'Poland overwhelms Latvia in its socca World Cup opener',
      'The six-a-side national team began its tournament with a convincing victory.',
      'https://sport.tvp.pl/90302295/ms-w-socca-reprezentacja-polski-zdemolowala-lotwe-w-pierwszym-meczu',
      '30 NOV 2025'],
    [202512, 'tvp',
      'Dominika Sztandera breaks the Polish 100-metre breaststroke record',
      'She clocked 1:03.97 at the European short-course championships in Lublin and placed fifth in the final.',
      'https://sport.tvp.pl/90360217/dominika-sztandera-pobila-rekord-polski-podczas-mistrzostw-europy-na-krotkim-basenie-rozgrywanych-w-lublinie-wideo',
      '3 DEC 2025'],
    [202601, 'tvp',
      'Kaja Ziomek-Nogal becomes European speed-skating champion',
      'Her 500-metre gold led a strong Polish medal haul at the championships in Tomaszów Mazowiecki.',
      'https://sport.tvp.pl/90983315/kaja-ziomek-nogal-mistrzynia-europy-worek-medali-dla-polski/amp',
      '10 JAN 2026'],
    [202603, 'tvp',
      'Sweden edges Poland 3–2 in a five-goal contest',
      'Karol Świderski drew Poland level before Viktor Gyökeres scored the decisive goal.',
      'https://sport.tvp.pl/92397345/szwecja-polska-32-viktor-gyokeres-zlamal-polskie-serca-gol',
      '31 MAR 2026'],
    [202604, 'tvp',
      'Jan Zieliński reaches the Madrid doubles semi-final',
      'The Polish doubles specialist advanced to the last four of the ATP Masters tournament.',
      'https://sport.tvp.pl/93009833/turniej-atp-w-madrycie-jan-zielinski-wywalczyl-awans-do-polfinalu-w-rywalizacji-deblistow',
      '30 APR 2026'],
    [202605, 'tvp',
      'Mateusz Żukowski makes his Poland debut',
      'The defender dedicated his first national-team appearance to coach Jacek Magiera.',
      'https://sport.tvp.pl/93572123/mateusz-zukowski-wzruszony-po-debiucie-w-reprezentacji-polski-ten-wystep-dedykuje-trenerowi-magierze',
      '31 MAY 2026'],
    [202607, 'tvp',
      'Poland reaches the Volleyball Nations League semi-final',
      'The national team broke its recent run against Slovenia to move into the last four.',
      'https://sport.tvp.pl/94629847/reprezentacja-polski-siatkarzy-zagra-ze-slowenia-w-polfinale-ligi-narodow-klatwa-zostala-przelamana',
      '31 JUL 2026'],
    [202608, 'tvp',
      'Świątek advances to the fourth round in Toronto',
      'Iga Świątek set up a meeting with Marta Kostyuk at the WTA 1000 tournament.',
      'https://sport.tvp.pl/94737544/kiedy-iga-swiatek-zagra-w-4-rundzie-turnieju-w-toronto-o-ktorej-mecz-z-marta-kostiuk',
      '8 AUG 2026']
  ].forEach(function(report) {
    pressReviewStories[report[0]] = pressReviewStories[report[0]] || {};
    pressReviewStories[report[0]][report[1]] = pressStory(
      report[2], report[3], report[4], report[5]
    );
  });

  // Authored reactions to player-made outcomes. These take precedence over the
  // monthly desk; the generic live story is only the final fallback.
  var pressEventStories = {
    "Biedroń becomes the Left's presidential candidate": {
      rzeczpospolita: pressStory(
        'Robert Biedroń takes the nomination. The Left chooses recognition over ideological peace',
        'The former Słupsk mayor gives Lewica a candidate voters already know. He also inherits a coalition in which Wiosna expects ownership, Razem expects a programme and the old SLD expects control of everything surrounding both.'
      ),
      tvp: pressStory(
        'PiS begins governing as Lewica returns to Robert Biedroń',
        'The governing camp is promising continuity and another term of social programmes. Lewica answers with a familiar liberal-left candidate whose first task will be persuading voters that the alliance represents more than the politics of the largest cities.'
      ),
      tvn: pressStory(
        'Lewica chooses Biedroń. Forty-nine seats now face a presidential test',
        'The nomination ends one argument and begins another: whether an independent Left campaign can enlarge the democratic opposition rather than divide it. KO will watch the transfer arithmetic as closely as Biedroń’s own result.'
      )
    },
    'Zandberg turns the election into a programme fight': {
      rzeczpospolita: pressStory(
        'Zandberg gets his campaign. Lewica will now have to put a price beside every promise',
        'The Razem leader offers discipline, economic clarity and little comfort to the alliance’s inherited apparatus. A candidacy built on housing, wages and public provision will be judged less by applause than by whether the sums survive hostile examination.'
      ),
      tvp: pressStory(
        'Lewica nominates Zandberg and turns left as PiS starts a new term',
        'The opposition candidate promises a larger state and a confrontation over work and housing. PiS will answer that its social transfers already reach the families whom Zandberg is asking to finance another experiment.'
      ),
      tvn: pressStory(
        'Zandberg wins the Left nomination. The campaign gains an argument—and a coalition problem',
        'Lewica has chosen the candidate least likely to disappear inside a KO–PiS contest. Wiosna and SLD must now decide whether they will campaign for a programme that also challenges the economic instincts of the liberal opposition.'
      )
    },
    'The Left opens a presidential primary': {
      rzeczpospolita: pressStory(
        'Lewica cannot choose a candidate, so it asks its members to settle the balance of power',
        'An open ballot may give the eventual nominee legitimacy. It may also turn every disagreement over rules, turnout and endorsements into a public audit of an alliance that has existed for only a few months.'
      ),
      tvp: pressStory(
        'While PiS forms a government, Lewica begins an expensive contest with itself',
        'The Left has postponed its presidential answer and opened a primary between competing organisations. The governing camp enters the new term with a programme; its opponents enter another round of internal campaigning.'
      ),
      tvn: pressStory(
        'A Left primary could produce a real candidate—or six weeks of avoidable damage',
        'Members will get a choice that party leaders could not make for them. The democratic opposition now waits to see whether the ballot creates energy beyond Lewica or merely documents the divisions inside it.'
      )
    },

    'A small newsroom begins to contest the first frame': {
      onet: pressStory(
        'Lewica builds a rapid-response desk. The opposition media war gains another player',
        'Researchers, regional contacts and trained television guests will work from one daily brief. KO figures welcome help against PiS, but privately ask whether the new operation will spend as much time competing with them.'
      ),
      wp: pressStory(
        'A newsroom run for a party: who pays, who edits and what will appear on screen?',
        'Lewica says the unit will verify claims and move local stories into national coverage. It is not an independent publication: its success will depend on whether useful information can travel beyond people already inclined to trust the party.'
      ),
      rzeczpospolita: pressStory(
        'Lewica discovers media infrastructure. A party newsroom remains a party newsroom',
        'Professional preparation may spare candidates the usual improvisation. It cannot purchase credibility, and a rapid-response team built to win each morning risks becoming another machine that mistakes message discipline for reporting.'
      )
    },
    'Subscriptions finance a small Left media operation': {
      onet: pressStory(
        'Lewica asks supporters to fund its own channel—and immediately learns the limits of the list',
        'Recurring payments buy a mailing operation and regular video, not a national newsroom. The party gains an audience it can reach without an editor, while remaining dependent on commercial media whenever it needs anybody else.'
      ),
      wp: pressStory(
        'Ten złoty a month for Left media. The subscriptions add up more slowly than the expectations',
        'Supporters receive direct briefings and campaign clips in exchange for recurring donations. Organisers now have to ask the same people for money, time and votes—and explain which of those requests comes first.'
      ),
      rzeczpospolita: pressStory(
        'A subscriber list is not a press market, but it may be the organisation Lewica lacks',
        'The modest operation gives the party predictable revenue and control over distribution. Its ceiling is equally clear: loyal readers can sustain a niche without making its claims persuasive outside that niche.'
      )
    },
    'The candidate becomes the entire media strategy': {
      onet: pressStory(
        'Every camera now wants the candidate. Lewica has quietly bet the campaign on one face',
        'Bookings rise and regional candidates begin waiting for clips they can repost. A strong performance will look like momentum; one failed interview will travel through an organisation that has built no second voice.'
      ),
      wp: pressStory(
        'One candidate, dozens of interviews and no safety net: Lewica chooses reach over infrastructure',
        'The strategy is cheap, immediate and brutally personal. The campaign can move as quickly as its star, but policy work and local stories disappear whenever the principal performer is somewhere else.'
      ),
      rzeczpospolita: pressStory(
        'Lewica replaces a media strategy with a personality',
        'A recognisable candidate can command attention that no party channel could buy. The arrangement also transfers every mistake, fatigue and private ambition directly onto an alliance whose institutions remain too weak to correct course.'
      )
    },
    "The Left again answers yesterday's story": {
      onet: pressStory(
        'Lewica saves its campaign money and gives its opponents the first draft of every story',
        'The party will continue accepting invitations and issuing corrections after hostile frames are established. KO operatives see one less rival for the morning agenda—and one less partner capable of helping set it.'
      ),
      wp: pressStory(
        'No newsroom, no subscription drive, no star system. Lewica waits for the phone to ring',
        'Resources remain available for the formal campaign. Until then, spokespeople will enter interviews prepared by other producers and discover which controversy they are meant to answer after it has already spread.'
      ),
      rzeczpospolita: pressStory(
        'Lewica declines to build the media operation it says the market denies it',
        'Fiscal caution is defensible for a small party. So is the consequence: an organisation unwilling to finance preparation cannot treat poor coverage as proof that preparation would never have mattered.'
      )
    },

    'The lockdown debate turns toward work and care': {
      tvn: pressStory(
        'Lewica backs restrictions—but only with wages, care and scrutiny attached',
        'The opposition package links public-health rules to sick pay, workplace protection and support for carers. The government must now explain why emergency discipline arrived faster than protection for the people expected to observe it.'
      ),
      republika: pressStory(
        'The Left sees a pandemic and writes a permanent spending programme',
        'PiS is moving emergency support to firms and families while Lewica demands a longer list of guarantees and controls. The virus requires action; it does not make every old socialist proposal newly affordable.'
      ),
      onet: pressStory(
        'Lockdown without a social shield? Lewica puts the people keeping Poland open at the centre',
        'Hospitals, care homes and insecure workplaces become the test of the restrictions rather than an appendix to them. Mayors want usable rules and money now, not another Warsaw promise that arrives after the shift ends.'
      )
    },
    'The Left makes the election calendar a constitutional issue': {
      tvn: pressStory(
        'An emergency without the constitutional emergency: Lewica challenges the May election timetable',
        'The government has closed schools and restricted movement while refusing the legal instrument that would postpone the presidential vote. Lewica is asking the democratic opposition to make that contradiction, not campaign tactics, the common case.'
      ),
      republika: pressStory(
        'Lewica reaches for the constitution while Poland fights the virus',
        'Hospitals and families need decisions, but the opposition has returned immediately to the election calendar. PiS says the state can protect health without handing its opponents an indefinite postponement.'
      ),
      onet: pressStory(
        'Can Poland hold an election in lockdown? The constitutional clock is now the opposition’s strongest case',
        'Lewica has moved the argument from campaign fairness to the legal basis of the emergency. KO mayors blocking an improvised ballot have gained an ally, though households still want an answer about tomorrow’s income.'
      )
    },
    'The opposition lowers its voice as the virus spreads': {
      tvn: pressStory(
        'Lewica offers PiS a temporary truce. Oversight cannot be another casualty',
        'A calmer opposition may help public confidence during the first shock. The unanswered question is what information, committee access and expiry dates the government must provide before national unity becomes silence.'
      ),
      republika: pressStory(
        'At last, responsibility: Lewica backs national unity against the epidemic',
        'The Left has recognised that a virus cannot be defeated by permanent campaign warfare. PiS gains room to act quickly; voters will remember which opposition parties helped when the state required discipline.'
      ),
      onet: pressStory(
        'The shouting stops for a moment. Lewica gives the government room—and takes a risk',
        'A national-unity posture may reassure people watching case numbers rise. It also lets PiS control the briefings, the timetable and the first account of every failure unless the truce comes with enforceable oversight.'
      )
    },
    'The Left enters an anti-lockdown field already owned by Konfederacja': {
      tvn: pressStory(
        'Lewica turns against lockdown and abandons the public-health opposition',
        'The decision puts the party beside a movement already organised around denial and distrust. Civil-liberties questions are real; entering this coalition without a credible health plan hands their loudest answer to Konfederacja.'
      ),
      republika: pressStory(
        'Lewica copies Konfederacja and calls it a defence of freedom',
        'After years of demanding a larger state, the Left has discovered limits when an epidemic requires them. PiS now faces criticism from two sides and responsibility from neither.'
      ),
      onet: pressStory(
        'A stunning turn: Lewica joins the anti-lockdown revolt as hospitals brace for more cases',
        'The party hopes to separate constitutional liberty from conspiracy politics. It enters a field where Konfederacja owns the networks, the slogans and the angry young audience—and where every rise in deaths will carry Lewica’s signature.'
      )
    },

    'The social shield acquires a Left edge': {
      rzeczpospolita: pressStory(
        'Lewica adds workers to the rescue bill—and several permanent obligations to the ledger',
        'The opposition has found the vulnerable point in a firm-centred shield: jobs can be subsidised while employees still lose income and security. Its amendments deserve a hearing; their recurring cost deserves one too.'
      ),
      tvp: pressStory(
        'The government protects jobs as Lewica claims the shield should cover everything',
        'PiS has mobilised unprecedented support during an unprecedented shutdown. The Left backs the restrictions but treats every gap in an emergency programme as proof that only its own, larger programme counts.'
      ),
      tvn: pressStory(
        'Who does the shield protect? Lewica forces workers into the government’s headline numbers',
        'Wage guarantees and protection against dismissal now sit beside aid for balance sheets. The amendments give the democratic opposition a social argument of its own—and the government a choice between accepting it and explaining the omissions.'
      )
    },
    "Local survival becomes the opposition's test": {
      rzeczpospolita: pressStory(
        'Lewica moves the rescue argument from ministries to municipalities',
        'Counties and cities are carrying health, transport and welfare costs while their revenue collapses. A local package may be less dramatic than a national entitlement, but it asks the more practical question: which services can still open on Monday?'
      ),
      tvp: pressStory(
        'Opposition mayors demand another rescue as government aid reaches the country',
        'Lewica has joined local authorities asking Warsaw to replace lost revenue and fund services. PiS says national programmes already protect communities and warns that city halls want cash without common rules.'
      ),
      tvn: pressStory(
        'The crisis reaches city hall. Lewica makes local services the next shield',
        'Buses, clinics and social-assistance offices cannot furlough the people who need them. Opposition-run municipalities now have a parliamentary package—and a test of whether the government’s promises work beyond its own agencies.'
      )
    },
    'Lewica makes private payroll survival its emergency red line': {
      rzeczpospolita: pressStory(
        'Lewica chooses payroll liquidity over a larger public rescue',
        'Direct support for private wages is an unexpectedly market-conscious line from the Left. It may preserve viable firms quickly, but unions will ask why public capacity and employee rights became secondary precisely when bargaining power collapsed.'
      ),
      tvp: pressStory(
        'Lewica discovers employers after the government builds the shield',
        'The opposition now proposes protecting private payrolls with public money while criticising PiS for doing the same through a national programme. The conversion is welcome; the attempt to claim authorship is less convincing.'
      ),
      tvn: pressStory(
        'A pro-business turn from Lewica: save payrolls first, settle the ideological bill later',
        'The proposal aims at speed and may reassure professionals and smaller firms. It also opens a fight inside the Left over whether the emergency should preserve existing employers or build stronger public and worker guarantees around them.'
      )
    },
    'A maximal shield wins applause and a costing attack': {
      rzeczpospolita: pressStory(
        'Lewica promises the complete shield. The missing line is still the total',
        'Income guarantees, public investment and universal support answer almost every constituency touched by the shutdown. They also convert emergency politics into a fiscal commitment whose duration and financing the party has not credibly bounded.'
      ),
      tvp: pressStory(
        'Billions more, no limit named: Lewica turns the crisis into a spending auction',
        'The government is financing hospitals, firms and families under conditions no cabinet planned for. The Left’s answer is to promise every additional demand at once and leave taxpayers to discover the total later.'
      ),
      tvn: pressStory(
        'The biggest opposition shield is also the easiest one to attack',
        'Lewica has assembled a programme broad enough to excite workers, tenants and public services. Unless it publishes priorities and financing quickly, PiS will reduce the whole package to one number and the democratic opposition will keep its distance.'
      )
    },
    'PiS owns both the restrictions and the rescue': {
      rzeczpospolita: pressStory(
        'Lewica leaves the economic field and lets PiS define both emergency and relief',
        'The party has preserved resources and avoided an uncosted promise. It has also accepted the worst position available to an opposition: responsibility for criticism without a recognisable alternative against which government delivery can be judged.'
      ),
      tvp: pressStory(
        'Government acts, Lewica watches: the shield passes without a Left alternative',
        'PiS carries the burden of restrictions and the programme designed to protect jobs and families. Lewica has chosen commentary over responsibility and will now struggle to claim any improvement the rescue produces.'
      ),
      tvn: pressStory(
        'The government owns the shield because Lewica declined to contest it',
        'KO will keep pressing for transparency and local support, but the social opposition has left no proposal of its own on the table. PiS can now present every payment as evidence that only the governing camp understands material security.'
      )
    },

    'The Left works behind a movement it does not own': {
      onet: pressStory(
        'Lewica steps back from the cameras and puts lawyers behind the Women’s Strike',
        'The party is funding safety, legal defence and organisers without demanding its logo at the front. The restraint may build trust that no television appearance can manufacture, though KO figures will still compete to represent the revolt in parliament.'
      ),
      wp: pressStory(
        'No party flags, more lawyers: Lewica chooses the machinery behind the protest',
        'Hotlines, legal teams and safety volunteers are less visible than a leaders’ march. They may matter longer, especially if arrests and employment consequences continue after the largest crowds have gone home.'
      )
    },
    'Party flags fill a movement larger than the party': {
      onet: pressStory(
        'Lewica races to the front of the Women’s Strike—and immediately meets resistance',
        'Party leaders want to convert the revolt into parliamentary power before its energy fades. Organisers who built it without them are asking whether support means a microphone, a logo or the discipline to follow somebody else’s lead.'
      ),
      wp: pressStory(
        'Whose protest is it? Lewica banners spread through crowds that never joined the party',
        'The flags create television recognition and a clear political target. They also let the government describe an autonomous revolt as an opposition campaign, raising the cost for demonstrators who wanted neither label.'
      )
    },
    'The ruling meets a broad constitutional front': {
      onet: pressStory(
        'From the streets to the courts: KO and Lewica build one front against the abortion ruling',
        'The joint line treats reproductive rights and institutional capture as the same crisis. It gives the opposition reach beyond any one party, while leaving activists to ask whether the old compromise will quietly return when leaders negotiate the details.'
      ),
      wp: pressStory(
        'Parties, lawyers and protesters agree on one demand. They do not yet agree what comes after it',
        'The constitutional front can challenge the Tribunal’s authority and protect demonstrations. Restoring a lawful process is only the first question; the abortion law that should emerge from it remains unresolved.'
      )
    },
    'The old guard asks the streets to go home': {
      onet: pressStory(
        'Lewica defends the old abortion compromise as a new generation rejects it',
        'Senior figures are offering de-escalation, Palace access and a return to the settlement destroyed by PiS. The price is a rupture with protesters who no longer regard that settlement as either protection or peace.'
      ),
      wp: pressStory(
        'The Left tells the Women’s Strike to accept yesterday’s compromise. The answer is immediate',
        'Party leaders hope a familiar legal settlement will lower the temperature. Organisers hear a request to abandon the demand that put them in the street, and younger members are deciding which side they belong to.'
      )
    },

    'Lewica trades its votes for recovery-fund safeguards': {
      rzeczpospolita: pressStory(
        'Lewica gives PiS the recovery votes and receives a promise ledger in return',
        'Ratification matters and the negotiated controls are not imaginary. Neither is the political fact: the government secured its majority in a private bargain, while the opposition learned that Lewica’s European solidarity has a bilateral price.'
      ),
      tvp: pressStory(
        'Recovery money above party warfare: PiS and Lewica secure ratification',
        'The government has assembled the votes needed to bring European investment to Poland. Lewica chose concrete safeguards over KO’s demand for opposition discipline and helped prevent a tactical dispute from endangering national recovery.'
      ),
      tvn: pressStory(
        'Lewica rescues PiS on the recovery fund—and insists the receipts will justify it',
        'The safeguards may improve local spending, but the method splits the democratic opposition and hands the government a victory it could not produce alone. Every missed condition will now be charged to the party that accepted the bargain.'
      )
    },
    'The opposition writes one recovery-fund control package and ratifies the law': {
      rzeczpospolita: pressStory(
        'The opposition votes yes together and makes oversight the price of recovery',
        'KO, Lewica and Poland 2050 have avoided both obstruction and a private auction of amendments. The test moves to enforceability: controls celebrated before the money arrives must still survive ministries that did not volunteer for them.'
      ),
      tvp: pressStory(
        'Government wins recovery funds despite an opposition attempt to seize the credit',
        'PiS brought ratification to parliament and will remain responsible for delivery. Opposition parties voted for money Poland needs, then presented routine safeguards as if they had authored the national recovery plan.'
      ),
      tvn: pressStory(
        'One opposition standard, one yes vote: Lewica declines a separate deal with PiS',
        'The democratic parties have shown they can support European recovery without suspending scrutiny. KO gains the unity it demanded; Lewica keeps a social imprint without appearing as the government’s emergency majority.'
      )
    },
    'Lewica abstains and leaves ratification to the recorded PiS–PSL count': {
      rzeczpospolita: pressStory(
        'Lewica abstains on recovery and discovers that arithmetic continues without it',
        'PiS and PSL have supplied the recorded majority. The Left avoided a bilateral bargain and gained no control package in exchange; principled distance is a thin asset when somebody else writes both the law and the conditions.'
      ),
      tvp: pressStory(
        'Recovery funds pass without Lewica as responsible deputies supply the majority',
        'The government has secured ratification despite another opposition attempt to avoid a clear choice. Lewica will benefit from the investment while explaining why it could neither support the law nor stop it.'
      ),
      tvn: pressStory(
        'Lewica refuses the PiS deal, but its abstention produces no common opposition plan',
        'The party avoided becoming the government’s partner and still left KO without the leverage it wanted. PSL’s votes settled the result, turning Lewica’s carefully defended position into an absence from the decisive count.'
      )
    },
    'The President sponsors a recovery-fund control package for a Sejm vote': {
      rzeczpospolita: pressStory(
        'The Palace enters the recovery bargain and changes the coalition geometry',
        'Presidential sponsorship gives a cross-party package institutional weight without replacing the Sejm majority it still needs. The route may unlock ratification; it also creates another centre entitled to claim delivery and police the conditions.'
      ),
      tvp: pressStory(
        'President convenes parties around recovery as opposition abandons obstruction',
        'The Palace has moved the dispute toward a vote and kept European investment above party tactics. PiS remains the government responsible for implementation, even as opposition leaders compete to attach their names to its safeguards.'
      ),
      tvn: pressStory(
        'A presidential route breaks the recovery deadlock—and denies PiS sole ownership',
        'KO, Lewica and the centre can support one control package without entering a private government bargain. The Palace gains credit and responsibility; failure to enforce the safeguards will now implicate more than the cabinet.'
      )
    },

    'The Left proposes a lawful border operation': {
      tvn: pressStory(
        'Security, asylum and cameras at the frontier: Lewica offers one border plan',
        'The proposal accepts the operation organised by Minsk without accepting an exclusion zone beyond law. Screening, medical teams and monitored press access give the democratic opposition an answer that is harder to caricature as an open border.'
      ),
      republika: pressStory(
        'Lewica discovers border control—and brings activists and cameras with it',
        'PiS says the state is already stopping a hostile operation. The Left’s plan adds outside monitors and asylum access at the moment officers need a clear command, turning operational security into another opposition seminar.'
      ),
      onet: pressStory(
        'A guarded border without a lawless zone: the opposition finally has an operating plan',
        'Lewica has joined security screening to humanitarian access and invited KO, PSL and Poland 2050 to defend the details. The government must now answer a proposal rather than the easier accusation that its critics deny the threat.'
      )
    },
    'Rights organisations gain an unqualified parliamentary ally': {
      tvn: pressStory(
        'Lewica makes access to asylum the red line at the Belarus frontier',
        'Lawyers, medics and families gain a party willing to document every pushback. The principled stand also leaves a gap on operational control that PiS will fill immediately unless the Left can answer the fears of border communities.'
      ),
      republika: pressStory(
        'Lewica chooses the activists over the officers defending Poland’s border',
        'The Left demands wider access to a zone targeted by Lukashenko’s services and says law must come before deterrence. PiS answers that a state unable to control entry will soon lose the ability to protect anybody inside.'
      ),
      onet: pressStory(
        'Inside the exclusion zone, aid groups finally gain an ally with Sejm votes',
        'Lewica will carry testimony, pushbacks and blocked medical access into parliament without qualification. Liberal opposition figures welcome the scrutiny and worry that the party has left the security half of the argument unanswered.'
      )
    },
    'The Left gives security priority at the border': {
      tvn: pressStory(
        'Lewica backs the emergency and postpones scrutiny until after the damage can be done',
        'The party says Lukashenko’s operation requires unity and a secure frontier. Journalists and aid groups remain outside, while progressive MPs ask why rights deferred during an emergency should be expected to return on the government’s timetable.'
      ),
      republika: pressStory(
        'A common front at the border: Lewica supports the state of emergency',
        'Even the Left has recognised that sovereignty begins with control of the frontier. PiS welcomes the votes and rejects the demand that officers defend each operational decision in real time to politicians far from the line.'
      ),
      onet: pressStory(
        'Lewica chooses security first. Its own activists call “later scrutiny” an empty promise',
        'The decision may reassure border communities and reduce an immediate opposition split. It also grants PiS the exclusion zone it wanted and asks people pushed back tonight to wait for a committee that does not yet exist.'
      )
    },
    'The border argument proceeds without a Left frame': {
      tvn: pressStory(
        'Lewica leaves the border response to KO—and escapes neither side of the argument',
        'The party avoided choosing between security and humanitarian access. KO becomes the principal democratic critic, while PiS and Konfederacja define strength and aid groups look elsewhere for an unqualified parliamentary advocate.'
      ),
      republika: pressStory(
        'No answer from Lewica as Poland faces pressure at the frontier',
        'The Left has delegated its position to the liberal opposition rather than tell voters whether the border should be controlled. PiS will continue the operation; silence cannot be mistaken for responsibility.'
      ),
      onet: pressStory(
        'The border crisis forces every party to choose. Lewica chooses not to',
        'Deferring to KO preserves fragile internal peace but gives away the month’s defining issue. Neither officers nor humanitarian organisations can identify the Left’s demand, and both sides of the coalition notice the absence.'
      )
    },

    'The Left joins defence solidarity without accepting austerity': {
      rzeczpospolita: pressStory(
        'Lewica backs arms for Ukraine and puts a domestic invoice beside every vote',
        'The party has joined the strategic consensus without offering the government a blank cheque. A shield for households and public services is defensible; it must not become a device for treating every pre-war spending demand as a security cost.'
      ),
      tvp: pressStory(
        'Parliament unites behind Ukraine as Lewica adds conditions at home',
        'PiS welcomes support for weapons, sanctions and allied reinforcement. The Left’s social shield can be discussed without weakening the clear first duty: helping Ukraine resist Russia and protecting Poland’s eastern flank.'
      )
    },
    "Humanitarian solidarity becomes the Left's war policy": {
      rzeczpospolita: pressStory(
        'Lewica chooses refugees and diplomacy while Ukraine asks for weapons',
        'Civilian protection is indispensable and Polish municipalities will need sustained support. It is not an answer to the armoured columns moving toward Kyiv, and a party separating relief from Ukrainian self-defence is avoiding the central fact of the war.'
      ),
      tvp: pressStory(
        'Aid without arms: Lewica breaks from Poland’s security consensus',
        'The government is opening the border to refugees while sending Ukraine the means to defend its cities. The Left supports the first task and retreats from the second, leaving Kyiv with sympathy where it asked Warsaw for material help.'
      )
    },
    'The opposition suspends hostilities over Ukraine': {
      rzeczpospolita: pressStory(
        'A necessary truce gives the government necessary power—and a future accounting',
        'Parliamentary unity strengthens Poland’s answer in the first days of invasion. It also concentrates intelligence, procurement and patriotic credit inside the cabinet; today’s urgency cannot cancel tomorrow’s obligation to disclose how that authority was used.'
      ),
      tvp: pressStory(
        'One Polish answer to Russian aggression: opposition joins the government and President',
        'Party leaders have backed arms, sanctions and allied reinforcement without turning the first days of war into another domestic contest. The common mandate tells Kyiv, Moscow and NATO that Poland’s commitment will survive parliamentary division.'
      )
    },
    'Neutrality isolates the Left inside the opposition': {
      rzeczpospolita: pressStory(
        'Lewica declares neutrality in a war whose refugees are already crossing into Poland',
        'Negotiations and humanitarian relief do not require pretending that arms delivered to the invaded state cause the invasion. The party has placed itself outside the national consensus and outside the regional solidarity claimed by much of its own left.'
      ),
      tvp: pressStory(
        'Lewica refuses arms for Ukraine as Poland mobilises support',
        'PiS, the President and the democratic opposition have agreed that Ukraine must be able to defend itself. The Left’s neutrality leaves it sharing a slogan with anti-system voices while Ukrainian families cross the border that disproves its distance.'
      )
    },

    "The Left refuses to become a current inside Tusk's list": {
      rzeczpospolita: pressStory(
        'Lewica rejects Tusk’s single list and accepts the arithmetic of independence',
        'A separate committee preserves programme, subsidy and candidate control. It also makes the threshold a permanent participant in every campaign meeting; identity will be valuable only if enough voters can still find it on election night.'
      ),
      tvp: pressStory(
        'The opposition cannot unite: Lewica rejects Tusk’s common list',
        'KO’s attempt to assemble one anti-PiS bloc has met the interests of another party apparatus. PiS enters the coming campaign against several rivals who agree on removing the government and not on who should replace it.'
      ),
      tvn: pressStory(
        'Lewica says no to one list. Now it must prove independence is more than a logo',
        'The Left has protected its name and its economic argument from absorption by KO. The democratic opposition will judge the decision by a harsher standard: whether the separate campaign brings new voters or merely divides familiar ones.'
      )
    },
    'One opposition list becomes a live negotiation': {
      rzeczpospolita: pressStory(
        'Lewica accepts Tusk’s premise before negotiating Tusk’s terms',
        'The common-list logic may reduce wasted votes and clarify the contest with PiS. It also places KO at the head of the table and turns every Left demand over programme, districts and subsidy into a possible explanation for failed unity.'
      ),
      tvp: pressStory(
        'Tusk gathers the opposition under one banner with no common programme beneath it',
        'Lewica has accepted negotiations over a shared list despite profound differences on spending, culture and leadership. PiS says the project has one binding idea: returning Donald Tusk to power.'
      ),
      tvn: pressStory(
        'The single-list door opens. Lewica enters before the difficult terms are written',
        'KO gains the direction of travel it wanted and the Left keeps a place at the negotiating table. Candidate order, social guarantees and the party name can still break the talks, but they can no longer be dismissed as a hypothetical dispute.'
      )
    },
    'The Left turns one-list rhetoric into written conditions': {
      rzeczpospolita: pressStory(
        'Lewica sends Tusk a contract instead of another unity photograph',
        'A social floor, Senate coordination, winnable places and subsidy rules make the proposed alliance legible. The document may protect a smaller partner; it may equally provide KO with a precise list of reasons to say the price is too high.'
      ),
      tvp: pressStory(
        'Posts, money and guarantees: Lewica publishes its price for Tusk’s list',
        'The opposition describes the talks as a democratic duty until candidate places and public subsidy reach the page. PiS says the written terms reveal a coalition organised around division of power before voters have cast a ballot.'
      ),
      tvn: pressStory(
        'No blank cheque for unity: Lewica gives KO four conditions for a common list',
        'The demands force both parties beyond moral appeals and into the mechanics that decide whether cooperation survives. A transparent bargain could strengthen the democratic front; a maximal one could end it before formal talks begin.'
      )
    },
    'Lewica asks Kaczyński for winnable places on the PiS list': {
      rzeczpospolita: pressStory(
        'Lewica seeks shelter on the PiS list and puts its remaining identity up for negotiation',
        'Winnable places may preserve MPs, but the host controls nominations, subsidy and the governing record carried onto the ballot. The arrangement would not be a tactical vote; it would reorganise Poland’s party system around a social-statist bloc.'
      ),
      tvp: pressStory(
        'A broader social camp? PiS opens its candidate books to Lewica talks',
        'The Left has recognised that family policy and economic security can matter more than the liberal opposition’s permanent culture war. Any agreement will require loyalty to the governing programme and respect for the voters who gave PiS the mandate.'
      ),
      tvn: pressStory(
        'Lewica asks for places on Kaczyński’s list. The democratic opposition calls it a crossing',
        'A parliamentary bargain has become an electoral negotiation under PiS control. KO will now describe every Left criticism of government as an internal dispute, while Razem and progressive organisers decide whether to leave before the ballot is filed.'
      )
    },
    'Lewica prices PiS list talks with a written social and candidate compact': {
      rzeczpospolita: pressStory(
        'Lewica writes conditions for a PiS alliance that can no longer be called temporary',
        'Candidate quotas, free votes and a social chapter would limit host-party control without removing it. The document clarifies the bargain and therefore its scale: this is an attempt to build an electoral bloc, not merely pass one disputed law.'
      ),
      tvp: pressStory(
        'Lewica offers terms for joining the governing list',
        'PiS will consider social commitments and candidates who respect the coalition’s mandate. It will not surrender control of its own list to a smaller party seeking both safe seats and public distance from decisions it helped enact.'
      ),
      tvn: pressStory(
        'A quota, a programme and free votes: Lewica tries to make a PiS list defensible',
        'Putting the price in writing prevents leaders from hiding behind tactical language. It does not answer the democratic opposition’s central charge: candidates elected from Kaczyński’s list would owe their places and subsidy to Kaczyński’s party.'
      )
    },
    "Lewica rejects both Tusk's front and Kaczyński's host list": {
      rzeczpospolita: pressStory(
        'Lewica refuses both large hosts and chooses the threshold on its own terms',
        'The independent route restores a coherent name after flirtation with two incompatible blocs. It also removes every external guarantee: the party must finance, staff and clear the election without blaming either host for the final arithmetic.'
      ),
      tvp: pressStory(
        'Lewica walks away from PiS talks and Tusk’s list alike',
        'The party has chosen isolation over a broader governing or opposition camp. Voters will decide whether this is principle or an attempt to preserve an apparatus that wanted guarantees from both sides and accepted responsibility from neither.'
      ),
      tvn: pressStory(
        'Neither Tusk nor Kaczyński: Lewica attempts to rebuild an independent campaign',
        'The decision ends a damaging ambiguity and gives activists a common ballot project. It also leaves the democratic opposition without certainty over coordination and the Left without protection if tactical voting accelerates.'
      )
    },

    'The Left contests Konfederacja on who pays for insecurity': {
      onet: pressStory(
        'Lewica goes after Konfederacja’s tax revolt with one question: what disappears next?',
        'The campaign puts schools, hospitals, rent and wages beside promises of radical tax cuts. It is a direct bid for younger and insecure voters who dislike the establishment but still expect the state to work when they need it.'
      ),
      wp: pressStory(
        'Lower taxes, weaker services? Lewica calculates the other side of Konfederacja’s offer',
        'The argument shifts from outrage to household arithmetic: which payments fall, which services shrink and who covers the difference. Konfederacja will answer that voters spend their own money better than any ministry.'
      ),
      rzeczpospolita: pressStory(
        'Lewica answers the tax-cut right with universal security—and avoids the reform question',
        'Public services do insure households against risks markets price badly. That does not prove every current programme is efficient, and defending the state as it exists may leave Konfederacja alone in speaking to voters angry at how it works.'
      )
    },
    'Competence becomes the common opposition answer': {
      onet: pressStory(
        'KO and Lewica agree: make the election a test of whether the state works',
        'The common line moves away from competing promises and toward the government’s record on prices, procurement and institutions. Lewica gains a route into the democratic campaign but risks becoming the social appendix to KO’s competence brand.'
      ),
      wp: pressStory(
        'One opposition word for the summer: competence. Will it stop Konfederacja’s rise?',
        'KO and Lewica are asking voters to compare administration rather than anger. The message is safe and broad; its weakness is that anti-system voters already regard the people delivering it as the system they want to punish.'
      ),
      rzeczpospolita: pressStory(
        'The opposition promises competent government, the minimum offer of any opposition',
        'Administrative repair is necessary after years of politicisation and error. It is not yet a programme, and cooperation around the word postpones every argument over taxes, spending and authority that a future coalition would have to settle.'
      )
    },
    'Every party is asked whether it would govern with Konfederacja': {
      onet: pressStory(
        'The question that follows every candidate now: would you govern with Konfederacja?',
        'Lewica wants a democratic cordon stated before tactical ambiguity becomes a coalition option. KO agrees easily; PSL resists surrendering future arithmetic, and Konfederacja welcomes another chance to present itself as the party everyone fears.'
      ),
      wp: pressStory(
        'Yes or no: Lewica turns one coalition question into an election test',
        'Candidates will be pressed to rule out governing with Konfederacja before the seat count exists. Clear answers may help tactical voters, but every refusal also reinforces the radical right’s claim that established parties form one closed club.'
      ),
      rzeczpospolita: pressStory(
        'A cordon before the count gives Konfederacja the exclusion story it wants',
        'Parties are entitled to define coalition limits, especially on constitutional questions. Turning that limit into the campaign’s organising test substitutes moral classification for an argument capable of winning back the voters behind it.'
      )
    },
    'The Left follows the right onto its chosen ground': {
      onet: pressStory(
        'Lewica answers Konfederacja with stricter borders and tax relief. Its own party recoils',
        'The campaign is chasing younger and socially conservative voters through the issues on which the right already has credibility. Any short-term gain will be measured against activists and minorities now asking what remains distinctively Left.'
      ),
      wp: pressStory(
        'Smaller taxes, harder borders: Lewica makes its sharpest turn of the campaign',
        'Leaders call the package an answer to material and security fears. Critics see imitation without ownership: voters attracted to the message already have right-wing parties, while existing supporters did not ask Lewica to become one.'
      ),
      rzeczpospolita: pressStory(
        'Lewica borrows the right’s programme and discovers that positioning is not credibility',
        'Border enforcement and relief for small firms are legitimate subjects, not ideological property. A late conversion designed around a rival’s polling surge will nevertheless be judged as tactics unless it rests on a longer record than this campaign can supply.'
      )
    },

    'The Left follows contracts, names and consular files': {
      tvn: pressStory(
        'Lewica follows the visa money past one dismissed deputy minister',
        'Contracts, intermediaries and consular posts are being assembled into a chain of responsibility that reaches beyond Piotr Wawrzyk. The inquiry denies PiS an easy ending in which one resignation closes a system supervised by the Foreign Ministry.'
      ),
      republika: pressStory(
        'Lewica turns the visa affair into another prosecution file while the border question remains',
        'Any official who sold access must answer for it. The Left nevertheless refuses the question voters are asking: how many people entered, under what rules and whether the state can still control the process.'
      ),
      onet: pressStory(
        'Names, contracts, consulates: Lewica publishes the map PiS hoped would end with Wawrzyk',
        'The party is resisting the easiest migration slogan and following who signed, paid and supervised. That makes for slower campaign television—and a record capable of surviving after the election posters disappear.'
      )
    },
    "A lawful border doctrine replaces the opposition's slogan auction": {
      tvn: pressStory(
        'After the visa scandal, Lewica proposes a migration system the state can actually audit',
        'Staffing, eligibility, labour inspection and published routes sit beside the corruption inquiry. The proposal gives the democratic opposition an administrative answer instead of another competition over who can sound least welcoming.'
      ),
      republika: pressStory(
        'Lewica answers corrupt visas with a plan for more orderly visas',
        'The Left promises better staffing and transparent rules, but its conclusion remains that migration should continue under a larger administration. PiS says the first obligation is to close the channel that officials abused.'
      ),
      onet: pressStory(
        'A visa without a broker: the Left turns scandal into a plan for lawful entry',
        'Applicants would receive published rules while consulates gain staff and audit duties. It is less explosive than accusing PiS of hypocrisy and more useful to every honest official and family trapped behind the scandal.'
      )
    },
    "The opposition scandal message adopts the right's premise": {
      tvn: pressStory(
        'Lewica attacks PiS for “importing migrants” and validates the campaign it meant to expose',
        'The hypocrisy charge is immediate and effective: officials sold access while their party manufactured fear. It also tells lawful migrants that they are the scandal, allowing Konfederacja to repeat the accusation without the word corruption.'
      ),
      republika: pressStory(
        'PiS preached border control while officials sold visas. Even Lewica can see the betrayal',
        'The Left has finally admitted that entry numbers and enforcement matter. It cannot erase years of progressive migration politics by borrowing the right’s charge in the final weeks of a campaign.'
      ),
      onet: pressStory(
        'The visa attack that may haunt Lewica: “PiS brought in the people it told you to fear”',
        'The line cuts through the government’s strongest campaign claim. It cuts through immigrant neighbours too, turning people with lawful lives in Poland into evidence before the party has established who actually profited.'
      )
    },

    'The opposition turns ballot refusal into one common instruction': {
      tvn: pressStory(
        'One election, two papers: the democratic opposition tells voters to refuse the referendum ballot',
        'KO, Lewica and Third Way have settled on the only tactic that can deny PiS a binding result without depressing the parliamentary vote. Thousands of commission members must now understand the procedure well enough to record refusal correctly.'
      ),
      republika: pressStory(
        'The opposition fears four questions and orders its voters not to answer',
        'Poles are being asked about state assets, retirement, the border and relocation. Lewica and KO prefer a procedural boycott because an honest national answer would expose how far their programme stands from the majority.'
      ),
      onet: pressStory(
        'Take one ballot, refuse the other: the opposition’s October instruction in plain language',
        'The tactic can keep the referendum below its binding threshold while preserving election turnout. It also forces canvassers to spend the closing month teaching paperwork when they would rather be talking about government.'
      )
    },
    'The Left answers the referendum instead of refusing it': {
      tvn: pressStory(
        'Lewica breaks with the boycott and risks making PiS’s referendum binding',
        'The party wants to contest retirement age, privatisation and the border on substance. KO warns that every accepted ballot helps a state-funded campaign cross the threshold, whatever answers the voter finally marks.'
      ),
      republika: pressStory(
        'Lewica will answer the referendum. The opposition’s boycott begins to crack',
        'The Left has recognised that voters deserve positions on questions affecting national property, pensions and security. Its answers will differ from PiS; at least they will be answers rather than an instruction to look away.'
      ),
      onet: pressStory(
        'Four questions, four answers and one furious opposition: Lewica rejects the boycott',
        'Campaigning on the substance may recover issues the Left once owned, especially pensions. The price is mathematical: participation can legitimise wording written by PiS and help the result acquire legal force.'
      )
    },
    'Refusal is paired with four questions the government refuses to ask': {
      tvn: pressStory(
        'Lewica refuses the PiS ballot and prints its own questions about rents, hospitals and work',
        'The counter-campaign preserves the opposition’s turnout tactic while giving Left canvassers something material to discuss. Its questions have no legal force; that may be precisely why they sound less manipulated than the official four.'
      ),
      republika: pressStory(
        'Lewica invents a private referendum after telling voters to reject the legal one',
        'The party wants the publicity of national questions without accepting the answers to those ordered by parliament. Cards about rents and hospitals cannot disguise a boycott of borders, relocation and national property.'
      ),
      onet: pressStory(
        'Refuse this paper, read that card: Lewica’s complicated plan has four surprisingly simple questions',
        'Voters are asked to decline the official referendum and consider waiting times, rent, contracts and energy bills instead. The message is harder to explain at the door but gives the last campaign weeks a life beyond PiS’s wording.'
      )
    },
    "The referendum's public funding becomes an electoral-commission file": {
      tvn: pressStory(
        'Lewica follows referendum spending into the electoral commission',
        'Ministerial tours, state-company sponsorship and public-media promotion are being filed as campaign benefits outside the PiS account. No ruling will arrive before polling day, but the party subsidy may eventually depend on the record opened now.'
      ),
      republika: pressStory(
        'Unable to win the referendum argument, Lewica asks officials to police the campaign',
        'Government ministers are entitled to explain a lawful national vote. The Left is constructing a future subsidy dispute from public appearances because it cannot persuade voters to oppose the questions themselves.'
      ),
      onet: pressStory(
        'The bill for PiS’s referendum campaign may arrive a year after the election',
        'Lewica has sent state-funded appearances and advertising to the electoral commission. The remedy is slow enough to change nothing in October and serious enough to threaten party money when the audit finally closes.'
      )
    },
    'The audit chamber is asked what the referendum campaign is costing the state': {
      tvn: pressStory(
        'Who paid for the referendum campaign? The audit trail begins before voting day',
        'The Supreme Audit Office can reach ministry budgets, state-company invoices and public-media hours that parliamentary questions cannot. Its answer will arrive late, but with documents the governing campaign cannot dismiss as opposition rhetoric.'
      ),
      republika: pressStory(
        'Lewica sends the national referendum to an audit chief it once wanted removed',
        'The opposition hopes a future report will recast lawful public information as party expenditure. Voters will answer in October; auditors should not become a substitute electorate months later.'
      ),
      onet: pressStory(
        'A referral with a long fuse: auditors will count every public złoty behind the referendum',
        'The filing cannot change the ballot or stop the ministerial tour. It can establish who authorised each expense, leaving the electoral commission a statutory record rather than a stack of campaign accusations.'
      )
    },

    'The Left demands a rule against election pricing in state companies': {
      tvn: pressStory(
        'Cheap fuel before the vote, a governance rule after it: Lewica targets Orlen’s political switch',
        'The proposal would force boards and supervising ministers to disclose exceptional pricing and its cost. It attacks the mechanism rather than asking drivers to resent a lower bill—a harder campaign message and a more durable one.'
      ),
      republika: pressStory(
        'Lewica wants another rule for Orlen because drivers are paying less',
        'The state refiner says its prices are commercial and PiS points to relief for households. The Left sees affordable fuel and reaches first for reporting duties, supervisors and a new political accusation.'
      ),
      onet: pressStory(
        'Who ordered the price below six złoty? Lewica wants the answer written into law',
        'Board decisions, margins and ministerial recommendations would have to be disclosed when a state company moves prices during a campaign. The rule is designed for this election—and for the next government tempted by the same lever.'
      )
    },
    'The opposition promises the price rise arrives the week after the election': {
      tvn: pressStory(
        '“Fill the tank now”: the opposition predicts Orlen’s election price will vanish in November',
        'The attack is simple enough to cross every party line and avoids endorsing the mechanism behind the discount. It also reduces a state-company governance scandal to a forecast that voters may forgive if cheap fuel lasts a little longer.'
      ),
      republika: pressStory(
        'The opposition cannot bear cheaper fuel, so it promises a price rise',
        'Drivers are saving money while KO and Lewica insist the benefit must be manipulation. PiS says its opponents have revealed the household economy they expect to deliver after taking power.'
      ),
      onet: pressStory(
        'Will fuel jump after 15 October? The opposition bets its easiest attack on one price board',
        'The line is travelling faster than any explanation of refinery margins. If prices rise, it will look prophetic; if supplies tighten first, the more important story may be what the discount has already done to distribution.'
      )
    },
    'Empty pumps and late tankers are documented station by station': {
      tvn: pressStory(
        'The cheap-fuel campaign reaches empty pumps. Station managers bring the receipts',
        'Delivery notices, rationing and late tankers are turning an argument over motive into evidence of supply failure. Independent operators can show what political pricing did without asking customers to object to paying less.'
      ),
      republika: pressStory(
        'Opposition photographs empty pumps and declares a national Orlen crisis',
        'Temporary delivery problems are being assembled into a campaign case by parties unable to attack the low price directly. The company says supply continues; Lewica says each station now has a dated record.'
      ),
      onet: pressStory(
        'Map: the stations rationing fuel as Orlen insists the system is working',
        'Managers and hauliers are sharing allocation letters, missed deliveries and empty-tank photographs. The crowdsourced file follows the shortage town by town and gives a later inquiry evidence beyond rival press conferences.'
      )
    },
    "Auditors are sent after the refinery's margin, not its pump price": {
      tvn: pressStory(
        'Auditors seek Orlen board papers behind the pre-election fuel discount',
        'The referral asks who approved the margin, what the Treasury ministry knew and how supply risks were assessed. It will not change today’s price; it may establish whether a public company absorbed a political campaign cost.'
      ),
      republika: pressStory(
        'Lewica calls auditors after Orlen for making fuel affordable',
        'The opposition has failed to convince drivers that a lower price is a scandal and now wants confidential board papers. Orlen says commercial decisions belong to management, not parties shopping for a post-election case.'
      ),
      onet: pressStory(
        'Not the number on the sign—the margin behind it: Orlen faces an audit referral',
        'Board minutes and ministry correspondence may reveal whether the discount was sustainable, ordered or merely convenient. The finding will arrive after the vote, when a new cabinet may control the same tempting instrument.'
      )
    },

    'The Left asks who is commanding the eastern flank on Sunday': {
      onet: pressStory(
        'Two generals resign five days before voting. Lewica asks one question the ministry has not answered',
        'Who holds operational command until successors are appointed? The party is keeping the officers out of its closing rallies and demanding a named chain of responsibility before Poland votes beside a war.'
      ),
      wp: pressStory(
        'Who commands now? The dates, offices and vacancy after two military resignations',
        'The Constitution leaves civilian authority intact, but the operational handover still requires names and orders. Lewica wants the ministry and Palace to publish them before election Sunday.'
      )
    },
    "The command crisis becomes the opposition's last campaign argument": {
      onet: pressStory(
        'The generals walk out and the opposition puts their resignations in its final campaign speech',
        'Lewica calls the departures the endpoint of eight years of politicised defence management. The attack may move late voters; serving officers will remember that their command crisis was converted into a partisan closing line.'
      ),
      wp: pressStory(
        'Five days, two resignations, one final attack on government competence',
        'The opposition says the people expected to run a war have lost confidence in the ministry. No general has endorsed that campaign conclusion, and neither can publicly correct it without entering the election himself.'
      )
    },
    'Palace and ministry publish a joint command-continuity statement': {
      onet: pressStory(
        'A rare joint statement names the command chain after the generals resign',
        'The Palace and Defence Ministry have set out who exercises authority until permanent successors are appointed. Lewica sacrificed an obvious campaign attack to broker the answer allies and officers wanted before polling day.'
      ),
      wp: pressStory(
        'The command vacancy has a temporary answer. Here is who holds each responsibility',
        'A joint Palace–ministry document establishes operational continuity and an appointment timetable. Voters may barely notice; military staffs and eastern-flank partners were waiting for exactly this information.'
      )
    },
    'Three opposition caucuses sign one demand on the command vacancy': {
      onet: pressStory(
        'Three opposition parties put one security demand above their final campaign quarrels',
        'KO, Lewica and the centre want a named successor, a written handover and a briefing on the eastern flank. The joint paper is harder for PiS to dismiss as one party exploiting the generals’ resignations.'
      ),
      wp: pressStory(
        'One page, three signatures, four questions after the military command resigns',
        'The opposition security committee has published a common request on continuity and appointments. It does not answer why the generals left; it establishes what the state must clarify before election day.'
      )
    }
  };

  var pressEventIssues = {
    'The lockdown debate turns toward work and care': 'vaccination',
    'The Left makes the election calendar a constitutional issue': 'vaccination',
    'The opposition lowers its voice as the virus spreads': 'vaccination',
    'The Left enters an anti-lockdown field already owned by Konfederacja': 'vaccination',
    'The social shield acquires a Left edge': 'social_spending',
    "Local survival becomes the opposition's test": 'social_spending',
    'Lewica makes private payroll survival its emergency red line': 'social_spending',
    'A maximal shield wins applause and a costing attack': 'social_spending',
    'PiS owns both the restrictions and the rescue': 'social_spending',
    'The Left works behind a movement it does not own': 'abortion_rights',
    'Party flags fill a movement larger than the party': 'abortion_rights',
    'The ruling meets a broad constitutional front': 'abortion_rights',
    'The old guard asks the streets to go home': 'abortion_rights',
    'The Left proposes a lawful border operation': 'border_security',
    'Rights organisations gain an unqualified parliamentary ally': 'refugee_solidarity',
    'The Left gives security priority at the border': 'border_security',
    'The border argument proceeds without a Left frame': 'border_security',
    'The Left joins defence solidarity without accepting austerity': 'national_security',
    "Humanitarian solidarity becomes the Left's war policy": 'refugee_solidarity',
    'The opposition suspends hostilities over Ukraine': 'national_security',
    'Neutrality isolates the Left inside the opposition': 'national_security',
    'The Left contests Konfederacja on who pays for insecurity': 'social_spending',
    'The Left follows the right onto its chosen ground': 'border_security',
    'The Left follows contracts, names and consular files': 'rule_of_law',
    "A lawful border doctrine replaces the opposition's slogan auction": 'border_security',
    "The opposition scandal message adopts the right's premise": 'refugee_solidarity',
    'The opposition turns ballot refusal into one common instruction': 'rule_of_law',
    'The Left answers the referendum instead of refusing it': 'rule_of_law',
    'Refusal is paired with four questions the government refuses to ask': 'rule_of_law',
    "The referendum's public funding becomes an electoral-commission file": 'rule_of_law',
    'The audit chamber is asked what the referendum campaign is costing the state': 'rule_of_law',
    'The Left demands a rule against election pricing in state companies': 'rule_of_law',
    'The opposition promises the price rise arrives the week after the election': 'social_spending',
    'Empty pumps and late tankers are documented station by station': 'social_spending',
    "Auditors are sent after the refinery's margin, not its pump price": 'rule_of_law',
    'The Left asks who is commanding the eastern flank on Sunday': 'national_security',
    "The command crisis becomes the opposition's last campaign argument": 'national_security',
    'Palace and ministry publish a joint command-continuity statement': 'national_security',
    'Three opposition caucuses sign one demand on the command vacancy': 'national_security'
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

  var pressIssueLabels = {
    abortion_rights: 'abortion rights',
    refugee_solidarity: 'refugees and asylum',
    border_security: 'security at the eastern border',
    vaccination: 'vaccination and public health',
    social_spending: 'social spending and public services',
    lgbt_equality: 'LGBT equality',
    secular_state: 'the secular state and schools',
    rule_of_law: 'repairing the rule of law',
    national_security: 'defence and allied security'
  };

  var pressPublicMood = function(qualities, selectedIssue) {
    var hottest = pressIssueLabels[selectedIssue] ? selectedIssue :
      'social_spending';
    var hottestHeat = -1;
    if (!pressIssueLabels[selectedIssue]) Object.keys(pressIssueLabels).forEach(function(issue) {
      var salience = Number(qualities[issue + '_salience']);
      var backlash = Number(qualities[issue + '_backlash']);
      salience = Number.isFinite(salience) ? salience : 0;
      backlash = Number.isFinite(backlash) ? backlash : 0;
      var heat = salience * 0.65 + backlash * 0.35;
      if (heat > hottestHeat) {
        hottest = issue;
        hottestHeat = heat;
      }
    });
    var support = Number(qualities[hottest + '_support']);
    return {
      issue: hottest,
      label: pressIssueLabels[hottest],
      support: Number.isFinite(support) ? support : 50,
      salience: Number(qualities[hottest + '_salience']) || 0,
      backlash: Number(qualities[hottest + '_backlash']) || 0
    };
  };

  var pressRelevantIssue = function(story, qualities) {
    var event = String(qualities.news_headline || '');
    if (Object.prototype.hasOwnProperty.call(pressEventStories, event)) {
      return pressEventIssues[event] || '';
    }
    var copy = ((story && story.headline) || '') + ' ' +
      ((story && story.text) || '') + ' ' + (qualities.news_headline || '');
    copy = copy.toLowerCase();
    var subjects = {
      abortion_rights: /abort|pregnan|women.s strike|tribunal ruling/,
      refugee_solidarity: /refuge|asylum|humanitarian|migrant/,
      border_security: /border|frontier|lukashenko|belarus/,
      vaccination: /vaccin|pandemic|hospital|health|virus|covid/,
      social_spending: /budget|spending|wage|pension|housing|welfare|tax|worker|public service/,
      lgbt_equality: /lgbt|equality|same.sex|marriage/,
      secular_state: /church|religio|secular|clergy/,
      rule_of_law: /court|judge|judicial|constitution|rule of law|tribunal/,
      national_security: /defen|army|military|nato|ukraine|security/
    };
    return Object.keys(subjects).find(function(issue) {
      return subjects[issue].test(copy);
    }) || '';
  };

  var pressGovernmentParty = function(qualities) {
    return qualities.government_party === 'pis' ? 'pis' :
      (qualities.government_party === 'lewica' ? 'left' : 'ko');
  };

  var pressVoice = function(outlet, qualities) {
    var patron = pressPatronParty(outlet, qualities);
    var government = pressGovernmentParty(qualities);
    if (outlet.id === 'rownosc') {
      return 'pro-left';
    }
    if (outlet.id === 'wp') {
      return 'neutral';
    }
    if (outlet.id === 'rzeczpospolita') {
      return 'anti-left';
    }
    if (outlet.id === 'kanal-zero') {
      return 'anti-establishment';
    }
    if (patron === government) {
      return 'pro-government';
    }
    if (patron === 'ko') {
      return Number(qualities.ko_relation) >= 40 ? 'neutral-left' :
        'anti-government';
    }
    return patron === 'left' ? 'pro-left' : 'anti-government';
  };

  var pressSection = function(outlet) {
    return {
      onet: 'WIADOMOŚCI',
      wp: 'POLITYKA',
      rzeczpospolita: 'ANALIZA',
      'kanal-zero': 'PROGRAM DNIA',
      rownosc: 'SPOŁECZEŃSTWO',
      tvp: 'KRAJ',
      tvn: 'FAKTY',
      republika: 'POLSKA'
    }[outlet.id] || 'POLITYKA';
  };

  var pressTVPStory = function(outlet, story, qualities) {
    if (!story || story.sourceUrl || outlet.id !== 'tvp') {
      return story;
    }
    var patron = pressPatronParty(outlet, qualities);
    var backsGovernment = patron === pressGovernmentParty(qualities);
    if (backsGovernment && !story.live) {
      return story;
    }
    var headlinePrefixes = {
      pis: backsGovernment ? 'Cabinet acts: ' : 'Government under fire: ',
      ko: backsGovernment ? 'Government moves: ' : 'Opposition presses: ',
      left: backsGovernment ? 'Lewica secures: ' : 'The Left responds: ',
      neutral: ''
    };
    var lead = patron === 'neutral'
      ? 'The decision now moves to the next institutional stage as parties dispute its likely effects.'
      : (backsGovernment
        ? 'Ministers say the decision keeps the government’s programme on schedule despite opposition criticism.'
        : 'Opposition parties say the decision exposes delays and divisions the cabinet has failed to explain.');
    return {
      headline: (headlinePrefixes[patron] || '') + story.headline,
      text: lead + ' ' + story.text,
      sourceUrl: story.sourceUrl,
      sourceDate: story.sourceDate
    };
  };

  var pressLiveStory = function(outlet, qualities, dateKey, turn) {
    var event = String(qualities.news_headline ||
      qualities.public_opinion_last_action || 'Poland enters a new political month')
      .replace(/[.!?]+$/, '');
    var seed = Math.abs((Number(turn) || 0) * 17 + (Number(dateKey) || 0) +
      outlet.id.length * 11);
    var headlines = {
      onet: [
        event + '. The coalition now has a problem it cannot spin away',
        event + '. The next 48 hours could decide who owns this crisis',
        event + '. What happened behind the scenes—and what comes next'
      ],
      wp: [
        event + '. What changes now and who will feel it first?',
        event + '. Five questions after a turbulent day in Warsaw',
        event + '. The dates, votes and consequences in one place'
      ],
      rzeczpospolita: [
        event + '. Politics ends where the bill begins',
        event + '. The state will live with the consequences',
        event + '. A victory announced before the costs are counted'
      ],
      'kanal-zero': [
        event + '. Everyone says they won. We check who is bluffing',
        event + '. A breakthrough—or another Warsaw performance?',
        event + '. The argument politicians do not want to have'
      ],
      rownosc: [
        event + '. The people expected to pay are finally speaking',
        event + '. Lewica can turn this moment into material change',
        event + '. Rights on paper will not be enough'
      ],
      tvp: [
        event + '. The government presents its next steps',
        event + '. A decisive day for the cabinet and parliament',
        event + '. Parties prepare for the next vote'
      ],
      tvn: [
        event + '. The documents leave ministers with new questions',
        event + '. Dates, contradictions and the vote still to come',
        event + '. The cabinet’s account does not close the case'
      ],
      republika: [
        event + '. The government calls it progress. Poland should read the fine print',
        event + '. The Left sees an opening and taxpayers see the invoice',
        event + '. Another elite bargain, another test for the right'
      ]
    };
    var copy = {
      onet: [
        'The declaration has started a race to define the day before voters do it themselves. Ministers point to delivery, opponents to the missing guarantees; the next parliamentary move may decide which account survives the week.',
        'Talks continued after the cameras left. The governing camp wants a clean success, while its partners are already protecting themselves from the possibility that the promise proves larger than the result.',
        'The public announcement settled the headline, not the dispute. Behind it sit an uneasy majority, an opposition looking for a weak seam and a Left deciding whether leverage is worth another open quarrel.'
      ],
      wp: [
        'Behind today’s declaration are deadlines, signatures and a vote count that remains less certain than the podium suggested. For households, the practical question is when any change begins and who is left outside it.',
        'The immediate decision is only the first step. Officials must still publish the rules, find the money and explain what happens if parliament or the President refuses to cooperate.',
        'Party leaders have offered sharply different versions of the same day. The calendar is clearer: a formal decision, an implementation test and then a political bill at the next election.'
      ],
      rzeczpospolita: [
        'A press conference can distribute credit; it cannot suspend arithmetic or law. Every promise now meets the budget, the limits of administration and a President entitled to read the text rather than the applause.',
        'Lewica wants the decision measured by its declared purpose. Taxpayers and institutions will instead measure enforceability, cost and the precedents created when a temporary political bargain becomes permanent policy.',
        'The majority has mistaken agreement among leaders for a settled public mandate. The difficult questions—authority, financing and legal durability—begin only after the victory photographs.'
      ],
      'kanal-zero': [
        'Government and opposition arrived with ready-made clips, each carefully avoiding the least convenient part of the record. Once the slogans are stripped away, the fight is about who controls the timetable and who gets blamed for the compromise.',
        'Every camp is selling courage to its own audience. The numbers are less heroic: uncertain votes, nervous partners and a decision whose practical effect may be smaller than today’s outrage.',
        'The loudest claim of the day will travel furthest online, but it is not necessarily true. We put the promises beside the dates, the parliamentary arithmetic and what the parties said last time.'
      ],
      rownosc: [
        'The people living with the decision are not scenery for another leaders’ summit. Tenants, workers, patients and organisers want enforceable rights, funded services and a timetable they can use.',
        'Lewica has a chance to move the argument from personalities to power: who works, who pays and who gets a voice before the final text is filed. A symbolic win will not survive contact with everyday life.',
        'The dispute is being narrated as a contest among party leaders. Outside parliament, the demand is simpler: turn the promise into a right and fund the people expected to deliver it.'
      ],
      tvp: [
        'The cabinet says the decision protects stability and keeps the state moving. Opposition parties dispute both the timetable and the claimed benefits as parliament prepares for the next formal step.',
        'Ministers presented the measure as an answer to a growing national concern. Critics say the announcement came before the legal and financial details needed to judge it.',
        'The political dispute now moves from the conference room to state institutions. The government is asking for a mandate to proceed; its opponents are organising a test of that claim.'
      ],
      tvn: [
        'The official account leaves gaps in the chronology and in the government’s explanation of who authorised what. Parliamentary scrutiny will now test whether those omissions are political convenience or a deeper failure of procedure.',
        'Ministers called the matter settled, but documents and earlier statements point to questions the cabinet has not answered. Coalition partners must decide whether to demand corrections or defend the common version.',
        'The decision may survive the day’s argument; the process behind it still requires scrutiny. Dates, legal opinions and testimony from those affected tell a less orderly story than the government presentation.'
      ],
      republika: [
        'The governing camp has dressed another compromise as necessity and expects conservative voters to applaud the absence of a worse outcome. The right will ask who surrendered first and what the country receives in return.',
        'Lewica is using the opening to demand a larger state, a larger bill and a smaller place for dissent. Government partners may accept the language today; voters will decide whether they accept the consequences.',
        'Warsaw’s political class has found common ground where it usually does: more authority for itself and a promise that somebody else will meet the cost. The opposition on the right is preparing its answer.'
      ]
    };
    var outletHeadlines = headlines[outlet.id] || headlines.wp;
    var outletCopy = copy[outlet.id] || copy.wp;
    var story = pressStory(
      outletHeadlines[seed % outletHeadlines.length],
      outletCopy[(seed + 1) % outletCopy.length]
    );
    story.live = true;
    return story;
  };

  var pressChoiceStory = function(outlet, story, qualities, dateKey) {
    var eventStories = pressEventStories[String(qualities.news_headline || '')];
    return eventStories && eventStories[outlet.id] ?
      eventStories[outlet.id] : story;
  };

  var pressRotateOutlets = function(outlets, turn) {
    if (!outlets.length) {
      return [];
    }
    var start = Math.abs((Number(turn) || 0) * 2) % outlets.length;
    return outlets.slice(start).concat(outlets.slice(0, start));
  };

  // Reserve one real sourced report when the month has one, then keep authored
  // outcome reactions ahead of monthly copy. Live copy is the final fallback.
  var pressEditionOutlets = function(available, qualities, dateKey, turn) {
    var eventStories = pressEventStories[String(qualities.news_headline || '')] || {};
    var monthlyStories = pressReviewStories[dateKey] || {};
    var sourcedStories = {};
    Object.keys(monthlyStories).forEach(function(outletId) {
      if (monthlyStories[outletId].sourceUrl) {
        sourcedStories[outletId] = monthlyStories[outletId];
      }
    });
    var used = {};
    var ordered = [];
    [sourcedStories, eventStories, monthlyStories, null].forEach(function(stories) {
      var group = available.filter(function(outlet) {
        return !used[outlet.id] && (!stories || stories[outlet.id]);
      });
      pressRotateOutlets(group, turn).forEach(function(outlet) {
        used[outlet.id] = true;
        ordered.push(outlet);
      });
    });
    return ordered;
  };

  var pressMoodSentence = function(outlet, qualities, issue) {
    if (!issue) {
      return '';
    }
    var mood = pressPublicMood(qualities, issue);
    if (mood.salience < 45) {
      return '';
    }
    var voice = pressVoice(outlet, qualities);
    var support = mood.support >= 62 ? 'most voters are already on board' :
      (mood.support <= 38 ? 'most voters remain unconvinced' :
        'the country remains closely divided');
    var reaction = mood.backlash >= 60 ?
      'opponents are highly mobilised' :
      (mood.backlash >= 40 ? 'the opposition still has room to mobilise' :
        'a wider backlash has so far remained limited');
    var supportLead = support.charAt(0).toUpperCase() + support.slice(1);
    var sentences = {
      neutral: 'On ' + mood.label + ', ' + support + '; ' + reaction + '.',
      'neutral-left': 'Lewica believes ' + mood.label + ' can broaden the opposition’s appeal. ' + supportLead + ', but ' + reaction + '.',
      'pro-left': 'The Left enters the fight over ' + mood.label + ' with an advantage: ' + support + '. Even so, ' + reaction + '.',
      'anti-left': 'Lewica is betting heavily on ' + mood.label + '. ' + supportLead + ', although ' + reaction + '.',
      'pro-government': 'The cabinet says its position on ' + mood.label + ' reflects the national mood. ' + supportLead + ', though ' + reaction + '.',
      'anti-government': 'The government is under pressure over ' + mood.label + ': ' + support + ', while ' + reaction + '.',
      'anti-establishment': 'Party strategists have noticed the movement on ' + mood.label + '. ' + supportLead + '; ' + reaction + '.'
    };
    return sentences[voice] || sentences.neutral;
  };

  var pressComposeTease = function(outlet, story, qualities, dateKey, turn) {
    if (!story) {
      return '';
    }
    if (story.sourceUrl) {
      return story.text;
    }

    var issue = pressRelevantIssue(story, qualities);
    var eventStories = pressEventStories[String(qualities.news_headline || '')];
    if (eventStories) {
      var moodOutlet = ['wp', 'rzeczpospolita', 'onet', 'tvn', 'tvp', 'republika']
        .find(function(id) { return eventStories[id]; });
      if (outlet.id !== moodOutlet) {
        issue = '';
      }
    } else if (['wp', 'rzeczpospolita', 'onet'].indexOf(outlet.id) < 0) {
      issue = '';
    }
    var moodSentence = pressMoodSentence(outlet, qualities, issue);
    return story.text + (moodSentence ? ' ' + moodSentence : '');
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
    available = pressEditionOutlets(available, qualities, dateKey, turn);

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
      var outlet = available[i];
      var stories = pressReviewStories[dateKey] || {};
      var story = stories[outlet.id];
      if (!story) {
        story = pressLiveStory(outlet, qualities, dateKey, turn);
      }
      story = pressChoiceStory(outlet, story, qualities, dateKey);
      story = pressTVPStory(outlet, story, qualities);
      var article = document.createElement('article');
      article.className = 'press-card press-' + outlet.id;
      article.style.setProperty('--press-accent', outlet.accent);
      article.style.setProperty(
        '--press-mark-color', outlet.foreground || '#fff'
      );
      article.setAttribute('data-outlet', outlet.id);
      article.setAttribute('data-mood-issue', pressPublicMood(qualities).issue);
      article.setAttribute('aria-label', outlet.name +
        (story.sourceUrl ? ' sourced report: ' : ' press analysis: ') +
        story.headline);

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
      kicker.textContent = story.sourceUrl ? 'FROM THE ARCHIVE' :
        pressSection(outlet);
      article.appendChild(kicker);

      var headline = document.createElement('h2');
      headline.className = 'press-headline';
      headline.textContent = story.headline;
      var tease = document.createElement('p');
      tease.className = 'press-tease';
      tease.textContent = pressComposeTease(
        outlet,
        story,
        qualities,
        dateKey,
        turn
      );
      article.appendChild(headline);
      article.appendChild(tease);

      var footer = document.createElement('footer');
      if (story && story.sourceUrl) {
        var sourceLink = document.createElement('a');
        sourceLink.href = story.sourceUrl;
        sourceLink.target = '_blank';
        sourceLink.rel = 'noopener noreferrer';
        sourceLink.textContent = 'SOURCED · ' + story.sourceDate;
        footer.appendChild(sourceLink);
      } else {
        footer.textContent = 'PRESS REVIEW';
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
      window.updateMoodBackground();
      var content = document.getElementById('content');
      window.enhancePartyElements(content);
      if (content) {
        var engine = window.dendryUI && window.dendryUI.dendryEngine;
        var state = engine && engine.state;
        // The Left's nominee is chosen at runtime, so both presidential
        // chapters leave an empty portrait slot in their own prose and this
        // fills it in place. Nothing is inserted into the surrounding text.
        var candidateImages = {
          'Robert Biedroń': 'img/poland/cards/advisor-biedron.webp',
          'Adrian Zandberg': 'img/poland/cards/advisor-zandberg.webp',
          'Agnieszka Dziemianowicz-Bąk': 'img/poland/cards/advisor-dziemianowicz-bak.webp',
          'Anna-Maria Żukowska': 'img/poland/cards/advisor-zukowska.webp',
          'Katarzyna Kotula': 'img/poland/cards/advisor-kotula.webp',
          'Magdalena Biejat': 'img/poland/cards/advisor-biejat.webp'
        };
        var primeMinisterImages = {
          'Adam Bodnar': 'img/poland/prime-ministers/adam-bodnar.webp',
          'Adrian Zandberg': 'img/poland/cards/advisor-zandberg.webp',
          'Agnieszka Dziemianowicz-Bąk': 'img/poland/cards/advisor-dziemianowicz-bak.webp',
          'Andrzej Domański': 'img/poland/prime-ministers/andrzej-domanski.webp',
          'Barbara Nowacka': 'img/poland/events/pres-candidate-nowacka.webp',
          'Beata Szydło': 'img/poland/prime-ministers/beata-szydlo.webp',
          'Borys Budka': 'img/poland/prime-ministers/borys-budka.webp',
          'Donald Tusk': 'img/poland/events/donald-tusk-2023.webp',
          'Henryk Kowalczyk': 'img/poland/prime-ministers/henryk-kowalczyk.webp',
          'Jacek Sasin': 'img/poland/prime-ministers/jacek-sasin.webp',
          'Katarzyna Kotula': 'img/poland/cards/advisor-kotula.webp',
          'Katarzyna Pełczyńska-Nałęcz': 'img/poland/prime-ministers/katarzyna-pelczynska-nalecz.webp',
          'Krzysztof Gawkowski': 'img/poland/cards/advisor-gawkowski.webp',
          'Krzysztof Hetman': 'img/poland/prime-ministers/krzysztof-hetman.webp',
          'Magdalena Biejat': 'img/poland/cards/advisor-biejat.webp',
          'Marcelina Zawisza': 'img/poland/cards/advisor-zawisza.webp',
          'Marcin Kierwiński': 'img/poland/prime-ministers/marcin-kierwinski.webp',
          'Mateusz Morawiecki': 'img/poland/events/mateusz-morawiecki-2023.webp',
          'Monika Rosa': 'img/poland/prime-ministers/monika-rosa.webp',
          'Paulina Hennig-Kloska': 'img/poland/prime-ministers/paulina-hennig-kloska.webp',
          'Paweł Szefernaker': 'img/poland/prime-ministers/pawel-szefernaker.webp',
          'Piotr Zgorzelski': 'img/poland/prime-ministers/piotr-zgorzelski.webp',
          'Przemysław Czarnek': 'img/poland/events/pres-candidate-czarnek.webp',
          'Radosław Sikorski': 'img/poland/events/pres-candidate-sikorski.webp',
          'Rafał Trzaskowski': 'img/poland/events/pres-candidate-trzaskowski.webp',
          'Robert Biedroń': 'img/poland/cards/advisor-biedron.webp',
          'Urszula Pasławska': 'img/poland/prime-ministers/urszula-paslawska.webp',
          'Władysław Kosiniak-Kamysz': 'img/poland/events/pres-candidate-kosiniak.webp',
          'Włodzimierz Czarzasty': 'img/poland/events/wlodzimierz-czarzasty-2019.webp'
        };
        var currentSceneId = state && state.sceneId;
        var qualities = (state && state.qualities) || {};
        var portraitSlots = content.querySelectorAll(
          '.left-candidate-portrait[data-candidate-quality]'
        );
        for (var slotIndex = 0; slotIndex < portraitSlots.length; slotIndex++) {
          var slot = portraitSlots[slotIndex];
          var slotImage = slot.querySelector('img');
          if (!slotImage || slotImage.getAttribute('src')) {
            continue;
          }
          var slotSource = candidateImages[
            qualities[slot.getAttribute('data-candidate-quality')]
          ];
          if (slotSource) {
            slotImage.setAttribute('src', slotSource);
          }
        }
        if (currentSceneId === 'poland_prime_minister_intro.show') {
          var primeMinisterName = String(
            qualities.prime_minister || 'The new Prime Minister'
          );
          var primeMinisterDefinition = personAliases[primeMinisterName];
          var primeMinisterImage = content.querySelector('.face-figure img');
          var primeMinisterBio = content.querySelector(
            '[data-prime-minister-bio]'
          );
          if (primeMinisterImage) {
            primeMinisterImage.src = primeMinisterImages[primeMinisterName] ||
              'img/poland/events/chancellery-2022.webp';
            primeMinisterImage.alt = primeMinisterImages[primeMinisterName]
              ? 'Portrait of ' + primeMinisterName
              : 'Chancellery of the Prime Minister';
          }
          if (primeMinisterBio) {
            primeMinisterBio.textContent = primeMinisterDefinition
              ? primeMinisterDefinition.explanation
              : primeMinisterName +
                ' has won the confidence required to lead the new cabinet.';
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
    window.updateMoodBackground();
    window.updateSidebar();
    window.statusTabRight = "press_review";
    window.updateSidebarRight();
    window.updateRadio();
  };

}());
