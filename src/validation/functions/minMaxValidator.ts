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
    const minVal = typeof rule.value === 'number' ? rule.value : undefined;
    if (minVal === undefined) {
      return { isValid: true, errors: [] };
    }
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numValue)) {
      return { isValid: true, errors: [] };
    }
    if (numValue < minVal) {
      errors.push({
        questionId,
        rule: 'min',
        message: rule.message || `Value must be at least ${minVal}`,
      });
    }
  } else if (rule.type === 'max') {
    if (value === null || value === undefined || value === '') {
      return { isValid: true, errors: [] };
    }
    const maxVal = typeof rule.value === 'number' ? rule.value : undefined;
    if (maxVal === undefined) {
      return { isValid: true, errors: [] };
    }
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numValue)) {
      return { isValid: true, errors: [] };
    }
    if (numValue > maxVal) {
      errors.push({
        questionId,
        rule: 'max',
        message: rule.message || `Value must be at most ${maxVal}`,
      });
    }
  } else if (rule.type === 'minLength') {
    const minLenVal = typeof rule.value === 'number' ? rule.value : undefined;
    if (minLenVal === undefined) {
      return { isValid: true, errors: [] };
    }
    const isEmpty = value === null || value === undefined || value === '';
    const hasRequiredRule = question?.validation?.some(r => r.type === 'required');
    const isExplicitlyOptional = question?.required === false && !hasRequiredRule;
    if (isEmpty && isExplicitlyOptional) {
      return { isValid: true, errors: [] };
    }
    const stringValue = value === null || value === undefined ? '' : String(value);
    if (stringValue.length < minLenVal) {
      const error = {
        questionId,
        rule: 'minLength' as const,
        message: rule.message || `Must be at least ${minLenVal} characters`,
      };
      errors.push(error);
    }
  } else if (rule.type === 'maxLength') {
    const maxLenVal = typeof rule.value === 'number' ? rule.value : undefined;
    if (maxLenVal === undefined) {
      return { isValid: true, errors: [] };
    }
    const isEmpty = value === null || value === undefined || value === '';
    const hasRequiredRule = question?.validation?.some(r => r.type === 'required');
    const isExplicitlyOptional = question?.required === false && !hasRequiredRule;
    if (isEmpty && isExplicitlyOptional) {
      return { isValid: true, errors: [] };
    }
    const stringValue = value === null || value === undefined ? '' : String(value);
    if (stringValue.length > maxLenVal) {
      errors.push({
        questionId,
        rule: 'maxLength',
        message: rule.message || `Must be at most ${maxLenVal} characters`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
