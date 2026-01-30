import type { ValidationRule } from './validation';

export type QuestionType = 'text' | 'number' | 'multiple-choice' | 'multi-select' | 'file';

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

export interface MultipleChoiceOption {
  value: string;
  label: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: string[] | MultipleChoiceOption[];
  defaultValue?: string;
}

export interface MultiSelectQuestion extends BaseQuestion {
  type: 'multi-select';
  options: string[] | MultipleChoiceOption[];
  defaultValue?: string[];
  minSelections?: number;
  maxSelections?: number;
}

export type FileQuestionKind = 'image' | 'document';

export interface FileQuestion extends BaseQuestion {
  type: 'file';
  fileKind?: FileQuestionKind;
  allowedExtensions?: string[];
  maxSizeBytes?: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export type Question = TextQuestion | NumberQuestion | MultipleChoiceQuestion | MultiSelectQuestion | FileQuestion;
