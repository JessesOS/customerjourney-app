#!/usr/bin/env python3
"""Regenerate the per-stage voice-guide audio from lib/stageGuide.ts.

Parses the script maps out of the TS file (single source of truth), renders
each line with edge-tts (Microsoft neural voices, free — no key), and
transcodes to m4a in public/portal/voice/. The filenames are the contract
with lib/stageGuide.ts — replacing these files with branded VO (ElevenLabs
or recorded) needs no code change.

Voice: en-GB-SoniaNeural — Jesse's pick 2026-08-05 (auditioned against
steady-tuned Natasha AU and Jenny US). Brief for a future ElevenLabs
upgrade: "William's steadiness, female".

Usage: python3 scripts/generate-voice.py   (needs: pip3 install edge-tts)
"""
import asyncio
import pathlib
import re
import subprocess
import tempfile

import edge_tts

VOICE = "en-GB-SoniaNeural"
RATE = "-4%"  # a touch slower than default for warmth
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "portal" / "voice"

src = (ROOT / "lib" / "stageGuide.ts").read_text()

def parse_map(name: str) -> dict[str, str]:
    block = re.search(rf"const {name}: Record<string, string> = \{{(.*?)\n\}};", src, re.S)
    if not block:
        raise SystemExit(f"could not find {name} in lib/stageGuide.ts")
    return {
        key.strip('"'): text
        for key, text in re.findall(r'\n  "?([\w-]+)"?:\s*\n?\s*"((?:[^"\\]|\\.)*)"', block.group(1))
    }

async def render(text: str, target: pathlib.Path) -> None:
    # "AI" reads better spelled out for TTS.
    spoken = text.replace("AI ", "A.I. ")
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        await edge_tts.Communicate(spoken, voice=VOICE, rate=RATE).save(tmp.name)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name, "-c:a", "aac", "-b:a", "64k", "-ac", "1", str(target)],
            check=True,
        )
    pathlib.Path(tmp.name).unlink(missing_ok=True)

async def main() -> None:
    maps = {"scale": parse_map("scaleScripts"), "respond": parse_map("respondScripts")}
    OUT.mkdir(parents=True, exist_ok=True)
    for prefix, scripts in maps.items():
        for stage_id, text in scripts.items():
            target = OUT / f"{prefix}-{stage_id}.m4a"
            await render(text, target)
            print(f"{target.name}: {target.stat().st_size // 1024} KB")
    print("done")

asyncio.run(main())
