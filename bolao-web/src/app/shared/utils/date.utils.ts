import { MONTHS_PT, WEEKDAYS_PT, WEEKDAYS_SHORT_PT, TOURNAMENT_START_DATE } from '../constants/date-constants';

export function hasTournamentStarted(): boolean {
  return new Date() >= TOURNAMENT_START_DATE;
}

export function getGroupDateLabel(scheduledAt: string): string {
  const dateObj = new Date(scheduledAt);
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

  if (key === todayKey) {
    return `Hoje, ${dateObj.getDate()} de ${MONTHS_PT[dateObj.getMonth()]}`;
  } else if (key === tomorrowKey) {
    return `Amanhã, ${dateObj.getDate()} de ${MONTHS_PT[dateObj.getMonth()]}`;
  } else {
    return `${WEEKDAYS_PT[dateObj.getDay()]}, ${dateObj.getDate()} de ${MONTHS_PT[dateObj.getMonth()]}`;
  }
}

export function getShortMatchDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${WEEKDAYS_SHORT_PT[d.getDay()]}, ${day}/${month}`;
}
