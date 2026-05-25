import { track } from "@vercel/analytics";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import deriveDrawingPresetIndieFlower from "./drawings/title-derive.json";
import encounterDrawingPresetIndieFlower from "./drawings/title-encounter.json";
import robotsDrawingPresetIndieFlower from "./drawings/title-robots.json";
import snackDrawingPresetIndieFlower from "./drawings/title-snack.json";
import whatsappDrawingPresetIndieFlower from "./drawings/title-whatsapp.json";
import type { PolaroidPhoto } from "./Polaroids";
import { ResponsiveViewportContainer } from "./ResponsiveViewportContainer";
import { ViewportContainer } from "./ViewportContainer";
import { HeroContactBar } from "./HeroContactBar";
import {
  Whiteboard,
  estimateWhiteboardPresetIntroDurationMs,
  type WhiteboardDrawingData,
  type WhiteboardPresetConfig,
} from "./Whiteboard";
import { UNDERLINE_BLUE, UNDERLINE_GREEN, UNDERLINE_ORANGE } from "../colors";
import { homePhotoSectionsById } from "../data/homePhotos";
import { SHARED_UNDERLINE_LAYERS } from "../reveal/notationPresets";
import {
  Slide,
  type SimpleNotationConfig,
  type SlideConfig,
  type SimpleTextGroupConfig,
} from "../reveal/Slide";
import {
  REQUEST_SKIP_REVEAL_EVENT,
  type RequestSkipRevealDetail,
} from "../reveal/skipRevealEvents";
import { scaleRevealCadenceMs } from "../reveal/timing";
import type {
  NotationBracketSide,
  NotationLayerConfig,
} from "../reveal/notationTypes";

const buildUnderlineColor = "var(--color-red-500)";
const contentSlideTopInsetPct = 20;
const whiteboardPresetLayoutAspectRatio = 16 / 10;
const rowRevealDurationMs = 520;

// Reading-speed-based cadence constants. Keep reveal animation durations fixed;
// only shorten the waits between visible moments.
const msPerWord = scaleRevealCadenceMs(180);
const minRowReadMs = scaleRevealCadenceMs(1000);
const yearGlanceMs = scaleRevealCadenceMs(300);
// Reader starts reading ~150ms into the 520ms fade-in (text becomes legible before full opacity).
// This 370ms "head start" is used for cross-out timing so it lands near the read position.
const readHeadStartMs = 370;
// Non-cross-out notations reveal after a fixed pause once the row is fully visible.
const notationDelayAfterRowRevealMs = scaleRevealCadenceMs(500);
// Extra delay for cross-outs so they feel deliberate (fires after a brief pause)
const crossOutExtraDelayMs = scaleRevealCadenceMs(800);
// If a row has a delayed cross-out, the next row waits this long after the animation completes
const postCrossOutPauseMs = scaleRevealCadenceMs(300);
// Safety cap so no single row-to-row reveal gap feels too long.
const maxRowRevealGapMs = scaleRevealCadenceMs(2000);
// Default rough-notation animation duration (matches SHARED_UNDERLINE_LAYERS)
const defaultAnnotationAnimationMs = 480;
const defaultContentRowClassName = "px-3 text-center text-lg md:text-2xl";
const slideYearRowClassName =
  "px-3 text-center font-semibold text-sm text-[var(--color-slate-500)]";
const lightRedHighlightColor = "rgb(252 165 165 / 0.45)";
const lightOrangeHighlightColor = "rgb(253 186 116 / 0.45)";
const contentSlideAnchorIds = [
  "encounter",
  "snack",
  "whatsapp",
  "derive",
  "robots",
] as const;

const meetingUpWithFriendsTweetUrl =
  "https://x.com/nikitabier/status/1481118418883399686";
const snackConferencePaperUrl =
  "https://www.researchgate.net/publication/335877023_The_Impact_of_Educational_Microcontent_on_the_Student_Learning_Experience";
const deriveHomeUrl = "https://www.derive.xyz";
const deriveStatsUrl = "https://www.derive.xyz/stats";

type ContentSlidesProps = {
  skipRevealOnMount?: boolean;
  selectedMarkerColor: string | null;
  selectedToolId: string | null;
};

type ContentSlideEntry = {
  id: string;
  anchorId: string;
  whiteboardPresets: WhiteboardPresetConfig[];
  slide: SlideConfig;
};

type LegacyRunNotationConfig = {
  type?:
    | "underline"
    | "box"
    | "circle"
    | "highlight"
    | "strike-through"
    | "crossed-off"
    | "bracket";
  color?: string;
  multiline?: boolean;
  brackets?: NotationBracketSide | NotationBracketSide[];
  layers?: NotationLayerConfig[];
};

type LegacySlideTextRunConfig = {
  id?: string;
  text: string;
  className?: string;
  style?: CSSProperties;
  href?: string;
  target?: "_self" | "_blank" | "_parent" | "_top";
  rel?: string;
  showLinkIcon?: boolean;
  notation?: LegacyRunNotationConfig;
};

type LegacySlideRowConfig = {
  id?: string;
  text?: string;
  runs?: LegacySlideTextRunConfig[];
  className?: string;
  style?: CSSProperties;
};

type LegacySlideConfig = {
  id: string;
  rows: LegacySlideRowConfig[];
  photos?: PolaroidPhoto[];
  photoDesktopLayout?: "columns" | "rows";
  photoDesktopColumns?: number;
};

function createContentSlideTitlePreset(args: {
  id: string;
  data: WhiteboardDrawingData;
  fillColor: string;
  sizeScale?: number;
}): WhiteboardPresetConfig {
  const sharedStrokeOptions = {
    size: 5.1,
    thinning: 0,
    smoothing: 0.58,
    streamline: 0.3,
    simulatePressure: false,
    start: { cap: true, taper: 0 },
    end: { cap: true, taper: 0 },
  } as const;
  const baseHeightPct =
    (whiteboardPresetLayoutAspectRatio * 16) / args.data.aspectRatio;
  const sizeScale = args.sizeScale ?? 1;
  const scaledHeightPct = baseHeightPct * sizeScale;
  const baseYPct = contentSlideTopInsetPct * 0.42;
  const centeredYPct = baseYPct + (baseHeightPct - scaledHeightPct) / 2;

  return {
    id: args.id,
    data: args.data,
    fillColor: args.fillColor,
    strokeOptions: {
      desktop: sharedStrokeOptions,
      mobile: sharedStrokeOptions,
    },
    placement: {
      yPct: centeredYPct,
      heightPct: scaledHeightPct,
    },
    timing: {
      pointDurationMs: 0.4,
      minDurationMs: 840,
      maxDurationMs: 1400,
      easeRampRatio: 0.06,
      delayMs: 0,
      playOnce: true,
    },
  };
}

const compactTitleScale = 0.7;

const contentSlideWhiteboardPresetsByIndex: WhiteboardPresetConfig[] = [
  createContentSlideTitlePreset({
    id: "content-encounter-title",
    data: encounterDrawingPresetIndieFlower as WhiteboardDrawingData,
    fillColor: UNDERLINE_BLUE,
  }),
  createContentSlideTitlePreset({
    id: "content-snack-title",
    data: snackDrawingPresetIndieFlower as WhiteboardDrawingData,
    fillColor: "var(--color-yellow-500)",
    sizeScale: compactTitleScale,
  }),
  createContentSlideTitlePreset({
    id: "content-whatsapp-title",
    data: whatsappDrawingPresetIndieFlower as WhiteboardDrawingData,
    fillColor: UNDERLINE_GREEN,
  }),
  createContentSlideTitlePreset({
    id: "content-derive-title",
    data: deriveDrawingPresetIndieFlower as WhiteboardDrawingData,
    fillColor: UNDERLINE_ORANGE,
    sizeScale: 0.75,
  }),
  createContentSlideTitlePreset({
    id: "content-robots-title",
    data: robotsDrawingPresetIndieFlower as WhiteboardDrawingData,
    fillColor: buildUnderlineColor,
    sizeScale: compactTitleScale,
  }),
];

function keywordUnderline(color: string): LegacyRunNotationConfig {
  return {
    type: "underline",
    color,
    layers: [...SHARED_UNDERLINE_LAYERS],
  };
}

function keywordHighlight(color: string): LegacyRunNotationConfig {
  return {
    type: "highlight",
    color,
    layers: [
      {
        ...SHARED_UNDERLINE_LAYERS[0],
        iterations: 1,
        padding: [0, 0, 0, 0],
      },
    ],
  };
}

function resolveRunsForRow(
  row: LegacySlideRowConfig,
): LegacySlideTextRunConfig[] {
  if (row.runs && row.runs.length > 0) {
    return row.runs;
  }

  if (typeof row.text === "string") {
    return [{ text: row.text }];
  }

  return [];
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getRowReadTimeMs(row: LegacySlideRowConfig): number {
  const runs = resolveRunsForRow(row);
  const wordCount = runs.reduce((sum, run) => sum + countWords(run.text), 0);
  return Math.max(wordCount * msPerWord, minRowReadMs);
}

function isCrossOutNotation(
  notation: LegacySlideTextRunConfig["notation"],
): boolean {
  return (
    notation?.type === "crossed-off" || notation?.type === "strike-through"
  );
}

type RowAnnotationCompletionMs = {
  any: number;
  crossOut: number;
};

// Returns the latest annotation completion times relative to the row reveal start.
function getRowAnnotationCompletionMs(
  row: LegacySlideRowConfig,
): RowAnnotationCompletionMs {
  const runs = resolveRunsForRow(row);
  let anyCompletion = 0;
  let crossOutCompletion = 0;
  for (let i = 0; i < runs.length; i++) {
    const notation = runs[i].notation;
    if (!notation) continue;
    const isCrossOut = isCrossOutNotation(notation);
    const notationDelay = computeNotationDelayMs(runs, i);
    const animationDuration =
      notation.layers?.[0]?.animationDuration ?? defaultAnnotationAnimationMs;
    const completionFromRowStart = isCrossOut
      ? notationDelay + animationDuration
      : rowRevealDurationMs + notationDelay + animationDuration;

    anyCompletion = Math.max(anyCompletion, completionFromRowStart);
    if (isCrossOut) {
      crossOutCompletion = Math.max(crossOutCompletion, completionFromRowStart);
    }
  }
  return {
    any: anyCompletion,
    crossOut: crossOutCompletion,
  };
}

// Compute cumulative reading-based reveal delays for each row.
// Row 0 (year) and row 1 (first content) appear simultaneously.
// Subsequent rows appear after the user finishes reading the previous row.
// Any annotation completion can delay the next row if it would finish later.
// Cross-outs additionally keep their post-animation pause.
function computeRowDelays(rows: LegacySlideRowConfig[]): number[] {
  const delays: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    if (i <= 1) {
      delays.push(0);
    } else {
      const prevRow = rows[i - 1];
      const readingBased =
        i === 2
          ? yearGlanceMs + getRowReadTimeMs(rows[1])
          : delays[i - 1] + getRowReadTimeMs(prevRow);

      const annotationCompletion = getRowAnnotationCompletionMs(prevRow);
      // All annotations can delay the next row until they finish.
      const annotationBased =
        annotationCompletion.any > 0
          ? delays[i - 1] + annotationCompletion.any
          : 0;
      // Cross-outs keep their additional deliberate pause.
      const crossOutBased =
        annotationCompletion.crossOut > 0
          ? delays[i - 1] +
            rowRevealDurationMs +
            annotationCompletion.crossOut +
            postCrossOutPauseMs
          : 0;
      const uncappedDelay = Math.max(
        readingBased,
        annotationBased,
        crossOutBased,
      );
      const cappedDelay = Math.min(
        uncappedDelay,
        delays[i - 1] + maxRowRevealGapMs,
      );

      delays.push(cappedDelay);
    }
  }
  return delays;
}

// Compute notation delay from the annotation's start trigger.
// Cross-outs are eye-tracked to reading position.
// All other notations use a fixed delay after full row reveal.
function computeNotationDelayMs(
  runs: LegacySlideTextRunConfig[],
  runIndex: number,
): number {
  const run = runs[runIndex];
  if (!run?.notation) return 0;

  const isCrossOut = isCrossOutNotation(run.notation);
  if (!isCrossOut) {
    return notationDelayAfterRowRevealMs;
  }

  let wordsBefore = 0;
  for (let i = 0; i < runIndex; i++) {
    wordsBefore += countWords(runs[i].text);
  }

  const extraWords = isCrossOut ? countWords(run.text) : 0;

  const baseDelay = Math.max(
    (wordsBefore + extraWords) * msPerWord - readHeadStartMs,
    0,
  );
  return baseDelay + (isCrossOut ? crossOutExtraDelayMs : 0);
}

const legacySlides: LegacySlideConfig[] = [
  {
    id: "Slide 2",
    photoDesktopColumns: 2,
    rows: [
      {
        id: "slide-2-year",
        className: slideYearRowClassName,
        runs: [{ text: "2014" }, { text: " / " }, { text: "18 y.o." }],
      },
      {
        id: "slide-2-story",
        runs: [
          { text: "built my first ios app at 18 y.o. for managing " },
          {
            id: "meeting-up-with-friends-link",
            text: "social calendars",
            href: meetingUpWithFriendsTweetUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            notation: keywordUnderline(UNDERLINE_BLUE),
          },
        ],
      },
      {
        id: "slide-2-outcome",
        runs: [
          { text: "Flopped with " },
          {
            id: "slide-2-download-count",
            text: "600 downloads",
            notation: {
              type: "crossed-off",
              color: "var(--color-red-500)",
              layers: [...SHARED_UNDERLINE_LAYERS],
            },
          },
          { text: "\u2026" },
        ],
      },
      {
        id: "slide-2-outcome-2",
        runs: [{ text: "\u2026but I learned how to code!" }],
      },
    ],
    photos: homePhotoSectionsById.encounter.photos,
  },
  {
    id: "Slide 3",
    photoDesktopColumns: 2,
    rows: [
      {
        id: "slide-3-year",
        className: slideYearRowClassName,
        runs: [{ text: "2017" }, { text: " / " }, { text: "21 y.o." }],
      },
      {
        id: "slide-3-story",
        runs: [
          { text: 'Built a web app for making "bite-sized" whiteboard videos' },
        ],
      },
      {
        id: "slide-3-outcome",
        runs: [
          { text: "Used by " },
          {
            text: "10,000 cs students",
            notation: keywordUnderline("var(--color-yellow-500)"),
          },
          { text: " at UNSW" },
        ],
      },
      {
        id: "slide-3-outcome-2",
        runs: [
          { text: "Published some " },
          {
            id: "snack-conference-paper-link",
            text: "research",
            href: snackConferencePaperUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            notation: keywordUnderline("var(--color-yellow-500)"),
          },
        ],
      },
    ],
    photos: homePhotoSectionsById.snack.photos,
  },
  {
    id: "Slide 4",
    photoDesktopLayout: "rows",
    rows: [
      {
        id: "slide-4-year",
        className: slideYearRowClassName,
        runs: [{ text: "2018" }, { text: " / " }, { text: "22 y.o." }],
      },
      {
        id: "slide-4-story",
        runs: [
          { text: "Built infra at " },
          {
            id: "whatsapp",
            text: "WhatsApp",
            className: "font-[650]",
            notation: keywordUnderline(UNDERLINE_GREEN),
          },
          { text: " for 3 years" },
        ],
      },
      {
        id: "slide-4-outcome",
        runs: [{ text: "Moved to San Francisco" }],
      },
    ],
    photos: homePhotoSectionsById.whatsapp.photos,
  },
  {
    id: "Slide 5",
    photoDesktopLayout: "rows",
    rows: [
      {
        id: "slide-5-year",
        className: slideYearRowClassName,
        runs: [{ text: "2021" }, { text: " / " }, { text: "25 y.o." }],
      },
      {
        id: "slide-5-story",
        runs: [
          { text: "cofounded " },
          {
            id: "derive",
            text: "derive.xyz",
            href: deriveHomeUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            showLinkIcon: false,
            className: "font-[650]",
            notation: keywordUnderline(UNDERLINE_ORANGE),
          },
          { text: " (formerly Lyra)" },
        ],
      },
      {
        id: "slide-5-story-2",
        runs: [
          { text: "an " },
          {
            text: "open source",
            href: "https://github.com/derivexyz/v2-core",
            target: "_blank",
            rel: "noopener noreferrer",
            notation: keywordHighlight(lightOrangeHighlightColor),
          },
          { text: ", self-custodial options exchange" },
        ],
      },
      {
        id: "slide-5-outcome",
        runs: [
          { text: "We just crossed " },
          {
            text: "$20 billion",
            href: deriveStatsUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            notation: keywordUnderline(UNDERLINE_ORANGE),
          },
          { text: " in trading volume" },
        ],
      },
    ],
    photos: homePhotoSectionsById.derive.photos,
  },
  {
    id: "Slide 6",
    photoDesktopLayout: "columns",
    photoDesktopColumns: 3,
    rows: [
      {
        id: "slide-6-year",
        className: slideYearRowClassName,
        runs: [{ text: "2026" }, { text: " / " }, { text: "30 y.o." }],
      },
      {
        id: "slide-6-story",
        runs: [
          { text: "interested in " },
          {
            id: "robots",
            text: "humanity's last machine",
            href: "https://www.humanityslastmachine.com/",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "font-[650]",
            notation: {
              ...keywordUnderline("var(--color-red-500)"),
              multiline: true,
            },
          },
        ],
      },
      {
        id: "slide-6-story-2",
        runs: [
          { text: "currently exploring " },
          {
            id: "robots-2",
            text: "robot foundation models",
            notation: keywordHighlight(lightRedHighlightColor),
          },
        ],
      },
      {
        id: "slide-6-outreach",
        text: "if you're building in the space, let's talk:",
      },
    ],
    photos: homePhotoSectionsById.robots.photos,
  },
];

function toSimpleNotation(
  notation: LegacySlideTextRunConfig["notation"],
  delayMs: number,
): SimpleNotationConfig | undefined {
  if (!notation) {
    return undefined;
  }

  return {
    type: notation.type,
    color: notation.color,
    multiline: notation.multiline,
    brackets: notation.brackets,
    delayMs,
    layers: notation.layers,
  };
}

function toSimpleGroups(args: {
  rowId: string;
  runs: LegacySlideTextRunConfig[];
}): SimpleTextGroupConfig[] {
  return args.runs.map((run, runIndex) => ({
    id: run.id ?? `${args.rowId}-group-${runIndex + 1}`,
    text: run.text,
    className: run.className,
    style: run.style,
    href: run.href,
    target: run.target,
    rel: run.rel,
    linkAppearance: run.href ? "raw" : undefined,
    showLinkIcon: run.showLinkIcon,
    notation: toSimpleNotation(
      run.notation,
      computeNotationDelayMs(args.runs, runIndex),
    ),
  }));
}

function convertLegacySlideToSlide(
  legacySlide: LegacySlideConfig,
  slideIndex: number,
  titleDrawingIntroDurationMs: number,
): SlideConfig {
  const slideId = `content-simple-slide-${slideIndex + 2}`;
  const rowDelays = computeRowDelays(legacySlide.rows);
  const contentRows: SlideConfig["rows"] = legacySlide.rows
    .map((row, rowIndex) => {
      const rowId = row.id ?? `${slideId}-row-${rowIndex + 1}`;
      const revealDelayMs = titleDrawingIntroDurationMs + rowDelays[rowIndex];

      if (legacySlide.id === "Slide 6" && row.id === "slide-6-outreach") {
        const outreachText = row.text ?? "";
        const talkPhrase = "let's talk";
        const talkStartIndex = outreachText
          .toLowerCase()
          .indexOf(talkPhrase);
        const talkEndIndex =
          talkStartIndex >= 0 ? talkStartIndex + talkPhrase.length : -1;
        const prefixText =
          talkStartIndex >= 0 ? outreachText.slice(0, talkStartIndex) : outreachText;
        const talkText =
          talkStartIndex >= 0
            ? outreachText.slice(talkStartIndex, talkEndIndex)
            : "";
        const suffixText =
          talkStartIndex >= 0 ? outreachText.slice(talkEndIndex) : "";

        return {
          id: rowId,
          kind: "custom" as const,
          className: row.className ?? defaultContentRowClassName,
          style: row.style,
          reveal: {
            delayMs: revealDelayMs,
          },
          render: () => (
            <p className="m-0 leading-[1.35]">
              {prefixText}
              {talkText ? (
                <span
                  className="underline decoration-2"
                  style={{ textDecorationColor: "var(--color-red-500)" }}
                >
                  {talkText}
                </span>
              ) : null}
              {suffixText}{" "}
              <HeroContactBar channels={["x", "email"]} />
            </p>
          ),
        };
      }

      const runs = resolveRunsForRow(row);
      const groups = toSimpleGroups({ rowId, runs });

      if (groups.length === 0) {
        return null;
      }

      return {
        id: rowId,
        kind: "text" as const,
        className: row.className ?? defaultContentRowClassName,
        style: row.style,
        reveal: {
          delayMs: revealDelayMs,
        },
        groups,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  // Photos appear after the user finishes reading the last text row
  const lastRowIndex = legacySlide.rows.length - 1;
  const photoAlbumDelayMs =
    rowDelays[lastRowIndex] + getRowReadTimeMs(legacySlide.rows[lastRowIndex]);

  const rows: SlideConfig["rows"] = [...contentRows];
  if ((legacySlide.photos?.length ?? 0) > 0) {
    rows.push({
      id: `${slideId}-album`,
      kind: "album" as const,
      className:
        "w-full flex-1 min-h-0 self-stretch overflow-hidden px-3 pt-8 pb-2",
      reveal: {
        delayMs: titleDrawingIntroDurationMs + photoAlbumDelayMs,
      },
      album: {
        photos: legacySlide.photos as PolaroidPhoto[],
        desktopLayout: legacySlide.photoDesktopLayout,
        desktopColumns: legacySlide.photoDesktopColumns,
      },
    });
  }

  return {
    id: slideId,
    className: "h-full",
    topSpacerClassName: "w-full shrink-0 h-[20%]",
    rowsClassName: "flex-1 min-h-0 items-center gap-2",
    rows,
  };
}

const contentSlides: ContentSlideEntry[] = legacySlides.map(
  (legacySlide, contentSlideIndex) => {
    const anchorId =
      contentSlideAnchorIds[contentSlideIndex] ??
      `slide-${contentSlideIndex + 2}`;
    const titlePreset = contentSlideWhiteboardPresetsByIndex[contentSlideIndex];
    const titleDrawingIntroDurationMs = titlePreset
      ? estimateWhiteboardPresetIntroDurationMs(titlePreset)
      : 0;

    return {
      id: legacySlide.id,
      anchorId,
      whiteboardPresets: titlePreset ? [titlePreset] : [],
      slide: convertLegacySlideToSlide(
        legacySlide,
        contentSlideIndex,
        titleDrawingIntroDurationMs,
      ),
    };
  },
);

function useRevealAtVisibilityThreshold(
  targetRef: RefObject<HTMLElement | null>,
  threshold: number,
  revealImmediately = false,
): boolean {
  const [revealed, setRevealed] = useState(revealImmediately);

  useEffect(() => {
    if (revealImmediately) {
      setRevealed(true);
      return;
    }

    if (revealed) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const target = targetRef.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        if (entry.intersectionRatio < threshold) {
          return;
        }

        setRevealed(true);
        observer.disconnect();
      },
      {
        threshold: [0, threshold, 1],
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [revealed, revealImmediately, targetRef, threshold]);

  return revealed;
}

function estimateSlideRevealDurationMs(
  slide: SlideConfig,
  rowDurationMs: number,
): number {
  const maxRowDelayMs = slide.rows.reduce((maximumDelay, row) => {
    const rowDelayMs = Number.isFinite(row.reveal?.delayMs)
      ? Math.max(row.reveal?.delayMs ?? 0, 0)
      : 0;
    return Math.max(maximumDelay, rowDelayMs);
  }, 0);

  return maxRowDelayMs + Math.max(rowDurationMs, 0);
}

type ContentSlideViewportProps = {
  entry: ContentSlideEntry;
  skipRevealOnMount: boolean;
  stackOrder: number;
  selectedMarkerColor: string | null;
  selectedToolId: string | null;
};

function ContentSlideViewport({
  entry,
  skipRevealOnMount,
  stackOrder,
  selectedMarkerColor,
  selectedToolId,
}: ContentSlideViewportProps) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const revealed = useRevealAtVisibilityThreshold(
    targetRef,
    0.3,
    skipRevealOnMount,
  );
  const [skipRevealDelay, setSkipRevealDelay] = useState(skipRevealOnMount);
  const [isRevealInProgress, setIsRevealInProgress] = useState(false);
  const revealDurationMs = useMemo(() => {
    const slideRevealDurationMs = estimateSlideRevealDurationMs(
      entry.slide,
      rowRevealDurationMs,
    );
    const whiteboardRevealDurationMs = entry.whiteboardPresets.reduce(
      (maxDurationMs, preset) =>
        Math.max(maxDurationMs, estimateWhiteboardPresetIntroDurationMs(preset)),
      0,
    );

    return Math.max(slideRevealDurationMs, whiteboardRevealDurationMs);
  }, [entry.slide, entry.whiteboardPresets]);
  const activePresets = revealed ? entry.whiteboardPresets : [];

  useEffect(() => {
    if (revealed && !skipRevealOnMount) {
      track("slide_view", { slide: entry.anchorId });
    }
  }, [revealed, entry.anchorId, skipRevealOnMount]);

  useEffect(() => {
    if (!revealed || skipRevealDelay) {
      setIsRevealInProgress(false);
      return;
    }

    if (revealDurationMs <= 0) {
      setIsRevealInProgress(false);
      setSkipRevealDelay(true);
      return;
    }

    setIsRevealInProgress(true);
    const timeoutId = window.setTimeout(() => {
      setIsRevealInProgress(false);
      setSkipRevealDelay(true);
    }, revealDurationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [revealed, skipRevealDelay, revealDurationMs]);

  useEffect(() => {
    const handleSkipRevealRequest = (rawEvent: Event) => {
      const event = rawEvent as CustomEvent<RequestSkipRevealDetail>;
      const detail = event.detail;
      if (!detail || detail.anchorId !== entry.anchorId) {
        return;
      }

      if (!isRevealInProgress || skipRevealDelay) {
        return;
      }

      setSkipRevealDelay(true);
      detail.handled = true;
    };

    window.addEventListener(REQUEST_SKIP_REVEAL_EVENT, handleSkipRevealRequest);
    return () => {
      window.removeEventListener(
        REQUEST_SKIP_REVEAL_EVENT,
        handleSkipRevealRequest,
      );
    };
  }, [entry.anchorId, isRevealInProgress, skipRevealDelay]);

  return (
    <ViewportContainer stackOrder={stackOrder} className="border-t border-slate-300">
      <div ref={targetRef} className="relative h-full w-full">
        <ResponsiveViewportContainer>
          <Whiteboard
            className="h-full min-h-full w-full"
            instantReveal={skipRevealOnMount}
            presets={activePresets}
            skipRevealDelay={skipRevealDelay}
            selectedMarkerColor={selectedMarkerColor}
            selectedToolId={selectedToolId}
          >
            <div
              className="relative h-full w-full"
              onPointerDown={() => {
                if (!skipRevealDelay) {
                  setSkipRevealDelay(true);
                }
              }}
            >
              <Slide
                id={entry.anchorId}
                instantReveal={skipRevealOnMount}
                revealed={revealed}
                autoRevealOnScroll={true}
                skipRevealDelay={skipRevealDelay}
                slide={entry.slide}
                rowRevealDurationMs={rowRevealDurationMs}
                slideIndex={stackOrder}
              />
            </div>
          </Whiteboard>
        </ResponsiveViewportContainer>
      </div>
    </ViewportContainer>
  );
}

export function ContentSlides({
  skipRevealOnMount = false,
  selectedMarkerColor,
  selectedToolId,
}: ContentSlidesProps) {
  return (
    <>
      {contentSlides.map((entry, index) => (
        <ContentSlideViewport
          key={entry.id}
          entry={entry}
          skipRevealOnMount={skipRevealOnMount}
          stackOrder={index + 1}
          selectedMarkerColor={selectedMarkerColor}
          selectedToolId={selectedToolId}
        />
      ))}
    </>
  );
}
