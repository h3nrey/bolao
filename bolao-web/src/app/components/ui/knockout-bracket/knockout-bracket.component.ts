import { Component, input, signal, computed, HostListener, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideChevronLeft, 
  LucideChevronRight, 
  LucideMaximize2, 
  LucideMinimize2,
  LucideZoomIn,
  LucideZoomOut
} from '@lucide/angular';
import { FormSelectComponent } from '../form-select/form-select.component';

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
  absRoundIndex: number;
}

interface HeaderCell {
  label: string;
  id: string;
  width: number;
  isConnector: boolean;
  absRoundIndex: number;
}

@Component({
  selector: 'app-knockout-bracket',
  standalone: true,
  imports: [
    CommonModule,
    LucideChevronLeft,
    LucideChevronRight,
    LucideMaximize2,
    LucideMinimize2,
    LucideZoomIn,
    LucideZoomOut,
    FormSelectComponent
  ],
  templateUrl: './knockout-bracket.component.html',
  styleUrl: './knockout-bracket.component.css'
})
export class KnockoutBracketComponent {
  matches = input<any[]>([]);
  onMatchClick = input<((matchId: string) => void) | null>(null);

  zoomLevel = signal(1.0);

  zoomIn(): void {
    this.zoomLevel.update(z => Math.min(z + 0.1, 1.5));
  }

  zoomOut(): void {
    this.zoomLevel.update(z => Math.max(z - 0.1, 0.6));
  }

  resetZoom(): void {
    this.zoomLevel.set(1.0);
  }

  get selectOptions() {
    return this.roundOptions.map(opt => ({
      value: opt.id,
      label: opt.label
    }));
  }

  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef<HTMLElement>;

  // Layout constants
  readonly CARD_HEIGHT = 52;
  readonly CARD_WIDTH = 160;
  readonly CONNECTOR_WIDTH = 40;
  readonly SLOT_SIZE = 64; // per match slot height in first round
  readonly N_FIRST = 16;
  readonly TOTAL_HEIGHT = this.N_FIRST * this.SLOT_SIZE; // 1024px

  // UI State Signals
  isFullscreen = signal(false);
  activeRoundFocus = signal<'final' | 'semifinal' | 'quarterfinal' | 'round_of_16' | 'round_of_32'>('final');

  readonly roundKeys: Record<string, number> = {
    'round_of_32': 0,
    'round_of_16': 1,
    'quarterfinal': 2,
    'semifinal': 3,
    'final': 4
  };

  // Dropdown options
  readonly roundOptions = [
    { id: 'final', label: 'Final' },
    { id: 'semifinal', label: 'Semifinal' },
    { id: 'quarterfinal', label: 'Quartas de final' },
    { id: 'round_of_16', label: 'Oitavas de final' },
    { id: 'round_of_32', label: '16 avos' }
  ];

  private hasInitializedFocus = false;

  constructor() {
    // 1. Auto-detect focus phase on initial matches load
    effect(() => {
      const matchesList = this.matches();
      if (matchesList && matchesList.length > 0 && !this.hasInitializedFocus) {
        const rounds = this.computedRounds();
        const detected = this.detectCurrentPhase(rounds);
        this.activeRoundFocus.set(detected);
        this.hasInitializedFocus = true;
      }
    });

    // 2. Scroll to selected stage whenever activeRoundFocus changes
    effect(() => {
      const focus = this.activeRoundFocus();
      // Track matches to trigger scroll when matches load
      const _ = this.matches();
      
      setTimeout(() => {
        this.scrollToRound(focus);
      }, 100);
    });
  }

  @HostListener('document:keydown.escape', [])
  onEscapePress(): void {
    if (this.isFullscreen()) {
      this.isFullscreen.set(false);
      this.zoomLevel.set(1.0);
      setTimeout(() => {
        this.scrollToRound(this.activeRoundFocus());
      }, 100);
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen.update(v => {
      const nextVal = !v;
      if (!nextVal) {
        this.zoomLevel.set(1.0);
      }
      return nextVal;
    });
    
    // Recalculate scroll centering as container layout dimensions change
    setTimeout(() => {
      this.scrollToRound(this.activeRoundFocus());
    }, 100);
  }

  setFocusRound(roundId: any): void {
    this.activeRoundFocus.set(roundId);
  }

  prevRound(): void {
    const idx = this.roundOptions.findIndex(o => o.id === this.activeRoundFocus());
    if (idx < this.roundOptions.length - 1) {
      this.activeRoundFocus.set(this.roundOptions[idx + 1].id as any);
    }
  }

  nextRound(): void {
    const idx = this.roundOptions.findIndex(o => o.id === this.activeRoundFocus());
    if (idx > 0) {
      this.activeRoundFocus.set(this.roundOptions[idx - 1].id as any);
    }
  }

  get canPrev(): boolean {
    const idx = this.roundOptions.findIndex(o => o.id === this.activeRoundFocus());
    return idx < this.roundOptions.length - 1;
  }

  get canNext(): boolean {
    const idx = this.roundOptions.findIndex(o => o.id === this.activeRoundFocus());
    return idx > 0;
  }

  handleMatchClick(match: BracketMatch): void {
    const fn = this.onMatchClick();
    if (fn && match.id) fn(match.id);
  }

  /**
   * Scroll the horizontal container to center the selected round column
   */
  scrollToRound(roundId: string): void {
    if (!this.scrollContainer) return;
    const container = this.scrollContainer.nativeElement;
    if (!container) return;

    const roundIdx = this.roundKeys[roundId] ?? 4;
    const matchLeft = this.getMatchLeft(roundIdx);
    const scrollTarget = matchLeft - container.clientWidth / 2 + this.CARD_WIDTH / 2;
    
    container.scrollTo({
      left: scrollTarget,
      behavior: 'smooth'
    });
  }

  /**
   * Detects the first phase with unfinished (upcoming or live) matches
   */
  detectCurrentPhase(rounds: BracketRound[]): 'final' | 'semifinal' | 'quarterfinal' | 'round_of_16' | 'round_of_32' {
    const roundMapping: Record<string, 'final' | 'semifinal' | 'quarterfinal' | 'round_of_16' | 'round_of_32'> = {
      'r16': 'round_of_32',
      'r8': 'round_of_16',
      'r4': 'quarterfinal',
      'semi': 'semifinal',
      'final': 'final'
    };

    for (const r of rounds) {
      if (r.id === 'third') continue;
      const hasUnfinished = r.matches.some(m => m.status === 'upcoming' || m.status === 'live');
      if (hasUnfinished && roundMapping[r.id]) {
        return roundMapping[r.id];
      }
    }
    return 'final';
  }

  get showHighlightBox(): boolean {
    return true;
  }

  get highlightBoxLeft(): number {
    const roundIdx = this.roundKeys[this.activeRoundFocus()] ?? 4;
    return this.getMatchLeft(roundIdx) - 16;
  }

  get highlightBoxTop(): number {
    const roundIdx = this.roundKeys[this.activeRoundFocus()] ?? 4;
    if (roundIdx === 4) return this.finalBoxTop;
    return this.getMatchTop(roundIdx, 0) - 24;
  }

  get highlightBoxWidth(): number {
    return this.CARD_WIDTH + 32;
  }

  get highlightBoxHeight(): number {
    const roundIdx = this.roundKeys[this.activeRoundFocus()] ?? 4;
    if (roundIdx === 4) return this.finalBoxHeight;
    const round = this.mainRounds[roundIdx];
    if (!round || !round.matches.length) return this.TOTAL_HEIGHT;
    const firstTop = this.getMatchTop(roundIdx, 0);
    const lastBottom = this.getMatchTop(roundIdx, round.matches.length - 1) + this.CARD_HEIGHT;
    return (lastBottom - firstTop) + 48;
  }

  /**
   * Main transformer that parses database matches and constructs the tree rounds.
   */
  readonly computedRounds = computed<BracketRound[]>(() => {
    const allMatches = this.matches();
    if (!allMatches || allMatches.length === 0) {
      return this.defaultRounds;
    }

    const knockoutMatches = allMatches.filter(m => m.stage !== 'groups');
    if (knockoutMatches.length === 0) {
      return this.defaultRounds;
    }

    // Map database stages to static bracket round nodes
    const getStageMatchesOrdered = (
      stage: string, 
      mapTable: number[], 
      orderTable: number[], 
      defaultLength: number, 
      labelPrefix: string
    ): BracketMatch[] => {
      const stageMatches = knockoutMatches.filter(m => m.stage === stage);
      
      if (stageMatches.length > 0) {
        const sorted = [...stageMatches].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        );

        const mapped: BracketMatch[] = sorted.map((m, idx) => {
          const num = mapTable[idx] || (73 + idx);
          return {
            id: m.id,
            team_a: m.team_a ? { name: m.team_a.name, flag_emoji: m.team_a.flag_emoji } : null,
            team_b: m.team_b ? { name: m.team_b.name, flag_emoji: m.team_b.flag_emoji } : null,
            score_a: m.score?.score_a_regular ?? m.score_a ?? 0,
            score_b: m.score?.score_b_regular ?? m.score_b ?? 0,
            score_a_extra: m.score?.score_a_extra ?? m.score_a_extra ?? 0,
            score_b_extra: m.score?.score_b_extra ?? m.score_b_extra ?? 0,
            penalty_score_a: m.penalty_score_a,
            penalty_score_b: m.penalty_score_b,
            status: m.status,
            num
          };
        });

        mapped.sort((a, b) => orderTable.indexOf(a.num!) - orderTable.indexOf(b.num!));

        while (mapped.length < defaultLength) {
          mapped.push({
            label: `${labelPrefix} ${mapped.length + 1}`,
            status: 'upcoming'
          });
        }
        return mapped;
      } else {
        return Array.from({ length: defaultLength }, (_, i) => ({
          label: `${labelPrefix} ${i + 1}`,
          status: 'upcoming'
        }));
      }
    };

    const r32 = getStageMatchesOrdered(
      'round_of_32', 
      [73, 76, 74, 75, 78, 77, 79, 80, 82, 81, 84, 83, 85, 88, 86, 87], 
      [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87], 
      16, 
      'Cl.'
    );
    
    const r16 = getStageMatchesOrdered(
      'round_of_16', 
      [90, 89, 91, 92, 93, 94, 95, 96], 
      [89, 90, 93, 94, 91, 92, 95, 96], 
      8, 
      'W'
    );
    
    const qf = getStageMatchesOrdered(
      'quarterfinal', 
      [97, 98, 99, 100], 
      [97, 98, 99, 100], 
      4, 
      'W'
    );
    
    const sf = getStageMatchesOrdered(
      'semifinal', 
      [101, 102], 
      [101, 102], 
      2, 
      'W'
    );

    // Final
    const finalDB = knockoutMatches.filter(m => m.stage === 'final')[0];
    const finalMatch: BracketMatch = finalDB ? {
      id: finalDB.id,
      team_a: finalDB.team_a ? { name: finalDB.team_a.name, flag_emoji: finalDB.team_a.flag_emoji } : null,
      team_b: finalDB.team_b ? { name: finalDB.team_b.name, flag_emoji: finalDB.team_b.flag_emoji } : null,
      score_a: finalDB.score?.score_a_regular ?? finalDB.score_a ?? 0,
      score_b: finalDB.score?.score_b_regular ?? finalDB.score_b ?? 0,
      score_a_extra: finalDB.score?.score_a_extra ?? finalDB.score_a_extra ?? 0,
      score_b_extra: finalDB.score?.score_b_extra ?? finalDB.score_b_extra ?? 0,
      penalty_score_a: finalDB.penalty_score_a,
      penalty_score_b: finalDB.penalty_score_b,
      status: finalDB.status,
      num: 104
    } : { label: 'Grande Final', status: 'upcoming' };

    // Third Place
    const thirdDB = knockoutMatches.filter(m => m.stage === 'third_place')[0];
    const thirdMatch: BracketMatch = thirdDB ? {
      id: thirdDB.id,
      team_a: thirdDB.team_a ? { name: thirdDB.team_a.name, flag_emoji: thirdDB.team_a.flag_emoji } : null,
      team_b: thirdDB.team_b ? { name: thirdDB.team_b.name, flag_emoji: thirdDB.team_b.flag_emoji } : null,
      score_a: thirdDB.score?.score_a_regular ?? thirdDB.score_a ?? 0,
      score_b: thirdDB.score?.score_b_regular ?? thirdDB.score_b ?? 0,
      score_a_extra: thirdDB.score?.score_a_extra ?? thirdDB.score_a_extra ?? 0,
      score_b_extra: thirdDB.score?.score_b_extra ?? thirdDB.score_b_extra ?? 0,
      penalty_score_a: thirdDB.penalty_score_a,
      penalty_score_b: thirdDB.penalty_score_b,
      status: thirdDB.status,
      num: 103
    } : { label: '3º Lugar', status: 'upcoming' };

    return [
      { id: 'r16', label: '16 avos', matches: r32 },
      { id: 'r8', label: 'Oitavas de final', matches: r16 },
      { id: 'r4', label: 'Quartas de final', matches: qf },
      { id: 'semi', label: 'Semifinal', matches: sf },
      { id: 'final', label: 'Final', matches: [finalMatch] },
      { id: 'third', label: '3º Lugar', matches: [thirdMatch] }
    ];
  });

  get mainRounds(): BracketRound[] {
    return this.computedRounds().filter(r => r.id !== 'third');
  }

  get thirdPlace(): BracketMatch | null {
    return this.computedRounds().find(r => r.id === 'third')?.matches[0] ?? null;
  }

  get totalWidth(): number {
    const n = this.mainRounds.length;
    return n > 0 ? n * this.CARD_WIDTH + (n - 1) * this.CONNECTOR_WIDTH + 48 : 0;
  }

  getMatchCenter(r: number, m: number): number {
    const S = this.SLOT_SIZE;
    if (r === 0) return (m + 0.5) * S;
    return Math.pow(2, r - 1) * (2 * m + 1) * S;
  }

  getMatchTop(r: number, m: number): number {
    return Math.round(this.getMatchCenter(r, m) - this.CARD_HEIGHT / 2);
  }

  getMatchLeft(r: number): number {
    return 24 + r * (this.CARD_WIDTH + this.CONNECTOR_WIDTH);
  }

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
          absRoundIndex: r
        });
      }
    }
    return cards;
  }

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
        paths.push({
          d: `M${x1} ${y1}H${xMid}V${y2}H${x2}`,
          key: `${r}-${m}`,
        });
      }
    }
    return paths;
  }

  get thirdPlaceLeft(): number {
    return this.getMatchLeft(4);
  }

  get thirdPlaceTop(): number {
    const finalBottom = this.getMatchTop(4, 0) + this.CARD_HEIGHT;
    return finalBottom + 64; 
  }

  get bracketBodyHeight(): number {
    const mainH = this.TOTAL_HEIGHT;
    if (this.thirdPlace) {
      return Math.max(mainH, this.thirdPlaceTop + this.CARD_HEIGHT + 32);
    }
    return mainH;
  }

  get headerCells(): HeaderCell[] {
    const cells: HeaderCell[] = [];
    for (let r = 0; r < this.mainRounds.length; r++) {
      cells.push({
        label: this.mainRounds[r].label,
        id: this.mainRounds[r].id,
        width: this.CARD_WIDTH,
        isConnector: false,
        absRoundIndex: r
      });
      if (r < this.mainRounds.length - 1) {
        cells.push({ 
          label: '', 
          id: `conn-${r}`, 
          width: this.CONNECTOR_WIDTH, 
          isConnector: true,
          absRoundIndex: r
        });
      }
    }
    return cells;
  }

  get finalBoxLeft(): number {
    return this.getMatchLeft(4) - 16;
  }

  get finalBoxTop(): number {
    return this.getMatchTop(4, 0) - 36;
  }

  get finalBoxWidth(): number {
    return this.CARD_WIDTH + 32;
  }

  get finalBoxHeight(): number {
    const finalTop = this.getMatchTop(4, 0);
    const thirdBottom = this.thirdPlaceTop + this.CARD_HEIGHT;
    return (thirdBottom - finalTop) + 64;
  }

  isWinner(match: BracketMatch, side: 'a' | 'b'): boolean {
    if (match.status !== 'finished') return false;
    
    if (match.penalty_score_a != null && match.penalty_score_b != null) {
      return side === 'a' ? match.penalty_score_a > match.penalty_score_b : match.penalty_score_b > match.penalty_score_a;
    }
    
    const scoreA = (match.score_a ?? 0) + (match.score_a_extra ?? 0);
    const scoreB = (match.score_b ?? 0) + (match.score_b_extra ?? 0);
    
    return side === 'a' ? scoreA > scoreB : scoreB > scoreA;
  }

  isLoser(match: BracketMatch, side: 'a' | 'b'): boolean {
    if (match.status !== 'finished') return false;
    const opp = side === 'a' ? 'b' : 'a';
    return this.isWinner(match, opp);
  }

  getTeamScore(match: BracketMatch, side: 'a' | 'b'): string {
    if (match.status === 'upcoming') return '';
    
    const score = side === 'a' 
      ? (match.score_a ?? 0) + (match.score_a_extra ?? 0)
      : (match.score_b ?? 0) + (match.score_b_extra ?? 0);
      
    const penalty = side === 'a' ? match.penalty_score_a : match.penalty_score_b;
    
    if (penalty != null) {
      return `${score} (${penalty})`;
    }
    return `${score}`;
  }

  get defaultRounds(): BracketRound[] {
    const mk = (label: string): BracketMatch => ({ label, status: 'upcoming' as const });
    return [
      {
        id: 'r16', label: '16 avos',
        matches: Array.from({ length: 16 }, (_, i) => mk(`Cl. ${i + 1}`)),
      },
      {
        id: 'r8', label: 'Oitavas de final',
        matches: Array.from({ length: 8 }, (_, i) => mk(`W${i + 1}`)),
      },
      {
        id: 'r4', label: 'Quartas de final',
        matches: Array.from({ length: 4 }, (_, i) => mk(`W${i + 1}`)),
      },
      {
        id: 'semi', label: 'Semifinal',
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


