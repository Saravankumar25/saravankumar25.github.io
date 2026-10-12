import { Link, useParams } from "react-router-dom";
import { useTitle } from "../hooks";
import NotFound from "./NotFound";

export interface Post { slug: string; title: string; date: string; summary: string; body: string }

// Every .md in content/journal is bundled; drafts and _files are filtered out below.
const files = import.meta.glob("../content/journal/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export function getPosts(): Post[] {
  return Object.entries(files)
    .map(([path, raw]) => {
      const slug = path.split("/").pop()!.replace(/\.md$/, "");
      const m = raw.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!m || slug.startsWith("_")) return null;
      const meta: Record<string, string> = {};
      for (const line of m[1].split("\n")) {
        const i = line.indexOf(":");
        if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
      if (meta.draft !== "false") return null; // publish only on an explicit draft: false
      return { slug, title: meta.title, date: meta.date, summary: meta.summary, body: m[2] };
    })
    .filter((p): p is Post => p !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export default function Journal() {
  useTitle("Engineering journal");
  const posts = getPosts();
  return (
    <section className="wrap page">
      <p className="eyebrow">Journal</p>
      <h1>Engineering journal</h1>
      <p className="lead">Notes on how real systems are built and where they break.</p>
      {posts.length === 0 ? (
        <p className="empty">No articles are published yet.</p>
      ) : (
        <ul className="posts">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link to={`/journal/${p.slug}`}>
                <span className="mono">{p.date}</span>
                <h3>{p.title}</h3>
                <p>{p.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function JournalPost() {
  const { slug } = useParams();
  const post = getPosts().find((p) => p.slug === slug);
  useTitle(post?.title ?? "Article not found");
  if (!post) return <NotFound />;

  // Minimal renderer: "## " headings, ``` code fences, blank-line separated paragraphs.
  const out: JSX.Element[] = [];
  let para: string[] = [], code: string[] | null = null;
  const flush = () => { if (para.length) out.push(<p key={out.length}>{para.join(" ")}</p>); para = []; };
  for (const line of post.body.split("\n")) {
    if (line.startsWith("```")) {
      if (code) { out.push(<pre key={out.length}><code>{code.join("\n")}</code></pre>); code = null; }
      else { flush(); code = []; }
    } else if (code) code.push(line);
    else if (line.startsWith("## ")) { flush(); out.push(<h2 key={out.length}>{line.slice(3)}</h2>); }
    else if (!line.trim()) flush();
    else para.push(line);
  }
  flush();

  return (
    <article className="wrap page prose">
      <Link className="back" to="/journal">← Journal</Link>
      <p className="mono">{post.date}</p>
      <h1>{post.title}</h1>
      {out}
    </article>
  );
}
