# Amigos e convite no Multijogador P2P — desenho (2026-11-13)

## Intenção

A aba "Multijogador P2P" hoje é só a sala por código (Celular 1 cria, Celular 2 digita 4 dígitos) e o 2P local. Gabriel quer a aba repaginada e um **sistema de amigos**: adicionar um treinador como amigo, ver quem está online e **convidar para duelar com um toque**, em vez de ditar o código. O código continua como opção.

## Decisões já tomadas (pelo Gabriel)

- Amizade é **pedido + aceite** (como Discord), não lista de contatos unilateral.
- Pedido, aceite e convite viajam **só pelo Salão** (canal MQTT público que já mostra quem está online). Nada chega para quem está offline.

## Objetivos

- Lista de amigos com nome, avatar, ELO e status online.
- Pedido de amizade por ID do Treinador, por treinador online no Salão, ou pelo adversário no fim de uma partida online.
- Convite para duelar que abre a sala e conecta os dois sem ninguém digitar código.
- Aba P2P com hierarquia clara: Amigos em cima, sala por código recolhida, 2P local embaixo.
- Tudo em PT/EN/ES (dicionário `tr/900_manual.txt`).

## Não objetivos

- Chat, mensagens, histórico de partidas com amigos.
- Entrega offline (ntfy) — rejeitada por enquanto; pode entrar depois.
- Bloquear/denunciar.
- Trabalho extra para sincronizar amigos na nuvem: o save na nuvem (`buildCrossSavePayload`) já despeja o `localStorage` inteiro, então a lista vai junto de graça.

## Anti-objetivos (falha mesmo funcionando)

- Quebrar a sala por código ou o matchmaking ranqueado, que compartilham `peerInstance`, `activeP2PRoomId` e o canal do Salão.
- Pop-up de convite/pedido aparecendo em cima da roleta ou no meio de uma partida: durante partida ativa (`state.isMatchActive`) convites são respondidos automaticamente com "ocupado" e pedidos ficam na fila da aba.
- Alinhamento do Hub mexido (regra do projeto).

## Restrições

- Sem servidor: o Salão é um tópico MQTT público (`pokeduel/v600/salao`), todo mundo recebe tudo. Identidade é o `trainerId` (`NNN-NNN-NNN`) do perfil, que qualquer um pode forjar. Mesmo nível de confiança do matchmaking atual; aceito.
- Scripts globais com monkey-patching; JS novo entra em `CORE_ASSETS` do `sw.js` e nos dois HTMLs idênticos; `CACHE_NAME` sobe (v728).
- Presença: `SALAO_PRESENCE` a cada 8 s, considerado online por 28 s (`salaoKnownTrainers`). Hoje o Salão só conecta quando o jogador abre a aba P2P, entra na fila ou cria sala. Para a bolinha verde e os convites funcionarem o Salão precisa conectar **ao abrir o jogo** quando a pessoa tem ≥1 amigo (ou quando a aba P2P está aberta). É um WebSocket leve; aceitável.

## Abordagens consideradas

1. **Salão só (escolhida).** Pedido/aceite/convite como pacotes novos no mesmo tópico. Zero infra nova; exige os dois online juntos.
2. Pedidos via ntfy.sh por treinador (caixa de entrada, 12 h de retenção), convites pelo Salão. Entregaria pedido offline, mas mais uma peça de rede e mais um ponto de falha. Rejeitada agora.

## Como funciona

### Dados (`localStorage`, chave `pdr_friends_v728`)

```json
{ "friends": [ { "trainerId": "123-456-789", "username": "gabriel", "nickname": "Gabriel", "avatar": "pikachu", "rating": 1230, "confirmed": true, "addedAt": 0, "lastSeen": 0 } ],
  "outgoing": [ { "trainerId": "...", "nickname": "...", "sentAt": 0 } ],
  "incoming": [ { "trainerId": "...", "nickname": "...", "avatar": "...", "rating": 0, "receivedAt": 0 } ] }
```

- `friends` é a lista aceita. `incoming` são pedidos recebidos ainda sem resposta (persistem entre sessões, pois a pessoa pode fechar o jogo antes de responder). `outgoing` é só para mostrar "pedido enviado" e expira em 24 h.
- Chave de identidade: `trainerId`. `username` (conta registrada) é informativo; se o amigo trocar de celular e o ID mudar, é outra pessoa — limitação aceita e dita na tela ("seu ID muda se zerar o perfil").
- O próprio ID aparece grande na aba, com botão Copiar, para mandar ao amigo.

### Pacotes novos no Salão (todos com `fromTrainerId`, `fromNick`, `fromAvatar`, `fromRating`, `toTrainerId`, `ts`, `nonce`)

| Tipo | Quem manda | O que o outro faz |
|---|---|---|
| `FRIEND_REQUEST` | quem pede | grava em `incoming`, mostra pop-up "X quer ser seu amigo — Aceitar / Depois"; se já é amigo, responde `FRIEND_ACCEPT` direto |
| `FRIEND_ACCEPT` | quem aceita | os dois gravam em `friends`; remove de `outgoing`/`incoming`; toast "Agora vocês são amigos" |
| `FRIEND_DECLINE` | quem recusa | remove de `outgoing`; toast discreto |
| `FRIEND_REMOVE` | quem desfaz | o outro remove também (sem pop-up; só some da lista) |
| `FRIEND_INVITE` | anfitrião | pop-up "X te convidou para duelar — Aceitar / Recusar" com avatar e ELO; carrega `roomCode` |
| `FRIEND_INVITE_REPLY` | convidado | `accept` → anfitrião mostra "X aceitou, conectando…"; `decline`/`busy` → anfitrião volta ao normal com aviso |

Pacotes com `toTrainerId` diferente do meu são ignorados. Pacotes de quem não é amigo são aceitos só para `FRIEND_REQUEST` (os outros exigem estar em `friends`, exceto `FRIEND_ACCEPT`, que exige estar em `outgoing`). `nonce` + `ts` em um `Set` evitam reprocessar o eco do MQTT.

### Fluxo do convite

1. Anfitrião toca "Convidar" num amigo online. O jogo chama `createIntuitiveP2PRoom()` (gera/usa o código, abre PeerJS e BroadcastChannel como hoje) e publica `FRIEND_INVITE { roomCode }`. A aba mostra "Convite enviado a X · aguardando… [Cancelar]" com contagem de 45 s; esgotou → `cleanupActiveP2PSession` e aviso.
2. Convidado recebe o pop-up. **Aceitar**: preenche `room-code-input` com o código e chama `joinIntuitiveP2PRoom()` — daí em diante é o fluxo existente (P2P_JOIN → P2P_START). **Recusar**: manda `decline`. Se estiver em partida, responde `busy` sem pop-up.
3. Anfitrião recebe `accept` e só espera a conexão como já espera hoje.

Cancelar no anfitrião manda `FRIEND_INVITE_REPLY {cancel}` para o convidado fechar o pop-up.

### Fluxo do pedido de amizade

- **Por ID**: campo "ID do treinador" + botão Enviar. Se o ID não está online no Salão (`salaoKnownTrainers`), avisa "X não está online agora; o pedido só chega com ele no jogo" e **não** grava em `outgoing`. Se está, manda `FRIEND_REQUEST`.
- **Pelo Salão**: lista "Online agora" com os treinadores de `salaoKnownTrainers` (nome, avatar, ELO) e botão "+" em cada um. Hoje esse mapa guarda só nome/rating/avatar; precisa passar a guardar `trainerId` (o `SALAO_PRESENCE` já envia).
- **Pós-partida online**: na tela de resultado de partida `p2p`, botão "Adicionar X como amigo" quando `remoteOpponentProfile.trainerId` é válido e ainda não é amigo. Manda `FRIEND_REQUEST` (o adversário ainda está online nesse momento).
- Pedido recebido: pop-up se o jogador está no Hub/aba; se está em partida, só grava em `incoming` e a aba mostra badge "1 pedido".
- `incoming` aparece no topo da lista de amigos como "Pedidos (n)" com Aceitar/Recusar. **Aceitar grava o amigo localmente na hora** (com `confirmed: false`) e manda `FRIEND_ACCEPT`. Se o outro já fechou o jogo, o pacote se perde; por isso, sempre que um treinador online aparece no Salão e está em `friends` com `confirmed: false`, reenviamos `FRIEND_ACCEPT` (uma vez por sessão). Quem recebe `FRIEND_ACCEPT` de alguém em `outgoing` grava o amigo com `confirmed: true` e responde `FRIEND_ACCEPT` de volta, o que confirma o primeiro lado. Assim a amizade fecha mesmo que o aceite tenha acontecido com o outro offline.

### A aba (retrato, 353 de largura lógica)

```
← Hub            🌐 MULTIJOGADOR            ✕ Tabuleiro
┌───────────────────────────────────────────────────┐
│ 👥 AMIGOS                      Seu ID 530-181-123 📋│
│ [ + Adicionar amigo ]           ● 2 online         │
│ ─ Pedidos (1) ─────────────────────────────────── │
│ 🐢 Luca · 1180        [Aceitar] [Recusar]         │
│ ─ Amigos ─────────────────────────────────────── │
│ ● ⚡ Gabriel · 1230 Elite     [⚔ Convidar]        │
│ ● 🔥 Ana · 1105 Beginner      [⚔ Convidar]        │
│ ○ 🌿 Bruno · visto há 2 d      [—]                 │
└───────────────────────────────────────────────────┘
┌ 🔢 SALA POR CÓDIGO  ──────────────────── ▸ abrir ─┐   (recolhido; abre com o conteúdo atual, só reestilizado)
└───────────────────────────────────────────────────┘
┌ 📱 2 JOGADORES NO MESMO CELULAR   [Iniciar 2P] ───┐
└───────────────────────────────────────────────────┘
▸ Conexão manual (SDP) & log técnico                   (igual hoje)
```

- "+ Adicionar amigo" abre um painel na própria aba com duas partes: campo de ID e lista "Online agora no Salão".
- Status do P2P (`#p2p-status-banner`) continua existindo, mas vira uma faixa fina acima dos cards, só aparece quando há algo acontecendo (sala aberta, conectando, convite pendente).
- Amigo offline mostra "visto há …" a partir de `lastSeen`.
- Visual segue o resto do Hub: cards escuros com borda azul `#38bdf8`, botão de convite dourado, bolinha verde `#4ade80`.
- Em paisagem baixa já há a escala do v725; nada especial.

### Onde o código entra

- Novo `js/ui/friends_screen.js` (carregado por último, depois de `battle_scene.js`): dados, pacotes, pop-ups, render da aba. Faz monkey-patch de `handleIncomingSalaoMessage` (para os tipos `FRIEND_*`), de `showWinResultScreen` (botão pós-partida) e de `cleanupActiveP2PSession` (limpar convite pendente).
- `p2p_matchmaker.js`: `salaoKnownTrainers` passa a guardar `trainerId`; `connectToGlobalSalao()` também é chamado no boot se há amigos. O `BroadcastChannel("pokeduel_v600_salao")` (`rankedMatchmakerChannel`) hoje só é criado ao abrir o matchmaking ranqueado; passa a ser criado junto com o Salão, para que duas abas no mesmo aparelho (e os testes) troquem pacotes `FRIEND_*` sem depender do broker. Pequeno.
- HTML (os dois): `#dtab-p2p` reorganizado; os elementos com id que o JS usa (`host-room-code-display`, `room-code-input`, `p2p-status-*`, `salao-count-label`, `tcp-log`…) continuam com os mesmos ids.
- `sw.js`: `CORE_ASSETS` + `CACHE_NAME` v728. `tr/900_manual.txt` com os textos novos; `i18n_dict.js` editado à mão (build.py não existe).
- `AI_HANDOFF.md`: §1, §4 (ordem de carga), §7.

### Testes (Playwright, fora do repo como os demais)

- Dois navegadores (contextos) na mesma máquina: o Salão real (MQTT público) pode estar bloqueado no ambiente; o `BroadcastChannel` do matchmaking (`rankedMatchmakerChannel`) já replica `publishSalaoPacket` entre abas do mesmo navegador — usar isso para testar pedido/aceite/convite ponta a ponta num único Chromium com duas páginas.
- Casos: pedido → aceite → amigos nos dois lados; recusa; convite → aceite → partida começa com `state.mode === "p2p"` nos dois; convite → recusa; convite com destinatário em partida → `busy`; timeout de convite; remover amigo; pop-ups não aparecem durante partida; a sala por código continua funcionando igual.

## O que fica para o construtor

- Aparência exata dos pop-ups (reusar a classe `.ds-modal`/`.ds-panel` de `duel_screens.js`).
- Textos finais em PT/EN/ES.
