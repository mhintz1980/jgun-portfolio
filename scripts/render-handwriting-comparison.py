"""Build a labelled owner comparison from a real TTF, reference, and actual captures.

Requires Pillow and fontTools. No generated/modified glyphs or scene captures.
Optional --before-crop/--after-crop are x,y,width,height in source-image pixels.
Without explicit crops, a broad central closeup is used and labelled with its bounds.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps
from fontTools.ttLib import TTFont


def crop_rect(value: str) -> tuple[int, int, int, int]:
    try:
        rect = tuple(int(part.strip()) for part in value.split(","))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("Crop must be x,y,width,height integers") from exc
    if len(rect) != 4 or min(rect[:2]) < 0 or min(rect[2:]) <= 0:
        raise argparse.ArgumentTypeError("Crop must be x,y,width,height with positive size")
    return rect


def label_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in (
        "C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        if Path(candidate).is_file():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default(size=size)


def fit_image(board: Image.Image, image: Image.Image, rect: tuple[int, int, int, int]) -> None:
    x, y, width, height = rect
    fitted = ImageOps.contain(image, (width, height), Image.Resampling.LANCZOS)
    board.paste(fitted, (x + (width - fitted.width) // 2, y + (height - fitted.height) // 2))


def closeup(image: Image.Image, rect: tuple[int, int, int, int] | None) -> tuple[Image.Image, tuple[int, int, int, int]]:
    if rect is None:
        # Broad enough to preserve context; explicit measured crops give tighter note evidence.
        x, y = int(image.width * 0.08), int(image.height * 0.08)
        rect = (x, y, image.width - 2 * x, image.height - 2 * y)
    x, y, width, height = rect
    if x + width > image.width or y + height > image.height:
        raise ValueError(f"Crop {rect} exceeds image size {image.size}")
    return image.crop((x, y, x + width, y + height)), rect


def specimen_lines(font_path: Path, text: str | None) -> tuple[list[str], list[str]]:
    with TTFont(font_path) as ttf:
        supported = set((ttf.getBestCmap() or {}).keys())
    if not supported:
        raise ValueError("Font has no usable Unicode cmap")
    if text is not None:
        lines = text.replace("\\n", "\n").splitlines()
        missing = sorted({ch for line in lines for ch in line if not ch.isspace() and ord(ch) not in supported})
        if missing:
            raise ValueError("Specimen characters absent from supplied TTF: " + repr(missing))
        return lines, []
    # Show only glyphs actually present in the supplied font, never substitutes.
    lines = []
    phrases = ["FAILURE POINT", "ALTERNATE MATERIALS", "ROTARY HOBB IN LATHE"]
    for phrase in phrases:
        if all(ch == " " or ord(ch) in supported for ch in phrase):
            lines.append(phrase)
    alphabet = "".join(ch for ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" if ord(ch) in supported)
    if alphabet:
        lines.extend([alphabet[:13], alphabet[13:]])
    numerals = "".join(ch for ch in "0123456789" if ord(ch) in supported)
    if numerals:
        lines.append(numerals)
    lines = [line for line in lines if line]
    if not lines:
        raise ValueError("No uppercase owner-specimen glyphs are present in the TTF; supply --text")
    absent = [ch for ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" if ord(ch) not in supported]
    return lines, absent


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("font", "reference", "before", "after", "out"):
        parser.add_argument(f"--{name}", required=True, type=Path)
    parser.add_argument("--before-crop", type=crop_rect)
    parser.add_argument("--after-crop", type=crop_rect)
    parser.add_argument("--text", help="Optional specimen text; every non-space character must exist in the TTF")
    args = parser.parse_args()
    paths = {name: getattr(args, name).resolve() for name in ("font", "reference", "before", "after", "out")}
    if paths["out"] in [paths[name] for name in ("font", "reference", "before", "after")]:
        raise ValueError("Output must not overwrite an input")
    lines, absent = specimen_lines(paths["font"], args.text)
    if len(lines) > 10:
        raise ValueError("At most ten specimen lines fit the comparison board")
    def load_image(name: str) -> Image.Image:
        with Image.open(paths[name]) as image:
            return ImageOps.exif_transpose(image).convert("RGB")
    reference, before, after = (load_image(name) for name in ("reference", "before", "after"))
    before_close, before_rect = closeup(before, args.before_crop)
    after_close, after_rect = closeup(after, args.after_crop)
    board = Image.new("RGB", (2400, 1900), "#f5f3ee")
    draw = ImageDraw.Draw(board)
    heading, label, small = label_font(40), label_font(28), label_font(22)
    draw.text((48, 28), "Handwriting reference and scene comparison", font=heading, fill="#202226")
    draw.text((48, 92), "Source screenshot", font=label, fill="#202226")
    draw.text((1248, 92), "Owner specimen — supplied TTF", font=label, fill="#202226")
    for rect in ((48, 138, 1152, 598), (1248, 138, 2352, 598), (48, 718, 1152, 1774), (1248, 718, 2352, 1774)):
        draw.rectangle(rect, fill="white", outline="#b6b8bb", width=2)
    fit_image(board, reference, (60, 150, 1080, 436))
    line_height = min(72, 420 // max(1, len(lines)))
    specimen_size = min(62, max(18, line_height - 9))
    font = ImageFont.truetype(str(paths["font"]), specimen_size)
    while max(font.getlength(line) for line in lines) > 1050 and specimen_size > 10:
        specimen_size -= 1
        font = ImageFont.truetype(str(paths["font"]), specimen_size)
    if max(font.getlength(line) for line in lines) > 1050:
        raise ValueError("Specimen text cannot fit legibly; use shorter lines")
    for index, line in enumerate(lines):
        draw.text((1274, 158 + index * line_height), line, font=font, fill="#24262a")
    draw.text((48, 617), paths["reference"].name, font=small, fill="#34363a")
    draw.text((1248, 617), paths["font"].name, font=small, fill="#34363a")
    draw.text((48, 665), "Before — actual scene closeup", font=label, fill="#202226")
    draw.text((1248, 665), "After — actual scene closeup", font=label, fill="#202226")
    fit_image(board, before_close, (60, 730, 1080, 1032))
    fit_image(board, after_close, (1260, 730, 1080, 1032))
    draw.text((48, 1794), f"{paths['before'].name[:55]}  crop {before_rect}", font=small, fill="#34363a")
    draw.text((1248, 1794), f"{paths['after'].name[:55]}  crop {after_rect}", font=small, fill="#34363a")
    footer = "Original capture pixels; crops resized to fit. No image enhancement or invented glyphs."
    if absent:
        footer += "  TTF lacks: " + "".join(absent)
    draw.text((48, 1850), footer, font=small, fill="#34363a")
    paths["out"].parent.mkdir(parents=True, exist_ok=True)
    board.save(paths["out"], format="PNG")
    print(json.dumps({"out": str(paths["out"]), "size": board.size, "specimen": lines,
        "missingUppercaseOrDigits": absent, "beforeCrop": before_rect, "afterCrop": after_rect,
        "sources": {name: {"path": str(paths[name]), "sha256": hashlib.sha256(paths[name].read_bytes()).hexdigest()}
            for name in ("font", "reference", "before", "after")}}, indent=2))


if __name__ == "__main__":
    main()
