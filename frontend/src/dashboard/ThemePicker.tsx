/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from "react";
import { LuPalette, LuCheck } from "react-icons/lu";

const themes = [
  { id: "orbit", label: "Original", color: "#7dd3fc" },
  { id: "blue", label: "Blue", color: "#60a5fa" },
  { id: "green", label: "Green", color: "#34d399" },
  { id: "purple", label: "Purple", color: "#c084fc" },
  { id: "amber", label: "Amber", color: "#fbbf24" },
  { id: "rose", label: "Rose", color: "#fb7185" },
];

export function useThemeColor() {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem("orbit-theme");
      return themes.some(item => item.id === stored) ? stored! : "orbit";
    } catch { return "orbit"; }
  });
  function choose(next: string) {
    setTheme(next);
    try { localStorage.setItem("orbit-theme", next); } catch { /* Keep the choice for this session if storage is blocked. */ }
  }
  return { theme, choose };
}

export default function ThemePicker({ theme, onChange }: { theme: string; onChange: (theme: string) => void }) {
  const panel = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (event.target instanceof Node && !panel.current?.contains(event.target)) panel.current?.removeAttribute("open");
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return <details className="theme-picker" ref={panel} onKeyDown={event => {
    if (event.key === "Escape") { panel.current?.removeAttribute("open"); panel.current?.querySelector("summary")?.focus(); }
  }}>
    <summary aria-label="Choose theme color" title="Theme color"><LuPalette aria-hidden="true" /></summary>
    <div className="theme-options" role="group" aria-label="Theme colors">
      {themes.map(item => <button key={item.id} type="button" aria-pressed={theme === item.id} onClick={() => {
        onChange(item.id);
        panel.current?.removeAttribute("open");
        panel.current?.querySelector("summary")?.focus();
      }}><span className="theme-swatch" style={{ backgroundColor: item.color }} aria-hidden="true" />{item.label}{theme === item.id && <LuCheck aria-hidden="true" />}</button>)}
    </div>
  </details>;
}
