#!/usr/bin/env python3
"""Build a timing map for a song: beats, bars, drum drops, sections, lines and words.

Reads public/<name>/ and writes src/<name>/timing.ts (for code) and
src/<name>/TIMING.md (a shared reference for talking about the song):

  .venv/bin/python song_timing.py gremlin_in_the_repo
  .venv/bin/python song_timing.py gremlin_in_the_repo --asr      # re-run Whisper

Inputs in public/<name>/ (Suno export):
  <title>.mp3           the full song (the only mp3 not starting with a stem number)
  lyrics.txt            lyrics with [Section] headers; (parenthesised) parts are ad-libs
  "2 Drums.mp3"         drum stem -> tempo, beat grid, downbeats, drops (drums silent)
  "0 Lead Vocals.mp3"   lead vocal stem -> word timing of the main lyrics
  "1 Backing Vocals.mp3" backing vocal stem -> word timing of the ad-libs

The words always come from lyrics.txt; Whisper (faster-whisper, CPU) only supplies
timing. Each lyric word is matched to a transcribed word in order (difflib on
normalised tokens); unmatched words are spread over the gap between their matched
neighbours in proportion to their length. Transcripts are cached in
out/song_timing/<name>/ because Whisper takes a few minutes.

Needs the project venv: uv venv .venv && uv pip install librosa faster-whisper.
"""

import argparse
import difflib
import json
import re
from pathlib import Path

import librosa
import numpy as np

ROOT = Path(__file__).resolve().parent
WHISPER_MODEL = "large-v3-turbo"
DROP_MIN_SECONDS = 0.4  # drum silence shorter than this is just a gap between hits
FPS = 30
SECTION_CODES = {"intro": "I", "verse": "V", "pre-chorus": "P", "chorus": "C", "hook": "H",
                 "bridge": "B", "outro": "O"}
GAP_SECONDS = 3.0  # a pause between lines this long is listed as instrumental in TIMING.md
SECONDS_PER_LETTER = 0.07  # pace for words Whisper missed (rap: about 5 words per second)


TS_TYPES = """\
/** One lyric word. adlib = (parenthesised) shout; guessed = Whisper missed it, time interpolated. */
export type Word = { text: string; s: number; e: number; adlib?: boolean; guessed?: boolean };
/** ref: section ref + line number, e.g. "C1.3" = chorus 1, line 3 (see TIMING.md). */
export type Line = { ref: string; text: string; s: number; e: number; words: Word[] };
/** ref: "I", "V1", "C2", "B" … name: "Chorus 2" … */
export type Section = { ref: string; name: string; s: number; e: number; lines: Line[] };
export type SongTiming = {
  audio: string;
  bpm: number;
  /** Seconds per beat. */
  beat: number;
  /** Time of beat 1 in bar 1. */
  firstDownbeat: number;
  beats: number;
  fitErrorMs: number;
  /** [start, end] where the drums are silent (record stops, breaks). */
  drops: [number, number][];
  sections: Section[];
};

"""


def transcribe(src: Path, cache: Path, force: bool, prompt: str) -> list[dict]:
    if cache.exists() and not force:
        return json.loads(cache.read_text())
    from faster_whisper import WhisperModel

    model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(
        str(src), language="en", word_timestamps=True, vad_filter=False,
        initial_prompt=prompt, condition_on_previous_text=False, beam_size=5,
    )
    words = [
        {"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)}
        for s in segments for w in s.words
    ]
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(words, indent=0))
    return words


def beat_grid(drums: Path) -> dict:
    """Constant-tempo grid fitted to librosa's beats, with the downbeat from kick vs snare."""
    y, sr = librosa.load(drums, sr=44100, mono=True)
    hop = 128
    onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    _, beats = librosa.beat.beat_track(onset_envelope=onset, sr=sr, hop_length=hop,
                                       units="time", tightness=400)
    n = np.arange(len(beats))
    period, offset = np.polyfit(n, beats, 1)

    # Boom-bap: kick on 1 and 3, snare on 2 and 4. Beat 1 is the phase with the most kick.
    spec = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    kick = spec[(freqs > 30) & (freqs < 120)].sum(0)
    times = librosa.frames_to_time(np.arange(spec.shape[1]), sr=sr, hop_length=hop)
    peak = lambda t: kick[np.searchsorted(times, t - 0.02):np.searchsorted(times, t + 0.04)].max()
    strength = [np.mean([peak(t) for t in beats[ph::4]]) for ph in range(4)]
    first = offset + period * int(np.argmax(strength))

    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    rms_t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
    silent = rms < rms.max() * 0.02
    drops, start = [], None
    for t, s in zip(rms_t, silent):
        if s and start is None:
            start = t
        elif not s and start is not None:
            if t - start >= DROP_MIN_SECONDS and beats[0] < start < beats[-1]:
                drops.append([round(start, 3), round(t, 3)])
            start = None

    return {
        "bpm": round(60 / period, 3),
        "beat": round(period, 5),
        "firstDownbeat": round(first, 4),
        "beats": int(round((beats[-1] - first) / period)) + 1,
        "fitErrorMs": round(float(np.abs(beats - (offset + period * n)).max() * 1000), 1),
        "drops": drops,
    }


def parse_lyrics(text: str) -> list[dict]:
    sections = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if m := re.fullmatch(r"\[(.+)\]", line):
            sections.append({"name": m.group(1), "lines": []})
            continue
        words = []
        for part in re.split(r"(\([^)]*\))", line):
            adlib = part.startswith("(")
            for w in part.strip("()").split():
                words.append({"text": w, "adlib": adlib})
        sections[-1]["lines"].append({"text": line, "words": words})
    return sections


def norm(w: str) -> str:
    w = re.sub(r"[^a-z0-9]", "", w.lower().replace("’", "'"))
    return re.sub(r"ing$", "in", w)


def align(targets: list[dict], heard: list[dict]) -> int:
    """Give every target word s/e from the transcript. Returns the number matched exactly.

    Global alignment (Needleman-Wunsch), not difflib: difflib grabs the longest
    common block first, which pairs chorus 1 of the lyrics with chorus 2 of the
    audio and squeezes the verse in between to nothing. A misheard word in the
    right slot ("pride" for "prod") still gives timing.
    """
    a = [norm(t["text"]) for t in targets]
    b = [norm(h["w"]) for h in heard]
    sim = lambda x, y: difflib.SequenceMatcher(None, x, y).ratio()
    pair = lambda x, y: 3 if x == y else (1 if sim(x, y) >= 0.6 else -1)
    gap = -1
    score = np.zeros((len(a) + 1, len(b) + 1))
    score[:, 0] = gap * np.arange(len(a) + 1)
    score[0, :] = gap * np.arange(len(b) + 1)
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            score[i, j] = max(score[i - 1, j - 1] + pair(a[i - 1], b[j - 1]),
                              score[i - 1, j] + gap, score[i, j - 1] + gap)
    matched = 0
    i, j = len(a), len(b)
    while i > 0 and j > 0:
        if score[i, j] == score[i - 1, j - 1] + pair(a[i - 1], b[j - 1]):
            if sim(a[i - 1], b[j - 1]) >= 0.5:
                targets[i - 1].update(s=heard[j - 1]["s"], e=heard[j - 1]["e"])
                matched += a[i - 1] == b[j - 1]
            i, j = i - 1, j - 1
        elif score[i, j] == score[i - 1, j] + gap:
            i -= 1
        else:
            j -= 1

    # Fill gaps between matched words, proportionally to word length.
    i = 0
    while i < len(targets):
        if "s" in targets[i]:
            i += 1
            continue
        j = i
        while j < len(targets) and "s" not in targets[j]:
            j += 1
        lo = targets[i - 1]["e"] if i > 0 else (targets[j]["s"] - 0.3 * (j - i) if j < len(targets) else 0)
        hi = targets[j]["s"] if j < len(targets) else lo + 10
        lengths = [max(len(norm(t["text"])), 1) for t in targets[i:j]]
        # Never stretch a guess over a pause: pack it at rap pace after the previous word.
        step = min((hi - lo) / sum(lengths), SECONDS_PER_LETTER)
        t = lo
        for target, length in zip(targets[i:j], lengths):
            target.update(s=round(t, 3), e=round(t + length * step, 3), guessed=True)
            t += length * step
        i = j
    return matched


def place_adlibs(sections: list[dict], heard: list[dict]) -> int:
    """Ad-libs come right after the sung words of their line; look for them only there."""
    found = 0
    for l in (l for s in sections for l in s["lines"]):
        sung = [w for w in l["words"] if not w["adlib"]]
        t = sung[-1]["e"] if sung else 0
        for w in (w for w in l["words"] if w["adlib"]):
            hit = next((h for h in heard if t - 0.5 <= h["s"] <= t + 2.0 and norm(h["w"]) == norm(w["text"])), None)
            if hit:
                w.update(s=hit["s"], e=hit["e"])
                found += 1
            else:
                w.update(s=round(t + 0.05, 3), e=round(t + 0.4, 3), guessed=True)
            t = w["e"]
    return found


def section_refs(names: list[str]) -> list[tuple[str, str]]:
    """(ref, display name) per section: kinds that occur more than once are numbered, e.g. C1, C2."""
    kinds = [re.sub(r"\s*\d+$", "", n).strip() for n in names]
    seen: dict[str, int] = {}
    out = []
    for kind in kinds:
        seen[kind] = seen.get(kind, 0) + 1
        code = SECTION_CODES.get(kind.lower(), kind[:1].upper())
        if kinds.count(kind) > 1:
            out.append((f"{code}{seen[kind]}", f"{kind} {seen[kind]}"))
        else:
            out.append((code, kind))
    return out


def clock(t: float) -> str:
    return f"{int(t // 60)}:{t % 60:04.1f}"


def bar_ref(t: float, grid: dict) -> str:
    """T<bar>.<beat>, bar 1 beat 1 at the first downbeat; a word up to 0.15 beat early counts as on the beat."""
    i = int(np.floor((t - grid["firstDownbeat"]) / grid["beat"] + 0.15))
    return f"T{i // 4 + 1}.{i % 4 + 1}"


def write_reference(path: Path, title: str, data: dict) -> None:
    lines_all = [(sec, l) for sec in data["sections"] for l in sec["lines"]]
    T = lambda t: bar_ref(t, data)
    out = [
        f"# {title}: timing reference",
        "",
        "Generated by `song_timing.py`; do not edit by hand. Use the refs when talking about the song:",
        "",
        "- **Lines:** `C1.3` = chorus 1, line 3. Sections: " + ", ".join(
            f"`{s['ref']}` {s['name']}" for s in data["sections"]) + ".",
        f"- **Bars:** `T12.3` = bar (takt) 12, beat 3. {data['bpm']:g} BPM, one beat = {data['beat']:.3f} s, "
        f"one bar = {4 * data['beat']:.2f} s, bar 1 starts at {data['firstDownbeat']:.2f} s (the first drum beat); "
        "bars before it are numbered T0, T-1 ….",
        f"- **Drops:** `D1`–`D{len(data['drops'])}` = where the drums stop (record stops, breaks).",
        f"- **Frames** at {FPS} fps from the start of the song. `~` = some words were guessed (Whisper missed them).",
        "",
        "## Overview",
        "",
        "| Ref | Section | Time | Bars | Frames |",
        "|---|---|---|---|---|",
    ]
    for s in data["sections"]:
        out.append(f"| `{s['ref']}` | {s['name']} | {clock(s['s'])}–{clock(s['e'])} | "
                   f"{T(s['s'])}–{T(s['e'])} | {round(s['s'] * FPS)}–{round(s['e'] * FPS)} |")
    out += ["", "## Drops", "", "| Ref | Time | Bar | Length | During |", "|---|---|---|---|---|"]
    for n, (a, b) in enumerate(data["drops"], 1):
        during = next((l["ref"] for _, l in reversed(lines_all) if l["s"] <= a + 0.3), "—")
        out.append(f"| `D{n}` | {clock(a)} | {T(a)} | {b - a:.1f} s | after `{during}` |")
    for i, s in enumerate(data["sections"]):
        out += ["", f"## {s['ref']} · {s['name']} · {clock(s['s'])}–{clock(s['e'])}", "",
                "| Ref | Time | Bar | Frame | Text |", "|---|---|---|---|---|"]
        for j, l in enumerate(s["lines"]):
            guessed = " ~" if any(w.get("guessed") and not w.get("adlib") for w in l["words"]) else ""
            out.append(f"| `{l['ref']}`{guessed} | {clock(l['s'])} | {T(l['s'])} | {round(l['s'] * FPS)} | {l['text']} |")
            nxt = s["lines"][j + 1] if j + 1 < len(s["lines"]) else (
                data["sections"][i + 1]["lines"][0] if i + 1 < len(data["sections"]) else None)
            end = nxt["s"] if nxt else None
            if end is not None and end - l["e"] >= GAP_SECONDS:
                out.append(f"| | {clock(l['e'])} | {T(l['e'])} | {round(l['e'] * FPS)} | "
                           f"*instrumental, {end - l['e']:.1f} s* |")
    path.write_text("\n".join(out) + "\n")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("name", help="folder name under public/ and src/")
    ap.add_argument("--asr", action="store_true", help="re-run Whisper instead of using the cache")
    args = ap.parse_args()

    src = ROOT / "public" / args.name
    cache = ROOT / "out" / "song_timing" / args.name
    lyrics = (src / "lyrics.txt").read_text()
    prompt = " ".join(lyrics.split()[:60])

    grid = beat_grid(src / "2 Drums.mp3")
    sections = parse_lyrics(lyrics)
    words = [w for s in sections for l in s["lines"] for w in l["words"]]
    main_words = [w for w in words if not w["adlib"]]
    adlibs = [w for w in words if w["adlib"]]

    lead = transcribe(src / "0 Lead Vocals.mp3", cache / "lead.json", args.asr, prompt)
    backing = transcribe(src / "1 Backing Vocals.mp3", cache / "backing.json", args.asr, prompt)
    n_main = align(main_words, lead)
    n_adlib = place_adlibs(sections, sorted(backing + lead, key=lambda h: h["s"]))
    print(f"{grid['bpm']} BPM, first downbeat {grid['firstDownbeat']} s, {grid['beats']} beats, "
          f"grid error ≤ {grid['fitErrorMs']} ms, {len(grid['drops'])} drops")
    print(f"matched {n_main}/{len(main_words)} lyric words, {n_adlib}/{len(adlibs)} ad-libs")

    out_sections = []
    for s, (ref, name) in zip(sections, section_refs([s["name"] for s in sections])):
        lines = []
        for n, l in enumerate(s["lines"], 1):
            ws = [{k: w[k] for k in ("text", "s", "e")} | ({"adlib": True} if w["adlib"] else {})
                  | ({"guessed": True} if w.get("guessed") else {}) for w in l["words"]]
            sung = [w for w in ws if not w.get("adlib")] or ws
            lines.append({"ref": f"{ref}.{n}", "text": l["text"], "s": sung[0]["s"], "e": max(w["e"] for w in ws), "words": ws})
        out_sections.append({"ref": ref, "name": name, "s": lines[0]["s"], "e": lines[-1]["e"], "lines": lines})

    mix = next(p for p in sorted(src.glob("*.mp3")) if not p.name[0].isdigit())
    data = {"audio": f"{args.name}/{mix.name}", **grid, "sections": out_sections}
    out = ROOT / "src" / args.name / "timing.ts"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        "// Generated by song_timing.py — do not edit by hand; re-run the script instead.\n"
        "// Times are in seconds from the start of the song.\n\n"
        + TS_TYPES
        + f"export const TIMING: SongTiming = {json.dumps(data, ensure_ascii=False, indent=1)};\n"
    )
    reference = out.with_name("TIMING.md")
    write_reference(reference, mix.stem, data)
    print(f"wrote {out.relative_to(ROOT)} and {reference.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
