import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-form-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-select.component.html',
})
export class FormSelectComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  id = input.required<string>();
  label = input.required<string>();
  options = input.required<SelectOption[]>();
  value = input<string>('');
  placeholder = input<string>('Selecione uma opção');
  disabled = input<boolean>(false);
  hint = input<string>('');
  error = input<string | null>(null);

  valueChange = output<string>();
  protected readonly isOpen = signal(false);

  protected selectedLabel(): string {
    return this.options().find((option) => option.value === this.value())?.label ?? '';
  }

  protected toggleOpen(): void {
    if (this.disabled()) {
      return;
    }

    this.isOpen.update((current) => !current);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected selectOption(value: string): void {
    this.valueChange.emit(value);
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;

    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}