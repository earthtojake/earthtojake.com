import { Check, Copy } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

const heroEmailAddressObfuscated = "jakehenryfitz[at]gmail[dot]com";
const heroWhatsappNumberDigits = "16467853685";
const heroWhatsappDmUrl = `https://wa.me/${heroWhatsappNumberDigits}?text=i%20like%20robots`;
const heroDialogIds = {
  email: "hero-email-dialog",
} as const;
const heroCopySuccessDurationMs = 1000;
const heroCopyFailureDurationMs = 1700;

type HeroContactChannel = "x" | "email" | "github" | "linkedin" | "whatsapp";
type HeroDialogChannel = "email";

type HeroContactLink = {
  id: HeroContactChannel;
  href: string;
  label: string;
  target?: "_blank";
  rel?: "noopener noreferrer";
};

type HeroContactBarProps = {
  channels?: readonly HeroContactChannel[];
};

const heroContactLinksByChannel: Record<HeroContactChannel, HeroContactLink> = {
  x: {
    id: "x",
    href: "https://x.com/earthtojake_",
    label: "X",
    target: "_blank",
    rel: "noopener noreferrer",
  },
  email: {
    id: "email",
    href: "#email",
    label: "Email",
  },
  github: {
    id: "github",
    href: "https://github.com/earthtojake",
    label: "GitHub",
    target: "_blank",
    rel: "noopener noreferrer",
  },
  linkedin: {
    id: "linkedin",
    href: "https://www.linkedin.com/in/jake-fitzgerald-680855b1/",
    label: "LinkedIn",
    target: "_blank",
    rel: "noopener noreferrer",
  },
  whatsapp: {
    id: "whatsapp",
    href: heroWhatsappDmUrl,
    label: "WhatsApp",
    target: "_blank",
    rel: "noopener noreferrer",
  },
} as const;

const defaultHeroContactChannels: readonly HeroContactChannel[] = [
  "x",
  "email",
  "github",
  "linkedin",
] as const;

function getHeroEmailAddress(): string {
  return heroEmailAddressObfuscated
    .replace("[at]", "@")
    .replace("[dot]", ".");
}

function getDialogCopyValue(): string {
  return getHeroEmailAddress();
}

function getDialogDisplayText(): string {
  return heroEmailAddressObfuscated;
}

function getDialogAriaLabel(): string {
  return "email address";
}

function getDialogHref(): string | undefined {
  return undefined;
}

function isDialogChannel(channel: HeroContactChannel): channel is HeroDialogChannel {
  return channel === "email";
}

function fallbackCopyTextToClipboard(value: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const clipboardBuffer = document.createElement("textarea");
  clipboardBuffer.value = value;
  clipboardBuffer.setAttribute("readonly", "");
  clipboardBuffer.style.position = "fixed";
  clipboardBuffer.style.top = "0";
  clipboardBuffer.style.left = "-9999px";
  clipboardBuffer.style.opacity = "0";
  document.body.appendChild(clipboardBuffer);
  clipboardBuffer.select();

  let didCopy = false;
  try {
    didCopy = document.execCommand("copy");
  } catch {
    didCopy = false;
  }

  clipboardBuffer.remove();
  return didCopy;
}

type HeroContactIconProps = {
  channel: HeroContactChannel;
};

const heroIconClassName =
  "block h-[clamp(1.06rem,0.95vw+0.82rem,1.28rem)] w-[clamp(1.06rem,0.95vw+0.82rem,1.28rem)] fill-current";

const HeroContactIcon = memo(function HeroContactIcon({
  channel,
}: HeroContactIconProps) {
  if (channel === "x") {
    return (
      <svg className={heroIconClassName} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
      </svg>
    );
  }

  if (channel === "github") {
    return (
      <svg className={heroIconClassName} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    );
  }

  if (channel === "linkedin") {
    return (
      <svg className={heroIconClassName} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }

  if (channel === "whatsapp") {
    return (
      <svg className={heroIconClassName} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.601 2.326A7.85 7.85 0 0 0 6.98.093C2.745 1.845.184 6.094.184 10.61c0 1.514.394 2.99 1.14 4.298L0 20l5.224-1.365a7.95 7.95 0 0 0 3.793.975h.003c4.234 0 7.798-4.249 7.798-8.763 0-2.34-.861-4.544-2.417-6.521m-4.57 14.46h-.003a6.63 6.63 0 0 1-3.39-.93l-.243-.144-3.098.809.828-3.02-.158-.246a6.63 6.63 0 0 1-1.02-3.53c0-3.665 2.983-6.648 6.65-6.648 1.773 0 3.435.691 4.69 1.946a6.6 6.6 0 0 1 1.947 4.69c0 3.667-2.984 6.65-6.65 6.65m3.646-4.977c-.199-.1-1.176-.579-1.358-.645-.182-.067-.315-.1-.448.1-.132.198-.512.645-.628.777-.116.132-.232.149-.43.05-.2-.1-.84-.31-1.6-.99-.592-.525-.992-1.174-1.108-1.372-.116-.2-.013-.305.087-.404.09-.09.2-.232.298-.348.1-.116.132-.198.199-.331.066-.132.033-.248-.017-.348-.05-.1-.448-1.08-.613-1.477-.161-.39-.325-.337-.448-.343l-.381-.007a.73.73 0 0 0-.53.248c-.182.2-.695.679-.695 1.654 0 .976.712 1.92.811 2.052.1.132 1.4 2.136 3.393 2.995.474.205.844.327 1.132.418.476.151.909.13 1.252.079.381-.057 1.176-.48 1.341-.943.166-.463.166-.86.116-.943-.05-.083-.182-.132-.381-.232" />
      </svg>
    );
  }

  return (
    <svg className={heroIconClassName} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414z" />
      <path d="M0 4.697v7.104l5.803-3.558z" />
      <path d="m6.761 8.83-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.143L9.24 8.83 8 9.586z" />
      <path d="M16 11.801V4.697l-5.803 3.546z" />
    </svg>
  );
});

type HeroCopyState = "idle" | "copied" | "failed";

function getCopyButtonLabel(copyState: HeroCopyState): string {
  if (copyState === "copied") {
    return "email copied";
  }

  return "copy email address";
}

export const HeroContactBar = memo(function HeroContactBar({
  channels = defaultHeroContactChannels,
}: HeroContactBarProps) {
  const [openDialogChannel, setOpenDialogChannel] =
    useState<HeroDialogChannel | null>(null);
  const [copyStates, setCopyStates] = useState<
    Record<HeroDialogChannel, HeroCopyState>
  >({
    email: "idle",
  });
  const dialogContainerRefs = useRef<
    Record<HeroDialogChannel, HTMLSpanElement | null>
  >({
    email: null,
  });
  const copyStatusTimerRefs = useRef<Record<HeroDialogChannel, number | null>>({
    email: null,
  });

  const contactLinks = channels.map(
    (channel) => heroContactLinksByChannel[channel],
  );

  const setCopyState = useCallback(
    (channel: HeroDialogChannel, nextState: HeroCopyState) => {
      setCopyStates((currentState) => {
        if (currentState[channel] === nextState) {
          return currentState;
        }

        return {
          ...currentState,
          [channel]: nextState,
        };
      });
    },
    [],
  );

  const clearCopyStatusTimer = useCallback((channel: HeroDialogChannel) => {
    const timerId = copyStatusTimerRefs.current[channel];
    if (timerId === null) {
      return;
    }

    window.clearTimeout(timerId);
    copyStatusTimerRefs.current[channel] = null;
  }, []);

  const scheduleCopyStatusReset = useCallback(
    (channel: HeroDialogChannel, delayMs: number) => {
      clearCopyStatusTimer(channel);
      copyStatusTimerRefs.current[channel] = window.setTimeout(() => {
        setCopyState(channel, "idle");
        copyStatusTimerRefs.current[channel] = null;
      }, delayMs);
    },
    [clearCopyStatusTimer, setCopyState],
  );

  useEffect(() => {
    return () => {
      clearCopyStatusTimer("email");
    };
  }, [clearCopyStatusTimer]);

  useEffect(() => {
    if (!openDialogChannel) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      const activeDialogContainer = dialogContainerRefs.current[openDialogChannel];
      if (!activeDialogContainer?.contains(event.target)) {
        setOpenDialogChannel(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDialogChannel(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDialogChannel]);

  const handleDialogToggle = useCallback(
    (channel: HeroDialogChannel) => {
      setOpenDialogChannel((currentChannel) =>
        currentChannel === channel ? null : channel,
      );
      setCopyState(channel, "idle");
      clearCopyStatusTimer(channel);
    },
    [clearCopyStatusTimer, setCopyState],
  );

  const handleCopyClick = useCallback(() => {
    const copyValue = getDialogCopyValue();

    const copyContactValue = async () => {
      let didCopy = false;

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(copyValue);
          didCopy = true;
        } catch {
          didCopy = false;
        }
      }

      if (!didCopy) {
        didCopy = fallbackCopyTextToClipboard(copyValue);
      }

      setCopyState("email", didCopy ? "copied" : "failed");
      scheduleCopyStatusReset(
        "email",
        didCopy ? heroCopySuccessDurationMs : heroCopyFailureDurationMs,
      );
    };

    void copyContactValue();
  }, [scheduleCopyStatusReset, setCopyState]);

  return (
    <span className="inline-flex items-center gap-0" role="group" aria-label="contact links">
      <span className="inline-flex items-center gap-[clamp(0.56rem,0.9vw,0.86rem)]">
        {contactLinks.map((link) => {
          if (isDialogChannel(link.id)) {
            const channel = link.id;
            const isDialogOpen = openDialogChannel === channel;
            const copyState = copyStates[channel];
            const copyButtonLabel = getCopyButtonLabel(copyState);
            const showCopyError = copyState === "failed";
            const dialogHref = getDialogHref();
            const dialogText = getDialogDisplayText();

            return (
              <span
                key={link.id}
                className="relative inline-flex items-center"
                ref={(node) => {
                  dialogContainerRefs.current[channel] = node;
                }}
              >
                <button
                  type="button"
                  className="inline-flex h-auto w-auto cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-black no-underline transition-[transform,color,opacity] duration-120 ease-[ease] hover:-translate-y-px hover:opacity-60 focus-visible:-translate-y-px focus-visible:opacity-60 focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
                  aria-label={link.label}
                  aria-haspopup="dialog"
                  aria-expanded={isDialogOpen}
                  aria-controls={heroDialogIds[channel]}
                  onClick={() => {
                    handleDialogToggle(channel);
                  }}
                >
                  <HeroContactIcon channel={channel} />
                </button>
                {isDialogOpen ? (
                  <span
                    id={heroDialogIds[channel]}
                    className="absolute left-1/2 top-[calc(100%+0.44rem)] z-[5] inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-[0.45rem] border border-slate-900/20 bg-white/95 px-[0.5rem] py-[0.4rem] shadow-xl"
                    role="dialog"
                    aria-label={getDialogAriaLabel()}
                  >
                    {dialogHref ? (
                      <a
                        href={dialogHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[length:clamp(0.66rem,0.26vw+0.58rem,0.78rem)] leading-[1.2] text-black no-underline hover:underline focus-visible:underline"
                      >
                        {dialogText}
                      </a>
                    ) : (
                      <span className="font-mono text-[length:clamp(0.66rem,0.26vw+0.58rem,0.78rem)] leading-[1.2]">
                        {dialogText}
                      </span>
                    )}
                    <button
                      type="button"
                      className="inline-flex h-[1.6rem] w-[1.6rem] cursor-pointer items-center justify-center rounded-full border border-slate-900/30 bg-slate-50 p-0 text-slate-900 transition-[background-color,color,border-color] duration-120 ease-[ease] hover:border-slate-900 hover:bg-slate-900 hover:text-white focus-visible:border-slate-900 focus-visible:bg-slate-900 focus-visible:text-white focus-visible:outline-2 focus-visible:outline-slate-900 focus-visible:outline-offset-2"
                      aria-label={copyButtonLabel}
                      title={copyButtonLabel}
                      onClick={handleCopyClick}
                    >
                      {copyState === "copied" ? (
                        <Check className="h-[0.82rem] w-[0.82rem]" aria-hidden="true" />
                      ) : (
                        <Copy className="h-[0.82rem] w-[0.82rem]" aria-hidden="true" />
                      )}
                    </button>
                    {showCopyError ? (
                      <span
                        className="text-[length:clamp(0.58rem,0.16vw+0.55rem,0.7rem)] leading-none text-red-700"
                        role="status"
                        aria-live="polite"
                      >
                        copy failed
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </span>
            );
          }

          return (
            <a
              key={link.id}
              href={link.href}
              target={link.target}
              rel={link.rel}
              className="inline-flex h-auto w-auto items-center justify-center border-0 bg-transparent p-0 text-black no-underline transition-[transform,color,opacity] duration-120 ease-[ease] hover:-translate-y-px hover:opacity-60 focus-visible:-translate-y-px focus-visible:opacity-60 focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
              aria-label={link.label}
            >
              <HeroContactIcon channel={link.id} />
            </a>
          );
        })}
      </span>
    </span>
  );
});
