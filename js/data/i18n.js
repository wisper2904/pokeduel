// ============================================================================
// POKÉMON DUEL INTERNATIONALIZATION (i18n) ENGINE - PT / EN / ES (v666)
// Complete translations for Pokémons, Moves, Abilities, Types, Shop, Decks,
// Fusion, Game Modes, Ranked Radar, Hotéis/Campaign, Battle Engine & Menus!
// ============================================================================

const I18N_TRANSLATIONS = {
  pt: {
    // Navigation
    "nav.leagues": "Ligas",
    "nav.decks": "Decks",
    "nav.fusion": "Fusão",
    "nav.shop": "Loja",
    "nav.menu": "Config",

    // Hub & Profile
    "hub.trainer": "Treinador",
    "hub.changelog": "NOTAS",
    "hub.update": "ATUALIZAR",
    "hub.one_touch": "1-Toque",
    "hub.tutorial": "TUTORIAL",
    "hub.guide": "Guia",
    "hub.feedback": "FEEDBACK",
    "hub.feedback_sub": "Ideias/Bugs",
    "hub.ranking_top10": "TOP 10",
    "hub.play_btn": "Play",
    "hub.season_reset_title": "TEMPORADA RANQUEADA",
    "hub.season_reset_desc": "Reset em {days} dias · Pontos retornam para 1000",
    "hub.lounge_online": "Salão Carmonte: {count} Treinadores Online",
    "hub.pedestal_on": "Pedestal: 3D",
    "hub.pedestal_off": "Só a Peça",

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
    "battle.in_pc": "Em recuperação no P.C.",
    "battle.bench_return": "retornou ao Banco com Wait 2",
    "battle.knocked_out": "nocauteado para o P.C.",

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

    // Figure Details Modal & Workshop
    "fdet.data_disk": "DATA DISK (96 FATIAS)",
    "fdet.ability_evo": "HABILIDADE & EVOLUÇÃO / LINHA [UX]",
    "fdet.expand_wheel": "🧬 Expandir Roleta (Fusão)",
    "fdet.close": "Fechar",
    "fdet.workshop": "⚙️ CARMONTE WORKSHOP",
    "fdet.disk_pts": "Disk Pts:",
    "fdet.clv_pts": "CLv Pts:",
    "fdet.size_btn": "+Size",
    "fdet.clv_btn": "+CLv",
    "fdet.donor": "Doador",
    "fdet.donor_active": "Doador ✓",
    "fdet.level_up": "⚡ +1 Nível (Pt)",
    "fdet.auto_opt": "⚙️ Auto-Otimizar",
    "fdet.reset": "↺ Reset",

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

    // Shop (Loja da Tia & Troca de Material)
    "shop.title": "🛒 TIA'S PFG SHOP (`/Shop/ExecFigureLot`)",
    "shop.subtitle": "Compre Boosters com Gems ou troque Material por qualquer Figura EX/UX!",
    "shop.daily_bonus": "🎁 Bônus Diário (24h)",
    "shop.time_boosters": "⏱️ TIME BOOSTERS DE PARTIDA (NO HUB):",
    "shop.time_boosters_sub": "Vença duelos para ganhar Caixas grátis e desbloquear novos Pokémon!",
    "shop.open_victory_btn": "🎁 Abrir Caixa",
    "shop.win_1_match": "🔒 Vença 1 Partida",
    "shop.sextuple": "🌈 Sextuple Booster (6x)",
    "shop.sextuple_sub": "Garante 1 [EX]/[UX] + 300 Material",
    "shop.quadruple": "🎁 Quadruple Booster (4x)",
    "shop.quadruple_sub": "4 Figuras + 1 Plate + 200 Material",
    "shop.double": "⚡ Double Booster (2x)",
    "shop.double_sub": "2 Figuras + 100 Material",
    "shop.single": "🎟️ Single Booster (1x)",
    "shop.single_sub": "1 Figura + 50 Material",
    "shop.coin_shop": "🪙 LOJA DE MOEDAS (SALDO:",
    "shop.coin_shop_sub": "Ganhe 🪙 vencendo partidas!",
    "shop.coin_box": "📦 Caixa de Moedas (1x)",
    "shop.coin_box_sub": "1 Pokémon + 1🟦 Rare Metal + 25🔷",
    "shop.rare_metal": "🟦 Rare Metal (Fusão Lv.1–5)",
    "shop.rare_metal_sub": "+1 Rare Metal (Estoque:",
    "shop.carmonite": "🟣 Lote Carmonite (+50)",
    "shop.carmonite_sub": "Para Fusão Lv.6–10 (Estoque:",
    "shop.cube": "🟩 Green Cube (+1 CLv)",
    "shop.cube_sub": "+1 DMG na Fusão (Estoque:",
    "shop.mat_exchange": "🔷 MATERIAL EXCHANGE",
    "shop.search_placeholder": "🔍 Buscar Pokémon na Loja (217 figuras)...",
    "shop.page_info": "Loja: {count} de {total} Pokémon (Pág {page}/{max})",
    "shop.prev": "◀ Anterior",
    "shop.next": "Próxima ▶",
    "shop.unlocked": "✅ DESBLOQUEADO",
    "shop.locked": "🔒 BLOQUEADO",
    "shop.unlock_btn": "🔓 Desbloquear",
    "shop.clv_btn": "⬆️ +1 CLv",
    "shop.insufficient_gems": "⚠️ Gemas insuficientes! Ganhe gemas em missões ou vitórias.",
    "shop.insufficient_coins": "⚠️ Moedas insuficientes! Vença partidas para acumular Coins.",
    "shop.insufficient_mat": "⚠️ Material insuficiente para trocar por esta figura!",
    "shop.purchase_success": "🎉 Compra realizada com sucesso!",

    // Decks (Casas de Decks & Maleta)
    "deck.collection_progress": "🔓 Coleção: {count}/{total} Pokémon · {active} Time Ativo",
    "deck.slot_active": "Slot #{num} Ativo",
    "deck.plate_case": "⚡ PLATE CASE (Toque para ativar/desativar no Deck):",
    "deck.figure_case": "📦 FIGURE CASE (Toque em ⓘ para Detalhes ou Equipar no Slot)",
    "deck.all": "TODOS (217)",
    "deck.owned": "✅ MEUS",
    "deck.missing": "🔒 FALTAM",
    "deck.search_placeholder": "🔍 Buscar entre os 217 Pokémon (nome, tipo, #dex)...",
    "deck.prev": "◀ Anterior",
    "deck.next": "Próxima ▶",

    // Fusion
    "fusion.title": "🧬 FUSÃO & EXPANSÃO DE ROLETA (`/Figure/SkillRangeExt`)",
    "fusion.select_target": "Selecione o Pokémon para Treinar/Fundir:",
    "fusion.materials": "🧪 Materiais de Fusão Disponíveis:",
    "fusion.rare_metal": "🟦 Rare Metal (+150 EXP)",
    "fusion.carmonite": "🟣 Carmonite (+50 Pt Carmonte)",
    "fusion.cube": "🟩 Green Cube (+1 CLv)",
    "fusion.exp_lbl": "EXP Ganho:",
    "fusion.cost_lbl": "Taxa em Moedas:",
    "fusion.max_reached": "Nível Máximo Atingido!",

    // Game Modes & Play Selector Modal
    "modes.title": "OUTROS MODOS DE DUELO",
    "modes.sub": "Multiplayer por Convite, Ginásio, Quests & Treino",
    "modes.room_match": "Room Match (Multiplayer por Convite P2P)",
    "modes.room_match_desc": "Conecte 2 celulares por código de 4 dígitos ou jogue 2P local",
    "modes.gym_cup": "Gym Cup (Copa de Ginásio Temática)",
    "modes.gym_cup_desc": "🌿 Copa de Grama & Fogo · Grama (+1 MP) · Fogo (+20 DMG) · Vale Troféus!",
    "modes.quests": "Quests (Campanha Carmonte Island · ⚡15)",
    "modes.quests_desc": "Usa 15⚡ da Barra Verde · Hotéis Ulex, Rosa, Atlantis, Elysium",
    "modes.training": "Training Center (Treino Tático Livre)",
    "modes.training_desc": "Treino sem risco: 0 Pontos ELO e Sem Recompensas/Caixas",
    "modes.ranked_tip": "⚡ Para jogar Ranqueada (League Match), toque no botão principal Play!",

    // Ranked Matchmaker Radar Modal
    "mm.league_ranked": "🏆 LIGA CARMONTE · RANQUEADA",
    "mm.searching": "BUSCANDO ADVERSÁRIO ONLINE",
    "mm.syncing": "Sincronizando com a rede de treinadores da Liga...",
    "mm.search_time": "Tempo de Busca:",
    "mm.scanning_queue": "📡 Escaneando fila de matchmaking online...",
    "mm.active_queue": "FILA ATIVA",
    "mm.cancel": "✕ Cancelar",
    "mm.play_bot": "⚡ Jogar com Bot",

    // Combat Outcomes & Reasons
    "combat.blue_defense": "Defesa Azul! Ambos mantêm suas posições.",
    "combat.miss_both": "Ambos giraram Falha!",
    "combat.miss_win": "{loser} girou Falha! {winner} venceu!",
    "combat.gold_beats_purple": "Ataque Dourado ({gold}) venceu Roxo ({purple})! Nocaute!",
    "combat.purple_beats_white": "Ataque Roxo ({purple} ★{stars}) superou Branco! Efeito ativado!",
    "combat.star_beats_star": "★{highStars} superou ★{lowStars}! Efeito ativado!",
    "combat.star_tie": "Empate de Estrelas Roxas (★{stars})! Ambos mantêm posições.",
    "combat.dmg_beats_dmg": "{winner} ({winDmg}) derrotou {loser} ({loseDmg})!",
    "combat.dmg_tie": "Empate de Dano ({dmg} vs {dmg})! Ambos mantêm posições.",
    "combat.hyper_sonic": "🛡️ Hipersônico ({name}): Imune a nocaute contra 100+ DANO!",

    // Status Effects
    "effect.push": "Empurrão",
    "effect.sleep": "Dormir",
    "effect.paralyze": "Paralisia",
    "effect.panic": "Confusão",
    "effect.badpoison": "Veneno Tóx.",
    "effect.poison": "Veneno",
    "effect.freeze": "Congelar",
    "effect.burn": "Queimar",
    "effect.ko": "Nocaute",
    "effect.swap": "Troca",
    "effect.wait": "Espera",

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

    // Hub & Profile
    "hub.trainer": "Trainer",
    "hub.changelog": "NOTES",
    "hub.update": "UPDATE",
    "hub.one_touch": "1-Tap",
    "hub.tutorial": "TUTORIAL",
    "hub.guide": "Guide",
    "hub.feedback": "FEEDBACK",
    "hub.feedback_sub": "Ideas/Bugs",
    "hub.ranking_top10": "TOP 10",
    "hub.play_btn": "Play",
    "hub.season_reset_title": "RANKED SEASON",
    "hub.season_reset_desc": "Reset in {days} days · Rating resets to 1000",
    "hub.lounge_online": "Carmonte Lounge: {count} Trainers Online",
    "hub.pedestal_on": "3D Pedestal",
    "hub.pedestal_off": "Figure Only",

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
    "battle.in_pc": "Recovering in P.C.",
    "battle.bench_return": "returned to Bench with Wait 2",
    "battle.knocked_out": "knocked out to P.C.",

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

    // Figure Details Modal & Workshop
    "fdet.data_disk": "DATA DISK (96 SLICES)",
    "fdet.ability_evo": "ABILITY & EVOLUTION / [UX] LINE",
    "fdet.expand_wheel": "🧬 Expand Wheel (Fusion)",
    "fdet.close": "Close",
    "fdet.workshop": "⚙️ CARMONTE WORKSHOP",
    "fdet.disk_pts": "Disk Pts:",
    "fdet.clv_pts": "CLv Pts:",
    "fdet.size_btn": "+Size",
    "fdet.clv_btn": "+CLv",
    "fdet.donor": "Donor",
    "fdet.donor_active": "Donor ✓",
    "fdet.level_up": "⚡ +1 Level (Pt)",
    "fdet.auto_opt": "⚙️ Auto-Optimize",
    "fdet.reset": "↺ Reset",

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

    // Shop
    "shop.title": "🛒 TIA'S PFG SHOP (`/Shop/ExecFigureLot`)",
    "shop.subtitle": "Buy Boosters with Gems or exchange Material for any EX/UX Figure!",
    "shop.daily_bonus": "🎁 Daily Bonus (24h)",
    "shop.time_boosters": "⏱️ MATCH TIME BOOSTERS (IN HUB):",
    "shop.time_boosters_sub": "Win duels to earn free Boosters and unlock new Pokémon!",
    "shop.open_victory_btn": "🎁 Open Box",
    "shop.win_1_match": "🔒 Win 1 Match",
    "shop.sextuple": "🌈 Sextuple Booster (6x)",
    "shop.sextuple_sub": "Guarantees 1 [EX]/[UX] + 300 Material",
    "shop.quadruple": "🎁 Quadruple Booster (4x)",
    "shop.quadruple_sub": "4 Figures + 1 Plate + 200 Material",
    "shop.double": "⚡ Double Booster (2x)",
    "shop.double_sub": "2 Figures + 100 Material",
    "shop.single": "🎟️ Single Booster (1x)",
    "shop.single_sub": "1 Figure + 50 Material",
    "shop.coin_shop": "🪙 COIN SHOP (BALANCE:",
    "shop.coin_shop_sub": "Earn 🪙 by winning matches!",
    "shop.coin_box": "📦 Coin Box (1x)",
    "shop.coin_box_sub": "1 Pokémon + 1🟦 Rare Metal + 25🔷",
    "shop.rare_metal": "🟦 Rare Metal (Fusion Lv.1–5)",
    "shop.rare_metal_sub": "+1 Rare Metal (Stock:",
    "shop.carmonite": "🟣 Carmonite Pack (+50)",
    "shop.carmonite_sub": "For Fusion Lv.6–10 (Stock:",
    "shop.cube": "🟩 Green Cube (+1 CLv)",
    "shop.cube_sub": "+1 DMG in Fusion (Stock:",
    "shop.mat_exchange": "🔷 MATERIAL EXCHANGE",
    "shop.search_placeholder": "🔍 Search Pokémon in Shop (217 figures)...",
    "shop.page_info": "Shop: {count} of {total} Pokémon (Page {page}/{max})",
    "shop.prev": "◀ Previous",
    "shop.next": "Next ▶",
    "shop.unlocked": "✅ UNLOCKED",
    "shop.locked": "🔒 LOCKED",
    "shop.unlock_btn": "🔓 Unlock",
    "shop.clv_btn": "⬆️ +1 CLv",
    "shop.insufficient_gems": "⚠️ Not enough Gems! Earn Gems through quests or victories.",
    "shop.insufficient_coins": "⚠️ Not enough Coins! Win matches to earn Coins.",
    "shop.insufficient_mat": "⚠️ Not enough Material to exchange for this figure!",
    "shop.purchase_success": "🎉 Purchase successful!",

    // Decks
    "deck.collection_progress": "🔓 Collection: {count}/{total} Pokémon · {active} Active Deck",
    "deck.slot_active": "Slot #{num} Active",
    "deck.plate_case": "⚡ PLATE CASE (Tap to equip/unequip in Deck):",
    "deck.figure_case": "📦 FIGURE CASE (Tap ⓘ for Details or Equip to Slot)",
    "deck.all": "ALL (217)",
    "deck.owned": "✅ OWNED",
    "deck.missing": "🔒 LOCKED",
    "deck.search_placeholder": "🔍 Search across 217 Pokémon (name, type, #dex)...",
    "deck.prev": "◀ Previous",
    "deck.next": "Next ▶",

    // Fusion
    "fusion.title": "🧬 FUSION & WHEEL EXPANSION (`/Figure/SkillRangeExt`)",
    "fusion.select_target": "Select Pokémon to Train/Fuse:",
    "fusion.materials": "🧪 Available Fusion Materials:",
    "fusion.rare_metal": "🟦 Rare Metal (+150 EXP)",
    "fusion.carmonite": "🟣 Carmonite (+50 Carmonite Pt)",
    "fusion.cube": "🟩 Green Cube (+1 CLv)",
    "fusion.exp_lbl": "EXP Gained:",
    "fusion.cost_lbl": "Coin Fee:",
    "fusion.max_reached": "Max Level Reached!",

    // Game Modes & Play Selector Modal
    "modes.title": "OTHER DUEL MODES",
    "modes.sub": "Invite Multiplayer, Gym Cup, Quests & Training",
    "modes.room_match": "Room Match (P2P Invite Multiplayer)",
    "modes.room_match_desc": "Connect 2 devices via 4-digit code or play 2P locally",
    "modes.gym_cup": "Gym Cup (Themed Gym Cup)",
    "modes.gym_cup_desc": "🌿 Grass & Fire Cup · Grass (+1 MP) · Fire (+20 DMG) · Earn Trophies!",
    "modes.quests": "Quests (Carmonte Island Campaign · ⚡15)",
    "modes.quests_desc": "Uses 15⚡ Green Energy · Ulex, Rosa, Atlantis, Elysium Hotels",
    "modes.training": "Training Center (Free Tactical Practice)",
    "modes.training_desc": "Zero-risk practice: 0 ELO points & No Rewards/Boxes",
    "modes.ranked_tip": "⚡ To play Ranked (League Match), tap the main Play button!",

    // Ranked Matchmaker Radar Modal
    "mm.league_ranked": "🏆 CARMONTE LEAGUE · RANKED",
    "mm.searching": "SEARCHING FOR ONLINE OPPONENT",
    "mm.syncing": "Syncing with the League trainer network...",
    "mm.search_time": "Search Time:",
    "mm.scanning_queue": "📡 Scanning online matchmaking queue...",
    "mm.active_queue": "ACTIVE QUEUE",
    "mm.cancel": "✕ Cancel",
    "mm.play_bot": "⚡ Play vs Bot",

    // Combat Outcomes & Reasons
    "combat.blue_defense": "Blue Defense! Both hold ground.",
    "combat.miss_both": "Both spun Miss!",
    "combat.miss_win": "{loser} spun Miss! {winner} wins!",
    "combat.gold_beats_purple": "Gold Attack ({gold}) beats Purple ({purple})! Knockout!",
    "combat.purple_beats_white": "Purple Attack ({purple} ★{stars}) beats White! Effect activated!",
    "combat.star_beats_star": "★{highStars} beats ★{lowStars}! Effect activated!",
    "combat.star_tie": "Purple Star Tie (★{stars})! Both hold ground.",
    "combat.dmg_beats_dmg": "{winner} ({winDmg}) defeats {loser} ({loseDmg})!",
    "combat.dmg_tie": "Damage Tie ({dmg} vs {dmg})! Both hold ground.",
    "combat.hyper_sonic": "🛡️ Hyper Sonic ({name}): Immune to knockout against 100+ DMG!",

    // Status Effects
    "effect.push": "Knockback",
    "effect.sleep": "Sleep",
    "effect.paralyze": "Paralysis",
    "effect.panic": "Confusion",
    "effect.badpoison": "Bad Poison",
    "effect.poison": "Poison",
    "effect.freeze": "Freeze",
    "effect.burn": "Burn",
    "effect.ko": "Knockout",
    "effect.swap": "Swap",
    "effect.wait": "Wait",

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

    // Hub & Profile
    "hub.trainer": "Entrenador",
    "hub.changelog": "NOTAS",
    "hub.update": "ACTUALIZAR",
    "hub.one_touch": "1-Toque",
    "hub.tutorial": "TUTORIAL",
    "hub.guide": "Guía",
    "hub.feedback": "COMENTARIOS",
    "hub.feedback_sub": "Ideas/Bugs",
    "hub.ranking_top10": "TOP 10",
    "hub.play_btn": "Jugar",
    "hub.season_reset_title": "TEMPORADA CLASIFICATORIA",
    "hub.season_reset_desc": "Reinicio en {days} días · Puntos vuelven a 1000",
    "hub.lounge_online": "Salón Carmonte: {count} Entrenadores Online",
    "hub.pedestal_on": "Pedestal 3D",
    "hub.pedestal_off": "Solo la Figura",

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
    "battle.in_pc": "En recuperación en el P.C.",
    "battle.bench_return": "volvió a la Banca con Espera 2",
    "battle.knocked_out": "derrotado al P.C.",

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

    // Figure Details Modal & Workshop
    "fdet.data_disk": "DISCO DE DATOS (96 PARTES)",
    "fdet.ability_evo": "HABILIDAD Y EVOLUCIÓN / LÍNEA [UX]",
    "fdet.expand_wheel": "🧬 Expandir Ruleta (Fusión)",
    "fdet.close": "Cerrar",
    "fdet.workshop": "⚙️ CARMONTE WORKSHOP",
    "fdet.disk_pts": "Disk Pts:",
    "fdet.clv_pts": "CLv Pts:",
    "fdet.size_btn": "+Size",
    "fdet.clv_btn": "+CLv",
    "fdet.donor": "Donante",
    "fdet.donor_active": "Donante ✓",
    "fdet.level_up": "⚡ +1 Nivel (Pt)",
    "fdet.auto_opt": "⚙️ Auto-Optimizar",
    "fdet.reset": "↺ Reset",

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

    // Shop
    "shop.title": "🛒 TIA'S PFG SHOP (`/Shop/ExecFigureLot`)",
    "shop.subtitle": "¡Compra Boosters con Gemas o canjea Material por cualquier Figura EX/UX!",
    "shop.daily_bonus": "🎁 Bono Diario (24h)",
    "shop.time_boosters": "⏱️ TIME BOOSTERS DE PARTIDA (EN EL HUB):",
    "shop.time_boosters_sub": "¡Gana duelos para conseguir Cajas gratis y desbloquear nuevos Pokémon!",
    "shop.open_victory_btn": "🎁 Abrir Caja",
    "shop.win_1_match": "🔒 Gana 1 Partida",
    "shop.sextuple": "🌈 Sextuple Booster (6x)",
    "shop.sextuple_sub": "Garantiza 1 [EX]/[UX] + 300 Material",
    "shop.quadruple": "🎁 Quadruple Booster (4x)",
    "shop.quadruple_sub": "4 Figuras + 1 Placa + 200 Material",
    "shop.double": "⚡ Double Booster (2x)",
    "shop.double_sub": "2 Figuras + 100 Material",
    "shop.single": "🎟️ Single Booster (1x)",
    "shop.single_sub": "1 Figura + 50 Material",
    "shop.coin_shop": "🪙 TIENDA DE MONEDAS (SALDO:",
    "shop.coin_shop_sub": "¡Gana 🪙 ganando partidas!",
    "shop.coin_box": "📦 Caja de Monedas (1x)",
    "shop.coin_box_sub": "1 Pokémon + 1🟦 Rare Metal + 25🔷",
    "shop.rare_metal": "🟦 Rare Metal (Fusión Lv.1–5)",
    "shop.rare_metal_sub": "+1 Rare Metal (Existencias:",
    "shop.carmonite": "🟣 Lote Carmonite (+50)",
    "shop.carmonite_sub": "Para Fusión Lv.6–10 (Existencias:",
    "shop.cube": "🟩 Green Cube (+1 CLv)",
    "shop.cube_sub": "+1 DMG en Fusión (Existencias:",
    "shop.mat_exchange": "🔷 CANJE DE MATERIAL",
    "shop.search_placeholder": "🔍 Buscar Pokémon en la Tienda (217 figuras)...",
    "shop.page_info": "Tienda: {count} de {total} Pokémon (Pág {page}/{max})",
    "shop.prev": "◀ Anterior",
    "shop.next": "Siguiente ▶",
    "shop.unlocked": "✅ DESBLOQUEADO",
    "shop.locked": "🔒 BLOQUEADO",
    "shop.unlock_btn": "🔓 Desbloquear",
    "shop.clv_btn": "⬆️ +1 CLv",
    "shop.insufficient_gems": "⚠️ ¡Gemas insuficientes! Gana gemas en misiones o victorias.",
    "shop.insufficient_coins": "⚠️ ¡Monedas insuficientes! Gana partidas para acumular Coins.",
    "shop.insufficient_mat": "⚠️ ¡Material insuficiente para canjear por esta figura!",
    "shop.purchase_success": "🎉 ¡Compra realizada con éxito!",

    // Decks
    "deck.collection_progress": "🔓 Colección: {count}/{total} Pokémon · {active} Mazo Activo",
    "deck.slot_active": "Espacio #{num} Activo",
    "deck.plate_case": "⚡ ESTUCHE DE PLACAS (Toca para equipar/desequipar en el Mazo):",
    "deck.figure_case": "📦 MALETÍN DE FIGURAS (Toca ⓘ para Detalles o Equipar en el Espacio)",
    "deck.all": "TODOS (217)",
    "deck.owned": "✅ MIS",
    "deck.missing": "🔒 FALTAN",
    "deck.search_placeholder": "🔍 Buscar entre los 217 Pokémon (nombre, tipo, #dex)...",
    "deck.prev": "◀ Anterior",
    "deck.next": "Siguiente ▶",

    // Fusion
    "fusion.title": "🧬 FUSIÓN Y EXPANSIÓN DE RULETA (`/Figure/SkillRangeExt`)",
    "fusion.select_target": "Selecciona el Pokémon para Entrenar/Fusionar:",
    "fusion.materials": "🧪 Materiales de Fusión Disponibles:",
    "fusion.rare_metal": "🟦 Rare Metal (+150 EXP)",
    "fusion.carmonite": "🟣 Carmonite (+50 Pt Carmonte)",
    "fusion.cube": "🟩 Green Cube (+1 CLv)",
    "fusion.exp_lbl": "EXP Ganado:",
    "fusion.cost_lbl": "Coste en Monedas:",
    "fusion.max_reached": "¡Nivel Máximo Alcanzado!",

    // Game Modes & Play Selector Modal
    "modes.title": "OTROS MODOS DE DUELO",
    "modes.sub": "Multijugador por Invitación, Gimnasio, Quests y Entrenamiento",
    "modes.room_match": "Room Match (Multijugador por Invitación P2P)",
    "modes.room_match_desc": "Conecta 2 móviles mediante código de 4 dígitos o juega 2P local",
    "modes.gym_cup": "Gym Cup (Copa de Gimnasio Temática)",
    "modes.gym_cup_desc": "🌿 Copa de Planta y Fuego · Planta (+1 MP) · Fuego (+20 DMG) · ¡Gana Trofeos!",
    "modes.quests": "Quests (Campaña Carmonte Island · ⚡15)",
    "modes.quests_desc": "Usa 15⚡ de Energía Verde · Hoteles Ulex, Rosa, Atlantis, Elysium",
    "modes.training": "Training Center (Entrenamiento Táctico Libre)",
    "modes.training_desc": "Práctica sin riesgo: 0 puntos ELO y sin recompensas/cajas",
    "modes.ranked_tip": "⚡ ¡Para jugar Clasificatoria (League Match), toca el botón principal Play!",

    // Ranked Matchmaker Radar Modal
    "mm.league_ranked": "🏆 LIGA CARMONTE · CLASIFICATORIA",
    "mm.searching": "BUSCANDO OPONENTE ONLINE",
    "mm.syncing": "Sincronizando con la red de entrenadores de la Liga...",
    "mm.search_time": "Tiempo de Búsqueda:",
    "mm.scanning_queue": "📡 Escaneando cola de emparejamiento online...",
    "mm.active_queue": "COLA ACTIVA",
    "mm.cancel": "✕ Cancelar",
    "mm.play_bot": "⚡ Jugar con Bot",

    // Combat Outcomes & Reasons
    "combat.blue_defense": "¡Defensa Azul! Ambos mantienen sus posiciones.",
    "combat.miss_both": "¡Ambos sacaron Fallo!",
    "combat.miss_win": "¡{loser} sacó Fallo! ¡{winner} ganó!",
    "combat.gold_beats_purple": "¡Ataque Dorado ({gold}) venció a Púrpura ({purple})! ¡Noqueo!",
    "combat.purple_beats_white": "¡Ataque Púrpura ({purple} ★{stars}) venció a Blanco! ¡Efecto activado!",
    "combat.star_beats_star": "¡★{highStars} venció a ★{lowStars}! ¡Efecto activado!",
    "combat.star_tie": "¡Empate de Estrellas Púrpuras (★{stars})! Ambos mantienen posiciones.",
    "combat.dmg_beats_dmg": "¡{winner} ({winDmg}) derrotó a {loser} ({loseDmg})!",
    "combat.dmg_tie": "¡Empate de Daño ({dmg} vs {dmg})! Ambos mantienen posiciones.",
    "combat.hyper_sonic": "🛡️ Hipersónico ({name}): ¡Inmune a noqueo ante 100+ DAÑO!",

    // Status Effects
    "effect.push": "Empujón",
    "effect.sleep": "Sueño",
    "effect.paralyze": "Parálisis",
    "effect.panic": "Confusión",
    "effect.badpoison": "Veneno Tóx.",
    "effect.poison": "Veneno",
    "effect.freeze": "Congelar",
    "effect.burn": "Quemadura",
    "effect.ko": "Noqueo",
    "effect.swap": "Cambio",
    "effect.wait": "Espera",

    // P2P Salão
    "p2p.title": "🌐 SALA DE PARTIDAS P2P ONLINE",
    "p2p.create_room": "🏠 CREAR SALA",
    "p2p.join_room": "🚪 UNIRSE A SALA",
    "p2p.random_match": "⚡ BUSCAR PARTIDA ALEATORIA",
    "p2p.room_code": "CÓDIGO DE SALA:"
  }
};

// ============================================================================
// COMPREHENSIVE POKÉMON MOVES TRANSLATION DICTIONARY (PT / EN / ES)
// ============================================================================
const POKEMON_MOVES_I18N = {
  "absorb": {
    "pt": "Absorção",
    "es": "Absorber"
  },
  "abyssal grip": {
    "pt": "Garra Abissal",
    "es": "Agarre Abisal"
  },
  "abyssal hunter": {
    "pt": "Caçador Abissal",
    "es": "Cazador Abisal"
  },
  "acid": {
    "pt": "Ácido",
    "es": "Ácido"
  },
  "acrobatics": {
    "pt": "Acrobacia",
    "es": "Acróbata"
  },
  "aeroblast": {
    "pt": "Aeroexplosão",
    "es": "Aerochorro"
  },
  "agility": {
    "pt": "Agilidade",
    "es": "Agilidad"
  },
  "air cutter": {
    "pt": "Cortador de Ar",
    "es": "Aire Afilado"
  },
  "air slash": {
    "pt": "Golpe de Ar",
    "es": "Tajo Aéreo"
  },
  "alchemy": {
    "pt": "Alquimia",
    "es": "Alquimia"
  },
  "ancient power": {
    "pt": "Poder Antigo",
    "es": "Poder Pasado"
  },
  "annihilate": {
    "pt": "Aniquilar",
    "es": "Aniquilar"
  },
  "aqua jet": {
    "pt": "Jato d'Água",
    "es": "Acua Jet"
  },
  "aqua tail": {
    "pt": "Cauda d'Água",
    "es": "Acua Cola"
  },
  "arm thrust": {
    "pt": "Empurrão de Braço",
    "es": "Empujón"
  },
  "astonish": {
    "pt": "Espanto",
    "es": "Impresionar"
  },
  "aura sphere": {
    "pt": "Esfera de Aura",
    "es": "Esfera Aural"
  },
  "aurora beam": {
    "pt": "Raio Aurora",
    "es": "Rayo Aurora"
  },
  "aurora veil": {
    "pt": "Véu de Aurora",
    "es": "Velo Aurora"
  },
  "avalanche": {
    "pt": "Avalanche",
    "es": "Alud"
  },
  "backtrack": {
    "pt": "Recuar",
    "es": "Retroceso"
  },
  "barrier": {
    "pt": "Barreira",
    "es": "Barrera"
  },
  "big yawn": {
    "pt": "Grande Bocejo",
    "es": "Gran Bostezo"
  },
  "bind": {
    "pt": "Aperto",
    "es": "Atadura"
  },
  "bite": {
    "pt": "Mordida",
    "es": "Mordisco"
  },
  "blaze kick": {
    "pt": "Chute Flamejante",
    "es": "Patada Ígnea"
  },
  "blizzard": {
    "pt": "Nevasca",
    "es": "Ventisca"
  },
  "bloom shield": {
    "pt": "Escudo Floral",
    "es": "Escudo Floral"
  },
  "body slam": {
    "pt": "Pancada Corporal",
    "es": "Golpe Cuerpo"
  },
  "bone rush": {
    "pt": "Investida de Osso",
    "es": "Ataque Óseo"
  },
  "bonemerang": {
    "pt": "Ossomerangue",
    "es": "Huesomerang"
  },
  "bounce": {
    "pt": "Ricochete",
    "es": "Bote"
  },
  "break energy": {
    "pt": "Quebra de Energia",
    "es": "Ruptura Energía"
  },
  "brick break": {
    "pt": "Quebra de Tijolo",
    "es": "Demolición"
  },
  "brine": {
    "pt": "Água Salgada",
    "es": "Salmuera"
  },
  "bubble": {
    "pt": "Bolha",
    "es": "Burbuja"
  },
  "bubble beam": {
    "pt": "Raio de Bolhas",
    "es": "Rayo Burbuja"
  },
  "bug bite": {
    "pt": "Mordida de Inseto",
    "es": "Picadura"
  },
  "bug buzz": {
    "pt": "Zumbido de Inseto",
    "es": "Zumbido"
  },
  "bulldoze": {
    "pt": "Demolição",
    "es": "Terratemblor"
  },
  "bullet punch": {
    "pt": "Soco Projétil",
    "es": "Puño Bala"
  },
  "bullet seed": {
    "pt": "Bala de Sementes",
    "es": "Recurrente"
  },
  "calm mind": {
    "pt": "Paz de Espírito",
    "es": "Paz Mental"
  },
  "chip away": {
    "pt": "Desgastar",
    "es": "Guardia Baja"
  },
  "cold crush": {
    "pt": "Esmagamento Gélido",
    "es": "Aplastamiento Frío"
  },
  "confuse ray": {
    "pt": "Raio de Confusão",
    "es": "Rayo Confuso"
  },
  "confusion": {
    "pt": "Confusão",
    "es": "Confusión"
  },
  "copycat": {
    "pt": "Imitação",
    "es": "Copión"
  },
  "cosmic power": {
    "pt": "Poder Cósmico",
    "es": "Masa Cósmica"
  },
  "counter": {
    "pt": "Contra-Ataque",
    "es": "Contraataque"
  },
  "crimson flame": {
    "pt": "Chama Carmesim",
    "es": "Llama Carmesí"
  },
  "cross chop": {
    "pt": "Golpe Cruzado",
    "es": "Tajo Cruzado"
  },
  "cross poison": {
    "pt": "Veneno Cruzado",
    "es": "Veneno X"
  },
  "crunch": {
    "pt": "Mastigada",
    "es": "Triturar"
  },
  "crush grip": {
    "pt": "Aperto Esmagador",
    "es": "Agarrón"
  },
  "crushing squeeze": {
    "pt": "Aperto Esmagador",
    "es": "Apretón Triturador"
  },
  "crushing flames": {
    "pt": "Chamas Esmagadoras",
    "es": "Llamas Aplastantes"
  },
  "curse": {
    "pt": "Maldição",
    "es": "Maldición"
  },
  "cyclone kick": {
    "pt": "Chute Ciclone",
    "es": "Patada Ciclón"
  },
  "dark leap": {
    "pt": "Salto Sombrio",
    "es": "Salto Oscuro"
  },
  "dark pulse": {
    "pt": "Pulso Sombrio",
    "es": "Pulso Umbrío"
  },
  "dark void": {
    "pt": "Vazio Sombrio",
    "es": "Brecha Negra"
  },
  "destiny bond": {
    "pt": "Vínculo do Destino",
    "es": "Mismo Destino"
  },
  "detect": {
    "pt": "Detectar",
    "es": "Detección"
  },
  "diamond dust": {
    "pt": "Poeira de Diamante",
    "es": "Polvo de Diamante"
  },
  "dig": {
    "pt": "Cavar",
    "es": "Excavar"
  },
  "dimensional slip": {
    "pt": "Deslize Dimensional",
    "es": "Desliz Dimensional"
  },
  "dimensional warp": {
    "pt": "Dobra Dimensional",
    "es": "Distorsión Dimensional"
  },
  "disable": {
    "pt": "Desabilitar",
    "es": "Anulación"
  },
  "disarming voice": {
    "pt": "Voz Encantadora",
    "es": "Voz Cautivadora"
  },
  "discharge": {
    "pt": "Descarga",
    "es": "Chispazo"
  },
  "dive": {
    "pt": "Mergulho",
    "es": "Buceo"
  },
  "dizzy punch": {
    "pt": "Soco Tonto",
    "es": "Puño Mareo"
  },
  "dodge": {
    "pt": "Desvio",
    "es": "Esquiva"
  },
  "doom desire": {
    "pt": "Desejo Fatídico",
    "es": "Deseo Oculto"
  },
  "double edge": {
    "pt": "Fio Duplo",
    "es": "Doble Filo"
  },
  "double flight": {
    "pt": "Voo Duplo",
    "es": "Vuelo Doble"
  },
  "double hit": {
    "pt": "Golpe Duplo",
    "es": "Doble Golpe"
  },
  "double slap": {
    "pt": "Tapa Duplo",
    "es": "Doble Bofetón"
  },
  "double team": {
    "pt": "Time Duplo",
    "es": "Doble Equipo"
  },
  "draco meteor": {
    "pt": "Meteoro do Dragão",
    "es": "Cometa Draco"
  },
  "dragon ascent": {
    "pt": "Ascensão do Dragão",
    "es": "Ascenso Draco"
  },
  "dragon breath": {
    "pt": "Sopro do Dragão",
    "es": "Dragoaliento"
  },
  "dragon claw": {
    "pt": "Garra de Dragão",
    "es": "Garra Dragón"
  },
  "dragon dance": {
    "pt": "Dança do Dragão",
    "es": "Danza Dragón"
  },
  "dragon pulse": {
    "pt": "Pulso do Dragão",
    "es": "Pulso Dragón"
  },
  "dragon rage": {
    "pt": "Fúria do Dragão",
    "es": "Furia Dragón"
  },
  "dragon rush": {
    "pt": "Investida do Dragão",
    "es": "Carga Dragón"
  },
  "dragon tail": {
    "pt": "Cauda do Dragão",
    "es": "Cola Dragón"
  },
  "dragon wing": {
    "pt": "Asa do Dragão",
    "es": "Ala Dragón"
  },
  "drain punch": {
    "pt": "Soco Drenante",
    "es": "Puño Drenaje"
  },
  "drill peck": {
    "pt": "Bico Broca",
    "es": "Pico Taladro"
  },
  "drill run": {
    "pt": "Ataque Broca",
    "es": "Taladradora"
  },
  "drive kick": {
    "pt": "Chute Impulsor",
    "es": "Patada Impulso"
  },
  "dynamic punch": {
    "pt": "Soco Dinâmico",
    "es": "Puño Dinámico"
  },
  "earth power": {
    "pt": "Poder da Terra",
    "es": "Tierra Viva"
  },
  "earthquake": {
    "pt": "Terremoto",
    "es": "Terremoto"
  },
  "eerie impulse": {
    "pt": "Impulso Estranho",
    "es": "Onda Anómala"
  },
  "electro ball": {
    "pt": "Bola Elétrica",
    "es": "Bola Voltio"
  },
  "ember": {
    "pt": "Brasa",
    "es": "Ascuas"
  },
  "energy ball": {
    "pt": "Esfera de Energia",
    "es": "Energibola"
  },
  "eruption": {
    "pt": "Erupção",
    "es": "Erupción"
  },
  "explosion": {
    "pt": "Explosão",
    "es": "Explosión"
  },
  "extrasensory": {
    "pt": "Extrassensorial",
    "es": "Paranormal"
  },
  "extreme speed": {
    "pt": "Velocidade Extrema",
    "es": "Velocidad Extrema"
  },
  "fake out": {
    "pt": "Surpresa",
    "es": "Sorpresa"
  },
  "false swipe": {
    "pt": "Golpe Falso",
    "es": "Falsotortazo"
  },
  "feint": {
    "pt": "Finta",
    "es": "Amago"
  },
  "feint attack": {
    "pt": "Ataque Furtivo",
    "es": "Finta"
  },
  "fire blast": {
    "pt": "Explosão de Fogo",
    "es": "Llamarada"
  },
  "fire fang": {
    "pt": "Presa de Fogo",
    "es": "Colmillo Ígneo"
  },
  "fire ice thunder punch": {
    "pt": "Soco Tríplice Elemental",
    "es": "Puño Fuego Hielo Trueno"
  },
  "fire punch": {
    "pt": "Soco de Fogo",
    "es": "Puño Fuego"
  },
  "fire spin": {
    "pt": "Giro de Fogo",
    "es": "Giro Fuego"
  },
  "fissure": {
    "pt": "Fissura",
    "es": "Fisura"
  },
  "flail": {
    "pt": "Espernear",
    "es": "Azote"
  },
  "flame charge": {
    "pt": "Carga de Fogo",
    "es": "Nitrocarga"
  },
  "flame gun": {
    "pt": "Pistola de Chamas",
    "es": "Pistola Ígnea"
  },
  "flame kinesis": {
    "pt": "Cinese Flamejante",
    "es": "Kinesis Ígnea"
  },
  "flame wheel": {
    "pt": "Roda de Fogo",
    "es": "Rueda Fuego"
  },
  "flamethrower": {
    "pt": "Lança-Chamas",
    "es": "Lanzallamas"
  },
  "flare blitz": {
    "pt": "Carga de Chamas",
    "es": "Envite Ígneo"
  },
  "flash": {
    "pt": "Clarão",
    "es": "Destello"
  },
  "flash cannon": {
    "pt": "Canhão de Luz",
    "es": "Foco Resplandor"
  },
  "fly": {
    "pt": "Voar",
    "es": "Vuelo"
  },
  "focus blast": {
    "pt": "Explosão Focalizada",
    "es": "Onda Certera"
  },
  "focus energy": {
    "pt": "Foco de Energia",
    "es": "Foco Energía"
  },
  "force palm": {
    "pt": "Palma de Força",
    "es": "Palmeo"
  },
  "foul play": {
    "pt": "Jogo Sujo",
    "es": "Juego Sucio"
  },
  "freeze-dry": {
    "pt": "Liofilização",
    "es": "Liofilización"
  },
  "fury attack": {
    "pt": "Ataque de Fúria",
    "es": "Ataque Furia"
  },
  "fury cutter": {
    "pt": "Cortador de Fúria",
    "es": "Corte Furia"
  },
  "fury swipes": {
    "pt": "Golpes de Fúria",
    "es": "Golpes Furia"
  },
  "giga drain": {
    "pt": "Mega Dreno",
    "es": "Gigadrenado"
  },
  "giga impact": {
    "pt": "Giga Impacto",
    "es": "Gigaimpacto"
  },
  "glare": {
    "pt": "Olhar Paralisante",
    "es": "Deslumbrar"
  },
  "grass knot": {
    "pt": "Nó de Grama",
    "es": "Hierba Lazo"
  },
  "grass whistle": {
    "pt": "Silbato de Grama",
    "es": "Silbato"
  },
  "growl": {
    "pt": "Rosnado",
    "es": "Gruñido"
  },
  "guillotine": {
    "pt": "Guilhotina",
    "es": "Guillotina"
  },
  "gunk shot": {
    "pt": "Tiro de Sujeira",
    "es": "Lanzamugre"
  },
  "gust": {
    "pt": "Rajada de Vento",
    "es": "Tornado"
  },
  "gyro ball": {
    "pt": "Girobola",
    "es": "Giro Bola"
  },
  "hammer arm": {
    "pt": "Braço de Martelo",
    "es": "Machada"
  },
  "harden": {
    "pt": "Endurecer",
    "es": "Fortaleza"
  },
  "haze": {
    "pt": "Neblina",
    "es": "Niebla"
  },
  "head smash": {
    "pt": "Batida de Cabeça",
    "es": "Testarazo"
  },
  "headbutt": {
    "pt": "Cabeçada",
    "es": "Cabezazo"
  },
  "heat wave": {
    "pt": "Onda de Calor",
    "es": "Onda Ígnea"
  },
  "heavy slam": {
    "pt": "Golpe Pesado",
    "es": "Cuerpo Pesado"
  },
  "heavy stomp": {
    "pt": "Pisada Pesada",
    "es": "Pisotón Pesado"
  },
  "high jump kick": {
    "pt": "Chute de Pulo Alto",
    "es": "Patada Salto Alta"
  },
  "high voltage": {
    "pt": "Alta Tensão",
    "es": "Alto Voltaje"
  },
  "horn attack": {
    "pt": "Ataque de Chifre",
    "es": "Cornada"
  },
  "horn drill": {
    "pt": "Chifre Broca",
    "es": "Perforador"
  },
  "hurricane": {
    "pt": "Furacão",
    "es": "Vendaval"
  },
  "hydro cannon": {
    "pt": "Hidro Canhão",
    "es": "Hidrocañón"
  },
  "hydro pump": {
    "pt": "Hidro Bomba",
    "es": "Hidrobomba"
  },
  "hyper beam": {
    "pt": "Hiper-Raio",
    "es": "Híper Rayo"
  },
  "hyper fang": {
    "pt": "Hiper Presa",
    "es": "Hiperdiente"
  },
  "hyper sonic": {
    "pt": "Hipersônico",
    "es": "Hipersónico"
  },
  "hyper voice": {
    "pt": "Hiper Voz",
    "es": "Vozarrón"
  },
  "hypnosis": {
    "pt": "Hipnose",
    "es": "Hipnosis"
  },
  "ice beam": {
    "pt": "Raio Congelante",
    "es": "Rayo Hielo"
  },
  "ice charge": {
    "pt": "Investida de Gelo",
    "es": "Carga Helada"
  },
  "ice fang": {
    "pt": "Presa de Gelo",
    "es": "Colmillo Hielo"
  },
  "ice punch": {
    "pt": "Soco de Gelo",
    "es": "Puño Hielo"
  },
  "ice shard": {
    "pt": "Cacos de Gelo",
    "es": "Canto Helado"
  },
  "icicle crash": {
    "pt": "Queda de Gelo",
    "es": "Chuzos"
  },
  "icicle spear": {
    "pt": "Lança de Gelo",
    "es": "Carámbano"
  },
  "icy wind": {
    "pt": "Vento Congelante",
    "es": "Viento Hielo"
  },
  "imprison": {
    "pt": "Aprisionar",
    "es": "Cerca"
  },
  "iron defense": {
    "pt": "Defesa de Ferro",
    "es": "Defensa Férrea"
  },
  "iron head": {
    "pt": "Cabeça de Ferro",
    "es": "Cabeza de Hierro"
  },
  "iron tail": {
    "pt": "Cauda de Ferro",
    "es": "Cola Férrea"
  },
  "jet kick": {
    "pt": "Chute a Jato",
    "es": "Patada Jet"
  },
  "judgment": {
    "pt": "Julgamento",
    "es": "Sentencia"
  },
  "karate chop": {
    "pt": "Golpe de Caratê",
    "es": "Golpe Kárate"
  },
  "kinesis": {
    "pt": "Cinese",
    "es": "Kinético"
  },
  "lava plume": {
    "pt": "Pluma de Lava",
    "es": "Humareda"
  },
  "leaf blade": {
    "pt": "Lâmina de Folha",
    "es": "Hoja Aguda"
  },
  "leaf blade 90+": {
    "pt": "Lâmina de Folha 90+",
    "es": "Hoja Aguda 90+"
  },
  "leaf storm": {
    "pt": "Tempestade de Folhas",
    "es": "Lluevehojas"
  },
  "leech life": {
    "pt": "Suga Vidas",
    "es": "Chupavidas"
  },
  "lick": {
    "pt": "Lambida",
    "es": "Lengüetazo"
  },
  "light screen": {
    "pt": "Tela de Luz",
    "es": "Pantalla Luz"
  },
  "light screen & reflect": {
    "pt": "Tela de Luz & Refletir",
    "es": "Pantalla Luz y Reflejo"
  },
  "low kick": {
    "pt": "Chute Baixo",
    "es": "Patada Baja"
  },
  "low sweep": {
    "pt": "Rasteira",
    "es": "Puntapié"
  },
  "lunar dance": {
    "pt": "Dança Lunar",
    "es": "Danza Lunar"
  },
  "luster purge": {
    "pt": "Purga Lustrosa",
    "es": "Resplandor"
  },
  "mach punch": {
    "pt": "Soco Rápido",
    "es": "Ultrapuño"
  },
  "magical leaf": {
    "pt": "Folha Mágica",
    "es": "Hoja Mágica"
  },
  "magma slide": {
    "pt": "Deslize de Magma",
    "es": "Desliz de Magma"
  },
  "magnet bomb": {
    "pt": "Bomba Magnética",
    "es": "Bomba Imán"
  },
  "magnetic storm": {
    "pt": "Tempestade Magnética",
    "es": "Tormenta Magnética"
  },
  "magnitude": {
    "pt": "Magnitude",
    "es": "Magnitud"
  },
  "manaphy's song": {
    "pt": "Canção de Manaphy",
    "es": "Canción de Manaphy"
  },
  "megahorn": {
    "pt": "Megachifre",
    "es": "Megacuerno"
  },
  "metal claw": {
    "pt": "Garra de Metal",
    "es": "Garra Metal"
  },
  "meteor mash": {
    "pt": "Soco Meteoro",
    "es": "Puño Meteoro"
  },
  "mirror coat": {
    "pt": "Capa Espelhada",
    "es": "Manto Espejo"
  },
  "mirror shot": {
    "pt": "Tiro Espelhado",
    "es": "Disparo Espejo"
  },
  "miss": {
    "pt": "Falha",
    "es": "Fallo"
  },
  "mist ball": {
    "pt": "Bola de Névoa",
    "es": "Bola Neblina"
  },
  "moon's grace": {
    "pt": "Graça da Lua",
    "es": "Gracia Lunar"
  },
  "moonblast": {
    "pt": "Explosão Lunar",
    "es": "Fuerza Lunar"
  },
  "moongeist beam": {
    "pt": "Raio Espectral",
    "es": "Rayo Umbrío"
  },
  "moonlight": {
    "pt": "Luar",
    "es": "Luz Lunar"
  },
  "mud shot": {
    "pt": "Tiro de Lama",
    "es": "Disparo Lodo"
  },
  "mud-slap": {
    "pt": "Golpe de Lama",
    "es": "Bofetón Lodo"
  },
  "muddy water": {
    "pt": "Água Barrenta",
    "es": "Agua Lodosa"
  },
  "night shade": {
    "pt": "Sombra Noturna",
    "es": "Tinieblas"
  },
  "night slash": {
    "pt": "Talho Noturno",
    "es": "Tajo Umbrío"
  },
  "nuzzle": {
    "pt": "Esfregão",
    "es": "Moflete Estático"
  },
  "ominous wind": {
    "pt": "Vento Sinistro",
    "es": "Viento Aciago"
  },
  "origin pulse": {
    "pt": "Pulso Primordial",
    "es": "Pulso Primigenio"
  },
  "outrage": {
    "pt": "Ultraje",
    "es": "Enfado"
  },
  "overhead toss": {
    "pt": "Arremesso por Cima",
    "es": "Lanzamiento Alto"
  },
  "overheat": {
    "pt": "Superaquecimento",
    "es": "Sofoco"
  },
  "pay day": {
    "pt": "Dia do Pagamento",
    "es": "Día de Pago"
  },
  "peck": {
    "pt": "Bicada",
    "es": "Picotazo"
  },
  "perish song": {
    "pt": "Canção da Morte",
    "es": "Canto Mortal"
  },
  "petal dance": {
    "pt": "Dança das Pétalas",
    "es": "Danza Pétalo"
  },
  "phantom force": {
    "pt": "Golpe Fantasma",
    "es": "Golpe Fantasma"
  },
  "pin missile": {
    "pt": "Míssil de Espinhos",
    "es": "Pin Misil"
  },
  "play rough": {
    "pt": "Brincadeira Bruta",
    "es": "Carantoña"
  },
  "poison fang": {
    "pt": "Presa Venenosa",
    "es": "Colmillo Veneno"
  },
  "poison gas": {
    "pt": "Gás Venenoso",
    "es": "Gas Venenoso"
  },
  "poison jab": {
    "pt": "Golpe Envenenado",
    "es": "Puya Nociva"
  },
  "poison powder": {
    "pt": "Pó Venenoso",
    "es": "Polvo Veneno"
  },
  "poison sting": {
    "pt": "Ferrão Venenoso",
    "es": "Picotazo Veneno"
  },
  "poison tail": {
    "pt": "Cauda Venenosa",
    "es": "Cola Veneno"
  },
  "pound": {
    "pt": "Pancada",
    "es": "Destructor"
  },
  "power gem": {
    "pt": "Jóia do Poder",
    "es": "Joya de Luz"
  },
  "power whip": {
    "pt": "Chicote Poderoso",
    "es": "Latigazo"
  },
  "precipice blades": {
    "pt": "Lâminas do Precipício",
    "es": "Filo del Abismo"
  },
  "protect": {
    "pt": "Proteção",
    "es": "Protección"
  },
  "psybeam": {
    "pt": "Raio Psíquico",
    "es": "Psicorrayo"
  },
  "psychic": {
    "pt": "Psíquico",
    "es": "Psíquico"
  },
  "psychic shove": {
    "pt": "Empurrão Psíquico",
    "es": "Empujón Psíquico"
  },
  "psychic spin": {
    "pt": "Giro Psíquico",
    "es": "Giro Psíquico"
  },
  "psycho boost": {
    "pt": "Impulso Psíquico",
    "es": "Psicoimpulso"
  },
  "psycho cut": {
    "pt": "Corte Psíquico",
    "es": "Psicocorte"
  },
  "psycho switch": {
    "pt": "Troca Psíquica",
    "es": "Cambio Psíquico"
  },
  "psyshock": {
    "pt": "Choque Psíquico",
    "es": "Psicocarga"
  },
  "pull in": {
    "pt": "Puxar",
    "es": "Atraer"
  },
  "push aside": {
    "pt": "Afastar",
    "es": "Apartar"
  },
  "quick attack": {
    "pt": "Ataque Rápido",
    "es": "Ataque Rápido"
  },
  "rainbow pulse": {
    "pt": "Pulso Arco-Íris",
    "es": "Pulso Arcoíris"
  },
  "rainbow wing": {
    "pt": "Asa Arco-Íris",
    "es": "Ala Arcoíris"
  },
  "rapid spin": {
    "pt": "Giro Rápido",
    "es": "Giro Rápido"
  },
  "razor leaf": {
    "pt": "Folha Navalha",
    "es": "Hoja Afilada"
  },
  "razor shell": {
    "pt": "Concha Navalha",
    "es": "Concha Filo"
  },
  "recover": {
    "pt": "Recuperar",
    "es": "Recuperación"
  },
  "reflect": {
    "pt": "Refletir",
    "es": "Reflejo"
  },
  "rest": {
    "pt": "Descanso",
    "es": "Descanso"
  },
  "roar": {
    "pt": "Rugido",
    "es": "Rugido"
  },
  "roar of time": {
    "pt": "Rugido do Tempo",
    "es": "Distorsión"
  },
  "rock blast": {
    "pt": "Explosão de Rochas",
    "es": "Pedrada"
  },
  "rock slide": {
    "pt": "Deslize de Pedras",
    "es": "Avalancha"
  },
  "rock smash": {
    "pt": "Quebra-Pedra",
    "es": "Golpe Roca"
  },
  "rock throw": {
    "pt": "Lançamento de Pedra",
    "es": "Lanzarrocas"
  },
  "rock tomb": {
    "pt": "Tumba de Pedra",
    "es": "Tumba Rocas"
  },
  "rock wrecker": {
    "pt": "Destruidor de Rochas",
    "es": "Romperrocas"
  },
  "rolling kick": {
    "pt": "Chute Giratório",
    "es": "Patada Giro"
  },
  "rollout": {
    "pt": "Rolamento",
    "es": "Desenlace"
  },
  "roost": {
    "pt": "Pouso",
    "es": "Respiro"
  },
  "sacred fire": {
    "pt": "Fogo Sagrado",
    "es": "Fuego Sagrado"
  },
  "sand attack": {
    "pt": "Ataque de Areia",
    "es": "Ataque Arena"
  },
  "sand tomb": {
    "pt": "Tumba de Areia",
    "es": "Bucle Arena"
  },
  "scald": {
    "pt": "Escaldar",
    "es": "Escaldar"
  },
  "scary face": {
    "pt": "Cara Assustadora",
    "es": "Cara Susto"
  },
  "scratch": {
    "pt": "Arranhão",
    "es": "Arañazo"
  },
  "screech": {
    "pt": "Guincho",
    "es": "Chirrido"
  },
  "searing shot": {
    "pt": "Tiro Escaldante",
    "es": "Bomba Ígnea"
  },
  "seed flare": {
    "pt": "Fulgor de Semente",
    "es": "Semilladora"
  },
  "seismic toss": {
    "pt": "Arremesso Sísmico",
    "es": "Movimiento Sísmico"
  },
  "self-destruct": {
    "pt": "Autodestruição",
    "es": "Autodestrucción"
  },
  "shadow ball": {
    "pt": "Bola Sombria",
    "es": "Bola Sombra"
  },
  "shadow claw": {
    "pt": "Garra Sombria",
    "es": "Garra Umbría"
  },
  "shadow force": {
    "pt": "Força Sombria",
    "es": "Golpe Umbrío"
  },
  "shadow sneak": {
    "pt": "Sombra Furtiva",
    "es": "Sombra Vil"
  },
  "sheer cold": {
    "pt": "Frio Absoluto",
    "es": "Frío Polar"
  },
  "shock wave": {
    "pt": "Onda de Choque",
    "es": "Onda Choque"
  },
  "shuttle flip": {
    "pt": "Giro de Fuga",
    "es": "Giro Escudo"
  },
  "sightseeing": {
    "pt": "Passeio Turístico",
    "es": "Paseo Turístico"
  },
  "signal beam": {
    "pt": "Raio Sinalizador",
    "es": "Doble Rayo"
  },
  "silver wind": {
    "pt": "Vento Prateado",
    "es": "Viento Plata"
  },
  "sing": {
    "pt": "Canto",
    "es": "Canto"
  },
  "skull bash": {
    "pt": "Cabeçada Devastadora",
    "es": "Cabezazo"
  },
  "sky attack": {
    "pt": "Ataque Aéreo",
    "es": "Ataque Aéreo"
  },
  "sky drop": {
    "pt": "Queda do Céu",
    "es": "Caída Libre"
  },
  "sky uppercut": {
    "pt": "Gancho Celeste",
    "es": "Gancho Alto"
  },
  "slack off": {
    "pt": "Relaxar",
    "es": "Relajo"
  },
  "slam": {
    "pt": "Batida Forte",
    "es": "Atizar"
  },
  "slash": {
    "pt": "Talho",
    "es": "Cuchillada"
  },
  "sleep powder": {
    "pt": "Pó do Sono",
    "es": "Somnífero"
  },
  "sludge": {
    "pt": "Lodo",
    "es": "Residuos"
  },
  "sludge bomb": {
    "pt": "Bomba de Lodo",
    "es": "Bomba Lodo"
  },
  "sludge wave": {
    "pt": "Onda de Lodo",
    "es": "Onda Tóxica"
  },
  "smack down": {
    "pt": "Derrubar",
    "es": "Antiaéreo"
  },
  "smash": {
    "pt": "Esmagar",
    "es": "Aplastamiento"
  },
  "smart strike": {
    "pt": "Golpe Certeiro",
    "es": "Cuerno Certero"
  },
  "smellingsalts": {
    "pt": "Sais Aromáticos",
    "es": "Estímulo"
  },
  "smog": {
    "pt": "Névoa Tóxica",
    "es": "Polución"
  },
  "smokescreen": {
    "pt": "Cortina de Fumaça",
    "es": "Pantalla de Humo"
  },
  "solar beam": {
    "pt": "Raio Solar",
    "es": "Rayo Solar"
  },
  "solar blade": {
    "pt": "Lâmina Solar",
    "es": "Cuchilla Solar"
  },
  "sonic boom": {
    "pt": "Estrondo Sônico",
    "es": "Bomba Sónica"
  },
  "spacial rend": {
    "pt": "Fenda Espacial",
    "es": "Corte Espacial"
  },
  "spark": {
    "pt": "Faísca",
    "es": "Chispa"
  },
  "splash": {
    "pt": "Respingo",
    "es": "Salpicadura"
  },
  "spore": {
    "pt": "Esporo",
    "es": "Espora"
  },
  "stealth hit": {
    "pt": "Golpe Furtivo",
    "es": "Golpe Sigiloso"
  },
  "steel wing": {
    "pt": "Asa de Aço",
    "es": "Ala de Acero"
  },
  "stoked sparksurfer": {
    "pt": "Surfe Faísca",
    "es": "Surfeo Chispas"
  },
  "stomp": {
    "pt": "Pisada",
    "es": "Pisotón"
  },
  "stone edge": {
    "pt": "Gume de Pedra",
    "es": "Roca Afilada"
  },
  "storm": {
    "pt": "Tempestade",
    "es": "Tormenta"
  },
  "string shot": {
    "pt": "Tiro de Seda",
    "es": "Disparo Demora"
  },
  "struggle": {
    "pt": "Luta",
    "es": "Combate"
  },
  "stun spore": {
    "pt": "Pó Paralisante",
    "es": "Paralizador"
  },
  "submission": {
    "pt": "Submissão",
    "es": "Sumisión"
  },
  "substitute": {
    "pt": "Substituto",
    "es": "Sustituto"
  },
  "sucker punch": {
    "pt": "Golpe Baixo",
    "es": "Golpe Bajo"
  },
  "super fang": {
    "pt": "Super Presa",
    "es": "Superdiente"
  },
  "super psy": {
    "pt": "Super Psíquico",
    "es": "Súper Psíquico"
  },
  "superpower": {
    "pt": "Superpoder",
    "es": "Fuerza Bruta"
  },
  "supersonic": {
    "pt": "Supersônico",
    "es": "Supersónico"
  },
  "surf": {
    "pt": "Surfe",
    "es": "Surf"
  },
  "swagger": {
    "pt": "Provocação Fútil",
    "es": "Contoneo"
  },
  "sweet kiss": {
    "pt": "Beijo Doce",
    "es": "Beso Dulce"
  },
  "sweet scent": {
    "pt": "Doce Aroma",
    "es": "Dulce Aroma"
  },
  "swift": {
    "pt": "Ataque Rápido Estelar",
    "es": "Rapidez"
  },
  "swords dance": {
    "pt": "Dança das Espadas",
    "es": "Danza Espada"
  },
  "synchronoise": {
    "pt": "Sincrorruído",
    "es": "Sincrorruido"
  },
  "synthesis": {
    "pt": "Síntese",
    "es": "Síntesis"
  },
  "tackle": {
    "pt": "Investida",
    "es": "Placaje"
  },
  "tail whip": {
    "pt": "Chicote de Cauda",
    "es": "Látigo"
  },
  "tailwind": {
    "pt": "Vento Favorável",
    "es": "Viento Afín"
  },
  "take down": {
    "pt": "Derrubada",
    "es": "Derribo"
  },
  "taunt": {
    "pt": "Provocação",
    "es": "Mofa"
  },
  "teleport": {
    "pt": "Teletransporte",
    "es": "Teletransporte"
  },
  "thrash": {
    "pt": "Frenesi",
    "es": "Golpe"
  },
  "thunder": {
    "pt": "Trovão",
    "es": "Trueno"
  },
  "thunder charge": {
    "pt": "Carga do Trovão",
    "es": "Carga Trueno"
  },
  "thunder crash": {
    "pt": "Colisão de Trovão",
    "es": "Choque Trueno"
  },
  "thunder fang": {
    "pt": "Presa do Trovão",
    "es": "Colmillo Rayo"
  },
  "thunder punch": {
    "pt": "Soco do Trovão",
    "es": "Puño Trueno"
  },
  "thunder wave": {
    "pt": "Onda de Trovão",
    "es": "Onda Trueno"
  },
  "thunderbolt": {
    "pt": "Choque do Trovão",
    "es": "Rayo"
  },
  "thunderous blow": {
    "pt": "Golpe Trovão",
    "es": "Golpe Tronante"
  },
  "tidal wave": {
    "pt": "Onda Gigante",
    "es": "Tsunami"
  },
  "time distortion": {
    "pt": "Distorção Temporal",
    "es": "Distorsión Temporal"
  },
  "time leap": {
    "pt": "Salto no Tempo",
    "es": "Salto Temporal"
  },
  "toxic": {
    "pt": "Tóxico",
    "es": "Tóxico"
  },
  "toxic night": {
    "pt": "Noite Tóxica",
    "es": "Noche Tóxica"
  },
  "toxic spores": {
    "pt": "Esporos Tóxicos",
    "es": "Esporas Tóxicas"
  },
  "tractor": {
    "pt": "Trator de Energia",
    "es": "Rayo Tractor"
  },
  "transform": {
    "pt": "Transformar",
    "es": "Transformación"
  },
  "transform mirror": {
    "pt": "Espelho Transformador",
    "es": "Espejo Transformación"
  },
  "tri attack": {
    "pt": "Tri Ataque",
    "es": "Triataque"
  },
  "trickery": {
    "pt": "Trapaça",
    "es": "Truco Malicioso"
  },
  "triple kick": {
    "pt": "Chute Triplo",
    "es": "Triple Patada"
  },
  "twineedle": {
    "pt": "Agulha Dupla",
    "es": "Doble Ataque"
  },
  "twister": {
    "pt": "Tornado",
    "es": "Ciclón"
  },
  "u-turn": {
    "pt": "Meia-Volta",
    "es": "Ida y Vuelta"
  },
  "uproar": {
    "pt": "Alvoroço",
    "es": "Alboroto"
  },
  "vacuum wave": {
    "pt": "Onda de Vácuo",
    "es": "Onda Vacío"
  },
  "vanish": {
    "pt": "Desvanecer",
    "es": "Desvanecer"
  },
  "venom fang": {
    "pt": "Presa de Veneno",
    "es": "Colmillo Veneno"
  },
  "venoshock": {
    "pt": "Choque Venenoso",
    "es": "Carga Tóxica"
  },
  "vine whip": {
    "pt": "Chicote de Vinha",
    "es": "Látigo Cepa"
  },
  "vital throw": {
    "pt": "Arremesso Vital",
    "es": "Tiro Vital"
  },
  "volt switch": {
    "pt": "Troca Elétrica",
    "es": "Voltiocambio"
  },
  "volt tackle": {
    "pt": "Investida Trovão",
    "es": "Placaje Eléctrico"
  },
  "wake-up slap": {
    "pt": "Tapa Despertador",
    "es": "Espabila"
  },
  "warp hole": {
    "pt": "Buraco de Dobra",
    "es": "Agujero de Salto"
  },
  "wash out": {
    "pt": "Lavar",
    "es": "Lavado Acuático"
  },
  "water drip": {
    "pt": "Gota d'Água",
    "es": "Gota de Agua"
  },
  "water gun": {
    "pt": "Revólver d'Água",
    "es": "Pistola Agua"
  },
  "water pulse": {
    "pt": "Pulso d'Água",
    "es": "Hidropulso"
  },
  "water shuriken": {
    "pt": "Shuriken de Água",
    "es": "Shuriken de Agua"
  },
  "water slide": {
    "pt": "Toboágua",
    "es": "Tobogán Acuático"
  },
  "waterfall": {
    "pt": "Cascata",
    "es": "Cascada"
  },
  "weather ball": {
    "pt": "Bola Climática",
    "es": "Meteorobola"
  },
  "whirlpool": {
    "pt": "Redemoinho d'Água",
    "es": "Torbellino"
  },
  "whirlwind": {
    "pt": "Redemoinho",
    "es": "Remolino"
  },
  "wild charge": {
    "pt": "Carga Selvagem",
    "es": "Voltio Cruel"
  },
  "will-o-wisp": {
    "pt": "Fogo Fátuo",
    "es": "Fuego Fatuo"
  },
  "wing attack": {
    "pt": "Ataque de Asa",
    "es": "Ataque Ala"
  },
  "wish": {
    "pt": "Desejo",
    "es": "Deseo"
  },
  "withdraw": {
    "pt": "Retração",
    "es": "Refugio"
  },
  "wood hammer": {
    "pt": "Martelo de Madeira",
    "es": "Mazazo"
  },
  "x-scissor": {
    "pt": "Tesoura X",
    "es": "Tijera X"
  },
  "yawn": {
    "pt": "Bocejo",
    "es": "Bostezo"
  },
  "zap cannon": {
    "pt": "Canhão Elétrico",
    "es": "Electrocañón"
  },
  "zen headbutt": {
    "pt": "Cabeçada Zen",
    "es": "Cabezazo Zen"
  }
};

// ============================================================================
// POKÉMON ELEMENTAL TYPES TRANSLATION DICTIONARY
// ============================================================================
const POKEMON_TYPES_I18N = {
  pt: {
    "Normal": "Normal", "Fire": "Fogo", "Water": "Água", "Grass": "Grama",
    "Electric": "Elétrico", "Ice": "Gelo", "Fighting": "Lutador", "Poison": "Veneno",
    "Ground": "Terra", "Flying": "Voador", "Psychic": "Psíquico", "Bug": "Inseto",
    "Rock": "Pedra", "Ghost": "Fantasma", "Dragon": "Dragão", "Steel": "Aço",
    "Dark": "Sombrio", "Fairy": "Fada"
  },
  es: {
    "Normal": "Normal", "Fire": "Fuego", "Water": "Agua", "Grass": "Planta",
    "Electric": "Eléctrico", "Ice": "Hielo", "Fighting": "Lucha", "Poison": "Veneno",
    "Ground": "Tierra", "Flying": "Volador", "Psychic": "Psíquico", "Bug": "Bicho",
    "Rock": "Roca", "Ghost": "Fantasma", "Dragon": "Dragón", "Steel": "Acero",
    "Dark": "Siniestro", "Fairy": "Hada"
  }
};

// ============================================================================
// CORE FIGURE ABILITIES TRANSLATION DICTIONARY
// ============================================================================
const CORE_FIGURE_ABILITIES_I18N = {
  "charizard": {
    "pt": "Propulsor de Velocidade / Asa de Dragão: +10 DANO por passo percorrido; Mega evolui para [UX] Mega Charizard X (+20 DANO, Atravessa Figuras).",
    "en": "Speed Booster / Dragon Wing: +10 DMG per step moved; Mega evolves into [UX] Mega Charizard X (+20 DMG, Pass-Through).",
    "es": "Propulsor de Velocidad / Ala Dragón: +10 DAÑO por paso avanzado; Mega evoluciona a [UX] Mega Charizard X (+20 DAÑO, Atraviesa Figuras)."
  },
  "pikachu": {
    "pt": "Luz Cintilante [UX]: Ataque Rápido Dourado nocauteia qualquer golpe Roxo; evolui para Raichu de Alola.",
    "en": "Sparkling Light [UX]: Gold Quick Attack knocks out any Purple move; evolves into Alolan Raichu.",
    "es": "Luz Centelleante [UX]: Ataque Rápido Dorado noquea cualquier movimiento Púrpura; evoluciona a Raichu de Alola."
  },
  "squirtle": {
    "pt": "Carapaça de Retração: Retração Azul protege contra todos os ataques e condições de status; evolui para [UX] Mega Blastoise.",
    "en": "Withdraw Shell: Blue Withdraw protects from all attacks and status; evolves into [UX] Mega Blastoise.",
    "es": "Caparazón Refugio: Refugio Azul protege contra todos los ataques y estados; evoluciona a [UX] Mega Blastoise."
  },
  "bulbasaur": {
    "pt": "Broto de Síntese: Sinergiza com Poder de Prado (+20 DANO); evolui para Ivysaur ➔ Venusaur ➔ [UX] Mega Venusaur.",
    "en": "Synthesis Sprout: Synergizes with Meadow Power (+20 DMG); evolves into Ivysaur ➔ Venusaur ➔ [UX] Mega Venusaur.",
    "es": "Brote de Síntesis: Sinergiza con Poder de Prado (+20 DAÑO); evoluciona a Ivysaur ➔ Venusaur ➔ [UX] Mega Venusaur."
  },
  "eevee": {
    "pt": "Corrida Adaptável (3 MP): Corredor veloz com Ataque Rápido Dourado; evolui para Sylveon EX / Umbreon UX.",
    "en": "Adaptability Dash (3 MP): High-speed runner with Gold Quick Attack; evolves into Sylveon EX / Umbreon UX.",
    "es": "Carrera Adaptable (3 MP): Corredor veloz con Ataque Rápido Dorado; evoluciona a Sylveon EX / Umbreon UX."
  },
  "lapras": {
    "pt": "Véu de Gelo: Imune a Congelamento; Canto ★★ coloca oponentes adjacentes em Sono.",
    "en": "Ice Veil: Immune to Freeze; Sing ★★ puts adjacent battle opponents to Sleep.",
    "es": "Velo de Hielo: Inmune a Congelamiento; Canto ★★ duerme a los oponentes adyacentes."
  },
  "charmander": {
    "pt": "Corredor Incandescente (3 MP): Cortina de Fumaça ★ confunde o oponente; evolui para Charmeleon ➔ Charizard.",
    "en": "Blaze Runner (3 MP): Smokescreen ★ confuses opponent; evolves into Charmeleon ➔ Charizard.",
    "es": "Corredor Llamarada (3 MP): Pantalla de Humo ★ confunde al oponente; evoluciona a Charmeleon ➔ Charizard."
  },
  "venusaur": {
    "pt": "Flora Tropical: Pó do Sono ★★★ e Raio Solar 140; Mega evolui para [UX] Mega Venusaur.",
    "en": "Tropical Flora: Sleep Powder ★★★ & Solar Beam 140; Mega evolves into [UX] Mega Venusaur.",
    "es": "Flora Tropical: Somnífero ★★★ y Rayo Solar 140; Mega evoluciona a [UX] Mega Venusaur."
  },
  "kabutops": {
    "pt": "Armadura de Batalha Aquática: Jato d'Água 80 Dourado quebra Roxo; Poder Antigo desloca inimigos.",
    "en": "Swift Swim Battle Armor: Aqua Jet 80 Gold beats Purple; Ancient Power displaces enemies.",
    "es": "Armadura de Combate Acuática: Acua Jet 80 Dorado vence Púrpura; Poder Pasado desplaza enemigos."
  },
  "megastarmie": {
    "pt": "[UX] Núcleo Estelar Cósmico: +10 DANO para cada ★ no campo; corredor de 3 MP com Salto de Figuras.",
    "en": "[UX] Cosmic Star Core: +10 DMG for each ★ on field; 3 MP Pass-Through runner.",
    "es": "[UX] Núcleo Estelar Cósmico: +10 DAÑO por cada ★ en el campo; corredor de 3 MP que Atraviesa Figuras."
  },
  "staryu": {
    "pt": "Cura Natural: Cura condições negativas ao vencer combate; evolui para Starmie ➔ [UX] Mega Starmie.",
    "en": "Natural Cure: Cures negative status on battle win; evolves into Starmie ➔ [UX] Mega Starmie.",
    "es": "Cura Natural: Cura estados negativos al ganar batalla; evoluciona a Starmie ➔ [UX] Mega Starmie."
  },
  "megalopunny": {
    "pt": "[UX] Salto Alto Ágil: 3 MP Atravessa Figuras; Ricochete Azul salta sobre inimigos e cura status.",
    "en": "[UX] Scrappy High Jump: 3 MP Pass-Through; Bounce Blue leaps over enemies and cures status.",
    "es": "[UX] Salto Alto Ágil: 3 MP Atraviesa Figuras; Bote Azul salta sobre enemigos y cura estados."
  },
  "lopunny": {
    "pt": "Charme Gracioso: Soco Tonto ★★ inflige confusão; evolui para [UX] Mega Lopunny.",
    "en": "Cute Charm: Dizzy Punch ★★ inflicts panic; evolves into [UX] Mega Lopunny.",
    "es": "Gran Encanto: Puño Mareo ★★ causa confusión; evoluciona a [UX] Mega Lopunny."
  },
  "palkia_o": {
    "pt": "[UX] Forma Espacial Origem: Impede efeitos adversários de atravessar; Dobra Dimensional ★★★ empurra + Espera 2.",
    "en": "[UX] Spacial Origin Forme: Prevents opposing pass-through effects; Dimensional Warp ★★★ pushes + Wait 2.",
    "es": "[UX] Forma Espacial Origen: Evita que figuras rivales atraviesen; Distorsión Dimensional ★★★ empuja + Espera 2."
  },
  "dialga_o": {
    "pt": "[UX] Forma Temporal Origem: Rugido do Tempo 160 DANO + Distorção Temporal ★★★ nocaute instantâneo.",
    "en": "[UX] Temporal Origin Forme: Roar of Time 160 DMG + Time Distortion ★★★ instant knockout.",
    "es": "[UX] Forma Temporal Origen: Distorsión 160 DAÑO + Distorsión Temporal ★★★ noqueo instantáneo."
  },
  "gengar": {
    "pt": "Sombra Infiltrada (3 MP): Atravessa figuras no tabuleiro; nocauteia alvos dormindo ou envenenados que atravessar.",
    "en": "Infiltrator Shadow (3 MP): Moves through figures on the board; knocks out sleeping/poisoned targets it passes over.",
    "es": "Sombra Infiltrada (3 MP): Se mueve a través de figuras; noquea a rivales dormidos o envenenados que cruce."
  },
  "lucario": {
    "pt": "Aura Inabalável: Esfera de Aura ★★ nocauteia oponente independentemente do dano; Garra de Metal 100.",
    "en": "Steadfast Aura: Aura Sphere ★★ knocks out opponent regardless of damage; Metal Claw 100.",
    "es": "Aura Firme: Esfera Aural ★★ noquea al oponente sin importar el daño; Garra Metal 100."
  },
  "mew": {
    "pt": "Escudo Hipersônico (3 MP): Hipersônico Dourado (50 DANO) é imune a nocaute contra ataques de 100+ DANO; Giro de Fuga recua.",
    "en": "Hyper Sonic Shield (3 MP): Gold Hyper Sonic (50 DMG) is immune to knock out against attacks of 100+ DMG; Shuttle Flip leaps backward.",
    "es": "Escudo Hipersónico (3 MP): Hipersónico Dorado (50 DAÑO) es inmune a noqueo ante ataques de 100+ DAÑO; Giro Escudo retrocede."
  },
  "rayquaza": {
    "pt": "Bloqueio de Ar Extremo: Velocidade Extrema 140 Dourado destrói roletas Roxas; Voar ★★★ salta sobre oponentes.",
    "en": "Air Lock Extreme: Extreme Speed 140 Gold destroys Purple wheels; Fly ★★★ leaps over opponents.",
    "es": "Bucle Aire Extremo: Velocidad Extrema 140 Dorado destruye ruletas Púrpuras; Vuelo ★★★ salta sobre oponentes."
  },
  "magikarp": {
    "pt": "Evolução Rápida: Evolução instantânea ao ser nocauteado! Evolui diretamente para [R] Gyarados com +10 DANO e +1★.",
    "en": "Rapid Evolution: Instant Evolution upon being knocked out! Evolves directly into [R] Gyarados with +10 DMG and +1★.",
    "es": "Evolución Rápida: ¡Evolución instantánea al ser noqueado! Evoluciona directamente a [R] Gyarados con +10 DAÑO y +1★."
  },
  "gyarados": {
    "pt": "Fúria do Dragão: Hiper-Raio 110 Branco; Dança do Dragão ★★ concede Espera 1; Tempestade ★★ empurra o oponente.",
    "en": "Dragon Rage: Hyper Beam 110 White; Dragon Dance ★★ grants Wait 1; Storm ★★ pushes opponent away.",
    "es": "Furia Dragón: Híper Rayo 110 Blanco; Danza Dragón ★★ otorga Espera 1; Tormenta ★★ empuja al oponente."
  },
  "zapdos": {
    "pt": "Planar (Infiltrador): Voa por cima de Pokémon terrestres; Colisão de Trovão 100 Dourado vence todos os Roxos; Pouso ★★★.",
    "en": "Soar (Infiltrator): Flies over non-flying Pokémon; Thunder Crash 100 Gold beats all Purple moves; Roost ★★★.",
    "es": "Planear (Infiltrador): Vuela sobre Pokémon terrestres; Choque Trueno 100 Dorado vence a todo movimiento Púrpura; Respiro ★★★."
  },
  "articuno": {
    "pt": "Planar (Infiltrador): Voa por cima de Pokémon terrestres; Raio Congelante 90 e Esmagamento Gélido ★★★ congelam o oponente.",
    "en": "Soar (Infiltrator): Flies over non-flying Pokémon; Ice Beam 90 & Cold Crush ★★★ freeze opponent.",
    "es": "Planear (Infiltrador): Vuela sobre Pokémon terrestres; Rayo Hielo 90 y Aplastamiento Frío ★★★ congelan al oponente."
  },
  "moltres": {
    "pt": "Planar (Infiltrador): Voa por cima de Pokémon terrestres; Giro de Fogo 110 e Carga de Fogo ★★ queimam o oponente.",
    "en": "Soar (Infiltrator): Flies over non-flying Pokémon; Fire Spin 110 & Flame Charge ★★ burn opponent.",
    "es": "Planear (Infiltrador): Vuela sobre Pokémon terrestres; Giro Fuego 110 y Nitrocarga ★★ queman al oponente."
  },
  "blastoise": {
    "pt": "Barreira de Capa Espelhada: Capa Espelhada ★★★ reflete golpes Roxos; Hidro Bomba 100 Branco; Desvio.",
    "en": "Mirror Coat Barrier: Mirror Coat ★★★ reflects Purple moves; Hydro Pump 100 White; Dodge.",
    "es": "Barrera Manto Espejo: Manto Espejo ★★★ refleja movimientos Púrpuras; Hidrobomba 100 Blanco; Esquiva."
  },
  "deoxys_a": {
    "pt": "Laser Refletor: Impulso Psíquico 130 Branco; Deslize Dimensional ★★ envia Deoxys de volta ao banco em segurança.",
    "en": "Reflective Laser: Psycho Boost 130 White; Dimensional Slip ★★ sends Deoxys back to bench safely.",
    "es": "Láser Reflector: Psicoimpulso 130 Blanco; Desliz Dimensional ★★ regresa a Deoxys a la banca a salvo."
  },
  "snorlax": {
    "pt": "Imunidade Gulosa: Imune a Sono e Veneno; Pancada Corporal 100; Descanso Azul e Grande Bocejo ★★ colocam rivais para dormir.",
    "en": "Big Eater Immunity: Immune to Sleep & Poison; Body Slam 100; Rest Blue & Big Yawn ★★ puts foes to sleep.",
    "es": "Inmunidad Glotón: Inmune a Sueño y Veneno; Golpe Cuerpo 100; Descanso Azul y Gran Bostezo ★★ duermen a los rivales."
  },
  "lunala": {
    "pt": "Escudo Sombrio: Raio Espectral 100 divide dano adversário pela metade; Graça da Lua ★★★ troca de posição.",
    "en": "Shadow Shield: Moongeist Beam 100 halves opponent damage; Moon's Grace ★★★ switches places.",
    "es": "Escudo Sombrío: Rayo Umbrío 100 reduce a la mitad el daño rival; Gracia Lunar ★★★ cambia posiciones."
  },
  "mega_gengar": {
    "pt": "[UX] Marca Sombria: Impede Pokémon adjacentes de se moverem; Caçador Abissal 140 Branco; Noite Tóxica ★★★.",
    "en": "[UX] Shadow Tag: Prevents adjacent Pokémon from moving; Abyssal Hunter 140 White; Toxic Night ★★★.",
    "es": "[UX] Sombra Trampa: Impide que Pokémon adyacentes se muevan; Cazador Abisal 140 Blanco; Noche Tóxica ★★★."
  },
  "mega_charizard_x": {
    "pt": "[UX] Fulgor Carmesim: Chama Carmesim 150 Branco; Asa do Dragão ★★★ atravessa e empurra adversários.",
    "en": "[UX] Crimson Flare: Crimson Flame 150 White; Dragon Wing ★★★ passes through and pushes foes.",
    "es": "[UX] Fulgor Carmesí: Llama Carmesí 150 Blanco; Ala Dragón ★★★ atraviesa y empuja a rivales."
  },
  "mega_rayquaza": {
    "pt": "[UX] Corrente Delta: Ascensão do Dragão 150 Dourado e Velocidade Extrema 100 Dourado; neutraliza fraquezas de voo.",
    "en": "[UX] Delta Stream: Dragon Ascent 150 Gold & Extreme Speed 100 Gold; neutralizes flying weaknesses.",
    "es": "[UX] Ráfaga Delta: Ascenso Draco 150 Dorado y Velocidad Extrema 100 Dorado; neutraliza debilidades de vuelo."
  },
  "ditto": {
    "pt": "Impostor / Transform: Ao vencer uma batalha tirando o golpe Roxo Transform Mirror ★★★, o Ditto se transforma no Pokémon adversário por 3 turnos, copiando aparência, wheel de golpes, MP e tipo!",
    "en": "Imposter / Transform: Upon winning combat spinning the Purple move Transform Mirror ★★★, Ditto transforms into the opponent figure, wheel, MP, and attributes for 3 turns!",
    "es": "Impostor / Transform: ¡Al ganar un combate con Transform Mirror ★★★, Ditto se transforma en el Pokémon rival durante 3 turnos, copiando apariencia, ruleta, PM y tipo!"
  }
};

// ============================================================================
// STATUS CONDITIONS TRANSLATION DICTIONARY
// ============================================================================
const CONDITIONS_I18N = {
  pt: {
    normal: "Normal", sleep: "Dormindo", paralyze: "Paralisado", freeze: "Congelado",
    burn: "Queimado", poison: "Envenenado", badpoison: "Tóxico", panic: "Confuso",
    wait: "Espera", ko: "Nocauteado"
  },
  en: {
    normal: "Normal", sleep: "Asleep", paralyze: "Paralyzed", freeze: "Frozen",
    burn: "Burned", poison: "Poisoned", badpoison: "Badly Poisoned", panic: "Confused",
    wait: "Wait", ko: "Knocked Out"
  },
  es: {
    normal: "Normal", sleep: "Dormido", paralyze: "Paralizado", freeze: "Congelado",
    burn: "Quemado", poison: "Envenenado", badpoison: "Tóxico", panic: "Confuso",
    wait: "Espera", ko: "Derrotado"
  }
};

// ============================================================================
// STATE & CORE TRANSLATION HELPERS
// ============================================================================
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

function t(key, fallback = "", params = null) {
  if (typeof fallback === "object" && fallback !== null) {
    params = fallback;
    fallback = "";
  }
  const dict = I18N_TRANSLATIONS[currentAppLanguage] || I18N_TRANSLATIONS["pt"];
  let str = (dict && dict[key] !== undefined) ? dict[key] : ((I18N_TRANSLATIONS["pt"] && I18N_TRANSLATIONS["pt"][key] !== undefined) ? I18N_TRANSLATIONS["pt"][key] : (fallback || key));
  if (params && typeof params === "object") {
    for (const [pk, pv] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${pk}\\}`, "g"), pv);
    }
  }
  return str;
}

function localizeMove(moveName) {
  if (!moveName) return "";
  const lang = getAppLanguage();
  if (lang === "en") return moveName;

  // Preserve multi-hit multiplier suffix (e.g. " 40x", " 20x", " 30x", " 50x")
  const multiMatch = moveName.match(/^(.*?)(?:\s+(\d+x))$/i);
  let baseName = moveName;
  let suffix = "";
  if (multiMatch) {
    baseName = multiMatch[1].trim();
    suffix = " " + multiMatch[2];
  }

  const key = baseName.toLowerCase().trim();
  const entry = POKEMON_MOVES_I18N[key] || POKEMON_MOVES_I18N[moveName.toLowerCase().trim()];
  if (entry && entry[lang]) {
    return entry[lang] + suffix;
  }
  return moveName;
}

function localizeType(typeStr) {
  if (!typeStr) return "";
  const lang = getAppLanguage();
  if (lang === "en") return typeStr;
  const dict = POKEMON_TYPES_I18N[lang];
  if (!dict) return typeStr;
  return typeStr.split("/").map(t => dict[t.trim()] || t.trim()).join("/");
}

function localizeCondition(condCodeOrName) {
  const lang = getAppLanguage();
  const dict = CONDITIONS_I18N[lang] || CONDITIONS_I18N.pt;
  const key = String(condCodeOrName || "").toLowerCase();
  return dict[key] || condCodeOrName;
}

function localizeAbility(f) {
  if (!f) return "Habilidade padrão Pokémon Duel.";
  const lang = getAppLanguage();
  const fid = f.id || f.baseId || "";

  // 1. Check core figures specific translation
  if (CORE_FIGURE_ABILITIES_I18N[fid] && CORE_FIGURE_ABILITIES_I18N[fid][lang]) {
    return CORE_FIGURE_ABILITIES_I18N[fid][lang];
  }
  if (typeof FIGURE_ABILITIES_DB !== "undefined" && FIGURE_ABILITIES_DB[fid]) {
    const raw = FIGURE_ABILITIES_DB[fid];
    if (lang === "en") return raw;
    // Adapt pattern for expansion figures
    if (lang === "pt") {
      return raw.replace(/figure/gi, "figura")
                .replace(/Grass/gi, "Grama")
                .replace(/Water/gi, "Água")
                .replace(/Fire/gi, "Fogo")
                .replace(/Electric/gi, "Elétrico")
                .replace(/Fighting/gi, "Lutador")
                .replace(/Poison/gi, "Veneno")
                .replace(/Ground/gi, "Terra")
                .replace(/Flying/gi, "Voador")
                .replace(/Psychic/gi, "Psíquico")
                .replace(/Bug/gi, "Inseto")
                .replace(/Rock/gi, "Pedra")
                .replace(/Ghost/gi, "Fantasma")
                .replace(/Dragon/gi, "Dragão")
                .replace(/Steel/gi, "Aço")
                .replace(/Normal/gi, "Normal")
                .replace(/Ice/gi, "Gelo")
                .replace(/Fairy/gi, "Fada");
    }
    if (lang === "es") {
      return raw.replace(/figure/gi, "figura")
                .replace(/Grass/gi, "Planta")
                .replace(/Water/gi, "Agua")
                .replace(/Fire/gi, "Fuego")
                .replace(/Electric/gi, "Eléctrico")
                .replace(/Fighting/gi, "Lucha")
                .replace(/Poison/gi, "Veneno")
                .replace(/Ground/gi, "Tierra")
                .replace(/Flying/gi, "Volador")
                .replace(/Psychic/gi, "Psíquico")
                .replace(/Bug/gi, "Bicho")
                .replace(/Rock/gi, "Roca")
                .replace(/Ghost/gi, "Fantasma")
                .replace(/Dragon/gi, "Dragón")
                .replace(/Steel/gi, "Acero")
                .replace(/Normal/gi, "Normal")
                .replace(/Ice/gi, "Hielo")
                .replace(/Fairy/gi, "Hada");
    }
    return raw;
  }
  return f.ability || (lang === "en" ? "Standard Pokémon Duel Ability." : (lang === "es" ? "Habilidad estándar de Pokémon Duel." : "Habilidade padrão Pokémon Duel."));
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
  if (typeof renderCollectionWithPagination === "function") renderCollectionWithPagination();
  if (typeof renderShopExchange === "function") renderShopExchange();
  if (typeof renderFusionChamber === "function") renderFusionChamber();
  if (typeof drawHDVectorBoardAndChrome === "function") drawHDVectorBoardAndChrome();
}

function updateAllLocalizedUI() {
  if (typeof document === "undefined") return;

  // 1. Language selector buttons active style in Settings
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

  // 2. Bottom Navigation Bar tabs
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

  // 3. Elements with data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const k = el.getAttribute("data-i18n");
    if (k) el.textContent = t(k, el.textContent);
  });
  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    const k = el.getAttribute("data-i18n-html");
    if (k) el.innerHTML = t(k, el.innerHTML);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const k = el.getAttribute("data-i18n-placeholder");
    if (k) el.setAttribute("placeholder", t(k, el.getAttribute("placeholder")));
  });

  // 4. Update Language pill
  const langPill = document.getElementById("current-lang-pill");
  if (langPill) {
    langPill.textContent = currentAppLanguage === "en" ? "EN-US" : (currentAppLanguage === "es" ? "ES-ES" : "PT-BR");
  }

  // 5. Update In-match plates button if tray is visible
  const uBtn = document.getElementById("plate-use-btn");
  if (uBtn) uBtn.textContent = t("plate.use_btn");

  // 6. Update Shop search placeholder
  const shopSearch = document.getElementById("shop-search-inp");
  if (shopSearch) shopSearch.placeholder = t("shop.search_placeholder", "🔍 Buscar Pokémon na Loja...");
  const deckSearch = document.getElementById("collection-search-inp");
  if (deckSearch) deckSearch.placeholder = t("deck.search_placeholder", "🔍 Buscar entre os 217 Pokémon...");

  // 7. Update Daily bonus button
  const dBonus = document.getElementById("daily-bonus-btn");
  if (dBonus) dBonus.textContent = t("shop.daily_bonus");

  // 8. Update Play Mode Selector Modal texts
  const pmTitle = document.querySelector("#play-mode-modal strong, #play-mode-modal div[style*='font-size:14px']");
  if (pmTitle) pmTitle.textContent = t("modes.title");

  // 9. Update Matchmaker radar texts
  const mmStatus = document.getElementById("mm-status-title");
  if (mmStatus) mmStatus.textContent = t("mm.searching");
  const mmSub = document.getElementById("mm-status-sub");
  if (mmSub) mmSub.textContent = t("mm.syncing");

  // 10. Update Home stage pedestal toggle button
  if (typeof updatePedestalToggleButton === "function") updatePedestalToggleButton();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => updateAllLocalizedUI());
  } else {
    updateAllLocalizedUI();
  }
}

window.I18N_TRANSLATIONS = I18N_TRANSLATIONS;
window.POKEMON_MOVES_I18N = POKEMON_MOVES_I18N;
window.POKEMON_TYPES_I18N = POKEMON_TYPES_I18N;
window.CORE_FIGURE_ABILITIES_I18N = CORE_FIGURE_ABILITIES_I18N;
window.CONDITIONS_I18N = CONDITIONS_I18N;
window.getAppLanguage = getAppLanguage;
window.setAppLanguage = setAppLanguage;
window.updateAllLocalizedUI = updateAllLocalizedUI;
window.localizeMove = localizeMove;
window.localizeType = localizeType;
window.localizeCondition = localizeCondition;
window.localizeAbility = localizeAbility;
window.t = t;
