import type { Question } from 'questionnaire-engine';
import TextQuestion from './TextQuestion';
import NumberQuestion from './NumberQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';

interface QuestionRendererProps {
  question: Question;
  value: string | number | undefined;
  error?: string;
  onChange: (value: string | number) => void;
}

function QuestionRenderer({ question, value, error, onChange }: QuestionRendererProps) {
  switch (question.type) {
    case 'text':
      return (
        <TextQuestion
          question={question}
          value={value}
          error={error}
          onChange={(val) => onChange(val)}
        />
      );
    case 'number':
      return (
        <NumberQuestion
          question={question}
          value={value}
          error={error}
          onChange={(val) => onChange(val)}
        />
      );
    case 'multiple-choice':
      return (
        <MultipleChoiceQuestion
          question={question}
          value={value}
          error={error}
          onChange={(val) => onChange(val)}
        />
      );
    default:
      return <div>Unknown question type: {(question as any).type}</div>;
  }
}

export default QuestionRenderer;
