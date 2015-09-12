/**
 * So that this actually runs on ios
 */
var performance = $W.performance ? $W.performance : $W.Date;
var AudioContext = $W.AudioContext ? $W.AudioContext : $W.webkitAudioContext;
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
$D.addEventListener('touchstart', function(event) {
  /* EXTREMELY DUMB HACK TO GET AUDIO WORKING ON IOS */
	var buffer = kz.a.createBuffer(1, 1, 22050);
	var source = kz.a.createBufferSource();
	source.buffer = buffer;
	source.connect(kz.a.destination);
	source.noteOn(0);
}, false);
