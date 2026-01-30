import { describe, it, expect } from 'vitest';
import { createQuestion, getRegisteredTypes, isRegistered, UnknownQuestionTypeError } from '../../questions';
import { createTextQuestion as createTestTextQuestion, createMultiSelectQuestion as createTestMultiSelectQuestion, createFileQuestion as createTestFileQuestion } from '../fixtures/helpers';

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

    it('should create multi-select question from registry', () => {
      const questionData = createTestMultiSelectQuestion({ id: 'ms1', label: 'Select many', options: ['A', 'B', 'C'] });
      const question = createQuestion(questionData);

      expect(question.id).toBe('ms1');
      expect(question.type).toBe('multi-select');
      expect(question.getDefaultValue()).toEqual([]);
    });

    it('should create file question from registry', () => {
      const questionData = createTestFileQuestion({ id: 'f1', label: 'Upload', allowedExtensions: ['.pdf'] });
      const question = createQuestion(questionData);

      expect(question.id).toBe('f1');
      expect(question.type).toBe('file');
      expect(question.getDefaultValue()).toBeUndefined();
    });
  });

  describe('getRegisteredTypes', () => {
    it('should return all registered types', () => {
      const types = getRegisteredTypes();

      expect(types).toContain('text');
      expect(types).toContain('number');
      expect(types).toContain('multiple-choice');
      expect(types).toContain('multi-select');
      expect(types).toContain('file');
      expect(types.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('isRegistered', () => {
    it('should return true for registered type', () => {
      expect(isRegistered('text')).toBe(true);
      expect(isRegistered('number')).toBe(true);
      expect(isRegistered('multiple-choice')).toBe(true);
      expect(isRegistered('multi-select')).toBe(true);
      expect(isRegistered('file')).toBe(true);
    });

    it('should return false for unregistered type', () => {
      expect(isRegistered('unknown' as any)).toBe(false);
    });
  });
});
