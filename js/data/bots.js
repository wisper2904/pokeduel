// ============================================================================
// RANKED BOT CHAMPIONS (RED, CYNTHIA, MISTY, MORTY, STEVEN STONE)
// ============================================================================
const RANKED_BOT_TRAINERS = [
  {
    id: "bot_red",
    name: "Red (Champion)",
    title: "Lenda do Monte Prata",
    rating: 2180,
    tier: "Master League",
    avatar: "charizard",
    deck: [0, 1, 20, 25, 23, 7], // Charizard EX, Pikachu EX, Zapdos EX, Snorlax R, Blastoise EX, Venusaur EX
    desc: "Equipe clássica de Kanto: alto impacto com Charizard, avanço do Zapdos e defesa de Snorlax e Blastoise."
  },
  {
    id: "bot_cynthia",
    name: "Cynthia (Champion)",
    title: "Mestre de Sinnoh & Dragões",
    rating: 2350,
    tier: "Grandmaster",
    avatar: "mega_rayquaza",
    deck: [15, 29, 14, 12, 11, 13], // Rayquaza EX, Mega Rayquaza UX, Lucario EX, Dialga Origin UX, Palkia Origin UX, Gengar EX
    desc: "Dragões de Sinnoh: Roar of Time de 160 Dano, Extreme Speed e Dragon Ascent 150 Dourado."
  },
  {
    id: "bot_misty",
    name: "Misty (Gym Leader)",
    title: "A Garota Moleca Toda-Água",
    rating: 1890,
    tier: "Champion League",
    avatar: "gyarados",
    deck: [18, 19, 16, 5, 23, 2], // Magikarp UC, Gyarados R, Greninja EX, Lapras EX, Blastoise EX, Squirtle UC
    desc: "Evolução tática de Magikarp para Gyarados (+10 DMG), Water Shuriken dourado e sono com Lapras."
  },
  {
    id: "bot_morty",
    name: "Morty (Ghost Master)",
    title: "O Místico dos Fantasmas",
    rating: 1980,
    tier: "Master League",
    avatar: "mega_gengar",
    deck: [13, 27, 26, 17, 24, 6], // Gengar EX, Mega Gengar UX, Lunala UX, Mew EX, Deoxys Attack EX, Charmander UC
    desc: "Fantasmas com Pass-Through sobre o campo, Shadow Tag para travar o inimigo e escudo Hyper Sonic do Mew."
  },
  {
    id: "bot_steven",
    name: "Steven Stone (Champion)",
    title: "Especialista em Fósseis e Minerais",
    rating: 2240,
    tier: "Master League",
    avatar: "zapdos",
    deck: [8, 14, 21, 22, 20, 0], // Kabutops EX, Lucario EX, Articuno EX, Moltres EX, Zapdos EX, Charizard EX
    desc: "Trio de Aves Lendárias com Soar (infiltração sobre Pokémon terrestres), Freeze, Burn e Aura Sphere."
  }
];
let windowCurrentSelectedBot = RANKED_BOT_TRAINERS[0];
