import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-round-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './round-selector.component.html',
})
export class RoundSelectorComponent {
  activeRoundLabel = input.required<string>();
  hasPrevRound = input.required<boolean>();
  hasNextRound = input.required<boolean>();

  prev = output<void>();
  next = output<void>();
}
