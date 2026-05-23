import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-tab-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-selector.component.html',
})
export class TabSelectorComponent {
  options = input.required<TabOption[]>();
  activeId = input.required<string>();
  tabChange = output<string>();

  selectTab(id: string): void {
    this.tabChange.emit(id);
  }
}
