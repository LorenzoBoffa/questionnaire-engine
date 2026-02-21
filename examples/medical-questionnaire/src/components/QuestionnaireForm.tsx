import { useState, useEffect } from 'react';
import type { Section, SectionContentItem, SubtitleItem } from 'questionnaire-engine';
import { type QuestionnaireEngine, type EngineState, type ScoreResult, type RawAnswer, type ScoringConfig, type AnswerValue } from 'questionnaire-engine';
import type { Question } from 'questionnaire-engine';

function isSubtitleItem(item: SectionContentItem): item is SubtitleItem {
  return typeof item === 'object' && item !== null && 'type' in item && (item as SubtitleItem).type === 'subtitle';
}
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
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [validatedSections, setValidatedSections] = useState<Set<string>>(new Set());
  const [sectionValidationErrors, setSectionValidationErrors] = useState<Map<string, typeof state.errors>>(new Map());

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

  const visibleSections = questionnaire.sections.filter(
    section => section.questions.some(q => visibleQuestionIds.has(q.id))
  );
  const currentSection: Section | undefined = visibleSections[currentSectionIndex];
  const isLastSection = currentSectionIndex >= visibleSections.length - 1;

  useEffect(() => {
    try {
      setScoringConfig(scoringConfigData as ScoringConfig);
      setScoringConfigError(null);
    } catch (error) {
      console.error('Failed to load scoring config:', error);
      setScoringConfigError(`Failed to load scoring configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    engine.setAnswer(questionId, value);
    setTouchedFields(prev => new Set(prev).add(questionId));
    setSubmitError(null);
  };

  const formatAnswerValue = (v: AnswerValue): string => {
    if (v == null) return '';
    if (Array.isArray(v)) return (v as string[]).join(', ');
    if (typeof v === 'object' && v !== null && 'name' in v && 'size' in v) {
      const f = v as { name: string; size: number };
      return `${f.name} (${(f.size / 1024).toFixed(1)} KB)`;
    }
    return String(v);
  };

  const handleNextSection = () => {
    if (!currentSection) return;
    setSubmitError(null);
    setValidatedSections(prev => new Set(prev).add(currentSection.id));
    const result = engine.validateSection(currentSection.id);
    
    if (!result.isValid) {
      setSectionValidationErrors(prev => {
        const newMap = new Map(prev);
        newMap.set(currentSection.id, result.errors);
        return newMap;
      });
      setSubmitError(result.errors?.map(e => e.message).join(', ') ?? 'Please fix the errors before continuing.');
      return;
    }
    
    setSectionValidationErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(currentSection.id);
      return newMap;
    });
    setCurrentSectionIndex(i => i + 1);
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
        const v = answer.value;
        if (typeof v === 'string' || typeof v === 'number') {
          answersMap[answer.questionId] = v;
        } else if (Array.isArray(v)) {
          answersMap[answer.questionId] = (v as string[]).length;
        }
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

  if (!currentSection) {
    return (
      <div className="questionnaire-form">
        <div className="submit-section">
          <button className="submit-button" onClick={handleSubmit}>
            Submit Questionnaire
          </button>
          {scoringConfigError && <div className="submit-error">{scoringConfigError}</div>}
          {submitError && <div className="submit-error">{submitError}</div>}
          {submittedAnswers && (
            <div className="submitted-answers">
              <h3>Submitted Answers</h3>
              <div className="answers-list">
                {submittedAnswers.map((answer) => (
                  <div key={answer.questionId} className="answer-item">
                    <span className="answer-question-id">{answer.questionId}:</span>
                    <span className="answer-value">{formatAnswerValue(answer.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {scoreResults && scoreResults.length > 0 && <ScoreResults results={scoreResults} />}
        </div>
      </div>
    );
  }

  const sectionQuestions = questionsBySection.get(currentSection.id) ?? [];
  const sectionItems: SectionContentItem[] = currentSection.content
    ? currentSection.content.filter(
        (item) => isSubtitleItem(item) || visibleQuestionIds.has((item as Question).id)
      )
    : sectionQuestions;

  const isFormulasSection = currentSection.id === 'formulas-test-section';
  const sectionFormulas = isFormulasSection && questionnaire.formulas ? questionnaire.formulas : [];
  const isSectionValidated = validatedSections.has(currentSection.id);
  const sectionErrors = sectionValidationErrors.get(currentSection.id) || [];
  const sectionErrorMap = new Map<string, typeof sectionErrors>();
  sectionErrors.forEach(err => {
    const existing = sectionErrorMap.get(err.questionId) || [];
    sectionErrorMap.set(err.questionId, [...existing, err]);
  });

  return (
    <div className="questionnaire-form">
      <div className="section-steps" aria-label="Progress">
        {visibleSections.map((section, idx) => (
          <span
            key={section.id}
            className={`section-step ${idx === currentSectionIndex ? 'active' : ''} ${idx < currentSectionIndex ? 'done' : ''}`}
          >
            {idx + 1}
          </span>
        ))}
      </div>
      <div key={currentSection.id} className="section">
        <h2 className="section-title">{currentSection.title}</h2>
        <div className="questions">
          {sectionItems.map((item, index) => {
            if (isSubtitleItem(item)) {
              return (
                <h3 key={`subtitle-${index}-${item.text.slice(0, 20)}`} className="section-subtitle">
                  {item.text}
                </h3>
              );
            }
            const question = item as Question;
            const touchedError = touchedFields.has(question.id) ? (errorMap.get(question.id) || []) : [];
            const sectionError = isSectionValidated ? (sectionErrorMap.get(question.id) || []) : [];
            const questionErrors = [...touchedError, ...sectionError];
            const uniqueErrors = Array.from(new Map(questionErrors.map(e => [e.rule + e.questionId, e])).values());
            const errorMessage = uniqueErrors.length > 0
              ? uniqueErrors.map(e => e.message).join(', ')
              : undefined;

            // Collect per-cell errors for tabular questions (synthetic IDs: questionId.rowId.colId)
            const cellPrefix = question.id + '.';
            const touchedCellErrors = touchedFields.has(question.id)
              ? errors.filter(e => e.questionId.startsWith(cellPrefix))
              : [];
            const sectionCellErrors = isSectionValidated
              ? sectionErrors.filter(e => e.questionId.startsWith(cellPrefix))
              : [];
            const allCellErrors = Array.from(
              new Map([...touchedCellErrors, ...sectionCellErrors].map(e => [e.questionId + e.rule, e])).values()
            );

            const currentAnswer = engine.getAnswer(question.id);
            const value: AnswerValue = currentAnswer === null ? undefined : currentAnswer;

            return (
              <div key={question.id} className="question-wrapper">
                <QuestionRenderer
                  question={question}
                  value={value}
                  error={errorMessage}
                  allErrors={allCellErrors.length > 0 ? allCellErrors : undefined}
                  onChange={(val) => handleAnswerChange(question.id, val)}
                />
              </div>
            );
          })}
        </div>
        {isFormulasSection && sectionFormulas.length > 0 && (
          <FormulaResults formulas={sectionFormulas} results={state.formulaResults || []} />
        )}
      </div>
      <div className="submit-section">
        <div className="section-nav">
          <button
            type="button"
            className="section-back"
            disabled={currentSectionIndex === 0}
            onClick={() => {
              setCurrentSectionIndex(i => i - 1);
              setSubmitError(null);
            }}
          >
            Back
          </button>
          {isLastSection ? (
            <button className="submit-button" onClick={handleSubmit}>
              Submit Questionnaire
            </button>
          ) : (
            <button type="button" className="section-next" onClick={handleNextSection}>
              Next
            </button>
          )}
        </div>
        {scoringConfigError && <div className="submit-error">{scoringConfigError}</div>}
        {submitError && <div className="submit-error">{submitError}</div>}
        {submittedAnswers && (
          <div className="submitted-answers">
            <h3>Submitted Answers</h3>
            <div className="answers-list">
              {submittedAnswers.map((answer) => (
                <div key={answer.questionId} className="answer-item">
                  <span className="answer-question-id">{answer.questionId}:</span>
                  <span className="answer-value">{formatAnswerValue(answer.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {scoreResults && scoreResults.length > 0 && <ScoreResults results={scoreResults} />}
      </div>
    </div>
  );
}

export default QuestionnaireForm;
