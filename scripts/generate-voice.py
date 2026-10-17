#!/usr/bin/env python3
"""Regenerate the per-stage voice-guide audio from the product files.

Reads every product's voice guide (portal.voiceGuide in products/<id>/, e.g.
products/scale/portal.ts) through scripts/products/voice-sources.ts, renders
each script with edge-tts (Microsoft neural voices, free — no key), and
transcodes to m4a in public/portal/voice/<audioPrefix>-<stage>.m4a. The
filenames are the contract with the product's audioPrefix — replacing these
files with branded VO (ElevenLabs or recorded) needs no code change.

Voice: en-GB-SoniaNeural — Jesse's pick 2026-08-05 (auditioned against
steady-tuned Natasha AU and Jenny US). Brief for a future ElevenLabs
upgrade: "William's steadiness, female".

Usage: python3 scripts/generate-voice.py   (needs: pip3 install edge-tts, ffmpeg, and npm install for tsx)
       python3 scripts/generate-voice.py --list   print "<file>\t<text>" per clip, sorted; no TTS, network or ffmpeg
"""
import asyncio
import json
import pathlib
import subprocess
import sys
import tempfile

VOICE = "en-GB-SoniaNeural"
RATE = "-4%"  # a touch slower than default for warmth
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "portal" / "voice"

def sources() -> dict:
    """{guides: [{file, text}], interviews: [...]} from the product files."""
    out = subprocess.run(["npx", "tsx", "scripts/products/voice-sources.ts"], cwd=ROOT, capture_output=True, text=True)
    if out.returncode != 0:
        raise SystemExit(out.stderr.strip() or "scripts/products/voice-sources.ts failed")
    return json.loads(out.stdout)

async def render(text: str, target: pathlib.Path) -> None:
    import edge_tts  # only needed to render, not for --list

    # "AI" reads better spelled out for TTS.
    spoken = text.replace("AI ", "A.I. ")
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        await edge_tts.Communicate(spoken, voice=VOICE, rate=RATE).save(tmp.name)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name, "-c:a", "aac", "-b:a", "64k", "-ac", "1", str(target)],
            check=True,
        )
    pathlib.Path(tmp.name).unlink(missing_ok=True)

def clips() -> list[tuple[str, str]]:
    """(file name, text) for every voice-guide clip, sorted by file name."""
    return sorted((c["file"], c["text"]) for c in sources()["guides"])

if "--list" in sys.argv:
    for name, text in clips():
        print(f"{name}\t{text}")
    raise SystemExit(0)

async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, text in clips():
        target = OUT / name
        await render(text, target)
        print(f"{target.name}: {target.stat().st_size // 1024} KB")
    print("done")

asyncio.run(main())
