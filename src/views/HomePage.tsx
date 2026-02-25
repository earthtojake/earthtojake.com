import { useEffect, useState } from "react";
import arrowSingleDownDrawingPreset from "../components/drawings/arrow-down.json";
import heroEarthToDrawingPreset from "../components/drawings/earth-to.json";
import scrollForBuildsDrawingPreset from "../components/drawings/scroll-for-builds.json";
import worldInHandV3HandFillDrawingPreset from "../components/drawings/world-in-hand-hand-fill.json";
import worldInHandV3LandFillADrawingPreset from "../components/drawings/world-in-hand-land-fill-a.json";
import worldInHandV3LandFillBDrawingPreset from "../components/drawings/world-in-hand-land-fill-b.json";
import worldInHandV3OceanFillDrawingPreset from "../components/drawings/world-in-hand-ocean-fill.json";
import worldInHandV3OutlineDrawingPreset from "../components/drawings/world-in-hand-outline.json";
import {
  WHITEBOARD_MARKER_OPTIONS,
  Whiteboard,
  estimateWhiteboardPresetIntroDurationMs,
  type WhiteboardDrawingData,
  type WhiteboardPresetConfig,
} from "../components/Whiteboard";
import { ContentSlides } from "../components/ContentSlides";
import { HeroSlide } from "../components/HeroSlide";
import {
  getInitialSelectedMarkerId,
  WhiteboardMarkerTray,
} from "../components/WhiteboardMarkerTray";
import { BouncingFunFacts } from "../components/BouncingFunFacts";
import { ResponsiveViewportContainer } from "../components/ResponsiveViewportContainer";
import { ViewportContainer } from "../components/ViewportContainer";
import {
  REQUEST_SKIP_REVEAL_EVENT,
  type RequestSkipRevealDetail,
} from "../reveal/skipRevealEvents";

const rowRevealUnderlineDelayMs = 0;
const buildUnderlineRevealDurationMs = 520;
const buildUnderlineColor = "var(--color-red-500)";
const heroInterRowRevealDelayMs = 500;
const heroRowRevealDurationMs = buildUnderlineRevealDurationMs;
const heroFirstRowRevealStartMs = 0;
const heroDeriveRevealStartMs =
  heroFirstRowRevealStartMs +
  heroRowRevealDurationMs +
  heroInterRowRevealDelayMs;
const heroBuildRevealStartMs =
  heroDeriveRevealStartMs + heroRowRevealDurationMs + heroInterRowRevealDelayMs;
const heroContactsRevealStartMs =
  heroBuildRevealStartMs + heroRowRevealDurationMs + heroInterRowRevealDelayMs;
const heroContactsRevealEndMs =
  heroContactsRevealStartMs + heroRowRevealDurationMs;
const firstSlideAutoRevealDurationMs = heroContactsRevealEndMs + 320;
const heroAutoRevealDelayAfterIntroMs = 250;
const heroIntroPreset: WhiteboardPresetConfig = {
  id: "hero-signature",
  data: heroEarthToDrawingPreset as WhiteboardDrawingData,
  fillColor: "var(--color-black)",
  strokeOptions: {
    desktop: {
      size: 3.375,
      thinning: 0,
      smoothing: 0.66,
      streamline: 0.36,
      simulatePressure: false,
      start: { cap: true, taper: 0 },
      end: { cap: true, taper: 0 },
    },
    mobile: {
      size: 2.64375,
      thinning: 0,
      smoothing: 0.66,
      streamline: 0.36,
      simulatePressure: false,
      start: { cap: true, taper: 0 },
      end: { cap: true, taper: 0 },
    },
  },
  placement: {
    yPct: { desktop: 7.5, mobile: 10 },
    heightPct: { desktop: 2.5, mobile: 2 },
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
const estimatedPresetIntroDurationMs =
  estimateWhiteboardPresetIntroDurationMs(heroIntroPreset);
const heroAutoRevealDelayMs =
  estimatedPresetIntroDurationMs + heroAutoRevealDelayAfterIntroMs;
const heroFinalRevealStartDelayMs =
  heroAutoRevealDelayMs + heroContactsRevealStartMs;
const heroWhiteboardPresets: WhiteboardPresetConfig[] = [
  heroIntroPreset,
  {
    id: "hero-world-in-hand-fill-skin",
    data: worldInHandV3HandFillDrawingPreset as WhiteboardDrawingData,
    fillColor: "var(--color-orange-200)",
    fillOpacity: 0.82,
    strokeOptions: {
      desktop: {
        size: 6.2,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
      mobile: {
        size: 6.9,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
    },
    placement: {
      yPct: { desktop: 55, mobile: 50 },
      heightPct: { desktop: 30, mobile: 35 },
    },
    timing: {
      pointDurationMs: 0.16,
      minDurationMs: 900,
      maxDurationMs: 2000,
      easeRampRatio: 0.06,
      delayMs: heroFinalRevealStartDelayMs,
      playOnce: true,
    },
  },
  {
    id: "hero-world-in-hand-fill-ocean",
    data: worldInHandV3OceanFillDrawingPreset as WhiteboardDrawingData,
    fillColor: "var(--color-blue-500)",
    fillOpacity: 0.52,
    strokeOptions: {
      desktop: {
        size: 5.7,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
      mobile: {
        size: 6.3,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
    },
    placement: {
      yPct: { desktop: 55, mobile: 50 },
      heightPct: { desktop: 30, mobile: 35 },
    },
    timing: {
      pointDurationMs: 0.16,
      minDurationMs: 900,
      maxDurationMs: 1800,
      easeRampRatio: 0.06,
      delayMs: heroFinalRevealStartDelayMs + 140,
      playOnce: true,
    },
  },
  {
    id: "hero-world-in-hand-fill-land-a",
    data: worldInHandV3LandFillADrawingPreset as WhiteboardDrawingData,
    fillColor: "var(--color-green-500)",
    fillOpacity: 0.98,
    strokeOptions: {
      desktop: {
        size: 6.7,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
      mobile: {
        size: 7.4,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
    },
    placement: {
      yPct: { desktop: 55, mobile: 50 },
      heightPct: { desktop: 30, mobile: 35 },
    },
    timing: {
      pointDurationMs: 0.14,
      minDurationMs: 900,
      maxDurationMs: 1900,
      easeRampRatio: 0.06,
      delayMs: heroFinalRevealStartDelayMs + 300,
      playOnce: true,
    },
  },
  {
    id: "hero-world-in-hand-fill-land-b",
    data: worldInHandV3LandFillBDrawingPreset as WhiteboardDrawingData,
    fillColor: "var(--color-green-500)",
    fillOpacity: 0.9,
    strokeOptions: {
      desktop: {
        size: 6.1,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
      mobile: {
        size: 6.8,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
    },
    placement: {
      yPct: { desktop: 55, mobile: 50 },
      heightPct: { desktop: 30, mobile: 35 },
    },
    timing: {
      pointDurationMs: 0.14,
      minDurationMs: 900,
      maxDurationMs: 1900,
      easeRampRatio: 0.06,
      delayMs: heroFinalRevealStartDelayMs + 460,
      playOnce: true,
    },
  },
  {
    id: "hero-world-in-hand-outline",
    data: worldInHandV3OutlineDrawingPreset as WhiteboardDrawingData,
    fillColor: "var(--color-slate-900)",
    strokeOptions: {
      desktop: {
        size: 3.9,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
      mobile: {
        size: 4.35,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
    },
    placement: {
      yPct: { desktop: 55, mobile: 50 },
      heightPct: { desktop: 30, mobile: 35 },
    },
    timing: {
      pointDurationMs: 0.22,
      minDurationMs: 1100,
      maxDurationMs: 3000,
      easeRampRatio: 0.06,
      delayMs: heroFinalRevealStartDelayMs + 620,
      playOnce: true,
    },
  },
];
const heroScrollPromptPresetDelayMs = heroFinalRevealStartDelayMs;
const heroWhiteboardScrollPromptPresets: WhiteboardPresetConfig[] = [
  {
    id: "hero-scroll-journey-text",
    data: scrollForBuildsDrawingPreset as WhiteboardDrawingData,
    fillColor: "var(--color-slate-900)",
    strokeOptions: {
      desktop: {
        size: 2.1,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
      mobile: {
        size: 2.6,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
    },
    placement: {
      yPct: { desktop: 95, mobile: 92.5 },
      heightPct: { desktop: 1.5, mobile: 1.5 },
    },
    timing: {
      pointDurationMs: 0.18,
      minDurationMs: 320,
      maxDurationMs: 320,
      easeRampRatio: 0.06,
      delayMs: heroScrollPromptPresetDelayMs,
      playOnce: true,
    },
  },
  {
    id: "hero-scroll-journey-arrow",
    data: arrowSingleDownDrawingPreset as WhiteboardDrawingData,
    fillColor: "var(--color-slate-900)",
    strokeOptions: {
      desktop: {
        size: 2.1,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
      mobile: {
        size: 2.5,
        thinning: 0,
        smoothing: 0.58,
        streamline: 0.3,
        simulatePressure: false,
        start: { cap: true, taper: 0 },
        end: { cap: true, taper: 0 },
      },
    },
    placement: {
      yPct: { desktop: 98.37, mobile: 97 },
      heightPct: { desktop: 1.26, mobile: 1.26 },
    },
    timing: {
      pointDurationMs: 0.18,
      minDurationMs: 220,
      maxDurationMs: 220,
      easeRampRatio: 0.06,
      delayMs: heroScrollPromptPresetDelayMs,
      playOnce: true,
    },
  },
];
const heroWhiteboardAllPresets: WhiteboardPresetConfig[] = [
  ...heroWhiteboardPresets,
  ...heroWhiteboardScrollPromptPresets,
];
const heroRevealSequenceDurationMs = Math.max(
  firstSlideAutoRevealDurationMs,
  ...heroWhiteboardAllPresets.map((preset) =>
    estimateWhiteboardPresetIntroDurationMs(preset),
  ),
);
const heroSlideAnchorId = "hero";

export function HomePage() {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(
    getInitialSelectedMarkerId,
  );
  const [heroSkipRevealDelay, setHeroSkipRevealDelay] = useState(false);
  const [heroRevealInProgress, setHeroRevealInProgress] = useState(true);
  const selectedMarkerColor =
    WHITEBOARD_MARKER_OPTIONS.find((marker) => marker.id === selectedMarkerId)
      ?.color ?? null;

  useEffect(() => {
    if (heroSkipRevealDelay || heroRevealSequenceDurationMs <= 0) {
      setHeroRevealInProgress(false);
      return;
    }

    setHeroRevealInProgress(true);
    const timeoutId = window.setTimeout(() => {
      setHeroRevealInProgress(false);
    }, heroRevealSequenceDurationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [heroSkipRevealDelay]);

  useEffect(() => {
    const handleSkipRevealRequest = (rawEvent: Event) => {
      const event = rawEvent as CustomEvent<RequestSkipRevealDetail>;
      const detail = event.detail;
      if (!detail || detail.anchorId !== heroSlideAnchorId) {
        return;
      }

      if (!heroRevealInProgress || heroSkipRevealDelay) {
        return;
      }

      setHeroSkipRevealDelay(true);
      detail.handled = true;
    };

    window.addEventListener(REQUEST_SKIP_REVEAL_EVENT, handleSkipRevealRequest);
    return () => {
      window.removeEventListener(
        REQUEST_SKIP_REVEAL_EVENT,
        handleSkipRevealRequest,
      );
    };
  }, [heroRevealInProgress, heroSkipRevealDelay]);

  useEffect(() => {
    if (heroSkipRevealDelay) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    let frame = 0;
    let observer: IntersectionObserver | null = null;

    const observeNextSlide = () => {
      const nextSlide = document.getElementById("encounter");
      if (!nextSlide) {
        frame = window.requestAnimationFrame(observeNextSlide);
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting || entry.intersectionRatio < 0.3) {
            return;
          }

          setHeroSkipRevealDelay(true);
          observer?.disconnect();
        },
        {
          threshold: [0, 0.3, 1],
        },
      );

      observer.observe(nextSlide);
    };

    observeNextSlide();

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      observer?.disconnect();
    };
  }, [heroSkipRevealDelay]);

  return (
    <main className="relative w-full select-none">
      <div className="relative z-[1]">
        <WhiteboardMarkerTray
          selectedMarketId={selectedMarkerId}
          setSelectedMarketId={setSelectedMarkerId}
        />

        <ViewportContainer stackOrder={0}>
          <div className="relative h-full w-full">
            <ResponsiveViewportContainer>
              <Whiteboard
                className="h-full min-h-full w-full"
                presets={heroWhiteboardAllPresets}
                skipRevealDelay={heroSkipRevealDelay}
                selectedMarkerColor={selectedMarkerColor}
                selectedToolId={selectedMarkerId}
              >
                <div
                  className="relative h-full w-full"
                  onClick={() => {
                    if (!heroSkipRevealDelay) {
                      setHeroSkipRevealDelay(true);
                    }
                  }}
                >
                  <HeroSlide
                    id={heroSlideAnchorId}
                    revealed={true}
                    skipRevealDelay={heroSkipRevealDelay}
                  />
                </div>
              </Whiteboard>
            </ResponsiveViewportContainer>
            <BouncingFunFacts skipRevealDelay={heroSkipRevealDelay} />
          </div>
        </ViewportContainer>

        <ContentSlides
          selectedMarkerColor={selectedMarkerColor}
          selectedToolId={selectedMarkerId}
        />
      </div>
    </main>
  );
}
