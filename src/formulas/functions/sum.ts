import type { FormulaFunction, EvaluationContext, ExpressionValue } from '../types';
import { resolveFieldReference } from '../utils';

export function createSumFunction(): FormulaFunction {
  return (args: (number | string | null)[], context: EvaluationContext): ExpressionValue => {
    let sum = 0;
    let hasValidValue = false;

    for (const arg of args) {
      let numValue: number | null = null;

      if (typeof arg === 'number') {
        numValue = arg;
        hasValidValue = true;
      } else if (typeof arg === 'string') {
        const parsed = parseFloat(arg);
        if (!isNaN(parsed)) {
          numValue = parsed;
          hasValidValue = true;
        } else {
          const fieldValue = resolveFieldReference(arg, context);
          if (fieldValue !== null) {
            numValue = fieldValue;
            hasValidValue = true;
          }
        }
      } else if (arg === null || arg === undefined) {
        continue;
      }

      if (numValue !== null) {
        sum += numValue;
      }
    }

    if (!hasValidValue) {
      return 0;
    }

    return sum;
  };
}
