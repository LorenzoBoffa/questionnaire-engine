import type { Question, TextQuestion, NumberQuestion, MultipleChoiceQuestion, MultiSelectQuestion, FileQuestion, TabularQuestion } from '../../types/questions';
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

export function createMultiSelectQuestion(overrides?: Partial<MultiSelectQuestion>): MultiSelectQuestion {
  return {
    id: 'q1',
    type: 'multi-select',
    label: 'Test Multi Select Question',
    options: ['Option 1', 'Option 2', 'Option 3'],
    required: false,
    ...overrides,
  };
}

export function createFileQuestion(overrides?: Partial<FileQuestion>): FileQuestion {
  return {
    id: 'q1',
    type: 'file',
    label: 'Upload a file',
    required: false,
    ...overrides,
  };
}

export function createTabularQuestion(overrides?: Partial<TabularQuestion>): TabularQuestion {
  return {
    id: 'q1',
    type: 'tabular',
    label: 'Test Tabular Question',
    required: false,
    columns: [
      { id: 'col1', label: 'Text Column', type: 'text' },
      { id: 'col2', label: 'Number Column', type: 'number' },
    ],
    rows: [
      { id: 'row1', label: 'Row 1' },
      { id: 'row2', label: 'Row 2' },
    ],
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
