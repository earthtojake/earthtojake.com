import { useState } from "react";
import type { CSSProperties, PropsWithChildren } from "react";

type ViewportContainerProps = PropsWithChildren<{
  className?: string;
  stackOrder?: number;
  heightMultiplier?: number;
}>;

function readViewportHeight(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const visualViewport = window.visualViewport;
  const measuredHeight =
    visualViewport?.height !== undefined
      ? visualViewport.height + (visualViewport.offsetTop ?? 0)
      : window.innerHeight;

  return Number.isFinite(measuredHeight) && measuredHeight > 0
    ? measuredHeight
    : null;
}

export function ViewportContainer({
  className,
  stackOrder,
  heightMultiplier = 1,
  children,
}: ViewportContainerProps) {
  const [lockedViewportHeight] = useState<number | null>(() =>
    readViewportHeight(),
  );

  const rootClassName = [
    "sticky top-0 w-full max-w-full",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const rootStyle: CSSProperties = {};
  if (typeof stackOrder === "number") {
    rootStyle.zIndex = stackOrder;
  }
  if (Number.isFinite(heightMultiplier) && heightMultiplier > 0) {
    const fixedHeight =
      lockedViewportHeight !== null
        ? `${lockedViewportHeight * heightMultiplier}px`
        : `calc(var(--landing-fixed-vh, 100vh) * ${heightMultiplier})`;
    rootStyle.height = fixedHeight;
    rootStyle.minHeight = fixedHeight;
  }

  return (
    <div
      className={rootClassName}
      style={Object.keys(rootStyle).length > 0 ? rootStyle : undefined}
    >
      {children}
    </div>
  );
}
