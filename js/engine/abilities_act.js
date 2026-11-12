// ============================================================================
// v709 · Habilidades de ação ("no começo do turno, em vez de mover…"), alcance 2, marcadores e o resto
// Botão "⚡ Habilidade" (como o "Activate Ability" do original) aparece quando a peça selecionada tem uma
// ação disponível neste turno (antes de mover). Depois de tocar nele, as casas/peças válidas acendem;
// toque numa delas para usar. A ação termina o turno quando o texto oficial diz "Your turn ends".
// Carrega depois de abilities_ext.js. Em P2P a ação é enviada como P2P_ABILITY (posições finais).
// ============================================================================
(function () {
  "use strict";
  if (typeof FIGURES_DB === "undefined") return;
  const tt = (k, fb) => (typeof t === "function" ? t(k, fb) : fb);
  const log = (s) => { try { setLogText(s); } catch (e) {} };
  const snd = (k) => { try { if (window.PDRSound) PDRSound.play(k); else playSfx("portal"); } catch (e) {} };
  const efOf = (u) => (typeof abilityEfOf === "function" ? abilityEfOf(u) : null) || [];
  const isType = (u, t2) => abilityTypesMatch(u, t2);
  const stOf = (u) => abStatusOf(u);
  const at = (n) => unitAtNode(n);
  const fx = (n, col) => { try { const p = getNodePos(n); spawnPortalParticles(p.x, p.y, col || "#facc15"); } catch (e) {} };

  // ---------------------------------------------------------------- ações por habilidade (officialDuelId)
  const A = {
    15: { k: "swapAdj", own: true, ends: false, label: "Run Off" }, 298: { k: "swapAdj", own: true, ends: false, label: "Strong Breeze" },
    464: { k: "swapAdj", types: ["Electric"], st: ["paralyze"], ends: true, label: "Electroswap" }, 486: { k: "swapAdj", types: ["Electric"], st: ["paralyze"], ends: true, label: "Electroswap" },
    441: { k: "swapAdj", types: ["Electric"], st: ["paralyze"], ends: true, label: "Electrobind" },
    353: { k: "swapAny", st: ["freeze"], ends: true, label: "Snowy Transformation" }, 455: { k: "swapAny", st: ["freeze"], ends: true, label: "Snowy Transformation" },
    493: { k: "warp", exact: 2, ends: true, label: "Tunnel Construction" },
    360: { k: "warp", exact: 2, ends: true, needNear: ["Metang", "Metagross"], label: "Magnetic Body" }, 377: { k: "warp", exact: 2, ends: true, needNear: ["Metang", "Metagross"], label: "Magnetic Body" },
    500: { k: "warp", exact: 3, ends: true, first: true, label: "Spaceborne" },
    593: { k: "dash", max: 4, ends: true, battled: true, label: "Rush In" }, 607: { k: "dash", max: 4, ends: true, battled: true, label: "Rush In" },
    86: { k: "dash", max: 2, ends: true, label: "Reckless Charge" }, 172: { k: "dash", max: 2, ends: true, label: "Reckless Charge" }, 186: { k: "dash", max: 2, ends: true, label: "Reckless Charge" },
    147: { k: "raid", exact: 3, label: "Raid" },
    131: { k: "hop", dist: [1, 2], ends: true, label: "Distort" }, 502: { k: "hop", dist: [1, 2], ends: true, label: "Distort" },
    564: { k: "hop", dist: [1], ends: true, label: "High-Speed Drill" },
    573: { k: "hop", dist: [1], ends: true, burnOpp: true, label: "Bonfire" },
    406: { k: "hop", dist: [1], ends: true, first: true, label: "Ultra Pump Up" },
    497: { k: "hop", dist: [1], ends: true, overWait: true, exileOver: true, label: "Gulp" },
    282: { k: "chainHop", types: ["Grass"], ends: false, label: "Forest Leap" },
    357: { k: "chainHop", types: ["Electric"], ends: true, label: "Cosmic Surfer" },
    214: { k: "goal", ends: true, label: "Cut Off" },
    469: { k: "toBench", ends: false, label: "Loyalty" }, 489: { k: "toBench", ends: false, label: "Loyalty" },
    85: { k: "summon", names: ["Ledyba", "Ledian"], ends: true, label: "Swarm" }, 175: { k: "summon", names: ["Ledyba", "Ledian"], ends: true, label: "Swarm" },
    295: { k: "spinAt", range: 2, exactRange: true, ifColor: "white", oppWait: 3, selfWait: 3, ends: false, label: "Long Lick" },
    467: { k: "spinAt", range: 2, exactRange: true, ifColor: "white", oppWait: 1, pull: true, selfWait: 3, needAlone: true, ends: false, label: "Entangle" },
    444: { k: "spinAt", range: 2, ifColor: "blue", lock: true, all: true, ends: true, label: "Lock On: Blue" },
    446: { k: "spinAt", range: 2, ifColor: "purple", lock: true, all: true, ends: true, label: "Lock-On: Purple" },
    448: { k: "spinAt", range: 2, ifColor: "gold", lock: true, all: true, ends: true, label: "Lock On: Gold" }
  };
  // Alcance 2 (ataca quem está a 2 passos com uma peça no meio)
  const RANGE2 = { 79: {}, 417: { first: true }, 331: {}, 407: {} };
  // Passivas restantes
  const PASSIVE = {
    148: "armThrust", 173: "sandBlizzard", 343: "steelBreaker", 570: "roughSkin", 565: "kingHorn", 417: "paperSword",
    492: "survive", 553: "survive", 572: "pressure", 390: "deliver", 442: "flowerCarpet", 501: "pulsarVenom",
    339: "sparkNoise", 585: "powerConstruct", 134: "fleeBack", 272: "fleeBack", 386: "slippery", 354: "aftermath",
    180: "biteInstinct", 209: "biteInstinct", 238: "maxVital", 166: "divingEntry", 191: "divingEntry"
  };
  const PUB = () => window.PDRAbilityActions || { canAct, targetsFor, perform };
  const idOf = (u) => { const f = u && FIGURES_DB[u.baseIdx]; return f ? f.officialDuelId : null; };
  const actOf = (u) => (u && !u._abNull ? A[idOf(u)] : null);
  const pas = (u, k) => !!(u && !u._abNull && PASSIVE[idOf(u)] === k);

  // ---------------------------------------------------------------- geometria
  function bfs(from, passable) {
    const dist = { [from]: 0 }, q = [from];
    while (q.length) { const x = q.shift(); for (const y of (ADJ[x] || [])) { if (dist[y] == null && (!passable || passable(y))) { dist[y] = dist[x] + 1; q.push(y); } } }
    return dist;
  }
  const freeNode = (n) => !at(n);
  function warpTargets(u, spec) {
    const d = bfs(u.nodeId, null);
    return Object.keys(d).map(Number).filter((n) => n !== u.nodeId && freeNode(n) && (spec.exact ? d[n] === spec.exact : d[n] <= spec.max));
  }
  function dashTargets(u, max) {
    // até N passos por casas vazias (sem pular)
    const d = bfs(u.nodeId, freeNode);
    return Object.keys(d).map(Number).filter((n) => n !== u.nodeId && d[n] <= max);
  }
  function hopTargets(u, spec) {
    const out = new Set();
    (ADJ[u.nodeId] || []).forEach((m) => {
      const o = at(m); if (!o) return;
      if (spec.overWait && !((o.waitTurns || 0) > 0)) return;
      const d = bfs(m, null);
      Object.keys(d).map(Number).forEach((n) => { if (n !== u.nodeId && freeNode(n) && spec.dist.includes(d[n])) out.add(n); });
    });
    return [...out];
  }
  function chainHopTargets(u, types) {
    const chain = new Set(), q = [];
    (ADJ[u.nodeId] || []).forEach((m) => { const o = at(m); if (o && isType(o, types)) { chain.add(m); q.push(m); } });
    while (q.length) { const x = q.shift(); (ADJ[x] || []).forEach((y) => { const o = at(y); if (o && isType(o, types) && !chain.has(y)) { chain.add(y); q.push(y); } }); }
    const out = new Set();
    chain.forEach((c) => (ADJ[c] || []).forEach((n) => { if (n !== u.nodeId && freeNode(n)) out.add(n); }));
    return [...out];
  }
  function goalNode(u) { return u.owner === "p1" ? 10 : 3; }

  // ---------------------------------------------------------------- disponibilidade
  function movedThisTurn() { return state.__abLastMoveTurn === state.turnCounter; }
  function targetsFor(u, a) {
    if (!a || !u) return [];
    if (u.location !== "board") return [];
    if (a.first && u._abBattled) return [];
    if (a.needAlone && (ADJ[u.nodeId] || []).some((n) => at(n))) return [];
    if (a.needNear && !state.units.some((o) => o !== u && o.owner === u.owner && abNameMatch(o, a.needNear) && abDist(o, u) <= 2)) return [];
    switch (a.k) {
      case "swapAdj": return (ADJ[u.nodeId] || []).filter((n) => { const o = at(n); if (!o || o === u) return false; if (a.own) return o.owner === u.owner; return isType(o, a.types || []) || abStMatch(o, a.st || []); });
      case "swapAny": return state.units.filter((o) => o !== u && o.location === "board" && abStMatch(o, a.st)).map((o) => o.nodeId);
      case "warp": return warpTargets(u, a);
      case "dash": return dashTargets(u, a.max);
      case "raid": return warpTargets(u, { exact: a.exact }).filter((n) => (ADJ[n] || []).some((m) => { const o = at(m); return o && o.owner !== u.owner; }));
      case "hop": return hopTargets(u, a);
      case "chainHop": return chainHopTargets(u, a.types);
      case "goal": { const g = goalNode(u); return freeNode(g) ? [g] : []; }
      case "toBench": return [u.nodeId];
      case "summon": return state.units.filter((o) => o.owner === u.owner && o !== u && o.location === "board" && abNameMatch(o, a.names) && !abilityAdjacent(o, u)).map((o) => o.nodeId);
      case "spinAt": return state.units.filter((o) => o.owner !== u.owner && o.location === "board" && (a.exactRange ? abDist(o, u) === a.range : abDist(o, u) <= a.range)).map((o) => o.nodeId);
    }
    return [];
  }
  function canAct(u) {
    if (!u || u.owner !== state.turn || (u.waitTurns || 0) > 0 || state.isAnimating) return false;
    if (typeof canControlTurn === "function" && !canControlTurn()) return false;
    if (movedThisTurn() || state.postMoveAttackMode) return false;
    if (stOf(u) === "sleep" || stOf(u) === "freeze") return false;
    const a = actOf(u); if (!a) return false;
    return targetsFor(u, a).length > 0;
  }

  // ---------------------------------------------------------------- botão e modo de alvo
  function ensureBtn() {
    let b = document.getElementById("ab-act-btn");
    if (!b) {
      b = document.createElement("button"); b.id = "ab-act-btn";
      b.style.cssText = "position:fixed;z-index:240;left:50%;transform:translateX(-50%);display:none;border-radius:10px;border:2px solid #fef9c3;background:linear-gradient(180deg,#a855f7,#6d28d9);color:#fff;font-weight:900;font-size:13px;padding:8px 16px;box-shadow:0 4px 14px rgba(0,0,0,.7),0 0 14px rgba(168,85,247,.6);cursor:pointer;white-space:nowrap";
      b.onclick = (e) => { e.stopPropagation(); toggleTargetMode(); };
      document.body.appendChild(b);
    }
    return b;
  }
  function placeBtn(b) {
    const c = document.getElementById("board-canvas");
    if (!c) return;
    const r = c.getBoundingClientRect();
    b.style.top = Math.round(r.top + r.height * (440 / 530)) + "px";
  }
  function refreshBtn() {
    const b = ensureBtn();
    const dr = document.getElementById("drawer-modal");
    const ov = document.getElementById("wheel-overlay");
    const u = state && state.units && state.units.find((x) => x.uid === state.selectedUnitId);
    const show = !!(u && !(dr && dr.classList.contains("show")) && !(ov && ov.classList.contains("show")) && (state.__abMode && state.__abMode.uid === u.uid || PUB().canAct(u)));
    if (!show) { b.style.display = "none"; if (state && state.__abMode && (!u || state.__abMode.uid !== u.uid)) cancelMode(); return; }
    const a = actOf(u);
    b.textContent = state.__abMode ? `✕ ${tt("ab.cancel", "Cancelar")} ${a.label}` : `⚡ ${tt("ab.use", "Habilidade")}: ${a.label}`;
    b.style.display = "block"; placeBtn(b);
  }
  setInterval(() => { try { refreshBtn(); } catch (e) {} }, 250);

  function toggleTargetMode() {
    const u = state.units.find((x) => x.uid === state.selectedUnitId);
    if (state.__abMode) { cancelMode(); try { selectUnit(u.uid); } catch (e) {} return; }
    if (!PUB().canAct(u)) return;
    const a = actOf(u), tg = PUB().targetsFor(u, a);
    state.__abMode = { uid: u.uid, targets: tg };
    state.reachableNodes = tg.slice(); state.reachablePaths = {}; state.attackTargets = [];
    snd("plate_sel");
    log(`⚡ ${a.label}: ${tt("ab.pick", "toque numa casa/peça destacada.")}`);
    refreshBtn();
  }
  function cancelMode() { if (!state.__abMode) return; state.__abMode = null; state.reachableNodes = []; state.reachablePaths = {}; }

  // ---------------------------------------------------------------- execução
  function swap(u, o) { const n = u.nodeId; u.nodeId = o.nodeId; o.nodeId = n; }
  function placeOn(u, n) { u.location = "board"; u.nodeId = n; }
  function spinOf(o) {
    const segs = getActiveWheel(o) || []; const tot = segs.reduce((x, s) => x + (s.size || 0), 0) || 96;
    const rnd = (typeof nextDeterministicRandom === "function") ? nextDeterministicRandom() : Math.random();
    let r = rnd * tot; for (const s of segs) { r -= s.size || 0; if (r < 0) return s; } return segs[segs.length - 1] || { color: "red" };
  }
  function perform(u, a, node) {
    const o = at(node);
    const changed = new Set([u]);
    let endsTurn = !!a.ends;
    switch (a.k) {
      case "swapAdj": case "swapAny": if (!o) return false; swap(u, o); changed.add(o); log(`🔁 ${u.name}: ${a.label} — trocou de lugar com ${o.name}.`); break;
      case "warp": case "dash": placeOn(u, node); if (a.battled) u._abBattled = true; log(`💨 ${u.name}: ${a.label}!`); break;
      case "raid": {
        placeOn(u, node);
        const adj = (ADJ[node] || []).filter((m) => { const x = at(m); return x && x.owner !== u.owner; });
        log(`⚔️ ${u.name}: ${a.label}! ${tt("ab.must_attack", "Agora precisa atacar.")}`);
        if (adj.length) {
          const nextT = state.turn === "p1" ? "p2" : "p1";
          state.postMoveAttackMode = true; state.selectedUnitId = u.uid; state.attackTargets = adj; state.reachableNodes = [];
          state.pendingPostMoveTurn = { nextTurn: nextT, nextTurnCounter: Math.max(0, state.turnCounter - 1) };
          endsTurn = false;
        } else endsTurn = true;
        break;
      }
      case "hop": {
        const over = (ADJ[u.nodeId] || []).map(at).filter((x) => x && (!a.overWait || (x.waitTurns || 0) > 0) && bfs(x.nodeId, null)[node] != null && a.dist.includes(bfs(x.nodeId, null)[node]));
        placeOn(u, node);
        over.forEach((x) => {
          if (a.burnOpp && x.owner !== u.owner && !abilityImmuneTo(x, "burn")) { x.condition = PokemonCondition.Burn; changed.add(x); log(`🔥 ${u.name}: Bonfire queimou ${x.name}!`); }
          if (a.exileOver && typeof banishToUltraSpace === "function") { banishToUltraSpace(x); changed.add(x); }
        });
        log(`🌀 ${u.name}: ${a.label}!`);
        break;
      }
      case "chainHop": placeOn(u, node); log(`🌿 ${u.name}: ${a.label}!`); break;
      case "goal": placeOn(u, node); log(`🛡️ ${u.name}: ${a.label} — foi para o seu Goal.`); break;
      case "toBench": {
        const used = state.units.filter((x) => x.owner === u.owner && x.location === "bench").map((x) => x.benchSlot); let sl = 0; while (used.includes(sl)) sl++;
        u.location = "bench"; u.nodeId = null; u.benchSlot = sl; u.waitTurns = 0; state.__abLastMoveTurn = -1;
        log(`🏠 ${u.name}: ${a.label} — voltou ao banco e já pode ser usado.`); break;
      }
      case "summon": {
        if (!o) return false;
        const free = (ADJ[u.nodeId] || []).find(freeNode); if (free == null) return false;
        o.nodeId = free; changed.add(o); log(`🐞 ${u.name}: ${a.label} trouxe ${o.name} para perto.`); break;
      }
      case "spinAt": {
        const targets = a.all ? state.units.filter((x) => x.owner !== u.owner && x.location === "board" && abDist(x, u) <= a.range) : (o ? [o] : []);
        if (!targets.length) return false;
        targets.forEach((x) => {
          const s = spinOf(x);
          changed.add(x);
          if (s.color === a.ifColor) {
            if (a.lock) { x._lockOn = true; x.waitTurns = Math.max(x.waitTurns || 0, 2); log(`🎯 ${u.name}: ${x.name} tirou ${s.name} e recebeu Lock-On (Espera).`); }
            if (a.oppWait) x.waitTurns = Math.max(x.waitTurns || 0, a.oppWait + 1);
            if (a.pull) { const step = (ADJ[x.nodeId] || []).find((n) => freeNode(n) && abDist({ location: "board", nodeId: n }, u) < abDist(x, u)); if (step != null) x.nodeId = step; }
            if (!a.lock) log(`👅 ${u.name}: ${x.name} tirou ${s.name} — ${a.label} funcionou!`);
          } else log(`${u.name}: ${x.name} tirou ${s.name} (${a.label} sem efeito).`);
        });
        if (a.selfWait) u.waitTurns = Math.max(u.waitTurns || 0, a.selfWait + 1);
        endsTurn = true;
        break;
      }
      default: return false;
    }
    fx(u.nodeId, "#c084fc"); snd("ab_pos");
    try { checkSurroundKOs(); } catch (e) {}
    sendSync(changed, endsTurn);
    if (endsTurn) { state.selectedUnitId = null; state.reachableNodes = []; state.attackTargets = []; endTurn(true); }
    else if (a.k !== "raid") { try { selectUnit(u.uid); } catch (e) {} }
    return true;
  }
  function sendSync(changed, endsTurn) {
    if (state.mode !== "p2p" || typeof sendP2PPacket !== "function") return;
    sendP2PPacket({ type: "P2P_ABILITY", units: [...changed].map((x) => ({ uid: x.uid, location: x.location, nodeId: x.nodeId, waitTurns: x.waitTurns, condition: x.condition, lock: !!x._lockOn })), turn: state.turn });
  }
  if (typeof handleP2PPacket === "function") {
    const _h = handleP2PPacket;
    const h2 = function (raw) {
      let msg = raw;
      if (typeof raw === "string") { try { msg = JSON.parse(raw); } catch (e) { return _h.apply(this, arguments); } }
      if (msg && msg.type === "P2P_ABILITY") {
        (msg.units || []).forEach((d) => { const x = state.units.find((y) => y.uid === d.uid); if (x) { x.location = d.location; x.nodeId = d.nodeId; x.waitTurns = d.waitTurns; x.condition = d.condition; x._lockOn = d.lock; } });
        log(tt("ab.opp_used", "⚡ O oponente usou uma Habilidade."));
        return;
      }
      return _h.apply(this, arguments);
    };
    try { handleP2PPacket = h2; } catch (e) {}
    window.handleP2PPacket = h2;
  }
  if (typeof onNodeClicked === "function") {
    const _c = onNodeClicked;
    const c2 = function (nodeId) {
      const m = state.__abMode;
      if (m) {
        const u = state.units.find((x) => x.uid === m.uid);
        const a = actOf(u);
        state.__abMode = null; state.reachableNodes = [];
        if (u && a && m.targets.includes(nodeId)) { PUB().perform(u, a, nodeId); return; }
        log(tt("ab.cancelled", "Habilidade cancelada."));
        try { if (u) selectUnit(u.uid); } catch (e) {}
        return;
      }
      return _c.apply(this, arguments);
    };
    try { onNodeClicked = c2; } catch (e) {}
  }
  if (typeof executeMove === "function") {
    const _m = executeMove;
    const m2 = function () { state.__abLastMoveTurn = state.turnCounter; state.__abMode = null; return _m.apply(this, arguments); };
    try { executeMove = m2; } catch (e) {}
  }

  // ---------------------------------------------------------------- alcance 2
  function range2Targets(u) {
    const spec = RANGE2[idOf(u)];
    if (!spec || u._abNull || u.location !== "board") return [];
    if (spec.first && u._abBattled) return [];
    const out = [];
    (ADJ[u.nodeId] || []).forEach((m) => {
      if (!at(m)) return; // precisa ter uma peça no meio
      (ADJ[m] || []).forEach((n) => { const o = at(n); if (n !== u.nodeId && o && o.owner !== u.owner && !(ADJ[u.nodeId] || []).includes(n)) out.push(n); });
    });
    return [...new Set(out)];
  }
  if (typeof selectUnit === "function") {
    const _s = selectUnit;
    const s2 = function (uid) {
      const r = _s.apply(this, arguments);
      const u = state.units.find((x) => x.uid === uid);
      if (u && state.selectedUnitId === uid && u.owner === state.turn && !(typeof abCannotAttack === "function" && abCannotAttack(u))) {
        const extra = range2Targets(u).filter((n) => !state.attackTargets.includes(n));
        if (extra.length) { state.attackTargets = state.attackTargets.concat(extra); log(`🏹 ${u.name}: ${tt("ab.range2", "pode atacar a 2 passos (Alcance 2).")}`); }
      }
      return r;
    };
    try { selectUnit = s2; } catch (e) {}
  }

  // ---------------------------------------------------------------- passivas restantes
  if (typeof computeReachableWithPaths === "function") {
    const _r = computeReachableWithPaths;
    computeReachableWithPaths = function (unit) {
      // Sand Blizzard: Fly Away (passar por cima) do oponente é anulado
      const fig = unit && FIGURES_DB[unit.baseIdx];
      if (fig && fig.canPassThrough && state.units.some((o) => o.owner !== unit.owner && o.location === "board" && pas(o, "sandBlizzard"))) {
        fig.canPassThrough = false;
        try { return _r(unit); } finally { fig.canPassThrough = true; }
      }
      return _r(unit);
    };
  }
  if (typeof evaluateCombat === "function") {
    const _e = evaluateCombat;
    evaluateCombat = function (atk, def, as, ds) {
      if (as && ds && as.chosen && ds.chosen) {
        // King Horn: batalha contra peça com Cracked → defesas (azul) viram Miss
        [[as, atk, def], [ds, def, atk]].forEach(([sp, u, o]) => {
          if (u._cracked && sp.chosen.color === "blue" && state.units.some((k) => k.owner === o.owner && k.location === "board" && pas(k, "kingHorn"))) sp.chosen = Object.assign({}, sp.chosen, { color: "red", name: "Miss", dmg: 0 });
        });
      }
      const out = _e.apply(this, arguments);
      if (!out || !as || !ds || !("multiHits" in as)) return out;
      const pend = (fn) => { state.__sliceFxPending = state.__sliceFxPending || []; state.__sliceFxPending.push(fn); };
      [[atk, def, as, ds], [def, atk, ds, as]].forEach(([u, o, mine, theirs]) => {
        if (pas(u, "steelBreaker") && (theirs.chosen.dmg || 0) >= 130) pend(() => { o._cracked = true; log(`🔨 ${o.name} recebeu um marcador Cracked!`); });
        if (pas(u, "roughSkin") && !abHasStatus(u)) pend(() => { o._cracked = true; });
        if (pas(u, "armThrust") && /Arm Thrust/i.test(mine.chosen.name || "") && (mine.multiHits && mine.multiHits.length >= 3)) pend(() => { if (u.location === "board" && typeof evolveUnitInMatch === "function") evolveUnitInMatch(u); });
        if (pas(u, "pulsarVenom") && !u._pulsarDone) pend(() => { u._pulsarDone = true; state.units.forEach((x) => { if (x.location === "board" && x !== u && (x === o || abHasStatus(x)) && !abilityImmuneTo(x, "poison")) x.condition = PokemonCondition.Poison; }); });
      });
      if (out.winner === "atk" || out.winner === "def") {
        const winU = out.winner === "atk" ? atk : def, loseU = out.winner === "atk" ? def : atk;
        if (out.effect === "banish" && (pas(loseU, "survive"))) { out.effect = "ko"; out.reason = (out.reason || "") + " 🛡️ Não pode ser excluído."; }
        if (out.effect === "wait" && pas(winU, "pressure")) pend(() => { loseU.waitTurns = (loseU.waitTurns || 0) + 1; });
        if ((out.effect || "ko") === "ko" && pas(loseU, "paperSword") && false) {}
        if ((out.effect || "ko") === "ko" && pas(winU, "paperSword") && loseU._cracked && !isType(loseU, ["Fire"])) out.effect = "banish";
        if ((out.effect || "ko") === "ko" && pas(loseU, "powerConstruct") && (state.reviverQueueP1.length >= 2 || state.reviverQueueP2.length >= 2)) {
          const to = (typeof findFigureByName === "function") && (findFigureByName("Zygarde Complete Forme") || findFigureByName("Zygarde (Complete Forme)") || findFigureByName("Complete Forme Zygarde"));
          if (to && typeof abilityTransformUnit === "function") { out.effect = "none"; pend(() => abilityTransformUnit(loseU, to.name)); }
        }
      }
      return out;
    };
  }
  // Surprise Back: foge 2 passos para trás quando a batalha seria ruim (fora do P2P)
  if (typeof triggerCombat === "function") {
    const _t = triggerCombat;
    const t2 = function (atk, def, broadcast, forced) {
      const remote = !!(forced && (forced.atkSpin || forced.defSpin));
      if (atk && def && !remote && state.mode !== "p2p" && pas(def, "fleeBack") && typeof abBest === "function" && abBest(atk) > abBest(def) * 1.15) {
        const d = bfs(def.nodeId, null);
        const back = Object.keys(d).map(Number).filter((n) => d[n] === 2 && freeNode(n) && abDist({ location: "board", nodeId: n }, atk) > 1)[0];
        if (back != null) { def.nodeId = back; def.waitTurns = Math.max(def.waitTurns || 0, 2); log(`↩️ ${def.name}: Surprise Back — recuou 2 passos sem batalhar!`); endTurn(true); return; }
      }
      return _t.apply(this, arguments);
    };
    try { triggerCombat = t2; } catch (e) {}
    window.triggerCombat = t2;
  }
  // Spark Noise: ao entrar em campo, o banco adversário gira; roxo → Espera
  if (typeof executeMove === "function") {
    const _m2 = executeMove;
    executeMove = function (uid) {
      const u = state.units.find((x) => x.uid === uid);
      const fromBench = !!(u && u.location === "bench");
      const r = _m2.apply(this, arguments);
      if (u && fromBench && pas(u, "sparkNoise")) {
        state.units.filter((x) => x.owner !== u.owner && x.location === "bench").forEach((x) => { const s = spinOf(x); if (s.color === "purple") { x.waitTurns = Math.max(x.waitTurns || 0, 2); log(`📢 Spark Noise: ${x.name} tirou ${s.name} e ganhou Espera.`); } });
      }
      return r;
    };
  }
  // Deliver / Flower Carpet nos turnos
  if (typeof endTurn === "function") {
    const _end = endTurn;
    endTurn = function () {
      const locs = new Map((state.units || []).map((u) => [u, u.location]));
      // Flower Carpet: Mega não acaba por turnos enquanto a peça está no Entry Point sem condição
      const keep = state.units.filter((u) => u.owner === state.turn && u.location === "board" && pas(u, "flowerCarpet") && !abHasStatus(u) && abIsEntry(u)).length > 0;
      const megas = keep ? state.units.filter((u) => u.owner === state.turn && (u.megaTurns || 0) > 1) : [];
      megas.forEach((u) => { u.megaTurns += 1; });
      const r = _end.apply(this, arguments);
      try {
        state.units.forEach((u) => {
          if (locs.get(u) === "pc" && u.location === "bench" && pas(u, "deliver")) {
            const mp = (state.plates || []).find((p) => p.id === "megaplate" && (u.owner === "p2" ? p.usedP2 : p.usedP1));
            if (mp) { if (u.owner === "p2") mp.usedP2 = false; else mp.usedP1 = false; mp.used = false; log(`📦 ${u.name}: Deliver devolveu a Mega Plate!`); }
          }
        });
      } catch (e) {}
      return r;
    };
  }
  // Max Vital Spirit (anda o máximo possível) / Diving Entry (do banco, só 1 passo do Entry Point)
  if (typeof computeReachableWithPaths === "function") {
    const _r2 = computeReachableWithPaths;
    computeReachableWithPaths = function (unit) {
      const res = _r2(unit);
      if (!res || !res.paths || !unit) return res;
      const keep = (list) => { const paths = {}; list.forEach((n) => { paths[n] = res.paths[n]; }); return Object.assign({}, res, { nodes: list, paths }); };
      if (pas(unit, "divingEntry") && unit.location === "bench") {
        const role = unit.owner === "p1" ? "entry_p1" : "entry_p2";
        const entries = BOARD_NODES.filter((n) => n.role === role).map((n) => n.id);
        const list = (res.nodes || []).filter((n) => !entries.includes(n) && entries.some((e) => (ADJ[e] || []).includes(n)));
        return keep(list.length ? list : (res.nodes || []));
      }
      if (pas(unit, "maxVital") && unit.location === "board") {
        const len = (n) => (res.paths[n] || []).length;
        const mx = Math.max(0, ...(res.nodes || []).map(len));
        return keep((res.nodes || []).filter((n) => len(n) === mx));
      }
      return res;
    };
  }
  // Bite Instinct: depois de mover, se há alvo, precisa atacar
  if (typeof finishPostMoveWithoutAttack === "function") {
    const _f = finishPostMoveWithoutAttack;
    const f2 = function () {
      const u = state.units.find((x) => x.uid === state.selectedUnitId);
      if (u && pas(u, "biteInstinct") && state.postMoveAttackMode && (state.attackTargets || []).length && !state.aiExecutingNow) { log(`🦷 ${u.name}: Bite Instinct — precisa atacar!`); try { playSfx("hit"); } catch (e) {} return; }
      return _f.apply(this, arguments);
    };
    try { finishPostMoveWithoutAttack = f2; } catch (e) {}
    window.finishPostMoveWithoutAttack = f2;
  }
  window.PDRAbilityActions = { A, RANGE2, PASSIVE, canAct, targetsFor, perform, range2Targets };
})();
