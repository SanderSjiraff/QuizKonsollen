/**
 * Sentral kategoridefinisjon – hierarkisk modell.
 * Alle deler av systemet (spørsmålsbank, quizbygger, API-adaptere) bruker disse IDene.
 *
 * Regler:
 * - `id` er en stabil, kebab-case streng.
 * - Ett spørsmål kan ha flere kategorier (f.eks. ['historie', 'norsk-historie']).
 * - Filtrering på en hovedkategori matcher også alle underkategorier.
 */

export interface CategoryDef {
  id: string;
  name: string;
  /** Hovedkategorien denne tilhører. Uttelatt for hovedkategorier. */
  parentId?: string;
  icon: string;
  color: string;
}

/** Alle kategorier (hoved + under) i rekkefølgen de skal vises. */
export const CATEGORIES: CategoryDef[] = [
  // Hovedkategorier
  { id: 'generell-kunnskap', name: 'Generell kunnskap', icon: '🧠', color: '#64748B' },
  { id: 'historie', name: 'Historie', icon: '🏛️', color: '#D97706' },
  { id: 'vitenskap', name: 'Vitenskap', icon: '🔬', color: '#059669' },
  { id: 'teknologi', name: 'Teknologi', icon: '💻', color: '#2563EB' },
  { id: 'underholdning', name: 'Underholdning', icon: '🎬', color: '#DC2626' },
  { id: 'sport', name: 'Sport', icon: '⚽', color: '#16A34A' },
  { id: 'geografi', name: 'Geografi', icon: '🌍', color: '#0891B2' },
  { id: 'samfunn-og-kultur', name: 'Samfunn og kultur', icon: '🏛️', color: '#7C3AED' },
  { id: 'natur-og-dyr', name: 'Natur og dyr', icon: '🐾', color: '#65A30D' },

  // Underkategorier – Historie
  { id: 'norsk-historie', name: 'Norsk historie', parentId: 'historie', icon: '🇳🇴', color: '#D97706' },
  { id: 'verdenshistorie', name: 'Verdenshistorie', parentId: 'historie', icon: '🗺️', color: '#D97706' },
  { id: 'krig-og-konflikter', name: 'Krig og konflikter', parentId: 'historie', icon: '⚔️', color: '#D97706' },
  { id: 'historiske-personer', name: 'Historiske personer', parentId: 'historie', icon: '👤', color: '#D97706' },

  // Underkategorier – Vitenskap
  { id: 'fysikk', name: 'Fysikk', parentId: 'vitenskap', icon: '⚛️', color: '#059669' },
  { id: 'kjemi', name: 'Kjemi', parentId: 'vitenskap', icon: '🧪', color: '#059669' },
  { id: 'biologi', name: 'Biologi', parentId: 'vitenskap', icon: '🧬', color: '#059669' },
  { id: 'astronomi', name: 'Astronomi', parentId: 'vitenskap', icon: '🌌', color: '#059669' },
  { id: 'matematikk', name: 'Matematikk', parentId: 'vitenskap', icon: '📐', color: '#059669' },

  // Underkategorier – Teknologi
  { id: 'programmering', name: 'Programmering', parentId: 'teknologi', icon: '⌨️', color: '#2563EB' },
  { id: 'datamaskiner', name: 'Datamaskiner', parentId: 'teknologi', icon: '🖥️', color: '#2563EB' },
  { id: 'internett', name: 'Internett', parentId: 'teknologi', icon: '🌐', color: '#2563EB' },
  { id: 'kunstig-intelligens', name: 'Kunstig intelligens', parentId: 'teknologi', icon: '🤖', color: '#2563EB' },
  { id: 'oppfinnelser', name: 'Oppfinnelser', parentId: 'teknologi', icon: '💡', color: '#2563EB' },
  { id: 'kjoretoy', name: 'Kjøretøy', parentId: 'teknologi', icon: '🚗', color: '#2563EB' },

  // Underkategorier – Underholdning
  { id: 'film-og-tv', name: 'Film og TV', parentId: 'underholdning', icon: '🎥', color: '#DC2626' },
  { id: 'musikk', name: 'Musikk', parentId: 'underholdning', icon: '🎵', color: '#DC2626' },
  { id: 'gaming', name: 'Gaming', parentId: 'underholdning', icon: '🎮', color: '#DC2626' },
  { id: 'brettspill', name: 'Brettspill', parentId: 'underholdning', icon: '🎲', color: '#DC2626' },
  { id: 'litteratur', name: 'Litteratur', parentId: 'underholdning', icon: '📚', color: '#DC2626' },
  { id: 'teater', name: 'Teater', parentId: 'underholdning', icon: '🎭', color: '#DC2626' },
  { id: 'tegneserier', name: 'Tegneserier', parentId: 'underholdning', icon: '💥', color: '#DC2626' },
  { id: 'anime', name: 'Anime og manga', parentId: 'underholdning', icon: '🇯🇵', color: '#DC2626' },

  // Underkategorier – Sport
  { id: 'fotball', name: 'Fotball', parentId: 'sport', icon: '⚽', color: '#16A34A' },
  { id: 'vintersport', name: 'Vintersport', parentId: 'sport', icon: '⛷️', color: '#16A34A' },
  { id: 'ol', name: 'OL', parentId: 'sport', icon: '🏅', color: '#16A34A' },
  { id: 'andre-idretter', name: 'Andre idretter', parentId: 'sport', icon: '🏆', color: '#16A34A' },

  // Underkategorier – Geografi
  { id: 'norge', name: 'Norge', parentId: 'geografi', icon: '🇳🇴', color: '#0891B2' },
  { id: 'europa', name: 'Europa', parentId: 'geografi', icon: '🇪🇺', color: '#0891B2' },
  { id: 'verdensgeografi', name: 'Verdensgeografi', parentId: 'geografi', icon: '🌏', color: '#0891B2' },
  { id: 'naturgeografi', name: 'Naturgeografi', parentId: 'geografi', icon: '🏔️', color: '#0891B2' },

  // Underkategorier – Samfunn og kultur
  { id: 'politikk', name: 'Politikk', parentId: 'samfunn-og-kultur', icon: '🗳️', color: '#7C3AED' },
  { id: 'samfunn', name: 'Samfunn', parentId: 'samfunn-og-kultur', icon: '👥', color: '#7C3AED' },
  { id: 'kunst', name: 'Kunst', parentId: 'samfunn-og-kultur', icon: '🎨', color: '#7C3AED' },
  { id: 'mat-og-drikke', name: 'Mat og drikke', parentId: 'samfunn-og-kultur', icon: '🍽️', color: '#7C3AED' },
  { id: 'mytologi', name: 'Mytologi', parentId: 'samfunn-og-kultur', icon: '🐉', color: '#7C3AED' },
  { id: 'kjendiser', name: 'Kjendiser', parentId: 'samfunn-og-kultur', icon: '⭐', color: '#7C3AED' },

  // Underkategorier – Natur og dyr
  { id: 'dyrearter', name: 'Dyrearter', parentId: 'natur-og-dyr', icon: '🦋', color: '#65A30D' },
  { id: 'planter', name: 'Planter', parentId: 'natur-og-dyr', icon: '🌿', color: '#65A30D' },
  { id: 'okosystemer', name: 'Økosystemer', parentId: 'natur-og-dyr', icon: '🌳', color: '#65A30D' },
  { id: 'naturfenomener', name: 'Naturfenomener', parentId: 'natur-og-dyr', icon: '🌪️', color: '#65A30D' },
];

/** Raskt oppslag på id. */
const CATEGORY_BY_ID = new Map(CATEGORIES.map(c => [c.id, c]));

/** Sett av alle gyldige kategori-IDer – brukes i validering. */
export const CATEGORY_DEF_IDS = new Set(CATEGORY_BY_ID.keys());

/**
 * Migreringsmap fra gamle/eksterne kategorinavn til nye IDer.
 * Dekker: interne gamle navn, OpenTDB-kategorier og vanlige importvarianter.
 */
export const MIGRATION_MAP: Record<string, string> = {
  // Gammle interne navn
  'naturvitenskap': 'vitenskap',
  'vitenskap_natur': 'vitenskap',
  'vitenskap': 'vitenskap',
  'videospill': 'gaming',
  'data': 'datamaskiner',
  'film': 'film-og-tv',
  'tv': 'film-og-tv',
  'tegnefilm': 'film-og-tv',
  'teknologi': 'teknologi',
  'generell_kunnskap': 'generell-kunnskap',
  'underholdning_bøker': 'litteratur',
  'underholdning_boeker': 'litteratur',
  'brettspill': 'brettspill',
  'gaming': 'gaming',
  'mytologi': 'mytologi',
  'politikk': 'politikk',
  'kunst': 'kunst',
  'kjendiser': 'kjendiser',
  'dyr': 'dyrearter',
  'kjøretøy': 'kjoretoy',
  'kjoretoy': 'kjoretoy',
  'tegneserier': 'tegneserier',
  'gadgets': 'oppfinnelser',
  'anime': 'anime',
  'matematikk': 'matematikk',

  // OpenTDB-engelske navn
  'General Knowledge': 'generell-kunnskap',
  'Entertainment: Books': 'litteratur',
  'Entertainment: Film': 'film-og-tv',
  'Entertainment: Music': 'musikk',
  'Entertainment: Musicals & Theatres': 'teater',
  'Entertainment: Television': 'film-og-tv',
  'Entertainment: Video Games': 'gaming',
  'Entertainment: Board Games': 'brettspill',
  'Science & Nature': 'vitenskap',
  'Science: Computers': 'datamaskiner',
  'Science: Mathematics': 'matematikk',
  'Science: Gadgets': 'oppfinnelser',
  'Mythology': 'mytologi',
  'Sports': 'sport',
  'Geography': 'geografi',
  'History': 'historie',
  'Politics': 'politikk',
  'Art': 'kunst',
  'Celebrities': 'kjendiser',
  'Animals': 'dyrearter',
  'Vehicles': 'kjoretoy',
  'Entertainment: Comics': 'tegneserier',
  'Entertainment: Japanese Anime & Manga': 'anime',
  'Entertainment: Cartoon & Animations': 'film-og-tv',

  // The Trivia API-kategorinavn
  'general_knowledge': 'generell-kunnskap',
  'history': 'historie',
  'science': 'vitenskap',
  'geography': 'geografi',
  'film_and_tv': 'film-og-tv',
  'music': 'musikk',
  'sport_and_leisure': 'sport',
  'arts_and_literature': 'litteratur',
  'society_and_culture': 'samfunn-og-kultur',
  'food_and_drink': 'mat-og-drikke',
};

/** Kategorier som ikke kunne migreres sikkert merkes med dette ID-prefixet. */
export const UNRESOLVED_CATEGORY = 'til-gjennomgang';

/**
 * Migrerer en liste med kategorinavn til gyldige, dedupliserte nye IDer.
 * Ukjente navn tildeles `til-gjennomgang` slik at de kan kvalitetssikres i spørsmålsbanken.
 */
export function migrateCategories(categories: string[]): string[] {
  const result = new Set<string>();
  let hadUnresolved = false;

  for (const raw of categories) {
    const key = raw.trim();
    if (!key) continue;
    const mapped = MIGRATION_MAP[key] ?? (CATEGORY_BY_ID.has(key) ? key : undefined);
    if (mapped) {
      result.add(mapped);
      // Legg automatisk til hovedkategorien når en underkategori brukes,
      // slik at spørsmålet alltid matcher filteret på hovednivå.
      const def = CATEGORY_BY_ID.get(mapped);
      if (def?.parentId) result.add(def.parentId);
    } else {
      hadUnresolved = true;
    }
  }

  if (hadUnresolved) result.add(UNRESOLVED_CATEGORY);
  return [...result];
}

/** Returnerer hovedkategorien for en gitt kategori-ID (seg selv for hovedkategorier). */
export function getTopLevelCategory(categoryId: string): string | undefined {
  const def = CATEGORY_BY_ID.get(categoryId);
  if (!def) return undefined;
  return def.parentId ?? def.id;
}

/** Hovedkategorier i visningsrekkefølge. */
export function getMainCategories(): CategoryDef[] {
  return CATEGORIES.filter(c => !c.parentId);
}

/** Underkategorier for en gitt hovedkategori. */
export function getSubcategories(parentId: string): CategoryDef[] {
  return CATEGORIES.filter(c => c.parentId === parentId);
}

/** Kategori-IDer (inkl. alle underkategorier) som matcher et sett med valgte kategorier. */
export function expandSelection(selected: string[]): Set<string> {
  const expanded = new Set<string>();
  for (const id of selected) {
    expanded.add(id);
    const def = CATEGORY_BY_ID.get(id);
    if (def && !def.parentId) {
      // Hovedkategori – legg til alle underkategorier
      for (const sub of CATEGORIES) {
        if (sub.parentId === id) expanded.add(sub.id);
      }
    }
  }
  return expanded;
}

/** Sjekker om et spørsmåls kategorier matcher minst én valgt kategori. */
export function matchesSelection(questionCategories: string[], selected: string[]): boolean {
  if (selected.length === 0) return true;
  const expanded = expandSelection(selected);
  return questionCategories.some(c => expanded.has(c));
}

/**
 * Velg hvilken kategori som skal vises for et spørsmål (P2 #11).
 *
 * Viser kategorien som matchet brukerens valg (direkte eller via
 * underkategori-utvidelse) – slik at et spørsmål valgt gjennom
 * «Historie» vises med sin historie-kategori, ikke med spørsmålets
 * første tilfeldige kategori. Uten match vises første kategori.
 */
export function pickDisplayCategory(
  questionCategories: string[],
  selected: string[]
): string | undefined {
  if (questionCategories.length === 0) return undefined;
  if (selected.length > 0) {
    const expanded = expandSelection(selected);
    const match = questionCategories.find(c => expanded.has(c));
    if (match) return match;
  }
  return questionCategories[0];
}

/** Visningsnavn for én kategori-ID ('historie' → 'Historie'). */
export function getCategoryName(categoryId: string): string {
  return CATEGORY_BY_ID.get(categoryId)?.name ?? categoryId;
}
