import { Link } from "react-router-dom";
import HeroGraphic from "../components/HeroGraphic";
import Reveal from "../components/Reveal";
import { config } from "../config";
import { plain, projects } from "../data/projects";
import Skills from "../components/Skills";
import { experience, papers } from "../data/site";
import { useTitle } from "../hooks";
import { getPosts } from "./Journal";

// Order on the home page: the three headline products first, then a few more.
const shown = ["vivekium", "openframe", "unfold", "aegis", "imagemismatch", "lpq-atlas"]
  .map((s) => projects.find((p) => p.slug === s)!);

export default function Home() {
  useTitle();
  const posts = getPosts().slice(0, 3);
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <h1>{config.name}</h1>
              <p className="role-line">{config.title}</p>
              <p className="lead">
                I build full-stack products, AI systems and developer tools. Right now I'm building the hiring platform
                Vivekium, and OpenFrame, a desktop studio for filmmakers.
              </p>
              <div className="actions">
                <Link className="btn" to="/projects">View projects</Link>
                <a className="btn ghost" href={config.github} target="_blank" rel="noopener noreferrer">GitHub</a>
                <a className="btn ghost" href={config.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </div>
            </div>
            <HeroGraphic />
          </div>
          <Link to="/projects/openframe" className="spotlight">
            <span className="mono">Currently building</span>
            <strong>OpenFrame Studio</strong>
            <span>{plain.openframe}</span>
            <span className="more-inline">Read more →</span>
          </Link>
        </div>
      </section>

      <section className="wrap block">
        <h2 className="section">Skills</h2>
        <Skills />
      </section>

      <section className="wrap block">
        <h2 className="section">Experience</h2>
        {experience.map((e) => (
          <div className="role" key={e.role + e.org}>
            <div className="role-head"><h3>{e.role} · {e.org}</h3><span className="mono">{e.period}</span></div>
            <ul>{e.points.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        ))}
      </section>

      <section className="wrap block">
        <h2 className="section">Projects</h2>
        <ul className="cards">
          {shown.map((p) => (
            <li key={p.slug}>
              <Reveal className="fill">
                <Link to={`/projects/${p.slug}`} className="card link">
                  <span className="mono">{p.category}</span>
                  <h3>{p.name}</h3>
                  <p>{plain[p.slug]}</p>
                  <span className="tags">{p.stack.slice(0, 4).map((s) => <i key={s}>{s}</i>)}</span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
        <Link className="more" to="/projects">All projects →</Link>
      </section>

      <section className="wrap block">
        <h2 className="section">Research</h2>
        <p>{papers.length} papers accepted at IEEE conferences, on 5G network prediction and IoT systems.</p>
        <Link className="more" to="/research">See the papers →</Link>
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
