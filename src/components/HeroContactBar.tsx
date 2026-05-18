import { Check, Copy } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

const heroEmailAddressObfuscated = "jakehenryfitz[at]gmail[dot]com";
const heroDialogIds = {
  email: "hero-email-dialog",
} as const;
const heroCopySuccessDurationMs = 1000;
const heroCopyFailureDurationMs = 1700;

type HeroContactChannel = "x" | "email" | "instagram" | "github" | "linkedin";
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
    href: "https://x.com/earthtojake",
    label: "X",
    target: "_blank",
    rel: "noopener noreferrer",
  },
  email: {
    id: "email",
    href: "#email",
    label: "Email",
  },
  instagram: {
    id: "instagram",
    href: "https://www.instagram.com/earthtojake__/",
    label: "instagram",
    target: "_blank",
    rel: "noopener noreferrer",
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
} as const;

const defaultHeroContactChannels: readonly HeroContactChannel[] = [
  "x",
  "email",
  "instagram",
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

  if (channel === "instagram") {
    return (
      <svg className={heroIconClassName} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
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
