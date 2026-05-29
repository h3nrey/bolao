import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  open = input.required<boolean>();
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
}