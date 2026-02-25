import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  WHITEBOARD_ERASER_TOOL_ID,
  WHITEBOARD_MARKER_OPTIONS,
  WHITEBOARD_MOBILE_BREAKPOINT_PX,
  WhiteboardEraserIcon,
  WhiteboardMarkerIcon,
} from "./Whiteboard";

export type WhiteboardMarkerTrayProps = {
  selectedMarketId: string | null;
  setSelectedMarketId: Dispatch<SetStateAction<string | null>>;
};

type WhiteboardTrayTool =
  | { id: string; label: string; kind: "marker"; color: string }
  | { id: typeof WHITEBOARD_ERASER_TOOL_ID; label: string; kind: "eraser" };

const WHITEBOARD_TRAY_TOOLS: WhiteboardTrayTool[] = [
  ...WHITEBOARD_MARKER_OPTIONS.map((marker) => ({
    ...marker,
    kind: "marker" as const,
  })),
  { id: WHITEBOARD_ERASER_TOOL_ID, label: "eraser", kind: "eraser" },
];

const trayBaseClassName =
  "fixed z-[8] [--hero-marker-bottom-gap:calc(var(--hero-marker-width)*12/148)] [--hero-marker-sit-y:calc(-1*var(--hero-tray-height)+var(--hero-marker-bottom-gap))] flex overflow-visible isolate before:pointer-events-none before:absolute before:bottom-[calc(100%-1px)] before:left-[-1px] before:z-[3] before:h-[8px] before:w-[8px] before:border before:border-b-0 before:border-slate-800 before:bg-slate-500 before:content-[''] after:pointer-events-none after:absolute after:bottom-[calc(100%-1px)] after:right-[-1px] after:z-[3] after:h-[8px] after:w-[8px] after:border after:border-b-0 after:border-slate-800 after:bg-slate-500 after:content-['']";
const trayDesktopClassName =
  "left-[max(0px,env(safe-area-inset-left,0px))] bottom-0 h-[var(--hero-tray-height)] items-end gap-[var(--hero-marker-gap)] px-[var(--hero-tray-padding-inline)] border border-black/70 border-t-white/10 rounded-[2px] bg-[linear-gradient(180deg,var(--color-slate-700)_0%,var(--color-slate-950)_100%)] shadow-sm [transform:scale(var(--hero-tray-scale))] [transform-origin:left_bottom]";
const trayMobileClassName =
  "left-[calc(max(0px,env(safe-area-inset-left,0px))-(var(--hero-marker-width)*2/3))] bottom-[calc(env(safe-area-inset-bottom,0px)+0.25rem)] h-auto w-[var(--hero-marker-width)] flex-col items-center justify-end gap-[0.2rem] border-0 bg-transparent px-0 shadow-none before:hidden after:hidden";
const trayRailClassName =
  "pointer-events-none absolute left-[0.36rem] right-[0.36rem] top-px h-px rounded-full bg-linear-to-r from-white/40 to-transparent";
const traySlotBaseClassName = "relative z-[1] block w-[var(--hero-marker-width)] aspect-[148/44]";
const traySlotDesktopClassName = "[transform:translateY(var(--hero-marker-sit-y))]";
const trayButtonBaseClassName =
  "relative z-[1] m-0 inline-flex cursor-pointer justify-center rounded-full border-0 bg-transparent p-0 text-inherit [filter:none] transition-[transform,filter] duration-100 ease-[ease] focus-visible:outline-2 focus-visible:outline-slate-900 focus-visible:outline-offset-1";
const trayButtonDesktopClassName =
  "items-end [transform:translateY(var(--hero-marker-sit-y))] hover:[transform:translateY(var(--hero-marker-sit-y))] hover:drop-shadow-sm active:[transform:translateY(var(--hero-marker-sit-y))]";
const trayButtonMobileClassName =
  "items-center min-h-[calc((var(--hero-marker-width)*44/148)+0.18rem)] py-[0.08rem] [transform:translateY(0)] hover:[transform:translateY(0)] active:[transform:translateY(0)]";
const trayToolIconClassName = "block h-auto w-[var(--hero-marker-width)]";
const selectedMobileToolSlotClassName =
  "relative z-[1] block w-[var(--hero-marker-width)] min-h-[calc((var(--hero-marker-width)*44/148)+0.18rem)] py-[0.08rem] [--hero-marker-tip-x:calc(var(--hero-marker-width)*134.8/148)]";
const selectedMobileToolDropButtonClassName =
  "absolute left-[var(--hero-marker-tip-x)] top-1/2 z-[2] inline-flex h-[1.68rem] w-[1.68rem] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-black/30 bg-white/97 text-zinc-900 shadow-lg backdrop-blur-[2px] transition-[transform,background-color,border-color] duration-[160ms] ease-[ease] active:scale-[0.95] focus-visible:outline-3 focus-visible:outline-black focus-visible:outline-offset-1";
const selectedMobileToolDropIconClassName = "h-[1.02rem] w-[1.02rem] stroke-[2.9]";

export function getInitialSelectedMarkerId(): string | null {
  const fallbackMarkerId = WHITEBOARD_MARKER_OPTIONS[0]?.id ?? null;
  if (typeof window === "undefined") {
    return fallbackMarkerId;
  }
  if (window.innerWidth <= WHITEBOARD_MOBILE_BREAKPOINT_PX) {
    return null;
  }
  return fallbackMarkerId;
}

export function WhiteboardMarkerTray({
  selectedMarketId,
  setSelectedMarketId,
}: WhiteboardMarkerTrayProps) {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1200 : window.innerWidth,
  );
  const previousIsMobileViewportRef = useRef<boolean | null>(null);
  const isMobileViewport = viewportWidth <= WHITEBOARD_MOBILE_BREAKPOINT_PX;

  useEffect(() => {
    const syncViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    syncViewportWidth();
    window.addEventListener("resize", syncViewportWidth);
    window.addEventListener("orientationchange", syncViewportWidth);

    return () => {
      window.removeEventListener("resize", syncViewportWidth);
      window.removeEventListener("orientationchange", syncViewportWidth);
    };
  }, []);

  useEffect(() => {
    const wasMobileViewport = previousIsMobileViewportRef.current;
    if (wasMobileViewport === isMobileViewport) {
      return;
    }

    previousIsMobileViewportRef.current = isMobileViewport;
    if (isMobileViewport) {
      setSelectedMarketId(null);
      return;
    }

    setSelectedMarketId(
      (previous) => previous ?? WHITEBOARD_MARKER_OPTIONS[0]?.id ?? null,
    );
  }, [isMobileViewport, setSelectedMarketId]);

  const handleDropMarker = useCallback(() => {
    setSelectedMarketId(null);
  }, [setSelectedMarketId]);

  const trayClassName = `${trayBaseClassName} ${
    isMobileViewport ? trayMobileClassName : trayDesktopClassName
  }`;
  const traySlotClassName = `${traySlotBaseClassName} ${traySlotDesktopClassName}`;
  const trayButtonClassName = `${trayButtonBaseClassName} ${
    isMobileViewport ? trayButtonMobileClassName : trayButtonDesktopClassName
  }`;
  const renderToolIcon = (tool: WhiteboardTrayTool) =>
    tool.kind === "marker" ? (
      <WhiteboardMarkerIcon
        className={trayToolIconClassName}
        color={tool.color}
        includeSurfaceShadow={false}
      />
    ) : (
      <WhiteboardEraserIcon
        className={trayToolIconClassName}
        includeSurfaceShadow={false}
      />
    );

  return (
    <div className={trayClassName} role="toolbar" aria-label="whiteboard marker tray">
      {isMobileViewport ? null : (
        <span className={trayRailClassName} aria-hidden="true" />
      )}
      {WHITEBOARD_TRAY_TOOLS.map((tool) => {
        const isSelected = tool.id === selectedMarketId;
        if (isSelected) {
          if (isMobileViewport) {
            return (
              <span
                key={tool.id}
                className={selectedMobileToolSlotClassName}
                role="group"
                aria-label={`${tool.label} selected`}
              >
                <button
                  type="button"
                  className={selectedMobileToolDropButtonClassName}
                  onClick={handleDropMarker}
                  aria-label={`drop ${tool.label}`}
                  aria-pressed={false}
                >
                  <X className={selectedMobileToolDropIconClassName} aria-hidden="true" />
                </button>
              </span>
            );
          }

          return (
            <span
              key={tool.id}
              className={traySlotClassName}
              aria-hidden="true"
            />
          );
        }

        return (
          <button
            key={tool.id}
            type="button"
            className={trayButtonClassName}
            onClick={() => {
              setSelectedMarketId(tool.id);
            }}
            aria-label={`select ${tool.label}`}
            aria-pressed={false}
          >
            {renderToolIcon(tool)}
          </button>
        );
      })}
    </div>
  );
}
