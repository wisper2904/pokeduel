// ============================================================================
// v715 · Sprites de moedas, materiais, raridade e MP
//  - Troca os emojis da interface por ícones: 🪙 Moedas · 🔻/💎 Gemas · 🟦 Rare Metal · 🔷 Material · 🟣 Carmonite.
//  - "MP 3" / "MP3" / "PM 3" → ícone de MP + número.
//  - Raridade (C/UC/R/EX/UX): badges .ds-rar e os campos #fcc-rarity, #fdet-rarity, #pcard-rarity, #pldet-rarity
//    viram os ícones oficiais (assets/ui/rarity/<r>.png).
//    v716: todos os ícones são os oficiais do Bulbagarden (moeda, gema, Rare Metal, cubo, lingote, Carmonite, Material, MP0–3, raridades).
//  - Não mexe em <input>, <textarea>, <select>/<option>, <script>, <style> nem no canvas. API: window.PDRIcons.
// ============================================================================
(function () {
  "use strict";
  const ICON = {
    coin: "assets/ui/icons/coin.png", gem: "assets/ui/icons/gem.png", raremetal: "assets/ui/icons/raremetal.png",
    material: "assets/ui/icons/material.png", carmonite: "assets/ui/icons/carmonite.png",
    cube: "assets/ui/icons/cube.png", ingot: "assets/ui/icons/ingot.png", ticket: "assets/ui/icons/booster_ticket.png", aiticket: "assets/ui/icons/ai_ticket.png",
    mp0: "assets/ui/icons/mp0.png", mp1: "assets/ui/icons/mp1.png", mp2: "assets/ui/icons/mp2.png", mp3: "assets/ui/icons/mp3.png",
    C: "assets/ui/rarity/c.png", UC: "assets/ui/rarity/uc.png", R: "assets/ui/rarity/r.png", EX: "assets/ui/rarity/ex.png", UX: "assets/ui/rarity/ux.png"
  };
  const EMO = { "🪙": "coin", "🔻": "gem", "💎": "gem", "🟦": "raremetal", "🔷": "material", "🟣": "carmonite", "🧱": "material", "🟩": "cube" };
  const RX = /(🪙|🔻|💎|🟦|🔷|🟣|🧱|🟩)|\b(MP|PM) ?([0-9])\b/g;
  const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION", "CANVAS", "NOSCRIPT", "TITLE"]);
  const css = document.createElement("style");
  css.textContent = `
  img.pdi{display:inline-block!important;width:1.25em!important;height:1.25em!important;max-width:none!important;min-width:0!important;vertical-align:-.28em!important;object-fit:contain!important;margin:0 .08em!important;padding:0!important;border:0!important;background:none!important;position:static!important;transform:none!important;filter:drop-shadow(0 1px 1px rgba(0,0,0,.6))}
  img.pdi.mp{width:1.3em!important;height:1.3em!important;vertical-align:-.32em!important}
  .ds-rar.C,.ds-rar.UC,.ds-rar.R,.ds-rar.EX,.ds-rar.UX,[data-pdrar]{color:transparent!important;text-shadow:none!important;background-color:transparent!important;border-color:transparent!important;box-shadow:none!important;background-repeat:no-repeat!important;background-position:center!important;background-size:contain!important;min-width:22px!important;min-height:22px!important}
  ${["C", "UC", "R", "EX", "UX"].map((r) => `.ds-rar.${r},[data-pdrar="${r}"]{background-image:url(${ICON[r]})!important}`).join("\n  ")}
  `;
  document.head.appendChild(css);

  function img(key) {
    const i = document.createElement("img");
    i.className = "pdi" + (/^mp\d$/.test(key) ? " mp" : ""); i.src = ICON[key]; i.alt = ""; i.draggable = false; i.setAttribute("aria-hidden", "true");
    return i;
  }
  function skipEl(el) {
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) { if (SKIP.has(e.tagName) || e.isContentEditable || (e.dataset && e.dataset.noicon != null)) return true; }
    return false;
  }
  function convertText(node) {
    const s = node.nodeValue;
    if (!s || !node.parentElement || skipEl(node.parentElement)) return;
    RX.lastIndex = 0;
    if (!RX.test(s)) return;
    // 🔻 também marca "MP −1" nos logs: lá não é gema
    const mpMark = /\b(MP|PM)\b/.test(s) && s.includes("🔻");
    const frag = document.createDocumentFragment();
    let last = 0, m, changed = false;
    RX.lastIndex = 0;
    while ((m = RX.exec(s))) {
      if (m[1]) {
        if (m[1] === "🔻" && mpMark) continue;
        frag.appendChild(document.createTextNode(s.slice(last, m.index)));
        frag.appendChild(img(EMO[m[1]]));
      } else {
        const n = Number(m[3]);
        if (n > 3) continue;
        frag.appendChild(document.createTextNode(s.slice(last, m.index)));
        frag.appendChild(img("mp" + n));
      }
      last = m.index + m[0].length; changed = true;
    }
    if (!changed) return;
    frag.appendChild(document.createTextNode(s.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { convertText(root); return; }
    if (root.nodeType !== 1 || SKIP.has(root.tagName)) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const list = []; let n; while ((n = tw.nextNode())) list.push(n);
    list.forEach(convertText);
  }
  const RAR_IDS = ["fcc-rarity", "fdet-rarity", "pcard-rarity", "pldet-rarity"];
  function rarFix() {
    RAR_IDS.forEach((id) => {
      const el = document.getElementById(id); if (!el) return;
      const r = String(el.textContent || "").trim().toUpperCase();
      if (ICON[r] && ["C", "UC", "R", "EX", "UX"].includes(r)) { if (el.dataset.pdrar !== r) el.dataset.pdrar = r; }
      else if (el.dataset.pdrar) delete el.dataset.pdrar;
    });
  }
  let queued = new Set(), timer = null;
  function flush() {
    timer = null;
    const q = queued; queued = new Set();
    q.forEach((n) => { if (n.isConnected) walk(n); });
    rarFix();
  }
  const mo = new MutationObserver((muts) => {
    muts.forEach((m) => {
      if (m.type === "characterData") queued.add(m.target);
      else m.addedNodes.forEach((n) => { if (n.nodeType === 3 || (n.nodeType === 1 && n.className !== "pdi")) queued.add(n); });
      if (m.target && m.target.id && RAR_IDS.includes(m.target.id)) queued.add(m.target);
    });
    if (!timer) timer = setTimeout(flush, 0);
  });
  function start() {
    walk(document.body); rarFix();
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  /* Bloqueia o menu nativo (pesquisar/copiar imagem) e a seleção de texto fora de campos editáveis */
  const EDITABLE = (el) => !!(el && el.closest && el.closest("input, textarea, [contenteditable='true']"));
  document.addEventListener("contextmenu", (e) => { if (!EDITABLE(e.target)) e.preventDefault(); }, true);
  document.addEventListener("selectstart", (e) => { if (!EDITABLE(e.target)) e.preventDefault(); }, true);
  document.addEventListener("dragstart", (e) => { if (e.target && e.target.tagName === "IMG") e.preventDefault(); }, true);
  window.PDRIcons = { ICON, img, walk, src: (k) => ICON[k] || null };
})();
