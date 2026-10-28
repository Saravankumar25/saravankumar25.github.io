# Permanent engineering standards

These requirements apply to every newly published page and every maintenance change. The website remains a static GitHub Pages site.

1. **Universal themes.** Every public page, blog, chapter, lesson, and standalone educational page supports light and dark themes with a visible, keyboard-accessible toggle. Use the shared theme runtime and `sk-theme` preference. Respect system preference until the reader chooses. Do not introduce another storage key or independent theme handler.
2. **Universal SEO.** Every indexable page has unique, accurate metadata, a canonical URL, appropriate structured data, and a social preview in its initial HTML. Client-only head changes are insufficient.
3. **Universal GEO.** Published content must use factual, semantic, AI-readable HTML, descriptive headings, real attribution, and relevant sources. Do not invent dates, credentials, citations, or claims. No discovery technique guarantees search or AI inclusion.
4. **Universal downloads.** Every published blog and chapter has an appropriate individual download and collection ZIP. Downloads preserve local dependencies and disclose internet-dependent features. A broken or incomplete download blocks publication.
5. **Automatic sitemap.** All canonical, published, indexable content enters the generated sitemap. Never maintain sitemap XML manually. Exclude aliases, drafts, error pages, and assets.
6. **Consistent architecture.** Use the shared content registry, metadata generation, theme runtime, and download generator. Preserve the established content formats instead of creating another publication system.
7. **No broken publication.** Required metadata, navigation, themes, and downloads must work before content is production-ready. Resolve validation failures instead of disabling the gate.
8. **Preserve content.** Refactoring must not remove, truncate, or change educational explanations. Review changes to source text separately from infrastructure. Preserve existing URLs or provide an explicit compatible alias.
9. **GitHub Pages compatibility.** The production output must work as static files without a persistent backend. Deep links must resolve to emitted HTML files.
10. **Documentation maintenance.** Architectural, feature, and publishing workflow changes must update the relevant documentation in the same change.
11. **No duplication.** Prefer shared utilities, templates, and components. Avoid copying theme, metadata, download, or navigation implementations into each series.
12. **Automated validation.** Run type checking, production build, generated-site validation, archive checks, and browser tests before deployment. Compilation alone does not prove correctness.

## Explicit practical limits

- A theme toggle and interactive laboratories require JavaScript; the underlying text and navigation must remain readable without it.
- External source pages, remote screenshots, hosted fonts, and online services may require an internet connection. Offline archives explain these limits and preserve locally available content.
- Search engines and social platforms control indexing and cache refreshes. Passing local metadata checks does not verify their live caches.
- Automated checks cannot establish factual accuracy of every technical explanation, guarantee complete accessibility, or measure real-user Core Web Vitals. Content review and representative browser checks remain necessary.
- Do not use the build date as a publication or modification date. Omit unknown dates.
