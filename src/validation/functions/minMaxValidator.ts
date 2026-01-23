import type { Validator } from '../Validator';
import type { ValidationRule, ValidationResult, ValidationError } from '../../types/validation';
import type { Question } from '../../types/questions';
import type { AnswerValue } from '../../types/answers';

export function createMinMaxValidator(): Validator {
  return {
    type: ['min', 'max', 'minLength', 'maxLength'],
    canValidate(rule: ValidationRule): boolean {
      return rule.type === 'min' || rule.type === 'max' || rule.type === 'minLength' || rule.type === 'maxLength';
    },
    validate(value: AnswerValue, rule: ValidationRule, question?: Question): ValidationResult {
      return validateMinMax(value, rule, question);
    },
  };
}

export function validateMinMax(
  value: AnswerValue,
  rule: ValidationRule,
  question?: Question
): ValidationResult {
  const errors: ValidationError[] = [];
  const questionId = question?.id || '';

  if (rule.type === 'min') {
    if (value === null || value === undefined || value === '') {
      return { isValid: true, errors: [] };
    }
    if (rule.value === undefined) {
      return { isValid: true, errors: [] };
    }
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numValue)) {
      return { isValid: true, errors: [] };
    }
    if (numValue < rule.value) {
      errors.push({
        questionId,
        rule: 'min',
        message: rule.message || `Value must be at least ${rule.value}`,
      });
    }
  } else if (rule.type === 'max') {
    if (value === null || value === undefined || value === '') {
      return { isValid: true, errors: [] };
    }
    if (rule.value === undefined) {
      return { isValid: true, errors: [] };
    }
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numValue)) {
      return { isValid: true, errors: [] };
    }
    if (numValue > rule.value) {
      errors.push({
        questionId,
        rule: 'max',
        message: rule.message || `Value must be at most ${rule.value}`,
      });
    }
  } else if (rule.type === 'minLength') {
    if (rule.value === undefined) {
      return { isValid: true, errors: [] };
    }
    const isEmpty = value === null || value === undefined || value === '';
    const hasRequiredRule = question?.validation?.some(r => r.type === 'required');
    const isExplicitlyOptional = question?.required === false && !hasRequiredRule;
    if (isEmpty && isExplicitlyOptional) {
      return { isValid: true, errors: [] };
    }
    const stringValue = value === null || value === undefined ? '' : String(value);
    if (stringValue.length < rule.value) {
      const error = {
        questionId,
        rule: 'minLength' as const,
        message: rule.message || `Must be at least ${rule.value} characters`,
      };
      errors.push(error);
    }
  } else if (rule.type === 'maxLength') {
    if (rule.value === undefined) {
      return { isValid: true, errors: [] };
    }
    const isEmpty = value === null || value === undefined || value === '';
    const hasRequiredRule = question?.validation?.some(r => r.type === 'required');
    const isExplicitlyOptional = question?.required === false && !hasRequiredRule;
    if (isEmpty && isExplicitlyOptional) {
      return { isValid: true, errors: [] };
    }
    const stringValue = value === null || value === undefined ? '' : String(value);
    if (stringValue.length > rule.value) {
      errors.push({
        questionId,
        rule: 'maxLength',
        message: rule.message || `Must be at most ${rule.value} characters`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
