'use strict';

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function init() {
}

function buildPrefsWidget() {
  let gschema = Gio.SettingsSchemaSource.new_from_directory(
    Me.dir.get_child('schemas').get_path(),
    Gio.SettingsSchemaSource.get_default(),
    false
  );

  let settings = new Gio.Settings({
    settings_schema: gschema.lookup('org.gnome.shell.extensions.spotifylabel', true)
  });

  let prefsWidget = new Gtk.Grid({
    margin: 18,
    column_spacing: 12,
    row_spacing: 12,
    visible: true,
    column_homogeneous: true,
  });

  let index = 0;

  let title = new Gtk.Label({
    label: '<b>' + Me.metadata.name + ' Extension Preferences</b>',
    halign: Gtk.Align.START,
    use_markup: true,
    visible: true
  });
  prefsWidget.attach(title, 0, index, 1, 1);

  /* left-padding */
  let leftPaddingLabel = new Gtk.Label({
    label: 'Left padding:',
    halign: Gtk.Align.START,
    visible: true
  });

  let leftPaddingEntry = new Gtk.SpinButton({
    adjustment: new Gtk.Adjustment({
      lower: 0,
      upper: 100,
      step_increment: 1
    }),
    visible: true
  });

  index++;
  prefsWidget.attach(leftPaddingLabel, 0, index, 1, 1);
  prefsWidget.attach(leftPaddingEntry, 1, index, 1, 1);

  /* right-padding */
  let rightPaddingLabel = new Gtk.Label({
    label: 'Right padding:',
    halign: Gtk.Align.START,
    visible: true
  });

  let rightPaddingEntry = new Gtk.SpinButton({
    adjustment: new Gtk.Adjustment({
      lower: 0,
      upper: 100,
      step_increment: 1
    }),
    visible: true
  });

  index++;
  prefsWidget.attach(rightPaddingLabel, 0, index, 1, 1);
  prefsWidget.attach(rightPaddingEntry, 1, index, 1, 1);

  /* max-string-length */
  let maxStringLengthLabel = new Gtk.Label({
    label: 'Max string length (Each artist and title):',
    halign: Gtk.Align.START,
    visible: true
  });

  let maxStringLengthEntry = new Gtk.SpinButton({
    adjustment: new Gtk.Adjustment({
      lower: 1,
      upper: 100,
      step_increment: 1
    }),
    visible: true
  });

  index++;
  prefsWidget.attach(maxStringLengthLabel, 0, index, 1, 1);
  prefsWidget.attach(maxStringLengthEntry, 1, index, 1, 1);


  /* refresh-rate */
  let refreshRateLabel = new Gtk.Label({
    label: 'Refresh rate (seconds):',
    halign: Gtk.Align.START,
    visible: true
  });

  let refreshRateEntry = new Gtk.SpinButton({
    adjustment: new Gtk.Adjustment({
      lower: 1,
      upper: 60,
      step_increment: 1
    }),
    visible: true
  });

  index++;
  prefsWidget.attach(refreshRateLabel, 0, index, 1, 1);
  prefsWidget.attach(refreshRateEntry, 1, index, 1, 1);

  /* friendly-greeting */
  let friendlyGreetingLabel = new Gtk.Label({
    label: 'Friendly greeting:',
    halign: Gtk.Align.START,
    visible: true
  });

  let friendlyGreetingSwitch = new Gtk.Switch({
    valign: Gtk.Align.END,
    halign: Gtk.Align.END,
    visible: true
  });

  index++;
  prefsWidget.attach(friendlyGreetingLabel, 0, index, 1, 1);
  prefsWidget.attach(friendlyGreetingSwitch, 1, index, 1, 1);

  /* artist-first */
  let artistFirstLabel = new Gtk.Label({
    label: 'Artist first:',
    halign: Gtk.Align.START,
    visible: true
  });

  let artistFirstSwitch = new Gtk.Switch({
    valign: Gtk.Align.END,
    halign: Gtk.Align.END,
    visible: true
  });

  index++;
  prefsWidget.attach(artistFirstLabel, 0, index, 1, 1);
  prefsWidget.attach(artistFirstSwitch, 1, index, 1, 1);

  /* lowercase */
  let lowerCaseLabel = new Gtk.Label({
    label: 'Lowercase:',
    halign: Gtk.Align.START,
    visible: true
  });

  let lowerCaseSwitch = new Gtk.Switch({
    valign: Gtk.Align.END,
    halign: Gtk.Align.END,
    visible: true
  });

  index++;
  prefsWidget.attach(lowerCaseLabel, 0, index, 1, 1);
  prefsWidget.attach(lowerCaseSwitch, 1, index, 1, 1);

  /* extension-place */
  let extensionPlaceLabel = new Gtk.Label({
    label: 'Extension place:',
    halign: Gtk.Align.START,
    visible: true
  });

  let options = ['left', 'center', 'right'];
  let extensionPlaceComboBox = new Gtk.ComboBoxText({
    halign: Gtk.Align.END,
    visible: true
  });
  for (let i = 0; i < options.length; i++) {
    extensionPlaceComboBox.append(options[i], options[i]);
  }
  extensionPlaceComboBox.set_active(options.indexOf(settings.get_string('extension-place')));

  index++;
  prefsWidget.attach(extensionPlaceLabel, 0, index, 1, 1);
  prefsWidget.attach(extensionPlaceComboBox, 1, index, 1, 1);

  /* extension-index */
  let extensionIndexLabel = new Gtk.Label({
    label: 'Extension index:',
    halign: Gtk.Align.START,
    visible: true
  });

  let extensionIndexEntry = new Gtk.SpinButton({
    adjustment: new Gtk.Adjustment({
      lower: 0,
      upper: 20,
      step_increment: 1
    }),
    visible: true
  });

  index++;
  prefsWidget.attach(extensionIndexLabel, 0, index, 1, 1);
  prefsWidget.attach(extensionIndexEntry, 1, index, 1, 1);

  /* toggle-window */
  let toggleWindowLabel = new Gtk.Label({
    label: 'Click to toggle Spotify window/work window:',
    halign: Gtk.Align.START,
    visible: true
  });

  let toggleWindowSwitch = new Gtk.Switch({
    valign: Gtk.Align.END,
    halign: Gtk.Align.END,
    visible: true
  });

  index++;
  prefsWidget.attach(toggleWindowLabel, 0, index, 1, 1);
  prefsWidget.attach(toggleWindowSwitch, 1, index, 1, 1);


  //settings.bind('command', commandEntry, 'text', Gio.SettingsBindFlags.DEFAULT);
  settings.bind('left-padding', leftPaddingEntry, 'value', Gio.SettingsBindFlags.DEFAULT);
  settings.bind('right-padding', rightPaddingEntry, 'value', Gio.SettingsBindFlags.DEFAULT);
  settings.bind('max-string-length', maxStringLengthEntry, 'value', Gio.SettingsBindFlags.DEFAULT);
  settings.bind('refresh-rate', refreshRateEntry, 'value', Gio.SettingsBindFlags.DEFAULT);
  settings.bind('friendly-greeting', friendlyGreetingSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
  settings.bind('artist-first', artistFirstSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
  settings.bind('lowercase', lowerCaseSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
  settings.bind('toggle-window', toggleWindowSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
  extensionPlaceComboBox.connect('changed', Lang.bind(this, function (widget) {
    settings.set_string('extension-place', options[widget.get_active()]);
  }));
  settings.bind('extension-index', extensionIndexEntry, 'value', Gio.SettingsBindFlags.DEFAULT);

  return prefsWidget;
}
