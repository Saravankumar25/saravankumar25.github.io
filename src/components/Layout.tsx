import { useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { config } from "../config";
import { useScrollTop } from "../hooks";

const nav = [
  ["/projects", "Projects"],
  ["/about", "About"],
  ["/research", "Research"],
  ["/journal", "Journal"],
  ["/resume", "Resume"],
  ["/contact", "Contact"],
] as const;

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useScrollTop();
  // Close the mobile menu after any navigation.
  const [last, setLast] = useState(pathname);
  if (last !== pathname) {
    setLast(pathname);
    setOpen(false);
  }

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="header">
        <div className="wrap bar">
          <Link to="/" className="brand">SK</Link>
          <button className="menu" aria-expanded={open} aria-controls="nav" onClick={() => setOpen(!open)}>
            {open ? "Close" : "Menu"}
          </button>
          <nav id="nav" className={open ? "open" : ""} aria-label="Primary">
            {nav.map(([to, label]) => (
              <NavLink key={to} to={to}>{label}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main"><Outlet /></main>
      <footer className="footer">
        <div className="wrap foot">
          <span>© {new Date().getFullYear()} {config.name}</span>
          <span className="links">
            <a href={config.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href={config.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </span>
        </div>
      </footer>
    </>
  );
}
