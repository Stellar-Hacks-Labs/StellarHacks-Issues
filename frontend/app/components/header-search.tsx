"use client";

import { useEffect, useRef, useState } from "react";
import { searchShortcut } from "../../lib/search/shortcuts";

/**
 * The field in the bar.
 *
 * It is a form that navigates to /search, so the query ends up in the URL
 * rather than in this component. Slash and command-K focus it from anywhere
 * that is not already a field, and Escape empties it.
 */
export function HeaderSearch() {
  const field = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target !== null && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      const action = searchShortcut(event);
      if (action === "focus" && !typing) {
        event.preventDefault();
        field.current?.focus();
      }
      if (action === "clear" && document.activeElement === field.current) {
        setValue("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form action="/search" role="search" className="hidden min-w-0 flex-1 px-4 md:block">
      <label className="sr-only" htmlFor="header-search">Search hackathons, projects, and builders</label>
      <input
        ref={field}
        id="header-search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search · /"
        className="w-full max-w-sm rounded-full border border-rule bg-paper px-4 py-1.5 text-sm"
      />
    </form>
  );
}
