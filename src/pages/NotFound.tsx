import { Link } from "react-router-dom";
import { useTitle } from "../hooks";

export default function NotFound() {
  useTitle("Page not found");
  return (
    <section className="wrap page">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p className="lead">That page does not exist.</p>
      <Link className="btn" to="/">Back to home</Link>
    </section>
  );
}
