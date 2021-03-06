(function () {
	//constants
	var innerDistance = 3,
		outerDistance = 20,

	//browser stuff and elements
		devicePixelRatio = window.devicePixelRatio || 1,
		splash = document.getElementById('splash'),
		canvas = document.getElementById('canvas'),

	//main objets
		seriously,
		select,
		target,

	//state
		sceneId = 0,
		panStartX,
		panStartY,
		panSpeedX,
		panSpeedY,
		panX,
		panY,
		lastPanUpdate = 0,
		dragging = false,
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
				longitude: -74.005542/*,
				overlays: {
					tardyHare: {
						x: -1188,
						y: -20.5,
						scale: 1.836,
						//events: 
						start: 4,
						end: 2000
					},
					cathead: {
						x: 694,
						y: 484,
						start: 8,
						end: 15
					},
					catbody: {
						x: 751.5,
						y: 204.5,
						start: 6,
						end: 6
					},
					queen: {
						x: -1739,
						y: 235,
						scale: 4.168
					}
				}
				*/
			},

			//work space garden
			{
				panoramaSrc: '#panorama1',
				sources: {
					mp3: 'audio/coraline.mp3',
					ogg: 'audio/coraline.ogg'
				},
				latitude: 40.736018,
				longitude: -74.007881
			},

			//work space front
			{
				panoramaSrc: '#panorama2',
				sources: {
					mp3: 'audio/coraline.mp3',
					ogg: 'audio/coraline.ogg'
				},
				latitude: 40.735843,
				longitude: -74.008680
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
			i = 0,
			event,
			opacityProps;

		scene.id = sceneId;
		sceneId++;

		//set up audio

		audio = document.createElement('audio');
		audio.addEventListener('loadedmetadata', function () {
			if (activeScene && activeScene.audio === this) {
				if (pendingCurrentTime >= 0 && pendingCurrentTime < audio.duration) {
					audio.currentTime = pendingCurrentTime;
				}
				pendingCurrentTime = -1;
			}
		});
		scene.audio = audio;

		//temp
		//document.getElementById('controls').appendChild(audio);
		//audio.controls = true;

		for (key in scene.sources) {
			if (scene.sources.hasOwnProperty(key)) {
				type = 'audio/' + key;
				if (audio.canPlayType(type)) {
					scene.src = scene.sources[key];
					break;
				}
			}
		}

		audio.src = scene.src;

		//set up popcorn
		/*
		scene.popcorn = Popcorn(audio);
		scene.popcorn.defaults('seriously', {
			seriously: seriously
		});
		*/

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
				overlay.transform.translate(overlay.x, overlay.y);
				overlay.transform.scale(overlay.scale || 1);
				scene.layers['source' + i] = overlay.transform;
				//scene.layers['opacity' + i] = 0;

				//fudge end factor
				event = {
					start: overlay.start,
					end: overlay.end || 500
				};
				opacityProps = {
					from: 0
				};
				opacityProps[1 / (event.end - event.start)] = 1;
				event[scene.id + '-opacity' + i] = opacityProps;
				scene.layers.alias('opacity' + i, scene.id + '-opacity' + i);
				//scene.popcorn.seriously(event);
			}
		}

		scene.panorama = seriously.effect('panorama');
		scene.panorama.source = scene.layers;
		scene.panorama.fov = 120;

		select['source' + scene.id] = scene.panorama;
	}

	function deactivateScene(scene) {
		scene.audio.pause();
	}

	function activateScene(scene) {
		var audioElement,
			currentTime;

		if (scene !== activeScene) {
			if (activeScene) {
				//break down old scene
				deactivateScene(activeScene);
				//set up new scene
				currentTime = activeScene.audio.currentTime;
			} else {
				currentTime = 0;
			}

			activeScene = scene;
			audioElement = activeScene.audio;

			//set new current time if/when metadata is loaded
			if (audioElement.readyState >= 1 && currentTime < audioElement.duration) {
				audioElement.currentTime = currentTime;
			} else {
				pendingCurrentTime = currentTime;
			}

			select.active = scene.id;
		}
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

		activateScene(closestScene);

		//fade out as you walk away
		//won't do anything in iPad
		if (minDist < outerDistance) {
			activeScene.audio.play();
			activeScene.audio.volume = 1 - Math.max(0, Math.min(1, (minDist - innerDistance) / (outerDistance - innerDistance)));
		} else {
			activeScene.audio.pause();
		}
	}

	function fullscreen() {
		if (canvas.requestFullscreen) {
			canvas.requestFullscreen();
		} else if (canvas.msRequestFullscreen) {
			canvas.msRequestFullscreen();
		} else if (canvas.mozRequestFullScreen) {
			canvas.mozRequestFullScreen();
		} else if (canvas.webkitRequestFullscreen) {
			canvas.webkitRequestFullscreen();
		}
	}

	function initialize() {
		var i;

		//only initialize once
		if (seriously) {
			return;
		}

		//set up canvas and composition
		seriously = new Seriously();

		select = seriously.effect('select', scenes.length);

		target = seriously.target(canvas);
		target.source = select;

		for (i = 0; i < scenes.length; i++) {
			buildScene(scenes[i]);
		}

		activateScene(scenes[0]);
		scenes[0].audio.play();
		resize();
		seriously.go(function () {
			var i,
				diff;

			if (dragging) {
				if (lastPanUpdate) {
					diff = Date.now() - lastPanUpdate;
					for (i = 0; i < scenes.length; i++) {
						panorama = scenes[i].panorama;
						panorama.yaw = fmod(panorama.yaw + diff * panSpeedX, 360);
						panorama.pitch += diff * panSpeedY;
					}
				}
				lastPanUpdate = Date.now();
			} else if (animateOrientation && false) {
				for (i = 0; i < scenes.length; i++) {
					panorama = scenes[i].panorama;
					panorama.yaw = (Date.now() / 100) % 360;
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

			if (dragging) {
				return;
			}

			if (window.orientation) {
				if (window.orientation < 0) {
					tilt = -e.gamma;
					rot = fmod(e.alpha + 180 + 90, 360);
				} else {
					tilt = e.gamma;
					rot = fmod(e.alpha + 90, 360);
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

		window.addEventListener('mousedown', function (evt) {
			dragging = true;
			panStartX = evt.pageX;
			panStartY = evt.pageY;
		}, true);

		window.addEventListener('mousemove', function (evt) {
			if (dragging) {
				panSpeedX = (evt.pageX - panStartX) / 4000;
				panSpeedY = (panStartY - evt.pageY) / 4000;
			}
		}, true);

		window.addEventListener('mouseup', function (evt) {
			dragging = false;
			lastPanUpdate = 0;
		}, true);

		splash.style.display = 'none';
		canvas.style.display = 'inline-block';

		//request full screen only on mobile
		if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
			fullscreen();
		}
	}

	splash.addEventListener('click', initialize, false);
	splash.addEventListener('touchend', initialize, false);
}());