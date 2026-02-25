"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const speed = 0.06; // pixels per ms (1.5x of original 0.04)
const frameSize = 20; // matches --whiteboard-frame-size
const appearDelayMs = 5000;
const fadeInDurationMs = 600;

function getVisibleHeight(container: HTMLElement): number {
  const rect = container.getBoundingClientRect();
  const viewportH = window.innerHeight;
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, viewportH);
  return Math.max(0, visibleBottom - visibleTop);
}

function pickRandomBorderOrigin(
  boundsW: number,
  boundsH: number,
  elW: number,
  elH: number,
): { x: number; y: number; vx: number; vy: number } {
  const minX = frameSize;
  const minY = frameSize;
  const maxX = boundsW - frameSize - elW;
  const maxY = boundsH - frameSize - elH;
  const innerW = Math.max(0, maxX - minX);
  const innerH = Math.max(0, maxY - minY);
  const perimeter = 2 * (innerW + innerH);
  if (perimeter <= 0) return { x: minX, y: minY, vx: speed, vy: speed };
  const p = Math.random() * perimeter;

  let x: number;
  let y: number;
  let vx: number;
  let vy: number;

  if (p < innerW) {
    // top edge
    x = minX + p;
    y = minY;
    vx = speed;
    vy = speed;
  } else if (p < innerW + innerH) {
    // right edge
    x = maxX;
    y = minY + (p - innerW);
    vx = -speed;
    vy = speed;
  } else if (p < 2 * innerW + innerH) {
    // bottom edge
    x = minX + (p - innerW - innerH);
    y = maxY;
    vx = speed;
    vy = -speed;
  } else {
    // left edge
    x = minX;
    y = minY + (p - 2 * innerW - innerH);
    vx = speed;
    vy = speed;
  }

  return { x, y, vx, vy };
}

type BouncingFunFactsProps = {
  skipRevealDelay?: boolean;
};

export function BouncingFunFacts({ skipRevealDelay = false }: BouncingFunFactsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (skipRevealDelay) {
      setVisible(true);
      return;
    }
    const timeout = window.setTimeout(() => setVisible(true), appearDelayMs);
    return () => window.clearTimeout(timeout);
  }, [skipRevealDelay]);

  useEffect(() => {
    if (!visible) return;

    const container = containerRef.current;
    const link = linkRef.current;
    if (!container || !link) return;

    const linkRect = link.getBoundingClientRect();
    const elW = linkRect.width;
    const elH = linkRect.height;
    const containerW = container.getBoundingClientRect().width;
    const visibleH = getVisibleHeight(container);

    const origin = pickRandomBorderOrigin(containerW, visibleH, elW, elH);
    let { x, y, vx, vy } = origin;
    let lastTime: number | null = null;
    let frame = 0;

    const tick = (timestamp: number) => {
      if (lastTime === null) {
        lastTime = timestamp;
        link.style.transform = `translate(${x}px, ${y}px)`;
        frame = requestAnimationFrame(tick);
        return;
      }

      const dt = timestamp - lastTime;
      lastTime = timestamp;

      const currentW = container.getBoundingClientRect().width;
      const currentH = getVisibleHeight(container);
      const maxX = Math.max(frameSize, currentW - frameSize - elW);
      const maxY = Math.max(frameSize, currentH - frameSize - elH);

      x += vx * dt;
      y += vy * dt;

      if (x <= frameSize) {
        x = frameSize;
        vx = Math.abs(vx);
      } else if (x >= maxX) {
        x = maxX;
        vx = -Math.abs(vx);
      }

      if (y <= frameSize) {
        y = frameSize;
        vy = Math.abs(vy);
      } else if (y >= maxY) {
        y = maxY;
        vy = -Math.abs(vy);
      }

      link.style.transform = `translate(${x}px, ${y}px)`;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      <Link
        ref={linkRef}
        href="/fun-facts"
        className="pointer-events-auto absolute left-0 top-0 text-xs text-slate-500 no-underline opacity-0 hover:text-slate-700"
        style={{
          willChange: "transform, opacity",
          animation: `bouncing-fun-facts-fade-in ${fadeInDurationMs}ms ease-out forwards`,
        }}
      >
        fun facts
      </Link>
    </div>
  );
}
