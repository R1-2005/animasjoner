#!/usr/bin/env python3
"""Generate voice-over from text files with Gemini TTS on Vertex AI.

Reads tts_texts/<name>.txt and writes tts_sound/<name>.mp3 (or .wav).

  python3 tts.py scene_0              # one file (".txt" optional)
  python3 tts.py scene_0 scene_1      # several
  python3 tts.py --all                # every text without a sound file yet
  python3 tts.py --all --force        # regenerate everything
  python3 tts.py scene_0 --format wav
  python3 tts.py scene_0 --style "Les rolig og litt tørrvittig:"

Needs the environment variable VERTEX_API_KEY. Uses only the standard library;
MP3 encoding uses ffmpeg (system ffmpeg, or the one bundled with Remotion).
"""

import argparse
import base64
import json
import os
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
VOICE = "Callirrhoe"
LANGUAGE = "nb-NO"  # Norwegian Bokmål
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
    parser.add_argument("--voice", default=VOICE)
    parser.add_argument("--model", default=MODEL)
    parser.add_argument("--language", default=LANGUAGE)
    parser.add_argument("--style", help="instruction placed before the text, e.g. 'Les rolig:'")
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
        text = text_path.read_text(encoding="utf-8").strip()
        if args.style:
            text = f"{args.style}\n{text}"
        print(f"tts    {text_path.relative_to(ROOT)} ...", flush=True)
        pcm = synthesize(text, args.model, args.voice, args.language)
        (write_mp3 if args.format == "mp3" else write_wav)(pcm, out)
        seconds = len(pcm) / (2 * SAMPLE_RATE)
        print(f"wrote  {out.relative_to(ROOT)} ({duration(seconds)})")
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
