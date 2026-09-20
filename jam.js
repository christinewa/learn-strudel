// Paste BELOW the prelude.js helpers (replace its last two lines). Mute a layer by changing `$:` to `_$:`.
// Good clean ids to try: 2012_02_3 Call Me Maybe · 1964_01_2 I Want to Hold Your Hand · 1996_01_2 Macarena
//   2011_01_3 Rolling in the Deep · 2015_01_2 Uptown Funk · 1983_02_3 Billie Jean · 2019_04_2 Bad Guy

const id = '2012_02_3'
const tonic = M[id].scale.split(':')[0] // e.g. "G3"
// (single quotes on purpose: the REPL parses "double-quoted" and `backtick` strings as mini-notation)
const modes = mini('<' + ['major', 'minor', 'phrygian', 'lydian'].map((m) => tonic + ':' + m).join(' ') + '>/' + M[id].cycles)

setcpm(M[id].cpm)

// the hook, re-moded each time it comes round
$: degrees(id, modes)
  .s("sawtooth").lpf(2500).decay(0.3).sustain(0.4).release(0.1)
  .room(0.3)

// same hook chasing itself: an 8th late, two scale steps up, quieter
_$: degrees(id, modes, 2).late(1 / 8)
  .s("triangle").gain(0.4).pan(0.8)

// same hook as a slow-motion bassline, 4x slower, two octaves down
_$: degrees(id, modes, -14).slow(4)
  .s("sawtooth").lpf(400).gain(0.8)

// tonic pedal bass
$: note(M[id].rootMidi % 12 + 36).struct("x ~ x x ~ x ~ x")
  .s("sawtooth").lpf(sine.range(300, 900).slow(8)).decay(0.15).sustain(0)

$: s("bd*4, ~ cp ~ cp, hh*8").bank("RolandTR909").gain(0.8)
