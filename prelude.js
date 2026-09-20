// Paste at the top of a strudel.cc pattern. Needs `.venv/bin/python bimmuda.py serve` running.
// (strings fetched at runtime aren't auto-parsed as mini-notation, hence the mini() calls below)
const M = await fetch('http://localhost:8765/melodies.json').then((r) => r.json())

// exact pitches, one bar per cycle: melody('1984_01_1').s('triangle')
const melody = (id) => note(mini(M[id].notes))
// scale degrees, so the key/mode can be swapped: degrees('1984_01_1', 'A2:dorian')
// optional shift in scale steps (2 = a third up, -7 = an octave down); must happen before .scale()
const degrees = (id, scale = M[id].scale, shift = 0) => n(mini(M[id].degrees).add(shift)).scale(scale)
// exact semitones above the tonic, transposable: semis('1984_01_1', -5)
const semis = (id, shift = 0) => note(mini(M[id].semis).add(M[id].rootMidi + shift))
// ids by metadata: find((m) => m.year < 1960 && m.section === 'chorus')
const find = (pred) => Object.values(M).filter(pred).map((m) => m.id)

setcpm(M['1984_01_1'].cpm)
$: melody('1984_01_1').s('triangle')
