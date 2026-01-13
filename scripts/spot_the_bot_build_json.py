import argparse
import json
import re
from pathlib import Path

SECTION_MAP = {
    "abstract": "abstract",
    "noDiscussion": "intro",
    "noIntro": "discussion",
}

SOURCE_MAP = {
    "gpt": "chatgpt",
    "claude": "claude",
    "gemini": "gemini",
    "human": "human",
}

MODEL_DETAIL = {
    "chatgpt": "GPT-4.1",
    "claude": "Claude 3.5 Sonnet",
    "gemini": "Gemini 1.5 Pro",
    "human": "Human",
}

SHADE_HEX = {
    "human": "#2f855a",
    "chatgpt": "#4c51bf",
    "claude": "#b83280",
    "gemini": "#d97706",
}

FILENAME_RE = re.compile(
    r"^(?P<source>gpt|claude|gemini|human)(?P<num>\d+)_(?P<section>abstract|noDiscussion|noIntro)\.txt$"
)


def parse_file(path: Path) -> dict:
    match = FILENAME_RE.match(path.name)
    if not match:
        raise ValueError(f"Unrecognized filename: {path.name}")

    source_key = match.group("source")
    number = int(match.group("num"))
    section_key = match.group("section")

    source = SOURCE_MAP[source_key]
    section = SECTION_MAP[section_key]

    text = path.read_text(encoding="utf-8").strip()
    if not text:
        raise ValueError(f"Empty passage in {path.name}")

    return {
        "source_key": source_key,
        "number": number,
        "section": section,
        "title": f"{source_key.upper()} {number} {section}",
        "text": text,
        "truth": {
            "source": source,
            "model_detail": MODEL_DETAIL[source],
            "shade_hex": SHADE_HEX[source],
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert Spot the Bot .txt passages into JSON dataset."
    )
    parser.add_argument(
        "input_dir",
        nargs="?",
        default=".",
        help="Directory containing passage .txt files.",
    )
    parser.add_argument(
        "-o",
        "--output",
        default="spot-the-bot-data.json",
        help="Output JSON file path.",
    )
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    files = sorted(input_dir.glob("*.txt"))
    if not files:
        raise SystemExit(f"No .txt files found in {input_dir}")

    parsed = [parse_file(path) for path in files]
    parsed.sort(key=lambda item: (item["source_key"], item["number"], item["section"]))

    items = []
    for index, item in enumerate(parsed, start=1):
        items.append(
            {
                "id": f"S{index:02d}",
                "section": item["section"],
                "title": item["title"],
                "text": item["text"],
                "truth": item["truth"],
            }
        )

    output_path = Path(args.output)
    output_path.write_text(json.dumps(items, indent=2, ensure_ascii=False) + "\n")

    print(f"Wrote {len(items)} items to {output_path}")


if __name__ == "__main__":
    main()
