import type { Point, SlideData } from "photoswipe";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import {
  ColumnsPhotoAlbum,
  RowsPhotoAlbum,
  type Photo as AlbumPhoto,
} from "react-photo-album";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "react-photo-album/columns.css";
import "react-photo-album/rows.css";

export type PolaroidVideoSource = {
  src: string;
  type?: string;
};

export type PolaroidVideoConfig = {
  sources: PolaroidVideoSource[];
  posterSrc?: string;
  preload?: "none" | "metadata" | "auto";
};

export type PolaroidPhoto = {
  id: string;
  src?: string;
  video?: PolaroidVideoConfig;
  caption: string;
  origin: {
    x: number;
    y: number;
  };
  width: number;
  clearance?: number;
  mediaWidth?: number;
  mediaHeight?: number;
};

type PolaroidsProps = {
  slideIndex: number;
  photos: PolaroidPhoto[];
  desktopLayout?: "columns" | "rows";
  desktopColumns?: number;
  interactive?: boolean;
};

type LightboxItemData = SlideData & {
  caption?: string;
};

type AlbumPolaroidPhoto = AlbumPhoto & {
  photoIndex: number;
  polaroid: PolaroidPhoto;
};

const defaultLightboxMediaWidth = 1600;
const defaultLightboxMediaHeight = 1200;
const transparentPixelDataUrl =
  "data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=";

function resolvePhotoPosterSrc(photo: PolaroidPhoto): string | undefined {
  return photo.video?.posterSrc ?? photo.src;
}

function resolveVideoSources(photo: PolaroidPhoto): PolaroidVideoSource[] {
  const sources = photo.video?.sources;

  if (!sources || sources.length === 0) {
    return [];
  }

  return sources.filter((source) => Boolean(source?.src));
}

function photoKey(slideIndex: number, photoIndex: number): string {
  return `${slideIndex}-${photoIndex}`;
}

function resolveThumbElement(
  triggerElement: HTMLButtonElement | null,
): HTMLElement | null {
  if (!triggerElement) {
    return null;
  }

  const mediaElement = triggerElement.querySelector(".slide-card__polaroid-photo");
  return mediaElement instanceof HTMLElement ? mediaElement : triggerElement;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveLightboxDimensions(photo: PolaroidPhoto): {
  width: number;
  height: number;
} {
  const width = Number.isFinite(photo.mediaWidth)
    ? Math.max(Math.round(photo.mediaWidth as number), 1)
    : defaultLightboxMediaWidth;
  const height = Number.isFinite(photo.mediaHeight)
    ? Math.max(Math.round(photo.mediaHeight as number), 1)
    : defaultLightboxMediaHeight;

  return { width, height };
}

function resolveMasonryColumns(photoCount: number, containerWidth: number): number {
  if (photoCount <= 1) {
    return 1;
  }

  if (containerWidth < 620) {
    return Math.min(photoCount, 2);
  }

  if (containerWidth < 840) {
    return Math.min(photoCount, 3);
  }

  if (photoCount >= 6) {
    return Math.min(photoCount, 4);
  }

  return Math.min(photoCount, 3);
}

function buildLightboxItem(photo: PolaroidPhoto): SlideData {
  const { width, height } = resolveLightboxDimensions(photo);
  const videoSources = resolveVideoSources(photo);
  const posterSrc = resolvePhotoPosterSrc(photo);
  const safeCaption = escapeHtml(photo.caption);

  if (videoSources.length > 0) {
    const sourceTags = videoSources
      .map((source) => {
        const typeAttribute = source.type
          ? ` type="${escapeHtml(source.type)}"`
          : "";

        return `<source src="${escapeHtml(source.src)}"${typeAttribute}>`;
      })
      .join("");
    const posterAttribute = posterSrc
      ? ` poster="${escapeHtml(posterSrc)}"`
      : "";

    return {
      type: "html",
      width,
      height,
      msrc: posterSrc,
      caption: photo.caption,
      alt: photo.caption,
      html: `<video class="slide-pswp-video block h-full w-full pointer-events-none object-contain bg-zinc-900" autoplay loop muted playsinline preload="metadata" disablepictureinpicture${posterAttribute} aria-label="${safeCaption}">${sourceTags}</video>`,
    };
  }

  if (photo.src) {
    return {
      src: photo.src,
      width,
      height,
      msrc: posterSrc,
      caption: photo.caption,
      alt: photo.caption,
    };
  }

  return {
    type: "html",
    width,
    height,
    caption: photo.caption,
    alt: photo.caption,
    html: `<div class="h-full w-full border border-black/10 bg-[linear-gradient(135deg,var(--color-stone-100)_0%,var(--color-stone-200)_100%)]" role="img" aria-label="${safeCaption}"></div>`,
  };
}

function resolveLightboxCaption(data: SlideData | undefined): string {
  if (!data) {
    return "";
  }

  const caption = (data as LightboxItemData).caption ?? data.alt;
  return typeof caption === "string" ? caption : "";
}

function isPointInRect(point: Point, rect: DOMRect): boolean {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

function shouldCloseLightboxFromOverlayInteraction(
  pswp: { currSlide?: { container?: HTMLElement | null } } | null | undefined,
  point: Point,
  eventTarget: EventTarget | null,
): boolean {
  if (!(eventTarget instanceof HTMLElement)) {
    return false;
  }

  if (eventTarget.closest(".pswp__button, .pswp__top-bar, .pswp__counter")) {
    return false;
  }

  const classList = eventTarget.classList;
  const isBackdropTarget =
    classList.contains("pswp__bg") ||
    classList.contains("pswp__scroll-wrap") ||
    classList.contains("pswp__container") ||
    classList.contains("pswp__item") ||
    classList.contains("pswp__zoom-wrap") ||
    classList.contains("pswp__content");

  if (!isBackdropTarget) {
    return false;
  }

  const mediaElement = pswp?.currSlide?.container?.querySelector(".pswp__content > *");
  if (!(mediaElement instanceof HTMLElement)) {
    return true;
  }

  return !isPointInRect(point, mediaElement.getBoundingClientRect());
}

export function Polaroids({
  slideIndex,
  photos,
  desktopLayout,
  desktopColumns,
  interactive = true,
}: PolaroidsProps) {
  const resolvedDesktopLayout = desktopLayout === "rows" ? "rows" : "columns";
  const maxBasePhotoZIndex = useMemo(() => Math.max(photos.length, 1), [photos.length]);
  const resolvedDesktopColumns = useMemo(() => {
    if (!Number.isFinite(desktopColumns)) {
      return null;
    }

    return Math.max(1, Math.floor(desktopColumns as number));
  }, [desktopColumns]);

  const [photoZIndices, setPhotoZIndices] = useState<Record<string, number>>({});
  const [masonryScale, setMasonryScale] = useState(1);

  const nextPhotoZIndexRef = useRef(maxBasePhotoZIndex + 1);
  const photoTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null);
  const masonryStageRef = useRef<HTMLDivElement | null>(null);
  const masonryContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    nextPhotoZIndexRef.current = Math.max(
      nextPhotoZIndexRef.current,
      maxBasePhotoZIndex + 1,
    );
  }, [maxBasePhotoZIndex]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const lightbox = new PhotoSwipeLightbox({
      pswpModule: () => import("photoswipe"),
      mainClass: "slide-pswp-root",
      thumbSelector: ".slide-card__polaroid-photo",
      showHideAnimationType: "zoom",
      bgClickAction: (point, originalEvent) => {
        const pswp = lightbox.pswp;
        if (
          shouldCloseLightboxFromOverlayInteraction(
            pswp,
            point,
            originalEvent.target,
          )
        ) {
          pswp?.close();
        }
      },
      tapAction: (point, originalEvent) => {
        const pswp = lightbox.pswp;
        if (!pswp) {
          return;
        }

        if (
          shouldCloseLightboxFromOverlayInteraction(
            pswp,
            point,
            originalEvent.target,
          )
        ) {
          pswp.close();
          return;
        }

        pswp.element?.classList.toggle("pswp--ui-visible");
      },
      paddingFn: (viewportSize) => {
        const sidePadding = Math.round(
          Math.max(16, Math.min(40, viewportSize.x * 0.035)),
        );

        return {
          top: 72,
          bottom: 72,
          left: sidePadding,
          right: sidePadding,
        };
      },
    });

    lightbox.addFilter("useContentPlaceholder", (usePlaceholder, content) => {
      if (usePlaceholder) {
        return true;
      }

      return Boolean(
        content.type === "html" &&
          typeof content.data?.msrc === "string" &&
          content.data.msrc.length > 0,
      );
    });

    lightbox.addFilter("placeholderSrc", (placeholderSrc, content) => {
      if (typeof placeholderSrc === "string" && placeholderSrc.length > 0) {
        return placeholderSrc;
      }

      if (
        content.type === "html" &&
        typeof content.data?.msrc === "string" &&
        content.data.msrc.length > 0
      ) {
        return content.data.msrc;
      }

      return placeholderSrc;
    });

    const syncActiveVideoPlayback = () => {
      const pswp = lightbox.pswp;
      if (!pswp?.element) {
        return;
      }

      const activeSlideContainer = pswp.currSlide?.container ?? null;
      const videos = pswp.element.querySelectorAll("video.slide-pswp-video");
      videos.forEach((videoElement) => {
        if (!(videoElement instanceof HTMLVideoElement)) {
          return;
        }

        const isActiveVideo = Boolean(activeSlideContainer?.contains(videoElement));
        if (isActiveVideo) {
          videoElement.muted = true;
          videoElement.loop = true;
          videoElement.playsInline = true;
          void videoElement.play().catch(() => {
            // Autoplay can be blocked in some environments; fail silently.
          });
        } else {
          videoElement.pause();
        }
      });
    };

    lightbox.on("uiRegister", () => {
      const pswp = lightbox.pswp;
      if (!pswp?.ui) {
        return;
      }

      pswp.ui.registerElement({
        name: "slide-caption",
        className:
          "pointer-events-none absolute inset-x-0 z-50 m-0 px-[clamp(0.9rem,3.5vw,2.4rem)] text-center text-[1.08rem] leading-[1.4] text-white drop-shadow-lg bottom-[calc(env(safe-area-inset-bottom,0px)+clamp(0.9rem,2.8vh,1.7rem))]",
        appendTo: "root",
        order: 9,
        onInit: (element, photoSwipe) => {
          const updateCaption = () => {
            const caption = resolveLightboxCaption(photoSwipe.currSlide?.data);
            element.textContent = caption;
            element.classList.toggle("hidden", caption.length === 0);
          };

          photoSwipe.on("change", updateCaption);
          photoSwipe.on("afterInit", updateCaption);
          updateCaption();
        },
      });
    });

    lightbox.on("afterInit", () => {
      syncActiveVideoPlayback();
    });

    lightbox.on("change", () => {
      syncActiveVideoPlayback();
    });
    lightbox.init();
    lightboxRef.current = lightbox;

    return () => {
      lightboxRef.current = null;
      lightbox.destroy();
    };
  }, []);

  const openLightbox = useCallback(
    (photoIndex: number) => {
      const lightbox = lightboxRef.current;

      if (!interactive || !lightbox || photos.length === 0) {
        return;
      }

      const dataSource = photos.map((photo, index) => {
        const item = buildLightboxItem(photo);
        const triggerElement = photoTriggerRefs.current[photoKey(slideIndex, index)];
        const thumbElement = resolveThumbElement(triggerElement);

        if (thumbElement) {
          item.element = thumbElement;
        }

        return item;
      });

      lightbox.loadAndOpen(photoIndex, dataSource);
    },
    [interactive, photos, slideIndex],
  );

  const bringPhotoToFront = useCallback(
    (photoIndex: number) => {
      const key = photoKey(slideIndex, photoIndex);
      const nextZIndex = nextPhotoZIndexRef.current;
      nextPhotoZIndexRef.current += 1;
      setPhotoZIndices((previous) => ({ ...previous, [key]: nextZIndex }));
    },
    [slideIndex],
  );

  const handlePhotoTriggerClick = useCallback(
    (photoIndex: number) => {
      if (!interactive) {
        return;
      }

      bringPhotoToFront(photoIndex);
      openLightbox(photoIndex);
    },
    [bringPhotoToFront, interactive, openLightbox],
  );

  const photoTriggerClassName = `react-photo-album--photo react-photo-album--button m-0 block w-auto border-0 bg-transparent p-0 [touch-action:manipulation] select-none focus-visible:rounded-[4px] focus-visible:outline-3 focus-visible:outline-black focus-visible:outline-offset-[5px] ${
    interactive
      ? "cursor-pointer pointer-events-auto"
      : "cursor-default pointer-events-none"
  }`;

  const renderPhotoMedia = useCallback(
    (photo: PolaroidPhoto) => {
      const posterSrc = resolvePhotoPosterSrc(photo);
      const imageSrc = posterSrc ?? photo.src;

      if (imageSrc) {
        return (
          <img
            className="slide-card__polaroid-photo block h-auto w-full"
            src={imageSrc}
            alt={photo.caption}
            loading="lazy"
            draggable="false"
          />
        );
      }

      return (
        <div
          className="slide-card__polaroid-photo block h-auto w-full bg-[linear-gradient(135deg,var(--color-stone-100)_0%,var(--color-stone-200)_100%)]"
          aria-label={photo.caption}
        />
      );
    },
    [],
  );

  const masonryPhotos = useMemo<AlbumPolaroidPhoto[]>(
    () =>
      photos.map((photo, photoIndex) => {
        const { width, height } = resolveLightboxDimensions(photo);
        const posterSrc = resolvePhotoPosterSrc(photo);

        return {
          key: photoKey(slideIndex, photoIndex),
          src: posterSrc ?? photo.src ?? transparentPixelDataUrl,
          width,
          height,
          alt: photo.caption,
          photoIndex,
          polaroid: photo,
        };
      }),
    [photos, slideIndex],
  );

  const masonryColumns = useCallback(
    (containerWidth: number) => {
      if (resolvedDesktopColumns !== null) {
        return Math.min(Math.max(photos.length, 1), resolvedDesktopColumns);
      }

      return resolveMasonryColumns(photos.length, containerWidth);
    },
    [photos.length, resolvedDesktopColumns],
  );
  const desktopAlbumSpacing = useCallback(
    (containerWidth: number) => (containerWidth < 700 ? 8 : 12),
    [],
  );
  const desktopAlbumPadding = 0;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stageElement = masonryStageRef.current;
    const contentElement = masonryContentRef.current;
    if (!stageElement || !contentElement) {
      return;
    }

    let animationFrameId: number | null = null;

    const updateMasonryScale = () => {
      const computedStageStyle = window.getComputedStyle(stageElement);
      const stagePaddingTop = Number.parseFloat(computedStageStyle.paddingTop) || 0;
      const stagePaddingBottom =
        Number.parseFloat(computedStageStyle.paddingBottom) || 0;
      const availableHeight =
        stageElement.clientHeight - stagePaddingTop - stagePaddingBottom;
      const naturalContentHeight = contentElement.scrollHeight;

      if (availableHeight <= 0 || naturalContentHeight <= 0) {
        return;
      }

      const nextScale = Math.min(1, availableHeight / naturalContentHeight);
      setMasonryScale((previous) =>
        Math.abs(previous - nextScale) > 0.01 ? nextScale : previous,
      );
    };

    const queueMasonryScaleUpdate = () => {
      if (animationFrameId !== null) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        updateMasonryScale();
      });
    };

    queueMasonryScaleUpdate();

    const resizeObserver = new ResizeObserver(() => {
      queueMasonryScaleUpdate();
    });
    resizeObserver.observe(stageElement);
    resizeObserver.observe(contentElement);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [photos.length, masonryColumns, resolvedDesktopLayout]);

  return (
    <div
      ref={masonryStageRef}
      className="relative mx-auto box-border h-full max-h-full min-h-0 w-[min(940px,100%)] overflow-hidden px-[clamp(0.65rem,2vw,1.35rem)] pb-[clamp(1.35rem,3.8vh,2.6rem)]"
    >
      <div
        className="w-full origin-top transition-transform duration-[140ms] ease-out"
        style={{ transform: `scale(${masonryScale})` }}
      >
        <div ref={masonryContentRef} className="w-full">
          {resolvedDesktopLayout === "rows" ? (
            <RowsPhotoAlbum<AlbumPolaroidPhoto>
              photos={masonryPhotos}
              targetRowHeight={(containerWidth) => (containerWidth < 700 ? 160 : 200)}
              rowConstraints={
                photos.length === 3
                  ? {
                      minPhotos: 1,
                      maxPhotos: 2,
                    }
                  : undefined
              }
              spacing={desktopAlbumSpacing}
              padding={desktopAlbumPadding}
              defaultContainerWidth={940}
              render={{
                photo: (_props, context) => {
                  const masonryPhoto = context.photo;
                  const photo = masonryPhoto.polaroid;
                  const photoIndex = masonryPhoto.photoIndex;
                  const key = photoKey(slideIndex, photoIndex);
                  const photoZIndex = photoZIndices[key] ?? photoIndex + 1;
                  const albumPhotoStyle: CSSProperties &
                    Record<`--${string}`, number | string> = {
                    "--react-photo-album--photo-width": context.width,
                    "--react-photo-album--photo-height": context.height,
                    position: "relative",
                    zIndex: photoZIndex,
                  };

                  return (
                    <button
                      key={masonryPhoto.key ?? key}
                      type="button"
                      className={photoTriggerClassName}
                      style={albumPhotoStyle}
                      ref={(element) => {
                        photoTriggerRefs.current[key] = element;
                      }}
                      disabled={!interactive}
                      onClick={() => {
                        handlePhotoTriggerClick(photoIndex);
                      }}
                      aria-label={`open photo: ${photo.caption}`}
                      >
                      <figure className="m-0 w-full overflow-hidden border-0 bg-transparent shadow-xl">
                        {renderPhotoMedia(photo)}
                      </figure>
                    </button>
                  );
                },
              }}
            />
          ) : (
            <ColumnsPhotoAlbum<AlbumPolaroidPhoto>
              photos={masonryPhotos}
              columns={masonryColumns}
              spacing={desktopAlbumSpacing}
              padding={desktopAlbumPadding}
              defaultContainerWidth={940}
              render={{
                photo: (_props, context) => {
                  const masonryPhoto = context.photo;
                  const photo = masonryPhoto.polaroid;
                  const photoIndex = masonryPhoto.photoIndex;
                  const key = photoKey(slideIndex, photoIndex);
                  const photoZIndex = photoZIndices[key] ?? photoIndex + 1;
                  const albumPhotoStyle: CSSProperties &
                    Record<`--${string}`, number | string> = {
                    "--react-photo-album--photo-width": context.width,
                    "--react-photo-album--photo-height": context.height,
                    position: "relative",
                    zIndex: photoZIndex,
                  };

                  return (
                    <button
                      key={masonryPhoto.key ?? key}
                      type="button"
                      className={photoTriggerClassName}
                      style={albumPhotoStyle}
                      ref={(element) => {
                        photoTriggerRefs.current[key] = element;
                      }}
                      disabled={!interactive}
                      onClick={() => {
                        handlePhotoTriggerClick(photoIndex);
                      }}
                      aria-label={`open photo: ${photo.caption}`}
                      >
                      <figure className="m-0 w-full overflow-hidden border-0 bg-transparent shadow-xl">
                        {renderPhotoMedia(photo)}
                      </figure>
                    </button>
                  );
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
