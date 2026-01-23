import { describe, it, expect, beforeEach } from 'vitest';
import { createFormulaEngine } from '../../formulas/engine';
import type { Formula } from '../../types/questionnaire';
import type { AnswerStore } from '../../types/answers';

describe('Formula Engine - Edge Cases', () => {
  let formulaEngine: ReturnType<typeof createFormulaEngine>;

  beforeEach(() => {
    formulaEngine = createFormulaEngine();
  });

  describe('Expression Evaluation Edge Cases', () => {
    it('should handle empty expression', () => {
      expect(() => formulaEngine.evaluate('', {})).toThrow();
    });

    it('should handle expression with only whitespace', () => {
      expect(() => formulaEngine.evaluate('   ', {})).toThrow();
    });

    it('should handle expression with missing field references', () => {
      const result = formulaEngine.evaluate('nonexistent', {});
      expect(typeof result).toBe('number');
    });

    it('should handle expression with null field values', () => {
      const answers: AnswerStore = {
        q1: null as any,
        q2: null as any
      };

      const result = formulaEngine.evaluate('sum(q1, q2)', answers);
      expect(typeof result).toBe('number');
    });

    it('should handle expression with undefined field values', () => {
      const answers: AnswerStore = {
        q1: undefined as any,
        q2: undefined as any
      };

      const result = formulaEngine.evaluate('sum(q1, q2)', answers);
      expect(typeof result).toBe('number');
    });

    it('should handle expression with empty string field values', () => {
      const answers: AnswerStore = {
        q1: '',
        q2: ''
      };

      const result = formulaEngine.evaluate('sum(q1, q2)', answers);
      expect(typeof result).toBe('number');
    });

    it('should handle expression with zero values', () => {
      const answers: AnswerStore = {
        q1: 0,
        q2: 0
      };

      const result = formulaEngine.evaluate('sum(q1, q2)', answers);
      expect(result).toBe(0);
    });

    it('should handle expression with negative numbers', () => {
      const answers: AnswerStore = {
        q1: -10,
        q2: -20
      };

      const result = formulaEngine.evaluate('sum(q1, q2)', answers);
      expect(result).toBe(-30);
    });

    it('should handle expression with floating point numbers', () => {
      const answers: AnswerStore = {
        q1: 3.14,
        q2: 2.86
      };

      const result = formulaEngine.evaluate('sum(q1, q2)', answers);
      expect(result).toBeCloseTo(6.0);
    });

    it('should handle division by zero', () => {
      const answers: AnswerStore = {
        q1: 10,
        q2: 0
      };

      const result = formulaEngine.evaluate('q1 / q2', answers);
      expect(result).toBe(Infinity);
    });

    it('should handle very large numbers', () => {
      const answers: AnswerStore = {
        q1: Number.MAX_SAFE_INTEGER,
        q2: 1
      };

      const result = formulaEngine.evaluate('q1 + q2', answers);
      expect(result).toBe(Number.MAX_SAFE_INTEGER + 1);
    });

    it('should handle boolean expressions', () => {
      const answers: AnswerStore = {
        q1: 10,
        q2: 5
      };

      const result1 = formulaEngine.evaluate('q1 > q2', answers);
      expect(result1).toBe(true);

      const result2 = formulaEngine.evaluate('q1 < q2', answers);
      expect(result2).toBe(false);

      const result3 = formulaEngine.evaluate('q1 == q2', answers);
      expect(result3).toBe(false);
    });

    it('should handle string comparisons', () => {
      const answers: AnswerStore = {
        q1: 'test',
        q2: 'test'
      };

      const result1 = formulaEngine.evaluate('q1 == q2', answers);
      expect(result1).toBe(true);

      const result2 = formulaEngine.evaluate('q1 != q2', answers);
      expect(result2).toBe(false);
    });

    it('should handle logical operators', () => {
      const answers: AnswerStore = {
        q1: 10,
        q2: 5
      };

      const result1 = formulaEngine.evaluate('q1 > 5 && q2 > 0', answers);
      expect(result1).toBe(true);

      const result2 = formulaEngine.evaluate('q1 < 5 || q2 > 10', answers);
      expect(result2).toBe(false);
    });

    it('should handle nested parentheses', () => {
      const answers: AnswerStore = {
        q1: 10,
        q2: 5,
        q3: 2
      };

      const result = formulaEngine.evaluate('((q1 + q2) * q3) / 2', answers);
      expect(result).toBe(15);
    });

    it('should handle unary operators', () => {
      const answers: AnswerStore = {
        q1: 10
      };

      const result1 = formulaEngine.evaluate('-q1', answers);
      expect(result1).toBe(-10);

      const result2 = formulaEngine.evaluate('!q1', answers);
      expect(result2).toBe(false);
    });
  });

  describe('Formula Evaluation Edge Cases', () => {
    it('should handle formula with missing referenced fields', () => {
      const formula: Formula = {
        id: 'total',
        expression: 'sum(q1, q2, q3)'
      };

      const answers: AnswerStore = {
        q1: 10
      };

      const result = formulaEngine.evaluateFormula(formula, answers);
      expect(result.formulaId).toBe('total');
      expect(typeof result.value).toBe('number');
    });

    it('should handle formula with invalid expression', () => {
      const formula: Formula = {
        id: 'invalid',
        expression: 'q1 >>>> 10'
      };

      const answers: AnswerStore = {
        q1: 10
      };

      const result = formulaEngine.evaluateFormula(formula, answers);
      expect(result.error).toBeDefined();
    });

    it('should handle formula with empty expression', () => {
      const formula: Formula = {
        id: 'empty',
        expression: ''
      };

      const answers: AnswerStore = {};

      expect(() => formulaEngine.evaluateFormula(formula, answers)).toThrow();
    });

    it('should handle formula with boolean result', () => {
      const formula: Formula = {
        id: 'comparison',
        expression: 'q1 > q2'
      };

      const answers: AnswerStore = {
        q1: 10,
        q2: 5
      };

      const result = formulaEngine.evaluateFormula(formula, answers);
      expect(result.value).toBe(1);
    });
  });

  describe('evaluateAll Edge Cases', () => {
    it('should handle empty formulas array', () => {
      const formulas: Formula[] = [];
      const answers: AnswerStore = {};

      const results = formulaEngine.evaluateAll(formulas, answers);
      expect(results).toHaveLength(0);
    });

    it('should handle formulas with circular dependencies', () => {
      const formulas: Formula[] = [
        { id: 'f1', expression: 'f2 + 10' },
        { id: 'f2', expression: 'f1 + 5' }
      ];

      const answers: AnswerStore = {};

      const results = formulaEngine.evaluateAll(formulas, answers);
      expect(results.length).toBe(2);
    });

    it('should handle formulas with self-reference', () => {
      const formulas: Formula[] = [
        { id: 'f1', expression: 'f1 + 10' }
      ];

      const answers: AnswerStore = {};

      const results = formulaEngine.evaluateAll(formulas, answers);
      expect(results.length).toBe(1);
    });

    it('should handle formulas with dependencies', () => {
      const formulas: Formula[] = [
        { id: 'sum', expression: 'q1 + q2' },
        { id: 'double', expression: 'sum * 2' }
      ];

      const answers: AnswerStore = {
        q1: 5,
        q2: 10
      };

      const results = formulaEngine.evaluateAll(formulas, answers);
      expect(results.length).toBe(2);
      expect(results[0].formulaId).toBe('sum');
      expect(results[1].formulaId).toBe('double');
    });

    it('should handle formulas with missing dependencies', () => {
      const formulas: Formula[] = [
        { id: 'sum', expression: 'q1 + q2' },
        { id: 'double', expression: 'sum * 2' }
      ];

      const answers: AnswerStore = {};

      const results = formulaEngine.evaluateAll(formulas, answers);
      expect(results.length).toBe(2);
    });

    it('should handle very large number of formulas', () => {
      const formulas: Formula[] = Array.from({ length: 100 }, (_, i) => ({
        id: `f${i}`,
        expression: `q${i} + ${i}`
      }));

      const answers: AnswerStore = {};
      for (let i = 0; i < 100; i++) {
        answers[`q${i}`] = i;
      }

      const results = formulaEngine.evaluateAll(formulas, answers);
      expect(results.length).toBe(100);
    });

    it('should handle formulas with complex expressions', () => {
      const formulas: Formula[] = [
        { id: 'complex', expression: '(q1 + q2) * (q3 - q4) / (q5 + 1)' }
      ];

      const answers: AnswerStore = {
        q1: 10,
        q2: 20,
        q3: 50,
        q4: 30,
        q5: 4
      };

      const results = formulaEngine.evaluateAll(formulas, answers);
      expect(results.length).toBe(1);
      expect(results[0].value).toBe(120);
    });

    it('should handle formulas with error in one formula', () => {
      const formulas: Formula[] = [
        { id: 'valid', expression: 'q1 + q2' },
        { id: 'invalid', expression: 'q1 >>>> 10' }
      ];

      const answers: AnswerStore = {
        q1: 5,
        q2: 10
      };

      const results = formulaEngine.evaluateAll(formulas, answers);
      expect(results.length).toBe(2);
      expect(results[0].error).toBeUndefined();
      expect(results[1].error).toBeDefined();
    });
  });

  describe('validateExpression Edge Cases', () => {
    it('should validate valid expression', () => {
      const isValid = formulaEngine.validateExpression('q1 + q2');
      expect(isValid).toBe(true);
    });

    it('should invalidate empty expression', () => {
      const isValid = formulaEngine.validateExpression('');
      expect(isValid).toBe(false);
    });

    it('should invalidate expression with invalid syntax', () => {
      const isValid = formulaEngine.validateExpression('q1 >>>> 10');
      expect(isValid).toBe(false);
    });

    it('should validate expression with nested parentheses', () => {
      const isValid = formulaEngine.validateExpression('((q1 + q2) * q3)');
      expect(isValid).toBe(true);
    });

    it('should invalidate expression with unmatched parentheses', () => {
      const isValid = formulaEngine.validateExpression('(q1 + q2');
      expect(isValid).toBe(false);
    });

    it('should validate expression with function calls', () => {
      const isValid = formulaEngine.validateExpression('sum(q1, q2, q3)');
      expect(isValid).toBe(true);
    });

    it('should validate expression with boolean operators', () => {
      const isValid = formulaEngine.validateExpression('q1 > 10 && q2 < 20');
      expect(isValid).toBe(true);
    });
  });

  describe('getReferencedFields Edge Cases', () => {
    it('should extract field references from simple expression', () => {
      const fields = formulaEngine.getReferencedFields('q1 + q2');
      expect(fields).toContain('q1');
      expect(fields).toContain('q2');
    });

    it('should extract field references from complex expression', () => {
      const fields = formulaEngine.getReferencedFields('(q1 + q2) * (q3 - q4) / q5');
      expect(fields.length).toBeGreaterThanOrEqual(5);
    });

    it('should not include function names in field references', () => {
      const fields = formulaEngine.getReferencedFields('sum(q1, q2)');
      expect(fields).toContain('q1');
      expect(fields).toContain('q2');
      expect(fields).not.toContain('sum');
    });

    it('should handle expression with no field references', () => {
      const fields = formulaEngine.getReferencedFields('10 + 20');
      expect(fields.length).toBe(0);
    });

    it('should handle expression with duplicate field references', () => {
      const fields = formulaEngine.getReferencedFields('q1 + q1 * q1');
      expect(fields).toContain('q1');
      expect(fields.filter(f => f === 'q1').length).toBeGreaterThan(0);
    });

    it('should handle expression with special characters in field names', () => {
      const fields = formulaEngine.getReferencedFields('q1_2 + q2-3');
      expect(fields.length).toBeGreaterThan(0);
    });
  });
});
