import type { Validator } from './Validator';
import type { ValidationRule, ValidationRuleType, ValidationResult } from '../types/validation';
import type { AnswerValue } from '../types/answers';
import { createRequiredValidator } from './functions/requiredValidator';
import { createMinMaxValidator } from './functions/minMaxValidator';

const registry = new Map<ValidationRuleType, Validator>();

function registerValidator(validator: Validator): void {
  const types = Array.isArray(validator.type) ? validator.type : [validator.type];
  for (const type of types) {
    registry.set(type, validator);
  }
}

function getValidator(ruleType: ValidationRuleType): Validator | undefined {
  return registry.get(ruleType);
}

function validateValue(
  value: AnswerValue,
  rules: ValidationRule[],
  questionId?: string,
  question?: any
): ValidationResult {
  const allErrors: ValidationResult['errors'] = [];
  let isValid = true;

  for (const rule of rules) {
    const validator = getValidator(rule.type);
    if (!validator) {
      allErrors.push({
        questionId: questionId || '',
        rule: rule.type,
        message: `No validator found for rule type: ${rule.type}`,
      });
      isValid = false;
      continue;
    }

    if (!validator.canValidate(rule)) {
      continue;
    }

    const result = validator.validate(value, rule, question);
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

function getRegisteredTypes(): ValidationRuleType[] {
  return Array.from(registry.keys());
}

registerValidator(createRequiredValidator());
registerValidator(createMinMaxValidator());

export {
  registerValidator,
  getValidator,
  validateValue,
  getRegisteredTypes,
};
