import { describe, it, expect } from 'vitest';
import { createNumberQuestion, validateNumberQuestion, getNumberQuestionDefaultValue, serializeNumberQuestion } from '../../questions/numberQuestion';
import { createNumberQuestion as createTestNumberQuestion } from '../fixtures/helpers';
import type { NumberQuestion } from '../../types/questions';

describe('NumberQuestion', () => {
  describe('createNumberQuestion', () => {
    it('should create a number question with valid data', () => {
      const questionData = createTestNumberQuestion({
        id: 'q1',
        label: 'What is your age?',
      });

      const question = createNumberQuestion(questionData);

      expect(question.id).toBe('q1');
      expect(question.type).toBe('number');
      expect(question.label).toBe('What is your age?');
      expect(question.required).toBe(false);
      expect(question.visible).toBe(true);
    });

    it('should set required to true when specified', () => {
      const questionData = createTestNumberQuestion({ required: true });
      const question = createNumberQuestion(questionData);

      expect(question.required).toBe(true);
    });

    it('should throw error for invalid question type', () => {
      const invalidData = { id: 'q1', type: 'text', label: 'Test' } as any;

      expect(() => createNumberQuestion(invalidData)).toThrow('Invalid question type for NumberQuestion');
    });
  });

  describe('validateNumberQuestion', () => {
    it('should validate required field with value', () => {
      const question = createTestNumberQuestion({ id: 'q1', required: true });
      const result = validateNumberQuestion(25, question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for required field without value', () => {
      const question = createTestNumberQuestion({ id: 'q1', required: true });
      const result = validateNumberQuestion(null, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('required');
    });

    it('should pass validation for optional field without value', () => {
      const question = createTestNumberQuestion({ id: 'q1', required: false });
      const result = validateNumberQuestion(null, question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate numeric input', () => {
      const question = createTestNumberQuestion({ id: 'q1' });
      const result = validateNumberQuestion(42, question);

      expect(result.isValid).toBe(true);
    });

    it('should convert string numbers to numbers', () => {
      const question = createTestNumberQuestion({ id: 'q1' });
      const result = validateNumberQuestion('42', question);

      expect(result.isValid).toBe(true);
    });

    it('should fail validation for invalid non-numeric input', () => {
      const question = createTestNumberQuestion({ id: 'q1' });
      const result = validateNumberQuestion('not a number', question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Invalid number');
    });

    it('should validate min constraint', () => {
      const question = createTestNumberQuestion({
        id: 'q1',
        min: 18,
        validation: [{ type: 'min', value: 18 }],
      });
      const result = validateNumberQuestion(15, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('min');
    });

    it('should pass validation when value meets min', () => {
      const question = createTestNumberQuestion({
        id: 'q1',
        min: 18,
      });
      const result = validateNumberQuestion(18, question);

      expect(result.isValid).toBe(true);
    });

    it('should validate max constraint', () => {
      const question = createTestNumberQuestion({
        id: 'q1',
        max: 120,
        validation: [{ type: 'max', value: 120 }],
      });
      const result = validateNumberQuestion(150, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('max');
    });

    it('should pass validation when value meets max', () => {
      const question = createTestNumberQuestion({
        id: 'q1',
        max: 120,
      });
      const result = validateNumberQuestion(120, question);

      expect(result.isValid).toBe(true);
    });

    it('should handle decimal numbers', () => {
      const question = createTestNumberQuestion({ id: 'q1' });
      const result = validateNumberQuestion(3.14, question);

      expect(result.isValid).toBe(true);
    });

    it('should handle min and max together', () => {
      const question = createTestNumberQuestion({
        id: 'q1',
        min: 18,
        max: 120,
        validation: [
          { type: 'min', value: 18 },
          { type: 'max', value: 120 },
        ],
      });
      const result = validateNumberQuestion(25, question);

      expect(result.isValid).toBe(true);
    });

    it('should use custom error message when provided', () => {
      const question = createTestNumberQuestion({
        id: 'q1',
        required: true,
        validation: [{ type: 'required', message: 'Age is required' }],
      });
      const result = validateNumberQuestion(null, question);

      expect(result.errors[0].message).toBe('Age is required');
    });
  });

  describe('getNumberQuestionDefaultValue', () => {
    it('should return default value when set', () => {
      const question = createTestNumberQuestion({ defaultValue: 42 });
      const defaultValue = getNumberQuestionDefaultValue(question);

      expect(defaultValue).toBe(42);
    });

    it('should return undefined when no default value', () => {
      const question = createTestNumberQuestion();
      const defaultValue = getNumberQuestionDefaultValue(question);

      expect(defaultValue).toBeUndefined();
    });
  });

  describe('serializeNumberQuestion', () => {
    it('should serialize question correctly', () => {
      const questionData = createTestNumberQuestion({
        id: 'q1',
        label: 'Test Question',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        required: true,
        visible: false,
        validation: [{ type: 'min', value: 0 }],
      });
      const question = createNumberQuestion(questionData);
      const serialized = serializeNumberQuestion(question, questionData);

      expect(serialized.id).toBe('q1');
      expect(serialized.type).toBe('number');
      expect(serialized.label).toBe('Test Question');
      expect(serialized.min).toBe(0);
      expect(serialized.max).toBe(100);
      expect(serialized.step).toBe(1);
      expect(serialized.defaultValue).toBe(50);
      expect(serialized.required).toBe(true);
      expect(serialized.visible).toBe(false);
    });
  });
});
