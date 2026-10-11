#!/usr/bin/env python3
"""Render the voice-interview questions to audio, one clip per question.

Reads every `interview: [...]` list out of lib/onboardingJourney.ts (single
source of truth) and renders each question with edge-tts in the same voice as
the stage guide (see scripts/generate-voice.py), transcoded to m4a in
public/portal/voice/. Filenames are the contract with VoiceInterview.tsx:
interview-<milestone id>-<question number>.m4a. Replacing these files with
another voice (e.g. Jesse's, via Fish Audio) needs no code change.

Re-run whenever a question's wording changes, or the clip and the text on
screen will disagree.

Usage: python3 scripts/generate-interview-voice.py   (needs: pip3 install edge-tts, ffmpeg)
"""
import asyncio
import pathlib
import re
import subprocess
import tempfile

import edge_tts

VOICE = "en-GB-SoniaNeural"
RATE = "-4%"
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "portal" / "voice"

src = (ROOT / "lib" / "onboardingJourney.ts").read_text()

async def render(text: str, target: pathlib.Path) -> None:
    spoken = text.replace("AI ", "A.I. ")
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        await edge_tts.Communicate(spoken, voice=VOICE, rate=RATE).save(tmp.name)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name, "-c:a", "aac", "-b:a", "64k", "-ac", "1", str(target)],
            check=True,
        )
    pathlib.Path(tmp.name).unlink(missing_ok=True)

async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    found = re.findall(r'id: "([\w-]+)",(?:(?!\bid: ").)*?interview: \[(.*?)\]', src, re.S)
    if not found:
        raise SystemExit("no interview lists found in lib/onboardingJourney.ts")
    for milestone_id, block in found:
        questions = re.findall(r'"((?:[^"\\]|\\.)*)"', block)
        for n, q in enumerate(questions, 1):
            target = OUT / f"interview-{milestone_id}-{n}.m4a"
            await render(q, target)
            print(f"{target.name}: {target.stat().st_size // 1024} KB  {q}")
    print("done")

asyncio.run(main())
