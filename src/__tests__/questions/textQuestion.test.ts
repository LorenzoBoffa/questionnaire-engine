import { describe, it, expect } from 'vitest';
import { createTextQuestion, validateTextQuestion, getTextQuestionDefaultValue, serializeTextQuestion } from '../../questions/textQuestion';
import { createTextQuestion as createTestTextQuestion } from '../fixtures/helpers';
import type { TextQuestion } from '../../types/questions';

describe('TextQuestion', () => {
  describe('createTextQuestion', () => {
    it('should create a text question with valid data', () => {
      const questionData = createTestTextQuestion({
        id: 'q1',
        label: 'What is your name?',
      });

      const question = createTextQuestion(questionData);

      expect(question.id).toBe('q1');
      expect(question.type).toBe('text');
      expect(question.label).toBe('What is your name?');
      expect(question.required).toBe(false);
      expect(question.visible).toBe(true);
    });

    it('should set required to true when specified', () => {
      const questionData = createTestTextQuestion({ required: true });
      const question = createTextQuestion(questionData);

      expect(question.required).toBe(true);
    });

    it('should set visible to false when specified', () => {
      const questionData = createTestTextQuestion({ visible: false });
      const question = createTextQuestion(questionData);

      expect(question.visible).toBe(false);
    });

    it('should throw error for invalid question type', () => {
      const invalidData = { id: 'q1', type: 'number', label: 'Test' } as any;

      expect(() => createTextQuestion(invalidData)).toThrow('Invalid question type for TextQuestion');
    });
  });

  describe('validateTextQuestion', () => {
    it('should validate required field with value', () => {
      const question = createTestTextQuestion({ id: 'q1', required: true });
      const result = validateTextQuestion('John Doe', question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for required field without value', () => {
      const question = createTestTextQuestion({ id: 'q1', required: true });
      const result = validateTextQuestion(null, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('required');
      expect(result.errors[0].questionId).toBe('q1');
    });

    it('should fail validation for required field with empty string', () => {
      const question = createTestTextQuestion({ id: 'q1', required: true });
      const result = validateTextQuestion('', question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('required');
    });

    it('should pass validation for optional field without value', () => {
      const question = createTestTextQuestion({ id: 'q1', required: false });
      const result = validateTextQuestion(null, question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate minLength constraint', () => {
      const question = createTestTextQuestion({
        id: 'q1',
        validation: [{ type: 'minLength', value: 5 }],
      });
      const result = validateTextQuestion('Hi', question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('minLength');
    });

    it('should pass validation when text meets minLength', () => {
      const question = createTestTextQuestion({
        id: 'q1',
        validation: [{ type: 'minLength', value: 5 }],
      });
      const result = validateTextQuestion('Hello', question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate maxLength constraint', () => {
      const question = createTestTextQuestion({
        id: 'q1',
        validation: [{ type: 'maxLength', value: 5 }],
      });
      const result = validateTextQuestion('Too Long Text', question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('maxLength');
    });

    it('should pass validation when text meets maxLength', () => {
      const question = createTestTextQuestion({
        id: 'q1',
        validation: [{ type: 'maxLength', value: 10 }],
      });
      const result = validateTextQuestion('Short', question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should trim whitespace before validation', () => {
      const question = createTestTextQuestion({
        id: 'q1',
        validation: [{ type: 'minLength', value: 3 }],
      });
      const result = validateTextQuestion('  Hi  ', question);

      expect(result.isValid).toBe(false);
    });

    it('should handle multiple validation rules', () => {
      const question = createTestTextQuestion({
        id: 'q1',
        required: true,
        validation: [
          { type: 'minLength', value: 5 },
          { type: 'maxLength', value: 10 },
        ],
      });
      const result = validateTextQuestion('Hi', question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should use custom error message when provided', () => {
      const question = createTestTextQuestion({
        id: 'q1',
        required: true,
        validation: [{ type: 'required', message: 'Custom required message' }],
      });
      const result = validateTextQuestion(null, question);

      expect(result.errors[0].message).toBe('Custom required message');
    });

    describe('email validation', () => {
      it('should pass when value is a valid email', () => {
        const question = createTestTextQuestion({
          id: 'q1',
          validation: [{ type: 'email' }],
        });
        const result = validateTextQuestion('user@example.com', question);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should fail when value is not an email', () => {
        const question = createTestTextQuestion({
          id: 'q1',
          validation: [{ type: 'email' }],
        });
        const result = validateTextQuestion('not-an-email', question);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].rule).toBe('email');
        expect(result.errors[0].questionId).toBe('q1');
      });

      it('should fail for invalid email formats', () => {
        const question = createTestTextQuestion({
          id: 'q1',
          validation: [{ type: 'email' }],
        });
        expect(validateTextQuestion('@nodomain.com', question).isValid).toBe(false);
        expect(validateTextQuestion('@nodomain.com', question).errors[0].rule).toBe('email');
        expect(validateTextQuestion('missing-at.com', question).isValid).toBe(false);
        expect(validateTextQuestion('missing-at.com', question).errors[0].rule).toBe('email');
        expect(validateTextQuestion('a@b', question).isValid).toBe(false);
        expect(validateTextQuestion('a@b', question).errors[0].rule).toBe('email');
      });

      it('should skip email check when value is empty', () => {
        const question = createTestTextQuestion({
          id: 'q1',
          required: false,
          validation: [{ type: 'email' }],
        });
        expect(validateTextQuestion(null, question).isValid).toBe(true);
        expect(validateTextQuestion('', question).isValid).toBe(true);
      });

      it('should use custom message for email rule', () => {
        const question = createTestTextQuestion({
          id: 'q1',
          validation: [{ type: 'email', message: 'Enter a valid email' }],
        });
        const result = validateTextQuestion('invalid', question);

        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toBe('Enter a valid email');
      });

      it('should validate email together with other rules', () => {
        const question = createTestTextQuestion({
          id: 'q1',
          validation: [
            { type: 'minLength', value: 5 },
            { type: 'email' },
          ],
        });
        const validResult = validateTextQuestion('user@example.com', question);
        expect(validResult.isValid).toBe(true);
        expect(validResult.errors).toHaveLength(0);

        const invalidResult = validateTextQuestion('bad', question);
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.errors.some(e => e.rule === 'email')).toBe(true);
      });
    });
  });

  describe('getTextQuestionDefaultValue', () => {
    it('should return default value when set', () => {
      const question = createTestTextQuestion({ defaultValue: 'Default Text' });
      const defaultValue = getTextQuestionDefaultValue(question);

      expect(defaultValue).toBe('Default Text');
    });

    it('should return undefined when no default value', () => {
      const question = createTestTextQuestion();
      const defaultValue = getTextQuestionDefaultValue(question);

      expect(defaultValue).toBeUndefined();
    });
  });

  describe('serializeTextQuestion', () => {
    it('should serialize question correctly', () => {
      const questionData = createTestTextQuestion({
        id: 'q1',
        label: 'Test Question',
        placeholder: 'Enter text',
        defaultValue: 'Default',
        required: true,
        visible: false,
        validation: [{ type: 'minLength', value: 2 }],
      });
      const question = createTextQuestion(questionData);
      const serialized = serializeTextQuestion(question, questionData);

      expect(serialized.id).toBe('q1');
      expect(serialized.type).toBe('text');
      expect(serialized.label).toBe('Test Question');
      expect(serialized.placeholder).toBe('Enter text');
      expect(serialized.defaultValue).toBe('Default');
      expect(serialized.required).toBe(true);
      expect(serialized.visible).toBe(false);
      expect(serialized.validation).toEqual([{ type: 'minLength', value: 2 }]);
    });
  });
});
