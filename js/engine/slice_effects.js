// ============================================================================
// v713 · Efeitos das fatias Roxas que ainda não faziam nada + marcadores + Trick Room
//  - Marcadores: MP −1 (String Wrap, Draining Wind, Glaciate, Icy Wind), Final Song (Belly Drum, Mind Blown),
//    Pumpkin (Trick-or-Treat), Imprisoned (Imprison). Tag remove marcadores; sair do campo também.
//  - Trick Room (5 turnos; Ultra Stack ×(X+1)): Dourado → Miss, MP≥3 → 1, MP≤1 → 3 (marcadores depois).
//  - King Spike / Barbed Horns: Dourado de quem tem marcador de MP vira Branco / Miss.
//  - Ultra Stack: Z-Move não quebra os Azuis dos seus Pokémon de Aço até a 1ª batalha do Stakataka.
//  - Fly, Fly Away, Teleport, Dig, Push Away, Overhead Toss, Flame Kinesis, Draining Wind (movimento);
//    Taunt, Energy Ball/Acid Spray, Baby-Doll Eyes, Leer, Imprison, Torment, Fake Sleep, Future Sight (roleta);
//    Explosion, Cyclone Kick, Rock Wrecker, Swinging Throw, Fissure, Mind Blown (nocaute);
//    Magic Coat, Mists/Synthesis/Belly Drum (dano), Tailwind, Smack Down, Plate Gnawing, Nasty Plot,
//    Sphere Trick, Mystery Scent, Dark Moon.
// Escolhas de casa são automáticas e determinísticas (iguais nos dois aparelhos no P2P).
// Carrega depois de duel_extras.js.
// ============================================================================
(function () {
  "use strict";
  if (typeof FIGURES_DB === "undefined") return;
  const tt = (k, fb, p) => { try { const v = typeof t === "function" ? t(k, p || {}) : null; return v && v !== k ? v : fb; } catch (e) { return fb; } };
  const log = (s) => { try { setLogText(s); } catch (e) {} };
  const at = (n) => unitAtNode(n);
  const idOf = (u) => { const f = u && FIGURES_DB[u.baseIdx]; return f ? f.officialDuelId : null; };
  const isT = (u, ts) => abilityTypesMatch(u, ts);
  const onB = (u) => !!(u && u.location === "board");
  const opp = (o) => (o === "p1" ? "p2" : "p1");
  const goalOf = (o) => (o === "p1" ? 3 : 10);
  const dist = (a, b) => (NODE_BFS_DIST[a] && NODE_BFS_DIST[a][b] != null ? NODE_BFS_DIST[a][b] : 99);
  const allNodes = () => BOARD_NODES.map((n) => n.id);
  const fx = (u, col) => { try { const p = getNodePos(u.nodeId); spawnPortalParticles(p.x, p.y, col); } catch (e) {} };
  const nm = (c) => String((c && c.name) || "").replace(/\*$/, "").replace(/ ➔ .*$/, "");
  const rng = (seed) => { let s = (seed >>> 0) || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  const TC = () => state.turnCounter || 0;
  const STATUSES = ["sleep", "poison", "badpoison", "burn", "freeze", "paralyze", "panic"];
  const G = () => (state.__sfx713 = state.__sfx713 || { trick: null, tail: null });

  // ------------------------------------------------ marcadores
  function mpMarker(u, n) {
    if (!u || !onB(u)) return;
    u._mpMk = Math.min(2, (u._mpMk || 0) + (n || 1));
    fx(u, "#64748b");
    log(tt("sfx.mp_marker", `🔻 ${u.name} recebeu um marcador MP −1!`, { name: u.name }));
  }
  function clearMarkers(u) { u._mpMk = 0; u._finalSong = null; u._pumpkin = false; u._imprison = null; }
  function hasMarker(u) { return !!(u && (u._mpMk || u._finalSong != null || u._pumpkin || u._imprison)); }
  window.PDRSlice = { mpMarker, clearMarkers, hasMarker };

  // Ultra Stack: multiplicador X+1 (X = Pokémon na Ultra Space)
  const ultraMult = (u) => (u && idOf(u) === 523 && !u._abNull) ? 1 + state.units.filter((x) => x.location === "ultra_space").length : 1;
  const trickOn = () => { const tr = G().trick; return !!(tr && TC() > tr.end); };

  // ------------------------------------------------ MP: Trick Room, marcadores, Tailwind
  if (typeof getEffectiveUnitMp === "function") {
    const _mp = getEffectiveUnitMp;
    getEffectiveUnitMp = function (u) {
      let mp = _mp.apply(this, arguments);
      if (!u || typeof mp !== "number") return mp;
      if (trickOn()) { if (mp >= 3) mp = 1; else if (mp <= 1) mp = 3; }
      const tw = G().tail;
      if (tw && tw.owner === u.owner && TC() >= tw.end && isT(u, ["Flying"])) mp = Math.min(4, mp + 1);
      if (u._mpMk) mp = Math.max(0, mp - u._mpMk);
      return mp;
    };
  }

  // ------------------------------------------------ Pumpkin / Smack Down na movimentação
  if (typeof abJumpAllowed === "function") {
    const _j = abJumpAllowed;
    abJumpAllowed = function (mover, occ) {
      if (mover && mover._smackBy && state.units.some((s) => s.uid === mover._smackBy && onB(s))) return false;
      if (occ && occ._pumpkin && occ !== mover) return true;
      return _j(mover, occ);
    };
  }

  // ------------------------------------------------ roleta: Trick Room, Energy Ball, Baby-Doll Eyes, Leer, Imprison, auras de dano
  const MISS = (s, why) => Object.assign({}, s, { color: "red", name: "Miss", dmg: 0, stars: 0, effect: undefined, _sfxMiss: why });
  function auraAdd(u) {
    let add = 0;
    state.units.forEach((s) => {
      if (!onB(s) || s.owner !== u.owner || !s._aura) return;
      if (s._aura.types.length === 0 || isT(u, s._aura.types)) add += s._aura.add;
    });
    if (u._bellyDrum && onB(u)) add += 50;
    return add;
  }
  if (typeof getActiveWheel === "function") {
    const _g = getActiveWheel;
    getActiveWheel = function (u) {
      const segs = _g.apply(this, arguments);
      if (!Array.isArray(segs) || !u) return segs;
      const tc = TC();
      const ebOn = u._ebBy && state.units.some((s) => s.uid === u._ebBy && onB(s)) && onB(u);
      const bde = u._bdeUntil != null && tc >= u._bdeUntil;
      const leer = u._leer && tc >= u._leer.until ? u._leer.name : null;
      const add = auraAdd(u);
      const tr = trickOn();
      if (!ebOn && !bde && !leer && !u._imprison && !add && !tr) return segs;
      return segs.map((s) => {
        if (tr && s.color === "gold") return MISS(s, "trick");
        if ((ebOn || bde) && s.color === "blue" && !/^Dodge/i.test(s.name || "")) return MISS(s, "blue");
        if (leer && nm(s) === leer && s.color !== "red") return MISS(s, "leer");
        if (u._imprison && nm(s) === u._imprison && s.color !== "red") return MISS(s, "imprison");
        if (add && (s.color === "white" || s.color === "gold") && s.dmg > 0) return Object.assign({}, s, { dmg: s.dmg + add });
        return s;
      });
    };
  }

  // ------------------------------------------------ escolha de casas
  function emptyNodes() { return allNodes().filter((n) => !at(n)); }
  function bestFor(u, cands) {
    cands = cands.filter((n) => n !== 3 && n !== 10); // efeito nunca coloca peça num Goal
    if (!cands.length) return null;
    const g = goalOf(u.owner);
    // perto do Goal adversário, mas sem pisar no próprio Goal
    return cands.slice().sort((a, b) => dist(a, g) - dist(b, g) || a - b)[0];
  }
  function moveUnit(u, node) {
    if (!u || node == null) return false;
    u.nodeId = node; fx(u, "#c084fc");
    try { if (window.PDRSound) PDRSound.play("ab_pos"); } catch (e) {}
    return true;
  }
  function checkGoal(u) {
    if (onB(u) && u.nodeId === goalOf(u.owner) && !state.winCelebrationAnim) {
      log(u.owner === "p1" ? tt("log.reached_goal_win", "Reached the Goal! WIN!") : tt("log.opp_reached_goal", "Opponent reached your Goal!"));
      try { spawnPortalParticles(176, u.owner === "p1" ? 185 : 343, "#facc15"); } catch (e) {}
      state.winCelebrationAnim = { winner: u.owner, t0: performance.now() };
    }
  }
  const occupiedChain = (u) => {
    // Dig: casas vazias ao lado de figuras ligadas em sequência a partir das vizinhas
    const seen = new Set(), q = (ADJ[u.nodeId] || []).filter((n) => at(n));
    q.forEach((n) => seen.add(n));
    while (q.length) { const n = q.shift(); (ADJ[n] || []).forEach((m) => { if (at(m) && at(m) !== u && !seen.has(m)) { seen.add(m); q.push(m); } }); }
    const out = new Set();
    seen.forEach((n) => (ADJ[n] || []).forEach((m) => { if (!at(m) && m !== u.nodeId) out.add(m); }));
    return [...out];
  };
  function sendPC(x) { if (x && onB(x) && typeof sendToPC === "function") { clearMarkers(x); sendToPC(x); } }
  function evoCandidate(owner) {
    return state.units.find((x) => x.owner === owner && onB(x) && !(x.megaTurns > 0) && x._justEvolvedTurn !== TC() && typeof POKEMON_EVOLUTION_FAMILIES !== "undefined" &&
      POKEMON_EVOLUTION_FAMILIES.some((f) => { const i = f.findIndex((n) => n.toLowerCase() === String(x.name).toLowerCase()); return i >= 0 && i < f.length - 1; }));
  }
  function spinOnce(u, r) {
    const segs = getActiveWheel(u) || [];
    const tot = segs.reduce((a, s) => a + (s.size || 1), 0);
    let p = r() * tot;
    for (const s of segs) { p -= (s.size || 1); if (p <= 0) return s; }
    return segs[segs.length - 1];
  }
  function oppPlates(owner) { return (state.plates || []).filter(Boolean); }
  const usedBy = (p, o) => (o === "p2" ? p.usedP2 : p.usedP1);
  const setUsed = (p, o) => { if (o === "p2") p.usedP2 = true; else p.usedP1 = true; p.used = true; };

  // ------------------------------------------------ efeitos pós-vitória das fatias Roxas
  const AURA = { "Fairy Mist": [["Fairy"], 10], "Dark Mist": [["Dark"], 10], "Synthesis": [["Grass"], 20] };
  function applyWin(name, w, l, wSpin, r) {
    const W = w.name, L = l.name;
    switch (name) {
      case "Fly": case "Fly Away": {
        const c = emptyNodes().filter((n) => n !== goalOf(opp(w.owner)) && (name === "Fly Away" ? (ADJ[l.nodeId] || []).includes(n) : dist(l.nodeId, n) >= 1 && dist(l.nodeId, n) <= 2) && dist(w.nodeId, n) >= 2);
        const n = bestFor(w, c); if (moveUnit(w, n)) { log(tt("sfx.fly", `🪽 ${W}: ${name}! Pulou por cima de ${L}.`, { name: W, move: name, opp: L })); checkGoal(w); }
        break;
      }
      case "Teleport": case "Rainbow Wing": {
        const n = bestFor(w, emptyNodes().filter((x) => dist(w.nodeId, x) === 2 && x !== goalOf(opp(w.owner))));
        if (moveUnit(w, n)) { log(tt("sfx.teleport", `✨ ${W}: ${name}! Moveu-se 2 passos.`, { name: W, move: name })); checkGoal(w); }
        break;
      }
      case "Dig": {
        const n = bestFor(w, occupiedChain(w).filter((x) => x !== goalOf(opp(w.owner))));
        if (moveUnit(w, n)) { log(tt("sfx.dig", `⛏️ ${W}: Dig! Cavou até outra casa.`, { name: W })); checkGoal(w); }
        break;
      }
      case "Push Away": {
        const n = (ADJ[l.nodeId] || []).filter((x) => !at(x) && dist(w.nodeId, x) === 2).sort((a, b) => a - b)[0];
        if (n != null) { const old = l.nodeId; moveUnit(l, n); moveUnit(w, old); log(tt("sfx.push_away", `💪 ${W}: Push Away! Empurrou ${L} e tomou o lugar dele.`, { name: W, opp: L })); checkGoal(w); }
        break;
      }
      case "Overhead Toss": {
        const n = (ADJ[w.nodeId] || []).filter((x) => !at(x) && dist(l.nodeId, x) === 2).sort((a, b) => a - b)[0];
        if (moveUnit(l, n)) log(tt("sfx.overhead_toss", `🤼 ${W}: Overhead Toss! ${L} foi jogado para trás.`, { name: W, opp: L }));
        break;
      }
      case "Flame Kinesis": {
        const c = emptyNodes().filter((x) => dist(w.nodeId, x) === 3).sort((a, b) => dist(l.nodeId, a) - dist(l.nodeId, b) || a - b);
        if (moveUnit(l, c[0])) log(tt("sfx.flame_kinesis", `🔥 ${W}: Flame Kinesis! ${L} foi afastado 3 passos.`, { name: W, opp: L }));
        break;
      }
      case "Draining Wind": {
        const tgt = state.units.filter((x) => onB(x) && x.owner !== w.owner && dist(w.nodeId, x.nodeId) <= 3).sort((a, b) => dist(w.nodeId, a.nodeId) - dist(w.nodeId, b.nodeId))[0] || l;
        const d0 = dist(w.nodeId, tgt.nodeId);
        const n = emptyNodes().filter((x) => dist(tgt.nodeId, x) <= 2 && dist(w.nodeId, x) < d0 && dist(w.nodeId, x) >= 1).sort((a, b) => dist(w.nodeId, a) - dist(w.nodeId, b) || a - b)[0];
        if (n != null) moveUnit(tgt, n);
        mpMarker(tgt, 1);
        log(tt("sfx.draining_wind", `🌪️ ${W}: Draining Wind puxou ${tgt.name}!`, { name: W, opp: tgt.name }));
        break;
      }
      case "String Wrap": mpMarker(l, 1); break;
      case "Glaciate": case "Icy Wind": {
        const foes = state.units.filter((x) => onB(x) && x.owner !== w.owner && !isT(x, ["Fire", "Water", "Ice", "Steel"]) && (name === "Glaciate" || abilityAdjacent(w, x)));
        foes.forEach((x) => { const s = spinOnce(x, r); if (s && s.color === "white") mpMarker(x, 1); });
        log(tt("sfx.glaciate", `❄️ ${W}: ${name}! ${foes.length} Pokémon giraram.`, { name: W, move: name, n: foes.length }));
        break;
      }
      case "Taunt": l._tauntUntil = TC() - 2; log(tt("sfx.taunt", `😤 ${W}: Taunt em ${L}!`, { name: W, opp: L })); break;
      case "Energy Ball": case "Acid Spray": l._ebBy = w.uid; log(tt("sfx.energy_ball", `🟢 ${W}: ${name}! Os Azuis de ${L} viram Miss enquanto ${W} estiver em campo.`, { name: W, move: name, opp: L })); break;
      case "Baby-Doll Eyes": l._bdeUntil = TC() - 1; log(tt("sfx.baby_doll", `🥺 ${W}: os Azuis de ${L} viram Miss no próximo turno.`, { name: W, opp: L })); break;
      case "Leer": {
        state.units.filter((x) => onB(x) && x.owner !== w.owner && abilityAdjacent(w, x)).forEach((x) => { const s = spinOnce(x, r); if (s && s.color !== "red") x._leer = { name: nm(s), until: TC() - 1 }; });
        log(tt("sfx.leer", `👁️ ${W}: Leer!`, { name: W }));
        break;
      }
      case "Imprison": { const lc = wSpin.oppChosen; if (lc && lc.color !== "red") { l._imprison = nm(lc); log(tt("sfx.imprison", `🔒 ${L}: marcador Imprisoned (${nm(lc)} vira Miss).`, { opp: L, move: nm(lc) })); } break; }
      case "Explosion": {
        const ns = (ADJ[w.nodeId] || []).map(at).filter(Boolean);
        log(tt("sfx.explosion", `💥 ${W}: Explosion!`, { name: W }));
        [w, ...ns].forEach(sendPC);
        break;
      }
      case "Cyclone Kick": sendPC(l); break;
      case "Rock Wrecker": {
        const x = state.units.filter((y) => onB(y) && y.owner !== w.owner && dist(w.nodeId, y.nodeId) <= 2).sort((a, b) => (typeof abBest === "function" ? abBest(b) - abBest(a) : 0) || dist(a.nodeId, goalOf(a.owner)) - dist(b.nodeId, goalOf(b.owner)))[0];
        if (x) { log(tt("sfx.rock_wrecker", `🪨 ${W}: Rock Wrecker nocauteou ${x.name}!`, { name: W, opp: x.name })); sendPC(x); }
        break;
      }
      case "Swinging Throw": {
        const x = state.units.filter((y) => onB(y) && y.owner !== w.owner && dist(w.nodeId, y.nodeId) <= 2).sort((a, b) => dist(w.nodeId, a.nodeId) - dist(w.nodeId, b.nodeId))[0];
        if (x) { const s = spinOnce(x, r); if (!s || s.color !== "blue") { log(tt("sfx.swinging_throw", `🌀 ${W}: Swinging Throw nocauteou ${x.name}!`, { name: W, opp: x.name })); sendPC(x); } }
        break;
      }
      case "Fissure": if (!isT(l, ["Flying"])) sendPC(l); break;
      case "Mind Blown": sendPC(l); w._finalSong = TC() - 5; log(tt("sfx.final_song", `🎵 ${W}: marcador Final Song (nocaute em 5 turnos).`, { name: W })); break;
      case "Belly Drum": w._finalSong = TC() - 5; w._bellyDrum = true; log(tt("sfx.final_song", `🎵 ${W}: marcador Final Song (nocaute em 5 turnos).`, { name: W })); break;
      case "Fairy Mist": case "Dark Mist": case "Synthesis": {
        const [ty, add] = AURA[name]; w._aura = { types: ty, add: add * ultraMult(w) };
        log(tt("sfx.aura", `🌟 ${W}: ${name}! Seus Pokémon ${ty.join("/")} ganham +${add} de dano.`, { name: W, move: name, types: ty.join("/"), add }));
        break;
      }
      case "Tailwind": G().tail = { owner: w.owner, end: TC() - 2 }; log(tt("sfx.tailwind", `🍃 ${W}: Tailwind! Seus Voadores +1 MP.`, { name: W })); break;
      case "Trick-or-Treat": l._pumpkin = true; log(tt("sfx.pumpkin", `🎃 ${L}: marcador Pumpkin.`, { opp: L })); break;
      case "Trick Room": {
        const turns = 5 * ultraMult(w);
        G().trick = { end: TC() - turns, owner: w.owner };
        log(tt("sfx.trick_room", `🔮 ${W}: Trick Room por ${turns} turnos!`, { name: W, n: turns }));
        break;
      }
      case "Smack Down": l._smackBy = w.uid; log(tt("sfx.smack_down", `⬇️ ${L} não pode mais atravessar Pokémon.`, { opp: L })); break;
      case "Plate Gnawing": case "Nasty Plot": {
        const o = l.owner;
        if (name === "Plate Gnawing" && state.__x712) { ["power", "energy"].forEach((k) => { if (state.__x712[k] && state.__x712[k][o]) state.__x712[k][o] = {}; }); }
        const p = oppPlates(o).find((x) => !usedBy(x, o));
        if (p) { setUsed(p, o); p[o === "p2" ? "_exclP2" : "_exclP1"] = true; log(tt("sfx.plate_gone", `🦷 ${W}: ${name}! A plate ${p.name} do adversário foi anulada.`, { name: W, move: name, plate: p.name })); }
        try { renderPlatesTray(); } catch (e) {}
        break;
      }
      case "Sphere Trick": {
        const px = state.__px; if (!px) break;
        const copied = ["xdef", "spatk", "acc", "focus"].filter((k) => px[k] && px[k][l.uid] === TC());
        if (copied.length) { w._sphereCopy = copied; log(tt("sfx.sphere_trick", `🔁 ${W}: copiou os efeitos de plate de ${L}.`, { name: W, opp: L })); }
        break;
      }
      case "Mystery Scent": {
        const x = evoCandidate(w.owner);
        if (x && typeof applyUnitEvolutionNow === "function") { const save = x.deckTargetName; x.deckTargetName = null; try { applyUnitEvolutionNow(x); } finally { if (x.deckTargetName == null) x.deckTargetName = save; } log(tt("sfx.mystery_scent", `🌸 ${W}: Mystery Scent fez ${x.name} evoluir!`, { name: W, opp: x.name })); }
        break;
      }
      case "Dark Moon": { const k = l.owner === "p2" ? "zGaugeP2" : "zGaugeP1"; state[k] = Math.max(0, (state[k] || 0) - 67); log(tt("sfx.dark_moon", `🌑 ${W}: Dark Moon drenou o Z-Move do adversário.`, { name: W })); break; }
    }
  }
  const WIN_FX = new Set(["Fly", "Fly Away", "Teleport", "Rainbow Wing", "Dig", "Push Away", "Overhead Toss", "Flame Kinesis", "Draining Wind", "String Wrap", "Glaciate", "Icy Wind", "Taunt",
    "Energy Ball", "Acid Spray", "Baby-Doll Eyes", "Leer", "Imprison", "Explosion", "Cyclone Kick", "Rock Wrecker", "Swinging Throw", "Fissure", "Mind Blown", "Belly Drum", "Fairy Mist", "Dark Mist",
    "Synthesis", "Tailwind", "Trick-or-Treat", "Trick Room", "Smack Down", "Plate Gnawing", "Nasty Plot", "Sphere Trick", "Mystery Scent", "Dark Moon"]);
  const isNoneSlice = (c) => c && c.color === "purple" && (!c.effect || c.effect === "none");
  const REFLECTABLE = (eff) => STATUSES.includes(eff) || ["toxic", "spore", "confuse", "noxious"].includes(eff);

  if (typeof evaluateCombat === "function") {
    const _e = evaluateCombat;
    evaluateCombat = function (atk, def, as, ds) {
      const real = !!(as && ds && "multiHits" in as && as.chosen && ds.chosen);
      if (!real) return _e.apply(this, arguments);
      const r = rng(TC() * 7919 + (atk.uid || 1) * 131 + (def.uid || 1) * 17);
      const notes = [];
      const respin = (sp, u) => { const s = spinOnce(u, r); if (s) sp.chosen = Object.assign({}, s); return sp.chosen; };
      // pré-batalha
      [[as, atk, ds, def], [ds, def, as, atk]].forEach(([sp, u, osp, o]) => {
        const c = sp.chosen;
        // King Spike / Barbed Horns (o oponente é quem tem a habilidade)
        if (c.color === "gold" && u._mpMk && !o._abNull) {
          if (idOf(o) === 561) { sp.chosen = Object.assign({}, c, { color: "white" }); notes.push(tt("sfx.king_spike", "King Spike: Dourado → Branco")); }
          else if (idOf(o) === 537) { sp.chosen = MISS(c, "barbed"); notes.push(tt("sfx.barbed", "Barbed Horns: Dourado → Miss")); }
        }
        if (sp.chosen.color === "gold" && trickOn()) sp.chosen = MISS(sp.chosen, "trick");
        // Taunt: Roxo/Azul anda no sentido horário até sair outro
        if (u._tauntUntil != null && TC() >= u._tauntUntil && ["purple", "blue"].includes(sp.chosen.color) && Array.isArray(sp.segs) && sp.segs.length) {
          let i = typeof sp.chosenIdx === "number" ? sp.chosenIdx : 0;
          for (let k = 0; k < sp.segs.length; k++) { i = (i + 1) % sp.segs.length; const s = sp.segs[i]; if (s && !["purple", "blue"].includes(s.color)) { sp.chosen = Object.assign({}, s); sp.chosenIdx = i; notes.push(tt("sfx.taunt_shift", `Taunt: ${u.name} → ${nm(s)}`, { name: u.name, move: nm(s) })); break; } }
        }
      });
      [[as, atk, ds, def], [ds, def, as, atk]].forEach(([sp, u, osp, o]) => {
        const n = nm(sp.chosen);
        if (n === "Fake Sleep" || n === "Future Sight") {
          const s = respin(sp, u); notes.push(tt("sfx.respin", `${u.name}: ${n} → girou de novo (${nm(s)})`, { name: u.name, move: n, res: nm(s) }));
        } else if (n === "Torment") {
          const first = nm(osp.chosen);
          respin(sp, u); const s2 = respin(osp, o);
          if (nm(s2) === first) { osp.chosen = MISS(s2, "torment"); notes.push(tt("sfx.torment_miss", `Torment: ${o.name} repetiu o ataque e errou!`, { opp: o.name })); }
          else notes.push(tt("sfx.torment", "Torment: os dois giraram de novo"));
        }
      });
      // guarda o que cada lado tirou (Imprison precisa do resultado do oponente)
      as.oppChosen = ds.chosen; ds.oppChosen = as.chosen;
      const aC = as.chosen, dC = ds.chosen;
      const out = _e.apply(this, arguments);
      if (!out) return out;
      if (notes.length) out.reason = (out.reason || "") + " 🔮 " + notes.join(" · ");
      const pend = (fn) => { state.__sliceFxPending = state.__sliceFxPending || []; state.__sliceFxPending.push(fn); };
      // Ultra Stack: 1ª batalha conta
      [atk, def].forEach((u) => { if (idOf(u) === 523) pend(() => { u._usBattled = true; }); });
      if (out.winner !== "atk" && out.winner !== "def") return out;
      let winSide = out.winner;
      let wU = winSide === "atk" ? atk : def, lU = winSide === "atk" ? def : atk;
      let wC = winSide === "atk" ? aC : dC, lC = winSide === "atk" ? dC : aC;
      // Magic Coat: condição/marcador volta para quem atacou
      const eff = out.effect || "ko";
      if (nm(lC) === "Magic Coat" && REFLECTABLE(eff)) {
        out.winner = winSide === "atk" ? "def" : "atk";
        out.reason = (out.reason || "") + " 🪞 " + tt("sfx.magic_coat", `Magic Coat devolveu o efeito para ${wU.name}!`, { name: wU.name });
        return out;
      }
      if (nm(lC) === "Magic Coat" && nm(wC) === "String Wrap") { const w0 = wU; pend(() => mpMarker(w0, 1)); return out; }
      if (isNoneSlice(wC) && WIN_FX.has(nm(wC))) {
        const name = nm(wC), wS = winSide === "atk" ? as : ds;
        if (name === "Cyclone Kick" || name === "Fissure" && !isT(lU, ["Flying"]) || name === "Mind Blown") out.effect = "ko";
        if (out.effect === "ko" && (name === "Cyclone Kick" || name === "Fissure" || name === "Mind Blown")) {
          if (name === "Mind Blown") pend(() => { wU._finalSong = TC() - 5; log(tt("sfx.final_song", `🎵 ${wU.name}: marcador Final Song (nocaute em 5 turnos).`, { name: wU.name })); });
          return out;
        }
        pend(() => { if (onB(wU) || ["Dark Moon", "Plate Gnawing", "Nasty Plot"].includes(name)) applyWin(name, wU, lU, wS, r); });
      }
      return out;
    };
  }

  // ------------------------------------------------ Z-Move: Ultra Stack protege os Azuis de Aço
  window.PDRSliceZExempt = function (defUnit) {
    if (!defUnit || !isT(defUnit, ["Steel"])) return false;
    return state.units.some((s) => s.owner === defUnit.owner && onB(s) && !s._abNull && idOf(s) === 523 && !s._usBattled);
  };

  // ------------------------------------------------ fim de turno: Final Song, marcadores de quem saiu, Sphere Trick, expirações
  if (typeof endTurn === "function") {
    const _end = endTurn;
    endTurn = function () {
      const r = _end.apply(this, arguments);
      try {
        const tc = TC();
        state.units.forEach((u) => {
          if (u.location !== "board") { if (hasMarker(u) || u._bellyDrum || u._aura || u._tauntUntil != null || u._bdeUntil != null || u._leer || u._ebBy || u._smackBy) { clearMarkers(u); u._bellyDrum = false; u._aura = null; u._tauntUntil = null; u._bdeUntil = null; u._leer = null; u._ebBy = null; u._smackBy = null; u._sphereCopy = null; } if (idOf(u) === 523) u._usBattled = false; return; }
          if (u._finalSong != null && tc <= u._finalSong) { log(tt("sfx.final_song_ko", `🎵 Final Song: ${u.name} foi nocauteado.`, { name: u.name })); sendPC(u); return; }
          if (u._tauntUntil != null && tc < u._tauntUntil) u._tauntUntil = null;
          if (u._bdeUntil != null && tc < u._bdeUntil) u._bdeUntil = null;
          if (u._leer && tc < u._leer.until) u._leer = null;
          if (u._sphereCopy && state.__px) u._sphereCopy.forEach((k) => { state.__px[k] = state.__px[k] || {}; state.__px[k][u.uid] = tc; });
        });
        const g = G();
        if (g.trick && tc <= g.trick.end) { g.trick = null; log(tt("sfx.trick_end", "🔮 Trick Room acabou.")); }
        if (g.tail && tc < g.tail.end) g.tail = null;
      } catch (e) {}
      return r;
    };
  }
  if (typeof demoFullMatchState === "function") {
    const _d = demoFullMatchState;
    demoFullMatchState = function () { const r = _d.apply(this, arguments); state.__sfx713 = null; try { state.units.forEach((u) => { clearMarkers(u); u._bellyDrum = false; u._aura = null; u._tauntUntil = null; u._bdeUntil = null; u._leer = null; u._ebBy = null; u._smackBy = null; u._sphereCopy = null; u._usBattled = false; }); } catch (e) {} return r; };
  }
})();
