import { PrismaClient, TournamentStatus, PhaseType, PhaseStatus, MatchStatus, MatchStage, PlayerPosition, PredictionType, PointType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando o banco de dados...');
  
  // Deletar em ordem reversa para respeitar chaves estrangeiras
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

  console.log('🛡️ Criando seleções e jogadores...');
  
  // 1. Brasil
  const teamBrasil = await prisma.team.create({
    data: {
      name: 'Brasil',
      flag_emoji: '🇧🇷',
      flag_url: 'https://flagcdn.com/w320/br.png',
      players: {
        create: [
          { name: 'Neymar Jr', number: 10, position: PlayerPosition.forward },
          { name: 'Vinicius Jr', number: 7, position: PlayerPosition.forward },
          { name: 'Casemiro', number: 5, position: PlayerPosition.midfielder },
          { name: 'Marquinhos', number: 4, position: PlayerPosition.defender },
          { name: 'Alisson', number: 1, position: PlayerPosition.goalkeeper },
        ],
      },
    },
    include: { players: true },
  });

  // 2. Argentina
  const teamArgentina = await prisma.team.create({
    data: {
      name: 'Argentina',
      flag_emoji: '🇦🇷',
      flag_url: 'https://flagcdn.com/w320/ar.png',
      players: {
        create: [
          { name: 'Lionel Messi', number: 10, position: PlayerPosition.forward },
          { name: 'Emiliano Martínez', number: 23, position: PlayerPosition.goalkeeper },
          { name: 'Rodrigo De Paul', number: 7, position: PlayerPosition.midfielder },
          { name: 'Angel Di Maria', number: 11, position: PlayerPosition.forward },
        ],
      },
    },
    include: { players: true },
  });

  // 3. França
  const teamFranca = await prisma.team.create({
    data: {
      name: 'França',
      flag_emoji: '🇫🇷',
      flag_url: 'https://flagcdn.com/w320/fr.png',
      players: {
        create: [
          { name: 'Kylian Mbappé', number: 10, position: PlayerPosition.forward },
          { name: 'Antoine Griezmann', number: 7, position: PlayerPosition.midfielder },
          { name: 'Olivier Giroud', number: 9, position: PlayerPosition.forward },
          { name: 'Hugo Lloris', number: 1, position: PlayerPosition.goalkeeper },
        ],
      },
    },
    include: { players: true },
  });

  // 4. Alemanha
  const teamAlemanha = await prisma.team.create({
    data: {
      name: 'Alemanha',
      flag_emoji: '🇩🇪',
      flag_url: 'https://flagcdn.com/w320/de.png',
      players: {
        create: [
          { name: 'Kai Havertz', number: 7, position: PlayerPosition.forward },
          { name: 'Manuel Neuer', number: 1, position: PlayerPosition.goalkeeper },
          { name: 'Joshua Kimmich', number: 6, position: PlayerPosition.midfielder },
          { name: 'Thomas Müller', number: 13, position: PlayerPosition.forward },
        ],
      },
    },
    include: { players: true },
  });

  // 5. Espanha
  const teamEspanha = await prisma.team.create({
    data: {
      name: 'Espanha',
      flag_emoji: '🇪🇸',
      flag_url: 'https://flagcdn.com/w320/es.png',
      players: {
        create: [
          { name: 'Álvaro Morata', number: 7, position: PlayerPosition.forward },
          { name: 'Pedri', number: 8, position: PlayerPosition.midfielder },
          { name: 'Gavi', number: 9, position: PlayerPosition.midfielder },
          { name: 'Unai Simón', number: 23, position: PlayerPosition.goalkeeper },
        ],
      },
    },
    include: { players: true },
  });

  // 6. Portugal
  const teamPortugal = await prisma.team.create({
    data: {
      name: 'Portugal',
      flag_emoji: '🇵🇹',
      flag_url: 'https://flagcdn.com/w320/pt.png',
      players: {
        create: [
          { name: 'Cristiano Ronaldo', number: 7, position: PlayerPosition.forward },
          { name: 'Bruno Fernandes', number: 8, position: PlayerPosition.midfielder },
          { name: 'Bernardo Silva', number: 10, position: PlayerPosition.midfielder },
          { name: 'Diogo Costa', number: 22, position: PlayerPosition.goalkeeper },
        ],
      },
    },
    include: { players: true },
  });

  // 7. Uruguai
  const teamUruguai = await prisma.team.create({
    data: {
      name: 'Uruguai',
      flag_emoji: '🇺🇾',
      flag_url: 'https://flagcdn.com/w320/uy.png',
      players: {
        create: [
          { name: 'Luis Suárez', number: 9, position: PlayerPosition.forward },
          { name: 'Federico Valverde', number: 15, position: PlayerPosition.midfielder },
          { name: 'Darwin Núñez', number: 11, position: PlayerPosition.forward },
        ],
      },
    },
    include: { players: true },
  });

  // 8. Croácia
  const teamCroacia = await prisma.team.create({
    data: {
      name: 'Croácia',
      flag_emoji: '🇭🇷',
      flag_url: 'https://flagcdn.com/w320/hr.png',
      players: {
        create: [
          { name: 'Luka Modrić', number: 10, position: PlayerPosition.midfielder },
          { name: 'Ivan Perišić', number: 4, position: PlayerPosition.forward },
          { name: 'Dominik Livaković', number: 1, position: PlayerPosition.goalkeeper },
        ],
      },
    },
    include: { players: true },
  });

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

  const phaseOitavas = await prisma.phase.create({
    data: {
      tournament_id: tournament.id,
      name: 'Oitavas de Final',
      type: PhaseType.knockout,
      status: PhaseStatus.upcoming,
      order: 2,
    },
  });

  console.log('👥 Criando grupos...');
  const groupA = await prisma.group.create({
    data: {
      phase_id: phaseGrupos.id,
      name: 'Grupo A',
    },
  });

  const groupB = await prisma.group.create({
    data: {
      phase_id: phaseGrupos.id,
      name: 'Grupo B',
    },
  });

  console.log('🔗 Associando seleções aos grupos (GroupTeam)...');
  const groupTeamsData = [
    // Grupo A
    { group_id: groupA.id, team_id: teamBrasil.id },
    { group_id: groupA.id, team_id: teamAlemanha.id },
    { group_id: groupA.id, team_id: teamPortugal.id },
    { group_id: groupA.id, team_id: teamEspanha.id },
    // Grupo B
    { group_id: groupB.id, team_id: teamArgentina.id },
    { group_id: groupB.id, team_id: teamFranca.id },
    { group_id: groupB.id, team_id: teamUruguai.id },
    { group_id: groupB.id, team_id: teamCroacia.id },
  ];

  for (const gt of groupTeamsData) {
    await prisma.groupTeam.create({ data: gt });
  }

  console.log('⚽ Criando partidas e eventos...');
  const now = new Date();
  
  // 1. Partida Finalizada: Brasil x Alemanha
  const match1 = await prisma.match.create({
    data: {
      phase_id: phaseGrupos.id,
      group_id: groupA.id,
      stage: MatchStage.groups,
      team_a_id: teamBrasil.id,
      team_b_id: teamAlemanha.id,
      scheduled_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
      started_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      ended_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 105 * 60 * 1000), // 105 mins depois
      status: MatchStatus.finished,
    },
  });

  const pNeymar = teamBrasil.players.find(p => p.name === 'Neymar Jr')!;
  const pVini = teamBrasil.players.find(p => p.name === 'Vinicius Jr')!;
  const pHavertz = teamAlemanha.players.find(p => p.name === 'Kai Havertz')!;

  await prisma.matchEvent.createMany({
    data: [
      {
        match_id: match1.id,
        team_id: teamBrasil.id,
        player_id: pNeymar.id,
        type: 'goal',
        minute: 12,
        period: 'regular',
      },
      {
        match_id: match1.id,
        team_id: teamAlemanha.id,
        player_id: pHavertz.id,
        type: 'goal',
        minute: 44,
        period: 'regular',
      },
      {
        match_id: match1.id,
        team_id: teamBrasil.id,
        player_id: pVini.id,
        type: 'goal',
        minute: 82,
        period: 'regular',
      },
    ],
  });

  // 2. Partida Finalizada: Argentina x França
  const match2 = await prisma.match.create({
    data: {
      phase_id: phaseGrupos.id,
      group_id: groupB.id,
      stage: MatchStage.groups,
      team_a_id: teamArgentina.id,
      team_b_id: teamFranca.id,
      scheduled_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
      started_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      ended_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 105 * 60 * 1000),
      status: MatchStatus.finished,
    },
  });

  const pMessi = teamArgentina.players.find(p => p.name === 'Lionel Messi')!;
  const pDiMaria = teamArgentina.players.find(p => p.name === 'Angel Di Maria')!;
  const pMbappe = teamFranca.players.find(p => p.name === 'Kylian Mbappé')!;

  await prisma.matchEvent.createMany({
    data: [
      {
        match_id: match2.id,
        team_id: teamArgentina.id,
        player_id: pMessi.id,
        type: 'goal',
        minute: 23,
        period: 'regular',
      },
      {
        match_id: match2.id,
        team_id: teamFranca.id,
        player_id: pMbappe.id,
        type: 'goal',
        minute: 38,
        period: 'regular',
      },
      {
        match_id: match2.id,
        team_id: teamArgentina.id,
        player_id: pDiMaria.id,
        type: 'goal',
        minute: 55,
        period: 'regular',
      },
      {
        match_id: match2.id,
        team_id: teamFranca.id,
        player_id: pMbappe.id,
        type: 'goal',
        minute: 75,
        period: 'regular',
      },
      {
        match_id: match2.id,
        team_id: teamArgentina.id,
        player_id: pMessi.id,
        type: 'goal',
        minute: 88,
        period: 'regular',
      },
    ],
  });

  // 3. Partida Ao Vivo: Portugal x Espanha
  const match3 = await prisma.match.create({
    data: {
      phase_id: phaseGrupos.id,
      group_id: groupA.id,
      stage: MatchStage.groups,
      team_a_id: teamPortugal.id,
      team_b_id: teamEspanha.id,
      scheduled_at: new Date(now.getTime() - 45 * 60 * 1000), // Começou há 45 mins
      started_at: new Date(now.getTime() - 45 * 60 * 1000),
      status: MatchStatus.live,
    },
  });

  const pRonaldo = teamPortugal.players.find(p => p.name === 'Cristiano Ronaldo')!;
  const pPedri = teamEspanha.players.find(p => p.name === 'Pedri')!;

  await prisma.matchEvent.createMany({
    data: [
      {
        match_id: match3.id,
        team_id: teamPortugal.id,
        player_id: pRonaldo.id,
        type: 'goal',
        minute: 15,
        period: 'regular',
      },
      {
        match_id: match3.id,
        team_id: teamEspanha.id,
        player_id: pPedri.id,
        type: 'goal',
        minute: 42,
        period: 'regular',
      },
    ],
  });

  // 4. Próximas Partidas (upcoming)
  const match4 = await prisma.match.create({
    data: {
      phase_id: phaseGrupos.id,
      group_id: groupA.id,
      stage: MatchStage.groups,
      team_a_id: teamBrasil.id,
      team_b_id: teamPortugal.id,
      scheduled_at: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Amanhã
      status: MatchStatus.upcoming,
    },
  });

  const match5 = await prisma.match.create({
    data: {
      phase_id: phaseGrupos.id,
      group_id: groupB.id,
      stage: MatchStage.groups,
      team_a_id: teamArgentina.id,
      team_b_id: teamUruguai.id,
      scheduled_at: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Depois de amanhã
      status: MatchStatus.upcoming,
    },
  });

  const match6 = await prisma.match.create({
    data: {
      phase_id: phaseGrupos.id,
      group_id: groupA.id,
      stage: MatchStage.groups,
      team_a_id: teamAlemanha.id,
      team_b_id: teamEspanha.id,
      scheduled_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: MatchStatus.upcoming,
    },
  });

  console.log('🔮 Criando palpites de usuários...');
  
  // Palpites do Pedro (pedro@example.com)
  const predPedroM1 = await prisma.prediction.create({
    data: {
      user_id: userPedro.id,
      match_id: match1.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 2 }, // Brasil 2
          { type: PredictionType.score_b, value_int: 1 }, // Alemanha 1 (Placar exato!)
          { type: PredictionType.first_goal_team, value_team_id: teamBrasil.id },
          { type: PredictionType.first_goal_player, value_player_id: pNeymar.id },
        ],
      },
    },
  });

  const predPedroM2 = await prisma.prediction.create({
    data: {
      user_id: userPedro.id,
      match_id: match2.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 2 }, // Argentina 2
          { type: PredictionType.score_b, value_int: 2 }, // França 2 (Errou)
        ],
      },
    },
  });

  const predPedroM3 = await prisma.prediction.create({
    data: {
      user_id: userPedro.id,
      match_id: match3.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 2 }, // Portugal 2
          { type: PredictionType.score_b, value_int: 1 }, // Espanha 1
        ],
      },
    },
  });

  const predPedroM4 = await prisma.prediction.create({
    data: {
      user_id: userPedro.id,
      match_id: match4.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 3 }, // Brasil 3
          { type: PredictionType.score_b, value_int: 1 }, // Portugal 1
        ],
      },
    },
  });

  // Palpites do Henry (henry@example.com)
  const predHenryM1 = await prisma.prediction.create({
    data: {
      user_id: userHenry.id,
      match_id: match1.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 3 }, // Brasil 3
          { type: PredictionType.score_b, value_int: 0 }, // Alemanha 0 (Acertou o vencedor)
        ],
      },
    },
  });

  const predHenryM2 = await prisma.prediction.create({
    data: {
      user_id: userHenry.id,
      match_id: match2.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 3 }, // Argentina 3
          { type: PredictionType.score_b, value_int: 2 }, // França 2 (Placar exato!)
          { type: PredictionType.first_goal_team, value_team_id: teamArgentina.id },
          { type: PredictionType.first_goal_player, value_player_id: pMessi.id },
        ],
      },
    },
  });

  // Palpites do João (joao@example.com)
  const predJoaoM1 = await prisma.prediction.create({
    data: {
      user_id: userJoao.id,
      match_id: match1.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 1 },
          { type: PredictionType.score_b, value_int: 2 }, // Errou tudo
        ],
      },
    },
  });

  const predJoaoM2 = await prisma.prediction.create({
    data: {
      user_id: userJoao.id,
      match_id: match2.id,
      items: {
        create: [
          { type: PredictionType.score_a, value_int: 0 },
          { type: PredictionType.score_b, value_int: 4 }, // Errou tudo
        ],
      },
    },
  });

  console.log('📈 Criando pontuações de palpites (PredictionPoints)...');
  
  // Pedro:
  // Match 1: Placar Exato (15 pts) + Acerto do Primeiro Autor do Gol (5 pts) = 20 pts
  await prisma.predictionPoint.createMany({
    data: [
      { prediction_id: predPedroM1.id, type: PointType.exact_score, pts_earned: 15 },
      { prediction_id: predPedroM1.id, type: PointType.first_goal_player, pts_earned: 5 },
      { prediction_id: predPedroM1.id, type: PointType.first_goal_team, pts_earned: 3 },
    ],
  });

  // Match 2: Errou tudo = 0 pts
  await prisma.predictionPoint.create({
    data: { prediction_id: predPedroM2.id, type: PointType.result, pts_earned: 0 },
  });

  // Henry:
  // Match 1: Acertou vencedor apenas (5 pts)
  await prisma.predictionPoint.create({
    data: { prediction_id: predHenryM1.id, type: PointType.result, pts_earned: 5 },
  });

  // Match 2: Placar Exato (15 pts) + Autor gol (5 pts) = 20 pts
  await prisma.predictionPoint.createMany({
    data: [
      { prediction_id: predHenryM2.id, type: PointType.exact_score, pts_earned: 15 },
      { prediction_id: predHenryM2.id, type: PointType.first_goal_player, pts_earned: 5 },
      { prediction_id: predHenryM2.id, type: PointType.first_goal_team, pts_earned: 3 },
    ],
  });

  // João: Errou ambos = 0 pts

  console.log('🏆 Criando classificações (Rankings)...');
  await prisma.ranking.createMany({
    data: [
      // Rankings da Fase de Grupos
      {
        user_id: userPedro.id,
        tournament_id: tournament.id,
        phase_id: phaseGrupos.id,
        pts_matches: 2,
        pts_total: 23,
        position: 2,
      },
      {
        user_id: userHenry.id,
        tournament_id: tournament.id,
        phase_id: phaseGrupos.id,
        pts_matches: 2,
        pts_total: 28,
        position: 1,
      },
      {
        user_id: userJoao.id,
        tournament_id: tournament.id,
        phase_id: phaseGrupos.id,
        pts_matches: 2,
        pts_total: 0,
        position: 3,
      },
      {
        user_id: userMaria.id,
        tournament_id: tournament.id,
        phase_id: phaseGrupos.id,
        pts_matches: 0,
        pts_total: 0,
        position: 4,
      },
      // Rankings Gerais do Torneio (phase_id: null)
      {
        user_id: userPedro.id,
        tournament_id: tournament.id,
        phase_id: null,
        pts_matches: 2,
        pts_total: 23,
        position: 2,
      },
      {
        user_id: userHenry.id,
        tournament_id: tournament.id,
        phase_id: null,
        pts_matches: 2,
        pts_total: 28,
        position: 1,
      },
      {
        user_id: userJoao.id,
        tournament_id: tournament.id,
        phase_id: null,
        pts_matches: 2,
        pts_total: 0,
        position: 3,
      },
      {
        user_id: userMaria.id,
        tournament_id: tournament.id,
        phase_id: null,
        pts_matches: 0,
        pts_total: 0,
        position: 4,
      },
    ],
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
