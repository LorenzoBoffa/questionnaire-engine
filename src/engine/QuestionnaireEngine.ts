import type { QuestionnaireEngine } from './types';
import type { Questionnaire, Section, FormulaResult } from '../types/questionnaire';
import type { Question } from '../types/questions';
import type { AnswerValue, AnswerStore } from '../types/answers';
import type { ValidationResult, ValidationError } from '../types/validation';
import type { Progress, EngineState, StateManager } from '../state/types';
import type { FormulaEngine } from '../formulas/types';
import type { ActionEngine } from '../actions/types';
import type { BaseQuestion } from '../questions/base';

import { NotInitializedError, QuestionNotFoundError, InvalidQuestionnaireError } from './types';
import { createFormulaEngine } from '../formulas';
import { validateAll } from '../validation';
import { createActionEngine, defaultActionRegistry } from '../actions';
import { createStateManager } from '../state';
import { createQuestion, setQuestionVisible, isQuestionVisible } from '../questions';
import { createJSONLoader } from '../utils/json-loader';

function validateQuestionnaireStructure(questionnaire: Questionnaire): void {
  if (!questionnaire.id) {
    throw new InvalidQuestionnaireError('Questionnaire must have an id');
  }
  if (!questionnaire.title) {
    throw new InvalidQuestionnaireError('Questionnaire must have a title');
  }
  if (!questionnaire.sections || !Array.isArray(questionnaire.sections)) {
    throw new InvalidQuestionnaireError('Questionnaire must have a sections array');
  }
  if (questionnaire.sections.length === 0) {
    throw new InvalidQuestionnaireError('Questionnaire must have at least one section');
  }

  const questionIds = new Set<string>();

  for (const section of questionnaire.sections) {
    if (!section.id) {
      throw new InvalidQuestionnaireError('Section must have an id');
    }
    if (!section.title) {
      throw new InvalidQuestionnaireError('Section must have a title');
    }
    if (!section.questions || !Array.isArray(section.questions)) {
      throw new InvalidQuestionnaireError('Section must have a questions array');
    }
    if (section.questions.length === 0) {
      throw new InvalidQuestionnaireError('Section must have at least one question');
    }

    for (const question of section.questions) {
      if (!question.id) {
        throw new InvalidQuestionnaireError('Question must have an id');
      }
      if (questionIds.has(question.id)) {
        throw new InvalidQuestionnaireError(`Duplicate question ID found: ${question.id}`);
      }
      questionIds.add(question.id);
      if (!question.type) {
        throw new InvalidQuestionnaireError('Question must have a type');
      }
      if (!question.label) {
        throw new InvalidQuestionnaireError('Question must have a label');
      }
    }
  }
}

export function createQuestionnaireEngine(): QuestionnaireEngine {
  const formulaEngine = createFormulaEngine();
  const jsonLoader = createJSONLoader();
  let stateManager: StateManager | null = null;
  let questionnaire: Questionnaire | null = null;
  let actionEngine: ActionEngine | null = null;
  let questionRegistry: Map<string, BaseQuestion> | null = null;
  let isInitialized = false;

  function ensureInitialized(): void {
    if (!isInitialized || !stateManager) {
      throw new NotInitializedError();
    }
  }

  function load(newQuestionnaire: Questionnaire): void {
    try {
      validateQuestionnaireStructure(newQuestionnaire);
    } catch (error) {
      if (error instanceof InvalidQuestionnaireError) {
        throw error;
      }
      throw new InvalidQuestionnaireError(`Invalid questionnaire structure: ${error instanceof Error ? error.message : String(error)}`);
    }

    questionnaire = newQuestionnaire;

    questionRegistry = new Map<string, BaseQuestion>();
    
    for (const section of newQuestionnaire.sections) {
      for (const question of section.questions) {
        try {
          const baseQuestion = createQuestion(question);
          questionRegistry.set(question.id, baseQuestion);
        } catch (error) {
          console.warn(`Failed to create question ${question.id}:`, error);
        }
      }
    }

    actionEngine = createActionEngine(
      formulaEngine,
      questionRegistry,
      defaultActionRegistry,
      (questionId: string, visible: boolean) => {
        if (!questionRegistry) return;
        const baseQuestion = questionRegistry.get(questionId);
        if (baseQuestion) {
          const updated = setQuestionVisible(baseQuestion, visible);
          questionRegistry.set(questionId, updated);
        }
      }
    );

    const validationEngine = {
      validateAll,
    };

    stateManager = createStateManager({
      validationEngine,
      formulaEngine,
    });

    if (newQuestionnaire.actions) {
      for (const action of newQuestionnaire.actions) {
        try {
          actionEngine.registerAction(action);
        } catch (error) {
          console.warn(`Failed to register action:`, error);
        }
      }
    }

    stateManager.loadQuestionnaire(newQuestionnaire);

    if (newQuestionnaire.actions && newQuestionnaire.actions.length > 0) {
      const initialAnswers = stateManager.getAllAnswers();
      actionEngine.executeAll(initialAnswers);
    }

    isInitialized = true;
  }

  function loadFromJSON(json: string | any): void {
    try {
      let questionnaire: Questionnaire;
      if (typeof json === 'string') {
        questionnaire = jsonLoader.loadFromString(json);
      } else {
        questionnaire = jsonLoader.loadFromObject(json);
      }
      load(questionnaire);
    } catch (error) {
      if (error instanceof InvalidQuestionnaireError) {
        throw error;
      }
      throw new InvalidQuestionnaireError(`Failed to load questionnaire from JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function getCurrentQuestions(): Question[] {
    ensureInitialized();
    return stateManager!.getCurrentQuestions();
  }

  function setAnswer(questionId: string, value: AnswerValue): void {
    ensureInitialized();
    
    if (!questionnaire) {
      throw new NotInitializedError();
    }

    let questionExists = false;
    for (const section of questionnaire.sections) {
      if (section.questions.some(q => q.id === questionId)) {
        questionExists = true;
        break;
      }
    }

    if (!questionExists) {
      throw new QuestionNotFoundError(questionId);
    }

    stateManager!.setAnswer(questionId, value);
  }

  function getAnswer(questionId: string): AnswerValue | undefined {
    ensureInitialized();
    return stateManager!.getAnswer(questionId);
  }

  function getAllAnswers(): AnswerStore {
    ensureInitialized();
    return stateManager!.getAllAnswers();
  }

  function validate(): ValidationResult {
    ensureInitialized();
    return stateManager!.validate();
  }

  function getValidationErrors(): ValidationError[] {
    ensureInitialized();
    return stateManager!.getValidationErrors();
  }

  function getProgress(): Progress {
    ensureInitialized();
    return stateManager!.getProgress();
  }

  function getQuestionnaire(): Questionnaire | null {
    return questionnaire;
  }

  function reset(): void {
    ensureInitialized();
    stateManager!.reset();
  }

  function destroy(): void {
    questionnaire = null;
    stateManager = null;
    isInitialized = false;
  }

  function subscribe(callback: (state: EngineState) => void): () => void {
    ensureInitialized();
    return stateManager!.subscribe(callback);
  }

  function getQuestion(questionId: string): Question | undefined {
    ensureInitialized();
    
    if (!questionnaire) {
      return undefined;
    }

    for (const section of questionnaire.sections) {
      const question = section.questions.find(q => q.id === questionId);
      if (question) {
        return question;
      }
    }

    return undefined;
  }

  function getSection(sectionId: string): Section | undefined {
    ensureInitialized();
    
    if (!questionnaire) {
      return undefined;
    }

    return questionnaire.sections.find(s => s.id === sectionId);
  }

  function getVisibleQuestionsForSection(sectionId: string): Question[] {
    ensureInitialized();
    
    const section = getSection(sectionId);
    if (!section) {
      return [];
    }

    const allQuestions = getCurrentQuestions();
    const sectionQuestionIds = new Set(section.questions.map(q => q.id));
    
    return allQuestions.filter(q => sectionQuestionIds.has(q.id));
  }

  function isQuestionVisible(questionId: string): boolean {
    ensureInitialized();
    
    const question = getQuestion(questionId);
    if (!question) {
      return false;
    }

    const allQuestions = getCurrentQuestions();
    return allQuestions.some(q => q.id === questionId);
  }

  function hasAnswer(questionId: string): boolean {
    ensureInitialized();
    const value = stateManager!.getAnswer(questionId);
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    return true;
  }

  return {
    load,
    loadFromJSON,
    getCurrentQuestions,
    setAnswer,
    getAnswer,
    getAllAnswers,
    validate,
    getValidationErrors,
    getProgress,
    getQuestionnaire,
    reset,
    destroy,
    subscribe,
    getQuestion,
    getSection,
    getVisibleQuestionsForSection,
    isQuestionVisible,
    hasAnswer,
  };
}