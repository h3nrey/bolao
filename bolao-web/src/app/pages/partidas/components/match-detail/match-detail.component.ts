import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../components/ui/loading-spinner/loading-spinner.component';
import { ScoreStepperComponent } from '../../../../components/ui/score-stepper/score-stepper.component';
import { SessionService } from '../../../../services/session.service';
import { MatchesService } from '../../../../services/matches.service';
import { LucideArrowLeft, LucideBarChart2, LucideCircle, LucideCircleCheck, LucideClock3, LucideGlobe2, LucideLock, LucideRadio, LucideTimer, LucideUsers } from '@lucide/angular';

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, LoadingSpinnerComponent, ScoreStepperComponent, LucideArrowLeft, LucideBarChart2, LucideCircle, LucideCircleCheck, LucideClock3, LucideGlobe2, LucideLock, LucideRadio, LucideTimer, LucideUsers],
  templateUrl: './match-detail.component.html',
})
export class MatchDetailComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);
  protected readonly matchId = signal('');

  // Match data
  protected readonly match = signal<any | null>(null);
  protected readonly loadingMatch = signal(false);

  // Prediction form
  protected readonly scoreA = signal<number>(0);
  protected readonly scoreB = signal<number>(0);
  protected readonly isEditingPrediction = signal(false);
  protected readonly savingPrediction = signal(false);
  protected readonly predictionMessage = signal<{ text: string; isError: boolean } | null>(null);

  // Other predictions
  protected readonly otherPredictions = signal<any[]>([]);
  protected readonly loadingOthers = signal(false);

  // Stats bar ratios (real values from backend)
  protected readonly statsRatios = computed(() => {
    const m = this.match();
    if (!m || !m.community_trends) return { a: 0, draw: 0, b: 0 };
    return m.community_trends;
  });

  ngOnInit(): void {
    this.matchId.set(this.route.snapshot.paramMap.get('id') ?? '');
    this.loadMatch();
  }

  private loadMatch(showSpinner = true): void {
    if (!this.matchId()) {
      this.router.navigate(['/partidas']);
      return;
    }

    if (showSpinner) {
      this.loadingMatch.set(true);
    }

    this.matchesService.getMatch(this.matchId()).subscribe({
      next: (m) => {
        this.match.set(m);
        this.loadingMatch.set(false);
        this.fetchMyPrediction();
        if (m.started_at) this.fetchOtherPredictions();
      },
      error: () => this.loadingMatch.set(false),
    });
  }

  private fetchMyPrediction(): void {
    this.matchesService.getMyPrediction(this.matchId()).subscribe({
      next: (pred) => {
        const itemA = pred.items?.find((i: any) => i.type === 'score_a');
        const itemB = pred.items?.find((i: any) => i.type === 'score_b');
        this.scoreA.set(itemA?.value_int ?? 0);
        this.scoreB.set(itemB?.value_int ?? 0);
        this.isEditingPrediction.set(true);
      },
      error: () => {
        this.scoreA.set(0);
        this.scoreB.set(0);
        this.isEditingPrediction.set(false);
      },
    });
  }

  private fetchOtherPredictions(): void {
    this.loadingOthers.set(true);
    this.matchesService.getOtherPredictions(this.matchId()).subscribe({
      next: (preds) => {
        this.otherPredictions.set(preds);
        this.loadingOthers.set(false);
      },
      error: () => this.loadingOthers.set(false),
    });
  }

  protected savePrediction(): void {
    const m = this.match();
    if (!m) return;

    const deadline = new Date(new Date(m.scheduled_at).getTime() - 5 * 60 * 1000);
    if (new Date() > deadline || m.started_at) {
      this.predictionMessage.set({ text: 'Não é possível salvar. O tempo limite esgotou ou a partida já iniciou!', isError: true });
      return;
    }

    this.savingPrediction.set(true);
    this.predictionMessage.set(null);

    this.matchesService.savePrediction(m.id, this.scoreA(), this.scoreB()).subscribe({
      next: () => {
        this.savingPrediction.set(false);
        this.isEditingPrediction.set(true);
        this.predictionMessage.set({ text: 'Seu palpite foi salvo com sucesso!', isError: false });
        this.loadMatch(false);
      },
      error: () => {
        this.savingPrediction.set(false);
        this.predictionMessage.set({ text: 'Falha ao conectar ao servidor. Tente novamente.', isError: true });
      },
    });
  }

  protected getPredictionValue(prediction: any, type: string): number {
    return prediction?.items?.find((i: any) => i.type === type)?.value_int ?? 0;
  }

  protected goBack(): void {
    this.router.navigate(['/partidas']);
  }
}
