import { 
  BracketMatch, 
  BracketRound, 
  SvgPath, 
  BracketCard, 
  HeaderCell, 
  HighlightBox 
} from './knockout-bracket.types';

export const LAYOUT = {
  CARD_HEIGHT: 52,
  CARD_WIDTH: 160,
  CONNECTOR_WIDTH: 40,
  SLOT_SIZE: 64, // per match slot height in first round
  N_FIRST: 16,
  TOTAL_HEIGHT: 1024, // 16 * 64 = 1024
};

export const ROUND_KEYS: Record<string, number> = {
  'round_of_32': 0,
  'round_of_16': 1,
  'quarterfinal': 2,
  'semifinal': 3,
  'final': 4
};

export const ROUND_OPTIONS = [
  { id: 'final', label: 'Final' },
  { id: 'semifinal', label: 'Semifinal' },
  { id: 'quarterfinal', label: 'Quartas de final' },
  { id: 'round_of_16', label: 'Oitavas de final' },
  { id: 'round_of_32', label: '16 avos' }
];

export const DEFAULT_ROUNDS: BracketRound[] = (() => {
  const mk = (label: string): BracketMatch => ({ label, status: 'upcoming' as const });
  return [
    {
      id: 'r16', label: '16 avos',
      matches: Array.from({ length: 16 }, (_, i) => mk(`Cl. ${i + 1}`)),
    },
    {
      id: 'r8', label: 'Oitavas de final',
      matches: Array.from({ length: 8 }, (_, i) => mk(`W${i + 1}`)),
    },
    {
      id: 'r4', label: 'Quartas de final',
      matches: Array.from({ length: 4 }, (_, i) => mk(`W${i + 1}`)),
    },
    {
      id: 'semi', label: 'Semifinal',
      matches: Array.from({ length: 2 }, (_, i) => mk(`W${i + 1}`)),
    },
    {
      id: 'final', label: 'Final',
      matches: [mk('Grande Final')],
    },
    {
      id: 'third', label: '3º Lugar',
      matches: [mk('3º Lugar')],
    },
  ];
})();

export function getMatchCenter(r: number, m: number): number {
  const S = LAYOUT.SLOT_SIZE;
  if (r === 0) return (m + 0.5) * S;
  return Math.pow(2, r - 1) * (2 * m + 1) * S;
}

export function getMatchTop(r: number, m: number): number {
  return Math.round(getMatchCenter(r, m) - LAYOUT.CARD_HEIGHT / 2);
}

export function getMatchLeft(r: number): number {
  return 24 + r * (LAYOUT.CARD_WIDTH + LAYOUT.CONNECTOR_WIDTH);
}

export function calculateTotalWidth(isFullscreen: boolean): number {
  const n = isFullscreen ? 9 : 5;
  return n * LAYOUT.CARD_WIDTH + (n - 1) * LAYOUT.CONNECTOR_WIDTH + 48;
}

export function calculateBracketCards(isFullscreen: boolean, mainRounds: BracketRound[]): BracketCard[] {
  const cards: BracketCard[] = [];
  for (let r = 0; r < mainRounds.length; r++) {
    const round = mainRounds[r];
    for (let m = 0; m < round.matches.length; m++) {
      let left = 0;
      let top = 0;
      
      if (isFullscreen) {
        if (r === 0) {
          if (m < 8) {
            left = getMatchLeft(0);
            top = getMatchTop(0, m);
          } else {
            left = getMatchLeft(8);
            top = getMatchTop(0, m - 8);
          }
        } else if (r === 1) {
          if (m < 4) {
            left = getMatchLeft(1);
            top = getMatchTop(1, m);
          } else {
            left = getMatchLeft(7);
            top = getMatchTop(1, m - 4);
          }
        } else if (r === 2) {
          if (m < 2) {
            left = getMatchLeft(2);
            top = getMatchTop(2, m);
          } else {
            left = getMatchLeft(6);
            top = getMatchTop(2, m - 2);
          }
        } else if (r === 3) {
          if (m === 0) {
            left = getMatchLeft(3);
            top = getMatchTop(3, m);
          } else {
            left = getMatchLeft(5);
            top = getMatchTop(3, m - 1);
          }
        } else {
          left = getMatchLeft(4);
          top = 256 - LAYOUT.CARD_HEIGHT - 16;
        }
      } else {
        left = getMatchLeft(r);
        top = getMatchTop(r, m);
      }
      
      cards.push({
        match: round.matches[m],
        left,
        top,
        roundId: round.id,
        isFinal: round.id === 'final',
        absRoundIndex: r
      });
    }
  }
  return cards;
}

export function calculateSvgPaths(isFullscreen: boolean, mainRounds: BracketRound[]): SvgPath[] {
  const paths: SvgPath[] = [];
  
  if (isFullscreen) {
    const finalY = 256 - LAYOUT.CARD_HEIGHT - 16 + LAYOUT.CARD_HEIGHT / 2;
    
    // LEFT SIDE
    for (let m = 0; m < 8; m++) {
      const x1 = getMatchLeft(0) + LAYOUT.CARD_WIDTH;
      const xMid = Math.round(x1 + LAYOUT.CONNECTOR_WIDTH / 2);
      const x2 = getMatchLeft(1);
      const y1 = Math.round(getMatchCenter(0, m));
      const y2 = Math.round(getMatchCenter(1, Math.floor(m / 2)));
      paths.push({ d: `M${x1} ${y1}H${xMid}V${y2}H${x2}`, key: `L-0-${m}` });
    }
    for (let m = 0; m < 4; m++) {
      const x1 = getMatchLeft(1) + LAYOUT.CARD_WIDTH;
      const xMid = Math.round(x1 + LAYOUT.CONNECTOR_WIDTH / 2);
      const x2 = getMatchLeft(2);
      const y1 = Math.round(getMatchCenter(1, m));
      const y2 = Math.round(getMatchCenter(2, Math.floor(m / 2)));
      paths.push({ d: `M${x1} ${y1}H${xMid}V${y2}H${x2}`, key: `L-1-${m}` });
    }
    for (let m = 0; m < 2; m++) {
      const x1 = getMatchLeft(2) + LAYOUT.CARD_WIDTH;
      const xMid = Math.round(x1 + LAYOUT.CONNECTOR_WIDTH / 2);
      const x2 = getMatchLeft(3);
      const y1 = Math.round(getMatchCenter(2, m));
      const y2 = Math.round(getMatchCenter(3, Math.floor(m / 2)));
      paths.push({ d: `M${x1} ${y1}H${xMid}V${y2}H${x2}`, key: `L-2-${m}` });
    }
    {
      const x1 = getMatchLeft(3) + LAYOUT.CARD_WIDTH;
      const xMid = Math.round(x1 + LAYOUT.CONNECTOR_WIDTH / 2);
      const x2 = getMatchLeft(4);
      const y1 = Math.round(getMatchCenter(3, 0));
      paths.push({ d: `M${x1} ${y1}H${xMid}V${finalY}H${x2}`, key: `L-3-0` });
    }
    
    // RIGHT SIDE
    for (let m = 0; m < 8; m++) {
      const x1 = getMatchLeft(8);
      const xMid = Math.round(x1 - LAYOUT.CONNECTOR_WIDTH / 2);
      const x2 = getMatchLeft(7) + LAYOUT.CARD_WIDTH;
      const y1 = Math.round(getMatchCenter(0, m));
      const y2 = Math.round(getMatchCenter(1, Math.floor(m / 2)));
      paths.push({ d: `M${x1} ${y1}H${xMid}V${y2}H${x2}`, key: `R-8-${m}` });
    }
    for (let m = 0; m < 4; m++) {
      const x1 = getMatchLeft(7);
      const xMid = Math.round(x1 - LAYOUT.CONNECTOR_WIDTH / 2);
      const x2 = getMatchLeft(6) + LAYOUT.CARD_WIDTH;
      const y1 = Math.round(getMatchCenter(1, m));
      const y2 = Math.round(getMatchCenter(2, Math.floor(m / 2)));
      paths.push({ d: `M${x1} ${y1}H${xMid}V${y2}H${x2}`, key: `R-7-${m}` });
    }
    for (let m = 0; m < 2; m++) {
      const x1 = getMatchLeft(6);
      const xMid = Math.round(x1 - LAYOUT.CONNECTOR_WIDTH / 2);
      const x2 = getMatchLeft(5) + LAYOUT.CARD_WIDTH;
      const y1 = Math.round(getMatchCenter(2, m));
      const y2 = Math.round(getMatchCenter(3, Math.floor(m / 2)));
      paths.push({ d: `M${x1} ${y1}H${xMid}V${y2}H${x2}`, key: `R-6-${m}` });
    }
    {
      const x1 = getMatchLeft(5);
      const xMid = Math.round(x1 - LAYOUT.CONNECTOR_WIDTH / 2);
      const x2 = getMatchLeft(4) + LAYOUT.CARD_WIDTH;
      const y1 = Math.round(getMatchCenter(3, 0));
      paths.push({ d: `M${x1} ${y1}H${xMid}V${finalY}H${x2}`, key: `R-5-0` });
    }
    
  } else {
    for (let r = 0; r < mainRounds.length - 1; r++) {
      const x1 = getMatchLeft(r) + LAYOUT.CARD_WIDTH;
      const xMid = Math.round(x1 + LAYOUT.CONNECTOR_WIDTH / 2);
      const x2 = getMatchLeft(r + 1);

      for (let m = 0; m < mainRounds[r].matches.length; m++) {
        const y1 = Math.round(getMatchCenter(r, m));
        const y2 = Math.round(getMatchCenter(r + 1, Math.floor(m / 2)));
        paths.push({
          d: `M${x1} ${y1}H${xMid}V${y2}H${x2}`,
          key: `${r}-${m}`,
        });
      }
    }
  }
  return paths;
}

export function calculateThirdPlaceLeft(): number {
  return getMatchLeft(4);
}

export function calculateThirdPlaceTop(isFullscreen: boolean): number {
  if (isFullscreen) {
    return 256 + 16;
  }
  const finalBottom = getMatchTop(4, 0) + LAYOUT.CARD_HEIGHT;
  return finalBottom + 64; 
}

export function calculateBracketBodyHeight(isFullscreen: boolean, hasThirdPlace: boolean): number {
  if (isFullscreen) {
    return 512;
  }
  const mainH = LAYOUT.TOTAL_HEIGHT;
  if (hasThirdPlace) {
    const thirdTop = calculateThirdPlaceTop(isFullscreen);
    return Math.max(mainH, thirdTop + LAYOUT.CARD_HEIGHT + 32);
  }
  return mainH;
}

export function calculateHeaderCells(isFullscreen: boolean, mainRounds: BracketRound[]): HeaderCell[] {
  const cells: HeaderCell[] = [];
  
  if (isFullscreen) {
    const cols = [
      { label: '16 avos', id: 'r16-L' },
      { label: 'Oitavas de final', id: 'r8-L' },
      { label: 'Quartas de final', id: 'r4-L' },
      { label: 'Semifinal', id: 'semi-L' },
      { label: 'Final', id: 'final' },
      { label: 'Semifinal', id: 'semi-R' },
      { label: 'Quartas de final', id: 'r4-R' },
      { label: 'Oitavas de final', id: 'r8-R' },
      { label: '16 avos', id: 'r16-R' }
    ];
    
    for (let i = 0; i < cols.length; i++) {
      cells.push({
        label: cols[i].label,
        id: cols[i].id,
        width: LAYOUT.CARD_WIDTH,
        isConnector: false,
        absRoundIndex: i
      });
      if (i < cols.length - 1) {
        cells.push({
          label: '',
          id: `conn-${i}`,
          width: LAYOUT.CONNECTOR_WIDTH,
          isConnector: true,
          absRoundIndex: i
        });
      }
    }
  } else {
    for (let r = 0; r < mainRounds.length; r++) {
      cells.push({
        label: mainRounds[r].label,
        id: mainRounds[r].id,
        width: LAYOUT.CARD_WIDTH,
        isConnector: false,
        absRoundIndex: r
      });
      if (r < mainRounds.length - 1) {
        cells.push({ 
          label: '', 
          id: `conn-${r}`, 
          width: LAYOUT.CONNECTOR_WIDTH, 
          isConnector: true,
          absRoundIndex: r
        });
      }
    }
  }
  return cells;
}

export function calculateFinalBoxLeft(): number {
  return getMatchLeft(4) - 16;
}

export function calculateFinalBoxTop(isFullscreen: boolean): number {
  if (isFullscreen) {
    return 256 - LAYOUT.CARD_HEIGHT - 16 - 36;
  }
  return getMatchTop(4, 0) - 36;
}

export function calculateFinalBoxWidth(): number {
  return LAYOUT.CARD_WIDTH + 32;
}

export function calculateFinalBoxHeight(isFullscreen: boolean): number {
  const finalTop = isFullscreen ? (256 - LAYOUT.CARD_HEIGHT - 16) : getMatchTop(4, 0);
  const thirdBottom = calculateThirdPlaceTop(isFullscreen) + LAYOUT.CARD_HEIGHT;
  return (thirdBottom - finalTop) + 64;
}

export function calculateHighlightBoxes(
  isFullscreen: boolean, 
  focusRound: string, 
  mainRounds: BracketRound[]
): HighlightBox[] {
  const roundIdx = ROUND_KEYS[focusRound] ?? 4;
  
  if (isFullscreen) {
    if (roundIdx === 4) {
      // Final
      return [{
        left: calculateFinalBoxLeft(),
        top: calculateFinalBoxTop(true),
        width: calculateFinalBoxWidth(),
        height: calculateFinalBoxHeight(true)
      }];
    }
    
    const leftCol = roundIdx;
    const rightCol = 8 - roundIdx;
    const numMatches = mainRounds[leftCol].matches.length / 2;
    
    const firstTop = getMatchTop(leftCol, 0);
    const lastBottom = getMatchTop(leftCol, numMatches - 1) + LAYOUT.CARD_HEIGHT;
    const boxH = (lastBottom - firstTop) + 48;
    
    return [
      {
        left: getMatchLeft(leftCol) - 16,
        top: firstTop - 24,
        width: LAYOUT.CARD_WIDTH + 32,
        height: boxH
      },
      {
        left: getMatchLeft(rightCol) - 16,
        top: firstTop - 24,
        width: LAYOUT.CARD_WIDTH + 32,
        height: boxH
      }
    ];
  } else {
    // Standard one-way mode
    if (roundIdx === 4) {
      return [{
        left: calculateFinalBoxLeft(),
        top: calculateFinalBoxTop(false),
        width: calculateFinalBoxWidth(),
        height: calculateFinalBoxHeight(false)
      }];
    }
    
    const round = mainRounds[roundIdx];
    const firstTop = getMatchTop(roundIdx, 0);
    const lastBottom = getMatchTop(roundIdx, round.matches.length - 1) + LAYOUT.CARD_HEIGHT;
    
    return [{
      left: getMatchLeft(roundIdx) - 16,
      top: firstTop - 24,
      width: LAYOUT.CARD_WIDTH + 32,
      height: (lastBottom - firstTop) + 48
    }];
  }
}

export function isWinner(match: BracketMatch, side: 'a' | 'b'): boolean {
  if (match.status !== 'finished') return false;
  
  if (match.penalty_score_a != null && match.penalty_score_b != null) {
    return side === 'a' ? match.penalty_score_a > match.penalty_score_b : match.penalty_score_b > match.penalty_score_a;
  }
  
  const scoreA = (match.score_a ?? 0) + (match.score_a_extra ?? 0);
  const scoreB = (match.score_b ?? 0) + (match.score_b_extra ?? 0);
  
  return side === 'a' ? scoreA > scoreB : scoreB > scoreA;
}

export function isLoser(match: BracketMatch, side: 'a' | 'b'): boolean {
  if (match.status !== 'finished') return false;
  const opp = side === 'a' ? 'b' : 'a';
  return isWinner(match, opp);
}

export function getTeamScore(match: BracketMatch, side: 'a' | 'b'): string {
  if (match.status === 'upcoming') return '';
  
  const score = side === 'a' 
    ? (match.score_a ?? 0) + (match.score_a_extra ?? 0)
    : (match.score_b ?? 0) + (match.score_b_extra ?? 0);
    
  const penalty = side === 'a' ? match.penalty_score_a : match.penalty_score_b;
  
  if (penalty != null) {
    return `${score} (${penalty})`;
  }
  return `${score}`;
}

export function transformDatabaseMatches(allMatches: any[]): BracketRound[] {
  if (!allMatches || allMatches.length === 0) {
    return DEFAULT_ROUNDS;
  }

  const knockoutMatches = allMatches.filter(m => m.stage !== 'groups');
  if (knockoutMatches.length === 0) {
    return DEFAULT_ROUNDS;
  }

  // Map database stages to static bracket round nodes
  const getStageMatchesOrdered = (
    stage: string, 
    mapTable: number[], 
    orderTable: number[], 
    defaultLength: number, 
    labelPrefix: string
  ): BracketMatch[] => {
    const stageMatches = knockoutMatches.filter(m => m.stage === stage);
    
    if (stageMatches.length > 0) {
      const sorted = [...stageMatches].sort(
        (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );

      const mapped: BracketMatch[] = sorted.map((m, idx) => {
        const num = mapTable[idx] || (73 + idx);
        return {
          id: m.id,
          team_a: m.team_a ? { name: m.team_a.name, flag_emoji: m.team_a.flag_emoji } : null,
          team_b: m.team_b ? { name: m.team_b.name, flag_emoji: m.team_b.flag_emoji } : null,
          score_a: m.score?.score_a_regular ?? m.score_a ?? 0,
          score_b: m.score?.score_b_regular ?? m.score_b ?? 0,
          score_a_extra: m.score?.score_a_extra ?? m.score_a_extra ?? 0,
          score_b_extra: m.score?.score_b_extra ?? m.score_b_extra ?? 0,
          penalty_score_a: m.penalty_score_a,
          penalty_score_b: m.penalty_score_b,
          status: m.status,
          num
        };
      });

      mapped.sort((a, b) => orderTable.indexOf(a.num!) - orderTable.indexOf(b.num!));

      while (mapped.length < defaultLength) {
        mapped.push({
          label: `${labelPrefix} ${mapped.length + 1}`,
          status: 'upcoming'
        });
      }
      return mapped;
    } else {
      return Array.from({ length: defaultLength }, (_, i) => ({
        label: `${labelPrefix} ${i + 1}`,
        status: 'upcoming'
      }));
    }
  };

  const r32 = getStageMatchesOrdered(
    'round_of_32', 
    [73, 76, 74, 75, 78, 77, 79, 80, 82, 81, 84, 83, 85, 88, 86, 87], 
    [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87], 
    16, 
    'Cl.'
  );
  
  const r16 = getStageMatchesOrdered(
    'round_of_16', 
    [90, 89, 91, 92, 93, 94, 95, 96], 
    [89, 90, 93, 94, 91, 92, 95, 96], 
    8, 
    'W'
  );
  
  const qf = getStageMatchesOrdered(
    'quarterfinal', 
    [97, 98, 99, 100], 
    [97, 98, 99, 100], 
    4, 
    'W'
  );
  
  const sf = getStageMatchesOrdered(
    'semifinal', 
    [101, 102], 
    [101, 102], 
    2, 
    'W'
  );

  // Final
  const finalDB = knockoutMatches.filter(m => m.stage === 'final')[0];
  const finalMatch: BracketMatch = finalDB ? {
    id: finalDB.id,
    team_a: finalDB.team_a ? { name: finalDB.team_a.name, flag_emoji: finalDB.team_a.flag_emoji } : null,
    team_b: finalDB.team_b ? { name: finalDB.team_b.name, flag_emoji: finalDB.team_b.flag_emoji } : null,
    score_a: finalDB.score?.score_a_regular ?? finalDB.score_a ?? 0,
    score_b: finalDB.score?.score_b_regular ?? finalDB.score_b ?? 0,
    score_a_extra: finalDB.score?.score_a_extra ?? finalDB.score_a_extra ?? 0,
    score_b_extra: finalDB.score?.score_b_extra ?? finalDB.score_b_extra ?? 0,
    penalty_score_a: finalDB.penalty_score_a,
    penalty_score_b: finalDB.penalty_score_b,
    status: finalDB.status,
    num: 104
  } : { label: 'Grande Final', status: 'upcoming' };

  // Third Place
  const thirdDB = knockoutMatches.filter(m => m.stage === 'third_place')[0];
  const thirdMatch: BracketMatch = thirdDB ? {
    id: thirdDB.id,
    team_a: thirdDB.team_a ? { name: thirdDB.team_a.name, flag_emoji: thirdDB.team_a.flag_emoji } : null,
    team_b: thirdDB.team_b ? { name: thirdDB.team_b.name, flag_emoji: thirdDB.team_b.flag_emoji } : null,
    score_a: thirdDB.score?.score_a_regular ?? thirdDB.score_a ?? 0,
    score_b: thirdDB.score?.score_b_regular ?? thirdDB.score_b ?? 0,
    score_a_extra: thirdDB.score?.score_a_extra ?? thirdDB.score_a_extra ?? 0,
    score_b_extra: thirdDB.score?.score_b_extra ?? thirdDB.score_b_extra ?? 0,
    penalty_score_a: thirdDB.penalty_score_a,
    penalty_score_b: thirdDB.penalty_score_b,
    status: thirdDB.status,
    num: 103
  } : { label: '3º Lugar', status: 'upcoming' };

  return [
    { id: 'r16', label: '16 avos', matches: r32 },
    { id: 'r8', label: 'Oitavas de final', matches: r16 },
    { id: 'r4', label: 'Quartas de final', matches: qf },
    { id: 'semi', label: 'Semifinal', matches: sf },
    { id: 'final', label: 'Final', matches: [finalMatch] },
    { id: 'third', label: '3º Lugar', matches: [thirdMatch] }
  ];
}

export function detectCurrentPhase(
  rounds: BracketRound[]
): 'final' | 'semifinal' | 'quarterfinal' | 'round_of_16' | 'round_of_32' {
  const roundMapping: Record<string, 'final' | 'semifinal' | 'quarterfinal' | 'round_of_16' | 'round_of_32'> = {
    'r16': 'round_of_32',
    'r8': 'round_of_16',
    'r4': 'quarterfinal',
    'semi': 'semifinal',
    'final': 'final'
  };

  for (const r of rounds) {
    if (r.id === 'third') continue;
    const hasUnfinished = r.matches.some(m => m.status === 'upcoming' || m.status === 'live');
    if (hasUnfinished && roundMapping[r.id]) {
      return roundMapping[r.id];
    }
  }
  return 'final';
}
