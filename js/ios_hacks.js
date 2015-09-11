/**
 * So that this actually runs on ios
 */
var performance = window.performance ? window.performance : window.Date;
var AudioContext = window.AudioContext ? window.AudioContext : window.webkitAudioContext;
document.addEventListener('touchstart', function(event) {
  console.log("Ran ios audio hack");
  var dummy_context = new AudioContext();
  /* EXTREMELY DUMB HACK TO GET AUDIO WORKING ON IOS */
	var buffer = dummy_context.createBuffer(1, 1, 22050);
	var source = dummy_context.createBufferSource();
	source.buffer = buffer;
	source.connect(audio_context.destination);
	source.noteOn(0);
}, false);
