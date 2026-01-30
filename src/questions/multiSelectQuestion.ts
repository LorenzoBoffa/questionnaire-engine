import type { MultiSelectQuestion as MultiSelectQuestionData, Question, MultipleChoiceOption } from '../types/questions';
import type { AnswerValue, ValidationResult, ValidationError } from '../types';
import type { BaseQuestion } from './base';

function toSelectedArray(value: AnswerValue): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return [String(value)];
}

export function createMultiSelectQuestion(data: Question): BaseQuestion {
  if (data.type !== 'multi-select') {
    throw new Error('Invalid question type for MultiSelectQuestion');
  }
  const multiData = data as MultiSelectQuestionData;

  if (!multiData.options || multiData.options.length === 0) {
    throw new Error('MultiSelectQuestion must have at least one option');
  }

  const question: BaseQuestion = {
    id: multiData.id,
    type: 'multi-select',
    label: multiData.label,
    required: multiData.required ?? false,
    visible: multiData.visible !== undefined ? multiData.visible : true,
    validate: (value: AnswerValue) => validateMultiSelectQuestion(value, multiData),
    getDefaultValue: () => getMultiSelectQuestionDefaultValue(multiData),
    serialize: () => serializeMultiSelectQuestion(question, multiData),
  };
  return question;
}

export function validateMultiSelectQuestion(
  value: AnswerValue,
  question: MultiSelectQuestionData
): ValidationResult {
  const errors: ValidationError[] = [];
  const selected = toSelectedArray(value);

  if (question.required) {
    if (selected.length === 0) {
      errors.push({
        questionId: question.id,
        rule: 'required',
        message: question.validation?.find(r => r.type === 'required')?.message || 'At least one option must be selected',
      });
      return { isValid: false, errors };
    }
  }

  if (selected.length === 0) {
    return { isValid: true, errors: [] };
  }

  for (const v of selected) {
    if (!isValidMultiSelectOption(v, question)) {
      errors.push({
        questionId: question.id,
        rule: 'required',
        message: 'Invalid option selected',
      });
      break;
    }
  }

  const minSelectionsRule = question.validation?.find((r) => r.type === 'minSelections') ?? null;
  const minSelections =
    (minSelectionsRule && typeof minSelectionsRule.value === 'number' ? minSelectionsRule.value : undefined) ??
    question.minSelections;
  if (minSelections !== undefined && selected.length < minSelections) {
    errors.push({
      questionId: question.id,
      rule: 'minSelections',
      message:
        (minSelectionsRule && minSelectionsRule.message) ||
        `At least ${minSelections} option(s) must be selected`,
    });
  }

  const maxSelectionsRule = question.validation?.find((r) => r.type === 'maxSelections') ?? null;
  const maxSelections =
    (maxSelectionsRule && typeof maxSelectionsRule.value === 'number' ? maxSelectionsRule.value : undefined) ??
    question.maxSelections;
  if (maxSelections !== undefined && selected.length > maxSelections) {
    errors.push({
      questionId: question.id,
      rule: 'maxSelections',
      message:
        (maxSelectionsRule && maxSelectionsRule.message) ||
        `At most ${maxSelections} option(s) may be selected`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getMultiSelectQuestionDefaultValue(question: MultiSelectQuestionData): string[] {
  return question.defaultValue ?? [];
}

export function serializeMultiSelectQuestion(question: BaseQuestion, originalData: MultiSelectQuestionData): Question {
  return {
    id: question.id,
    type: 'multi-select',
    label: question.label,
    required: question.required,
    visible: question.visible,
    options: originalData.options,
    defaultValue: originalData.defaultValue,
    minSelections: originalData.minSelections,
    maxSelections: originalData.maxSelections,
    validation: originalData.validation,
  };
}

export function getMultiSelectOptions(question: BaseQuestion): string[] | MultipleChoiceOption[] {
  const serialized = question.serialize();
  if (serialized.type === 'multi-select') {
    return serialized.options;
  }
  throw new Error('Question is not a multi-select question');
}

export function isValidMultiSelectOption(value: string, question: MultiSelectQuestionData): boolean {
  return question.options.some(option => {
    if (typeof option === 'string') {
      return option === value;
    }
    return option.value === value;
  });
}
