import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SpecialPredictionService } from '../../services/special-prediction.service';
import { SpecialPredictionCardComponent, SelectOption } from '../../components/ui/special-prediction-card/special-prediction-card.component';
import { hasTournamentStarted } from '../../shared/utils/date.utils';
import { LucideCheck, LucideShieldAlert } from '@lucide/angular';

@Component({
  selector: 'app-especiais',
  standalone: true,
  imports: [
    CommonModule,
    SpecialPredictionCardComponent,
    LucideCheck,
    LucideShieldAlert
  ],
  templateUrl: './especiais.component.html',
})
export class EspeciaisComponent implements OnInit {
  private readonly specialsService = inject(SpecialPredictionService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly isLocked = signal(hasTournamentStarted());
  protected readonly error = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  // Lists for dropdowns
  protected readonly teamOptions = signal<SelectOption[]>([]);
  protected readonly playerOptions = signal<SelectOption[]>([]);

  // Selection state values
  protected readonly championId = signal<string>('');
  protected readonly runnerUpId = signal<string>('');
  protected readonly thirdPlaceId = signal<string>('');
  protected readonly topScorerId = signal<string>('');
  protected readonly bestPlayerId = signal<string>('');
  protected readonly surpriseTeamId = signal<string>('');

  // Computed properties for progress tracking
  protected readonly completedCount = computed(() => {
    let count = 0;
    if (this.championId()) count++;
    if (this.runnerUpId()) count++;
    if (this.thirdPlaceId()) count++;
    if (this.topScorerId()) count++;
    if (this.bestPlayerId()) count++;
    if (this.surpriseTeamId()) count++;
    return count;
  });

  protected readonly completionPercentage = computed(() => {
    return (this.completedCount() / 6) * 100;
  });

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    this.error.set(null);

    // Fetch teams, players, and my predictions in parallel using the service
    this.specialsService.getTeams().subscribe({
      next: (teams) => {
        const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));
        this.teamOptions.set([
          { value: '', label: 'Nenhum selecionado' },
          ...sortedTeams.map((t) => ({
            value: t.id,
            label: `${t.flag_emoji || '🏳️'} ${t.name}`,
          }))
        ]);

        this.specialsService.getPlayers().subscribe({
          next: (players) => {
            // Sort by team name, then player name
            const sortedPlayers = [...players].sort((a, b) => {
              const teamCompare = (a.team?.name || '').localeCompare(b.team?.name || '');
              if (teamCompare !== 0) return teamCompare;
              return a.name.localeCompare(b.name);
            });

            this.playerOptions.set([
              { value: '', label: 'Nenhum selecionado' },
              ...sortedPlayers.map((p) => ({
                value: p.id,
                label: `${p.team?.flag_emoji || '🏳️'} ${p.team?.name || ''} - ${p.name}`,
              }))
            ]);

            this.specialsService.getMySpecialPredictions().subscribe({
              next: (pred) => {
                if (pred) {
                  this.championId.set(pred.champion_team_id || '');
                  this.runnerUpId.set(pred.runner_up_team_id || '');
                  this.thirdPlaceId.set(pred.third_place_team_id || '');
                  this.topScorerId.set(pred.top_scorer_player_id || '');
                  this.bestPlayerId.set(pred.best_player_player_id || '');
                  this.surpriseTeamId.set(pred.surprise_team_id || '');
                }
                this.loading.set(false);
              },
              error: (err) => {
                console.error('Erro ao buscar palpites especiais', err);
                this.error.set('Falha ao carregar seus palpites especiais.');
                this.loading.set(false);
              }
            });
          },
          error: (err) => {
            console.error('Erro ao buscar jogadores', err);
            this.error.set('Falha ao carregar jogadores.');
            this.loading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Erro ao buscar seleções', err);
        this.error.set('Falha ao carregar seleções.');
        this.loading.set(false);
      }
    });
  }

  protected savePredictions() {
    if (this.isLocked()) return;

    this.saving.set(true);
    this.successMessage.set(null);
    this.error.set(null);

    const body = {
      champion_team_id: this.championId() || null,
      runner_up_team_id: this.runnerUpId() || null,
      third_place_team_id: this.thirdPlaceId() || null,
      top_scorer_player_id: this.topScorerId() || null,
      best_player_player_id: this.bestPlayerId() || null,
      surprise_team_id: this.surpriseTeamId() || null,
    };

    this.specialsService.saveSpecialPredictions(body).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set('Palpites especiais salvos com sucesso!');
        setTimeout(() => {
          this.successMessage.set(null);
          this.router.navigate(['/perfil']);
        }, 1500);
      },
      error: (err) => {
        console.error('Erro ao salvar palpites especiais', err);
        this.error.set(err.error?.message || 'Falha ao salvar seus palpites.');
        this.saving.set(false);
      }
    });
  }
}
