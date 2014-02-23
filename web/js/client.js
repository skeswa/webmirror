// Compatibility shim
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// PeerJS object
var peer = new Peer({ key: 'eqlr1qshzfpkqpvi', debug: 3});
var machineId = null;
var deviceType = null;
// Detect device type
if (navigator.userAgent.match(/Android/i)) deviceType = "android";
else if (navigator.userAgent.match(/BlackBerry/i)) deviceType = "blackberry";
else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) deviceType = "ios";
else if (navigator.userAgent.match(/IEMobile/i)) deviceType = "windowsphone";
else if (navigator.userAgent.match(/Mac68K|Mac68K|MacIntel/i)) deviceType = "mac";
else if (navigator.userAgent.match(/Linux|X11/i)) deviceType = "linux";
else deviceType = "windows";

peer.on('open', function(){
  $('#my-id').text(peer.id);
  
});

// Receiving a call
peer.on('call', function(call){
  // Answer the call automatically (instead of prompting user) for demo purposes
  call.answer();
  // Hang up on an existing call if present
  if (window.existingCall) {
	window.existingCall.close();
  }
  // Wait for stream on the call, then set peer video display
  call.on('stream', function(stream){
	$('#video-container').prop('src', URL.createObjectURL(stream));
	// Request full screen now
	var elem = $("#video-container")[0];
	if (elem.requestFullscreen) {
	  elem.requestFullscreen();
	} else if (elem.msRequestFullscreen) {
	  elem.msRequestFullscreen();
	} else if (elem.mozRequestFullScreen) {
	  elem.mozRequestFullScreen();
	} else if (elem.webkitRequestFullscreen) {
	  elem.webkitRequestFullscreen();
	}
  });
  // UI stuff
  window.existingCall = call;
});
peer.on('error', function(err){
  alert(err.message);
});

// Click handlers setup
$(function(){
	$("#setup-modal").modal({
		backdrop: 'static',
		keyboard: false,
		show: true
	});
	
	$("#setup-modal button").click(function() {
		machineId = $("#setup-modal-name").val();
		$("#setup-modal").modal("hide");
		$.ajax({
			type: 'POST',
			url:  '/machines/register',
			dataType: 'json',
			contentType: "application/json; charset=utf-8",
			data: JSON.stringify({
				machineId: machineId,
				peerId: peer.id,
				deviceType: deviceType
			}),
			success: function(data) {
				console.log("success");
				console.log(data);
			},
			error: function(data) {
				console.log("error");
				console.log(arguments);
			}
		});
	});
	
  $('#end-call').click(function(){
	window.existingCall.close();
  });
});