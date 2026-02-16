import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStateManager } from '../../state/stateManager';
import { createFormulaEngine } from '../../formulas/engine';
import { validateAll } from '../../validation/engine';
import { simpleQuestionnaire, questionnaireWithActions, questionnaireWithFormulas } from '../fixtures/questionnaires';
import { createTextQuestion } from '../../questions/textQuestion';
import { createTextQuestion as createTestTextQuestion } from '../fixtures/helpers';
import type { AnswerValue } from '../../types/answers';

describe('StateManager', () => {
  let stateManager: ReturnType<typeof createStateManager>;
  let formulaEngine: ReturnType<typeof createFormulaEngine>;

  beforeEach(() => {
    formulaEngine = createFormulaEngine();

    const validationEngine = {
      validateAll,
    };

    stateManager = createStateManager({
      validationEngine,
      formulaEngine,
    });
  });

  describe('loadQuestionnaire', () => {
    it('should load questionnaire', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);

      const questions = stateManager.getCurrentQuestions();
      expect(questions).toHaveLength(3);
    });

    it('should register all questions', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);

      const questions = stateManager.getCurrentQuestions();
      expect(questions.map(q => q.id)).toEqual(['q1', 'q2', 'q3']);
    });

    it('should clear previous answers', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
      stateManager.setAnswer('q1', 'test');
      stateManager.loadQuestionnaire(simpleQuestionnaire);

      expect(stateManager.getAnswer('q1')).toBeUndefined();
    });

    it('should register actions when loading questionnaire', () => {
      stateManager.loadQuestionnaire(questionnaireWithActions);

      const questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(false);
    });
  });

  describe('setAnswer and getAnswer', () => {
    beforeEach(() => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
    });

    it('should set and get answer', () => {
      stateManager.setAnswer('q1', 'test value');

      expect(stateManager.getAnswer('q1')).toBe('test value');
    });

    it('should update existing answer', () => {
      stateManager.setAnswer('q1', 'initial');
      stateManager.setAnswer('q1', 'updated');

      expect(stateManager.getAnswer('q1')).toBe('updated');
    });

    it('should handle different value types', () => {
      stateManager.setAnswer('q1', 'text');
      stateManager.setAnswer('q2', 42);

      expect(stateManager.getAnswer('q1')).toBe('text');
      expect(stateManager.getAnswer('q2')).toBe(42);
    });
  });

  describe('getAllAnswers', () => {
    beforeEach(() => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
    });

    it('should return all answers', () => {
      stateManager.setAnswer('q1', 'test1');
      stateManager.setAnswer('q2', 42);

      const all = stateManager.getAllAnswers();

      expect(all).toEqual({
        q1: 'test1',
        q2: 42,
      });
    });

    it('should return empty object when no answers', () => {
      const all = stateManager.getAllAnswers();

      expect(all).toEqual({});
    });
  });

  describe('getProgress', () => {
    beforeEach(() => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
    });

    it('should track progress (answered vs total)', () => {
      const progress1 = stateManager.getProgress();
      expect(progress1.total).toBe(3);
      expect(progress1.answered).toBe(0);
      expect(progress1.percentage).toBe(0);

      stateManager.setAnswer('q1', 'test');
      const progress2 = stateManager.getProgress();
      expect(progress2.answered).toBe(1);
      expect(progress2.percentage).toBe(33);

      stateManager.setAnswer('q2', 42);
      stateManager.setAnswer('q3', 'Option A');
      const progress3 = stateManager.getProgress();
      expect(progress3.answered).toBe(3);
      expect(progress3.percentage).toBe(100);
    });

    it('should only count visible questions', () => {
      stateManager.loadQuestionnaire(questionnaireWithActions);
      stateManager.setAnswer('q1', 15);

      const progress = stateManager.getProgress();
      expect(progress.total).toBe(1);
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
    });

    it('should validate all answers', () => {
      stateManager.setAnswer('q1', 'test');
      stateManager.setAnswer('q3', 'Option A');

      const result = stateManager.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return validation errors', () => {
      stateManager.setAnswer('q1', '');

      const result = stateManager.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should update validation result', () => {
      stateManager.setAnswer('q1', '');
      stateManager.validate();

      const errors = stateManager.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('getValidationErrors', () => {
    beforeEach(() => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
    });

    it('should return empty array on load', () => {
      const errors = stateManager.getValidationErrors();
      expect(errors).toHaveLength(0);
    });

    it('should return validation errors', () => {
      stateManager.setAnswer('q1', '');
      stateManager.validate();

      const errors = stateManager.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].questionId).toBe('q1');
    });

    it('should return empty array when no errors', () => {
      stateManager.setAnswer('q1', 'test');
      stateManager.setAnswer('q3', 'Option A');
      stateManager.validate();

      const errors = stateManager.getValidationErrors();
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateSection', () => {
    beforeEach(() => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
    });

    it('should return invalid when section has required empty fields', () => {
      const result = stateManager.validateSection('section-1');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.questionId === 'q1')).toBe(true);
    });

    it('should merge section errors into state', () => {
      stateManager.validateSection('section-1');

      const errors = stateManager.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should return valid when section fields are filled', () => {
      stateManager.setAnswer('q1', 'test');
      stateManager.setAnswer('q3', 'Option A');
      const result = stateManager.validateSection('section-1');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return empty errors for unknown section', () => {
      const result = stateManager.validateSection('unknown-section');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('executeActions', () => {
    it('should execute actions on answer changes', () => {
      stateManager.loadQuestionnaire(questionnaireWithActions);
      stateManager.setAnswer('q1', 25);

      const questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(true);
    });

    it('should hide questions when condition is false', () => {
      stateManager.loadQuestionnaire(questionnaireWithActions);
      stateManager.setAnswer('q1', 15);

      const questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(false);
    });
  });

  describe('calculateFormulaResults', () => {
    it('should calculate formula results', () => {
      stateManager.loadQuestionnaire(questionnaireWithFormulas);
      stateManager.setAnswer('q1', 10);
      stateManager.setAnswer('q2', 20);
      stateManager.setAnswer('q3', 30);

      const state = stateManager.getState();
      expect(state.formulaResults).toHaveLength(1);
      expect(state.formulaResults[0].formulaId).toBe('total');
      expect(state.formulaResults[0].value).toBe(60);
    });

    it('should update formula results on answer change', () => {
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

  describe('subscribe', () => {
    it('should subscribe to state changes', () => {
      const callback = vi.fn();
      stateManager.subscribe(callback);

      stateManager.loadQuestionnaire(simpleQuestionnaire);

      expect(callback).toHaveBeenCalled();
    });

    it('should notify on answer changes', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
      const callback = vi.fn();
      stateManager.subscribe(callback);

      stateManager.setAnswer('q1', 'test');

      expect(callback).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      const callback = vi.fn();
      const unsubscribe = stateManager.subscribe(callback);

      unsubscribe();
      stateManager.loadQuestionnaire(simpleQuestionnaire);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset state', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
      stateManager.setAnswer('q1', 'test');
      stateManager.setAnswer('q2', 42);

      stateManager.reset();

      expect(stateManager.getAnswer('q1')).toBeUndefined();
      expect(stateManager.getAnswer('q2')).toBeUndefined();
    });

    it('should reload questionnaire on reset', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
      stateManager.setAnswer('q1', 'test');

      stateManager.reset();

      const questions = stateManager.getCurrentQuestions();
      expect(questions).toHaveLength(3);
    });
  });

  describe('getCurrentQuestions', () => {
    it('should return visible questions only', () => {
      stateManager.loadQuestionnaire(questionnaireWithActions);

      const questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(false);
    });

    it('should update visible questions after actions', () => {
      stateManager.loadQuestionnaire(questionnaireWithActions);
      stateManager.setAnswer('q1', 25);

      const questions = stateManager.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(true);
    });
  });

  describe('getState', () => {
    it('should return complete state', () => {
      stateManager.loadQuestionnaire(simpleQuestionnaire);
      stateManager.setAnswer('q1', 'test');

      const state = stateManager.getState();

      expect(state.questionnaire).toBeDefined();
      expect(state.answers).toBeDefined();
      expect(state.progress).toBeDefined();
      expect(state.errors).toBeDefined();
      expect(state.formulaResults).toBeDefined();
    });
  });
});
