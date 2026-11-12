# 🤝 AI_HANDOFF.md — Diário de Bordo Claude ⇄ N.O.V.A.

> **REGRA ZERO:** qualquer IA (Claude, N.O.V.A./Gemini ou outra) que vá mexer neste repositório **lê este arquivo inteiro antes de qualquer ação** e **registra no Log tudo o que alterou antes de encerrar**. Se não está aqui, o outro agente não sabe que aconteceu.
>
> Dono do projeto: Gabriel (`wisper2904`). Idioma do arquivo: português.

---

## 0. Protocolo obrigatório

**Antes de começar qualquer pedido do Gabriel:**
1. `git pull origin main` (ou recarregar o repo): a outra IA pode ter feito push.
2. Ler §1 (Estado atual), §2 (Em andamento) e as 5 últimas entradas do §7 (Log).
3. Se houver item em §2 "Em andamento" de outro agente nos mesmos arquivos → não sobrescrever; avisar o Gabriel.

**Ao terminar (mesmo que parcial):**
1. Adicionar entrada no **topo** do §7 Log, com o modelo do §8.
2. Atualizar §1 (versão, `CACHE_NAME`, últimas mudanças) e limpar/atualizar §2.
3. Se descobriu bug ou dívida técnica, registrar em §6.
4. Commit com prefixo do autor: `[Claude] ...` ou `[NOVA] ...`.

**Regras fixas do projeto:**
- Alterou qualquer arquivo servido (HTML/JS/CSS/asset)? → incrementar `CACHE_NAME` em `sw.js` (`pokeduel-pwa-vNNN` → `vNNN+1`).
- `index.html` e `PokeDuel-Web-v5.6.0.html` precisam ficar **idênticos** (`diff -q` sem saída).
- Arquivo JS novo → adicionar em `<script>` nos **dois** HTMLs **e** em `CORE_ASSETS` do `sw.js`, respeitando a ordem de carga (§4).
- Validar antes do commit: `for f in $(find js -name "*.js") sw.js; do node --check $f; done`.
- Push em `main` publica automaticamente no GitHub Pages (`.github/workflows/deploy-pages.yml`). Não existe staging.
- **Nunca** colar token/PAT neste arquivo, em commits ou no código.

---

## 1. Estado atual (atualizar a cada mudança)

| Campo | Valor |
|---|---|
| Último commit conhecido | ver `git log` — último registrado: "[Claude] IA v5.9.0" (2026-11-11) |
| `CACHE_NAME` (sw.js) | `pokeduel-pwa-v698` |
| Versão "de marketing" | inconsistente (ver §6): README diz v5.6.0, `app.js` loga v6.3.0, IA é v5.9.0 |
| Sintaxe JS | ✅ todos os 12 arquivos + `sw.js` passam em `node --check` (2026-11-11) |
| HTMLs sincronizados | ✅ `index.html` == `PokeDuel-Web-v5.6.0.html` (1.838 linhas) |
| Figuras no `FIGURES_DB` | 272 (30 meta + expansão `NEW_200_FIGURES_DATA`), 25 UX |
| Deploy | GitHub Pages via Actions, branch `main`, raiz `/` |

---

## 2. Em andamento (trava leve contra conflito)

| Agente | Desde | Tarefa | Arquivos tocados |
|---|---|---|---|
| — | — | nenhuma tarefa aberta | — |

---

## 3. Como o jogo funciona hoje (regras implementadas)

**Tabuleiro (`js/engine/board.js`)**
- Grafo de **28 nós** (`BOARD_NODES`/`BOARD_EDGES`, `ADJ`). Espaço lógico 353×530, renderizado ×`HD_SCALE`.
- P1 embaixo: entradas nós **7** e **13**, Goal **10**. P2 em cima: entradas **0** e **6**, Goal **3**.
- Anel interno 20–27, colunas laterais 14–19, atalhos diagonais 2↔21 e 11↔26.
- `ROT180_NODE_MAP` gira a mesa 180° para quem é P2 (P2P / pass-and-play). Lógica usa sempre o ID real; só o desenho é espelhado (`getNodePos`).
- Partida começa **6v6 com 0 peças em campo** (todas no banco). Banco: `BENCH_SLOTS_P1` / `P2_BENCH_COORDS`. Reviver pods: 2 por lado.

**Movimento**
- Cada figura tem `mp`. `computeReachableWithPaths(unit)` faz o BFS; `getEffectiveUnitMp` aplica bônus (buff semanal por tipo, Mega, status).
- `canPassThrough` (voadores/fantasmas) atravessa peças. Plate **Hurdle Jump** pula peça adjacente.

**Combate (`js/engine/battle.js`)**
- Atacar = peça adjacente inimiga → `triggerCombat` → cada lado gira a roleta (`spinWheelForUnit`, 96 fatias via `size`) → `evaluateCombat`.
- Hierarquia de cores: **Blue** (defesa) anula tudo · **Red** (Miss) perde · **Gold** vence Purple · **Purple** vence White · Purple×Purple decide por ★ · White/Gold×White/Gold decide por **dano**; empate = ninguém vence.
- Exceções: Z-Move bate Purple ≤2★; **Hyper Sonic** (Mew) imune a 100+ de dano.
- Efeitos roxos: `ko`, `push`, `sleep`, `paralyze`, `poison`, `badpoison`, `burn`, `freeze`, `panic`, `swap`, `bench`, `wait`, `mirror`, `vanish`, `roost`…
- Status (`PokemonCondition`, códigos hex): Panic, Poison (−20), BadPoison (−40), Sleep, Freeze, Paralyze, Burn, Faint, Melt.
- Perdedor por KO vai ao **P.C.** (`sendToPC`), retorna via fila do reviver. Alguns casos mandam ao banco com `waitTurns = 2`. Ultra Beasts podem ir para `ultra_space`.
- Cerco (`checkSurroundKOs`): peça cercada sem saída é nocauteada.

**Condições de vitória**
1. Pisar no Goal do adversário (`executeMove`).
2. **Goal Surround**: cercar inimigo parado no próprio Goal.
3. Adversário sem movimentos nem ataques legais no início do turno (entry block / wait).
4. Limite de **300 turnos** (`state.turnCounter` regressivo) → vence quem não está jogando o turno.
5. Relógio de 5 min por jogador (`clockMsP1/P2`). Desistência voluntária.

**Plates** (`state.plates`, limite de custo **6/6 ◆**): Hurdle Jump, Double Chance, X Attack (+30), X Speed (White→Gold), Max Revive, Goal Block, Mega Plate [UX], Long Throw, Pokémon Switch. Além disso tem Z-Move com gauge (`zGaugeP1/P2`).

**Evolução**: `POKEMON_EVOLUTION_FAMILIES` + `NEW_200_EVO_CHAINS`; `evolveUnitInMatch` / `applyUnitEvolutionNow`; Mega reverte após 5 turnos; Ditto transforma no oponente.

**Deck**: 6 figuras, no máx. **1 Mega · 1 UX · 2 EX** (`ui.js`, `MAX_DECK_*`). Decks são **arrays de índices** do `FIGURES_DB`.

**Aleatoriedade**: PRNG determinístico compartilhado (`setSharedSeed` / `nextDeterministicRandom`), para o P2P dar o mesmo resultado nos dois lados.

---

## 4. Arquitetura real (o que o prompt original não dizia)

**Ordem de carga dos scripts (HTML, linhas ~1824–1836). Ela importa:**
```
peerjs → i18n → sprites → figures → official_disks → bots → audio → board → battle → p2p_matchmaker → ui → juice → ai → app
```
Tudo é **global** (sem ES modules, sem bundler). Cada arquivo enxerga as funções dos anteriores.

**⚠️ Padrão de monkey-patch em camadas.** Versões antigas foram "estendidas" assim:
```js
const _v580ExecuteMove = executeMove;
executeMove = function(...) { /* lógica nova */ return _v580ExecuteMove(...); };
```
Isso aparece em `ui.js`, `p2p_matchmaker.js` e `ai.js`. O wrapper **carregado por último é o que roda primeiro**. Exemplos: `showWinResultScreen` está embrulhado **5×** (ui v460/v470/v480, p2p v500, ai v580). `executeMove`, `computeReachableWithPaths`, `getActiveWheel`, `sendToPC`, `triggerPlayerAIMove`, `openDrawer` e `triggerVoluntaryForfeit` são reescritos em `ai.js`.
→ **Antes de editar uma função, rode `grep -rn "NomeDaFuncao = " js/`** para ver se ela é sobrescrita depois. Editar só a original pode não ter efeito nenhum.

**Arquivos (linhas em 2026-11-11):**
| Arquivo | Linhas | Papel |
|---|---|---|
| `js/data/i18n.js` | 2.847 | traduções; `t(key, fallback)`, `localizeMove` |
| `js/data/sprites.js` | 2.105 | sprites/texturas (parte em base64) |
| `js/data/figures.js` | 680 | `FIGURES_DB`, evoluções, habilidades, buff semanal por tipo |
| `js/data/bots.js` | 408 | `RANKED_BOT_TRAINERS`, gerador de deck adaptativo |
| `js/audio/audio.js` | 59 | SFX Web Audio (`playSfx`) |
| `js/engine/board.js` | 3.588 | estado global `state`, grafo, render loop canvas, movimento, plates, evolução, card de inspeção |
| `js/engine/battle.js` | 1.718 | roleta, combate, Z-Moves, `endTurn`/`applyExplicitTurn` |
| `js/network/p2p_matchmaker.js` | 1.661 | PeerJS/WebRTC, sala 4 dígitos, "Salão" via MQTT-over-WebSocket, fallback para bot em 30 s, tutorial |
| `js/ui/ui.js` | 10.369 | **monólito**: abas (hub/deck/fusion/p2p/shop/menu), booster, BGM, progressão, economia, perfil, leaderboard, feedback, tutorial |
| `js/ui/juice.js` | 863 | game feel (shake, hit flash, dano flutuante, haptics), API `window.Juice` |
| `js/engine/ai.js` | ~1.740 | IA adaptativa v5.9.0: heatmap 28 nós, opening book 3 turnos, minimax 2-ply, counter-deck + camada de valor tático (EV de combate, mapa de ameaça) |
| `js/app.js` | 92 | bootstrap: registro do SW, BGM, `DOMContentLoaded` |
| `sw.js` | 58 | cache-first PWA, `CORE_ASSETS` |

**Persistência (localStorage)**, chaves principais: `pdr_progression_v450`, `pdr_economy_v470`, `pdr_individual_profile_v480`, `pdr_accounts_vault_v560`, `pdr_cloud_session_v560`, `pdr_adaptive_ai_brain_v580`, `pdr_registered_leaderboard_v650`, `pokeduel_language`, `pokeduel_juice_v1`. Mudar o formato de uma chave exige migração, senão o save do jogador quebra.

---

## 5. Armadilhas conhecidas

- **Nunca reordenar nem remover itens do `FIGURES_DB`.** Decks, inventário (`unlockedFigures`, `figureCopies`) e saves guardam **índices**. Figura nova vai sempre no **final**.
- Mudanças de regra de combate ou movimento precisam ser **determinísticas** (usar `nextDeterministicRandom`, nunca `Math.random`) senão o P2P dessincroniza.
- Pacotes P2P (`sendP2PPacket`) passam por `seenP2PPacketIds` (deduplicação). Tipo de pacote novo precisa ser tratado em `handleP2PPacket` nos dois lados.
- `ui.js` é enorme: preferir `grep -n` + edição cirúrgica a reescrever blocos.
- **`showWinResultScreen` tem 7 camadas** e a do `ui.js` linha ~3491 **substitui** tudo que veio antes (não chama a anterior). Por isso o tratamento de Tutorial/Treino/Quest do `p2p_matchmaker.js` nunca rodava. Desde v687 essa versão fica em `window.__pdrSpecialResultScreen` e a camada de fora (`ai.js`) desvia para ela quando `matchKind` é `tutorial`, `training` ou `quest`. A conta do "Para a próxima liga" e o título VITÓRIA/DERROTA também são feitos no `ai.js`, porque o código equivalente no `board.js` é código morto.
- Atualização automática (desde v686): o app checa o `sw.js` ao abrir, ao voltar para a tela, no `focus` e no `online` (no máx. 1×/30 s) e mostra o aviso "Nova versão disponível · Recarregar". **Ou seja: se esquecer de subir o `CACHE_NAME`, ninguém recebe a atualização.**
- `.md` não entra em `CORE_ASSETS`. Editar só este arquivo **não** exige bump de `CACHE_NAME`.

---

## 6. Dívida técnica / bugs abertos

- [ ] Versões inconsistentes (README v5.6.0 · app.js v6.3.0 · ai v5.9.1 · cache v698). Definir uma fonte única (ex.: `const APP_VERSION` em `app.js`).
- [ ] Cadeias de monkey-patch (§4) dificultam manutenção; consolidar aos poucos, uma função por vez, com teste manual.
- [ ] `index.html` duplicado em `PokeDuel-Web-v5.6.0.html`: avaliar virar redirect para eliminar risco de dessincronia.
- [ ] `initAITacticalPlates` passa do limite 6◆ quando libera Double Chance/Mega (4 plates = 6◆ + extras).
- [ ] **Dois deploys por push**: rodam o workflow `Deploy PokeDuel to GitHub Pages` (`.github/workflows/deploy-pages.yml`) e o automático `pages build and deployment`. Eles competem e às vezes um falha (76f3f3a: falha no passo Deploy; e8fc86d: startup_failure), o que gera e-mail de erro. Resolver em Settings → Pages → Source: escolher **GitHub Actions** (aí o automático para) — ou, se ficar "Deploy from a branch", apagar o workflow.
- [ ] 53 figuras do `FIGURES_DB` sem roleta oficial: 49 não existiam no Pokémon Duel (Kabutops, Starmie, Ditto, Jirachi…) ou são formas com outro nome (Palkia/Dialga/Giratina Origin, Deoxys Attack/Speed, Shaymin Land/Sky); 4 com dado incompleto na Bulbapedia (Lapras, Popplio, Poliwrath, Tentacruel). Pré-existente: 6 figuras com roleta que não soma 96 (Lapras, Kabutops, Mega Starmie, Mega Lopunny, Palkia/Dialga Origin).
- [ ] Efeito roxo `none` (40 fatias): efeitos especiais do jogo original ainda não implementados (marcadores, MP −2, mover a si mesmo etc.) — vencem o duelo sem nocautear. Texto original em `effectText`.
- [ ] 652 imagens oficiais em `assets/figures_duel/` ainda **sem uso** (187×256, retrato, já com base). Usar como sprite exige ajustar o desenho no tabuleiro/hub e perguntar ao Gabriel.
- [ ] Não há testes automatizados de regra (`evaluateCombat` é pura e fácil de testar com Node).

---

## 7. Log de alterações (mais recente no topo)

### 2026-11-11 · Claude · Roletas oficiais do Pokémon Duel + imagens (v698)
- **O que:**
  - Coleta via Claude in Chrome (o shell não acessa a Bulbagarden): 652 imagens da categoria "Pokémon Duel figures" (archives.bulbagarden.net) e o Data Disk de 594 das 596 figuras da Library (bulbapedia). Pacote enviado pelo Gabriel.
  - Novo `js/data/official_disks.js` (carregado logo após `figures.js`, nos dois HTMLs e em `CORE_ASSETS`): `OFFICIAL_DUEL_DISKS` por **índice** do `FIGURES_DB`; troca `wheel` e `mp` de **219 das 272 figuras** pela versão oficial mais recente; guarda `officialDuelId` e `officialAbilityText`. Raridade do jogo **mantida** (56 divergem da oficial; mudar invalidaria decks salvos). Fatias roxas: `effect` mapeado do texto oficial para os códigos da engine + `effectText` com o texto original. Multi-hit (×) vira `multiHit: true`.
  - `js/engine/battle.js`: novos efeitos `wait` (Espera 2, sem nocaute — antes qualquer efeito desconhecido nocauteava) e `none` (vence sem efeito).
  - `assets/figures_duel/*.webp`: as 652 imagens (13 MB), fora do cache do SW.
- **CACHE_NAME:** v697 → v698
- **Verificação:** soma 96 em todas as roletas aplicadas; partida bot × bot completa sem erro de console.
- **Pendências:** ver §6 (figuras sem roleta oficial, efeito `none`, imagens sem uso).

### 2026-11-11 · Claude · Boosters com a arte original (v697)
- **O que:**
  - Novos arquivos em `assets/ui/boosters/` (12 PNGs 120×103 enviados pelo Gabriel, da Bulbagarden Archives): `red`, `rainbow`, `rainbow_1`, `purple`, `purple_1`, `metallic`, `green`, `gold`, `gold_1`, `blue`, `black`, `locked`.
  - `js/ui/ui.js` `BoosterCinematic.drawBoosterCaseArt`: a abertura usa a arte (silver → `metallic`, purple → `purple`, gold/multi → `gold`, locked → `locked`). A imagem é cortada a 38% da altura: a parte de cima vira a tampa que sobe e inclina; luz, brilhos, névoa e silhueta continuam iguais. A maleta desenhada por código ficou só como reserva se a imagem não carregar.
  - `js/data/sprites.js`: slots do hub (`booster_silver`, `booster_purple`) apontam para `boosters/metallic.png` e `boosters/purple.png`.
  - `sw.js`: os 4 PNGs em uso entraram em `CORE_ASSETS`.
- **Em aberto:** 8 artes ainda sem uso (red, rainbow, rainbow_1, purple_1, green, gold_1, blue, black) — Gabriel decide para que tipo de baú cada uma vai. `assets/ui/booster_silver.png` e `booster_purple.png` antigos ficaram sem uso.
- **CACHE_NAME:** v696 → v697
- **Verificação:** Playwright: abertura com metallic, purple e locked renderiza; sem erro de console.

### 2026-11-11 · Claude · Abertura de baús no estilo Pokémon Duel (v696)
- **O que:** `js/ui/ui.js`, objeto `BoosterCinematic` (mesma API; `start()` ganhou 6º argumento opcional `newFlags`):
  - Fases novas: `box_floating` (maleta fechada, "Toque para abrir", abre sozinha após 2,6 s) → `box_opening` (travas soltam, tampa gira para trás, feixe de luz) → `figure_silhouette` (figura sobe como silhueta na cor da raridade, "? ? ?") → `figure_reveal` (como antes + selo "NOVO!").
  - `drawBoosterCase`: maleta metálica com travas, emblema (vermelho → verde ao destravar) e 4 cores por tipo (`caseKind`: silver padrão, gold para multi, purple se o título tiver "roxo/purple/6h", red se tiver "locked/chave").
  - `emitCaseFx` / `updateCaseFx`: brilhos em estrela saindo da boca e névoa que escorre pela frente e se espalha no chão. Névoa sempre forte com EX/UX; nas demais, 40% de chance (`smokeLevel`).
  - `drawSilhouette`: sprite pintado com a cor da raridade (C branco, UC verde, R azul, EX dourado, UX roxo), com cache.
  - `drawBoosterBox` antigo ficou sem uso (pode ser apagado).
- **Por quê:** Gabriel pediu a abertura como no Pokémon Duel original. Feito de memória + descrição dele (brilhos e, às vezes, fumaça descendo); não consegui ver o vídeo de referência — ajustar se ele apontar diferenças.
- **CACHE_NAME:** v695 → v696
- **Verificação:** Playwright 390×844 com [Charizard EX, Bulbasaur UC]: todas as fases renderizam, sem erro de console.

### 2026-11-11 · Claude · Hub volta ao layout original (v695)
- **O que:** revertidas as mudanças de v693/v694 no hub (`js/ui/ui.js`, `index.html`, `PokeDuel-Web-v5.6.0.html` restaurados do commit `0ed1656`): time no "V", pedestal 3D na figura central e botão "Pedestal: 3D / Só a Peça" de volta.
- **Por quê:** Gabriel preferiu o original depois de ver as duas versões (fila com pedestal extra = base dupla; fila sem pedestal).
- **CACHE_NAME:** v694 → v695
- **Aviso:** não refazer o alinhamento do hub sem falar com o Gabriel.

### 2026-11-11 · Claude · Hub sem base dupla (v694)
- **O que:** `js/ui/ui.js`: os sprites já vêm com a base da própria figura, então tirei os mini-pedestais da fila do time (seção 4 de `renderHomeCarouselLoop`) e o pedestal 3D grande da figura central (`homeCenterpieceShowPedestal = false`, a central fica só com a base própria + anel ciano). A fila continua reta, mesma altura e mesma linha de base (`getTrimmedSpriteBox`).
- **Por quê:** Gabriel: "não pode ter 2 bases".
- **CACHE_NAME:** v693 → v694
- **Verificação:** Playwright 390×844: cada figura aparece com uma base só.

### 2026-11-11 · Claude · Time do hub alinhado em pedestais (v693)
- **O que:** `js/ui/ui.js` `renderHomeCarouselLoop`, seção 4: as 6 figuras do time saíram do "V" espalhado e agora ficam numa fila reta, cada uma no seu pedestal (`centerpiece_pedestal_3d.png` em miniatura), todas com a mesma altura e a mesma linha de base. Novo `getTrimmedSpriteBox(img)` recorta a margem transparente de cada sprite (cache em `WeakMap`) para o alinhamento ser exato. A fila deixa livre o canto direito da Pokébola. Removido o botão "🏛️ Pedestal: 3D / Só a Peça" (dois HTMLs); `homeCenterpieceShowPedestal` fixo em `true`.
- **Por quê:** pedido do Gabriel.
- **CACHE_NAME:** v691 → v693 (v692 foi só teste local)
- **Verificação:** Playwright 390×844: 6 figuras alinhadas sobre pedestais, anel dourado na selecionada, toque no pedestal troca a figura central.

### 2026-11-11 · Claude · Remove botão NOTAS do hub (v691)
- **O que:** removido o botão flutuante "📢 NOTAS v6.1.0" do hub (dois HTMLs) e a abertura automática das Notas de Atualização (`ui.js`). O modal continua acessível pelo botão "Ver Notas da Atualização" na aba Config.
- **Por quê:** pedido do Gabriel.
- **CACHE_NAME:** v690 → v691
- **Verificação:** Playwright: hub abre com só o botão TUTORIAL à esquerda.

### 2026-11-11 · Claude · ELO do bot acompanha o do jogador (v690)
- **O que:** `js/network/p2p_matchmaker.js` `triggerBotFallbackNow`: o bot da Liga mantém nome/deck do personagem, mas o ELO dele passa a ser o do jogador ±60 (mín. 800), e a liga é calculada pela mesma tabela do jogador (Beginner/Leader/Champion/Master/Legend). Os ratings fixos em `bots.js` (1890–2400) continuam lá, mas só servem para escolher o personagem.
- **Por quê:** contra um jogador 1000, o bot vinha com ~1940: vitória dava ~+32 e derrota ~0.
- **Efeito na pontuação (simulado, 2.000 sorteios):** vitória +13 a +19 (média +16), derrota −13 a −19 (média −16), em qualquer faixa de ELO. A regra de mínimo −8 na desistência continua.
- **CACHE_NAME:** v689 → v690
- **Verificação:** Playwright: jogador 992 → bot "Volkner (Gym Leader)" com 1014 ELO · Beginner, mostrado no modal da fila.

### 2026-11-11 · Claude · Build visível na Config (v689)
- **O que:** `js/app.js` `refreshPdrBuildLabel()` lê o nome do cache do Service Worker (`caches.keys()`) e mostra em "Versão v6.1.0 · Estável · Build vNNN" (aba Config, nos dois HTMLs). Atualiza também quando a versão nova assume.
- **Por quê:** Gabriel não conseguia saber se o APK estava com a versão nova. Os e-mails "Run failed" vêm dos deploys concorrentes (ver §6), não de abrir o APK. O último deploy (6eb5d26) passou.
- **CACHE_NAME:** v688 → v689
- **Pendências:** decisão do Gabriel sobre a origem do Pages (§6).

### 2026-11-11 · Claude · Treino/Quest/Copa, ELO na desistência e Tour do Hub (v688)
- **O que:**
  - `board.js` `demoFullMatchState`: não converte mais `training`, `quest` e `gym_cup` em `league`. Efeito: o **Treino** agora não dá ELO nem prêmio (tela "TREINO: FIM"); **Quest** volta a contar estrelas; **Copa de Ginásio** volta a aplicar o bônus de Fogo (+20) e, pelo `ai.js`, a pagar o troféu (+1 🏆, +100 Gems, +250 Material — esse prêmio só existia no `board.js` base, que é código morto).
  - `ai.js`: desistir na Liga custa no mínimo `AI_FORFEIT_MIN_ELO_LOSS = 8` pontos. Pela fórmula ELO, perder para um rival muito mais forte custava 0, então desistir era de graça.
  - `ui.js`: **Tour do Hub (5 etapas) reativado** (`startGuidedHubTour` / `stepGuidedHubTour` / `finishGuidedHubTour` restaurados de `59ad93c^`; HUD sem o `display:none !important`). Abre sozinho logo depois de criar a conta (chave `pdr_hub_tour_v687_done`). Card na aba Config para rever o tutorial ou o tour.
- **CACHE_NAME:** v687 → v688
- **Verificação:** Playwright, perfil limpo: pular tutorial → criar conta → tour abre e percorre Hub → Hub → Decks → Fusão → Loja → concluir (chave gravada). Treino + desistência: rating 1000 → 1000, moedas 15.000 → 15.000, tela "TREINO: FIM". Liga + desistência: rating 1000 → 992 ("-8 ↓"), salvo após recarregar.
- **Pendências / avisos para o outro agente:** item novo em §6 sobre o ELO dos bots do fallback.

### 2026-11-11 · Claude · Primeira abertura, desistência e traduções (v687)
- **O que:**
  - **Tutorial interativo restaurado** (tinha sido removido no commit `59ad93c`): `ui.js` `startInteractiveTutorialMatch` volta a montar a partida de 6 aulas; `p2p_matchmaker.js` não marca mais `pdr_tutorial_v510_completed` em toda abertura. Na **primeira abertura** (sem essa chave) o jogo pula as Notas e entra direto no tutorial. Novo `finishTutorialAndShowWelcome()`: ao terminar (botão "Criar minha conta", "Próximo" ou "Pular Tutorial") marca o tutorial como feito e, se não houver conta salva (`getSavedCloudSession`), abre o `welcome-profile-modal` (usuário + senha, texto "Bem-vindo, Treinador!"). Botão do HUD "Ir ao Tour do Hub" virou "Pular Tutorial".
  - **Desistir**: `board.js` `requestForfeitConfirm()` com modal "Desistir da partida?" antes de `triggerVoluntaryForfeit`. `p2p_matchmaker.js` grava `state.forfeitBy`; `ai.js` (camada de fora do `showWinResultScreen`) desfaz moedas, gemas e fragmentos de quem desistiu e mostra "Recompensas: Nenhuma (desistência)".
  - **Tabuleiro**: VITÓRIA/DERROTA (vermelho) no lugar do "WIN" fixo; no pass-and-play mostra "P1/P2 VITÓRIA". Botão "AI" (vinha desenhado na imagem da arena, sem função) mascarado no canvas.
  - **Traduções** (`i18n.js`, pt/en/es): Encerrar Turno, 1º TURNO, Sua vez / Vez do oponente, INÍCIO, dica "Toque no alvo vermelho…", textos do modal de desistência, tela de resultado inteira (RESULTADO, Classificação, Fragmentos de chave, Recompensas, Para a próxima liga, Próximo) via `data-i18n` nos dois HTMLs. "+0 ↑" virou "±0". "League promotion in 1215" (número fixo) agora calcula os pontos até a próxima liga.
  - **Config**: o publicador "GitHub Pages (1 Toque · Monolítico)" ficou escondido (`.pdr-dev-only`). Para ver: `localStorage.setItem("pdr_dev_mode","1")` e recarregar. Placeholders "Ex: wisper2904" trocados por "Ex: treinador123".
- **Por quê:** teste de UX com jogador novo (Gabriel pediu os itens).
- **CACHE_NAME:** v686 → v687
- **Verificação:** Playwright, perfil limpo, 390×844: abre direto na Aula 1 → 6 aulas → "Partida concluída" sem ELO/recompensa → "Criar minha conta" → modal de boas-vindas → conta criada → recarregar abre o hub sem tutorial. Partida vs bot: modal de desistência (Continuar fecha; Desistir encerra), tabuleiro mostra DERROTA, moedas 15.000 → 15.000 e fragmentos 0 → 0. `node --check` OK, HTMLs idênticos.
- **Pendências / avisos para o outro agente:** ver itens novos em §6 (Treino volta para "league"; Tour do Hub desligado).

### 2026-11-11 · Claude · Repositório wisper2904.github.io (APK sem barra de endereço)
- **O que:** criado o conteúdo do repo `wisper2904/wisper2904.github.io` (repo vazio criado pelo Gabriel): `/.well-known/assetlinks.json` (pacote `io.github.wisper2904.pokeduel`, SHA-256 da chave do PWABuilder `03:72:F0:96:…:05:A4`), `.nojekyll` e `index.html` redirecionando para `/pokeduel/`.
- **Por quê:** o APK gerado no PWABuilder (TWA) só abre em tela cheia se o domínio confirmar a assinatura via Digital Asset Links.
- **CACHE_NAME:** inalterado (nada mudou neste repo).
- **Pendências / avisos para o outro agente:** se o APK for gerado de novo com **outra chave** ou outro Package ID, o `assetlinks.json` precisa ser atualizado, senão a barra volta. O `.keystore` fica com o Gabriel, nunca no git.

### 2026-11-11 · Claude · Atualização automática do app (PWA)
- **O que:**
  - `js/app.js`: registro do SW com `updateViaCache: "none"`; `reg.update()` ao abrir e em `visibilitychange`/`focus`/`online` (throttle 30 s); aviso fixo "🔄 Nova versão disponível · Recarregar" quando o novo SW assume (`controllerchange`) ou quando há um SW `waiting`. Se houver partida em andamento, o aviso diz que recarregar encerra a partida. Botão ✕ adia.
  - `sw.js`: o install baixa `CORE_ASSETS` com `cache: "reload"` (antes podia pegar arquivo velho do cache HTTP de 10 min do GitHub Pages).
  - `index.html` + `PokeDuel-Web-v5.6.0.html`: removido o botão **ATUALIZAR 1-Toque** do hub (pedido do Gabriel). Ficam como reserva o botão "Atualizar Agora" na aba Config e o "Recarregar e Atualizar Agora" no modal de Notas (`triggerInAppUpdateAction`, que limpa cache e SW à força).
- **Por quê:** Gabriel quer o app no celular puxando as atualizações do git sem baixar APK nem apertar botão.
- **CACHE_NAME:** v685 → v686
- **Verificação:** Playwright com SW real: app controlado pelo SW v686 → `sw.js` trocado para v999 no servidor → `reg.update()` → cache v999 instalado e aviso exibido; clique em Recarregar abre a versão nova. HTMLs idênticos, `node --check` OK.
- **Pendências / avisos para o outro agente:** nenhuma. Só lembrar de sempre subir o `CACHE_NAME`.

### 2026-11-11 · Claude · IA mais difícil (v5.9.0)
- **O que:** `js/engine/ai.js`
  - Nova camada antes de `triggerPlayerAIMove`: `aiUnitValue`, `aiAttackEV`, `aiBuildEnemyStrikeMap`, `aiExposureInfo`, constantes `AI_NOISE_CAP = 450` e `AI_MIN_DIFFICULTY = 0.55`.
  - `triggerPlayerAIMove`: (1) bônus de avanço (turnsToWin, goalPull, Entry Lockdown) multiplicados pela chance de a peça sobreviver ao contra-ataque (`rushSurvive`); (2) penalidade de exposição = pior ataque inimigo possível no próximo turno, incluindo peças do banco com peso 0,6; (3) decisão de ataque por valor esperado (antes atacava com 45% de vitória ou saldo ≥ −2); (4) ataque pós-movimento também por EV; (5) penalidade de armadilha de cerco 6.000 → 24.000; (6) ruído tático limitado a 450 (antes até 3.800).
  - Aprendizado pós-partida: quando a IA vence, não aumenta mais o ruído nem baixa a dificuldade.
  - `initAITacticalPlates`: piso de dificuldade 0,55, então Double Chance já vem desde a 1ª partida.
- **Por quê:** Gabriel achou o bot fácil; pediu algo no nível do protótipo Xadrez Arcano. Visual, menus e arena **não** mudam (decisão dele: manter o PokeDuel como está).
- **CACHE_NAME:** v684 → v685
- **Verificação:** `node --check` OK. Teste headless (Playwright + relógio falso) com cenários montados: a IA antiga entrava em 7/7 casos numa casa onde levava 70–76% de nocaute; a nova evitou nos 7. Partidas completas rodando sem erro de console. Não existe ainda um oponente automático que jogue como humano, então não há taxa de vitória medida contra pessoa.
- **Pendências / avisos para o outro agente:** se alguém achar a IA passiva demais (recuando), os botões são `rushSurvive` (piso 0,35), o peso 1,15 da exposição e o peso 0,6 das peças do banco em `aiExposureInfo`.

### 2026-11-11 · Claude · Criação do diário de bordo
- **O que:** criados `AI_HANDOFF.md` (este arquivo) e os ponteiros `CLAUDE.md`, `GEMINI.md`, `AGENTS.md` que mandam ler este arquivo primeiro.
- **Por quê:** pedido do Gabriel, para Claude e N.O.V.A. compartilharem andamento sem perder atualizações.
- **Código do jogo:** nenhuma alteração. `CACHE_NAME` mantido em `v684` (só `.md`).
- **Verificação:** `node --check` OK em todos os JS; HTMLs idênticos.
- **Referência estudada:** [gamedev-skills/awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills). Skills úteis para este projeto: `game-feel` (juice.js), `game-ai` e `ai-behavior-trees-utility-ai` (ai.js), `card-game` e `puzzle` (estrutura de turno, zonas, undo), `save-systems` (migração de localStorage), `game-ui-ux`, `performance`. Não há skill para Canvas 2D puro, networking web ou PWA.
- **Pendências:** nenhuma.

---

## 8. Modelo de entrada do Log (copiar)

```
### AAAA-MM-DD · <Claude | N.O.V.A.> · <título curto>
- **O que:** arquivos e funções alterados (caminho exato)
- **Por quê:** pedido do Gabriel / bug / melhoria
- **CACHE_NAME:** vNNN → vNNN+1
- **Verificação:** como foi testado (node --check, partida vs IA, P2P…)
- **Pendências / avisos para o outro agente:**
```
