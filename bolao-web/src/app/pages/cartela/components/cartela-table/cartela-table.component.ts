import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StandingRow {
  team: {
    id: string;
    name: string;
    flag_emoji?: string | null;
    flag_url?: string | null;
  };
  P: number;
  J: number;
  V: number;
  E: number;
  D: number;
  SG: number;
}

@Component({
  selector: 'app-cartela-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cartela-table.component.html',
})
export class CartelaTableComponent {
  standings = input.required<StandingRow[]>();
}
