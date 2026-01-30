import type { MultiSelectQuestion as MultiSelectQuestionType } from 'questionnaire-engine';

function getMinMaxSelections(question: MultiSelectQuestionType): { min: number | null; max: number | null } {
  const minRule = question.validation?.find((r) => (r.type as string) === 'minSelections');
  const maxRule = question.validation?.find((r) => (r.type as string) === 'maxSelections');
  const min =
    (minRule && typeof minRule.value === 'number' ? minRule.value : null) ?? question.minSelections ?? null;
  const max =
    (maxRule && typeof maxRule.value === 'number' ? maxRule.value : null) ?? question.maxSelections ?? null;
  return { min: min ?? null, max: max ?? null };
}

interface MultiSelectQuestionProps {
  question: MultiSelectQuestionType;
  value: string[] | undefined;
  error?: string;
  onChange: (value: string[]) => void;
}

function MultiSelectQuestionComponent({ question, value, error, onChange }: MultiSelectQuestionProps) {
  const selected = Array.isArray(value) ? value : [];
  const options = question.options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : { value: opt.value, label: opt.label ?? opt.value }
  );
  const { min: minSelections, max: maxSelections } = getMinMaxSelections(question);

  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...selected.filter((v) => v !== optionValue), optionValue]);
    } else {
      onChange(selected.filter((v) => v !== optionValue));
    }
  };

  return (
    <div className="question">
      <div className="question-label">
        {question.label}
        {question.required && <span className="required">*</span>}
      </div>
      {minSelections != null || maxSelections != null ? (
        <div className="question-hint">
          {minSelections != null && maxSelections != null
            ? `Select ${minSelections}–${maxSelections} options`
            : minSelections != null
              ? `Select at least ${minSelections}`
              : maxSelections != null
                ? `Select at most ${maxSelections}`
                : null}
        </div>
      ) : null}
      <div className="multiselect-options">
        {options.map((opt) => (
          <label key={opt.value} className="multiselect-option">
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={(e) => handleChange(opt.value, e.target.checked)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default MultiSelectQuestionComponent;
