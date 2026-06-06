export interface BracketTeam {
  name?: string | null;
  flag_emoji?: string | null;
}

export interface BracketMatch {
  id?: string;
  team_a?: BracketTeam | null;
  team_b?: BracketTeam | null;
  score_a?: number | null;
  score_b?: number | null;
  score_a_extra?: number | null;
  score_b_extra?: number | null;
  penalty_score_a?: number | null;
  penalty_score_b?: number | null;
  status?: 'upcoming' | 'live' | 'finished' | 'cancelled';
  label?: string;
  num?: number;
}

export interface BracketRound {
  id: string;
  label: string;
  matches: BracketMatch[];
}

export interface SvgPath {
  d: string;
  key: string;
}

export interface BracketCard {
  match: BracketMatch;
  left: number;
  top: number;
  roundId: string;
  isFinal: boolean;
  absRoundIndex: number;
}

export interface HeaderCell {
  label: string;
  id: string;
  width: number;
  isConnector: boolean;
  absRoundIndex: number;
}

export interface HighlightBox {
  left: number;
  top: number;
  width: number;
  height: number;
}
