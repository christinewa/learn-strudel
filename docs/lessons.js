// Lesson content for the Strudel course. Pure data: app.js renders it.
// Section types: text | editor | mcq | linequiz | tool | notes
// Strudel code lives in template literals, so it must not contain backticks or ${.

const TRACK = `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: s("~ cp ~ cp").bank("RolandTR909").room(.2)
$: s("hh*16").bank("RolandTR909")
  .gain("[.5 .25 .4 .25]*4")
$: note("<c2 c2 ab1 bb1>")
  .struct("~ x ~ x ~ x x x")
  .s("sawtooth").lpf(500).decay(.2).sustain(0)
$: chord("<Cm7 Cm7 Ab^7 Bb7>").voicing()
  .struct("~ x ~ [~ x]")
  .s("supersaw").lpf(sine.range(600, 3000).slow(8))
  .decay(.25).sustain(0)
  .delay(.5).delaytime(3/16).delayfeedback(.5)
  .room(.4)`;

// replace one line (1-indexed) of TRACK, for the "hear the fix" buttons
const patch = (lineNo, newLine) => {
  const lines = TRACK.split('\n');
  lines[lineNo - 1] = newLine;
  return lines.join('\n');
};

export const LESSONS = [
  // ───────────────────────────────────────────────────────────── 1
  {
    id: 'cycles',
    title: 'The one big idea: cycles',
    blurb: 'Make a sound, and learn the single concept everything else hangs on.',
    sections: [
      {
        type: 'text',
        html: `
<p>Strudel is a JavaScript library where <b>code describes a loop of sound</b>. You write an expression, press play, and it repeats forever. You change the code, press <kbd>Ctrl</kbd>+<kbd>Enter</kbd>, and the loop changes on the fly without stopping. That's the whole workflow.</p>
<p>Every box like the one below is a real Strudel editor. Click <b>▶ Play</b> (or click into the code and hit <kbd>Ctrl</kbd>+<kbd>Enter</kbd>). <kbd>Ctrl</kbd>+<kbd>.</kbd> stops. The very first hit of a new sound can be late or silent while the sample downloads; it fixes itself after a loop or two.</p>`,
      },
      {
        type: 'editor',
        id: 'c1',
        title: 'Your first sound',
        code: `s("bd")`,
        after: `<p><code>s</code> means <b>sound</b>. <code>"bd"</code> is the name of a bass-drum sample. You hear one kick, repeating. Each repetition is one <b>cycle</b>.</p>`,
        tasks: [
          { text: 'Change <code>"bd"</code> to <code>"bd sd"</code> (sd = snare drum) and press Ctrl+Enter. Then try <code>"bd sd hh hh"</code>.', solution: `s("bd sd hh hh")` },
        ],
      },
      {
        type: 'text',
        html: `
<h3>The rule that makes Strudel different</h3>
<p>Notice what happened: adding more sounds did <i>not</i> make the loop longer. <b>The cycle always lasts the same amount of time, and whatever you put in the string is squeezed evenly into it.</b> Two things → each gets half a cycle. Four things → each gets a quarter. Sixteen things → sixteenth notes.</p>
<p>This is the opposite of a piano roll or tracker where adding notes adds length. For dance music the practical translation is:</p>
<div class="callout"><b>1 cycle = 1 bar</b> (four beats). Four evenly spaced things in a cycle are quarter notes, eight are eighth notes, sixteen are sixteenth notes.</div>
<p>The strip under each editor is an <b>X-ray of the current cycle</b>: one row per sound, time running left to right, with a playhead. Use it constantly. It shows you what your code <i>means</i>.</p>`,
      },
      {
        type: 'editor',
        id: 'c2',
        title: 'Tempo',
        code: `setcpm(120/4)

s("bd hh sd hh")`,
        after: `<p><code>setcpm</code> sets <b>cycles per minute</b>. Since a cycle is a 4-beat bar, the idiom is <code>setcpm(BPM/4)</code>. Writing <code>120/4</code> instead of <code>30</code> keeps the BPM readable. When you replicate a song, this is line one.</p>`,
        tasks: [
          { text: 'Make it a slow 85 BPM, then a frantic 170 BPM.', solution: `setcpm(170/4)

s("bd hh sd hh")` },
          { text: 'Back at 120 BPM, play eight hi-hats per bar and nothing else. (Yes, you can type <code>hh</code> eight times. Lesson 2 gives you the shortcut.)', solution: `setcpm(120/4)

s("hh hh hh hh hh hh hh hh")` },
        ],
      },
      {
        type: 'mcq',
        q: 'At <code>setcpm(120/4)</code>, how long does each sound last in <code>s("bd sd hh")</code>?',
        options: ['One beat each, so the loop is 3 beats long', 'A third of a bar each; the loop is still one bar (4 beats) long', 'It is an error: the count must divide 4'],
        answer: 1,
        explain: 'The cycle length never changes. Three items each get a third of it, which gives you a triplet feel against a 4-beat bar.',
      },
      {
        type: 'text',
        html: `
<h3>What you just learned</h3>
<ul>
<li><code>s("...")</code> plays samples by name. The string is a tiny rhythm language called <b>mini-notation</b>.</li>
<li>A cycle is a fixed slice of time (think: one bar). Contents are squeezed to fit.</li>
<li><code>setcpm(BPM/4)</code> sets the tempo.</li>
<li>Ctrl+Enter = update, Ctrl+. = stop.</li>
</ul>`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 2
  {
    id: 'mini',
    title: 'Mini-notation: rhythm in a string',
    blurb: 'Ten symbols that describe almost any rhythm.',
    sections: [
      {
        type: 'text',
        html: `<p>The stuff inside <code>"double quotes"</code> is its own small language. It's where rhythm lives, so it's the most important thing to be fluent in. Since you code: think of it as a regex-sized DSL for subdividing time. Work through each box; watch the X-ray as you edit.</p>`,
      },
      {
        type: 'editor',
        id: 'm1',
        title: '~ is a rest, * repeats',
        code: `s("bd ~ sd ~")`,
        after: `<p><code>~</code> takes up a slot silently. <code>*</code> speeds something up so it plays N times in its slot: <code>hh*8</code> is eight hats in the space of one.</p>`,
        tasks: [
          { text: 'Replace the whole string with <code>"hh*8"</code>. Then <code>"bd*2 sd"</code>: the two kicks share the first half.', solution: `s("bd*2 sd")` },
        ],
      },
      {
        type: 'editor',
        id: 'm2',
        title: '[ ] subdivides a slot',
        code: `s("bd [hh hh] sd [hh hh hh]")`,
        after: `<p>Brackets make a nested sequence that fits inside <i>one</i> slot. The outer string has 4 slots (quarter notes); <code>[hh hh]</code> splits one of them into eighths, <code>[hh hh hh]</code> into a triplet. Nest as deep as you like.</p>
<p>This is how you write any rhythm: decide the big grid, then subdivide only where needed. The classic offbeat is <code>[~ hh]</code>: rest on the beat, hit halfway through it.</p>`,
        tasks: [
          { text: 'Write the house "offbeat hat": a hat exactly between every beat, four times a bar. Hint: <code>[~ hh]</code> and <code>*4</code>.', solution: `s("[~ hh]*4")` },
        ],
      },
      {
        type: 'editor',
        id: 'm3',
        title: ', plays things at the same time',
        code: `s("bd*4, [~ hh]*4, ~ cp ~ cp")`,
        after: `<p>A comma stacks independent sequences into the same cycle. Each side of the comma is squeezed into the cycle separately, so they can have different numbers of steps. That's a complete house beat in one line: kick on every beat, offbeat hats, clap on beats 2 and 4.</p>`,
        tasks: [
          { text: 'Add a fourth layer: sixteen quiet-ish closed hats. (Use <code>hh*16</code>. You will learn to make them quieter in lesson 4.)', solution: `s("bd*4, [~ hh]*4, ~ cp ~ cp, hh*16")` },
        ],
      },
      {
        type: 'editor',
        id: 'm4',
        title: '< > takes turns, one per cycle',
        code: `s("bd*4, ~ <cp sd> ~ <cp [cp cp]>")`,
        after: `<p>Angle brackets pick <b>one item per cycle</b>, rotating. So <code>&lt;cp sd&gt;</code> is clap in bar 1, snare in bar 2, clap in bar 3… Watch the X-ray change every cycle.</p>
<p>This is how you write anything longer than one bar: a 4-bar bassline is <code>note("&lt;c2 c2 ab1 bb1&gt;")</code>, one note per bar. A fill every 4th bar is <code>&lt;a a a b&gt;</code>, which you can shorten to <code>&lt;a!3 b&gt;</code>.</p>`,
        tasks: [
          { text: 'Make the kick pattern normal for 3 bars, then a stuttery <code>[bd bd bd]</code> on the last beat of bar 4. Hint: <code>bd bd bd &lt;bd!3 [bd bd bd]&gt;</code>', solution: `s("bd bd bd <bd!3 [bd bd bd]>, ~ cp ~ cp")` },
        ],
      },
      {
        type: 'editor',
        id: 'm5',
        title: '!  @  ?  and sample numbers',
        code: `s("bd!3 sd, hh*8?, rim@3 rim")`,
        after: `<ul>
<li><code>bd!3</code> repeats <i>without</i> speeding up: same as <code>bd bd bd</code>. (Compare <code>bd*3</code>, which crams three into one slot.)</li>
<li><code>rim@3</code> makes a step 3× as long as its neighbours: weights instead of equal slots.</li>
<li><code>?</code> randomly drops events, 50% each. <code>hh*8?0.2</code> drops 20%. Instant human looseness.</li>
<li><code>hh:3</code> picks the 4th sample in the <code>hh</code> folder. Most names hold several variants. Try <code>s("hh:0 hh:1 hh:2 hh:3")</code>.</li>
</ul>`,
        tasks: [],
      },
      {
        type: 'editor',
        id: 'm6',
        title: '(3,8) Euclidean rhythms',
        code: `s("bd(3,8), hh*8")`,
        after: `<p><code>bd(3,8)</code> spreads 3 hits as evenly as possible over 8 steps, giving the "tresillo" <code>x..x..x.</code> that's all over electronic music. <code>(5,8)</code>, <code>(3,8,2)</code> (third number rotates it) and <code>(5,16)</code> are all worth hearing. When a syncopated part in a song is hard to pin down, try a Euclid before transcribing it by hand.</p>`,
        tasks: [
          { text: 'Try <code>cp(5,8)</code> over a four-on-the-floor kick.', solution: `s("bd*4, cp(5,8)")` },
        ],
      },
      {
        type: 'mcq',
        q: 'How many hi-hat hits per cycle does <code>s("hh*2 [hh hh hh] ~ hh")</code> produce?',
        options: ['4', '6', '7', '8'],
        answer: 1,
        explain: 'Four slots: <code>hh*2</code> → 2, <code>[hh hh hh]</code> → 3, <code>~</code> → 0, <code>hh</code> → 1. Total 6.',
      },
      {
        type: 'mcq',
        q: 'You want a snare fill only on every 4th bar, on the last beat. Which string?',
        options: ['<code>"~ ~ ~ sd*4"</code>', '<code>"~ ~ ~ &lt;~!3 sd*4&gt;"</code>', '<code>"&lt;~ ~ ~ sd*4&gt;"</code>', '<code>"[~ ~ ~ sd]*4"</code>'],
        answer: 1,
        explain: 'The outer sequence has 4 beat-slots. The last slot alternates per cycle: silent for 3 bars, then <code>sd*4</code> (four 16th snares) on the 4th. Option 3 would give a whole bar to each item.',
      },
      {
        type: 'text',
        html: `
<h3>Cheat sheet so far</h3>
<table class="ref">
<tr><td><code>a b c</code></td><td>sequence, squeezed into the cycle</td></tr>
<tr><td><code>~</code></td><td>rest</td></tr>
<tr><td><code>a*4</code> / <code>a/2</code></td><td>faster / slower</td></tr>
<tr><td><code>[a b]</code></td><td>subdivide one slot</td></tr>
<tr><td><code>a, b</code></td><td>play in parallel</td></tr>
<tr><td><code>&lt;a b&gt;</code></td><td>one per cycle, alternating</td></tr>
<tr><td><code>a!3</code> · <code>a@3</code></td><td>repeat · make longer</td></tr>
<tr><td><code>a?</code></td><td>randomly drop</td></tr>
<tr><td><code>a(3,8)</code></td><td>Euclidean spread</td></tr>
<tr><td><code>a:2</code></td><td>sample variant</td></tr>
</table>`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 3
  {
    id: 'drums',
    title: 'Drum machines and the 16-step grid',
    blurb: 'Layers, drum kits, and the anatomy of an electronic beat.',
    sections: [
      {
        type: 'text',
        html: `
<p>Almost all electronic drums are programmed on a <b>16-step grid</b>: one bar split into sixteenth notes, 4 steps per beat. When you listen to a song, you're trying to work out which steps each drum lands on. Here are the pieces and where they usually go:</p>
<table class="ref">
<tr><td><code>bd</code></td><td><b>Kick</b>. The low thump. House/techno: steps 1, 5, 9, 13 ("four on the floor"). Hip-hop, breaks, pop: syncopated.</td></tr>
<tr><td><code>sd</code> / <code>cp</code></td><td><b>Snare / clap</b>. The crack on beats 2 and 4 (steps 5 and 13). Often layered together.</td></tr>
<tr><td><code>hh</code></td><td><b>Closed hi-hat</b>. The tick. Straight 8ths or 16ths, and the main source of groove.</td></tr>
<tr><td><code>oh</code></td><td><b>Open hi-hat</b>. The "tsss". In house it sits on the offbeats (steps 3, 7, 11, 15).</td></tr>
<tr><td><code>rim</code> <code>cb</code> <code>lt mt ht</code> <code>cr rd</code> <code>sh</code></td><td>Rimshot, cowbell, low/mid/high toms, crash, ride, shaker. Decoration.</td></tr>
</table>
<p>Click steps below. The code is generated live, and it's exactly what you'd type by hand.</p>`,
      },
      { type: 'tool', tool: 'grid', id: 'g1' },
      {
        type: 'text',
        html: `
<h3>Layers: <code>$:</code></h3>
<p>The grid writes one line per drum, each starting with <code>$:</code>. That prefix means "this is a separate pattern; play it alongside the others". Without it, only the last expression in the editor plays. <b>One <code>$:</code> line per instrument</b> is the standard way to lay out a track, and it gives you a mute button for free: change <code>$:</code> to <code>_$:</code>.</p>
<p><code>.bank("RolandTR909")</code> swaps the drum kit. The default <code>bd</code> is a generic sample; with a bank you get that machine's kick. The 909 is <i>the</i> house/techno machine, the 808 is hip-hop/electro with the boomy kick, the LinnDrum is 80s pop.</p>`,
      },
      {
        type: 'editor',
        id: 'd1',
        title: 'A house beat, laid out properly',
        code: `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: s("~ cp ~ cp").bank("RolandTR909")
$: s("[~ oh]*4").bank("RolandTR909")
$: s("hh*16").bank("RolandTR909")`,
        tasks: [
          { text: 'Mute the 16th hats by turning their <code>$:</code> into <code>_$:</code>. Hear how much energy they were adding. Unmute.' },
          { text: 'Swap every bank to <code>"RolandTR808"</code>, then <code>"LinnDrum"</code>. Same pattern, different decade.', solution: `setcpm(124/4)

$: s("bd*4").bank("RolandTR808")
$: s("~ cp ~ cp").bank("RolandTR808")
$: s("[~ oh]*4").bank("RolandTR808")
$: s("hh*16").bank("RolandTR808")` },
          { text: 'Turn it into a techno rumble: 132 BPM, drop the clap, and add <code>$: s("~ ~ ~ rim ~ ~ rim ~").bank("RolandTR909")</code>.', solution: `setcpm(132/4)

$: s("bd*4").bank("RolandTR909")
$: s("~ ~ ~ rim ~ ~ rim ~").bank("RolandTR909")
$: s("[~ oh]*4").bank("RolandTR909")
$: s("hh*16").bank("RolandTR909")` },
        ],
      },
      {
        type: 'editor',
        id: 'd2',
        title: 'Not everything is four-on-the-floor',
        code: `setcpm(90/4)

$: s("bd ~ ~ bd  ~ ~ bd ~  ~ ~ bd ~  ~ bd ~ ~").bank("RolandTR808")
$: s("~ sd ~ sd").bank("RolandTR808")
$: s("hh*8").bank("RolandTR808")`,
        after: `<p>When the kick is syncopated, write out all 16 steps with <code>~</code> for the gaps (extra spaces are ignored, so group by beat for readability). It's long but dead simple to edit while listening: move a <code>bd</code> one step left or right until it matches.</p>
<p><b>Half-time</b> is the other big feel: snare only on beat 3 (<code>"~ ~ sd ~"</code>), which makes any tempo feel half as fast. Trap, dubstep and a lot of moody electronica live there.</p>`,
        tasks: [
          { text: 'Make it half-time: change the snare line to hit only on beat 3.', solution: `setcpm(90/4)

$: s("bd ~ ~ bd  ~ ~ bd ~  ~ ~ bd ~  ~ bd ~ ~").bank("RolandTR808")
$: s("~ ~ sd ~").bank("RolandTR808")
$: s("hh*8").bank("RolandTR808")` },
          { text: 'Add trap-style hat rolls: replace <code>hh*8</code> with <code>hh*8 </code>where one of them is a burst, e.g. <code>"hh hh hh hh hh hh hh*4 hh"</code>... or alternate it per bar with <code>&lt;hh hh*4&gt;</code>.', solution: `setcpm(90/4)

$: s("bd ~ ~ bd  ~ ~ bd ~  ~ ~ bd ~  ~ bd ~ ~").bank("RolandTR808")
$: s("~ ~ sd ~").bank("RolandTR808")
$: s("hh hh hh hh hh hh <hh hh*4> <hh*2 hh*3>").bank("RolandTR808")` },
        ],
      },
      {
        type: 'mcq',
        q: 'In a song you hear: a steady thump on every beat, and a "tss" exactly between each thump. Which pair of lines is that?',
        options: [
          '<code>s("bd*4")</code> and <code>s("oh*4")</code>',
          '<code>s("bd*4")</code> and <code>s("[~ oh]*4")</code>',
          '<code>s("bd*2")</code> and <code>s("~ oh")</code>',
        ],
        answer: 1,
        explain: '<code>oh*4</code> would land <i>on</i> the kicks. <code>[~ oh]</code> is "rest, then hat" inside one beat, i.e. the offbeat. Times four.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 4
  {
    id: 'shape',
    title: 'Shaping sound: the chain',
    blurb: 'Volume, filters, reverb, delay, envelopes: what every .method() does.',
    sections: [
      {
        type: 'text',
        html: `
<p>You code, so here's the actual model. A pattern is a function from a time span to a list of events. Each event carries a plain object of parameters, e.g. <code>{ s: "hh", gain: 0.5, lpf: 2000 }</code>. <b>Every chained method just sets one more key on those objects.</b> The audio engine reads the keys when the event fires.</p>
<p>Consequences worth internalising:</p>
<ul>
<li>The order of sound parameters doesn't matter: <code>.lpf(800).gain(.5)</code> ≡ <code>.gain(.5).lpf(800)</code>. The engine applies effects in its own fixed order.</li>
<li>To change how an instrument <i>sounds</i>, find its <code>$:</code> line and edit or add a parameter on its chain. That's 90% of tweaking an existing track.</li>
<li>Every parameter accepts a pattern, not just a number (more below).</li>
</ul>
<p>Boxes below use <code>slider(value, min, max)</code>, which is a real Strudel function: it draws a slider <i>inside the code</i> and behaves like the number. Drag while it plays.</p>`,
      },
      {
        type: 'editor',
        id: 's1',
        title: 'gain and the low-pass filter',
        code: `setcpm(124/4)

$: s("bd*4, ~ cp ~ cp, hh*16").bank("RolandTR909")
  .gain(slider(0.8, 0, 1))
  .lpf(slider(8000, 100, 8000))`,
        after: `<p><code>gain</code> is volume. <code>lpf</code> is a <b>low-pass filter</b>: it removes everything <i>above</i> the given frequency (in Hz). Drag it down and the beat sounds like it's coming through a wall: the "club from outside" effect used in every intro and breakdown. <code>hpf</code> is the opposite (removes lows → thin, radio-like). These two filters are the most-used sound-shaping tools in electronic music.</p>`,
        tasks: [
          { text: 'Add <code>.hpf(slider(0, 0, 4000))</code> to the chain and sweep it up: the kick\'s body disappears first.', solution: `setcpm(124/4)

$: s("bd*4, ~ cp ~ cp, hh*16").bank("RolandTR909")
  .gain(slider(0.8, 0, 1))
  .lpf(slider(8000, 100, 8000))
  .hpf(slider(0, 0, 4000))` },
        ],
      },
      {
        type: 'editor',
        id: 's2',
        title: 'Parameters are patterns too',
        code: `setcpm(124/4)

$: s("hh*16").bank("RolandTR909")
  .gain("[.6 .25 .4 .25]*4")
  .pan("<0.3 0.7>")`,
        after: `<p>Pass a mini-notation string where a number goes and the parameter gets its own rhythm. Here the gain cycles loud-soft-medium-soft on each beat: <b>accents</b>, the thing that turns a machine-gun hat line into a groove. <code>pan</code> (0 = left, 1 = right) alternates each bar.</p>
<p>The parameter pattern and the sound pattern are independent: the rhythm comes from the <code>s(...)</code> side, and each event looks up whatever value the parameter pattern has at that moment.</p>`,
        tasks: [
          { text: 'Make the hats sweep in brightness over the bar: add <code>.lpf("&lt;2000 4000 8000 12000&gt;")</code>, then try <code>.lpf("2000 12000")</code> (changes mid-bar).', solution: `setcpm(124/4)

$: s("hh*16").bank("RolandTR909")
  .gain("[.6 .25 .4 .25]*4")
  .pan("<0.3 0.7>")
  .lpf("2000 12000")` },
        ],
      },
      {
        type: 'editor',
        id: 's3',
        title: 'Space: reverb and delay',
        code: `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: s("~ cp ~ cp").bank("RolandTR909")
  .room(slider(0.5, 0, 1)).size(4)
  .orbit(2)
$: s("~ ~ rim ~ ~ rim ~ ~").bank("RolandTR909")
  .delay(slider(0.5, 0, 1)).delaytime(3/16).delayfeedback(.6)
  .orbit(3)`,
        after: `<ul>
<li><code>room</code> = how much reverb (0–1), <code>size</code> = how big the space. Big clap reverb is a staple.</li>
<li><code>delay</code> = how much echo, <code>delaytime</code> = gap between echoes <i>in cycles</i> (so <code>1/8</code> is an eighth note, <code>3/16</code> is the classic dotted-eighth bounce), <code>delayfeedback</code> = how long echoes keep repeating (keep it under 1).</li>
<li><b>Gotcha: <code>orbit</code>.</b> Reverb and delay are shared buses, not per-event effects. All patterns on the same orbit share one reverb and one delay, and the last one to set its settings wins. If a track's reverb sounds wrong or flickers, give that layer its own <code>.orbit(n)</code>.</li>
</ul>`,
        tasks: [
          { text: 'Notice the kick stays dry. In dance music the kick and bass almost never get reverb: mud. Try adding <code>.room(.8)</code> to the kick to hear why, then remove it.' },
        ],
      },
      {
        type: 'editor',
        id: 's4',
        title: 'Envelopes: the shape of a note over time',
        code: `setcpm(124/4)

$: note("c3 eb3 g3 bb3").s("sawtooth").lpf(2000)
  .attack(slider(0.01, 0, 0.4))
  .decay(slider(0.2, 0.02, 1))
  .sustain(slider(0.5, 0, 1))
  .release(slider(0.1, 0, 1))`,
        after: `<p>(Notes are next lesson; for now it's just something sustained to shape.) <b>ADSR</b> is how every synth describes loudness over a note's life:</p>
<ul>
<li><code>attack</code>: seconds to fade in. 0 = instant/percussive. 0.3+ = soft, swelling pad.</li>
<li><code>decay</code>: seconds to fall from the peak down to the sustain level.</li>
<li><code>sustain</code>: level (0–1) held for as long as the note lasts. <b>0 = plucky</b>: the note dies after the decay no matter how long it's held.</li>
<li><code>release</code>: seconds to fade out after the note ends. Long = notes smear into each other.</li>
</ul>
<p>Two recipes to remember: <b>pluck/stab</b> = <code>.decay(.15).sustain(0)</code>; <b>pad</b> = <code>.attack(.4).release(1)</code>.</p>`,
        tasks: [
          { text: 'Set sustain to 0 and play with decay only: short = pluck, long = piano-like.' },
          { text: 'Set attack ≈ 0.3, sustain 1, release ≈ 0.8: now it\'s a pad.' },
        ],
      },
      {
        type: 'editor',
        id: 's5',
        title: 'Dirt and sample tricks',
        code: `setcpm(124/4)

$: s("bd*4, ~ sd ~ sd").bank("RolandTR909")
  .distort(slider(0, 0, 4))
  .crush(slider(16, 3, 16))
  .speed(slider(1, 0.5, 2))`,
        after: `<ul>
<li><code>distort</code> / <code>shape</code>: overdrive. A little on a kick or bass adds weight; a lot is industrial.</li>
<li><code>crush</code>: bit depth (16 = clean, 4 = crunchy 8-bit). <code>coarse</code>: sample-rate reduction. Both are the "lo-fi / degraded" knobs.</li>
<li><code>speed</code>: sample playback rate. 2 = octave up and half as long, 0.5 = octave down, negative = reversed. Pitching a kick or snare to match a song is often just <code>speed</code>.</li>
<li><code>clip(1)</code> (a.k.a. <code>legato</code>) cuts a sample off when its step ends; <code>cut(1)</code> makes a sound choke the previous one in the same cut group (open hat closed by the next hat).</li>
</ul>`,
        tasks: [],
      },
      {
        type: 'mcq',
        q: 'A track\'s clap has a huge washy tail and you want it tight and dry. What do you look for on the clap\'s line?',
        options: ['<code>.lpf(...)</code>', '<code>.room(...)</code> / <code>.size(...)</code>', '<code>.decay(...)</code>', '<code>.delaytime(...)</code>'],
        answer: 1,
        explain: 'A washy tail is reverb: lower <code>room</code> (amount) and/or <code>size</code>. If instead you heard distinct repeating echoes, it would be <code>delay</code>.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 5
  {
    id: 'bass',
    title: 'Notes, synths and basslines',
    blurb: 'Pitch, oscillators, the filter as an instrument, and bass rhythm.',
    sections: [
      {
        type: 'text',
        html: `
<p>Samples are recordings. <b>Synths</b> generate sound from a waveform, and you choose the pitch. Two new functions:</p>
<ul>
<li><code>note("c2 eb2 g2")</code>: pitches by name (letter + optional <code>#</code>/<code>b</code> + octave; c2 is a bass note, c4 is middle C) or by MIDI number (<code>note("36 39 43")</code>).</li>
<li><code>.s("sawtooth")</code>: which oscillator. With <code>note</code> and no <code>s</code> you get a plain triangle.</li>
</ul>`,
      },
      {
        type: 'editor',
        id: 'b1',
        title: 'The four waveforms',
        code: `setcpm(124/4)

$: note("c2 c2 eb2 c2 f2 c2 eb2 g2")
  .s("<sine triangle square sawtooth>")
  .lpf(1500)`,
        after: `<p>The waveform alternates each bar. <b>sine</b>: pure, round, sub-bass. <b>triangle</b>: soft, a bit hollow. <b>square</b>: hollow, buzzy, video-game. <b>sawtooth</b>: bright and full; the raw material for most basses, leads and pads. There's also <b>supersaw</b> (several detuned saws: instant trance/EDM width) and noise (<code>white</code>, <code>pink</code>).</p>
<p>When matching a sound from a song, ask: is it smooth (sine/triangle) or buzzy (saw/square)? Then use the filter to decide how bright.</p>`,
        tasks: [
          { text: 'Fix the wave to <code>"sawtooth"</code> and drop the <code>lpf</code> to 300. Now raise to 3000. The filter cutoff is the single biggest "what kind of bass is this" knob.', solution: `setcpm(124/4)

$: note("c2 c2 eb2 c2 f2 c2 eb2 g2")
  .s("sawtooth")
  .lpf(slider(300, 100, 5000))` },
        ],
      },
      {
        type: 'editor',
        id: 'b2',
        title: 'Rhythm and pitch, separately: struct',
        code: `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: note("<c2 c2 ab1 bb1>")
  .struct("~ x ~ x ~ x x x")
  .s("sawtooth").lpf(700)
  .decay(.2).sustain(0)`,
        after: `<p>This is the most useful trick for transcribing. <code>note("&lt;c2 c2 ab1 bb1&gt;")</code> says <i>which</i> note per bar. <code>.struct("~ x ~ x ~ x x x")</code> imposes a <i>rhythm</i> on it: <code>x</code> = play, <code>~</code> = rest. You can figure out the rhythm first (by ear, like a drum) and the pitches later, and change one without touching the other.</p>
<p>The rhythm here is the classic house <b>offbeat bass</b>: it avoids the kick (which owns the downbeats) and answers it. Kick-bass interplay is the engine of dance music.</p>`,
        tasks: [
          { text: 'Try a driving techno bass instead: <code>.struct("x*16")</code>, and lower <code>decay</code> to .08.', solution: `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: note("<c2 c2 ab1 bb1>")
  .struct("x*16")
  .s("sawtooth").lpf(700)
  .decay(.08).sustain(0)` },
          { text: 'Try a Euclid: <code>.struct("x(5,8)")</code>.', solution: `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: note("<c2 c2 ab1 bb1>")
  .struct("x(5,8)")
  .s("sawtooth").lpf(700)
  .decay(.2).sustain(0)` },
        ],
      },
      {
        type: 'editor',
        id: 'b3',
        title: 'Scales: stop worrying about wrong notes',
        code: `setcpm(124/4)

$: n("0 0 3 0 4 0 3 7")
  .scale("C2:minor")
  .s("sawtooth").lpf(900).decay(.15).sustain(0)`,
        after: `<p><code>n(...)</code> with <code>.scale("C2:minor")</code> means "the Nth step of this scale": 0 is the root, 7 is the octave, negatives go down. Every number is in key, so you can mash numbers and it always sounds musical. To transpose the whole line, change <code>C2</code>. To change mood, swap <code>minor</code> for <code>major</code>, <code>dorian</code>, <code>phrygian</code> (dark, techno-friendly), <code>minor:pentatonic</code>…</p>
<p>For replicating a song: find the key once (search "<i>song name</i> key", or hunt for the bass note that feels like "home"), set the scale, then finding melodies by ear becomes trying small integers.</p>`,
        tasks: [
          { text: 'Change to <code>"F2:phrygian"</code>. Same numbers, different universe.', solution: `setcpm(124/4)

$: n("0 0 3 0 4 0 3 7")
  .scale("F2:phrygian")
  .s("sawtooth").lpf(900).decay(.15).sustain(0)` },
        ],
      },
      {
        type: 'editor',
        id: 'b4',
        title: 'The filter envelope: acid, plucks and "wow"',
        code: `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: n("0 0 7 0 3 0 10 3").scale("C2:minor")
  .s("sawtooth")
  .lpf(slider(300, 100, 2000))
  .lpq(slider(10, 0, 20))
  .lpenv(slider(4, 0, 8))
  .lpd(.12)
  .decay(.2).sustain(0)`,
        after: `<ul>
<li><code>lpq</code>: <b>resonance</b>: a peak right at the cutoff. Low = smooth; high = squelchy, whistling, "acid".</li>
<li><code>lpenv</code>: how many octaves the cutoff jumps up at the start of each note before falling back. This is the "wow"/"bwow" at the front of plucky basses and stabs. <code>lpd</code> is how fast it falls (filter decay), <code>lpa</code> its attack.</li>
</ul>
<p>Sawtooth + low cutoff + high resonance + filter envelope = the TB-303 acid sound. Turn <code>lpq</code> to 0 and <code>lpenv</code> to 2 and it's a polite modern house pluck. Same line of code, two genres.</p>`,
        tasks: [
          { text: 'Add a sub underneath: a new line <code>$: note("c1*4").s("sine").gain(.8)</code>... then give it the offbeat rhythm so it doesn\'t fight the kick.', solution: `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: note("[~ c1]*4").s("sine").gain(.9).decay(.2).sustain(0)
$: n("0 0 7 0 3 0 10 3").scale("C2:minor")
  .s("sawtooth")
  .lpf(300).lpq(10).lpenv(4).lpd(.12)
  .decay(.2).sustain(0)` },
        ],
      },
      {
        type: 'mcq',
        q: 'A bassline has the right notes but sounds too bright and buzzy compared to the song. First thing to change?',
        options: ['Lower the <code>lpf</code> value', 'Change <code>note</code> to a lower octave', 'Add <code>.room()</code>', 'Lower <code>setcpm</code>'],
        answer: 0,
        explain: 'Brightness = high frequencies = what the low-pass filter removes. If it\'s still too buzzy with a low cutoff, then consider a rounder waveform (triangle/sine).',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 6
  {
    id: 'harmony',
    title: 'Chords, pads, stabs and arps',
    blurb: 'Everything above the bass: the instrumentation layer.',
    sections: [
      {
        type: 'text',
        html: `<p>The "instrumentation" of an electronic track is usually a small cast: <b>pad</b> (long soft chords, the atmosphere), <b>stab/pluck</b> (short rhythmic chords), <b>arp</b> (a chord played one note at a time, fast), <b>lead</b> (the tune). The fun part: they're often the <i>same notes</i> with different envelopes and rhythms.</p>`,
      },
      {
        type: 'editor',
        id: 'h1',
        title: 'Chords two ways',
        code: `setcpm(124/4)

// by hand: commas inside [ ] stack notes
_$: note("<[c3,eb3,g3,bb3] [ab2,c3,eb3,g3]>")
  .s("sawtooth").lpf(1500)

// by name: chord symbols + automatic voicing
$: chord("<Cm7 Ab^7 Eb^7 Bb7>").voicing()
  .s("sawtooth").lpf(1500)`,
        after: `<p>A chord is just notes in parallel, so the comma from lesson 2 does it. <code>chord("Cm7").voicing()</code> is the shortcut: you write chord symbols (<code>C</code>, <code>Cm</code>, <code>C7</code>, <code>Cm7</code>, <code>C^7</code> = major 7, <code>Csus4</code>…) and Strudel picks playable notes and moves smoothly between chords. If you can find a song's chords online, you can paste them nearly verbatim.</p>
<p>Lines starting with <code>//</code> are comments. The first pattern is muted with <code>_$:</code>; swap the underscores to compare.</p>`,
        tasks: [],
      },
      {
        type: 'editor',
        id: 'h2',
        title: 'Same chords, three instruments',
        code: `setcpm(124/4)

$: s("bd*4, [~ oh]*4").bank("RolandTR909").gain(.8)

// PAD: slow attack, long release, reverb
$: chord("<Cm7 Ab^7 Eb^7 Bb7>").voicing()
  .s("supersaw").lpf(900)
  .attack(.4).release(1).room(.7).gain(.5)

// STAB: rhythm from struct, plucky envelope, delay
_$: chord("<Cm7 Ab^7 Eb^7 Bb7>").voicing()
  .struct("~ x ~ [~ x]")
  .s("sawtooth").lpf(2500).lpenv(2)
  .decay(.2).sustain(0)
  .delay(.4).delaytime(3/16).delayfeedback(.4)

// ARP: one chord note at a time
_$: chord("<Cm7 Ab^7 Eb^7 Bb7>").voicing()
  .arp("0 1 2 3 2 1 0 2").add(note(12))
  .s("triangle").decay(.15).sustain(0).room(.4)`,
        after: `<p>Un-mute them one at a time (<code>_$:</code> → <code>$:</code>), then all together. Read each chain and connect the words to what you hear:</p>
<ul>
<li>The pad is a pad because of <code>attack</code>/<code>release</code> and a low <code>lpf</code>.</li>
<li>The stab is a stab because of <code>struct</code> (rhythm) and <code>decay</code>+<code>sustain(0)</code> (short).</li>
<li><code>.arp("0 1 2 3…")</code> picks chord notes by index; <code>.add(note(12))</code> shifts it up an octave (12 semitones).</li>
</ul>`,
        tasks: [
          { text: 'Make the stab rhythm busier: <code>.struct("x(5,8)")</code> or <code>.struct("x ~ x ~ ~ x ~ x")</code>.' },
          { text: 'Make the arp twice as fast with 16 indices, or add <code>.fast(2)</code>… careful: <code>.fast(2)</code> also makes the chords change twice as fast. Put the speed in the arp string instead: <code>.arp("[0 1 2 3 2 1 0 2]*2")</code>.', solution: `setcpm(124/4)

$: s("bd*4, [~ oh]*4").bank("RolandTR909").gain(.8)

$: chord("<Cm7 Ab^7 Eb^7 Bb7>").voicing()
  .arp("[0 1 2 3 2 1 0 2]*2").add(note(12))
  .s("triangle").decay(.12).sustain(0).room(.4)` },
        ],
      },
      {
        type: 'editor',
        id: 'h3',
        title: 'Melodies and ready-made instruments',
        code: `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: n("<[0 ~ 4 ~ 2 ~ ~ 4] [~ 7 ~ 4 ~ 2 0 ~]>")
  .scale("C4:minor")
  .s("<gm_epiano1 gm_lead_2_sawtooth piano gm_pad_warm>/2")
  .room(.5).delay(.3)`,
        after: `<p>Besides raw oscillators, Strudel ships sampled instruments: <code>piano</code>, and ~128 General MIDI sounds prefixed <code>gm_</code> (<code>gm_epiano1</code>, <code>gm_synth_strings_1</code>, <code>gm_choir_aahs</code>, <code>gm_synth_bass_1</code>, <code>gm_pad_warm</code>…). They take <code>note</code>/<code>n</code> like synths. The sound rotates every 2 bars here (<code>/2</code> slows the <code>&lt; &gt;</code>). The <b>Sound browser</b> under Tools lets you audition everything.</p>
<p>A melody is a sequence like any other: rests, brackets and <code>&lt; &gt;</code> all work. Two bars alternate here.</p>`,
        tasks: [],
      },
      {
        type: 'mcq',
        q: 'In a track, the chord instrument plays short stabs. You want it to become a long, sustained wash instead. Which edits?',
        options: [
          'Raise <code>lpf</code> and add <code>.crush(4)</code>',
          'Remove the <code>.struct(...)</code> rhythm, replace <code>.decay(.2).sustain(0)</code> with <code>.attack(.4).release(1)</code>',
          'Change <code>chord(...)</code> to <code>note(...)</code>',
        ],
        answer: 1,
        explain: 'Length and softness are envelope + rhythm. The notes and the oscillator can stay exactly the same.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 7
  {
    id: 'motion',
    title: 'Movement: making loops feel alive',
    blurb: 'LFO signals, filter sweeps, pumping, randomness, and trippy texture.',
    sections: [
      {
        type: 'text',
        html: `<p>A static 1-bar loop gets boring in 10 seconds. Produced tracks are full of slow change: filters opening, things drifting left and right, hats that vary. In Strudel that comes from <b>signals</b> (continuous patterns) and <b>pattern transformations</b> (functions that rewrite the rhythm).</p>`,
      },
      {
        type: 'editor',
        id: 'v1',
        title: 'Signals: sine, saw, perlin',
        code: `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: note("c2*16").s("sawtooth")
  .decay(.1).sustain(0)
  .lpf(sine.range(200, 3000).slow(4))`,
        after: `<p><code>sine</code> is a pattern that smoothly goes 0→1→0 once per cycle. <code>.range(200, 3000)</code> rescales it, <code>.slow(4)</code> stretches it over 4 bars. Drop it in anywhere a number goes. This is an <b>LFO</b> (low-frequency oscillator), and it's how you write a filter sweep.</p>
<p>Others: <code>saw</code> (ramp up, then snap back: risers), <code>tri</code>, <code>square</code> (two-state), <code>perlin</code> (smooth random wander: organic drift), <code>rand</code> (new random value per event).</p>`,
        tasks: [
          { text: 'Change <code>sine</code> to <code>saw</code> with <code>.slow(8)</code>: an 8-bar build-up riser.', solution: `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: note("c2*16").s("sawtooth")
  .decay(.1).sustain(0)
  .lpf(saw.range(200, 5000).slow(8))` },
          { text: 'Change it to <code>perlin.range(300, 2500)</code> and add <code>.pan(sine.slow(3))</code>.', solution: `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: note("c2*16").s("sawtooth")
  .decay(.1).sustain(0)
  .lpf(perlin.range(300, 2500))
  .pan(sine.slow(3))` },
        ],
      },
      {
        type: 'editor',
        id: 'v2',
        title: 'The pump (sidechain feel)',
        code: `setcpm(124/4)

$: s("bd*4").bank("RolandTR909")
$: chord("<Cm7 Ab^7>").voicing()
  .struct("x*16")
  .s("supersaw").lpf(1800).release(.1)
  .gain(saw.range(.1, .7).fast(4))
  .room(.5)`,
        after: `<p>That breathing "whoomp-whoomp" where the pad ducks out of the way of every kick is the signature of house/EDM. In a studio it's a sidechain compressor. Here we fake it: chop the pad into 16ths with <code>struct("x*16")</code> and ride the volume with a <code>saw</code> that restarts on every beat (<code>.fast(4)</code>): quiet right on the kick, swelling until the next one.</p>
<p>Signals are sampled once per event, which is why the pad is chopped into 16ths: a single long note would only read the gain once.</p>`,
        tasks: [
          { text: 'Mute the pump by deleting the <code>.gain(...)</code> line and compare. Then put it back with a deeper duck: <code>.range(0, .7)</code>.' },
        ],
      },
      {
        type: 'editor',
        id: 'v3',
        title: 'Variation: functions that rewrite patterns',
        code: `setcpm(124/4)

$: s("bd*4, ~ cp ~ cp").bank("RolandTR909")
$: s("hh*16").bank("RolandTR909")
  .gain("[.5 .25 .4 .25]*4")
  .sometimesBy(.15, x => x.ply(2))
  .degradeBy(.1)
$: n("0 ~ 3 ~ 5 ~ 3 ~").scale("C4:minor")
  .s("triangle").decay(.2).sustain(0)
  .off(1/8, x => x.add(n(2)).gain(.5))
  .every(4, x => x.rev())
  .room(.5)`,
        after: `<p>Unlike sound parameters, these change <i>which events exist</i>, so they take a function <code>x =&gt; ...</code> describing what to do to the pattern:</p>
<ul>
<li><code>.sometimesBy(.15, x =&gt; x.ply(2))</code>: 15% of hats get doubled (little rolls). Also <code>.sometimes</code>, <code>.often</code>, <code>.rarely</code>.</li>
<li><code>.degradeBy(.1)</code>: randomly drop 10% of events.</li>
<li><code>.off(1/8, x =&gt; ...)</code>: layer a copy shifted by an 8th note, here two scale steps higher and quieter: instant call-and-response/echo harmonies.</li>
<li><code>.every(4, x =&gt; x.rev())</code>: every 4th cycle, play it backwards. The general "do something different every N bars" tool.</li>
<li>Also: <code>.fast(2)</code> / <code>.slow(2)</code>, <code>.rev()</code>, <code>.jux(rev)</code> (original in left ear, transformed copy in right: very trippy), <code>.early(1/16)</code> / <code>.late()</code> to nudge timing, <code>.swingBy(1/3, 4)</code> for shuffle.</li>
</ul>
<p><b>Order matters for these</b>: they apply in sequence, to everything to their left.</p>`,
        tasks: [
          { text: 'Add <code>.jux(rev)</code> at the end of the melody chain and listen on headphones.' },
          { text: 'Swing the hats: add <code>.swingBy(1/3, 4)</code> to the hat line. Garage/2-step feel.' },
        ],
      },
      {
        type: 'editor',
        id: 'v4',
        title: 'Tape wobble, haze and other trippy textures',
        code: `setcpm(100/4)

$: s("bd ~ ~ bd ~ ~ bd ~, ~ ~ sd ~").bank("RolandTR808").lpf(3000)
$: chord("<Fm9 Db^7 Ab^7 Eb>").voicing()
  .s("gm_epiano1")
  .vib(slider(3, 0, 8)).vibmod(slider(0.3, 0, 1))
  .lpf(perlin.range(600, 2200).slow(2))
  .coarse(slider(4, 1, 16))
  .phaser(.5)
  .room(.8).size(6)
  .delay(.4).delaytime(3/8).delayfeedback(.6)`,
        after: `<p>The "worn cassette / dream" palette, which is relevant to the hazier end of electronic music (and your target track's vibe):</p>
<ul>
<li><code>vib</code> (rate in Hz) + <code>vibmod</code> (depth in semitones): pitch wobble. Slow and shallow = warped tape; fast = vibrato.</li>
<li><code>coarse</code> / <code>crush</code>: digital degradation. <code>lpf</code> with <code>perlin</code>: tone that drifts like a dying walkman.</li>
<li><code>phaser</code>: a sweeping, swirling comb. <code>room</code> with big <code>size</code> + long dotted <code>delay</code>: distance and wash.</li>
<li>For samples: <code>speed(-1)</code> reverses, <code>.chop(8)</code> / <code>.striate(8)</code> granulate, <code>.begin(.25).end(.5)</code> plays a slice.</li>
</ul>`,
        tasks: [],
      },
      {
        type: 'mcq',
        q: 'A track has <code>.lpf(sine.range(400, 4000).slow(16))</code> on the chords. You want the filter sweep to happen twice as often. What do you change?',
        options: ['<code>400</code> → <code>800</code>', '<code>.slow(16)</code> → <code>.slow(8)</code>', '<code>sine</code> → <code>saw</code>', 'Add <code>.fast(2)</code> at the end of the whole chain'],
        answer: 1,
        explain: 'The LFO\'s period is set by its own <code>.slow()</code>. Adding <code>.fast(2)</code> to the whole chain would also double the speed of the chords themselves.',
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 8
  {
    id: 'arrange',
    title: 'From loop to song: arrangement',
    blurb: 'Naming parts, bringing layers in and out, builds and drops.',
    sections: [
      {
        type: 'text',
        html: `
<p>An electronic song is mostly <b>the same few loops switched on and off</b> in 4/8/16-bar blocks, plus transitions. Intro (hats + pad) → kick comes in → bass comes in → breakdown (drums drop out, filter closes) → drop (everything) → outro. So "arrangement" in Strudel means controlling <i>when</i> each layer is audible. Two tools.</p>`,
      },
      {
        type: 'editor',
        id: 'a1',
        title: 'Tool 1: mask: a per-layer on/off timeline',
        code: `setcpm(124/4)

$: s("hh*16").bank("RolandTR909").gain("[.5 .25 .4 .25]*4")
$: s("bd*4").bank("RolandTR909")
  .mask("<0!4 1!12>")
$: s("~ cp ~ cp").bank("RolandTR909")
  .mask("<0!8 1!8>")
$: note("<c2 c2 ab1 bb1>").struct("~ x ~ x ~ x x x")
  .s("sawtooth").lpf(600).decay(.2).sustain(0)
  .mask("<0!8 1!8>")`,
        after: `<p><code>.mask("&lt;0!4 1!12&gt;")</code> reads: silent for 4 bars, on for 12, repeat (a 16-bar loop). Each layer gets its own timeline, written in the mini-notation you already know. Hats from bar 1, kick from bar 5, clap and bass from bar 9. The X-ray shows layers appearing.</p>
<p>This keeps the one-line-per-instrument layout, so it's the easiest way to sketch a song's structure: listen to the original, note at which bar each instrument enters and leaves, and write that as a mask.</p>`,
        tasks: [
          { text: 'Add a breakdown: make the kick drop out for bars 13–16. Its mask becomes <code>"&lt;0!4 1!8 0!4&gt;"</code>.', solution: `setcpm(124/4)

$: s("hh*16").bank("RolandTR909").gain("[.5 .25 .4 .25]*4")
$: s("bd*4").bank("RolandTR909")
  .mask("<0!4 1!8 0!4>")
$: s("~ cp ~ cp").bank("RolandTR909")
  .mask("<0!8 1!8>")
$: note("<c2 c2 ab1 bb1>").struct("~ x ~ x ~ x x x")
  .s("sawtooth").lpf(600).decay(.2).sustain(0)
  .mask("<0!8 1!8>")` },
        ],
      },
      {
        type: 'editor',
        id: 'a2',
        title: 'Tool 2: name the parts, then arrange() sections',
        code: `setcpm(124/4)

const hats = s("hh*16, [~ oh]*4").bank("RolandTR909").gain("[.5 .25 .4 .25]*4")
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.3)
const bass = note("<c2 c2 ab1 bb1>").struct("~ x ~ x ~ x x x")
  .s("sawtooth").lpf(600).decay(.2).sustain(0)
const pad = chord("<Cm7 Cm7 Ab^7 Bb7>").voicing()
  .s("supersaw").attack(.3).release(.8).gain(.4).room(.6)

$: arrange(
  [4, stack(pad.lpf(600), hats)],
  [4, stack(pad.lpf(1200), hats, kick)],
  [8, stack(pad.lpf(2500), hats, kick, clap, bass)],
  [4, stack(pad.lpf(saw.range(300, 4000).slow(4)), clap)],
  [8, stack(pad.lpf(3000), hats, kick, clap, bass)]
)`,
        after: `<p>Patterns are values, so store them in <code>const</code>s. <code>stack(a, b, c)</code> plays patterns together (the function form of the comma). <code>arrange([bars, pattern], …)</code> plays sections one after another. Each section here is "which parts are on", and you can tweak a part per section (the pad's filter opens up section by section; the breakdown uses a <code>saw</code> riser).</p>
<p>This layout reads like a song map. It takes 28 bars to loop; the X-ray shows which section you're in.</p>`,
        tasks: [
          { text: 'Add a 4-bar outro at the end: just pad and hats, pad filter at 500.' },
          { text: 'In the breakdown, add a snare-roll build: <code>s("sd*8").bank("RolandTR909").gain(saw.range(.2,.9).slow(4))</code> inside that section\'s <code>stack</code>.' },
        ],
      },
      {
        type: 'text',
        html: `
<h3>Transitions checklist</h3>
<ul>
<li><b>Filter build</b>: <code>.lpf(saw.range(300, 6000).slow(8))</code> on pads/everything before a drop; or an <code>hpf</code> rising to thin things out.</li>
<li><b>Drop the kick</b> for the last bar or beat before a new section (<code>mask</code>). Silence makes the return hit harder.</li>
<li><b>Snare/clap roll</b>: <code>"sd*4 sd*8 sd*16 sd*32"</code> across 4 bars with <code>&lt; &gt;</code>, rising gain.</li>
<li><b>Crash</b> on the first beat of a new section: <code>s("cr").mask("&lt;1 0!7&gt;")</code>.</li>
<li><b>Noise riser</b>: <code>s("white*16").hpf(saw.range(200, 8000).slow(4)).gain(.3)</code>.</li>
</ul>`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 9
  {
    id: 'gym',
    title: 'Code-reading gym',
    blurb: 'Given a finished track, find the line to change. The skill you asked for.',
    sections: [
      {
        type: 'text',
        html: `<p>Here's a small but complete track using only things from lessons 1–8. Play it first. Then answer each question by <b>clicking the line you would edit</b>. After each answer you can load the fix into the editor and hear it.</p>
<p>The mental routine: <b>(1) which instrument?</b> → find its <code>$:</code> block. <b>(2) is it about <i>when</i> notes happen, <i>which</i> notes, or <i>how they sound</i>?</b> → look in the mini-notation/<code>struct</code>, in <code>note</code>/<code>chord</code>, or in the effect chain.</p>`,
      },
      { type: 'editor', id: 'gym', title: 'The track', code: TRACK },
      {
        type: 'linequiz',
        code: TRACK,
        editorId: 'gym',
        questions: [
          { q: 'Make the whole song faster.', answer: [1], explain: '<code>setcpm</code> is global tempo. <code>setcpm(132/4)</code>.', fix: patch(1, 'setcpm(132/4)') },
          { q: 'The kick should be a boomy 808 instead of a 909.', answer: [3], explain: 'The kick is the <code>bd</code> line; the drum machine is its <code>.bank()</code>.', fix: patch(3, '$: s("bd*4").bank("RolandTR808")') },
          { q: 'The hi-hats are too loud overall.', answer: [6], explain: 'The hats\' <code>.gain</code> is on the continuation line of the <code>hh</code> block. Scale the values down, e.g. <code>"[.3 .15 .25 .15]*4"</code>.', fix: patch(6, '  .gain("[.3 .15 .25 .15]*4")') },
          { q: 'Play 8th-note hats instead of 16ths.', answer: [5], explain: 'Rhythm lives in the mini-notation: <code>hh*16</code> → <code>hh*8</code>.', fix: patch(5, '$: s("hh*8").bank("RolandTR909")') },
          { q: 'The bass should play a different rhythm (say, every offbeat only).', answer: [8], explain: 'The bass rhythm is its <code>.struct()</code>. Notes are untouched. <code>"[~ x]*4"</code>.', fix: patch(8, '  .struct("[~ x]*4")') },
          { q: 'The bass goes C, C, A♭, B♭. Make the last bar go to G instead of B♭.', answer: [7], explain: 'Pitches are in <code>note("&lt;…&gt;")</code>, one per bar: change <code>bb1</code> → <code>g1</code>.', fix: patch(7, '$: note("<c2 c2 ab1 g1>")') },
          { q: 'The bass is too bright/buzzy; make it darker and rounder.', answer: [9], explain: 'Tone = oscillator + filter, both on this line. Lower <code>lpf(500)</code> → <code>lpf(250)</code>, or swap <code>sawtooth</code> → <code>triangle</code>.', fix: patch(9, '  .s("sawtooth").lpf(250).decay(.2).sustain(0)') },
          { q: 'The chord stabs should ring out longer instead of being so short.', answer: [13], explain: 'Length is the envelope: <code>.decay(.25).sustain(0)</code> → longer decay, or sustain above 0 with a release.', fix: patch(13, '  .decay(.8).sustain(.3).release(.4)') },
          { q: 'Fewer echoes on the stabs: they\'re cluttering the mix.', answer: [14], explain: 'Echo = the <code>delay</code> trio. Lower <code>delay</code> (amount) and/or <code>delayfeedback</code> (repeats).', fix: patch(14, '  .delay(.2).delaytime(3/16).delayfeedback(.2)') },
          { q: 'The slow brightening/darkening of the chords should take 16 bars, not 8.', answer: [12], explain: 'That movement is the <code>sine</code> LFO on <code>lpf</code>. Its period is <code>.slow(8)</code> → <code>.slow(16)</code>.', fix: patch(12, '  .s("supersaw").lpf(sine.range(600, 3000).slow(16))') },
          { q: 'Change the chord progression.', answer: [10], explain: 'The symbols in <code>chord("&lt;…&gt;")</code>. Try <code>&lt;Fm7 Fm7 Db^7 Eb7&gt;</code> (and you\'d move the bass notes to match: f1 f1 db2 eb2).', fix: patch(10, '$: chord("<Cm7 Eb^7 Ab^7 G7>").voicing()') },
          { q: 'Temporarily silence the clap to hear the rest.', answer: [4], explain: '<code>$:</code> → <code>_$:</code> mutes a layer.', fix: patch(4, '_$: s("~ cp ~ cp").bank("RolandTR909").room(.2)') },
        ],
      },
      {
        type: 'text',
        html: `<p>If those felt mostly obvious, you've got the core skill. Reading real-world Strudel code is the same process with more vocabulary; when you hit an unknown function, the <a href="https://strudel.cc/learn/" target="_blank" rel="noopener">official reference</a> has a runnable example for every one, and the <b>Cheat sheet</b> here groups them by "what it changes".</p>`,
      },
    ],
  },

  // ───────────────────────────────────────────────────────────── 10
  {
    id: 'transcribe',
    title: 'Capstone: rebuilding a real song',
    blurb: 'A repeatable method, applied to "±ªþ³§" (Tapes).',
    sections: [
      {
        type: 'text',
        html: `
<p>Your target is <b>"±ªþ³§" ("Tapes") by Bring Me the Horizon feat. Yonaka</b>, the seven-minute closer of the 2019 <i>Music to Listen To…</i> EP: programmed electronics rather than a band, which makes it a good fit for Strudel.</p>
<div class="callout warn"><b>Honest caveat:</b> I can't listen to audio, so nothing on this page is a transcription of the song. What's here is the <i>method</i>, the tools to do it by ear, and a neutral scaffold with labelled knobs. Your ears supply the specifics. Notes you type on this page are saved in your browser.</div>
<h3>The method: outside in, bottom up</h3>
<p>Always the same order, because each step makes the next one easier. Loop a 4- or 8-bar section of the song that has the full groove (YouTube: right-click → Loop, or set playback to 0.75× for hard parts) and work through:</p>`,
      },
      {
        type: 'notes',
        id: 'tapes',
        steps: [
          { k: 'tempo', label: '1. Tempo', help: 'Use the tap tool below: tap along with the kick/pulse for 10+ taps. Round to a whole number; producers almost always use one. Put it in <code>setcpm(BPM/4)</code>. Then play a bare <code>s("hh*4")</code> alongside the song to confirm it doesn\'t drift.' },
          { k: 'kick', label: '2. Kick pattern', help: 'Is it on every beat (four-on-the-floor) or syncopated? Count "1 e & a 2 e & a…" = 16 steps. Click it into the step grid below until it matches.' },
          { k: 'snare', label: '3. Snare / clap', help: 'Beats 2 & 4 (backbeat), beat 3 only (half-time), or something broken? Is it a snare, a clap, or both layered? Dry or reverby?' },
          { k: 'hats', label: '4. Hats & percussion', help: '8ths or 16ths? Offbeat open hat? Accents, swing, rolls? Any shakers, rims, toms? Don\'t chase every ghost note; get the pulse and the accents.' },
          { k: 'kit', label: '5. Drum sound', help: 'Try banks in the Sound browser. Punchy & clicky (909)? Boomy & long (808)? Crunchy (add <code>.crush</code>/<code>.distort</code>)? Filtered (<code>.lpf</code>)?' },
          { k: 'bassr', label: '6. Bass rhythm', help: 'Ignore pitch. Tap the bass rhythm and write it as a <code>.struct("x ~ x …")</code>. Does it avoid the kick (offbeat) or lock with it?' },
          { k: 'bassn', label: '7. Key and bass notes', help: 'Look up the key, or hum the "home" note and find it by trying <code>note("c2")</code>, <code>"d2"</code>… Set <code>.scale()</code> and find the bass notes as small integers. How often does the note change: every bar? every 2?' },
          { k: 'basst', label: '8. Bass tone', help: 'Sub-y and round (sine/triangle, low lpf)? Buzzy (saw)? Plucky (decay + lpenv) or sustained? Squelchy (lpq)?' },
          { k: 'chords', label: '9. Chords / pads / leads', help: 'List each pitched layer you can hear and classify it: pad, stab, arp, lead, vocal chop. The bass notes usually are the chord roots; try minor chords on them first. For each layer pick a waveform or <code>gm_</code> sound, then envelope, then filter.' },
          { k: 'fx', label: '10. Space & movement', help: 'What\'s washed in reverb? What echoes (and at what delay time)? Does anything sweep, pump or wobble? Add signals and effects from lesson 7.' },
          { k: 'form', label: '11. Structure', help: 'Write the song map: for each section, its length in bars and which layers are on. Then express it with <code>mask</code> or <code>arrange</code>.' },
        ],
      },
      { type: 'tool', tool: 'tap', id: 'tap1' },
      { type: 'tool', tool: 'grid', id: 'g2' },
      {
        type: 'text',
        html: `<h3>The scaffold</h3>
<p>A track skeleton with one block per role and the decisions marked <code>// ←</code>. Replace each guess with what you found above. Work with most layers muted (<code>_$:</code>), A/B against the song constantly, and get each layer "close enough" before moving on: 80% right on all layers sounds far more like the song than one perfect hi-hat.</p>`,
      },
      {
        type: 'editor',
        id: 'scaffold',
        title: 'Song scaffold (yours to overwrite; saved when you press play)',
        code: `setcpm(120/4) // ← BPM from the tap tool

// ── DRUMS ─────────────────────────────── paste from the step grid
$: s("bd ~ ~ ~  bd ~ ~ ~  bd ~ ~ ~  bd ~ ~ ~").bank("RolandTR909") // ← kick steps, kit
  .lpf(8000)                                 // ← lower = more muffled
$: s("~ cp ~ cp").bank("RolandTR909")        // ← backbeat? half-time? sd or cp?
  .room(.3).orbit(2)                         // ← how wet is it?
$: s("hh*16").bank("RolandTR909")            // ← 8ths or 16ths?
  .gain("[.5 .25 .4 .25]*4")                 // ← accent shape
_$: s("[~ oh]*4").bank("RolandTR909").gain(.5) // ← offbeat open hat, if any

// ── BASS ────────────────────────────────
$: n("<0 0 -2 -3>")                          // ← scale steps, one per bar
  .scale("C2:minor")                         // ← the key
  .struct("~ x ~ x ~ x x x")                 // ← bass rhythm
  .s("sawtooth").lpf(500)                    // ← wave + brightness
  .decay(.2).sustain(0)                      // ← plucky vs held

// ── CHORDS / PAD ────────────────────────
$: n("<[0,2,4,6] [0,2,4,6] [-2,0,2,4] [-3,-1,1,3]>") // ← stacked scale steps = chords in key
  .scale("C3:minor")
  .s("supersaw").lpf(sine.range(500, 2000).slow(8))  // ← tone + movement
  .attack(.3).release(1)                     // ← pad envelope (or make it a stab)
  .gain(.4).room(.7).orbit(3)

// ── LEAD / HOOK / ARP ───────────────────
_$: n("0 ~ 4 ~ 2 ~ ~ 4").scale("C4:minor")    // ← the tune, as scale steps
  .s("triangle").decay(.2).sustain(0)
  .delay(.4).delaytime(3/16).delayfeedback(.5).orbit(4)

// ── TEXTURE ─────────────────────────────
_$: s("white*16").hpf(6000).gain(perlin.range(.02, .12)) // ← tape hiss
_$: s("crackle*4").gain(.4)                               // ← vinyl/tape crackle`,
        after: `<p>Chords are written here as stacked scale steps (<code>[0,2,4,6]</code> = a 7th chord built on the root of whatever key you set), so that changing <code>.scale()</code> in one place moves bass, chords and lead together. Once you know the actual chords, feel free to switch to <code>chord("&lt;…&gt;").voicing()</code>.</p>`,
        tasks: [],
      },
      {
        type: 'text',
        html: `
<h3>When you get stuck</h3>
<ul>
<li><b>Can't hear the part?</b> Filter the <i>song</i>: an EQ browser extension or Audacity with a low-pass at 200 Hz isolates kick + bass; a high-pass at 5 kHz isolates hats. Slow it down to 0.5×.</li>
<li><b>Can't find a note?</b> Put <code>note("c3")</code> on a loop next to the paused-and-hummed song and step up one semitone at a time: c, c#, d, d#… One will "lock".</li>
<li><b>Sound isn't in Strudel?</b> Get the role right (rhythm, pitch, envelope, brightness) with the closest waveform. Exact timbre matching is the last 10% and needs sound-design hours; the song will already be recognisable without it. You can also load your own samples: <code>samples({ name: 'url-to.wav' })</code>.</li>
<li><b>Vocals</b> (Yonaka's, here): out of scope for synthesis. Sketch the vocal melody with a <code>gm_choir_aahs</code> or a sine lead if you want a placeholder.</li>
</ul>
<p>When the scaffold sounds like the song's main groove, take it to <a href="https://strudel.cc" target="_blank" rel="noopener">strudel.cc</a> (paste it in; it's the same engine, with a bigger editor and visualisers) and build the arrangement from your song map.</p>`,
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────── reference
export const CHEATSHEET = [
  {
    title: 'When things happen (rhythm)',
    rows: [
      ['"a b c"', 'Sequence squeezed into one cycle'],
      ['~', 'Rest'],
      ['a*4 · a/2', 'Faster · slower'],
      ['[a b]', 'Subdivide a slot'],
      ['a, b', 'Parallel'],
      ['<a b>', 'Alternate per cycle; <a b>/2 = every 2 cycles'],
      ['a!3 · a@3 · a?', 'Repeat · lengthen · random drop'],
      ['a(3,8)', 'Euclidean rhythm'],
      ['.struct("x ~ x x")', 'Impose a rhythm on notes/chords'],
      ['.mask("<0!4 1!4>")', 'Switch a layer on/off over time'],
      ['.fast(2) .slow(2)', 'Speed of the whole pattern'],
      ['.early(1/16) .late(1/16)', 'Nudge in time'],
      ['.swingBy(1/3, 4)', 'Shuffle'],
      ['setcpm(BPM/4)', 'Tempo'],
    ],
  },
  {
    title: 'What plays (sound source & pitch)',
    rows: [
      ['s("bd sd hh oh cp rim")', 'Drum samples'],
      ['.bank("RolandTR909")', 'Drum machine kit'],
      ['s("hh:3") · .n(3)', 'Sample variant'],
      ['note("c2 eb2") · note("36")', 'Pitch by name · MIDI number'],
      ['n("0 2 4").scale("C:minor")', 'Pitch by scale step'],
      ['chord("<Cm7 F7>").voicing()', 'Chords by symbol'],
      ['note("[c3,eb3,g3]")', 'Chord by hand'],
      ['.arp("0 1 2 1")', 'Arpeggiate a chord'],
      ['.s("sine|triangle|square|sawtooth|supersaw")', 'Synth oscillators'],
      ['.s("piano") · .s("gm_epiano1")', 'Sampled instruments'],
      ['.add(note(12)) · .add(n(2))', 'Transpose semitones · scale steps'],
    ],
  },
  {
    title: 'How it sounds (per-event parameters; order doesn\'t matter)',
    rows: [
      ['.gain(.8)', 'Volume'],
      ['.lpf(800) .lpq(10)', 'Low-pass cutoff (Hz) · resonance'],
      ['.hpf(200)', 'High-pass cutoff'],
      ['.lpenv(4) .lpa() .lpd(.1)', 'Filter envelope depth · attack · decay'],
      ['.attack .decay .sustain .release', 'Amplitude envelope (ADSR)'],
      ['.pan(0..1)', 'Stereo position'],
      ['.room(.5) .size(4)', 'Reverb amount · size'],
      ['.delay(.5) .delaytime(3/16) .delayfeedback(.5)', 'Echo amount · time (cycles) · repeats'],
      ['.orbit(2)', 'Separate reverb/delay bus'],
      ['.distort(2) .crush(6) .coarse(8)', 'Overdrive · bit-crush · sample-rate crush'],
      ['.vib(4) .vibmod(.3)', 'Pitch wobble rate · depth'],
      ['.phaser(.5)', 'Phaser'],
      ['.speed(2) · .speed(-1)', 'Sample rate/pitch · reverse'],
      ['.clip(1) · .cut(1)', 'Trim to step length · choke group'],
      ['.begin(.25).end(.5) · .chop(8)', 'Play a slice · granulate'],
    ],
  },
  {
    title: 'Movement & variation',
    rows: [
      ['sine saw tri square perlin rand', 'Signals, 0..1 per cycle'],
      ['.range(200, 2000).slow(8)', 'Rescale · stretch a signal'],
      ['.lpf(sine.range(300,3000).slow(8))', 'Filter sweep'],
      ['.gain(saw.range(.1,.8).fast(4))', 'Pump on every beat (use with struct("x*16"))'],
      ['.sometimes(x => x.ply(2))', 'Apply a change randomly (also often/rarely/sometimesBy)'],
      ['.every(4, x => x.rev())', 'Apply every Nth cycle'],
      ['.off(1/8, x => x.add(n(2)))', 'Layer a shifted, altered copy'],
      ['.jux(rev)', 'Altered copy in the right ear'],
      ['.degradeBy(.2)', 'Randomly thin out'],
    ],
  },
  {
    title: 'Structure',
    rows: [
      ['$: pattern', 'A layer. _$: mutes it'],
      ['const kick = s("bd*4")', 'Name a part'],
      ['stack(a, b, c)', 'Play parts together'],
      ['arrange([4, a], [8, b])', 'Play sections in order (bars, pattern)'],
      ['// comment', 'Notes to self'],
      ['._pianoroll() · ._scope()', 'Inline visualisers'],
    ],
  },
];

// Sound browser contents
export const SOUNDS = {
  banks: ['RolandTR909', 'RolandTR808', 'RolandTR707', 'LinnDrum', 'OberheimDMX', 'AkaiMPC60', 'EmuSP12', 'AlesisHR16', 'BossDR110'],
  drums: ['bd', 'sd', 'cp', 'hh', 'oh', 'rim', 'lt', 'mt', 'ht', 'cr', 'rd', 'cb', 'sh', 'perc'],
  synths: ['sine', 'triangle', 'square', 'sawtooth', 'supersaw', 'pulse'],
  instruments: [
    'piano', 'gm_epiano1', 'gm_epiano2', 'gm_synth_bass_1', 'gm_synth_bass_2', 'gm_lead_1_square', 'gm_lead_2_sawtooth',
    'gm_pad_new_age', 'gm_pad_warm', 'gm_pad_poly', 'gm_pad_choir', 'gm_pad_halo', 'gm_pad_sweep',
    'gm_synth_strings_1', 'gm_string_ensemble_1', 'gm_choir_aahs', 'gm_voice_oohs', 'gm_synth_choir',
    'gm_fx_atmosphere', 'gm_fx_echoes', 'gm_fx_crystal', 'gm_music_box', 'gm_vibraphone', 'gm_marimba', 'gm_kalimba',
    'gm_drawbar_organ', 'gm_electric_guitar_clean', 'gm_overdriven_guitar',
  ],
  noises: ['white', 'pink', 'brown', 'crackle'],
};
