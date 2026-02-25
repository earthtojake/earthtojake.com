"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { initializeViewportLock } from "../viewportLock";
import {
  REQUEST_SKIP_REVEAL_EVENT,
  type RequestSkipRevealDetail,
} from "../reveal/skipRevealEvents";
import "photoswipe/style.css";

const baseTitle = "earthtojake.com";
const titleWaveIntervalMs = 10_000;
const titleWaveStaggerMs = 120;
const titleWaveFrameIntervalMs = 80;
const titleWaveRandomFrames = 3;
const titleWaveAsciiChars = "$*#&@!?%";
const desktopSlideNavigationMinWidthPx = 1024;
const desktopSlideNavigationMediaQuery = `(min-width: ${desktopSlideNavigationMinWidthPx}px)`;

function randomAsciiCharacter(): string {
  const randomIndex = Math.floor(Math.random() * titleWaveAsciiChars.length);
  return titleWaveAsciiChars[randomIndex] ?? "#";
}

function isDesktopViewportForSlideNavigation(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(desktopSlideNavigationMediaQuery).matches;
}

function isInteractiveEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const editableTarget = target.closest(
    "input, textarea, select, [contenteditable='true']",
  );
  if (editableTarget) {
    return true;
  }

  return Boolean(target.closest(".pswp, [role='dialog']"));
}

function getSlideSections(): HTMLElement[] {
  if (typeof document === "undefined") {
    return [];
  }

  return Array.from(document.querySelectorAll<HTMLElement>("main section[id]"));
}

function getSlideWrappers(): HTMLElement[] {
  if (typeof document === "undefined") {
    return [];
  }

  return Array.from(
    document.querySelectorAll<HTMLElement>("main > div > div.sticky.top-0"),
  );
}

type SlideTarget = {
  section: HTMLElement;
  startY: number;
};

function getSlideNavigationDirection(event: KeyboardEvent): -1 | 1 | 0 {
  if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
    return -1;
  }

  if (
    event.key === "ArrowDown" ||
    event.key === "ArrowRight" ||
    event.key === " " ||
    event.key === "Spacebar"
  ) {
    return 1;
  }

  return 0;
}

function requestSkipRevealForSlide(anchorId: string): boolean {
  const detail: RequestSkipRevealDetail = {
    anchorId,
    handled: false,
  };
  const skipRevealEvent = new CustomEvent<RequestSkipRevealDetail>(
    REQUEST_SKIP_REVEAL_EVENT,
    {
      detail,
    },
  );

  window.dispatchEvent(skipRevealEvent);
  return detail.handled;
}

function getSlideTargets(): SlideTarget[] {
  const slideWrappers = getSlideWrappers();
  if (slideWrappers.length > 0) {
    const slideTargets: SlideTarget[] = [];
    let startY = 0;

    for (const slideWrapper of slideWrappers) {
      const slideSection = slideWrapper.querySelector<HTMLElement>("section[id]");
      if (slideSection) {
        slideTargets.push({
          section: slideSection,
          startY,
        });
      }

      startY += slideWrapper.offsetHeight;
    }

    if (slideTargets.length > 0) {
      return slideTargets;
    }
  }

  return getSlideSections().map((section) => ({
    section,
    startY: section.getBoundingClientRect().top + window.scrollY,
  }));
}

function resolveCurrentSlideIndex(slideTargets: SlideTarget[]): number {
  const scrollReference = window.scrollY + 1;
  let currentSlideIndex = 0;

  for (let index = 0; index < slideTargets.length; index += 1) {
    const slideTarget = slideTargets[index];
    if (slideTarget.startY <= scrollReference) {
      currentSlideIndex = index;
      continue;
    }
    break;
  }

  return currentSlideIndex;
}

export function ClientShell({ children }: { children: ReactNode }) {
  const titleRef = useRef(baseTitle);

  useEffect(() => {
    initializeViewportLock();
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a[href^='#']");
      if (!anchor) {
        return;
      }

      const id = anchor.getAttribute("href")?.slice(1);
      if (!id) {
        return;
      }

      const target = document.getElementById(id);
      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) {
        return;
      }

      const slideNavigationDirection = getSlideNavigationDirection(event);
      if (slideNavigationDirection === 0) {
        return;
      }

      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        !isDesktopViewportForSlideNavigation() ||
        isInteractiveEventTarget(event.target)
      ) {
        return;
      }

      const slideTargets = getSlideTargets();
      if (slideTargets.length < 2) {
        return;
      }

      const currentSlideIndex = resolveCurrentSlideIndex(slideTargets);
      const currentSlide = slideTargets[currentSlideIndex];
      if (!currentSlide) {
        return;
      }

      if (
        slideNavigationDirection > 0 &&
        requestSkipRevealForSlide(currentSlide.section.id)
      ) {
        event.preventDefault();
        return;
      }

      const targetSlideIndex =
        slideNavigationDirection > 0
          ? Math.min(currentSlideIndex + 1, slideTargets.length - 1)
          : Math.max(currentSlideIndex - 1, 0);

      if (targetSlideIndex === currentSlideIndex) {
        return;
      }

      const targetSlide = slideTargets[targetSlideIndex];
      if (!targetSlide) {
        return;
      }

      event.preventDefault();
      window.scrollTo({
        top: targetSlide.startY,
        behavior: "smooth",
      });
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const timeoutIds: number[] = [];

    const clearWaveTimeouts = () => {
      for (const timeoutId of timeoutIds) {
        window.clearTimeout(timeoutId);
      }
      timeoutIds.length = 0;
    };

    const scheduleTimeout = (callback: () => void, delayMs: number) => {
      const timeoutId = window.setTimeout(callback, delayMs);
      timeoutIds.push(timeoutId);
    };

    const runTitleWave = () => {
      clearWaveTimeouts();
      titleRef.current = baseTitle;
      document.title = baseTitle;

      for (let charIndex = 0; charIndex < baseTitle.length; charIndex += 1) {
        const startDelayMs = charIndex * titleWaveStaggerMs;

        for (
          let frameIndex = 0;
          frameIndex < titleWaveRandomFrames;
          frameIndex += 1
        ) {
          scheduleTimeout(
            () => {
              const nextChars = titleRef.current.split("");
              nextChars[charIndex] = randomAsciiCharacter();
              titleRef.current = nextChars.join("");
              document.title = titleRef.current;
            },
            startDelayMs + frameIndex * titleWaveFrameIntervalMs,
          );
        }

        scheduleTimeout(
          () => {
            const nextChars = titleRef.current.split("");
            nextChars[charIndex] = baseTitle[charIndex] ?? "";
            titleRef.current = nextChars.join("");
            document.title = titleRef.current;
          },
          startDelayMs + titleWaveRandomFrames * titleWaveFrameIntervalMs,
        );
      }

      const settleDelayMs =
        (baseTitle.length - 1) * titleWaveStaggerMs +
        (titleWaveRandomFrames + 1) * titleWaveFrameIntervalMs;
      scheduleTimeout(() => {
        titleRef.current = baseTitle;
        document.title = baseTitle;
      }, settleDelayMs);
    };

    titleRef.current = baseTitle;
    document.title = baseTitle;

    const intervalId = window.setInterval(runTitleWave, titleWaveIntervalMs);

    return () => {
      window.clearInterval(intervalId);
      clearWaveTimeouts();
      titleRef.current = baseTitle;
      document.title = baseTitle;
    };
  }, []);

  return <>{children}</>;
}
