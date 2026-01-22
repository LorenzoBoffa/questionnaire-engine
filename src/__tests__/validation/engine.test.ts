import { describe, it, expect } from 'vitest';
import { validateQuestion, validateAll, getErrorsForQuestion, hasErrors } from '../../validation/engine';
import { createTextQuestion, createNumberQuestion, createMultipleChoiceQuestion } from '../fixtures/helpers';
import type { AnswerStore } from '../../types/answers';
import type { ValidationResult } from '../../types/validation';

describe('Validation Engine', () => {
  describe('validateQuestion', () => {
    it('should validate question with value', () => {
      const question = createTextQuestion({ id: 'q1', required: true });
      const result = validateQuestion(question, 'test value');

      expect(result.isValid).toBe(true);
    });

    it('should validate required question without value', () => {
      const question = createTextQuestion({ id: 'q1', required: true });
      const result = validateQuestion(question, null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should validate optional question without value', () => {
      const question = createTextQuestion({ id: 'q1', required: false });
      const result = validateQuestion(question, null);

      expect(result.isValid).toBe(true);
    });

    it('should validate question with validation rules', () => {
      const question = createTextQuestion({
        id: 'q1',
        validation: [{ type: 'minLength', value: 5 }],
      });
      const result = validateQuestion(question, 'Hello');

      expect(result.isValid).toBe(true);
    });

    it('should fail validation when rules are not met', () => {
      const question = createTextQuestion({
        id: 'q1',
        validation: [{ type: 'minLength', value: 5 }],
      });
      const result = validateQuestion(question, 'Hi');

      expect(result.isValid).toBe(false);
    });

    it('should handle multiple validation rules', () => {
      const question = createTextQuestion({
        id: 'q1',
        required: true,
        validation: [
          { type: 'minLength', value: 5 },
          { type: 'maxLength', value: 10 },
        ],
      });
      const result = validateQuestion(question, 'Hello');

      expect(result.isValid).toBe(true);
    });

    it('should return valid when no validation rules', () => {
      const question = createTextQuestion({ id: 'q1', required: false });
      const result = validateQuestion(question, 'test');

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateAll', () => {
    it('should validate all questions in questionnaire', () => {
      const questions = [
        createTextQuestion({ id: 'q1', required: true }),
        createNumberQuestion({ id: 'q2', required: true }),
      ];
      const answers: AnswerStore = {
        q1: 'test',
        q2: 42,
      };
      const result = validateAll(questions, answers);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should aggregate validation results', () => {
      const questions = [
        createTextQuestion({ id: 'q1', required: true }),
        createNumberQuestion({ id: 'q2', required: true }),
      ];
      const answers: AnswerStore = {
        q1: null,
        q2: null,
      };
      const result = validateAll(questions, answers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should handle multiple validation errors per question', () => {
      const questions = [
        createTextQuestion({
          id: 'q1',
          required: true,
          validation: [
            { type: 'minLength', value: 5 },
            { type: 'maxLength', value: 10 },
          ],
        }),
      ];
      const answers: AnswerStore = {
        q1: 'Hi',
      };
      const result = validateAll(questions, answers);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return correct validation state', () => {
      const questions = [
        createTextQuestion({ id: 'q1', required: false }),
        createNumberQuestion({ id: 'q2', required: false }),
      ];
      const answers: AnswerStore = {};
      const result = validateAll(questions, answers);

      expect(result.isValid).toBe(true);
    });

    it('should handle empty questions array', () => {
      const questions: any[] = [];
      const answers: AnswerStore = {};
      const result = validateAll(questions, answers);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getErrorsForQuestion', () => {
    it('should return errors for specific question', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [
          { questionId: 'q1', rule: 'required', message: 'Required' },
          { questionId: 'q2', rule: 'required', message: 'Required' },
        ],
      };
      const errors = getErrorsForQuestion('q1', result);

      expect(errors).toHaveLength(1);
      expect(errors[0].questionId).toBe('q1');
    });

    it('should return empty array when no errors for question', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [{ questionId: 'q2', rule: 'required', message: 'Required' }],
      };
      const errors = getErrorsForQuestion('q1', result);

      expect(errors).toHaveLength(0);
    });
  });

  describe('hasErrors', () => {
    it('should return true when validation has errors', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [{ questionId: 'q1', rule: 'required', message: 'Required' }],
      };
      expect(hasErrors(result)).toBe(true);
    });

    it('should return false when validation is valid', () => {
      const result: ValidationResult = {
        isValid: true,
        errors: [],
      };
      expect(hasErrors(result)).toBe(false);
    });

    it('should return false when no errors', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: [],
      };
      expect(hasErrors(result)).toBe(false);
    });
  });
});
