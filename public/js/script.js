(function () {
	//constants
	var innerDistance = 3,
		outerDistance = 40,

	//elements
		audioElement,

	//state
		activeScene,
		latitude,
		longitude,
		startTime,
		scenes = {
			//work space
			scene1: {
				target: 'scene1',
				sources: {
					mp3: 'audio/myst.mp3',
					ogg: 'audio/myst.ogg'
				},
				latitude: 40.7358479,
				longitude: -74.0080679
			},

			//washington and charles st.
			scene2: {
				target: 'scene2',
				sources: {
					mp3: 'audio/creep.mp3',
					ogg: 'audio/creep.ogg'
				},
				latitude: 40.734133,
				longitude: -74.008384
			}
		};

	function buildScene(scene) {
		var key,
			type;

		for (key in scene.sources) {
			type = 'audio/' + key;
			if (audioElement.canPlayType(type)) {
				scene.src = scene.sources[key];
				return;
			}
		}
	}

	//distance in meters
	function distance(lat1, lon1, lat2, lon2) {
		function radians(deg) {
			return deg * Math.PI / 180
		}

		var dLat = radians(lat2 - lat1),
			dLon = radians(lon2 - lon1),
			lat1 = radians(lat1),
			lat2 = radians(lat2),

			a = Math.sin(dLat/2) * Math.sin(dLat/2) +
				Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
			c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
			d = 6371000 * c;

		return d;
	}

	function updateLocation(position) {
		var dist,
			key,
			scene,
			closestScene,
			minDist = Infinity,
			currentTime;

		latitude = position.coords.latitude;
		longitude = position.coords.longitude;

		//todo: adjust based on accuracy?

		for (id in scenes) {
			if (scenes.hasOwnProperty(id)) {
				scene = scenes[id];
				dist = distance(latitude, longitude, scene.latitude, scene.longitude);
				if (dist < minDist) {
					closestScene = scene;
					minDist = dist;
				}
			}
		}

		if (closestScene !== activeScene) {
			if (activeScene) {
				//break down old scene
			}

			//set up new scene
			currentTime = audioElement.currentTime;
			audioElement.src = closestScene.src;
			audioElement.load();

			activeScene = closestScene;
		}

		//todo: set new current time if/when metadata is loaded

		//fade out as you walk away
		//won't do anything in iPad
		if (minDist < outerDistance) {
			audioElement.play();
			audioElement.volume = 1 - Math.max(0, Math.min(1, (minDist - innerDistance) / (outerDistance - innerDistance)));
		} else {
			audioElement.pause();
		}
	}

	function initialize() {
		var id;

		audioElement = document.createElement('audio');

		//for debugging:
		audioElement.controls = true;
		document.body.appendChild(audioElement);

		for (id in scenes) {
			if (scenes.hasOwnProperty(id)) {
				buildScene(scenes[id]);
			}
		}

		//todo: make sure this runs in side onclick
		navigator.geolocation.watchPosition(updateLocation, function () {
			console.log('unable to get location');
		}, {
			enableHighAccuracy: true,
			maximumAge: 30000,
			timeout: 27000
		});
	}

	initialize();
}());