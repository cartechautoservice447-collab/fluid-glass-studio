import { useState, type ReactNode } from "react";

type NavKey = "home" | "courses" | "collections" | "notes" | "more";

type Props = {
  active?: NavKey;
  onNavigate: (key: NavKey) => void;
};

const ITEMS: Array<[NavKey, string, ReactNode]> = [
  ["home", "Home", <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.8 12 3.7l8.5 7.1"/><path d="M5.7 9.8v10.5h12.6V9.8"/><path d="M9.4 20.3v-6.1h5.2v6.1"/></svg>],
  ["courses", "Courses", <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6.4" height="6.4" rx="1.4"/><rect x="13.6" y="4" width="6.4" height="6.4" rx="1.4"/><rect x="4" y="13.6" width="6.4" height="6.4" rx="1.4"/><rect x="13.6" y="13.6" width="6.4" height="6.4" rx="1.4"/></svg>],
  ["collections", "Collections", <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.2 6.5h5.5l1.8 1.9h8.3v9.4a1.7 1.7 0 0 1-1.7 1.7H5.9a1.7 1.7 0 0 1-1.7-1.7Z"/><path d="M4.2 6.5V5.3a1.3 1.3 0 0 1 1.3-1.3h4l1.7 1.8"/></svg>],
  ["notes", "Notes", <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.8h8.4l3.6 3.7v12.7H6Z"/><path d="M14.4 3.8v3.8H18"/><path d="M9 11h6M9 14.6h6M9 18.2h3.8"/></svg>],
  ["more", "More", <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.25 3.75L17 8l-3.75 1.25L12 13l-1.25-3.75L7 8l3.75-1.25Z"/><path d="m18.2 13.2.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7Z"/><path d="m5.2 14.2.55 1.65 1.65.55-1.65.55L5.2 18.6l-.55-1.65L3 16.4l1.65-.55Z"/></svg>],
];

export function DashboardBottomNav({ active = "home", onNavigate }: Props) {
  const [selected, setSelected] = useState<NavKey>(active);

  const handleClick = (key: NavKey) => {
    setSelected(key);
    onNavigate(key);
  };

  return (
    <nav aria-label="Dashboard navigation" className="sticky bottom-3 z-30 mx-auto mt-5 w-full max-w-[640px] rounded-[24px] border border-white/20 bg-white/[0.09] p-2 shadow-[inset_0_1px_2px_rgba(255,255,255,.32),0_12px_36px_rgba(0,0,0,.28)] backdrop-blur-2xl" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))", WebkitBackdropFilter: "blur(24px) saturate(180%)" }}>
      <div className="grid grid-cols-5 gap-1">
        {ITEMS.map(([key, label, icon]) => {
          const isActive = selected === key;
          return <button key={key} type="button" onClick={() => handleClick(key)} aria-label={label} title={label} aria-current={isActive ? "page" : undefined} className={`group flex min-h-[60px] flex-col items-center justify-center gap-1.5 rounded-[18px] border px-2 py-2 text-[10px] font-medium tracking-[0.01em] transition-[color,background-color,border-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${isActive ? "border-white/20 bg-white/[0.15] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.22)]" : "border-transparent bg-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.08] hover:text-foreground"}`}>
            <span className={`grid size-6 place-items-center text-current transition-transform duration-200 ${isActive ? "scale-[1.04]" : "group-hover:scale-[1.03]"}`}>
              <span className="grid size-6 place-items-center [&>svg]:block [&>svg]:size-[23px] [&>svg]:fill-none [&>svg]:stroke-current [&>svg]:stroke-[1.8] [&>svg]:stroke-linecap-round [&>svg]:stroke-linejoin-round">{icon}</span>
            </span>
            <span>{label}</span>
          </button>;
        })}
      </div>
    </nav>
  );
}
