import type { Validator } from '../Validator';
import type { ValidationRule, ValidationResult, ValidationError } from '../../types/validation';
import type { Question } from '../../types/questions';
import type { AnswerValue } from '../../types/answers';

function toSelectedArray(value: AnswerValue): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return [String(value)];
}

export function createMinMaxSelectionsValidator(): Validator {
  return {
    type: ['minSelections', 'maxSelections'],
    canValidate(rule: ValidationRule): boolean {
      return rule.type === 'minSelections' || rule.type === 'maxSelections';
    },
    validate(value: AnswerValue, rule: ValidationRule, question?: Question): ValidationResult {
      return validateMinMaxSelections(value, rule, question);
    },
  };
}

export function validateMinMaxSelections(
  value: AnswerValue,
  rule: ValidationRule,
  question?: Question
): ValidationResult {
  const errors: ValidationError[] = [];
  const questionId = question?.id || '';

  if (question?.type !== 'multi-select') {
    return { isValid: true, errors: [] };
  }

  const numValue = typeof rule.value === 'number' ? rule.value : undefined;
  if (numValue === undefined) {
    return { isValid: true, errors: [] };
  }

  const selected = toSelectedArray(value);

  if (rule.type === 'minSelections') {
    if (selected.length < numValue) {
      errors.push({
        questionId,
        rule: 'minSelections',
        message: rule.message || `At least ${numValue} option(s) must be selected`,
      });
    }
  } else if (rule.type === 'maxSelections') {
    if (selected.length > numValue) {
      errors.push({
        questionId,
        rule: 'maxSelections',
        message: rule.message || `At most ${numValue} option(s) may be selected`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
