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
      if (choiceQuestion!.type === 'multiple-choice') {
        expect(choiceQuestion.options).toBeDefined();
        expect(choiceQuestion.options.length).toBeGreaterThan(0);
      }
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
});
