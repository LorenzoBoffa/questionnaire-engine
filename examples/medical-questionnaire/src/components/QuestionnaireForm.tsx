import { useState, useEffect } from 'react';
import { type QuestionnaireEngine, type EngineState, type ScoreResult, type RawAnswer, type ScoringConfig } from 'questionnaire-engine';
import type { Question } from 'questionnaire-engine';
import QuestionRenderer from './QuestionRenderer';
import FormulaResults from './FormulaResults';
import ScoreResults from './ScoreResults';
import scoringConfigData from '../scoring-config.json';

interface QuestionnaireFormProps {
  engine: QuestionnaireEngine;
  state: EngineState;
}

function QuestionnaireForm({ engine, state }: QuestionnaireFormProps) {
  const [submittedAnswers, setSubmittedAnswers] = useState<RawAnswer[] | null>(null);
  const [scoreResults, setScoreResults] = useState<ScoreResult[] | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig | null>(null);
  const [scoringConfigError, setScoringConfigError] = useState<string | null>(null);

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

  useEffect(() => {
    try {
      setScoringConfig(scoringConfigData as ScoringConfig);
      setScoringConfigError(null);
    } catch (error) {
      console.error('Failed to load scoring config:', error);
      setScoringConfigError(`Failed to load scoring configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleAnswerChange = (questionId: string, value: string | number) => {
    engine.setAnswer(questionId, value);
    setSubmitError(null);
  };

  const handleSubmit = () => {
    try {
      const result = engine.submit();
      
      if (!result.isValid) {
        const errorMessages = result.errors?.map(e => e.message).join(', ') || 'Please fill all required fields';
        setSubmitError(`Validation failed: ${errorMessages}`);
        setSubmittedAnswers(null);
        setScoreResults(null);
        return;
      }

      setSubmittedAnswers(result.answers);
      setSubmitError(null);

      if (!scoringConfig) {
        setSubmitError('Scoring configuration not loaded. Please check the scoring-config.json file.');
        setScoreResults(null);
        return;
      }

      const answersMap: Record<string, string | number> = {};
      result.answers.forEach(answer => {
        answersMap[answer.questionId] = answer.value as string | number;
      });

      const scores = engine.calculateScore(scoringConfig, answersMap);
      setScoreResults(scores);
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(`Error submitting questionnaire: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSubmittedAnswers(null);
      setScoreResults(null);
    }
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
      
      <div className="submit-section">
        <button 
          className="submit-button" 
          onClick={handleSubmit}
        >
          Submit Questionnaire
        </button>
        
        {scoringConfigError && (
          <div className="submit-error">
            {scoringConfigError}
          </div>
        )}
        {submitError && (
          <div className="submit-error">
            {submitError}
          </div>
        )}
        
        {submittedAnswers && (
          <div className="submitted-answers">
            <h3>Submitted Answers</h3>
            <div className="answers-list">
              {submittedAnswers.map((answer) => (
                <div key={answer.questionId} className="answer-item">
                  <span className="answer-question-id">{answer.questionId}:</span>
                  <span className="answer-value">{String(answer.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {scoreResults && scoreResults.length > 0 && (
          <ScoreResults results={scoreResults} />
        )}
      </div>
    </div>
  );
}

export default QuestionnaireForm;
