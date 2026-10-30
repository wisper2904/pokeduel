// ============================================================================
// POKÉMON DUEL WEB - GAME JUICE ENGINE (v5.7.0)
// Screen shake, hit flash, floating damage, elemental particles, wheel feel,
// victory/defeat, UI polish, booster suspense, evolution cinematics, haptics,
// animated counters and board movement polish.
// Hooks are called from engine files via `window.Juice && Juice.xxx(...)`.
// ============================================================================
(function () {
  "use strict";
  if (window.Juice) return;

  // --------------------------------------------------------------------------
  // 0. SETTINGS (persisted)
  // --------------------------------------------------------------------------
  const LS_KEY = "pokeduel_juice_v1";
  const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const cfg = { fx: true, shake: !reduced, haptics: true };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(LS_KEY) || "{}")); } catch (e) {}
  function saveCfg() { try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch (e) {} }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const RAINBOW = ["#ef4444", "#f97316", "#facc15", "#4ade80", "#38bdf8", "#818cf8", "#e879f9"];

  // --------------------------------------------------------------------------
  // 1. HAPTICS
  // --------------------------------------------------------------------------
  function vibrate(pattern) {
    if (!cfg.haptics || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // 2. AUDIO (synth, reuses the game's AudioContext)
  // --------------------------------------------------------------------------
  function ac() {
    try {
      if (typeof ensureAudio === "function") ensureAudio();
      return (typeof sfxCtx !== "undefined") ? sfxCtx : null;
    } catch (e) { return null; }
  }
  function tone(f0, f1, dur, type, vol, delay) {
    const a = ac(); if (!a) return;
    try {
      const t = a.currentTime + (delay || 0);
      const o = a.createOscillator(), g = a.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(f0, t);
      if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol || 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(a.destination);
      o.start(t); o.stop(t + dur + 0.03);
    } catch (e) {}
  }
  function noise(dur, vol, fA, fB, delay) {
    const a = ac(); if (!a) return;
    try {
      const t = a.currentTime + (delay || 0);
      const len = Math.max(1, Math.floor(a.sampleRate * dur));
      const buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource(); src.buffer = buf;
      const f = a.createBiquadFilter(); f.type = "lowpass";
      f.frequency.setValueAtTime(fA, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, fB), t + dur);
      const g = a.createGain();
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      src.connect(f); f.connect(g); g.connect(a.destination);
      src.start(t); src.stop(t + dur + 0.03);
    } catch (e) {}
  }
  const SFX = {
    thump() { tone(150, 38, 0.22, "sine", 0.16); noise(0.12, 0.05, 1800, 200); },
    sparkle() { [880, 1175, 1568, 2093].forEach((f, i) => tone(f, f * 1.01, 0.16, "triangle", 0.045, i * 0.055)); },
    coin() { tone(988, 988, 0.07, "square", 0.04); tone(1319, 1319, 0.16, "square", 0.04, 0.07); },
    whoosh() { noise(0.35, 0.07, 400, 3800); },
    rumble(d) { noise(d, 0.09, 140, 900); tone(60, 110, d, "sawtooth", 0.05); },
    arpeggio(base) { [1, 1.25, 1.5, 2, 2.5].forEach((m, i) => tone(base * m, base * m, 0.2, "triangle", 0.06, i * 0.08)); },
    fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.22, "square", 0.045, i * 0.09)); },
    sad() { [392, 349, 311, 262].forEach((f, i) => tone(f, f * 0.98, 0.3, "triangle", 0.06, i * 0.16)); }
  };

  // --------------------------------------------------------------------------
  // 3. FX CANVAS ENGINE (particles / rings / glows / pillars / texts)
  // --------------------------------------------------------------------------
  let cv = null, cx = null, W = 0, H = 0, dpr = 1, running = false, lastT = 0;
  const parts = [], rings = [], glows = [], pillars = [], texts = [];

  function ensureCanvas() {
    if (cv) return true;
    if (!document.body) return false;
    cv = document.createElement("canvas");
    cv.id = "jx-fx-canvas";
    cv.style.cssText = "position:fixed; inset:0; width:100vw; height:100vh; pointer-events:none; z-index:99999;";
    document.body.appendChild(cv);
    cx = cv.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
    return true;
  }
  function resize() {
    if (!cv) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
  }
  // Pixel unit: scales sizes/speeds on large screens
  const U = () => clamp(Math.min(W || 360, H || 640) / 420, 0.8, 1.7);

  function start() {
    if (!ensureCanvas() || running) return;
    running = true; lastT = performance.now();
    requestAnimationFrame(loop);
  }

  function emit(o) {
    if (!cfg.fx || parts.length > 700) return;
    parts.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 0, life: 1, decay: 0.02, size: 4, color: "#fff", shape: "circle", rot: 0, vr: 0, glow: false }, o));
    start();
  }
  function addRing(o) {
    if (!cfg.fx) return;
    rings.push(Object.assign({ x: 0, y: 0, r: 8, vr: 4, w: 4, life: 1, decay: 0.04, color: "#fff" }, o)); start();
  }
  function addGlow(o) {
    if (!cfg.fx) return;
    glows.push(Object.assign({ x: 0, y: 0, r: 80, life: 1, decay: 0.05, color: "#fff" }, o)); start();
  }
  function addPillar(o) {
    if (!cfg.fx) return;
    pillars.push(Object.assign({ x: 0, y: 0, w: 70, h: 400, life: 1, decay: 0.02, color: "#fde047" }, o)); start();
  }
  function addText(o) {
    if (!cfg.fx) return;
    texts.push(Object.assign({ x: W / 2, y: H / 2, vx: 0, vy: -0.6, text: "", color: "#fff", size: 44, life: 1, decay: 0.012, age: 0, glow: null, wobble: 0, sub: "" }, o)); start();
  }

  function drawStar(c, r) {
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const rad = i % 2 === 0 ? r : r * 0.38, a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      c[i === 0 ? "moveTo" : "lineTo"](Math.cos(a) * rad, Math.sin(a) * rad);
    }
    c.closePath(); c.fill();
  }

  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
    const k = dt * 60;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, W, H);

    // glows (additive)
    cx.globalCompositeOperation = "lighter";
    for (let i = glows.length - 1; i >= 0; i--) {
      const g = glows[i]; g.life -= g.decay * k;
      if (g.life <= 0) { glows.splice(i, 1); continue; }
      const gr = cx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      gr.addColorStop(0, g.color); gr.addColorStop(1, "rgba(0,0,0,0)");
      cx.globalAlpha = clamp(g.life, 0, 1) * 0.85;
      cx.fillStyle = gr; cx.beginPath(); cx.arc(g.x, g.y, g.r, 0, Math.PI * 2); cx.fill();
    }
    // pillars (additive)
    for (let i = pillars.length - 1; i >= 0; i--) {
      const p = pillars[i]; p.life -= p.decay * k;
      if (p.life <= 0) { pillars.splice(i, 1); continue; }
      const w = p.w * (0.35 + 0.65 * p.life);
      const gr = cx.createLinearGradient(0, p.y, 0, p.y - p.h);
      gr.addColorStop(0, p.color); gr.addColorStop(1, "rgba(255,255,255,0)");
      cx.globalAlpha = clamp(p.life, 0, 1) * 0.8;
      cx.fillStyle = gr; cx.fillRect(p.x - w / 2, p.y - p.h, w, p.h);
    }
    cx.globalCompositeOperation = "source-over";

    // rings
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i]; r.r += r.vr * k; r.life -= r.decay * k;
      if (r.life <= 0 || r.r <= 1) { rings.splice(i, 1); continue; }
      cx.globalAlpha = clamp(r.life, 0, 1);
      cx.strokeStyle = r.color; cx.lineWidth = r.w * clamp(r.life + 0.3, 0.3, 1.3);
      cx.beginPath(); cx.arc(r.x, r.y, r.r, 0, Math.PI * 2); cx.stroke();
    }

    // particles
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vy += p.g * k;
      if (p.drag) { const d = Math.max(0, 1 - p.drag * k); p.vx *= d; p.vy *= d; }
      p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k; p.life -= p.decay * k;
      if (p.life <= 0 || p.y > H + 60 || p.y < -80 || p.x < -80 || p.x > W + 80) { parts.splice(i, 1); continue; }
      cx.globalAlpha = clamp(p.life * 1.4, 0, 1);
      cx.fillStyle = p.color; cx.strokeStyle = p.color;
      cx.globalCompositeOperation = p.glow ? "lighter" : "source-over";
      switch (p.shape) {
        case "spark":
          cx.lineWidth = Math.max(1, p.size * 0.5); cx.lineCap = "round";
          cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(p.x - p.vx * 2.6, p.y - p.vy * 2.6); cx.stroke(); break;
        case "square":
          cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
          cx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66); cx.restore(); break;
        case "leaf":
          cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
          cx.beginPath(); cx.ellipse(0, 0, p.size, p.size * 0.42, 0, 0, Math.PI * 2); cx.fill(); cx.restore(); break;
        case "drop":
          cx.save(); cx.translate(p.x, p.y); cx.rotate(Math.atan2(p.vy, p.vx));
          cx.beginPath(); cx.ellipse(0, 0, p.size * 1.3, p.size * 0.7, 0, 0, Math.PI * 2); cx.fill(); cx.restore(); break;
        case "shard":
          cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot);
          cx.beginPath(); cx.moveTo(0, -p.size * 1.3); cx.lineTo(p.size * 0.6, 0); cx.lineTo(0, p.size * 1.3); cx.lineTo(-p.size * 0.6, 0);
          cx.closePath(); cx.fill(); cx.restore(); break;
        case "star":
          cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); drawStar(cx, p.size * 1.2); cx.restore(); break;
        default:
          cx.beginPath(); cx.arc(p.x, p.y, Math.max(0.5, p.size * (p.glow ? 1 : (0.4 + 0.6 * p.life))), 0, Math.PI * 2); cx.fill();
      }
    }
    cx.globalCompositeOperation = "source-over";

    // floating texts
    for (let i = texts.length - 1; i >= 0; i--) {
      const tx = texts[i];
      tx.age += dt; tx.life -= tx.decay * k; tx.x += tx.vx * k; tx.y += tx.vy * k;
      if (tx.life <= 0) { texts.splice(i, 1); continue; }
      const a = tx.age;
      let s = a < 0.14 ? 0.3 + (a / 0.14) * 1.1 : (a < 0.3 ? 1.4 - ((a - 0.14) / 0.16) * 0.4 : 1);
      if (tx.wobble) s += Math.sin(a * 14) * tx.wobble;
      cx.save();
      cx.globalAlpha = clamp(tx.life * 2, 0, 1);
      cx.translate(tx.x, tx.y); cx.scale(s, s);
      cx.font = `900 ${tx.size}px "Arial Black", Impact, system-ui, sans-serif`;
      cx.textAlign = "center"; cx.textBaseline = "middle";
      cx.lineJoin = "round"; cx.lineWidth = tx.size * 0.2; cx.strokeStyle = "#0b1020";
      if (tx.glow) { cx.shadowColor = tx.glow; cx.shadowBlur = tx.size * 0.5; }
      cx.strokeText(tx.text, 0, 0);
      cx.fillStyle = tx.color; cx.fillText(tx.text, 0, 0);
      if (tx.sub) {
        cx.shadowBlur = 0;
        cx.font = `900 ${Math.round(tx.size * 0.38)}px "Arial Black", system-ui, sans-serif`;
        cx.lineWidth = tx.size * 0.09;
        cx.strokeText(tx.sub, 0, tx.size * 0.72);
        cx.fillStyle = "#ffffff"; cx.fillText(tx.sub, 0, tx.size * 0.72);
      }
      cx.restore();
    }
    cx.globalAlpha = 1;

    if (parts.length || rings.length || glows.length || pillars.length || texts.length) {
      requestAnimationFrame(loop);
    } else {
      running = false;
      cx.clearRect(0, 0, W, H);
    }
  }

  // --------------------------------------------------------------------------
  // 4. SCREEN-LEVEL EFFECTS (shake / flash / punch / vignette)
  // --------------------------------------------------------------------------
  function shakeTargets() {
    const out = [];
    const wo = document.getElementById("wheel-overlay");
    if (wo && wo.classList.contains("show")) out.push(wo);
    const bc = document.getElementById("booster-cinematic-canvas");
    if (bc && bc.style.display === "block") out.push(bc);
    if (!out.length) {
      const dm = document.getElementById("drawer-modal");
      if (dm && dm.classList.contains("show")) out.push(dm);
      else { const b = document.getElementById("board-canvas"); if (b) out.push(b); }
    }
    return out;
  }
  let shakeSt = null;
  function shake(mag, ms) {
    if (!cfg.shake) return;
    const now = performance.now();
    if (shakeSt && shakeSt.mag * (1 - (now - shakeSt.t0) / shakeSt.ms) > mag) return;
    const targets = shakeTargets();
    shakeSt = { mag, ms, t0: now, targets };
    if (shakeSt.running) return;
    shakeSt.running = true;
    const st = shakeSt;
    (function step(t) {
      if (shakeSt !== st) { st.targets.forEach(e => { if (!shakeSt || shakeSt.targets.indexOf(e) < 0) e.style.translate = ""; }); return; }
      const p = (t - st.t0) / st.ms;
      if (p >= 1) { st.targets.forEach(e => { e.style.translate = ""; }); shakeSt = null; return; }
      const m = st.mag * (1 - p) * (1 - p);
      const dx = (Math.random() * 2 - 1) * m, dy = (Math.random() * 2 - 1) * m;
      st.targets.forEach(e => { e.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`; });
      requestAnimationFrame(step);
    })(now);
  }

  function overlayDiv(id, css) {
    let d = document.getElementById(id);
    if (!d) {
      d = document.createElement("div"); d.id = id;
      d.style.cssText = "position:fixed; inset:0; pointer-events:none; opacity:0; " + css;
      document.body.appendChild(d);
    }
    return d;
  }
  function flash(alpha, ms, color) {
    if (!cfg.fx) return;
    const d = overlayDiv("jx-flash", "z-index:99998;");
    d.style.background = color || "#ffffff";
    d.animate([{ opacity: alpha }, { opacity: 0 }], { duration: ms || 160, easing: "ease-out" });
  }
  function vignette(color, alpha, ms) {
    if (!cfg.fx) return;
    const d = overlayDiv("jx-vignette", "z-index:99997;");
    d.style.background = `radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, ${color} 100%)`;
    d.animate([{ opacity: 0 }, { opacity: alpha, offset: 0.18 }, { opacity: alpha, offset: 0.65 }, { opacity: 0 }], { duration: ms || 700, easing: "ease-out" });
  }
  function punch(el, s, ms) {
    if (!el || !cfg.fx || !el.animate) return;
    try { el.animate([{ scale: "1" }, { scale: String(s) }, { scale: "1" }], { duration: ms || 150, easing: "ease-out" }); } catch (e) {}
  }
  function desaturate(el, ms) {
    if (!el || !cfg.fx || !el.animate) return;
    try {
      el.animate([{ filter: "none" }, { filter: "grayscale(0.85) contrast(1.25) brightness(0.85)", offset: 0.15 },
        { filter: "grayscale(0.85) contrast(1.25) brightness(0.85)", offset: 0.7 }, { filter: "none" }], { duration: ms || 700, easing: "ease-out" });
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // 5. COORDINATE MAPPING
  // --------------------------------------------------------------------------
  function mapCanvasPoint(id, lx, ly, lw, lh) {
    const c = document.getElementById(id);
    if (!c) return { x: W / 2, y: H / 2 };
    const r = c.getBoundingClientRect();
    if (!r.width) return { x: W / 2, y: H / 2 };
    return { x: r.left + (lx / lw) * r.width, y: r.top + (ly / lh) * r.height, scale: r.width / lw };
  }
  function overlayPoint(lx, ly) { return mapCanvasPoint("datadisk-canvas", lx, ly, 353, 530); }
  function boardPoint(lx, ly) {
    const lw = (typeof LOGICAL_W !== "undefined") ? LOGICAL_W : 353;
    const lh = (typeof LOGICAL_H !== "undefined") ? LOGICAL_H : 530;
    return mapCanvasPoint("board-canvas", lx, ly, lw, lh);
  }

  // --------------------------------------------------------------------------
  // 6. ELEMENTAL PARTICLE PROFILES
  // --------------------------------------------------------------------------
  const TYPE_FX = {
    fire:     { c: ["#fb923c", "#f97316", "#fde047", "#ef4444"], shape: "circle", glow: true, g: -0.07, spd: 3.2, n: 36, ring: "#f97316", main: "#fb923c" },
    water:    { c: ["#38bdf8", "#0ea5e9", "#bae6fd", "#ffffff"], shape: "drop", g: 0.13, spd: 3.6, n: 36, ring: "#38bdf8", main: "#38bdf8" },
    electric: { c: ["#fde047", "#fef9c3", "#ffffff", "#facc15"], shape: "spark", g: 0, spd: 7.5, n: 44, drag: 0.05, ring: "#fde047", main: "#fde047" },
    grass:    { c: ["#4ade80", "#22c55e", "#86efac", "#16a34a"], shape: "leaf", g: 0.03, spd: 2.8, n: 30, ring: "#4ade80", main: "#4ade80", spin: true },
    earth:    { c: ["#a8a29e", "#78716c", "#d6d3d1", "#a16207"], shape: "square", g: 0.2, spd: 4, n: 30, ring: "#a8a29e", main: "#d6d3d1", spin: true },
    ice:      { c: ["#a5f3fc", "#e0f2fe", "#ffffff", "#67e8f9"], shape: "shard", g: 0.05, spd: 3.2, n: 30, ring: "#67e8f9", main: "#67e8f9", spin: true },
    psychic:  { c: ["#f472b6", "#e879f9", "#fbcfe8", "#c026d3"], shape: "star", glow: true, g: -0.02, spd: 2.8, n: 28, ring: "#e879f9", main: "#e879f9", rings: 3, spin: true },
    ghost:    { c: ["#a78bfa", "#7c3aed", "#c4b5fd", "#4c1d95"], shape: "circle", glow: true, g: -0.05, spd: 2, n: 28, ring: "#8b5cf6", main: "#a78bfa" },
    poison:   { c: ["#c084fc", "#a855f7", "#4ade80", "#d8b4fe"], shape: "circle", g: -0.04, spd: 2.3, n: 26, ring: "#a855f7", main: "#c084fc" },
    fighting: { c: ["#ef4444", "#f97316", "#fde047", "#ffffff"], shape: "star", g: 0.05, spd: 5.2, n: 26, ring: "#ef4444", main: "#f87171", rings: 2, spin: true },
    normal:   { c: ["#ffffff", "#e2e8f0", "#fde047", "#cbd5e1"], shape: "star", g: 0.04, spd: 3.8, n: 26, ring: "#e2e8f0", main: "#ffffff", spin: true },
    flying:   { c: ["#e0f2fe", "#bae6fd", "#ffffff", "#93c5fd"], shape: "leaf", g: -0.01, spd: 3.2, n: 24, ring: "#bae6fd", main: "#bae6fd", spin: true },
    bug:      { c: ["#bef264", "#84cc16", "#fde047", "#65a30d"], shape: "circle", g: 0, spd: 3.2, n: 26, ring: "#a3e635", main: "#bef264" },
    dragon:   { c: ["#6366f1", "#facc15", "#a5b4fc", "#4338ca"], shape: "spark", glow: true, g: 0, spd: 5.4, n: 34, ring: "#818cf8", main: "#a5b4fc" },
    steel:    { c: ["#e2e8f0", "#94a3b8", "#ffffff", "#64748b"], shape: "spark", g: 0.06, spd: 6.2, n: 32, ring: "#cbd5e1", main: "#e2e8f0" },
    dark:     { c: ["#6d28d9", "#4c1d95", "#312e81", "#a78bfa"], shape: "circle", glow: true, g: -0.03, spd: 2.5, n: 30, ring: "#7c3aed", main: "#a78bfa" },
    fairy:    { c: ["#f9a8d4", "#fbcfe8", "#ffffff", "#f472b6"], shape: "star", glow: true, g: -0.03, spd: 2.5, n: 30, ring: "#f9a8d4", main: "#f9a8d4", spin: true }
  };
  function typeKey(t) {
    const s = String(t || "normal").toLowerCase().split(/[\/\s,]+/)[0];
    if (s === "rock" || s === "ground") return "earth";
    return TYPE_FX[s] ? s : "normal";
  }
  function typeMain(t) { return TYPE_FX[typeKey(t)].main; }

  function elementBurst(x, y, type, power, slow) {
    const p = TYPE_FX[typeKey(type)], u = U(), pw = power || 1;
    const n = Math.round(p.n * pw);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = p.spd * u * (0.35 + Math.random() * 0.95) * (0.8 + pw * 0.25) * (slow ? 0.35 : 1);
      emit({
        x: x + Math.cos(a) * 6 * u, y: y + Math.sin(a) * 6 * u,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6 * u,
        g: p.g * u * (slow ? 0.4 : 1), drag: p.drag || 0.012,
        size: rand(3, 6.5) * u, color: pick(p.c), shape: p.shape, glow: !!p.glow,
        rot: Math.random() * 6.28, vr: p.spin ? rand(-0.25, 0.25) : 0,
        life: 1, decay: rand(0.012, 0.026) * (slow ? 0.45 : 1)
      });
    }
    const rc = p.rings || 1;
    for (let i = 0; i < rc; i++) {
      setTimeout(() => addRing({ x, y, r: 6 * u, vr: (5 + i * 1.5) * u * (slow ? 0.5 : 1), w: 5 * u, color: p.ring, decay: slow ? 0.018 : 0.045 }), i * 70);
    }
    addGlow({ x, y, r: (70 + 25 * pw) * u, color: p.ring, decay: slow ? 0.03 : 0.07 });
    if (typeKey(type) === "electric") {
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * 6.28;
        for (let j = 1; j <= 7; j++) {
          emit({ x: x + Math.cos(a + (Math.random() - 0.5) * 0.7) * j * 11 * u, y: y + Math.sin(a + (Math.random() - 0.5) * 0.7) * j * 11 * u,
            vx: 0, vy: 0, size: 3.2 * u, color: "#ffffff", glow: true, decay: 0.09 + j * 0.01 });
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // 7. COMBAT JUICE
  // --------------------------------------------------------------------------
  const EFFECT_LABEL = {
    sleep: "SONO!", spore: "SONO!", panic: "PÂNICO!", freeze: "CONGELADO!", poison: "VENENO!",
    badpoison: "VENENO!", toxic: "VENENO!", paralyze: "PARALISIA!", burn: "QUEIMADO!",
    bench: "ESPERA!", heal: "NOCAUTE!", push: "EMPURRÃO!", swap: "TROCA!", wait: "ESPERA!", confuse: "CONFUSO!", noxious: "VENENO!"
  };
  const WHEEL_COL = { gold: "#facc15", purple: "#c084fc", white: "#ffffff", blue: "#38bdf8", red: "#ef4444" };

  function isRareSlice(s, isZ) {
    if (!s) return false;
    return !!(isZ || s.isZMove || s.color === "gold" || (s.color === "purple" && (s.stars || 0) >= 3) || (s.dmg || 0) >= 100);
  }
  function bottomRole() { return (typeof getBottomRole === "function") ? getBottomRole() : "p1"; }
  function wheelPointFor(unit) {
    const mine = unit && unit.owner === bottomRole();
    return mine ? overlayPoint(133, 384) : overlayPoint(220, 146);
  }

  let lastHapticTick = 0;
  function tick(p) {
    const a = ac();
    if (!a) return;
    const pitch = 520 + p * 700;
    tone(pitch, pitch * 0.4, 0.035, "square", 0.035 + p * 0.03);
    if (p > 0.55) {
      const now = performance.now();
      if (now - lastHapticTick > 110) { lastHapticTick = now; vibrate(4); }
    }
  }

  function onWheelStop(info) {
    if (!info) return;
    const pt = overlayPoint(info.cx, info.cy);
    const s = info.slice || null;
    const u = U();
    const rare = isRareSlice(s, false);
    const col = (s && WHEEL_COL[s.color]) || "#ffffff";
    const R = (pt.scale ? 62 * pt.scale : 90 * u);
    // focus ring converging onto the winning slice + soft glow
    addRing({ x: pt.x, y: pt.y, r: R * 1.8, vr: -R * 0.07, w: 4 * u, color: col, decay: 0.05 });
    addGlow({ x: pt.x, y: pt.y, r: R * 1.1, color: rare ? "#facc15" : col, decay: rare ? 0.035 : 0.07 });
    punch(document.getElementById("datadisk-canvas"), rare ? 1.045 : 1.022, 170);
    if (rare) {
      for (let i = 0; i < 16; i++) {
        const a = Math.random() * 6.28, sp = rand(1, 3.4) * u;
        emit({ x: pt.x + Math.cos(a) * R * 0.5, y: pt.y + Math.sin(a) * R * 0.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.8,
          size: rand(3, 5.5) * u, color: pick(["#fde047", "#facc15", "#ffffff"]), shape: "star", glow: true, rot: Math.random() * 6.28, vr: rand(-0.2, 0.2), decay: 0.02, g: 0.02 });
      }
      SFX.sparkle(); vibrate(14);
    } else vibrate(6);
  }

  function onImpact(info) {
    if (!info) return;
    const { outcome, winUnit, loser, winSpin, isZMove } = info;
    const wo = document.getElementById("wheel-overlay");

    if (!outcome || !winUnit || !loser || !winSpin) {
      // Blue defense / tie / both-miss
      const c = overlayPoint(176, 265), u = U();
      addRing({ x: c.x, y: c.y, r: 10 * u, vr: 3.4 * u, w: 4 * u, color: "#94a3b8" });
      addText({ x: c.x, y: c.y, text: "EMPATE!", color: "#cbd5e1", size: 34 * u, vy: -0.5, decay: 0.014 });
      SFX.thump(); vibrate(20); shake(3, 160);
      return;
    }

    const pt = wheelPointFor(loser), u = U();
    const crit = isRareSlice(winSpin, isZMove);
    const col = typeMain(winUnit.type);
    const stars = winSpin.stars || 0;
    const isKO = outcome.effect === "ko" || outcome.effect === "heal";

    // Floating number / label
    let main;
    if ((winSpin.dmg || 0) > 0) main = String(winSpin.dmg);
    else if (winSpin.color === "purple") main = "★".repeat(Math.min(5, stars || 1));
    else main = EFFECT_LABEL[outcome.effect] || "HIT!";
    const size = (crit ? 74 : 54) * u;
    addText({ x: pt.x, y: pt.y - 30 * u, text: main, color: crit ? "#fde047" : "#ffffff", glow: col, size,
      vy: -1.1 * u, decay: 0.0105, wobble: crit ? 0.06 : 0, sub: (winSpin.color === "purple" && (winSpin.dmg || 0) === 0 && EFFECT_LABEL[outcome.effect]) ? EFFECT_LABEL[outcome.effect] : "" });
    if (crit) {
      addText({ x: pt.x, y: pt.y - 30 * u - size * 0.95, text: isZMove ? "Z-MOVE!" : "CRÍTICO!", color: isZMove ? "#c084fc" : "#f97316",
        glow: isZMove ? "#e879f9" : "#facc15", size: 30 * u, vy: -0.9 * u, decay: 0.0105, wobble: 0.08 });
    }

    // Impact: element burst + hit flash + shake
    elementBurst(pt.x, pt.y, winUnit.type, isZMove ? 2.3 : (crit ? 1.6 : 1));
    addGlow({ x: pt.x, y: pt.y, r: 120 * u, color: "#ffffff", decay: 0.14 });
    flash(isZMove ? 0.7 : (crit ? 0.5 : 0.26), isZMove ? 320 : 180);
    shake(isZMove ? 16 : (crit ? 11 : 5.5), isZMove ? 520 : (crit ? 380 : 240));
    punch(wo, isZMove ? 1.05 : (crit ? 1.035 : 1.016), 190);
    SFX.thump();
    if (crit) SFX.sparkle();
    vibrate(isZMove ? [40, 30, 90, 30, 140] : (crit ? [30, 25, 60] : 20));

    // KO "freeze-frame": desaturate + vignette + slow second burst
    if (isKO && (crit || Math.random() < 0.6)) {
      desaturate(wo, 760);
      vignette("rgba(120,0,0,0.55)", 1, 760);
      setTimeout(() => {
        elementBurst(pt.x, pt.y, winUnit.type, 0.8, true);
        addText({ x: pt.x, y: pt.y + 46 * u, text: "KO!", color: "#fb7185", glow: "#e11d48", size: 40 * u, vy: -0.25, decay: 0.009 });
      }, 140);
    }
  }

  // --------------------------------------------------------------------------
  // 8. VICTORY / DEFEAT
  // --------------------------------------------------------------------------
  function confettiWave(count) {
    const u = U();
    for (let i = 0; i < count; i++) {
      emit({ x: rand(0, W), y: rand(-60, -4), vx: rand(-1.2, 1.2) * u, vy: rand(2, 4.4) * u, g: 0.045 * u, drag: 0.004,
        size: rand(5, 9) * u, color: pick(RAINBOW), shape: "square", rot: Math.random() * 6.28, vr: rand(-0.3, 0.3), decay: 0.0042 });
    }
  }
  function confettiCannon(fromLeft) {
    const u = U();
    for (let i = 0; i < 46; i++) {
      const ang = -Math.PI / 2 + (fromLeft ? 1 : -1) * rand(0.15, 0.7);
      const sp = rand(9, 17) * u;
      emit({ x: fromLeft ? 8 : W - 8, y: H - 8, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: 0.22 * u, drag: 0.012,
        size: rand(5, 9) * u, color: pick(RAINBOW), shape: Math.random() < 0.3 ? "star" : "square", rot: Math.random() * 6.28, vr: rand(-0.3, 0.3), decay: 0.0085 });
    }
  }
  function onMatchEnd(didWin) {
    const u = U();
    if (didWin) {
      confettiCannon(true); confettiCannon(false); SFX.fanfare();
      let waves = 0;
      const iv = setInterval(() => { confettiWave(22); if (++waves >= 5) clearInterval(iv); }, 360);
      addText({ x: W / 2, y: H * 0.26, text: "VITÓRIA!", color: "#fde047", glow: "#f97316", size: 64 * u, vy: 0, vx: 0, decay: 0.0065, wobble: 0.05 });
      flash(0.55, 420, "#fde68a");
      shake(7, 300);
      vibrate([60, 40, 60, 40, 150]);
    } else {
      SFX.sad();
      vignette("rgba(30,41,59,0.85)", 1, 1600);
      for (let i = 0; i < 40; i++) {
        emit({ x: rand(0, W), y: rand(-40, 0), vx: rand(-0.2, 0.2), vy: rand(1.4, 3) * u, g: 0.01, size: rand(2, 4) * u,
          color: "#94a3b8", shape: "drop", decay: 0.006 });
      }
      addText({ x: W / 2, y: H * 0.26, text: "DERROTA", color: "#fca5a5", glow: "#7f1d1d", size: 56 * u, vy: 0.25, decay: 0.0065 });
      vibrate([220, 80, 120]);
    }
    setTimeout(() => {
      const t = document.getElementById("win-result-title");
      if (t) { t.classList.remove("jx-bounce"); void t.offsetWidth; t.classList.add("jx-bounce"); }
    }, 40);
  }

  // --------------------------------------------------------------------------
  // 9. EVOLUTION / MEGA EVOLUTION CINEMATIC
  // --------------------------------------------------------------------------
  function onEvolution(unit, isMega) {
    if (!unit) return;
    const u = U();
    let pt = { x: W / 2, y: H * 0.5 };
    try {
      if (unit.location === "board" && unit.nodeId !== null && typeof getNodePos === "function") {
        const n = getNodePos(unit.nodeId); pt = boardPoint(n.x, n.y);
      }
    } catch (e) {}
    const main = isMega ? "#f472b6" : "#fde047";
    flash(isMega ? 0.95 : 0.7, isMega ? 520 : 380);
    shake(isMega ? 13 : 8, isMega ? 700 : 480);
    addPillar({ x: pt.x, y: pt.y + 14 * u, w: 80 * u, h: Math.min(pt.y + 40, 520 * u), color: main, decay: 0.012 });
    addGlow({ x: pt.x, y: pt.y, r: 150 * u, color: isMega ? "#fbcfe8" : "#fef9c3", decay: 0.02 });
    for (let i = 0; i < 3; i++) setTimeout(() => addRing({ x: pt.x, y: pt.y, r: 8 * u, vr: 5.2 * u, w: 5 * u, color: i === 1 ? "#ffffff" : main, decay: 0.03 }), i * 170);
    for (let i = 0; i < (isMega ? 70 : 46); i++) {
      const a = (i / 12) * Math.PI * 2 + rand(0, 0.3);
      emit({ x: pt.x + Math.cos(a) * rand(10, 40) * u, y: pt.y + 10 * u, vx: Math.cos(a) * rand(0.4, 2.2) * u, vy: rand(-5.5, -1.5) * u, g: 0.02 * u,
        size: rand(3, 6.5) * u, color: isMega ? pick(["#f472b6", "#e879f9", "#fbcfe8", "#ffffff", "#fde047"]) : pick(["#fde047", "#facc15", "#ffffff", "#fef9c3"]),
        shape: Math.random() < 0.5 ? "star" : "circle", glow: true, rot: Math.random() * 6.28, vr: rand(-0.2, 0.2), decay: rand(0.008, 0.016) });
    }
    addText({ x: W / 2, y: H * 0.2, text: isMega ? "MEGA EVOLUÇÃO!" : "EVOLUÇÃO!", color: isMega ? "#f9a8d4" : "#fde047",
      glow: isMega ? "#db2777" : "#f97316", size: (isMega ? 46 : 52) * u, vy: 0, decay: 0.0075, wobble: 0.04 });
    const bc = document.getElementById("board-canvas");
    if (bc && bc.animate && cfg.fx) {
      try { bc.animate([{ filter: "none" }, { filter: "brightness(2.2) saturate(0.2)", offset: 0.25 }, { filter: "none" }], { duration: 650, easing: "ease-out" }); } catch (e) {}
    }
    SFX.arpeggio(isMega ? 392 : 523); SFX.whoosh();
    vibrate([40, 30, 40, 30, 150]);
  }

  // --------------------------------------------------------------------------
  // 10. BOARD MOVEMENT (squash & stretch / trail / dust)
  // --------------------------------------------------------------------------
  function squash(a) {
    if (!cfg.fx || !a || a.portalAlpha > 0) return { sx: 1, sy: 1 };
    const stretch = Math.sin(clamp(a.p || 0, 0, 1) * Math.PI);
    const amt = (a.zmax || 12) > 20 ? 0.16 : 0.09;
    const sy = 1 + amt * stretch - amt * 0.9 * Math.pow(1 - stretch, 3);
    return { sx: clamp(1 / sy, 0.8, 1.2), sy: clamp(sy, 0.8, 1.25) };
  }
  let trailFrame = 0;
  function boardTrail(x, y, unit, segType) {
    if (!cfg.fx || typeof boardParticles === "undefined") return;
    if ((trailFrame++ & 1) === 1) return;
    const col = segType === "jump" ? "#c084fc" : (segType === "portal" ? "#38bdf8" : typeMain(unit && unit.type));
    boardParticles.push({ x: x + (Math.random() - 0.5) * 4, y: y + 5, vx: (Math.random() - 0.5) * 0.3, vy: -0.15, life: 0.9, decay: 0.07, size: 2.6, color: col });
  }
  function boardLand(x, y, segType) {
    if (!cfg.fx || typeof boardParticles === "undefined") return;
    const n = segType === "walk" ? 4 : 9;
    for (let i = 0; i < n; i++) {
      const dir = i % 2 === 0 ? -1 : 1;
      boardParticles.push({ x: x + dir * 4, y: y + 6, vx: dir * (0.5 + Math.random() * 1.1), vy: -(0.15 + Math.random() * 0.55), life: 1, decay: 0.05, size: 2.6, color: pick(["#e7e5e4", "#d6cfc2", "#ffffff"]) });
    }
    if (segType !== "walk") { vibrate(8); shake(2.2, 110); }
  }

  // --------------------------------------------------------------------------
  // 11. BOOSTER SUSPENSE (wraps BoosterCinematic.handleClick)
  // --------------------------------------------------------------------------
  function boosterReveal(fig) {
    const u = U(), x = W / 2, y = H * 0.45;
    const r = fig && fig.rarity;
    if (r === "UX") {
      flash(0.95, 650); shake(13, 600);
      for (let i = 0; i < 90; i++) {
        const a = Math.random() * 6.28, sp = rand(2, 9) * u;
        emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, g: 0.06 * u, size: rand(4, 8) * u, color: pick(RAINBOW),
          shape: Math.random() < 0.4 ? "star" : "square", glow: Math.random() < 0.4, rot: Math.random() * 6.28, vr: rand(-0.3, 0.3), decay: rand(0.006, 0.012) });
      }
      for (let i = 0; i < 4; i++) setTimeout(() => addRing({ x, y, r: 8 * u, vr: 6.5 * u, w: 5 * u, color: RAINBOW[(i * 2) % 7], decay: 0.022 }), i * 140);
      addGlow({ x, y, r: 260 * u, color: "#e879f9", decay: 0.014 });
      addText({ x: W / 2, y: H * 0.14, text: "ULTRA RARA!", color: "#f5d0fe", glow: "#c026d3", size: 46 * u, vy: 0, decay: 0.0085, wobble: 0.05 });
      SFX.fanfare(); SFX.sparkle(); vibrate([40, 30, 40, 30, 40, 30, 200]);
    } else if (r === "EX") {
      flash(0.65, 450); shake(8, 420);
      for (let i = 0; i < 52; i++) {
        const a = Math.random() * 6.28, sp = rand(2, 7) * u;
        emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, g: 0.05 * u, size: rand(3, 6.5) * u, color: pick(["#fde047", "#facc15", "#ffffff", "#f59e0b"]),
          shape: "star", glow: true, rot: Math.random() * 6.28, vr: rand(-0.25, 0.25), decay: rand(0.008, 0.016) });
      }
      addRing({ x, y, r: 8 * u, vr: 5.5 * u, w: 5 * u, color: "#facc15", decay: 0.028 });
      addGlow({ x, y, r: 200 * u, color: "#fde047", decay: 0.02 });
      SFX.sparkle(); vibrate([30, 25, 70]);
    } else if (r === "R") {
      flash(0.35, 300); shake(4, 220);
      elementBurst(x, y, "water", 0.8); SFX.sparkle(); vibrate(25);
    } else {
      flash(0.22, 240);
      for (let i = 0; i < 16; i++) {
        const a = Math.random() * 6.28, sp = rand(1.5, 4) * u;
        emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, size: rand(2, 4) * u, color: "#e2e8f0", decay: 0.025 });
      }
      vibrate(12);
    }
  }
  function boosterOpen() {
    const u = U();
    SFX.rumble(0.7); SFX.whoosh();
    flash(0.35, 350, "#bae6fd");
    shake(15, 800);
    vibrate([20, 20, 30, 20, 45, 20, 70, 20, 100]);
    const x = W / 2, y = H * 0.45;
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * 6.28;
      emit({ x: x + Math.cos(a) * 120 * u, y: y + Math.sin(a) * 120 * u, vx: -Math.cos(a) * 3 * u, vy: -Math.sin(a) * 3 * u, size: rand(2, 4) * u,
        color: pick(["#38bdf8", "#facc15", "#c084fc", "#ffffff"]), glow: true, shape: "circle", decay: 0.03 });
    }
  }
  function hookBooster() {
    let B = null;
    try { B = (typeof BoosterCinematic !== "undefined") ? BoosterCinematic : null; } catch (e) {}
    if (!B || B.__jx || typeof B.handleClick !== "function") return;
    B.__jx = true;
    const orig = B.handleClick;
    B.handleClick = function (e) {
      const before = this.phase, idx = this.currentIndex;
      orig.call(this, e);
      if (!this.active) return;
      if (before === "box_floating" && this.phase === "box_opening") {
        this.shakeAmt = Math.max(this.shakeAmt || 0, 28);
        boosterOpen();
      } else if (before === "box_opening" && this.phase === "figure_reveal") {
        boosterReveal(this.pulledList[this.currentIndex]);
      } else if (before === "figure_reveal" && this.currentIndex > idx) {
        boosterReveal(this.pulledList[this.currentIndex]);
      }
    };
  }

  // --------------------------------------------------------------------------
  // 12. ANIMATED COUNTERS (coins, gems, cubes ...)
  // --------------------------------------------------------------------------
  const BOOT_T = performance.now();
  const COUNTER_IDS = ["coins-lbl", "rm-lbl", "cc-lbl", "fusion-coins-lbl", "carmonite-lbl", "key-frag-lbl"];
  const counterState = {};
  let lastCoinSfx = 0;
  function parseNum(s) { const n = parseInt(String(s).replace(/[^\d-]/g, ""), 10); return isNaN(n) ? null : n; }
  function animateCounter(el, from, to) {
    const useComma = /,/.test(el.textContent) || to >= 10000 || from >= 10000;
    const fmt = (v) => useComma ? Math.round(v).toLocaleString("en-US") : String(Math.round(v));
    const st = counterState[el.id];
    if (st && st.raf) cancelAnimationFrame(st.raf);
    const dur = clamp(Math.abs(to - from) * 8, 350, 1100);
    const t0 = performance.now();
    el.__jxBusy = true;
    if (to > from) {
      el.classList.remove("jx-pop"); void el.offsetWidth; el.classList.add("jx-pop");
      try {
        const r = el.getBoundingClientRect();
        for (let i = 0; i < 8; i++) emit({ x: r.left + r.width / 2, y: r.top + r.height / 2, vx: rand(-2, 2), vy: rand(-3, -0.5), g: 0.12, size: rand(2.5, 4.5),
          color: pick(["#fde047", "#facc15", "#ffffff"]), shape: "star", glow: true, rot: Math.random() * 6.28, vr: 0.2, decay: 0.03 });
      } catch (e) {}
      const now = performance.now();
      if (now - lastCoinSfx > 140) { lastCoinSfx = now; SFX.coin(); vibrate(8); }
    }
    (function step(t) {
      const p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) { counterState[el.id].raf = requestAnimationFrame(step); }
      else { el.textContent = fmt(to); el.__jxBusy = false; counterState[el.id].raf = 0; }
    })(t0);
  }
  function setupCounters() {
    COUNTER_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      counterState[id] = { val: parseNum(el.textContent), raf: 0 };
      new MutationObserver(() => {
        if (el.__jxBusy) return;
        const nv = parseNum(el.textContent);
        const st = counterState[id];
        if (nv === null) return;
        // Ignore startup syncs and hidden labels (update silently, no animation)
        if (st.val === null || performance.now() - BOOT_T < 3000 || el.offsetParent === null) { st.val = nv; return; }
        if (nv !== st.val && Math.abs(nv - st.val) >= 1) {
          const from = st.val; st.val = nv;
          animateCounter(el, from, nv);
        }
      }).observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  // --------------------------------------------------------------------------
  // 13. MENU / UI JUICE (CSS + wrappers)
  // --------------------------------------------------------------------------
  function injectCss() {
    const st = document.createElement("style");
    st.id = "jx-styles";
    st.textContent = `
      .btn, .nav-metal-btn { transition: transform .14s cubic-bezier(.34,1.56,.64,1), filter .14s; -webkit-tap-highlight-color: transparent; }
      .btn:active, .nav-metal-btn:active { transform: scale(.92); filter: brightness(1.15); }
      .nav-metal-btn.active img { animation: jxNavBounce .55s cubic-bezier(.34,1.56,.64,1); filter: drop-shadow(0 0 6px rgba(56,189,248,.8)); }
      @keyframes jxNavBounce { 0% { transform: translateY(6px) scale(.8); } 55% { transform: translateY(-5px) scale(1.18); } 100% { transform: translateY(0) scale(1); } }
      @keyframes jxTabIn { from { opacity: 0; translate: 0 16px; } to { opacity: 1; translate: 0 0; } }
      .jx-tab-in { animation: jxTabIn .28s ease-out; }
      @keyframes jxCardIn { from { opacity: 0; transform: translateY(14px) scale(.86); } to { opacity: 1; transform: none; } }
      .jx-tab-in #deck-figures-2x3-grid > *, .jx-tab-in #deck-plates-1x6-row > *, .jx-tab-in #collection-grid > *, .jx-tab-in #deck-plates-catalog-grid > * {
        animation: jxCardIn .42s cubic-bezier(.34,1.56,.64,1) both; animation-delay: calc(var(--jxi, 0) * 40ms);
      }
      #collection-grid > .card:active, #deck-figures-2x3-grid > div:active, #deck-plates-1x6-row > div:active { transform: scale(.96); transition: transform .1s; }
      .jx-ux, .jx-ex { position: relative; overflow: hidden; }
      .jx-ux::after, .jx-ex::after { content: ""; position: absolute; top: -20%; left: -60%; width: 38%; height: 140%; pointer-events: none;
        background: linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,.5), rgba(255,255,255,0)); transform: skewX(-18deg); animation: jxShine 3.4s ease-in-out infinite; }
      .jx-ux::after { background: linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(232,121,249,.4), rgba(255,255,255,0)); }
      @keyframes jxShine { 0%, 55% { left: -60%; } 100% { left: 135%; } }
      @keyframes jxPop { 0% { opacity: 0; transform: scale(.82) translateY(10px); } 60% { opacity: 1; transform: scale(1.04); } 100% { transform: scale(1); } }
      #figure-details-modal[style*="display: flex"] > div, #plate-details-modal[style*="display: flex"] > div, #slot-chooser-modal[style*="display: flex"] > div,
      #booster-unbox-modal[style*="display: flex"] > div, #play-mode-modal[style*="display: flex"] > div, #weekly-buff-info-modal[style*="display: flex"] > div,
      #player-profile-modal[style*="display: flex"] > div, #changelog-modal[style*="display: flex"] > div, #rename-team-modal[style*="display: flex"] > div,
      #delete-team-modal[style*="display: flex"] > div, #win-result-overlay[style*="display: flex"] > div { animation: jxPop .34s cubic-bezier(.34,1.56,.64,1); }
      @keyframes jxBounceTitle { 0% { transform: scale(.2) rotate(-8deg); opacity: 0; } 55% { transform: scale(1.35) rotate(3deg); opacity: 1; } 78% { transform: scale(.94); } 100% { transform: scale(1); } }
      .jx-bounce { display: inline-block; animation: jxBounceTitle .8s cubic-bezier(.34,1.56,.64,1); }
      @keyframes jxCounterPop { 0% { transform: scale(1); } 35% { transform: scale(1.35); color: #fde047; text-shadow: 0 0 10px #facc15; } 100% { transform: scale(1); } }
      .jx-pop { display: inline-block; animation: jxCounterPop .5s ease-out; }
    `;
    document.head.appendChild(st);
  }

  function tagRarity() {
    document.querySelectorAll(".deck-slot-card-v540, #collection-grid > .card, #deck-figures-2x3-grid > div").forEach((c) => {
      const ux = !!c.querySelector(".ux-rainbow-badge, .ux-purple-badge");
      const ex = !!c.querySelector(".ex-gold-badge");
      c.classList.toggle("jx-ux", ux); c.classList.toggle("jx-ex", ex && !ux);
    });
  }
  function wrapUi() {
    if (typeof renderHubAndCollection === "function") {
      const orig = renderHubAndCollection;
      renderHubAndCollection = function () { const r = orig.apply(this, arguments); try { tagRarity(); } catch (e) {} return r; };
    }
    if (typeof switchDrawerTab === "function") {
      const orig = switchDrawerTab;
      switchDrawerTab = function (tabId) {
        const r = orig.apply(this, arguments);
        try {
          const el = document.getElementById("dtab-" + tabId);
          if (el) {
            ["#deck-figures-2x3-grid", "#deck-plates-1x6-row", "#collection-grid", "#deck-plates-catalog-grid"].forEach((sel) => {
              el.querySelectorAll(sel + " > *").forEach((ch, i) => ch.style.setProperty("--jxi", Math.min(i, 14)));
            });
            el.classList.remove("jx-tab-in"); void el.offsetWidth; el.classList.add("jx-tab-in");
            clearTimeout(el.__jxT); el.__jxT = setTimeout(() => el.classList.remove("jx-tab-in"), 900);
          }
          vibrate(6);
        } catch (e) {}
        return r;
      };
    }
    // Light haptic feedback on any button press
    document.addEventListener("pointerdown", (ev) => {
      const b = ev.target && ev.target.closest && ev.target.closest(".btn, .nav-metal-btn");
      if (b) vibrate(5);
    }, true);
  }

  // --------------------------------------------------------------------------
  // 14. SETTINGS CARD (Config tab)
  // --------------------------------------------------------------------------
  function injectSettings() {
    const menu = document.getElementById("dtab-menu");
    if (!menu || document.getElementById("jx-settings")) return;
    const exitBtn = menu.querySelector('button[onclick="openExitGameModal()"]');
    const card = document.createElement("div");
    card.id = "jx-settings";
    card.style.cssText = "background:#071124; border:1px solid #1e3a8a; border-radius:8px; padding:8px 10px; margin-bottom:8px;";
    const rows = [["fx", "✨ Efeitos visuais (partículas, textos, flashes)"], ["shake", "📳 Tremor de tela"], ["haptics", "📲 Vibração do celular"]];
    const html = rows.map(([k, label]) =>
      `<div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;"><span style="font-size:10px; font-weight:800; color:#e2e8f0;">${label}</span>` +
      `<button data-jx="${k}" class="btn secondary" style="padding:3px 10px; font-size:9.5px; font-weight:900; min-width:54px;"></button></div>`).join("");
    card.innerHTML = `<div style="font-size:10.5px; font-weight:900; color:#facc15;">🎮 GAME JUICE</div>${html}`;
    const refresh = () => card.querySelectorAll("button[data-jx]").forEach((b) => {
      const on = !!cfg[b.dataset.jx];
      b.textContent = on ? "LIGADO" : "DESLIG."; b.style.color = on ? "#4ade80" : "#f87171";
    });
    card.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-jx]"); if (!b) return;
      cfg[b.dataset.jx] = !cfg[b.dataset.jx]; saveCfg(); refresh();
      if (b.dataset.jx === "haptics" && cfg.haptics) navigator.vibrate && navigator.vibrate(40);
    });
    refresh();
    if (exitBtn && exitBtn.parentNode) exitBtn.parentNode.insertBefore(card, exitBtn); else menu.appendChild(card);
  }

  // --------------------------------------------------------------------------
  // 15. PUBLIC API & BOOT
  // --------------------------------------------------------------------------
  window.Juice = {
    cfg, saveCfg, tick, onWheelStop, onImpact, onMatchEnd, onEvolution,
    squash, boardTrail, boardLand, shake, flash, vibrate, elementBurst, boosterReveal
  };

  function boot() {
    try { injectCss(); } catch (e) { console.warn("[Juice] css", e); }
    try { ensureCanvas(); } catch (e) {}
    try { wrapUi(); } catch (e) { console.warn("[Juice] wrapUi", e); }
    try { hookBooster(); } catch (e) { console.warn("[Juice] booster", e); }
    try { setupCounters(); } catch (e) { console.warn("[Juice] counters", e); }
    try { injectSettings(); } catch (e) { console.warn("[Juice] settings", e); }
    try { tagRarity(); } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
