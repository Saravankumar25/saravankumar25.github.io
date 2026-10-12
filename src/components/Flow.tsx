/** Vertical pipeline diagram as inline SVG. Colours come from CSS variables. */
export default function Flow({ steps, label }: { steps: string[]; label: string }) {
  const h = 40, gap = 22, w = 420;
  const total = steps.length * h + (steps.length - 1) * gap;
  return (
    <svg className="flow" viewBox={`0 0 ${w} ${total + 4}`} role="img" aria-label={label}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" className="flow-arrow" />
        </marker>
      </defs>
      {steps.map((s, i) => {
        const y = 2 + i * (h + gap);
        return (
          <g key={s}>
            <rect x="2" y={y} width={w - 4} height={h} rx="8" className="flow-box" />
            <text x="16" y={y + h / 2 + 4} className="flow-n">{String(i + 1).padStart(2, "0")}</text>
            <text x="46" y={y + h / 2 + 5} className="flow-t">{s}</text>
            {i < steps.length - 1 && (
              <line x1={w / 2} y1={y + h} x2={w / 2} y2={y + h + gap - 2} className="flow-line" markerEnd="url(#arrow)" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
