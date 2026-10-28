// ============================================================================
// 60 FPS FULL HD 3x TABLETOP ENGINE, 28-NODE TOPOLOGY & VECTOR RENDERER
// ============================================================================
// Canvas roundRect Polyfill for universal browser/webview compatibility
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    let r = Array.isArray(radii) ? (radii[0] || 0) : (typeof radii === "number" ? radii : 0);
    if (r < 0) r = 0;
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

// ============================================================================
// 0. 3x FULL HD (1059x1590) SUPER-RESOLUTION CONSTANTS & ASSETS
// ============================================================================
const HD_SCALE = 2;

window.pixelArtMode = "hd";
function cyclePixelArtMode() {
  const modes = ["16bit", "8bit", "hd"];
  const labels = { "16bit": "👾 Pixel: 16-Bit", "8bit": "🕹️ Pixel: 8-Bit", "hd": "✨ Modo: Suave" };
  const curIdx = modes.indexOf(window.pixelArtMode || "16bit");
  window.pixelArtMode = modes[(curIdx + 1) % modes.length];
  const btn = document.getElementById("pixel-mode-btn");
  if (btn) btn.textContent = labels[window.pixelArtMode];
  document.body.classList.toggle("pixel-mode-8bit", window.pixelArtMode === "8bit");

  const bCanvas = document.getElementById("board-canvas");
  const dCanvas = document.getElementById("datadisk-canvas");
  if (window.pixelArtMode === "8bit") {
    bCanvas.width = 353; bCanvas.height = 530;
    dCanvas.width = 353; dCanvas.height = 530;
    window.ACTIVE_SCALE = 1;
  } else if (window.pixelArtMode === "16bit") {
    bCanvas.width = 706; bCanvas.height = 1060;
    dCanvas.width = 706; dCanvas.height = 1060;
    window.ACTIVE_SCALE = 3;
  } else {
    bCanvas.width = 1059; bCanvas.height = 1590;
    dCanvas.width = 1059; dCanvas.height = 1590;
    window.ACTIVE_SCALE = 3;
  }
  playSfx("portal");
}
window.ACTIVE_SCALE = 3;
 // 353x530 logical -> 1059x1590 hardware pixels (Full HD 1080p!)
const LOGICAL_W = 353;
const LOGICAL_H = 530;

const UPLOADED_REPO_FILES = {};
// (AUTHENTIC_FIG_SPRITES loaded from js/data/sprites.js)
const CLEAN_BOARD_URI = typeof CLASSIC_ARENA_B64 !== "undefined" ? CLASSIC_ARENA_B64 : "assets/arena/classic_arena.jpg";
const cleanBoardImg = new Image(); cleanBoardImg.src = CLEAN_BOARD_URI;
const bananaArenaImg = new Image(); bananaArenaImg.src = typeof BANANA_ARENA_B64 !== "undefined" ? BANANA_ARENA_B64 : "assets/arena/carmonte_arena.jpg";


// ============================================================================
// 1. `Monaco.Client.Models.dll` `PokemonCondition` & DETERMINISTIC `libTFG` PRNG
// ============================================================================
const PokemonCondition = {
  Normal:    0x00,
  Panic:     0x01,
  Poison:    0x04,
  BadPoison: 0x07,
  Faint:     0x08,
  Sleep:     0x12,
  Freeze:    0x16,
  Melt:      0x19,
  Paralyze:  0x23,
  Burn:      0x25
};

const CONDITION_BADGES = {
  0x00: null,
  0x01: { lbl: "PANIC", col: "#c084fc" },
  0x04: { lbl: "PSN-20", col: "#a855f7" },
  0x07: { lbl: "TOX-40", col: "#7e22ce" },
  0x12: { lbl: "SLEEP", col: "#94a3b8" },
  0x16: { lbl: "FREEZE", col: "#38bdf8" },
  0x23: { lbl: "PARA", col: "#facc15" },
  0x25: { lbl: "BURN", col: "#f97316" }
};

function generateFreshSeed32() {
  try {
    if (window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      if (arr[0] !== 0) return arr[0] >>> 0;
    }
  } catch (e) {}
  return ((Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF) ^ Math.floor(performance.now() * 1000)) >>> 0) || 0x7F4A9C12;
}

let sharedPrngState = generateFreshSeed32();
function setSharedSeed(seedInt) {
  sharedPrngState = (seedInt >>> 0) || generateFreshSeed32();
}
function nextDeterministicRandom() {
  // In local AI / Pass & Play modes, mix fresh hardware entropy so spins have 100% natural variation!
  if (typeof state !== "undefined" && state.mode !== "p2p") {
    sharedPrngState = (sharedPrngState ^ Math.floor(Math.random() * 0xFFFFFFFF) ^ Math.floor(performance.now() * 1000)) >>> 0;
  }
  let t = (sharedPrngState = (sharedPrngState + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}



// ============================================================================
// 4. EXACT 28-NODE POKÉMON DUEL BOARD TOPOLOGY (LOGICAL 353x530 -> 3x 1059x1590 HD)
// ============================================================================
const BOARD_NODES = [
  // Row 1: Top Outer Row (y = 185, 7 nodes: 0..6)
  { id:0,  x:73,  y:185, role:"entry_p2" },
  { id:1,  x:108, y:185, role:"normal" },
  { id:2,  x:142, y:185, role:"normal" },   // Diagonal spoke to Inner Top-Center (21)
  { id:3,  x:176, y:185, role:"goal_p2" },  // Top Goal Point ▷
  { id:4,  x:210, y:185, role:"normal" },
  { id:5,  x:245, y:185, role:"normal" },
  { id:6,  x:279, y:185, role:"entry_p2" },

  // Row 5: Bottom Outer Row (y = 343, 7 nodes: 7..13)
  { id:7,  x:63,  y:343, role:"entry_p1" },
  { id:8,  x:100, y:343, role:"normal" },
  { id:9,  x:138, y:343, role:"normal" },
  { id:10, x:176, y:343, role:"goal_p1" },  // Bottom Neon Cyan Goal Point ▷
  { id:11, x:214, y:343, role:"normal" },   // Diagonal spoke to Inner Bottom-Center (26)
  { id:12, x:252, y:343, role:"normal" },
  { id:13, x:289, y:343, role:"entry_p1" },

  // Left Outer Column (3 intermediate nodes: 14..16)
  { id:14, x:70,  y:221, role:"normal" },
  { id:15, x:68,  y:260, role:"normal" },
  { id:16, x:65,  y:300, role:"normal" },

  // Right Outer Column (3 intermediate nodes: 17..19)
  { id:17, x:282, y:221, role:"normal" },
  { id:18, x:284, y:260, role:"normal" },
  { id:19, x:287, y:300, role:"normal" },

  // Inner Ring (8 nodes: 20..27)
  { id:20, x:123, y:221, role:"inner" },
  { id:21, x:176, y:221, role:"inner" },
  { id:22, x:229, y:221, role:"inner" },
  { id:23, x:122, y:260, role:"inner" },
  { id:24, x:230, y:260, role:"inner" },
  { id:25, x:121, y:300, role:"inner" },
  { id:26, x:176, y:300, role:"inner" },
  { id:27, x:231, y:300, role:"inner" }
];

const BOARD_EDGES = [
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],
  [7,8],[8,9],[9,10],[10,11],[11,12],[12,13],
  [0,14],[14,15],[15,16],[16,7],
  [6,17],[17,18],[18,19],[19,13],
  [20,21],[21,22],[22,24],[24,27],[27,26],[26,25],[25,23],[23,20],
  [0,20],[6,22],[7,25],[13,27],
  [2,21],[11,26]
];

const ADJ = {};
BOARD_NODES.forEach(n => ADJ[n.id] = []);
BOARD_EDGES.forEach(([a,b]) => { ADJ[a].push(b); ADJ[b].push(a); });

// 180-Degree Opposite Tabletop Seat Mapping (so Player 2 sits across the table with their own Goal/Bench at the bottom!)
const ROT180_NODE_MAP = {
  0:13, 1:12, 2:11, 3:10, 4:9,  5:8,  6:7,
  7:6,  8:5,  9:4,  10:3, 11:2, 12:1, 13:0,
  14:19, 15:18, 16:17,
  17:16, 18:15, 19:14,
  20:27, 21:26, 22:25,
  23:24, 24:23,
  25:22, 26:21, 27:20
};
function getBottomRole() {
  if (state.viewSeatOverride === "p1" || state.viewSeatOverride === "p2") return state.viewSeatOverride;
  if (state.mode === "p2p") return state.myRole || "p1";
  if (state.mode === "pass") return state.turn || "p1";
  return "p1";
}
function isBoardFlipped() {
  return getBottomRole() === "p2";
}
function getNodePos(nodeId) {
  const mappedId = isBoardFlipped() ? (ROT180_NODE_MAP[nodeId] !== undefined ? ROT180_NODE_MAP[nodeId] : nodeId) : nodeId;
  return BOARD_NODES[mappedId] || BOARD_NODES[0];
}
function toggleTablePerspective() {
  const cur = getBottomRole();
  state.viewSeatOverride = (cur === "p1") ? "p2" : "p1";
  playSfx("portal");
  setLogText(state.viewSeatOverride === "p2"
    ? "🔄 Visão da Mesa: Lado P2 (Vermelho Embaixo · Olhando P1 no Topo)"
    : "🔄 Visão da Mesa: Lado P1 (Azul Embaixo · Olhando P2 no Topo)");
}

const P2_BENCH_COORDS = [
  { x: 142, y: 122 },
  { x: 190, y: 122 },
  { x: 238, y: 122 },
  { x: 166, y: 144 },
  { x: 215, y: 144 },
  { x: 264, y: 144 }
];

const BENCH_SLOTS_P1 = [
  { x: 73,  y: 396 },
  { x: 131, y: 396 },
  { x: 190, y: 396 },
  { x: 101, y: 422 },
  { x: 160, y: 422 },
  { x: 218, y: 422 }
];

const REVIVER_PODS_P2 = [ { x: 73.5, y: 128 }, { x: 109.0, y: 128 } ];
const REVIVER_PODS_P1 = [ { x: 252,   y: 396 }, { x: 293,   y: 396 } ];
const EXTRA_PLUS_SLOTS = REVIVER_PODS_P1;

// ============================================================================
// 5. MATCH STATE & CLEAN 6v6 BENCH MATCH START (0 POKÉMON ON FIELD AT START!)
// ============================================================================
let state = {
  mode: "ai",
  isMatchActive: false,
  matchFinished: false,
  myRole: "p1",
  turn: "p1",
  turnCounter: 300,
  logText: "Match Start! Select a Pokémon.",
  rareMetals: 23,
  chainCubes: 14,
  surface: "crystal",
  isAnimating: false,
  activePlate: null,
  abilityJumpActive: false,
  selectedUnitId: null,
  reachableNodes: [],
  reachablePaths: {},
  attackTargets: [],
  units: [],
  reviverQueueP1: [],
  reviverQueueP2: [],
  historyStack: [],
  deckP1: [1, 2, 3, 4, 6, 0], // Time #1 Inicial: Pikachu, Squirtle, Bulbasaur, Eevee, Charmander, Charizard
  deckP2: [5, 6, 7, 0, 2, 8], // Lapras, Charmander, Venusaur, Charizard, Squirtle, Kabutops
  meadowPowerActive: false,
  selectedPlateIdx: 0,
  preMatchAnim: null,
  turnBannerAnim: null,
  winCelebrationAnim: null,
  postMoveAttackMode: false,
  pendingPostMoveTurn: null,
  doubleChanceArmed: false,
  doubleChanceWaitingChoice: false,
  excludedP1: [],
  excludedP2: [],
  clockMsP1: 300000,
  clockMsP2: 300000,
  lastClockTick: 0,
  goldenFiguresActive: false,
  bracketRound: 0,
  plates: [
    { id:"hurdle",    name:"Hurdle Jump",    rarity:"R",  badge:"🦘",  sub:"Salta sobre uma peça adjacente respeitando o consumo de MP da casa pulada.", cost:2, used:false, log:"Used Hurdle Jump (Salto Ativo)." },
    { id:"double",    name:"Double Chance",  rarity:"R",  badge:"2×",  sub:"Permite girar a roleta novamente se o primeiro giro for desfavorável.", cost:1, used:false, log:"Used Double Chance (Re-Spin pronto)." },
    { id:"xatk",      name:"X Attack",       rarity:"UC", badge:"+30", sub:"Adiciona +30 de dano a todos os ataques da sua figura neste turno.", cost:1, used:false, log:"Used X Attack (+30 DMG neste turno)!" },
    { id:"xspeed",    name:"X Speed",        rarity:"UC", badge:"⚡",  sub:"Transforma todos os ataques Brancos em Dourados (Gold quebra Roxo) neste turno.", cost:1, used:false, log:"Used X Speed (White ➔ Gold)!" },
    { id:"revive",    name:"Max Revive",     rarity:"EX", badge:"💖",  sub:"Retira uma figura do P.C. e coloca-a de volta no Banco sem Wait (Wait 0).", cost:2, used:false, log:"Used Max Revive (P.C. ➔ Banco sem Wait)!" },
    { id:"goalblock", name:"Goal Block",     rarity:"R",  badge:"🛡️",  sub:"Teleporta uma figura aliada do campo para o seu Goal Point em emergência (recebe Wait 1).", cost:2, used:false, log:"Used Goal Block (Teleportado ao Goal + Wait 1)!" },
    { id:"megaplate", name:"Mega Plate [UX]",rarity:"UX", badge:"🧬",  sub:"Mega Evolui a figura selecionada por 5 turnos (+20 DMG, +1★, +1 MP e Pass-Through).", cost:1, used:false, log:"Used Mega Evolution Plate (7 Turnos [UX])!" },
    { id:"longthrow", name:"Long Throw",     rarity:"R",  badge:"🎯",  sub:"Desce uma figura do Banco adjacente ao Entry Point mesmo com Spawn Block.", cost:2, used:false, log:"Used Long Throw!" },
    { id:"pkmswitch", name:"Pokémon Switch", rarity:"UC", badge:"⇄",   sub:"Troca uma figura aliada do campo por uma figura do seu Banco.", cost:1, used:false, log:"Used Pokémon Switch!" }
  ]
};

let boardParticles = [], boardShockwaves = [], boardBeams = [], activePieceAnim = null;

// (POKEMON_EVOLUTION_FAMILIES, getEvolutionChainToTarget, findFigureByName loaded from js/data/figures.js)
function makeTeamUnits(owner, deckIndices) {
  return deckIndices.map((idx, slot) => {
    const base = FIGURES_DB[idx % FIGURES_DB.length];
    const targetName = base.name;
    const chain = getEvolutionChainToTarget(targetName);

    // CRITICAL: Megas NEVER start as Mega in a match!
    // Find the earliest valid non-Mega starting figure in the evolution chain that exists in FIGURES_DB
    let startFig = null;
    let startName = targetName;
    if (chain && chain.length > 0) {
      for (let i = 0; i < chain.length; i++) {
        const candidateName = chain[i];
        if (candidateName.startsWith("Mega ") || candidateName.startsWith("Primal ")) continue;
        const fig = findFigureByName(candidateName);
        if (fig) {
          startFig = fig;
          startName = fig.name;
          break;
        }
      }
    }
    // If targetName itself was a Mega and no prior non-Mega step was found, strip "Mega " and look up base
    if (!startFig && (targetName.startsWith("Mega ") || targetName.startsWith("Primal ") || base.rarity === "UX")) {
      const baseCandidate = targetName.replace(/^Mega\s+/, "").replace(/^Primal\s+/, "").replace(/\s+[XY]$/, "");
      startFig = findFigureByName(baseCandidate);
    }
    if (!startFig) {
      startFig = base;
      startName = base.name;
    }

    const startFigIdx = (typeof FIGURES_DB !== "undefined" && FIGURES_DB.indexOf(startFig) !== -1)
      ? FIGURES_DB.indexOf(startFig)
      : (idx % FIGURES_DB.length);

    let spriteKey = startFig.spriteKey || startFig.id;
    if (owner === "p1" && startFig.id === "pikachu" && slot === 1) spriteKey = "pikachu_back";
    if (owner === "p2" && startFig.id === "squirtle") spriteKey = "squirtle_p2";

    const currentEvoStep = chain.findIndex(n => n.toLowerCase().replace(/[\s\-_]/g, "") === startFig.name.toLowerCase().replace(/[\s\-_]/g, ""));

    return {
      uid: owner + "_" + slot,
      owner,
      benchSlot: slot,
      deckTargetName: targetName,
      targetIdx: idx % FIGURES_DB.length,
      evoChain: chain,
      evoStep: Math.max(0, currentEvoStep),
      evoStage: 0,
      baseIdx: startFigIdx,
      baseId: startFig.id,
      spriteKey,
      name: startFig.name,
      mp: startFig.mp || base.mp || 2,
      baseMp: startFig.mp || base.mp || 2,
      type: startFig.type || base.type,
      rarity: startFig.rarity || base.rarity,
      level: base.level || 5,
      clv: base.clv || 0,
      location: "bench", // ALL 6 Pokémon start on the bench!
      nodeId: null,      // ZERO Pokémon on the field at match start!
      condition: PokemonCondition.Normal,
      waitTurns: 0
    };
  });
}

function demoFullMatchState() {
  // Reset all tutorial step locks and animation locks
  tutorialStepBusy = false;
  currentTutorialStep = 0;
  hideTutorialCoachHud();
  const tourHud = document.getElementById("tutorial-hub-tour-hud");
  if (tourHud) tourHud.style.display = "none";

  if (state.mode === "p2p" || state.gameMode === "p2p") {
    const hasLivePeer = (typeof peerConnObj !== "undefined" && peerConnObj) || (typeof broadcastChan !== "undefined" && broadcastChan);
    if (hasLivePeer) {
      state.matchKind = "p2p";
      state.mode = "p2p";
      state.gameMode = "p2p";
    } else {
      state.matchKind = "league";
      state.mode = "ai";
      state.gameMode = "ai";
    }
  } else if (state.mode === "pass" || state.gameMode === "pass") {
    state.matchKind = "pass";
    state.mode = "pass";
    state.gameMode = "pass";
  } else if (state.mode === "tutorial" || state.matchKind === "tutorial") {
    state.matchKind = "tutorial";
    state.mode = "tutorial";
  } else {
    state.matchKind = "league";
  }

  state.isAnimating = false;
  activePieceAnim = null;
  state.preMatchAnim = null;
  state.winCelebrationAnim = null;
  state.turnBannerAnim = null;

  state.units = [
    ...makeTeamUnits("p1", state.deckP1),
    ...makeTeamUnits("p2", state.deckP2)
  ];
  state.units.forEach(u => { u.evoStage = 0; u.megaTurns = 0; u.baseMp = u.mp; });
  state.reviverQueueP1 = [];
  state.reviverQueueP2 = [];
  state.excludedP1 = [];
  state.excludedP2 = [];
  state.plates.forEach(p => {
    p.used = false;
    p.usedP1 = false;
    p.usedP2 = false;
  });
  state.activePlate = null;
  state.abilityJumpActive = false;
  state.longThrowActive = false;
  state.postMoveAttackMode = false;
  state.pendingPostMoveTurn = null;
  state.doubleChanceArmed = false;
  state.doubleChanceWaitingChoice = false;
  state.clockMsP1 = 300000;
  state.clockMsP2 = 300000;
  state.lastClockTick = performance.now();
  state.turn = "p1";
  state.turnCounter = 300;
  state.selectedUnitId = null;
  state.reachableNodes = [];
  state.reachablePaths = {};
  state.attackTargets = [];
  state.historyStack = [];

  if (state.mode === "p2p") {
    const isMine = (state.myRole === "p1");
    setLogText(isMine ? "🟢 SUA VEZ! (P1 Azul · Embaixo) Selecione uma figura no Banco." : "⏳ Vez do Oponente P1... (Sua Mesa P2 · Embaixo)");
  } else if (state.mode === "pass") {
    setLogText("🔵 VEZ DO JOGADOR 1 (Azul · Embaixo) Selecione uma figura no Banco.");
  } else {
    setLogText("TURN 300 (First Turn: -1 MP). Select a Pokémon!");
  }
  renderPlatesTray();
}

function setLogText(txt) { state.logText = txt; }
function unitAtNode(nodeId) { return state.units.find(u => u.location === "board" && u.nodeId === nodeId) || null; }

function getActivePlateOwner() {
  if (state.mode === "p2p") return state.myRole || "p1";
  if (state.mode === "pass") return state.turn || "p1";
  return "p1";
}

function syncActivePlayerPlates() {
  if (!state.plates || !Array.isArray(state.plates)) return;
  const owner = getActivePlateOwner();
  state.plates.forEach(p => {
    if (typeof p.usedP1 !== "boolean") p.usedP1 = false;
    if (typeof p.usedP2 !== "boolean") p.usedP2 = false;
    if (state.mode === "p2p" || state.mode === "pass") {
      p.used = (owner === "p2") ? p.usedP2 : p.usedP1;
    }
  });
}

function markPlateUsedForCurrentOwner(p, val = true) {
  if (!p) return;
  const owner = getActivePlateOwner();
  if (owner === "p2") {
    p.usedP2 = Boolean(val);
  } else {
    p.usedP1 = Boolean(val);
  }
  p.used = Boolean(val);
}

window.getActivePlateOwner = getActivePlateOwner;
window.syncActivePlayerPlates = syncActivePlayerPlates;
window.markPlateUsedForCurrentOwner = markPlateUsedForCurrentOwner;

function togglePlatesTray(force) {
  const el = document.getElementById("plates-tray");
  if (!el) return;
  syncActivePlayerPlates();
  const show = (typeof force === "boolean") ? force : !el.classList.contains("show");
  el.classList.toggle("show", show);
  if (show) renderPlatesTray();
}

function toggleZMoveFromTray() {}

function renderPlatesTray() {
  syncActivePlayerPlates();
  const grid = document.getElementById("plates-grid");
  if (!grid) return;
  grid.innerHTML = "";
  const selIdx = state.selectedPlateIdx || 0;
  const curP = state.plates[selIdx] || state.plates[0];

  // Update the big featured black plate card (`03:34` in video!)
  const cCost = document.getElementById("pcard-cost");
  const cRar  = document.getElementById("pcard-rarity");
  const cBdg  = document.getElementById("pcard-badge");
  const cName = document.getElementById("pcard-name");
  const cDesc = document.getElementById("pcard-desc");
  const uBtn  = document.getElementById("plate-use-btn");
  const curPlateName = (typeof t === "function") ? t("plate." + curP.id + ".name", curP.name) : curP.name;
  const curPlateDesc = (typeof t === "function") ? t("plate." + curP.id + ".sub", curP.sub || "") : (curP.sub || "");
  if (cCost) cCost.textContent = "COST " + "◆".repeat(curP.cost);
  if (cRar)  cRar.textContent = curP.rarity || "C";
  if (cBdg)  cBdg.textContent = curP.badge || "+20";
  if (cName) cName.textContent = curPlateName;
  if (cDesc) {
    cDesc.innerHTML = curPlateDesc;
  }
  if (uBtn) {
    uBtn.style.opacity = curP.used ? "0.4" : "1.0";
    uBtn.textContent = (typeof t === "function") ? t("plate.use_btn", "USAR CARTA") : "USAR CARTA";
  }

  state.plates.forEach((p, idx) => {
    const itemPlateName = (typeof t === "function") ? t("plate." + p.id + ".name", p.name) : p.name;
    const div = document.createElement("div");
    div.className = `plate-card ${p.used ? "used" : ""} ${selIdx === idx ? "active" : ""}`;
    div.style.minWidth = "78px";
    div.style.textAlign = "center";
    div.innerHTML = `
      <span class="p-cost">${p.rarity || "C"}</span>
      <div style="font-size:12px; font-weight:900; color:#f97316; margin:2px 0;">${p.badge || "+20"}</div>
      <div class="p-title" style="font-size:8.5px;">${itemPlateName}</div>
    `;
    div.onclick = () => {
      state.selectedPlateIdx = idx;
      playSfx("tick");
      renderPlatesTray();
    };
    grid.appendChild(div);
  });
}

function executeGoalBlockWithUnit(candidate) {
  state.pendingPlateAction = null;
  const goalId = state.turn === "p1" ? 10 : 3;
  if (unitAtNode(goalId)) {
    setLogText("⚠️ Goal Block: Seu Goal Point já está ocupado!");
    playSfx("hit");
    return;
  }
  syncActivePlayerPlates();
  const p = (state.plates && state.plates.find(x => x.id === "goalblock" && !x.used))
         || (state.plates && state.plates.find(x => x.id === "goalblock"));
  if (p) markPlateUsedForCurrentOwner(p, true);
  renderPlatesTray();

  candidate.location = "board";
  candidate.nodeId = goalId;
  candidate.waitTurns = 2; // Decays to Wait 1 at end of turn!
  activePieceAnim = null;

  const gPos = getNodePos(goalId);
  spawnPortalParticles(gPos.x, gPos.y, "#38bdf8");
  playSfx("portal");
  setLogText(`🛡️ Goal Block: ${candidate.name} teleportado para defender o Goal Point (Wait 1)!`);

  checkSurroundKOs();

  const nextT = state.turn === "p1" ? "p2" : "p1";
  const nextC = Math.max(0, state.turnCounter - 1);

  if (state.mode === "p2p" && typeof sendP2PPacket === "function") {
    sendP2PPacket({
      type: "P2P_PLATE",
      plateId: "goalblock",
      unitUid: candidate.uid,
      targetNodeId: goalId,
      turn: state.turn,
      nextTurn: nextT,
      nextTurnCounter: nextC
    });
  }
  endTurn(false, nextT, nextC);
}

function confirmUseSelectedPlate() {
  syncActivePlayerPlates();
  const p = state.plates[state.selectedPlateIdx || 0];
  if (!p || !canControlTurn() || p.used || state.isAnimating) return;

  if (p.id === "goalblock") {
    const goalId = state.turn === "p1" ? 10 : 3;
    if (unitAtNode(goalId)) {
      setLogText("⚠️ Goal Block: Seu Goal Point já está ocupado!");
      playSfx("hit");
      return;
    }
    const selectedCandidate = state.units.find(u => u.owner === state.turn && u.uid === state.selectedUnitId && u.waitTurns === 0 && (u.location === "board" || u.location === "bench"));
    if (selectedCandidate) {
      togglePlatesTray(false);
      executeGoalBlockWithUnit(selectedCandidate);
    } else {
      togglePlatesTray(false);
      state.pendingPlateAction = "goalblock";
      playSfx("portal");
      setLogText("🛡️ Goal Block Ativado: Toque no Pokémon (em campo ou no banco) para defender o Goal Point!");
    }
    return;
  }

  markPlateUsedForCurrentOwner(p, true);
  playSfx("portal");
  setLogText(p.log);
  togglePlatesTray(false);

  if (p.id === "meadow") {
    state.meadowPowerActive = true;
    if (state.mode === "p2p" && typeof sendP2PPacket === "function") {
      sendP2PPacket({ type: "P2P_PLATE", plateId: "meadow", turn: state.turn });
    }
  } else if (p.id === "xatk") {
    state.xAttackArmed = true;
    state.activePlate = "xatk";
    setLogText("⚔️ X Attack Ativado: +30 DMG em todos os ataques no combate deste turno!");
    if (state.mode === "p2p" && typeof sendP2PPacket === "function") {
      sendP2PPacket({ type: "P2P_PLATE", plateId: "xatk", turn: state.turn });
    }
  } else if (p.id === "xspeed") {
    state.xSpeedArmed = true;
    state.activePlate = "xspeed";
    setLogText("⚡ X Speed Ativado: Todos os ataques Brancos convertidos para Dourados ⚡ neste turno!");
    if (state.mode === "p2p" && typeof sendP2PPacket === "function") {
      sendP2PPacket({ type: "P2P_PLATE", plateId: "xspeed", turn: state.turn });
    }
  } else if (p.id === "double") {
    state.doubleChanceArmed = true;
    state.activePlate = "double";
    setLogText("🎲 Double Chance Ativado: Você poderá re-girar a roleta caso o resultado seja desfavorável!");
    if (state.mode === "p2p" && typeof sendP2PPacket === "function") {
      sendP2PPacket({ type: "P2P_PLATE", plateId: "double", turn: state.turn });
    }
  } else if (p.id === "hurdle") {
    state.abilityJumpActive = true;
    state.activePlate = "hurdle";
    setLogText("🦘 Hurdle Jump Ativado: Selecione uma figura para saltar sobre um Pokémon adjacente!");
    if (state.selectedUnitId) selectUnit(state.selectedUnitId);
    if (state.mode === "p2p" && typeof sendP2PPacket === "function") {
      sendP2PPacket({ type: "P2P_PLATE", plateId: "hurdle", turn: state.turn });
    }
  } else if (p.id === "longthrow") {
    state.longThrowActive = true;
    const bUnit = state.units.find(u => u.owner === state.turn && u.location === "bench" && u.waitTurns === 0);
    if (bUnit) selectUnit(bUnit.uid);
    if (state.mode === "p2p" && typeof sendP2PPacket === "function") {
      sendP2PPacket({ type: "P2P_PLATE", plateId: "longthrow", turn: state.turn });
    }
  } else if (p.id === "megaplate") {
    const targetUnit = state.units.find(u => u.owner === state.turn && u.uid === state.selectedUnitId)
                    || state.units.find(u => u.owner === state.turn && u.location === "board")
                    || state.units.find(u => u.owner === state.turn && u.location === "bench");
    if (targetUnit) {
      if (!targetUnit.name.startsWith("Mega ")) targetUnit.name = "Mega " + targetUnit.name;
      targetUnit.megaTurns = 7;
      targetUnit.mp = Math.min(3, (targetUnit.baseMp || targetUnit.mp) + 1);
      if (targetUnit.location === "board" && targetUnit.nodeId !== null) {
        const nPos = getNodePos(targetUnit.nodeId);
        spawnPortalParticles(nPos.x, nPos.y, "#f472b6");
      }
      setLogText(`🧬 ${targetUnit.name} [UX] ativado por 7 turnos (+20 DMG, +1★, MP ${targetUnit.mp})!`);
      if (state.mode === "p2p" && typeof sendP2PPacket === "function") {
        sendP2PPacket({
          type: "P2P_PLATE",
          plateId: "megaplate",
          unitUid: targetUnit.uid,
          turn: state.turn
        });
      }
    }
  } else if (p.id === "pkmswitch") {
    const fUnit = state.units.find(u => u.owner === state.turn && u.location === "board" && u.uid === state.selectedUnitId)
               || state.units.find(u => u.owner === state.turn && u.location === "board");
    const bUnit = state.units.find(u => u.owner === state.turn && u.location === "bench" && u.waitTurns === 0);
    if (fUnit && bUnit) {
      const nid = fUnit.nodeId, bSlot = bUnit.benchSlot;
      fUnit.location = "bench"; fUnit.nodeId = null; fUnit.benchSlot = bSlot;
      bUnit.location = "board"; bUnit.nodeId = nid;
      const nPos = getNodePos(nid);
      spawnPortalParticles(nPos.x, nPos.y, "#38bdf8");
      setLogText(`⇄ Pokémon Switch: ${fUnit.name} trocado por ${bUnit.name}!`);
      const nextT = state.turn === "p1" ? "p2" : "p1";
      const nextC = Math.max(0, state.turnCounter - 1);
      if (state.mode === "p2p" && typeof sendP2PPacket === "function") {
        sendP2PPacket({
          type: "P2P_PLATE",
          plateId: "pkmswitch",
          unitUid: fUnit.uid,
          swapUid: bUnit.uid,
          targetNodeId: nid,
          benchSlot: bSlot,
          turn: state.turn,
          nextTurn: nextT,
          nextTurnCounter: nextC
        });
      }
      endTurn(false, nextT, nextC);
    } else {
      markPlateUsedForCurrentOwner(p, false);
      setLogText("⚠️ Pokémon Switch precisa de 1 figura no campo e 1 figura livre no banco!");
    }
  } else if (p.id === "revive") {
    let pcUnit = state.units.find(u => u.owner === state.turn && u.location === "pc");
    if (!pcUnit) {
      const q = state.turn === "p1" ? state.reviverQueueP1 : state.reviverQueueP2;
      const uid = q && q.shift();
      if (uid) pcUnit = state.units.find(x => x.uid === uid);
    }
    if (pcUnit) {
      pcUnit.location = "bench";
      pcUnit.nodeId = null;
      pcUnit.waitTurns = 0;
      pcUnit.condition = PokemonCondition.Normal;
      playSfx("portal");
      setLogText(`💖 Max Revive: ${pcUnit.name} resgatado do P.C. direto para o Banco sem Wait!`);
      const nextT = state.turn === "p1" ? "p2" : "p1";
      const nextC = Math.max(0, state.turnCounter - 1);
      if (state.mode === "p2p" && typeof sendP2PPacket === "function") {
        sendP2PPacket({
          type: "P2P_PLATE",
          plateId: "revive",
          unitUid: pcUnit.uid,
          turn: state.turn,
          nextTurn: nextT,
          nextTurnCounter: nextC
        });
      }
      endTurn(false, nextT, nextC);
    } else {
      markPlateUsedForCurrentOwner(p, false);
      setLogText("⚠️ Max Revive requer pelo menos 1 Pokémon no P.C.!");
    }
  } else {
    state.activePlate = p.id;
  }
  renderPlatesTray();
}

function applyMonacoCondition(condCode, condName) {
  const target = state.units.find(u => u.uid === state.selectedUnitId) || state.units.find(u => u.location === "board") || state.units[0];
  if (target) {
    target.condition = condCode;
    setLogText(`Condition 0x${condCode.toString(16).padStart(2,'0')} (${condName}) -> ${target.name}`);
    closeDrawer();
  }
}

// ============================================================================
// 6. P.C. REVIVER (2-SLOT MAX FIFO + WAIT 2) & SURROUND KO
// ============================================================================
function spawnPortalParticles(x, y, color) {
  boardShockwaves.push({ x, y, r: 4, maxR: 28, alpha: 1.0, color });
  for (let i = 0; i < 16; i++) {
    const ang = Math.random() * Math.PI * 2, spd = 0.7 + Math.random() * 2.2;
    boardParticles.push({ x, y, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd - 0.8, life: 1.0, decay: 0.035, size: 2.5, color });
  }
}

function sendToPC(unit) {
  const pods = unit.owner === "p1" ? REVIVER_PODS_P1 : REVIVER_PODS_P2;
  const q = unit.owner === "p1" ? state.reviverQueueP1 : state.reviverQueueP2;
  const targetPod = pods[Math.min(q.length, 1)] || pods[0];
  if (unit.location === "board" && unit.nodeId !== null) {
    const n = getNodePos(unit.nodeId);
    spawnPortalParticles(n.x, n.y, "#c084fc");
    boardBeams.push({ x1: n.x, y1: n.y, x2: targetPod.x, y2: targetPod.y, color: "#c084fc", life: 1.0 });
  }
  unit.location = "pc";
  unit.nodeId = null;
  unit.condition = PokemonCondition.Normal;
  unit.waitTurns = 0;

  const ex = q.indexOf(unit.uid);
  if (ex !== -1) q.splice(ex, 1);
  q.push(unit.uid);

  if (q.length > 2) {
    const releasedUid = q.shift();
    const releasedUnit = state.units.find(u => u.uid === releasedUid);
    if (releasedUnit) {
      releasedUnit.location = "bench";
      releasedUnit.waitTurns = 2;
      setLogText(`${releasedUnit.name} retornou ao Banco com Wait 2 (${q.length}/2 no P.C.)`);
    }
  } else {
    setLogText(`${unit.name} knocked out to P.C. (${q.length}/2)`);
  }
}

function checkSurroundKOs() {
  const toKO = [];
  let goalSurroundWinner = null;
  state.units.filter(u => u.location === "board").forEach(u => {
    const neighbors = ADJ[u.nodeId] || [];
    // Strict Pokémon Duel Surround KO Rule:
    // A figure is surrounded IF AND ONLY IF EVERY adjacent neighbor is occupied by an OPPONENT'S figure!
    // If ANY neighbor is empty or occupied by a friendly piece (same owner), the figure is PROTECTED and NOT surrounded!
    if (neighbors.length > 0 && neighbors.every(nid => {
      const occ = unitAtNode(nid);
      return occ !== null && occ.owner !== u.owner;
    })) {
      // Section 9: Goal Surround Win — surrounding an enemy standing on its own Goal Point wins immediately!
      if (u.owner === "p2" && u.nodeId === 3) goalSurroundWinner = "p1";
      if (u.owner === "p1" && u.nodeId === 10) goalSurroundWinner = "p2";
      toKO.push(u);
    }
  });
  toKO.forEach(u => {
    setLogText(`☠️ SURROUND KO! ${u.name} (${u.owner.toUpperCase()}) foi encurralado por Pokémon rivais!`);
    sendToPC(u);
  });
  if (goalSurroundWinner && !state.winCelebrationAnim) {
    setLogText("🏆 GOAL SURROUND WIN! Defensor do Goal foi cercado!");
    spawnPortalParticles(176, goalSurroundWinner === "p1" ? 185 : 343, "#facc15");
    state.winCelebrationAnim = { winner: goalSurroundWinner, t0: performance.now() };
  }
}

function banishToUltraSpace(unit) {
  if (unit.location === "board" && unit.nodeId !== null) {
    const n = BOARD_NODES[unit.nodeId];
    spawnPortalParticles(n.x, n.y, "#38bdf8");
  }
  unit.location = "ultra_space";
  unit.nodeId = null;
  const list = unit.owner === "p1" ? state.excludedP1 : state.excludedP2;
  if (!list.includes(unit.uid)) list.push(unit.uid);
  setLogText(`🌀 ${unit.name} banished to Ultra Space!`);
}

const EVO_CHAIN_NAMES = {
  bulbasaur: ["Ivysaur", "Venusaur", "Mega Venusaur"],
  charmander: ["Charmeleon", "Charizard", "Mega Charizard X"],
  squirtle: ["Wartortle", "Blastoise", "Mega Blastoise"],
  pikachu: ["Raichu", "Alolan Raichu"],
  eevee: ["Vaporeon", "Jolteon", "Flareon", "Espeon", "Umbreon", "Sylveon"],
  magikarp: ["Gyarados", "Mega Gyarados"],
  dratini: ["Dragonair", "Dragonite"],
  gastly: ["Haunter", "Gengar", "Mega Gengar"],
  venusaur: ["Mega Venusaur"],
  charizard: ["Mega Charizard X"],
  blastoise: ["Mega Blastoise"],
  gengar: ["Mega Gengar"],
  lucario: ["Mega Lucario"],
  rayquaza: ["Mega Rayquaza"]
};

let pendingEvoUnit = null;
function resolveEvolutionPrompt(confirmEvo) {
  const modal = document.getElementById("evolution-prompt-modal");
  if (modal) modal.style.display = "none";
  if (confirmEvo && pendingEvoUnit) {
    applyUnitEvolutionNow(pendingEvoUnit);
  }
  pendingEvoUnit = null;
}


function revertMegaEvolution(u) {
  if (!u) return;
  const targetRevertName = u.preMegaName || u.name.replace(/^Mega\s+/, "").replace(/\s+[XY]$/, "");
  const baseFig = (typeof findFigureByName === "function") ? findFigureByName(targetRevertName) : null;
  const oldMegaName = u.name;
  u.name = baseFig ? baseFig.name : targetRevertName;
  if (baseFig) {
    u.baseIdx = (typeof FIGURES_DB !== "undefined" && FIGURES_DB.indexOf(baseFig) !== -1) ? FIGURES_DB.indexOf(baseFig) : u.baseIdx;
    u.baseId = baseFig.id;
    u.spriteKey = baseFig.spriteKey;
    u.mp = u.baseMp || baseFig.mp || 2;
    u.type = baseFig.type;
    u.rarity = baseFig.rarity;
  } else {
    u.mp = u.baseMp || u.mp;
  }
  u.megaTurns = 0;
  if (typeof u.preMegaEvoStep === "number") {
    u.evoStep = u.preMegaEvoStep;
  }

  if (u.location === "board" && u.nodeId !== null && BOARD_NODES && BOARD_NODES[u.nodeId]) {
    const n = BOARD_NODES[u.nodeId];
    spawnPortalParticles(n.x, n.y, "#38bdf8");
  }
  playSfx("portal");
  setLogText(`⏳ MEGA EVOLUÇÃO TERMINOU! ${oldMegaName} reverteu para ${u.name} após 5 turnos.`);
}
window.revertMegaEvolution = revertMegaEvolution;

function evolveUnitInMatch(unit) {
  if (!unit) return;

  // REGRA 1: Se já está em Mega Evolução, NUNCA pergunta pra evoluir ou desevoluir!
  // "se eu evoluo pra mega e ganho dnv ele pergunta se quero desevoluir, tira isso, se eu ganhei ele evolui e fica por 5 turnos, ate la nao fica aparecendo opcoes"
  if ((unit.megaTurns && unit.megaTurns > 0) || unit.name.startsWith("Mega ")) {
    return;
  }

  // REGRA 2: Cadeia de evolução respeitando família e alvo do deck
  const targetName = unit.deckTargetName || unit.name;
  const fam = (typeof POKEMON_EVOLUTION_FAMILIES !== "undefined")
    ? POKEMON_EVOLUTION_FAMILIES.find(f =>
        f.some(n => n.toLowerCase().replace(/[\s\-_]/g, "") === targetName.toLowerCase().replace(/[\s\-_]/g, "")) ||
        f.some(n => n.toLowerCase().replace(/[\s\-_]/g, "") === unit.name.toLowerCase().replace(/[\s\-_]/g, ""))
      )
    : null;

  let chain;
  if (fam) {
    const targetIdx = fam.findIndex(n => n.toLowerCase().replace(/[\s\-_]/g, "") === targetName.toLowerCase().replace(/[\s\-_]/g, ""));
    const isTargetIntermediate = (targetIdx !== -1 && targetIdx < fam.length - 2); // Ex: Charmeleon para em Charmeleon
    if (isTargetIntermediate) {
      chain = fam.slice(0, targetIdx + 1);
    } else {
      chain = fam;
    }
  } else {
    chain = unit.evoChain || [unit.name];
  }

  const currentStep = chain.findIndex(n => n.toLowerCase().replace(/[\s\-_]/g, "") === unit.name.toLowerCase().replace(/[\s\-_]/g, ""));
  if (currentStep === -1 || currentStep >= chain.length - 1) {
    // Alvo máximo já atingido ou figura não evolui mais
    return;
  }

  const nextStep = currentStep + 1;
  const nextName = chain[nextStep];
  const isMega = nextName.startsWith("Mega ");

  // Se o jogador humano venceu, exibe a confirmação oficial de evolução
  if (unit.owner === getBottomRole() && !state.aiExecutingNow) {
    pendingEvoUnit = unit;
    const tEl = document.getElementById("evo-prompt-title");
    const sEl = document.getElementById("evo-prompt-sub");
    const mEl = document.getElementById("evolution-prompt-modal");
    if (tEl) {
      tEl.textContent = isMega ? `Mega Evoluir ${unit.name} ➔ ${nextName}?` : `Evoluir ${unit.name} ➔ ${nextName}?`;
    }
    if (sEl) {
      if (isMega) {
        sEl.innerHTML = `Mega Evolui temporariamente para <strong>${nextName}</strong> por <strong>5 turnos</strong>!<br><span style="font-size:9.5px; color:#facc15; font-weight:800;">Bônus: +20 DMG, +1★ Purple, +1 MP e Pass-Through. Reverte ao 6º turno.</span>`;
      } else {
        sEl.innerHTML = `Evolui para <strong>${nextName}</strong> ganhando permanentemente <strong>+10 DMG</strong> e <strong>+1★ Purple</strong>!<br><span style="font-size:9.5px; color:#38bdf8; font-weight:800;">Alvo Final do Deck: <strong>${unit.deckTargetName || nextName}</strong></span>`;
      }
    }
    if (mEl) mEl.style.display = "flex";
  } else {
    applyUnitEvolutionNow(unit);
  }
}

function applyUnitEvolutionNow(unit) {
  if (!unit || unit._justEvolvedTurn === state.turnCounter) return;

  // Nunca evolui se já estiver em Mega
  if ((unit.megaTurns && unit.megaTurns > 0) || unit.name.startsWith("Mega ")) return;

  const targetName = unit.deckTargetName || unit.name;
  const fam = (typeof POKEMON_EVOLUTION_FAMILIES !== "undefined")
    ? POKEMON_EVOLUTION_FAMILIES.find(f =>
        f.some(n => n.toLowerCase().replace(/[\s\-_]/g, "") === targetName.toLowerCase().replace(/[\s\-_]/g, "")) ||
        f.some(n => n.toLowerCase().replace(/[\s\-_]/g, "") === unit.name.toLowerCase().replace(/[\s\-_]/g, ""))
      )
    : null;

  let chain;
  if (fam) {
    const targetIdx = fam.findIndex(n => n.toLowerCase().replace(/[\s\-_]/g, "") === targetName.toLowerCase().replace(/[\s\-_]/g, ""));
    const isTargetIntermediate = (targetIdx !== -1 && targetIdx < fam.length - 2);
    if (isTargetIntermediate) {
      chain = fam.slice(0, targetIdx + 1);
    } else {
      chain = fam;
    }
  } else {
    chain = unit.evoChain || [unit.name];
  }

  const currentStep = chain.findIndex(n => n.toLowerCase().replace(/[\s\-_]/g, "") === unit.name.toLowerCase().replace(/[\s\-_]/g, ""));
  if (currentStep === -1 || currentStep >= chain.length - 1) return;

  const nextStep = currentStep + 1;
  const nextName = chain[nextStep];
  const isMega = nextName.startsWith("Mega ");

  unit._justEvolvedTurn = state.turnCounter;
  unit.evoStep = nextStep;
  unit.condition = PokemonCondition.Normal; // Evoluir purga condições de status negativo

  const oldName = unit.name;
  unit.name = nextName;

  // Atualiza metadados no FIGURES_DB
  const nextFig = (typeof findFigureByName === "function") ? findFigureByName(nextName) : null;
  if (nextFig) {
    unit.baseIdx = (typeof FIGURES_DB !== "undefined" && FIGURES_DB.indexOf(nextFig) !== -1) ? FIGURES_DB.indexOf(nextFig) : unit.baseIdx;
    unit.baseId = nextFig.id;
    unit.spriteKey = nextFig.spriteKey;
    if (nextFig.mp) unit.mp = nextFig.mp;
    if (nextFig.type) unit.type = nextFig.type;
    if (nextFig.rarity) unit.rarity = nextFig.rarity;
  }

  if (isMega) {
    unit.megaTurns = 5; // Exatamente 5 turnos de Mega!
    unit.preMegaName = oldName;
    unit.preMegaBaseIdx = unit.baseIdx;
    unit.preMegaBaseId = unit.baseId;
    unit.preMegaSpriteKey = unit.spriteKey;
    unit.preMegaMp = unit.mp;
    unit.preMegaRarity = unit.rarity;
    unit.preMegaType = unit.type;
    unit.preMegaEvoStep = currentStep;
    unit.mp = Math.min(3, (unit.baseMp || unit.mp) + 1);
  } else {
    unit.evoStage = (unit.evoStage || 0) + 1; // +10 DMG & +1★ por estágio permanente
  }

  if (unit.location === "board" && unit.nodeId !== null && BOARD_NODES && BOARD_NODES[unit.nodeId]) {
    const n = BOARD_NODES[unit.nodeId];
    spawnPortalParticles(n.x, n.y, isMega ? "#f472b6" : "#facc15");
  }
  playSfx("portal");
  if (typeof BgmEngine !== "undefined") BgmEngine.playFanfare("booster");

  if (isMega) {
    setLogText(`🧬 MEGA EVOLUÇÃO EM PARTIDA! ${oldName} Mega Evoluiu para ${unit.name} por 5 turnos (+20 DMG, +1★, +1 MP e Pass-Through)!`);
  } else {
    setLogText(`✨ EVOLUÇÃO EM PARTIDA! ${oldName} evoluiu para ${unit.name} (+${unit.evoStage * 10} DMG, +${unit.evoStage}★)!`);
  }
}

function computeDuelDbOdds(atkUnit, defUnit) {
  if (!atkUnit || !defUnit) return { win: 50, tie: 25, loss: 25 };
  const wA = getActiveWheel(atkUnit);
  const wD = getActiveWheel(defUnit);
  const totA = wA.reduce((s, x) => s + x.size, 0) || 96;
  const totD = wD.reduce((s, x) => s + x.size, 0) || 96;
  let winW = 0, tieW = 0, lossW = 0;
  wA.forEach(sa => {
    wD.forEach(sd => {
      const weight = (sa.size / totA) * (sd.size / totD);
      const res = evaluateCombat(atkUnit, defUnit, { chosen: sa }, { chosen: sd });
      if (res.winner === "atk") winW += weight;
      else if (res.winner === "def") lossW += weight;
      else tieW += weight;
    });
  });
  return {
    win: Math.round(winW * 100),
    tie: Math.round(tieW * 100),
    loss: Math.max(0, 100 - Math.round(winW * 100) - Math.round(tieW * 100))
  };
}

function getEffectiveUnitMp(unit) {
  let eff = unit.mp;
  // Section 3: Paralysis reduces MP by -1 permanently while paralyzed!
  if (unit.condition === PokemonCondition.Paralyze) {
    eff = Math.max(1, eff - 1);
  }
  // Rule 6 (Venusaur Passive): Poisoned/Noxious figures suffer -1 MP while an opposing Venusaur is on the field!
  if (unit.condition === PokemonCondition.Poison || unit.condition === PokemonCondition.BadPoison) {
    const enemyVenusaurOnField = state.units && state.units.some(
      u => u.location === "board" && u.owner !== unit.owner && u.baseId === "venusaur"
    );
    if (enemyVenusaurOnField) {
      eff = Math.max(1, eff - 1);
    }
  }
  // Rule 1: First turn of match from bench suffers -1 MP penalty to prevent unfair turn-1 rush!
  if (state.turnCounter === 300 && unit.location === "bench") {
    eff = Math.max(1, eff - 1);
  }
  return eff;
}

function computeReachableWithPaths(unit) {
  if (unit.condition === PokemonCondition.Sleep || unit.condition === PokemonCondition.Freeze || unit.waitTurns > 0) {
    return { nodes: [], paths: {} };
  }
  const fig = (typeof FIGURES_DB !== "undefined" && FIGURES_DB[unit.baseIdx]) || unit;
  const canJumpOver = (typeof isFigurePassThroughOrJumper === "function" ? (isFigurePassThroughOrJumper(fig) || isFigurePassThroughOrJumper(unit)) : Boolean(fig && fig.canPassThrough)) || (unit.megaTurns && unit.megaTurns > 0) || state.abilityJumpActive;
  const mp = getEffectiveUnitMp(unit);
  const visited = new Map(), paths = {}, queue = [];

  if (unit.location === "bench") {
    const entryRole = unit.owner === "p1" ? "entry_p1" : "entry_p2";
    const entryNodes = BOARD_NODES.filter(n => n.role === entryRole);
    let openEntries = 0;
    entryNodes.forEach(en => {
      if (!unitAtNode(en.id)) {
        openEntries++;
        visited.set(en.id, 1); // Entrar em campo pelo Entry Point consome exatamente 1 MP
        paths[en.id] = [{ type: "portal", fromNode: en.id, toNode: en.id }];
        queue.push({ id: en.id, dist: 1 });
      } else if (state.longThrowActive) {
        (ADJ[en.id] || []).forEach(adjId => {
          if (!unitAtNode(adjId)) {
            openEntries++;
            visited.set(adjId, mp);
            paths[adjId] = [{ type: "portal", fromNode: adjId, toNode: adjId }];
          }
        });
      }
    });
    if (openEntries === 0 && unit.owner === state.turn && !state.aiExecutingNow) {
      setLogText("🚫 SPAWN BLOCK! Ambos os Entry Points estão bloqueados!");
    }
  } else if (unit.location === "board") {
    visited.set(unit.nodeId, 0);
    paths[unit.nodeId] = [];
    queue.push({ id: unit.nodeId, dist: 0 });
  }

  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur.dist >= mp) continue;
    for (const nxt of ADJ[cur.id]) {
      const occ = unitAtNode(nxt);
      if (!occ) {
        if (!visited.has(nxt) || visited.get(nxt) > cur.dist + 1) {
          visited.set(nxt, cur.dist + 1);
          paths[nxt] = [...paths[cur.id], { type: "walk", fromNode: cur.id, toNode: nxt }];
          queue.push({ id: nxt, dist: cur.dist + 1 });
        }
      } else if (canJumpOver && (state.abilityJumpActive || !(occ.owner !== unit.owner && (occ.baseId === "palkia_o" || occ.baseId === "gardevoir")))) {
        // Rule 6: Palkia-O / Gardevoir Warp Hole blocks pass-through jumps unless using Hurdle Jump plate!
        // Section 1.2: CÁLCULO ESTRITO DE SALTO (A CASA PULADA CONTA = 2 MP!)
        // Passo 1: O nó ocupado da peça pulada (nxt) conta como 1 MP gasto.
        // Passo 2: O nó vazio de aterrissagem (beyond) conta como +1 MP gasto (Total = 2 MP).
        // Se uma figura de 3 MP salta adjacente (cur.dist=0), gasta 2 MP (landDist=2) e resta apenas 1 MP!
        // (Exceção apenas se uma peça de 1 MP usar a placa Hurdle Jump em cur.dist===0 para saltar a peça adjacente).
        const jumpMpCost = (state.abilityJumpActive && mp === 1 && cur.dist === 0) ? 1 : 2;
        const landDist = cur.dist + jumpMpCost;
        if (landDist <= mp) {
          for (const beyond of ADJ[nxt]) {
            if (beyond !== cur.id && !unitAtNode(beyond) && (!visited.has(beyond) || visited.get(beyond) > landDist)) {
              visited.set(beyond, landDist);
              paths[beyond] = [...paths[cur.id], { type: "jump", fromNode: cur.id, toNode: beyond, jumpedNode: nxt }];
              queue.push({ id: beyond, dist: landDist });
            }
          }
        }
      }
    }
  }
  visited.delete(unit.nodeId);
  delete paths[unit.nodeId];
  return { nodes: Array.from(visited.keys()), paths };
}

// ============================================================================
// 7. 60 FPS FULL HD 3x (`1059x1590`) VECTOR + PHOTOGRAPHIC HYBRID RENDERER
// ============================================================================
const canvas = document.getElementById("board-canvas");
const ctx = canvas.getContext("2d");

function setTableSurface(s) { state.surface = s; }

function drawHDBenchRing(cx, cy, rx, ry, isPlus) {
  ctx.save();
  // Outer drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.beginPath(); ctx.ellipse(cx, cy + 1.2, rx + 1.4, ry + 1.4, 0, 0, Math.PI * 2); ctx.fill();

  // Dark glossy recessed interior
  const rGrad = ctx.createRadialGradient(cx, cy - 1, 1, cx, cy, rx);
  rGrad.addColorStop(0, "#1e293b");
  rGrad.addColorStop(0.75, "#090d16");
  rGrad.addColorStop(1, "#020408");
  ctx.fillStyle = rGrad;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();

  // Crisp 1080p white outer metallic ring
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Subtle inner metallic rim
  ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx - 2.4, ry - 1.7, 0, 0, Math.PI * 2); ctx.stroke();

  if (isPlus) {
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx - 3.2, cy); ctx.lineTo(cx + 3.2, cy);
    ctx.moveTo(cx, cy - 3.2); ctx.lineTo(cx, cy + 3.2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGreenIncubatorChambers(isFrontOverlay, topRevQueue) {
  const tNow = performance.now() * 0.001;
  ctx.save();
  REVIVER_PODS_P2.forEach((pod, idx) => {
    const isOccupied = topRevQueue && topRevQueue[idx];
    const cx = pod.x, cy = pod.y;
    // Capsule dimensions: width 24, height 48. Top at cy-24, bottom at cy+24.
    const w = 24, h = 48;
    const left = cx - w / 2, top = cy - h / 2;
    const r = w / 2; // radius for rounded top/bottom capsule

    if (!isFrontOverlay) {
      // 1. Back chamber interior & cryo-fluid (covers any underlying arena artifacts)
      ctx.save();
      // Outer drop shadow on table
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + h / 2 + 1, r + 2, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Metallic pedestal base
      const pedGrad = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
      pedGrad.addColorStop(0, "#1e293b");
      pedGrad.addColorStop(0.5, "#64748b");
      pedGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = pedGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + h / 2, r + 1.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Deep emerald capsule interior
      const bgGrad = ctx.createLinearGradient(cx - r, top, cx + r, top + h);
      bgGrad.addColorStop(0, "#011c13");
      bgGrad.addColorStop(0.4, "#064e3b");
      bgGrad.addColorStop(0.8, "#022c22");
      bgGrad.addColorStop(1, "#01160e");

      ctx.beginPath();
      ctx.roundRect(left, top, w, h, [r, r, r, r]);
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // Metallic top cap
      ctx.fillStyle = pedGrad;
      ctx.beginPath();
      ctx.ellipse(cx, top + 2, r + 0.8, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cryo chamber inner energy ambient glow
      const glowGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      glowGrad.addColorStop(0, isOccupied ? "rgba(52, 211, 153, 0.45)" : "rgba(16, 185, 129, 0.28)");
      glowGrad.addColorStop(1, "rgba(5, 150, 105, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.roundRect(left, top, w, h, [r, r, r, r]);
      ctx.fill();

      // Ambient rising bio-energy bubbles
      const bubblePhase = tNow * 1.8 + idx * 1.5;
      for (let b = 0; b < 3; b++) {
        const bOff = (bubblePhase + b * 1.1) % 1;
        const bx = cx - 4 + ((b * 3.7 + idx) % 8);
        const by = (cy + h / 2 - 6) - bOff * (h - 12);
        ctx.fillStyle = `rgba(110, 231, 183, ${0.4 * (1 - bOff)})`;
        ctx.beginPath();
        ctx.arc(bx, by, 1.2 + (b % 2) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    } else {
      // 2. Front Glass Cylinder overlay (drawn in front of the figurine!)
      ctx.save();
      // Glass cylinder outline with high-tech glowing border
      ctx.beginPath();
      ctx.roundRect(left, top, w, h, [r, r, r, r]);
      ctx.strokeStyle = isOccupied ? "rgba(52, 211, 153, 0.85)" : "rgba(16, 185, 129, 0.55)";
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // Glass tint
      ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
      ctx.fill();

      // Left specular reflection (vertical curved highlight on glass)
      const shineGrad = ctx.createLinearGradient(left + 2, top, left + 6, top);
      shineGrad.addColorStop(0, "rgba(255, 255, 255, 0.55)");
      shineGrad.addColorStop(0.5, "rgba(167, 243, 208, 0.35)");
      shineGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = shineGrad;
      ctx.beginPath();
      ctx.roundRect(left + 2.5, top + 6, 3.2, h - 14, 1.5);
      ctx.fill();

      // Top dome curved highlight
      ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, top + 5, r * 0.65, 3, 0, Math.PI * 0.9, Math.PI * 2.1);
      ctx.stroke();

      // High-tech holographic scanline drifting downward
      const scanY = top + ((tNow * 16 + idx * 12) % h);
      ctx.strokeStyle = "rgba(167, 243, 208, 0.4)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(left + 3, scanY);
      ctx.lineTo(left + w - 3, scanY);
      ctx.stroke();

      ctx.restore();
    }
  });
  ctx.restore();
}

function drawP1ReviverPods(botRevQueue) {
  const tNow = performance.now() * 0.001;
  ctx.save();
  REVIVER_PODS_P1.forEach((pod, idx) => {
    const isOccupied = botRevQueue && botRevQueue[idx];
    const cx = pod.x, cy = pod.y;
    const rx = 16.5, ry = 11.2;

    // Outer drop shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1.8, rx + 1.5, ry + 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // High-tech P.C. recovery pad outer ring
    const rimGrad = ctx.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
    rimGrad.addColorStop(0, "#38bdf8");
    rimGrad.addColorStop(0.5, "#0284c7");
    rimGrad.addColorStop(1, "#0369a1");
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Dark high-tech concave base
    const padGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rx);
    padGrad.addColorStop(0, isOccupied ? "#0c4a6e" : "#082f49");
    padGrad.addColorStop(0.7, "#0f172a");
    padGrad.addColorStop(1, "#020617");
    ctx.fillStyle = padGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx - 1.2, ry - 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner glowing ring
    ctx.strokeStyle = isOccupied ? "rgba(56, 189, 248, 0.85)" : "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (!isOccupied) {
      // Crisp Glowing Hospital '+' Cross in center when empty
      ctx.save();
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 4;
      ctx.fillStyle = "#e0f2fe";
      // Horizontal bar
      ctx.fillRect(cx - 5.5, cy - 1.8, 11, 3.6);
      // Vertical bar
      ctx.fillRect(cx - 1.8, cy - 5.5, 3.6, 11);
      ctx.restore();
    } else {
      // Pulsing cyan medical recovery aura beneath the resting Pokémon
      const pulse = 1.0 + Math.sin(tNow * 3.5 + idx) * 0.12;
      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.9 * pulse, ry * 0.9 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  });
  ctx.restore();
}

function drawHDVectorBoardAndChrome() {
  // 1. Crisp 1080p Top Action Bar (Clean full-width log without Skip / Perspective buttons)
  ctx.save();
  ctx.fillStyle = "#030508";
  ctx.fillRect(0, 0, LOGICAL_W, 18.5);
  ctx.fillStyle = "#2bb8e8";
  ctx.font = "700 10.2px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(state.logText, 6, 9.5);

  // 2. Crisp 1080p Trainer Names & Seat Colors (swaps when viewing from P2's seat across the table!)
  const flipped = isBoardFlipped();
  const bluePatch = ctx.createLinearGradient(66, 19, 152, 48);
  bluePatch.addColorStop(0, flipped ? "#7f1d1d" : "#0b4ea8");
  bluePatch.addColorStop(1, flipped ? "#991b1b" : "#1864c4");
  ctx.fillStyle = bluePatch;
  ctx.fillRect(66, 20, 86, 18);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 10px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "left";
  const myNick = (window.trainerProfileData && window.trainerProfileData.nickname) ? window.trainerProfileData.nickname : "Você";
  const oppNick = (remoteOpponentProfile && remoteOpponentProfile.nickname) ? remoteOpponentProfile.nickname : "Rival";
  ctx.fillText(flipped ? `${myNick} (P2)` : `${myNick} (P1)`, 69, 28.5);

  const redPatch = ctx.createLinearGradient(202, 19, 286, 48);
  redPatch.addColorStop(0, flipped ? "#0b4ea8" : "#630d21");
  redPatch.addColorStop(1, flipped ? "#1e3a8a" : "#4e0819");
  ctx.fillStyle = redPatch;
  ctx.fillRect(218, 20, 70, 18);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "right";
  ctx.fillText(flipped ? `${oppNick} (P1)` : `${oppNick} (P2)`, 284, 28.5);

  // Crisp 1080p TURN Badge (x = 158..194, y = 21..48)
  ctx.fillStyle = "#0e1015";
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(163, 21); ctx.lineTo(189, 21); ctx.lineTo(194, 28);
  ctx.lineTo(194, 43); ctx.lineTo(189, 48); ctx.lineTo(163, 48);
  ctx.lineTo(158, 43); ctx.lineTo(158, 28); ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(162, 21.5, 28, 7.5);
  ctx.fillStyle = "#090d16";
  ctx.font = "900 5.8px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TURN", 176, 25.5);

  ctx.fillStyle = "#fde047";
  ctx.font = "900 12.5px sans-serif";
  ctx.fillText(String(state.turnCounter), 176, 39);

  // Prominent Multiplayer & Pass-and-Play Turn Indicator Pill (y = 49..63)
  if (state.mode === "p2p") {
    const isMyTurn = (state.turn === state.myRole);
    ctx.save();
    ctx.fillStyle = isMyTurn ? "rgba(16, 185, 129, 0.95)" : "rgba(220, 38, 38, 0.92)";
    ctx.strokeStyle = isMyTurn ? "#6ee7b7" : "#fca5a5";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(82, 49, 189, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 8.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      isMyTurn ? "🟢 SEU TURNO — Selecione uma peça" : "⏳ TURNO DO OPONENTE — Aguarde...",
      176.5, 59
    );
    ctx.restore();
  } else if (state.mode === "pass") {
    const curP = state.turn === "p1" ? "Jogador 1 (Azul)" : "Jogador 2 (Vermelho)";
    ctx.save();
    ctx.fillStyle = state.turn === "p1" ? "rgba(2, 132, 199, 0.95)" : "rgba(225, 29, 72, 0.95)";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(82, 49, 189, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 8.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`👥 Vez de: ${curP}`, 176.5, 59);
    ctx.restore();
  }


  const botRoleForChrome = getBottomRole();
  const topRevQueueForChrome = botRoleForChrome === "p1" ? state.reviverQueueP2 : state.reviverQueueP1;
  const botRevQueueForChrome = botRoleForChrome === "p1" ? state.reviverQueueP1 : state.reviverQueueP2;

  // 3. Crisp 1080p Enhancements on Authentic Green Incubator Capsules & Medical P.C. Pods
  // Back interior of Top-Left Green Incubator Capsules (Opponent P.C. Pods)
  drawGreenIncubatorChambers(false, topRevQueueForChrome);

  // Bottom-Right Medical P.C. Recovery Pads (Local Viewer P.C. Pods)
  drawP1ReviverPods(botRevQueueForChrome);

  // 4. Crisp 1080p Top & Bottom Horizontal White Divider Bars
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(58, 161.5, 236, 3);
  ctx.fillRect(41, 373, 270, 3.5);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(58, 160, 236, 2.4);
  ctx.fillRect(41, 371.5, 270, 2.8);

  // 5. Crisp 1080p 12 Bench Rings
  P2_BENCH_COORDS.forEach(s => drawHDBenchRing(s.x, s.y, 15.2, 9.8, false));
  BENCH_SLOTS_P1.forEach(s => drawHDBenchRing(s.x, s.y, 16.2, 10.8, false));

  // 6. Crisp 1080p 28-Node Board Route Lines (`BOARD_EDGES`)
  ctx.lineCap = "round";
  BOARD_EDGES.forEach(([a, b]) => {
    const na = BOARD_NODES[a], nb = BOARD_NODES[b];
    ctx.strokeStyle = "rgba(0, 0, 0, 0.78)";
    ctx.lineWidth = 4.4;
    ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
  });
  BOARD_EDGES.forEach(([a, b]) => {
    const na = BOARD_NODES[a], nb = BOARD_NODES[b];
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 2.3;
    ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
  });

  // 7. Crisp 1080p 28 Board Nodes (4 Entry Points `◎`, 2 Neon Goal Points `▷`, 22 Route Nodes)
  BOARD_NODES.forEach(n => {
    if (n.role.startsWith("entry")) {
      [13.2, 8.8, 4.5].forEach((r, idx) => {
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        if (idx === 0) {
          ctx.fillStyle = "#090d16"; ctx.fill();
        }
        ctx.strokeStyle = "#f8fafc";
        ctx.lineWidth = idx === 0 ? 2.0 : 1.6;
        ctx.stroke();
      });
    } else if (n.role === "goal_p1" || n.role === "goal_p2") {
      // At the bottom of the screen (n.id===10) is the local viewer's Goal; at the top (n.id===3) is the opponent's Goal!
      const isBottomGoal = (n.id === 10);
      const isP1 = isBoardFlipped() ? !isBottomGoal : isBottomGoal;
      const gGlow = ctx.createRadialGradient(n.x, n.y, 3, n.x, n.y, 24);
      gGlow.addColorStop(0, isP1 ? "rgba(0, 212, 255, 0.95)" : "rgba(244, 63, 94, 0.95)");
      gGlow.addColorStop(0.55, isP1 ? "rgba(2, 132, 199, 0.45)" : "rgba(225, 29, 72, 0.45)");
      gGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gGlow;
      ctx.beginPath(); ctx.arc(n.x, n.y, 24, 0, Math.PI * 2); ctx.fill();

      ctx.beginPath(); ctx.arc(n.x, n.y, 14.2, 0, Math.PI * 2);
      ctx.fillStyle = "#081120"; ctx.fill();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.2; ctx.stroke();

      ctx.beginPath(); ctx.arc(n.x, n.y, 10.2, 0, Math.PI * 2);
      ctx.strokeStyle = isP1 ? "#38bdf8" : "#fb7185";
      ctx.lineWidth = 1.8; ctx.stroke();

      // Crisp hollow play triangle ▷
      ctx.beginPath();
      ctx.moveTo(n.x - 3.2, n.y - 4.5);
      ctx.lineTo(n.x + 5.2, n.y);
      ctx.lineTo(n.x - 3.2, n.y + 4.5);
      ctx.closePath();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(n.x, n.y, 4.4, 0, Math.PI * 2);
      ctx.fillStyle = "#090d16"; ctx.fill();
      ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = 2.0; ctx.stroke();
    }
  });

  // 7b. Live 5:00 Competitor Match Clocks (`04:56` / `04:58`) & Time-Up Loss Check
  const nowClk = performance.now();
  const drawerEl = document.getElementById("drawer-modal");
  const isDrawerOpen = drawerEl && drawerEl.classList.contains("show");
  const isMatchRunning = state.isMatchActive && !state.matchFinished && !isDrawerOpen;
  if (isMatchRunning && !state.preMatchAnim && !state.winCelebrationAnim && !state.isAnimating) {
    const dtClk = Math.min(200, Math.max(0, nowClk - (state.lastClockTick || nowClk)));
    if (state.turn === "p1") state.clockMsP1 = Math.max(0, state.clockMsP1 - dtClk);
    else state.clockMsP2 = Math.max(0, state.clockMsP2 - dtClk);
    if (state.clockMsP1 <= 0 && !state.winCelebrationAnim) {
      const p1Lost = (state.myRole === "p1" || state.mode !== "p2p");
      setLogText(p1Lost ? "⏰ TEMPO ESGOTADO! Oponente venceu por tempo!" : "⏰ TEMPO ESGOTADO! Você venceu por tempo!");
      state.isMatchActive = false;
      state.matchFinished = true;
      state.winCelebrationAnim = { winner: "p2", t0: nowClk };
    } else if (state.clockMsP2 <= 0 && !state.winCelebrationAnim) {
      const p2Lost = (state.myRole === "p2");
      setLogText(p2Lost ? "⏰ TEMPO ESGOTADO! Oponente venceu por tempo!" : "⏰ TEMPO ESGOTADO! Você venceu por tempo!");
      state.isMatchActive = false;
      state.matchFinished = true;
      state.winCelebrationAnim = { winner: "p1", t0: nowClk };
    }
  }
  state.lastClockTick = nowClk;
  const fmtClk = ms => {
    const s = Math.ceil(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  };

  const isP2Viewer = (getBottomRole() === "p2");
  const myClock = isP2Viewer ? state.clockMsP2 : state.clockMsP1;
  const oppClock = isP2Viewer ? state.clockMsP1 : state.clockMsP2;
  const isMyTurn = (state.turn === (isP2Viewer ? "p2" : "p1"));

  // Left Clock Box: ALWAYS the viewer's clock (VOCÊ)
  ctx.fillStyle = isP2Viewer ? "#3b0714" : "#061838";
  ctx.fillRect(66, 36, 52, 16);
  ctx.strokeStyle = isMyTurn ? "#facc15" : (isP2Viewer ? "#f43f5e" : "#38bdf8");
  ctx.lineWidth = isMyTurn ? 1.8 : 0.8;
  ctx.strokeRect(66, 36, 52, 16);

  const youWord = (typeof t === "function") ? t("battle.you", "VOCÊ") : "VOCÊ";
  ctx.fillStyle = isMyTurn ? "#facc15" : (isP2Viewer ? "#fca5a5" : "#93c5fd");
  ctx.font = "900 6.5px sans-serif"; ctx.textAlign = "left";
  ctx.fillText(isP2Viewer ? `🔴 ${youWord} (P2)` : `🔵 ${youWord} (P1)`, 68, 41.5);

  ctx.fillStyle = myClock < 60000 ? "#ef4444" : (isP2Viewer ? "#fecdd3" : "#bae6fd");
  ctx.font = "900 9.5px monospace"; ctx.textAlign = "left";
  ctx.fillText(fmtClk(myClock), 68, 50);

  // Right Clock Box: ALWAYS the opponent's clock (RIVAL / IA)
  const rivWord = (typeof t === "function") ? t("battle.rival", "RIVAL") : "RIVAL";
  const oppRoleLbl = isP2Viewer ? `🔵 ${rivWord} (P1)` : (state.mode === "p2p" ? `🔴 ${rivWord} (P2)` : "🔴 IA (P2)");
  ctx.fillStyle = isP2Viewer ? "#061838" : "#3b0714";
  ctx.fillRect(235, 36, 52, 16);
  ctx.strokeStyle = !isMyTurn ? "#facc15" : (isP2Viewer ? "#38bdf8" : "#f43f5e");
  ctx.lineWidth = !isMyTurn ? 1.8 : 0.8;
  ctx.strokeRect(235, 36, 52, 16);

  ctx.fillStyle = !isMyTurn ? "#facc15" : (isP2Viewer ? "#93c5fd" : "#fca5a5");
  ctx.font = "900 6.5px sans-serif"; ctx.textAlign = "right";
  ctx.fillText(oppRoleLbl, 285, 41.5);

  ctx.fillStyle = oppClock < 60000 ? "#ef4444" : (isP2Viewer ? "#bae6fd" : "#fecdd3");
  ctx.font = "900 9.5px monospace"; ctx.textAlign = "right";
  ctx.fillText(fmtClk(oppClock), 285, 50);

  // 7c. First-Turn -1 MP Indicator Badge when turnCounter === 300
  if (state.turnCounter === 300) {
    const firstTurnBadge = (typeof t === "function") ? t("battle.first_turn_badge", "1st TURN: -1 MP") : "1st TURN: -1 MP";
    ctx.fillStyle = "rgba(234, 179, 8, 0.92)";
    ctx.beginPath(); ctx.roundRect(136, 51, 81, 12, 3); ctx.fill();
    ctx.fillStyle = "#090d16"; ctx.font = "900 7px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(firstTurnBadge, 176.5, 57.5);
  }

  // 7d. Ultra Space Wormholes (`v5.0.6` Exclusion Zone) & Z-Move Gauge (`v7.0.0`)
  const drawUltraSpacePortal = (ux, uy, list, lbl) => {
    ctx.save();
    ctx.fillStyle = "rgba(30, 27, 75, 0.88)";
    ctx.strokeStyle = list.length > 0 ? "#c084fc" : "rgba(148,163,184,0.4)";
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(ux, uy, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e9d5ff"; ctx.font = "bold 6.2px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(lbl, ux, uy - 3);
    ctx.fillStyle = "#facc15"; ctx.font = "900 8px sans-serif";
    ctx.fillText(String(list.length), ux, uy + 5.5);
    ctx.restore();
  };
  drawUltraSpacePortal(25, 136, state.excludedP2, "ULTRA");
  drawUltraSpacePortal(328, 434, state.excludedP1, "ULTRA");

// (Z-Move Gauge e Botão removidos)

  // 8. Crisp 1080p Golden-Bronze [AI] Button OR Glowing Blue [End Turn ⏭️] Button during 2-Step Post-Move Target Selection!
  const aiGrad = ctx.createLinearGradient(118, 446, 118, 475);
  if (state.postMoveAttackMode) {
    aiGrad.addColorStop(0, "#0284c7");
    aiGrad.addColorStop(0.5, "#0369a1");
    aiGrad.addColorStop(1, "#1e3a8a");
  } else {
    aiGrad.addColorStop(0, "#78440c");
    aiGrad.addColorStop(0.5, "#5c3309");
    aiGrad.addColorStop(1, "#3d2005");
  }
  ctx.fillStyle = aiGrad;
  ctx.strokeStyle = state.postMoveAttackMode ? "#7dd3fc" : "#a16207";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(118, 446, 117, 28, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = state.postMoveAttackMode ? "900 12.5px sans-serif" : "800 15px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const endTurnLbl = (typeof t === "function") ? t("battle.end_turn", "End Turn ⏭️") : "End Turn ⏭️";
  ctx.fillText(state.postMoveAttackMode ? endTurnLbl : "AI", 176.5, 460.5);

  // 9. Crisp 1080p Bottom 2-Button Bar ([Forfeit] · [Activate Ability]) - Rewind removed!
  const drawBotBtn = (x, y, w, h, lbl, isBlue, hasDot) => {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    if (isBlue) {
      g.addColorStop(0, "#102a45"); g.addColorStop(0.5, "#0a1c30"); g.addColorStop(1, "#06111f");
    } else {
      g.addColorStop(0, "#1e2631"); g.addColorStop(0.5, "#121820"); g.addColorStop(1, "#0a0e14");
    }
    ctx.fillStyle = g;
    ctx.strokeStyle = isBlue ? "#1d4ed8" : "#334155";
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 3.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = isBlue ? "#cbd5e1" : "#94a3b8";
    ctx.font = "700 10px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(lbl, x + w / 2, y + h / 2);
    if (hasDot) {
      ctx.fillStyle = "#64748b";
      ctx.beginPath(); ctx.arc(x + w - 2, y + 2, 4.5, 0, Math.PI * 2); ctx.fill();
    }
  };
  // Seamlessly mask out the residual Rewind button baked into the arena floor across all arenas
  ctx.save();
  const cleanFloorGrad = ctx.createLinearGradient(240, 486, 240, 528);
  cleanFloorGrad.addColorStop(0, "#0c1829");
  cleanFloorGrad.addColorStop(0.3, "#08111e");
  cleanFloorGrad.addColorStop(0.7, "#040812");
  cleanFloorGrad.addColorStop(1, "#020408");
  ctx.fillStyle = cleanFloorGrad;
  ctx.beginPath();
  ctx.roundRect(240, 486, 104, 42, 6);
  ctx.fill();
  ctx.restore();

  if (typeof syncActivePlayerPlates === "function") syncActivePlayerPlates();
  const unUsedPlates = (state.plates || []).filter(p => !p.disabledInDeck && !p.used).length;
  const forfeitLbl = (typeof t === "function") ? t("battle.forfeit", "🏳️ Desistir") : "🏳️ Desistir";
  const platesWord = (typeof t === "function") ? t("battle.plates", "🎴 Cartas") : "🎴 Cartas";
  drawBotBtn(16, 497, 72, 26, forfeitLbl, false, false);
  drawBotBtn(94, 497, 114, 26, `${platesWord} (${unUsedPlates})`, true, unUsedPlates > 0);

  ctx.restore();
}

function drawAuthenticFigurine(u, x, y, zHeight, scale, rotation, shadowX, shadowY, isSelected) {
  const isMySide = (u.owner === getBottomRole());
  const backKey = u.baseId + "_back";
  const preferredKey = (isMySide && AUTHENTIC_FIG_SPRITES[backKey]) ? backKey : u.baseId;
  const meta = AUTHENTIC_FIG_SPRITES[preferredKey] || AUTHENTIC_FIG_SPRITES[u.spriteKey] || AUTHENTIC_FIG_SPRITES[u.baseId] || AUTHENTIC_FIG_SPRITES["pikachu"];
  const img = loadedFigImages[preferredKey] || loadedFigImages[u.spriteKey] || loadedFigImages[u.baseId] || loadedFigImages["pikachu"];

  ctx.save();
  if (zHeight > 2) {
    const shScale = Math.max(0.35, 1 - zHeight / 85);
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY + 2, 16 * shScale, 9 * shScale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(rotation);

  const pSkin = (window.trainerProfileData && window.trainerProfileData.equippedCosmetics && window.trainerProfileData.equippedCosmetics.pedestalSkin) || "Royal_Crystal_Plate";
  if ((state.goldenFiguresActive || pSkin !== "Standard_Bronze") && u.owner === getBottomRole()) {
    ctx.save();
    const skinCols = {
      "Royal_Crystal_Plate":   { stroke: "#38bdf8", fill: "rgba(56, 189, 248, 0.20)" },
      "Polished_Gold_24K":     { stroke: "#facc15", fill: "rgba(250, 204, 21, 0.24)" },
      "Dark_Obsidian_Crystal": { stroke: "#c084fc", fill: "rgba(192, 132, 252, 0.22)" },
      "Volcanic_Flames":       { stroke: "#f97316", fill: "rgba(249, 115, 22, 0.24)" }
    };
    const sc = state.goldenFiguresActive ? skinCols["Polished_Gold_24K"] : (skinCols[pSkin] || skinCols["Royal_Crystal_Plate"]);
    ctx.strokeStyle = sc.stroke;
    ctx.fillStyle = sc.fill;
    ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(0, 3, 18, 9.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  if (u.megaTurns && u.megaTurns > 0) {
    ctx.save();
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(0, 1, 19, 11, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  if (isSelected) {
    const pulse = 1 + Math.sin(performance.now() * 0.01) * 0.1;
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(0, 1, 20 * pulse, 12 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (img && img.complete && meta) {
    ctx.drawImage(img, -meta.ox, -meta.oy, meta.w, meta.h);
  }

  // Circular MP badge on bottom-right of pedestal (`00:57` in video!)
  ctx.fillStyle = u.owner === "p1" ? "#0284c7" : "#dc2626";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.arc(13, 5, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffffff"; ctx.font = "900 6.8px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(String(getEffectiveUnitMp(u)), 13, 5.3);

  if (u.waitTurns > 0) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(13, -14, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fde047"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("W" + u.waitTurns, 13, -11.5);
  }
  const condBadge = CONDITION_BADGES[u.condition];
  if (condBadge) {
    ctx.fillStyle = "rgba(9, 13, 22, 0.92)";
    ctx.strokeStyle = condBadge.col;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(-16, -27, 32, 9, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = condBadge.col;
    ctx.font = "bold 6.5px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(condBadge.lbl, 0, -20.5);
  }
  ctx.restore();
}

function drawSurfaceOverlayTint() {
  if (state.surface === "crystal") return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(12, 72); ctx.lineTo(341, 72); ctx.lineTo(351, 480); ctx.lineTo(2, 480); ctx.closePath();
  ctx.clip();
  if (state.surface === "marble") {
    ctx.fillStyle = "rgba(226, 232, 240, 0.16)";
    ctx.fillRect(0, 70, 353, 412);
    ctx.strokeStyle = "rgba(250, 204, 21, 0.22)";
    ctx.lineWidth = 1;
    for (let x = 20; x < 340; x += 48) for (let y = 80; y < 470; y += 48) ctx.strokeRect(x, y, 48, 48);
  } else if (state.surface === "wood") {
    ctx.fillStyle = "rgba(120, 53, 15, 0.28)";
    ctx.fillRect(0, 70, 353, 412);
  } else if (state.surface === "stone") {
    ctx.fillStyle = "rgba(82, 82, 91, 0.25)";
    ctx.fillRect(0, 70, 353, 412);
  } else if (state.surface === "habitats") {
    ctx.fillStyle = "rgba(34, 197, 94, 0.16)"; ctx.fillRect(0, 70, 176, 206);
    ctx.fillStyle = "rgba(14, 165, 233, 0.16)"; ctx.fillRect(176, 70, 177, 206);
    ctx.fillStyle = "rgba(168, 85, 247, 0.16)"; ctx.fillRect(0, 276, 176, 206);
    ctx.fillStyle = "rgba(234, 88, 12, 0.16)"; ctx.fillRect(176, 276, 177, 206);
  }
  ctx.restore();
}

function drawFullTabletopFrame() {
  const tNow = performance.now() * 0.004;

  ctx.save();
  ctx.imageSmoothingEnabled = (window.pixelArtMode === 'hd');
  // Scale all logical 353x530 operations by 3x onto the native 1059x1590 Full HD buffer!
  const curS = window.ACTIVE_SCALE || HD_SCALE; ctx.scale(curS, curS);

  // 1. Draw the 2x Retina sharpened crystal tabletop & portrait base
  if (state.surface === "banana" && bananaArenaImg && bananaArenaImg.complete && bananaArenaImg.naturalWidth > 0) {
    ctx.drawImage(bananaArenaImg, 0, 0, LOGICAL_W, LOGICAL_H);
  } else if (cleanBoardImg && cleanBoardImg.complete && cleanBoardImg.naturalWidth > 0) {
    ctx.drawImage(cleanBoardImg, 0, 0, LOGICAL_W, LOGICAL_H);
  } else {
    const bgGrad = ctx.createRadialGradient(LOGICAL_W / 2, LOGICAL_H / 2, 40, LOGICAL_W / 2, LOGICAL_H / 2, 280);
    bgGrad.addColorStop(0, "#0e223d");
    bgGrad.addColorStop(0.65, "#071120");
    bgGrad.addColorStop(1, "#020408");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  }

  drawSurfaceOverlayTint();

  // 2. Draw 100% Native 1080p Vector Board Lines, 28 Nodes, Entry Points, Goal Points, Bench Rings & UI Chrome
  drawHDVectorBoardAndChrome();

  const botRole = getBottomRole();
  const topRole = botRole === "p1" ? "p2" : "p1";
  const topRevQueue = botRole === "p1" ? state.reviverQueueP2 : state.reviverQueueP1;
  const botRevQueue = botRole === "p1" ? state.reviverQueueP1 : state.reviverQueueP2;

  // 3. Draw Opponent Bench Figurines across the table at Top (sorted back row y=122 then front row y=144)
  const topBench = state.units.filter(u => u.owner === topRole && u.location === "bench" && (!activePieceAnim || activePieceAnim.uid !== u.uid));
  topBench.sort((a, b) => P2_BENCH_COORDS[a.benchSlot % P2_BENCH_COORDS.length].y - P2_BENCH_COORDS[b.benchSlot % P2_BENCH_COORDS.length].y);
  topBench.forEach(u => {
    const slot = P2_BENCH_COORDS[u.benchSlot % P2_BENCH_COORDS.length];
    drawAuthenticFigurine(u, slot.x, slot.y, 0, 1.0, 0, slot.x, slot.y, state.selectedUnitId === u.uid);
  });

  // 4. Draw Opponent Reviver Pods (inside top-left incubator capsules: 2 pods max)
  topRevQueue.forEach((uid, idx) => {
    const pod = REVIVER_PODS_P2[idx];
    const u = state.units.find(x => x.uid === uid);
    if (pod && u && idx < 2) {
      drawAuthenticFigurine(u, pod.x, pod.y + 4, 0, 0.68, 0, pod.x, pod.y + 4, false);
    }
  });
  // Draw front glass cylinder overlay & highlights in front of figures
  drawGreenIncubatorChambers(true, topRevQueue);

  // 5. Draw Reachable Nodes, Parabolic Jump Arcs & Attack Reticles on the 28-node grid (mapped to viewer's seat!)
  if (state.selectedUnitId && !state.isAnimating) {
    Object.entries(state.reachablePaths).forEach(([destId, segs]) => {
      segs.forEach(seg => {
        if (seg.type === "jump") {
          const n1 = getNodePos(seg.fromNode), n2 = getNodePos(seg.toNode);
          ctx.save();
          ctx.strokeStyle = "#c084fc"; ctx.lineWidth = 2.4; ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(n1.x, n1.y);
          ctx.quadraticCurveTo((n1.x + n2.x) / 2, Math.min(n1.y, n2.y) - 38, n2.x, n2.y);
          ctx.stroke();
          ctx.restore();
        }
      });
    });

    const pulse = 1 + Math.sin(tNow * 2.5) * 0.18;
    state.reachableNodes.forEach(nid => {
      const n = getNodePos(nid);
      const isJump = state.reachablePaths[nid] && state.reachablePaths[nid].some(s => s.type === "jump");
      ctx.save();
      ctx.strokeStyle = isJump ? "#c084fc" : "#4ade80";
      ctx.fillStyle = isJump ? "rgba(192,132,252,0.35)" : "rgba(74,222,128,0.35)";
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(n.x, n.y, 9 * pulse, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    });

    state.attackTargets.forEach(nid => {
      const n = getNodePos(nid);
      ctx.save();
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(n.x, n.y, 17 * pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
  }

  // 6. Draw Board Figurines (sorted back-to-front by screen y coordinate!)
  const onBoard = state.units.filter(u => u.location === "board" && (!activePieceAnim || activePieceAnim.uid !== u.uid));
  onBoard.sort((a, b) => getNodePos(a.nodeId).y - getNodePos(b.nodeId).y);
  onBoard.forEach(u => {
    const n = getNodePos(u.nodeId);
    if (!n) return;
    drawAuthenticFigurine(u, n.x, n.y, 0, 1.0, 0, n.x, n.y, state.selectedUnitId === u.uid);
  });

  // 7. Draw Local Viewer's Bench Figurines at Bottom (sorted back row y=396 then front row y=422)
  const botBench = state.units.filter(u => u.owner === botRole && u.location === "bench" && (!activePieceAnim || activePieceAnim.uid !== u.uid));
  botBench.sort((a, b) => BENCH_SLOTS_P1[a.benchSlot % BENCH_SLOTS_P1.length].y - BENCH_SLOTS_P1[b.benchSlot % BENCH_SLOTS_P1.length].y);
  botBench.forEach(u => {
    const slot = BENCH_SLOTS_P1[u.benchSlot % BENCH_SLOTS_P1.length];
    drawAuthenticFigurine(u, slot.x, slot.y, 0, 1.0, 0, slot.x, slot.y, state.selectedUnitId === u.uid);
  });

  // 8. Draw Local Viewer's Reviver Pods (bottom-right P.C. recovery pads: 2 pods max)
  botRevQueue.forEach((uid, idx) => {
    const pod = REVIVER_PODS_P1[idx];
    const u = state.units.find(x => x.uid === uid);
    if (pod && u && idx < 2) {
      drawAuthenticFigurine(u, pod.x, pod.y - 2, 0, 0.82, 0, pod.x, pod.y - 2, false);
    }
  });

  // 9. Draw Active Moving/Jumping/Portal Figurine
  if (activePieceAnim) {
    const u = state.units.find(x => x.uid === activePieceAnim.uid);
    if (u) {
      if (activePieceAnim.portalAlpha > 0) {
        ctx.save();
        const beamGrad = ctx.createLinearGradient(activePieceAnim.x - 16, 0, activePieceAnim.x + 16, 0);
        beamGrad.addColorStop(0, "rgba(56,189,248,0)");
        beamGrad.addColorStop(0.5, `rgba(56,189,248,${activePieceAnim.portalAlpha * 0.85})`);
        beamGrad.addColorStop(1, "rgba(56,189,248,0)");
        ctx.fillStyle = beamGrad;
        ctx.fillRect(activePieceAnim.x - 16, 120, 32, activePieceAnim.shadowY - 115);
        ctx.restore();
      }
      drawAuthenticFigurine(
        u, activePieceAnim.x, activePieceAnim.y - activePieceAnim.z,
        activePieceAnim.z, activePieceAnim.scale, activePieceAnim.rot,
        activePieceAnim.shadowX, activePieceAnim.shadowY, true
      );
    }
  }

  // 10. Draw Active VFX Shockwaves, Beams & Particles
  for (let i = boardShockwaves.length - 1; i >= 0; i--) {
    const sw = boardShockwaves[i];
    sw.r += (sw.maxR - sw.r) * 0.16; sw.alpha -= 0.04;
    if (sw.alpha <= 0) { boardShockwaves.splice(i, 1); continue; }
    ctx.save(); ctx.strokeStyle = sw.color; ctx.globalAlpha = sw.alpha; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  for (let i = boardBeams.length - 1; i >= 0; i--) {
    const bm = boardBeams[i];
    bm.life -= 0.045;
    if (bm.life <= 0) { boardBeams.splice(i, 1); continue; }
    ctx.save(); ctx.strokeStyle = bm.color; ctx.globalAlpha = bm.life; ctx.lineWidth = 5 * bm.life;
    ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke(); ctx.restore();
  }
  for (let i = boardParticles.length - 1; i >= 0; i--) {
    const pt = boardParticles[i];
    pt.x += pt.vx; pt.y += pt.vy; pt.life -= pt.decay;
    if (pt.life <= 0) { boardParticles.splice(i, 1); continue; }
    ctx.save(); ctx.fillStyle = pt.color; ctx.globalAlpha = pt.life;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  // (Top HUD grande substituído pelo card suave no canto inferior)

  // 12. Draw Pre-Match VS/First Spinner (`00:45`), START (`00:58`), Sliding Turn Banners (`01:58`), and WIN (`04:38`)!
  drawVideoMatchOverlays();

  ctx.restore();
}


function drawMiniDataDiskPreview(cx, cy, r, segs) {
  const total = segs.reduce((a, s) => a + s.size, 0);
  let ang = -Math.PI / 2;
  const colMap = { white:"#f8fafc", gold:"#facc15", purple:"#c084fc", blue:"#38bdf8", red:"#ef4444" };
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fillStyle = "#090d16"; ctx.fill();
  ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1.5; ctx.stroke();

  segs.forEach(s => {
    const sl = (s.size / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, ang, ang + sl); ctx.closePath();
    ctx.fillStyle = colMap[s.color] || "#fff"; ctx.fill();
    ctx.strokeStyle = "#090d16"; ctx.lineWidth = 1; ctx.stroke();
    if (s.size >= 14 && s.dmg > 0) {
      const m = ang + sl / 2;
      ctx.fillStyle = "#090d16"; ctx.font = "900 8px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(s.dmg), cx + Math.cos(m) * (r * 0.58), cy + Math.sin(m) * (r * 0.58));
    }
    ang += sl;
  });
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = "#1e293b"; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}

// Exact Top Black Metallic Figure Status & Mini Data Disk HUD (`01:38`, `03:00`, `04:25` in video!)
function drawSelectedFigureTopHUD() {
  if (!state.selectedUnitId || state.isAnimating) return;
  const u = state.units.find(x => x.uid === state.selectedUnitId);
  if (!u) return;
  const segs = getActiveWheel(u);

  ctx.save();
  // Dark metallic panel covering y = 20..146 (`01:38` in video)
  ctx.fillStyle = "rgba(8, 11, 18, 0.95)";
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(4, 20, 345, 124, 5); ctx.fill(); ctx.stroke();

  // Left "Status" sub-box
  ctx.fillStyle = "#111622";
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1;
  ctx.fillRect(10, 26, 62, 112); ctx.strokeRect(10, 26, 62, 112);
  ctx.fillStyle = "#94a3b8"; ctx.font = "bold 7.5px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("Status", 41, 35);
  ctx.fillStyle = "#f8fafc"; ctx.font = "bold 8.5px sans-serif";
  ctx.fillText(`MP ${u.mp}`, 41, 52);
  if (state.meadowPowerActive && u.type && u.type.includes("Grass")) {
    ctx.fillStyle = "#4ade80"; ctx.font = "bold 7.5px sans-serif";
    ctx.fillText("ATK +20", 41, 68);
  }
  const cB = CONDITION_BADGES[u.condition];
  if (cB) {
    ctx.fillStyle = cB.col; ctx.fillText(cB.lbl, 41, 84);
  }

  // Center Figure Name, Rarity Circle & Blue MP Square (`01:38` in video!)
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(u.name, 82, 54);

  // Rarity circle
  const rarCol = u.rarity === "EX" || u.rarity === "UX" ? "#facc15" : "#cbd5e1";
  ctx.fillStyle = "#1e293b"; ctx.strokeStyle = rarCol; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(93, 76, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = rarCol; ctx.font = "900 9px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(u.rarity, 93, 76.5);

  // Blue MP rounded square
  ctx.fillStyle = "#0284c7"; ctx.strokeStyle = "#bae6fd"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(110, 66, 20, 20, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffffff"; ctx.font = "900 11px sans-serif";
  ctx.fillText(String(u.mp), 120, 76.5);

  // Right Live Mini Data Disk Wheel (`cx = 232, cy = 82, r = 46`)
  drawMiniDataDiskPreview(232, 82, 46, segs);

  // Far-Right `[Details]` and `[✕]` buttons (`01:38` in video)
  ctx.fillStyle = "#1e293b"; ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(298, 25, 44, 18, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#e2e8f0"; ctx.font = "bold 8px sans-serif";
  ctx.fillText("Details", 320, 34.5);

  ctx.beginPath(); ctx.roundRect(322, 120, 20, 18, 3); ctx.fill(); ctx.stroke();
  ctx.fillText("✕", 332, 129.5);

  // Duel DB Real-Time Probability Calculator Bar (`Win % / Tie % / Loss %`)
  const oppTarget = (state.attackTargets && state.attackTargets.length > 0)
    ? unitAtNode(state.attackTargets[0])
    : state.units.find(x => x.owner !== u.owner && x.location === "board") || state.units.find(x => x.owner !== u.owner);
  if (oppTarget) {
    const odds = computeDuelDbOdds(u, oppTarget);
    ctx.fillStyle = "#94a3b8"; ctx.font = "bold 7.2px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`📊 Duel DB vs ${oppTarget.name.slice(0,10)}: W ${odds.win}% · T ${odds.tie}% · L ${odds.loss}%`, 80, 104);
    const barW = 94, bx = 80, by = 111, bh = 6;
    const wPx = (odds.win / 100) * barW, tPx = (odds.tie / 100) * barW;
    ctx.fillStyle = "#22c55e"; ctx.fillRect(bx, by, wPx, bh);
    ctx.fillStyle = "#64748b"; ctx.fillRect(bx + wPx, by, tPx, bh);
    ctx.fillStyle = "#ef4444"; ctx.fillRect(bx + wPx + tPx, by, Math.max(0, barW - wPx - tPx), bh);
    ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 0.7; ctx.strokeRect(bx, by, barW, bh);
  }
  if (u.evoStage > 0) {
    ctx.fillStyle = "#facc15"; ctx.font = "900 7.5px sans-serif"; ctx.textAlign = "left";
    ctx.fillText(`✨ Stage +${u.evoStage} (+${u.evoStage * 10} DMG / +${u.evoStage}★)`, 80, 129);
  }
  ctx.restore();
}

// Exact Video Match Overlays:
// - `00:42`–`00:49` Square Diagonal Blue/Red `VS` & `First` Spinner
// - `00:58` Giant Neon Green `START` Flash
// - `01:58` / `02:55` Sliding `My turn` / `Opponent turn` Banner
// - `04:38` `WIN` Fireworks Celebration
function drawVideoMatchOverlays() {
  const now = performance.now();

  // 1. Sliding `My turn` / `Opponent turn` Banner (`01:58`, `02:55` in video!)
  if (state.turnBannerAnim) {
    const p = (now - state.turnBannerAnim.t0) / 1150;
    if (p >= 1) {
      state.turnBannerAnim = null;
    } else {
      const alpha = p < 0.2 ? p / 0.2 : (p > 0.75 ? (1 - p) / 0.25 : 1);
      const isMy = state.turnBannerAnim.turn === getBottomRole();
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = isMy ? "rgba(2, 132, 199, 0.92)" : "rgba(185, 28, 28, 0.92)";
      ctx.fillRect(0, 54, 353, 26);
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, 54); ctx.lineTo(353, 54); ctx.moveTo(0, 80); ctx.lineTo(353, 80); ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.font = "900 13px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(isMy ? "My turn" : "Opponent turn", 176.5, 67);
      ctx.restore();
    }
  }

  // 2. Authentic 50/50 Dynamic First-Turn Roulette (`preMatchAnim`) & `START` Flash (v5.3.0)
  if (state.preMatchAnim) {
    const elapsed = now - state.preMatchAnim.t0;
    const firstWinner = state.preMatchAnim.firstWinner || state.turn || "p1";
    const myNick = (window.trainerProfileData && window.trainerProfileData.nickname) ? window.trainerProfileData.nickname : "Você";
    const oppNick = (state.mode === "p2p" && remoteOpponentProfile && remoteOpponentProfile.nickname)
      ? remoteOpponentProfile.nickname
      : (window.adaptiveAIOpponentName || "IA Estratégica");

    const p1Nick = (state.myRole === "p2") ? oppNick : myNick;
    const p2Nick = (state.myRole === "p2") ? myNick : oppNick;
    const isP1First = (firstWinner === "p1");

    if (elapsed < 1550) {
      ctx.save();
      ctx.fillStyle = "rgba(2, 6, 23, 0.78)";
      ctx.fillRect(0, 0, 353, 530);

      const bx = 52, by = 140, bw = 249, bh = 249;
      const landed = (elapsed > 980);

      // Top-Right Red Triangle (Player 2 / Vermelho / IA)
      ctx.fillStyle = (landed && !isP1First) ? "#b91c1c" : "#651515";
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + bh); ctx.closePath(); ctx.fill();

      // Bottom-Left Blue Triangle (Player 1 / Azul / Host)
      ctx.fillStyle = (landed && isP1First) ? "#1d4ed8" : "#152c69";
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.closePath(); ctx.fill();

      // Highlight glow on winning half once landed
      if (landed) {
        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (isP1First) {
          ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.closePath();
        } else {
          ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + bh); ctx.closePath();
        }
        ctx.stroke();
      }

      // Diagonal white laser line
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by + bh); ctx.stroke();

      // Metallic square border
      ctx.strokeStyle = "#090d16"; ctx.lineWidth = 5;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 1.8;
      ctx.strokeRect(bx, by, bw, bh);

      // Header title above roulette
      ctx.fillStyle = "#fde047"; ctx.font = "900 11px sans-serif";
      ctx.textAlign = "center";
      const rouletteTitle = (typeof t === "function") ? t("battle.roulette_title", "🎲 ROLETA DE 1º TURNO (50% / 50%)") : "🎲 ROLETA DE 1º TURNO (50% / 50%)";
      ctx.fillText(rouletteTitle, bx + bw / 2, by - 10);

      // Names inside corners - Consistent with internal P1 (Blue) and P2 (Red)
      ctx.fillStyle = "#ffffff"; ctx.font = "900 11px sans-serif";
      const youLbl = (typeof t === "function") ? t("battle.you", "Você") : "Você";
      const rivLbl = (typeof t === "function") ? t("battle.rival", "Rival") : "Rival";
      const p2Label = "🔴 " + p2Nick + (state.myRole === "p2" ? ` (${youLbl} · P2)` : (state.mode === "p2p" ? ` (${rivLbl} · P2)` : " (IA · P2)"));
      const p1Label = "🔵 " + p1Nick + (state.myRole === "p1" ? ` (${youLbl} · P1)` : ` (${rivLbl} · P1)`);
      ctx.textAlign = "right"; ctx.fillText(p2Label, bx + bw - 12, by + 22);
      ctx.textAlign = "left";  ctx.fillText(p1Label, bx + 12, by + bh - 12);

      // Center spinner needle with true target angle:
      // At ang = 0, needle points UP.
      // Top-Right Red triangle center is +45 deg (Math.PI * 0.25).
      // Bottom-Left Blue triangle center is +225 deg (Math.PI * 1.25).
      const cx = bx + bw / 2, cy = by + bh / 2;
      const targetAngle = isP1First ? (Math.PI * 8 + Math.PI * 1.25) : (Math.PI * 8 + Math.PI * 0.25);
      const spinP = Math.min(1, elapsed / 980);
      const easeOut = 1 - Math.pow(1 - spinP, 3.5);
      const ang = easeOut * targetAngle;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      // Glowing Golden Pointer Needle
      ctx.shadowColor = "#facc15"; ctx.shadowBlur = 10;
      ctx.fillStyle = "#fde047";
      ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(-8, 0); ctx.lineTo(8, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath(); ctx.moveTo(0, 24); ctx.lineTo(-5, 0); ctx.lineTo(5, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fillStyle = "#090d16"; ctx.fill(); ctx.strokeStyle = "#fde047"; ctx.lineWidth = 2.8; ctx.stroke();
      ctx.restore();

      const youStartTxt = (typeof t === "function") ? t("battle.roulette_you_start", "Você começa (-1 MP)") : "Você começa (-1 MP)";
      const startsSuffix = (typeof t === "function") ? t("battle.roulette_starts", "começa (-1 MP)") : "começa (-1 MP)";
      if (landed) {
        ctx.fillStyle = "#fde047"; ctx.font = "900 20px sans-serif";
        ctx.textAlign = "center"; ctx.shadowColor = "#000000"; ctx.shadowBlur = 8;
        if (isP1First) {
          ctx.fillText("FIRST!", cx - 50, cy + 44);
          ctx.font = "900 10px sans-serif"; ctx.fillStyle = "#bae6fd";
          const startTxt = (state.myRole === "p1") ? youStartTxt : (p1Nick + " " + startsSuffix);
          ctx.fillText(startTxt + " · P1", cx - 50, cy + 60);
        } else {
          ctx.fillText("FIRST!", cx + 50, cy - 36);
          ctx.font = "900 10px sans-serif"; ctx.fillStyle = "#fecaca";
          const startTxt = (state.myRole === "p2") ? youStartTxt : (p2Nick + " " + startsSuffix);
          ctx.fillText(startTxt + " · P2", cx + 50, cy - 20);
        }
      } else {
        ctx.fillStyle = "#ffffff"; ctx.font = "900 18px sans-serif";
        ctx.textAlign = "center";
        const sortingTxt = (typeof t === "function") ? t("battle.roulette_sorting", "SORTEANDO...") : "SORTEANDO...";
        ctx.fillText(sortingTxt, cx, cy + 38);
      }
      ctx.restore();
    } else if (elapsed < 2250) {
      const sp = (elapsed - 1550) / 700;
      const alpha = sp < 0.25 ? sp / 0.25 : (1 - (sp - 0.25) / 0.75);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.strokeStyle = "#4ade80"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(20, 240); ctx.lineTo(333, 240); ctx.moveTo(20, 290); ctx.lineTo(333, 290); ctx.stroke();
      ctx.fillStyle = "#86efac";
      ctx.font = "900 44px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowColor = "#22c55e"; ctx.shadowBlur = 18;
      ctx.fillText("START", 176.5, 265);
      ctx.restore();
    } else {
      const shouldFireAI = (state.turn === "p2" && state.mode === "ai" && state.matchKind !== "tutorial" && !state.preMatchAnim.aiFired);
      state.preMatchAnim = null;
      if (shouldFireAI) {
        setTimeout(() => {
          if (state.turn === "p2" && state.mode === "ai" && state.matchKind !== "tutorial") {
            triggerPlayerAIMove();
          }
        }, 320);
      }
      if (state.mode === "p2p" || state.mode === "pass") {
        state.turnBannerAnim = { turn: state.turn, t0: performance.now() };
      }
    }
  }

  // 3. `04:38` Giant Gold `WIN` + Fireworks Celebration on Goal Point!
  if (state.winCelebrationAnim) {
    const elapsed = now - state.winCelebrationAnim.t0;
    ctx.save();
    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 3;
    ctx.font = "900 46px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "#f59e0b"; ctx.shadowBlur = 20;
    ctx.strokeText("WIN", 176.5, 250);
    ctx.fillText("WIN", 176.5, 250);
    ctx.restore();
    if (elapsed > 1450) {
      const winner = state.winCelebrationAnim.winner;
      state.winCelebrationAnim = null;
      showWinResultScreen(winner);
    }
  }
}

function showWinResultScreen(winner) {
  state.isMatchActive = false;
  state.matchFinished = true;
  const didWin = (winner === getBottomRole());
  const ov = document.getElementById("win-result-overlay");
  const t = document.getElementById("win-result-title");
  if (t) {
    t.textContent = didWin ? "WIN" : "LOSE";
    t.style.color = didWin ? "#facc15" : "#f87171";
  }
  if (typeof BgmEngine !== "undefined") {
    BgmEngine.playFanfare(didWin ? "victory" : "defeat");
  }
  // Section 1.2: Dynamic ELO Calculation (K=32) & Trainer Profile Stats Update
  if (window.trainerProfileData) {
    const p = window.trainerProfileData;
    const oppRating = (remoteOpponentProfile && remoteOpponentProfile.rankRating) ? remoteOpponentProfile.rankRating : (window.trainerProfileData.rankRating || 1000);
    const expected = 1 / (1 + Math.pow(10, (oppRating - p.rankRating) / 400));
    const delta = Math.round(32 * ((didWin ? 1 : 0) - expected));
    p.rankRating = Math.max(800, p.rankRating + delta);
    if (p.rankRating > p.highestRating) p.highestRating = p.rankRating;
    p.leagueTier = p.rankRating >= 2700 ? "Legend" : (p.rankRating >= 2300 ? "Master" : (p.rankRating >= 1900 ? "Champion" : (p.rankRating >= 1500 ? "Leader" : "Beginner")));
    p.duelStats.totalDuels += 1;
    if (didWin) {
      p.duelStats.wins += 1;
      p.duelStats.currentWinStreak += 1;
      if (p.duelStats.currentWinStreak > p.duelStats.highestWinStreak) p.duelStats.highestWinStreak = p.duelStats.currentWinStreak;
    } else {
      p.duelStats.losses += 1;
      p.duelStats.currentWinStreak = 0;
    }
    p.duelStats.winRate = ((p.duelStats.wins / p.duelStats.totalDuels) * 100).toFixed(1) + "%";
    const rVal = document.getElementById("win-rating-val");
    const rDel = document.getElementById("win-rating-delta");
    const lPts = document.getElementById("league-pts-lbl");
    if (rVal) rVal.textContent = `${p.rankRating} (${p.leagueTier})`;
    if (rDel) {
      rDel.textContent = (delta >= 0 ? `+${delta} ↑` : `${delta} ↓`);
      rDel.style.color = delta >= 0 ? "#4ade80" : "#f87171";
    }
    if (lPts) lPts.textContent = p.rankRating;
  }
  // Award Key Fragments for Locked Booster (+3 on Win, +1 on Loss) & refill an empty Time Booster slot on Win!
  playerKeyFragments = Math.min(10, playerKeyFragments + (didWin ? 3 : 1));
  const kLbl = document.getElementById("key-frag-lbl");
  const kWrap = document.getElementById("locked-key-badge-wrap");
  if (kLbl) kLbl.textContent = playerKeyFragments;
  if (kWrap) kWrap.style.display = playerKeyFragments > 0 ? "block" : "none";
  if (didWin) {
    if (state.matchKind === "gym_cup") {
      playerProgression.gymTrophies = (playerProgression.gymTrophies || 0) + 1;
      state.rareMetals += 100;
      userMaterial += 250;
      saveEconomyAndUpgrades();
      syncAllCurrencyLabels();
      saveProgressionState();
      setLogText(`🏆 Vitória na Copa de Ginásio! +1 Troféu da Copa (Total: ${playerProgression.gymTrophies} 🏆) + 100 Gems + 250 Material!`);
    }
    const emptySlot = timeBoostersState.findIndex((x, i) => i < 3 && x.status === "empty");
    if (emptySlot !== -1) awardNewRealTimeBoosterToSlot(emptySlot);
  }
  if (ov) ov.style.display = "flex";
}

function closeWinResultOverlay() {
  const ov = document.getElementById("win-result-overlay");
  if (ov) ov.style.display = "none";
  if (typeof cleanupActiveP2PSession === "function") {
    cleanupActiveP2PSession("Win Result Overlay Closed");
  }
  state.mode = "ai";
  state.gameMode = "ai";
  state.matchKind = "league";
  demoFullMatchState();
  openDrawer("hub");
}


function activateCompetitiveFormat(fmt) {
  playSfx("portal");
  state.compFormat = fmt;
  const st = document.getElementById("comp-format-status");
  if (fmt === "tournament") {
    state.meadowPowerActive = true;
    if (st) st.textContent = "🥇 Official Tournament (Prelim 50 Duels -> Top 32 Finals): Prêmio [UX] Golden Dawn Wings Necrozma (#647)!";
  } else if (fmt === "gym") {
    state.meadowPowerActive = true;
    state.units.forEach(u => { if (u.mp < 3) u.mp = Math.min(3, u.mp + 1); });
    if (st) st.textContent = "⚡ Gym Cup Ativa: Figuras 1-2 MP recebem +1 MP e ataques White/Gold recebem +20 DMG (Rumo ao Invincible Trophy 11-0)!";
  } else if (fmt === "queens") {
    state.meadowPowerActive = true;
    if (st) st.textContent = "🚢 Queen's Cup (S.S. Carmonte Carnival): Desafiando Karolin (Rank S · Happy Hour 02:00/14:00 UTC · +400 pts)!";
  } else if (fmt === "ruby_hall") {
    if (st) st.textContent = "💎 Room Match Hall (Ruby Hall 1-2-3 / Silver Moon UC & Under): Regras de Torneio de Criadores Bo3 ativas!";
  }
  startVideoAuthenticMatch();
}

function openPlayModeSelectorModal() {
  playSfx("tick");
  const m = document.getElementById("play-mode-modal");
  if (m) m.style.display = "flex";
}
function closePlayModeSelectorModal() {
  const m = document.getElementById("play-mode-modal");
  if (m) m.style.display = "none";
}

function startVideoAuthenticMatch() {
  if (state.mode !== "p2p") {
    setGameMode("ai");
  }
  state.isMatchActive = true;
  state.matchFinished = false;
  state.clockMsP1 = 300000;
  state.clockMsP2 = 300000;
  demoFullMatchState();
  closeDrawer();
  playSfx("portal");
  state.preMatchAnim = { t0: performance.now() };
}

function boardRenderLoop() {
  try {
    drawFullTabletopFrame();
  } catch (err) {
    try { ctx.restore(); } catch (e2) {}
    console.error("boardRenderLoop recovered from error:", err);
  }
  requestAnimationFrame(boardRenderLoop);
}




// ============================================================================
// 8. EXACT TOUCH INTERACTION (MAPPED TO LOGICAL `353x530` STAGE)
// ============================================================================
canvas.addEventListener("pointerdown", e => {
  if (state.isAnimating || state.preMatchAnim) return;
  const rect = canvas.getBoundingClientRect();
  const sx = (e.clientX - rect.left) * (LOGICAL_W / rect.width);
  const sy = (e.clientY - rect.top) * (LOGICAL_H / rect.height);

  // 2. Top-Left "Uptodown" Trainer Portrait or Center "TURN" Badge -> Opens League Hub (Blocked during active multiplayer)
  if (sx >= 0 && sx <= 210 && sy >= 18 && sy <= 54) {
    if (state.mode === "p2p" || state.mode === "pass") {
      setLogText("ℹ️ Partida Multiplayer ativa! Use o botão Desistir (🏳️) para sair.");
      return;
    }
    openDrawer("hub");
    return;
  }

  // 3. Top-Right "Luca" Trainer Portrait -> Opens P2P Room Match (Blocked during active multiplayer)
  if (sx >= 240 && sx <= 353 && sy >= 18 && sy <= 54) {
    if (state.mode === "p2p" || state.mode === "pass") {
      setLogText("ℹ️ Partida Multiplayer ativa! Use o botão Desistir (🏳️) para sair.");
      return;
    }
    openDrawer("p2p");
    return;
  }

  // (Top HUD e Z-Move click listeners removidos)

  // 4. Golden-brown [AI] button OR Blue [End Turn ⏭️] button during 2-Step Attack Target Selection!
  if (sx >= 116 && sx <= 236 && sy >= 444 && sy <= 478) {
    if (state.postMoveAttackMode) {
      finishPostMoveWithoutAttack();
    } else {
      triggerPlayerAIMove();
    }
    return;
  }

  // 5. Bottom Button Bar: [Forfeit] | [Plates]
  if (sy >= 490) {
    if (sx <= 90) {
      triggerVoluntaryForfeit();
    } else if (sx >= 92 && sx <= 212) {
      togglePlatesTray();
    }
    return;
  }

  togglePlatesTray(false);

  const botRole = getBottomRole();
  const topRole = botRole === "p1" ? "p2" : "p1";

  // 6. Check Local Viewer's Bottom Bench Slots (comfortable 28px hitbox for mobile/touch)
  const botBench = state.units.filter(u => u.owner === botRole && u.location === "bench");
  botBench.sort((a, b) => BENCH_SLOTS_P1[b.benchSlot % BENCH_SLOTS_P1.length].y - BENCH_SLOTS_P1[a.benchSlot % BENCH_SLOTS_P1.length].y);
  for (const u of botBench) {
    const slot = BENCH_SLOTS_P1[u.benchSlot % BENCH_SLOTS_P1.length];
    if (Math.hypot(sx - slot.x, (sy - (slot.y - 10)) * 0.85) < 28) { selectUnit(u.uid); return; }
  }

  // 7. Check Opponent's Top Bench Slots (comfortable 26px hitbox)
  const topBench = state.units.filter(u => u.owner === topRole && u.location === "bench");
  topBench.sort((a, b) => P2_BENCH_COORDS[b.benchSlot % P2_BENCH_COORDS.length].y - P2_BENCH_COORDS[a.benchSlot % P2_BENCH_COORDS.length].y);
  for (const u of topBench) {
    const slot = P2_BENCH_COORDS[u.benchSlot % P2_BENCH_COORDS.length];
    if (Math.hypot(sx - slot.x, (sy - (slot.y - 10)) * 0.85) < 26) { selectUnit(u.uid); return; }
  }

  // 7.5. Check P.C. Reviver Pods (Bottom viewer P1 & Top opponent P2)
  const botRevQueue = botRole === "p1" ? state.reviverQueueP1 : state.reviverQueueP2;
  const topRevQueue = botRole === "p1" ? state.reviverQueueP2 : state.reviverQueueP1;

  for (let idx = 0; idx < botRevQueue.length && idx < 2; idx++) {
    const pod = REVIVER_PODS_P1[idx];
    const u = state.units.find(x => x.uid === botRevQueue[idx]);
    if (pod && u && Math.hypot(sx - pod.x, sy - (pod.y - 2)) < 24) {
      selectUnit(u.uid);
      return;
    }
  }
  for (let idx = 0; idx < topRevQueue.length && idx < 2; idx++) {
    const pod = REVIVER_PODS_P2[idx];
    const u = state.units.find(x => x.uid === topRevQueue[idx]);
    if (pod && u && Math.hypot(sx - pod.x, sy - (pod.y + 4)) < 22) {
      selectUnit(u.uid);
      return;
    }
  }

  // 8. Check 28 Board Nodes (mapped to viewer's 180-degree tabletop perspective, with 28px touch tolerance!)
  let bestNode = null, bestDist = 28;
  BOARD_NODES.forEach(n => {
    const pos = getNodePos(n.id);
    const d = Math.hypot(pos.x - sx, pos.y - sy);
    if (d < bestDist) { bestDist = d; bestNode = n; }
  });
  if (bestNode) {
    onNodeClicked(bestNode.id);
  } else {
    // Clicked outside any node / empty space: deselect friendly piece
    if (state.selectedUnitId && !state.postMoveAttackMode) {
      state.selectedUnitId = null;
      state.reachableNodes = [];
      state.reachablePaths = {};
      state.attackTargets = [];
      state.lastClickedAttackTargetId = null;
      hideCornerFigureCard();
    }
  }
});

function canControlTurn() {
  if (state.isAnimating) return false;
  if (state.mode === "ai") return state.turn === "p1";
  if (state.mode === "pass") return true;
  if (state.mode === "p2p") return state.turn === state.myRole;
  return true;
}

function finishPostMoveWithoutAttack() {
  hideCornerFigureCard();
  if (!state.postMoveAttackMode) return;
  state.postMoveAttackMode = false;
  state.attackTargets = [];
  state.selectedUnitId = null;
  state.lastClickedAttackTargetId = null;
  const info = state.pendingPostMoveTurn || { nextTurn: state.turn === "p1" ? "p2" : "p1", nextTurnCounter: Math.max(0, state.turnCounter - 1) };
  state.pendingPostMoveTurn = null;
  endTurn(true, info.nextTurn, info.nextTurnCounter);
}

function selectUnit(uid) {
  const u = state.units.find(x => x.uid === uid);
  if (!u || u.location === "ultra_space") return;

  if (u.location === "pc") {
    playSfx("tick");
    showCornerFigureCard(u);
    const ownerLbl = (u.owner === state.myRole) ? "Seu Pokémon" : "Rival";
    const canJ = typeof isFigurePassThroughOrJumper === "function" && isFigurePassThroughOrJumper(u);
    const jInfo = canJ ? " · 🦘 Pula Figuras" : " · 🚫 Não Pula";
    setLogText(`P.C. [${u.name}] (${ownerLbl}${jInfo}) — Em recuperação.`);
    return;
  }

  // If not active turn controller, allow inspecting any figure on the board or bench!
  if (!canControlTurn()) {
    playSfx("tick");
    showCornerFigureCard(u);
    const ownerLbl = (u.owner === state.myRole) ? "Seu Pokémon" : "Rival";
    const canJ = typeof isFigurePassThroughOrJumper === "function" && isFigurePassThroughOrJumper(u);
    const jInfo = canJ ? " · 🦘 Pula Figuras" : " · 🚫 Não Pula";
    setLogText(`Inspecionando ${u.name} (${ownerLbl}${jInfo}).`);
    return;
  }

  if (state.pendingPlateAction === "goalblock") {
    const candidate = state.units.find(x => x.uid === uid);
    if (!candidate || candidate.owner !== state.turn || candidate.location === "pc" || candidate.location === "ultra_space") {
      setLogText("⚠️ Selecione um Pokémon seu em campo ou no banco para o Goal Block!");
      return;
    }
    if (candidate.waitTurns > 0) {
      setLogText(`⚠️ ${candidate.name} possui Wait ${candidate.waitTurns} e não pode defender o Goal!`);
      return;
    }
    executeGoalBlockWithUnit(candidate);
    return;
  }

  if (state.postMoveAttackMode) {
    if (uid === state.selectedUnitId) {
      finishPostMoveWithoutAttack();
    } else if (u.owner !== state.turn) {
      playSfx("tick");
      showCornerFigureCard(u);
      const canJ = typeof isFigurePassThroughOrJumper === "function" && isFigurePassThroughOrJumper(u);
      const jInfo = canJ ? " · 🦘 Pula Figuras" : " · 🚫 Não Pula";
      setLogText(`Inspecionando ${u.name} (Rival${jInfo}).`);
    }
    return;
  }

  // Tapping an opponent's figure on bench or board: inspect their wheel card and clear friendly selection
  if (u.owner !== state.turn) {
    playSfx("tick");
    showCornerFigureCard(u);
    const canJ = typeof isFigurePassThroughOrJumper === "function" && isFigurePassThroughOrJumper(u);
    const jInfo = canJ ? " · 🦘 Pula Figuras" : " · 🚫 Não Pula";
    setLogText(`Inspecionando ${u.name} (Rival${jInfo}).`);
    state.selectedUnitId = null;
    state.reachableNodes = [];
    state.reachablePaths = {};
    state.attackTargets = [];
    state.lastClickedAttackTargetId = null;
    return;
  }

  if (u.waitTurns > 0) {
    setLogText(`${u.name} has Wait ${u.waitTurns}.`);
    showCornerFigureCard(u);
    return;
  }

  playSfx("tick");
  state.selectedUnitId = uid;
  state.lastClickedAttackTargetId = null;
  const res = computeReachableWithPaths(u);
  state.reachableNodes = res.nodes;
  state.reachablePaths = res.paths;
  state.attackTargets = [];
  if (u.location === "board") {
    (ADJ[u.nodeId] || []).forEach(nid => {
      const occ = unitAtNode(nid);
      if (occ && occ.owner !== u.owner) state.attackTargets.push(nid);
    });
  }
  const effMp = getEffectiveUnitMp(u);
  const canJ = typeof isFigurePassThroughOrJumper === "function" && isFigurePassThroughOrJumper(u);
  const jInfo = canJ ? " · 🦘 Pula Figuras" : " · 🚫 Não Pula";
  setLogText(`${u.name} (MP ${effMp}${jInfo}) selecionado.`);
  showCornerFigureCard(u);
}

function onNodeClicked(nodeId) {
  const occ = unitAtNode(nodeId);
  const sel = state.units.find(x => x.uid === state.selectedUnitId);

  // If not active turn controller, allow inspecting any figure on the clicked node!
  if (!canControlTurn()) {
    if (occ) {
      playSfx("tick");
      showCornerFigureCard(occ);
      const ownerLbl = (occ.owner === state.myRole) ? "Seu Pokémon" : "Rival";
      setLogText(`Inspecionando ${occ.name} (${ownerLbl}).`);
    } else {
      hideCornerFigureCard();
    }
    return;
  }

  if (state.postMoveAttackMode) {
    if (sel && state.attackTargets.includes(nodeId) && occ && occ.owner !== sel.owner) {
      state.postMoveAttackMode = false;
      const pInfo = state.pendingPostMoveTurn;
      state.pendingPostMoveTurn = null;
      triggerCombat(sel, occ, true, pInfo ? { nextTurn: pInfo.nextTurn, nextTurnCounter: pInfo.nextTurnCounter, manualSpin: true } : null);
    } else if (occ && occ.owner !== sel.owner) {
      playSfx("tick");
      showCornerFigureCard(occ);
      setLogText(`Inspecionando ${occ.name} (Rival).`);
    } else {
      finishPostMoveWithoutAttack();
    }
    return;
  }

  // 1. If clicked a friendly unit on the board, select it!
  if (occ && occ.owner === state.turn) {
    selectUnit(occ.uid);
    return;
  }

  // 2. If NO unit was currently selected:
  if (!sel) {
    if (occ) {
      playSfx("tick");
      showCornerFigureCard(occ);
      setLogText(`Inspecionando ${occ.name} (Rival).`);
    } else {
      hideCornerFigureCard();
    }
    return;
  }

  // 3. If a friendly unit WAS currently selected:
  // 3A. Moving to a reachable node:
  if (state.reachableNodes.includes(nodeId)) {
    state.lastClickedAttackTargetId = null;
    const pathSegs = state.reachablePaths[nodeId] || [];
    executeMove(sel.uid, nodeId, true, pathSegs);
    return;
  }

  // 3B. Attacking an adjacent enemy:
  if (state.attackTargets.includes(nodeId) && occ && occ.owner !== sel.owner) {
    if (state.lastClickedAttackTargetId === occ.uid) {
      // Second tap on the adjacent enemy confirms the battle!
      state.lastClickedAttackTargetId = null;
      triggerCombat(sel, occ, true);
    } else {
      // First tap shows the enemy's wheel and instructions!
      state.lastClickedAttackTargetId = occ.uid;
      playSfx("tick");
      showCornerFigureCard(occ);
      setLogText(`🎯 Alvo Adjacente: ${occ.name}! Toque novamente nele para ATACAR ou toque em outro local.`);
    }
    return;
  }

  // 3C. Clicking on ANY opponent unit on the board:
  // Shows the opponent's wheel and clears friendly movement!
  if (occ && occ.owner !== state.turn) {
    playSfx("tick");
    showCornerFigureCard(occ);
    setLogText(`Inspecionando ${occ.name} (Rival).`);
    state.selectedUnitId = null;
    state.reachableNodes = [];
    state.reachablePaths = {};
    state.attackTargets = [];
    state.lastClickedAttackTargetId = null;
    return;
  }

  // 3D. Clicked an empty unreachable board node: deselect friendly piece
  state.selectedUnitId = null;
  state.reachableNodes = [];
  state.reachablePaths = {};
  state.attackTargets = [];
  state.lastClickedAttackTargetId = null;
  hideCornerFigureCard();
}

function animatePieceAlongSegments(unit, segments, onComplete) {
  if (!segments || segments.length === 0) { onComplete(); return; }
  state.isAnimating = true;
  let segIdx = 0;

  function runNextSegment() {
    if (segIdx >= segments.length) {
      activePieceAnim = null;
      state.isAnimating = false;
      onComplete();
      return;
    }
    const seg = segments[segIdx++];
    const nFrom = getNodePos(seg.fromNode);
    const nTo = getNodePos(seg.toNode);
    const dur = seg.type === "portal" ? 400 : (seg.type === "jump" ? 480 : 210);
    let tStart = performance.now();

    if (seg.type === "portal") { playSfx("portal"); spawnPortalParticles(nTo.x, nTo.y, "#38bdf8"); }
    else if (seg.type === "jump") { playSfx("jump"); spawnPortalParticles(nFrom.x, nFrom.y, "#c084fc"); }
    else playSfx("step");

    function stepFrame(now) {
      const p = Math.min(1, (now - tStart) / dur);
      if (seg.type === "portal") {
        const dropZ = (1 - p) * 65 * Math.abs(Math.cos(p * Math.PI * 1.5));
        const sc = p < 0.7 ? 0.4 + (p / 0.7) * 0.75 : 1.15 - ((p - 0.7) / 0.3) * 0.15;
        activePieceAnim = {
          uid: unit.uid, x: nTo.x, y: nTo.y, z: dropZ, scale: sc,
          rot: (1 - p) * 0.25, shadowX: nTo.x, shadowY: nTo.y, portalAlpha: 1 - p
        };
      } else if (seg.type === "jump") {
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const cx = nFrom.x + (nTo.x - nFrom.x) * ease;
        const cy = nFrom.y + (nTo.y - nFrom.y) * ease;
        const jumpArcZ = Math.sin(p * Math.PI) * 56;
        const sc = 1 + Math.sin(p * Math.PI) * 0.28;
        const rot = Math.sin(p * Math.PI * 2) * 0.22;
        activePieceAnim = {
          uid: unit.uid, x: cx, y: cy, z: jumpArcZ, scale: sc, rot,
          shadowX: cx, shadowY: cy, portalAlpha: 0
        };
      } else {
        const cx = nFrom.x + (nTo.x - nFrom.x) * p;
        const cy = nFrom.y + (nTo.y - nFrom.y) * p;
        const hopZ = Math.sin(p * Math.PI) * 12;
        activePieceAnim = {
          uid: unit.uid, x: cx, y: cy, z: hopZ,
          scale: 1 + Math.sin(p * Math.PI) * 0.07, rot: Math.sin(p * Math.PI * 2) * 0.1,
          shadowX: cx, shadowY: cy, portalAlpha: 0
        };
      }
      if (p < 1) requestAnimationFrame(stepFrame);
      else {
        boardShockwaves.push({ x: nTo.x, y: nTo.y, r: 3, maxR: 16, alpha: 0.65, color: "#ffffff" });
        runNextSegment();
      }
    }
    requestAnimationFrame(stepFrame);
  }
  runNextSegment();
}

function executeMove(uid, targetNodeId, broadcast, customSegments, remotePacket) {
  const u = state.units.find(x => x.uid === uid);
  if (!u) return;

  state.historyStack.push(JSON.stringify({
    units: state.units, rev1: state.reviverQueueP1, rev2: state.reviverQueueP2,
    turn: state.turn, turnCounter: state.turnCounter, logText: state.logText
  }));
  if (state.historyStack.length > 10) state.historyStack.shift();

  let segs = customSegments;
  if (!segs || segs.length === 0) {
    const computed = computeReachableWithPaths(u);
    segs = computed.paths[targetNodeId] || [
      u.location === "bench"
        ? { type: "portal", fromNode: targetNodeId, toNode: targetNodeId }
        : { type: "walk", fromNode: u.nodeId, toNode: targetNodeId }
    ];
  }

  state.selectedUnitId = uid;
  state.reachableNodes = [];
  hideCornerFigureCard();
  state.reachablePaths = {};
  state.abilityJumpActive = false;
  u.location = "board";
  u.nodeId = targetNodeId;

  // Section 1.3: Check if landing on targetNodeId immediately Surround-KOs any adjacent enemy (or u itself)!
  // Strict rule: A figure is surrounded IF AND ONLY IF EVERY adjacent neighbor is an enemy!
  const willBeSurrounded = (candUnit) => {
    const nbs = ADJ[candUnit.nodeId] || [];
    return nbs.length > 0 && nbs.every(nid => {
      const o = unitAtNode(nid);
      return o !== null && o.owner !== candUnit.owner;
    });
  };
  const selfSurrounded = willBeSurrounded(u);
  const adjEnemiesAfter = [];
  if (!selfSurrounded) {
    ADJ[targetNodeId].forEach(nid => {
      const occ = unitAtNode(nid);
      if (occ && occ.owner !== u.owner && occ.uid !== u.uid && !willBeSurrounded(occ)) {
        adjEnemiesAfter.push(nid);
      }
    });
  }
  const capturedGoal = (u.owner === "p1" && targetNodeId === 3) || (u.owner === "p2" && targetNodeId === 10);
  const nextTurnVal = state.turn === "p1" ? "p2" : "p1";
  const nextCounterVal = Math.max(0, state.turnCounter - 1);

  // Pre-compute combat spins atomically on the active peer so both devices see the exact same wheel outcome!
  let precomputedCombat = null;
  if (broadcast && !capturedGoal && adjEnemiesAfter.length > 0) {
    let chosenEnemyNode = adjEnemiesAfter[0];
    if (state.mode === "ai" && u.owner === "p2") {
      if (state.aiHoldPositionNoAttack) {
        chosenEnemyNode = null;
      } else if (typeof state.aiPlannedAttackNode === "number" && adjEnemiesAfter.includes(state.aiPlannedAttackNode)) {
        chosenEnemyNode = state.aiPlannedAttackNode;
      }
    }
    const enemy = chosenEnemyNode !== null ? unitAtNode(chosenEnemyNode) : null;
    if (enemy) {
      const atkSpin = spinWheelForUnit(u, true);
      const defSpin = spinWheelForUnit(enemy, false);
      precomputedCombat = { atkUid: u.uid, defUid: enemy.uid, atkSpin, defSpin };
    }
  }

  if (broadcast && state.mode === "p2p") {
    appendTcpLog(`> P2P_MOVE uid=${uid} dest=${targetNodeId} nextTurn=${nextTurnVal}`);
    sendP2PPacket({
      type: "P2P_MOVE",
      uid,
      targetNodeId,
      segs,
      seed: sharedPrngState,
      combat: null,
      awaitingPostMoveChoice: (adjEnemiesAfter.length > 0 && !capturedGoal),
      nextTurn: nextTurnVal,
      nextTurnCounter: nextCounterVal
    });
  }

  state.longThrowActive = false;

  animatePieceAlongSegments(u, segs, () => {
    // 1. Ally Tag Cure: moving adjacent to a Sleeping or Frozen friendly figure wakes/unfreezes it (`02:50` & `19:12` tournament rule!)
    (ADJ[targetNodeId] || []).forEach(nid => {
      const ally = unitAtNode(nid);
      if (ally && ally.owner === u.owner && (ally.condition === PokemonCondition.Sleep || ally.condition === PokemonCondition.Freeze)) {
        ally.condition = PokemonCondition.Normal;
        spawnPortalParticles(BOARD_NODES[nid].x, BOARD_NODES[nid].y, "#38bdf8");
        setLogText(`Tag! ${u.name} woke up ${ally.name}!`);
      }
    });

    checkSurroundKOs();
    if (u.location === "board") {
      if (u.owner === "p1" && targetNodeId === 3) {
        setLogText("Reached the Goal! WIN!");
        spawnPortalParticles(176, 185, "#facc15");
        state.winCelebrationAnim = { winner: "p1", t0: performance.now() };
        return;
      }
      if (u.owner === "p2" && targetNodeId === 10) {
        setLogText("Opponent reached your Goal!");
        spawnPortalParticles(176, 343, "#ef4444");
        state.winCelebrationAnim = { winner: "p2", t0: performance.now() };
        return;
      }
    }

    // 2. Authentic 2-Step Move-Then-Attack Choice (`02:09` & `03:45` in video!):
    // If human P1 moved next to >=1 enemy in local AI/Pass mode (and not via AI auto-play), let P1 choose which 🎯 target to attack or tap [End Turn ⏭️]!
    const liveAdjEnemies = [];
    if (u.location === "board") {
      (ADJ[targetNodeId] || []).forEach(nid => {
        const occ = unitAtNode(nid);
        if (occ && occ.owner !== u.owner) liveAdjEnemies.push(nid);
      });
    }

    if (!remotePacket && !state.aiExecutingNow && liveAdjEnemies.length > 0 && (state.mode !== "ai" || u.owner === "p1")) {
      state.postMoveAttackMode = true;
      state.selectedUnitId = u.uid;
      state.attackTargets = liveAdjEnemies;
      state.reachableNodes = [];
      state.pendingPostMoveTurn = { nextTurn: nextTurnVal, nextTurnCounter: nextCounterVal };
      setLogText(`Tap red target 🎯 to attack or tap [End Turn ⏭️]!`);
      return;
    }

    // Remote P2P or AI move with precomputed combat
    const combatData = remotePacket ? remotePacket.combat : precomputedCombat;
    if (combatData && u.location === "board") {
      const atkU = state.units.find(x => x.uid === combatData.atkUid);
      const defU = state.units.find(x => x.uid === combatData.defUid);
      if (atkU && defU && defU.location === "board") {
        setTimeout(() => {
          triggerCombat(atkU, defU, false, {
            atkSpin: combatData.atkSpin,
            defSpin: combatData.defSpin,
            nextTurn: remotePacket ? remotePacket.nextTurn : nextTurnVal,
            nextTurnCounter: remotePacket ? remotePacket.nextTurnCounter : nextCounterVal
          });
        }, 220);
        return;
      }
    }

    if (remotePacket) {
      if (remotePacket.awaitingPostMoveChoice && liveAdjEnemies.length > 0) {
        setLogText("⏳ Oponente posicionou peça e está decidindo o ataque...");
        return;
      }
      applyExplicitTurn(remotePacket.nextTurn, remotePacket.nextTurnCounter);
    } else {
      endTurn(false, nextTurnVal, nextCounterVal);
    }
  });
}

function rewindLastAction() {
  // Rewind desativado na v5.7.0 a pedido do jogador
}

function skipOrDemoTurn() {
  if (state.isAnimating || !canControlTurn()) return;
  const nextT = state.turn === "p1" ? "p2" : "p1";
  const nextC = Math.max(0, state.turnCounter - 1);
  if (state.mode === "p2p") {
    sendP2PPacket({ type: "StockGo", nextTurn: nextT, turnCounter: nextC });
  }
  endTurn(false, nextT, nextC);
}

function triggerPlayerAIMove() {
  if (state.isAnimating) return;
  if (state.postMoveAttackMode) {
    const sel = state.units.find(x => x.uid === state.selectedUnitId);
    const tNid = state.attackTargets[0];
    const occ = tNid !== undefined ? unitAtNode(tNid) : null;
    if (sel && occ) {
      const odds = computeDuelDbOdds(sel, occ);
      if (odds.win >= odds.loss) {
        onNodeClicked(tNid);
        return;
      }
    }
    finishPostMoveWithoutAttack();
    return;
  }
  const owner = state.turn;
  const oppGoalId = owner === "p1" ? 3 : 10;
  const myGoalId  = owner === "p1" ? 10 : 3;
  const oppEntryIds = owner === "p1" ? [0, 6] : [7, 13];
  const oppGoalNode = BOARD_NODES[oppGoalId];
  const myGoalNode  = BOARD_NODES[myGoalId];

  // Check if enemy is threatening our Goal Point within 70px
  const enemyThreateningGoal = state.units.some(u =>
    u.owner !== owner && u.location === "board" &&
    Math.hypot(BOARD_NODES[u.nodeId].x - myGoalNode.x, BOARD_NODES[u.nodeId].y - myGoalNode.y) < 75
  );

  const myUnits = state.units.filter(u => u.owner === owner && u.location !== "pc" && u.location !== "ultra_space" && u.waitTurns === 0);
  let best = null, bestScore = -99999;

  myUnits.forEach(u => {
    const res = computeReachableWithPaths(u);
    res.nodes.forEach(nid => {
      const n = BOARD_NODES[nid];
      let score = 500 - Math.hypot(n.x - oppGoalNode.x, n.y - oppGoalNode.y);
      if (nid === oppGoalId) score += 15000; // Instant Goal Win!
      if (enemyThreateningGoal && nid === myGoalId) score += 9000; // Defend Goal Point!
      if (oppEntryIds.includes(nid)) score += 420; // Entry Point Lockdown!
      if (u.location === "bench") score += 45;

      // Check Surround Kill & Duel DB Combat Odds at destination
      (ADJ[nid] || []).forEach(adjId => {
        const occ = unitAtNode(adjId);
        if (occ && occ.owner !== owner) {
          // Would moving to `nid` complete a Surround Kill on `occ`?
          // All neighbors of `occ` must be occupied by an enemy of `occ` (i.e. ally to `owner`)
          const otherNeighborsFilled = (ADJ[adjId] || []).every(nn => {
            if (nn === nid) return true;
            const o = unitAtNode(nn);
            return o !== null && o.owner === owner;
          });
          if (otherNeighborsFilled) score += 1800;
          const odds = computeDuelDbOdds(u, occ);
          score += (odds.win - odds.loss) * 2.2;
        }
      });

      if (score > bestScore) { bestScore = score; best = { uid: u.uid, nid, segs: res.paths[nid] }; }
    });
  });

  if (best) {
    const u = state.units.find(x => x.uid === best.uid);
    setLogText(`Carlo AI moved ${u.name} (Duel DB Eval).`);
    state.aiExecutingNow = true;
    executeMove(best.uid, best.nid, true, best.segs);
    state.aiExecutingNow = false;
  }
}




// ============================================================================
// CORNER DATA DISK & ABILITY CARD ENGINE (Discreto, Suave & Fiel ao Deck)
// ============================================================================
const FCC_EFFECT_LABELS = {
  push: "Empurrão",
  sleep: "Dormir",
  paralyze: "Paralisia",
  panic: "Confusão",
  badpoison: "Veneno Tóx.",
  poison: "Veneno",
  freeze: "Congelar",
  burn: "Queimar",
  ko: "Nocaute"
};

function drawCornerMiniDisk(canvasEl, segs) {
  if (!canvasEl) return;
  const ctx = canvasEl.getContext("2d");
  if (!ctx) return;
  const w = canvasEl.width, h = canvasEl.height;
  const cx = w / 2, cy = h / 2, r = (w / 2) - 4;
  ctx.clearRect(0, 0, w, h);

  const total = segs.reduce((a, s) => a + s.size, 0) || 96;
  let ang = -Math.PI / 2;
  const colMap = { white: "#f8fafc", gold: "#facc15", purple: "#c084fc", blue: "#38bdf8", red: "#ef4444" };

  ctx.save();
  // Outer ring
  ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.fillStyle = "#090d16"; ctx.fill();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.6)"; ctx.lineWidth = 1.5; ctx.stroke();

  segs.forEach(s => {
    const sl = (s.size / total) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, ang, ang + sl); ctx.closePath();
    ctx.fillStyle = colMap[s.color] || "#fff"; ctx.fill();
    ctx.strokeStyle = "#090d16"; ctx.lineWidth = 1.2; ctx.stroke();

    if (s.size >= 14) {
      const m = ang + sl / 2;
      const tx = cx + Math.cos(m) * (r * 0.62);
      const ty = cy + Math.sin(m) * (r * 0.62);
      ctx.fillStyle = "#090d16";
      ctx.font = "900 9.5px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (s.color === "purple") {
        ctx.fillText("★".repeat(Math.min(3, s.stars || 1)), tx, ty);
      } else if (s.dmg > 0) {
        ctx.fillText(String(s.dmg), tx, ty);
      }
    }
    ang += sl;
  });

  // Center hub
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = "#1e293b"; ctx.fill();
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}

function showCornerFigureCard(u) {
  if (!u) { hideCornerFigureCard(); return; }
  const card = document.getElementById("figure-corner-card");
  if (!card) return;

  const rEl = document.getElementById("fcc-rarity");
  if (rEl) {
    rEl.className = u.rarity === "UX" ? "ux-rainbow-badge" : (u.rarity === "EX" ? "ex-gold-badge" : "");
    rEl.textContent = u.rarity || "UC";
  }

  const nEl = document.getElementById("fcc-name");
  if (nEl) nEl.textContent = u.name;

  const mpEl = document.getElementById("fcc-mp");
  if (mpEl) {
    const effMp = typeof getEffectiveUnitMp === "function" ? getEffectiveUnitMp(u) : u.mp;
    mpEl.textContent = "MP " + effMp;
  }

  const canJump = typeof isFigurePassThroughOrJumper === "function" && isFigurePassThroughOrJumper(u);
  const jEl = document.getElementById("fcc-jump-badge");
  if (jEl) {
    jEl.style.background = canJump ? "#16a34a" : "#475569";
    jEl.style.color = canJump ? "#ffffff" : "#cbd5e1";
    const jumpsLbl = (typeof t === "function") ? t("jump.jumps", "🦘 PULA") : "🦘 PULA";
    const noJumpLbl = (typeof t === "function") ? t("jump.no_jump", "🚫 NÃO PULA") : "🚫 NÃO PULA";
    jEl.textContent = canJump ? jumpsLbl : noJumpLbl;
  }

  // Draw mini disk canvas
  const cvEl = document.getElementById("fcc-canvas");
  const segs = typeof getActiveWheel === "function" ? getActiveWheel(u) : (u.wheel || []);
  drawCornerMiniDisk(cvEl, segs);

  // Moves list (color, name, dmg / stars, effect)
  const mvEl = document.getElementById("fcc-moves");
  if (mvEl) {
    const colMap = { white: "#f8fafc", gold: "#facc15", purple: "#c084fc", blue: "#38bdf8", red: "#ef4444" };
    mvEl.innerHTML = segs.map(s => {
      let val = "";
      if (s.color === "purple") val = "★".repeat(s.stars || 1);
      else if (s.dmg > 0) val = String(s.dmg);
      else if (s.color === "blue") val = "Dodge";
      else if (s.color === "red") val = "Miss";

      let effBadge = "";
      if (s.effect && FCC_EFFECT_LABELS[s.effect]) {
        effBadge = `<span style="font-size:7px; color:#38bdf8; background:rgba(2,132,199,0.25); border-radius:2px; padding:0 3px;">${FCC_EFFECT_LABELS[s.effect]}</span>`;
      }

      return `
        <div class="fcc-move-row">
          <span style="display:flex; align-items:center; gap:2.5px; flex:1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">
            <span style="width:5px; height:5px; border-radius:1px; background:${colMap[s.color] || '#fff'}; display:inline-block; flex-shrink:0;"></span>
            <span style="color:#f1f5f9; font-weight:700; overflow:hidden; text-overflow:ellipsis;">${s.name}</span>
            ${effBadge}
          </span>
          <span style="color:#fde047; font-weight:900; margin-left:2px; flex-shrink:0;">${val}</span>
        </div>
      `;
    }).join("");
  }

  // Passive ability description
  const abEl = document.getElementById("fcc-ability-box");
  if (abEl) {
    const jumpDesc = (typeof t === "function") ? t("jump.jumps_desc", "🦘 PULA FIGURAS: Pode saltar por cima de outros Pokémon gastando 2 MP por salto.") : "🦘 PULA FIGURAS: Pode saltar por cima de outros Pokémon gastando 2 MP por salto.";
    const noJumpDesc = (typeof t === "function") ? t("jump.no_jump_desc", "🚫 MOVIMENTO TERRESTRE: Não pula outros Pokémon (bloqueado por peças adjacentes).") : "🚫 MOVIMENTO TERRESTRE: Não pula outros Pokémon (bloqueado por peças adjacentes).";
    const jumpNotice = canJump
      ? `<div style="margin-bottom:2px; font-weight:900; color:#4ade80; font-size:7.5px;">${jumpDesc}</div>`
      : `<div style="margin-bottom:2px; font-weight:800; color:#94a3b8; font-size:7.5px;">${noJumpDesc}</div>`;
    const abText = (typeof FIGURE_ABILITIES_DB !== "undefined" && (FIGURE_ABILITIES_DB[u.baseId] || FIGURE_ABILITIES_DB[u.id]))
      || u.ability || "Figura padrão Pokémon Duel.";
    abEl.innerHTML = `${jumpNotice}<strong style="color:#facc15;">Passiva:</strong> ${abText}`;
  }

  card.classList.add("visible");
}

function hideCornerFigureCard() {
  const card = document.getElementById("figure-corner-card");
  if (card) card.classList.remove("visible");
}

function dismissFigureCornerCard(e) {
  if (e) e.stopPropagation();
  hideCornerFigureCard();
  state.selectedUnitId = null;
  state.reachableNodes = [];
  state.reachablePaths = {};
  if (state.postMoveAttackMode) finishPostMoveWithoutAttack();
  playSfx("tick");
}

window.showCornerFigureCard = showCornerFigureCard;
window.hideCornerFigureCard = hideCornerFigureCard;
window.dismissFigureCornerCard = dismissFigureCornerCard;
