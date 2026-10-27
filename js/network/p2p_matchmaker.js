// ============================================================================
// WEBRTC GIT P2P ENGINE & DISTRIBUTED 8-SLOT SWARM MATCHMAKER
// ============================================================================
// ============================================================================
// 11. BULLETPROOF P2P ROOM MATCH ENGINE (PEERJS + MULTI-STUN + BROADCAST + SDP)
// ============================================================================
let peerInstance = null, peerConnObj = null, peerConn = null, dataChannel = null, broadcastChan = null;
let currentHostRoomCode = String(Math.floor(1000 + Math.random() * 9000));
let p2pPingTimer = null, lastPingSent = 0;

const PEER_ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" }
  ],
  iceCandidatePoolSize: 10
};

function updateP2PStatusUI(title, sub, badgeTxt, borderCol) {
  const b = document.getElementById("p2p-status-banner");
  const t = document.getElementById("p2p-status-title");
  const s = document.getElementById("p2p-status-sub");
  const p = document.getElementById("p2p-ping-badge");
  if (b && borderCol) b.style.borderColor = borderCol;
  if (t) { t.textContent = title; if (borderCol) t.style.color = borderCol; }
  if (s) s.textContent = sub;
  if (p && badgeTxt) {
    p.textContent = badgeTxt;
    p.style.borderColor = borderCol || "#475569";
    p.style.color = borderCol || "#94a3b8";
  }
}

function generateNewRoomCode() {
  currentHostRoomCode = String(Math.floor(1000 + Math.random() * 9000));
  const el = document.getElementById("host-room-code-display");
  if (el) el.textContent = currentHostRoomCode;
  return currentHostRoomCode;
}

function copyRoomCode() {
  if (navigator.clipboard) navigator.clipboard.writeText(currentHostRoomCode);
  updateP2PStatusUI("📋 Código " + currentHostRoomCode + " copiado!", "Envie este número de 4 dígitos para o Celular 2.", "COPIADO", "#facc15");
}

function appendTcpLog(line) {
  const el = document.getElementById("tcp-protocol-log");
  if (el) { el.textContent += "\n" + line; el.scrollTop = el.scrollHeight; }
}

function sendP2PPacket(payload) {
  const raw = JSON.stringify(payload);
  if (peerConnObj && peerConnObj.open) {
    try { peerConnObj.send(raw); } catch (e) {}
  }
  if (dataChannel && dataChannel.readyState === "open") {
    try { dataChannel.send(raw); } catch (e) {}
  }
  if (broadcastChan) {
    try { broadcastChan.postMessage(raw); } catch (e) {}
  }
}

function startP2PMatch(role) {
  state.mode = "p2p";
  state.gameMode = "p2p";
  state.matchKind = "p2p";
  state.myRole = role; // "p1" (Host) or "p2" (Guest)
  state.viewSeatOverride = null;
  state.turn = "p1";
  state.turnCounter = 300;
  state.isMatchActive = true;
  state.matchFinished = false;
  state.clockMsP1 = 300000;
  state.clockMsP2 = 300000;

  // Clean tutorial locks and animation state
  tutorialStepBusy = false;
  currentTutorialStep = 0;
  hideTutorialCoachHud();
  const tourHud = document.getElementById("tutorial-hub-tour-hud");
  if (tourHud) tourHud.style.display = "none";

  demoFullMatchState();
  playSfx("portal");
  closeDrawer();

  const isMine = (state.myRole === "p1");
  const sideLbl = isMine ? "P1 Azul · Sua Mesa Embaixo" : "P2 Vermelho · Sua Mesa Embaixo (Visão Oposta 180°)";
  setLogText(isMine ? `🟢 SUA VEZ! (${sideLbl}) Selecione uma figura no Banco.` : `⏳ Vez do Oponente P1... (${sideLbl}) Aguarde a jogada.`);
  state.turnBannerAnim = { turn: "p1", t0: performance.now() };
}

function startLocalPassAndPlayMatch() {
  state.mode = "pass";
  state.gameMode = "pass";
  state.matchKind = "pass";
  state.myRole = "p1";
  state.viewSeatOverride = null;
  state.turn = "p1";
  state.turnCounter = 300;

  tutorialStepBusy = false;
  currentTutorialStep = 0;
  hideTutorialCoachHud();
  const tourHud = document.getElementById("tutorial-hub-tour-hud");
  if (tourHud) tourHud.style.display = "none";

  demoFullMatchState();
  playSfx("portal");
  closeDrawer();

  setLogText("🔵 VEZ DO JOGADOR 1 (Azul · Embaixo) Selecione uma figura no Banco.");
  state.turnBannerAnim = { turn: "p1", t0: performance.now() };
}

function handleP2PPacket(raw) {
  try {
    let msg = raw;
    if (typeof raw === "string") {
      try { msg = JSON.parse(raw); } catch (e) { return; }
    }
    if (!msg || typeof msg !== "object" || !msg.type) return;
    lastPeerSignalTs = performance.now();
    if (msg.type === "P2P_FORFEIT") {
      const w = msg.winner || (state.myRole || "p1");
      if (p2pPingTimer) { clearInterval(p2pPingTimer); p2pPingTimer = null; }
      setLogText("🏆 O adversário desistiu (Forfeit)! Vitória por W.O.!");
      state.winCelebrationAnim = { winner: w, t0: performance.now() };
      return;
    }

    if (msg.type === "P2P_JOIN" || msg.type === "@login") {
      // Guest joined Host's room! Record real player and Host initializes fresh match & sends P2P_START
      if (msg.profile && typeof recordRealPlayerEncounter === "function") {
        try { recordRealPlayerEncounter(msg.profile); } catch (e) {}
      }
      if (state.myRole === "p1") {
        if (Array.isArray(msg.deckP2) && msg.deckP2.length === 6) {
          state.deckP2 = msg.deckP2;
        }
        const syncSeed = generateFreshSeed32();
        setSharedSeed(syncSeed);
        const hostProf = window.trainerProfileData || {};
        sendP2PPacket({
          type: "P2P_START",
          seed: syncSeed,
          deckP1: state.deckP1,
          deckP2: state.deckP2,
          profile: {
            nickname: hostProf.nickname || "Treinador P1",
            rankRating: hostProf.rankRating || 1200,
            leagueTier: hostProf.leagueTier || "Prata",
            trainerId: hostProf.trainerId || "100-200-300",
            deck: state.deckP1
          }
        });
        startP2PMatch("p1");
        updateP2PStatusUI("🟢 CONECTADO AO JOGADOR 2!", "Partida iniciada! Você é o Jogador 1 (Azul · Embaixo).", "ONLINE P1", "#4ade80");
      }
    } else if (msg.type === "P2P_START" || msg.type === "@enter") {
      // Guest receives authoritative match start from Host!
      if (msg.profile && typeof recordRealPlayerEncounter === "function") {
        try { recordRealPlayerEncounter(msg.profile); } catch (e) {}
      }
      if (msg.seed) setSharedSeed(msg.seed);
      if (Array.isArray(msg.deckP1) && msg.deckP1.length === 6) state.deckP1 = msg.deckP1;
      if (Array.isArray(msg.deckP2) && msg.deckP2.length === 6) state.deckP2 = msg.deckP2;
      startP2PMatch("p2");
      updateP2PStatusUI("🟢 CONECTADO AO HOST (P1)!", "Partida iniciada! Visão de Mesa Oposta (180°): seu time P2 está EMBAIXO olhando P1 de frente!", "ONLINE P2", "#4ade80");
    } else if (msg.type === "P2P_MOVE" || msg.type === "DoMove") {
      if (msg.seed) setSharedSeed(msg.seed);
      appendTcpLog(`< P2P_MOVE uid=${msg.uid} dest=${msg.targetNodeId}`);
      executeMove(msg.uid, msg.targetNodeId, false, msg.segs, msg);
    } else if (msg.type === "P2P_PLATE") {
      handleRemotePlatePacket(msg);
    } else if (msg.type === "Record") {
      const atk = state.units.find(u => u.uid === msg.atkUid);
      const def = state.units.find(u => u.uid === msg.defUid);
      if (atk && def) {
        triggerCombat(atk, def, false, {
          atkSpin: msg.atkSpin,
          defSpin: msg.defSpin,
          nextTurn: msg.nextTurn,
          nextTurnCounter: msg.nextTurnCounter
        });
      }
    } else if (msg.type === "StockGo") {
      applyExplicitTurn(msg.nextTurn, msg.turnCounter);
    } else if (msg.type === "PING") {
      sendP2PPacket({ type: "PONG", ts: msg.ts });
    } else if (msg.type === "PONG") {
      const rtt = Math.max(1, Math.round(performance.now() - (msg.ts || 0)));
      state.p2pLatency = rtt;
      const p = document.getElementById("p2p-ping-badge");
      if (p) p.textContent = `ONLINE · ${rtt}ms`;
    }
  } catch (e) {}
}

function handleRemotePlatePacket(msg) {
  if (!msg || !msg.plateId) return;
  if (state.plates) {
    const oppPlate = state.plates.find(p => p.id === msg.plateId && !p.used);
    if (oppPlate) oppPlate.used = true;
    if (typeof renderPlatesTray === "function") renderPlatesTray();
  }

  if (msg.plateId === "goalblock") {
    const targetUnit = state.units.find(u => u.uid === msg.unitUid);
    if (targetUnit) {
      targetUnit.location = "board";
      targetUnit.nodeId = msg.targetNodeId;
      targetUnit.waitTurns = 1;
      const nPos = getNodePos(msg.targetNodeId);
      spawnPortalParticles(nPos.x, nPos.y, "#38bdf8");
      playSfx("portal");
      setLogText(`🛡️ Oponente usou Goal Block: ${targetUnit.name} teleportado para defender o Goal Point (Wait 1)!`);
    }
    applyExplicitTurn(msg.nextTurn, msg.nextTurnCounter);
  } else if (msg.plateId === "pkmswitch") {
    const fUnit = state.units.find(u => u.uid === msg.unitUid);
    const bUnit = state.units.find(u => u.uid === msg.swapUid);
    if (fUnit && bUnit) {
      fUnit.location = "bench";
      fUnit.nodeId = null;
      if (typeof msg.benchSlot === "number") fUnit.benchSlot = msg.benchSlot;
      bUnit.location = "board";
      bUnit.nodeId = msg.targetNodeId;
      const nPos = getNodePos(msg.targetNodeId);
      spawnPortalParticles(nPos.x, nPos.y, "#38bdf8");
      playSfx("portal");
      setLogText(`⇄ Oponente usou Pokémon Switch: ${fUnit.name} trocado por ${bUnit.name}!`);
    }
    applyExplicitTurn(msg.nextTurn, msg.nextTurnCounter);
  } else if (msg.plateId === "revive") {
    const pcUnit = state.units.find(u => u.uid === msg.unitUid);
    if (pcUnit) {
      pcUnit.location = "bench";
      pcUnit.nodeId = null;
      pcUnit.waitTurns = 0;
      pcUnit.condition = PokemonCondition.Normal;
      playSfx("portal");
      setLogText(`💖 Oponente usou Max Revive: ${pcUnit.name} resgatado do P.C.!`);
    }
    applyExplicitTurn(msg.nextTurn, msg.nextTurnCounter);
  } else if (msg.plateId === "megaplate") {
    const unit = state.units.find(u => u.uid === msg.unitUid);
    if (unit) {
      if (!unit.name.startsWith("Mega ")) unit.name = "Mega " + unit.name;
      unit.megaTurns = 7;
      unit.mp = Math.min(3, (unit.baseMp || unit.mp) + 1);
      if (unit.location === "board" && unit.nodeId !== null) {
        const nPos = getNodePos(unit.nodeId);
        spawnPortalParticles(nPos.x, nPos.y, "#f472b6");
      }
      playSfx("portal");
      setLogText(`🧬 Oponente ativou Mega Plate: ${unit.name} [UX] (+20 DMG, +1★, MP ${unit.mp})!`);
    }
  } else if (msg.plateId === "xatk") {
    state.xAttackArmed = true;
    state.activePlate = "xatk";
    setLogText("⚔️ Oponente ativou X Attack (+30 DMG no combate deste turno)!");
  } else if (msg.plateId === "xspeed") {
    state.xSpeedArmed = true;
    state.activePlate = "xspeed";
    setLogText("⚡ Oponente ativou X Speed (White ➔ Gold neste combate)!");
  } else if (msg.plateId === "double") {
    state.doubleChanceArmed = true;
    state.activePlate = "double";
    setLogText("🎲 Oponente ativou Double Chance!");
  } else if (msg.plateId === "hurdle") {
    state.abilityJumpActive = true;
    state.activePlate = "hurdle";
    setLogText("🦘 Oponente ativou Hurdle Jump!");
  }
}
window.handleRemotePlatePacket = handleRemotePlatePacket;

function cleanupActiveP2PSession(reason) {
  if (p2pPingTimer) {
    clearInterval(p2pPingTimer);
    p2pPingTimer = null;
  }
  if (peerConnObj) {
    try { peerConnObj.close(); } catch(e) {}
    peerConnObj = null;
  }
  if (dataChannel) {
    try { dataChannel.close(); } catch(e) {}
    dataChannel = null;
  }
  if (peerConn) {
    try { peerConn.close(); } catch(e) {}
    peerConn = null;
  }
  if (peerInstance) {
    try { peerInstance.destroy(); } catch(e) {}
    peerInstance = null;
  }
  if (broadcastChan) {
    try { broadcastChan.close(); } catch(e) {}
    broadcastChan = null;
  }
  state.isMatchActive = false;
  state.matchFinished = true;
  state.mode = "ai";
  state.gameMode = "ai";
  state.matchKind = "league";
  state.myRole = "p1";
  state.viewSeatOverride = null;
  state.p2pLatency = null;
  state.winCelebrationAnim = null;
  state.pendingPlateAction = null;
  remoteOpponentProfile = null;
  updateP2PStatusUI("⚪ SALA FECHADA", "Nenhuma sala ativa. Crie ou entre em uma sala para jogar online.", "OFFLINE", "#94a3b8");
  if (reason) appendTcpLog(`[P2P] Sessão encerrada: ${reason}`);
}
window.cleanupActiveP2PSession = cleanupActiveP2PSession;

let lastPeerSignalTs = performance.now();

function triggerVoluntaryForfeit() {
  if (state.winCelebrationAnim) return;
  const forfeiter = getBottomRole();
  const winner = forfeiter === "p1" ? "p2" : "p1";
  playSfx("hit");
  if (state.mode === "p2p") {
    sendP2PPacket({ type: "P2P_FORFEIT", loser: forfeiter, winner });
  }
  if (p2pPingTimer) { clearInterval(p2pPingTimer); p2pPingTimer = null; }
  state.isMatchActive = false;
  state.matchFinished = true;
  setLogText(`🏳️ Desistência (Forfeit)! Vitória por W.O. para ${winner.toUpperCase()}!`);
  state.winCelebrationAnim = { winner, t0: performance.now() };
}

function startP2PHeartbeat() {
  lastPeerSignalTs = performance.now();
  if (p2pPingTimer) clearInterval(p2pPingTimer);
  p2pPingTimer = setInterval(() => {
    if (state.mode !== "p2p" || !state.isMatchActive || state.matchFinished) {
      clearInterval(p2pPingTimer);
      p2pPingTimer = null;
      return;
    }
    const now = performance.now();
    lastPingSent = now;
    sendP2PPacket({ type: "PING", ts: lastPingSent });
    // 30-second WebRTC signal loss detection -> automatic W.O. victory ONLY during active match!
    if (!state.winCelebrationAnim && state.isMatchActive && !state.matchFinished && (now - lastPeerSignalTs > 30000)) {
      const woWinner = state.myRole || "p1";
      setLogText("🏆 VITÓRIA POR W.O.! Sinal WebRTC do adversário perdido por >30s!");
      if (p2pPingTimer) { clearInterval(p2pPingTimer); p2pPingTimer = null; }
      state.isMatchActive = false;
      state.matchFinished = true;
      state.winCelebrationAnim = { winner: woWinner, t0: now };
      if (peerConnObj) { try { peerConnObj.close(); } catch(e){} peerConnObj = null; }
      if (dataChannel) { try { dataChannel.close(); } catch(e){} dataChannel = null; }
      if (broadcastChan) { try { broadcastChan.close(); } catch(e){} broadcastChan = null; }
    }
  }, 2000);
}

function createIntuitiveP2PRoom() {
  ensureAudio();
  const code = (document.getElementById("host-room-code-display").textContent.trim() === "----")
    ? generateNewRoomCode()
    : document.getElementById("host-room-code-display").textContent.trim();

  state.myRole = "p1";
  state.mode = "p2p";
  updateP2PStatusUI(
    `🟡 ABRINDO SALA [ ${code} ]...`,
    `Peça para o Celular 2 digitar ${code} em "Celular 2 (Entrar)" e tocar em Conectar!`,
    `SALA ${code}`,
    "#facc15"
  );

  // 1. Same-device / Same-browser BroadcastChannel instant link
  if ("BroadcastChannel" in window) {
    if (broadcastChan) broadcastChan.close();
    broadcastChan = new BroadcastChannel("monaco_p2p_" + code);
    broadcastChan.onmessage = e => handleP2PPacket(e.data);
  }

  // 2. PeerJS Cloud Signaling for 2 separate phones over Wi-Fi / 4G / 5G
  if (window.Peer) {
    try {
      if (peerInstance) peerInstance.destroy();
      const peerId = "pdr-duel-room-" + code.toLowerCase();
      peerInstance = new Peer(peerId, { config: PEER_ICE_CONFIG, debug: 1 });
      peerInstance.on("open", id => {
        appendTcpLog(`[Host] Sala ${code} online (${id}). Aguardando Convidado...`);
        updateP2PStatusUI(
          `🟢 SALA [ ${code} ] ABERTA! AGUARDANDO JOGADOR 2...`,
          `No Celular 2, digite o código ${code} e toque em "2. CONECTAR E JOGAR"!`,
          `AGUARDANDO`,
          "#4ade80"
        );
      });
      peerInstance.on("connection", c => {
        appendTcpLog(`[Host] Convidado conectando...`);
        attachPeerJSConn(c);
      });
      peerInstance.on("error", err => {
        appendTcpLog(`[PeerJS Status] ${err.type || err.message}`);
        if (err && err.type === "unavailable-id") {
          // Room code was still cached on signaling server; generate a fresh 4-digit code automatically!
          const fresh = generateNewRoomCode();
          setTimeout(createIntuitiveP2PRoom, 350);
        }
      });
    } catch (e) {}
  }
}

function joinIntuitiveP2PRoom() {
  ensureAudio();
  const inputEl = document.getElementById("room-code-input");
  const code = (inputEl ? inputEl.value.trim() : "").toUpperCase();
  if (!code) {
    updateP2PStatusUI("⚠️ DIGITE O CÓDIGO DA SALA!", "Digite no campo vermelho os 4 números que aparecem no Celular 1.", "FALTA CÓDIGO", "#f87171");
    if (inputEl) inputEl.focus();
    return;
  }

  state.myRole = "p2";
  state.mode = "p2p";
  updateP2PStatusUI(
    `🟡 CONECTANDO À SALA [ ${code} ]...`,
    `Localizando o Celular 1 e sincronizando tabuleiro...`,
    `CONECTANDO`,
    "#facc15"
  );

  // 1. BroadcastChannel link (if testing across tabs/windows)
  if ("BroadcastChannel" in window) {
    if (broadcastChan) broadcastChan.close();
    broadcastChan = new BroadcastChannel("monaco_p2p_" + code);
    broadcastChan.onmessage = e => handleP2PPacket(e.data);
    sendP2PPacket({ type: "P2P_JOIN", deckP2: state.deckP1, trainer: "Luca" });
  }

  // 2. PeerJS Cloud connection to `pdr-duel-room-<code>`
  if (window.Peer) {
    try {
      if (peerInstance) peerInstance.destroy();
      peerInstance = new Peer(undefined, { config: PEER_ICE_CONFIG, debug: 1 });
      peerInstance.on("open", id => {
        const targetId = "pdr-duel-room-" + code.toLowerCase();
        appendTcpLog(`[Guest] Conectando a ${targetId}...`);
        const c = peerInstance.connect(targetId, { reliable: true, serialization: "json" });
        attachPeerJSConn(c);
      });
      peerInstance.on("error", err => {
        appendTcpLog(`[PeerJS Erro] ${err.type || err.message}`);
        updateP2PStatusUI(
          `❌ Não encontrou a Sala [ ${code} ]`,
          `Verifique se o Celular 1 já tocou em "1. ABRIR SALA P2P" e se os dois estão com internet ativa.`,
          `ERRO`,
          "#f87171"
        );
      });
    } catch (e) {}
  }
}

function attachPeerJSConn(c) {
  if (!c) return;
  peerConnObj = c;
  c.on("open", () => {
    appendTcpLog(`[P2P] Canal WebRTC aberto (${state.myRole.toUpperCase()})!`);
    startP2PHeartbeat();
    if (state.myRole === "p2") {
      // Guest immediately announces join with their deck and profile!
      const guestProf = window.trainerProfileData || {};
      sendP2PPacket({
        type: "P2P_JOIN",
        deckP2: state.deckP1,
        trainer: guestProf.nickname || "Luca",
        profile: {
          nickname: guestProf.nickname || "Treinador P2",
          rankRating: guestProf.rankRating || 1200,
          leagueTier: guestProf.leagueTier || "Prata",
          trainerId: guestProf.trainerId || "200-300-400",
          deck: state.deckP1
        }
      });
    }
  });
  c.on("data", data => handleP2PPacket(data));
  c.on("close", () => {
    updateP2PStatusUI("⚠️ Conexão P2P encerrada", "O outro jogador desconectou.", "OFFLINE", "#f87171");
    appendTcpLog("[P2P] Conexão encerrada.");
  });
  c.on("error", err => {
    appendTcpLog(`[P2P Erro Canal] ${err ? (err.message || err.type || err) : "desconhecido"}`);
  });
}

function setupDataChannelEvents(dc) {
  dataChannel = dc;
  dc.onopen = () => {
    state.mode = "p2p";
    startP2PHeartbeat();
    if (state.myRole === "p2") {
      const guestProf = window.trainerProfileData || {};
      sendP2PPacket({
        type: "P2P_JOIN",
        deckP2: state.deckP1,
        trainer: guestProf.nickname || "Luca",
        profile: {
          nickname: guestProf.nickname || "Treinador P2",
          rankRating: guestProf.rankRating || 1200,
          leagueTier: guestProf.leagueTier || "Prata",
          trainerId: guestProf.trainerId || "200-300-400",
          deck: state.deckP1
        }
      });
    }
  };
  dc.onmessage = e => handleP2PPacket(e.data);
}

async function createWebRTCOffer() {
  state.myRole = "p1";
  peerConn = new RTCPeerConnection(PEER_ICE_CONFIG);
  setupDataChannelEvents(peerConn.createDataChannel("pdr_p2p", { ordered:true }));
  peerConn.onicecandidate = e => {
    if (!e.candidate && peerConn.localDescription) document.getElementById("sdp-box").value = btoa(JSON.stringify(peerConn.localDescription));
  };
  await peerConn.setLocalDescription(await peerConn.createOffer());
  setTimeout(() => { if (peerConn.localDescription) document.getElementById("sdp-box").value = btoa(JSON.stringify(peerConn.localDescription)); }, 600);
}
async function acceptWebRTCOffer() {
  const raw = document.getElementById("sdp-box").value.trim();
  if (!raw) return;
  state.myRole = "p2";
  peerConn = new RTCPeerConnection(PEER_ICE_CONFIG);
  peerConn.ondatachannel = e => setupDataChannelEvents(e.channel);
  peerConn.onicecandidate = e => {
    if (!e.candidate && peerConn.localDescription) document.getElementById("sdp-box").value = btoa(JSON.stringify(peerConn.localDescription));
  };
  await peerConn.setRemoteDescription(JSON.parse(atob(raw)));
  await peerConn.setLocalDescription(await peerConn.createAnswer());
  setTimeout(() => { if (peerConn.localDescription) document.getElementById("sdp-box").value = btoa(JSON.stringify(peerConn.localDescription)); }, 600);
}
async function finalizeWebRTCAnswer() {
  const raw = document.getElementById("sdp-box").value.trim();
  if (raw && peerConn) await peerConn.setRemoteDescription(JSON.parse(atob(raw)));
}
function copySdpToken() {
  const el = document.getElementById("sdp-box"); el.select();
  if (navigator.clipboard) navigator.clipboard.writeText(el.value);
}
function setGameMode(m) { state.mode = m; demoFullMatchState(); }
function runLiveInAppUpdate() {
  setLogText("Updated to v2.3.0 (P2P Room Match Fix)!");
  playSfx("portal");
  closeDrawer();
}



// ============================================================================
// 18. GLOBAL SALÃO & P2P MATCHMAKER ENGINE (REAL-TIME COMMUNITY HALL & QUEUE)
// ============================================================================
// (RANKED_BOT_TRAINERS loaded from js/data/bots.js)

window.windowCurrentSelectedBot = null;
let rankedMatchmakerInterval = null;
let rankedMatchmakerElapsed = 0;
let rankedMatchmakerChannel = null;
let rankedMatchmakerMatched = false;
let isSearchingRankedQueue = false;
let salaoQueueSessionId = null;

const SALAO_BROKER_URLS = [
  "wss://broker.emqx.io:8084/mqtt",
  "wss://broker.hivemq.com:8884/mqtt"
];
const SALAO_TOPIC = "pokeduel/v600/salao";

let salaoWs = null;
let salaoConnected = false;
let salaoBrokerIdx = 0;
let salaoPresenceTimer = null;
let salaoQueueTimer = null;
const salaoKnownTrainers = new Map();

function getMyUniquePeerId() {
  const p = window.trainerProfileData || {};
  const tid = String(p.trainerId || "trainer").replace(/[^a-zA-Z0-9]/g, "");
  if (!window._myP2PPeerId) {
    window._myP2PPeerId = `pdr-t-${tid}-${Math.random().toString(36).slice(2, 7)}`;
  }
  return window._myP2PPeerId;
}

function ensureMyPeerInstance(cb) {
  const id = getMyUniquePeerId();
  if (peerInstance && !peerInstance.destroyed && peerInstance.id === id) {
    if (cb) cb(id);
    return;
  }
  if (peerInstance) {
    try { peerInstance.destroy(); } catch (e) {}
    peerInstance = null;
  }
  try {
    peerInstance = new Peer(id, { config: PEER_ICE_CONFIG, debug: 0 });
    peerInstance.on("open", openId => {
      window._myP2PPeerId = openId;
      appendTcpLog(`[PeerJS] Peer ID ativo: ${openId}`);
      if (cb) cb(openId);
    });
    peerInstance.on("connection", c => {
      appendTcpLog(`[PeerJS] Conexão P2P recebida de oponente!`);
      attachPeerJSConn(c);
    });
    peerInstance.on("error", err => {
      appendTcpLog(`[PeerJS] Erro: ${err ? (err.type || err.message) : "desconhecido"}`);
    });
  } catch (e) {
    if (cb) cb(id);
  }
}

function encodeMqttRemainingLength(len) {
  const bytes = [];
  do {
    let b = len % 128;
    len = Math.floor(len / 128);
    if (len > 0) b |= 0x80;
    bytes.push(b);
  } while (len > 0);
  return bytes;
}

function sendMqttConnect(ws, clientId) {
  const proto = [0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x02, 0x00, 0x3c];
  const idBytes = new TextEncoder().encode(clientId);
  const payload = [idBytes.length >> 8, idBytes.length & 0xff, ...idBytes];
  const varHeaderAndPayload = [...proto, ...payload];
  const remLen = encodeMqttRemainingLength(varHeaderAndPayload.length);
  ws.send(new Uint8Array([0x10, ...remLen, ...varHeaderAndPayload]));
}

function sendMqttSubscribe(ws, topic) {
  const topBytes = new TextEncoder().encode(topic);
  const body = [0x00, 0x01, topBytes.length >> 8, topBytes.length & 0xff, ...topBytes, 0x00];
  const remLen = encodeMqttRemainingLength(body.length);
  ws.send(new Uint8Array([0x82, ...remLen, ...body]));
}

function publishSalaoPacket(msgObj) {
  if (salaoWs && salaoWs.readyState === WebSocket.OPEN && salaoConnected) {
    try {
      const topBytes = new TextEncoder().encode(SALAO_TOPIC);
      const msgBytes = new TextEncoder().encode(JSON.stringify(msgObj));
      const body = [topBytes.length >> 8, topBytes.length & 0xff, ...topBytes, ...msgBytes];
      const remLen = encodeMqttRemainingLength(body.length);
      salaoWs.send(new Uint8Array([0x30, ...remLen, ...body]));
    } catch (e) {}
  }
  if (rankedMatchmakerChannel) {
    try {
      rankedMatchmakerChannel.postMessage(msgObj);
    } catch (e) {}
  }
}

function updateSalaoCountUI() {
  const now = Date.now();
  for (const [id, data] of salaoKnownTrainers.entries()) {
    if (now - data.lastSeen > 28000) {
      salaoKnownTrainers.delete(id);
    }
  }
  const count = Math.max(1, salaoKnownTrainers.size + 1);
  const lbl = document.getElementById("salao-count-label");
  if (lbl) {
    lbl.textContent = `Salão Carmonte: ${count} Treinador${count > 1 ? "es" : ""} Online`;
  }
}

function sendSalaoPresencePing() {
  const p = window.trainerProfileData || {};
  publishSalaoPacket({
    type: "SALAO_PRESENCE",
    trainerId: p.trainerId || "guest",
    nickname: p.nickname || "Treinador",
    avatar: p.avatar || "pikachu",
    rating: p.rankRating || 1000,
    time: Date.now()
  });
}

function startSalaoPresenceHeartbeat() {
  if (salaoPresenceTimer) clearInterval(salaoPresenceTimer);
  sendSalaoPresencePing();
  salaoPresenceTimer = setInterval(sendSalaoPresencePing, 8000);
}

function connectToGlobalSalao() {
  if (salaoWs && (salaoWs.readyState === WebSocket.OPEN || salaoWs.readyState === WebSocket.CONNECTING)) {
    return;
  }
  const brokerUrl = SALAO_BROKER_URLS[salaoBrokerIdx % SALAO_BROKER_URLS.length];
  try {
    salaoWs = new WebSocket(brokerUrl, ["mqtt"]);
    salaoWs.binaryType = "arraybuffer";

    salaoWs.addEventListener("open", () => {
      const clientId = "pdr_" + Math.random().toString(36).slice(2, 9);
      sendMqttConnect(salaoWs, clientId);
    });

    salaoWs.addEventListener("message", ev => {
      const buf = new Uint8Array(ev.data);
      const type = buf[0] >> 4;
      if (type === 2) { // CONNACK
        salaoConnected = true;
        sendMqttSubscribe(salaoWs, SALAO_TOPIC);
        startSalaoPresenceHeartbeat();
        updateSalaoCountUI();
      } else if (type === 3) { // PUBLISH
        let offset = 1;
        let multiplier = 1;
        let remLen = 0;
        let digit;
        do {
          digit = buf[offset++];
          remLen += (digit & 127) * multiplier;
          multiplier *= 128;
        } while ((digit & 128) !== 0);

        const topicLen = (buf[offset] << 8) | buf[offset + 1];
        offset += 2 + topicLen;
        const payloadBytes = buf.subarray(offset);
        const payloadStr = new TextDecoder().decode(payloadBytes);
        try {
          const parsed = JSON.parse(payloadStr);
          handleIncomingSalaoMessage(parsed);
        } catch (e) {}
      }
    });

    salaoWs.addEventListener("error", () => {
      salaoConnected = false;
      salaoBrokerIdx++;
      setTimeout(connectToGlobalSalao, 3000);
    });

    salaoWs.addEventListener("close", () => {
      salaoConnected = false;
      setTimeout(connectToGlobalSalao, 4000);
    });
  } catch (e) {
    salaoBrokerIdx++;
    setTimeout(connectToGlobalSalao, 3000);
  }
}

function handleIncomingSalaoMessage(msg) {
  if (!msg || typeof msg !== "object" || !msg.type) return;
  const p = window.trainerProfileData || { trainerId: "948-204-182", nickname: "Treinador", rankRating: 1000, leagueTier: "Beginner" };

  // 1. Presence Heartbeat
  if (msg.type === "SALAO_PRESENCE" && msg.trainerId) {
    if (msg.trainerId !== p.trainerId) {
      salaoKnownTrainers.set(msg.trainerId, {
        nickname: msg.nickname,
        rating: msg.rating,
        avatar: msg.avatar,
        lastSeen: Date.now()
      });
      updateSalaoCountUI();
    }
    return;
  }

  // 2. Queue Search (Someone looking for a match)
  if (msg.type === "SALAO_QUEUE_PING") {
    if (msg.fromTrainerId && msg.fromTrainerId !== p.trainerId) {
      salaoKnownTrainers.set(msg.fromTrainerId, {
        nickname: msg.nickname,
        rating: msg.rankRating,
        lastSeen: Date.now()
      });
      updateSalaoCountUI();

      if (isSearchingRankedQueue && !rankedMatchmakerMatched) {
        const myKey = String(p.trainerId || "") + String(salaoQueueSessionId || "");
        const oppKey = String(msg.fromTrainerId || "") + String(msg.queueSession || "");

        // Deterministic role: smaller ID acts as Host (P1) and offers match
        if (myKey < oppKey) {
          const myPeerId = getMyUniquePeerId();
          ensureMyPeerInstance();
          publishSalaoPacket({
            type: "SALAO_MATCH_OFFER",
            toTrainerId: msg.fromTrainerId,
            fromTrainerId: p.trainerId,
            hostPeerId: myPeerId,
            hostNickname: p.nickname || "Você",
            hostRating: p.rankRating || 1000,
            hostTier: p.leagueTier || "Liga Carmonte",
            hostDeck: state.deckP1
          });
        }
      }
    }
    return;
  }

  // 3. Match Offer (Guest receives offer from Host)
  if (msg.type === "SALAO_MATCH_OFFER" && msg.toTrainerId === p.trainerId) {
    if (isSearchingRankedQueue && !rankedMatchmakerMatched) {
      rankedMatchmakerMatched = true;
      isSearchingRankedQueue = false;

      const myPeerId = getMyUniquePeerId();
      publishSalaoPacket({
        type: "SALAO_MATCH_ACCEPT",
        toTrainerId: msg.fromTrainerId,
        fromTrainerId: p.trainerId,
        guestPeerId: myPeerId,
        guestNickname: p.nickname || "Você",
        guestRating: p.rankRating || 1000,
        guestTier: p.leagueTier || "Liga Carmonte",
        guestDeck: state.deckP1
      });

      // Connect via PeerJS to Host
      ensureMyPeerInstance(id => {
        try {
          const c = peerInstance.connect(msg.hostPeerId, { reliable: true, serialization: "json" });
          attachPeerJSConn(c);
        } catch (e) {}
      });

      onHumanMatchFound({
        nickname: msg.hostNickname,
        rankRating: msg.hostRating,
        leagueTier: msg.hostTier,
        deck: msg.hostDeck,
        role: "p2"
      });
    }
    return;
  }

  // 4. Match Accept (Host receives accept from Guest)
  if (msg.type === "SALAO_MATCH_ACCEPT" && msg.toTrainerId === p.trainerId) {
    if (isSearchingRankedQueue && !rankedMatchmakerMatched) {
      rankedMatchmakerMatched = true;
      isSearchingRankedQueue = false;

      onHumanMatchFound({
        nickname: msg.guestNickname,
        rankRating: msg.guestRating,
        leagueTier: msg.guestTier,
        deck: msg.guestDeck,
        role: "p1"
      });
    }
    return;
  }

  // 5. Queue Leave
  if (msg.type === "SALAO_QUEUE_LEAVE") {
    // A player left the queue
    return;
  }
}

function cleanupRankedMatchmaker(preserveActiveConn) {
  isSearchingRankedQueue = false;
  if (rankedMatchmakerInterval) {
    clearInterval(rankedMatchmakerInterval);
    rankedMatchmakerInterval = null;
  }
  if (salaoQueueTimer) {
    clearInterval(salaoQueueTimer);
    salaoQueueTimer = null;
  }
  if (rankedMatchmakerChannel) {
    try { rankedMatchmakerChannel.close(); } catch (e) {}
    rankedMatchmakerChannel = null;
  }
}

window.addEventListener("beforeunload", () => {
  cleanupRankedMatchmaker(false);
  cleanupActiveP2PSession("Página fechada");
});

function openRankedMatchmakerModal() {
  hideTutorialCoachHud();
  cleanupRankedMatchmaker(false);
  rankedMatchmakerMatched = false;
  rankedMatchmakerElapsed = 0;
  isSearchingRankedQueue = true;
  salaoQueueSessionId = Math.random().toString(36).slice(2, 8);

  const modal = document.getElementById("ranked-matchmaker-modal");
  if (!modal) {
    startLeagueRankedMatchFallbackBot();
    return;
  }

  // Populate Player Details
  const p = window.trainerProfileData || { nickname: "Treinador", rankRating: 1000, leagueTier: "Beginner", avatar: "pikachu" };
  const avEl = document.getElementById("mm-player-avatar");
  const nmEl = document.getElementById("mm-player-name");
  const eloEl = document.getElementById("mm-player-elo");
  const tDisp = document.getElementById("mm-timer-display");
  const pBar = document.getElementById("mm-progress-bar");
  const lLog = document.getElementById("mm-live-log");
  const stSub = document.getElementById("mm-status-sub");
  const stTitle = document.getElementById("mm-status-title");

  const sp = AUTHENTIC_FIG_SPRITES[p.avatar] || AUTHENTIC_FIG_SPRITES["pikachu"];
  if (avEl) avEl.src = sp ? sp.uri : "";
  if (nmEl) nmEl.textContent = p.nickname || "Você";
  if (eloEl) eloEl.textContent = `${p.rankRating} ELO · ${p.leagueTier || 'Liga Carmonte'}`;
  if (tDisp) tDisp.textContent = "00:00 / 00:30";
  if (pBar) pBar.style.width = "0%";
  if (lLog) lLog.textContent = "📡 Conectado ao Salão Global · Procurando rival na fila...";
  if (stSub) stSub.textContent = "Buscando oponentes reais conectados ao Salão da Liga...";
  if (stTitle) {
    stTitle.textContent = "BUSCANDO ADVERSÁRIO ONLINE";
    stTitle.style.color = "#fde047";
  }

  modal.style.display = "flex";
  playSfx("portal");

  connectToGlobalSalao();
  ensureMyPeerInstance();

  // Local BroadcastChannel for instant testing across 2 tabs on the same device
  try {
    if (typeof BroadcastChannel !== "undefined") {
      if (rankedMatchmakerChannel) rankedMatchmakerChannel.close();
      rankedMatchmakerChannel = new BroadcastChannel("pokeduel_v600_salao");
      rankedMatchmakerChannel.onmessage = ev => {
        if (ev && ev.data) handleIncomingSalaoMessage(ev.data);
      };
    }
  } catch (e) {}

  function sendQueuePing() {
    if (!isSearchingRankedQueue || rankedMatchmakerMatched) return;
    const myPeerId = getMyUniquePeerId();
    publishSalaoPacket({
      type: "SALAO_QUEUE_PING",
      fromTrainerId: p.trainerId,
      fromPeerId: myPeerId,
      nickname: p.nickname,
      rankRating: p.rankRating || 1000,
      leagueTier: p.leagueTier || "Liga Carmonte",
      deck: state.deckP1,
      queueSession: salaoQueueSessionId,
      time: Date.now()
    });
  }

  sendQueuePing();
  if (salaoQueueTimer) clearInterval(salaoQueueTimer);
  salaoQueueTimer = setInterval(sendQueuePing, 1200);

  if (rankedMatchmakerInterval) clearInterval(rankedMatchmakerInterval);
  rankedMatchmakerInterval = setInterval(() => {
    if (rankedMatchmakerMatched) {
      clearInterval(rankedMatchmakerInterval);
      return;
    }
    rankedMatchmakerElapsed++;
    const secStr = rankedMatchmakerElapsed < 10 ? `0${rankedMatchmakerElapsed}` : `${rankedMatchmakerElapsed}`;
    if (tDisp) tDisp.textContent = `00:${secStr} / 00:30`;
    if (pBar) pBar.style.width = `${Math.min(100, (rankedMatchmakerElapsed / 30) * 100)}%`;

    if (lLog) {
      if (rankedMatchmakerElapsed < 8) {
        lLog.textContent = "📡 Sincronizando com a rede do Salão Global...";
      } else if (rankedMatchmakerElapsed < 18) {
        lLog.textContent = "⚡ Varrendo oponentes na fila de matchmaking...";
      } else if (rankedMatchmakerElapsed < 28) {
        lLog.textContent = "🌐 Otimizando canal P2P WebRTC de baixa latência...";
      } else {
        lLog.textContent = "⏱️ 30s atingidos! Nenhum oponente entrou na fila.";
      }
    }

    if (rankedMatchmakerElapsed >= 30) {
      clearInterval(rankedMatchmakerInterval);
      triggerBotFallbackTimeout();
    }
  }, 1000);
}

function cancelRankedMatchmaking() {
  isSearchingRankedQueue = false;
  rankedMatchmakerMatched = false;
  cleanupRankedMatchmaker(false);
  const p = window.trainerProfileData || {};
  publishSalaoPacket({
    type: "SALAO_QUEUE_LEAVE",
    fromTrainerId: p.trainerId
  });
  const modal = document.getElementById("ranked-matchmaker-modal");
  if (modal) modal.style.display = "none";
  playSfx("tick");
  setLogText("Matchmaking cancelado.");
}

function onHumanMatchFound(oppData) {
  cleanupRankedMatchmaker(true);
  rankedMatchmakerMatched = true;
  playSfx("level_up");
  if (typeof BgmEngine !== "undefined") BgmEngine.playFanfare("booster");

  // Save encountered human player to the real-player global leaderboard
  if (typeof recordRealPlayerEncounter === "function") {
    try { recordRealPlayerEncounter(oppData); } catch (e) {}
  }

  const stTitle = document.getElementById("mm-status-title");
  const stSub = document.getElementById("mm-status-sub");
  const lLog = document.getElementById("mm-live-log");
  if (stTitle) {
    stTitle.textContent = "🎉 ADVERSÁRIO ENCONTRADO!";
    stTitle.style.color = "#4ade80";
  }
  if (stSub) stSub.textContent = `${oppData.nickname} (${oppData.rankRating} ELO · ${oppData.leagueTier})`;
  if (lLog) lLog.textContent = `⚡ Conectando via Git P2P WebRTC (<15ms Delay)...`;

  remoteOpponentProfile = {
    nickname: oppData.nickname,
    rankRating: oppData.rankRating,
    leagueTier: oppData.leagueTier,
    isBot: false
  };
  state.deckP2 = oppData.deck || state.deckP2;
  state.mode = "p2p";
  state.myRole = oppData.role || "p1";

  setTimeout(() => {
    launchMatchFromMatchmaker(false);
  }, 850);
}

function triggerBotFallbackNow() {
  if (rankedMatchmakerMatched) return;
  cleanupRankedMatchmaker(false);
  rankedMatchmakerMatched = true;

  const p = window.trainerProfileData || { rankRating: 1000 };
  const pRating = p.rankRating || 1000;
  
  const sorted = [...RANKED_BOT_TRAINERS].sort((a, b) => Math.abs(a.rating - pRating) - Math.abs(b.rating - pRating));
  const botCandidates = sorted.slice(0, 3);
  const selectedBot = botCandidates[Math.floor(Math.random() * botCandidates.length)] || RANKED_BOT_TRAINERS[0];
  windowCurrentSelectedBot = selectedBot;

  playSfx("level_up");
  if (typeof BgmEngine !== "undefined") BgmEngine.playFanfare("booster");

  const stTitle = document.getElementById("mm-status-title");
  const stSub = document.getElementById("mm-status-sub");
  const lLog = document.getElementById("mm-live-log");
  const pBar = document.getElementById("mm-progress-bar");
  if (pBar) pBar.style.width = "100%";
  if (stTitle) {
    stTitle.textContent = "🤖 BOT DA LIGA SELECIONADO";
    stTitle.style.color = "#38bdf8";
  }
  if (stSub) stSub.textContent = `${selectedBot.name} (${selectedBot.rating} ELO · ${selectedBot.tier})`;
  if (lLog) lLog.textContent = `⚔️ ${selectedBot.title} — Iniciando partida de treino da Liga!`;

  remoteOpponentProfile = {
    nickname: selectedBot.name,
    rankRating: selectedBot.rating,
    leagueTier: selectedBot.tier,
    title: selectedBot.title,
    avatar: selectedBot.avatar,
    isBot: true
  };
  state.deckP2 = [...selectedBot.deck];
  window.adaptiveAIOpponentName = selectedBot.name;

  setTimeout(() => {
    launchMatchFromMatchmaker(true);
  }, 950);
}

function triggerBotFallbackTimeout() {
  const stTitle = document.getElementById("mm-status-title");
  const stSub = document.getElementById("mm-status-sub");
  const lLog = document.getElementById("mm-live-log");
  const pBar = document.getElementById("mm-progress-bar");
  if (pBar) pBar.style.width = "100%";
  if (stTitle) {
    stTitle.textContent = "FILA NO SALÃO GLOBAL";
    stTitle.style.color = "#facc15";
  }
  if (stSub) stSub.textContent = "Nenhum outro jogador entrou na fila nos últimos 30s.";
  if (lLog) lLog.textContent = "Toque em 'Jogar com Bot' para treinar contra a IA ou aguarde oponentes no Salão.";
}

function launchMatchFromMatchmaker(isBot) {
  cleanupRankedMatchmaker(true);
  const modal = document.getElementById("ranked-matchmaker-modal");
  if (modal) modal.style.display = "none";
  state.matchKind = "league";
  state.isMatchActive = true;
  state.matchFinished = false;
  state.clockMsP1 = 300000;
  state.clockMsP2 = 300000;

  if (isBot) {
    state.mode = "ai";
    state.gameMode = "ai";
    state.p2pLatency = Math.floor(8 + Math.random() * 8); // Simulated ultra-low latency (8-15ms)
    startVideoAuthenticMatch();
  } else {
    state.mode = "p2p";
    state.gameMode = "p2p";
    startP2PMatch(state.myRole || "p1");
  }
  setLogText(`🏆 PARTIDA DA LIGA INICIADA! Você vs ${remoteOpponentProfile ? remoteOpponentProfile.nickname : "Rival"} (${remoteOpponentProfile ? remoteOpponentProfile.rankRating : 1000} ELO)!`);
}
    state.gameMode = "p2p";
    state.p2pLatency = 14;
    startP2PMatch(state.myRole || "p1");
  }
  setLogText(`🏆 PARTIDA DA LIGA INICIADA! Você vs ${remoteOpponentProfile ? remoteOpponentProfile.nickname : "Rival"} (${remoteOpponentProfile ? remoteOpponentProfile.rankRating : 1000} ELO)!`);
}

function startLeagueRankedMatch() {
  openRankedMatchmakerModal();
}

function startGymCupMatch() {
  hideTutorialCoachHud();
  state.matchKind = "gym_cup";
  startVideoAuthenticMatch();
  state.units.forEach(u => {
    if (u.type && u.type.includes("Grass")) {
      u.baseMp = u.mp;
      u.mp = Math.min(3, u.mp + 1);
    }
  });
  setLogText("🏆 COPA DE GINÁSIO (GRASS & FIRE CUP) — Grama (+1 MP) · Fogo (+20 DMG) · Vale Troféus!");
}

function startTrainingCenterMatch() {
  hideTutorialCoachHud();
  state.matchKind = "training";
  startVideoAuthenticMatch();
  setLogText("🏋️ MODO TREINO TÁTICO — Sem perda/ganho de ELO e sem recompensas.");
}

function startCarmonteQuestMatch(hotelIdx) {
  const questCost = 15;
  tickStaminaEnergy();
  if (playerStamina.energy < questCost) {
    playSfx("hit");
    const errEl = document.getElementById("carmonte-quest-err");
    if (errEl) {
      errEl.textContent = `⚠️ Energia insuficiente (${playerStamina.energy}/${questCost}⚡)! Aguarde regenerar ou toque na barra verde (110/110) para recarregar.`;
    }
    return;
  }
  playerStamina.energy -= questCost;
  if (playerStamina.energy === MAX_STAMINA_ENERGY - questCost) {
    playerStamina.lastTimestamp = Date.now();
  }
  saveStaminaState();
  tickStaminaEnergy();

  const qm = document.getElementById("carmonte-quests-modal");
  if (qm) qm.style.display = "none";
  hideTutorialCoachHud();

  const h = (typeof CARMONTE_HOTELS !== "undefined" && CARMONTE_HOTELS[hotelIdx]) ? CARMONTE_HOTELS[hotelIdx] : { name: "Hotel Ulex", boss: "Luca", surface: "crystal" };
  state.matchKind = "quest";
  state.currentQuestHotelIdx = hotelIdx;
  state.currentQuestHotel = h;
  state.questEnemyKOs = 0;
  state.questStartTurnCounter = state.turnCounter || 300;
  setTableSurface(h.surface || "crystal");
  startVideoAuthenticMatch();
  setLogText(`🗺️ QUEST: ${h.name} vs ${h.boss} (-15⚡ Energia)! Desafio 3-Star Carmonte iniciado!`);
}

// Override showWinResultScreen so Training Mode & Tutorial Mode NEVER grant ELO points or Victory Rewards!
const _v500ShowWinResultScreen = showWinResultScreen;
showWinResultScreen = function(winner) {
  const didWin = (winner === getBottomRole());

  // CASE A: INTERACTIVE TUTORIAL PRESENTATION MATCH
  if (state.matchKind === "tutorial") {
    hideTutorialCoachHud();
    const ov = document.getElementById("win-result-overlay");
    const t  = document.getElementById("win-result-title");
    if (t) {
      t.textContent = "🎓 PARTIDA CONCLUÍDA!";
      t.style.color = "#4ade80";
    }
    const p = window.trainerProfileData || { rankRating: 1000, leagueTier: "Beginner" };
    const setTxt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setTxt("win-rating-val", `${p.rankRating} (${p.leagueTier})`);
    setTxt("win-rating-delta", "+0 Pts (Tutorial)");
    setTxt("win-keys-val", "+0 🔑 (Modo Tutorial)");
    setTxt("win-gems-val", "+0 🔻 · +0 🪙 (Partida de Apresentação)");
    const boxBadgeEl = document.getElementById("win-box-badge");
    const boxDescEl  = document.getElementById("win-box-desc");
    const boxBtnEl   = document.getElementById("win-open-box-btn");
    if (boxBadgeEl) {
      boxBadgeEl.textContent = "🏛️ PRÓXIMA FASE: TOUR GUIADO DO HUB!";
      boxBadgeEl.style.color = "#fde047";
    }
    if (boxDescEl) {
      boxDescEl.textContent = "Excelente! Você dominou o tabuleiro, salto de 2 MP, Plates, Data Disk de 96 fatias e Surround KO. Agora vamos conhecer o Hub!";
    }
    if (boxBtnEl) {
      boxBtnEl.style.display = "block";
      boxBtnEl.textContent = "🏛️ INICIAR TOUR DO HUB (5 ETAPAS) ➔";
      boxBtnEl.onclick = function() {
        closeWinResultOverlay();
        startGuidedHubTour();
      };
    }
    if (ov) ov.style.display = "flex";
    return;
  }

  // CASE B: TRAINING CENTER (TREINO TÁTICO) — ZERO REWARDS & ZERO ELO POINTS!
  if (state.matchKind === "training") {
    const ov = document.getElementById("win-result-overlay");
    const t  = document.getElementById("win-result-title");
    if (t) {
      t.textContent = didWin ? "TREINO: VITÓRIA" : "TREINO: FIM";
      t.style.color = "#38bdf8";
    }
    const p = window.trainerProfileData || { rankRating: 1000, leagueTier: "Beginner" };
    const setTxt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setTxt("win-rating-val", `${p.rankRating} (${p.leagueTier})`);
    const rDel = document.getElementById("win-rating-delta");
    if (rDel) {
      rDel.textContent = "+0 Pts (Modo Treino)";
      rDel.style.color = "#94a3b8";
    }
    setTxt("win-keys-val", "+0 🔑 (Sem Chaves no Treino)");
    setTxt("win-gems-val", "+0 🔻 · +0 🪙 (Sem Recompensas no Treino)");
    const boxBadgeEl = document.getElementById("win-box-badge");
    const boxDescEl  = document.getElementById("win-box-desc");
    const boxBtnEl   = document.getElementById("win-open-box-btn");
    if (boxBadgeEl) {
      boxBadgeEl.textContent = "🏋️ MODO TREINO TÁTICO — SEM PONTOS OU CAIXAS";
      boxBadgeEl.style.color = "#38bdf8";
    }
    if (boxDescEl) {
      boxDescEl.textContent = "Partidas no Training Center servem para testar seus Decks e mecânicas sem ganhar/perder pontos ELO e sem dar recompensas.";
    }
    if (boxBtnEl) {
      boxBtnEl.style.display = "block";
      boxBtnEl.textContent = "🏠 VOLTAR AO HUB";
      boxBtnEl.onclick = function() {
        closeWinResultOverlay();
        openDrawer("hub");
        switchDrawerTab("hub");
      };
    }
    if (ov) ov.style.display = "flex";
    return;
  }

  // CASE C: QUEST MODE (CARMONTE ISLAND CAMPAIGN — CONSUMED 15⚡, GRANTS COINS ONLY, NO ELO/TIME BOOSTER)
  if (state.matchKind === "quest") {
    const ov = document.getElementById("win-result-overlay");
    const t  = document.getElementById("win-result-title");
    if (t) {
      t.textContent = didWin ? "QUEST CLEAR! ★★★" : "QUEST FAILED";
      t.style.color = didWin ? "#a855f7" : "#f87171";
    }
    const hIdx = state.currentQuestHotelIdx || 0;
    const h = (typeof CARMONTE_HOTELS !== "undefined" && CARMONTE_HOTELS[hIdx]) ? CARMONTE_HOTELS[hIdx] : { name: "Hotel Carmonte" };
    const turnsUsed = Math.max(1, (state.questStartTurnCounter || 300) - (state.turnCounter || 0));
    const enemyKOs = state.questEnemyKOs || 0;

    const star1 = didWin;
    const maxTurns = (hIdx >= 4 ? 24 : 28);
    const minKOs = (hIdx === 5 ? 3 : 2);
    const star2 = didWin && (turnsUsed <= maxTurns);
    const star3 = didWin && (enemyKOs >= minKOs);

    const starsAchieved = (star1 ? 1 : 0) + (star2 ? 1 : 0) + (star3 ? 1 : 0);
    const qSt = getStoredQuestStars();
    const prevStars = qSt[hIdx] || 0;
    if (starsAchieved > prevStars) {
      qSt[hIdx] = starsAchieved;
      saveStoredQuestStars(qSt);
    }

    let coinReward = 0;
    let gemReward = 0;
    if (didWin) {
      coinReward = 1500 + hIdx * 500;
      gemReward = (starsAchieved === 3 && prevStars < 3) ? 15 : 5;
      userCoins += coinReward;
      userGems += gemReward;
      userRareMetalItems += 1;
      saveEconomyAndUpgrades();
      syncAllCurrencyLabels();
    }

    const p = window.trainerProfileData || { rankRating: 1000, leagueTier: "Beginner" };
    const setTxt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setTxt("win-rating-val", `${p.rankRating} (${p.leagueTier})`);
    const rDel = document.getElementById("win-rating-delta");
    if (rDel) {
      rDel.textContent = "+0 Pts (Campanha Quest)";
      rDel.style.color = "#c084fc";
    }
    setTxt("win-keys-val", `+0 🔑 (Energia Restante: ⚡${playerStamina.energy}/110)`);
    setTxt("win-gems-val", didWin ? `+${gemReward} 🔻 Gems · +${coinReward.toLocaleString()} 🪙 Coins` : "+0 🔻 Gems · +0 🪙 Coins");

    const boxBadgeEl = document.getElementById("win-box-badge");
    const boxDescEl  = document.getElementById("win-box-desc");
    const boxBtnEl   = document.getElementById("win-open-box-btn");
    if (boxBadgeEl) {
      const starStr = "★".repeat(starsAchieved) + "☆".repeat(3 - starsAchieved);
      boxBadgeEl.textContent = `🗺️ ${h.name} — ${starStr} (${starsAchieved}/3)`;
      boxBadgeEl.style.color = starsAchieved === 3 ? "#4ade80" : "#facc15";
    }
    if (boxDescEl) {
      boxDescEl.innerHTML = `
        <div style="font-size:10px; line-height:1.4; text-align:left; background:#0f172a; border:1px solid #334155; border-radius:6px; padding:6px 8px; margin-top:4px;">
          <div>${star1 ? '✅' : '❌'} <strong>Condição 1:</strong> Vencer o Duelo</div>
          <div>${star2 ? '✅' : '❌'} <strong>Condição 2:</strong> Vencer em até ${maxTurns} turnos (Você usou: <strong>${turnsUsed}</strong> turnos)</div>
          <div>${star3 ? '✅' : '❌'} <strong>Condição 3:</strong> Nocautear ${minKOs}+ figuras adversárias (Você nocauteou: <strong>${enemyKOs}</strong>)</div>
          <div style="margin-top:4px; color:#4ade80; font-weight:900;">${didWin ? `Recompensas: +${gemReward} 🔻 Gems · +${coinReward.toLocaleString()} 🪙 Coins · +1 🟦 Rare Metal` : 'Tente novamente para conquistar as 3 estrelas!'}</div>
        </div>
      `;
    }
    if (boxBtnEl) {
      boxBtnEl.style.display = "block";
      boxBtnEl.textContent = "🗺️ VOLTAR ÀS QUESTS";
      boxBtnEl.onclick = function() {
        closeWinResultOverlay();
        openCarmonteQuestsModal();
      };
    }
    if (ov) ov.style.display = "flex";
    return;
  }

  // CASE D: OFFICIAL RANKED LEAGUE MATCH OR P2P MATCH
  const boxBtnEl = document.getElementById("win-open-box-btn");
  if (boxBtnEl) boxBtnEl.onclick = openVictoryBoxFromWinScreen;
  _v500ShowWinResultScreen(winner);
};


// --- 17.4: INTERACTIVE NEW-ACCOUNT TUTORIAL (6-STEP PRESENTATION MATCH + 5-STEP HUB TOUR, v5.2.1 FIXED) ---
const TUTORIAL_COMPLETED_KEY = "pdr_tutorial_v510_completed";
try { localStorage.setItem(TUTORIAL_COMPLETED_KEY, "1"); } catch (e) {}
let currentTutorialStep = 0;
let currentHubTourStep  = 0;
let tutorialStepBusy    = false;

const TUTORIAL_MATCH_STEPS = [
  {
    step: 1,
    badge: "🎓 AULA 1/6 · ENTRADA EM CAMPO",
    title: "1. Portais de Entrada (Entry Points) e MP",
    desc: "Seus 6 Pokémon começam no Banco embaixo. Os portais nos cantos (Nós 7 e 13) são seus Entry Points e o ponto brilhante no topo (Nó 3) é o Goal Point inimigo! Toque no Nó 7 brilhando no tabuleiro (ou no botão abaixo) para colocar seu Pikachu (MP 3) em campo.",
    btnText: "▶️ Aula 1: Colocar Pikachu no Portal (Nó 7)",
    targetNode: 7
  },
  {
    step: 2,
    badge: "🎓 AULA 2/6 · SALTO DE 2 MP",
    title: "2. Regra Oficial de Salto (Casa Pulada Conta = 2 MP)",
    desc: "Nosso Bulbasaur está no Nó 25 logo à frente do Pikachu! Com a habilidade de salto (ou Plate Hurdle Jump), pular uma peça consome 1 MP da casa ocupada (Nó 25) + 1 MP da casa de pouso (Nó 23) = 2 MPs! Com o 3º MP, o Pikachu chega ao Nó 20. Toque no Nó 20 (ou no botão abaixo)!",
    btnText: "▶️ Aula 2: Saltar Bulbasaur (2 MP) ➔ Nó 20",
    targetNode: 20
  },
  {
    step: 3,
    badge: "🎓 AULA 3/6 · USO DE PLATES (6/6 ◆)",
    title: "3. Cartas Táticas (Plates — Limite de Custo 6/6 ◆)",
    desc: "Veja o Charmander inimigo bloqueando o Nó 21 à direita! No seu Deck você equipa até 6 diamantes (6/6 ◆) de Plates. No início do turno, antes de mover, você pode usar uma Plate. Toque no botão abaixo para ativar [X Attack (1◆)] e dar +30 de Dano ao Pikachu!",
    btnText: "▶️ Aula 3: Ativar Plate [X Attack +30 DMG]",
    targetNode: 20
  },
  {
    step: 4,
    badge: "🎓 AULA 4/6 · ROLETA DE 96 FATIAS",
    title: "4. Combate Data Disk (Hierarquia de Cores)",
    desc: "No combate ambos giram a roleta de 96 fatias: 🔵 Azul (Dodge) neutraliza tudo > 🟡 Dourado quebra Roxo > 🟣 Roxo (★) vence Branco > ⚪ Branco/Dourado vence pelo maior Dano > 🔴 Vermelho (Miss) perde! Toque no Charmander no Nó 21 (ou no botão abaixo) para girar a roleta!",
    btnText: "▶️ Aula 4: Atacar Charmander no Nó 21 (Girar Roleta)",
    targetNode: 21
  },
  {
    step: 5,
    badge: "🎓 AULA 5/6 · CERCO (SURROUND KO)",
    title: "5. Cerco Tático (Surround KO Automático & P.C.)",
    desc: "O Charmander derrotado foi para o P.C. (que guarda no máximo 2 peças)! Agora olhe o Squirtle inimigo no Nó 1: ele só tem 2 saídas (Nó 0, onde já está nosso Charizard, e Nó 2). Mova o Pikachu ao Nó 2 para fechar o cerco e causar SURROUND KO automático sem girar roleta!",
    btnText: "▶️ Aula 5: Mover ao Nó 2 e Cercar Squirtle!",
    targetNode: 2
  },
  {
    step: 6,
    badge: "🎓 AULA 6/6 · CONQUISTA DO GOAL POINT",
    title: "6. Pisar no Goal Point Inimigo (Nó 3) e Vencer!",
    desc: "Squirtle cercado e enviado ao P.C.! Agora o Goal Point inimigo (Nó 3) está totalmente livre ao lado do seu Pikachu. Avance do Nó 2 para o Nó 3 para conquistar a vitória na Partida de Apresentação e abrir o Tour Guiado do Hub!",
    btnText: "▶️ Aula 6: Avançar ao Goal Point (Nó 3) e Vencer!",
    targetNode: 3
  }
];

window.connectToGlobalSalao = connectToGlobalSalao;
window.publishSalaoPacket = publishSalaoPacket;
window.openRankedMatchmakerModal = openRankedMatchmakerModal;
window.cancelRankedMatchmaking = cancelRankedMatchmaking;
window.triggerBotFallbackNow = triggerBotFallbackNow;

if (typeof window !== "undefined") {
  setTimeout(() => {
    try { connectToGlobalSalao(); } catch (e) {}
  }, 1000);
}
