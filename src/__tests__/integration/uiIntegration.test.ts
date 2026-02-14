import { describe, it, expect, vi } from 'vitest';
import { createQuestionnaireEngine } from '../../engine/QuestionnaireEngine';

describe('UI Integration - Real-time Validation', () => {
  it('should provide validation errors in subscription callback', () => {
    const engine = createQuestionnaireEngine();
    
    const questionnaire = {
      id: 'test',
      title: 'Test',
      sections: [{
        id: 's1',
        title: 'Section 1',
        questions: [{
          id: 'q1',
          type: 'text' as const,
          label: 'Name',
          required: true,
          validation: [
            { type: 'minLength' as const, value: 3 }
          ]
        }]
      }]
    };

    engine.loadFromJSON(questionnaire);

    const callback = vi.fn();
    engine.subscribe(callback);

    console.log('Initial subscription call count:', callback.mock.calls.length);
    if (callback.mock.calls.length > 0) {
      const initialState = callback.mock.calls[callback.mock.calls.length - 1][0];
      console.log('Initial state errors:', initialState.errors);
      expect(initialState.errors).toBeDefined();
      expect(initialState.errors.length).toBeGreaterThan(0);
    }

    callback.mockClear();

    engine.setAnswer('q1', 'ab');
    
    console.log('After setAnswer call count:', callback.mock.calls.length);
    expect(callback).toHaveBeenCalled();
    
    const state = callback.mock.calls[callback.mock.calls.length - 1][0];
    console.log('State after setAnswer:', state.errors);
    
    expect(state.errors).toBeDefined();
    const error = state.errors.find((e: any) => e.questionId === 'q1' && e.rule === 'minLength');
    expect(error).toBeDefined();
    expect(error.message).toContain('3');
  });

  it('should update validation errors in real-time', () => {
    const engine = createQuestionnaireEngine();
    
    const questionnaire = {
      id: 'test',
      title: 'Test',
      sections: [{
        id: 's1',
        title: 'Section 1',
        questions: [{
          id: 'q1',
          type: 'text' as const,
          label: 'Name',
          required: true
        }]
      }]
    };

    engine.loadFromJSON(questionnaire);

    const states: any[] = [];
    engine.subscribe((state) => {
      states.push(state);
      console.log(`State update ${states.length}:`, state.errors);
    });

    engine.setAnswer('q1', 'valid');
    
    const lastState = states[states.length - 1];
    console.log('Final state errors:', lastState.errors);
    
    const q1Error = lastState.errors.find((e: any) => e.questionId === 'q1');
    expect(q1Error).toBeUndefined();
  });

  it('should match the pattern used in App.tsx - WRONG WAY (subscribe after load)', () => {
    const engine = createQuestionnaireEngine();
    
    const questionnaire = {
      id: 'medical-intake-form',
      title: 'Medical Questionnaire',
      sections: [{
        id: 'patient-info',
        title: 'Patient Information',
        questions: [{
          id: 'patient-name',
          type: 'text' as const,
          label: 'Full Name',
          required: true,
          validation: [
            { type: 'minLength' as const, value: 2 },
            { type: 'maxLength' as const, value: 100 }
          ]
        }]
      }]
    };

    engine.loadFromJSON(questionnaire);

    let appState: any = null;

    const unsubscribe = engine.subscribe((newState) => {
      appState = newState;
      console.log('App received state:', {
        hasErrors: newState.errors && newState.errors.length > 0,
        errorCount: newState.errors?.length,
        errors: newState.errors
      });
    });

    console.log('After subscribing (too late!), app state errors:', appState?.errors);
    expect(appState).toBeNull();

    console.log('Solution: Get initial state manually after subscribing');
    appState = {
      questionnaire: engine.getQuestionnaire(),
      answers: engine.getAllAnswers(),
      progress: engine.getProgress(),
      errors: engine.getValidationErrors(),
      formulaResults: []
    };

    console.log('After manual getState, app state errors:', appState?.errors);
    expect(appState.errors).toBeDefined();
    expect(appState.errors.length).toBe(0);

    engine.setAnswer('patient-name', 'J');
    
    console.log('After short answer, app state errors:', appState?.errors);
    expect(appState.errors.length).toBeGreaterThan(0);
    const error = appState.errors.find((e: any) => e.questionId === 'patient-name' && e.rule === 'minLength');
    expect(error).toBeDefined();

    engine.setAnswer('patient-name', 'John Doe');
    
    console.log('After valid answer, app state errors:', appState?.errors);
    const nameError = appState.errors.find((e: any) => e.questionId === 'patient-name');
    expect(nameError).toBeUndefined();

    unsubscribe();
  });
});
