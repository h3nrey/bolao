import { Component, input, output, signal, inject, effect, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatchesService } from '../../../services/matches.service';
import { ModalComponent } from '../modal/modal.component';
import { ScoreStepperComponent } from '../score-stepper/score-stepper.component';
import { LucideChevronLeft, LucideChevronRight, LucideX } from '@lucide/angular';
import { FormSelectComponent, SelectOption } from '../form-select/form-select.component';

@Component({
  selector: 'app-quick-bet-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ScoreStepperComponent,
    FormSelectComponent,
    DatePipe,
    LucideChevronLeft,
    LucideChevronRight,
    LucideX
  ],
  templateUrl: './quick-bet-modal.component.html',
})
export class QuickBetModalComponent {
  private readonly matchesService = inject(MatchesService);

  // Inputs & Outputs
  open = input.required<boolean>();
  close = output<void>();

  // State
  protected readonly upcomingMatches = signal<any[]>([]);
  protected readonly selectedMatchIndex = signal<number>(-1);
  protected readonly activeMatch = signal<any | null>(null);

  protected readonly matchOptions = computed<SelectOption[]>(() => {
    return this.upcomingMatches().map(m => {
      const d = new Date(m.scheduled_at);
      const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      return {
        value: m.id,
        label: `${m.team_a?.name} vs ${m.team_b?.name} (${dateStr})`
      };
    });
  });

  protected readonly scoreA = signal<number>(0);
  protected readonly scoreB = signal<number>(0);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);

  constructor() {
    // Automatically fetch upcoming matches when modal is opened
    effect(() => {
      if (this.open()) {
        this.loadUpcomingMatches();
      }
    });
  }

  private loadUpcomingMatches(): void {
    this.loading.set(true);
    this.error.set(null);
    this.upcomingMatches.set([]);
    this.selectedMatchIndex.set(-1);
    this.activeMatch.set(null);
    this.success.set(false);

    this.matchesService.getMatches('chronological').subscribe({
      next: (matches) => {
        const now = new Date().getTime();
        // Filter: only matches with status === 'upcoming' and deadline not passed
        const upcoming = matches.filter(m => {
          if (m.status !== 'upcoming') return false;
          const deadline = new Date(m.scheduled_at).getTime() - 5 * 60 * 1000;
          return deadline > now;
        });

        this.upcomingMatches.set(upcoming);

        if (upcoming.length > 0) {
          this.selectMatch(0);
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load matches:', err);
        this.error.set('Erro ao carregar as partidas.');
        this.loading.set(false);
      }
    });
  }

  protected selectMatch(index: number): void {
    if (index < 0 || index >= this.upcomingMatches().length) return;
    this.selectedMatchIndex.set(index);
    const match = this.upcomingMatches()[index];
    this.activeMatch.set(match);
    this.success.set(false);
    this.error.set(null);
    this.loading.set(true);

    this.matchesService.getMyPrediction(match.id).subscribe({
      next: (pred) => {
        const itemA = pred.items?.find((i: any) => i.type === 'score_a');
        const itemB = pred.items?.find((i: any) => i.type === 'score_b');
        this.scoreA.set(itemA?.value_int ?? 0);
        this.scoreB.set(itemB?.value_int ?? 0);
        this.loading.set(false);
      },
      error: () => {
        // If no prediction exists yet, default to 0
        this.scoreA.set(0);
        this.scoreB.set(0);
        this.loading.set(false);
      }
    });
  }

  protected previousMatch(): void {
    const currentIndex = this.selectedMatchIndex();
    if (currentIndex > 0) {
      this.selectMatch(currentIndex - 1);
    }
  }

  protected nextMatch(): void {
    const currentIndex = this.selectedMatchIndex();
    if (currentIndex < this.upcomingMatches().length - 1) {
      this.selectMatch(currentIndex + 1);
    }
  }

  protected onMatchChange(matchId: string): void {
    const index = this.upcomingMatches().findIndex(m => m.id === matchId);
    if (index !== -1) {
      this.selectMatch(index);
    }
  }

  protected savePrediction(): void {
    const match = this.activeMatch();
    if (!match) return;

    this.saving.set(true);
    this.error.set(null);

    this.matchesService.savePrediction(match.id, this.scoreA(), this.scoreB()).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
      },
      error: (err) => {
        console.error('Failed to save prediction:', err);
        this.error.set('Erro ao salvar palpite. Tente novamente.');
        this.saving.set(false);
      }
    });
  }

  protected onClose(): void {
    this.close.emit();
  }
}
