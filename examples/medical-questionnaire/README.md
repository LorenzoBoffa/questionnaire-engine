# Medical Questionnaire Example

A comprehensive React application demonstrating the use of the `questionnaire-engine` package for building dynamic medical intake forms with advanced features like conditional logic, real-time validation, and formula calculations.

## Overview

This example showcases a fully-featured medical questionnaire that demonstrates the core capabilities of the questionnaire engine, including:

- **Multiple Question Types**: Text, number, and multiple-choice questions
- **Real-time Validation**: Field-level validation with custom error messages
- **Conditional Logic**: Dynamic show/hide actions based on user responses
- **Formula Calculations**: Computed values based on question answers
- **Progress Tracking**: Real-time completion percentage
- **Section-based Organization**: Questions grouped into logical sections

## Features Demonstrated

### Question Types
- **Text Questions**: Single-line text inputs with length validation
- **Number Questions**: Numeric inputs with min/max value constraints
- **Multiple Choice Questions**: Single-selection dropdowns

### Validation System
- Required field validation
- Minimum/maximum value constraints for numbers
- Minimum/maximum length constraints for text
- Combined validation rules
- Real-time error display

### Conditional Actions
- Show questions based on conditions (e.g., show adult questions when age ≥ 18)
- Hide questions based on conditions
- Complex logical conditions using `&&` and `||` operators
- String and numeric comparisons

### Formula Engine
- Arithmetic operations (`+`, `-`, `*`, `/`)
- Built-in functions (e.g., `sum()`)
- Formula dependencies (formulas referencing other formulas)
- Field references in expressions

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or pnpm package manager

### Installation

Install dependencies:

```bash
npm install
```

or

```bash
pnpm install
```

### Development

Start the development server:

```bash
npm run dev
```

or

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

### Preview

Preview the production build locally:

```bash
npm run preview
```

## Questionnaire Structure

The medical questionnaire is defined in `src/questionnaire.json` and includes comprehensive examples of:

### Sections

1. **Validation Test Section**: Demonstrates all validation types
   - Required fields
   - Min/max length for text
   - Min/max values for numbers
   - Combined validation rules

2. **Actions Test Section**: Shows conditional question visibility
   - Age-based conditional questions
   - Multiple choice-driven visibility
   - Complex logical conditions

3. **Combined Actions & Validation Section**: Advanced scenarios
   - Conditional questions with validation
   - Multiple dependent questions
   - Insurance and medical condition workflows

4. **Formulas Test Section**: Formula calculations
   - Basic arithmetic operations
   - Sum function with multiple arguments
   - Formula dependencies
   - Complex nested expressions

## Using the Engine

This example demonstrates the complete engine API:

### Initialization

```typescript
import { createQuestionnaireEngine } from 'questionnaire-engine';

const engine = createQuestionnaireEngine();
engine.loadFromJSON(questionnaireData);
```

### State Management

```typescript
engine.subscribe((state) => {
  // React to state changes
  setState(state);
});
```

### Working with Questions

```typescript
// Get all visible questions
const questions = engine.getCurrentQuestions();

// Set an answer
engine.setAnswer('question-id', 'value');

// Get an answer
const answer = engine.getAnswer('question-id');

// Get all answers
const allAnswers = engine.getAllAnswers();
```

### Validation

```typescript
// Validate all answers
engine.validate();

// Get validation errors
const errors = engine.getValidationErrors();
// Returns: { 'question-id': ['Error message'] }
```

### Progress Tracking

```typescript
const progress = engine.getProgress();
// Returns: { answered: 5, total: 10, percentage: 50 }
```

### Formula Results

```typescript
const formulaResults = engine.getFormulaResults();
// Returns: { 'formula-id': calculatedValue }
```

### Cleanup

```typescript
// Unsubscribe from updates
const unsubscribe = engine.subscribe(callback);
unsubscribe();

// Destroy the engine instance
engine.destroy();
```

## Documentation

For detailed information about the questionnaire engine, refer to the comprehensive documentation:

- **[Functionality Overview](../../docs/functionality.md)**: Complete guide to engine features, question types, validation rules, formulas, and actions
- **[JSON Guide](../../docs/json-guide.md)**: Detailed reference for creating questionnaire JSON structures, including examples for all question types, validation rules, formulas, and actions

### Quick Links

- [Question Types](../../docs/functionality.md#question-types)
- [Validation Rules](../../docs/functionality.md#validation-rules)
- [Formula Engine](../../docs/functionality.md#formula-engine)
- [Actions](../../docs/functionality.md#actions)
- [Engine API](../../docs/functionality.md#engine-api)
- [JSON Structure](../../docs/json-guide.md#structure)
- [Question Examples](../../docs/json-guide.md#questions)
- [Formula Syntax](../../docs/json-guide.md#formulas)

## Customization

To customize the questionnaire for your use case:

1. **Edit the JSON**: Modify `src/questionnaire.json` to add, remove, or change questions
2. **Customize Components**: Update React components in `src/components/` to change the UI
3. **Add Styling**: Modify `src/styles.css` to customize the appearance

### Supported Features

The engine supports extensive customization:

- **Question Types**: Text, number, multiple-choice (extensible to add more)
- **Validation Rules**: Required, min, max, minLength, maxLength
- **Conditional Actions**: Show/hide questions based on formula conditions
- **Formulas**: Arithmetic, comparisons, logical operations, built-in functions
- **Sections**: Organize questions into logical groups

For complete details on JSON structure and available options, see the [JSON Guide](../../docs/json-guide.md).

## Example Use Cases

This medical questionnaire example demonstrates real-world scenarios:

- **Patient Intake Forms**: Collect patient information with conditional follow-up questions
- **Medical History**: Conditional questions based on existing conditions
- **Insurance Verification**: Show/hide fields based on insurance type
- **Symptom Assessment**: Numeric scales with formula calculations
- **Progress Tracking**: Visual progress indicators for long forms

## Project Structure

```
medical-questionnaire/
├── src/
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # Application entry point
│   ├── questionnaire.json         # Questionnaire definition
│   ├── styles.css                 # Application styles
│   └── components/
│       ├── QuestionnaireForm.tsx  # Main form component
│       ├── QuestionRenderer.tsx   # Question type router
│       ├── TextQuestion.tsx      # Text input component
│       ├── NumberQuestion.tsx    # Number input component
│       ├── MultipleChoiceQuestion.tsx # Multiple choice component
│       └── FormulaResults.tsx    # Formula display component
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                # Vite build configuration
```

## Next Steps

- Explore the [functionality documentation](../../docs/functionality.md) to understand all engine capabilities
- Review the [JSON guide](../../docs/json-guide.md) to learn how to structure questionnaires
- Modify `src/questionnaire.json` to create your own questionnaire
- Extend the React components to match your design requirements
- Add custom validation rules or question types as needed
