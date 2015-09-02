import os
import sys
sys.path.append(os.getcwd())

import json
import music21
import random
import sonanter

MARKOV_FILE = "markov.dat"
MIDDLE_C = 60
INITIAL_KEY = MIDDLE_C + random.choice([0, 2, 4, 5, 7, 9, 11]) 
DEFAULT_DIFFERENCES = [-9, -5, -3, -2, 0, 2, 3, 5, 9]
INSTRUMENT = 'Instrument'
LENGTH = 400

f = open(MARKOV_FILE)
loaded_models = json.load(f)
f.close()

# Convert numbers to actual integers
MODELS = {}
for instrument in loaded_models:
  MODELS[instrument] = {}
  for loaded_pattern in loaded_models[instrument]:
    pattern = tuple([int(s) for s in loaded_pattern[1:-1].split(",")])
    num_zeroes = sum([1 if n == 0 else 0 for n in pattern])
    if num_zeroes > 2: continue #these are bad patterns we want to avoid
    if pattern == (0,0,0,0,0): continue
    MODELS[instrument][pattern] = {}
    for loaded_difference in loaded_models[instrument][loaded_pattern]:
      MODELS[instrument][pattern][int(loaded_difference)] = int(loaded_models[instrument][loaded_pattern][loaded_difference])

sys.stderr.write("Done loading " + MARKOV_FILE + "\n")

def makeRhythm(n, m):
  if m > n :
    s = ["10" for i in range(n)] + ["0" for i in range(m-n)]
  elif m == n:
    return [2] * m 
  else:
    s = ["10" for i in range(m)] + ["1" for i in range(n-m)]
    
  while len(s) > 1:
    n = len(s[0])
    m = len(s[-1])
    for i in range(len(s)/2):
      if len(s[i]) != n or len(s[-1]) != m: break
      s[i] += s[-1]
      s.pop(len(s)-1)

  durations = []
  for c in s[0]:
    if c == "1":
      durations.append(1)
    else:
      durations[-1] += 1
  return durations

# Generate!
def translatePhrase(phrase, n):
  return [p+n for p in phrase]

def stretchPhrase(phrase):
  m = min(phrase)
  M = max(phrase)
  new_phrase = []
  for p in phrase:
    if p == m:
      new_phrase.append(p-random.randint(1,2))
    elif p == M:
      new_phrase.append(p+random.randint(1,2))
    else:
      new_phrase.append(p)
  return new_phrase

def jiggle(phrase, n):
  new_phrase = []
  for p in phrase:
    if random.randint(1, len(phrase)) < n:
      new_phrase.append(p + random.choice([-3, -2, 2, 3]))
    else:
      new_phrase.append(p)
  return new_phrase

def transformPhrase(phrase):
  if random.randint(0, 2) < 1:
    phrase = translatePhrase(phrase, random.choice([-2, -1, 1, 2]))
  if random.randint(0, 2) < 1:
    phrase = stretchPhrase(phrase)
  if random.randint(0, 2) < 1:
    phrase = jiggle(phrase, 3)
  return phrase

def makeMelody(instrument):
  model = MODELS[instrument]
  melody = []

  phrases = []
  for ii in range(10):
    phrase_length = 8
    INITIAL_KEY = MIDDLE_C + random.choice([0, 2, 4, 5, 7, 9, 11]) + random.randint(0,1)*12
    pattern = list(random.choice(model.keys()))
    phrase = [INITIAL_KEY] 
    for p in pattern:
      phrase += [phrase[-1] + p]
    while len(phrase) < phrase_length:
      if not tuple(pattern) in model:
        difference = random.choice(DEFAULT_DIFFERENCES)
      else:
        differences = model[tuple(pattern)]
        choices = []
        for d in differences:
          choices += [d for i in range(differences[d])]
        difference = random.choice(choices)
      note = phrase[-1] + difference
      # constrain to between C2 and C6
      while note < 48:
        note += 12
      while note > 95:
        note -= 12
      phrase += [note]
      pattern.append(note - phrase[-1])
      pattern.pop(0)
    phrases.append(phrase)

  sys.stderr.write("Phrases: " + str(phrases))
  used_phrases = []
  repeat_phrase = False
  length_norepeat = 0
  while len(melody) < LENGTH:
    if repeat_phrase:
      idx = random.choice(used_phrases)
      phrases[idx] = transformPhrase(phrases[idx])
      melody += phrases[idx]
      length_norepeat = 0
    else:
      phrase_idx = random.randint(0, len(phrases)-1)
      if phrase_idx not in used_phrases:
        used_phrases.append(phrase_idx)
      melody += phrases[phrase_idx]
      length_norepeat += 1
    repeat_phrase = random.randint(0, int(3/(1+length_norepeat))) == 0
  return melody
"""
  for p in pattern:
    melody += [melody[-1] + p]
  repeat_phrase = False
  while len(melody) < LENGTH:
    if not tuple(pattern) in model:
      difference = random.choice(DEFAULT_DIFFERENCES)
    else:
      differences = model[tuple(pattern)]
      choices = []
      for d in differences:
        choices += [d for i in range(differences[d])]
      difference = random.choice(choices)
    if abs(difference) >= 12:
      difference = random.choice(DEFAULT_DIFFERENCES)
    note = melody[-1] + difference
    while abs(difference) > 6:
      difference /= 2
    # constrain to between C1 and C6
    if note < 36:
      note += 12
    if note > 95:
      note -= 12
    melody += [note]
    pattern.append(note - melody[-1])
    pattern.pop(0)
    repeat_phrase = random.randint(0, 4)
    repeat_phrase = bool(random.choice[0,0,0,0,0,0,0,1])
    if repeat_ph
  return melody
"""

def makeMelodyRhythm(multiplier=2):
  rhythm = []
  while len(rhythm) < LENGTH:
    #rhythm_set = [[1,1,4,2,2,1,1,4]]
    rhythm_set = [[1,1,4,2,2,1,1,4], [4,1,1,4,1,2,1,2], [1,1,1,2,2,1,1,4]]
    rhythm += [n*multiplier for n in random.choice(rhythm_set)]
    #rhythm += [random.choice([1,1,1,1,2,2,4])]
    #zeroes = random.randint(0, 0) 
    #rhythm += makeRhythm(8, zeroes)
    #rhythm += [random.choice([1, 1, 2, 4]) for i in range(random.choice([1, 2, 4]))]
  return rhythm

def makeBassRhythm(multiplier=1):
  rhythm = []
  rhythm_set = [[2,1,1,2,2,1,2,1], [4,4,2,2,2,2,4,4], [2,1,1,1,2,1,1,1]]
  #rhythm = [1,1,4,2,2,1,1,4]*(LENGTH/8+1)
  while len(rhythm) < LENGTH:
    rhythm += [n*multiplier for n in random.choice(rhythm_set)]
  return rhythm

def makePart(instrument, melody = [], rhythm = []):
  if len(melody) == 0:
    melody = makeMelody(instrument)
  if len(rhythm) == 0:
    rhythm = makeMelodyRhythm()
  return {'melody' : melody, 'rhythm' : rhythm}

#parts.append(makePart('StringInstrument'))
mainMelody = makeMelody('StringInstrument')
mainRhythm = makeMelodyRhythm(multiplier=2)
bassMelody = makeMelody('BassTrombone')
bassRhythm = makeMelodyRhythm(multiplier=4)
drumMelody = makeMelody('SteelDrum')
drumRhythm = makeBassRhythm(multiplier=1)

parts = [
  {'melody': mainMelody, 'rhythm': mainRhythm}, 
  {'melody': bassMelody, 'rhythm': bassRhythm},
  {'melody': drumMelody, 'rhythm': drumRhythm}
]

stream = music21.stream.Stream()
for ii in range(len(parts)):
  part = music21.stream.Part()
  for jj in range(len(parts[ii]['melody'])):
    note = music21.note.Note('C', quarterLength=0.25*parts[ii]['rhythm'][jj])
    note.midi = parts[ii]['melody'][jj]
    part.append(note)
  stream.append(part)
print 'var song = ' + json.dumps(sonanter.makeSong(stream, ['8BIT', 'BELL', 'BASSDRUM2'], bpm=60)) + ';'

for instrument in MODELS:
  sys.stderr.write(instrument + ": " + str(len(MODELS[instrument])) + "\n")
