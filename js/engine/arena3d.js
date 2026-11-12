// ============================================================================
// v718 · Arena 3D (no lugar da imagem de fundo)
//  - Perspectiva: uma homografia leva o retângulo lógico do tabuleiro (y 95–455) para um trapézio (mais estreito no
//    fundo). As coordenadas de BOARD_NODES, dos bancos e dos P.C. são projetadas UMA vez, no lugar (mesmos arrays),
//    então desenho, toque e partículas continuam batendo. As peças encolhem com a profundidade (depthScale).
//  - Mesa de mármore procedural (6 materiais, um por "Tema da arena"), com borda dourada, espessura na frente,
//    reflexo de luz passando, reflexo das peças e brilho dos Gols/Entradas no chão.
//  - Layout do original: P.C. redondo (2 cápsulas de vidro com líquido, bolhas, anel de luz girando e varredura)
//    em cima à direita (oponente) e embaixo à esquerda (você); monte de plates nos outros cantos (o seu abre as
//    cartas ao tocar). Banco com anéis brancos duplos.
//  - Animações: poeira de luz e reflexos no fundo de cristal, pulsos de energia correndo pelas linhas, Entradas com
//    anel girando, Gols com feixe e partículas subindo.
//  - Segurar o dedo numa peça abre a página de Dados dela (igual à do Deck). O cartão de roleta do canto foi removido.
//  - board.js: as partes antigas (cápsulas verdes, anéis, linhas, nós, máscaras da imagem) ficam desligadas por
//    window.PDR_ARENA3D; o HUD (nomes, relógio, ULTRA, botões) continua vindo de drawHDVectorBoardAndChrome.
// Carrega depois de plates_all.js.
// ============================================================================
(function () {
  "use strict";
  if (typeof BOARD_NODES === "undefined" || typeof drawFullTabletopFrame !== "function") return;
  window.PDR_ARENA3D = true;
  const W = LOGICAL_W, H = LOGICAL_H;

  // ------------------------------------------------------------------ homografia
  function solveH(src, dst) {
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    for (let c = 0; c < 8; c++) {
      let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      for (let r = 0; r < 8; r++) { if (r === c) continue; const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
    }
    const h = b.map((v, i) => v / A[i][i]);
    return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  }
  function inv3(m) {
    const [a, b, c, d, e, f, g, h, i] = m;
    const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
    const det = a * A + b * B + c * C;
    return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
  }
  const apply = (m, x, y) => { const w = m[6] * x + m[7] * y + m[8]; return { x: (m[0] * x + m[1] * y + m[2]) / w, y: (m[3] * x + m[4] * y + m[5]) / w }; };
  const SY0 = 95, SY1 = 455;
  const HM = solveH([[0, SY0], [W, SY0], [W, SY1], [0, SY1]], [[58, 112], [W - 58, 112], [W + 16, 458], [-16, 458]]);
  const HI = inv3(HM);
  const P = (x, y) => apply(HM, x, y);
  const srcY = (sy) => apply(HI, W / 2, sy).y;
  function depthScale(sy) { const v = srcY(sy); const a = P(0, v), b = P(W, v); return Math.max(0.55, Math.min(1.15, (b.x - a.x) / W)); }
  window.PDRArena = { P, depthScale, srcY };

  // ------------------------------------------------------------------ novo layout (como no original) + projeção
  const L = {
    topBench: [[120, 112], [163, 112], [206, 112], [141, 140], [184, 140], [227, 140]],
    botBench: [[62, 394], [108, 394], [154, 394], [84, 423], [130, 423], [176, 423]],
    topPods: [[279, 120], [313, 120]], botPods: [[236, 400], [270, 400]],
    topDeck: [37, 124], botDeck: [318, 424]
  };
  const setXY = (o, p) => { const q = P(p[0], p[1]); o.x = q.x; o.y = q.y; };
  BOARD_NODES.forEach((n) => setXY(n, [n.x, n.y]));
  P2_BENCH_COORDS.forEach((s, i) => setXY(s, L.topBench[i]));
  BENCH_SLOTS_P1.forEach((s, i) => setXY(s, L.botBench[i]));
  REVIVER_PODS_P2.forEach((s, i) => setXY(s, L.topPods[i]));
  REVIVER_PODS_P1.forEach((s, i) => setXY(s, L.botPods[i]));
  const DECK = { top: P(L.topDeck[0], L.topDeck[1]), bot: P(L.botDeck[0], L.botDeck[1]) };
  window.PDR_ULTRA_POS = { top: [24, 170], bot: [26, 478] };

  // ------------------------------------------------------------------ materiais (Tema da arena)
  const MAT = {
    crystal: { base: ["#161f36", "#080c18"], vein: "#6b7fa8", vein2: "#b8c4dc", spark: "#bfdbfe", trim: ["#fde68a", "#b45309"], line: "#f8fafc", bg: ["#152238", "#060a14"], crys: "#60a5fa" },
    marble: { base: ["#eceae6", "#cfcac2"], vein: "#6b6a70", vein2: "#9ca3af", spark: "#ffffff", trim: ["#fde68a", "#a16207"], line: "#0f172a", bg: ["#1f2937", "#0b0f17"], crys: "#cbd5e1", light: true },
    banana: { base: ["#3b2a0c", "#1f1405"], vein: "#facc15", vein2: "#fde68a", spark: "#fef08a", trim: ["#fef3c7", "#92400e"], line: "#fffbeb", bg: ["#2a1d08", "#0c0802"], crys: "#facc15" },
    wood: { base: ["#5a3418", "#38200e"], vein: "#7c4a26", vein2: "#a0643a", spark: "#fcd9b6", trim: ["#fde68a", "#78350f"], line: "#fff7ed", bg: ["#2a170a", "#0c0603"], crys: "#fb923c", wood: true },
    stone: { base: ["#1f1b19", "#0f0d0c"], vein: "#f97316", vein2: "#fbbf24", spark: "#fdba74", trim: ["#fed7aa", "#9a3412"], line: "#fff7ed", bg: ["#2a0f07", "#0a0403"], crys: "#f97316", lava: true },
    habitats: { base: ["#0b3b2c", "#052419"], vein: "#34d399", vein2: "#a7f3d0", spark: "#d1fae5", trim: ["#fde68a", "#166534"], line: "#f0fdf4", bg: ["#0a2a1f", "#03100b"], crys: "#4ade80" }
  };
  const mat = () => MAT[state.surface] || MAT.crystal;
  const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

  function makeMarble(m) {
    const TW = 720, TH = 760, c = document.createElement("canvas"); c.width = TW; c.height = TH; const g = c.getContext("2d");
    const r = rnd(97);
    const gr = g.createLinearGradient(0, 0, TW, TH); gr.addColorStop(0, m.base[0]); gr.addColorStop(1, m.base[1]); g.fillStyle = gr; g.fillRect(0, 0, TW, TH);
    for (let i = 0; i < 140; i++) { // nuvens do mármore
      const x = r() * TW, y = r() * TH, rad = 40 + r() * 160, light = r() < 0.5;
      const rg = g.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, light ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.10)"); rg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    if (m.wood) {
      for (let y = 0; y < TH; y += 3 + r() * 5) {
        g.strokeStyle = r() < 0.5 ? m.vein : m.vein2; g.globalAlpha = 0.18 + r() * 0.25; g.lineWidth = 1 + r() * 2.5;
        g.beginPath(); let yy = y; g.moveTo(0, yy); for (let x = 0; x <= TW; x += 30) { yy += (r() - 0.5) * 5; g.lineTo(x, yy + Math.sin(x / 90 + y) * 3); } g.stroke();
      }
      g.globalAlpha = 1;
    } else {
      const vein = (x0, y0, len, w, col, alpha, depth) => {
        let x = x0, y = y0, ang = 0.35 + r() * 0.9;
        g.strokeStyle = col; g.lineCap = "round"; g.lineJoin = "round";
        const pts = [[x, y]];
        for (let k = 0; k < len; k++) { ang += (r() - 0.5) * 0.32; x += Math.cos(ang) * 16; y += Math.sin(ang) * 16; pts.push([x, y]); }
        [[w * 7, alpha * 0.05, 16], [w * 3, alpha * 0.10, 6], [w * 1.2, alpha * 0.32, 1.5]].forEach(([lw, al, blur]) => {
          g.save(); g.globalAlpha = al; g.lineWidth = lw; g.shadowColor = col; g.shadowBlur = blur;
          g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); g.restore();
        });
        if (depth < 2) for (let k = 0; k < 3; k++) { const p = pts[Math.floor(r() * pts.length)]; vein(p[0], p[1], 6 + r() * 14, w * 0.5, col, alpha * 0.8, depth + 1); }
      };
      for (let i = 0; i < 9; i++) vein(-40 + r() * TW * 0.7, -40 + r() * TH, 40 + r() * 40, 1.2 + r() * 1.8, i % 3 ? m.vein : m.vein2, 0.5 + r() * 0.3, 0);
    }
    for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)"; g.fillRect(r() * TW, r() * TH, 1.2, 1.2); }
    for (let i = 0; i < 90; i++) { g.fillStyle = m.spark; g.globalAlpha = 0.25 + r() * 0.4; g.fillRect(r() * TW, r() * TH, 1.6, 1.6); } // brilhos minerais
    g.globalAlpha = 1;
    return c;
  }
  // Fundo de cristal escuro (como no original) — pré-renderizado
  function makeRoom(m, S) {
    const c = document.createElement("canvas"); c.width = W * S; c.height = H * S; const g = c.getContext("2d"); g.scale(S, S);
    const bg = g.createRadialGradient(W / 2, H * 0.45, 30, W / 2, H * 0.5, 420); bg.addColorStop(0, m.bg[0]); bg.addColorStop(1, m.bg[1]); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const r = rnd(1234);
    for (let i = 0; i < 260; i++) { // facetas de cristal
      const x = r() * W, y = r() * H, s = 10 + r() * 46, a = r() * Math.PI * 2;
      g.beginPath(); for (let k = 0; k < 3 + Math.floor(r() * 3); k++) { const aa = a + k * (1.3 + r() * 0.8); const rr = s * (0.5 + r() * 0.7); k ? g.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr) : g.moveTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr); }
      g.closePath();
      const lg = g.createLinearGradient(x - s, y - s, x + s, y + s);
      const lit = r();
      lg.addColorStop(0, `rgba(255,255,255,${0.02 + lit * 0.07})`); lg.addColorStop(0.5, `rgba(0,0,0,${0.08 + r() * 0.14})`); lg.addColorStop(1, `rgba(255,255,255,${0.01 + r() * 0.05})`);
      g.fillStyle = lg; g.fill();
      g.strokeStyle = `rgba(255,255,255,${0.02 + r() * 0.05})`; g.lineWidth = 0.6; g.stroke();
    }
    const vg = g.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 380); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.75)"); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }
  const TX0 = 4, TX1 = W - 4, TY0 = 100, TY1 = 452; // área da mesa (coords de origem)
  function tableQuad() { return [P(TX0, TY0), P(TX1, TY0), P(TX1, TY1), P(TX0, TY1)]; }
  function makeTable(m, S) {
    const tex = makeMarble(m); lastTex = tex;
    const c = document.createElement("canvas"); c.width = W * S; c.height = H * S; const g = c.getContext("2d");
    const q = tableQuad();
    // espessura da frente
    g.save(); g.scale(S, S);
    const th = 12;
    const fg = g.createLinearGradient(0, q[3].y, 0, q[3].y + th); fg.addColorStop(0, m.base[1]); fg.addColorStop(1, "#000");
    g.fillStyle = fg; g.beginPath(); g.moveTo(q[3].x, q[3].y); g.lineTo(q[2].x, q[2].y); g.lineTo(q[2].x - 4, q[2].y + th); g.lineTo(q[3].x + 4, q[3].y + th); g.closePath(); g.fill();
    g.restore();
    // mármore em perspectiva, linha a linha
    const yTop = Math.floor(q[0].y * S), yBot = Math.ceil(q[3].y * S);
    for (let yy = yTop; yy <= yBot; yy++) {
      const sy = (yy + 0.5) / S, v = srcY(sy);
      if (v < TY0 || v > TY1) continue;
      const a = P(TX0, v), b = P(TX1, v);
      const ty = (v - TY0) / (TY1 - TY0) * (tex.height - 1);
      g.drawImage(tex, 0, ty, tex.width, 1, a.x * S, yy, (b.x - a.x) * S, 1.2);
    }
    g.save(); g.scale(S, S);
    const clip = () => { g.beginPath(); g.moveTo(q[0].x, q[0].y); q.slice(1).forEach((p) => g.lineTo(p.x, p.y)); g.closePath(); };
    // verniz: reflexo do ambiente (luz vindo do fundo) e sombra perto da borda
    clip(); g.save(); g.clip();
    const gl = g.createLinearGradient(0, q[0].y, 0, q[3].y); gl.addColorStop(0, "rgba(255,255,255,0.16)"); gl.addColorStop(0.25, "rgba(255,255,255,0.03)"); gl.addColorStop(0.7, "rgba(0,0,0,0)"); gl.addColorStop(1, "rgba(0,0,0,0.25)");
    g.fillStyle = gl; g.fillRect(0, 0, W, H);
    const blob = g.createRadialGradient(W * 0.32, 175, 4, W * 0.32, 175, 150); blob.addColorStop(0, "rgba(255,255,255,0.10)"); blob.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = blob; g.fillRect(0, 0, W, H);
    // faixas de banco (parte de cima e de baixo um pouco mais escuras)
    [[TY0, 163], [369, TY1]].forEach(([y0, y1]) => { const a = P(TX0, y0), b = P(TX1, y0), c2 = P(TX1, y1), d = P(TX0, y1); g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c2.x, c2.y); g.lineTo(d.x, d.y); g.closePath(); g.fill(); });
    g.restore();
    // borda dourada
    const tg = g.createLinearGradient(0, q[0].y, 0, q[3].y); tg.addColorStop(0, m.trim[0]); tg.addColorStop(1, m.trim[1]);
    clip(); g.strokeStyle = "rgba(0,0,0,0.7)"; g.lineWidth = 4; g.stroke();
    clip(); g.strokeStyle = tg; g.lineWidth = 2.2; g.stroke();
    const qi = [P(TX0 + 6, TY0 + 5), P(TX1 - 6, TY0 + 5), P(TX1 - 6, TY1 - 5), P(TX0 + 6, TY1 - 5)];
    g.beginPath(); g.moveTo(qi[0].x, qi[0].y); qi.slice(1).forEach((p) => g.lineTo(p.x, p.y)); g.closePath(); g.strokeStyle = "rgba(255,255,255,0.18)"; g.lineWidth = 0.8; g.stroke();
    // frisos que separam os bancos
    [163, 369].forEach((y) => {
      const a = P(30, y), b = P(W - 30, y);
      g.strokeStyle = "rgba(0,0,0,0.55)"; g.lineWidth = 3.4; g.beginPath(); g.moveTo(a.x, a.y + 1); g.lineTo(b.x, b.y + 1); g.stroke();
      const lg = g.createLinearGradient(a.x, 0, b.x, 0); lg.addColorStop(0, "rgba(253,230,138,0)"); lg.addColorStop(0.15, m.trim[0]); lg.addColorStop(0.85, m.trim[0]); lg.addColorStop(1, "rgba(253,230,138,0)");
      g.strokeStyle = lg; g.lineWidth = 1.8; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    });
    g.restore();
    return c;
  }
  let cache = { key: null }, lastTex = null;
  function ensure() {
    const S = window.ACTIVE_SCALE || HD_SCALE, key = (state.surface || "crystal") + "@" + S;
    if (cache.key === key) return cache;
    const m = mat();
    cache = { key, S, room: makeRoom(m, S), table: makeTable(m, S), m }; cache.tex = lastTex;
    return cache;
  }

  // ------------------------------------------------------------------ animação ambiente
  const motes = Array.from({ length: 46 }, (_, i) => { const r = rnd(i * 77 + 3); return { x: r() * W, y: r() * H, v: 0.06 + r() * 0.18, ph: r() * 6.28, s: 0.5 + r() * 1.4 }; });
  const pulses = [];
  function spawnPulse() { const e = BOARD_EDGES[Math.floor(Math.random() * BOARD_EDGES.length)]; if (e) pulses.push({ a: e[0], b: e[1], t: 0, sp: 0.008 + Math.random() * 0.01, rev: Math.random() < 0.5 }); }
  const goalSparks = [];

  const bottomColor = () => (getBottomRole() === "p1" ? "#38bdf8" : "#fb7185");
  const topColor = () => (getBottomRole() === "p1" ? "#fb7185" : "#38bdf8");
  const sideCol = (y) => (y > 265 ? bottomColor() : topColor());

  function drawRoomAnim(T) {
    const m = cache.m;
    // feixes de luz lentos vindos de cima
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 3; i++) {
      const x = W * (0.2 + i * 0.3) + Math.sin(T * 0.00025 + i * 2) * 40;
      const gr = ctx.createLinearGradient(x, 0, x + 60, H);
      gr.addColorStop(0, "rgba(255,255,255,0.05)"); gr.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - 18, 0); ctx.lineTo(x + 18, 0); ctx.lineTo(x + 110, H); ctx.lineTo(x + 30, H); ctx.closePath(); ctx.fill();
    }
    // poeira de luz
    motes.forEach((p) => {
      p.y -= p.v; p.x += Math.sin(T * 0.001 + p.ph) * 0.08; if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      const a = 0.25 + Math.sin(T * 0.003 + p.ph) * 0.25;
      ctx.fillStyle = m.crys; ctx.globalAlpha = Math.max(0, a) * 0.6; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fill();
    });
    ctx.restore();
  }
  function tablePath() { const q = tableQuad(); ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y); q.slice(1).forEach((p) => ctx.lineTo(p.x, p.y)); ctx.closePath(); }
  function drawTableAnim(T) {
    ctx.save(); tablePath(); ctx.clip();
    // reflexo de luz passando pela mesa (verniz)
    const per = 9000, k = (T % per) / per, x = -120 + k * (W + 240);
    ctx.globalCompositeOperation = "lighter";
    const sg = ctx.createLinearGradient(x - 70, 100, x + 70, 300);
    sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, cache.m.light ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.10)"); sg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sg; ctx.fillRect(0, 90, W, 380);
    // brilho dos Gols e Entradas refletido no chão
    BOARD_NODES.forEach((n) => {
      if (!(n.role.startsWith("goal") || n.role.startsWith("entry"))) return;
      const big = n.role.startsWith("goal"), s = depthScale(n.y), col = sideCol(n.y);
      const r0 = (big ? 46 : 26) * s * (1 + Math.sin(T * 0.003 + n.id) * 0.08);
      const rg = ctx.createRadialGradient(n.x, n.y + 6 * s, 1, n.x, n.y + 6 * s, r0);
      rg.addColorStop(0, hexA(col, big ? 0.30 : 0.16)); rg.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(n.x, n.y + 6 * s, r0, r0 * 0.55, 0, 0, 6.28); ctx.fill();
    });
    ctx.restore();
  }
  function hexA(hex, a) { const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }

  // ------------------------------------------------------------------ linhas e nós
  function drawRoutes(T) {
    const m = cache.m, dark = m.light ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.75)";
    ctx.save(); ctx.lineCap = "round";
    BOARD_EDGES.forEach(([a, b]) => { const na = BOARD_NODES[a], nb = BOARD_NODES[b]; const s = (depthScale(na.y) + depthScale(nb.y)) / 2; ctx.strokeStyle = dark; ctx.lineWidth = 4.6 * s; ctx.beginPath(); ctx.moveTo(na.x, na.y + 0.8); ctx.lineTo(nb.x, nb.y + 0.8); ctx.stroke(); });
    BOARD_EDGES.forEach(([a, b]) => { const na = BOARD_NODES[a], nb = BOARD_NODES[b]; const s = (depthScale(na.y) + depthScale(nb.y)) / 2; ctx.strokeStyle = m.line; ctx.lineWidth = 2.3 * s; ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke(); });
    // pulsos de energia correndo pelas linhas
    if (pulses.length < 7 && Math.random() < 0.05) spawnPulse();
    ctx.globalCompositeOperation = "lighter";
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]; p.t += p.sp; if (p.t >= 1) { pulses.splice(i, 1); continue; }
      const A = BOARD_NODES[p.rev ? p.b : p.a], B = BOARD_NODES[p.rev ? p.a : p.b];
      const x = A.x + (B.x - A.x) * p.t, y = A.y + (B.y - A.y) * p.t, s = depthScale(y);
      const col = m.light ? "#2563eb" : "#a5f3fc", a = Math.sin(p.t * Math.PI);
      const rg = ctx.createRadialGradient(x, y, 0, x, y, 7 * s); rg.addColorStop(0, hexA(col, 0.9 * a)); rg.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, 7 * s, 0, 6.28); ctx.fill();
    }
    ctx.restore();
  }
  const SQ = 0.66; // achatamento dos círculos no chão
  function ring(x, y, r, s, stroke, lw, fill) { ctx.beginPath(); ctx.ellipse(x, y, r * s, r * s * SQ, 0, 0, 6.28); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw * s; ctx.stroke(); } }
  function drawNodes(T) {
    const m = cache.m, white = m.light ? "#0f172a" : "#f8fafc", hole = m.light ? "#f8fafc" : "#070b14";
    BOARD_NODES.forEach((n) => {
      const s = depthScale(n.y), col = sideCol(n.y);
      ctx.save();
      if (n.role.startsWith("entry")) {
        ring(n.x, n.y + 1.2, 15, s, null, 0, "rgba(0,0,0,0.45)");
        ring(n.x, n.y, 14, s, white, 2.1, hole);
        ring(n.x, n.y, 9.4, s, white, 1.7);
        ring(n.x, n.y, 4.8, s, white, 1.6);
        // anel colorido girando
        ctx.strokeStyle = col; ctx.lineWidth = 1.8 * s; ctx.setLineDash([5 * s, 4 * s]); ctx.lineDashOffset = -T * 0.02;
        ctx.beginPath(); ctx.ellipse(n.x, n.y, 17.5 * s, 17.5 * s * SQ, 0, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
      } else if (n.role.startsWith("goal")) {
        const pul = 1 + Math.sin(T * 0.004) * 0.08;
        const gg = ctx.createRadialGradient(n.x, n.y, 2, n.x, n.y, 26 * s * pul); gg.addColorStop(0, hexA(col, 0.95)); gg.addColorStop(0.55, hexA(col, 0.35)); gg.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(n.x, n.y, 26 * s * pul, 26 * s * SQ * pul, 0, 0, 6.28); ctx.fill();
        ring(n.x, n.y, 15, s, white, 2.3, "#06101f");
        ring(n.x, n.y, 10.5, s, col, 1.9);
        ctx.strokeStyle = hexA(col, 0.9); ctx.lineWidth = 1.4 * s; ctx.setLineDash([3 * s, 3 * s]); ctx.lineDashOffset = T * 0.03;
        ctx.beginPath(); ctx.ellipse(n.x, n.y, 20 * s, 20 * s * SQ, 0, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
        // ▷ (aponta para quem ataca esse Gol)
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(n.x - 3.2 * s, n.y - 3.4 * s); ctx.lineTo(n.x + 5 * s, n.y); ctx.lineTo(n.x - 3.2 * s, n.y + 3.4 * s); ctx.closePath(); ctx.fill();
        // feixe e partículas subindo
        const bg = ctx.createLinearGradient(0, n.y - 42 * s, 0, n.y); bg.addColorStop(0, hexA(col, 0)); bg.addColorStop(1, hexA(col, 0.22));
        ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = bg; ctx.fillRect(n.x - 9 * s, n.y - 42 * s, 18 * s, 42 * s);
        if (Math.random() < 0.18) goalSparks.push({ x: n.x + (Math.random() - 0.5) * 16 * s, y: n.y, vy: 0.25 + Math.random() * 0.35, life: 1, col, s });
      } else {
        ring(n.x, n.y + 1, 6, s, null, 0, "rgba(0,0,0,0.45)");
        ring(n.x, n.y, 5, s, white, 1.9, hole);
        ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.ellipse(n.x - 1.2 * s, n.y - 1.1 * s, 1.6 * s, 0.9 * s, 0, 0, 6.28); ctx.fill();
      }
      ctx.restore();
    });
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = goalSparks.length - 1; i >= 0; i--) {
      const p = goalSparks[i]; p.y -= p.vy; p.life -= 0.02; if (p.life <= 0) { goalSparks.splice(i, 1); continue; }
      ctx.fillStyle = hexA(p.col, p.life * 0.9); ctx.beginPath(); ctx.arc(p.x, p.y, 1.3 * p.s, 0, 6.28); ctx.fill();
    }
    ctx.restore();
  }
  function drawBenchPads(T) {
    const white = cache.m.light ? "#0f172a" : "#f1f5f9";
    const occ = (arr, role) => { const set = new Set(); state.units.forEach((u) => { if (u.owner === role && u.location === "bench") set.add(u.benchSlot % arr.length); }); return set; };
    const botRole = getBottomRole(), topRole = botRole === "p1" ? "p2" : "p1";
    [[P2_BENCH_COORDS, occ(P2_BENCH_COORDS, topRole), topColor()], [BENCH_SLOTS_P1, occ(BENCH_SLOTS_P1, botRole), bottomColor()]].forEach(([arr, set, col]) => {
      arr.forEach((p, i) => {
        const s = depthScale(p.y);
        ctx.save();
        ring(p.x, p.y + 1.5, 17.5, s, null, 0, "rgba(0,0,0,0.5)");
        ring(p.x, p.y, 16, s, white, 2.1, "rgba(7,11,20,0.55)");
        ring(p.x, p.y, 11.5, s, white, 1.5);
        if (set.has(i)) { ctx.globalCompositeOperation = "lighter"; ring(p.x, p.y, 16, s, hexA(col, 0.55 + Math.sin(T * 0.003 + i) * 0.2), 1.4); }
        ctx.restore();
      });
    });
  }

  // ------------------------------------------------------------------ P.C. redondo com cápsulas
  function pcBase(pods, col, T, mine) {
    const a = pods[0], b = pods[1], cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2 + 3, s = depthScale(cy);
    const R = 34 * s;
    ctx.save();
    // sombra e base metálica redonda
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.beginPath(); ctx.ellipse(cx, cy + 6 * s, R + 4 * s, (R + 4 * s) * 0.42, 0, 0, 6.28); ctx.fill();
    const side = ctx.createLinearGradient(0, cy, 0, cy + 9 * s); side.addColorStop(0, "#475569"); side.addColorStop(1, "#0f172a");
    ctx.fillStyle = side; ctx.beginPath(); ctx.ellipse(cx, cy + 4 * s, R, R * 0.42, 0, 0, Math.PI); ctx.lineTo(cx - R, cy); ctx.ellipse(cx, cy, R, R * 0.42, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
    const top = ctx.createLinearGradient(cx - R, cy - R * 0.4, cx + R, cy + R * 0.4); top.addColorStop(0, "#e2e8f0"); top.addColorStop(0.45, "#94a3b8"); top.addColorStop(1, "#334155");
    ctx.fillStyle = top; ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.42, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = "#0f172a"; ctx.lineWidth = 1.2 * s; ctx.stroke();
    // faixa colorida (cor do dono) e anel de luz girando
    ctx.strokeStyle = col; ctx.lineWidth = 2.2 * s; ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.86, R * 0.86 * 0.42, 0, 0, 6.28); ctx.stroke();
    ctx.globalCompositeOperation = "lighter";
    const ang = T * 0.003;
    ctx.strokeStyle = hexA(col, 0.95); ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.86, R * 0.86 * 0.42, 0, ang, ang + 1.1); ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    // botão pokébola no meio
    ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.ellipse(cx, cy + 0.5 * s, 5.5 * s, 2.6 * s, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = (Math.sin(T * 0.005) > 0) ? col : "#f8fafc"; ctx.beginPath(); ctx.ellipse(cx, cy + 0.5 * s, 2.8 * s, 1.3 * s, 0, 0, 6.28); ctx.fill();
    // etiqueta
    ctx.font = `900 ${6.5 * s}px sans-serif`; ctx.textAlign = "center"; ctx.fillStyle = "#e2e8f0"; ctx.fillText("P.C.", cx, cy + R * 0.42 + 9 * s);
    ctx.restore();
  }
  function capsule(p, col, T, phase, back) {
    const s = depthScale(p.y), w = 13 * s, h = 34 * s, x = p.x, y = p.y + 2 * s;
    ctx.save();
    if (back) {
      // fundo da cápsula + líquido com bolhas
      const lq = ctx.createLinearGradient(0, y - h, 0, y);
      lq.addColorStop(0, hexA(col, 0.05)); lq.addColorStop(1, hexA(col, 0.38));
      ctx.fillStyle = "rgba(2,6,23,0.55)"; capPath(x, y, w, h); ctx.fill();
      ctx.fillStyle = lq; capPath(x, y, w, h); ctx.fill();
      ctx.save(); capPath(x, y, w, h); ctx.clip(); ctx.globalCompositeOperation = "lighter";
      for (let k = 0; k < 6; k++) { const by = y - ((T * 0.02 + k * 9 + phase * 13) % h); const bx = x + Math.sin(T * 0.003 + k * 2 + phase) * w * 0.55; ctx.fillStyle = hexA("#ffffff", 0.35); ctx.beginPath(); ctx.arc(bx, by, (0.8 + (k % 3) * 0.4) * s, 0, 6.28); ctx.fill(); }
      const sc = y - ((T * 0.04 + phase * 20) % h); // varredura
      const sg = ctx.createLinearGradient(0, sc - 3 * s, 0, sc + 3 * s); sg.addColorStop(0, hexA(col, 0)); sg.addColorStop(0.5, hexA(col, 0.6)); sg.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = sg; ctx.fillRect(x - w, sc - 3 * s, w * 2, 6 * s);
      ctx.restore();
    } else {
      // vidro na frente: reflexos e aro
      const gl = ctx.createLinearGradient(x - w, 0, x + w, 0);
      gl.addColorStop(0, "rgba(255,255,255,0.22)"); gl.addColorStop(0.25, "rgba(255,255,255,0.05)"); gl.addColorStop(0.7, "rgba(255,255,255,0.02)"); gl.addColorStop(1, "rgba(255,255,255,0.16)");
      ctx.fillStyle = gl; capPath(x, y, w, h); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.beginPath(); ctx.ellipse(x - w * 0.55, y - h * 0.55, w * 0.12, h * 0.28, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = "rgba(226,232,240,0.75)"; ctx.lineWidth = 1.1 * s; capPath(x, y, w, h); ctx.stroke();
      ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.42, 0, 0, Math.PI); ctx.stroke();
      ctx.fillStyle = "#cbd5e1"; ctx.beginPath(); ctx.ellipse(x, y - h + w * 0.2, w * 0.55, w * 0.22, 0, 0, 6.28); ctx.fill();
    }
    ctx.restore();
  }
  function capPath(x, y, w, h) { ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x - w, y - h + w); ctx.ellipse(x, y - h + w, w, w, 0, Math.PI, 0); ctx.lineTo(x + w, y); ctx.ellipse(x, y, w, w * 0.42, 0, 0, Math.PI); ctx.closePath(); }
  const GLASS = "#4ade80";
  function drawPC(pods, queue, col, T, mine) {
    pcBase(pods, col, T, mine);
    pods.forEach((p, i) => capsule(p, GLASS, T, i + (mine ? 3 : 0), true));
    queue.forEach((uid, idx) => {
      const pod = pods[idx], u = state.units.find((x) => x.uid === uid);
      if (pod && u && idx < 2) { const s = depthScale(pod.y); drawAuthenticFigurine(u, pod.x, pod.y - 3 * s, 0, 0.6 * s, 0, pod.x, pod.y, state.selectedUnitId === u.uid); }
    });
    pods.forEach((p, i) => capsule(p, GLASS, T, i, false));
  }

  // ------------------------------------------------------------------ monte de plates
  function platesLeft(role) {
    if (role === "p2" && state.mode === "ai" && Array.isArray(state.aiPlates)) return state.aiPlates.filter((p) => !p.used).length;
    return (state.plates || []).filter((p) => !p.disabledInDeck && !(role === "p2" ? p.usedP2 : p.usedP1)).length;
  }
  function drawDeck(c, role, mine, T) {
    const s = depthScale(c.y), w = 26 * s, h = 34 * s, n = platesLeft(role);
    const fl = Math.sin(T * 0.002 + (mine ? 1 : 0)) * 1.2 * s;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.ellipse(c.x, c.y + h * 0.5 + 2 * s, w * 0.75, w * 0.22, 0, 0, 6.28); ctx.fill();
    const card = (dx, dy, top) => {
      const x = c.x - w / 2 + dx, y = c.y - h / 2 + dy + fl;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * 0.78, y); ctx.lineTo(x + w, y + h * 0.12); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w * 0.16, y + h); ctx.lineTo(x, y + h * 0.9); ctx.closePath();
      const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, "#3f3f46"); g.addColorStop(0.5, "#0a0a0c"); g.addColorStop(1, "#27272a");
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = top && mine ? hexA(bottomColor(), 0.9) : "#71717a"; ctx.lineWidth = 1.1 * s; ctx.stroke();
      return { x, y };
    };
    const layers = Math.min(3, Math.max(1, n));
    for (let k = layers - 1; k > 0; k--) card(k * 2.2 * s, -k * 2 * s, false);
    const t0 = card(0, 0, true);
    // ícone: a próxima plate (seu monte) ou o verso (oponente)
    const first = mine ? (state.plates || []).find((p) => !p.disabledInDeck && !(role === "p2" ? p.usedP2 : p.usedP1)) : null;
    const cat = first && typeof BASE_PLATE_CATALOG !== "undefined" ? BASE_PLATE_CATALOG.find((x) => x.id === first.id) : null;
    const src = cat && cat.icon;
    if (src) { const im = imgOf(src); if (im.complete && im.naturalWidth) { const iw = w * 0.62, ih = iw * im.naturalHeight / im.naturalWidth; ctx.drawImage(im, t0.x + w * 0.12, t0.y + h * 0.12, iw, Math.min(ih, h * 0.5)); } }
    else { ctx.fillStyle = "#18181b"; ctx.beginPath(); ctx.arc(t0.x + w / 2, t0.y + h / 2, w * 0.28, 0, 6.28); ctx.fill(); ctx.strokeStyle = "#a1a1aa"; ctx.lineWidth = 1.2 * s; ctx.stroke(); ctx.beginPath(); ctx.moveTo(t0.x + w * 0.22, t0.y + h / 2); ctx.lineTo(t0.x + w * 0.78, t0.y + h / 2); ctx.stroke(); }
    // brilho passando no topo
    const k = ((T + (mine ? 0 : 1800)) % 3600) / 3600;
    ctx.save(); ctx.beginPath(); ctx.rect(t0.x, t0.y, w, h); ctx.clip(); ctx.globalCompositeOperation = "lighter";
    const sx = t0.x - w + k * w * 3, sg = ctx.createLinearGradient(sx, t0.y, sx + w * 0.6, t0.y + h);
    sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, "rgba(255,255,255,0.18)"); sg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = sg; ctx.fillRect(t0.x, t0.y, w, h); ctx.restore();
    // contador
    ctx.fillStyle = "#020617"; ctx.strokeStyle = mine ? bottomColor() : topColor(); ctx.lineWidth = 1.2 * s;
    ctx.beginPath(); ctx.roundRect(c.x + w * 0.1, c.y + h * 0.32 + fl, 15 * s, 9 * s, 3 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = `900 ${6.5 * s}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("×" + n, c.x + w * 0.1 + 7.5 * s, c.y + h * 0.32 + 4.7 * s + fl);
    ctx.restore();
  }
  const imgCache = {};
  function imgOf(src) { if (!imgCache[src]) { const i = new Image(); i.src = src; imgCache[src] = i; } return imgCache[src]; }

  // ------------------------------------------------------------------ reflexo das peças no mármore
  function reflect(u, x, y, sc) {
    ctx.save(); tablePath(); ctx.clip();
    ctx.globalAlpha = cache.m.light ? 0.16 : 0.22;
    ctx.translate(x, y + 3 * sc); ctx.scale(1, -0.5); ctx.translate(-x, -y);
    const sw = window.__jxSX; window.__jxSX = 1;
    try { drawAuthenticFigurine(u, x, y, 0, sc, 0, x, y, false); } catch (e) {}
    window.__jxSX = sw;
    ctx.restore();
  }


  // ------------------------------------------------------------------ HUD do topo (como no original)
  function avatar(x, y, r, col, flip) {
    ctx.save();
    ctx.fillStyle = "#020617"; ctx.beginPath(); ctx.arc(x, y, r + 1.6, 0, 6.28); ctx.fill();
    const bg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 1, x, y, r); bg.addColorStop(0, "#e2e8f0"); bg.addColorStop(1, col);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.clip();
    ctx.fillStyle = "#f5d0b5"; ctx.beginPath(); ctx.ellipse(x, y + r * 0.15, r * 0.52, r * 0.6, 0, 0, 6.28); ctx.fill();               // rosto
    ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.ellipse(x, y + r * 1.2, r * 0.95, r * 0.55, 0, 0, 6.28); ctx.fill();               // roupa
    ctx.fillStyle = flip ? "#7f1d1d" : "#1e3a8a"; ctx.beginPath(); ctx.ellipse(x, y - r * 0.35, r * 0.62, r * 0.45, 0, Math.PI, 0); ctx.fill(); // cabelo
    ctx.fillStyle = "#e5e7eb"; ctx.beginPath(); ctx.roundRect(x - r * 0.55, y - r * 0.05, r * 1.1, r * 0.32, r * 0.14); ctx.fill();      // máscara
    ctx.fillStyle = "#0f172a"; ctx.beginPath(); ctx.arc(x - r * 0.24, y + r * 0.11, r * 0.09, 0, 6.28); ctx.arc(x + r * 0.24, y + r * 0.11, r * 0.09, 0, 6.28); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.stroke();
    ctx.restore();
  }
  function shield(x, y, n) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x - 6, y - 7); ctx.lineTo(x + 6, y - 7); ctx.lineTo(x + 6, y + 1); ctx.quadraticCurveTo(x + 6, y + 6, x, y + 8); ctx.quadraticCurveTo(x - 6, y + 6, x - 6, y + 1); ctx.closePath();
    const g = ctx.createLinearGradient(0, y - 7, 0, y + 8); g.addColorStop(0, "#86efac"); g.addColorStop(1, "#15803d");
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "#052e16"; ctx.lineWidth = 0.9; ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "900 7.5px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(n), x, y + 0.4);
    ctx.restore();
  }
  const fmt = (ms) => { const s = Math.ceil(Math.max(0, ms) / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const lvlOf = (rating) => Math.max(1, Math.min(99, Math.floor(((rating || 1000) - 900) / 100)));
  function drawHUD(T) {
    const bot = getBottomRole(), botBlue = bot === "p1";
    const me = window.trainerProfileData || {}, op = (typeof remoteOpponentProfile !== "undefined" && remoteOpponentProfile) || {};
    const myName = me.nickname || "Você";
    const opName = state.mode === "ai" ? (window.adaptiveAIOpponentName || op.nickname || "Rival") : (op.nickname || "Rival");
    const myClock = bot === "p2" ? state.clockMsP2 : state.clockMsP1, opClock = bot === "p2" ? state.clockMsP1 : state.clockMsP2;
    const myTurn = state.turn === bot;
    const y0 = 19, y1 = 52;
    const panel = (left, c0, c1, active) => {
      ctx.save();
      ctx.beginPath();
      if (left) { ctx.moveTo(0, y0); ctx.lineTo(166, y0); ctx.lineTo(156, y1); ctx.lineTo(0, y1); }
      else { ctx.moveTo(W, y0); ctx.lineTo(W - 166, y0); ctx.lineTo(W - 156, y1); ctx.lineTo(W, y1); }
      ctx.closePath();
      const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(left ? 0 : W - 166, y0, 166, 1.2);
      if (active) { ctx.strokeStyle = `rgba(250,204,21,${0.55 + Math.sin(T * 0.006) * 0.35})`; ctx.lineWidth = 1.6; ctx.stroke(); }
      ctx.restore();
    };
    const blue = ["#2563eb", "#0b2a6b"], red = ["#dc2626", "#5f0a17"];
    panel(true, ...(botBlue ? blue : red), myTurn);
    panel(false, ...(botBlue ? red : blue), !myTurn);
    avatar(19, 35.5, 14, botBlue ? "#38bdf8" : "#fb7185", !botBlue);
    avatar(W - 19, 35.5, 14, botBlue ? "#fb7185" : "#38bdf8", botBlue);
    ctx.save(); ctx.fillStyle = "#fff"; ctx.textBaseline = "middle";
    ctx.font = "800 9.5px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "left"; ctx.fillText(String(myName).slice(0, 14), 38, 27.5);
    ctx.textAlign = "right"; ctx.fillText(String(opName).slice(0, 14), W - 38, 27.5);
    ctx.font = "900 13px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = myClock < 60000 ? "#fca5a5" : "#fff"; ctx.textAlign = "left"; ctx.fillText(fmt(myClock), 56, 42.5);
    ctx.fillStyle = opClock < 60000 ? "#fca5a5" : "#fff"; ctx.textAlign = "right"; ctx.fillText(fmt(opClock), W - 56, 42.5);
    ctx.restore();
    shield(45, 42.5, lvlOf(me.rankRating)); shield(W - 45, 42.5, state.mode === "ai" ? Math.max(1, Math.round(((window.adaptiveAIBrain && adaptiveAIBrain.difficultyScale) || 0.5) * 10)) : lvlOf(op.rankRating));
    // TURN
    ctx.save();
    ctx.fillStyle = "#0b0f17"; ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(160, 19); ctx.lineTo(193, 19); ctx.lineTo(199, 28); ctx.lineTo(194, 52); ctx.lineTo(159, 52); ctx.lineTo(154, 28); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f1f5f9"; ctx.beginPath(); ctx.moveTo(161, 20.5); ctx.lineTo(192, 20.5); ctx.lineTo(195, 26); ctx.lineTo(158, 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#0f172a"; ctx.font = "900 5.4px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("TURN", 176.5, 23.4);
    ctx.fillStyle = "#fde047"; ctx.font = "900 14.5px -apple-system, BlinkMacSystemFont, sans-serif"; ctx.fillText(String(state.turnCounter), 176.5, 39.5);
    ctx.restore();
  }

  // ------------------------------------------------------------------ quadro completo
  const _oldFrame = drawFullTabletopFrame;
  drawFullTabletopFrame = function () {
    const tNow = performance.now() * 0.004, T = performance.now();
    const C = ensure();
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    const curS = window.ACTIVE_SCALE || HD_SCALE; ctx.scale(curS, curS);
    ctx.drawImage(C.room, 0, 0, W, H);
    drawRoomAnim(T);
    ctx.drawImage(C.table, 0, 0, W, H);
    drawTableAnim(T);
    drawRoutes(T);
    drawNodes(T);
    drawBenchPads(T);
    const botRole = getBottomRole(), topRole = botRole === "p1" ? "p2" : "p1";
    const topRevQueue = botRole === "p1" ? state.reviverQueueP2 : state.reviverQueueP1;
    const botRevQueue = botRole === "p1" ? state.reviverQueueP1 : state.reviverQueueP2;
    drawDeck(DECK.top, topRole, false, T);
    drawPC(REVIVER_PODS_P2, topRevQueue, topColor(), T, false);

    // HUD (nomes, relógio, ULTRA, botões) — partes antigas do tabuleiro ficam desligadas por PDR_ARENA3D
    ctx.imageSmoothingEnabled = (window.pixelArtMode === "hd");
    drawHDVectorBoardAndChrome();
    ctx.imageSmoothingEnabled = true;
    drawHUD(T);

    const notAnim = (u) => !activePieceAnim || activePieceAnim.uid !== u.uid;
    // reflexos primeiro (ficam por baixo de tudo que está em pé)
    const onBoard = state.units.filter((u) => u.location === "board" && notAnim(u));
    const topBench = state.units.filter((u) => u.owner === topRole && u.location === "bench" && notAnim(u));
    const botBench = state.units.filter((u) => u.owner === botRole && u.location === "bench" && notAnim(u));
    const posOf = (u) => u.location === "board" ? getNodePos(u.nodeId) : (u.owner === topRole ? P2_BENCH_COORDS[u.benchSlot % P2_BENCH_COORDS.length] : BENCH_SLOTS_P1[u.benchSlot % BENCH_SLOTS_P1.length]);
    [...topBench, ...onBoard, ...botBench].forEach((u) => { const p = posOf(u); if (p) reflect(u, p.x, p.y, depthScale(p.y)); });

    topBench.sort((a, b) => posOf(a).y - posOf(b).y).forEach((u) => { const p = posOf(u); drawAuthenticFigurine(u, p.x, p.y, 0, depthScale(p.y), 0, p.x, p.y, state.selectedUnitId === u.uid); });

    // casas alcançáveis, arcos de pulo e alvos
    if (state.selectedUnitId && !state.isAnimating) {
      Object.entries(state.reachablePaths || {}).forEach(([destId, segs]) => {
        segs.forEach((seg) => {
          if (seg.type !== "jump") return;
          const n1 = getNodePos(seg.fromNode), n2 = getNodePos(seg.toNode);
          ctx.save(); ctx.strokeStyle = "#c084fc"; ctx.lineWidth = 2.4; ctx.setLineDash([4, 3]); ctx.lineDashOffset = -T * 0.02;
          ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.quadraticCurveTo((n1.x + n2.x) / 2, Math.min(n1.y, n2.y) - 38, n2.x, n2.y); ctx.stroke(); ctx.restore();
        });
      });
      const pulse = 1 + Math.sin(tNow * 2.5) * 0.18;
      (state.reachableNodes || []).forEach((nid) => {
        const n = getNodePos(nid), s = depthScale(n.y);
        const isJump = state.reachablePaths[nid] && state.reachablePaths[nid].some((x) => x.type === "jump");
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const col = isJump ? "#c084fc" : "#4ade80";
        const rg = ctx.createRadialGradient(n.x, n.y, 1, n.x, n.y, 14 * s * pulse); rg.addColorStop(0, hexA(col, 0.65)); rg.addColorStop(1, hexA(col, 0));
        ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(n.x, n.y, 14 * s * pulse, 14 * s * pulse * SQ, 0, 0, 6.28); ctx.fill();
        ctx.globalCompositeOperation = "source-over"; ring(n.x, n.y, 9 * pulse, s, col, 2.2);
        ctx.restore();
      });
      (state.attackTargets || []).forEach((nid) => {
        const n = getNodePos(nid), s = depthScale(n.y);
        ctx.save(); ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.5 * s; ctx.setLineDash([6 * s, 4 * s]); ctx.lineDashOffset = T * 0.03;
        ctx.beginPath(); ctx.ellipse(n.x, n.y, 18 * s * pulse, 18 * s * pulse * SQ, 0, 0, 6.28); ctx.stroke(); ctx.restore();
      });
    }

    onBoard.sort((a, b) => getNodePos(a.nodeId).y - getNodePos(b.nodeId).y).forEach((u) => { const n = getNodePos(u.nodeId); if (n) drawAuthenticFigurine(u, n.x, n.y, 0, depthScale(n.y), 0, n.x, n.y, state.selectedUnitId === u.uid); });
    botBench.sort((a, b) => posOf(a).y - posOf(b).y).forEach((u) => { const p = posOf(u); drawAuthenticFigurine(u, p.x, p.y, 0, depthScale(p.y), 0, p.x, p.y, state.selectedUnitId === u.uid); });
    drawPC(REVIVER_PODS_P1, botRevQueue, bottomColor(), T, true);
    drawDeck(DECK.bot, botRole, true, T);

    // peça em movimento
    if (activePieceAnim) {
      const u = state.units.find((x) => x.uid === activePieceAnim.uid);
      if (u) {
        const s = depthScale(activePieceAnim.shadowY || activePieceAnim.y);
        if (activePieceAnim.portalAlpha > 0) {
          ctx.save();
          const beam = ctx.createLinearGradient(activePieceAnim.x - 16, 0, activePieceAnim.x + 16, 0);
          beam.addColorStop(0, "rgba(56,189,248,0)"); beam.addColorStop(0.5, `rgba(56,189,248,${activePieceAnim.portalAlpha * 0.85})`); beam.addColorStop(1, "rgba(56,189,248,0)");
          ctx.fillStyle = beam; ctx.fillRect(activePieceAnim.x - 16, 120, 32, activePieceAnim.shadowY - 115); ctx.restore();
        }
        if (window.Juice) { const sq = Juice.squash(activePieceAnim); window.__jxSX = sq.sx; window.__jxSY = sq.sy; }
        drawAuthenticFigurine(u, activePieceAnim.x, activePieceAnim.y - activePieceAnim.z, activePieceAnim.z, activePieceAnim.scale * s, activePieceAnim.rot, activePieceAnim.shadowX, activePieceAnim.shadowY, true);
        window.__jxSX = 1; window.__jxSY = 1;
      }
    }
    // efeitos
    for (let i = boardShockwaves.length - 1; i >= 0; i--) {
      const sw = boardShockwaves[i]; sw.r += (sw.maxR - sw.r) * 0.16; sw.alpha -= 0.04;
      if (sw.alpha <= 0) { boardShockwaves.splice(i, 1); continue; }
      const s = depthScale(sw.y);
      ctx.save(); ctx.strokeStyle = sw.color; ctx.globalAlpha = sw.alpha; ctx.lineWidth = 2.6 * s; ctx.beginPath(); ctx.ellipse(sw.x, sw.y, sw.r * s, sw.r * s * SQ, 0, 0, 6.28); ctx.stroke(); ctx.restore();
    }
    for (let i = boardBeams.length - 1; i >= 0; i--) {
      const bm = boardBeams[i]; bm.life -= 0.045; if (bm.life <= 0) { boardBeams.splice(i, 1); continue; }
      ctx.save(); ctx.strokeStyle = bm.color; ctx.globalAlpha = bm.life; ctx.lineWidth = 5 * bm.life; ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke(); ctx.restore();
    }
    for (let i = boardParticles.length - 1; i >= 0; i--) {
      const pt = boardParticles[i]; pt.x += pt.vx; pt.y += pt.vy; pt.life -= pt.decay;
      if (pt.life <= 0) { boardParticles.splice(i, 1); continue; }
      ctx.save(); ctx.fillStyle = pt.color; ctx.globalAlpha = pt.life; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, 6.28); ctx.fill(); ctx.restore();
    }
    drawVideoMatchOverlays();
    ctx.restore();
  };
  window.PDRArena.oldFrame = _oldFrame;
  window.PDRArena.textures = () => { try { return ensure(); } catch (e) { return null; } };

  // ------------------------------------------------------------------ toques: monte de plates e segurar = Dados
  const toLogical = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
  function unitAt(p) {
    const botRole = getBottomRole(), topRole = botRole === "p1" ? "p2" : "p1";
    const find = (arr, role, loc) => state.units.find((u) => u.owner === role && u.location === loc && (() => { const s = arr[u.benchSlot % arr.length]; return s && Math.hypot(p.x - s.x, (p.y - (s.y - 10)) * 0.85) < 26; })());
    let u = find(BENCH_SLOTS_P1, botRole, "bench") || find(P2_BENCH_COORDS, topRole, "bench");
    if (u) return u;
    const pcs = [[REVIVER_PODS_P1, botRole === "p1" ? state.reviverQueueP1 : state.reviverQueueP2], [REVIVER_PODS_P2, botRole === "p1" ? state.reviverQueueP2 : state.reviverQueueP1]];
    for (const [pods, q] of pcs) for (let i = 0; i < 2 && i < q.length; i++) if (Math.hypot(p.x - pods[i].x, p.y - pods[i].y + 8) < 22) return state.units.find((x) => x.uid === q[i]);
    let best = null, bd = 24;
    state.units.forEach((x) => { if (x.location !== "board") return; const n = getNodePos(x.nodeId); const d = Math.hypot(n.x - p.x, n.y - 8 - p.y); if (d < bd) { bd = d; best = x; } });
    return best;
  }
  let press = null;
  canvas.addEventListener("pointerdown", (e) => {
    const p = toLogical(e);
    const d = DECK.bot, s = depthScale(d.y);
    if (!state.isAnimating && !state.preMatchAnim && Math.abs(p.x - d.x) < 20 * s && Math.abs(p.y - d.y) < 24 * s) {
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
    if (!window.PDRDuelScreens || !PDRDuelScreens.showDataReadOnly) return;
    try { if (navigator.vibrate) navigator.vibrate(25); } catch (e) {}
    try { if (window.PDRSound) PDRSound.play("tick"); } catch (e) {}
    let ov = document.getElementById("pd-unit-info");
    if (ov) ov.remove();
    ov = document.createElement("div"); ov.id = "pd-unit-info";
    ov.style.cssText = "position:fixed;inset:0;z-index:9000;background:rgba(2,6,23,.94);overflow-y:auto;-webkit-overflow-scrolling:touch;padding:10px 8px 24px;animation:pdInfoIn .18s ease-out";
    if (!document.getElementById("pd-unit-info-css")) { const st = document.createElement("style"); st.id = "pd-unit-info-css"; st.textContent = "@keyframes pdInfoIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}"; document.head.appendChild(st); }
    const inner = document.createElement("div"); inner.style.cssText = "max-width:480px;margin:0 auto";
    ov.appendChild(inner); document.body.appendChild(ov);
    const close = () => { ov.remove(); };
    PDRDuelScreens.showDataReadOnly(inner, u.baseIdx, { backLabel: (typeof t === "function" ? t("ar.back_match", "Partida") : "Partida"), onBack: close });
  }
  window.PDRArena.openUnitInfo = openUnitInfo;

  // cartão de roleta do canto: removido (segure a peça para ver os Dados)
  if (typeof showCornerFigureCard === "function") {
    const off = function () { try { hideCornerFigureCard(); } catch (e) {} };
    try { showCornerFigureCard = off; } catch (e) {}
    window.showCornerFigureCard = off;
  }
})();
