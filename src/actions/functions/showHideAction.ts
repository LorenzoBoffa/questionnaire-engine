import type { Action, ShowAction, HideAction } from '../../types/actions';
import type { ActionExecutor, ActionContext } from '../types';

export function evaluateCondition(
  action: Action,
  context: ActionContext
): boolean {
  try {
    const result = context.formulaEngine.evaluate(action.condition, context.answers, context.formulas);
    
    if (typeof result === 'boolean') {
      return result;
    }
    
    if (typeof result === 'number') {
      const boolResult = result !== 0;
      return boolResult;
    }
    
    const boolResult = Boolean(result);
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

function extractFieldReferences(condition: string): string[] {
  const fieldPattern = /[a-zA-Z_][\w-]*/g;
  const matches = condition.match(fieldPattern) || [];
  const keywords = ['true', 'false', 'sum'];
  return matches.filter(m => !keywords.includes(m));
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
    
    if (newVisible && question.visible === false) {
      const referencedFields = extractFieldReferences(action.condition);
      const hasAnyReferencedAnswer = referencedFields.some(field => 
        context.answers[field] !== undefined && context.answers[field] !== null && context.answers[field] !== ''
      );
      
      if (referencedFields.length > 0 && !hasAnyReferencedAnswer) {
        return;
      }
    }
    
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
