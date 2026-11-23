import type { FacetGroup } from "../../lib/search";

const LABELS: Record<FacetGroup["name"], string> = {
  phase: "Phase",
  prizeAsset: "Prize asset",
  tag: "Tag",
  country: "Country",
};

export function FacetPanel({ facets, q }: { facets: FacetGroup[]; q: string }) {
  return (
    <aside aria-label="Filters">
      {facets.map((facet) => (
        <section key={facet.name}>
          <h2 className="mt-4 text-sm font-semibold">{LABELS[facet.name]}</h2>
          <ul>
            {facet.options.map((option) => (
              <li key={option.value}>
                <a href={`/search?q=${encodeURIComponent(q)}&${facet.name}=${encodeURIComponent(option.value)}`}>
                  {option.value} <span>{option.count}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </aside>
  );
}
