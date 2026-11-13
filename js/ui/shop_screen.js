// ============================================================================
// v707 · Loja repaginada
//  - Recompensa diária em destaque (caixa brilhando + contagem regressiva) e Caixas de Vitória
//  - Caixas com a arte original dos boosters (gemas) + Caixa de Moedas
//  - Mercado Diário: 10 Pokémon sorteados por dia (mesma lista para o dia inteiro), com desconto e compra única
//  - Materiais de fusão (moedas) e a Troca por Material antiga (o card antigo é movido para cá)
// A economia é a antiga: buyShopBooster, buyWithCoins, claimDailyGems, openEarnedVictoryBox,
// unlockAndShowBoosterModal. Carrega depois de deck_screen.js.
// ============================================================================
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const tt = (k, fb) => (typeof t === "function" ? t(k, fb) : fb);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const n = (x) => Number(x || 0).toLocaleString("en-US");
  const sfx = (k) => { try { if (typeof playSfx === "function") playSfx(k); } catch (e) {} };
  const snd = (k) => { try { if (window.PDRSound) return PDRSound.play(k); } catch (e) {} return false; };
  const spriteOf = (key) => { const s = AUTHENTIC_FIG_SPRITES[key] || AUTHENTIC_FIG_SPRITES.pikachu; return s ? s.uri : ""; };
  const rarHtml = (r) => `<span class="ds-rar ${esc(r)}">${esc(r)}</span>`;
  const coins = () => (typeof userCoins !== "undefined" ? userCoins : 0);
  const gems = () => (state && state.rareMetals) || 0;
  const unlocked = (i) => (typeof isFigureUnlocked === "function" ? isFigureUnlocked(i) : false);
  const owned = (i) => (typeof getOwnedFigureUnits === "function" ? getOwnedFigureUnits(i) : 0);

  const css = `
  .sh-wallet{display:flex;gap:6px;justify-content:center;margin-bottom:8px}
  .sh-wallet span{background:#020617;border:1.5px solid #1e3a8a;border-radius:99px;padding:4px 10px;font-size:11.5px;font-weight:900}
  .sh-daily{position:relative;overflow:hidden;display:grid;grid-template-columns:96px 1fr;gap:10px;align-items:center;border-radius:14px;padding:10px 12px;
    background:radial-gradient(circle at 18% 40%,rgba(250,204,21,.35),transparent 55%),linear-gradient(135deg,#7c2d12,#a16207 45%,#422006);border:2px solid #fde047;box-shadow:0 0 22px rgba(250,204,21,.35)}
  .sh-daily.done{background:linear-gradient(135deg,#1e293b,#0f172a);border-color:#334155;box-shadow:none}
  .sh-daily .gift img{width:92px;height:auto;display:block;margin:0 auto}
  .sh-daily .gift{font-size:62px;text-align:center;filter:drop-shadow(0 6px 8px rgba(0,0,0,.6));animation:shBob 1.6s ease-in-out infinite}
  .sh-daily.done .gift{animation:none;filter:grayscale(.7) opacity(.7)}
  .sh-daily h3{margin:0;font-size:17px;font-weight:900;color:#fff;text-shadow:0 2px 3px rgba(0,0,0,.6)}
  .sh-daily .rw{display:flex;gap:5px;flex-wrap:wrap;margin:5px 0 7px}
  .sh-daily .rw span{background:rgba(0,0,0,.45);border-radius:6px;padding:2px 7px;font-size:11px;font-weight:900;color:#fef08a}
  .sh-daily button{width:100%;height:38px;border-radius:9px;border:2px solid #fef9c3;background:linear-gradient(180deg,#4ade80,#16a34a);color:#052e16;font-weight:900;font-size:15px;cursor:pointer;box-shadow:0 3px 0 #14532d;animation:shPulse 1.2s ease-in-out infinite}
  .sh-daily.done button{background:#1e293b;border-color:#475569;color:#94a3b8;box-shadow:none;animation:none}
  .sh-daily:before{content:"";position:absolute;inset:-40%;background:conic-gradient(from 0deg,transparent 0 20deg,rgba(255,255,255,.12) 30deg,transparent 40deg 110deg,rgba(255,255,255,.1) 120deg,transparent 130deg);animation:shSpin 9s linear infinite;pointer-events:none}
  .sh-daily.done:before{display:none}
  @keyframes shBob{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-6px) rotate(3deg)}}
  @keyframes shPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  @keyframes shSpin{to{transform:rotate(360deg)}}
  .sh-vbox{display:flex;align-items:center;gap:8px;background:linear-gradient(90deg,#1e3a8a,#0f172a);border:1.5px solid #3b82f6;border-radius:11px;padding:7px 10px;margin-top:7px}
  .sh-vbox img{width:44px;height:44px;object-fit:contain}
  .sh-vbox div{flex:1;font-size:11px;font-weight:800;color:#bfdbfe}.sh-vbox b{color:#fff;font-size:13px}
  .sh-vbox button{border-radius:8px;border:2px solid #bfdbfe;background:linear-gradient(180deg,#38bdf8,#0284c7);color:#082f49;font-weight:900;padding:6px 10px;cursor:pointer}
  .sh-vbox button:disabled{opacity:.45}
  .sh-boxes{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
  .sh-box{position:relative;border-radius:13px;padding:8px 6px 7px;text-align:center;cursor:pointer;overflow:hidden;border:2px solid var(--b);background:radial-gradient(circle at 50% 35%,var(--g),#0b1220 72%)}
  .sh-box:active{transform:scale(.97)}
  .sh-box img{width:86%;max-height:96px;object-fit:contain;filter:drop-shadow(0 8px 10px rgba(0,0,0,.6));transition:transform .2s}
  .sh-box:hover img{transform:translateY(-3px) rotate(-2deg)}
  .sh-box .nm{font-size:13px;font-weight:900;color:#fff;margin-top:2px}
  .sh-box .ds{font-size:9.5px;color:#cbd5e1;font-weight:700;min-height:24px;line-height:1.25}
  .sh-box .pr{margin-top:5px;border-radius:8px;padding:5px;font-weight:900;font-size:13px;color:#1c1917;background:linear-gradient(180deg,#fde047,#eab308);border:1.5px solid #fef9c3}
  .sh-box .pr.c{background:linear-gradient(180deg,#fef08a,#ca8a04)}
  .sh-box .tag{position:absolute;top:6px;right:-26px;transform:rotate(35deg);background:#ef4444;color:#fff;font-size:9px;font-weight:900;padding:2px 28px}
  .sh-mk-head{display:flex;justify-content:space-between;align-items:center;margin:12px 2px 5px}
  .sh-mk-head b{font-size:14px;font-weight:900;color:#fff}.sh-mk-head span{font-size:10.5px;font-weight:900;color:#fde047;background:#020617;border-radius:99px;padding:3px 9px;border:1px solid #854d0e}
  .sh-mk{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
  .sh-it{position:relative;background:radial-gradient(circle at 50% 30%,#1e3a5f,#0b1220 72%);border:1.5px solid #1e3a8a;border-radius:12px;padding:6px 6px 7px;text-align:center}
  .sh-it.UX{border-color:#e879f9;background:radial-gradient(circle at 50% 30%,#581c87,#0b1220 72%)}
  .sh-it.EX{border-color:#facc15;background:radial-gradient(circle at 50% 30%,#713f12,#0b1220 72%)}
  .sh-it img{width:76px;height:76px;object-fit:contain;filter:drop-shadow(0 4px 4px rgba(0,0,0,.6))}
  .sh-it .rb{position:absolute;top:5px;left:5px;transform:scale(.85);transform-origin:left top}
  .sh-it .off{position:absolute;top:5px;right:5px;background:#ef4444;color:#fff;font-size:10px;font-weight:900;border-radius:5px;padding:1px 5px}
  .sh-it .nw{position:absolute;top:28px;right:5px;background:#22c55e;color:#052e16;font-size:8.5px;font-weight:900;border-radius:4px;padding:0 4px}
  .sh-it .nm{font-size:11px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sh-it .ow{font-size:9px;color:#94a3b8;font-weight:800}
  .sh-it button{margin-top:4px;width:100%;border-radius:8px;border:1.5px solid #fef9c3;background:linear-gradient(180deg,#fde047,#eab308);color:#1c1917;font-weight:900;font-size:12px;padding:5px 3px;cursor:pointer}
  .sh-it button.gem{background:linear-gradient(180deg,#f472b6,#be185d);color:#fff;border-color:#fbcfe8}
  .sh-it button s{opacity:.6;font-size:9.5px;margin-right:3px}
  .sh-it.sold{opacity:.55}.sh-it.sold button{background:#1e293b;color:#94a3b8;border-color:#334155}
  .sh-mats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
  .sh-mat{background:#0b1220;border:1.5px solid #334155;border-radius:11px;padding:7px 4px;text-align:center;cursor:pointer}
  .sh-mat .ic{font-size:26px}.sh-mat .nm{font-size:10.5px;font-weight:900;color:#fff}.sh-mat .ds{font-size:8.5px;color:#94a3b8;min-height:22px}
  .sh-mat .pr{margin-top:3px;font-size:11px;font-weight:900;color:#fde047}
  .sh-toast{position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:420;max-width:90%;background:#0b1220;border:2px solid #facc15;color:#fff;border-radius:11px;padding:8px 12px;font-size:12px;font-weight:800;box-shadow:0 8px 22px rgba(0,0,0,.8);animation:shIn .25s ease-out}
  @keyframes shIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
  `;
  function injectCss() {
    if (window.PDRDuelScreens && PDRDuelScreens.injectCss) PDRDuelScreens.injectCss();
    if ($("sh-css")) return;
    const st = document.createElement("style"); st.id = "sh-css"; st.textContent = css; document.head.appendChild(st);
  }
  function toast(msg, color) {
    if (!msg) return;
    const old = $("sh-toast"); if (old) old.remove();
    const d = document.createElement("div"); d.id = "sh-toast"; d.className = "sh-toast"; d.textContent = msg;
    if (color) d.style.borderColor = color;
    document.body.appendChild(d);
    setTimeout(() => { if (d.parentNode) d.remove(); }, 3800);
  }
  const msgOf = (id) => { const e = $(id); return e ? e.textContent : ""; };

  // ---------------------------------------------------------------- Mercado Diário
  const MK_KEY = "pdr_daily_market_v707";
  const PRICE = { C: ["coin", 3000], UC: ["coin", 6000], R: ["coin", 14000], EX: ["gem", 150], UX: ["gem", 300] };
  function dayStr(d) { d = d || new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function seeded(seed) { let s = 0; for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function market() {
    const day = dayStr();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(MK_KEY) || "null"); } catch (e) {}
    if (saved && saved.day === day && Array.isArray(saved.items) && saved.items.length === 10) return saved;
    const rnd = seeded("pdr-" + day);
    const pool = FIGURES_DB.map((f, i) => ({ f, i })).filter((x) => x.f && x.f.wheel && x.f.wheel.length && !/^Shiny /.test(x.f.name));
    const W = { C: 30, UC: 28, R: 22, EX: 13, UX: 7 };
    const items = [], used = new Set();
    let guard = 0;
    while (items.length < 10 && guard++ < 5000) {
      // sorteio ponderado por raridade; 1 vaga garantida para EX/UX
      const wantHigh = items.length === 9 && !items.some((x) => ["EX", "UX"].includes(FIGURES_DB[x.i].rarity));
      const cand = pool[Math.floor(rnd() * pool.length)];
      if (!cand || used.has(cand.i)) continue;
      if (wantHigh && !["EX", "UX"].includes(cand.f.rarity)) continue;
      if (rnd() * 30 > (W[cand.f.rarity] || 10)) continue;
      used.add(cand.i);
      const off = [0, 0, 10, 20, 25, 30, 40, 50][Math.floor(rnd() * 8)];
      items.push({ i: cand.i, off, sold: false });
    }
    const m = { day, items };
    try { localStorage.setItem(MK_KEY, JSON.stringify(m)); } catch (e) {}
    return m;
  }
  function priceOf(it) {
    const f = FIGURES_DB[it.i]; const p = PRICE[f.rarity] || ["coin", 5000];
    const base = p[1], final = Math.max(1, Math.round(base * (100 - it.off) / 100 / (p[0] === "coin" ? 100 : 5)) * (p[0] === "coin" ? 100 : 5));
    return { cur: p[0], base, final };
  }
  function buyMarket(k) {
    const m = market(); const it = m.items[k]; if (!it || it.sold) return;
    const f = FIGURES_DB[it.i], pr = priceOf(it);
    if (pr.cur === "coin" ? coins() < pr.final : gems() < pr.final) {
      sfx("hit"); toast(`${pr.cur === "coin" ? "🪙" : "🔻"} ${tt("sh.no_money", "Saldo insuficiente")}: ${n(pr.final)}`, "#ef4444"); return;
    }
    if (pr.cur === "coin") userCoins -= pr.final; else state.rareMetals -= pr.final;
    it.sold = true;
    try { localStorage.setItem(MK_KEY, JSON.stringify(m)); } catch (e) {}
    try { saveEconomyAndUpgrades(); syncAllCurrencyLabels(); } catch (e) {}
    try { unlockAndShowBoosterModal(`🛒 ${tt("sh.market", "MERCADO DIÁRIO")}`, [it.i], `-${n(pr.final)} ${pr.cur === "coin" ? "🪙" : "🔻"}`); } catch (e) { console.warn(e); }
    snd("item_get");
    render();
  }
  function msToMidnight() { const d = new Date(), m = new Date(d); m.setHours(24, 0, 0, 0); return m - d; }
  function hms(ms) { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), mi = Math.floor((s % 3600) / 60), se = s % 60; return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:${String(se).padStart(2, "0")}`; }
  function dailyLeft() { const cd = 24 * 3600 * 1000; const last = (typeof lastDailyBonusTs !== "undefined" ? lastDailyBonusTs : 0) || 0; return Math.max(0, cd - (Date.now() - last)); }
  function victoryBoxes() {
    const e = $("shop-victory-boxes-lbl"); const m = e && e.textContent.match(/\d+/);
    return m ? +m[0] : 0;
  }

  // ---------------------------------------------------------------- montagem
  function mount() {
    const tab = $("dtab-shop");
    if (!tab) return null;
    let root = $("sh-root");
    if (!root) {
      injectCss();
      const legacy = document.createElement("div"); legacy.id = "sh-legacy"; legacy.style.display = "none";
      Array.from(tab.children).forEach((c) => legacy.appendChild(c));
      tab.appendChild(legacy);
      root = document.createElement("div"); root.id = "sh-root"; root.className = "ds-root";
      tab.insertBefore(root, legacy);
      // a Troca por Material antiga continua funcionando: move só o card dela para baixo da loja nova
      const grid = $("shop-material-grid");
      let card = grid; while (card && card.parentNode !== legacy && !(card.classList && card.classList.contains("card"))) card = card.parentNode;
      if (card && card !== legacy) { card.id = card.id || "sh-exchange-card"; card.style.display = "none"; tab.insertBefore(card, legacy); }
    }
    return root;
  }
  const BOXES = [
    { n: 1, name: "Single Booster", art: "green", g: "#14532d", b: "#22c55e", ds: tt("sh.b1", "1 figura + 50 Material"), price: 50 },
    { n: 2, name: "Double Booster", art: "blue", g: "#1e3a8a", b: "#3b82f6", ds: tt("sh.b2", "2 figuras + 100 Material"), price: 100 },
    { n: 4, name: "Quadruple Booster", art: "purple", g: "#581c87", b: "#a855f7", ds: tt("sh.b4", "4 figuras + 1 Cube extra"), price: 200, tag: tt("sh.popular", "POPULAR") },
    { n: 6, name: "Sextuple Booster", art: "rainbow", g: "#713f12", b: "#facc15", ds: tt("sh.b6", "6 figuras · garante EX/UX"), price: 300, tag: tt("sh.best", "MELHOR") }
  ];
  function render() {
    const root = mount(); if (!root) return;
    const left = dailyLeft(), ready = left <= 0, vb = victoryBoxes();
    const m = market();
    root.innerHTML = `
      <div class="ds-title"><span>${tt("sh.title", "Loja")}</span></div>
      <div class="sh-wallet"><span style="color:#fde047">🪙 ${n(coins())}</span><span style="color:#f472b6">🔻 ${n(gems())}</span><span style="color:#93c5fd">🧱 ${n(typeof userMaterial !== "undefined" ? userMaterial : 0)}</span></div>
      <div class="sh-daily ${ready ? "" : "done"}">
        <div class="gift"><img src="assets/ui/boosters/black.png" alt=""></div>
        <div><h3>${tt("sh.daily", "Recompensa Diária")}</h3>
          <div class="rw"><span>🔻 +50</span><span>🪙 +1,500</span><span>🟦 +1 Rare Metal</span></div>
          <button id="sh-daily-btn">${ready ? tt("sh.claim", "RESGATAR!") : "⏳ " + hms(left)}</button></div>
      </div>
      <div class="sh-vbox"><img src="assets/ui/boosters/gold.png" alt=""><div><b>${tt("sh.victory_boxes", "Caixas de Vitória")}: ${vb}</b><br>${tt("sh.vb_hint", "Ganhe vencendo partidas")}</div>
        <button id="sh-vb-btn" ${vb > 0 ? "" : "disabled"}>${tt("sh.open", "Abrir")}</button></div>

      <div class="sh-mk-head"><b>🛒 ${tt("sh.market_t", "Mercado Diário")}</b><span id="sh-mk-timer">⟳ ${hms(msToMidnight())}</span></div>
      <div class="sh-mk">${m.items.map((it, k) => {
        const f = FIGURES_DB[it.i], pr = priceOf(it), isNew = !unlocked(it.i);
        return `<div class="sh-it ${f.rarity} ${it.sold ? "sold" : ""}">
          <span class="rb">${rarHtml(f.rarity)}</span>${it.off && !it.sold ? `<span class="off">-${it.off}%</span>` : ""}${isNew && !it.sold ? `<span class="nw">${tt("sh.new", "NOVO")}</span>` : ""}
          <img loading="lazy" src="${spriteOf(f.spriteKey)}" alt="" data-info="${it.i}">
          <div class="nm">${esc(f.name)}</div><div class="ow">${isNew ? tt("sh.not_owned", "Você não tem") : tt("sh.owned", "Você tem") + " x" + owned(it.i)}</div>
          <button data-k="${k}" class="${pr.cur === "gem" ? "gem" : ""}" ${it.sold ? "disabled" : ""}>${it.sold ? "✔ " + tt("sh.bought", "Comprado") : `${it.off ? `<s>${n(pr.base)}</s>` : ""}${pr.cur === "coin" ? "🪙" : "🔻"} ${n(pr.final)}`}</button></div>`;
      }).join("")}</div>

      <div class="ds-sec" style="font-size:14px;margin-top:14px">📦 ${tt("sh.boxes", "Caixas")}</div>
      <div class="sh-boxes">${BOXES.map((b) => `
        <div class="sh-box" data-box="${b.n}" style="--g:${b.g};--b:${b.b}">${b.tag ? `<span class="tag">${b.tag}</span>` : ""}
          <img src="assets/ui/boosters/${b.art}.png" alt=""><div class="nm">${b.name}</div><div class="ds">${b.ds}</div>
          <div class="pr">🔻 ${b.price}</div></div>`).join("")}
        <div class="sh-box" data-coinbox="1" style="--g:#334155;--b:#94a3b8;grid-column:1/3">
          <div style="display:flex;align-items:center;gap:10px;justify-content:center"><img src="assets/ui/boosters/metallic.png" alt="" style="width:80px"><div style="text-align:left">
          <div class="nm">${tt("sh.coin_box", "Caixa de Moedas")}</div><div class="ds">${tt("sh.coin_box_d", "1 figura + 1 Rare Metal + 25 Material")}</div>
          <div class="pr c" style="display:inline-block;padding:4px 14px">🪙 10,000</div></div></div></div>
      </div>

      <div class="ds-sec" style="font-size:14px;margin-top:14px">⚗️ ${tt("sh.materials", "Materiais de Fusão")}</div>
      <div class="sh-mats">
        <div class="sh-mat" data-mat="rare_metal"><div class="ic">🟦</div><div class="nm">Rare Metal</div><div class="ds">${tt("sh.rm_d", "Sobe Lv 1→5")}</div><div class="pr">🪙 4,000</div></div>
        <div class="sh-mat" data-mat="carmonite"><div class="ic">🟣</div><div class="nm">Carmonite ×50</div><div class="ds">${tt("sh.carm_d", "Sobe Lv 6→10")}</div><div class="pr">🪙 15,000</div></div>
        <div class="sh-mat" data-mat="cube"><div class="ic">🟩</div><div class="nm">Green Cube</div><div class="ds">${tt("sh.cube_d", "+1 CLv (dano)")}</div><div class="pr">🪙 22,000</div></div>
      </div>
      <div style="display:flex;justify-content:center;margin-top:12px"><button class="ds-chip" id="sh-ex-toggle">🔄 ${tt("sh.exchange", "Troca por Material (todas as figuras)")}</button></div>`;

    $("sh-daily-btn").onclick = () => {
      if (dailyLeft() > 0) { sfx("hit"); toast("⏳ " + hms(dailyLeft()), "#64748b"); return; }
      try { claimDailyGems(); } catch (e) {}
      snd("item_get"); toast(msgOf("shop-exchange-msg") || "🎁 +50🔻 +1,500🪙 +1🟦", "#4ade80"); render();
    };
    $("sh-vb-btn").onclick = () => { try { openEarnedVictoryBox(); } catch (e) {} setTimeout(render, 300); };
    root.querySelectorAll("[data-k]").forEach((b) => { b.onclick = () => buyMarket(+b.dataset.k); });
    root.querySelectorAll("[data-info]").forEach((im) => { im.onclick = () => {
      const idx = +im.dataset.info;
      // v731: painel novo (igual ao do Deck); o antigo só se o novo não estiver disponível
      try { if (window.pdrOpenFigureInfo && pdrOpenFigureInfo(idx, tt("sh.back_shop", "Loja"))) return; } catch (e) {}
      try { openFigureDetailsModal(idx); } catch (e) {}
    }; });
    root.querySelectorAll("[data-box]").forEach((b) => {
      b.onclick = () => {
        const box = BOXES.find((x) => x.n === +b.dataset.box);
        if (gems() < box.price) { sfx("hit"); toast(`🔻 ${tt("sh.no_gems", "Gemas insuficientes")}: ${gems()}/${box.price}`, "#ef4444"); return; }
        try { buyShopBooster(box.n); } catch (e) { console.warn(e); }
        render();
      };
    });
    root.querySelector("[data-coinbox]").onclick = () => { try { buyWithCoins("coin_box"); } catch (e) {} const t2 = msgOf("coin-shop-msg"); if (t2) toast(t2, t2.indexOf("❌") === 0 ? "#ef4444" : "#4ade80"); render(); };
    root.querySelectorAll("[data-mat]").forEach((b) => { b.onclick = () => { try { buyWithCoins(b.dataset.mat); } catch (e) {} const t2 = msgOf("coin-shop-msg"); if (t2) toast(t2, t2.indexOf("❌") === 0 ? "#ef4444" : "#4ade80"); render(); }; });
    $("sh-ex-toggle").onclick = () => {
      const c = $("sh-exchange-card") || (function () { let x = $("shop-material-grid"); while (x && !(x.classList && x.classList.contains("card"))) x = x.parentNode; return x; })();
      if (!c) return;
      const show = c.style.display === "none";
      c.style.display = show ? "" : "none";
      if (show) { try { renderShopExchange(); } catch (e) {} c.scrollIntoView({ behavior: "smooth", block: "start" }); }
    };
  }

  // Botão de recompensa diária no hub (embaixo do Buff da Semana), pulsando quando está pronta
  function hubGift() {
    const wb = $("weekly-type-buff-hub-badge"); if (!wb || !wb.parentNode) return;
    let g = $("sh-hub-gift");
    if (!g) {
      g = document.createElement("div"); g.id = "sh-hub-gift";
      g.style.cssText = "cursor:pointer;display:flex;align-items:center;gap:5px;border-radius:8px;padding:5px 8px;box-shadow:0 3px 8px rgba(0,0,0,.7);width:fit-content";
      g.onclick = () => { try { openDrawer("shop"); } catch (e) {} };
      wb.parentNode.insertBefore(g, wb.nextSibling);
    }
    const left = dailyLeft(), ready = left <= 0;
    g.style.background = ready ? "linear-gradient(180deg,#22c55e,#15803d)" : "linear-gradient(180deg,#334155,#1e293b)";
    g.style.border = ready ? "1.5px solid #bbf7d0" : "1.5px solid #475569";
    g.style.animation = ready ? "shPulse 1.2s ease-in-out infinite" : "none";
    g.innerHTML = `<img src="assets/ui/boosters/black.png" alt="" style="width:24px;height:auto;display:block;filter:drop-shadow(0 1px 2px #000)"><div style="display:flex;flex-direction:column;line-height:1.1"><span style="font-size:9px;font-weight:900;color:#fff;text-shadow:0 1px 2px #000">${ready ? tt("sh.hub_ready", "PRÊMIO DIÁRIO!") : tt("sh.hub_daily", "PRÊMIO DIÁRIO")}</span><span style="font-size:7.5px;font-weight:800;color:${ready ? "#dcfce7" : "#94a3b8"}">${ready ? tt("sh.hub_tap", "Toque para resgatar") : hms(left)}</span></div>`;
  }

  // relógios (recompensa diária e virada do mercado)
  setInterval(() => {
    try { injectCss(); hubGift(); } catch (e) {}
    const tab = $("dtab-shop"); if (!tab || tab.style.display === "none" || !$("sh-root")) return;
    const b = $("sh-daily-btn"), left = dailyLeft();
    if (b && left > 0) b.textContent = "⏳ " + hms(left);
    else if (b && left <= 0 && b.textContent.indexOf("⏳") === 0) render();
    const mt = $("sh-mk-timer"); if (mt) mt.textContent = "⟳ " + hms(msToMidnight());
    if (market().day !== dayStr()) render();
  }, 1000);

  // integração
  if (typeof switchDrawerTab === "function") {
    const _sw = switchDrawerTab;
    const s2 = function (tabId) { const o = _sw.apply(this, arguments); if (tabId === "shop") render(); return o; };
    try { switchDrawerTab = s2; } catch (e) {}
    window.switchDrawerTab = s2;
  }
  if (typeof syncAllCurrencyLabels === "function") {
    const _sy = syncAllCurrencyLabels;
    const sy2 = function () { const o = _sy.apply(this, arguments); try { const tab = $("dtab-shop"); if ($("sh-root") && tab && tab.style.display !== "none") { const w = document.querySelector("#sh-root .sh-wallet"); if (w) w.innerHTML = `<span style="color:#fde047">🪙 ${n(coins())}</span><span style="color:#f472b6">🔻 ${n(gems())}</span><span style="color:#93c5fd">🧱 ${n(typeof userMaterial !== "undefined" ? userMaterial : 0)}</span>`; } } catch (e) {} return o; };
    try { syncAllCurrencyLabels = sy2; } catch (e) {}
  }
  window.PDRShop = { render, market };
})();
