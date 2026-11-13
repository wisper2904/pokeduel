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
| `CACHE_NAME` (sw.js) | `pokeduel-pwa-v740` |
| Versão "de marketing" | inconsistente (ver §6): README diz v5.6.0, `app.js` loga v6.3.0, IA é v5.9.0 |
| Sintaxe JS | ✅ todos os 12 arquivos + `sw.js` passam em `node --check` (2026-11-11) |
| HTMLs sincronizados | ✅ `index.html` == `PokeDuel-Web-v5.6.0.html` (1.838 linhas) |
| Figuras no `FIGURES_DB` | **600** (272 originais + 328 oficiais do Pokémon Duel, índices 272–599, id `duel<Nº>`) |
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
peerjs → i18n → sprites → figures → official_disks → bots → audio → board → battle → p2p_matchmaker → ui → juice → ai → abilities → app
```
Ordem completa hoje (fim da lista): `… duel_extras → slice_effects → plates_all → arena3d → duel_screens → deck_screen → shop_screen → icons → settings_screen → battle_scene → friends_screen` (v728).
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

- [ ] Versões inconsistentes (README v5.6.0 · app.js v6.3.0 · ai v5.9.1 · cache v712). Definir uma fonte única (ex.: `const APP_VERSION` em `app.js`).
- [ ] Cadeias de monkey-patch (§4) dificultam manutenção; consolidar aos poucos, uma função por vez, com teste manual.
- [ ] `index.html` duplicado em `PokeDuel-Web-v5.6.0.html`: avaliar virar redirect para eliminar risco de dessincronia.
- [ ] `initAITacticalPlates` passa do limite 6◆ quando libera Double Chance/Mega (4 plates = 6◆ + extras).
- [ ] **Dois deploys por push**: rodam o workflow `Deploy PokeDuel to GitHub Pages` (`.github/workflows/deploy-pages.yml`) e o automático `pages build and deployment`. Eles competem e às vezes um falha (76f3f3a: falha no passo Deploy; e8fc86d: startup_failure), o que gera e-mail de erro. Resolver em Settings → Pages → Source: escolher **GitHub Actions** (aí o automático para) — ou, se ficar "Deploy from a branch", apagar o workflow.
- [ ] 42 figuras do `FIGURES_DB` sem arte nem roleta oficial porque nunca existiram no Pokémon Duel (Kabutops, Starmie, Staryu, Lopunny, Ditto, Jirachi, Togekiss, Porygon…): mantêm sprite e roleta antigos. Lapras, Popplio, Poliwrath e Tentacruel têm arte oficial, mas a roleta da Bulbapedia está incompleta (não soma 96) → roleta antiga mantida. Pré-existente: 6 roletas que não somam 96 (Lapras, Kabutops, Mega Starmie, Mega Lopunny, Palkia/Dialga Origin).
- [ ] Efeito roxo `none` (40 fatias): efeitos especiais do jogo original ainda não implementados (marcadores, MP −2, mover a si mesmo etc.) — vencem o duelo sem nocautear. Texto original em `effectText`.
- [ ] 42 figuras oficiais da Library ficaram de fora: 27 sem imagem correspondente na categoria e 15 com roleta incompleta na Bulbapedia.
- [ ] Habilidades oficiais: das 448 com texto, só ~110 têm alguma mecânica simulada (`fx` em `js/engine/abilities.js`); o resto é texto (efeitos com marcadores, condições, Ultra Space, troca de posição etc.). Fatias Brancas/Douradas com efeito: 170 de 476 simuladas (`OFFICIAL_DUEL_SLICE_FX`). 40 fatias roxas com efeito `none`.
- [ ] Travessia seletiva ("atravessa suas peças e as do tipo X") não simulada; só travessia total.
- [x] **Sprites trocadas em `assets/sprites/`** (achado no QA de 2026-11-12; o Gabriel vai mandar as certas): `oddish.webp`=Victini, `gloom.webp`=Serperior, `persian.webp`=Samurott, `machoke.webp`=Chandelure, `dodrio.webp`=Terrakion, `cubone.webp`=Virizion, `porygon.webp`=Kyurem. → **resolvido na v726**.
- [ ] Arte de aura cortada na borda da imagem: Entei, Ho-Oh e Shiny Ho-Oh (`assets/figures_duel/`).
- [ ] `tools/i18n/build.py`, citado no README de `tools/i18n/` e no handoff, **não existe no repo**. Até recriar, edite o `js/data/i18n_dict.js` à mão e o lote `tools/i18n/tr/*.txt` junto, para não divergirem.
- [ ] O tabuleiro em celular deitado (modo mobile) estica na horizontal. O Hub foi corrigido na v725; a partida não.
- [ ] Não há testes automatizados de regra no repositório (os testes de v701 rodaram fora, via Playwright/Node em /home/claude/ux) (`evaluateCombat` é pura e fácil de testar com Node).

---

## 7. Log de alterações (mais recente no topo)

### 2026-11-13 · Claude · Barra de times da aba Deck arrumada (v740)
- Antes: os times, o ＋, o ✏️ e o ⚡ Auto ficavam numa linha com rolagem horizontal, e o botão Auto ia para a lateral.
- Agora: grade fixa de 3 posições (Time #1, #2, #3). Se houver menos de 3 times, aparece um botão tracejado "＋ Novo time" na próxima posição; o limite de 3 já era aplicado em `createNewTeamSlot` (ui.js). Renomear e Auto ficam numa linha de dois botões embaixo. Sem rolagem horizontal.
- `js/ui/deck_screen.js`: CSS `.dk-teams` (grid), `.dk-team.new/.ghost`, `.dk-tools`, `.dk-tool`; handler do "Novo time" protegido com `if (nt)` (com 3 times o botão não existe e o erro quebrava a renderização dos botões seguintes).
- Nenhum texto novo: reutiliza `dk.new_team` e `dk.rename`.
- Testado em Playwright com 1, 2 e 3 times (sem erros de página).

### 2026-11-13 · Claude · Pesquisa do sistema ao segurar imagem/figura no celular (v739)
- Sintoma: segurar uma figura ou imagem abria a tela de pesquisa do sistema (Pesquisar/Lente) como se fosse uma página.
- Causa: o CSS só tinha `user-select:none`; faltavam `-webkit-touch-callout`, `-webkit-user-drag` e o bloqueio do menu de contexto/arrastar em imagens e canvas.
- `css/style.css`: `-webkit-touch-callout:none` global, `-webkit-user-drag:none` em img/canvas/svg; campos de texto (input/textarea/contenteditable) continuam selecionáveis.
- `js/ui/icons.js`: captura de `contextmenu`, `selectstart` e `dragstart` (em IMG) fora de campos editáveis. Não cria arquivo novo, então sem mudança no `CORE_ASSETS`.
- Não testado em aparelho real; validar no celular (Android Chrome e iOS Safari).

### 2026-11-13 · Claude · Pokébola do canto do Início removida (v738)
- A pokébola preta no canto inferior direito do palco (`cycleCenterpieceFigurine`, `#home-black-pokeball-img`) saiu dos 2 HTMLs. Para trocar o Pokémon do centro: tocar num Pokémon do time no palco (já funcionava). A função `cycleCenterpieceFigurine` continua em `ui.js`, sem botão.

### 2026-11-13 · Claude · Início: só a peça, centralizada (v737)
- Pedido: tirar o modo "Pedestal 3D" e deixar só a peça, que estava alta e fora do centro.
- Botão `#home-pedestal-toggle-btn` removido dos 2 HTMLs; `homeCenterpieceShowPedestal = false` fixo em `ui.js` (a preferência antiga `pokeduel_show_pedestal` é ignorada; `toggleHomePedestalMode` continua existindo, sem botão).
- Peça do meio: `pdrSpriteContentBox(img)` mede a caixa da figura de verdade dentro da imagem (as imagens têm margens diferentes, cache em `WeakMap`). A figura é desenhada centrada nessa caixa, com altura até 42% e largura até 46% do canvas, e a base encosta no anel em `H*0.66` (no chão do palco; antes ficava no céu). O toque para abrir a info usa a área desenhada (`window.__pdrHubCenterRect`).

### 2026-11-13 · Claude · Vitrine do Início abre o painel de info novo (v736)
- Bug: tocar no Pokémon do pedestal (vitrine do Início) abria o painel antigo `#figure-details-modal`. Também abriam o antigo: lista do buff da semana e listas legadas de `ui.js`.
- `arena3d.js`: `openFigureDetailsModal` agora é redirecionado para `pdrOpenFigureInfo(idx, "Voltar")` (o painel novo, mesmo do Deck/Loja/partida). O antigo fica em `window.openLegacyFigureDetailsModal` e só é usado se o novo não carregar.

### 2026-11-13 · Claude · Chaves do Locked Booster salvas + painel de info com roleta/Voltar certos (v735)
- **Chaves voltavam a 0 ao reabrir o jogo**: `playerKeyFragments` nunca era salvo. Agora vai em `pdr_economy_v470` como `keyFragments` (`saveEconomyAndUpgrades` / `loadEconomyAndUpgrades` em `ui.js`, atualiza `#key-frag-lbl`) e é salvo quando muda: vitória/derrota (`ui.js` e `board.js`), abrir o Locked Booster e a devolução ao desistir (`ai.js`).
- **Painel de informações sem roleta e com Voltar quebrado**: `duel_screens.js renderData` usava estado global `F` e `getElementById("ds-wheel"/"ds-back")`. Com o painel aberto na aba Deck (escondido) e outro aberto por cima (Loja, segurar na partida), a roleta era desenhada no escondido e o Voltar do painel da frente não fazia nada. Agora cada painel só-leitura guarda o próprio estado em `root.__dsRO` (`showDataReadOnly`) e procura seus elementos dentro de `root`. A Fusão continua usando `F` (modo completo).

### 2026-11-13 · Claude · Deck sem arrastar e time não acompanha a rolagem (v734)
- Bug relatado: no celular, segurar um Pokémon no Deck iniciava o arrasto e ao mesmo tempo abria o menu do navegador de salvar imagem; a figura "fantasma" ficava presa na tela. Pedido: tirar o arrastar.
- `deck_screen.js`: `bindDrag`/`startDrag`/`moveGhost`/`endDrag` saíram. `bindPress`: toque = menu Info/Usar (coleção) ou equipar/info (slot), como antes; **segurar 480 ms = abre as informações** (`openInfo`). Mover o dedo > 10 px cancela (é rolagem). `contextmenu`/`dragstart` bloqueados nas figuras do Deck e CSS `-webkit-touch-callout:none; user-select:none; -webkit-user-drag:none`. Dica "Segure para ver as informações". `swapSlots` continua exportado em `PDRDeckScreen`.
- `.dk-top` (time + limites) deixou de ser `position:sticky`: rola junto com a página, fica lá em cima.

### 2026-11-13 · Claude · Vitória em Missão travava a partida (v733)
- Bug relatado: vencer uma Missão cercando o Gol mostrava "VITÓRIA" e travava até o tempo acabar. Causa real: **toda vitória em Missão** quebrava — a recompensa fazia `userGems += …` (variável inexistente) em `p2p_matchmaker.js` (CASE C: QUEST) e a tela de resultado nunca abria. Derrota/tempo esgotado não passa pela recompensa, por isso "funcionava" quando o tempo acabava. Agora soma em `state.rareMetals` (as gemas).
- `ai.js showWinResultScreen` (o envoltório mais externo das telas de resultado) agora marca `isMatchActive = false` e `matchFinished = true` para qualquer modo. Antes o `showWinResultScreen` do `ui.js` substituía o base por completo e ninguém marcava: o relógio continuava correndo atrás da tela de resultado e, ao zerar, a vitória "acontecia de novo".
- `startLocalPassAndPlayMatch` (2P no mesmo celular) passa a marcar a partida como ativa e reinicia os relógios, como Liga/P2P (senão ficaria com relógio parado e Z bloqueado depois de uma partida encerrada).

### 2026-11-13 · Claude · Z-Move não liga mais ao tocar na carta da plate (v732)
- Bug relatado: "na Double Chance às vezes ativa o Z-Move sem perguntar". Causa: com o Z em 100%, `renderPlatesTray` (board.js) colocava a faixa clicável "⚡ Z-MOVE 100%: TOQUE PARA ATIVAR" dentro da descrição da plate selecionada (a carta grande do `plates_all.js` copia esse HTML). Tocar na carta abria o seletor do Z por baixo do dedo e o 2º toque caía no "Sim".
- Correção: a descrição da carta é só o texto da plate (`textContent`); o Z continua no botão "Poder Z" da partida. Testado: Double Chance com Re-Girar/Manter e Z carregado não dispara Z (8/8), e toques na carta não abrem o seletor.

### 2026-11-13 · Claude · Loja abre o painel de informações novo (v731)
- Bug: tocar num Pokémon da Loja abria o painel antigo (`openFigureDetailsModal` / `#figure-details-modal`). Agora abre o mesmo painel do Deck/partida.
- `arena3d.js`: o overlay `#pd-unit-info` virou `window.pdrOpenFigureInfo(idx, backLabel)` (retorna `false` se `PDRDuelScreens` não carregou); `openUnitInfo` (segurar na partida) usa ela. `shop_screen.js` chama `pdrOpenFigureInfo(idx, "Loja")` e só cai no painel antigo se o novo não existir.
- O painel antigo continua existindo (tem os botões de upgrade de roleta) e ainda é chamado pelo deck legado em `ui.js` (substituído pelo `deck_screen.js`).

### 2026-11-13 · Claude · Janela de perfil repaginada (v730)
- `#player-profile-modal` (2 HTMLs) reescrito com classes `.pp-*` (fim de `css/style.css`), **mesmos ids** que `ui.js` preenche: topo com foto grande (`profile_avatar.png`), nome, título em pílula e ID com botão Copiar (`window.pdrCopyTrainerId`); faixa da liga com barra de progresso até a próxima liga (`#pp-tier-fill`, `#pp-tier-next`, limites 1500/1900/2300/2700 de `getTierForRating`); 6 quadros de estatística; chips de coleção e chaves; conquistas; "Editar perfil" recolhido (nome, título, pedestal, Pokémon em destaque, Zerar, Salvar); conta na nuvem compacta.
- Saiu o seletor "Visual do Avatar" (`#prof-hair-select`), que não mudava nada na tela (o código que lia já checava se existe).
- IIFE no fim de `ui.js` envolve `syncIndividualProfileUI`/`openPlayerProfileModal` para pintar a barra. A frase "Faltam N pts…" é montada por idioma com `data-noi18n` (o tradutor genérico embaralhava "Leader League").
- 20 textos novos em `900_manual.txt` e `i18n_dict.js`.

### 2026-11-13 · Claude · Foto do perfil no placar da partida (v729)
- `arena3d.js avatar()`: os retratos ao lado do relógio usam `assets/ui/profile_avatar.png` (o mesmo boneco da tela de perfil), cortado para caber e com borda azul (você) / vermelha (rival, espelhado). O boneco desenhado por código só aparece se a imagem não carregar. Imagem adicionada ao `CORE_ASSETS`. Perfil não mudou (pedido do Gabriel).

### 2026-11-13 · Claude · Amigos e convite no Multijogador P2P (v728)
- Desenho e plano: `docs/superpowers/specs/2026-11-13-amigos-p2p-design.md` e `docs/superpowers/plans/2026-11-13-amigos-p2p.md`.
- **Novo `js/ui/friends_screen.js`** (último script; também em `CORE_ASSETS`). Três partes:
  - `window.PDRFriends`: lista em `localStorage` `pdr_friends_v728` = `{friends, outgoing, incoming}`; identidade = `trainerId` (`NNN-NNN-NNN`). `outgoing` expira em 24 h. Vai junto no save na nuvem (que copia o `localStorage` inteiro).
  - `window.PDRFriendsNet`: pacotes pelo **Salão** (mesmo tópico MQTT + `BroadcastChannel("pokeduel_v600_salao")`): `FRIEND_REQUEST`, `FRIEND_ACCEPT`, `FRIEND_DECLINE`, `FRIEND_REMOVE`, `FRIEND_INVITE {roomCode}`, `FRIEND_INVITE_REPLY {accept|decline|busy|cancel}`. Ignora eco (`fromTrainerId` = meu), `toTrainerId` ≠ meu, IDs inválidos e `nonce` repetido. Aceite feito com o outro offline fica `confirmed:false` e é reenviado quando ele aparece online. Convite usa `createIntuitiveP2PRoom()` / `joinIntuitiveP2PRoom()` sem mudar o protocolo da sala; expira em 45 s; em partida responde `busy` sem pop-up.
  - `window.PDRFriendsUI.render()`: seção Amigos em `#pdr-friends-root` (pedidos, amigos online primeiro com Convidar, offline com "visto há", painel Adicionar com campo de ID e "Online agora no Salão"). Botão "Adicionar X como amigo" na tela de resultado de partida online (`#win-add-friend-btn`).
- **`p2p_matchmaker.js`**: `salaoKnownTrainers` guarda `trainerId`; `window.pdrSalaoOnlineByTrainerId(id)`; `ensureSalaoBroadcastChannel()` chamado em `connectToGlobalSalao`; `joinIntuitiveP2PRoom` desiste em 15 s sem `P2P_START` ("SALA [ código ] NÃO ENCONTRADA").
- **Aba P2P (2 HTMLs)**: cabeçalho novo; faixa `#p2p-status-banner` só aparece quando o status não é OFFLINE; sala por código recolhida em `<details id="p2p-code-card">` (mesmos ids); 2P local compacto; saiu a linha de botões "Multiplayer P2P / Quests / HD" (o `#pixel-mode-btn` era id duplicado e continua em Configurações). CSS `.pf-*` no fim de `css/style.css`.
- Textos: 55 entradas novas em `tools/i18n/tr/900_manual.txt` e no fim de `js/data/i18n_dict.js` (à mão; `build.py` não existe).
- Limitações conhecidas: tudo exige os dois online ao mesmo tempo (sem servidor); o `trainerId` pode ser forjado por quem ler o tópico público (mesmo nível de confiança do matchmaking atual).
- Testes Playwright fora do repo (scratchpad `qa/friends/t1…t6`): 13 + 7 + 18 + 19 + 32 + 10 verificações.

### 2026-11-13 · Claude · Acabamento das 7 figuras montadas (v727)
- `assets/sprites/{oddish,gloom,persian,machoke,dodrio,cubone,porygon}.webp` refeitos para casar com as figuras originais: base de cobre limpa (aro real do `metapod.webp` + tampo redesenhado na cor medida em caterpie/weedle, sem os riscos brancos da base do ninjask), figura maior e apoiada no centro do tampo, sombra de contato com a forma da figura, luz de cima/esquerda com a parte de baixo mais escura e cores menos chapadas (cara de figura de plástico fotografada). 116×110, script fora do repo.

### 2026-11-13 · Claude · 7 sprites trocados corrigidos (v726)
- `assets/sprites/{oddish,gloom,persian,machoke,dodrio,cubone,porygon}.webp` mostravam outros Pokémon desde o commit inicial (item do §6). Esses 7 nunca tiveram figura no Pokémon Duel: a categoria "Pokémon Duel figures" do Bulbagarden tem 652 arquivos e nenhum deles.
- Montados novos: render oficial do Pokémon HOME (PokeAPI/sprites, `sprites/pokemon/other/home/{dex}.png`) em cima da base de cobre extraída de `ninjask.webp`, com sombra de contato, 116×110 como os demais. Script fora do repo.

### 2026-11-12 · Claude · Correções do QA (v725)
- **Z-Move**: `#ds-z-modal` fecha ao reiniciar a partida (`demoFullMatchState`) e quando a tela de resultado aparece (wrapper de `showWinResultScreen` em `duel_screens.js`). Não abre durante o Double Chance, com o Evoluir aberto, com a roleta na tela nem depois do fim da partida (`zPickerBlocked`). O Evoluir fecha o Z antes de abrir. `window.pdrCloseMatchModals()` fecha os dois.
- **Tradução**: `i18n_runtime.js` troca o `\b` das regras do `GLOSS` por limites Unicode (`(?<![\p{L}\p{N}_])` / `(?![\p{L}\p{N}_])`), então "Missões" não vira mais "Falhaões". Thunderbolt PT = "Relâmpago" (`i18n.js`); Noxious Fang = "Presa Tóxica" / "Colmillo Tóxico" (`i18n_dict.js` + `tr/012.txt` id 2183).
- **Som**: `PDRSound.play("tick")` (arquivo inexistente, dava 404) → `"select"` em `arena3d.js` e `"spin_tick"` em `battle_scene.js`.
- **Barra de log do topo** (`board.js drawHDVectorBoardAndChrome`): texto longo diminui a fonte até 7.5px; se ainda não couber, rola. Antes cortava na direita (ex.: título do tutorial).
- **HUD** (`arena3d.js drawHUD`): nomes cortados pela largura (108) com "…" em vez de `slice(0,13)`.
- **Hub em tela deitada e baixa** (< 600 px de altura): classe `pdr-short-land` no `<html>` + `--pdr-dscale` (IIFE no fim de `ui.js`); o `#drawer-modal` é desenhado em 400×600 e reduzido por escala (`css/style.css`, fim do arquivo). Retrato não muda.
- **Cadastro**: sair do tutorial grava `pdr_welcome_pending_v725`; enquanto não houver conta salva, o cadastro reabre ao recarregar. A chave é limpa ao criar a conta ou em `completeWelcomeProfileSetup`.
- **Sobre/Conta/Tour**: tirado o "v5.4.0" do cabeçalho; "306 Figuras/Pokémon" virou `${FIGURES_DB.length}` (dicionário com `{0}`, lotes `tr/006.txt` e `tr/008.txt` atualizados).
- Falso positivo descartado: "Opponent reached your Goal!" aparece traduzido na tela (o robô de QA lia `state.logText` antes da tradução).

### 2026-11-12 · Claude · QA geral (sem mudança de código)
- Teste de estresse com Playwright: ~87 partidas contra a IA (61 com P1 aleatório e 26 com P1 heurístico, com deck de 6 figuras e plates sorteados a cada partida), ~800 figuras sorteadas, ~200 combates, ~66 plates usadas. **0 erros de JS** e 0 violações de estado (unidades duplicadas no mesmo nó, contagem diferente de 6, nó inválido).
- Varredura das 629 sprites (carga, transparência, enquadramento) e dos dados das roletas (soma 96, cores, dano e ★): sem erro de dados. Bugs encontrados registrados em §6.

### 2026-11-12 · Claude · Ícones das abas de baixo limpos (v724)
- Os `assets/ui/tab_*.png` (recortes de captura do original) traziam o fundo azul quadrado e pedaços do texto em inglês cortados embaixo. Versões limpas em `assets/ui/tabs/` (texto cortado, fundo transparente por preenchimento a partir da borda; engrenagem por saturação). `sprites.js HOME_V380_UI_ASSETS` aponta para elas. Originais mantidos.

### 2026-11-12 · Claude · Caixa preta também no botão "Prêmio Diário" do Início (v723)
- `shop_screen.js`: o atalho do Início (Prêmio Diário) usa `assets/ui/boosters/black.png` no lugar do 🎁.

### 2026-11-12 · Claude · Sprites do cofre e da recompensa diária (v722)
- Início: o Locked Booster usa `assets/ui/boosters/locked.png` (sprite do Gabriel), com fita vermelha e contador de chaves em HTML (`.lk-ribbon`, `.lk-keys`, sempre visível) nos 2 HTMLs; `ui.js` não troca mais a imagem (`locked_booster_top` saiu do `initHomeV380Assets`).
- Loja: a Recompensa Diária mostra `assets/ui/boosters/black.png` (caixa preta) no lugar do emoji 🎁 (`shop_screen.js`).

### 2026-11-12 · Claude · Cúpulas do P.C. menores (v721)
- `arena3d.js`: cúpula `DW/DH` 19,5/58 → 14,5/42; figura dentro 0,82 → 0,62; pods mais juntos (oponente x 62/94, você x 272/305).

### 2026-11-12 · Claude · Botão "Cartas" removido da barra de baixo (v720)
- `board.js`: com `window.PDR_ARENA3D` o botão "🎴 Cartas" não é desenhado e o toque nessa área não abre mais a bandeja. As plates abrem pela carta do canto (arena3d.js).

### 2026-11-12 · Claude · Arena refeita pelo layout das capturas do original (v719)
- Gabriel mandou 6 capturas do Pokémon Duel e disse que a v718 ficou pior (mesa inclinada, P.C. e plates fora do lugar). `js/engine/arena3d.js` reescrito:
  - **Tabuleiro plano** (sem homografia; `PDRArena.P` é identidade e `depthScale` = 1). Chão de cristal em tela cheia (faces claras/escuras, arestas com luz, reflexos iridescentes); temas: crystal = cristal escuro, habitats = cristal de gelo, stone = magma, banana = ouro, marble, wood.
  - Posições medidas nas capturas (415×739 → 353×530): nós num retângulo x 38–314; banco de cima (y 123/141) e de baixo (y 389/414) com anéis brancos; P.C. = 2 cúpulas verdes (oponente x 58/99 base 146, você x 266/312 base 397); monte de plates do oponente atrás das cúpulas, sua carta em (304, 449) com cantos amarelos; máquinas com pokébola (sua azul embaixo à esquerda, do oponente laranja em cima à direita) com o contador da Ultra Space; barras em y 158/367, amarela do lado de quem joga.
  - Gols: círculo cheio azul ▷ (seu) / laranja ◁ (oponente) com onda; Entradas ◎. HUD: painéis azul/vermelho, avatar, nome, faixa (sequência de vitórias ou ★ rating), tempo, TURN.

### 2026-11-12 · Claude · Arena 3D, cena de batalha, Z-Move, MP do bônus semanal, segurar = Dados (v718)
- **Novo `js/engine/arena3d.js`** (depois de `plates_all.js`). Substitui `drawFullTabletopFrame` (não usa mais a imagem de fundo).
  - Homografia: retângulo lógico y 95–455 → trapézio. **As coordenadas de `BOARD_NODES`, `P2_BENCH_COORDS`, `BENCH_SLOTS_P1`, `REVIVER_PODS_P1/P2` são projetadas no lugar uma vez** (os mesmos arrays) → desenho, toque e partículas batem. `PDRArena.depthScale(y)` encolhe as peças ao fundo.
  - Layout do original: P.C. do oponente em cima à direita, o seu embaixo à direita ao lado do banco (cúpulas verdes redondas com líquido, bolhas, varredura, anel de luz); monte de plates do oponente em cima à esquerda (×N) e o seu embaixo à direita (toque abre as cartas); ULTRA em `window.PDR_ULTRA_POS`.
  - Mesa de mármore procedural por "Tema da arena" (crystal = mármore escuro, marble = branco, banana = ônix dourado, wood, stone, habitats), borda dourada, espessura, reflexo de luz passando, reflexo das peças, brilho dos Gols/Entradas no chão; fundo de cristal com feixes e poeira de luz; pulsos de energia nas linhas; Entradas com anel girando; Gols com feixe e partículas.
  - HUD do topo redesenhado (painéis azul/vermelho, avatar, nome, escudo de nível, tempo, TURN). `board.js`: partes antigas (nomes, caixas de relógio, cápsulas, anéis, linhas, nós, máscaras da imagem) ficam em `if (!window.PDR_ARENA3D)`; a contagem do relógio continua lá.
  - Segurar 480 ms numa peça abre a página de Dados (`PDRDuelScreens.showDataReadOnly`, overlay `#pd-unit-info`). `showCornerFigureCard` desligado (pedido do Gabriel).
- **Novo `js/ui/battle_scene.js`** (depois de `settings_screen.js`): depois da roleta (450 ms), cena de batalha de ~2,6 s — chão de mármore, seu Pokémon na frente/anel azul, oponente ao fundo/anel vermelho, faixas diagonais com golpe e valor, avanço, choque (flash, faíscas, tremor), vencedor empurra; empate rebate os dois; botão Pular. `battle.js` passa `atkUnit, defUnit, atkChosen, defChosen` para `Juice.onImpact`; `duel_screens.js` chama `PDRBattleScene.play` (a tela da roleta espera `PDRBattleScene.MS` a mais).
- **Bug Z-Move**: o painel abria no `pointerdown` e o `click` do mesmo toque fechava (só abria segurando). Agora o fundo só fecha se o toque começou nele (`duel_screens.js`).
- **Bug MP no P2P**: o tipo bônus semanal (+1 MP, +10 dano) era sorteado com `Math.random` em cada aparelho → cada jogador via MP diferente. `figures.js getWeeklyBuffState`: calendário fixo (semana desde 05/01/2026 UTC, tipo por hash, sem repetir o anterior), igual para todos.

### 2026-11-12 · Claude · Tela de Configurações refeita (v717)
- **Novo `js/ui/settings_screen.js`** (depois de `icons.js`; nos 2 HTMLs e no `sw.js`). Monta `#st-root` dentro de `#dtab-menu` quando a aba abre (wrapper de `switchDrawerTab`).
  - Abas: Áudio (música on/off, fonte Web Audio/YouTube, sons on/off + volume, vibração) · Vídeo (qualidade 8-Bit/16-Bit/Suave, efeitos, tremor, formato Automático/Celular/PC, tema da arena em 6 blocos) · Jogo (idioma, tutorial, tour, P2P, 2 jogadores, hotéis da campanha, personalizar sprites) · Conta (perfil, Save na Nuvem) · Sobre (banner, versão, notas, atualizar, sair).
  - **Os controles antigos continuam no DOM, escondidos em `#st-legacy`**: as linhas novas clicam neles ou chamam as mesmas funções (`toggleWebAudioBgm`, `cyclePixelArtMode`, `cycleDeviceLayoutMode`, `selectArenaThemeFromMenu`, `PDRSound`, `Juice.cfg`…). Blocos movidos inteiros (mesmos ids): `#cfg-cross-save-pwa-card`, `#msec-quests`, `#cfg-banana-logo-banner`, `<details>` de `#live-sprite-target`. Card novo injetado no menu depois → vai para o legado.
  - Aba lembrada em `localStorage.pdr_settings_tab`. Trocar idioma remonta a tela. `window.PDRSettings {render, open(tab), refresh}`.
- i18n: 61 linhas em `900_manual.txt`.

### 2026-11-12 · Claude · Ícones oficiais do Bulbagarden (v716)
- Gabriel baixou pelo Chrome um .zip com 47 arquivos de `archives.bulbagarden.net` (Category:Pokémon Duel + rarity icons). Recortados e reduzidos (PIL).
- `assets/plates/icons/` — ícone por categoria, como no original: `movement` (roxo), `spin` (azul), `recovery` (rosa e curas), `pokemon` (dourado), `plates` (verde), `battle20/30/50` (vermelho: 30 = X Attack/Overdrive/Soul Dew, 50 = Desperate Times), `card`. `plates_all.js` → `iconOf(p)`, grava `p.icon` e `BANANA_PLATE_SPRITES[id]` (inclusive das 9 antigas).
- `assets/plates/rarity/{c,uc,r,ex}.png` (raridade das cartas de plate); `assets/ui/rarity/{c,uc,r,ex,ux}.png` (raridade das figuras: .ds-rar e campos #…-rarity).
- `assets/ui/icons/`: coin, gem, material, carmonite (+_pedestal), raremetal/cube/ingot (+ _c/_uc/_r/_ex/_ux), booster/ai/6-pack tickets, `mp0`–`mp3` ("MP n" com n ≤ 3 vira o ícone oficial com o número).
- Removidos: fundos de cor e raridades do Serebii, SVGs próprios de Carmonite/Material/MP.

### 2026-11-12 · Claude · Todas as 152 Plates do original + cartas no formato do jogo + sprites de moedas/materiais/raridade/MP (v715)
- **Novo `js/engine/plates_all.js`** (depois de `slice_effects.js`; nos 2 HTMLs e no `sw.js`). Lista oficial do Serebii (152 plates): marca as 41 que já existiam com `off` (ID oficial), `color`, `ocost` e raridade oficial, e adiciona as **112 que faltavam** (`window.PDRPlatesAll.D`).
  - Simples: Bright Powder, Clear Wait, Swap Spot (2 toques), No Guard, Quick Care, Priority Recovery, Ballast, 6 curas (Awakening, Paralyz/Confuse/Ice/Burn Heal, Antidote), Invisibility Cape, Power Battle, Switcheroo, Force Remove, Counter Attack.
  - Genesect: 4 Drive EX (gira de novo + exclui tipos), Golden Module. Energy: Cosmo (troca Deoxys antes da batalha em `triggerCombat`), Land's (Land's Wrath gira pelos rivais), Mud (+1 Espera).
  - Assinaturas: Overdrive, Long Barrel (`slice_effects.js` Rock Wrecker usa `PDRPlatesAll.rockRange`), Fertilizer, Sticky Grass, Poison Blade, Eon Flute, Metal Coat (evolui Onix/Scyther, anula Habilidades do rival na batalha), DNA Splicers, 5 Rotom (forma + tipo global 9 turnos via `abilityUnitTypes`), Gracidea, Meteoric Teachings, Blue/Red Orb, Soul Dew, Necroizer, Ultra Burst (4 turnos), Restorer, Reveal Glass (sem forma Therian no DB: +20 de dano).
  - 32 Mega Stones (sem forma no DB: Kangaskhan/Metagross/Steelix → Poder Mega 7 turnos). 16 itens de tipo (+20 no campo). 16 Spheres (`u._paSph`, Frost Sphere anula a ≤3 passos, Sphere Trick copia).
  - Estado: `state.__pa {turn, duel, rotom, eon, drivex, battle}` + marcas `_pa*` na peça. P2P: `P2P_PLATE3`. Giros extras com RNG semeado (determinístico).
  - **Limite de custo 6 ◆** (regra do original): deck salvo acima do limite é cortado ao carregar (padrão vira Hurdle+Double+X Attack+Goal Block); modal bloqueia adicionar acima do custo.
  - Bot: ganha 2 plates que combinam com o deck (Mega Stone da espécie, item do tipo mais comum, Clear Wait/curas) e usa por pontuação (`triggerPlayerAIMove`).
- **Cartas no formato do original** (`window.PDRPlateCard`): carta preta recortada, ícone no canto, raridade ao lado, nome na cor da plate, barra de custo em 6 segmentos, ✓ no deck. Tela "Editar Plates" (`deck_screen.js`): 6 slots + "X/6 Custo", catálogo 5 colunas, filtro de custo 1–6/TODAS. Na partida (`#plates-tray.pk-tray`): fileira de cartas embaixo, carta escolhida aberta grande com a descrição, Usar / ✕.
- **Novo `js/ui/icons.js`** (depois de `shop_screen.js`): troca 🪙 🔻/💎 🟦 🔷/🧱 🟣 🟩 e "MP n" por ícones; raridade (.ds-rar e #fcc/#fdet/#pcard/#pldet-rarity) com os ícones oficiais.
- Assets: `assets/plates/plate{purple,gold,green,pink,red,blue}.png` + `c/uc/r/ex/ux.png` e `assets/ui/icons/` (coin, gem, raremetal, cube, ingot, tickets do Serebii; carmonite/material/mp em SVG próprio; trocados pelos oficiais na v716).
- i18n: 248 linhas novas em `tools/i18n/tr/900_manual.txt` (nomes PT/ES, descrições EN/ES, mensagens).
- Testes: efeitos (`/tmp/pa.py`, `/tmp/pb.py`), wheels 7.548 / 0 problemas, evo, 3 partidas bot × bot, sfx713/ext712/abt sem erro; telas PT/EN/ES conferidas.

### 2026-11-12 · Claude · Jogo inteiro em PT / EN / ES — tradutor central + dicionário de 3.731 entradas (v714)
- **Novo `js/data/i18n_runtime.js`** (depois de `i18n.js` e do novo `js/data/i18n_dict.js`, nos 2 HTMLs e no `sw.js`).
  - `L(texto)` traduz qualquer texto conhecido para a língua atual. Ponto único de aplicação: DOM (MutationObserver em texto + `title/placeholder/alt/aria-label`), canvas (`fillText/strokeText/measureText`), `alert/confirm/prompt`, `t()` (inclusive chave inexistente → texto de reserva), `localizeAbility`, `localizeMove`.
  - Textos com partes variáveis: modelos `{0}`; compostos ("A: B", " · ", " — ", " + ", parênteses/colchetes, "Golpe 90", "Golpe*", prefixo de emoji) são traduzidos por partes. Glossário final por língua (DMG/DANO/DAÑO, MP→PM no ES, Lv→Nv., Miss, Entry Point, Plate, Z-Move).
  - Troca de língua re-traduz a tela (`setAppLanguage` embrulhado). Cada aparelho no P2P vê a sua língua.
- **`js/data/i18n_dict.js`** (gerado; ~700 KB, ~150 KB gzip): `[pt, en, es, original?]` × 3.731. Cobre logs e telas de todos os módulos, as 349 Habilidades oficiais (nome + texto), 515 textos de Habilidade das figuras originais, 175 efeitos de fatia, ~450 efeitos de Movimento Z / golpes brancos (`OFFICIAL_DUEL_EXTRA`), 277 golpes sem tradução antes, nomes com forma (Alola, Origem, Kyurem Negro, Rotom…), changelog, tutorial, bots.
- **`tools/i18n/`**: `extract.js` (acorn: literais, templates, concatenações, atributos em HTML montado no JS), `ordered.json` (IDs estáveis), lotes `tr/0NN.txt` (`id|pt|en|es`), `tr/900_manual.txt` (`@original|pt|en|es`), `build.py`, `crawl.py` + `detect.py` (varredura de telas e partida nas 3 línguas). Ver `tools/i18n/README.md`. **Texto novo no jogo → linha em `tr/900_manual.txt` + `python3 tools/i18n/build.py`.**
- Glossário: PT Falha/Esquiva/Gol/Ponto de Entrada/Banco/Espera/Placa/Movimento Z/Apoio(Tag) · ES Fallo/Esquiva/Meta/Punto de entrada/Banquillo/Espera/Placa/Movimiento Z/Apoyo/PM.
- Verificação: varredura de ~1.480 textos visíveis por língua (abas, modais, Dados, Fusão, Loja, partida bot × bot) sem texto na língua errada (sobram só nomes próprios, nomes de arquivo e nomes de usuário); wheels 7.548 / 0 problemas; evo; `/tmp/sfx713.py`; lotes antigos; 2 partidas bot × bot sem erro.

### 2026-11-12 · Claude · Fatias Roxas "sem efeito" + marcadores MP + Trick Room + Ultra Stack completo (v713)
- **Novo `js/engine/slice_effects.js`** (depois de `duel_extras.js`; no `sw.js` e nos 2 HTMLs).
  - Marcadores: `_mpMk` (MP −1, máx −2; aplicado depois do Trick Room em `getEffectiveUnitMp`, mínimo 0), `_finalSong` (KO 5 turnos depois), `_pumpkin` (outros atravessam), `_imprison` (aquela fatia vira Miss). `window.PDRSlice {mpMarker, clearMarkers, hasMarker}`.
  - Tag agora remove marcadores (`duel_extras.js`: `tagTargets`/`doTag`). Sair do campo limpa tudo (wrapper de `endTurn`).
  - Trick Room: `state.__sfx713.trick = {end, owner}` (turnCounter decresce); Dourado → Miss na roleta e na batalha; MP ≥3 → 1, ≤1 → 3. Ultra Stack (523): duração e dano de aura ×(X+1).
  - King Spike (561) Dourado→Branco / Barbed Horns (537) Dourado→Miss para quem tem `_mpMk`.
  - Z-Move: `battle.js` consulta `window.PDRSliceZExempt(defUnit)` antes do Z-Break (Azuis de Aço do dono de um Stakataka que ainda não batalhou).
  - 37 fatias implementadas (106 ocorrências): Fly/Fly Away, Teleport/Rainbow Wing, Dig, Push Away, Overhead Toss, Flame Kinesis, Draining Wind, String Wrap, Glaciate/Icy Wind, Taunt, Energy Ball/Acid Spray, Baby-Doll Eyes, Leer, Imprison, Torment, Fake Sleep, Future Sight, Explosion, Cyclone Kick, Rock Wrecker, Swinging Throw, Fissure, Mind Blown, Belly Drum, Fairy/Dark Mist, Synthesis, Tailwind, Trick-or-Treat, Trick Room, Smack Down, Plate Gnawing, Nasty Plot, Sphere Trick (copia plates X do oponente), Mystery Scent, Dark Moon, Magic Coat.
  - Casas escolhidas automaticamente e de forma determinística (perto do Goal adversário, nunca num Goal) → igual nos dois aparelhos no P2P. RNG semeado por turnCounter+uids.
  - Tipos que vinham como ícone vazio no texto: Glaciate/Icy Wind = Aço, Fissure = Voador, Tailwind = Voador, Synthesis = Planta, Fairy/Dark Mist = Fada/Sombrio.
- Testes: `/tmp/sfx713.py` (15 checagens), wheels 7.548 / 0 problemas, evo, 3 partidas bot × bot, lotes antigos sem erro.

### 2026-11-12 · Claude · Últimas habilidades + plates do original + Tag + Charge + bot usa habilidades (v712)
- **Novo `js/engine/duel_extras.js`** (depois de `plates_extra.js`).
  - **Tag** (tagging do original, via Bulbapedia/pokemon.com): botão "💚 Tag" (`#tag-act-btn`), antes de mover ou no lugar do ataque depois de mover.
    - Cura as condições de um aliado vizinho e termina o turno. P2P: `P2P_TAG`.
    - Bloqueios: Barbed Horns (537), King Spike (561); Permafrost (447) segura o congelamento a até 2 passos.
    - Soul-Heart (352) também remove marcadores.
  - **Charge marker:** Thunder/Flame/Ice Charge dão `_charge`. Soar (269/271/274) com Charge: +1 MP e +30.
    - Solta pelo botão ⚡ ("Charge"): vizinho adversário + o de trás ficam paralisados/queimados/congelados; turno acaba. P2P: `P2P_CHARGE`.
  - **Plates novas (21):**
    - Twisted Spoon (`_spoon`: ★+1; Psychic Amplifier 558/592 e Meditative Alchemy 535 ganham alcance 2 com ela, via `RANGE2.needSpoon`).
    - Burn/Douse/Chill/Shock Drive (Genesect: Miss→ao lado neste turno; KO de certos tipos → excluído).
    - 11 Power (+20 para o tipo até nocautear com ele; turno acaba).
    - 8 Energy (Flame, Tropical, Dark, Phantom, Steel, Muscle, Electro, Molting).
    - Estado em `state.__x712 {power, energy, drive}`; P2P `P2P_PLATE2`. Black Core (358) anula as Energy; White Noise (404) / Blackout (414) apagam e marcam como usadas. Hoverjet (235) devolve uma Drive.
  - **Habilidades:** Spellbind (197), Open Sea Singer (350), Electromagnetic Barrier (355, não é alvo de spinAt), Rocket Ride (415, ação em 2 etapas → `banishToUltraSpace`), Ultra Stack (523, Azul de Aço não vira Miss).
  - **Bot:** wrapper em `triggerPlayerAIMove`. Uma vez por turno, `botTry()` avalia ações do ⚡:
    - warp/dash/hop/raid por ganho de distância ao Goal (vitória direta = máxima prioridade);
    - Cut Off quando ameaçado; spinAt perto do próprio Goal; Charge; trocas úteis.
    - Também Tag em aliado dormindo/congelado/paralisado. Depois de mover, faz Tag se não houver ataque.
- **`abilities_act.js`:**
  - ações que levam a peça ao Goal adversário agora dão vitória (antes só o movimento normal checava);
  - `actOf` exposto e usado via `PUB()`;
  - `canAct` aceita `state.aiExecutingNow` (o bot).
- **Cobertura:** 433/433 com mecânica. Parciais por falta de base: King Spike (parte "marcador de −MP": o jogo não tem marcadores de MP) e Ultra Stack (multiplicar efeitos por X+1).
- **Testes:** Tag, King Spike, Twisted Spoon (+alcance 2), Flame Power, Flame Energy, Charge do Zapdos, Rocket Ride, bot usando Tunnel Construction até o Goal (vitória); lotes anteriores; 7.548 batalhas 0 problemas; 251 evoluções; 4 partidas bot×bot 0 erros.
- **CACHE_NAME:** v711 → v712

### 2026-11-12 · Claude · Habilidades, lote 4: complementos das parciais (v711)
- **`abilities_ext.js`:** `OFFICIAL_DUEL_ABILITIES_SUPP` (gerado de `/home/claude/gen/abil_supp.py`) acrescenta cláusulas às habilidades que o parser pegou só em parte (25).
  - Ocean's Gift (imune a queimadura), Nonstop (atravessa Espera/paralisados), Flame Acceleration (+MP por P.C.), Blaze Boogie (queima quem atravessa, kind novo `passStatus`), Earthen Rapids (aura MP), Scarlet Bladewings (KO ao atravessar), Disguise (markerShield), Proactive (+20 no seu turno), Cerebral Embrace (noPassOver), Intimidating Aura (bloqueia Plates), Darkness Crystal (kind novo `noKoDmg`), Billows of the Fell Dragon, Thankfulness, Breath of the Abyss, Poisonous Bunker, Carry Home, Greenhouse, Voltage Zone, Fearsome Frost Tree, Flawless Jewel, Victory Star (re-giro), Whims of the Wind, Stormbringer's Mischief, Fire Scales, Memories of the Past.
- **`abilities_act.js`:** ação Loyalty (volta ao banco e pode ser usada no mesmo turno); Two-Sword Strike com alcance 2.
- Conferido: todos os `koTransform` apontam para figuras que existem (Kyurem, Groudon, Kyogre, Necrozma). Um alvo inexistente deixaria a peça imortal.
- **Testes:** os 3 scripts de habilidades; 7.548 batalhas 0 problemas; 251 evoluções; 3 partidas bot×bot 0 erros.
- **CACHE_NAME:** v710 → v711

### 2026-11-12 · Claude · Habilidades, lote 3 (v710)
- **Novo `js/engine/abilities_more.js`** (depois de `abilities_act.js`):
  - Full Metal Body / Bite Down: o oponente não foge da batalha.
  - Rocket Ride: na 1ª batalha, Flamethrower vira Flame Gun (roxo, KO).
  - Big Eggsplosion: Barrage +60 e sacrifica um Exeggcute.
  - Gluttony: Sweet Scent tira a peça do P.C.
  - Aftermath Switch: explode um Voltorb seu se compensar.
  - Illusion: troca antes da batalha, automática fora do P2P.
  - Slippery: escapa do cerco uma vez.
  - Come Here: cada lado põe uma peça do banco no Entry Point.
  - Ações do botão ⚡ a partir do banco: Volt Swap, Ice Scramble, Surprise Strike (volta ao banco depois). Slime Touch (marcador `_slime` = Slime Barrier + habilidade anulada).
- **`abilities_act.js`:** o botão agora usa `window.PDRAbilityActions.canAct/targetsFor/perform` em tempo de chamada, para outros arquivos poderem estender as ações.
- **Cobertura:** 423 de 433 em uso. Só texto (não existe a mecânica de base): Electromagnetic Barrier, Permafrost, Psychic Amplifier ×2, King Spike, Spellbind, Ultra Stack, Open Sea Singer, Gluttony parcial, Rocket Ride parcial (a ação de lançar).
- **Testes:** Volt Swap, Rocket Ride, Slippery; lotes 1 e 2 de novo; 7.548 batalhas 0 problemas; 251 evoluções; 3 partidas bot×bot 0 erros.
- **CACHE_NAME:** v709 → v710

### 2026-11-12 · Claude · Habilidades, lote 2: ações especiais, alcance 2 e passivas restantes (v709)
- **Novo `js/engine/abilities_act.js`** (depois de `abilities_ext.js`).
  - **Botão "⚡ Habilidade: <nome>"** (HTML fixo sobre o tabuleiro, `#ab-act-btn`): aparece quando a peça selecionada tem ação disponível neste turno (antes de mover, sem Espera, sem sono/congelamento).
  - Tocar acende os alvos (`state.__abMode`, via `state.reachableNodes`); o wrapper em `onNodeClicked` executa.
  - P2P: pacote `P2P_ABILITY` com as posições finais.
  - **34 ações:**
    - Trocar de lugar: swapAdj (Run Off, Strong Breeze, Electroswap, Electrobind), swapAny (Snowy Transformation).
    - Saltar para longe: warp (Tunnel Construction, Magnetic Body, Spaceborne), dash por casas vazias (Rush In, Reckless Charge), raid (Raid: move 3 e entra em postMoveAttackMode).
    - Passar por cima de vizinhos: hop (Distort, High-Speed Drill, Bonfire, Ultra Pump Up, Gulp), chainHop (Forest Leap, Cosmic Surfer).
    - Outras: goal (Cut Off), summon (Swarm), spinAt (Long Lick, Entangle, Lock On ×3).
  - **Alcance 2:** High Flying, Paper Sword (1ª batalha), Stance Change. Alvos a 2 passos com peça no meio, somados em `selectUnit`.
  - **Passivas:** Arm Thrust Evolution, Sand Blizzard, Steel Breaker / Rough Skin (marcador `_cracked`), King Horn, Paper Sword (exclui com Cracked), Survive / Multitype, Pressure, Deliver, Flower Carpet, Pulsar Venom, Spark Noise, Power Construct, Surprise Back, Bite Instinct, Max Vital Spirit, Diving Entry.
- **Correção:** os ataques depois de mover passam `forced` com `manualSpin`, e `abilities_ext.js` tratava isso como pacote remoto, pulando noAttack e fuga. Agora só conta como remoto se vier com `atkSpin`/`defSpin`.
- **Cobertura:** 411 de 433 habilidades em uso têm mecânica. Ainda só texto (22): Gluttony, Spellbind, Big Eggsplosion, Surprise Strike, Ice Scramble, Full Metal Body, Bite Down, Open Sea Singer, Electromagnetic Barrier, Come Here, Rocket Ride, Illusion ×2, Permafrost, Ultra Stack, Psychic Amplifier ×2, King Spike, Volt Swap, Slime Touch, Slippery, Aftermath Switch. Dependem de mecânicas que o jogo não tem (tag, golpes que fazem outra peça girar, Twisted Spoon, Round/Sing, escolhas do jogador antes da batalha).
- **Testes:** Tunnel Construction, Electroswap, High Flying, Long Lick, Raid e o botão; 16 checagens do lote 1; 7.548 batalhas 0 problemas; 251 evoluções; 6 partidas bot×bot 0 erros.
- **CACHE_NAME:** v708 → v709

### 2026-11-12 · Claude · Habilidades restantes, lote 1: 179 habilidades à mão + motor estendido (v708)
- **Novo `js/engine/abilities_ext.js`** (logo depois de `abilities.js`).
  - Dados: `OFFICIAL_DUEL_ABILITIES_MANUAL` (gerado de `/home/claude/gen/abil_manual.py`), que substitui o `ef` automático de 179 habilidades.
  - Cobertura em uso: 358/433 com mecânica (antes ~187); 75 ainda só texto.
- **Condições novas:** hasStatus, notSt, confused, onBench, atEntry, adjHas, fieldHas{side,names,types,st,min}, noOppWithin2, vsPureType, oppHasStatus, oppNotEvolved, oppDmgMin.
- **Tipos novos:**
  - MP: mpAura (set/n, range, maxMp/minMp, cap, nearOwnTypes, tag p/ não acumular), mpSet, mpMin, mp com per.
  - Roleta e dano: auraDmg, protect, lessInFrom, stars, dmgMult, dmg.move (só no golpe com aquele nome), oppShift, oppGoldMiss, nullOppDmg, oppRespin, selfRespin.
  - Pós-batalha: battleOppWait, selfStatusAfter, battleOppNullAbility (`unit._abNull`), magicTrick, synchronize, whiteStatusImmune, evolveSurvive, evolveOnInflict.
  - Contra nocaute: noKoEffect (scope selfAdj), fairyGuard, reflectKoWhite, voltAbsorb, markerShield, koEvolve (ignora o alvo do deck), koToEntry, koExile, koRevivePC, regenerator.
  - Imunidade com scope (allies/alliesAdj).
  - Movimento: passSel ampliado (any, st, wait, names), allowPass, allyPassTypes, noPassOver (byTypes/protectTypes/chain), passKill, flyOverParalyze.
  - Entrar em campo e turnos: onEnterCleanse, onEnterClearWait, startWait, badDreams, selfCleanseStart, evolveOnRevive.
  - Regras: noAttack, noAttackAfterMove, blockOppPlates, surroundImmune/noSurround (wrapper em `checkSurroundKOs`).
  - Fuga: fleeToBench/dodgeUnder/fleeSwap, automáticos fora do P2P quando a batalha parece ruim (`abShouldFlee`).
- **Wrappers:** abilityEfOf, abilityCondOk, abilityPerCount, abilityDamageBonus, abilityImmuneTo, getEffectiveUnitMp, getActiveWheel, evaluateCombat, computeReachableWithPaths, executeMove, selectUnit, triggerCombat, confirmUseSelectedPlate, checkSurroundKOs, endTurn, demoFullMatchState.
- **Testes:** 15 habilidades verificadas uma a uma (Guts, Swift Swim, Diffuse Poison, Shell Armor, Rapid Evolution, Gooey, Fire Alert, Spinning Pattern, Sticky Web, Thicket Slip, Bide, Dark Stone, Bad Dreams, Chemical Pollen, Mold Breaker); 7.548 batalhas 0 problemas; 251 evoluções; 4 partidas bot×bot 0 erros.
- **Faltam 75**, quase todas ações especiais "no começo do turno, em vez de mover…", alcance 2 e marcadores. Próximo lote.
- **CACHE_NAME:** v707 → v708

### 2026-11-12 · Claude · Loja repaginada + Mercado Diário + prêmio diário no hub (v707)
- **Novo `js/ui/shop_screen.js`:** a aba `#dtab-shop` é refeita em runtime. O DOM antigo fica em `#sh-legacy`; o card da Troca por Material foi movido e aparece pelo botão no fim.
  - Carteira (🪙/🔻/🧱).
  - Card grande de **Recompensa Diária** com contagem regressiva ao vivo; usa o `claimDailyGems` antigo.
  - Caixas de Vitória (`openEarnedVictoryBox`).
  - **Mercado Diário:** 10 Pokémon por dia.
    - Sorteio com seed da data local, ponderado por raridade e com 1 EX/UX garantido; descontos de 0–50%.
    - Preço: C 3k / UC 6k / R 14k moedas, EX 150 / UX 300 gemas.
    - Compra única por item, salva em `localStorage pdr_daily_market_v707`; vira à meia-noite. Entrega via `unlockAndShowBoosterModal`.
  - Caixas com a arte original (`assets/ui/boosters/*.png`) → `buyShopBooster(1|2|4|6)`; Caixa de Moedas e materiais → `buyWithCoins`.
- **Hub:** botão "🎁 Prêmio Diário" embaixo do Buff da Semana, pulsando verde quando está pronto (abre a Loja).
- **Testes:** resgatar diária (+50🔻 +1.500🪙), comprar no mercado (figura liberada, item marcado após reload), comprar caixa; partida bot×bot 0 erros.
- **CACHE_NAME:** v706 → v707

### 2026-11-12 · Claude · Deck estilo Clash Royale, plates novas, Mega Plate real, sons mais leves (v706)
- **Novo `js/ui/deck_screen.js`:** a aba `#dtab-deck` é refeita em runtime no visual da Fusão (o DOM antigo fica escondido em `#dk-legacy`).
  - Topo fixo: times, limites MEGA/UX/EX e 6 slots.
  - Embaixo: Plates e Coleção.
  - Interações: arrastar a figura até um slot (segurar 220 ms ou mover de lado); tocar → menu Info/Usar → tocar no slot; arrastar slot sobre slot troca os dois; tocar no slot abre a Info.
  - A lógica continua a antiga (`toggleDeckEquip`, `switchDeckPreset`, `autoBuildBalancedTeamV540`, `openPlateDetailsModal`).
- **Info só leitura:** `PDRDuelScreens.showDataReadOnly(root, idx, opts)` é a tela Data sem Disk Expansion/Fundir, usada pelo Deck. Pedido do usuário.
- **Novo `js/engine/plates_extra.js`:**
  - **Mega Plate** agora troca pela figura Mega oficial (arte/roleta/MP) por 7 turnos, com reversão pelo `revertMegaEvolution` (campos `preMega*`). Sem forma Mega: "Poder Mega", +30 de dano e ★+1 por 3 turnos (`megaPowerTurns`).
  - Pede alvo: usa a peça selecionada ou espera um toque (`state.pendingPlateAction = "px:<id>"`, wrapper em `selectUnit`).
  - O bot (`ai.js`) e o P2P (`handleP2PPacket`) usam o mesmo `PDRPlates.applyPlate`.
  - **8 plates novas** (do Duel original): fullheal, focusband, xdefend, xspatk, xaccuracy, scoopup, desperate, recycle. Ícones SVG gerados em `BANANA_PLATE_SPRITES`.
- **Armadilha:** o `ui.js` roda `enforceStrict6CostPlates()` na carga, antes do catálogo estendido, e apagava as plates novas do save. Correção: backup em `localStorage pdr_plates_full_v706`, restaurado na carga.
- **Sons mais leves (pedido):**
  - tick → select (0,16 s); portal e tick mudos dentro da partida; move no máximo 1 vez a cada 0,7 s; spin_tick com volume 0,16.
  - Removidos: begin_attack, end_turn, new_turn (virou turn_order baixo), deselect, surrounded (disparava errado) e cheer.
- **i18n:** textos de `plate.megaplate.sub` atualizados (PT/EN/ES).
- **Testes:** 7.548 batalhas 0 problemas; 251 evoluções; 2 partidas bot×bot 0 erros; arrastar/trocar/usar no Deck; Mega real (Charizard → Mega Charizard X), Poder Mega, Focus Band, Recycle; plates novas sobrevivem ao reload.
- **CACHE_NAME:** v705 → v706

### 2026-11-12 · Claude · Sons originais do Pokémon Duel + Deoxys corrigidos (v705)
- **Sons:** 94 efeitos convertidos para `assets/sfx/*.mp3` (mono 80 kbps, 2,1 MB), dos pacotes Common / Duels / Cutscenes do The Sounds Resource (anexados pelo usuário). Não há música de fundo nesses pacotes.
- **Novo `js/audio/duel_sfx.js`** (depois de `app.js`, antes de `duel_screens.js`): `PDRSound.play(nome, {vol, rate, delay, gap})` via Web Audio no `sfxCtx`.
  - `playSfx` antigo mapeado: tick→confirm (na roleta → spin_tick), back→cancel, step/jump→move, portal→plate_ok, level_up→levelup, hit→plate_cancel (mudo durante a batalha).
  - Eventos:
    - Roleta: begin_attack + spin no `triggerCombat`; spin_tick no `Juice.tick`; spin_stop.
    - Golpe: som pelo tipo do vencedor (t_*), gold_attack, golpes físicos (punches/scythe/slam) e zmove, tocado no lançamento da animação.
    - Resultado: ko / condição (st_*) / push e bench, e miss / tie / shield / dodge quando não há vencedor.
    - Partida: form_a/form_b na evolução, win/lose + cheer no fim, duel_start, new_turn, end_turn, select/deselect, cartas (plate_sel/plate_cancel/use_plate), booster.
  - Liga/desliga e volume no topo da aba Config (`localStorage pdr_sfx`).
  - `juice.js`: thump/fanfare/sad sintetizados ficam mudos quando os sons reais estão ligados.
- **Deoxys:** as 3 Deoxys antigas (índices 26/55/201) apontavam todas para a figura oficial Nº218 (Speed).
  - Agora: 26 = Attack Forme (Nº224), 55 = Deoxys Normal (Nº219), 201 = Speed Forme (Nº218); 399 renomeado para Defense Forme.
  - Corrigidos `OFFICIAL_DUEL_DISKS`, `OFFICIAL_DUEL_SPRITES` e os nomes no fim de `official_disks.js`.
- **Armadilha de teste:** o headless também guardava cache HTTP. `/tmp/unsw.py` agora chama `Network.clearBrowserCache`.
- **Arquivos:** `js/audio/duel_sfx.js`, `assets/sfx/`, `js/ui/juice.js`, `js/ui/duel_screens.js`, `js/data/official_disks.js`, `index.html`, `PokeDuel-Web-v5.6.0.html`, `sw.js`.
- **Testes:** 94 sons carregam e decodificam; sequência de sons de uma batalha conferida; 7.548 batalhas 0 problemas; 2 partidas bot×bot 0 erros.
- **CACHE_NAME:** v704 → v705

### 2026-11-12 · Claude · Telas estilo original: Fusão/Data/Disk Expansion, Evolve?, Z-Move, animação de ataque (v704)
- **Novo `js/ui/duel_screens.js`** (carrega depois de `app.js`):
  - **Fusão:** a aba `#dtab-fusion` é refeita em runtime.
    - Telas: grade de figuras (busca + filtro de raridade) → **Data** (roleta grande clicável, ID/Lv/CLv, tipo, habilidade, evoluções em pedestais, tabela Wheel Piece com o efeito de cada ataque, Z-Moves, botões de fundir) → **Disk Expansion / Damage Reallocation** (disco grande que gira até o ponteiro, Recommended / + / −, Confirm, Reset).
    - Os elementos antigos (`fusion-target-select` etc.) continuam escondidos em `#ds-legacy` porque `applyFusionMaterial` lê eles.
  - **Evolve?:** wrapper em `evolveUnitInMatch`.
    - Substitui o modal antigo por roleta atual ↓ roleta nova (via `getActiveWheel` de uma cópia), raridade, MP, Stage/Mega, notas e Sim/Não.
    - Espera o `#wheel-overlay` fechar antes de abrir.
  - **Z-Move:** `toggleZMoveFromTray` abre um seletor (peça + Z-Move oficial, até 2 por figura).
    - Fica salvo em `state.zMoveChoice {uid, idx}`. `getFigureZMove` usa os Z-Moves oficiais (o bot escolhe o mais forte).
    - Só a peça escolhida converte a roleta (wrappers em `getActiveWheel` e `triggerCombat`).
  - **Animação de ataque:** wrapper em `Juice.onImpact`.
    - As duas figuras aparecem sobre as roletas; o vencedor investe ou dispara um projétil da cor do tipo; corte + recuo do perdedor; depois o burst antigo.
    - `battle.js` soma `window.__pdrAtkAnimMs` ao `closeWaitMs`.
- **Novo `js/data/official_extra.js`:** `OFFICIAL_DUEL_EXTRA[officialDuelId] = {z:[{n,c,d,s,e,t}], fx:{ataque: texto}}` (566 figuras, Bulbapedia).
- **Hub:** badge "Buff da Semana" movido para baixo do botão Tutorial (coluna esquerda). Pedido do usuário.
- **Arquivos:** os acima + `index.html`, `PokeDuel-Web-v5.6.0.html`, `js/engine/battle.js` (closeWaitMs), `sw.js`.
- **Testes:** 7.548 batalhas 0 problemas; 251 evoluções 0 falhas; partidas bot×bot 0 erros; prints de todas as telas.
- **CACHE_NAME:** v703 → v704

### 2026-11-12 · Claude · Motor de habilidades por cláusulas + 29 Shiny (v703)
- **O quê:** `abilities.js` reescrito. Cada habilidade oficial agora é uma lista `ef` de cláusulas `{k, c}`.
  - Condições `c`: noStatus, evolved, first, myturn, oppturn, vsType.
  - Tipos `k`: dmg (com contagem por campo/vizinhas/PC), pass, passSel, mp, immune, noWait, immovable, noKo, koToBench, noKoGold, halveIn, lessIn, oppBlueMiss, oppGoldToWhite, nullOpp, whiteToGold, missShift, battleOppStatus, koTransform.
  - Cobertura: ~187 de 448 habilidades com alguma mecânica (73 completas); o resto é só texto (habilidades sob medida).
  - +29 figuras no fim do FIGURES_DB (27 Shiny + Dawn Wings Necrozma Nº647/648, total 629), com famílias Shiny automáticas.
- **Arquivos:** `js/engine/abilities.js`, `js/data/official_disks.js`, `assets/figures_duel/Shiny*.webp`, `sw.js`.
- **Wrappers novos:** `getEffectiveUnitMp`, `computeReachableWithPaths` (passSel), `executeMove` (marca `_abBattled`).
- **Testes:** 7.548 batalhas 0 problemas; 251 evoluções 0 falhas; 6 partidas bot×bot 0 erros.
- **CACHE_NAME:** v702 → v703

### 2026-11-12 · Claude · Habilidades, efeitos de fatia e evoluções (v701–v702)
- **O que:** novo `js/engine/abilities.js` (depois do `ai.js`, nos dois HTMLs e em `CORE_ASSETS`):
  - `OFFICIAL_DUEL_ABILITIES` (448 textos oficiais, tipos preservados). Figuras sem descrição própria mostram o texto oficial em `FIGURE_ABILITIES_DB`. `fx` aplicados: `pass` (52), `dmg` (44: self / allies / alliesAdj / adjAll, com tipo e turno), `immune` (14), `oppBlueMiss` (7), `immovable` (5), `noWait` (4), `halveIn` (3), `noKoGold` (2), `koToBench`, `nullOpp`, `mp`, `lessIn`.
  - Camadas novas mais externas: `getActiveWheel` (bônus de dano de habilidade, aparece no disco e a IA enxerga) e `evaluateCombat` (Azul→Miss, metade do dano, imunidades, não-move, etc.). Proteção contra aplicar 2× no Double Chance (`_abTweaked`/`_sliceDone`).
  - `OFFICIAL_DUEL_SLICE_FX` (170 fatias Brancas/Douradas): `onLoseStatus` (90, ex.: Flamethrower queima quem nocauteou), `spinAgain` (19, Swords/Dragon Dance: re-gira com ×2 ou +N, usa `nextDeterministicRandom` só na batalha real), `reverseAtLeast` (14, Grass Knot/Counter), `vsType` (12), `selfWait` (10), `selfStatus` (9), `benchOpp` (7), `destinyBond` (5), `hex` (4). Efeitos pós-batalha via `state.__sliceFxPending` + `abilityAfterBattle()` (gancho novo no `battle.js`).
  - `OFFICIAL_DUEL_EVO_FAMILIES`: 154 cadeias novas geradas com `@pkmn/dex` (só nomes existentes, inclui Alolan e Mega). Famílias são **limpas no carregamento**: nomes inexistentes saem (corrige bug antigo: Pidgeot→"Mega Pidgeot", Bellsprout→"Weepinbell" etc. evoluíam só no nome, com sprite/roleta antigos).
  - Roletas antigas que somavam 100 (Lapras, Kabutops, Mega Starmie, Mega Lopunny) ajustadas para 96 na maior fatia.
  - `battle.js`: chama `abilityAfterBattle()` e `abilityAfterEffect()` (remove Espera de quem tem `noWait`).
- **CACHE_NAME:** v700 → v702
- **Testes (fora do repo):** auditoria Node das 600 figuras (sobram só 34 fatias Brancas de dano 0 que são oficiais: Splash, Swords Dance etc.); 600 sprites carregados e conferidos (transparência e proporção) sem falha; 7.200 batalhas aleatórias (getActiveWheel + spinWheelForUnit + evaluateCombat) sem exceção nem resultado inválido; 245 evoluções testadas, 0 falhas; Assist (Audino) dá +30 ao vizinho; 8 partidas bot × bot com decks só de figuras novas, 0 erro de console (1 terminou no limite de 300 turnos).

### 2026-11-12 · Claude · Coleções novas: +328 figuras oficiais (v700)
- **O que:** `js/data/official_disks.js` ganhou `OFFICIAL_DUEL_NEW_FIGURES` e `OFFICIAL_DUEL_NEW_SPRITES`: as figuras da Library do Pokémon Duel que não existiam no jogo entram no **final** do `FIGURES_DB` (índices 272–599). Cada uma: `id`/`spriteKey` = `duel<Nº oficial>`, nome oficial (repetido → sufixo "(NºN)"), raridade/tipo/MP/roleta oficiais, `canPassThrough` para Voador/Fantasma, cor pelo tipo (`WEEKLY_BUFF_TYPES`). Distribuição: 39 C, 114 UC, 67 R, 48 EX, 60 UX. Sprites com carregamento sob demanda (getter em `loadedFigImages`); o SW guarda em cache no primeiro uso.
- Começam bloqueadas e entram nos sorteios de baú (`rollFiguresForBox` percorre o `FIGURES_DB` inteiro), na coleção do Deck (25 páginas) e nos bots.
- **CACHE_NAME:** v699 → v700
- **Verificação:** Playwright: FIGURES_DB = 600, ids únicos; abertura de baú com Bagon / Alolan Grimer / Bidoof; coleção "24 de 600"; partida bot × bot sem erro.
- **Atenção:** a chance de cada figura antiga sair num baú caiu (pool 2,2× maior). Habilidades das novas não estão implementadas.

### 2026-11-12 · Claude · Arte oficial em todas as figuras do Duel + roletas restantes (v699)
- **O que:** `js/data/official_disks.js` regerado:
  - Roletas oficiais agora em **226 de 272** figuras (antes 219): formas casadas pelo nome base (Palkia/Dialga/Giratina Origin, Deoxys Attack/Speed, Shaymin Land/Sky) e, quando a versão preferida tem roleta incompleta, usa outra versão da mesma figura que some 96.
  - Novo `OFFICIAL_DUEL_SPRITES` (230 spriteKeys): troca `AUTHENTIC_FIG_SPRITES[key]` e `loadedFigImages[key]` pela arte oficial (`assets/figures_duel/*.webp`, 187×256 desenhado a 36×50, apoio calculado pelo fundo de cada imagem). A vista de costas `key_back` também recebe a arte oficial → o lado do jogador mostra as figuras de frente. Vale para tabuleiro, hub, Deck, Loja e abertura de baú (todos leem `AUTHENTIC_FIG_SPRITES`/`loadedFigImages`).
  - `sw.js`: as 230 imagens usadas entraram em `CORE_ASSETS` (~4 MB) para funcionar offline.
- **CACHE_NAME:** v698 → v699
- **Verificação:** Playwright: hub, partida e aba Deck com a arte oficial, sem erro de console; `node --check` OK.
- **Pendências:** §6 (42 figuras que não existiam no Duel; 422 imagens de figuras que ainda não estão no jogo).

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
