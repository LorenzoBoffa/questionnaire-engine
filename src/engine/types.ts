import type { Questionnaire, Section } from '../types/questionnaire';
import type { Question } from '../types/questions';
import type { AnswerValue, AnswerStore } from '../types/answers';
import type { ValidationResult, ValidationError } from '../types/validation';
import type { Progress, EngineState } from '../state/types';
import type { SubmitResult, ScoringConfig, ScoreResult } from '../types/scoring';

export interface QuestionnaireEngine {
  load(questionnaire: Questionnaire): void;
  loadFromJSON(json: string | any): void;
  getCurrentQuestions(): Question[];
  setAnswer(questionId: string, value: AnswerValue): void;
  getAnswer(questionId: string): AnswerValue | undefined;
  getAllAnswers(): AnswerStore;
  validate(): ValidationResult;
  getValidationErrors(): ValidationError[];
  getProgress(): Progress;
  getQuestionnaire(): Questionnaire | null;
  reset(): void;
  destroy(): void;
  subscribe(callback: EngineCallback): () => void;
  getQuestion(questionId: string): Question | undefined;
  getSection(sectionId: string): Section | undefined;
  getVisibleQuestionsForSection(sectionId: string): Question[];
  isQuestionVisible(questionId: string): boolean;
  hasAnswer(questionId: string): boolean;
  submit(): SubmitResult;
  calculateScore(scoringConfig: ScoringConfig, answers?: AnswerStore): ScoreResult[];
}

export type EngineCallback = (state: EngineState) => void;

export class NotInitializedError extends Error {
  constructor(message: string = 'Engine not initialized. Call load() first.') {
    super(message);
    this.name = 'NotInitializedError';
  }
}

export class QuestionNotFoundError extends Error {
  constructor(questionId: string) {
    super(`Question not found: ${questionId}`);
    this.name = 'QuestionNotFoundError';
  }
}

export class InvalidQuestionnaireError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidQuestionnaireError';
  }
}