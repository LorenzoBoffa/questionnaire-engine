import type { ScoringConfig, ScoreFormula } from '../types/scoring';
import type { ValidationResult } from './json-loader';
import { InvalidJSONError, InvalidStructureError, InvalidTypeError } from './json-loader';

export interface ScoringConfigLoader {
  loadFromString(jsonString: string): ScoringConfig;
  loadFromObject(jsonObject: any): ScoringConfig;
  validateStructure(data: any): ValidationResult;
}

function formatMissingFieldError(path: string, field: string): string {
  return `Missing required field: ${path}.${field}`;
}

function formatTypeError(path: string, expected: string, actual: any): string {
  const actualType = typeof actual === 'object' && actual !== null ? Array.isArray(actual) ? 'array' : 'object' : typeof actual;
  return `Invalid type for ${path}: expected ${expected}, got ${actualType}`;
}

function convertToString(value: any, path: string): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    throw new InvalidTypeError(formatTypeError(path, 'string', value));
  }
  throw new InvalidTypeError(formatTypeError(path, 'string', value));
}

function convertToArray(value: any, path: string): any[] {
  if (Array.isArray(value)) {
    return value;
  }
  throw new InvalidTypeError(formatTypeError(path, 'array', value));
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

function validateType(value: any, expectedType: string, path: string): ValidationResult {
  try {
    switch (expectedType) {
      case 'string':
        convertToString(value, path);
        return { isValid: true, errors: [] };
      case 'array':
        convertToArray(value, path);
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

function isValidResultType(type: string): type is 'number' | 'percentage' | 'category' {
  return type === 'number' || type === 'percentage' || type === 'category';
}

function validateScoreFormulaStructure(data: any, index: number): ValidationResult {
  const path = `formulas[${index}]`;
  const errors: string[] = [];

  const idResult = validateRequiredField(data, 'id', path);
  if (!idResult.isValid) errors.push(...idResult.errors);

  const parameterNameResult = validateRequiredField(data, 'parameterName', path);
  if (!parameterNameResult.isValid) errors.push(...parameterNameResult.errors);

  const expressionResult = validateRequiredField(data, 'expression', path);
  if (!expressionResult.isValid) errors.push(...expressionResult.errors);

  if (idResult.isValid) {
    const idTypeResult = validateFieldType(data, 'id', 'string', path);
    if (!idTypeResult.isValid) errors.push(...idTypeResult.errors);
  }

  if (parameterNameResult.isValid) {
    const parameterNameTypeResult = validateFieldType(data, 'parameterName', 'string', path);
    if (!parameterNameTypeResult.isValid) errors.push(...parameterNameTypeResult.errors);
  }

  if (expressionResult.isValid) {
    const expressionTypeResult = validateFieldType(data, 'expression', 'string', path);
    if (!expressionTypeResult.isValid) errors.push(...expressionTypeResult.errors);
  }

  if (data.resultType !== undefined) {
    if (typeof data.resultType !== 'string') {
      errors.push(formatTypeError(`${path}.resultType`, 'string', data.resultType));
    } else if (!isValidResultType(data.resultType)) {
      errors.push(`Invalid resultType at ${path}.resultType: expected 'number' | 'percentage' | 'category', got '${data.resultType}'`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

function validateScoringConfigStructure(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Scoring config data must be an object'] };
  }

  const formulasResult = validateRequiredField(data, 'formulas', '');
  if (!formulasResult.isValid) {
    errors.push(...formulasResult.errors);
  } else {
    const formulasTypeResult = validateFieldType(data, 'formulas', 'array', '');
    if (!formulasTypeResult.isValid) {
      errors.push(...formulasTypeResult.errors);
    } else {
      const formulas = data.formulas;
      if (Array.isArray(formulas)) {
        formulas.forEach((formula: any, index: number) => {
          const formulaResult = validateScoreFormulaStructure(formula, index);
          if (!formulaResult.isValid) {
            errors.push(...formulaResult.errors);
          }
        });
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

function parseScoreFormula(data: any, index: number): ScoreFormula {
  const path = `formulas[${index}]`;
  
  const idResult = validateRequiredField(data, 'id', path);
  if (!idResult.isValid) {
    throw new InvalidStructureError(idResult.errors.join(', '));
  }

  const parameterNameResult = validateRequiredField(data, 'parameterName', path);
  if (!parameterNameResult.isValid) {
    throw new InvalidStructureError(parameterNameResult.errors.join(', '));
  }

  const expressionResult = validateRequiredField(data, 'expression', path);
  if (!expressionResult.isValid) {
    throw new InvalidStructureError(expressionResult.errors.join(', '));
  }

  const idTypeResult = validateFieldType(data, 'id', 'string', path);
  if (!idTypeResult.isValid) {
    throw new InvalidTypeError(idTypeResult.errors.join(', '));
  }

  const parameterNameTypeResult = validateFieldType(data, 'parameterName', 'string', path);
  if (!parameterNameTypeResult.isValid) {
    throw new InvalidTypeError(parameterNameTypeResult.errors.join(', '));
  }

  const expressionTypeResult = validateFieldType(data, 'expression', 'string', path);
  if (!expressionTypeResult.isValid) {
    throw new InvalidTypeError(expressionTypeResult.errors.join(', '));
  }

  const formula: ScoreFormula = {
    id: convertToString(data.id, `${path}.id`),
    parameterName: convertToString(data.parameterName, `${path}.parameterName`),
    expression: convertToString(data.expression, `${path}.expression`),
  };

  if (data.resultType !== undefined) {
    if (typeof data.resultType !== 'string') {
      throw new InvalidTypeError(formatTypeError(`${path}.resultType`, 'string', data.resultType));
    }
    if (!isValidResultType(data.resultType)) {
      throw new InvalidStructureError(`Invalid resultType at ${path}.resultType: expected 'number' | 'percentage' | 'category', got '${data.resultType}'`);
    }
    formula.resultType = data.resultType;
  }

  return formula;
}

function parseScoringConfig(data: any): ScoringConfig {
  const validationResult = validateScoringConfigStructure(data);
  if (!validationResult.isValid) {
    throw new InvalidStructureError(`Invalid scoring config structure: ${validationResult.errors.join(', ')}`);
  }

  const formulasData = convertToArray(data.formulas, 'formulas');
  const formulas = formulasData.map((formulaData: any, index: number) => {
    try {
      return parseScoreFormula(formulaData, index);
    } catch (error) {
      if (error instanceof InvalidTypeError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new InvalidStructureError(`Error parsing formula at index ${index}: ${error.message}`);
      }
      throw error;
    }
  });

  return {
    formulas,
  };
}

export function createScoringConfigLoader(): ScoringConfigLoader {
  return {
    loadFromString(jsonString: string): ScoringConfig {
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

    loadFromObject(jsonObject: any): ScoringConfig {
      return parseScoringConfig(jsonObject);
    },

    validateStructure(data: any): ValidationResult {
      return validateScoringConfigStructure(data);
    },
  };
}
