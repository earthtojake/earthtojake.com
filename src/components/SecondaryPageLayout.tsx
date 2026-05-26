"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type SecondaryPageLayoutProps = {
  title: string;
  headerAside?: ReactNode;
  children: ReactNode;
  contentClassName?: string | null;
};

const defaultContentClassName =
  "mx-auto w-full max-w-[1440px] px-[var(--site-page-padding-inline)] pb-[clamp(2rem,5vw,4rem)]";

export function SecondaryPageLayout({
  title,
  headerAside,
  children,
  contentClassName = defaultContentClassName,
}: SecondaryPageLayoutProps) {
  const content = contentClassName ? (
    <div className={contentClassName}>{children}</div>
  ) : (
    children
  );

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="mx-auto flex w-full max-w-[1440px] items-end justify-between gap-4 px-[var(--site-page-padding-inline)] pb-5 pt-5 md:pb-8 md:pt-10">
        <div>
          <Link
            href="/"
            className="mb-5 inline-flex text-xs text-slate-500 no-underline transition-colors hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-4"
          >
            back
          </Link>
          <h1 className="m-0 text-3xl font-semibold md:text-5xl">{title}</h1>
        </div>
        {headerAside}
      </header>

      {content}
    </main>
  );
}
