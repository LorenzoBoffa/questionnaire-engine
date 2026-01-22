import type { Question, QuestionType } from '../types/questions';
import type { BaseQuestion } from './base';

export type QuestionFactory = (data: Question) => BaseQuestion;

const registry = new Map<QuestionType, QuestionFactory>();

export function register(type: QuestionType, factory: QuestionFactory): void {
  registry.set(type, factory);
}

export function create(data: Question): BaseQuestion {
  const factory = registry.get(data.type);
  if (!factory) {
    throw new UnknownQuestionTypeError(`Unknown question type: ${data.type}`);
  }
  return factory(data);
}

export function getRegisteredTypes(): QuestionType[] {
  return Array.from(registry.keys());
}

export function isRegistered(type: QuestionType): boolean {
  return registry.has(type);
}

export class UnknownQuestionTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnknownQuestionTypeError';
  }
}

export class InvalidQuestionDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidQuestionDataError';
  }
}
