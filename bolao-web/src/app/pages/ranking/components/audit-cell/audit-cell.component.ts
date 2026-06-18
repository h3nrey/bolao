import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audit-cell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-cell.component.html',
})
export class AuditCellComponent {
  prediction = input<{
    score_a: number | null;
    score_b: number | null;
    points: number;
  } | undefined>();
}
