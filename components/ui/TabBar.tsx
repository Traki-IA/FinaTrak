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
    <div className={`flex ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 py-2.5 text-[11px] font-semibold cursor-pointer border-b-2 transition-all bg-transparent ${
            active === tab.key
              ? "text-white border-orange-500"
              : "text-white/28 border-white/[0.06]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
