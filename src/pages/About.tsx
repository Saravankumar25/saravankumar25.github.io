import { capabilities, experience } from "../data/site";
import { useTitle } from "../hooks";

export default function About() {
  useTitle("About");
  return (
    <section className="wrap page">
      <p className="eyebrow">About</p>
      <h1>Product-focused engineering, from data model to interface.</h1>
      <p className="lead">
        I am a software engineer and the Founding Engineer at Varpitech. I design and build full-stack applications,
        AI systems, agentic workflows, developer tools and applied machine-learning solutions, and I care most about
        the parts that make them trustworthy: clear boundaries, verifiable output and honest limits.
      </p>

      <h2 className="section">Capabilities</h2>
      <div className="grid3">
        {capabilities.map((c) => (
          <div className="card" key={c.title}>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </div>
        ))}
      </div>

      <h2 className="section" id="experience">Experience</h2>
      {experience.map((e) => (
        <div className="role" key={e.role + e.org}>
          <div className="role-head">
            <h3>{e.role} · {e.org}</h3>
            <span className="mono">{e.period}</span>
          </div>
          <ul>{e.points.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      ))}
    </section>
  );
}
