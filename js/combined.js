var $W = window;
var $D = document;

var txt_v = $D.createElement('canvas');
var txt_x = txt_v.getContext('2d');
// align is 0 for left, 1 for center, 2 for right
function tx(context, px, str, x, y, xalign, yalign) {
  letters = {
    ' ':'000,000,000,000',
    '(':'01,10,10,10,01',
    ')':'10,01,01,01,10',
    '+':'000,010,111,010,000',
    '/':'00001,00010,00100,01000,10000',
    ':':'0,1,0,1,0',
    '0':'0110,1001,1001,1001,0110',
    '1':'11,01,01,01,01',
    '2':'1110,0001,0110,1000,1111',
    '3':'1110,0001,0110,0001,1110',
    '4':'0010,0110,1010,1111,0010',
    '5':'1111,1000,1110,0001,1110',
    '6':'0110,1000,1110,1001,0110',
    '7':'1111,0001,0010,0100,0100',
    '8':'0110,1001,0110,1001,0110',
    '9':'0110,1001,0111,0001,0110',
    '.':'0,0,0,0,1',
    A:'0110,1001,1001,1111,1001',
    B:'1110,1001,1110,1001,1110',
    C:'011,100,100,100,011',
    D:'1110,1001,1001,1001,1110',
    E:'111,100,111,100,111',
    F:'111,100,111,100,100',
    G:'0111,1000,1011,1001,0111',
    H:'1001,1001,1111,1001,1001',
    I:'111,010,010,010,111',
    K:'1001,1010,1100,1010,1001',
    L:'100,100,100,100,111',
    M:'10001,11011,10101,10001,10001',
    N:'1001,1101,1011,1001,1001',
    O:'0110,1001,1001,1001,0110',
    P:'1110,1001,1001,1110,1000',
    Q:'0110,1001,1001,1001,0110,0001',
    R:'1110,1001,1001,1110,1001',
    S:'0111,1000,0110,0001,1110',
    T:'111,010,010,010,010',
    U:'1001,1001,1001,1001,0110',
    V:'1001,1001,1010,1010,0100',
    W:'10001,10101,10101,10101,01010',
    X:'1001,1001,0110,1001,1001',
    Y:'1001,1001,0111,0001,0110',
    Z:'111,001,010,100,111'};
  var w = 0, h = 0;
  var a = []
  for (var ii = 0; ii < str.length; ii++) {a.push(letters[str[ii]].split(',')); w += a[ii][0].length*px; h = Math.max(h,a[ii].length)}
  w += (str.length-1)*px;
  h *= px;
  w += w%2;
  h += h%2;
  txt_v.width = w;
  txt_v.height = h;
  txt_x.clearRect(0,0,w,h);
  txt_x.fillStyle = context.fillStyle;
  for (var ii = 0, ww = 0; ii < str.length; ii++) {
    for (var yy = 0; yy < a[ii].length; yy++)
      for (var xx = 0; xx < a[ii][yy].length; xx++)
        if (a[ii][yy][xx] == '1') txt_x.fillRect(xx*px+ww+ii*px, yy*px, px, px);
    ww += px*a[ii][0].length;
  }
  context.drawImage(txt_v,x-xalign*w/2,y-yalign*h/2);
}

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
	var buffer = $.a.createBuffer(1, 1, 22050);
	var source = $.a.createBufferSource();
	source.buffer = buffer;
	source.connect($.a.destination);
	source.noteOn(0);
}, false);
//$a = sonantx
//M = MusicGenerator
//A = AudioGenerator
//S = SoundGenerator

// a -- osc2_waveform
// b -- osc2_xenv
// c -- fx_pan_amt
// d -- osc2_vol
// e -- lfo_amt
// f -- lfo_osc1_freq
// g -- noise_fader
// h -- osc1_detune
// i -- osc2_oct
// j -- fx_filter
// k -- fx_resonance
// l -- fx_pan_freq
// m -- osc2_det
// n -- fx_delay_time
// o -- fx_freq
// p -- lfo_waveform
// r -- osc1_vol
// s -- fx_delay_amt
// t -- osc1_waveform
// u -- lfo_fx_freq
// v -- osc2_detune
// w -- env_release
// x -- env_sustain
// y -- osc1_xenv
// z -- lfo_freq
// _ -- env_master
// aa -- osc1_det
// ab -- env_attack
// ac -- osc1_oct


// NOTE: This is an altered version of Sonant-X by Herman Chau for
// use in js13kgames.
//
// Sonant-X
//
// Copyright (c) 2014 Nicolas Vanhoren
//
// Sonant-X is a fork of js-sonant by Marcus Geelnard and Jake Taylor. It is
// still published using the same license (zlib license, see below).
//
// Copyright (c) 2011 Marcus Geelnard
// Copyright (c) 2008-2009 Jake Taylor
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//    claim that you wrote the original software. If you use this software
//    in a product, an acknowledgment in the product documentation would be
//    appreciated but is not required.
//
// 2. Altered source versions must be plainly marked as such, and must not be
//    misrepresented as being the original software.
//
// 3. This notice may not be removed or altered from any source
//    distribution.

var $x;
(function() {
"use strict";
$x = {};

var WAVE_SPS = 44100;                    // Samples per second
var WAVE_CHAN = 2;                       // Channels
var MAX_TIME = 100; // maximum time, in millis, that the generator can use consecutively

var audioCtx = null;

// Oscillators
function osc_sin(value)
{
    return Math.sin(value * 6.283184);
}

function osc_square(value)
{
    if(osc_sin(value) < 0) return -1;
    return 1;
}

function osc_saw(value)
{
    return (value % 1) - 0.5;
}

function osc_tri(value)
{
    var v2 = (value % 1) * 4;
    if(v2 < 2) return v2 - 1;
    return 3 - v2;
}

// Array of oscillator functions
var oscillators =
[
    osc_sin,
    osc_square,
    osc_saw,
    osc_tri
];

function getnotefreq(n)
{
    return 0.00390625 * Math.pow(1.059463094, n - 128);
}

function genBuffer($w, callBack) {
    setTimeout(function() {
        // Create the channel work buffer
        var buf = new Uint8Array($w * WAVE_CHAN * 2);
        var b = buf.length - 2;
        var iterate = function() {
            var begin = new Date();
            var count = 0;
            while(b >= 0)
            {
                buf[b] = 0;
                buf[b + 1] = 128;
                b -= 2;
                count += 1;
                if (count % 1000 === 0 && (new Date() - begin) > MAX_TIME) {
                    setTimeout(iterate, 0);
                    return;
                }
            }
            setTimeout(function() {callBack(buf);}, 0);
        };
        setTimeout(iterate, 0);
    }, 0);
}

function applyDelay($c, $w, $i, rowLen, callBack) {
    var p1 = ($i.n * rowLen) >> 1;
    var t1 = $i.s / 255;

    var n1 = 0;
    var iterate = function() {
        var beginning = new Date();
        var count = 0;
        while(n1 < $w - p1)
        {
            var b1 = 4 * n1;
            var l = 4 * (n1 + p1);

            // Left channel = left + right[-p1] * t1
            var x1 = $c[l] + ($c[l+1] << 8) +
                ($c[b1+2] + ($c[b1+3] << 8) - 32768) * t1;
            $c[l] = x1 & 255;
            $c[l+1] = (x1 >> 8) & 255;

            // Right channel = right + left[-p1] * t1
            x1 = $c[l+2] + ($c[l+3] << 8) +
                ($c[b1] + ($c[b1+1] << 8) - 32768) * t1;
            $c[l+2] = x1 & 255;
            $c[l+3] = (x1 >> 8) & 255;
            ++n1;
            count += 1;
            if (count % 1000 === 0 && (new Date() - beginning) > MAX_TIME) {
                setTimeout(iterate, 0);
                return;
            }
        }
        setTimeout(callBack, 0);
    };
    setTimeout(iterate, 0);
}

/**
 * @constructor
 */
$x.A = function($m) {
    this.$m = $m;
    this.$w = $m.length / WAVE_CHAN / 2;
};
$x.A.prototype.getAudioBuffer = function(callBack) {
    if (audioCtx === null)
        audioCtx = new AudioContext();
    var $m = this.$m;
    var $w = this.$w;

    var buffer = audioCtx.createBuffer(WAVE_CHAN, this.$w, WAVE_SPS); // Create Mono Source Buffer from Raw Binary
    var lchan = buffer.getChannelData(0);
    var rchan = buffer.getChannelData(1);
    var b = 0;
    var iterate = function() {
        var beginning = new Date();
        var count = 0;
        while (b < $w) {
            var y = 4 * ($m[b * 4] + ($m[(b * 4) + 1] << 8) - 32768);
            y = y < -32768 ? -32768 : (y > 32767 ? 32767 : y);
            lchan[b] = y / 32768;
            y = 4 * ($m[(b * 4) + 2] + ($m[(b * 4) + 3] << 8) - 32768);
            y = y < -32768 ? -32768 : (y > 32767 ? 32767 : y);
            rchan[b] = y / 32768;
            b += 1;
            count += 1;
            if (count % 1000 === 0 && new Date() - beginning > MAX_TIME) {
                setTimeout(iterate, 0);
                return;
            }
        }
        setTimeout(function() {callBack(buffer);}, 0);
    };
    setTimeout(iterate, 0);
};

/**
 * @constructor
 */
$x.S = function($i, rowLen) {
    this.$i = $i;
    this.rowLen = rowLen || 5605;

    this.osc_lfo = oscillators[$i.p];
    this.osc1 = oscillators[$i.t];
    this.osc2 = oscillators[$i.a];
    this.$a = $i.ab;
    this.sustain = $i.x;
    this.release = $i.w;
    this.panFreq = Math.pow(2, $i.l - 8) / this.rowLen;
    this.lfoFreq = Math.pow(2, $i.z - 8) / this.rowLen;
};
$x.S.prototype.genSound = function(n, $c, currentpos) {
    var marker = new Date();
    var c1 = 0;
    var c2 = 0;

    // Precalculate frequencues
    var o1t = getnotefreq(n + (this.$i.ac - 8) * 12 + this.$i.aa) * (1 + 0.0008 * this.$i.h);
    var o2t = getnotefreq(n + (this.$i.i - 8) * 12 + this.$i.m) * (1 + 0.0008 * this.$i.v);

    // $S variable init
    var q = this.$i.k / 255;
    var low = 0;
    var band = 0;
    for (var j = this.$a + this.sustain + this.release - 1; j >= 0; --j)
    {
        var k = j + currentpos;

        // LFO
        var lfor = this.osc_lfo(k * this.lfoFreq) * this.$i.e / 512 + 0.5;

        // Envelope
        var e = 1;
        if(j < this.$a)
            e = j / this.$a;
        else if(j >= this.$a + this.sustain)
            e -= (j - this.$a - this.sustain) / this.release;

        // Oscillator 1
        var t = o1t;
        if(this.$i.f) t += lfor;
        if(this.$i.y) t *= e * e;
        c1 += t;
        var rsample = this.osc1(c1) * this.$i.r;

        // Oscillator 2
        t = o2t;
        if(this.$i.b) t *= e * e;
        c2 += t;
        rsample += this.osc2(c2) * this.$i.d;

        // Noise oscillator
        if(this.$i.g) rsample += (2*Math.random()-1) * this.$i.g * e;

        rsample *= e / 255;

        // $S variable filter
        var f = this.$i.o;
        if(this.$i.u) f *= lfor;
        f = 1.5 * Math.sin(f * 3.141592 / WAVE_SPS);
        low += f * band;
        var high = q * (rsample - band) - low;
        band += f * high;
        switch(this.$i.j)
        {
            case 1: // Hipass
                rsample = high;
                break;
            case 2: // Lopass
                rsample = low;
                break;
            case 3: // Bandpass
                rsample = band;
                break;
            case 4: // Notch
                rsample = low + high;
                break;
            default:
        }

        // Panning & master volume
        t = osc_sin(k * this.panFreq) * this.$i.c / 512 + 0.5;
        rsample *= 39 * this.$i._;

        // Add to 16-bit channel buffer
        k = k * 4;
        if (k + 3 < $c.length) {
            var x = $c[k] + ($c[k+1] << 8) + rsample * (1 - t);
            $c[k] = x & 255;
            $c[k+1] = (x >> 8) & 255;
            x = $c[k+2] + ($c[k+3] << 8) + rsample * t;
            $c[k+2] = x & 255;
            $c[k+3] = (x >> 8) & 255;
        }
    }
};
$x.S.prototype.getAudioGenerator = function(n, callBack) {
    var bufferSize = (this.$a + this.sustain + this.release - 1) + (32 * this.rowLen);
    var self = this;
    genBuffer(bufferSize, function(buffer) {
        self.genSound(n, buffer, 0);
        applyDelay(buffer, bufferSize, self.$i, self.rowLen, function() {
            callBack(new $x.A(buffer));
        });
    });
};
$x.S.prototype.createAudioBuffer = function(n, callBack) {
    this.getAudioGenerator(n, function(ag) {
        ag.getAudioBuffer(callBack);
    });
};

/**
 * @constructor
 */
$x.M = function(song) {
    this.song = song;
    // Wave data configuration
    this.$w = WAVE_SPS * song.songLen; // Total song size (in samples)
};
$x.M.prototype.generateTrack = function ($i, $m, callBack) {
    var self = this;
    genBuffer(this.$w, function($c) {
        // Preload/precalc some properties/expressions (for improved performance)
        var $w = self.$w,
            waveBytes = self.$w * WAVE_CHAN * 2,
            rowLen = self.song.rowLen,
            soundGen = new $x.S($i, rowLen);

        var endPattern = $i.notes.length;
        var currentpos = 0;
        var idx = 0;
        var recordSounds = function () {
          var beginning = new Date();
          while (true) {
            if (idx === endPattern) {
              setTimeout(delay, 0);
              return;
            }
            var n = $i.notes[idx];
            if (n) {
              soundGen.genSound(n, $c, currentpos);
            }
            idx++;
            currentpos += 3*rowLen;
            if (new Date() - beginning > MAX_TIME) {
                setTimeout(recordSounds, 0);
                return;
            }
          }
        }

        var delay = function() {
            applyDelay($c, $w, $i, rowLen, finalize);
        };

        var b2 = 0;
        var finalize = function() {
            var beginning = new Date();
            var count = 0;
            // Add to mix buffer
            while(b2 < waveBytes)
            {
                var x2 = $m[b2] + ($m[b2+1] << 8) + $c[b2] + ($c[b2+1] << 8) - 32768;
                $m[b2] = x2 & 255;
                $m[b2+1] = (x2 >> 8) & 255;
                b2 += 2;
                count += 1;
                if (count % 1000 === 0 && (new Date() - beginning) > MAX_TIME) {
                    setTimeout(finalize, 0);
                    return;
                }
            }
            setTimeout(callBack, 0);
        };
        setTimeout(recordSounds, 0);
    });
};
$x.M.prototype.getAudioGenerator = function(callBack) {
    var self = this;
    genBuffer(this.$w, function($m) {
        var t = 0;
        var recu = function() {
            if (t < self.song.songData.length) {
                t += 1;
                self.generateTrack(self.song.songData[t - 1], $m, recu);
            } else {
                callBack(new $x.A($m));
            }
        };
        recu();
    });
};
$x.M.prototype.createAudio = function(callBack) {
    this.getAudioGenerator(function(ag) {
        callBack(ag.getAudio());
    });
};
$x.M.prototype.createAudioBuffer = function(callBack) {
    this.getAudioGenerator(function(ag) {
        ag.getAudioBuffer(callBack);
    });
};

})();
/**
 * SfxrParams
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrParams() {
  //--------------------------------------------------------------------------
  //
  //  Settings String Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Parses a settings array into the parameters
   * @param values Array of the settings values, where elements 0 - 23 are
   *                a: waveType
   *                b: attackTime
   *                c: sustainTime
   *                d: sustainPunch
   *                e: decayTime
   *                f: startFrequency
   *                g: minFrequency
   *                h: slide
   *                i: deltaSlide
   *                j: vibratoDepth
   *                k: vibratoSpeed
   *                l: changeAmount
   *                m: changeSpeed
   *                n: squareDuty
   *                o: dutySweep
   *                p: repeatSpeed
   *                q: phaserOffset
   *                r: phaserSweep
   *                s: lpFilterCutoff
   *                t: lpFilterCutoffSweep
   *                u: lpFilterResonance
   *                v: hpFilterCutoff
   *                w: hpFilterCutoffSweep
   *                x: masterVolume
   * @return If the string successfully parsed
   */
  this.setSettings = function(values)
  {
    for ( var i = 0; i < 24; i++ )
    {
      this[String.fromCharCode( 97 + i )] = values[i] || 0;
    }

    // I moved this here from the reset(true) function
    if (this['c'] < .01) {
      this['c'] = .01;
    }

    var totalTime = this['b'] + this['c'] + this['e'];
    if (totalTime < .18) {
      var multiplier = .18 / totalTime;
      this['b']  *= multiplier;
      this['c'] *= multiplier;
      this['e']   *= multiplier;
    }
  };
}
// L -- loadResources
// I -- loadImages
// S -- loadSounds
// K -- KEYS
// T -- TOUCHES
// E -- Entity
// C -- C
// r -- resources
// x -- context
// v -- canvas
// t -- tween
// a -- audio_context

var $ = {};

/*^ Functions for loading resources */
// queue is an object with names as keys and image paths as values
$.L = function (resources) {
  var promises = [];
  $.r = {};

  promises.push($.I(resources.i));
  promises.push($.S(resources.sounds));

  return Promise.all(promises)
    .then(function () {
      return $.r;
    });
};

$.I = function (queue) {
  var i = {};
  var promises = [];

  for (var key in queue) {
    promises.push(new Promise(function(resolve) {
      var c = queue[key];
      var canvas = $D.createElement('canvas');
      i[key] = canvas;
      var image = new Image();
      image.addEventListener('load', function() {
        var context = canvas.getContext('2d');
        canvas.width = c.w
        canvas.height = c.h;
        if (c.f) {
          context.drawImage(image, c.x, c.y, c.W, c.H, (c.w-c.W)/2, (c.h-c.H)/2, c.W, c.H);
        } else {
          context.drawImage(image, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
        }
        resolve();
      });
      image.src = 's.png';
    }));
  }

  return Promise.all(promises)
                .then(function () {
                  $.r.i = i;
                  return $.r.i;
                });
};

$.a = new AudioContext();
$.S = function (queue) {
  var sounds = {};
  var promises = [];

  for (var key in queue) {
    /*sounds[key] = {
      play: function () {}
    };*/
    promises.push(new Promise(function(resolve) {
      var name = key;
      queue[key].loader(queue[key].data, function(buffer) {
        sounds[name] = {
          play: function (loop) {
            loop = typeof loop == undefined ? false : loop;
            var source = $.a.createBufferSource();
            source.loop = loop;
            source.buffer = this.buffer;
            source.connect($.a.destination);
            source.start(0);
            return source;
          },
          buffer: buffer
        };
        resolve();
      });
    }));
  }

  return Promise.all(promises)
                .then(function () {
                  $.r.sounds = sounds;
                  return $.r.sounds;
                });
};
/*$ Functions for loading resources */

/*^ Keys */
$.K = {
  X: 27, // ESCAPE
  L: 37, // LEFT
  U: 38, // UP
  R: 39, // RIGHT
  D: 40, // DOWN
  Z: 90 // Z
};

$.keys_status = {};
for (var ii = 0; ii < 256; ii++) {
  $.keys_status[ii] = 0;
}
/*$ Keys */

/*^ Touches */
$.T = {};
/*$ Touches */

/*^ Tween */
/**
 * $.tween()
 *
 * Description:
 *  Does a simple linear tween for numerical values.
 * Returns:
 *  A promise which is resolved upon completion of the tween.
 * Expects:
 *   tween = {
 *     object: // object to tween
 *     property: // property on the object to tween
 *     value: // new value to tween the property to
 *     rate: // rate of tweening, units are 1/ms
 *     duration: // duration of the tweening, units are ms
 *   }
 *   Only one of 'rate' or 'duration' should be set.
 */
$.t = function (tween) {
  var start_time = performance.now();
  var old_value = tween.o[tween.p];
  var new_value = tween.v;
  var duration = tween.d
    ? tween.d
    : Math.abs(new_value - old_value) / tween.r;

  return new Promise(function (resolve) {
    function update() {
      var time_elapsed = performance.now() - start_time;
      var t = time_elapsed / duration;
      if (t >= 1) {
        tween.o[tween.p] = new_value;
        resolve();
      } else {
        tween.o[tween.p] = t * new_value + (1 - t) * old_value;
        $W.requestAnimationFrame(update);
      }
    }
    $W.requestAnimationFrame(update);
  });
};
/*$ Tween */

/*^ Events */
$.events = [];

$.sendEvent = function(event) {
  $.events.push(event);
}

$.processEvents = function () {
  for (var ii = 0; ii < $.events.length; ii++) {
    for (var id in $.entities) {
      $.entities[id].listen($.events[ii]);
    }
  }
  $.events = [];
};
/*$ Events */

/*^ The E object */
$._i = 0;
/**
 * @constructor
 */
$.E = function (properties) {
  for (name in properties) {
    if (!properties.hasOwnProperty(name)) continue;
    this[name] = properties[name];
  }
  /*if (typeof this.x !== 'number') {
    throw 'E.x must be a number';
  }
  if (typeof this.y !== 'number') {
    throw 'E.y must be a number';
  }
  if (typeof this.listen !== 'function') {
    throw 'E.listen must be a function';
  }*/
  this._i = $._i;
  $.entities[this._i] = this;
  $._i++;
};

$.E.prototype.x = 0;
$.E.prototype.y = 0;
$.E.prototype.listen = function () {
};
$.E.prototype.destroy = function () {
  delete $.entities[this._i];
};
/*$ The E object */

/*^ The C object */
/**
 * @constructor
 */
$.C = function () {};
$.C.prototype.initialize = function () {
};

$.C.prototype.preUpdate = function () {
};

$.C.prototype.postUpdate = function () {
};

$.C.prototype.draw = function () {
};

$.C.prototype.exit = function () {
};

/*$ The C object */

/*^ Essential functions such as initialize, tick, and run */
$.initializeCanvas = function (canvas_id) {
  $.v = $D.getElementById(canvas_id);
  $.x = $.v.getContext('2d');
  $.x.clearAll = function () {
    $.x.clearRect(0, 0, $.v.width, $.v.height);
  };
};

$.initialize = function (canvas_id) {
  $.initializeCanvas(canvas_id);

  $D.addEventListener('keydown', function(event) {
    event.preventDefault();
    if ($.keys_status[event.which] == 0) {
      $.keys_status[event.which] = 1;
      event.$type = 'keypress';
    } else {
      event.$type = 'keyheld';
    }
    $.events.push(event);
  });

  $D.addEventListener('keyup', function(event) {
    event.preventDefault();
    event.$type = 'keyup';
    $.keys_status[event.which] = 0;
    $.events.push(event);
  });

  // touch events
  $D.addEventListener('touchstart', function(event) {
    //event.preventDefault();
    for (var ii = 0; ii < event.touches.length; ii++) {
      var touch = event.touches[ii];
      if ($.T[touch.identifier]) continue;
      $.T[touch.identifier] = {
        initial: {x: touch.screenX, y: touch.screenY},
        current: {x: touch.screenX, y: touch.screenY}
      };
    }
  });

  $D.addEventListener('touchmove', function(event) {
    event.preventDefault();
    for (var ii = 0; ii < event.touches.length; ii++) {
      var touch = event.touches[ii];
      if (!$.T[touch.identifier]) continue;
      $.T[touch.identifier].current = {x: touch.screenX, y:touch.screenY};
    }
  });

  $D.addEventListener('touchend', function(event) {
    event.preventDefault();
    for (var id in $.T) {
      var found = false;
      for (var ii = 0; ii < event.touches.length; ii++) {
        if (event.touches[ii].identifier == id) found = true;
      }
      if (found) continue;
      var start_x = $.T[id].initial.x;
      var start_y = $.T[id].initial.y;
      var end_x = $.T[id].current.x;
      var end_y = $.T[id].current.y;
      if (Math.abs(start_x - end_x) + Math.abs(start_y - end_y) < 20) {
        $.events.push({
          $type: 'keypress',
          which: $.K.Z
        });
      }
      if (Math.abs(start_y - end_y) < 60
                 && start_x - end_x > 20) {
        $.events.push({
          $type: 'keypress',
          which: $.K.L
        });
      }
      if (Math.abs(start_y - end_y) < 60
                 && end_x - start_x > 20) {
        $.events.push({
          $type: 'keypress',
          which: $.K.R
        });
      }
      if (Math.abs(start_x - end_x) < 60
                 && end_y - start_y > 20) {
        $.events.push({
          $type: 'keypress',
          which: $.K.D
        });
      }
      if (Math.abs(start_x - end_x) < 60
                 && start_y - end_y > 20) {
        $.events.push({
          $type: 'keypress',
          which: $.K.U
        });
      }


      delete $.T[id];
    }
  });
};

var tickID;

$.tick = function (now) {
  $.scene.preUpdate($.performance.now());
  $.scene.draw($.performance.now());
  $.scene.postUpdate($.performance.now());
  tickID = $W.requestAnimationFrame($.tick);
};

$.run = function (scene) {
  if (tickID) {
    $W.cancelAnimationFrame(tickID);
  }
  if ($.scene) {
    $.scene.exit();
  }
  $.entities = {};
  $.scene = scene;
  $.scene.initialize();
  $.alive = true;
  tickID = $W.requestAnimationFrame($.tick);
};

$.performance = {
  pauseTime: 0,
  now: function () {
    if ($.paused) {
        return $.pauseNow;
    } else {
      return performance.now() - $.performance.pauseTime;
    }
  }
};
$.paused = false;
$.pauseTime = 0;
$.pause = function () {
  $.pauseNow = $.performance.now();
  $.pauseTime = performance.now();
  $.paused = true;
};
$.resume = function () {
  $.performance.pauseTime += performance.now() - $.pauseTime;
  $.paused = false;
};
/*$ Essential functions such as tick and run */
var sl = new $.C();

sl.preUpdate = function (now) {
  $.events = [];
};

sl.draw = function (now) {
  $.x.fillStyle = '#30403b';
  $.x.fillRect(0,0,280,390);
  $.x.fillStyle = '#8ed4a5';
  tx($.x,2,'LOADING'+'...'.substr(0,Math.round(now/500)%4),140,195,1,1);
};
// three '/' represents comments for minification purposes
var smm = (function () {
  var smm = new $.C();
  var gfx;

  smm.initialize = function () {
    gfx = {
      a: 1, //press_space_visible
      f: 1,
      exiting: false,
      choice: 0,
      $S: 0
    };
    $.t({
      o: gfx,
      p: 'f',
      v: 0,
      d: 100
    });
    gfx.blinkID = setInterval(function() {
      gfx.a ^= 1;
    }, 400);
  }

  smm.draw = function () {
    $.x.clearAll();

    $.x.fillStyle = '#30403b';
    $.x.fillRect(
      0,
      0,
      $.v.width,
      $.v.height
    );

    $.x.fillStyle = '#8ed4a5';
    tx($.x,6,'ZODIAC 13',140,125,1,1);

    if (gfx.$S == 0 && gfx.a) {
      $.x.fillStyle = '#fff';
      tx($.x,3,'PRESS   Z',140,250,1,1);
    }
    if (gfx.$S == 1) {
      $.x.fillStyle = gfx.choice == 0 ? '#fff' : '#666';
      tx($.x,3,'GAME START',140,230,1,1);
      $.x.fillStyle = gfx.choice == 1 ? '#fff' : '#666';
      tx($.x,3,'RECORDS',140,278,1,1);
    }

    $.x.fillStyle = '#50605b';
    tx($.x,1,'HERMAN CHAU (KCAZE)',140,380,1,1);

    $.x.fillStyle = 'rgba(0,0,0,'+gfx.f+')';
    $.x.fillRect(0,0,$.v.width,$.v.height);
  }

  smm.preUpdate = function (now) {
    for (var ii = 0; ii < $.events.length; ii++) {
      if ($.events[ii].$type == 'keypress') {
        if (gfx.exiting) continue;
        if ($.events[ii].which == $.K.Z) {
          $.r.sounds['new_sfx_select'].play();
          if (!gfx.$S) {
            gfx.$S = 1;
          } else {
            var s = gfx.choice ? srs : scs;
            gfx.exiting = true;
            $.t({
              o: gfx,
              p: 'f',
              v: 1,
              d: 100
            }).then(function () {
              clearInterval(gfx.blinkID);
              $.run(s);
            });
          }
        }
      }
      if ($.events[ii].which == $.K.U) {
        if (gfx.$S) {
          gfx.choice = Math.max(0, gfx.choice-1);
        }
      }
      if ($.events[ii].which == $.K.D) {
        if (gfx.$S) {
          gfx.choice = Math.min(1, gfx.choice+1);
        }
      }
    }
    $.events = [];
  }

  return smm;
})();
var srs = (function () {
  var scene = new $.C();
  var gfx;
  var $S;

  scene.initialize = function () {
    gfx = {
      f: 1
    };
    $.t({
      o: gfx,
      p: 'f',
      v: 0,
      d: 100
    });
    $S = {
      exiting: false
    };
  }

  scene.draw = function () {
    $.x.clearAll();

    $.x.fillStyle = '#30403b';
    $.x.fillRect(
      0,
      0,
      $.v.width,
      $.v.height
    );

    $.x.fillStyle = '#fff';
    tx($.x, 3, 'RECORDS', 140, 48, 1, 1)
    $.x.font = '12px f';
    for (var ii = 0; ii < records.length; ii++) {
      $.x.fillStyle = '#fff';
      tx($.x, 1, records[ii].text+': ', 12, 90+ii*20, 0, 1);
      $.x.fillStyle = '#8ed4a5';
      var value;
      if (records[ii].name == 'total_time' || records[ii].name == 'max_time') {
        var time = gR(records[ii].name);
        var sec_string = '' + time%60;
        var min_string = '' + (Math.floor(time/60)%60);
        var hour_string = records[ii].name == 'total_time' ? '' + Math.floor(time/3600) + ':' : '';
        value = hour_string+'0'.repeat(2-min_string.length) + min_string + ':'  + '0'.repeat(2-sec_string.length)+sec_string;
      } else {
        value = ''+gR(records[ii].name);
      }
      tx($.x, 1, value, 268, 90+ii*20, 2, 1);
    }

    $.x.fillStyle = 'rgba(0,0,0,'+gfx.f+')';
    $.x.fillRect(0,0,$.v.width,$.v.height);
  }

  scene.preUpdate = function (now) {
    for (var ii = 0; ii < $.events.length; ii++) {
      if ($S.exiting) continue;
      if ($.events[ii].$type == 'keypress') {
        if ($.events[ii].which == $.K.X || $.events[ii].which == $.K.Z) {
          $S.exiting = true;
          $.t({
            o: gfx,
            p: 'f',
            v: 1,
            d: 100
          }).then(function () {
            $.run(smm);
          });
        }
      }
    }
    $.events = [];
  };

  return scene;
})();
var character;
var scs = (function () {
  var scene = new $.C();
  var $S;

  var characters;

  scene.initialize = function () {
    $S = {
      s: 0, //selected
      exiting: false,
      f: 1 //f
    }
    $.t({
      o: $S,
      p: 'f',
      v: 0,
      d: 100});
    characters = [
      {
        d: 'ENDS TURN WHITE',
        name: 'BOAR',
        image: $.r.i.b,
        m: '13 WHITE ORBS IN A ROW',
        u: gR('max_white_orbs') >= 13,
        zodiac: function (data) {
          var $S = data.$S;
          for (var yy = 0; yy < 8; yy++) {
            if ($S.board[yy][0].t && $S.board[yy][0].t != 1) {
              $S.board[yy][0].t = 1;
              data.animateColorChange($S.board[yy][0].piece, 1);
            }
            if ($S.board[yy][7].t && $S.board[yy][7].t != 1) {
              $S.board[yy][7].t = 1;
              data.animateColorChange($S.board[yy][7].piece, 1);
            }
          }
        }
      },
      {
        d: 'CLEAR ROW ABOVE',
        name: 'CAT',
        image: $.r.i.c,
        u: true,
        zodiac: function (data) {
          var $S = data.$S;
          var row = data.row-1;
          var row_pieces = [];
          for (var xx = 0; xx < 8; xx++) {
            if ($S.board[row][xx].piece) {
              row_pieces.push($S.board[row][xx].piece);
            }
            $S.board[row][xx] = {
              t: 0
            };
          }
          data.animateClearPieces(row_pieces);
        }
      },
      {
        d: 'CLEAR LEFT SIDE',
        name: 'DOG',
        image: $.r.i.d,
        m: '169 ORBS SHOT',
        u: gR('total_orbs') >= 169,
        zodiac: function (data) {
          var board = data.$S.board;
          var pieces = [];
          for (var yy = 0; yy < 8; yy++) {
            if (board[yy][0].t) {
              pieces.push(board[yy][0].piece);
              board[yy][0].t = 0;
            }
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        d: 'CLEAR 4 ON ENDS',
        name: 'DRAGON',
        image: $.r.i.e,
        m: 'SCORE 169',
        u: gR('max_score') >= 169,
        zodiac: function(data) {
          var leftCounter = 4;
          var rightCounter = 4;
          var pieces = [];
          var board = data.$S.board;
          for (var yy = 7; yy >= 0; yy--) {
            if (leftCounter) {
              if (board[yy][0].t) {
                pieces.push(board[yy][0].piece);
                board[yy][0].t = 0;
                leftCounter--;
              }
            }
            if (rightCounter) {
              if (board[yy][7].t) {
                pieces.push(board[yy][7].piece);
                board[yy][7].t = 0;
                rightCounter--;
              }
            }
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        d: 'CLEAR 12 RANDOM',
        name: 'HARE',
        image: $.r.i.f,
        m: 'REACH LEVEL 13',
        u: gR('max_level') >= 13,
        zodiac: function(data) {
          var board = data.$S.board;
          var count = 0;
          var pieces = [];
          var piece_locs = [];
          for (var yy = 0; yy < 17; yy++) {
            for (var xx = 0; xx < 8; xx++) {
              if (board[yy][xx].t) {
                piece_locs.push({x:xx,y:yy});
              }
            }
          }
          count = Math.min(piece_locs.length, 12);
          for (var ii = 0; ii < count; ii++) {
            var idx = Math.floor(Math.random()*piece_locs.length);
            var xx = piece_locs[idx].x;
            var yy = piece_locs[idx].y;
            pieces.push(board[yy][xx].piece);
            board[yy][xx].t = 0;
            pieces.splice(idx, 1);
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        d: 'SCORE +2',
        name: 'HORSE',
        image: $.r.i.g,
        m: 'ZODIAC 13 TIMES',
        u: gR('total_zodiac') >= 13,
        zodiac: function(data) {
          data.incrementScore(2);
        }
      },
      {
        d: 'DELAY ROW DROP',
        name: 'MONKEY',
        image: $.r.i.h,
        m: 'ZODIAC 169 TIMES',
        u: gR('total_zodiac') >= 169,
        zodiac: function (data) {
          var $S = data.$S;
          $S.next_row_time_diff = $S.next_row_time - $.performance.now();
          $S.next_row_freeze = true;
          setTimeout(function() {
            $S.next_row_freeze = false;
          }, 5000);
        }
      },
      {
        d: 'ENDS TURN BLACK',
        name: 'OX',
        image: $.r.i.i,
        m: '13 BLACK ORBS IN A ROW',
        u: gR('max_black_orbs') >= 13,
        zodiac: function (data) {
          var $S = data.$S;
          for (var yy = 0; yy < 17; yy++) {
            if ($S.board[yy][0].t && $S.board[yy][0].t != 2) {
              $S.board[yy][0].t = 2;
              data.animateColorChange($S.board[yy][0].piece, 2);
            }
            if ($S.board[yy][7].t && $S.board[yy][7].t != 2) {
              $S.board[yy][7].t = 2;
              data.animateColorChange($S.board[yy][7].piece, 2);
            }
          }
        }
      },
      {
        d: 'NEXT ALL WHITE',
        name: 'RAT',
        image: $.r.i.k,
        m: '1313 ORBS SHOT',
        u: gR('total_orbs') >= 1313,
        zodiac: function (data) {
          for (var ii = 0; ii < 8; ii++) {
            data.$S.player.next[ii] = 1;
          }
        }
      },
      {
        d: 'CLEAR RIGHT SIDE',
        name: 'ROOSTER',
        image: $.r.i.l,
        m: 'SURVIVE 13 MINUTES',
        u: gR('max_time') >= 13*60,
        zodiac: function (data) {
          var board = data.$S.board;
          var pieces = [];
          for (var yy = 0; yy < 17; yy++) {
            if (board[yy][7].t) {
              pieces.push(board[yy][7].piece);
              board[yy][7].t = 0;
            }
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        d: 'CLEAR TOP ROW',
        name: 'SHEEP',
        image: $.r.i.m,
        m: 'SCORE 13',
        u: gR('max_score') >= 13,
        zodiac: function (data) {
          var $S = data.$S;
          var row_pieces = [];
          for (var xx = 0; xx < 8; xx++) {
            if ($S.board[0][xx].piece) {
              row_pieces.push($S.board[0][xx].piece);
            }
            $S.board[0][xx] = {
              t: 0
            };
          }
          data.animateClearPieces(row_pieces);
        }
      },
      {
        d: 'NEXT ALL BLACK',
        name: 'SNAKE',
        image: $.r.i.n,
        m: 'PLAY 13 GAMES',
        u: gR('play_count') >= 13,
        zodiac: function (data) {
          for (var ii = 0; ii < 8; ii++) {
            data.$S.player.next[ii] = 2;
          }
        }
      },
      {
        d: 'SCORE +LEVEL/3',
        name: 'TIGER',
        image: $.r.i.o,
        m: '169 ROWS CLEARED',
        u: gR('total_rows') >= 169,
        zodiac: function (data) {
          data.incrementScore(Math.floor(data.$S.level/3));
        }
      },
      {
        d: '',
        name: 'RANDOM',
        image: $.r.i.p,
        u: true
      }
    ];
  }

  scene.draw = function (now) {
    $.x.clearAll();

    $.x.save();
    $.x.fillStyle = '#30403b';
    $.x.fillRect(
      0,
      0,
      $.v.width,
      $.v.height
    );
    $.x.restore();

    for (var yy = 0; yy < 7; yy++) {
      for (var xx = 0; xx < 2; xx++) {
        var idx = yy*2 + xx;
        if (idx >= characters.length) break;
        $.x.strokeStyle = '#89928e';
        $.x.lineWidth = 0.5;
        $.x.fillStyle = '#50605b';
        $.x.fillRect(xx*49 + 11, yy*49 + 21, 48, 48) ;
        $.x.strokeRect(xx*49 + 10, yy*49 + 20, 50, 50) ;
        $.x.drawImage(
          characters[idx].image,
          xx*49 + 10,
          yy*49 + 20
        )
        if (!characters[idx].u) {
          $.x.fillStyle = 'rgba(0,0,0,0.7)';
          $.x.fillRect(xx*49 + 11, yy*49 + 21, 48, 48) ;
        }
      }
    }
    if (Math.floor(now/200) % 3) {
      $.x.strokeStyle = '#fff';
      $.x.lineWidth = 1;
      $.x.strokeRect(($S.s%2)*49 + 10, Math.floor($S.s/2)*49 + 20, 50, 50) ;
    }
    $.x.fillStyle = '#fff';
    tx($.x, 3, characters[$S.s].name, 270, 330, 2, 1);
    $.x.font = '16px f';
    if (characters[$S.s].u) {
      $.x.fillStyle = 'white';
      tx($.x, 1, characters[$S.s].d, 270, 355, 2, 1);
    } else {
      $.x.fillStyle = '#50605b';
      tx($.x, 1, characters[$S.s].m, 270, 355, 2, 1);
    }
    $.x.fillStyle = 'rgba(0,0,0,'+$S.f+')';
    $.x.fillRect(0,0,$.v.width,$.v.height);
  }

  scene.preUpdate = function (now) {
    for (var ii = 0; ii < $.events.length; ii++) {
      if ($S.exiting) continue;
      if ($.events[ii].$type == 'keypress') {
        if ($.events[ii].which == $.K.R) {
          $S.s = Math.min(13, $S.s+1);
        } else if ($.events[ii].which == $.K.D) {
          $S.s = Math.min(13, $S.s+2);
        } else if ($.events[ii].which == $.K.L) {
          $S.s = Math.max(0, $S.s-1);
        } else if ($.events[ii].which == $.K.U) {
          $S.s = Math.max(0, $S.s-2);
        } else if ($.events[ii].which == $.K.Z) {
          if ($S.s == 13) {
            $S.s = Math.floor(Math.random() * 13);
            while (!characters[$S.s].u) {
              $S.s = Math.floor(Math.random() * 13);
            }
          }
          if (characters[$S.s].u) {
            $.r.sounds['new_sfx_select'].play();
            character = characters[$S.s];
            $S.exiting = true;
            $.t({
              o: $S,
              p: 'f',
              v: 1,
              d: 100
            }).then(function () {
              $.run(sg);
            });
          } else {
            $.r.sounds['new_sfx_denied'].play();
          }
        } else if ($.events[ii].which == $.K.X) {
          $S.exiting = true;
          $.t({
            o: $S,
            p: 'f',
            v: 1,
            d: 100
          }).then(function () {
            $.run(smm);
          });
        }
      }
    }
    $.events = [];
  }

  return scene;
})();
// three '/' represents comments for minification purposes
var previous_time;

var sg = (function () {
  var b_v = $D.createElement('canvas');
  var i_v = $D.createElement('canvas');
  var p_v = $D.createElement('canvas');
  var g_v = $D.createElement('canvas');
  b_v.width = 160;
  b_v.height = 390;
  i_v.width = 96;
  i_v.height = 390;
  g_v.width = 280;
  g_v.height = 390;
  p_v.width = 280;
  p_v.height = 390;
  var b_x = b_v.getContext('2d');
  var i_x = i_v.getContext('2d');
  var g_x = g_v.getContext('2d');
  var p_x = p_v.getContext('2d');
  var $S;
  var pause_choice;
  var gfx;
  var bgm;

  function pause() {
    $.pause();
    pause_choice = 0;
    // copy over game picture at pause time
    p_x.clearRect(
      0,
      0,
      p_v.width,
      p_v.height
    );
    p_x.drawImage(
      $.v,
      0,
      0
    );
    $.t({
      o: gfx,
      p: 'p_a',
      v: 0.8,
      d: 50
    });
  }

  function resume() {
    $.t({
      o: gfx,
      p: 'p_a',
      v: 0,
      d: 50
    }).then($.resume);
  }

  // TODO: I think this is unnecessary and can be killed
  function blankPromise() {
    return new Promise(function (resolve) {
      resolve();
    });
  }

  function randomPieceType(piece_type_array) {
    var length = piece_type_array.length;
    return piece_type_array[Math.floor(Math.random()*length)];
  }

  function makePiece(x, y, piece_type) {
    return new $.E({
      x: x,
      y: y,
      type: piece_type,
      alpha: 1,
      blend_alpha: 0,
      blend_type: 0,
      a: blankPromise() //actions_promise
    });
  }

  function pieceTypeImage(piece_type) {
    return [
      $.r.i.s,
      $.r.i.r,
      $.r.i.t
    ][piece_type-1];
  }

  function piece_to_board(piece_coord) {
    return Math.floor((piece_coord - 1) / 20);
  }

  function board_to_piece(board_coord) {
    return 1 + 20 * board_coord;
  }

  /*^ Messy section of game logic */
  function lose() {
    bgm.mystop();
    $S.a = false;

    // copy over game picture at losing time
    g_x.clearRect(
      0,
      0,
      g_v.width,
      g_v.height
    );
    g_x.drawImage(
      $.v,
      0,
      0
    );
    // fade to black
    $.t({
      o: gfx,
      p: 'gba',
      v: 1,
      d: 1000
    }).then(function () {
      return $.t({
        o: gfx,
        p: 'gameover_text_alpha',
        v: 1,
        d: 1000
      });
    }).then(function () {
      $S.can_restart = true;
    });
  }

  function clearRow() {
    var row;
    var activateAbility = false;

    for (var yy = 0; yy < 17; yy++) {
      var piece_type = $S.board[yy][0].t;
      var zodiacCounter = 0;
      var cleared = true;
      for (var xx = 0; xx < 8; xx++) {
        if ($S.board[yy][xx].t == 3) {
          zodiacCounter++;
        }
        // wow, much hack. this works because zodiac = 3, so it ANDs with
        // both 1 (black) and 2 (white) to be nonzero.
        piece_type &= $S.board[yy][xx].t;
        if (!piece_type) {
          cleared = false;
          break;
        }
      }
      if (cleared) {
        if (zodiacCounter > 0) {
          activateAbility = true;
        }
        row = yy;
        break;
      }
    }

    if (typeof row === 'undefined') return;

    // update score
    incrementScore(1);
    $S.rows_cleared += 1;
    iR('total_rows', 1);
    mR('max_rows', $S.rows_cleared);
    if ($S.rows_cleared % 10 == 0) {
      $S.level += 1;
      mR('max_level', $S.level);
      $S.next_row_interval = Math.max(3000, $S.next_row_interval - 750);
    }

    // capture row pieces before we update board so we can animate them
    var row_pieces = [];
    for (var xx = 0; xx < 8; xx++) {
      row_pieces.push($S.board[row][xx].piece);
    }

    // update of underlying board
    for (xx = 0; xx < 8; xx++) {
      $S.board[row][xx] = {
        t:0
      };
    }

    // animation
    animateClearPieces(row_pieces);

    // activate zodiac
    if (!activateAbility) return;
    $S.zodiacs++;
    iR('total_zodiac', 1);
    mR('max_zodiac', $S.zodiacs);
    character.zodiac({
      $S: $S,
      animateClearPieces: animateClearPieces,
      animateColorChange: animateColorChange,
      incrementScore: incrementScore,
      row: row
    });
  }

  function animateClearPieces(pieces) {
    $.r.sounds['new_sfx_clear'].play();
    // animate fade away
    // ensure that all row piece animations have finished
    var promise  = [];
    pieces.forEach(function (piece) {
      promise.push(piece.a);
    })
    promise = Promise.all(promise);
    pieces.forEach(function (piece) {
      var piecePromise = promise.then(function () {
        return $.t({
          o: piece,
          p: 'alpha',
          v: 0,
          d: 100
        }).then(function () {
          piece.destroy();
        });
      });
      piece.a = piecePromise;
    });
  }

  function drop() {
    for (var yy = 16; yy > 0; yy--) {
      for (var xx = 0; xx < 8; xx++) {
        if ($S.board[yy][xx].t && !$S.board[yy-1][xx].t) {
          $S.board[yy-1][xx] = $S.board[yy][xx];
          $S.board[yy][xx] = {
            t:0
          };
          var piece = $S.board[yy-1][xx].piece;
          (function (piece) {
            // ensure we start the animation AFTER the row fades away
            piece.a = piece.a.then(function () {
              return $.t({
                o: piece,
                p: 'y',
                v: piece.y - 20,
                d: 100
              });
            });
          })(piece);
        }
      }
    }
  }

  function reverse(board_x, board_y) {
    var dxs = [1, -1, 0, 0, 1, 1, -1, -1];
    var dys = [0, 0, 1, -1, 1, -1, 1, -1];
    var piece_type = $S.board[board_y][board_x].t;

    if (piece_type == 0|| piece_type == 3) return

    for (var ii = 0; ii < 8; ii++) {
      var dx = dxs[ii];
      var dy = dys[ii];
      var reverse = false;
      var length = 1;
      var x = board_x + length * dx;
      var y = board_y + length * dy;
      while (0 <= x
             && 0 <= y
             && x < 8
             && y < 17) {
        if ($S.board[y][x].t ==0
          || $S.board[y][x].t == 3) break;
        if ($S.board[y][x].t == piece_type) {
          reverse = true;
          break;
        }
        length++;
        x = board_x + length * dx;
        y = board_y + length * dy;
      }
      if (!reverse) continue;
      for (var jj = 1; jj < length; jj++) {
        var xx = board_x + jj * dx;
        var yy = board_y + jj * dy;
        $S.board[yy][xx].t = piece_type;
        var piece = $S.board[yy][xx].piece;
        animateColorChange(piece, piece_type);
      }
    }
  }

  function incrementScore(amount) {
    $S.score += amount;
    mR('max_score', $S.score);
  }

  function animateColorChange(piece, to_type) {
    piece.a = piece.a.then(function () {
      return new Promise(function(resolve) {
        piece.blend_type = to_type;
        $.t({
          o: piece,
          p: 'blend_alpha',
          v: 1,
          d: 100
        }).then(function() {
          piece.type = to_type;
          piece.blend_type = 0;
          piece.blend_alpha = 0;
          resolve();
        });
      });
    });
  }

  function addRow() {
    $.r.sounds['new_sfx_drop'].play();
    var new_row = [];
    for (var ii = 0; ii < 8; ii++) {
      var piece_type = randomPieceType([1,2]);
      new_row.push({
        t: piece_type,
        piece: makePiece(
          board_to_piece(ii),
          board_to_piece(-1),
          piece_type
        )
      });
    }
    // if all colors the same, change the color of last one
    var piece_type = new_row[7].t;
    for (var ii = 0; ii < 8; ii++) {
      piece_type ^= new_row[ii].t;
    }
    if (piece_type) {
      new_row[7].t ^= 3;
      new_row[7].piece.type ^= 3;
    }

    // update board
    for (var xx = 0; xx < 8; xx++) {
      if ($S.board[16][xx].t) {
        lose();
        return;
      }
      for (var yy = 16; yy > 0; yy--) {
        $S.board[yy][xx] = $S.board[yy-1][xx];
      }
      $S.board[0][xx] = new_row[xx];
    }

    // animate pieces
    $S.board.forEach(function (row) {
      row.forEach(function (square) {
        var piece = square.piece;
        if (!piece) return;
        piece.a = piece.a.then(function () {
          return $.t({
            o: piece,
            p: 'y',
            v: piece.y + 20,
            r: 1
          });
        });
      });
    });
  }
  /*$ Messy section of game logic */

  function initialize() {
    iR('play_count', 1);
    bgm = $.r.sounds['bgm_game'].play(true);
    bgm.mystop = function () {
      if (!bgm.stopped) {bgm.stop(0); bgm.stopped = 1;}
    };
  // initialize gfx
    gfx = {
      background_pattern: $.x.createPattern(
        $.r.i.a,
        'repeat'),
      p_a: 0,
      gba: 0,
      gameover_text_alpha: 0,
      f: 1
    }
    $.t({
      o: gfx,
      p: 'f',
      v: 0,
      d: 100});


  // intialize $S
    $S = {
      a: true,
      b: $.performance.now(),
      board: [],
      can_restart: false,
      exiting: false,
      score: 0,
      level: 1,
      rows_cleared: 0,
      next_row_interval: 20000,
      next_row_time: 0,
      next_row_time_diff: 0,
      next_row_freeze: false,
      zodiacs: 0,
      consecutive: {
        1: 0,
        2: 0,
        3: 0
      }
    };
    $S.next_row_time = $.performance.now() + $S.next_row_interval;
    // initialize board
    for (var yy = 0; yy < 17; yy++) {
      $S.board.push([]);
      for (var xx = 0; xx < 8; xx++) {
        // initialize board to have two random rows
        if (yy < 2) {
          var piece_type = randomPieceType([1,2]);
          var piece = makePiece(
            board_to_piece(xx),
            board_to_piece(yy),
            piece_type
          );
          $S.board[yy].push({
            t: piece_type,
            piece: piece
          });
          // check if all colors if the same. if so, change the color of the last
          if (xx == 7) {
            var piece_type = $S.board[yy][0].t;
            for (var xxx = 0; xxx < 8; xxx++) {
              piece_type &= $S.board[yy][xxx].t
            }
            if (piece_type) {
              $S.board[yy][7].t ^= 3;
              $S.board[yy][7].piece.type ^= 3;
            }
          }
        } else {
          $S.board[yy].push({
            t:0
          });
        }
      }
    }
    pause_choice = 0;
    // initialize player
    $S.player = new $.E({
      frames: [
        $.r.i.u,
        $.r.i.v,
        $.r.i.w,
        $.r.i.v
      ],
      frame_lengths: [
        500,
        200,
        200,
        200
      ],
      current_frame: 0,
      animate_timer: $.performance.now(),
      animate: function (now) {
        var dt = now - this.animate_timer;
        if (dt > this.frame_lengths[this.current_frame]) {
          this.current_frame++;
          this.current_frame %= this.frames.length;
          this.animate_timer = now;
        }
      },
      x: 4,
      sprite_x: 84,
      sprite_y: 363,
      a: blankPromise(),
      draw: function (context) {
        context.drawImage(
          this.frames[this.current_frame],
          this.sprite_x,
          this.sprite_y);
        // draw aiming line
        var h;
        for (h = 16; h >= 0; h--) {
          if ($S.board[h][this.x].t) {
            break;
          }
        }
        b_x.save();
        b_x.globalAlpha = 1;
        b_x.lineWidth = 1;
        b_x.setLineDash([2, 8]);
        b_x.strokeStyle = '#8ed4a5';
        b_x.beginPath();
        b_x.moveTo(
          this.sprite_x+5,
          this.sprite_y-8
        );
        b_x.lineTo(
          this.sprite_x+5,
          (h+1) * 20 + 20
        );
        b_x.stroke();
        b_x.restore();
      },
      listen: function (event) {
        if (event.$type == 'keypress') {
          if (event.which == $.K.L) this.move(-1);
          if (event.which == $.K.R) this.move(1);
          if (event.which == $.K.Z) this.shoot();
        } else if (event.$type == 'keyheld') {
          if (event.which == $.K.L) this.move(-1);
          if (event.which == $.K.R) this.move(1);
        }
      },
      move: function (dx) {
        if (this.x+dx >= 0 && this.x+dx < 8) {
          this.x += dx;
          this.a = this.a.then(function () {
            return $.t({
              o: this,
              p: 'sprite_x',
              v: this.sprite_x + dx*20,
              r: 0.7
            }).then(function () {
              return blankPromise();
            }.bind(this));
          }.bind(this));
        }
      },
      next: [],
      shoot : function() {
        if ($S.board[16][this.x].t) {
          lose();
          return;
        }

        iR('total_orbs', 1);

        var piece_type = this.next.shift();
        var next_piece_type = Math.random()*16 > 1
          ? randomPieceType([1,2])
          : 3;
        this.next.push(next_piece_type);

        // update consecutive counts
        if ($S.consecutive[piece_type]) {
          $S.consecutive[piece_type]++;
        } else {
          $S.consecutive[1] = 0;
          $S.consecutive[2] = 0;
          $S.consecutive[3] = 0;
          $S.consecutive[piece_type] = 1;
        }
        var pieceTypeRecordMap = {
          1: 'max_white_orbs',
          2: 'max_black_orbs',
          3: 'max_zodiac_orbs'
        };
        mR(pieceTypeRecordMap[piece_type], $S.consecutive[piece_type]);

        var target_y = 16;
        while (target_y > 0) {
          if ($S.board[target_y-1][this.x].t
              != 0) {
            break;
          }
          target_y--;
        }
        var piece = makePiece(
          this.x*20 + 1,
          321,
          piece_type
        );
        $S.board[target_y][this.x] = {
          t: piece_type,
          piece: piece
        };
        reverse(this.x, target_y);

        piece.a = piece.a.then(function () {
          $.r.sounds['new_sfx_shoot'].play();
          return $.t({
            o: piece,
            p: 'y',
            v: board_to_piece(target_y),
            r: 3
          });
        });
       }
    });
    for (var ii = 0; ii < 8; ii++) {
      $S.player.next.push(randomPieceType([1,2]));
      if (Math.random()*16 < 1) {
        $S.player.next[ii] = 3;
      }
    }
  }

  function drawAlive(now) {
    // clear contexts
    b_x.clearRect(
      0,
      0,
      b_v.width,
      b_v.height
    );
    i_x.clearRect(
      0,
      0,
      i_v.width,
      i_v.height
    );

    // board context drawing
      // background translucent box
    b_x.fillStyle = 'rgba(0,0,0,0.5)';
    b_x.fillRect(
      0,
      0,
      b_v.width,
      b_v.height
    );
      // draw board line
    b_x.save();
    b_x.globalAlpha = 1;
    b_x.lineWidth = 1;
    b_x.strokeStyle = '#50605b';
    b_x.beginPath();
    b_x.moveTo(
      0,
      360
    );
    b_x.lineTo(
      160,
      360
    );
    b_x.stroke();
    b_x.restore();
      // draw pieces
    for (var id in $.entities) {
      var piece = $.entities[id];
      // only piece entities have a type field
      if (!piece.type) continue;
      b_x.globalAlpha = piece.alpha;
      b_x.drawImage(
        pieceTypeImage(piece.type),
        piece.x,
        piece.y+20
      );
      if (piece.blend_type) {
        b_x.globalAlpha = piece.blend_alpha;
        b_x.drawImage(
          pieceTypeImage(piece.blend_type),
          piece.x,
          piece.y+20
        );
      }
    };
      // draw player
    b_x.globalAlpha = 1;
    $S.player.draw(b_x);

      // draw timer
    b_x.fillStyle = 'rgba(0, 0, 0, 0.5)';
    b_x.fillRect(
      0,
      8,
      b_v.width,
      5
    );
    if ($S.next_row_freeze) {
      b_x.fillStyle = 'rgb(80, 96, 91)';
    } else {
      b_x.fillStyle = 'rgb(142, 212, 165)';
    }
    b_x.fillRect(
      0,
      8,
      b_v.width * ($S.next_row_time - now) / $S.next_row_interval,
      5
    );

    // info context drawing
      // draw translucent boxes
    i_x.fillStyle = 'rgba(0, 0, 0, 0.5)';
        // character box
    i_x.fillRect(
      0,
      10,
      i_v.width,
      i_v.width
    );
        // next pieces box
    i_x.fillRect(
      0,
      117,
      i_v.width,
      80
    );
        // score box
    i_x.fillRect(
      0,
      208,
      i_v.width,
      50
    );
        // level box
    i_x.fillRect(
      0,
      269,
      i_v.width,
      50
    );
        // time box
    i_x.fillRect(
      0,
      330,
      i_v.width,
      50
    );

      // draw text
    i_x.font = '24px f';
    i_x.fillStyle = '#fff';
    tx(i_x, 3, 'NEXT', 48, 122, 1, 0);
    tx(i_x, 3, 'SCORE', 48, 213, 1, 0);
    tx(i_x, 3, 'LEVEL', 48, 273, 1, 0);
    tx(i_x, 3, 'TIME', 48, 335, 1, 0);
    tx(i_x, 3, character.name, 48, 97, 1, 2);
    tx(i_x, 3, '' + $S.level, 48, 314, 1, 2);
    var score_string = '' + $S.score;
        // pad with zeroes
    score_string = '0'.repeat(5 - score_string.length) + score_string;
    tx(i_x, 3, score_string, 48, 255, 1, 2);
    var time = Math.floor(($.performance.now() - $S.b)/1000);
    var sec_string = '' + time%60;
    var min_string = '' + Math.floor(time/60);
    time_string = '0'.repeat(2-min_string.length) + min_string + ':'  + '0'.repeat(2-sec_string.length)+sec_string;
    tx(i_x, 3, time_string, 48, 377, 1, 2);

      // draw sprites
    for (var ii = 0; ii < 8; ii++) {
      i_x.drawImage(
        pieceTypeImage($S.player.next[ii]),
        9+(ii%4)*20,
        148 + Math.floor(ii/4)*23
      );
    }

    i_x.drawImage(
      character.image,
      23,
      20
    );

    // main context drawing
    $.x.fillStyle = '#50605b';
    $.x.fillRect(0, 0, $.v.width, $.v.height);
    $.x.fillStyle = gfx.background_pattern;
    $.x.fillRect(0, 0, $.v.width, $.v.height);
    $.x.drawImage(b_v, 10, 0);
    $.x.drawImage(
      i_v,
      10 + b_v.width + 7,
      0
    );
    $.x.fillStyle = 'rgba(0,0,0,'+gfx.f+')';
    $.x.fillRect(0,0,$.v.width,$.v.height);
  }

  function preUpdateAlive(now) {
    mR('max_time', Math.floor((now - $S.b)/1000));
    for (var ii = 0; ii < $.events.length; ii++) {
      if ($.events[ii].$type == 'keypress' &&
          $.events[ii].which == $.K.X) {
        pause();
        $.events = [];
        return;
      }
    }
    $.processEvents();
    $S.player.animate(now);
    if ($S.next_row_freeze) {
      $S.next_row_time = now + $S.next_row_time_diff;
    }
    if ($S.next_row_time < now) {
      addRow();
      $S.next_row_time = now + $S.next_row_interval;
    }
    clearRow();
    drop();
  }

  function drawPause(now) {
    $.x.clearAll();
    $.x.drawImage(
      p_v,
      0,
      0
    );
    $.x.globalAlpha = gfx.p_a;
    $.x.fillStyle = '#000000';
    $.x.fillRect(
      0,
      0,
      $.v.width,
      $.v.height
    );
    $.x.globalAlpha = 1;
    $.x.fillStyle = pause_choice == 0 ? '#fff' : '#666';
    tx($.x, 3, 'RESUME', 140, 147, 1, 1);
    $.x.fillStyle = pause_choice == 1 ? '#fff' : '#666';
    tx($.x, 3, 'RESTART', 140, 195, 1, 1);
    $.x.fillStyle = pause_choice == 2 ? '#fff' : '#666';
    tx($.x, 3, 'QUIT', 140, 243, 1, 1);
    $.x.fillStyle = 'rgba(0,0,0,'+gfx.f+')';
    $.x.fillRect(0,0,$.v.width,$.v.height);
  }

  function drawDead(now) {
    $.x.clearAll();
    $.x.save();
    $.x.globalAlpha = 1;
    $.x.drawImage(
      g_v,
      0,
      0
    );
    $.x.globalAlpha = gfx.gba;
    $.x.fillStyle = '#8ed4a5';
    $.x.fillRect(
      10,
      ($.v.height / 2) - 28,
      160,
      42
    );
    $.x.globalAlpha = gfx.gameover_text_alpha;
    $.x.fillStyle = '#fff';
    tx($.x, 3, 'GAME OVER', 90, 188, 1, 1);
    $.x.restore();
    $.x.fillStyle = 'rgba(0,0,0,'+gfx.f+')';
    $.x.fillRect(0,0,$.v.width,$.v.height);
  }

  function preUpdateDead(now) {
    for (var ii = 0; ii < $.events.length; ii++) {
      if ($S.exiting) continue;
      if ($.events[ii].$type == 'keypress' &&
          $.events[ii].which == $.K.Z &&
          $S.can_restart) {
        $S.exiting = true;
        $.t({
          o: gfx,
          p: 'f',
          v: 1,
          d: 100}).then(function () {
            $.run(smm);
          })
      }
    }
    $.events = [];
  }

  function preUpdatePause(now) {
    for (var ii = 0; ii < $.events.length; ii++) {
      if ($.events[ii].$type == 'keypress') {
        if ($S.exiting) continue;
        if ($.events[ii].which == $.K.X) {
          resume();
        }
        if ($.events[ii].which == $.K.D) {
          pause_choice = Math.min(2, pause_choice+1);
        }
        if ($.events[ii].which == $.K.U) {
          pause_choice = Math.max(0, pause_choice-1);
        }
        if ($.events[ii].which == $.K.Z) {
          resume();
          if (pause_choice == 1) {
            $S.exiting = true;
            $.t({
              o: gfx,
              p: 'f',
              v: 1,
              d: 100}).then(function () {
                $.run(sg);
              });
          } else if (pause_choice) {
            $S.exiting = true;
            $.t({
              o: gfx,
              p: 'f',
              v: 1,
              d: 100}).then(function () {
                $.run(smm);
              });
          }
        }
      }
    }
    $.events = [];
  }

  var sg = new $.C();
  sg.initialize = initialize;
  sg.draw = function (now) {
    if (!$.paused) {
      $S.a ? drawAlive(now) : drawDead(now);
    } else {
      drawPause(now);
    }
  };
  sg.preUpdate = function (now) {
    if (!$.paused) {
      $S.a ? preUpdateAlive(now) : preUpdateDead(now);
    } else {
      preUpdatePause(now);
    }
  };
  sg.exit = function () {
    bgm.mystop();
  }
  return sg
})();
// Globals(prefixed with $):
// $x -- sonantx

function lsfx(data, resolve) { //loadsonant sfx
  var songGen = new $x.S(data.i);
  songGen.createAudioBuffer(data.n, resolve);
}
function ls(data, resolve) { //loadsonant
  var songGen = new $x.M(data);
  songGen.createAudioBuffer(resolve);
}

var resources = {
  i: {
    a: {x:36,y:263,w:32,h:32}, //background
    b: {x:0,y:0,w:50,h:50,W:37,H:39,f:1}, //character_boar
    c: {x:37,y:0,w:50,h:50,W:42,H:38,f:1}, //character_cat
    d: {x:0,y:39,w:50,h:50,W:40,H:42,f:1}, //character_dog
    e: {x:40,y:38,w:50,h:50,W:45,H:40,f:1}, //character_dragon
    f: {x:0,y:81,w:50,h:50,W:35,H:40,f:1}, //character_hare
    g: {x:35,y:81,w:50,h:50,W:41,H:43,f:1}, //character_horse
    h: {x:0,y:121,w:50,h:50,W:30,H:44,f:1}, //character_monkey
    i: {x:30,y:124,w:50,h:50,W:42,H:32,f:1}, //character_ox
    k: {x:0,y:165,w:50,h:50,W:41,H:39,f:1}, //character_rat
    l: {x:41,y:156,w:50,h:50,W:35,H:36,f:1}, //character_rooster
    m: {x:0,y:205,w:50,h:50,W:43,H:43,f:1}, //character_sheep
    n: {x:43,y:192,w:50,h:50,W:34,H:34,f:1}, //character_snake
    o: {x:0,y:248,w:50,h:50,W:36,H:41,f:1}, //chraacter_tiger
    p: {x:43,y:226,w:50,h:50,W:21,H:37,f:1}, //character_random
    r: {x:65,y:226,w:17,h:17}, // piece_black
    s: {x:64,y:243,w:17,h:17}, // piece_white
    t: {x:72,y:124,w:17,h:17}, //piece_zodiac
    u: {x:68,y:260,w:9,h:22,W:9,H:22,f:1}, //shooter_0
    v: {x:76,y:81,w:9,h:22,W:5,H:22,f:1}, // shooter_1
    w: {x:76,y:156,w:9,h:22,W:1,H:22,f:1} //shooter_2
  },
  sounds: {
    'new_sfx_drop' : {
      loader: lsfx,
      data: {n:147, i: {
    ac: 7,
    aa: 0,
    h: 0,
    y: 1,
    r: 255,
    t: 0,
    i: 7,
    m: 0,
    v: 0,
    b: 1,
    d: 146,
    a: 0,
    g: 0,
    ab: 50,
    x: 0,
    w: 2727,
    _: 254,
    j: 2,
    o: 200,
    k: 254,
    n: 0,
    s: 21,
    l: 0,
    c: 0,
    f: 0,
    u: 0,
    z: 0,
    e: 0,
    p: 0
}
      }
    },
    'new_sfx_clear': {
      loader: lsfx,
      data: {n: 191, i: {
    ac: 7,
    aa: 0,
    h: 0,
    y: 0,
    r: 255,
    t: 0,
    i: 8,
    m: 0,
    v: 12,
    b: 0,
    d: 255,
    a: 0,
    g: 0,
    ab: 200,
    x: 7105,
    w: 11102,
    _: 255,
    j: 2,
    o: 11025,
    k: 171,
    n: 3,
    s: 77,
    l: 0,
    c: 0,
    f: 0,
    u: 1,
    z: 2,
    e: 210,
    p: 0
}
      }
    },
    'new_sfx_denied': {
      loader: lsfx,
      data: {n: 144, i: {
    ac: 7,
    aa: 0,
    h: 0,
    y: 0,
    r: 255,
    t: 2,
    i: 5,
    m: 0,
    v: 2,
    b: 1,
    d: 255,
    a: 2,
    g: 0,
    ab: 0,
    x: 1979,
    w: 2653,
    _: 255,
    j: 2,
    o: 7261,
    k: 162,
    n: 2,
    s: 73,
    l: 2,
    c: 61,
    f: 0,
    u: 1,
    z: 0,
    e: 0,
    p: 3
      }}
    },
    'new_sfx_select': {
      loader: lsfx,
      data: {n: 175, i: {
    ac: 7,
    aa: 0,
    h: 0,
    y: 0,
    r: 255,
    t: 3,
    i: 8,
    m: 0,
    v: 0,
    b: 0,
    d: 255,
    a: 0,
    g: 107,
    ab: 22,
    x: 444,
    w: 6338,
    _: 255,
    j: 3,
    o: 7355,
    k: 176,
    n: 4,
    s: 45,
    l: 2,
    c: 84,
    f: 0,
    u: 1,
    z: 3,
    e: 96,
    p: 0
}}},
    'new_sfx_shoot': {
      loader: lsfx,
      data: {n:190, i:{
    ac: 7,
    aa: 0,
    h: 0,
    y: 1,
    r: 255,
    t: 0,
    i: 7,
    m: 0,
    v: 0,
    b: 1,
    d: 255,
    a: 0,
    g: 0,
    ab: 0,
    x: 548,
    w: 4611,
    _: 255,
    j: 2,
    o: 2702,
    k: 255,
    n: 0,
    s: 0,
    l: 0,
    c: 0,
    f: 0,
    u: 0,
    z: 0,
    e: 0,
    p: 0
}}
    },
    'bgm_game': {
      loader: ls,
      data:
      {
    "endPattern": 382,
    "songData": [
        {
            "a": 0,
            "b": 0,
            "c": 108,
            "d": 0,
            "e": 187,
            "f": 0,
            "g": 60,
            "h": 0,
            "i": 8,
            "j": 1,
            "k": 120,
            "l": 5,
            "m": 0,
            "n": 4,
            "o": 10332,
            "p": 0,
            "r": 0,
            "s": 16,
            "t": 0,
            "notes": [
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0,
                147,
                0,
                0,
                0
            ],
            "u": 0,
            "v": 0,
            "w": 4607,
            "x": 419,
            "y": 0,
            "z": 5,
            "_": 130,
            "aa": 0,
            "ab": 50,
            "ac": 8
        },
        {
            "a": 0,
            "b": 0,
            "c": 0,
            "d": 255,
            "e": 96,
            "f": 0,
            "g": 0,
            "h": 0,
            "i": 8,
            "j": 2,
            "k": 60,
            "l": 0,
            "m": 0,
            "n": 1,
            "o": 4067,
            "p": 0,
            "r": 255,
            "s": 45,
            "t": 0,
            "notes": [
                160,
                0,
                160,
                0,
                155,
                0,
                0,
                0,
                148,
                160,
                162,
                0,
                163,
                162,
                160,
                0,
                163,
                0,
                163,
                162,
                163,
                0,
                151,
                163,
                165,
                0,
                0,
                0,
                167,
                0,
                165,
                0,
                167,
                0,
                163,
                0,
                162,
                0,
                163,
                0,
                156,
                0,
                151,
                162,
                158,
                0,
                0,
                0,
                151,
                0,
                155,
                0,
                151,
                0,
                150,
                0,
                151,
                0,
                150,
                0,
                151,
                0,
                150,
                155,
                160,
                0,
                160,
                0,
                155,
                0,
                148,
                0,
                160,
                0,
                162,
                0,
                160,
                0,
                158,
                160,
                160,
                0,
                158,
                0,
                162,
                160,
                158,
                151,
                146,
                0,
                153,
                0,
                158,
                0,
                153,
                150,
                150,
                0,
                153,
                0,
                151,
                0,
                153,
                0,
                151,
                156,
                158,
                0,
                153,
                0,
                151,
                0,
                158,
                0,
                155,
                0,
                153,
                0,
                151,
                0,
                163,
                0,
                0,
                163,
                0,
                158,
                0,
                151,
                160,
                0,
                160,
                155,
                0,
                160,
                155,
                0,
                0,
                160,
                0,
                162,
                160,
                158,
                160,
                156,
                158,
                0,
                153,
                0,
                150,
                0,
                156,
                0,
                158,
                150,
                143,
                0,
                138,
                0,
                150,
                138,
                150,
                0,
                141,
                0,
                138,
                0,
                150,
                138,
                150,
                0,
                141,
                0,
                0,
                138,
                0,
                150,
                150,
                0,
                148,
                0,
                151,
                0,
                150,
                0,
                148,
                0,
                153,
                160,
                151,
                0,
                0,
                0,
                160,
                0,
                160,
                0,
                156,
                0,
                153,
                0,
                151,
                150,
                0,
                160,
                0,
                156,
                0,
                153,
                153,
                0,
                146,
                0,
                153,
                0,
                158,
                0,
                165,
                0,
                153,
                150,
                153,
                0,
                155,
                0,
                155,
                0,
                153,
                155,
                153,
                0,
                151,
                0,
                153,
                0,
                153,
                0,
                151,
                0,
                153,
                0,
                153,
                0,
                158,
                0,
                160,
                0,
                158,
                0,
                151,
                146,
                151,
                0,
                0,
                0,
                153,
                0,
                163,
                0,
                0,
                0,
                163,
                160,
                163,
                0,
                156,
                0,
                151,
                163,
                170,
                0,
                167,
                163,
                170,
                0,
                160,
                0,
                151,
                163,
                170,
                0,
                167,
                163,
                170,
                0,
                160,
                0,
                0,
                0,
                160,
                0,
                0,
                0,
                170,
                0,
                168,
                0,
                167,
                0,
                0,
                167,
                0,
                170,
                0,
                168,
                168,
                0,
                167,
                0,
                165,
                0,
                167,
                0,
                168,
                0,
                165,
                0,
                0,
                168,
                0,
                165,
                163,
                0,
                163,
                156,
                0,
                0,
                151,
                0,
                0,
                151,
                0,
                156,
                0,
                158,
                0,
                156,
                158,
                0,
                151,
                144,
                156,
                158,
                0,
                151,
                144,
                158,
                0,
                151,
                144,
                156,
                158,
                0,
                158,
                0,
                155,
                0,
                158,
                153,
                151,
                0,
                153,
                165,
                153,
                0,
                148,
                0,
                146,
                0,
                146,
                0,
                153,
                0,
                148,
                0,
                151,
                0,
                155,
                0,
                158,
                0,
                155,
                0
            ],
            "u": 1,
            "v": 0,
            "w": 13163,
            "x": 0,
            "y": 0,
            "z": 3,
            "_": 255,
            "aa": 0,
            "ab": 22,
            "ac": 7
        },
        {
            "a": 2,
            "b": 0,
            "c": 0,
            "d": 157,
            "e": 0,
            "f": 0,
            "g": 0,
            "h": 0,
            "i": 6,
            "j": 2,
            "k": 76,
            "l": 2,
            "m": 0,
            "n": 3,
            "o": 3900,
            "p": 0,
            "r": 192,
            "s": 0,
            "t": 2,
            "notes": [
                160,
                0,
                148,
                0,
                160,
                0,
                148,
                0,
                160,
                172,
                148,
                160,
                172,
                172,
                148,
                0,
                146,
                0,
                170,
                0,
                158,
                158,
                170,
                146,
                158,
                158,
                158,
                146,
                158,
                146,
                0,
                156,
                168,
                156,
                168,
                156,
                0,
                168,
                156,
                156,
                0,
                168,
                0,
                144,
                0,
                144,
                0,
                155,
                0,
                143,
                167,
                167,
                0,
                167,
                155,
                155,
                155,
                167,
                155,
                143,
                0,
                160,
                160,
                148,
                160,
                148,
                172,
                148,
                0,
                160,
                0,
                160,
                172,
                148,
                0,
                148,
                0,
                146,
                0,
                158,
                0,
                158,
                158,
                170,
                170,
                146,
                170,
                170,
                158,
                158,
                158,
                158,
                156,
                0,
                156,
                0,
                144,
                168,
                156,
                168,
                144,
                168,
                156,
                156,
                144,
                156,
                156,
                0,
                155,
                0,
                143,
                155,
                143,
                0,
                155,
                143,
                167,
                155,
                155,
                143,
                167,
                143,
                0,
                160,
                172,
                172,
                160,
                160,
                148,
                172,
                160,
                0,
                148,
                0,
                160,
                0,
                160,
                0,
                158,
                0,
                158,
                0,
                158,
                146,
                0,
                158,
                158,
                158,
                0,
                158,
                0,
                146,
                0,
                168,
                156,
                168,
                168,
                168,
                144,
                156,
                168,
                156,
                168,
                156,
                0,
                144,
                0,
                143,
                155,
                143,
                155,
                143,
                167,
                143,
                155,
                167,
                0,
                155,
                0,
                155,
                0,
                155,
                0,
                148,
                160,
                160,
                0,
                172,
                0,
                148,
                0,
                160,
                160,
                148,
                0,
                160,
                160,
                0,
                146,
                0,
                170,
                0,
                158,
                0,
                146,
                0,
                158,
                0,
                146,
                0,
                146,
                0,
                158,
                0,
                156,
                156,
                156,
                0,
                144,
                0,
                168,
                168,
                144,
                0,
                156,
                168,
                156,
                156,
                144,
                0,
                143,
                155,
                143,
                0,
                143,
                0,
                155,
                0,
                143,
                155,
                167,
                167,
                155,
                0,
                143,
                0,
                151,
                0,
                163,
                0,
                151,
                0,
                151,
                0,
                163,
                0,
                151,
                0,
                151,
                163,
                151,
                0,
                160,
                0,
                148,
                0,
                172,
                160,
                148,
                0,
                160,
                172,
                148,
                160,
                148,
                0,
                160,
                0,
                144,
                168,
                168,
                168,
                144,
                0,
                156,
                156,
                156,
                0,
                156,
                0,
                144,
                168,
                168,
                158,
                0,
                158,
                0,
                146,
                0,
                158,
                0,
                158,
                0,
                158,
                170,
                146,
                158,
                158,
                0,
                151,
                0,
                163,
                175,
                175,
                0,
                163,
                163,
                163,
                151,
                175,
                151,
                0,
                151,
                0,
                160,
                0,
                148,
                0,
                148,
                0,
                160,
                172,
                148,
                0,
                148,
                0,
                160,
                0,
                148,
                0,
                156,
                0,
                144,
                156,
                144,
                168,
                156,
                168,
                144,
                0,
                156,
                0,
                156,
                0,
                144,
                0,
                158,
                170,
                158,
                0,
                158,
                0,
                158,
                0,
                170,
                0,
                158,
                170
            ],
            "u": 1,
            "v": 0,
            "w": 12631,
            "x": 2418,
            "y": 0,
            "z": 0,
            "_": 139,
            "aa": 0,
            "ab": 0,
            "ac": 5
        }
    ],
    "rowLen": 1739,
    "songLen": 46
    }
    }
  }
};

$W.onload = function() {
  $.initialize('canvas');
  $.run(sl);

  $.L(resources).then(function () {
    $.run(smm);
    setInterval(function () {
      iR('total_time', 1);
    }, 1000);
  });
};
/**
 * Records to store:
 * 1. Number of games played (play_count)
 * 2. Total time spent playing in seconds (total_time)
 * 3. Highscore in one game (max_score)
 * 4. Highest level gotten to (max_level)
 * 5. Total number of zodiac abilities activated (total_zodiac)
 * 6. Maximum number of zodiac abilities activated in one game (max_zodiac)
 * 7. Number of orbs shot (total_orbs)
 * 8. Maximum number of white orbs ever shot in a row (max_white_orbs)
 * 9. Maximum number of black orbs ever shot in a row (max_black_orbs)
 * 10. Maximum number of zodiac orbs ever shot in a row (max_zodiac_orbs)
 * 11. Maximum number of rows cleared in one game (max_rows)
 * 12. Total number of rows cleared ever (total_rows)
 * 13. Maximum time survived in one single game in seconds (max_time)
 */
var records = [
  {text: 'GAMES PLAYED', name:'play_count'},
  {text: 'TOTAL TIME SPENT', name:'total_time'},
  {text: 'LONGEST TIME SURVIVED', name: 'max_time'},
  {text: 'HIGHEST SCORE OBTAINED', name:'max_score'},
  {text: 'HIGHEST LEVEL REACHED', name:'max_level'},
  {text: 'TOTAL ROWS CLEARED', name: 'total_rows'},
  {text: 'MOST ROWS CLEARED IN ONE GAME', name: 'max_rows'},
  {text: 'TOTAL ZODIAC CLEARS', name:'total_zodiac'},
  {text: 'MOST ZODIACS CLEARS IN ONE GAME', name:'max_zodiac'},
  {text: 'TOTAL ORBS SHOT', name:'total_orbs'},
  {text: 'MAX CONSECUTIVE WHITE ORBS', name:'max_white_orbs'},
  {text: 'MAX CONSECUTIVE BLACK ORBS', name:'max_black_orbs'},
  {text: 'MAX CONSECUTIVE ZODIAC ORBS', name:'max_zodiac_orbs'}];
(function() {
  records.forEach(function (record) {
    if (!localStorage.getItem(record.name)) {
      localStorage.setItem(record.name, '0');
    }
  });
})();

function iR(name, value) {
  localStorage.setItem(
    name,
    parseInt(localStorage.getItem(name), 10) + value);
}

function mR(name, value) {
  localStorage.setItem(
    name,
    Math.max(parseInt(localStorage.getItem(name), 10), value));
}

function gR(name) {
  return parseInt(localStorage.getItem(name),10);
}
