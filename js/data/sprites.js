// ============================================================================
// POKÉMON DUEL MODULAR ASSET REGISTRY (assets/sprites/, assets/ui/, assets/arena/)
// ============================================================================
const BANANA_ARENA_B64 = "assets/arena/carmonte_arena.jpg";
const POKEDUEL_BANANA_LOGO_URI = "assets/ui/pokeduel_logo.webp";

const HOME_V380_UI_ASSETS = {
  "tab_back": "assets/ui/tab_back.png",
  "tab_leagues": "assets/ui/tab_leagues.png",
  "tab_decks": "assets/ui/tab_decks.png",
  "tab_fusion": "assets/ui/tab_fusion.png",
  "tab_shop": "assets/ui/tab_shop.png",
  "tab_menu": "assets/ui/tab_menu.png",
  "booster_silver": "assets/ui/booster_silver.png",
  "booster_purple": "assets/ui/booster_purple.png",
  "booster_plus1": "assets/ui/booster_plus1.png",
  "profile_emblem": "assets/ui/profile_emblem.png",
  "profile_avatar": "assets/ui/profile_avatar.png",
  "locked_booster_top": "assets/ui/locked_booster_top.png",
  "new_training_btn": "assets/ui/new_training_btn.png",
  "black_pokeball_btn": "assets/ui/black_pokeball_btn.png",
  "greninja_centerpiece": "assets/ui/greninja_centerpiece.png",
  "centerpiece_pedestal_3d": "assets/ui/centerpiece_pedestal_3d.png"
};

const AUTHENTIC_FIG_SPRITES = {
  "charizard": { uri: "assets/sprites/charizard.png", w: 46.0, h: 43.0, ox: 23.0, oy: 29.0 },
  "pikachu": { uri: "assets/sprites/pikachu.png", w: 42.0, h: 40.0, ox: 21.0, oy: 26.0 },
  "pikachu_back": { uri: "assets/sprites/pikachu_back.png", w: 42.0, h: 40.0, ox: 21.0, oy: 26.0 },
  "squirtle": { uri: "assets/sprites/squirtle.png", w: 42.0, h: 39.0, ox: 21.0, oy: 25.0 },
  "squirtle_p2": { uri: "assets/sprites/squirtle_p2.png", w: 42.0, h: 39.0, ox: 21.0, oy: 25.0 },
  "bulbasaur": { uri: "assets/sprites/bulbasaur.png", w: 44.0, h: 39.0, ox: 22.0, oy: 25.0 },
  "eevee": { uri: "assets/sprites/eevee.png", w: 44.0, h: 41.0, ox: 22.0, oy: 27.0 },
  "lapras": { uri: "assets/sprites/lapras.png", w: 44.0, h: 41.0, ox: 22.0, oy: 27.0 },
  "charmander": { uri: "assets/sprites/charmander.png", w: 40.0, h: 39.0, ox: 20.0, oy: 25.0 },
  "venusaur": { uri: "assets/sprites/venusaur.png", w: 44.0, h: 41.0, ox: 22.0, oy: 27.0 },
  "kabutops": { uri: "assets/sprites/kabutops.png", w: 44.0, h: 42.0, ox: 22.0, oy: 28.0 },
  "megastarmie": { uri: "assets/sprites/megastarmie.png", w: 44.0, h: 42.0, ox: 22.0, oy: 28.0 },
  "megalopunny": { uri: "assets/sprites/megalopunny.png", w: 44.0, h: 42.0, ox: 22.0, oy: 28.0 },
  "palkia_o": { uri: "assets/sprites/palkia_o.png", w: 44.0, h: 42.0, ox: 22.0, oy: 28.0 },
  "dialga_o": { uri: "assets/sprites/dialga_o.png", w: 44.0, h: 42.0, ox: 22.0, oy: 28.0 },
  "gengar": { uri: "assets/sprites/gengar.png", w: 44.0, h: 42.0, ox: 22.0, oy: 28.0 },
  "lucario": { uri: "assets/sprites/lucario.png", w: 44.0, h: 42.0, ox: 22.0, oy: 28.0 },
  "rayquaza": { uri: "assets/sprites/rayquaza.png", w: 44.0, h: 42.0, ox: 22.0, oy: 28.0 },
  "bulbasaur_back": { uri: "assets/sprites/bulbasaur_back.png", w: 46.0, h: 44.0, ox: 23.0, oy: 32.0 },
  "charizard_back": { uri: "assets/sprites/charizard_back.png", w: 46.0, h: 44.0, ox: 23.0, oy: 32.0 },
  "charmander_back": { uri: "assets/sprites/charmander_back.png", w: 46.0, h: 44.0, ox: 23.0, oy: 32.0 },
  "eevee_back": { uri: "assets/sprites/eevee_back.png", w: 46.0, h: 44.0, ox: 23.0, oy: 32.0 },
  "kabutops_back": { uri: "assets/sprites/kabutops_back.png", w: 46.0, h: 44.0, ox: 23.0, oy: 32.0 },
  "lapras_back": { uri: "assets/sprites/lapras_back.png", w: 46.0, h: 44.0, ox: 23.0, oy: 32.0 },
  "squirtle_back": { uri: "assets/sprites/squirtle_back.png", w: 46.0, h: 44.0, ox: 23.0, oy: 32.0 },
  "venusaur_back": { uri: "assets/sprites/venusaur_back.png", w: 46.0, h: 44.0, ox: 23.0, oy: 32.0 },
  "greninja": { uri: "assets/sprites/greninja.png", w: 46.0, h: 44.0, ox: 23.0, oy: 32.0 }
};

const loadedFigImages = {};
for (const k in AUTHENTIC_FIG_SPRITES) {
  const im = new Image();
  im.src = AUTHENTIC_FIG_SPRITES[k].uri;
  loadedFigImages[k] = im;
}

const _generatedSpriteCache = {};

function materialize3DFigurineSprite(f) {
  if (!f) return AUTHENTIC_FIG_SPRITES["pikachu"];
  const key = f.spriteKey || f.id;
  if (_generatedSpriteCache[key]) return _generatedSpriteCache[key];

  if (AUTHENTIC_FIG_SPRITES[key]) {
    _generatedSpriteCache[key] = AUTHENTIC_FIG_SPRITES[key];
    return AUTHENTIC_FIG_SPRITES[key];
  }

  // Load from assets/sprites/*.webp or assets/sprites/*.png
  const uri = "assets/sprites/" + key + ".webp";
  const metaObj = { uri, w: 44.0, h: 42.0, ox: 22.0, oy: 28.0 };
  const im = new Image();
  im.src = uri;
  _generatedSpriteCache[key] = metaObj;
  Object.defineProperty(AUTHENTIC_FIG_SPRITES, key, { value: metaObj, writable: true, enumerable: true, configurable: true });
  Object.defineProperty(loadedFigImages, key, { value: im, writable: true, enumerable: true, configurable: true });
  return metaObj;
}
