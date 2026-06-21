import { Component, input, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideChevronUp } from '@lucide/angular';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [CommonModule, LucideChevronUp],
  templateUrl: './scroll-to-top.component.html',
})
export class ScrollToTopComponent implements OnInit, OnDestroy {
  containerSelector = input<string>('main');

  protected showScrollTop = signal(false);
  private containerEl: HTMLElement | null = null;

  ngOnInit(): void {
    // Wait for the next tick to ensure main container is rendered
    setTimeout(() => {
      this.containerEl = document.querySelector(this.containerSelector()) as HTMLElement;
      if (this.containerEl) {
        this.containerEl.addEventListener('scroll', this.onScroll);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.containerEl) {
      this.containerEl.removeEventListener('scroll', this.onScroll);
    }
  }

  private readonly onScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    this.showScrollTop.set(target.scrollTop > 300);
  };

  protected scrollToTop(): void {
    if (this.containerEl) {
      this.containerEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
