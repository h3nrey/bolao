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

export const SENIORITY_VALUES = ['bolsista', 'clt', 'gerente', 'pmo', 'outro'] as const;

export type SeniorityValue = (typeof SENIORITY_VALUES)[number];
