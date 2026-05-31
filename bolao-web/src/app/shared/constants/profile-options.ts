export const PROJECT_VALUES = [
  'avamec',
  'siscad',
  'mt',
  'vyndance',
  'clique_escola',
  'maipe',
  'rh',
  'materiais_digitais',
  'esmpu',
  'jump',
  'inovaula',
] as const;

export type ProjectValue = (typeof PROJECT_VALUES)[number];

export const PROJECT_LABELS: Record<ProjectValue, string> = {
  avamec: 'AVAMEC',
  siscad: 'SISCAD',
  mt: 'MT',
  vyndance: 'Vyndance',
  clique_escola: 'Clique Escola',
  maipe: 'Maipe',
  rh: 'RH',
  materiais_digitais: 'Materiais Digitais',
  esmpu: 'ESMPU',
  jump: 'Jump',
  inovaula: 'Inovaula',
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
