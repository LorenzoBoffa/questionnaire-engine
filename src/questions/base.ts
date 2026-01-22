import type { Question, QuestionType } from '../types/questions';
import type { AnswerValue, ValidationResult } from '../types';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  label: string;
  required?: boolean;
  visible?: boolean;
  validate(value: AnswerValue): ValidationResult;
  getDefaultValue(): AnswerValue;
  serialize(): Question;
}
