import { describe, it, expect, beforeEach } from 'vitest';
import { createQuestionnaireEngine } from '../../engine/QuestionnaireEngine';

describe('Questionnaire Actions', () => {
  let engine: ReturnType<typeof createQuestionnaireEngine>;

  beforeEach(() => {
    engine = createQuestionnaireEngine();
  });

  describe('Simple Show Actions', () => {
    const questionnaireWithSimpleActions = {
      id: 'actions-test',
      title: 'Actions Test',
      sections: [
        {
          id: 'actions-section',
          title: 'Actions Test Section',
          questions: [
            {
              id: 'age-question',
              type: 'number' as const,
              label: 'What is your age?',
              required: false,
            },
            {
              id: 'adult-question',
              type: 'text' as const,
              label: 'Adult-specific question',
              required: false,
              visible: false,
            },
          ],
        },
      ],
      actions: [
        {
          type: 'show' as const,
          condition: 'age-question >= 18',
          target: 'adult-question',
        },
      ],
    };

    it('should hide question initially when condition is false', () => {
      engine.loadFromJSON(questionnaireWithSimpleActions);

      const questions = engine.getCurrentQuestions();
      expect(questions.some((q) => q.id === 'adult-question')).toBe(false);
      expect(engine.isQuestionVisible('adult-question')).toBe(false);
    });

    it('should show question when condition becomes true', () => {
      engine.loadFromJSON(questionnaireWithSimpleActions);

      engine.setAnswer('age-question', 25);

      const questions = engine.getCurrentQuestions();
      expect(questions.some((q) => q.id === 'adult-question')).toBe(true);
      expect(engine.isQuestionVisible('adult-question')).toBe(true);
    });

    it('should hide question when condition becomes false', () => {
      engine.loadFromJSON(questionnaireWithSimpleActions);

      engine.setAnswer('age-question', 25);
      expect(engine.isQuestionVisible('adult-question')).toBe(true);

      engine.setAnswer('age-question', 15);
      expect(engine.isQuestionVisible('adult-question')).toBe(false);

      const questions = engine.getCurrentQuestions();
      expect(questions.some((q) => q.id === 'adult-question')).toBe(false);
    });

    it('should show question when age is exactly 18', () => {
      engine.loadFromJSON(questionnaireWithSimpleActions);

      engine.setAnswer('age-question', 18);

      expect(engine.isQuestionVisible('adult-question')).toBe(true);
    });

    it('should hide question when age is less than 18', () => {
      engine.loadFromJSON(questionnaireWithSimpleActions);

      engine.setAnswer('age-question', 17);

      expect(engine.isQuestionVisible('adult-question')).toBe(false);
    });
  });

  describe('Multiple Show Actions', () => {
    const questionnaireWithMultipleActions = {
      id: 'multiple-actions-test',
      title: 'Multiple Actions Test',
      sections: [
        {
          id: 'actions-section',
          title: 'Actions Test Section',
          questions: [
            {
              id: 'age-question',
              type: 'number' as const,
              label: 'What is your age?',
              required: false,
            },
            {
              id: 'adult-question',
              type: 'text' as const,
              label: 'Adult-specific question',
              required: false,
              visible: false,
            },
            {
              id: 'senior-question',
              type: 'text' as const,
              label: 'Senior-specific question',
              required: false,
              visible: false,
            },
          ],
        },
      ],
      actions: [
        {
          type: 'show' as const,
          condition: 'age-question >= 18',
          target: 'adult-question',
        },
        {
          type: 'show' as const,
          condition: 'age-question >= 65',
          target: 'senior-question',
        },
      ],
    };

    it('should show adult question when age is 25', () => {
      engine.loadFromJSON(questionnaireWithMultipleActions);

      engine.setAnswer('age-question', 25);

      expect(engine.isQuestionVisible('adult-question')).toBe(true);
      expect(engine.isQuestionVisible('senior-question')).toBe(false);
    });

    it('should show both questions when age is 70', () => {
      engine.loadFromJSON(questionnaireWithMultipleActions);

      engine.setAnswer('age-question', 70);

      expect(engine.isQuestionVisible('adult-question')).toBe(true);
      expect(engine.isQuestionVisible('senior-question')).toBe(true);

      const questions = engine.getCurrentQuestions();
      expect(questions.some((q) => q.id === 'adult-question')).toBe(true);
      expect(questions.some((q) => q.id === 'senior-question')).toBe(true);
    });

    it('should hide both questions when age is 15', () => {
      engine.loadFromJSON(questionnaireWithMultipleActions);

      engine.setAnswer('age-question', 15);

      expect(engine.isQuestionVisible('adult-question')).toBe(false);
      expect(engine.isQuestionVisible('senior-question')).toBe(false);
    });
  });

  describe('Show and Hide Actions Together', () => {
    const questionnaireWithShowHide = {
      id: 'show-hide-test',
      title: 'Show/Hide Test',
      sections: [
        {
          id: 'actions-section',
          title: 'Actions Test Section',
          questions: [
            {
              id: 'has-license',
              type: 'multiple-choice' as const,
              label: 'Do you have a driver\'s license?',
              required: false,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
            },
            {
              id: 'license-number',
              type: 'text' as const,
              label: 'License Number',
              required: false,
              visible: false,
            },
          ],
        },
      ],
      actions: [
        {
          type: 'show' as const,
          condition: 'has-license == \'yes\'',
          target: 'license-number',
        },
        {
          type: 'hide' as const,
          condition: 'has-license == \'no\'',
          target: 'license-number',
        },
      ],
    };

    it('should show license number when has-license is yes', () => {
      engine.loadFromJSON(questionnaireWithShowHide);

      engine.setAnswer('has-license', 'yes');

      expect(engine.isQuestionVisible('license-number')).toBe(true);
      const questions = engine.getCurrentQuestions();
      expect(questions.some((q) => q.id === 'license-number')).toBe(true);
    });

    it('should hide license number when has-license is no', () => {
      engine.loadFromJSON(questionnaireWithShowHide);

      engine.setAnswer('has-license', 'yes');
      expect(engine.isQuestionVisible('license-number')).toBe(true);

      engine.setAnswer('has-license', 'no');
      expect(engine.isQuestionVisible('license-number')).toBe(false);

      const questions = engine.getCurrentQuestions();
      expect(questions.some((q) => q.id === 'license-number')).toBe(false);
    });

    it('should prioritize hide action over show action', () => {
      engine.loadFromJSON(questionnaireWithShowHide);

      engine.setAnswer('has-license', 'no');

      expect(engine.isQuestionVisible('license-number')).toBe(false);
    });
  });

  describe('Actions with String Comparisons', () => {
    const questionnaireWithStringActions = {
      id: 'string-actions-test',
      title: 'String Actions Test',
      sections: [
        {
          id: 'actions-section',
          title: 'Actions Test Section',
          questions: [
            {
              id: 'country',
              type: 'multiple-choice' as const,
              label: 'Select your country',
              required: false,
              options: [
                { value: 'usa', label: 'USA' },
                { value: 'canada', label: 'Canada' },
                { value: 'uk', label: 'UK' },
              ],
            },
            {
              id: 'state-question',
              type: 'text' as const,
              label: 'State (USA only)',
              required: false,
              visible: false,
            },
          ],
        },
      ],
      actions: [
        {
          type: 'show' as const,
          condition: 'country == \'usa\'',
          target: 'state-question',
        },
      ],
    };

    it('should show state question when country is usa', () => {
      engine.loadFromJSON(questionnaireWithStringActions);

      engine.setAnswer('country', 'usa');

      expect(engine.isQuestionVisible('state-question')).toBe(true);
    });

    it('should hide state question when country is not usa', () => {
      engine.loadFromJSON(questionnaireWithStringActions);

      engine.setAnswer('country', 'canada');

      expect(engine.isQuestionVisible('state-question')).toBe(false);
    });
  });

  describe('Actions Execution on Load', () => {
    const questionnaireWithPreFilledAnswers = {
      id: 'prefilled-test',
      title: 'Prefilled Test',
      sections: [
        {
          id: 'actions-section',
          title: 'Actions Test Section',
          questions: [
            {
              id: 'age-question',
              type: 'number' as const,
              label: 'What is your age?',
              required: false,
            },
            {
              id: 'adult-question',
              type: 'text' as const,
              label: 'Adult-specific question',
              required: false,
              visible: false,
            },
          ],
        },
      ],
      actions: [
        {
          type: 'show' as const,
          condition: 'age-question >= 18',
          target: 'adult-question',
        },
      ],
    };

    it('should execute actions after loading questionnaire', () => {
      engine.loadFromJSON(questionnaireWithPreFilledAnswers);

      engine.setAnswer('age-question', 25);

      const questions = engine.getCurrentQuestions();
      expect(questions.some((q) => q.id === 'adult-question')).toBe(true);
    });
  });

  describe('Complex Action Conditions', () => {
    const questionnaireWithComplexConditions = {
      id: 'complex-conditions-test',
      title: 'Complex Conditions Test',
      sections: [
        {
          id: 'actions-section',
          title: 'Actions Test Section',
          questions: [
            {
              id: 'age-question',
              type: 'number' as const,
              label: 'What is your age?',
              required: false,
            },
            {
              id: 'complex-question',
              type: 'text' as const,
              label: 'Complex condition question',
              required: false,
              visible: false,
            },
          ],
        },
      ],
      actions: [
        {
          type: 'show' as const,
          condition: 'age-question >= 18 && age-question <= 65',
          target: 'complex-question',
        },
      ],
    };

    it('should show question when age is in range', () => {
      engine.loadFromJSON(questionnaireWithComplexConditions);

      engine.setAnswer('age-question', 30);

      expect(engine.isQuestionVisible('complex-question')).toBe(true);
    });

    it('should hide question when age is below range', () => {
      engine.loadFromJSON(questionnaireWithComplexConditions);

      engine.setAnswer('age-question', 15);

      expect(engine.isQuestionVisible('complex-question')).toBe(false);
    });

    it('should hide question when age is above range', () => {
      engine.loadFromJSON(questionnaireWithComplexConditions);

      engine.setAnswer('age-question', 70);

      expect(engine.isQuestionVisible('complex-question')).toBe(false);
    });

    it('should show question when age is at lower bound', () => {
      engine.loadFromJSON(questionnaireWithComplexConditions);

      engine.setAnswer('age-question', 18);

      expect(engine.isQuestionVisible('complex-question')).toBe(true);
    });

    it('should show question when age is at upper bound', () => {
      engine.loadFromJSON(questionnaireWithComplexConditions);

      engine.setAnswer('age-question', 65);

      expect(engine.isQuestionVisible('complex-question')).toBe(true);
    });
  });

  describe('Actions with getVisibleQuestionsForSection', () => {
    const questionnaireWithSectionActions = {
      id: 'section-actions-test',
      title: 'Section Actions Test',
      sections: [
        {
          id: 'actions-test-section',
          title: 'Actions Test Section',
          questions: [
            {
              id: 'age-question',
              type: 'number' as const,
              label: 'What is your age?',
              required: false,
            },
            {
              id: 'adult-question',
              type: 'text' as const,
              label: 'Adult-specific question',
              required: false,
              visible: false,
            },
          ],
        },
      ],
      actions: [
        {
          type: 'show' as const,
          condition: 'age-question >= 18',
          target: 'adult-question',
        },
      ],
    };

    it('should filter visible questions in section', () => {
      engine.loadFromJSON(questionnaireWithSectionActions);

      let questions = engine.getVisibleQuestionsForSection('actions-test-section');
      expect(questions.some((q) => q.id === 'adult-question')).toBe(false);

      engine.setAnswer('age-question', 25);

      questions = engine.getVisibleQuestionsForSection('actions-test-section');
      expect(questions.some((q) => q.id === 'adult-question')).toBe(true);
    });
  });
});
