import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchCardComponent, MatchCardData } from '../match-card/match-card.component';

@Component({
  selector: 'app-match-day-group',
  standalone: true,
  imports: [CommonModule, MatchCardComponent],
  templateUrl: './match-day-group.component.html',
})
export class MatchDayGroupComponent {
  dateLabel = input.required<string>();
  matches = input.required<MatchCardData[]>();
  matchClick = output<string>();
}
