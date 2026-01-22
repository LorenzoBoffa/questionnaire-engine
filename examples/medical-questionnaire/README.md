# Medical Questionnaire Example

A simple React application demonstrating the use of the questionnaire-engine package for building medical intake forms.

## Features

- Load questionnaire from JSON
- Support for multiple question types (text, number, multiple-choice)
- Real-time validation
- Conditional question visibility (show/hide based on answers)
- Progress tracking
- Section-based organization

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. Install dependencies:

```bash
npm install
```

or

```bash
pnpm install
```

### Development

Run the development server:

```bash
npm run dev
```

or

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

### Preview

Preview the production build:

```bash
npm run preview
```

## Questionnaire Structure

The medical questionnaire is defined in `src/questionnaire.json` and includes:

- **Patient Information**: Name, age, gender
- **Medical History**: Existing conditions and medications (with conditional questions)
- **Symptoms Assessment**: Pain level, duration, severity

## Using the Engine

The app demonstrates how to:

1. Initialize the engine: `createQuestionnaireEngine()`
2. Load questionnaire: `engine.loadFromJSON(questionnaireData)`
3. Subscribe to state changes: `engine.subscribe(callback)`
4. Get visible questions: `engine.getCurrentQuestions()`
5. Set answers: `engine.setAnswer(questionId, value)`
6. Get validation errors: `engine.getValidationErrors()`
7. Get progress: `engine.getProgress()`

## Customization

To customize the questionnaire, edit `src/questionnaire.json`. The engine supports:

- Text questions with validation (min/max length)
- Number questions with validation (min/max values)
- Multiple choice questions
- Conditional actions (show/hide questions based on conditions)
- Required fields
- Custom validation rules
