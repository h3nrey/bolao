import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TabSelectorComponent, TabOption } from '../../components/ui/tab-selector/tab-selector.component';
import { hasTournamentStarted } from '../../shared/utils/date.utils';

@Component({
  selector: 'app-cartela',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TabSelectorComponent],
  templateUrl: './cartela.component.html',
})
export class CartelaComponent {
  private readonly router = inject(Router);

  protected readonly currentUrl = signal<string>('');
  protected readonly hasTournamentStarted = signal(hasTournamentStarted());

  protected readonly steps = [
    { id: 'grupos', label: 'Fase de grupos' },
    { id: 'r32', label: '16 avos' },
    { id: 'r16', label: 'Oitavas' },
    { id: 'qf', label: 'Quartas' },
    { id: 'sf', label: 'Semifinal' },
    { id: 'final', label: 'Final' }
  ];

  protected readonly tabOptions: TabOption[] = [
    { id: 'grupos', label: 'Grupos' },
    { id: 'r32', label: '16 avos' },
    { id: 'r16', label: 'Oitavas' },
    { id: 'qf', label: 'Quartas' },
    { id: 'sf', label: 'Semifinal' },
    { id: 'final', label: 'Final' }
  ];

  protected readonly activeTabId = computed(() => {
    const url = this.currentUrl();
    if (url.includes('/cartela/grupos')) return 'grupos';
    if (url.includes('/cartela/eliminatoria/r32')) return 'r32';
    if (url.includes('/cartela/eliminatoria/r16')) return 'r16';
    if (url.includes('/cartela/eliminatoria/qf')) return 'qf';
    if (url.includes('/cartela/eliminatoria/sf')) return 'sf';
    if (url.includes('/cartela/eliminatoria/final')) return 'final';
    return 'grupos';
  });

  protected readonly activeStepIndex = computed(() => {
    const tabId = this.activeTabId();
    const ids = ['grupos', 'r32', 'r16', 'qf', 'sf', 'final'];
    return ids.indexOf(tabId);
  });

  constructor() {
    this.currentUrl.set(this.router.url);
    this.router.events.pipe(
      filter(event => event.constructor.name === 'NavigationEnd')
    ).subscribe((event: any) => {
      this.currentUrl.set(event.urlAfterRedirects || event.url);
    });
  }

  protected onTabChange(tabId: string): void {
    if (tabId === 'grupos') {
      this.router.navigate(['/cartela/grupos']);
    } else {
      this.router.navigate(['/cartela/eliminatoria', tabId]);
    }
  }
}
