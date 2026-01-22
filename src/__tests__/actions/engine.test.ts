import { describe, it, expect, vi } from 'vitest';
import { createActionEngine } from '../../actions/engine';
import { defaultActionRegistry } from '../../actions';
import { createFormulaEngine } from '../../formulas/engine';
import { createTextQuestion } from '../../questions/textQuestion';
import { createTextQuestion as createTestTextQuestion } from '../fixtures/helpers';
import type { Action } from '../../types/actions';
import type { AnswerStore } from '../../types/answers';

describe('Action Engine', () => {
  const createEngine = () => {
    const formulaEngine = createFormulaEngine();
    const questionRegistry = new Map();
    const question1 = createTextQuestion(createTestTextQuestion({ id: 'q1' }));
    const question2 = createTextQuestion(createTestTextQuestion({ id: 'q2', visible: false }));
    questionRegistry.set('q1', question1);
    questionRegistry.set('q2', question2);

    const onVisibilityChange = vi.fn();
    const registry = defaultActionRegistry;
    const engine = createActionEngine(
      formulaEngine,
      questionRegistry,
      registry,
      onVisibilityChange
    );

    return { engine, questionRegistry, onVisibilityChange };
  };

  describe('registerAction', () => {
    it('should register an action', () => {
      const { engine } = createEngine();
      const action: Action = {
        type: 'show',
        condition: 'q1 > 10',
        target: 'q2',
      };

      engine.registerAction(action);

      const actions = engine.getActionsForQuestion('q2');
      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual(action);
    });

    it('should register multiple actions', () => {
      const { engine } = createEngine();
      const action1: Action = {
        type: 'show',
        condition: 'q1 > 10',
        target: 'q2',
      };
      const action2: Action = {
        type: 'hide',
        condition: 'q1 < 5',
        target: 'q2',
      };

      engine.registerAction(action1);
      engine.registerAction(action2);

      const actions = engine.getActionsForQuestion('q2');
      expect(actions).toHaveLength(2);
    });
  });

  describe('executeForQuestion', () => {
    it('should execute actions on answer changes', () => {
      const { engine, questionRegistry, onVisibilityChange } = createEngine();
      const action: Action = {
        type: 'show',
        condition: 'q1 >= 18',
        target: 'q2',
      };

      engine.registerAction(action);
      const answers: AnswerStore = { q1: 25 };
      engine.executeForQuestion('q2', answers);

      const question2 = questionRegistry.get('q2')!;
      expect(question2.visible).toBe(true);
      expect(onVisibilityChange).toHaveBeenCalledWith('q2', true);
    });

    it('should not execute actions when condition is false', () => {
      const { engine, questionRegistry } = createEngine();
      const action: Action = {
        type: 'show',
        condition: 'q1 >= 18',
        target: 'q2',
      };

      engine.registerAction(action);
      const answers: AnswerStore = { q1: 15 };
      engine.executeForQuestion('q2', answers);

      const question2 = questionRegistry.get('q2')!;
      expect(question2.visible).toBe(false);
    });

    it('should handle multiple actions for same target', () => {
      const { engine, questionRegistry } = createEngine();
      const showAction: Action = {
        type: 'show',
        condition: 'q1 > 10',
        target: 'q2',
      };
      const hideAction: Action = {
        type: 'hide',
        condition: 'q1 < 5',
        target: 'q2',
      };

      engine.registerAction(showAction);
      engine.registerAction(hideAction);

      const answers: AnswerStore = { q1: 15 };
      engine.executeForQuestion('q2', answers);

      const question2 = questionRegistry.get('q2')!;
      expect(question2.visible).toBe(true);
    });

    it('should prioritize hide actions over show actions', () => {
      const { engine, questionRegistry } = createEngine();
      const showAction: Action = {
        type: 'show',
        condition: 'q1 > 0',
        target: 'q2',
      };
      const hideAction: Action = {
        type: 'hide',
        condition: 'q1 > 10',
        target: 'q2',
      };

      engine.registerAction(showAction);
      engine.registerAction(hideAction);

      const answers: AnswerStore = { q1: 15 };
      engine.executeForQuestion('q2', answers);

      const question2 = questionRegistry.get('q2')!;
      expect(question2.visible).toBe(false);
    });
  });

  describe('executeAll', () => {
    it('should execute all actions on load', () => {
      const { engine, questionRegistry } = createEngine();
      const action: Action = {
        type: 'show',
        condition: 'q1 >= 18',
        target: 'q2',
      };

      engine.registerAction(action);
      const answers: AnswerStore = { q1: 25 };
      engine.executeAll(answers);

      const question2 = questionRegistry.get('q2')!;
      expect(question2.visible).toBe(true);
    });

    it('should handle actions with complex conditions', () => {
      const { engine, questionRegistry } = createEngine();
      const action: Action = {
        type: 'show',
        condition: 'q1 >= 18 && q1 <= 65',
        target: 'q2',
      };

      engine.registerAction(action);
      const answers: AnswerStore = { q1: 30 };
      engine.executeAll(answers);

      const question2 = questionRegistry.get('q2')!;
      expect(question2.visible).toBe(true);
    });

    it('should execute actions for multiple questions', () => {
      const { engine, questionRegistry } = createEngine();
      const question3 = createTextQuestion(createTestTextQuestion({ id: 'q3', visible: false }));
      questionRegistry.set('q3', question3);

      const action1: Action = {
        type: 'show',
        condition: 'q1 > 10',
        target: 'q2',
      };
      const action2: Action = {
        type: 'show',
        condition: 'q1 > 20',
        target: 'q3',
      };

      engine.registerAction(action1);
      engine.registerAction(action2);

      const answers: AnswerStore = { q1: 25 };
      engine.executeAll(answers);

      expect(questionRegistry.get('q2')!.visible).toBe(true);
      expect(questionRegistry.get('q3')!.visible).toBe(true);
    });

    it('should handle empty actions list', () => {
      const { engine } = createEngine();
      const answers: AnswerStore = {};

      expect(() => engine.executeAll(answers)).not.toThrow();
    });
  });

  describe('getActionsForQuestion', () => {
    it('should return actions for specific question', () => {
      const { engine } = createEngine();
      const action: Action = {
        type: 'show',
        condition: 'q1 > 10',
        target: 'q2',
      };

      engine.registerAction(action);
      const actions = engine.getActionsForQuestion('q2');

      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual(action);
    });

    it('should return empty array when no actions for question', () => {
      const { engine } = createEngine();
      const actions = engine.getActionsForQuestion('q1');

      expect(actions).toHaveLength(0);
    });
  });

  describe('clearActions', () => {
    it('should clear all registered actions', () => {
      const { engine } = createEngine();
      const action: Action = {
        type: 'show',
        condition: 'q1 > 10',
        target: 'q2',
      };

      engine.registerAction(action);
      engine.clearActions();

      const actions = engine.getActionsForQuestion('q2');
      expect(actions).toHaveLength(0);
    });
  });
});
