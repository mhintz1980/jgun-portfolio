# Private torque symbol fallback

- File: `NotoSansSymbols-unicode-resolver-v1.0.1.woff`, 84980 bytes.
- Exact source: https://raw.githubusercontent.com/lojjic/unicode-font-resolver/v1.0.1/packages/data/font-files/symbols/sans-serif.normal.400.woff
- Noto Sans Symbols, Version2.002; copyright2022 The Noto Project Authors (https://github.com/notofonts/symbols).
- License: SIL Open Font License1.1, retained in `NotoSansSymbols-OFL.txt` from https://raw.githubusercontent.com/notofonts/symbols/main/OFL.txt.
- FontTools inspection confirms U+2300 maps to `uni2300` (diameter). This is the same pinned fallback selected by Troika's Unicode resolver; it is not a replacement glyph or a replacement for the primary Barlow/reference fonts.
- Private lazy `Scene.tsx` configures this local default before first text processing. The private static entry does not import it. Separate legacy documents retain their own text-builder configuration.
- Motivation: actual narrow runtime failures of external `2300-23ff.json` requests (`ERR_CONNECTION_ABORTED`, `ERR_NAME_NOT_RESOLVED`). Preserve those failed reports; fresh runtime must prove no external fallback request/error for the tested story.
