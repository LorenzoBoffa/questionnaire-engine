import { describe, it, expect, beforeEach } from 'vitest';
import { createQuestionnaireEngine } from '../../engine/QuestionnaireEngine';

const buildQuestionnaire = (actions: any[]) => ({
  id: 'section-show-hide-test',
  title: 'Section Show/Hide Test',
  sections: [
    {
      id: 'section-a',
      title: 'Section A (control)',
      questions: [
        {
          id: 'q-control',
          type: 'multi-select' as const,
          label: 'Select options',
          required: false,
          options: [
            { id: 'x', label: 'X' },
            { id: 'y', label: 'Y' },
            { id: 'z', label: 'Z' },
          ],
        },
      ],
    },
    {
      id: 'section-b',
      title: 'Section B (target)',
      questions: [
        {
          id: 'q-required',
          type: 'text' as const,
          label: 'Required question in section B',
          required: true,
        },
      ],
    },
  ],
  actions,
});

const buildFlagQuestionnaire = (actions: any[]) => ({
  id: 'section-show-hide-flag-test',
  title: 'Section Show/Hide Flag Test',
  sections: [
    {
      id: 'section-a',
      title: 'Section A (control)',
      questions: [
        {
          id: 'q-flag',
          type: 'text' as const,
          label: 'Flag question',
          required: false,
        },
      ],
    },
    {
      id: 'section-b',
      title: 'Section B (target)',
      questions: [
        {
          id: 'q-required',
          type: 'text' as const,
          label: 'Required question in section B',
          required: true,
        },
      ],
    },
  ],
  actions,
});

describe('Section-level show/hide actions', () => {
  let engine: ReturnType<typeof createQuestionnaireEngine>;

  beforeEach(() => {
    engine = createQuestionnaireEngine();
  });

  // Test 1: show action fires when condition is true
  it('1. show if selections includes x, answer=[x,y] → section-b visible', () => {
    engine.loadFromJSON(buildQuestionnaire([
      { type: 'show', condition: "q-control includes 'x'", target: 'section-b', targetType: 'section' },
    ]));
    engine.setAnswer('q-control', ['x', 'y']);
    const questions = engine.getCurrentQuestions();
    expect(questions.some(q => q.id === 'q-required')).toBe(true);
  });

  // Test 2: show action does not fire
  it('2. show if selections includes x, answer=[y] → section-b hidden', () => {
    engine.loadFromJSON(buildQuestionnaire([
      { type: 'show', condition: "q-control includes 'x'", target: 'section-b', targetType: 'section' },
    ]));
    engine.setAnswer('q-control', ['y']);
    const questions = engine.getCurrentQuestions();
    expect(questions.some(q => q.id === 'q-required')).toBe(false);
  });

  // Test 3: show action with empty selection
  it('3. show if selections includes x, answer=[] → section-b hidden', () => {
    engine.loadFromJSON(buildQuestionnaire([
      { type: 'show', condition: "q-control includes 'x'", target: 'section-b', targetType: 'section' },
    ]));
    engine.setAnswer('q-control', []);
    const questions = engine.getCurrentQuestions();
    expect(questions.some(q => q.id === 'q-required')).toBe(false);
  });

  // Test 4: reactivity — answer changes
  it('4. answer changes from [x] to [] → section-b becomes hidden', () => {
    engine.loadFromJSON(buildQuestionnaire([
      { type: 'show', condition: "q-control includes 'x'", target: 'section-b', targetType: 'section' },
    ]));
    engine.setAnswer('q-control', ['x']);
    expect(engine.getCurrentQuestions().some(q => q.id === 'q-required')).toBe(true);

    engine.setAnswer('q-control', []);
    expect(engine.getCurrentQuestions().some(q => q.id === 'q-required')).toBe(false);
  });

  // Test 5: hide action fires
  it("5. hide if flag == 'y', flag='y' → section-b hidden", () => {
    engine.loadFromJSON(buildFlagQuestionnaire([
      { type: 'hide', condition: "q-flag == 'y'", target: 'section-b', targetType: 'section' },
    ]));
    engine.setAnswer('q-flag', 'y');
    const questions = engine.getCurrentQuestions();
    expect(questions.some(q => q.id === 'q-required')).toBe(false);
  });

  // Test 6: hide action does not fire
  it("6. hide if flag == 'y', flag='z' → section-b visible", () => {
    engine.loadFromJSON(buildFlagQuestionnaire([
      { type: 'hide', condition: "q-flag == 'y'", target: 'section-b', targetType: 'section' },
    ]));
    engine.setAnswer('q-flag', 'z');
    const questions = engine.getCurrentQuestions();
    expect(questions.some(q => q.id === 'q-required')).toBe(true);
  });

  // Test 7: hide has priority over show — hide fires
  it('7. both show+hide, hide fires → hidden', () => {
    engine.loadFromJSON(buildFlagQuestionnaire([
      { type: 'show', condition: "q-flag == 'z'", target: 'section-b', targetType: 'section' },
      { type: 'hide', condition: "q-flag == 'y'", target: 'section-b', targetType: 'section' },
    ]));
    engine.setAnswer('q-flag', 'y');
    const questions = engine.getCurrentQuestions();
    expect(questions.some(q => q.id === 'q-required')).toBe(false);
  });

  // Test 8: hide has priority — hide doesn't fire, show fires → visible
  it('8. both show+hide, hide does not fire, show fires → visible', () => {
    engine.loadFromJSON(buildFlagQuestionnaire([
      { type: 'show', condition: "q-flag == 'z'", target: 'section-b', targetType: 'section' },
      { type: 'hide', condition: "q-flag == 'y'", target: 'section-b', targetType: 'section' },
    ]));
    engine.setAnswer('q-flag', 'z');
    const questions = engine.getCurrentQuestions();
    expect(questions.some(q => q.id === 'q-required')).toBe(true);
  });

  // Test 9: hidden section — q-required excluded from getCurrentQuestions
  it('9. hidden section: q-required excluded from getCurrentQuestions', () => {
    engine.loadFromJSON(buildQuestionnaire([
      { type: 'show', condition: "q-control includes 'x'", target: 'section-b', targetType: 'section' },
    ]));
    engine.setAnswer('q-control', ['y']);
    const sectionBQuestions = engine.getCurrentQuestions().filter(q => q.id === 'q-required');
    expect(sectionBQuestions.length).toBe(0);
  });

  // Test 10: hidden section — required question does NOT cause validation error
  it('10. hidden section: q-required does not cause validation error', () => {
    engine.loadFromJSON(buildQuestionnaire([
      { type: 'show', condition: "q-control includes 'x'", target: 'section-b', targetType: 'section' },
    ]));
    engine.setAnswer('q-control', ['y']);
    const result = engine.validate();
    expect(result.isValid).toBe(true);
    expect(result.errors.some(e => e.questionId === 'q-required')).toBe(false);
  });

  // Test 11: hidden then shown — q-required re-appears
  it('11. hidden then shown: q-required re-appears in questions', () => {
    engine.loadFromJSON(buildQuestionnaire([
      { type: 'show', condition: "q-control includes 'x'", target: 'section-b', targetType: 'section' },
    ]));
    engine.setAnswer('q-control', ['y']);
    expect(engine.getCurrentQuestions().some(q => q.id === 'q-required')).toBe(false);

    engine.setAnswer('q-control', ['x']);
    expect(engine.getCurrentQuestions().some(q => q.id === 'q-required')).toBe(true);
  });

  // Test 12: backward compat — action without targetType targets question normally
  it('12. backward compat: action without targetType targets question normally', () => {
    engine.loadFromJSON({
      id: 'compat-test',
      title: 'Compat Test',
      sections: [
        {
          id: 'sec',
          title: 'Section',
          questions: [
            { id: 'q-trigger', type: 'number' as const, label: 'Trigger', required: false },
            { id: 'q-target', type: 'text' as const, label: 'Target', required: false, visible: false },
          ],
        },
      ],
      actions: [
        { type: 'show', condition: 'q-trigger >= 1', target: 'q-target' },
      ],
    });

    engine.setAnswer('q-trigger', 5);
    expect(engine.getCurrentQuestions().some(q => q.id === 'q-target')).toBe(true);

    engine.setAnswer('q-trigger', 0);
    expect(engine.getCurrentQuestions().some(q => q.id === 'q-target')).toBe(false);
  });

  // Test 13: explicit targetType: 'question' same as no targetType
  it("13. targetType: 'question' explicit → same as no targetType", () => {
    engine.loadFromJSON({
      id: 'explicit-question-target',
      title: 'Explicit Question Target',
      sections: [
        {
          id: 'sec',
          title: 'Section',
          questions: [
            { id: 'q-trigger', type: 'number' as const, label: 'Trigger', required: false },
            { id: 'q-target', type: 'text' as const, label: 'Target', required: false, visible: false },
          ],
        },
      ],
      actions: [
        { type: 'show', condition: 'q-trigger >= 1', target: 'q-target', targetType: 'question' as const },
      ],
    });

    engine.setAnswer('q-trigger', 5);
    expect(engine.getCurrentQuestions().some(q => q.id === 'q-target')).toBe(true);
  });

  // Test 14: sectionVisibility in EngineState reflects correct values
  it('14. sectionVisibility in EngineState reflects correct values', () => {
    engine.loadFromJSON(buildQuestionnaire([
      { type: 'show', condition: "q-control includes 'x'", target: 'section-b', targetType: 'section' },
    ]));
    engine.setAnswer('q-control', ['y']);
    const state = engine.getState();
    expect(state.sectionVisibility['section-b']).toBe(false);
  });

  // Test 15: progress — hidden section's questions excluded from total
  it('15. progress: hidden section questions excluded from total', () => {
    engine.loadFromJSON(buildQuestionnaire([
      { type: 'show', condition: "q-control includes 'x'", target: 'section-b', targetType: 'section' },
    ]));

    // section-b hidden → only q-control counts
    engine.setAnswer('q-control', ['y']);
    const hiddenProgress = engine.getProgress();
    expect(hiddenProgress.total).toBe(1);

    // section-b visible → q-control + q-required count
    engine.setAnswer('q-control', ['x']);
    const visibleProgress = engine.getProgress();
    expect(visibleProgress.total).toBe(2);
  });
});
