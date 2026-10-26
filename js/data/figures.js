// ============================================================================
// POKÉMON FIGURES DATABASE (30 META FIGURES + 202 EXPANSION FIGURES)
// ============================================================================
const FIGURES_DB = [
  { id:"charizard", spriteKey:"charizard", name:"Charizard", rarity:"EX", type:"Fire/Flying", mp:2, level:4, clv:3, c1:"#ea580c",
    wheel:[{name:"Fire Spin 50x",color:"white",dmg:50,multiHit:true,stars:0,size:44},{name:"Dragon Claw",color:"gold",dmg:80,stars:0,size:24},{name:"Roar",color:"purple",dmg:0,stars:2,size:16,effect:"push"},{name:"Dodge",color:"blue",dmg:0,stars:0,size:12},{name:"Miss",color:"red",dmg:0,stars:0,size:4}] },
  { id:"pikachu", spriteKey:"pikachu", name:"Pikachu", rarity:"EX", type:"Electric", mp:3, level:10, clv:2, c1:"#facc15",
    wheel:[{name:"Thunderbolt",color:"white",dmg:110,stars:0,size:38},{name:"Quick Attack",color:"gold",dmg:70,stars:0,size:30},{name:"Thunder Wave",color:"purple",dmg:0,stars:2,size:16,effect:"paralyze"},{name:"Dodge",color:"blue",dmg:0,stars:0,size:12},{name:"Miss",color:"red",dmg:0,stars:0,size:4}] },
  { id:"squirtle", spriteKey:"squirtle", name:"Squirtle", rarity:"UC", type:"Water", mp:3, level:9, clv:2, c1:"#38bdf8",
    wheel:[{name:"Withdraw",color:"blue",dmg:0,stars:0,size:36},{name:"Rapid Spin 30x",color:"gold",dmg:30,multiHit:true,stars:0,size:36},{name:"Bubble",color:"white",dmg:60,stars:0,size:20},{name:"Miss",color:"red",dmg:0,stars:0,size:4}] },
  { id:"bulbasaur", spriteKey:"bulbasaur", name:"Bulbasaur", rarity:"UC", type:"Grass/Poison", mp:3, level:4, clv:2, c1:"#22c55e",
    wheel:[{name:"Sleep Powder",color:"purple",dmg:0,stars:2,size:36,effect:"sleep"},{name:"Vine Whip 40x",color:"white",dmg:40,multiHit:true,stars:0,size:40},{name:"Dodge",color:"blue",dmg:0,stars:0,size:20},{name:"Miss",color:"red",dmg:0,stars:0,size:4}] },
  { id:"eevee", spriteKey:"eevee", name:"Eevee", rarity:"UC", type:"Normal", mp:3, level:9, clv:1, c1:"#d97706",
    wheel:[{name:"Quick Attack",color:"gold",dmg:60,stars:0,size:40},{name:"Tackle",color:"white",dmg:70,stars:0,size:36},{name:"Focus Energy",color:"purple",dmg:0,stars:1,size:12,effect:"push"},{name:"Dodge",color:"blue",dmg:0,stars:0,size:12}] },
  { id:"lapras", spriteKey:"lapras", name:"Lapras", rarity:"EX", type:"Water/Ice", mp:2, level:10, clv:2, c1:"#0284c7",
    wheel:[{name:"Hydro Pump",color:"white",dmg:110,stars:0,size:42},{name:"Sing",color:"purple",dmg:0,stars:2,size:30,effect:"sleep"},{name:"Ice Shard",color:"gold",dmg:70,stars:0,size:16},{name:"Protect",color:"blue",dmg:0,stars:0,size:12}] },
  { id:"charmander", spriteKey:"charmander", name:"Charmander", rarity:"UC", type:"Fire", mp:3, level:8, clv:1, c1:"#f97316",
    wheel:[{name:"Flamethrower",color:"white",dmg:70,stars:0,size:44},{name:"Scratch",color:"white",dmg:50,stars:0,size:28},{name:"Smokescreen",color:"purple",dmg:0,stars:1,size:16,effect:"panic"},{name:"Dodge",color:"blue",dmg:0,stars:0,size:12}] },
  { id:"venusaur", spriteKey:"venusaur", name:"Venusaur", rarity:"EX", type:"Grass/Poison", mp:1, level:10, clv:3, c1:"#15803d",
    wheel:[{name:"Solar Beam",color:"white",dmg:140,stars:0,size:46},{name:"Sleep Powder",color:"purple",dmg:0,stars:3,size:30,effect:"sleep"},{name:"Toxic",color:"purple",dmg:0,stars:2,size:12,effect:"badpoison"},{name:"Protect",color:"blue",dmg:0,stars:0,size:12}] },
  { id:"kabutops", spriteKey:"kabutops", name:"Kabutops", rarity:"EX", type:"Rock/Water", mp:2, level:10, clv:2, c1:"#b45309",
    wheel:[{name:"Fury Cutter 40x",color:"white",dmg:40,multiHit:true,stars:0,size:42},{name:"Aqua Jet",color:"gold",dmg:80,stars:0,size:32},{name:"Ancient Power",color:"purple",dmg:0,stars:2,size:12,effect:"push"},{name:"Protect",color:"blue",dmg:0,stars:0,size:14}] },
  { id:"megastarmie", spriteKey:"megastarmie", name:"Mega Starmie", rarity:"UX", type:"Water/Psychic", mp:3, level:10, clv:3, c1:"#a855f7",
    wheel:[{name:"Psychic Spin 50x",color:"gold",dmg:50,multiHit:true,stars:0,size:40},{name:"Confuse Ray",color:"purple",dmg:0,stars:3,size:30,effect:"panic"},{name:"Hydro Cannon",color:"white",dmg:130,stars:0,size:18},{name:"Recover",color:"blue",dmg:0,stars:0,size:12}] },
  { id:"megalopunny", spriteKey:"megalopunny", name:"Mega Lopunny", rarity:"UX", type:"Normal/Fighting", mp:3, level:10, clv:3, c1:"#eab308",
    wheel:[{name:"Triple Kick 50x",color:"white",dmg:50,multiHit:true,stars:0,size:46},{name:"Mach Punch",color:"gold",dmg:90,stars:0,size:28},{name:"Bounce",color:"blue",dmg:0,stars:0,size:26}] },
  { id:"palkia_o", spriteKey:"palkia_o", name:"Palkia (Origin)", rarity:"UX", type:"Water/Dragon", mp:2, level:10, clv:4, c1:"#db2777",
    wheel:[{name:"Spacial Rend",color:"white",dmg:150,stars:0,size:48},{name:"Aqua Tail",color:"gold",dmg:90,stars:0,size:24},{name:"Dimensional Warp",color:"purple",dmg:0,stars:3,size:16,effect:"push"},{name:"Protect",color:"blue",dmg:0,stars:0,size:12}] },
  { id:"dialga_o", spriteKey:"dialga_o", name:"Dialga (Origin)", rarity:"UX", type:"Steel/Dragon", mp:2, level:10, clv:4, c1:"#1d4ed8",
    wheel:[{name:"Roar of Time",color:"white",dmg:160,stars:0,size:46},{name:"Flash Cannon",color:"gold",dmg:90,stars:0,size:26},{name:"Time Distortion",color:"purple",dmg:0,stars:3,size:18,effect:"ko"},{name:"Iron Defense",color:"blue",dmg:0,stars:0,size:10}] },
  { id:"gengar", spriteKey:"gengar", name:"Gengar", rarity:"EX", type:"Ghost/Poison", mp:3, level:10, clv:2, c1:"#6b21a8",
    wheel:[{name:"Shadow Ball",color:"white",dmg:110,stars:0,size:44},{name:"Toxic Night",color:"purple",dmg:0,stars:2,size:28,effect:"poison"},{name:"Sucker Punch",color:"gold",dmg:75,stars:0,size:16},{name:"Abyssal Grip",color:"blue",dmg:0,stars:0,size:12}] },
  { id:"lucario", spriteKey:"lucario", name:"Lucario", rarity:"EX", type:"Fighting/Steel", mp:2, level:10, clv:3, c1:"#2563eb",
    wheel:[{name:"Aura Sphere",color:"purple",dmg:0,stars:2,size:36,effect:"ko"},{name:"Metal Claw",color:"white",dmg:100,stars:0,size:34},{name:"Extreme Speed",color:"gold",dmg:75,stars:0,size:18},{name:"Dodge",color:"blue",dmg:0,stars:0,size:12}] },
  { id:"rayquaza", spriteKey:"rayquaza", name:"Rayquaza", rarity:"EX", type:"Dragon/Flying", mp:2, level:10, clv:4, c1:"#16a34a",
    wheel:[{name:"Extreme Speed",color:"gold",dmg:140,stars:0,size:44},{name:"Fly",color:"purple",dmg:0,stars:3,size:26,effect:"push"},{name:"Break Energy",color:"white",dmg:90,stars:0,size:18},{name:"Dodge",color:"blue",dmg:0,stars:0,size:12}] },
  { id:"greninja", spriteKey:"greninja", name:"Greninja", rarity:"EX", type:"Water/Dark", mp:3, level:10, clv:5, c1:"#0284c7",
    wheel:[{name:"Water Shuriken 20x",color:"gold",dmg:20,multiHit:true,stars:0,size:44},{name:"Hydro Pump",color:"white",dmg:110,stars:0,size:28},{name:"Substitute",color:"purple",dmg:0,stars:2,size:12,effect:"swap"},{name:"Dodge",color:"blue",dmg:0,stars:0,size:12}] },
  { id:"mew", spriteKey:"mew", name:"Mew", rarity:"EX", type:"Psychic", mp:3, level:5, clv:1, c1:"#f472b6", c2:"#ec4899", arch:"levitate", dex:151, ability:"Hyper Sonic Shield",
    wheel:[{name:"Hyper Sonic",color:"gold",dmg:50,stars:0,size:36},{name:"Psychic",color:"white",dmg:50,stars:0,size:24},{name:"Vanish",color:"purple",dmg:0,stars:1,size:16,effect:"vanish"},{name:"Shuttle Flip",color:"blue",dmg:0,stars:0,size:16,effect:"dodge"},{name:"Miss",color:"red",dmg:0,stars:0,size:4}] },
  { id:"magikarp", spriteKey:"magikarp", name:"Magikarp", rarity:"UC", type:"Water", mp:1, level:5, clv:1, c1:"#f97316", c2:"#fbbf24", arch:"swim", dex:129, ability:"Rapid Evolution",
    wheel:[{name:"Splash",color:"red",dmg:0,stars:0,size:48},{name:"Flail",color:"white",dmg:10,stars:0,size:40},{name:"Miss",color:"red",dmg:0,stars:0,size:8}] },
  { id:"gyarados", spriteKey:"gyarados", name:"Gyarados", rarity:"R", type:"Water/Flying", mp:2, level:5, clv:2, c1:"#0284c7", c2:"#38bdf8", arch:"serpent", dex:130,
    wheel:[{name:"Hyper Beam",color:"white",dmg:110,stars:0,size:44},{name:"Dragon Dance",color:"purple",dmg:0,stars:2,size:24,effect:"wait"},{name:"Storm",color:"purple",dmg:0,stars:2,size:20,effect:"push"},{name:"Miss",color:"red",dmg:0,stars:0,size:8}] },
  { id:"zapdos", spriteKey:"zapdos", name:"Zapdos", rarity:"EX", type:"Electric/Flying", mp:2, level:5, clv:3, c1:"#eab308", c2:"#fde047", arch:"avian", dex:145, ability:"Soar",
    wheel:[{name:"Thunder Crash",color:"gold",dmg:100,stars:0,size:36},{name:"Steel Wing",color:"white",dmg:50,stars:0,size:28},{name:"Roost",color:"purple",dmg:0,stars:2,size:20,effect:"roost"},{name:"Miss",color:"red",dmg:0,stars:0,size:12}] },
  { id:"articuno", spriteKey:"articuno", name:"Articuno", rarity:"EX", type:"Ice/Flying", mp:2, level:5, clv:2, c1:"#38bdf8", c2:"#bae6fd", arch:"avian", dex:144, ability:"Soar",
    wheel:[{name:"Ice Beam",color:"white",dmg:90,stars:0,size:36,effect:"freeze"},{name:"Cold Crush",color:"purple",dmg:0,stars:2,size:28,effect:"freeze"},{name:"Steel Wing",color:"white",dmg:40,stars:0,size:20},{name:"Miss",color:"red",dmg:0,stars:0,size:12}] },
  { id:"moltres", spriteKey:"moltres", name:"Moltres", rarity:"EX", type:"Fire/Flying", mp:2, level:5, clv:2, c1:"#ef4444", c2:"#f97316", arch:"avian", dex:146, ability:"Soar",
    wheel:[{name:"Fire Spin",color:"white",dmg:110,stars:0,size:40,effect:"burn"},{name:"Flame Charge",color:"purple",dmg:0,stars:2,size:24,effect:"burn"},{name:"Steel Wing",color:"white",dmg:40,stars:0,size:20},{name:"Miss",color:"red",dmg:0,stars:0,size:12}] },
  { id:"blastoise", spriteKey:"blastoise", name:"Blastoise", rarity:"EX", type:"Water", mp:2, level:5, clv:2, c1:"#0284c7", c2:"#38bdf8", arch:"biped", dex:9,
    wheel:[{name:"Hydro Pump",color:"white",dmg:100,stars:0,size:44},{name:"Mirror Coat",color:"purple",dmg:0,stars:2,size:28,effect:"mirror"},{name:"Dodge",color:"blue",dmg:0,stars:0,size:16},{name:"Miss",color:"red",dmg:0,stars:0,size:8}] },
  { id:"deoxys_a", spriteKey:"deoxys_a", name:"Deoxys Attack", rarity:"EX", type:"Psychic", mp:1, level:5, clv:4, c1:"#ea580c", c2:"#f97316", arch:"biped", dex:386,
    wheel:[{name:"Psycho Boost",color:"white",dmg:130,stars:0,size:56},{name:"Dimensional Slip",color:"purple",dmg:0,stars:2,size:28,effect:"bench"},{name:"Miss",color:"red",dmg:0,stars:0,size:12}] },
  { id:"snorlax", spriteKey:"snorlax", name:"Snorlax", rarity:"R", type:"Normal", mp:1, level:5, clv:1, c1:"#0f766e", c2:"#14b8a6", arch:"biped", dex:143, ability:"Big Eater",
    wheel:[{name:"Body Slam",color:"white",dmg:100,stars:0,size:44},{name:"Rest",color:"blue",dmg:0,stars:0,size:28,effect:"sleep"},{name:"Big Yawn",color:"purple",dmg:0,stars:2,size:16,effect:"sleep"},{name:"Miss",color:"red",dmg:0,stars:0,size:8}] },
  { id:"lunala", spriteKey:"lunala", name:"Lunala", rarity:"UX", type:"Psychic/Ghost", mp:2, level:5, clv:2, c1:"#6366f1", c2:"#818cf8", arch:"levitate", dex:792,
    wheel:[{name:"Moongeist Beam",color:"white",dmg:100,stars:0,size:48,effect:"ko_pass"},{name:"Psychic",color:"white",dmg:60,stars:0,size:24},{name:"Moon's Grace",color:"purple",dmg:0,stars:3,size:16,effect:"move_swap"},{name:"Miss",color:"red",dmg:0,stars:0,size:8}] },
  { id:"mega_gengar", spriteKey:"mega_gengar", name:"Mega Gengar", rarity:"UX", type:"Ghost/Poison", mp:3, level:5, clv:3, c1:"#7c3aed", c2:"#c084fc", arch:"levitate", dex:94, ability:"Shadow Tag",
    wheel:[{name:"Abyssal Hunter",color:"white",dmg:140,stars:0,size:48},{name:"Toxic Night",color:"purple",dmg:0,stars:3,size:28,effect:"poison"},{name:"Miss",color:"red",dmg:0,stars:0,size:20}] },
  { id:"mega_charizard_x", spriteKey:"mega_charizard_x", name:"Mega Charizard X", rarity:"UX", type:"Fire/Dragon", mp:3, level:5, clv:3, c1:"#1e293b", c2:"#38bdf8", arch:"biped", dex:6,
    wheel:[{name:"Crimson Flame",color:"white",dmg:150,stars:0,size:52},{name:"Dragon Wing",color:"purple",dmg:0,stars:3,size:28,effect:"fly"},{name:"Miss",color:"red",dmg:0,stars:0,size:16}] },
  { id:"mega_rayquaza", spriteKey:"mega_rayquaza", name:"Mega Rayquaza", rarity:"UX", type:"Dragon/Flying", mp:2, level:5, clv:3, c1:"#059669", c2:"#fbbf24", arch:"serpent", dex:384, ability:"Delta Stream",
    wheel:[{name:"Dragon Ascent",color:"gold",dmg:150,stars:0,size:48},{name:"Extreme Speed",color:"gold",dmg:100,stars:0,size:36},{name:"Miss",color:"red",dmg:0,stars:0,size:12}] }
];

const POKEMON_EVOLUTION_FAMILIES = [
  ["Bulbasaur", "Ivysaur", "Venusaur", "Mega Venusaur"],
  ["Charmander", "Charmeleon", "Charizard", "Mega Charizard X"],
  ["Squirtle", "Wartortle", "Blastoise", "Mega Blastoise"],
  ["Chikorita", "Bayleef", "Meganium"],
  ["Cyndaquil", "Quilava", "Typhlosion"],
  ["Totodile", "Croconaw", "Feraligatr"],
  ["Treecko", "Grovyle", "Sceptile"],
  ["Torchic", "Combusken", "Blaziken"],
  ["Mudkip", "Marshtomp", "Swampert"],
  ["Turtwig", "Grotle", "Torterra"],
  ["Chimchar", "Monferno", "Infernape"],
  ["Piplup", "Prinplup", "Empoleon"],
  ["Snivy", "Servine", "Serperior"],
  ["Tepig", "Pignite", "Emboar"],
  ["Oshawott", "Dewott", "Samurott"],
  ["Froakie", "Frogadier", "Greninja"],
  ["Rowlet", "Dartrix", "Decidueye"],
  ["Litten", "Torracat", "Incineroar"],
  ["Popplio", "Brionne", "Primarina"],
  ["Pikachu", "Raichu"],
  ["Pichu", "Pikachu", "Raichu"],
  ["Magikarp", "Gyarados", "Mega Gyarados"],
  ["Gastly", "Haunter", "Gengar", "Mega Gengar"],
  ["Dratini", "Dragonair", "Dragonite"],
  ["Riolu", "Lucario", "Mega Lucario"],
  ["Bagon", "Shelgon", "Salamence"],
  ["Beldum", "Metang", "Metagross"],
  ["Gible", "Gabite", "Garchomp"],
  ["Larvitar", "Pupitar", "Tyranitar"],
  ["Trapinch", "Vibrava", "Flygon"],
  ["Ralts", "Kirlia", "Gardevoir"],
  ["Ralts", "Kirlia", "Gallade"],
  ["Caterpie", "Metapod", "Butterfree"],
  ["Weedle", "Kakuna", "Beedrill"],
  ["Pidgey", "Pidgeotto", "Pidgeot"],
  ["Rattata", "Raticate"],
  ["Abra", "Kadabra", "Alakazam"],
  ["Machop", "Machoke", "Machamp"],
  ["Bellsprout", "Weepinbell", "Victreebel"],
  ["Geodude", "Graveler", "Golem"],
  ["Poliwag", "Poliwhirl", "Poliwrath"],
  ["Slowpoke", "Slowbro"],
  ["Magnemite", "Magneton", "Magnezone"],
  ["Horsea", "Seadra", "Kingdra"],
  ["Staryu", "Starmie", "Mega Starmie"],
  ["Buneary", "Lopunny", "Mega Lopunny"],
  ["Cosmog", "Cosmoem", "Lunala"],
  ["Kabuto", "Kabutops"],
  ["Omanyte", "Omastar"],
  ["Scyther", "Scizor"],
  ["Onix", "Steelix"],
  ["Eevee", "Vaporeon"],
  ["Eevee", "Jolteon"],
  ["Eevee", "Flareon"],
  ["Eevee", "Espeon"],
  ["Eevee", "Umbreon"],
  ["Eevee", "Sylveon"],
  ["Rayquaza", "Mega Rayquaza"]
];

function getEvolutionChainToTarget(targetName) {
  if (!targetName) return [];
  const tClean = targetName.toLowerCase().replace(/[\s\-_]/g, "");
  for (const fam of POKEMON_EVOLUTION_FAMILIES) {
    const idx = fam.findIndex(n => n.toLowerCase().replace(/[\s\-_]/g, "") === tClean);
    if (idx !== -1) {
      return fam.slice(0, idx + 1);
    }
  }
  return [targetName];
}

function findFigureByName(name) {
  if (!name) return null;
  const clean = name.toLowerCase().replace(/[\s\-_]/g, "");
  let f = FIGURES_DB.find(fig => {
    const fn = (fig.name || "").toLowerCase().replace(/[\s\-_]/g, "");
    const fid = (fig.id || "").toLowerCase().replace(/[\s\-_]/g, "");
    return fn === clean || fid === clean;
  });
  if (!f && typeof NEW_200_FIGURES_DATA !== "undefined") {
    f = NEW_200_FIGURES_DATA.find(fig => {
      const fn = (fig.name || "").toLowerCase().replace(/[\s\-_]/g, "");
      const fid = (fig.id || "").toLowerCase().replace(/[\s\-_]/g, "");
      return fn === clean || fid === clean;
    });
  }
  return f || null;
}

const FIGURE_ABILITIES_DB = {
  charizard: " Speed Booster / Dragon Wing: +10 DMG per step moved; Mega evolves into [UX] Mega Charizard X (+20 DMG, Pass-Through).",
  pikachu: "Sparkling Light [UX]: Gold Quick Attack knocks out any Purple move; evolves into Alolan Raichu.",
  squirtle: "Withdraw Shell: Blue Withdraw protects from all attacks and status; evolves into [UX] Mega Blastoise.",
  bulbasaur: "Synthesis Sprout: Synergizes with Meadow Power (+20 DMG); evolves into Ivysaur ➔ Venusaur ➔ [UX] Mega Venusaur.",
  eevee: "Adaptability Dash (3 MP): High-speed runner with Gold Quick Attack; evolves into Sylveon EX / Umbreon UX.",
  lapras: "Ice Veil: Immune to Freeze; Sing ★★ puts adjacent battle opponents to Sleep.",
  charmander: "Blaze Runner (3 MP): Smokescreen ★ confuses opponent; evolves into Charmeleon ➔ Charizard.",
  venusaur: "Tropical Flora: Sleep Powder ★★★ & Solar Beam 140; Mega evolves into [UX] Mega Venusaur.",
  kabutops: "Swift Swim Battle Armor: Aqua Jet 80 Gold beats Purple; Ancient Power displaces enemies.",
  megastarmie: "[UX] Cosmic Star Core: +10 DMG for each ★ on field; 3 MP Pass-Through runner.",
  megalopunny: "[UX] Scrappy High Jump: 3 MP Pass-Through; Bounce Blue leaps over enemies and cures status.",
  palkia_o: "[UX] Spacial Origin Forme: Prevents opposing pass-through effects; Dimensional Warp ★★★ pushes + Wait 2.",
  dialga_o: "[UX] Temporal Origin Forme: Roar of Time 160 DMG + Time Distortion ★★★ instant knockout.",
  gengar: "Infiltrator Shadow (3 MP): Moves through figures on the board; knocks out sleeping/poisoned targets it passes over.",
  lucario: "Steadfast Aura: Aura Sphere ★★ knocks out opponent regardless of damage; Metal Claw 100.",
  mew: "Hyper Sonic Shield (3 MP): Gold Hyper Sonic (50 DMG) is immune to knock out against attacks of 100+ DMG; Shuttle Flip leaps backward.",
  rayquaza: "Air Lock Extreme: Extreme Speed 140 Gold destroys Purple wheels; Fly ★★★ leaps over opponents.",
  magikarp: "Rapid Evolution: Instant Evolution upon being knocked out! Evolves directly into [R] Gyarados with +10 DMG and +1★.",
  gyarados: "Dragon Rage: Hyper Beam 110 White; Dragon Dance ★★ grants Wait 1; Storm ★★ pushes opponent away.",
  zapdos: "Soar (Infiltrator): Flies over non-flying Pokémon; Thunder Crash 100 Gold beats all Purple moves; Roost ★★★.",
  articuno: "Soar (Infiltrator): Flies over non-flying Pokémon; Ice Beam 90 & Cold Crush ★★★ freeze opponent.",
  moltres: "Soar (Infiltrator): Flies over non-flying Pokémon; Fire Spin 110 & Flame Charge ★★ burn opponent.",
  blastoise: "Mirror Coat Barrier: Mirror Coat ★★★ reflects Purple moves; Hydro Pump 100 White; Dodge.",
  deoxys_a: "Reflective Laser: Psycho Boost 130 White; Dimensional Slip ★★ sends Deoxys back to bench safely.",
  snorlax: "Big Eater Immunity: Immune to Sleep & Poison; Body Slam 100; Rest Blue & Big Yawn ★★ puts foes to sleep.",
  lunala: "Shadow Shield: Moongeist Beam 100 halves opponent damage; Moon's Grace ★★★ switches places.",
  mega_gengar: "[UX] Shadow Tag: Prevents adjacent Pokémon from moving; Abyssal Hunter 140 White; Toxic Night ★★★.",
  mega_charizard_x: "[UX] Crimson Flare: Crimson Flame 150 White; Dragon Wing ★★★ passes through and pushes foes.",
  mega_rayquaza: "[UX] Delta Stream: Dragon Ascent 150 Gold & Extreme Speed 100 Gold; neutralizes flying weaknesses."
};
