/****************************** UTILITY METHODS ******************************/

var onError = function (e) {
  console.log(e);
};

/****************************** APP DECLARATION ******************************/

var app = angular.module("webmirror", ["ngRoute" /* Dependencies */ ]);
// We have to specify routing
app.config(function ($routeProvider) {
  $routeProvider.when("/home", {
    templateUrl: "templates/home.html",
    controller: "HomeCtrl"
  }).when("/devices", {
    templateUrl: "templates/devices.html",
    controller: "DeviceSelectCtrl"
  }).when("/nowcasting/:deviceId/:peerId", {
    templateUrl: "templates/casting.html",
    controller: "NowCastingCtrl"
  }).otherwise({
    redirectTo: "/home"
  });
});
// Hook into location change events
app.run(function ($rootScope) {
  $rootScope.$on("$locationChangeSuccess", function (event, newUrl) {
    var newUrlParts = newUrl.split("#/");
    if (newUrlParts.length > 1) $rootScope.currLoc = newUrlParts.pop();
  });
});

/**************************** FACTORY DECLARATIONS ***************************/

app.service("BackendService", function ($http, ChromeService) {
  this.getAllDevices = function (callback) {
    var identity = ChromeService.identity();
    $http({
      method: "GET",
      url: "http://pooter.sandile.me:3546/machines",
      params: {
        userId: identity
      }
    }).success(function (data, status, headers, config) {
      callback(null, data);
    }).error(function (data, status, headers, config) {
      callback(data);
    });
  };

  this.unregisterDevice = function (deviceId, callback) {};
});

app.service("WebRTCService", function ($rootScope) {
  // PeerJS object
  var peer = new Peer({
    key: "eqlr1qshzfpkqpvi",
    debug: 3
  });
  var peerReady = false;
  // WebRTC event handling
  peer.on("open", function () {
    peerReady = true;
    console.log("Peer js ready: " + peer.id);
  });
  peer.on("error", function (err) {
    console.log(err);
  });
  // Methods
  this.id = function (callback) {
    if (peerReady) return peer.id;
    else {
      var intervalId;
      intervalId = setInterval(function () {
        console.log("Waiting for peer js to become ready...");
        if (peerReady) {
          clearInterval(intervalId);
          callback(null, peer.id);
        }
      }, 100);
    }
  };
  this.cast = function (to, stream) {
    console.log("Making cast to '" + to + "'...");
    var call = peer.call(to, stream);
    // Hang up on an existing call if present
    if ($rootScope.existingCall) {
      $rootScope.existingCall.close();
    }
    // UI Stuff etc.
    $rootScope.existingCall = call;
    console.log("Cast submission successful.");
  };
  this.halt = function () {
    // Hang up on an existing call if present
    if ($rootScope.existingCall) {
      console.log("Cast was closed.");
      $rootScope.existingCall.close();
    }
  };
});

app.service("VideoService", function ($rootScope) {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  // Current feed
  var feed = null;

  this.feed = function () {
    return feed;
  };

  this.chooseDesktopWindow = function (callback) {
    chrome.desktopCapture.chooseDesktopMedia(["screen", "window"], function (id) {
      navigator.webkitGetUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: id
          }
        }
      }, function success(stream) {
        feed = stream;
        callback(null, stream);
      }, function failure() {
        callback("getUserMedia() failed.");
      });
    });
  };
});

app.service("ChromeService", function () {
  this.identity = function (callback) {
    return chrome.extension.getBackgroundPage().me.split("@")[0];
  };
});

/*************************** CONTROLLER DECLARATIONS *************************/

app.controller("HomeCtrl", function ($scope, $location, VideoService) {
  $scope.desktop = function () {
    VideoService.chooseDesktopWindow(function (err, stream) {
      if (err) {
        console.log(err);
      } else {
        $scope.$apply(function () {
          $location.path("/devices");
        });
      }
    });
  };

});

app.controller("DeviceSelectCtrl", function ($scope, $location, BackendService) {
  BackendService.getAllDevices(function (err, devices) {
    $("#view section#devices #loader").hide();
    if (!devices || devices.length < 1) {
      $("#view section#devices #empty-prompt").show();
    } else {
      $scope.devices = devices;
    }
  });

  $scope.castToDevice = function (device) {
    $location.path("/nowcasting/" + device.machineId + "/" + device.peerId);
  };
});

app.controller("NowCastingCtrl", function ($scope, $routeParams, VideoService, WebRTCService) {
  $scope.deviceId = $routeParams.deviceId;
  // Set the preview
  $("section#casting #preview").prop("src", URL.createObjectURL(VideoService.feed()));
  // Call the device
  WebRTCService.id(function (err, peerId) {
    if (err) {
      console.log(err);
    } else {
      WebRTCService.cast($routeParams.peerId, VideoService.feed());
    }
  });
});

app.controller("MainCtrl", function ($scope, $location) {
  $scope.returnHome = function () {
    $location.path("/home");
  };
});