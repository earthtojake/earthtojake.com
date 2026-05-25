"use client";

import Link from "next/link";
import { Polaroids } from "../components/Polaroids";
import { homePhotos } from "../data/homePhotos";

export function PhotosPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <header className="mx-auto flex w-full max-w-[1440px] items-end justify-between gap-4 px-[clamp(0.75rem,2.5vw,1.75rem)] pb-5 pt-5 md:pb-8 md:pt-10">
        <div>
          <Link
            href="/"
            className="mb-5 inline-flex text-xs text-slate-500 no-underline transition-colors hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-4"
          >
            back
          </Link>
          <h1 className="m-0 text-3xl font-semibold md:text-5xl">photos</h1>
        </div>
        <p className="m-0 pb-1 text-right text-xs text-slate-500">
          {homePhotos.length} photos
        </p>
      </header>

      <Polaroids
        slideIndex={100}
        photos={homePhotos}
        desktopLayout="columns"
        fitToContainer={false}
      />
    </main>
  );
}
