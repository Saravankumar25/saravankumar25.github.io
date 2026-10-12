// Decorative system graph: signals travel from data to a result through an agent and its checks.
// Pure SVG + CSS (see .pulse in styles.css); it stops under prefers-reduced-motion.
const nodes: Record<string, [number, number, string]> = {
  data: [50, 210, "Data"],
  retr: [170, 80, "Retrieval"],
  model: [170, 340, "Models"],
  agent: [290, 210, "Agent"],
  check: [410, 90, "Checks"],
  tools: [410, 330, "Tools"],
  out: [450, 210, "Result"],
};
const edges: [string, string][] = [
  ["data", "retr"], ["data", "model"], ["retr", "agent"], ["model", "agent"],
  ["agent", "check"], ["agent", "tools"], ["check", "out"], ["tools", "out"],
];

export default function HeroGraphic() {
  return (
    <svg className="hero-graphic" viewBox="0 0 500 420" aria-hidden="true" focusable="false">
      {edges.map(([a, b], i) => {
        const [x1, y1] = nodes[a], [x2, y2] = nodes[b];
        return (
          <g key={a + b}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="edge" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="pulse" pathLength={100} style={{ animationDelay: `${(i * 0.55).toFixed(2)}s` }} />
          </g>
        );
      })}
      {Object.entries(nodes).map(([k, [x, y, label]], i) => (
        <g key={k} className="node" style={{ animationDelay: `${(i * 0.4).toFixed(1)}s` }}>
          <circle cx={x} cy={y} r="20" className="node-ring" />
          <circle cx={x} cy={y} r="5" className="node-dot" />
          <text x={x} y={y + 40} textAnchor="middle">{label}</text>
        </g>
      ))}
    </svg>
  );
}
