"use client";

interface ITabBarProps<T extends string> {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
}

export default function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  className = "",
}: ITabBarProps<T>) {
  return (
    <div className={`flex gap-[6px] ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 py-[3px] text-[12px] font-medium cursor-pointer rounded-lg border transition-all bg-transparent ${
            active === tab.key
              ? "border-[var(--orange)] text-[var(--orange)] bg-[rgba(249,115,22,0.10)]"
              : "border-[var(--border)] text-[var(--text2)] hover:border-[var(--border2)] hover:text-[var(--text)]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
