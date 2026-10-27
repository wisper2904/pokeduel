// ============================================================================
// POKÉMON DUEL INTERNATIONALIZATION (i18n) ENGINE - PT / EN / ES (v661)
// ============================================================================

const I18N_TRANSLATIONS = {
  pt: {
    // Navigation
    "nav.leagues": "Ligas",
    "nav.decks": "Decks",
    "nav.fusion": "Fusão",
    "nav.shop": "Loja",
    "nav.menu": "Config",

    // Settings / Config Tab
    "settings.language_title": "🌐 IDIOMA / LANGUAGE / IDIOMA",
    "settings.language_subtitle": "Selecione o idioma de exibição do jogo:",
    "settings.profile_title": "👤 MEU PERFIL DE TREINADOR",
    "settings.edit_profile": "✏️ Editar Perfil & Avatar",
    "settings.reset_profile": "🔄 Resetar Perfil (Zerar)",
    "settings.version_title": "📢 VERSÃO DO JOGO & ATUALIZAÇÃO",
    "settings.version_sub": "Versão v6.1.0 · Estável",
    "settings.patch_notes": "📢 Ver Notas da Atualização",
    "settings.update_now": "🔄 Atualizar Agora (1-Toque)",
    "settings.audio_title": "🔊 ÁUDIO, VISUAL & ARENA DE BATALHA",
    "settings.bgm_on": "🎵 Música (BGM): ON",
    "settings.bgm_off": "🎵 Música (BGM): OFF",
    "settings.bgm_desc": "🎶 Trilha Sonora Oficial de Pokémon Duel (Shota Kageyama OST)!",
    "settings.graphics": "✨ Gráficos: 3D HD",
    "settings.screen_mode_label": "Proporção & Modo de Exibição da Tela:",
    "settings.screen_mode_btn": "📱 Modo de Tela: Auto (Detectando...)",
    "settings.arena_theme_label": "Tema do Tabuleiro de Duelo:",
    "settings.theme_crystal": "💎 Cristal",
    "settings.theme_banana": "🍌 Dourada",
    "settings.theme_marble": "🏛️ Mármore",
    "settings.theme_wood": "🪵 Madeira",
    "settings.theme_stone": "🪨 Vulcão",
    "settings.theme_habitats": "🌿 Habitats",
    "settings.modes_title": "🎮 MODOS DE JOGO & HOTÉIS DA CAMPANHA",
    "settings.multiplayer_btn": "🌐 Multiplayer Online (P2P)",
    "settings.pass_btn": "👥 2 Jogadores (Local)",
    "settings.hotel_desc": "Desafie os Chefes dos Hotéis (Vitória = +1 Caixa de Pokémon + 3.500🪙):",
    "settings.sprites_title": "🎨 Personalizar Sprites / Textura do Tabuleiro (Opcional)",
    "settings.swap_sprite": "📤 Trocar Sprite (.png)",
    "settings.exit_game": "🚪 Sair do Jogo",

    // In-Match HUD & Action Buttons
    "battle.end_turn": "End Turn ⏭️",
    "battle.ai_btn": "AI",
    "battle.forfeit": "🏳️ Desistir",
    "battle.plates": "🎴 Cartas",
    "battle.you": "VOCÊ",
    "battle.rival": "RIVAL",
    "battle.turn_pill_mine": "🟢 SUA VEZ!",
    "battle.turn_pill_opp": "⏳ Vez do Oponente...",
    "battle.turn_pass_player": "👥 Vez de:",
    "battle.roulette_title": "🎲 ROLETA DE 1º TURNO (50% / 50%)",
    "battle.roulette_sorting": "SORTEANDO...",
    "battle.roulette_you_start": "Você começa (-1 MP)",
    "battle.roulette_starts": "começa (-1 MP)",
    "battle.first_turn_badge": "1st TURN: -1 MP",
    "battle.inspecting": "Inspecionando",
    "battle.target_tap_again": "Toque novamente para ATACAR ou em outro local.",

    // Double Chance
    "battle.double_chance_title": "DOUBLE CHANCE — Aceitar giro atual ou Re-girar?",
    "battle.keep": "✓ Manter",
    "battle.respin": "↻ Re-Girar",
    "battle.opp_evaluating": "⏳ Oponente avaliando Double Chance...",

    // Match Outcomes
    "battle.time_up_win": "⏰ TEMPO ESGOTADO! Você venceu por tempo!",
    "battle.time_up_lose": "⏰ TEMPO ESGOTADO! Oponente venceu por tempo!",
    "battle.goal_win": "Alcançou o Goal Point! VITÓRIA!",
    "battle.goal_lose": "Oponente alcançou seu Goal Point!",
    "battle.wait_win": "🏆 WAIT WIN! Entry Points bloqueados e sem movimentos!",
    "battle.turn_limit": "⏰ LIMITE DE 300 TURNOS ATINGIDO! Fim de partida!",

    // Jump Badges
    "jump.jumps": "🦘 PULA",
    "jump.no_jump": "🚫 NÃO PULA",
    "jump.jumps_badge": "🦘 PULA FIGURAS",
    "jump.jumps_desc": "🦘 PULA FIGURAS: Pode saltar por cima de outros Pokémon gastando 2 MP por salto.",
    "jump.no_jump_desc": "🚫 NÃO PULA: Não pode saltar sobre outras figuras no caminho.",

    // Result Overlay
    "result.win": "WIN",
    "result.lose": "LOSE",
    "result.result": "RESULTADO",
    "result.rating": "Classificação:",
    "result.booster_sent": "📦 +1 TIME BOOSTER ENVIADO AO HUB!",
    "result.booster_desc": "A caixa foi colocada no slot do Hub! Aguarde o cronômetro para abrir.",
    "result.view_hub": "⏱️ VER CRONÔMETRO NO HUB",
    "result.promo": "Promoção de liga em",
    "result.next": "Próximo",

    // Figure Details Modal
    "fdet.data_disk": "DATA DISK (96 FATIAS)",
    "fdet.ability_evo": "HABILIDADE & EVOLUÇÃO / LINHA [UX]",
    "fdet.expand_wheel": "🧬 Expandir Roleta (Fusion)",
    "fdet.close": "Fechar",

    // Plates Descriptions
    "plate.hurdle.name": "Hurdle Jump",
    "plate.hurdle.sub": "Salta sobre uma peça adjacente respeitando o consumo de MP da casa pulada.",
    "plate.double.name": "Double Chance",
    "plate.double.sub": "Permite girar a roleta novamente se o primeiro giro for desfavorável.",
    "plate.xatk.name": "X Attack",
    "plate.xatk.sub": "Adiciona +30 de dano a todos os ataques da sua figura neste turno.",
    "plate.xspeed.name": "X Speed",
    "plate.xspeed.sub": "Transforma todos os ataques Brancos em Dourados (Gold quebra Roxo) neste turno.",
    "plate.revive.name": "Max Revive",
    "plate.revive.sub": "Retira uma figura do P.C. e coloca-a de volta no Banco sem Wait (Wait 0).",
    "plate.goalblock.name": "Goal Block",
    "plate.goalblock.sub": "Teleporta uma figura aliada do campo para o seu Goal Point em emergência (recebe Wait 1).",
    "plate.megaplate.name": "Mega Plate [UX]",
    "plate.megaplate.sub": "Mega Evolui a figura selecionada por 7 turnos (+20 DMG, +1★, +1 MP e Pass-Through).",
    "plate.use_btn": "USAR CARTA",

    // P2P Salão
    "p2p.title": "🌐 SALÃO DE PARTIDAS P2P ONLINE",
    "p2p.create_room": "🏠 CRIAR SALA",
    "p2p.join_room": "🚪 ENTRAR NA SALA",
    "p2p.random_match": "⚡ BUSCAR PARTIDA ALEATÓRIA",
    "p2p.room_code": "CÓDIGO DA SALA:"
  },

  en: {
    // Navigation
    "nav.leagues": "Leagues",
    "nav.decks": "Decks",
    "nav.fusion": "Fusion",
    "nav.shop": "Shop",
    "nav.menu": "Settings",

    // Settings / Config Tab
    "settings.language_title": "🌐 IDIOMA / LANGUAGE / IDIOMA",
    "settings.language_subtitle": "Select display language:",
    "settings.profile_title": "👤 MY TRAINER PROFILE",
    "settings.edit_profile": "✏️ Edit Profile & Avatar",
    "settings.reset_profile": "🔄 Reset Profile (Zero)",
    "settings.version_title": "📢 GAME VERSION & UPDATES",
    "settings.version_sub": "Version v6.1.0 · Stable",
    "settings.patch_notes": "📢 View Patch Notes",
    "settings.update_now": "🔄 Update Now (1-Tap)",
    "settings.audio_title": "🔊 AUDIO, VISUALS & BATTLE ARENA",
    "settings.bgm_on": "🎵 Music (BGM): ON",
    "settings.bgm_off": "🎵 Music (BGM): OFF",
    "settings.bgm_desc": "🎶 Official Pokémon Duel Soundtrack (Shota Kageyama OST)!",
    "settings.graphics": "✨ Graphics: 3D HD",
    "settings.screen_mode_label": "Aspect Ratio & Display Mode:",
    "settings.screen_mode_btn": "📱 Screen Mode: Auto (Detecting...)",
    "settings.arena_theme_label": "Duel Board Arena Theme:",
    "settings.theme_crystal": "💎 Crystal",
    "settings.theme_banana": "🍌 Golden",
    "settings.theme_marble": "🏛️ Marble",
    "settings.theme_wood": "🪵 Wood",
    "settings.theme_stone": "🪨 Volcano",
    "settings.theme_habitats": "🌿 Habitats",
    "settings.modes_title": "🎮 GAME MODES & CAMPAIGN HOTELS",
    "settings.multiplayer_btn": "🌐 Online Multiplayer (P2P)",
    "settings.pass_btn": "👥 2 Players (Local)",
    "settings.hotel_desc": "Challenge Hotel Bosses (Win = +1 Pokémon Box + 3,500🪙):",
    "settings.sprites_title": "🎨 Customize Sprites / Board Texture (Optional)",
    "settings.swap_sprite": "📤 Change Sprite (.png)",
    "settings.exit_game": "🚪 Exit Game",

    // In-Match HUD & Action Buttons
    "battle.end_turn": "End Turn ⏭️",
    "battle.ai_btn": "AI",
    "battle.forfeit": "🏳️ Forfeit",
    "battle.plates": "🎴 Plates",
    "battle.you": "YOU",
    "battle.rival": "OPPONENT",
    "battle.turn_pill_mine": "🟢 YOUR TURN!",
    "battle.turn_pill_opp": "⏳ Opponent's Turn...",
    "battle.turn_pass_player": "👥 Turn of:",
    "battle.roulette_title": "🎲 1st TURN ROULETTE (50% / 50%)",
    "battle.roulette_sorting": "SPINNING...",
    "battle.roulette_you_start": "You start (-1 MP)",
    "battle.roulette_starts": "starts (-1 MP)",
    "battle.first_turn_badge": "1st TURN: -1 MP",
    "battle.inspecting": "Inspecting",
    "battle.target_tap_again": "Tap again to ATTACK or tap elsewhere.",

    // Double Chance
    "battle.double_chance_title": "DOUBLE CHANCE — Keep current roll or Re-Spin?",
    "battle.keep": "✓ Keep",
    "battle.respin": "↻ Re-Spin",
    "battle.opp_evaluating": "⏳ Opponent evaluating Double Chance...",

    // Match Outcomes
    "battle.time_up_win": "⏰ TIME UP! You won on time!",
    "battle.time_up_lose": "⏰ TIME UP! Opponent won on time!",
    "battle.goal_win": "Reached the Goal Point! WIN!",
    "battle.goal_lose": "Opponent reached your Goal Point!",
    "battle.wait_win": "🏆 WAIT WIN! Entry Points blocked with no legal moves!",
    "battle.turn_limit": "⏰ 300 TURN LIMIT REACHED! Match over!",

    // Jump Badges
    "jump.jumps": "🦘 JUMPS",
    "jump.no_jump": "🚫 NO JUMP",
    "jump.jumps_badge": "🦘 FIGURE JUMP",
    "jump.jumps_desc": "🦘 FIGURE JUMP: Can jump over other Pokémon spending 2 MP per jump.",
    "jump.no_jump_desc": "🚫 NO JUMP: Cannot jump over other figures on path.",

    // Result Overlay
    "result.win": "WIN",
    "result.lose": "LOSE",
    "result.result": "RESULT",
    "result.rating": "Rating:",
    "result.booster_sent": "📦 +1 TIME BOOSTER SENT TO HUB!",
    "result.booster_desc": "The box was placed in the Hub slot! Wait for the timer to open.",
    "result.view_hub": "⏱️ VIEW HUB TIMER",
    "result.promo": "League promotion in",
    "result.next": "Next",

    // Figure Details Modal
    "fdet.data_disk": "DATA DISK (96 SLICES)",
    "fdet.ability_evo": "ABILITY & EVOLUTION / [UX] LINE",
    "fdet.expand_wheel": "🧬 Expand Wheel (Fusion)",
    "fdet.close": "Close",

    // Plates Descriptions
    "plate.hurdle.name": "Hurdle Jump",
    "plate.hurdle.sub": "Jump over an adjacent piece respecting the MP cost of the jumped space.",
    "plate.double.name": "Double Chance",
    "plate.double.sub": "Allows you to spin the wheel again if the first roll is unfavorable.",
    "plate.xatk.name": "X Attack",
    "plate.xatk.sub": "Adds +30 damage to all attacks of your figure this turn.",
    "plate.xspeed.name": "X Speed",
    "plate.xspeed.sub": "Converts all White attacks into Gold (Gold beats Purple) this turn.",
    "plate.revive.name": "Max Revive",
    "plate.revive.sub": "Takes a figure from the P.C. and returns it to the Bench with no Wait (Wait 0).",
    "plate.goalblock.name": "Goal Block",
    "plate.goalblock.sub": "Teleports an allied figure from the field to defend your Goal Point in emergency (Wait 1).",
    "plate.megaplate.name": "Mega Plate [UX]",
    "plate.megaplate.sub": "Mega Evolves selected figure for 7 turns (+20 DMG, +1★, +1 MP and Pass-Through).",
    "plate.use_btn": "USE PLATE",

    // P2P Salão
    "p2p.title": "🌐 P2P ONLINE MATCH ROOM",
    "p2p.create_room": "🏠 CREATE ROOM",
    "p2p.join_room": "🚪 JOIN ROOM",
    "p2p.random_match": "⚡ FIND RANDOM MATCH",
    "p2p.room_code": "ROOM CODE:"
  },

  es: {
    // Navigation
    "nav.leagues": "Ligas",
    "nav.decks": "Mazos",
    "nav.fusion": "Fusión",
    "nav.shop": "Tienda",
    "nav.menu": "Ajustes",

    // Settings / Config Tab
    "settings.language_title": "🌐 IDIOMA / LANGUAGE / IDIOMA",
    "settings.language_subtitle": "Selecciona el idioma del juego:",
    "settings.profile_title": "👤 MI PERFIL DE ENTRENADOR",
    "settings.edit_profile": "✏️ Editar Perfil y Avatar",
    "settings.reset_profile": "🔄 Reiniciar Perfil (Cero)",
    "settings.version_title": "📢 VERSIÓN DEL JUEGO Y ACTUALIZACIÓN",
    "settings.version_sub": "Versión v6.1.0 · Estable",
    "settings.patch_notes": "📢 Ver Notas de la Actualización",
    "settings.update_now": "🔄 Actualizar Ahora (1-Toque)",
    "settings.audio_title": "🔊 AUDIO, VISUAL Y ARENA DE BATALLA",
    "settings.bgm_on": "🎵 Música (BGM): ON",
    "settings.bgm_off": "🎵 Música (BGM): OFF",
    "settings.bgm_desc": "🎶 ¡Banda sonora oficial de Pokémon Duel (Shota Kageyama OST)!",
    "settings.graphics": "✨ Gráficos: 3D HD",
    "settings.screen_mode_label": "Proporción y Modo de Pantalla:",
    "settings.screen_mode_btn": "📱 Modo de Pantalla: Auto (Detectando...)",
    "settings.arena_theme_label": "Tema del Tablero de Duelo:",
    "settings.theme_crystal": "💎 Cristal",
    "settings.theme_banana": "🍌 Dorada",
    "settings.theme_marble": "🏛️ Mármol",
    "settings.theme_wood": "🪵 Madera",
    "settings.theme_stone": "🪨 Volcán",
    "settings.theme_habitats": "🌿 Hábitats",
    "settings.modes_title": "🎮 MODOS DE JUEGO Y HOTELES DE CAMPAÑA",
    "settings.multiplayer_btn": "🌐 Multijugador Online (P2P)",
    "settings.pass_btn": "👥 2 Jugadores (Local)",
    "settings.hotel_desc": "Desafía a los Jefes de los Hoteles (Victoria = +1 Caja Pokémon + 3.500🪙):",
    "settings.sprites_title": "🎨 Personalizar Sprites / Textura del Tablero (Opcional)",
    "settings.swap_sprite": "📤 Cambiar Sprite (.png)",
    "settings.exit_game": "🚪 Salir del Juego",

    // In-Match HUD & Action Buttons
    "battle.end_turn": "Pasar Turno ⏭️",
    "battle.ai_btn": "IA",
    "battle.forfeit": "🏳️ Rendirse",
    "battle.plates": "🎴 Placas",
    "battle.you": "TÚ",
    "battle.rival": "RIVAL",
    "battle.turn_pill_mine": "🟢 ¡TU TURNO!",
    "battle.turn_pill_opp": "⏳ Turno del Rival...",
    "battle.turn_pass_player": "👥 Turno de:",
    "battle.roulette_title": "🎲 RULETA DE 1er TURNO (50% / 50%)",
    "battle.roulette_sorting": "SORTEANDO...",
    "battle.roulette_you_start": "Empiezas tú (-1 MP)",
    "battle.roulette_starts": "empieza (-1 MP)",
    "battle.first_turn_badge": "1st TURN: -1 MP",
    "battle.inspecting": "Inspeccionando",
    "battle.target_tap_again": "Toca de nuevo para ATACAR o en otro lugar.",

    // Double Chance
    "battle.double_chance_title": "DOUBLE CHANCE — ¿Mantener giro actual o Volver a girar?",
    "battle.keep": "✓ Mantener",
    "battle.respin": "↻ Girar de nuevo",
    "battle.opp_evaluating": "⏳ Oponente evaluando Double Chance...",

    // Match Outcomes
    "battle.time_up_win": "⏰ ¡TIEMPO AGOTADO! ¡Ganaste por tiempo!",
    "battle.time_up_lose": "⏰ ¡TIEMPO AGOTADO! ¡El oponente ganó por tiempo!",
    "battle.goal_win": "¡Llegaste al Goal Point! ¡VICTORIA!",
    "battle.goal_lose": "¡El oponente llegó a tu Goal Point!",
    "battle.wait_win": "🏆 ¡WAIT WIN! ¡Puntos de entrada bloqueados y sin movimientos!",
    "battle.turn_limit": "⏰ ¡LÍMITE DE 300 TURNOS ALCANZADO! ¡Fin de partida!",

    // Jump Badges
    "jump.jumps": "🦘 SALTA",
    "jump.no_jump": "🚫 NO SALTA",
    "jump.jumps_badge": "🦘 SALTO DE FIGURA",
    "jump.jumps_desc": "🦘 SALTO DE FIGURA: Puede saltar sobre otros Pokémon gastando 2 MP por salto.",
    "jump.no_jump_desc": "🚫 NO SALTA: No puede saltar sobre otras figuras en el camino.",

    // Result Overlay
    "result.win": "VICTORIA",
    "result.lose": "DERROTA",
    "result.result": "RESULTADO",
    "result.rating": "Puntuación:",
    "result.booster_sent": "📦 ¡+1 TIME BOOSTER ENVIADO AL HUB!",
    "result.booster_desc": "¡La caja se colocó en el slot del Hub! Espera el temporizador para abrirla.",
    "result.view_hub": "⏱️ VER TEMPORIZADOR EN EL HUB",
    "result.promo": "Promoción de liga en",
    "result.next": "Siguiente",

    // Figure Details Modal
    "fdet.data_disk": "DISCO DE DATOS (96 PARTES)",
    "fdet.ability_evo": "HABILIDAD Y EVOLUCIÓN / LÍNEA [UX]",
    "fdet.expand_wheel": "🧬 Expandir Ruleta (Fusión)",
    "fdet.close": "Cerrar",

    // Plates Descriptions
    "plate.hurdle.name": "Hurdle Jump",
    "plate.hurdle.sub": "Salta sobre una pieza adyacente respetando el coste de MP de la casilla saltada.",
    "plate.double.name": "Double Chance",
    "plate.double.sub": "Permite girar la ruleta de nuevo si el primer giro es desfavorable.",
    "plate.xatk.name": "X Attack",
    "plate.xatk.sub": "Añade +30 de daño a todos los ataques de tu figura en este turno.",
    "plate.xspeed.name": "X Speed",
    "plate.xspeed.sub": "Convierte todos los ataques Blancos en Dorados (Dorado vence a Púrpura) en este turno.",
    "plate.revive.name": "Max Revive",
    "plate.revive.sub": "Saca una figura del P.C. y la devuelve a la Banca sin Wait (Wait 0).",
    "plate.goalblock.name": "Goal Block",
    "plate.goalblock.sub": "Teletransporta una figura aliada del campo para defender tu Goal Point en emergencia (recibe Wait 1).",
    "plate.megaplate.name": "Mega Plate [UX]",
    "plate.megaplate.sub": "Mega Evoluciona la figura seleccionada por 7 turnos (+20 DMG, +1★, +1 MP y Salto).",
    "plate.use_btn": "USAR PLACA",

    // P2P Salão
    "p2p.title": "🌐 SALA DE PARTIDAS P2P ONLINE",
    "p2p.create_room": "🏠 CREAR SALA",
    "p2p.join_room": "🚪 UNIRSE A SALA",
    "p2p.random_match": "⚡ BUSCAR PARTIDA ALEATORIA",
    "p2p.room_code": "CÓDIGO DE SALA:"
  }
};

let currentAppLanguage = (function() {
  try {
    const saved = localStorage.getItem("pokeduel_language");
    if (saved && (saved === "pt" || saved === "en" || saved === "es")) return saved;
  } catch (e) {}
  return "pt";
})();

function getAppLanguage() {
  return currentAppLanguage;
}

function t(key, fallback = "") {
  const dict = I18N_TRANSLATIONS[currentAppLanguage] || I18N_TRANSLATIONS["pt"];
  if (dict && dict[key] !== undefined) return dict[key];
  const ptDict = I18N_TRANSLATIONS["pt"];
  if (ptDict && ptDict[key] !== undefined) return ptDict[key];
  return fallback || key;
}

function setAppLanguage(lang) {
  if (lang !== "pt" && lang !== "en" && lang !== "es") return;
  currentAppLanguage = lang;
  try {
    localStorage.setItem("pokeduel_language", lang);
  } catch (e) {}

  updateAllLocalizedUI();
  if (typeof renderPlatesTray === "function") renderPlatesTray();
  if (typeof renderHubAndCollection === "function") renderHubAndCollection();
}

function updateAllLocalizedUI() {
  if (typeof document === "undefined") return;

  // Update Language selector buttons active style
  ["pt", "en", "es"].forEach(l => {
    const b = document.getElementById("lang-btn-" + l);
    if (b) {
      if (l === currentAppLanguage) {
        b.style.border = "2px solid #facc15";
        b.style.boxShadow = "0 0 10px rgba(250,204,21,0.6)";
        b.style.background = "linear-gradient(180deg,#0369a1,#0284c7)";
        b.style.fontWeight = "900";
      } else {
        b.style.border = "1px solid #334155";
        b.style.boxShadow = "none";
        b.style.background = "#0f172a";
        b.style.fontWeight = "700";
      }
    }
  });

  // Bottom Navigation Bar tabs
  const hubSpan = document.querySelector("#dtab-btn-hub span");
  if (hubSpan) hubSpan.textContent = t("nav.leagues");
  const deckSpan = document.querySelector("#dtab-btn-deck span");
  if (deckSpan) deckSpan.textContent = t("nav.decks");
  const fusionSpan = document.querySelector("#dtab-btn-fusion span");
  if (fusionSpan) fusionSpan.textContent = t("nav.fusion");
  const shopSpan = document.querySelector("#dtab-btn-shop span");
  if (shopSpan) shopSpan.textContent = t("nav.shop");
  const menuSpan = document.querySelector("#dtab-btn-menu span");
  if (menuSpan) menuSpan.textContent = t("nav.menu");

  // Elements with data-i18n attribute
  if (typeof document !== "undefined" && document.querySelectorAll) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.getAttribute("data-i18n");
      if (k) el.textContent = t(k, el.textContent);
    });
    document.querySelectorAll("[data-i18n-html]").forEach(el => {
      const k = el.getAttribute("data-i18n-html");
      if (k) el.innerHTML = t(k, el.innerHTML);
    });
  }

  // Update Language pill
  const langPill = document.getElementById("current-lang-pill");
  if (langPill) {
    langPill.textContent = currentAppLanguage === "en" ? "EN-US" : (currentAppLanguage === "es" ? "ES-ES" : "PT-BR");
  }

  // Update plate use button if open
  const uBtn = document.getElementById("plate-use-btn");
  if (uBtn) uBtn.textContent = t("plate.use_btn");
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => updateAllLocalizedUI());
  } else {
    updateAllLocalizedUI();
  }
}

window.I18N_TRANSLATIONS = I18N_TRANSLATIONS;
window.getAppLanguage = getAppLanguage;
window.setAppLanguage = setAppLanguage;
window.updateAllLocalizedUI = updateAllLocalizedUI;
window.t = t;
