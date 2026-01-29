import { describe, it, expect } from 'vitest';
import { createScoringConfigLoader, InvalidJSONError, InvalidStructureError, MissingFieldError, InvalidTypeError } from '../../utils/scoring-loader';
import type { ScoringConfig } from '../../types/scoring';

describe('ScoringConfigLoader', () => {
  const loader = createScoringConfigLoader();

  describe('loadFromString', () => {
    it('should load valid scoring config from JSON string', () => {
      const jsonString = JSON.stringify({
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      });

      const config = loader.loadFromString(jsonString);

      expect(config.formulas).toHaveLength(1);
      expect(config.formulas[0].id).toBe('total');
      expect(config.formulas[0].parameterName).toBe('totalScore');
      expect(config.formulas[0].expression).toBe('sum(q1, q2)');
    });

    it('should load scoring config with resultType', () => {
      const jsonString = JSON.stringify({
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
            resultType: 'percentage',
          },
        ],
      });

      const config = loader.loadFromString(jsonString);

      expect(config.formulas[0].resultType).toBe('percentage');
    });

    it('should load scoring config with multiple formulas', () => {
      const jsonString = JSON.stringify({
        formulas: [
          {
            id: 'sum1',
            parameterName: 'sum1Score',
            expression: 'sum(q1, q2)',
          },
          {
            id: 'sum2',
            parameterName: 'sum2Score',
            expression: 'sum(q3, q4)',
          },
        ],
      });

      const config = loader.loadFromString(jsonString);

      expect(config.formulas).toHaveLength(2);
      expect(config.formulas[0].id).toBe('sum1');
      expect(config.formulas[1].id).toBe('sum2');
    });

    it('should load scoring config with empty formulas array', () => {
      const jsonString = JSON.stringify({
        formulas: [],
      });

      const config = loader.loadFromString(jsonString);

      expect(config.formulas).toHaveLength(0);
    });

    it('should throw InvalidJSONError for invalid JSON syntax', () => {
      const invalidJson = '{ formulas: [';

      expect(() => loader.loadFromString(invalidJson)).toThrow(InvalidJSONError);
    });

    it('should throw InvalidStructureError for missing formulas field', () => {
      const jsonString = JSON.stringify({});

      expect(() => loader.loadFromString(jsonString)).toThrow(InvalidStructureError);
      expect(() => loader.loadFromString(jsonString)).toThrow(/Missing required field/);
    });

    it('should throw InvalidStructureError for invalid formulas type', () => {
      const jsonString = JSON.stringify({
        formulas: 'not an array',
      });

      expect(() => loader.loadFromString(jsonString)).toThrow(InvalidStructureError);
      expect(() => loader.loadFromString(jsonString)).toThrow(/expected array/);
    });
  });

  describe('loadFromObject', () => {
    it('should load valid scoring config from object', () => {
      const obj = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      const config = loader.loadFromObject(obj);

      expect(config.formulas).toHaveLength(1);
      expect(config.formulas[0].id).toBe('total');
    });

    it('should throw InvalidStructureError for null object', () => {
      expect(() => loader.loadFromObject(null)).toThrow(InvalidStructureError);
    });

    it('should throw InvalidStructureError for missing formulas', () => {
      expect(() => loader.loadFromObject({})).toThrow(InvalidStructureError);
    });

    it('should throw InvalidStructureError for formula without id', () => {
      const obj = {
        formulas: [
          {
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      expect(() => loader.loadFromObject(obj)).toThrow(InvalidStructureError);
      expect(() => loader.loadFromObject(obj)).toThrow(/Missing required field.*id/);
    });

    it('should throw InvalidStructureError for formula without parameterName', () => {
      const obj = {
        formulas: [
          {
            id: 'total',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      expect(() => loader.loadFromObject(obj)).toThrow(InvalidStructureError);
      expect(() => loader.loadFromObject(obj)).toThrow(/Missing required field.*parameterName/);
    });

    it('should throw InvalidStructureError for formula without expression', () => {
      const obj = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
          },
        ],
      };

      expect(() => loader.loadFromObject(obj)).toThrow(InvalidStructureError);
      expect(() => loader.loadFromObject(obj)).toThrow(/Missing required field.*expression/);
    });

    it('should throw InvalidTypeError for non-string id', () => {
      const obj = {
        formulas: [
          {
            id: 123,
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      expect(() => loader.loadFromObject(obj)).toThrow(InvalidTypeError);
    });

    it('should throw InvalidTypeError for non-string parameterName', () => {
      const obj = {
        formulas: [
          {
            id: 'total',
            parameterName: 123,
            expression: 'sum(q1, q2)',
          },
        ],
      };

      expect(() => loader.loadFromObject(obj)).toThrow(InvalidTypeError);
    });

    it('should throw InvalidTypeError for non-string expression', () => {
      const obj = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 123,
          },
        ],
      };

      expect(() => loader.loadFromObject(obj)).toThrow(InvalidTypeError);
    });

    it('should throw InvalidStructureError for invalid resultType', () => {
      const obj = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
            resultType: 'invalid-type',
          },
        ],
      };

      expect(() => loader.loadFromObject(obj)).toThrow(InvalidStructureError);
      expect(() => loader.loadFromObject(obj)).toThrow(/Invalid resultType/);
    });

    it('should accept valid resultType values', () => {
      const obj1 = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
            resultType: 'number',
          },
        ],
      };

      const obj2 = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
            resultType: 'percentage',
          },
        ],
      };

      const obj3 = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
            resultType: 'category',
          },
        ],
      };

      expect(() => loader.loadFromObject(obj1)).not.toThrow();
      expect(() => loader.loadFromObject(obj2)).not.toThrow();
      expect(() => loader.loadFromObject(obj3)).not.toThrow();

      expect(loader.loadFromObject(obj1).formulas[0].resultType).toBe('number');
      expect(loader.loadFromObject(obj2).formulas[0].resultType).toBe('percentage');
      expect(loader.loadFromObject(obj3).formulas[0].resultType).toBe('category');
    });

    it('should handle multiple formulas with validation errors', () => {
      const obj = {
        formulas: [
          {
            id: 'valid',
            parameterName: 'validScore',
            expression: 'sum(q1, q2)',
          },
          {
            id: 'invalid',
            parameterName: 'invalidScore',
          },
        ],
      };

      expect(() => loader.loadFromObject(obj)).toThrow(InvalidStructureError);
      expect(() => loader.loadFromObject(obj)).toThrow(/Missing required field.*expression/);
    });
  });

  describe('validateStructure', () => {
    it('should return valid for correct structure', () => {
      const obj = {
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      };

      const result = loader.validateStructure(obj);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for missing formulas', () => {
      const result = loader.validateStructure({});

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required field');
    });

    it('should return invalid for non-array formulas', () => {
      const result = loader.validateStructure({
        formulas: 'not an array',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('expected array'))).toBe(true);
    });

    it('should return invalid for formula missing id', () => {
      const result = loader.validateStructure({
        formulas: [
          {
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
          },
        ],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('id'))).toBe(true);
    });

    it('should return invalid for formula missing parameterName', () => {
      const result = loader.validateStructure({
        formulas: [
          {
            id: 'total',
            expression: 'sum(q1, q2)',
          },
        ],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('parameterName'))).toBe(true);
    });

    it('should return invalid for formula missing expression', () => {
      const result = loader.validateStructure({
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
          },
        ],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('expression'))).toBe(true);
    });

    it('should return invalid for invalid resultType', () => {
      const result = loader.validateStructure({
        formulas: [
          {
            id: 'total',
            parameterName: 'totalScore',
            expression: 'sum(q1, q2)',
            resultType: 'invalid',
          },
        ],
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('resultType'))).toBe(true);
    });

    it('should return valid for empty formulas array', () => {
      const result = loader.validateStructure({
        formulas: [],
      });

      expect(result.isValid).toBe(true);
    });

    it('should return invalid for null object', () => {
      const result = loader.validateStructure(null);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('must be an object'))).toBe(true);
    });
  });
});
