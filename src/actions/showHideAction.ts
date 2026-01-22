import type { Action, ShowAction, HideAction } from '../types/actions';
import type { ActionExecutor, ActionContext } from './types';

export function evaluateCondition(
  action: Action,
  context: ActionContext
): boolean {
  try {
    const result = context.formulaEngine.evaluate(action.condition, context.answers);
    
    if (typeof result === 'boolean') {
      return result;
    }
    
    if (typeof result === 'number') {
      return result !== 0;
    }
    
    return Boolean(result);
  } catch (error) {
    return false;
  }
}

export function createShowActionHandler(): ActionExecutor {
  function evaluateConditionForShow(action: Action, context: ActionContext): boolean {
    return evaluateCondition(action, context);
  }

  function execute(action: ShowAction, context: ActionContext): void {
    const conditionResult = evaluateConditionForShow(action, context);
    const question = context.questionRegistry.get(action.target);

    if (!question) {
      return;
    }

    const newVisible = conditionResult;
    question.visible = newVisible;

    if (context.onVisibilityChange) {
      context.onVisibilityChange(action.target, newVisible);
    }
  }

  return {
    execute,
    evaluateCondition: evaluateConditionForShow,
  };
}

export function createHideActionHandler(): ActionExecutor {
  function evaluateConditionForHide(action: Action, context: ActionContext): boolean {
    return evaluateCondition(action, context);
  }

  function execute(action: HideAction, context: ActionContext): void {
    const conditionResult = evaluateConditionForHide(action, context);
    const question = context.questionRegistry.get(action.target);

    if (!question) {
      return;
    }

    const newVisible = !conditionResult;
    question.visible = newVisible;

    if (context.onVisibilityChange) {
      context.onVisibilityChange(action.target, newVisible);
    }
  }

  return {
    execute,
    evaluateCondition: evaluateConditionForHide,
  };
}
