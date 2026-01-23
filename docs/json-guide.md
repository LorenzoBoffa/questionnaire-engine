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

## Questions

### Common Properties

All questions share these properties:
- `id` (string, required): Unique identifier
- `type` (string, required): Question type (`text`, `number`, `multiple-choice`)
- `label` (string, required): Question text
- `required` (boolean, optional): Whether the question is required
- `visible` (boolean, optional): Initial visibility state (default: `true`)
- `validation` (array, optional): Array of validation rules

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

## Validation Rules

Validation rules are defined in the `validation` array. Each rule has:
- `type` (string, required): Rule type
- `value` (number, optional): Threshold value for min/max rules
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
