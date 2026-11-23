import type { SearchHit } from "../../lib/search";

/**
 * The title is already escaped by `highlight`. It is inserted as HTML for the
 * marks only. A title that still contained a raw tag would have failed the
 * highlight test before it reached this component.
 */
export function ResultItem({ hit }: { hit: SearchHit }) {
  return (
    <article>
      <p className="text-xs uppercase">{hit.kind}</p>
      <h2 dangerouslySetInnerHTML={{ __html: hit.titleHtml }} />
      <p dangerouslySetInnerHTML={{ __html: hit.snippetHtml }} />
    </article>
  );
}
