import { describe, it, expect } from 'vitest';
import { createQuestion, getRegisteredTypes, isRegistered, UnknownQuestionTypeError } from '../../questions';
import { createTextQuestion as createTestTextQuestion } from '../fixtures/helpers';

describe('Question Registry', () => {
  describe('register', () => {
    it('should register a question type', () => {
      expect(isRegistered('text')).toBe(true);
    });
  });

  describe('createQuestion', () => {
    it('should create question from registry', () => {
      const questionData = createTestTextQuestion({ id: 'q1', label: 'Test' });
      const question = createQuestion(questionData);

      expect(question).toBeDefined();
      expect(question.id).toBe('q1');
      expect(question.type).toBe('text');
    });

    it('should throw error for unknown question type', () => {
      const invalidData = { id: 'q1', type: 'unknown-type', label: 'Test' } as any;

      expect(() => createQuestion(invalidData)).toThrow(UnknownQuestionTypeError);
      expect(() => createQuestion(invalidData)).toThrow('Unknown question type: unknown-type');
    });
  });

  describe('getRegisteredTypes', () => {
    it('should return all registered types', () => {
      const types = getRegisteredTypes();

      expect(types).toContain('text');
      expect(types).toContain('number');
      expect(types).toContain('multiple-choice');
      expect(types.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('isRegistered', () => {
    it('should return true for registered type', () => {
      expect(isRegistered('text')).toBe(true);
      expect(isRegistered('number')).toBe(true);
      expect(isRegistered('multiple-choice')).toBe(true);
    });

    it('should return false for unregistered type', () => {
      expect(isRegistered('unknown' as any)).toBe(false);
    });
  });
});
