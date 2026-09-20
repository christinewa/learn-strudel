#!/usr/bin/env python3
"""Convert the BiMMuDa melody MIDIs into Strudel mini-notation.

  bimmuda.py build              write dist/melodies.json
  bimmuda.py show <id|query>    print a paste-ready Strudel snippet (e.g. 1984_01_1, "doves")
  bimmuda.py list [query]       list melodies matching a title/artist/year query
  bimmuda.py serve              serve dist/ on localhost with CORS, for fetch() from strudel.cc
"""
import csv, json, math, re, sys
from collections import Counter
from fractions import Fraction
from functools import reduce
from pathlib import Path

import mido

ROOT = Path(__file__).parent
DATA = ROOT / "data" / "BiMMuDa"
DIST = ROOT / "dist"

GRID = 24  # quantize to 1/24 of a quarter note: covers 16ths, 32nds, triplets, sextuplets
NAMES = ["c", "db", "d", "eb", "e", "f", "gb", "g", "ab", "a", "bb", "b"]
PCS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
SCALES = {"major": [0, 2, 4, 5, 7, 9, 11], "minor": [0, 2, 3, 5, 7, 8, 10]}


def note_name(n):
    return f"{NAMES[n % 12]}{n // 12 - 1}"


def pitch_class(tonic):
    return (PCS[tonic[0]] + tonic.count("#") - tonic.count("b")) % 12


def read_midi(path):
    """-> (notes [(start, dur, pitch)] in grid units, bars [(start, length)] in grid units, quarter bpm)"""
    m = mido.MidiFile(path)
    to_grid = lambda ticks: round(Fraction(ticks * GRID, m.ticks_per_beat))
    t, on, notes, sigs, bpm = 0, {}, [], [], None
    for msg in mido.merge_tracks(m.tracks):
        t += msg.time
        if msg.type == "set_tempo" and bpm is None:
            bpm = mido.tempo2bpm(msg.tempo)
        elif msg.type == "time_signature":
            sigs.append((to_grid(t), msg.numerator * 4 * GRID // msg.denominator))
        elif msg.type == "note_on" and msg.velocity > 0:
            on[msg.note] = t
        elif msg.type in ("note_off", "note_on") and msg.note in on:
            s = to_grid(on.pop(msg.note))
            notes.append((s, max(1, to_grid(t) - s), msg.note))
    notes.sort()
    # melodies are monophonic: trim any overlap left by quantization
    notes = [(s, min(d, nxt[0] - s) if nxt else d, p) for (s, d, p), nxt in zip(notes, notes[1:] + [None])]
    notes = [n for n in notes if n[1] > 0]
    if not sigs or sigs[0][0] > 0:
        sigs.insert(0, (0, 4 * GRID))
    end = max(s + d for s, d, _ in notes)
    bars, pos = [], 0
    for i, (at, length) in enumerate(sigs):
        until = sigs[i + 1][0] if i + 1 < len(sigs) else end
        pos = at
        while pos < until:
            bars.append((pos, min(length, until - pos) if i + 1 < len(sigs) else length))
            pos += bars[-1][1]
    return notes, bars, bpm or 120


def render(cells):
    """cells: [(token, length)] filling a span exactly -> mini-notation with minimal @weights"""
    g = reduce(math.gcd, (l for _, l in cells))
    return " ".join(t if l == g else f"{t}@{l // g}" for t, l in cells)


def fill(span_start, span_len, events):
    """events: [(start, dur, token)] -> cells covering the span, rests merged in"""
    cells, pos = [], span_start
    for s, d, tok in events:
        if s > pos:
            cells.append(("~", s - pos))
        cells.append((tok, d))
        pos = s + d
    if pos < span_start + span_len:
        cells.append(("~", span_start + span_len - pos))
    return cells


def to_pattern(notes, bars, token):
    """One group per bar; bars joined by a held note are merged so nothing gets cut at a barline.
    Always `[ [bar] [bar]@w ... ]/cycles` so odd-length bars keep their true duration."""
    nominal = Counter(l for _, l in bars).most_common(1)[0][0]
    # a short first bar is a pickup: pad it with a leading rest up to a full bar
    offset = nominal - bars[0][1] if bars[0][1] < nominal else 0
    notes = [(s + offset, d, p) for s, d, p in notes]
    bars = [(0, nominal)] + [(s + offset, l) for s, l in bars[1:]] if offset else list(bars)

    groups = []  # [start, length]
    for s, l in bars:
        if groups and any(ns < s < ns + nd for ns, nd, _ in notes):
            groups[-1][1] += l
        else:
            groups.append([s, l])
    lines = []
    for s, l in groups:
        inside = [n for n in notes if s <= n[0] < s + l]
        # transcribed durations are a hair short of notated ones (0.498 beats etc.), so snap note ends
        # to the finest grid the onsets use: 16ths, or triplet 16ths / finer when the bar needs them
        step = next(g for g in (6, 4, 3, 2, 1) if all((ns - s) % g == 0 for ns, _, _ in inside))
        evs = []
        for (ns, nd, p), nxt in zip(inside, inside[1:] + [None]):
            limit = (nxt[0] if nxt else s + l) - ns
            evs.append((ns, min(max(step, round(nd / step) * step), limit), token(p)))
        w = Fraction(l, nominal)
        weight = "" if w == 1 else f"@{float(w):g}"
        lines.append(f"  [{render(fill(s, l, evs))}]{weight}")
    cycles = Fraction(sum(l for _, l in groups), nominal)
    return "[\n" + "\n".join(lines) + f"\n]/{float(cycles):g}", float(cycles), nominal


def pick_key(song, pitches):
    """Songs can list several keys; choose the one whose scale covers the most melody notes."""
    best = None
    for i in range(1, 7):
        tonic, mode = song.get(f"Tonic {i}", ""), song.get(f"Mode {i}", "") or song.get("Mode 1", "")
        if not tonic:
            continue
        pcs = {(pitch_class(tonic) + x) % 12 for x in SCALES[mode.lower()]}
        score = sum(p % 12 in pcs for p in pitches)
        if best is None or score > best[0]:
            best = (score, tonic, mode.lower())
    return best[1:] if best else None


def load_metadata():
    read = lambda name: list(csv.DictReader(open(DATA / "metadata" / name, encoding="utf-8-sig")))
    songs = {(r["Year"], r["Position"].strip()): r for r in read("bimmuda_per_song_metadata.csv")}
    sections = {r["Melody ID"]: r for r in read("bimmuda_per_melody_metadata.csv")}
    return songs, sections


def convert(path, songs, sections):
    mid = path.stem
    year, pos = mid.split("_")[:2]
    song, section = songs.get((year, pos.lstrip("0")), {}), sections.get(mid, {})
    notes, bars, qbpm = read_midi(path)
    pattern, cycles, nominal = to_pattern(notes, bars, note_name)
    out = {
        "id": mid,
        "title": song.get("Title", "").strip(),
        "artist": song.get("Artist", "").strip(),
        "year": int(year),
        "rank": int(re.match(r"\d+", pos)[0]),  # double A-sides share a rank (ids 02a / 02b)
        "genre": song.get("Genre (Broad 1)", "").strip(),
        "section": section.get("Type", "N/A"),
        "timeSig": section.get("Time Signature") or song.get("Time Signature 1", ""),
        "cpm": round(qbpm * GRID / nominal, 2),  # one cycle = one bar
        "cycles": cycles,
        "notes": pattern,
    }
    key = pick_key(song, [p for _, _, p in notes])
    if key:
        tonic, mode = key
        scale = SCALES[mode]
        lowest = min(p for _, _, p in notes)
        root = lowest - (lowest - pitch_class(tonic)) % 12  # tonic at or just below the lowest note
        chromatic = sum((p - root) % 12 not in scale for _, _, p in notes)

        def degree(p):  # off-scale notes snap down to the nearest scale step
            octave, semis = divmod(p - root, 12)
            return str(octave * 7 + max(i for i, x in enumerate(scale) if x <= semis))

        out |= {
            "key": f"{tonic} {mode}",
            "scale": f"{note_name(root).capitalize()}:{mode}",
            "degrees": to_pattern(notes, bars, degree)[0],
            "semis": to_pattern(notes, bars, lambda p: str(p - root))[0],
            "root": note_name(root),
            "rootMidi": root,
            "chromatic": chromatic,  # how many notes `degrees` had to snap; `semis` is always exact
        }
    return out


def melody_files():
    return sorted(p for p in (DATA / "bimmuda_dataset").glob("*/*/*.mid") if not p.stem.endswith("full"))


def build():
    songs, sections = load_metadata()
    melodies, failed = {}, []
    for path in melody_files():
        try:
            melodies[path.stem] = convert(path, songs, sections)
        except Exception as e:
            failed.append((path.stem, repr(e)))
    DIST.mkdir(exist_ok=True)
    (DIST / "melodies.json").write_text(json.dumps(melodies, ensure_ascii=False, indent=1))
    print(f"wrote {len(melodies)} melodies to {DIST / 'melodies.json'}")
    for f in failed:
        print("FAILED", *f)


def find(query):
    songs, sections = load_metadata()
    hits = []
    for path in melody_files():
        year, pos = path.stem.split("_")[:2]
        song = songs.get((year, pos.lstrip("0")), {})
        hay = f"{path.stem} {song.get('Title', '')} {song.get('Artist', '')}".lower()
        if all(w in hay for w in query.lower().split()):
            hits.append((path, song, sections.get(path.stem, {})))
    return hits, songs, sections


def snippet(m):
    head = f"// {m['title']} — {m['artist']} ({m['year']} #{m['rank']}), {m['section']}, {m.get('key', '?')}, {m['timeSig']}"
    return f"{head}\nsetcpm({m['cpm']:g})\n\n$: note(`{m['notes']}`)\n  .s(\"triangle\")"


def main():
    cmd, arg = (sys.argv[1:2] or ["help"])[0], " ".join(sys.argv[2:])
    if cmd == "build":
        build()
    elif cmd in ("show", "list"):
        hits, songs, sections = find(arg)
        if cmd == "list" or len(hits) != 1 and not any(p.stem == arg for p, _, _ in hits):
            for p, song, sec in hits:
                print(f"{p.stem:14} {sec.get('Type', ''):11} {song.get('Title', '')} — {song.get('Artist', '')}")
            return
        path = next((p for p, _, _ in hits if p.stem == arg), hits[0][0])
        print(snippet(convert(path, songs, sections)))
    elif cmd == "serve":
        from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

        class Handler(SimpleHTTPRequestHandler):
            def __init__(self, *a, **k):
                super().__init__(*a, directory=str(DIST), **k)

            def end_headers(self):
                self.send_header("Access-Control-Allow-Origin", "*")
                super().end_headers()

        print("serving http://localhost:8765/melodies.json")
        ThreadingHTTPServer(("localhost", 8765), Handler).serve_forever()
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
