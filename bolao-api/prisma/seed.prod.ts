import {
  MatchStage,
  MatchStatus,
  PhaseStatus,
  PhaseType,
  PrismaClient,
  TournamentStatus,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const SEED_PROVIDER = 'worldcup2026';

type RawMatch = {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
};

type RawMatchesFile = {
  name: string;
  matches: RawMatch[];
};

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

function mapStage(match: RawMatch): MatchStage {
  if (match.group) {
    return MatchStage.groups;
  }

  switch (match.round) {
    case 'Round of 32':
      return 'round_of_32' as MatchStage;
    case 'Round of 16':
      return MatchStage.round_of_16;
    case 'Quarter-final':
      return MatchStage.quarterfinal;
    case 'Semi-final':
      return MatchStage.semifinal;
    case 'Match for third place':
      return MatchStage.third_place;
    case 'Final':
      return MatchStage.final;
    default:
      throw new Error(`Unsupported round in matches.json: ${match.round}`);
  }
}

async function ensureTournament(name: string) {
  const existing = await prisma.tournament.findFirst({ where: { name } });

  if (existing) {
    return prisma.tournament.update({
      where: { id: existing.id },
      data: { status: TournamentStatus.active },
    });
  }

  return prisma.tournament.create({
    data: {
      name,
      status: TournamentStatus.active,
    },
  });
}

async function ensurePhase(tournamentId: string, name: string, type: PhaseType, order: number) {
  const existing = await prisma.phase.findFirst({
    where: {
      tournament_id: tournamentId,
      name,
      type,
    },
  });

  if (existing) {
    return prisma.phase.update({
      where: { id: existing.id },
      data: {
        status: PhaseStatus.active,
        order,
      },
    });
  }

  return prisma.phase.create({
    data: {
      tournament_id: tournamentId,
      name,
      type,
      status: PhaseStatus.active,
      order,
    },
  });
}

async function ensureGroup(phaseId: string, name: string) {
  const existing = await prisma.group.findFirst({
    where: {
      phase_id: phaseId,
      name,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.group.create({
    data: {
      phase_id: phaseId,
      name,
    },
  });
}

async function ensureTeam(name: string) {
  return prisma.team.upsert({
    where: {
      provider_external_id: {
        provider: SEED_PROVIDER,
        external_id: slugify(name),
      },
    },
    update: {
      name,
    },
    create: {
      provider: SEED_PROVIDER,
      external_id: slugify(name),
      name,
    },
  });
}

async function ensureGroupTeam(groupId: string, teamId: string) {
  return prisma.groupTeam.upsert({
    where: {
      group_id_team_id: {
        group_id: groupId,
        team_id: teamId,
      },
    },
    update: {},
    create: {
      group_id: groupId,
      team_id: teamId,
    },
  });
}

async function ensureMatch(params: {
  match: RawMatch;
  phaseId: string;
  groupId?: string;
  teamAId: string;
  teamBId: string;
}) {
  const { match, phaseId, groupId, teamAId, teamBId } = params;
  const externalId = slugify(
    `${match.round}-${match.date}-${match.time}-${match.team1}-${match.team2}`,
  );

  return prisma.match.upsert({
    where: {
      provider_external_id: {
        provider: SEED_PROVIDER,
        external_id: externalId,
      },
    },
    update: {
      phase_id: phaseId,
      group_id: groupId,
      stage: mapStage(match),
      round: match.round,
      team_a_id: teamAId,
      team_b_id: teamBId,
      scheduled_at: parseDateTime(match.date, match.time),
      started_at: null,
      ended_at: null,
      status: MatchStatus.upcoming,
    },
    create: {
      phase_id: phaseId,
      group_id: groupId,
      stage: mapStage(match),
      round: match.round,
      team_a_id: teamAId,
      team_b_id: teamBId,
      scheduled_at: parseDateTime(match.date, match.time),
      status: MatchStatus.upcoming,
      provider: SEED_PROVIDER,
      external_id: externalId,
    },
  });
}

async function main() {
  const jsonPath = path.join(__dirname, '../matches.json');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(rawData) as RawMatchesFile;

  console.log('Seeding production fixtures from matches.json...');

  const tournament = await ensureTournament(data.name || 'World Cup 2026');
  const groupPhase = await ensurePhase(tournament.id, 'Fase de Grupos', PhaseType.groups, 1);
  const knockoutPhase = await ensurePhase(tournament.id, 'Fase Eliminatoria', PhaseType.knockout, 2);

  const groupNames = Array.from(
    new Set(data.matches.filter((match) => match.group).map((match) => match.group as string)),
  );

  const groupMap = new Map<string, { id: string }>();
  for (const groupName of groupNames) {
    const group = await ensureGroup(groupPhase.id, groupName);
    groupMap.set(groupName, group);
  }

  const teamNames = Array.from(new Set(data.matches.flatMap((match) => [match.team1, match.team2])));
  const teamMap = new Map<string, { id: string }>();

  for (const teamName of teamNames) {
    const team = await ensureTeam(teamName);
    teamMap.set(teamName, team);
  }

  for (const match of data.matches) {
    const stage = mapStage(match);
    const phaseId = stage === MatchStage.groups ? groupPhase.id : knockoutPhase.id;
    const groupId = match.group ? groupMap.get(match.group)?.id : undefined;
    const teamA = teamMap.get(match.team1);
    const teamB = teamMap.get(match.team2);

    if (!teamA || !teamB) {
      throw new Error(`Missing seeded team for match: ${match.team1} vs ${match.team2}`);
    }

    await ensureMatch({
      match,
      phaseId,
      groupId,
      teamAId: teamA.id,
      teamBId: teamB.id,
    });

    if (groupId) {
      await ensureGroupTeam(groupId, teamA.id);
      await ensureGroupTeam(groupId, teamB.id);
    }
  }

  console.log('Production seed completed successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
