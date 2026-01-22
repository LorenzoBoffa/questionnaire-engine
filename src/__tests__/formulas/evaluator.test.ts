import { describe, it, expect } from 'vitest';
import { createExpressionEvaluator } from '../../formulas/evaluator';
import { createFunctionRegistry } from '../../formulas/registry';
import type { EvaluationContext } from '../../formulas/types';

describe('Expression Evaluator', () => {
  const createContext = (answers: Record<string, any> = {}): EvaluationContext => ({
    answers,
    functions: {
      register: () => {},
      get: () => undefined,
      call: () => 0,
      getRegistered: () => [],
    },
  });

  describe('Simple Expressions', () => {
    it('should evaluate simple numeric literal', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('42', createContext());

      expect(result).toBe(42);
    });

    it('should evaluate decimal numbers', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('3.14', createContext());

      expect(result).toBe(3.14);
    });

    it('should evaluate negative numbers', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('-10', createContext());

      expect(result).toBe(-10);
    });
  });

  describe('Field References', () => {
    it('should evaluate field reference', () => {
      const evaluator = createExpressionEvaluator();
      const context = createContext({ q1: 42 });
      const result = evaluator.evaluate('q1', context);

      expect(result).toBe(42);
    });

    it('should return null for non-existent field', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('nonexistent', createContext());

      expect(result).toBe(null);
    });

    it('should handle field references with underscores and hyphens', () => {
      const evaluator = createExpressionEvaluator();
      const context = createContext({ 'field-1': 10, field_2: 20 });
      const result1 = evaluator.evaluate('field-1', context);
      const result2 = evaluator.evaluate('field_2', context);

      expect(result1).toBe(10);
      expect(result2).toBe(20);
    });
  });

  describe('Function Calls', () => {
    it('should evaluate function call', () => {
      const evaluator = createExpressionEvaluator();
      const functionRegistry = createFunctionRegistry();
      const context: EvaluationContext = {
        answers: {},
        functions: functionRegistry,
      };
      const result = evaluator.evaluate('sum(10, 20, 30)', context);

      expect(result).toBe(60);
    });

    it('should handle function with field references', () => {
      const evaluator = createExpressionEvaluator();
      const functionRegistry = createFunctionRegistry();
      const context: EvaluationContext = {
        answers: { q1: 10, q2: 20 },
        functions: functionRegistry,
      };
      const result = evaluator.evaluate('sum(q1, q2)', context);

      expect(result).toBe(30);
    });

    it('should handle function with no arguments', () => {
      const evaluator = createExpressionEvaluator();
      const functionRegistry = createFunctionRegistry();
      functionRegistry.register('zero', () => 0);
      const context: EvaluationContext = {
        answers: {},
        functions: functionRegistry,
      };
      const result = evaluator.evaluate('zero()', context);

      expect(result).toBe(0);
    });
  });

  describe('Binary Operations', () => {
    it('should evaluate addition', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('10 + 20', createContext());

      expect(result).toBe(30);
    });

    it('should evaluate subtraction', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('30 - 10', createContext());

      expect(result).toBe(20);
    });

    it('should evaluate multiplication', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('5 * 6', createContext());

      expect(result).toBe(30);
    });

    it('should evaluate division', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('20 / 4', createContext());

      expect(result).toBe(5);
    });

    it('should evaluate greater than', () => {
      const evaluator = createExpressionEvaluator();
      const result1 = evaluator.evaluate('10 > 5', createContext());
      const result2 = evaluator.evaluate('5 > 10', createContext());

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should evaluate less than', () => {
      const evaluator = createExpressionEvaluator();
      const result1 = evaluator.evaluate('5 < 10', createContext());
      const result2 = evaluator.evaluate('10 < 5', createContext());

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should evaluate greater than or equal', () => {
      const evaluator = createExpressionEvaluator();
      const result1 = evaluator.evaluate('10 >= 10', createContext());
      const result2 = evaluator.evaluate('10 >= 5', createContext());
      const result3 = evaluator.evaluate('5 >= 10', createContext());

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(false);
    });

    it('should evaluate less than or equal', () => {
      const evaluator = createExpressionEvaluator();
      const result1 = evaluator.evaluate('10 <= 10', createContext());
      const result2 = evaluator.evaluate('5 <= 10', createContext());
      const result3 = evaluator.evaluate('10 <= 5', createContext());

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(false);
    });

    it('should evaluate equality', () => {
      const evaluator = createExpressionEvaluator();
      const result1 = evaluator.evaluate('10 == 10', createContext());
      const result2 = evaluator.evaluate('10 == 5', createContext());

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should evaluate inequality', () => {
      const evaluator = createExpressionEvaluator();
      const result1 = evaluator.evaluate('10 != 5', createContext());
      const result2 = evaluator.evaluate('10 != 10', createContext());

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should evaluate logical AND with boolean literals', () => {
      const evaluator = createExpressionEvaluator();
      const result1 = evaluator.evaluate('true && true', createContext());
      const result2 = evaluator.evaluate('true && false', createContext());

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('should evaluate logical OR with boolean literals', () => {
      const evaluator = createExpressionEvaluator();
      const result1 = evaluator.evaluate('false || true', createContext());
      const result2 = evaluator.evaluate('false || false', createContext());

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe('Unary Operations', () => {
    it('should evaluate unary minus', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('-10', createContext());

      expect(result).toBe(-10);
    });

    it('should evaluate unary minus', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('-10', createContext());

      expect(result).toBe(-10);
    });
  });

  describe('Operator Precedence', () => {
    it('should respect multiplication precedence over addition', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('2 + 3 * 4', createContext());

      expect(result).toBe(14);
    });

    it('should respect parentheses', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('(2 + 3) * 4', createContext());

      expect(result).toBe(20);
    });

    it('should handle nested parentheses', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('((2 + 3) * 4) / 2', createContext());

      expect(result).toBe(10);
    });
  });

  describe('Complex Expressions', () => {
    it('should evaluate complex expression with multiple operations', () => {
      const evaluator = createExpressionEvaluator();
      const context = createContext({ q1: 10, q2: 20 });
      const result = evaluator.evaluate('q1 + q2 * 2', context);

      expect(result).toBe(50);
    });

    it('should evaluate expression with comparisons', () => {
      const evaluator = createExpressionEvaluator();
      const context = createContext({ age: 25 });
      const result = evaluator.evaluate('age >= 18', context);

      expect(result).toBe(true);
    });

    it('should evaluate expression with logical operators', () => {
      const evaluator = createExpressionEvaluator();
      const context = createContext({ q1: 10, q2: 20 });
      const result = evaluator.evaluate('q1 > 5 && q2 < 30', context);

      expect(result).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate valid expression', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.validate('10 + 20');

      expect(result.isValid).toBe(true);
    });

    it('should invalidate expression with syntax error', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.validate('10 +');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should invalidate expression with unmatched parentheses', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.validate('(10 + 20');

      expect(result.isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid expressions gracefully', () => {
      const evaluator = createExpressionEvaluator();
      
      expect(() => evaluator.evaluate('10 +', createContext())).toThrow();
    });

    it('should handle division by zero gracefully', () => {
      const evaluator = createExpressionEvaluator();
      const result = evaluator.evaluate('10 / 0', createContext());

      expect(result).toBe(Infinity);
    });
  });
});
