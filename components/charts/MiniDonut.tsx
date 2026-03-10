"use client";

import type { ReactNode } from "react";

type TMiniDonutSegment = { pct: number; color: string };

interface IMiniDonutProps {
  data: TMiniDonutSegment[];
  size?: number;
  className?: string;
  children?: ReactNode;
}

export default function MiniDonut({
  data,
  size = 68,
  className = "",
  children,
}: IMiniDonutProps) {
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * r;

  let cumul = 0;

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((segment, i) => {
          const offset = circumference - (segment.pct / 100) * circumference;
          const rotation = (cumul / 100) * 360 - 90;
          cumul += segment.pct;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform={`rotate(${rotation} ${cx} ${cy})`}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
