import { describe, it, expect, beforeEach } from 'vitest';
import { createQuestionnaireEngine, NotInitializedError } from '../../engine';
import { createScoringConfigLoader } from '../../utils/scoring-loader';
import { simpleQuestionnaire, questionnaireWithFormulas } from '../fixtures/questionnaires';
import type { ScoringConfig } from '../../types/scoring';

describe('QuestionnaireEngine - calculateScore', () => {
  let engine: ReturnType<typeof createQuestionnaireEngine>;

  beforeEach(() => {
    engine = createQuestionnaireEngine();
  });

  describe('calculateScore', () => {
    it('should throw NotInitializedError when not initialized', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      expect(() => engine.calculateScore(config)).toThrow(NotInitializedError);
    });

    it('should calculate score from current answers', () => {
      engine.load(questionnaireWithFormulas);
      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 20);
      engine.setAnswer('q3', 30);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2, q3)',
          },
        ],
      };

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(1);
      expect(results[0].formulaId).toBe('total');
      expect(results[0].parameterName).toBe('totalScore');
      expect(results[0].value).toBe(60);
    });

    it('should calculate score from provided answers', () => {
      engine.load(questionnaireWithFormulas);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2, q3)',
          },
        ],
      };

      const answers = {
        q1: 5,
        q2: 10,
        q3: 15,
      };

      const results = engine.calculateScore(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(30);
    });

    it('should handle multiple scoring formulas', () => {
      engine.load(questionnaireWithFormulas);
      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 20);
      engine.setAnswer('q3', 30);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'sum1',
            parameterName: 'sum1Score',
            expression: 'sum(q1, q2)',
          },
          {
            id: 'sum2',
            parameterName: 'sum2Score',
            expression: 'sum(q2, q3)',
          },
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(sum1, sum2)',
          },
        ],
      };

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(3);
      expect(results.find(r => r.parameterName === 'sum1Score')?.value).toBe(30);
      expect(results.find(r => r.parameterName === 'sum2Score')?.value).toBe(50);
      expect(results.find(r => r.parameterName === 'totalScore')?.value).toBe(80);
    });

    it('should handle formula dependencies correctly', () => {
      engine.load(questionnaireWithFormulas);
      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 20);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'base',
            parameterName: 'baseScore',
            expression: 'sum(q1, q2)',
          },
          {
            id: 'doubled',
            parameterName: 'doubledScore',
            expression: 'base * 2',
          },
        ],
      };

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(2);
      expect(results.find(r => r.parameterName === 'baseScore')?.value).toBe(30);
      expect(results.find(r => r.parameterName === 'doubledScore')?.value).toBe(60);
    });

    it('should return empty array for empty formulas', () => {
      engine.load(simpleQuestionnaire);

      const config: ScoringConfig = {
        formulas: [],
      };

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(0);
    });

    it('should handle division by zero (returns Infinity)', () => {
      engine.load(simpleQuestionnaire);
      engine.setAnswer('q1', 10);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'invalid',
            parameterName: 'invalidScore',
            expression: 'q1 / 0',
          },
        ],
      };

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(Infinity);
    });

    it('should include resultType if specified', () => {
      engine.load(questionnaireWithFormulas);
      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 20);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
            resultType: 'percentage',
          },
        ],
      };

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(30);
    });

    it('should calculate score with scoringConfig loaded from JSON string', () => {
      engine.load(questionnaireWithFormulas);
      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 20);
      engine.setAnswer('q3', 30);

      const loader = createScoringConfigLoader();
      const jsonString = JSON.stringify({
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2, q3)',
          },
        ],
      });

      const config = loader.loadFromString(jsonString);
      const results = engine.calculateScore(config);

      expect(results).toHaveLength(1);
      expect(results[0].formulaId).toBe('total');
      expect(results[0].parameterName).toBe('totalScore');
      expect(results[0].value).toBe(60);
    });

    it('should calculate score with scoringConfig loaded from JSON object', () => {
      engine.load(questionnaireWithFormulas);
      engine.setAnswer('q1', 5);
      engine.setAnswer('q2', 10);
      engine.setAnswer('q3', 15);

      const loader = createScoringConfigLoader();
      const config = loader.loadFromObject({
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2, q3)',
          },
        ],
      });

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(30);
    });

    it('should handle empty scoringConfig', () => {
      engine.load(simpleQuestionnaire);

      const config: ScoringConfig = {
        formulas: [],
      };

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(0);
    });

    it('should handle scoringConfig with resultType loaded from JSON', () => {
      engine.load(questionnaireWithFormulas);
      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 20);

      const loader = createScoringConfigLoader();
      const config = loader.loadFromObject({
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
            resultType: 'percentage',
          },
        ],
      });

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(30);
    });

    it('should handle scoringConfig referencing non-existent questions', () => {
      engine.load(simpleQuestionnaire);
      engine.setAnswer('q1', 10);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(nonexistent1, nonexistent2)',
          },
        ],
      };

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(0);
    });

    it('should use provided answers over engine state when both are set', () => {
      engine.load(questionnaireWithFormulas);
      engine.setAnswer('q1', 100);
      engine.setAnswer('q2', 200);
      engine.setAnswer('q3', 300);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2, q3)',
          },
        ],
      };

      const providedAnswers = {
        q1: 1,
        q2: 2,
        q3: 3,
      };

      const results = engine.calculateScore(config, providedAnswers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(6);
    });

    it('should return empty array when config has empty formulas and no answers provided', () => {
      engine.load(questionnaireWithFormulas);

      const config: ScoringConfig = {
        formulas: [],
      };

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(0);
    });

    it('should return score result with formulaId parameterName and value', () => {
      engine.load(questionnaireWithFormulas);
      engine.setAnswer('q1', 7);
      engine.setAnswer('q2', 8);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'my-formula',
            parameterName: 'myParam',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('formulaId', 'my-formula');
      expect(results[0]).toHaveProperty('parameterName', 'myParam');
      expect(results[0]).toHaveProperty('value', 15);
      expect(typeof results[0].value).toBe('number');
    });

    it('should calculate single-question score when expression references one question', () => {
      engine.load(questionnaireWithFormulas);
      engine.setAnswer('q1', 99);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'single',
            parameterName: 'singleScore',
            expression: 'q1',
          },
        ],
      };

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(99);
    });

    it('should calculate score from provided answers only when engine has no answers', () => {
      engine.load(questionnaireWithFormulas);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2, q3)',
          },
        ],
      };

      const results = engine.calculateScore(config, { q1: 1, q2: 2, q3: 3 });

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(6);
    });

    it('should handle arithmetic expression in scoring formula', () => {
      engine.load(questionnaireWithFormulas);
      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 5);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'diff',
            parameterName: 'diffScore',
            expression: 'q1 - q2',
          },
        ],
      };

      const results = engine.calculateScore(config);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(5);
    });

    it('should handle provided empty answers object', () => {
      engine.load(questionnaireWithFormulas);

      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2, q3)',
          },
        ],
      };

      const results = engine.calculateScore(config, {});

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(0);
    });
  });
});
