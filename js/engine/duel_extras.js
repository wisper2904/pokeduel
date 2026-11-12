// ============================================================================
// v712 · O que faltava para as últimas habilidades funcionarem
//  - TAG (tagging do original): em vez de batalhar, toque num aliado vizinho para curar as condições
//    especiais dele (e marcadores, com Soul-Heart). Termina o turno. Botão "💚 Tag".
//  - Marcador CHARGE (Thunder/Flame/Ice Charge): Soar com Charge ganha +1 MP e +30 de dano; no seu turno,
//    pelo botão ⚡ solte o Charge: o vizinho adversário e o que está atrás dele ficam paralisados/queimados/
//    congelados. Termina o turno.
//  - Plates novas do original: Twisted Spoon, Burn/Douse/Chill/Shock Drive, 11 "Power" e 8 "Energy".
//  - Habilidades: Spellbind, Open Sea Singer, Electromagnetic Barrier, Rocket Ride (ação), Permafrost,
//    King Spike, Barbed Horns, Ultra Stack, Psychic Amplifier/Meditative Alchemy (com Twisted Spoon),
//    Hoverjet, Black Core / White Noise / Blackout (Energy plates).
//  - O BOT passa a usar o botão de Habilidade, o Tag e o Charge.
// Carrega depois de plates_extra.js.
// ============================================================================
(function () {
  "use strict";
  if (typeof FIGURES_DB === "undefined") return;
  const tt = (k, fb) => (typeof t === "function" ? t(k, fb) : fb);
  const log = (s) => { try { setLogText(s); } catch (e) {} };
  const snd = (k) => { try { if (window.PDRSound) PDRSound.play(k); else playSfx("portal"); } catch (e) {} };
  const at = (n) => unitAtNode(n);
  const idOf = (u) => { const f = u && FIGURES_DB[u.baseIdx]; return f ? f.officialDuelId : null; };
  const on = (id) => (state.units || []).filter((u) => u.location === "board" && !u._abNull && idOf(u) === id);
  const isT = (u, t2) => abilityTypesMatch(u, t2);
  const stOf = (u) => abStatusOf(u);
  const fx = (u, col) => { try { if (u.location === "board") { const p = getNodePos(u.nodeId); spawnPortalParticles(p.x, p.y, col); } } catch (e) {} };
  const send = (pkt) => { try { if (state.mode === "p2p" && typeof sendP2PPacket === "function") sendP2PPacket(pkt); } catch (e) {} };
  const bfsDist = (a, b) => abDist({ location: "board", nodeId: a }, { location: "board", nodeId: b });

  // ======================================================================= TAG
  function tagBlockedFor(tagger, target) {
    // Barbed Horns: o adversário não pode tag; King Spike: vizinhos adversários não tag nem são tagged
    const opp = (u) => (u.owner === "p1" ? "p2" : "p1");
    if (state.units.some((k) => k.owner === opp(tagger) && k.location === "board" && !k._abNull && idOf(k) === 537)) return true;
    if (state.units.some((k) => k.owner === opp(tagger) && k.location === "board" && !k._abNull && idOf(k) === 561 && (abilityAdjacent(k, tagger) || abilityAdjacent(k, target)))) return true;
    return false;
  }
  function permafrostKeeps(u) { return stOf(u) === "freeze" && state.units.some((k) => k.location === "board" && !k._abNull && idOf(k) === 447 && !abHasStatus(k) && abDist(k, u) <= 2); }
  const MARKER_TAGGERS = [352]; // Soul-Heart (Magearna): remove marcadores também
  function tagTargets(u) {
    if (!u || u.location !== "board" || (u.waitTurns || 0) > 0) return [];
    if (["sleep", "freeze"].includes(stOf(u))) return [];
    return (ADJ[u.nodeId] || []).filter((n) => {
      const o = at(n);
      if (!o || o.owner !== u.owner || o === u) return false;
      if (tagBlockedFor(u, o)) return false;
      const hasCond = abHasStatus(o) && !permafrostKeeps(o);
      const hasMark = MARKER_TAGGERS.includes(idOf(u)) && (o._cracked || o._lockOn || o._curse);
      return hasCond || hasMark;
    });
  }
  function doTag(u, o, remote) {
    const cured = stOf(o);
    o.condition = PokemonCondition.Normal;
    if (MARKER_TAGGERS.includes(idOf(u))) { o._cracked = false; o._lockOn = false; o._curse = false; }
    fx(o, "#4ade80"); snd("cured");
    log(`💚 ${u.name} fez Tag em ${o.name}${cured ? " e curou " + cured : ""}!`);
    if (!remote) send({ type: "P2P_TAG", tagger: u.uid, target: o.uid });
  }
  function canTagNow(u) {
    if (!u || u.owner !== state.turn || state.isAnimating) return false;
    if (typeof canControlTurn === "function" && !canControlTurn() && !state.aiExecutingNow) return false;
    // antes de mover, ou logo depois de mover (no lugar do ataque)
    if (state.postMoveAttackMode && state.selectedUnitId !== u.uid) return false;
    if (!state.postMoveAttackMode && state.__abLastMoveTurn === state.turnCounter) return false;
    return tagTargets(u).length > 0;
  }
  function finishTagTurn() {
    state.selectedUnitId = null; state.reachableNodes = []; state.attackTargets = [];
    if (state.postMoveAttackMode && typeof finishPostMoveWithoutAttack === "function") { const save = state.aiExecutingNow; state.aiExecutingNow = true; try { finishPostMoveWithoutAttack(); } finally { state.aiExecutingNow = save; } }
    else endTurn(true);
  }
  function tagBtn() {
    let b = document.getElementById("tag-act-btn");
    if (!b) {
      b = document.createElement("button"); b.id = "tag-act-btn";
      b.style.cssText = "position:fixed;z-index:240;left:50%;transform:translateX(-50%);display:none;border-radius:10px;border:2px solid #dcfce7;background:linear-gradient(180deg,#4ade80,#15803d);color:#052e16;font-weight:900;font-size:13px;padding:7px 16px;box-shadow:0 4px 14px rgba(0,0,0,.7);cursor:pointer;white-space:nowrap";
      b.onclick = (e) => {
        e.stopPropagation();
        const u = state.units.find((x) => x.uid === state.selectedUnitId);
        if (state.__tagMode) { state.__tagMode = null; state.reachableNodes = []; return; }
        if (!canTagNow(u)) return;
        const tg = tagTargets(u);
        state.__tagMode = { uid: u.uid, targets: tg }; state.reachableNodes = tg.slice(); state.reachablePaths = {};
        snd("plate_sel"); log(`💚 ${tt("tag.pick", "Toque no aliado vizinho para fazer Tag (cura as condições).")}`);
      };
      document.body.appendChild(b);
    }
    return b;
  }
  setInterval(() => {
    try {
      const b = tagBtn();
      const dr = document.getElementById("drawer-modal"), ov = document.getElementById("wheel-overlay");
      const u = state && state.units && state.units.find((x) => x.uid === state.selectedUnitId);
      const show = !!(u && !(dr && dr.classList.contains("show")) && !(ov && ov.classList.contains("show")) && (state.__tagMode || canTagNow(u)));
      if (!show) { b.style.display = "none"; if (state && state.__tagMode && (!u || state.__tagMode.uid !== u.uid)) state.__tagMode = null; return; }
      b.textContent = state.__tagMode ? "✕ " + tt("tag.cancel", "Cancelar Tag") : "💚 Tag";
      const c = document.getElementById("board-canvas"); if (c) { const r = c.getBoundingClientRect(); const ab = document.getElementById("ab-act-btn"); const up = ab && ab.style.display === "block" ? 44 : 0; b.style.top = Math.round(r.top + r.height * (440 / 530) - up) + "px"; }
      b.style.display = "block";
    } catch (e) {}
  }, 250);
  if (typeof onNodeClicked === "function") {
    const _c = onNodeClicked;
    const c2 = function (nodeId) {
      const m = state.__tagMode;
      if (m) {
        state.__tagMode = null; state.reachableNodes = [];
        const u = state.units.find((x) => x.uid === m.uid), o = at(nodeId);
        if (u && o && m.targets.includes(nodeId)) { doTag(u, o); finishTagTurn(); return; }
        log(tt("tag.cancelled", "Tag cancelado."));
        return;
      }
      return _c.apply(this, arguments);
    };
    try { onNodeClicked = c2; } catch (e) {}
  }

  // ======================================================================= CHARGE
  const CHARGE_ST = { "Thunder Charge": "paralyze", "Flame Charge": "burn", "Ice Charge": "freeze" };
  function chargeOf(spinChosen) {
    if (!spinChosen) return null;
    const nm = String(spinChosen.name || "").replace(/\*$/, "");
    if (CHARGE_ST[nm]) return CHARGE_ST[nm];
    if (/charge marker/i.test(spinChosen.effectText || "")) return "paralyze";
    return null;
  }
  const SOAR = [269, 271, 274];
  function chargeBehind(u, tgt) {
    // "a Pokémon atrás": vizinho do alvo a 2 passos de u, na direção oposta
    return (ADJ[tgt.nodeId] || []).map(at).filter((x) => x && x !== u && x.owner !== u.owner && abDist(x, u) === 2);
  }

  // ======================================================================= PLATES NOVAS
  const POWER = [["flamepower", "Flame Power", "Fire"], ["splashpower", "Splash Power", "Water"], ["meadowpower", "Meadow Power", "Grass"], ["zappower", "Zap Power", "Electric"],
    ["mindpower", "Mind Power", "Psychic"], ["toxicpower", "Toxic Power", "Poison"], ["dracopower", "Draco Power", "Dragon"], ["claypower", "Clay Power", "Ground"],
    ["spookypower", "Spooky Power", "Ghost"], ["ironpower", "Iron Power", "Steel"], ["dreadpower", "Dread Power", "Dark"]];
  const DRIVE = { burndrive: ["Burn Drive", ["Grass", "Ice", "Bug", "Steel"]], dousedrive: ["Douse Drive", ["Fire", "Ground", "Rock"]],
    chilldrive: ["Chill Drive", ["Grass", "Ground", "Flying", "Dragon"]], shockdrive: ["Shock Drive", ["Water", "Flying"]] };
  const ENERGY = {
    flameenergy: ["Flame Energy", "Durante o duelo, seus Pokémon de Fogo não podem ser congelados nem queimados. Seu turno acaba.", true],
    tropicalenergy: ["Tropical Energy", "Remove as condições especiais dos seus Pokémon Planta, Voador e Inseto.", false],
    darkenergy: ["Dark Energy", "Durante o duelo, se o oponente da batalha for Psíquico, seus Pokémon Noturnos não são nocauteados na batalha.", false],
    phantomenergy: ["Phantom Energy", "Durante o duelo, seus Pokémon Fantasma podem passar por cima de Pokémon com condição especial no movimento.", false],
    steelenergy: ["Steel Energy", "Durante o duelo, seus Pokémon de Aço não podem ficar envenenados.", false],
    muscleenergy: ["Muscle Energy", "Remove sono, congelamento e Espera de todos os seus Pokémon Lutador.", false],
    electroenergy: ["Electro Energy", "Remove a paralisia de todos os seus Pokémon Elétricos.", false],
    moltingenergy: ["Molting Energy", "Durante o duelo, quando seus Pokémon Inseto ou Voador voltam do P.C. ao banco, eles podem evoluir.", false]
  };
  const NEWP = [
    { id: "twistedspoon", name: "Twisted Spoon", rarity: "R", badge: "★+1", target: "psychic", sub: "Escolha um Pokémon Psíquico seu no campo. Enquanto ele estiver no campo, ganha ★+1 (e Psychic Amplifier passa a ter Alcance 2). Seu turno acaba." }
  ];
  Object.keys(DRIVE).forEach((k) => NEWP.push({ id: k, name: DRIVE[k][0], rarity: "R", badge: "DRIVE", target: "genesect",
    sub: `Escolha seu Genesect no campo ou no banco. Neste turno, se ele tirar Miss, passa para o ataque ao lado; se nocautear um Pokémon ${DRIVE[k][1].join("/")}, esse Pokémon é excluído do duelo.` }));
  POWER.forEach(([id, nm, tp]) => NEWP.push({ id, name: nm, rarity: "C", badge: "+20", target: null, ptype: tp,
    sub: `Seus Pokémon do tipo ${tp} causam +20 de dano até um Pokémon adversário ser nocauteado por um ataque ${tp}. Seu turno acaba.` }));
  Object.keys(ENERGY).forEach((k) => NEWP.push({ id: k, name: ENERGY[k][0], rarity: "R", badge: "ENERGY", target: null, energy: true, sub: ENERGY[k][1] }));
  if (typeof BASE_PLATE_CATALOG !== "undefined") NEWP.forEach((p) => { if (!BASE_PLATE_CATALOG.find((x) => x.id === p.id)) BASE_PLATE_CATALOG.push(p); });
  // ícones
  const TCOL = { Fire: "#f97316", Water: "#38bdf8", Grass: "#4ade80", Electric: "#facc15", Psychic: "#ec4899", Poison: "#a855f7", Dragon: "#6366f1", Ground: "#d97706", Ghost: "#7c3aed", Steel: "#94a3b8", Dark: "#475569" };
  function icon(c1, glyph) {
    const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112"><path d="M56 6 L100 31 L100 81 L56 106 L12 81 L12 31 Z" fill="#0f172a" stroke="#e2e8f0" stroke-width="4"/><path d="M56 16 L91 36 L91 76 L56 96 L21 76 L21 36 Z" fill="${c1}"/><text x="56" y="70" font-size="40" font-family="Arial,sans-serif" font-weight="900" text-anchor="middle" fill="#0f172a">${glyph}</text></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  }
  if (typeof BANANA_PLATE_SPRITES !== "undefined") {
    BANANA_PLATE_SPRITES.twistedspoon = BANANA_PLATE_SPRITES.twistedspoon || icon("#ec4899", "🥄");
    Object.keys(DRIVE).forEach((k) => { BANANA_PLATE_SPRITES[k] = BANANA_PLATE_SPRITES[k] || icon({ burndrive: "#f97316", dousedrive: "#38bdf8", chilldrive: "#a5f3fc", shockdrive: "#facc15" }[k], "⚙"); });
    POWER.forEach(([id, , tp]) => { BANANA_PLATE_SPRITES[id] = BANANA_PLATE_SPRITES[id] || icon(TCOL[tp], "+20"); });
    Object.keys(ENERGY).forEach((k) => { BANANA_PLATE_SPRITES[k] = BANANA_PLATE_SPRITES[k] || icon("#fde047", "⚡"); });
  }
  // o backup de plates salvas (plates_extra) restaura as novas também
  try {
    const bk = JSON.parse(localStorage.getItem("pdr_plates_full_v706") || "null");
    if (Array.isArray(bk) && bk.length) saveEquippedPlateIds(bk);
    enforceStrict6CostPlates();
  } catch (e) {}

  const X = () => (state.__x712 = state.__x712 || { power: { p1: {}, p2: {} }, energy: { p1: {}, p2: {} }, drive: {} });
  const energyOn = (owner, k) => !!X().energy[owner][k] && !state.units.some((u) => u.location === "board" && !u._abNull && idOf(u) === 358);
  function isPlateId(id) { return NEWP.some((p) => p.id === id); }
  function plateTargetOk(id, u) {
    const p = NEWP.find((x) => x.id === id);
    if (!p || !p.target) return true;
    if (!u || u.owner !== state.turn) return false;
    if (p.target === "psychic") return u.location === "board" && isT(u, ["Psychic"]);
    if (p.target === "genesect") return /^Genesect/.test(u.name) && (u.location === "board" || u.location === "bench");
    return true;
  }
  function applyNewPlate(id, unit, owner, remote) {
    const who = remote ? tt("px.opp", "Oponente") : tt("px.you", "Você");
    const p = NEWP.find((x) => x.id === id);
    let ends = false;
    if (id === "twistedspoon") { unit._spoon = true; fx(unit, "#ec4899"); log(`🥄 ${who}: Twisted Spoon em ${unit.name} — ★+1 enquanto estiver no campo!`); ends = true; }
    else if (DRIVE[id]) { X().drive[unit.uid] = { turn: state.turnCounter, types: DRIVE[id][1] }; fx(unit, "#facc15"); log(`⚙️ ${who}: ${DRIVE[id][0]} em ${unit.name}!`); }
    else if (p && p.ptype) { X().power[owner][p.ptype] = true; log(`💪 ${who}: ${p.name} — Pokémon ${p.ptype} com +20 de dano!`); ends = true; }
    else if (ENERGY[id]) {
      X().energy[owner][id] = true;
      const mine = state.units.filter((u) => u.owner === owner);
      if (id === "tropicalenergy") mine.forEach((u) => { if (isT(u, ["Grass", "Flying", "Bug"])) u.condition = PokemonCondition.Normal; });
      if (id === "muscleenergy") mine.forEach((u) => { if (isT(u, ["Fighting"])) { if (["sleep", "freeze"].includes(stOf(u))) u.condition = PokemonCondition.Normal; u.waitTurns = 0; } });
      if (id === "electroenergy") mine.forEach((u) => { if (isT(u, ["Electric"]) && stOf(u) === "paralyze") u.condition = PokemonCondition.Normal; });
      log(`⚡ ${who}: ${ENERGY[id][0]}!`);
      ends = ENERGY[id][2];
    }
    snd("buff");
    return ends;
  }
  if (typeof confirmUseSelectedPlate === "function") {
    const _c = confirmUseSelectedPlate;
    const c2 = function () {
      try { syncActivePlayerPlates(); } catch (e) {}
      const p = state.plates[state.selectedPlateIdx || 0];
      if (!p || !isPlateId(p.id)) return _c.apply(this, arguments);
      if (!canControlTurn() || p.used || state.isAnimating) return;
      if (state.units.some((u) => u.owner !== state.turn && u.location === "board" && abilityHas(u, "blockOppPlates", null))) { log("🔇 Plates bloqueadas pela Habilidade do oponente."); return; }
      togglePlatesTray(false);
      const def = NEWP.find((x) => x.id === p.id);
      const go = (unit) => {
        markPlateUsedForCurrentOwner(p, true);
        try { renderPlatesTray(); } catch (e) {}
        const ends = applyNewPlate(p.id, unit, state.turn, false);
        send({ type: "P2P_PLATE2", plateId: p.id, unitUid: unit && unit.uid, owner: state.turn, ends });
        if (ends) endTurn(true);
      };
      if (!def.target) { go(null); return; }
      const sel = state.units.find((u) => u.uid === state.selectedUnitId);
      if (sel && plateTargetOk(p.id, sel)) { go(sel); return; }
      if (!state.units.some((u) => plateTargetOk(p.id, u))) { log(tt("px2.none", "⚠️ Nenhum Pokémon seu pode receber esta Plate agora.")); return; }
      state.pendingPlateAction = "px2:" + p.id; state.__px2Idx = state.selectedPlateIdx || 0; state.__px2Go = go;
      log(`🎴 ${p.name}: ${tt("px.tap_target", "toque no Pokémon que vai receber a carta.")}`);
    };
    try { confirmUseSelectedPlate = c2; } catch (e) {}
    window.confirmUseSelectedPlate = c2;
  }
  if (typeof selectUnit === "function") {
    const _s = selectUnit;
    const s2 = function (uid) {
      const pend = state.pendingPlateAction;
      if (typeof pend === "string" && pend.indexOf("px2:") === 0) {
        const id = pend.slice(4), u = state.units.find((x) => x.uid === uid);
        if (u && plateTargetOk(id, u)) { state.pendingPlateAction = null; const go = state.__px2Go; state.__px2Go = null; if (go) go(u); return; }
      }
      return _s.apply(this, arguments);
    };
    try { selectUnit = s2; } catch (e) {}
  }
  if (typeof handleP2PPacket === "function") {
    const _h = handleP2PPacket;
    const h2 = function (raw) {
      let msg = raw;
      if (typeof raw === "string") { try { msg = JSON.parse(raw); } catch (e) { return _h.apply(this, arguments); } }
      if (msg && msg.type === "P2P_PLATE2") { const u = state.units.find((x) => x.uid === msg.unitUid); applyNewPlate(msg.plateId, u, msg.owner, true); return; }
      if (msg && msg.type === "P2P_TAG") { const u = state.units.find((x) => x.uid === msg.tagger), o = state.units.find((x) => x.uid === msg.target); if (u && o) doTag(u, o, true); return; }
      if (msg && msg.type === "P2P_CHARGE") { (msg.units || []).forEach((d) => { const x = state.units.find((y) => y.uid === d.uid); if (x) { x.condition = d.condition; x._charge = d.charge; } }); return; }
      return _h.apply(this, arguments);
    };
    try { handleP2PPacket = h2; } catch (e) {}
    window.handleP2PPacket = h2;
  }

  // ======================================================================= efeitos na roleta / batalha
  if (typeof getActiveWheel === "function") {
    const _g = getActiveWheel;
    getActiveWheel = function (unit) {
      const segs = _g(unit);
      if (!Array.isArray(segs) || !unit) return segs;
      let add = 0, stars = 0;
      if (unit._spoon && unit.location === "board") stars += 1;
      if (unit._charge && SOAR.includes(idOf(unit)) && !unit._abNull) add += 30;
      if (X().power[unit.owner]) Object.keys(X().power[unit.owner]).forEach((tp) => { if (X().power[unit.owner][tp] && isT(unit, [tp])) add += 20; });
      // Open Sea Singer: Round × nº de Pokémon seus em campo com Round/Sing
      let roundMult = 0;
      if (state.units.some((k) => k.owner === unit.owner && k.location === "board" && !k._abNull && idOf(k) === 350 && !abHasStatus(k))) {
        roundMult = state.units.filter((k) => k.owner === unit.owner && k.location === "board" && ((FIGURES_DB[k.baseIdx] || {}).wheel || []).some((w) => /^(Round|Sing)/.test(w.name || ""))).length;
      }
      if (!add && !stars && roundMult < 2) return segs;
      return segs.map((s) => {
        if (!s || s.isZMove) return s;
        const o = Object.assign({}, s);
        if ((o.color === "white" || o.color === "gold") && o.dmg > 0) { o.dmg += add; if (roundMult >= 2 && /^Round/.test(o.name || "")) o.dmg *= roundMult; }
        if (o.color === "purple" && stars) o.stars = (o.stars || 1) + stars;
        return o;
      });
    };
  }
  if (typeof getEffectiveUnitMp === "function") {
    const _mp = getEffectiveUnitMp;
    getEffectiveUnitMp = function (unit) {
      let mp = _mp(unit);
      if (unit && unit._charge && SOAR.includes(idOf(unit)) && !unit._abNull) mp = Math.min(4, mp + 1);
      return mp;
    };
  }
  // Ultra Stack: Azuis dos seus Pokémon de Aço não viram Miss por Habilidades até a 1ª batalha dele
  if (typeof abilityHas === "function") {
    const _ah = abilityHas;
    abilityHas = function (unit, k, opp, nullified) {
      if (k === "oppBlueMiss" && opp && isT(opp, ["Steel"]) && state.units.some((s) => s.owner === opp.owner && s.location === "board" && !s._abNull && idOf(s) === 523 && !s._abBattled)) return null;
      return _ah(unit, k, opp, nullified);
    };
  }
  // imunidades das Energy plates
  if (typeof abilityImmuneTo === "function") {
    const _im = abilityImmuneTo;
    abilityImmuneTo = function (unit, eff, isNull) {
      if (_im(unit, eff, isNull)) return true;
      if (!unit) return false;
      const st = typeof abStatusFromEffect === "function" ? abStatusFromEffect(eff) : eff;
      if ((st === "burn" || st === "freeze") && isT(unit, ["Fire"]) && energyOn(unit.owner, "flameenergy")) return true;
      if ((st === "poison" || st === "badpoison") && isT(unit, ["Steel"]) && energyOn(unit.owner, "steelenergy")) return true;
      return false;
    };
  }
  // Phantom Energy: Fantasmas passam por cima de Pokémon com condição
  if (typeof abJumpAllowed === "function") {
    const _j = abJumpAllowed;
    abJumpAllowed = function (mover, occ) {
      if (_j(mover, occ)) return true;
      return !!(occ && isT(mover, ["Ghost"]) && abHasStatus(occ) && energyOn(mover.owner, "phantomenergy"));
    };
  }
  if (typeof evaluateCombat === "function") {
    const _e = evaluateCombat;
    evaluateCombat = function (atk, def, as, ds) {
      // Drive: Miss passa para o ataque ao lado neste turno
      if (as && ds && as.chosen && ds.chosen) [[atk, as], [def, ds]].forEach(([u, sp]) => {
        const d = X().drive[u.uid];
        if (d && d.turn === state.turnCounter && sp.chosen.color === "red" && Array.isArray(sp.segs) && sp.segs.length > 1 && typeof sp.chosenIdx === "number" && !sp.chosen._drv) {
          const nx = sp.segs[(sp.chosenIdx + 1) % sp.segs.length]; if (nx && nx.color !== "red") sp.chosen = Object.assign({}, nx, { _drv: true });
        }
      });
      const out = _e.apply(this, arguments);
      if (!out || !as || !ds || !("multiHits" in as)) return out;
      const pend = (fn) => { state.__sliceFxPending = state.__sliceFxPending || []; state.__sliceFxPending.push(fn); };
      // Charge marker
      [[atk, as], [def, ds]].forEach(([u, sp]) => { const st = chargeOf(sp.chosen); if (st) pend(() => { if (u.location === "board") { u._charge = true; u._chargeSt = st; log(`🔋 ${u.name} ganhou um marcador Charge!`); } }); });
      if (out.winner === "atk" || out.winner === "def") {
        const winU = out.winner === "atk" ? atk : def, loseU = out.winner === "atk" ? def : atk;
        const eff = out.effect || "ko";
        // Dark Energy
        if (eff === "ko" && isT(loseU, ["Dark"]) && isT(winU, ["Psychic"]) && energyOn(loseU.owner, "darkenergy")) { out.winner = "none"; out.reason = (out.reason || "") + " 🌑 Dark Energy!"; return out; }
        if (eff === "ko") {
          const d = X().drive[winU.uid];
          if (d && d.turn === state.turnCounter && isT(loseU, d.types)) out.effect = "banish";
          // Power: acaba quando um adversário é nocauteado por um ataque do tipo
          const pw = X().power[winU.owner];
          if (pw) Object.keys(pw).forEach((tp) => { if (pw[tp] && isT(winU, [tp])) pend(() => { pw[tp] = false; log(`💪 ${tp} Power acabou.`); }); });
          // Hoverjet: Drive usada volta a poder ser usada
          if (idOf(loseU) === 235 && !loseU._abNull) pend(() => { const pl = (state.plates || []).find((x) => DRIVE[x.id] && (loseU.owner === "p2" ? x.usedP2 : x.usedP1)); if (pl) { if (loseU.owner === "p2") pl.usedP2 = false; else pl.usedP1 = false; pl.used = false; log(`⚙️ Hoverjet: ${pl.name} pode ser usada de novo!`); } });
        }
      }
      return out;
    };
  }

  // ======================================================================= Spellbind / Energy / Twisted Spoon ao sair
  const spellbound = () => on(197).length > 0;
  if (typeof abilityAfterEffect === "function") {
    const _af = abilityAfterEffect;
    abilityAfterEffect = function (unit) {
      const keep = unit && spellbound() && stOf(unit) === "sleep";
      const r = _af.apply(this, arguments);
      if (keep && unit.condition !== PokemonCondition.Sleep) unit.condition = PokemonCondition.Sleep;
      return r;
    };
  }
  if (typeof executeMove === "function") {
    const _m = executeMove;
    executeMove = function (uid) {
      const u = state.units.find((x) => x.uid === uid);
      const fromBench = !!(u && u.location === "bench");
      const sleepers = spellbound() ? state.units.filter((x) => stOf(x) === "sleep") : [];
      const r = _m.apply(this, arguments);
      // Spellbind: o sono não é removido por outras Habilidades (Refreshing Aroma, Purification…)
      sleepers.forEach((x) => { if (x.location === "board" && x.condition === PokemonCondition.Normal) x.condition = PokemonCondition.Sleep; });
      // White Noise / Blackout: efeitos das Energy plates acabam e elas contam como usadas
      if (u && fromBench && [404, 414].includes(idOf(u)) && !u._abNull) {
        X().energy = { p1: {}, p2: {} };
        (state.plates || []).forEach((p) => { if (ENERGY[p.id]) { p.usedP1 = true; p.usedP2 = true; p.used = true; } });
        log(`📴 ${u.name}: os efeitos das Energy plates acabaram!`);
      }
      return r;
    };
  }
  if (typeof endTurn === "function") {
    const _end = endTurn;
    endTurn = function () {
      const locs = new Map((state.units || []).map((u) => [u, u.location]));
      const r = _end.apply(this, arguments);
      try {
        state.units.forEach((u) => {
          if (u.location !== "board") { u._spoon = false; u._charge = false; }
          // Molting Energy: Inseto/Voador voltando do P.C. evolui
          if (locs.get(u) === "pc" && u.location === "bench" && isT(u, ["Bug", "Flying"]) && energyOn(u.owner, "moltingenergy") && typeof applyUnitEvolutionNow === "function") { u._justEvolvedTurn = -1; applyUnitEvolutionNow(u); }
        });
      } catch (e) {}
      return r;
    };
  }
  if (typeof demoFullMatchState === "function") {
    const _d = demoFullMatchState;
    demoFullMatchState = function () { const r = _d.apply(this, arguments); state.__x712 = null; try { state.units.forEach((u) => { u._spoon = false; u._charge = false; }); } catch (e) {} return r; };
  }

  // ======================================================================= ações novas no botão ⚡ (Charge, Rocket Ride)
  const AA = window.PDRAbilityActions;
  if (AA) {
    const _actOf = AA.actOf, _tf = AA.targetsFor, _pf = AA.perform, _ca = AA.canAct;
    const CHARGE_ACT = { k: "chargeRelease", label: "Charge", ends: true };
    const ROCKET = { k: "rocketRide", label: "Rocket Ride", ends: true };
    AA.actOf = function (u) {
      if (u && u._charge && u.location === "board") return CHARGE_ACT;
      if (u && idOf(u) === 415 && !u._abNull && u.location === "board") return ROCKET;
      return _actOf ? _actOf(u) : null;
    };
    AA.targetsFor = function (u, a) {
      if (a && a.k === "chargeRelease") return (ADJ[u.nodeId] || []).filter((n) => { const o = at(n); return o && o.owner !== u.owner; });
      if (a && a.k === "rocketRide") {
        if (u.__rrPick) { return BOARD_NODES.map((n) => n.id).filter((n) => !at(n) && bfsDist(u.nodeId, n) === 3); }
        return (ADJ[u.nodeId] || []).filter((n) => !!at(n));
      }
      // Electromagnetic Barrier: não é alvo de efeitos que mandam girar
      const list = _tf(u, a);
      if (a && a.k === "spinAt") return list.filter((n) => { const o = at(n); return !(o && idOf(o) === 355 && !o._abNull); });
      return list;
    };
    AA.canAct = function (u) {
      const a = AA.actOf(u);
      if (a && (a.k === "chargeRelease" || a.k === "rocketRide")) {
        if (!u || u.owner !== state.turn || (u.waitTurns || 0) > 0 || state.isAnimating || state.postMoveAttackMode) return false;
        if (typeof canControlTurn === "function" && !canControlTurn() && !state.aiExecutingNow) return false;
        if (state.__abLastMoveTurn === state.turnCounter && a.k === "rocketRide") return false;
        if (["sleep", "freeze"].includes(stOf(u))) return false;
        return AA.targetsFor(u, a).length > 0;
      }
      return _ca(u);
    };
    AA.perform = function (u, a, node) {
      if (a.k === "chargeRelease") {
        const o = at(node); if (!o) return false;
        const st = u._chargeSt || "paralyze";
        const hit = [o].concat(chargeBehind(u, o));
        hit.forEach((x) => { if (!abilityImmuneTo(x, st) && ABIL_STATUS_TO_COND[st]) x.condition = PokemonCondition[ABIL_STATUS_TO_COND[st]]; fx(x, st === "burn" ? "#f97316" : st === "freeze" ? "#a5f3fc" : "#facc15"); });
        u._charge = false;
        log(`🔋 ${u.name} soltou o Charge: ${hit.map((x) => x.name).join(", ")} → ${st}!`);
        snd("ab_pos");
        send({ type: "P2P_CHARGE", units: hit.concat([u]).map((x) => ({ uid: x.uid, condition: x.condition, charge: !!x._charge })) });
        state.selectedUnitId = null; endTurn(true); return true;
      }
      if (a.k === "rocketRide") {
        if (!u.__rrPick) {
          u.__rrPick = node;
          const tg = AA.targetsFor(u, a);
          if (!tg.length) { u.__rrPick = null; log("Rocket Ride: nenhuma casa livre a 3 passos."); return false; }
          state.__abMode = { uid: u.uid, targets: tg }; state.reachableNodes = tg.slice(); state.reachablePaths = {};
          log("🚀 Rocket Ride: agora toque na casa a 3 passos para onde o Pokémon vai.");
          return true;
        }
        const o = at(u.__rrPick); u.__rrPick = null;
        if (!o || at(node)) return false;
        o.nodeId = node;
        banishToUltraSpace(u);
        log(`🚀 ${u.name}: Rocket Ride lançou ${o.name} e foi para o Ultra Space!`);
        snd("ab_pos");
        if (state.mode === "p2p" && typeof sendP2PPacket === "function") sendP2PPacket({ type: "P2P_ABILITY", units: [o, u].map((x) => ({ uid: x.uid, location: x.location, nodeId: x.nodeId, waitTurns: x.waitTurns, condition: x.condition })) });
        state.selectedUnitId = null; endTurn(true); return true;
      }
      return _pf(u, a, node);
    };
    window.PDRAbilityActions = AA;
  }

  // ======================================================================= BOT usa Habilidades, Tag e Charge
  function oppGoal(owner) { return owner === "p1" ? 3 : 10; }
  function myGoal(owner) { return owner === "p1" ? 10 : 3; }
  function distTo(n, g) { return (typeof NODE_BFS_DIST !== "undefined" && NODE_BFS_DIST[n]) ? NODE_BFS_DIST[n][g] : 9; }
  function bestNormalProgress(u) {
    try { const r = computeReachableWithPaths(u); const g = oppGoal(u.owner); return Math.min(99, ...((r && r.nodes) || []).map((n) => distTo(n, g))); } catch (e) { return 99; }
  }
  function botTry() {
    const prevExec = state.aiExecutingNow; state.aiExecutingNow = true;
    try { return botTryInner(); } finally { state.aiExecutingNow = prevExec; }
  }
  function botTryInner() {
    const owner = state.turn;
    const AAx = window.PDRAbilityActions;
    const mine = state.units.filter((u) => u.owner === owner && (u.location === "board" || u.location === "bench"));
    const threat = state.units.some((e) => e.owner !== owner && e.location === "board" && distTo(e.nodeId, myGoal(owner)) <= 2);
    let best = null, bestScore = 0;
    const consider = (score, fn, why) => { if (score > bestScore) { bestScore = score; best = { fn, why }; } };
    mine.forEach((u) => {
      // Tag: cura aliado dormindo/congelado/paralisado
      const tg = tagTargets(u);
      if (tg.length && u.location === "board" && state.__abLastMoveTurn !== state.turnCounter) {
        tg.forEach((n) => { const o = at(n); const s = stOf(o); const w = s === "sleep" || s === "freeze" ? 70 : s === "paralyze" || s === "badpoison" ? 45 : 25; consider(w, () => { doTag(u, o); finishTagTurn(); }, "Tag"); });
      }
      if (!AAx || !AAx.canAct(u)) return;
      const a = AAx.actOf(u); if (!a) return;
      const tgs = AAx.targetsFor(u, a); if (!tgs.length) return;
      const g = oppGoal(owner);
      const normal = bestNormalProgress(u);
      if (["warp", "dash", "hop", "chainHop", "raid"].includes(a.k)) {
        tgs.forEach((n) => {
          const d = distTo(n, g);
          if (d === 0) return consider(100000, () => AAx.perform(u, a, n), a.label + " → Goal");
          const gain = (normal - d);
          if (gain >= 1) consider(30 + gain * 20 + (a.k === "raid" ? 25 : 0), () => AAx.perform(u, a, n), a.label);
        });
      } else if (a.k === "goal" && threat && !at(myGoal(owner))) consider(400, () => AAx.perform(u, a, tgs[0]), a.label);
      else if (a.k === "spinAt") {
        tgs.forEach((n) => { const o = at(n); const near = o && distTo(o.nodeId, myGoal(owner)) <= 3; consider(near ? 90 : 20, () => AAx.perform(u, a, n), a.label); });
      } else if (a.k === "chargeRelease") {
        tgs.forEach((n) => { const o = at(n); consider(80 + (chargeBehind(u, o).length * 30), () => AAx.perform(u, a, n), "Charge"); });
      } else if (a.k === "swapAdj" || a.k === "swapAny" || a.k === "benchSwapIn") {
        tgs.forEach((n) => { const o = at(n); if (!o) return; const before = distTo(o.nodeId, g); const ub = u.location === "board" ? distTo(u.nodeId, g) : 9; if (o.owner === owner && before - ub >= 2) consider(35, () => AAx.perform(u, a, n), a.label); });
      }
    });
    if (best && bestScore >= 30) {
      log(`🤖 ${window.adaptiveAIOpponentName || "Bot"}: usou ${best.why}.`);
      state.aiExecutingNow = true;
      try { best.fn(); } catch (e) { console.warn("[bot ability]", e); } finally { state.aiExecutingNow = false; }
      return true;
    }
    return false;
  }
  if (typeof triggerPlayerAIMove === "function") {
    const _ai = triggerPlayerAIMove;
    const ai2 = function () {
      try {
        if (state.mode === "ai" && state.turn === "p2" && !state.isAnimating && !state.winCelebrationAnim && state.matchKind !== "tutorial") {
          if (state.postMoveAttackMode) {
            // depois de mover: Tag no lugar do ataque, se não houver ataque bom
            const sel = state.units.find((x) => x.uid === state.selectedUnitId);
            const tg = sel ? tagTargets(sel) : [];
            if (tg.length && !(state.attackTargets || []).length) { const o = at(tg[0]); state.aiExecutingNow = true; try { doTag(sel, o); finishTagTurn(); } finally { state.aiExecutingNow = false; } return; }
          } else if (state.__botAbTurn !== state.turnCounter) {
            state.__botAbTurn = state.turnCounter;
            if (botTry()) return;
          }
        }
      } catch (e) { console.warn("[bot ability]", e); }
      return _ai.apply(this, arguments);
    };
    try { triggerPlayerAIMove = ai2; } catch (e) {}
    window.triggerPlayerAIMove = ai2;
  }
  window.PDRExtras = { tagTargets, doTag, applyNewPlate, NEWP, botTry, canTagNow };
})();
