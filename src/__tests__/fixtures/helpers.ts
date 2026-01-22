import type { Question, TextQuestion, NumberQuestion, MultipleChoiceQuestion } from '../../types/questions';
import type { Questionnaire, Section } from '../../types/questionnaire';
import type { AnswerValue } from '../../types/answers';

export function createTextQuestion(overrides?: Partial<TextQuestion>): TextQuestion {
  return {
    id: 'q1',
    type: 'text',
    label: 'Test Text Question',
    required: false,
    ...overrides,
  };
}

export function createNumberQuestion(overrides?: Partial<NumberQuestion>): NumberQuestion {
  return {
    id: 'q1',
    type: 'number',
    label: 'Test Number Question',
    required: false,
    ...overrides,
  };
}

export function createMultipleChoiceQuestion(overrides?: Partial<MultipleChoiceQuestion>): MultipleChoiceQuestion {
  return {
    id: 'q1',
    type: 'multiple-choice',
    label: 'Test Multiple Choice Question',
    options: ['Option 1', 'Option 2', 'Option 3'],
    required: false,
    ...overrides,
  };
}

export function createSection(overrides?: Partial<Section>): Section {
  return {
    id: 'section-1',
    title: 'Test Section',
    questions: [],
    ...overrides,
  };
}

export function createQuestionnaire(overrides?: Partial<Questionnaire>): Questionnaire {
  return {
    id: 'test-questionnaire',
    title: 'Test Questionnaire',
    sections: [
      {
        id: 'section-1',
        title: 'Test Section',
        questions: [],
      },
    ],
    ...overrides,
  };
}

export function createAnswers(answers: Record<string, AnswerValue>): Record<string, AnswerValue> {
  return answers;
}
