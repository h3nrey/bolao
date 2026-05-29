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
  scoreA = input.required<number>();
  scoreB = input.required<number>();
  isSaved = input.required<boolean>();
  isModified = input.required<boolean>();
  isSaving = input.required<boolean>();
  isPastDeadline = input.required<boolean>();
  dateLabel = input.required<string>();

  scoreAChange = output<number>();
  scoreBChange = output<number>();
  inputChange = output<void>();
  blur = output<void>();
}
