import json
import music21
import os
import sys
import threading
import multiprocessing

OUTPUT = "markov.dat"
FILES = ["midi/" + f for f in os.listdir("midi")]
MODELS = {}
CHAIN_LENGTH = 5

print_lock = threading.Lock()
workers_lock = threading.Lock()

task_index = 0

def processFile(f): 
  localMODELS = {}

  print "Processing " + f
  try:
    s = music21.midi.translate.midiFilePathToStream(f)

    parts = s.getElementsByClass(music21.stream.Part)

    for ii in range(len(parts)):
      part = parts[ii]
      instrument = None
      timeSignature = None
      notes = []
      for obj in part:
        if isinstance(obj, music21.instrument.Instrument):
          instrument = type(obj).__name__
          notes = []
          if not instrument in localMODELS:
            localMODELS[instrument] = {}
          continue
        elif isinstance(obj, music21.meter.TimeSignature):
          timeSignature = obj.ratioString
          notes = []
          continue

        if (not instrument) or (timeSignature != '4/4'):
          continue

        if isinstance(obj, music21.note.Note):
          notes.append(obj.midi)
        elif isinstance(obj, music21.chord.Chord):
          notes.append(obj.root().midi)
        elif isinstance(obj, music21.note.Rest):
          pass
        elif isinstance(obj, music21.tempo.MetronomeMark):
          pass
        else:
          print "Encountered unexpected object of type " + type(obj).__name__
            
        if len(notes) == CHAIN_LENGTH+2:
          pattern = str([notes[i+1] - notes[i] for i in range(CHAIN_LENGTH)])
          if not pattern in localMODELS[instrument]:
            localMODELS[instrument][pattern] = {}
          difference = notes[CHAIN_LENGTH+1] - notes[CHAIN_LENGTH]
          if difference not in localMODELS[instrument][pattern]:
            localMODELS[instrument][pattern][difference] = 0
          localMODELS[instrument][pattern][difference] += 1
          notes.pop(0)
  except:
    print "Unexpected error:", sys.exc_info()[:]

  print "Done processing " + f
  return localMODELS

def worker():
  global workers_lock
  global print_lock
  global task_index

  index = 0
  with workers_lock:
    index = task_index
    task_index += 1
  while index < len(FILES):
    with print_lock:
      print "Processing " + FILES[index] + "(" + str(index) + "/" + str(len(FILES)) + ")"
    processFile(FILES[index])
    with print_lock:
      print "Done processing " + FILES[index] + "(" + str(index) + "/" + str(len(FILES)) + ")"
    with workers_lock:
      index = task_index
      task_index += 1

def spawnWorkers(n):
  workers = [threading.Thread(None, worker) for i in range(n)]
  for i in range(n):
    workers[i].start()
  for i in range(n):
    workers[i].join()

#spawnWorkers(10)
pool = multiprocessing.Pool(10)
results = pool.map(processFile, FILES)
for result in results:
  for instrument in result:
    if not instrument in MODELS:
      MODELS[instrument] = result[instrument]
    else:
      for pattern in result[instrument]:
        if not pattern in MODELS[instrument]:
          MODELS[instrument][pattern] = result[instrument][pattern]
        else:
          for difference in result[instrument][pattern]:
            if not difference in MODELS[instrument][pattern]:
              MODELS[instrument][pattern][difference] = result[instrument][pattern][difference]
            else:
              MODELS[instrument][pattern][difference] += result[instrument][pattern][difference]
f = open(OUTPUT, "w")
json.dump(MODELS, f)
f.close()
print "Done!"
