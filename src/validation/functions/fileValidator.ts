import type { Validator } from '../Validator';
import type { ValidationRule, ValidationResult, ValidationError } from '../../types/validation';
import type { Question } from '../../types/questions';
import type { AnswerValue } from '../../types/answers';
import type { FileAnswerValue } from '../../types/answers';

function isFileAnswerValue(value: AnswerValue): value is FileAnswerValue {
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const o = value as unknown as Record<string, unknown>;
  return typeof o.name === 'string' && typeof o.size === 'number' && typeof o.type === 'string';
}

function getExtension(name: string): string {
  const lastDot = name.lastIndexOf('.');
  if (lastDot === -1) return '';
  return name.slice(lastDot).toLowerCase();
}

function normalizeExtension(ext: string): string {
  const trimmed = ext.trim().toLowerCase();
  return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
}

const FILE_RULE_TYPES = ['allowedExtensions', 'maxSizeBytes', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight'] as const;

export function createFileValidator(): Validator {
  return {
    type: [...FILE_RULE_TYPES],
    canValidate(rule: ValidationRule): boolean {
      return FILE_RULE_TYPES.includes(rule.type as (typeof FILE_RULE_TYPES)[number]);
    },
    validate(value: AnswerValue, rule: ValidationRule, question?: Question): ValidationResult {
      return validateFileRule(value, rule, question);
    },
  };
}

export function validateFileRule(
  value: AnswerValue,
  rule: ValidationRule,
  question?: Question
): ValidationResult {
  const errors: ValidationError[] = [];
  const questionId = question?.id || '';

  if (question?.type !== 'file') {
    return { isValid: true, errors: [] };
  }

  if (!isFileAnswerValue(value)) {
    return { isValid: true, errors: [] };
  }

  if (rule.type === 'allowedExtensions') {
    const allowed = Array.isArray(rule.value) ? rule.value : [];
    if (allowed.length > 0) {
      const ext = getExtension(value.name);
      const normalizedExt = ext ? normalizeExtension(ext) : ext;
      const normalizedAllowed = allowed.map(normalizeExtension);
      const isAllowed =
        normalizedAllowed.includes(normalizedExt) ||
        (value.type && normalizedAllowed.some((a) => a.slice(1) === value.type.split('/')[1]));
      if (!isAllowed) {
        errors.push({
          questionId,
          rule: 'allowedExtensions',
          message: rule.message || `File type not allowed. Allowed: ${allowed.join(', ')}`,
        });
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  const numValue = typeof rule.value === 'number' ? rule.value : undefined;
  if (numValue === undefined && rule.type !== 'allowedExtensions') {
    return { isValid: true, errors: [] };
  }

  if (rule.type === 'maxSizeBytes' && numValue !== undefined) {
    if (value.size > numValue) {
      errors.push({
        questionId,
        rule: 'maxSizeBytes',
        message: rule.message || `File size must not exceed ${numValue} bytes`,
      });
    }
    return { isValid: errors.length === 0, errors };
  }

  const fileKind = question?.type === 'file' && 'fileKind' in question ? (question as { fileKind?: string }).fileKind : undefined;
  const isDimensionRule =
    rule.type === 'minWidth' ||
    rule.type === 'maxWidth' ||
    rule.type === 'minHeight' ||
    rule.type === 'maxHeight';
  if (isDimensionRule && (fileKind === 'image' || value.width !== undefined || value.height !== undefined)) {
    const w = value.width;
    const h = value.height;
    if (w === undefined || h === undefined) {
      if (rule.type === 'minWidth' || rule.type === 'maxWidth' || rule.type === 'minHeight' || rule.type === 'maxHeight') {
        errors.push({
          questionId,
          rule: rule.type,
          message: rule.message || 'Image dimensions (width, height) are required',
        });
      }
      return { isValid: errors.length === 0, errors };
    }
    if (rule.type === 'minWidth' && numValue !== undefined && w < numValue) {
      errors.push({
        questionId,
        rule: 'minWidth',
        message: rule.message || `Image width must be at least ${numValue}px`,
      });
    }
    if (rule.type === 'maxWidth' && numValue !== undefined && w > numValue) {
      errors.push({
        questionId,
        rule: 'maxWidth',
        message: rule.message || `Image width must be at most ${numValue}px`,
      });
    }
    if (rule.type === 'minHeight' && numValue !== undefined && h < numValue) {
      errors.push({
        questionId,
        rule: 'minHeight',
        message: rule.message || `Image height must be at least ${numValue}px`,
      });
    }
    if (rule.type === 'maxHeight' && numValue !== undefined && h > numValue) {
      errors.push({
        questionId,
        rule: 'maxHeight',
        message: rule.message || `Image height must be at most ${numValue}px`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
