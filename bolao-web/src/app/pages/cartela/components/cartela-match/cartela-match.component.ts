import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScoreInputComponent } from '../../../../components/ui/score-input/score-input.component';

interface MatchTeam {
  id: string;
  name: string;
  flag_emoji?: string | null;
  flag_url?: string | null;
}

interface Match {
  id: string;
  stage: string;
  scheduled_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  team_a?: MatchTeam | null;
  team_b?: MatchTeam | null;
  score?: { score_a: number; score_b: number } | null;
}

@Component({
  selector: 'app-cartela-match',
  standalone: true,
  imports: [CommonModule, FormsModule, ScoreInputComponent],
  templateUrl: './cartela-match.component.html',
})
export class CartelaMatchComponent {
  match = input.required<Match>();
  scoreA = input.required<number | null>();
  scoreB = input.required<number | null>();
  isSaved = input.required<boolean>();
  isModified = input.required<boolean>();
  isSaving = input.required<boolean>();
  isPastDeadline = input.required<boolean>();
  dateLabel = input.required<string>();
  size = input<'sm' | 'lg'>('sm');

  scoreAChange = output<number | null>();
  scoreBChange = output<number | null>();
  inputChange = output<void>();
  blur = output<void>();

  protected stageLabel(stage: string): string {
    const labels: Record<string, string> = {
      groups: 'Fase de Grupos',
      round_of_32: '16 avos de Final',
      round_of_16: 'Oitavas de Final',
      quarterfinal: 'Quartas de Final',
      semifinal: 'Semifinal',
      third_place: 'Disputa de 3º Lugar',
      final: 'Final',
    };
    return labels[stage] || stage;
  }
}
