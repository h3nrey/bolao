import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RankingUser } from '../../ranking.component';

@Component({
  selector: 'app-leaderboard-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard-table.component.html',
})
export class LeaderboardTableComponent {
  rankings = input.required<RankingUser[]>();
  userId = input.required<string | undefined>();

  formatName(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 2) return name;
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }
}

