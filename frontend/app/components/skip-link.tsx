/**
 * A skip link that lets keyboard users jump to main content.
 * 
 * Screen reader and keyboard-only users have to tab through the
 * header navigation on every page. A skip link at the very top
 * of the document lets them bypass that and go straight to the
 * content they came for.
 * 
 * The link is visually hidden until it receives focus, then
 * appears at the top of the viewport. This is a WCAG 2.2 AA
 * requirement for pages with repeated navigation blocks.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 -translate-y-20 rounded-lg bg-ink px-6 py-3 text-[1rem] font-medium text-paper shadow-xl transition-transform duration-150 ease-settle focus:translate-y-0"
    >
      Skip to main content
    </a>
  );
}
