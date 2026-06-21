#!/usr/bin/env python3
"""
render.py — шаг 2 монтажа.

Берёт исходное видео и отредактированный keep.txt (какие куски оставить),
режет лишнее, склеивает оставшиеся куски с короткими fade, приводит к
вертикали 9:16 (1080x1920) и по желанию прожигает субтитры.

Использование:
    python render.py input.mp4
    python render.py input.mp4 --keep input.keep.txt --subs input.srt
    python render.py input.mp4 --no-vertical            # не менять формат кадра
    python render.py input.mp4 --burn-subs              # прожечь субтитры в видео
    python render.py input.mp4 --fade 0.08              # длительность fade на стыках, сек

По умолчанию ищет рядом <stem>.keep.txt и (если есть) <stem>.srt.
Результат: <stem>.final.mp4
"""

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


TS_RE = re.compile(r"(\d+):(\d{2}):(\d{2})(?:[.,](\d{1,3}))?")


def parse_ts(s: str) -> float:
    m = TS_RE.search(s)
    if not m:
        raise ValueError(f"Не понял таймкод: {s!r}")
    h, mm, ss, ms = m.groups()
    total = int(h) * 3600 + int(mm) * 60 + int(ss)
    if ms:
        total += int(ms.ljust(3, "0")) / 1000.0
    return total


def read_keep(path: Path):
    """Читаем keep.txt -> список (start, end) в секундах."""
    ranges = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # строка: START  END  # коммент
        parts = line.split("#", 1)[0].split()
        if len(parts) < 2:
            continue
        start = parse_ts(parts[0])
        end = parse_ts(parts[1])
        if end > start:
            ranges.append((start, end))
    # сортируем и склеиваем пересекающиеся
    ranges.sort()
    merged = []
    for r in ranges:
        if merged and r[0] <= merged[-1][1] + 0.01:
            merged[-1] = (merged[-1][0], max(merged[-1][1], r[1]))
        else:
            merged.append(list(r))
    return [tuple(r) for r in merged]


def run(cmd):
    print("  $ " + " ".join(str(c) for c in cmd))
    res = subprocess.run(cmd)
    if res.returncode != 0:
        sys.exit(f"Команда завершилась с ошибкой (код {res.returncode})")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("--keep", help="файл keep.txt (по умолч. <stem>.keep.txt)")
    ap.add_argument("--subs", help="файл .srt с субтитрами (по умолч. <stem>.srt)")
    ap.add_argument("--burn-subs", action="store_true", help="прожечь субтитры в кадр")
    ap.add_argument("--no-vertical", action="store_true",
                    help="НЕ приводить к 9:16 (оставить исходный кадр)")
    ap.add_argument("--fade", type=float, default=0.06,
                    help="длительность fade на стыках кусков, сек (по умолч. 0.06)")
    ap.add_argument("--out", help="имя итогового файла (по умолч. <stem>.final.mp4)")
    args = ap.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg не найден в PATH. Установи его и перезапусти PowerShell.")

    in_path = Path(args.input)
    if not in_path.exists():
        sys.exit(f"Файл не найден: {in_path}")

    stem = in_path.stem
    keep_path = Path(args.keep) if args.keep else in_path.with_name(f"{stem}.keep.txt")
    if not keep_path.exists():
        sys.exit(f"Не найден keep-файл: {keep_path}\nСначала запусти transcribe.py и отредактируй его.")

    ranges = read_keep(keep_path)
    if not ranges:
        sys.exit("В keep-файле нет ни одного диапазона. Оставь хотя бы одну строку.")
    print(f"Оставляем {len(ranges)} кусок(ов):")
    for s, e in ranges:
        print(f"  {s:8.2f}s -> {e:8.2f}s  ({e - s:.2f}s)")

    out_path = Path(args.out) if args.out else in_path.with_name(f"{stem}.final.mp4")

    # Видео-фильтр для приведения к вертикали 9:16 (заполнить и обрезать по центру)
    vf_vertical = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1"

    tmpdir = Path(tempfile.mkdtemp(prefix="vedit_"))
    try:
        # 1. Режем каждый кусок в отдельный файл (с перекодированием + fade)
        part_files = []
        for i, (start, end) in enumerate(ranges):
            dur = end - start
            part = tmpdir / f"part_{i:03d}.mp4"
            fade = min(args.fade, dur / 3) if dur > 0 else 0

            vfilters = []
            if not args.no_vertical:
                vfilters.append(vf_vertical)
            if fade > 0:
                vfilters.append(f"fade=t=in:st=0:d={fade:.3f}")
                vfilters.append(f"fade=t=out:st={dur - fade:.3f}:d={fade:.3f}")
            vf = ",".join(vfilters) if vfilters else "null"

            af = "anull"
            if fade > 0:
                af = (f"afade=t=in:st=0:d={fade:.3f},"
                      f"afade=t=out:st={dur - fade:.3f}:d={fade:.3f}")

            cmd = [
                "ffmpeg", "-y",
                "-ss", f"{start:.3f}", "-to", f"{end:.3f}", "-i", str(in_path),
                "-vf", vf, "-af", af,
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                "-c:a", "aac", "-b:a", "192k",
                "-r", "30", "-pix_fmt", "yuv420p",
                str(part),
            ]
            run(cmd)
            part_files.append(part)

        # 2. Склеиваем куски
        concat_list = tmpdir / "list.txt"
        concat_list.write_text(
            "".join(f"file '{p.as_posix()}'\n" for p in part_files),
            encoding="utf-8",
        )
        joined = tmpdir / "joined.mp4"
        run(["ffmpeg", "-y", "-f", "concat", "-safe", "0",
             "-i", str(concat_list), "-c", "copy", str(joined)])

        # 3. (По желанию) прожигаем субтитры
        if args.burn_subs:
            subs_path = Path(args.subs) if args.subs else in_path.with_name(f"{stem}.srt")
            if not subs_path.exists():
                sys.exit(f"Не найден файл субтитров: {subs_path}")
            print("ВНИМАНИЕ: субтитры здесь прожигаются по ИСХОДНЫМ таймкодам.")
            print("Если ты резал куски — таймкоды субтитров уедут. Для точных субтитров")
            print("лучше перераспознать УЖЕ смонтированный файл (см. README, раздел 'Субтитры').")
            # стиль: крупный, по центру снизу, белый с чёрной обводкой
            style = ("FontName=Arial,FontSize=14,PrimaryColour=&H00FFFFFF,"
                     "OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,"
                     "Alignment=2,MarginV=120")
            # ffmpeg subtitles filter требует относительный путь/экранирование на Windows
            subs_arg = subs_path.name
            run([
                "ffmpeg", "-y", "-i", str(joined),
                "-vf", f"subtitles={subs_arg}:force_style='{style}'",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
                "-c:a", "copy", str(out_path),
            ])
        else:
            shutil.copy(joined, out_path)

        print(f"\nГотово! Итоговый файл: {out_path}")
        print("Проверь стыки и звук. Если где-то рывок — увеличь --fade (напр. 0.1).")
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


if __name__ == "__main__":
    main()
