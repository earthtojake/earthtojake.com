"use client";

import { Polaroids } from "../components/Polaroids";
import { SecondaryPageLayout } from "../components/SecondaryPageLayout";
import { homePhotos } from "../data/homePhotos";

export function PhotosPage() {
  return (
    <SecondaryPageLayout
      title="photos"
      contentClassName={null}
      headerAside={
        <p className="m-0 pb-1 text-right text-xs text-slate-500">
          {homePhotos.length} photos
        </p>
      }
    >
      <Polaroids
        slideIndex={100}
        photos={homePhotos}
        desktopLayout="columns"
        fitToContainer={false}
      />
    </SecondaryPageLayout>
  );
}
