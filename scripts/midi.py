import json
import math
import sys

INSTRUMENTS = {
  'SOFTY': {
      "osc1_oct": 7,
      "osc1_det": 0,
      "osc1_detune": 0,
      "osc1_xenv": 0,
      "osc1_vol": 192,
      "osc1_waveform": 2,
      "osc2_oct": 7,
      "osc2_det": 0,
      "osc2_detune": 0,
      "osc2_xenv": 0,
      "osc2_vol": 201,
      "osc2_waveform": 3,
      "noise_fader": 0,
      "env_attack": 100,
      "env_sustain": 150,
      "env_release": 13636,
      "env_master": 191,
      "fx_filter": 2,
      "fx_freq": 5839,
      "fx_resonance": 254,
      "fx_delay_time": 6,
      "fx_delay_amt": 121,
      "fx_pan_freq": 6,
      "fx_pan_amt": 147,
      "lfo_osc1_freq": 0,
      "lfo_fx_freq": 1,
      "lfo_freq": 6,
      "lfo_amt": 195,
      "lfo_waveform": 0
  },
  '8BIT': {
    "osc1_oct": 7,
    "osc1_det": 0,
    "osc1_detune": 0,
    "osc1_xenv": 0,
    "osc1_vol": 192,
    "osc1_waveform": 1,
    "osc2_oct": 6,
    "osc2_det": 0,
    "osc2_detune": 9,
    "osc2_xenv": 0,
    "osc2_vol": 192,
    "osc2_waveform": 1,
    "noise_fader": 0,
    "env_attack": 137,
    "env_sustain": 2000,
    "env_release": 4611,
    "env_master": 192,
    "fx_filter": 1,
    "fx_freq": 982,
    "fx_resonance": 89,
    "fx_delay_time": 6,
    "fx_delay_amt": 25,
    "fx_pan_freq": 6,
    "fx_pan_amt": 77,
    "lfo_osc1_freq": 0,
    "lfo_fx_freq": 1,
    "lfo_freq": 3,
    "lfo_amt": 69,
    "lfo_waveform": 0
  },
  'SQUARE': {
    "osc1_oct": 7,
    "osc1_det": 0,
    "osc1_detune": 0,
    "osc1_xenv": 0,
    "osc1_vol": 255,
    "osc1_waveform": 1,
    "osc2_oct": 7,
    "osc2_det": 0,
    "osc2_detune": 9,
    "osc2_xenv": 0,
    "osc2_vol": 154,
    "osc2_waveform": 1,
    "noise_fader": 0,
    "env_attack": 197,
    "env_sustain": 88,
    "env_release": 10614,
    "env_master": 45,
    "fx_filter": 0,
    "fx_freq": 11025,
    "fx_resonance": 255,
    "fx_delay_time": 2,
    "fx_delay_amt": 146,
    "fx_pan_freq": 3,
    "fx_pan_amt": 47,
    "lfo_osc1_freq": 0,
    "lfo_fx_freq": 0,
    "lfo_freq": 0,
    "lfo_amt": 0,
    "lfo_waveform": 0
  },
  'BASSDRUM1': {
    "osc1_oct": 7,
    "osc1_det": 0,
    "osc1_detune": 0,
    "osc1_xenv": 1,
    "osc1_vol": 255,
    "osc1_waveform": 0,
    "osc2_oct": 7,
    "osc2_det": 0,
    "osc2_detune": 0,
    "osc2_xenv": 1,
    "osc2_vol": 255,
    "osc2_waveform": 0,
    "noise_fader": 0,
    "env_attack": 50,
    "env_sustain": 150,
    "env_release": 4800,
    "env_master": 200,
    "fx_filter": 2,
    "fx_freq": 600,
    "fx_resonance": 254,
    "fx_delay_time": 0,
    "fx_delay_amt": 0,
    "fx_pan_freq": 0,
    "fx_pan_amt": 0,
    "lfo_osc1_freq": 0,
    "lfo_fx_freq": 0,
    "lfo_freq": 0,
    "lfo_amt": 0,
    "lfo_waveform": 0
  }
}

def convertPart(part, instrument):
  length = 0 
  notes = part.notesAndRests
  for note in notes:
    length += int(note.quarterLength*32)
  num_beats = length/32 + (1 if length%32 != 0 else 0)
  patterns = [i for i in range(num_beats)]
  columns = [{'n': []} for i in range(num_beats)]
  part = INSTRUMENTS[instrument].copy()
  #F0 in sonant is 92, whereas it's 5 in MIDI
  midi_to_sonant_offset = 92 - 5
  idx = 0
  for note in notes:
    if isinstance(note, music21.note.Rest):
      columns[idx/32]['n'] += [0]
      idx += 1
    elif isinstance(note, music21.note.Note):
      duration = int(note.quarterLength*4) - 1
      columns[idx/32]['n'] += [note.midi + midi_to_sonant_offset]
      idx += 1
      for i in range(duration):
        columns[idx/32]['n'] += [0]
        idx += 1
    elif isinstance(note, music21.chord.Chord):
      duration = int(note.quarterLength*4) - 1
      columns[idx/32]['n'] += [note.root().midi + midi_to_sonant_offset]
      idx += 1
      for i in range(duration):
        columns[idx/32]['n'] += [0]
        idx += 1

  part['p'] = patterns
  part['c'] = columns

  return (length, part)
      
  print "var song = " + json.dumps({
    'songLen': length/bpm*60/32.0,
    'songData': [part],
    'rowLen': 5605,
    'endPattern': num_beats
  }) + ";"

def makeSong(stream, instruments, bpm=80):
  music21_parts = s.getElementsByClass(music21.stream.Part)
  sys.stderr.write("Number of parts: " + str(len(music21_parts)) + "\n")
  num_beats = 0
  parts = []
  for i in range(len(instruments)):
    music21_instruments = music21_parts[i].getElementsByClass(music21.instrument.Instrument)
    for instrument in music21_instruments:
      sys.stderr.write("Instrument in part " + str(i) + ": "+type(instrument).__name__+"\n")
    length, part = convertPart(music21_parts[i], instruments[i])
    parts += [part]
    num_beats = max(num_beats, length)
  return {
    'songLen': num_beats/bpm*15,
    'songData': parts,
    'endPattern': num_beats,
    'rowLen': 5605
  }

#### Main ####
import music21
mf = music21.midi.MidiFile()
mf.open("test.mid")
mf.read()
mf.close()
s = music21.midi.translate.midiFileToStream(mf)

instruments = ['SQUARE', 'SQUARE', 'SQUARE', 'BASSDRUM1', 'SOFTY', 'SOFTY', 'SOFTY', '8BIT', '8BIT', 'SQUARE', 'SOFTY', '8BIT']
print 'var song = ' + json.dumps(makeSong(s, instruments, 120)) + ';'
