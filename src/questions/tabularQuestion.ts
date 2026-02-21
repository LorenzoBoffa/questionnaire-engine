import type { TabularQuestion as TabularQuestionData, TabularColumn, Question } from '../types/questions';
import type { AnswerValue, TabularAnswerValue, ValidationResult, ValidationError } from '../types';
import type { BaseQuestion } from './base';
import { validateTextQuestion } from './textQuestion';
import { validateNumberQuestion } from './numberQuestion';
import { validateMultipleChoiceQuestion } from './multipleChoiceQuestion';
import { validateMultiSelectQuestion } from './multiSelectQuestion';

export function validateTabularQuestion(
  value: AnswerValue,
  question: TabularQuestionData,
): ValidationResult {
  const errors: ValidationError[] = [];

  if (question.required) {
    if (value === null || value === undefined) {
      errors.push({
        questionId: question.id,
        rule: 'required',
        message: question.validation?.find(r => r.type === 'required')?.message || 'This field is required',
      });
      return { isValid: false, errors };
    }
  }

  if (value === null || value === undefined) {
    return { isValid: true, errors: [] };
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    errors.push({
      questionId: question.id,
      rule: 'required',
      message: 'Invalid tabular value format',
    });
    return { isValid: false, errors };
  }

  const tableValue = value as TabularAnswerValue;

  for (const row of question.rows) {
    const rowValues = tableValue[row.id] ?? {};
    for (const column of question.columns) {
      const cellValue = (rowValues[column.id] ?? undefined) as AnswerValue;
      const cellErrors = validateCellValue(cellValue, column, question.id, row.id);
      errors.push(...cellErrors);
    }
  }

  return { isValid: errors.length === 0, errors };
}

function validateCellValue(
  value: AnswerValue,
  column: TabularColumn,
  questionId: string,
  rowId: string,
): ValidationError[] {
  const syntheticId = `${questionId}.${rowId}.${column.id}`;

  let result: ValidationResult;
  switch (column.type) {
    case 'text': {
      result = validateTextQuestion(value, {
        id: syntheticId,
        type: 'text',
        label: column.label,
        required: column.required ?? false,
        validation: column.validation,
        placeholder: column.placeholder,
      });
      break;
    }
    case 'number': {
      result = validateNumberQuestion(value, {
        id: syntheticId,
        type: 'number',
        label: column.label,
        required: column.required ?? false,
        validation: column.validation,
        min: column.min,
        max: column.max,
        step: column.step,
      });
      break;
    }
    case 'multiple-choice': {
      result = validateMultipleChoiceQuestion(value, {
        id: syntheticId,
        type: 'multiple-choice',
        label: column.label,
        required: column.required ?? false,
        validation: column.validation,
        options: column.options ?? [],
      });
      break;
    }
    case 'multi-select': {
      result = validateMultiSelectQuestion(value, {
        id: syntheticId,
        type: 'multi-select',
        label: column.label,
        required: column.required ?? false,
        validation: column.validation,
        options: column.options ?? [],
        minSelections: column.minSelections,
        maxSelections: column.maxSelections,
      });
      break;
    }
    default:
      return [];
  }

  return result.errors;
}

export function getTabularQuestionDefaultValue(): TabularAnswerValue {
  return {};
}

export function serializeTabularQuestion(question: BaseQuestion, originalData: TabularQuestionData): Question {
  return {
    id: question.id,
    type: 'tabular',
    label: question.label,
    required: question.required,
    visible: question.visible,
    columns: originalData.columns,
    rows: originalData.rows,
    validation: originalData.validation,
  };
}

export function createTabularQuestion(data: Question): BaseQuestion {
  if (data.type !== 'tabular') {
    throw new Error('Invalid question type for TabularQuestion');
  }
  const tabularData = data as TabularQuestionData;
  const question: BaseQuestion = {
    id: tabularData.id,
    type: 'tabular',
    label: tabularData.label,
    required: tabularData.required ?? false,
    visible: tabularData.visible !== undefined ? tabularData.visible : true,
    validate: (value: AnswerValue) => validateTabularQuestion(value, tabularData),
    getDefaultValue: () => getTabularQuestionDefaultValue(),
    serialize: () => serializeTabularQuestion(question, tabularData),
  };
  return question;
}
