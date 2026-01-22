import type { Question, QuestionType } from '../types/questions';
import type { BaseQuestion } from './base';
import { create as registryCreate, register, isRegistered, getRegisteredTypes, UnknownQuestionTypeError, InvalidQuestionDataError } from './registry';
import { createTextQuestion } from './textQuestion';
import { createNumberQuestion } from './numberQuestion';
import { createMultipleChoiceQuestion } from './multipleChoiceQuestion';

register('text', createTextQuestion);
register('number', createNumberQuestion);
register('multiple-choice', createMultipleChoiceQuestion);

export function createQuestion(data: Question): BaseQuestion {
  return registryCreate(data);
}

export function isQuestionType(type: string): type is QuestionType {
  return type === 'text' || type === 'number' || type === 'multiple-choice';
}

export function setQuestionVisible(question: BaseQuestion, visible: boolean): BaseQuestion {
  const serialized = question.serialize();
  return createQuestion({
    ...serialized,
    visible,
  });
}

export function isQuestionVisible(question: BaseQuestion): boolean {
  return question.visible ?? true;
}

export type { BaseQuestion } from './base';

export {
  register,
  isRegistered,
  getRegisteredTypes,
  UnknownQuestionTypeError,
  InvalidQuestionDataError,
};

export {
  createTextQuestion,
  validateTextQuestion,
  getTextQuestionDefaultValue,
  serializeTextQuestion,
} from './textQuestion';

export {
  createNumberQuestion,
  validateNumberQuestion,
  getNumberQuestionDefaultValue,
  serializeNumberQuestion,
} from './numberQuestion';

export {
  createMultipleChoiceQuestion,
  validateMultipleChoiceQuestion,
  getMultipleChoiceQuestionDefaultValue,
  serializeMultipleChoiceQuestion,
  getMultipleChoiceOptions,
  isValidMultipleChoiceOption,
} from './multipleChoiceQuestion';
