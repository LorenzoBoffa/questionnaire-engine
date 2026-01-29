import { describe, it, expect, beforeEach } from 'vitest';
import { createQuestionnaireEngine } from '../../engine';
import { createJSONLoader } from '../../utils/json-loader';
import { createScoringConfigLoader } from '../../utils/scoring-loader';
import { simpleQuestionnaire, questionnaireWithFormulas } from '../fixtures/questionnaires';

describe('Scoring Integration Tests', () => {
  let engine: ReturnType<typeof createQuestionnaireEngine>;
  let jsonLoader: ReturnType<typeof createJSONLoader>;
  let scoringLoader: ReturnType<typeof createScoringConfigLoader>;

  beforeEach(() => {
    engine = createQuestionnaireEngine();
    jsonLoader = createJSONLoader();
    scoringLoader = createScoringConfigLoader();
  });

  describe('Load questionnaire + scoring config from JSON', () => {
    it('should load questionnaire JSON and scoring config JSON, then calculate scores', () => {
      const questionnaireJson = JSON.stringify(questionnaireWithFormulas);
      const questionnaire = jsonLoader.loadFromString(questionnaireJson);

      engine.load(questionnaire);
      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 20);
      engine.setAnswer('q3', 30);

      const scoringConfigJson = JSON.stringify({
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2, q3)',
          },
        ],
      });

      const scoringConfig = scoringLoader.loadFromString(scoringConfigJson);

      const results = engine.calculateScore(scoringConfig);

      expect(results).toHaveLength(1);
      expect(results[0].formulaId).toBe('total');
      expect(results[0].parameterName).toBe('totalScore');
      expect(results[0].value).toBe(60);
    });

    it('should verify scoring config validation during load', () => {
      const invalidScoringConfig = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
          },
        ],
      };

      const validationResult = scoringLoader.validateStructure(invalidScoringConfig);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);
      expect(validationResult.errors.some(e => e.includes('expression'))).toBe(true);
    });

    it('should verify scoring works with real questionnaire data', () => {
      const questionnaireJson = JSON.stringify(questionnaireWithFormulas);
      const questionnaire = jsonLoader.loadFromString(questionnaireJson);

      engine.load(questionnaire);
      engine.setAnswer('q1', 5);
      engine.setAnswer('q2', 10);
      engine.setAnswer('q3', 15);

      const scoringConfig = scoringLoader.loadFromObject({
        formulas: [
          {
            id: 'sum1',
            parameterName: 'sum1Score',
            expression: 'sum(q1, q2)',
          },
          {
            id: 'sum2',
            parameterName: 'sum2Score',
            expression: 'q3',
          },
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(sum1, sum2)',
          },
        ],
      });

      const results = engine.calculateScore(scoringConfig);

      expect(results).toHaveLength(3);
      expect(results.find(r => r.parameterName === 'sum1Score')?.value).toBe(15);
      expect(results.find(r => r.parameterName === 'sum2Score')?.value).toBe(15);
      expect(results.find(r => r.parameterName === 'totalScore')?.value).toBe(30);
    });

    it('should handle error when scoring config references non-existent questions', () => {
      const questionnaireJson = JSON.stringify(simpleQuestionnaire);
      const questionnaire = jsonLoader.loadFromString(questionnaireJson);

      engine.load(questionnaire);
      engine.setAnswer('q1', 'John');

      const scoringConfig = scoringLoader.loadFromObject({
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(nonexistent1, nonexistent2)',
          },
        ],
      });

      const results = engine.calculateScore(scoringConfig);

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(0);
    });

    it('should submit questionnaire and calculate scores with loaded config', () => {
      const questionnaireJson = JSON.stringify(questionnaireWithFormulas);
      const questionnaire = jsonLoader.loadFromString(questionnaireJson);

      engine.load(questionnaire);
      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 20);
      engine.setAnswer('q3', 30);

      const submitResult = engine.submit();

      expect(submitResult.isValid).toBe(true);
      expect(submitResult.answers.length).toBeGreaterThan(0);

      const scoringConfig = scoringLoader.loadFromObject({
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2, q3)',
          },
        ],
      });

      const answersMap: Record<string, string | number> = {};
      submitResult.answers.forEach(answer => {
        answersMap[answer.questionId] = answer.value as string | number;
      });

      const scoreResults = engine.calculateScore(scoringConfig, answersMap);

      expect(scoreResults).toHaveLength(1);
      expect(scoreResults[0].value).toBe(60);
    });

    it('should handle complex scoring config with dependencies loaded from JSON', () => {
      const questionnaireJson = JSON.stringify(questionnaireWithFormulas);
      const questionnaire = jsonLoader.loadFromString(questionnaireJson);

      engine.load(questionnaire);
      engine.setAnswer('q1', 5);
      engine.setAnswer('q2', 10);
      engine.setAnswer('q3', 15);

      const scoringConfigJson = JSON.stringify({
        formulas: [
          {
            id: 'base1',
            parameterName: 'base1Score',
            expression: 'sum(q1, q2)',
          },
          {
            id: 'base2',
            parameterName: 'base2Score',
            expression: 'q3',
          },
          {
            id: 'multiplied',
            parameterName: 'multipliedScore',
            expression: 'base1 * 2',
          },
          {
            id: 'final',
            parameterName: 'finalScore',
            expression: 'sum(multiplied, base2)',
          },
        ],
      });

      const scoringConfig = scoringLoader.loadFromString(scoringConfigJson);
      const results = engine.calculateScore(scoringConfig);

      expect(results).toHaveLength(4);
      expect(results.find(r => r.formulaId === 'base1')?.value).toBe(15);
      expect(results.find(r => r.formulaId === 'base2')?.value).toBe(15);
      expect(results.find(r => r.formulaId === 'multiplied')?.value).toBe(30);
      expect(results.find(r => r.formulaId === 'final')?.value).toBe(45);
    });

    it('should handle scoring config with resultType from JSON', () => {
      const questionnaireJson = JSON.stringify(questionnaireWithFormulas);
      const questionnaire = jsonLoader.loadFromString(questionnaireJson);

      engine.load(questionnaire);
      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 20);

      const scoringConfig = scoringLoader.loadFromObject({
        formulas: [
          {
            id: 'number',
            parameterName: 'numberScore',
            expression: 'sum(q1, q2)',
            resultType: 'number',
          },
          {
            id: 'percentage',
            parameterName: 'percentageScore',
            expression: 'sum(q1, q2)',
            resultType: 'percentage',
          },
          {
            id: 'category',
            parameterName: 'categoryScore',
            expression: 'sum(q1, q2)',
            resultType: 'category',
          },
        ],
      });

      const results = engine.calculateScore(scoringConfig);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.value).toBe(30);
      });
    });

    it('should calculate scores from raw answers map after invalid submit', () => {
      const questionnaireJson = JSON.stringify(questionnaireWithFormulas);
      const questionnaire = jsonLoader.loadFromString(questionnaireJson);

      engine.load(questionnaire);
      engine.setAnswer('q1', 10);
      engine.setAnswer('q2', 20);

      const submitResult = engine.submit();

      const answersMap: Record<string, string | number> = {};
      submitResult.answers.forEach(answer => {
        answersMap[answer.questionId] = answer.value as string | number;
      });

      const scoringConfig = scoringLoader.loadFromObject({
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      });

      const scoreResults = engine.calculateScore(scoringConfig, answersMap);

      expect(scoreResults).toHaveLength(1);
      expect(scoreResults[0].value).toBe(30);
    });

    it('should calculate scores with empty answers map when no answers submitted', () => {
      const questionnaireJson = JSON.stringify(questionnaireWithFormulas);
      const questionnaire = jsonLoader.loadFromString(questionnaireJson);

      engine.load(questionnaire);

      const scoringConfig = scoringLoader.loadFromObject({
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2, q3)',
          },
        ],
      });

      const results = engine.calculateScore(scoringConfig, {});

      expect(results).toHaveLength(1);
      expect(results[0].value).toBe(0);
    });

    it('should produce correct scores for multiple categories with different expressions', () => {
      const questionnaireJson = JSON.stringify(questionnaireWithFormulas);
      const questionnaire = jsonLoader.loadFromString(questionnaireJson);

      engine.load(questionnaire);
      engine.setAnswer('q1', 2);
      engine.setAnswer('q2', 3);
      engine.setAnswer('q3', 5);

      const scoringConfig = scoringLoader.loadFromObject({
        formulas: [
          {
            id: 'catA',
            parameterName: 'categoryA',
            expression: 'q1 * 10',
          },
          {
            id: 'catB',
            parameterName: 'categoryB',
            expression: 'q2 * 10',
          },
          {
            id: 'catC',
            parameterName: 'categoryC',
            expression: 'q3 * 10',
          },
          {
            id: 'grandTotal',
            parameterName: 'grandTotal',
            expression: 'sum(catA, catB, catC)',
          },
        ],
      });

      const results = engine.calculateScore(scoringConfig);

      expect(results).toHaveLength(4);
      expect(results.find(r => r.parameterName === 'categoryA')?.value).toBe(20);
      expect(results.find(r => r.parameterName === 'categoryB')?.value).toBe(30);
      expect(results.find(r => r.parameterName === 'categoryC')?.value).toBe(50);
      expect(results.find(r => r.parameterName === 'grandTotal')?.value).toBe(100);
    });

    it('should load scoring config from string and calculate with partial answers', () => {
      const questionnaireJson = JSON.stringify(questionnaireWithFormulas);
      const questionnaire = jsonLoader.loadFromString(questionnaireJson);

      engine.load(questionnaire);
      engine.setAnswer('q1', 5);

      const scoringConfigJson = JSON.stringify({
        formulas: [
          {
            id: 'partial',
            parameterName: 'partialScore',
            expression: 'q1 + q2',
          },
        ],
      });

      const scoringConfig = scoringLoader.loadFromString(scoringConfigJson);
      const results = engine.calculateScore(scoringConfig);

      expect(results).toHaveLength(1);
      expect(results[0].parameterName).toBe('partialScore');
    });

    it('should preserve formulaId and parameterName in each score result', () => {
      const questionnaireJson = JSON.stringify(questionnaireWithFormulas);
      const questionnaire = jsonLoader.loadFromString(questionnaireJson);

      engine.load(questionnaire);
      engine.setAnswer('q1', 1);
      engine.setAnswer('q2', 2);
      engine.setAnswer('q3', 3);

      const scoringConfig = scoringLoader.loadFromObject({
        formulas: [
          {
            id: 'formula-alpha',
            parameterName: 'outputAlpha',
            expression: 'q1',
          },
          {
            id: 'formula-beta',
            parameterName: 'outputBeta',
            expression: 'sum(q2, q3)',
          },
        ],
      });

      const results = engine.calculateScore(scoringConfig);

      expect(results).toHaveLength(2);
      expect(results[0].formulaId).toBe('formula-alpha');
      expect(results[0].parameterName).toBe('outputAlpha');
      expect(results[1].formulaId).toBe('formula-beta');
      expect(results[1].parameterName).toBe('outputBeta');
    });
  });
});
