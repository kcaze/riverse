//$a = sonantx
//M = MusicGenerator
//A = AudioGenerator
//S = SoundGenerator

// ac -- osc1_oct
// aa -- osc1_det
// h -- osc1_detune
// y -- osc1_xenv
// r -- osc1_vol
// t -- osc1_waveform
// i -- osc2_oct
// m -- osc2_det
// v -- osc2_detune
// b -- osc2_xenv
// d -- osc2_vol
// a -- osc2_waveform
// g -- noise_fader
// ab -- env_attack
// x -- env_sustain
// w -- env_release
// _ -- env_master
// j -- fx_filter
// o -- fx_freq
// k -- fx_resonance
// n -- fx_delay_time
// s -- fx_delay_amt
// l -- fx_pan_freq
// c -- fx_pan_amt
// f -- lfo_osc1_freq
// u -- lfo_fx_freq
// z -- lfo_freq
// e -- lfo_amt
// p -- lfo_waveform


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
