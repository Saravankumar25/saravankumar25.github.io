import { Link, useParams } from "react-router-dom";
import Flow from "../components/Flow";
import { bySlug, plain } from "../data/projects";
import { useTitle } from "../hooks";
import NotFound from "./NotFound";

export default function ProjectDetail() {
  const { slug } = useParams();
  const p = bySlug(slug);
  useTitle(p?.name ?? "Project not found");
  if (!p) return <NotFound />;

  return (
    <article className="wrap page case">
      <Link reloadDocument className="back" to="/projects">← Projects</Link>
      <p className="eyebrow">{p.category} · {p.status}</p>
      <h1>{p.name}</h1>
      <p className="lead">{p.tagline}</p>
      <p className="plain-box"><strong>In plain words.</strong> {plain[p.slug]}</p>

      <div className="case-grid">
        <div>
          <h2>The problem</h2>
          <p>{p.problem}</p>
          <h2>What it does</h2>
          <p>{p.what}</p>
          <h2>Key decisions</h2>
          <ul>{p.decisions.map((d) => <li key={d}>{d}</li>)}</ul>
          <h2>Limits and status</h2>
          <ul>{p.limits.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
        <aside>
          {p.flow.length > 0 && (
            <>
              <h2>Architecture</h2>
              <Flow steps={p.flow} label={`${p.name} architecture flow`} />
            </>
          )}
          <h2>Stack</h2>
          <span className="tags">{p.stack.map((s) => <i key={s}>{s}</i>)}</span>
        </aside>
      </div>
    </article>
  );
}
