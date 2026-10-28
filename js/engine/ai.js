// ============================================================================
// ADAPTIVE COUNTER-TEAM & 2-PLY MINIMAX LOOKAHEAD AI ENGINE
// ============================================================================
// SECTION 18: v5.3.0 ADAPTIVE STRATEGIC RANKED AI (GRAPH-BFS, 2-PLY LOOKAHEAD,
// COUNTER-DECK BUILDER, AI PLATE USAGE & PLAYSTYLE LEARNING MEMORY) +
// FAIR 50/50 FIRST-TURN ROULETTE
// ============================================================================
const AI_BRAIN_STORAGE_KEY = "pdr_adaptive_ai_brain_v570";
const FIRST_TURN_HIST_KEY  = "pdr_first_turn_hist_v530";

function loadAdaptiveAIBrain() {
  const defaultBrain = {
    version: "5.7.0",
    matchesAnalyzed: 0,
    aiWins: 0,
    playerWins: 0,
    laneHeatmap: { left: 2, center: 2, right: 2 },
    playerGoalRushMoves: 0,
    playerEntryBlockMoves: 0,
    playerSurroundKOs: 0,
    playerPlateUses: 0,
    playerAttacks: 0,
    playerFavBaseIds: {},
    weights: {
      goalDefense: 1.85,
      antiSurround: 1.35,
      entryLockdown: 1.50,
      combatAggression: 1.65,
      speedRush: 1.95
    }
  };
  try {
    const raw = localStorage.getItem(AI_BRAIN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.laneHeatmap && parsed.weights) {
        return { ...defaultBrain, ...parsed, weights: { ...defaultBrain.weights, ...parsed.weights } };
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

// Analyze Player's current 6-figure Deck (state.deckP1) and build an intelligent Counter-Deck for P2!
function analyzePlayerDeckAndBuildCounterTeam() {
  const p1Indices = (state.deckP1 && state.deckP1.length === 6) ? state.deckP1 : [1, 2, 3, 4, 6, 0];
  let totalPurpleSlices = 0;
  let totalGoldSlices   = 0;
  let totalWhiteHeavy   = 0;
  let runner3MpCount    = 0;
  let avgPlayerLevel    = 1;
  let avgPlayerClv      = 0;

  p1Indices.forEach(idx => {
    const f = FIGURES_DB[idx % FIGURES_DB.length] || FIGURES_DB[0];
    avgPlayerLevel += (f.level || 1);
    avgPlayerClv   += (f.clv || 0);
    if (f.mp >= 3) runner3MpCount++;
    adaptiveAIBrain.playerFavBaseIds[f.id] = (adaptiveAIBrain.playerFavBaseIds[f.id] || 0) + 1;
    (f.wheel || []).forEach(w => {
      if (w.color === "purple") totalPurpleSlices += (w.size || 0);
      if (w.color === "gold")   totalGoldSlices   += (w.size || 0);
      if ((w.color === "white" || w.color === "gold") && (w.dmg || 0) >= 100) totalWhiteHeavy += (w.size || 0);
    });
  });
  avgPlayerLevel = Math.round(avgPlayerLevel / 6);
  avgPlayerClv   = Math.round(avgPlayerClv / 6);
  saveAdaptiveAIBrain();

  // Score every figure in FIGURES_DB as a counter-pick to the player's current deck!
  const pElo = (window.trainerProfileData && window.trainerProfileData.rankRating) ? window.trainerProfileData.rankRating : 1000;
  const allowHighTier = (pElo >= 1100 || adaptiveAIBrain.matchesAnalyzed >= 2 || totalWhiteHeavy > 80);

  const scoredCandidates = FIGURES_DB.map((f, idx) => {
    let score = 0;
    const wList = f.wheel || [];
    const goldSize   = wList.filter(w => w.color === "gold").reduce((s, w) => s + (w.size || 0), 0);
    const purpleSize = wList.filter(w => w.color === "purple").reduce((s, w) => s + (w.size || 0), 0);
    const blueSize   = wList.filter(w => w.color === "blue").reduce((s, w) => s + (w.size || 0), 0);
    const maxDmg     = wList.reduce((m, w) => Math.max(m, w.dmg || 0), 0);
    const maxStars   = wList.reduce((m, w) => Math.max(m, w.stars || 0), 0);

    // 1. If player uses lots of Purple -> prioritize Gold attackers (Gold breaks Purple!)
    if (totalPurpleSlices >= 90 && goldSize >= 20) score += goldSize * 1.8;
    // 2. If player uses heavy White attackers -> prioritize 2-3 star Purple & Blue Dodge!
    if (totalWhiteHeavy >= 120 && (purpleSize >= 24 || maxStars >= 2)) score += purpleSize * 1.5 + maxStars * 18;
    // 3. If player uses many 3-MP runners -> prioritize anti-jump / high-defense blockers & 3-MP interceptors
    if (runner3MpCount >= 3 && (f.id === "gardevoir" || f.id === "palkia_o" || blueSize >= 16 || maxDmg >= 110)) score += 45;

    // Base quality + slight randomization so the AI brings varied meta counter-teams
    score += maxDmg * 0.4 + goldSize * 0.5 + purpleSize * 0.4 + blueSize * 0.4 + (Math.random() * 25);
    if (!allowHighTier && (f.rarity === "UX" || maxDmg >= 150)) score -= 60;
    return { idx, f, score, mp: f.mp, goldSize, purpleSize, maxDmg };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);

  // Assemble a balanced 6-figure Tactical AI Team:
  // - 2 Runners (3 MP) for lane control / Entry lockdown / Surround speed
  // - 2 Gold / High-DMG Breakers to counter Purple & White
  // - 1 Purple / Status Controller
  // - 1 Heavy Goal Guardian / Tank (2 MP or 1 MP with high DMG/Blue)
  const chosenIndices = [];
  const pickWhere = (pred) => {
    for (const cand of scoredCandidates) {
      if (!chosenIndices.includes(cand.idx) && pred(cand)) {
        chosenIndices.push(cand.idx);
        return;
      }
    }
  };

  pickWhere(c => c.mp >= 3 && c.goldSize >= 16);
  pickWhere(c => c.mp >= 3);
  pickWhere(c => c.goldSize >= 20 && c.maxDmg >= 90);
  pickWhere(c => c.purpleSize >= 24);
  pickWhere(c => c.maxDmg >= 110 && c.mp === 2);
  while (chosenIndices.length < 6) {
    pickWhere(() => true);
  }

  state.deckP2 = chosenIndices.slice(0, 6);

  // Name the AI opponent according to the player's ELO League & detected style
  const prefLane = getPlayerPreferredLane();
  const laneNames = { left: "Anti-Flanco Esq.", right: "Anti-Flanco Dir.", center: "Guardião Central" };
  const aiNamesByTier = [
    { min: 2300, name: "Karolin [IA Master]" },
    { min: 1900, name: "No.9 [IA Champion]" },
    { min: 1500, name: "Don Roger [IA Leader]" },
    { min: 1150, name: "Luca [IA Adaptativa]" },
    { min: 0,    name: "Carlo [IA Tática]" }
  ];
  const tierObj = aiNamesByTier.find(t => pElo >= t.min) || aiNamesByTier[aiNamesByTier.length - 1];
  window.adaptiveAIOpponentName = tierObj.name;
  window.adaptiveAIDiagnosticSummary = `${tierObj.name} (${laneNames[prefLane]})`;

  return { chosenIndices, avgPlayerLevel, avgPlayerClv, pElo };
}

// Fair 50/50 First-Turn Roulette Roll with Anti-Streak Balancing!
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
    // If the same side got First Turn twice in a row, force alternation so it never gets stuck on one player!
    winner = (hist[n - 1] === "p1") ? "p2" : "p1";
  } else if (n === 0) {
    // On the very first match after installing v5.3.0, let P2 (the AI) go first so the player immediately sees the fixed roulette in action!
    winner = "p2";
  } else {
    winner = (Math.random() < 0.5) ? "p1" : "p2";
  }

  hist.push(winner);
  if (hist.length > 6) hist = hist.slice(-6);
  try { localStorage.setItem(FIRST_TURN_HIST_KEY, JSON.stringify(hist)); } catch (e) {}
  return winner;
}

// Initialize AI's 6-cost Tactical Plate Loadout for the match
function initAITacticalPlates() {
  state.aiPlates = [
    { id: "hurdle",    name: "Hurdle Jump", cost: 2, used: false },
    { id: "goalblock", name: "Goal Block",  cost: 2, used: false },
    { id: "xatk",      name: "X Attack",    cost: 1, used: false },
    { id: "xspeed",    name: "X Speed",     cost: 1, used: false }
  ];
}

// Hook startVideoAuthenticMatch so every AI match builds the adaptive counter-team and rolls the 50/50 First-Turn Roulette!
const _v521StartVideoAuthenticMatch = startVideoAuthenticMatch;
startVideoAuthenticMatch = function() {
  state.currentMatchTelemetry = {
    playerGoalRushes: 0,
    playerEntryThreats: 0,
    playerSurroundThreats: 0,
    playerAttacks: 0,
    laneMoves: { left: 0, center: 0, right: 0 }
  };

  const meta = analyzePlayerDeckAndBuildCounterTeam();
  _v521StartVideoAuthenticMatch();
  initAITacticalPlates();

  // Scale AI unit levels & CLv to match player's progression & ELO
  const eloBonusLv  = Math.min(9, Math.floor(Math.max(0, meta.pElo - 950) / 180));
  const targetAiLv  = Math.max(1, Math.min(10, Math.max(meta.avgPlayerLevel, 1 + eloBonusLv)));
  const targetAiClv = Math.max(0, Math.min(10, Math.max(meta.avgPlayerClv, Math.floor(eloBonusLv * 0.8))));

  state.units.filter(u => u.owner === "p2").forEach(u => {
    u.level = targetAiLv;
    u.clv   = targetAiClv;
  });

  // Roll the true 50/50 First-Turn Roulette!
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

// Observe every move made by the human player (P1) to update the AI's Playstyle Learning Memory in real time!
const _v521ExecuteMove = executeMove;
executeMove = function(uid, targetNodeId, broadcast, customSegments, remotePacket) {
  const u = state.units.find(x => x.uid === uid);
  if (u && u.owner === "p1" && state.matchKind !== "tutorial" && typeof targetNodeId === "number") {
    if (!state.currentMatchTelemetry) {
      state.currentMatchTelemetry = {
        playerGoalRushes: 0,
        playerEntryThreats: 0,
        playerSurroundThreats: 0,
        playerAttacks: 0,
        laneMoves: { left: 0, center: 0, right: 0 }
      };
    }
    const lane = getNodeLaneCategory(targetNodeId);
    adaptiveAIBrain.laneHeatmap[lane] = (adaptiveAIBrain.laneHeatmap[lane] || 0) + 1;
    state.currentMatchTelemetry.laneMoves[lane] = (state.currentMatchTelemetry.laneMoves[lane] || 0) + 1;

    // Detect Goal Rush: player moves within 3 steps of AI goal (node 3)
    if (NODE_BFS_DIST[targetNodeId][3] <= 3) {
      adaptiveAIBrain.playerGoalRushMoves = (adaptiveAIBrain.playerGoalRushMoves || 0) + 1;
      adaptiveAIBrain.weights.goalDefense = Math.min(2.8, (adaptiveAIBrain.weights.goalDefense || 1.20) + 0.08);
      state.currentMatchTelemetry.playerGoalRushes += 1;
    }

    // Detect Entry Block Threat: player moves onto or adjacent to nodes 0 or 6
    if (targetNodeId === 0 || targetNodeId === 6 || NODE_BFS_DIST[targetNodeId][0] <= 1 || NODE_BFS_DIST[targetNodeId][6] <= 1) {
      adaptiveAIBrain.playerEntryBlockMoves = (adaptiveAIBrain.playerEntryBlockMoves || 0) + 1;
      adaptiveAIBrain.weights.entryLockdown = Math.min(2.6, (adaptiveAIBrain.weights.entryLockdown || 1.15) + 0.07);
      state.currentMatchTelemetry.playerEntryThreats += 1;
    }
    saveAdaptiveAIBrain();
  }
  return _v521ExecuteMove(uid, targetNodeId, broadcast, customSegments, remotePacket);
};

// Also track when the player Surround-KOs an AI unit so the AI increases its anti-surround caution weight!
const _v521SendToPC = sendToPC;
sendToPC = function(unit) {
  if (unit && unit.owner === "p2") {
    state.questEnemyKOs = (state.questEnemyKOs || 0) + 1;
    if (state.matchKind !== "tutorial") {
      adaptiveAIBrain.playerSurroundKOs = (adaptiveAIBrain.playerSurroundKOs || 0) + 1;
      adaptiveAIBrain.weights.antiSurround = Math.min(2.8, (adaptiveAIBrain.weights.antiSurround || 1.25) + 0.08);
      if (state.currentMatchTelemetry) {
        state.currentMatchTelemetry.playerSurroundThreats = (state.currentMatchTelemetry.playerSurroundThreats || 0) + 1;
      }
      saveAdaptiveAIBrain();
    }
  }
  return _v521SendToPC(unit);
};

// Track human player attacks in combat to adapt AI aggression and counter-blocking
if (typeof triggerCombat === "function") {
  const _v560TriggerCombat = triggerCombat;
  triggerCombat = function(atkUnit, defUnit, broadcast, forcedSpins) {
    if (atkUnit && atkUnit.owner === "p1" && state.matchKind !== "tutorial") {
      adaptiveAIBrain.playerAttacks = (adaptiveAIBrain.playerAttacks || 0) + 1;
      adaptiveAIBrain.weights.combatAggression = Math.min(2.6, (adaptiveAIBrain.weights.combatAggression || 1.10) + 0.05);
      if (state.currentMatchTelemetry) {
        state.currentMatchTelemetry.playerAttacks = (state.currentMatchTelemetry.playerAttacks || 0) + 1;
      }
      saveAdaptiveAIBrain();
    }
    return _v560TriggerCombat(atkUnit, defUnit, broadcast, forcedSpins);
  };
}

// Helper: Check if a given player ('p1' or 'p2') can reach `targetNodeId` in 1 turn from the current board/bench
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

// ============================================================================
// MASTER STRATEGIC AI ENGINE (`triggerPlayerAIMove` v5.3.0)
// ============================================================================
triggerPlayerAIMove = function() {
  if (state.matchKind === "tutorial" || state.isAnimating || state.winCelebrationAnim) return;

  // If currently in postMoveAttackMode (e.g. player tapped AI button after moving P1), evaluate smart attack
  if (state.postMoveAttackMode) {
    const sel = state.units.find(x => x.uid === state.selectedUnitId);
    let bestTargetNid = null;
    let bestNet = -999;
    (state.attackTargets || []).forEach(tNid => {
      const occ = unitAtNode(tNid);
      if (sel && occ) {
        const odds = computeDuelDbOdds(sel, occ);
        const net = odds.win - odds.loss;
        if (net > bestNet) { bestNet = net; bestTargetNid = tNid; }
      }
    });
    if (bestTargetNid !== null && bestNet >= -5) {
      onNodeClicked(bestTargetNid);
      return;
    }
    finishPostMoveWithoutAttack();
    return;
  }

  const owner     = state.turn; // 'p2' (or 'p1' if user clicked [AI] button)
  const enemyRole = owner === "p1" ? "p2" : "p1";
  const oppGoalId = owner === "p1" ? 3 : 10;
  const myGoalId  = owner === "p1" ? 10 : 3;
  const oppEntryIds = owner === "p1" ? [0, 6] : [7, 13];
  const myEntryIds  = owner === "p1" ? [7, 13] : [0, 6];

  const wGoalDef = (adaptiveAIBrain.weights && adaptiveAIBrain.weights.goalDefense)   || 1.2;
  const wAntiSur = (adaptiveAIBrain.weights && adaptiveAIBrain.weights.antiSurround)  || 1.25;
  const wEntryLk = (adaptiveAIBrain.weights && adaptiveAIBrain.weights.entryLockdown) || 1.15;
  const prefPlayerLane = getPlayerPreferredLane();

  const myUnits = state.units.filter(u =>
    u.owner === owner &&
    u.location !== "pc" &&
    u.location !== "ultra_space" &&
    u.waitTurns === 0 &&
    u.condition !== PokemonCondition.Sleep &&
    u.condition !== PokemonCondition.Freeze
  );
  const enemyBoardUnits = state.units.filter(u => u.owner === enemyRole && u.location === "board");

  if (myUnits.length === 0) {
    skipOrDemoTurn();
    return;
  }

  // 1. CHECK IF OUR GOAL (`myGoalId`) IS UNDER IMMEDIATE 1-TURN OR 2-TURN THREAT!
  let minEnemyStepsToMyGoal = 99;
  let threateningEnemies = [];
  enemyBoardUnits.forEach(eu => {
    const d = NODE_BFS_DIST[eu.nodeId][myGoalId];
    if (d < minEnemyStepsToMyGoal) minEnemyStepsToMyGoal = d;
    if (d <= eu.mp + 1) threateningEnemies.push(eu);
  });
  const goalInDanger = (minEnemyStepsToMyGoal <= 3 || threateningEnemies.length > 0);
  const myGoalOccupant = unitAtNode(myGoalId);

  // 2. CHECK IF AI CAN WIN IMMEDIATELY USING `HURDLE JUMP` PLATE!
  const aiPlates = (owner === "p2" && Array.isArray(state.aiPlates)) ? state.aiPlates : [];
  const hurdlePlate = aiPlates.find(p => p.id === "hurdle" && !p.used);
  const goalBlockPlate = aiPlates.find(p => p.id === "goalblock" && !p.used);
  const xAtkPlate = aiPlates.find(p => p.id === "xatk" && !p.used);
  const xSpdPlate = aiPlates.find(p => p.id === "xspeed" && !p.used);

  if (hurdlePlate) {
    state.abilityJumpActive = true;
    for (const u of myUnits) {
      if (u.location === "board") {
        const jumpRes = computeReachableWithPaths(u);
        if (jumpRes.nodes.includes(oppGoalId)) {
          hurdlePlate.used = true;
          playSfx("portal");
          setLogText(`🧠 ${window.adaptiveAIOpponentName || "IA"} ativou Plate [🦘 Hurdle Jump] para conquistar o Goal Point!`);
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

  // 3. EVALUATE ALL NORMAL MOVES (INCLUDING 0-STEP STANDING ATTACKS & POSITIONAL MOVES)
  let bestAction = null;
  let bestScore  = -999999;

  // Helper: simulate whether placing `movingUnit` at `destNid` causes any Surround KOs
  function evaluateSimulatedBoardAt(movingUnit, destNid) {
    const getOccSim = (nid) => {
      if (nid === destNid) return movingUnit;
      const occ = unitAtNode(nid);
      if (occ && occ.uid === movingUnit.uid) return null;
      return occ;
    };

    // Check if `movingUnit` itself would be surrounded at `destNid`!
    // Strict rule: surrounded if and only if EVERY neighbor is occupied by an enemy!
    const destNbs = ADJ[destNid] || [];
    const selfSurrounded = destNbs.length > 0 &&
      destNbs.every(nb => {
        const o = getOccSim(nb);
        return o !== null && o.owner !== owner;
      });
    if (selfSurrounded) {
      return { selfSurrounded: true, enemyKOs: [], allyVulnerableCount: 0 };
    }

    // Check which enemy units get Surround-KO'd when `movingUnit` lands on `destNid`
    // All neighbors of eu must be occupied by pieces friendly to `owner` (enemies to eu)
    const enemyKOs = [];
    enemyBoardUnits.forEach(eu => {
      const nbs = ADJ[eu.nodeId] || [];
      if (nbs.length > 0 && nbs.every(nb => {
        const o = getOccSim(nb);
        return o !== null && o.owner === owner;
      })) {
        enemyKOs.push(eu);
      }
    });

    // Check 1-turn Lookahead Surround Vulnerability:
    // After `movingUnit` lands on `destNid`, does `movingUnit` (or any friendly board unit) have ONLY 1 open neighbor
    // while all other neighbors are ALREADY occupied by enemies AND the opponent can reach that last open neighbor next turn?
    let allyVulnerableCount = 0;
    const allMyBoard = state.units.filter(u => u.owner === owner && (u.location === "board" || u.uid === movingUnit.uid));
    allMyBoard.forEach(au => {
      const curNid = (au.uid === movingUnit.uid) ? destNid : au.nodeId;
      if (typeof curNid !== "number") return;
      const nbs = ADJ[curNid] || [];
      const openNbs = nbs.filter(nb => getOccSim(nb) === null || enemyKOs.some(ko => ko.nodeId === nb));
      const enemyNbs = nbs.filter(nb => {
        const o = getOccSim(nb);
        return o && o.owner !== owner && !enemyKOs.includes(o);
      });
      // Can only be surrounded next turn if ALL other occupied neighbors are enemies!
      if (openNbs.length === 1 && enemyNbs.length === (nbs.length - 1)) {
        const emptyEscapeNode = openNbs[0];
        if (canSideReachNodeNextTurn(enemyRole, emptyEscapeNode, null)) {
          allyVulnerableCount++;
        }
      }
    });

    return { selfSurrounded: false, enemyKOs, allyVulnerableCount };
  }

  myUnits.forEach(u => {
    const res = computeReachableWithPaths(u);
    const candidateNodes = [...res.nodes];
    // Also consider 0-step standing position if already on the board and adjacent to an enemy!
    if (u.location === "board" && typeof u.nodeId === "number") {
      const hasAdjEnemyNow = (ADJ[u.nodeId] || []).some(nb => {
        const occ = unitAtNode(nb);
        return occ && occ.owner !== owner;
      });
      if (hasAdjEnemyNow) candidateNodes.push(u.nodeId);
    }

    // Check if `u` is currently in a 1-neighbor surround trap on the board right now
    let currentlyInSurroundTrap = false;
    if (u.location === "board" && typeof u.nodeId === "number") {
      const curNbs = ADJ[u.nodeId] || [];
      const openCur = curNbs.filter(nb => unitAtNode(nb) === null);
      const enCur = curNbs.filter(nb => { const o = unitAtNode(nb); return o && o.owner !== owner; });
      if (openCur.length === 1 && enCur.length === (curNbs.length - 1) && canSideReachNodeNextTurn(enemyRole, openCur[0], null)) {
        currentlyInSurroundTrap = true;
      }
    }

    candidateNodes.forEach(nid => {
      const isStandingAttack = (u.location === "board" && nid === u.nodeId);
      const sim = evaluateSimulatedBoardAt(u, nid);
      if (sim.selfSurrounded) return; // Never suicide into a self-surround!

      let moveScore = 0;
      let reasonTag = "Posicionamento Tático";

      // A. Instant Goal Capture!
      if (nid === oppGoalId) {
        moveScore += 60000;
        reasonTag = "Conquista do Goal Point!";
      }

      // B. Surround KOs achieved by landing on `nid`!
      if (!isStandingAttack && sim.enemyKOs.length > 0) {
        sim.enemyKOs.forEach(koUnit => {
          moveScore += 7200;
          if (koUnit.nodeId === oppGoalId) moveScore += 50000; // Goal Surround Win!
          if (threateningEnemies.includes(koUnit)) moveScore += 5500 * wGoalDef;
          if (myEntryIds.includes(koUnit.nodeId)) moveScore += 3200;
        });
        reasonTag = `Cerco Tático (Surround KO em ${sim.enemyKOs[0].name})`;
      }

      // C. Penalize leaving our unit (or an ally) in a 1-turn surround trap!
      if (sim.allyVulnerableCount > 0) {
        moveScore -= 4200 * wAntiSur * sim.allyVulnerableCount;
      }
      // Reward escaping an existing surround trap!
      if (currentlyInSurroundTrap && !isStandingAttack && sim.allyVulnerableCount === 0) {
        moveScore += 3800 * wAntiSur;
        reasonTag = `Evasão de Cerco com ${u.name}`;
      }

      // D. Leaving our own Goal Point (`myGoalId`) undefended when enemies are nearby is forbidden!
      if (u.location === "board" && u.nodeId === myGoalId && nid !== myGoalId && goalInDanger) {
        moveScore -= 18000;
      }

      // E. Emergency Goal Defense (`myGoalId` or its immediate neighbors `2` and `4` / `9` and `11`)
      const distToMyGoal  = NODE_BFS_DIST[nid][myGoalId];
      const distToOppGoal = NODE_BFS_DIST[nid][oppGoalId];

      if (goalInDanger) {
        if (nid === myGoalId && !myGoalOccupant) {
          moveScore += 19000 * wGoalDef;
          reasonTag = `Defesa do Goal Point com ${u.name}`;
        } else if (distToMyGoal === 1) {
          moveScore += 6500 * wGoalDef;
          reasonTag = `Bloqueio de Rota do Goal com ${u.name}`;
        }
        // Extra bonus for placing a piece directly adjacent to the threatening enemy to block its path
        threateningEnemies.forEach(te => {
          if (NODE_BFS_DIST[nid][myGoalId] < NODE_BFS_DIST[te.nodeId][myGoalId] && NODE_BFS_DIST[nid][te.nodeId] === 1) {
            moveScore += 4800 * wGoalDef;
          }
        });
      }

      // F. Offensive Graph Progression toward Opponent's Goal (`oppGoalId`) & Entry Points (`oppEntryIds`)
      moveScore += (12 - distToOppGoal) * 115;
      if (oppEntryIds.includes(nid)) {
        const otherEntry = oppEntryIds.find(id => id !== nid);
        const otherTaken = otherEntry !== undefined && unitAtNode(otherEntry) && unitAtNode(otherEntry).owner === owner;
        moveScore += (otherTaken ? 4600 : 1650) * wEntryLk;
        reasonTag = otherTaken ? `Bloqueio Duplo de Entry Points (Pressão Wait Win!)` : `Ocupação de Entry Point com ${u.name}`;
      }

      // G. Adaptive Lane Counter-Positioning (reinforce the lane the human player prefers!)
      const destLane = getNodeLaneCategory(nid);
      if (destLane === prefPlayerLane) {
        moveScore += 340;
      }

      // H. Deploying from Bench vs Over-moving same piece
      if (u.location === "bench") {
        const myBoardCount = state.units.filter(x => x.owner === owner && x.location === "board").length;
        if (myBoardCount < 4) moveScore += 480;
        if (u.mp >= 3 && state.turnCounter >= 294) moveScore += 320; // Open with 3-MP Runners early!
      }

      // I. Evaluate Combat Options at `nid` (Attack Best Target vs Hold Position Without Attacking!)
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
            plateToUse: null,
            reasonTag
          };
        }
      } else {
        // 1) Option 1: Move to `nid` and HOLD POSITION (do not attack) — only valid if not a 0-step standing action
        if (!isStandingAttack) {
          // Holding position next to an enemy is great for setting up a surround or blocking their advance if our attack odds are risky!
          let holdScore = moveScore + 180;
          // Check if moving next to `occ` puts `occ` down to 1 open neighbor (setting up a Surround threat!)
          adjEnemiesAtDest.forEach(({ unit: eu }) => {
            const euNbs = ADJ[eu.nodeId] || [];
            const euOpenAfter = euNbs.filter(nb => nb !== nid && unitAtNode(nb) === null);
            if (euOpenAfter.length === 1) {
              holdScore += 950;
            }
          });
          if (holdScore > bestScore) {
            bestScore = holdScore;
            bestAction = {
              type: "move",
              uid: u.uid,
              unitName: u.name,
              nid,
              segs: res.paths[nid],
              holdNoAttack: true,
              attackNode: null,
              plateToUse: null,
              reasonTag: `${reasonTag} (Bloqueio Tático)`
            };
          }
        }

        // 2) Option 2: Attack the most favorable adjacent enemy at `nid` (with optional X Attack / X Speed Plate!)
        adjEnemiesAtDest.forEach(({ nodeId: enemyNid, unit: eu }) => {
          const baseOdds = computeDuelDbOdds(u, eu);
          const netOdds  = baseOdds.win - baseOdds.loss;
          const isHighPriorityTarget = (
            eu.nodeId === myGoalId ||
            myEntryIds.includes(eu.nodeId) ||
            threateningEnemies.includes(eu) ||
            eu.nodeId === oppGoalId
          );

          let chosenPlate = null;
          let effectiveNet = netOdds;

          // Check if using X Attack (+30 DMG) or X Speed (White -> Gold vs Purple) turns a close fight into a winning strike!
          const euWheel = getActiveWheel(eu);
          const euPurpleRatio = euWheel.filter(w => w.color === "purple").reduce((s, w) => s + (w.size || 0), 0) / 96;
          if (xSpdPlate && euPurpleRatio >= 0.28 && baseOdds.win < 68) {
            chosenPlate = xSpdPlate;
            effectiveNet += 26;
          } else if (xAtkPlate && (isHighPriorityTarget || (netOdds >= -18 && netOdds <= 22))) {
            chosenPlate = xAtkPlate;
            effectiveNet += 22;
          }

          // Only attack if odds are favorable OR target is an urgent threat (and never risk attacking FROM our own Goal Point unless odds > 65%!)
          const standingOnMyGoal = (nid === myGoalId);
          if (standingOnMyGoal && baseOdds.loss > 25 && !chosenPlate) {
            return; // Do not gamble away our Goal Point defender!
          }

          if (effectiveNet >= -8 || isHighPriorityTarget) {
            let atkScore = moveScore + effectiveNet * 18 + (baseOdds.win * 9);
            if (isHighPriorityTarget) atkScore += 2600;
            if (atkScore > bestScore) {
              bestScore = atkScore;
              bestAction = {
                type: isStandingAttack ? "standing_attack" : "move_attack",
                uid: u.uid,
                unitName: u.name,
                nid,
                segs: isStandingAttack ? [] : res.paths[nid],
                holdNoAttack: false,
                attackNode: enemyNid,
                enemyUnit: eu,
                plateToUse: chosenPlate,
                reasonTag: `Combate Tático (${u.name} vs ${eu.name} · ${Math.round(baseOdds.win)}% Win)`
              };
            }
          }
        });
      }
    });
  });

  // 4. EMERGENCY `GOAL BLOCK` PLATE CHECK:
  // If `goalInDanger` is true, `myGoalId` is STILL empty (`!myGoalOccupant`), and `bestAction` does NOT land on `myGoalId`
  // or eliminate the threatening enemy while an enemy is 1 turn from capturing `myGoalId`, use `Goal Block` Plate!
  if (goalInDanger && !myGoalOccupant && minEnemyStepsToMyGoal <= 2 && goalBlockPlate) {
    const savesGoal = bestAction && (bestAction.nid === myGoalId || bestScore >= 14000);
    if (!savesGoal) {
      const fieldAllies = myUnits.filter(u => u.location === "board");
      if (fieldAllies.length > 0) {
        // Pick the field ally furthest from `oppGoalId` to teleport to `myGoalId`
        fieldAllies.sort((a, b) => NODE_BFS_DIST[b.nodeId][oppGoalId] - NODE_BFS_DIST[a.nodeId][oppGoalId]);
        const savior = fieldAllies[0];
        goalBlockPlate.used = true;
        playSfx("portal");
        spawnPortalParticles(BOARD_NODES[myGoalId].x, BOARD_NODES[myGoalId].y, "#38bdf8");
        savior.nodeId = myGoalId;
        savior.waitTurns = 1;
        setLogText(`🛡️ ${window.adaptiveAIOpponentName || "IA"} ativou Plate [Goal Block] e teleportou ${savior.name} para defender o Goal!`);
        endTurn(true, enemyRole, Math.max(0, state.turnCounter - 1));
        return;
      }
    }
  }

  // 5. EXECUTE THE CHOSEN STRATEGIC ACTION!
  if (bestAction) {
    const u = state.units.find(x => x.uid === bestAction.uid);
    const aiTitle = window.adaptiveAIOpponentName || "IA Estratégica";

    if (bestAction.plateToUse) {
      bestAction.plateToUse.used = true;
      state.activePlate = bestAction.plateToUse.id;
      playSfx("portal");
    }

    const plateBadge = bestAction.plateToUse ? ` + Plate [${bestAction.plateToUse.name}]` : "";
    setLogText(`🧠 ${aiTitle}: ${bestAction.reasonTag}${plateBadge}`);

    if (bestAction.type === "standing_attack" && bestAction.enemyUnit) {
      const nextTurnVal = owner === "p1" ? "p2" : "p1";
      const nextCounterVal = Math.max(0, state.turnCounter - 1);
      const atkSpin = spinWheelForUnit(u, true);
      const defSpin = spinWheelForUnit(bestAction.enemyUnit, false);
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

// Update adaptive learning weights at the end of every Ranked or AI match!
const _v521ShowWinResultScreen = showWinResultScreen;
showWinResultScreen = function(winner) {
  if (state.matchKind === "league" || state.mode === "ai") {
    adaptiveAIBrain.matchesAnalyzed = (adaptiveAIBrain.matchesAnalyzed || 0) + 1;
    if (winner === "p1") {
      adaptiveAIBrain.playerWins = (adaptiveAIBrain.playerWins || 0) + 1;
      // When the player beats the AI, sharpen goal defense, anti-surround, and tactical counter-measures!
      adaptiveAIBrain.weights.goalDefense = Math.min(3.2, (adaptiveAIBrain.weights.goalDefense || 1.85) + 0.20);
      adaptiveAIBrain.weights.antiSurround = Math.min(2.8, (adaptiveAIBrain.weights.antiSurround || 1.35) + 0.15);
      adaptiveAIBrain.weights.speedRush = Math.min(3.5, (adaptiveAIBrain.weights.speedRush || 1.95) + 0.08);
      adaptiveAIBrain.weights.combatAggression = Math.min(3.2, (adaptiveAIBrain.weights.combatAggression || 1.65) + 0.08);
      adaptiveAIBrain.weights.entryLockdown = Math.min(3.2, (adaptiveAIBrain.weights.entryLockdown || 1.50) + 0.08);
    } else {
      adaptiveAIBrain.aiWins = (adaptiveAIBrain.aiWins || 0) + 1;
      adaptiveAIBrain.weights.speedRush = Math.min(3.5, (adaptiveAIBrain.weights.speedRush || 2.00) + 0.08);
      adaptiveAIBrain.weights.combatAggression = Math.min(3.2, (adaptiveAIBrain.weights.combatAggression || 1.70) + 0.08);
    }
    saveAdaptiveAIBrain();
  }
  return _v521ShowWinResultScreen(winner);
};


// Ensure leaving the board or starting any normal match always cleans up tutorial state!
const _v531OpenDrawer = openDrawer;
openDrawer = function(tab) {
  if (state.matchKind === "tutorial") {
    tutorialStepBusy = false;
    currentTutorialStep = 0;
    hideTutorialCoachHud();
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

const _v531StartVideoAuthenticMatch = startVideoAuthenticMatch;
startVideoAuthenticMatch = function() {
  tutorialStepBusy = false;
  currentTutorialStep = 0;
  hideTutorialCoachHud();
  const tourHud = document.getElementById("tutorial-hub-tour-hud");
  if (tourHud) tourHud.style.display = "none";
  if (state.matchKind === "tutorial") {
    state.matchKind = "league";
  }
  state.isAnimating = false;
  activePieceAnim = null;
  return _v531StartVideoAuthenticMatch();
};


// ============================================================================


// SECTION 20: v5.5.0 GRANDMASTER RANKED AI ENGINE (2-PLY MINIMAX LOOKAHEAD,
// FULL LV.8-10 + CLv+6..+10 + EVO +10 DMG/+1★ WHEEL SCALING, 6-COST TACTICAL
// PLATES WITH DOUBLE CHANCE RE-SPIN, MAX REVIVE, MEGA UX & GOAL LOCKDOWN)
// ============================================================================

// 1. Upgrade `getActiveWheel` so unit-level `unit.level` (Miss reduction -> largest attack)
// and `unit.clv` (+DMG to primary attacks) apply directly to AI units (P2) as well as P1!
const _v540GetActiveWheel = getActiveWheel;
getActiveWheel = function(unit) {
  const segs = _v540GetActiveWheel(unit).map(s => ({ ...s }));
  if (!unit) return segs;

  // Apply unit-specific Level Miss Reduction (Lv.2..10 reduces Red Miss up to -9 slices and adds to best non-red slice!)
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

  // Ensure AI units (`owner === 'p2'`) always receive their full `unit.clv` (+1 DMG per CLv) on all damaging white/gold attacks!
  if (unit.owner === "p2" && (unit.clv || 0) > 0) {
    const extraClv = Math.min(10, unit.clv || 0);
    segs.forEach((s, idx) => {
      if (s.dmg > 0) {
        // Note: _v540GetActiveWheel already added clv to sIdx===0 if fig.clvAlloc wasn't set, so add to remaining damaging slices and +4 bonus on primary!
        if (idx > 0) s.dmg += extraClv;
      }
    });
  }
  return segs;
};

// 2. Build an Unforgiving Grandmaster Counter-Deck for Ranked AI (`analyzePlayerDeckAndBuildCounterTeam`)
analyzePlayerDeckAndBuildCounterTeam = function() {
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
    (f.wheel || []).forEach(w => {
      if (w.color === "purple") totalPurpleSlices += (w.size || 0);
      if (w.color === "gold")   totalGoldSlices   += (w.size || 0);
      if ((w.color === "white" || w.color === "gold") && (w.dmg || 0) >= 100) totalWhiteHeavy += (w.size || 0);
    });
  });
  saveAdaptiveAIBrain();

  const pElo = (window.trainerProfileData && window.trainerProfileData.rankRating) ? window.trainerProfileData.rankRating : 1000;
  const isRankedMatch = (state.matchKind === "league");

  // Score all 306 figures in FIGURES_DB to select the deadliest EX/UX Counter-Team!
  const scoredCandidates = FIGURES_DB.map((f, idx) => {
    const wList = f.wheel || [];
    const goldSize   = wList.filter(w => w.color === "gold").reduce((s, w) => s + (w.size || 0), 0);
    const purpleSize = wList.filter(w => w.color === "purple").reduce((s, w) => s + (w.size || 0), 0);
    const blueSize   = wList.filter(w => w.color === "blue").reduce((s, w) => s + (w.size || 0), 0);
    const missSize   = wList.filter(w => w.color === "red").reduce((s, w) => s + (w.size || 0), 0);
    const maxDmg     = wList.reduce((m, w) => Math.max(m, w.dmg || 0), 0);
    const maxStars   = wList.reduce((m, w) => Math.max(m, w.stars || 0), 0);
    const rarBonus   = (f.rarity === "UX" ? 95 : (f.rarity === "EX" ? 75 : (f.rarity === "R" ? 30 : 0)));

    let score = rarBonus + maxDmg * 0.85 + maxStars * 26 + goldSize * 0.95 + purpleSize * 0.75 + blueSize * 0.80 - missSize * 1.2;

    // Hard counter weights based on Player's active deck!
    if (totalPurpleSlices >= 60 && goldSize >= 20) score += goldSize * 2.4;
    if (totalWhiteHeavy >= 90 && (purpleSize >= 24 || maxStars >= 3 || maxDmg >= 140)) score += purpleSize * 1.8 + maxStars * 25;
    if (runner3MpCount >= 2 && (f.canPassThrough || f.mp >= 3 || blueSize >= 20 || maxDmg >= 130)) score += 55;
    if (f.canPassThrough) score += 45; // Pass-through Ghost/Soar/Teleport figures are lethal in Grandmaster play!

    // Small controlled jitter among top meta picks so each match feels fresh yet brutal
    score += (Math.random() * 14);
    return { idx, f, score, mp: f.mp, goldSize, purpleSize, blueSize, maxDmg, maxStars, pass: Boolean(f.canPassThrough) };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);

  // Assemble Grandmaster 6-Figure Meta Lineup:
  // 1) 2 High-Tier 3-MP Infiltrators / Gold Runners (for Entry Point Blitz, Surround Traps & Goal Pressure)
  // 2) 2 Heavy EX/UX Bruisers (130–160+ DMG + Gold/Purple)
  // 3) 1 3-Star Purple / Status Controller
  // 4) 1 Impenetrable Goal Guardian / Anchor (High DMG + Blue Dodge / Purple)
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
  const aiNamesByTier = [
    { min: 2100, name: "Karolin [IA Grandmaster]" },
    { min: 1600, name: "No.9 [IA Grandmaster]" },
    { min: 1200, name: "Don Roger [IA Master]" },
    { min: 0,    name: "N.O.V.A. [IA Grandmaster]" }
  ];
  const tierObj = aiNamesByTier.find(t => pElo >= t.min) || aiNamesByTier[aiNamesByTier.length - 1];
  window.adaptiveAIOpponentName = tierObj.name;
  window.adaptiveAIDiagnosticSummary = `${tierObj.name} (${laneNames[prefLane]})`;

  const targetAiLv  = isRankedMatch ? Math.min(10, Math.max(8, maxPlayerLevel + 2)) : Math.max(5, maxPlayerLevel);
  const targetAiClv = isRankedMatch ? Math.min(10, Math.max(6, maxPlayerClv + 3))   : Math.max(2, maxPlayerClv);

  return { chosenIndices, avgPlayerLevel: targetAiLv, avgPlayerClv: targetAiClv, pElo, isRankedMatch };
};

// 3. Equip AI with a Full 6/6◆ Grandmaster Plate Arsenal!
initAITacticalPlates = function() {
  state.aiPlates = [
    { id: "hurdle",    name: "Hurdle Jump",     cost: 2, used: false },
    { id: "goalblock", name: "Goal Block",      cost: 2, used: false },
    { id: "megaplate", name: "Mega Plate [UX]", cost: 1, used: false },
    { id: "double",    name: "Double Chance",   cost: 1, used: false },
    { id: "xatk",      name: "X Attack",        cost: 1, used: false },
    { id: "xspeed",    name: "X Speed",         cost: 1, used: false }
  ];
};

// Apply Grandmaster Stats (Lv.8-10, CLv+6..+10, EvoStage +1 = +10 DMG & +1★) to AI units on match start!
const _v540StartVideoAuthenticMatch = startVideoAuthenticMatch;
startVideoAuthenticMatch = function() {
  _v540StartVideoAuthenticMatch();
  const isRanked = (state.matchKind === "league");
  const pElo = (window.trainerProfileData && window.trainerProfileData.rankRating) ? window.trainerProfileData.rankRating : 1000;
  const gmLv  = isRanked ? Math.min(10, 8 + Math.floor(Math.max(0, pElo - 1000) / 250)) : 5;
  const gmClv = isRanked ? Math.min(10, 6 + Math.floor(Math.max(0, pElo - 1000) / 200)) : 3;

  state.units.filter(u => u.owner === "p2").forEach(u => {
    u.level    = gmLv;
    u.clv      = gmClv;
    u.evoStage = isRanked ? 1 : 0; // +10 DMG and +1★ across all attacks in Ranked!
  });
};

// 4. Helper: Can ANY P1 unit reach `targetNodeId` in 1 turn from a simulated board state (including P1's Pass-Through or Hurdle Jump)?
function canEnemyReachNodeInSim(enemyRole, targetNodeId, getOccSimFn, includeHurdleJump) {
  const enemyUnits = state.units.filter(u =>
    u.owner === enemyRole &&
    u.location !== "pc" &&
    u.location !== "ultra_space" &&
    u.waitTurns === 0 &&
    u.condition !== PokemonCondition.Sleep &&
    u.condition !== PokemonCondition.Freeze
  );
  const p1HasUnusedHurdle = includeHurdleJump && state.plates && state.plates.some(p => !p.disabledInDeck && !p.used && p.id === "hurdle");

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
      // Check if eu was Surround-KO'd in simulation
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

// 5. GRANDMASTER 2-PLY MINIMAX AI ENGINE (`triggerPlayerAIMove` v5.5.0)
triggerPlayerAIMove = function() {
  if (state.matchKind === "tutorial" || state.isAnimating || state.winCelebrationAnim) return;

  // Handle post-move attack prompt if human clicked [AI] mid-turn
  if (state.postMoveAttackMode) {
    const sel = state.units.find(x => x.uid === state.selectedUnitId);
    let bestTargetNid = null;
    let bestNet = -999;
    (state.attackTargets || []).forEach(tNid => {
      const occ = unitAtNode(tNid);
      if (sel && occ) {
        const odds = computeDuelDbOdds(sel, occ);
        const net = odds.win - odds.loss;
        if (net > bestNet) { bestNet = net; bestTargetNid = tNid; }
      }
    });
    if (bestTargetNid !== null && bestNet >= -2) {
      onNodeClicked(bestTargetNid);
      return;
    }
    finishPostMoveWithoutAttack();
    return;
  }

  const owner       = state.turn; // 'p2' (or 'p1' if user tapped AI button)
  const enemyRole   = owner === "p1" ? "p2" : "p1";
  const oppGoalId   = owner === "p1" ? 3 : 10;
  const myGoalId    = owner === "p1" ? 10 : 3;
  const oppEntryIds = owner === "p1" ? [0, 6] : [7, 13];
  const myEntryIds  = owner === "p1" ? [7, 13] : [0, 6];
  const aiTitle     = window.adaptiveAIOpponentName || "IA Grandmaster";

  const aiPlates = (owner === "p2" && Array.isArray(state.aiPlates)) ? state.aiPlates : [];
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

  if (myUnits.length === 0) {
    skipOrDemoTurn();
    return;
  }

  // STEP 1: CHECK IF AI CAN WIN IMMEDIATELY THIS TURN (NORMAL MOVE OR `HURDLE JUMP` PLATE)!
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

  // STEP 2: ASSESS THREAT LEVEL AGAINST AI'S GOAL POINT (`myGoalId = 3`)
  const myGoalOccupant = unitAtNode(myGoalId);
  const myGoalDefended = Boolean(myGoalOccupant && myGoalOccupant.owner === owner);

  let minEnemyStepsToMyGoal = 99;
  const threateningEnemies = [];
  enemyBoardUnits.forEach(eu => {
    const d = NODE_BFS_DIST[eu.nodeId][myGoalId];
    if (d < minEnemyStepsToMyGoal) minEnemyStepsToMyGoal = d;
    if (d <= eu.mp + 1) threateningEnemies.push(eu);
  });

  // Dynamic Threat Level Classification:
  // Level 3 (CRITICAL): Enemy can capture goal next turn, or is adjacent to defended goal threatening surround
  // Level 2 (HIGH): Goal is undefended and enemy is within 3-4 steps, or enemy approaching within mp + 1
  // Level 1 (MODERATE): Enemy has crossed into AI's half (dist <= 5)
  // Level 0 (SAFE): Goal is securely defended and enemies are contained on player's half
  let threatLevel = 0;
  if (!myGoalDefended) {
    if (minEnemyStepsToMyGoal <= 2 || threateningEnemies.some(eu => NODE_BFS_DIST[eu.nodeId][myGoalId] <= eu.mp)) {
      threatLevel = 3; // CRITICAL: Enemy can take goal right now!
    } else if (minEnemyStepsToMyGoal <= 4 || threateningEnemies.length > 0) {
      threatLevel = 2; // HIGH: Goal is naked and enemy is closing in!
    } else if (minEnemyStepsToMyGoal <= 6) {
      threatLevel = 1; // MODERATE: Enemy advancing
    }
  } else {
    // Goal is occupied by our defender
    if (minEnemyStepsToMyGoal === 1) {
      threatLevel = 3; // Enemy right next to our goal defender (nodes 2 or 4)!
    } else if (minEnemyStepsToMyGoal <= 2) {
      threatLevel = 2; // Enemy 2 steps away
    } else if (minEnemyStepsToMyGoal <= 4) {
      threatLevel = 1;
    }
  }

  const goalInDanger = (threatLevel >= 2);
  const goalInCritical = (threatLevel >= 3);
  const prefPlayerLane = getPlayerPreferredLane();

  // Dynamic Real-Time Threat-Responsive Weights:
  let wGoalDef   = Math.min(3.5, ((adaptiveAIBrain.weights && adaptiveAIBrain.weights.goalDefense)   || 1.85));
  let wAntiSur   = Math.min(2.8, ((adaptiveAIBrain.weights && adaptiveAIBrain.weights.antiSurround)  || 1.35));
  let wEntryLk   = Math.min(3.2, ((adaptiveAIBrain.weights && adaptiveAIBrain.weights.entryLockdown) || 1.50));
  let wCombatAgg = Math.min(3.2, ((adaptiveAIBrain.weights && adaptiveAIBrain.weights.combatAggression) || 1.65));
  let wSpeedRush = Math.min(3.5, ((adaptiveAIBrain.weights && adaptiveAIBrain.weights.speedRush) || 1.95));

  // When threat level rises, pivot intelligently to lock down the goal!
  if (threatLevel === 3) {
    wGoalDef   *= 2.5; // Top priority: save the goal!
    wAntiSur   *= 1.8;
    wSpeedRush *= 0.45; // Do not blind-rush while goal is under immediate fatal threat!
  } else if (threatLevel === 2) {
    wGoalDef   *= 1.8;
    wAntiSur   *= 1.4;
    wSpeedRush *= 0.75;
  }

  // Helper: Calculate fastest turns needed to reach opponent's Goal Point from a given node
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

  // Helper: Full 2-Ply Simulation when AI moves `movingUnit` to `destNid`
  function simulate2PlyAfterAIMove(movingUnit, destNid) {
    const getOccAfterMove = (nid) => {
      if (nid === destNid) return movingUnit;
      const occ = unitAtNode(nid);
      if (occ && occ.uid === movingUnit.uid) return null;
      return occ;
    };

    // 1) Does `movingUnit` Surround-KO itself at `destNid`?
    const destNbs = ADJ[destNid] || [];
    const selfSurrounded = destNbs.length > 0 &&
      destNbs.every(nb => {
        const o = getOccAfterMove(nb);
        return o !== null && o.owner !== owner;
      });
    if (selfSurrounded) {
      return { selfSurrounded: true };
    }

    // 2) Which enemy units are immediately Surround-KO'd when `movingUnit` lands on `destNid`?
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

    // 3) CRITICAL 2-PLY CHECK: After `movingUnit` lands on `destNid`, can enemy capture or surround our Goal next turn?
    const goalOccupantAfter = getOccPostKO(myGoalId);
    let enemyCanCaptureMyGoalNextTurn = false;
    if (!goalOccupantAfter) {
      enemyCanCaptureMyGoalNextTurn = canEnemyReachNodeInSim(enemyRole, myGoalId, getOccPostKO, true);
    }

    let enemyCanSurroundMyGoalNextTurn = false;
    if (goalOccupantAfter && goalOccupantAfter.owner === owner) {
      const gNbs = ADJ[myGoalId] || [];
      const openGNbs = gNbs.filter(nb => getOccPostKO(nb) === null);
      const enemyGNbs = gNbs.filter(nb => { const o = getOccPostKO(nb); return o && o.owner !== owner; });
      if (openGNbs.length === 1 && enemyGNbs.length === (gNbs.length - 1) && canEnemyReachNodeInSim(enemyRole, openGNbs[0], getOccPostKO, true)) {
        enemyCanSurroundMyGoalNextTurn = true;
      } else if (openGNbs.length === 0 && enemyGNbs.length === gNbs.length) {
        enemyCanSurroundMyGoalNextTurn = true;
      }
    }

    // 4) 1-turn surround trap checks
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
        if (canEnemyReachNodeInSim(enemyRole, openNbs[0], getOccPostKO, true)) {
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

  // STEP 3: EVALUATE ALL CANDIDATE MOVES WITH HIGHEST TEMPO & FASTEST-WIN CALCULATION
  let bestAction = null;
  let bestScore  = -9999999;

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
      let reasonTag = usingHurdlePlate ? `Salto Ofensivo [Hurdle Jump] com ${u.name}` : `Avanço Rápido com ${u.name}`;

      // 1. ABSOLUTE 2-PLY GOAL SAFETY
      if (nid !== oppGoalId) {
        if (sim.enemyCanCaptureMyGoalNextTurn) {
          moveScore -= 500000; // Fatal blunder veto: enemy wins next turn!
        }
        if (sim.enemyCanSurroundMyGoalNextTurn) {
          moveScore -= 380000; // Fatal surround loss on goal!
        }
      }

      // 2. SURROUND KOs ACHIEVED (Guaranteed eliminations)
      if (!isStandingAttack && sim.enemyKOs.length > 0) {
        sim.enemyKOs.forEach(koUnit => {
          moveScore += 22000 * wCombatAgg;
          if (koUnit.nodeId === oppGoalId) moveScore += 120000; // Goal Surround Win!
          if (threateningEnemies.includes(koUnit)) moveScore += 18000;
          if (oppEntryIds.includes(koUnit.nodeId)) moveScore += 14000 * wEntryLk;
        });
        reasonTag = `Cerco Relâmpago (Surround KO em ${sim.enemyKOs[0].name})`;
      }

      // 3. 2-PLY ANTI-SURROUND DISCIPLINE
      if (sim.allySurroundTrapsNextTurn > 0) {
        moveScore -= 6000 * sim.allySurroundTrapsNextTurn * wAntiSur;
      }
      if (currentlyTrapped && !isStandingAttack && sim.allySurroundTrapsNextTurn === 0) {
        moveScore += 6000 * wAntiSur;
        reasonTag = `Fuga Rápida com ${u.name}`;
      }

      // 4. OFFENSIVE PINCER SETUP
      if (!isStandingAttack && sim.enemyPinnedCount > 0) {
        moveScore += 4500 * sim.enemyPinnedCount * wCombatAgg;
      }

      // 5. FASTEST-WIN TURN METRIC (CALCULA A JOGADA PARA GANHAR NO MENOR TEMPO POSSÍVEL)
      const turnsToWin = computeFastestTurnsToWin(u, nid);
      if (nid === oppGoalId) {
        moveScore += 250000; // Instant Victory!
        reasonTag = `🏆 Vitória Imediata no Goal Point com ${u.name}!`;
      } else if (turnsToWin === 1) {
        moveScore += 88000 * wSpeedRush;
        reasonTag = `⚡ Xeque Letal no Goal! (Vitória em 1 Turno com ${u.name})`;
      } else if (turnsToWin === 2) {
        moveScore += 48000 * wSpeedRush;
        reasonTag = `🚀 Rota Direta de Xeque (2 Turnos com ${u.name})`;
      } else if (turnsToWin === 3) {
        moveScore += 26000 * wSpeedRush;
      } else if (turnsToWin === 4) {
        moveScore += 14000 * wSpeedRush;
      }

      // 6. EXPONENTIAL FORWARD GOAL PULL (PUXADA AGRESSIVA PARA O GOL ADVERSÁRIO)
      const distToOppGoal = NODE_BFS_DIST[nid][oppGoalId];
      const goalPull = Math.pow(Math.max(0, 13 - distToOppGoal), 3.2) * 26 * wSpeedRush;
      moveScore += goalPull;

      if (distToOppGoal === 1) {
        moveScore += 16000 * wSpeedRush;
        reasonTag = `Ameaça Imediata ao Goal Inimigo com ${u.name}!`;
      }

      // 7. ENTRY POINT LOCKDOWN (ASFIXIA TOTAL & WAIT WIN RÁPIDO)
      if (oppEntryIds.includes(nid)) {
        const otherEntry = oppEntryIds.find(id => id !== nid);
        const otherOcc = otherEntry !== undefined ? unitAtNode(otherEntry) : null;
        const otherTakenByAI = Boolean(otherOcc && otherOcc.owner === owner);
        moveScore += (otherTakenByAI ? 95000 : 42000) * wEntryLk;
        reasonTag = otherTakenByAI
          ? `🔒 Asfixia Dupla dos Entry Points (${u.name}) — Vitória por Wait-Win!`
          : `⚡ Invasão do Entry Point Inimigo com ${u.name}!`;
      }

      // 8. GOAL DEFENSE & DEFENDER DISCIPLINE
      const distToMyGoal = NODE_BFS_DIST[nid][myGoalId];

      // A. The Goal Defender standing on `myGoalId` MUST NOT abandon the goal unless winning right now!
      if (u.location === "board" && u.nodeId === myGoalId && nid !== myGoalId) {
        if (nid !== oppGoalId) {
          if (threatLevel >= 1 || minEnemyStepsToMyGoal <= 4) {
            moveScore -= 450000; // Strict Veto: never abandon goal when enemies are on the board!
          } else {
            moveScore -= 150000;
          }
        }
      }

      // B. If Goal is undefended, establishing/moving onto `myGoalId` is maximum priority!
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
        // Goal already has a keeper. If an enemy approaches within 2 steps, reinforcing guard on neighbor nodes (2/4) prevents surround!
        if (distToMyGoal === 1 && minEnemyStepsToMyGoal <= 2 && !sim.enemyCanCaptureMyGoalNextTurn) {
          moveScore += 55000 * wGoalDef;
          reasonTag = `Suporte Anti-Cerco ao Goal Defender com ${u.name}`;
        }
      }

      // 9. OPENING & BENCH DEPLOYMENT
      if (u.location === "bench") {
        const myBoardCount = state.units.filter(x => x.owner === owner && x.location === "board").length;
        if (myBoardCount < 3) moveScore += 2400;
        // Deploying a defender toward the goal when undefended
        if (!myGoalDefended && distToMyGoal <= 3) {
          moveScore += 28000 * wGoalDef;
        }
        if (u.mp >= 3 && state.turnCounter >= 288) {
          moveScore += 16000 * wSpeedRush;
          reasonTag = `Blitz de Abertura com ${u.name} (3 MP)`;
        }
      }

      // 10. EVALUATE COMBAT (BREAKTHROUGH ATTACKS VS TACTICAL HOLD)
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
        // Combat vs Hold: Assess each enemy target
        let bestTargetForThisMove = null;
        let bestAtkScoreForThisMove = -9999999;

        adjEnemiesAtDest.forEach(({ nodeId: enemyNid, unit: eu }) => {
          const baseOdds = computeDuelDbOdds(u, eu);
          const isGoalDefender = (eu.nodeId === oppGoalId);
          const isEntryDefender = oppEntryIds.includes(eu.nodeId);
          const isDirectBlocker = (NODE_BFS_DIST[eu.nodeId][oppGoalId] < distToOppGoal);

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

          // Never gamble away our own Goal defender with high loss chance!
          if (nid === myGoalId) {
            const mustAttackToSurvive = sim.enemyCanSurroundMyGoalNextTurn;
            if (!mustAttackToSurvive && (effectiveWin < 72 || effectiveLoss > 14)) {
              return; // Hold ground on the goal! Don't gamble!
            }
          }

          // Highly aggressive thresholds for breakthrough:
          // If attacking enemy on Goal Point: MUST ATTACK to win in minimum turns!
          const shouldAttack = (
            (isGoalDefender && effectiveWin >= 30) ||
            (isEntryDefender && effectiveWin >= 38) ||
            (isDirectBlocker && effectiveWin >= 42) ||
            (effectiveNet >= -2 || effectiveWin >= 45)
          );

          if (shouldAttack) {
            let atkScore = moveScore + (effectiveNet * 32 + effectiveWin * 24) * wCombatAgg;
            if (isGoalDefender) {
              atkScore += 70000 * wSpeedRush; // Knocking out the goal defender is game-winning!
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

        // If an attack was selected, compare attack vs hold
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
          // If no good attack odds, hold position to block, defend or surround next turn!
          let holdScore = moveScore;
          if (sim.enemyPinnedCount > 0) holdScore += 3000 * wAntiSur;
          if (nid === myGoalId) holdScore += 65000 * wGoalDef; // Holding ground on goal point is top-tier play!
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

  // STEP 4: EMERGENCY `GOAL BLOCK` PLATE CHECK!
  // If after evaluating all moves, our best action STILL leaves `myGoalId` undefended and under threat,
  // immediately activate `Goal Block` plate to teleport our strongest defender onto `myGoalId`!
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

  // STEP 5: EXECUTE THE CHOSEN GRANDMASTER ACTION!
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
      // Apply AI Double Chance Re-Spin on standing attack if first spin doesn't win!
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

