import { Link } from "react-router-dom";
import { papers } from "../data/site";
import { useTitle } from "../hooks";

export default function Research() {
  useTitle("Research");
  return (
    <section className="wrap page">
      <p className="eyebrow">Research</p>
      <h1>Accepted conference papers</h1>
      <p className="lead">
        Three IEEE conference papers have been accepted. The conference sessions are scheduled for December 16 and
        19, 2026, so none has been presented or published yet.
      </p>
      <ol className="papers">
        {papers.map((p) => (
          <li key={p.title} className="card">
            <span className="badge">Accepted · conference paper</span>
            <h3>{p.title}</h3>
            {p.note && <p>{p.note}</p>}
            {p.slug && <Link className="more" to={`/projects/${p.slug}`}>Read the implementation notes →</Link>}
          </li>
        ))}
      </ol>
    </section>
  );
}
