import type { AnswerStore } from '../types/answers';
import type { Formula, FormulaResult } from '../types/questionnaire';

export type ExpressionValue = number | boolean | string | string[] | null;

export interface EvaluationContext {
  answers: AnswerStore;
  formulas?: Record<string, number>;
  functions: FunctionRegistry;
}

export interface ExpressionNode {
  type: NodeType;
}

export type NodeType =
  | 'literal'
  | 'fieldReference'
  | 'functionCall'
  | 'binaryOperation'
  | 'unaryOperation';

export interface LiteralNode extends ExpressionNode {
  type: 'literal';
  value: number | string | boolean;
}

export interface FieldReferenceNode extends ExpressionNode {
  type: 'fieldReference';
  fieldId: string;
}

export interface FunctionCallNode extends ExpressionNode {
  type: 'functionCall';
  functionName: string;
  args: ExpressionNode[];
}

export interface BinaryOperationNode extends ExpressionNode {
  type: 'binaryOperation';
  operator: BinaryOperator;
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface UnaryOperationNode extends ExpressionNode {
  type: 'unaryOperation';
  operator: UnaryOperator;
  operand: ExpressionNode;
}

export type BinaryOperator = '+' | '-' | '*' | '/' | '>' | '<' | '>=' | '<=' | '==' | '!=' | '&&' | '||' | 'includes';

export type UnaryOperator = '-' | '+' | '!';

export interface ExpressionEvaluator {
  evaluate(expression: string, context: EvaluationContext): ExpressionValue;
  parse(expression: string): ExpressionNode;
  validate(expression: string): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export type FormulaFunction = (
  args: (number | string | null)[],
  context: EvaluationContext
) => ExpressionValue;

export interface FunctionRegistry {
  register(name: string, fn: FormulaFunction): void;
  get(name: string): FormulaFunction | undefined;
  call(name: string, args: any[], context: EvaluationContext): ExpressionValue;
  getRegistered(): string[];
}

export interface FormulaEngine {
  evaluate(expression: string, answers: AnswerStore, formulas?: Record<string, number>): ExpressionValue;
  evaluateFormula(formula: Formula, answers: AnswerStore, formulas?: Record<string, number>): FormulaResult;
  evaluateAll(formulas: Formula[], answers: AnswerStore): FormulaResult[];
  validateExpression(expression: string): boolean;
  getReferencedFields(expression: string): string[];
}
