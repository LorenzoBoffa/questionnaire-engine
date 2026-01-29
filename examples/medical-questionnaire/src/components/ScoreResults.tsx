import type { ScoreResult } from 'questionnaire-engine';

interface ScoreResultsProps {
  results: ScoreResult[];
}

function ScoreResults({ results }: ScoreResultsProps) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="score-results">
      <h3 className="score-results-title">Final Scores</h3>
      <div className="score-results-list">
        {results.map((result) => {
          const displayValue = result.value.toFixed(2);
          const error = result.error;

          return (
            <div key={result.formulaId} className="score-result-item">
              <div className="score-info">
                <span className="score-parameter-name">{result.parameterName}</span>
                <span className="score-formula-id">({result.formulaId})</span>
              </div>
              <div className="score-value-container">
                {error ? (
                  <span className="score-error" title={error}>
                    Error
                  </span>
                ) : (
                  <span className="score-value">{displayValue}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ScoreResults;
