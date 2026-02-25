import { track } from "@vercel/analytics";
import { getStroke } from "perfect-freehand";
import type { StrokeOptions } from "perfect-freehand";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { UNDERLINE_BLUE, UNDERLINE_GREEN } from "../colors";

type DrawPoint = [number, number, number];
type DrawPath = {
  d: string;
  color: string;
  fillOpacity: number;
};

type WhiteboardActiveTool = "marker" | "eraser";

export type WhiteboardDrawingData = {
  version: 1;
  aspectRatio: number;
  strokes: DrawPoint[][];
};

export type WhiteboardMarkerOption = {
  id: string;
  label: string;
  color: string;
};

type BoardSize = {
  width: number;
  height: number;
};

type DrawLayerMetrics = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type ResponsiveValue = {
  desktop: number;
  mobile: number;
};

type ResponsiveNumber = number | ResponsiveValue;

export type WhiteboardPresetPlacementConfig = {
  yPct: ResponsiveNumber;
  heightPct: ResponsiveNumber;
};

export type WhiteboardPresetTimingConfig = {
  pointDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  easeRampRatio: number;
  delayMs?: number;
  playOnce?: boolean;
};

export type WhiteboardPresetStrokeConfig = {
  desktop: StrokeOptions;
  mobile: StrokeOptions;
};

type WhiteboardPresetBaseConfig = {
  id: string;
  data: WhiteboardDrawingData;
  timing?: WhiteboardPresetTimingConfig;
  strokeOptions?: WhiteboardPresetStrokeConfig;
  fillColor: string;
  fillOpacity?: number;
  placement: WhiteboardPresetPlacementConfig;
};
export type WhiteboardPresetConfig = WhiteboardPresetBaseConfig;

type ResolvedWhiteboardPresetTimingConfig = {
  pointDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  easeRampRatio: number;
  delayMs: number;
  playOnce: boolean;
};

type PreparedPresetLayout = {
  id: string;
  pointGroups: DrawPoint[][];
  totalPoints: number;
  strokeOptions: StrokeOptions;
  timing: ResolvedWhiteboardPresetTimingConfig;
  fillColor: string;
  fillOpacity: number;
};

const userStrokeOptions: StrokeOptions = {
  size: 8,
  thinning: 0.08,
  smoothing: 0.58,
  streamline: 0.34,
  simulatePressure: false,
  start: { cap: true, taper: 0 },
  end: { cap: true, taper: 0 },
} as const;

const userStrokeOptionsMobile: StrokeOptions = {
  ...userStrokeOptions,
  size: 8.5,
} as const;

const eraserStrokeOptions: StrokeOptions = {
  ...userStrokeOptions,
  size: 24,
  thinning: 0,
  smoothing: 0.54,
  streamline: 0.42,
} as const;

const eraserStrokeOptionsMobile: StrokeOptions = {
  ...eraserStrokeOptions,
  size: 19,
} as const;

const defaultPresetStrokeOptionsDesktop: StrokeOptions = {
  size: 6.2,
  thinning: 0,
  smoothing: 0.66,
  streamline: 0.36,
  simulatePressure: false,
  start: { cap: true, taper: 0 },
  end: { cap: true, taper: 0 },
} as const;

const defaultPresetStrokeOptionsMobile: StrokeOptions = {
  ...defaultPresetStrokeOptionsDesktop,
  size: 3.6,
} as const;

const minStrokeDistancePx = 2;
const drawingFillOpacity = 1;
const defaultPresetTimingConfig: ResolvedWhiteboardPresetTimingConfig = {
  pointDurationMs: 0.15625,
  minDurationMs: 131.25,
  maxDurationMs: 281.25,
  easeRampRatio: 0.06,
  delayMs: 0,
  playOnce: true,
};

export const WHITEBOARD_MARKER_OPTIONS: WhiteboardMarkerOption[] = [
  { id: "black", label: "black marker", color: "var(--color-slate-800)" },
  { id: "blue", label: "blue marker", color: UNDERLINE_BLUE },
  { id: "green", label: "green marker", color: UNDERLINE_GREEN },
  { id: "red", label: "red marker", color: "var(--color-red-600)" },
  { id: "yellow", label: "yellow marker", color: "var(--color-yellow-400)" },
];
export const WHITEBOARD_ERASER_TOOL_ID = "eraser";
const defaultWhiteboardMarkerColor =
  WHITEBOARD_MARKER_OPTIONS[0]?.color ?? "var(--color-slate-800)";
const defaultUserStrokeSize = 8;
const defaultEraserFillColor = "var(--color-white)";
const defaultEraserFillOpacity = 1;

export const WHITEBOARD_MOBILE_BREAKPOINT_PX = 768;
const mobileViewportMaxWidthPx = WHITEBOARD_MOBILE_BREAKPOINT_PX;
const whiteboardLayoutAspectRatio = 16 / 10;
const markerSvgViewBox = "0 0 148 44";
const eraserSvgViewBox = "0 0 148 44";
const eraserLengthScale = 0.94;

function markerSvgInnerMarkup(
  color: string,
  options?: { includeSurfaceShadow?: boolean },
): string {
  const includeSurfaceShadow = options?.includeSurfaceShadow ?? true;
  return `
    ${
      includeSurfaceShadow
        ? "<ellipse cx='74' cy='35.6' rx='61' ry='4.6' fill='rgba(15, 23, 42, 0.2)' />"
        : ""
    }
    <rect x='14' y='12' width='88' height='20' rx='8' fill='#f8fafc' stroke='#9ca3af' stroke-width='1.5' />
    <rect x='42' y='14.5' width='28' height='15' rx='3.4' fill='${color}' />
    <rect x='74' y='14.5' width='24' height='15' rx='3.4' fill='${color}' opacity='0.28' />
    <rect x='7' y='13.5' width='10' height='17' rx='3.2' fill='#334155' stroke='#1f2937' stroke-width='1' />
    <rect x='101' y='13' width='14' height='18' rx='3.3' fill='#e2e8f0' stroke='#94a3b8' stroke-width='1.2' />
    <path d='M115 13.6 L136 22 L115 30.4 Z' fill='#e5e7eb' stroke='#94a3b8' stroke-width='1.2' />
    <rect x='118.4' y='16.9' width='11.2' height='10.2' rx='2.2' fill='${color}' />
    <circle cx='134.8' cy='22' r='1.6' fill='#64748b' />
  `;
}

function eraserSvgInnerMarkup(options?: { includeSurfaceShadow?: boolean }): string {
  const includeSurfaceShadow = options?.includeSurfaceShadow ?? true;
  return `
    ${
      includeSurfaceShadow
        ? "<ellipse cx='74' cy='36.2' rx='56.4' ry='3.6' fill='rgba(15, 23, 42, 0.24)' />"
        : ""
    }
    <g transform='translate(74 0) scale(${eraserLengthScale} 1) translate(-74 0)'>
      <g transform='translate(8 1)'>
        <rect x='1.6' y='10' width='136.8' height='22.6' rx='4.8' fill='#57595f' stroke='#090a0d' stroke-width='1.8' />
        <rect x='3.6' y='11.4' width='61' height='19.8' rx='3.6' fill='#7a7d84' opacity='0.32' />
        <rect x='78.2' y='11.4' width='58.2' height='19.8' rx='3.6' fill='#1f2228' opacity='0.34' />
        <path d='M10.8 14.1 H128.7' stroke='rgba(255,255,255,0.22)' stroke-width='1.1' stroke-linecap='round' />
        <path d='M10.8 29 H129.6' stroke='rgba(0,0,0,0.38)' stroke-width='1.1' stroke-linecap='round' />

        <rect x='1.6' y='31.6' width='136.8' height='7.2' rx='1.6' fill='#1a1c21' stroke='#07080a' stroke-width='1.6' />
        <rect x='3.6' y='32.6' width='62' height='4.8' rx='1.1' fill='#34373d' opacity='0.54' />
        <rect x='101.2' y='37.9' width='33' height='0.9' rx='0.45' fill='#050608' opacity='0.75' />
      </g>
    </g>
  `;
}

function resolveCssColorValue(color: string): string {
  if (typeof document === "undefined" || !color.includes("var(")) {
    return color;
  }

  const probe = document.createElement("span");
  probe.style.color = color;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.left = "-9999px";
  probe.style.top = "-9999px";
  document.body.appendChild(probe);
  const resolved = window.getComputedStyle(probe).color;
  probe.remove();
  return resolved || color;
}

function buildDesktopMarkerCursor(color: string): string {
  const cursorViewBox = "0 0 180 180";
  const cursorCenter = 90;
  const markerOffsetX = 16;
  const markerOffsetY = 68;
  const markerCenterX = markerOffsetX + 74;
  const markerCenterY = markerOffsetY + 22;
  const cursorRotationDeg = -40;
  const cursorMarkerMarkup = markerSvgInnerMarkup(resolveCssColorValue(color), {
    includeSurfaceShadow: false,
  });
  const cursorSvg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='${cursorViewBox}'>` +
    `<g transform='translate(${cursorCenter} ${cursorCenter}) scale(-1 -1) translate(-${cursorCenter} -${cursorCenter})'>` +
    `<g transform='rotate(${cursorRotationDeg} ${markerCenterX} ${markerCenterY}) translate(${markerOffsetX} ${markerOffsetY})'>` +
    cursorMarkerMarkup +
    "</g></g></svg>";

  return `url("data:image/svg+xml,${encodeURIComponent(cursorSvg)}") 11 35`;
}

function buildDesktopEraserCursor(): string {
  const cursorViewBox = "0 0 180 180";
  const cursorCenter = 90;
  const eraserOffsetX = 14;
  const eraserOffsetY = 86;
  const eraserCenterX = eraserOffsetX + 74;
  const eraserCenterY = eraserOffsetY + 22;
  const cursorRotationDeg = -26;
  const cursorEraserMarkup = eraserSvgInnerMarkup({
    includeSurfaceShadow: false,
  });
  const cursorSvg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='${cursorViewBox}'>` +
    `<g transform='translate(${cursorCenter} ${cursorCenter}) scale(-1 -1) translate(-${cursorCenter} -${cursorCenter})'>` +
    `<g transform='rotate(${cursorRotationDeg} ${eraserCenterX} ${eraserCenterY}) translate(${eraserOffsetX} ${eraserOffsetY})'>` +
    cursorEraserMarkup +
    "</g></g></svg>";

  return `url("data:image/svg+xml,${encodeURIComponent(cursorSvg)}") 14 36`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getSvgPathFromStroke(stroke: [number, number][]): string {
  if (stroke.length === 0) {
    return "";
  }

  const pathParts: string[] = [
    "M",
    stroke[0][0].toFixed(2),
    stroke[0][1].toFixed(2),
    "Q",
  ];

  for (let index = 0; index < stroke.length; index += 1) {
    const currentPoint = stroke[index];
    const nextPoint = stroke[(index + 1) % stroke.length];
    const midpointX = ((currentPoint[0] + nextPoint[0]) / 2).toFixed(2);
    const midpointY = ((currentPoint[1] + nextPoint[1]) / 2).toFixed(2);

    pathParts.push(
      currentPoint[0].toFixed(2),
      currentPoint[1].toFixed(2),
      midpointX,
      midpointY,
    );
  }

  pathParts.push("Z");
  return pathParts.join(" ");
}

function createPath(
  points: DrawPoint[],
  options: StrokeOptions = userStrokeOptions,
): string | null {
  if (points.length === 0) {
    return null;
  }

  if (points.length === 1) {
    const [x, y, pressure] = points[0];
    const size = options.size ?? defaultUserStrokeSize;
    const normalizedPressure = clamp(pressure || 0.5, 0.2, 1);
    const radius = Math.max(1, (size * normalizedPressure) / 2);
    const xCoord = x.toFixed(2);
    const topY = (y - radius).toFixed(2);
    const bottomY = (y + radius).toFixed(2);
    const radiusText = radius.toFixed(2);

    return [
      "M",
      xCoord,
      topY,
      "A",
      radiusText,
      radiusText,
      "0 1 0",
      xCoord,
      bottomY,
      "A",
      radiusText,
      radiusText,
      "0 1 0",
      xCoord,
      topY,
      "Z",
    ].join(" ");
  }

  const stroke = getStroke(points, options);
  if (stroke.length === 0) {
    return null;
  }

  return getSvgPathFromStroke(stroke);
}

function resolveResponsiveValue(value: ResponsiveValue, isMobile: boolean): number {
  return isMobile ? value.mobile : value.desktop;
}

function resolveResponsiveNumber(value: ResponsiveNumber, isMobile: boolean): number {
  return typeof value === "number"
    ? value
    : resolveResponsiveValue(value, isMobile);
}

type PresetPlacementFrame = {
  originX: number;
  originY: number;
  targetWidthPx: number;
  targetHeightPx: number;
};

function resolveCenteredPlacementFrame(
  boardSize: BoardSize,
  isMobile: boolean,
  drawingData: WhiteboardDrawingData,
  placement: WhiteboardPresetPlacementConfig,
): PresetPlacementFrame | null {
  const safeBoardWidth = Math.max(boardSize.width, 1);
  const safeBoardHeight = Math.max(boardSize.height, 1);
  const heightPct = Math.max(0, resolveResponsiveNumber(placement.heightPct, isMobile));
  const targetHeightPx = (safeBoardHeight * heightPct) / 100;
  if (targetHeightPx <= 0) {
    return null;
  }

  const aspectRatio = clamp(drawingData.aspectRatio, 0.1, 10);
  const targetWidthPx = targetHeightPx * aspectRatio;
  const yPct = resolveResponsiveNumber(placement.yPct, isMobile);
  const originX = (safeBoardWidth - targetWidthPx) / 2;
  const originY = (safeBoardHeight * yPct) / 100;

  return {
    originX,
    originY,
    targetWidthPx,
    targetHeightPx,
  };
}

function buildPresetPointGroups(
  boardSize: BoardSize,
  isMobile: boolean,
  drawingData: WhiteboardDrawingData,
  placement: WhiteboardPresetPlacementConfig,
): DrawPoint[][] {
  if (drawingData.strokes.length === 0) {
    return [];
  }

  const frame = resolveCenteredPlacementFrame(
    boardSize,
    isMobile,
    drawingData,
    placement,
  );
  if (!frame) {
    return [];
  }

  const {
    originX,
    originY,
    targetWidthPx,
    targetHeightPx,
  } = frame;

  return drawingData.strokes
    .filter((stroke) => stroke.length > 1)
    .map((stroke) =>
      stroke.map(
        ([normalizedX, normalizedY, pressure]): DrawPoint => [
          originX + normalizedX * targetWidthPx,
          originY + normalizedY * targetHeightPx,
          clamp(pressure, 0, 1),
        ],
      ),
    );
}

function countTotalPoints(groups: DrawPoint[][]): number {
  return groups.reduce((total, group) => total + group.length, 0);
}

function buildPathsFromPointProgress(
  groups: DrawPoint[][],
  visiblePointCount: number,
  strokeOptions: StrokeOptions,
): string[] {
  let remainingPoints = Math.floor(visiblePointCount);
  const paths: string[] = [];

  for (const group of groups) {
    if (remainingPoints <= 1) {
      break;
    }

    if (remainingPoints >= group.length) {
      const fullPath = createPath(group, strokeOptions);
      if (fullPath) {
        paths.push(fullPath);
      }
      remainingPoints -= group.length;
      continue;
    }

    const partialGroup = group.slice(0, remainingPoints);
    const partialPath = createPath(partialGroup, strokeOptions);
    if (partialPath) {
      paths.push(partialPath);
    }
    break;
  }

  return paths;
}

function resolveDrawLayerMetrics(
  boardSize: BoardSize,
  layoutBoardSize: BoardSize,
): DrawLayerMetrics {
  const safeLayoutHeight = Math.max(layoutBoardSize.height, 1);
  const safeLayoutWidth = Math.max(layoutBoardSize.width, 1);
  const safeBoardHeight = Math.max(boardSize.height, 1);
  const scale = safeBoardHeight / safeLayoutHeight;
  const scaledWidth = safeLayoutWidth * scale;
  const scaledHeight = safeLayoutHeight * scale;

  return {
    scale,
    offsetX: (boardSize.width - scaledWidth) / 2,
    offsetY: (boardSize.height - scaledHeight) / 2,
  };
}

function smoothRampUnit(progress: number): number {
  return progress * progress * (2 - progress);
}

function easeMostlyLinear(progress: number, easeRampRatio: number): number {
  const clamped = clamp(progress, 0, 1);
  const ramp = clamp(easeRampRatio, 0.01, 0.49);

  if (clamped <= ramp) {
    return ramp * smoothRampUnit(clamped / ramp);
  }

  if (clamped >= 1 - ramp) {
    const tail = (1 - clamped) / ramp;
    return 1 - ramp * smoothRampUnit(tail);
  }

  return clamped;
}

function shouldCommitStroke(points: DrawPoint[] | null): points is DrawPoint[] {
  if (!points || points.length === 0) {
    return false;
  }

  if (points.length === 1) {
    return true;
  }

  const [startX, startY] = points[0];
  const [endX, endY] = points[points.length - 1];
  const distance = Math.hypot(endX - startX, endY - startY);

  return distance >= minStrokeDistancePx || points.length > 2;
}

function pointFromPointerEvent(
  event: Pick<ReactPointerEvent<HTMLDivElement>, "clientX" | "clientY" | "pressure">,
  drawSurfaceElement: SVGSVGElement | null,
  drawLayerMetrics: DrawLayerMetrics,
): DrawPoint {
  if (drawSurfaceElement) {
    const bounds = drawSurfaceElement.getBoundingClientRect();
    const safeScale = drawLayerMetrics.scale > 0 ? drawLayerMetrics.scale : 1;
    const localX = event.clientX - bounds.left;
    const localY = event.clientY - bounds.top;
    return [
      (localX - drawLayerMetrics.offsetX) / safeScale,
      (localY - drawLayerMetrics.offsetY) / safeScale,
      event.pressure || 0.5,
    ];
  }

  return [event.clientX, event.clientY, event.pressure || 0.5];
}

function isNonDrawingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      "button, a, input, textarea, select, summary, details, [contenteditable='true'], .pswp",
    ),
  );
}

function nearlyEqual(first: number, second: number): boolean {
  return Math.abs(first - second) < 0.5;
}

function areNumberMapsEqual(
  first: Record<string, number>,
  second: Record<string, number>,
): boolean {
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);

  if (firstKeys.length !== secondKeys.length) {
    return false;
  }

  for (const key of firstKeys) {
    if (!(key in second)) {
      return false;
    }

    if (!nearlyEqual(first[key] ?? 0, second[key] ?? 0)) {
      return false;
    }
  }

  return true;
}

function resolvePresetStrokeOptions(
  preset: WhiteboardPresetConfig,
  isMobileViewport: boolean,
): StrokeOptions {
  if (isMobileViewport) {
    return (
      preset.strokeOptions?.mobile ??
      preset.strokeOptions?.desktop ??
      defaultPresetStrokeOptionsMobile
    );
  }

  return (
    preset.strokeOptions?.desktop ??
    preset.strokeOptions?.mobile ??
    defaultPresetStrokeOptionsDesktop
  );
}

function resolvePresetTimingConfig(
  timing: WhiteboardPresetTimingConfig | undefined,
): ResolvedWhiteboardPresetTimingConfig {
  const pointDurationMs = Number.isFinite(timing?.pointDurationMs)
    ? Math.max(0, timing?.pointDurationMs ?? 0)
    : defaultPresetTimingConfig.pointDurationMs;
  const minDurationMs = Number.isFinite(timing?.minDurationMs)
    ? Math.max(0, timing?.minDurationMs ?? 0)
    : defaultPresetTimingConfig.minDurationMs;
  const rawMaxDurationMs = Number.isFinite(timing?.maxDurationMs)
    ? Math.max(0, timing?.maxDurationMs ?? 0)
    : defaultPresetTimingConfig.maxDurationMs;
  const maxDurationMs = Math.max(minDurationMs, rawMaxDurationMs);
  const easeRampRatio = Number.isFinite(timing?.easeRampRatio)
    ? timing?.easeRampRatio ?? defaultPresetTimingConfig.easeRampRatio
    : defaultPresetTimingConfig.easeRampRatio;
  const delayMs = Number.isFinite(timing?.delayMs)
    ? Math.max(0, timing?.delayMs ?? 0)
    : defaultPresetTimingConfig.delayMs;

  return {
    pointDurationMs,
    minDurationMs,
    maxDurationMs,
    easeRampRatio,
    delayMs,
    playOnce: timing?.playOnce ?? defaultPresetTimingConfig.playOnce,
  };
}

function countDrawablePresetPoints(data: WhiteboardDrawingData): number {
  return data.strokes
    .filter((stroke) => stroke.length > 1)
    .reduce((total, stroke) => total + stroke.length, 0);
}

export function estimateWhiteboardPresetIntroDurationMs(
  preset: WhiteboardPresetConfig,
): number {
  const totalPoints = countDrawablePresetPoints(preset.data);
  if (totalPoints === 0) {
    return 0;
  }

  const timing = resolvePresetTimingConfig(preset.timing);
  const animationDurationMs = clamp(
    totalPoints * timing.pointDurationMs,
    timing.minDurationMs,
    timing.maxDurationMs,
  );

  return timing.delayMs + animationDurationMs;
}

type WhiteboardMarkerIconProps = {
  color: string;
  className?: string;
  includeSurfaceShadow?: boolean;
};

export function WhiteboardMarkerIcon({
  color,
  className,
  includeSurfaceShadow,
}: WhiteboardMarkerIconProps) {
  const markerClassName = ["block h-auto", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={markerClassName}
      viewBox={markerSvgViewBox}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{
        __html: markerSvgInnerMarkup(color, { includeSurfaceShadow }),
      }}
    />
  );
}

type WhiteboardEraserIconProps = {
  className?: string;
  includeSurfaceShadow?: boolean;
};

export function WhiteboardEraserIcon({
  className,
  includeSurfaceShadow,
}: WhiteboardEraserIconProps) {
  const eraserClassName = ["block h-auto", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={eraserClassName}
      viewBox={eraserSvgViewBox}
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{
        __html: eraserSvgInnerMarkup({ includeSurfaceShadow }),
      }}
    />
  );
}

type WhiteboardProps = {
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
  skipRevealDelay?: boolean;
  selectedMarkerColor?: string | null;
  selectedToolId?: string | null;
  presets?: WhiteboardPresetConfig[];
};

export function Whiteboard({
  className,
  contentClassName,
  children,
  skipRevealDelay = false,
  selectedMarkerColor,
  selectedToolId,
  presets = [],
}: WhiteboardProps) {
  const [completedPaths, setCompletedPaths] = useState<DrawPath[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [visiblePresetPointsById, setVisiblePresetPointsById] = useState<
    Record<string, number>
  >({});
  const [layoutViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1200 : window.innerWidth,
  );
  const [boardSize, setBoardSize] = useState<BoardSize>({ width: 0, height: 0 });
  const [layoutBoardSize, setLayoutBoardSize] = useState<BoardSize | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const drawSurfaceRef = useRef<SVGSVGElement>(null);
  const activePointsRef = useRef<DrawPoint[] | null>(null);
  const activeToolRef = useRef<WhiteboardActiveTool>("marker");
  const resolvedMarkerColor = selectedMarkerColor ?? defaultWhiteboardMarkerColor;
  const activeStrokeColorRef = useRef(resolvedMarkerColor);
  const activeStrokeFillOpacityRef = useRef(drawingFillOpacity);
  const isDrawingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const hasTrackedDrawRef = useRef(false);
  const hasPlayedPresetIntroRef = useRef<Record<string, boolean>>({});
  const skipRevealDelayRef = useRef(skipRevealDelay);
  const visiblePresetPointsByIdRef = useRef<Record<string, number>>({});
  const presetDelayOverridesRef = useRef<Record<string, number>>({});
  const presetAnimationElapsedMsRef = useRef(0);

  const isMobileViewport = layoutViewportWidth <= mobileViewportMaxWidthPx;
  const isEraserSelected = selectedToolId === WHITEBOARD_ERASER_TOOL_ID;
  const isDrawingEnabled = !isMobileViewport || Boolean(selectedToolId);
  const userDrawStrokeOptions = isMobileViewport
    ? userStrokeOptionsMobile
    : userStrokeOptions;
  const userEraserStrokeOptions = isMobileViewport
    ? eraserStrokeOptionsMobile
    : eraserStrokeOptions;
  const resolvedPresets = useMemo(() => {
    const seen = new Set<string>();
    const unique: WhiteboardPresetConfig[] = [];

    for (const preset of presets) {
      if (!preset?.id || seen.has(preset.id)) {
        continue;
      }

      seen.add(preset.id);
      unique.push(preset);
    }

    return unique;
  }, [presets]);

  useEffect(() => {
    skipRevealDelayRef.current = skipRevealDelay;
  }, [skipRevealDelay]);

  useEffect(() => {
    visiblePresetPointsByIdRef.current = visiblePresetPointsById;
  }, [visiblePresetPointsById]);

  const resolvedLayoutBoardSize = useMemo<BoardSize>(
    () => layoutBoardSize ?? boardSize,
    [boardSize, layoutBoardSize],
  );
  const drawLayerMetrics = useMemo(
    () => resolveDrawLayerMetrics(boardSize, resolvedLayoutBoardSize),
    [boardSize, resolvedLayoutBoardSize],
  );
  const drawLayerTransform = useMemo(() => {
    if (
      nearlyEqual(drawLayerMetrics.offsetX, 0) &&
      nearlyEqual(drawLayerMetrics.offsetY, 0) &&
      nearlyEqual(drawLayerMetrics.scale, 1)
    ) {
      return "";
    }

    // Enforce x' = scale * x + offsetX and y' = scale * y + offsetY.
    return `matrix(${drawLayerMetrics.scale} 0 0 ${drawLayerMetrics.scale} ${drawLayerMetrics.offsetX} ${drawLayerMetrics.offsetY})`;
  }, [drawLayerMetrics]);

  const preparedPresetLayouts = useMemo(
    () =>
      resolvedPresets.map((preset): PreparedPresetLayout => {
        // Keep preset layout profile stable by reusing the locked viewport profile.
        const pointGroups = buildPresetPointGroups(
          resolvedLayoutBoardSize,
          isMobileViewport,
          preset.data,
          preset.placement,
        );

        return {
          id: preset.id,
          pointGroups,
          totalPoints: countTotalPoints(pointGroups),
          strokeOptions: resolvePresetStrokeOptions(preset, isMobileViewport),
          timing: resolvePresetTimingConfig(preset.timing),
          fillColor: preset.fillColor,
          fillOpacity: preset.fillOpacity ?? drawingFillOpacity,
        };
      }),
    [
      isMobileViewport,
      resolvedLayoutBoardSize,
      resolvedPresets,
    ],
  );

  const visiblePresetLayers = useMemo(
    () =>
      preparedPresetLayouts
        .map((layout) => ({
          id: layout.id,
          fillColor: layout.fillColor,
          fillOpacity: layout.fillOpacity,
          paths: buildPathsFromPointProgress(
            layout.pointGroups,
            visiblePresetPointsById[layout.id] ?? 0,
            layout.strokeOptions,
          ),
        }))
        .filter((layer) => layer.paths.length > 0),
    [preparedPresetLayouts, visiblePresetPointsById],
  );

  const updateBoardMeasurements = useCallback((): boolean => {
    const board = boardRef.current;
    if (!board) {
      return false;
    }

    const boardRect = board.getBoundingClientRect();
    const drawSurfaceRect =
      drawSurfaceRef.current?.getBoundingClientRect() ?? boardRect;
    const nextBoardSize = {
      width: drawSurfaceRect.width,
      height: drawSurfaceRect.height,
    };

    setLayoutBoardSize((previous) => {
      if (previous !== null) {
        return previous;
      }

      if (nextBoardSize.width < 1 || nextBoardSize.height < 1) {
        return previous;
      }

      return {
        width: nextBoardSize.height * whiteboardLayoutAspectRatio,
        height: nextBoardSize.height,
      };
    });

    setBoardSize((previous) => {
      if (
        nearlyEqual(previous.width, nextBoardSize.width) &&
        nearlyEqual(previous.height, nextBoardSize.height)
      ) {
        return previous;
      }

      return nextBoardSize;
    });

    return nextBoardSize.width >= 1 && nextBoardSize.height >= 1;
  }, []);

  const finishStroke = useCallback(() => {
    if (!isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;
    activePointerIdRef.current = null;

    const points = activePointsRef.current;
    activePointsRef.current = null;
    setActivePath(null);

    if (!shouldCommitStroke(points)) {
      return;
    }

    const activeTool = activeToolRef.current;
    const strokeOptions =
      activeTool === "eraser" ? userEraserStrokeOptions : userDrawStrokeOptions;
    const path = createPath(points, strokeOptions);
    if (!path) {
      return;
    }

    const strokeColor =
      activeTool === "eraser"
        ? defaultEraserFillColor
        : activeStrokeColorRef.current;
    const strokeFillOpacity =
      activeTool === "eraser"
        ? defaultEraserFillOpacity
        : activeStrokeFillOpacityRef.current;
    if (!hasTrackedDrawRef.current) {
      hasTrackedDrawRef.current = true;
      track("whiteboard_draw");
    }

    setCompletedPaths((previous) => [
      ...previous,
      {
        d: path,
        color: strokeColor,
        fillOpacity: strokeFillOpacity,
      },
    ]);
  }, [userDrawStrokeOptions, userEraserStrokeOptions]);

  useEffect(() => {
    if (isDrawingRef.current) {
      return;
    }

    if (isEraserSelected) {
      activeStrokeColorRef.current = defaultEraserFillColor;
      activeStrokeFillOpacityRef.current = defaultEraserFillOpacity;
      return;
    }

    activeStrokeColorRef.current = resolvedMarkerColor;
    activeStrokeFillOpacityRef.current = drawingFillOpacity;
  }, [isEraserSelected, resolvedMarkerColor]);

  useEffect(() => {
    if (isDrawingEnabled) {
      return;
    }

    finishStroke();
  }, [finishStroke, isDrawingEnabled]);

  useEffect(() => {
    const handleWindowBlur = () => {
      finishStroke();
    };

    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [finishStroke]);

  useEffect(() => {
    let frame = 0;
    let attempts = 0;
    const maxAttempts = 240;

    const captureMeasurements = () => {
      const boardIsMeasured = updateBoardMeasurements();
      if (boardIsMeasured || attempts >= maxAttempts) {
        return;
      }

      attempts += 1;
      frame = window.requestAnimationFrame(captureMeasurements);
    };

    captureMeasurements();

    const refreshMeasurements = () => {
      updateBoardMeasurements();
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      const board = boardRef.current;
      if (board) {
        resizeObserver = new ResizeObserver(refreshMeasurements);
        resizeObserver.observe(board);
      }
    }

    window.addEventListener("resize", refreshMeasurements);
    window.addEventListener("orientationchange", refreshMeasurements);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("resize", refreshMeasurements);
      window.removeEventListener("orientationchange", refreshMeasurements);
    };
  }, [updateBoardMeasurements]);

  useEffect(() => {
    const activePresetIds = new Set(resolvedPresets.map((preset) => preset.id));

    for (const presetId of Object.keys(hasPlayedPresetIntroRef.current)) {
      if (!activePresetIds.has(presetId)) {
        delete hasPlayedPresetIntroRef.current[presetId];
      }
    }

    for (const presetId of Object.keys(presetDelayOverridesRef.current)) {
      if (!activePresetIds.has(presetId)) {
        delete presetDelayOverridesRef.current[presetId];
      }
    }
  }, [resolvedPresets]);

  useEffect(() => {
    if (!skipRevealDelay) {
      return;
    }

    const elapsedMs = presetAnimationElapsedMsRef.current;
    let hasUpdates = false;
    const nextOverrides = { ...presetDelayOverridesRef.current };

    for (const layout of preparedPresetLayouts) {
      if (layout.totalPoints === 0) {
        continue;
      }

      const isAlreadyPlayingOrCompleted =
        (visiblePresetPointsByIdRef.current[layout.id] ?? 0) > 0 ||
        Boolean(hasPlayedPresetIntroRef.current[layout.id]);
      if (isAlreadyPlayingOrCompleted) {
        continue;
      }

      if (nextOverrides[layout.id] !== undefined) {
        continue;
      }

      nextOverrides[layout.id] = elapsedMs;
      hasUpdates = true;
    }

    if (hasUpdates) {
      presetDelayOverridesRef.current = nextOverrides;
    }
  }, [preparedPresetLayouts, skipRevealDelay]);

  useEffect(() => {
    const initialVisiblePointsById: Record<string, number> = {};
    const animatingPresetLayouts: PreparedPresetLayout[] = [];

    for (const layout of preparedPresetLayouts) {
      if (layout.totalPoints === 0) {
        initialVisiblePointsById[layout.id] = 0;
        continue;
      }

      const shouldSkipAnimation =
        layout.timing.playOnce && hasPlayedPresetIntroRef.current[layout.id];

      if (shouldSkipAnimation) {
        initialVisiblePointsById[layout.id] = layout.totalPoints;
        continue;
      }

      initialVisiblePointsById[layout.id] = 0;
      animatingPresetLayouts.push(layout);
    }

    visiblePresetPointsByIdRef.current = initialVisiblePointsById;
    presetAnimationElapsedMsRef.current = 0;
    presetDelayOverridesRef.current = {};
    if (skipRevealDelayRef.current) {
      const immediateDelayOverrides: Record<string, number> = {};
      for (const layout of animatingPresetLayouts) {
        immediateDelayOverrides[layout.id] = 0;
      }
      presetDelayOverridesRef.current = immediateDelayOverrides;
    }

    setVisiblePresetPointsById((previous) =>
      areNumberMapsEqual(previous, initialVisiblePointsById)
        ? previous
        : initialVisiblePointsById,
    );

    if (animatingPresetLayouts.length === 0) {
      return;
    }

    const animatingPresetIds = new Set(animatingPresetLayouts.map((layout) => layout.id));
    let animationFrame = 0;
    let startedAt: number | null = null;

    const tick = (timestamp: number) => {
      if (startedAt === null) {
        startedAt = timestamp;
      }

      const elapsed = timestamp - startedAt;
      presetAnimationElapsedMsRef.current = elapsed;
      let hasInProgressAnimations = false;
      const nextVisiblePointsById: Record<string, number> = {};

      for (const layout of preparedPresetLayouts) {
        if (layout.totalPoints === 0) {
          nextVisiblePointsById[layout.id] = 0;
          continue;
        }

        if (!animatingPresetIds.has(layout.id)) {
          nextVisiblePointsById[layout.id] = layout.totalPoints;
          continue;
        }

        const delayOverrideMs = presetDelayOverridesRef.current[layout.id];
        const effectiveDelayMs = delayOverrideMs ?? layout.timing.delayMs;
        const elapsedAfterDelay = elapsed - effectiveDelayMs;
        if (elapsedAfterDelay <= 0) {
          nextVisiblePointsById[layout.id] = 0;
          hasInProgressAnimations = true;
          continue;
        }

        const animationDurationMs = clamp(
          layout.totalPoints * layout.timing.pointDurationMs,
          layout.timing.minDurationMs,
          layout.timing.maxDurationMs,
        );
        const progress = clamp(elapsedAfterDelay / animationDurationMs, 0, 1);
        const easedProgress = easeMostlyLinear(progress, layout.timing.easeRampRatio);
        const nextVisiblePoints = Math.min(
          layout.totalPoints,
          Math.max(2, Math.floor(easedProgress * layout.totalPoints)),
        );

        nextVisiblePointsById[layout.id] = nextVisiblePoints;

        if (progress < 1) {
          hasInProgressAnimations = true;
          continue;
        }

        if (layout.timing.playOnce) {
          hasPlayedPresetIntroRef.current[layout.id] = true;
        }
      }

      visiblePresetPointsByIdRef.current = nextVisiblePointsById;
      setVisiblePresetPointsById((previous) =>
        areNumberMapsEqual(previous, nextVisiblePointsById)
          ? previous
          : nextVisiblePointsById,
      );

      if (hasInProgressAnimations) {
        animationFrame = window.requestAnimationFrame(tick);
      }
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [preparedPresetLayouts]);

  const startStroke = useCallback(
    (point: DrawPoint) => {
      const nextTool: WhiteboardActiveTool = isEraserSelected ? "eraser" : "marker";
      isDrawingRef.current = true;
      activeToolRef.current = nextTool;
      activePointsRef.current = [point];
      if (nextTool === "eraser") {
        activeStrokeColorRef.current = defaultEraserFillColor;
        activeStrokeFillOpacityRef.current = defaultEraserFillOpacity;
      } else {
        activeStrokeColorRef.current = resolvedMarkerColor;
        activeStrokeFillOpacityRef.current = drawingFillOpacity;
      }
      setActivePath(
        createPath(
          [point],
          nextTool === "eraser" ? userEraserStrokeOptions : userDrawStrokeOptions,
        ),
      );
    },
    [isEraserSelected, resolvedMarkerColor, userDrawStrokeOptions, userEraserStrokeOptions],
  );

  const appendStrokePoint = useCallback(
    (point: DrawPoint) => {
      const points = activePointsRef.current;
      if (!points) {
        return;
      }

      const lastPoint = points[points.length - 1];
      if (lastPoint && lastPoint[0] === point[0] && lastPoint[1] === point[1]) {
        return;
      }

      const updatedPoints = [...points, point];
      activePointsRef.current = updatedPoints;
      setActivePath(
        createPath(
          updatedPoints,
          activeToolRef.current === "eraser"
            ? userEraserStrokeOptions
            : userDrawStrokeOptions,
        ),
      );
    },
    [userDrawStrokeOptions, userEraserStrokeOptions],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDrawingEnabled) {
        return;
      }

      if (
        isDrawingRef.current ||
        (event.pointerType === "mouse" && event.button !== 0) ||
        isNonDrawingTarget(event.target)
      ) {
        return;
      }

      activePointerIdRef.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      startStroke(
        pointFromPointerEvent(event, drawSurfaceRef.current, drawLayerMetrics),
      );
      if (event.pointerType === "touch") {
        event.preventDefault();
      }
    },
    [drawLayerMetrics, isDrawingEnabled, startStroke],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (
        !isDrawingRef.current ||
        activePointerIdRef.current !== event.pointerId
      ) {
        return;
      }

      appendStrokePoint(
        pointFromPointerEvent(event, drawSurfaceRef.current, drawLayerMetrics),
      );
      if (event.pointerType === "touch") {
        event.preventDefault();
      }
    },
    [appendStrokePoint, drawLayerMetrics],
  );

  const finishFromPointerEvent = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      finishStroke();
    },
    [finishStroke],
  );

  const activeDesktopMarkerCursor = useMemo(
    () => buildDesktopMarkerCursor(resolvedMarkerColor),
    [resolvedMarkerColor],
  );
  const activeDesktopEraserCursor = useMemo(
    () => buildDesktopEraserCursor(),
    [],
  );
  const rootStyle = useMemo(() => {
    const nextStyle: CSSProperties = {
      touchAction: isDrawingEnabled ? "none" : "pan-y",
    };
    if (!isMobileViewport && isDrawingEnabled) {
      nextStyle.cursor = isEraserSelected
        ? `${activeDesktopEraserCursor}, crosshair`
        : `${activeDesktopMarkerCursor}, crosshair`;
    }

    return nextStyle;
  }, [
    activeDesktopEraserCursor,
    activeDesktopMarkerCursor,
    isDrawingEnabled,
    isEraserSelected,
    isMobileViewport,
  ]);

  const rootClassName = ["whiteboard", className ?? ""].filter(Boolean).join(" ");
  const contentClassNames = [
    "pointer-events-none relative z-[2] flex h-full w-full items-stretch justify-stretch [&>*]:pointer-events-auto [&>*]:h-full [&>*]:w-full [&>*]:min-h-full [&>*]:min-w-0 [&>*]:flex-[1_1_100%]",
    contentClassName ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={boardRef}
      className={rootClassName}
      style={rootStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishFromPointerEvent}
      onPointerCancel={finishFromPointerEvent}
      onLostPointerCapture={finishFromPointerEvent}
    >
      <svg
        className="pointer-events-none absolute z-[3] overflow-hidden inset-0 w-full h-full"
        aria-hidden="true"
        ref={drawSurfaceRef}
      >
        <g transform={drawLayerTransform || undefined}>
          {visiblePresetLayers.flatMap((layer) =>
            layer.paths.map((path, pathIndex) => (
              <path
                key={`${layer.id}-${pathIndex}`}
                d={path}
                fill={layer.fillColor}
                fillOpacity={layer.fillOpacity}
              />
            )),
          )}
          {completedPaths.map((path, index) => (
            <path
              key={`${index}-${path.d.length}`}
              d={path.d}
              fill={path.color}
              fillOpacity={path.fillOpacity}
            />
          ))}
          {activePath ? (
            <path
              d={activePath}
              fill={activeStrokeColorRef.current}
              fillOpacity={activeStrokeFillOpacityRef.current}
            />
          ) : null}
        </g>
      </svg>
      <div className={contentClassNames}>{children}</div>
    </div>
  );
}
