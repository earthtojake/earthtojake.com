export const REQUEST_SKIP_REVEAL_EVENT = "slide:request-skip-reveal";

export type RequestSkipRevealDetail = {
  anchorId: string;
  handled: boolean;
};
