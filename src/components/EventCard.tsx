import { CalendarDays, ExternalLink, MapPin, User, Building2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export type EventRow = {
  id: string; title: string; purpose: string | null; organizer: string | null; city: string | null;
  country: string | null; venue: string | null; start_date: string | null; platform: string | null;
  source_url: string | null; summary: string | null; category: string | null;
};

export function EventCard({ e, i = 0 }: { e: EventRow; i?: number }) {
  const { t, lang } = useI18n();
  const date = e.start_date
    ? new Date(e.start_date).toLocaleString(lang === "so" ? "so-SO" : "en-GB", { dateStyle: "medium", timeStyle: "short" })
    : null;
  return (
    <article className="group glass flex flex-col rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow animate-rise"
      style={{ animationDelay: `${Math.min(i, 12) * 60}ms` }}>
      <div className="mb-3 flex flex-wrap gap-1.5 text-xs font-semibold">
        {e.platform && <span className="rounded-full bg-primary/15 px-2.5 py-1 text-primary">{e.platform}</span>}
        {e.category && <span className="rounded-full bg-accent/15 px-2.5 py-1 text-accent">{e.category}</span>}
      </div>
      <h3 className="text-lg font-bold leading-snug">{e.title}</h3>
      {e.summary && <p className="mt-2 text-sm text-muted-foreground">{e.summary}</p>}
      <ul className="mt-4 space-y-1.5 text-sm">
        {date && <li className="flex gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-primary" />{date}</li>}
        {(e.city || e.country) && <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" />{[e.city, e.country].filter(Boolean).join(", ")}</li>}
        {e.venue && <li className="flex gap-2"><Building2 className="h-4 w-4 shrink-0 text-primary" />{e.venue}</li>}
        {e.organizer && <li className="flex gap-2"><User className="h-4 w-4 shrink-0 text-primary" />{e.organizer}</li>}
      </ul>
      {e.purpose && <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-sm"><span className="font-semibold">{t.purpose}: </span>{e.purpose}</p>}
      {e.source_url && (
        <a href={e.source_url} target="_blank" rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-primary hover:underline">
          {t.source} <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
      )}
    </article>
  );
}

export function RadarLoader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center animate-rise">
      <div className="relative h-40 w-40 rounded-full border border-primary/30">
        <div className="absolute inset-6 rounded-full border border-primary/20" />
        <div className="absolute inset-14 rounded-full border border-primary/20" />
        <div className="absolute inset-0 rounded-full animate-radar-sweep"
          style={{ background: "conic-gradient(from 0deg, transparent 75%, var(--primary))" }} />
        <span className="absolute inset-0 rounded-full border-2 border-primary animate-radar-ping" />
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-glow" />
      </div>
      <h3 className="mt-8 text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
