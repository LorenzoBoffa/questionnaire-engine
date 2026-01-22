import type {
  Questionnaire,
  Section,
  Question,
  QuestionType,
  ValidationRule,
  ValidationRuleType,
  Action,
  ActionType,
  Formula,
} from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface QuestionParser {
  parse(data: any): Question;
  canParse(type: QuestionType): boolean;
  validate(data: any): ValidationResult;
}

export interface ValidationRuleParser {
  parse(data: any): ValidationRule[];
  normalize(data: any): any;
}

export interface FormulaParser {
  parse(data: any): Formula;
  validate(data: any): ValidationResult;
}

export interface ActionParser {
  parse(data: any): Action;
  validate(data: any): ValidationResult;
}

export interface SectionParser {
  parse(data: any): Section;
  validate(data: any): ValidationResult;
}

export interface JSONLoader {
  loadFromString(jsonString: string): Questionnaire;
  loadFromObject(jsonObject: any): Questionnaire;
  validateStructure(data: any): ValidationResult;
  parseQuestionnaire(data: any): Questionnaire;
}

export class InvalidJSONError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidJSONError';
  }
}

export class InvalidStructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStructureError';
  }
}

export class MissingFieldError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingFieldError';
  }
}

export class InvalidTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTypeError';
  }
}

function createFieldPath(segments: string[]): string {
  return segments.join('.');
}

function formatMissingFieldError(path: string, field: string): string {
  return `Missing required field: ${path}.${field}`;
}

function formatTypeError(path: string, expected: string, actual: any): string {
  const actualType = typeof actual === 'object' && actual !== null ? Array.isArray(actual) ? 'array' : 'object' : typeof actual;
  return `Invalid type for ${path}: expected ${expected}, got ${actualType}`;
}

function formatValidationError(path: string, message: string): string {
  return `Invalid validation at ${path}: ${message}`;
}

function convertToNumber(value: any, path: string): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new InvalidTypeError(formatTypeError(path, 'number', value));
    }
    return num;
  }
  throw new InvalidTypeError(formatTypeError(path, 'number', value));
}

function convertToBoolean(value: any, path: string): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  throw new InvalidTypeError(formatTypeError(path, 'boolean', value));
}

function convertToString(value: any, path: string): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    throw new InvalidTypeError(formatTypeError(path, 'string', value));
  }
  return String(value);
}

function convertToArray(value: any, path: string): any[] {
  if (Array.isArray(value)) {
    return value;
  }
  throw new InvalidTypeError(formatTypeError(path, 'array', value));
}

function convertToObject(value: any, path: string): object {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value;
  }
  throw new InvalidTypeError(formatTypeError(path, 'object', value));
}

function validateType(value: any, expectedType: string, path: string): ValidationResult {
  try {
    switch (expectedType) {
      case 'string':
        convertToString(value, path);
        return { isValid: true, errors: [] };
      case 'number':
        convertToNumber(value, path);
        return { isValid: true, errors: [] };
      case 'boolean':
        convertToBoolean(value, path);
        return { isValid: true, errors: [] };
      case 'array':
        convertToArray(value, path);
        return { isValid: true, errors: [] };
      case 'object':
        convertToObject(value, path);
        return { isValid: true, errors: [] };
      default:
        return { isValid: false, errors: [`Unknown expected type: ${expectedType} at ${path}`] };
    }
  } catch (error) {
    if (error instanceof InvalidTypeError) {
      return { isValid: false, errors: [error.message] };
    }
    return { isValid: false, errors: [formatTypeError(path, expectedType, value)] };
  }
}

function validateRequiredField(data: any, field: string, path: string): ValidationResult {
  if (data === null || data === undefined) {
    return { isValid: false, errors: [formatMissingFieldError(path, field)] };
  }
  if (typeof data === 'object' && !(field in data)) {
    return { isValid: false, errors: [formatMissingFieldError(path, field)] };
  }
  return { isValid: true, errors: [] };
}

function validateFieldType(data: any, field: string, expectedType: string, path: string): ValidationResult {
  const fieldPath = path ? `${path}.${field}` : field;
  if (!(field in data)) {
    return { isValid: true, errors: [] };
  }
  return validateType(data[field], expectedType, fieldPath);
}

function isValidQuestionType(type: string): type is QuestionType {
  return type === 'text' || type === 'number' || type === 'multiple-choice';
}

function isValidActionType(type: string): type is ActionType {
  return type === 'show' || type === 'hide';
}

function isValidValidationRuleType(type: string): type is ValidationRuleType {
  return type === 'required' || type === 'min' || type === 'max' || type === 'minLength' || type === 'maxLength';
}

function validateQuestionStructure(data: any, path: string): ValidationResult {
  const errors: string[] = [];

  const idResult = validateRequiredField(data, 'id', path);
  if (!idResult.isValid) errors.push(...idResult.errors);

  const typeResult = validateRequiredField(data, 'type', path);
  if (!typeResult.isValid) {
    errors.push(...typeResult.errors);
  } else {
    const type = data.type;
    if (!isValidQuestionType(type)) {
      errors.push(formatTypeError(`${path}.type`, "'text' | 'number' | 'multiple-choice'", type));
    }
  }

  const labelResult = validateRequiredField(data, 'label', path);
  if (!labelResult.isValid) errors.push(...labelResult.errors);

  if (data.type === 'multiple-choice') {
    const optionsResult = validateRequiredField(data, 'options', path);
    if (!optionsResult.isValid) {
      errors.push(...optionsResult.errors);
    } else {
      const optionsTypeResult = validateFieldType(data, 'options', 'array', path);
      if (!optionsTypeResult.isValid) errors.push(...optionsTypeResult.errors);
    }
  }

  return { isValid: errors.length === 0, errors };
}

function validateSectionStructure(data: any, index: number): ValidationResult {
  const path = `sections[${index}]`;
  const errors: string[] = [];

  const idResult = validateRequiredField(data, 'id', path);
  if (!idResult.isValid) errors.push(...idResult.errors);

  const titleResult = validateRequiredField(data, 'title', path);
  if (!titleResult.isValid) errors.push(...titleResult.errors);

  const questionsResult = validateRequiredField(data, 'questions', path);
  if (!questionsResult.isValid) {
    errors.push(...questionsResult.errors);
  } else {
    const questionsTypeResult = validateFieldType(data, 'questions', 'array', path);
    if (!questionsTypeResult.isValid) {
      errors.push(...questionsTypeResult.errors);
    } else {
      const questions = data.questions;
      if (!Array.isArray(questions) || questions.length === 0) {
        errors.push(formatValidationError(path, 'questions array must be non-empty'));
      } else {
        questions.forEach((question: any, qIndex: number) => {
          const questionPath = `${path}.questions[${qIndex}]`;
          const questionResult = validateQuestionStructure(question, questionPath);
          if (!questionResult.isValid) {
            errors.push(...questionResult.errors);
          }
        });
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

function validateQuestionnaireStructure(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Questionnaire data must be an object'] };
  }

  const idResult = validateRequiredField(data, 'id', '');
  if (!idResult.isValid) errors.push(...idResult.errors);

  const titleResult = validateRequiredField(data, 'title', '');
  if (!titleResult.isValid) errors.push(...titleResult.errors);

  const sectionsResult = validateRequiredField(data, 'sections', '');
  if (!sectionsResult.isValid) {
    errors.push(...sectionsResult.errors);
  } else {
    const sectionsTypeResult = validateFieldType(data, 'sections', 'array', '');
    if (!sectionsTypeResult.isValid) {
      errors.push(...sectionsTypeResult.errors);
    } else {
      const sections = data.sections;
      if (!Array.isArray(sections) || sections.length === 0) {
        errors.push(formatValidationError('', 'sections array must be non-empty'));
      } else {
        sections.forEach((section: any, index: number) => {
          const sectionResult = validateSectionStructure(section, index);
          if (!sectionResult.isValid) {
            errors.push(...sectionResult.errors);
          }
        });
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

function parseRequiredRule(data: any): ValidationRule | null {
  if (typeof data === 'boolean') {
    return data ? { type: 'required' } : null;
  }
  if (typeof data === 'object' && data !== null && data.type === 'required') {
    return {
      type: 'required',
      message: typeof data.message === 'string' ? data.message : undefined,
    };
  }
  return null;
}

function parseMinMaxRules(data: any): ValidationRule[] {
  const rules: ValidationRule[] = [];

  if (typeof data !== 'object' || data === null) {
    return rules;
  }

  if (typeof data.min === 'number') {
    rules.push({
      type: 'min',
      value: data.min,
      message: typeof data.message === 'string' ? data.message : undefined,
    });
  }

  if (typeof data.max === 'number') {
    rules.push({
      type: 'max',
      value: data.max,
      message: typeof data.message === 'string' ? data.message : undefined,
    });
  }

  if (typeof data.minLength === 'number') {
    rules.push({
      type: 'minLength',
      value: data.minLength,
      message: typeof data.message === 'string' ? data.message : undefined,
    });
  }

  if (typeof data.maxLength === 'number') {
    rules.push({
      type: 'maxLength',
      value: data.maxLength,
      message: typeof data.message === 'string' ? data.message : undefined,
    });
  }

  return rules;
}

function normalizeValidationData(data: any): any {
  if (typeof data === 'boolean') {
    return { required: data };
  }
  if (typeof data === 'object' && data !== null) {
    return data;
  }
  return {};
}

function parseValidationRules(data: any): ValidationRule[] {
  const rules: ValidationRule[] = [];

  if (data === null || data === undefined) {
    return rules;
  }

  const normalized = normalizeValidationData(data);

  if (normalized.required !== undefined) {
    const requiredRule = parseRequiredRule(normalized.required);
    if (requiredRule) {
      rules.push(requiredRule);
    }
  }

  if (normalized.validation) {
    if (Array.isArray(normalized.validation)) {
      for (const rule of normalized.validation) {
        if (rule && typeof rule === 'object' && rule.type) {
          if (rule.type === 'required') {
            const requiredRule = parseRequiredRule(rule);
            if (requiredRule) {
              rules.push(requiredRule);
            }
          } else if (rule.type === 'min' || rule.type === 'max' || rule.type === 'minLength' || rule.type === 'maxLength') {
            rules.push({
              type: rule.type,
              value: rule.value,
              message: rule.message,
            });
          }
        }
      }
    } else {
      const minMaxRules = parseMinMaxRules(normalized.validation);
      rules.push(...minMaxRules);
    }
  } else if (normalized.min !== undefined || normalized.max !== undefined || normalized.minLength !== undefined || normalized.maxLength !== undefined) {
    const minMaxRules = parseMinMaxRules(normalized);
    rules.push(...minMaxRules);
  }

  return rules;
}

function createValidationRuleParser(): ValidationRuleParser {
  return {
    parse: (data: any) => parseValidationRules(data),
    normalize: (data: any) => normalizeValidationData(data),
  };
}

function parseTextQuestion(data: any): Question {
  const validation = parseValidationRules(data);
  const question: Question = {
    id: convertToString(data.id, 'id'),
    type: 'text',
    label: convertToString(data.label, 'label'),
    required: data.required === true,
    visible: data.visible !== undefined ? data.visible === true : undefined,
    placeholder: data.placeholder ? convertToString(data.placeholder, 'placeholder') : undefined,
    defaultValue: data.defaultValue ? convertToString(data.defaultValue, 'defaultValue') : undefined,
    validation: validation.length > 0 ? validation : undefined,
  };
  return question;
}

function parseNumberQuestion(data: any): Question {
  const validation = parseValidationRules(data);
  const question: Question = {
    id: convertToString(data.id, 'id'),
    type: 'number',
    label: convertToString(data.label, 'label'),
    required: data.required === true,
    visible: data.visible !== undefined ? data.visible === true : undefined,
    min: data.min !== undefined ? convertToNumber(data.min, 'min') : undefined,
    max: data.max !== undefined ? convertToNumber(data.max, 'max') : undefined,
    step: data.step !== undefined ? convertToNumber(data.step, 'step') : undefined,
    defaultValue: data.defaultValue !== undefined ? convertToNumber(data.defaultValue, 'defaultValue') : undefined,
    validation: validation.length > 0 ? validation : undefined,
  };
  return question;
}

function parseMultipleChoiceQuestion(data: any): Question {
  const validation = parseValidationRules(data);
  const options = convertToArray(data.options, 'options');
  const stringOptions = options.map((opt: any, index: number) => {
    if (typeof opt === 'string') {
      return opt;
    }
    if (typeof opt === 'object' && opt !== null && opt.value !== undefined) {
      return convertToString(opt.value, `options[${index}].value`);
    }
    return convertToString(opt, `options[${index}]`);
  });

  const question: Question = {
    id: convertToString(data.id, 'id'),
    type: 'multiple-choice',
    label: convertToString(data.label, 'label'),
    required: data.required === true,
    visible: data.visible !== undefined ? data.visible === true : undefined,
    options: stringOptions,
    defaultValue: data.defaultValue ? convertToString(data.defaultValue, 'defaultValue') : undefined,
    validation: validation.length > 0 ? validation : undefined,
  };
  return question;
}

function createTextQuestionParser(): QuestionParser {
  return {
    parse: (data: any) => parseTextQuestion(data),
    canParse: (type: QuestionType) => type === 'text',
    validate: (data: any) => validateQuestionStructure(data, 'question'),
  };
}

function createNumberQuestionParser(): QuestionParser {
  return {
    parse: (data: any) => parseNumberQuestion(data),
    canParse: (type: QuestionType) => type === 'number',
    validate: (data: any) => validateQuestionStructure(data, 'question'),
  };
}

function createMultipleChoiceQuestionParser(): QuestionParser {
  return {
    parse: (data: any) => parseMultipleChoiceQuestion(data),
    canParse: (type: QuestionType) => type === 'multiple-choice',
    validate: (data: any) => validateQuestionStructure(data, 'question'),
  };
}

const questionParserRegistry = new Map<QuestionType, QuestionParser>();

function registerQuestionParser(type: QuestionType, parser: QuestionParser): void {
  questionParserRegistry.set(type, parser);
}

function getQuestionParser(type: QuestionType): QuestionParser | undefined {
  return questionParserRegistry.get(type);
}

function parseQuestion(data: any): Question {
  const type = convertToString(data.type, 'type');
  if (!isValidQuestionType(type)) {
    throw new InvalidTypeError(formatTypeError('type', "'text' | 'number' | 'multiple-choice'", type));
  }

  const parser = getQuestionParser(type);
  if (!parser) {
    throw new InvalidTypeError(`No parser registered for question type: ${type}`);
  }

  return parser.parse(data);
}

registerQuestionParser('text', createTextQuestionParser());
registerQuestionParser('number', createNumberQuestionParser());
registerQuestionParser('multiple-choice', createMultipleChoiceQuestionParser());

function validateFormulaId(id: any): ValidationResult {
  if (id === null || id === undefined || id === '') {
    return { isValid: false, errors: ['Formula id is required'] };
  }
  if (typeof id !== 'string') {
    return { isValid: false, errors: [formatTypeError('formula.id', 'string', id)] };
  }
  return { isValid: true, errors: [] };
}

function validateFormulaExpression(expression: any): ValidationResult {
  if (expression === null || expression === undefined || expression === '') {
    return { isValid: false, errors: ['Formula expression is required'] };
  }
  if (typeof expression !== 'string') {
    return { isValid: false, errors: [formatTypeError('formula.expression', 'string', expression)] };
  }
  return { isValid: true, errors: [] };
}

function validateFormulaTarget(target: any): ValidationResult {
  if (target === null || target === undefined) {
    return { isValid: true, errors: [] };
  }
  if (typeof target !== 'string') {
    return { isValid: false, errors: [formatTypeError('formula.target', 'string', target)] };
  }
  return { isValid: true, errors: [] };
}

function validateFormulaStructure(data: any): ValidationResult {
  const errors: string[] = [];

  const idResult = validateFormulaId(data.id);
  if (!idResult.isValid) errors.push(...idResult.errors);

  const expressionResult = validateFormulaExpression(data.expression);
  if (!expressionResult.isValid) errors.push(...expressionResult.errors);

  const targetResult = validateFormulaTarget(data.target);
  if (!targetResult.isValid) errors.push(...targetResult.errors);

  return { isValid: errors.length === 0, errors };
}

function parseFormula(data: any): Formula {
  const idResult = validateFormulaId(data.id);
  if (!idResult.isValid) {
    throw new InvalidStructureError(idResult.errors.join(', '));
  }

  const expressionResult = validateFormulaExpression(data.expression);
  if (!expressionResult.isValid) {
    throw new InvalidStructureError(expressionResult.errors.join(', '));
  }

  const formula: Formula = {
    id: convertToString(data.id, 'formula.id'),
    expression: convertToString(data.expression, 'formula.expression'),
    target: data.target ? convertToString(data.target, 'formula.target') : undefined,
  };

  return formula;
}

function parseFormulaArray(data: any[]): Formula[] {
  return data.map((item, index) => {
    try {
      return parseFormula(item);
    } catch (error) {
      if (error instanceof Error) {
        throw new InvalidStructureError(`Error parsing formula at index ${index}: ${error.message}`);
      }
      throw error;
    }
  });
}

function createFormulaParser(): FormulaParser {
  return {
    parse: (data: any) => parseFormula(data),
    validate: (data: any) => validateFormulaStructure(data),
  };
}

function validateActionType(type: any): ValidationResult {
  if (type === null || type === undefined || type === '') {
    return { isValid: false, errors: ['Action type is required'] };
  }
  if (typeof type !== 'string') {
    return { isValid: false, errors: [formatTypeError('action.type', 'string', type)] };
  }
  if (!isValidActionType(type)) {
    return { isValid: false, errors: [formatTypeError('action.type', "'show' | 'hide'", type)] };
  }
  return { isValid: true, errors: [] };
}

function validateActionCondition(condition: any): ValidationResult {
  if (condition === null || condition === undefined || condition === '') {
    return { isValid: false, errors: ['Action condition is required'] };
  }
  if (typeof condition !== 'string') {
    return { isValid: false, errors: [formatTypeError('action.condition', 'string', condition)] };
  }
  return { isValid: true, errors: [] };
}

function validateActionTarget(target: any): ValidationResult {
  if (target === null || target === undefined || target === '') {
    return { isValid: false, errors: ['Action target is required'] };
  }
  if (typeof target !== 'string') {
    return { isValid: false, errors: [formatTypeError('action.target', 'string', target)] };
  }
  return { isValid: true, errors: [] };
}

function validateActionStructure(data: any): ValidationResult {
  const errors: string[] = [];

  const typeResult = validateActionType(data.type);
  if (!typeResult.isValid) errors.push(...typeResult.errors);

  const conditionResult = validateActionCondition(data.condition);
  if (!conditionResult.isValid) errors.push(...conditionResult.errors);

  const targetResult = validateActionTarget(data.target);
  if (!targetResult.isValid) errors.push(...targetResult.errors);

  return { isValid: errors.length === 0, errors };
}

function parseAction(data: any): Action {
  const typeResult = validateActionType(data.type);
  if (!typeResult.isValid) {
    throw new InvalidStructureError(typeResult.errors.join(', '));
  }

  const conditionResult = validateActionCondition(data.condition);
  if (!conditionResult.isValid) {
    throw new InvalidStructureError(conditionResult.errors.join(', '));
  }

  const targetResult = validateActionTarget(data.target);
  if (!targetResult.isValid) {
    throw new InvalidStructureError(targetResult.errors.join(', '));
  }

  const type = data.type as ActionType;
  const action: Action = {
    type,
    condition: convertToString(data.condition, 'action.condition'),
    target: convertToString(data.target, 'action.target'),
  };

  return action;
}

function parseActionArray(data: any[]): Action[] {
  return data.map((item, index) => {
    try {
      return parseAction(item);
    } catch (error) {
      if (error instanceof Error) {
        throw new InvalidStructureError(`Error parsing action at index ${index}: ${error.message}`);
      }
      throw error;
    }
  });
}

function createActionParser(): ActionParser {
  return {
    parse: (data: any) => parseAction(data),
    validate: (data: any) => validateActionStructure(data),
  };
}

function parseSection(data: any): Section {
  const id = convertToString(data.id, 'section.id');
  const title = convertToString(data.title, 'section.title');
  const questionsData = convertToArray(data.questions, 'section.questions');

  const questions = questionsData.map((qData: any, index: number) => {
    try {
      return parseQuestion(qData);
    } catch (error) {
      if (error instanceof Error) {
        throw new InvalidStructureError(`Error parsing question at index ${index} in section ${id}: ${error.message}`);
      }
      throw error;
    }
  });

  return {
    id,
    title,
    questions,
  };
}

function parseQuestionnaire(data: any): Questionnaire {
  const validationResult = validateQuestionnaireStructure(data);
  if (!validationResult.isValid) {
    throw new InvalidStructureError(`Invalid questionnaire structure: ${validationResult.errors.join(', ')}`);
  }

  const id = convertToString(data.id, 'id');
  const title = convertToString(data.title, 'title');
  const sectionsData = convertToArray(data.sections, 'sections');

  const sections = sectionsData.map((sectionData: any, index: number) => {
    try {
      return parseSection(sectionData);
    } catch (error) {
      if (error instanceof Error) {
        throw new InvalidStructureError(`Error parsing section at index ${index}: ${error.message}`);
      }
      throw error;
    }
  });

  const formulas = data.formulas ? parseFormulaArray(convertToArray(data.formulas, 'formulas')) : undefined;
  const actions = data.actions ? parseActionArray(convertToArray(data.actions, 'actions')) : undefined;

  return {
    id,
    title,
    sections,
    formulas,
    actions,
  };
}

export function createJSONLoader(): JSONLoader {
  return {
    loadFromString(jsonString: string): Questionnaire {
      try {
        const parsed = JSON.parse(jsonString);
        return this.loadFromObject(parsed);
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new InvalidJSONError(`Invalid JSON syntax: ${error.message}`);
        }
        throw error;
      }
    },

    loadFromObject(jsonObject: any): Questionnaire {
      return parseQuestionnaire(jsonObject);
    },

    validateStructure(data: any): ValidationResult {
      return validateQuestionnaireStructure(data);
    },

    parseQuestionnaire(data: any): Questionnaire {
      return parseQuestionnaire(data);
    },
  };
}
