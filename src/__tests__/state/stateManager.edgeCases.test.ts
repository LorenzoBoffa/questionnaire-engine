import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStateManager } from '../../state/stateManager';
import { createFormulaEngine } from '../../formulas/engine';
import { validateAll } from '../../validation/engine';
import { simpleQuestionnaire, questionnaireWithActions, questionnaireWithFormulas } from '../fixtures/questionnaires';
import type { AnswerValue } from '../../types/answers';

describe('StateManager - Edge Cases', () => {
  let stateManager: ReturnType<typeof createStateManager>;
  let formulaEngine: ReturnType<typeof createFormulaEngine>;

  beforeEach(() => {
    formulaEngine = createFormulaEngine();
    const validationEngine = { validateAll };
    stateManager = createStateManager({ validationEngine, formulaEngine });
  });

  describe('Answer Store Edge Cases', () => {
    beforeEach(() => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
    });

    it('should handle setting answer to null', () => {
      stateManager.setAnswer('q1', 'test');
      stateManager.setAnswer('q1', null as any);
      expect(stateManager.getAnswer('q1')).toBeNull();
    });

    it('should handle setting answer to undefined', () => {
      stateManager.setAnswer('q1', 'test');
      stateManager.setAnswer('q1', undefined as any);
      expect(stateManager.getAnswer('q1')).toBeUndefined();
    });

    it('should handle empty string as answer', () => {
      stateManager.setAnswer('q1', '');
      expect(stateManager.getAnswer('q1')).toBe('');
    });

    it('should handle whitespace-only answer', () => {
      stateManager.setAnswer('q1', '   ');
      expect(stateManager.getAnswer('q1')).toBe('   ');
    });

    it('should handle zero as answer', () => {
      stateManager.setAnswer('q2', 0);
      expect(stateManager.getAnswer('q2')).toBe(0);
    });

    it('should handle negative numbers', () => {
      stateManager.setAnswer('q2', -42);
      expect(stateManager.getAnswer('q2')).toBe(-42);
    });

    it('should handle floating point numbers', () => {
      stateManager.setAnswer('q2', 3.14159);
      expect(stateManager.getAnswer('q2')).toBe(3.14159);
    });

    it('should handle very large numbers', () => {
      stateManager.setAnswer('q2', Number.MAX_SAFE_INTEGER);
      expect(stateManager.getAnswer('q2')).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      stateManager.setAnswer('q1', longString);
      expect(stateManager.getAnswer('q1')).toBe(longString);
    });

    it('should handle unicode characters in answers', () => {
      stateManager.setAnswer('q1', 'Hello 世界 🎉');
      expect(stateManager.getAnswer('q1')).toBe('Hello 世界 🎉');
    });

    it('should handle rapid answer updates', () => {
      for (let i = 0; i < 100; i++) {
        stateManager.setAnswer('q1', `value${i}`);
      }
      expect(stateManager.getAnswer('q1')).toBe('value99');
    });

    it('should handle overwriting answers multiple times', () => {
      stateManager.setAnswer('q1', 'v1');
      stateManager.setAnswer('q1', 'v2');
      stateManager.setAnswer('q1', 'v3');
      expect(stateManager.getAnswer('q1')).toBe('v3');
    });
  });

  describe('Progress Calculation Edge Cases', () => {
    it('should handle progress with all questions hidden', () => {
      stateManager.loadQuestionnaire({
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

      const progress = stateManager.getProgress();
      expect(progress.total).toBe(0);
      expect(progress.answered).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it('should handle progress when question becomes hidden', () => {
      stateManager.loadQuestionnaire(questionnaireWithActions);
      stateManager.setAnswer('q1', 25);
      stateManager.setAnswer('q2', 'test');

      let progress = stateManager.getProgress();
      expect(progress.total).toBe(2);

      stateManager.setAnswer('q1', 15);
      progress = stateManager.getProgress();
      expect(progress.total).toBe(1);
    });

    it('should handle progress with empty answers', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
      stateManager.setAnswer('q1', '');
      stateManager.setAnswer('q2', null as any);

      const progress = stateManager.getProgress();
      expect(progress.answered).toBe(0);
    });

    it('should handle progress calculation with partial completion', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
      stateManager.setAnswer('q1', 'test');

      const progress = stateManager.getProgress();
      expect(progress.answered).toBe(1);
      expect(progress.total).toBe(3);
      expect(progress.percentage).toBe(33);
    });

    it('should handle progress with 100% completion', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
      stateManager.setAnswer('q1', 'test');
      stateManager.setAnswer('q2', 42);
      stateManager.setAnswer('q3', 'Option A');

      const progress = stateManager.getProgress();
      expect(progress.answered).toBe(3);
      expect(progress.total).toBe(3);
      expect(progress.percentage).toBe(100);
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle validation when question becomes hidden', () => {
      stateManager.loadQuestionnaire(questionnaireWithActions);
      stateManager.setAnswer('q1', 15);

      const result = stateManager.validate();
      expect(result.isValid).toBe(true);
    });

    it('should handle validation errors clearing after fix', () => {
      stateManager.loadQuestionnaire({
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

      stateManager.setAnswer('q1', 'ab');
      stateManager.validate();
      let errors = stateManager.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);

      stateManager.setAnswer('q1', 'abc');
      stateManager.validate();
      errors = stateManager.getValidationErrors();
      expect(errors.length).toBe(0);
    });

    it('should handle multiple validation errors for same question', () => {
      stateManager.loadQuestionnaire({
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

      stateManager.setAnswer('q1', 5);
      const result = stateManager.validate();
      expect(result.isValid).toBe(false);
    });

    it('should handle validation with invalid min/max configuration', () => {
      stateManager.loadQuestionnaire({
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

      stateManager.setAnswer('q1', 50);
      const result = stateManager.validate();
      expect(result.isValid).toBe(false);
    });

    it('should handle validation with negative min/max', () => {
      stateManager.loadQuestionnaire({
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

      stateManager.setAnswer('q1', -50);
      const result = stateManager.validate();
      expect(result.isValid).toBe(true);
    });
  });

  describe('Actions Edge Cases', () => {
    it('should handle action with invalid condition', () => {
      stateManager.loadQuestionnaire({
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

      expect(() => stateManager.setAnswer('q1', 25)).not.toThrow();
    });

    it('should handle multiple conflicting actions', () => {
      stateManager.loadQuestionnaire({
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

      stateManager.setAnswer('q1', 15);
      let questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(true);

      stateManager.setAnswer('q1', 25);
      questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(false);
    });

    it('should handle action referencing non-existent field', () => {
      stateManager.loadQuestionnaire({
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

      expect(() => stateManager.setAnswer('q1', 'test')).not.toThrow();
    });

    it('should handle nested conditions in actions', () => {
      stateManager.loadQuestionnaire({
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

      stateManager.setAnswer('q1', 25);
      stateManager.setAnswer('q2', 60);
      let questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q3')).toBe(true);

      stateManager.setAnswer('q2', 40);
      questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q3')).toBe(false);
    });
  });

  describe('Formula Edge Cases', () => {
    it('should handle formula with missing referenced fields', () => {
      stateManager.loadQuestionnaire({
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

      stateManager.setAnswer('q1', 10);
      const state = stateManager.getState();
      expect(state.formulaResults).toBeDefined();
    });

    it('should handle formula with circular dependency', () => {
      stateManager.loadQuestionnaire({
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

      stateManager.setAnswer('q1', 10);
      const state = stateManager.getState();
      expect(state.formulaResults).toBeDefined();
    });

    it('should handle formula evaluation order with dependencies', () => {
      stateManager.loadQuestionnaire({
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

      stateManager.setAnswer('q1', 5);
      stateManager.setAnswer('q2', 10);
      const state = stateManager.getState();
      expect(state.formulaResults.length).toBe(2);
    });

    it('should handle formula with division by zero', () => {
      stateManager.loadQuestionnaire({
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

      stateManager.setAnswer('q1', 10);
      stateManager.setAnswer('q2', 0);
      const state = stateManager.getState();
      expect(state.formulaResults).toBeDefined();
    });

    it('should handle formula results update on answer change', () => {
      stateManager.loadQuestionnaire(questionnaireWithFormulas);
      stateManager.setAnswer('q1', 10);
      stateManager.setAnswer('q2', 20);

      const state1 = stateManager.getState();
      expect(state1.formulaResults[0].value).toBe(30);

      stateManager.setAnswer('q3', 30);
      const state2 = stateManager.getState();
      expect(state2.formulaResults[0].value).toBe(60);
    });
  });

  describe('Subscription Edge Cases', () => {
    it('should handle multiple subscriptions', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);

      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      stateManager.subscribe(callback1);
      stateManager.subscribe(callback2);
      stateManager.subscribe(callback3);

      stateManager.setAnswer('q1', 'test');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      expect(callback3).toHaveBeenCalled();
    });

    it('should handle unsubscribing', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsub1 = stateManager.subscribe(callback1);
      stateManager.subscribe(callback2);

      unsub1();
      stateManager.setAnswer('q1', 'test');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle error in subscription callback', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);

      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();

      stateManager.subscribe(errorCallback);
      stateManager.subscribe(normalCallback);

      expect(() => stateManager.setAnswer('q1', 'test')).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
    });

    it('should handle rapid state changes with subscriptions', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);

      const callback = vi.fn();
      stateManager.subscribe(callback);

      for (let i = 0; i < 50; i++) {
        stateManager.setAnswer('q1', `value${i}`);
      }

      expect(callback).toHaveBeenCalled();
    });

    it('should handle subscription during state change', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);

      let newCallback: any;
      const callback = vi.fn(() => {
        if (!newCallback) {
          newCallback = vi.fn();
          stateManager.subscribe(newCallback);
        }
      });

      stateManager.subscribe(callback);
      stateManager.setAnswer('q1', 'test');

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Reset Edge Cases', () => {
    it('should handle reset with actions and formulas', () => {
      stateManager.loadQuestionnaire({
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

      stateManager.setAnswer('q1', 15);
      stateManager.setAnswer('q2', 'test');
      stateManager.reset();

      expect(stateManager.getAnswer('q1')).toBeUndefined();
      expect(stateManager.getAnswer('q2')).toBeUndefined();
      const questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(false);
    });

    it('should handle reset without questionnaire loaded', () => {
      expect(() => stateManager.reset()).not.toThrow();
    });

    it('should handle reset clearing validation errors', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
      stateManager.setAnswer('q1', '');
      stateManager.validate();

      let errors = stateManager.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);

      stateManager.reset();
      errors = stateManager.getValidationErrors();
      expect(errors.length).toBe(2);
    });
  });

  describe('Question Registry Edge Cases', () => {
    it('should handle questions with duplicate IDs', () => {
      stateManager.loadQuestionnaire({
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
      });

      const questions = stateManager.getCurrentQuestions();
      expect(questions).toHaveLength(1);
    });

    it('should handle questions becoming visible/invisible', () => {
      stateManager.loadQuestionnaire(questionnaireWithActions);
      stateManager.setAnswer('q1', 15);

      let questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(false);

      stateManager.setAnswer('q1', 25);
      questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(true);
    });
  });

  describe('State Consistency Edge Cases', () => {
    it('should maintain state consistency during rapid updates', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);

      for (let i = 0; i < 100; i++) {
        stateManager.setAnswer('q1', `value${i}`);
        stateManager.setAnswer('q2', i);
      }

      const state = stateManager.getState();
      expect(state.answers.q1).toBe('value99');
      expect(state.answers.q2).toBe(99);
    });

    it('should handle concurrent answer updates', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);

      stateManager.setAnswer('q1', 'value1');
      stateManager.setAnswer('q2', 42);
      stateManager.setAnswer('q3', 'Option A');

      const allAnswers = stateManager.getAllAnswers();
      expect(Object.keys(allAnswers).length).toBe(3);
    });

    it('should handle state updates with formulas and actions', () => {
      stateManager.loadQuestionnaire({
        id: 'test',
        title: 'Test',
        sections: [{
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'number', label: 'Q1' },
            { id: 'q2', type: 'number', label: 'Q2' },
            { id: 'q3', type: 'text', label: 'Q3', visible: false }
          ]
        }],
        formulas: [{ id: 'sum', expression: 'sum(q1, q2)' }],
        actions: [{ type: 'show', condition: 'sum > 10', target: 'q3' }]
      });

      stateManager.setAnswer('q1', 5);
      stateManager.setAnswer('q2', 10);

      const state = stateManager.getState();
      expect(state.formulaResults.length).toBe(1);
      const questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q3')).toBe(true);
    });
  });
});
