import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, History as HistoryIcon, LogOut, Mail } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EventCard, type EventRow } from "@/components/EventCard";
import { useEmailSession, useI18n } from "@/lib/i18n";
import { getHistory } from "@/lib/events.functions";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Search history — EventRadar" },
      { name: "description", content: "Browse your past EventRadar searches and saved events, with filters and sorting." },
      { property: "og:title", content: "Search history — EventRadar" },
      { property: "og:description", content: "Your past event searches and saved results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

type Search = { id: string; email: string; query: string | null; city: string; date_from: string | null; date_to: string | null; result_count: number; created_at: string };
type Ev = EventRow & { search_id: string };
const sel = "rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-primary";

function HistoryPage() {
  const { t, lang } = useI18n();
  const { email, setEmail } = useEmailSession();
  const fetchHistory = useServerFn(getHistory);
  const [input, setInput] = useState("");
  const [data, setData] = useState<{ searches: Search[]; events: Ev[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [f, setF] = useState({ city: "", platform: "", category: "", date: "", q: "", sort: "date" });

  useEffect(() => {
    if (!email) { setData(null); return; }
    setLoading(true);
    fetchHistory({ data: { email } })
      .then((r) => setData(r as any))
      .catch(() => toast.error(t.error))
      .finally(() => setLoading(false));
  }, [email]);

  const options = useMemo(() => {
    const s = data?.searches ?? [], e = data?.events ?? [];
    const u = (a: (string | null)[]) => [...new Set(a.filter(Boolean) as string[])].sort();
    return { cities: u(s.map((x) => x.city)), platforms: u(e.map((x) => x.platform)), categories: u(e.map((x) => x.category)) };
  }, [data]);

  const fmt = (d: string) => new Date(d).toLocaleDateString(lang === "so" ? "so-SO" : "en-GB", { dateStyle: "medium" });

  const filteredSearches = useMemo(() => {
    if (!data) return [];
    const q = f.q.toLowerCase();
    let list = data.searches.filter((s) => {
      if (f.city && s.city !== f.city) return false;
      if (f.date && s.created_at.slice(0, 10) !== f.date) return false;
      const evs = data.events.filter((e) => e.search_id === s.id);
      if (f.platform && !evs.some((e) => e.platform === f.platform)) return false;
      if (f.category && !evs.some((e) => e.category === f.category)) return false;
      if (q && !evs.some((e) => e.title.toLowerCase().includes(q) || (e.organizer ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
    if (f.sort === "city") list = [...list].sort((a, b) => a.city.localeCompare(b.city));
    return list;
  }, [data, f]);

  const openEvents = useMemo(() => {
    if (!data || !openId) return [];
    const q = f.q.toLowerCase();
    let list = data.events.filter((e) => e.search_id === openId
      && (!f.platform || e.platform === f.platform) && (!f.category || e.category === f.category)
      && (!q || e.title.toLowerCase().includes(q) || (e.organizer ?? "").toLowerCase().includes(q)));
    const by = f.sort;
    list = [...list].sort((a, b) =>
      by === "city" ? (a.city ?? "~").localeCompare(b.city ?? "~")
        : by === "organizer" ? (a.organizer ?? "~").localeCompare(b.organizer ?? "~")
          : (a.start_date ?? "9").localeCompare(b.start_date ?? "9"));
    return list;
  }, [data, openId, f]);

  if (!email) {
    return (
      <AppShell>
        <form onSubmit={(e) => { e.preventDefault(); setEmail(input.trim()); }}
          className="glass mx-auto mt-20 max-w-md rounded-3xl p-7 text-center animate-rise">
          <Mail className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-2xl font-bold">{t.historyTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.historyEmail}</p>
          <input type="email" required value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.emailPh}
            className="mt-5 w-full rounded-xl border border-input bg-background/60 px-4 py-3 outline-none focus:border-primary" />
          <button className="mt-3 w-full rounded-xl bg-gradient-primary py-3 font-bold text-primary-foreground shadow-glow">{t.open}</button>
        </form>
      </AppShell>
    );
  }

  const openSearch = data?.searches.find((s) => s.id === openId);

  return (
    <AppShell>
      <div className="flex flex-wrap items-center gap-3 pt-10 animate-rise">
        <HistoryIcon className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t.historyTitle}</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <button onClick={() => setEmail(null)} className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm">
          <LogOut className="h-4 w-4" /> {t.logout}
        </button>
      </div>

      <div className="glass mt-6 grid gap-2 rounded-2xl p-3 sm:grid-cols-3 lg:grid-cols-6">
        <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder={t.textSearch} className={`${sel} sm:col-span-3 lg:col-span-2`} />
        <select value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className={sel}>
          <option value="">{t.filterCity}: {t.all}</option>{options.cities.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })} className={sel}>
          <option value="">{t.filterPlatform}: {t.all}</option>{options.platforms.map((c) => <option key={c}>{c}</option>)}</select>
        <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={sel}>
          <option value="">{t.filterCategory}: {t.all}</option>{options.categories.map((c) => <option key={c}>{c}</option>)}</select>
        <input type="date" title={t.filterDate} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={sel} />
        <select value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })} className={`${sel} sm:col-span-3 lg:col-span-6 lg:justify-self-end`}>
          <option value="date">{t.sortBy}: {t.sortDate}</option>
          <option value="city">{t.sortBy}: {t.sortCity}</option>
          <option value="organizer">{t.sortBy}: {t.sortOrganizer}</option>
        </select>
      </div>

      {loading && <div className="mt-8 grid gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary" />)}</div>}

      {!loading && openSearch && (
        <section className="mt-8">
          <button onClick={() => setOpenId(null)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </button>
          <h2 className="mb-5 text-2xl font-bold">{openSearch.query ? `${openSearch.query} · ` : ""}{openSearch.city}</h2>
          {openEvents.length === 0 ? <p className="text-muted-foreground">{t.noResults}</p> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{openEvents.map((e, i) => <EventCard key={e.id} e={e} i={i} />)}</div>
          )}
        </section>
      )}

      {!loading && !openSearch && data && (
        filteredSearches.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">{t.noHistory}</p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {filteredSearches.map((s, i) => (
              <li key={s.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}>
                <button onClick={() => setOpenId(s.id)}
                  className="glass flex w-full flex-wrap items-center gap-3 rounded-2xl p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50">
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg font-bold">{s.city}{s.query ? <span className="text-muted-foreground"> · {s.query}</span> : null}</div>
                    <div className="text-xs text-muted-foreground">{fmt(s.created_at)} · {s.email}{s.date_from ? ` · ${s.date_from} → ${s.date_to}` : ""}</div>
                  </div>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-bold text-primary">{s.result_count} {t.eventsLbl}</span>
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </AppShell>
  );
}
