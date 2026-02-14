import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStateManager } from '../../state/stateManager';
import { createFormulaEngine } from '../../formulas/engine';
import { validateAll } from '../../validation/engine';
import type { Questionnaire } from '../../types/questionnaire';

describe('Real-time Validation', () => {
  let stateManager: ReturnType<typeof createStateManager>;
  let formulaEngine: ReturnType<typeof createFormulaEngine>;

  const questionnaireWithValidation: Questionnaire = {
    id: 'validation-test',
    title: 'Validation Test',
    sections: [
      {
        id: 'section1',
        title: 'Section 1',
        questions: [
          {
            id: 'required-text',
            type: 'text',
            label: 'Required Text',
            required: true,
            validation: [
              { type: 'minLength', value: 3 },
              { type: 'maxLength', value: 10 }
            ]
          },
          {
            id: 'required-number',
            type: 'number',
            label: 'Required Number',
            required: true,
            validation: [
              { type: 'min', value: 0 },
              { type: 'max', value: 100 }
            ]
          },
          {
            id: 'optional-text',
            type: 'text',
            label: 'Optional Text',
            required: false,
            validation: [
              { type: 'minLength', value: 5 }
            ]
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    formulaEngine = createFormulaEngine();

    const validationEngine = {
      validateAll,
    };

    stateManager = createStateManager({
      validationEngine,
      formulaEngine,
    });
  });

  describe('Initial Load Validation', () => {
    it('should NOT show validation errors on initial load', () => {
      stateManager.loadQuestionnaire(questionnaireWithValidation);

      const errors = stateManager.getValidationErrors();

      expect(errors).toHaveLength(0);
    });

    it('should include empty errors array in initial state', () => {
      stateManager.loadQuestionnaire(questionnaireWithValidation);

      const state = stateManager.getState();

      expect(state.errors).toBeDefined();
      expect(state.errors).toHaveLength(0);
    });

    it('should show errors for required empty fields after first setAnswer', () => {
      stateManager.loadQuestionnaire(questionnaireWithValidation);
      stateManager.setAnswer('required-text', 'x');

      const errors = stateManager.getValidationErrors();

      const requiredTextError = errors.find(e => e.questionId === 'required-text');
      const requiredNumberError = errors.find(e => e.questionId === 'required-number');

      expect(requiredNumberError).toBeDefined();
      expect(requiredNumberError?.rule).toBe('required');
    });

    it('should show errors for required empty fields after validate', () => {
      stateManager.loadQuestionnaire(questionnaireWithValidation);
      stateManager.validate();

      const errors = stateManager.getValidationErrors();

      const requiredTextError = errors.find(e => e.questionId === 'required-text');
      const requiredNumberError = errors.find(e => e.questionId === 'required-number');

      expect(requiredTextError).toBeDefined();
      expect(requiredTextError?.rule).toBe('required');
      expect(requiredNumberError).toBeDefined();
      expect(requiredNumberError?.rule).toBe('required');
    });

    it('should NOT show errors for optional empty fields on load', () => {
      stateManager.loadQuestionnaire(questionnaireWithValidation);

      const errors = stateManager.getValidationErrors();

      const optionalTextError = errors.find(e => e.questionId === 'optional-text');

      expect(optionalTextError).toBeUndefined();
    });
  });

  describe('Real-time Validation on Answer Change', () => {
    beforeEach(() => {
      stateManager.loadQuestionnaire(questionnaireWithValidation);
    });

    it('should validate immediately when setting an answer', () => {
      const callback = vi.fn();
      stateManager.subscribe(callback);

      stateManager.setAnswer('required-text', 'test');

      expect(callback).toHaveBeenCalled();
      const state = callback.mock.calls[callback.mock.calls.length - 1][0];
      console.log('State after setting answer:', state.errors);
      
      expect(state.errors).toBeDefined();
    });

    it('should show error when text is too short', () => {
      stateManager.setAnswer('required-text', 'ab');

      const errors = stateManager.getValidationErrors();
      console.log('Too short text errors:', errors);
      
      const error = errors.find(e => e.questionId === 'required-text' && e.rule === 'minLength');
      expect(error).toBeDefined();
      expect(error?.message).toContain('3');
    });

    it('should clear error when text meets requirements', () => {
      stateManager.setAnswer('required-text', 'ab');
      let errors = stateManager.getValidationErrors();
      console.log('Errors with short text:', errors);
      expect(errors.some(e => e.questionId === 'required-text')).toBe(true);

      stateManager.setAnswer('required-text', 'valid');
      errors = stateManager.getValidationErrors();
      console.log('Errors after fixing text:', errors);
      expect(errors.some(e => e.questionId === 'required-text')).toBe(false);
    });

    it('should show error when number is out of range', () => {
      stateManager.setAnswer('required-number', 150);

      const errors = stateManager.getValidationErrors();
      console.log('Out of range number errors:', errors);
      
      const error = errors.find(e => e.questionId === 'required-number' && e.rule === 'max');
      expect(error).toBeDefined();
    });

    it('should validate when clearing a required field', () => {
      stateManager.setAnswer('required-text', 'valid');
      let errors = stateManager.getValidationErrors();
      console.log('Errors with valid text:', errors);
      expect(errors.some(e => e.questionId === 'required-text')).toBe(false);

      stateManager.setAnswer('required-text', null);
      errors = stateManager.getValidationErrors();
      console.log('Errors after clearing required field:', errors);
      
      const error = errors.find(e => e.questionId === 'required-text' && e.rule === 'required');
      expect(error).toBeDefined();
    });

    it('should validate when clearing with empty string', () => {
      stateManager.setAnswer('required-text', 'valid');
      stateManager.setAnswer('required-text', '');

      const errors = stateManager.getValidationErrors();
      console.log('Errors after clearing with empty string:', errors);
      
      const error = errors.find(e => e.questionId === 'required-text' && e.rule === 'required');
      expect(error).toBeDefined();
    });
  });

  describe('Validation State Updates', () => {
    beforeEach(() => {
      stateManager.loadQuestionnaire(questionnaireWithValidation);
    });

    it('should notify subscribers with validation errors', () => {
      const callback = vi.fn();
      stateManager.subscribe(callback);

      stateManager.setAnswer('required-text', 'ab');

      expect(callback).toHaveBeenCalled();
      const state = callback.mock.calls[callback.mock.calls.length - 1][0];
      console.log('Subscriber received state:', state.errors);
      
      expect(state.errors).toBeDefined();
      expect(state.errors.length).toBeGreaterThan(0);
    });

    it('should update validation errors in getState()', () => {
      stateManager.setAnswer('required-text', 'ab');

      const state = stateManager.getState();
      console.log('getState() errors:', state.errors);
      
      const error = state.errors.find(e => e.questionId === 'required-text' && e.rule === 'minLength');
      expect(error).toBeDefined();
    });

    it('should maintain validation state across multiple changes', () => {
      stateManager.setAnswer('required-text', 'ab');
      let state = stateManager.getState();
      console.log('State after first change:', state.errors);
      expect(state.errors.some(e => e.questionId === 'required-text')).toBe(true);

      stateManager.setAnswer('required-number', 150);
      state = stateManager.getState();
      console.log('State after second change:', state.errors);
      expect(state.errors.some(e => e.questionId === 'required-text')).toBe(true);
      expect(state.errors.some(e => e.questionId === 'required-number')).toBe(true);

      stateManager.setAnswer('required-text', 'valid');
      state = stateManager.getState();
      console.log('State after fixing first field:', state.errors);
      expect(state.errors.some(e => e.questionId === 'required-text')).toBe(false);
      expect(state.errors.some(e => e.questionId === 'required-number')).toBe(true);
    });
  });

  describe('Optional Field Validation', () => {
    beforeEach(() => {
      stateManager.loadQuestionnaire(questionnaireWithValidation);
    });

    it('should not show error for empty optional field', () => {
      const errors = stateManager.getValidationErrors();
      console.log('Errors for optional field (empty):', errors);
      
      const error = errors.find(e => e.questionId === 'optional-text');
      expect(error).toBeUndefined();
    });

    it('should validate optional field when value is provided', () => {
      stateManager.setAnswer('optional-text', 'ab');

      const errors = stateManager.getValidationErrors();
      console.log('Errors for optional field (too short):', errors);
      
      const error = errors.find(e => e.questionId === 'optional-text' && e.rule === 'minLength');
      expect(error).toBeDefined();
    });

    it('should clear error when optional field meets requirements', () => {
      stateManager.setAnswer('optional-text', 'ab');
      let errors = stateManager.getValidationErrors();
      expect(errors.some(e => e.questionId === 'optional-text')).toBe(true);

      stateManager.setAnswer('optional-text', 'valid text');
      errors = stateManager.getValidationErrors();
      console.log('Errors for optional field (valid):', errors);
      expect(errors.some(e => e.questionId === 'optional-text')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      stateManager.loadQuestionnaire(questionnaireWithValidation);
    });

    it('should handle null values', () => {
      stateManager.setAnswer('required-text', null);

      const errors = stateManager.getValidationErrors();
      console.log('Errors for null value:', errors);
      
      const error = errors.find(e => e.questionId === 'required-text' && e.rule === 'required');
      expect(error).toBeDefined();
    });

    it('should handle undefined values', () => {
      stateManager.setAnswer('required-text', undefined as any);

      const errors = stateManager.getValidationErrors();
      console.log('Errors for undefined value:', errors);
      
      const error = errors.find(e => e.questionId === 'required-text' && e.rule === 'required');
      expect(error).toBeDefined();
    });

    it('should handle whitespace-only strings', () => {
      stateManager.setAnswer('required-text', '   ');

      const errors = stateManager.getValidationErrors();
      console.log('Errors for whitespace string:', errors);
      
      const error = errors.find(e => e.questionId === 'required-text' && e.rule === 'required');
      expect(error).toBeDefined();
    });

    it('should handle number 0 as valid', () => {
      stateManager.setAnswer('required-number', 0);

      const errors = stateManager.getValidationErrors();
      console.log('Errors for number 0:', errors);
      
      const requiredError = errors.find(e => e.questionId === 'required-number' && e.rule === 'required');
      expect(requiredError).toBeUndefined();
    });
  });
});
