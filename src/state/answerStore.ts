import type { AnswerStore, AnswerChangeCallback } from './types';
import type { AnswerValue } from '../types/answers';

export function createAnswerStore(): AnswerStore {
  const answers = new Map<string, AnswerValue>();
  const subscribers = new Set<AnswerChangeCallback>();

  function setAnswer(questionId: string, value: AnswerValue): void {
    answers.set(questionId, value);
    notifySubscribers(questionId, value);
  }

  function getAnswer(questionId: string): AnswerValue | undefined {
    return answers.get(questionId);
  }

  function hasAnswer(questionId: string): boolean {
    const value = answers.get(questionId);
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    return true;
  }

  function clearAnswer(questionId: string): void {
    answers.delete(questionId);
    notifySubscribers(questionId, undefined);
  }

  function clearAll(): void {
    const questionIds = Array.from(answers.keys());
    answers.clear();
    questionIds.forEach(id => notifySubscribers(id, undefined));
  }

  function getAllAnswers(): Record<string, AnswerValue> {
    return Object.fromEntries(answers);
  }

  function getAnswersForQuestions(questionIds: string[]): Record<string, AnswerValue> {
    const result: Record<string, AnswerValue> = {};
    for (const id of questionIds) {
      if (answers.has(id)) {
        result[id] = answers.get(id)!;
      }
    }
    return result;
  }

  function getAnswerCount(): number {
    return Array.from(answers.values()).filter(v => 
      v !== null && v !== undefined && v !== ''
    ).length;
  }

  function subscribe(callback: AnswerChangeCallback): () => void {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }

  function notifySubscribers(questionId: string, value: AnswerValue): void {
    subscribers.forEach(callback => {
      try {
        callback(questionId, value);
      } catch (error) {
        console.error('Error in answer change callback:', error);
      }
    });
  }

  return {
    setAnswer,
    getAnswer,
    hasAnswer,
    clearAnswer,
    clearAll,
    getAllAnswers,
    getAnswersForQuestions,
    getAnswerCount,
    subscribe,
  };
}
