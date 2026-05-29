import { Link } from "lucide-react";
import { annotate, annotationGroup } from "rough-notation";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import {
  measureRichInlineStats,
  prepareRichInline,
  type RichInlineItem,
  type RichInlineStats,
} from "@chenglou/pretext/rich-inline";
import { Polaroids, type PolaroidPhoto } from "../components/Polaroids";
import { getLockedViewportHeight } from "../viewportLock";
import { clamp } from "./math";
import { SHARED_UNDERLINE_LAYERS } from "./notationPresets";
import { RevealItem } from "./RevealItem";
import type { NotationBracketSide, NotationLayerConfig } from "./notationTypes";

export type SimpleRevealConfig = {
  delayMs?: number;
};

export type SimpleNotationConfig = {
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
  delayMs?: number;
  layers?: NotationLayerConfig[];
};

export type SimpleTextGroupConfig = {
  id: string;
  text: string;
  hoverText?: string;
  className?: string;
  style?: CSSProperties;
  href?: string;
  target?: "_self" | "_blank" | "_parent" | "_top";
  rel?: string;
  linkAppearance?: "default" | "unstyled" | "raw";
  showLinkIcon?: boolean;
  notation?: SimpleNotationConfig;
};

export type SimplePreTextConfig = {
  maxLines?: number;
  minFontScale?: number;
  minFontSizePx?: number;
  targetFontSizePx?:
    | number
    | {
        mobile: number;
        desktop: number;
      };
  desktopBreakpointPx?: number;
  lineHeightRatio?: number;
  reserveHeight?: boolean;
};

export type SimpleBaseRowConfig = {
  id: string;
  className?: string;
  style?: CSSProperties;
  reveal?: SimpleRevealConfig;
};

export type SimpleTextRowConfig = SimpleBaseRowConfig & {
  kind: "text";
  groups: SimpleTextGroupConfig[];
  pretext?: SimplePreTextConfig;
};

export type SimpleAlbumRowConfig = SimpleBaseRowConfig & {
  kind: "album";
  album: {
    photos: PolaroidPhoto[];
    desktopLayout?: "columns" | "rows";
    desktopColumns?: number;
  };
};

export type SimpleCustomRowConfig = SimpleBaseRowConfig & {
  kind: "custom";
  render: (args: { rowRevealed: boolean }) => ReactNode;
};

export type SimpleRowConfig =
  | SimpleTextRowConfig
  | SimpleAlbumRowConfig
  | SimpleCustomRowConfig;

export type SlideConfig = {
  id: string;
  className?: string;
  style?: CSSProperties;
  topSpacerClassName?: string;
  rowsClassName?: string;
  rows: SimpleRowConfig[];
};

export type SlideProps = {
  id?: string;
  revealed: boolean;
  autoRevealOnScroll?: boolean;
  instantReveal?: boolean;
  skipRevealDelay?: boolean;
  slide: SlideConfig;
  rowRevealDurationMs?: number;
  slideIndex?: number;
};

type RowStartOverridesById = Record<string, number>;

const scrollAutoRevealViewportRatio = 0.5;
const defaultPreTextDesktopBreakpointPx = 768;
const defaultPreTextLineHeightRatio = 1.35;
const defaultPreTextMinFontScale = 0.82;

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function getRowRevealDelayMs(row: SimpleRowConfig): number {
  return Number.isFinite(row.reveal?.delayMs)
    ? Math.max(row.reveal?.delayMs ?? 0, 0)
    : 0;
}

function resolveRowStartTimesById(
  rows: SimpleRowConfig[],
  rowStartOverridesById: RowStartOverridesById,
): RowStartOverridesById {
  const rowStartTimesById: RowStartOverridesById = {};
  let previousBaseDelayMs = 0;
  let previousResolvedStartMs = 0;

  rows.forEach((row, rowIndex) => {
    const baseDelayMs = getRowRevealDelayMs(row);
    const gapFromPreviousRowMs =
      rowIndex === 0
        ? baseDelayMs
        : Math.max(baseDelayMs - previousBaseDelayMs, 0);
    let resolvedStartMs =
      rowIndex === 0
        ? baseDelayMs
        : previousResolvedStartMs + gapFromPreviousRowMs;
    const overrideStartMs = rowStartOverridesById[row.id];

    if (Number.isFinite(overrideStartMs)) {
      resolvedStartMs = Math.min(resolvedStartMs, Math.max(overrideStartMs, 0));
      if (rowIndex > 0) {
        resolvedStartMs = Math.max(resolvedStartMs, previousResolvedStartMs);
      }
    }

    rowStartTimesById[row.id] = resolvedStartMs;
    previousBaseDelayMs = baseDelayMs;
    previousResolvedStartMs = resolvedStartMs;
  });

  return rowStartTimesById;
}

function estimateRowsCompleteElapsedMs(
  rows: SimpleRowConfig[],
  rowRevealDurationMs: number,
): number {
  const rowStartTimesById = resolveRowStartTimesById(rows, {});
  const lastRowStartMs = Object.values(rowStartTimesById).reduce(
    (maxStartMs, rowStartMs) => Math.max(maxStartMs, rowStartMs),
    0,
  );

  return lastRowStartMs + Math.max(rowRevealDurationMs, 1);
}

type TextGroupProps = {
  group: SimpleTextGroupConfig;
  instantReveal: boolean;
  onElement?: (element: HTMLSpanElement | null) => void;
  rowRevealStarted: boolean;
  rowRevealed: boolean;
};

function isCrossOutNotationType(
  type: SimpleNotationConfig["type"] | undefined,
): boolean {
  return type === "crossed-off" || type === "strike-through";
}

const TextGroup = memo(function TextGroup({
  group,
  instantReveal,
  onElement,
  rowRevealStarted,
  rowRevealed,
}: TextGroupProps) {
  const textRef = useRef<HTMLSpanElement | null>(null);
  const annotationRefs = useRef<Array<ReturnType<typeof annotate>>>([]);
  const [showNotation, setShowNotation] = useState(false);
  const notation = group.notation;
  const notationTriggerReady = notation
    ? isCrossOutNotationType(notation.type)
      ? rowRevealStarted
      : rowRevealed
    : false;
  const shouldShowNotationImmediately = instantReveal && notationTriggerReady;

  const clearAnnotations = useCallback(() => {
    annotationRefs.current.forEach((annotation) => {
      annotation.remove();
    });
    annotationRefs.current = [];
  }, []);

  useEffect(() => {
    setShowNotation(shouldShowNotationImmediately);
    clearAnnotations();
  }, [clearAnnotations, notation, group.text, shouldShowNotationImmediately]);

  useEffect(() => {
    return () => {
      clearAnnotations();
    };
  }, [clearAnnotations]);

  useEffect(() => {
    if (!notationTriggerReady) {
      setShowNotation(false);
      clearAnnotations();
    }
  }, [clearAnnotations, notationTriggerReady]);

  useEffect(() => {
    if (!notation || !notationTriggerReady || instantReveal) {
      return;
    }

    const timerId = window.setTimeout(
      () => {
        setShowNotation(true);
      },
      Math.max(notation.delayMs ?? 0, 0),
    );

    return () => {
      window.clearTimeout(timerId);
    };
  }, [instantReveal, notation, notationTriggerReady]);

  useEffect(() => {
    if (!notation || !showNotation) {
      return;
    }

    const target = textRef.current;
    if (!target) {
      return;
    }

    clearAnnotations();

    const layers =
      notation.layers && notation.layers.length > 0
        ? notation.layers
        : SHARED_UNDERLINE_LAYERS;
    const notationType = notation.type ?? "underline";
    const resolvedMultiline =
      notation.multiline ?? notationType === "highlight";
    const annotations = layers.map((layer) =>
      annotate(target, {
        type: notationType,
        color: notation.color,
        multiline: resolvedMultiline,
        brackets: notation.brackets,
        ...layer,
        ...(instantReveal
          ? {
              animate: false,
              animationDuration: 0,
            }
          : null),
      }),
    );

    if (annotations.length === 0) {
      return;
    }

    annotationRefs.current = annotations;
    annotationGroup(annotations).show();

    return () => {
      clearAnnotations();
    };
  }, [clearAnnotations, instantReveal, notation, showNotation]);

  const textClassName = group.className;
  const resolvedRel =
    group.rel ??
    (group.target === "_blank" ? "noopener noreferrer" : undefined);
  const isRawLink = group.linkAppearance === "raw";
  const isUnstyledLink = group.linkAppearance === "unstyled";
  const showLinkIcon = group.showLinkIcon ?? true;
  const sharedTextRowLinkInteractionClassName =
    "cursor-pointer hover:opacity-65 focus-visible:opacity-65";
  const textRowLinkInteractionClassName = group.hoverText
    ? "cursor-pointer"
    : sharedTextRowLinkInteractionClassName;
  const sharedTextRowLinkMotionClassName =
    "duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]";
  const sharedTextRowLinkIconClassName =
    "mr-[0.2em] h-[0.62em] w-[0.62em] shrink-0 translate-y-[0.04em]";
  const rawTextRowLinkClassName = joinClassNames(
    "inline-flex items-baseline align-baseline transition-opacity",
    sharedTextRowLinkMotionClassName,
    textRowLinkInteractionClassName,
    group.hoverText ? "text-swap-trigger" : undefined,
  );
  const linkClassName = isUnstyledLink
    ? joinClassNames(
        "inline-flex items-baseline align-baseline text-inherit no-underline transition-opacity hover:text-inherit focus-visible:text-inherit",
        sharedTextRowLinkMotionClassName,
        textRowLinkInteractionClassName,
        group.hoverText ? "text-swap-trigger" : undefined,
      )
    : joinClassNames(
        "inline-flex items-baseline align-baseline text-[var(--color-blue-500)] no-underline transition-[color,opacity] hover:text-[var(--color-blue-400)] focus-visible:text-[var(--color-blue-400)]",
        sharedTextRowLinkMotionClassName,
        textRowLinkInteractionClassName,
        group.hoverText ? "text-swap-trigger" : undefined,
      );
  const textLabel = group.hoverText ? (
    <span className="text-swap-label">
      <span className="text-swap-default">{group.text}</span>
      <span className="text-swap-hover" aria-hidden="true">
        {group.hoverText}
      </span>
    </span>
  ) : (
    <span className="inline">{group.text}</span>
  );
  const textContent = !group.href
    ? group.hoverText
      ? (
          <span className="text-swap-trigger">{textLabel}</span>
        )
      : group.text
    : isRawLink
      ? (
          <a
            href={group.href}
            target={group.target}
            rel={resolvedRel}
            className={rawTextRowLinkClassName}
          >
            {showLinkIcon ? (
              <Link className={sharedTextRowLinkIconClassName} aria-hidden="true" />
            ) : null}
            {textLabel}
          </a>
        )
      : (
          <a
            href={group.href}
            target={group.target}
            rel={resolvedRel}
            className={linkClassName}
          >
            {showLinkIcon ? (
              <Link className={sharedTextRowLinkIconClassName} aria-hidden="true" />
            ) : null}
            {textLabel}
          </a>
        );
  const setTextElement = useCallback(
    (element: HTMLSpanElement | null) => {
      if (notation) {
        textRef.current = element;
      }
      onElement?.(element);
    },
    [notation, onElement],
  );

  return (
    <span
      className={textClassName || undefined}
      style={group.style}
      ref={setTextElement}
    >
      {textContent}
    </span>
  );
});

type PreTextLayoutState = {
  fontSizePx: number;
  lineHeightPx: number;
  minHeightPx: number;
};

function parsePx(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveFontSizePx(style: CSSStyleDeclaration): number {
  return parsePx(style.fontSize) ?? 16;
}

function resolveLineHeightRatio(
  style: CSSStyleDeclaration,
  fontSizePx: number,
): number {
  const lineHeightPx = parsePx(style.lineHeight);
  if (lineHeightPx !== null && fontSizePx > 0) {
    return lineHeightPx / fontSizePx;
  }

  return defaultPreTextLineHeightRatio;
}

function resolveLetterSpacingPx(
  style: CSSStyleDeclaration,
  fontSizePx: number,
): number {
  const value = style.letterSpacing;
  if (!value || value === "normal") {
    return 0;
  }

  if (value.endsWith("em")) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed * fontSizePx : 0;
  }

  return parsePx(value) ?? 0;
}

function buildCanvasFont(
  style: CSSStyleDeclaration,
  fontSizePx: number,
): string {
  return [
    style.fontStyle && style.fontStyle !== "normal" ? style.fontStyle : undefined,
    style.fontVariantCaps && style.fontVariantCaps !== "normal"
      ? style.fontVariantCaps
      : undefined,
    style.fontWeight || undefined,
    `${fontSizePx}px`,
    style.fontFamily || "sans-serif",
  ]
    .filter(Boolean)
    .join(" ");
}

function resolvePreTextTargetFontSizePx(args: {
  config: SimplePreTextConfig;
  fallbackFontSizePx: number;
  windowObject: Window;
}): number {
  const target = args.config.targetFontSizePx;
  if (typeof target === "number" && Number.isFinite(target)) {
    return Math.max(target, 1);
  }

  if (typeof target === "object" && target !== null) {
    const breakpointPx =
      args.config.desktopBreakpointPx ?? defaultPreTextDesktopBreakpointPx;
    const matchesDesktop = args.windowObject.matchMedia(
      `(min-width: ${breakpointPx}px)`,
    ).matches;
    return Math.max(matchesDesktop ? target.desktop : target.mobile, 1);
  }

  return Math.max(args.fallbackFontSizePx, 1);
}

function getInlinePaddingPx(style: CSSStyleDeclaration): number {
  return (parsePx(style.paddingLeft) ?? 0) + (parsePx(style.paddingRight) ?? 0);
}

function resolvePreTextAvailableWidthPx(
  paragraph: HTMLParagraphElement,
  windowObject: Window,
): number {
  const paragraphRect = paragraph.getBoundingClientRect();
  const rowFrame = paragraph.parentElement?.parentElement;
  const rowFrameStyle = rowFrame
    ? windowObject.getComputedStyle(rowFrame)
    : null;
  const rowInlinePaddingPx = rowFrameStyle
    ? getInlinePaddingPx(rowFrameStyle)
    : 0;
  const article = paragraph.closest("article");
  const articleWidthPx = article?.getBoundingClientRect().width ?? 0;
  const scopedWidthPx =
    articleWidthPx > 0 ? articleWidthPx - rowInlinePaddingPx : 0;
  const centeredFrame = rowFrame ?? article ?? paragraph;
  const centeredFrameRect = centeredFrame.getBoundingClientRect();
  const centerX = centeredFrameRect.left + centeredFrameRect.width / 2;
  const centeredVisibleWidthPx =
    2 * Math.max(Math.min(centerX, windowObject.innerWidth - centerX), 0);
  const visibleScopedWidthPx =
    centeredVisibleWidthPx > 0
      ? centeredVisibleWidthPx - rowInlinePaddingPx
      : 0;

  if (scopedWidthPx > 0 && visibleScopedWidthPx > 0) {
    return Math.max(Math.min(scopedWidthPx, visibleScopedWidthPx), 1);
  }

  return Math.max(scopedWidthPx > 0 ? scopedWidthPx : paragraphRect.width, 1);
}

function arePreTextLayoutsEqual(
  current: PreTextLayoutState | null,
  next: PreTextLayoutState | null,
): boolean {
  if (current === next) {
    return true;
  }

  if (current === null || next === null) {
    return false;
  }

  return (
    Math.abs(current.fontSizePx - next.fontSizePx) < 0.05 &&
    Math.abs(current.lineHeightPx - next.lineHeightPx) < 0.05 &&
    Math.abs(current.minHeightPx - next.minHeightPx) < 0.05
  );
}

function usePreTextLayout(args: {
  row: SimpleTextRowConfig;
  paragraphRef: RefObject<HTMLParagraphElement | null>;
  groupElementsByIdRef: RefObject<Record<string, HTMLSpanElement | null>>;
}): PreTextLayoutState | null {
  const { row, paragraphRef, groupElementsByIdRef } = args;
  const [layoutState, setLayoutState] = useState<PreTextLayoutState | null>(null);

  useLayoutEffect(() => {
    const config = row.pretext;
    if (!config) {
      setLayoutState((current) => (current === null ? current : null));
      return;
    }

    const paragraph = paragraphRef.current;
    const windowObject = paragraph?.ownerDocument.defaultView ?? null;
    if (!paragraph || !windowObject || typeof ResizeObserver === "undefined") {
      return;
    }

    let frame = 0;
    let isCancelled = false;

    const measureAtFontSize = (
      fontSizePx: number,
      paragraphStyle: CSSStyleDeclaration,
      paragraphFontSizePx: number,
      availableWidthPx: number,
    ): RichInlineStats => {
      const items: RichInlineItem[] = row.groups.map((group) => {
        const groupElement = groupElementsByIdRef.current[group.id];
        const groupStyle = groupElement
          ? windowObject.getComputedStyle(groupElement)
          : paragraphStyle;
        const groupFontSizePx = resolveFontSizePx(groupStyle);
        const groupScale =
          paragraphFontSizePx > 0 ? groupFontSizePx / paragraphFontSizePx : 1;
        const resolvedGroupFontSizePx = Math.max(fontSizePx * groupScale, 1);
        const marginRightPx = groupElement
          ? parsePx(groupStyle.marginRight) ?? 0
          : 0;
        const linkIconWidthPx =
          group.href && (group.showLinkIcon ?? true)
            ? resolvedGroupFontSizePx * 0.82
            : 0;

        return {
          text: group.text,
          font: buildCanvasFont(groupStyle, resolvedGroupFontSizePx),
          letterSpacing: resolveLetterSpacingPx(
            groupStyle,
            resolvedGroupFontSizePx,
          ),
          extraWidth: marginRightPx + linkIconWidthPx,
        };
      });

      return measureRichInlineStats(
        prepareRichInline(items),
        Math.max(availableWidthPx, 1),
      );
    };

    const measure = () => {
      frame = 0;
      if (isCancelled) {
        return;
      }

      try {
        const paragraphStyle = windowObject.getComputedStyle(paragraph);
        const inheritedStyle = paragraph.parentElement
          ? windowObject.getComputedStyle(paragraph.parentElement)
          : paragraphStyle;
        const availableWidthPx = resolvePreTextAvailableWidthPx(
          paragraph,
          windowObject,
        );
        if (availableWidthPx <= 0) {
          return;
        }

        const paragraphFontSizePx = resolveFontSizePx(paragraphStyle);
        const inheritedFontSizePx = resolveFontSizePx(inheritedStyle);
        const targetFontSizePx = resolvePreTextTargetFontSizePx({
          config,
          fallbackFontSizePx: inheritedFontSizePx,
          windowObject,
        });
        const minFontSizePx = Math.max(
          config.minFontSizePx ??
            targetFontSizePx * (config.minFontScale ?? defaultPreTextMinFontScale),
          1,
        );
        const lineHeightRatio =
          config.lineHeightRatio ??
          resolveLineHeightRatio(paragraphStyle, paragraphFontSizePx);
        const maxLines = Number.isFinite(config.maxLines)
          ? Math.max(Math.floor(config.maxLines ?? 0), 1)
          : null;
        let resolvedFontSizePx = targetFontSizePx;
        let stats = measureAtFontSize(
          resolvedFontSizePx,
          paragraphStyle,
          paragraphFontSizePx,
          availableWidthPx,
        );

        if (maxLines !== null && stats.lineCount > maxLines) {
          let low = minFontSizePx;
          let high = targetFontSizePx;
          let bestFontSizePx = minFontSizePx;
          let bestStats = measureAtFontSize(
            bestFontSizePx,
            paragraphStyle,
            paragraphFontSizePx,
            availableWidthPx,
          );

          for (let i = 0; i < 8; i++) {
            const mid = (low + high) / 2;
            const midStats = measureAtFontSize(
              mid,
              paragraphStyle,
              paragraphFontSizePx,
              availableWidthPx,
            );

            if (midStats.lineCount <= maxLines) {
              bestFontSizePx = mid;
              bestStats = midStats;
              low = mid;
            } else {
              high = mid;
            }
          }

          resolvedFontSizePx = bestFontSizePx;
          stats = bestStats;
        }

        const lineCount = Math.max(stats.lineCount, 1);
        const lineHeightPx = resolvedFontSizePx * lineHeightRatio;
        const nextLayoutState: PreTextLayoutState = {
          fontSizePx: resolvedFontSizePx,
          lineHeightPx,
          minHeightPx:
            config.reserveHeight === false ? 0 : lineCount * lineHeightPx,
        };

        setLayoutState((current) =>
          arePreTextLayoutsEqual(current, nextLayoutState)
            ? current
            : nextLayoutState,
        );
      } catch {
        setLayoutState((current) => (current === null ? current : null));
      }
    };

    const scheduleMeasure = () => {
      if (frame) {
        windowObject.cancelAnimationFrame(frame);
      }
      frame = windowObject.requestAnimationFrame(measure);
    };

    measure();

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(paragraph);
    if (paragraph.parentElement) {
      resizeObserver.observe(paragraph.parentElement);
    }
    windowObject.addEventListener("resize", scheduleMeasure);
    windowObject.addEventListener("orientationchange", scheduleMeasure);

    return () => {
      isCancelled = true;
      if (frame) {
        windowObject.cancelAnimationFrame(frame);
      }
      resizeObserver.disconnect();
      windowObject.removeEventListener("resize", scheduleMeasure);
      windowObject.removeEventListener("orientationchange", scheduleMeasure);
    };
  }, [groupElementsByIdRef, paragraphRef, row]);

  return layoutState;
}

type TextRowProps = {
  instantReveal: boolean;
  row: SimpleTextRowConfig;
  rowRevealStarted: boolean;
  rowRevealed: boolean;
};

const TextRow = memo(function TextRow({
  instantReveal,
  row,
  rowRevealStarted,
  rowRevealed,
}: TextRowProps) {
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);
  const groupElementsByIdRef = useRef<Record<string, HTMLSpanElement | null>>(
    {},
  );
  const groupElementCallbacksByIdRef = useRef<
    Record<string, (element: HTMLSpanElement | null) => void>
  >({});
  const preTextLayout = usePreTextLayout({
    row,
    paragraphRef,
    groupElementsByIdRef,
  });
  const getGroupElementCallback = useCallback((groupId: string) => {
    const existingCallback = groupElementCallbacksByIdRef.current[groupId];
    if (existingCallback) {
      return existingCallback;
    }

    const callback = (element: HTMLSpanElement | null) => {
      if (element) {
        groupElementsByIdRef.current[groupId] = element;
        return;
      }

      delete groupElementsByIdRef.current[groupId];
    };

    groupElementCallbacksByIdRef.current[groupId] = callback;
    return callback;
  }, []);
  const paragraphStyle = preTextLayout
    ? ({
        "--pretext-font-size": `${preTextLayout.fontSizePx}px`,
        fontSize: "var(--pretext-font-size)",
        lineHeight: `${preTextLayout.lineHeightPx}px`,
        minHeight:
          preTextLayout.minHeightPx > 0
            ? `${preTextLayout.minHeightPx}px`
            : undefined,
      } as CSSProperties)
    : undefined;

  return (
    <p ref={paragraphRef} className="m-0 leading-[1.35]" style={paragraphStyle}>
      <span>
        {row.groups.map((group) => (
          <TextGroup
            key={group.id}
            group={group}
            instantReveal={instantReveal}
            onElement={getGroupElementCallback(group.id)}
            rowRevealStarted={rowRevealStarted}
            rowRevealed={rowRevealed}
          />
        ))}
      </span>
    </p>
  );
});

export function Slide({
  id,
  revealed,
  autoRevealOnScroll = false,
  instantReveal = false,
  skipRevealDelay = false,
  slide,
  rowRevealDurationMs = 520,
  slideIndex = 0,
}: SlideProps) {
  const [sequenceStartTime, setSequenceStartTime] = useState<number | null>(
    null,
  );
  const [elapsedMs, setElapsedMs] = useState(0);
  const skipRevealActivatedElapsedMsRef = useRef<number | null>(null);
  const rowElementsByIdRef = useRef<Record<string, HTMLDivElement | null>>({});
  const rowElementCallbacksByIdRef = useRef<
    Record<string, (element: HTMLDivElement | null) => void>
  >({});
  const rowStartOverridesByIdRef = useRef<RowStartOverridesById>({});
  const [rowStartOverridesById, setRowStartOverridesById] =
    useState<RowStartOverridesById>({});
  const instantRevealElapsedMs = estimateRowsCompleteElapsedMs(
    slide.rows,
    rowRevealDurationMs,
  );
  const displayedElapsedMs =
    instantReveal && revealed ? instantRevealElapsedMs : elapsedMs;

  const getRowElementCallback = useCallback((rowId: string) => {
    const existingCallback = rowElementCallbacksByIdRef.current[rowId];
    if (existingCallback) {
      return existingCallback;
    }

    const callback = (element: HTMLDivElement | null) => {
      if (element) {
        rowElementsByIdRef.current[rowId] = element;
        return;
      }

      delete rowElementsByIdRef.current[rowId];
    };

    rowElementCallbacksByIdRef.current[rowId] = callback;
    return callback;
  }, []);

  useEffect(() => {
    if (!revealed) {
      setSequenceStartTime(null);
      setElapsedMs(0);
      rowStartOverridesByIdRef.current = {};
      setRowStartOverridesById({});
      return;
    }

    setSequenceStartTime(performance.now());
    setElapsedMs(0);
    rowStartOverridesByIdRef.current = {};
    setRowStartOverridesById({});
  }, [revealed, slide.id]);

  useEffect(() => {
    const activeRowIds = new Set(slide.rows.map((row) => row.id));

    for (const rowId of Object.keys(rowElementsByIdRef.current)) {
      if (!activeRowIds.has(rowId)) {
        delete rowElementsByIdRef.current[rowId];
      }
    }

    for (const rowId of Object.keys(rowElementCallbacksByIdRef.current)) {
      if (!activeRowIds.has(rowId)) {
        delete rowElementCallbacksByIdRef.current[rowId];
      }
    }
  }, [slide.rows]);

  useEffect(() => {
    if (sequenceStartTime === null) {
      return;
    }

    let frame = 0;

    const tick = (now: number) => {
      setElapsedMs(now - sequenceStartTime);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [sequenceStartTime]);

  useEffect(() => {
    if (!autoRevealOnScroll || !revealed || sequenceStartTime === null) {
      return;
    }

    let frame = 0;

    const evaluateScrollReveal = (timestamp: number) => {
      frame = 0;
      const triggerLine = getLockedViewportHeight() * scrollAutoRevealViewportRatio;
      const currentElapsedMs = Math.max(timestamp - sequenceStartTime, 0);
      const currentOverrides = rowStartOverridesByIdRef.current;
      const rowStartTimesById = resolveRowStartTimesById(
        slide.rows,
        currentOverrides,
      );
      let nextOverrides: RowStartOverridesById | null = null;

      for (const row of slide.rows) {
        if (Number.isFinite(currentOverrides[row.id])) {
          continue;
        }

        const rowStartTimeMs =
          rowStartTimesById[row.id] ?? getRowRevealDelayMs(row);
        if (currentElapsedMs >= rowStartTimeMs) {
          continue;
        }

        const rowElement = rowElementsByIdRef.current[row.id];
        if (!rowElement) {
          continue;
        }

        if (rowElement.getBoundingClientRect().top > triggerLine) {
          continue;
        }

        if (nextOverrides === null) {
          nextOverrides = { ...currentOverrides };
        }
        nextOverrides[row.id] = currentElapsedMs;
      }

      if (nextOverrides !== null) {
        rowStartOverridesByIdRef.current = nextOverrides;
        setRowStartOverridesById(nextOverrides);
      }
    };

    const scheduleScrollReveal = () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      frame = window.requestAnimationFrame(evaluateScrollReveal);
    };

    scheduleScrollReveal();
    window.addEventListener("scroll", scheduleScrollReveal, { passive: true });
    window.addEventListener("resize", scheduleScrollReveal);
    window.addEventListener("orientationchange", scheduleScrollReveal);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", scheduleScrollReveal);
      window.removeEventListener("resize", scheduleScrollReveal);
      window.removeEventListener("orientationchange", scheduleScrollReveal);
    };
  }, [autoRevealOnScroll, revealed, sequenceStartTime, slide.rows]);

  if (!revealed || !skipRevealDelay) {
    if (skipRevealActivatedElapsedMsRef.current !== null) {
      skipRevealActivatedElapsedMsRef.current = null;
    }
  } else if (skipRevealActivatedElapsedMsRef.current === null) {
    skipRevealActivatedElapsedMsRef.current = displayedElapsedMs;
  }
  const skipRevealActivatedElapsedMs = skipRevealActivatedElapsedMsRef.current;
  const scrollAdjustedRowStartTimesById = autoRevealOnScroll
    ? resolveRowStartTimesById(slide.rows, rowStartOverridesById)
    : null;

  const slideClassName = joinClassNames(
    "flex h-full w-full flex-col",
    slide.className,
  );
  const rowsClassName = joinClassNames(
    "flex w-full min-h-0 flex-col",
    slide.rowsClassName,
  );

  return (
    <section id={id} className="h-full min-h-full w-full">
      <article className={slideClassName} style={slide.style}>
        {slide.topSpacerClassName ? (
          <div className={slide.topSpacerClassName} aria-hidden="true" />
        ) : null}
        <div className={rowsClassName}>
          {slide.rows.map((row) => {
            const rowDelayMs = getRowRevealDelayMs(row);
            let resolvedRowDelayMs =
              scrollAdjustedRowStartTimesById?.[row.id] ?? rowDelayMs;
            if (skipRevealDelay) {
              const activationElapsed =
                skipRevealActivatedElapsedMs ?? displayedElapsedMs;
              const rowStartedBeforeSkip =
                activationElapsed >= resolvedRowDelayMs;
              if (!rowStartedBeforeSkip) {
                resolvedRowDelayMs = activationElapsed;
              }
            }
            const rowProgress = revealed
              ? clamp(
                  (displayedElapsedMs - resolvedRowDelayMs) /
                    Math.max(rowRevealDurationMs, 1),
                  0,
                  1,
                )
              : 0;
            const rowRevealStarted = rowProgress > 0;
            const rowRevealed = rowProgress >= 0.999;

            return (
              <RevealItem
                key={row.id}
                progress={rowProgress}
                config={{
                  id: row.id,
                  start: 0,
                  end: 1,
                  easing: "easeOutCubic",
                  from: {
                    opacity: 0,
                    y: 24,
                    blur: 6,
                  },
                  to: {
                    opacity: 1,
                    y: 0,
                    blur: 0,
                  },
                  className: row.className,
                  style: row.style,
                }}
                onWrapperElement={getRowElementCallback(row.id)}
              >
                {row.kind === "text" ? (
                  <TextRow
                    instantReveal={instantReveal}
                    row={row}
                    rowRevealStarted={rowRevealStarted}
                    rowRevealed={rowRevealed}
                  />
                ) : null}

                {row.kind === "album" ? (
                  <Polaroids
                    slideIndex={slideIndex}
                    photos={row.album.photos}
                    desktopLayout={row.album.desktopLayout}
                    desktopColumns={row.album.desktopColumns}
                    interactive={rowRevealed}
                  />
                ) : null}

                {row.kind === "custom" ? row.render({ rowRevealed }) : null}
              </RevealItem>
            );
          })}
        </div>
      </article>
    </section>
  );
}
