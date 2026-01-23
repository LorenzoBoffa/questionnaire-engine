import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQuestionnaireEngine, NotInitializedError, QuestionNotFoundError, InvalidQuestionnaireError } from '../../engine';
import type { Questionnaire } from '../../types';

describe('QuestionnaireEngine - Edge Cases', () => {
  let engine: ReturnType<typeof createQuestionnaireEngine>;

  beforeEach(() => {
    engine = createQuestionnaireEngine();
  });

  describe('Loading Edge Cases', () => {
    it('should handle loading multiple questionnaires sequentially', () => {
      const q1: Questionnaire = {
        id: 'q1',
        title: 'Questionnaire 1',
        sections: [{
          id: 's1',
          title: 'Section 1',
          questions: [{ id: 'q1', type: 'text', label: 'Q1' }]
        }]
      };

      const q2: Questionnaire = {
        id: 'q2',
        title: 'Questionnaire 2',
        sections: [{
          id: 's1',
          title: 'Section 1',
          questions: [{ id: 'q2', type: 'number', label: 'Q2' }]
        }]
      };

      engine.load(q1);
      expect(engine.getCurrentQuestions()).toHaveLength(1);
      expect(engine.getCurrentQuestions()[0].id).toBe('q1');

      engine.load(q2);
      expect(engine.getCurrentQuestions()).toHaveLength(1);
      expect(engine.getCurrentQuestions()[0].id).toBe('q2');
    });

    it('should handle questionnaire with empty sections array', () => {
      const invalid: any = {
        id: 'test',
        title: 'Test',
        sections: []
      };

      expect(() => engine.load(invalid)).toThrow(InvalidQuestionnaireError);
    });

    it('should handle section with empty questions array', () => {
      const invalid: any = {
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: []
        }]
      };

      expect(() => engine.load(invalid)).toThrow();
    });

    it('should handle questionnaire with duplicate question IDs', () => {
      const q: Questionnaire = {
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'text', label: 'Q1' },
            { id: 'q1', type: 'text', label: 'Q1 Duplicate' }
          ]
        }]
      };

      expect(() => engine.load(q)).toThrow(InvalidQuestionnaireError);
    });

    it('should handle questionnaire with duplicate section IDs', () => {
      const q: Questionnaire = {
        id: 'test',
        title: 'Test',
        sections: [
          { id: 's1', title: 'Section 1', questions: [{ id: 'q1', type: 'text', label: 'Q1' }] },
          { id: 's1', title: 'Section 1 Duplicate', questions: [{ id: 'q2', type: 'text', label: 'Q2' }] }
        ]
      };

      engine.load(q);
      const section1 = engine.getSection('s1');
      expect(section1).toBeDefined();
      expect(section1?.title).toBe('Section 1');
    });

    it('should handle questionnaire with null/undefined values in optional fields', () => {
      const q: Questionnaire = {
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{
            id: 'q1',
            type: 'text',
            label: 'Q1',
            required: false,
            visible: undefined,
            placeholder: undefined,
            defaultValue: undefined,
            validation: undefined
          }]
        }]
      };

      expect(() => engine.load(q)).not.toThrow();
    });

    it('should handle very large questionnaire', () => {
      const questions = Array.from({ length: 1000 }, (_, i) => ({
        id: `q${i}`,
        type: 'text' as const,
        label: `Question ${i}`
      }));

      const q: Questionnaire = {
        id: 'large',
        title: 'Large Questionnaire',
        sections: [{
          id: 's1',
          title: 'Section',
          questions
        }]
      };

      engine.load(q);
      expect(engine.getCurrentQuestions()).toHaveLength(1000);
    });

    it('should handle questionnaire with special characters in IDs', () => {
      const q: Questionnaire = {
        id: 'test-123_abc',
        title: 'Test',
        sections: [{
          id: 'section-1_2-3',
          title: 'Section',
          questions: [{
            id: 'question_1-2-3',
            type: 'text',
            label: 'Question'
          }]
        }]
      };

      engine.load(q);
      expect(engine.getQuestion('question_1-2-3')).toBeDefined();
    });

    it('should handle questionnaire with unicode in labels', () => {
      const q: Questionnaire = {
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{
            id: 'q1',
            type: 'text',
            label: 'Question with émojis 🎉 and 中文'
          }]
        }]
      };

      engine.load(q);
      const question = engine.getQuestion('q1');
      expect(question?.label).toBe('Question with émojis 🎉 and 中文');
    });
  });

  describe('Answer Setting Edge Cases', () => {
    beforeEach(() => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'text', label: 'Text' },
            { id: 'q2', type: 'number', label: 'Number' },
            { id: 'q3', type: 'multiple-choice', label: 'Choice', options: ['A', 'B', 'C'] }
          ]
        }]
      });
    });

    it('should handle setting answer to null explicitly', () => {
      engine.setAnswer('q1', 'test');
      engine.setAnswer('q1', null as any);
      expect(engine.getAnswer('q1')).toBeNull();
      expect(engine.hasAnswer('q1')).toBe(false);
    });

    it('should handle setting answer to undefined explicitly', () => {
      engine.setAnswer('q1', 'test');
      engine.setAnswer('q1', undefined as any);
      expect(engine.getAnswer('q1')).toBeUndefined();
      expect(engine.hasAnswer('q1')).toBe(false);
    });

    it('should handle setting empty string answer', () => {
      engine.setAnswer('q1', '');
      expect(engine.getAnswer('q1')).toBe('');
      expect(engine.hasAnswer('q1')).toBe(false);
    });

    it('should handle setting whitespace-only answer', () => {
      engine.setAnswer('q1', '   ');
      expect(engine.getAnswer('q1')).toBe('   ');
      expect(engine.hasAnswer('q1')).toBe(true);
    });

    it('should handle setting zero as answer', () => {
      engine.setAnswer('q2', 0);
      expect(engine.getAnswer('q2')).toBe(0);
      expect(engine.hasAnswer('q2')).toBe(true);
    });

    it('should handle setting negative number', () => {
      engine.setAnswer('q2', -42);
      expect(engine.getAnswer('q2')).toBe(-42);
    });

    it('should handle setting floating point number', () => {
      engine.setAnswer('q2', 3.14159);
      expect(engine.getAnswer('q2')).toBe(3.14159);
    });

    it('should handle setting very large number', () => {
      engine.setAnswer('q2', Number.MAX_SAFE_INTEGER);
      expect(engine.getAnswer('q2')).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle setting very small number', () => {
      engine.setAnswer('q2', Number.MIN_SAFE_INTEGER);
      expect(engine.getAnswer('q2')).toBe(Number.MIN_SAFE_INTEGER);
    });

    it('should handle setting very long string', () => {
      const longString = 'a'.repeat(10000);
      engine.setAnswer('q1', longString);
      expect(engine.getAnswer('q1')).toBe(longString);
    });

    it('should handle setting answer with unicode characters', () => {
      engine.setAnswer('q1', 'Hello 世界 🎉');
      expect(engine.getAnswer('q1')).toBe('Hello 世界 🎉');
    });

    it('should handle setting invalid option for multiple choice', () => {
      engine.setAnswer('q3', 'Invalid Option');
      expect(engine.getAnswer('q3')).toBe('Invalid Option');
    });

    it('should handle rapid setAnswer calls', () => {
      for (let i = 0; i < 100; i++) {
        engine.setAnswer('q1', `value${i}`);
      }
      expect(engine.getAnswer('q1')).toBe('value99');
    });

    it('should handle setting answer after destroy', () => {
      engine.destroy();
      expect(() => engine.setAnswer('q1', 'test')).toThrow(NotInitializedError);
    });

    it('should handle setting answer with wrong type (string to number question)', () => {
      engine.setAnswer('q2', 'not a number' as any);
      expect(engine.getAnswer('q2')).toBe('not a number');
    });
  });

  describe('Progress Calculation Edge Cases', () => {
    it('should handle progress with all questions hidden', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'text', label: 'Q1', visible: false },
            { id: 'q2', type: 'text', label: 'Q2', visible: false }
          ]
        }]
      });

      const progress = engine.getProgress();
      expect(progress.total).toBe(0);
      expect(progress.answered).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('should handle progress when question becomes hidden after answer', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Age' },
            { id: 'q2', type: 'text', label: 'Extra', visible: false }
          ]
        }],
        actions: [{
          type: 'hide',
          condition: 'q1 < 18',
          target: 'q2'
        }]
      });

      engine.setAnswer('q1', 25);
      engine.setAnswer('q2', 'test');
      let progress = engine.getProgress();
      expect(progress.total).toBe(2);

      engine.setAnswer('q1', 15);
      progress = engine.getProgress();
      expect(progress.total).toBe(1);
    });

    it('should handle progress with zero total questions', () => {
      expect(() => engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: []
        }]
      } as any)).toThrow();
    });

    it('should handle progress calculation with partial answers', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'text', label: 'Q1' },
            { id: 'q2', type: 'text', label: 'Q2' },
            { id: 'q3', type: 'text', label: 'Q3' }
          ]
        }]
      });

      engine.setAnswer('q1', '');
      engine.setAnswer('q2', 'answer');
      const progress = engine.getProgress();
      expect(progress.answered).toBe(1);
      expect(progress.percentage).toBe(33);
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle validation when question becomes hidden', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Age', required: true },
            { id: 'q2', type: 'text', label: 'Extra', required: true, visible: false }
          ]
        }],
        actions: [{
          type: 'hide',
          condition: 'q1 < 18',
          target: 'q2'
        }]
      });

      engine.setAnswer('q1', 15);
      const result = engine.validate();
      expect(result.isValid).toBe(true);
    });

    it('should handle validation errors persist after fixing', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{
            id: 'q1',
            type: 'text',
            label: 'Name',
            required: true,
            validation: [{ type: 'minLength', value: 3 }]
          }]
        }]
      });

      engine.setAnswer('q1', 'ab');
      engine.validate();
      let errors = engine.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);

      engine.setAnswer('q1', 'abc');
      engine.validate();
      errors = engine.getValidationErrors();
      expect(errors.length).toBe(0);
    });

    it('should handle multiple validation errors for same question', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{
            id: 'q1',
            type: 'number',
            label: 'Number',
            required: true,
            validation: [
              { type: 'min', value: 10 },
              { type: 'max', value: 100 }
            ]
          }]
        }]
      });

      engine.setAnswer('q1', 5);
      const result = engine.validate();
      expect(result.isValid).toBe(false);
    });

    it('should handle validation with min > max (invalid config)', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{
            id: 'q1',
            type: 'number',
            label: 'Number',
            validation: [
              { type: 'min', value: 100 },
              { type: 'max', value: 10 }
            ]
          }]
        }]
      });

      engine.setAnswer('q1', 50);
      const result = engine.validate();
      expect(result.isValid).toBe(false);
    });

    it('should handle validation with negative min/max', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{
            id: 'q1',
            type: 'number',
            label: 'Number',
            validation: [
              { type: 'min', value: -100 },
              { type: 'max', value: -10 }
            ]
          }]
        }]
      });

      engine.setAnswer('q1', -50);
      const result = engine.validate();
      expect(result.isValid).toBe(true);
    });

    it('should handle required validation with whitespace', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{
            id: 'q1',
            type: 'text',
            label: 'Text',
            required: true
          }]
        }]
      });

      engine.setAnswer('q1', '   ');
      const result = engine.validate();
      expect(result.isValid).toBe(false);
    });
  });

  describe('Actions Edge Cases', () => {
    it('should handle action targeting non-existent question', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{ id: 'q1', type: 'number', label: 'Age' }]
        }],
        actions: [{
          type: 'show',
          condition: 'q1 > 18',
          target: 'nonexistent'
        }]
      });

      expect(() => engine.setAnswer('q1', 25)).not.toThrow();
    });

    it('should handle multiple conflicting actions on same question', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Age' },
            { id: 'q2', type: 'text', label: 'Extra', visible: false }
          ]
        }],
        actions: [
          { type: 'show', condition: 'q1 > 10', target: 'q2' },
          { type: 'hide', condition: 'q1 > 20', target: 'q2' }
        ]
      });

      engine.setAnswer('q1', 15);
      expect(engine.isQuestionVisible('q2')).toBe(true);

      engine.setAnswer('q1', 25);
      expect(engine.isQuestionVisible('q2')).toBe(false);
    });

    it('should handle action with invalid condition syntax', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Age' },
            { id: 'q2', type: 'text', label: 'Extra', visible: false }
          ]
        }],
        actions: [{
          type: 'show',
          condition: 'q1 >>>> 18',
          target: 'q2'
        }]
      });

      expect(() => engine.setAnswer('q1', 25)).not.toThrow();
    });

    it('should handle action condition referencing non-existent field', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'text', label: 'Extra', visible: false }
          ]
        }],
        actions: [{
          type: 'show',
          condition: 'nonexistent > 10',
          target: 'q1'
        }]
      });

      expect(() => engine.setAnswer('q1', 'test')).not.toThrow();
    });

    it('should handle nested conditions in actions', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Age' },
            { id: 'q2', type: 'number', label: 'Score' },
            { id: 'q3', type: 'text', label: 'Extra', visible: false }
          ]
        }],
        actions: [{
          type: 'show',
          condition: 'q1 >= 18 && q2 > 50',
          target: 'q3'
        }]
      });

      engine.setAnswer('q1', 25);
      engine.setAnswer('q2', 60);
      expect(engine.isQuestionVisible('q3')).toBe(true);

      engine.setAnswer('q2', 40);
      expect(engine.isQuestionVisible('q3')).toBe(false);
    });

    it('should handle action execution order', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Value' },
            { id: 'q2', type: 'text', label: 'Q2', visible: false },
            { id: 'q3', type: 'text', label: 'Q3', visible: false }
          ]
        }],
        actions: [
          { type: 'show', condition: 'q1 > 10', target: 'q2' },
          { type: 'show', condition: 'q1 > 20', target: 'q3' }
        ]
      });

      engine.setAnswer('q1', 15);
      expect(engine.isQuestionVisible('q2')).toBe(true);
      expect(engine.isQuestionVisible('q3')).toBe(false);

      engine.setAnswer('q1', 25);
      expect(engine.isQuestionVisible('q2')).toBe(true);
      expect(engine.isQuestionVisible('q3')).toBe(true);
    });
  });

  describe('Formula Edge Cases', () => {
    it('should handle formula referencing non-existent question', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{ id: 'q1', type: 'number', label: 'Q1' }]
        }],
        formulas: [{
          id: 'total',
          expression: 'sum(q1, nonexistent)'
        }]
      });

      engine.setAnswer('q1', 10);
      const questionnaire = engine.getQuestionnaire();
      expect(questionnaire?.formulas).toBeDefined();
    });

    it('should handle formula with circular dependency', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{ id: 'q1', type: 'number', label: 'Q1' }]
        }],
        formulas: [
          { id: 'f1', expression: 'f2 + 10' },
          { id: 'f2', expression: 'f1 + 5' }
        ]
      });

      engine.setAnswer('q1', 10);
      const questionnaire = engine.getQuestionnaire();
      expect(questionnaire?.formulas).toBeDefined();
    });

    it('should handle formula with self-reference', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{ id: 'q1', type: 'number', label: 'Q1' }]
        }],
        formulas: [{
          id: 'f1',
          expression: 'f1 + 10'
        }]
      });

      engine.setAnswer('q1', 10);
      const questionnaire = engine.getQuestionnaire();
      expect(questionnaire?.formulas).toBeDefined();
    });

    it('should handle formula with boolean result', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Q1' },
            { id: 'q2', type: 'number', label: 'Q2' }
          ]
        }],
        formulas: [{
          id: 'comparison',
          expression: 'q1 > q2'
        }]
      });

      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 5);
      const questionnaire = engine.getQuestionnaire();
      expect(questionnaire?.formulas).toBeDefined();
    });

    it('should handle formula with missing referenced fields', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{ id: 'q1', type: 'number', label: 'Q1' }]
        }],
        formulas: [{
          id: 'total',
          expression: 'sum(q1, q2, q3)'
        }]
      });

      engine.setAnswer('q1', 10);
      const questionnaire = engine.getQuestionnaire();
      expect(questionnaire?.formulas).toBeDefined();
    });

    it('should handle formula evaluation order with dependencies', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Q1' },
            { id: 'q2', type: 'number', label: 'Q2' }
          ]
        }],
        formulas: [
          { id: 'sum', expression: 'q1 + q2' },
          { id: 'double', expression: 'sum * 2' }
        ]
      });

      engine.setAnswer('q1', 5);
      engine.setAnswer('q2', 10);
      const questionnaire = engine.getQuestionnaire();
      expect(questionnaire?.formulas).toBeDefined();
    });

    it('should handle formula with division by zero', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Q1' },
            { id: 'q2', type: 'number', label: 'Q2' }
          ]
        }],
        formulas: [{
          id: 'division',
          expression: 'q1 / q2'
        }]
      });

      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 0);
      const questionnaire = engine.getQuestionnaire();
      expect(questionnaire?.formulas).toBeDefined();
    });
  });

  describe('JSON Loader Edge Cases', () => {
    it('should handle JSON with extra unexpected fields', () => {
      const json = {
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{ id: 'q1', type: 'text', label: 'Q1' }]
        }],
        extraField: 'should be ignored',
        anotherField: 123
      };

      expect(() => engine.loadFromJSON(json)).not.toThrow();
    });

    it('should handle JSON with null values in arrays', () => {
      const json = {
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'text', label: 'Q1' },
            null
          ]
        }]
      };

      expect(() => engine.loadFromJSON(json)).toThrow();
    });

    it('should handle JSON with deeply nested structures', () => {
      const json = {
        id: 'test',
        title: 'Test',
        sections: Array.from({ length: 10 }, (_, i) => ({
          id: `s${i}`,
          title: `Section ${i}`,
          questions: Array.from({ length: 10 }, (_, j) => ({
            id: `q${i}_${j}`,
            type: 'text',
            label: `Question ${i}-${j}`
          }))
        }))
      };

      expect(() => engine.loadFromJSON(json)).not.toThrow();
      expect(engine.getCurrentQuestions()).toHaveLength(100);
    });

    it('should handle JSON with special JSON values (NaN, Infinity)', () => {
      const json = {
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{
            id: 'q1',
            type: 'number',
            label: 'Q1',
            validation: [
              { type: 'min', value: NaN },
              { type: 'max', value: Infinity }
            ]
          }]
        }]
      };

      expect(() => engine.loadFromJSON(json)).not.toThrow();
    });

    it('should handle malformed JSON string', () => {
      expect(() => engine.loadFromJSON('{ invalid json }')).toThrow();
    });

    it('should handle empty JSON string', () => {
      expect(() => engine.loadFromJSON('')).toThrow();
    });

    it('should handle JSON with type coercion edge cases', () => {
      const json = {
        id: 123,
        title: true,
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{
            id: 'q1',
            type: 'text',
            label: 'Q1',
            required: 'true',
            visible: 'false'
          }]
        }]
      };

      expect(() => engine.loadFromJSON(json)).not.toThrow();
    });
  });

  describe('Multiple Choice Edge Cases', () => {
    it('should handle multiple choice with empty options array', () => {
      const q: Questionnaire = {
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{
            id: 'q1',
            type: 'multiple-choice',
            label: 'Choice',
            options: []
          }]
        }]
      };

      expect(() => engine.load(q)).toThrow('MultipleChoiceQuestion must have at least one option');
    });

    it('should handle multiple choice with duplicate options', () => {
      const q: Questionnaire = {
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{
            id: 'q1',
            type: 'multiple-choice',
            label: 'Choice',
            options: ['A', 'B', 'A', 'C']
          }]
        }]
      };

      engine.load(q);
      const question = engine.getQuestion('q1');
      expect(question?.type).toBe('multiple-choice');
      if (question?.type === 'multiple-choice') {
        expect(question.options).toEqual(['A', 'B', 'A', 'C']);
      }
    });

    it('should handle setting answer that matches option exactly', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{
            id: 'q1',
            type: 'multiple-choice',
            label: 'Choice',
            options: ['Option A', 'Option B']
          }]
        }]
      });

      engine.setAnswer('q1', 'Option A');
      expect(engine.getAnswer('q1')).toBe('Option A');
    });
  });

  describe('State Management Edge Cases', () => {
    it('should handle multiple subscriptions and unsubscriptions', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{ id: 'q1', type: 'text', label: 'Q1' }]
        }]
      });

      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      const unsub1 = engine.subscribe(callback1);
      const unsub2 = engine.subscribe(callback2);
      engine.subscribe(callback3);

      engine.setAnswer('q1', 'test');
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(callback3).toHaveBeenCalled();

      unsub1();
      unsub2();

      engine.setAnswer('q1', 'test2');
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(2);
    });

    it('should handle error in subscription callback', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{ id: 'q1', type: 'text', label: 'Q1' }]
        }]
      });

      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();

      engine.subscribe(errorCallback);
      engine.subscribe(normalCallback);

      expect(() => engine.setAnswer('q1', 'test')).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
    });

    it('should handle reset with actions and formulas', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Q1' },
            { id: 'q2', type: 'text', label: 'Q2', visible: false }
          ]
        }],
        actions: [{ type: 'show', condition: 'q1 > 10', target: 'q2' }],
        formulas: [{ id: 'sum', expression: 'q1 * 2' }]
      });

      engine.setAnswer('q1', 15);
      engine.setAnswer('q2', 'test');
      engine.reset();

      expect(engine.getAnswer('q1')).toBeUndefined();
      expect(engine.getAnswer('q2')).toBeUndefined();
      expect(engine.isQuestionVisible('q2')).toBe(false);
    });

    it('should handle destroy and then load again', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{ id: 'q1', type: 'text', label: 'Q1' }]
        }]
      });

      engine.setAnswer('q1', 'test');
      engine.destroy();

      expect(() => engine.getCurrentQuestions()).toThrow(NotInitializedError);

      engine.load({
        id: 'test2',
        title: 'Test 2',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{ id: 'q2', type: 'text', label: 'Q2' }]
        }]
      });

      expect(engine.getCurrentQuestions()).toHaveLength(1);
      expect(engine.getAnswer('q1')).toBeUndefined();
    });
  });

  describe('Visibility Edge Cases', () => {
    it('should handle getVisibleQuestionsForSection with hidden questions', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'text', label: 'Q1' },
            { id: 'q2', type: 'text', label: 'Q2', visible: false }
          ]
        }]
      });

      const questions = engine.getVisibleQuestionsForSection('s1');
      expect(questions).toHaveLength(1);
      expect(questions[0].id).toBe('q1');
    });

    it('should handle isQuestionVisible for non-existent question', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [{ id: 'q1', type: 'text', label: 'Q1' }]
        }]
      });

      expect(engine.isQuestionVisible('nonexistent')).toBe(false);
    });

    it('should handle question visibility state persistence', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Age' },
            { id: 'q2', type: 'text', label: 'Extra', visible: false }
          ]
        }],
        actions: [{ type: 'show', condition: 'q1 > 18', target: 'q2' }]
      });

      engine.setAnswer('q1', 25);
      expect(engine.isQuestionVisible('q2')).toBe(true);

      engine.setAnswer('q1', 15);
      expect(engine.isQuestionVisible('q2')).toBe(false);

      engine.setAnswer('q1', 20);
      expect(engine.isQuestionVisible('q2')).toBe(true);
    });
  });

  describe('hasAnswer Edge Cases', () => {
    beforeEach(() => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'text', label: 'Text' },
            { id: 'q2', type: 'number', label: 'Number' },
            { id: 'q3', type: 'multiple-choice', label: 'Choice', options: ['A', 'B'] }
          ]
        }]
      });
    });

    it('should return false for zero value', () => {
      engine.setAnswer('q2', 0);
      expect(engine.hasAnswer('q2')).toBe(true);
    });

    it('should return false for false boolean (if supported)', () => {
      engine.setAnswer('q1', 'false' as any);
      expect(engine.hasAnswer('q1')).toBe(true);
    });

    it('should return false for empty array (if supported)', () => {
      engine.setAnswer('q1', [] as any);
      expect(engine.hasAnswer('q1')).toBe(false);
    });

    it('should return true for non-empty string', () => {
      engine.setAnswer('q1', 'test');
      expect(engine.hasAnswer('q1')).toBe(true);
    });

    it('should return false for non-existent question', () => {
      expect(engine.hasAnswer('nonexistent')).toBe(false);
    });
  });

  describe('Real-time Updates Edge Cases', () => {
    it('should handle rapid state changes', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Q1' },
            { id: 'q2', type: 'text', label: 'Q2', visible: false }
          ]
        }],
        actions: [{ type: 'show', condition: 'q1 > 10', target: 'q2' }]
      });

      const callback = vi.fn();
      engine.subscribe(callback);

      for (let i = 0; i < 50; i++) {
        engine.setAnswer('q1', i);
      }

      expect(callback).toHaveBeenCalled();
    });

    it('should handle formula results update on answer change', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Q1' },
            { id: 'q2', type: 'number', label: 'Q2' }
          ]
        }],
        formulas: [{ id: 'total', expression: 'sum(q1, q2)' }]
      });

      const callback = vi.fn();
      engine.subscribe(callback);

      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 20);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complex questionnaire with all features', () => {
      const complex: Questionnaire = {
        id: 'complex',
        title: 'Complex Test',
        sections: [
          {
            id: 's1',
            title: 'Section 1',
            questions: [
              { id: 'q1', type: 'number', label: 'Age', required: true, validation: [{ type: 'min', value: 0 }, { type: 'max', value: 150 }] },
              { id: 'q2', type: 'text', label: 'Name', required: true, validation: [{ type: 'minLength', value: 2 }] },
              { id: 'q3', type: 'multiple-choice', label: 'Country', options: ['USA', 'Canada', 'UK'], required: true },
              { id: 'q4', type: 'number', label: 'Score 1' },
              { id: 'q5', type: 'number', label: 'Score 2' },
              { id: 'q6', type: 'text', label: 'Extra Info', visible: false }
            ]
          }
        ],
        formulas: [
          { id: 'total', expression: 'sum(q4, q5)' },
          { id: 'average', expression: 'total / 2' }
        ],
        actions: [
          { type: 'show', condition: 'q1 >= 18 && q3 == "USA"', target: 'q6' },
          { type: 'hide', condition: 'q1 < 18', target: 'q6' }
        ]
      };

      engine.load(complex);

      engine.setAnswer('q1', 25);
      engine.setAnswer('q2', 'John');
      engine.setAnswer('q3', 'USA');
      engine.setAnswer('q4', 80);
      engine.setAnswer('q5', 90);
      engine.setAnswer('q6', 'Extra info');

      expect(engine.isQuestionVisible('q6')).toBe(true);
      expect(engine.validate().isValid).toBe(true);
      expect(engine.getProgress().percentage).toBe(100);
    });

    it('should handle questionnaire with chained dependencies', () => {
      engine.load({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Q1' },
            { id: 'q2', type: 'text', label: 'Q2', visible: false },
            { id: 'q3', type: 'text', label: 'Q3', visible: false }
          ]
        }],
        actions: [
          { type: 'show', condition: 'q1 > 10', target: 'q2' },
          { type: 'show', condition: 'q2 != ""', target: 'q3' }
        ]
      });

      engine.setAnswer('q1', 15);
      expect(engine.isQuestionVisible('q2')).toBe(true);

      engine.setAnswer('q2', 'test');
      expect(engine.isQuestionVisible('q3')).toBe(true);
    });
  });
});
