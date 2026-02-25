#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { getFontData, renderTextArray } from "hersheytext";

const DEFAULT_TEXT = "hello";
const DEFAULT_OUTPUT = "src/components/helloDrawingPresetTextSvg.json";
const FONT_ALIASES = {
  "shadows-into-light": "hershey_script_1",
  "indie-flower": "ems_tech",
};
const DEFAULT_FONT_ALIAS = "shadows-into-light";
const DEFAULT_FONT_SIZE = 128;
const DEFAULT_PRESSURE = 0.5;
const DEFAULT_MAX_SEGMENT_LENGTH = 1.8;
const DEFAULT_LETTER_SPACING_EM = 0;
const DEFAULT_WORD_SPACING_EM = 0;
const COMMAND_RE = /[A-Za-z]/;
const NUMBER_RE = /^[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?$/;

function printUsage() {
  console.log(
    [
      "Usage:",
      "  node scripts/exportTextToSvgPreset.mjs --text hello --font indie-flower --out src/components/helloDrawingPresetTextSvg.json",
      "",
      "Options:",
      "  --text, -t            Text to convert (default: hello)",
      "  --out, -o             Output preset json path",
      `  --font                Font alias or Hershey font name (aliases: ${Object.keys(FONT_ALIASES).join(" | ")}; default: ${DEFAULT_FONT_ALIAS})`,
      "  --font-path           Not supported (single-stroke mode only)",
      "  --font-size           Output size before normalization (default: 128)",
      "  --letter-spacing      Extra intra-word tracking in em units (default: 0)",
      "  --word-spacing        Extra spacing for spaces in em units (default: 0)",
      "  --pressure            Pressure value (default: 0.5)",
      "  --segment-length      Max distance between sampled points (default: 1.8)",
      "  (single-stroke output is always enforced)",
      "  --help, -h            Show help",
    ].join("\n"),
  );
}

function parseCliArgs(argv) {
  const options = {
    text: DEFAULT_TEXT,
    outPath: DEFAULT_OUTPUT,
    font: DEFAULT_FONT_ALIAS,
    fontSize: DEFAULT_FONT_SIZE,
    letterSpacingEm: DEFAULT_LETTER_SPACING_EM,
    wordSpacingEm: DEFAULT_WORD_SPACING_EM,
    pressure: DEFAULT_PRESSURE,
    maxSegmentLength: DEFAULT_MAX_SEGMENT_LENGTH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") {
      printUsage();
      process.exit(0);
    }

    if (value === "--text" || value === "-t") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --text");
      options.text = next;
      index += 1;
      continue;
    }

    if (value === "--out" || value === "-o") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --out");
      options.outPath = next;
      index += 1;
      continue;
    }

    if (value === "--font") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --font");
      options.font = next;
      index += 1;
      continue;
    }

    if (value === "--font-path") {
      throw new Error(
        "--font-path is not supported in this script because output is always single-stroke.",
      );
    }

    if (value === "--font-size") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --font-size");
      const parsed = Number(next);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid --font-size value: ${next}`);
      }
      options.fontSize = parsed;
      index += 1;
      continue;
    }

    if (value === "--letter-spacing") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --letter-spacing");
      const parsed = Number(next);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`Invalid --letter-spacing value: ${next}`);
      }
      options.letterSpacingEm = parsed;
      index += 1;
      continue;
    }

    if (value === "--word-spacing") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --word-spacing");
      const parsed = Number(next);
      if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`Invalid --word-spacing value: ${next}`);
      }
      options.wordSpacingEm = parsed;
      index += 1;
      continue;
    }

    if (value === "--pressure") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --pressure");
      const parsed = Number(next);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid --pressure value: ${next}`);
      }
      options.pressure = parsed;
      index += 1;
      continue;
    }

    if (value === "--segment-length") {
      const next = argv[index + 1];
      if (!next) throw new Error("Missing value for --segment-length");
      const parsed = Number(next);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid --segment-length value: ${next}`);
      }
      options.maxSegmentLength = parsed;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${value}`);
  }

  if (!options.text.trim()) {
    throw new Error("Text cannot be empty.");
  }

  return options;
}

function resolveHersheyFontName(fontOption) {
  return FONT_ALIASES[fontOption] ?? fontOption;
}

function isSpaceGlyph(glyph) {
  return glyph?.name === "space";
}

function isCommandToken(token) {
  return typeof token === "string" && token.length === 1 && COMMAND_RE.test(token);
}

function distance(from, to) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function pushPoint(stroke, point) {
  const last = stroke[stroke.length - 1];
  if (!last) {
    stroke.push(point);
    return;
  }

  if (distance(last, point) > 1e-6) {
    stroke.push(point);
  }
}

function appendLine(stroke, from, to, maxSegmentLength) {
  const segmentDistance = distance(from, to);
  const steps = Math.max(1, Math.ceil(segmentDistance / maxSegmentLength));
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    pushPoint(stroke, {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    });
  }
}

function tokenizePathData(pathData) {
  const tokens = [];
  const tokenRegex = /([A-Za-z])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/g;
  let match = tokenRegex.exec(pathData);
  while (match) {
    tokens.push(match[1] ?? match[2]);
    match = tokenRegex.exec(pathData);
  }
  return tokens;
}

function parseSingleLinePath(pathData, maxSegmentLength) {
  const tokens = tokenizePathData(pathData);
  const strokes = [];
  let tokenIndex = 0;
  let command = null;
  let current = { x: 0, y: 0 };
  let activeStroke = null;

  const readNumber = () => {
    const token = tokens[tokenIndex];
    if (!token || isCommandToken(token)) {
      throw new Error(`Expected number in path data: "${pathData}"`);
    }
    if (!NUMBER_RE.test(token)) {
      throw new Error(`Invalid number token "${token}" in path data.`);
    }
    tokenIndex += 1;
    return Number(token);
  };

  const flush = () => {
    if (activeStroke && activeStroke.length > 1) {
      strokes.push(activeStroke);
    }
    activeStroke = null;
  };

  while (tokenIndex < tokens.length) {
    const token = tokens[tokenIndex];
    if (isCommandToken(token)) {
      command = token;
      tokenIndex += 1;
    } else if (!command) {
      throw new Error(`Path data starts with numbers: "${pathData}"`);
    }

    if (!command) {
      continue;
    }

    switch (command) {
      case "M":
      case "m": {
        const x = readNumber();
        const y = readNumber();
        const next =
          command === "M"
            ? { x, y }
            : { x: current.x + x, y: current.y + y };
        flush();
        activeStroke = [];
        pushPoint(activeStroke, next);
        current = next;
        command = command === "M" ? "L" : "l";
        break;
      }
      case "L":
      case "l": {
        if (!activeStroke) {
          activeStroke = [];
          pushPoint(activeStroke, current);
        }

        while (tokenIndex < tokens.length && !isCommandToken(tokens[tokenIndex])) {
          const x = readNumber();
          const y = readNumber();
          const next =
            command === "L"
              ? { x, y }
              : { x: current.x + x, y: current.y + y };
          appendLine(activeStroke, current, next, maxSegmentLength);
          current = next;
        }
        break;
      }
      default:
        throw new Error(
          `Unsupported command "${command}" for single-line path: "${pathData}".`,
        );
    }
  }

  flush();
  return strokes;
}

function roundTo(value, decimals = 6) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normalizeStrokes(strokes, pressure) {
  const filtered = strokes.filter((stroke) => stroke.length > 1);
  if (filtered.length === 0) {
    throw new Error("No drawable strokes were extracted.");
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const stroke of filtered) {
    for (const point of stroke) {
      if (point.x < minX) minX = point.x;
      if (point.x > maxX) maxX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.y > maxY) maxY = point.y;
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;
  if (!(width > 0) || !(height > 0)) {
    throw new Error("Strokes collapsed to zero width or height.");
  }

  const clampedPressure = Math.min(1, Math.max(0, pressure));
  const normalizedStrokes = filtered.map((stroke) =>
    stroke.map((point) => [
      roundTo((point.x - minX) / width),
      roundTo((point.y - minY) / height),
      clampedPressure,
    ]),
  );

  return {
    version: 1,
    aspectRatio: roundTo(width / height),
    strokes: normalizedStrokes,
  };
}

function transformStrokes(strokes, transform) {
  return strokes.map((stroke) =>
    stroke.map((point) => transform(point.x, point.y)),
  );
}

async function main() {
  const options = parseCliArgs(process.argv.slice(2));
  const resolvedHersheyFont = resolveHersheyFontName(options.font);
  const fontData = getFontData(resolvedHersheyFont);
  if (!fontData) {
    throw new Error(
      `Unknown font "${options.font}" (resolved to "${resolvedHersheyFont}").`,
    );
  }

  const unitsPerEm = Number(fontData.info["units-per-em"] ?? 1000) || 1000;
  const defaultAdvance = Number(fontData.info["horiz-adv-x"] ?? unitsPerEm * 0.4) || 400;
  const isSvgFont = fontData.type === "svg";
  const scale = options.fontSize / unitsPerEm;
  const maxSegmentLengthInFontUnits = options.maxSegmentLength / scale;
  const letterSpacingInFontUnits = options.letterSpacingEm * unitsPerEm;
  const wordSpacingInFontUnits = options.wordSpacingEm * unitsPerEm;

  const glyphs = renderTextArray(options.text, { font: resolvedHersheyFont });
  if (!Array.isArray(glyphs)) {
    throw new Error("Could not render text with hersheytext.");
  }

  let cursorX = 0;
  let cursorY = 0;
  const lineAdvance = unitsPerEm;
  const allStrokes = [];

  for (let glyphIndex = 0; glyphIndex < glyphs.length; glyphIndex += 1) {
    const glyph = glyphs[glyphIndex];
    if (glyph?.name === "newline") {
      cursorX = 0;
      cursorY += lineAdvance;
      continue;
    }

    const width = Number(glyph?.width ?? defaultAdvance) || defaultAdvance;
    const d = glyph?.d;
    if (typeof d === "string" && d.trim()) {
      const rawGlyphStrokes = parseSingleLinePath(d, maxSegmentLengthInFontUnits);
      const positionedGlyphStrokes = transformStrokes(rawGlyphStrokes, (x, y) => {
        const transformedY = isSvgFont ? unitsPerEm - y : y;
        return {
          x: (x + cursorX) * scale,
          y: (transformedY + cursorY) * scale,
        };
      });
      allStrokes.push(...positionedGlyphStrokes);
    }

    const nextGlyph = glyphs[glyphIndex + 1];
    const shouldApplyExtraTracking =
      letterSpacingInFontUnits > 0 &&
      !isSpaceGlyph(glyph) &&
      nextGlyph?.name !== "newline" &&
      !isSpaceGlyph(nextGlyph);

    const shouldApplyWordSpacing = wordSpacingInFontUnits > 0 && isSpaceGlyph(glyph);
    cursorX +=
      width +
      (shouldApplyExtraTracking ? letterSpacingInFontUnits : 0) +
      (shouldApplyWordSpacing ? wordSpacingInFontUnits : 0);
  }

  const preset = normalizeStrokes(allStrokes, options.pressure);
  const outputPath = path.resolve(process.cwd(), options.outPath);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(preset, null, 2)}\n`, "utf8");

  console.log(
    `Wrote ${outputPath} from text "${options.text}" using ${options.font} -> ${resolvedHersheyFont} (${preset.strokes.length} strokes, aspectRatio ${preset.aspectRatio}).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
