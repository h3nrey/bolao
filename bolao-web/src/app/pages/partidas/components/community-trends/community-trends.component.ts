import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideBarChart2 } from '@lucide/angular';

@Component({
  selector: 'app-community-trends',
  standalone: true,
  imports: [CommonModule, LucideBarChart2],
  templateUrl: './community-trends.component.html',
})
export class CommunityTrendsComponent {
  statsRatios = input<any>({ a: 0, draw: 0, b: 0 });
  teamA = input<any>(null);
  teamB = input<any>(null);
}
