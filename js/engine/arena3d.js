// ============================================================================
// v719 · Arena no layout do Pokémon Duel original (refeita a partir de capturas do jogo)
//  - Tabuleiro PLANO como no original (sem mesa inclinada): o chão de cristal/mármore ocupa a tela toda, com reflexos.
//  - Posições medidas nas capturas (tela 415×739 → lógico 353×530):
//      P.C. do oponente: 2 cúpulas verdes em cima à esquerda; o monte de plates dele fica atrás delas.
//      P.C. seu: 2 cúpulas verdes embaixo à direita, ao lado do banco; sua carta de plates no canto de baixo à direita.
//      Máquinas redondas com pokébola: a sua (azul) embaixo à esquerda, a do oponente (laranja) em cima à direita.
//      Banco: anéis brancos em 2 fileiras. Barras de divisão em y 158 e 367 (amarela do lado de quem joga).
//  - As coordenadas de BOARD_NODES / bancos / P.C. são reescritas no lugar (os mesmos arrays) → toque e desenho batem.
//  - Animações: brilho passando no chão, faíscas nos cristais, pulsos nas linhas, Gols e Entradas pulsando,
//    cúpulas com bolhas e luz, máquinas com anéis girando, cartas com brilho.
//  - Segurar a peça (480 ms) abre os Dados. Tocar na sua carta abre as plates. Cartão de roleta do canto desligado.
// Carrega depois de plates_all.js. API: window.PDRArena.
// ============================================================================
(function () {
  "use strict";
  if (typeof BOARD_NODES === "undefined" || typeof drawFullTabletopFrame !== "function") return;
  window.PDR_ARENA3D = true;
  const W = LOGICAL_W, H = LOGICAL_H;

  // ------------------------------------------------------------------ layout do original
  // nós: mesmo grafo, num retângulo de x 38–314 (as fileiras de cima e de baixo com a mesma largura)
  BOARD_NODES.forEach((n) => {
    const k = 1.30 + (1.186 - 1.30) * ((n.y - 185) / (343 - 185));
    n.x = 176 + (n.x - 176) * k;
    n.y = 184 + (n.y - 185) * 0.97;
  });
  const L = {
    topBench: [[136, 123], [191, 123], [251, 123], [162, 141], [221, 141], [278, 141]],
    botBench: [[60, 389], [123, 389], [189, 389], [91, 414], [157, 414], [225, 414]],
    topPods: [[62, 144], [94, 144]], botPods: [[272, 395], [305, 395]]
  };
  const setXY = (o, p) => { o.x = p[0]; o.y = p[1]; };
  P2_BENCH_COORDS.forEach((s, i) => setXY(s, L.topBench[i]));
  BENCH_SLOTS_P1.forEach((s, i) => setXY(s, L.botBench[i]));
  REVIVER_PODS_P2.forEach((s, i) => setXY(s, L.topPods[i]));
  REVIVER_PODS_P1.forEach((s, i) => setXY(s, L.botPods[i]));
  const DECK = { top: { x: 80, y: 84, w: 40, h: 36 }, bot: { x: 304, y: 449, w: 46, h: 42 } };
  const MACH = { bot: { x: 30, y: 452 }, top: { x: 314, y: 94 } };
  window.PDR_ULTRA_POS = { top: [-99, -99], bot: [-99, -99] }; // o contador da Ultra Space vai dentro das máquinas
  const BAR = { top: 158, bot: 367, x0: 18, x1: 335 };
  const depthScale = () => 1;
  window.PDRArena = { P: (x, y) => ({ x, y }), depthScale, srcY: (y) => y, layout: L, deck: DECK };

  const hexA = (hex, a) => { const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

  // ------------------------------------------------------------------ chão (Tema da arena)
  const THEME = {
    crystal: { kind: "crystal", base: ["#262c3a", "#07090e"], hi: "#dbe4f0", tint: "#7c8db0" },          // cristal escuro (padrão do original)
    marble: { kind: "marble", base: ["#e9e6e1", "#c9c3ba"], vein: "#8a8580", hi: "#ffffff" },
    banana: { kind: "crystal", base: ["#5a4113", "#1d1406"], hi: "#fde68a", tint: "#f59e0b" },
    wood: { kind: "wood", base: ["#5a3418", "#2c180a"], vein: "#8a5530", hi: "#fcd9b6" },
    stone: { kind: "magma", base: ["#3b130a", "#120604"], hi: "#fdba74", tint: "#f97316" },
    habitats: { kind: "crystal", base: ["#5b7d96", "#1f3447"], hi: "#e0f2fe", tint: "#7dd3fc" }           // cristal de gelo
  };
  const theme = () => THEME[state.surface] || THEME.crystal;
  function makeFloor(th, S) {
    const c = document.createElement("canvas"); c.width = W * S; c.height = H * S; const g = c.getContext("2d"); g.scale(S, S);
    const r = rnd(4242);
    const bg = g.createLinearGradient(0, 0, W * 0.4, H); bg.addColorStop(0, th.base[0]); bg.addColorStop(1, th.base[1]); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    if (th.kind === "crystal" || th.kind === "magma") {
      // reflexos iridescentes de fundo
      [["#7c3aed", 0.07], ["#0ea5e9", 0.07], ["#14b8a6", 0.05], ["#f472b6", 0.04]].forEach(([col, al]) => {
        for (let i = 0; i < 3; i++) { const x = r() * W, y = r() * H, rad = 90 + r() * 160; const rg = g.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, hexA(col, al)); rg.addColorStop(1, hexA(col, 0)); g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      });
      // placas de cristal grandes: cada uma dividida em faces (claro de um lado, escuro do outro)
      for (let i = 0; i < 110; i++) {
        const cx = r() * W, cy = r() * H, s = 34 + r() * 90, a0 = r() * 6.28, k = 4 + Math.floor(r() * 3);
        const pts = []; for (let j = 0; j < k; j++) { const a = a0 + (j / k) * 6.28 + (r() - 0.5) * 0.5, rr = s * (0.5 + r() * 0.6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8]); }
        const lit = r(), ox = cx + (r() - 0.5) * s * 0.4, oy = cy + (r() - 0.5) * s * 0.3;
        for (let j = 0; j < k; j++) {
          const p0 = pts[j], p1 = pts[(j + 1) % k];
          g.beginPath(); g.moveTo(ox, oy); g.lineTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.closePath();
          const face = ((j / k) + lit) % 1; // luz vindo de cima à esquerda
          const lg = g.createLinearGradient(ox, oy, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
          lg.addColorStop(0, `rgba(0,0,0,${0.06 + r() * 0.12})`);
          lg.addColorStop(1, face < 0.35 ? hexA(th.hi, 0.05 + r() * 0.13) : face < 0.6 ? hexA(th.tint, 0.03 + r() * 0.08) : `rgba(0,0,0,${0.12 + r() * 0.22})`);
          g.fillStyle = lg; g.fill();
        }
        g.beginPath(); pts.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
        g.strokeStyle = hexA(th.hi, 0.03 + r() * 0.06); g.lineWidth = 0.5; g.stroke();
      }
      // arestas que pegam luz
      g.save(); g.globalCompositeOperation = "lighter";
      for (let i = 0; i < 46; i++) {
        const x = r() * W, y = r() * H, len = 12 + r() * 45, a = -0.9 + r() * 0.5;
        const lg = g.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len); lg.addColorStop(0, hexA(th.hi, 0)); lg.addColorStop(0.5, hexA(th.hi, 0.12 + r() * 0.2)); lg.addColorStop(1, hexA(th.hi, 0));
        g.strokeStyle = lg; g.lineWidth = 0.6 + r() * 0.9; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
      }
      g.restore();
      if (th.kind === "magma") for (let i = 0; i < 26; i++) { // veios de lava
        g.save(); g.strokeStyle = "#f97316"; g.shadowColor = "#fb923c"; g.shadowBlur = 8; g.globalAlpha = 0.35 + r() * 0.4; g.lineWidth = 0.8 + r() * 1.6;
        let x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); g.restore();
      }
    } else if (th.kind === "marble") {
      for (let i = 0; i < 120; i++) { const x = r() * W, y = r() * H, rad = 30 + r() * 120; const rg = g.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, r() < 0.5 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)"); rg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      for (let i = 0; i < 12; i++) {
        let x = r() * W, y = r() * H, ang = r() * 6.28; const pts = [[x, y]];
        for (let k = 0; k < 30; k++) { ang += (r() - 0.5) * 0.4; x += Math.cos(ang) * 12; y += Math.sin(ang) * 12; pts.push([x, y]); }
        [[5, 0.05, 10], [2, 0.12, 4], [0.9, 0.4, 0]].forEach(([lw, al, bl]) => { g.save(); g.strokeStyle = th.vein; g.globalAlpha = al; g.lineWidth = lw; g.shadowColor = th.vein; g.shadowBlur = bl; g.beginPath(); pts.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); g.restore(); });
      }
    } else {
      for (let y = 0; y < H; y += 3 + r() * 4) { g.strokeStyle = th.vein; g.globalAlpha = 0.15 + r() * 0.25; g.lineWidth = 0.8 + r() * 2; g.beginPath(); let yy = y; g.moveTo(0, yy); for (let x = 0; x <= W; x += 24) { yy += (r() - 0.5) * 3; g.lineTo(x, yy); } g.stroke(); }
      g.globalAlpha = 1;
    }
    const gl = g.createLinearGradient(0, 0, 0, H); gl.addColorStop(0, "rgba(255,255,255,0.08)"); gl.addColorStop(0.5, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(0,0,0,0.25)");
    g.fillStyle = gl; g.fillRect(0, 0, W, H);
    const vg = g.createRadialGradient(W / 2, H * 0.5, 140, W / 2, H * 0.5, 380); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.55)");
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }
  let cache = { key: null };
  function ensure() {
    const S = window.ACTIVE_SCALE || HD_SCALE, key = (state.surface || "crystal") + "@" + S;
    if (cache.key !== key) { const th = theme(); const f = makeFloor(th, S); cache = { key, th, floor: f, room: f, tex: f, table: f }; }
    return cache;
  }

  // ------------------------------------------------------------------ helpers
  const botRole = () => getBottomRole(), topRole = () => (getBottomRole() === "p1" ? "p2" : "p1");
  const myTurn = () => state.turn === botRole();
  function ell(x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.28); }

  const glints = Array.from({ length: 22 }, (_, i) => { const r = rnd(i * 31 + 7); return { x: r() * W, y: 60 + r() * 440, ph: r() * 6.28, sp: 0.6 + r() * 1.2 }; });
  function drawFloorAnim(T) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const per = 8000, k = (T % per) / per, x = -160 + k * (W + 320);
    const sg = ctx.createLinearGradient(x - 90, 0, x + 90, 160);
    sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, "rgba(255,255,255,0.07)"); sg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sg; ctx.fillRect(0, 52, W, H - 52);
    glints.forEach((p) => {
      const a = Math.max(0, Math.sin(T * 0.0012 * p.sp + p.ph)); if (a < 0.6) return;
      const s = (a - 0.6) * 7.5;
      ctx.fillStyle = `rgba(255,255,255,${(a - 0.6) * 1.6})`;
      ctx.beginPath(); ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x, p.y - s * 0.25); ctx.lineTo(p.x + s, p.y); ctx.lineTo(p.x, p.y + s * 0.25); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + s * 0.25, p.y); ctx.lineTo(p.x, p.y + s); ctx.lineTo(p.x - s * 0.25, p.y); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }
  function drawBars(T) {
    [[BAR.top, !myTurn(), "right"], [BAR.bot, myTurn(), "left"]].forEach(([y, active, side]) => {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(BAR.x0, y - 1.6, BAR.x1 - BAR.x0, 3.8);
      ctx.fillStyle = "rgba(226,232,240,0.85)"; ctx.fillRect(BAR.x0, y - 1.1, BAR.x1 - BAR.x0, 2.2);
      if (active) {
        const a0 = side === "right" ? 140 : BAR.x0, a1 = side === "right" ? BAR.x1 : 230;
        ctx.shadowColor = "#facc15"; ctx.shadowBlur = 6 + Math.sin(T * 0.005) * 3;
        ctx.fillStyle = "#facc15"; ctx.fillRect(a0, y - 1.4, a1 - a0, 2.8);
      }
      ctx.restore();
    });
  }
  const pulses = [];
  function drawRoutes(T) {
    const light = theme().kind === "marble";
    ctx.save(); ctx.lineCap = "round";
    BOARD_EDGES.forEach(([a, b]) => { const p = BOARD_NODES[a], q = BOARD_NODES[b]; ctx.strokeStyle = light ? "rgba(15,23,42,0.35)" : "rgba(0,0,0,0.7)"; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(p.x, p.y + 0.6); ctx.lineTo(q.x, q.y + 0.6); ctx.stroke(); });
    BOARD_EDGES.forEach(([a, b]) => { const p = BOARD_NODES[a], q = BOARD_NODES[b]; ctx.strokeStyle = light ? "#1e293b" : "#f8fafc"; ctx.lineWidth = 2.1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); });
    if (pulses.length < 6 && Math.random() < 0.04) { const e = BOARD_EDGES[Math.floor(Math.random() * BOARD_EDGES.length)]; pulses.push({ a: e[0], b: e[1], t: 0, sp: 0.01 + Math.random() * 0.012 }); }
    ctx.globalCompositeOperation = "lighter";
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]; p.t += p.sp; if (p.t >= 1) { pulses.splice(i, 1); continue; }
      const A = BOARD_NODES[p.a], B = BOARD_NODES[p.b], x = A.x + (B.x - A.x) * p.t, y = A.y + (B.y - A.y) * p.t, al = Math.sin(p.t * Math.PI);
      const rg = ctx.createRadialGradient(x, y, 0, x, y, 6); rg.addColorStop(0, `rgba(186,230,253,${0.85 * al})`); rg.addColorStop(1, "rgba(186,230,253,0)");
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.28); ctx.fill();
    }
    ctx.restore();
  }
  function drawNodes(T) {
    const light = theme().kind === "marble", white = light ? "#0f172a" : "#f8fafc", hole = light ? "#f8fafc" : "#0b1220";
    BOARD_NODES.forEach((n) => {
      ctx.save();
      if (n.role.startsWith("entry")) {
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ell(n.x, n.y + 1, 14.5, 14.5); ctx.fill();
        ctx.fillStyle = hole; ell(n.x, n.y, 13.5, 13.5); ctx.fill();
        [[13.5, 2.0], [9.2, 1.6], [4.8, 1.5]].forEach(([r, lw]) => { ctx.strokeStyle = white; ctx.lineWidth = lw; ell(n.x, n.y, r, r); ctx.stroke(); });
        const sv = Math.sin(T * 0.003 + n.id), pul = 0.25 + Math.max(0, sv) * 0.35;
        ctx.strokeStyle = `rgba(255,255,255,${pul})`; ctx.lineWidth = 1; ell(n.x, n.y, 16 + sv * 1.2, 16 + sv * 1.2); ctx.stroke();
      } else if (n.role.startsWith("goal")) {
        const mine = n.y > 265;
        const col = mine ? "#2563eb" : "#ea580c", glow = mine ? "#60a5fa" : "#fb923c";
        const pul = 1 + Math.sin(T * 0.004) * 0.06;
        const gg = ctx.createRadialGradient(n.x, n.y, 4, n.x, n.y, 26 * pul); gg.addColorStop(0, hexA(glow, 0.8)); gg.addColorStop(0.6, hexA(glow, 0.25)); gg.addColorStop(1, hexA(glow, 0));
        ctx.fillStyle = gg; ell(n.x, n.y, 26 * pul, 26 * pul); ctx.fill();
        const fg = ctx.createRadialGradient(n.x - 4, n.y - 5, 2, n.x, n.y, 16); fg.addColorStop(0, mine ? "#93c5fd" : "#fdba74"); fg.addColorStop(1, col);
        ctx.fillStyle = fg; ell(n.x, n.y, 15.5, 15.5); ctx.fill();
        ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = 2.2; ell(n.x, n.y, 15.5, 15.5); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.2; ell(n.x, n.y, 11.5, 11.5); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.beginPath();
        if (mine) { ctx.moveTo(n.x - 3.6, n.y - 5.2); ctx.lineTo(n.x + 5.6, n.y); ctx.lineTo(n.x - 3.6, n.y + 5.2); }
        else { ctx.moveTo(n.x + 3.6, n.y - 5.2); ctx.lineTo(n.x - 5.6, n.y); ctx.lineTo(n.x + 3.6, n.y + 5.2); }
        ctx.closePath(); ctx.fill();
        const w = (T % 1800) / 1800;
        ctx.strokeStyle = hexA(glow, 0.7 * (1 - w)); ctx.lineWidth = 1.6; ell(n.x, n.y, 16 + w * 14, 16 + w * 14); ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ell(n.x, n.y + 0.8, 5.6, 5.6); ctx.fill();
        ctx.fillStyle = hole; ell(n.x, n.y, 4.6, 4.6); ctx.fill();
        ctx.strokeStyle = white; ctx.lineWidth = 1.8; ell(n.x, n.y, 4.6, 4.6); ctx.stroke();
      }
      ctx.restore();
    });
  }
  function drawBenchRings() {
    [[P2_BENCH_COORDS, 15.5, 10.5], [BENCH_SLOTS_P1, 19, 12.5]].forEach(([arr, rx, ry]) => arr.forEach((p) => {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ell(p.x, p.y + 1.5, rx + 1.5, ry + 1.2); ctx.fill();
      ctx.fillStyle = "rgba(10,14,22,0.35)"; ell(p.x, p.y, rx, ry); ctx.fill();
      ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 3.4; ell(p.x, p.y, rx, ry); ctx.stroke();
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.6; ell(p.x, p.y - 0.4, rx, ry); ctx.stroke();
      ctx.strokeStyle = "rgba(100,116,139,0.8)"; ctx.lineWidth = 0.8; ell(p.x, p.y, rx - 2.4, ry - 1.8); ctx.stroke();
      ctx.restore();
    }));
  }

  // ------------------------------------------------------------------ P.C.: cúpulas verdes
  const DW = 14.5, DH = 42; // v721: cúpulas menores
  function domePath(x, base) { ctx.beginPath(); ctx.moveTo(x - DW, base); ctx.lineTo(x - DW, base - DH + DW); ctx.ellipse(x, base - DH + DW, DW, DW * 1.05, 0, Math.PI, 0); ctx.lineTo(x + DW, base); ctx.ellipse(x, base, DW, DW * 0.32, 0, 0, Math.PI); ctx.closePath(); }
  function domeBack(p, T, k, filled) {
    const x = p.x, base = p.y + 4;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ell(x, base + 3, DW + 3, DW * 0.38); ctx.fill();
    const ped = ctx.createLinearGradient(0, base - 3, 0, base + 5); ped.addColorStop(0, "#a16207"); ped.addColorStop(1, "#3f2a06");
    ctx.fillStyle = ped; ell(x, base + 1, DW + 1.5, DW * 0.34); ctx.fill();
    ctx.globalCompositeOperation = "lighter";
    const pul = 0.75 + Math.sin(T * 0.003 + k) * 0.25;
    const halo = ctx.createRadialGradient(x, base - DH * 0.5, 4, x, base - DH * 0.5, DH * 0.85);
    halo.addColorStop(0, `rgba(134,239,172,${0.35 * pul})`); halo.addColorStop(1, "rgba(134,239,172,0)");
    ctx.fillStyle = halo; ctx.fillRect(x - DH, base - DH * 1.4, DH * 2, DH * 1.6);
    ctx.globalCompositeOperation = "source-over";
    const inn = ctx.createLinearGradient(0, base - DH, 0, base);
    inn.addColorStop(0, filled ? "rgba(187,247,208,0.55)" : "rgba(187,247,208,0.35)"); inn.addColorStop(0.55, filled ? "rgba(74,222,128,0.45)" : "rgba(74,222,128,0.28)"); inn.addColorStop(1, "rgba(21,128,61,0.65)");
    ctx.fillStyle = inn; domePath(x, base); ctx.fill();
    ctx.save(); domePath(x, base); ctx.clip(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 7; i++) {
      const by = base - ((T * 0.018 + i * 11 + k * 17) % (DH - 4)), bx = x + Math.sin(T * 0.002 + i * 1.7 + k) * DW * 0.7;
      ctx.fillStyle = "rgba(240,253,244,0.55)"; ctx.beginPath(); ctx.arc(bx, by, 0.7 + (i % 3) * 0.45, 0, 6.28); ctx.fill();
    }
    const sc = base - ((T * 0.03 + k * 25) % DH);
    const sg = ctx.createLinearGradient(0, sc - 4, 0, sc + 4); sg.addColorStop(0, "rgba(220,252,231,0)"); sg.addColorStop(0.5, "rgba(220,252,231,0.35)"); sg.addColorStop(1, "rgba(220,252,231,0)");
    ctx.fillStyle = sg; ctx.fillRect(x - DW, sc - 4, DW * 2, 8);
    ctx.restore();
    ctx.restore();
  }
  function domeFront(p) {
    const x = p.x, base = p.y + 4;
    ctx.save();
    const gl = ctx.createLinearGradient(x - DW, 0, x + DW, 0);
    gl.addColorStop(0, "rgba(240,253,244,0.55)"); gl.addColorStop(0.18, "rgba(187,247,208,0.18)"); gl.addColorStop(0.6, "rgba(74,222,128,0.10)"); gl.addColorStop(1, "rgba(187,247,208,0.35)");
    ctx.fillStyle = gl; domePath(x, base); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.beginPath(); ctx.ellipse(x - DW * 0.55, base - DH * 0.55, DW * 0.13, DH * 0.3, -0.05, 0, 6.28); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.ellipse(x - DW * 0.2, base - DH + DW * 0.45, DW * 0.45, DW * 0.18, -0.3, 0, 6.28); ctx.fill();
    ctx.strokeStyle = "rgba(220,252,231,0.9)"; ctx.lineWidth = 1; domePath(x, base); ctx.stroke();
    ctx.strokeStyle = "#ca8a04"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(x, base, DW, DW * 0.32, 0, 0, Math.PI); ctx.stroke();
    ctx.restore();
  }
  function drawPC(pods, queue, T, seed) {
    pods.forEach((p, i) => domeBack(p, T, i + seed, !!queue[i]));
    queue.forEach((uid, i) => { const p = pods[i], u = state.units.find((x) => x.uid === uid); if (p && u && i < 2) drawAuthenticFigurine(u, p.x, p.y - 4, 0, 0.62, 0, p.x, p.y, state.selectedUnitId === u.uid); });
    pods.forEach((p) => domeFront(p));
  }

  // ------------------------------------------------------------------ máquinas redondas dos cantos
  function machine(c, col, col2, T, list, mine) {
    const x = c.x, y = c.y, s = mine ? 1 : 0.78;
    ctx.save();
    const bx = x + (mine ? 2 : 4) * s, by = y - (mine ? 22 : -10) * s;
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ell(bx, by + 4, 40 * s, 19 * s); ctx.fill();
    const dg = ctx.createLinearGradient(0, by - 18 * s, 0, by + 18 * s); dg.addColorStop(0, "#e2e8f0"); dg.addColorStop(0.5, "#64748b"); dg.addColorStop(1, "#1e293b");
    ctx.fillStyle = dg; ell(bx, by + 2.5 * s, 39 * s, 18 * s); ctx.fill();
    const fg = ctx.createRadialGradient(bx, by, 2, bx, by, 36 * s); fg.addColorStop(0, col2); fg.addColorStop(1, col);
    ctx.fillStyle = fg; ell(bx, by, 36 * s, 16 * s); ctx.fill();
    ctx.save(); ell(bx, by, 36 * s, 16 * s); ctx.clip();
    ctx.translate(bx, by); ctx.scale(1, 0.45); ctx.rotate(T * 0.0007 * (mine ? 1 : -1));
    ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = hexA(col2, 0.75); ctx.lineWidth = 3.5 * s;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(0, 0, (10 + k * 9) * s, k * 2.1, k * 2.1 + 3.4); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1.4; ell(bx, by, 36 * s, 16 * s); ctx.stroke();
    const sx = x + (mine ? 40 : -36) * s, sy = y - (mine ? 8 : 0) * s;
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ell(sx, sy + 3, 19 * s, 10 * s); ctx.fill();
    ctx.fillStyle = "#475569"; ell(sx, sy + 1.5, 18 * s, 9 * s); ctx.fill();
    const sg = ctx.createRadialGradient(sx, sy, 1, sx, sy, 17 * s); sg.addColorStop(0, col2); sg.addColorStop(1, col);
    ctx.fillStyle = sg; ell(sx, sy, 17 * s, 8 * s); ctx.fill();
    ctx.save(); ell(sx, sy, 17 * s, 8 * s); ctx.clip(); ctx.translate(sx, sy); ctx.scale(1, 0.48); ctx.rotate(-T * 0.0012);
    ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = hexA(col2, 0.8); ctx.lineWidth = 2.4 * s; ctx.beginPath(); ctx.arc(0, 0, 9 * s, 0, 3.6); ctx.stroke(); ctx.restore();
    const px = x - (mine ? 2 : -38) * s, py = y + (mine ? 12 : -26) * s, R = 30 * s;
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ell(px, py + 5, R + 3, R * 0.62); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ell(px, py + 3, R, R * 0.58); ctx.fill();
    ctx.save(); ell(px, py, R, R * 0.56); ctx.clip();
    const top = ctx.createLinearGradient(0, py - R * 0.56, 0, py); top.addColorStop(0, "#f87171"); top.addColorStop(1, "#991b1b");
    ctx.fillStyle = top; ctx.fillRect(px - R, py - R, R * 2, R);
    const bot = ctx.createLinearGradient(0, py, 0, py + R * 0.56); bot.addColorStop(0, "#f1f5f9"); bot.addColorStop(1, "#94a3b8");
    ctx.fillStyle = bot; ctx.fillRect(px - R, py, R * 2, R);
    ctx.fillStyle = "#0f172a"; ctx.fillRect(px - R, py - 1.8 * s, R * 2, 3.6 * s);
    ctx.restore();
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1.8; ell(px, py, R, R * 0.56); ctx.stroke();
    ctx.fillStyle = "#0f172a"; ell(px, py, 7.5 * s, 4.6 * s); ctx.fill();
    const lit = 0.5 + Math.sin(T * 0.004) * 0.5;
    ctx.fillStyle = `rgb(${Math.round(226 + 29 * lit)},${Math.round(232 - 20 * lit)},${Math.round(240 - 40 * lit)})`; ell(px, py, 4.8 * s, 2.9 * s); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.beginPath(); ctx.ellipse(px - R * 0.4, py - R * 0.28, R * 0.32, R * 0.1, -0.2, 0, 6.28); ctx.fill();
    if (list && list.length) {
      ctx.fillStyle = "rgba(30,27,75,0.92)"; ctx.strokeStyle = "#c084fc"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(bx - 16, by - 6, 32, 12, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#e9d5ff"; ctx.font = "900 6.5px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("ULTRA " + list.length, bx, by + 0.3);
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ cartas de plates
  const imgCache = {};
  const imgOf = (src) => { if (!imgCache[src]) { const i = new Image(); i.src = src; imgCache[src] = i; } return imgCache[src]; };
  const PCOL = { purple: "#e879f9", gold: "#facc15", green: "#4ade80", pink: "#f9a8d4", red: "#f87171", blue: "#22d3ee" };
  function cardShape(x, y, w, h) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * 0.8, y); ctx.lineTo(x + w, y + h * 0.12); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w * 0.14, y + h); ctx.lineTo(x, y + h * 0.9); ctx.closePath(); }
  function blackCard(x, y, w, h, edge) {
    cardShape(x, y, w, h);
    const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, "#2a2a30"); g.addColorStop(0.45, "#050507"); g.addColorStop(0.46, "#141418"); g.addColorStop(1, "#050506");
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = edge || "#52525b"; ctx.lineWidth = 0.9; ctx.stroke();
  }
  function platesLeft(role) {
    if (role === "p2" && state.mode === "ai" && Array.isArray(state.aiPlates)) return state.aiPlates.filter((p) => !p.used);
    return (state.plates || []).filter((p) => !p.disabledInDeck && !(role === "p2" ? p.usedP2 : p.usedP1));
  }
  function wrap(text, x, y, maxW, lh) {
    const words = String(text).split(" "); let line = "", yy = y, lines = 0;
    words.forEach((wd) => { const test = line ? line + " " + wd : wd; if (ctx.measureText(test).width > maxW && line) { if (lines < 2) ctx.fillText(line, x, yy); line = wd; yy += lh; lines++; } else line = test; });
    if (line && lines < 2) ctx.fillText(line, x, yy);
  }
  function drawDeck(d, role, mine, T) {
    const left = platesLeft(role), n = left.length;
    const w = d.w, h = d.h, x0 = d.x - w / 2, y0 = d.y - h / 2;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.ellipse(d.x - 4, y0 + h + 2, w * 0.7, 4, 0, 0, 6.28); ctx.fill();
    const layers = Math.max(1, Math.min(5, n));
    for (let k = layers - 1; k >= 1; k--) blackCard(x0 - k * 3.2, y0 + k * 1.6, w, h, "#3f3f46");
    blackCard(x0, y0, w, h, mine ? "#a1a1aa" : "#52525b");
    if (mine && n) {
      const p = left[0], cat = (typeof BASE_PLATE_CATALOG !== "undefined" && BASE_PLATE_CATALOG.find((c) => c.id === p.id)) || p;
      const col = PCOL[cat.color] || "#e2e8f0";
      if (cat.icon) { const im = imgOf(cat.icon); if (im.complete && im.naturalWidth) { const ih = h * 0.36, iw = ih * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, x0 + w * 0.1, y0 + h * 0.08, Math.min(iw, w * 0.5), ih); } }
      ctx.fillStyle = "#fff"; ctx.font = "900 8px Arial,sans-serif"; ctx.textAlign = "right"; ctx.textBaseline = "top"; ctx.fillText(cat.rarity || "C", x0 + w * 0.84, y0 + h * 0.07);
      const nm = typeof t === "function" ? t("plate." + p.id + ".name", cat.name || p.name) : (cat.name || p.name);
      ctx.fillStyle = col; ctx.font = "800 5.6px Arial,sans-serif"; ctx.textAlign = "left";
      wrap(nm, x0 + w * 0.12, y0 + h * 0.56, w * 0.82, 6.2);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i < (cat.ocost || 1) ? col : "#27272a"; ctx.fillRect(x0 + w * 0.2 + i * w * 0.12, y0 + h - 4, w * 0.1, 1.6); }
    } else {
      ctx.fillStyle = "#3f3f46"; ctx.font = "800 4.6px Arial,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("POKÉMON DUEL", d.x, y0 + h * 0.3);
      ctx.strokeStyle = "#71717a"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(d.x, y0 + h * 0.62, 5, 0, 6.28); ctx.stroke(); ctx.beginPath(); ctx.moveTo(d.x - 5, y0 + h * 0.62); ctx.lineTo(d.x + 5, y0 + h * 0.62); ctx.stroke();
    }
    const k = ((T + (mine ? 0 : 2000)) % 4200) / 4200;
    ctx.save(); cardShape(x0, y0, w, h); ctx.clip(); ctx.globalCompositeOperation = "lighter";
    const sx = x0 - w + k * w * 3, sg = ctx.createLinearGradient(sx, y0, sx + w * 0.5, y0 + h); sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, "rgba(255,255,255,0.16)"); sg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sg; ctx.fillRect(x0, y0, w, h); ctx.restore();
    if (mine) {
      const a = 0.65 + Math.sin(T * 0.005) * 0.35; ctx.fillStyle = `rgba(250,204,21,${a})`;
      ctx.beginPath(); ctx.moveTo(x0 - 14, y0 - 4); ctx.lineTo(x0 - 4, y0 - 4); ctx.lineTo(x0 - 14, y0 + 6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x0 + w + 4, y0 + h + 6); ctx.lineTo(x0 + w + 4, y0 + h - 4); ctx.lineTo(x0 + w - 6, y0 + h + 6); ctx.closePath(); ctx.fill();
    } else if (n) {
      ctx.fillStyle = "#fff"; ctx.font = "900 7px Arial,sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("×" + n, x0 + w + 2, y0 + h * 0.75);
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ HUD do topo
  // v729: retrato do placar = a mesma foto do perfil (assets/ui/profile_avatar.png); o boneco desenhado fica de reserva
  const AVATAR_IMG = new Image(); AVATAR_IMG.src = "assets/ui/profile_avatar.png";
  function avatar(x, y, w, h, red) {
    if (AVATAR_IMG.complete && AVATAR_IMG.naturalWidth) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      const iw = AVATAR_IMG.naturalWidth, ih = AVATAR_IMG.naturalHeight, sc = Math.max(w / iw, h / ih);
      const dw = iw * sc, dh = ih * sc, dx = x + (w - dw) / 2, dy = y + (h - dh) * 0.25; // corta mais embaixo, mantém o rosto
      if (red) { ctx.translate(x * 2 + w, 0); ctx.scale(-1, 1); } // rival olha para dentro
      ctx.drawImage(AVATAR_IMG, dx, dy, dw, dh);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = red ? "#f87171" : "#60a5fa"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const bg = ctx.createLinearGradient(x, y, x, y + h); bg.addColorStop(0, red ? "#7f1d1d" : "#1e3a8a"); bg.addColorStop(1, red ? "#450a0a" : "#0b1a3e"); ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    const cx = x + w / 2, cy = y + h * 0.55, r = h * 0.42;
    ctx.fillStyle = red ? "#b91c1c" : "#1d4ed8"; ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.55, r * 1.05, r * 0.8, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#f5d0b5"; ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.72, r * 0.86, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#334155"; ctx.beginPath(); ctx.ellipse(cx, cy + r * 1.55, r * 1.3, r * 0.75, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = "#e5e7eb"; ctx.beginPath(); ctx.roundRect(cx - r * 0.85, cy - r * 0.18, r * 1.7, r * 0.42, r * 0.18); ctx.fill();
    ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.ellipse(cx - r * 0.36, cy + r * 0.03, r * 0.17, r * 0.12, 0, 0, 6.28); ctx.ellipse(cx + r * 0.36, cy + r * 0.03, r * 0.17, r * 0.12, 0, 0, 6.28); ctx.fill();
    ctx.restore();
  }
  const fmt = (ms) => { const s = Math.ceil(Math.max(0, ms) / 1000); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
  function pill(x, y, w, txt, red) {
    ctx.save();
    const g = ctx.createLinearGradient(0, y - 4.5, 0, y + 4.5); g.addColorStop(0, red ? "#9f1239" : "#a16207"); g.addColorStop(1, red ? "#4c0519" : "#422006");
    ctx.fillStyle = g; ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.roundRect(x, y - 4.5, w, 9, 4.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fef3c7"; ctx.font = "800 5.4px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, x + w / 2, y + 0.3);
    ctx.restore();
  }
  function drawHUD(T) {
    const bot = botRole(), blueMine = bot === "p1";
    const me = window.trainerProfileData || {}, op = (typeof remoteOpponentProfile !== "undefined" && remoteOpponentProfile) || {};
    const myName = me.nickname || "Você", opName = state.mode === "ai" ? (window.adaptiveAIOpponentName || op.nickname || "Rival") : (op.nickname || "Rival");
    const myClock = bot === "p2" ? state.clockMsP2 : state.clockMsP1, opClock = bot === "p2" ? state.clockMsP1 : state.clockMsP2;
    const y0 = 18.5, y1 = 51;
    const panel = (left, red, active) => {
      ctx.save(); ctx.beginPath();
      if (left) { ctx.moveTo(0, y0); ctx.lineTo(160, y0); ctx.lineTo(154, y1); ctx.lineTo(0, y1); } else { ctx.moveTo(W, y0); ctx.lineTo(193, y0); ctx.lineTo(199, y1); ctx.lineTo(W, y1); }
      ctx.closePath();
      const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, red ? "#c81e3a" : "#1d5fd1"); g.addColorStop(0.5, red ? "#8f1028" : "#123f9a"); g.addColorStop(1, red ? "#5c0718" : "#0a2766");
      ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.16)"; ctx.fillRect(left ? 0 : 193, y0, 160, 1);
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(left ? 0 : 193, y1 - 1, 160, 1);
      if (active) { ctx.strokeStyle = `rgba(250,204,21,${0.5 + Math.sin(T * 0.006) * 0.4})`; ctx.lineWidth = 1.4; ctx.stroke(); }
      ctx.restore();
    };
    panel(true, !blueMine, myTurn()); panel(false, blueMine, !myTurn());
    avatar(0, y0, 34, y1 - y0, !blueMine); avatar(W - 34, y0, 34, y1 - y0, blueMine);
    ctx.save(); ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.font = "800 10px -apple-system, BlinkMacSystemFont, sans-serif";
    // v725: corta pela largura e põe reticências (antes slice(0,13) deixava "N.O.V.A. [IA" sem fechar)
    const fitName = (str, maxW) => { str = String(str); if (ctx.measureText(str).width <= maxW) return str; while (str.length > 1 && ctx.measureText(str + "…").width > maxW) str = str.slice(0, -1); return str.trimEnd() + "…"; };
    ctx.textAlign = "left"; ctx.fillText(fitName(myName, 108), 39, 27);
    ctx.textAlign = "right"; ctx.fillText(fitName(opName, 108), W - 39, 27);
    ctx.font = "900 14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = myClock < 60000 ? "#fca5a5" : "#fff"; ctx.textAlign = "right"; ctx.fillText(fmt(myClock), 154, 41.5);
    ctx.fillStyle = opClock < 60000 ? "#fca5a5" : "#fff"; ctx.textAlign = "left"; ctx.fillText(fmt(opClock), 199, 41.5);
    ctx.restore();
    const streak = me.duelStats && me.duelStats.currentWinStreak;
    const tr = (k, fb) => (typeof t === "function" ? t(k, fb) : fb);
    pill(39, 42, 68, streak > 1 ? `${streak} ${tr("ar.streak", "vitórias seguidas")}` : `★ ${me.rankRating || 1000}`, !blueMine);
    pill(W - 107, 42, 68, state.mode === "ai" ? `★ ${Math.round(800 + ((window.adaptiveAIBrain && adaptiveAIBrain.difficultyScale) || 0.5) * 1000)}` : `★ ${op.rankRating || 1000}`, blueMine);
    ctx.save();
    ctx.fillStyle = "#0b0f17"; ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(161, 18.5); ctx.lineTo(192, 18.5); ctx.lineTo(198, 27); ctx.lineTo(193, 51.5); ctx.lineTo(160, 51.5); ctx.lineTo(155, 27); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f1f5f9"; ctx.beginPath(); ctx.moveTo(162, 20); ctx.lineTo(191, 20); ctx.lineTo(194.5, 25.5); ctx.lineTo(158.5, 25.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#0f172a"; ctx.font = "900 5.4px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("TURN", 176.5, 23);
    const yel = ctx.createLinearGradient(0, 31, 0, 48); yel.addColorStop(0, "#fef08a"); yel.addColorStop(1, "#eab308");
    ctx.fillStyle = yel; ctx.font = "900 15px -apple-system, BlinkMacSystemFont, sans-serif"; ctx.fillText(String(state.turnCounter), 176.5, 39.5);
    ctx.restore();
  }

  function reflect(u, x, y, sc) {
    ctx.save(); ctx.globalAlpha = theme().kind === "marble" ? 0.14 : 0.2;
    ctx.translate(x, y + 3); ctx.scale(1, -0.45); ctx.translate(-x, -y);
    try { drawAuthenticFigurine(u, x, y, 0, sc, 0, x, y, false); } catch (e) {}
    ctx.restore();
  }

  // ------------------------------------------------------------------ quadro
  const _oldFrame = drawFullTabletopFrame;
  drawFullTabletopFrame = function () {
    const tNow = performance.now() * 0.004, T = performance.now();
    const C = ensure();
    ctx.save();
    const curS = window.ACTIVE_SCALE || HD_SCALE; ctx.scale(curS, curS);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(C.floor, 0, 0, W, H);
    drawFloorAnim(T);
    drawBars(T);
    drawRoutes(T);
    drawNodes(T);
    drawBenchRings();
    const bR = botRole(), tR = topRole();
    const topQ = bR === "p1" ? state.reviverQueueP2 : state.reviverQueueP1, botQ = bR === "p1" ? state.reviverQueueP1 : state.reviverQueueP2;
    const exTop = bR === "p1" ? state.excludedP2 : state.excludedP1, exBot = bR === "p1" ? state.excludedP1 : state.excludedP2;
    const blueRole = (r) => r === "p1";
    machine(MACH.top, blueRole(tR) ? "#1e3a8a" : "#7c2d12", blueRole(tR) ? "#60a5fa" : "#fb923c", T, exTop, false);
    drawDeck(DECK.top, tR, false, T);
    drawPC(REVIVER_PODS_P2, topQ, T, 0);

    ctx.imageSmoothingEnabled = (window.pixelArtMode === "hd");
    drawHDVectorBoardAndChrome();
    ctx.imageSmoothingEnabled = true;
    drawHUD(T);

    const notAnim = (u) => !activePieceAnim || activePieceAnim.uid !== u.uid;
    const onBoard = state.units.filter((u) => u.location === "board" && notAnim(u));
    const topBench = state.units.filter((u) => u.owner === tR && u.location === "bench" && notAnim(u));
    const botBench = state.units.filter((u) => u.owner === bR && u.location === "bench" && notAnim(u));
    const posOf = (u) => u.location === "board" ? getNodePos(u.nodeId) : (u.owner === tR ? P2_BENCH_COORDS[u.benchSlot % 6] : BENCH_SLOTS_P1[u.benchSlot % 6]);
    const scOf = (u) => (u.location === "bench" && u.owner === tR ? 0.9 : 1);
    [...topBench, ...onBoard, ...botBench].forEach((u) => { const p = posOf(u); if (p) reflect(u, p.x, p.y, scOf(u)); });
    topBench.sort((a, b) => posOf(a).y - posOf(b).y).forEach((u) => { const p = posOf(u); drawAuthenticFigurine(u, p.x, p.y, 0, 0.9, 0, p.x, p.y, state.selectedUnitId === u.uid); });

    if (state.selectedUnitId && !state.isAnimating) {
      Object.entries(state.reachablePaths || {}).forEach(([, segs]) => segs.forEach((seg) => {
        if (seg.type !== "jump") return;
        const n1 = getNodePos(seg.fromNode), n2 = getNodePos(seg.toNode);
        ctx.save(); ctx.strokeStyle = "#c084fc"; ctx.lineWidth = 2.4; ctx.setLineDash([4, 3]); ctx.lineDashOffset = -T * 0.02;
        ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.quadraticCurveTo((n1.x + n2.x) / 2, Math.min(n1.y, n2.y) - 38, n2.x, n2.y); ctx.stroke(); ctx.restore();
      }));
      const pulse = 1 + Math.sin(tNow * 2.5) * 0.15;
      (state.reachableNodes || []).forEach((nid) => {
        const n = getNodePos(nid), isJump = state.reachablePaths[nid] && state.reachablePaths[nid].some((x) => x.type === "jump");
        const col = isJump ? "#c084fc" : "#bef264";
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const rg = ctx.createRadialGradient(n.x, n.y, 1, n.x, n.y, 13 * pulse); rg.addColorStop(0, hexA(col, 0.95)); rg.addColorStop(0.5, hexA(col, 0.4)); rg.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = rg; ell(n.x, n.y, 13 * pulse, 13 * pulse); ctx.fill();
        ctx.restore();
      });
      (state.attackTargets || []).forEach((nid) => {
        const n = getNodePos(nid);
        ctx.save(); ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.4; ctx.setLineDash([6, 4]); ctx.lineDashOffset = T * 0.03; ell(n.x, n.y, 18 * pulse, 18 * pulse); ctx.stroke(); ctx.restore();
      });
    }
    onBoard.sort((a, b) => getNodePos(a.nodeId).y - getNodePos(b.nodeId).y).forEach((u) => { const n = getNodePos(u.nodeId); if (n) drawAuthenticFigurine(u, n.x, n.y, 0, 1, 0, n.x, n.y, state.selectedUnitId === u.uid); });
    botBench.sort((a, b) => posOf(a).y - posOf(b).y).forEach((u) => { const p = posOf(u); drawAuthenticFigurine(u, p.x, p.y, 0, 1, 0, p.x, p.y, state.selectedUnitId === u.uid); });
    machine(MACH.bot, blueRole(bR) ? "#1e3a8a" : "#7c2d12", blueRole(bR) ? "#60a5fa" : "#fb923c", T, exBot, true);
    drawPC(REVIVER_PODS_P1, botQ, T, 3);
    drawDeck(DECK.bot, bR, true, T);

    if (activePieceAnim) {
      const u = state.units.find((x) => x.uid === activePieceAnim.uid);
      if (u) {
        if (activePieceAnim.portalAlpha > 0) {
          ctx.save(); const beam = ctx.createLinearGradient(activePieceAnim.x - 16, 0, activePieceAnim.x + 16, 0);
          beam.addColorStop(0, "rgba(56,189,248,0)"); beam.addColorStop(0.5, `rgba(56,189,248,${activePieceAnim.portalAlpha * 0.85})`); beam.addColorStop(1, "rgba(56,189,248,0)");
          ctx.fillStyle = beam; ctx.fillRect(activePieceAnim.x - 16, 120, 32, activePieceAnim.shadowY - 115); ctx.restore();
        }
        if (window.Juice) { const sq = Juice.squash(activePieceAnim); window.__jxSX = sq.sx; window.__jxSY = sq.sy; }
        drawAuthenticFigurine(u, activePieceAnim.x, activePieceAnim.y - activePieceAnim.z, activePieceAnim.z, activePieceAnim.scale, activePieceAnim.rot, activePieceAnim.shadowX, activePieceAnim.shadowY, true);
        window.__jxSX = 1; window.__jxSY = 1;
      }
    }
    for (let i = boardShockwaves.length - 1; i >= 0; i--) {
      const sw = boardShockwaves[i]; sw.r += (sw.maxR - sw.r) * 0.16; sw.alpha -= 0.04; if (sw.alpha <= 0) { boardShockwaves.splice(i, 1); continue; }
      ctx.save(); ctx.strokeStyle = sw.color; ctx.globalAlpha = sw.alpha; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, 6.28); ctx.stroke(); ctx.restore();
    }
    for (let i = boardBeams.length - 1; i >= 0; i--) {
      const bm = boardBeams[i]; bm.life -= 0.045; if (bm.life <= 0) { boardBeams.splice(i, 1); continue; }
      ctx.save(); ctx.strokeStyle = bm.color; ctx.globalAlpha = bm.life; ctx.lineWidth = 5 * bm.life; ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke(); ctx.restore();
    }
    for (let i = boardParticles.length - 1; i >= 0; i--) {
      const pt = boardParticles[i]; pt.x += pt.vx; pt.y += pt.vy; pt.life -= pt.decay; if (pt.life <= 0) { boardParticles.splice(i, 1); continue; }
      ctx.save(); ctx.fillStyle = pt.color; ctx.globalAlpha = pt.life; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, 6.28); ctx.fill(); ctx.restore();
    }
    drawVideoMatchOverlays();
    ctx.restore();
  };
  window.PDRArena.oldFrame = _oldFrame;
  window.PDRArena.textures = () => { try { return ensure(); } catch (e) { return null; } };

  // ------------------------------------------------------------------ toques
  const toLogical = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
  function unitAt(p) {
    const bR = botRole(), tR = topRole();
    const find = (arr, role) => state.units.find((u) => u.owner === role && u.location === "bench" && (() => { const s = arr[u.benchSlot % arr.length]; return s && Math.hypot(p.x - s.x, (p.y - (s.y - 10)) * 0.85) < 26; })());
    let u = find(BENCH_SLOTS_P1, bR) || find(P2_BENCH_COORDS, tR);
    if (u) return u;
    const pcs = [[REVIVER_PODS_P1, bR === "p1" ? state.reviverQueueP1 : state.reviverQueueP2], [REVIVER_PODS_P2, bR === "p1" ? state.reviverQueueP2 : state.reviverQueueP1]];
    for (const [pods, q] of pcs) for (let i = 0; i < 2 && i < q.length; i++) if (Math.abs(p.x - pods[i].x) < DW && p.y > pods[i].y - DH && p.y < pods[i].y + 8) return state.units.find((x) => x.uid === q[i]);
    let best = null, bd = 24;
    state.units.forEach((x) => { if (x.location !== "board") return; const n = getNodePos(x.nodeId); const d = Math.hypot(n.x - p.x, n.y - 8 - p.y); if (d < bd) { bd = d; best = x; } });
    return best;
  }
  let press = null;
  canvas.addEventListener("pointerdown", (e) => {
    const p = toLogical(e), d = DECK.bot;
    if (!state.isAnimating && !state.preMatchAnim && Math.abs(p.x - d.x) < d.w * 0.65 && Math.abs(p.y - d.y) < d.h * 0.65) {
      e.stopImmediatePropagation(); e.preventDefault();
      try { if (window.PDRSound) PDRSound.play("plate_sel"); } catch (x) {}
      try { togglePlatesTray(true); } catch (x) {}
      return;
    }
    const u = unitAt(p);
    if (press) clearTimeout(press.t);
    press = u ? { x: e.clientX, y: e.clientY, u, t: setTimeout(() => { if (press && press.u === u) { press = null; openUnitInfo(u); } }, 480) } : null;
  }, true);
  const cancel = (e) => { if (!press) return; if (e.type === "pointermove" && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 12) return; clearTimeout(press.t); press = null; };
  ["pointerup", "pointercancel", "pointerleave", "pointermove"].forEach((ev) => canvas.addEventListener(ev, cancel));
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  function openUnitInfo(u) {
    if (!u) return;
    try { if (navigator.vibrate) navigator.vibrate(25); } catch (e) {}
    openFigureInfo(u.baseIdx, (typeof t === "function" ? t("ar.back_match", "Partida") : "Partida"));
  }
  // v731: painel de informações novo (o mesmo do Deck) em tela cheia, para qualquer lugar do jogo (partida, loja…)
  function openFigureInfo(idx, backLabel) {
    if (!window.PDRDuelScreens || !PDRDuelScreens.showDataReadOnly) return false;
    try { if (window.PDRSound) PDRSound.play("select"); } catch (e) {}
    let ov = document.getElementById("pd-unit-info"); if (ov) ov.remove();
    ov = document.createElement("div"); ov.id = "pd-unit-info";
    ov.style.cssText = "position:fixed;inset:0;z-index:9000;background:rgba(2,6,23,.94);overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 8px 24px;animation:pdInfoIn .18s ease-out";
    if (!document.getElementById("pd-unit-info-css")) { const st = document.createElement("style"); st.id = "pd-unit-info-css"; st.textContent = "@keyframes pdInfoIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}"; document.head.appendChild(st); }
    const inner = document.createElement("div"); inner.style.cssText = "max-width:480px;margin:0 auto";
    ov.appendChild(inner); document.body.appendChild(ov);
    PDRDuelScreens.showDataReadOnly(inner, idx, { backLabel: backLabel || "Voltar", onBack: () => ov.remove() });
    return true;
  }
  window.PDRArena.openUnitInfo = openUnitInfo;
  window.pdrOpenFigureInfo = openFigureInfo;
  // v736: o painel antigo (#figure-details-modal) ainda era aberto pela vitrine do Início, pelo buff da semana e por
  // listas antigas. Todo pedido de "abrir info da figura" agora abre o painel novo; o antigo fica só de reserva.
  if (typeof openFigureDetailsModal === "function") {
    const legacy = openFigureDetailsModal;
    window.openLegacyFigureDetailsModal = legacy;
    const routed = function (figIdx) {
      const n = Number(figIdx);
      if (Number.isFinite(n) && FIGURES_DB[((n % FIGURES_DB.length) + FIGURES_DB.length) % FIGURES_DB.length]) {
        const idx = ((n % FIGURES_DB.length) + FIGURES_DB.length) % FIGURES_DB.length;
        try { if (openFigureInfo(idx, (typeof t === "function" ? t("ds.back", "Voltar") : "Voltar"))) return; } catch (e) {}
      }
      return legacy.apply(this, arguments);
    };
    try { openFigureDetailsModal = routed; } catch (e) {}
    window.openFigureDetailsModal = routed;
  }
  if (typeof showCornerFigureCard === "function") {
    const off = function () { try { hideCornerFigureCard(); } catch (e) {} };
    try { showCornerFigureCard = off; } catch (e) {}
    window.showCornerFigureCard = off;
  }
})();
