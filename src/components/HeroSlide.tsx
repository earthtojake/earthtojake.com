import { useEffect, useMemo, useState } from "react";
import heroEarthToDrawingPreset from "./drawings/earth-to.json";
import { UNDERLINE_ORANGE } from "../colors";
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

const rowRevealUnderlineDelayMs = 300;
const rowRevealDurationMs = 520;
const buildUnderlineColor = "var(--color-red-500)";
const heroInterRowRevealDelayMs = 500;
const heroAutoRevealDelayAfterIntroMs = 250;
const heroIntroPresetForRevealTiming: WhiteboardPresetConfig = {
  id: "hero-signature-reveal-timing",
  data: heroEarthToDrawingPreset as WhiteboardDrawingData,
  fillColor: "var(--color-black)",
  placement: {
    yPct: 7.5,
    heightPct: 2.5,
  },
  timing: {
    pointDurationMs: 1.1,
    minDurationMs: 950,
    maxDurationMs: 2200,
    easeRampRatio: 0.06,
    delayMs: 0,
    playOnce: true,
  },
};
const heroFirstRowRevealDelayMs =
  estimateWhiteboardPresetIntroDurationMs(heroIntroPresetForRevealTiming) +
  heroAutoRevealDelayAfterIntroMs;
const heroDeriveRevealDelayMs =
  heroFirstRowRevealDelayMs + rowRevealDurationMs + heroInterRowRevealDelayMs;
const heroBuildRevealDelayMs =
  heroDeriveRevealDelayMs + rowRevealDurationMs + heroInterRowRevealDelayMs;
const heroContactsRevealDelayMs =
  heroBuildRevealDelayMs + rowRevealDurationMs + heroInterRowRevealDelayMs;

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
  revealed: boolean;
  skipRevealDelay?: boolean;
};

export function HeroSlide({
  id,
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
  const heroNameRowClassName = `${heroNameIsLoading ? "m-0 block whitespace-nowrap font-mono !text-6xl md:!text-7xl leading-[1.1] tracking-[0.04em]" : "block w-auto max-w-full whitespace-nowrap pb-[0.08em] text-center !text-7xl md:!text-9xl leading-[1.22] [font-family:Inter,system-ui,sans-serif]"}${
    areNameCycleFontsReady && isNameCycleRunning && !isSpinnerPreviewMode
      ? " animate-[name-font-cycle_2.2s_steps(1,end)_infinite]"
      : ""
  }`;

  const slide = useMemo<SlideConfig>(() => {
    return {
      id: "hero-simple-slide",
      className: "h-full",
      topSpacerClassName: "w-full shrink-0 h-[15%]",
      rowsClassName: "items-center gap-2",
      rows: [
        {
          id: "hero-name",
          kind: "text",
          className:
            "relative h-[var(--slide-name-cycle-wrap-height)] w-full min-w-0 max-w-full overflow-hidden px-3 text-center [contain:layout_paint_style] [overflow-anchor:none] [&>div]:absolute [&>div]:inset-0 [&>div]:flex [&>div]:items-center [&>div]:justify-center",
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
          id: "hero-derive",
          kind: "text",
          className: "px-3 text-center !text-lg md:!text-2xl",
          reveal: {
            delayMs: heroDeriveRevealDelayMs,
          },
          groups: [
            {
              id: "hero-derive-prefix",
              text: "cofounded ",
            },
            {
              id: "hero-derive-link",
              text: "derive.xyz",
              href: "https://www.derive.xyz",
              target: "_blank",
              rel: "noopener noreferrer",
              linkAppearance: "unstyled",
              showLinkIcon: false,
              notation: keywordUnderline(UNDERLINE_ORANGE),
            },
          ],
        },
        {
          id: "hero-build",
          kind: "text",
          className: "px-3 text-center !text-lg md:!text-2xl",
          reveal: {
            delayMs: heroBuildRevealDelayMs,
          },
          groups: [
            {
              id: "hero-build-prefix",
              text: "interested in ",
            },
            {
              id: "hero-build-link",
              text: "robots",
              href: "#robots",
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
    heroNameIsLoading,
    heroNameRowClassName,
    isNameCycleRunning,
    isSpinnerPreviewMode,
    nameCycleLoadingFrame,
  ]);

  return (
    <Slide
      id={id}
      revealed={revealed}
      skipRevealDelay={skipRevealDelay}
      slide={slide}
      rowRevealDurationMs={rowRevealDurationMs}
      slideIndex={0}
    />
  );
}
