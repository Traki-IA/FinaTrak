"use client";

interface IHealthRingProps {
  score: number;
  size?: number;
}

export default function HealthRing({ score, size = 48 }: IHealthRingProps) {
  const r = size / 2 - 5;
  const circumference = 2 * Math.PI * r;
  const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={String(circumference)}
          strokeDashoffset={String(circumference * (1 - score / 100))}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x={size / 2}
          y={size / 2 + 4}
          textAnchor="middle"
          fontSize={10}
          fontWeight={900}
          fill="white"
        >
          {score}
        </text>
      </svg>
      <span
        className="text-[7px] font-bold uppercase tracking-wide"
        style={{ color }}
      >
        Santé
      </span>
    </div>
  );
}
