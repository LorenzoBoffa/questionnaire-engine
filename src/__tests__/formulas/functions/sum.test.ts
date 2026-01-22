import { describe, it, expect } from 'vitest';
import { createSumFunction } from '../../../formulas/functions/sum';
import type { EvaluationContext } from '../../../formulas/types';

describe('Sum Function', () => {
  const createContext = (answers: Record<string, any> = {}): EvaluationContext => ({
    answers,
    functions: {} as any,
  });

  it('should sum numeric values', () => {
    const sumFn = createSumFunction();
    const result = sumFn([10, 20, 30], createContext());

    expect(result).toBe(60);
  });

  it('should sum field references', () => {
    const sumFn = createSumFunction();
    const context = createContext({ q1: 10, q2: 20 });
    const result = sumFn(['q1', 'q2'], context);

    expect(result).toBe(30);
  });

  it('should handle null values (ignore them)', () => {
    const sumFn = createSumFunction();
    const result = sumFn([10, null, 20, null, 30], createContext());

    expect(result).toBe(60);
  });

  it('should handle undefined values (ignore them)', () => {
    const sumFn = createSumFunction();
    const result = sumFn([10, undefined, 20], createContext());

    expect(result).toBe(30);
  });

  it('should convert string numbers to numbers', () => {
    const sumFn = createSumFunction();
    const result = sumFn(['10', '20', '30'], createContext());

    expect(result).toBe(60);
  });

  it('should return 0 for empty arguments', () => {
    const sumFn = createSumFunction();
    const result = sumFn([], createContext());

    expect(result).toBe(0);
  });

  it('should handle mixed types', () => {
    const sumFn = createSumFunction();
    const context = createContext({ q1: 10 });
    const result = sumFn([5, '15', 'q1', 20], context);

    expect(result).toBe(50);
  });

  it('should handle decimal numbers', () => {
    const sumFn = createSumFunction();
    const result = sumFn([1.5, 2.5, 3.0], createContext());

    expect(result).toBe(7);
  });

  it('should ignore invalid string values', () => {
    const sumFn = createSumFunction();
    const context = createContext({ q1: 10 });
    const result = sumFn(['10', 'invalid', 'q1'], context);

    expect(result).toBe(20);
  });

  it('should handle field references that are numbers', () => {
    const sumFn = createSumFunction();
    const context = createContext({ q1: 42, q2: 58 });
    const result = sumFn(['q1', 'q2'], context);

    expect(result).toBe(100);
  });

  it('should handle field references that are string numbers', () => {
    const sumFn = createSumFunction();
    const context = createContext({ q1: '10', q2: '20' });
    const result = sumFn(['q1', 'q2'], context);

    expect(result).toBe(30);
  });

  it('should return 0 when no valid values', () => {
    const sumFn = createSumFunction();
    const result = sumFn(['invalid', 'also-invalid'], createContext());

    expect(result).toBe(0);
  });

  it('should handle negative numbers', () => {
    const sumFn = createSumFunction();
    const result = sumFn([10, -5, 20], createContext());

    expect(result).toBe(25);
  });
});
