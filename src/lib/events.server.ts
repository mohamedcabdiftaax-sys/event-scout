// Server-only helpers: web search, AI extraction, email.
export type ExtractedEvent = {
  title: string;
  purpose: string | null;
  organizer: string | null;
  city: string | null;
  country: string | null;
  venue: string | null;
  start_date: string | null;
  platform: string | null;
  source_url: string | null;
  summary: string | null;
  category: string | null;
};

const PLATFORMS = ["Facebook", "TikTok", "LinkedIn", "Twitter/X", "Eventbrite", "Other"];
const CATEGORIES = ["Business", "Education", "Religious", "Music", "Sports", "Tech", "Community", "Other"];

type SearchHit = { title: string; url: string; content: string; published_date?: string | undefined };

export async function webSearch(city: string, keyword: string | null, from: string, to: string) {
  const key = process.env["TAVILY_API_KEY"];
  if (!key) throw new Error("SEARCH_NOT_CONFIGURED");
  const k = keyword ? `${keyword} ` : "";
  const base = `${k}events in ${city} ${from} to ${to}`;
  const queries = [
    `${base}`,
    `site:facebook.com/events ${k}${city}`,
    `site:eventbrite.com ${k}${city}`,
    `site:meetup.com ${k}${city}`,
    `site:linkedin.com/events ${k}${city}`,
    `site:x.com OR site:twitter.com ${k}event ${city}`,
    `site:tiktok.com ${k}event ${city}`,
    `site:instagram.com ${k}event ${city}`,
  ];
  const results = await Promise.allSettled(
    queries.map(async (q) => {
      const r = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ query: q, max_results: 6, search_depth: "basic" }),
      });
      if (!r.ok) throw new Error(`search ${r.status}`);
      const j = (await r.json()) as { results?: SearchHit[] };
      return j.results ?? [];
    }),
  );
  const seen = new Set<string>();
  const hits: SearchHit[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const h of r.value) {
      if (seen.has(h.url)) continue;
      seen.add(h.url);
      hits.push({ title: h.title, url: h.url, content: (h.content ?? "").slice(0, 700), published_date: h.published_date });
    }
  }
  if (results.every((r) => r.status === "rejected")) throw new Error("SEARCH_FAILED");
  return hits;
}

const nullableStr = { type: ["string", "null"] };
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["events"],
  properties: {
    events: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "purpose", "organizer", "city", "country", "venue", "start_date", "platform", "source_url", "summary", "category"],
        properties: {
          title: { type: "string" },
          purpose: nullableStr,
          organizer: nullableStr,
          city: nullableStr,
          country: nullableStr,
          venue: nullableStr,
          start_date: { type: ["string", "null"], description: "ISO 8601 date or datetime" },
          platform: { type: ["string", "null"], enum: [...PLATFORMS, null] },
          source_url: nullableStr,
          summary: nullableStr,
          category: { type: ["string", "null"], enum: [...CATEGORIES, null] },
        },
      },
    },
  },
};

export async function extractEvents(hits: SearchHit[], city: string, from: string, to: string): Promise<ExtractedEvent[]> {
  if (hits.length === 0) return [];
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI_NOT_CONFIGURED");
  const instructions = `You extract real events from web search results. RULES:
- Only include events that are explicitly described in the provided results. NEVER invent events or details.
- If a field is not present in the result, set it to null.
- Keep only events in or near "${city}" happening (or recently happened) around ${from} to ${to}. Skip generic listing pages with no specific event.
- source_url must be the URL of the result where the event was found.
- platform: Facebook, TikTok, LinkedIn, Twitter/X, Eventbrite or Other (Meetup, Instagram and websites are Other).
- summary: max 2 sentences. purpose: why the event happens / what it is about.`;
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions,
      input: `Search results:\n${JSON.stringify(hits)}`,
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      text: { format: { type: "json_schema", name: "events", strict: true, schema } },
    }),
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    if (res.status === 402) throw new Error("AI_CREDITS");
    if (res.status === 429) throw new Error("AI_RATE_LIMIT");
    throw new Error(`AI_FAILED ${res.status} ${t.slice(0, 200)}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      try {
        const ev = JSON.parse(d);
        if (ev.type === "response.output_text.delta") text += ev.delta;
        if (ev.type === "error" || ev.type === "response.failed") throw new Error("AI_FAILED");
      } catch (e) {
        if (e instanceof Error && e.message === "AI_FAILED") throw e;
      }
    }
  }
  const parsed = JSON.parse(text || '{"events":[]}') as { events: ExtractedEvent[] };
  const urls = new Set(hits.map((h) => h.url));
  // Guard: only keep events whose source is one of the real search results
  return parsed.events.filter((e) => e.title && e.source_url && urls.has(e.source_url));
}

export function dedupe<T extends { title: string; start_date: string | null; city: string | null }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((e) => {
    const k = `${e.title.trim().toLowerCase()}|${(e.start_date ?? "").slice(0, 10)}|${(e.city ?? "").trim().toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const esc = (s: string | null | undefined) =>
  (s ?? "—").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendResultsEmail(to: string, city: string, events: ExtractedEvent[]) {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return false;
  const from = process.env["RESEND_FROM"] || "EventRadar <onboarding@resend.dev>";
  const rows = events
    .map(
      (e) => `<tr><td style="padding:16px;border-bottom:1px solid #eee">
<div style="font-size:16px;font-weight:700;color:#111">${esc(e.title)}</div>
<div style="font-size:13px;color:#555;margin-top:4px">📅 ${esc(e.start_date ? new Date(e.start_date).toUTCString().slice(0, 22) : null)} · 📍 ${esc([e.city, e.country].filter(Boolean).join(", ") || null)}</div>
<div style="font-size:13px;color:#555">👤 ${esc(e.organizer)}</div>
<div style="font-size:14px;color:#333;margin-top:6px">${esc(e.purpose)}</div>
${e.source_url ? `<a href="${esc(e.source_url)}" style="display:inline-block;margin-top:8px;color:#e8590c;font-weight:600">View source →</a>` : ""}
</td></tr>`,
    )
    .join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
<h1 style="color:#e8590c;margin-bottom:0">EventRadar</h1>
<p style="color:#555">${events.length} events found for <b>${esc(city)}</b></p>
<table style="width:100%;border-collapse:collapse">${rows || '<tr><td style="padding:16px">No events found.</td></tr>'}</table>
<p style="font-size:12px;color:#999;margin-top:24px">You received this email because you searched on EventRadar. To unsubscribe, simply stop searching with this email address — we never send emails unless you run a search. / Si aad u joojiso, ha isticmaalin email-kan raadinta.</p></div>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from, to: [to], subject: `EventRadar: ${events.length} events in ${city}`, html }),
  });
  if (!r.ok) console.error("resend", r.status, await r.text());
  return r.ok;
}
