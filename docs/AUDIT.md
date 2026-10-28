# Repository audit

## Confirmed baseline findings

- The portfolio used `HashRouter`; the initial response contained an empty React root and a single homepage head. About, project details, research, resume, contact, and blog index content depended on JavaScript.
- Client-side `useTitle` updated titles only. Individual React routes lacked distinct server-delivered descriptions, canonical URLs, structured data, and social images.
- The static educational material used multiple independently maintained layouts and theme behaviors. The portfolio itself used dark-only CSS.
- The root sitemap contained manually maintained entries and did not enumerate the complete educational inventory or portfolio project routes.
- Four series were hardcoded in the React blog index. The repository combines React data, standalone static HTML, and the TDM fragment/template generator.
- Reveal animation styles hid content until an IntersectionObserver effect ran, creating a no-JavaScript reading problem when prerendering.
- The deployment workflow installed dependencies and built assets, but did not validate metadata, links, downloads, or browser behavior.
- The baseline `npm audit` reported a high-severity Vite finding and a moderate esbuild finding. These concerned the development toolchain; the deployed output is static.
- No root README or professional documentation index existed.

## Existing behavior to preserve

- Portfolio project records distinguish prototypes, active development, and verified local behavior; no production claims should be added.
- Research explicitly describes three accepted conference papers as not yet presented or published. Do not turn them into published research in structured data.
- The resume deliberately links to LinkedIn when `config.resumeUrl` is unset; there is no existing local PDF to preserve or invent.
- Markdown publication requires explicit `draft: false`. Drafts under `src/content/drafts` must remain excluded.
- Educational explanations, interactive labs, illustrations, citations, chapter order, and all established static HTML URLs are publication assets, not disposable implementation detail.

## Improvements that require judgment

Directory moves alone would add risk without improving the hybrid architecture. Shared build-time enrichment can standardize publication while keeping the original material in place. External screenshots and citations should remain attributed, and their offline availability must be described honestly. Real-world performance and social cache behavior require production measurements beyond local build checks.
