import type { Action, ShowAction, HideAction } from '../types/actions';
import type { ActionExecutor, ActionContext } from './types';

export function evaluateCondition(
  action: Action,
  context: ActionContext
): boolean {
  try {
    console.log('[evaluateCondition] Action:', action.type, 'Condition:', action.condition, 'Target:', action.target);
    console.log('[evaluateCondition] Answers:', JSON.stringify(context.answers, null, 2));
    const result = context.formulaEngine.evaluate(action.condition, context.answers);
    console.log('[evaluateCondition] Result:', result, 'Type:', typeof result);
    
    if (typeof result === 'boolean') {
      console.log('[evaluateCondition] Returning boolean:', result);
      return result;
    }
    
    if (typeof result === 'number') {
      const boolResult = result !== 0;
      console.log('[evaluateCondition] Returning number as boolean:', boolResult);
      return boolResult;
    }
    
    const boolResult = Boolean(result);
    console.log('[evaluateCondition] Returning converted boolean:', boolResult);
    return boolResult;
  } catch (error) {
    console.error('[evaluateCondition] Error:', error);
    return false;
  }
}

export function createShowActionHandler(): ActionExecutor {
  function evaluateConditionForShow(action: Action, context: ActionContext): boolean {
    return evaluateCondition(action, context);
  }

  function execute(action: ShowAction, context: ActionContext): void {
    const conditionResult = evaluateConditionForShow(action, context);
    console.log('[ShowAction.execute] Condition result:', conditionResult, 'Target:', action.target);
    const question = context.questionRegistry.get(action.target);

    if (!question) {
      console.log('[ShowAction.execute] Question not found:', action.target);
      return;
    }

    const newVisible = conditionResult;
    console.log('[ShowAction.execute] Setting visibility:', action.target, 'to', newVisible);
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
