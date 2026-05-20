import argparse
import json
import re
from pathlib import Path
from urllib.parse import unquote


SECTION_HEADINGS = {
    "abstract": "Abstract",
    "intro": "Introduction",
    "discussion": "Discussion",
}

SYNTHETIC_DIRS = {
    "synthetic_Abstract": "abstract",
    "synthetic_Intro": "intro",
    "synthetic_Discussion": "discussion",
}

SOURCE_META = {
    "human": {
        "kind": "human",
        "label": "Human",
        "model_detail": "Human",
        "shade_hex": "#2f855a",
    },
    "chatgpt": {
        "kind": "bot",
        "label": "ChatGPT",
        "model_detail": "ChatGPT",
        "shade_hex": "#4c51bf",
    },
    "claude": {
        "kind": "bot",
        "label": "Claude",
        "model_detail": "Claude",
        "shade_hex": "#b83280",
    },
    "gemini": {
        "kind": "bot",
        "label": "Gemini",
        "model_detail": "Gemini",
        "shade_hex": "#d97706",
    },
}

SYNTHETIC_SOURCE_MAP = {
    "gpt": "chatgpt",
    "claude": "claude",
    "gemini": "gemini",
}

JOURNAL_LOGO_KEYS = {
    "Nature": "nature",
    "Science": "science",
    "Cell": "cell",
    "PNAS": "pnas",
    "New England Journal of Medicine": "nejm",
    "Neuron": "neuron",
    "Nature Neuroscience": "nature-neuroscience",
    "Nature Methods": "nature-methods",
    "Immunity": "immunity",
    "Molecular Therapy": "molecular-therapy",
}

SYNTHETIC_NAME_RE = re.compile(
    r"^(?P<model>GPT|Claude|Gemini)[_-](?P<section>abstract|intro|discussion)[_-](?P<title>.+)$",
    re.IGNORECASE,
)


def canonical_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def make_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return re.sub(r"-+", "-", slug)


def clean_whitespace(value: str) -> str:
    return re.sub(r"[ \t]+", " ", value).strip()


def parse_paper_title(raw_title: str) -> dict:
    title = clean_whitespace(raw_title)
    parts = title.rsplit(" - ", 2)
    if len(parts) != 3 or not re.fullmatch(r"\d{4}", parts[1]):
        raise ValueError(f"Cannot parse paper title/year/journal from: {raw_title}")

    display_title, year, journal = parts
    if journal not in JOURNAL_LOGO_KEYS:
        raise ValueError(f"Unsupported journal in {raw_title}: {journal}")

    return {
        "paper_title": title,
        "display_title": display_title,
        "year": year,
        "journal": journal,
        "logo_key": JOURNAL_LOGO_KEYS[journal],
    }


def extract_markdown_section(markdown: str, heading: str) -> str | None:
    heading_re = re.compile(rf"^#\s+{re.escape(heading)}\s*$", re.IGNORECASE | re.MULTILINE)
    match = heading_re.search(markdown)
    if not match:
        return None

    section_start = match.end()
    next_heading = re.search(r"^#\s+", markdown[section_start:], re.MULTILINE)
    section_text = (
        markdown[section_start : section_start + next_heading.start()]
        if next_heading
        else markdown[section_start:]
    )
    return clean_plain_text(section_text)


def clean_plain_text(text: str) -> str:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    normalized = re.sub(r"^\s*#\s+(Abstract|Introduction|Discussion)(?:\s+\[[^\]]+\])?\s*\n+", "", normalized, flags=re.IGNORECASE)

    lines = []
    for line in normalized.split("\n"):
        stripped = line.strip()
        if stripped:
            stripped = re.sub(r"^#{1,6}\s+", "", stripped)
        lines.append(stripped)

    normalized = "\n".join(lines)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def parse_historical_contexts(context_path: Path) -> dict:
    text = context_path.read_text(encoding="utf-8")
    matches = list(re.finditer(r"^###\s+(.+?)\s*$", text, re.MULTILINE))
    contexts = {}

    for index, match in enumerate(matches):
        title = clean_whitespace(match.group(1))
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        context = clean_plain_text(text[start:end])
        if not context:
            raise ValueError(f"Empty historical context for {title}")
        contexts[canonical_key(title)] = context

    return contexts


def parse_synthetic_filename(path: Path, expected_section: str) -> tuple[str, str]:
    stem = unquote(path.stem)
    match = SYNTHETIC_NAME_RE.match(stem)
    if not match:
        raise ValueError(f"Unrecognized synthetic filename: {path.name}")

    section = match.group("section").lower()
    if section == "intro":
        section = "intro"
    if section != expected_section:
        raise ValueError(f"Section mismatch for {path}: expected {expected_section}, found {section}")

    source = SYNTHETIC_SOURCE_MAP[match.group("model").lower()]
    title = clean_whitespace(match.group("title"))
    title = re.sub(r"\(\d+\)$", "", title).strip()
    return source, title


def build_truth(source: str) -> dict:
    meta = SOURCE_META[source]
    return {
        "kind": meta["kind"],
        "source": source,
        "label": meta["label"],
        "model_detail": meta["model_detail"],
        "shade_hex": meta["shade_hex"],
    }


def build_base_item(paper_id: str, meta: dict, section: str, text: str, source: str) -> dict:
    return {
        "paper_id": paper_id,
        "paper_title": meta["paper_title"],
        "display_title": meta["display_title"],
        "year": meta["year"],
        "journal": meta["journal"],
        "section": section,
        "section_label": SECTION_HEADINGS[section],
        "title": meta["display_title"],
        "text": text,
        "truth": build_truth(source),
        "logo_key": meta["logo_key"],
    }


def build_dataset(root: Path) -> list[dict]:
    human_dir = root / "cleaned_paper_text_docling"
    context_path = root / "paper_historical_contexts.md"
    contexts = parse_historical_contexts(context_path)

    human_files = sorted(path for path in human_dir.glob("*.md") if path.is_file())
    if not human_files:
        raise ValueError(f"No human markdown files found in {human_dir}")

    papers = {}
    human_sections = {}
    items = []

    for path in human_files:
        meta = parse_paper_title(path.stem)
        paper_id = make_slug(meta["paper_title"])
        context = contexts.get(canonical_key(meta["paper_title"]))
        if not context:
            raise ValueError(f"Missing historical context for {meta['paper_title']}")

        papers[paper_id] = meta
        markdown = path.read_text(encoding="utf-8")
        human_sections[paper_id] = {}

        for section, heading in SECTION_HEADINGS.items():
            text = extract_markdown_section(markdown, heading)
            if not text:
                continue

            item = build_base_item(paper_id, meta, section, text, "human")
            item["id"] = f"{paper_id}--{section}--human"
            item["historical_context"] = context
            human_sections[paper_id][section] = item
            items.append(item)

    bot_items_by_key = {}

    for dir_name, section in SYNTHETIC_DIRS.items():
        source_dir = root / dir_name
        files = sorted(
            path
            for path in source_dir.iterdir()
            if path.is_file() and path.suffix.lower() in {".md", ".txt"}
        )
        if not files:
            raise ValueError(f"No synthetic files found in {source_dir}")

        for path in files:
            source, paper_title = parse_synthetic_filename(path, section)
            meta = parse_paper_title(paper_title)
            paper_id = make_slug(meta["paper_title"])
            if paper_id not in papers:
                raise ValueError(f"Synthetic file has no matching human paper: {path.name}")
            if section not in human_sections.get(paper_id, {}):
                continue

            context = contexts.get(canonical_key(meta["paper_title"]))
            if not context:
                raise ValueError(f"Missing historical context for {meta['paper_title']}")

            text = clean_plain_text(path.read_text(encoding="utf-8"))
            if not text:
                raise ValueError(f"Empty synthetic text in {path}")

            key = (paper_id, section, source)
            bot_items_by_key[key] = bot_items_by_key.get(key, 0) + 1
            variant = bot_items_by_key[key]

            item = build_base_item(paper_id, meta, section, text, source)
            item["id"] = f"{paper_id}--{section}--{source}-{variant:02d}"
            item["historical_context"] = context
            item["synthetic_path"] = str(path.relative_to(root))
            items.append(item)

    source_order = {"human": 0, "chatgpt": 1, "claude": 2, "gemini": 3}
    section_order = {"abstract": 0, "intro": 1, "discussion": 2}
    items.sort(
        key=lambda item: (
            item["paper_title"],
            section_order[item["section"]],
            source_order.get(item["truth"]["source"], 99),
            item["id"],
        )
    )
    return items


def validate_dataset(items: list[dict]) -> dict:
    papers = {item["paper_id"] for item in items}
    human_keys = {
        (item["paper_id"], item["section"])
        for item in items
        if item["truth"]["kind"] == "human"
    }
    bot_items = [item for item in items if item["truth"]["kind"] == "bot"]
    bot_without_human = [
        item["id"]
        for item in bot_items
        if (item["paper_id"], item["section"]) not in human_keys
    ]
    if bot_without_human:
        raise ValueError(f"Bot items without human reveal: {bot_without_human[:5]}")

    missing_context = [item["id"] for item in items if not item.get("historical_context")]
    if missing_context:
        raise ValueError(f"Items missing historical context: {missing_context[:5]}")

    source_counts = {}
    for item in items:
        source = item["truth"]["source"]
        source_counts[source] = source_counts.get(source, 0) + 1

    return {
        "papers": len(papers),
        "items": len(items),
        "human": sum(1 for item in items if item["truth"]["kind"] == "human"),
        "bot": len(bot_items),
        "sources": source_counts,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the Spot the Bot JSON dataset from paper folders.")
    parser.add_argument(
        "root",
        nargs="?",
        default=".",
        help="Repository root containing cleaned and synthetic paper folders.",
    )
    parser.add_argument(
        "-o",
        "--output",
        default="spot-the-bot-data.json",
        help="Output JSON file path.",
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    items = build_dataset(root)
    summary = validate_dataset(items)

    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = root / output_path
    output_path.write_text(json.dumps(items, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        "Wrote {items} items across {papers} papers "
        "({human} human, {bot} bot) to {path}".format(path=output_path, **summary)
    )
    print("Source counts:", json.dumps(summary["sources"], sort_keys=True))


if __name__ == "__main__":
    main()
