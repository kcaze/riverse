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

var sonantx;
(function() {
"use strict";
sonantx = {};

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

function applyDelay(chnBuf, waveSamples, instr, rowLen, callBack) {
    var p1 = (instr.fx_delay_time * rowLen) >> 1;
    var t1 = instr.fx_delay_amt / 255;

    var n1 = 0;
    var iterate = function() {
        var beginning = new Date();
        var count = 0;
        while(n1 < waveSamples - p1)
        {
            var b1 = 4 * n1;
            var l = 4 * (n1 + p1);

            // Left channel = left + right[-p1] * t1
            var x1 = chnBuf[l] + (chnBuf[l+1] << 8) +
                (chnBuf[b1+2] + (chnBuf[b1+3] << 8) - 32768) * t1;
            chnBuf[l] = x1 & 255;
            chnBuf[l+1] = (x1 >> 8) & 255;

            // Right channel = right + left[-p1] * t1
            x1 = chnBuf[l+2] + (chnBuf[l+3] << 8) +
                (chnBuf[b1] + (chnBuf[b1+1] << 8) - 32768) * t1;
            chnBuf[l+2] = x1 & 255;
            chnBuf[l+3] = (x1 >> 8) & 255;
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
sonantx.AudioGenerator = function(mixBuf) {
    this.mixBuf = mixBuf;
    this.waveSize = mixBuf.length / WAVE_CHAN / 2;
};
sonantx.AudioGenerator.prototype.getWave = function() {
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
sonantx.AudioGenerator.prototype.getAudio = function() {
    var wave = this.getWave();
    var a = new Audio("data:audio/wav;base64," + btoa(wave));
    a.preload = "none";
    a.load();
    return a;
};
sonantx.AudioGenerator.prototype.getAudioBuffer = function(callBack) {
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
sonantx.SoundGenerator = function(instr, rowLen) {
    this.instr = instr;
    this.rowLen = rowLen || 5605;

    this.osc_lfo = oscillators[instr.lfo_waveform];
    this.osc1 = oscillators[instr.osc1_waveform];
    this.osc2 = oscillators[instr.osc2_waveform];
    this.attack = instr.env_attack;
    this.sustain = instr.env_sustain;
    this.release = instr.env_release;
    this.panFreq = Math.pow(2, instr.fx_pan_freq - 8) / this.rowLen;
    this.lfoFreq = Math.pow(2, instr.lfo_freq - 8) / this.rowLen;
};
sonantx.SoundGenerator.prototype.genSound = function(n, chnBuf, currentpos) {
    var marker = new Date();
    var c1 = 0;
    var c2 = 0;

    // Precalculate frequencues
    var o1t = getnotefreq(n + (this.instr.osc1_oct - 8) * 12 + this.instr.osc1_det) * (1 + 0.0008 * this.instr.osc1_detune);
    var o2t = getnotefreq(n + (this.instr.osc2_oct - 8) * 12 + this.instr.osc2_det) * (1 + 0.0008 * this.instr.osc2_detune);

    // State variable init
    var q = this.instr.fx_resonance / 255;
    var low = 0;
    var band = 0;
    for (var j = this.attack + this.sustain + this.release - 1; j >= 0; --j)
    {
        var k = j + currentpos;

        // LFO
        var lfor = this.osc_lfo(k * this.lfoFreq) * this.instr.lfo_amt / 512 + 0.5;

        // Envelope
        var e = 1;
        if(j < this.attack)
            e = j / this.attack;
        else if(j >= this.attack + this.sustain)
            e -= (j - this.attack - this.sustain) / this.release;

        // Oscillator 1
        var t = o1t;
        if(this.instr.lfo_osc1_freq) t += lfor;
        if(this.instr.osc1_xenv) t *= e * e;
        c1 += t;
        var rsample = this.osc1(c1) * this.instr.osc1_vol;

        // Oscillator 2
        t = o2t;
        if(this.instr.osc2_xenv) t *= e * e;
        c2 += t;
        rsample += this.osc2(c2) * this.instr.osc2_vol;

        // Noise oscillator
        if(this.instr.noise_fader) rsample += (2*Math.random()-1) * this.instr.noise_fader * e;

        rsample *= e / 255;

        // State variable filter
        var f = this.instr.fx_freq;
        if(this.instr.lfo_fx_freq) f *= lfor;
        f = 1.5 * Math.sin(f * 3.141592 / WAVE_SPS);
        low += f * band;
        var high = q * (rsample - band) - low;
        band += f * high;
        switch(this.instr.fx_filter)
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
        t = osc_sin(k * this.panFreq) * this.instr.fx_pan_amt / 512 + 0.5;
        rsample *= 39 * this.instr.env_master;

        // Add to 16-bit channel buffer
        k = k * 4;
        if (k + 3 < chnBuf.length) {
            var x = chnBuf[k] + (chnBuf[k+1] << 8) + rsample * (1 - t);
            chnBuf[k] = x & 255;
            chnBuf[k+1] = (x >> 8) & 255;
            x = chnBuf[k+2] + (chnBuf[k+3] << 8) + rsample * t;
            chnBuf[k+2] = x & 255;
            chnBuf[k+3] = (x >> 8) & 255;
        }
    }
};
sonantx.SoundGenerator.prototype.getAudioGenerator = function(n, callBack) {
    var bufferSize = (this.attack + this.sustain + this.release - 1) + (32 * this.rowLen);
    var self = this;
    genBuffer(bufferSize, function(buffer) {
        self.genSound(n, buffer, 0);
        applyDelay(buffer, bufferSize, self.instr, self.rowLen, function() {
            callBack(new sonantx.AudioGenerator(buffer));
        });
    });
};
sonantx.SoundGenerator.prototype.createAudio = function(n, callBack) {
    this.getAudioGenerator(n, function(ag) {
        callBack(ag.getAudio());
    });
};
sonantx.SoundGenerator.prototype.createAudioBuffer = function(n, callBack) {
    this.getAudioGenerator(n, function(ag) {
        ag.getAudioBuffer(callBack);
    });
};

/**
 * @constructor
 */
sonantx.MusicGenerator = function(song) {
    this.song = song;
    // Wave data configuration
    this.waveSize = WAVE_SPS * song.songLen; // Total song size (in samples)
};
sonantx.MusicGenerator.prototype.generateTrack = function (instr, mixBuf, callBack) {
    var self = this;
    genBuffer(this.waveSize, function(chnBuf) {
        // Preload/precalc some properties/expressions (for improved performance)
        var waveSamples = self.waveSize,
            waveBytes = self.waveSize * WAVE_CHAN * 2,
            rowLen = self.song.rowLen,
            soundGen = new sonantx.SoundGenerator(instr, rowLen);

        var endPattern = instr.notes.length;
        var currentpos = 0;
        var idx = 0;
        var recordSounds = function () {
          var beginning = new Date();
          while (true) {
            if (idx === endPattern) {
              setTimeout(delay, 0);
              return;
            }
            var n = instr.notes[idx];
            if (n) {
              soundGen.genSound(n, chnBuf, currentpos);
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
            applyDelay(chnBuf, waveSamples, instr, rowLen, finalize);
        };

        var b2 = 0;
        var finalize = function() {
            var beginning = new Date();
            var count = 0;
            // Add to mix buffer
            while(b2 < waveBytes)
            {
                var x2 = mixBuf[b2] + (mixBuf[b2+1] << 8) + chnBuf[b2] + (chnBuf[b2+1] << 8) - 32768;
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
sonantx.MusicGenerator.prototype.getAudioGenerator = function(callBack) {
    var self = this;
    genBuffer(this.waveSize, function(mixBuf) {
        var t = 0;
        var recu = function() {
            if (t < self.song.songData.length) {
                t += 1;
                self.generateTrack(self.song.songData[t - 1], mixBuf, recu);
            } else {
                callBack(new sonantx.AudioGenerator(mixBuf));
            }
        };
        recu();
    });
};
sonantx.MusicGenerator.prototype.createAudio = function(callBack) {
    this.getAudioGenerator(function(ag) {
        callBack(ag.getAudio());
    });
};
sonantx.MusicGenerator.prototype.createAudioBuffer = function(callBack) {
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
window['jsfxr'] = function(settings) {
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
var kz = {};

/*^ Functions for loading resources */
// queue is an object with names as keys and image paths as values
kz.loadResources = function (resources) {
  var promises = [];
  kz.resources = {};

  promises.push(kz.loadImages(resources.images));
  promises.push(kz.loadSounds(resources.sounds));

  return Promise.all(promises)
    .then(function () {
      return kz.resources;
    });
};

kz.loadImages = function (queue) {
  var images = {};
  var promises = [];

  for (var key in queue) {
    promises.push(new Promise(function(resolve) {
      var name = key;
      var image = new Image();
      image.addEventListener('load', function() {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var crop;
        if (!queue[name].crop) {
          crop = {
            x: 0,
            y: 0,
            w: image.width,
            h: image.height
          };
        } else {
          crop = queue[name].crop;
        }
        canvas.width = crop.w;
        canvas.height = crop.h;
        context.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
        images[name] = canvas;
        resolve();
      });
      image.src = queue[key].data;
    }));
  }

  return Promise.all(promises)
                .then(function () {
                  kz.resources.images = images;
                  return kz.resources.images;
                });
};

kz.loadSounds = function (queue) {
  kz.audio_context = new AudioContext();
  var sounds = {};
  var promises = [];

  for (var key in queue) {
    /*sounds[key] = {
      play: function () {}
    };*/
    promises.push(new Promise(function(resolve) {
      var name = key;
      queue[key].loader(queue[key].data, function(buffer) {
        console.log("Loaded ", name);
        sounds[name] = {
          play: function (loop) {
            loop = typeof loop == undefined ? false : loop;
            var source = kz.audio_context.createBufferSource();
            source.loop = loop;
            source.buffer = this.buffer;
            source.connect(kz.audio_context.destination);
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
                  kz.resources.sounds = sounds;
                  return kz.resources.sounds;
                });
};
/*$ Functions for loading resources */

/*^ Keys */
kz.KEYS = {
  ENTER: 13,
  ESCAPE: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  Z: 90
};

kz.keys_status = {};
for (var ii = 0; ii < 256; ii++) {
  kz.keys_status[ii] = 0;
}
/*$ Keys */

/*^ Touches */
kz.TOUCHES = {};
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
kz.tween = function (tween) {
  var start_time = performance.now();
  var old_value = tween.object[tween.property];
  var new_value = tween.value;
  var duration = tween.duration
    ? tween.duration
    : Math.abs(new_value - old_value) / tween.rate;

  return new Promise(function (resolve) {
    function update() {
      var time_elapsed = performance.now() - start_time;
      var t = time_elapsed / duration;
      if (t >= 1) {
        tween.object[tween.property] = new_value;
        resolve();
      } else {
        tween.object[tween.property] = t * new_value + (1 - t) * old_value;
        window.requestAnimationFrame(update);
      }
    }
    window.requestAnimationFrame(update);
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
  kz.canvas = document.getElementById(canvas_id);
  kz.context = kz.canvas.getContext('2d');
  kz.context.clearAll = function () {
    kz.context.clearRect(0, 0, kz.canvas.width, kz.canvas.height);
  };
};

kz.initialize = function (canvas_id) {
  kz.initializeCanvas(canvas_id);

  document.addEventListener('keydown', function(event) {
    event.preventDefault();
    if (kz.keys_status[event.which] == 0) {
      kz.keys_status[event.which] = 1;
      event.kztype = 'keypress';
    } else {
      event.kztype = 'keyheld';
    }
    kz.events.push(event);
  });

  document.addEventListener('keyup', function(event) {
    event.preventDefault();
    event.kztype = 'keyup';
    kz.keys_status[event.which] = 0;
    kz.events.push(event);
  });

  // touch events
  document.addEventListener('touchstart', function(event) {
    event.preventDefault();
    for (var ii = 0; ii < event.touches.length; ii++) {
      var touch = event.touches[ii];
      if (kz.TOUCHES[touch.identifier]) continue;
      kz.TOUCHES[touch.identifier] = {
        initial: touch,
        current: touch
      };
    }
    console.log('touchstart:', event, JSON.stringify(kz.TOUCHES));
  });

  document.addEventListener('touchmove', function(event) {
    event.preventDefault();
    for (var ii = 0; ii < event.touches.length; ii++) {
      var touch = event.touches[ii];
      if (!kz.TOUCHES[touch.identifier]) continue;
      kz.TOUCHES[touch.identifier].current = touch;
    }
    console.log('touchmove:', event, JSON.stringify(kz.TOUCHES));
  });

  document.addEventListener('touchend', function(event) {
    event.preventDefault();
    for (var id in kz.TOUCHES) {
      var found = false;
      for (var ii = 0; ii < event.touches.length; ii++) {
        if (event.touches[ii].identifier == id) found = true;
      }
      if (found) continue;
      var start_x = kz.TOUCHES[id].initial.screenX;
      var start_y = kz.TOUCHES[id].initial.screenY;
      var end_x = kz.TOUCHES[id].current.screenX;
      var end_y = kz.TOUCHES[id].current.screenY;
      if (Math.abs(start_x - end_x) + Math.abs(start_y - end_y) < 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.KEYS.Z
        });
      } else if (Math.abs(start_y - end_y) < 40
                 && start_x - end_x > 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.KEYS.LEFT
        });
      } else if (Math.abs(start_y - end_y) < 40
                 && end_x - start_x > 20) {
        kz.events.push({
          kztype: 'keypress',
          which: kz.KEYS.RIGHT
        });
      }

      delete kz.TOUCHES[id];
    }
    console.log('touchend:', event, JSON.stringify(kz.TOUCHES));
  });
};

var tickID;

kz.tick = function (now) {
  kz.scene.preUpdate(kz.performance.now());
  kz.scene.draw(kz.performance.now());
  kz.scene.postUpdate(kz.performance.now());
  tickID = window.requestAnimationFrame(kz.tick);
};

kz.run = function (scene) {
  if (tickID) {
    window.cancelAnimationFrame(tickID);
  }
  if (kz.scene) {
    kz.scene.exit();
  }
  //if (!kz.isSceneLike(scene)) throw 'No scene attached!';
  kz.entities = {};
  kz.scene = scene;
  kz.scene.initialize();
  kz.alive = true;
  tickID = window.requestAnimationFrame(kz.tick);
};

kz.performance = Object.create(performance);
kz.performance.pauseTime = 0;
kz.performance.now = function () {
  if (kz.paused) {
      return kz.pauseNow;
  } else {
    return performance.now() - kz.performance.pauseTime;
  }
}
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
  kz.context.clearAll();
  kz.context.save();
  kz.context.fillStyle = '#30403b';
  kz.context.fillRect(
    0,
    0,
    kz.canvas.width,
    kz.canvas.height
  );
  kz.context.restore();

  text = ['LOADING', 'LOADING.', 'LOADING..', 'LOADING...']

  kz.context.save();
  kz.context.textAlign = 'center';
  kz.context.textBaseline = 'center';
  kz.context.font = '18px font';
  kz.context.fillStyle = 'rgb(142, 212, 165)';
  kz.context.lineWidth = 2;
  kz.context.fillText(
    text[Math.round(now/500)%4],
    kz.canvas.width / 2,
    kz.canvas.height / 2
  );
  kz.context.restore();
};
// three '/' represents comments for minification purposes
var scene_main_menu = (function () {
  var scene_main_menu = new kz.Scene();
  var graphics;

  scene_main_menu.initialize = function () {
    graphics = {
      press_space_visible: true,
      blink: true,
      text_alpha: 1,
      fadeAlpha: 1,
      exiting: false
    };
    kz.tween({
      object: graphics,
      property: 'fadeAlpha',
      value: 0,
      duration: 100
    });
  }

  scene_main_menu.draw = function () {
    kz.context.clearAll();

    kz.context.save();
    kz.context.fillStyle = '#30403b';
    kz.context.fillRect(
      0,
      0,
      kz.canvas.width,
      kz.canvas.height
    );
    kz.context.restore();

    kz.context.textAlign = 'center';
    kz.context.textBaseline = 'center';
    kz.context.font = '48px font';
    ///kz.context.fillStyle = 'rgb(142, 212, 165)';
    kz.context.fillStyle = '#8ed4a5';
    kz.context.fillText(
      'ZODIAC 13',
      kz.canvas.width / 2,
      125
    );

    if (graphics.press_space_visible) {
      kz.context.save();
      kz.context.globalAlpha = graphics.text_alpha;
      ///kz.context.textAlign = 'center';
      ///kz.context.textBaseline = 'center';
      kz.context.font = '24px font';
      kz.context.fillStyle = 'white';
      kz.context.fillText(
        'PRESS   Z',
        kz.canvas.width / 2,
        250
      );
      kz.context.restore();
    }

    kz.context.save();
    kz.context.globalAlpha = graphics.text_alpha;
    ///kz.context.textAlign = 'center';
    ///kz.context.textBaseline = 'center';
    kz.context.font = '10px font';
    kz.context.fillStyle = '#50605b';
    kz.context.lineWidth = 2;
    kz.context.fillText(
      'HERMAN CHAU (KCAZE)',
      kz.canvas.width / 2,
      380
    );
    kz.context.restore();
    kz.context.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
  }

  scene_main_menu.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress' &&
          kz.events[ii].which == kz.KEYS.Z &&
          !graphics.exiting) {
        kz.resources.sounds['sfx_select'].play();
        graphics.exiting = true;
        graphics.blink = false;
        graphics.press_space_visible = false;
        kz.tween({
          object: graphics,
          property: 'fadeAlpha',
          value: 1,
          duration: 100
        }).then(function () {
          kz.run(scene_character_select);
        });
      }
    }
    kz.events = [];

    if (graphics.blink) {
      if (Math.floor(now/500)%4 < 2) {
        graphics.press_space_visible = true;
      } else {
        graphics.press_space_visible = false;
      }
    }
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
    kz.tween({
      object: graphics,
      property: 'fadeAlpha',
      value: 0,
      duration: 100
    });
    state = {
      exiting: false
    };
  }

  scene.draw = function () {
    kz.context.clearAll();

    kz.context.save();
    kz.context.fillStyle = '#30403b';
    kz.context.fillRect(
      0,
      0,
      kz.canvas.width,
      kz.canvas.height
    );
    kz.context.restore();

    kz.context.textAlign = 'center';
    kz.context.textBaseline = 'center';
    kz.context.font = '48px font';
    kz.context.fillStyle = 'rgb(142, 212, 165)';
    kz.context.fillText(
      'RECORDS',
      kz.canvas.width / 2,
      125
    );

    kz.context.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
  }

  scene.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (state.exiting) continue;
      if (kz.events[ii].kztype == 'keypress') {
        if (kz.events[ii].which == kz.KEYS.ESCAPE) {
          state.exiting = true;
          kz.tween({
            object: state,
            property: 'fadeAlpha',
            value: 1,
            duration: 100
          }).then(function () {
            kz.run(scene);
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
      selected: 0,
      exiting: false,
      fadeAlpha: 1
    }
    kz.tween({
      object: state,
      property: 'fadeAlpha',
      value: 0,
      duration: 100});
    characters = [
      {
        description: 'ENDS TURN WHITE',
        name: 'BOAR',
        image: kz.resources.images['character_boar'],
        unlock_message: '13 WHITE ORBS IN A ROW',
        unlocked: getRecord('max_white_orbs') >= 13,
        zodiac: function (data) {
          var state = data.state;
          var config = data.config;
          for (var yy = 0; yy < config.board_height; yy++) {
            if (state.board[yy][0].piece_type && state.board[yy][0].piece_type != 1) {
              state.board[yy][0].piece_type = 1;
              data.animateColorChange(state.board[yy][0].piece, 1);
            }
            if (state.board[yy][config.board_width-1].piece_type && state.board[yy][config.board_width-1].piece_type != 1) {
              state.board[yy][config.board_width-1].piece_type = 1;
              data.animateColorChange(state.board[yy][config.board_width-1].piece, 1);
            }
          }
        }
      },
      {
        description: 'CLEAR ROW ABOVE',
        name: 'CAT',
        image: kz.resources.images['character_cat'],
        unlocked: true,
        zodiac: function (data) {
          var state = data.state;
          var config = data.config;
          var row = data.row;
          row--;
          var row_pieces = [];
          for (var xx = 0; xx < config.board_width; xx++) {
            if (state.board[row][xx].piece) {
              row_pieces.push(state.board[row][xx].piece);
            }
          }
          for (xx = 0; xx < config.board_width; xx++) {
            state.board[row][xx] = {
              piece_type: 0
            };
          }
          data.animateClearPieces(row_pieces);
        }
      },
      {
        description: 'CLEAR LEFT SIDE',
        name: 'DOG',
        image: kz.resources.images['character_dog'],
        unlock_message: '169 ORBS SHOT',
        unlocked: getRecord('total_orbs') >= 169,
        zodiac: function (data) {
          var board = data.state.board;
          var pieces = [];
          for (var yy = 0; yy < data.config.board_height; yy++) {
            if (board[yy][0].piece_type) {
              pieces.push(board[yy][0].piece);
              board[yy][0].piece_type = 0;
            }
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        description: 'CLEAR 4 ON ENDS',
        name: 'DRAGON',
        image: kz.resources.images['character_dragon'],
        unlock_message: 'SCORE 169',
        unlocked: getRecord('max_score') >= 169,
        zodiac: function(data) {
          var leftCounter = 4;
          var rightCounter = 4;
          var pieces = [];
          var board = data.state.board;
          var width = data.config.board_width;
          for (var yy = data.config.board_height - 1; yy >= 0; yy--) {
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
        description: 'CLEAR 12 RANDOM',
        name: 'HARE',
        image: kz.resources.images['character_hare'],
        unlock_message: 'REACH LEVEL 13',
        unlocked: getRecord('max_level') >= 13,
        zodiac: function(data) {
          var board = data.state.board;
          var count = 0;
          var pieces = [];
          var piece_locs = [];
          for (var yy = 0; yy < data.config.board_height; yy++) {
            for (var xx = 0; xx < data.config.board_width; xx++) {
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
        description: 'SCORE +2',
        name: 'HORSE',
        image: kz.resources.images['character_horse'],
        unlock_message: 'ZODIAC 13 TIMES',
        unlocked: getRecord('total_zodiac') >= 13,
        zodiac: function(data) {
          data.incrementScore(2);
        }
      },
      {
        description: 'DELAY ROW DROP',
        name: 'MONKEY',
        image: kz.resources.images['character_monkey'],
        unlock_message: 'ZODIAC 169 TIMES',
        unlocked: getRecord('total_zodiac') >= 169,
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
        description: 'ENDS TURN BLACK',
        name: 'OX',
        image: kz.resources.images['character_ox'],
        unlock_message: '13 BLACK ORBS IN A ROW',
        unlocked: getRecord('max_black_orbs') >= 13,
        zodiac: function (data) {
          var state = data.state;
          var config = data.config;
          for (var yy = 0; yy < config.board_height; yy++) {
            if (state.board[yy][0].piece_type && state.board[yy][0].piece_type != 2) {
              state.board[yy][0].piece_type = 2;
              data.animateColorChange(state.board[yy][0].piece, 2);
            }
            if (state.board[yy][config.board_width-1].piece_type && state.board[yy][config.board_width-1].piece_type != 2) {
              state.board[yy][config.board_width-1].piece_type = 2;
              data.animateColorChange(state.board[yy][config.board_width-1].piece, 2);
            }
          }
        }
      },
      {
        description: 'NEXT ALL WHITE',
        name: 'RAT',
        image: kz.resources.images['character_rat'],
        unlock_message: '1313 ORBS SHOT',
        unlocked: getRecord('total_orbs') >= 1313,
        zodiac: function (data) {
          for (var ii = 0; ii < 8; ii++) {
            data.state.player.next[ii] = 1;
          }
        }
      },
      {
        description: 'CLEAR RIGHT SIDE',
        name: 'ROOSTER',
        image: kz.resources.images['character_rooster'],
        unlock_message: 'SURVIVE 13 MINUTES',
        unlocked: getRecord('max_time') >= 13*60,
        zodiac: function (data) {
          var board = data.state.board;
          var pieces = [];
          var width = data.state.board_width;
          for (var yy = 0; yy < data.config.board_height; yy++) {
            if (board[yy][width-1].piece_type) {
              pieces.push(board[yy][width-1].piece);
              board[yy][width-1].piece_type = 0;
            }
          }
          data.animateClearPieces(pieces);
        }
      },
      {
        description: 'CLEAR TOP ROW',
        name: 'SHEEP',
        image: kz.resources.images['character_sheep'],
        unlock_message: 'SCORE 13',
        unlocked: getRecord('max_score') >= 13,
        zodiac: function (data) {
          var state = data.state;
          var config = data.config;
          var row_pieces = [];
          for (var xx = 0; xx < config.board_width; xx++) {
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
        description: 'NEXT ALL BLACK',
        name: 'SNAKE',
        image: kz.resources.images['character_snake'],
        unlock_message: 'PLAY 13 GAMES',
        unlocked: getRecord('play_count') >= 13,
        zodiac: function (data) {
          for (var ii = 0; ii < 8; ii++) {
            data.state.player.next[ii] = 2;
          }
        }
      },
      {
        description: 'SCORE +LEVEL/3',
        name: 'TIGER',
        image: kz.resources.images['character_tiger'],
        unlock_message: '169 ROWS CLEARED',
        unlocked: getRecord('total_rows') >= 169,
        zodiac: function (data) {
          data.incrementScore(Math.floor(data.state.level/3));
        }
      },
      {
        description: '',
        name: 'RANDOM',
        image: kz.resources.images['character_random'],
        unlocked: true
      }
    ];
  }

  scene.draw = function (now) {
    kz.context.clearAll();

    kz.context.save();
    kz.context.fillStyle = '#30403b';
    kz.context.fillRect(
      0,
      0,
      kz.canvas.width,
      kz.canvas.height
    );
    kz.context.restore();

    for (var yy = 0; yy < 7; yy++) {
      for (var xx = 0; xx < 2; xx++) {
        var idx = yy*2 + xx;
        if (idx >= characters.length) break;
        kz.context.drawImage(
          characters[idx].image,
          xx*49 + 10,
          yy*49 + 20
        )
        if (!characters[idx].unlocked) {
          kz.context.fillStyle = 'rgba(0,0,0,0.7)';
          kz.context.fillRect(xx*49 + 11, yy*49 + 21, 48, 48) ;
        }
      }
    }
    if (Math.floor(now/200) % 3) {
      kz.context.strokeStyle = '#fff';
      kz.context.lineWidth = 1;
      kz.context.strokeRect((state.selected%2)*49 + 10, Math.floor(state.selected/2)*49 + 20, 50, 50) ;
    }
    kz.context.textAlign = 'right';
    kz.context.textBaseline = 'center';
    kz.context.font = '24px font';
    kz.context.fillStyle = 'white';
    kz.context.fillText(
      characters[state.selected].name,
      kz.canvas.width - 10,
      330
    );
    kz.context.textAlign = 'right';
    kz.context.textBaseline = 'center';
    kz.context.font = '16px font';
    kz.context.fillStyle = 'white';
    if (characters[state.selected].unlocked) {
      kz.context.fillText(
        characters[state.selected].description,
        kz.canvas.width - 10,
        360
      );
    } else {
      kz.context.font = '12px font';
      kz.context.fillStyle = '#50605b';
      kz.context.fillText(
        characters[state.selected].unlock_message,
        kz.canvas.width - 10,
        360
      );
    }
    kz.context.fillStyle = 'rgba(0,0,0,'+state.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
  }

  scene.preUpdate = function (now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (state.exiting) continue;
      if (kz.events[ii].kztype == 'keypress') {
        if (kz.events[ii].which == kz.KEYS.RIGHT) {
          state.selected = Math.min(13, state.selected+1);
        } else if (kz.events[ii].which == kz.KEYS.DOWN) {
          state.selected = Math.min(13, state.selected+2);
        } else if (kz.events[ii].which == kz.KEYS.LEFT) {
          state.selected = Math.max(0, state.selected-1);
        } else if (kz.events[ii].which == kz.KEYS.UP) {
          state.selected = Math.max(0, state.selected-2);
        } else if (kz.events[ii].which == kz.KEYS.Z) {
          if (state.selected == 13) {
            state.selected = Math.floor(Math.random() * 14);
            while (!characters[state.selected].unlocked) {
              state.selected = Math.floor(Math.random() * 14);
            }
          }
          if (characters[state.selected].unlocked) {
            kz.resources.sounds['sfx_select'].play();
            character = characters[state.selected];
            state.exiting = true;
            kz.tween({
              object: state,
              property: 'fadeAlpha',
              value: 1,
              duration: 100
            }).then(function () {
              kz.run(scene_game);
            });
          } else {
            kz.resources.sounds['sfx_denied'].play();
          }
        } else if (kz.events[ii].which == kz.KEYS.ESCAPE) {
          state.exiting = true;
          kz.tween({
            object: state,
            property: 'fadeAlpha',
            value: 1,
            duration: 100
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
  var config = {
    board_width: 8,
    board_height: 17,
    grid_size: 20,
    next_length: 8,
    next_row_interval: 20000
  };
  var board_canvas = document.createElement('canvas');
  var info_canvas = document.createElement('canvas');
  var pause_canvas = document.createElement('canvas');
  var gameover_canvas = document.createElement('canvas');
  board_canvas.width = config.board_width*config.grid_size;
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
  var PieceTypes = {
    Empty: 0,
    Red: 1,
    Blue: 2,
    Zodiac: 3
  };
  var normal_piece_types = [PieceTypes.Red, PieceTypes.Blue];

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
      kz.canvas,
      0,
      0
    );
    kz.tween({
      object: graphics,
      property: 'pause_alpha',
      value: 0.8,
      duration: 50
    });
  }

  function resume() {
    kz.tween({
      object: graphics,
      property: 'pause_alpha',
      value: 0,
      duration: 50
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
      actions_promise: blankPromise()
    });
  }

  function pieceTypeImage(piece_type) {
    return [
      kz.resources.images['piece_red'],
      kz.resources.images['piece_blue'],
      kz.resources.images['piece_zodiac']
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
    bgm.stop();
    state.alive = false;
    incrementRecord('playcount', 1);
    console.log('Lost :(');

    // copy over game picture at losing time
    gameover_context.clearRect(
      0,
      0,
      gameover_canvas.width,
      gameover_canvas.height
    );
    gameover_context.drawImage(
      kz.canvas,
      0,
      0
    );
    // fade to black
    kz.tween({
      object: graphics,
      property: 'gameover_background_alpha',
      value: 1,
      duration: 1000
    }).then(function () {
      return kz.tween({
        object: graphics,
        property: 'gameover_text_alpha',
        value: 1,
        duration: 1000
      });
    }).then(function () {
      state.can_restart = true;
    });
  }

  function clearRow() {
    var row;
    var activateAbility = false;

    for (var yy = 0; yy < config.board_height; yy++) {
      var piece_type = state.board[yy][0].piece_type;
      var zodiacCounter = 0;
      var cleared = true;
      for (var xx = 0; xx < config.board_width; xx++) {
        if (state.board[yy][xx].piece_type == PieceTypes.Zodiac) {
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
      console.log(state.next_row_interval);
    }

    // capture row pieces before we update board so we can animate them
    var row_pieces = [];
    for (var xx = 0; xx < config.board_width; xx++) {
      row_pieces.push(state.board[row][xx].piece);
    }

    // update of underlying board
    for (xx = 0; xx < config.board_width; xx++) {
      state.board[row][xx] = {
        piece_type: PieceTypes.Empty
      };
    }

    // animation
    animateClearPieces(row_pieces);

    // activate zodiac
    if (!activateAbility) return;
    state.zodiacs++;
    incrementRecord('total_zodiac', 1);
    maxRecord('total_zodiac', state.zodiacs);
    character.zodiac({
      state: state,
      animateClearPieces: animateClearPieces,
      animateColorChange: animateColorChange,
      config: config,
      incrementScore: incrementScore,
      row: row
    });
  }

  function animateClearPieces(pieces) {
    kz.resources.sounds['sfx_clear'].play();
    // animate fade away
    // ensure that all row piece animations have finished
    var promise  = [];
    pieces.forEach(function (piece) {
      promise.push(piece.actions_promise);
    })
    promise = Promise.all(promise);
    pieces.forEach(function (piece) {
      var piecePromise = promise.then(function () {
        return kz.tween({
          object: piece,
          property: 'alpha',
          value: 0,
          duration: 100
        }).then(function () {
          piece.destroy();
        });
      });
      piece.actions_promise = piecePromise;
    });
  }

  function drop() {
    for (var yy = config.board_height-1; yy > 0; yy--) {
      for (var xx = 0; xx < config.board_width; xx++) {
        if (state.board[yy][xx].piece_type && !state.board[yy-1][xx].piece_type) {
          state.board[yy-1][xx] = state.board[yy][xx];
          state.board[yy][xx] = {
            piece_type: PieceTypes.Empty
          };
          var piece = state.board[yy-1][xx].piece;
          (function (piece) {
            // ensure we start the animation AFTER the row fades away
            piece.actions_promise = piece.actions_promise.then(function () {
              return kz.tween({
                object: piece,
                property: 'y',
                value: piece.y - config.grid_size,
                duration: 100
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

    if (piece_type == PieceTypes.Empty || piece_type == PieceTypes.Zodiac) return

    for (var ii = 0; ii < 8; ii++) {
      var dx = dxs[ii];
      var dy = dys[ii];
      var reverse = false;
      var length = 1;
      var x = board_x + length * dx;
      var y = board_y + length * dy;
      while (0 <= x
             && 0 <= y
             && x < config.board_width
             && y < config.board_height) {
        if (state.board[y][x].piece_type == PieceTypes.Empty
          || state.board[y][x].piece_type == PieceTypes.Zodiac) break;
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
    piece.actions_promise = piece.actions_promise.then(function () {
      return new Promise(function(resolve) {
        piece.blend_type = to_type;
        kz.tween({
          object: piece,
          property: 'blend_alpha',
          value: 1,
          duration: 100
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
    kz.resources.sounds['sfx_drop'].play();
    var new_row = [];
    for (var ii = 0; ii < config.board_width; ii++) {
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
    var piece_type = new_row[config.board_width-1].piece_type;
    for (var ii = 0; ii < config.board_width; ii++) {
      piece_type ^= new_row[ii].piece_type;
    }
    if (piece_type) {
      new_row[config.board_width-1].piece_type ^= 3;
      new_row[config.board_width-1].piece.type ^= 3;
    }

    // update board
    for (var xx = 0; xx < config.board_width; xx++) {
      if (state.board[config.board_height-1][xx].piece_type
          != PieceTypes.Empty) {
        lose();
        return;
      }
      for (var yy = config.board_height-1; yy > 0; yy--) {
        state.board[yy][xx] = state.board[yy-1][xx];
      }
      state.board[0][xx] = new_row[xx];
    }

    // animate pieces
    state.board.forEach(function (row) {
      row.forEach(function (square) {
        var piece = square.piece;
        if (!piece) return;
        piece.actions_promise = piece.actions_promise.then(function () {
          return kz.tween({
            object: piece,
            property: 'y',
            value: piece.y + config.grid_size,
            rate: 1
          });
        });
      });
    });
  }
  /*$ Messy section of game logic */

  function initialize() {
    bgm = kz.resources.sounds['bgm_game'].play(true);
    bgm.stop();
  // initialize graphics
    graphics = {
      background_pattern: kz.context.createPattern(
        kz.resources.images['background'],
        'repeat'),
      pause_alpha: 0,
      gameover_background_alpha: 0,
      gameover_text_alpha: 0,
      fadeAlpha: 1
    }
    kz.tween({
      object: graphics,
      property: 'fadeAlpha',
      value: 0,
      duration: 100});


  // intialize state
    state = {
      alive: true,
      begin: kz.performance.now(),
      board: [],
      can_restart: false,
      score: 0,
      level: 1,
      rows_cleared: 0,
      next_row_interval: config.next_row_interval,
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
    for (var yy = 0; yy < config.board_height; yy++) {
      state.board.push([]);
      for (var xx = 0; xx < config.board_width; xx++) {
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
          if (xx == config.board_width - 1) {
            var piece_type = state.board[yy][0].piece_type;
            for (var xxx = 0; xxx < config.board_width; xxx++) {
              piece_type &= state.board[yy][xxx].piece_type
            }
            if (piece_type) {
              state.board[yy][config.board_width - 1].piece_type ^= 3;
              state.board[yy][config.board_width - 1].piece.type ^= 3;
            }
          }
        } else {
          state.board[yy].push({
            piece_type: PieceTypes.Empty
          });
        }
      }
    }
    pause_choice = 0;
    // initialize player
    state.player = new kz.Entity({
      frames: [
        kz.resources.images['shooter_0'],
        kz.resources.images['shooter_1'],
        kz.resources.images['shooter_2'],
        kz.resources.images['shooter_3']
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
      x: Math.floor(config.board_width/2),
      sprite_x: 4+Math.floor(config.board_width/2)*config.grid_size,
      sprite_y: config.board_height*config.grid_size+23,
      actions_promise: blankPromise(),
      draw: function (context) {
        context.drawImage(
          this.frames[this.current_frame],
          this.sprite_x,
          this.sprite_y);
        // draw aiming line
        var h;
        for (h = config.board_height-1; h >= 0; h--) {
          if (state.board[h][this.x].piece_type != PieceTypes.Empty) {
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
          this.sprite_x+config.grid_size/2-5,
          this.sprite_y-8
        );
        board_context.lineTo(
          this.sprite_x+config.grid_size/2-5,
          (h+1) * config.grid_size + 20
        );
        board_context.stroke();
        board_context.restore();
      },
      listen: function (event) {
        if (event.kztype == 'keypress') {
          switch (event.which) {
            case kz.KEYS.LEFT:
              this.move(-1);
              break;
            case kz.KEYS.RIGHT:
              this.move(1);
              break;
            case kz.KEYS.Z:
              this.shoot();
              break;
          }
        } else if (event.kztype == 'keyheld') {
          switch (event.which) {
            case kz.KEYS.LEFT:
              this.move(-1);
              break;
            case kz.KEYS.RIGHT:
              this.move(1);
              break;
          }
        }
      },
      move: function (dx) {
        if (this.x+dx >= 0 && this.x+dx < config.board_width) {
          this.x += dx;
          this.actions_promise = this.actions_promise.then(function () {
            return kz.tween({
              object: this,
              property: 'sprite_x',
              value: this.sprite_x + dx*config.grid_size,
              rate: 0.7
            }).then(function () {
              return blankPromise();
            }.bind(this));
          }.bind(this));
        }
      },
      next: [],
      shoot : function() {
        if (state.board[config.board_height-1][this.x].piece_type
            != PieceTypes.Empty) {
          lose();
          return;
        }

        incrementRecord('total_orbs', 1);

        var piece_type = this.next.shift();
        var next_piece_type = Math.random()*16 > 1
          ? randomPieceType(normal_piece_types)
          : PieceTypes.Zodiac;
        this.next.push(next_piece_type);

        // update consecutive counts
        if (state.consecutive[piece_type]) {
          state.consecutive[piece_type]++;
          console.log("Consecutives: ", state.consecutive);
        } else {
          state.consecutive[PieceTypes.Red] = 0;
          state.consecutive[PieceTypes.Blue] = 0;
          state.consecutive[PieceTypes.Zodiac] = 0;
          state.consecutive[piece_type] = 1;
        }
        var pieceTypeRecordMap = {
          1: 'max_white_orbs',
          2: 'max_black_orbs',
          3: 'max_zodiac_orbs'
        };
        maxRecord(pieceTypeRecordMap[piece_type], state.consecutive[piece_type]);

        var target_y = config.board_height-1;
        while (target_y > 0) {
          if (state.board[target_y-1][this.x].piece_type
              != PieceTypes.Empty) {
            break;
          }
          target_y--;
        }
        var piece = makePiece(
          this.x*config.grid_size + 1,
          (config.board_height-1)*config.grid_size + 1,
          piece_type
        );
        state.board[target_y][this.x] = {
          piece_type: piece_type,
          piece: piece
        };
        reverse(this.x, target_y);

        piece.actions_promise = piece.actions_promise.then(function () {
          kz.resources.sounds['sfx_shoot'].play();
          return kz.tween({
            object: piece,
            property: 'y',
            value: board_to_piece(target_y),
            rate: 3
          });
        });
       }
    });
    for (var ii = 0; ii < 8; ii++) {
      state.player.next.push(randomPieceType(normal_piece_types));
      if (Math.random()*16 < 1) {
        state.player.next[ii] = PieceTypes.Zodiac;
      }
    }
  }

  function drawAlive(now) {
    // clear contexts
    kz.context.clearAll();
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
      config.board_height * config.grid_size + 20
    );
    board_context.lineTo(
      config.board_width * config.grid_size,
      config.board_height * config.grid_size + 20
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
    info_context.font = '24px font';
    info_context.fillStyle = 'white';
    info_context.fillText('NEXT', 48, 120);
    info_context.fillText('SCORE', 48, 211);
    info_context.fillText('LEVEL', 48, 272);
    info_context.fillText('TIME', 48, 333);
    info_context.font = '20px font';
    info_context.textBaseline = 'bottom';
    info_context.fillText(character.name, 48, 101);

    info_context.font = '20px font';
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
    for (var ii = 0; ii < config.next_length; ii++) {
      info_context.drawImage(
        pieceTypeImage(state.player.next[ii]),
        9+(ii%4)*config.grid_size,
        148 + Math.floor(ii/4)*23
      );
    }

    info_context.drawImage(
      character.image,
      23,
      20
    );

    // main context drawing
    kz.context.fillStyle = graphics.background_pattern;
    kz.context.fillRect(0, 0, kz.canvas.width, kz.canvas.height);
    kz.context.drawImage(board_canvas, 10, 0);
    kz.context.drawImage(
      info_canvas,
      10 + board_canvas.width + 7,
      0
    );
    kz.context.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
  }

  function preUpdateAlive(now) {
    maxRecord('max_time', Math.floor(now - state.begin));
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress' &&
          kz.events[ii].which == kz.KEYS.ESCAPE) {
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
    kz.context.clearAll();
    kz.context.save();
    kz.context.globalAlpha = 1;
    kz.context.drawImage(
      pause_canvas,
      0,
      0
    );
    kz.context.globalAlpha = graphics.pause_alpha;
    kz.context.fillStyle = '#000000';
    kz.context.fillRect(
      0,
      0,
      kz.canvas.width,
      kz.canvas.height
    );
    kz.context.restore();
    kz.context.save();
    kz.context.textAlign = 'center';
    kz.context.textBaseline = 'center';
    kz.context.font = '24px font';
    kz.context.fillStyle = pause_choice == 0 ? '#fff' : '#666';
    kz.context.fillText('RESUME', kz.canvas.width/2, kz.canvas.height/2-48);
    kz.context.fillStyle = pause_choice == 1 ? '#fff' : '#666';
    kz.context.fillText('RESTART', kz.canvas.width/2, kz.canvas.height/2);
    kz.context.fillStyle = pause_choice == 2 ? '#fff' : '#666';
    kz.context.fillText('QUIT', kz.canvas.width/2, kz.canvas.height/2+48);
    kz.context.restore();
    kz.context.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
  }

  function drawDead(now) {
    kz.context.clearAll();
    kz.context.save();
    kz.context.globalAlpha = 1;
    kz.context.drawImage(
      gameover_canvas,
      0,
      0
    );
    kz.context.globalAlpha = graphics.gameover_background_alpha;
    kz.context.fillStyle = 'rgb(142, 212, 165)';
    kz.context.fillRect(
      10,
      (kz.canvas.height / 2) - 28,
      160,
      42
    );
    kz.context.globalAlpha = graphics.gameover_text_alpha;
    kz.context.textAlign = 'center';
    kz.context.textBaseline = 'center';
    kz.context.font = '24px font';
    kz.context.fillStyle = '#fff';
    kz.context.fillText(
      'GAME OVER',
      kz.canvas.width / 2 - 46,
      kz.canvas.height / 2);
    kz.context.restore();
    kz.context.fillStyle = 'rgba(0,0,0,'+graphics.fadeAlpha+')';
    kz.context.fillRect(0,0,kz.canvas.width,kz.canvas.height);
  }

  function preUpdateDead(now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress' &&
          kz.events[ii].which == kz.KEYS.Z &&
          state.can_restart) {
        kz.tween({
          object: graphics,
          property: 'fadeAlpha',
          value: 1,
          duration: 100}).then(function () {
            kz.run(scene_main_menu);
          })
      }
    }
    kz.events = [];
  }

  function preUpdatePause(now) {
    for (var ii = 0; ii < kz.events.length; ii++) {
      if (kz.events[ii].kztype == 'keypress') {
        if (kz.events[ii].which == kz.KEYS.ESCAPE) {
          resume();
        } else if (kz.events[ii].which == kz.KEYS.DOWN) {
          pause_choice = Math.min(2, pause_choice+1);
        } else if (kz.events[ii].which == kz.KEYS.UP) {
          pause_choice = Math.max(0, pause_choice-1);
        } else if (kz.events[ii].which == kz.KEYS.Z) {
          resume();
          if (pause_choice == 0) {
          } else if (pause_choice == 1) {
            // TODO: this is dangerous. need to add an exiting variable in state.
            kz.tween({
              object: graphics,
              property: 'fadeAlpha',
              value: 1,
              duration: 100}).then(function () {
                kz.run(scene_game);
              });
          } else {
            kz.tween({
              object: graphics,
              property: 'fadeAlpha',
              value: 1,
              duration: 100}).then(function () {
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
    bgm.stop();
  }
  return scene_game
})();
// three '/' represents comments for minification purposes
///var isMobile = false;
// From http://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-mobile-device-in-jquery
///if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
    ///|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) isMobile = true;

var audio_context = new AudioContext();
function loadJSFXR(data, resolve) {
  var request = new XMLHttpRequest();
  request.open('GET', data, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    audio_context.decodeAudioData(request.response, resolve);
  };
  request.send();
}

function loadSonant(data, resolve) {
  var songGen = new sonantx.MusicGenerator(data);
  songGen.createAudioBuffer(resolve);
}

var resources = {
  images: {
    background: {
      data: 'images/background.gif'
    },
    character_boar: {
      data: 'images/characters.gif',
      crop: {x:0, y:0, w:50, h:50}
    },
    character_cat: {
      data: 'images/characters.gif',
      crop: {x:49, y:0, w:50, h:50}
    },
    character_dog: {
      data: 'images/characters.gif',
      crop: {x:0, y:49, w:50, h:50}
    },
    character_dragon: {
      data: 'images/characters.gif',
      crop: {x:49, y:49, w:50, h:50}
    },
    character_hare: {
      data: 'images/characters.gif',
      crop: {x:0, y:98, w:50, h:50}
    },
    character_horse: {
      data: 'images/characters.gif',
      crop: {x:49, y:98, w:50, h:50}
    },
    character_monkey: {
      data: 'images/characters.gif',
      crop: {x:0, y:147, w:50, h:50}
    },
    character_ox: {
      data: 'images/characters.gif',
      crop: {x:49, y:147, w:50, h:50}
    },
    character_rat: {
      data: 'images/characters.gif',
      crop: {x:0, y:196, w:50, h:50}
    },
    character_rooster: {
      data: 'images/characters.gif',
      crop: {x:49, y:196, w:50, h:50}
    },
    character_sheep: {
      data: 'images/characters.gif',
      crop: {x:0, y:245, w:50, h:50}
    },
    character_snake: {
      data: 'images/characters.gif',
      crop: {x:49, y:245, w:50, h:50}
    },
    character_tiger: {
      data: 'images/characters.gif',
      crop: {x:0, y:294, w:50, h:50}
    },
    character_random: {
      data: 'images/characters.gif',
      crop: {x:49, y:294, w:50, h:50}
    },
    piece_blue: {
      data: 'images/piece_black.gif'
    },
    piece_red: {
      data: 'images/piece_white.gif'
    },
    piece_zodiac: {
      data: 'images/piece_zodiac.gif'
    },
    shooter_0: {
      data: 'images/shooter0.gif'
    },
    shooter_1: {
      data: 'images/shooter1.gif'
    },
    shooter_2: {
      data: 'images/shooter2.gif'
    },
    shooter_3: {
      data: 'images/shooter1.gif'
    }
  },
  sounds: {
    'sfx_shoot': {
      data: jsfxr([0,,0.1881,,0.3164,0.8042,0.2,-0.2915,,,,,,0.4661,0.156,,0.1754,-0.182,1,,,0.1755,,0.5]),
      loader: loadJSFXR
    },
    'sfx_clear': {
      data: jsfxr([1,,0.06,0.4848,0.4938,0.8917,,,,,,,,,,,,,1,,,,,0.49]),
      loader: loadJSFXR
    },
    'sfx_select': {
      data: jsfxr([0,,0.0538,0.4336,0.3186,0.4583,,,,,,0.5712,0.5566,,,,,,1,,,,,0.5]),
      loader: loadJSFXR
    },
    'sfx_denied': {
      data: jsfxr([0,,0.24,0.51,0.3829,0.15,,,,,,,,,,,,,1,,,,,0.5]),
      loader: loadJSFXR
    },
    'sfx_drop': {
      data: jsfxr([1,,0.0468,,0.2103,0.4979,,-0.4519,,,,,,,,,,,1,,,,,0.83]),
      loader: loadJSFXR
    },
    'bgm_game': {
      loader: loadSonant,
      data:
      {
    "endPattern": 382,
    "songData": [
        {
            "osc2_waveform": 0,
            "osc2_xenv": 0,
            "fx_pan_amt": 108,
            "osc2_vol": 0,
            "lfo_amt": 187,
            "lfo_osc1_freq": 0,
            "noise_fader": 60,
            "osc1_detune": 0,
            "osc2_oct": 8,
            "fx_filter": 1,
            "fx_resonance": 120,
            "fx_pan_freq": 5,
            "osc2_det": 0,
            "fx_delay_time": 4,
            "fx_freq": 10332,
            "lfo_waveform": 0,
            "osc1_vol": 0,
            "fx_delay_amt": 16,
            "osc1_waveform": 0,
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
            "lfo_fx_freq": 0,
            "osc2_detune": 0,
            "env_release": 4607,
            "env_sustain": 419,
            "osc1_xenv": 0,
            "lfo_freq": 5,
            "env_master": 130,
            "osc1_det": 0,
            "env_attack": 50,
            "osc1_oct": 8
        },
        {
            "osc2_waveform": 0,
            "osc2_xenv": 0,
            "fx_pan_amt": 0,
            "osc2_vol": 255,
            "lfo_amt": 96,
            "lfo_osc1_freq": 0,
            "noise_fader": 0,
            "osc1_detune": 0,
            "osc2_oct": 8,
            "fx_filter": 2,
            "fx_resonance": 60,
            "fx_pan_freq": 0,
            "osc2_det": 0,
            "fx_delay_time": 1,
            "fx_freq": 4067,
            "lfo_waveform": 0,
            "osc1_vol": 255,
            "fx_delay_amt": 45,
            "osc1_waveform": 0,
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
            "lfo_fx_freq": 1,
            "osc2_detune": 0,
            "env_release": 13163,
            "env_sustain": 0,
            "osc1_xenv": 0,
            "lfo_freq": 3,
            "env_master": 255,
            "osc1_det": 0,
            "env_attack": 22,
            "osc1_oct": 7
        },
        {
            "osc2_waveform": 2,
            "osc2_xenv": 0,
            "fx_pan_amt": 0,
            "osc2_vol": 157,
            "lfo_amt": 0,
            "lfo_osc1_freq": 0,
            "noise_fader": 0,
            "osc1_detune": 0,
            "osc2_oct": 6,
            "fx_filter": 2,
            "fx_resonance": 76,
            "fx_pan_freq": 2,
            "osc2_det": 0,
            "fx_delay_time": 3,
            "fx_freq": 3900,
            "lfo_waveform": 0,
            "osc1_vol": 192,
            "fx_delay_amt": 0,
            "osc1_waveform": 2,
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
            "lfo_fx_freq": 1,
            "osc2_detune": 0,
            "env_release": 12631,
            "env_sustain": 2418,
            "osc1_xenv": 0,
            "lfo_freq": 0,
            "env_master": 139,
            "osc1_det": 0,
            "env_attack": 0,
            "osc1_oct": 5
        }
    ],
    "rowLen": 1739,
    "songLen": 46
    }
    }
  }
};

window.onload = function() {
  var fontHack = document.getElementById('fontHack');
  fontHack.parentNode.removeChild(fontHack);

  kz.initialize('canvas');
  kz.run(scene_loading);

  kz.loadResources(resources).then(function () {
    console.log("Loaded resources!");
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
(function() {
  var records = [
    'play_count', // done
    'total_time', // done
    'max_score', // done
    'max_level', // done
    'total_zodiac', // done
    'max_zodiac', // done
    'total_orbs', // done
    'max_white_orbs', // done
    'max_black_orbs', // done
    'max_zodiac_orbs', // done
    'max_rows', // done
    'total_rows', // done
    'max_time']; // done
  records.forEach(function (record) {
    if (!localStorage.getItem(record)) {
      localStorage.setItem(record, '0');
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
