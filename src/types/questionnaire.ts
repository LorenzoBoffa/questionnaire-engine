import type { Question } from './questions';
import type { Action } from './actions';

export interface SubtitleItem {
  type: 'subtitle';
  id?: string;
  text: string;
}

export type SectionContentItem = Question | SubtitleItem;

export interface Section {
  id: string;
  title: string;
  questions: Question[];
  content?: SectionContentItem[];
}

export interface Questionnaire {
  id: string;
  title: string;
  sections: Section[];
  formulas?: Formula[];
  actions?: Action[];
}

export interface Formula {
  id: string;
  expression: string;
  target?: string;
}

export interface FormulaResult {
  formulaId: string;
  value: number;
  error?: string;
}
