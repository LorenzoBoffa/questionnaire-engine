import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createQuestionnaireEngine, NotInitializedError, QuestionNotFoundError, InvalidQuestionnaireError } from '../../engine';
import type { Questionnaire } from '../../types';
import {
  simpleQuestionnaire,
  questionnaireWithValidation,
  questionnaireWithFormulas,
  questionnaireWithActions,
  complexQuestionnaire,
  invalidQuestionnaireMissingId,
} from '../fixtures/questionnaires';

describe('QuestionnaireEngine', () => {
  let engine: ReturnType<typeof createQuestionnaireEngine>;

  beforeEach(() => {
    engine = createQuestionnaireEngine();
  });

  describe('load', () => {
    it('should load questionnaire from object', () => {
      engine.load(simpleQuestionnaire);

      const questions = engine.getCurrentQuestions();
      expect(questions).toHaveLength(3);
    });

    it('should throw InvalidQuestionnaireError for invalid questionnaire', () => {
      expect(() => engine.load(invalidQuestionnaireMissingId as any)).toThrow(InvalidQuestionnaireError);
    });

    it('should validate questionnaire structure', () => {
      const invalid = { id: 'test', title: 'Test' };

      expect(() => engine.load(invalid as any)).toThrow(InvalidQuestionnaireError);
    });
  });

  describe('loadFromJSON', () => {
    it('should load questionnaire from JSON string', () => {
      const json = JSON.stringify(simpleQuestionnaire);
      engine.loadFromJSON(json);

      const questions = engine.getCurrentQuestions();
      expect(questions).toHaveLength(3);
    });

    it('should load questionnaire from object', () => {
      engine.loadFromJSON(simpleQuestionnaire);

      const questions = engine.getCurrentQuestions();
      expect(questions).toHaveLength(3);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => engine.loadFromJSON('{ invalid json }')).toThrow();
    });
  });

  describe('getCurrentQuestions', () => {
    beforeEach(() => {
      engine.load(simpleQuestionnaire);
    });

    it('should get current visible questions', () => {
      const questions = engine.getCurrentQuestions();

      expect(questions).toHaveLength(3);
      expect(questions.map(q => q.id)).toEqual(['q1', 'q2', 'q3']);
    });

    it('should throw NotInitializedError when not initialized', () => {
      const newEngine = createQuestionnaireEngine();

      expect(() => newEngine.getCurrentQuestions()).toThrow(NotInitializedError);
    });

    it('should filter out hidden questions', () => {
      engine.load(questionnaireWithActions);

      const questions = engine.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(false);
    });
  });

  describe('setAnswer and getAnswer', () => {
    beforeEach(() => {
      engine.load(simpleQuestionnaire);
    });

    it('should set and get answer', () => {
      engine.setAnswer('q1', 'test value');

      expect(engine.getAnswer('q1')).toBe('test value');
    });

    it('should throw NotInitializedError when not initialized', () => {
      const newEngine = createQuestionnaireEngine();

      expect(() => newEngine.setAnswer('q1', 'test')).toThrow(NotInitializedError);
    });

    it('should throw QuestionNotFoundError for non-existent question', () => {
      expect(() => engine.setAnswer('nonexistent', 'test')).toThrow(QuestionNotFoundError);
    });

    it('should handle different value types', () => {
      engine.setAnswer('q1', 'text');
      engine.setAnswer('q2', 42);
      engine.setAnswer('q3', 'Option A');

      expect(engine.getAnswer('q1')).toBe('text');
      expect(engine.getAnswer('q2')).toBe(42);
      expect(engine.getAnswer('q3')).toBe('Option A');
    });
  });

  describe('getAllAnswers', () => {
    beforeEach(() => {
      engine.load(simpleQuestionnaire);
    });

    it('should get all answers', () => {
      engine.setAnswer('q1', 'test1');
      engine.setAnswer('q2', 42);

      const all = engine.getAllAnswers();

      expect(all).toEqual({
        q1: 'test1',
        q2: 42,
      });
    });

    it('should return empty object when no answers', () => {
      const all = engine.getAllAnswers();

      expect(all).toEqual({});
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      engine.load(simpleQuestionnaire);
    });

    it('should validate all answers', () => {
      engine.setAnswer('q1', 'test');
      engine.setAnswer('q3', 'Option A');

      const result = engine.validate();

      expect(result.isValid).toBe(true);
    });

    it('should return validation errors', () => {
      engine.setAnswer('q1', '');

      const result = engine.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getValidationErrors', () => {
    beforeEach(() => {
      engine.load(simpleQuestionnaire);
    });

    it('should get validation errors', () => {
      engine.setAnswer('q1', '');
      engine.validate();

      const errors = engine.getValidationErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].questionId).toBe('q1');
    });

    it('should return empty array when no errors', () => {
      engine.setAnswer('q1', 'test');
      engine.setAnswer('q3', 'Option A');
      engine.validate();

      const errors = engine.getValidationErrors();
      expect(errors).toHaveLength(0);
    });
  });

  describe('getProgress', () => {
    beforeEach(() => {
      engine.load(simpleQuestionnaire);
    });

    it('should get progress', () => {
      const progress1 = engine.getProgress();
      expect(progress1.total).toBe(3);
      expect(progress1.answered).toBe(0);
      expect(progress1.percentage).toBe(0);

      engine.setAnswer('q1', 'test');
      const progress2 = engine.getProgress();
      expect(progress2.answered).toBe(1);
      expect(progress2.percentage).toBe(33);
    });

    it('should calculate percentage correctly', () => {
      engine.setAnswer('q1', 'test');
      engine.setAnswer('q2', 42);
      engine.setAnswer('q3', 'Option A');

      const progress = engine.getProgress();
      expect(progress.answered).toBe(3);
      expect(progress.percentage).toBe(100);
    });
  });

  describe('show/hide actions', () => {
    it('should handle show/hide actions', () => {
      engine.load(questionnaireWithActions);

      let questions = engine.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(false);

      engine.setAnswer('q1', 25);
      questions = engine.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(true);
    });

    it('should hide questions when condition is false', () => {
      engine.load(questionnaireWithActions);
      engine.setAnswer('q1', 15);

      const questions = engine.getCurrentQuestions();
      expect(questions.some(q => q.id === 'q2')).toBe(false);
    });
  });

  describe('formulas', () => {
    it('should calculate formulas', () => {
      engine.load(questionnaireWithFormulas);
      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 20);
      engine.setAnswer('q3', 30);

      const questionnaire = engine.getQuestionnaire();
      expect(questionnaire?.formulas).toBeDefined();
    });
  });

  describe('subscribe', () => {
    it('should subscribe to state changes', () => {
      engine.load(simpleQuestionnaire);
      const callback = vi.fn();
      engine.subscribe(callback);

      engine.setAnswer('q1', 'test');

      expect(callback).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      engine.load(simpleQuestionnaire);
      const callback = vi.fn();
      const unsubscribe = engine.subscribe(callback);

      unsubscribe();
      engine.setAnswer('q1', 'test');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      engine.load(simpleQuestionnaire);
    });

    it('should reset questionnaire', () => {
      engine.setAnswer('q1', 'test');
      engine.setAnswer('q2', 42);

      engine.reset();

      expect(engine.getAnswer('q1')).toBeUndefined();
      expect(engine.getAnswer('q2')).toBeUndefined();
    });

    it('should reload questionnaire on reset', () => {
      engine.setAnswer('q1', 'test');

      engine.reset();

      const questions = engine.getCurrentQuestions();
      expect(questions).toHaveLength(3);
    });
  });

  describe('destroy', () => {
    it('should destroy engine', () => {
      engine.load(simpleQuestionnaire);
      engine.destroy();

      expect(() => engine.getCurrentQuestions()).toThrow(NotInitializedError);
    });
  });

  describe('getQuestion', () => {
    beforeEach(() => {
      engine.load(simpleQuestionnaire);
    });

    it('should get question by ID', () => {
      const question = engine.getQuestion('q1');

      expect(question).toBeDefined();
      expect(question?.id).toBe('q1');
      expect(question?.type).toBe('text');
    });

    it('should return undefined for non-existent question', () => {
      const question = engine.getQuestion('nonexistent');

      expect(question).toBeUndefined();
    });
  });

  describe('getSection', () => {
    beforeEach(() => {
      engine.load(simpleQuestionnaire);
    });

    it('should get section by ID', () => {
      const section = engine.getSection('section-1');

      expect(section).toBeDefined();
      expect(section?.id).toBe('section-1');
      expect(section?.title).toBe('Basic Info');
    });

    it('should return undefined for non-existent section', () => {
      const section = engine.getSection('nonexistent');

      expect(section).toBeUndefined();
    });
  });

  describe('getVisibleQuestionsForSection', () => {
    beforeEach(() => {
      engine.load(simpleQuestionnaire);
    });

    it('should get visible questions for section', () => {
      const questions = engine.getVisibleQuestionsForSection('section-1');

      expect(questions).toHaveLength(3);
      expect(questions.map(q => q.id)).toEqual(['q1', 'q2', 'q3']);
    });

    it('should return empty array for non-existent section', () => {
      const questions = engine.getVisibleQuestionsForSection('nonexistent');

      expect(questions).toHaveLength(0);
    });

    it('should filter out hidden questions', () => {
      engine.load(questionnaireWithActions);
      engine.setAnswer('q1', 15);

      const questions = engine.getVisibleQuestionsForSection('section-1');
      expect(questions.some(q => q.id === 'q2')).toBe(false);
    });
  });

  describe('isQuestionVisible', () => {
    beforeEach(() => {
      engine.load(questionnaireWithActions);
    });

    it('should check if question is visible', () => {
      expect(engine.isQuestionVisible('q1')).toBe(true);
      expect(engine.isQuestionVisible('q2')).toBe(false);
    });

    it('should return false for non-existent question', () => {
      expect(engine.isQuestionVisible('nonexistent')).toBe(false);
    });

    it('should update visibility after actions', () => {
      engine.setAnswer('q1', 25);

      expect(engine.isQuestionVisible('q2')).toBe(true);
    });
  });

  describe('hasAnswer', () => {
    beforeEach(() => {
      engine.load(simpleQuestionnaire);
    });

    it('should check if question has answer', () => {
      expect(engine.hasAnswer('q1')).toBe(false);

      engine.setAnswer('q1', 'test');

      expect(engine.hasAnswer('q1')).toBe(true);
    });

    it('should return false for empty answers', () => {
      engine.setAnswer('q1', '');

      expect(engine.hasAnswer('q1')).toBe(false);
    });

    it('should return false for null answers', () => {
      engine.setAnswer('q1', null);

      expect(engine.hasAnswer('q1')).toBe(false);
    });
  });

  describe('getQuestionnaire', () => {
    it('should return loaded questionnaire', () => {
      engine.load(simpleQuestionnaire);

      const questionnaire = engine.getQuestionnaire();

      expect(questionnaire).toBeDefined();
      expect(questionnaire?.id).toBe('test-1');
    });

    it('should return null when no questionnaire loaded', () => {
      const questionnaire = engine.getQuestionnaire();

      expect(questionnaire).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should throw NotInitializedError for operations before load', () => {
      const newEngine = createQuestionnaireEngine();

      expect(() => newEngine.getCurrentQuestions()).toThrow(NotInitializedError);
      expect(() => newEngine.setAnswer('q1', 'test')).toThrow(NotInitializedError);
      expect(() => newEngine.validate()).toThrow(NotInitializedError);
      expect(() => newEngine.getProgress()).toThrow(NotInitializedError);
    });

    it('should throw QuestionNotFoundError for invalid question ID', () => {
      engine.load(simpleQuestionnaire);

      expect(() => engine.setAnswer('nonexistent', 'test')).toThrow(QuestionNotFoundError);
    });

    it('should throw InvalidQuestionnaireError for invalid structure', () => {
      expect(() => engine.load(invalidQuestionnaireMissingId as any)).toThrow(InvalidQuestionnaireError);
    });
  });

  describe('Complete Workflow', () => {
    it('should handle complete workflow: load → answer → validate → get results', () => {
      engine.load(complexQuestionnaire);

      engine.setAnswer('name', 'John Doe');
      engine.setAnswer('age', 25);
      engine.setAnswer('country', 'USA');
      engine.setAnswer('num1', 10);
      engine.setAnswer('num2', 20);

      const progress = engine.getProgress();
      expect(progress.answered).toBeGreaterThan(0);

      const result = engine.validate();
      expect(result.isValid).toBe(true);

      const allAnswers = engine.getAllAnswers();
      expect(allAnswers.name).toBe('John Doe');
      expect(allAnswers.age).toBe(25);
    });

    it('should handle workflow with actions and formulas', () => {
      engine.load(complexQuestionnaire);

      engine.setAnswer('num1', 15);
      const questions1 = engine.getCurrentQuestions();
      expect(questions1.some(q => q.id === 'conditional')).toBe(true);

      const allAnswers = engine.getAllAnswers();
      expect(allAnswers.num1).toBe(15);
    });
  });

  describe('multi-select and file question types', () => {
    const questionnaireWithNewTypes: Questionnaire = {
      id: 'test-new-types',
      title: 'Questionnaire with multi-select and file',
      sections: [
        {
          id: 's1',
          title: 'Section',
          questions: [
            { id: 'q1', type: 'text', label: 'Name' },
            {
              id: 'q2',
              type: 'multi-select',
              label: 'Select options',
              options: ['A', 'B', 'C'],
              required: true,
              minSelections: 1,
              maxSelections: 2,
            },
            {
              id: 'q3',
              type: 'file',
              label: 'Upload file',
              allowedExtensions: ['.pdf'],
              maxSizeBytes: 1000,
              required: false,
            },
          ],
        },
      ],
    };

    it('should load questionnaire with multi-select and file questions', () => {
      engine.load(questionnaireWithNewTypes);

      const questions = engine.getCurrentQuestions();
      expect(questions).toHaveLength(3);
      expect(questions.map(q => q.type)).toContain('multi-select');
      expect(questions.map(q => q.type)).toContain('file');
    });

    it('should setAnswer and getAnswer for multi-select (string[])', () => {
      engine.load(questionnaireWithNewTypes);

      engine.setAnswer('q2', ['A', 'B']);
      expect(engine.getAnswer('q2')).toEqual(['A', 'B']);

      const validation = engine.validate();
      expect(validation.isValid).toBe(true);
    });

    it('should setAnswer and getAnswer for file (metadata object)', () => {
      engine.load(questionnaireWithNewTypes);

      const fileMeta = { name: 'doc.pdf', size: 500, type: 'application/pdf' };
      engine.setAnswer('q3', fileMeta);
      expect(engine.getAnswer('q3')).toEqual(fileMeta);
    });

    it('should validate multi-select required and minSelections', () => {
      engine.load(questionnaireWithNewTypes);

      engine.setAnswer('q1', 'User');
      engine.setAnswer('q2', []);
      const validation = engine.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.questionId === 'q2')).toBe(true);

      engine.setAnswer('q2', ['A']);
      const validation2 = engine.validate();
      expect(validation2.isValid).toBe(true);
    });

    it('should return all answers including multi-select and file', () => {
      engine.load(questionnaireWithNewTypes);

      engine.setAnswer('q1', 'User');
      engine.setAnswer('q2', ['A', 'B']);
      engine.setAnswer('q3', { name: 'doc.pdf', size: 500, type: 'application/pdf' });

      const all = engine.getAllAnswers();
      expect(all.q1).toBe('User');
      expect(all.q2).toEqual(['A', 'B']);
      expect(all.q3).toEqual({ name: 'doc.pdf', size: 500, type: 'application/pdf' });
    });
  });
});
