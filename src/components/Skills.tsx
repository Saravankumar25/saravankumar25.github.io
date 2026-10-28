import {
  siAnthropic, siApple, siArangodb, siC, siCelery, siCplusplus, siCrewai, siDjango, siDocker, siExpress, siFastapi,
  siFirebase, siFlask, siGit, siGithubactions, siGooglecloud, siGooglegemini, siJavascript, siLangchain, siLanggraph,
  siMongodb, siNeo4j, siNextdotjs, siNginx, siNodedotjs, siPostgresql, siPython, siPytorch, siQdrant, siReact,
  siRedis, siRust, siScikitlearn, siSqlite, siSwift, siTailwindcss, siTauri, siTerraform, siTypescript, siVercel,
  siVite,
} from "simple-icons";
import awsUrl from "../assets/icons/aws.svg";
import javaUrl from "../assets/icons/java.svg";
import openaiUrl from "../assets/icons/openai.svg";
import { skills } from "../data/site";

// Official brand glyphs and colours (Simple Icons). AWS, Java and OpenAI are not in that set, so their
// logos are vendored as SVG files. Skills without a logo render as text.
const icons: Record<string, { path: string; hex: string }> = {
  Python: siPython, JavaScript: siJavascript, TypeScript: siTypescript, Swift: siSwift, Rust: siRust, "C++": siCplusplus, C: siC,
  React: siReact, "Next.js": siNextdotjs, Vite: siVite, "Tailwind CSS": siTailwindcss,
  FastAPI: siFastapi, "Node.js": siNodedotjs, "Express.js": siExpress, Django: siDjango, Flask: siFlask, Celery: siCelery,
  Tauri: siTauri, "Apple Foundation Models": siApple,
  "Scikit-learn": siScikitlearn, PyTorch: siPytorch, LangChain: siLangchain, LangGraph: siLanggraph, CrewAI: siCrewai,
  "Gemini API": siGooglegemini, "Anthropic API": siAnthropic,
  PostgreSQL: siPostgresql, MongoDB: siMongodb, Redis: siRedis, SQLite: siSqlite, Neo4j: siNeo4j, ArangoDB: siArangodb, Qdrant: siQdrant,
  "Google Cloud Platform": siGooglecloud, Vercel: siVercel, Docker: siDocker, Terraform: siTerraform,
  "GitHub Actions": siGithubactions, Firebase: siFirebase, Nginx: siNginx, Git: siGit,
};
const images: Record<string, string> = { AWS: awsUrl, Java: javaUrl, "OpenAI API": openaiUrl };

// Near-black brand glyphs follow the foreground so both themes remain legible.
const fillFor = (hex: string) => {
  const n = parseInt(hex, 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 70 ? "var(--text)" : `#${hex}`;
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
                {icons[name] ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ fill: fillFor(icons[name].hex) }}><path d={icons[name].path} /></svg>
                ) : images[name] ? (
                  <img src={images[name]} alt="" width="16" height="16" className={name === "AWS" ? "wide" : name === "OpenAI API" ? "theme-monochrome" : undefined} />
                ) : null}
                {name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
