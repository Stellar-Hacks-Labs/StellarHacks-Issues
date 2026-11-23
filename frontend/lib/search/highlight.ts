/**
 * Marks the matched words in a title without letting the title become HTML.
 *
 * The title is escaped first and the marks are added to that escaped text.
 * Doing it the other way round would escape the marks themselves, and doing
 * neither would turn a project named `<script>` into a script. The mark tags
 * are the only HTML this function is allowed to emit.
 */
const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ESCAPES[character] ?? character);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlight(value: string, rawQuery: string): string {
  const safe = escapeHtml(value);
  const terms = [...new Set(
    (rawQuery ?? "")
      .toLowerCase()
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length > 0),
  )];
  if (terms.length === 0) return safe;
  const pattern = new RegExp(terms.map(escapeRegExp).join("|"), "gi");
  return safe.replace(pattern, (match) => `<mark>${match}</mark>`);
}
