import { describe, it, expect } from 'vitest';
import { validateQuestion, validateAll } from '../../validation/engine';
import type { Question } from '../../types/questions';
import type { AnswerValue } from '../../types/answers';

describe('Validation Engine - Edge Cases', () => {
  describe('validateQuestion Edge Cases', () => {
    it('should handle question with no validation rules', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        label: 'Question',
        required: false
      };

      const result = validateQuestion(question, 'test');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle required question with null value', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        label: 'Question',
        required: true
      };

      const result = validateQuestion(question, null as any);
      expect(result.isValid).toBe(false);
    });

    it('should handle required question with undefined value', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        label: 'Question',
        required: true
      };

      const result = validateQuestion(question, undefined as any);
      expect(result.isValid).toBe(false);
    });

    it('should handle required question with empty string', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        label: 'Question',
        required: true
      };

      const result = validateQuestion(question, '');
      expect(result.isValid).toBe(false);
    });

    it('should handle required question with whitespace only', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        label: 'Question',
        required: true
      };

      const result = validateQuestion(question, '   ');
      expect(result.isValid).toBe(false);
    });

    it('should handle min validation with negative number', () => {
      const question: Question = {
        id: 'q1',
        type: 'number',
        label: 'Number',
        validation: [{ type: 'min', value: -100 }]
      };

      const result1 = validateQuestion(question, -50);
      expect(result1.isValid).toBe(true);

      const result2 = validateQuestion(question, -150);
      expect(result2.isValid).toBe(false);
    });

    it('should handle max validation with negative number', () => {
      const question: Question = {
        id: 'q1',
        type: 'number',
        label: 'Number',
        validation: [{ type: 'max', value: -10 }]
      };

      const result1 = validateQuestion(question, -50);
      expect(result1.isValid).toBe(true);

      const result2 = validateQuestion(question, -5);
      expect(result2.isValid).toBe(false);
    });

    it('should handle min > max (invalid configuration)', () => {
      const question: Question = {
        id: 'q1',
        type: 'number',
        label: 'Number',
        validation: [
          { type: 'min', value: 100 },
          { type: 'max', value: 10 }
        ]
      };

      const result = validateQuestion(question, 50);
      expect(result.isValid).toBe(false);
    });

    it('should handle min equals max', () => {
      const question: Question = {
        id: 'q1',
        type: 'number',
        label: 'Number',
        validation: [
          { type: 'min', value: 50 },
          { type: 'max', value: 50 }
        ]
      };

      const result1 = validateQuestion(question, 50);
      expect(result1.isValid).toBe(true);

      const result2 = validateQuestion(question, 49);
      expect(result2.isValid).toBe(false);

      const result3 = validateQuestion(question, 51);
      expect(result3.isValid).toBe(false);
    });

    it('should handle zero as valid value', () => {
      const question: Question = {
        id: 'q1',
        type: 'number',
        label: 'Number',
        validation: [
          { type: 'min', value: 0 },
          { type: 'max', value: 100 }
        ]
      };

      const result = validateQuestion(question, 0);
      expect(result.isValid).toBe(true);
    });

    it('should handle floating point numbers in validation', () => {
      const question: Question = {
        id: 'q1',
        type: 'number',
        label: 'Number',
        validation: [
          { type: 'min', value: 0.5 },
          { type: 'max', value: 99.5 }
        ]
      };

      const result1 = validateQuestion(question, 50.25);
      expect(result1.isValid).toBe(true);

      const result2 = validateQuestion(question, 0.4);
      expect(result2.isValid).toBe(false);

      const result3 = validateQuestion(question, 99.6);
      expect(result3.isValid).toBe(false);
    });

    it('should handle minLength with zero', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        label: 'Text',
        validation: [{ type: 'minLength', value: 0 }]
      };

      const result1 = validateQuestion(question, '');
      expect(result1.isValid).toBe(true);

      const result2 = validateQuestion(question, 'test');
      expect(result2.isValid).toBe(true);
    });

    it('should handle maxLength with zero', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        label: 'Text',
        validation: [{ type: 'maxLength', value: 0 }]
      };

      const result1 = validateQuestion(question, '');
      expect(result1.isValid).toBe(true);

      const result2 = validateQuestion(question, 'test');
      expect(result2.isValid).toBe(false);
    });

    it('should handle minLength > maxLength (invalid configuration)', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        label: 'Text',
        validation: [
          { type: 'minLength', value: 10 },
          { type: 'maxLength', value: 5 }
        ]
      };

      const result = validateQuestion(question, 'test');
      expect(result.isValid).toBe(false);
    });

    it('should handle very long strings', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        label: 'Text',
        validation: [{ type: 'maxLength', value: 100 }]
      };

      const longString = 'a'.repeat(1000);
      const result = validateQuestion(question, longString);
      expect(result.isValid).toBe(false);
    });

    it('should handle unicode characters in length validation', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        label: 'Text',
        validation: [{ type: 'minLength', value: 3 }]
      };

      const result1 = validateQuestion(question, '世界');
      expect(result1.isValid).toBe(false);

      const result2 = validateQuestion(question, '世界🎉');
      expect(result2.isValid).toBe(true);
    });

    it('should handle multiple validation rules', () => {
      const question: Question = {
        id: 'q1',
        type: 'number',
        label: 'Number',
        required: true,
        validation: [
          { type: 'min', value: 10 },
          { type: 'max', value: 100 },
          { type: 'required' }
        ]
      };

      const result1 = validateQuestion(question, 50);
      expect(result1.isValid).toBe(true);

      const result2 = validateQuestion(question, 5);
      expect(result2.isValid).toBe(false);

      const result3 = validateQuestion(question, 150);
      expect(result3.isValid).toBe(false);
    });

    it('should handle validation with wrong type (string for number question)', () => {
      const question: Question = {
        id: 'q1',
        type: 'number',
        label: 'Number',
        validation: [{ type: 'min', value: 10 }]
      };

      const result = validateQuestion(question, 'not a number' as any);
      expect(result.isValid).toBe(true);
    });

    it('should handle validation with wrong type (number for text question)', () => {
      const question: Question = {
        id: 'q1',
        type: 'text',
        label: 'Text',
        validation: [{ type: 'minLength', value: 3 }]
      };

      const result = validateQuestion(question, 123 as any);
      expect(result.isValid).toBe(true);
    });

    it('should handle very large min/max values', () => {
      const question: Question = {
        id: 'q1',
        type: 'number',
        label: 'Number',
        validation: [
          { type: 'min', value: Number.MAX_SAFE_INTEGER - 100 },
          { type: 'max', value: Number.MAX_SAFE_INTEGER }
        ]
      };

      const result1 = validateQuestion(question, Number.MAX_SAFE_INTEGER - 50);
      expect(result1.isValid).toBe(true);

      const result2 = validateQuestion(question, Number.MAX_SAFE_INTEGER + 1);
      expect(result2.isValid).toBe(false);
    });
  });

  describe('validateAll Edge Cases', () => {
    it('should handle empty questions array', () => {
      const questions: Question[] = [];
      const answers: Record<string, AnswerValue> = {};

      const result = validateAll(questions, answers);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle questions with no answers', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', label: 'Q1', required: true },
        { id: 'q2', type: 'text', label: 'Q2', required: false }
      ];
      const answers: Record<string, AnswerValue> = {};

      const result = validateAll(questions, answers);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle questions with partial answers', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', label: 'Q1', required: true },
        { id: 'q2', type: 'text', label: 'Q2', required: true },
        { id: 'q3', type: 'text', label: 'Q3', required: false }
      ];
      const answers: Record<string, AnswerValue> = {
        q1: 'answer1'
      };

      const result = validateAll(questions, answers);
      expect(result.isValid).toBe(false);
    });

    it('should handle questions with all valid answers', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', label: 'Q1', required: true },
        { id: 'q2', type: 'number', label: 'Q2', validation: [{ type: 'min', value: 0 }, { type: 'max', value: 100 }] }
      ];
      const answers: Record<string, AnswerValue> = {
        q1: 'test',
        q2: 50
      };

      const result = validateAll(questions, answers);
      expect(result.isValid).toBe(true);
    });

    it('should handle questions with multiple errors', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', label: 'Q1', required: true },
        { id: 'q2', type: 'number', label: 'Q2', validation: [{ type: 'min', value: 10 }, { type: 'max', value: 100 }] },
        { id: 'q3', type: 'text', label: 'Q3', required: true, validation: [{ type: 'minLength', value: 5 }] }
      ];
      const answers: Record<string, AnswerValue> = {
        q1: '',
        q2: 5,
        q3: 'ab'
      };

      const result = validateAll(questions, answers);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should handle questions with hidden questions', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', label: 'Q1', required: true },
        { id: 'q2', type: 'text', label: 'Q2', required: true, visible: false }
      ];
      const answers: Record<string, AnswerValue> = {
        q1: 'test'
      };

      const result = validateAll(questions, answers);
      expect(result.isValid).toBe(false);
    });

    it('should handle questions with duplicate IDs', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', label: 'Q1', required: true },
        { id: 'q1', type: 'text', label: 'Q1 Duplicate', required: true }
      ];
      const answers: Record<string, AnswerValue> = {
        q1: 'test'
      };

      const result = validateAll(questions, answers);
      expect(result.isValid).toBe(true);
    });

    it('should handle very large number of questions', () => {
      const questions: Question[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `q${i}`,
        type: 'text' as const,
        label: `Question ${i}`,
        required: i % 2 === 0
      }));

      const answers: Record<string, AnswerValue> = {};
      for (let i = 0; i < 1000; i += 2) {
        answers[`q${i}`] = `answer${i}`;
      }

      const result = validateAll(questions, answers);
      expect(result.isValid).toBe(true);
    });

    it('should handle questions with special characters in IDs', () => {
      const questions: Question[] = [
        { id: 'q1-2_3', type: 'text', label: 'Q1', required: true }
      ];
      const answers: Record<string, AnswerValue> = {
        'q1-2_3': 'test'
      };

      const result = validateAll(questions, answers);
      expect(result.isValid).toBe(true);
    });

    it('should handle validation with null/undefined in answers', () => {
      const questions: Question[] = [
        { id: 'q1', type: 'text', label: 'Q1', required: true },
        { id: 'q2', type: 'text', label: 'Q2', required: false }
      ];
      const answers: Record<string, AnswerValue> = {
        q1: null as any,
        q2: undefined as any
      };

      const result = validateAll(questions, answers);
      expect(result.isValid).toBe(false);
    });
  });
});
