import { describe, it, expect } from 'vitest';
import { createRequiredValidator, validateRequired } from '../../validation/requiredValidator';
import { createTextQuestion } from '../fixtures/helpers';
import type { ValidationRule } from '../../types/validation';

describe('RequiredValidator', () => {
  describe('createRequiredValidator', () => {
    it('should create a required validator', () => {
      const validator = createRequiredValidator();

      expect(validator.type).toBe('required');
      expect(validator.canValidate({ type: 'required' } as ValidationRule)).toBe(true);
      expect(validator.canValidate({ type: 'min' } as ValidationRule)).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should validate required field with value', () => {
      const rule: ValidationRule = { type: 'required' };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateRequired('test value', rule, question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for required field without value (null)', () => {
      const rule: ValidationRule = { type: 'required' };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateRequired(null, rule, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('required');
      expect(result.errors[0].questionId).toBe('q1');
    });

    it('should fail validation for required field without value (undefined)', () => {
      const rule: ValidationRule = { type: 'required' };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateRequired(undefined, rule, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should fail validation for required field with empty string', () => {
      const rule: ValidationRule = { type: 'required' };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateRequired('', rule, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should fail validation for required field with whitespace-only string', () => {
      const rule: ValidationRule = { type: 'required' };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateRequired('   ', rule, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should pass validation for number value', () => {
      const rule: ValidationRule = { type: 'required' };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateRequired(42, rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should fail validation for NaN number', () => {
      const rule: ValidationRule = { type: 'required' };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateRequired(NaN, rule, question);

      expect(result.isValid).toBe(false);
    });

    it('should use custom error message when provided', () => {
      const rule: ValidationRule = { type: 'required', message: 'Custom required message' };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateRequired(null, rule, question);

      expect(result.errors[0].message).toBe('Custom required message');
    });

    it('should use default message when no custom message', () => {
      const rule: ValidationRule = { type: 'required' };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateRequired(null, rule, question);

      expect(result.errors[0].message).toBe('This field is required');
    });

    it('should return valid for non-required rule type', () => {
      const rule: ValidationRule = { type: 'min', value: 5 };
      const question = createTextQuestion({ id: 'q1' });
      const result = validateRequired('test', rule, question);

      expect(result.isValid).toBe(true);
    });

    it('should handle question without id', () => {
      const rule: ValidationRule = { type: 'required' };
      const result = validateRequired(null, rule);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].questionId).toBe('');
    });
  });
});
