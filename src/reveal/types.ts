import type { CSSProperties } from "react";
import type { EasingName } from "./easing";

export type RevealStyleState = {
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  blur?: number;
  letterSpacing?: number;
};

export type ViewportRevealConfig = {
  // Fraction of viewport height to clear from the bottom edge before reveal.
  // Example: 0.2 means item.bottom must be above 80% of viewport height.
  bottomClearance?: number;
  requireFullyVisible?: boolean;
  oneShot?: boolean;
  durationMs?: number;
};

export type RevealItemConfig = {
  id: string;
  start: number;
  end: number;
  easing?: EasingName;
  from?: RevealStyleState;
  to?: RevealStyleState;
  className?: string;
  style?: CSSProperties;
  viewportReveal?: ViewportRevealConfig;
};
