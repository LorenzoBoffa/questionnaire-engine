import { describe, it, expect } from 'vitest';
import { createMinMaxValidator, validateMinMax } from '../../validation/minMaxValidator';
import { createTextQuestion, createNumberQuestion } from '../fixtures/helpers';
import type { ValidationRule } from '../../types/validation';

describe('MinMaxValidator', () => {
  describe('createMinMaxValidator', () => {
    it('should create a min/max validator', () => {
      const validator = createMinMaxValidator();

      expect(validator.canValidate({ type: 'min' } as ValidationRule)).toBe(true);
      expect(validator.canValidate({ type: 'max' } as ValidationRule)).toBe(true);
      expect(validator.canValidate({ type: 'minLength' } as ValidationRule)).toBe(true);
      expect(validator.canValidate({ type: 'maxLength' } as ValidationRule)).toBe(true);
      expect(validator.canValidate({ type: 'required' } as ValidationRule)).toBe(false);
    });
  });

  describe('validateMinMax - number constraints', () => {
    it('should validate number min constraint', () => {
      const rule: ValidationRule = { type: 'min', value: 18 };
      const question = createNumberQuestion({ id: 'q1' });
      const result = validateMinMax(25, rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should fail validation when number is below min', () => {
      const rule: ValidationRule = { type: 'min', value: 18 };
      const question = createNumberQuestion({ id: 'q1' });
      const result = validateMinMax(15, rule, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('min');
    });

    it('should pass validation when number equals min', () => {
      const rule: ValidationRule = { type: 'min', value: 18 };
      const question = createNumberQuestion({ id: 'q1' });
      const result = validateMinMax(18, rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should validate number max constraint', () => {
      const rule: ValidationRule = { type: 'max', value: 120 };
      const question = createNumberQuestion({ id: 'q1' });
      const result = validateMinMax(100, rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should fail validation when number exceeds max', () => {
      const rule: ValidationRule = { type: 'max', value: 120 };
      const question = createNumberQuestion({ id: 'q1' });
      const result = validateMinMax(150, rule, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('max');
    });

    it('should pass validation when number equals max', () => {
      const rule: ValidationRule = { type: 'max', value: 120 };
      const question = createNumberQuestion({ id: 'q1' });
      const result = validateMinMax(120, rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should convert string numbers to numbers', () => {
      const rule: ValidationRule = { type: 'min', value: 10 };
      const question = createNumberQuestion({ id: 'q1' });
      const result = validateMinMax('15', rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should handle decimal numbers', () => {
      const rule: ValidationRule = { type: 'min', value: 10 };
      const question = createNumberQuestion({ id: 'q1' });
      const result = validateMinMax(15.5, rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should return valid for null/undefined/empty values', () => {
      const rule: ValidationRule = { type: 'min', value: 10 };
      const question = createNumberQuestion({ id: 'q1' });

      expect(validateMinMax(null, rule, question).isValid).toBe(true);
      expect(validateMinMax(undefined, rule, question).isValid).toBe(true);
      expect(validateMinMax('', rule, question).isValid).toBe(true);
    });

    it('should return valid when rule value is undefined', () => {
      const rule: ValidationRule = { type: 'min' };
      const question = createNumberQuestion({ id: 'q1' });
      const result = validateMinMax(5, rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should use custom error message when provided', () => {
      const rule: ValidationRule = { type: 'min', value: 18, message: 'Must be at least 18' };
      const question = createNumberQuestion({ id: 'q1' });
      const result = validateMinMax(15, rule, question);

      expect(result.errors[0].message).toBe('Must be at least 18');
    });
  });

  describe('validateMinMax - text length constraints', () => {
    it('should validate text minLength constraint', () => {
      const rule: ValidationRule = { type: 'minLength', value: 5 };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateMinMax('Hello World', rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should fail validation when text is below minLength', () => {
      const rule: ValidationRule = { type: 'minLength', value: 5 };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateMinMax('Hi', rule, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('minLength');
    });

    it('should pass validation when text equals minLength', () => {
      const rule: ValidationRule = { type: 'minLength', value: 5 };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateMinMax('Hello', rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should validate text maxLength constraint', () => {
      const rule: ValidationRule = { type: 'maxLength', value: 10 };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateMinMax('Short', rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should fail validation when text exceeds maxLength', () => {
      const rule: ValidationRule = { type: 'maxLength', value: 10 };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateMinMax('This is too long', rule, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('maxLength');
    });

    it('should pass validation when text equals maxLength', () => {
      const rule: ValidationRule = { type: 'maxLength', value: 5 };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateMinMax('Hello', rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should convert numbers to strings for length validation', () => {
      const rule: ValidationRule = { type: 'minLength', value: 2 };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateMinMax(123, rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should use custom error message for length constraints', () => {
      const rule: ValidationRule = { type: 'minLength', value: 5, message: 'Too short' };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateMinMax('Hi', rule, question);

      expect(result.errors[0].message).toBe('Too short');
    });

    it('should fail validation for empty string with minLength', () => {
      const rule: ValidationRule = { type: 'minLength', value: 5 };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateMinMax('', rule, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('minLength');
    });

    it('should fail validation for null/undefined with minLength', () => {
      const rule: ValidationRule = { type: 'minLength', value: 5 };
      const question = createTextQuestion({ id: 'q1' });

      expect(validateMinMax(null, rule, question).isValid).toBe(false);
      expect(validateMinMax(undefined, rule, question).isValid).toBe(false);
    });
  });
});
