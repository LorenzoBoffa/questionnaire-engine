export * from './types';

export {
  createQuestion,
  isQuestionType,
  setQuestionVisible,
  isQuestionVisible,
  register,
  isRegistered,
  getRegisteredTypes,
  UnknownQuestionTypeError,
  InvalidQuestionDataError,
  createTextQuestion,
  validateTextQuestion,
  getTextQuestionDefaultValue,
  serializeTextQuestion,
  createNumberQuestion,
  validateNumberQuestion,
  getNumberQuestionDefaultValue,
  serializeNumberQuestion,
  createMultipleChoiceQuestion,
  validateMultipleChoiceQuestion,
  getMultipleChoiceQuestionDefaultValue,
  serializeMultipleChoiceQuestion,
  getMultipleChoiceOptions,
  isValidMultipleChoiceOption,
} from './questions';

export type { BaseQuestion } from './questions';

export {
  createFormulaEngine,
  createExpressionEvaluator,
  createFunctionRegistry,
  registerFunction,
  getFunction,
  callFunction,
  getRegisteredFunctions,
  createSumFunction,
  resolveFieldReference,
  convertToNumber,
} from './formulas';

export type {
  FormulaEngine,
  ExpressionEvaluator,
  ExpressionNode,
  EvaluationContext,
  ExpressionValue,
  FormulaFunction,
  FunctionRegistry,
  LiteralNode,
  FieldReferenceNode,
  FunctionCallNode,
  BinaryOperationNode,
  UnaryOperationNode,
  BinaryOperator,
  UnaryOperator,
  ValidationResult as FormulaValidationResult,
} from './formulas';

export {
  defaultActionRegistry,
  createActionRegistry,
  createShowActionHandler,
  createHideActionHandler,
  evaluateCondition,
  createActionEngine,
} from './actions';

export type {
  ActionContext,
  ActionExecutor,
  ActionHandlerRegistry,
  ActionEngine,
} from './actions';

export type { Action, ActionType, ShowAction, HideAction } from './types/actions';

export {
  createQuestionnaireEngine,
  NotInitializedError,
  QuestionNotFoundError,
  InvalidQuestionnaireError,
} from './engine';

export type { QuestionnaireEngine, EngineCallback, EngineState, Progress } from './engine';

export {
  createJSONLoader,
  InvalidJSONError,
  InvalidStructureError,
  MissingFieldError,
  InvalidTypeError,
} from './utils/json-loader';

export type {
  JSONLoader,
  QuestionParser,
  ValidationRuleParser,
  FormulaParser,
  ActionParser,
  SectionParser,
  ValidationResult as LoaderValidationResult,
} from './utils/json-loader';
