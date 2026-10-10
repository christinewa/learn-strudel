import { LESSONS, CHEATSHEET, SOUNDS } from './lessons.js';

// ───────────────────────────────────────────────────────── persistence
const STORE_KEY = 'learn-strudel:v1';
const store = (() => {
  let data = { done: {}, code: {}, checks: {}, notes: {}, grids: {} };
  try {
    data = { ...data, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') };
  } catch {}
  const save = () => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch {}
  };
  return { data, save };
})();

// ───────────────────────────────────────────────────────── tiny DOM helper
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null) el.append(c);
  return el;
}

const PAGES = [
  ...LESSONS.map((l, i) => ({ ...l, kind: 'lesson', num: i + 1 })),
  { id: 'tools', kind: 'tools', title: 'Tools', blurb: 'Tap tempo, step grid, sound browser.' },
  { id: 'cheatsheet', kind: 'cheatsheet', title: 'Cheat sheet', blurb: 'Everything, grouped by what it changes.' },
];

// ───────────────────────────────────────────────────────── live editors
// Every mounted editor registers here so the X-ray loop can draw it and navigation can stop it.
const live = new Set();

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function toMidi(v) {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^([a-gA-G])([#bs]*)(-?\d+)?$/);
  if (!m) return null;
  const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[m[1].toLowerCase()];
  const acc = [...m[2]].reduce((a, c) => a + (c === 'b' ? -1 : 1), 0);
  return base + acc + ((m[3] === undefined ? 3 : +m[3]) + 1) * 12;
}
const midiName = (n) => NOTE_NAMES[((Math.round(n) % 12) + 12) % 12] + (Math.floor(Math.round(n) / 12) - 1);

const PALETTE = ['#ff6b6b', '#ffd166', '#4ecdc4', '#7aa2ff', '#c792ea', '#f78c6c', '#a3e635', '#f472b6', '#38bdf8', '#e2e8f0'];

function createEditor({ id, title, code, tasks = [], after, compact = false }) {
  const original = code;
  const saved = id && store.data.code[id];
  const wrap = h('section', { class: 'editor' + (compact ? ' compact' : '') });
  const playBtn = h('button', { class: 'btn play', onclick: () => api.play() }, '▶ Play');
  const stopBtn = h('button', { class: 'btn', onclick: () => api.stop() }, '■ Stop');
  const resetBtn = h('button', { class: 'btn ghost', title: 'Restore the original code', onclick: () => api.setCode(original, false) }, '↺ Reset');
  const head = h('header', {}, h('span', { class: 'etitle' }, title || ''), h('span', { class: 'ebtns' }, playBtn, stopBtn, resetBtn));
  const host = h('div', { class: 'ehost' });
  const err = h('div', { class: 'eerr', hidden: true });
  const xray = h('div', { class: 'xray' }, h('div', { class: 'xhint' }, 'Press play to X-ray the cycle'));
  wrap.append(head, host, err, xray);

  const el = document.createElement('strudel-editor');
  el.setAttribute('code', saved || code);
  el.settings = { ...el.settings, keybindings: 'vim' };
  let firstVimFocus = true;
  host.addEventListener('focusin', (event) => {
    if (!firstVimFocus) return;
    const view = el.editor?.editor;
    if (!view?.dom.contains(event.target)) return;
    const plugin = view.cm?.state.vimPlugin;
    if (!plugin) return;
    if (!view.cm.state.vim.insertMode) {
      plugin.handleKey({ key: 'i', preventDefault() {}, stopPropagation() {} }, view);
    }
    firstVimFocus = false;
  });

  const state = { started: false, pattern: null, cycle: null, rows: [], dirty: true };
  el.addEventListener('update', (e) => {
    const d = e.detail;
    state.started = !!d.started;
    wrap.classList.toggle('playing', state.started);
    playBtn.textContent = state.started ? '⟳ Update' : '▶ Play';
    const error = d.evalError || d.schedulerError;
    err.hidden = !error;
    if (error) err.textContent = String(error.message || error);
    if (d.pattern && d.pattern !== state.pattern) {
      state.pattern = d.pattern;
      state.rows = [];
      state.dirty = true;
    }
    if (id && d.started && d.activeCode && d.activeCode !== original) {
      store.data.code[id] = d.activeCode;
      store.save();
    }
  });

  const api = {
    wrap,
    xray,
    state,
    get ed() {
      return el.editor;
    },
    mount() {
      host.append(el); // connectedCallback needs to be in the document, so call after wrap is attached
    },
    play() {
      el.editor?.evaluate();
    },
    stop() {
      el.editor?.stop();
    },
    setCode(c, play = true) {
      if (!el.editor) return;
      el.editor.setCode(c);
      if (c === original && id) {
        delete store.data.code[id];
        store.save();
      }
      if (play || state.started) el.editor.evaluate();
    },
    destroy() {
      try {
        el.editor?.stop();
      } catch {}
      live.delete(api);
    },
  };
  live.add(api);

  if (tasks.length) {
    const list = h('ol', { class: 'tasks' });
    tasks.forEach((t, i) => {
      const key = `${id}:${i}`;
      const cb = h('input', { type: 'checkbox' });
      cb.checked = !!store.data.checks[key];
      cb.addEventListener('change', () => {
        store.data.checks[key] = cb.checked;
        store.save();
      });
      const li = h('li', {}, h('label', {}, cb, h('span', { html: t.text })));
      if (t.solution) li.append(h('button', { class: 'btn tiny ghost', onclick: () => api.setCode(t.solution) }, 'show me'));
      list.append(li);
    });
    wrap.append(h('div', { class: 'tasksbox' }, h('div', { class: 'taskshead' }, 'Try it'), list));
  }
  if (after) wrap.append(h('div', { class: 'after', html: after }));
  return api;
}

// X-ray: one row per sound, events of the current cycle, moving playhead
function drawXray(api) {
  const { state, xray } = api;
  const sched = api.ed?.repl?.scheduler;
  if (!state.started || !state.pattern || !sched) {
    xray.classList.remove('on');
    return;
  }
  const now = sched.now();
  if (!(now >= 0)) return;
  const cycle = Math.floor(now);
  if (cycle !== state.cycle || state.dirty) {
    state.cycle = cycle;
    state.dirty = false;
    let haps = [];
    try {
      haps = state.pattern.queryArc(cycle, cycle + 1).filter((hp) => hp.whole && hp.hasOnset() && typeof hp.value === 'object');
    } catch {
      return;
    }
    const byRow = new Map();
    for (const hp of haps) {
      const v = hp.value;
      if (v.s === undefined && v.note === undefined && v.n === undefined) continue;
      const key = (v.bank ? v.bank + ' ' : '') + (v.s ?? 'triangle');
      if (!state.rows.includes(key)) state.rows.push(key);
      if (!byRow.has(key)) byRow.set(key, []);
      byRow.get(key).push(hp);
    }
    xray.replaceChildren();
    xray.classList.add('on');
    const lanes = h('div', { class: 'xlanes' });
    state.rows.slice(0, 14).forEach((key) => {
      const color = PALETTE[state.rows.indexOf(key) % PALETTE.length];
      const lane = h('div', { class: 'xlane' });
      const evs = byRow.get(key) || [];
      const midis = evs.map((hp) => toMidi(hp.value.note)).filter((m) => m != null);
      const lo = Math.min(...midis);
      const hi = Math.max(...midis);
      for (const hp of evs) {
        const b = Number(hp.whole.begin) - cycle;
        const m = toMidi(hp.value.note);
        // drum hits are instants, so draw them one 16th wide at most; pitched notes keep their length
        const w = Math.min(Number(hp.whole.end) - Number(hp.whole.begin), 1 - b, m == null ? 1 / 16 : 1);
        const label = m != null ? midiName(m) : hp.value.n != null ? ':' + hp.value.n : '';
        const blk = h('div', { class: 'xev', title: label || key }, w > 0.055 ? label : '');
        blk.style.left = b * 100 + '%';
        blk.style.width = `calc(${w * 100}% - 2px)`;
        blk.style.background = color;
        blk.style.opacity = 0.35 + 0.65 * Math.min(1, hp.value.gain ?? 0.8);
        if (m != null && hi > lo) {
          blk.style.top = (1 - (m - lo) / (hi - lo)) * 60 + '%';
          blk.style.height = '40%';
        }
        lane.append(blk);
      }
      lanes.append(h('div', { class: 'xrow' }, h('div', { class: 'xlabel', title: key }, key), lane));
    });
    const grid = h('div', { class: 'xgrid' });
    for (let i = 0; i < 16; i++) grid.append(h('i', { class: i % 4 === 0 ? 'beat' : '' }));
    const head = h('div', { class: 'xplayhead' });
    const lanesWrap = h('div', { class: 'xlaneswrap' }, grid, head);
    xray.append(h('div', { class: 'xmeta' }, `cycle ${cycle + 1}`, h('span', {}, 'one bar · 16 steps')), h('div', { class: 'xbody' }, lanes, lanesWrap));
    state.head = head;
  }
  if (state.head) state.head.style.left = (now - cycle) * 100 + '%';
}
(function loop() {
  for (const api of live) drawXray(api);
  requestAnimationFrame(loop);
})();

// ───────────────────────────────────────────────────────── widgets
function mcq({ q, options, answer, explain }) {
  const box = h('section', { class: 'quiz' }, h('div', { class: 'qhead' }, 'Check yourself'), h('p', { class: 'q', html: q }));
  const fb = h('div', { class: 'fb', hidden: true });
  options.forEach((o, i) => {
    const b = h('button', { class: 'opt', html: o });
    b.addEventListener('click', () => {
      box.querySelectorAll('.opt').forEach((x) => x.classList.remove('right', 'wrong'));
      b.classList.add(i === answer ? 'right' : 'wrong');
      fb.hidden = false;
      fb.innerHTML = (i === answer ? '<b>Yes.</b> ' : '<b>Not quite.</b> ') + (i === answer ? explain : 'Try another.');
    });
    box.append(b);
  });
  box.append(fb);
  return box;
}

function lineQuiz({ code, questions, editorId }, editors) {
  const lines = code.split('\n');
  let qi = 0;
  const solved = new Set();
  const box = h('section', { class: 'quiz linequiz' });
  const qText = h('p', { class: 'q' });
  const prog = h('div', { class: 'qhead' });
  const fb = h('div', { class: 'fb', hidden: true });
  const pre = h('div', { class: 'codelines' });
  const lineEls = lines.map((ln, i) => {
    const row = h('div', { class: 'cl' + (ln.trim() ? '' : ' blank') }, h('span', { class: 'ln' }, i + 1), h('code', {}, ln || ' '));
    if (ln.trim()) row.addEventListener('click', () => pick(i + 1, row));
    pre.append(row);
    return row;
  });
  const hear = h('button', { class: 'btn', hidden: true }, '▶ Hear the fix');
  const next = h('button', { class: 'btn play', hidden: true }, 'Next question →');
  const orig = h('button', { class: 'btn ghost', hidden: true }, '↺ Back to original');
  const target = () => editors.find((e) => e.id === editorId)?.api;
  hear.addEventListener('click', () => {
    target()?.setCode(questions[qi].fix);
    target()?.wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  orig.addEventListener('click', () => target()?.setCode(code));
  next.addEventListener('click', () => {
    qi = (qi + 1) % questions.length;
    show();
  });
  function show() {
    const Q = questions[qi];
    prog.textContent = `Which line? · ${qi + 1} / ${questions.length}` + (solved.size ? ` · ${solved.size} solved` : '');
    qText.innerHTML = '“' + Q.q + '”';
    fb.hidden = hear.hidden = next.hidden = orig.hidden = true;
    lineEls.forEach((r) => r.classList.remove('right', 'wrong'));
  }
  function pick(n, row) {
    const Q = questions[qi];
    if (Q.answer.includes(n)) {
      lineEls.forEach((r) => r.classList.remove('wrong'));
      row.classList.add('right');
      solved.add(qi);
      fb.hidden = false;
      fb.innerHTML = '<b>Yes, line ' + n + '.</b> ' + Q.explain;
      hear.hidden = next.hidden = orig.hidden = false;
      prog.textContent = `Which line? · ${qi + 1} / ${questions.length} · ${solved.size} solved`;
    } else {
      row.classList.add('wrong');
      fb.hidden = false;
      fb.innerHTML = '<b>Not that one.</b> Which instrument is it about? Is it about rhythm, pitch, or tone?';
    }
  }
  box.append(prog, qText, pre, fb, h('div', { class: 'qbtns' }, hear, orig, next));
  show();
  return box;
}

function tapTool() {
  let taps = [];
  const out = h('div', { class: 'bpm' }, '–');
  const code = h('code', { class: 'bpmcode' }, 'setcpm(BPM/4)');
  const hint = h('div', { class: 'muted' }, 'Play the song, then click the pad (or focus it and hit any key) on every beat. 10+ taps for accuracy.');
  const pad = h('button', { class: 'tappad' }, 'TAP');
  const tap = (e) => {
    e?.preventDefault?.();
    const t = performance.now();
    if (taps.length && t - taps[taps.length - 1] > 2500) taps = [];
    taps.push(t);
    taps = taps.slice(-16);
    pad.classList.remove('hit');
    void pad.offsetWidth;
    pad.classList.add('hit');
    if (taps.length >= 3) {
      const bpm = 60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1));
      out.textContent = bpm.toFixed(1) + ' BPM';
      code.textContent = `setcpm(${Math.round(bpm)}/4)`;
    } else out.textContent = 'keep tapping…';
  };
  pad.addEventListener('mousedown', tap);
  pad.addEventListener('keydown', (e) => !e.repeat && tap(e));
  const reset = h('button', { class: 'btn ghost tiny', onclick: () => ((taps = []), (out.textContent = '–')) }, 'reset');
  return h('section', { class: 'tool' }, h('div', { class: 'toolhead' }, 'Tap tempo'), hint, h('div', { class: 'taprow' }, pad, h('div', {}, out, code, reset)));
}

const GRID_ROWS = ['bd', 'sd', 'cp', 'hh', 'oh', 'rim'];
const GRID_PRESETS = {
  House: { bpm: 124, bd: [0, 4, 8, 12], cp: [4, 12], oh: [2, 6, 10, 14], hh: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  Techno: { bpm: 132, bd: [0, 4, 8, 12], rim: [3, 6, 11], oh: [2, 6, 10, 14], hh: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15] },
  Breakbeat: { bpm: 130, bd: [0, 10], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], rim: [7, 9] },
  'Half-time': { bpm: 140, bd: [0, 6, 7], sd: [8], hh: [0, 2, 4, 6, 8, 10, 12, 13, 14, 15] },
  Electro: { bpm: 110, bd: [0, 3, 6, 10], sd: [4, 12], hh: [0, 2, 4, 6, 8, 10, 12, 14], cp: [12] },
  Clear: { bpm: null },
};
function gridTool(id) {
  const st = store.data.grids[id] || { bpm: 124, bank: 'RolandTR909', rows: { bd: [0, 4, 8, 12] } };
  const edApi = createEditor({ id: null, title: 'Generated code (editable, but the grid overwrites it)', code: gen(), compact: true });
  function gen() {
    const lines = [`setcpm(${st.bpm}/4)`, ''];
    for (const r of GRID_ROWS) {
      const on = st.rows[r] || [];
      if (!on.length) continue;
      const steps = Array.from({ length: 16 }, (_, i) => (on.includes(i) ? r : '~'));
      const beats = [0, 4, 8, 12].map((b) => steps.slice(b, b + 4).join(' '));
      lines.push(`$: s("${beats.join('  ')}").bank("${st.bank}")`);
    }
    if (lines.length === 2) lines.push('$: s("~")');
    return lines.join('\n');
  }
  const cells = h('div', { class: 'grid' });
  function render() {
    cells.replaceChildren();
    for (const r of GRID_ROWS) {
      const row = h('div', { class: 'grow' }, h('span', { class: 'glabel' }, r));
      for (let i = 0; i < 16; i++) {
        const on = (st.rows[r] || []).includes(i);
        row.append(
          h('button', {
            class: 'cell' + (on ? ' on' : '') + (i % 4 === 0 ? ' beat' : ''),
            'aria-label': `${r} step ${i + 1}`,
            onclick: () => {
              const set = new Set(st.rows[r] || []);
              set.has(i) ? set.delete(i) : set.add(i);
              st.rows[r] = [...set].sort((a, b) => a - b);
              changed();
            },
          }),
        );
      }
      cells.append(row);
    }
  }
  function changed() {
    store.data.grids[id] = st;
    store.save();
    render();
    edApi.setCode(gen(), false);
  }
  const bpm = h('input', { type: 'number', min: 40, max: 220, value: st.bpm, class: 'num' });
  bpm.addEventListener('change', () => {
    st.bpm = Math.max(40, Math.min(220, +bpm.value || 120));
    changed();
  });
  const bank = h('select', {}, ...SOUNDS.banks.map((b) => h('option', { value: b, selected: b === st.bank }, b)));
  bank.addEventListener('change', () => {
    st.bank = bank.value;
    changed();
  });
  const presets = Object.entries(GRID_PRESETS).map(([name, p]) =>
    h('button', {
      class: 'btn tiny ghost',
      onclick: () => {
        st.rows = {};
        for (const r of GRID_ROWS) if (p[r]) st.rows[r] = [...p[r]];
        if (p.bpm) bpm.value = st.bpm = p.bpm;
        changed();
      },
    }, name),
  );
  render();
  const box = h('section', { class: 'tool' },
    h('div', { class: 'toolhead' }, 'Step grid → code'),
    h('div', { class: 'gridbar' }, h('label', {}, 'BPM ', bpm), h('label', {}, 'Kit ', bank), h('span', { class: 'presets' }, 'Presets: ', ...presets)),
    h('div', { class: 'gridnums' }, h('span', { class: 'glabel' }), ...[1, 2, 3, 4].map((n) => h('span', {}, String(n)))),
    cells,
    edApi.wrap,
  );
  return { el: box, editors: [{ id: null, api: edApi }] };
}

function soundTool() {
  const edApi = createEditor({ id: null, title: 'Auditioning', code: 's("bd ~ bd ~").bank("RolandTR909")', compact: true });
  const bank = h('select', {}, h('option', { value: '' }, '(default samples)'), ...SOUNDS.banks.map((b) => h('option', { value: b, selected: b === 'RolandTR909' }, b)));
  const octave = h('select', {}, ...[1, 2, 3, 4, 5].map((o) => h('option', { value: o, selected: o === 3 }, 'octave ' + o)));
  const chip = (label, codeFn) => h('button', { class: 'chip', onclick: () => edApi.setCode(codeFn()) }, label);
  const pitched = (s) => () => {
    const o = +octave.value;
    return `note("c${o} eb${o} g${o} [c${o},eb${o},g${o},bb${o}]").s("${s}")\n  .lpf(3000).release(.2)`;
  };
  return {
    el: h('section', { class: 'tool' },
      h('div', { class: 'toolhead' }, 'Sound browser'),
      h('div', { class: 'muted' }, 'Click to loop a sound; the code it takes is shown below. Not every kit has every drum (a missing one is just silent).'),
      h('h4', {}, 'Drums ', bank),
      h('div', { class: 'chips' }, ...SOUNDS.drums.map((d) => chip(d, () => `s("${d} ~ ${d} ~")` + (bank.value ? `.bank("${bank.value}")` : '')))),
      h('h4', {}, 'Oscillators ', octave),
      h('div', { class: 'chips' }, ...SOUNDS.synths.map((s) => chip(s, pitched(s)))),
      h('h4', {}, 'Sampled instruments'),
      h('div', { class: 'chips' }, ...SOUNDS.instruments.map((s) => chip(s.replace('gm_', ''), pitched(s)))),
      h('h4', {}, 'Noise & texture'),
      h('div', { class: 'chips' }, ...SOUNDS.noises.map((s) => chip(s, () => `s("${s}*8").decay(.08).sustain(0).gain(.5)`))),
      edApi.wrap,
    ),
    editors: [{ id: null, api: edApi }],
  };
}

function notesTool({ id, steps }) {
  const box = h('section', { class: 'worksheet' });
  steps.forEach((s) => {
    const key = `${id}:${s.k}`;
    const ta = h('textarea', { rows: 2, placeholder: 'your findings…' });
    ta.value = store.data.notes[key] || '';
    ta.addEventListener('input', () => {
      store.data.notes[key] = ta.value;
      store.save();
    });
    box.append(h('div', { class: 'wstep' }, h('div', { class: 'wlabel' }, s.label), h('div', { class: 'whelp', html: s.help }), ta));
  });
  return box;
}

// ───────────────────────────────────────────────────────── pages
const nav = document.getElementById('nav');
const main = document.getElementById('main');
let mounted = [];

function renderNav(current) {
  const doneCount = LESSONS.filter((l) => store.data.done[l.id]).length;
  nav.replaceChildren(
    h('a', { class: 'brand', href: '#' + PAGES[0].id }, h('span', { class: 'logo' }, '꩜'), ' Learn Strudel'),
    h('div', { class: 'progress' }, h('div', { class: 'bar' }, h('i', { style: `width:${(doneCount / LESSONS.length) * 100}%` })), `${doneCount} / ${LESSONS.length} lessons`),
    h('ol', { class: 'toc' },
      ...PAGES.map((p) =>
        h('li', { class: (p.id === current ? 'cur ' : '') + (store.data.done[p.id] ? 'done ' : '') + p.kind },
          h('a', { href: '#' + p.id }, h('span', { class: 'n' }, store.data.done[p.id] ? '✓' : p.num || '·'), h('span', {}, p.title)),
        ),
      ),
    ),
    h('div', { class: 'navfoot' },
      h('div', {}, h('kbd', {}, 'Ctrl'), '+', h('kbd', {}, 'Enter'), ' play / update'),
      h('div', {}, h('kbd', {}, 'Ctrl'), '+', h('kbd', {}, '.'), ' stop'),
      h('button', { class: 'btn ghost tiny', onclick: () => live.forEach((a) => a.stop()) }, '■ stop everything'),
    ),
  );
}

function renderPage() {
  mounted.forEach((m) => m.api.destroy());
  mounted = [];
  const id = location.hash.slice(1) || PAGES[0].id;
  const page = PAGES.find((p) => p.id === id) || PAGES[0];
  renderNav(page.id);
  main.replaceChildren();
  const art = h('article');
  art.append(h('div', { class: 'kicker' }, page.kind === 'lesson' ? `Lesson ${page.num} of ${LESSONS.length}` : 'Reference'), h('h1', {}, page.title), h('p', { class: 'blurb' }, page.blurb));

  const addTool = (t) => {
    art.append(t.el);
    mounted.push(...t.editors);
  };
  if (page.kind === 'lesson') {
    for (const sec of page.sections) {
      if (sec.type === 'text') art.append(h('div', { class: 'prose', html: sec.html }));
      else if (sec.type === 'editor') {
        const api = createEditor(sec);
        art.append(api.wrap);
        mounted.push({ id: sec.id, api });
      } else if (sec.type === 'mcq') art.append(mcq(sec));
      else if (sec.type === 'linequiz') art.append(lineQuiz(sec, mounted));
      else if (sec.type === 'notes') art.append(notesTool(sec));
      else if (sec.type === 'tool' && sec.tool === 'grid') addTool(gridTool(sec.id));
      else if (sec.type === 'tool' && sec.tool === 'tap') art.append(tapTool());
    }
    const idx = LESSONS.findIndex((l) => l.id === page.id);
    const nextPage = PAGES[idx + 1];
    const done = h('button', { class: 'btn play big' }, store.data.done[page.id] ? '✓ Completed' : 'Mark complete');
    done.addEventListener('click', () => {
      store.data.done[page.id] = !store.data.done[page.id];
      store.save();
      done.textContent = store.data.done[page.id] ? '✓ Completed' : 'Mark complete';
      renderNav(page.id);
    });
    art.append(h('footer', { class: 'pagefoot' }, done, nextPage ? h('a', { class: 'btn big', href: '#' + nextPage.id }, `Next: ${nextPage.title} →`) : null));
  } else if (page.kind === 'tools') {
    art.append(tapTool());
    addTool(gridTool('tools-grid'));
    addTool(soundTool());
  } else {
    for (const grp of CHEATSHEET) {
      art.append(h('h3', {}, grp.title), h('table', { class: 'ref wide' }, ...grp.rows.map(([c, d]) => h('tr', {}, h('td', {}, h('code', {}, c)), h('td', {}, d)))));
    }
    art.append(h('p', { class: 'muted', html: 'Full reference with runnable examples: <a href="https://strudel.cc/learn/" target="_blank" rel="noopener">strudel.cc/learn</a>' }));
  }
  main.append(art);
  mounted.forEach((m) => m.api.mount());
  window.scrollTo(0, 0);
}

// ───────────────────────────────────────────────────────── self-test (?selftest): evaluate every snippet
async function selfTest() {
  const codes = [];
  for (const l of LESSONS)
    for (const s of l.sections) {
      if (s.type === 'editor') {
        codes.push([`${l.id}/${s.id}`, s.code]);
        (s.tasks || []).forEach((t, i) => t.solution && codes.push([`${l.id}/${s.id}/task${i + 1}`, t.solution]));
      }
      if (s.type === 'linequiz') s.questions.forEach((q, i) => codes.push([`${l.id}/quiz${i + 1}`, q.fix]));
    }
  const api = createEditor({ id: null, title: 'selftest', code: 's("bd")' });
  main.replaceChildren(api.wrap);
  api.mount();
  const out = h('pre', { id: 'selftest' }, 'running…');
  main.append(out);
  await new Promise((r) => setTimeout(r, 4000));
  const known = new Set(Object.keys(globalThis.soundMap.get()).map((k) => k.toLowerCase()));
  const results = [];
  for (const [name, code] of codes) {
    const problems = [];
    try {
      api.ed.setCode(code); // slider() widgets are positioned against the editor document
      await api.ed.repl.evaluate(code, false);
      const st = api.ed.repl.state;
      if (st.evalError) problems.push('eval: ' + st.evalError.message);
      else {
        const haps = st.pattern.queryArc(0, 32);
        if (!haps.length) problems.push('no events in 32 cycles');
        for (const hp of haps) {
          const v = hp.value;
          const snd = ((v.bank ? v.bank + '_' : '') + (v.s ?? 'triangle')).toLowerCase();
          if (!known.has(snd)) problems.push('unknown sound: ' + snd);
        }
      }
    } catch (e) {
      problems.push('throw: ' + e.message);
    }
    results.push({ name, problems: [...new Set(problems)] });
  }
  window.__selftest = results;
  const bad = results.filter((r) => r.problems.length);
  out.textContent = `${results.length} snippets, ${bad.length} with problems\n` + bad.map((r) => `${r.name}: ${r.problems.join('; ')}`).join('\n');
}

if (new URLSearchParams(location.search).has('selftest')) selfTest();
else {
  window.addEventListener('hashchange', renderPage);
  renderPage();
}
