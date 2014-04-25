(function () {
	//constants
	var innerDistance = 3,
		outerDistance = 40,

	//browser stuff and elements
		devicePixelRatio = window.devicePixelRatio || 1,
		//audioElement,

	//main objets
		seriously,
		select,
		canvas,
		target,

	//state
		sceneId = 0,
		animateOrientation = true,
		pendingCurrentTime = -1,
		activeScene,
		latitude,
		longitude,
		startTime,
		scenes = [
			//washington and charles st.
			{
				panoramaSrc: '#panorama0',
				sources: {
					mp3: 'audio/alice1a.mp3',
					ogg: 'audio/alice1a.ogg'
				},
				latitude: 40.736416,
				longitude: -74.005542,
				overlays: {
					tardyHare: {
						x: 0,
						y: 0,
						scale: 0.5
					}
				}
			},

			//work space
			{
				panoramaSrc: '#panorama1',
				sources: {
					mp3: 'audio/creep.mp3',
					ogg: 'audio/creep.ogg'
				},
				latitude: 40.735758,
				longitude: -74.007999
			}
		];

	function fmod(x, y) {
		return x - y * Math.floor(x / y);
	}

	function buildScene(scene) {
		var key,
			type,
			audio,
			overlay,
			layerCount = 1,
			i = 0;

		scene.id = sceneId;
		sceneId++;

		//set up audio

		audio = document.createElement('audio');
		audio.addEventListener('canplay', function () {
			if (activeScene && activeScene.audio === this) {
				if (pendingCurrentTime >= 0 && pendingCurrentTime < audio.duration) {
					audio.currentTime = pendingCurrentTime;
				}
				pendingCurrentTime = -1;
			}
		});
		scene.audio = audio;

		for (key in scene.sources) {
			if (scene.sources.hasOwnProperty(key)) {
				type = 'audio/' + key;
				if (audio.canPlayType(type)) {
					scene.src = scene.sources[key];
					break;
				}
			}
		}

		//set up seriously
		if (scene.overlays) {
			layerCount = Object.keys(scene.overlays).length + 1;
		}

		scene.layers = seriously.effect('layers', layerCount);
		scene.layers.source0 = scene.panoramaSrc;

		for (key in scene.overlays) {
			//break;
			if (scene.overlays.hasOwnProperty(key)) {
				i++;
				overlay = scene.overlays[key];
				overlay.transform = seriously.transform('2d');
				overlay.transform.source = document.getElementById(key);
				//overlay.x = overlay.x - 0.5;
				//overlay.y = overlay.y - 0.5;
				overlay.transform.translate(overlay.x, overlay.y);
				overlay.transform.scale(overlay.scale || 1);
				scene.layers['source' + i] = overlay.transform;
			}
		}

		scene.panorama = seriously.effect('panorama');
		scene.panorama.source = scene.layers;

		select['source' + scene.id] = scene.panorama;

		//set up popcorn
		scene.popcorn = Popcorn(audio);
	}

	function deactivateScene(scene) {
		//scene.comp.seriously.stop();
	}

	function activateScene(scene) {
		select.active = scene.id;
	}

	function resize() {
		var aspect = window.innerWidth / window.innerHeight,
			width = Math.min(960 * devicePixelRatio, window.innerWidth * devicePixelRatio),
			height = width / aspect,
			id;

		target.width = width;
		target.height = height;

		scenes.forEach(function (scene) {
			scene.panorama.width = width;
			scene.panorama.height = height;
		});
	}

	//distance in meters
	function distance(lat1, lon1, lat2, lon2) {
		function radians(deg) {
			return deg * Math.PI / 180;
		}

		var dLat = radians(lat2 - lat1),
			dLon = radians(lon2 - lon1),
			a,
			c,
			d;

		lat1 = radians(lat1);
		lat2 = radians(lat2);

		a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
		c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
		d = 6371000 * c;

		return d;
	}

	function updateLocation(position) {
		var dist,
			scene,
			closestScene,
			minDist = Infinity,
			currentTime,
			i;

		latitude = position.coords.latitude;
		longitude = position.coords.longitude;

		//todo: adjust based on accuracy?

		for (i = 0; i < scenes.length; i++) {
			scene = scenes[i];
			dist = distance(latitude, longitude, scene.latitude, scene.longitude);
			if (dist < minDist) {
				closestScene = scene;
				minDist = dist;
			}
		}

		if (closestScene !== activeScene) {
			if (activeScene) {
				//break down old scene
				deactivateScene(activeScene);
			}

			//set up new scene
			/*
			currentTime = audioElement.currentTime;
			audioElement.src = closestScene.src;
			audioElement.load();
			*/

			activeScene = closestScene;
			//set new current time if/when metadata is loaded
			/*
			if (audioElement.readyState >= 3 && pendingCurrentTime < audioElement.duration) {
				audioElement.currentTime = currentTime;
			} else {
				pendingCurrentTime = currentTime;
			}
			*/

			activateScene(activeScene);
		}

		//fade out as you walk away
		//won't do anything in iPad
		if (minDist < outerDistance) {
			//audioElement.play();
			//audioElement.volume = 1 - Math.max(0, Math.min(1, (minDist - innerDistance) / (outerDistance - innerDistance)));
		} else {
			//audioElement.pause();
		}
	}

	function initialize() {
		var i;

		//set up canvas and composition
		seriously = new Seriously();

		select = seriously.effect('select', scenes.length);

		//canvas = document.createElement('canvas');
		target = seriously.target('#canvas');
		target.source = select;

		for (i = 0; i < scenes.length; i++) {
			buildScene(scenes[i]);
		}

		activateScene(scenes[0]);
		resize();
		seriously.go(function () {
			var i;
			if (animateOrientation) {
				for (i = 0; i < scenes.length; i++) {
					panorama = scenes[i].panorama;
					panorama.yaw = (Date.now() / 100) % 360;
					//panorama.pitch = Math.sin(Date.now() / 2000) * 10;
				}
			}
		});

		window.onresize = resize;

		//todo: make sure this runs in side onclick
		navigator.geolocation.watchPosition(updateLocation, function () {
			console.log('unable to get location');
		}, {
			enableHighAccuracy: true,
			maximumAge: 30000,
			timeout: 27000
		});

		window.addEventListener("deviceorientation", function (e) {
			var tilt,
				rot,
				//yaw,
				i,
				panorama;

			if (window.orientation) {
				if (window.orientation < 0) {
					tilt = -e.gamma;
					rot = fmod(e.alpha + 180, 360);
				} else {
					tilt = e.gamma;
					rot = e.alpha;
				}
			} else {
				tilt = e.beta;
			}

			for (i = 0; i < scenes.length; i++) {
				panorama = scenes[i].panorama;
				if (tilt >= 0) {
					panorama.pitch = 90 - tilt;
					panorama.yaw = fmod(360 - rot, 360);
				} else {
					panorama.pitch = -90 - tilt;
					panorama.yaw = fmod(360 - 180 - rot, 360);
				}
			}

			//todo: hide map ui
			animateOrientation = false;
		}, false);
	}

	initialize();
}());