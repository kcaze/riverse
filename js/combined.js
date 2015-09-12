var $W = window;
var $D = document;
function b6(base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
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
	var buffer = kz.a.createBuffer(1, 1, 22050);
	var source = kz.a.createBufferSource();
	source.buffer = buffer;
	source.connect(kz.a.destination);
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

function genBuffer(waveSize, callBack) {
    setTimeout(function() {
        // Create the channel work buffer
        var buf = new Uint8Array(waveSize * WAVE_CHAN * 2);
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
$x.A = function(mixBuf) {
    this.mixBuf = mixBuf;
    this.waveSize = mixBuf.length / WAVE_CHAN / 2;
};
$x.A.prototype.getWave = function() {
    var mixBuf = this.mixBuf;
    var waveSize = this.waveSize;
    // Local variables
    var b, k, x, wave, l1, l2, s, y;

    // Turn critical object properties into local variables (performance)
    var waveBytes = waveSize * WAVE_CHAN * 2;

    // Convert to a WAVE file (in a binary string)
    l1 = waveBytes - 8;
    l2 = l1 - 36;
    wave = String.fromCharCode(82,73,70,70,
                               l1 & 255,(l1 >> 8) & 255,(l1 >> 16) & 255,(l1 >> 24) & 255,
                               87,65,86,69,102,109,116,32,16,0,0,0,1,0,2,0,
                               68,172,0,0,16,177,2,0,4,0,16,0,100,97,116,97,
                               l2 & 255,(l2 >> 8) & 255,(l2 >> 16) & 255,(l2 >> 24) & 255);
    b = 0;
    while(b < waveBytes)
    {
        // This is a GC & speed trick: don't add one char at a time - batch up
        // larger partial strings
        x = "";
        for (k = 0; k < 256 && b < waveBytes; ++k, b += 2)
        {
            // Note: We amplify and clamp here
            y = 4 * (mixBuf[b] + (mixBuf[b+1] << 8) - 32768);
            y = y < -32768 ? -32768 : (y > 32767 ? 32767 : y);
            x += String.fromCharCode(y & 255, (y >> 8) & 255);
        }
        wave += x;
    }
    return wave;
};
$x.A.prototype.getAudio = function() {
    var wave = this.getWave();
    var a = new Audio("data:audio/wav;base64," + btoa(wave));
    a.preload = "none";
    a.load();
    return a;
};
$x.A.prototype.getAudioBuffer = function(callBack) {
    if (audioCtx === null)
        audioCtx = new AudioContext();
    var mixBuf = this.mixBuf;
    var waveSize = this.waveSize;

    var buffer = audioCtx.createBuffer(WAVE_CHAN, this.waveSize, WAVE_SPS); // Create Mono Source Buffer from Raw Binary
    var lchan = buffer.getChannelData(0);
    var rchan = buffer.getChannelData(1);
    var b = 0;
    var iterate = function() {
        var beginning = new Date();
        var count = 0;
        while (b < waveSize) {
            var y = 4 * (mixBuf[b * 4] + (mixBuf[(b * 4) + 1] << 8) - 32768);
            y = y < -32768 ? -32768 : (y > 32767 ? 32767 : y);
            lchan[b] = y / 32768;
            y = 4 * (mixBuf[(b * 4) + 2] + (mixBuf[(b * 4) + 3] << 8) - 32768);
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

    // State variable init
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

        // State variable filter
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
$x.S.prototype.createAudio = function(n, callBack) {
    this.getAudioGenerator(n, function(ag) {
        callBack(ag.getAudio());
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
    this.waveSize = WAVE_SPS * song.songLen; // Total song size (in samples)
};
$x.M.prototype.generateTrack = function ($i, mixBuf, callBack) {
    var self = this;
    genBuffer(this.waveSize, function($c) {
        // Preload/precalc some properties/expressions (for improved performance)
        var $w = self.waveSize,
            waveBytes = self.waveSize * WAVE_CHAN * 2,
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
                var x2 = mixBuf[b2] + (mixBuf[b2+1] << 8) + $c[b2] + ($c[b2+1] << 8) - 32768;
                mixBuf[b2] = x2 & 255;
                mixBuf[b2+1] = (x2 >> 8) & 255;
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
    genBuffer(this.waveSize, function(mixBuf) {
        var t = 0;
        var recu = function() {
            if (t < self.song.songData.length) {
                t += 1;
                self.generateTrack(self.song.songData[t - 1], mixBuf, recu);
            } else {
                callBack(new $x.A(mixBuf));
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

/**
 * SfxrSynth
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
function SfxrSynth() {
  // All variables are kept alive through function closures

  //--------------------------------------------------------------------------
  //
  //  Sound Parameters
  //
  //--------------------------------------------------------------------------

  this._params = new SfxrParams();  // Params instance

  //--------------------------------------------------------------------------
  //
  //  Synth Variables
  //
  //--------------------------------------------------------------------------

  var _envelopeLength0, // Length of the attack stage
      _envelopeLength1, // Length of the sustain stage
      _envelopeLength2, // Length of the decay stage

      _period,          // Period of the wave
      _maxPeriod,       // Maximum period before sound stops (from minFrequency)

      _slide,           // Note slide
      _deltaSlide,      // Change in slide

      _changeAmount,    // Amount to change the note by
      _changeTime,      // Counter for the note change
      _changeLimit,     // Once the time reaches this limit, the note changes

      _squareDuty,      // Offset of center switching point in the square wave
      _dutySweep;       // Amount to change the duty by

  //--------------------------------------------------------------------------
  //
  //  Synth Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Resets the runing variables from the params
   * Used once at the start (total reset) and for the repeat effect (partial reset)
   */
  this.reset = function() {
    // Shorter reference
    var p = this._params;

    _period       = 100 / (p['f'] * p['f'] + .001);
    _maxPeriod    = 100 / (p['g']   * p['g']   + .001);

    _slide        = 1 - p['h'] * p['h'] * p['h'] * .01;
    _deltaSlide   = -p['i'] * p['i'] * p['i'] * .000001;

    if (!p['a']) {
      _squareDuty = .5 - p['n'] / 2;
      _dutySweep  = -p['o'] * .00005;
    }

    _changeAmount =  1 + p['l'] * p['l'] * (p['l'] > 0 ? -.9 : 10);
    _changeTime   = 0;
    _changeLimit  = p['m'] == 1 ? 0 : (1 - p['m']) * (1 - p['m']) * 20000 + 32;
  }

  // I split the reset() function into two functions for better readability
  this.totalReset = function() {
    this.reset();

    // Shorter reference
    var p = this._params;

    // Calculating the length is all that remained here, everything else moved somewhere
    _envelopeLength0 = p['b']  * p['b']  * 100000;
    _envelopeLength1 = p['c'] * p['c'] * 100000;
    _envelopeLength2 = p['e']   * p['e']   * 100000 + 12;
    // Full length of the volume envelop (and therefore sound)
    // Make sure the length can be divided by 3 so we will not need the padding "==" after base64 encode
    return ((_envelopeLength0 + _envelopeLength1 + _envelopeLength2) / 3 | 0) * 3;
  }

  /**
   * Writes the wave to the supplied buffer ByteArray
   * @param buffer A ByteArray to write the wave to
   * @return If the wave is finished
   */
  this.synthWave = function(buffer, length) {
    // Shorter reference
    var p = this._params;

    // If the filters are active
    var _filters = p['s'] != 1 || p['v'],
        // Cutoff multiplier which adjusts the amount the wave position can move
        _hpFilterCutoff = p['v'] * p['v'] * .1,
        // Speed of the high-pass cutoff multiplier
        _hpFilterDeltaCutoff = 1 + p['w'] * .0003,
        // Cutoff multiplier which adjusts the amount the wave position can move
        _lpFilterCutoff = p['s'] * p['s'] * p['s'] * .1,
        // Speed of the low-pass cutoff multiplier
        _lpFilterDeltaCutoff = 1 + p['t'] * .0001,
        // If the low pass filter is active
        _lpFilterOn = p['s'] != 1,
        // masterVolume * masterVolume (for quick calculations)
        _masterVolume = p['x'] * p['x'],
        // Minimum frequency before stopping
        _minFreqency = p['g'],
        // If the phaser is active
        _phaser = p['q'] || p['r'],
        // Change in phase offset
        _phaserDeltaOffset = p['r'] * p['r'] * p['r'] * .2,
        // Phase offset for phaser effect
        _phaserOffset = p['q'] * p['q'] * (p['q'] < 0 ? -1020 : 1020),
        // Once the time reaches this limit, some of the    iables are reset
        _repeatLimit = p['p'] ? ((1 - p['p']) * (1 - p['p']) * 20000 | 0) + 32 : 0,
        // The punch factor (louder at begining of sustain)
        _sustainPunch = p['d'],
        // Amount to change the period of the wave by at the peak of the vibrato wave
        _vibratoAmplitude = p['j'] / 2,
        // Speed at which the vibrato phase moves
        _vibratoSpeed = p['k'] * p['k'] * .01,
        // The type of wave to generate
        _waveType = p['a'];

    var _envelopeLength      = _envelopeLength0,     // Length of the current envelope stage
        _envelopeOverLength0 = 1 / _envelopeLength0, // (for quick calculations)
        _envelopeOverLength1 = 1 / _envelopeLength1, // (for quick calculations)
        _envelopeOverLength2 = 1 / _envelopeLength2; // (for quick calculations)

    // Damping muliplier which restricts how fast the wave position can move
    var _lpFilterDamping = 5 / (1 + p['u'] * p['u'] * 20) * (.01 + _lpFilterCutoff);
    if (_lpFilterDamping > .8) {
      _lpFilterDamping = .8;
    }
    _lpFilterDamping = 1 - _lpFilterDamping;

    var _finished = false,     // If the sound has finished
        _envelopeStage    = 0, // Current stage of the envelope (attack, sustain, decay, end)
        _envelopeTime     = 0, // Current time through current enelope stage
        _envelopeVolume   = 0, // Current volume of the envelope
        _hpFilterPos      = 0, // Adjusted wave position after high-pass filter
        _lpFilterDeltaPos = 0, // Change in low-pass wave position, as allowed by the cutoff and damping
        _lpFilterOldPos,       // Previous low-pass wave position
        _lpFilterPos      = 0, // Adjusted wave position after low-pass filter
        _periodTemp,           // Period modified by vibrato
        _phase            = 0, // Phase through the wave
        _phaserInt,            // Integer phaser offset, for bit maths
        _phaserPos        = 0, // Position through the phaser buffer
        _pos,                  // Phase expresed as a Number from 0-1, used for fast sin approx
        _repeatTime       = 0, // Counter for the repeats
        _sample,               // Sub-sample calculated 8 times per actual sample, averaged out to get the super sample
        _superSample,          // Actual sample writen to the wave
        _vibratoPhase     = 0; // Phase through the vibrato sine wave

    // Buffer of wave values used to create the out of phase second wave
    var _phaserBuffer = new Array(1024),
        // Buffer of random values used to generate noise
        _noiseBuffer  = new Array(32);
    for (var i = _phaserBuffer.length; i--; ) {
      _phaserBuffer[i] = 0;
    }
    for (var i = _noiseBuffer.length; i--; ) {
      _noiseBuffer[i] = Math.random() * 2 - 1;
    }

    for (var i = 0; i < length; i++) {
      if (_finished) {
        return i;
      }

      // Repeats every _repeatLimit times, partially resetting the sound parameters
      if (_repeatLimit) {
        if (++_repeatTime >= _repeatLimit) {
          _repeatTime = 0;
          this.reset();
        }
      }

      // If _changeLimit is reached, shifts the pitch
      if (_changeLimit) {
        if (++_changeTime >= _changeLimit) {
          _changeLimit = 0;
          _period *= _changeAmount;
        }
      }

      // Acccelerate and apply slide
      _slide += _deltaSlide;
      _period *= _slide;

      // Checks for frequency getting too low, and stops the sound if a minFrequency was set
      if (_period > _maxPeriod) {
        _period = _maxPeriod;
        if (_minFreqency > 0) {
          _finished = true;
        }
      }

      _periodTemp = _period;

      // Applies the vibrato effect
      if (_vibratoAmplitude > 0) {
        _vibratoPhase += _vibratoSpeed;
        _periodTemp *= 1 + Math.sin(_vibratoPhase) * _vibratoAmplitude;
      }

      _periodTemp |= 0;
      if (_periodTemp < 8) {
        _periodTemp = 8;
      }

      // Sweeps the square duty
      if (!_waveType) {
        _squareDuty += _dutySweep;
        if (_squareDuty < 0) {
          _squareDuty = 0;
        } else if (_squareDuty > .5) {
          _squareDuty = .5;
        }
      }

      // Moves through the different stages of the volume envelope
      if (++_envelopeTime > _envelopeLength) {
        _envelopeTime = 0;

        switch (++_envelopeStage)  {
          case 1:
            _envelopeLength = _envelopeLength1;
            break;
          case 2:
            _envelopeLength = _envelopeLength2;
        }
      }

      // Sets the volume based on the position in the envelope
      switch (_envelopeStage) {
        case 0:
          _envelopeVolume = _envelopeTime * _envelopeOverLength0;
          break;
        case 1:
          _envelopeVolume = 1 + (1 - _envelopeTime * _envelopeOverLength1) * 2 * _sustainPunch;
          break;
        case 2:
          _envelopeVolume = 1 - _envelopeTime * _envelopeOverLength2;
          break;
        case 3:
          _envelopeVolume = 0;
          _finished = true;
      }

      // Moves the phaser offset
      if (_phaser) {
        _phaserOffset += _phaserDeltaOffset;
        _phaserInt = _phaserOffset | 0;
        if (_phaserInt < 0) {
          _phaserInt = -_phaserInt;
        } else if (_phaserInt > 1023) {
          _phaserInt = 1023;
        }
      }

      // Moves the high-pass filter cutoff
      if (_filters && _hpFilterDeltaCutoff) {
        _hpFilterCutoff *= _hpFilterDeltaCutoff;
        if (_hpFilterCutoff < .00001) {
          _hpFilterCutoff = .00001;
        } else if (_hpFilterCutoff > .1) {
          _hpFilterCutoff = .1;
        }
      }

      _superSample = 0;
      for (var j = 8; j--; ) {
        // Cycles through the period
        _phase++;
        if (_phase >= _periodTemp) {
          _phase %= _periodTemp;

          // Generates new random noise for this period
          if (_waveType == 3) {
            for (var n = _noiseBuffer.length; n--; ) {
              _noiseBuffer[n] = Math.random() * 2 - 1;
            }
          }
        }

        // Gets the sample from the oscillator
        switch (_waveType) {
          case 0: // Square wave
            _sample = ((_phase / _periodTemp) < _squareDuty) ? .5 : -.5;
            break;
          case 1: // Saw wave
            _sample = 1 - _phase / _periodTemp * 2;
            break;
          case 2: // Sine wave (fast and accurate approx)
            _pos = _phase / _periodTemp;
            _pos = (_pos > .5 ? _pos - 1 : _pos) * 6.28318531;
            _sample = 1.27323954 * _pos + .405284735 * _pos * _pos * (_pos < 0 ? 1 : -1);
            _sample = .225 * ((_sample < 0 ? -1 : 1) * _sample * _sample  - _sample) + _sample;
            break;
          case 3: // Noise
            _sample = _noiseBuffer[Math.abs(_phase * 32 / _periodTemp | 0)];
        }

        // Applies the low and high pass filters
        if (_filters) {
          _lpFilterOldPos = _lpFilterPos;
          _lpFilterCutoff *= _lpFilterDeltaCutoff;
          if (_lpFilterCutoff < 0) {
            _lpFilterCutoff = 0;
          } else if (_lpFilterCutoff > .1) {
            _lpFilterCutoff = .1;
          }

          if (_lpFilterOn) {
            _lpFilterDeltaPos += (_sample - _lpFilterPos) * _lpFilterCutoff;
            _lpFilterDeltaPos *= _lpFilterDamping;
          } else {
            _lpFilterPos = _sample;
            _lpFilterDeltaPos = 0;
          }

          _lpFilterPos += _lpFilterDeltaPos;

          _hpFilterPos += _lpFilterPos - _lpFilterOldPos;
          _hpFilterPos *= 1 - _hpFilterCutoff;
          _sample = _hpFilterPos;
        }

        // Applies the phaser effect
        if (_phaser) {
          _phaserBuffer[_phaserPos % 1024] = _sample;
          _sample += _phaserBuffer[(_phaserPos - _phaserInt + 1024) % 1024];
          _phaserPos++;
        }

        _superSample += _sample;
      }

      // Averages out the super samples and applies volumes
      _superSample *= .125 * _envelopeVolume * _masterVolume;

      // Clipping if too loud
      buffer[i] = _superSample >= 1 ? 32767 : _superSample <= -1 ? -32768 : _superSample * 32767 | 0;
    }

    return length;
  }
}

// Adapted from http://codebase.es/riffwave/
var synth = new SfxrSynth();
// Export for the Closure Compiler
$W['jsfxr'] = function(settings) {
  // Initialize SfxrParams
  synth._params.setSettings(settings);
  // Synthesize Wave
  var envelopeFullLength = synth.totalReset();
  var data = new Uint8Array(((envelopeFullLength + 1) / 2 | 0) * 4 + 44);
  var used = synth.synthWave(new Uint16Array(data.buffer, 44), envelopeFullLength) * 2;
  var dv = new Uint32Array(data.buffer, 0, 44);
  // Initialize header
  dv[0] = 0x46464952; // "RIFF"
  dv[1] = used + 36;  // put total size here
  dv[2] = 0x45564157; // "WAVE"
  dv[3] = 0x20746D66; // "fmt "
  dv[4] = 0x00000010; // size of the following
  dv[5] = 0x00010001; // Mono: 1 channel, PCM format
  dv[6] = 0x0000AC44; // 44,100 samples per second
  dv[7] = 0x00015888; // byte rate: two bytes per sample
  dv[8] = 0x00100002; // 16 bits per sample, aligned on every two bytes
  dv[9] = 0x61746164; // "data"
  dv[10] = used;      // put number of samples here

  // Base64 encoding written by me, @maettig
  used += 44;
  var i = 0,
      base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
      output = 'data:audio/wav;base64,';
  for (; i < used; i += 3)
  {
    var a = data[i] << 16 | data[i + 1] << 8 | data[i + 2];
    output += base64Characters[a >> 18] + base64Characters[a >> 12 & 63] + base64Characters[a >> 6 & 63] + base64Characters[a & 63];
  }
  return output;
}
// L -- loadResources
// I -- loadImages
// S -- loadSounds
// K -- KEYS
// T -- TOUCHES
// r -- resources
// x -- context
// v -- canvas
// t -- tween
// a -- audio_context

var kz = {};

/*^ Functions for loading resources */
// queue is an object with names as keys and image paths as values
kz.L = function (resources) {
  var promises = [];
  kz.r = {};

  promises.push(kz.I(resources.i));
  promises.push(kz.S(resources.sounds));

  return Promise.all(promises)
    .then(function () {
      return kz.r;
    });
};

kz.I = function (queue) {
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
                  kz.r.i = i;
                  return kz.r.i;
                });
};

kz.a = new AudioContext();
kz.S = function (queue) {
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
            var source = kz.a.createBufferSource();
            source.loop = loop;
            source.buffer = this.buffer;
            source.connect(kz.a.destination);
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
                  kz.r.sounds = sounds;
                  return kz.r.sounds;
                });
};
/*$ Functions for loading resources */

/*^ Keys */
kz.K = {
  X: 27, // ESCAPE
  L: 37, // LEFT
  U: 38, // UP
  R: 39, // RIGHT
  D: 40, // DOWN
  Z: 90 // Z
};

kz.keys_status = {};
for (var ii = 0; ii < 256; ii++) {
  kz.keys_status[ii] = 0;
}
/*$ Keys */

/*^ Touches */
kz.T = {};
/*$ Touches */

/*^ Tween */
/**
 * kz.tween()
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
kz.t = function (tween) {
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
kz.events = [];

kz.sendEvent = function(event) {
  kz.events.push(event);
}

kz.processEvents = function () {
  for (var ii = 0; ii < kz.events.length; ii++) {
    for (var id in kz.entities) {
      kz.entities[id].listen(kz.events[ii]);
    }
  }
  kz.events = [];
};
/*$ Events */

/*^ The Entity object */
kz.__entity_id__ = 0;
/**
 * @constructor
 */
kz.Entity = function (properties) {
  for (name in properties) {
    if (!properties.hasOwnProperty(name)) continue;
    this[name] = properties[name];
  }
  /*if (typeof this.x !== 'number') {
    throw 'Entity.x must be a number';
  }
  if (typeof this.y !== 'number') {
    throw 'Entity.y must be a number';
  }
  if (typeof this.listen !== 'function') {
    throw 'Entity.listen must be a function';
  }*/
  this.__entity_id__ = kz.__entity_id__;
  kz.entities[this.__entity_id__] = this;
  kz.__entity_id__++;
};

kz.Entity.prototype.x = 0;
kz.Entity.prototype.y = 0;
kz.Entity.prototype.listen = function () {
};
kz.Entity.prototype.destroy = function () {
  delete kz.entities[this.__entity_id__];
};
/*$ The Entity object */

/*^ The Scene object */
/**
 * @constructor
 */
kz.Scene = function () {};
/*kz.Scene = function (functions) {
  if (typeof functions.initialize === 'function') {
    this.initialize = functions.initialize;
    //throw 'Scene.initialize must be function';
  }
  if (typeof functions.preUpdate === 'function') {
    this.preUpdate = functions.preUpdate;
    //throw 'Scene.preUpdate must be function';
  }
  if (typeof functions.postUpdate === 'function') {
    this.postUpdate = functions.postUpdate;
    //throw 'Scene.postUpdate must be function';
  }
  if (typeof functions.draw === 'function') {
    this.draw = functions.draw;
    //throw 'Scene.draw must be function';
  }
};*/

kz.Scene.prototype.initialize = function () {
};

kz.Scene.prototype.preUpdate = function () {
};

kz.Scene.prototype.postUpdate = function () {
};

kz.Scene.prototype.draw = function () {
};

kz.Scene.prototype.exit = function () {
};

// duck-typing check
/*kz.isSceneLike = function(object) {
  return (object !== undefined &&
    object !== null &&
    typeof object.initialize === 'function' &&
    typeof object.preUpdate === 'function' &&
    typeof object.postUpdate === 'function' &&
    typeof object.draw === 'function');
};*/
/*$ The Scene object */

/*^ Essential functions such as initialize, tick, and run */
kz.initializeCanvas = function (canvas_id) {
  kz.v = $D.getElementById(canvas_id);
  kz.x = kz.v.getContext('2d');
  kz.x.clearAll = function () {
    kz.x.clearRect(0, 0, kz.v.width, kz.v.height);
  };
};

kz.initialize = function (canvas_id) {
  kz.initializeCanvas(canvas_id);

  $D.addEventListener('keydown', function(event) {
    event.preventDefault();
    if (kz.keys_status[event.which] == 0) {
      kz.keys_status[event.which] = 1;
      event.kztype = 'keypress';
    } else {
      event.kztype = 'keyheld';
    }
    kz.events.push(event);
  });

  $D.addEventListener('keyup', function(event) {
    event.preventDefault();
    event.kztype = 'keyup';
    kz.keys_status[event.which] = 0;
    kz.events.push(event);
  });

  // touch events
  $D.addEventListener('touchstart', function(event) {
    //event.preventDefault();
    for (var ii = 0; ii < event.touches.length; ii++) {
      var touch = event.touches[ii];
      if (kz.T[touch.identifier]) continue;
      kz.T[touch.identifier] = {
        initial: {x: touch.screenX, y: touch.screenY},
        current: {x: touch.screenX, y: touch.screenY}
      };
    }
  });

  $D.addEventListener('touchmove', function(event) {
    event.preventDefault();
    for (var ii = 0; ii < event.touches.length; ii++) {
      var touch = event.touches[ii];
      if (!kz.T[touch.identifier]) continue;
      kz.T[touch.identifier].current = {x: touch.screenX, y:touch.screenY};
    }
  });

  $D.addEventListener('touchend', function(event) {
    event.preventDefault();
    for (var id in kz.T) {
      var found = false;
      for (var ii = 0; ii < event.touches.length; ii++) {
        if (event.touches[ii].identifier == id) found = true;
      }
      if (found) continue;
      var start_x = kz.T[id].initial.x;
      var start_y = kz.T[id].initial.y;
      var end_x = kz.T[id].current.x;
      var end_y = kz.T[id].current.y;
      if (Math.abs(start_x - end_x) + Math.abs(start_y - end_y) < 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.K.Z
        });
      }
      if (Math.abs(start_y - end_y) < 60
                 && start_x - end_x > 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.K.L
        });
      }
      if (Math.abs(start_y - end_y) < 60
                 && end_x - start_x > 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.K.R
        });
      }
      if (Math.abs(start_x - end_x) < 60
                 && end_y - start_y > 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.K.D
        });
      }
      if (Math.abs(start_x - end_x) < 60
                 && start_y - end_y > 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.K.U
        });
      }


      delete kz.T[id];
    }
  });
};

var tickID;

kz.tick = function (now) {
  kz.scene.preUpdate(kz.performance.now());
  kz.scene.draw(kz.performance.now());
  kz.scene.postUpdate(kz.performance.now());
  tickID = $W.requestAnimationFrame(kz.tick);
};

kz.run = function (scene) {
  if (tickID) {
    $W.cancelAnimationFrame(tickID);
  }
  if (kz.scene) {
    kz.scene.exit();
  }
  //if (!kz.isSceneLike(scene)) throw 'No scene attached!';
  kz.entities = {};
  kz.scene = scene;
  kz.scene.initialize();
  kz.alive = true;
  tickID = $W.requestAnimationFrame(kz.tick);
};

kz.performance = {
  pauseTime: 0,
  now: function () {
    if (kz.paused) {
        return kz.pauseNow;
    } else {
      return performance.now() - kz.performance.pauseTime;
    }
  }
};
kz.paused = false;
kz.pauseTime = 0;
kz.pause = function () {
  kz.pauseNow = kz.performance.now();
  kz.pauseTime = performance.now();
  kz.paused = true;
};
kz.resume = function () {
  kz.performance.pauseTime += performance.now() - kz.pauseTime;
  kz.paused = false;
};
/*$ Essential functions such as tick and run */
var scene_loading = new kz.Scene();

scene_loading.preUpdate = function (now) {
  kz.events = [];
};

scene_loading.draw = function (now) {
  kz.x.clearAll();
  kz.x.save();
  kz.x.fillStyle = '#30403b';
  kz.x.fillRect(
    0,
    0,
    kz.v.width,
    kz.v.height
  );
  kz.x.restore();

  text = ['LOADING', 'LOADING.', 'LOADING..', 'LOADING...']

  kz.x.save();
  kz.x.textAlign = 'center';
  kz.x.textBaseline = 'center';
  kz.x.font = '18px f';
  kz.x.fillStyle = 'rgb(142, 212, 165)';
  kz.x.lineWidth = 2;
  kz.x.fillText(
    text[Math.round(now/500)%4],
    kz.v.width / 2,
    kz.v.height / 2
  );
  kz.x.restore();
};
// three '/' represents comments for minification purposes
var scene_main_menu = (function () {
  var scene_main_menu = new kz.Scene();
  var graphics;

  scene_main_menu.initialize = function () {
    graphics = {
      a: 1, //press_space_visible
      text_alpha: 1,
      fadeAlpha: 1,
      exiting: false,
      choice: 0,
      state: 0
    };
    kz.t({
      o: graphics,
      p: 'fadeAlpha',
      v: 0,
      d: 100
    });
    graphics.blinkID = setInterval(function() {
      graphics.a ^= 1;
    }, 400);
  }

  scene_main_menu.draw = function () {
    kz.x.clearAll();

    kz.x.save();
    kz.x.fillStyle = '#30403b';
    kz.x.fillRect(
      0,
      0,
      kz.v.width,
      kz.v.height
    );
    kz.x.restore();

    kz.x.textAlign = 'center';
    kz.x.textBaseline = 'center';
    kz.x.font = '48px f';
    kz.x.fillStyle = '#8ed4a5';
    kz.x.fillText(
      'ZODIAC 13',
      kz.v.width / 2,
      125
    );

    if (graphics.state == 0 && graphics.a) {
      kz.x.save();
      kz.x.globalAlpha = graphics.text_alpha;
      kz.x.font = '24px f';
      kz.x.fillStyle = 'white';
      kz.x.fillText(
        'PRESS   Z',
        kz.v.width / 2,
        250
      );
      kz.x.restore();
    }
    if (graphics.state == 1) {
      kz.x.textAlign = 'center';
      kz.x.textBaseline = 'center';
      kz.x.font = '24px f';
      kz.x.fillStyle = graphics.choice == 0 ? '#fff' : '#666';
      kz.x.fillText('GAME START', kz.v.width/2, kz.v.height/2+40);
      kz.x.fillStyle = graphics.choice == 1 ? '#fff' : '#666';
      kz.x.fillText('RECORDS', kz.v.width/2, kz.v.height/2+88);
      kz.x.restore();
    }

    kz.x.save();
    kz.x.globalAlpha = graphics.text_alpha;
    kz.x.font = '10px f';
    kz.x.fillStyle = '#50605b';
    kz.x.lineWidth = 2;
    kz.x.fillText(
      'HERMAN CHAU (KCAZE)',
      kz.v.width / 2,
      380
    );
    kz.x.restore();
    kz.x.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.x.fillRect(0,0,kz.v.width,kz.v.height);
  }

  scene_main_menu.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress') {
        if (graphics.exiting) continue;
        if (kz.events[ii].which == kz.K.Z) {
          kz.r.sounds['sfx_select'].play();
          if (!graphics.state) {
            graphics.state = 1;
          } else {
            var s = graphics.choice ? scene_records : scene_character_select;
            graphics.exiting = true;
            kz.t({
              o: graphics,
              p: 'fadeAlpha',
              v: 1,
              d: 100
            }).then(function () {
              clearInterval(graphics.blinkID);
              kz.run(s);
            });
          }
        }
      }
      if (kz.events[ii].which == kz.K.U) {
        if (graphics.state) {
          graphics.choice = Math.max(0, graphics.choice-1);
        }
      }
      if (kz.events[ii].which == kz.K.D) {
        if (graphics.state) {
          graphics.choice = Math.min(1, graphics.choice+1);
        }
      }
    }
    kz.events = [];
  }

  return scene_main_menu;
})();
var scene_records = (function () {
  var scene = new kz.Scene();
  var graphics;
  var state;

  scene.initialize = function () {
    graphics = {
      fadeAlpha: 1
    };
    kz.t({
      o: graphics,
      p: 'fadeAlpha',
      v: 0,
      d: 100
    });
    state = {
      exiting: false
    };
  }

  scene.draw = function () {
    kz.x.clearAll();

    kz.x.save();
    kz.x.fillStyle = '#30403b';
    kz.x.fillRect(
      0,
      0,
      kz.v.width,
      kz.v.height
    );
    kz.x.restore();

    kz.x.textAlign = 'center';
    kz.x.textBaseline = 'center';
    kz.x.font = '32px f';
    kz.x.fillStyle = '#fff';
    kz.x.fillText(
      'RECORDS',
      kz.v.width / 2,
      48
    );
    kz.x.font = '12px f';
    for (var ii = 0; ii < records.length; ii++) {
      kz.x.fillStyle = '#fff';
      kz.x.textAlign = 'left';
      kz.x.fillText(records[ii].text + ': ', 12, 90 + ii*20);
      kz.x.textAlign = 'right';
      kz.x.fillStyle = '#8ed4a5';
      var value;
      if (records[ii].name == 'total_time' || records[ii].name == 'max_time') {
        var time = getRecord(records[ii].name);
        var sec_string = '' + time%60;
        var min_string = '' + (Math.floor(time/60)%60);
        var hour_string = records[ii].name == 'total_time' ? '' + Math.floor(time/3600) + ':' : '';
        value = hour_string+'0'.repeat(2-min_string.length) + min_string + ':'  + '0'.repeat(2-sec_string.length)+sec_string;
      } else {
        value = getRecord(records[ii].name);
      }
      kz.x.fillText(value, kz.v.width-12, 90+ii*20);
    }

    kz.x.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.x.fillRect(0,0,kz.v.width,kz.v.height);
  }

  scene.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (state.exiting) continue;
      if (kz.events[ii].kztype == 'keypress') {
        if (kz.events[ii].which == kz.K.X || kz.events[ii].which == kz.K.Z) {
          state.exiting = true;
          kz.t({
            o: graphics,
            p: 'fadeAlpha',
            v: 1,
            d: 100
          }).then(function () {
            kz.run(scene_main_menu);
          });
        }
      }
    }
    kz.events = [];
  };

  return scene;
})();
var character;
var scene_character_select = (function () {
  var scene = new kz.Scene();
  var state;

  var characters;

  scene.initialize = function () {
    state = {
      s: 0, //selected
      exiting: false,
      f: 1 //fadeAlpha
    }
    kz.t({
      o: state,
      p: 'f',
      v: 0,
      d: 100});
    characters = [
      {
        d: 'ENDS TURN WHITE',
        name: 'BOAR',
        image: kz.r.i.b,
        m: '13 WHITE ORBS IN A ROW',
        u: getRecord('max_white_orbs') >= 13,
        zodiac: function (data) {
          var state = data.state;
          var config = data.$c;
          for (var yy = 0; yy < config.w; yy++) {
            if (state.board[yy][0].piece_type && state.board[yy][0].piece_type != 1) {
              state.board[yy][0].piece_type = 1;
              data.animateColorChange(state.board[yy][0].piece, 1);
            }
            if (state.board[yy][config.w-1].piece_type && state.board[yy][config.w-1].piece_type != 1) {
              state.board[yy][config.w-1].piece_type = 1;
              data.animateColorChange(state.board[yy][config.w-1].piece, 1);
            }
          }
        }
      },
      {
        d: 'CLEAR ROW ABOVE',
        name: 'CAT',
        image: kz.r.i.c,
        u: true,
        zodiac: function (data) {
          var state = data.state;
          var config = data.$c;
          var row = data.row;
          row--;
          var row_pieces = [];
          for (var xx = 0; xx < config.w; xx++) {
            if (state.board[row][xx].piece) {
              row_pieces.push(state.board[row][xx].piece);
            }
          }
          for (xx = 0; xx < config.w; xx++) {
            state.board[row][xx] = {
              piece_type: 0
            };
          }
          data.animateClearPieces(row_pieces);
        }
      },
      {
        d: 'CLEAR LEFT SIDE',
        name: 'DOG',
        image: kz.r.i.d,
        m: '169 ORBS SHOT',
        u: getRecord('total_orbs') >= 169,
        zodiac: function (data) {
          var board = data.state.board;
          var pieces = [];
          for (var yy = 0; yy < data.$c.w; yy++) {
            if (board[yy][0].piece_type) {
              pieces.push(board[yy][0].piece);
              board[yy][0].piece_type = 0;
            }
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        d: 'CLEAR 4 ON ENDS',
        name: 'DRAGON',
        image: kz.r.i.e,
        m: 'SCORE 169',
        u: getRecord('max_score') >= 169,
        zodiac: function(data) {
          var leftCounter = 4;
          var rightCounter = 4;
          var pieces = [];
          var board = data.state.board;
          var width = data.$c.w;
          for (var yy = data.$c.w - 1; yy >= 0; yy--) {
            if (leftCounter) {
              if (board[yy][0].piece_type) {
                pieces.push(board[yy][0].piece);
                board[yy][0].piece_type = 0;
                leftCounter--;
              }
            }
            if (rightCounter) {
              if (board[yy][width-1].piece_type) {
                pieces.push(board[yy][width-1].piece);
                board[yy][width-1].piece_type = 0;
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
        image: kz.r.i.f,
        m: 'REACH LEVEL 13',
        u: getRecord('max_level') >= 13,
        zodiac: function(data) {
          var board = data.state.board;
          var count = 0;
          var pieces = [];
          var piece_locs = [];
          for (var yy = 0; yy < data.$c.w; yy++) {
            for (var xx = 0; xx < data.$c.w; xx++) {
              if (board[yy][xx].piece_type) {
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
            board[yy][xx].piece_type = 0;
            pieces.splice(idx, 1);
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        d: 'SCORE +2',
        name: 'HORSE',
        image: kz.r.i.g,
        m: 'ZODIAC 13 TIMES',
        u: getRecord('total_zodiac') >= 13,
        zodiac: function(data) {
          data.incrementScore(2);
        }
      },
      {
        d: 'DELAY ROW DROP',
        name: 'MONKEY',
        image: kz.r.i.h,
        m: 'ZODIAC 169 TIMES',
        u: getRecord('total_zodiac') >= 169,
        zodiac: function (data) {
          var state = data.state;
          state.next_row_time_diff = state.next_row_time - kz.performance.now();
          state.next_row_freeze = true;
          setTimeout(function() {
            state.next_row_freeze = false;
          }, 5000);
        }
      },
      {
        d: 'ENDS TURN BLACK',
        name: 'OX',
        image: kz.r.i.i,
        m: '13 BLACK ORBS IN A ROW',
        u: getRecord('max_black_orbs') >= 13,
        zodiac: function (data) {
          var state = data.state;
          var config = data.$c;
          for (var yy = 0; yy < $c.w; yy++) {
            if (state.board[yy][0].piece_type && state.board[yy][0].piece_type != 2) {
              state.board[yy][0].piece_type = 2;
              data.animateColorChange(state.board[yy][0].piece, 2);
            }
            if (state.board[yy][config.w-1].piece_type && state.board[yy][config.w-1].piece_type != 2) {
              state.board[yy][config.w-1].piece_type = 2;
              data.animateColorChange(state.board[yy][config.w-1].piece, 2);
            }
          }
        }
      },
      {
        d: 'NEXT ALL WHITE',
        name: 'RAT',
        image: kz.r.i.k,
        m: '1313 ORBS SHOT',
        u: getRecord('total_orbs') >= 1313,
        zodiac: function (data) {
          for (var ii = 0; ii < 8; ii++) {
            data.state.player.next[ii] = 1;
          }
        }
      },
      {
        d: 'CLEAR RIGHT SIDE',
        name: 'ROOSTER',
        image: kz.r.i.l,
        m: 'SURVIVE 13 MINUTES',
        u: getRecord('max_time') >= 13*60,
        zodiac: function (data) {
          var board = data.state.board;
          var pieces = [];
          var width = data.state.w;
          for (var yy = 0; yy < data.$c.w; yy++) {
            if (board[yy][width-1].piece_type) {
              pieces.push(board[yy][width-1].piece);
              board[yy][width-1].piece_type = 0;
            }
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        d: 'CLEAR TOP ROW',
        name: 'SHEEP',
        image: kz.r.i.m,
        m: 'SCORE 13',
        u: getRecord('max_score') >= 13,
        zodiac: function (data) {
          var state = data.state;
          var config = data.$c;
          var row_pieces = [];
          for (var xx = 0; xx < config.w; xx++) {
            if (state.board[0][xx].piece) {
              row_pieces.push(state.board[0][xx].piece);
            }
            state.board[0][xx] = {
              piece_type: 0
            };
          }
          data.animateClearPieces(row_pieces);
        }
      },
      {
        d: 'NEXT ALL BLACK',
        name: 'SNAKE',
        image: kz.r.i.n,
        m: 'PLAY 13 GAMES',
        u: getRecord('play_count') >= 13,
        zodiac: function (data) {
          for (var ii = 0; ii < 8; ii++) {
            data.state.player.next[ii] = 2;
          }
        }
      },
      {
        d: 'SCORE +LEVEL/3',
        name: 'TIGER',
        image: kz.r.i.o,
        m: '169 ROWS CLEARED',
        u: getRecord('total_rows') >= 169,
        zodiac: function (data) {
          data.incrementScore(Math.floor(data.state.level/3));
        }
      },
      {
        d: '',
        name: 'RANDOM',
        image: kz.r.i.p,
        u: true
      }
    ];
  }

  scene.draw = function (now) {
    kz.x.clearAll();

    kz.x.save();
    kz.x.fillStyle = '#30403b';
    kz.x.fillRect(
      0,
      0,
      kz.v.width,
      kz.v.height
    );
    kz.x.restore();

    for (var yy = 0; yy < 7; yy++) {
      for (var xx = 0; xx < 2; xx++) {
        var idx = yy*2 + xx;
        if (idx >= characters.length) break;
        kz.x.strokeStyle = '#89928e';
        kz.x.lineWidth = 0.5;
        kz.x.fillStyle = '#50605b';
        kz.x.fillRect(xx*49 + 11, yy*49 + 21, 48, 48) ;
        kz.x.strokeRect(xx*49 + 10, yy*49 + 20, 50, 50) ;
        kz.x.drawImage(
          characters[idx].image,
          xx*49 + 10,
          yy*49 + 20
        )
        if (!characters[idx].u) {
          kz.x.fillStyle = 'rgba(0,0,0,0.7)';
          kz.x.fillRect(xx*49 + 11, yy*49 + 21, 48, 48) ;
        }
      }
    }
    if (Math.floor(now/200) % 3) {
      kz.x.strokeStyle = '#fff';
      kz.x.lineWidth = 1;
      kz.x.strokeRect((state.s%2)*49 + 10, Math.floor(state.s/2)*49 + 20, 50, 50) ;
    }
    kz.x.textAlign = 'right';
    kz.x.textBaseline = 'center';
    kz.x.font = '24px f';
    kz.x.fillStyle = 'white';
    kz.x.fillText(
      characters[state.s].name,
      kz.v.width - 10,
      330
    );
    kz.x.textAlign = 'right';
    kz.x.textBaseline = 'center';
    kz.x.font = '16px f';
    kz.x.fillStyle = 'white';
    if (characters[state.s].u) {
      kz.x.fillText(
        characters[state.s].d,
        kz.v.width - 10,
        360
      );
    } else {
      kz.x.font = '12px f';
      kz.x.fillStyle = '#50605b';
      kz.x.fillText(
        characters[state.s].m,
        kz.v.width - 10,
        360
      );
    }
    kz.x.fillStyle = 'rgba(0,0,0,'+state.f+')';
    kz.x.fillRect(0,0,kz.v.width,kz.v.height);
  }

  scene.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (state.exiting) continue;
      if (kz.events[ii].kztype == 'keypress') {
        if (kz.events[ii].which == kz.K.R) {
          state.s = Math.min(13, state.s+1);
        } else if (kz.events[ii].which == kz.K.D) {
          state.s = Math.min(13, state.s+2);
        } else if (kz.events[ii].which == kz.K.L) {
          state.s = Math.max(0, state.s-1);
        } else if (kz.events[ii].which == kz.K.U) {
          state.s = Math.max(0, state.s-2);
        } else if (kz.events[ii].which == kz.K.Z) {
          if (state.s == 13) {
            state.s = Math.floor(Math.random() * 13);
            while (!characters[state.s].u) {
              state.s = Math.floor(Math.random() * 13);
            }
          }
          if (characters[state.s].u) {
            kz.r.sounds['sfx_select'].play();
            character = characters[state.s];
            state.exiting = true;
            kz.t({
              o: state,
              p: 'f',
              v: 1,
              d: 100
            }).then(function () {
              kz.run(scene_game);
            });
          } else {
            kz.r.sounds['sfx_denied'].play();
          }
        } else if (kz.events[ii].which == kz.K.X) {
          state.exiting = true;
          kz.t({
            o: state,
            p: 'f',
            v: 1,
            d: 100
          }).then(function () {
            kz.run(scene_main_menu);
          });
        }
      }
    }
    kz.events = [];
  }

  return scene;
})();
// three '/' represents comments for minification purposes
var previous_time;

var scene_game = (function () {
  var $c = {
    w: 8, // board_width
    h: 17, // board_height
    g: 20, // grid_size
    next_length: 8,
    next_row_interval: 20000
  };
  var board_canvas = $D.createElement('canvas');
  var info_canvas = $D.createElement('canvas');
  var pause_canvas = $D.createElement('canvas');
  var gameover_canvas = $D.createElement('canvas');
  board_canvas.width = $c.w*$c.g;
  board_canvas.height = 390;
  info_canvas.width = 96;
  info_canvas.height = 390;
  gameover_canvas.width = 280;
  gameover_canvas.height = 390;
  pause_canvas.width = 280;
  pause_canvas.height = 390;
  var board_context = board_canvas.getContext('2d');
  var info_context = info_canvas.getContext('2d');
  var gameover_context = gameover_canvas.getContext('2d');
  var pause_context = pause_canvas.getContext('2d');
  var normal_piece_types = [1, 2];
  var state;
  var pause_choice;
  var graphics;
  var bgm;

  function pause() {
    kz.pause();
    pause_choice = 0;
    // copy over game picture at pause time
    pause_context.clearRect(
      0,
      0,
      pause_canvas.width,
      pause_canvas.height
    );
    pause_context.drawImage(
      kz.v,
      0,
      0
    );
    kz.t({
      o: graphics,
      p: 'pause_alpha',
      v: 0.8,
      d: 50
    });
  }

  function resume() {
    kz.t({
      o: graphics,
      p: 'pause_alpha',
      v: 0,
      d: 50
    }).then(kz.resume);
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
    return new kz.Entity({
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
      kz.r.i.s,
      kz.r.i.r,
      kz.r.i.t
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
    state.alive = false;

    // copy over game picture at losing time
    gameover_context.clearRect(
      0,
      0,
      gameover_canvas.width,
      gameover_canvas.height
    );
    gameover_context.drawImage(
      kz.v,
      0,
      0
    );
    // fade to black
    kz.t({
      o: graphics,
      p: 'gameover_background_alpha',
      v: 1,
      d: 1000
    }).then(function () {
      return kz.t({
        o: graphics,
        p: 'gameover_text_alpha',
        v: 1,
        d: 1000
      });
    }).then(function () {
      state.can_restart = true;
    });
  }

  function clearRow() {
    var row;
    var activateAbility = false;

    for (var yy = 0; yy < $c.h; yy++) {
      var piece_type = state.board[yy][0].piece_type;
      var zodiacCounter = 0;
      var cleared = true;
      for (var xx = 0; xx < $c.w; xx++) {
        if (state.board[yy][xx].piece_type == 3) {
          zodiacCounter++;
        }
        // wow, much hack. this works because zodiac = 3, so it ANDs with
        // both 1 (black) and 2 (white) to be nonzero.
        piece_type &= state.board[yy][xx].piece_type;
        if (piece_type == 0) {
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
    state.rows_cleared += 1;
    incrementRecord('total_rows', 1);
    maxRecord('max_rows', state.rows_cleared);
    if (state.rows_cleared % 10 == 0) {
      state.level += 1;
      maxRecord('max_level', state.level);
      state.next_row_interval = Math.max(3000, state.next_row_interval - 750);
    }

    // capture row pieces before we update board so we can animate them
    var row_pieces = [];
    for (var xx = 0; xx < $c.w; xx++) {
      row_pieces.push(state.board[row][xx].piece);
    }

    // update of underlying board
    for (xx = 0; xx < $c.w; xx++) {
      state.board[row][xx] = {
        piece_type:0
      };
    }

    // animation
    animateClearPieces(row_pieces);

    // activate zodiac
    if (!activateAbility) return;
    state.zodiacs++;
    incrementRecord('total_zodiac', 1);
    maxRecord('max_zodiac', state.zodiacs);
    character.zodiac({
      state: state,
      animateClearPieces: animateClearPieces,
      animateColorChange: animateColorChange,
      $c: $c,
      incrementScore: incrementScore,
      row: row
    });
  }

  function animateClearPieces(pieces) {
    kz.r.sounds['sfx_clear'].play();
    // animate fade away
    // ensure that all row piece animations have finished
    var promise  = [];
    pieces.forEach(function (piece) {
      promise.push(piece.a);
    })
    promise = Promise.all(promise);
    pieces.forEach(function (piece) {
      var piecePromise = promise.then(function () {
        return kz.t({
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
    for (var yy = $c.h-1; yy > 0; yy--) {
      for (var xx = 0; xx < $c.w; xx++) {
        if (state.board[yy][xx].piece_type && !state.board[yy-1][xx].piece_type) {
          state.board[yy-1][xx] = state.board[yy][xx];
          state.board[yy][xx] = {
            piece_type:0
          };
          var piece = state.board[yy-1][xx].piece;
          (function (piece) {
            // ensure we start the animation AFTER the row fades away
            piece.a = piece.a.then(function () {
              return kz.t({
                o: piece,
                p: 'y',
                v: piece.y - $c.g,
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
    var piece_type = state.board[board_y][board_x].piece_type;

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
             && x < $c.w
             && y < $c.h) {
        if (state.board[y][x].piece_type ==0
          || state.board[y][x].piece_type == 3) break;
        if (state.board[y][x].piece_type == piece_type) {
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
        state.board[yy][xx].piece_type = piece_type;
        var piece = state.board[yy][xx].piece;
        animateColorChange(piece, piece_type);
      }
    }
  }

  function incrementScore(amount) {
    state.score += amount;
    maxRecord('max_score', state.score);
  }

  function animateColorChange(piece, to_type) {
    piece.a = piece.a.then(function () {
      return new Promise(function(resolve) {
        piece.blend_type = to_type;
        kz.t({
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
    kz.r.sounds['sfx_drop'].play();
    var new_row = [];
    for (var ii = 0; ii < $c.w; ii++) {
      var piece_type = randomPieceType(normal_piece_types);
      new_row.push({
        piece_type: piece_type,
        piece: makePiece(
          board_to_piece(ii),
          board_to_piece(-1),
          piece_type
        )
      });
    }
    // if all colors the same, change the color of last one
    var piece_type = new_row[$c.w-1].piece_type;
    for (var ii = 0; ii < $c.w; ii++) {
      piece_type ^= new_row[ii].piece_type;
    }
    if (piece_type) {
      new_row[$c.w-1].piece_type ^= 3;
      new_row[$c.w-1].piece.type ^= 3;
    }

    // update board
    for (var xx = 0; xx < $c.w; xx++) {
      if (state.board[$c.h-1][xx].piece_type
          != 0) {
        lose();
        return;
      }
      for (var yy = $c.h-1; yy > 0; yy--) {
        state.board[yy][xx] = state.board[yy-1][xx];
      }
      state.board[0][xx] = new_row[xx];
    }

    // animate pieces
    state.board.forEach(function (row) {
      row.forEach(function (square) {
        var piece = square.piece;
        if (!piece) return;
        piece.a = piece.a.then(function () {
          return kz.t({
            o: piece,
            p: 'y',
            v: piece.y + $c.g,
            r: 1
          });
        });
      });
    });
  }
  /*$ Messy section of game logic */

  function initialize() {
    incrementRecord('play_count', 1);
    bgm = kz.r.sounds['bgm_game'].play(true);
    bgm.mystop = function () {
      if (!bgm.stopped) {bgm.stop(0); bgm.stopped = 1;}
    };
  // initialize graphics
    graphics = {
      background_pattern: kz.x.createPattern(
        kz.r.i.a,
        'repeat'),
      pause_alpha: 0,
      gameover_background_alpha: 0,
      gameover_text_alpha: 0,
      fadeAlpha: 1
    }
    kz.t({
      o: graphics,
      p: 'fadeAlpha',
      v: 0,
      d: 100});


  // intialize state
    state = {
      alive: true,
      begin: kz.performance.now(),
      board: [],
      can_restart: false,
      exiting: false,
      score: 0,
      level: 1,
      rows_cleared: 0,
      next_row_interval: $c.next_row_interval,
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
    state.next_row_time = kz.performance.now() + state.next_row_interval;
    // initialize board
    for (var yy = 0; yy < $c.h; yy++) {
      state.board.push([]);
      for (var xx = 0; xx < $c.w; xx++) {
        // initialize board to have two random rows
        if (yy < 2) {
          var piece_type = randomPieceType(normal_piece_types);
          var piece = makePiece(
            board_to_piece(xx),
            board_to_piece(yy),
            piece_type
          );
          state.board[yy].push({
            piece_type: piece_type,
            piece: piece
          });
          // check if all colors if the same. if so, change the color of the last
          if (xx == $c.w - 1) {
            var piece_type = state.board[yy][0].piece_type;
            for (var xxx = 0; xxx < $c.w; xxx++) {
              piece_type &= state.board[yy][xxx].piece_type
            }
            if (piece_type) {
              state.board[yy][$c.w - 1].piece_type ^= 3;
              state.board[yy][$c.w - 1].piece.type ^= 3;
            }
          }
        } else {
          state.board[yy].push({
            piece_type:0
          });
        }
      }
    }
    pause_choice = 0;
    // initialize player
    state.player = new kz.Entity({
      frames: [
        kz.r.i.u,
        kz.r.i.v,
        kz.r.i.w,
        kz.r.i.u
      ],
      frame_lengths: [
        500,
        200,
        200,
        200
      ],
      current_frame: 0,
      animate_timer: kz.performance.now(),
      animate: function (now) {
        var dt = now - this.animate_timer;
        if (dt > this.frame_lengths[this.current_frame]) {
          this.current_frame++;
          this.current_frame %= this.frames.length;
          this.animate_timer = now;
        }
      },
      x: Math.floor($c.w/2),
      sprite_x: 4+Math.floor($c.w/2)*$c.g,
      sprite_y: $c.h*$c.g+23,
      a: blankPromise(),
      draw: function (context) {
        context.drawImage(
          this.frames[this.current_frame],
          this.sprite_x,
          this.sprite_y);
        // draw aiming line
        var h;
        for (h = $c.h-1; h >= 0; h--) {
          if (state.board[h][this.x].piece_type != 0) {
            break;
          }
        }
        board_context.save();
        board_context.globalAlpha = 1;
        board_context.lineWidth = 1;
        board_context.setLineDash([2, 8]);
        board_context.strokeStyle = '#8ed4a5';
        board_context.beginPath();
        board_context.moveTo(
          this.sprite_x+$c.g/2-5,
          this.sprite_y-8
        );
        board_context.lineTo(
          this.sprite_x+$c.g/2-5,
          (h+1) * $c.g + 20
        );
        board_context.stroke();
        board_context.restore();
      },
      listen: function (event) {
        if (event.kztype == 'keypress') {
          if (event.which == kz.K.L) this.move(-1);
          if (event.which == kz.K.R) this.move(1);
          if (event.which == kz.K.Z) this.shoot();
        } else if (event.kztype == 'keyheld') {
          if (event.which == kz.K.L) this.move(-1);
          if (event.which == kz.K.R) this.move(1);
        }
      },
      move: function (dx) {
        if (this.x+dx >= 0 && this.x+dx < $c.w) {
          this.x += dx;
          this.a = this.a.then(function () {
            return kz.t({
              o: this,
              p: 'sprite_x',
              v: this.sprite_x + dx*$c.g,
              r: 0.7
            }).then(function () {
              return blankPromise();
            }.bind(this));
          }.bind(this));
        }
      },
      next: [],
      shoot : function() {
        if (state.board[$c.h-1][this.x].piece_type
            != 0) {
          lose();
          return;
        }

        incrementRecord('total_orbs', 1);

        var piece_type = this.next.shift();
        var next_piece_type = Math.random()*16 > 1
          ? randomPieceType(normal_piece_types)
          : 3;
        this.next.push(next_piece_type);

        // update consecutive counts
        if (state.consecutive[piece_type]) {
          state.consecutive[piece_type]++;
        } else {
          state.consecutive[1] = 0;
          state.consecutive[2] = 0;
          state.consecutive[3] = 0;
          state.consecutive[piece_type] = 1;
        }
        var pieceTypeRecordMap = {
          1: 'max_white_orbs',
          2: 'max_black_orbs',
          3: 'max_zodiac_orbs'
        };
        maxRecord(pieceTypeRecordMap[piece_type], state.consecutive[piece_type]);

        var target_y = $c.h-1;
        while (target_y > 0) {
          if (state.board[target_y-1][this.x].piece_type
              != 0) {
            break;
          }
          target_y--;
        }
        var piece = makePiece(
          this.x*$c.g + 1,
          ($c.h-1)*$c.g + 1,
          piece_type
        );
        state.board[target_y][this.x] = {
          piece_type: piece_type,
          piece: piece
        };
        reverse(this.x, target_y);

        piece.a = piece.a.then(function () {
          kz.r.sounds['sfx_shoot'].play();
          return kz.t({
            o: piece,
            p: 'y',
            v: board_to_piece(target_y),
            r: 3
          });
        });
       }
    });
    for (var ii = 0; ii < 8; ii++) {
      state.player.next.push(randomPieceType(normal_piece_types));
      if (Math.random()*16 < 1) {
        state.player.next[ii] = 3;
      }
    }
  }

  function drawAlive(now) {
    // clear contexts
    board_context.clearRect(
      0,
      0,
      board_canvas.width,
      board_canvas.height
    );
    info_context.clearRect(
      0,
      0,
      info_canvas.width,
      info_canvas.height
    );

    // board context drawing
      // background translucent box
    board_context.fillStyle = 'rgba(0,0,0,0.5)';
    board_context.fillRect(
      0,
      0,
      board_canvas.width,
      board_canvas.height
    );
      // draw board line
    board_context.save();
    board_context.globalAlpha = 1;
    board_context.lineWidth = 1;
    board_context.strokeStyle = '#50605b';
    board_context.beginPath();
    board_context.moveTo(
      0,
      $c.h * $c.g + 20
    );
    board_context.lineTo(
      $c.w * $c.g,
      $c.h * $c.g + 20
    );
    board_context.stroke();
    board_context.restore();
      // draw pieces
    for (var id in kz.entities) {
      var piece = kz.entities[id];
      // only piece entities have a type field
      if (!piece.type) continue;
      board_context.globalAlpha = piece.alpha;
      board_context.drawImage(
        pieceTypeImage(piece.type),
        piece.x,
        piece.y+20
      );
      if (piece.blend_type) {
        board_context.globalAlpha = piece.blend_alpha;
        board_context.drawImage(
          pieceTypeImage(piece.blend_type),
          piece.x,
          piece.y+20
        );
      }
    };
      // draw player
    board_context.globalAlpha = 1;
    state.player.draw(board_context);

      // draw timer
    board_context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    board_context.fillRect(
      0,
      8,
      board_canvas.width,
      5
    );
    if (state.next_row_freeze) {
      board_context.fillStyle = 'rgb(80, 96, 91)';
    } else {
      board_context.fillStyle = 'rgb(142, 212, 165)';
    }
    board_context.fillRect(
      0,
      8,
      board_canvas.width * (state.next_row_time - now) / state.next_row_interval,
      5
    );

    // info context drawing
      // draw translucent boxes
    info_context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        // character box
    info_context.fillRect(
      0,
      10,
      info_canvas.width,
      info_canvas.width
    );
        // next pieces box
    info_context.fillRect(
      0,
      117,
      info_canvas.width,
      80
    );
        // score box
    info_context.fillRect(
      0,
      208,
      info_canvas.width,
      50
    );
        // level box
    info_context.fillRect(
      0,
      269,
      info_canvas.width,
      50
    );
        // time box
    info_context.fillRect(
      0,
      330,
      info_canvas.width,
      50
    );

      // draw text
    info_context.textAlign = 'center';
    info_context.textBaseline = 'top';
    info_context.font = '24px f';
    info_context.fillStyle = 'white';
    info_context.fillText('NEXT', 48, 120);
    info_context.fillText('SCORE', 48, 211);
    info_context.fillText('LEVEL', 48, 272);
    info_context.fillText('TIME', 48, 333);
    info_context.font = '20px f';
    info_context.textBaseline = 'bottom';
    info_context.fillText(character.name, 48, 101);

    info_context.font = '20px f';
    info_context.fillText('' + state.level, 48, 316);
    var score_string = '' + state.score;
        // pad with zeroes
    score_string = '0'.repeat(5 - score_string.length) + score_string;
    info_context.fillText(score_string, 48, 255);
    var time = Math.floor((kz.performance.now() - state.begin)/1000);
    var sec_string = '' + time%60;
    var min_string = '' + Math.floor(time/60);
    time_string = '0'.repeat(2-min_string.length) + min_string + ':'  + '0'.repeat(2-sec_string.length)+sec_string;
    info_context.fillText(time_string, 48, 377);

      // draw sprites
    for (var ii = 0; ii < $c.next_length; ii++) {
      info_context.drawImage(
        pieceTypeImage(state.player.next[ii]),
        9+(ii%4)*$c.g,
        148 + Math.floor(ii/4)*23
      );
    }

    info_context.drawImage(
      character.image,
      23,
      20
    );

    // main context drawing
    kz.x.fillStyle = '#50605b';
    kz.x.fillRect(0, 0, kz.v.width, kz.v.height);
    kz.x.fillStyle = graphics.background_pattern;
    kz.x.fillRect(0, 0, kz.v.width, kz.v.height);
    kz.x.drawImage(board_canvas, 10, 0);
    kz.x.drawImage(
      info_canvas,
      10 + board_canvas.width + 7,
      0
    );
    kz.x.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.x.fillRect(0,0,kz.v.width,kz.v.height);
  }

  function preUpdateAlive(now) {
    maxRecord('max_time', Math.floor((now - state.begin)/1000));
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress' &&
          kz.events[ii].which == kz.K.X) {
        pause();
        kz.events = [];
        return;
      }
    }
    kz.processEvents();
    state.player.animate(now);
    if (state.next_row_freeze) {
      state.next_row_time = now + state.next_row_time_diff;
    }
    if (state.next_row_time < now) {
      addRow();
      state.next_row_time = now + state.next_row_interval;
    }
    clearRow();
    drop();
  }

  function drawPause(now) {
    kz.x.clearAll();
    kz.x.save();
    kz.x.globalAlpha = 1;
    kz.x.drawImage(
      pause_canvas,
      0,
      0
    );
    kz.x.globalAlpha = graphics.pause_alpha;
    kz.x.fillStyle = '#000000';
    kz.x.fillRect(
      0,
      0,
      kz.v.width,
      kz.v.height
    );
    kz.x.restore();
    kz.x.save();
    kz.x.textAlign = 'center';
    kz.x.textBaseline = 'center';
    kz.x.font = '24px f';
    kz.x.fillStyle = pause_choice == 0 ? '#fff' : '#666';
    kz.x.fillText('RESUME', kz.v.width/2, kz.v.height/2-48);
    kz.x.fillStyle = pause_choice == 1 ? '#fff' : '#666';
    kz.x.fillText('RESTART', kz.v.width/2, kz.v.height/2);
    kz.x.fillStyle = pause_choice == 2 ? '#fff' : '#666';
    kz.x.fillText('QUIT', kz.v.width/2, kz.v.height/2+48);
    kz.x.restore();
    kz.x.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.x.fillRect(0,0,kz.v.width,kz.v.height);
  }

  function drawDead(now) {
    kz.x.clearAll();
    kz.x.save();
    kz.x.globalAlpha = 1;
    kz.x.drawImage(
      gameover_canvas,
      0,
      0
    );
    kz.x.globalAlpha = graphics.gameover_background_alpha;
    kz.x.fillStyle = 'rgb(142, 212, 165)';
    kz.x.fillRect(
      10,
      (kz.v.height / 2) - 28,
      160,
      42
    );
    kz.x.globalAlpha = graphics.gameover_text_alpha;
    kz.x.textAlign = 'center';
    kz.x.textBaseline = 'center';
    kz.x.font = '24px f';
    kz.x.fillStyle = '#fff';
    kz.x.fillText(
      'GAME OVER',
      kz.v.width / 2 - 46,
      kz.v.height / 2);
    kz.x.restore();
    kz.x.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.x.fillRect(0,0,kz.v.width,kz.v.height);
  }

  function preUpdateDead(now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (state.exiting) continue;
      if (kz.events[ii].kztype == 'keypress' &&
          kz.events[ii].which == kz.K.Z &&
          state.can_restart) {
        state.exiting = true;
        kz.t({
          o: graphics,
          p: 'fadeAlpha',
          v: 1,
          d: 100}).then(function () {
            kz.run(scene_main_menu);
          })
      }
    }
    kz.events = [];
  }

  function preUpdatePause(now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress') {
        if (state.exiting) continue;
        if (kz.events[ii].which == kz.K.X) {
          resume();
        } else if (kz.events[ii].which == kz.K.D) {
          pause_choice = Math.min(2, pause_choice+1);
        } else if (kz.events[ii].which == kz.K.U) {
          pause_choice = Math.max(0, pause_choice-1);
        } else if (kz.events[ii].which == kz.K.Z) {
          resume();
          if (pause_choice == 0) {
          } else if (pause_choice == 1) {
            state.exiting = true;
            kz.t({
              o: graphics,
              p: 'fadeAlpha',
              v: 1,
              d: 100}).then(function () {
                kz.run(scene_game);
              });
          } else {
            state.exiting = true;
            kz.t({
              o: graphics,
              p: 'fadeAlpha',
              v: 1,
              d: 100}).then(function () {
                kz.run(scene_main_menu);
              });
          }
        }
      }
    }
    kz.events = [];
  }

  var scene_game = new kz.Scene();
  scene_game.initialize = initialize;
  scene_game.draw = function (now) {
    if (!kz.paused) {
      state.alive ? drawAlive(now) : drawDead(now);
    } else {
      drawPause(now);
    }
  };
  scene_game.preUpdate = function (now) {
    if (!kz.paused) {
      state.alive ? preUpdateAlive(now) : preUpdateDead(now);
    } else {
      preUpdatePause(now);
    }
  };
  scene_game.exit = function () {
    bgm.mystop();
  }
  return scene_game
})();
// Globals(prefixed with $):
// $x -- sonantx


function lj(data, resolve) { //loadJSFXR
  var buff = base64ToArrayBuffer(data.substr(22));
  kz.a.decodeAudioData(buff, resolve);
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
    'sfx_shoot': {
      data: jsfxr([0,,0.1881,,0.3164,0.8042,0.2,-0.2915,,,,,,0.4661,0.156,,0.1754,-0.182,1,,,0.1755,,0.5]),
      loader: lj
    },
    'sfx_clear': {
      data: jsfxr([1,,0.06,0.4848,0.4938,0.8917,,,,,,,,,,,,,1,,,,,0.49]),
      loader: lj
    },
    'sfx_select': {
      data: jsfxr([0,,0.0538,0.4336,0.3186,0.4583,,,,,,0.5712,0.5566,,,,,,1,,,,,0.5]),
      loader: lj
    },
    'sfx_denied': {
      data: jsfxr([0,,0.24,0.51,0.3829,0.15,,,,,,,,,,,,,1,,,,,0.5]),
      loader: lj
    },
    'sfx_drop': {
      data: jsfxr([1,,0.0468,,0.2103,0.4979,,-0.4519,,,,,,,,,,,1,,,,,0.83]),
      loader: lj
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
  var fontHack = $D.getElementById('fontHack');
  fontHack.parentNode.removeChild(fontHack);

  kz.initialize('canvas');
  kz.run(scene_loading);

  kz.L(resources).then(function () {
    kz.run(scene_main_menu);
    setInterval(function () {
      incrementRecord('total_time', 1);
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

function incrementRecord(name, value) {
  localStorage.setItem(
    name,
    parseInt(localStorage.getItem(name), 10) + value);
}

function maxRecord(name, value) {
  localStorage.setItem(
    name,
    Math.max(parseInt(localStorage.getItem(name), 10), value));
}

function getRecord(name) {
  return parseInt(localStorage.getItem(name),10);
}
