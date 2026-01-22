export type ValidationRuleType = 'required' | 'min' | 'max' | 'minLength' | 'maxLength';

export interface ValidationRule {
  type: ValidationRuleType;
  message?: string;
  value?: number;
}

export interface RequiredRule extends ValidationRule {
  type: 'required';
  message?: string;
}

export interface MinMaxRule extends ValidationRule {
  type: 'min' | 'max';
  value: number;
  message?: string;
}

export interface MinMaxLengthRule extends ValidationRule {
  type: 'minLength' | 'maxLength';
  value: number;
  message?: string;
}

export interface ValidationError {
  questionId: string;
  rule: ValidationRuleType;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
