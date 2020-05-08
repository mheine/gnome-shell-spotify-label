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

    let title = new Gtk.Label({
        label: '<b>' + Me.metadata.name + ' Extension Preferences</b>',
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    prefsWidget.attach(title, 0, 0, 1, 1);

	/* left-padding */
    let leftPaddingLabel = new Gtk.Label({
        label: 'Left padding:',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(leftPaddingLabel, 0, 1, 1, 1);

    let leftPaddingEntry = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 0,
            upper: 100,
            step_increment: 1
        }),
        visible: true
    });
    prefsWidget.attach(leftPaddingEntry, 1, 1, 1, 1);
    
    /* max-string-length */
    let maxStringLengthLabel = new Gtk.Label({
        label: 'Max string length (Each artist and titel):',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(maxStringLengthLabel, 0, 2, 1, 1);

    let maxStringLengthEntry = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 1,
            upper: 100,
            step_increment: 1
        }),
        visible: true
    });
    prefsWidget.attach(maxStringLengthEntry, 1, 2, 1, 1);
    
    /* refresh-rate */
    let refreshRateLabel = new Gtk.Label({
        label: 'Refresh rate (seconds):',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(refreshRateLabel, 0, 3, 1, 1);

    let refreshRateEntry = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 1,
            upper: 60,
            step_increment: 1
        }),
        visible: true
    });
    prefsWidget.attach(refreshRateEntry, 1, 3, 1, 1);
    
    /* friendly-greeting */
    let friendlyGreetingLabel = new Gtk.Label({
        label: 'Friendly greeting:',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(friendlyGreetingLabel, 0, 4, 1, 1);

    let friendlyGreetingSwitch = new Gtk.Switch({
    	valign: Gtk.Align.END,
    	halign: Gtk.Align.END,
    	visible: true
    });
    prefsWidget.attach(friendlyGreetingSwitch, 1, 4, 1, 1);
    
    /* artist-first */
    let artistFirstLabel = new Gtk.Label({
        label: 'Artist first:',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(artistFirstLabel, 0, 5, 1, 1);

    let artistFirstSwitch = new Gtk.Switch({
    	valign: Gtk.Align.END,
    	halign: Gtk.Align.END,
    	visible: true
    });
    prefsWidget.attach(artistFirstSwitch, 1, 5, 1, 1);
    
    /* extension-place */
    let extensionPlaceLabel = new Gtk.Label({
        label: 'Extension place:',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(extensionPlaceLabel, 0, 6, 1, 1);

	let options = ['left', 'center', 'right'];
    let extensionPlaceComboBox = new Gtk.ComboBoxText({
    	halign: Gtk.Align.END,
    	visible: true
    });
    for (let i = 0; i < options.length; i++) {
      extensionPlaceComboBox.append(options[i],  options[i]);
    }
    extensionPlaceComboBox.set_active(options.indexOf(settings.get_string('extension-place')));
    prefsWidget.attach(extensionPlaceComboBox, 1, 6, 1, 1);
    
    /* extension-index */
    let extensionIndexLabel = new Gtk.Label({
        label: 'Extension Index:',
        halign: Gtk.Align.START,
        visible: true
    });
    prefsWidget.attach(extensionIndexLabel, 0, 7, 1, 1);

    let extensionIndexEntry = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 0,
            upper: 20,
            step_increment: 1
        }),
        visible: true
    });
    prefsWidget.attach(extensionIndexEntry, 1, 7, 1, 1);

    //settings.bind('command', commandEntry, 'text', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('left-padding', leftPaddingEntry, 'value', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('max-string-length', maxStringLengthEntry, 'value', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('refresh-rate', refreshRateEntry, 'value', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('friendly-greeting', friendlyGreetingSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    settings.bind('artist-first', artistFirstSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
    extensionPlaceComboBox.connect('changed', Lang.bind(this, function(widget) {
        settings.set_string('extension-place', options[widget.get_active()]);
      }));
    settings.bind('extension-index', extensionIndexEntry, 'value', Gio.SettingsBindFlags.DEFAULT);

    return prefsWidget;
}
