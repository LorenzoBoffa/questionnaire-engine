# Questionnaire Engine - Functionality Overview

## Core Components

### Question Types
- **text**: Single-line text input
- **number**: Numeric input
- **multiple-choice**: Single selection from a list of options

### Validation Rules
- **required**: Ensures field has a value
- **min**: Minimum numeric value
- **max**: Maximum numeric value
- **minLength**: Minimum string length
- **maxLength**: Maximum string length

### Formula Engine
- **Field References**: Access other question answers by ID (e.g., `q1`, `question-id`)
- **Arithmetic Operations**: `+`, `-`, `*`, `/`
- **Comparison Operators**: `>`, `<`, `>=`, `<=`, `==`, `!=`
- **Logical Operators**: `&&`, `||`
- **Unary Operations**: `-`, `+`, `!`
- **Built-in Functions**: `sum(...)` - sums numeric values from arguments
- **Literals**: Numbers, strings (quoted), booleans (`true`, `false`)
- **Parentheses**: Grouping for precedence

### Actions
- **show**: Show a question when condition is true
- **hide**: Hide a question when condition is true
- Conditions use the formula engine for evaluation

### State Management
- Answer storage and retrieval
- Progress tracking (answered vs total questions)
- Real-time validation
- Formula result calculation
- Reactive state updates via subscription callbacks

### Scoring System

The scoring system allows you to calculate scores based on questionnaire answers using configurable formulas defined in a separate JSON file.

#### Overview

Scoring formulas are defined in a `scoring-config.json` file and can:
- Reference question answers by their ID
- Reference other scoring formulas by their ID
- Use arithmetic operations and built-in functions
- Support different result types (number, percentage, category)

#### How Scoring Formulas Work

1. **Formula Definition**: Each formula has:
   - `id`: Unique identifier
   - `parameterName`: Name for the calculated score
   - `expression`: Expression to calculate the score
   - `resultType` (optional): Type of result (`number`, `percentage`, `category`)

2. **Dependency Resolution**: Formulas can reference other formulas by their `id`. The engine automatically resolves dependencies using topological sorting to ensure formulas are evaluated in the correct order.

3. **Evaluation**: When `calculateScore()` is called:
   - Formulas are sorted by dependencies
   - Each formula is evaluated in order
   - Results are stored and can be referenced by subsequent formulas
   - Missing question references return 0
   - Errors are captured and returned in the result

#### Formula Dependencies and Evaluation Order

The scoring engine uses topological sorting to determine the correct evaluation order:

- If formula A references formula B, B is evaluated before A
- Independent formulas can be evaluated in any order
- Circular dependencies are detected and result in errors

Example:
```json
{
  "formulas": [
    { "id": "base", "parameterName": "baseScore", "expression": "sum(q1, q2)" },
    { "id": "doubled", "parameterName": "doubledScore", "expression": "base * 2" }
  ]
}
```

In this example, `base` is evaluated first, then `doubled` can use the result.

#### Result Types

- **number**: Standard numeric result (default)
- **percentage**: Percentage value (for display purposes)
- **category**: Categorical result (for classification)

The result type is informational and doesn't affect calculation - all formulas return numeric values.

#### Integration with Questionnaire Submission

1. Load questionnaire: `engine.loadFromJSON(questionnaireData)`
2. User fills out questionnaire
3. Submit questionnaire: `engine.submit()` - returns answers
4. Load scoring config: `scoringLoader.loadFromString(scoringConfigJson)`
5. Calculate scores: `engine.calculateScore(scoringConfig, answersMap)` - returns score results

#### Error Handling

- Invalid expressions: Error message included in result
- Missing questions: Returns 0 for missing values
- Circular dependencies: Error returned in result
- Invalid formula structure: Validation error during config load

### Engine API
- `loadFromJSON(questionnaire)`: Load questionnaire from JSON
- `getCurrentQuestions()`: Get visible questions
- `setAnswer(questionId, value)`: Set answer for a question
- `getAnswer(questionId)`: Get answer for a question
- `getAllAnswers()`: Get all answers
- `validate()`: Validate all answers
- `getValidationErrors()`: Get validation errors
- `getProgress()`: Get completion progress
- `getFormulaResults()`: Get calculated formula results
- `calculateScore(scoringConfig, answers?)`: Calculate scores from scoring configuration
- `submit()`: Submit questionnaire and return answers with validation
- `subscribe(callback)`: Subscribe to state changes
- `reset()`: Reset questionnaire state
- `destroy()`: Clean up resources

### Scoring API
- `createScoringConfigLoader()`: Create a loader for scoring configuration JSON
- `loader.loadFromString(jsonString)`: Load scoring config from JSON string
- `loader.loadFromObject(jsonObject)`: Load scoring config from parsed JSON object
- `loader.validateStructure(data)`: Validate scoring config structure
