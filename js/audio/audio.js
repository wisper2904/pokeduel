// ============================================================================
// WEB AUDIO SYNTHESIZER & POKÉMON DUEL OST ENGINE (SHOTA KAGEYAMA)
// ============================================================================
// 2. SOUND EFFECTS SYNTHESIZER
// ============================================================================
let sfxCtx = null;
let audioCtx = null;
function ensureAudio() {
  if (!sfxCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      sfxCtx = new AC();
      audioCtx = sfxCtx;
    }
  }
  if (sfxCtx && sfxCtx.state === "suspended") {
    sfxCtx.resume().then(() => {
      if (typeof BgmEngine !== "undefined" && BgmEngine.enabled && !BgmEngine.isPlaying) {
        BgmEngine.start();
      }
    }).catch(() => {});
  } else if (typeof BgmEngine !== "undefined" && BgmEngine.enabled && !BgmEngine.isPlaying && sfxCtx && sfxCtx.state === "running") {
    BgmEngine.start();
  }
}
function playSfx(type) {
  try {
    ensureAudio();
    if (!sfxCtx) return;
    const now = sfxCtx.currentTime;
    const osc = sfxCtx.createOscillator(), g = sfxCtx.createGain();
    osc.connect(g); g.connect(sfxCtx.destination);
    if (type === "tick") {
      osc.type = "square"; osc.frequency.setValueAtTime(780, now); osc.frequency.exponentialRampToValueAtTime(240, now + 0.028);
      g.gain.setValueAtTime(0.04, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
      osc.start(now); osc.stop(now + 0.03);
    } else if (type === "step") {
      osc.type = "square"; osc.frequency.setValueAtTime(260, now); osc.frequency.exponentialRampToValueAtTime(120, now + 0.065);
      g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      osc.start(now); osc.stop(now + 0.07);
    } else if (type === "jump") {
      osc.type = "square"; osc.frequency.setValueAtTime(280, now); osc.frequency.exponentialRampToValueAtTime(760, now + 0.22);
      g.gain.setValueAtTime(0.06, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now); osc.stop(now + 0.25);
    } else if (type === "portal") {
      osc.type = "sawtooth"; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(920, now + 0.26);
      g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now); osc.stop(now + 0.29);
    } else if (type === "hit") {
      osc.type = "square"; osc.frequency.setValueAtTime(160, now); osc.frequency.exponentialRampToValueAtTime(42, now + 0.24);
      g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now); osc.stop(now + 0.26);
    }
  } catch (e) {}
}




