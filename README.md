# Saravan Kumar M K — engineering portfolio

React/Vite portfolio and four illustrated engineering guides, published as a static website on [GitHub Pages](https://saravankumar25.github.io/). The existing portfolio design, educational content, chapter URLs, and interactive laboratories are preserved.

## Development

Use Node.js 22 and npm.

```sh
npm ci
npm run dev
```

The development server supports editing the React application and existing static documents. The **production build** generates the full publication: prerendered portfolio routes, metadata, structured data, social images, sitemap, and offline archives. Use production output when checking SEO or downloads.

```sh
npm run build
node tools/publishing/validate.mjs
npx playwright install chromium
npx playwright test
npm run preview
```

Browser tests launch their own strict static server; unknown URLs return 404 rather than silently receiving the homepage.

## Repository

- `src/pages`, `src/components`, `src/data`: portfolio UI, reusable components, and factual portfolio content.
- `src/content/series.json`: published educational series registry.
- `src/content/drafts`: unpublished writing, excluded from the site.
- `public/blogs`: existing static educational content and local assets.
- `public/shared`: shared theme and publication interface assets.
- `tools/tdm-guide`: TDM source fragments and generator.
- `tools/publishing`: build-time publication, SEO, social images, downloads, and validation.
- `tests`: generated-site browser checks and static test server.
- `docs`: architecture, authoring, maintenance, and permanent engineering standards.
- `dist`: generated deployable site; never edit it manually.

## Deployment

The GitHub Actions workflow publishes `dist` to GitHub Pages after its required checks pass. Repository **Settings → Pages → Source** must use **GitHub Actions**. No backend, paid infrastructure, or external publishing service is needed.

Start with the [documentation index](docs/README.md), [engineering standards](docs/ENGINEERING_STANDARDS.md), and [audit](docs/AUDIT.md).
