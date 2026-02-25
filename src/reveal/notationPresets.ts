import type { NotationLayerConfig } from "./notationTypes";

// Shared underline profile used across slides.
export const SHARED_UNDERLINE_LAYERS: ReadonlyArray<NotationLayerConfig> = [
  {
    strokeWidth: 1.2,
    iterations: 3,
    padding: [0, 1, 0, 1],
    animationDuration: 480,
    animate: true,
  },
] as const;
