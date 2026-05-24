import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ranking-legend',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking-legend.component.html',
})
export class RankingLegendComponent {
  countdown = input<string>('4 dias, 12:45:00');
}
