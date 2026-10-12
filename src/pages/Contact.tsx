import { config } from "../config";
import { useTitle } from "../hooks";

export default function Contact() {
  useTitle("Contact");
  return (
    <section className="wrap page">
      <p className="eyebrow">Contact</p>
      <h1>Get in touch</h1>
      <p className="lead">The fastest way to reach me is LinkedIn. My code and projects are on GitHub.</p>
      <ul className="contact">
        <li><a href={config.linkedin} target="_blank" rel="noopener noreferrer"><span>LinkedIn</span>saravan-kumar-m-k</a></li>
        <li><a href={config.github} target="_blank" rel="noopener noreferrer"><span>GitHub</span>Saravankumar25</a></li>
        {config.email && <li><a href={`mailto:${config.email}`}><span>Email</span>{config.email}</a></li>}
      </ul>
    </section>
  );
}
