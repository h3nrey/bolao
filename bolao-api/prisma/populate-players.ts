import { PrismaClient, PlayerPosition } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const teamNameMapping: Record<string, string> = {
  'Bosnia & Herzegovina': 'Bosnia-Herzegovina',
  'Cape Verde': 'Cape Verde Islands',
  'DR Congo': 'Congo DR',
  'Czech Republic': 'Czechia',
  'USA': 'United States',
};

function mapPosition(str: string): PlayerPosition {
  const s = (str || '').toLowerCase();
  if (s.includes('goal') || s.includes('keeper')) return PlayerPosition.goalkeeper;
  if (s.includes('defen') || s.includes('back') || s.includes('guard')) return PlayerPosition.defender;
  if (s.includes('mid') || s.includes('cent') || s.includes('half')) return PlayerPosition.midfielder;
  return PlayerPosition.forward;
}

function getProgrammaticNumber(position: PlayerPosition, positionCounts: Record<PlayerPosition, number>): number {
  const count = positionCounts[position];
  positionCounts[position] = count + 1;

  const goalkeeperNumbers = [1, 12, 22];
  const defenderNumbers = [2, 3, 4, 5, 6, 13, 14, 15, 23, 24, 25];
  const midfielderNumbers = [8, 10, 16, 17, 18, 26, 27, 28];
  const forwardNumbers = [7, 9, 11, 19, 20, 21, 29, 30];

  switch (position) {
    case PlayerPosition.goalkeeper:
      return goalkeeperNumbers[count] ?? (22 + count);
    case PlayerPosition.defender:
      return defenderNumbers[count] ?? (25 + count);
    case PlayerPosition.midfielder:
      return midfielderNumbers[count] ?? (28 + count);
    case PlayerPosition.forward:
      return forwardNumbers[count] ?? (30 + count);
  }
}

export async function populatePlayers(prisma: PrismaClient) {
  console.log('⚽ Iniciando população de jogadores...');

  const playersFilePath = path.join(__dirname, 'players.json');
  if (!fs.existsSync(playersFilePath)) {
    throw new Error(`Arquivo players.json não encontrado em: ${playersFilePath}`);
  }

  const playersData = JSON.parse(fs.readFileSync(playersFilePath, 'utf-8'));
  if (!playersData || !Array.isArray(playersData.teams)) {
    throw new Error('Formato inválido do arquivo players.json');
  }

  const teams = await prisma.team.findMany();
  console.log(`Encontrados ${teams.length} seleções cadastradas no banco.`);

  for (const team of teams) {
    const teamName = team.name;
    const mappedName = teamNameMapping[teamName] || teamName;
    const jsonTeam = playersData.teams.find((t: any) => t.name === mappedName);

    let playersToCreate: { name: string; position: PlayerPosition; number?: number }[] = [];

    if (jsonTeam && Array.isArray(jsonTeam.squad)) {
      const positionCounts: Record<PlayerPosition, number> = {
        [PlayerPosition.goalkeeper]: 0,
        [PlayerPosition.defender]: 0,
        [PlayerPosition.midfielder]: 0,
        [PlayerPosition.forward]: 0,
      };

      playersToCreate = jsonTeam.squad
        .filter((p: any) => p.position !== 'Coach')
        .map((p: any) => {
          const position = mapPosition(p.position);
          return {
            name: p.name,
            position,
            number: getProgrammaticNumber(position, positionCounts),
          };
        });
    } else {
      console.warn(`⚠️ Time ${teamName} (${mappedName}) não encontrado no players.json. Usando fallbacks.`);
      playersToCreate = [
        { name: `Goleiro de ${teamName}`, position: PlayerPosition.goalkeeper, number: 1 },
        { name: `Zagueiro de ${teamName}`, position: PlayerPosition.defender, number: 3 },
        { name: `Volante de ${teamName}`, position: PlayerPosition.midfielder, number: 5 },
        { name: `Craque de ${teamName}`, position: PlayerPosition.forward, number: 10 },
      ];
    }

    try {
      // Clear existing players for this team
      await prisma.player.deleteMany({
        where: { team_id: team.id }
      });
    } catch (deleteError: any) {
      console.warn(`⚠️ Erro ao tentar limpar jogadores existentes para ${teamName}: ${deleteError.message}`);
    }

    // Bulk create players
    for (const p of playersToCreate) {
      await prisma.player.create({
        data: {
          team_id: team.id,
          name: p.name,
          position: p.position,
          number: p.number ?? null,
          is_active: true
        }
      });
    }

    console.log(`✅ ${teamName}: ${playersToCreate.length} jogadores criados.`);
  }

  console.log('🎉 População de jogadores finalizada com sucesso!');
}

// Standalone execution support
if (require.main === module) {
  const prisma = new PrismaClient();
  populatePlayers(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
