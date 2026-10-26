// ============================================================================
// POKÉMON DUEL WEB - APP LIFECYCLE, MAIN LOOP & SERVICE WORKER
// ============================================================================

// PWA Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      console.log("[PWA] Service Worker registrado com sucesso (v6.3.0 Modular):", reg.scope);
    }).catch((err) => {
      console.warn("[PWA] Falha ao registrar Service Worker:", err);
    });
  });
}

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

  const unlockAndPlayBgm = () => {
    ensureAudio();
    if (typeof sfxCtx !== "undefined" && sfxCtx && sfxCtx.state === "suspended") {
      sfxCtx.resume().then(() => {
        if (typeof BgmEngine !== "undefined" && BgmEngine.enabled) {
          if (!BgmEngine.stepTimer || !BgmEngine.isPlaying) {
            BgmEngine.start();
          }
        }
      }).catch(() => {});
    } else if (typeof BgmEngine !== "undefined" && BgmEngine.enabled) {
      if (!BgmEngine.stepTimer || !BgmEngine.isPlaying) {
        BgmEngine.start();
      }
    }
  };

  ["pointerdown", "touchstart", "click", "mousedown", "keydown"].forEach(evt => {
    window.addEventListener(evt, unlockAndPlayBgm, { passive: true });
  });

  setTimeout(() => {
    try {
      ensureAudio();
      if (typeof BgmEngine !== "undefined" && BgmEngine.enabled) {
        if (!BgmEngine.stepTimer || !BgmEngine.isPlaying) {
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
    if (typeof initVerbatimCodeViewer === "function") initVerbatimCodeViewer();
    if (typeof renderHubAndCollection === "function") renderHubAndCollection();
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
