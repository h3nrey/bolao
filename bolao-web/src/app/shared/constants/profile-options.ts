export const PROJECT_VALUES = [
  'avamec',
  'siscad',
  'mt',
  'vyndance',
  'clique-escola',
  'maipe',
  'rh',
  'materiais-digitais',
] as const;

export type ProjectValue = (typeof PROJECT_VALUES)[number];

export const PROJECT_LABELS: Record<ProjectValue, string> = {
  avamec: 'AVAMEC',
  siscad: 'SISCAD',
  mt: 'MT',
  vyndance: 'Vyndance',
  'clique-escola': 'Clique Escola',
  maipe: 'Maipe',
  rh: 'RH',
  'materiais-digitais': 'Materiais Digitais',
};

export const PROJECT_OPTIONS = PROJECT_VALUES.map((value) => ({
  value,
  label: PROJECT_LABELS[value],
}));

export const SENIORITY_VALUES = ['bolsista', 'clt', 'gerente', 'pmo', 'outro'] as const;

export type SeniorityValue = (typeof SENIORITY_VALUES)[number];

export const SENIORITY_LABELS: Record<SeniorityValue, string> = {
  bolsista: 'Bolsista',
  clt: 'CLT',
  gerente: 'Gerente',
  pmo: 'PMO',
  outro: 'Outro',
};

export const SENIORITY_OPTIONS = SENIORITY_VALUES.map((value) => ({
  value,
  label: SENIORITY_LABELS[value],
}));
