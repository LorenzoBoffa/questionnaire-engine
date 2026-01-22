import { describe, it, expect } from 'vitest';
import {
  createMultipleChoiceQuestion,
  validateMultipleChoiceQuestion,
  getMultipleChoiceQuestionDefaultValue,
  serializeMultipleChoiceQuestion,
  getMultipleChoiceOptions,
  isValidMultipleChoiceOption,
} from '../../questions/multipleChoiceQuestion';
import { createMultipleChoiceQuestion as createTestMultipleChoiceQuestion } from '../fixtures/helpers';
import type { MultipleChoiceQuestion } from '../../types/questions';

describe('MultipleChoiceQuestion', () => {
  describe('createMultipleChoiceQuestion', () => {
    it('should create a multiple choice question with valid data', () => {
      const questionData = createTestMultipleChoiceQuestion({
        id: 'q1',
        label: 'Select an option',
        options: ['Option A', 'Option B', 'Option C'],
      });

      const question = createMultipleChoiceQuestion(questionData);

      expect(question.id).toBe('q1');
      expect(question.type).toBe('multiple-choice');
      expect(question.label).toBe('Select an option');
      expect(question.required).toBe(false);
      expect(question.visible).toBe(true);
    });

    it('should throw error when options array is empty', () => {
      const questionData = createTestMultipleChoiceQuestion({
        id: 'q1',
        options: [],
      });

      expect(() => createMultipleChoiceQuestion(questionData)).toThrow(
        'MultipleChoiceQuestion must have at least one option'
      );
    });

    it('should throw error for invalid question type', () => {
      const invalidData = { id: 'q1', type: 'text', label: 'Test', options: ['A'] } as any;

      expect(() => createMultipleChoiceQuestion(invalidData)).toThrow('Invalid question type for MultipleChoiceQuestion');
    });
  });

  describe('validateMultipleChoiceQuestion', () => {
    it('should validate required field with value', () => {
      const question = createTestMultipleChoiceQuestion({
        id: 'q1',
        required: true,
        options: ['Option A', 'Option B'],
      });
      const result = validateMultipleChoiceQuestion('Option A', question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for required field without value', () => {
      const question = createTestMultipleChoiceQuestion({
        id: 'q1',
        required: true,
        options: ['Option A', 'Option B'],
      });
      const result = validateMultipleChoiceQuestion(null, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('required');
    });

    it('should pass validation for optional field without value', () => {
      const question = createTestMultipleChoiceQuestion({
        id: 'q1',
        required: false,
        options: ['Option A', 'Option B'],
      });
      const result = validateMultipleChoiceQuestion(null, question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate selected option exists in options list', () => {
      const question = createTestMultipleChoiceQuestion({
        id: 'q1',
        options: ['Option A', 'Option B'],
      });
      const result = validateMultipleChoiceQuestion('Option A', question);

      expect(result.isValid).toBe(true);
    });

    it('should fail validation for invalid option selection', () => {
      const question = createTestMultipleChoiceQuestion({
        id: 'q1',
        options: ['Option A', 'Option B'],
      });
      const result = validateMultipleChoiceQuestion('Invalid Option', question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Invalid option selected');
    });

    it('should fail validation when numeric value does not match string options', () => {
      const question = createTestMultipleChoiceQuestion({
        id: 'q1',
        options: ['Option A', 'Option B'],
      });
      const result = validateMultipleChoiceQuestion(1, question);

      expect(result.isValid).toBe(false);
    });

    it('should pass validation when numeric value matches string option', () => {
      const question = createTestMultipleChoiceQuestion({
        id: 'q1',
        options: ['1', '2', '3'],
      });
      const result = validateMultipleChoiceQuestion(1, question);

      expect(result.isValid).toBe(true);
    });
  });

  describe('getMultipleChoiceQuestionDefaultValue', () => {
    it('should return default value when set', () => {
      const question = createTestMultipleChoiceQuestion({
        defaultValue: 'Option A',
        options: ['Option A', 'Option B'],
      });
      const defaultValue = getMultipleChoiceQuestionDefaultValue(question);

      expect(defaultValue).toBe('Option A');
    });

    it('should return undefined when no default value', () => {
      const question = createTestMultipleChoiceQuestion({
        options: ['Option A', 'Option B'],
      });
      const defaultValue = getMultipleChoiceQuestionDefaultValue(question);

      expect(defaultValue).toBeUndefined();
    });
  });

  describe('getMultipleChoiceOptions', () => {
    it('should return options list', () => {
      const questionData = createTestMultipleChoiceQuestion({
        options: ['Option A', 'Option B', 'Option C'],
      });
      const question = createMultipleChoiceQuestion(questionData);
      const options = getMultipleChoiceOptions(question);

      expect(options).toEqual(['Option A', 'Option B', 'Option C']);
    });

    it('should throw error for non-multiple-choice question', () => {
      const question = {
        id: 'q1',
        type: 'text',
        label: 'Test',
        serialize: () => ({ id: 'q1', type: 'text', label: 'Test' }),
      } as any;

      expect(() => getMultipleChoiceOptions(question)).toThrow('Question is not a multiple-choice question');
    });
  });

  describe('isValidMultipleChoiceOption', () => {
    it('should return true for valid option', () => {
      const question = createTestMultipleChoiceQuestion({
        options: ['Option A', 'Option B'],
      });
      const isValid = isValidMultipleChoiceOption('Option A', question);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid option', () => {
      const question = createTestMultipleChoiceQuestion({
        options: ['Option A', 'Option B'],
      });
      const isValid = isValidMultipleChoiceOption('Invalid', question);

      expect(isValid).toBe(false);
    });
  });

  describe('serializeMultipleChoiceQuestion', () => {
    it('should serialize question correctly', () => {
      const questionData = createTestMultipleChoiceQuestion({
        id: 'q1',
        label: 'Test Question',
        options: ['Option A', 'Option B'],
        defaultValue: 'Option A',
        required: true,
        visible: false,
      });
      const question = createMultipleChoiceQuestion(questionData);
      const serialized = serializeMultipleChoiceQuestion(question, questionData);

      expect(serialized.id).toBe('q1');
      expect(serialized.type).toBe('multiple-choice');
      expect(serialized.label).toBe('Test Question');
      expect(serialized.options).toEqual(['Option A', 'Option B']);
      expect(serialized.defaultValue).toBe('Option A');
      expect(serialized.required).toBe(true);
      expect(serialized.visible).toBe(false);
    });
  });
});
