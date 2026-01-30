import { describe, it, expect } from 'vitest';
import {
  createMultiSelectQuestion,
  validateMultiSelectQuestion,
  getMultiSelectQuestionDefaultValue,
  serializeMultiSelectQuestion,
  getMultiSelectOptions,
  isValidMultiSelectOption,
} from '../../questions/multiSelectQuestion';
import { createMultiSelectQuestion as createTestMultiSelectQuestion } from '../fixtures/helpers';
import type { MultiSelectQuestion } from '../../types/questions';

describe('MultiSelectQuestion', () => {
  describe('createMultiSelectQuestion', () => {
    it('should create a multi-select question with valid data', () => {
      const questionData = createTestMultiSelectQuestion({
        id: 'q1',
        label: 'Select options',
        options: ['Option A', 'Option B', 'Option C'],
      });

      const question = createMultiSelectQuestion(questionData);

      expect(question.id).toBe('q1');
      expect(question.type).toBe('multi-select');
      expect(question.label).toBe('Select options');
      expect(question.required).toBe(false);
      expect(question.visible).toBe(true);
    });

    it('should throw error when options array is empty', () => {
      const questionData = createTestMultiSelectQuestion({
        id: 'q1',
        options: [],
      });

      expect(() => createMultiSelectQuestion(questionData)).toThrow(
        'MultiSelectQuestion must have at least one option'
      );
    });

    it('should throw error for invalid question type', () => {
      const invalidData = { id: 'q1', type: 'text', label: 'Test', options: ['A'] } as any;

      expect(() => createMultiSelectQuestion(invalidData)).toThrow('Invalid question type for MultiSelectQuestion');
    });
  });

  describe('validateMultiSelectQuestion', () => {
    it('should validate required field with at least one value', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        required: true,
        options: ['Option A', 'Option B'],
      });
      const result = validateMultiSelectQuestion(['Option A'], question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for required field without value', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        required: true,
        options: ['Option A', 'Option B'],
      });
      const result = validateMultiSelectQuestion([], question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('required');
    });

    it('should fail validation for required field with null', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        required: true,
        options: ['Option A', 'Option B'],
      });
      const result = validateMultiSelectQuestion(null, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should pass validation for optional field without value', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        required: false,
        options: ['Option A', 'Option B'],
      });
      const result = validateMultiSelectQuestion([], question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate selected options exist in options list', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        options: ['Option A', 'Option B'],
      });
      const result = validateMultiSelectQuestion(['Option A', 'Option B'], question);

      expect(result.isValid).toBe(true);
    });

    it('should fail validation for invalid option selection', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        options: ['Option A', 'Option B'],
      });
      const result = validateMultiSelectQuestion(['Invalid Option'], question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Invalid option selected');
    });

    it('should normalize single value to array', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        options: ['Option A', 'Option B'],
      });
      const result = validateMultiSelectQuestion('Option A', question);

      expect(result.isValid).toBe(true);
    });

    it('should enforce minSelections', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        options: ['A', 'B', 'C'],
        minSelections: 2,
      });
      const result = validateMultiSelectQuestion(['A'], question);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('At least 2'))).toBe(true);
      expect(result.errors.some(e => e.rule === 'minSelections')).toBe(true);
    });

    it('should enforce maxSelections', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        options: ['A', 'B', 'C'],
        maxSelections: 2,
      });
      const result = validateMultiSelectQuestion(['A', 'B', 'C'], question);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('At most 2'))).toBe(true);
      expect(result.errors.some(e => e.rule === 'maxSelections')).toBe(true);
    });

    it('should enforce minSelections from validation array only (no direct props)', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        options: ['A', 'B', 'C'],
        validation: [{ type: 'minSelections', value: 2 }],
      });
      const result = validateMultiSelectQuestion(['A'], question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('minSelections');
      expect(result.errors[0].message).toContain('At least 2');
    });

    it('should enforce maxSelections from validation array only (no direct props)', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        options: ['A', 'B', 'C'],
        validation: [{ type: 'maxSelections', value: 2 }],
      });
      const result = validateMultiSelectQuestion(['A', 'B', 'C'], question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('maxSelections');
      expect(result.errors[0].message).toContain('At most 2');
    });

    it('should use direct props when validation array does not contain rule (fallback)', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        options: ['A', 'B', 'C'],
        minSelections: 2,
      });
      const result = validateMultiSelectQuestion(['A'], question);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.rule === 'minSelections')).toBe(true);
    });

    it('should prefer validation array over direct props when both present', () => {
      const question = createTestMultiSelectQuestion({
        id: 'q1',
        options: ['A', 'B', 'C'],
        minSelections: 1,
        validation: [{ type: 'minSelections', value: 3, message: 'Pick at least 3' }],
      });
      const result = validateMultiSelectQuestion(['A', 'B'], question);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].rule).toBe('minSelections');
      expect(result.errors[0].message).toBe('Pick at least 3');
    });
  });

  describe('getMultiSelectQuestionDefaultValue', () => {
    it('should return default value when set', () => {
      const question = createTestMultiSelectQuestion({
        defaultValue: ['Option A', 'Option B'],
        options: ['Option A', 'Option B', 'Option C'],
      });
      const defaultValue = getMultiSelectQuestionDefaultValue(question);

      expect(defaultValue).toEqual(['Option A', 'Option B']);
    });

    it('should return empty array when no default value', () => {
      const question = createTestMultiSelectQuestion({
        options: ['Option A', 'Option B'],
      });
      const defaultValue = getMultiSelectQuestionDefaultValue(question);

      expect(defaultValue).toEqual([]);
    });
  });

  describe('getMultiSelectOptions', () => {
    it('should return options list', () => {
      const questionData = createTestMultiSelectQuestion({
        options: ['Option A', 'Option B', 'Option C'],
      });
      const question = createMultiSelectQuestion(questionData);
      const options = getMultiSelectOptions(question);

      expect(options).toEqual(['Option A', 'Option B', 'Option C']);
    });

    it('should throw error for non-multi-select question', () => {
      const question = {
        id: 'q1',
        type: 'text',
        label: 'Test',
        serialize: () => ({ id: 'q1', type: 'text', label: 'Test' }),
      } as any;

      expect(() => getMultiSelectOptions(question)).toThrow('Question is not a multi-select question');
    });
  });

  describe('isValidMultiSelectOption', () => {
    it('should return true for valid option', () => {
      const question = createTestMultiSelectQuestion({
        options: ['Option A', 'Option B'],
      });
      const isValid = isValidMultiSelectOption('Option A', question);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid option', () => {
      const question = createTestMultiSelectQuestion({
        options: ['Option A', 'Option B'],
      });
      const isValid = isValidMultiSelectOption('Invalid', question);

      expect(isValid).toBe(false);
    });
  });

  describe('serializeMultiSelectQuestion', () => {
    it('should serialize question correctly', () => {
      const questionData = createTestMultiSelectQuestion({
        id: 'q1',
        label: 'Test Question',
        options: ['Option A', 'Option B'],
        defaultValue: ['Option A'],
        minSelections: 1,
        maxSelections: 2,
        required: true,
        visible: false,
      });
      const question = createMultiSelectQuestion(questionData);
      const serialized = serializeMultiSelectQuestion(question, questionData);

      expect(serialized.id).toBe('q1');
      expect(serialized.type).toBe('multi-select');
      expect(serialized.label).toBe('Test Question');
      if (serialized.type === 'multi-select') {
        expect(serialized.options).toEqual(['Option A', 'Option B']);
        expect(serialized.defaultValue).toEqual(['Option A']);
        expect(serialized.minSelections).toBe(1);
        expect(serialized.maxSelections).toBe(2);
      }
      expect(serialized.required).toBe(true);
      expect(serialized.visible).toBe(false);
    });
  });
});
