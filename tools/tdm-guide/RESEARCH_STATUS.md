# TDM Guide: research access ledger

Rule: a source is **RESEARCHED** only after its full page or transcript was fetched and read in this session.
Search-engine excerpts do **not** count. Nothing below is RESEARCHED yet.

Checked 2026-10-23 from the cloud session. Cause of failure: the egress proxy answers `403` to `CONNECT` for every host below
(it also denies `example.com`, Wikipedia and `archive.org`, so it is an allowlist, not a per-site block).
Reachable: github.com, raw.githubusercontent.com, pypi.org, registry.npmjs.org. `WebFetch` fails earlier with `ENOTFOUND` (no DNS in its path).
A headless Chromium and `youtube-transcript-api` use the same proxy and fail the same way.

| # | Source | Host needing access | Status | What cannot be verified |
|---|--------|---------------------|--------|-------------------------|
| D1 | https://app.genrocket.com/browse/receivers | app.genrocket.com | NOT ACCESSED (403 CONNECT) | receiver catalogue, parameters, any images |
| D2 | https://help.delphix.com/cc/current/content/managing_connectors.htm | help.delphix.com | NOT ACCESSED | connector types, fields, screenshots |
| D3 | https://help.delphix.com/cc/current/content/managing_rule_sets.htm | help.delphix.com | NOT ACCESSED | rule set steps, screenshots |
| D4 | https://help.delphix.com/cc/current/content/create | help.delphix.com | NOT ACCESSED, URL looks truncated | which page was meant (probably a `create__...` job page) |
| D5 | https://help.delphix.com/cc/current/content/managing_profiling_jobs.htm | help.delphix.com | NOT ACCESSED | profiling job steps, screenshots |
| D6 | https://docs.informatica.com/.../10-5-10/user-guide/introduction-to-test-data-management/tdm-architecture.html | docs.informatica.com | NOT ACCESSED | architecture text and diagram |
| D7 | https://genrocket.helpjuice.com/ (whole help centre) | genrocket.helpjuice.com | NOT ACCESSED | domains, generators, receivers, scenarios articles and images |
| V1 | https://www.youtube.com/watch?v=DVyJqMi7QtY | www.youtube.com | NO TRANSCRIPT (403) | title, content |
| V2 | https://www.youtube.com/watch?v=Z89qnX5B1xE | www.youtube.com | NO TRANSCRIPT (403) | title, content |
| V3 | https://www.youtube.com/watch?v=iJdUoxupDqA | www.youtube.com | NO TRANSCRIPT (403) | title, content |

Also needed for image links: the hosts that serve each page's images (usually the same host, sometimes a CDN). Image URLs cannot be listed until a page's HTML is fetched.

Only third-party material reachable so far: GitHub repos under `delphix/` (masking API tooling, e.g. dxm-toolkit). These are API tools, not the documentation set, and do not replace D1 to D7.

`links.txt` lists URLs that search results *surfaced*. They have **not** been fetched, so they are leads, not verified sources.
