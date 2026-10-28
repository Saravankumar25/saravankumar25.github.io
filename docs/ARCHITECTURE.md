# Architecture and routing

## Hybrid static architecture

The portfolio remains React/Vite. Existing educational HTML stays in `public/blogs`; the TDM guide retains its fragment generator in `tools/tdm-guide`. Moving every guide into React would risk content and interactive behavior without improving static delivery. Publication infrastructure enriches emitted HTML at build time instead.

Portfolio views live in `src/pages`, shared presentation in `src/components`, project and profile data in `src/data`, and configuration in `src/config.ts`. `src/data/routes.ts` supplies portfolio publication metadata, including project detail routes derived from project records. `src/entry-static.tsx` renders the same app with a memory router for the production publisher. Published markdown posts are discovered by the existing explicit publication filter.

`src/content/series.json` identifies the educational collections. The publisher discovers their actual HTML pages, assigns canonical metadata, writes social previews, and records the resulting inventory in `dist/site-manifest.json`. This generated manifest is shared by validation and tests. It is not an author-maintained second list of URLs.

The shared publisher consists of orchestration, `metadata.mjs`, `downloads.mjs`, and `validate.mjs`. Theme behavior lives in `public/shared/theme.js` and `theme.css`; publication controls use `publication.css`. The application and standalone documents share these assets.

## URLs

Portfolio pages use directory URLs, such as `/about/` and `/projects/unfold/`, backed by real `index.html` files. `BrowserRouter` hydrates the server-rendered portfolio. Existing `/#/…` bookmarks are migrated by the client bootstrap. React navigation loads published documents so each destination receives its correct head.

Existing educational `.html` URLs remain unchanged. Series roots use trailing slashes. Legacy aliases are excluded from the canonical sitemap and point to the corresponding current page. Do not manufacture duplicate indexable pages for `index.html`, directory URLs, or `/journals/` aliases.

## Generated output

- Static portfolio HTML and existing enriched educational HTML.
- `site-manifest.json`: canonical publication inventory.
- `social/*.png`: 1200 × 630 branded, page-specific previews.
- `sitemap.xml` and `robots.txt`: crawling inventory and discovery.
- `downloads/*.zip` and `downloads/manifest.json`: offline packages and coverage/integrity metadata.

Generated output must be rebuilt, not edited. A content change should update its real source; a cross-site change belongs in the publisher or shared assets.
