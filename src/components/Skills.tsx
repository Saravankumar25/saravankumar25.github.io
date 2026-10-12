import {
  siArangodb, siC, siCelery, siCplusplus, siDjango, siDocker, siExpress, siFastapi, siFirebase, siFlask,
  siGit, siGithubactions, siJavascript, siMongodb, siNestjs, siNeo4j, siNextdotjs, siNginx, siNodedotjs,
  siPostgresql, siPython, siPytorch, siQdrant, siLanggraph, siReact, siReactquery, siRedis, siRedux, siRust,
  siSqlite, siStreamlit, siTailwindcss, siTauri, siTerraform, siTypescript, siVite,
} from "simple-icons";
import { skills } from "../data/site";

// Official brand glyphs (Simple Icons), drawn in the site's monochrome. Skills without one render as text.
const icons: Record<string, { path: string }> = {
  Python: siPython, TypeScript: siTypescript, JavaScript: siJavascript, Rust: siRust, "C++": siCplusplus, C: siC,
  React: siReact, "Next.js": siNextdotjs, Vite: siVite, "Tailwind CSS": siTailwindcss, "Redux Toolkit": siRedux,
  "React Query": siReactquery, FastAPI: siFastapi, Django: siDjango, "Node.js": siNodedotjs, Express: siExpress,
  NestJS: siNestjs, Flask: siFlask, Celery: siCelery, Tauri: siTauri, LangGraph: siLanggraph, PyTorch: siPytorch,
  Streamlit: siStreamlit, PostgreSQL: siPostgresql, SQLite: siSqlite, MongoDB: siMongodb, Redis: siRedis,
  Neo4j: siNeo4j, ArangoDB: siArangodb, Qdrant: siQdrant, Docker: siDocker, Terraform: siTerraform,
  "GitHub Actions": siGithubactions, Firebase: siFirebase, Nginx: siNginx, Git: siGit,
};

export default function Skills() {
  return (
    <div className="skills">
      {skills.map((g) => (
        <div className="skill-group" key={g.group}>
          <h3>{g.group}</h3>
          <ul className="chips">
            {g.items.map((name) => (
              <li key={name}>
                {icons[name] && (
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={icons[name].path} /></svg>
                )}
                {name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
