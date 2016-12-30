var ProjectRtcClient = (function() {

	var PROJECTRTC_SERVER = 'https://projectrtc-tom.herokuapp.com/';

	var app = angular.module('projectRtc', [],
		function ($locationProvider) {
			$locationProvider.html5Mode({ enabled: true, requireBase: false });
		}
		);
	var client = new PeerManager();
	var mediaConfig = {
		audio:true,
		video: {
			mandatory: {},
			optional: []
		}
	};

	app.factory('camera', ['$rootScope', '$window', function($rootScope, $window) {
		var camera = {};
		camera.preview = $window.document.getElementById('localVideo');

		camera.start = function() {
			return requestUserMedia(mediaConfig)
			.then(function(stream) {			
				attachMediaStream(camera.preview, stream);
				client.setLocalStream(stream);
				camera.stream = stream;
				$rootScope.$broadcast('cameraIsOn',true);
			})
			.catch(Error('Failed to get access to local media.'));
		};
		camera.stop = function() {
			return new Promise(function(resolve, reject) {			
				try {
					//camera.stream.stop() no longer works
					for (var trackIndex in camera.stream.getTracks()) {
						camera.stream.getTracks()[trackIndex].stop();
					}
					camera.preview.src = '';
					resolve();
				} catch(error) {
					reject(error);
				}
			})
			.then(function(result) {
				$rootScope.$broadcast('cameraIsOn',false);
			});	
		};
		return camera;
	}]);

	app.controller('VideoStreamController', ['camera', '$location', '$http', '$scope', '$window', function (camera, $location, $http, $scope, $window) {
		var vtc = this;
		vtc.remoteStreams = [];

		function getStreamById(id) {
			for (var i=0; i<vtc.remoteStreams.length;i++) {
				if (vtc.remoteStreams[i].id === id) {return vtc.remoteStreams[i];}
			}
		}

		vtc.getActiveStreams = function () {
			// get list of streams from the server
			$http.get(PROJECTRTC_SERVER + 'streams.json').then(function(results) {
				// filter own stream
				var streams = results.data.filter(function(stream) {
					return stream.id != client.getId();
				});
			    // get former state
			    for (var i=0; i<streams.length;i++) {
			    	var stream = getStreamById(streams[i].id);
			    	streams[i].isPlaying = (!!stream) ? stream.isPlaying : false;
			    }
			    // save new streams
			    vtc.remoteStreams = streams;
			}, function (httpErr) {
				console.error('httpErr', httpErr);
			});
		};

		vtc.view = function(stream) {
			client.peerInit(stream.id);
			stream.isPlaying = !stream.isPlaying;
		};

		var connectToStream = function (stream) {
			client.toggleLocalStream(stream.id);
			if (stream.isPlaying) {
				client.peerRenegociate(stream.id);
			}
			else {
				client.peerInit(stream.id);
			}
			stream.isPlaying = !stream.isPlaying;
		};

		vtc.call = function (stream) {
			/* If json isn't loaded yet, construct a new stream 
			 * This happens when you load <serverUrl>/<socketId> : 
			 * it calls socketId immediatly.
			 **/
			if (!stream.id) {
				stream = { id: stream, isPlaying: false };
				vtc.remoteStreams.push(stream);
			}
			if (camera.isOn) {
				connectToStream(stream);
			}
			else {
				camera.start()
				.then(function (result) {
					connectToStream(stream);
				})
				.catch(function (err) {
					console.log(err);
				});
			}
		};

		//initial load
		vtc.getActiveStreams();
		if($location.url() != '/') {
			vtc.call($location.url().slice(1));
		};

		vtc.name = 'Guest';
		vtc.link = '';
		vtc.cameraIsOn = false;

		$scope.$on('cameraIsOn', function(event,data) {
			$scope.$apply(function() {
				vtc.cameraIsOn = data;
			});
		});

		var startLocalStream = function () {
			camera.start()
			.then(function(result) {
				vtc.link = PROJECTRTC_SERVER + client.getId();
				client.send('readyToStream', { name: vtc.name });
			})
			.catch(function(err) {
				console.log(err);
			});
		};

		var stopLocalStream = function () {
			camera.stop()
			.then(function(result) {
				client.send('leave');
				client.setLocalStream(null);
			})
			.catch(function(err) {
				console.log(err);
			});			
		};

		vtc.toggleCam = function() {
			if (vtc.cameraIsOn) {
				stopLocalStream();
			}
			else {
				startLocalStream();
			}
		};

		vtc.getFirstStream = function () {
			return vtc.remoteStreams[0];
		};

		vtc.getToggleCallReference = function () {
			if (vtc.cameraIsOn) {
				// Call in progress
				return 'call-hangup';
			}
			else if (vtc.remoteStreams.length > 0) {
				// No call in progress - there are existing calls on server
				return 'call-join';
			}
			else {
				// No call in progress - there are no existing calls on server
				return 'call-startnew';
			}
		};

		vtc.getToggleCallLabel = function () {
			switch (vtc.getToggleCallReference()) {
				case 'call-hangup':
					return 'Hang up';
				case 'call-join':
					return 'Join call';
				case 'call-startnew':
					return 'Start new call';
			};
		};

		vtc.toggleCall = function () {
			switch (vtc.getToggleCallReference()) {
				case 'call-hangup':
					stopLocalStream();
					break;
				case 'call-join':
					vtc.call(vtc.getFirstStream());
					break;
				case 'call-startnew':
					startLocalStream();
					break;
			};
			vtc.getActiveStreams();
		};

	}]);

});