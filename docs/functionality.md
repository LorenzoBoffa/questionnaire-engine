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
- `subscribe(callback)`: Subscribe to state changes
- `reset()`: Reset questionnaire state
- `destroy()`: Clean up resources
