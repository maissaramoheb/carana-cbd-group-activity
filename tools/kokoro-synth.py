#!/usr/bin/env python3
"""
Local Kokoro-82M ONNX neural speech synthesis helper for CARANA CBD.
Supports single-shot synthesis (--text --out) and batch JSONL synthesis (--batch JSONL).
Used offline during audio asset preparation or via local authenticated loopback /api/tts.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
from concurrent.futures import ProcessPoolExecutor
import soundfile as sf
from kokoro_onnx import Kokoro


def to_mp3(wav_path: str, mp3_path: str, bitrate: str = "24k") -> None:
    os.makedirs(os.path.dirname(os.path.abspath(mp3_path)), exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            wav_path,
            "-ac",
            "1",
            "-ar",
            "24000",
            "-b:a",
            bitrate,
            mp3_path,
        ],
        check=True,
    )


def _synth_worker(task: tuple) -> int:
    model_path, voices_path, voice, speed, out_dir, bitrate, entries = task
    kokoro = Kokoro(model_path, voices_path)
    done = 0
    with tempfile.TemporaryDirectory() as tmp:
        wav_path = os.path.join(tmp, "tmp.wav")
        for entry in entries:
            h = entry["hash"]
            mp3_path = os.path.join(out_dir, "clips", f"{h}.mp3")
            if os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 512:
                done += 1
                continue
            v = entry.get("voice") or voice
            samples, sr = kokoro.create(entry["spoken"], voice=v, speed=speed, lang="en-us")
            sf.write(wav_path, samples, sr)
            to_mp3(wav_path, mp3_path, bitrate)
            done += 1
    return done


def main() -> None:
    parser = argparse.ArgumentParser(description="Synthesize natural neural narration via Kokoro-82M.")
    parser.add_argument("--model", required=True, help="Path to kokoro-v1.0.int8.onnx")
    parser.add_argument("--voices", required=True, help="Path to voices-v1.0.bin")
    parser.add_argument("--voice", default="af_heart", help="Kokoro voice ID")
    parser.add_argument("--speed", type=float, default=1.0, help="Synthesis speed factor")
    parser.add_argument("--text", help="Single text string to synthesize")
    parser.add_argument("--out", help="Output .wav or .mp3 path for single synthesis")
    parser.add_argument("--batch", help="JSONL file with {id, hash, spoken, raw, voice} entries")
    parser.add_argument("--out-dir", help="Output directory for batch MP3 clips")
    parser.add_argument("--bitrate", default="24k", help="Target MP3 bitrate (default: 24k)")
    parser.add_argument("--workers", type=int, default=4, help="Parallel worker processes for batch")
    parser.add_argument("--serve-stdio", action="store_true", help="Keep Kokoro loaded and synthesize JSON lines over stdin/stdout")
    args = parser.parse_args()

    if args.serve_stdio:
        kokoro = Kokoro(args.model, args.voices)
        print(json.dumps({"ready": True}), flush=True)
        for line in sys.stdin:
            raw = line.strip()
            if not raw:
                continue
            try:
                req = json.loads(raw)
                out_path = req["out"]
                text = req["text"]
                voice = req.get("voice") or args.voice
                speed = float(req.get("speed") or args.speed)
                samples, sr = kokoro.create(text, voice=voice, speed=speed, lang="en-us")
                os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
                sf.write(out_path, samples, sr)
                print(json.dumps({"ok": True, "out": out_path}), flush=True)
            except Exception as exc:
                print(json.dumps({"ok": False, "error": str(exc)}), flush=True)
        return

    if args.batch:
        if not args.out_dir:
            raise SystemExit("--out-dir is required with --batch")
        clips_dir = os.path.join(args.out_dir, "clips")
        os.makedirs(clips_dir, exist_ok=True)
        manifest = {"version": 1, "engine": "kokoro-82m-int8", "voice": args.voice, "license": "Apache-2.0", "clips": {}}
        with open(args.batch, "r", encoding="utf-8") as fh:
            entries = [json.loads(line) for line in fh if line.strip()]
        for entry in entries:
            manifest["clips"][entry["hash"]] = f"clips/{entry['hash']}.mp3"

        workers = max(1, min(args.workers, len(entries)))
        shards = [entries[i::workers] for i in range(workers)]
        tasks = [(args.model, args.voices, args.voice, args.speed, args.out_dir, args.bitrate, s) for s in shards if s]
        total_done = 0
        with ProcessPoolExecutor(max_workers=workers) as pool:
            for count in pool.map(_synth_worker, tasks):
                total_done += count
                print(f"Worker completed {count} clips ({total_done}/{len(entries)})", file=sys.stderr, flush=True)

        manifest_path = os.path.join(args.out_dir, "manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as mf:
            json.dump(manifest, mf, separators=(",", ":"))
        print(f"Wrote {len(manifest['clips'])} clips and {manifest_path}")
        return

    if not args.text or not args.out:
        raise SystemExit("Provide either --batch or both --text and --out")

    kokoro = Kokoro(args.model, args.voices)
    samples, sr = kokoro.create(args.text, voice=args.voice, speed=args.speed, lang="en-us")
    if args.out.endswith(".mp3"):
        with tempfile.TemporaryDirectory() as tmp:
            wav_path = os.path.join(tmp, "tmp.wav")
            sf.write(wav_path, samples, sr)
            to_mp3(wav_path, args.out, args.bitrate)
    else:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        sf.write(args.out, samples, sr)


if __name__ == "__main__":
    main()
