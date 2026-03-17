import { describe, it, expect } from 'vitest';
import { createExpressionEvaluator } from '../../formulas/evaluator';
import type { EvaluationContext } from '../../formulas/types';
import { createFunctionRegistry } from '../../formulas/registry';
import { extractFieldReferences } from '../../formulas/utils';

function makeContext(answers: Record<string, unknown>): EvaluationContext {
  return {
    answers: answers as any,
    functions: createFunctionRegistry(),
  };
}

const evaluator = createExpressionEvaluator();

describe('includes operator', () => {
  // ── Basic lookup ────────────────────────────────────────────────────────────

  it('returns true when array contains the value', () => {
    const ctx = makeContext({ tags: ['a', 'b'] });
    expect(evaluator.evaluate("tags includes 'a'", ctx)).toBe(true);
  });

  it('returns false when array does not contain the value', () => {
    const ctx = makeContext({ tags: ['a', 'b'] });
    expect(evaluator.evaluate("tags includes 'c'", ctx)).toBe(false);
  });

  it('returns false for an empty array', () => {
    const ctx = makeContext({ tags: [] });
    expect(evaluator.evaluate("tags includes 'a'", ctx)).toBe(false);
  });

  it('matches the last item in the array', () => {
    const ctx = makeContext({ tags: ['x', 'y', 'z'] });
    expect(evaluator.evaluate("tags includes 'z'", ctx)).toBe(true);
  });

  it('returns true for a single-element array that matches', () => {
    const ctx = makeContext({ tags: ['only'] });
    expect(evaluator.evaluate("tags includes 'only'", ctx)).toBe(true);
  });

  it('returns false for a single-element array that does not match', () => {
    const ctx = makeContext({ tags: ['only'] });
    expect(evaluator.evaluate("tags includes 'other'", ctx)).toBe(false);
  });

  it('returns true for a duplicate-value array', () => {
    const ctx = makeContext({ tags: ['a', 'a', 'a'] });
    expect(evaluator.evaluate("tags includes 'a'", ctx)).toBe(true);
  });

  // ── String matching semantics ───────────────────────────────────────────────

  it('is case-sensitive — uppercase value does not match lowercase entry', () => {
    const ctx = makeContext({ tags: ['apple'] });
    expect(evaluator.evaluate("tags includes 'Apple'", ctx)).toBe(false);
  });

  it('is case-sensitive — lowercase value does not match uppercase entry', () => {
    const ctx = makeContext({ tags: ['Apple'] });
    expect(evaluator.evaluate("tags includes 'apple'", ctx)).toBe(false);
  });

  it('does not perform substring matching — partial prefix does not match', () => {
    const ctx = makeContext({ tags: ['foobar'] });
    expect(evaluator.evaluate("tags includes 'foo'", ctx)).toBe(false);
  });

  it('does not perform substring matching — partial suffix does not match', () => {
    const ctx = makeContext({ tags: ['foobar'] });
    expect(evaluator.evaluate("tags includes 'bar'", ctx)).toBe(false);
  });

  it('matches a value that contains spaces', () => {
    const ctx = makeContext({ tags: ['hello world', 'other'] });
    expect(evaluator.evaluate("tags includes 'hello world'", ctx)).toBe(true);
  });

  it('matches an empty string entry when searching for empty string', () => {
    const ctx = makeContext({ tags: ['', 'a'] });
    expect(evaluator.evaluate("tags includes ''", ctx)).toBe(true);
  });

  it('does not match an empty string when array has no empty entries', () => {
    const ctx = makeContext({ tags: ['a', 'b'] });
    expect(evaluator.evaluate("tags includes ''", ctx)).toBe(false);
  });

  // ── Wrong answer types ──────────────────────────────────────────────────────

  it('returns false when answer is null', () => {
    const ctx = makeContext({ tags: null });
    expect(evaluator.evaluate("tags includes 'a'", ctx)).toBe(false);
  });

  it('returns false when answer is undefined', () => {
    const ctx = makeContext({});
    expect(evaluator.evaluate("tags includes 'a'", ctx)).toBe(false);
  });

  it('returns false when answer is a scalar string (not an array)', () => {
    const ctx = makeContext({ tags: 'a' });
    expect(evaluator.evaluate("tags includes 'a'", ctx)).toBe(false);
  });

  it('returns false when answer is a number', () => {
    const ctx = makeContext({ tags: 42 });
    expect(evaluator.evaluate("tags includes 'a'", ctx)).toBe(false);
  });

  it('returns false when answer is a boolean', () => {
    const ctx = makeContext({ tags: true });
    expect(evaluator.evaluate("tags includes 'a'", ctx)).toBe(false);
  });

  it('returns false when right-hand side is a number literal', () => {
    // typeof right !== 'string' guard
    const ctx = makeContext({ tags: ['1', '2'] });
    expect(evaluator.evaluate('tags includes 1', ctx)).toBe(false);
  });

  // ── Negation ────────────────────────────────────────────────────────────────

  it('! negation returns true when value is absent', () => {
    const ctx = makeContext({ tags: ['a', 'b'] });
    expect(evaluator.evaluate("!(tags includes 'c')", ctx)).toBe(true);
  });

  it('! negation returns false when value is present', () => {
    const ctx = makeContext({ tags: ['a', 'b'] });
    expect(evaluator.evaluate("!(tags includes 'a')", ctx)).toBe(false);
  });

  // ── Logical composition ─────────────────────────────────────────────────────

  it('composes with && — both sides true', () => {
    const ctx = makeContext({ tags: ['a', 'b'], other: ['x'] });
    expect(evaluator.evaluate("tags includes 'a' && other includes 'x'", ctx)).toBe(true);
  });

  it('composes with && — one side false', () => {
    const ctx = makeContext({ tags: ['a', 'b'], other: ['x'] });
    expect(evaluator.evaluate("tags includes 'a' && other includes 'y'", ctx)).toBe(false);
  });

  it('composes with && — both sides false', () => {
    const ctx = makeContext({ tags: ['a'] });
    expect(evaluator.evaluate("tags includes 'x' && tags includes 'y'", ctx)).toBe(false);
  });

  it('composes with || — left false, right true', () => {
    const ctx = makeContext({ tags: ['a'] });
    expect(evaluator.evaluate("tags includes 'z' || tags includes 'a'", ctx)).toBe(true);
  });

  it('composes with || — both false', () => {
    const ctx = makeContext({ tags: ['a'] });
    expect(evaluator.evaluate("tags includes 'x' || tags includes 'y'", ctx)).toBe(false);
  });

  it('composes with || — left true short-circuits', () => {
    const ctx = makeContext({ tags: ['a'] });
    expect(evaluator.evaluate("tags includes 'a' || tags includes 'missing'", ctx)).toBe(true);
  });

  // ── Mixed with other operators ──────────────────────────────────────────────

  it('mixes with == comparison — both true', () => {
    const ctx = makeContext({ tags: ['a', 'b'], score: 5 });
    expect(evaluator.evaluate("tags includes 'a' && score == 5", ctx)).toBe(true);
  });

  it('mixes with == comparison — includes false', () => {
    const ctx = makeContext({ tags: ['a'], score: 5 });
    expect(evaluator.evaluate("tags includes 'z' && score == 5", ctx)).toBe(false);
  });

  it('mixes with numeric > comparison', () => {
    const ctx = makeContext({ tags: ['a'], score: 10 });
    expect(evaluator.evaluate("score > 3 && tags includes 'a'", ctx)).toBe(true);
  });

  it('result can be compared with == true', () => {
    const ctx = makeContext({ tags: ['a'] });
    // booleans are equal when both true
    expect(evaluator.evaluate("(tags includes 'a') == true", ctx)).toBe(true);
  });

  it('result can be compared with == false', () => {
    const ctx = makeContext({ tags: ['a'] });
    expect(evaluator.evaluate("(tags includes 'z') == false", ctx)).toBe(true);
  });

  // ── Array in numeric context (toNum) ────────────────────────────────────────

  it('array answer used as a number equals its length', () => {
    const ctx = makeContext({ tags: ['a', 'b'] });
    expect(evaluator.evaluate('tags + 0', ctx)).toBe(2);
  });

  it('empty array used as a number equals 0', () => {
    const ctx = makeContext({ tags: [] });
    expect(evaluator.evaluate('tags + 0', ctx)).toBe(0);
  });

  it('array length can be compared with >', () => {
    const ctx = makeContext({ tags: ['a', 'b', 'c'] });
    expect(evaluator.evaluate('tags > 2', ctx)).toBe(true);
  });

  // ── Syntax variants ─────────────────────────────────────────────────────────

  it('double-quoted right-hand side', () => {
    const ctx = makeContext({ tags: ['hello'] });
    expect(evaluator.evaluate('tags includes "hello"', ctx)).toBe(true);
  });

  it('no space between includes and the quote', () => {
    const ctx = makeContext({ tags: ['a'] });
    expect(evaluator.evaluate("tags includes'a'", ctx)).toBe(true);
  });

  it('extra whitespace around includes', () => {
    const ctx = makeContext({ tags: ['a'] });
    expect(evaluator.evaluate("tags  includes  'a'", ctx)).toBe(true);
  });

  // ── Parser: keyword boundary ────────────────────────────────────────────────

  it('a field named "includesX" is not treated as the includes keyword', () => {
    // "includesX" is a longer identifier — the boundary check prevents misparse
    const ctx = makeContext({ tags: ['a'], includesX: ['b'] });
    // This expression: tags == tags (trivially true) — the point is it parses without error
    expect(evaluator.evaluate("includesX includes 'b'", ctx)).toBe(true);
  });

  // ── extractFieldReferences ──────────────────────────────────────────────────

  it('extractFieldReferences does not return "includes" as a field ref', () => {
    const refs = extractFieldReferences("tags includes 'a'");
    expect(refs).not.toContain('includes');
    expect(refs).toContain('tags');
  });

  it('extractFieldReferences handles compound expressions without leaking "includes"', () => {
    const refs = extractFieldReferences("tags includes 'a' && other includes 'b'");
    expect(refs).not.toContain('includes');
    expect(refs).toContain('tags');
    expect(refs).toContain('other');
  });
});
