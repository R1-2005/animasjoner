#!/usr/bin/env python3
"""Generate voice-over from text files with Gemini TTS on Vertex AI.

Reads tts_texts/<name>.txt and writes tts_sound/<name>.mp3 (or .wav).

  python3 tts.py scene_0              # one file (".txt" optional)
  python3 tts.py scene_0 scene_1      # several
  python3 tts.py --all                # every text without a sound file yet
  python3 tts.py --all --force        # regenerate everything
  python3 tts.py scene_0 --format wav
  python3 tts.py scene_0 --style "Les rolig og litt tørrvittig:"   # replaces STYLE
  python3 tts.py scene_0 --style ""                               # no style
  python3 tts.py scene_0 --speed 1.0                              # original pace

A text file can be SSML (wrapped in <speak>...</speak>) to control pauses:

  <speak>
    Velkommen. <break time="2s"/> La oss gå rett på.
  </speak>

The model only treats <break> as a hint (3 s came out as 2.4 s), so the script
does the pauses itself: the text is split at every <break>, each part is spoken
separately with its own silence at the ends trimmed, and the parts are joined
with exactly the requested silence. time="500ms" or "1.5s"; without time,
strength="weak|medium|strong|x-strong" (0.25/0.5/1/2 s, medium is default).
Other SSML tags are removed; Gemini's own tags such as [sigh] are passed on.

A file can start with a voice header that sets voice and speed for that file:

  <voice tempo="1.1">Alnilam</voice>
  <speak> ... </speak>

Both parts are optional (<voice tempo="1.05"></voice> keeps the default voice).
Precedence: --voice/--speed on the command line, then the header, then VOICE/SPEED.

Needs the environment variable VERTEX_API_KEY. Uses only the standard library;
MP3 encoding uses ffmpeg (system ffmpeg, or the one bundled with Remotion).
"""

import argparse
import array
import base64
import html
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEXT_DIR = ROOT / "tts_texts"
SOUND_DIR = ROOT / "tts_sound"

MODEL = "gemini-3.1-flash-tts-preview"
VOICE = "Alnilam"
LANGUAGE = "nb-NO"  # Norwegian Bokmål
# The TTS model rejects systemInstruction, so the direction goes in front of the
# text instead. The model follows it without reading it aloud (checked by
# transcribing the output).
STYLE = "Les følgende tekst på norsk bokmål, med en klar, informerende stemme:"
# Speed-up of the speech (not the pauses), done with ffmpeg's atempo so the pitch
# stays the same. Asking for a faster pace in STYLE overshoots (about 30 % faster
# for "litt raskere tempo"), so fine adjustment is done here.
SPEED = 1.1
SAMPLE_RATE = 24000  # the API returns 16-bit mono PCM at 24 kHz


def synthesize(text: str, model: str, voice: str, language: str) -> bytes:
    """Return raw 16-bit PCM for the text."""
    key = os.environ.get("VERTEX_API_KEY")
    if not key:
        sys.exit("VERTEX_API_KEY is not set")
    url = (
        "https://aiplatform.googleapis.com/v1/publishers/google/models/"
        f"{model}:generateContent?key={key}"
    )
    body = {
        "contents": [{"role": "user", "parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "languageCode": language,
                "voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}},
            },
        },
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(request, timeout=300) as response:
            result = json.load(response)
    except urllib.error.HTTPError as e:
        sys.exit(f"Vertex AI error {e.code}: {e.read().decode(errors='replace')}")

    parts = result["candidates"][0]["content"]["parts"]
    return b"".join(base64.b64decode(p["inlineData"]["data"]) for p in parts if "inlineData" in p)


BREAK = re.compile(r"<break\b([^>]*)/?>", re.IGNORECASE)
STRENGTH = {"none": 0, "x-weak": 0.1, "weak": 0.25, "medium": 0.5, "strong": 1.0, "x-strong": 2.0}


def break_seconds(attributes: str) -> float:
    time = re.search(r'time\s*=\s*"([\d.]+)\s*(ms|s)"', attributes)
    if time:
        value = float(time.group(1))
        return value / 1000 if time.group(2) == "ms" else value
    strength = re.search(r'strength\s*=\s*"([\w-]+)"', attributes)
    return STRENGTH.get(strength.group(1) if strength else "medium", 0.5)


def parse_ssml(ssml: str) -> list[str | float]:
    """Split SSML into spoken text and pauses (seconds), in order."""
    pieces: list[str | float] = []
    position = 0
    for match in list(BREAK.finditer(ssml)) + [None]:
        end = match.start() if match else len(ssml)
        chunk = re.sub(r"</?(p|s)\b[^>]*>", "\n", ssml[position:end])
        chunk = html.unescape(re.sub(r"<[^>]+>", " ", chunk))
        chunk = re.sub(r"[ \t]+", " ", chunk).strip()
        if chunk:
            pieces.append(chunk)
        if match:
            pieces.append(break_seconds(match.group(1)))
            position = match.end()
    return pieces


MARGIN = 0.05  # seconds of near-silence kept at each end of a spoken part


def trim_silence(pcm: bytes, threshold: int = 300, keep: float = MARGIN) -> bytes:
    """Remove silence at both ends, keeping a short margin so nothing is clipped."""
    samples = array.array("h", pcm)
    loud = [i for i, s in enumerate(samples) if abs(s) > threshold]
    if not loud:
        return b""
    margin = int(keep * SAMPLE_RATE)
    start = max(0, loud[0] - margin)
    end = min(len(samples), loud[-1] + margin)
    return samples[start:end].tobytes()


def silence(seconds: float) -> bytes:
    return bytes(2 * int(seconds * SAMPLE_RATE))


def change_tempo(pcm: bytes, factor: float) -> bytes:
    if factor == 1.0 or not pcm:
        return pcm
    raw = ["-f", "s16le", "-ar", str(SAMPLE_RATE), "-ac", "1"]
    # Remotion's slim ffmpeg cannot write raw PCM, so it writes WAV and the header is dropped.
    cmd = ffmpeg_command() + [
        "-loglevel", "error", *raw, "-i", "pipe:0",
        "-filter:a", f"atempo={factor}", "-c:a", "pcm_s16le", "-f", "wav", "pipe:1",
    ]
    out = subprocess.run(cmd, input=pcm, capture_output=True, check=True, cwd=ROOT).stdout
    data = out.find(b"data", 12)
    return out[data + 8 :]


VOICE_HEADER = re.compile(r"\s*<voice\b([^>]*)>(.*?)</voice>", re.IGNORECASE | re.DOTALL)


def parse_voice_header(source: str) -> tuple[str | None, float | None, str]:
    """Split off a leading <voice tempo="1.1">Name</voice>. Returns voice, tempo, rest."""
    match = VOICE_HEADER.match(source)
    if not match:
        return None, None, source
    tempo = re.search(r'tempo\s*=\s*"([\d.]+)"', match.group(1))
    return match.group(2).strip() or None, float(tempo.group(1)) if tempo else None, source[match.end():].strip()


def speak(source: str, style: str, model: str, voice: str, language: str, speed: float) -> tuple[bytes, int]:
    """Plain text: one request. SSML: one request per part between breaks.
    Returns the PCM and the number of pauses inserted."""
    prefix = f"{style}\n" if style else ""
    if not source.lstrip().lower().startswith("<speak"):
        return change_tempo(synthesize(prefix + source, model, voice, language), speed), 0
    pcm = b""
    pauses = 0
    for piece in parse_ssml(source):
        if isinstance(piece, float):
            pcm += silence(max(0.0, piece - 2 * MARGIN))  # margins count towards the pause
            pauses += 1
        else:
            pcm += change_tempo(trim_silence(synthesize(prefix + piece, model, voice, language)), speed)
    return pcm, pauses


def write_wav(pcm: bytes, path: Path) -> None:
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(pcm)


def ffmpeg_command() -> list[str]:
    if shutil.which("ffmpeg"):
        return ["ffmpeg"]
    return ["npx", "--no-install", "remotion", "ffmpeg"]


def write_mp3(pcm: bytes, path: Path) -> None:
    cmd = ffmpeg_command() + [
        "-y", "-loglevel", "error",
        "-f", "s16le", "-ar", str(SAMPLE_RATE), "-ac", "1", "-i", "pipe:0",
        "-codec:a", "libmp3lame", "-b:a", "128k",
        str(path),
    ]
    subprocess.run(cmd, input=pcm, check=True, cwd=ROOT)


def duration(seconds: float) -> str:
    minutes, rest = divmod(round(seconds, 1), 60)
    return f"{int(minutes)}:{rest:04.1f}"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("names", nargs="*", help="text files in tts_texts/ (with or without .txt)")
    parser.add_argument("--all", action="store_true", help="every .txt in tts_texts/")
    parser.add_argument("--force", action="store_true", help="overwrite existing sound files")
    parser.add_argument("--format", choices=["mp3", "wav"], default="mp3")
    parser.add_argument("--voice", help=f"overrides the file's <voice> header (default: {VOICE})")
    parser.add_argument("--model", default=MODEL)
    parser.add_argument("--language", default=LANGUAGE)
    parser.add_argument("--style", default=STYLE, help="direction placed before the text (default: STYLE)")
    parser.add_argument("--speed", type=float, help=f"tempo factor 0.5-2, overrides the file's header (default: {SPEED})")
    args = parser.parse_args()

    if args.all:
        texts = sorted(TEXT_DIR.glob("*.txt"))
    else:
        texts = [TEXT_DIR / (n if n.endswith(".txt") else f"{n}.txt") for n in args.names]
    if not texts:
        parser.error("name one or more text files, or use --all")

    SOUND_DIR.mkdir(exist_ok=True)
    generated: list[tuple[str, float]] = []
    for text_path in texts:
        if not text_path.is_file():
            sys.exit(f"Not found: {text_path.relative_to(ROOT)}")
        out = SOUND_DIR / f"{text_path.stem}.{args.format}"
        if out.exists() and not args.force:
            print(f"skip   {out.relative_to(ROOT)} (exists, use --force)")
            continue
        file_voice, file_speed, source = parse_voice_header(text_path.read_text(encoding="utf-8").strip())
        voice = args.voice or file_voice or VOICE
        speed = args.speed or file_speed or SPEED
        if not 0.5 <= speed <= 2.0:
            sys.exit(f"Speed {speed} in {text_path.name} is outside 0.5-2")
        print(f"tts    {text_path.relative_to(ROOT)} (voice {voice}, tempo {speed:g}) ...", flush=True)
        pcm, pauses = speak(source, args.style, args.model, voice, args.language, speed)
        (write_mp3 if args.format == "mp3" else write_wav)(pcm, out)
        seconds = len(pcm) / (2 * SAMPLE_RATE)
        note = f", {pauses} pause{'s' if pauses != 1 else ''}" if pauses else ""
        print(f"wrote  {out.relative_to(ROOT)} ({duration(seconds)}{note})")
        generated.append((str(out.relative_to(ROOT)), seconds))

    if generated:
        width = max(len(name) for name, _ in generated)
        print("\nLength (m:ss):")
        for name, seconds in generated:
            print(f"  {name:<{width}}  {duration(seconds):>7}")
        if len(generated) > 1:
            total = sum(seconds for _, seconds in generated)
            print(f"  {'total':<{width}}  {duration(total):>7}")


if __name__ == "__main__":
    main()
