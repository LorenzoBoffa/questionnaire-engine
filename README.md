# Questionnaire Engine

A headless, TypeScript-based questionnaire engine with extensible question types, validation, formulas, and conditional actions. Build dynamic forms and surveys with JSON configuration.

## Overview

The Questionnaire Engine is a flexible, framework-agnostic library that enables you to create sophisticated questionnaires and forms. It provides a complete runtime for managing question state, validation, calculations, and conditional logic—all configured through JSON.

### Key Features

- **Multiple Question Types**: Text, number, and multiple-choice questions (extensible)
- **Real-time Validation**: Field-level validation with customizable rules
- **Formula Engine**: Calculate values using arithmetic operations, comparisons, and built-in functions
- **Conditional Actions**: Show/hide questions dynamically based on user responses
- **Progress Tracking**: Monitor completion status in real-time
- **Reactive State**: Subscribe to state changes for seamless UI updates
- **Type-Safe**: Built with TypeScript for better developer experience
- **Headless**: Framework-agnostic core that works with any UI library

## Installation

```bash
npm install
```

or

```bash
pnpm install
```

## Quick Start

```typescript
import { createQuestionnaireEngine } from 'questionnaire-engine';

const engine = createQuestionnaireEngine();
engine.loadFromJSON(questionnaireData);

engine.subscribe((state) => {
  console.log('State updated:', state);
});

engine.setAnswer('question-id', 'value');
const errors = engine.getValidationErrors();
const progress = engine.getProgress();
```

## Documentation

- **[Functionality Overview](./docs/functionality.md)**: Complete guide to engine features, API, and capabilities
- **[JSON Guide](./docs/json-guide.md)**: Detailed reference for creating questionnaire JSON structures

## Examples

- **[Medical Questionnaire example](./examples/medical-questionnaire/)**: Comprehensive React example demonstrating validation, conditional logic, and formulas

## Development

### Prerequisites

- Node.js 18 or higher
- npm or pnpm

### Scripts

```bash
# Build the project
npm run build

# Watch mode for development
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Project Structure

```
src/
├── index.ts                    # Main exports
├── types/                      # Type definitions
├── engine/                     # Main engine implementation
├── questions/                  # Question type implementations
├── validation/                 # Validation system
├── formulas/                   # Formula engine and evaluator
├── actions/                    # Action system (show/hide)
├── state/                      # State management
└── utils/                      # Utility functions (JSON loader)

docs/
├── functionality.md            # Feature documentation
└── json-guide.md               # JSON structure reference

examples/
└── medical-questionnaire/      # React example application
```

## Core Concepts

### Question Types

Currently supported:
- **text**: Single-line text input
- **number**: Numeric input
- **multiple-choice**: Single selection from options

### Validation

Available validation rules:
- `required`: Ensures field has a value
- `min`/`max`: Numeric value constraints
- `minLength`/`maxLength`: String length constraints

### Formulas

The formula engine supports:
- Arithmetic operations (`+`, `-`, `*`, `/`)
- Comparison operators (`>`, `<`, `>=`, `<=`, `==`, `!=`)
- Logical operators (`&&`, `||`)
- Built-in functions (`sum()`)
- Field references to other questions

### Actions

Conditional actions:
- `show`: Display questions when conditions are met
- `hide`: Hide questions when conditions are met

## API Overview

The engine provides a clean, intuitive API:

- `loadFromJSON(questionnaire)`: Load questionnaire configuration
- `getCurrentQuestions()`: Get all visible questions
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

For detailed API documentation, see the [Functionality Guide](./docs/functionality.md).

## Future Development

The following features are planned for future releases:

### Additional Question Types
- **Date/Time**: Date picker and time input questions
- **Boolean**: Checkbox/toggle questions
- **Checkbox Group**: Multiple selection from options
- **File Upload**: File attachment questions
- **Rating Scale**: Numeric rating scales (e.g., 1-5 stars)
- **Matrix**: Grid-based questions (rows × columns)
- **Ranking**: Drag-and-drop ranking questions
- **Text Area**: Multi-line text input

### Enhanced Validation
- **Format Validation**: Email, phone, URL, regex patterns
- **Custom Validators**: User-defined validation functions
- **Cross-field Validation**: Validation rules referencing multiple fields
- **Async Validation**: Server-side validation support
- **Validation Timing**: Configurable validation triggers (on blur, on change, on submit)

### Extended Formula Engine
- **Additional Functions**: `avg()`, `min()`, `max()`, `count()`, `if()`
- **String Functions**: Concatenation, substring, formatting
- **Date Functions**: Date arithmetic and formatting
- **Array Operations**: Working with arrays and lists

### Advanced Actions
- **Transform Actions**: Modify answer values automatically
- **Navigation Actions**: Branch to different sections
- **External Actions**: API calls and data fetching
- **Scoring Actions**: Calculate weighted scores
- **Action Triggers**: Configurable trigger points (on answer, on submit, on load)

### Integration & Ecosystem
- **React Hooks**: Official React hooks library

Contributions and feature requests are welcome! Please open an issue or submit a pull request.

## License

MIT
