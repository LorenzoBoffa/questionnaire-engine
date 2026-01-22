# Test Failures Summary - Implementation Fixes Needed

Based on the test suite, here are the issues that need to be fixed in the implementation:

## 1. Formula Evaluator Issues

### Field References
- **Issue**: Non-existent fields return `0` instead of `null`
- **Expected**: `evaluator.evaluate('nonexistent', context)` should return `null`
- **Location**: `src/formulas/evaluator.ts` - field reference evaluation

### Boolean Literals
- **Issue**: Boolean literals `true` and `false` are not supported
- **Expected**: `evaluator.evaluate('true && true', context)` should return `true`
- **Location**: `src/formulas/evaluator.ts` - parser needs to handle boolean literals

### Logical NOT Operator
- **Issue**: Unary `!` operator is not supported
- **Expected**: `evaluator.evaluate('!true', context)` should return `false`
- **Location**: `src/formulas/evaluator.ts` - parser needs to handle `!` operator

### Division by Zero
- **Issue**: Division by zero throws an error
- **Expected**: `evaluator.evaluate('10 / 0', context)` should return `Infinity`
- **Location**: `src/formulas/evaluator.ts` - binary operation evaluation

## 2. Action Engine Issues

### Action Registry Not Initialized
- **Issue**: `defaultActionRegistry.getHandler()` returns undefined
- **Expected**: Action registry should have show/hide handlers registered
- **Location**: `src/actions/index.ts` or `src/actions/engine.ts`
- **Tests Affected**: All action engine tests (7 failures)

## 3. Validation Issues

### Missing Question ID in Errors
- **Issue**: Validation errors have empty `questionId` instead of actual question ID
- **Expected**: `result.errors[0].questionId` should be `'q1'` not `''`
- **Location**: `src/validation/requiredValidator.ts` or validation engine
- **Tests Affected**: StateManager and QuestionnaireEngine validation tests

## 4. Formula Engine Issues

### Formula Dependencies
- **Issue**: Formulas with dependencies (referencing other formulas) don't work
- **Expected**: Formula `double` with expression `total * 2` should work when `total` is another formula
- **Location**: `src/formulas/engine.ts` - formula evaluation context

### Error Handling
- **Issue**: Formula errors don't have proper error messages
- **Expected**: `result.error` should be defined when formula fails
- **Location**: `src/formulas/engine.ts` - error handling in evaluateFormula

### Circular Dependency Detection
- **Issue**: Circular dependency detection throws error instead of handling gracefully
- **Expected**: Should handle circular dependencies without crashing
- **Location**: `src/formulas/engine.ts` - topological sort

## 5. Question Registry Test Issues

### Import Path
- **Issue**: Test cannot find `../../questions/registry` module
- **Expected**: Import should work correctly
- **Location**: `src/__tests__/questions/registry.test.ts`
- **Note**: May need to check actual export structure

## 6. State Manager Issues

### Action Execution
- **Issue**: Actions not executing properly in StateManager
- **Expected**: Questions should show/hide based on actions
- **Location**: `src/state/stateManager.ts` - action engine integration

## Summary of Fixes Needed

1. **Formula Evaluator** (4 fixes):
   - Return `null` for non-existent fields
   - Support boolean literals (`true`/`false`)
   - Support logical NOT operator (`!`)
   - Return `Infinity` for division by zero

2. **Action Engine** (1 fix):
   - Ensure `defaultActionRegistry` is properly initialized with handlers

3. **Validation** (1 fix):
   - Ensure question IDs are properly passed to validators

4. **Formula Engine** (3 fixes):
   - Fix formula dependency resolution
   - Improve error handling
   - Handle circular dependencies gracefully

5. **Test Setup** (1 fix):
   - Fix registry test import path

6. **State Manager** (1 fix):
   - Fix action execution integration

Total: **11 implementation fixes needed**
