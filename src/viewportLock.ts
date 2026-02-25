const fallbackViewportHeight = 900;
const fallbackViewportWidth = 1440;

let lockedViewportHeight: number | null = null;
let lockedViewportWidth: number | null = null;

function clampViewportDimension(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return value;
}

function supportsLargeViewportUnits(): boolean {
  return (
    typeof window.CSS !== "undefined" &&
    typeof window.CSS.supports === "function" &&
    window.CSS.supports("height: 100lvh")
  );
}

function measureLargeViewportHeight(): number | null {
  if (!supportsLargeViewportUnits()) {
    return null;
  }

  const probe = document.createElement("div");
  probe.style.position = "fixed";
  probe.style.left = "0";
  probe.style.top = "0";
  probe.style.width = "1px";
  probe.style.height = "100lvh";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.zIndex = "-1";

  document.documentElement.appendChild(probe);
  const measuredHeight = probe.getBoundingClientRect().height;
  probe.remove();

  return Number.isFinite(measuredHeight) && measuredHeight > 0
    ? measuredHeight
    : null;
}

export function initializeViewportLock(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  if (lockedViewportHeight !== null && lockedViewportWidth !== null) {
    return;
  }

  const initialViewportHeight = clampViewportDimension(
    window.innerHeight,
    fallbackViewportHeight,
  );
  const largeViewportHeight = measureLargeViewportHeight();
  lockedViewportHeight = clampViewportDimension(
    Math.max(initialViewportHeight, largeViewportHeight ?? 0),
    fallbackViewportHeight,
  );
  lockedViewportWidth = clampViewportDimension(
    window.innerWidth,
    fallbackViewportWidth,
  );

  const root = document.documentElement;
  root.style.setProperty("--landing-fixed-vh", `${lockedViewportHeight}px`);
  root.style.setProperty("--landing-fixed-vw", `${lockedViewportWidth}px`);
}

export function getLockedViewportHeight(): number {
  initializeViewportLock();
  return lockedViewportHeight ?? fallbackViewportHeight;
}

export function getLockedViewportWidth(): number {
  initializeViewportLock();
  return lockedViewportWidth ?? fallbackViewportWidth;
}
