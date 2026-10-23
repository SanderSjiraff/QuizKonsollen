import type { Category, Question, Player, QuizPreset } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'historie', name: 'Historie', icon: '🏛️', color: '#D97706' },
  { id: 'sport', name: 'Sport', icon: '⚽', color: '#16A34A' },
  { id: 'teknologi', name: 'Teknologi', icon: '💻', color: '#2563EB' },
  { id: 'film', name: 'Film & TV', icon: '🎬', color: '#DC2626' },
  { id: 'musikk', name: 'Musikk', icon: '🎵', color: '#9333EA' },
  { id: 'geografi', name: 'Geografi', icon: '🌍', color: '#0891B2' },
  { id: 'naturvitenskap', name: 'Naturvitenskap', icon: '🔬', color: '#059669' },
  { id: 'gaming', name: 'Gaming', icon: '🎮', color: '#EA580C' },
];

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Hva er hovedstaden i Australia?',
    type: 'multiple_choice',
    difficulty: 'lett',
    categories: ['geografi'],
    choices: [
      { id: 'a', text: 'Sydney' },
      { id: 'b', text: 'Melbourne' },
      { id: 'c', text: 'Canberra' },
      { id: 'd', text: 'Perth' },
    ],
    correctChoiceIds: ['c'],
    explanation: 'Canberra ble valgt som hovedstad i 1908 som et kompromiss mellom Sydney og Melbourne.',
  },
  {
    id: 'q2',
    text: 'Hvem skrev "Romeo og Julie"?',
    type: 'multiple_choice',
    difficulty: 'lett',
    categories: ['historie'],
    choices: [
      { id: 'a', text: 'Charles Dickens' },
      { id: 'b', text: 'William Shakespeare' },
      { id: 'c', text: 'Jane Austen' },
      { id: 'd', text: 'Mark Twain' },
    ],
    correctChoiceIds: ['b'],
  },
  {
    id: 'q3',
    text: 'Hva er den kjemiske formelen for vann?',
    type: 'multiple_choice',
    difficulty: 'lett',
    categories: ['naturvitenskap'],
    choices: [
      { id: 'a', text: 'H2O' },
      { id: 'b', text: 'CO2' },
      { id: 'c', text: 'NaCl' },
      { id: 'd', text: 'O2' },
    ],
    correctChoiceIds: ['a'],
  },
  {
    id: 'q4',
    text: 'Hvilket land vant FIFA VM i 2022?',
    type: 'multiple_choice',
    difficulty: 'middels',
    categories: ['sport'],
    choices: [
      { id: 'a', text: 'Frankrike' },
      { id: 'b', text: 'Argentina' },
      { id: 'c', text: 'Brasil' },
      { id: 'd', text: 'Tyskland' },
    ],
    correctChoiceIds: ['b'],
  },
  {
    id: 'q5',
    text: 'Hvem oppfant World Wide Web?',
    type: 'multiple_choice',
    difficulty: 'middels',
    categories: ['teknologi'],
    choices: [
      { id: 'a', text: 'Bill Gates' },
      { id: 'b', text: 'Steve Jobs' },
      { id: 'c', text: 'Tim Berners-Lee' },
      { id: 'd', text: 'Mark Zuckerberg' },
    ],
    correctChoiceIds: ['c'],
  },
  {
    id: 'q6',
    text: 'Hva er det største organet i menneskekroppen?',
    type: 'multiple_choice',
    difficulty: 'middels',
    categories: ['naturvitenskap'],
    choices: [
      { id: 'a', text: 'Hjernen' },
      { id: 'b', text: 'Leveren' },
      { id: 'c', text: 'Huden' },
      { id: 'd', text: 'Hjertet' },
    ],
    correctChoiceIds: ['c'],
  },
  {
    id: 'q7',
    text: 'Hvilket år ble Norge en selvstendig nasjon?',
    type: 'multiple_choice',
    difficulty: 'middels',
    categories: ['historie'],
    choices: [
      { id: 'a', text: '1814' },
      { id: 'b', text: '1905' },
      { id: 'c', text: '1945' },
      { id: 'd', text: '1789' },
    ],
    correctChoiceIds: ['b'],
  },
  {
    id: 'q8',
    text: 'Hvem malte "Mona Lisa"?',
    type: 'multiple_choice',
    difficulty: 'lett',
    categories: ['historie'],
    choices: [
      { id: 'a', text: 'Vincent van Gogh' },
      { id: 'b', text: 'Pablo Picasso' },
      { id: 'c', text: 'Leonardo da Vinci' },
      { id: 'd', text: 'Michelangelo' },
    ],
    correctChoiceIds: ['c'],
  },
  {
    id: 'q9',
    text: 'Hva er det høyeste fjellet i verden?',
    type: 'multiple_choice',
    difficulty: 'lett',
    categories: ['geografi'],
    choices: [
      { id: 'a', text: 'K2' },
      { id: 'b', text: 'Mount Everest' },
      { id: 'c', text: 'Kilimanjaro' },
      { id: 'd', text: 'Mont Blanc' },
    ],
    correctChoiceIds: ['b'],
  },
  {
    id: 'q10',
    text: 'Hvilket programmeringsspråk ble laget av Guido van Rossum?',
    type: 'multiple_choice',
    difficulty: 'middels',
    categories: ['teknologi'],
    choices: [
      { id: 'a', text: 'Java' },
      { id: 'b', text: 'Python' },
      { id: 'c', text: 'C++' },
      { id: 'd', text: 'Ruby' },
    ],
    correctChoiceIds: ['b'],
  },
  {
    id: 'q11',
    text: 'Hva er Plancks konstant?',
    type: 'multiple_choice',
    difficulty: 'vanskelig',
    categories: ['naturvitenskap'],
    choices: [
      { id: 'a', text: '6.626 × 10^-34 J·s' },
      { id: 'b', text: '3.141 × 10^0' },
      { id: 'c', text: '9.81 m/s²' },
      { id: 'd', text: '299,792 km/s' },
    ],
    correctChoiceIds: ['a'],
  },
  {
    id: 'q12',
    text: 'Hvem regnes som "dataens far"?',
    type: 'multiple_choice',
    difficulty: 'middels',
    categories: ['teknologi'],
    choices: [
      { id: 'a', text: 'Alan Turing' },
      { id: 'b', text: 'John von Neumann' },
      { id: 'c', text: 'Charles Babbage' },
      { id: 'd', text: 'Ada Lovelace' },
    ],
    correctChoiceIds: ['a'],
  },
];

export const PLAYER_COLORS = [
  '#3B82F6', '#EF4444', '#22C55E', '#F59E0B', 
  '#A855F7', '#EC4899', '#06B6D4', '#F97316'
];

export const DEFAULT_PLAYERS: Player[] = [
  { id: 1, name: 'Spiller 1', color: PLAYER_COLORS[0], score: 0, isReady: true }, // Alltid minst 1 spiller, auto-klar
];

export const SAMPLE_PRESETS: QuizPreset[] = [
  {
    id: 'preset-1',
    name: 'Allsidig Mix',
    categories: ['historie', 'sport', 'teknologi', 'geografi'],
    difficulties: ['lett', 'middels'],
    questionCount: 15,
    categoryWeights: { historie: 0.25, sport: 0.25, teknologi: 0.25, geografi: 0.25 },
    rounds: [
      { mode: 'classic', questionCount: 15, timeLimit: 20, pointsPerCorrect: 100, pointsPerWrong: 0 }
    ],
  },
  {
    id: 'preset-2',
    name: 'Teknologi-ekspert',
    categories: ['teknologi', 'naturvitenskap'],
    difficulties: ['middels', 'vanskelig'],
    questionCount: 10,
    categoryWeights: { teknologi: 0.6, naturvitenskap: 0.4 },
    rounds: [
      { mode: 'classic', questionCount: 10, timeLimit: 30, pointsPerCorrect: 150, pointsPerWrong: -50 }
    ],
  },
];
