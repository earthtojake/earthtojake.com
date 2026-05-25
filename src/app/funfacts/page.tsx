import { SecondaryPageLayout } from "../../components/SecondaryPageLayout";

export default function FunFactsPage() {
  return (
    <SecondaryPageLayout title="fun facts">
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
    </SecondaryPageLayout>
  );
}
