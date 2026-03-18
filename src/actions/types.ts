import type { Action } from '../types/actions';
import type { ActionType } from '../types/actions';
import type { AnswerStore } from '../types/answers';
import type { BaseQuestion } from '../questions/base';
import type { FormulaEngine } from '../formulas/types';

export type { ActionType } from '../types/actions';

export interface ActionContext {
  answers: AnswerStore;
  formulaEngine: FormulaEngine;
  questionRegistry: Map<string, BaseQuestion>;
  onVisibilityChange?: (questionId: string, visible: boolean) => void;
  formulas?: Record<string, number>;
  sectionVisibility?: Map<string, boolean>;
  onSectionVisibilityChange?: (sectionId: string, visible: boolean) => void;
}

export interface ActionExecutor {
  execute(action: Action, context: ActionContext): void;
  evaluateCondition(action: Action, context: ActionContext): boolean;
}

export interface ActionHandlerRegistry {
  register(type: ActionType, handler: ActionExecutor): void;
  getHandler(type: ActionType): ActionExecutor | undefined;
  getRegisteredTypes(): ActionType[];
  isRegistered(type: ActionType): boolean;
}

export interface ActionEngine {
  executeAll(answers: AnswerStore, formulas?: Record<string, number>): void;
  executeForQuestion(questionId: string, answers: AnswerStore, formulas?: Record<string, number>): void;
  executeForSection(sectionId: string, answers: AnswerStore, formulas?: Record<string, number>): void;
  getActionsForQuestion(questionId: string): Action[];
  registerAction(action: Action): void;
  clearActions(): void;
}
