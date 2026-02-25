export type NotationBracketSide = "left" | "right" | "top" | "bottom";

export type NotationLayerConfig = {
  strokeWidth?: number;
  iterations?: number;
  padding?: [number, number, number, number];
  animationDuration?: number;
  animate?: boolean;
};
