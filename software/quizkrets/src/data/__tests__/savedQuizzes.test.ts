import { describe, it, expect } from 'vitest';
import { presetToConfigUpdates } from '../savedQuizzes';
import type { QuizPreset } from '../../types';

function makePreset(overrides: Partial<QuizPreset> = {}): QuizPreset {
  return {
    id: 'test-1',
    name: 'Testquiz',
    categories: ['historie', 'sport'],
    difficulties: ['lett'],
    questionCount: 10,
    categoryWeights: { historie: 60, sport: 40 },
    rounds: [
      {
        mode: 'classic',
        questionCount: 10,
        timeLimit: 25,
        pointsPerCorrect: 150,
        pointsPerWrong: -10,
        bonusForSpeed: true,
      },
    ],
    ...overrides,
  };
}

describe('presetToConfigUpdates (P1 #5: vekter i lagrede quizer)', () => {
  it('gjenoppretter faktiske kategorivekter fra preset', () => {
    const updates = presetToConfigUpdates(makePreset());
    expect(updates.categoryWeights).toEqual({ historie: 60, sport: 40 });
  });

  it('gjenoppretter spillmodus og innstillinger fra runden', () => {
    const updates = presetToConfigUpdates(makePreset());
    expect(updates.gameMode).toBe('classic');
    expect(updates.timePerQuestion).toBe(25);
    expect(updates.pointsPerCorrect).toBe(150);
    expect(updates.pointsPerWrong).toBe(-10);
    expect(updates.bonusForSpeed).toBe(true);
    expect(updates.questionCount).toBe(10);
    expect(updates.quizName).toBe('Testquiz');
    expect(updates.selectedCategories).toEqual(['historie', 'sport']);
  });

  it('preset UTEN vekter gir eksplisitt {} – gamle vekter nullstilles', () => {
    const preset = makePreset({ categoryWeights: {} });
    const updates = presetToConfigUpdates(preset);
    // startGame fletter grunne; {} må derfor oppgis eksplisitt slik at
    // vekter fra en tidligere lastet quiz ikke følger med.
    expect(updates.categoryWeights).toEqual({});
  });

  it('mangler rounds-felt gir trygge standardverdier', () => {
    const updates = presetToConfigUpdates(makePreset({ rounds: [] }));
    expect(updates.gameMode).toBe('classic');
    expect(updates.timePerQuestion).toBe(20);
    expect(updates.pointsPerCorrect).toBe(100);
    expect(updates.pointsPerWrong).toBe(0);
    expect(updates.bonusForSpeed).toBe(false);
  });
});
