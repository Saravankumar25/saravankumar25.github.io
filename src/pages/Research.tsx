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
        Three papers have been accepted at IEEE conferences. They have not been presented or published yet.
      </p>
      <ol className="papers">
        {papers.map((p) => (
          <li key={p.title} className="card">
            <span className="badge">Accepted · conference paper</span>
            <h3>{p.title}</h3>
            {p.note && <p>{p.note}</p>}
            {p.slug && <Link reloadDocument className="more" to={`/projects/${p.slug}`}>Read the implementation notes →</Link>}
          </li>
        ))}
      </ol>
    </section>
  );
}
