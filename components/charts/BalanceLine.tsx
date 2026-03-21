"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import type { TBalancePoint } from "@/types";

interface IBalanceLineProps {
  data: TBalancePoint[];
}

function CustomXTick({ x, y, payload, index, visibleTicksCount }: {
  x?: number; y?: number;
  payload?: { value: string };
  index?: number;
  visibleTicksCount?: number;
}) {
  const isFirst = index === 0;
  const isLast = index === (visibleTicksCount ?? 1) - 1;
  const anchor = isFirst ? "start" : isLast ? "end" : "middle";
  const xPos = isFirst ? (x ?? 0) + 6 : isLast ? (x ?? 0) - 6 : x ?? 0;

  // Format court : "1 mars" → "1 mars", "mars 25" → "mars 25"
  const raw = payload?.value ?? "";
  const parts = raw.split(" ");
  const label = parts.length === 2 && !isNaN(Number(parts[0]))
    ? `${parts[0]} ${parts[1].slice(0, 3)}.`  // "1 mars" → "1 mar."
    : raw;                                      // "mars 25" inchangé

  return (
    <text x={xPos} y={(y ?? 0) + 4} textAnchor={anchor} fill="#444" fontSize={10}>
      {label}
    </text>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div
      className="rounded-[14px] px-[12px] py-[9px]"
      style={{
        background: "rgba(28,28,30,0.95)",
        border: "1px solid var(--border)",
        minWidth: 110,
      }}
    >
      <div className="text-[11px] text-[var(--text3)] mb-[3px]">{label}</div>
      <div
        className="text-[18px] font-bold leading-none"
        style={{ color: "var(--orange)" }}
      >
        {val.toLocaleString("fr-FR")} €
      </div>
    </div>
  );
}

export default function BalanceLine({ data }: IBalanceLineProps) {
  if (data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-[12px] text-[var(--text3)]">
        Aucune donnée
      </div>
    );
  }

  const lastPoint = data[data.length - 1];

  const values = data.map((d) => d.solde);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal;
  const padding = Math.max(range * 0.1, 200);
  const yDomain: [number, number] = [
    Math.floor(minVal - padding),
    Math.ceil(maxVal + padding),
  ];

  const formatY = (v: number): string => {
    const k = Math.round(v / 100) / 10;
    return `${k.toFixed(1)}k`;
  };

  const yStep = (yDomain[1] - yDomain[0]) / 5;
  const yLevels = [1, 2, 3, 4].map((i) => Math.round(yDomain[0] + yStep * i));

  const isDaily = data.length > 12;
  const xInterval = isDaily
    ? Math.max(1, Math.floor(data.length / 5))
    : "preserveStartEnd";

  return (
    <div className="h-[210px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 14, right: 42, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="soldeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--orange)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--orange)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <YAxis domain={yDomain} hide />

          <XAxis
            dataKey="mois"
            axisLine={false}
            tickLine={false}
            tick={<CustomXTick />}
            interval={xInterval}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
          />

          {/* Lignes de grille avec valeurs */}
          {yLevels.map((level) => (
            <ReferenceLine
              key={level}
              y={level}
              stroke="#2a2a2a"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: formatY(level),
                position: "right",
                fill: "#555",
                fontSize: 9,
                dy: 4,
                dx: 38,
                textAnchor: "end",
              }}
            />
          ))}

          <Area
            type="monotone"
            dataKey="solde"
            stroke="var(--orange)"
            strokeWidth={1.5}
            fill="url(#soldeGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: "var(--orange)",
              stroke: "#111",
              strokeWidth: 2,
            }}
          />

          {/* Point fixe sur le dernier solde */}
          <ReferenceDot
            x={lastPoint.mois}
            y={lastPoint.solde}
            r={5}
            fill="var(--orange)"
            stroke="#111111"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
