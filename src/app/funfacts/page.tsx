import Link from "next/link";

export default function FunFactsPage() {
  return (
    <main className="p-3 md:p-12">
      <Link
        href="/"
        className="group mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-black/20 bg-white/90 px-4 py-2 text-sm text-black shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_22px_rgba(0,0,0,0.14)] focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-2"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
          fill="none"
        >
          <path
            d="M10.5 3.5 6 8l4.5 4.5M6.5 8H14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        back
      </Link>
      <h1 className="mb-6 text-3xl font-bold">fun facts:</h1>
      <ul className="list-disc space-y-2 pl-5 text-lg">
        <li>once flew a plane over the golden gate bridge</li>
        <li>trekked with gorillas</li>
        <li>
          was pranked by{" "}
          <a
            href="https://youtu.be/BgxO_WLSiMM?t=122&si=QMgqSm5Sc-dXXc-R"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            jimmy fallon
          </a>
        </li>
        <li>love horror movies</li>
        <li>
          lived in hong kong, sydney, san francisco, hawaii, sydney again, new
          york (in that order)
        </li>
      </ul>
    </main>
  );
}
