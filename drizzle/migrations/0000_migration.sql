CREATE TABLE public.searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  query text,
  city text NOT NULL,
  category text,
  date_from date,
  date_to date,
  result_count int NOT NULL DEFAULT 0,
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX searches_email_idx ON public.searches (lower(email), created_at DESC);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid NOT NULL REFERENCES public.searches(id) ON DELETE CASCADE,
  title text NOT NULL,
  purpose text,
  organizer text,
  city text,
  country text,
  venue text,
  start_date timestamptz,
  platform text,
  source_url text,
  summary text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_search_idx ON public.events (search_id);

GRANT ALL ON public.searches TO service_role;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own searches by jwt email" ON public.searches FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));
CREATE POLICY "read own events by jwt email" ON public.events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.searches s WHERE s.id = search_id AND lower(s.email) = lower(auth.jwt() ->> 'email')));
GRANT SELECT ON public.searches TO authenticated;
GRANT SELECT ON public.events TO authenticated;