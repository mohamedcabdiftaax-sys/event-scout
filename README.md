# EventRadar

EventRadar is a full-stack event discovery tool. It searches the web for real upcoming events, extracts structured event data, saves the results, and can email the results to the searcher's address.

## What is implemented

- City/country, keyword/category, date range and email search form.
- Searches general web results plus Facebook Events, TikTok, LinkedIn, X/Twitter, Eventbrite, Meetup and Instagram.
- AI extraction with strict JSON output and a source-URL guard so invented events are discarded.
- Deduplication by title + date + city.
- Supabase persistence for searches and events.
- Five searches per rolling 24-hour period per normalized email.
- Results email through Resend, with Somali and English unsubscribe guidance.
- Search History with city/platform/category/date filters, title/organizer search, and sorting.
- Somali / English interface switch.
- Server-side error handling so missing integrations fail with a controlled message instead of exposing secrets.

## Required server secrets

The application cannot perform a real search or send a real email until these secrets are configured in the server environment:

```env
TAVILY_API_KEY=...
LOVABLE_API_KEY=...
RESEND_API_KEY=...
RESEND_FROM=EventRadar <onboarding@resend.dev>
```

`TAVILY_API_KEY` powers web search. `LOVABLE_API_KEY` powers structured event extraction. `RESEND_API_KEY` powers email delivery. `RESEND_FROM` is optional; use a verified sender/domain for production. Do **not** put these secrets in frontend code.

See `.env.example` for the expected variable names. The real `.env` must remain local/server-side and must never contain production secrets in a public repository.

## Supabase

The app uses the server-side Supabase client for database operations. The expected data model is:

- `searches`: search email, query, city, category, date range, result count, email status and creation time.
- `events`: extracted event fields linked to a search by `search_id`.

The service-role key is server-only. Database policies should still be configured in Supabase for any client-accessible tables or APIs.

## Development

```sh
git clone <this-repository-url>
cd event-scout
npm install
npm run dev
```

Available checks:

```sh
npm run lint
npm test
npm run build
```

## Testing checklist

Before calling a deployment production-ready:

1. Configure Tavily, Lovable AI and Resend secrets.
2. Run a real search for a small city/date range.
3. Confirm only source-backed events appear.
4. Confirm the search and events are saved in Supabase.
5. Confirm the result email arrives.
6. Confirm History loads the saved search and events.
7. Test the five-search limit.
8. Test an invalid date range and missing/invalid email.
9. Test both English and Somali UI.
10. Verify that no API secret is exposed in browser/network responses.

## Privacy limitation of the MVP

History is currently looked up by email address. That means knowing another person's email can reveal their stored searches. This is acceptable only as an MVP trade-off; production should add email verification or authentication before treating History as private data.
