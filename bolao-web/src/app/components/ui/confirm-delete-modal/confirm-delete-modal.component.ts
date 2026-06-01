import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { LucideTrash2, LucideX, LucideTriangleAlert } from '@lucide/angular';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, LucideTrash2, LucideX, LucideTriangleAlert],
  templateUrl: './confirm-delete-modal.component.html',
})
export class ConfirmDeleteModalComponent {
  open = input.required<boolean>();
  userName = input.required<string>();
  loading = input<boolean>(false);
  error = input<string | null>(null);

  cancel = output<void>();
  confirm = output<void>();

  protected onCancel(): void {
    this.cancel.emit();
  }

  protected onConfirm(): void {
    this.confirm.emit();
  }
}
