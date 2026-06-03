import { SecondaryPageLayout } from "../../components/SecondaryPageLayout";

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
          to generate 3d cad models
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
          , a way to program 3d models with mathematical functions
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
    </SecondaryPageLayout>
  );
}
