import type {
  ExpressionEvaluator,
  ExpressionNode,
  EvaluationContext,
  ExpressionValue,
  ValidationResult,
  LiteralNode,
  FieldReferenceNode,
  FunctionCallNode,
  BinaryOperationNode,
  UnaryOperationNode,
  BinaryOperator,
} from './types';
import { resolveFieldReference } from './utils';
import { callFunction } from './registry';

function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\n' || char === '\r';
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

function isLetter(char: string): boolean {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_' || char === '-';
}

function isAlphanumeric(char: string): boolean {
  return isDigit(char) || isLetter(char);
}

class Parser {
  private expression: string;
  private position: number;

  constructor(expression: string) {
    this.expression = expression.trim();
    this.position = 0;
  }

  private peek(): string {
    if (this.position >= this.expression.length) {
      return '';
    }
    return this.expression[this.position];
  }

  private advance(): string {
    if (this.position >= this.expression.length) {
      return '';
    }
    return this.expression[this.position++];
  }

  private skipWhitespace(): void {
    while (isWhitespace(this.peek())) {
      this.advance();
    }
  }

  private parseNumber(): LiteralNode {
    let numStr = '';
    let hasDecimal = false;

    while (this.position < this.expression.length) {
      const char = this.peek();
      if (isDigit(char)) {
        numStr += this.advance();
      } else if (char === '.' && !hasDecimal) {
        numStr += this.advance();
        hasDecimal = true;
      } else {
        break;
      }
    }

    const value = parseFloat(numStr);
    return {
      type: 'literal',
      value: isNaN(value) ? 0 : value,
    };
  }

  private parseIdentifier(): string {
    let ident = '';
    while (this.position < this.expression.length && isAlphanumeric(this.peek())) {
      ident += this.advance();
    }
    return ident;
  }

  private parseStringLiteral(): LiteralNode {
    const quoteChar = this.advance();
    let str = '';
    
    while (this.position < this.expression.length) {
      const char = this.peek();
      if (char === quoteChar) {
        this.advance();
        break;
      }
      if (char === '\\' && this.position + 1 < this.expression.length) {
        const nextChar = this.expression[this.position + 1];
        if (nextChar === '\\' || nextChar === quoteChar) {
          this.advance();
          str += this.advance();
          continue;
        }
      }
      str += this.advance();
    }
    
    return {
      type: 'literal',
      value: str,
    };
  }

  private parseFieldReference(): FieldReferenceNode {
    const fieldId = this.parseIdentifier();
    return {
      type: 'fieldReference',
      fieldId,
    };
  }

  private parseFunctionCall(functionName: string): FunctionCallNode {
    this.advance();
    const args: ExpressionNode[] = [];

    this.skipWhitespace();

    if (this.peek() !== ')') {
      while (true) {
        args.push(this.parseExpression());
        this.skipWhitespace();

        if (this.peek() === ')') {
          break;
        }

        if (this.peek() !== ',') {
          throw new Error(`Expected ',' or ')' in function call`);
        }
        this.advance();
        this.skipWhitespace();
      }
    }

    this.advance();

    return {
      type: 'functionCall',
      functionName,
      args,
    };
  }

  private parsePrimary(): ExpressionNode {
    this.skipWhitespace();

    if (this.position >= this.expression.length) {
      throw new Error('Unexpected end of expression');
    }

    const char = this.peek();

    if (char === '(') {
      this.advance();
      this.skipWhitespace();
      const expr = this.parseExpression();
      this.skipWhitespace();
      if (this.peek() !== ')') {
        throw new Error("Expected ')'");
      }
      this.advance();
      return expr;
    }

    if (char === '-' || char === '+') {
      const op = this.advance();
      this.skipWhitespace();
      const operand = this.parsePrimary();
      return {
        type: 'unaryOperation',
        operator: op === '-' ? '-' : '+',
        operand,
      } as UnaryOperationNode;
    }

    if (char === '!') {
      this.advance();
      this.skipWhitespace();
      const operand = this.parsePrimary();
      return {
        type: 'unaryOperation',
        operator: '!',
        operand,
      } as UnaryOperationNode;
    }

    if (char === '"' || char === "'") {
      return this.parseStringLiteral();
    }

    if (isDigit(char) || char === '.') {
      return this.parseNumber();
    }

    if (isLetter(char)) {
      const ident = this.parseIdentifier();
      this.skipWhitespace();

      if (ident === 'true') {
        return {
          type: 'literal',
          value: true,
        } as LiteralNode;
      }

      if (ident === 'false') {
        return {
          type: 'literal',
          value: false,
        } as LiteralNode;
      }

      if (this.peek() === '(') {
        return this.parseFunctionCall(ident);
      }

      return {
        type: 'fieldReference',
        fieldId: ident,
      } as FieldReferenceNode;
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  private parseBinaryOperation(
    left: ExpressionNode,
    minPrecedence: number
  ): ExpressionNode {
    const precedence: Record<string, number> = {
      '||': 1,
      '&&': 2,
      '==': 3,
      '!=': 3,
      '<': 4,
      '>': 4,
      '<=': 4,
      '>=': 4,
      '+': 5,
      '-': 5,
      '*': 6,
      '/': 6,
    };

    while (this.position < this.expression.length) {
      this.skipWhitespace();
      const op = this.peek();

      if (op === '=' && this.expression[this.position + 1] === '=') {
        const opPrecedence = precedence['=='];
        if (opPrecedence < minPrecedence) break;
        this.advance();
        this.advance();
        const right = this.parseBinaryOperation(this.parsePrimary(), opPrecedence + 1);
        left = {
          type: 'binaryOperation',
          operator: '==',
          left,
          right,
        } as BinaryOperationNode;
        continue;
      }

      if (op === '!' && this.expression[this.position + 1] === '=') {
        const opPrecedence = precedence['!='];
        if (opPrecedence < minPrecedence) break;
        this.advance();
        this.advance();
        const right = this.parseBinaryOperation(this.parsePrimary(), opPrecedence + 1);
        left = {
          type: 'binaryOperation',
          operator: '!=',
          left,
          right,
        } as BinaryOperationNode;
        continue;
      }

      if (op === '<' && this.expression[this.position + 1] === '=') {
        const opPrecedence = precedence['<='];
        if (opPrecedence < minPrecedence) break;
        this.advance();
        this.advance();
        const right = this.parseBinaryOperation(this.parsePrimary(), opPrecedence + 1);
        left = {
          type: 'binaryOperation',
          operator: '<=',
          left,
          right,
        } as BinaryOperationNode;
        continue;
      }

      if (op === '>' && this.expression[this.position + 1] === '=') {
        const opPrecedence = precedence['>='];
        if (opPrecedence < minPrecedence) break;
        this.advance();
        this.advance();
        const right = this.parseBinaryOperation(this.parsePrimary(), opPrecedence + 1);
        left = {
          type: 'binaryOperation',
          operator: '>=',
          left,
          right,
        } as BinaryOperationNode;
        continue;
      }

      if (op === '&' && this.expression[this.position + 1] === '&') {
        const opPrecedence = precedence['&&'];
        if (opPrecedence < minPrecedence) break;
        this.advance();
        this.advance();
        this.skipWhitespace();
        const right = this.parseBinaryOperation(this.parsePrimary(), opPrecedence + 1);
        left = {
          type: 'binaryOperation',
          operator: '&&' as BinaryOperator,
          left,
          right,
        } as BinaryOperationNode;
        continue;
      }

      if (op === '|' && this.expression[this.position + 1] === '|') {
        const opPrecedence = precedence['||'];
        if (opPrecedence < minPrecedence) break;
        this.advance();
        this.advance();
        this.skipWhitespace();
        const right = this.parseBinaryOperation(this.parsePrimary(), opPrecedence + 1);
        left = {
          type: 'binaryOperation',
          operator: '||' as BinaryOperator,
          left,
          right,
        } as BinaryOperationNode;
        continue;
      }

      const binaryOps: BinaryOperationNode['operator'][] = ['+', '-', '*', '/', '>', '<'];
      if (binaryOps.includes(op as BinaryOperationNode['operator'])) {
        const opPrecedence = precedence[op];
        if (opPrecedence < minPrecedence) break;
        this.advance();
        this.skipWhitespace();
        const right = this.parseBinaryOperation(this.parsePrimary(), opPrecedence + 1);
        left = {
          type: 'binaryOperation',
          operator: op as BinaryOperator,
          left,
          right,
        } as BinaryOperationNode;
        continue;
      }

      break;
    }

    return left;
  }

  parseExpression(): ExpressionNode {
    this.skipWhitespace();
    if (this.position >= this.expression.length) {
      throw new Error('Empty expression');
    }
    return this.parseBinaryOperation(this.parsePrimary(), 0);
  }

  parse(): ExpressionNode {
    const result = this.parseExpression();
    this.skipWhitespace();
    if (this.position < this.expression.length) {
      const remaining = this.expression.substring(this.position);
      if (remaining.match(/^[a-zA-Z_][a-zA-Z0-9_\s]*[+\-*/<>=&|!]$/) || 
          remaining.match(/^[a-zA-Z_][a-zA-Z0-9_\s]*\s*[+\-*/<>=&|!]\s*$/)) {
        throw new Error(`Unexpected character: ${this.peek()}`);
      }
    }
    return result;
  }
}

function evaluateNode(node: ExpressionNode, context: EvaluationContext): ExpressionValue {
  switch (node.type) {
    case 'literal': {
      const literalNode = node as LiteralNode;
      const value = literalNode.value;
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'string') {
        return value;
      }
      return parseFloat(String(value)) || 0;
    }

    case 'fieldReference': {
      const fieldNode = node as FieldReferenceNode;
      const value = resolveFieldReference(fieldNode.fieldId, context);
      return value;
    }

    case 'functionCall': {
      const funcNode = node as FunctionCallNode;
      const evaluatedArgs = funcNode.args.map(arg => {
        const val = evaluateNode(arg, context);
        if (typeof val === 'boolean') {
          return val ? 1 : 0;
        }
        return val;
      }) as (number | string | null)[];
      return callFunction(funcNode.functionName, evaluatedArgs, context);
    }

    case 'binaryOperation': {
      const binNode = node as BinaryOperationNode;
      const left = evaluateNode(binNode.left, context);
      const right = evaluateNode(binNode.right, context);

      const toNum = (v: ExpressionValue): number => {
        if (typeof v === 'number') return isNaN(v) ? 0 : v;
        if (v === null) return 0;
        if (typeof v === 'boolean') return v ? 1 : 0;
        if (typeof v === 'string') { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
        return 0;
      };
      const leftNum = toNum(left);
      const rightNum = toNum(right);
      const leftBool = typeof left === 'boolean' ? left : leftNum !== 0;
      const rightBool = typeof right === 'boolean' ? right : rightNum !== 0;

      switch (binNode.operator) {
        case '+':
          return leftNum + rightNum;
        case '-':
          return leftNum - rightNum;
        case '*':
          return leftNum * rightNum;
        case '/':
          if (rightNum === 0) {
            return Infinity;
          }
          return leftNum / rightNum;
        case '>':
          return leftNum > rightNum;
        case '<':
          return leftNum < rightNum;
        case '>=':
          return leftNum >= rightNum;
        case '<=':
          return leftNum <= rightNum;
        case '==':
          if (typeof left === 'string' && typeof right === 'string') {
            const result = left === right;
            return result;
          }
          if (typeof left === 'number' && typeof right === 'number') {
            const result = left === right;
            return result;
          }
          if (typeof left === 'boolean' && typeof right === 'boolean') {
            const result = left === right;
            return result;
          }
          const result = left === right;
          return result;
        case '!=':
          if (typeof left === 'string' && typeof right === 'string') {
            return left !== right;
          }
          if (typeof left === 'number' && typeof right === 'number') {
            return left !== right;
          }
          if (typeof left === 'boolean' && typeof right === 'boolean') {
            return left !== right;
          }
          return left !== right;
        case '&&':
          return leftBool && rightBool;
        case '||':
          return leftBool || rightBool;
        default:
          throw new Error(`Unknown operator: ${binNode.operator}`);
      }
    }

    case 'unaryOperation': {
      const unaryNode = node as UnaryOperationNode;
      const operand = evaluateNode(unaryNode.operand, context);
      const operandNum = typeof operand === 'number' ? operand : 0;
      const operandBool = typeof operand === 'boolean' ? operand : operandNum !== 0;

      switch (unaryNode.operator) {
        case '-':
          return -operandNum;
        case '+':
          return operandNum;
        case '!':
          return !operandBool;
        default:
          throw new Error(`Unknown unary operator: ${unaryNode.operator}`);
      }
    }

    default:
      throw new Error(`Unknown node type: ${(node as any).type}`);
  }
}

export function createExpressionEvaluator(): ExpressionEvaluator {
  function evaluate(expression: string, context: EvaluationContext): ExpressionValue {
    try {
      const parser = new Parser(expression);
      const ast = parser.parse();
      return evaluateNode(ast, context);
    } catch (error) {
      throw new Error(`Evaluation error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function parse(expression: string): ExpressionNode {
    try {
      const parser = new Parser(expression);
      return parser.parse();
    } catch (error) {
      throw new Error(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function validate(expression: string): ValidationResult {
    try {
      const parser = new Parser(expression);
      parser.parse();
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    evaluate,
    parse,
    validate,
  };
}
