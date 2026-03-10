"use client";

import { useId } from "react";

interface ISparklineProps {
  data: number[];
  height?: number;
  color?: string;
  className?: string;
}

export default function Sparkline({
  data,
  height = 36,
  color = "#f97316",
  className = "",
}: ISparklineProps) {
  const gradientId = useId();

  if (data.length < 2) return null;

  const w = 300;
  const h = height;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const coords = data.map((val, i) => [
    (i / (data.length - 1)) * w,
    h - ((val - min) / range) * (h - 4) - 2,
  ]);

  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area =
    `M 0,${h} ` +
    coords.map(([x, y]) => `L ${x},${y}`).join(" ") +
    ` L ${w},${h} Z`;

  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
