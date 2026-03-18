export type ActionType = 'show' | 'hide';

export type TargetType = 'question' | 'section';

export interface Action {
  type: ActionType;
  condition: string;
  target: string;
  targetType?: TargetType;
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
