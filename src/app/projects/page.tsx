import { SecondaryPageLayout } from "../../components/SecondaryPageLayout";

function GitHubRepoLink({ repo }: { repo: string }) {
  return (
    <a
      href={`https://github.com/earthtojake/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${repo} on github`}
      className="inline-block align-[-0.125em] opacity-70 hover:opacity-100"
    >
      <svg className="h-[1em] w-[1em] fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    </a>
  );
}

export default function ProjectsPage() {
  return (
    <SecondaryPageLayout title="projects">
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
          to generate 3d cad models <GitHubRepoLink repo="text-to-cad" />
        </li>
        <li>
          <a
            href="https://www.armcade.tv"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            armcade.tv
          </a>
          , a{" "}
          <a
            href="https://x.com/i/broadcasts/1AxRnnWnQyYxl"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            livestream
          </a>{" "}
          of pvp chess robots being teleoperated by random players
        </li>
        <li>
          <a
            href="https://www.implicit.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            implicit.js
          </a>
          , a way to program 3d models with mathematical functions{" "}
          <GitHubRepoLink repo="implicit.js" />
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
          , 12,000+ open source step parts <GitHubRepoLink repo="step.parts" />
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
    </SecondaryPageLayout>
  );
}
