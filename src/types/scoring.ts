import type { AnswerValue } from './answers';
import type { ValidationError } from './validation';

export interface RawAnswer {
  questionId: string;
  value: AnswerValue;
  timestamp?: number;
}

export interface ScoreFormula {
  id: string;
  parameterName: string;
  expression: string;
  resultType?: 'number' | 'percentage' | 'category';
}

export interface ScoreResult {
  formulaId: string;
  parameterName: string;
  value: number;
  error?: string;
}

export interface ScoringConfig {
  formulas: ScoreFormula[];
}

export interface SubmitResult {
  answers: RawAnswer[];
  isValid: boolean;
  errors?: ValidationError[];
}
