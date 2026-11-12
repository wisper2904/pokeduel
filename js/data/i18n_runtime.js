// ============================================================================
// v714 · Tradutor central PT / EN / ES
// Os textos fixos do jogo (logs, botões, telas, habilidades, efeitos, golpes) estão em
// I18N_DICT (js/data/i18n_dict.js): cada entrada é [pt, en, es, original?]; "{0}", "{1}"… são partes variáveis.
// Este arquivo traduz no ponto em que o texto aparece: DOM (MutationObserver), canvas (fillText),
// setLogText, alert/confirm e t() sem chave. Qualquer variante (pt/en/es) acha a mesma entrada.
// Para textos novos: escreva normalmente e rode tools/i18n (ver AI_HANDOFF §4) para gerar o dicionário.
// Carrega depois de i18n.js e i18n_dict.js.
// ============================================================================
(function () {
  "use strict";
  const DICT = (typeof I18N_DICT !== "undefined" && I18N_DICT) || [];
  const LI = { pt: 0, en: 1, es: 2 };
  const lang = () => (typeof getAppLanguage === "function" ? getAppLanguage() : "pt");
  const exact = new Map(); // texto (qualquer língua) → entrada
  const tpls = [];         // { re, e, li, nVars, staticLen }
  const byAnchor = new Map();
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  function addEntry(e) {
    for (let li = 0; li < e.length; li++) {
      const s = e[li];
      if (!s) continue;
      if (/\{\d+\}/.test(s)) {
        const parts = s.split(/(\{\d+\})/);
        let re = "^", order = [], stat = "";
        parts.forEach((p) => { const m = /^\{(\d+)\}$/.exec(p); if (m) { re += "([\\s\\S]+?)"; order.push(+m[1]); } else { re += esc(p).replace(/\\ |\s+/g, "\\s+"); stat += p; } });
        re += "$";
        const T = { re: new RegExp(re), e, li, order, staticLen: stat.replace(/\s+/g, "").length };
        if (T.staticLen < 3) continue;
        const anc = (stat.match(/[A-Za-zÀ-ÿ]{3,}/g) || []).sort((a, b) => b.length - a.length)[0];
        const k = anc ? anc.toLowerCase() : "";
        if (!byAnchor.has(k)) byAnchor.set(k, []);
        byAnchor.get(k).push(T); tpls.push(T);
      } else {
        const k = norm(s);
        if (!exact.has(k)) exact.set(k, e);
      }
    }
  }
  DICT.forEach((e) => { if (Array.isArray(e)) addEntry(e); });
  // golpes / tipos / condições do i18n antigo também entram
  try {
    Object.entries(POKEMON_MOVES_I18N).forEach(([k, v]) => {
      const en = v.en || k.replace(/\b\w/g, (c) => c.toUpperCase());
      addEntry([v.pt || en, en, v.es || en]);
    });
  } catch (e) {}
  try { Object.keys(POKEMON_TYPES_I18N.pt || {}).forEach((en) => addEntry([POKEMON_TYPES_I18N.pt[en], en, (POKEMON_TYPES_I18N.es || {})[en] || en])); } catch (e) {}
  try { ["normal", "sleep", "paralyze", "freeze", "burn", "poison", "badpoison", "panic", "wait", "ko"].forEach((k) => addEntry([CONDITIONS_I18N.pt[k], CONDITIONS_I18N.en[k], CONDITIONS_I18N.es[k]])); } catch (e) {}
  try { const D = I18N_TRANSLATIONS; Object.keys(D.pt).forEach((k) => { if (D.en[k] && D.es[k] && typeof D.pt[k] === "string") addEntry([D.pt[k], D.en[k], D.es[k]]); }); } catch (e) {}
  // ordena: mais texto fixo primeiro (menos ambíguo)
  byAnchor.forEach((arr) => arr.sort((a, b) => b.staticLen - a.staticLen));
  const anchorKeys = [...byAnchor.keys()].filter(Boolean);

  const cache = { pt: new Map(), en: new Map(), es: new Map() };
  function trVar(v, L) {
    const k = norm(v);
    const e = exact.get(k);
    if (e) return e[LI[L]] || v;
    return v;
  }
  function trCore(s, L, depth) {
    const k = norm(s);
    if (!k || !/[A-Za-zÀ-ÿ]/.test(k)) return s;
    const e = exact.get(k);
    if (e) return e[LI[L]] || s;
    const lk = k.toLowerCase();
    let cands = byAnchor.get("") || [];
    for (const a of anchorKeys) if (lk.includes(a)) cands = cands.concat(byAnchor.get(a));
    let best = null, bestLen = -1, bestM = null;
    for (const T of cands) {
      if (T.staticLen <= bestLen) continue;
      const m = T.re.exec(k);
      if (m) { best = T; bestLen = T.staticLen; bestM = m; }
    }
    if (best) {
      const tgt = best.e[LI[L]];
      if (!tgt) return s;
      const vals = {};
      best.order.forEach((n, i) => { vals[n] = bestM[i + 1]; });
      return tgt.replace(/\{(\d+)\}/g, (_, n) => (vals[n] != null ? (depth < 2 ? trCore(vals[n], L, depth + 1) : trVar(vals[n], L)) : ""));
    }
    // texto composto: tenta as partes
    if (depth < 2) {
      // "A: B" (inclusive "Nome: Nome 2: texto"): escolhe o corte em ": " que traduz mais partes
      if (k.includes(": ")) {
        let pos = k.indexOf(": "), best = null, bestScore = 0;
        while (pos > 0) {
          const a = k.slice(0, pos), b = k.slice(pos + 2);
          const ta = trCore(a, L, depth + 1), tb = trCore(b, L, depth + 1);
          const sc = (ta !== a ? 1 : 0) + (tb !== b ? 1 : 0) + (exact.has(norm(b)) ? 0.5 : 0);
          if (sc > bestScore) { bestScore = sc; best = ta + ": " + tb; }
          pos = k.indexOf(": ", pos + 2);
        }
        if (best) return best;
      }
      // trechos entre parênteses/colchetes: "992 (Beginner)", "+ Plate [Hurdle Jump]"
      if (/[([]/.test(k)) {
        let ch = false;
        const r2 = k.replace(/([(\[])([^()\[\]]{2,48})([)\]])/g, (m0, o, inner, c) => { const tr = trCore(inner, L, depth + 1); if (tr !== inner) { ch = true; return o + tr + c; } return m0; });
        if (ch) { const r3 = trCore(r2, L, depth + 1); return r3 !== r2 ? r3 : r2; }
      }
      const seps = [" — ", " · ", " | ", " ➔ ", " → ", " + ", " • ", " / ", " & "];
      for (const sp of seps) {
        if (k.includes(sp)) {
          const parts = k.split(sp); const tr = parts.map((p) => trCore(p, L, depth + 1));
          if (tr.some((x, i) => x !== parts[i])) return tr.join(sp);
        }
      }
      // "Golpe 90" / "Golpe*" / "Golpe ★★"
      const m2 = /^(.*?[A-Za-zÀ-ÿ'’)])(\*|\s+[\d★+\-x×%]+.*)$/.exec(k);
      if (m2) { const h = trCore(m2[1], L, depth + 1); if (h !== m2[1]) return h + m2[2]; }
      // prefixo de emoji/símbolo
      const m3 = /^([^A-Za-zÀ-ÿ0-9[(]+)(.+)$/u.exec(k);
      if (m3) { const h = trCore(m3[2], L, depth + 1); if (h !== m3[2]) return m3[1] + h; }
      const m4 = /^(.+?)([^A-Za-zÀ-ÿ0-9)\].!?]+)$/u.exec(k);
      if (m4) { const h = trCore(m4[1], L, depth + 1); if (h !== m4[1]) return h + m4[2]; }
    }
    return s;
  }
  // termos de jogo que sobram em textos montados (nomes vindos de fora do dicionário)
  const GLOSS = {
    pt: [[/\bDMG\b/g, "DANO"], [/\bLv\.?(?=\s?\d)/g, "Nv."], [/\bMiss\b/g, "Falha"], [/\bEntry Points?\b/g, "Ponto de Entrada"], [/\bGoal Point\b/g, "Gol"], [/\bPlates\b/g, "Placas"], [/\bPlate\b/g, "Placa"], [/\bZ-Move\b/g, "Movimento Z"], [/\bWait\b(?=\s?\d)/g, "Espera"]],
    es: [[/\bDMG\b/g, "DAÑO"], [/\bDANO\b/g, "DAÑO"], [/\bMP\b/g, "PM"], [/\bLv\.?(?=\s?\d)/g, "Nv."], [/\bMiss\b/g, "Fallo"], [/\bEntry Points?\b/g, "Punto de entrada"], [/\bGoal Point\b/g, "Meta"], [/\bPlates\b/g, "Placas"], [/\bPlate\b/g, "Placa"], [/\bZ-Move\b/g, "Movimiento Z"], [/\bWait\b(?=\s?\d)/g, "Espera"]],
    en: [[/\bDANO\b/g, "DMG"], [/\bNv\.(?=\s?\d)/g, "Lv."]],
  };
  // v725: o \b do JS só conhece A–Z, então "Miss" casava dentro de "Missões" (virava "Falhaões").
  // Troca cada \b por limites que entendem letras acentuadas.
  Object.keys(GLOSS).forEach((k) => {
    GLOSS[k] = GLOSS[k].map(([re, to]) => [new RegExp(re.source.replace(/^\\b/, "(?<![\\p{L}\\p{N}_])").replace(/\\b/g, "(?![\\p{L}\\p{N}_])"), "gu"), to]);
  });
  function gloss(r, Lg) { const g = GLOSS[Lg]; if (!g || !r) return r; for (const [re, to] of g) r = r.replace(re, to); return r; }
  function L(s, forceLang) {
    if (s == null) return s;
    s = String(s);
    const Lg = forceLang || lang();
    const c = cache[Lg] || (cache[Lg] = new Map());
    if (c.has(s)) return c.get(s);
    const lead = /^\s*/.exec(s)[0], trail = /\s*$/.exec(s)[0];
    let r = trCore(s, Lg, 0);
    if (r !== s) r = lead + norm(r) + trail;
    r = gloss(r, Lg);
    if (c.size > 6000) c.clear();
    c.set(s, r);
    return r;
  }
  window.PDRi18n = { L, exact, tpls, size: () => exact.size + tpls.length };
  window.L = L;

  // ------------------------------------------------ t(): chave inexistente → traduz o texto de reserva
  if (typeof t === "function") {
    const _t = t;
    const t2 = function (key, fallback, params) {
      const r = _t.apply(this, arguments);
      return typeof r === "string" ? L(r) : r;
    };
    try { t = t2; } catch (e) {}
    window.t = t2;
  }
  if (typeof localizeAbility === "function") {
    const _la = localizeAbility;
    const la2 = function (f) { return L(_la.apply(this, arguments)); };
    try { localizeAbility = la2; } catch (e) {}
    window.localizeAbility = la2;
  }
  if (typeof localizeMove === "function") {
    const _lm = localizeMove;
    const lm2 = function (n) { const r = _lm.apply(this, arguments); return r === n ? L(n) : r; };
    try { localizeMove = lm2; } catch (e) {}
    window.localizeMove = lm2;
  }

  // ------------------------------------------------ canvas
  try {
    const P = CanvasRenderingContext2D.prototype;
    ["fillText", "strokeText", "measureText"].forEach((fn) => {
      const o = P[fn];
      P[fn] = function (txt) { if (typeof txt === "string" && txt.length > 1) arguments[0] = L(txt); return o.apply(this, arguments); };
    });
  } catch (e) {}

  // ------------------------------------------------ alert / confirm / prompt
  ["alert", "confirm", "prompt"].forEach((fn) => {
    try { const o = window[fn]; if (typeof o === "function") window[fn] = function (m) { arguments[0] = L(m); return o.apply(window, arguments); }; } catch (e) {}
  });

  // ------------------------------------------------ DOM
  const SRC = new WeakMap(); // nó → texto original
  const OUTV = new WeakMap(); // nó → texto que nós escrevemos
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE"]);
  function trNode(n) {
    const p = n.parentNode;
    if (!p || SKIP_TAGS.has(p.nodeName) || p.isContentEditable || (p.closest && p.closest("[data-noi18n]"))) return;
    const cur = n.nodeValue;
    if (!cur || cur.length < 2 || !/[A-Za-zÀ-ÿ]/.test(cur)) return;
    let src = SRC.get(n);
    if (src == null || OUTV.get(n) !== cur) { src = cur; SRC.set(n, src); }
    const out = L(src);
    if (out !== cur) { OUTV.set(n, out); n.nodeValue = out; } else OUTV.set(n, cur);
  }
  const ATTRS = ["placeholder", "title", "aria-label", "alt"];
  function trAttrs(el) {
    if (!el.getAttribute) return;
    ATTRS.forEach((a) => {
      const v = el.getAttribute(a);
      if (!v || !/[A-Za-zÀ-ÿ]{2}/.test(v)) return;
      const key = "__i18n_" + a;
      let src = el[key];
      if (src == null || el[key + "_o"] !== v) { src = v; el[key] = v; }
      const o = L(src);
      el[key + "_o"] = o;
      if (o !== v) el.setAttribute(a, o);
    });
    if ((el.nodeName === "INPUT" && /^(button|submit)$/i.test(el.type)) && el.value) { const o = L(el.value); if (o !== el.value) el.value = o; }
  }
  function walkTree(root) {
    if (!root) return;
    if (root.nodeType === 3) { trNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (SKIP_TAGS.has(root.nodeName)) return; trAttrs(root); }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) trNode(n); else trAttrs(n); }
  }
  let busy = false;
  function start() {
    if (!document.body) return;
    walkTree(document.body);
    try { document.title = L(document.title); } catch (e) {}
    const mo = new MutationObserver((muts) => {
      if (busy) return;
      busy = true;
      try {
        for (const m of muts) {
          if (m.type === "characterData") trNode(m.target);
          else if (m.type === "attributes") trAttrs(m.target);
          else m.addedNodes.forEach(walkTree);
        }
      } finally { busy = false; }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    window.PDRi18n.retranslate = () => { cache.pt.clear(); cache.en.clear(); cache.es.clear(); walkTree(document.body); };
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  }
  // troca de língua: re-traduz o que já está na tela
  if (typeof setAppLanguage === "function") {
    const _s = setAppLanguage;
    const s2 = function () { const r = _s.apply(this, arguments); try { window.PDRi18n.retranslate && window.PDRi18n.retranslate(); } catch (e) {} return r; };
    try { setAppLanguage = s2; } catch (e) {}
    window.setAppLanguage = s2;
  }
})();
