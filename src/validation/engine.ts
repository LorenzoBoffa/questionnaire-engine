import type { Question } from '../types/questions';
import type { AnswerValue, AnswerStore } from '../types/answers';
import type { ValidationResult, ValidationError } from '../types/validation';
import { validateValue } from './registry';

export function validateQuestion(question: Question, value: AnswerValue): ValidationResult {
  const rules: typeof question.validation = [];

  const hasRequiredRule = question.validation?.some(r => r.type === 'required');

  if (question.required && !hasRequiredRule) {
    rules.push({
      type: 'required',
      message: question.validation?.find(r => r.type === 'required')?.message,
    });
  }

  if (question.validation) {
    rules.push(...question.validation);
  }

  if (rules.length === 0) {
    return { isValid: true, errors: [] };
  }

  const result = validateValue(value, rules, question.id, question);
  return result;
}

export function validateAll(questions: Question[], answers: AnswerStore): ValidationResult {
  const allErrors: ValidationError[] = [];
  let isValid = true;

  for (const question of questions) {
    const value = answers[question.id];
    const result = validateQuestion(question, value);
    if (!result.isValid) {
      isValid = false;
      allErrors.push(...result.errors);
    }
  }

  return {
    isValid,
    errors: allErrors,
  };
}

export function getErrorsForQuestion(
  questionId: string,
  validationResult: ValidationResult
): ValidationError[] {
  return validationResult.errors.filter(error => error.questionId === questionId);
}

export function hasErrors(validationResult: ValidationResult): boolean {
  return !validationResult.isValid && validationResult.errors.length > 0;
}
