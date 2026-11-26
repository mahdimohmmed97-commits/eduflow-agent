export function TrendChart({
  points,
  label,
}: {
  points: Array<{ label: string; rate: number }>;
  label: string;
}) {
  if (points.length === 0) {
    return <p className="text-sm text-muted">{label}</p>;
  }
  const width = 640;
  const height = 180;
  const padX = 28;
  const padY = 24;
  const step = points.length === 1 ? 0 : (width - padX * 2) / (points.length - 1);
  const coords = points.map((point, index) => {
    const x = padX + index * step;
    const y = height - padY - (point.rate / 100) * (height - padY * 2);
    return { ...point, x, y };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${coords[0].x},${height - padY} ${line} ${coords[coords.length - 1].x},${height - padY}`;

  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" aria-hidden>
        <polygon points={area} fill="rgba(15,110,107,0.12)" />
        <polyline points={line} fill="none" stroke="#0f6e6b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill="#fffdf9" stroke="#0f6e6b" strokeWidth="2.5" />
            <text x={point.x} y={point.y - 12} textAnchor="middle" fill="#142033" fontSize="13" fontWeight="700">
              {point.rate}%
            </text>
          </g>
        ))}
      </svg>
      <ol className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
        {points.map((point) => (
          <li key={point.label} className="text-center text-xs text-muted">
            <span className="block font-semibold text-ink">{point.rate}%</span>
            {point.label}
          </li>
        ))}
      </ol>
      <p className="sr-only">{label}</p>
    </div>
  );
}
