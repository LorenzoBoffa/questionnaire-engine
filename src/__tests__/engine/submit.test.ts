import { describe, it, expect, beforeEach } from 'vitest';
import { createQuestionnaireEngine, NotInitializedError } from '../../engine';
import { simpleQuestionnaire, questionnaireWithValidation } from '../fixtures/questionnaires';

describe('QuestionnaireEngine - submit', () => {
  let engine: ReturnType<typeof createQuestionnaireEngine>;

  beforeEach(() => {
    engine = createQuestionnaireEngine();
  });

  describe('submit', () => {
    it('should throw NotInitializedError when not initialized', () => {
      expect(() => engine.submit()).toThrow(NotInitializedError);
    });

    it('should return valid result with answers when all required fields are filled', () => {
      engine.load(simpleQuestionnaire);
      engine.setAnswer('q1', 'John Doe');
      engine.setAnswer('q3', 'Option A');

      const result = engine.submit();

      expect(result.isValid).toBe(true);
      expect(result.answers).toHaveLength(2);
      expect(result.answers.find(a => a.questionId === 'q1')?.value).toBe('John Doe');
      expect(result.answers.find(a => a.questionId === 'q3')?.value).toBe('Option A');
      expect(result.answers[0].timestamp).toBeDefined();
    });

    it('should return invalid result with errors when required fields are missing', () => {
      engine.load(simpleQuestionnaire);
      engine.setAnswer('q2', 25);

      const result = engine.submit();

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.answers).toHaveLength(1);
    });

    it('should return invalid result when validation fails', () => {
      engine.load(questionnaireWithValidation);
      engine.setAnswer('q1', 'A');
      engine.setAnswer('q2', 15);

      const result = engine.submit();

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should return all answers including non-visible questions', () => {
      engine.load(simpleQuestionnaire);
      engine.setAnswer('q1', 'John');
      engine.setAnswer('q2', 30);
      engine.setAnswer('q3', 'Option B');

      const result = engine.submit();

      expect(result.isValid).toBe(true);
      expect(result.answers.length).toBeGreaterThanOrEqual(2);
    });

    it('should not include empty answers in result', () => {
      engine.load(simpleQuestionnaire);
      engine.setAnswer('q1', 'John');
      engine.setAnswer('q2', null);
      engine.setAnswer('q3', 'Option A');

      const result = engine.submit();

      expect(result.isValid).toBe(true);
      const q2Answer = result.answers.find(a => a.questionId === 'q2');
      expect(q2Answer).toBeUndefined();
    });

    it('should include timestamp in all answers', () => {
      engine.load(simpleQuestionnaire);
      engine.setAnswer('q1', 'John');
      engine.setAnswer('q3', 'Option A');

      const result = engine.submit();

      expect(result.isValid).toBe(true);
      result.answers.forEach(answer => {
        expect(answer.timestamp).toBeDefined();
        expect(typeof answer.timestamp).toBe('number');
      });
    });
  });
});
