import urllib2
import re

OUTDIR = "midi/"
MIDI_REGEX = r"href=\"[^\"]+\.mid\""

def crawl(url):
  response = urllib2.urlopen(url)
  html = response.read()
  
  filenames = [s[6:-1] for s in re.findall(MIDI_REGEX, html)]
  for filename in filenames:
    print "Downloading " + filename
    f = open(OUTDIR+filename, "w")
    response = urllib2.urlopen(url+filename)
    f.write(response.read())
    f.close()

crawl('http://www.vgmusic.com/music/console/nintendo/gba/')
