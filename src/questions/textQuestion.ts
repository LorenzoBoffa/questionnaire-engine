import type { TextQuestion as TextQuestionData, Question } from '../types/questions';
import type { AnswerValue, ValidationResult, ValidationError } from '../types';
import type { BaseQuestion } from './base';

export function createTextQuestion(data: Question): BaseQuestion {
  if (data.type !== 'text') {
    throw new Error('Invalid question type for TextQuestion');
  }
  const textData = data as TextQuestionData;
  const question: BaseQuestion = {
    id: textData.id,
    type: 'text',
    label: textData.label,
    required: textData.required ?? false,
    visible: textData.visible !== undefined ? textData.visible : true,
    validate: (value: AnswerValue) => validateTextQuestion(value, textData),
    getDefaultValue: () => getTextQuestionDefaultValue(textData),
    serialize: () => serializeTextQuestion(question, textData),
  };
  return question;
}

export function validateTextQuestion(
  value: AnswerValue,
  question: TextQuestionData
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

  const stringValue = String(value).trim();

  if (question.required && stringValue === '') {
    errors.push({
      questionId: question.id,
      rule: 'required',
      message: question.validation?.find(r => r.type === 'required')?.message || 'This field is required',
    });
  }

  const minLengthRule = question.validation?.find(r => r.type === 'minLength');
  const minLen = minLengthRule && typeof minLengthRule.value === 'number' ? minLengthRule.value : undefined;
  if (minLen !== undefined && stringValue.length < minLen) {
    errors.push({
      questionId: question.id,
      rule: 'minLength',
      message: minLengthRule?.message || `Minimum length is ${minLen}`,
    });
  }

  const maxLengthRule = question.validation?.find(r => r.type === 'maxLength');
  const maxLen = maxLengthRule && typeof maxLengthRule.value === 'number' ? maxLengthRule.value : undefined;
  if (maxLen !== undefined && stringValue.length > maxLen) {
    errors.push({
      questionId: question.id,
      rule: 'maxLength',
      message: maxLengthRule?.message || `Maximum length is ${maxLen}`,
    });
  }

  const emailRule = question.validation?.find(r => r.type === 'email');
  if (emailRule && stringValue !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(stringValue)) {
      errors.push({
        questionId: question.id,
        rule: 'email',
        message: emailRule?.message || 'Enter a valid email',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getTextQuestionDefaultValue(question: TextQuestionData): string | undefined {
  return question.defaultValue;
}

export function serializeTextQuestion(question: BaseQuestion, originalData: TextQuestionData): Question {
  return {
    id: question.id,
    type: 'text',
    label: question.label,
    required: question.required,
    visible: question.visible,
    placeholder: originalData.placeholder,
    defaultValue: originalData.defaultValue,
    validation: originalData.validation,
  };
}
