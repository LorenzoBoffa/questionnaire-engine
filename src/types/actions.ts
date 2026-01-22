export type ActionType = 'show' | 'hide';

export interface Action {
  type: ActionType;
  condition: string;
  target: string;
}

export interface ShowAction extends Action {
  type: 'show';
  condition: string;
  target: string;
}

export interface HideAction extends Action {
  type: 'hide';
  condition: string;
  target: string;
}
