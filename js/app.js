// ============================================================================
// POKÉMON DUEL WEB - APP LIFECYCLE, MAIN LOOP & SERVICE WORKER
// ============================================================================

// PWA Service Worker Registration + Auto-Update (v685+)
// Procura versão nova ao abrir e sempre que o app volta para a tela.
// Quando o novo Service Worker assume, mostra "Nova versão disponível · Recarregar".
if ("serviceWorker" in navigator) {
  const hadControllerAtBoot = !!navigator.serviceWorker.controller;
  let pdrUpdateToastShown = false;
  let pdrLastUpdateCheck = 0;

  const showPdrUpdateToast = () => {
    if (pdrUpdateToastShown) return;
    pdrUpdateToastShown = true;
    const bar = document.createElement("div");
    bar.id = "pdr-new-version-toast";
    bar.setAttribute("role", "status");
    bar.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:10000;display:flex;align-items:center;gap:10px;padding:9px 10px 9px 14px;max-width:calc(100vw - 24px);background:linear-gradient(180deg,#0f172a,#020617);border:1.5px solid #4ade80;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.65),0 0 14px rgba(74,222,128,.35);color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;font-weight:800;";
    const inMatch = typeof state !== "undefined" && state.isMatchActive && !state.matchFinished;
    bar.innerHTML = `<span style="white-space:nowrap;">🔄 Nova versão disponível${inMatch ? '<span style="display:block;font-size:9.5px;font-weight:700;color:#94a3b8;">Recarregar encerra a partida atual</span>' : ""}</span>`;
    const btn = document.createElement("button");
    btn.textContent = "Recarregar";
    btn.style.cssText = "flex:none;background:linear-gradient(180deg,#22c55e,#15803d);border:1.5px solid #86efac;border-radius:8px;padding:7px 12px;color:#fff;font-size:11.5px;font-weight:900;cursor:pointer;";
    btn.onclick = () => { btn.disabled = true; btn.textContent = "..."; window.location.reload(); };
    const close = document.createElement("button");
    close.textContent = "✕";
    close.setAttribute("aria-label", "Depois");
    close.style.cssText = "flex:none;background:transparent;border:none;color:#94a3b8;font-size:13px;cursor:pointer;padding:4px 6px;";
    close.onclick = () => { bar.remove(); pdrUpdateToastShown = false; };
    bar.appendChild(btn);
    bar.appendChild(close);
    document.body.appendChild(bar);
    try { if (typeof playSfx === "function") playSfx("portal"); } catch (e) {}
  };

  // O sw.js faz skipWaiting + clients.claim: quando a versão nova assume, o controller muda.
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadControllerAtBoot) showPdrUpdateToast();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).then((reg) => {
      console.log("[PWA] Service Worker registrado:", reg.scope);
      // Já existe uma versão nova esperando (ex.: aba antiga aberta)
      if (reg.waiting && navigator.serviceWorker.controller) showPdrUpdateToast();

      const checkForUpdate = () => {
        const now = Date.now();
        if (now - pdrLastUpdateCheck < 30000) return; // no máximo 1 checagem a cada 30 s
        pdrLastUpdateCheck = now;
        reg.update().catch(() => {});
      };
      checkForUpdate();
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });
      window.addEventListener("focus", checkForUpdate);
      window.addEventListener("online", checkForUpdate);
    }).catch((err) => {
      console.warn("[PWA] Falha ao registrar Service Worker:", err);
    });
  });
}

// Modo desenvolvedor: mostra ferramentas como o publicador do GitHub Pages
try { if (localStorage.getItem("pdr_dev_mode") === "1") document.addEventListener("DOMContentLoaded", () => document.body.classList.add("pdr-dev-mode")); } catch (e) {}

// BGM Auto-start and Audio Unlocking
(function initBgmEngineAutoStart() {
  if (typeof BgmEngine !== "undefined") {
    try {
      const savedPref = localStorage.getItem("pokeduel_bgm_enabled");
      if (savedPref !== null) {
        BgmEngine.enabled = (savedPref === "1");
        bgmEnabled = BgmEngine.enabled;
      }
      const savedSrc = localStorage.getItem("pokeduel_bgm_source");
      if (savedSrc === "youtube") {
        BgmEngine.audioSource = "youtube";
      } else {
        BgmEngine.audioSource = "webaudio";
      }
    } catch (e) {}
    BgmEngine.syncUi();
  }

  const userUnlockEvents = ["pointerdown", "touchstart", "click", "mousedown", "keydown"];
  let audioUnlocked = false;

  const unlockAndPlayBgm = () => {
    ensureAudio();
    if (!audioUnlocked) {
      audioUnlocked = true;
      userUnlockEvents.forEach(evt => {
        window.removeEventListener(evt, unlockAndPlayBgm);
      });
    }
    if (typeof BgmEngine !== "undefined" && BgmEngine.enabled) {
      if (BgmEngine.audioSource === "youtube") {
        if (!BgmEngine.ytPlaying && !BgmEngine.isPlaying) {
          BgmEngine.start();
        }
      } else {
        if (!BgmEngine.isPlaying) {
          BgmEngine.start();
        }
      }
    }
  };

  userUnlockEvents.forEach(evt => {
    window.addEventListener(evt, unlockAndPlayBgm, { passive: true });
  });

  setTimeout(() => {
    try {
      ensureAudio();
      if (typeof BgmEngine !== "undefined" && BgmEngine.enabled) {
        if (!BgmEngine.isPlaying) {
          BgmEngine.start();
        }
      }
    } catch (e) {}
  }, 100);
})();

// Master DOM Ready Bootstrap
window.addEventListener("DOMContentLoaded", () => {
  console.log("⚡ [PokeDuel] Sistema Modular v6.3.0 Inicializado!");
  try {
    if (typeof updateAllLocalizedUI === "function") updateAllLocalizedUI();
    if (typeof initVerbatimCodeViewer === "function") initVerbatimCodeViewer();
    if (typeof renderHubAndCollection === "function") renderHubAndCollection();
    if (typeof renderWeeklyTypeBuffHubBadge === "function") renderWeeklyTypeBuffHubBadge();
    if (typeof updateDailyBonusButtonUI === "function") updateDailyBonusButtonUI();
    if (typeof syncEnergyUI === "function") syncEnergyUI();
    if (typeof injectCloudSaveAndGitHubPagesCards === "function") injectCloudSaveAndGitHubPagesCards();
    if (typeof detectAndApplyDeviceLayout === "function") detectAndApplyDeviceLayout();
    if (typeof setupPlatesBar === "function") setupPlatesBar();
    if (typeof updatePlatesDisplay === "function") updatePlatesDisplay();
  } catch (e) {
    console.error("[PokeDuel] Erro na inicialização DOM:", e);
  }
});
