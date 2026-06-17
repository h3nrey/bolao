import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormSelectComponent, SelectOption } from '../../../../components/ui/form-select/form-select.component';
import { LucideZap, LucideMinus, LucidePlus } from '@lucide/angular';

@Component({
  selector: 'app-match-multipliers',
  standalone: true,
  imports: [CommonModule, FormSelectComponent, LucideZap, LucideMinus, LucidePlus],
  templateUrl: './match-multipliers.component.html',
})
export class MatchMultipliersComponent {
  disabled = input<boolean>(false);
  teamA = input<any>(null);
  teamB = input<any>(null);
  
  // Predictions values
  scorerPlayerId = input<string>('');
  firstGoalTeamId = input<string>('');
  cardsQuantity = input<number>(0);
  cornersQuantity = input<number>(0);
  bothTeamsScore = input<number | null>(null);

  // Output events
  scorerPlayerIdChange = output<string>();
  firstGoalTeamIdChange = output<string>();
  cardsQuantityChange = output<number>();
  cornersQuantityChange = output<number>();
  bothTeamsScoreChange = output<number | null>();

  // Players list options combined
  protected readonly playerSelectOptions = computed<SelectOption[]>(() => {
    const list: SelectOption[] = [{ value: '', label: 'Nenhum jogador' }];
    
    const ta = this.teamA();
    const tb = this.teamB();
    
    if (ta && ta.players) {
      ta.players.forEach((p: any) => {
        list.push({
          value: p.id,
          label: `${ta.flag_emoji || '🏳️'} ${ta.name} - ${p.name} (${p.number || 'S/N'})`
        });
      });
    }
    
    if (tb && tb.players) {
      tb.players.forEach((p: any) => {
        list.push({
          value: p.id,
          label: `${tb.flag_emoji || '🏳️'} ${tb.name} - ${p.name} (${p.number || 'S/N'})`
        });
      });
    }

    return list.sort((a, b) => a.label.localeCompare(b.label));
  });

  // First goal team options
  protected readonly teamSelectOptions = computed<SelectOption[]>(() => {
    const ta = this.teamA();
    const tb = this.teamB();
    
    const list: SelectOption[] = [
      { value: '', label: 'Não selecionado' },
      { value: 'none', label: 'Sem Gols (0x0)' }
    ];

    if (ta) {
      list.push({ value: ta.id, label: `${ta.flag_emoji || '🏳️'} ${ta.name}` });
    }
    if (tb) {
      list.push({ value: tb.id, label: `${tb.flag_emoji || '🏳️'} ${tb.name}` });
    }

    return list;
  });

  protected selectScorerPlayer(val: string): void {
    this.scorerPlayerIdChange.emit(val);
  }

  protected selectFirstGoalTeam(val: string): void {
    this.firstGoalTeamIdChange.emit(val);
  }

  protected setBothTeamsScore(val: number | null): void {
    if (!this.disabled()) {
      this.bothTeamsScoreChange.emit(val);
    }
  }
}
