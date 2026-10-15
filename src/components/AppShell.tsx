import { Link } from "@tanstack/react-router";
import { Radar } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const nav = "px-3 py-1.5 rounded-full text-sm text-muted-foreground transition-colors hover:text-foreground";
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 glass border-x-0 border-t-0">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="relative grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
              <Radar className="h-4 w-4" />
              <span className="absolute inset-0 rounded-full border border-primary animate-radar-ping" />
            </span>
            EventRadar
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            <Link to="/" className={nav} activeProps={{ className: "bg-secondary text-foreground" }} activeOptions={{ exact: true }}>{t.home}</Link>
            <Link to="/history" className={nav} activeProps={{ className: "bg-secondary text-foreground" }}>{t.history}</Link>
            <div className="ml-1 flex rounded-full bg-secondary p-0.5 text-xs font-semibold">
              {(["en", "so"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`rounded-full px-2.5 py-1 transition-all ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20">{children}</main>
    </div>
  );
}
