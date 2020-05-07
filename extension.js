const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

//"User-defined" constants. If you've stumbled upon this extension, these values are the most likely you'd like to change.
const LEFT_PADDING = 30;
const MAX_STRING_LENGTH = 40;
const REFRESH_RATE = 2;
const FRIENDLY_GREETING = false;
const ARTIST_FIRST = true;
const EXTENSION_PLACE = "left";
const EXTENSION_INDEX = 2;

let _httpSession;
const SpotifyLabel = new Lang.Class({
	Name: 'SpotifyLabel',
	Extends: PanelMenu.Button,

	_init: function () {
		this.parent(0.0, "Spotify Label", false);

		this.buttonText = new St.Label({
			text: _("Loading..."),
			style: "padding-left: " + LEFT_PADDING + "px;",
			y_align: Clutter.ActorAlign.CENTER,
			x_align: Clutter.ActorAlign.FILL
		});

		// Create a new layout, add the text and add the actor to the layout
		let topBox = new St.BoxLayout();
		topBox.add(this.buttonText);
		this.actor.add_actor(topBox);

		//Place the actor/label at the "end" (rightmost) position within the left box
		children = Main.panel._leftBox.get_children();
		Main.panel._leftBox.insert_child_at_index(this.actor, children.length)

		this._refresh();
	},

	//Defind the refreshing function and set the timeout in seconds
	_refresh: function () {
		this._loadData(this._refreshUI);
		this._removeTimeout();
		this._timeout = Mainloop.timeout_add_seconds(REFRESH_RATE, Lang.bind(this, this._refresh));
		return true;
	},

	_loadData: function () {

		let [res, out, err, status] = [];
		try {
			//Use GLib to send a dbus request with the expectation of receiving an MPRIS v2 response.
			[res, out, err, status] = GLib.spawn_command_line_sync("dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.freedesktop.DBus.Properties.Get string:org.mpris.MediaPlayer2.Player string:Metadata");
		}
		catch(err) {
			this._refreshUI("Error. Please check system logs.");
			global.log("spotifylabel: res: " + res + " -- status: " + status + " -- err:" + err);
			return;
		}
		
		var labelstring = parseSpotifyData(out.toString());
		this._refreshUI(labelstring);
	},

	_refreshUI: function (data) {
		let txt = data.toString();
		this.buttonText.set_text(txt);
	},

	_removeTimeout: function () {
		if (this._timeout) {
			Mainloop.source_remove(this._timeout);
			this._timeout = null;
		}
	},

	stop: function () {
		if (_httpSession !== undefined)
			_httpSession.abort();
		_httpSession = undefined;

		if (this._timeout)
			Mainloop.source_remove(this._timeout);
		this._timeout = undefined;

		this.menu.removeAll();
	}
}
);

let spMenu;

function init() {
}

function enable() {
	spMenu = new SpotifyLabel;
   	Main.panel.addToStatusArea('sp-indicator', spMenu, EXTENSION_INDEX, EXTENSION_PLACE)
}

function disable() {
	spMenu.stop();
	spMenu.destroy();
}

//Spotify uses MIPRIS v2, and as such the metadata fields are prefixed by 'xesam'
//We use this info to set our limits,and assume the data is properly escaped within quotes.
function parseSpotifyData(data) {
	if(!data)
		return createGreeting()

	var titleBlock = data.substring(data.indexOf("xesam:title"));
	var title = titleBlock.split("\"")[2]

	var artistBlock = data.substring(data.indexOf("xesam:artist"));
	var artist = artistBlock.split("\"")[2]

	//If the delimited '-' is  in the title, we assume that it's remix, and encapsulate the end in brackets.
	if(title.includes("-"))
		title = title.replace("- ", "(") + ")";

	//If the name of either string is too long, cut off and add '...'
	if (artist.length > MAX_STRING_LENGTH)
		artist = artist.substring(0, MAX_STRING_LENGTH) + "...";

	if (title.length > MAX_STRING_LENGTH)
		title = title.substring(0, MAX_STRING_LENGTH) + "...";

	if (title.includes("xesam") || artist.includes("xesam"))
		return "Loading..."

	if (ARTIST_FIRST) {
    	return (artist + " - " + title);
  	}
  	return (title + " - " + artist);
}


let genres = ["DnB", "Synthwave", "Dubstep", "Pop", "House", "Hardstyle", "Rock", "8-bit", "Classical", "Electro"]
let currentGenre = genres[Math.floor(Math.random() * genres.length)];
let genreChanged = false; 

function createGreeting() {
	if (!FRIENDLY_GREETING)
		return ""

	var current_hour = new Date().getHours();

	if(new Date().getMinutes() % 5 == 0 && !genreChanged) {
		currentGenre = genres[Math.floor(Math.random() * genres.length)];
		genreChanged = true;
	}
	else if(new Date().getMinutes() % 5 != 0)
		genreChanged = false;

	if (current_hour < 4)
		return "A bit of late night coding and " + currentGenre + " music?";

	else if (current_hour < 7)
		return "You're up early, get at 'em!"

	else if (current_hour < 10)
		return "Start the day properly with some " + currentGenre + " music?";

	else if (current_hour < 12)
		return "What's todays soundtrack? A bit of " + currentGenre + "?";

	else if (current_hour == 12)
		return "" + currentGenre + " music and  bit of lunch?";

	else if (current_hour < 15)
		return "Is that " + currentGenre + " music on the radio? Let's go!";

	else if (current_hour < 18)
		return "Isn't work progressing nicely with some " + currentGenre + " music?";

	else if (current_hour < 21)
		return "Free time and " + currentGenre + "? Name a better duo.";

	else
		return "Can " + currentGenre + " be considered a lullaby? Sure!"


}
