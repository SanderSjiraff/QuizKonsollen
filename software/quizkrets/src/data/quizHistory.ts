export interface QuizHistory {
  id: string;
  date: string;
  quizName: string;
  mode: string;
  players: { id: number; name: string; score: number; color: string }[];
  totalQuestions: number;
  duration: number;
}

const HISTORY_KEY = 'quizkrets_history';

export function saveQuizHistory(history: QuizHistory): void {
  try {
    const existing = getQuizHistory();
    existing.unshift(history);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch (error) {
    console.error('Kunne ikke lagre historikk:', error);
  }
}

export function getQuizHistory(): QuizHistory[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function deleteQuizHistory(id: string): void {
  try {
    const existing = getQuizHistory();
    const filtered = existing.filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Kunne ikke slette historikk:', error);
  }
}

export function clearAllHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
