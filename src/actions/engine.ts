import type { Action } from '../types/actions';
import type { AnswerStore } from '../types/answers';
import type { BaseQuestion } from '../questions/base';
import type { FormulaEngine } from '../formulas/types';
import type { ActionEngine, ActionContext, ActionHandlerRegistry } from './types';

export function createActionEngine(
  formulaEngine: FormulaEngine,
  questionRegistry: Map<string, BaseQuestion>,
  actionRegistry: ActionHandlerRegistry,
  onVisibilityChange?: (questionId: string, visible: boolean) => void
): ActionEngine {
  const actions: Action[] = [];

  function registerAction(action: Action): void {
    actions.push(action);
  }

  function clearActions(): void {
    actions.length = 0;
  }

  function getActionsForQuestion(questionId: string): Action[] {
    return actions.filter((action) => action.target === questionId);
  }

  function executeForQuestion(questionId: string, answers: AnswerStore): void {
    const relevantActions = getActionsForQuestion(questionId);
    if (relevantActions.length === 0) {
      return;
    }

    const context: ActionContext = {
      answers,
      formulaEngine,
      questionRegistry,
      onVisibilityChange,
    };

    const hideActions = relevantActions.filter((a) => a.type === 'hide');
    const showActions = relevantActions.filter((a) => a.type === 'show');

    for (const action of hideActions) {
      const handler = actionRegistry.getHandler(action.type);
      if (handler) {
        const conditionResult = handler.evaluateCondition(action, context);
        if (conditionResult) {
          handler.execute(action, context);
          return;
        }
      }
    }

    for (const action of showActions) {
      const handler = actionRegistry.getHandler(action.type);
      if (handler) {
        const conditionResult = handler.evaluateCondition(action, context);
        if (conditionResult) {
          handler.execute(action, context);
          break;
        }
      }
    }
  }

  function executeAll(answers: AnswerStore): void {
    const affectedQuestions = new Set<string>();
    
    for (const action of actions) {
      affectedQuestions.add(action.target);
    }

    for (const questionId of affectedQuestions) {
      executeForQuestion(questionId, answers);
    }
  }

  return {
    executeAll,
    executeForQuestion,
    getActionsForQuestion,
    registerAction,
    clearActions,
  };
}
