export interface FileAnswerValue {
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
}

// Cell value in a tabular answer (scalar types only, non-recursive)
export type TabularCellValue = string | number | string[] | FileAnswerValue | null | undefined;

// rowId -> columnId -> cell value
export type TabularAnswerValue = Record<string, Record<string, TabularCellValue>>;

export type AnswerValue = string | number | string[] | FileAnswerValue | TabularAnswerValue | null | undefined;

export interface Answer {
  questionId: string;
  value: AnswerValue;
  timestamp?: number;
}

export type AnswerStore = Record<string, AnswerValue>;
