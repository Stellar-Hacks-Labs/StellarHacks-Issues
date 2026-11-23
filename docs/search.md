# Search

Search covers hackathons, projects, and builders. The query is split into words. Every word has to appear in the title or the body. Facets are phase, prize asset, tag, and country, and their counts are taken from the rows the current query returned.

The page is `/search`. The header field submits there. `/` and Command-K focus the field. Escape clears it.

Highlights are computed after HTML escaping. The only tags inserted are `<mark>` around the matched words.

The Postgres function `search_catalog` applies the same visibility rule as `frontend/lib/search`. See `docs/search-visibility.md`.
