export function calculateGroupStandings(groupMatches: any[], predictions: Record<string, any>) {
  const teamMap: { [teamId: string]: { team: any; P: number; J: number; V: number; E: number; D: number; SG: number; GP: number; GC: number } } = {};

  // Initialize teams
  for (const m of groupMatches) {
    if (m.team_a && !teamMap[m.team_a.id]) {
      teamMap[m.team_a.id] = { team: m.team_a, P: 0, J: 0, V: 0, E: 0, D: 0, SG: 0, GP: 0, GC: 0 };
    }
    if (m.team_b && !teamMap[m.team_b.id]) {
      teamMap[m.team_b.id] = { team: m.team_b, P: 0, J: 0, V: 0, E: 0, D: 0, SG: 0, GP: 0, GC: 0 };
    }
  }

  // Calculate based on predictions
  for (const m of groupMatches) {
    if (!m.team_a || !m.team_b) continue;

    let played = false;
    let scoreA = 0;
    let scoreB = 0;

    if (m.status === 'finished') {
      scoreA = m.score?.score_a ?? m.score_a ?? 0;
      scoreB = m.score?.score_b ?? m.score_b ?? 0;
      played = true;
    } else {
      const localPred = predictions[m.id];
      if (localPred && localPred.scoreA !== null && localPred.scoreB !== null) {
        scoreA = localPred.scoreA;
        scoreB = localPred.scoreB;
        played = true;
      }
    }

    if (played) {
      const tA = teamMap[m.team_a.id];
      const tB = teamMap[m.team_b.id];

      tA.J++;
      tB.J++;
      tA.GP += scoreA;
      tA.GC += scoreB;
      tB.GP += scoreB;
      tB.GC += scoreA;

      if (scoreA > scoreB) {
        tA.V++;
        tA.P += 3;
        tB.D++;
      } else if (scoreB > scoreA) {
        tB.V++;
        tB.P += 3;
        tA.D++;
      } else {
        tA.E++;
        tA.P += 1;
        tB.E++;
        tB.P += 1;
      }
    }
  }

  const standingsList = Object.values(teamMap).map(t => {
    t.SG = t.GP - t.GC;
    return t;
  });

  standingsList.sort((a, b) => {
    if (b.P !== a.P) return b.P - a.P;
    if (b.SG !== a.SG) return b.SG - a.SG;
    if (b.GP !== a.GP) return b.GP - a.GP;
    return a.team.name.localeCompare(b.team.name);
  });

  return standingsList;
}
