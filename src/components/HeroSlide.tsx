import { useEffect, useMemo, useState } from "react";
import heroEarthToDrawingPreset from "./drawings/earth-to.json";
import { UNDERLINE_BLUE, UNDERLINE_GREEN } from "../colors";
import { SHARED_UNDERLINE_LAYERS } from "../reveal/notationPresets";
import {
  Slide,
  type SimpleNotationConfig,
  type SlideConfig,
} from "../reveal/Slide";
import { HeroContactBar } from "./HeroContactBar";
import {
  estimateWhiteboardPresetIntroDurationMs,
  type WhiteboardDrawingData,
  type WhiteboardPresetConfig,
} from "./Whiteboard";
import { scaleRevealCadenceMs } from "../reveal/timing";

const nameCycleSample = "Jake";
const nameCycleLoadGraceMs = 220;
const nameCycleLoadTimeoutMs = 7000;
const nameCycleLoadingFrames = ["|", "/", "-", "\\"] as const;
const nameCycleFontFamilies = [
  "Inter",
  "Poppins",
  "Fira Sans",
  "Nunito Sans",
  "Oswald",
  "Roboto Slab",
  "Bree Serif",
  "Merriweather",
  "DynaPuff",
  "PT Serif",
  "Patrick Hand",
  "Lora",
  "Merienda",
  "Inconsolata",
  "Reenie Beanie",
  "Mountains of Christmas",
  "Indie Flower",
  "Freckle Face",
  "Barriecito",
  "Quantico",
  "Geo",
  "VT323",
] as const;

const rowRevealUnderlineDelayMs = scaleRevealCadenceMs(300);
const rowRevealDurationMs = 520;
const buildUnderlineColor = "var(--color-red-500)";
const heroInterRowRevealDelayMs = 500;
const heroRowRevealCadenceMs = scaleRevealCadenceMs(
  rowRevealDurationMs + heroInterRowRevealDelayMs,
);
const heroAutoRevealDelayAfterIntroMs = scaleRevealCadenceMs(250);
const heroIntroPresetForRevealTiming: WhiteboardPresetConfig = {
  id: "hero-signature-reveal-timing",
  data: heroEarthToDrawingPreset as WhiteboardDrawingData,
  fillColor: "var(--color-black)",
  placement: {
    yPct: 7.5,
    heightPct: 2.5,
  },
  timing: {
    pointDurationMs: 0.55,
    minDurationMs: 475,
    maxDurationMs: 1100,
    easeRampRatio: 0.06,
    delayMs: 0,
    playOnce: true,
  },
};
const heroFirstRowRevealDelayMs =
  estimateWhiteboardPresetIntroDurationMs(heroIntroPresetForRevealTiming) +
  heroAutoRevealDelayAfterIntroMs;
const heroProjectsRevealDelayMs =
  heroFirstRowRevealDelayMs + heroRowRevealCadenceMs;
const heroContactsRevealDelayMs =
  heroProjectsRevealDelayMs + heroRowRevealCadenceMs;

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function keywordUnderline(color: string): SimpleNotationConfig {
  return {
    type: "underline",
    color,
    delayMs: rowRevealUnderlineDelayMs,
    layers: [...SHARED_UNDERLINE_LAYERS],
  };
}

type HeroSlideProps = {
  id?: string;
  instantReveal?: boolean;
  revealed: boolean;
  skipRevealDelay?: boolean;
};

export function HeroSlide({
  id,
  instantReveal = false,
  revealed,
  skipRevealDelay = false,
}: HeroSlideProps) {
  const [isNameCycleRunning, setIsNameCycleRunning] = useState(true);
  const [areNameCycleFontsReady, setAreNameCycleFontsReady] = useState(false);
  const [nameCycleLoadingFrame, setNameCycleLoadingFrame] = useState(0);
  const [isSpinnerPreviewMode, setIsSpinnerPreviewMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setIsSpinnerPreviewMode(params.get("spinner") === "1");
  }, []);

  useEffect(() => {
    if (areNameCycleFontsReady && !isSpinnerPreviewMode) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNameCycleLoadingFrame(
        (previous) => (previous + 1) % nameCycleLoadingFrames.length,
      );
    }, 140);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [areNameCycleFontsReady, isSpinnerPreviewMode]);

  useEffect(() => {
    if (typeof document === "undefined" || !("fonts" in document)) {
      setAreNameCycleFontsReady(true);
      return;
    }

    const fontSet = document.fonts;
    let isCancelled = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!isCancelled) {
        setAreNameCycleFontsReady(true);
      }
    }, nameCycleLoadTimeoutMs);

    const warmUpFonts = async () => {
      try {
        await Promise.all(
          nameCycleFontFamilies.map((family) =>
            fontSet.load(`400 72px "${family}"`, nameCycleSample),
          ),
        );
        await fontSet.ready;
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, nameCycleLoadGraceMs);
        });
      } finally {
        window.clearTimeout(fallbackTimer);
        if (!isCancelled) {
          setAreNameCycleFontsReady(true);
        }
      }
    };

    void warmUpFonts();

    return () => {
      isCancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || !id) {
      return;
    }

    const section = document.getElementById(id);
    if (!section) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = Boolean(
          entry?.isIntersecting && entry.intersectionRatio > 0.55,
        );
        setIsNameCycleRunning(isVisible);
      },
      {
        threshold: [0, 0.25, 0.55, 0.8, 1],
      },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, [id]);

  const heroNameIsLoading = !areNameCycleFontsReady || isSpinnerPreviewMode;
  const heroNameWrapperClassName = joinClassNames(
    "relative h-[var(--slide-name-cycle-wrap-height)] w-full min-w-0 max-w-full overflow-visible px-3 pb-2 text-center [contain:layout_style] [overflow-anchor:none] [&>div]:absolute [&>div]:inset-0 [&>div]:flex [&>div]:items-center [&>div]:justify-center",
    heroNameIsLoading
      ? "font-mono text-6xl leading-[1.1] tracking-[0.04em] md:text-7xl"
      : "text-7xl leading-[1.22] [font-family:Inter,system-ui,sans-serif] md:text-9xl",
  );
  const heroNameRowClassName = `${heroNameIsLoading ? "m-0 block whitespace-nowrap" : "block w-auto max-w-full whitespace-nowrap pb-[0.08em] text-center"}${
    areNameCycleFontsReady && isNameCycleRunning && !isSpinnerPreviewMode
      ? " animate-[name-font-cycle_2.2s_steps(1,end)_infinite]"
      : ""
  }`;

  const slide = useMemo<SlideConfig>(() => {
    return {
      id: "hero-simple-slide",
      className: "h-full",
      topSpacerClassName: "w-full shrink-0 h-[11.5%]",
      rowsClassName: "items-center gap-2",
      rows: [
        {
          id: "hero-name",
          kind: "text",
          className: heroNameWrapperClassName,
          pretext: {
            maxLines: 1,
            lineHeightRatio: heroNameIsLoading ? 1.1 : 1.22,
            minFontScale: heroNameIsLoading ? 0.82 : 0.72,
          },
          reveal: {
            delayMs: heroFirstRowRevealDelayMs,
          },
          groups: [
            {
              id: "hero-name-text",
              text: heroNameIsLoading
                ? nameCycleLoadingFrames[nameCycleLoadingFrame]
                : "Jake",
              className: joinClassNames(
                "inline-block rounded-[0.35em] px-[0.25em] py-[0.08em]",
                heroNameRowClassName,
              ),
            },
          ],
        },
        {
          id: "hero-projects",
          kind: "text",
          className: "-mt-2 w-full px-3 text-center !text-lg md:!text-2xl",
          pretext: {
            maxLines: 1,
            targetFontSizePx: {
              mobile: 13,
              desktop: 24,
            },
            minFontScale: 0.78,
          },
          reveal: {
            delayMs: heroProjectsRevealDelayMs,
          },
          groups: [
            {
              id: "hero-text-to-cad-link",
              text: "text-to-cad",
              className: "mr-4 md:mr-5",
              href: "https://texttocad.dev",
              target: "_blank",
              rel: "noopener noreferrer",
              linkAppearance: "unstyled",
              showLinkIcon: true,
              notation: keywordUnderline(UNDERLINE_BLUE),
            },
            {
              id: "hero-derive-link",
              text: "derive.xyz",
              className: "mr-4 md:mr-5",
              href: "https://derive.xyz",
              target: "_blank",
              rel: "noopener noreferrer",
              linkAppearance: "unstyled",
              showLinkIcon: true,
              notation: keywordUnderline(UNDERLINE_GREEN),
            },
            {
              id: "hero-more-link",
              text: "more",
              href: "/projects",
              linkAppearance: "unstyled",
              showLinkIcon: false,
              notation: keywordUnderline(buildUnderlineColor),
            },
          ],
        },
        {
          id: "hero-links",
          kind: "custom",
          className: "pt-1 md:pt-2",
          reveal: {
            delayMs: heroContactsRevealDelayMs,
          },
          render: () => <HeroContactBar />,
        },
      ],
    };
  }, [
    areNameCycleFontsReady,
    heroNameWrapperClassName,
    heroNameIsLoading,
    heroNameRowClassName,
    isNameCycleRunning,
    isSpinnerPreviewMode,
    nameCycleLoadingFrame,
  ]);

  return (
    <Slide
      id={id}
      instantReveal={instantReveal}
      revealed={revealed}
      skipRevealDelay={skipRevealDelay}
      slide={slide}
      rowRevealDurationMs={rowRevealDurationMs}
      slideIndex={0}
    />
  );
}
