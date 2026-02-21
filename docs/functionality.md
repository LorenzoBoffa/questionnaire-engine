# Questionnaire Engine - Functionality Overview

## Core Components

### Sections

Questionnaires are organized into **sections**. Each section has an `id`, a `title`, and a list of **questions**. Sections are used to group related questions and can drive pagination or step-based UIs.

Optionally, a section can use a **content** array instead of (or derived from) `questions`. Content allows you to interleave **subtitle** blocks between questions. Each content item is either a question object or a subtitle object (`{ "type": "subtitle", "text": "Your subtitle" }`). When `content` is present, the loader derives the section’s question list from it; the engine still operates on the flat question list. See the [JSON Guide](./json-guide.md#optional-content-with-subtitles) for the full schema and examples.

### Question Types
- **text**: Single-line text input
- **number**: Numeric input
- **multiple-choice**: Single selection from a list of options
- **multi-select**: Multiple selection from a list of options
- **file**: File upload (image or document) with optional type/size/dimension constraints

All questions support an optional **metadata** object (`Record<string, unknown>`) for passing additional info (e.g. icons, help text) to the UI layer.

### Validation Rules
- **required**: Ensures field has a value
- **min** / **max**: Minimum/maximum numeric value (numbers)
- **minLength** / **maxLength**: Minimum/maximum string length
- **minSelections** / **maxSelections**: Minimum/maximum number of selected options (multi-select)
- **allowedExtensions**: Allowed file extensions, e.g. `[".pdf", ".jpg"]` (file)
- **maxSizeBytes**: Maximum file size in bytes (file)
- **minWidth** / **maxWidth** / **minHeight** / **maxHeight**: Image dimension bounds in pixels (file, when `fileKind` is `"image"`)

Multi-select and file constraints can be specified in the `validation` array (recommended) or as direct question properties for backward compatibility.

### Formula Engine
- **Field References**: Access other question answers by ID (e.g., `q1`, `question-id`)
- **Arithmetic Operations**: `+`, `-`, `*`, `/`
- **Comparison Operators**: `>`, `<`, `>=`, `<=`, `==`, `!=`
- **Logical Operators**: `&&`, `||`
- **Unary Operations**: `-`, `+`, `!`
- **Built-in Functions**: `sum(...)` - sums numeric values from arguments; `log(x)` - natural logarithm of x
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
