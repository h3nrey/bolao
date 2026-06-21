import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-matches-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matches-filter.component.html',
})
export class MatchesFilterComponent {
  groups = input.required<{ id: string; name: string }[]>();
  dates = input.required<{ id: string; label: string }[]>();
  selectedGroupId = input<string | null>(null);
  selectedDate = input<string | null>(null);

  groupChange = output<string | null>();
  dateChange = output<string | null>();
  clearFilters = output<void>();

  protected onGroupChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.groupChange.emit(val || null);
  }

  protected onDateChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.dateChange.emit(val || null);
  }

  protected onClear(): void {
    this.clearFilters.emit();
  }
}
