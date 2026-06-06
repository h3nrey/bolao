import { PrismaClient, PlayerPosition } from '@prisma/client';

const fallbackPlayers: Record<string, { name: string; position: PlayerPosition; number?: number }[]> = {
  'Mexico': [
    { name: 'Santiago Giménez', position: PlayerPosition.forward, number: 9 },
    { name: 'Edson Álvarez', position: PlayerPosition.midfielder, number: 4 },
    { name: 'Hirving Lozano', position: PlayerPosition.forward, number: 10 },
    { name: 'Luis Chávez', position: PlayerPosition.midfielder, number: 24 },
    { name: 'César Montes', position: PlayerPosition.defender, number: 3 },
    { name: 'Guillermo Ochoa', position: PlayerPosition.goalkeeper, number: 1 }
  ],
  'South Africa': [
    { name: 'Percy Tau', position: PlayerPosition.forward, number: 10 },
    { name: 'Teboho Mokoena', position: PlayerPosition.midfielder, number: 4 },
    { name: 'Ronwen Williams', position: PlayerPosition.goalkeeper, number: 1 },
    { name: 'Themba Zwane', position: PlayerPosition.midfielder, number: 18 },
    { name: 'Evidence Makgopa', position: PlayerPosition.forward, number: 9 }
  ],
  'South Korea': [
    { name: 'Son Heung-min', position: PlayerPosition.forward, number: 7 },
    { name: 'Kim Min-jae', position: PlayerPosition.defender, number: 4 },
    { name: 'Lee Kang-in', position: PlayerPosition.midfielder, number: 18 },
    { name: 'Hwang Hee-chan', position: PlayerPosition.forward, number: 11 },
    { name: 'Lee Jae-sung', position: PlayerPosition.midfielder, number: 10 }
  ],
  'Czech Republic': [
    { name: 'Patrik Schick', position: PlayerPosition.forward, number: 10 },
    { name: 'Tomáš Souček', position: PlayerPosition.midfielder, number: 22 },
    { name: 'Vladimír Coufal', position: PlayerPosition.defender, number: 5 },
    { name: 'Adam Hložek', position: PlayerPosition.forward, number: 9 },
    { name: 'Antonín Barák', position: PlayerPosition.midfielder, number: 7 }
  ],
  'Canada': [
    { name: 'Alphonso Davies', position: PlayerPosition.defender, number: 19 },
    { name: 'Jonathan David', position: PlayerPosition.forward, number: 10 },
    { name: 'Cyle Larin', position: PlayerPosition.forward, number: 17 },
    { name: 'Stephen Eustáquio', position: PlayerPosition.midfielder, number: 7 },
    { name: 'Tajon Buchanan', position: PlayerPosition.forward, number: 11 }
  ],
  'Bosnia & Herzegovina': [
    { name: 'Edin Džeko', position: PlayerPosition.forward, number: 11 },
    { name: 'Sead Kolašinac', position: PlayerPosition.defender, number: 3 },
    { name: 'Ermedin Demirović', position: PlayerPosition.forward, number: 10 },
    { name: 'Amar Dedić', position: PlayerPosition.defender, number: 2 },
    { name: 'Benjamin Tahirović', position: PlayerPosition.midfielder, number: 8 }
  ],
  'Qatar': [
    { name: 'Akram Afif', position: PlayerPosition.forward, number: 11 },
    { name: 'Almoez Ali', position: PlayerPosition.forward, number: 19 },
    { name: 'Hassan Al-Haydos', position: PlayerPosition.midfielder, number: 10 },
    { name: 'Boualem Khoukhi', position: PlayerPosition.defender, number: 16 }
  ],
  'Switzerland': [
    { name: 'Granit Xhaka', position: PlayerPosition.midfielder, number: 10 },
    { name: 'Manuel Akanji', position: PlayerPosition.defender, number: 5 },
    { name: 'Yann Sommer', position: PlayerPosition.goalkeeper, number: 1 },
    { name: 'Breel Embolo', position: PlayerPosition.forward, number: 7 },
    { name: 'Remo Freuler', position: PlayerPosition.midfielder, number: 8 }
  ],
  'Brazil': [
    { name: 'Vinícius Júnior', position: PlayerPosition.forward, number: 7 },
    { name: 'Rodrygo Goes', position: PlayerPosition.forward, number: 10 },
    { name: 'Neymar Jr', position: PlayerPosition.forward, number: 11 },
    { name: 'Bruno Guimarães', position: PlayerPosition.midfielder, number: 5 },
    { name: 'Marquinhos', position: PlayerPosition.defender, number: 4 },
    { name: 'Alisson Becker', position: PlayerPosition.goalkeeper, number: 1 },
    { name: 'Lucas Paquetá', position: PlayerPosition.midfielder, number: 8 }
  ],
  'Morocco': [
    { name: 'Achraf Hakimi', position: PlayerPosition.defender, number: 2 },
    { name: 'Brahim Díaz', position: PlayerPosition.forward, number: 10 },
    { name: 'Yassine Bounou', position: PlayerPosition.goalkeeper, number: 1 },
    { name: 'Hakim Ziyech', position: PlayerPosition.forward, number: 7 },
    { name: 'Sofyan Amrabat', position: PlayerPosition.midfielder, number: 4 }
  ],
  'Haiti': [
    { name: 'Duckens Nazon', position: PlayerPosition.forward, number: 9 },
    { name: 'Frantzdy Pierrot', position: PlayerPosition.forward, number: 20 },
    { name: 'Danley Jean Jacques', position: PlayerPosition.midfielder, number: 17 }
  ],
  'Scotland': [
    { name: 'Scott McTominay', position: PlayerPosition.midfielder, number: 11 },
    { name: 'Andrew Robertson', position: PlayerPosition.defender, number: 3 },
    { name: 'John McGinn', position: PlayerPosition.midfielder, number: 7 },
    { name: 'Billy Gilmour', position: PlayerPosition.midfielder, number: 14 }
  ],
  'USA': [
    { name: 'Christian Pulisic', position: PlayerPosition.forward, number: 10 },
    { name: 'Weston McKennie', position: PlayerPosition.midfielder, number: 8 },
    { name: 'Folarin Balogun', position: PlayerPosition.forward, number: 20 },
    { name: 'Timothy Weah', position: PlayerPosition.forward, number: 21 },
    { name: 'Yunus Musah', position: PlayerPosition.midfielder, number: 6 }
  ],
  'Paraguay': [
    { name: 'Julio Enciso', position: PlayerPosition.forward, number: 19 },
    { name: 'Miguel Almirón', position: PlayerPosition.forward, number: 10 },
    { name: 'Antonio Sanabria', position: PlayerPosition.forward, number: 9 },
    { name: 'Gustavo Gómez', position: PlayerPosition.defender, number: 15 }
  ],
  'Australia': [
    { name: 'Nestory Irankunda', position: PlayerPosition.forward, number: 17 },
    { name: 'Jackson Irvine', position: PlayerPosition.midfielder, number: 22 },
    { name: 'Harry Souttar', position: PlayerPosition.defender, number: 19 },
    { name: 'Mathew Ryan', position: PlayerPosition.goalkeeper, number: 1 }
  ],
  'Turkey': [
    { name: 'Arda Güler', position: PlayerPosition.midfielder, number: 8 },
    { name: 'Hakan Çalhanoğlu', position: PlayerPosition.midfielder, number: 10 },
    { name: 'Kenan Yıldız', position: PlayerPosition.forward, number: 19 },
    { name: 'Barış Alper Yılmaz', position: PlayerPosition.forward, number: 21 }
  ],
  'Germany': [
    { name: 'Florian Wirtz', position: PlayerPosition.midfielder, number: 17 },
    { name: 'Jamal Musiala', position: PlayerPosition.midfielder, number: 10 },
    { name: 'Kai Havertz', position: PlayerPosition.forward, number: 7 },
    { name: 'Joshua Kimmich', position: PlayerPosition.midfielder, number: 6 },
    { name: 'Antonio Rüdiger', position: PlayerPosition.defender, number: 2 },
    { name: 'Manuel Neuer', position: PlayerPosition.goalkeeper, number: 1 }
  ],
  'Curaçao': [
    { name: 'Juninho Bacuna', position: PlayerPosition.midfielder, number: 7 },
    { name: 'Leandro Bacuna', position: PlayerPosition.midfielder, number: 8 },
    { name: 'Kenji Gorré', position: PlayerPosition.forward, number: 11 }
  ],
  'Ivory Coast': [
    { name: 'Sébastien Haller', position: PlayerPosition.forward, number: 22 },
    { name: 'Franck Kessié', position: PlayerPosition.midfielder, number: 8 },
    { name: 'Simon Adingra', position: PlayerPosition.forward, number: 24 },
    { name: 'Ousmane Diomande', position: PlayerPosition.defender, number: 2 }
  ],
  'Ecuador': [
    { name: 'Moisés Caicedo', position: PlayerPosition.midfielder, number: 23 },
    { name: 'Enner Valencia', position: PlayerPosition.forward, number: 13 },
    { name: 'Piero Hincapié', position: PlayerPosition.defender, number: 3 },
    { name: 'Willian Pacho', position: PlayerPosition.defender, number: 6 }
  ],
  'Netherlands': [
    { name: 'Virgil van Dijk', position: PlayerPosition.defender, number: 4 },
    { name: 'Frenkie de Jong', position: PlayerPosition.midfielder, number: 21 },
    { name: 'Cody Gakpo', position: PlayerPosition.forward, number: 11 },
    { name: 'Xavi Simons', position: PlayerPosition.midfielder, number: 7 }
  ],
  'Japan': [
    { name: 'Kaoru Mitoma', position: PlayerPosition.forward, number: 7 },
    { name: 'Takefusa Kubo', position: PlayerPosition.forward, number: 20 },
    { name: 'Wataru Endo', position: PlayerPosition.midfielder, number: 6 },
    { name: 'Takumi Minamino', position: PlayerPosition.forward, number: 8 }
  ],
  'Sweden': [
    { name: 'Viktor Gyökeres', position: PlayerPosition.forward, number: 9 },
    { name: 'Alexander Isak', position: PlayerPosition.forward, number: 11 },
    { name: 'Dejan Kulusevski', position: PlayerPosition.midfielder, number: 21 },
    { name: 'Victor Lindelöf', position: PlayerPosition.defender, number: 3 }
  ],
  'Tunisia': [
    { name: 'Ellyes Skhiri', position: PlayerPosition.midfielder, number: 4 },
    { name: 'Hannibal Mejbri', position: PlayerPosition.midfielder, number: 10 },
    { name: 'Youssef Msakni', position: PlayerPosition.forward, number: 7 }
  ],
  'Belgium': [
    { name: 'Kevin De Bruyne', position: PlayerPosition.midfielder, number: 7 },
    { name: 'Romelu Lukaku', position: PlayerPosition.forward, number: 9 },
    { name: 'Jérémy Doku', position: PlayerPosition.forward, number: 11 },
    { name: 'Leandro Trossard,', position: PlayerPosition.forward, number: 10 }
  ],
  'Egypt': [
    { name: 'Mohamed Salah', position: PlayerPosition.forward, number: 10 },
    { name: 'Omar Marmoush', position: PlayerPosition.forward, number: 7 },
    { name: 'Mostafa Mohamed', position: PlayerPosition.forward, number: 11 }
  ],
  'Iran': [
    { name: 'Mehdi Taremi', position: PlayerPosition.forward, number: 9 },
    { name: 'Sardar Azmoun', position: PlayerPosition.forward, number: 20 },
    { name: 'Alireza Jahanbakhsh', position: PlayerPosition.forward, number: 7 }
  ],
  'New Zealand': [
    { name: 'Chris Wood', position: PlayerPosition.forward, number: 9 },
    { name: 'Liberato Cacace', position: PlayerPosition.defender, number: 3 },
    { name: 'Sarpreet Singh', position: PlayerPosition.midfielder, number: 10 }
  ],
  'Spain': [
    { name: 'Lamine Yamal', position: PlayerPosition.forward, number: 19 },
    { name: 'Rodri Cascante', position: PlayerPosition.midfielder, number: 16 },
    { name: 'Pedri González', position: PlayerPosition.midfielder, number: 20 },
    { name: 'Nico Williams', position: PlayerPosition.forward, number: 17 }
  ],
  'Cape Verde': [
    { name: 'Ryan Mendes', position: PlayerPosition.forward, number: 20 },
    { name: 'Logan Costa', position: PlayerPosition.defender, number: 4 },
    { name: 'Bebé', position: PlayerPosition.forward, number: 10 }
  ],
  'Saudi Arabia': [
    { name: 'Salem Al-Dawsari', position: PlayerPosition.midfielder, number: 10 },
    { name: 'Firas Al-Buraikan', position: PlayerPosition.forward, number: 9 },
    { name: 'Saleh Al-Shehri', position: PlayerPosition.forward, number: 11 }
  ],
  'Uruguay': [
    { name: 'Federico Valverde', position: PlayerPosition.midfielder, number: 15 },
    { name: 'Darwin Núñez', position: PlayerPosition.forward, number: 19 },
    { name: 'Ronald Araújo', position: PlayerPosition.defender, number: 4 },
    { name: 'Luis Suárez', position: PlayerPosition.forward, number: 9 }
  ],
  'France': [
    { name: 'Kylian Mbappé', position: PlayerPosition.forward, number: 10 },
    { name: 'Antoine Griezmann', position: PlayerPosition.forward, number: 7 },
    { name: 'Ousmane Dembélé', position: PlayerPosition.forward, number: 11 },
    { name: 'William Saliba', position: PlayerPosition.defender, number: 17 }
  ],
  'Senegal': [
    { name: 'Sadio Mané', position: PlayerPosition.forward, number: 10 },
    { name: 'Nicolas Jackson', position: PlayerPosition.forward, number: 9 },
    { name: 'Kalidou Koulibaly', position: PlayerPosition.defender, number: 3 },
    { name: 'Ismaïla Sarr', position: PlayerPosition.forward, number: 18 }
  ],
  'Iraq': [
    { name: 'Aymen Hussein', position: PlayerPosition.forward, number: 18 },
    { name: 'Ali Jasim', position: PlayerPosition.midfielder, number: 17 }
  ],
  'Norway': [
    { name: 'Erling Haaland', position: PlayerPosition.forward, number: 9 },
    { name: 'Martin Ødegaard', position: PlayerPosition.midfielder, number: 10 },
    { name: 'Alexander Sørloth', position: PlayerPosition.forward, number: 11 }
  ],
  'Argentina': [
    { name: 'Lionel Messi', position: PlayerPosition.forward, number: 10 },
    { name: 'Lautaro Martínez', position: PlayerPosition.forward, number: 22 },
    { name: 'Enzo Fernández', position: PlayerPosition.midfielder, number: 24 },
    { name: 'Emiliano Martínez', position: PlayerPosition.goalkeeper, number: 1 }
  ],
  'Algeria': [
    { name: 'Riyad Mahrez', position: PlayerPosition.forward, number: 7 },
    { name: 'Rayán Aït-Nouri', position: PlayerPosition.defender, number: 3 },
    { name: 'Ismaël Bennacer', position: PlayerPosition.midfielder, number: 22 }
  ],
  'Austria': [
    { name: 'Marcel Sabitzer', position: PlayerPosition.midfielder, number: 9 },
    { name: 'Konrad Laimer', position: PlayerPosition.midfielder, number: 24 },
    { name: 'David Alaba', position: PlayerPosition.defender, number: 8 }
  ],
  'Jordan': [
    { name: 'Musa Al-Taamari', position: PlayerPosition.forward, number: 10 },
    { name: 'Yazan Al-Naimat', position: PlayerPosition.forward, number: 11 }
  ],
  'Portugal': [
    { name: 'Cristiano Ronaldo', position: PlayerPosition.forward, number: 7 },
    { name: 'Bruno Fernandes', position: PlayerPosition.midfielder, number: 8 },
    { name: 'Bernardo Silva', position: PlayerPosition.midfielder, number: 10 },
    { name: 'Rúben Dias', position: PlayerPosition.defender, number: 4 }
  ],
  'DR Congo': [
    { name: 'Yoane Wissa', position: PlayerPosition.forward, number: 20 },
    { name: 'Chancel Mbemba', position: PlayerPosition.defender, number: 22 }
  ],
  'Uzbekistan': [
    { name: 'Eldor Shomurodov', position: PlayerPosition.forward, number: 14 },
    { name: 'Abbosbek Fayzullaev', position: PlayerPosition.midfielder, number: 22 }
  ],
  'Colombia': [
    { name: 'James Rodríguez', position: PlayerPosition.midfielder, number: 10 },
    { name: 'Luis Díaz', position: PlayerPosition.forward, number: 17 },
    { name: 'Jhon Durán', position: PlayerPosition.forward, number: 9 }
  ],
  'England': [
    { name: 'Jude Bellingham', position: PlayerPosition.midfielder, number: 10 },
    { name: 'Harry Kane', position: PlayerPosition.forward, number: 9 },
    { name: 'Bukayo Saka', position: PlayerPosition.forward, number: 7 },
    { name: 'Cole Palmer', position: PlayerPosition.midfielder, number: 24 }
  ],
  'Croatia': [
    { name: 'Luka Modrić', position: PlayerPosition.midfielder, number: 10 },
    { name: 'Mateo Kovačić', position: PlayerPosition.midfielder, number: 8 },
    { name: 'Joško Gvardiol', position: PlayerPosition.defender, number: 4 }
  ],
  'Ghana': [
    { name: 'Mohammed Kudus', position: PlayerPosition.midfielder, number: 20 },
    { name: 'Iñaki Williams', position: PlayerPosition.forward, number: 19 },
    { name: 'Thomas Partey', position: PlayerPosition.midfielder, number: 5 }
  ],
  'Panama': [
    { name: 'Adalberto Carrasquilla', position: PlayerPosition.midfielder, number: 8 },
    { name: 'Michael Amir Murillo', position: PlayerPosition.defender, number: 2 }
  ]
};

function mapPosition(str: string): PlayerPosition {
  const s = (str || '').toLowerCase();
  if (s.includes('goal') || s.includes('keeper')) return PlayerPosition.goalkeeper;
  if (s.includes('defen') || s.includes('back') || s.includes('guard')) return PlayerPosition.defender;
  if (s.includes('mid') || s.includes('cent') || s.includes('half')) return PlayerPosition.midfielder;
  return PlayerPosition.forward;
}

export async function populatePlayers(prisma: PrismaClient) {
  console.log('⚽ Iniciando população de jogadores...');

  const teams = await prisma.team.findMany({
    include: { players: true }
  });

  console.log(`Encontrados ${teams.length} seleções cadastrados no banco.`);

  for (const team of teams) {
    const teamName = team.name;
    let playersToCreate: { name: string; position: PlayerPosition; number?: number }[] = [];

    // Try fetching from public API
    try {
      const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?t=${encodeURIComponent(teamName)}`;
      console.log(`Buscando jogadores online para: ${teamName}...`);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json() as any;
        if (data && data.player && Array.isArray(data.player) && data.player.length > 0) {
          console.log(`API retornou ${data.player.length} jogadores para ${teamName}.`);
          playersToCreate = data.player.slice(0, 15).map((p: any) => ({
            name: p.strPlayer,
            position: mapPosition(p.strPosition),
            number: p.strNumber ? parseInt(p.strNumber, 10) : undefined
          }));
        }
      }
    } catch (apiError) {
      console.warn(`⚠️ Erro ao consultar a API para ${teamName}:`, apiError.message || apiError);
    }

    // Fallback if API didn't return any players
    if (playersToCreate.length === 0) {
      console.log(`ℹ️ Usando fallback de jogadores para ${teamName}.`);
      playersToCreate = fallbackPlayers[teamName] || [
        { name: `Craque de ${teamName}`, position: PlayerPosition.forward, number: 10 },
        { name: `Goleiro de ${teamName}`, position: PlayerPosition.goalkeeper, number: 1 },
        { name: `Zagueiro de ${teamName}`, position: PlayerPosition.defender, number: 3 },
        { name: `Volante de ${teamName}`, position: PlayerPosition.midfielder, number: 5 }
      ];
    }

    // Delete existing generic players to overwrite with rich player list
    await prisma.player.deleteMany({
      where: { team_id: team.id }
    });

    // Bulk create
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
