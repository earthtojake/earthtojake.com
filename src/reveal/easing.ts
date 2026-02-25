import { clamp } from "./math";

export type EasingName = "linear" | "easeOutCubic" | "easeInOutCubic";

const easingMap: Record<EasingName, (value: number) => number> = {
  linear: (value) => value,
  easeOutCubic: (value) => 1 - Math.pow(1 - value, 3),
  easeInOutCubic: (value) =>
    value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2,
};

export function applyEasing(progress: number, easing: EasingName = "easeOutCubic"): number {
  return easingMap[easing](clamp(progress, 0, 1));
}
