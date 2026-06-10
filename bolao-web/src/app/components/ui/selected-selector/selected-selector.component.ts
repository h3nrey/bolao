import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideTrash2, LucideX } from '@lucide/angular';

export interface SelectorItem {
  id: string;
  label: string;
  emoji?: string | null;
}

@Component({
  selector: 'app-selected-selector',
  standalone: true,
  imports: [CommonModule, LucideTrash2, LucideX],
  templateUrl: './selected-selector.component.html',
})
export class SelectedSelectorComponent {
  items = input.required<SelectorItem[]>();
  
  remove = output<string>();
  clear = output<void>();
  delete = output<void>();

  protected onRemove(id: string): void {
    this.remove.emit(id);
  }

  protected onClear(): void {
    this.clear.emit();
  }

  protected onDelete(): void {
    this.delete.emit();
  }
}
