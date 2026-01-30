import type { FileQuestion as FileQuestionData, Question } from '../types/questions';
import type { AnswerValue, ValidationResult, ValidationError } from '../types';
import type { FileAnswerValue } from '../types/answers';
import type { BaseQuestion } from './base';

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

export function createFileQuestion(data: Question): BaseQuestion {
  if (data.type !== 'file') {
    throw new Error('Invalid question type for FileQuestion');
  }
  const fileData = data as FileQuestionData;

  const question: BaseQuestion = {
    id: fileData.id,
    type: 'file',
    label: fileData.label,
    required: fileData.required ?? false,
    visible: fileData.visible !== undefined ? fileData.visible : true,
    validate: (value: AnswerValue) => validateFileQuestion(value, fileData),
    getDefaultValue: () => getFileQuestionDefaultValue(),
    serialize: () => serializeFileQuestion(question, fileData),
  };
  return question;
}

export function validateFileQuestion(
  value: AnswerValue,
  question: FileQuestionData
): ValidationResult {
  const errors: ValidationError[] = [];

  if (question.required) {
    if (!isFileAnswerValue(value)) {
      errors.push({
        questionId: question.id,
        rule: 'required',
        message: question.validation?.find(r => r.type === 'required')?.message || 'A file must be selected',
      });
      return { isValid: false, errors };
    }
  }

  if (!isFileAnswerValue(value)) {
    return { isValid: true, errors: [] };
  }

  const allowedExtensionsRule = question.validation?.find((r) => r.type === 'allowedExtensions');
  const allowedExtensions =
    (allowedExtensionsRule && Array.isArray(allowedExtensionsRule.value) ? allowedExtensionsRule.value : undefined) ??
    question.allowedExtensions;
  if (allowedExtensions && allowedExtensions.length > 0) {
    const ext = getExtension(value.name);
    const normalizedExt = ext ? normalizeExtension(ext) : ext;
    const normalizedAllowed = allowedExtensions.map(normalizeExtension);
    const allowed =
      normalizedAllowed.includes(normalizedExt) ||
      (value.type && normalizedAllowed.some((a) => a.slice(1) === value.type.split('/')[1]));
    if (!allowed) {
      errors.push({
        questionId: question.id,
        rule: 'allowedExtensions',
        message:
          (allowedExtensionsRule && allowedExtensionsRule.message) ||
          `File type not allowed. Allowed: ${allowedExtensions.join(', ')}`,
      });
    }
  }

  const maxSizeBytesRule = question.validation?.find((r) => r.type === 'maxSizeBytes');
  const maxSizeBytes =
    (maxSizeBytesRule && typeof maxSizeBytesRule.value === 'number' ? maxSizeBytesRule.value : undefined) ??
    question.maxSizeBytes;
  if (maxSizeBytes !== undefined && value.size > maxSizeBytes) {
    errors.push({
      questionId: question.id,
      rule: 'maxSizeBytes',
      message:
        (maxSizeBytesRule && maxSizeBytesRule.message) ||
        `File size must not exceed ${maxSizeBytes} bytes`,
    });
  }

  const minWidthRule = question.validation?.find((r) => r.type === 'minWidth');
  const maxWidthRule = question.validation?.find((r) => r.type === 'maxWidth');
  const minHeightRule = question.validation?.find((r) => r.type === 'minHeight');
  const maxHeightRule = question.validation?.find((r) => r.type === 'maxHeight');
  const minWidth =
    (minWidthRule && typeof minWidthRule.value === 'number' ? minWidthRule.value : undefined) ?? question.minWidth;
  const maxWidth =
    (maxWidthRule && typeof maxWidthRule.value === 'number' ? maxWidthRule.value : undefined) ?? question.maxWidth;
  const minHeight =
    (minHeightRule && typeof minHeightRule.value === 'number' ? minHeightRule.value : undefined) ?? question.minHeight;
  const maxHeight =
    (maxHeightRule && typeof maxHeightRule.value === 'number' ? maxHeightRule.value : undefined) ?? question.maxHeight;
  const hasDimensionProps =
    minWidth !== undefined || maxWidth !== undefined || minHeight !== undefined || maxHeight !== undefined;
  const fileKind =
    question.fileKind ??
    (hasDimensionProps ? 'image' : undefined);
  const isImage = fileKind === 'image';
  const hasDimensionRules = isImage && hasDimensionProps;
  if (hasDimensionRules) {
    const w = value.width;
    const h = value.height;
    if (w === undefined || h === undefined) {
      errors.push({
        questionId: question.id,
        rule: 'minWidth',
        message: minWidthRule?.message ?? 'Image dimensions (width, height) are required',
      });
    } else {
      if (minWidth !== undefined && w < minWidth) {
        errors.push({
          questionId: question.id,
          rule: 'minWidth',
          message: minWidthRule?.message ?? `Image width must be at least ${minWidth}px`,
        });
      }
      if (maxWidth !== undefined && w > maxWidth) {
        errors.push({
          questionId: question.id,
          rule: 'maxWidth',
          message: maxWidthRule?.message ?? `Image width must be at most ${maxWidth}px`,
        });
      }
      if (minHeight !== undefined && h < minHeight) {
        errors.push({
          questionId: question.id,
          rule: 'minHeight',
          message: minHeightRule?.message ?? `Image height must be at least ${minHeight}px`,
        });
      }
      if (maxHeight !== undefined && h > maxHeight) {
        errors.push({
          questionId: question.id,
          rule: 'maxHeight',
          message: maxHeightRule?.message ?? `Image height must be at most ${maxHeight}px`,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getFileQuestionDefaultValue(): undefined {
  return undefined;
}

export function serializeFileQuestion(question: BaseQuestion, originalData: FileQuestionData): Question {
  return {
    id: question.id,
    type: 'file',
    label: question.label,
    required: question.required,
    visible: question.visible,
    fileKind: originalData.fileKind,
    allowedExtensions: originalData.allowedExtensions,
    maxSizeBytes: originalData.maxSizeBytes,
    minWidth: originalData.minWidth,
    maxWidth: originalData.maxWidth,
    minHeight: originalData.minHeight,
    maxHeight: originalData.maxHeight,
    validation: originalData.validation,
  };
}
