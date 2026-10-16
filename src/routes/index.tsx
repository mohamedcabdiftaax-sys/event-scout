import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MailCheck, SearchX, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EventCard, RadarLoader, type EventRow } from "@/components/EventCard";
import { useEmailSession, useI18n } from "@/lib/i18n";
import { runSearch } from "@/lib/events.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EventRadar — Discover events near you" },
      { name: "description", content: "Find real upcoming events from Facebook, TikTok, LinkedIn, X, Eventbrite and more — delivered to your inbox." },
      { property: "og:title", content: "EventRadar — Discover events near you" },
      { property: "og:description", content: "Find real upcoming events across social platforms, emailed to you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const iso = (d: Date) => d.toISOString().slice(0, 10);
const field = "w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30";

function Index() {
  const { t } = useI18n();
  const { email: savedEmail, setEmail: saveEmail } = useEmailSession();
  const search = useServerFn(runSearch);
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [from, setFrom] = useState(iso(new Date()));
  const [to, setTo] = useState(iso(new Date(Date.now() + 30 * 864e5)));
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ events: EventRow[]; emailSent: boolean; email: string } | null>(null);

  useEffect(() => { if (savedEmail && !email) setEmail(savedEmail); }, [savedEmail]);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setLoading(true); setResult(null);
    try {
      const r = await search({ data: { city, keyword: keyword || null, dateFrom: from, dateTo: to, email } });
      if (!r.ok) {
        toast.error(r.error === "RATE_LIMIT" ? t.rateLimit : r.error === "SEARCH_NOT_CONFIGURED" ? t.notConfigured : r.error === "AI_CREDITS" ? t.noCredits : t.error);
        return;
      }
      saveEmail(email);
      setResult({ events: r.events as EventRow[], emailSent: r.emailSent, email });
      if (r.emailSent) toast.success(`${t.emailSent} ${email}`);
    } catch {
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="pt-12 text-center sm:pt-20 animate-rise">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> EventRadar
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-bold sm:text-6xl">{t.tagline}</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t.sub}</p>
      </section>

      <form onSubmit={onSubmit} className="glass mx-auto mt-10 grid max-w-3xl gap-4 rounded-3xl p-5 sm:grid-cols-2 sm:p-7 animate-rise" style={{ animationDelay: "120ms" }}>
        <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">{t.city}</span>
          <input required minLength={2} value={city} onChange={(e) => setCity(e.target.value)} placeholder={t.cityPh} className={field} /></label>
        <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">{t.keyword}</span>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t.keywordPh} className={field} /></label>
        <label><span className="mb-1.5 block text-sm font-medium">{t.from}</span>
          <input type="date" required value={from} onChange={(e) => setFrom(e.target.value)} className={field} /></label>
        <label><span className="mb-1.5 block text-sm font-medium">{t.to}</span>
          <input type="date" required value={to} min={from} onChange={(e) => setTo(e.target.value)} className={field} /></label>
        <label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-medium">{t.email}</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPh} className={field} /></label>
        <button disabled={loading} className="sm:col-span-2 rounded-xl bg-gradient-primary px-6 py-3.5 font-display text-base font-bold text-primary-foreground shadow-glow transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60">
          {loading ? t.searching : t.search}
        </button>
      </form>

      {loading && <RadarLoader title={t.searching} sub={t.searchingSub} />}

      {result && (
        <section className="mt-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">{result.events.length} {t.results}</h2>
            {result.emailSent ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1.5 text-sm font-semibold text-success animate-rise">
                <MailCheck className="h-4 w-4" /> {t.emailSent} {result.email}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">{t.emailNotSent}</span>
            )}
          </div>
          {result.events.length === 0 ? (
            <div className="glass flex flex-col items-center rounded-3xl py-14 text-center animate-rise">
              <SearchX className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-bold">{t.noResults}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.noResultsSub}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.events.map((e, i) => <EventCard key={e.id} e={e} i={i} />)}
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}
