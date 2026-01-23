import { createActionRegistry } from './registry';
import { createShowActionHandler, createHideActionHandler } from './functions/showHideAction';

export const defaultActionRegistry = createActionRegistry();

defaultActionRegistry.register('show', createShowActionHandler());
defaultActionRegistry.register('hide', createHideActionHandler());

export { createActionRegistry } from './registry';
export { createShowActionHandler, createHideActionHandler, evaluateCondition } from './functions/showHideAction';
export { createActionEngine } from './engine';
export type {
  ActionContext,
  ActionExecutor,
  ActionHandlerRegistry,
  ActionEngine,
} from './types';
