import { useState } from "react";
import { Link } from "react-router-dom";
import { categories, otherProjects, projects } from "../data/projects";
import { useTitle } from "../hooks";

export default function Projects() {
  useTitle("Projects");
  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const shown = projects.filter((p) => cat === "All" || p.category === cat);
  return (
    <section className="wrap page">
      <p className="eyebrow">Projects</p>
      <h1>Selected work</h1>
      <p className="lead">Products, tools and research systems, with the architecture and the limits of each.</p>

      <div className="filters" role="group" aria-label="Filter projects by category">
        {categories.map((c) => (
          <button key={c} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <ul className="cards">
        {shown.map((p) => (
          <li key={p.slug}>
            <Link to={`/projects/${p.slug}`} className="card link">
              <span className="mono">{p.category}</span>
              <h3>{p.name}</h3>
              <p>{p.tagline}</p>
              <span className="tags">{p.stack.slice(0, 4).map((s) => <i key={s}>{s}</i>)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="section">Smaller projects</h2>
      <ul className="plain">
        {otherProjects.map((o) => <li key={o.name}><strong>{o.name}.</strong> {o.line}</li>)}
      </ul>
    </section>
  );
}
