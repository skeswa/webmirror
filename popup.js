// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/************************************* GLOBAL VARIABLES ******************************************/

var pending_request_id = null;
var videoFeed = null;
// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

/********************************* DESKTOP SCREEN STREAMING **************************************/

// When we successfuly grab the stream
function gotStream(stream) {
  console.log("Received local stream");
  var video = document.querySelector("video");
  video.src = URL.createObjectURL(stream);
  videoFeed = stream;
  console.log("window.localStream set.");
  localstream = stream;
  stream.onended = function () {
    console.log("Ended");
  };
}

// If the stream cannot be used
function getUserMediaError() {
  console.log("getUserMedia() failed.");
}

// When we get access to the desktop video feed
function onAccessApproved(id) {
  if (!id) {
    console.log("Access rejected.");
    return;
  }

  navigator.webkitGetUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: id
      }
    }
  }, gotStream, getUserMediaError);
}

/************************************* WEBRTC SHIZZNIT *******************************************/

// PeerJS object
var peer = new Peer({
  key: 'eqlr1qshzfpkqpvi',
  debug: 3
});

// WebRTC event handling
peer.on('open', function () {
  $('#my-id').text(peer.id);
});
peer.on('error', function (err) {
  alert(err.message);
});

// Makes a call using the video feed
var makeCall = function (to, stream) {
  console.log("Making call to '" + to + "'...");
  var call = peer.call(to, stream);
  // Hang up on an existing call if present
  if (window.existingCall) {
    window.existingCall.close();
  }
  // Wait for stream on the call, then set peer video display
  call.on('stream', function (stream) {
    console.log("Call stream received...");
  });
  // UI Stuff etc.
  window.existingCall = call;
  console.log("Call submission successful.");
};

/************************************ UI EVENT HANDLING ******************************************/

// Click handlers setup
$(function () {
  $('#make-call').click(function () {
    // Initiate a call!
    var to = $('#callto-id').val();
    makeCall(to, videoFeed);
  });

  $('#end-call').click(function () {
    window.existingCall.close();
  });

  // Show the window selection popup
  $('#start').click(function () {
    pending_request_id = chrome.desktopCapture.chooseDesktopMedia(["screen", "window"], onAccessApproved);
  });

  // Cancels the video feed
  $('#cancel').click(function () {
    if (pending_request_id != null) {
      chrome.desktopCapture.cancelChooseDesktopMedia(pending_request_id);
    }
  });
});