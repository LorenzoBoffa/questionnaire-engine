import { useEffect, useState } from 'react';
import { createQuestionnaireEngine, type QuestionnaireEngine, type EngineState } from 'questionnaire-engine';
import QuestionnaireForm from './components/QuestionnaireForm';
import questionnaireData from './questionnaire.json';
import './styles.css';

function App() {
  const [engine, setEngine] = useState<QuestionnaireEngine | null>(null);
  const [state, setState] = useState<EngineState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const questionnaireEngine = createQuestionnaireEngine();
    
    try {
      questionnaireEngine.loadFromJSON(questionnaireData);
      
      const unsubscribe = questionnaireEngine.subscribe((newState) => {
        console.log('State update received:', {
          errors: newState.errors,
          errorCount: newState.errors?.length || 0,
          answers: newState.answers
        });
        setState(newState);
      });
      
      const initialState = {
        questionnaire: questionnaireEngine.getQuestionnaire(),
        answers: questionnaireEngine.getAllAnswers(),
        progress: questionnaireEngine.getProgress(),
        errors: questionnaireEngine.getValidationErrors(),
        formulaResults: [],
      };
      setState(initialState);
      setEngine(questionnaireEngine);

      return () => {
        unsubscribe();
        questionnaireEngine.destroy();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questionnaire');
    }
  }, []);


  if (error) {
    return (
      <div className="app">
        <div className="error-container">
          <h1>Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!engine || !state) {
    return (
      <div className="app">
        <div className="loading">Loading questionnaire...</div>
      </div>
    );
  }


  return (
    <div className="app">
      <header className="app-header">
        <h1>{state.questionnaire?.title || 'Questionnaire'}</h1>
        {state.progress && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${state.progress.percentage}%` }}></div>
            <span className="progress-text">
              {state.progress.answered} of {state.progress.total} questions answered ({Math.round(state.progress.percentage)}%)
            </span>
          </div>
        )}
      </header>
      <main className="app-main">
        <QuestionnaireForm engine={engine} state={state} />
      </main>
    </div>
  );
}

export default App;
