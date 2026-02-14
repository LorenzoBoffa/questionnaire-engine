# How File Questions Are Shown in the Example

This document describes how file questions are defined, routed, and rendered in the medical questionnaire example.

## 1. Definition in JSON

File questions are declared in `questionnaire.json` under a section’s `questions` array. Each has `type: "file"` and optional `fileKind`, `validation`, and `required`.

Example from the **Multi-select & File Test Section**:

**Photo (image):**

```json
{
  "id": "photo",
  "type": "file",
  "label": "Upload a photo (image, optional)",
  "fileKind": "image",
  "validation": [
    { "type": "allowedExtensions", "value": [".jpg", ".jpeg", ".png", ".webp"] },
    { "type": "maxSizeBytes", "value": 5242880 },
    { "type": "minWidth", "value": 50 },
    { "type": "maxWidth", "value": 4000 },
    { "type": "minHeight", "value": 50 },
    { "type": "maxHeight", "value": 4000 }
  ],
  "required": false
}
```

**Document:**

```json
{
  "id": "document",
  "type": "file",
  "label": "Upload a document (PDF, CSV, TXT, etc.)",
  "fileKind": "document",
  "validation": [
    { "type": "allowedExtensions", "value": [".pdf", ".csv", ".txt", ".md"] },
    { "type": "maxSizeBytes", "value": 10485760 }
  ],
  "required": false
}
```

Supported file-question fields (from the engine types):

- `id`, `label`, `required`
- `fileKind`: `"image"` or `"document"`
- `allowedExtensions`: e.g. `[".jpg", ".pdf"]`
- `maxSizeBytes`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`
- `validation`: array of rules (allowedExtensions, maxSizeBytes, minWidth, maxWidth, minHeight, maxHeight)

---

## 2. Flow From Form to File Component

1. **QuestionnaireForm** (`QuestionnaireForm.tsx`) gets the loaded questionnaire and visible questions from the engine. For each section it maps over `sectionQuestions` (only questions that are currently visible).

2. For each question it:
   - Reads the current answer with `engine.getAnswer(question.id)`
   - Resolves errors from `state.errors` by `questionId`
   - Renders a **QuestionRenderer** with `question`, `value`, `error`, and `onChange` that calls `engine.setAnswer(question.id, value)`

3. **QuestionRenderer** (`QuestionRenderer.tsx`) switches on `question.type`. For `"file"` it renders **FileQuestion** and passes:
   - `question` (typed as file question)
   - `value`: normalized to `FileAnswerValue | undefined` (object with `name`, `size`, `type`, and optional `width`/`height`)
   - `error` and `onChange`

So: **Form → QuestionRenderer (switch on type) → FileQuestion** when the question type is `file`.

---

## 3. FileQuestion Component

**FileQuestion** (`FileQuestion.tsx`) is the UI for a single file question.

### Props

- `question`: engine `FileQuestion` (id, label, required, fileKind, validation, etc.)
- `value`: `FileAnswerValue | undefined` (current file metadata)
- `error`: optional validation message
- `onChange`: `(value: FileAnswerValue | null) => void`

### Helper Logic

- **Allowed extensions**: Taken from a validation rule `allowedExtensions` or from `question.allowedExtensions`, then normalized (e.g. leading dot, lower case).
- **Accept attribute**: A comma-separated list of MIME types (and/or extensions) for the native file input, derived from allowed extensions via a small MIME map (e.g. `.jpg` → `image/jpeg`, `.pdf` → `application/pdf`).
- **Dimension bounds**: Min/max width and height are read from validation rules (`minWidth`, `maxWidth`, `minHeight`, `maxHeight`) or from the question’s own properties.
- **Image vs document**: The component treats the question as “image” if `fileKind === 'image'` or if it’s not `'document'` and there are any dimension rules. For images, it can load the file and append `width` and `height` to the answer.

### Behavior

1. **File input**: A single `<input type="file" />` with `accept` set from allowed extensions. On change, the selected file is read and passed to `handleFile`.
2. **Building the answer**: For every file, a base `FileAnswerValue` is created with `name`, `size`, and `type`. If the question is treated as image and the file’s type is `image/*`, the component creates an `Image`, loads the file via an object URL, and on load adds `width` and `height` (natural dimensions) to the value, then calls `onChange` with that object. For non-images or on image load error, it calls `onChange` with the base value only.
3. **Clear**: A “Clear” button sets the answer to `null` and resets the input’s value so the same file can be chosen again.
4. **Display**: When `value` is set, it shows the file name, size in KB, and optional dimensions (e.g. `200×200px`) plus the Clear button. Validation errors are shown below the controls with an `id` used for `aria-describedby` when there is an error.

### Hint Text

- `fileKind === 'image'`: “Image (e.g. JPG, PNG). Dimensions will be validated.”
- `fileKind === 'document'`: “Document (e.g. PDF, CSV, TXT).”
- Otherwise: “Any file.”

### Layout and Styling

- Wrapper: `question`; label (with optional `*` for required), then hint, then `file-question-controls`.
- Inside controls: the file input and, when there is a value, a `file-value` block with `file-name`, `file-meta`, and `file-clear` button.
- CSS in `styles.css`: `.file-question-controls`, `.file-input`, `.file-value`, `.file-name`, `.file-meta`, `.file-clear` (and `.file-clear:hover`). The input gets `question-input file-input` and an `error` class when `error` is passed.

---

## 4. Answer Shape and Validation

- **FileAnswerValue**: `{ name: string; size: number; type: string; width?: number; height?: number }`. The engine and validation use this shape; the UI only sends this metadata (not the actual `File` object).
- Validation (allowed extensions, max size, dimensions) is performed by the questionnaire-engine (e.g. file validator). The example only displays the `error` string it receives from the engine state.

---

## 5. Summary

| Step | Where | What happens |
|------|--------|----------------|
| Definition | `questionnaire.json` | File questions use `type: "file"`, optional `fileKind`, `validation`, `required`. |
| Visibility | QuestionnaireForm | Only questions returned by `engine.getCurrentQuestions()` are rendered. |
| Routing | QuestionRenderer | `question.type === 'file'` → render `FileQuestion` with normalized `value` and `onChange`. |
| UI | FileQuestion.tsx | Native file input, optional image dimensions, display of name/size/dimensions, Clear, and error message. |
| State | QuestionnaireForm | `onChange` calls `engine.setAnswer(questionId, value)`; value is a `FileAnswerValue` or cleared with `null`. |

File questions in the example are therefore “shown” by: (1) being defined in JSON, (2) being included in the visible question list by the engine, (3) being dispatched to `FileQuestion` by `QuestionRenderer`, and (4) being rendered by `FileQuestion` as a file input plus optional preview metadata and clear button.
