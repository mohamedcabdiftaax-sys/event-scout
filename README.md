# Event Scout

Build a full-stack web app called "EventRadar" – a recent-events discovery tool.



CORE FLOW

1. Landing page with a search form: city/country (text), keyword/category (optional), date range (default: next 30 days), and an EMAIL field (required).

2. When the user submits, a Supabase Edge Function:

   - Searches the web for recent/upcoming events using a search API (Tavily or Serper, key stored as a Supabase secret). Include queries targeting Facebook Events, TikTok, LinkedIn, Twitter/X, Eventbrite, Meetup, Instagram and general web.

   - Sends the raw results to an LLM (Lovable AI / Anthropic API, key in secrets) that extracts structured data and returns ONLY JSON.

3. Show results as cards AND save them in the database.

4. Automatically email the results to the user's email (use Resend via Edge Function) in a clean HTML email: title, date, city, organizer, purpose, source link.



EXTRACTED FIELDS PER EVENT

- title

- purpose (why the event is happening / what it is about)

- organizer (who is organizing)

- city and country

- venue

- start date and time

- platform (Facebook, TikTok, LinkedIn, Twitter/X, Eventbrite, Other)

- source_url (direct link to the event)

- short summary (2 sentences)

- category (Business, Education, Religious, Music, Sports, Tech, Community, Other)



SEARCH HISTORY SECTION

- A "History" page listing every previous search (query, city, date, email, number of results), newest first.

- Clicking a history item opens its saved results.

- Filters on the history page: by city, platform, category, date; plus a text search on title/organizer.

- Sort by date, city, or organizer.

- Do not require login for MVP, but store history per email (user enters email to see their history). Add a simple email-based session.



DATABASE (Supabase)

- searches(id, email, query, city, category, date_from, date_to, created_at)

- events(id, search_id, title, purpose, organizer, city, country, venue, start_date, platform, source_url, summary, category, created_at)

- Enable RLS; restrict reads to rows matching the user's email.



UI/UX

- Mobile-first, clean, modern. Support Somali and English with a language toggle.

- Loading state while searching, empty state, and error toasts.

- Show "Email sent" confirmation after the search completes.

- Deduplicate events by title + date + city.



RULES

- Never invent events: only return events found in search results; if a field is missing, set it to null.

- Never expose API keys in the frontend; all API calls go through Edge Functions.

- Add rate limiting (max 5 searches per email per day).

- Include an unsubscribe note in emails.



Start with the database schema and the Edge Function, then build the UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bdd8094d-fc37-4c40-a604-5136371f8494).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
