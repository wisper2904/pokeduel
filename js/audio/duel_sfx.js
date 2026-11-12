// ============================================================================
// v705 · Sons originais do Pokémon Duel (The Sounds Resource: Common / Duels / Cutscenes)
// Arquivos em assets/sfx/*.mp3 (mono 80 kbps). Toca via Web Audio usando o mesmo AudioContext do jogo (sfxCtx).
// Mapeia os playSfx() antigos para os sons originais e adiciona sons por evento (roleta, golpe por tipo,
// condições, evolução, vitória/derrota, turno, cartas, booster, fusão, Z-Move).
// Carrega depois de app.js e antes de ui/duel_screens.js. Se um arquivo falhar, o som sintetizado antigo continua.
// ============================================================================
(function () {
  "use strict";
  const BASE = "assets/sfx/";
  const VOL = { spin_tick: 0.16, spin: 0.45, confirm: 0.45, select: 0.4, move: 0.4, win: 0.8, lose: 0.8, cheer: 0.35, plate_cancel: 0.35 };
  const buffers = {}, loading = {};
  let master = null, lastPlay = {};
  const settings = (() => { try { return Object.assign({ on: true, vol: 0.8 }, JSON.parse(localStorage.getItem("pdr_sfx") || "{}")); } catch (e) { return { on: true, vol: 0.8 }; } })();
  function save() { try { localStorage.setItem("pdr_sfx", JSON.stringify(settings)); } catch (e) {} }

  function ctx() {
    try { if (typeof ensureAudio === "function") ensureAudio(); } catch (e) {}
    const a = (typeof sfxCtx !== "undefined") ? sfxCtx : null;
    if (a && !master) { master = a.createGain(); master.gain.value = settings.vol; master.connect(a.destination); }
    return a;
  }
  function load(name) {
    if (buffers[name] || loading[name]) return loading[name];
    const a = ctx(); if (!a) return null;
    loading[name] = fetch(BASE + name + ".mp3").then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((ab) => new Promise((res, rej) => a.decodeAudioData(ab, res, rej)))
      .then((b) => { buffers[name] = b; return b; })
      .catch(() => { buffers[name] = null; });
    return loading[name];
  }
  // Pré-carrega os sons mais usados no primeiro toque do usuário
  const HOT = ["confirm", "cancel", "select", "deselect", "move", "spin", "spin_tick", "spin_stop", "begin_attack", "miss", "tie", "shield", "dodge", "ko",
    "new_turn", "end_turn", "gold_attack", "plate_sel", "plate_ok", "use_plate", "form_a", "win", "lose", "duel_start", "levelup", "fusion_set"];
  let warmed = false;
  function warm() { if (warmed) return; warmed = true; HOT.forEach(load); }
  ["pointerdown", "touchstart", "keydown"].forEach((ev) => window.addEventListener(ev, warm, { once: true, passive: true }));

  // Toca um som. Retorna true se tocou (ou vai tocar quando carregar), false se não existe.
  function play(name, opt) {
    opt = opt || {};
    if (window.__pdrSfxLog) window.__pdrSfxLog.push(name);
    if (!settings.on) return true;
    const now = performance.now();
    const gap = opt.gap != null ? opt.gap : 35;
    if (lastPlay[name] && now - lastPlay[name] < gap) return true;
    lastPlay[name] = now;
    const a = ctx(); if (!a) return false;
    const go = (b) => {
      if (!b) return;
      try {
        const s = a.createBufferSource(); s.buffer = b;
        if (opt.rate) s.playbackRate.value = opt.rate;
        const g = a.createGain(); g.gain.value = (opt.vol != null ? opt.vol : (VOL[name] != null ? VOL[name] : 0.8));
        s.connect(g); g.connect(master || a.destination);
        s.start(a.currentTime + (opt.delay || 0));
      } catch (e) {}
    };
    if (buffers[name]) { go(buffers[name]); return true; }
    if (buffers[name] === null) return false;
    const p = load(name);
    if (p) p.then(() => { if (performance.now() - now < 700) go(buffers[name]); });
    return true;
  }
  function setVolume(v) { settings.vol = Math.max(0, Math.min(1, v)); if (master) master.gain.value = settings.vol; save(); }
  function setEnabled(on) { settings.on = !!on; save(); }
  window.PDRSound = { play, load, setVolume, setEnabled, settings };

  const overlayOpen = () => { const o = document.getElementById("wheel-overlay"); return !!(o && o.classList.contains("show")); };

  // ---------------------------------------------------------------- playSfx antigo → sons originais
  const MAP = { tick: "select", select: "select", back: "cancel", step: "move", jump: "move", portal: "confirm", level_up: "levelup" };
  const inMatchNow = () => { const dr = document.getElementById("drawer-modal"); return !(dr && dr.classList.contains("show")); };
  if (typeof playSfx === "function") {
    const _synth = playSfx;
    const wrapped = function (type) {
      if (!settings.on) return;
      if (type === "hit") {
        // Na batalha o golpe tem som próprio (ver onImpact); fora dela "hit" é aviso/erro
        if (overlayOpen()) return;
        if (play("plate_cancel", { vol: 0.6 })) return;
      } else if (type === "tick" && overlayOpen()) {
        if (play("spin_tick", { gap: 70 })) return;
      } else if ((type === "portal" || type === "tick") && inMatchNow()) {
        return; // na partida esses avisos genéricos tocavam a toda hora
      } else if ((type === "step" || type === "jump") && play("move", { gap: 700 })) return;
      else if (MAP[type] && play(MAP[type])) return;
      return _synth.apply(this, arguments);
    };
    try { playSfx = wrapped; } catch (e) {}
    window.playSfx = wrapped;
  }

  // ---------------------------------------------------------------- batalha
  const TYPE_KEY = { Dark: "t_dark", Electric: "t_electric", Grass: "t_grass", Psychic: "t_psychic", Fighting: "t_fighting", Steel: "t_steel", Fire: "t_fire",
    Water: "t_water", Ice: "t_ice", Poison: "t_poison", Ground: "t_ground", Flying: "t_flying", Bug: "t_bug", Rock: "t_rock", Ghost: "t_ghost", Dragon: "t_dragon",
    Fairy: "t_fairy", Normal: "slam" };
  const STATUS_KEY = { sleep: "st_sleep", spore: "st_sleep", paralyze: "st_paralyze", poison: "st_poison", badpoison: "st_noxious", toxic: "st_noxious", noxious: "st_noxious",
    burn: "st_burn", freeze: "st_freeze", panic: "st_confuse", confuse: "st_confuse", banish: "banish", swap: "swap", wait: "debuff" };
  function typeKey(tp) { const k = String(tp || "Normal").split(/[\/,]/)[0].trim(); return TYPE_KEY[k] || "slam"; }
  function attackSound(winUnit, spin) {
    if (!spin) return "slam";
    if (spin.isZMove) return "zmove";
    if (spin.color === "gold") return "gold_attack";
    const physical = /tackle|punch|claw|bite|slash|kick|crash|strike|fang|tail|smash|cut|scratch|ram|blitz|fist|blade|slam/i.test(spin.name || "");
    if (physical) return /punch|fist|kick/i.test(spin.name) ? "punches" : (/slash|cut|claw|blade|scythe/i.test(spin.name) ? "scythe" : "slam");
    return typeKey(winUnit && winUnit.type);
  }
  window.PDRSoundBattle = {
    // chamado pela animação de ataque (duel_screens.js) no lançamento
    launch(info) { play(attackSound(info.winUnit, info.winSpin), { gap: 0 }); },
    // chamado no impacto
    impact(info) {
      const o = info && info.outcome;
      if (!o || !info.winUnit) {
        return;
      }
      const eff = o.effect || "ko";
      if (eff === "ko" || eff === "heal") play("ko", { delay: 0.18 });
      else if (STATUS_KEY[eff]) play(STATUS_KEY[eff], { delay: 0.15 });
      else if (eff === "push" || eff === "bench") play("blast", { delay: 0.1, vol: 0.6 });
    },
    noWinner(info) {
      const a = info && info.atkSpin, d = info && info.defSpin;
      const cols = [a && a.color, d && d.color];
      if (cols.includes("blue")) {
        const blue = (a && a.color === "blue") ? a : d;
        play(/dodge|desvio/i.test((blue && blue.name) || "") ? "dodge" : "shield");
      } else if (cols[0] === "red" && cols[1] === "red") play("miss");
      else play("tie");
    }
  };
  if (window.Juice) hookJuice(); else document.addEventListener("DOMContentLoaded", hookJuice);
  function hookJuice() {
    if (!window.Juice || Juice.__sfx705) return;
    Juice.__sfx705 = true;
    const _tick = Juice.tick;
    Juice.tick = function (p) { if (settings.on && play("spin_tick", { gap: 70 })) return; return _tick.apply(Juice, arguments); };
    const _stop = Juice.onWheelStop;
    Juice.onWheelStop = function () { play("spin_stop", { gap: 120 }); return _stop.apply(Juice, arguments); };
    const _evo = Juice.onEvolution;
    Juice.onEvolution = function (unit, isMega) { play(isMega ? "form_b" : "form_a"); return _evo.apply(Juice, arguments); };
    const _end = Juice.onMatchEnd;
    Juice.onMatchEnd = function (didWin) { play(didWin ? "win" : "lose", { gap: 3000 }); return _end.apply(Juice, arguments); };
    const _bk = Juice.boosterReveal;
    Juice.boosterReveal = function (fig) { const r = fig && fig.rarity; play(r === "UX" || r === "EX" ? "rare_booster" : "new_figure", { gap: 200 }); return _bk.apply(Juice, arguments); };
    // Impacto sem a animação (ex.: empate / defesa): sons de Miss, Empate, Defesa
    const _imp = Juice.onImpact;
    Juice.onImpact = function (info) {
      try {
        if (info && (!info.winUnit || !info.loser || !info.winSpin)) PDRSoundBattle.noWinner(window.__pdrLastSpins || {});
        else if (info) { if (!window.__pdrAtkAnimMs) PDRSoundBattle.launch(info); PDRSoundBattle.impact(info); }
      } catch (e) {}
      return _imp.apply(Juice, arguments);
    };
  }

  // Começo da batalha (roleta aparece) + guarda os giros para o som de empate/defesa
  if (typeof triggerCombat === "function") {
    const _tc = triggerCombat;
    const tc = function () {
      play("spin", { gap: 300 });
      return _tc.apply(this, arguments);
    };
    try { triggerCombat = tc; } catch (e) {}
    window.triggerCombat = tc;
  }
  if (typeof evaluateCombat === "function") {
    const _ec = evaluateCombat;
    const ec = function (a, d, as, ds) {
      const out = _ec.apply(this, arguments);
      if (as && ds && ("multiHits" in as)) window.__pdrLastSpins = { atkSpin: as.chosen, defSpin: ds.chosen };
      return out;
    };
    try { evaluateCombat = ec; } catch (e) {}
  }

  // Fim de turno
  if (typeof endTurn === "function") {
    const _et = endTurn;
    const et = function () { return _et.apply(this, arguments); };
    try { endTurn = et; } catch (e) {}
  }
  // Cartas
  if (typeof togglePlatesTray === "function") {
    const _tp = togglePlatesTray;
    const tp = function (force) {
      const el = document.getElementById("plates-tray");
      const wasOpen = !!(el && el.classList.contains("show"));
      const r = _tp.apply(this, arguments);
      const isOpen = !!(el && el.classList.contains("show"));
      if (!wasOpen && isOpen) play("plate_sel"); else if (wasOpen && !isOpen && force !== false) play("plate_cancel", { vol: 0.5 });
      return r;
    };
    try { togglePlatesTray = tp; } catch (e) {}
    window.togglePlatesTray = tp;
  }
  if (typeof confirmUseSelectedPlate === "function") {
    const _cp = confirmUseSelectedPlate;
    const cp = function () { play("use_plate", { gap: 500 }); return _cp.apply(this, arguments); };
    try { confirmUseSelectedPlate = cp; } catch (e) {}
    window.confirmUseSelectedPlate = cp;
  }
  // Booster
  if (typeof openBoosterChest === "function") {
    const _ob = openBoosterChest;
    const ob = function () { play("booster_open", { gap: 800 }); return _ob.apply(this, arguments); };
    try { openBoosterChest = ob; } catch (e) {}
    window.openBoosterChest = ob;
  }

  // Observa o estado: início de partida, novo turno, seleção de peça, movimento do bot, cerco
  let last = { turn: null, counter: null, sel: null, inMatch: false, pc: null };
  setInterval(() => {
    try {
      if (typeof state === "undefined" || !state || !Array.isArray(state.units)) return;
      // Em partida = o menu (drawer) está fechado
      const dr = document.getElementById("drawer-modal");
      const inMatch = !!(state.units.length && !(dr && dr.classList.contains("show")));
      if (inMatch && !last.inMatch) play("duel_start", { gap: 4000 });
      if (inMatch && last.turn != null && state.turn !== last.turn && !state.winner) {
        const bottom = (typeof getBottomRole === "function") ? getBottomRole() : "p1";
        if (state.turn === bottom && last.turn != null) play("turn_order", { vol: 0.3, gap: 1500 });
      }
      if (inMatch && state.selectedUnitId !== last.sel) {
        if (state.selectedUnitId != null && last.sel == null) play("select", { gap: 150 });

      }
      const pc = state.units.filter((u) => u.location === "pc").length;

      last = { turn: state.turn, counter: state.turnCounter, sel: state.selectedUnitId, inMatch, pc };
    } catch (e) {}
  }, 120);

  // Opção na tela de Config: ligar/desligar e volume
  function injectSetting() {
    const menu = document.getElementById("dtab-menu");
    if (!menu || document.getElementById("pdr-sfx-card")) return;
    const card = document.createElement("div");
    card.id = "pdr-sfx-card"; card.className = "card";
    card.style.cssText = "margin:8px; padding:9px 10px; background:#0b1220; border:1.5px solid #334155; border-radius:9px; color:#e2e8f0;";
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;font-weight:900;font-size:12px">
      <span>🔊 ${(typeof t === "function") ? t("sfx.title", "Sons originais") : "Sons originais"}</span>
      <label style="display:flex;align-items:center;gap:5px;font-size:11px"><input type="checkbox" id="pdr-sfx-on" ${settings.on ? "checked" : ""}> ${(typeof t === "function") ? t("sfx.on", "Ligado") : "Ligado"}</label></div>
      <input type="range" id="pdr-sfx-vol" min="0" max="100" value="${Math.round(settings.vol * 100)}" style="width:100%;margin-top:7px">`;
    menu.insertBefore(card, menu.firstChild);
    card.querySelector("#pdr-sfx-on").onchange = (e) => { setEnabled(e.target.checked); play("confirm"); };
    card.querySelector("#pdr-sfx-vol").onchange = (e) => { setVolume(e.target.value / 100); play("confirm"); };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectSetting); else setTimeout(injectSetting, 0);
})();
