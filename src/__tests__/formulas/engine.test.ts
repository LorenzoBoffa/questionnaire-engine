import { describe, it, expect } from 'vitest';
import { createFormulaEngine } from '../../formulas/engine';
import type { Formula } from '../../types/questionnaire';
import type { AnswerStore } from '../../types/answers';

describe('Formula Engine', () => {
  describe('evaluate', () => {
    it('should evaluate simple expression', () => {
      const engine = createFormulaEngine();
      const answers: AnswerStore = {};
      const result = engine.evaluate('10 + 20', answers);

      expect(result).toBe(30);
    });

    it('should evaluate expression with field references', () => {
      const engine = createFormulaEngine();
      const answers: AnswerStore = { q1: 10, q2: 20 };
      const result = engine.evaluate('q1 + q2', answers);

      expect(result).toBe(30);
    });

    it('should evaluate expression with functions', () => {
      const engine = createFormulaEngine();
      const answers: AnswerStore = { q1: 10, q2: 20 };
      const result = engine.evaluate('sum(q1, q2)', answers);

      expect(result).toBe(30);
    });
  });

  describe('evaluateFormula', () => {
    it('should evaluate formula and return result', () => {
      const engine = createFormulaEngine();
      const formula: Formula = {
        id: 'total',
        expression: 'sum(q1, q2)',
      };
      const answers: AnswerStore = { q1: 10, q2: 20 };
      const result = engine.evaluateFormula(formula, answers);

      expect(result.formulaId).toBe('total');
      expect(result.value).toBe(30);
      expect(result.error).toBeUndefined();
    });

    it('should handle formula errors gracefully', () => {
      const engine = createFormulaEngine();
      const formula: Formula = {
        id: 'invalid',
        expression: 'invalid expression +',
      };
      const answers: AnswerStore = {};
      const result = engine.evaluateFormula(formula, answers);

      expect(result.formulaId).toBe('invalid');
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('should convert boolean results to numbers', () => {
      const engine = createFormulaEngine();
      const formula: Formula = {
        id: 'check',
        expression: '10 > 5',
      };
      const answers: AnswerStore = {};
      const result = engine.evaluateFormula(formula, answers);

      expect(result.value).toBe(1);
    });
  });

  describe('evaluateAll', () => {
    it('should evaluate multiple formulas', () => {
      const engine = createFormulaEngine();
      const formulas: Formula[] = [
        { id: 'sum1', expression: 'sum(q1, q2)' },
        { id: 'sum2', expression: 'sum(q3, q4)' },
      ];
      const answers: AnswerStore = { q1: 10, q2: 20, q3: 5, q4: 15 };
      const results = engine.evaluateAll(formulas, answers);

      expect(results).toHaveLength(2);
      expect(results[0].formulaId).toBe('sum1');
      expect(results[0].value).toBe(30);
      expect(results[1].formulaId).toBe('sum2');
      expect(results[1].value).toBe(20);
    });

    it('should handle formulas with dependencies', () => {
      const engine = createFormulaEngine();
      const formulas: Formula[] = [
        { id: 'total', expression: 'sum(q1, q2)' },
        { id: 'double', expression: 'total * 2' },
      ];
      const answers: AnswerStore = { q1: 10, q2: 20 };
      const results = engine.evaluateAll(formulas, answers);

      expect(results).toHaveLength(2);
      expect(results[0].formulaId).toBe('total');
      expect(results[0].value).toBe(30);
      expect(results[1].formulaId).toBe('double');
      expect(results[1].value).toBe(60);
    });

    it('should return empty array for empty formulas', () => {
      const engine = createFormulaEngine();
      const results = engine.evaluateAll([], {});

      expect(results).toHaveLength(0);
    });

    it('should handle formula errors in evaluateAll', () => {
      const engine = createFormulaEngine();
      const formulas: Formula[] = [
        { id: 'valid', expression: '10 + 20' },
        { id: 'invalid', expression: 'invalid +' },
      ];
      const answers: AnswerStore = {};
      const results = engine.evaluateAll(formulas, answers);

      expect(results).toHaveLength(2);
      expect(results[0].value).toBe(30);
      expect(results[1].value).toBe(0);
      expect(results[1].error).toBeDefined();
    });
  });

  describe('validateExpression', () => {
    it('should validate valid expression', () => {
      const engine = createFormulaEngine();
      const isValid = engine.validateExpression('10 + 20');

      expect(isValid).toBe(true);
    });

    it('should invalidate expression with syntax error', () => {
      const engine = createFormulaEngine();
      const isValid = engine.validateExpression('10 +');

      expect(isValid).toBe(false);
    });

    it('should validate expression with functions', () => {
      const engine = createFormulaEngine();
      const isValid = engine.validateExpression('sum(q1, q2)');

      expect(isValid).toBe(true);
    });
  });

  describe('getReferencedFields', () => {
    it('should extract field references from expression', () => {
      const engine = createFormulaEngine();
      const fields = engine.getReferencedFields('q1 + q2 * q3');

      expect(fields).toContain('q1');
      expect(fields).toContain('q2');
      expect(fields).toContain('q3');
    });

    it('should not include function names as field references', () => {
      const engine = createFormulaEngine();
      const fields = engine.getReferencedFields('sum(q1, q2)');

      expect(fields).toContain('q1');
      expect(fields).toContain('q2');
      expect(fields).not.toContain('sum');
    });

    it('should return empty array for expression with no field references', () => {
      const engine = createFormulaEngine();
      const fields = engine.getReferencedFields('10 + 20');

      expect(fields).toHaveLength(0);
    });

    it('should handle field references with underscores and hyphens', () => {
      const engine = createFormulaEngine();
      const fields = engine.getReferencedFields('field-1 + field_2');

      expect(fields).toContain('field-1');
      expect(fields).toContain('field_2');
    });
  });
});
