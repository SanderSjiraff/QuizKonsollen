export type Screen = 
  | 'main-menu'
  | 'quiz-builder'
  | 'saved-quizzes'
  | 'game-setup'
  | 'lobby'
  | 'game-play'
  | 'results'
  | 'question-bank'
  | 'settings';

export type Difficulty = 'lett' | 'middels' | 'vanskelig';

export type QuestionType = 'multiple_choice' | 'buzzer' | 'true_false';

export type GameMode = 'classic' | 'buzzer' | 'team';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  categories: string[];
  choices: { id: string; text: string }[];
  correctChoiceIds: string[];
  explanation?: string;
}

export interface QuizPreset {
  id: string;
  name: string;
  categories: string[];
  difficulties: Difficulty[];
  questionCount: number;
  categoryWeights: Record<string, number>;
  rounds: GameRound[];
}

export interface GameRound {
  mode: GameMode;
  questionCount: number;
  timeLimit: number;
  pointsPerCorrect: number;
  pointsPerWrong: number;
  bonusForSpeed?: boolean;
}

export interface Player {
  id: number;
  name: string;
  color: string;
  score: number;
  isReady: boolean;
  teamId?: number;
}

export interface Team {
  id: number;
  name: string;
  color: string;
  score: number;
  playerIds: number[];
}

export interface GameState {
  screen: Screen;
  players: Player[];
  teams: Team[];
  currentRound: number;
  currentQuestion: number;
  questions: Question[];
  scores: Record<number, number>;
  answers: AnswerRecord[];
  isPaused: boolean;
  timeRemaining: number;
  gameMode: GameMode;
}

export interface AnswerRecord {
  questionId: string;
  playerId: number;
  choiceId: string;
  isCorrect: boolean;
  timeTaken: number;
  points: number;
}

export interface AppSettings {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  playerCount: number;
  language: 'no' | 'en';
}
