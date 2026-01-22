import type { FormulaFunction, FunctionRegistry, EvaluationContext, ExpressionValue } from './types';
import { createSumFunction } from './functions/sum';

const registry = new Map<string, FormulaFunction>();

function registerFunction(name: string, fn: FormulaFunction): void {
  registry.set(name, fn);
}

function getFunction(name: string): FormulaFunction | undefined {
  return registry.get(name);
}

function callFunction(
  name: string,
  args: (number | string | null)[],
  context: EvaluationContext
): ExpressionValue {
  const fn = getFunction(name);
  if (!fn) {
    throw new Error(`Function '${name}' is not registered`);
  }
  return fn(args, context);
}

function getRegisteredFunctions(): string[] {
  return Array.from(registry.keys());
}

export function createFunctionRegistry(): FunctionRegistry {
  if (registry.size === 0) {
    registerFunction('sum', createSumFunction());
  }
  return {
    register: registerFunction,
    get: getFunction,
    call: callFunction,
    getRegistered: getRegisteredFunctions,
  };
}

export function getFunctionRegistry(): FunctionRegistry {
  return createFunctionRegistry();
}

export { registerFunction, getFunction, callFunction, getRegisteredFunctions };
