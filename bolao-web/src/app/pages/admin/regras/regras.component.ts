import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SessionService } from '../../../services/session.service';
import { API_BASE_URL } from '../../../config/api.constants';
import { LucideCheck, LucideX, LucideInfo } from '@lucide/angular';
import { SwitchComponent } from '../../../components/ui/switch/switch.component';

@Component({
  selector: 'app-admin-regras',
  standalone: true,
  imports: [
    CommonModule,
    LucideCheck,
    LucideX,
    LucideInfo,
    SwitchComponent,
  ],
  templateUrl: './regras.component.html',
})
export class AdminRegrasComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly apiBaseUrl = API_BASE_URL;

  protected readonly loading = signal(false);
  protected readonly feedbackMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  protected readonly specialPredictionsActive = signal<boolean>(true);
  protected readonly tournamentId = signal<string | null>(null);

  protected readonly multipliersActive = signal<boolean>(true);
  protected readonly multiplierScorerPts = signal<number>(5);
  protected readonly multiplierFirstGoalPts = signal<number>(5);
  protected readonly multiplierCardsPts = signal<number>(3);
  protected readonly multiplierCornersPts = signal<number>(3);
  protected readonly multiplierBothScorePts = signal<number>(2);

  ngOnInit(): void {
    this.fetchTournamentStatus();
  }

  private showFeedback(type: 'success' | 'error', text: string): void {
    this.feedbackMessage.set({ type, text });
    setTimeout(() => {
      this.feedbackMessage.set(null);
    }, 4500);
  }

  protected fetchTournamentStatus(): void {
    this.loading.set(true);
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.session.token()}`);
    this.http.get<any[]>(`${this.apiBaseUrl}/tournaments`, { headers }).subscribe({
      next: (tournaments) => {
        if (tournaments && tournaments.length > 0) {
          const activeTournament = tournaments[0];
          this.tournamentId.set(activeTournament.id);
          this.specialPredictionsActive.set(activeTournament.special_predictions_active);
          this.multipliersActive.set(activeTournament.multipliers_active ?? true);
          this.multiplierScorerPts.set(activeTournament.multiplier_scorer_pts ?? 5);
          this.multiplierFirstGoalPts.set(activeTournament.multiplier_first_goal_pts ?? 5);
          this.multiplierCardsPts.set(activeTournament.multiplier_cards_pts ?? 3);
          this.multiplierCornersPts.set(activeTournament.multiplier_corners_pts ?? 3);
          this.multiplierBothScorePts.set(activeTournament.multiplier_both_score_pts ?? 2);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao carregar status do torneio', err);
        this.loading.set(false);
      },
    });
  }

  protected toggleSpecialPredictions(): void {
    const tId = this.tournamentId();
    if (!tId) return;

    const nextVal = !this.specialPredictionsActive();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.session.token()}`);
    const body = {
      special_predictions_active: nextVal
    };

    this.loading.set(true);
    this.http.patch<any>(`${this.apiBaseUrl}/tournaments/${tId}`, body, { headers }).subscribe({
      next: (updated) => {
        this.specialPredictionsActive.set(updated.special_predictions_active);
        this.showFeedback('success', `Palpites especiais agora estão ${updated.special_predictions_active ? 'abertos' : 'fechados'}!`);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao atualizar status dos palpites especiais', err);
        this.showFeedback('error', 'Ocorreu um erro ao alterar o status dos palpites especiais.');
        this.loading.set(false);
      }
    });
  }

  protected toggleMultipliers(): void {
    const tId = this.tournamentId();
    if (!tId) return;

    const nextVal = !this.multipliersActive();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.session.token()}`);
    const body = {
      multipliers_active: nextVal
    };

    this.loading.set(true);
    this.http.patch<any>(`${this.apiBaseUrl}/tournaments/${tId}`, body, { headers }).subscribe({
      next: (updated) => {
        this.multipliersActive.set(updated.multipliers_active);
        this.showFeedback('success', `Multiplicadores de jogo agora estão ${updated.multipliers_active ? 'ativos' : 'inativos'}!`);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao atualizar status dos multiplicadores', err);
        this.showFeedback('error', 'Ocorreu um erro ao alterar o status dos multiplicadores.');
        this.loading.set(false);
      }
    });
  }

  protected saveMultiplierSettings(): void {
    const tId = this.tournamentId();
    if (!tId) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.session.token()}`);
    const body = {
      multiplier_scorer_pts: Number(this.multiplierScorerPts()),
      multiplier_first_goal_pts: Number(this.multiplierFirstGoalPts()),
      multiplier_cards_pts: Number(this.multiplierCardsPts()),
      multiplier_corners_pts: Number(this.multiplierCornersPts()),
      multiplier_both_score_pts: Number(this.multiplierBothScorePts()),
    };

    this.loading.set(true);
    this.http.patch<any>(`${this.apiBaseUrl}/tournaments/${tId}`, body, { headers }).subscribe({
      next: (updated) => {
        this.multiplierScorerPts.set(updated.multiplier_scorer_pts);
        this.multiplierFirstGoalPts.set(updated.multiplier_first_goal_pts);
        this.multiplierCardsPts.set(updated.multiplier_cards_pts);
        this.multiplierCornersPts.set(updated.multiplier_corners_pts);
        this.multiplierBothScorePts.set(updated.multiplier_both_score_pts);
        this.showFeedback('success', 'Configurações de pontos dos multiplicadores salvas com sucesso!');
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Falha ao salvar pontos dos multiplicadores', err);
        this.showFeedback('error', 'Ocorreu um erro ao salvar os pontos dos multiplicadores.');
        this.loading.set(false);
      }
    });
  }
}
