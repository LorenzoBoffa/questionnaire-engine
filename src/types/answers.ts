export type AnswerValue = string | number | null | undefined;

export interface Answer {
  questionId: string;
  value: AnswerValue;
  timestamp?: number;
}

export type AnswerStore = Record<string, AnswerValue>;
