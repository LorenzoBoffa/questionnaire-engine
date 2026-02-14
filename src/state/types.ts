import type { AnswerValue } from '../types/answers';
import type { Questionnaire, FormulaResult } from '../types/questionnaire';
import type { Question } from '../types/questions';
import type { ValidationResult, ValidationError } from '../types/validation';
import type { FormulaEngine } from '../formulas/types';

export interface AnswerStore {
  setAnswer(questionId: string, value: AnswerValue): void;
  getAnswer(questionId: string): AnswerValue | undefined;
  hasAnswer(questionId: string): boolean;
  clearAnswer(questionId: string): void;
  clearAll(): void;
  getAllAnswers(): Record<string, AnswerValue>;
  getAnswersForQuestions(questionIds: string[]): Record<string, AnswerValue>;
  getAnswerCount(): number;
  subscribe(callback: AnswerChangeCallback): () => void;
}

export type AnswerChangeCallback = (questionId: string, value: AnswerValue) => void;

export interface Progress {
  total: number;
  answered: number;
  percentage: number;
}

export interface EngineState {
  questionnaire: Questionnaire | null;
  answers: Record<string, AnswerValue>;
  progress: Progress;
  errors: ValidationError[];
  formulaResults: FormulaResult[];
}

export interface StateManager {
  loadQuestionnaire(questionnaire: Questionnaire): void;
  setAnswer(questionId: string, value: AnswerValue): void;
  getAnswer(questionId: string): AnswerValue | undefined;
  getAllAnswers(): Record<string, AnswerValue>;
  getCurrentQuestions(): Question[];
  getProgress(): Progress;
  validate(): ValidationResult;
  getValidationErrors(): ValidationError[];
  reset(): void;
  subscribe(callback: StateChangeCallback): () => void;
  getState(): EngineState;
  getQuestionRegistry(): Map<string, import('../questions/base').BaseQuestion>;
}

export type StateChangeCallback = (state: EngineState) => void;

export interface StateManagerDependencies {
  validationEngine: {
    validateAll: (questions: Question[], answers: Record<string, AnswerValue>) => ValidationResult;
  };
  formulaEngine: FormulaEngine;
}
