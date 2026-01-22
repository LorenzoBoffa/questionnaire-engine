import type { FormulaResult, Formula } from 'questionnaire-engine';

interface FormulaResultsProps {
  formulas: Formula[];
  results: FormulaResult[];
}

function FormulaResults({ formulas, results }: FormulaResultsProps) {
  if (!formulas || formulas.length === 0) {
    return null;
  }

  const resultsMap = new Map<string, FormulaResult>();
  results.forEach(result => {
    resultsMap.set(result.formulaId, result);
  });

  return (
    <div className="formula-results">
      <h3 className="formula-results-title">Formula Results</h3>
      <div className="formula-results-list">
        {formulas.map((formula) => {
          const result = resultsMap.get(formula.id);
          const value = result?.value ?? null;
          const error = result?.error;
          const displayValue = value !== null ? value.toFixed(2) : 'N/A';

          return (
            <div key={formula.id} className="formula-result-item">
              <div className="formula-info">
                <span className="formula-id">{formula.id}</span>
                <span className="formula-expression">{formula.expression}</span>
              </div>
              <div className="formula-value-container">
                {error ? (
                  <span className="formula-error" title={error}>
                    Error
                  </span>
                ) : (
                  <span className="formula-value">{displayValue}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FormulaResults;
