import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const dict = {
  en: {
    home: "Search", history: "History",
    tagline: "Discover what's happening around you",
    sub: "We scan Facebook, TikTok, LinkedIn, X, Eventbrite, Meetup, Instagram and the web — then email you the results.",
    city: "City / country", cityPh: "e.g. Mogadishu, Somalia",
    keyword: "Keyword or category (optional)", keywordPh: "e.g. tech, music, conference",
    from: "From", to: "To", email: "Your email", emailPh: "you@example.com",
    search: "Find events", searching: "Scanning the web…",
    searchingSub: "Searching platforms and extracting real events. This takes up to a minute.",
    results: "events found", noResults: "No events found", noResultsSub: "Try a bigger city, another keyword, or a wider date range.",
    emailSent: "Email sent to", emailNotSent: "Results saved, but the email could not be sent.",
    source: "Open source", organizer: "Organizer", venue: "Venue", purpose: "Purpose",
    rateLimit: "Daily limit reached: max 5 searches per email per day.",
    error: "Something went wrong. Please try again.",
    notConfigured: "Search service is not set up yet.",
    historyTitle: "Your search history", historyEmail: "Enter your email to see your history",
    open: "Open", logout: "Change email", noHistory: "No searches yet",
    filterCity: "City", filterPlatform: "Platform", filterCategory: "Category", filterDate: "Searched on",
    textSearch: "Search title or organizer", sortBy: "Sort by", sortDate: "Date", sortCity: "City", sortOrganizer: "Organizer",
    all: "All", back: "Back to history", searchesLbl: "searches", eventsLbl: "events",
  },
  so: {
    home: "Raadi", history: "Taariikh",
    tagline: "Ogow waxa ka dhacaya agagaarkaaga",
    sub: "Waxaan baarnaa Facebook, TikTok, LinkedIn, X, Eventbrite, Meetup, Instagram iyo shabakadda — kadibna natiijada ayaan kuu soo email-garaynaa.",
    city: "Magaalo / dal", cityPh: "tusaale: Muqdisho, Soomaaliya",
    keyword: "Erey ama qayb (ikhtiyaari)", keywordPh: "tusaale: tignoolajiyad, muusig",
    from: "Laga bilaabo", to: "Ilaa", email: "Email-kaaga", emailPh: "adiga@tusaale.com",
    search: "Hel dhacdooyin", searching: "Baaritaan ayaa socda…",
    searchingSub: "Waxaan baaraynaa barxadaha oo soo saaraynaa dhacdooyin dhab ah. Ilaa hal daqiiqo.",
    results: "dhacdo ayaa la helay", noResults: "Dhacdo lama helin", noResultsSub: "Isku day magaalo kale, erey kale, ama muddo ballaaran.",
    emailSent: "Email ayaa loo diray", emailNotSent: "Natiijada waa la kaydiyay, laakiin email lama dirin.",
    source: "Fur isha", organizer: "Qabanqaabiye", venue: "Goobta", purpose: "Ujeeddo",
    rateLimit: "Xadka maalinlaha ah waad gaartay: ugu badnaan 5 raadin maalintii.",
    error: "Khalad ayaa dhacay. Fadlan isku day mar kale.",
    notConfigured: "Adeegga raadinta weli lama diyaarin.",
    historyTitle: "Taariikhda raadintaada", historyEmail: "Geli email-kaaga si aad u aragto taariikhdaada",
    open: "Fur", logout: "Beddel email", noHistory: "Weli raadin ma jirto",
    filterCity: "Magaalo", filterPlatform: "Barxad", filterCategory: "Qayb", filterDate: "Taariikhda raadinta",
    textSearch: "Raadi cinwaan ama qabanqaabiye", sortBy: "U kala sooc", sortDate: "Taariikh", sortCity: "Magaalo", sortOrganizer: "Qabanqaabiye",
    all: "Dhammaan", back: "Ku noqo taariikhda", searchesLbl: "raadin", eventsLbl: "dhacdo",
  },
};
export type Lang = keyof typeof dict;
type Dict = typeof dict.en;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "en", setLang: () => {}, t: dict.en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const l = localStorage.getItem("er-lang");
    if (l === "so" || l === "en") setLangState(l);
  }, []);
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem("er-lang", l); };
  return <Ctx.Provider value={{ lang, setLang, t: dict[lang] }}>{children}</Ctx.Provider>;
}
export const useI18n = () => useContext(Ctx);

// Simple email-based session
export function useEmailSession() {
  const [email, setEmailState] = useState<string | null>(null);
  useEffect(() => setEmailState(localStorage.getItem("er-email")), []);
  const setEmail = (e: string | null) => {
    if (e) localStorage.setItem("er-email", e.toLowerCase()); else localStorage.removeItem("er-email");
    setEmailState(e ? e.toLowerCase() : null);
  };
  return { email, setEmail };
}
