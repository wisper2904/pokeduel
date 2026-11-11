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
| `CACHE_NAME` (sw.js) | `pokeduel-pwa-v686` |
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
peerjs → i18n → sprites → figures → bots → audio → board → battle → p2p_matchmaker → ui → juice → ai → app
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
- Atualização automática (desde v686): o app checa o `sw.js` ao abrir, ao voltar para a tela, no `focus` e no `online` (no máx. 1×/30 s) e mostra o aviso "Nova versão disponível · Recarregar". **Ou seja: se esquecer de subir o `CACHE_NAME`, ninguém recebe a atualização.**
- `.md` não entra em `CORE_ASSETS`. Editar só este arquivo **não** exige bump de `CACHE_NAME`.

---

## 6. Dívida técnica / bugs abertos

- [ ] Versões inconsistentes (README v5.6.0 · app.js v6.3.0 · ai v5.9.0 · cache v686). Definir uma fonte única (ex.: `const APP_VERSION` em `app.js`).
- [ ] Cadeias de monkey-patch (§4) dificultam manutenção; consolidar aos poucos, uma função por vez, com teste manual.
- [ ] `index.html` duplicado em `PokeDuel-Web-v5.6.0.html`: avaliar virar redirect para eliminar risco de dessincronia.
- [ ] `initAITacticalPlates` passa do limite 6◆ quando libera Double Chance/Mega (4 plates = 6◆ + extras).
- [ ] Não há testes automatizados de regra (`evaluateCombat` é pura e fácil de testar com Node).

---

## 7. Log de alterações (mais recente no topo)

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
