import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideTrash2, LucideX } from '@lucide/angular';

export interface SelectionItem {
  id: string;
  label: string;
  emoji?: string | null;
}

@Component({
  selector: 'app-selection-bar',
  standalone: true,
  imports: [CommonModule, LucideTrash2, LucideX],
  templateUrl: './selection-bar.component.html',
})
export class SelectionBarComponent {
  count = input.required<number>();
  items = input.required<SelectionItem[]>();
  
  clear = output<void>();
  delete = output<void>();

  protected onClear(): void {
    this.clear.emit();
  }

  protected onDelete(): void {
    this.delete.emit();
  }
}
