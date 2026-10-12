import { config } from "../config";
import { experience, skills } from "../data/site";
import { useTitle } from "../hooks";

export default function Resume() {
  useTitle("Resume");
  return (
    <section className="wrap page">
      <p className="eyebrow">Resume</p>
      <h1>{config.name}</h1>
      <p className="lead">{config.title}</p>
      <div className="actions">
        {config.resumeUrl ? (
          <a className="btn" href={config.resumeUrl} download>Download PDF</a>
        ) : (
          <a className="btn" href={config.linkedin} target="_blank" rel="noopener noreferrer">Full resume on LinkedIn</a>
        )}
        <a className="btn ghost" href={config.github} target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>

      <h2 className="section">Experience</h2>
      {experience.map((e) => (
        <div className="role" key={e.role + e.org}>
          <div className="role-head">
            <h3>{e.role} · {e.org}</h3>
            <span className="mono">{e.period}</span>
          </div>
          <ul>{e.points.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      ))}

      <h2 className="section">Skills</h2>
      <ul className="plain">
        {skills.map((g) => <li key={g.group}><strong>{g.group}.</strong> {g.items.join(", ")}</li>)}
      </ul>
    </section>
  );
}
