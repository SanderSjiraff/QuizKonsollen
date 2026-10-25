/**
 * Tema↔kategori/tag-matching for brukerdefinerte temaer i QuizKrets.
 * Hjelper med å oversette et brukerskrevet tema til noe som kan brukes
 * mot interne kategorier og eksterne API-tags.
 *
 * VIKTIG: Ingen AI-generering. Kun matching mot kjente kategorier og tags.
 */

import { CATEGORY_DEF_IDS, MIGRATION_MAP } from './categories';

/** Norske/engelske aliaser for populære temaer. */
export const THEME_ALIASES: Record<string, string[]> = {
  dinosaurer: ['dinosaurs', 'animals'],
  'the beatles': ['the_beatles', 'music'],
  'andre verdenskrig': ['world_war_2', 'history'],
  'premier league': ['premier_league', 'sport_and_leisure'],
  romfart: ['space', 'astronomy'],
  'norsk historie': ['norwegian_history', 'history'],
  minecraft: ['minecraft', 'gaming'],
  fotball: ['football', 'sport_and_leisure'],
  vintersport: ['winter_sports', 'sport_and_leisure'],
  ol: ['olympics', 'sport_and_leisure'],
  motorsport: ['motor_sport', 'sport_and_leisure'],
};

/** Normaliser tematekst for matching. */
function normalizeTheme(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // fjern aksenter
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ThemeMatchResult {
  /** Om temaet ble gjenkjent. */
  recognized: boolean;
  /** Tilpasset temanavn for visning. */
  displayName: string;
  /** Matchede interne kategori-ID-er. */
  internalCategories: string[];
  /** Matchede eksterne tags for API-oppslag. */
  externalTags: string[];
  /** Forklaring til brukeren dersom temaet ikke ble gjenkjent. */
  message?: string;
}

/**
 * Analyser et brukerdefinert tema og finn matchende kategorier/tags.
 */
export function matchTheme(theme: string): ThemeMatchResult {
  const normalized = normalizeTheme(theme);
  const displayName = theme.trim();

  // 1. Sjekk direkte alias-mapping
  if (THEME_ALIASES[normalized]) {
    const aliases = THEME_ALIASES[normalized];
    const internalCategories = aliases.filter(a => CATEGORY_DEF_IDS.has(a) || MIGRATION_MAP[a]);
    const mappedInternal = internalCategories.map(a => MIGRATION_MAP[a] || a).filter(c => CATEGORY_DEF_IDS.has(c));
    const externalTags = aliases.filter(a => !CATEGORY_DEF_IDS.has(a) && !MIGRATION_MAP[a]);
    return {
      recognized: true,
      displayName,
      internalCategories: [...new Set(mappedInternal)],
      externalTags,
    };
  }

  // 2. Sjekk om det matcher en intern kategori direkte
  if (CATEGORY_DEF_IDS.has(normalized)) {
    return {
      recognized: true,
      displayName,
      internalCategories: [normalized],
      externalTags: [],
    };
  }

  // 3. Sjekk om det matcher en migrasjonsmapping
  if (MIGRATION_MAP[normalized]) {
    const mapped = MIGRATION_MAP[normalized];
    if (CATEGORY_DEF_IDS.has(mapped)) {
      return {
        recognized: true,
        displayName,
        internalCategories: [mapped],
        externalTags: [],
      };
    }
  }

  // 4. Del opp i ord og sjekk hvert ord
  const words = normalized.split(' ').filter(w => w.length > 2);
  const matchedCats: string[] = [];
  for (const word of words) {
    if (CATEGORY_DEF_IDS.has(word)) matchedCats.push(word);
    if (MIGRATION_MAP[word] && CATEGORY_DEF_IDS.has(MIGRATION_MAP[word])) {
      matchedCats.push(MIGRATION_MAP[word]);
    }
  }

  if (matchedCats.length > 0) {
    return {
      recognized: true,
      displayName,
      internalCategories: [...new Set(matchedCats)],
      externalTags: [],
    };
  }

  // 5. Ikke gjenkjent
  return {
    recognized: false,
    displayName,
    internalCategories: [],
    externalTags: [],
    message: `Fant ingen tilgjengelige spørsmål om "${displayName}". Prøv et bredere tema eller velg en eksisterende kategori.`,
  };
}
