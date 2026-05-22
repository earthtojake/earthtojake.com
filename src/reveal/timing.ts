export const revealCadenceScale = 0.5;

export function scaleRevealCadenceMs(milliseconds: number): number {
  if (!Number.isFinite(milliseconds)) {
    return 0;
  }

  return Math.max(0, Math.round(milliseconds * revealCadenceScale));
}
