import type { NumberQuestion } from 'questionnaire-engine';

interface NumberQuestionProps {
  question: NumberQuestion;
  value: string | number | undefined;
  error?: string;
  onChange: (value: number) => void;
}

function NumberQuestionComponent({ question, value, error, onChange }: NumberQuestionProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      onChange(null as any);
    } else {
      const numValue = Number(inputValue);
      if (!isNaN(numValue) && isFinite(numValue)) {
        onChange(numValue);
      }
    }
  };

  return (
    <div className="question">
      <label htmlFor={question.id} className="question-label">
        {question.label}
        {question.required && <span className="required">*</span>}
      </label>
      <input
        id={question.id}
        type="number"
        value={value === undefined ? '' : value}
        onChange={handleChange}
        min={question.min}
        max={question.max}
        step={question.step}
        className={`question-input ${error ? 'error' : ''}`}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default NumberQuestionComponent;
