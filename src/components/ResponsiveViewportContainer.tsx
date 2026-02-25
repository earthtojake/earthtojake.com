import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, PropsWithChildren } from "react";

type ResponsiveViewportContainerProps = PropsWithChildren<{
  className?: string;
  stackOrder?: number;
}>;

type ViewportSize = {
  height: number;
  width: number;
};

function normalizeDimension(value: number | undefined | null): number {
  if (!Number.isFinite(value) || value === undefined || value === null || value <= 0) {
    return 1;
  }

  return value;
}

function readViewportSize(): ViewportSize {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { height: 1, width: 1 };
  }

  const visualViewport = window.visualViewport;
  const visualViewportHeight =
    visualViewport?.height !== undefined
      ? visualViewport.height + (visualViewport.offsetTop ?? 0)
      : undefined;
  const visualViewportWidth =
    visualViewport?.width !== undefined
      ? visualViewport.width + (visualViewport.offsetLeft ?? 0)
      : undefined;

  return {
    height: normalizeDimension(
      visualViewportHeight ??
        window.innerHeight ??
        document.documentElement.clientHeight,
    ),
    width: normalizeDimension(
      visualViewportWidth ??
        window.innerWidth ??
        document.documentElement.clientWidth,
    ),
  };
}

function supportsDynamicViewportUnits(): boolean {
  if (typeof window === "undefined" || typeof window.CSS === "undefined") {
    return false;
  }

  return (
    typeof window.CSS.supports === "function" &&
    window.CSS.supports("height: 100dvh")
  );
}

export function ResponsiveViewportContainer({
  className,
  stackOrder,
  children,
}: ResponsiveViewportContainerProps) {
  const useJavaScriptViewportSizing = !supportsDynamicViewportUnits();
  const [viewportSize, setViewportSize] = useState<ViewportSize | null>(() =>
    typeof window === "undefined" || !useJavaScriptViewportSizing
      ? null
      : readViewportSize(),
  );

  useEffect(() => {
    if (typeof window === "undefined" || !useJavaScriptViewportSizing) {
      return;
    }

    let frame = 0;
    let trailingTimeout = 0;
    const syncViewportSize = () => {
      frame = 0;
      const next = readViewportSize();
      setViewportSize((previous) => {
        if (
          previous !== null &&
          Math.abs(previous.height - next.height) < 0.5 &&
          Math.abs(previous.width - next.width) < 0.5
        ) {
          return previous;
        }

        return next;
      });
    };
    const scheduleViewportSync = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      if (trailingTimeout) {
        clearTimeout(trailingTimeout);
      }

      frame = requestAnimationFrame(syncViewportSize);
      trailingTimeout = window.setTimeout(syncViewportSize, 140);
    };

    scheduleViewportSync();
    window.addEventListener("resize", scheduleViewportSync);
    window.addEventListener("orientationchange", scheduleViewportSync);
    window.addEventListener("scroll", scheduleViewportSync, { passive: true });
    window.addEventListener("pageshow", scheduleViewportSync);

    // iOS Safari can change visual viewport without a window resize event.
    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", scheduleViewportSync);
    visualViewport?.addEventListener("scroll", scheduleViewportSync);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      if (trailingTimeout) {
        clearTimeout(trailingTimeout);
      }

      window.removeEventListener("resize", scheduleViewportSync);
      window.removeEventListener("orientationchange", scheduleViewportSync);
      window.removeEventListener("scroll", scheduleViewportSync);
      window.removeEventListener("pageshow", scheduleViewportSync);
      visualViewport?.removeEventListener("resize", scheduleViewportSync);
      visualViewport?.removeEventListener("scroll", scheduleViewportSync);
    };
  }, [useJavaScriptViewportSizing]);

  const rootClassName = [
    "h-screen min-h-screen w-full max-w-full supports-[height:100dvh]:h-[100dvh] supports-[height:100dvh]:min-h-[100dvh]",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const rootStyle = useMemo<CSSProperties>(() => {
    const nextStyle: CSSProperties = {};

    if (typeof stackOrder === "number") {
      nextStyle.zIndex = stackOrder;
    }
    if (useJavaScriptViewportSizing && viewportSize !== null) {
      nextStyle.height = `${viewportSize.height}px`;
      nextStyle.minHeight = `${viewportSize.height}px`;
    }

    return nextStyle;
  }, [stackOrder, useJavaScriptViewportSizing, viewportSize]);

  return (
    <div className={rootClassName} style={rootStyle}>
      {children}
    </div>
  );
}
