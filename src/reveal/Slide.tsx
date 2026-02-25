import { Link } from "lucide-react";
import { annotate, annotationGroup } from "rough-notation";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Polaroids, type PolaroidPhoto } from "../components/Polaroids";
import { clamp } from "./math";
import { SHARED_UNDERLINE_LAYERS } from "./notationPresets";
import { RevealItem } from "./RevealItem";
import type { NotationBracketSide, NotationLayerConfig } from "./notationTypes";

export type SimpleRevealConfig = {
  delayMs?: number;
};

export type SimpleNotationConfig = {
  type?:
    | "underline"
    | "box"
    | "circle"
    | "highlight"
    | "strike-through"
    | "crossed-off"
    | "bracket";
  color?: string;
  multiline?: boolean;
  brackets?: NotationBracketSide | NotationBracketSide[];
  delayMs?: number;
  layers?: NotationLayerConfig[];
};

export type SimpleTextGroupConfig = {
  id: string;
  text: string;
  className?: string;
  style?: CSSProperties;
  href?: string;
  target?: "_self" | "_blank" | "_parent" | "_top";
  rel?: string;
  linkAppearance?: "default" | "unstyled" | "raw";
  showLinkIcon?: boolean;
  notation?: SimpleNotationConfig;
};

export type SimpleBaseRowConfig = {
  id: string;
  className?: string;
  style?: CSSProperties;
  reveal?: SimpleRevealConfig;
};

export type SimpleTextRowConfig = SimpleBaseRowConfig & {
  kind: "text";
  groups: SimpleTextGroupConfig[];
};

export type SimpleAlbumRowConfig = SimpleBaseRowConfig & {
  kind: "album";
  album: {
    photos: PolaroidPhoto[];
    desktopLayout?: "columns" | "rows";
    desktopColumns?: number;
  };
};

export type SimpleCustomRowConfig = SimpleBaseRowConfig & {
  kind: "custom";
  render: (args: { rowRevealed: boolean }) => ReactNode;
};

export type SimpleRowConfig =
  | SimpleTextRowConfig
  | SimpleAlbumRowConfig
  | SimpleCustomRowConfig;

export type SlideConfig = {
  id: string;
  className?: string;
  style?: CSSProperties;
  topSpacerClassName?: string;
  rowsClassName?: string;
  rows: SimpleRowConfig[];
};

export type SlideProps = {
  id?: string;
  revealed: boolean;
  skipRevealDelay?: boolean;
  slide: SlideConfig;
  rowRevealDurationMs?: number;
  slideIndex?: number;
};

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

type TextGroupProps = {
  group: SimpleTextGroupConfig;
  rowRevealStarted: boolean;
  rowRevealed: boolean;
};

function isCrossOutNotationType(
  type: SimpleNotationConfig["type"] | undefined,
): boolean {
  return type === "crossed-off" || type === "strike-through";
}

const TextGroup = memo(function TextGroup({
  group,
  rowRevealStarted,
  rowRevealed,
}: TextGroupProps) {
  const textRef = useRef<HTMLSpanElement | null>(null);
  const annotationRefs = useRef<Array<ReturnType<typeof annotate>>>([]);
  const [showNotation, setShowNotation] = useState(false);
  const notation = group.notation;
  const notationTriggerReady = notation
    ? isCrossOutNotationType(notation.type)
      ? rowRevealStarted
      : rowRevealed
    : false;

  const clearAnnotations = useCallback(() => {
    annotationRefs.current.forEach((annotation) => {
      annotation.remove();
    });
    annotationRefs.current = [];
  }, []);

  useEffect(() => {
    setShowNotation(false);
    clearAnnotations();
  }, [clearAnnotations, notation, group.text]);

  useEffect(() => {
    return () => {
      clearAnnotations();
    };
  }, [clearAnnotations]);

  useEffect(() => {
    if (!notationTriggerReady) {
      setShowNotation(false);
      clearAnnotations();
    }
  }, [clearAnnotations, notationTriggerReady]);

  useEffect(() => {
    if (!notation || !notationTriggerReady) {
      return;
    }

    const timerId = window.setTimeout(
      () => {
        setShowNotation(true);
      },
      Math.max(notation.delayMs ?? 0, 0),
    );

    return () => {
      window.clearTimeout(timerId);
    };
  }, [notation, notationTriggerReady]);

  useEffect(() => {
    if (!notation || !showNotation) {
      return;
    }

    const target = textRef.current;
    if (!target) {
      return;
    }

    clearAnnotations();

    const layers =
      notation.layers && notation.layers.length > 0
        ? notation.layers
        : SHARED_UNDERLINE_LAYERS;
    const notationType = notation.type ?? "underline";
    const resolvedMultiline =
      notation.multiline ?? notationType === "highlight";
    const annotations = layers.map((layer) =>
      annotate(target, {
        type: notationType,
        color: notation.color,
        multiline: resolvedMultiline,
        brackets: notation.brackets,
        ...layer,
      }),
    );

    if (annotations.length === 0) {
      return;
    }

    annotationRefs.current = annotations;
    annotationGroup(annotations).show();

    return () => {
      clearAnnotations();
    };
  }, [clearAnnotations, notation, showNotation]);

  const textClassName = group.className;
  const resolvedRel =
    group.rel ??
    (group.target === "_blank" ? "noopener noreferrer" : undefined);
  const isRawLink = group.linkAppearance === "raw";
  const isUnstyledLink = group.linkAppearance === "unstyled";
  const showLinkIcon = group.showLinkIcon ?? true;
  const sharedTextRowLinkInteractionClassName =
    "cursor-pointer hover:opacity-65 focus-visible:opacity-65";
  const sharedTextRowLinkMotionClassName =
    "duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]";
  const sharedTextRowLinkIconClassName =
    "mr-[0.2em] h-[0.62em] w-[0.62em] shrink-0 translate-y-[0.04em]";
  const rawTextRowLinkClassName = joinClassNames(
    "inline-flex items-baseline align-baseline transition-opacity",
    sharedTextRowLinkMotionClassName,
    sharedTextRowLinkInteractionClassName,
  );
  const linkClassName = isUnstyledLink
    ? joinClassNames(
        "inline-flex items-baseline align-baseline text-inherit no-underline transition-opacity hover:text-inherit focus-visible:text-inherit",
        sharedTextRowLinkMotionClassName,
        sharedTextRowLinkInteractionClassName,
      )
    : joinClassNames(
        "inline-flex items-baseline align-baseline text-[var(--color-blue-500)] no-underline transition-[color,opacity] hover:text-[var(--color-blue-400)] focus-visible:text-[var(--color-blue-400)]",
        sharedTextRowLinkMotionClassName,
        sharedTextRowLinkInteractionClassName,
      );
  const textContent = !group.href
    ? group.text
    : isRawLink
      ? (
          <a
            href={group.href}
            target={group.target}
            rel={resolvedRel}
            className={rawTextRowLinkClassName}
          >
            {showLinkIcon ? (
              <Link className={sharedTextRowLinkIconClassName} aria-hidden="true" />
            ) : null}
            <span className="inline">{group.text}</span>
          </a>
        )
      : (
          <a
            href={group.href}
            target={group.target}
            rel={resolvedRel}
            className={linkClassName}
          >
            {showLinkIcon ? (
              <Link className={sharedTextRowLinkIconClassName} aria-hidden="true" />
            ) : null}
            <span className="inline">{group.text}</span>
          </a>
        );

  return (
    <span
      className={textClassName || undefined}
      style={group.style}
      ref={notation ? textRef : undefined}
    >
      {textContent}
    </span>
  );
});

type TextRowProps = {
  row: SimpleTextRowConfig;
  rowRevealStarted: boolean;
  rowRevealed: boolean;
};

const TextRow = memo(function TextRow({
  row,
  rowRevealStarted,
  rowRevealed,
}: TextRowProps) {
  return (
    <p className="m-0 leading-[1.35]">
      <span>
        {row.groups.map((group) => (
          <TextGroup
            key={group.id}
            group={group}
            rowRevealStarted={rowRevealStarted}
            rowRevealed={rowRevealed}
          />
        ))}
      </span>
    </p>
  );
});

export function Slide({
  id,
  revealed,
  skipRevealDelay = false,
  slide,
  rowRevealDurationMs = 520,
  slideIndex = 0,
}: SlideProps) {
  const [sequenceStartTime, setSequenceStartTime] = useState<number | null>(
    null,
  );
  const [elapsedMs, setElapsedMs] = useState(0);
  const skipRevealActivatedElapsedMsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!revealed) {
      setSequenceStartTime(null);
      setElapsedMs(0);
      return;
    }

    setSequenceStartTime(performance.now());
    setElapsedMs(0);
  }, [revealed, slide.id]);

  useEffect(() => {
    if (sequenceStartTime === null) {
      return;
    }

    let frame = 0;

    const tick = (now: number) => {
      setElapsedMs(now - sequenceStartTime);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [sequenceStartTime]);
  if (!revealed || !skipRevealDelay) {
    if (skipRevealActivatedElapsedMsRef.current !== null) {
      skipRevealActivatedElapsedMsRef.current = null;
    }
  } else if (skipRevealActivatedElapsedMsRef.current === null) {
    skipRevealActivatedElapsedMsRef.current = elapsedMs;
  }
  const skipRevealActivatedElapsedMs = skipRevealActivatedElapsedMsRef.current;

  const slideClassName = joinClassNames(
    "flex h-full w-full flex-col",
    slide.className,
  );
  const rowsClassName = joinClassNames(
    "flex w-full min-h-0 flex-col",
    slide.rowsClassName,
  );

  return (
    <section id={id} className="h-full min-h-full w-full">
      <article className={slideClassName} style={slide.style}>
        {slide.topSpacerClassName ? (
          <div className={slide.topSpacerClassName} aria-hidden="true" />
        ) : null}
        <div className={rowsClassName}>
          {slide.rows.map((row) => {
            const rowDelayMs = Math.max(row.reveal?.delayMs ?? 0, 0);
            let resolvedRowDelayMs = rowDelayMs;
            if (skipRevealDelay) {
              const activationElapsed =
                skipRevealActivatedElapsedMs ?? elapsedMs;
              const rowStartedBeforeSkip = activationElapsed >= rowDelayMs;
              resolvedRowDelayMs = rowStartedBeforeSkip
                ? rowDelayMs
                : activationElapsed;
            }
            const rowProgress = revealed
              ? clamp(
                  (elapsedMs - resolvedRowDelayMs) / Math.max(rowRevealDurationMs, 1),
                  0,
                  1,
                )
              : 0;
            const rowRevealStarted = rowProgress > 0;
            const rowRevealed = rowProgress >= 0.999;

            return (
              <RevealItem
                key={row.id}
                progress={rowProgress}
                config={{
                  id: row.id,
                  start: 0,
                  end: 1,
                  easing: "easeOutCubic",
                  from: {
                    opacity: 0,
                    y: 24,
                    blur: 6,
                  },
                  to: {
                    opacity: 1,
                    y: 0,
                    blur: 0,
                  },
                  className: row.className,
                  style: row.style,
                }}
              >
                {row.kind === "text" ? (
                  <TextRow
                    row={row}
                    rowRevealStarted={rowRevealStarted}
                    rowRevealed={rowRevealed}
                  />
                ) : null}

                {row.kind === "album" ? (
                  <Polaroids
                    slideIndex={slideIndex}
                    photos={row.album.photos}
                    desktopLayout={row.album.desktopLayout}
                    desktopColumns={row.album.desktopColumns}
                    interactive={rowRevealed}
                  />
                ) : null}

                {row.kind === "custom" ? row.render({ rowRevealed }) : null}
              </RevealItem>
            );
          })}
        </div>
      </article>
    </section>
  );
}
