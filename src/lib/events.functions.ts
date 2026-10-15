import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const DAILY_LIMIT = 5;

const searchInput = z.object({
  email: z.string().trim().email().max(255),
  city: z.string().trim().min(2).max(120),
  keyword: z.string().trim().max(120).optional().nullable(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const runSearch = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => searchInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { webSearch, extractEvents, dedupe, sendResultsEmail } = await import("./events.server");
    const email = data.email.toLowerCase();

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("searches")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", since);
    if ((count ?? 0) >= DAILY_LIMIT) return { ok: false as const, error: "RATE_LIMIT" };

    try {
      const hits = await webSearch(data.city, data.keyword || null, data.dateFrom, data.dateTo);
      const events = dedupe(await extractEvents(hits, data.city, data.dateFrom, data.dateTo));

      const { data: s, error } = await supabaseAdmin
        .from("searches")
        .insert({
          email,
          query: data.keyword || null,
          city: data.city,
          category: data.keyword || null,
          date_from: data.dateFrom,
          date_to: data.dateTo,
          result_count: events.length,
        })
        .select()
        .single();
      if (error) throw error;

      let saved: any[] = [];
      if (events.length) {
        const rows = events.map((e) => {
          const d = e.start_date ? new Date(e.start_date) : null;
          return { ...e, search_id: s.id, start_date: d && !isNaN(d.getTime()) ? d.toISOString() : null };
        });
        const ins = await supabaseAdmin.from("events").insert(rows).select();
        if (ins.error) throw ins.error;
        saved = ins.data;
      }
      const emailSent = await sendResultsEmail(email, data.city, events);
      if (emailSent) await supabaseAdmin.from("searches").update({ email_sent: true }).eq("id", s.id);
      return { ok: true as const, searchId: s.id, events: saved, emailSent };
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message.split(" ")[0] : "FAILED";
      return { ok: false as const, error: msg };
    }
  });

export const getHistory = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().email() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const { data: searches } = await supabaseAdmin
      .from("searches")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false });
    const ids = (searches ?? []).map((s) => s.id);
    const { data: events } = ids.length
      ? await supabaseAdmin.from("events").select("*").in("search_id", ids)
      : { data: [] };
    return { searches: searches ?? [], events: events ?? [] };
  });
