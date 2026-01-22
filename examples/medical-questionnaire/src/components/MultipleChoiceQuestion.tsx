import type { MultipleChoiceQuestion } from 'questionnaire-engine';

interface MultipleChoiceQuestionProps {
  question: MultipleChoiceQuestion;
  value: string | number | undefined;
  error?: string;
  onChange: (value: string) => void;
}

function MultipleChoiceQuestionComponent({ question, value, error, onChange }: MultipleChoiceQuestionProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="question">
      <label htmlFor={question.id} className="question-label">
        {question.label}
        {question.required && <span className="required">*</span>}
      </label>
      <select
        id={question.id}
        value={value as string || ''}
        onChange={handleChange}
        className={`question-input ${error ? 'error' : ''}`}
      >
        <option value="">Select an option...</option>
        {question.options.map((option) => {
          const optionValue = typeof option === 'string' ? option : (option as { value: string; label: string }).value;
          const optionLabel = typeof option === 'string' ? option : (option as { value: string; label: string }).label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default MultipleChoiceQuestionComponent;
