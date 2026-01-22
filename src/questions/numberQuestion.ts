import type { NumberQuestion as NumberQuestionData, Question } from '../types/questions';
import type { AnswerValue, ValidationResult, ValidationError } from '../types';
import type { BaseQuestion } from './base';

export function createNumberQuestion(data: Question): BaseQuestion {
  if (data.type !== 'number') {
    throw new Error('Invalid question type for NumberQuestion');
  }
  const numberData = data as NumberQuestionData;
  const question: BaseQuestion = {
    id: numberData.id,
    type: 'number',
    label: numberData.label,
    required: numberData.required ?? false,
    visible: numberData.visible ?? true,
    validate: (value: AnswerValue) => validateNumberQuestion(value, numberData),
    getDefaultValue: () => getNumberQuestionDefaultValue(numberData),
    serialize: () => serializeNumberQuestion(question, numberData),
  };
  return question;
}

export function validateNumberQuestion(
  value: AnswerValue,
  question: NumberQuestionData
): ValidationResult {
  const errors: ValidationError[] = [];

  if (question.required) {
    if (value === null || value === undefined || value === '') {
      errors.push({
        questionId: question.id,
        rule: 'required',
        message: question.validation?.find(r => r.type === 'required')?.message || 'This field is required',
      });
      return { isValid: false, errors };
    }
  }

  if (value === null || value === undefined || value === '') {
    return { isValid: true, errors: [] };
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);

  if (isNaN(numValue)) {
    errors.push({
      questionId: question.id,
      rule: 'required',
      message: 'Invalid number',
    });
    return { isValid: false, errors };
  }

  const minRule = question.validation?.find(r => r.type === 'min') || (question.min !== undefined ? { type: 'min' as const, value: question.min } : null);
  if (minRule && minRule.value !== undefined) {
    if (numValue < minRule.value) {
      errors.push({
        questionId: question.id,
        rule: 'min',
        message: minRule.message || `Minimum value is ${minRule.value}`,
      });
    }
  }

  const maxRule = question.validation?.find(r => r.type === 'max') || (question.max !== undefined ? { type: 'max' as const, value: question.max } : null);
  if (maxRule && maxRule.value !== undefined) {
    if (numValue > maxRule.value) {
      errors.push({
        questionId: question.id,
        rule: 'max',
        message: maxRule.message || `Maximum value is ${maxRule.value}`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getNumberQuestionDefaultValue(question: NumberQuestionData): number | undefined {
  return question.defaultValue;
}

export function serializeNumberQuestion(question: BaseQuestion, originalData: NumberQuestionData): Question {
  return {
    id: question.id,
    type: 'number',
    label: question.label,
    required: question.required,
    visible: question.visible,
    min: originalData.min,
    max: originalData.max,
    step: originalData.step,
    defaultValue: originalData.defaultValue,
    validation: originalData.validation,
  };
}
