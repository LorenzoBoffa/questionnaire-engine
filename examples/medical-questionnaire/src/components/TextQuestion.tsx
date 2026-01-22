import type { TextQuestion } from 'questionnaire-engine';

interface TextQuestionProps {
  question: TextQuestion;
  value: string | number | undefined;
  error?: string;
  onChange: (value: string) => void;
}

function TextQuestionComponent({ question, value, error, onChange }: TextQuestionProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="question">
      <label htmlFor={question.id} className="question-label">
        {question.label}
        {question.required && <span className="required">*</span>}
      </label>
      <input
        id={question.id}
        type="text"
        value={value as string || ''}
        onChange={handleChange}
        placeholder={question.placeholder}
        className={`question-input ${error ? 'error' : ''}`}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default TextQuestionComponent;
