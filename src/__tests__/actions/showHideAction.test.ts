import { describe, it, expect, vi } from 'vitest';
import { evaluateCondition, createShowActionHandler, createHideActionHandler } from '../../actions/showHideAction';
import type { Action, ShowAction, HideAction } from '../../types/actions';
import type { ActionContext } from '../../actions/types';
import { createFormulaEngine } from '../../formulas/engine';
import { createTextQuestion } from '../../questions/textQuestion';
import { createTextQuestion as createTestTextQuestion } from '../fixtures/helpers';

describe('ShowHideAction', () => {
  const createMockContext = (answers: Record<string, any> = {}): ActionContext => {
    const formulaEngine = createFormulaEngine();
    const questionRegistry = new Map();
    const question = createTextQuestion(createTestTextQuestion({ id: 'q1' }));
    questionRegistry.set('q1', question);

    return {
      answers,
      formulaEngine,
      questionRegistry,
      onVisibilityChange: vi.fn(),
    };
  };

  describe('evaluateCondition', () => {
    it('should return true when condition evaluates to true', () => {
      const action: Action = {
        type: 'show',
        condition: '10 > 5',
        target: 'q1',
      };
      const context = createMockContext();
      const result = evaluateCondition(action, context);

      expect(result).toBe(true);
    });

    it('should return false when condition evaluates to false', () => {
      const action: Action = {
        type: 'show',
        condition: '5 > 10',
        target: 'q1',
      };
      const context = createMockContext();
      const result = evaluateCondition(action, context);

      expect(result).toBe(false);
    });

    it('should evaluate conditions with field references', () => {
      const action: Action = {
        type: 'show',
        condition: 'age >= 18',
        target: 'q1',
      };
      const context = createMockContext({ age: 25 });
      const result = evaluateCondition(action, context);

      expect(result).toBe(true);
    });

    it('should evaluate conditions with comparisons', () => {
      const action: Action = {
        type: 'show',
        condition: 'q1 > 10',
        target: 'q2',
      };
      const context = createMockContext({ q1: 15 });
      const result = evaluateCondition(action, context);

      expect(result).toBe(true);
    });

    it('should handle invalid conditions (default to false)', () => {
      const action: Action = {
        type: 'show',
        condition: 'invalid expression +',
        target: 'q1',
      };
      const context = createMockContext();
      const result = evaluateCondition(action, context);

      expect(result).toBe(false);
    });

    it('should convert number results to boolean', () => {
      const action: Action = {
        type: 'show',
        condition: '10',
        target: 'q1',
      };
      const context = createMockContext();
      const result = evaluateCondition(action, context);

      expect(result).toBe(true);
    });

    it('should handle zero as false', () => {
      const action: Action = {
        type: 'show',
        condition: '0',
        target: 'q1',
      };
      const context = createMockContext();
      const result = evaluateCondition(action, context);

      expect(result).toBe(false);
    });
  });

  describe('createShowActionHandler', () => {
    it('should show question when condition is true', () => {
      const handler = createShowActionHandler();
      const action: ShowAction = {
        type: 'show',
        condition: '10 > 5',
        target: 'q1',
      };
      const context = createMockContext();
      const question = context.questionRegistry.get('q1')!;

      handler.execute(action, context);

      expect(question.visible).toBe(true);
      expect(context.onVisibilityChange).toHaveBeenCalledWith('q1', true);
    });

    it('should hide question when condition is false', () => {
      const handler = createShowActionHandler();
      const action: ShowAction = {
        type: 'show',
        condition: '5 > 10',
        target: 'q1',
      };
      const context = createMockContext();
      const question = context.questionRegistry.get('q1')!;
      question.visible = true;

      handler.execute(action, context);

      expect(question.visible).toBe(false);
      expect(context.onVisibilityChange).toHaveBeenCalledWith('q1', false);
    });

    it('should update question visibility correctly', () => {
      const handler = createShowActionHandler();
      const action: ShowAction = {
        type: 'show',
        condition: 'q1 > 10',
        target: 'q2',
      };
      const context = createMockContext({ q1: 15 });
      const question2 = createTextQuestion(createTestTextQuestion({ id: 'q2', visible: false }));
      context.questionRegistry.set('q2', question2);

      handler.execute(action, context);

      expect(question2.visible).toBe(true);
    });

    it('should handle non-existent question gracefully', () => {
      const handler = createShowActionHandler();
      const action: ShowAction = {
        type: 'show',
        condition: '10 > 5',
        target: 'nonexistent',
      };
      const context = createMockContext();

      expect(() => handler.execute(action, context)).not.toThrow();
    });
  });

  describe('createHideActionHandler', () => {
    it('should hide question when condition is true', () => {
      const handler = createHideActionHandler();
      const action: HideAction = {
        type: 'hide',
        condition: '10 > 5',
        target: 'q1',
      };
      const context = createMockContext();
      const question = context.questionRegistry.get('q1')!;
      question.visible = true;

      handler.execute(action, context);

      expect(question.visible).toBe(false);
      expect(context.onVisibilityChange).toHaveBeenCalledWith('q1', false);
    });

    it('should show question when condition is false', () => {
      const handler = createHideActionHandler();
      const action: HideAction = {
        type: 'hide',
        condition: '5 > 10',
        target: 'q1',
      };
      const context = createMockContext();
      const question = context.questionRegistry.get('q1')!;
      question.visible = false;

      handler.execute(action, context);

      expect(question.visible).toBe(true);
      expect(context.onVisibilityChange).toHaveBeenCalledWith('q1', true);
    });

    it('should update question visibility correctly', () => {
      const handler = createHideActionHandler();
      const action: HideAction = {
        type: 'hide',
        condition: 'q1 < 10',
        target: 'q2',
      };
      const context = createMockContext({ q1: 5 });
      const question2 = createTextQuestion(createTestTextQuestion({ id: 'q2', visible: true }));
      context.questionRegistry.set('q2', question2);

      handler.execute(action, context);

      expect(question2.visible).toBe(false);
    });
  });
});
