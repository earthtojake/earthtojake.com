import Link from "next/link";

export default function ProjectsPage() {
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
      <h1 className="mb-6 text-3xl font-bold">projects:</h1>
      <ul className="list-disc space-y-2 pl-5 text-lg">
        <li>
          <a
            href="https://github.com/earthtojake/text-to-cad"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            text-to-cad
          </a>
          , a set of{" "}
          <a
            href="https://cadskills.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            skills
          </a>{" "}
          to generate 3d cad models
        </li>
        <li>
          <a
            href="https://www.step.parts"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            step.parts
          </a>
          , 12,000+ open source step parts
        </li>
        <li>
          <a
            href="https://touchgrass.fm"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            touchgrass.fm
          </a>
        </li>
        <li>
          <a
            href="https://sim.earthtojake.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            multiplayer physics simulator
          </a>
        </li>
        <li>
          a{" "}
          <a
            href="https://mbb.earthtojake.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            game
          </a>{" "}
          i made in 8th grade
        </li>
      </ul>
    </main>
  );
}
