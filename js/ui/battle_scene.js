// ============================================================================
// v718 · Cena de batalha depois da roleta (como no Pokémon Duel original)
//  - Palco próprio: fundo de cristal e chão de mármore da arena (texturas de PDRArena), seu Pokémon na frente à
//    esquerda sobre anel azul, o adversário ao fundo à direita sobre anel vermelho.
//  - Faixas diagonais com o golpe e o valor de cada um (dano, ★ ou Miss/Defesa): adversário em cima, você embaixo.
//  - Os dois avançam, se chocam (flash + tremor) e o vencedor empurra o perdedor; no empate os dois são rebatidos.
//  - Ritmo moderado: ~2,6 s no total. Botão "Pular". Chamado por duel_screens.js (Juice.onImpact) com
//    {atkUnit, defUnit, atkChosen, defChosen, winUnit, loser, winSpin}. Começa 450 ms depois da roleta parar.
//    API: window.PDRBattleScene {MS (espera extra da tela da roleta), DURATION, play}.
// Carrega depois de settings_screen.js.
// ============================================================================
(function () {
  "use strict";
  const MS = 2600, DELAY = 450, EXTRA = 1500; // EXTRA: quanto a tela da roleta espera a mais (fecha junto com a cena)
  const tt = (k, fb) => (typeof t === "function" ? t(k, fb) : fb);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const mv = (n) => { const x = String(n || "").replace(/\*$/, "").replace(/ ➔ .*$/, ""); return typeof localizeMove === "function" ? localizeMove(x) : x; };
  const sprite = (u, back) => {
    const S = typeof AUTHENTIC_FIG_SPRITES !== "undefined" ? AUTHENTIC_FIG_SPRITES : {};
    const k = back && S[u.spriteKey + "_back"] ? u.spriteKey + "_back" : (S[u.spriteKey] ? u.spriteKey : (S[u.baseId] ? u.baseId : "pikachu"));
    return (S[k] && S[k].uri) || "";
  };
  const COL = { white: "#f8fafc", gold: "#fde047", purple: "#e879f9", blue: "#67e8f9", red: "#94a3b8" };
  function valueOf(c) {
    if (!c) return "—";
    if (c.color === "red") return tt("bs.miss", "Falha");
    if (c.color === "blue") return tt("bs.guard", "Defesa");
    if (c.color === "purple") return "★".repeat(Math.max(1, Math.min(5, c.stars || 1)));
    return String(c.dmg || 0);
  }
  const CSS = `
  #bs-layer{position:fixed;inset:0;z-index:8800;overflow:hidden;pointer-events:auto;font-family:inherit}
  #bs-layer canvas.bg{position:absolute;inset:0;width:100%;height:100%}
  #bs-layer .fig{position:absolute;transform-origin:50% 92%;will-change:transform}
  #bs-layer .fig img{display:block;width:100%;height:auto;filter:drop-shadow(0 10px 8px rgba(0,0,0,.55))}
  #bs-layer .ped{position:absolute;left:8%;right:8%;bottom:-6%;height:22%;border-radius:50%}
  #bs-layer .band{position:absolute;left:-20%;width:140%;height:16%;transform:rotate(-24deg);pointer-events:none}
  #bs-layer .band i{position:absolute;inset:0;display:block}
  #bs-layer .lbl{position:absolute;font-weight:900;line-height:1;text-shadow:0 3px 0 rgba(0,0,0,.45),0 0 18px currentColor;white-space:nowrap}
  #bs-layer .lbl b{display:block;font-size:min(13vw,62px)}
  #bs-layer .lbl span{display:block;font-size:min(5.4vw,24px);margin-top:2px}
  #bs-layer .skip{position:absolute;top:calc(env(safe-area-inset-top,0px) + 10px);right:10px;z-index:3;border:1.5px solid #94a3b8;background:rgba(15,23,42,.85);color:#e2e8f0;font-weight:900;font-size:12px;border-radius:7px;padding:5px 12px;cursor:pointer}
  #bs-layer .flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
  #bs-layer .spark{position:absolute;width:10px;height:10px;border-radius:50%;pointer-events:none}
  `;
  function paintBg(cv) {
    const w = cv.width = Math.round(innerWidth * Math.min(2, devicePixelRatio || 1)), h = cv.height = Math.round(innerHeight * Math.min(2, devicePixelRatio || 1));
    const g = cv.getContext("2d");
    const tx = window.PDRArena && PDRArena.textures ? PDRArena.textures() : null;
    if (tx && tx.room) g.drawImage(tx.room, 0, 0, w, h);
    else { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1e293b"); gr.addColorStop(1, "#020617"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    // chão: o mármore da mesa, mais perto (recorte da parte de baixo da mesa esticado)
    const T = tx && (tx.tex || tx.table);
    if (T) {
      const top = h * 0.30;
      g.save();
      for (let i = 0; i < 90; i++) { // chão de mármore em perspectiva: faixas mais largas embaixo
        const a = i / 90, b = (i + 1) / 90;
        const ya = top + (h - top) * a * a, yb = top + (h - top) * b * b, ww = w * (1.0 + a * 1.1);
        g.drawImage(T, 0, T.height * (0.15 + a * 0.7), T.width, T.height * 0.7 / 90 + 1, (w - ww) / 2, ya, ww, yb - ya + 1);
      }
      g.restore();
      const gloss = g.createLinearGradient(0, top, 0, h); gloss.addColorStop(0, "rgba(255,255,255,0.10)"); gloss.addColorStop(0.4, "rgba(255,255,255,0)"); gloss.addColorStop(1, "rgba(0,0,0,0.35)");
      g.fillStyle = gloss; g.fillRect(0, top, w, h - top);
      const fog = g.createLinearGradient(0, top - h * 0.04, 0, top + h * 0.16); fog.addColorStop(0, "rgba(2,6,23,1)"); fog.addColorStop(0.35, "rgba(2,6,23,0.75)"); fog.addColorStop(1, "rgba(2,6,23,0)");
      g.fillStyle = fog; g.fillRect(0, top - h * 0.04, w, h * 0.2);
    }
    const vg = g.createRadialGradient(w / 2, h * 0.55, h * 0.2, w / 2, h * 0.55, h * 0.85); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.7)");
    g.fillStyle = vg; g.fillRect(0, 0, w, h);
  }
  function band(layer, top, colA, colB, fromLeft) {
    const b = document.createElement("div"); b.className = "band"; b.style.top = top;
    b.innerHTML = `<i style="background:linear-gradient(90deg,transparent 0%,${colA} 35%,${colB} 50%,${colA} 65%,transparent 100%);opacity:.55;clip-path:polygon(0 42%,100% 30%,100% 52%,0 64%)"></i>
      <i style="background:linear-gradient(90deg,transparent,#fff 50%,transparent);opacity:.9;clip-path:polygon(0 50%,100% 40%,100% 42%,0 52%)"></i>`;
    layer.appendChild(b);
    b.animate([{ transform: `rotate(-24deg) translateX(${fromLeft ? "-60%" : "60%"})`, opacity: 0 }, { transform: "rotate(-24deg) translateX(0)", opacity: 1 }], { duration: 360, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" });
    return b;
  }
  function label(layer, chosen, side) {
    const el = document.createElement("div"); el.className = "lbl";
    const col = COL[chosen && chosen.color] || "#fff";
    const big = valueOf(chosen), name = mv(chosen && chosen.name);
    if (side === "top") { el.style.left = "6%"; el.style.top = "calc(env(safe-area-inset-top,0px) + 7%)"; el.innerHTML = `${name && name !== big ? `<span style="color:#f9a8d4">${esc(name)}</span>` : ""}<b style="color:${col === "#f8fafc" ? "#f9a8d4" : col}">${esc(big)}</b>`; }
    else { el.style.right = "6%"; el.style.bottom = "8%"; el.style.textAlign = "right"; el.innerHTML = `<b style="color:${col === "#f8fafc" ? "#38bdf8" : col}">${esc(big)}</b>${name && name !== big ? `<span style="color:#7dd3fc">${esc(name)}</span>` : ""}`; }
    layer.appendChild(el);
    el.animate([{ opacity: 0, transform: `translateX(${side === "top" ? -30 : 30}px) scale(.8)` }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" });
    return el;
  }
  function figure(layer, u, mine) {
    const d = document.createElement("div"); d.className = "fig";
    const W = Math.min(innerWidth, 520);
    const size = mine ? W * 0.52 : W * 0.36;
    d.style.width = size + "px";
    if (mine) { d.style.left = (innerWidth / 2 - W * 0.42) + "px"; d.style.top = (innerHeight * 0.50) + "px"; }
    else { d.style.left = (innerWidth / 2 + W * 0.06) + "px"; d.style.top = (innerHeight * 0.30) + "px"; }
    const col = mine ? "#38bdf8" : "#f43f5e";
    d.innerHTML = `<div class="ped" style="background:radial-gradient(ellipse at 50% 50%,${col} 0%,${col}88 35%,transparent 70%);box-shadow:0 0 30px 6px ${col}66"></div><img src="${sprite(u, mine)}" alt="">`;
    layer.appendChild(d);
    return d;
  }
  function sparks(layer, x, y, col) {
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("div"); s.className = "spark";
      s.style.left = x + "px"; s.style.top = y + "px"; s.style.background = `radial-gradient(circle,#fff,${col} 60%,transparent 70%)`;
      layer.appendChild(s);
      const a = Math.random() * Math.PI * 2, r = 50 + Math.random() * 110;
      s.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(a) * r - 5}px,${Math.sin(a) * r - 5}px) scale(.2)`, opacity: 0 }], { duration: 520 + Math.random() * 260, easing: "cubic-bezier(.1,.8,.3,1)", fill: "forwards" });
    }
  }
  function play(info, done) { setTimeout(() => playNow(info, done), DELAY); }
  function playNow(info, done) {
    if (!document.getElementById("bs-css")) { const st = document.createElement("style"); st.id = "bs-css"; st.textContent = CSS; document.head.appendChild(st); }
    const old = document.getElementById("bs-layer"); if (old) old.remove();
    const bottom = typeof getBottomRole === "function" ? getBottomRole() : "p1";
    const atk = info.atkUnit, def = info.defUnit;
    const mineU = atk.owner === bottom ? atk : def, oppU = mineU === atk ? def : atk;
    const mineC = mineU === atk ? info.atkChosen : info.defChosen, oppC = mineU === atk ? info.defChosen : info.atkChosen;
    const winMine = info.winUnit ? info.winUnit === mineU : null; // null = empate
    const layer = document.createElement("div"); layer.id = "bs-layer";
    const cv = document.createElement("canvas"); cv.className = "bg"; layer.appendChild(cv);
    document.body.appendChild(layer);
    try { paintBg(cv); } catch (e) {}
    const t0 = performance.now();
    let finished = false, calledDone = false;
    const callDone = () => { if (calledDone) return; calledDone = true; try { done && done(); } catch (e) { console.warn(e); } };
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(() => { if (!finished) fn(); }, ms));
    const end = (skipped) => {
      if (finished) return; finished = true; timers.forEach(clearTimeout); callDone();
      if (skipped) window.__pdrAtkAnimMs = 0;
      layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }).onfinish = () => layer.remove();
    };
    const skip = document.createElement("button"); skip.className = "skip"; skip.textContent = tt("bs.skip", "Pular"); skip.onclick = (e) => { e.stopPropagation(); end(true); };
    layer.appendChild(skip);
    layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: "forwards" });
    const fm = figure(layer, mineU, true), fo = figure(layer, oppU, false);
    fm.animate([{ transform: "translate(-40px,30px) scale(.85)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 380, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" });
    fo.animate([{ transform: "translate(40px,-20px) scale(.85)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 380, delay: 80, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" });
    // faixas e golpes
    at(300, () => { band(layer, "4%", "#f472b6", "#fdf2f8", true); label(layer, oppC, "top"); try { if (window.PDRSound) PDRSound.play("tick"); } catch (e) {} });
    at(620, () => { band(layer, "74%", "#38bdf8", "#e0f2fe", false); label(layer, mineC, "bot"); try { if (window.PDRSound) PDRSound.play("tick"); } catch (e) {} });
    // avanço e choque
    const rm = fm.getBoundingClientRect(), ro = fo.getBoundingClientRect();
    const mx = (rm.left + rm.width / 2 + ro.left + ro.width / 2) / 2, my = (rm.top + rm.height * 0.6 + ro.top + ro.height * 0.6) / 2;
    const dmx = mx - (rm.left + rm.width / 2), dmy = my - (rm.top + rm.height * 0.6), dox = mx - (ro.left + ro.width / 2), doy = my - (ro.top + ro.height * 0.6);
    at(1050, () => {
      const anim = (el, dx, dy) => el.animate([{ transform: "none" }, { transform: `translate(${-dx * 0.12}px,${-dy * 0.12}px) scale(.97)`, offset: 0.35 }, { transform: `translate(${dx * 0.55}px,${dy * 0.55}px) scale(1.04)` }], { duration: 420, easing: "cubic-bezier(.5,0,.8,.4)", fill: "forwards" });
      anim(fm, dmx, dmy); anim(fo, dox, doy);
      try { if (window.PDRSoundBattle) PDRSoundBattle.launch(info); } catch (e) {}
    });
    at(1470, () => {
      const fl = document.createElement("div"); fl.className = "flash"; layer.appendChild(fl);
      fl.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
      sparks(layer, mx, my, winMine === null ? "#e2e8f0" : (winMine ? "#38bdf8" : "#f43f5e"));
      layer.animate([{ transform: "translate(0,0)" }, { transform: "translate(-7px,4px)" }, { transform: "translate(6px,-5px)" }, { transform: "translate(-3px,2px)" }, { transform: "none" }], { duration: 280 });
      try { if (navigator.vibrate && window.Juice && Juice.cfg && Juice.cfg.haptics) navigator.vibrate(35); } catch (e) {}
      callDone();
      const push = (el, dx, dy, win) => win
        ? el.animate([{ transform: `translate(${dx * 0.55}px,${dy * 0.55}px) scale(1.04)` }, { transform: `translate(${dx * 0.75}px,${dy * 0.75}px) scale(1.08)`, offset: 0.4 }, { transform: "none" }], { duration: 700, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" })
        : el.animate([{ transform: `translate(${dx * 0.55}px,${dy * 0.55}px)`, filter: "brightness(3) saturate(0)" }, { transform: `translate(${-dx * 0.55}px,${-dy * 0.55}px) rotate(${dx > 0 ? -14 : 14}deg)`, filter: "brightness(1)", offset: 0.45 }, { transform: `translate(${-dx * 0.5}px,${-dy * 0.5}px) rotate(${dx > 0 ? -8 : 8}deg)`, opacity: winMine === null ? 1 : 0.55 }], { duration: 760, easing: "cubic-bezier(.15,.85,.25,1)", fill: "forwards" });
      if (winMine === null) { push(fm, dmx, dmy, false); push(fo, dox, doy, false); }
      else { push(fm, dmx, dmy, winMine); push(fo, dox, doy, !winMine); }
    });
    at(MS - 260, () => end(false));
  }
  window.PDRBattleScene = { MS: EXTRA, DURATION: MS + DELAY, play };
})();
