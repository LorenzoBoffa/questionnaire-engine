import type { Action } from '../types/actions';
import type { AnswerStore } from '../types/answers';
import type { BaseQuestion } from '../questions/base';
import type { FormulaEngine } from '../formulas/types';
import type { ActionEngine, ActionContext, ActionHandlerRegistry } from './types';
import { evaluateCondition } from './functions/showHideAction';

export function createActionEngine(
  formulaEngine: FormulaEngine,
  questionRegistry: Map<string, BaseQuestion>,
  actionRegistry: ActionHandlerRegistry,
  onVisibilityChange?: (questionId: string, visible: boolean) => void,
  sectionVisibility?: Map<string, boolean>,
  onSectionVisibilityChange?: (sectionId: string, visible: boolean) => void
): ActionEngine {
  const actions: Action[] = [];

  function registerAction(action: Action): void {
    actions.push(action);
  }

  function clearActions(): void {
    actions.length = 0;
  }

  function getActionsForQuestion(questionId: string): Action[] {
    return actions.filter((action) => action.target === questionId && action.targetType !== 'section');
  }

  function executeForQuestion(questionId: string, answers: AnswerStore, formulas?: Record<string, number>): void {
    const relevantActions = actions.filter(
      (action) => action.target === questionId && action.targetType !== 'section'
    );
    if (relevantActions.length === 0) {
      return;
    }

    const context: ActionContext = {
      answers,
      formulaEngine,
      questionRegistry,
      onVisibilityChange,
      formulas,
      sectionVisibility,
      onSectionVisibilityChange,
    };

    const hideActions = relevantActions.filter((a) => a.type === 'hide');
    const showActions = relevantActions.filter((a) => a.type === 'show');

    for (const action of hideActions) {
      const handler = actionRegistry.getHandler(action.type);
      if (handler) {
        handler.execute(action, context);
        return;
      }
    }

    for (const action of showActions) {
      const handler = actionRegistry.getHandler(action.type);
      if (handler) {
        handler.execute(action, context);
      }
    }
  }

  function executeForSection(sectionId: string, answers: AnswerStore, formulas?: Record<string, number>): void {
    const relevant = actions.filter(
      (a) => a.target === sectionId && a.targetType === 'section'
    );
    if (relevant.length === 0) return;

    const context: ActionContext = {
      answers,
      formulaEngine,
      questionRegistry,
      onVisibilityChange,
      formulas,
      sectionVisibility,
      onSectionVisibilityChange,
    };

    const hideActions = relevant.filter((a) => a.type === 'hide');
    const showActions = relevant.filter((a) => a.type === 'show');

    for (const action of hideActions) {
      const conditionResult = evaluateCondition(action, context);
      const newVisible = !conditionResult;
      if (onSectionVisibilityChange) onSectionVisibilityChange(sectionId, newVisible);
      return;
    }

    for (const action of showActions) {
      const conditionResult = evaluateCondition(action, context);
      if (onSectionVisibilityChange) onSectionVisibilityChange(sectionId, conditionResult);
    }
  }

  function executeAll(answers: AnswerStore, formulas?: Record<string, number>): void {
    const affectedQuestions = new Set<string>();
    const affectedSections = new Set<string>();

    for (const action of actions) {
      if (action.targetType === 'section') {
        affectedSections.add(action.target);
      } else {
        affectedQuestions.add(action.target);
      }
    }

    for (const questionId of affectedQuestions) {
      executeForQuestion(questionId, answers, formulas);
    }

    for (const sectionId of affectedSections) {
      executeForSection(sectionId, answers, formulas);
    }
  }

  return {
    executeAll,
    executeForQuestion,
    executeForSection,
    getActionsForQuestion,
    registerAction,
    clearActions,
  };
}
