// ============================================================================
// v710 · Habilidades, lote 3 (as que sobraram e dão para fazer sem inventar regra)
// Full Metal Body / Bite Down, Slippery, Aftermath Switch, Gluttony, Big Eggsplosion, Illusion, Come Here,
// Volt Swap / Ice Scramble / Surprise Strike (ações a partir do banco), Slime Touch, Rocket Ride (1ª batalha).
// Informativas (o jogo não tem a mecânica de base): Electromagnetic Barrier, Permafrost, Psychic Amplifier,
// King Spike, Spellbind, Ultra Stack, Open Sea Singer.
// Carrega depois de abilities_act.js.
// ============================================================================
(function () {
  "use strict";
  if (typeof FIGURES_DB === "undefined") return;
  const log = (s) => { try { setLogText(s); } catch (e) {} };
  const idOf = (u) => { const f = u && FIGURES_DB[u.baseIdx]; return f ? f.officialDuelId : null; };
  const K = { 341: "fullMetal", 476: "fullMetal", 386: "slippery", 354: "aftermath", 181: "gluttony", 220: "eggsplosion", 437: "illusion", 460: "illusion",
    366: "comeHere", 569: "voltSwap", 327: "iceScramble", 227: "surpriseStrike", 584: "slimeTouch", 415: "rocketRide" };
  const has = (u, k) => !!(u && !u._abNull && K[idOf(u)] === k);
  const at = (n) => unitAtNode(n);
  const entries = (owner) => BOARD_NODES.filter((n) => n.role === (owner === "p1" ? "entry_p1" : "entry_p2")).map((n) => n.id);
  const benchSlot = (owner) => { const used = state.units.filter((u) => u.owner === owner && u.location === "bench").map((u) => u.benchSlot); let s = 0; while (used.includes(s)) s++; return s; };

  // ------------------------------------------------ Full Metal Body / Bite Down: o oponente não foge nem é movido por outros efeitos
  if (typeof abShouldFlee === "function") {
    const _f = abShouldFlee;
    abShouldFlee = function (atk, def) { if (has(atk, "fullMetal")) return false; return _f(atk, def); };
  }
  // ------------------------------------------------ Rocket Ride: na 1ª batalha, Flamethrower vira Flame Gun (KO)
  // ------------------------------------------------ Big Eggsplosion: Barrage +60 sacrificando um Exeggcute seu em campo
  if (typeof getActiveWheel === "function") {
    const _g = getActiveWheel;
    getActiveWheel = function (unit) {
      const segs = _g(unit);
      if (!Array.isArray(segs) || !unit) return segs;
      if (has(unit, "rocketRide") && !unit._abBattled) return segs.map((s) => /^Flamethrower/.test(s.name || "") ? Object.assign({}, s, { name: "Flame Gun", color: "purple", stars: 2, dmg: 0, effect: "ko" }) : s);
      if (has(unit, "eggsplosion") && state.units.some((u) => u.owner === unit.owner && u.location === "board" && /^Exeggcute/.test(u.name))) return segs.map((s) => /^Barrage/.test(s.name || "") && s.dmg > 0 ? Object.assign({}, s, { dmg: s.dmg + 60, _egg: true }) : s);
      return segs;
    };
  }
  if (typeof evaluateCombat === "function") {
    const _e = evaluateCombat;
    evaluateCombat = function (atk, def, as, ds) {
      const out = _e.apply(this, arguments);
      if (!out || !as || !ds || !("multiHits" in as)) return out;
      const pend = (fn) => { state.__sliceFxPending = state.__sliceFxPending || []; state.__sliceFxPending.push(fn); };
      [[atk, as], [def, ds]].forEach(([u, sp]) => {
        // Big Eggsplosion: o Exeggcute vai ao P.C.
        if (sp.chosen && sp.chosen._egg) pend(() => { const eg = state.units.find((x) => x.owner === u.owner && x.location === "board" && /^Exeggcute/.test(x.name)); if (eg) { log(`🥚 ${u.name}: Big Eggsplosion! ${eg.name} foi nocauteado.`); sendToPC(eg); } });
        // Gluttony: alguém tirou Sweet Scent → Gluttony no P.C. volta ao banco
        if (sp.chosen && /Sweet Scent/i.test(sp.chosen.name || "")) pend(() => { state.units.forEach((x) => { if (x.location === "pc" && has(x, "gluttony")) { x.location = "bench"; x.benchSlot = benchSlot(x.owner); x.waitTurns = 0; log(`🍯 ${x.name}: Gluttony! Voltou ao banco.`); } }); });
      });
      // Aftermath Switch: ao ser nocauteado, nocauteia um Voltorb seu e os vizinhos dele (se compensar)
      if (out.winner === "atk" || out.winner === "def") {
        const loseU = out.winner === "atk" ? def : atk;
        if ((out.effect || "ko") === "ko" && has(loseU, "aftermath")) pend(() => {
          const vs = state.units.filter((v) => v.owner === loseU.owner && v.location === "board" && /^Voltorb/.test(v.name));
          let best = null, bestGain = 0;
          vs.forEach((v) => { const ns = (ADJ[v.nodeId] || []).map(at).filter(Boolean); const gain = ns.filter((x) => x.owner !== v.owner).length - ns.filter((x) => x.owner === v.owner).length - 1; if (gain > bestGain) { bestGain = gain; best = v; } });
          if (best) { const ns = (ADJ[best.nodeId] || []).map(at).filter(Boolean); log(`💥 ${loseU.name}: Aftermath Switch explodiu ${best.name}!`); [best, ...ns].forEach((x) => sendToPC(x)); }
        });
      }
      return out;
    };
  }
  // ------------------------------------------------ Illusion: antes da batalha, a peça atacada pode trocar com a Illusion (automático quando ajuda)
  if (typeof triggerCombat === "function") {
    const _t = triggerCombat;
    const t2 = function (atk, def, broadcast, forced) {
      const remote = !!(forced && (forced.atkSpin || forced.defSpin));
      if (atk && def && !remote && state.mode !== "p2p" && !def._abBattled && typeof abBest === "function") {
        const il = state.units.find((u) => u !== def && u.owner === def.owner && has(u, "illusion") && (u.location === "bench" || (u.location === "board" && !u._abBattled)) && (getEffectiveUnitMp(def) <= getEffectiveUnitMp(u)) && (u.waitTurns || 0) === 0);
        if (il && abBest(il) > abBest(def) * 1.15) {
          const n = def.nodeId;
          if (il.location === "board") { def.nodeId = il.nodeId; } else { def.location = "bench"; def.nodeId = null; def.benchSlot = il.benchSlot; }
          il.location = "board"; il.nodeId = n;
          log(`🦊 ${il.name}: Illusion! Trocou de lugar com ${def.name} antes da batalha.`);
          return _t.call(this, atk, il, broadcast, forced);
        }
      }
      return _t.apply(this, arguments);
    };
    try { triggerCombat = t2; } catch (e) {}
    window.triggerCombat = t2;
  }
  // ------------------------------------------------ Slippery: uma vez, antes de ser cercado, troca com um vizinho
  if (typeof checkSurroundKOs === "function") {
    const _s = checkSurroundKOs;
    checkSurroundKOs = function () {
      state.units.forEach((u) => {
        if (u.location !== "board" || !has(u, "slippery") || u._slipUsed) return;
        const ns = ADJ[u.nodeId] || [];
        if (ns.length && ns.every((n) => { const o = at(n); return o && o.owner !== u.owner; })) {
          // troca com um vizinho cuja casa não está cercada
          const pick = ns.map(at).find((o) => o && (ADJ[o.nodeId] || []).some((m) => m !== u.nodeId && (!at(m) || at(m).owner === u.owner)));
          if (pick) { const n = u.nodeId; u.nodeId = pick.nodeId; pick.nodeId = n; u._slipUsed = true; log(`💧 ${u.name}: Slippery! Escapou do cerco trocando com ${pick.name}.`); }
        }
      });
      return _s.apply(this, arguments);
    };
  }
  // ------------------------------------------------ Come Here: ao entrar em campo, cada jogador põe um Pokémon do banco num Entry Point
  if (typeof executeMove === "function") {
    const _m = executeMove;
    executeMove = function (uid) {
      const u = state.units.find((x) => x.uid === uid);
      const fromBench = !!(u && u.location === "bench");
      const r = _m.apply(this, arguments);
      if (u && fromBench && has(u, "comeHere")) {
        ["opp", "own"].forEach((side) => {
          const owner = side === "own" ? u.owner : (u.owner === "p1" ? "p2" : "p1");
          const b = state.units.find((x) => x.owner === owner && x.location === "bench" && (x.waitTurns || 0) === 0);
          const e = entries(owner).find((n) => !at(n));
          if (b && e != null) { b.location = "board"; b.nodeId = e; log(`📣 Come Here: ${b.name} entrou no Entry Point.`); }
        });
      }
      return r;
    };
  }

  // ------------------------------------------------ ações a partir do banco / Slime Touch (usam o botão ⚡ Habilidade)
  const AA = window.PDRAbilityActions;
  if (AA) {
    AA.A[569] = { k: "benchSwapIn", st: ["paralyze"], types: ["Electric"], paraEntry: true, ends: false, label: "Volt Swap" };
    AA.A[327] = { k: "benchNextTo", names: ["Avalugg"], setMp: 1, ends: false, label: "Ice Scramble" };
    AA.A[227] = { k: "surpriseStrike", ends: false, label: "Surprise Strike" };
    AA.A[584] = { k: "slimeAdj", ends: true, label: "Slime Touch" };
    const _tf = AA.targetsFor, _pf = AA.perform, _ca = AA.canAct;
    AA.targetsFor = function (u, a) {
      if (!a || !u) return [];
      if (a.k === "benchSwapIn") return u.location === "bench" ? state.units.filter((o) => o.owner === u.owner && o.location === "board" && (abilityTypesMatch(o, a.types) || abStMatch(o, a.st))).map((o) => o.nodeId) : [];
      if (a.k === "benchNextTo") return u.location === "bench" ? [...new Set(state.units.filter((o) => o.owner === u.owner && o.location === "board" && abNameMatch(o, a.names)).flatMap((o) => (ADJ[o.nodeId] || []).filter((n) => !at(n))))] : [];
      if (a.k === "surpriseStrike") {
        if (u.location !== "bench") return [];
        const foes = entries(u.owner).map(at).filter((o) => o && o.owner !== u.owner);
        return [...new Set(foes.flatMap((o) => (ADJ[o.nodeId] || []).filter((n) => !at(n))))];
      }
      if (a.k === "slimeAdj") return u.location === "board" ? (ADJ[u.nodeId] || []).filter((n) => { const o = at(n); return o && o.owner === u.owner && !o._slime; }) : [];
      return _tf(u, a);
    };
    AA.canAct = function (u) {
      const a = u && !u._abNull ? AA.A[(FIGURES_DB[u.baseIdx] || {}).officialDuelId] : null;
      if (a && ["benchSwapIn", "benchNextTo", "surpriseStrike"].includes(a.k)) {
        if (u.owner !== state.turn || (u.waitTurns || 0) > 0 || state.isAnimating || state.postMoveAttackMode || state.__abLastMoveTurn === state.turnCounter) return false;
        if (typeof canControlTurn === "function" && !canControlTurn()) return false;
        return AA.targetsFor(u, a).length > 0;
      }
      return _ca(u);
    };
    AA.perform = function (u, a, node) {
      const o = at(node);
      if (a.k === "benchSwapIn" && o) {
        const slot = u.benchSlot;
        u.location = "board"; u.nodeId = o.nodeId; o.location = "bench"; o.nodeId = null; o.benchSlot = slot;
        if (a.paraEntry) entries(u.owner).map(at).filter((x) => x && x.owner !== u.owner).forEach((x) => { if (!abilityImmuneTo(x, "paralyze")) x.condition = PokemonCondition.Paralyze; });
        log(`⚡ ${u.name}: Volt Swap — trocou com ${o.name}; rivais nos seus Entry Points ficaram paralisados.`);
        try { selectUnit(u.uid); } catch (e) {} return true;
      }
      if (a.k === "benchNextTo") { u.location = "board"; u.nodeId = node; if (a.setMp) u.mp = a.setMp; log(`❄️ ${u.name}: Ice Scramble!`); try { selectUnit(u.uid); } catch (e) {} return true; }
      if (a.k === "surpriseStrike") {
        u.location = "board"; u.nodeId = node; u._returnAfterBattle = true;
        const foe = (ADJ[node] || []).map(at).find((x) => x && x.owner !== u.owner && entries(u.owner).includes(x.nodeId));
        log(`🥷 ${u.name}: Surprise Strike!`);
        if (foe) { triggerCombat(u, foe, true); return true; }
        return true;
      }
      if (a.k === "slimeAdj" && o) {
        o._slime = true; o._abNull = true;
        log(`🟢 ${u.name}: Slime Touch — ${o.name} recebeu o marcador Slime (Slime Barrier).`);
        endTurn(true); return true;
      }
      return _pf(u, a, node);
    };
    // depois da batalha do Surprise Strike, se não foi nocauteado volta ao banco
    if (typeof abilityAfterBattle === "function") {
      const _ab = abilityAfterBattle;
      abilityAfterBattle = function () {
        const r = _ab.apply(this, arguments);
        state.units.forEach((u) => { if (u._returnAfterBattle) { u._returnAfterBattle = false; if (u.location === "board") { u.location = "bench"; u.nodeId = null; u.benchSlot = benchSlot(u.owner); } } });
        return r;
      };
    }
    // Slime: quem tem o marcador ganha Slime Barrier (condições de ataques Brancos são anuladas)
    if (typeof abilityHas === "function") {
      const _h = abilityHas;
      abilityHas = function (unit, k, opp, nullified) {
        if (k === "whiteStatusImmune" && unit && unit._slime) return { k: "whiteStatusImmune" };
        return _h(unit, k, opp, nullified);
      };
    }
    // botão também aparece para peças no banco com ação
    window.PDRAbilityActions = AA;
  }
})();
