/**
 * The two keys the header field listens for.
 *
 * Slash focuses it, the same gesture a reader already knows from a list.
 * Escape clears it, so a half typed query can be abandoned without a click.
 * Command-K and Control-K focus it too, because that is the other gesture
 * people reach for. A shortcut that also submits would navigate on a key the
 * reader pressed in order to type.
 */
export function searchShortcut(event: { key: string; metaKey: boolean; ctrlKey: boolean; altKey?: boolean }): "focus" | "clear" | null {
  if (event.altKey) return null;
  if (event.key === "Escape") return "clear";
  if (event.key === "/" && !event.metaKey && !event.ctrlKey) return "focus";
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") return "focus";
  return null;
}
