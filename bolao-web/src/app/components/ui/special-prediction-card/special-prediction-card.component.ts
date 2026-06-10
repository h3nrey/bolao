import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, inject, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideSearch, LucideX, LucideTrophy, LucideSportShoe, LucideAward, LucideZap, LucideTarget, LucideStar } from '@lucide/angular';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-special-prediction-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideSearch,
    LucideX,
    LucideTrophy,
    LucideSportShoe,
    LucideAward,
    LucideZap,
    LucideTarget,
    LucideStar
  ],
  templateUrl: './special-prediction-card.component.html',
  host: {
    'class': 'relative p-6 bg-[#14151A] border border-[#2A2B36] rounded-lg flex flex-col justify-between gap-4 shadow-md transition-all duration-150 block',
    '[class.min-h-[260px]]': "size() === 'normal'",
    '[class.min-h-[390px]]': "size() === 'large' || size() === 'tall'",
    '[class.border-l-4]': 'true',
    '[class.z-40]': 'isOpen()',
    '[class.z-10]': '!isOpen()'
  }
})
export class SpecialPredictionCardComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  category = input.required<string>();
  points = input.required<number>();
  title = input.required<string>();
  accentColor = input<string>('red'); // gold, silver, bronze, red
  size = input<'normal' | 'large' | 'tall'>('normal');
  options = input.required<SelectOption[]>();
  value = input<string>('');
  placeholder = input<string>('Buscar...');
  emptyText = input<string>('Nenhum selecionado');
  emptyIcon = input<string>('trophy'); // trophy, soccer, award, zap, target, star
  disabled = input<boolean>(false);
  badgeText = input<string>('');
  description = input<string>('');
  helpText = input<string>('');

  valueChange = output<string>();

  protected readonly isOpen = signal(false);
  protected readonly searchQuery = signal('');

  protected selectedLabel(): string {
    return this.options().find((option) => option.value === this.value())?.label ?? '';
  }

  protected filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.options();
    return this.options().filter(o => o.label.toLowerCase().includes(query));
  });

  protected onSearchInput(val: string): void {
    this.searchQuery.set(val);
    if (!this.isOpen()) {
      this.isOpen.set(true);
    }
  }

  protected onFocus(): void {
    if (!this.disabled()) {
      this.isOpen.set(true);
    }
  }

  protected close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  protected selectOption(value: string): void {
    this.valueChange.emit(value);
    this.close();
  }

  protected clearSelection(): void {
    if (!this.disabled()) {
      this.valueChange.emit('');
      this.close();
    }
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
