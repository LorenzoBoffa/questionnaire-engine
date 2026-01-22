import type { ValidationRule } from './validation';

export type QuestionType = 'text' | 'number' | 'multiple-choice';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  label: string;
  required?: boolean;
  validation?: ValidationRule[];
  visible?: boolean;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text';
  placeholder?: string;
  defaultValue?: string;
}

export interface NumberQuestion extends BaseQuestion {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: string[];
  defaultValue?: string;
}

export type Question = TextQuestion | NumberQuestion | MultipleChoiceQuestion;
