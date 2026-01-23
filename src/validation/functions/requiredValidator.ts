import type { Validator } from '../Validator';
import type { ValidationRule, ValidationResult, ValidationError } from '../../types/validation';
import type { Question } from '../../types/questions';
import type { AnswerValue } from '../../types/answers';

export function createRequiredValidator(): Validator {
  return {
    type: 'required',
    canValidate(rule: ValidationRule): boolean {
      return rule.type === 'required';
    },
    validate(value: AnswerValue, rule: ValidationRule, question?: Question): ValidationResult {
      return validateRequired(value, rule, question);
    },
  };
}

export function validateRequired(
  value: AnswerValue,
  rule: ValidationRule,
  question?: Question
): ValidationResult {
  if (rule.type !== 'required') {
    return { isValid: true, errors: [] };
  }

  const errors: ValidationError[] = [];
  const questionId = question?.id || '';

  if (value === null || value === undefined) {
    errors.push({
      questionId,
      rule: 'required',
      message: rule.message || 'This field is required',
    });
    return { isValid: false, errors };
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      errors.push({
        questionId,
        rule: 'required',
        message: rule.message || 'This field is required',
      });
      return { isValid: false, errors };
    }
  }

  if (typeof value === 'number') {
    if (isNaN(value)) {
      errors.push({
        questionId,
        rule: 'required',
        message: rule.message || 'This field is required',
      });
      return { isValid: false, errors };
    }
  }

  return { isValid: true, errors: [] };
}
