// ============================================================================
// v706 · Aba Decks no mesmo visual da Fusão (duel_screens.js)
//  Visão "Deck": times, limites Mega/UX/EX, 6 slots em pedestais e as 6 cartas (Plates).
//  Visão "Trocar figura": prévia (roleta grande) da figura do slot e da escolhida + grade com busca/raridade.
//  Visão "Plates": cartas equipadas + catálogo (abre o modal antigo de detalhes para pôr/tirar).
// A lógica de time continua a antiga: toggleDeckEquip, switchDeckPreset, autoBuildBalancedTeamV540,
// promptRenameActiveTeam, createNewTeamSlot, openPlateDetailsModal. O DOM antigo fica escondido.
// Carrega depois de duel_screens.js.
// ============================================================================
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const tt = (k, fb) => (typeof t === "function" ? t(k, fb) : fb);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (n) => String(n || "").toLowerCase().replace(/[\s\-_]/g, "");
  const sfx = (n) => { try { if (typeof playSfx === "function") playSfx(n); } catch (e) {} };
  const DS = () => window.PDRDuelScreens || {};
  const spriteOf = (key) => { const s = AUTHENTIC_FIG_SPRITES[key] || AUTHENTIC_FIG_SPRITES.pikachu; return s ? s.uri : ""; };
  const rarHtml = (r) => `<span class="ds-rar ${esc(r)}">${esc(r)}</span>`;
  const mpHtml = (m) => `<span class="ds-mp">${esc(m)}</span>`;
  const unlocked = (i) => (typeof isFigureUnlocked === "function" ? isFigureUnlocked(i) : true);
  const effMp = (f) => (typeof getFigureEffectiveMp === "function" ? getFigureEffectiveMp(f) : f.mp);
  const plateSprite = (id) => (typeof BANANA_PLATE_SPRITES !== "undefined" && BANANA_PLATE_SPRITES[id]) || "";

  const css = `
  .dk-teams{display:flex;gap:5px;overflow-x:auto;padding-bottom:4px;margin-bottom:6px}
  .dk-team{flex:0 0 auto;background:#0f172a;border:1.5px solid #334155;color:#cbd5e1;border-radius:99px;font-size:11px;font-weight:900;padding:5px 11px;cursor:pointer;white-space:nowrap}
  .dk-team.on{background:linear-gradient(180deg,#facc15,#ca8a04);border-color:#fef08a;color:#1c1917}
  .dk-team.act{background:#14532d;border-color:#4ade80;color:#dcfce7}
  .dk-limits{display:flex;gap:5px;justify-content:center;margin:2px 0 8px}
  .dk-limits span{font-size:10px;font-weight:900;border-radius:6px;padding:2px 8px;background:#0f172a;border:1px solid #334155;color:#cbd5e1}
  .dk-limits span.full{border-color:#facc15;color:#fde047}
  .dk-limits span.over{border-color:#ef4444;color:#fca5a5}
  .dk-slots{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
  .dk-slot{position:relative;background:radial-gradient(circle at 50% 32%,#1e3a5f,#0b1220 72%);border:1.5px solid #1e3a8a;border-radius:11px;padding:5px 3px 6px;text-align:center;cursor:pointer;min-height:132px}
  .dk-slot:active{transform:scale(.97)}
  .dk-slot.sel{border-color:#facc15;box-shadow:0 0 12px rgba(250,204,21,.45)}
  .dk-slot .num{position:absolute;top:4px;left:6px;font-size:9px;font-weight:900;color:#93c5fd}
  .dk-slot .rb{position:absolute;top:3px;right:3px;transform:scale(.82);transform-origin:right top}
  .dk-slot .ped{position:relative;height:80px;margin-top:12px}
  .dk-slot .ped img{position:relative;z-index:1;width:76px;height:76px;object-fit:contain;filter:drop-shadow(0 4px 3px rgba(0,0,0,.6))}
  .dk-slot .ped:before{content:"";position:absolute;left:18%;right:18%;bottom:4px;height:15px;border-radius:50%;background:radial-gradient(ellipse at 50% 35%,#d6a66b,#7c4a1e 70%);box-shadow:0 3px 0 #4a2c10}
  .dk-slot .nm{font-size:10px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
  .dk-slot .meta{display:flex;justify-content:center;gap:4px;align-items:center;margin-top:3px;font-size:9px;font-weight:800;color:#94a3b8}
  .dk-slot .meta .ds-mp{width:19px;height:19px;font-size:10px}
  .dk-plates{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}
  .dk-plate{background:linear-gradient(180deg,#1e293b,#0b1220);border:1.5px solid #334155;border-radius:8px;padding:3px 2px;text-align:center;cursor:pointer;min-height:58px}
  .dk-plate img{width:34px;height:34px;object-fit:contain}
  .dk-plate .nm{font-size:7.5px;font-weight:800;color:#e2e8f0;line-height:1.1;overflow:hidden;max-height:17px}
  .dk-plate.empty{border-style:dashed;color:#475569;display:flex;align-items:center;justify-content:center;font-size:18px}
  .dk-pcat{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}
  .dk-pcard{position:relative;background:radial-gradient(circle at 50% 30%,#2e1065,#0b1220 72%);border:1.5px solid #4c1d95;border-radius:11px;padding:6px 5px;text-align:center;cursor:pointer}
  .dk-pcard.on{border-color:#4ade80;box-shadow:0 0 10px rgba(74,222,128,.35)}
  .dk-pcard img{width:52px;height:52px;object-fit:contain}
  .dk-pcard .nm{font-size:10px;font-weight:900;color:#fff}
  .dk-pcard .sub{font-size:8.5px;color:#c4b5fd;line-height:1.25;margin-top:2px;max-height:33px;overflow:hidden}
  .dk-pcard .cnt{position:absolute;top:4px;right:5px;font-size:9px;font-weight:900;color:#4ade80}
  .pk-deck{background:#18181b;border:2px solid #3f3f46;border-radius:10px;padding:6px 6px 8px;margin-bottom:10px}
  .pk-head{display:flex;align-items:baseline;gap:6px;color:#a1a1aa;font-weight:900;font-size:13px;margin:0 2px 6px}
  .pk-head b{color:#fff;font-size:17px}.pk-head .pk-cost{font-size:10px}
  .pk-hb{margin-left:auto;border:1.5px solid #71717a;background:linear-gradient(#3f3f46,#18181b);color:#e4e4e7;border-radius:6px;font-size:10px;font-weight:900;padding:3px 8px;cursor:pointer}
  .pk-row,.pk-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
  .pk-grid{grid-template-columns:repeat(5,1fr);gap:7px 6px}
  .pk-cf{display:flex;align-items:center;justify-content:center;gap:5px;margin:12px 0 4px;color:#fff;font-weight:900;font-size:12px}
  .pk-cf>span{margin-right:4px}
  .pk-cb{width:30px;height:30px;border-radius:50%;border:2px solid #0e7490;background:#083344;color:#67e8f9;font-weight:900;font-size:13px;cursor:pointer}
  .pk-cb.on{background:radial-gradient(circle at 40% 35%,#67e8f9,#0891b2);color:#fff;border-color:#a5f3fc}
  .pk-cb:disabled{opacity:.35;cursor:default}.pk-cb.all{width:auto;border-radius:99px;padding:0 9px;font-size:10px}
  .dk-pfil{display:flex;gap:5px;margin:0 0 7px;flex-wrap:wrap}
  .dk-pf{border:1.5px solid #4c1d95;background:#0b1220;color:#e9d5ff;border-radius:9px;padding:3px 8px;font-weight:900;font-size:10px;cursor:pointer;min-height:30px}
  .dk-pf img{width:24px;height:24px;object-fit:contain;display:block}
  .dk-pf.on{border-color:#facc15;box-shadow:0 0 8px rgba(250,204,21,.4)}
  .ds-rimg{width:22px;height:22px;object-fit:contain}
  .dk-pcard .pc{position:absolute;bottom:3px;right:5px;font-size:8px;font-weight:900;color:#fde047}
  .dk-pcard .rb{position:absolute;top:3px;left:3px;transform:scale(.78);transform-origin:left top}
  .dk-cmp{display:grid;grid-template-columns:1fr 26px 1fr;gap:4px;align-items:center;background:#020617;border:1px solid #1e293b;border-radius:11px;padding:7px}
  .dk-cmp .side{text-align:center}
  .dk-cmp canvas{width:100%;aspect-ratio:1;display:block}
  .dk-cmp .nm{font-size:12px;font-weight:900;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .dk-cmp .bd{display:flex;gap:4px;justify-content:center;margin-top:3px}
  .dk-cmp .arrow{text-align:center;color:#facc15;font-size:20px;font-weight:900}
  .dk-cmp .lbl{font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px}
  .ds-card.indeck{border-color:#facc15}
  .ds-card .slotb{position:absolute;bottom:17px;right:3px;background:#facc15;color:#1c1917;font-size:8px;font-weight:900;border-radius:4px;padding:0 4px}
  .ds-card.lockd img{filter:grayscale(.9) brightness(.5)}
  .ds-card.pick{outline:2.5px solid #38bdf8;outline-offset:-2px}
  .dk-top{position:relative;z-index:1;margin:-6px -6px 0;padding:6px 6px 4px}
  .dk-c,.dk-slot,.dk-c img,.dk-slot img{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-user-drag:none}
  .dk-slot,.dk-c{touch-action:pan-y;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  .dk-slots.choosing .dk-slot{animation:dkWiggle .5s ease-in-out infinite alternate;border-color:#38bdf8}
  .dk-slot.flash{animation:dkFlash .7s ease-out}
  @keyframes dkWiggle{from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}}
  @keyframes dkFlash{0%{box-shadow:0 0 0 0 rgba(250,204,21,.9);transform:scale(1.08)}100%{box-shadow:0 0 0 14px rgba(250,204,21,0);transform:scale(1)}}
  .dk-c.dragging,.dk-slot.dragging{opacity:.35}
  .dk-menu{position:fixed;z-index:410;width:110px;display:flex;flex-direction:column;gap:4px;background:#0b1220;border:2px solid #334155;border-radius:10px;padding:5px;box-shadow:0 8px 20px rgba(0,0,0,.8)}
  .dk-menu button{border:none;border-radius:7px;padding:8px;font-weight:900;font-size:13px;cursor:pointer;background:#1e3a5f;color:#e0f2fe}
  .dk-menu button.use{background:linear-gradient(180deg,#4ade80,#16a34a);color:#052e16}
  .dk-menu button.lock{background:#422006;color:#fde047}
  .dk-using{display:flex;align-items:center;gap:6px;background:#0c4a6e;border:1.5px solid #38bdf8;border-radius:9px;padding:4px 7px;margin-bottom:6px;font-size:11px;font-weight:800}
  .dk-using img{width:30px;height:30px;object-fit:contain}
  .dk-using span{flex:1}.dk-using button{background:#0f172a;border:1px solid #64748b;color:#fff;border-radius:6px;width:26px;height:26px;cursor:pointer}
  `;
  function injectCss() {
    if (DS().injectCss) DS().injectCss();
    if ($("dk-css")) return;
    const st = document.createElement("style"); st.id = "dk-css"; st.textContent = css; document.head.appendChild(st);
  }

  const V = { view: "deck", rar: "ALL", q: "", mine: true, msg: "", using: null, flash: -1, limit: 80, infoIdx: null };

  function mount() {
    const tab = $("dtab-deck");
    if (!tab) return null;
    let root = $("dk-root");
    if (!root) {
      injectCss();
      const legacy = document.createElement("div"); legacy.id = "dk-legacy"; legacy.style.display = "none";
      Array.from(tab.children).forEach((c) => legacy.appendChild(c));
      tab.appendChild(legacy);
      root = document.createElement("div"); root.id = "dk-root"; root.className = "ds-root";
      tab.insertBefore(root, legacy);
    }
    return root;
  }
  function deck() { return (state && Array.isArray(state.deckP1)) ? state.deckP1.slice(0, 6) : []; }
  function teams() { return (typeof playerProgression !== "undefined" && playerProgression && Array.isArray(playerProgression.teams)) ? playerProgression.teams : []; }
  function activeTeam() { return (typeof playerProgression !== "undefined" && playerProgression) ? (playerProgression.activeTeamIdx || 0) : 0; }
  function legacyMsg() { const e = $("editing-slot-indicator"); return e ? e.textContent : ""; }
  function equippedPlates() {
    try { if (typeof getSavedEquippedPlateIds === "function") return getSavedEquippedPlateIds(); } catch (e) {}
    return (state.plates || []).filter((p) => !p.disabledInDeck).map((p) => p.id);
  }
  const plateRar = (r) => { const src = window.PDR_PLATE_RARITY_ICON && PDR_PLATE_RARITY_ICON(r); return src ? `<img class="ds-rimg" src="${src}" alt="${esc(r)}">` : rarHtml(r); };
  function plateById(id) { return (typeof BASE_PLATE_CATALOG !== "undefined" && BASE_PLATE_CATALOG.find((p) => p.id === id)) || { id, name: id, rarity: "C", sub: "" }; }

  function render() {
    const root = mount();
    if (!root) return;
    if (V.view === "info" && V.infoIdx != null) return openInfo(V.infoIdx);
    if (V.view === "pick") V.view = "deck";
    if (V.view === "plates") return renderPlates(root);
    V.view = "deck";
    renderDeck(root);
  }

  // ------------------------------------------------------------ Deck (estilo Clash Royale)
  // Slots fixos no topo + coleção embaixo. Arraste uma figura até um slot, ou toque → Usar → toque no slot.
  // Arrastar um slot sobre outro troca os dois de lugar. Toque num slot → Info (só leitura).
  function equipInto(slot, idx) {
    const d = deck();
    if (d[slot] === idx) return true;
    const from = d.indexOf(idx);
    currentEditingDeckSlot = slot;
    try { toggleDeckEquip(idx); } catch (e) { console.warn(e); }
    const ok = deck()[slot] === idx;
    V.msg = legacyMsg();
    V.flash = ok ? slot : -1;
    if (ok && window.PDRSound) PDRSound.play(from >= 0 ? "swap" : "plate_ok");
    return ok;
  }
  function swapSlots(a, b) {
    if (a === b) return;
    const d = state.deckP1;
    const x = d[a]; d[a] = d[b]; d[b] = x;
    try {
      if (playerProgression.teams[playerProgression.activeTeamIdx]) playerProgression.teams[playerProgression.activeTeamIdx].slots = [...d];
      if (typeof DECK_PRESETS !== "undefined") DECK_PRESETS[playerProgression.activeTeamIdx] = [...d];
      if (typeof saveProgressionState === "function") saveProgressionState();
      if (typeof demoFullMatchState === "function") demoFullMatchState();
    } catch (e) {}
    V.msg = `↔️ #${a + 1} ⇄ #${b + 1}`; V.flash = b;
    if (window.PDRSound) PDRSound.play("swap"); else sfx("portal");
    try { renderHubAndCollection(); } catch (e) { render(); }
  }
  function openInfo(idx, from) {
    const root = mount(); if (!root || !DS().showDataReadOnly) { try { openFigureDetailsModal(idx); } catch (e) {} return; }
    V.view = "info"; V.infoIdx = idx;
    const inDeck = deck().indexOf(idx) >= 0;
    DS().showDataReadOnly(root, idx, {
      backLabel: "Deck",
      onBack: () => { V.view = "deck"; render(); },
      extraHtml: unlocked(idx) ? `<div class="ds-btns" style="grid-template-columns:1fr"><button class="ds-btn gold" id="dk-info-use" style="font-size:14px">${inDeck ? tt("dk.move_slot", "Mudar de slot") : tt("dk.use", "Usar no deck")}</button></div>` : "",
      onRendered: (r, cur) => { const b = r.querySelector("#dk-info-use"); if (b) b.onclick = () => { V.view = "deck"; V.using = cur; V.msg = ""; render(); scrollTop(); }; }
    });
    scrollTop();
  }
  function scrollTop() { const tab = $("dtab-deck"); if (tab) tab.scrollTop = 0; }

  function renderDeck(root) {
    const d = deck();
    const st = (typeof countDeckBalanceStats === "function") ? countDeckBalanceStats(d) : { megas: 0, uxs: 0, exs: 0 };
    const lim = (n, max, label) => `<span class="${n > max ? "over" : (n === max ? "full" : "")}">${label} ${n}/${max}</span>`;
    const plates = equippedPlates();
    const ts = teams(), at = activeTeam();
    const using = (V.using != null && FIGURES_DB[V.using]) ? V.using : null;
    const order = { UX: 0, EX: 1, R: 2, UC: 3, C: 4 };
    const list = FIGURES_DB.map((f, i) => ({ f, i })).filter((x) => (!V.mine || unlocked(x.i)) &&
      (V.rar === "ALL" || x.f.rarity === V.rar) && (!V.q || norm(x.f.name).includes(norm(V.q))));
    list.sort((a2, b2) => (unlocked(b2.i) - unlocked(a2.i)) || (order[a2.f.rarity] - order[b2.f.rarity]) || a2.f.name.localeCompare(b2.f.name));
    const shown = list.slice(0, V.limit || 80);
    root.innerHTML = `
      <div class="dk-top">
        <div class="dk-teams">
          ${ts.map((tm, i) => `<button class="dk-team ${i === at ? "on" : ""}" data-t="${i}">⚔️ ${esc(tm.name || "Time #" + (i + 1))}</button>`).join("")}
          <button class="dk-team" id="dk-new" title="${tt("dk.new_team", "Novo time")}">＋</button>
          <button class="dk-team" id="dk-ren" title="${tt("dk.rename", "Renomear")}">✏️</button>
          <button class="dk-team act" id="dk-auto">⚡ Auto</button>
        </div>
        <div class="dk-limits">${lim(st.megas, typeof MAX_DECK_MEGAS !== "undefined" ? MAX_DECK_MEGAS : 1, "MEGA")}${lim(st.uxs, typeof MAX_DECK_UX !== "undefined" ? MAX_DECK_UX : 1, "UX")}${lim(st.exs, typeof MAX_DECK_EX !== "undefined" ? MAX_DECK_EX : 2, "EX")}</div>
        ${using != null ? `<div class="dk-using"><img src="${spriteOf(FIGURES_DB[using].spriteKey)}" alt=""><span>${tt("dk.tap_where", "Toque no slot para colocar")} <b>${esc(FIGURES_DB[using].name)}</b></span><button id="dk-cancel-use">✕</button></div>` : ""}
        <div class="dk-slots ${using != null ? "choosing" : ""}">${d.map((idx, s) => {
          const f = FIGURES_DB[idx % FIGURES_DB.length] || FIGURES_DB[0];
          return `<div class="dk-slot ${V.flash === s ? "flash" : ""}" data-s="${s}" data-i="${idx}"><span class="num">#${s + 1}</span><span class="rb">${rarHtml(f.rarity)}</span>
            <div class="ped"><img src="${spriteOf(f.spriteKey)}" alt="" draggable="false"></div>
            <div class="nm">${esc(f.name)}</div>
            <div class="meta">${mpHtml(effMp(f))}<span>Lv${f.level || 1}</span></div></div>`;
        }).join("")}</div>
        <div class="ds-msg" id="dk-msg" style="margin-top:4px">${esc(V.msg || "")}</div>
      </div>
      <div class="ds-sec" style="display:flex;justify-content:space-between;align-items:center">
        <span>Plates <span style="color:#c084fc">${plates.length}/${typeof MAX_DECK_PLATES !== "undefined" ? MAX_DECK_PLATES : 6}</span></span>
        <button class="ds-chip" id="dk-edit-plates" style="border-color:#7c3aed;color:#ddd6fe">${tt("dk.edit_plates", "Editar Plates")}</button>
      </div>
      <div class="dk-plates">${Array.from({ length: 6 }, (_, k) => {
        const id = plates[k];
        if (!id) return `<div class="dk-plate empty" data-p="">＋</div>`;
        const p = plateById(id);
        return `<div class="dk-plate" data-p="${esc(id)}"><img src="${plateSprite(id)}" alt=""><div class="nm">${esc(tt("plate." + id + ".name", p.name))}</div></div>`;
      }).join("")}</div>
      <div class="ds-sec" style="display:flex;justify-content:space-between;align-items:center">
        <span>${tt("dk.collection", "Coleção")} <span style="color:#38bdf8">${list.length}</span></span>
        <span style="font-size:9.5px;color:#64748b;font-weight:800">${tt("dk.hold_hint", "Segure para ver as informações")}</span>
      </div>
      <input class="ds-search" id="dk-q" placeholder="🔎 ${tt("ds.search", "Buscar figura...")}" value="${esc(V.q)}">
      <div class="ds-chips">
        <button class="ds-chip ${V.mine ? "on" : ""}" id="dk-mine">${tt("dk.mine", "Minhas")}</button>
        ${["ALL", "C", "UC", "R", "EX", "UX"].map((r) => `<button class="ds-chip ${V.rar === r ? "on" : ""}" data-r="${r}">${r === "ALL" ? tt("ds.all", "Todas") : r}</button>`).join("")}
      </div>
      <div class="ds-grid" id="dk-grid">${shown.map(({ f, i }) => {
        const at2 = d.indexOf(i);
        return `<div class="ds-card dk-c ${at2 >= 0 ? "indeck" : ""} ${unlocked(i) ? "" : "lockd"} ${using === i ? "pick" : ""}" data-i="${i}">
          <span class="rb">${rarHtml(f.rarity)}</span><span class="lv">MP${effMp(f)}</span>
          <img loading="lazy" src="${spriteOf(f.spriteKey)}" alt="" draggable="false">${at2 >= 0 ? `<span class="slotb">#${at2 + 1}</span>` : ""}
          <div class="nm">${unlocked(i) ? "" : "🔒 "}${esc(f.name)}</div></div>`;
      }).join("") || `<div style="grid-column:1/5;text-align:center;color:#64748b;font-size:11px;padding:20px">${tt("ds.none", "Nenhuma figura.")}</div>`}</div>
      ${list.length > shown.length ? `<div style="display:flex;justify-content:center;margin-top:8px"><button class="ds-chip" id="dk-more">${tt("dk.show_more", "Mostrar mais")} (+${list.length - shown.length})</button></div>` : ""}
      <div style="display:flex;justify-content:center;margin-top:12px"><button class="ds-btn gold" id="dk-close" style="width:55%">${tt("dk.close", "Fechar")}</button></div>`;
    V.flash = -1;

    root.querySelectorAll("[data-t]").forEach((b) => { b.onclick = () => { V.msg = ""; V.using = null; try { switchDeckPreset(+b.dataset.t); } catch (e) {} render(); }; });
    const call = (fn) => { try { if (typeof window[fn] === "function") window[fn](); } catch (e) { console.warn(e); } V.msg = legacyMsg(); render(); };
    $("dk-new").onclick = () => call("createNewTeamSlot");
    $("dk-ren").onclick = () => call("promptRenameActiveTeam");
    $("dk-auto").onclick = () => call("autoBuildBalancedTeamV540");
    const cu = $("dk-cancel-use"); if (cu) cu.onclick = () => { V.using = null; sfx("back"); render(); };
    root.querySelectorAll(".dk-plate").forEach((c) => {
      c.onclick = () => { if (c.dataset.p && typeof openPlateDetailsModal === "function") openPlateDetailsModal(c.dataset.p); else { V.view = "plates"; sfx("tick"); render(); } };
    });
    $("dk-edit-plates").onclick = () => { V.view = "plates"; sfx("tick"); render(); };
    $("dk-close").onclick = () => { try { switchDrawerTab("hub"); } catch (e) {} };
    const q = $("dk-q");
    q.oninput = () => { V.q = q.value; V.limit = 80; const pos = q.selectionStart; render(); const q2 = $("dk-q"); q2.focus(); q2.setSelectionRange(pos, pos); };
    $("dk-mine").onclick = () => { V.mine = !V.mine; sfx("tick"); render(); };
    root.querySelectorAll("[data-r]").forEach((b) => { b.onclick = () => { V.rar = b.dataset.r; V.limit = 80; sfx("tick"); render(); }; });
    const more = $("dk-more"); if (more) more.onclick = () => { V.limit = (V.limit || 80) + 80; render(); };

    // toque = menu/equipar; segurar = informações (v734: sem arrastar)
    root.querySelectorAll(".dk-slot").forEach((el) => bindPress(el, "slot"));
    root.querySelectorAll(".dk-c").forEach((el) => bindPress(el, "card"));
  }

  // Menu de toque na carta (Info / Usar), como no Clash Royale
  function cardMenu(el, idx) {
    closeMenu();
    const r = el.getBoundingClientRect();
    const m = document.createElement("div"); m.id = "dk-menu"; m.className = "dk-menu";
    const can = unlocked(idx);
    m.innerHTML = `<button data-a="info">${tt("dk.info", "Info")}</button>${can ? `<button data-a="use" class="use">${tt("dk.use_short", "Usar")}</button>` : `<button data-a="shop" class="lock">🔒 ${tt("dk.shop", "Loja")}</button>`}`;
    m.style.left = Math.max(6, Math.min(innerWidth - 116, r.left + r.width / 2 - 55)) + "px";
    m.style.top = Math.min(innerHeight - 90, r.bottom + 4) + "px";
    document.body.appendChild(m);
    m.querySelector('[data-a="info"]').onclick = () => { closeMenu(); openInfo(idx); };
    const u = m.querySelector('[data-a="use"]'); if (u) u.onclick = () => { closeMenu(); V.using = idx; V.msg = ""; sfx("select"); render(); scrollTop(); };
    const sh = m.querySelector('[data-a="shop"]'); if (sh) sh.onclick = () => { closeMenu(); try { switchDrawerTab("shop"); } catch (e) {} };
    setTimeout(() => document.addEventListener("pointerdown", outside, true), 0);
  }
  function outside(e) { const m = $("dk-menu"); if (m && !m.contains(e.target)) closeMenu(); }
  function closeMenu() { const m = $("dk-menu"); if (m) m.remove(); document.removeEventListener("pointerdown", outside, true); }

  // v734: o arrastar para o deck saiu. No celular, segurar a imagem abria o menu do navegador (salvar imagem) junto
  // com o arrasto e a figura ficava presa na tela. Agora: toque = menu Info/Usar (ou equipar no slot); segurar = Info.
  const HOLD_MS = 480;
  let press = null;
  function bindPress(el, kind) {
    el.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      const idx = +el.dataset.i;
      const st = { el, idx, x0: e.clientX, y0: e.clientY, held: false };
      st.timer = setTimeout(() => {
        if (press !== st) return;
        st.held = true;
        try { navigator.vibrate && navigator.vibrate(20); } catch (x) {}
        closeMenu(); openInfo(idx);
      }, HOLD_MS);
      press = st;
    });
    el.addEventListener("click", (e) => {
      if (press && press.el === el && press.held) { press = null; e.preventDefault(); return; }
      const idx = +el.dataset.i;
      if (kind === "slot") {
        const s = +el.dataset.s;
        if (V.using != null) { const u = V.using; V.using = null; equipInto(s, u); try { renderHubAndCollection(); } catch (e2) { render(); } return; }
        openInfo(idx);
      } else {
        if (V.using != null && V.using === idx) { V.using = null; render(); return; }
        cardMenu(el, idx);
      }
    });
  }
  function cancelPress() { if (press) { clearTimeout(press.timer); if (!press.held) press = null; } }
  window.addEventListener("pointermove", (e) => {
    if (!press || press.held) return;
    if (Math.hypot(e.clientX - press.x0, e.clientY - press.y0) > 10) cancelPress(); // rolando: não é segurar
  }, { passive: true });
  window.addEventListener("pointerup", () => { if (press && !press.held) { clearTimeout(press.timer); } });
  window.addEventListener("pointercancel", cancelPress);
  // Sem menu de imagem (salvar/abrir) e sem arrastar nativo nas figuras do Deck
  const inDeckFig = (t) => t && t.closest && t.closest("#dtab-deck .dk-c, #dtab-deck .dk-slot");
  document.addEventListener("contextmenu", (e) => { if (inDeckFig(e.target)) e.preventDefault(); });
  document.addEventListener("dragstart", (e) => { if (inDeckFig(e.target)) e.preventDefault(); });

  // ------------------------------------------------------------ Plates
  // Cartas no formato do Edit Plates original: carta preta, ícone no canto, raridade ao lado, nome embaixo na cor
  // da plate, faixa colorida no rodapé, ✓ quando está no deck. Limite de custo 6 (◆) e filtro por custo 1–6.
  const PCOL = { purple: "#e879f9", gold: "#facc15", green: "#4ade80", pink: "#f9a8d4", red: "#f87171", blue: "#22d3ee" };
  function plateCard(p, opts) {
    if (window.PDRPlateCard) return window.PDRPlateCard(p, opts);
    const col = PCOL[p.color] || "#e2e8f0", g = p.glyph;
    const num = g && /^\+?\d+$/.test(g);
    const icon = g ? `<span class="pk-ic ${num ? "num" : ""}" style="--pc:${col}">${esc(g.replace(/^\+/, ""))}</span>` : `<img class="pk-img" src="${plateSprite(p.id)}" alt="">`;
    return `<div class="pk-card ${opts.on ? "on" : ""} ${opts.dim ? "dim" : ""}" data-p="${esc(p.id)}" style="--pc:${col}"><div class="pk-in">${icon}
      <span class="pk-r">${esc(p.rarity || "C")}</span><div class="pk-nm">${esc(tt("plate." + p.id + ".name", p.name))}</div>
      <i class="pk-bar"></i>${opts.on ? `<span class="pk-ck">✓</span>` : ""}${opts.cnt > 1 ? `<span class="pk-n">x${opts.cnt}</span>` : ""}</div></div>`;
  }
  const costOf = (p) => (p && p.ocost != null ? p.ocost : 1);
  function renderPlates(root) {
    const eq = equippedPlates();
    const cat = (typeof BASE_PLATE_CATALOG !== "undefined") ? BASE_PLATE_CATALOG : [];
    const used = eq.reduce((a, id) => a + costOf(plateById(id)), 0);
    const lim = typeof MAX_DECK_PLATE_COST !== "undefined" ? MAX_DECK_PLATE_COST : 6;
    V.pc = V.pc || "all";
    const costs = new Set(cat.map(costOf));
    const shown = cat.filter((p) => V.pc === "all" || costOf(p) === V.pc);
    root.innerHTML = `
      <div class="ds-title"><button class="ds-back" id="dk-back">‹ Deck</button><span>${tt("dk.edit_plates", "Editar Plates")}</span></div>
      <div class="pk-deck"><div class="pk-head"><span>Plates</span><b>${used}/${lim}</b><span class="pk-cost">${tt("dk.cost", "Custo")}</span>
        <button class="pk-hb" id="dk-pclear">${tt("dk.clear_plates", "Limpar todas")}</button></div>
        <div class="pk-row">${Array.from({ length: 6 }, (_, k) => { const id = eq[k]; return id ? plateCard(plateById(id), {}) : `<div class="pk-card empty"><div class="pk-in"></div></div>`; }).join("")}</div></div>
      <div class="pk-grid">${shown.map((p) => { const n = eq.filter((x) => x === p.id).length; return plateCard(p, { on: n > 0, cnt: n, dim: !n && used + costOf(p) > lim }); }).join("")}</div>
      <div class="pk-cf"><span>${tt("dk.cost", "Custo")}</span>${[1, 2, 3, 4, 5, 6].map((c) => `<button class="pk-cb ${V.pc === c ? "on" : ""}" data-pc="${c}" ${costs.has(c) ? "" : "disabled"}>${c}</button>`).join("")}
        <button class="pk-cb all ${V.pc === "all" ? "on" : ""}" data-pc="all">${tt("dk.all", "TODAS")}</button></div>
      <div class="ds-msg">${tt("dk.plate_hint", "Toque numa carta para ver detalhes, colocar ou tirar do deck.")}</div>
      <div class="ds-btns"><button class="ds-btn gold" id="dk-pdone" style="font-size:13px">OK</button></div>`;
    $("dk-back").onclick = () => { V.view = "deck"; sfx("back"); render(); };
    $("dk-pdone").onclick = () => { V.view = "deck"; sfx("tick"); render(); };
    root.querySelectorAll("[data-pc]").forEach((b) => { b.onclick = () => { V.pc = b.dataset.pc === "all" ? "all" : Number(b.dataset.pc); sfx("tick"); render(); }; });
    $("dk-pclear").onclick = () => { try { clearAllDeckPlates(); } catch (e) {} render(); };
    root.querySelectorAll("[data-p]").forEach((c) => { c.onclick = () => { if (c.dataset.p && typeof openPlateDetailsModal === "function") openPlateDetailsModal(c.dataset.p); }; });
  }

  // ------------------------------------------------------------ integração
  const deckVisible = () => { const tab = $("dtab-deck"); return !!(tab && tab.style.display !== "none"); };
  if (typeof renderHubAndCollection === "function") {
    const _r = renderHubAndCollection;
    const r2 = function () { const o = _r.apply(this, arguments); try { if (deckVisible() || $("dk-root")) render(); } catch (e) { console.warn("[deck]", e); } return o; };
    try { renderHubAndCollection = r2; } catch (e) {}
    window.renderHubAndCollection = r2;
  }
  const setView = (v) => function () { V.view = v; render(); };
  const sw = { switchToDeckOverview: "deck", switchToEditFiguresView: "pick", switchToEditPlatesView: "plates" };
  Object.keys(sw).forEach((name) => {
    const fn = function () { V.view = sw[name] === "pick" ? "deck" : sw[name]; render(); };
    try { eval(name + " = fn"); } catch (e) {}
    window[name] = fn;
  });
  if (typeof switchDrawerTab === "function") {
    const _sw = switchDrawerTab;
    const s2 = function (tabId) { const o = _sw.apply(this, arguments); if (tabId === "deck") { V.view = "deck"; V.msg = ""; render(); } return o; };
    try { switchDrawerTab = s2; } catch (e) {}
    window.switchDrawerTab = s2;
  }
  // Modal de Plate fechado → atualiza
  if (typeof closePlateDetailsModal === "function") {
    const _c = closePlateDetailsModal;
    const c2 = function () { const o = _c.apply(this, arguments); if ($("dk-root")) render(); return o; };
    try { closePlateDetailsModal = c2; } catch (e) {}
    window.closePlateDetailsModal = c2;
  }
  window.PDRDeckScreen = { render, openInfo, equipInto, swapSlots, state: V };
})();
