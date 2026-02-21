import type { Question, AnswerValue, FileAnswerValue, TabularAnswerValue, TabularQuestion, ValidationError } from 'questionnaire-engine';
import TextQuestion from './TextQuestion';
import NumberQuestion from './NumberQuestion';
import MultipleChoiceQuestion from './MultipleChoiceQuestion';
import MultiSelectQuestion from './MultiSelectQuestion';
import FileQuestion from './FileQuestion';
import TabularQuestionComponent from './TabularQuestion';

interface QuestionRendererProps {
  question: Question;
  value: AnswerValue;
  error?: string;
  allErrors?: ValidationError[];
  onChange: (value: AnswerValue) => void;
}

function QuestionRenderer({ question, value, error, allErrors, onChange }: QuestionRendererProps) {
  switch (question.type) {
    case 'text':
      return (
        <TextQuestion
          question={question}
          value={value as string | undefined}
          error={error}
          onChange={(val) => onChange(val)}
        />
      );
    case 'number':
      return (
        <NumberQuestion
          question={question}
          value={value as number | undefined}
          error={error}
          onChange={(val) => onChange(val)}
        />
      );
    case 'multiple-choice':
      return (
        <MultipleChoiceQuestion
          question={question}
          value={value as string | number | undefined}
          error={error}
          onChange={(val) => onChange(val)}
        />
      );
    case 'multi-select':
      return (
        <MultiSelectQuestion
          question={question}
          value={Array.isArray(value) ? value : undefined}
          error={error}
          onChange={(val) => onChange(val)}
        />
      );
    case 'file':
      return (
        <FileQuestion
          question={question}
          value={value != null && typeof value === 'object' && !Array.isArray(value) ? (value as FileAnswerValue) : undefined}
          error={error}
          onChange={(val) => onChange(val ?? undefined)}
        />
      );
    case 'tabular':
      return (
        <TabularQuestionComponent
          question={question as TabularQuestion}
          value={value != null && typeof value === 'object' && !Array.isArray(value) ? (value as TabularAnswerValue) : undefined}
          error={error}
          allErrors={allErrors}
          onChange={(val) => onChange(val)}
        />
      );
    default:
      return <div>Unknown question type: {(question as Question & { type: string }).type}</div>;
  }
}

export default QuestionRenderer;
