import type { ValidationRule, ValidationRuleType, ValidationResult } from '../types/validation';
import type { Question } from '../types/questions';
import type { AnswerValue } from '../types/answers';

export interface Validator {
  type: ValidationRuleType | ValidationRuleType[];
  validate(value: AnswerValue, rule: ValidationRule, question?: Question): ValidationResult;
  canValidate(rule: ValidationRule): boolean;
}
