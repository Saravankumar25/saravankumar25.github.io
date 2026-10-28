# SEO, GEO, and metadata

Every canonical page receives its title, description, canonical link, robots directive, Open Graph and Twitter metadata, language, and JSON-LD in the initial HTML. Crawlers do not need to execute React to obtain the body or head.

Portfolio metadata lives in `src/data/routes.ts`; project detail metadata follows `src/data/projects.ts`. Series identity comes from `src/content/series.json`, while individual educational metadata follows the actual document content. Titles and descriptions must be descriptive and unique, not keyword lists. Preserve existing headings and factual explanations.

`tools/publishing/metadata.mjs` constructs a consistent author `Person`, site `WebSite`, page-specific type, and breadcrumbs. Profile pages refer to the same author entity. Educational pages relate to their series. Do not describe unpublished research as published, or invent ratings, affiliations, dates, or citations.

The generator creates a readable 1200 × 630 PNG for each canonical page. The OG URL is absolute HTTPS, with dimensions and alternate text; Twitter uses a large-image card. The favicon is not a social preview. Inspect a sample image after typography or title changes.

The sitemap is generated from the canonical publication inventory. Drafts, aliases, and errors are excluded. Unknown publication/modification dates are omitted; a rebuild is not a content update. Only supply dates backed by content or trustworthy source history.

GEO here means clear, attributed, structured, crawlable content with genuine definitions, technical terminology, relationships, and sources. Existing citations and chapter connections remain part of the content. These practices do not guarantee indexing, ranking, AI citations, or social cache refreshes. Experimental discovery files are not substitutes for HTML or the sitemap.

After deployment, optionally verify ownership in Google Search Console and Bing Webmaster Tools and submit the sitemap. Use platform inspection tools to request social preview refreshes if cached results remain stale. These account-specific actions are manual.
