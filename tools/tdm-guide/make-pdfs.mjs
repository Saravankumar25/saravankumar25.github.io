// Renders every built chapter to an A4 PDF with Chromium (print CSS in guide.css) and zips them.
// Run after build.mjs:  node tools/tdm-guide/make-pdfs.mjs
// Needs playwright-core and a Chromium (set PLAYWRIGHT_CORE to its folder if it is not resolvable).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "../../public/blogs/tdm-guide");
const require = createRequire(process.env.PLAYWRIGHT_CORE ? path.join(process.env.PLAYWRIGHT_CORE, "x.js") : import.meta.url);
const { chromium } = require("playwright-core");

const browsers = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
const exe = fs.readdirSync(browsers).filter((d) => d.startsWith("chromium-"))
  .map((d) => path.join(browsers, d, "chrome-linux/chrome")).find((p) => fs.existsSync(p));
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "<-loopback>" } : undefined;

const chapters = fs.readdirSync(outDir).filter((f) => /^\d\d-.*\.html$/.test(f)).sort();
fs.mkdirSync(path.join(outDir, "pdf"), { recursive: true });
fs.mkdirSync(path.join(outDir, "downloads"), { recursive: true });

const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"], proxy });
for (const f of chapters) {
  const ctx = await browser.newContext({ colorScheme: "light", viewport: { width: 1000, height: 1400 } });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(path.join(outDir, f)).href, { waitUntil: "load", timeout: 90000 });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  await page.evaluate(async () => {
    const imgs = [...document.images];
    imgs.forEach((i) => { i.loading = "eager"; });
    await Promise.all(imgs.map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 20000); })));
  });
  await page.emulateMedia({ media: "print", colorScheme: "light" });
  const title = (await page.locator("h1").first().textContent()).trim();
  const num = f.slice(0, 2);
  const out = path.join(outDir, "pdf", f.replace(/\.html$/, ".pdf"));
  await page.pdf({
    path: out, format: "A4", printBackground: true,
    margin: { top: "16mm", bottom: "18mm", left: "15mm", right: "15mm" },
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div style="font:8px sans-serif;color:#666;width:100%;padding:0 15mm;display:flex;justify-content:space-between"><span>TDM Guide · Chapter ${num}: ${title.replace(/[<>&]/g, "")}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });
  console.log(path.basename(out), Math.round(fs.statSync(out).size / 1024) + " KB");
  await ctx.close();
}
await browser.close();

const zip = path.join(outDir, "downloads/tdm-guide-all-chapters.zip");
fs.rmSync(zip, { force: true });
execFileSync("zip", ["-q", "-j", zip, ...chapters.map((f) => path.join(outDir, "pdf", f.replace(/\.html$/, ".pdf")))]);
console.log("zip", Math.round(fs.statSync(zip).size / 1024) + " KB");
