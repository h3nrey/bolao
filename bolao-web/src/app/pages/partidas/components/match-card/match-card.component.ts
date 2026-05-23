import { Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

export interface MatchCardData {
  id: string;
  stage: string;
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  scheduled_at: string;
  current_minute?: number | null;
  team_a?: { name?: string; flag_emoji?: string | null } | null;
  team_b?: { name?: string; flag_emoji?: string | null } | null;
  score?: { score_a: number; score_b: number } | null;
}

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './match-card.component.html',
})
export class MatchCardComponent {
  match = input.required<MatchCardData>();
  cardClick = output<string>();

  handleClick(): void {
    this.cardClick.emit(this.match().id);
  }
}
