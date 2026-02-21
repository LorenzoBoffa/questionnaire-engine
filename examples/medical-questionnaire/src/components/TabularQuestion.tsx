import type { TabularQuestion, TabularColumn, TabularAnswerValue, ValidationError, MultipleChoiceOption } from 'questionnaire-engine';

interface TabularQuestionProps {
  question: TabularQuestion;
  value: TabularAnswerValue | undefined;
  error?: string;
  allErrors?: ValidationError[];
  onChange: (value: TabularAnswerValue) => void;
}

function TabularQuestionComponent({ question, value, error, allErrors, onChange }: TabularQuestionProps) {
  const tableValue = value ?? {};

  const getCellValue = (rowId: string, colId: string) => tableValue[rowId]?.[colId] ?? undefined;

  const getCellError = (rowId: string, colId: string): string | undefined => {
    if (!allErrors) return undefined;
    const syntheticId = `${question.id}.${rowId}.${colId}`;
    const cellErrors = allErrors.filter(e => e.questionId === syntheticId);
    return cellErrors.length > 0 ? cellErrors.map(e => e.message).join(', ') : undefined;
  };

  const handleCellChange = (rowId: string, colId: string, cellValue: any) => {
    const newTableValue: TabularAnswerValue = { ...tableValue };
    newTableValue[rowId] = { ...newTableValue[rowId], [colId]: cellValue };
    onChange(newTableValue);
  };

  const renderCellInput = (column: TabularColumn, rowId: string) => {
    const cellValue = getCellValue(rowId, column.id);
    const cellError = getCellError(rowId, column.id);
    const inputId = `${question.id}-${rowId}-${column.id}`;

    switch (column.type) {
      case 'text':
        return (
          <td key={column.id} className="tabular-cell">
            <input
              id={inputId}
              type="text"
              value={typeof cellValue === 'string' ? cellValue : ''}
              placeholder={column.placeholder}
              onChange={(e) => handleCellChange(rowId, column.id, e.target.value)}
              className={`cell-input ${cellError ? 'error' : ''}`}
            />
            {cellError && <div className="cell-error">{cellError}</div>}
          </td>
        );

      case 'number':
        return (
          <td key={column.id} className="tabular-cell">
            <input
              id={inputId}
              type="number"
              value={typeof cellValue === 'number' ? cellValue : ''}
              min={column.min}
              max={column.max}
              step={column.step}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') {
                  handleCellChange(rowId, column.id, null);
                } else {
                  const n = Number(v);
                  if (!isNaN(n)) handleCellChange(rowId, column.id, n);
                }
              }}
              className={`cell-input ${cellError ? 'error' : ''}`}
            />
            {cellError && <div className="cell-error">{cellError}</div>}
          </td>
        );

      case 'multiple-choice':
        return (
          <td key={column.id} className="tabular-cell">
            <select
              id={inputId}
              value={typeof cellValue === 'string' ? cellValue : ''}
              onChange={(e) => handleCellChange(rowId, column.id, e.target.value || null)}
              className={`cell-input ${cellError ? 'error' : ''}`}
            >
              <option value="">Select...</option>
              {(column.options ?? []).map((opt: string | MultipleChoiceOption, i: number) => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const label = typeof opt === 'string' ? opt : opt.label;
                return <option key={i} value={val}>{label}</option>;
              })}
            </select>
            {cellError && <div className="cell-error">{cellError}</div>}
          </td>
        );

      case 'multi-select':
        return (
          <td key={column.id} className="tabular-cell">
            <select
              id={inputId}
              multiple
              value={Array.isArray(cellValue) ? cellValue as string[] : []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                handleCellChange(rowId, column.id, selected);
              }}
              className={`cell-input ${cellError ? 'error' : ''}`}
            >
              {(column.options ?? []).map((opt: string | MultipleChoiceOption, i: number) => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const label = typeof opt === 'string' ? opt : opt.label;
                return <option key={i} value={val}>{label}</option>;
              })}
            </select>
            {cellError && <div className="cell-error">{cellError}</div>}
          </td>
        );

      default:
        return <td key={column.id} className="tabular-cell">Unsupported column type</td>;
    }
  };

  return (
    <div className="question">
      <label className="question-label">
        {question.label}
        {question.required && <span className="required">*</span>}
      </label>
      {error && <div className="error-message">{error}</div>}
      <div className="tabular-wrapper">
        <table className="tabular-table">
          <thead>
            <tr>
              <th className="tabular-row-header"></th>
              {question.columns.map(col => (
                <th key={col.id} className="tabular-col-header">
                  {col.label}
                  {col.required && <span className="required">*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {question.rows.map(row => (
              <tr key={row.id}>
                <td className="tabular-row-label">
                  {row.label ?? row.id}
                </td>
                {question.columns.map(col => renderCellInput(col, row.id))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TabularQuestionComponent;
