"use client";

interface IFilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}

export default function FilterSelect({
  value,
  onChange,
  children,
}: IFilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.05] border border-white/[0.1] text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-orange-500/50 transition-colors cursor-pointer"
      style={{ colorScheme: "dark" }}
    >
      {children}
    </select>
  );
}
