import { describe, it, expect } from 'vitest';
import {
  createFileQuestion,
  validateFileQuestion,
  getFileQuestionDefaultValue,
  serializeFileQuestion,
} from '../../questions/fileQuestion';
import { createFileQuestion as createTestFileQuestion } from '../fixtures/helpers';
import type { FileQuestion } from '../../types/questions';
import type { FileAnswerValue } from '../../types/answers';

describe('FileQuestion', () => {
  describe('createFileQuestion', () => {
    it('should create a file question with valid data', () => {
      const questionData = createTestFileQuestion({
        id: 'q1',
        label: 'Upload document',
      });

      const question = createFileQuestion(questionData);

      expect(question.id).toBe('q1');
      expect(question.type).toBe('file');
      expect(question.label).toBe('Upload document');
      expect(question.required).toBe(false);
      expect(question.visible).toBe(true);
    });

    it('should throw error for invalid question type', () => {
      const invalidData = { id: 'q1', type: 'text', label: 'Test' } as any;

      expect(() => createFileQuestion(invalidData)).toThrow('Invalid question type for FileQuestion');
    });
  });

  describe('validateFileQuestion', () => {
    it('should validate required field with valid file metadata', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        required: true,
      });
      const value: FileAnswerValue = { name: 'doc.pdf', size: 1000, type: 'application/pdf' };
      const result = validateFileQuestion(value, question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for required field without value', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        required: true,
      });
      const result = validateFileQuestion(null, question);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('required');
    });

    it('should pass validation for optional field without value', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        required: false,
      });
      const result = validateFileQuestion(null, question);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate allowedExtensions', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        allowedExtensions: ['.pdf', '.jpg'],
      });
      const validPdf: FileAnswerValue = { name: 'doc.pdf', size: 1000, type: 'application/pdf' };
      const resultPdf = validateFileQuestion(validPdf, question);
      expect(resultPdf.isValid).toBe(true);

      const invalidExt: FileAnswerValue = { name: 'doc.exe', size: 1000, type: 'application/octet-stream' };
      const resultInvalid = validateFileQuestion(invalidExt, question);
      expect(resultInvalid.isValid).toBe(false);
      expect(resultInvalid.errors.some(e => e.message.includes('not allowed'))).toBe(true);
    });

    it('should validate maxSizeBytes', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        maxSizeBytes: 500,
      });
      const tooLarge: FileAnswerValue = { name: 'doc.pdf', size: 1000, type: 'application/pdf' };
      const result = validateFileQuestion(tooLarge, question);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('exceed'))).toBe(true);
    });

    it('should pass when size within limit', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        maxSizeBytes: 2000,
      });
      const value: FileAnswerValue = { name: 'doc.pdf', size: 1000, type: 'application/pdf' };
      const result = validateFileQuestion(value, question);

      expect(result.isValid).toBe(true);
    });

    it('should validate dimension constraints when fileKind is image', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        fileKind: 'image',
        minWidth: 100,
        maxWidth: 500,
        minHeight: 100,
        maxHeight: 500,
      });
      const valueNoDims: FileAnswerValue = { name: 'img.jpg', size: 1000, type: 'image/jpeg' };
      const resultNoDims = validateFileQuestion(valueNoDims, question);
      expect(resultNoDims.isValid).toBe(false);
      expect(resultNoDims.errors.some(e => e.message.includes('dimensions'))).toBe(true);

      const valueWithDims: FileAnswerValue = { name: 'img.jpg', size: 1000, type: 'image/jpeg', width: 200, height: 200 };
      const resultWithDims = validateFileQuestion(valueWithDims, question);
      expect(resultWithDims.isValid).toBe(true);
    });

    it('should skip dimension validation when fileKind is document', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        fileKind: 'document',
        allowedExtensions: ['.pdf', '.csv', '.txt'],
        minWidth: 100,
        maxWidth: 500,
      });
      const valueNoDims: FileAnswerValue = { name: 'report.pdf', size: 500, type: 'application/pdf' };
      const result = validateFileQuestion(valueNoDims, question);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate dimension constraints when dimension rules set and no fileKind (backward compat)', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        minWidth: 100,
        maxWidth: 500,
        minHeight: 100,
        maxHeight: 500,
      });
      const valueNoDims: FileAnswerValue = { name: 'img.jpg', size: 1000, type: 'image/jpeg' };
      const resultNoDims = validateFileQuestion(valueNoDims, question);
      expect(resultNoDims.isValid).toBe(false);
    });

    it('should fail when width below minWidth (image)', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        fileKind: 'image',
        minWidth: 100,
        minHeight: 100,
      });
      const value: FileAnswerValue = { name: 'img.jpg', size: 1000, type: 'image/jpeg', width: 50, height: 200 };
      const result = validateFileQuestion(value, question);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('width'))).toBe(true);
    });

    it('should validate allowedExtensions from validation array only (no direct props)', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        validation: [{ type: 'allowedExtensions', value: ['.pdf', '.jpg'] }],
      });
      const validPdf: FileAnswerValue = { name: 'doc.pdf', size: 1000, type: 'application/pdf' };
      expect(validateFileQuestion(validPdf, question).isValid).toBe(true);

      const invalidExt: FileAnswerValue = { name: 'doc.exe', size: 1000, type: 'application/octet-stream' };
      const result = validateFileQuestion(invalidExt, question);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].rule).toBe('allowedExtensions');
    });

    it('should validate maxSizeBytes from validation array only (no direct props)', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        validation: [{ type: 'maxSizeBytes', value: 500 }],
      });
      const tooLarge: FileAnswerValue = { name: 'doc.pdf', size: 1000, type: 'application/pdf' };
      const result = validateFileQuestion(tooLarge, question);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].rule).toBe('maxSizeBytes');
    });

    it('should validate dimension constraints from validation array only (no direct props)', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        fileKind: 'image',
        validation: [
          { type: 'minWidth', value: 100 },
          { type: 'maxWidth', value: 500 },
          { type: 'minHeight', value: 100 },
          { type: 'maxHeight', value: 500 },
        ],
      });
      const valueWithDims: FileAnswerValue = { name: 'img.jpg', size: 1000, type: 'image/jpeg', width: 200, height: 200 };
      expect(validateFileQuestion(valueWithDims, question).isValid).toBe(true);

      const valueTooNarrow: FileAnswerValue = { name: 'img.jpg', size: 1000, type: 'image/jpeg', width: 50, height: 200 };
      const result = validateFileQuestion(valueTooNarrow, question);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.rule === 'minWidth')).toBe(true);
    });

    it('should use direct props when validation array does not contain rule (fallback)', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        allowedExtensions: ['.pdf'],
      });
      const invalidExt: FileAnswerValue = { name: 'doc.exe', size: 1000, type: 'application/octet-stream' };
      const result = validateFileQuestion(invalidExt, question);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].rule).toBe('allowedExtensions');
    });

    it('should prefer validation array over direct props when both present', () => {
      const question = createTestFileQuestion({
        id: 'q1',
        allowedExtensions: ['.exe'],
        validation: [{ type: 'allowedExtensions', value: ['.pdf'], message: 'Only PDF allowed' }],
      });
      const invalidExt: FileAnswerValue = { name: 'doc.exe', size: 1000, type: 'application/octet-stream' };
      const result = validateFileQuestion(invalidExt, question);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe('Only PDF allowed');
    });
  });

  describe('getFileQuestionDefaultValue', () => {
    it('should return undefined', () => {
      const defaultValue = getFileQuestionDefaultValue();

      expect(defaultValue).toBeUndefined();
    });
  });

  describe('serializeFileQuestion', () => {
    it('should serialize question correctly', () => {
      const questionData = createTestFileQuestion({
        id: 'q1',
        label: 'Upload file',
        fileKind: 'document',
        allowedExtensions: ['.pdf'],
        maxSizeBytes: 1024,
        minWidth: 100,
        maxWidth: 800,
        required: true,
        visible: false,
      });
      const question = createFileQuestion(questionData);
      const serialized = serializeFileQuestion(question, questionData);

      expect(serialized.id).toBe('q1');
      expect(serialized.type).toBe('file');
      expect(serialized.label).toBe('Upload file');
      if (serialized.type === 'file') {
        expect(serialized.fileKind).toBe('document');
        expect(serialized.allowedExtensions).toEqual(['.pdf']);
        expect(serialized.maxSizeBytes).toBe(1024);
        expect(serialized.minWidth).toBe(100);
        expect(serialized.maxWidth).toBe(800);
      }
      expect(serialized.required).toBe(true);
      expect(serialized.visible).toBe(false);
    });
  });
});
