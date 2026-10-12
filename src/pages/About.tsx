import { capabilities, experience, skills } from "../data/site";
import { useTitle } from "../hooks";

export default function About() {
  useTitle("About");
  return (
    <section className="wrap page">
      <p className="eyebrow">About</p>
      <h1>I build products end to end.</h1>
      <p className="lead">
        I am a software engineer and the Founding Engineer at Varpitech. I design and build full-stack applications,
        AI systems, agentic workflows, developer tools and applied machine-learning solutions.
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

      <h2 className="section">Skills</h2>
      <div className="skills">
        {skills.map((g) => (
          <div className="skill-group" key={g.group}>
            <h3>{g.group}</h3>
            <span className="tags">{g.items.map((i) => <i key={i}>{i}</i>)}</span>
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
