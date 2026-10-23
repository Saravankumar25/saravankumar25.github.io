# TDM Guide: authoring spec (read fully before writing)

You are writing chapters of a beginner-first textbook, "TDM Guide" (Test Data Management), published as a static HTML blog.
The reader is an **absolute beginner**: no knowledge of TDM, ETL, databases beyond "a table is like a spreadsheet", or any of the three tools
(Informatica TDM, GenRocket, Delphix). Spoon-feed: define every technical term in plain words the first time it appears.

## 1. Output format
- Write chapter **fragments** (no `<html>`, `<head>`, `<body>`): `tools/tdm-guide/chapters/<NN>-<slug>/`
  - `meta.json`: `{"num": 12, "slug": "informatica-discovery-and-profiling", "title": "...", "part": 2, "summary": "one sentence, plain English", "days": "Day 43"}`  (`days` optional)
  - `01.html`, `02.html`, `03.html` ...: parts, concatenated in name order. Keep each part about 150 to 260 lines so no single write is huge.
- **Length budget: WORD caps (hard).** Lines are not the measure, because reformatting changes line counts without changing content. Measure with `python3 tools/tdm-guide/measure.py <NN>` (visible-text words). Caps per section: 1=4,500; 2=6,800; 3=6,900; 4=8,000; 5=7,000; 6=8,000; 7=8,000; 8=9,500; 9=9,500; 10=6,600; 11-13=8,000 each; 14=10,000; 15-16=8,500 each; 17=7,000; 18-19=8,000 each; 20-21=9,500 each; 22-25=8,000 each; 26=10,000; 27=8,000; 28=9,000; 29-30=7,500 each; 32 (glossary)=8,000.
  Trim by cutting content that over-explains: repeated explanations, a second example where one is enough, redundant tables, long analogies, tangents, exhaustive UI-field enumeration, over-deep internals. Never trim by reformatting. Use standard formatting: a blank line between blocks, one block element per line, one table row per line; do not join several elements onto one line and do not split sentences across lines to inflate.
  Keep every curriculum topic, definitions, official screenshots that illustrate steps, numbered steps with reasons and expected results, labs, Recap, shortened source boxes and accuracy flags.
- Do **not** write `<h1>` (the page template adds it). Start with the chapter intro, then `<h2 id="...">` sections, `<h3 id="...">` subsections.
  **Every h2/h3 needs a unique kebab-case id prefixed with the chapter number**, e.g. `<h2 id="c12-what-is-profiling">12.1 What is profiling?</h2>`. Number headings "12.1", "12.2"...
- Build and check: `node tools/tdm-guide/build.mjs --check` (from repo root). It must report no ERRORs for your chapters.

## 2. Chapter skeleton (follow it)
1. Opening paragraph(s): where this chapter fits and why you care. Then `<div class="callout recap"><strong class="ctitle">What you will learn</strong><ul>...</ul></div>`.
2. `<h2>` "Words to know first": a `<dl class="defs">` of 6 to 12 terms, each `<div><dt>Term</dt><dd>plain-English meaning</dd></div>`. Also use `<dfn>term</dfn>` the first time a term appears in running text.
3. Core sections. For each major topic follow: **concept → simple explanation → why it matters → real-world example → visual → step-by-step → expected result.**
   Explain the *reason* behind each step, not just which button to click.
4. `<h2>` "Common mistakes and gotchas" (use callout.warn).
5. `<h2>` "Recap" (callout.recap, 4 to 8 bullets).
6. (No quizzes, practice questions or self-tests anywhere in this guide. Hands-on labs are fine.)
7. `<section class="sources"><h2 id="cNN-sources">Sources used in this chapter</h2><ul>...</ul></section>` listing every source you actually read for this chapter, with what it was used for.
8. Connect chapters: link to related chapters with relative hrefs (`12-informatica-discovery-and-profiling.html`) when you mention them.

## 3. Components (CSS already exists; use exactly these class names)
- Callouts: `<div class="callout note|tip|warn|why|example|real|recap"><strong class="ctitle">Title</strong><p>...</p></div>`
  (`why` = why it matters, `example`/`real` = worked or real-world example, `warn` = mistakes).
- Definitions: `<dl class="defs"><div><dt>Term</dt><dd>Meaning</dd></div></dl>`
- Numbered procedure: `<ol class="steps"><li><strong>Do this.</strong><p>Why we do it.</p><p class="expect">What you should see.</p></li></ol>`
- Flow diagram (simple boxes): `<div class="flow"><div class="node"><b>Extract</b>read from source</div><div class="arrow">→</div><div class="node">...</div></div>`
- Table: `<div class="tablewrap"><table><thead>...</thead><tbody>...</tbody></table></div>`; sample data: add `class="sample"` and a `<caption>`.
- Diagram you draw yourself: `<figure class="diagram"><svg viewBox="0 0 800 300" role="img" aria-label="...">...</svg><figcaption>Original diagram: ...</figcaption></figure>`.
  SVG must use `fill="currentColor"`/`stroke="currentColor"` or CSS variables (`var(--line)`, `var(--text)`, `var(--accent)`, `var(--surface)`) so it works in light and dark themes. Never hard-code white/black backgrounds.
  Or `<pre class="ascii">` for text diagrams (keep under 78 columns).
- Schematic UI sketch (original, NOT a screenshot): `<div class="mock"><div class="mbar">Window title</div><div class="mbody">...</div><div class="mnote">Schematic illustration drawn for this guide, not an official screenshot.</div></div>`
- Official screenshot (Delphix/GenRocket only, URL copied verbatim from the corpus `## Images` list):
  ```html
  <figure class="shot"><a href="IMG_URL" target="_blank" rel="noopener"><img src="IMG_URL" alt="what it shows" loading="lazy"></a>
  <figcaption><strong>Official screenshot:</strong> what it shows and why it matters here. <a class="badge-link" href="PAGE_URL" target="_blank" rel="noopener">Source page ↗</a></figcaption></figure>
  ```
- Visual reference with no image URL (Informatica PDF figures, or any place you cannot embed): `<div class="visualref"><span class="vtitle">Visual reference</span>Informatica TDM 10.5.10 User Guide, p.38, Figure "Test Data Manager" (a screenshot of the Overview view). What to look for: ...</div>`
- Evidence badges: `<span class="badge video">From video</span>` (taken from one of the three videos, whose transcripts the learner supplied), `<span class="badge doc">From docs</span>` (taken from the official source you read), `<span class="badge concept">General concept</span>`, `<span class="badge unverified">Unverified</span>`.
- Hands-on lab: `<div class="exercise"><h4>Lab: ...</h4><p>Goal...</p><ol class="steps">...</ol><details class="sol"><summary>Show a worked answer</summary>...</details></div>`
- Side-by-side: `<div class="compare"><div><h4>A</h4>...</div><div><h4>B</h4>...</div></div>`
- Code: `<pre><code>...</code></pre>` (escape `<` `>` `&`). Do not add language classes.

## 4. Evidence rules (non-negotiable)
- Ground every tool-specific statement in the source files you were given. **Read them in full** (use `cat`/Read in chunks); do not skim headings only.
- **Never invent**: menu labels, field names, parameter names, button names, version numbers, default values, algorithm names, URLs, or image URLs. If the source does not say it, either omit it or say plainly "the documentation excerpt I had does not specify this; check your version".
- Put the evidence note at the top of every tool chapter in a `callout note` titled "What this chapter is based on": name the source files/pages and versions (Delphix docs are "Continuous Compliance 2026.5, last published October 16, 2026"; the Informatica source is the **TDM 10.5.10 User Guide PDF, February 2026, 455 pages**).
- Informatica: cite as "(User Guide 10.5.10, p.NN)" where NN is the PDF page number printed in the file markers (`===== PDF PAGE NN =====`; printed page numbers match).
  Do **not** link to docs.informatica.com pages (they block automated access) except the learner-supplied architecture page, which you may link and must label `<span class="badge unverified">not fetched, site blocks automated access</span>`.
- Delphix/GenRocket: link the exact doc page for each topic (URL is on line 2 of each corpus file) and embed screenshots from that page's `## Images` list.
  Before embedding an important screenshot, look at it: `curl -sS -o /tmp/shot.png "IMG_URL"` (use your scratch dir) and view with the Read tool, so the caption describes what is actually visible. If you did not view it, caption only what the page text says it shows.
- The three YouTube videos' transcripts could not be retrieved. Never describe their content. Titles (confirmed via oEmbed): (1) "How to create mapplet in informatica", LearningMart; (2) "GenRocket Overview Video 2022", GenRocketINC; (3) "Test Data Automation-Webinar by Kualitatem and GenRocket", Kualitatem Official. You may link them as "Related video (transcript not available; not used as a source)".
- The curriculum mentions "Cog IPs" (Cognizant proprietary tools). You have no source for them: say they are organisation-specific and to ask the trainer; never describe them.
- Paraphrase in your own words. Quote at most a short phrase. No pasting of documentation paragraphs.
- Official-doc facts are from specific product versions; where a step may differ by version, say so once, briefly.
- Hands-on labs: use the exact sample data in section 5 so labs connect across chapters. Mark what is from the docs vs. your illustrative example.

## 5. Shared running example (use it so chapters connect)
Fictional company **ShopSphere**, an online retailer, testing its "Customer Orders" app. All data is fake.
Source database `SHOPSPHERE_PROD` (never copied to testing as-is) with tables:
- `CUSTOMERS(customer_id PK, first_name, last_name, email, phone, ssn, date_of_birth, zip_code, tax_id)`
- `ORDERS(order_id PK, customer_id FK -> CUSTOMERS, order_date, total_amount)`
- `ORDER_ITEMS(item_id PK, order_id FK -> ORDERS, product_code, quantity, unit_price)`
- `PRODUCTS(product_code PK, product_name, price)`
Sample rows (fake): `1001 | Asha | Menon | asha.menon@example.com | 9876543210 | 123-45-6789 | 1990-04-12 | 560001`,
`1002 | Ravi | Kumar | ravi.k@example.com | 9123456780 | 234-56-7890 | 1985-11-02 | 600017`,
`1003 | Meera | Nair | meera.n@example.com | 9988776655 | 345-67-8901 | 1999-07-23 | 682001`.
Test team: QA engineers, developers, a "TDM engineer" (the learner's target role), a data steward, a compliance officer.

## 6. Style
- Plain, friendly English. Short sentences. Active voice. Explain jargon at first use, then use it consistently.
- Use analogies (photocopier that blacks out names, LEGO bricks, library cards), but mark where an analogy stops being accurate.
- Concrete before abstract: show the example first, name the concept second.
- Avoid: "delve", "leverage", "robust", "seamless", "in today's world", rhetorical filler, em-dash overuse, three-item lists by reflex.
- Each section should earn its lines. Tables for comparisons, steps for procedures, short paragraphs for explanation.

## 7. Chapter map (use these filenames for cross links)
| # | file |
|---|------|
| 1 | 01-start-here.html |
| 2 | 02-why-tdm.html |
| 3 | 03-data-basics.html |
| 4 | 04-sensitive-data-and-regulations.html |
| 5 | 05-discovery-and-subsetting-concepts.html |
| 6 | 06-masking-concepts.html |
| 7 | 07-test-data-classification-and-generation-concepts.html |
| 8 | 08-etl-from-scratch.html |
| 9 | 09-etl-and-tdm.html |
| 10 | 10-informatica-overview-and-architecture.html |
| 11 | 11-informatica-tdm-tour.html |
| 12 | 12-informatica-discovery-and-profiling.html |
| 13 | 13-informatica-data-subset.html |
| 14 | 14-informatica-data-masking.html |
| 15 | 15-informatica-data-generation.html |
| 16 | 16-informatica-plans-workflows-and-warehouse.html |
| 17 | 17-genrocket-overview.html |
| 18 | 18-genrocket-domains-attributes-generators.html |
| 19 | 19-genrocket-receivers-and-scenarios.html |
| 20 | 20-genrocket-data-patterns.html |
| 21 | 21-genrocket-hands-on-50-records.html |
| 22 | 22-delphix-overview-and-terminology.html |
| 23 | 23-delphix-connectors-and-vdb.html |
| 24 | 24-delphix-rule-sets-and-keys.html |
| 25 | 25-delphix-profiling.html |
| 26 | 26-delphix-algorithms-and-masking-jobs.html |
| 27 | 27-delphix-file-masking.html |
| 28 | 28-delphix-hands-on-labs.html |
| 29 | 29-planning-real-engagements.html |
| 30 | 30-capstone-project.html |
| 32 | 32-glossary.html |
| 99 | 99-sources-and-limitations.html |
Parts: 1 = ch 1-9 (Foundations), 2 = ch 10-16 (Informatica), 3 = ch 17-21 (GenRocket), 4 = ch 22-28 (Delphix), 5 = ch 29-32 and 99.

## 8. Source corpora (all in the session scratchpad, already fetched and read-only)
Base: `/tmp/claude-0/-home-user-saravankumar25-github-io/443c68a6-609b-5976-aa58-7536f35c57ff/scratchpad`
- `informatica/chapters/chNN-*.txt`: Informatica TDM 10.5.10 User Guide split by chapter, with `===== PDF PAGE n =====` markers. Full text: `informatica/full.txt`. PDF itself: `informatica/tdm_guide.pdf` (render a page to look at a figure: `pdftoppm -f 38 -l 38 -r 80 -png informatica/tdm_guide.pdf /tmp/x` then Read the PNG).
- `delphix/pages/*.md`: 352 Delphix Continuous Compliance doc pages (title, URL, headings, verified screenshot URLs, text). `grep -il keyword delphix/pages/*.md` to find pages.
- `genrocket/pages/*.md` + `genrocket/INDEX.tsv` (category, file, title, chars, image count): 845 GenRocket help pages. `genrocket/app_receivers_page.txt`: the app.genrocket.com receivers browse page text.
- No YouTube transcripts exist (see section 4).
