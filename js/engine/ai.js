// ============================================================================
// ADAPTIVE COUNTER-TEAM & 2-PLY MINIMAX LOOKAHEAD AI ENGINE (v5.9.0 — camada de valor tático)
// ============================================================================
// UNIFIED ADAPTIVE STRATEGIC RANKED AI:
// - 28-Node Exact Heatmap & Move Transition Predictor (fromNode -> toNode)
// - 3-Turn Adaptive Opening Book & Counter-Deploy Engine
// - Mid-Match Live Telemetry Adaptation & Carry-Unit Threat Targeting
// - Progressive Difficulty Scaling (Elastic Noise, Dynamic Lv/CLv & Streak Scaling)
// - 2-Ply Minimax Lookahead + Counter-Deck Builder + Tactical Plates
// ============================================================================

const AI_BRAIN_STORAGE_KEY = "pdr_adaptive_ai_brain_v580";
const LEGACY_BRAIN_KEY     = "pdr_adaptive_ai_brain_v570";
const FIRST_TURN_HIST_KEY  = "pdr_first_turn_hist_v530";

function loadAdaptiveAIBrain() {
  const defaultBrain = {
    version: "5.9.0",
    matchesAnalyzed: 0,
    aiWins: 0,
    playerWins: 0,
    playerWinStreak: 0,
    // Escala de dificuldade dinâmica: 0.0 (Iniciante) até 1.0 (Grandmaster Implacável)
    difficultyScale: 0.35,
    // Ruído tático (quanto maior, mais sub-ótimo o bot joga; cai para 0 conforme você vence)
    tacticalNoise: 3200,
    laneHeatmap: { left: 2, center: 2, right: 2 },
    // Frequência exata em cada um dos 28 nós do grafo
    nodeHeatmap: {},
    // Matriz de hábito de movimento: { "from_to": contagem } ex: { "7_14": 5 }
    transitionHabits: {},
    // Histórico de uso de Plates pelo jogador para antecipar saltos e ataques
    playerPlateHabits: { hurdle: 0, double: 0, xatk: 0, goalblock: 0, other: 0 },
    playerGoalRushMoves: 0,
    playerEntryBlockMoves: 0,
    playerSurroundKOs: 0,
    playerPlateUses: 0,
    playerAttacks: 0,
    playerFavBaseIds: {},
    // Registro de quais figuras do jogador mais causam KOs ou vitórias
    playerCarryKills: {},
    // Livro de Abertura Adaptativo (3 primeiros turnos)
    openingBook: {
      nodes: {}
    },
    weights: {
      goalDefense: 1.65,
      antiSurround: 1.30,
      entryLockdown: 1.45,
      combatAggression: 1.55,
      speedRush: 1.75,
      habitIntercept: 1.50
    }
  };

  try {
    const raw = localStorage.getItem(AI_BRAIN_STORAGE_KEY) || localStorage.getItem(LEGACY_BRAIN_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.weights) {
        return {
          ...defaultBrain,
          ...parsed,
          version: "5.9.0",
          laneHeatmap: { ...defaultBrain.laneHeatmap, ...(parsed.laneHeatmap || {}) },
          nodeHeatmap: { ...defaultBrain.nodeHeatmap, ...(parsed.nodeHeatmap || {}) },
          transitionHabits: { ...defaultBrain.transitionHabits, ...(parsed.transitionHabits || {}) },
          playerPlateHabits: { ...defaultBrain.playerPlateHabits, ...(parsed.playerPlateHabits || {}) },
          openingBook: parsed.openingBook || defaultBrain.openingBook,
          weights: { ...defaultBrain.weights, ...(parsed.weights || {}) }
        };
      }
    }
  } catch (e) {}
  return defaultBrain;
}

let adaptiveAIBrain = loadAdaptiveAIBrain();

function saveAdaptiveAIBrain() {
  try {
    localStorage.setItem(AI_BRAIN_STORAGE_KEY, JSON.stringify(adaptiveAIBrain));
  } catch (e) {}
}

// Utilitário no console para inspecionar ou resetar a evolução da IA
window.inspectAIBrain = () => adaptiveAIBrain;
window.resetAIBrain = () => {
  localStorage.removeItem(AI_BRAIN_STORAGE_KEY);
  localStorage.removeItem(LEGACY_BRAIN_KEY);
  adaptiveAIBrain = loadAdaptiveAIBrain();
  return adaptiveAIBrain;
};

// Precompute exact 28x28 Shortest-Path Graph BFS distance matrix on the 28-node topology
const NODE_BFS_DIST = Array.from({ length: 28 }, () => Array(28).fill(99));
(function buildNodeBfsMatrix() {
  for (let src = 0; src < 28; src++) {
    NODE_BFS_DIST[src][src] = 0;
    const q = [src];
    while (q.length > 0) {
      const cur = q.shift();
      const d = NODE_BFS_DIST[src][cur];
      (ADJ[cur] || []).forEach(nb => {
        if (NODE_BFS_DIST[src][nb] > d + 1) {
          NODE_BFS_DIST[src][nb] = d + 1;
          q.push(nb);
        }
      });
    }
  }
})();

function getNodeLaneCategory(nodeId) {
  if ([0, 1, 7, 8, 14, 15, 16, 20, 23, 25].includes(nodeId)) return "left";
  if ([4, 5, 6, 12, 13, 17, 18, 19, 22, 24, 27].includes(nodeId)) return "right";
  return "center";
}

function getPlayerPreferredLane() {
  const h = adaptiveAIBrain.laneHeatmap || { left: 1, center: 1, right: 1 };
  if (h.left >= h.right && h.left >= h.center) return "left";
  if (h.right >= h.left && h.right >= h.center) return "right";
  return "center";
}

// Retorna o fator de hábito (0.0 a 1.0) de um nó específico baseado no histórico do jogador
function getNodeHabitFactor(nodeId) {
  const map = adaptiveAIBrain.nodeHeatmap || {};
  const vals = Object.values(map);
  if (vals.length === 0) return 0;
  const maxVal = Math.max(1, ...vals);
  return (map[nodeId] || 0) / maxVal;
}

// Prevê quais nós o jogador tem maior probabilidade de pisar no próximo turno com base nos seus vícios de rota
function getPredictedPlayerNextNodes(enemyRole) {
  const predicted = {};
  const habits = adaptiveAIBrain.transitionHabits || {};
  const enemyUnits = state.units.filter(u => u.owner === enemyRole && u.location === "board" && typeof u.nodeId === "number");

  enemyUnits.forEach(eu => {
    const fromId = eu.nodeId;
    let totalFromHere = 0;
    const candidates = [];

    for (let toId = 0; toId < 28; toId++) {
      if (toId !== fromId && NODE_BFS_DIST[fromId][toId] <= (eu.mp || 2)) {
        const count = habits[`${fromId}_${toId}`] || 0;
        if (count > 0) {
          totalFromHere += count;
          candidates.push({ toId, count });
        }
      }
    }

    if (totalFromHere > 0) {
      candidates.forEach(c => {
        const prob = c.count / totalFromHere;
        predicted[c.toId] = Math.max(predicted[c.toId] || 0, prob);
      });
    }
  });

  return predicted;
}

// ============================================================================
// ADAPTIVE 3-TURN OPENING BOOK & COUNTER-DEPLOY ENGINE (v5.8.5)
// ============================================================================

(function ensureOpeningBookSchema() {
  if (!adaptiveAIBrain.openingBook) {
    adaptiveAIBrain.openingBook = {
      nodes: {}
    };
    saveAdaptiveAIBrain();
  }
})();

function getOpeningSeqNode(seqKey) {
  if (!adaptiveAIBrain.openingBook) {
    adaptiveAIBrain.openingBook = { nodes: {} };
  }
  if (!adaptiveAIBrain.openingBook.nodes[seqKey]) {
    adaptiveAIBrain.openingBook.nodes[seqKey] = {
      total: 0,
      lossesAgainst: 0,
      nextMoves: {},
      aiResponses: {}
    };
  }
  return adaptiveAIBrain.openingBook.nodes[seqKey];
}

// Calcula a diretriz tática do Livro de Aberturas para o turno atual da IA
function computeOpeningBookDirective(owner, enemyRole) {
  const tele = state.currentMatchTelemetry || {};
  const p1Seq = tele.p1OpeningSeq || [];
  const aiHist = tele.aiOpeningHistory || [];

  // Só atua durante a fase de abertura (primeiros 3 turnos de cada lado)
  if (owner !== "p2" || aiHist.length >= 3 || p1Seq.length > 3) {
    return null;
  }

  const seqKey = p1Seq.length === 0 ? "START" : p1Seq.join("|");
  const bookEntry = getOpeningSeqNode(seqKey);

  // A) Descobre qual é a próxima jogada favorita do jogador a partir desta sequência
  let predictedNextNode = null;
  let predictedConfidence = 0;
  const nextMoves = bookEntry.nextMoves || {};
  const totalNext = Object.values(nextMoves).reduce((a, b) => a + b, 0);

  if (totalNext > 0) {
    let bestToken = null;
    let bestCount = 0;
    for (const [token, count] of Object.entries(nextMoves)) {
      if (count > bestCount) {
        bestCount = count;
        bestToken = token;
      }
    }
    if (bestToken) {
      const parts = bestToken.split("_");
      const parsedTarget = parseInt(parts[1], 10);
      if (!isNaN(parsedTarget)) {
        predictedNextNode = parsedTarget;
        predictedConfidence = bestCount / totalNext;
      }
    }
  }

  // B) Identifica a última casa ocupada pelo P1 na abertura e a peça usada
  let lastP1Node = null;
  let lastP1Unit = null;
  if (p1Seq.length > 0) {
    const lastToken = p1Seq[p1Seq.length - 1];
    const parsedLast = parseInt(lastToken.split("_")[1], 10);
    if (!isNaN(parsedLast)) {
      lastP1Node = parsedLast;
      lastP1Unit = unitAtNode(lastP1Node);
    }
  }

  // C) Calcula os "Chokepoints" (nós que trancam o caminho entre o ataque do P1 e os pontos vitais 0, 6 e 3 da IA)
  const vitalAINodes = [0, 6, 3];
  const chokepointScores = {};
  const threatNodes = [lastP1Node, predictedNextNode].filter(n => typeof n === "number");

  threatNodes.forEach((tNode, idx) => {
    const weight = (idx === 1 ? (0.7 + predictedConfidence) : 1.0);
    vitalAINodes.forEach(vitalId => {
      const currentDist = NODE_BFS_DIST[tNode][vitalId];
      for (let cand = 0; cand < 28; cand++) {
        // Se 'cand' está exatamente no caminho mais curto entre a ameaça do P1 e o ponto vital da IA
        if (
          NODE_BFS_DIST[tNode][cand] >= 1 &&
          NODE_BFS_DIST[tNode][cand] <= 2 &&
          NODE_BFS_DIST[tNode][cand] + NODE_BFS_DIST[cand][vitalId] === currentDist
        ) {
          chokepointScores[cand] = (chokepointScores[cand] || 0) + (8500 * weight);
        }
      }
    });
  });

  return {
    seqKey,
    bookEntry,
    predictedNextNode,
    predictedConfidence,
    lastP1Node,
    lastP1Unit,
    chokepointScores
  };
}

// Avalia o bônus/penalidade de um movimento candidato da IA durante os 3 primeiros turnos
function scoreOpeningBookCandidateMove(u, destNid, directive) {
  if (!directive) return { bonus: 0, tag: null };

  let bonus = 0;
  let tag = null;
  const fromKey = (u.location === "board" && typeof u.nodeId === "number") ? u.nodeId : "bench";
  const aiMoveToken = `${fromKey}_${destNid}`;
  const respStats = (directive.bookEntry.aiResponses || {})[aiMoveToken];

  // 1) Memória de Reforço: Evita respostas que já perderam antes e prioriza as que venceram
  if (respStats) {
    const netRecord = (respStats.wins || 0) - (respStats.losses || 0);
    if (netRecord < 0) {
      // Penalidade severa para a IA não repetir a mesma abertura que já levou derrota contra você
      bonus -= Math.abs(netRecord) * 18000;
    } else if (netRecord > 0) {
      bonus += netRecord * 9500;
      tag = `📖 Livro de Abertura: Resposta Comprovada (${u.name} → nó ${destNid})`;
    }
  }

  // 2) Roubo de Casa Prevista: Ocupa exatamente o nó que você costuma usar no próximo turno
  if (directive.predictedNextNode !== null && destNid === directive.predictedNextNode && directive.predictedConfidence >= 0.35) {
    bonus += 16500 * (0.5 + directive.predictedConfidence);
    tag = `📖 Leitura de Abertura (${Math.round(directive.predictedConfidence * 100)}%): Trancando nó ${destNid} com ${u.name}!`;
  }

  // 3) Posicionamento em Chokepoint (Corta a linha de infiltração para os Entry Points 0/6 e Goal 3)
  if (directive.chokepointScores[destNid]) {
    bonus += directive.chokepointScores[destNid];
    if (!tag) {
      tag = `📖 Contra-Abertura: Bloqueando corredor no nó ${destNid} com ${u.name}`;
    }
  }

  // 4) Counter-Deploy Inteligente do Banco: Escolhe a peça da IA que ganha na roleta contra a sua peça de abertura
  if (u.location === "bench" && directive.lastP1Unit && typeof directive.lastP1Node === "number") {
    const distToP1Opener = NODE_BFS_DIST[destNid][directive.lastP1Node];
    if (distToP1Opener <= 3) {
      const odds = computeDuelDbOdds(u, directive.lastP1Unit);
      const netAdvantage = odds.win - odds.loss;
      if (netAdvantage >= 10) {
        bonus += netAdvantage * 260;
        tag = `📖 Counter-Deploy: ${u.name} (${Math.round(odds.win)}% Win) para caçar ${directive.lastP1Unit.name}!`;
      } else if (netAdvantage <= -15) {
        // Evita descer uma peça do banco que seja presa fácil para o seu runner de abertura
        bonus -= Math.abs(netAdvantage) * 220;
      }
    }
  }

  return { bonus, tag };
}

// 1. Upgrade `getActiveWheel` so unit-level `unit.level` and `unit.clv` apply to AI units
const _v540GetActiveWheel = getActiveWheel;
getActiveWheel = function(unit) {
  const segs = _v540GetActiveWheel(unit).map(s => ({ ...s }));
  if (!unit) return segs;

  const uLv = Math.max(1, Math.min(10, unit.level || 1));
  if (uLv > 1) {
    let missReduceRem = uLv - 1;
    let bestNonRedIdx = 0;
    let bestScore = -1;
    segs.forEach((s, idx) => {
      if (s.color !== "red") {
        const sc = (s.dmg || 0) + (s.stars || 0) * 35 + (s.color === "gold" ? 25 : 0) + (s.size || 0);
        if (sc > bestScore) { bestScore = sc; bestNonRedIdx = idx; }
      }
    });
    segs.forEach(s => {
      if (s.color === "red" && s.size > 4 && missReduceRem > 0) {
        const take = Math.min(missReduceRem, s.size - 4);
        if (take > 0) {
          s.size -= take;
          segs[bestNonRedIdx].size += take;
          missReduceRem -= take;
        }
      }
    });
  }

  if (unit.owner === "p2" && (unit.clv || 0) > 0) {
    const extraClv = Math.min(10, unit.clv || 0);
    segs.forEach((s, idx) => {
      if (s.dmg > 0 && idx > 0) {
        s.dmg += extraClv;
      }
    });
  }
  return segs;
};

// 2. Build an Adaptive Counter-Deck that scales with the AI's learned difficulty & player's favorite units
function analyzePlayerDeckAndBuildCounterTeam() {
  const p1Indices = (state.deckP1 && state.deckP1.length === 6) ? state.deckP1 : [1, 2, 3, 4, 6, 0];
  let totalPurpleSlices = 0;
  let totalGoldSlices   = 0;
  let totalWhiteHeavy   = 0;
  let runner3MpCount    = 0;
  let maxPlayerLevel    = 5;
  let maxPlayerClv      = 3;

  p1Indices.forEach(idx => {
    const f = FIGURES_DB[idx % FIGURES_DB.length] || FIGURES_DB[0];
    if ((f.level || 1) > maxPlayerLevel) maxPlayerLevel = f.level;
    if ((f.clv || 0) > maxPlayerClv) maxPlayerClv = f.clv;
    if (f.mp >= 3) runner3MpCount++;
    adaptiveAIBrain.playerFavBaseIds[f.id] = (adaptiveAIBrain.playerFavBaseIds[f.id] || 0) + 1;

    // Se essa figura é um "carry" frequente do jogador, dobra o peso de contra-ataque para o perfil dela
    const carryMultiplier = 1 + Math.min(1.5, ((adaptiveAIBrain.playerCarryKills[f.id] || 0) * 0.15));

    (f.wheel || []).forEach(w => {
      if (w.color === "purple") totalPurpleSlices += (w.size || 0) * carryMultiplier;
      if (w.color === "gold")   totalGoldSlices   += (w.size || 0) * carryMultiplier;
      if ((w.color === "white" || w.color === "gold") && (w.dmg || 0) >= 100) {
        totalWhiteHeavy += (w.size || 0) * carryMultiplier;
      }
    });
  });
  saveAdaptiveAIBrain();

  const pElo = (window.trainerProfileData && window.trainerProfileData.rankRating) ? window.trainerProfileData.rankRating : 1000;
  const isRankedMatch = (state.matchKind === "league");
  const diffScale = Math.max(0.2, Math.min(1.0, adaptiveAIBrain.difficultyScale || 0.35));

  const scoredCandidates = FIGURES_DB.map((f, idx) => {
    const wList = f.wheel || [];
    const goldSize   = wList.filter(w => w.color === "gold").reduce((s, w) => s + (w.size || 0), 0);
    const purpleSize = wList.filter(w => w.color === "purple").reduce((s, w) => s + (w.size || 0), 0);
    const blueSize   = wList.filter(w => w.color === "blue").reduce((s, w) => s + (w.size || 0), 0);
    const missSize   = wList.filter(w => w.color === "red").reduce((s, w) => s + (w.size || 0), 0);
    const maxDmg     = wList.reduce((m, w) => Math.max(m, w.dmg || 0), 0);
    const maxStars   = wList.reduce((m, w) => Math.max(m, w.stars || 0), 0);
    const rarBonus   = (f.rarity === "UX" ? 95 : (f.rarity === "EX" ? 75 : (f.rarity === "R" ? 30 : 0))) * diffScale;

    let score = rarBonus + maxDmg * 0.85 + maxStars * 26 + goldSize * 0.95 + purpleSize * 0.75 + blueSize * 0.80 - missSize * 1.2;

    // Pesos de counter-pick proporcionais ao nível de adaptação do bot
    if (totalPurpleSlices >= 60 && goldSize >= 20) score += goldSize * 2.5 * diffScale;
    if (totalWhiteHeavy >= 90 && (purpleSize >= 24 || maxStars >= 3 || maxDmg >= 140)) {
      score += (purpleSize * 1.8 + maxStars * 25) * diffScale;
    }
    if (runner3MpCount >= 2 && (f.canPassThrough || f.mp >= 3 || blueSize >= 20 || maxDmg >= 130)) {
      score += 55 * diffScale;
    }
    if (f.canPassThrough) score += 45 * diffScale;

    score += (Math.random() * (28 - diffScale * 16));
    return { idx, f, score, mp: f.mp, goldSize, purpleSize, blueSize, maxDmg, maxStars, pass: Boolean(f.canPassThrough) };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);

  let chosenIndices = [];
  if (state.isBotDeckLocked && Array.isArray(state.deckP2) && state.deckP2.length === 6) {
    chosenIndices = [...state.deckP2];
    state.isBotDeckLocked = false;
  } else if (typeof generateAdaptiveCompetitiveBotDeck === "function") {
    const gen = generateAdaptiveCompetitiveBotDeck(pElo, p1Indices);
    chosenIndices = [...gen.deck];
    state.deckP2 = chosenIndices.slice(0, 6);
    if (gen.trainer) {
      window.adaptiveAIOpponentName = gen.trainer.name;
    }
  } else {
    const pickWhere = (pred) => {
      for (const cand of scoredCandidates) {
        if (!chosenIndices.includes(cand.idx) && pred(cand)) {
          chosenIndices.push(cand.idx);
          return;
        }
      }
    };

    pickWhere(c => c.mp >= 3 && (c.pass || c.goldSize >= 20));
    pickWhere(c => c.mp >= 3 && (c.maxDmg >= 90 || c.purpleSize >= 20 || c.goldSize >= 16));
    pickWhere(c => c.mp === 2 && c.maxDmg >= 130 && c.goldSize >= 16);
    pickWhere(c => c.mp === 2 && c.maxDmg >= 135);
    pickWhere(c => c.maxStars >= 2 && c.purpleSize >= 24 && c.mp >= 2);
    pickWhere(c => c.mp >= 2 && (c.blueSize >= 16 || c.maxDmg >= 130));
    while (chosenIndices.length < 6) {
      pickWhere(() => true);
    }
    state.deckP2 = chosenIndices.slice(0, 6);
  }

  const prefLane = getPlayerPreferredLane();
  const laneNames = { left: "Anti-Flanco Esq.", right: "Anti-Flanco Dir.", center: "Tranca Central" };
  const adaptPct = Math.round(diffScale * 100);
  const aiNamesByTier = [
    { min: 2100, name: `Karolin [IA Grandmaster · ${adaptPct}%]` },
    { min: 1600, name: `No.9 [IA Adaptativa · ${adaptPct}%]` },
    { min: 1200, name: `Don Roger [IA Master · ${adaptPct}%]` },
    { min: 0,    name: `N.O.V.A. [IA Evolutiva · ${adaptPct}%]` }
  ];
  const tierObj = aiNamesByTier.find(t => pElo >= t.min) || aiNamesByTier[aiNamesByTier.length - 1];
  window.adaptiveAIOpponentName = tierObj.name;
  window.adaptiveAIDiagnosticSummary = `${tierObj.name} (${laneNames[prefLane]})`;

  // Escala progressiva de Level e CLv baseada nas vitórias do jogador e difficultyScale
  const bonusLv  = Math.round(diffScale * 4);
  const bonusClv = Math.round(diffScale * 6);
  const targetAiLv  = isRankedMatch ? Math.min(10, Math.max(4, maxPlayerLevel - 1 + bonusLv)) : Math.max(3, maxPlayerLevel);
  const targetAiClv = isRankedMatch ? Math.min(10, Math.max(1, maxPlayerClv - 1 + bonusClv))   : Math.max(1, maxPlayerClv);

  return { chosenIndices, avgPlayerLevel: targetAiLv, avgPlayerClv: targetAiClv, pElo, isRankedMatch, diffScale };
}

// Fair 50/50 First-Turn Roulette Roll with Anti-Streak Balancing
function rollFairFirstTurnWinner() {
  if (state.matchKind === "tutorial") return "p1";
  let hist = [];
  try {
    const raw = localStorage.getItem(FIRST_TURN_HIST_KEY);
    if (raw) hist = JSON.parse(raw) || [];
  } catch (e) {}

  let winner;
  const n = hist.length;
  if (n >= 2 && hist[n - 1] === hist[n - 2]) {
    winner = (hist[n - 1] === "p1") ? "p2" : "p1";
  } else if (n === 0) {
    winner = "p2";
  } else {
    winner = (Math.random() < 0.5) ? "p1" : "p2";
  }

  hist.push(winner);
  if (hist.length > 6) hist = hist.slice(-6);
  try { localStorage.setItem(FIRST_TURN_HIST_KEY, JSON.stringify(hist)); } catch (e) {}
  return winner;
}

// 3. Equip AI with Tactical Plates (libera arsenal completo conforme difficultyScale sobe)
function initAITacticalPlates() {
  // v5.9.0: piso de dificuldade — Double Chance liberado desde a primeira partida
  const diffScale = Math.max(AI_MIN_DIFFICULTY, adaptiveAIBrain.difficultyScale || 0.35);
  state.aiPlates = [
    { id: "hurdle",    name: "Hurdle Jump",     cost: 2, used: false },
    { id: "goalblock", name: "Goal Block",      cost: 2, used: false },
    { id: "xatk",      name: "X Attack",        cost: 1, used: false },
    { id: "xspeed",    name: "X Speed",         cost: 1, used: false }
  ];
  // Desbloqueia Double Chance e Mega Plate conforme o bot evolui contra você
  if (diffScale >= 0.45) {
    state.aiPlates.push({ id: "double", name: "Double Chance", cost: 1, used: false });
  }
  if (diffScale >= 0.65) {
    state.aiPlates.push({ id: "megaplate", name: "Mega Plate [UX]", cost: 1, used: false });
  }
}

// Unified startVideoAuthenticMatch Hook (com Opening Book tracking)
const _v580StartVideoAuthenticMatch = startVideoAuthenticMatch;
startVideoAuthenticMatch = function() {
  tutorialStepBusy = false;
  currentTutorialStep = 0;
  if (typeof hideTutorialCoachHud === "function") hideTutorialCoachHud();
  const tourHud = document.getElementById("tutorial-hub-tour-hud");
  if (tourHud) tourHud.style.display = "none";
  if (state.matchKind === "tutorial") {
    state.matchKind = "league";
  }
  state.isAnimating = false;
  activePieceAnim = null;

  state.currentMatchTelemetry = {
    playerGoalRushes: 0,
    playerEntryThreats: 0,
    playerSurroundThreats: 0,
    playerAttacks: 0,
    laneMoves: { left: 0, center: 0, right: 0 },
    unitDangerScore: {}, // Rastreia qual peça do jogador está dominando a partida atual
    p1OpeningSeq: [],    // Até 3 tokens: ex ["bench_14", "14_20", "bench_16"]
    p1OpeningUnits: [],  // UIDs das peças que o P1 moveu na abertura
    aiOpeningHistory: [] // Respostas dadas pela IA nos 3 primeiros turnos
  };

  const meta = analyzePlayerDeckAndBuildCounterTeam();
  _v580StartVideoAuthenticMatch();
  initAITacticalPlates();

  state.units.filter(u => u.owner === "p2").forEach(u => {
    u.level    = meta.avgPlayerLevel;
    u.clv      = meta.avgPlayerClv;
    u.evoStage = (meta.isRankedMatch && meta.diffScale >= 0.55) ? 1 : 0;
  });

  const firstTurnWinner = rollFairFirstTurnWinner();
  state.turn = firstTurnWinner;
  state.turnCounter = 300;
  state.preMatchAnim = {
    t0: performance.now(),
    firstWinner: firstTurnWinner,
    aiFired: false
  };

  const oppName = window.adaptiveAIOpponentName || "IA Estratégica";
  if (firstTurnWinner === "p1") {
    setLogText(`🎲 Roleta: VOCÊ começa o duelo (1º Turno: -1 MP) contra ${oppName}!`);
  } else {
    setLogText(`🎲 Roleta: ${oppName} ganhou o 1º Turno (-1 MP) e vai começar!`);
  }
};

// Observe every move made by P1 to update 28-node heatmap, transition habits & 3-turn opening book
const _v580ExecuteMove = executeMove;
executeMove = function(uid, targetNodeId, broadcast, customSegments, remotePacket) {
  const u = state.units.find(x => x.uid === uid);
  const prevNodeId = (u && typeof u.nodeId === "number") ? u.nodeId : "bench";

  if (u && state.matchKind !== "tutorial" && typeof targetNodeId === "number") {
    if (!state.currentMatchTelemetry) {
      state.currentMatchTelemetry = {
        playerGoalRushes: 0,
        playerEntryThreats: 0,
        playerSurroundThreats: 0,
        playerAttacks: 0,
        laneMoves: { left: 0, center: 0, right: 0 },
        unitDangerScore: {},
        p1OpeningSeq: [],
        p1OpeningUnits: [],
        aiOpeningHistory: []
      };
    }
    const tele = state.currentMatchTelemetry;
    if (!Array.isArray(tele.p1OpeningSeq)) tele.p1OpeningSeq = [];
    if (!Array.isArray(tele.p1OpeningUnits)) tele.p1OpeningUnits = [];
    if (!Array.isArray(tele.aiOpeningHistory)) tele.aiOpeningHistory = [];

    const moveToken = `${prevNodeId}_${targetNodeId}`;

    if (u.owner === "p1") {
      // 1. Atualiza Heatmap da Lane e do Nó Exato (0..27)
      const lane = getNodeLaneCategory(targetNodeId);
      adaptiveAIBrain.laneHeatmap[lane] = (adaptiveAIBrain.laneHeatmap[lane] || 0) + 1;
      adaptiveAIBrain.nodeHeatmap[targetNodeId] = (adaptiveAIBrain.nodeHeatmap[targetNodeId] || 0) + 1;
      tele.laneMoves[lane] = (tele.laneMoves[lane] || 0) + 1;

      // 2. Registra hábito de transição (origem -> destino) para prever próximos passos
      adaptiveAIBrain.transitionHabits[moveToken] = (adaptiveAIBrain.transitionHabits[moveToken] || 0) + 1;

      // 3. Detecta Uso de Hurdle Jump pelo jogador
      if (state.abilityJumpActive) {
        adaptiveAIBrain.playerPlateHabits.hurdle = (adaptiveAIBrain.playerPlateHabits.hurdle || 0) + 1;
        adaptiveAIBrain.weights.antiSurround = Math.min(3.4, (adaptiveAIBrain.weights.antiSurround || 1.30) + 0.06);
      }

      // 4. Detecta Goal Rush: jogador a até 3 passos do Goal da IA (nó 3)
      if (NODE_BFS_DIST[targetNodeId][3] <= 3) {
        adaptiveAIBrain.playerGoalRushMoves = (adaptiveAIBrain.playerGoalRushMoves || 0) + 1;
        adaptiveAIBrain.weights.goalDefense = Math.min(3.5, (adaptiveAIBrain.weights.goalDefense || 1.65) + 0.06);
        tele.playerGoalRushes += 1;
        tele.unitDangerScore[u.uid] = (tele.unitDangerScore[u.uid] || 0) + 25;
      }

      // 5. Detecta Ameaça de Bloqueio de Entry Point (nós 0 ou 6)
      if (targetNodeId === 0 || targetNodeId === 6 || NODE_BFS_DIST[targetNodeId][0] <= 1 || NODE_BFS_DIST[targetNodeId][6] <= 1) {
        adaptiveAIBrain.playerEntryBlockMoves = (adaptiveAIBrain.playerEntryBlockMoves || 0) + 1;
        adaptiveAIBrain.weights.entryLockdown = Math.min(3.2, (adaptiveAIBrain.weights.entryLockdown || 1.45) + 0.06);
        tele.playerEntryThreats += 1;
        tele.unitDangerScore[u.uid] = (tele.unitDangerScore[u.uid] || 0) + 18;
      }

      // 6. Livro de Abertura: Registra sequência dos 3 primeiros turnos do P1
      if (tele.p1OpeningSeq.length < 3) {
        const seqKey = tele.p1OpeningSeq.length === 0 ? "START" : tele.p1OpeningSeq.join("|");
        const bookEntry = getOpeningSeqNode(seqKey);
        bookEntry.total = (bookEntry.total || 0) + 1;
        bookEntry.nextMoves[moveToken] = (bookEntry.nextMoves[moveToken] || 0) + 1;

        tele.p1OpeningSeq.push(moveToken);
        tele.p1OpeningUnits.push({ uid: u.uid, targetNodeId });
      }

      saveAdaptiveAIBrain();
    } else if (u.owner === "p2" && tele.aiOpeningHistory.length < 3) {
      const activeSeqKey = tele.p1OpeningSeq.length === 0 ? "START" : tele.p1OpeningSeq.join("|");
      tele.aiOpeningHistory.push({
        seqKey: activeSeqKey,
        aiMoveToken: moveToken,
        destNid: targetNodeId
      });
    }
  }
  return _v580ExecuteMove(uid, targetNodeId, broadcast, customSegments, remotePacket);
};

// Track when an AI unit is sent to PC to learn anti-surround caution
const _v521SendToPC = sendToPC;
sendToPC = function(unit) {
  if (unit && unit.owner === "p2") {
    state.questEnemyKOs = (state.questEnemyKOs || 0) + 1;
    if (state.matchKind !== "tutorial") {
      adaptiveAIBrain.playerSurroundKOs = (adaptiveAIBrain.playerSurroundKOs || 0) + 1;
      adaptiveAIBrain.weights.antiSurround = Math.min(3.4, (adaptiveAIBrain.weights.antiSurround || 1.30) + 0.07);
      if (state.currentMatchTelemetry) {
        state.currentMatchTelemetry.playerSurroundThreats = (state.currentMatchTelemetry.playerSurroundThreats || 0) + 1;
      }
      saveAdaptiveAIBrain();
    }
  }
  return _v521SendToPC(unit);
};

// Track human player attacks & identify the player's carry unit
if (typeof triggerCombat === "function") {
  const _v560TriggerCombat = triggerCombat;
  triggerCombat = function(atkUnit, defUnit, broadcast, forcedSpins) {
    if (atkUnit && atkUnit.owner === "p1" && state.matchKind !== "tutorial") {
      adaptiveAIBrain.playerAttacks = (adaptiveAIBrain.playerAttacks || 0) + 1;
      adaptiveAIBrain.weights.combatAggression = Math.min(3.2, (adaptiveAIBrain.weights.combatAggression || 1.55) + 0.04);
      if (atkUnit.id) {
        adaptiveAIBrain.playerCarryKills[atkUnit.id] = (adaptiveAIBrain.playerCarryKills[atkUnit.id] || 0) + 1;
      }
      if (state.currentMatchTelemetry) {
        state.currentMatchTelemetry.playerAttacks = (state.currentMatchTelemetry.playerAttacks || 0) + 1;
        state.currentMatchTelemetry.unitDangerScore[atkUnit.uid] = (state.currentMatchTelemetry.unitDangerScore[atkUnit.uid] || 0) + 20;
      }
      saveAdaptiveAIBrain();
    }
    return _v560TriggerCombat(atkUnit, defUnit, broadcast, forcedSpins);
  };
}

// Helper: Check if a given player ('p1' or 'p2') can reach `targetNodeId` in 1 turn
function canSideReachNodeNextTurn(sideOwner, targetNodeId, ignoreUnitUid) {
  const units = state.units.filter(u =>
    u.owner === sideOwner &&
    u.uid !== ignoreUnitUid &&
    u.location !== "pc" &&
    u.location !== "ultra_space" &&
    u.waitTurns === 0 &&
    u.condition !== PokemonCondition.Sleep &&
    u.condition !== PokemonCondition.Freeze
  );
  for (const u of units) {
    if (u.location === "bench") {
      const entries = sideOwner === "p1" ? [7, 13] : [0, 6];
      for (const en of entries) {
        if (!unitAtNode(en) && NODE_BFS_DIST[en][targetNodeId] <= Math.max(0, u.mp - 1)) {
          return true;
        }
      }
    } else if (u.location === "board" && typeof u.nodeId === "number") {
      if (NODE_BFS_DIST[u.nodeId][targetNodeId] <= u.mp) {
        return true;
      }
    }
  }
  return false;
}

// Helper: Can ANY P1 unit reach `targetNodeId` in 1 turn from a simulated board state
function canEnemyReachNodeInSim(enemyRole, targetNodeId, getOccSimFn, includeHurdleJump) {
  const enemyUnits = state.units.filter(u =>
    u.owner === enemyRole &&
    u.location !== "pc" &&
    u.location !== "ultra_space" &&
    u.waitTurns === 0 &&
    u.condition !== PokemonCondition.Sleep &&
    u.condition !== PokemonCondition.Freeze
  );
  // Se o jogador tem hábito alto de usar Hurdle Jump, a IA sempre simula o salto como precaução
  const playerAbusesHurdle = ((adaptiveAIBrain.playerPlateHabits && adaptiveAIBrain.playerPlateHabits.hurdle) || 0) >= 2;
  const p1HasUnusedHurdle = includeHurdleJump && (
    playerAbusesHurdle ||
    (state.plates && state.plates.some(p => !p.disabledInDeck && !p.used && p.id === "hurdle"))
  );

  for (const eu of enemyUnits) {
    const mp = Math.max(1, eu.mp - (eu.condition === PokemonCondition.Paralyze ? 1 : 0));
    const canJump = Boolean((typeof isFigurePassThroughOrJumper === "function" ? isFigurePassThroughOrJumper(eu) : eu.canPassThrough) || p1HasUnusedHurdle);
    const visited = new Map();
    const queue = [];

    if (eu.location === "bench") {
      const entries = (enemyRole === "p1") ? [7, 13] : [0, 6];
      entries.forEach(en => {
        if (!getOccSimFn(en)) {
          visited.set(en, 1);
          queue.push({ id: en, dist: 1 });
        }
      });
    } else if (eu.location === "board") {
      if (getOccSimFn(eu.nodeId) !== eu) continue;
      visited.set(eu.nodeId, 0);
      queue.push({ id: eu.nodeId, dist: 0 });
    }

    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur.id === targetNodeId && cur.dist > 0) return true;
      if (cur.dist >= mp) continue;
      for (const nxt of ADJ[cur.id] || []) {
        const occ = getOccSimFn(nxt);
        if (!occ) {
          const nd = cur.dist + 1;
          if (nd <= mp && (!visited.has(nxt) || visited.get(nxt) > nd)) {
            visited.set(nxt, nd);
            queue.push({ id: nxt, dist: nd });
          }
        } else if (canJump) {
          const landDist = cur.dist + 2;
          if (landDist <= mp) {
            for (const beyond of ADJ[nxt] || []) {
              if (beyond !== cur.id && !getOccSimFn(beyond)) {
                if (!visited.has(beyond) || visited.get(beyond) > landDist) {
                  visited.set(beyond, landDist);
                  queue.push({ id: beyond, dist: landDist });
                }
              }
            }
          }
        }
      }
    }
  }
  return false;
}

// 6. Hook pass-through de computeReachableWithPaths
const _v580ComputeReachableHook = computeReachableWithPaths;
computeReachableWithPaths = function(unit) {
  return _v580ComputeReachableHook(unit);
};

// ============================================================================
// v5.9.0 TACTICAL VALUE LAYER — valor de peça, EV de combate e mapa de ameaça
// ============================================================================
// Teto do ruído tático: acima disso a IA não distingue um ataque bom de um ruim
// (os termos de combate ficam na casa de poucos milhares de pontos).
const AI_NOISE_CAP = 450;
const AI_MIN_DIFFICULTY = 0.55;

// Valor de uma peça em pontos de score (~14k a ~60k). Mede força de roleta e,
// para peças inimigas, o quanto ela ameaça o Goal da IA.
function aiUnitValue(unit, perspectiveOwner) {
  const w = getActiveWheel(unit) || [];
  const tot = w.reduce((s, x) => s + (x.size || 0), 0) || 96;
  let ev = 0;
  w.forEach(s => {
    const f = (s.size || 0) / tot;
    if (s.color === "white") ev += f * (s.dmg || 0);
    else if (s.color === "gold") ev += f * ((s.dmg || 0) + 35);
    else if (s.color === "purple") ev += f * (55 + (s.stars || 1) * 30);
    else if (s.color === "blue") ev += f * 45;
  });
  let v = 12000 + ev * 220;
  if (unit.rarity === "UX") v += 9000; else if (unit.rarity === "EX") v += 6000;
  if (unit.location === "board" && typeof unit.nodeId === "number") {
    const isEnemy = unit.owner !== perspectiveOwner;
    const goal = isEnemy ? (perspectiveOwner === "p1" ? 10 : 3) : (perspectiveOwner === "p1" ? 3 : 10);
    const d = NODE_BFS_DIST[unit.nodeId][goal];
    // Peça perto do Goal adversário vale mais (ataque) / peça inimiga perto do nosso Goal é prioridade
    v += Math.max(0, 6 - d) * (isEnemy ? 4500 : 3000);
    if (unit.nodeId === goal) v += isEnemy ? 0 : 8000;
  }
  return v;
}

// Expected value de um ataque em pontos: ganho esperado menos perda esperada.
function aiAttackEV(att, def, winPct, lossPct, owner) {
  return (winPct / 100) * aiUnitValue(def, owner) - (lossPct / 100) * aiUnitValue(att, owner) * 1.1;
}

// Para cada inimigo que pode agir no próximo turno: casas de onde ele consegue atacar.
function aiBuildEnemyStrikeMap(enemyRole) {
  const map = [];
  state.units.forEach(e => {
    if (e.owner !== enemyRole || e.location === "pc" || e.location === "ultra_space") return;
    if (e.condition === PokemonCondition.Sleep || e.condition === PokemonCondition.Freeze) return;
    if (e.waitTurns > 1) return;
    const from = new Set();
    if (e.location === "board" && typeof e.nodeId === "number") from.add(e.nodeId);
    if (e.waitTurns === 0) {
      try { (computeReachableWithPaths(e).nodes || []).forEach(n => from.add(n)); } catch (err) {}
    }
    if (from.size) map.push({ unit: e, from });
  });
  return map;
}

// Risco (em pontos) de deixar `unit` parada em `nid`: o pior ataque inimigo possível no próximo turno.
function aiExposureInfo(unit, nid, strikeMap, owner, ignoreUid) {
  const nbs = ADJ[nid] || [];
  let risk = 0, pKill = 0;
  strikeMap.forEach(({ unit: e, from }) => {
    if (e.uid === ignoreUid) return;
    if (!nbs.some(nb => from.has(nb))) return;
    const od = computeDuelDbOdds(e, unit);
    // Peça vinda do banco gasta o turno entrando e fica exposta: ameaça pesa menos
    const k = e.location === "bench" ? 0.6 : 1;
    const r = ((od.win / 100) * aiUnitValue(unit, owner) - (od.loss / 100) * aiUnitValue(e, owner) * 0.5) * k;
    if (r > risk) risk = r;
    if ((od.win / 100) * k > pKill) pKill = (od.win / 100) * k;
  });
  return { risk, pKill };
}

// ============================================================================
// MASTER ADAPTIVE 2-PLY MINIMAX AI ENGINE (`triggerPlayerAIMove` v5.8.5)
// ============================================================================
triggerPlayerAIMove = function() {
  if (state.matchKind === "tutorial" || state.isAnimating || state.winCelebrationAnim) return;
  // Segurança estrita: A IA só move para o bot P2 no modo solo 'ai', jamais em multiplayer ou vez do jogador!
  if (state.mode !== "ai" || state.turn !== "p2") return;

  // Handle post-move attack prompt if triggered
  if (state.postMoveAttackMode) {
    const sel = state.units.find(x => x.uid === state.selectedUnitId);
    let bestTargetNid = null;
    let bestNet = -999;
    (state.attackTargets || []).forEach(tNid => {
      const occ = unitAtNode(tNid);
      if (sel && occ) {
        const odds = computeDuelDbOdds(sel, occ);
        // v5.9.0: decide pelo valor esperado (ganho - perda ponderados pelo valor das peças)
        const goalCritical = (occ.nodeId === (sel.owner === "p1" ? 3 : 10)) ? 60000 : 0;
        const net = aiAttackEV(sel, occ, odds.win, odds.loss, sel.owner) + (odds.win / 100) * goalCritical;
        if (net > bestNet) { bestNet = net; bestTargetNid = tNid; }
      }
    });
    if (bestTargetNid !== null && bestNet > 0) {
      onNodeClicked(bestTargetNid);
      return;
    }
    finishPostMoveWithoutAttack();
    return;
  }

  const owner       = state.turn;
  const enemyRole   = owner === "p1" ? "p2" : "p1";
  const oppGoalId   = owner === "p1" ? 3 : 10;
  const myGoalId    = owner === "p1" ? 10 : 3;
  const oppEntryIds = owner === "p1" ? [0, 6] : [7, 13];
  const myEntryIds  = owner === "p1" ? [7, 13] : [0, 6];
  const aiTitle     = window.adaptiveAIOpponentName || "IA Adaptativa";

  const aiPlates       = (owner === "p2" && Array.isArray(state.aiPlates)) ? state.aiPlates : [];
  const hurdlePlate    = aiPlates.find(p => p.id === "hurdle"    && !p.used);
  const goalBlockPlate = aiPlates.find(p => p.id === "goalblock" && !p.used);
  const megaPlate      = aiPlates.find(p => p.id === "megaplate" && !p.used);
  const doublePlate    = aiPlates.find(p => p.id === "double"    && !p.used);
  const xAtkPlate      = aiPlates.find(p => p.id === "xatk"      && !p.used);
  const xSpdPlate      = aiPlates.find(p => p.id === "xspeed"    && !p.used);

  const myUnits = state.units.filter(u =>
    u.owner === owner &&
    u.location !== "pc" &&
    u.location !== "ultra_space" &&
    u.waitTurns === 0 &&
    u.condition !== PokemonCondition.Sleep &&
    u.condition !== PokemonCondition.Freeze
  );
  const enemyBoardUnits = state.units.filter(u => u.owner === enemyRole && u.location === "board");
  const enemyStrikeMap = aiBuildEnemyStrikeMap(enemyRole);

  if (myUnits.length === 0) {
    skipOrDemoTurn();
    return;
  }

  // STEP 1: CHECK IF AI CAN WIN IMMEDIATELY THIS TURN (NORMAL MOVE OR `HURDLE JUMP` PLATE)
  for (const u of myUnits) {
    const normRes = computeReachableWithPaths(u);
    if (normRes.nodes.includes(oppGoalId)) {
      setLogText(`🏆 ${aiTitle}: Xeque-Mate! ${u.name} avança direto para o Goal Point!`);
      state.aiHoldPositionNoAttack = true;
      state.aiPlannedAttackNode = null;
      state.aiExecutingNow = true;
      executeMove(u.uid, oppGoalId, true, normRes.paths[oppGoalId]);
      state.aiExecutingNow = false;
      return;
    }
  }

  if (hurdlePlate) {
    state.abilityJumpActive = true;
    for (const u of myUnits) {
      if (u.location === "board") {
        const jumpRes = computeReachableWithPaths(u);
        if (jumpRes.nodes.includes(oppGoalId)) {
          hurdlePlate.used = true;
          playSfx("portal");
          setLogText(`🦘 ${aiTitle} ativou Plate [Hurdle Jump] com ${u.name} — Xeque-Mate no Goal Point!`);
          state.aiHoldPositionNoAttack = true;
          state.aiPlannedAttackNode = null;
          state.aiExecutingNow = true;
          executeMove(u.uid, oppGoalId, true, jumpRes.paths[oppGoalId]);
          state.aiExecutingNow = false;
          return;
        }
      }
    }
    state.abilityJumpActive = false;
  }

  // STEP 2: ASSESS THREAT LEVEL & MID-MATCH TELEMETRY
  const myGoalOccupant = unitAtNode(myGoalId);
  const myGoalDefended = Boolean(myGoalOccupant && myGoalOccupant.owner === owner);

  let minEnemyStepsToMyGoal = 99;
  const threateningEnemies = [];
  enemyBoardUnits.forEach(eu => {
    const d = NODE_BFS_DIST[eu.nodeId][myGoalId];
    if (d < minEnemyStepsToMyGoal) minEnemyStepsToMyGoal = d;
    if (d <= eu.mp + 1) threateningEnemies.push(eu);
  });

  let threatLevel = 0;
  if (!myGoalDefended) {
    if (minEnemyStepsToMyGoal <= 2 || threateningEnemies.some(eu => NODE_BFS_DIST[eu.nodeId][myGoalId] <= eu.mp)) {
      threatLevel = 3;
    } else if (minEnemyStepsToMyGoal <= 4 || threateningEnemies.length > 0) {
      threatLevel = 2;
    } else if (minEnemyStepsToMyGoal <= 6) {
      threatLevel = 1;
    }
  } else {
    if (minEnemyStepsToMyGoal === 1) {
      threatLevel = 3;
    } else if (minEnemyStepsToMyGoal <= 2) {
      threatLevel = 2;
    } else if (minEnemyStepsToMyGoal <= 4) {
      threatLevel = 1;
    }
  }

  const goalInDanger = (threatLevel >= 2);
  const prefPlayerLane = getPlayerPreferredLane();
  const predictedPlayerNextNodes = getPredictedPlayerNextNodes(enemyRole);
  const tele = state.currentMatchTelemetry || {};

  // Pesos combinam a memória persistente + o que o jogador está fazendo NESTA partida em tempo real
  let wGoalDef    = Math.min(3.8, ((adaptiveAIBrain.weights && adaptiveAIBrain.weights.goalDefense)      || 1.65) + (tele.playerGoalRushes || 0) * 0.12);
  let wAntiSur    = Math.min(3.4, ((adaptiveAIBrain.weights && adaptiveAIBrain.weights.antiSurround)     || 1.30) + (tele.playerSurroundThreats || 0) * 0.15);
  let wEntryLk    = Math.min(3.4, ((adaptiveAIBrain.weights && adaptiveAIBrain.weights.entryLockdown)    || 1.45) + (tele.playerEntryThreats || 0) * 0.12);
  let wCombatAgg  = Math.min(3.4, ((adaptiveAIBrain.weights && adaptiveAIBrain.weights.combatAggression) || 1.55) + (tele.playerAttacks || 0) * 0.08);
  let wSpeedRush  = Math.min(3.6, ((adaptiveAIBrain.weights && adaptiveAIBrain.weights.speedRush)        || 1.75));
  let wHabitBlock = Math.min(3.5, ((adaptiveAIBrain.weights && adaptiveAIBrain.weights.habitIntercept)   || 1.50));

  if (threatLevel === 3) {
    wGoalDef   *= 2.5;
    wAntiSur   *= 1.8;
    wSpeedRush *= 0.45;
  } else if (threatLevel === 2) {
    wGoalDef   *= 1.8;
    wAntiSur   *= 1.4;
    wSpeedRush *= 0.75;
  }

  function computeFastestTurnsToWin(unit, fromNode) {
    if (fromNode === oppGoalId) return 0;
    const effectiveMp = Math.max(1, (unit.baseMp || unit.mp) - (unit.condition === PokemonCondition.Paralyze ? 1 : 0));
    const canJump = Boolean(unit.canPassThrough || (typeof isFigurePassThroughOrJumper === "function" && isFigurePassThroughOrJumper(unit)));

    const distMap = new Map();
    distMap.set(fromNode, 0);
    const q = [{ nid: fromNode, steps: 0, enemyBlockers: 0 }];
    let minTurns = 99;

    while (q.length > 0) {
      const cur = q.shift();
      if (cur.nid === oppGoalId) {
        const turns = Math.ceil(cur.steps / effectiveMp) + cur.enemyBlockers;
        if (turns < minTurns) minTurns = turns;
        continue;
      }
      if (cur.steps >= 10) continue;

      for (const nb of ADJ[cur.nid] || []) {
        const occ = unitAtNode(nb);
        let blocker = 0;
        if (occ && occ.owner !== owner && nb !== oppGoalId) {
          if (!canJump) blocker = 1;
        }
        const nSteps = cur.steps + 1;
        const nBlockers = cur.enemyBlockers + blocker;
        const cost = nSteps + nBlockers * 2;
        if (!distMap.has(nb) || distMap.get(nb) > cost) {
          distMap.set(nb, cost);
          q.push({ nid: nb, steps: nSteps, enemyBlockers: nBlockers });
        }
      }
    }
    return minTurns;
  }

  function simulate2PlyAfterAIMove(movingUnit, destNid) {
    const getOccAfterMove = (nid) => {
      if (nid === destNid) return movingUnit;
      const occ = unitAtNode(nid);
      if (occ && occ.uid === movingUnit.uid) return null;
      return occ;
    };

    const destNbs = ADJ[destNid] || [];
    const selfSurrounded = destNbs.length > 0 &&
      destNbs.every(nb => {
        const o = getOccAfterMove(nb);
        return o !== null && o.owner !== owner;
      });
    if (selfSurrounded) {
      return { selfSurrounded: true };
    }

    const enemyKOs = [];
    enemyBoardUnits.forEach(eu => {
      const nbs = ADJ[eu.nodeId] || [];
      if (nbs.length > 0 && nbs.every(nb => {
        const o = getOccAfterMove(nb);
        return o !== null && o.owner === owner;
      })) {
        enemyKOs.push(eu);
      }
    });

    const getOccPostKO = (nid) => {
      const o = getOccAfterMove(nid);
      if (o && enemyKOs.includes(o)) return null;
      return o;
    };

    // Nos níveis iniciais (difficultyScale < 0.3), a IA ainda não simula o Hurdle Jump do jogador no 2-Ply
    const simHurdleAware = (adaptiveAIBrain.difficultyScale || 0.35) >= 0.30;

    const goalOccupantAfter = getOccPostKO(myGoalId);
    let enemyCanCaptureMyGoalNextTurn = false;
    if (!goalOccupantAfter) {
      enemyCanCaptureMyGoalNextTurn = canEnemyReachNodeInSim(enemyRole, myGoalId, getOccPostKO, simHurdleAware);
    }

    let enemyCanSurroundMyGoalNextTurn = false;
    if (goalOccupantAfter && goalOccupantAfter.owner === owner) {
      const gNbs = ADJ[myGoalId] || [];
      const openGNbs = gNbs.filter(nb => getOccPostKO(nb) === null);
      const enemyGNbs = gNbs.filter(nb => { const o = getOccPostKO(nb); return o && o.owner !== owner; });
      if (openGNbs.length === 1 && enemyGNbs.length === (gNbs.length - 1) && canEnemyReachNodeInSim(enemyRole, openGNbs[0], getOccPostKO, simHurdleAware)) {
        enemyCanSurroundMyGoalNextTurn = true;
      } else if (openGNbs.length === 0 && enemyGNbs.length === gNbs.length) {
        enemyCanSurroundMyGoalNextTurn = true;
      }
    }

    let allySurroundTrapsNextTurn = 0;
    const allMyBoard = state.units.filter(u => u.owner === owner && (u.location === "board" || u.uid === movingUnit.uid));
    allMyBoard.forEach(au => {
      const curNid = (au.uid === movingUnit.uid) ? destNid : au.nodeId;
      if (typeof curNid !== "number") return;
      const nbs = ADJ[curNid] || [];
      const openNbs = nbs.filter(nb => getOccPostKO(nb) === null);
      const enemyNbs = nbs.filter(nb => {
        const o = getOccPostKO(nb);
        return o && o.owner !== owner;
      });
      if (openNbs.length === 1 && enemyNbs.length === (nbs.length - 1)) {
        if (canEnemyReachNodeInSim(enemyRole, openNbs[0], getOccPostKO, simHurdleAware)) {
          allySurroundTrapsNextTurn += 2;
        }
      }
    });

    let enemyPinnedCount = 0;
    enemyBoardUnits.forEach(eu => {
      if (enemyKOs.includes(eu)) return;
      const nbs = ADJ[eu.nodeId] || [];
      const openNbs = nbs.filter(nb => getOccPostKO(nb) === null);
      const myNbs = nbs.filter(nb => {
        const o = getOccPostKO(nb);
        return o && o.owner === owner;
      });
      if (openNbs.length === 1 && myNbs.length === (nbs.length - 1)) {
        enemyPinnedCount++;
      }
    });

    return {
      selfSurrounded: false,
      enemyKOs,
      enemyCanCaptureMyGoalNextTurn,
      enemyCanSurroundMyGoalNextTurn,
      allySurroundTrapsNextTurn,
      enemyPinnedCount
    };
  }

  // STEP 3: EVALUATE ALL CANDIDATE MOVES WITH HABIT INTERCEPTION & ELASTIC NOISE
  let bestAction = null;
  let bestScore  = -9999999;
  const currentNoiseMax = Math.min(AI_NOISE_CAP, Math.max(0, adaptiveAIBrain.tacticalNoise || 0));

  // Diretriz do Livro de Abertura para os primeiros turnos
  const openingDirective = computeOpeningBookDirective(owner, enemyRole);

  function evaluateUnitMoveSet(u, usingHurdlePlate) {
    if (usingHurdlePlate) state.abilityJumpActive = true;
    const res = computeReachableWithPaths(u);
    if (usingHurdlePlate) state.abilityJumpActive = false;

    const candidateNodes = [...res.nodes];
    if (!usingHurdlePlate && u.location === "board" && typeof u.nodeId === "number") {
      const hasAdjEnemyNow = (ADJ[u.nodeId] || []).some(nb => {
        const occ = unitAtNode(nb);
        return occ && occ.owner !== owner;
      });
      if (hasAdjEnemyNow) candidateNodes.push(u.nodeId);
    }

    let currentlyTrapped = false;
    if (u.location === "board" && typeof u.nodeId === "number") {
      const curNbs = ADJ[u.nodeId] || [];
      const openCur = curNbs.filter(nb => unitAtNode(nb) === null);
      const enCur = curNbs.filter(nb => { const o = unitAtNode(nb); return o && o.owner !== owner; });
      if (openCur.length === 1 && enCur.length === (curNbs.length - 1) && canEnemyReachNodeInSim(enemyRole, openCur[0], (nid) => unitAtNode(nid), true)) {
        currentlyTrapped = true;
      }
    }

    candidateNodes.forEach(nid => {
      const isStandingAttack = (!usingHurdlePlate && u.location === "board" && nid === u.nodeId);
      const sim = simulate2PlyAfterAIMove(u, nid);
      if (sim.selfSurrounded) return;

      if (usingHurdlePlate) {
        const highImpactJump = (
          sim.enemyKOs.length > 0 ||
          oppEntryIds.includes(nid) ||
          NODE_BFS_DIST[nid][oppGoalId] <= 1 ||
          (goalInDanger && nid === myGoalId)
        );
        if (!highImpactJump) return;
      }

      let moveScore = usingHurdlePlate ? -300 : 0;
      // v5.9.0: chance de a peça sobreviver ao contra-ataque. Bônus de avanço só contam se ela sobreviver.
      const expo = (nid !== oppGoalId) ? aiExposureInfo(u, nid, enemyStrikeMap, owner, null) : { risk: 0, pKill: 0 };
      const rushSurvive = Math.max(0.35, 1 - expo.pKill * 0.9);
      let reasonTag = usingHurdlePlate ? `Salto Ofensivo [Hurdle Jump] com ${u.name}` : `Avanço Tático com ${u.name}`;

      // 1. ABSOLUTE 2-PLY GOAL SAFETY
      if (nid !== oppGoalId) {
        if (sim.enemyCanCaptureMyGoalNextTurn) {
          moveScore -= 500000;
        }
        if (sim.enemyCanSurroundMyGoalNextTurn) {
          moveScore -= 380000;
        }
      }

      // 2. SURROUND KOs ACHIEVED
      if (!isStandingAttack && sim.enemyKOs.length > 0) {
        sim.enemyKOs.forEach(koUnit => {
          const carryBonus = (tele.unitDangerScore && tele.unitDangerScore[koUnit.uid]) ? tele.unitDangerScore[koUnit.uid] * 120 : 0;
          moveScore += (22000 + carryBonus) * wCombatAgg;
          if (koUnit.nodeId === oppGoalId) moveScore += 120000;
          if (threateningEnemies.includes(koUnit)) moveScore += 18000;
          if (oppEntryIds.includes(koUnit.nodeId)) moveScore += 14000 * wEntryLk;
        });
        reasonTag = `Cerco Relâmpago (Surround KO em ${sim.enemyKOs[0].name})`;
      }

      // 3. 2-PLY ANTI-SURROUND DISCIPLINE
      if (sim.allySurroundTrapsNextTurn > 0) {
        moveScore -= 24000 * sim.allySurroundTrapsNextTurn * wAntiSur;
      }
      if (currentlyTrapped && !isStandingAttack && sim.allySurroundTrapsNextTurn === 0) {
        moveScore += 6000 * wAntiSur;
        reasonTag = `Evasão Anti-Cerco com ${u.name}`;
      }

      // 4. OFFENSIVE PINCER SETUP
      if (!isStandingAttack && sim.enemyPinnedCount > 0) {
        moveScore += 4500 * sim.enemyPinnedCount * wCombatAgg;
      }

      // 5. INTERCEPTAÇÃO DE HÁBITOS DO JOGADOR (28 NÓS + TRANSIÇÕES + LANE PREFERIDA)
      const destLane = getNodeLaneCategory(nid);
      if (destLane === prefPlayerLane) {
        moveScore += 1800 * wHabitBlock;
      }
      const nodeHabit = getNodeHabitFactor(nid);
      if (nodeHabit > 0.25) {
        moveScore += nodeHabit * 4200 * wHabitBlock;
      }
      if (predictedPlayerNextNodes[nid]) {
        moveScore += predictedPlayerNextNodes[nid] * 7500 * wHabitBlock;
        if (predictedPlayerNextNodes[nid] >= 0.4 && reasonTag.startsWith("Avanço")) {
          reasonTag = `Leitura de Hábito: Bloqueando rota de ${u.name} no nó ${nid}`;
        }
      }

      // 5B. LIVRO DE ABERTURAS ADAPTATIVO (3 PRIMEIROS TURNOS)
      if (openingDirective && !isStandingAttack) {
        const openEval = scoreOpeningBookCandidateMove(u, nid, openingDirective);
        moveScore += openEval.bonus;
        if (openEval.tag && openEval.bonus >= 8000) {
          reasonTag = openEval.tag;
        }
      }

      // 6. FASTEST-WIN TURN METRIC
      const turnsToWin = computeFastestTurnsToWin(u, nid);
      if (nid === oppGoalId) {
        moveScore += 250000;
        reasonTag = `🏆 Vitória Imediata no Goal Point com ${u.name}!`;
      } else if (turnsToWin === 1) {
        moveScore += 88000 * wSpeedRush * rushSurvive;
        reasonTag = `⚡ Xeque Letal no Goal! (Vitória em 1 Turno com ${u.name})`;
      } else if (turnsToWin === 2) {
        moveScore += 48000 * wSpeedRush * rushSurvive;
        reasonTag = `🚀 Rota Direta de Xeque (2 Turnos com ${u.name})`;
      } else if (turnsToWin === 3) {
        moveScore += 26000 * wSpeedRush * rushSurvive;
      } else if (turnsToWin === 4) {
        moveScore += 14000 * wSpeedRush * rushSurvive;
      }

      // 7. EXPONENTIAL FORWARD GOAL PULL
      const distToOppGoal = NODE_BFS_DIST[nid][oppGoalId];
      const goalPull = Math.pow(Math.max(0, 13 - distToOppGoal), 3.2) * 26 * wSpeedRush;
      moveScore += goalPull * rushSurvive;

      if (distToOppGoal === 1) {
        moveScore += 16000 * wSpeedRush * rushSurvive;
        reasonTag = `Ameaça Imediata ao Goal Inimigo com ${u.name}!`;
      }

      // 8. ENTRY POINT LOCKDOWN
      if (oppEntryIds.includes(nid)) {
        const otherEntry = oppEntryIds.find(id => id !== nid);
        const otherOcc = otherEntry !== undefined ? unitAtNode(otherEntry) : null;
        const otherTakenByAI = Boolean(otherOcc && otherOcc.owner === owner);
        moveScore += (otherTakenByAI ? 95000 : 42000) * wEntryLk * rushSurvive;
        reasonTag = otherTakenByAI
          ? `🔒 Asfixia Dupla dos Entry Points (${u.name}) — Pressão Wait-Win!`
          : `⚡ Invasão do Entry Point Inimigo com ${u.name}!`;
      }

      // 9. GOAL DEFENSE & DEFENDER DISCIPLINE
      const distToMyGoal = NODE_BFS_DIST[nid][myGoalId];

      if (u.location === "board" && u.nodeId === myGoalId && nid !== myGoalId) {
        if (nid !== oppGoalId) {
          if (threatLevel >= 1 || minEnemyStepsToMyGoal <= 4) {
            moveScore -= 450000;
          } else {
            moveScore -= 150000;
          }
        }
      }

      if (!myGoalDefended) {
        if (nid === myGoalId && !sim.enemyCanCaptureMyGoalNextTurn) {
          const baseGoalWeight = (threatLevel >= 2 ? 180000 : 95000);
          moveScore += baseGoalWeight * wGoalDef;
          reasonTag = `🛡️ Trancamento do Goal Point (${u.name})`;
        } else if (distToMyGoal === 1 && !sim.enemyCanCaptureMyGoalNextTurn) {
          moveScore += (threatLevel >= 2 ? 75000 : 38000) * wGoalDef;
          reasonTag = `Guarda da Entrada do Goal com ${u.name}`;
        }
      } else if (myGoalDefended && u.nodeId !== myGoalId) {
        if (distToMyGoal === 1 && minEnemyStepsToMyGoal <= 2 && !sim.enemyCanCaptureMyGoalNextTurn) {
          moveScore += 55000 * wGoalDef;
          reasonTag = `Suporte Anti-Cerco ao Goal Defender com ${u.name}`;
        }
      }

      // 10. OPENING & BENCH DEPLOYMENT
      if (u.location === "bench") {
        const myBoardCount = state.units.filter(x => x.owner === owner && x.location === "board").length;
        if (myBoardCount < 3) moveScore += 2400;
        if (!myGoalDefended && distToMyGoal <= 3) {
          moveScore += 28000 * wGoalDef;
        }
        if (u.mp >= 3 && state.turnCounter >= 288) {
          moveScore += 16000 * wSpeedRush;
          reasonTag = `Blitz de Abertura com ${u.name} (3 MP)`;
        }
      }

      // 10B. v5.9.0 EXPOSIÇÃO: quanto o inimigo ganha atacando esta peça no próximo turno
      if (nid !== oppGoalId) {
        const stayingExposure = (u.location === "board" && typeof u.nodeId === "number")
          ? aiExposureInfo(u, u.nodeId, enemyStrikeMap, owner, null).risk : 0;
        // Penaliza o risco novo; sair de uma casa perigosa vira bônus
        moveScore -= expo.risk * 1.15 * wAntiSur;
        if (!isStandingAttack) moveScore += stayingExposure * 0.6;
      }

      // Aplicando Ruído Elástico (diminui até 0 conforme o bot aprende a jogar contra você)
      if (currentNoiseMax > 0 && nid !== oppGoalId && !sim.enemyCanCaptureMyGoalNextTurn) {
        moveScore += (Math.random() * 2 - 1) * currentNoiseMax;
      }

      // 11. EVALUATE COMBAT (BREAKTHROUGH ATTACKS VS TACTICAL HOLD)
      const adjEnemiesAtDest = [];
      (ADJ[nid] || []).forEach(adjId => {
        const occ = unitAtNode(adjId);
        if (occ && occ.owner !== owner && !sim.enemyKOs.includes(occ)) {
          adjEnemiesAtDest.push({ nodeId: adjId, unit: occ });
        }
      });

      if (adjEnemiesAtDest.length === 0) {
        if (!isStandingAttack && moveScore > bestScore) {
          bestScore = moveScore;
          bestAction = {
            type: "move",
            uid: u.uid,
            unitName: u.name,
            nid,
            segs: res.paths[nid],
            holdNoAttack: true,
            attackNode: null,
            plateToUse: usingHurdlePlate ? hurdlePlate : null,
            reasonTag
          };
        }
      } else {
        let bestTargetForThisMove = null;
        let bestAtkScoreForThisMove = -9999999;

        adjEnemiesAtDest.forEach(({ nodeId: enemyNid, unit: eu }) => {
          const baseOdds = computeDuelDbOdds(u, eu);
          const isGoalDefender = (eu.nodeId === oppGoalId);
          const isEntryDefender = oppEntryIds.includes(eu.nodeId);
          const isDirectBlocker = (NODE_BFS_DIST[eu.nodeId][oppGoalId] < distToOppGoal);
          // Prioridade extra para caçar a peça "carry" do jogador na partida atual
          const unitThreatBonus = (tele.unitDangerScore && tele.unitDangerScore[eu.uid]) ? tele.unitDangerScore[eu.uid] * 140 : 0;

          let chosenPlate = usingHurdlePlate ? hurdlePlate : null;
          let effectiveWin = baseOdds.win;
          let effectiveLoss = baseOdds.loss;

          if (!usingHurdlePlate) {
            const euWheel = getActiveWheel(eu);
            const euPurpleRatio = euWheel.filter(w => w.color === "purple").reduce((s, w) => s + (w.size || 0), 0) / 96;

            if (megaPlate && !u.megaTurns && (isGoalDefender || isEntryDefender || baseOdds.win < 70)) {
              chosenPlate = megaPlate;
              effectiveWin = Math.min(96, baseOdds.win + 24);
              effectiveLoss = Math.max(2, baseOdds.loss - 16);
            } else if (doublePlate && (isGoalDefender || isEntryDefender || (baseOdds.win >= 28 && baseOdds.win <= 78))) {
              const pWin = baseOdds.win / 100;
              effectiveWin = Math.round((pWin + (1 - pWin) * pWin) * 100);
              effectiveLoss = Math.round((baseOdds.loss / 100) * (1 - pWin) * 100);
              chosenPlate = doublePlate;
            } else if (xSpdPlate && euPurpleRatio >= 0.22 && baseOdds.win < 75) {
              chosenPlate = xSpdPlate;
              effectiveWin = Math.min(95, baseOdds.win + 25);
              effectiveLoss = Math.max(3, baseOdds.loss - 18);
            } else if (xAtkPlate && (isGoalDefender || isEntryDefender || (baseOdds.win >= 35 && baseOdds.win <= 68))) {
              chosenPlate = xAtkPlate;
              effectiveWin = Math.min(94, baseOdds.win + 20);
              effectiveLoss = Math.max(4, baseOdds.loss - 15);
            }
          }

          const effectiveNet = effectiveWin - effectiveLoss;

          if (nid === myGoalId) {
            const mustAttackToSurvive = sim.enemyCanSurroundMyGoalNextTurn;
            if (!mustAttackToSurvive && (effectiveWin < 72 || effectiveLoss > 14)) {
              return;
            }
          }

          // v5.9.0: ataque só quando o valor esperado compensa (ou quando é estratégico)
          const attackEV = aiAttackEV(u, eu, effectiveWin, effectiveLoss, owner);
          const enemyThreatensMyGoal = !myGoalDefended && NODE_BFS_DIST[eu.nodeId][myGoalId] <= (eu.mp || 2);
          const shouldAttack = (
            attackEV > 0 ||
            (isGoalDefender && effectiveWin >= 30) ||
            (enemyThreatensMyGoal && effectiveWin >= 35 && attackEV > -8000)
          );

          if (shouldAttack) {
            let atkScore = moveScore + attackEV * wCombatAgg + unitThreatBonus;
            if (enemyThreatensMyGoal) atkScore += (effectiveWin / 100) * 30000 * wGoalDef;
            if (isGoalDefender) {
              atkScore += 70000 * wSpeedRush;
            } else if (isEntryDefender) {
              atkScore += 32000 * wEntryLk;
            } else if (isDirectBlocker) {
              atkScore += 20000 * wSpeedRush;
            }

            if (atkScore > bestAtkScoreForThisMove) {
              bestAtkScoreForThisMove = atkScore;
              bestTargetForThisMove = {
                enemyNid,
                eu,
                chosenPlate,
                effectiveWin,
                reason: isGoalDefender
                  ? `⚔️ Assalto ao Goal Defender (${u.name} vs ${eu.name} · ${Math.round(effectiveWin)}% Win)`
                  : `Ataque Decisivo (${u.name} vs ${eu.name} · ${Math.round(effectiveWin)}% Win)`
              };
            }
          }
        });

        if (bestTargetForThisMove) {
          if (bestAtkScoreForThisMove > bestScore) {
            bestScore = bestAtkScoreForThisMove;
            bestAction = {
              type: isStandingAttack ? "standing_attack" : "move_attack",
              uid: u.uid,
              unitName: u.name,
              nid,
              segs: isStandingAttack ? [] : res.paths[nid],
              holdNoAttack: false,
              attackNode: bestTargetForThisMove.enemyNid,
              enemyUnit: bestTargetForThisMove.eu,
              plateToUse: bestTargetForThisMove.chosenPlate,
              reasonTag: bestTargetForThisMove.reason
            };
          }
        } else {
          let holdScore = moveScore;
          if (sim.enemyPinnedCount > 0) holdScore += 3000 * wAntiSur;
          if (nid === myGoalId) holdScore += 65000 * wGoalDef;
          if (holdScore > bestScore) {
            bestScore = holdScore;
            bestAction = {
              type: isStandingAttack ? "hold" : "move",
              uid: u.uid,
              unitName: u.name,
              nid,
              segs: isStandingAttack ? [] : res.paths[nid],
              holdNoAttack: true,
              attackNode: null,
              plateToUse: usingHurdlePlate ? hurdlePlate : null,
              reasonTag: isStandingAttack
                ? `🛡️ Manutenção Firme no Goal Point com ${u.name}`
                : `${reasonTag} (Contenção Tática)`
            };
          }
        }
      }
    });
  }

  myUnits.forEach(u => {
    evaluateUnitMoveSet(u, false);
    if (hurdlePlate && u.location === "board") {
      evaluateUnitMoveSet(u, true);
    }
  });

  // STEP 4: EMERGENCY `GOAL BLOCK` PLATE CHECK
  if (!myGoalOccupant && goalBlockPlate) {
    const bestLandsOnGoal = (bestAction && bestAction.nid === myGoalId);
    const needEmergencyGoalBlock = !bestLandsOnGoal && (
      minEnemyStepsToMyGoal <= 3 ||
      threatLevel >= 2 ||
      (bestScore < -40000)
    );

    if (needEmergencyGoalBlock) {
      const candidates = myUnits.filter(u => u.location === "board" || u.location === "bench");
      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          const wA = getActiveWheel(a);
          const wB = getActiveWheel(b);
          const valA = wA.reduce((m, s) => s.color === "blue" ? m + 80 : (s.color === "purple" ? m + (s.stars || 1) * 30 : Math.max(m, s.dmg || 0)), 0);
          const valB = wB.reduce((m, s) => s.color === "blue" ? m + 80 : (s.color === "purple" ? m + (s.stars || 1) * 30 : Math.max(m, s.dmg || 0)), 0);
          return valB - valA;
        });
        const savior = candidates[0];
        goalBlockPlate.used = true;
        playSfx("portal");
        spawnPortalParticles(BOARD_NODES[myGoalId].x, BOARD_NODES[myGoalId].y, "#38bdf8");
        savior.location = "board";
        savior.nodeId = myGoalId;
        savior.waitTurns = 1;
        setLogText(`🛡️ ${aiTitle} ativou Plate [Goal Block] e teleportou ${savior.name} para trancar o Goal Point!`);
        endTurn(true, enemyRole, Math.max(0, state.turnCounter - 1));
        return;
      }
    }
  }

  // STEP 5: EXECUTE THE CHOSEN ACTION
  if (bestAction) {
    const u = state.units.find(x => x.uid === bestAction.uid);

    if (bestAction.plateToUse) {
      bestAction.plateToUse.used = true;
      playSfx("portal");
      if (bestAction.plateToUse.id === "megaplate" && u) {
        if (!u.name.startsWith("Mega ")) u.name = "Mega " + u.name;
        u.megaTurns = 5;
        u.mp = Math.min(3, (u.baseMp || u.mp) + 1);
        if (u.location === "board" && typeof u.nodeId === "number") {
          spawnPortalParticles(BOARD_NODES[u.nodeId].x, BOARD_NODES[u.nodeId].y, "#f472b6");
        }
      } else if (bestAction.plateToUse.id === "double") {
        state.doubleChanceArmed = true;
        state.activePlate = "double";
      } else if (bestAction.plateToUse.id !== "hurdle") {
        state.activePlate = bestAction.plateToUse.id;
      }
    }

    const plateBadge = bestAction.plateToUse ? ` + Plate [${bestAction.plateToUse.name}]` : "";
    setLogText(`🧠 ${aiTitle}: ${bestAction.reasonTag}${plateBadge}`);

    if (bestAction.type === "hold") {
      const nextTurnVal = owner === "p1" ? "p2" : "p1";
      const nextCounterVal = Math.max(0, state.turnCounter - 1);
      setTimeout(() => {
        endTurn(true, nextTurnVal, nextCounterVal);
      }, 260);
      return;
    }

    if (bestAction.type === "standing_attack" && bestAction.enemyUnit) {
      const nextTurnVal = owner === "p1" ? "p2" : "p1";
      const nextCounterVal = Math.max(0, state.turnCounter - 1);
      let atkSpin = spinWheelForUnit(u, true);
      const defSpin = spinWheelForUnit(bestAction.enemyUnit, false);
      if (state.activePlate === "double") {
        const firstEval = evaluateCombat(u, bestAction.enemyUnit, atkSpin, defSpin);
        if (firstEval.winner !== "atk") {
          atkSpin = spinWheelForUnit(u, true);
        }
      }
      setTimeout(() => {
        triggerCombat(u, bestAction.enemyUnit, false, {
          atkSpin,
          defSpin,
          nextTurn: nextTurnVal,
          nextTurnCounter: nextCounterVal
        });
      }, 240);
      return;
    }

    state.aiHoldPositionNoAttack = Boolean(bestAction.holdNoAttack);
    state.aiPlannedAttackNode    = bestAction.attackNode;
    state.aiExecutingNow         = true;
    executeMove(bestAction.uid, bestAction.nid, true, bestAction.segs);
    state.aiExecutingNow         = false;
    state.aiHoldPositionNoAttack = false;
    state.aiPlannedAttackNode    = null;
  } else {
    skipOrDemoTurn();
  }
};

// ============================================================================
// POST-MATCH TELEMETRY LEARNING & DIFFICULTY EVOLUTION (`showWinResultScreen`)
// ============================================================================
const _v580ShowWinResultScreen = showWinResultScreen;
showWinResultScreen = function(winner) {
  // v5.9.1: Tutorial, Treino e Quest usam a tela própria (sem ELO, sem caixa da Liga)
  if ((state.matchKind === "tutorial" || state.matchKind === "training" || state.matchKind === "quest") &&
      typeof window.__pdrSpecialResultScreen === "function") {
    state.forfeitBy = null;
    const sr = window.__pdrSpecialResultScreen(winner);
    try {
      const promoEl = document.getElementById("win-promo-val");
      const pr = window.trainerProfileData;
      if (promoEl && pr && typeof pr.rankRating === "number") {
        const nextTier = [1500, 1900, 2300, 2700].find(v => v > pr.rankRating);
        promoEl.textContent = nextTier ? `${nextTier - pr.rankRating} ${typeof t === "function" ? t("result.pts", "pts") : "pts"}` : (typeof t === "function" ? t("result.max_league", "Liga máxima") : "Liga máxima");
      }
    } catch (e) {}
    return sr;
  }
  if (state.matchKind === "league" || state.mode === "ai") {
    adaptiveAIBrain.matchesAnalyzed = (adaptiveAIBrain.matchesAnalyzed || 0) + 1;
    const tele = state.currentMatchTelemetry || {};

    if (winner === "p1") {
      adaptiveAIBrain.playerWins = (adaptiveAIBrain.playerWins || 0) + 1;
      adaptiveAIBrain.playerWinStreak = (adaptiveAIBrain.playerWinStreak || 0) + 1;

      // Sobe a escala de dificuldade e reduz o ruído tático mais rápido em caso de win streak
      const streakBoost = Math.min(0.18, 0.08 + adaptiveAIBrain.playerWinStreak * 0.03);
      adaptiveAIBrain.difficultyScale = Math.min(1.0, (adaptiveAIBrain.difficultyScale || 0.35) + streakBoost);
      adaptiveAIBrain.tacticalNoise   = Math.max(0, (adaptiveAIBrain.tacticalNoise || 3200) - 850);

      // Evolui exatamente os pesos das táticas que você usou para derrotá-la nesta partida
      const rushFactor    = Math.min(0.35, 0.10 + (tele.playerGoalRushes || 0) * 0.04);
      const surrFactor    = Math.min(0.35, 0.08 + (tele.playerSurroundThreats || 0) * 0.06);
      const entryFactor   = Math.min(0.35, 0.08 + (tele.playerEntryThreats || 0) * 0.05);
      const combatFactor  = Math.min(0.30, 0.06 + (tele.playerAttacks || 0) * 0.02);

      adaptiveAIBrain.weights.goalDefense      = Math.min(3.8, (adaptiveAIBrain.weights.goalDefense || 1.65) + rushFactor);
      adaptiveAIBrain.weights.antiSurround     = Math.min(3.5, (adaptiveAIBrain.weights.antiSurround || 1.30) + surrFactor);
      adaptiveAIBrain.weights.entryLockdown    = Math.min(3.5, (adaptiveAIBrain.weights.entryLockdown || 1.45) + entryFactor);
      adaptiveAIBrain.weights.combatAggression = Math.min(3.4, (adaptiveAIBrain.weights.combatAggression || 1.55) + combatFactor);
      adaptiveAIBrain.weights.habitIntercept   = Math.min(3.6, (adaptiveAIBrain.weights.habitIntercept || 1.50) + 0.18);
      adaptiveAIBrain.weights.speedRush        = Math.min(3.6, (adaptiveAIBrain.weights.speedRush || 1.75) + 0.12);
    } else {
      adaptiveAIBrain.aiWins = (adaptiveAIBrain.aiWins || 0) + 1;
      adaptiveAIBrain.playerWinStreak = 0;

      // v5.9.0: a IA não "afrouxa" mais depois de vencer (antes subia o ruído até 3800 e caía a dificuldade)
      adaptiveAIBrain.difficultyScale = Math.max(AI_MIN_DIFFICULTY, adaptiveAIBrain.difficultyScale || 0.35);
      adaptiveAIBrain.tacticalNoise   = Math.min(AI_NOISE_CAP, adaptiveAIBrain.tacticalNoise || 0);
    }

    // Atualiza o histórico de vitórias/derrotas de cada resposta que a IA tentou na abertura desta partida
    const aiHist = tele.aiOpeningHistory || [];
    aiHist.forEach(({ seqKey, aiMoveToken }) => {
      const bookEntry = getOpeningSeqNode(seqKey);
      if (!bookEntry.aiResponses[aiMoveToken]) {
        bookEntry.aiResponses[aiMoveToken] = { wins: 0, losses: 0 };
      }
      if (winner === "p1") {
        bookEntry.lossesAgainst = (bookEntry.lossesAgainst || 0) + 1;
        bookEntry.aiResponses[aiMoveToken].losses += 1;
      } else {
        bookEntry.aiResponses[aiMoveToken].wins += 1;
      }
    });

    // Se o jogador venceu rápido (em menos de 20 turnos totais), dobra a penalidade na abertura da IA!
    if (winner === "p1" && state.turnCounter >= 280 && aiHist.length > 0) {
      aiHist.forEach(({ seqKey, aiMoveToken }) => {
        const bookEntry = getOpeningSeqNode(seqKey);
        if (bookEntry.aiResponses[aiMoveToken]) {
          bookEntry.aiResponses[aiMoveToken].losses += 1;
        }
      });
    }

    saveAdaptiveAIBrain();
  }
  // v5.9.1: quem desiste não ganha moedas, gemas nem fragmentos de chave (antes ganhava o prêmio de consolação)
  const selfForfeit = state.forfeitBy && state.forfeitBy === getBottomRole() && state.mode !== "pass";
  const before = selfForfeit ? {
    coins: typeof userCoins !== "undefined" ? userCoins : null,
    keys: typeof playerKeyFragments !== "undefined" ? playerKeyFragments : null,
    gems: state.rareMetals
  } : null;
  const ret = _v580ShowWinResultScreen(winner);
  if (selfForfeit && before) {
    try {
      if (before.coins !== null) userCoins = before.coins;
      if (before.keys !== null) {
        playerKeyFragments = before.keys;
        const kLbl = document.getElementById("key-frag-lbl");
        if (kLbl) kLbl.textContent = playerKeyFragments;
      }
      state.rareMetals = before.gems;
      const tr = (k, f) => (typeof t === "function" ? t(k, f) : f);
      const kv = document.getElementById("win-keys-val");
      if (kv) kv.textContent = "+0 🔑";
      const gv = document.getElementById("win-gems-val");
      if (gv) gv.textContent = tr("result.forfeit_no_reward", "Nenhuma (desistência)");
      if (typeof saveEconomyAndUpgrades === "function") saveEconomyAndUpgrades();
      if (typeof syncAllCurrencyLabels === "function") syncAllCurrencyLabels();
    } catch (e) {}
  }
  state.forfeitBy = null;
  // Quantos pontos faltam para a próxima liga (antes mostrava um 1215 fixo)
  try {
    const promoEl = document.getElementById("win-promo-val");
    const pr = window.trainerProfileData;
    if (promoEl && pr && typeof pr.rankRating === "number") {
      const nextTier = [1500, 1900, 2300, 2700].find(v => v > pr.rankRating);
      const trp = (k, f) => (typeof t === "function" ? t(k, f) : f);
      promoEl.textContent = nextTier ? `${nextTier - pr.rankRating} ${trp("result.pts", "pts")}` : trp("result.max_league", "Liga máxima");
    }
    const rDel = document.getElementById("win-rating-delta");
    if (rDel && /^\+0(\s|$)/.test(rDel.textContent.trim())) { rDel.textContent = "±0"; rDel.style.color = "#94a3b8"; }
    const titleEl = document.getElementById("win-result-title");
    if (titleEl && typeof t === "function") {
      const didWinNow = winner === getBottomRole();
      titleEl.textContent = didWinNow ? t("result.win", "VITÓRIA") : t("result.lose", "DERROTA");
    }
  } catch (e) {}
  return ret;
};

// Clean up tutorial state on navigation or forfeit
const _v531OpenDrawer = openDrawer;
openDrawer = function(tab) {
  if (state.matchKind === "tutorial") {
    tutorialStepBusy = false;
    currentTutorialStep = 0;
    if (typeof hideTutorialCoachHud === "function") hideTutorialCoachHud();
    state.matchKind = "league";
    state.mode = "ai";
  }
  return _v531OpenDrawer(tab);
};

const _v531TriggerVoluntaryForfeit = triggerVoluntaryForfeit;
triggerVoluntaryForfeit = function() {
  if (state.matchKind === "tutorial") {
    exitInteractiveTutorial();
    return;
  }
  return _v531TriggerVoluntaryForfeit();
};
