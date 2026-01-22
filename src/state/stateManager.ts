import type { StateManager, StateManagerDependencies, StateChangeCallback, EngineState, Progress } from './types';
import type { Questionnaire, FormulaResult } from '../types/questionnaire';
import type { Question } from '../types/questions';
import type { AnswerValue } from '../types/answers';
import type { ValidationResult, ValidationError } from '../types/validation';
import type { BaseQuestion } from '../questions/base';
import { createAnswerStore } from './answerStore';
import { createQuestion, setQuestionVisible } from '../questions';
import { createActionEngine, defaultActionRegistry } from '../actions';
import { validateQuestion } from '../validation/engine';

export function createStateManager(
  dependencies: StateManagerDependencies
): StateManager {
  const { validationEngine, formulaEngine } = dependencies;
  const answerStore = createAnswerStore();
  let questionnaire: Questionnaire | null = null;
  const questionRegistry = new Map<string, BaseQuestion>();
  const subscribers = new Set<StateChangeCallback>();
  let validationResult: ValidationResult | null = null;
  let formulaResults: FormulaResult[] = [];

  function loadQuestionnaire(newQuestionnaire: Questionnaire): void {
    questionnaire = newQuestionnaire;
    questionRegistry.clear();
    
    function registerQuestions(questions: Question[]): void {
      for (const question of questions) {
        const baseQuestion = createQuestion(question);
        questionRegistry.set(question.id, baseQuestion);
      }
    }

    if (newQuestionnaire.sections) {
      for (const section of newQuestionnaire.sections) {
        if (section.questions) {
          registerQuestions(section.questions);
        }
      }
    }

    answerStore.clearAll();
    validationResult = null;
    formulaResults = [];

    const actionEngine = createActionEngine(
      formulaEngine,
      questionRegistry,
      defaultActionRegistry,
      (questionId: string, visible: boolean) => {
        const baseQuestion = questionRegistry.get(questionId);
        if (baseQuestion) {
          const updated = setQuestionVisible(baseQuestion, visible);
          questionRegistry.set(questionId, updated);
        }
      }
    );

    if (questionnaire.actions) {
      for (const action of questionnaire.actions) {
        actionEngine.registerAction(action);
      }
      actionEngine.executeAll(answerStore.getAllAnswers());
    }

    const questions = getCurrentQuestions();
    const answers = answerStore.getAllAnswers();
    validationResult = validationEngine.validateAll(questions, answers);

    notifySubscribers();
  }

  function setAnswer(questionId: string, value: AnswerValue): void {
    console.log('[StateManager.setAnswer] Question:', questionId, 'Value:', value, 'Type:', typeof value);
    answerStore.setAnswer(questionId, value);
    updateState(questionId);
  }

  function getAnswer(questionId: string): AnswerValue | undefined {
    return answerStore.getAnswer(questionId);
  }

  function getAllAnswers(): Record<string, AnswerValue> {
    return answerStore.getAllAnswers();
  }

  function getCurrentQuestions(): Question[] {
    const allQuestions = Array.from(questionRegistry.values());
    return allQuestions
      .filter(q => q.visible !== false)
      .map(q => q.serialize());
  }

  function getProgress(): Progress {
    const visibleQuestions = getCurrentQuestions();
    const total = visibleQuestions.length;
    const answered = visibleQuestions.filter(q => 
      answerStore.hasAnswer(q.id)
    ).length;
    const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

    return { total, answered, percentage };
  }

  function validate(): ValidationResult {
    const questions = getCurrentQuestions();
    const answers = answerStore.getAllAnswers();
    validationResult = validationEngine.validateAll(questions, answers);
    notifySubscribers();
    return validationResult;
  }

  function getValidationErrors(): ValidationError[] {
    return validationResult?.errors || [];
  }

  function reset(): void {
    if (questionnaire) {
      loadQuestionnaire(questionnaire);
    } else {
      answerStore.clearAll();
      validationResult = null;
      formulaResults = [];
      notifySubscribers();
    }
  }

  function subscribe(callback: StateChangeCallback): () => void {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  }

  function getState(): EngineState {
    return {
      questionnaire,
      answers: answerStore.getAllAnswers(),
      progress: getProgress(),
      errors: getValidationErrors(),
      formulaResults,
    };
  }

  function updateState(changedQuestionId?: string): void {
    console.log('[StateManager.updateState] Changed question:', changedQuestionId);
    if (questionnaire?.actions) {
      console.log('[StateManager.updateState] Actions count:', questionnaire.actions.length);
      const actionEngine = createActionEngine(
        formulaEngine,
        questionRegistry,
        defaultActionRegistry,
        (questionId: string, visible: boolean) => {
          console.log('[StateManager.updateState] Visibility change callback:', questionId, 'visible:', visible);
          const baseQuestion = questionRegistry.get(questionId);
          if (baseQuestion) {
            const updated = setQuestionVisible(baseQuestion, visible);
            questionRegistry.set(questionId, updated);
          }
        }
      );
      for (const action of questionnaire.actions) {
        console.log('[StateManager.updateState] Registering action:', action.type, 'Condition:', action.condition, 'Target:', action.target);
        actionEngine.registerAction(action);
      }
      const allAnswers = answerStore.getAllAnswers();
      console.log('[StateManager.updateState] All answers before executeAll:', JSON.stringify(allAnswers, null, 2));
      actionEngine.executeAll(allAnswers);
    }

    if (questionnaire?.formulas) {
      formulaResults = formulaEngine.evaluateAll(
        questionnaire.formulas,
        answerStore.getAllAnswers()
      );
    }

    if (changedQuestionId) {
      if (!validationResult) {
        validationResult = { isValid: true, errors: [] };
      }
      
      let question: Question | undefined;
      const baseQuestion = questionRegistry.get(changedQuestionId);
      if (baseQuestion) {
        question = baseQuestion.serialize();
      } else if (questionnaire) {
        for (const section of questionnaire.sections) {
          const found = section.questions.find(q => q.id === changedQuestionId);
          if (found) {
            question = found;
            break;
          }
        }
      }
      
      if (question) {
        const value = answerStore.getAnswer(changedQuestionId);
        const result = validateQuestion(question, value);
        
        const existingErrors = validationResult.errors.filter(e => e.questionId !== changedQuestionId);
        const newErrors = result.errors;
        const allErrors = [...existingErrors, ...newErrors];
        
        validationResult = {
          isValid: allErrors.length === 0,
          errors: allErrors,
        };
      }
    } else {
      const questions = getCurrentQuestions();
      const answers = answerStore.getAllAnswers();
      validationResult = validationEngine.validateAll(questions, answers);
    }

    notifySubscribers();
  }

  function notifySubscribers(): void {
    const state = getState();
    subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  function getQuestionRegistry(): Map<string, BaseQuestion> {
    return questionRegistry;
  }

  return {
    loadQuestionnaire,
    setAnswer,
    getAnswer,
    getAllAnswers,
    getCurrentQuestions,
    getProgress,
    validate,
    getValidationErrors,
    reset,
    subscribe,
    getState,
    getQuestionRegistry,
  };
}
