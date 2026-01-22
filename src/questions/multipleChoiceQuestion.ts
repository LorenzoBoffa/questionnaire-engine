import type { MultipleChoiceQuestion as MultipleChoiceQuestionData, Question } from '../types/questions';
import type { AnswerValue, ValidationResult, ValidationError } from '../types';
import type { BaseQuestion } from './base';

export function createMultipleChoiceQuestion(data: Question): BaseQuestion {
  if (data.type !== 'multiple-choice') {
    throw new Error('Invalid question type for MultipleChoiceQuestion');
  }
  const choiceData = data as MultipleChoiceQuestionData;
  
  if (!choiceData.options || choiceData.options.length === 0) {
    throw new Error('MultipleChoiceQuestion must have at least one option');
  }

  const question: BaseQuestion = {
    id: choiceData.id,
    type: 'multiple-choice',
    label: choiceData.label,
    required: choiceData.required ?? false,
    visible: choiceData.visible ?? true,
    validate: (value: AnswerValue) => validateMultipleChoiceQuestion(value, choiceData),
    getDefaultValue: () => getMultipleChoiceQuestionDefaultValue(choiceData),
    serialize: () => serializeMultipleChoiceQuestion(question, choiceData),
  };
  return question;
}

export function validateMultipleChoiceQuestion(
  value: AnswerValue,
  question: MultipleChoiceQuestionData
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

  const stringValue = String(value);

  if (!isValidMultipleChoiceOption(stringValue, question)) {
    errors.push({
      questionId: question.id,
      rule: 'required',
      message: 'Invalid option selected',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getMultipleChoiceQuestionDefaultValue(question: MultipleChoiceQuestionData): string | undefined {
  return question.defaultValue;
}

export function serializeMultipleChoiceQuestion(question: BaseQuestion, originalData: MultipleChoiceQuestionData): Question {
  return {
    id: question.id,
    type: 'multiple-choice',
    label: question.label,
    required: question.required,
    visible: question.visible,
    options: originalData.options,
    defaultValue: originalData.defaultValue,
    validation: originalData.validation,
  };
}

export function getMultipleChoiceOptions(question: BaseQuestion): string[] {
  const serialized = question.serialize();
  if (serialized.type === 'multiple-choice') {
    return serialized.options;
  }
  throw new Error('Question is not a multiple-choice question');
}

export function isValidMultipleChoiceOption(value: string, question: MultipleChoiceQuestionData): boolean {
  return question.options.includes(value);
}
