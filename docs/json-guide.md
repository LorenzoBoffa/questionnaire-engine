# JSON Questionnaire Guide

## Structure

A questionnaire is defined as a JSON object with the following structure:

```json
{
  "id": "string",
  "title": "string",
  "sections": [...],
  "formulas": [...],
  "actions": [...]
}
```

## Sections

Sections group related questions together (can be used for pagination for example):

```json
{
  "id": "section-1",
  "title": "Section Title",
  "questions": [...]
}
```

### Optional: content with subtitles

You can use an optional `content` array instead of (or in addition to) `questions` to interleave **subtitle** blocks between questions. Each element of `content` is either a question object or a subtitle object. When `content` is present, the loader derives the section’s question list from it, so you can omit `questions`.

Subtitle object:

- `type` (string, required): Must be `"subtitle"`.
- `text` (string, required): The subtitle text shown in the UI.
- `id` (string, optional): Optional identifier for the subtitle.

Example section with a subtitle between questions:

```json
{
  "id": "section-1",
  "title": "Section Title",
  "content": [
    { "id": "q1", "type": "text", "label": "First question" },
    { "type": "subtitle", "text": "Part B" },
    { "id": "q2", "type": "number", "label": "Second question" }
  ]
}
```

When loaded, the section has both `questions` (the list of questions in order) and `content` (questions and subtitle items in order). The UI can render subtitles between questions. Sections that only use `questions` are unchanged.

## Questions

### Common Properties

All questions share these properties:
- `id` (string, required): Unique identifier
- `type` (string, required): Question type (`text`, `number`, `multiple-choice`, `multi-select`, `file`)
- `label` (string, required): Question text
- `required` (boolean, optional): Whether the question is required
- `visible` (boolean, optional): Initial visibility state (default: `true`)
- `validation` (array, optional): Array of validation rules
- `metadata` (object, optional): Arbitrary key-value data for the UI (e.g. icons, help text)

### Text Question

```json
{
  "id": "name",
  "type": "text",
  "label": "What is your name?",
  "required": true,
  "validation": [
    { "type": "minLength", "value": 2 },
    { "type": "maxLength", "value": 100 }
  ]
}
```

### Number Question

```json
{
  "id": "age",
  "type": "number",
  "label": "What is your age?",
  "required": true,
  "validation": [
    { "type": "min", "value": 18 },
    { "type": "max", "value": 120 }
  ]
}
```

### Multiple Choice Question

```json
{
  "id": "choice",
  "type": "multiple-choice",
  "label": "Select an option",
  "required": true,
  "options": ["Option A", "Option B", "Option C"]
}
```

### Multi-select Question

Allows selecting multiple options. The answer value is an array of selected option values.

You can specify min/max selections either in the `validation` array (recommended) or as direct properties (backward compatible):

```json
{
  "id": "symptoms",
  "type": "multi-select",
  "label": "Select any symptoms that apply",
  "required": true,
  "options": ["Headache", "Fever", "Cough", "Fatigue"],
  "validation": [
    { "type": "minSelections", "value": 1 },
    { "type": "maxSelections", "value": 3 }
  ]
}
```

Or using direct properties:

```json
{
  "id": "symptoms",
  "type": "multi-select",
  "label": "Select any symptoms that apply",
  "required": true,
  "options": ["Headache", "Fever", "Cough", "Fatigue"],
  "minSelections": 1,
  "maxSelections": 3
}
```

Properties:
- `options` (array, required): Same as multiple-choice: strings or `{ "value": "...", "label": "..." }`
- `defaultValue` (array of strings, optional): Pre-selected option values
- `minSelections` (number, optional): Minimum number of options that must be selected (use `validation` array preferred)
- `maxSelections` (number, optional): Maximum number of options that can be selected (use `validation` array preferred)

Use `engine.setAnswer(questionId, ['value1', 'value2'])` with an array of selected values.

### File Question

File questions support two use cases via `fileKind`:

- **`image`**: Image upload. Use when you need dimensions (width/height) validated. Set `allowedExtensions` for image types (e.g. `.jpg`, `.png`, `.webp`). Optional `minWidth`, `maxWidth`, `minHeight`, `maxHeight` (pixels) apply.
- **`document`**: Generic file upload. Use for documents (PDF, spreadsheets, text). Set `allowedExtensions` for document types (e.g. `.pdf`, `.xls`, `.xlsx`, `.csv`, `.md`, `.txt`). Dimension constraints are ignored.

Constraints can be specified in the `validation` array (recommended) or as direct properties (backward compatible).

**Image upload example (validation array):**

```json
{
  "id": "avatar",
  "type": "file",
  "label": "Upload your photo",
  "fileKind": "image",
  "validation": [
    { "type": "allowedExtensions", "value": [".jpg", ".jpeg", ".png", ".webp"] },
    { "type": "maxSizeBytes", "value": 5242880 },
    { "type": "minWidth", "value": 100 },
    { "type": "maxWidth", "value": 4000 },
    { "type": "minHeight", "value": 100 },
    { "type": "maxHeight", "value": 4000 }
  ],
  "required": true
}
```

**Document upload example (validation array):**

```json
{
  "id": "attachment",
  "type": "file",
  "label": "Upload a document (PDF, CSV, etc.)",
  "fileKind": "document",
  "validation": [
    { "type": "allowedExtensions", "value": [".pdf", ".xls", ".xlsx", ".csv", ".md", ".txt"] },
    { "type": "maxSizeBytes", "value": 10485760 }
  ],
  "required": false
}
```

Direct properties are also supported: `allowedExtensions`, `maxSizeBytes`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`.

Properties:
- `fileKind` (string, optional): `"image"` or `"document"`. If omitted and dimension constraints are set, treated as image.
- `allowedExtensions` (array of strings, optional): e.g. `[".pdf", ".jpg"]` (use `validation` array preferred)
- `maxSizeBytes` (number, optional): Maximum file size in bytes (use `validation` array preferred)
- `minWidth`, `maxWidth`, `minHeight`, `maxHeight` (number, optional): Pixel bounds; only applied when `fileKind` is `"image"` (use `validation` array preferred)

The UI must read the file, obtain metadata (name, size, type, and for images width/height), and call `setAnswer(questionId, metadata)`. The engine validates only that metadata.

## Validation Rules

Validation rules are defined in the `validation` array. Each rule has:
- `type` (string, required): Rule type
- `value` (number or array of strings, optional): Threshold value; for `allowedExtensions` use an array of strings (e.g. `[".pdf", ".jpg"]`)
- `message` (string, optional): Custom error message

### Available Rules

#### Required
```json
{ "type": "required" }
{ "type": "required", "message": "This field is mandatory" }
```

#### Min/Max (for numbers)
```json
{ "type": "min", "value": 18 }
{ "type": "max", "value": 100 }
{ "type": "min", "value": 18, "message": "Must be at least 18" }
```

#### MinLength/MaxLength (for strings)
```json
{ "type": "minLength", "value": 5 }
{ "type": "maxLength", "value": 20 }
{ "type": "minLength", "value": 5, "message": "Must be at least 5 characters" }
```

#### MinSelections/MaxSelections (for multi-select)
```json
{ "type": "minSelections", "value": 1 }
{ "type": "maxSelections", "value": 3 }
{ "type": "minSelections", "value": 2, "message": "Pick at least 2 options" }
```

#### File rules (for file questions)
```json
{ "type": "allowedExtensions", "value": [".pdf", ".jpg", ".png"] }
{ "type": "maxSizeBytes", "value": 10485760 }
{ "type": "minWidth", "value": 100 }
{ "type": "maxWidth", "value": 4000 }
{ "type": "minHeight", "value": 100 }
{ "type": "maxHeight", "value": 4000 }
```
Dimension rules apply when `fileKind` is `"image"`.

## Formulas

Formulas calculate values based on question answers and other formulas:

```json
{
  "id": "total",
  "expression": "sum(q1, q2, q3)"
}
```

### Expression Syntax

#### Field References
Reference other questions by their ID:
```
q1
question-id
age
```

#### Arithmetic Operations
```
q1 + q2
q1 - q2
q1 * q2
q1 / q2
(q1 + q2) * 2
```

#### Comparison Operators
```
q1 > 18
q1 < 100
q1 >= 18
q1 <= 100
q1 == 50
q1 != 0
```

#### String Comparisons
```
choice == "Yes"
name != ""
```

#### Logical Operators
```
q1 > 18 && q2 < 65
q1 == "Yes" || q2 == "Yes"
```

#### Built-in Functions

**sum(...)**
Sums numeric values from arguments:
```
sum(q1, q2, q3)
sum(q1, 10, q2, 5)
sum(formula-id, q4)
```

#### Literals
- Numbers: `123`, `45.67`
- Strings: `"text"`, `'text'`
- Booleans: `true`, `false`

#### Formula Dependencies
Formulas can reference other formulas by their ID:
```json
{
  "id": "sum-basic",
  "expression": "sum(q1, q2, q3)"
},
{
  "id": "double-sum",
  "expression": "sum-basic * 2"
}
```

## Actions

Actions control question visibility based on conditions:

### Show Action
Shows a question when condition is true:
```json
{
  "type": "show",
  "condition": "age >= 18",
  "target": "adult-question"
}
```

### Hide Action
Hides a question when condition is true:
```json
{
  "type": "hide",
  "condition": "age < 18",
  "target": "adult-question"
}
```

### Action Conditions

Conditions use the same expression syntax as formulas:

**Numeric comparisons:**
```json
{ "type": "show", "condition": "age >= 18", "target": "adult-question" }
{ "type": "show", "condition": "age >= 65", "target": "senior-question" }
```

**String comparisons:**
```json
{ "type": "show", "condition": "has-license == 'Yes'", "target": "license-number" }
{ "type": "hide", "condition": "has-license == 'No'", "target": "license-number" }
```

**Logical combinations:**
```json
{ "type": "show", "condition": "age >= 18 && has-license == 'Yes'", "target": "license-number" }
```

## Scoring Configuration

Scoring configuration is defined in a separate JSON file (`scoring-config.json`). This allows you to define scoring formulas that calculate scores based on question answers.

### Structure

```json
{
  "formulas": [
    {
      "id": "string",
      "parameterName": "string",
      "expression": "string",
      "resultType": "number" | "percentage" | "category" (optional)
    }
  ]
}
```

### Required Fields

- `formulas` (array, required): Array of scoring formulas
  - `id` (string, required): Unique identifier for the formula
  - `parameterName` (string, required): Name of the parameter that will hold the score result
  - `expression` (string, required): Expression to calculate the score (uses same syntax as formulas)

### Optional Fields

- `resultType` (string, optional): Type of result (`number`, `percentage`, or `category`). Defaults to `number`.

### Expression Syntax

Scoring formulas use the same expression syntax as regular formulas. You can:

- Reference question IDs: `q1`, `age`, `question-id`
- Reference other scoring formulas by their `id`: `baseScore`, `totalScore`
- Use arithmetic operations: `+`, `-`, `*`, `/`
- Use built-in functions: `sum(...)`
- Use parentheses for grouping: `(q1 + q2) * 2`

### Examples

#### Basic Scoring Formula

```json
{
  "formulas": [
    {
      "id": "total-score",
      "parameterName": "totalScore",
      "expression": "sum(q1, q2, q3)"
    }
  ]
}
```

#### Multiple Scoring Formulas

```json
{
  "formulas": [
    {
      "id": "basic-score",
      "parameterName": "basicScore",
      "expression": "sum(q1, q2, q3)"
    },
    {
      "id": "extended-score",
      "parameterName": "extendedScore",
      "expression": "sum(q4, q5)"
    },
    {
      "id": "total-score",
      "parameterName": "totalScore",
      "expression": "sum(basic-score, extended-score)"
    }
  ]
}
```

#### Scoring with Result Types

```json
{
  "formulas": [
    {
      "id": "numeric-score",
      "parameterName": "numericScore",
      "expression": "sum(q1, q2)",
      "resultType": "number"
    },
    {
      "id": "percentage-score",
      "parameterName": "percentageScore",
      "expression": "(sum(q1, q2) / 100) * 100",
      "resultType": "percentage"
    },
    {
      "id": "category-score",
      "parameterName": "categoryScore",
      "expression": "sum(q1, q2)",
      "resultType": "category"
    }
  ]
}
```

#### Complex Scoring with Dependencies

```json
{
  "formulas": [
    {
      "id": "base-score",
      "parameterName": "baseScore",
      "expression": "sum(q1, q2)"
    },
    {
      "id": "multiplied-score",
      "parameterName": "multipliedScore",
      "expression": "base-score * 2"
    },
    {
      "id": "final-score",
      "parameterName": "finalScore",
      "expression": "sum(multiplied-score, q3)"
    }
  ]
}
```

### Formula Dependencies

Scoring formulas can reference other scoring formulas by their `id`. The engine automatically resolves dependencies and evaluates formulas in the correct order using topological sorting.

### Integration with Questionnaire

1. Load your questionnaire JSON using `loadFromJSON()`
2. Load your scoring configuration JSON using `createScoringConfigLoader().loadFromString()` or `loadFromObject()`
3. After submitting the questionnaire, use `engine.calculateScore(scoringConfig)` to calculate scores

### Error Handling

- Missing `formulas` field: Validation error
- Missing required fields (`id`, `parameterName`, `expression`): Validation error
- Invalid `resultType`: Validation error (must be `number`, `percentage`, or `category`)
- Invalid expression syntax: Error returned in score result
- Missing referenced questions: Returns 0 for missing values
- Circular dependencies: Error returned in score result

## Complete Example

```json
{
  "id": "example-questionnaire",
  "title": "Example Questionnaire",
  "sections": [
    {
      "id": "section-1",
      "title": "Personal Information",
      "questions": [
        {
          "id": "age",
          "type": "number",
          "label": "What is your age?",
          "required": true,
          "validation": [
            { "type": "min", "value": 18 },
            { "type": "max", "value": 120 }
          ]
        },
        {
          "id": "adult-email",
          "type": "text",
          "label": "Email Address",
          "required": true,
          "visible": false,
          "validation": [
            { "type": "minLength", "value": 5 }
          ]
        },
        {
          "id": "num1",
          "type": "number",
          "label": "Number 1",
          "required": false
        },
        {
          "id": "num2",
          "type": "number",
          "label": "Number 2",
          "required": false
        }
      ]
    }
  ],
  "formulas": [
    {
      "id": "total",
      "expression": "sum(num1, num2)"
    }
  ],
  "actions": [
    {
      "type": "show",
      "condition": "age >= 18",
      "target": "adult-email"
    },
    {
      "type": "hide",
      "condition": "age < 18",
      "target": "adult-email"
    }
  ]
}
```
