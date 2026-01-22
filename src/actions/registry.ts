import type { ActionType, ActionExecutor, ActionHandlerRegistry } from './types';

export function createActionRegistry(): ActionHandlerRegistry {
  const handlers = new Map<ActionType, ActionExecutor>();

  function register(type: ActionType, handler: ActionExecutor): void {
    handlers.set(type, handler);
  }

  function getHandler(type: ActionType): ActionExecutor | undefined {
    return handlers.get(type);
  }

  function getRegisteredTypes(): ActionType[] {
    return Array.from(handlers.keys());
  }

  function isRegistered(type: ActionType): boolean {
    return handlers.has(type);
  }

  return {
    register,
    getHandler,
    getRegisteredTypes,
    isRegistered,
  };
}
