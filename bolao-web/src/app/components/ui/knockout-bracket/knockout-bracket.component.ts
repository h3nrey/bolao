import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  status?: 'upcoming' | 'live' | 'finished' | 'cancelled';
  label?: string;
}

export interface BracketRound {
  id: string;
  label: string;
  matches: BracketMatch[];
}

interface SvgPath {
  d: string;
  key: string;
}

interface BracketCard {
  match: BracketMatch;
  left: number;
  top: number;
  roundId: string;
  isFinal: boolean;
}

interface HeaderCell {
  label: string;
  id: string;
  width: number;
  isConnector: boolean;
}

@Component({
  selector: 'app-knockout-bracket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './knockout-bracket.component.html',
})
export class KnockoutBracketComponent {
  rounds = input<BracketRound[]>([]);
  onMatchClick = input<((matchId: string) => void) | null>(null);

  // Layout constants
  readonly CARD_HEIGHT = 48;
  readonly CARD_WIDTH = 152;
  readonly CONNECTOR_WIDTH = 40;
  readonly SLOT_SIZE = 64; // per match slot height in first round
  readonly N_FIRST = 16;
  readonly TOTAL_HEIGHT = this.N_FIRST * this.SLOT_SIZE; // 1024px

  handleMatchClick(match: BracketMatch): void {
    const fn = this.onMatchClick();
    if (fn && match.id) fn(match.id);
  }

  get displayRounds(): BracketRound[] {
    const r = this.rounds();
    return r.length > 0 ? r : this.defaultRounds;
  }

  /** All rounds except the 3rd place */
  get mainRounds(): BracketRound[] {
    return this.displayRounds.filter(r => r.id !== 'third');
  }

  get thirdPlace(): BracketMatch | null {
    return this.displayRounds.find(r => r.id === 'third')?.matches[0] ?? null;
  }

  get totalWidth(): number {
    const n = this.mainRounds.length;
    return n * this.CARD_WIDTH + (n - 1) * this.CONNECTOR_WIDTH;
  }

  /**
   * Returns the vertical center (Y) of match `m` in round `r` (0-indexed).
   * Formula: center(r, m) = 2^(r-1) * (2m+1) * S  for r >= 1
   *          center(0, m) = (m + 0.5) * S
   */
  getMatchCenter(r: number, m: number): number {
    const S = this.SLOT_SIZE;
    if (r === 0) return (m + 0.5) * S;
    return Math.pow(2, r - 1) * (2 * m + 1) * S;
  }

  getMatchTop(r: number, m: number): number {
    return Math.round(this.getMatchCenter(r, m) - this.CARD_HEIGHT / 2);
  }

  getMatchLeft(r: number): number {
    return r * (this.CARD_WIDTH + this.CONNECTOR_WIDTH);
  }

  /** Flat list of all positioned match cards for the main bracket */
  get bracketCards(): BracketCard[] {
    const cards: BracketCard[] = [];
    for (let r = 0; r < this.mainRounds.length; r++) {
      const round = this.mainRounds[r];
      for (let m = 0; m < round.matches.length; m++) {
        cards.push({
          match: round.matches[m],
          left: this.getMatchLeft(r),
          top: this.getMatchTop(r, m),
          roundId: round.id,
          isFinal: round.id === 'final',
        });
      }
    }
    return cards;
  }

  /** SVG paths connecting adjacent rounds */
  get svgPaths(): SvgPath[] {
    const paths: SvgPath[] = [];
    const rounds = this.mainRounds;
    for (let r = 0; r < rounds.length - 1; r++) {
      const x1 = this.getMatchLeft(r) + this.CARD_WIDTH;
      const xMid = Math.round(x1 + this.CONNECTOR_WIDTH / 2);
      const x2 = this.getMatchLeft(r + 1);

      for (let m = 0; m < rounds[r].matches.length; m++) {
        const y1 = Math.round(this.getMatchCenter(r, m));
        const y2 = Math.round(this.getMatchCenter(r + 1, Math.floor(m / 2)));
        // L-shaped path: horizontal → vertical → horizontal
        paths.push({
          d: `M${x1} ${y1}H${xMid}V${y2}H${x2}`,
          key: `${r}-${m}`,
        });
      }
    }
    return paths;
  }

  /** X position of the 3rd place match (same column as Final) */
  get thirdPlaceLeft(): number {
    return this.getMatchLeft(this.mainRounds.length - 1);
  }

  /** Y top position of the 3rd place match (below the Final card) */
  get thirdPlaceTop(): number {
    const finalR = this.mainRounds.length - 1;
    const finalBottom = this.getMatchTop(finalR, 0) + this.CARD_HEIGHT;
    return finalBottom + 18;
  }

  get bracketBodyHeight(): number {
    const mainH = this.TOTAL_HEIGHT;
    if (this.thirdPlace) {
      return Math.max(mainH, this.thirdPlaceTop + this.CARD_HEIGHT + 32);
    }
    return mainH;
  }

  /** Header cells interleaved with connector spacers */
  get headerCells(): HeaderCell[] {
    const cells: HeaderCell[] = [];
    for (let i = 0; i < this.mainRounds.length; i++) {
      cells.push({
        label: this.mainRounds[i].label,
        id: this.mainRounds[i].id,
        width: this.CARD_WIDTH,
        isConnector: false,
      });
      if (i < this.mainRounds.length - 1) {
        cells.push({ label: '', id: `conn-${i}`, width: this.CONNECTOR_WIDTH, isConnector: true });
      }
    }
    return cells;
  }

  isWinner(match: BracketMatch, side: 'a' | 'b'): boolean {
    if (match.status !== 'finished') return false;
    const a = match.score_a ?? 0;
    const b = match.score_b ?? 0;
    return side === 'a' ? a > b : b > a;
  }

  getRowBg(match: BracketMatch, side: 'a' | 'b'): string {
    if (match.status === 'finished' && this.isWinner(match, side)) {
      return 'rgba(16,185,129,0.07)';
    }
    return side === 'a' ? '#0d1321' : '#0a0e18';
  }

  get defaultRounds(): BracketRound[] {
    const mk = (label: string): BracketMatch => ({ label, status: 'upcoming' as const });
    return [
      {
        id: 'r16', label: '16avos de Final',
        matches: Array.from({ length: 16 }, (_, i) => mk(`Cl. ${i + 1}`)),
      },
      {
        id: 'r8', label: 'Oitavas de Final',
        matches: Array.from({ length: 8 }, (_, i) => mk(`W${i + 1}`)),
      },
      {
        id: 'r4', label: 'Quartas de Final',
        matches: Array.from({ length: 4 }, (_, i) => mk(`W${i + 1}`)),
      },
      {
        id: 'semi', label: 'Semifinais',
        matches: Array.from({ length: 2 }, (_, i) => mk(`W${i + 1}`)),
      },
      {
        id: 'final', label: 'Final',
        matches: [mk('Grande Final')],
      },
      {
        id: 'third', label: '3º Lugar',
        matches: [mk('3º Lugar')],
      },
    ];
  }
}
