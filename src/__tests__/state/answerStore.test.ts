import { describe, it, expect, vi } from 'vitest';
import { createAnswerStore } from '../../state/answerStore';
import type { AnswerValue } from '../../types/answers';

describe('AnswerStore', () => {
  describe('setAnswer', () => {
    it('should store answer by question ID', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', 'test value');

      expect(store.getAnswer('q1')).toBe('test value');
    });

    it('should update existing answer', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', 'initial');
      store.setAnswer('q1', 'updated');

      expect(store.getAnswer('q1')).toBe('updated');
    });

    it('should handle different value types', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', 'text');
      store.setAnswer('q2', 42);
      store.setAnswer('q3', null);

      expect(store.getAnswer('q1')).toBe('text');
      expect(store.getAnswer('q2')).toBe(42);
      expect(store.getAnswer('q3')).toBe(null);
    });
  });

  describe('getAnswer', () => {
    it('should retrieve answer by question ID', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', 'test');

      expect(store.getAnswer('q1')).toBe('test');
    });

    it('should return undefined for non-existent answer', () => {
      const store = createAnswerStore();

      expect(store.getAnswer('nonexistent')).toBeUndefined();
    });
  });

  describe('hasAnswer', () => {
    it('should return true when answer exists', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', 'test');

      expect(store.hasAnswer('q1')).toBe(true);
    });

    it('should return false when answer is null', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', null);

      expect(store.hasAnswer('q1')).toBe(false);
    });

    it('should return false when answer is undefined', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', undefined);

      expect(store.hasAnswer('q1')).toBe(false);
    });

    it('should return false when answer is empty string', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', '');

      expect(store.hasAnswer('q1')).toBe(false);
    });

    it('should return false for non-existent answer', () => {
      const store = createAnswerStore();

      expect(store.hasAnswer('nonexistent')).toBe(false);
    });
  });

  describe('clearAnswer', () => {
    it('should clear single answer', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', 'test');
      store.setAnswer('q2', 'test2');

      store.clearAnswer('q1');

      expect(store.getAnswer('q1')).toBeUndefined();
      expect(store.getAnswer('q2')).toBe('test2');
    });

    it('should handle clearing non-existent answer', () => {
      const store = createAnswerStore();

      expect(() => store.clearAnswer('nonexistent')).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('should clear all answers', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', 'test1');
      store.setAnswer('q2', 'test2');
      store.setAnswer('q3', 'test3');

      store.clearAll();

      expect(store.getAnswer('q1')).toBeUndefined();
      expect(store.getAnswer('q2')).toBeUndefined();
      expect(store.getAnswer('q3')).toBeUndefined();
    });

    it('should handle clearing empty store', () => {
      const store = createAnswerStore();

      expect(() => store.clearAll()).not.toThrow();
    });
  });

  describe('getAllAnswers', () => {
    it('should return all answers', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', 'test1');
      store.setAnswer('q2', 42);
      store.setAnswer('q3', 'test3');

      const all = store.getAllAnswers();

      expect(all).toEqual({
        q1: 'test1',
        q2: 42,
        q3: 'test3',
      });
    });

    it('should return empty object when no answers', () => {
      const store = createAnswerStore();
      const all = store.getAllAnswers();

      expect(all).toEqual({});
    });
  });

  describe('getAnswersForQuestions', () => {
    it('should return answers for specific questions', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', 'test1');
      store.setAnswer('q2', 'test2');
      store.setAnswer('q3', 'test3');

      const answers = store.getAnswersForQuestions(['q1', 'q3']);

      expect(answers).toEqual({
        q1: 'test1',
        q3: 'test3',
      });
    });

    it('should exclude non-existent answers', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', 'test1');

      const answers = store.getAnswersForQuestions(['q1', 'nonexistent']);

      expect(answers).toEqual({
        q1: 'test1',
      });
    });
  });

  describe('getAnswerCount', () => {
    it('should return count of valid answers', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', 'test1');
      store.setAnswer('q2', 42);
      store.setAnswer('q3', null);
      store.setAnswer('q4', '');

      expect(store.getAnswerCount()).toBe(2);
    });

    it('should return 0 when no valid answers', () => {
      const store = createAnswerStore();
      store.setAnswer('q1', null);
      store.setAnswer('q2', '');

      expect(store.getAnswerCount()).toBe(0);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers on answer change', () => {
      const store = createAnswerStore();
      const callback = vi.fn();
      store.subscribe(callback);

      store.setAnswer('q1', 'test');

      expect(callback).toHaveBeenCalledWith('q1', 'test');
    });

    it('should notify subscribers on answer clear', () => {
      const store = createAnswerStore();
      const callback = vi.fn();
      store.subscribe(callback);
      store.setAnswer('q1', 'test');

      store.clearAnswer('q1');

      expect(callback).toHaveBeenCalledWith('q1', undefined);
    });

    it('should allow unsubscribing', () => {
      const store = createAnswerStore();
      const callback = vi.fn();
      const unsubscribe = store.subscribe(callback);

      unsubscribe();
      store.setAnswer('q1', 'test');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple subscribers', () => {
      const store = createAnswerStore();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      store.subscribe(callback1);
      store.subscribe(callback2);

      store.setAnswer('q1', 'test');

      expect(callback1).toHaveBeenCalledWith('q1', 'test');
      expect(callback2).toHaveBeenCalledWith('q1', 'test');
    });
  });
});
