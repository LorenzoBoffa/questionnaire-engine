import { describe, it, expect } from 'vitest';
import { validateQuestion, validateAll, getErrorsForQuestion, hasErrors } from '../../validation/engine';
import {
  createTextQuestion,
  createNumberQuestion,
  createMultipleChoiceQuestion,
  createMultiSelectQuestion,
  createFileQuestion,
} from '../fixtures/helpers';
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

    it('should apply minSelections and maxSelections from validation array for multi-select', () => {
      const question = createMultiSelectQuestion({
        id: 'q1',
        options: ['A', 'B', 'C'],
        validation: [
          { type: 'minSelections', value: 2 },
          { type: 'maxSelections', value: 2 },
        ],
      });
      expect(validateQuestion(question, ['A']).isValid).toBe(false);
      expect(validateQuestion(question, ['A']).errors.some(e => e.rule === 'minSelections')).toBe(true);
      expect(validateQuestion(question, ['A', 'B', 'C']).isValid).toBe(false);
      expect(validateQuestion(question, ['A', 'B', 'C']).errors.some(e => e.rule === 'maxSelections')).toBe(true);
      expect(validateQuestion(question, ['A', 'B']).isValid).toBe(true);
    });

    it('should apply allowedExtensions and maxSizeBytes from validation array for file', () => {
      const question = createFileQuestion({
        id: 'q1',
        type: 'file',
        validation: [
          { type: 'allowedExtensions', value: ['.pdf'] },
          { type: 'maxSizeBytes', value: 1000 },
        ],
      });
      const validFile = { name: 'doc.pdf', size: 500, type: 'application/pdf' };
      expect(validateQuestion(question, validFile).isValid).toBe(true);
      const wrongExt = { name: 'doc.exe', size: 500, type: 'application/octet-stream' };
      expect(validateQuestion(question, wrongExt).isValid).toBe(false);
      expect(validateQuestion(question, wrongExt).errors.some(e => e.rule === 'allowedExtensions')).toBe(true);
      const tooLarge = { name: 'doc.pdf', size: 2000, type: 'application/pdf' };
      expect(validateQuestion(question, tooLarge).isValid).toBe(false);
      expect(validateQuestion(question, tooLarge).errors.some(e => e.rule === 'maxSizeBytes')).toBe(true);
    });
    
    describe('multiple rules including required (required + min + max)', () => {
      const question = createNumberQuestion({
        id: 'potenza-termica',
        validation: [
          { type: 'required', message: 'Inserisci la potenza termica nominale' },
          { type: 'min', value: 0.1 },
          { type: 'max', value: 2000 },
        ],
      });

      it('should fail with required error when value is null', () => {
        const result = validateQuestion(question, null);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.rule === 'required')).toBe(true);
        expect(result.errors.find(e => e.rule === 'required')?.message).toBe('Inserisci la potenza termica nominale');
      });

      it('should fail with required error when value is undefined', () => {
        const result = validateQuestion(question, undefined);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.rule === 'required')).toBe(true);
      });

      it('should fail with required error when value is empty string', () => {
        const result = validateQuestion(question, '');
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.rule === 'required')).toBe(true);
      });

      it('should fail with min error when value is below min', () => {
        const result = validateQuestion(question, 0);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.rule === 'min')).toBe(true);
      });

      it('should fail with min error when value is just below min', () => {
        const result = validateQuestion(question, 0.05);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.rule === 'min')).toBe(true);
      });

      it('should fail with max error when value is above max', () => {
        const result = validateQuestion(question, 2500);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.rule === 'max')).toBe(true);
      });

      it('should fail with max error when value is just above max', () => {
        const result = validateQuestion(question, 2000.1);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.rule === 'max')).toBe(true);
      });

      it('should pass when value is at min boundary', () => {
        const result = validateQuestion(question, 0.1);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should pass when value is at max boundary', () => {
        const result = validateQuestion(question, 2000);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should pass when value is within range', () => {
        const result = validateQuestion(question, 100);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should pass when value is decimal within range', () => {
        const result = validateQuestion(question, 150.5);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
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

    it('should apply required + min + max together and aggregate errors correctly', () => {
      const questions = [
        createNumberQuestion({
          id: 'potenza',
          validation: [
            { type: 'required', message: 'Inserisci la potenza termica nominale' },
            { type: 'min', value: 0.1 },
            { type: 'max', value: 2000 },
          ],
        }),
      ];
      const resultEmpty = validateAll(questions, {});
      expect(resultEmpty.isValid).toBe(false);
      expect(resultEmpty.errors.some(e => e.questionId === 'potenza' && e.rule === 'required')).toBe(true);

      const resultBelowMin = validateAll(questions, { potenza: 0 });
      expect(resultBelowMin.isValid).toBe(false);
      expect(resultBelowMin.errors.some(e => e.questionId === 'potenza' && e.rule === 'min')).toBe(true);

      const resultAboveMax = validateAll(questions, { potenza: 3000 });
      expect(resultAboveMax.isValid).toBe(false);
      expect(resultAboveMax.errors.some(e => e.questionId === 'potenza' && e.rule === 'max')).toBe(true);

      const resultValid = validateAll(questions, { potenza: 500 });
      expect(resultValid.isValid).toBe(true);
      expect(resultValid.errors).toHaveLength(0);
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
