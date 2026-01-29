import type { Question, QuestionType } from '../types/questions';
import type { AnswerValue, ValidationResult } from '../types';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  label: string;
  required?: boolean;
  visible?: boolean;
  metadata?: Record<string, unknown>; // can be use to pass additional info (e.g. icons, help text, etc.)
  validate(value: AnswerValue): ValidationResult;
  getDefaultValue(): AnswerValue;
  serialize(): Question;
}
