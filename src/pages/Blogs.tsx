import { Link, useParams } from "react-router-dom";
import { useTitle } from "../hooks";
import NotFound from "./NotFound";

export interface Post { slug: string; title: string; date: string; summary: string; body: string }

// Only content/journal is bundled (drafts live in content/drafts and never ship); draft: true is also filtered out.
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

export default function Blogs() {
  useTitle("Blogs");
  const posts = getPosts();
  return (
    <section className="wrap page">
      <p className="eyebrow">Blogs</p>
      <h1>Blogs</h1>
      <p className="lead">Illustrated, first-principles guides to how computers and machine learning work.</p>
      <ul className="posts">
        <li>
          <a href="/blogs/how-computers-work/">
            <span className="mono">2026-10-13 · Illustrated learning blog</span>
            <h3>How Computers Work</h3>
            <p>An interactive, first-principles journey from bits to a programmable CPU.</p>
          </a>
        </li>
        <li>
          <a href="/blogs/from-machine-learning-to-transformers/">
            <span className="mono">2026-10-14 · Illustrated learning blog</span>
            <h3>From Machine Learning to Transformers</h3>
            <p>Ten chapters tracing machine learning from its foundations through neural networks, NLP, and modern Transformers.</p>
          </a>
        </li>
        {posts.map((p) => (
          <li key={p.slug}>
            <Link to={`/blogs/${p.slug}`}>
              <span className="mono">{p.date}</span>
              <h3>{p.title}</h3>
              <p>{p.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BlogPost() {
  const { slug } = useParams();
  const post = getPosts().find((p) => p.slug === slug);
  useTitle(post?.title ?? "Article not found");
  if (!post) return <NotFound />;

  // Minimal renderer: "## " headings, ``` code fences, blank-line separated paragraphs.
  const out: JSX.Element[] = [];
  let para: string[] = [], code: string[] | null = null, list: string[] = [];
  const flush = () => {
    if (para.length) out.push(<p key={out.length}>{para.join(" ")}</p>);
    if (list.length) out.push(<ul key={out.length}>{list.map((l) => <li key={l}>{l}</li>)}</ul>);
    para = [];
    list = [];
  };
  for (const line of post.body.split("\n")) {
    if (line.startsWith("```")) {
      if (code) { out.push(<pre key={out.length}><code>{code.join("\n")}</code></pre>); code = null; }
      else { flush(); code = []; }
    } else if (code) code.push(line);
    else if (line.startsWith("## ")) { flush(); out.push(<h2 key={out.length}>{line.slice(3)}</h2>); }
    else if (line.startsWith("- ")) list.push(line.slice(2));
    else if (!line.trim()) flush();
    else para.push(line);
  }
  flush();

  return (
    <article className="wrap page prose">
      <Link className="back" to="/blogs">← Blogs</Link>
      <p className="mono">{post.date}</p>
      <h1>{post.title}</h1>
      {out}
    </article>
  );
}
