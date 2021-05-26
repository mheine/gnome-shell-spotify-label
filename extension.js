const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

//"User-defined" constants. If you've stumbled upon this extension, these values are the most likely you'd like to change.
let LEFT_PADDING,
  RIGHT_PADDING,
  MAX_STRING_LENGTH,
  REFRESH_RATE,
  FRIENDLY_GREETING,
  ARTIST_FIRST,
  EXTENSION_PLACE,
  EXTENSION_INDEX,
  TOGGLE_WINDOW,
  gschema,
  lastExtensionPlace,
  lastExtensionIndex;
var settings,
  onLeftPaddingChanged,
  onRightPaddingChanged,
  onExtensionPlaceChanged,
  onExtensionIndexChanged,
  onToggleModeChanged;
let _httpSession;
let spMenu;

const SpotifyLabel = new Lang.Class({
  Name: 'SpotifyLabel',
  Extends: PanelMenu.Button,
  extentionMutedSpotify: false,
  unMuteOnInit: false,
  _init: function (settings) {
    this.parent(0.0, 'Spotify Label', false);
    this.settings = settings;
    this.buttonText = new St.Button({
      accessible_name: 'PlayPause',
      toggle_mode: true,
      label: _('Loading...'),
      style:
        'padding-left: ' +
        this.settings.get_int('left-padding') +
        'px;' +
        'padding-right: ' +
        this.settings.get_int('right-padding') +
        'px; ',
      y_align: Clutter.ActorAlign.CENTER,
      x_align: Clutter.ActorAlign.FILL,
    });

    this.nextButton = new St.Button({
      accessible_name: 'Next',
      style_class: 'panel-status-button',
    });
    this.nextButton.add_actor(
      new St.Icon({
        gicon: Gio.icon_new_for_string(
          Me.dir.get_child('icons').get_path() + '/' + 'next.svg'
        ),
        style_class: 'system-status-icon',
      })
    );
    this.nextButton.connect('clicked', sendDBusCommand);

    this.prevButton = new St.Button({
      accessible_name: 'Previous',
      style_class: 'panel-status-button',
    });
    this.prevButton.add_actor(
      new St.Icon({
        gicon: Gio.icon_new_for_string(
          Me.dir.get_child('icons').get_path() + '/' + 'prev.svg'
        ),
        style_class: 'system-status-icon',
      })
    );
    this.prevButton.connect('clicked', sendDBusCommand);

    // Listen for update of padding in settings
    onLeftPaddingChanged = this.settings.connect(
      'changed::left-padding',
      this._leftPaddingChanged.bind(this)
    );
    onRightPaddingChanged = this.settings.connect(
      'changed::right-padding',
      this._rightPaddingChanged.bind(this)
    );

    // Listen for changes in the toggle feature
    onToggleModeChanged = this.settings.connect(
      'changed::toggle-window',
      this._toggleModeChanged.bind(this)
    );

    this._toggleModeChanged(); // checks and connects the toggle button

    onShowNextPrevModeChanged = this.settings.connect(
      'changed::show-next-prev-buttons',
      this._nextPrevButtonChanged.bind(this)
    );
    this._toggleModeChanged();

    // Create a new layout, add the text and add the actor to the layout
    let topBox = new St.BoxLayout();
    topBox.add(this.buttonText);
    topBox.add(this.prevButton);
    topBox.add(this.nextButton);

    this.buttonText.connect('clicked', sendDBusCommand);

    this.actor.add_actor(topBox);

    //Place the actor/label at the "end" (rightmost) position within the left box
    children = Main.panel._leftBox.get_children();
    Main.panel._leftBox.insert_child_at_index(this.actor, children.length);

    this._refresh();
  },

  // Update padding of this.buttonText according to new value set in settings
  _leftPaddingChanged: function () {
    this.buttonText.set_style(
      'padding-left: ' +
        this.settings.get_int('left-padding') +
        'px; ' +
        'padding-right: ' +
        this.settings.get_int('right-padding') +
        'px; '
    );
  },
  _rightPaddingChanged: function () {
    this.buttonText.set_style(
      'padding-left: ' +
        this.settings.get_int('left-padding') +
        'px; ' +
        'padding-right: ' +
        this.settings.get_int('right-padding') +
        'px; '
    );
  },

  _nextPrevButtonChanged: function () {
    if (this.settings.get_boolean('show-next-prev-buttons')) {
      this.prevButton.show();
      this.nextButton.show();
    } else {
      this.prevButton.hide();
      this.nextButton.hide();
    }
    this._refresh();
  },

  // Update labelEventListener if toggle mode changes
  _toggleModeChanged: function () {
    spotifyWindow = nonSpotifyWindow = null;
    if (settings.get_boolean('toggle-window')) {
      this.toggleModeID = this.actor.connect(
        'button-press-event',
        toggleWindow
      );
    } else {
      this.actor.disconnect(this.toggleModeID);
    }
  },

  //Defind the refreshing function and set the timeout in seconds
  _refresh: function () {
    this._loadData(this._refreshUI);
    this._removeTimeout();
    this._timeout = Mainloop.timeout_add_seconds(
      this.settings.get_int('refresh-rate'),
      Lang.bind(this, this._refresh)
    );
    return true;
  },

  _loadData: function () {
    let [res, out, err, status] = [];
    try {
      //Use GLib to send a dbus request with the expectation of receiving an MPRIS v2 response.
      [res, out, err, status] = GLib.spawn_command_line_sync(
        'dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.freedesktop.DBus.Properties.Get string:org.mpris.MediaPlayer2.Player string:Metadata'
      );
    } catch (err) {
      this._refreshUI('Error. Please check system logs.');
      global.log(
        'spotifylabel: res: ' + res + ' -- status: ' + status + ' -- err:' + err
      );
      return;
    }

    var labelstring = parseSpotifyData(out.toString());
    this._refreshUI(labelstring);
  },

  _refreshUI: function (data) {
    let txt = data.toString();
    if (txt.length > 2) {
      this.nextButton.show();
      this.prevButton.show();
    } else {
      this.nextButton.hide();
      this.prevButton.hide();
    }
    if (txt.length > 2) {
      if (!this.unMuteOnInit && this.isSpotifyMuted()) {
        this.unMuteSpotify();
        this.unMuteOnInit = true;
      }

      if (txt.indexOf('Advertisement') !== -1) {
        //   if (txt == 'Advertisement - ') {
        let res = this.muteSpotify();
        if (res) txt = 'Advertisement (muted)';
        else txt = 'Ads... (unable to muted)';
      } else {
        if (this.extentionMutedSpotify) this.unMuteSpotify();
      }
    }
    this.buttonText.set_label(txt);
  },

  findSpotifyAppId() {
    const findId = (string) => {
      const splited = string.split('index:');
      for (let index of splited) {
        let id = parseInt(index.substring(0, index.indexOf('driver')));
        if (index.indexOf('Spotify') !== -1) return id;
      }
    };
    try {
      [res, out, err, status] = GLib.spawn_command_line_sync(
        'pacmd list-sink-inputs'
      );
      return findId(out + '');
    } catch (err) {
      return NaN;
    }
  },
  isSpotifyMuted() {
    const isMuted = (string) => {
      const splited = string.split('index:');
      for (let index of splited) {
        let id = parseInt(index.substring(0, index.indexOf('driver')));
        if (index.indexOf('Spotify') !== -1) {
          if (index.indexOf('muted: yes' !== -1)) return true;
          return false;
        }
      }
    };
    try {
      [res, out, err, status] = GLib.spawn_command_line_sync(
        'pacmd list-sink-inputs'
      );
      return isMuted(out + '');
    } catch (err) {
      return NaN;
    }
  },
  muteSpotify() {
    try {
      let spotifyId = this.findSpotifyAppId();
      if (spotifyId != NaN) {
        GLib.spawn_command_line_sync(
          `pacmd set-sink-input-mute ${spotifyId} true`
        );
        this.extentionMutedSpotify = true;
        return true;
      }
    } catch (err) {
      return false;
    }
    return false;
  },
  unMuteSpotify() {
    try {
      let spotifyId = this.findSpotifyAppId();
      if (spotifyId != NaN) {
        GLib.spawn_command_line_sync(
          `pacmd set-sink-input-mute ${spotifyId} false`
        );
        this.extentionMutedSpotify = false;
        return true;
      }
    } catch (err) {
      return false;
    }
    return false;
  },
  _removeTimeout: function () {
    if (this._timeout) {
      Mainloop.source_remove(this._timeout);
      this._timeout = null;
    }
  },

  stop: function () {
    if (_httpSession !== undefined) _httpSession.abort();
    _httpSession = undefined;

    if (this._timeout) Mainloop.source_remove(this._timeout);
    this._timeout = undefined;

    this.menu.removeAll();
  },
});

function sendDBusCommand(command) {
  let [res, out, err, status] = [];
  try {
    //Use GLib to send a dbus request with the expectation of receiving an MPRIS v2 response.
    [res, out, err, status] = GLib.spawn_command_line_sync(
      'dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.' +
        command.accessible_name.toString()
    );
  } catch (err) {
    _refreshUI('Error. Please check system logs.');
    global.log(
      'spotifylabel: res: ' + res + ' -- status: ' + status + ' -- err:' + err
    );
    return;
  }
}

function init() {}

function enable() {
  // Load schema
  gschema = Gio.SettingsSchemaSource.new_from_directory(
    Me.dir.get_child('schemas').get_path(),
    Gio.SettingsSchemaSource.get_default(),
    false
  );

  // Load settings
  settings = new Gio.Settings({
    settings_schema: gschema.lookup(
      'org.gnome.shell.extensions.spotifylabel',
      true
    ),
  });

  // Mandatory for removing the spMenu from the correct location
  this.lastExtensionPlace = settings.get_string('extension-place');
  this.lastExtensionIndex = settings.get_int('extension-index');

  onExtensionPlaceChanged = this.settings.connect(
    'changed::extension-place',
    this.onExtensionLocationChanged.bind(this)
  );

  onExtensionIndexChanged = this.settings.connect(
    'changed::extension-index',
    this.onExtensionLocationChanged.bind(this)
  );

  let spotifyWindow, nonSpotifyWindow; // used by the switcher - greyed out in most editors

  spMenu = new SpotifyLabel(settings);
  Main.panel.addToStatusArea(
    'sp-indicator',
    spMenu,
    settings.get_int('extension-index'),
    settings.get_string('extension-place')
  );
}

function disable() {
  this.settings.disconnect(onLeftPaddingChanged);
  this.settings.disconnect(onRightPaddingChanged);
  this.settings.disconnect(onExtensionPlaceChanged);
  this.settings.disconnect(onExtensionIndexChanged);
  this.settings.disconnect(onToggleModeChanged);

  spMenu.stop();
  spMenu.destroy();
}

// Removes spMenu from correct location and then adds it to new one
function onExtensionLocationChanged(settings, key) {
  const newExtensionPlace = this.settings.get_string('extension-place');
  const newExtensionIndex = this.settings.get_int('extension-index');

  if (
    this.lastExtensionPlace !== newExtensionPlace ||
    this.lastExtensionIndex !== newExtensionIndex
  ) {
    switch (this.lastExtensionPlace) {
      case 'left':
        Main.panel._leftBox.remove_actor(spMenu.container);
        break;
      case 'center':
        Main.panel._centerBox.remove_actor(spMenu.container);
        break;
      default:
        Main.panel._rightBox.remove_actor(spMenu.container);
    }

    this.lastExtensionPlace = newExtensionPlace;
    this.lastExtensionIndex = newExtensionIndex;

    switch (newExtensionPlace) {
      case 'left':
        Main.panel._leftBox.insert_child_at_index(
          spMenu.container,
          newExtensionIndex
        );
        break;
      case 'center':
        Main.panel._centerBox.insert_child_at_index(
          spMenu.container,
          newExtensionIndex
        );
        break;
      default:
        Main.panel._rightBox.insert_child_at_index(
          spMenu.container,
          newExtensionIndex
        );
    }
  }
}

//Spotify uses MIPRIS v2, and as such the metadata fields are prefixed by 'xesam'
//We use this info to set our limits,and assume the data is properly escaped within quotes.
function parseSpotifyData(data) {
  if (!data) return createGreeting();

  var titleBlock = data.substring(data.indexOf('xesam:title'));
  var title = titleBlock.split('"')[2];

  var artistBlock = data.substring(data.indexOf('xesam:artist'));
  var artist = artistBlock.split('"')[2];

  //If the delimited '-' is in the title, we assume that it's remix, and encapsulate the end in brackets.
  if (title.includes('-')) title = title.replace('- ', '(') + ')';

  //If the name of either string is too long, cut off and add '...'
  if (artist.length > this.settings.get_int('max-string-length'))
    artist =
      artist.substring(0, this.settings.get_int('max-string-length')) + '...';

  if (title.length > this.settings.get_int('max-string-length'))
    title =
      title.substring(0, this.settings.get_int('max-string-length')) + '...';

  if (title.includes('xesam') || artist.includes('xesam')) return 'Loading...';

  if (this.settings.get_boolean('artist-first')) {
    return artist + ' - ' + title;
  }
  return title + ' - ' + artist;
}

function toggleWindow() {
  if (spotifyWindow && spotifyWindow.has_focus()) {
    // Spotify is focused
    if (nonSpotifyWindow) Main.activateWindow(nonSpotifyWindow);
    // else do nothing
  } else {
    // Spotify not focused, first press, multiple Spotify windows - all cases
    nonSpotifyWindow = spotifyWindow = null; // nonSpotifyWindow changes OR another spotifyWindow is active
    let windowActors = global.get_window_actors();
    for (let windowActor of windowActors) {
      if (typeof windowActor.get_meta_window === 'function') {
        if (windowActor.get_meta_window().get_wm_class() === 'Spotify')
          spotifyWindow = windowActor.get_meta_window();
        else if (windowActor.get_meta_window().has_focus())
          nonSpotifyWindow = windowActor.get_meta_window();

        if (spotifyWindow && nonSpotifyWindow)
          // both found
          break;
      }
    }
    Main.activateWindow(spotifyWindow); // switch to Spotify
  }
}

let genres = [
  'DnB',
  'Synthwave',
  'Dubstep',
  'Pop',
  'House',
  'Hardstyle',
  'Rock',
  '8-bit',
  'Classical',
  'Electro',
];
let currentGenre = genres[Math.floor(Math.random() * genres.length)];
let genreChanged = false;

function createGreeting() {
  if (!this.settings.get_boolean('friendly-greeting')) return '';

  var current_hour = new Date().getHours();

  if (new Date().getMinutes() % 5 == 0 && !genreChanged) {
    currentGenre = genres[Math.floor(Math.random() * genres.length)];
    genreChanged = true;
  } else if (new Date().getMinutes() % 5 != 0) genreChanged = false;

  if (current_hour < 4)
    return 'A bit of late night coding and ' + currentGenre + ' music?';
  else if (current_hour < 7) return "You're up early, get at 'em!";
  else if (current_hour < 10)
    return 'Start the day properly with some ' + currentGenre + ' music?';
  else if (current_hour < 12)
    return "What's todays soundtrack? A bit of " + currentGenre + '?';
  else if (current_hour == 12)
    return '' + currentGenre + ' music and bit of lunch?';
  else if (current_hour < 15)
    return 'Is that ' + currentGenre + " music on the radio? Let's go!";
  else if (current_hour < 18)
    return (
      "Isn't work progressing nicely with some " + currentGenre + ' music?'
    );
  else if (current_hour < 21)
    return 'Free time and ' + currentGenre + '? Name a better duo.';
  else return 'Can ' + currentGenre + ' be considered a lullaby? Sure!';
}
