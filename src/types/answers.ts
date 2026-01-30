export interface FileAnswerValue {
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
}

export type AnswerValue = string | number | string[] | FileAnswerValue | null | undefined;

export interface Answer {
  questionId: string;
  value: AnswerValue;
  timestamp?: number;
}

export type AnswerStore = Record<string, AnswerValue>;
