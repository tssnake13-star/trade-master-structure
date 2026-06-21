#!/usr/bin/env python3
"""
transcribe.py — шаг 1 монтажа.

Что делает:
  1. Достаёт звук из видео и распознаёт речь через faster-whisper.
  2. Сохраняет:
       - transcript.txt   — читаемый текст с таймкодами (для просмотра/правки)
       - transcript.json  — сегменты + слова с таймкодами (для render.py)
       - subs.srt         — субтитры (можно прожечь в видео на шаге render)
       - keep.txt         — ЗАГОТОВКА списка «что оставить» (все сегменты),
                            с пометкой [?ПОВТОР] на кандидатах-дублях.
  3. Ищет повторяющиеся куски (когда фразу проговорили дважды) и помечает их,
     чтобы их легко было удалить вручную в keep.txt.

Использование:
    python transcribe.py input.mp4
    python transcribe.py input.mp4 --model small --lang ru

Модели (точность/скорость): tiny < base < small < medium < large-v3
Для русского обычно хватает "small" или "medium".
"""

import argparse
import json
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path


def fmt_ts(seconds: float) -> str:
    """Секунды -> ЧЧ:ММ:СС.ммм"""
    ms = int(round((seconds - int(seconds)) * 1000))
    s = int(seconds)
    h, s = divmod(s, 3600)
    m, s = divmod(s, 60)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def srt_ts(seconds: float) -> str:
    """Секунды -> ЧЧ:ММ:СС,ммм (формат SRT)"""
    return fmt_ts(seconds).replace(".", ",")


def normalize(text: str) -> str:
    """Нормализуем текст для сравнения на повторы."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text)
    return text


def find_repeats(segments, threshold: float = 0.75):
    """
    Ищем соседние/близкие сегменты с похожим текстом — кандидаты-дубли
    (когда отрезок переснимали). Возвращаем множество индексов более раннего
    (обычно неудачного) дубля — их предлагаем удалить.
    """
    repeat_idx = set()
    n = len(segments)
    for i in range(n):
        a = normalize(segments[i]["text"])
        if len(a) < 8:  # слишком короткое, чтобы судить
            continue
        # сравниваем с несколькими следующими сегментами (дубль идёт рядом)
        for j in range(i + 1, min(i + 5, n)):
            b = normalize(segments[j]["text"])
            if len(b) < 8:
                continue
            ratio = SequenceMatcher(None, a, b).ratio()
            if ratio >= threshold:
                # помечаем более РАННИЙ как кандидат на удаление
                repeat_idx.add(i)
                break
    return repeat_idx


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", help="входной видеофайл (mp4/mov/...)")
    ap.add_argument("--model", default="small",
                    help="модель whisper: tiny/base/small/medium/large-v3 (по умолч. small)")
    ap.add_argument("--lang", default="ru", help="язык речи (по умолч. ru)")
    ap.add_argument("--repeat-threshold", type=float, default=0.75,
                    help="порог похожести для поиска повторов 0..1 (по умолч. 0.75)")
    args = ap.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        print(f"Файл не найден: {in_path}", file=sys.stderr)
        sys.exit(1)

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("Не установлен faster-whisper. Поставь:  pip install faster-whisper",
              file=sys.stderr)
        sys.exit(1)

    print(f"Загружаю модель '{args.model}' (первый раз скачается автоматически)...")
    # int8 — быстро и без видеокарты; если есть GPU, можно device='cuda'
    model = WhisperModel(args.model, device="cpu", compute_type="int8")

    print("Распознаю речь... (это может занять время на длинном видео)")
    segments_iter, info = model.transcribe(
        str(in_path),
        language=args.lang,
        word_timestamps=True,
        vad_filter=True,  # отсекает длинные паузы/тишину
    )

    segments = []
    for seg in segments_iter:
        words = []
        if seg.words:
            for w in seg.words:
                words.append({"start": w.start, "end": w.end, "word": w.word})
        segments.append({
            "start": seg.start,
            "end": seg.end,
            "text": seg.text.strip(),
            "words": words,
        })
        print(f"  [{fmt_ts(seg.start)} -> {fmt_ts(seg.end)}] {seg.text.strip()}")

    if not segments:
        print("Речь не распознана. Проверь, что в видео есть звук.", file=sys.stderr)
        sys.exit(1)

    repeats = find_repeats(segments, args.repeat_threshold)

    stem = in_path.stem
    out_dir = in_path.parent

    # transcript.json (для render.py)
    json_path = out_dir / f"{stem}.transcript.json"
    json_path.write_text(json.dumps({
        "input": in_path.name,
        "language": args.lang,
        "segments": segments,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    # transcript.txt (читаемый)
    txt_path = out_dir / f"{stem}.transcript.txt"
    with txt_path.open("w", encoding="utf-8") as f:
        for i, seg in enumerate(segments):
            mark = "  [?ПОВТОР]" if i in repeats else ""
            f.write(f"#{i:03d} {fmt_ts(seg['start'])} -> {fmt_ts(seg['end'])}{mark}\n")
            f.write(f"     {seg['text']}\n\n")

    # subs.srt
    srt_path = out_dir / f"{stem}.srt"
    with srt_path.open("w", encoding="utf-8") as f:
        for i, seg in enumerate(segments, 1):
            f.write(f"{i}\n")
            f.write(f"{srt_ts(seg['start'])} --> {srt_ts(seg['end'])}\n")
            f.write(f"{seg['text']}\n\n")

    # keep.txt — заготовка решения: какие сегменты оставить.
    # Удали строки, которые не нужны (особенно помеченные [?ПОВТОР]).
    keep_path = out_dir / f"{stem}.keep.txt"
    with keep_path.open("w", encoding="utf-8") as f:
        f.write("# СПИСОК «ЧТО ОСТАВИТЬ». Удали ненужные строки и сохрани файл.\n")
        f.write("# Формат строки:  начало  конец  # текст\n")
        f.write("# Строки с [?ПОВТОР] — кандидаты-дубли, скорее всего их надо удалить.\n")
        f.write("# Можно вручную подвинуть таймкоды (формат ЧЧ:ММ:СС.ммм).\n\n")
        for i, seg in enumerate(segments):
            mark = "   # [?ПОВТОР]" if i in repeats else "   #"
            f.write(f"{fmt_ts(seg['start'])}  {fmt_ts(seg['end'])}{mark} {seg['text']}\n")

    print("\nГотово. Создано:")
    print(f"  {txt_path.name}   — читаемый транскрипт (просмотри повторы)")
    print(f"  {keep_path.name}  — ОТРЕДАКТИРУЙ: удали ненужные строки/дубли")
    print(f"  {srt_path.name}   — субтитры")
    print(f"  {json_path.name}  — данные для render.py")
    print(f"\nНайдено кандидатов-повторов: {len(repeats)}")
    print(f"\nДальше: открой {keep_path.name}, удали лишнее, потом запусти render.py")


if __name__ == "__main__":
    main()
