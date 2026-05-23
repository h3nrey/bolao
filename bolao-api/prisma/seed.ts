import { PrismaClient, TournamentStatus, PhaseType, PhaseStatus, MatchStatus, MatchStage, PlayerPosition, PredictionType, PointType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const teamDetails: { [key: string]: { flag_emoji: string, code: string } } = {
  'Mexico': { flag_emoji: '🇲🇽', code: 'mx' },
  'South Africa': { flag_emoji: '🇿🇦', code: 'za' },
  'South Korea': { flag_emoji: '🇰🇷', code: 'kr' },
  'Czech Republic': { flag_emoji: '🇨🇿', code: 'cz' },
  'Canada': { flag_emoji: '🇨🇦', code: 'ca' },
  'Bosnia & Herzegovina': { flag_emoji: '🇧🇦', code: 'ba' },
  'Qatar': { flag_emoji: '🇶🇦', code: 'qa' },
  'Switzerland': { flag_emoji: '🇨🇭', code: 'ch' },
  'Brazil': { flag_emoji: '🇧🇷', code: 'br' },
  'Morocco': { flag_emoji: '🇲🇦', code: 'ma' },
  'Haiti': { flag_emoji: '🇭🇹', code: 'ht' },
  'Scotland': { flag_emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', code: 'gb-sct' },
  'USA': { flag_emoji: '🇺🇸', code: 'us' },
  'Paraguay': { flag_emoji: '🇵🇾', code: 'py' },
  'Australia': { flag_emoji: '🇦🇺', code: 'au' },
  'Turkey': { flag_emoji: '🇹🇷', code: 'tr' },
  'Germany': { flag_emoji: '🇩🇪', code: 'de' },
  'Curaçao': { flag_emoji: '🇨🇼', code: 'cw' },
  'Ivory Coast': { flag_emoji: '🇨🇮', code: 'ci' },
  'Ecuador': { flag_emoji: '🇪🇨', code: 'ec' },
  'Netherlands': { flag_emoji: '🇳🇱', code: 'nl' },
  'Japan': { flag_emoji: '🇯🇵', code: 'jp' },
  'Sweden': { flag_emoji: '🇸🇪', code: 'se' },
  'Tunisia': { flag_emoji: '🇹🇳', code: 'tn' },
  'Belgium': { flag_emoji: '🇧🇪', code: 'be' },
  'Egypt': { flag_emoji: '🇪🇬', code: 'eg' },
  'Iran': { flag_emoji: '🇮🇷', code: 'ir' },
  'New Zealand': { flag_emoji: '🇳🇿', code: 'nz' },
  'Spain': { flag_emoji: '🇪🇸', code: 'es' },
  'Cape Verde': { flag_emoji: '🇨🇻', code: 'cv' },
  'Saudi Arabia': { flag_emoji: '🇸🇦', code: 'sa' },
  'Uruguay': { flag_emoji: '🇺🇾', code: 'uy' },
  'France': { flag_emoji: '🇫🇷', code: 'fr' },
  'Senegal': { flag_emoji: '🇸🇳', code: 'sn' },
  'Iraq': { flag_emoji: '🇮🇶', code: 'iq' },
  'Norway': { flag_emoji: '🇳🇴', code: 'no' },
  'Argentina': { flag_emoji: '🇦🇷', code: 'ar' },
  'Algeria': { flag_emoji: '🇩🇿', code: 'dz' },
  'Austria': { flag_emoji: '🇦🇹', code: 'at' },
  'Jordan': { flag_emoji: '🇯🇴', code: 'jo' },
  'Portugal': { flag_emoji: '🇵🇹', code: 'pt' },
  'DR Congo': { flag_emoji: '🇨🇩', code: 'cd' },
  'Uzbekistan': { flag_emoji: '🇺🇿', code: 'uz' },
  'Colombia': { flag_emoji: '🇨🇴', code: 'co' },
  'England': { flag_emoji: '🏴\u200d󠁢󠁥󠁮󠁧󠁿', code: 'gb-eng' },
  'Croatia': { flag_emoji: '🇭🇷', code: 'hr' },
  'Ghana': { flag_emoji: '🇬🇭', code: 'gh' },
  'Panama': { flag_emoji: '🇵🇦', code: 'pa' },
};

function parseDateTime(dateStr: string, timeStr: string): Date {
  const matches = timeStr.match(/^(\d{2}:\d{2})\s+UTC([+-]\d+)?$/);
  if (matches) {
    const time = matches[1];
    const offset = matches[2];
    if (!offset) {
      return new Date(`${dateStr}T${time}:00Z`);
    }
    const offsetNum = parseInt(offset, 10);
    const sign = offsetNum >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetNum);
    const offsetStr = `${sign}${String(absOffset).padStart(2, '0')}:00`;
    return new Date(`${dateStr}T${time}:00${offsetStr}`);
  }
  return new Date(`${dateStr}T00:00:00Z`);
}

async function main() {
  console.log('🧹 Limpando o banco de dados...');
  
  await prisma.predictionPoint.deleteMany();
  await prisma.predictionItem.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.ranking.deleteMany();
  await prisma.matchEvent.deleteMany();
  await prisma.matchExtraPeriod.deleteMany();
  await prisma.bracketSlot.deleteMany();
  await prisma.match.deleteMany();
  await prisma.groupTeam.deleteMany();
  await prisma.group.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.oauthAccount.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Banco de dados limpo!');

  console.log('👤 Criando usuários...');
  const userPedro = await prisma.user.create({
    data: {
      name: 'Pedro Santos',
      email: 'pedro@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });

  const userHenry = await prisma.user.create({
    data: {
      name: 'Henry K.',
      email: 'henry@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });

  const userJoao = await prisma.user.create({
    data: {
      name: 'João Silva',
      email: 'joao@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });

  const userMaria = await prisma.user.create({
    data: {
      name: 'Maria Oliveira',
      email: 'maria@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    },
  });

  console.log('🛡️ Criando seleções e jogadores de forma dinâmica...');
  const teamsToCreate = Object.keys(teamDetails);
  const teamInstances: { [name: string]: any } = {};

  for (const name of teamsToCreate) {
    const details = teamDetails[name] || { flag_emoji: '🏳️', code: 'un' };
    const flag_emoji = details.flag_emoji;
    const flag_url = `https://flagcdn.com/w320/${details.code}.png`;

    const team = await prisma.team.create({
      data: {
        name,
        flag_emoji,
        flag_url,
        players: {
          create: [
            { name: `Goleiro de ${name}`, number: 1, position: PlayerPosition.goalkeeper },
            { name: `Craque de ${name}`, number: 10, position: PlayerPosition.forward },
          ]
        }
      },
      include: { players: true }
    });
    teamInstances[name] = team;
  }

  console.log('🏆 Criando torneio e fases...');
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Copa do Mundo 2026',
      status: TournamentStatus.active,
    },
  });

  const phaseGrupos = await prisma.phase.create({
    data: {
      tournament_id: tournament.id,
      name: 'Fase de Grupos',
      type: PhaseType.groups,
      status: PhaseStatus.active,
      order: 1,
    },
  });

  // Criando os 12 grupos do Grupo A ao Grupo L em pt-BR
  console.log('👥 Criando os 12 grupos da Copa...');
  const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const groupInstances: { [name: string]: any } = {};

  for (const letter of groupLetters) {
    const groupNamePt = `Grupo ${letter}`;
    const group = await prisma.group.create({
      data: {
        phase_id: phaseGrupos.id,
        name: groupNamePt,
      }
    });
    groupInstances[`Group ${letter}`] = group;
  }

  console.log('⚽ Importando e parseando matches.json...');
  const jsonPath = path.join(__dirname, '../matches.json');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(rawData);

  // Filtrar apenas partidas da fase de grupos (que contêm a propriedade group no JSON)
  const jsonGroupMatches = data.matches.filter((m: any) => m.group && m.group.startsWith('Group'));

  console.log(`🔗 Associando seleções aos grupos (GroupTeam) e criando ${jsonGroupMatches.length} partidas...`);
  
  const createdGroupTeams = new Set<string>();
  const now = new Date();
  
  // Guardaremos referências das 4 primeiras partidas para palpites específicos
  let matchMexicoSA: any = null;
  let matchKoreaCzech: any = null;
  let matchCanadaBosnia: any = null;
  let matchUSAParaguay: any = null;

  for (let idx = 0; idx < jsonGroupMatches.length; idx++) {
    const m = jsonGroupMatches[idx];
    const teamAName = m.team1;
    const teamBName = m.team2;
    
    const teamA = teamInstances[teamAName];
    const teamB = teamInstances[teamBName];
    
    if (!teamA || !teamB) {
      console.warn(`⚠️ Time não encontrado para partida: ${teamAName} x ${teamBName}`);
      continue;
    }

    const groupJsonName = m.group; // e.g. "Group A"
    const group = groupInstances[groupJsonName];

    if (!group) {
      console.warn(`⚠️ Grupo não encontrado: ${groupJsonName}`);
      continue;
    }

    // Criar as associações de grupo se não existirem
    const gtAKey = `${group.id}-${teamA.id}`;
    if (!createdGroupTeams.has(gtAKey)) {
      await prisma.groupTeam.create({
        data: { group_id: group.id, team_id: teamA.id }
      });
      createdGroupTeams.add(gtAKey);
    }

    const gtBKey = `${group.id}-${teamB.id}`;
    if (!createdGroupTeams.has(gtBKey)) {
      await prisma.groupTeam.create({
        data: { group_id: group.id, team_id: teamB.id }
      });
      createdGroupTeams.add(gtBKey);
    }

    // Datas originais
    let scheduled_at = parseDateTime(m.date, m.time);
    let status: MatchStatus = MatchStatus.upcoming;
    let started_at: Date | null = null;
    let ended_at: Date | null = null;

    // Configurando status reais simulados para as 3 primeiras partidas
    if (teamAName === 'Mexico' && teamBName === 'South Africa') {
      // 1. Partida Finalizada: México 2 x 1 África do Sul
      status = MatchStatus.finished;
      scheduled_at = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 dias atrás
      started_at = new Date(scheduled_at.getTime());
      ended_at = new Date(scheduled_at.getTime() + 105 * 60 * 1000);
    } else if (teamAName === 'South Korea' && teamBName === 'Czech Republic') {
      // 2. Partida Finalizada: Coreia do Sul 1 x 1 República Tcheca
      status = MatchStatus.finished;
      scheduled_at = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 dia atrás
      started_at = new Date(scheduled_at.getTime());
      ended_at = new Date(scheduled_at.getTime() + 105 * 60 * 1000);
    } else if (teamAName === 'Canada' && teamBName === 'Bosnia & Herzegovina') {
      // 3. Partida Ao Vivo: Canadá 1 x 0 Bósnia
      status = MatchStatus.live;
      scheduled_at = new Date(now.getTime() - 45 * 60 * 1000); // Começou há 45 mins
      started_at = new Date(scheduled_at.getTime());
    } else if (teamAName === 'USA' && teamBName === 'Paraguay') {
      // 4. Próxima Partida importante da Rodada 1
      status = MatchStatus.upcoming;
      scheduled_at = new Date(now.getTime() + 3 * 60 * 60 * 1000); // Em 3 horas
    }

    const match = await prisma.match.create({
      data: {
        phase_id: phaseGrupos.id,
        group_id: group.id,
        stage: MatchStage.groups,
        team_a_id: teamA.id,
        team_b_id: teamB.id,
        scheduled_at,
        started_at,
        ended_at,
        status,
      }
    });

    if (teamAName === 'Mexico' && teamBName === 'South Africa') {
      matchMexicoSA = match;
      // Adicionar gols
      const starMex = teamA.players.find((p: any) => p.number === 10)!;
      const starSA = teamB.players.find((p: any) => p.number === 10)!;
      await prisma.matchEvent.createMany({
        data: [
          { match_id: match.id, team_id: teamA.id, player_id: starMex.id, type: 'goal', minute: 15, period: 'regular' },
          { match_id: match.id, team_id: teamB.id, player_id: starSA.id, type: 'goal', minute: 44, period: 'regular' },
          { match_id: match.id, team_id: teamA.id, player_id: starMex.id, type: 'goal', minute: 78, period: 'regular' },
        ]
      });
    } else if (teamAName === 'South Korea' && teamBName === 'Czech Republic') {
      matchKoreaCzech = match;
      const starKor = teamA.players.find((p: any) => p.number === 10)!;
      const starCze = teamB.players.find((p: any) => p.number === 10)!;
      await prisma.matchEvent.createMany({
        data: [
          { match_id: match.id, team_id: teamB.id, player_id: starCze.id, type: 'goal', minute: 31, period: 'regular' },
          { match_id: match.id, team_id: teamA.id, player_id: starKor.id, type: 'goal', minute: 70, period: 'regular' },
        ]
      });
    } else if (teamAName === 'Canada' && teamBName === 'Bosnia & Herzegovina') {
      matchCanadaBosnia = match;
      const starCan = teamA.players.find((p: any) => p.number === 10)!;
      await prisma.matchEvent.create({
        data: { match_id: match.id, team_id: teamA.id, player_id: starCan.id, type: 'goal', minute: 22, period: 'regular' }
      });
    } else if (teamAName === 'USA' && teamBName === 'Paraguay') {
      matchUSAParaguay = match;
    }
  }

  console.log('🔮 Criando palpites de usuários...');
  // 1. Pedro Santos
  const predPedroM1 = await prisma.prediction.create({
    data: {
      user_id: userPedro.id,
      match_id: matchMexicoSA.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 2 },
          { type: PredictionType.score_b, value_int: 1 },
        ]
      }
    }
  });

  const predPedroM2 = await prisma.prediction.create({
    data: {
      user_id: userPedro.id,
      match_id: matchKoreaCzech.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 1 },
          { type: PredictionType.score_b, value_int: 1 },
        ]
      }
    }
  });

  const predPedroM3 = await prisma.prediction.create({
    data: {
      user_id: userPedro.id,
      match_id: matchCanadaBosnia.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 2 },
          { type: PredictionType.score_b, value_int: 0 },
        ]
      }
    }
  });

  const predPedroM4 = await prisma.prediction.create({
    data: {
      user_id: userPedro.id,
      match_id: matchUSAParaguay.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 2 },
          { type: PredictionType.score_b, value_int: 1 },
        ]
      }
    }
  });

  // 2. Henry K.
  const predHenryM1 = await prisma.prediction.create({
    data: {
      user_id: userHenry.id,
      match_id: matchMexicoSA.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 1 },
          { type: PredictionType.score_b, value_int: 0 },
        ]
      }
    }
  });

  const predHenryM2 = await prisma.prediction.create({
    data: {
      user_id: userHenry.id,
      match_id: matchKoreaCzech.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 2 },
          { type: PredictionType.score_b, value_int: 2 },
        ]
      }
    }
  });

  // 3. João Silva
  const predJoaoM1 = await prisma.prediction.create({
    data: {
      user_id: userJoao.id,
      match_id: matchMexicoSA.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 0 },
          { type: PredictionType.score_b, value_int: 2 },
        ]
      }
    }
  });

  // 4. Maria Oliveira
  const predMariaM2 = await prisma.prediction.create({
    data: {
      user_id: userMaria.id,
      match_id: matchKoreaCzech.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 1 },
          { type: PredictionType.score_b, value_int: 1 },
        ]
      }
    }
  });

  console.log('📈 Criando pontuações de palpites (PredictionPoints)...');
  // Pedro: México 2x1 (Exato: 15 pts) + Coreia 1x1 (Exato: 15 pts) = 30 pts
  await prisma.predictionPoint.createMany({
    data: [
      { prediction_id: predPedroM1.id, type: PointType.exact_score, pts_earned: 15 },
      { prediction_id: predPedroM2.id, type: PointType.exact_score, pts_earned: 15 },
    ]
  });

  // Henry: México 1x0 (Acertou Vencedor: 5 pts) + Coreia 2x2 (Acertou Empate: 5 pts) = 10 pts
  await prisma.predictionPoint.createMany({
    data: [
      { prediction_id: predHenryM1.id, type: PointType.result, pts_earned: 5 },
      { prediction_id: predHenryM2.id, type: PointType.result, pts_earned: 5 },
    ]
  });

  // João: México 0x2 (Errou tudo: 0 pts)
  await prisma.predictionPoint.create({
    data: { prediction_id: predJoaoM1.id, type: PointType.result, pts_earned: 0 }
  });

  // Maria: Coreia 1x1 (Exato: 15 pts)
  await prisma.predictionPoint.create({
    data: { prediction_id: predMariaM2.id, type: PointType.exact_score, pts_earned: 15 }
  });

  console.log('🏆 Criando classificações de ranking baseadas nos pontos...');
  await prisma.ranking.createMany({
    data: [
      // Rankings da Fase de Grupos
      { user_id: userPedro.id, tournament_id: tournament.id, phase_id: phaseGrupos.id, pts_matches: 2, pts_total: 30, position: 1 },
      { user_id: userMaria.id, tournament_id: tournament.id, phase_id: phaseGrupos.id, pts_matches: 1, pts_total: 15, position: 2 },
      { user_id: userHenry.id, tournament_id: tournament.id, phase_id: phaseGrupos.id, pts_matches: 2, pts_total: 10, position: 3 },
      { user_id: userJoao.id, tournament_id: tournament.id, phase_id: phaseGrupos.id, pts_matches: 1, pts_total: 0, position: 4 },

      // Rankings Gerais do Torneio
      { user_id: userPedro.id, tournament_id: tournament.id, phase_id: null, pts_matches: 2, pts_total: 30, position: 1 },
      { user_id: userMaria.id, tournament_id: tournament.id, phase_id: null, pts_matches: 1, pts_total: 15, position: 2 },
      { user_id: userHenry.id, tournament_id: tournament.id, phase_id: null, pts_matches: 2, pts_total: 10, position: 3 },
      { user_id: userJoao.id, tournament_id: tournament.id, phase_id: null, pts_matches: 1, pts_total: 0, position: 4 },
    ]
  });

  console.log('🎉 Semente do banco de dados completada com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
