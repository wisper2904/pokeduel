// ============================================================================
// v717 · Tela de Configurações refeita (estilo menu de jogo)
//  - Abas no topo: Áudio · Vídeo · Jogo · Conta · Sobre. Cada opção é uma linha (ícone, nome, descrição) com o
//    controle à direita: chave liga/desliga, barra de volume ou seletor de opções.
//  - Os controles antigos do #dtab-menu continuam existindo, escondidos em #st-legacy: as linhas novas chamam as
//    mesmas funções (ou clicam no botão antigo), então nada que dependia dos ids antigos quebra.
//  - Blocos grandes (Save na Nuvem, Modos/Hotéis, Personalizar Sprites, banner do jogo) são movidos para dentro
//    das abas novas, sem copiar: os ids e eventos continuam os mesmos.
// Carrega depois de icons.js. API: window.PDRSettings { render, open(tab) }.
// ============================================================================
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const tt = (k, fb) => (typeof t === "function" ? t(k, fb) : fb);
  const sfx = (k) => { try { if (window.PDRSound) PDRSound.play(k); else playSfx("tick"); } catch (e) {} };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const V = { tab: (() => { try { return localStorage.getItem("pdr_settings_tab") || "audio"; } catch (e) { return "audio"; } })() };
  const TABS = [["audio", "🔊", "Áudio"], ["video", "🎨", "Vídeo"], ["game", "🎮", "Jogo"], ["account", "👤", "Conta"], ["about", "ℹ️", "Sobre"]];

  const CSS = `
  #st-root{color:#e2e8f0;font-family:inherit;padding:2px 2px 14px}
  #st-root .st-top{display:flex;align-items:center;gap:10px;padding:8px 10px;margin-bottom:8px;background:linear-gradient(180deg,#1e293b,#0b1220);border:2px solid #334155;border-radius:12px;box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
  #st-root .st-top h2{margin:0;font-size:17px;font-weight:900;letter-spacing:.06em;color:#facc15;text-shadow:0 2px 0 #713f12;flex:1}
  #st-root .st-me{display:flex;align-items:center;gap:7px;background:#020617;border:1.5px solid #1e3a8a;border-radius:99px;padding:3px 10px 3px 3px;cursor:pointer;max-width:58%}
  #st-root .st-me b{width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#60a5fa,#1e3a8a);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0}
  #st-root .st-me span{font-size:10.5px;font-weight:800;color:#bfdbfe;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #st-root .st-tabs{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:4px;margin-bottom:10px;background:#020617;border:2px solid #1e293b;border-radius:12px}
  #st-root .st-tab{border:0;border-radius:9px;background:transparent;color:#94a3b8;font-weight:900;font-size:10px;padding:6px 2px 5px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;transition:background .15s,color .15s}
  #st-root .st-tab i{font-style:normal;font-size:18px;line-height:1;filter:grayscale(.6);opacity:.8}
  #st-root .st-tab.on{background:linear-gradient(180deg,#facc15,#ca8a04);color:#1c1917;box-shadow:0 2px 0 #713f12,0 0 12px rgba(250,204,21,.35)}
  #st-root .st-tab.on i{filter:none;opacity:1}
  #st-root .st-pane{display:none}#st-root .st-pane.on{display:block;animation:stIn .18s ease-out}
  @keyframes stIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  #st-root .st-grp{margin:0 0 12px}
  #st-root .st-gt{font-size:10.5px;font-weight:900;letter-spacing:.12em;color:#64748b;margin:0 4px 5px;text-transform:uppercase}
  #st-root .st-box{background:linear-gradient(180deg,#0f172a,#0b1220);border:1.5px solid #1e293b;border-radius:12px;overflow:hidden}
  #st-root .st-row{display:flex;align-items:center;gap:10px;padding:10px 11px;min-height:46px;border-top:1px solid #1e293b}
  #st-root .st-row:first-child{border-top:0}
  #st-root .st-row.tap{cursor:pointer}#st-root .st-row.tap:active{background:#1e293b}
  #st-root .st-ic{width:30px;height:30px;border-radius:9px;background:#1e293b;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
  #st-root .st-tx{flex:1;min-width:0}
  #st-root .st-tx b{display:block;font-size:12.5px;font-weight:900;color:#f8fafc}
  #st-root .st-tx small{display:block;font-size:10px;color:#94a3b8;line-height:1.3;margin-top:1px}
  #st-root .st-chev{color:#64748b;font-size:18px;font-weight:900}
  #st-root .st-sw{position:relative;width:50px;height:28px;border-radius:99px;background:#334155;border:2px solid #475569;flex-shrink:0;cursor:pointer;transition:background .15s}
  #st-root .st-sw::after{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#cbd5e1;box-shadow:0 2px 3px rgba(0,0,0,.5);transition:left .15s}
  #st-root .st-sw.on{background:linear-gradient(180deg,#4ade80,#16a34a);border-color:#86efac}
  #st-root .st-sw.on::after{left:24px;background:#fff}
  #st-root .st-sl{display:flex;align-items:center;gap:8px;padding:0 11px 11px 51px}
  #st-root .st-sl input{flex:1;accent-color:#facc15;height:22px}
  #st-root .st-sl output{width:38px;text-align:right;font-weight:900;font-size:11px;color:#facc15}
  #st-root .st-seg{display:flex;gap:3px;background:#020617;border:1.5px solid #1e293b;border-radius:10px;padding:3px;flex-shrink:0}
  #st-root .st-seg button{border:0;border-radius:7px;background:transparent;color:#94a3b8;font-weight:900;font-size:10px;padding:6px 8px;cursor:pointer;white-space:nowrap}
  #st-root .st-seg button.on{background:#2563eb;color:#fff;box-shadow:0 0 8px rgba(37,99,235,.5)}
  #st-root .st-wide{padding:0 11px 11px}
  #st-root .st-wide .st-seg{width:100%;box-sizing:border-box}
  #st-root .st-wide .st-seg button{flex:1;padding:8px 4px;font-size:11px}
  #st-root .st-arena{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:0 11px 11px}
  #st-root .st-arena button{border:2px solid #334155;border-radius:10px;padding:10px 4px 7px;background:var(--bg);color:#fff;font-weight:900;font-size:10px;cursor:pointer;text-shadow:0 1px 2px #000;display:flex;flex-direction:column;align-items:center;gap:3px}
  #st-root .st-arena button i{font-style:normal;font-size:19px}
  #st-root .st-arena button.on{border-color:#facc15;box-shadow:0 0 0 2px rgba(250,204,21,.35),0 0 12px rgba(250,204,21,.35)}
  #st-root .st-lang{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:0 11px 11px}
  #st-root .st-lang button{border:2px solid #334155;border-radius:10px;background:#0b1220;color:#e2e8f0;font-weight:900;font-size:11px;padding:9px 4px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px}
  #st-root .st-lang button i{font-style:normal;font-size:22px}
  #st-root .st-lang button.on{border-color:#facc15;background:linear-gradient(180deg,#1e293b,#0b1220);color:#facc15}
  #st-root .st-btns{display:flex;gap:6px;padding:0 11px 11px}
  #st-root .st-btn{flex:1;border-radius:10px;border:2px solid #fef9c3;background:linear-gradient(180deg,#fde047,#ca8a04);color:#1c1917;font-weight:900;font-size:11.5px;padding:9px 6px;cursor:pointer;box-shadow:0 3px 0 #713f12}
  #st-root .st-btn:active{transform:translateY(2px);box-shadow:0 1px 0 #713f12}
  #st-root .st-btn.blue{border-color:#bfdbfe;background:linear-gradient(180deg,#60a5fa,#1d4ed8);color:#fff;box-shadow:0 3px 0 #1e3a8a}
  #st-root .st-btn.gray{border-color:#64748b;background:linear-gradient(180deg,#334155,#1e293b);color:#e2e8f0;box-shadow:0 3px 0 #0f172a}
  #st-root .st-btn.red{border-color:#fecaca;background:linear-gradient(180deg,#f87171,#b91c1c);color:#fff;box-shadow:0 3px 0 #7f1d1d}
  #st-root .st-host>*{margin:0!important;border-radius:12px!important}
  #st-root .st-host .card{box-shadow:none}
  #st-root .st-ver{display:flex;align-items:center;gap:8px;padding:10px 11px}
  #st-root .st-ver .pill{margin-left:auto;font-size:9.5px;font-weight:900;color:#4ade80;border:1.5px solid #166534;background:#052e16;border-radius:99px;padding:2px 8px}
  #st-root .st-note{font-size:10px;color:#4ade80;padding:0 11px 10px;min-height:0}
  #st-root .st-note:empty{display:none}
  #st-legacy{display:none!important}
  #st-root .st-quests>strong,#st-root .st-quests>div:nth-child(2){display:none!important}
  #st-root .st-quests{padding:10px 11px!important;background:linear-gradient(180deg,#0f172a,#0b1220)!important;border:1.5px solid #1e293b!important}
  `;

  // ------------------------------------------------------------------ leitura do estado atual
  const legacyBtn = (sel) => { const l = $("st-legacy"); return l ? l.querySelector(sel) : null; };
  const clickLegacy = (sel) => { const b = legacyBtn(sel); if (b) b.click(); return !!b; };
  const lang = () => (typeof currentAppLanguage !== "undefined" ? currentAppLanguage : (localStorage.getItem("pokeduel_language") || "pt"));
  const bgmOn = () => (typeof bgmEnabled !== "undefined" ? !!bgmEnabled : true);
  const bgmSrc = () => (typeof BgmEngine !== "undefined" && BgmEngine.audioSource) || "webaudio";
  const sfxS = () => (window.PDRSound && PDRSound.settings) || { on: true, vol: 0.8 };
  const juice = () => (window.Juice && Juice.cfg) || {};
  const layout = () => { try { return localStorage.getItem("pdr_device_layout_pref") || "auto"; } catch (e) { return "auto"; } };
  const pixel = () => window.pixelArtMode || "16bit";
  const surface = () => (typeof state !== "undefined" && state.surface) || "crystal";

  // ------------------------------------------------------------------ peças da tela
  const row = (ic, title, desc, ctrl, attrs) => `<div class="st-row ${attrs && attrs.tap ? "tap" : ""}" ${attrs && attrs.tap ? `data-act="${attrs.tap}"` : ""}><span class="st-ic">${ic}</span><div class="st-tx"><b>${esc(tt(title, title))}</b>${desc ? `<small>${esc(tt(desc, desc))}</small>` : ""}</div>${ctrl || ""}</div>`;
  const sw = (key) => `<span class="st-sw" data-sw="${key}" role="switch"></span>`;
  const seg = (key, opts) => `<div class="st-seg" data-seg="${key}">${opts.map(([v, l]) => `<button data-v="${v}">${esc(tt(l, l))}</button>`).join("")}</div>`;
  const grp = (title, inner) => `<div class="st-grp"><div class="st-gt">${esc(tt(title, title))}</div><div class="st-box">${inner}</div></div>`;
  const ARENAS = [["crystal", "💎", "Cristal", "linear-gradient(135deg,#312e81,#0f172a)"], ["banana", "🍌", "Dourada", "linear-gradient(135deg,#a16207,#422006)"], ["marble", "🏛️", "Mármore", "linear-gradient(135deg,#94a3b8,#334155)"],
    ["wood", "🪵", "Madeira", "linear-gradient(135deg,#92400e,#451a03)"], ["stone", "🌋", "Vulcão", "linear-gradient(135deg,#7f1d1d,#1c1917)"], ["habitats", "🌿", "Habitats", "linear-gradient(135deg,#166534,#052e16)"]];

  function panes() {
    return {
      audio:
        grp("Música", row("🎵", "Música de fundo", "Trilha sonora durante o jogo.", sw("bgm")) +
          row("🎛️", "Fonte da música", "Web Audio funciona offline; YouTube toca a trilha original.", seg("bgmsrc", [["webaudio", "Web Audio"], ["youtube", "YouTube"]]))) +
        grp("Efeitos sonoros", row("🔊", "Sons do jogo", "Roleta, batalhas, plates e menus.", sw("sfx")) +
          `<div class="st-sl"><span>🔈</span><input type="range" min="0" max="100" step="5" data-sl="vol"><output data-out="vol"></output></div>` +
          row("📲", "Vibração", "Vibra o celular em impactos e vitórias.", sw("haptics"))),
      video:
        grp("Gráficos", row("✨", "Qualidade", "16-Bit é o padrão; Suave deixa mais nítido.", seg("pixel", [["8bit", "8-Bit"], ["16bit", "16-Bit"], ["hd", "Suave"]])) +
          row("💥", "Efeitos visuais", "Partículas, números de dano e flashes.", sw("fx")) +
          row("📳", "Tremor de tela", "Sacode a tela nos golpes fortes.", sw("shake"))) +
        grp("Tela", row("📱", "Formato da tela", "Automático detecta celular ou PC.", "") +
          `<div class="st-wide">${seg("layout", [["auto", "Automático"], ["mobile", "Celular"], ["pc", "PC"]])}</div><div class="st-note" id="st-layout-note"></div>`) +
        grp("Tabuleiro", `<div class="st-row" style="border:0"><span class="st-ic">🎲</span><div class="st-tx"><b>${esc(tt("Tema da arena", "Tema da arena"))}</b><small>${esc(tt("Fundo do tabuleiro nas partidas.", "Fundo do tabuleiro nas partidas."))}</small></div></div>
          <div class="st-arena">${ARENAS.map(([k, i, n, bg]) => `<button data-arena="${k}" style="--bg:${bg}"><i>${i}</i>${esc(tt(n, n))}</button>`).join("")}</div>`),
      game:
        grp("Idioma", `<div class="st-row" style="border:0"><span class="st-ic">🌐</span><div class="st-tx"><b>${esc(tt("Idioma do jogo", "Idioma do jogo"))}</b><small>Language · Idioma</small></div></div>
          <div class="st-lang">${[["pt", "🇧🇷", "Português"], ["en", "🇺🇸", "English"], ["es", "🇪🇸", "Español"]].map(([k, f, n]) => `<button data-lang="${k}"><i>${f}</i>${n}</button>`).join("")}</div>`) +
        grp("Aprender a jogar", row("🎓", "Partida de apresentação", "Rever o tutorial jogável.", `<span class="st-chev">›</span>`, { tap: "tutorial" }) +
          row("🧭", "Tour do Início", "Guia rápido pelas abas (5 etapas).", `<span class="st-chev">›</span>`, { tap: "tour" })) +
        grp("Modos de jogo", row("🌐", "Multiplayer online", "Duelar com outra pessoa (P2P).", `<span class="st-chev">›</span>`, { tap: "p2p" }) +
          row("👥", "2 jogadores no mesmo aparelho", "Passe o celular a cada turno.", `<span class="st-chev">›</span>`, { tap: "local" })) +
        `<div class="st-grp"><div class="st-gt">${esc(tt("Campanha e personalização", "Campanha e personalização"))}</div><div class="st-host" id="st-host-game"></div></div>`,
      account:
        grp("Perfil", `<div class="st-row"><span class="st-ic">🧢</span><div class="st-tx"><b id="st-prof-name">—</b><small id="st-prof-sub"></small></div><span class="st-ver"><span class="pill" id="st-prof-id" style="color:#93c5fd;border-color:#1e3a8a;background:#020617"></span></span></div>
          <div class="st-btns"><button class="st-btn" data-act="profile">✏️ ${esc(tt("Editar perfil", "Editar perfil"))}</button><button class="st-btn red" data-act="resetprof">🔄 ${esc(tt("Zerar perfil", "Zerar perfil"))}</button></div>`) +
        `<div class="st-grp"><div class="st-gt">${esc(tt("Save na nuvem", "Save na nuvem"))}</div><div class="st-host" id="st-host-cloud"></div></div>`,
      about:
        `<div class="st-grp"><div class="st-host" id="st-host-logo"></div></div>` +
        grp("Versão", `<div class="st-ver"><span class="st-ic">📦</span><div class="st-tx"><b id="st-ver-lbl">—</b><small>${esc(tt("Atualizações chegam sozinhas quando houver internet.", "Atualizações chegam sozinhas quando houver internet."))}</small></div><span class="pill" id="st-ver-pill">ONLINE</span></div>
          <div class="st-btns"><button class="st-btn blue" data-act="notes">📢 ${esc(tt("Notas da versão", "Notas da versão"))}</button><button class="st-btn" data-act="update">🔄 ${esc(tt("Atualizar agora", "Atualizar agora"))}</button></div>`) +
        grp("Sair", `<div class="st-btns" style="padding-top:11px"><button class="st-btn red" data-act="exit">🚪 ${esc(tt("Sair do jogo", "Sair do jogo"))}</button></div>`)
    };
  }

  // ------------------------------------------------------------------ montagem
  function mount() {
    const tab = $("dtab-menu"); if (!tab) return null;
    let root = $("st-root");
    if (root) {
      // algo novo foi injetado no menu depois da montagem → vai para o legado
      const leg = $("st-legacy");
      Array.from(tab.children).forEach((c) => { if (c !== root && c !== leg) leg.appendChild(c); });
      return root;
    }
    if (!$("st-css")) { const st = document.createElement("style"); st.id = "st-css"; st.textContent = CSS; document.head.appendChild(st); }
    let legacy = $("st-legacy");
    if (!legacy) { legacy = document.createElement("div"); legacy.id = "st-legacy"; }
    Array.from(tab.children).forEach((c) => { if (c !== legacy) legacy.appendChild(c); });
    root = document.createElement("div"); root.id = "st-root";
    const P = panes();
    root.innerHTML = `<div class="st-top"><h2>⚙️ ${esc(tt("CONFIGURAÇÕES", "CONFIGURAÇÕES"))}</h2><div class="st-me" data-act="profile"><b>🧢</b><span id="st-me-lbl">—</span></div></div>
      <div class="st-tabs">${TABS.map(([k, i, n]) => `<button class="st-tab" data-tab="${k}"><i>${i}</i>${esc(tt(n, n))}</button>`).join("")}</div>
      ${TABS.map(([k]) => `<div class="st-pane" data-pane="${k}">${P[k]}</div>`).join("")}`;
    tab.appendChild(root); tab.appendChild(legacy);
    // blocos movidos inteiros (ids e eventos continuam)
    const hostGame = $("st-host-game");
    const q = legacy.querySelector("#msec-quests");
    if (q) { q.style.marginBottom = "8px"; q.classList.add("st-quests"); hostGame.appendChild(q); }
    const sp = legacy.querySelector("#live-sprite-target"), det = sp ? sp.closest("details") : null; if (det) { const box = document.createElement("div"); box.className = "card st-spr"; box.style.cssText = "padding:9px 10px;background:#0b1220;border:1.5px solid #1e293b"; box.appendChild(det); hostGame.appendChild(box); }
    const cloud = legacy.querySelector("#cfg-cross-save-pwa-card"); if (cloud) $("st-host-cloud").appendChild(cloud);
    const logo = legacy.querySelector("#cfg-banana-logo-banner"); if (logo) $("st-host-logo").appendChild(logo);
    bind(root);
    return root;
  }

  function bind(root) {
    root.addEventListener("click", (e) => {
      const tb = e.target.closest("[data-tab]");
      if (tb) { V.tab = tb.dataset.tab; try { localStorage.setItem("pdr_settings_tab", V.tab); } catch (x) {} sfx("tick"); refresh(); return; }
      const s = e.target.closest("[data-sw]");
      if (s) { toggle(s.dataset.sw); refresh(); return; }
      const sg = e.target.closest("[data-seg] button");
      if (sg) { choose(sg.parentNode.dataset.seg, sg.dataset.v); refresh(); return; }
      const ar = e.target.closest("[data-arena]");
      if (ar) { try { selectArenaThemeFromMenu(ar.dataset.arena); } catch (x) {} refresh(); return; }
      const lg = e.target.closest("[data-lang]");
      if (lg) { if (lg.dataset.lang !== lang()) { try { setAppLanguage(lg.dataset.lang); } catch (x) {} } sfx("confirm"); setTimeout(refresh, 50); return; }
      const a = e.target.closest("[data-act]");
      if (a) act(a.dataset.act);
    });
    root.addEventListener("input", (e) => {
      if (e.target.dataset.sl === "vol") { const o = root.querySelector('[data-out="vol"]'); if (o) o.textContent = e.target.value + "%"; }
    });
    root.addEventListener("change", (e) => {
      if (e.target.dataset.sl === "vol") { try { PDRSound.setVolume(e.target.value / 100); PDRSound.play("confirm"); } catch (x) {} syncLegacySfx(); }
    });
  }
  function syncLegacySfx() {
    const on = legacyBtn("#pdr-sfx-on"), vol = legacyBtn("#pdr-sfx-vol"), s = sfxS();
    if (on) on.checked = !!s.on; if (vol) vol.value = Math.round((s.vol || 0) * 100);
  }
  function toggle(k) {
    if (k === "bgm") { if (!clickLegacy("#menu-bgm-btn")) { try { toggleWebAudioBgm(); } catch (e) {} } }
    else if (k === "sfx") { try { PDRSound.setEnabled(!sfxS().on); if (sfxS().on) PDRSound.play("confirm"); } catch (e) {} syncLegacySfx(); }
    else if (["fx", "shake", "haptics"].includes(k) && window.Juice) {
      Juice.cfg[k] = !Juice.cfg[k]; try { Juice.saveCfg(); } catch (e) {}
      if (k === "haptics" && Juice.cfg.haptics && navigator.vibrate) navigator.vibrate(40);
      sfx("tick");
    }
  }
  function choose(k, v) {
    sfx("tick");
    if (k === "bgmsrc") { if (bgmSrc() !== v) { if (!clickLegacy("#menu-bgm-source-btn")) { try { BgmEngine.cycleAudioSource(); } catch (e) {} } } }
    else if (k === "pixel") { for (let i = 0; i < 3 && pixel() !== v; i++) { if (!clickLegacy("#pixel-mode-btn")) { try { cyclePixelArtMode(); } catch (e) {} } } }
    else if (k === "layout") {
      for (let i = 0; i < 3 && layout() !== v; i++) { if (!clickLegacy("#menu-layout-mode-btn")) { try { cycleDeviceLayoutMode(); } catch (e) {} } }
      const m = legacyBtn("#menu-layout-msg"), n = $("st-layout-note"); if (m && n) n.textContent = m.textContent;
    }
  }
  function act(a) {
    sfx("tick");
    const tut = legacyBtn("#cfg-replay-tutorial-card");
    const tbtn = tut ? tut.querySelectorAll("button") : [];
    const call = (fn) => { try { if (typeof window[fn] === "function") window[fn](); else eval(fn + "()"); } catch (e) { console.warn("[settings]", fn, e); } };
    if (a === "tutorial") { if (tbtn[0]) tbtn[0].click(); }
    else if (a === "tour") { if (tbtn[1]) tbtn[1].click(); }
    else if (a === "p2p") { try { switchDrawerTab("p2p"); } catch (e) {} }
    else if (a === "local") call("startLocalPassAndPlayMatch");
    else if (a === "profile") call("openPlayerProfileModal");
    else if (a === "resetprof") call("confirmResetIndividualProfile");
    else if (a === "notes") call("openChangelogModal");
    else if (a === "update") call("triggerInAppUpdateAction");
    else if (a === "exit") call("openExitGameModal");
  }

  // ------------------------------------------------------------------ valores atuais
  function refresh() {
    const root = $("st-root"); if (!root) return;
    root.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === V.tab));
    root.querySelectorAll("[data-pane]").forEach((p) => p.classList.toggle("on", p.dataset.pane === V.tab));
    const s = sfxS(), j = juice();
    const swv = { bgm: bgmOn(), sfx: !!s.on, fx: !!j.fx, shake: !!j.shake, haptics: !!j.haptics };
    root.querySelectorAll("[data-sw]").forEach((el) => { el.classList.toggle("on", !!swv[el.dataset.sw]); el.setAttribute("aria-checked", swv[el.dataset.sw] ? "true" : "false"); });
    const segv = { bgmsrc: bgmSrc(), pixel: pixel(), layout: layout() };
    root.querySelectorAll("[data-seg]").forEach((el) => el.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.v === segv[el.dataset.seg])));
    const vol = root.querySelector('[data-sl="vol"]'), out = root.querySelector('[data-out="vol"]');
    if (vol && document.activeElement !== vol) vol.value = Math.round((s.vol != null ? s.vol : 0.8) * 100);
    if (out && vol) out.textContent = vol.value + "%";
    if (vol) vol.disabled = !s.on;
    root.querySelectorAll("[data-arena]").forEach((b) => b.classList.toggle("on", b.dataset.arena === surface()));
    root.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang()));
    // perfil e versão (lidos dos campos antigos, que o jogo continua atualizando)
    const sum = legacyBtn("#menu-profile-summary-lbl"), idp = legacyBtn("#menu-profile-id-pill");
    const txt = sum ? sum.textContent.trim() : "";
    const name = txt.split(" · ")[0] || "—";
    const setT = (id, v) => { const el = $(id); if (el && el.textContent !== v) el.textContent = v; };
    setT("st-prof-name", name); setT("st-prof-sub", txt.split(" · ").slice(1).join(" · ")); setT("st-me-lbl", name);
    setT("st-prof-id", idp ? idp.textContent.trim() : "");
    const leg = $("st-legacy");
    if (leg) {
      const verCard = Array.from(leg.querySelectorAll(".card")).find((c) => c.querySelector('[onclick="openChangelogModal()"]'));
      if (verCard) {
        const line = Array.from(verCard.querySelectorAll("div")).map((x) => x.textContent.replace(/\s+/g, " ").trim()).filter((x) => /v\d+\.\d+/.test(x) && /Build/i.test(x)).sort((a, b) => a.length - b.length)[0];
        if (line) setT("st-ver-lbl", line);
        const pill = Array.from(verCard.querySelectorAll("span")).find((x) => /ONLINE|OFFLINE/i.test(x.textContent));
        if (pill) setT("st-ver-pill", pill.textContent.trim());
      }
    }
  }
  function render() { if (mount()) refresh(); }
  function open(tabKey) { if (tabKey) V.tab = tabKey; try { switchDrawerTab("menu"); } catch (e) {} render(); }

  // ------------------------------------------------------------------ integração
  if (typeof switchDrawerTab === "function") {
    const _sw = switchDrawerTab;
    const s2 = function (tabId) { const o = _sw.apply(this, arguments); if (tabId === "menu") { try { render(); } catch (e) { console.warn("[settings]", e); } } return o; };
    try { switchDrawerTab = s2; } catch (e) {}
    window.switchDrawerTab = s2;
  }
  if (typeof setAppLanguage === "function") {
    const _sl = setAppLanguage;
    const l2 = function () {
      const o = _sl.apply(this, arguments);
      // reconstrói os textos das abas no novo idioma (os blocos movidos voltam para o legado e são reposicionados)
      try {
        const root = $("st-root"), leg = $("st-legacy");
        if (root && leg) {
          ["#msec-quests", "#cfg-cross-save-pwa-card", "#cfg-banana-logo-banner"].forEach((sel) => { const n = root.querySelector(sel); if (n) leg.appendChild(n); });
          const hb = root.querySelector("#st-host-game .st-spr"); if (hb) { const d = hb.querySelector("details"); if (d) leg.appendChild(d); }
          root.remove(); render();
        }
      } catch (e) { console.warn("[settings lang]", e); }
      return o;
    };
    try { setAppLanguage = l2; } catch (e) {}
    window.setAppLanguage = l2;
  }
  setInterval(() => { const tab = $("dtab-menu"); if (tab && tab.style.display !== "none" && $("st-root")) refresh(); }, 1000);
  window.PDRSettings = { render, open, refresh, state: V };
})();
