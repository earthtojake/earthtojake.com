import { useEffect, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import { applyEasing } from "./easing";
import { clamp, lerp } from "./math";
import type { RevealItemConfig, RevealStyleState } from "./types";
import { getLockedViewportHeight, getLockedViewportWidth } from "../viewportLock";

const defaultFrom: Required<RevealStyleState> = {
  opacity: 0,
  x: 0,
  y: 42,
  scale: 0.985,
  rotate: 0,
  blur: 8,
  letterSpacing: 0,
};

const defaultTo: Required<RevealStyleState> = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
  blur: 0,
  letterSpacing: 0,
};

function resolveRange(
  key: keyof RevealStyleState,
  from: RevealStyleState | undefined,
  to: RevealStyleState | undefined
): [number, number] {
  const start = from?.[key] ?? defaultFrom[key];
  const end = to?.[key] ?? defaultTo[key];
  return [start, end];
}

type RevealItemProps = PropsWithChildren<{
  progress: number;
  config: RevealItemConfig;
  onRevealed?: () => void;
}>;

export function RevealItem({
  progress,
  config,
  children,
  onRevealed,
}: RevealItemProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const usesViewportReveal = Boolean(config.viewportReveal);
  const bottomClearance = clamp(config.viewportReveal?.bottomClearance ?? 0.2, 0, 1);
  const requireFullyVisible = config.viewportReveal?.requireFullyVisible ?? true;
  const oneShot = config.viewportReveal?.oneShot ?? true;
  const durationMs = Math.max(config.viewportReveal?.durationMs ?? 520, 1);
  const [isVisibleTrigger, setIsVisibleTrigger] = useState(false);
  const [viewportProgress, setViewportProgress] = useState(0);
  const viewportProgressRef = useRef(0);
  const hasNotifiedRevealRef = useRef(false);
  const previousTopRef = useRef<number | null>(null);
  const previousShouldRevealRef = useRef(false);
  const revealedRef = useRef(false);

  useEffect(() => {
    if (!usesViewportReveal) {
      return;
    }

    let frame = 0;
    let pendingResetFromLayoutChange = false;
    const isTouchLikeDevice =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(hover: none) and (pointer: coarse)").matches
        : "ontouchstart" in window;

    const evaluate = () => {
      const element = wrapperRef.current;
      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = getLockedViewportHeight();
      const viewportWidth = getLockedViewportWidth();

      const fullyVisibleY = rect.top >= 0 && rect.bottom <= viewportHeight;
      const fullyVisibleX = rect.left >= 0 && rect.right <= viewportWidth;
      const visible = rect.bottom > 0 && rect.top < viewportHeight;
      const visibilityPasses = requireFullyVisible
        ? fullyVisibleX && fullyVisibleY
        : visible;

      // "Clearing X% from bottom" means item bottom must move above the
      // (1 - X) viewport line. For X=0.2, bottom must be above 80% of viewport height.
      const clearanceLine = viewportHeight * (1 - bottomClearance);
      const clearedBottomZone = rect.bottom <= clearanceLine;
      const shouldReveal = visibilityPasses && clearedBottomZone;
      const previousTop = previousTopRef.current;
      const isScrollingUp =
        previousTop !== null && rect.top > previousTop + 0.1;

      if (shouldReveal) {
        if (!revealedRef.current) {
          revealedRef.current = true;
          setIsVisibleTrigger(true);
        }
      } else if (
        !oneShot &&
        revealedRef.current &&
        (pendingResetFromLayoutChange ||
          (isScrollingUp && previousShouldRevealRef.current))
      ) {
        revealedRef.current = false;
        setIsVisibleTrigger(false);
      }

      previousTopRef.current = rect.top;
      previousShouldRevealRef.current = shouldReveal;
      pendingResetFromLayoutChange = false;
    };

    const scheduleEvaluate = (forceReset = false) => {
      if (forceReset) {
        pendingResetFromLayoutChange = true;
      }

      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(evaluate);
    };

    const onScroll = () => {
      scheduleEvaluate(false);
    };
    const onResize = () => {
      scheduleEvaluate(true);
    };
    const element = wrapperRef.current;
    let layoutObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && element) {
      layoutObserver = new ResizeObserver(() => {
        scheduleEvaluate(true);
      });
      layoutObserver.observe(element);
      if (element.parentElement) {
        layoutObserver.observe(element.parentElement);
      }
    }

    scheduleEvaluate(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!isTouchLikeDevice) {
      window.addEventListener("resize", onResize);
    }
    window.addEventListener("orientationchange", onResize);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      layoutObserver?.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (!isTouchLikeDevice) {
        window.removeEventListener("resize", onResize);
      }
      window.removeEventListener("orientationchange", onResize);
    };
  }, [usesViewportReveal, bottomClearance, requireFullyVisible, oneShot]);

  useEffect(() => {
    if (!usesViewportReveal) {
      return;
    }

    let frame = 0;
    const from = viewportProgressRef.current;
    const to = isVisibleTrigger ? 1 : 0;

    if (Math.abs(from - to) < 0.001) {
      if (viewportProgressRef.current !== to) {
        viewportProgressRef.current = to;
        setViewportProgress(to);
      }
      return;
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = clamp(elapsed / durationMs, 0, 1);
      const next = lerp(from, to, t);
      viewportProgressRef.current = next;
      setViewportProgress(next);

      if (t < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    frame = requestAnimationFrame(step);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [usesViewportReveal, isVisibleTrigger, durationMs]);

  const span = Math.max(config.end - config.start, 0.0001);
  const timedProgress = clamp((progress - config.start) / span, 0, 1);
  const localProgress = usesViewportReveal ? viewportProgress : timedProgress;
  const eased = applyEasing(localProgress, config.easing);

  useEffect(() => {
    if (!onRevealed || hasNotifiedRevealRef.current || localProgress < 0.999) {
      return;
    }

    hasNotifiedRevealRef.current = true;
    onRevealed();
  }, [localProgress, onRevealed]);

  const [opacityStart, opacityEnd] = resolveRange("opacity", config.from, config.to);
  const [xStart, xEnd] = resolveRange("x", config.from, config.to);
  const [yStart, yEnd] = resolveRange("y", config.from, config.to);
  const [scaleStart, scaleEnd] = resolveRange("scale", config.from, config.to);
  const [rotateStart, rotateEnd] = resolveRange("rotate", config.from, config.to);
  const [blurStart, blurEnd] = resolveRange("blur", config.from, config.to);
  const [trackingStart, trackingEnd] = resolveRange(
    "letterSpacing",
    config.from,
    config.to
  );

  const opacity = lerp(opacityStart, opacityEnd, eased);
  const x = lerp(xStart, xEnd, eased);
  const y = lerp(yStart, yEnd, eased);
  const scale = lerp(scaleStart, scaleEnd, eased);
  const rotate = lerp(rotateStart, rotateEnd, eased);
  const blur = lerp(blurStart, blurEnd, eased);
  const letterSpacing = lerp(trackingStart, trackingEnd, eased);
  const isIdentityTransform =
    Math.abs(x) < 0.001 &&
    Math.abs(y) < 0.001 &&
    Math.abs(scale - 1) < 0.001 &&
    Math.abs(rotate) < 0.001;
  const isIdentityBlur = blur <= 0.05;
  const isIdentityLetterSpacing = Math.abs(letterSpacing) < 0.0001;
  const isIdentityOpacity = Math.abs(opacity - 1) < 0.001;
  const willChangeParts: string[] = [];
  if (!isIdentityTransform) {
    willChangeParts.push("transform");
  }
  if (!isIdentityOpacity) {
    willChangeParts.push("opacity");
  }
  if (!isIdentityBlur) {
    willChangeParts.push("filter");
  }

  const animatedStyle = {
    opacity,
    transform: isIdentityTransform
      ? undefined
      : `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`,
    filter: isIdentityBlur ? undefined : `blur(${blur}px)`,
    letterSpacing: isIdentityLetterSpacing ? undefined : `${letterSpacing}em`,
    height: "100%",
    minHeight: 0,
    willChange: willChangeParts.length > 0 ? willChangeParts.join(", ") : undefined,
  };
  const wrapperStyle = {
    ...config.style,
    pointerEvents:
      localProgress > 0.001 ? config.style?.pointerEvents : ("none" as const),
  };

  return (
    <div className={config.className ?? ""} ref={wrapperRef} style={wrapperStyle}>
      <div style={animatedStyle}>{children}</div>
    </div>
  );
}
