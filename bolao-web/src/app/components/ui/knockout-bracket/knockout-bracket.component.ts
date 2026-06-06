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
import { BracketTeam, BracketMatch, BracketRound, SvgPath, BracketCard, HeaderCell, HighlightBox } from './knockout-bracket.types';
import { 
  LAYOUT, 
  ROUND_KEYS, 
  ROUND_OPTIONS, 
  getMatchLeft, 
  calculateTotalWidth, 
  calculateBracketCards, 
  calculateSvgPaths, 
  calculateThirdPlaceLeft, 
  calculateThirdPlaceTop, 
  calculateBracketBodyHeight, 
  calculateHeaderCells, 
  calculateHighlightBoxes, 
  isWinner, 
  isLoser, 
  getTeamScore, 
  transformDatabaseMatches, 
  detectCurrentPhase 
} from './knockout-bracket.utils';

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
  isFullscreen = signal(false);
  activeRoundFocus = signal<'final' | 'semifinal' | 'quarterfinal' | 'round_of_16' | 'round_of_32'>('final');

  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef<HTMLElement>;

  // Layout constants exposed to template
  readonly CARD_HEIGHT = LAYOUT.CARD_HEIGHT;
  readonly CARD_WIDTH = LAYOUT.CARD_WIDTH;

  readonly roundOptions = ROUND_OPTIONS;

  private hasInitializedFocus = false;

  constructor() {
    // 1. Auto-detect focus phase on initial matches load
    effect(() => {
      const matchesList = this.matches();
      if (matchesList && matchesList.length > 0 && !this.hasInitializedFocus) {
        const rounds = this.computedRounds();
        const detected = detectCurrentPhase(rounds);
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

  scrollToRound(roundId: string): void {
    if (!this.scrollContainer) return;
    const container = this.scrollContainer.nativeElement;
    if (!container) return;

    const roundIdx = ROUND_KEYS[roundId] ?? 4;
    const matchLeft = getMatchLeft(roundIdx);
    const scrollTarget = matchLeft - container.clientWidth / 2 + this.CARD_WIDTH / 2;
    
    container.scrollTo({
      left: scrollTarget,
      behavior: 'smooth'
    });
  }

  // Computed properties linked to helpers
  readonly computedRounds = computed<BracketRound[]>(() => {
    return transformDatabaseMatches(this.matches());
  });

  readonly mainRounds = computed<BracketRound[]>(() => {
    return this.computedRounds().filter(r => r.id !== 'third');
  });

  readonly thirdPlace = computed<BracketMatch | null>(() => {
    return this.computedRounds().find(r => r.id === 'third')?.matches[0] ?? null;
  });

  readonly totalWidth = computed<number>(() => {
    return calculateTotalWidth(this.isFullscreen());
  });

  readonly bracketCards = computed<BracketCard[]>(() => {
    return calculateBracketCards(this.isFullscreen(), this.mainRounds());
  });

  readonly svgPaths = computed<SvgPath[]>(() => {
    return calculateSvgPaths(this.isFullscreen(), this.mainRounds());
  });

  readonly thirdPlaceLeft = computed<number>(() => {
    return calculateThirdPlaceLeft();
  });

  readonly thirdPlaceTop = computed<number>(() => {
    return calculateThirdPlaceTop(this.isFullscreen());
  });

  readonly bracketBodyHeight = computed<number>(() => {
    return calculateBracketBodyHeight(this.isFullscreen(), !!this.thirdPlace());
  });

  readonly headerCells = computed<HeaderCell[]>(() => {
    return calculateHeaderCells(this.isFullscreen(), this.mainRounds());
  });

  readonly highlightBoxes = computed<HighlightBox[]>(() => {
    return calculateHighlightBoxes(
      this.isFullscreen(), 
      this.activeRoundFocus(), 
      this.mainRounds()
    );
  });

  readonly showHighlightBox = true;

  // Pure template helpers delegated to helper functions
  isWinner(match: BracketMatch, side: 'a' | 'b'): boolean {
    return isWinner(match, side);
  }

  isLoser(match: BracketMatch, side: 'a' | 'b'): boolean {
    return isLoser(match, side);
  }

  getTeamScore(match: BracketMatch, side: 'a' | 'b'): string {
    return getTeamScore(match, side);
  }
}


