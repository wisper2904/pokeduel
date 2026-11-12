// ============================================================================
// v706 · Plates novas + Mega Plate refeita
// Mega Plate: agora Mega Evolui DE VERDADE (troca pela figura Mega oficial: arte, roleta e MP) por 7 turnos
// e volta à forma original sozinha (revertMegaEvolution). Se a figura não tem forma Mega, vira "Poder Mega":
// +30 de dano e ★+1 por 3 turnos. Precisa escolher a peça (toque nela depois de usar a carta).
// Novas (inspiradas nas plates do Pokémon Duel original): Full Heal, Focus Band, X Defend, X Sp. Atk,
// X Accuracy, Scoop Up, Desperate Times, Recycle.
// Carrega depois de duel_sfx.js (usa board.js, battle.js, ui.js, p2p_matchmaker.js).
// ============================================================================
(function () {
  "use strict";
  const tt = (k, fb) => (typeof t === "function" ? t(k, fb) : fb);
  const log = (s) => { try { setLogText(s); } catch (e) {} };
  const fx = (u, col) => { try { if (u && u.location === "board" && u.nodeId != null) { const n = getNodePos(u.nodeId); spawnPortalParticles(n.x, n.y, col); } } catch (e) {} };
  const snd = (n) => { try { if (window.PDRSound) PDRSound.play(n); else playSfx("portal"); } catch (e) {} };
  const send = (pkt) => { try { if (state.mode === "p2p" && typeof sendP2PPacket === "function") sendP2PPacket(Object.assign({ type: "P2P_PLATE", turn: state.turn }, pkt)); } catch (e) {} };

  // ---------------------------------------------------------------- catálogo
  const NEW = [
    { id: "fullheal", name: "Full Heal", rarity: "R", badge: "CURA", target: "own_field", sub: "Remove todas as condições especiais (sono, paralisia, veneno, queimadura, congelamento, confusão) de um Pokémon seu no campo." },
    { id: "focusband", name: "Focus Band", rarity: "R", badge: "FOCO", target: "own_any", sub: "Neste turno, o Pokémon escolhido não pode ser nocauteado em batalha." },
    { id: "xdefend", name: "X Defend", rarity: "UC", badge: "DEF", target: "own_any", sub: "Neste turno, o Pokémon escolhido não é nocauteado por ataques Brancos ou Dourados de 10 a 100 de dano." },
    { id: "xspatk", name: "X Sp. Atk", rarity: "EX", badge: "★+2", target: "own_any", sub: "Neste turno, os ataques Roxos do Pokémon escolhido ganham ★+2." },
    { id: "xaccuracy", name: "X Accuracy", rarity: "UC", badge: "MIRA", target: "own_any", sub: "Neste turno, se o Pokémon escolhido tirar Miss, o resultado passa para o ataque ao lado." },
    { id: "scoopup", name: "Scoop Up", rarity: "UC", badge: "VOLTA", target: "own_field", sub: "Devolve um Pokémon seu do campo para o banco, sem Espera." },
    { id: "desperate", name: "Desperate Times", rarity: "R", badge: "+50", target: "own_any", sub: "Neste turno, os ataques de 10 a 50 de dano do Pokémon escolhido causam +50." },
    { id: "recycle", name: "Recycle", rarity: "EX", badge: "♻", target: null, sub: "Todas as Plates dos dois jogadores (menos Recycle) podem ser usadas de novo. Seu turno acaba." }
  ];
  const MEGA_SUB = "Mega Evolui de verdade o Pokémon escolhido (forma Mega oficial: arte, roleta e MP) por 7 turnos. Se ele não tiver forma Mega: Poder Mega, +30 de dano e ★+1 por 3 turnos.";
  if (typeof BASE_PLATE_CATALOG !== "undefined") {
    const mp = BASE_PLATE_CATALOG.find((p) => p.id === "megaplate");
    if (mp) { mp.sub = MEGA_SUB; mp.target = "own_any"; }
    NEW.forEach((p) => { if (!BASE_PLATE_CATALOG.find((x) => x.id === p.id)) BASE_PLATE_CATALOG.push(p); });
  }
  if (state && Array.isArray(state.plates)) {
    const mp = state.plates.find((p) => p.id === "megaplate");
    if (mp) mp.sub = MEGA_SUB;
  }
  // Ícones das plates novas (SVG)
  const ICON = { fullheal: ["#22c55e", "#bbf7d0", "✚"], focusband: ["#ef4444", "#fecaca", "✊"], xdefend: ["#0ea5e9", "#bae6fd", "🛡"], xspatk: ["#a855f7", "#e9d5ff", "★"],
    xaccuracy: ["#f59e0b", "#fde68a", "◎"], scoopup: ["#14b8a6", "#99f6e4", "↩"], desperate: ["#f97316", "#fed7aa", "‼"], recycle: ["#84cc16", "#d9f99d", "♻"] };
  function svgIcon(c1, c2, glyph) {
    const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112"><defs><radialGradient id="g" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c1}"/></radialGradient></defs>
      <path d="M56 6 L100 31 L100 81 L56 106 L12 81 L12 31 Z" fill="#0f172a" stroke="#e2e8f0" stroke-width="4"/>
      <path d="M56 16 L91 36 L91 76 L56 96 L21 76 L21 36 Z" fill="url(#g)"/>
      <text x="56" y="72" font-size="46" font-family="Arial,sans-serif" font-weight="900" text-anchor="middle" fill="#0f172a">${glyph}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  }
  if (typeof BANANA_PLATE_SPRITES !== "undefined") Object.keys(ICON).forEach((k) => { if (!BANANA_PLATE_SPRITES[k]) BANANA_PLATE_SPRITES[k] = svgIcon.apply(null, ICON[k]); });
  // O ui.js valida as plates salvas ANTES deste arquivo adicionar as novas ao catálogo, apagando-as do save.
  // Guardamos uma cópia da lista em outra chave e restauramos aqui.
  const BK = "pdr_plates_full_v706";
  if (typeof saveEquippedPlateIds === "function") {
    const _sv = saveEquippedPlateIds;
    const sv2 = function (ids) {
      const r = _sv.apply(this, arguments);
      try { const list = Array.isArray(ids) ? ids : (state.plates || []).filter((p) => !p.disabledInDeck).map((p) => p.id); localStorage.setItem(BK, JSON.stringify(list.slice(0, 6))); } catch (e) {}
      return r;
    };
    try { saveEquippedPlateIds = sv2; } catch (e) {}
    window.saveEquippedPlateIds = sv2;
  }
  try {
    const bk = JSON.parse(localStorage.getItem(BK) || "null");
    if (Array.isArray(bk) && bk.length) saveEquippedPlateIds(bk);
  } catch (e) {}
  try { if (typeof enforceStrict6CostPlates === "function") enforceStrict6CostPlates(); } catch (e) {}

  // ---------------------------------------------------------------- efeitos
  const ST = () => (state.__px = state.__px || { focus: {}, xdef: {}, spatk: {}, acc: {}, desp: {} });
  const turnKey = () => state.turnCounter;
  const activeFor = (map, u) => !!(u && map[u.uid] === turnKey());

  function megaFormOf(unit) {
    if (typeof findFigureByName !== "function") return null;
    const base = String(unit.name).replace(/\s*\(N.\d+\)$/, "");
    if (/^Mega /.test(base)) return null;
    return findFigureByName("Mega " + base) || findFigureByName("Mega " + base + " X") || findFigureByName("Mega " + base + " Y");
  }
  function hasOtherMega(unit) { return state.units.some((u) => u !== unit && u.owner === unit.owner && ((u.megaTurns || 0) > 0)); }
  function realMega(unit, mf) {
    const idx = FIGURES_DB.indexOf(mf);
    unit.preMegaName = unit.name; unit.preMegaBaseIdx = unit.baseIdx; unit.preMegaBaseId = unit.baseId;
    unit.preMegaSpriteKey = unit.spriteKey; unit.preMegaMp = unit.mp; unit.preMegaRarity = unit.rarity; unit.preMegaType = unit.type;
    unit.preMegaEvoStep = unit.evoStep;
    unit.name = mf.name; unit.baseIdx = idx; unit.baseId = mf.id; unit.spriteKey = mf.spriteKey; unit.type = mf.type; unit.rarity = mf.rarity;
    unit.mp = mf.mp || unit.mp;
    unit.megaTurns = 7;
    unit.condition = PokemonCondition.Normal;
    try { if (window.Juice) Juice.onEvolution(unit, true); } catch (e) {}
  }
  function applyPlate(id, unit, remote) {
    const who = remote ? tt("px.opp", "Oponente") : tt("px.you", "Você");
    if (id === "megaplate") {
      const mf = megaFormOf(unit);
      if (mf && !hasOtherMega(unit)) { realMega(unit, mf); fx(unit, "#f472b6"); log(`🧬 ${who}: ${unit.preMegaName} Mega Evoluiu para ${unit.name} por 7 turnos!`); }
      else { unit.megaPowerTurns = 3; fx(unit, "#f472b6"); snd("buff"); log(`🧬 ${who}: Poder Mega em ${unit.name} — +30 de dano e ★+1 por 3 turnos!`); }
    } else if (id === "fullheal") {
      unit.condition = PokemonCondition.Normal; unit.markers = []; fx(unit, "#4ade80"); snd("cured"); log(`✚ ${who}: Full Heal curou ${unit.name}!`);
    } else if (id === "focusband") { ST().focus[unit.uid] = turnKey(); fx(unit, "#ef4444"); snd("buff"); log(`✊ ${who}: ${unit.name} não pode ser nocauteado neste turno (Focus Band)!`); }
    else if (id === "xdefend") { ST().xdef[unit.uid] = turnKey(); fx(unit, "#38bdf8"); snd("buff"); log(`🛡 ${who}: X Defend em ${unit.name} (aguenta ataques de 10–100)!`); }
    else if (id === "xspatk") { ST().spatk[unit.uid] = turnKey(); fx(unit, "#a855f7"); snd("buff"); log(`★ ${who}: X Sp. Atk — ataques Roxos de ${unit.name} com ★+2 neste turno!`); }
    else if (id === "xaccuracy") { ST().acc[unit.uid] = turnKey(); fx(unit, "#f59e0b"); snd("buff"); log(`◎ ${who}: X Accuracy em ${unit.name} — Miss passa para o ataque ao lado!`); }
    else if (id === "desperate") { ST().desp[unit.uid] = turnKey(); fx(unit, "#f97316"); snd("buff"); log(`‼ ${who}: Desperate Times — ataques de 10–50 de ${unit.name} com +50!`); }
    else if (id === "scoopup") {
      const used = state.units.filter((u) => u.owner === unit.owner && u.location === "bench").map((u) => u.benchSlot);
      let slot = 0; while (used.includes(slot)) slot++;
      fx(unit, "#14b8a6");
      unit.location = "bench"; unit.nodeId = null; unit.benchSlot = slot; unit.waitTurns = 0;
      snd("swap"); log(`↩ ${who}: Scoop Up — ${unit.name} voltou para o banco!`);
    }
  }
  function applyRecycle(remote) {
    state.plates.forEach((p) => { if (p.id !== "recycle") { p.used = false; p.usedP1 = false; p.usedP2 = false; } });
    if (Array.isArray(state.aiPlates)) state.aiPlates.forEach((p) => { if (p.id !== "recycle") p.used = false; });
    snd("item_get");
    log(`♻ ${remote ? tt("px.opp", "Oponente") : tt("px.you", "Você")}: Recycle — todas as Plates podem ser usadas de novo!`);
  }

  // Bônus na roleta
  if (typeof getActiveWheel === "function") {
    const _g = getActiveWheel;
    const g2 = function (unit) {
      const segs = _g.apply(this, arguments);
      if (!Array.isArray(segs) || !unit) return segs;
      const mpw = (unit.megaPowerTurns || 0) > 0, sp = activeFor(ST().spatk, unit), de = activeFor(ST().desp, unit);
      if (!mpw && !sp && !de) return segs;
      return segs.map((s) => {
        if (!s || s.isZMove) return s;
        const o = Object.assign({}, s);
        if ((o.color === "white" || o.color === "gold") && o.dmg > 0) {
          if (de && o.dmg >= 10 && o.dmg <= 50) o.dmg += 50;
          if (mpw) o.dmg += 30;
        }
        if (o.color === "purple") o.stars = (o.stars || 1) + (sp ? 2 : 0) + (mpw ? 1 : 0);
        return o;
      });
    };
    try { getActiveWheel = g2; } catch (e) {}
  }
  // Focus Band / X Defend / X Accuracy na batalha
  if (typeof evaluateCombat === "function") {
    const _ec = evaluateCombat;
    const ec = function (atk, def, as, ds) {
      [[atk, as], [def, ds]].forEach(([u, sp]) => {
        if (!sp || !sp.chosen || sp.chosen._accDone || !activeFor(ST().acc, u)) return;
        if (sp.chosen.color === "red" && Array.isArray(sp.segs) && typeof sp.chosenIdx === "number" && sp.segs.length > 1) {
          const nx = sp.segs[(sp.chosenIdx + 1) % sp.segs.length];
          if (nx && nx.color !== "red") sp.chosen = Object.assign({}, nx, { _accDone: true, name: nx.name + " (X Accuracy)" });
        }
      });
      const out = _ec.apply(this, arguments);
      if (!out || (out.winner !== "atk" && out.winner !== "def")) return out;
      const lose = out.winner === "atk" ? def : atk, winC = (out.winner === "atk" ? as : ds) || {};
      const eff = out.effect || "ko";
      const dmg = (winC.chosen && winC.chosen.dmg) || 0, col = winC.chosen && winC.chosen.color;
      if (eff === "ko" && activeFor(ST().focus, lose)) { out.winner = "none"; out.reason = (out.reason || "") + " ✊ Focus Band!"; }
      else if (eff === "ko" && activeFor(ST().xdef, lose) && (col === "white" || col === "gold") && dmg >= 10 && dmg <= 100) { out.winner = "none"; out.reason = (out.reason || "") + " 🛡 X Defend!"; }
      return out;
    };
    try { evaluateCombat = ec; } catch (e) {}
  }
  // Poder Mega acaba depois de 3 turnos do dono
  if (typeof endTurn === "function") {
    const _et = endTurn;
    const et = function () {
      try { state.units.forEach((u) => { if (u.owner === state.turn && (u.megaPowerTurns || 0) > 0) u.megaPowerTurns--; }); } catch (e) {}
      return _et.apply(this, arguments);
    };
    try { endTurn = et; } catch (e) {}
  }

  // ---------------------------------------------------------------- uso
  const MINE = new Set(["megaplate", "fullheal", "focusband", "xdefend", "xspatk", "xaccuracy", "scoopup", "desperate", "recycle"]);
  function validTarget(id, u) {
    if (!u || u.owner !== state.turn) return false;
    const def = (typeof BASE_PLATE_CATALOG !== "undefined" && BASE_PLATE_CATALOG.find((p) => p.id === id)) || {};
    if (def.target === "own_field" || id === "fullheal" || id === "scoopup") return u.location === "board";
    return u.location === "board" || u.location === "bench";
  }
  function finishUse(p, id, unit) {
    markPlateUsedForCurrentOwner(p, true);
    try { renderPlatesTray(); } catch (e) {}
    applyPlate(id, unit, false);
    send({ plateId: id, unitUid: unit.uid });
  }
  if (typeof confirmUseSelectedPlate === "function") {
    const _c = confirmUseSelectedPlate;
    const c2 = function () {
      try { syncActivePlayerPlates(); } catch (e) {}
      const p = state.plates[state.selectedPlateIdx || 0];
      if (!p || !MINE.has(p.id)) return _c.apply(this, arguments);
      if (!canControlTurn() || p.used || state.isAnimating) return;
      togglePlatesTray(false);
      if (p.id === "recycle") {
        markPlateUsedForCurrentOwner(p, true);
        applyRecycle(false);
        const nextT = state.turn === "p1" ? "p2" : "p1", nextC = Math.max(0, state.turnCounter - 1);
        send({ plateId: "recycle", nextTurn: nextT, nextTurnCounter: nextC });
        endTurn(false, nextT, nextC);
        return;
      }
      const sel = state.units.find((u) => u.uid === state.selectedUnitId);
      if (sel && validTarget(p.id, sel)) { finishUse(p, p.id, sel); return; }
      state.pendingPlateAction = "px:" + p.id;
      state.__pxPlateIdx = state.selectedPlateIdx || 0;
      snd("plate_sel");
      log(`🎴 ${tt("plate." + p.id + ".name", p.name)}: ${tt("px.tap_target", "toque no Pokémon que vai receber a carta.")}`);
    };
    try { confirmUseSelectedPlate = c2; } catch (e) {}
    window.confirmUseSelectedPlate = c2;
  }
  if (typeof selectUnit === "function") {
    const _s = selectUnit;
    const s2 = function (uid) {
      const pend = state.pendingPlateAction;
      if (typeof pend === "string" && pend.indexOf("px:") === 0) {
        const id = pend.slice(3), u = state.units.find((x) => x.uid === uid);
        if (u && validTarget(id, u)) {
          const p = state.plates[state.__pxPlateIdx || 0];
          state.pendingPlateAction = null;
          if (p && p.id === id && !p.used) finishUse(p, id, u);
          return;
        }
        if (u && u.owner !== state.turn) { log(tt("px.own_only", "⚠️ Escolha um Pokémon seu.")); return; }
      }
      return _s.apply(this, arguments);
    };
    try { selectUnit = s2; } catch (e) {}
  }
  // Oponente P2P usou uma das plates novas
  if (typeof handleP2PPacket === "function") {
    const _h = handleP2PPacket;
    const h2 = function (raw) {
      let msg = raw;
      if (typeof raw === "string") { try { msg = JSON.parse(raw); } catch (e) { return _h.apply(this, arguments); } }
      if (msg && msg.type === "P2P_PLATE" && MINE.has(msg.plateId)) {
        if (msg._fromPeer && typeof getMyUniquePeerId === "function" && msg._fromPeer === getMyUniquePeerId()) return;
        if (msg.plateId === "recycle") { applyRecycle(true); if (typeof applyExplicitTurn === "function") applyExplicitTurn(msg.nextTurn, msg.nextTurnCounter); return; }
        const u = state.units.find((x) => x.uid === msg.unitUid);
        if (u) applyPlate(msg.plateId, u, true);
        return;
      }
      return _h.apply(this, arguments);
    };
    try { handleP2PPacket = h2; } catch (e) {}
    window.handleP2PPacket = h2;
  }
  // Bot: a Mega Plate do bot também passa a ser Mega de verdade
  window.PDRPlates = { applyPlate, megaFormOf, NEW };
})();
