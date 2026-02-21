import { describe, it, expect } from 'vitest';
import { createJSONLoader, InvalidJSONError, InvalidStructureError, MissingFieldError, InvalidTypeError } from '../../utils/json-loader';
import {
  simpleQuestionnaire,
  questionnaireWithValidation,
  questionnaireWithFormulas,
  questionnaireWithActions,
  complexQuestionnaire,
  invalidQuestionnaireMissingId,
  invalidQuestionnaireMissingTitle,
  invalidQuestionnaireInvalidQuestionType,
  invalidQuestionnaireMissingQuestionId,
} from '../fixtures/questionnaires';

describe('JSON Loader', () => {
  describe('loadFromString', () => {
    it('should load questionnaire from JSON string', () => {
      const loader = createJSONLoader();
      const json = JSON.stringify(simpleQuestionnaire);
      const questionnaire = loader.loadFromString(json);

      expect(questionnaire.id).toBe('test-1');
      expect(questionnaire.title).toBe('Simple Test Questionnaire');
      expect(questionnaire.sections).toHaveLength(1);
    });

    it('should handle invalid JSON format', () => {
      const loader = createJSONLoader();
      const invalidJson = '{ invalid json }';

      expect(() => loader.loadFromString(invalidJson)).toThrow(InvalidJSONError);
    });

    it('should parse sections and questions correctly', () => {
      const loader = createJSONLoader();
      const json = JSON.stringify(simpleQuestionnaire);
      const questionnaire = loader.loadFromString(json);

      expect(questionnaire.sections[0].questions).toHaveLength(3);
      expect(questionnaire.sections[0].questions[0].id).toBe('q1');
      expect(questionnaire.sections[0].questions[0].type).toBe('text');
    });

    it('should parse validation rules', () => {
      const loader = createJSONLoader();
      const json = JSON.stringify(questionnaireWithValidation);
      const questionnaire = loader.loadFromString(json);

      expect(questionnaire.sections[0].questions[0].validation).toBeDefined();
      expect(questionnaire.sections[0].questions[0].validation!.length).toBeGreaterThan(0);
    });

    it('should parse formulas', () => {
      const loader = createJSONLoader();
      const json = JSON.stringify(questionnaireWithFormulas);
      const questionnaire = loader.loadFromString(json);

      expect(questionnaire.formulas).toBeDefined();
      expect(questionnaire.formulas).toHaveLength(1);
      expect(questionnaire.formulas![0].id).toBe('total');
      expect(questionnaire.formulas![0].expression).toBe('sum(q1, q2, q3)');
    });

    it('should parse actions', () => {
      const loader = createJSONLoader();
      const json = JSON.stringify(questionnaireWithActions);
      const questionnaire = loader.loadFromString(json);

      expect(questionnaire.actions).toBeDefined();
      expect(questionnaire.actions).toHaveLength(1);
      expect(questionnaire.actions![0].type).toBe('show');
      expect(questionnaire.actions![0].condition).toBe('q1 >= 18');
    });
  });

  describe('loadFromObject', () => {
    it('should load questionnaire from object', () => {
      const loader = createJSONLoader();
      const questionnaire = loader.loadFromObject(simpleQuestionnaire);

      expect(questionnaire.id).toBe('test-1');
      expect(questionnaire.title).toBe('Simple Test Questionnaire');
    });

    it('should handle complex questionnaire', () => {
      const loader = createJSONLoader();
      const questionnaire = loader.loadFromObject(complexQuestionnaire);

      expect(questionnaire.sections).toHaveLength(2);
      expect(questionnaire.formulas).toBeDefined();
      expect(questionnaire.actions).toBeDefined();
    });
  });

  describe('validateStructure', () => {
    it('should validate questionnaire structure', () => {
      const loader = createJSONLoader();
      const result = loader.validateStructure(simpleQuestionnaire);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const loader = createJSONLoader();
      const result = loader.validateStructure(invalidQuestionnaireMissingId);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing title', () => {
      const loader = createJSONLoader();
      const result = loader.validateStructure(invalidQuestionnaireMissingTitle);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('title'))).toBe(true);
    });

    it('should detect invalid question types', () => {
      const loader = createJSONLoader();
      const result = loader.validateStructure(invalidQuestionnaireInvalidQuestionType);

      expect(result.isValid).toBe(false);
    });

    it('should detect missing question ID', () => {
      const loader = createJSONLoader();
      const result = loader.validateStructure(invalidQuestionnaireMissingQuestionId);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('id'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw InvalidJSONError for invalid JSON', () => {
      const loader = createJSONLoader();
      const invalidJson = '{ invalid }';

      expect(() => loader.loadFromString(invalidJson)).toThrow(InvalidJSONError);
    });

    it('should throw InvalidStructureError for invalid structure', () => {
      const loader = createJSONLoader();
      const invalid = { notAQuestionnaire: true };

      expect(() => loader.loadFromObject(invalid)).toThrow();
    });

    it('should throw MissingFieldError for missing required fields', () => {
      const loader = createJSONLoader();
      const invalid = { title: 'Test' };

      expect(() => loader.loadFromObject(invalid)).toThrow();
    });

    it('should throw InvalidTypeError for invalid types', () => {
      const loader = createJSONLoader();
      const invalid = {
        id: 'test',
        title: 'Test',
        sections: 'not an array',
      };

      expect(() => loader.loadFromObject(invalid)).toThrow();
    });

    it('should return appropriate error messages', () => {
      const loader = createJSONLoader();
      const invalid = invalidQuestionnaireMissingId;

      try {
        loader.loadFromObject(invalid);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeDefined();
      }
    });
  });

  describe('parseQuestionnaire', () => {
    it('should parse complete questionnaire', () => {
      const loader = createJSONLoader();
      const questionnaire = loader.parseQuestionnaire(complexQuestionnaire);

      expect(questionnaire.id).toBe('test-5');
      expect(questionnaire.sections).toHaveLength(2);
      expect(questionnaire.formulas).toBeDefined();
      expect(questionnaire.actions).toBeDefined();
    });

    it('should handle questionnaire with all features', () => {
      const loader = createJSONLoader();
      const questionnaire = loader.parseQuestionnaire(complexQuestionnaire);

      expect(questionnaire.sections[0].questions[0].validation).toBeDefined();
      expect(questionnaire.formulas).toHaveLength(1);
      expect(questionnaire.actions).toHaveLength(1);
    });
  });

  describe('Question Parsing', () => {
    it('should parse text questions', () => {
      const loader = createJSONLoader();
      const questionnaire = loader.loadFromObject(simpleQuestionnaire);

      const textQuestion = questionnaire.sections[0].questions.find(q => q.type === 'text');
      expect(textQuestion).toBeDefined();
      expect(textQuestion!.type).toBe('text');
    });

    it('should parse number questions', () => {
      const loader = createJSONLoader();
      const questionnaire = loader.loadFromObject(simpleQuestionnaire);

      const numberQuestion = questionnaire.sections[0].questions.find(q => q.type === 'number');
      expect(numberQuestion).toBeDefined();
      expect(numberQuestion!.type).toBe('number');
    });

    it('should parse multiple-choice questions', () => {
      const loader = createJSONLoader();
      const questionnaire = loader.loadFromObject(simpleQuestionnaire);

      const choiceQuestion = questionnaire.sections[0].questions.find(q => q.type === 'multiple-choice');
      expect(choiceQuestion).toBeDefined();
      expect(choiceQuestion!.type).toBe('multiple-choice');
      if (choiceQuestion && choiceQuestion.type === 'multiple-choice') {
        expect(choiceQuestion.options).toBeDefined();
        expect(choiceQuestion.options.length).toBeGreaterThan(0);
      }
    });

    it('should parse multi-select questions', () => {
      const loader = createJSONLoader();
      const questionnaireWithMultiSelect = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            questions: [
              { id: 'q1', type: 'text', label: 'Name' },
              {
                id: 'q2',
                type: 'multi-select',
                label: 'Select options',
                options: ['A', 'B', 'C'],
                minSelections: 1,
                maxSelections: 2,
              },
            ],
          },
        ],
      };
      const questionnaire = loader.loadFromObject(questionnaireWithMultiSelect);

      const multiSelectQuestion = questionnaire.sections[0].questions.find(q => q.type === 'multi-select');
      expect(multiSelectQuestion).toBeDefined();
      expect(multiSelectQuestion!.type).toBe('multi-select');
      if (multiSelectQuestion && multiSelectQuestion.type === 'multi-select') {
        expect(multiSelectQuestion.options).toEqual(['A', 'B', 'C']);
        expect(multiSelectQuestion.minSelections).toBe(1);
        expect(multiSelectQuestion.maxSelections).toBe(2);
      }
    });

    it('should parse file questions', () => {
      const loader = createJSONLoader();
      const questionnaireWithFile = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            questions: [
              { id: 'q1', type: 'text', label: 'Name' },
              {
                id: 'q2',
                type: 'file',
                label: 'Upload document',
                allowedExtensions: ['.pdf', '.jpg'],
                maxSizeBytes: 1024000,
                minWidth: 100,
                maxWidth: 2000,
              },
            ],
          },
        ],
      };
      const questionnaire = loader.loadFromObject(questionnaireWithFile);

      const fileQuestion = questionnaire.sections[0].questions.find(q => q.type === 'file');
      expect(fileQuestion).toBeDefined();
      expect(fileQuestion!.type).toBe('file');
      if (fileQuestion && fileQuestion.type === 'file') {
        expect(fileQuestion.allowedExtensions).toEqual(['.pdf', '.jpg']);
        expect(fileQuestion.maxSizeBytes).toBe(1024000);
        expect(fileQuestion.minWidth).toBe(100);
        expect(fileQuestion.maxWidth).toBe(2000);
      }
    });

    it('should parse file questions with fileKind image', () => {
      const loader = createJSONLoader();
      const questionnaireWithImage = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            questions: [
              {
                id: 'q1',
                type: 'file',
                label: 'Upload image',
                fileKind: 'image',
                allowedExtensions: ['.jpg', '.png', '.webp'],
                maxSizeBytes: 5000000,
                minWidth: 100,
                maxWidth: 4000,
                minHeight: 100,
                maxHeight: 4000,
              },
            ],
          },
        ],
      };
      const questionnaire = loader.loadFromObject(questionnaireWithImage);
      const fileQuestion = questionnaire.sections[0].questions[0];
      expect(fileQuestion.type).toBe('file');
      if (fileQuestion.type === 'file') {
        expect(fileQuestion.fileKind).toBe('image');
        expect(fileQuestion.allowedExtensions).toEqual(['.jpg', '.png', '.webp']);
      }
    });

    it('should parse file questions with fileKind document', () => {
      const loader = createJSONLoader();
      const questionnaireWithDocument = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            questions: [
              {
                id: 'q1',
                type: 'file',
                label: 'Upload document',
                fileKind: 'document',
                allowedExtensions: ['.pdf', '.xls', '.xlsx', '.csv', '.md', '.txt'],
                maxSizeBytes: 10485760,
              },
            ],
          },
        ],
      };
      const questionnaire = loader.loadFromObject(questionnaireWithDocument);
      const fileQuestion = questionnaire.sections[0].questions[0];
      expect(fileQuestion.type).toBe('file');
      if (fileQuestion.type === 'file') {
        expect(fileQuestion.fileKind).toBe('document');
        expect(fileQuestion.allowedExtensions).toEqual(['.pdf', '.xls', '.xlsx', '.csv', '.md', '.txt']);
      }
    });
  });

  describe('Multi-select and file structure validation', () => {
    it('should reject multi-select with empty options', () => {
      const loader = createJSONLoader();
      const invalid = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            questions: [
              { id: 'q1', type: 'multi-select', label: 'Select', options: [] },
            ],
          },
        ],
      };
      const result = loader.validateStructure(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('options') || e.includes('non-empty'))).toBe(true);
    });

    it('should reject multi-select with missing options', () => {
      const loader = createJSONLoader();
      const invalid = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            questions: [
              { id: 'q1', type: 'multi-select', label: 'Select' },
            ],
          },
        ],
      };
      const result = loader.validateStructure(invalid);

      expect(result.isValid).toBe(false);
    });

    it('should reject file with invalid maxSizeBytes type', () => {
      const loader = createJSONLoader();
      const invalid = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            questions: [
              { id: 'q1', type: 'file', label: 'Upload', maxSizeBytes: 'not-a-number' },
            ],
          },
        ],
      };
      const result = loader.validateStructure(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('maxSizeBytes'))).toBe(true);
    });

    it('should reject file with invalid fileKind', () => {
      const loader = createJSONLoader();
      const invalid = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            questions: [
              { id: 'q1', type: 'file', label: 'Upload', fileKind: 'video' },
            ],
          },
        ],
      };
      const result = loader.validateStructure(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('fileKind'))).toBe(true);
    });
  });

  describe('Validation Rule Parsing', () => {
    it('should parse validation rules', () => {
      const loader = createJSONLoader();
      const questionnaire = loader.loadFromObject(questionnaireWithValidation);

      const question = questionnaire.sections[0].questions[0];
      expect(question.validation).toBeDefined();
      expect(question.validation!.length).toBeGreaterThan(0);
    });

    it('should parse min/max validation rules', () => {
      const loader = createJSONLoader();
      const questionnaire = loader.loadFromObject(questionnaireWithValidation);

      const numberQuestion = questionnaire.sections[0].questions.find(q => q.type === 'number');
      expect(numberQuestion?.validation).toBeDefined();
    });

    it('should parse validation array with minSelections and maxSelections', () => {
      const loader = createJSONLoader();
      const questionnaire = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            questions: [
              {
                id: 'q1',
                type: 'multi-select',
                label: 'Select',
                options: ['A', 'B', 'C'],
                validation: [
                  { type: 'minSelections', value: 1 },
                  { type: 'maxSelections', value: 3, message: 'At most 3' },
                ],
              },
            ],
          },
        ],
      };
      const loaded = loader.loadFromObject(questionnaire);
      const q = loaded.sections[0].questions[0];
      expect(q.validation).toBeDefined();
      expect(q.validation!.some(r => r.type === 'minSelections' && r.value === 1)).toBe(true);
      expect(q.validation!.some(r => r.type === 'maxSelections' && r.value === 3 && r.message === 'At most 3')).toBe(true);
    });

    it('should parse validation array with allowedExtensions, maxSizeBytes, and dimension rules', () => {
      const loader = createJSONLoader();
      const questionnaire = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            questions: [
              {
                id: 'q1',
                type: 'file',
                label: 'Upload',
                validation: [
                  { type: 'allowedExtensions', value: ['.pdf', '.jpg'] },
                  { type: 'maxSizeBytes', value: 1024 },
                  { type: 'minWidth', value: 100 },
                  { type: 'maxWidth', value: 800 },
                  { type: 'minHeight', value: 100 },
                  { type: 'maxHeight', value: 600 },
                ],
              },
            ],
          },
        ],
      };
      const loaded = loader.loadFromObject(questionnaire);
      const q = loaded.sections[0].questions[0];
      expect(q.validation).toBeDefined();
      expect(q.validation!.find(r => r.type === 'allowedExtensions')).toEqual({
        type: 'allowedExtensions',
        value: ['.pdf', '.jpg'],
      });
      expect(q.validation!.find(r => r.type === 'maxSizeBytes')?.value).toBe(1024);
      expect(q.validation!.find(r => r.type === 'minWidth')?.value).toBe(100);
      expect(q.validation!.find(r => r.type === 'maxWidth')?.value).toBe(800);
      expect(q.validation!.find(r => r.type === 'minHeight')?.value).toBe(100);
      expect(q.validation!.find(r => r.type === 'maxHeight')?.value).toBe(600);
    });
  });

  describe('Formula Parsing', () => {
    it('should parse formulas correctly', () => {
      const loader = createJSONLoader();
      const questionnaire = loader.loadFromObject(questionnaireWithFormulas);

      expect(questionnaire.formulas).toBeDefined();
      expect(questionnaire.formulas!.length).toBeGreaterThan(0);
      expect(questionnaire.formulas![0].id).toBe('total');
      expect(questionnaire.formulas![0].expression).toBe('sum(q1, q2, q3)');
    });
  });

  describe('Action Parsing', () => {
    it('should parse show actions', () => {
      const loader = createJSONLoader();
      const questionnaire = loader.loadFromObject(questionnaireWithActions);

      expect(questionnaire.actions).toBeDefined();
      expect(questionnaire.actions![0].type).toBe('show');
      expect(questionnaire.actions![0].condition).toBe('q1 >= 18');
      expect(questionnaire.actions![0].target).toBe('q2');
    });
  });

  describe('Section content and subtitles', () => {
    it('should not add content when section has only questions (retrocompat)', () => {
      const loader = createJSONLoader();
      const questionnaire = loader.loadFromObject(simpleQuestionnaire);

      expect(questionnaire.sections).toHaveLength(1);
      expect(questionnaire.sections[0].content).toBeUndefined();
      expect(questionnaire.sections[0].questions).toHaveLength(3);
      expect(questionnaire.sections[0].questions[0].id).toBe('q1');
      expect(questionnaire.sections[0].questions[0].type).toBe('text');
    });

    it('should parse section with content (questions and subtitle items)', () => {
      const loader = createJSONLoader();
      const withContent = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            content: [
              { id: 'q1', type: 'text', label: 'First question' },
              { type: 'subtitle', text: 'Part B' },
              { id: 'q2', type: 'number', label: 'Second question' },
            ],
          },
        ],
      };
      const questionnaire = loader.loadFromObject(withContent);

      expect(questionnaire.sections[0].questions).toHaveLength(2);
      expect(questionnaire.sections[0].questions[0].id).toBe('q1');
      expect(questionnaire.sections[0].questions[1].id).toBe('q2');
      expect(questionnaire.sections[0].content).toHaveLength(3);
      expect(questionnaire.sections[0].content![0]).toMatchObject({ id: 'q1', type: 'text' });
      expect(questionnaire.sections[0].content![1]).toEqual({ type: 'subtitle', text: 'Part B' });
      expect(questionnaire.sections[0].content![2]).toMatchObject({ id: 'q2', type: 'number' });
    });

    it('should reject content with invalid subtitle (missing text)', () => {
      const loader = createJSONLoader();
      const invalid = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            content: [
              { id: 'q1', type: 'text', label: 'Q1' },
              { type: 'subtitle' },
            ],
          },
        ],
      };
      const result = loader.validateStructure(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('text') || e.includes('Subtitle'))).toBe(true);
    });

    it('should reject content with zero questions', () => {
      const loader = createJSONLoader();
      const invalid = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            content: [
              { type: 'subtitle', text: 'Only subtitle' },
            ],
          },
        ],
      };
      const result = loader.validateStructure(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('at least one question'))).toBe(true);
    });

    it('should reject duplicate question ids when using content', () => {
      const loader = createJSONLoader();
      const invalid = {
        id: 'test',
        title: 'Test',
        sections: [
          {
            id: 's1',
            title: 'Section',
            content: [
              { id: 'q1', type: 'text', label: 'Q1' },
              { type: 'subtitle', text: 'Part B' },
              { id: 'q1', type: 'number', label: 'Q2' },
            ],
          },
        ],
      };
      const result = loader.validateStructure(invalid);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate question ID'))).toBe(true);
    });

    it('should load full questionnaire with mixed sections (questions-only and content)', () => {
      const loader = createJSONLoader();
      const mixed = {
        id: 'mixed',
        title: 'Mixed',
        sections: [
          {
            id: 'questions-only',
            title: 'Questions Only',
            questions: [
              { id: 'a1', type: 'text', label: 'A1' },
              { id: 'a2', type: 'number', label: 'A2' },
            ],
          },
          {
            id: 'with-content',
            title: 'With Content',
            content: [
              { type: 'subtitle', text: 'Intro' },
              { id: 'b1', type: 'text', label: 'B1' },
              { id: 'b2', type: 'number', label: 'B2' },
            ],
          },
        ],
      };
      const questionnaire = loader.loadFromObject(mixed);

      expect(questionnaire.sections).toHaveLength(2);
      expect(questionnaire.sections[0].content).toBeUndefined();
      expect(questionnaire.sections[0].questions).toHaveLength(2);
      expect(questionnaire.sections[0].questions.map(q => q.id)).toEqual(['a1', 'a2']);
      expect(questionnaire.sections[1].content).toHaveLength(3);
      expect(questionnaire.sections[1].questions).toHaveLength(2);
      expect(questionnaire.sections[1].questions.map(q => q.id)).toEqual(['b1', 'b2']);
    });
  });
});
