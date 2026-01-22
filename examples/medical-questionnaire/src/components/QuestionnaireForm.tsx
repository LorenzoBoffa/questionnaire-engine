import { type QuestionnaireEngine, type EngineState } from 'questionnaire-engine';
import type { Question } from 'questionnaire-engine';
import QuestionRenderer from './QuestionRenderer';
import FormulaResults from './FormulaResults';

interface QuestionnaireFormProps {
  engine: QuestionnaireEngine;
  state: EngineState;
}

function QuestionnaireForm({ engine, state }: QuestionnaireFormProps) {
  const questionnaire = state.questionnaire;
  if (!questionnaire) {
    return <div>No questionnaire loaded</div>;
  }

  const visibleQuestions = engine.getCurrentQuestions();
  const visibleQuestionIds = new Set(visibleQuestions.map(q => q.id));
  const errors = state.errors || [];
  const errorMap = new Map<string, typeof errors>();
  errors.forEach(err => {
    const existing = errorMap.get(err.questionId) || [];
    errorMap.set(err.questionId, [...existing, err]);
  });

  const questionsBySection = new Map<string, Question[]>();
  
  for (const section of questionnaire.sections) {
    const sectionQuestions = section.questions.filter(q => visibleQuestionIds.has(q.id));
    if (sectionQuestions.length > 0) {
      questionsBySection.set(section.id, sectionQuestions);
    }
  }

  const handleAnswerChange = (questionId: string, value: string | number) => {
    engine.setAnswer(questionId, value);
  };

  return (
    <div className="questionnaire-form">
      {questionnaire.sections.map((section) => {
        const sectionQuestions = questionsBySection.get(section.id);
        if (!sectionQuestions || sectionQuestions.length === 0) {
          return null;
        }

        const isFormulasSection = section.id === 'formulas-test-section';
        const sectionFormulas = isFormulasSection && questionnaire.formulas 
          ? questionnaire.formulas 
          : [];

        return (
          <div key={section.id} className="section">
            <h2 className="section-title">{section.title}</h2>
            <div className="questions">
              {sectionQuestions.map((question) => {
                const questionErrors = errorMap.get(question.id) || [];
                const errorMessage = questionErrors.length > 0 
                  ? questionErrors.map(e => e.message).join(', ')
                  : undefined;
                const currentAnswer = engine.getAnswer(question.id);
                const value: string | number | undefined = currentAnswer === null ? undefined : currentAnswer;

                return (
                  <div key={question.id} className="question-wrapper">
                    <QuestionRenderer
                      question={question}
                      value={value}
                      error={errorMessage}
                      onChange={(value) => handleAnswerChange(question.id, value)}
                    />
                  </div>
                );
              })}
            </div>
            {isFormulasSection && sectionFormulas.length > 0 && (
              <FormulaResults 
                formulas={sectionFormulas} 
                results={state.formulaResults || []} 
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default QuestionnaireForm;
