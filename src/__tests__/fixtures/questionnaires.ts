import type { Questionnaire, Question } from '../../types';

export const simpleQuestionnaire: Questionnaire = {
  id: 'test-1',
  title: 'Simple Test Questionnaire',
  sections: [
    {
      id: 'section-1',
      title: 'Basic Info',
      questions: [
        {
          id: 'q1',
          type: 'text',
          label: 'What is your name?',
          required: true,
        },
        {
          id: 'q2',
          type: 'number',
          label: 'What is your age?',
        },
        {
          id: 'q3',
          type: 'multiple-choice',
          label: 'Select an option',
          options: ['Option A', 'Option B', 'Option C'],
          required: true,
        },
      ],
    },
  ],
};

export const questionnaireWithValidation: Questionnaire = {
  id: 'test-2',
  title: 'Questionnaire with Validation',
  sections: [
    {
      id: 'section-1',
      title: 'Validated Fields',
      questions: [
        {
          id: 'q1',
          type: 'text',
          label: 'Name (min 2 chars)',
          required: true,
          validation: [
            { type: 'minLength', value: 2 },
            { type: 'maxLength', value: 50 },
          ],
        },
        {
          id: 'q2',
          type: 'number',
          label: 'Age (18-120)',
          required: true,
          validation: [
            { type: 'min', value: 18 },
            { type: 'max', value: 120 },
          ],
        },
      ],
    },
  ],
};

export const questionnaireWithFormulas: Questionnaire = {
  id: 'test-3',
  title: 'Questionnaire with Formulas',
  sections: [
    {
      id: 'section-1',
      title: 'Numbers',
      questions: [
        {
          id: 'q1',
          type: 'number',
          label: 'Number 1',
        },
        {
          id: 'q2',
          type: 'number',
          label: 'Number 2',
        },
        {
          id: 'q3',
          type: 'number',
          label: 'Number 3',
        },
      ],
    },
  ],
  formulas: [
    {
      id: 'total',
      expression: 'sum(q1, q2, q3)',
    },
  ],
};

export const questionnaireWithActions: Questionnaire = {
  id: 'test-4',
  title: 'Questionnaire with Actions',
  sections: [
    {
      id: 'section-1',
      title: 'Conditional Questions',
      questions: [
        {
          id: 'q1',
          type: 'number',
          label: 'What is your age?',
        },
        {
          id: 'q2',
          type: 'text',
          label: 'Additional info (only if age >= 18)',
          visible: false,
        },
      ],
    },
  ],
  actions: [
    {
      type: 'show',
      condition: 'q1 >= 18',
      target: 'q2',
    },
  ],
};

export const complexQuestionnaire: Questionnaire = {
  id: 'test-5',
  title: 'Complex Questionnaire',
  sections: [
    {
      id: 'section-1',
      title: 'Personal Info',
      questions: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
          validation: [{ type: 'minLength', value: 2 }],
        },
        {
          id: 'age',
          type: 'number',
          label: 'Age',
          required: true,
          validation: [
            { type: 'min', value: 18 },
            { type: 'max', value: 120 },
          ],
        },
        {
          id: 'country',
          type: 'multiple-choice',
          label: 'Country',
          options: ['USA', 'Canada', 'UK', 'Other'],
          required: true,
        },
      ],
    },
    {
      id: 'section-2',
      title: 'Numbers',
      questions: [
        {
          id: 'num1',
          type: 'number',
          label: 'Number 1',
        },
        {
          id: 'num2',
          type: 'number',
          label: 'Number 2',
        },
        {
          id: 'conditional',
          type: 'text',
          label: 'Conditional field',
          visible: false,
        },
      ],
    },
  ],
  formulas: [
    {
      id: 'sum',
      expression: 'sum(num1, num2)',
    },
  ],
  actions: [
    {
      type: 'show',
      condition: 'num1 > 10',
      target: 'conditional',
    },
  ],
};

export const invalidQuestionnaireMissingId: any = {
  title: 'Missing ID',
  sections: [
    {
      id: 'section-1',
      title: 'Section',
      questions: [],
    },
  ],
};

export const invalidQuestionnaireMissingTitle: any = {
  id: 'test-invalid',
  sections: [
    {
      id: 'section-1',
      title: 'Section',
      questions: [],
    },
  ],
};

export const invalidQuestionnaireInvalidQuestionType: any = {
  id: 'test-invalid',
  title: 'Invalid Type',
  sections: [
    {
      id: 'section-1',
      title: 'Section',
      questions: [
        {
          id: 'q1',
          type: 'invalid-type',
          label: 'Invalid question',
        },
      ],
    },
  ],
};

export const invalidQuestionnaireMissingQuestionId: any = {
  id: 'test-invalid',
  title: 'Missing Question ID',
  sections: [
    {
      id: 'section-1',
      title: 'Section',
      questions: [
        {
          type: 'text',
          label: 'Missing ID',
        },
      ],
    },
  ],
};
