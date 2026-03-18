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
  const sectionVisibility = new Map<string, boolean>();
  const questionToSection = new Map<string, string>();
  const subscribers = new Set<StateChangeCallback>();
  let validationResult: ValidationResult | null = null;
  let formulaResults: FormulaResult[] = [];

  function loadQuestionnaire(newQuestionnaire: Questionnaire): void {
    questionnaire = newQuestionnaire;
    questionRegistry.clear();
    sectionVisibility.clear();
    questionToSection.clear();

    function registerQuestions(questions: Question[]): void {
      for (const question of questions) {
        const baseQuestion = createQuestion(question);
        questionRegistry.set(question.id, baseQuestion);
      }
    }

    if (newQuestionnaire.sections) {
      for (const section of newQuestionnaire.sections) {
        sectionVisibility.set(section.id, true);
        if (section.questions) {
          registerQuestions(section.questions);
          for (const q of section.questions) {
            questionToSection.set(q.id, section.id);
          }
        }
      }
    }

    answerStore.clearAll();
    validationResult = { isValid: true, errors: [] };
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
      },
      sectionVisibility,
      (sectionId: string, visible: boolean) => {
        sectionVisibility.set(sectionId, visible);
      }
    );

    if (questionnaire.actions) {
      for (const action of questionnaire.actions) {
        actionEngine.registerAction(action);
      }
      const allAnswers = answerStore.getAllAnswers();
      const formulaResultsMap = Object.fromEntries(
        formulaResults.map(r => [r.formulaId, r.value])
      );
      actionEngine.executeAll(allAnswers, formulaResultsMap);
    }

    notifySubscribers();
  }

  function getVisibleQuestionsForSection(sectionId: string): Question[] {
    if (!questionnaire) return [];
    const section = questionnaire.sections.find(s => s.id === sectionId);
    if (!section) return [];
    const sectionQuestionIds = new Set(section.questions.map(q => q.id));
    const visibleQuestions = getCurrentQuestions();
    return visibleQuestions.filter(q => sectionQuestionIds.has(q.id));
  }

  function validateSection(sectionId: string): ValidationResult {
    const questions = getVisibleQuestionsForSection(sectionId);
    const answers = answerStore.getAllAnswers();
    const sectionResult = validationEngine.validateAll(questions, answers);
    const sectionQuestionIds = new Set(questions.map(q => q.id));
    const current = validationResult ?? { isValid: true, errors: [] };
    const otherErrors = current.errors.filter(e => !sectionQuestionIds.has(e.questionId));
    const allErrors = [...otherErrors, ...sectionResult.errors];
    validationResult = {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
    notifySubscribers();
    return sectionResult;
  }

  function setAnswer(questionId: string, value: AnswerValue): void {
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
      .filter(q => {
        if (q.visible === false) return false;
        const sid = questionToSection.get(q.id);
        if (sid !== undefined && sectionVisibility.get(sid) === false) return false;
        return true;
      })
      .map(q => q.serialize());
  }

  function executeActionsIfNeeded(): void {
    if (questionnaire?.actions) {
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
        },
        sectionVisibility,
        (sectionId: string, visible: boolean) => {
          sectionVisibility.set(sectionId, visible);
        }
      );
      for (const action of questionnaire.actions) {
        actionEngine.registerAction(action);
      }
      const allAnswers = answerStore.getAllAnswers();
      const formulaResultsMap = Object.fromEntries(
        formulaResults.map(r => [r.formulaId, r.value])
      );
      actionEngine.executeAll(allAnswers, formulaResultsMap);
    }
  }

  function getProgress(): Progress {
    executeActionsIfNeeded();
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
      sectionVisibility: Object.fromEntries(sectionVisibility),
    };
  }

  function updateState(changedQuestionId?: string): void {
    if (questionnaire?.formulas) {
      formulaResults = formulaEngine.evaluateAll(
        questionnaire.formulas,
        answerStore.getAllAnswers()
      );
    }

    if (questionnaire?.actions) {
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
        },
        sectionVisibility,
        (sectionId: string, visible: boolean) => {
          sectionVisibility.set(sectionId, visible);
        }
      );
      for (const action of questionnaire.actions) {
        actionEngine.registerAction(action);
      }
      const allAnswers = answerStore.getAllAnswers();
      const formulaResultsMap = Object.fromEntries(
        formulaResults.map(r => [r.formulaId, r.value])
      );
      actionEngine.executeAll(allAnswers, formulaResultsMap);
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
    validateSection,
    getValidationErrors,
    reset,
    subscribe,
    getState,
    getQuestionRegistry,
  };
}
