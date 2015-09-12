/**
 * So that this actually runs on ios
 */
var performance = window.performance ? window.performance : window.Date;
var AudioContext = window.AudioContext ? window.AudioContext : window.webkitAudioContext;
if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    var str = '' + this;
    var rpt = '';
    for (;;) {
      if ((count & 1) == 1) {
        rpt += str;
      }
      count >>>= 1;
      if (count == 0) {
        break;
      }
      str += str;
    }
    return rpt;
  }
}
document.addEventListener('touchstart', function(event) {
  /* EXTREMELY DUMB HACK TO GET AUDIO WORKING ON IOS */
	var buffer = kz.audio_context.createBuffer(1, 1, 22050);
	var source = kz.audio_context.createBufferSource();
	source.buffer = buffer;
	source.connect(kz.audio_context.destination);
	source.noteOn(0);
}, false);
