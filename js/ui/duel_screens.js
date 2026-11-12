// ============================================================================
// v704 · Telas no estilo do Pokémon Duel original
//  1. Fusão: grade de figuras → tela "Data" (roleta grande, ID/Lv/CLv, tipo, habilidade, evoluções,
//     tabela Wheel Piece com o que cada ataque faz, Z-Moves) → "Disk Expansion" / "Damage Reallocation".
//  2. Partida: confirmação "Evolve?" com a roleta atual ↓ roleta nova, raridade e MP.
//  3. Partida: Z-Move mostra o(s) Z-Move(s) oficiais da peça e pede confirmação (escolhe se houver 2).
//  4. Partida: depois da roleta, o vencedor lança o ataque no perdedor.
// Carrega por último (depois de app.js). Usa OFFICIAL_DUEL_EXTRA (js/data/official_extra.js).
// ============================================================================
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const tt = (k, fb) => (typeof t === "function" ? t(k, fb) : fb);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (n) => String(n || "").toLowerCase().replace(/[\s\-_]/g, "");
  const COL = { white: "#f1f5f9", gold: "#facc15", purple: "#c084fc", blue: "#38bdf8", red: "#ef4444" };
  const sfx = (n) => { try { if (typeof playSfx === "function") playSfx(n); } catch (e) {} };

  function spriteOf(key) {
    const s = (typeof AUTHENTIC_FIG_SPRITES !== "undefined") && (AUTHENTIC_FIG_SPRITES[key] || AUTHENTIC_FIG_SPRITES.pikachu);
    return s ? s.uri : "";
  }
  function extraOf(fig) { return (fig && fig.officialDuelId != null && typeof OFFICIAL_DUEL_EXTRA !== "undefined") ? OFFICIAL_DUEL_EXTRA[fig.officialDuelId] : null; }
  function moveName(n) { return (typeof localizeMove === "function") ? localizeMove(n) : n; }
  function typeName(tp) { return (typeof localizeType === "function") ? localizeType(tp) : tp; }
  function figIdx(f) { return FIGURES_DB.indexOf(f); }
  function unlocked(i) { return typeof isFigureUnlocked === "function" ? isFigureUnlocked(i) : true; }

  // Texto do que a fatia faz
  function sliceText(fig, s) {
    if (!s) return "";
    if (s.effectText) return s.effectText;
    const ex = extraOf(fig);
    if (ex && ex.fx) {
      if (ex.fx[s.name]) return ex.fx[s.name];
      const k = Object.keys(ex.fx).find((x) => norm(x) === norm(s.name));
      if (k) return ex.fx[k];
    }
    if (s.color === "red") return tt("ds.miss_desc", "Sem efeito.");
    if (s.color === "blue") return tt("ds.blue_desc", "Defesa: bloqueia Ataques Brancos e Dourados.");
    if (s.color === "gold") return tt("ds.gold_desc", "Ataque Dourado: vence Brancos e empata com Dourados por dano.");
    if (s.color === "white") return tt("ds.white_desc", "Ataque Branco: o maior dano vence.");
    if (s.color === "purple") return tt("ds.purple_desc", "Ataque Roxo: mais ★ vence; vence Brancos e Dourados.");
    return "";
  }
  function sliceValue(s, bonus) {
    if (s.color === "purple") return "★".repeat(Math.max(1, s.stars || 1));
    if ((s.color === "white" || s.color === "gold") && (s.dmg > 0 || bonus > 0)) return String((s.dmg || 0) + (bonus || 0));
    return "—";
  }

  // ---------------------------------------------------------------- roleta
  // Desenha em espaço lógico 220×220 (raio 92) e escala para o tamanho CSS do canvas, mantendo nitidez.
  function drawWheel(canvas, segs, opts) {
    opts = opts || {};
    const css = canvas.clientWidth || parseInt(canvas.style.width, 10) || 200;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const px = Math.round(css * dpr);
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, px, px);
    ctx.scale(px / 220, px / 220);
    if (typeof drawAuthenticDataDisk === "function") {
      drawAuthenticDataDisk(ctx, 110, 110, 92, segs, opts.rot || 0, opts.hi == null ? -1 : opts.hi, 0, opts.border || "#38bdf8", false, null);
    }
    if (opts.bottomPin) {
      ctx.save();
      ctx.translate(110, 214);
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(8, -4); ctx.lineTo(0, 4); ctx.lineTo(-8, -4); ctx.closePath();
      const g = ctx.createLinearGradient(0, -16, 0, 4); g.addColorStop(0, "#fca5a5"); g.addColorStop(1, "#b91c1c");
      ctx.fillStyle = g; ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 8; ctx.fill();
      ctx.restore();
    }
    if (opts.center) {
      ctx.save();
      ctx.beginPath(); ctx.arc(110, 110, 24, 0, Math.PI * 2); ctx.fillStyle = "#020617"; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = "#38bdf8"; ctx.stroke();
      ctx.fillStyle = "#fde047"; ctx.font = "900 17px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(opts.center, 110, 108);
      if (opts.centerSub) { ctx.fillStyle = "#94a3b8"; ctx.font = "800 6.5px sans-serif"; ctx.fillText(opts.centerSub, 110, 123); }
      ctx.restore();
    }
  }
  function sliceAtPoint(canvas, segs, ev, rot) {
    const r = canvas.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * 220 - 110, y = (ev.clientY - r.top) / r.height * 220 - 110;
    if (Math.hypot(x, y) > 104) return -1;
    let a = Math.atan2(y, x) + Math.PI / 2 - (rot || 0);
    a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const tot = segs.reduce((s, x) => s + x.size, 0) || 96;
    let acc = 0;
    for (let i = 0; i < segs.length; i++) { const sp = segs[i].size / tot * Math.PI * 2; if (a >= acc && a < acc + sp) return i; acc += sp; }
    return -1;
  }
  function rotToBottom(segs, idx) {
    const tot = segs.reduce((s, x) => s + x.size, 0) || 96;
    let acc = 0; for (let i = 0; i < idx; i++) acc += segs[i].size;
    return Math.PI - (acc + segs[idx].size / 2) / tot * Math.PI * 2;
  }
  function displaySegs(f, sizes, clv) {
    return f.wheel.map((w, i) => {
      const add = (clv && clv[i]) || 0;
      return Object.assign({}, w, { size: sizes ? sizes[i] : w.size, dmg: w.dmg > 0 || add > 0 ? (w.dmg || 0) + add : 0, name: moveName(w.name) });
    });
  }

  // ---------------------------------------------------------------- CSS
  const css = `
  .ds-root{color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:6px 6px 14px}
  .ds-title{display:flex;align-items:center;justify-content:center;position:relative;margin:2px 0 8px}
  .ds-title span{background:#020617;border:2px solid #1e3a8a;border-radius:99px;padding:5px 26px;font-weight:900;font-size:15px;color:#fff;box-shadow:0 0 0 2px #0b1220,0 0 14px rgba(56,189,248,.35)}
  .ds-back{position:absolute;left:0;top:50%;transform:translateY(-50%);background:#0f172a;border:1.5px solid #334155;color:#cbd5e1;border-radius:8px;font-weight:900;font-size:12px;padding:5px 9px;cursor:pointer}
  .ds-chips{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin-bottom:7px}
  .ds-chip{background:#0f172a;border:1.5px solid #334155;color:#94a3b8;border-radius:99px;font-size:10px;font-weight:900;padding:3px 9px;cursor:pointer}
  .ds-chip.on{background:#1d4ed8;border-color:#93c5fd;color:#fff}
  .ds-search{width:100%;box-sizing:border-box;background:#020617;border:1.5px solid #334155;border-radius:8px;color:#fff;padding:6px 9px;font-size:12px;margin-bottom:7px}
  .ds-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
  .ds-card{position:relative;background:radial-gradient(circle at 50% 30%,#1e3a5f,#0b1220 70%);border:1.5px solid #1e293b;border-radius:9px;padding:4px 2px 3px;text-align:center;cursor:pointer;overflow:hidden}
  .ds-card:active{transform:scale(.96)}
  .ds-card img{width:100%;height:58px;object-fit:contain;filter:drop-shadow(0 3px 3px rgba(0,0,0,.6))}
  .ds-card .nm{font-size:8.5px;font-weight:800;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ds-card .lv{position:absolute;top:3px;right:4px;font-size:8px;font-weight:900;color:#fde047;text-shadow:0 1px 2px #000}
  .ds-card .rb{position:absolute;top:3px;left:3px;transform:scale(.85);transform-origin:left top}
  .ds-rar{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;border-radius:99px;font-weight:900;font-size:10px;border:2px solid #cbd5e1;background:radial-gradient(circle at 35% 30%,#94a3b8,#334155);color:#fff}
  .ds-rar.UC{background:radial-gradient(circle at 35% 30%,#cbd5e1,#64748b)}
  .ds-rar.R{background:radial-gradient(circle at 35% 30%,#fde68a,#b45309);border-color:#fde68a}
  .ds-rar.EX{background:radial-gradient(circle at 35% 30%,#fef08a,#a16207);border-color:#fef08a;color:#1c1917}
  .ds-rar.UX{background:conic-gradient(#f472b6,#facc15,#4ade80,#38bdf8,#a78bfa,#f472b6);border-color:#fff;color:#fff;text-shadow:0 1px 2px #000}
  .ds-mp{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:99px;font-weight:900;font-size:12px;background:radial-gradient(circle at 35% 30%,#60a5fa,#1d4ed8);border:2px solid #bfdbfe;color:#fff}
  .ds-data{display:grid;grid-template-columns:47% 53%;gap:6px;align-items:start}
  .ds-wheelbox{position:relative;text-align:center}
  .ds-wheelbox canvas{width:100%;aspect-ratio:1;display:block;cursor:pointer}
  .ds-badges{display:flex;gap:4px;justify-content:center;margin-top:-4px}
  .ds-info .id{font-size:10px;color:#94a3b8;font-weight:800}
  .ds-info .name{font-size:17px;font-weight:900;color:#fff;line-height:1.1;margin-bottom:4px}
  .ds-bar{position:relative;height:15px;border-radius:99px;background:#0b1220;border:1px solid #1e3a8a;margin-bottom:3px;overflow:hidden;font-size:9px;font-weight:900}
  .ds-bar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#1d4ed8,#38bdf8)}
  .ds-bar.c i{background:linear-gradient(90deg,#15803d,#4ade80)}
  .ds-bar b{position:relative;padding-left:7px;line-height:15px;color:#fff}
  .ds-bar em{position:absolute;right:7px;top:0;line-height:15px;font-style:normal;color:#e2e8f0}
  .ds-row{display:flex;gap:5px;align-items:center;font-size:10.5px;margin:2px 0}
  .ds-row .k{background:#1e293b;color:#94a3b8;font-weight:900;font-size:9px;border-radius:4px;padding:1px 6px;min-width:46px;text-align:center}
  .ds-row .v{font-weight:800;color:#fff}
  .ds-abtxt{font-size:10px;line-height:1.35;color:#e2e8f0;background:#020617;border:1px solid #1e293b;border-radius:6px;padding:5px 6px;max-height:84px;overflow:auto;margin-top:3px}
  .ds-sec{font-size:12px;font-weight:900;color:#cbd5e1;margin:9px 2px 4px;text-shadow:0 1px 2px #000}
  .ds-evo{display:flex;gap:4px;justify-content:center;align-items:flex-end;flex-wrap:wrap}
  .ds-ped{width:70px;text-align:center;cursor:pointer;position:relative}
  .ds-ped img{width:62px;height:62px;object-fit:contain;position:relative;z-index:1;filter:drop-shadow(0 3px 2px rgba(0,0,0,.6))}
  .ds-ped:before{content:"";position:absolute;left:8px;right:8px;bottom:12px;height:14px;border-radius:50%;background:radial-gradient(ellipse at 50% 35%,#d6a66b,#7c4a1e 70%);box-shadow:0 3px 0 #4a2c10}
  .ds-ped.cur img{filter:drop-shadow(0 0 6px #fde047)}
  .ds-ped .nm{font-size:8px;font-weight:800;color:#cbd5e1;position:relative;z-index:1}
  .ds-ped.lock img{filter:brightness(0) opacity(.55)}
  .ds-tbl{border-radius:8px;overflow:hidden;border:1px solid #334155;background:#f8fafc}
  .ds-th{display:grid;grid-template-columns:44px 1fr 60px;background:#0f172a;color:#cbd5e1;font-size:9.5px;font-weight:900;text-align:center;padding:3px 0}
  .ds-tr{display:grid;grid-template-columns:44px 1fr 60px;align-items:center;font-size:11.5px;font-weight:800;color:#0f172a;border-top:1px solid #cbd5e1;cursor:pointer;min-height:26px}
  .ds-tr .sz{text-align:center;color:#334155}.ds-tr .dm{text-align:center}
  .ds-tr .at{display:flex;align-items:center;gap:5px}
  .ds-tr .at i{width:9px;height:9px;border-radius:2px;display:inline-block;border:1px solid rgba(0,0,0,.25)}
  .ds-tr.on{outline:2px solid #2563eb;outline-offset:-2px}
  .ds-tr.purple{background:#f3e8ff}.ds-tr.gold{background:#fef9c3}.ds-tr.blue{background:#e0f2fe}.ds-tr.red{background:#fee2e2}
  .ds-desc{grid-column:1/4;background:#fff;border-top:1px dashed #94a3b8;color:#1e293b;font-size:10.5px;font-weight:600;padding:5px 8px;line-height:1.35}
  .ds-z{background:linear-gradient(90deg,#3b0764,#1e1b4b);border:1.5px solid #c084fc;border-radius:8px;padding:6px 8px;margin-bottom:4px}
  .ds-z b{color:#fde047;font-size:11.5px}.ds-z p{margin:3px 0 0;font-size:10px;color:#e9d5ff;line-height:1.35}
  .ds-btns{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:10px}
  .ds-btn{border-radius:9px;padding:9px 6px;font-weight:900;font-size:12px;cursor:pointer;color:#e0f2fe;background:linear-gradient(180deg,#1e3a5f,#0f2440);border:2px solid #2563eb;box-shadow:inset 0 1px 0 rgba(255,255,255,.15)}
  .ds-btn.gold{background:linear-gradient(180deg,#a16207,#713f12);border-color:#facc15;color:#fde047;font-size:16px;letter-spacing:1px}
  .ds-btn.cy{background:linear-gradient(180deg,#38bdf8,#0284c7);border-color:#bae6fd;color:#082f49}
  .ds-btn:disabled{opacity:.4}
  .ds-head{display:grid;grid-template-columns:64px 1fr auto;gap:8px;align-items:center;background:#020617;border-radius:10px;padding:6px 8px;margin-bottom:6px}
  .ds-head img{width:60px;height:60px;object-fit:contain}
  .ds-slicename{background:#111827;border:2px solid #1f2937;color:#fff;text-align:center;font-weight:900;font-size:17px;padding:7px;margin:6px 10px}
  .ds-pts{text-align:center;font-size:11px;font-weight:900;color:#fde047;margin:2px 0 4px}
  .ds-msg{text-align:center;font-size:10.5px;font-weight:800;color:#fde047;min-height:14px;margin-top:6px}
  .ds-tabs{display:flex;gap:5px;justify-content:center;margin-bottom:4px}
  .ds-mat{display:flex;justify-content:space-between;flex-wrap:wrap;gap:4px;font-size:9.5px;font-weight:900;background:#020617;border:1px solid #1e3a8a;border-radius:7px;padding:5px 7px;margin-top:8px}
  /* modais de partida */
  .ds-modal{position:fixed;inset:0;z-index:300;background:rgba(2,6,15,.78);display:flex;align-items:center;justify-content:center;padding:12px}
  .ds-panel{width:100%;max-width:340px;background:#0b0f17;border:2px solid #334155;border-radius:12px;padding:8px;color:#fff;box-shadow:0 0 40px rgba(0,0,0,.8);max-height:94vh;overflow:auto}
  .ds-evrow{display:grid;grid-template-columns:76px 1fr 96px;gap:6px;align-items:center;background:#0f172a;border:1px solid #1e293b;border-radius:9px;padding:6px}
  .ds-evrow .side{font-size:8px;color:#94a3b8;font-weight:900;background:#020617;border-radius:6px;padding:4px;min-height:70px}
  .ds-evrow .side .ab{background:#0f3b4d;color:#a5f3fc;border-radius:4px;padding:2px 3px;margin-top:3px;font-size:8.5px;text-align:center}
  .ds-evrow canvas{width:96px;height:96px}
  .ds-evrow .nm{font-size:15px;font-weight:900}
  .ds-chev{text-align:center;color:#475569;font-size:18px;line-height:14px;margin:2px 0}
  .ds-ask{text-align:center;font-size:22px;font-weight:900;margin:8px 0 6px}
  .ds-note{background:#020617;border:1px solid #334155;border-radius:6px;padding:7px 8px;color:#fde047;font-size:11px;font-weight:700;line-height:1.4;max-height:96px;overflow:auto}
  .ds-yn{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:10px 6px 4px}
  .ds-yn button{height:42px;border-radius:7px;background:linear-gradient(180deg,#fde047,#eab308);border:2px solid #fef9c3;color:#1c1917;font-weight:900;font-size:17px;letter-spacing:2px;cursor:pointer;box-shadow:0 3px 0 #854d0e}
  .ds-zopt{display:grid;grid-template-columns:96px 1fr;gap:8px;align-items:center;background:#1e1b4b;border:2px solid #4c1d95;border-radius:10px;padding:6px;margin-bottom:6px;cursor:pointer}
  .ds-zopt.on{border-color:#fde047;box-shadow:0 0 14px rgba(250,204,21,.5)}
  .ds-zopt canvas{width:96px;height:96px}
  .ds-zopt b{font-size:13px;color:#fde047}.ds-zopt p{margin:3px 0 0;font-size:10px;color:#ddd6fe;line-height:1.35}
  .ds-zunits{display:flex;gap:5px;overflow-x:auto;padding-bottom:4px;margin-bottom:6px}
  .ds-zunits div{flex:0 0 auto;width:58px;text-align:center;background:#0f172a;border:2px solid #1e293b;border-radius:8px;cursor:pointer;font-size:8px;font-weight:800;padding:2px}
  .ds-zunits div.on{border-color:#fde047}
  .ds-zunits img{width:48px;height:48px;object-fit:contain}
  /* animação de ataque */
  .ds-atk{position:fixed;inset:0;z-index:262;pointer-events:none;overflow:hidden}
  .ds-atk .fig{position:absolute;width:130px;height:130px;margin:-65px 0 0 -65px;object-fit:contain;filter:drop-shadow(0 8px 8px rgba(0,0,0,.7))}
  .ds-atk .orb{position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%}
  .ds-atk .slash{position:absolute;width:160px;height:16px;margin:-8px 0 0 -80px;border-radius:99px;background:linear-gradient(90deg,transparent,#fff,transparent)}
  .ds-atk .dim{position:absolute;inset:0;background:radial-gradient(circle,rgba(2,6,23,.35),rgba(2,6,23,.85))}
  `;
  function injectCss() { if ($("ds-css")) return; const st = document.createElement("style"); st.id = "ds-css"; st.textContent = css; document.head.appendChild(st); }
  const rarHtml = (r) => `<span class="ds-rar ${esc(r)}">${esc(r)}</span>`;
  const mpHtml = (m) => `<span class="ds-mp">${esc(m)}</span>`;

  // ============================================================= 1. FUSÃO
  const F = { view: "grid", idx: -1, rar: "ALL", q: "", open: -1, xp: null };

  function legacyEnsure(root) {
    // Mantém os elementos que o código antigo (applyFusionMaterial etc.) lê, mas escondidos
    let h = $("ds-legacy");
    if (!h) {
      h = document.createElement("div"); h.id = "ds-legacy"; h.style.display = "none";
      ["fusion-target-select:select", "fusion-wheel-canvas:canvas", "fusion-preview-box:div", "fusion-coins-lbl:span", "fusion-rm-item-lbl:span", "carmonite-lbl:span", "cc-lbl:span", "fusion-ingot-lbl:span", "lbl-cost-rm:span", "lbl-cost-carm:span", "lbl-cost-cube:span", "lbl-cost-ingot:span", "fusion-status-msg:div"].forEach((p) => {
        const [id, tag] = p.split(":");
        const old = $(id);
        const el = old || document.createElement(tag);
        el.id = id; h.appendChild(el);
      });
      root.appendChild(h);
    }
    return h;
  }
  function setLegacyIdx(i) {
    const sel = $("fusion-target-select");
    if (!sel) return;
    if (!sel.querySelector(`option[value="${i}"]`)) { const o = document.createElement("option"); o.value = i; sel.appendChild(o); }
    sel.value = String(i);
  }

  function mountFusion() {
    const tab = $("dtab-fusion");
    if (!tab) return null;
    let root = $("ds-fusion");
    if (!root) {
      injectCss();
      const legacy = legacyEnsure(tab);
      Array.from(tab.children).forEach((c) => { if (c !== legacy) c.remove(); });
      root = document.createElement("div"); root.id = "ds-fusion"; root.className = "ds-root";
      tab.insertBefore(root, legacy);
    }
    return root;
  }

  function renderFusion() {
    const root = mountFusion();
    if (!root) return;
    F.ro = false;
    if (F.view === "data" && FIGURES_DB[F.idx]) return renderData(root);
    if (F.view === "xp" && FIGURES_DB[F.idx]) return renderExpansion(root);
    F.view = "grid";
    renderGrid(root);
  }

  function renderGrid(root) {
    const rars = ["ALL", "C", "UC", "R", "EX", "UX"];
    const list = FIGURES_DB.map((f, i) => ({ f, i })).filter((x) => unlocked(x.i) &&
      (F.rar === "ALL" || x.f.rarity === F.rar) && (!F.q || norm(x.f.name).includes(norm(F.q))));
    const order = { UX: 0, EX: 1, R: 2, UC: 3, C: 4 };
    list.sort((a, b) => (order[a.f.rarity] - order[b.f.rarity]) || ((b.f.level || 1) - (a.f.level || 1)) || a.f.name.localeCompare(b.f.name));
    root.innerHTML = `
      <div class="ds-title"><span>${tt("ds.fusion", "Fusão")}</span></div>
      <input class="ds-search" id="ds-q" placeholder="🔎 ${tt("ds.search", "Buscar figura...")}" value="${esc(F.q)}">
      <div class="ds-chips">${rars.map((r) => `<button class="ds-chip ${F.rar === r ? "on" : ""}" data-r="${r}">${r === "ALL" ? tt("ds.all", "Todas") : r}</button>`).join("")}</div>
      <div class="ds-grid">${list.map(({ f, i }) => `
        <div class="ds-card" data-i="${i}">
          <span class="rb">${rarHtml(f.rarity)}</span><span class="lv">Lv${f.level || 1}</span>
          <img loading="lazy" src="${spriteOf(f.spriteKey)}" alt="">
          <div class="nm">${esc(f.name)}</div>
        </div>`).join("") || `<div style="grid-column:1/5;text-align:center;color:#64748b;font-size:11px;padding:20px">${tt("ds.none", "Nenhuma figura.")}</div>`}
      </div>`;
    const q = $("ds-q");
    q.oninput = () => { F.q = q.value; const pos = q.selectionStart; renderGrid(root); const q2 = $("ds-q"); q2.focus(); q2.setSelectionRange(pos, pos); };
    root.querySelectorAll(".ds-chip").forEach((b) => { b.onclick = () => { F.rar = b.dataset.r; sfx("tick"); renderGrid(root); }; });
    root.querySelectorAll(".ds-card").forEach((c) => { c.onclick = () => openData(+c.dataset.i); });
  }

  function openData(i) {
    F.idx = i; F.view = "data"; F.open = -1;
    setLegacyIdx(i);
    sfx("tick");
    renderFusion();
    const tab = $("dtab-fusion"); if (tab) tab.scrollTop = 0;
  }

  function evoLineOf(f) {
    let line = (typeof getFigureEvolutionLine === "function") ? getFigureEvolutionLine(f) : [f.name];
    if (typeof POKEMON_EVOLUTION_FAMILIES !== "undefined") {
      const fam = POKEMON_EVOLUTION_FAMILIES.find((x) => x.some((n) => norm(n) === norm(f.name)));
      if (fam && fam.length > line.length) line = fam;
    }
    return line;
  }

  function renderData(root) {
    const f = FIGURES_DB[F.idx];
    ensureFigureUpgradeMetadata(f);
    const i = F.idx;
    const ab = f.officialAbility;
    const abName = ab ? ab.n : tt("ds.no_ability", "—");
    const abText = ab ? ab.t : ((typeof localizeAbility === "function") ? localizeAbility(f) : "");
    const segs = displaySegs(f, null, f.clvAlloc);
    const line = evoLineOf(f);
    const ex = extraOf(f);
    const zs = (ex && ex.z) || [];
    const duels = (f.duels || (window.__pdrFigDuels && window.__pdrFigDuels[f.id]) || 0);
    const mp = (typeof getFigureEffectiveMp === "function") ? getFigureEffectiveMp(f) : f.mp;
    const lvPct = Math.round(((f.level || 1) / 10) * 100), clvPct = Math.round(((f.clv || 0) / 10) * 100);
    root.innerHTML = `
      <div class="ds-title"><button class="ds-back" id="ds-back">‹ ${F.ro ? (F.backLabel || "Deck") : tt("ds.back", "Voltar")}</button><span>Data</span></div>
      <div class="ds-data">
        <div class="ds-wheelbox"><canvas id="ds-wheel"></canvas>
          <div class="ds-badges">${rarHtml(f.rarity)}${mpHtml(mp)}</div>
        </div>
        <div class="ds-info">
          <div class="id">ID ${f.officialDuelId != null ? f.officialDuelId : i + 1}</div>
          <div class="name">${esc(f.name)}</div>
          <div class="ds-bar"><i style="width:${lvPct}%"></i><b>Lv${f.level || 1}</b><em>${f.level || 1}/10</em></div>
          <div class="ds-bar c"><i style="width:${clvPct}%"></i><b>⌃ CLv${f.clv || 0}</b><em>${f.clv || 0}/10</em></div>
          <div class="ds-row"><span class="k">${tt("ds.duels", "Duelos")}</span><span class="v">${duels}</span></div>
          <div class="ds-row"><span class="k">${tt("ds.type", "Tipo")}</span><span class="v">${esc(typeName(f.type))}</span></div>
          <div class="ds-row"><span class="k">${tt("ds.ability", "Habilidade")}</span><span class="v">${esc(abName)}</span></div>
          <div class="ds-abtxt">${esc(abText || tt("ds.no_ability_txt", "Esta figura não tem Habilidade."))}</div>
        </div>
      </div>
      <div class="ds-sec">${tt("ds.evolution", "Evolução")}</div>
      <div class="ds-evo">${line.map((n) => {
        const nf = (typeof findFigureByName === "function") ? findFigureByName(n) : null;
        const ni = nf ? figIdx(nf) : -1;
        const cur = norm(n) === norm(f.name), lock = ni < 0 || !unlocked(ni);
        return `<div class="ds-ped ${cur ? "cur" : ""} ${lock && !cur ? "lock" : ""}" data-i="${ni}"><img src="${nf ? spriteOf(nf.spriteKey) : ""}" alt=""><div class="nm">${esc(n)}</div></div>`;
      }).join("")}</div>
      <div class="ds-sec">Wheel Piece</div>
      <div class="ds-tbl">
        <div class="ds-th"><span>${tt("ds.size", "Tam.")}</span><span>${tt("ds.attack", "Ataque")}</span><span>${tt("ds.damage", "Dano")}</span></div>
        ${f.wheel.map((w, k) => `
          <div class="ds-tr ${w.color} ${F.open === k ? "on" : ""}" data-k="${k}">
            <span class="sz">${w.size}</span>
            <span class="at"><i style="background:${COL[w.color] || "#fff"}"></i>${esc(moveName(w.name))}</span>
            <span class="dm">${sliceValue(w, (f.clvAlloc && f.clvAlloc[k]) || 0)}</span>
            ${F.open === k ? `<div class="ds-desc">${esc(sliceText(f, w))}</div>` : ""}
          </div>`).join("")}
      </div>
      ${zs.length ? `<div class="ds-sec">Z-Move</div>${zs.map((z) => `<div class="ds-z"><b>⚡ ${esc(z.n)}</b> <span style="font-size:10px;color:#c4b5fd">${z.c === "purple" ? "★".repeat(z.s || 4) : (z.d != null ? z.d + " " + tt("ds.dmg", "dano") : "")}</span>${z.t ? `<p>${esc(z.t)}</p>` : ""}</div>`).join("")}` : ""}
      ${F.ro ? (F.extraHtml || "") : `<div class="ds-btns">
        <button class="ds-btn" id="ds-go-xp">Disk Expansion</button>
        <button class="ds-btn" id="ds-go-dr">Damage Reallocation</button>
      </div>
      <div class="ds-sec">${tt("ds.fuse", "Fundir (subir nível)")}</div>
      <div class="ds-btns" style="margin-top:0">
        <button class="ds-btn" data-m="rare_metal">🟦 Lv +1 <small style="display:block;font-size:8.5px;opacity:.8" id="ds-c-rm"></small></button>
        <button class="ds-btn" data-m="carmonite" style="border-color:#a855f7">🟣 Lv +1 <small style="display:block;font-size:8.5px;opacity:.8" id="ds-c-carm"></small></button>
        <button class="ds-btn" data-m="cube" style="border-color:#22c55e">🟩 CLv +1 <small style="display:block;font-size:8.5px;opacity:.8" id="ds-c-cube"></small></button>
        <button class="ds-btn" data-m="ingot" style="border-color:#eab308">🟨 ${tt("ds.sell_ingot", "Vender Ingot")} <small style="display:block;font-size:8.5px;opacity:.8" id="ds-c-ing"></small></button>
      </div>
      <div class="ds-mat" id="ds-mat"></div>
      <div class="ds-msg" id="ds-msg"></div>`}`;
    const cv = $("ds-wheel");
    const draw = () => drawWheel(cv, segs, { hi: F.open, border: f.rarity === "UX" ? "#c084fc" : "#38bdf8" });
    requestAnimationFrame(draw);
    cv.onclick = (ev) => { const k = sliceAtPoint(cv, segs, ev, 0); if (k >= 0) { F.open = F.open === k ? -1 : k; sfx("tick"); renderData(root); } };
    $("ds-back").onclick = () => { if (F.ro) { sfx("back"); if (F.onBack) F.onBack(); return; } F.view = "grid"; sfx("tick"); renderFusion(); };
    root.querySelectorAll(".ds-tr").forEach((r) => { r.onclick = () => { const k = +r.dataset.k; F.open = F.open === k ? -1 : k; sfx("tick"); renderData(root); }; });
    root.querySelectorAll(".ds-ped").forEach((p) => { p.onclick = () => { const ni = +p.dataset.i; if (ni >= 0 && ni !== F.idx && (F.ro || unlocked(ni))) { if (F.ro) { F.idx = ni; F.open = -1; sfx("tick"); renderData(root); } else openData(ni); } }; });
    if (F.ro) { if (F.onRendered) F.onRendered(root, F.idx); return; }
    $("ds-go-xp").onclick = () => openExpansion("disk");
    $("ds-go-dr").onclick = () => openExpansion("dmg");
    root.querySelectorAll("[data-m]").forEach((b) => {
      b.onclick = () => {
        setLegacyIdx(F.idx);
        try { applyFusionMaterial(b.dataset.m); } catch (e) { console.warn(e); }
        try { if (typeof saveEconomyAndUpgrades === "function") saveEconomyAndUpgrades(); } catch (e) {}
        const m = $("fusion-status-msg"); const txt = m ? m.textContent : "";
        renderFusion();
        const mm = $("ds-msg"); if (mm) mm.textContent = txt;
      };
    });
    fillCosts(f);
  }

  function fillCosts(f) {
    const n = (x) => Number(x || 0).toLocaleString("en-US");
    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    try {
      set("ds-c-rm", f.level >= 5 ? tt("ds.use_carm", "Lv5: use Carmonite") : `1🟦 + ${n(typeof getLvUpCoinCost === "function" ? getLvUpCoinCost(f) : 2500)}🪙`);
      set("ds-c-carm", f.level >= 10 ? "MAX" : (f.level < 5 ? tt("ds.from_lv5", "a partir do Lv5") : `${CARMONITE_COST_BY_RARITY[f.rarity] || 100}🟣 + ${n(typeof getCarmoniteCoinCost === "function" ? getCarmoniteCoinCost(f) : 0)}🪙`));
      set("ds-c-cube", f.clv >= 10 ? "MAX" : `${typeof getClvCubeCost === "function" ? getClvCubeCost(f) : 1}🟩 + ${n(typeof getClvCoinCost === "function" ? getClvCoinCost(f) : 0)}🪙`);
      set("ds-c-ing", `${n(typeof userIngots !== "undefined" ? userIngots : 0)}🟨`);
      const mat = $("ds-mat");
      if (mat) mat.innerHTML = `<span style="color:#fde047">🪙 ${n(typeof userCoins !== "undefined" ? userCoins : 0)}</span><span style="color:#38bdf8">🟦 ${n(typeof userRareMetalItems !== "undefined" ? userRareMetalItems : 0)}</span><span style="color:#c084fc">🟣 ${n(typeof userCarmonite !== "undefined" ? userCarmonite : 0)}</span><span style="color:#4ade80">🟩 ${n(state && state.chainCubes)}</span><span style="color:#facc15">🟨 ${n(typeof userIngots !== "undefined" ? userIngots : 0)}</span>`;
    } catch (e) {}
  }

  // ------------------------------------------------ Disk Expansion / Damage Reallocation
  function openExpansion(mode) {
    const f = FIGURES_DB[F.idx];
    ensureFigureUpgradeMetadata(f);
    const sel = Math.max(0, f.wheel.findIndex((w) => w.color !== "red"));
    F.xp = { mode, sizes: f.wheel.map((w) => w.size), clv: f.wheel.map((w, k) => (f.clvAlloc && f.clvAlloc[k]) || 0), sel, rot: rotToBottom(f.wheel, sel), target: rotToBottom(f.wheel, sel), msg: "" };
    F.view = "xp"; sfx("tick");
    renderFusion();
  }
  function xpBase(f) { return f.baseWheelLv1.map((w) => w.size); }
  function xpSpent(f) { const b = xpBase(f); return F.xp.sizes.reduce((a, s, k) => a + Math.max(0, s - b[k]), 0); }
  function xpMax(f) { return Math.max(0, Math.min(9, (f.level || 1) - 1)); }
  function clvMax(f) { return Math.min(10, f.clv || 0); }
  function clvSpent() { return F.xp.clv.reduce((a, v) => a + v, 0); }

  function xpPlus(f) {
    const x = F.xp, k = x.sel, s = f.wheel[k];
    if (x.mode === "dmg") {
      if (!(s.color === "white" || s.color === "gold")) return tt("ds.dmg_only_wg", "Dano só pode ir para Ataques Brancos ou Dourados.");
      if (clvSpent() >= clvMax(f)) return f.clv >= 10 ? tt("ds.clv_max", "CLv no máximo (10).") : tt("ds.need_clv", "Sem pontos de CLv. Suba o CLv com 🟩 Cubes.");
      x.clv[k]++; return "";
    }
    if (s.color === "red") return tt("ds.no_miss", "Miss não pode ser expandido.");
    if (xpSpent(f) >= xpMax(f)) return (f.level || 1) >= 10 ? tt("ds.disk_max", "Todos os pontos de disco já foram usados (Lv10).") : tt("ds.need_lv", "Sem pontos. Suba o Lv da figura para ganhar Disk Points.");
    const b = xpBase(f);
    // doador: Miss primeiro, depois a maior fatia (>4) que não seja a selecionada
    let d = -1;
    x.sizes.forEach((sz, j) => { if (j !== k && f.wheel[j].color === "red" && sz > 4 && (d < 0 || sz > x.sizes[d])) d = j; });
    if (d < 0) x.sizes.forEach((sz, j) => { if (j !== k && sz > 4 && sz <= b[j] && (d < 0 || sz > x.sizes[d])) d = j; });
    if (d < 0) return tt("ds.no_donor", "Nenhuma fatia pode diminuir (mínimo 4).");
    x.sizes[d]--; x.sizes[k]++; return "";
  }
  function xpMinus(f) {
    const x = F.xp, k = x.sel, b = xpBase(f);
    if (x.mode === "dmg") { if (x.clv[k] <= 0) return ""; x.clv[k]--; return ""; }
    if (x.sizes[k] <= b[k]) return "";
    // devolve para a fatia que mais perdeu
    let d = -1;
    x.sizes.forEach((sz, j) => { if (j !== k && sz < b[j] && (d < 0 || (b[j] - sz) > (b[d] - x.sizes[d]))) d = j; });
    if (d < 0) return "";
    x.sizes[k]--; x.sizes[d]++; return "";
  }
  function xpRecommended(f) {
    const x = F.xp;
    const score = (w) => w.color === "purple" ? 60 + (w.stars || 1) * 30 : (w.color === "gold" ? (w.dmg || 0) * 1.4 : (w.color === "white" ? (w.dmg || 0) : (w.color === "blue" ? 35 : -1)));
    let best = 0; f.wheel.forEach((w, k) => { if (score(w) > score(f.wheel[best])) best = k; });
    if (x.mode === "dmg") {
      x.clv = f.wheel.map(() => 0);
      let wg = -1; f.wheel.forEach((w, k) => { if ((w.color === "white" || w.color === "gold") && (wg < 0 || (w.dmg || 0) * w.size > (f.wheel[wg].dmg || 0) * f.wheel[wg].size)) wg = k; });
      if (wg >= 0) { x.clv[wg] = clvMax(f); x.sel = wg; }
    } else {
      x.sizes = xpBase(f).slice(); x.sel = best;
      let guard = 20; while (guard-- > 0 && !xpPlus(f)) {}
    }
    x.target = rotToBottom(f.wheel.map((w, k) => ({ size: x.sizes[k] })), x.sel);
  }

  function renderExpansion(root) {
    const f = FIGURES_DB[F.idx], x = F.xp;
    const isDmg = x.mode === "dmg";
    const left = isDmg ? clvMax(f) - clvSpent() : xpMax(f) - xpSpent(f);
    const s = f.wheel[x.sel];
    root.innerHTML = `
      <div class="ds-title"><button class="ds-back" id="ds-xback">‹ Data</button><span>${isDmg ? "Damage Reallocation" : "Disk Expansion"}</span></div>
      <div class="ds-head">
        <img src="${spriteOf(f.spriteKey)}" alt="">
        <div><div style="font-size:10px;color:#94a3b8;font-weight:800">ID ${f.officialDuelId != null ? f.officialDuelId : F.idx + 1}</div>
          <div style="font-size:16px;font-weight:900">${esc(f.name)}</div>
          <div class="ds-bar ${isDmg ? "c" : ""}" style="margin:3px 0 0"><i style="width:${isDmg ? (f.clv || 0) * 10 : (f.level || 1) * 10}%"></i><b>${isDmg ? "CLv" + (f.clv || 0) : "Lv" + (f.level || 1)}</b><em>${isDmg ? (f.clv || 0) : (f.level || 1)}/10</em></div></div>
        <button class="ds-btn" id="ds-xreset" style="padding:6px 8px;font-size:11px">Reset</button>
      </div>
      <div class="ds-tabs"><button class="ds-chip ${!isDmg ? "on" : ""}" id="ds-t-disk">Disk Expansion</button><button class="ds-chip ${isDmg ? "on" : ""}" id="ds-t-dmg">Damage Reallocation</button></div>
      <div style="position:relative;width:92%;margin:0 auto"><canvas id="ds-xwheel" style="width:100%;aspect-ratio:1;display:block;cursor:pointer"></canvas></div>
      <div class="ds-slicename" id="ds-xname">${esc(moveName(s.name))}</div>
      <div class="ds-pts">${isDmg ? tt("ds.clv_pts", "Pontos de dano livres") : tt("ds.disk_pts", "Disk Points livres")}: ${left}</div>
      <div class="ds-btns" style="grid-template-columns:1.2fr 1fr 1fr;margin-top:4px">
        <button class="ds-btn cy" id="ds-xrec" style="font-size:11px">Recommended</button>
        <button class="ds-btn cy" id="ds-xplus" style="font-size:20px;padding:4px">+</button>
        <button class="ds-btn" id="ds-xminus" style="font-size:20px;padding:4px">−</button>
      </div>
      <div style="display:flex;justify-content:center;margin-top:10px"><button class="ds-btn gold" id="ds-xok" style="width:62%">Confirm</button></div>
      <div class="ds-msg" id="ds-xmsg">${esc(x.msg || "")}</div>`;
    const cv = $("ds-xwheel");
    const segsNow = () => displaySegs(f, x.sizes, x.clv);
    let raf = 0;
    const paint = () => {
      const d = x.target - x.rot;
      x.rot += Math.abs(d) < 0.002 ? d : d * 0.22;
      const sg = segsNow();
      drawWheel(cv, sg, { rot: x.rot, hi: x.sel, bottomPin: true, border: f.rarity === "UX" ? "#c084fc" : "#38bdf8",
        center: String(left), centerSub: isDmg ? "DMG pts" : "Disk pts" });
      if (Math.abs(x.target - x.rot) > 0.002 && document.body.contains(cv)) raf = requestAnimationFrame(paint);
    };
    requestAnimationFrame(paint);
    const rerender = (m) => { x.msg = m || ""; cancelAnimationFrame(raf); renderExpansion(root); };
    const pickSel = (k) => {
      x.sel = k;
      const sg = f.wheel.map((w, j) => ({ size: x.sizes[j] }));
      let tg = rotToBottom(sg, k);
      while (tg - x.rot > Math.PI) tg -= Math.PI * 2;
      while (x.rot - tg > Math.PI) tg += Math.PI * 2;
      x.target = tg;
    };
    cv.onclick = (ev) => { const k = sliceAtPoint(cv, segsNow(), ev, x.rot); if (k >= 0) { sfx("tick"); pickSel(k); rerender(); } };
    $("ds-xback").onclick = () => { F.view = "data"; sfx("tick"); renderFusion(); };
    $("ds-t-disk").onclick = () => { if (isDmg) openExpansion("disk"); };
    $("ds-t-dmg").onclick = () => { if (!isDmg) openExpansion("dmg"); };
    $("ds-xplus").onclick = () => { const m = xpPlus(f); sfx(m ? "hit" : "portal"); pickSel(x.sel); rerender(m); };
    $("ds-xminus").onclick = () => { const m = xpMinus(f); sfx("tick"); pickSel(x.sel); rerender(m); };
    $("ds-xrec").onclick = () => { xpRecommended(f); sfx("portal"); pickSel(x.sel); rerender(tt("ds.rec_done", "Distribuição recomendada aplicada. Toque Confirm para salvar.")); };
    $("ds-xreset").onclick = () => {
      if (isDmg) x.clv = f.wheel.map(() => 0); else x.sizes = xpBase(f).slice();
      if (!(window.PDRSound && PDRSound.play("reset"))) sfx("tick"); pickSel(x.sel); rerender(tt("ds.reset_done", "Voltou ao disco base. Toque Confirm para salvar."));
    };
    $("ds-xok").onclick = () => {
      if (isDmg) f.clvAlloc = x.clv.slice();
      else { x.sizes.forEach((sz, k) => { f.wheel[k].size = sz; }); f.diskPointsSpent = xpSpent(f); }
      try { if (typeof saveEconomyAndUpgrades === "function") saveEconomyAndUpgrades(); } catch (e) {}
      try { if (typeof demoFullMatchState === "function" && !(state && state.phase === "playing")) {} } catch (e) {}
 if (window.PDRSound && PDRSound.play("fusion_set")) {} else sfx("level_up");
      rerender("✅ " + tt("ds.saved", "Salvo!"));
    };
  }

  // Substitui a renderização antiga da aba (as funções de economia continuam as mesmas)
  const _oldRenderFusion = window.renderFusionChamber || (typeof renderFusionChamber === "function" ? renderFusionChamber : null);
  function newRenderFusion() {
    try { if (_oldRenderFusion && $("fusion-target-select")) _oldRenderFusion(); } catch (e) {}
    renderFusion();
  }
  try { renderFusionChamber = newRenderFusion; } catch (e) {}
  window.renderFusionChamber = newRenderFusion;
  // "Abrir na Fusão" a partir dos detalhes da figura
  const _oldOpenFusionFor = typeof openFusionForDetailedFig === "function" ? openFusionForDetailedFig : null;
  if (_oldOpenFusionFor) {
    const nf = function () {
      const i = (typeof currentDetailedFigIdx === "number") ? currentDetailedFigIdx : 0;
      _oldOpenFusionFor.apply(this, arguments);
      openData(i);
    };
    try { openFusionForDetailedFig = nf; } catch (e) {}
    window.openFusionForDetailedFig = nf;
  }

  // ============================================================= 2. EVOLVE?
  function nextEvoName(unit) {
    // Mesmo cálculo do evolveUnitInMatch
    const targetName = unit.deckTargetName;
    const fam = (typeof POKEMON_EVOLUTION_FAMILIES !== "undefined")
      ? POKEMON_EVOLUTION_FAMILIES.find((fm) => (targetName && fm.some((n) => norm(n) === norm(targetName))) || fm.some((n) => norm(n) === norm(unit.name))) : null;
    let chain = fam || unit.evoChain || [unit.name];
    if (fam && targetName) { const ti = fam.findIndex((n) => norm(n) === norm(targetName)); if (ti !== -1 && ti < fam.length - 1) chain = fam.slice(0, ti + 1); }
    const c = chain.findIndex((n) => norm(n) === norm(unit.name));
    return (c === -1 || c >= chain.length - 1) ? null : chain[c + 1];
  }
  function unitWheelPreview(unit) {
    try { if (typeof getActiveWheel === "function") { const w = getActiveWheel(unit); if (Array.isArray(w) && w.length && !w[0].isZMove) return w.map((s) => Object.assign({}, s, { name: moveName(s.name) })); } } catch (e) {}
    const f = FIGURES_DB[unit.baseIdx]; return f ? displaySegs(f, null, f.clvAlloc) : [];
  }
  function previewAfterEvo(unit, nextName) {
    const nf = (typeof findFigureByName === "function") ? findFigureByName(nextName) : null;
    if (!nf) return null;
    const isMega = nextName.indexOf("Mega ") === 0;
    const ghost = Object.assign({}, unit, {
      baseIdx: figIdx(nf), baseId: nf.id, name: nf.name, spriteKey: nf.spriteKey, type: nf.type, rarity: nf.rarity,
      condition: (typeof PokemonCondition !== "undefined") ? PokemonCondition.Normal : unit.condition,
      evoStage: isMega ? (unit.evoStage || 0) : (unit.evoStage || 0) + 1, megaTurns: isMega ? 5 : 0
    });
    const wBonus = (typeof hasWeeklyTypeBuff === "function" && hasWeeklyTypeBuff(nf)) ? 1 : 0;
    ghost.mp = isMega ? Math.min(3, (nf.mp || 1) + wBonus + 1) : (nf.mp || 1) + wBonus;
    const saveArmed = state.zMoveArmed; state.zMoveArmed = false;
    let segs; try { segs = unitWheelPreview(ghost); } finally { state.zMoveArmed = saveArmed; }
    return { nf, ghost, segs, isMega };
  }
  function abilityName(fig) { return fig && fig.officialAbility ? fig.officialAbility.n : "—"; }

  function showEvolvePrompt(unit) {
    const nextName = nextEvoName(unit);
    const pv = nextName && previewAfterEvo(unit, nextName);
    if (!pv) return false;
    injectCss();
    const old = $("evolution-prompt-modal"); if (old) old.style.display = "none";
    let m = $("ds-evo-modal"); if (m) m.remove();
    const cf = FIGURES_DB[unit.baseIdx] || {};
    const curSegs = (() => { const s = state.zMoveArmed; state.zMoveArmed = false; try { return unitWheelPreview(unit); } finally { state.zMoveArmed = s; } })();
    const stage = (unit.evoStage || 0) + (pv.isMega ? 0 : 1);
    const notes = pv.isMega
      ? [tt("ds.evo_mega1", "*A Mega Evolução dura 5 turnos e depois volta à forma anterior."), tt("ds.evo_mega2", "*Mega: +1 MP enquanto durar."), tt("ds.evo_note3", "*Uma evolução não pode ser desfeita depois de feita.")]
      : [tt("ds.evo_note1", "*Cada evolução dá +10 de dano e ★+1."), tt("ds.evo_note2", "*Se não evoluir agora, precisará cumprir as condições de novo."), tt("ds.evo_note3", "*Uma evolução não pode ser desfeita depois de feita."), tt("ds.evo_note4", "*Condições especiais e marcadores são removidos ao evoluir.")];
    m = document.createElement("div"); m.id = "ds-evo-modal"; m.className = "ds-modal";
    m.innerHTML = `<div class="ds-panel">
      <div class="ds-evrow"><div class="side">${tt("ds.ability", "Habilidade")}<div class="ab">${esc(abilityName(cf))}</div><div style="margin-top:6px">Status</div></div>
        <div><div class="nm">${esc(unit.name)}</div><div style="display:flex;gap:5px;margin-top:5px">${rarHtml(unit.rarity || cf.rarity)}${mpHtml(unit.mp)}</div></div>
        <canvas id="ds-evo-a"></canvas></div>
      <div class="ds-chev">︾</div>
      <div class="ds-evrow" style="border-color:#334155"><div class="side">${tt("ds.ability", "Habilidade")}<div class="ab">${esc(abilityName(pv.nf))}</div><div style="margin-top:6px">Status</div></div>
        <div><div class="nm">${esc(pv.nf.name)}</div><div style="display:flex;gap:5px;margin-top:5px">${rarHtml(pv.nf.rarity)}${mpHtml(pv.ghost.mp)}</div>
          <div style="display:inline-block;margin-top:5px;background:#38bdf8;color:#082f49;font-size:9px;font-weight:900;border-radius:4px;padding:1px 6px">${pv.isMega ? "MEGA · 5 " + tt("ds.turns", "turnos") : "Stage " + stage}</div></div>
        <canvas id="ds-evo-b"></canvas></div>
      <div class="ds-ask">${pv.isMega ? tt("ds.mega_q", "Mega Evoluir?") : tt("ds.evolve_q", "Evoluir?")}</div>
      <div class="ds-note">${notes.map(esc).join("<br>")}</div>
      <div class="ds-yn"><button id="ds-evo-yes">${tt("ds.yes", "Sim")}</button><button id="ds-evo-no">${tt("ds.no", "Não")}</button></div>
    </div>`;
    document.body.appendChild(m);
    requestAnimationFrame(() => {
      drawWheel($("ds-evo-a"), curSegs, { border: "#64748b" });
      drawWheel($("ds-evo-b"), pv.segs, { border: "#facc15" });
    });
    const close = (yes) => { m.remove(); if (typeof resolveEvolutionPrompt === "function") resolveEvolutionPrompt(yes); };
    $("ds-evo-yes").onclick = () => close(true);
    $("ds-evo-no").onclick = () => close(false);
    sfx("portal");
    return true;
  }
  if (typeof evolveUnitInMatch === "function") {
    const _v704Evolve = evolveUnitInMatch;
    const wrapped = function (unit) {
      const r = _v704Evolve.apply(this, arguments);
      const mEl = $("evolution-prompt-modal");
      if (unit && mEl && mEl.style.display === "flex" && typeof pendingEvoUnit !== "undefined" && pendingEvoUnit === unit) {
        mEl.style.display = "none";
        const t0 = Date.now();
        const waitShow = () => {
          const ov = $("wheel-overlay");
          if (ov && ov.classList.contains("show") && Date.now() - t0 < 8000) return setTimeout(waitShow, 120);
          if (pendingEvoUnit !== unit) return;
          try { if (!showEvolvePrompt(unit)) mEl.style.display = "flex"; } catch (e) { console.warn("[evolve modal]", e); mEl.style.display = "flex"; }
        };
        waitShow();
      }
      return r;
    };
    try { evolveUnitInMatch = wrapped; } catch (e) {}
    window.evolveUnitInMatch = wrapped;
  }

  // ============================================================= 3. Z-MOVE
  // Z-Moves oficiais da figura (até 2). Cai no Z genérico por tipo se a figura não tiver dados.
  function zMovesOf(unit) {
    const f = unit && FIGURES_DB[unit.baseIdx];
    const ex = extraOf(f);
    if (ex && ex.z && ex.z.length) {
      return ex.z.map((z) => ({ name: z.n, color: z.c === "gold" ? "gold" : (z.c === "purple" ? "purple" : (z.c === "blue" ? "blue" : "white")),
        dmg: z.d || 0, stars: z.c === "purple" ? (z.s || 4) : 0, effect: z.c === "purple" ? (z.e || "none") : undefined, text: z.t || "" }));
    }
    const g = (typeof window.__v704BaseZ === "function") ? window.__v704BaseZ(unit) : null;
    return g ? [Object.assign({ text: "" }, g)] : [];
  }
  window.pdrZMovesOf = zMovesOf;
  if (typeof getFigureZMove === "function") {
    window.__v704BaseZ = getFigureZMove;
    const nz = function (unit) {
      const ch = state && state.zMoveChoice;
      const list = zMovesOf(unit);
      if (ch && unit && ch.uid === unit.uid && list[ch.idx]) return list[ch.idx];
      if (list.length) {
        if (unit && unit.owner !== "p1" && list.length > 1) {
          // Bot: escolhe o Z de maior valor
          return list.slice().sort((a, b) => ((b.dmg || 0) + (b.stars || 0) * 45) - ((a.dmg || 0) + (a.stars || 0) * 45))[0];
        }
        return list[0];
      }
      return window.__v704BaseZ(unit);
    };
    try { getFigureZMove = nz; } catch (e) {}
    window.getFigureZMove = nz;
  }
  // Com escolha feita, só a peça escolhida usa o Z-Move
  if (typeof getActiveWheel === "function") {
    const _v704Gaw = getActiveWheel;
    const g2 = function (unit) {
      const ch = state && state.zMoveChoice;
      if (ch && state.zMoveArmed && unit && unit.owner === "p1" && unit.uid !== ch.uid) {
        state.zMoveArmed = false;
        try { return _v704Gaw.apply(this, arguments); } finally { state.zMoveArmed = true; }
      }
      return _v704Gaw.apply(this, arguments);
    };
    try { getActiveWheel = g2; } catch (e) {}
  }
  if (typeof triggerCombat === "function") {
    const _v704Trig = triggerCombat;
    const tc = function (atkUnit) {
      const ch = state && state.zMoveChoice;
      if (ch && state.zMoveArmed && atkUnit && atkUnit.owner === "p1" && atkUnit.uid !== ch.uid) {
        state.zMoveArmed = false;
        try { return _v704Trig.apply(this, arguments); } finally { if (!state.zMoveUsedP1) state.zMoveArmed = true; }
      }
      const r = _v704Trig.apply(this, arguments);
      if (state.zMoveUsedP1 && ch) state.zMoveChoice = null;
      return r;
    };
    try { triggerCombat = tc; } catch (e) {}
    window.triggerCombat = tc;
  }

  function zSeg(z) { return [{ name: z.name, color: z.color, dmg: z.dmg || 0, stars: z.stars || 0, size: 96 }]; }
  function showZPicker() {
    injectCss();
    let m = $("ds-z-modal"); if (m) m.remove();
    const bottom = (typeof getBottomRole === "function") ? getBottomRole() : "p1";
    const mine = state.units.filter((u) => u.owner === bottom && (u.location === "board" || u.location === "bench") && zMovesOf(u).length);
    if (!mine.length) { if (typeof setLogText === "function") setLogText(tt("ds.z_none", "⚡ Nenhuma peça sua em campo ou no banco pode usar Z-Move.")); return; }
    const selUid = state.selectedUnitId || (state.zMoveChoice && state.zMoveChoice.uid);
    let cur = mine.find((u) => u.uid === selUid) || mine.find((u) => u.location === "board") || mine[0];
    let pick = (state.zMoveChoice && state.zMoveChoice.uid === cur.uid) ? state.zMoveChoice.idx : 0;
    m = document.createElement("div"); m.id = "ds-z-modal"; m.className = "ds-modal";
    const paint = () => {
      const list = zMovesOf(cur);
      if (pick >= list.length) pick = 0;
      m.innerHTML = `<div class="ds-panel" style="border-color:#7c3aed">
        <div style="text-align:center;font-weight:900;font-size:16px;color:#fde047;margin:2px 0 6px">⚡ Z-Move</div>
        ${mine.length > 1 ? `<div class="ds-zunits">${mine.map((u) => `<div data-u="${esc(u.uid)}" class="${u === cur ? "on" : ""}"><img src="${spriteOf(u.spriteKey)}" alt="">${esc(u.name)}</div>`).join("")}</div>` : ""}
        <div style="font-size:12px;font-weight:900;margin-bottom:5px">${esc(cur.name)} ${list.length > 1 ? `<span style="font-size:10px;color:#c4b5fd">· ${tt("ds.z_choose", "escolha o Z-Move")}</span>` : ""}</div>
        ${list.map((z, k) => `<div class="ds-zopt ${k === pick ? "on" : ""}" data-k="${k}"><canvas data-c="${k}"></canvas>
          <div><b>${esc(z.name)}</b> <span style="font-size:10px;color:#c4b5fd">${z.color === "purple" ? "★".repeat(z.stars || 4) : (z.dmg ? z.dmg + " " + tt("ds.dmg", "dano") : "")}</span>
          <p>${esc(z.text || (z.color === "purple" ? tt("ds.purple_desc", "Ataque Roxo.") : tt("ds.z_generic", "A roleta inteira vira este ataque.")))}</p></div></div>`).join("")}
        <div class="ds-note" style="color:#e9d5ff">${tt("ds.z_note1", "*Na próxima batalha desta peça, a roleta inteira vira o Z-Move.")}<br>${tt("ds.z_note2", "*O Z-Move quebra as Defesas (azul) do oponente.")}<br>${tt("ds.z_note3", "*Só pode ser usado 1 vez por duelo.")}</div>
        <div class="ds-ask" style="font-size:18px">${state.zMoveArmed && state.zMoveChoice ? tt("ds.z_change", "Trocar o Z-Move?") : tt("ds.z_q", "Ativar o Z-Move?")}</div>
        <div class="ds-yn"><button id="ds-z-yes">${tt("ds.yes", "Sim")}</button><button id="ds-z-no">${state.zMoveArmed ? tt("ds.z_off", "Desarmar") : tt("ds.no", "Não")}</button></div>
      </div>`;
      requestAnimationFrame(() => m.querySelectorAll("canvas[data-c]").forEach((c) => drawWheel(c, zSeg(list[+c.dataset.c]), { border: "#c084fc" })));
      m.querySelectorAll("[data-u]").forEach((d) => { d.onclick = () => { cur = mine.find((u) => String(u.uid) === d.dataset.u) || cur; pick = 0; sfx("tick"); paint(); }; });
      m.querySelectorAll(".ds-zopt").forEach((d) => { d.onclick = () => { pick = +d.dataset.k; sfx("tick"); paint(); }; });
      m.querySelector("#ds-z-yes").onclick = () => {
        state.zMoveChoice = { uid: cur.uid, idx: pick };
        if (window.PDRSound) PDRSound.play("buff");
        if (!state.zMoveArmed) { m.remove(); _oldToggleZ(); } else { m.remove(); renderPlatesSafe(); }
        const z = zMovesOf(cur)[pick];
        if (typeof setLogText === "function" && z) setLogText(`⚡ Z-MOVE ${z.name} ${tt("ds.z_armed_for", "armado para")} ${cur.name}! ${tt("ds.z_attack_hint", "Ataque com ela para usar.")}`);
      };
      m.querySelector("#ds-z-no").onclick = () => { m.remove(); if (state.zMoveArmed) { state.zMoveChoice = null; _oldToggleZ(); } };
    };
    document.body.appendChild(m);
    paint();
    m.addEventListener("click", (e) => { if (e.target === m) m.remove(); });
    sfx("portal");
  }
  function renderPlatesSafe() { try { if (typeof renderPlatesTray === "function") renderPlatesTray(); } catch (e) {} }
  const _oldToggleZ = (typeof toggleZMoveFromTray === "function") ? toggleZMoveFromTray : function () {};
  const newToggleZ = function () {
    if (state.zMoveUsedP1 || Math.min(100, state.zGaugeP1 || 0) < 100) return _oldToggleZ.apply(this, arguments);
    showZPicker();
  };
  try { toggleZMoveFromTray = newToggleZ; } catch (e) {}
  window.toggleZMoveFromTray = newToggleZ;
  // Zera a escolha quando a partida reinicia
  if (typeof demoFullMatchState === "function") {
    const _r = demoFullMatchState;
    const rr = function () { const o = _r.apply(this, arguments); if (state) state.zMoveChoice = null; return o; };
    try { demoFullMatchState = rr; } catch (e) {}
  }

  // ============================================================= 4. ANIMAÇÃO DE ATAQUE
  const TYPE_COL = { Fire: "#f97316", Water: "#38bdf8", Electric: "#facc15", Grass: "#4ade80", Ice: "#a5f3fc", Fighting: "#ef4444", Poison: "#a855f7",
    Ground: "#d97706", Flying: "#93c5fd", Psychic: "#ec4899", Bug: "#84cc16", Rock: "#a8a29e", Ghost: "#7c3aed", Dragon: "#6366f1", Dark: "#475569",
    Steel: "#94a3b8", Fairy: "#f9a8d4", Normal: "#e5e7eb" };
  function typeCol(tp) { const k = String(tp || "Normal").split(/[\/,]/)[0].trim(); return TYPE_COL[k] || "#e5e7eb"; }
  function overlayPt(lx, ly) {
    const c = $("datadisk-canvas");
    if (!c) return { x: innerWidth / 2, y: innerHeight / 2 };
    const r = c.getBoundingClientRect();
    return { x: r.left + lx / 353 * r.width, y: r.top + ly / 530 * r.height, s: r.width / 353 };
  }
  function animEnabled() { try { return !(window.Juice && Juice.cfg && Juice.cfg.reduced) && !(state && state.aiFastSim); } catch (e) { return true; } }
  const ATK_MS = 900;
  function playAttack(info, done) {
    injectCss();
    const { winUnit, loser, winSpin } = info;
    const bottom = (typeof getBottomRole === "function") ? getBottomRole() : "p1";
    const wMine = winUnit.owner === bottom;
    const A = wMine ? overlayPt(133, 384) : overlayPt(220, 146);
    const B = wMine ? overlayPt(220, 146) : overlayPt(133, 384);
    const sc = Math.max(0.7, Math.min(1.6, A.s || 1));
    const layer = document.createElement("div"); layer.className = "ds-atk";
    const dim = document.createElement("div"); dim.className = "dim"; layer.appendChild(dim);
    const mk = (u, p, mine) => {
      const im = document.createElement("img"); im.className = "fig";
      const back = AUTHENTIC_FIG_SPRITES && AUTHENTIC_FIG_SPRITES[u.spriteKey + "_back"];
      im.src = (mine && back) ? back.uri : spriteOf(u.spriteKey);
      im.style.left = p.x + "px"; im.style.top = p.y + "px";
      im.style.width = im.style.height = 165 * sc + "px"; im.style.margin = (-82 * sc) + "px 0 0 " + (-82 * sc) + "px";
      layer.appendChild(im); return im;
    };
    const wi = mk(winUnit, A, wMine), li = mk(loser, B, !wMine);
    const col = (winSpin && winSpin.color === "purple") ? "#c084fc" : typeCol(winUnit.type);
    const dx = B.x - A.x, dy = B.y - A.y;
    document.body.appendChild(layer);
    const ease = "cubic-bezier(.2,.8,.2,1)";
    dim.animate([{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: ATK_MS + 250, fill: "forwards" });
    [wi, li].forEach((el, k) => el.animate([{ opacity: 0, transform: `scale(.4) translateY(${k ? -20 : 20}px)` }, { opacity: 1, transform: "scale(1)" }], { duration: 180, easing: ease, fill: "forwards" }));
    try { if (window.PDRSoundBattle) setTimeout(() => PDRSoundBattle.launch(info), 170); } catch (e) {}
    const physical = winSpin && (winSpin.color === "white" || winSpin.color === "gold") && (winSpin.dmg || 0) > 0 && /tackle|punch|claw|bite|slash|kick|crash|strike|fang|tail|smash|cut|scratch|charge|ram|blitz|fist|blade/i.test(winSpin.name || "");
    setTimeout(() => {
      // investida do vencedor
      wi.animate([{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${-dx * 0.08}px,${-dy * 0.08}px) scale(1.05)`, offset: 0.25 },
        { transform: `translate(${dx * (physical ? 0.62 : 0.22)}px,${dy * (physical ? 0.62 : 0.22)}px) scale(1.12)`, offset: 0.6 }, { transform: "translate(0,0) scale(1)" }],
        { duration: 520, easing: "ease-in-out", fill: "forwards" });
      if (!physical) {
        // projétil
        const orb = document.createElement("div"); orb.className = "orb";
        orb.style.background = `radial-gradient(circle,#fff 0%,${col} 45%,transparent 72%)`; orb.style.boxShadow = `0 0 26px 10px ${col}`;
        orb.style.left = A.x + "px"; orb.style.top = A.y + "px"; layer.appendChild(orb);
        orb.animate([{ transform: "translate(0,0) scale(.3)", opacity: 0 }, { transform: `translate(${dx * 0.1}px,${dy * 0.1}px) scale(1)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${dx}px,${dy}px) scale(1.5)`, opacity: 1 }], { duration: 360, delay: 160, easing: "ease-in", fill: "forwards" });
        for (let i = 1; i <= 5; i++) {
          const tr = document.createElement("div"); tr.className = "orb";
          tr.style.background = `radial-gradient(circle,${col} 0%,transparent 70%)`; tr.style.left = A.x + "px"; tr.style.top = A.y + "px"; tr.style.opacity = 0;
          layer.appendChild(tr);
          tr.animate([{ transform: "translate(0,0) scale(.2)", opacity: 0 }, { transform: `translate(${dx * 0.1}px,${dy * 0.1}px) scale(${1 - i * 0.13})`, opacity: 0.6, offset: 0.2 },
            { transform: `translate(${dx}px,${dy}px) scale(${1.2 - i * 0.15})`, opacity: 0 }], { duration: 360, delay: 160 + i * 28, easing: "ease-in", fill: "forwards" });
        }
      }
    }, 170);
    const hitAt = physical ? 170 + 330 : 170 + 520;
    setTimeout(() => {
      const sl = document.createElement("div"); sl.className = "slash";
      sl.style.left = B.x + "px"; sl.style.top = B.y + "px"; sl.style.boxShadow = `0 0 18px 6px ${col}`;
      layer.appendChild(sl);
      sl.animate([{ transform: "rotate(-35deg) scaleX(.1)", opacity: 1 }, { transform: "rotate(-35deg) scaleX(1.3)", opacity: 1, offset: 0.5 }, { transform: "rotate(-35deg) scaleX(1.5)", opacity: 0 }], { duration: 260, fill: "forwards" });
      const kb = Math.hypot(dx, dy) || 1;
      li.animate([{ transform: "translate(0,0)", filter: "brightness(1)" }, { transform: `translate(${dx / kb * 26}px,${dy / kb * 26}px) rotate(${wMine ? 12 : -12}deg)`, filter: "brightness(3) saturate(0)", offset: 0.25 },
        { transform: `translate(${-dx / kb * 6}px,${-dy / kb * 6}px)`, filter: "brightness(1)", offset: 0.55 }, { transform: `translate(${dx / kb * 12}px,${dy / kb * 12}px)`, opacity: 0.9 }],
        { duration: 420, easing: "ease-out", fill: "forwards" });
      try { done(); } catch (e) { console.warn(e); }
    }, hitAt);
    setTimeout(() => {
      layer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" }).onfinish = () => layer.remove();
    }, ATK_MS + 60);
  }
  function hookJuice() {
    if (!window.Juice || Juice.__v704) return !!(window.Juice);
    const orig = Juice.onImpact;
    Juice.onImpact = function (info) {
      if (info && info.winUnit && info.loser && info.winSpin && animEnabled()) {
        window.__pdrAtkAnimMs = ATK_MS;
        try { playAttack(info, () => orig.call(Juice, info)); return; } catch (e) { console.warn("[atk anim]", e); }
      }
      window.__pdrAtkAnimMs = 0;
      return orig.apply(Juice, arguments);
    };
    Juice.__v704 = true;
    return true;
  }
  if (!hookJuice()) document.addEventListener("DOMContentLoaded", hookJuice);
  setTimeout(hookJuice, 1500);

  // Tela Data só informativa (sem Disk Expansion / Fundir), para a aba Deck
  function showDataReadOnly(root, idx, opts) {
    opts = opts || {};
    injectCss();
    F.ro = true; F.idx = idx; F.open = -1; F.onBack = opts.onBack; F.backLabel = opts.backLabel; F.extraHtml = opts.extraHtml || ""; F.onRendered = opts.onRendered;
    renderData(root);
  }
  window.PDRDuelScreens = { showDataReadOnly, openData, renderFusion, showEvolvePrompt, showZPicker, zMovesOf, drawWheel, injectCss, displaySegs };
})();
