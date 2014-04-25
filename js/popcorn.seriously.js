// PLUGIN: seriously

(function (Popcorn) {

	"use strict";

	var styleSheet,
		backupStack = [],
		original = {},
		current;

	Popcorn.basePlugin( 'seriously' , function(options, base) {
		var seriously = options.seriously,
			properties = [],
			aliases,
			state = {
				options: options,
				values: {}
			};

		if (!seriously) {
			return;
		}

		aliases = seriously.aliases();

		//base.animate(base.container);
		Popcorn.forEach(aliases, function(name) {
			if (name === 'seriously' || name === '_natives' ||
				name === 'start' || name === 'end' ||
				!seriously.hasOwnProperty(name)) {

				return;
			}

			if (options.hasOwnProperty(name)){
				state.values[name] = options[name];
			}

			base.animate(name, function(frameVal) {
				state.values[name] = frameVal;

				if (current.options === options) {
					seriously[name] = frameVal;
				}
			});
		});
		
		
		if (typeof options.onLoad === 'function') {
			options.onLoad(options);
		}

		return {
			start: function( event, options ) {
				Popcorn.forEach(aliases, function (name) {
					if (!backupStack.length) {
						original[name] = seriously[name];
					}
					seriously[name] = state.values[name];
				});
if (!backupStack.length) {
	console.log(this.popcorn.currentTime(), 'made backup', original);
}
				//todo: backupStack should probably be sorted by time
				backupStack.push(state);
				current = state;
			},
			end: function( event, options ) {
				var i, index = backupStack.indexOf(state), previous;

				if (index < 0) {
					return;
				}

				if (index === 0) {
					for (i in original) {
						if (original.hasOwnProperty(i)) {
							seriously[i] = original[i];
						}
					}
console.log('restored backup', original);
					current = null;
				} else {
					previous = backupStack[index - 1];
					for (i in previous.values) {
						if (previous.values.hasOwnProperty(i)) {
							seriously[i] = previous.values[i];
						}
					}
console.log('restored previous', previous.values);
					current = previous;
				}
				backupStack.splice(index, 1);
			}
		};
	});
}( Popcorn ));
