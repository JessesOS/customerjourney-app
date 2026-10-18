#!/usr/bin/env python3
"""Render the voice-interview questions to audio, one clip per question.

Reads every step's `interview` questions from the product files (products/<id>/,
through scripts/products/voice-sources.ts) and renders each question to m4a in
public/portal/voice/. Filenames are the contract with VoiceInterview.tsx:
interview-<step id>-<question number>.m4a. Audio is keyed by step id, so a
custom product that changes an inherited interview uses a new step id.
Replacing these files with another voice needs no code change.

Voice: Fish Audio library voice "Australian" (calm, gentle Australian woman;
audition file w5-calm-gentle) — Jesse's pick 2026-10-11 from a 32-voice
audition (motion/voice-audition/). Before it: "Jack",
4c26db2c00a346f687aa8ed984c418b5.
Needs FISH_API_KEY in .env.local (gitignored). Costs a fraction of a cent
per run. To change the voice, swap FISH_VOICE_ID for another model id from
fish.audio. `--free` renders with edge-tts instead (the stage guide's Sonia
voice, no key, no cost).

Re-run whenever a question's wording changes, or the clip and the text on
screen will disagree.

Usage: python3 scripts/generate-interview-voice.py [--free] [--step <step id>]   (needs ffmpeg; --free needs edge-tts)
       --step renders only that step's clips (e.g. --step bssc-questions), leaving the others as they are
       python3 scripts/generate-interview-voice.py --list   print "<file>\t<text>" per clip, sorted; no TTS, network or ffmpeg
"""
import asyncio
import json
import pathlib
import subprocess
import sys
import tempfile
import urllib.request

FISH_VOICE_ID = "1ac1da8f595841fe9ca8b5cb464364f8"  # "Australian": calm, gentle woman
FISH_MODEL = "s1"
EDGE_VOICE = "en-GB-SoniaNeural"
EDGE_RATE = "-4%"
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "portal" / "voice"
FREE = "--free" in sys.argv

def sources() -> dict:
    """{guides: [...], interviews: [{file, text}]} from the product files (Scale ob-0, Respond rsp-000, BSS bss-001...)."""
    out = subprocess.run(["npx", "tsx", "scripts/products/voice-sources.ts"], cwd=ROOT, capture_output=True, text=True)
    if out.returncode != 0:
        raise SystemExit(out.stderr.strip() or "scripts/products/voice-sources.ts failed")
    return json.loads(out.stdout)

def fish_key() -> str:
    env = ROOT / ".env.local"
    for line in env.read_text().splitlines() if env.exists() else []:
        if line.startswith("FISH_API_KEY="):
            return line.split("=", 1)[1].strip().strip("\"'")
    raise SystemExit("FISH_API_KEY is not set in .env.local (or run with --free)")

def fish_tts(text: str, target: pathlib.Path, key: str) -> None:
    req = urllib.request.Request(
        "https://api.fish.audio/v1/tts",
        data=json.dumps({"text": text, "reference_id": FISH_VOICE_ID, "format": "mp3"}).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "model": FISH_MODEL},
    )
    with urllib.request.urlopen(req, timeout=120) as res:
        target.write_bytes(res.read())

async def edge(text: str, target: pathlib.Path) -> None:
    import edge_tts
    await edge_tts.Communicate(text.replace("AI ", "A.I. "), voice=EDGE_VOICE, rate=EDGE_RATE).save(str(target))

def clips() -> list[tuple[str, str]]:
    """(file name, question) for every interview clip, sorted by file name."""
    return sorted((c["file"], c["text"]) for c in sources()["interviews"])

def list_clips() -> None:
    for name, text in clips():
        print(f"{name}\t{text}")

def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rows = clips()
    if "--step" in sys.argv:
        step = sys.argv[sys.argv.index("--step") + 1]
        rows = [(name, q) for name, q in rows if name.startswith(f"interview-{step}-")]
    if not rows:
        raise SystemExit("no interview questions found in the product files")
    key = None if FREE else fish_key()
    for name, q in rows:
        target = OUT / name
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            mp3 = pathlib.Path(tmp.name)
        if FREE:
            asyncio.run(edge(q, mp3))
        else:
            fish_tts(q, mp3, key)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), "-c:a", "aac", "-b:a", "64k", "-ac", "1", str(target)], check=True)
        mp3.unlink(missing_ok=True)
        print(f"{target.name}: {target.stat().st_size // 1024} KB  {q}")
    print("done")

if "--list" in sys.argv:
    list_clips()
else:
    main()
