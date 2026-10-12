import { Link } from "react-router-dom";
import Flow from "../components/Flow";
import Reveal from "../components/Reveal";
import { config } from "../config";
import { projects } from "../data/projects";
import { capabilities, experience, papers } from "../data/site";
import { useTitle } from "../hooks";
import { getPosts } from "./Journal";

export default function Home() {
  useTitle();
  const featured = projects.filter((p) => p.featured);
  const posts = getPosts().slice(0, 3);
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">Founding Engineer at Varpitech</p>
          <h1>{config.name}</h1>
          <p className="role-line">{config.title}</p>
          <p className="lead">
            I build full-stack products, AI systems and developer tools, and I put the effort into the parts that make
            them trustworthy: evidence-backed output, strict boundaries around what a model may do, and honest limits.
          </p>
          <div className="actions">
            <Link className="btn" to="/projects">View projects</Link>
            <a className="btn ghost" href={config.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className="btn ghost" href={config.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>
      </section>

      <section className="wrap block">
        <h2 className="section">Featured work</h2>
        {featured.map((p, i) => (
          <Reveal key={p.slug} className="feature">
            <div>
              <span className="mono">0{i + 1} · {p.category}</span>
              <h3>{p.name}</h3>
              <p className="lead sm">{p.tagline}</p>
              <p>{p.problem}</p>
              <span className="tags">{p.stack.slice(0, 6).map((s) => <i key={s}>{s}</i>)}</span>
              <Link className="more" to={`/projects/${p.slug}`}>Read the case study →</Link>
            </div>
            <Flow steps={p.flow} label={`${p.name} architecture flow`} />
          </Reveal>
        ))}
        <Link className="more" to="/projects">All projects →</Link>
      </section>

      <section className="wrap block">
        <h2 className="section">What I work on</h2>
        <div className="grid3">
          {capabilities.map((c) => (
            <Reveal key={c.title} className="card">
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="wrap block split">
        <div>
          <h2 className="section">Experience</h2>
          {experience.map((e) => (
            <div className="role" key={e.role + e.org}>
              <div className="role-head"><h3>{e.role} · {e.org}</h3><span className="mono">{e.period}</span></div>
              <p>{e.points[0]}</p>
            </div>
          ))}
          <Link className="more" to="/about#experience">More about me →</Link>
        </div>
        <div>
          <h2 className="section">Research</h2>
          <p>{papers.length} accepted IEEE conference papers, with sessions scheduled for December 16 and 19, 2026.</p>
          <Link className="more" to="/research">See the papers →</Link>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="wrap block">
          <h2 className="section">Recent writing</h2>
          <ul className="posts">
            {posts.map((p) => (
              <li key={p.slug}><Link to={`/journal/${p.slug}`}><span className="mono">{p.date}</span><h3>{p.title}</h3><p>{p.summary}</p></Link></li>
            ))}
          </ul>
        </section>
      )}

      <section className="wrap block cta">
        <h2>Let's talk</h2>
        <Link className="btn" to="/contact">Contact</Link>
      </section>
    </>
  );
}
