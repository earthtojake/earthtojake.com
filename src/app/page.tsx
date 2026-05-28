"use client";

import { use } from "react";
import { HomePage } from "../views/HomePage";

const revealDisabledQueryParamValues = new Set([
  "0",
  "false",
  "no",
  "off",
]);

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function isRevealDisabledBySearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  const revealParam = searchParams.reveal;
  const revealValue = Array.isArray(revealParam) ? revealParam[0] : revealParam;

  return (
    typeof revealValue === "string" &&
    revealDisabledQueryParamValues.has(revealValue.trim().toLowerCase())
  );
}

export default function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = use(searchParams);

  return (
    <HomePage
      disableRevealAnimations={isRevealDisabledBySearchParams(
        resolvedSearchParams,
      )}
    />
  );
}
