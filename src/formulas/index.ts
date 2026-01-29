export { createFormulaEngine } from './engine';
export { extractFieldReferences, buildDependencyGraph, topologicalSort } from './utils';
export type { FormulaEngine } from './types';

export { createExpressionEvaluator } from './evaluator';
export type { ExpressionEvaluator, ExpressionNode, EvaluationContext, ExpressionValue } from './types';

export { createFunctionRegistry, registerFunction, getFunction, callFunction, getRegisteredFunctions } from './registry';
export type { FormulaFunction, FunctionRegistry } from './types';

export { createSumFunction } from './functions/sum';

export { resolveFieldReference, convertToNumber } from './utils';

export type {
  LiteralNode,
  FieldReferenceNode,
  FunctionCallNode,
  BinaryOperationNode,
  UnaryOperationNode,
  BinaryOperator,
  UnaryOperator,
  ValidationResult,
} from './types';
