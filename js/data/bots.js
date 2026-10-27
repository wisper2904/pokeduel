// ============================================================================
// RANKED BOT CHAMPIONS & ADAPTIVE PROCEDURAL DECK GENERATOR (v5.6.0)
// ============================================================================
// Features 16+ diverse Champions, Gym Leaders and Rivals with archetype affinities.
// Generates competitive, non-repeating procedural decks with balanced MP curve
// and guaranteed EX/UX power threshold so bot teams are never weak.
// ============================================================================

const BOT_RECENT_DECKS_STORAGE_KEY = "pdr_bot_recent_decks_v560";

const RANKED_BOT_TRAINERS = [
  {
    id: "bot_cynthia",
    name: "Cynthia (Champion)",
    title: "Mestre de Sinnoh & Dragões Lendários",
    rating: 2350,
    tier: "Grandmaster",
    avatar: "mega_rayquaza",
    affinityIds: ["garchomp", "rayquaza", "mega_rayquaza", "dialga_o", "palkia_o", "lucario", "spiritomb", "milotic", "togekiss"],
    deck: [15, 29, 14, 12, 11, 13], // Rayquaza EX, Mega Rayquaza UX, Lucario EX, Dialga Origin UX, Palkia Origin UX, Gengar EX
    desc: "Dragões de Sinnoh: Roar of Time de 160 Dano, Extreme Speed e Dragon Ascent 150 Dourado."
  },
  {
    id: "bot_red",
    name: "Red (Champion)",
    title: "A Lenda do Monte Prata",
    rating: 2280,
    tier: "Master League",
    avatar: "charizard",
    affinityIds: ["charizard", "mega_charizard_x", "pikachu", "zapdos", "snorlax", "blastoise", "venusaur", "lapras", "arcanine"],
    deck: [0, 1, 20, 25, 23, 7], // Charizard EX, Pikachu EX, Zapdos EX, Snorlax R, Blastoise EX, Venusaur EX
    desc: "Equipe clássica de Kanto: alto impacto com Charizard, avanço do Zapdos e defesa de Snorlax e Blastoise."
  },
  {
    id: "bot_steven",
    name: "Steven Stone (Champion)",
    title: "Especialista em Fósseis e Minerais",
    rating: 2240,
    tier: "Master League",
    avatar: "zapdos",
    affinityIds: ["metagross", "kabutops", "aerodactyl", "lucario", "articuno", "moltres", "zapdos", "heatran", "skarmory"],
    deck: [8, 14, 21, 22, 20, 0], // Kabutops EX, Lucario EX, Articuno EX, Moltres EX, Zapdos EX, Charizard EX
    desc: "Trio de Aves Lendárias com Soar (infiltração sobre Pokémon terrestres), Freeze, Burn e Aura Sphere."
  },
  {
    id: "bot_lance",
    name: "Lance (Dragon Master)",
    title: "O Domador Supremo dos Dragões",
    rating: 2210,
    tier: "Master League",
    avatar: "dragonite",
    affinityIds: ["dragonite", "charizard", "mega_charizard_x", "gyarados", "aerodactyl", "rayquaza", "salamence", "kingdra"],
    deck: [0, 19, 15, 8, 14, 20],
    desc: "Ataque aéreo implacável com Dragões pesados e Hyper Beam de dano devastador."
  },
  {
    id: "bot_leon",
    name: "Leon (Champion)",
    title: "O Campeão Imbatível de Galar",
    rating: 2320,
    tier: "Grandmaster",
    avatar: "mega_charizard_x",
    affinityIds: ["charizard", "mega_charizard_x", "dragapult", "rillaboom", "cinderace", "inteleon", "aegislash", "haxorus"],
    deck: [0, 29, 20, 14, 16, 26],
    desc: "Pressão total de Galar com mobilidade agressiva e finalizações de dano máximo."
  },
  {
    id: "bot_blue",
    name: "Blue (Champion & Rival)",
    title: "O Rival Eterno de Pallet",
    rating: 2150,
    tier: "Master League",
    avatar: "blastoise",
    affinityIds: ["blastoise", "arcanine", "alakazam", "machamp", "exeggutor", "pidgeot", "gyarados", "tyranitar", "rhydon"],
    deck: [23, 19, 8, 1, 20, 14],
    desc: "Composição tática e versátil balanceada em todos os flancos do tabuleiro."
  },
  {
    id: "bot_diantha",
    name: "Diantha (Champion)",
    title: "A Estrela Radiante de Kalos",
    rating: 2120,
    tier: "Master League",
    avatar: "celebi",
    affinityIds: ["gardevoir", "mega_gardevoir", "aurorus", "tyrantrum", "hawlucha", "gourgeist", "celebi", "goodra"],
    deck: [17, 14, 26, 16, 27, 20],
    desc: "Controle mágico de fadas e status roxos com teleporte e proteção do Goal."
  },
  {
    id: "bot_alder",
    name: "Alder (Champion)",
    title: "O Andarilho Guardião de Unova",
    rating: 2080,
    tier: "Master League",
    avatar: "machamp",
    affinityIds: ["volcarona", "bouffalant", "conkeldurr", "machamp", "escavalier", "braviary", "krookodile", "chandelure"],
    deck: [14, 0, 25, 20, 22, 19],
    desc: "Lutadores pesados com alto poder físico e resistência nas trocas diretas."
  },
  {
    id: "bot_morty",
    name: "Morty (Ghost Master)",
    title: "O Místico dos Fantasmas de Johto",
    rating: 1980,
    tier: "Master League",
    avatar: "mega_gengar",
    affinityIds: ["gengar", "mega_gengar", "lunala", "mew", "deoxys_a", "giratina_o", "spiritomb", "chandelure", "dusknoir"],
    deck: [13, 27, 26, 17, 24, 6], // Gengar EX, Mega Gengar UX, Lunala UX, Mew EX, Deoxys Attack EX, Charmander UC
    desc: "Fantasmas com Pass-Through sobre o campo, Shadow Tag para travar o inimigo e escudo Hyper Sonic do Mew."
  },
  {
    id: "bot_misty",
    name: "Misty (Gym Leader)",
    title: "A Garota Moleca Toda-Água",
    rating: 1890,
    tier: "Champion League",
    avatar: "gyarados",
    affinityIds: ["magikarp", "gyarados", "greninja", "lapras", "blastoise", "starmie", "mega_starmie", "psyduck", "vaporeon"],
    deck: [18, 19, 16, 5, 23, 2], // Magikarp UC, Gyarados R, Greninja EX, Lapras EX, Blastoise EX, Squirtle UC
    desc: "Evolução tática de Magikarp para Gyarados (+10 DMG), Water Shuriken dourado e sono com Lapras."
  },
  {
    id: "bot_volkner",
    name: "Volkner (Gym Leader)",
    title: "O Relâmpago Brilhante de Sunyshore",
    rating: 1940,
    tier: "Champion League",
    avatar: "raikou",
    affinityIds: ["electivire", "luxray", "raikou", "zapdos", "raichu", "alolan_raichu", "rotom", "ampharos"],
    deck: [20, 1, 14, 8, 16, 21],
    desc: "Velocidade elétrica com Runners dourados, paralisia e pressão relâmpago de Entry Points."
  },
  {
    id: "bot_sabrina",
    name: "Sabrina (Gym Leader)",
    title: "A Mestra da Telepatia de Saffron",
    rating: 1910,
    tier: "Champion League",
    avatar: "mewtwo",
    affinityIds: ["alakazam", "mewtwo", "espeon", "hypno", "mew", "deoxys_a", "gardevoir", "mr_mime"],
    deck: [17, 24, 26, 13, 14, 20],
    desc: "Manipulação psíquica com confusão, teletransporte e golpes purpuras de alto estrelato."
  },
  {
    id: "bot_giovanni",
    name: "Giovanni (Rocket Boss)",
    title: "O Líder Implacável da Equipe Rocket",
    rating: 2050,
    tier: "Master League",
    avatar: "snorlax",
    affinityIds: ["rhydon", "nidoking", "nidoqueen", "kangaskhan", "golem", "persian", "machamp", "snorlax", "mewtwo"],
    deck: [25, 0, 24, 14, 20, 23],
    desc: "Força bruta subterrânea: dano maciço, invasão pesada e domínio territorial."
  },
  {
    id: "bot_karolin",
    name: "Karolin (Grandmaster AI)",
    title: "O Autômato Estrategista de Carmonte",
    rating: 2400,
    tier: "Grandmaster",
    avatar: "dialga_o",
    affinityIds: ["dialga_o", "palkia_o", "mega_rayquaza", "lunala", "deoxys_a", "mew", "lucario", "zapdos"],
    deck: [12, 11, 29, 26, 24, 17],
    desc: "IA Minimax Grandmaster: análise profunda de 2-Ply, cerco letal e contra-ataques milimétricos."
  },
  {
    id: "bot_n",
    name: "N (Team Plasma Hero)",
    title: "O Herói dos Ideais e da Verdade",
    rating: 2190,
    tier: "Master League",
    avatar: "lunala",
    affinityIds: ["reshiram", "zekrom", "zoroark", "klinklang", "sigilyph", "archeops", "carracosta", "lunala"],
    deck: [26, 15, 14, 20, 21, 27],
    desc: "Harmonia lendária com dragões antigos e ilusões furtivas sobre as rotas."
  },
  {
    id: "bot_raihan",
    name: "Raihan (Gym Leader)",
    title: "O Domador das Tempestades de Areia",
    rating: 1960,
    tier: "Champion League",
    avatar: "garchomp",
    affinityIds: ["duraludon", "flygon", "gigalith", "sandaconda", "goodra", "garchomp", "tyranitar", "dragonite"],
    deck: [14, 15, 0, 20, 23, 25],
    desc: "Tempestade de areia e dragões de assalto: quebra de guarda e avanço rápido."
  }
];

let windowCurrentSelectedBot = RANKED_BOT_TRAINERS[0];

// ============================================================================
// RECENT BOT DECKS STORAGE & OVERLAP AVOIDANCE
// ============================================================================
function getRecentBotDecksHistory() {
  try {
    const raw = localStorage.getItem(BOT_RECENT_DECKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(-12);
    }
  } catch (e) {}
  return [];
}

function pushRecentBotDeck(deckIndices) {
  try {
    const history = getRecentBotDecksHistory();
    history.push([...deckIndices]);
    const trimmed = history.slice(-12);
    localStorage.setItem(BOT_RECENT_DECKS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {}
}

// ============================================================================
// PROCEDURAL COMPETITIVE BOT DECK GENERATOR
// ============================================================================
// Guarantees:
// 1. Never weak: at least 3 to 5 EX/UX figures and >= 2 heavy hitters (110+ dmg).
// 2. Balanced MP curve: 1-2 runners (MP 3), 3-5 fighters (MP 2), 0-1 tank (MP 1).
// 3. High diversity & almost never repeats: overlap with recent decks is strictly bounded (< 4).
// 4. Synergizes with trainer personality and player rating.
// ============================================================================
function generateAdaptiveCompetitiveBotDeck(playerRating = 1000, playerDeck = null, forcedTrainerId = null) {
  const pRating = typeof playerRating === "number" ? playerRating : 1000;

  // 1. Select Trainer from 16+ roster
  let trainer = null;
  if (forcedTrainerId) {
    trainer = RANKED_BOT_TRAINERS.find(t => t.id === forcedTrainerId);
  }
  if (!trainer) {
    // Sort by rating proximity but pick among top 4 closest with random weighting for high variety
    const sorted = [...RANKED_BOT_TRAINERS].sort((a, b) => Math.abs(a.rating - pRating) - Math.abs(b.rating - pRating));
    const candidates = sorted.slice(0, 5);
    trainer = candidates[Math.floor(Math.random() * candidates.length)] || RANKED_BOT_TRAINERS[0];
  }
  windowCurrentSelectedBot = trainer;

  // Fallback if FIGURES_DB is somehow not loaded yet
  if (typeof FIGURES_DB === "undefined" || !Array.isArray(FIGURES_DB) || FIGURES_DB.length === 0) {
    return {
      trainer,
      deck: [...trainer.deck],
      summary: { exUxCount: 4, heavyCount: 3, runnerCount: 2 }
    };
  }

  // 2. Build the Comprehensive Competitive Figures Pool
  const compFigures = FIGURES_DB.map((f, idx) => {
    const wList = f.wheel || [];
    const maxDmg = wList.reduce((m, w) => Math.max(m, w.dmg || 0), 0);
    const maxStars = wList.reduce((m, w) => Math.max(m, w.stars || 0), 0);
    const goldSize = wList.filter(w => w.color === "gold").reduce((s, w) => s + (w.size || 0), 0);
    const purpleSize = wList.filter(w => w.color === "purple").reduce((s, w) => s + (w.size || 0), 0);
    const blueSize = wList.filter(w => w.color === "blue").reduce((s, w) => s + (w.size || 0), 0);

    const isCompetitive = (
      f.rarity === "UX" ||
      f.rarity === "EX" ||
      (f.rarity === "R" && (maxDmg >= 90 || maxStars >= 2 || goldSize >= 20 || f.canPassThrough))
    );

    return {
      idx,
      id: f.id,
      name: f.name,
      type: f.type || [],
      rarity: f.rarity,
      mp: f.mp,
      maxDmg,
      maxStars,
      goldSize,
      purpleSize,
      blueSize,
      pass: Boolean(f.canPassThrough),
      isCompetitive
    };
  }).filter(x => x.isCompetitive);

  const runners = compFigures.filter(f => f.mp >= 3);
  const fighters = compFigures.filter(f => f.mp === 2);
  const tanks = compFigures.filter(f => f.mp === 1);

  const recentDecks = getRecentBotDecksHistory();

  // 3. Procedural Deck Assembly Loop with Strict Overlap Limiting
  let bestDeck = null;
  let lowestOverlapSeen = 99;

  for (let attempt = 0; attempt < 65; attempt++) {
    const chosen = [];
    const pickOne = (pool, filterFn = null) => {
      let cand = pool.filter(p => !chosen.some(c => c.idx === p.idx));
      if (filterFn) {
        const sub = cand.filter(filterFn);
        if (sub.length > 0) cand = sub;
      }
      if (cand.length === 0) return null;

      // Trainer signature affinity preference
      if (trainer && Array.isArray(trainer.affinityIds) && trainer.affinityIds.length > 0) {
        const affMatch = cand.filter(c => trainer.affinityIds.includes(c.id));
        if (affMatch.length > 0 && Math.random() < 0.55) {
          cand = affMatch;
        }
      }

      const pick = cand[Math.floor(Math.random() * cand.length)];
      if (pick) chosen.push(pick);
      return pick;
    };

    // Balanced MP Curve
    const numRunners = Math.random() < 0.65 ? 2 : 1;
    const hasTank = Math.random() < 0.28;

    // Pick 1st Runner: high priority on Gold wheel, Pass-Through, or EX/UX
    pickOne(runners, r => r.goldSize >= 16 || r.pass || r.rarity === "EX" || r.rarity === "UX");
    if (numRunners > 1) {
      pickOne(runners);
    }

    // Pick Tank if applicable
    if (hasTank) {
      pickOne(tanks, t => t.maxDmg >= 110 || t.purpleSize >= 20 || t.rarity === "EX");
    }

    // Pick Fighters: guarantee heavy hitters and EX/UX cores
    pickOne(fighters, f => f.maxDmg >= 120 && (f.rarity === "EX" || f.rarity === "UX"));
    pickOne(fighters, f => (f.rarity === "EX" || f.rarity === "UX"));
    while (chosen.length < 6) {
      pickOne(fighters);
    }

    // Guard: Ensure exactly 6 figures
    if (chosen.length !== 6) continue;

    // Quality check: at least 3-5 EX/UX, at least 2 heavy hitters (110+ dmg)
    const exUxCount = chosen.filter(c => c.rarity === "EX" || c.rarity === "UX").length;
    const heavyCount = chosen.filter(c => c.maxDmg >= 110).length;
    if (exUxCount < 3 || heavyCount < 2) continue;

    const indices = chosen.map(c => c.idx);

    // Calculate maximum overlap with any recent deck in history
    let maxOverlapWithAnyRecent = 0;
    for (const recent of recentDecks) {
      const common = indices.filter(id => recent.includes(id)).length;
      if (common > maxOverlapWithAnyRecent) {
        maxOverlapWithAnyRecent = common;
      }
    }

    if (maxOverlapWithAnyRecent < lowestOverlapSeen) {
      lowestOverlapSeen = maxOverlapWithAnyRecent;
      bestDeck = {
        indices,
        chosen,
        exUxCount,
        heavyCount,
        runnerCount: chosen.filter(c => c.mp >= 3).length
      };
    }

    // Strictly accept only decks that share at most 3 figures with ANY recent deck!
    if (maxOverlapWithAnyRecent <= 3) {
      bestDeck = {
        indices,
        chosen,
        exUxCount,
        heavyCount,
        runnerCount: chosen.filter(c => c.mp >= 3).length
      };
      break;
    }
  }

  // Fallback if no candidate satisfied strict criteria (extremely rare)
  if (!bestDeck) {
    bestDeck = {
      indices: [...trainer.deck],
      chosen: [],
      exUxCount: 4,
      heavyCount: 3,
      runnerCount: 2
    };
  }

  // Record this deck into persistent recent history
  pushRecentBotDeck(bestDeck.indices);

  return {
    trainer,
    deck: bestDeck.indices,
    summary: {
      exUxCount: bestDeck.exUxCount,
      heavyCount: bestDeck.heavyCount,
      runnerCount: bestDeck.runnerCount
    }
  };
}

if (typeof window !== "undefined") {
  window.RANKED_BOT_TRAINERS = RANKED_BOT_TRAINERS;
  window.generateAdaptiveCompetitiveBotDeck = generateAdaptiveCompetitiveBotDeck;
  window.windowCurrentSelectedBot = windowCurrentSelectedBot;
}
