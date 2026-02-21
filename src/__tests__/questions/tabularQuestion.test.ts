import { describe, it, expect } from 'vitest';
import {
  createTabularQuestion,
  validateTabularQuestion,
  getTabularQuestionDefaultValue,
  serializeTabularQuestion,
} from '../../questions/tabularQuestion';
import { createTabularQuestion as createTabularFixture } from '../fixtures/helpers';
import type { TabularQuestion } from '../../types/questions';
import type { TabularAnswerValue } from '../../types/answers';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const basicQuestion = createTabularFixture({
  id: 'vitals',
  columns: [
    { id: 'weight', label: 'Weight (kg)', type: 'number', required: true, min: 0, max: 300 },
    { id: 'notes', label: 'Notes', type: 'text' },
  ],
  rows: [
    { id: 'day1', label: 'Day 1' },
    { id: 'day2', label: 'Day 2' },
  ],
});

const choiceQuestion = createTabularFixture({
  id: 'survey',
  columns: [
    { id: 'rating', label: 'Rating', type: 'multiple-choice', required: true, options: ['Good', 'Bad'] },
    { id: 'tags', label: 'Tags', type: 'multi-select', options: ['A', 'B', 'C'] },
  ],
  rows: [{ id: 'r1', label: 'Item 1' }],
});

// ---------------------------------------------------------------------------
// createTabularQuestion
// ---------------------------------------------------------------------------

describe('createTabularQuestion', () => {
  it('creates a question with correct metadata', () => {
    const q = createTabularQuestion(basicQuestion);
    expect(q.id).toBe('vitals');
    expect(q.type).toBe('tabular');
    expect(q.label).toBe('Test Tabular Question');
    expect(q.required).toBe(false);
    expect(q.visible).toBe(true);
  });

  it('respects required flag', () => {
    const q = createTabularQuestion(createTabularFixture({ required: true }));
    expect(q.required).toBe(true);
  });

  it('respects visible flag', () => {
    const q = createTabularQuestion(createTabularFixture({ visible: false }));
    expect(q.visible).toBe(false);
  });

  it('throws for wrong question type', () => {
    expect(() => createTabularQuestion({ id: 'q', type: 'text', label: 'x' } as any)).toThrow(
      'Invalid question type for TabularQuestion',
    );
  });

  it('validate method delegates to validateTabularQuestion', () => {
    const q = createTabularQuestion(basicQuestion);
    const result = q.validate({ day1: { weight: 70 }, day2: { weight: 80 } });
    expect(result.isValid).toBe(true);
  });

  it('getDefaultValue returns empty object', () => {
    const q = createTabularQuestion(basicQuestion);
    expect(q.getDefaultValue()).toEqual({});
  });

  it('serialize round-trips correctly', () => {
    const q = createTabularQuestion(basicQuestion);
    const s = q.serialize() as TabularQuestion;
    expect(s.type).toBe('tabular');
    expect(s.columns).toEqual(basicQuestion.columns);
    expect(s.rows).toEqual(basicQuestion.rows);
  });
});

// ---------------------------------------------------------------------------
// getTabularQuestionDefaultValue
// ---------------------------------------------------------------------------

describe('getTabularQuestionDefaultValue', () => {
  it('returns an empty object', () => {
    expect(getTabularQuestionDefaultValue()).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// serializeTabularQuestion
// ---------------------------------------------------------------------------

describe('serializeTabularQuestion', () => {
  it('serializes all fields', () => {
    const baseQ = createTabularQuestion(basicQuestion);
    const s = serializeTabularQuestion(baseQ, basicQuestion) as TabularQuestion;
    expect(s.id).toBe(basicQuestion.id);
    expect(s.type).toBe('tabular');
    expect(s.label).toBe(basicQuestion.label);
    expect(s.columns).toEqual(basicQuestion.columns);
    expect(s.rows).toEqual(basicQuestion.rows);
  });
});

// ---------------------------------------------------------------------------
// validateTabularQuestion — null / undefined handling
// ---------------------------------------------------------------------------

describe('validateTabularQuestion – null/undefined', () => {
  it('passes for null value on optional question', () => {
    const result = validateTabularQuestion(null, basicQuestion);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes for undefined value on optional question', () => {
    const result = validateTabularQuestion(undefined, basicQuestion);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails for null value on required question', () => {
    const q = createTabularFixture({ id: 'tbl', required: true });
    const result = validateTabularQuestion(null, q);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].questionId).toBe('tbl');
    expect(result.errors[0].rule).toBe('required');
  });

  it('fails for undefined value on required question', () => {
    const q = createTabularFixture({ id: 'tbl', required: true });
    const result = validateTabularQuestion(undefined, q);
    expect(result.isValid).toBe(false);
    expect(result.errors[0].rule).toBe('required');
  });

  it('uses custom required message when provided', () => {
    const q = createTabularFixture({
      id: 'tbl',
      required: true,
      validation: [{ type: 'required', message: 'Table is mandatory' }],
    });
    const result = validateTabularQuestion(null, q);
    expect(result.errors[0].message).toBe('Table is mandatory');
  });

  it('fails for non-object value (string)', () => {
    const result = validateTabularQuestion('invalid' as any, basicQuestion);
    expect(result.isValid).toBe(false);
  });

  it('fails for array value', () => {
    const result = validateTabularQuestion([] as any, basicQuestion);
    expect(result.isValid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateTabularQuestion — all cells valid
// ---------------------------------------------------------------------------

describe('validateTabularQuestion – valid values', () => {
  it('passes when all required cells are filled', () => {
    const value: TabularAnswerValue = {
      day1: { weight: 70, notes: 'ok' },
      day2: { weight: 80 },
    };
    const result = validateTabularQuestion(value, basicQuestion);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes when optional cells are missing', () => {
    const value: TabularAnswerValue = {
      day1: { weight: 70 },
      day2: { weight: 60 },
    };
    const result = validateTabularQuestion(value, basicQuestion);
    expect(result.isValid).toBe(true);
  });

  it('passes when entire row object is missing for a non-required column', () => {
    const q = createTabularFixture({
      id: 'tbl',
      columns: [{ id: 'note', label: 'Note', type: 'text' }],
      rows: [{ id: 'r1' }, { id: 'r2' }],
    });
    const result = validateTabularQuestion({}, q);
    expect(result.isValid).toBe(true);
  });

  it('passes when empty object is given for optional-only question', () => {
    const result = validateTabularQuestion({}, basicQuestion);
    // weight is required per column, but the column-level `required` is checked — basicQuestion has no required columns for this fixture variant
    const q = createTabularFixture({
      id: 'tbl',
      columns: [{ id: 'note', label: 'Note', type: 'text' }],
      rows: [{ id: 'r1' }],
    });
    expect(validateTabularQuestion({}, q).isValid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateTabularQuestion — required cells
// ---------------------------------------------------------------------------

describe('validateTabularQuestion – required cells', () => {
  it('fails when required column cell is missing', () => {
    const value: TabularAnswerValue = {
      day1: { notes: 'ok' }, // weight missing
      day2: { weight: 80 },
    };
    const result = validateTabularQuestion(value, basicQuestion);
    expect(result.isValid).toBe(false);
    const error = result.errors.find(e => e.questionId === 'vitals.day1.weight');
    expect(error).toBeDefined();
    expect(error!.rule).toBe('required');
  });

  it('uses synthetic questionId format questionId.rowId.colId', () => {
    const value: TabularAnswerValue = { day1: {}, day2: { weight: 50 } };
    const result = validateTabularQuestion(value, basicQuestion);
    const syntheticId = 'vitals.day1.weight';
    expect(result.errors.some(e => e.questionId === syntheticId)).toBe(true);
  });

  it('collects errors from multiple rows', () => {
    const result = validateTabularQuestion({}, basicQuestion);
    const weightErrors = result.errors.filter(e => e.questionId.endsWith('.weight'));
    expect(weightErrors).toHaveLength(2); // day1 and day2
  });
});

// ---------------------------------------------------------------------------
// validateTabularQuestion — number column constraints
// ---------------------------------------------------------------------------

describe('validateTabularQuestion – number column', () => {
  it('fails when value is below min', () => {
    const value: TabularAnswerValue = { day1: { weight: -5 }, day2: { weight: 70 } };
    const result = validateTabularQuestion(value, basicQuestion);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.questionId === 'vitals.day1.weight' && e.rule === 'min')).toBe(true);
  });

  it('fails when value is above max', () => {
    const value: TabularAnswerValue = { day1: { weight: 500 }, day2: { weight: 70 } };
    const result = validateTabularQuestion(value, basicQuestion);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.questionId === 'vitals.day1.weight' && e.rule === 'max')).toBe(true);
  });

  it('passes at min boundary', () => {
    const value: TabularAnswerValue = { day1: { weight: 0 }, day2: { weight: 70 } };
    const result = validateTabularQuestion(value, basicQuestion);
    expect(result.errors.some(e => e.questionId === 'vitals.day1.weight')).toBe(false);
  });

  it('passes at max boundary', () => {
    const value: TabularAnswerValue = { day1: { weight: 300 }, day2: { weight: 70 } };
    const result = validateTabularQuestion(value, basicQuestion);
    expect(result.errors.some(e => e.questionId === 'vitals.day1.weight')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateTabularQuestion — text column constraints
// ---------------------------------------------------------------------------

describe('validateTabularQuestion – text column', () => {
  const q = createTabularFixture({
    id: 'tbl',
    columns: [
      {
        id: 'comment',
        label: 'Comment',
        type: 'text',
        required: true,
        validation: [
          { type: 'minLength', value: 3 },
          { type: 'maxLength', value: 10 },
        ],
      },
    ],
    rows: [{ id: 'r1' }],
  });

  it('fails when required text cell is empty', () => {
    const result = validateTabularQuestion({ r1: { comment: '' } }, q);
    expect(result.isValid).toBe(false);
    expect(result.errors[0].questionId).toBe('tbl.r1.comment');
  });

  it('fails when text is shorter than minLength', () => {
    const result = validateTabularQuestion({ r1: { comment: 'Hi' } }, q);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'minLength')).toBe(true);
  });

  it('fails when text is longer than maxLength', () => {
    const result = validateTabularQuestion({ r1: { comment: 'This is too long' } }, q);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'maxLength')).toBe(true);
  });

  it('passes with valid text', () => {
    const result = validateTabularQuestion({ r1: { comment: 'Valid' } }, q);
    expect(result.isValid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateTabularQuestion — multiple-choice column
// ---------------------------------------------------------------------------

describe('validateTabularQuestion – multiple-choice column', () => {
  it('fails when required cell is missing', () => {
    const result = validateTabularQuestion({ r1: {} }, choiceQuestion);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.questionId === 'survey.r1.rating' && e.rule === 'required')).toBe(true);
  });

  it('fails when invalid option is selected', () => {
    const result = validateTabularQuestion({ r1: { rating: 'Unknown' } }, choiceQuestion);
    expect(result.isValid).toBe(false);
  });

  it('passes with valid option', () => {
    const result = validateTabularQuestion({ r1: { rating: 'Good' } }, choiceQuestion);
    expect(result.isValid).toBe(true);
  });

  it('passes when optional choice cell is missing', () => {
    const q = createTabularFixture({
      id: 'tbl',
      columns: [{ id: 'cat', label: 'Cat', type: 'multiple-choice', options: ['A', 'B'] }],
      rows: [{ id: 'r1' }],
    });
    const result = validateTabularQuestion({ r1: {} }, q);
    expect(result.isValid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateTabularQuestion — multi-select column
// ---------------------------------------------------------------------------

describe('validateTabularQuestion – multi-select column', () => {
  const q = createTabularFixture({
    id: 'tbl',
    columns: [
      {
        id: 'tags',
        label: 'Tags',
        type: 'multi-select',
        options: ['A', 'B', 'C'],
        minSelections: 1,
        maxSelections: 2,
        required: true,
      },
    ],
    rows: [{ id: 'r1' }],
  });

  it('fails when required multi-select cell is empty', () => {
    const result = validateTabularQuestion({ r1: { tags: [] } }, q);
    expect(result.isValid).toBe(false);
    expect(result.errors[0].rule).toBe('required');
  });

  it('fails when fewer than minSelections', () => {
    const result = validateTabularQuestion({ r1: { tags: [] } }, q);
    expect(result.isValid).toBe(false);
  });

  it('fails when more than maxSelections', () => {
    const result = validateTabularQuestion({ r1: { tags: ['A', 'B', 'C'] } }, q);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'maxSelections')).toBe(true);
  });

  it('passes with valid selection count', () => {
    const result = validateTabularQuestion({ r1: { tags: ['A', 'B'] } }, q);
    expect(result.isValid).toBe(true);
  });
});
