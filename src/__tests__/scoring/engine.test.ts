import { describe, it, expect } from 'vitest';
import { createScoringEngine } from '../../scoring';
import { createFormulaEngine } from '../../formulas';
import type { ScoringConfig, ScoreResult } from '../../types/scoring';
import type { AnswerStore } from '../../types/answers';

describe('ScoringEngine', () => {
  const formulaEngine = createFormulaEngine();
  const scoringEngine = createScoringEngine({ formulaEngine });

  describe('calculateScores', () => {
    it('should return empty array for empty formulas', () => {
      const config: ScoringConfig = {
        formulas: [],
      };

      const answers: AnswerStore = {};

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(0);
    });

    it('should calculate single score', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2, q3)',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 10,
        q2: 20,
        q3: 30,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].formulaId).toBe('total');
      expect(results[0].parameterName).toBe('totalScore');
      expect(results[0].value).toBe(60);
      expect(results[0].error).toBeUndefined();
    });

    it('should calculate multiple independent scores', () => {
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
            expression: 'sum(q3, q4)',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 5,
        q2: 10,
        q3: 15,
        q4: 20,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(2);
      expect(results.find(r => r.parameterName === 'sum1Score')?.value).toBe(15);
      expect(results.find(r => r.parameterName === 'sum2Score')?.value).toBe(35);
    });

    it('should handle formula dependencies', () => {
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

      const answers: AnswerStore = {
        q1: 10,
        q2: 20,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(2);
      const baseResult = results.find(r => r.parameterName === 'baseScore');
      const doubledResult = results.find(r => r.parameterName === 'doubledScore');

      expect(baseResult?.value).toBe(30);
      expect(doubledResult?.value).toBe(60);
    });

    it('should handle complex dependencies', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'a',
            parameterName: 'aScore',
            expression: 'sum(q1, q2)',
          },
          {
            id: 'b',
            parameterName: 'bScore',
            expression: 'sum(q3, q4)',
          },
          {
            id: 'c',
            parameterName: 'cScore',
            expression: 'sum(a, b)',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 5,
        q2: 10,
        q3: 15,
        q4: 20,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(3);
      expect(results.find(r => r.parameterName === 'aScore')?.value).toBe(15);
      expect(results.find(r => r.parameterName === 'bScore')?.value).toBe(35);
      expect(results.find(r => r.parameterName === 'cScore')?.value).toBe(50);
    });

    it('should handle division by zero (returns Infinity)', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'invalid',
            parameterName: 'invalidScore',
            expression: 'q1 / 0',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 10,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(Infinity);
    });

    it('should handle empty expression', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'empty',
            parameterName: 'emptyScore',
            expression: '',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 10,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(0);
      expect(results[0].error).toBeDefined();
    });

    it('should handle missing field references', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'missing',
            parameterName: 'missingScore',
            expression: 'sum(nonexistent1, nonexistent2)',
          },
        ],
      };

      const answers: AnswerStore = {};

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(0);
    });

    it('should handle circular dependencies gracefully', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'a',
            parameterName: 'aScore',
            expression: 'b + 1',
          },
          {
            id: 'b',
            parameterName: 'bScore',
            expression: 'a + 1',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 10,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(2);
      const aResult = results.find(r => r.formulaId === 'a');
      const bResult = results.find(r => r.formulaId === 'b');
      expect(aResult).toBeDefined();
      expect(bResult).toBeDefined();
      expect(aResult?.value).toBeGreaterThanOrEqual(0);
      expect(bResult?.value).toBeGreaterThanOrEqual(0);
    });

    it('should handle formula referencing non-existent formula ID', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'nonexistentFormula * 2',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 10,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(0);
    });

    it('should handle formula with invalid expression syntax', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'invalid',
            parameterName: 'invalidScore',
            expression: 'q1 + + q2',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 10,
        q2: 20,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      if (results[0].error) {
        expect(results[0].error).toBeDefined();
        expect(results[0].value).toBe(0);
      } else {
        expect(results[0].value).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle formula with all resultType values', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'number',
            parameterName: 'numberScore',
            expression: 'sum(q1, q2)',
            resultType: 'number',
          },
          {
            id: 'percentage',
            parameterName: 'percentageScore',
            expression: 'sum(q1, q2)',
            resultType: 'percentage',
          },
          {
            id: 'category',
            parameterName: 'categoryScore',
            expression: 'sum(q1, q2)',
            resultType: 'category',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 10,
        q2: 20,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(3);
      expect(results[0].value).toBe(30);
      expect(results[1].value).toBe(30);
      expect(results[2].value).toBe(30);
    });

    it('should handle formula with special characters in parameterName', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'special',
            parameterName: 'score_with_underscores',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 10,
        q2: 20,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].parameterName).toBe('score_with_underscores');
      expect(results[0].value).toBe(30);
    });

    it('should handle formula with very long expression', () => {
      const longExpression = Array.from({ length: 100 }, (_, i) => `q${i + 1}`).join(' + ');
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'long',
            parameterName: 'longScore',
            expression: longExpression,
          },
        ],
      };

      const answers: AnswerStore = {};
      for (let i = 1; i <= 100; i++) {
        answers[`q${i}`] = 1;
      }

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(100);
    });

    it('should handle formula with nested function calls', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'nested',
            parameterName: 'nestedScore',
            expression: 'sum(sum(q1, q2), sum(q3, q4))',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 5,
        q2: 10,
        q3: 15,
        q4: 20,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(50);
    });

    it('should verify formula evaluation order (topological sort)', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'c',
            parameterName: 'cScore',
            expression: 'a + b',
          },
          {
            id: 'a',
            parameterName: 'aScore',
            expression: 'sum(q1, q2)',
          },
          {
            id: 'b',
            parameterName: 'bScore',
            expression: 'sum(q3, q4)',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 5,
        q2: 10,
        q3: 15,
        q4: 20,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(3);
      const aResult = results.find(r => r.formulaId === 'a');
      const bResult = results.find(r => r.formulaId === 'b');
      const cResult = results.find(r => r.formulaId === 'c');

      expect(aResult?.value).toBe(15);
      expect(bResult?.value).toBe(35);
      expect(cResult?.value).toBe(50);
    });

    it('should handle large number of formulas', () => {
      const formulas = Array.from({ length: 50 }, (_, i) => ({
        id: `formula-${i}`,
        parameterName: `score${i}`,
        expression: `sum(q${i * 2 + 1}, q${i * 2 + 2})`,
      }));

      const config: ScoringConfig = {
        formulas,
      };

      const answers: AnswerStore = {};
      for (let i = 1; i <= 100; i++) {
        answers[`q${i}`] = 1;
      }

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result.value).toBe(2);
      });
    });

    it('should evaluate single question reference without sum', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'single',
            parameterName: 'singleScore',
            expression: 'q1',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 42,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(42);
    });

    it('should handle arithmetic subtraction in expression', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'diff',
            parameterName: 'diffScore',
            expression: 'q1 - q2',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 50,
        q2: 20,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(30);
    });

    it('should handle arithmetic multiplication in expression', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'product',
            parameterName: 'productScore',
            expression: 'q1 * q2',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 6,
        q2: 7,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(42);
    });

    it('should handle arithmetic division with non-zero divisor', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'ratio',
            parameterName: 'ratioScore',
            expression: 'q1 / q2',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 100,
        q2: 4,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(25);
    });

    it('should handle zero values in answers', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2, q3)',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 0,
        q2: 0,
        q3: 0,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(0);
    });

    it('should handle negative numbers in answers', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: -10,
        q2: 20,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(10);
    });

    it('should handle decimal values in answers', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 1.5,
        q2: 2.5,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(4);
    });

    it('should handle mixed arithmetic in single expression', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'mixed',
            parameterName: 'mixedScore',
            expression: 'q1 + q2 * 2 - q3',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 10,
        q2: 5,
        q3: 4,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(10 + 10 - 4);
    });

    it('should preserve result order consistent with formula array when no dependencies', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'first',
            parameterName: 'firstScore',
            expression: 'q1',
          },
          {
            id: 'second',
            parameterName: 'secondScore',
            expression: 'q2',
          },
          {
            id: 'third',
            parameterName: 'thirdScore',
            expression: 'q3',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 1,
        q2: 2,
        q3: 3,
      };

      const results = scoringEngine.calculateScores(config, answers);

      expect(results).toHaveLength(3);
      expect(results[0].formulaId).toBe('first');
      expect(results[1].formulaId).toBe('second');
      expect(results[2].formulaId).toBe('third');
      expect(results[0].value).toBe(1);
      expect(results[1].value).toBe(2);
      expect(results[2].value).toBe(3);
    });

    it('should not mutate input config or answers', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      const answers: AnswerStore = {
        q1: 10,
        q2: 20,
      };

      const configSnapshot = JSON.stringify(config);
      const answersSnapshot = JSON.stringify(answers);

      scoringEngine.calculateScores(config, answers);

      expect(JSON.stringify(config)).toBe(configSnapshot);
      expect(JSON.stringify(answers)).toBe(answersSnapshot);
    });
  });

  describe('validateScoringConfig', () => {
    it('should return true for valid config', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      expect(scoringEngine.validateScoringConfig(config)).toBe(true);
    });

    it('should return false for null config', () => {
      expect(scoringEngine.validateScoringConfig(null as any)).toBe(false);
    });

    it('should return false for config without formulas', () => {
      const config = {} as ScoringConfig;
      expect(scoringEngine.validateScoringConfig(config)).toBe(false);
    });

    it('should return false for non-array formulas', () => {
      const config = {
        formulas: 'not an array',
      } as any;

      expect(scoringEngine.validateScoringConfig(config)).toBe(false);
    });

    it('should return false for formula without id', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          } as any,
        ],
      };

      expect(scoringEngine.validateScoringConfig(config)).toBe(false);
    });

    it('should return false for formula without parameterName', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            expression: 'sum(q1, q2)',
          } as any,
        ],
      };

      expect(scoringEngine.validateScoringConfig(config)).toBe(false);
    });

    it('should return false for formula without expression', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
          } as any,
        ],
      };

      expect(scoringEngine.validateScoringConfig(config)).toBe(false);
    });

    it('should return false for formula with invalid expression', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: '(',
          },
        ],
      };

      const result = scoringEngine.validateScoringConfig(config);
      expect(result).toBe(false);
    });

    it('should return false for formula with empty string id', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: '',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      expect(scoringEngine.validateScoringConfig(config)).toBe(false);
    });

    it('should return false for formula with empty string parameterName', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: '',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      expect(scoringEngine.validateScoringConfig(config)).toBe(false);
    });

    it('should return true for config with single formula and optional resultType', () => {
      const config: ScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'q1 + q2',
            resultType: 'number',
          },
        ],
      };

      expect(scoringEngine.validateScoringConfig(config)).toBe(true);
    });

    it('should return false for undefined config', () => {
      expect(scoringEngine.validateScoringConfig(undefined as any)).toBe(false);
    });
  });
});
