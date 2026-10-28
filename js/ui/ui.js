// ============================================================================
// MODDER WORKSHOP & LIVE ASSET HOT-SWAP ENGINE
// ============================================================================
function hotSwapPokemonSprite(file) {
  if (!file) return;
  const sel = document.getElementById("live-sprite-target");
  const spriteKey = sel ? sel.value : "charizard";
  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUri = ev.target.result;
    if (AUTHENTIC_FIG_SPRITES[spriteKey]) AUTHENTIC_FIG_SPRITES[spriteKey].uri = dataUri;
    const img = new Image();
    img.onload = () => {
      loadedFigImages[spriteKey] = img;
      renderHubAndCollection();
      renderFusionChamber();
      const msg = document.getElementById("modder-status-msg");
      if (msg) msg.textContent = `✅ Sprite [${spriteKey}.png] atualizado ao vivo no tabuleiro e no menu!`;
    };
    img.src = dataUri;
  };
  reader.readAsDataURL(file);
}

function hotSwapBoardTexture(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    cleanBoardImg.src = ev.target.result;
    const msg = document.getElementById("modder-status-msg");
    if (msg) msg.textContent = `✅ Textura do Tabuleiro atualizada ao vivo (${file.name})!`;
  };
  reader.readAsDataURL(file);
}

function initVerbatimCodeViewer() {
  const spSel = document.getElementById("live-sprite-target");
  if (spSel) {
    spSel.innerHTML = Object.keys(AUTHENTIC_FIG_SPRITES).map(k => `<option value="${k}">sprite_${k}.png</option>`).join("");
  }
  const sel = document.getElementById("repo-file-select");
  if (!sel) return;
  const keys = Object.keys(UPLOADED_REPO_FILES).sort();
  sel.innerHTML = keys.map(k => `<option value="${k}">${k} (${UPLOADED_REPO_FILES[k].length} B)</option>`).join("");
  if (keys.length > 0) showVerbatimRepoFile(keys[0]);
}
function showVerbatimRepoFile(key) {
  const pre = document.getElementById("repo-file-content");
  if (pre && UPLOADED_REPO_FILES[key]) pre.textContent = UPLOADED_REPO_FILES[key];
}

// ============================================================================
// MODDER WORKSHOP & LIVE ASSET HOT-SWAP ENGINE
// ============================================================================


// ============================================================================
// CARMONTE ISLAND UI, TOUCH CONTROLS, DECKS, SHOP & CLOUD SAVE
// ============================================================================
// ============================================================================
// 10. CARMONTE ISLAND HUB, DECKS, FUSION, MONACO 7.0.16 & INTUITIVE P2P ENGINE
// ============================================================================
function openDrawer(tab) {
  document.getElementById("drawer-modal").classList.add("show");
  renderHubAndCollection();
  if (tab) switchDrawerTab(tab);
}
function closeDrawer() { document.getElementById("drawer-modal").classList.remove("show"); }

// (FIGURE_ABILITIES_DB loaded from js/data/figures.js)

let currentEditingDeckSlot = 0;
let activeDeckPresetIdx = 0;
let figureCaseFilter = "ALL";
let currentDetailedFigIdx = 0;
const DECK_PRESETS = [
  [3, 16, 4, 1, 0, 2],       // Deck 1: Starter & Greninja EX
  [7, 15, 13, 14, 5, 8],     // Deck 2: Tropical & Meta EX
  [9, 10, 11, 12, 13, 15],   // Deck 3: [UX] Ultra & Origin Megas
  [16, 13, 10, 9, 4, 1],     // Deck 4: 3-MP High-Speed Runner Rush
  [17, 20, 21, 22, 19, 29],  // Deck 5: Mew EX & Legendary Bird Trio + Mega Rayquaza!
  [26, 24, 27, 28, 29, 17],  // Deck 6: Ultra Burst (Lunala UX, Mega Gengar, Mega Zard X, Deoxys A)
  [18, 19, 23, 16, 5, 2],    // Deck 7: Water & Gyarados Evolution + Blastoise EX
  [3, 2, 4, 6, 1, 18]        // Deck 8: Silver Moon Hall (UC & Under with Magikarp)
];

function getRarityBadgeHtml(rar) {
  if (rar === "UX") return `<span class="ux-rainbow-badge">UX</span>`;
  if (rar === "EX") return `<span class="ex-gold-badge">EX</span>`;
  return `<span style="background:#334155; color:#e2e8f0; font-weight:900; padding:1px 5px; border-radius:99px; font-size:8px;">${rar}</span>`;
}

function expandWheelSliceFromModal(figIdx, sliceIdx) {
  expandWheelSlice(figIdx, sliceIdx);
  openFigureDetailsModal(figIdx);
}
function allocateClvFromModal(figIdx, sliceIdx) {
  allocateClvDamageToSlice(figIdx, sliceIdx);
  openFigureDetailsModal(figIdx);
}
function selectDonorFromModal(figIdx, sliceIdx) {
  selectShrinkDonorSlice(figIdx, sliceIdx);
  openFigureDetailsModal(figIdx);
}
function levelUpFigureFromModal(figIdx) {
  const f = FIGURES_DB[figIdx] || FIGURES_DB[0];
  ensureFigureUpgradeMetadata(f);
  if (f.level >= 10) {
    showToast("🏆 Hard Cap Máximo Lv.10 já atingido!");
    return;
  }
  f.level = Math.min(10, f.level + 1);
  playSfx("level_up");
  saveEconomyAndUpgrades();
  openFigureDetailsModal(figIdx);
}
function resetWheelFromModal(figIdx) {
  const f = FIGURES_DB[figIdx] || FIGURES_DB[0];
  ensureFigureUpgradeMetadata(f);
  f.wheel = f.baseWheelLv1.map(w => ({ ...w }));
  f.diskPointsSpent = 0;
  f.clvAlloc = f.wheel.map(() => 0);
  playSfx("portal");
  openFigureDetailsModal(figIdx);
}
function autoAllocateFromModal(figIdx) {
  const f = FIGURES_DB[figIdx] || FIGURES_DB[0];
  ensureFigureUpgradeMetadata(f);
  while (getAvailableDiskPoints(f) > 0) {
    const before = f.diskPointsSpent;
    expandWheelSlice(figIdx, 0);
    if (f.diskPointsSpent === before) break;
  }
  const wgIdx = f.wheel.findIndex(w => w.color === "white" || w.color === "gold");
  if (wgIdx !== -1) {
    while (getAvailableClvPoints(f) > 0) {
      allocateClvDamageToSlice(figIdx, wgIdx);
    }
  }
  playSfx("portal");
  openFigureDetailsModal(figIdx);
}

function openFigureDetailsModal(figIdx, liveUnit) {
  playSfx("tick");
  currentDetailedFigIdx = figIdx % FIGURES_DB.length;
  const f = FIGURES_DB[currentDetailedFigIdx] || FIGURES_DB[0];
  ensureFigureUpgradeMetadata(f);
  const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
  const modal = document.getElementById("figure-details-modal");
  if (!modal) return;

  const rEl = document.getElementById("fdet-rarity");
  if (rEl) {
    rEl.className = f.rarity === "UX" ? "ux-rainbow-badge" : (f.rarity === "EX" ? "ex-gold-badge" : "");
    rEl.textContent = f.rarity;
  }
  const isWeeklyBuffedFig = typeof hasWeeklyTypeBuff === "function" && hasWeeklyTypeBuff(liveUnit || f);
  const wbInfo = typeof getWeeklyBuffState === "function" ? getWeeklyBuffState() : null;
  const effModalMp = liveUnit ? liveUnit.mp : (typeof getFigureEffectiveMp === "function" ? getFigureEffectiveMp(f) : f.mp);
  const nEl = document.getElementById("fdet-name");
  if (nEl) nEl.textContent = (liveUnit ? liveUnit.name : f.name) + (isWeeklyBuffedFig && wbInfo ? ` ${wbInfo.meta.icon}` : "");
  const mpEl = document.getElementById("fdet-mp");
  if (mpEl) mpEl.textContent = "MP " + effModalMp + (isWeeklyBuffedFig ? " (+1⬆️)" : "");
  const imgEl = document.getElementById("fdet-img");
  if (imgEl) imgEl.src = sp.uri;
  const typEl = document.getElementById("fdet-type");
  if (typEl) typEl.textContent = (typeof localizeType === "function") ? localizeType(f.type) : f.type;
  const lvlEl = document.getElementById("fdet-lvl");
  const clvDots = "●".repeat(Math.min(10, f.clv)) + "○".repeat(Math.max(0, 5 - f.clv));
  if (lvlEl) lvlEl.textContent = `Lv.${f.level}/10 · CLv+${f.clv} (${clvDots})`;

  const canJump = typeof isFigurePassThroughOrJumper === "function" ? isFigurePassThroughOrJumper(liveUnit || f) : false;
  const jEl = document.getElementById("fdet-jump");
  if (jEl) {
    jEl.style.background = canJump ? "#16a34a" : "#475569";
    jEl.style.borderColor = canJump ? "#86efac" : "#64748b";
    const jBadge = (typeof t === "function") ? t("jump.jumps_badge", "🦘 PULA FIGURAS") : "🦘 PULA FIGURAS";
    const noJBadge = (typeof t === "function") ? t("jump.no_jump", "🚫 NÃO PULA") : "🚫 NÃO PULA";
    jEl.textContent = canJump ? jBadge : noJBadge;
  }

  const abEl = document.getElementById("fdet-ability");
  const evoLine = (typeof getFigureEvolutionLine === "function") ? getFigureEvolutionLine(f) : (EVO_CHAIN_NAMES[f.id] ? [f.name, ...EVO_CHAIN_NAMES[f.id]] : [f.name]);
  if (abEl) {
    const weeklyBanner = (isWeeklyBuffedFig && wbInfo)
      ? `<div style="margin-bottom:6px; padding:4px 6px; background:${wbInfo.meta.bg}; border:1px solid ${wbInfo.meta.border}; border-radius:4px; color:#fef08a; font-size:9.5px; font-weight:800;">${wbInfo.meta.icon} BUFF DA SEMANA (${wbInfo.meta.pt.toUpperCase()}): +10 Dano na Roleta · +1★ em Ataques Roxos · +1 MP Extra!</div>`
      : "";
    const jumpDesc = (typeof t === "function") ? t("jump.jumps_desc", "🦘 PULA FIGURAS: Este Pokémon pode saltar por cima de outros Pokémon aliados e adversários no tabuleiro gastando 2 MP por salto.") : "🦘 PULA FIGURAS: Este Pokémon pode saltar por cima de outros Pokémon aliados e adversários no tabuleiro gastando 2 MP por salto.";
    const noJumpDesc = (typeof t === "function") ? t("jump.no_jump_desc", "🚫 MOVIMENTO TERRESTRE: Não pula outros Pokémon (o caminho é bloqueado por peças adjacentes).") : "🚫 MOVIMENTO TERRESTRE: Não pula outros Pokémon (o caminho é bloqueado por peças adjacentes).";
    const jumpNotice = canJump
      ? `<div style="margin-bottom:6px; padding:4px 6px; background:rgba(22,163,74,0.18); border:1px solid #22c55e; border-radius:4px; color:#86efac; font-size:10px; font-weight:700;">${jumpDesc}</div>`
      : `<div style="margin-bottom:6px; padding:4px 6px; background:rgba(71,85,105,0.22); border:1px solid #64748b; border-radius:4px; color:#cbd5e1; font-size:10px;">${noJumpDesc}</div>`;
    const abText = (typeof localizeAbility === "function") ? localizeAbility(f) : ((FIGURE_ABILITIES_DB && FIGURE_ABILITIES_DB[f.id]) || "Standard PFG Figure Ability.");
    const evoTitle = (typeof t === "function") ? t("details.evo_line", "Linha Evolutiva / [UX]:") : "Linha Evolutiva / [UX]:";
    let evoLineHtml = "";
    if (evoLine.length > 1) {
      const parts = evoLine.map(n => {
        const isCurrent = (n.toLowerCase().replace(/[\s\-_]/g, "") === f.name.toLowerCase().replace(/[\s\-_]/g, ""));
        return isCurrent ? `<strong style="color:#fde047; text-decoration:underline;">${n} ★</strong>` : `<span style="color:#94a3b8;">${n}</span>`;
      });
      evoLineHtml = `<br><strong style="color:#facc15;">${evoTitle}</strong> ${parts.join(" ➔ ")}`;
    } else {
      evoLineHtml = `<br><strong style="color:#38bdf8;">Linha:</strong> <span style="color:#bae6fd;">Forma Única / Sem evolução adicional</span>`;
    }
    abEl.innerHTML = `${weeklyBanner}${jumpNotice}${abText}${evoLineHtml}`;
  }

  // Workshop Points Info Header
  const availDisk = getAvailableDiskPoints(f);
  const availClv = getAvailableClvPoints(f);
  const donorIdx = (typeof f.shrinkDonorIdx === "number" && f.wheel[f.shrinkDonorIdx]) ? f.shrinkDonorIdx : -1;

  // Render full Interactive Move Table with Carmonte Workshop Disk Controls
  const tbl = document.getElementById("fdet-moves-table");
  const colHex = { white:"#f8fafc", gold:"#facc15", purple:"#c084fc", blue:"#38bdf8", red:"#ef4444" };
  const tot = f.wheel.reduce((a, s) => a + s.size, 0) || 96;
  const previewWheelForDisk = f.wheel.map((w, wIdx) => {
    const sClv = (f.clvAlloc && f.clvAlloc[wIdx]) || 0;
    return {
      ...w,
      dmg: w.dmg > 0 ? w.dmg + sClv + (isWeeklyBuffedFig ? 10 : 0) : 0,
      stars: w.color === "purple" ? (w.stars || 1) + (isWeeklyBuffedFig ? 1 : 0) : 0
    };
  });
  if (tbl) {
    let headerHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; padding:4px 6px; border-radius:4px; margin-bottom:5px; border:1px solid #334155;">
        <span style="font-size:9px; font-weight:900; color:#38bdf8;">⚙️ CARMONTE WORKSHOP</span>
        <span style="font-size:8.5px; color:#fde047; font-weight:800;">Disk Pts: <strong>${availDisk}</strong> · CLv Pts: <strong>${availClv}</strong></span>
      </div>
    `;

    let movesHtml = f.wheel.map((w, wIdx) => {
      const pct = Math.round((w.size / tot) * 100);
      const sClv = (f.clvAlloc && f.clvAlloc[wIdx]) || 0;
      const wDmgBonus = (isWeeklyBuffedFig && w.dmg > 0) ? 10 : 0;
      const wStarBonus = (isWeeklyBuffedFig && w.color === "purple") ? 1 : 0;
      const val = w.color === "purple"
        ? "★".repeat((w.stars || 1) + wStarBonus)
        : (w.dmg > 0 ? (w.dmg + sClv + wDmgBonus + ((sClv + wDmgBonus) > 0 ? ` (+${sClv + wDmgBonus})` : '')) : "—");
      const isDonor = (donorIdx === wIdx);
      const locMove = (typeof localizeMove === "function") ? localizeMove(w.name) : w.name;

      let actionBtns = `<div style="display:flex; gap:3px; align-items:center;">`;
      if (w.color !== "red") {
        actionBtns += `<button onclick="event.stopPropagation(); expandWheelSliceFromModal(${currentDetailedFigIdx}, ${wIdx});" style="background:#0284c7; border:1px solid #7dd3fc; color:#fff; font-size:8px; font-weight:900; border-radius:3px; padding:1px 5px; cursor:pointer;" title="Aumentar Size deste ataque (+1 Wheel Size)">+Size</button>`;
      }
      if ((w.color === "white" || w.color === "gold") && w.dmg > 0) {
        actionBtns += `<button onclick="event.stopPropagation(); allocateClvFromModal(${currentDetailedFigIdx}, ${wIdx});" style="background:#15803d; border:1px solid #86efac; color:#fff; font-size:8px; font-weight:900; border-radius:3px; padding:1px 4px; cursor:pointer;" title="Alocar +1 DMG de Chain Level">+CLv</button>`;
      }
      if (w.color === "red" || w.size > 4) {
        actionBtns += `<button onclick="event.stopPropagation(); selectDonorFromModal(${currentDetailedFigIdx}, ${wIdx});" style="background:${isDonor ? '#dc2626' : '#334155'}; border:1px solid ${isDonor ? '#fca5a5' : '#64748b'}; color:#fff; font-size:7.5px; font-weight:900; border-radius:3px; padding:1px 3px; cursor:pointer;" title="Selecionar como fatia a ser reduzida">${isDonor ? 'Doador ✓' : 'Doador'}</button>`;
      }
      actionBtns += `</div>`;

      return `<div style="display:flex; justify-content:space-between; align-items:center; padding:3px 4px; border-bottom:1px solid #1e293b;">
        <span style="display:flex; align-items:center; gap:5px; flex:1.2;">
          <span style="width:9px; height:9px; border-radius:2px; background:${colHex[w.color]||'#fff'}; display:inline-block;"></span>
          <strong style="color:#f8fafc; font-size:9.5px;">${locMove}</strong>
        </span>
        <span style="color:#fde047; font-weight:900; font-size:9.5px; width:46px; text-align:center;">${val}</span>
        <span style="color:#94a3b8; font-size:8.5px; width:64px; text-align:right; margin-right:4px;">${w.size}/96 (${pct}%)</span>
        ${actionBtns}
      </div>`;
    }).join("");

    let toolbarHtml = `
      <div style="display:flex; gap:4px; margin-top:5px; justify-content:space-between;">
        <button onclick="levelUpFigureFromModal(${currentDetailedFigIdx})" style="flex:1; background:#ca8a04; border:1px solid #fef08a; color:#090d16; font-size:8.5px; font-weight:900; border-radius:4px; padding:3px 2px; cursor:pointer;" title="Subir nível para ganhar +1 Disk Point">⚡ +1 Nível (Pt)</button>
        <button onclick="autoAllocateFromModal(${currentDetailedFigIdx})" style="flex:1; background:#0284c7; border:1px solid #bae6fd; color:#fff; font-size:8.5px; font-weight:900; border-radius:4px; padding:3px 2px; cursor:pointer;" title="Auto-alocar pontos na melhor fatia">⚙️ Auto-Otimizar</button>
        <button onclick="resetWheelFromModal(${currentDetailedFigIdx})" style="flex:0.8; background:#475569; border:1px solid #94a3b8; color:#fff; font-size:8.5px; font-weight:900; border-radius:4px; padding:3px 2px; cursor:pointer;" title="Resetar roleta para Base Lv 1">↺ Reset</button>
      </div>
    `;

    tbl.innerHTML = headerHtml + movesHtml + toolbarHtml;
  }

  // Section 2.7: Z-Move Details Card & Live 100% Z-Wheel Preview Toggle
  const zm = (typeof getFigureZMove === "function") ? getFigureZMove(liveUnit || f) : null;
  const zmCard = document.getElementById("fdet-zmove-card");
  let isViewingZMoveWheel = false;

  window.toggleModalZMovePreview = function() {
    isViewingZMoveWheel = !isViewingZMoveWheel;
    const dCanv = document.getElementById("details-wheel-canvas");
    if (!dCanv) return;
    const dCtx2 = dCanv.getContext("2d");
    dCtx2.clearRect(0, 0, 136, 136);
    if (isViewingZMoveWheel && zm) {
      const zSlice = [{
        name: "⚡ " + zm.name,
        color: zm.color,
        dmg: zm.dmg || 0,
        stars: zm.stars || (zm.color === "purple" ? 4 : 0),
        effect: zm.effect,
        size: 96,
        isZMove: true
      }];
      drawAuthenticDataDisk(dCtx2, 68, 68, 54, zSlice, 0, 0, 0, zm.color === "purple" ? "#c084fc" : "#facc15");
    } else {
      drawAuthenticDataDisk(dCtx2, 68, 68, 54, previewWheelForDisk, 0, -1, 0, f.rarity === "UX" ? "#c084fc" : "#facc15");
    }
    const btn = document.getElementById("fdet-zmove-toggle-btn");
    if (btn) {
      btn.innerHTML = isViewingZMoveWheel ? "↺ Ver Roleta Base (96)" : "⚡ Ver Roleta 100%";
      btn.style.background = isViewingZMoveWheel ? "#334155" : "linear-gradient(90deg, #ca8a04, #eab308)";
      btn.style.color = isViewingZMoveWheel ? "#ffffff" : "#090d16";
    }
  };

  if (zmCard && zm) {
    const isPurple = zm.color === "purple";
    const zmVal = isPurple ? "★".repeat(zm.stars || 4) : `${zm.dmg || 200}`;
    const zmTypeLabel = isPurple ? "PURPLE ★★★★" : (zm.color === "gold" ? "GOLD CRITICAL" : "WHITE POWER");
    const zmCol = isPurple ? "#c084fc" : (zm.color === "gold" ? "#facc15" : "#f8fafc");
    const zmBorder = isPurple ? "#a855f7" : "#eab308";
    const zmBg = isPurple ? "rgba(168, 85, 247, 0.2)" : "rgba(234, 179, 8, 0.2)";

    zmCard.innerHTML = `
      <div style="background:linear-gradient(90deg, #131b2e 0%, #1e1b4b 60%, #0f172a 100%); border:1.5px solid ${zmBorder}; border-radius:7px; padding:6px 8px; box-shadow:0 0 10px rgba(250,204,21,0.22); margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:15px; text-shadow:0 0 6px #facc15;">⚡</span>
            <div>
              <div style="font-size:10px; font-weight:900; color:#fde047; letter-spacing:0.3px;">Z-MOVE: ${zm.name.toUpperCase()}</div>
              <div style="font-size:7.5px; color:#cbd5e1; margin-top:1px;">Roleta 100% · Quebra Blue em Miss · ${zmTypeLabel}</div>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px;">
            <span style="background:${zmBg}; border:1px solid ${zmBorder}; color:${zmCol}; font-weight:900; font-size:11px; padding:1.5px 7px; border-radius:4px; box-shadow:0 0 8px ${zmCol}44;">
              ${zmVal}
            </span>
            <button id="fdet-zmove-toggle-btn" onclick="toggleModalZMovePreview()" style="background:linear-gradient(90deg, #ca8a04, #eab308); border:1px solid #fef08a; border-radius:4px; color:#090d16; font-size:7.5px; font-weight:900; padding:1.5px 5px; cursor:pointer; margin-top:2px;">⚡ Ver Roleta 100%</button>
          </div>
        </div>
      </div>
    `;
  }

  // Draw the Data Disk on `#details-wheel-canvas`
  const dCanv = document.getElementById("details-wheel-canvas");
  if (dCanv) {
    const dCtx2 = dCanv.getContext("2d");
    dCtx2.clearRect(0, 0, 136, 136);
    drawAuthenticDataDisk(dCtx2, 68, 68, 54, previewWheelForDisk, 0, -1, 0, f.rarity === "UX" ? "#c084fc" : "#facc15");
  }

  modal.style.display = "flex";
}

function closeFigureDetailsModal() {
  const modal = document.getElementById("figure-details-modal");
  if (modal) modal.style.display = "none";
}

function openFusionForDetailedFig() {
  closeFigureDetailsModal();
  openDrawer("fusion");
  const sel = document.getElementById("fusion-target-select");
  if (sel) {
    sel.value = String(currentDetailedFigIdx);
    renderFusionChamber();
  }
}


// ============================================================================
// CINEMATIC BOOSTER UNBOXING ENGINE (Pokémon Duel Authentic Box Openings)
// Based on official animations: Single Box & Multi-Capsule Pack Openings
// ============================================================================
const BoosterCinematic = {
  canvas: null,
  ctx: null,
  active: false,
  animId: null,
  pulledList: [],
  currentIndex: 0,
  isMulti: false,
  title: "",
  bonusText: "",
  onFinishCallback: null,
  
  phase: 'box_floating', // 'box_floating' | 'box_opening' | 'figure_reveal' | 'finished'
  phaseStart: 0,
  shakeAmt: 0,
  godRayAngle: 0,
  particles: [],
  figureScale: 0.1,
  figureY: 0,
  flashAlpha: 0,
  figImageCache: {},

  init() {
    if (!this.canvas) {
      this.canvas = document.getElementById("booster-cinematic-canvas");
      if (this.canvas) {
        this.ctx = this.canvas.getContext("2d");
        this.canvas.addEventListener("pointerdown", (e) => this.handleClick(e));
        window.addEventListener("resize", () => { if (this.active) this.resize(); });
      }
    }
  },

  start(pulledFigures, isMulti, title, bonusText, onFinish) {
    this.init();
    if (!this.canvas || !this.ctx) {
      if (onFinish) onFinish();
      return;
    }
    this.pulledList = Array.isArray(pulledFigures) ? pulledFigures : [pulledFigures];
    this.currentIndex = 0;
    this.isMulti = isMulti || (this.pulledList.length > 1);
    this.title = title || "BOOSTER PACK OPENED";
    this.bonusText = bonusText || "";
    this.onFinishCallback = onFinish;
    this.active = true;
    this.phase = 'box_floating';
    this.phaseStart = performance.now();
    this.shakeAmt = 0;
    this.godRayAngle = 0;
    this.particles = [];
    this.flashAlpha = 0;

    this.resize();
    this.canvas.style.display = "block";

    // Preload figure sprite images
    this.pulledList.forEach(fig => {
      if (fig && fig.spriteKey) {
        const sp = AUTHENTIC_FIG_SPRITES[fig.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
        if (sp && sp.uri && !this.figImageCache[fig.spriteKey]) {
          const img = new Image();
          img.src = sp.uri;
          this.figImageCache[fig.spriteKey] = img;
        }
      }
    });

    if (this.animId) cancelAnimationFrame(this.animId);
    this.loop = this.loop.bind(this);
    this.animId = requestAnimationFrame(this.loop);
  },

  resize() {
    if (!this.canvas) return;
    const w = window.innerWidth, h = window.innerHeight;
    this.canvas.width = w * (window.devicePixelRatio || 1);
    this.canvas.height = h * (window.devicePixelRatio || 1);
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
  },

  handleClick(e) {
    if (!this.active) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width, h = rect.height;

    // Check "Skip / Pular" button (top right)
    if (x >= w - 120 && y <= 65) {
      this.finish();
      return;
    }

    if (this.phase === 'box_floating') {
      this.phase = 'box_opening';
      this.phaseStart = performance.now();
      this.shakeAmt = 15;
      playSfx("portal");
      if (typeof BgmEngine !== "undefined") BgmEngine.playFanfare("booster");
    } else if (this.phase === 'box_opening') {
      this.phase = 'figure_reveal';
      this.phaseStart = performance.now();
      this.flashAlpha = 1.0;
      playSfx("hit");
    } else if (this.phase === 'figure_reveal') {
      if (this.currentIndex + 1 < this.pulledList.length) {
        this.currentIndex++;
        this.phase = 'figure_reveal';
        this.phaseStart = performance.now();
        this.flashAlpha = 1.0;
        playSfx("step");
      } else {
        this.finish();
      }
    }
  },

  finish() {
    this.active = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.canvas) this.canvas.style.display = "none";
    if (this.onFinishCallback) this.onFinishCallback();
  },

  loop(now) {
    if (!this.active) return;
    this.render(now);
    this.animId = requestAnimationFrame(this.loop);
  },

  render(now) {
    const ctx = this.ctx;
    const cw = this.canvas.width, ch = this.canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const w = cw / dpr, h = ch / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Deep cosmic arena background
    const bgGrad = ctx.createRadialGradient(w / 2, h * 0.42, 20, w / 2, h * 0.42, w * 0.95);
    bgGrad.addColorStop(0, "#131b3b");
    bgGrad.addColorStop(0.5, "#080c1d");
    bgGrad.addColorStop(1, "#02040a");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const elapsed = now - this.phaseStart;
    const cx = w / 2;
    const cy = h * 0.45;

    // Spawn floating background ambient sparks
    if (this.particles.length < 55) {
      this.particles.push({
        x: cx + (Math.random() - 0.5) * w * 0.85,
        y: h * 0.75 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -1.2 - Math.random() * 2.5,
        r: 1.5 + Math.random() * 3,
        life: 1.0,
        decay: 0.008 + Math.random() * 0.012,
        col: Math.random() < 0.4 ? "#facc15" : (Math.random() < 0.7 ? "#38bdf8" : "#c084fc")
      });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = p.life * 0.85;
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 1. Draw 3D Holographic Pedestal at bottom
    this.drawPedestal(ctx, cx, cy + 115, 135);

    // 2. Render Phase: Box Floating, Box Opening, or Figure Reveal
    if (this.phase === 'box_floating') {
      const floatY = Math.sin(now * 0.003) * 12;
      this.drawBoosterBox(ctx, cx, cy + floatY, 1.0, 0, this.isMulti);

      const pulseAlpha = 0.5 + Math.sin(now * 0.006) * 0.45;
      ctx.save();
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(253, 224, 71, ${pulseAlpha})`;
      ctx.font = "900 15px sans-serif";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 12;
      ctx.fillText(this.isMulti ? "✨ ABRINDO PACK ESPECIAL... ✨" : "✨ ABRINDO A CAIXA... ✨", cx, cy + 195);
      ctx.restore();

      if (elapsed > 320) {
        this.phase = 'box_opening';
        this.phaseStart = performance.now();
        this.shakeAmt = 16;
        playSfx("portal");
        if (typeof BgmEngine !== "undefined") BgmEngine.playFanfare("booster");
      }

    } else if (this.phase === 'box_opening') {
      this.godRayAngle += 0.025;
      const shakeX = (Math.random() - 0.5) * this.shakeAmt;
      const shakeY = (Math.random() - 0.5) * this.shakeAmt;
      this.shakeAmt = Math.max(0, this.shakeAmt - 0.22);

      const openProg = Math.min(1.0, elapsed / 900);
      const lidYOffset = -openProg * 75;

      this.drawGodRays(ctx, cx, cy - 10, openProg, this.godRayAngle);
      this.drawBoosterBox(ctx, cx + shakeX, cy + shakeY, 1.0, lidYOffset, this.isMulti);

      if (elapsed > 1100) {
        this.phase = 'figure_reveal';
        this.phaseStart = performance.now();
        this.flashAlpha = 1.0;
        playSfx("hit");
      }

    } else if (this.phase === 'figure_reveal') {
      this.godRayAngle += 0.015;
      const curFig = this.pulledList[this.currentIndex] || this.pulledList[0];
      const isHighRarity = (curFig.rarity === 'UX' || curFig.rarity === 'EX');

      this.drawGodRays(ctx, cx, cy - 20, 1.0, this.godRayAngle, isHighRarity);

      const riseProg = Math.min(1.0, elapsed / 500);
      const easeScale = 0.2 + 0.8 * Math.sin(riseProg * Math.PI / 2);
      const floatY = Math.sin(now * 0.0035) * 8;

      this.drawRevealedFigure(ctx, cx, cy - 25 + floatY, easeScale, curFig);

      if (this.isMulti) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "#94a3b8";
        ctx.font = "800 12px sans-serif";
        ctx.fillText(`Figura ${this.currentIndex + 1} de ${this.pulledList.length}`, cx, h - 85);

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(cx - 75, h - 65, 150, 38, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#facc15";
        ctx.font = "900 13px sans-serif";
        const isLast = (this.currentIndex + 1 >= this.pulledList.length);
        ctx.fillText(isLast ? "Ver Todos (OK) ➔" : "Próximo Pokémon ❯", cx, h - 41);
        ctx.restore();
      } else {
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx - 85, h - 70, 170, 42, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fde047";
        ctx.font = "900 14px sans-serif";
        ctx.fillText("Continuar (OK) ➔", cx, h - 44);
        ctx.restore();
      }
    }

    // Top Skip Button (`[ ⏩ Pular ]`)
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(w - 105, 16, 92, 32, 6);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "800 11px sans-serif";
    ctx.fillText("⏩ Pular", w - 59, 36);
    ctx.restore();

    // White Flash Transition (on reveal)
    if (this.flashAlpha > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, w, h);
      this.flashAlpha *= 0.82;
    }

    ctx.restore();
  },

  drawPedestal(ctx, cx, cy, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + 18, radius * 1.15, radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx, cy, radius, radius * 0.38, 0, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    grad.addColorStop(0, "#0369a1");
    grad.addColorStop(0.5, "#38bdf8");
    grad.addColorStop(1, "#0284c7");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "#e0f2fe";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, cy, radius * 0.72, radius * 0.26, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(6, 182, 212, 0.35)";
    ctx.fill();
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  },

  drawBoosterBox(ctx, cx, cy, scale, lidOffset, isMulti) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const bw = isMulti ? 115 : 95;
    const bh = isMulti ? 105 : 90;

    ctx.beginPath();
    ctx.ellipse(0, 75, bw * 0.7, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    if (isMulti) {
      bodyGrad.addColorStop(0, "#d97706");
      bodyGrad.addColorStop(0.3, "#fde047");
      bodyGrad.addColorStop(0.7, "#ca8a04");
      bodyGrad.addColorStop(1, "#78350f");
    } else {
      bodyGrad.addColorStop(0, "#0369a1");
      bodyGrad.addColorStop(0.3, "#38bdf8");
      bodyGrad.addColorStop(0.7, "#0284c7");
      bodyGrad.addColorStop(1, "#082f49");
    }

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = isMulti ? "#fde047" : "#e0f2fe";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 4, bw, bh * 0.75, 8);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, bh * 0.15, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = isMulti ? "#fde047" : "#38bdf8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 14px sans-serif";
    ctx.fillText(isMulti ? "★" : "P", 0, bh * 0.15);

    ctx.save();
    ctx.translate(0, lidOffset);
    const lidGrad = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    if (isMulti) {
      lidGrad.addColorStop(0, "#fde047");
      lidGrad.addColorStop(0.5, "#ffffff");
      lidGrad.addColorStop(1, "#facc15");
    } else {
      lidGrad.addColorStop(0, "#38bdf8");
      lidGrad.addColorStop(0.5, "#ffffff");
      lidGrad.addColorStop(1, "#0284c7");
    }
    ctx.fillStyle = lidGrad;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-(bw + 8) / 2, -bh * 0.55, bw + 8, bh * 0.38, 7);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = isMulti ? "#b45309" : "#0369a1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-(bw + 4) / 2, -bh * 0.36);
    ctx.lineTo((bw + 4) / 2, -bh * 0.36);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  },

  drawGodRays(ctx, cx, cy, intensity, angle, isRainbow = false) {
    ctx.save();
    ctx.translate(cx, cy);
    const rayCount = 14;
    const maxR = 480;

    for (let i = 0; i < rayCount; i++) {
      const a1 = angle + (i / rayCount) * Math.PI * 2;
      const a2 = a1 + (Math.PI / rayCount) * 0.72;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxR, a1, a2);
      ctx.closePath();

      const rGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, maxR);
      if (isRainbow) {
        const cols = ["#f43f5e", "#fb923c", "#facc15", "#4ade80", "#38bdf8", "#c084fc"];
        const col = cols[i % cols.length];
        rGrad.addColorStop(0, "rgba(255, 255, 255, 0.7)");
        rGrad.addColorStop(0.4, col);
        rGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        rGrad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
        rGrad.addColorStop(0.35, "rgba(250, 204, 21, 0.45)");
        rGrad.addColorStop(1, "rgba(250, 204, 21, 0)");
      }
      ctx.fillStyle = rGrad;
      ctx.globalAlpha = intensity * 0.65;
      ctx.fill();
    }
    ctx.restore();
  },

  drawRevealedFigure(ctx, cx, cy, scale, fig) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const isUX = (fig.rarity === 'UX');
    const isEX = (fig.rarity === 'EX');

    ctx.beginPath();
    ctx.arc(0, 0, 68, 0, Math.PI * 2);
    ctx.fillStyle = isUX ? "rgba(192, 132, 252, 0.25)" : (isEX ? "rgba(250, 204, 21, 0.22)" : "rgba(56, 189, 248, 0.18)");
    ctx.fill();

    const img = this.figImageCache[fig.spriteKey];
    if (img && img.complete) {
      ctx.drawImage(img, -55, -60, 110, 110);
    } else {
      ctx.beginPath();
      ctx.arc(0, -5, 46, 0, Math.PI * 2);
      ctx.fillStyle = fig.c1 || "#38bdf8";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const badgeW = isUX ? 130 : 100;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-badgeW / 2, 58, badgeW, 26, 13);
    ctx.fillStyle = isUX ? "#7e22ce" : (isEX ? "#b45309" : "#0369a1");
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 12px sans-serif";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 4;
    ctx.fillText(`★ [${fig.rarity}] ${fig.rarity === 'UX' ? 'ULTRA RARE' : (fig.rarity === 'EX' ? 'EX RARE' : 'RARE')} ★`, 0, 71);

    ctx.font = "900 18px Impact, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(fig.name.toUpperCase(), 0, 102);

    ctx.font = "800 11px sans-serif";
    ctx.fillStyle = "#bae6fd";
    ctx.fillText(`${fig.type} Type · MP ${fig.mp} · Wheel 96`, 0, 122);

    ctx.restore();
  }
};

function showBoosterUnboxModal(title, pulledFigs, bonusText) {
  const openStaticModal = () => {
    if (typeof BgmEngine !== "undefined") {
      BgmEngine.playFanfare("booster");
    }
    const modal = document.getElementById("booster-unbox-modal");
  const tEl = document.getElementById("unbox-title");
  const gEl = document.getElementById("unbox-cards-grid");
  const bEl = document.getElementById("unbox-bonus-summary");
  if (tEl) tEl.textContent = title;
  if (bEl) bEl.textContent = bonusText;
  if (gEl) {
    gEl.innerHTML = pulledFigs.map(f => {
      const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
      return `<div style="background:linear-gradient(180deg,#1e293b,#090d16); border:1.5px solid ${f.rarity==='UX'?'#c084fc':'#facc15'}; border-radius:8px; padding:6px; text-align:center;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
          ${getRarityBadgeHtml(f.rarity)}
          <span style="font-size:8px; color:#bae6fd; font-weight:900;">MP ${f.mp}</span>
        </div>
        <img src="${sp.uri}" style="width:48px; height:48px; object-fit:contain;">
        <div style="font-size:10px; font-weight:900; color:#fff;">${f.name}</div>
        <div style="font-size:8px; color:#94a3b8;">${f.type}</div>
      </div>`;
    }).join("");
  }
  if (modal) modal.style.display = "flex";
  };
  if (typeof BoosterCinematic !== "undefined") {
    BoosterCinematic.start(pulledFigs, pulledFigs.length > 1, title, bonusText, openStaticModal);
  } else {
    openStaticModal();
  }
}

function closeBoosterUnboxModal() {
  const modal = document.getElementById("booster-unbox-modal");
  if (modal) modal.style.display = "none";
}

function openBoosterChest(boxName) {
  playSfx("portal");
  state.rareMetals += 50;
  state.chainCubes += 1;
  const f1 = FIGURES_DB[Math.floor(Math.random() * FIGURES_DB.length)];
  const f2 = FIGURES_DB[(FIGURES_DB.indexOf(f1) + 5) % FIGURES_DB.length];
  renderHubAndCollection();
  const msg = document.getElementById("chest-reward-msg");
  if (msg) msg.textContent = `🎉 ${boxName.toUpperCase()} Booster opened! Pulled [${f1.rarity}] ${f1.name} & [${f2.rarity}] ${f2.name}!`;
  showBoosterUnboxModal(
    `🎁 ${boxName.toUpperCase()} BOOSTER OPENED!`,
    [f1, f2],
    `+50 Gems · +1 Cube EX/UX · +15,000 Coins`
  );
}

function inspectMasterDataDump() {
  const out = document.getElementById("monaco-inspector-out");
  out.textContent = JSON.stringify({
    source: "assets/bin/Data/202b18b7813ecf441... (EndResource @ 0x1004)",
    cipher: "AES-256-CBC",
    key: "JN2nygk2u4SHS38UDjSpjx2iG7g4K8qJ",
    iv: "PAnLyA4zJ0ro5htx",
    decrypted_size_mb: 15.09,
    tables: {
      FigureMasters: "728 figures (MP, Rarity, DataDisk slices)",
      LibraryPlates: "166 plates (Double Chance, Hurdle Jump, X-Speed, Goal Block, Max Revive)",
      ChapterMasters: "72 chapters (Ulex, Château de Rosa, Atlantis, Olivia Palace, Volcano, Elysium)",
      PokemonCondition: "0x00 Normal | 0x01 Panic | 0x04 Poison | 0x07 BadPoison | 0x08 Faint | 0x12 Sleep | 0x16 Freeze | 0x19 Melt | 0x23 Paralyze | 0x25 Burn"
    }
  }, null, 2);
}

async function patchOriginalComasterApk(file) {
  if (!file) return;
  const out = document.getElementById("monaco-inspector-out");
  out.textContent = `⏳ Aplicando patch Zero-Copy em ${file.name}...`;
  const buf = new Uint8Array(await file.arrayBuffer());
  const targetStr = new TextEncoder().encode("2020-01-31 15:00:00");
  const replStr   = new TextEncoder().encode("2099-12-31 15:00:00");
  let patches = 0;
  for (let i = 0; i <= buf.length - targetStr.length; i++) {
    let match = true;
    for (let j = 0; j < targetStr.length; j++) {
      if (buf[i + j] !== targetStr[j]) { match = false; break; }
    }
    if (match) { buf.set(replStr, i); patches++; }
  }
  const blob = new Blob([buf], { type: "application/vnd.android.package-archive" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Pokemon_Duel_7.0.16_Offline_Pronto.apk";
  a.click();
  out.textContent = `✅ Patch Zero-Copy concluído (${patches} blocos atualizados)!`;
}

const CARMONTE_HOTELS = [
  { id: 0, name:"1. Ulex Hotel (Carmonte Island)", surface:"crystal", boss:"Luca", deck:"Starter Figures", desc:"Vencer Duelo · Em ≤28 turnos · Nocautear 2+ figuras.", reqEnergy:15, rewards:"1,500 🪙 + Rare Metal + 15 🔻" },
  { id: 1, name:"2. Château de Rosa (Master Rosé)", surface:"marble", boss:"Master Rosé", deck:"Fairy/Psychic Dancers", desc:"Vencer Duelo · Em ≤28 turnos · Nocautear 2+ figuras.", reqEnergy:15, rewards:"2,000 🪙 + Rare Metal + 15 🔻" },
  { id: 2, name:"3. Atlantis Hotel (Subsea Arena)", surface:"crystal", boss:"Nadya", deck:"Water Shuriken & Torrent", desc:"Vencer Duelo · Em ≤26 turnos · Nocautear 2+ figuras.", reqEnergy:15, rewards:"2,500 🪙 + Carmonite + 20 🔻" },
  { id: 3, name:"4. Olivia Palace (Luxury Suite)", surface:"marble", boss:"Olivia", deck:"Rock / Ground Sturdy", desc:"Vencer Duelo · Em ≤26 turnos · Nocautear 2+ figuras.", reqEnergy:15, rewards:"3,000 🪙 + Carmonite + 20 🔻" },
  { id: 4, name:"5. The Volcano & Elysium", surface:"wood", boss:"Don Roger", deck:"Fire Spin & Dragon Rage", desc:"Vencer Duelo · Em ≤24 turnos · Nocautear 2+ figuras.", reqEnergy:15, rewards:"3,500 🪙 + Ingot EX + 25 🔻" },
  { id: 5, name:"6. Mayhem Tower (Chaos Suite)", surface:"habitats", boss:"Cynthia", deck:"Garchomp & Legendary Trio", desc:"Vencer Duelo · Em ≤22 turnos · Nocautear 3+ figuras.", reqEnergy:15, rewards:"5,000 🪙 + UX Cube + 50 🔻" }
];

function getStoredQuestStars() {
  try {
    const raw = localStorage.getItem("pokeduel_quest_stars");
    return raw ? JSON.parse(raw) : { 0: 3, 1: 2 };
  } catch (e) {
    return { 0: 3, 1: 2 };
  }
}

function saveStoredQuestStars(starsObj) {
  try {
    localStorage.setItem("pokeduel_quest_stars", JSON.stringify(starsObj));
  } catch (e) {}
}

function renderHubAndCollection() {
  document.getElementById("rm-lbl").textContent = state.rareMetals;
  const ccEl = document.getElementById("cc-lbl");
  if (ccEl) ccEl.textContent = state.chainCubes;

  const showcase = document.getElementById("hub-deck-showcase");
  if (showcase) {
    showcase.innerHTML = state.deckP1.map((idx, slotPos) => {
      const f = FIGURES_DB[idx % FIGURES_DB.length];
      const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
      const evoTarget = (typeof getFigureEvolutionTarget === "function") ? getFigureEvolutionTarget(f) : null;
      const isSelSlot = (slotPos === currentEditingDeckSlot);
      return `<div class="deck-slot-box ${isSelSlot ? 'selected-slot' : ''}" onclick="selectDeckSlotToEdit(${slotPos})">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0 2px;">
          ${getRarityBadgeHtml(f.rarity)}
          <span onclick="event.stopPropagation(); openFigureDetailsModal(${idx});" style="font-size:8px; color:#7dd3fc; font-weight:900;">ⓘ</span>
        </div>
        <img src="${sp.uri}" style="width:36px; height:36px; object-fit:contain;">
        <div style="font-size:7.8px; font-weight:800; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${f.name}</div>
        <div style="font-size:7px; color:#facc15;">MP ${f.mp} · CLv+${f.clv}</div>
        <div class="evo-sub-slot" onclick="event.stopPropagation(); openFigureDetailsModal(${idx});" title="Evolução">${evoTarget ? '⬆ ' + evoTarget : '★ Final'}</div>
      </div>`;
    }).join("");
  }

  // Render Interactive Plate Case Cost Bar (`Cost 6/6 ◆◆◆◆◆◆`)
  const pSel = document.getElementById("deck-plates-selector");
  const pBar = document.getElementById("plate-cost-bar");
  if (pSel) {
    const activePlates = state.plates.filter(p => !p.disabledInDeck);
    const usedCost = activePlates.reduce((a, p) => a + p.cost, 0);
    if (pBar) pBar.textContent = `COST ${Math.min(6, usedCost)}/6 ` + "◆".repeat(Math.min(6, usedCost)) + "◇".repeat(Math.max(0, 6 - usedCost));
    pSel.innerHTML = state.plates.map((p, pIdx) => {
      const active = !p.disabledInDeck;
      return `<button onclick="togglePlateInDeck(${pIdx})" style="background:${active?'#0284c7':'#0f172a'}; border:1px solid ${active?'#bae6fd':'#475569'}; color:#fff; border-radius:4px; padding:2px 6px; font-size:8.5px; font-weight:800; cursor:pointer;">
        ${active ? '✓ ' : ''}${p.name} [${p.cost}◆]
      </button>`;
    }).join("");
  }

  const qList = document.getElementById("hub-quests-list");
  if (qList) {
    const oppLabel = (typeof t === "function") ? t("hotel.opponent", "Oponente:") : "Oponente:";
    const startDuelText = (typeof t === "function") ? t("modes.start_duel", "Iniciar Duelo") : "Iniciar Duelo";
    qList.innerHTML = CARMONTE_HOTELS.map(h => `
      <div class="card" style="margin-bottom:0;">
        <strong style="font-size:10.5px; color:#facc15;">${h.name}</strong>
        <div class="small-muted" style="margin:3px 0;">${oppLabel} ${h.boss}</div>
        <button class="btn" style="width:100%; font-size:9.5px; padding:4px;" onclick="setGameMode('ai'); setTableSurface('${h.surface}'); demoFullMatchState(); closeDrawer();">${startDuelText}</button>
      </div>
    `).join("");
  }

  const grid = document.getElementById("collection-grid");
  if (!grid) return;
  grid.innerHTML = "";
  FIGURES_DB.forEach((f, idx) => {
    if (figureCaseFilter !== "ALL" && f.rarity !== figureCaseFilter) return;
    const unlocked = (typeof isFigureUnlocked === "function") ? isFigureUnlocked(idx) : (state.deckP1.includes(idx));
    const inDeck = state.deckP1.includes(idx);
    const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
    const locType = (typeof localizeType === "function") ? localizeType(f.type) : f.type;
    const lockedLabel = (typeof t === "function") ? t("deck.locked", "🔒 Bloqueado") : "🔒 Bloqueado";
    const viewWheelLabel = (typeof t === "function") ? t("deck.view_details", "ⓘ Ver Roleta & Habilidade") : "ⓘ Ver Roleta & Habilidade";
    const inDeckLabel = (typeof t === "function") ? t("deck.in_deck", "★ No Deck") : "★ No Deck";
    const toSlotLabel = (typeof t === "function") ? t("deck.to_slot", `➔ Slot #${currentEditingDeckSlot + 1}`, { slot: currentEditingDeckSlot + 1 }) : `➔ Slot #${currentEditingDeckSlot + 1}`;
    const unlockShopLabel = (typeof t === "function") ? t("deck.unlock_in_shop", "🔒 Desbloquear na Loja") : "🔒 Desbloquear na Loja";

    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "0";
    card.style.opacity = unlocked ? "1.0" : "0.78";
    card.style.borderColor = inDeck ? "#facc15" : (unlocked ? (f.rarity === "UX" ? "#c084fc" : "rgba(56,189,248,0.28)") : "#334155");
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="font-size:10px; color:${unlocked ? '#fff' : '#94a3b8'};">${unlocked ? '' : '🔒 '}${f.name}</strong>
        <div style="display:flex; align-items:center; gap:3px;">
          ${getRarityBadgeHtml(f.rarity)}
          <span style="font-size:8px; color:#bae6fd; font-weight:900;">MP ${f.mp}</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:7px; margin:5px 0; cursor:pointer;" onclick="openFigureDetailsModal(${idx})">
        <img src="${sp.uri}" style="width:44px; height:44px; object-fit:contain; ${unlocked ? '' : 'filter:grayscale(0.85) brightness(0.55);'}">
        <div class="small-muted">${unlocked ? `Lv.${f.level}/10 · CLv+${f.clv}` : `<span style="color:#facc15; font-weight:800;">${lockedLabel}</span>`}<br>${locType}<br><span style="color:#38bdf8; font-weight:800;">${viewWheelLabel}</span></div>
      </div>
      <div style="display:flex; gap:4px;">
        ${unlocked ? `
          <button class="btn ${inDeck ? 'gold' : 'secondary'}" style="flex:1; font-size:8.5px; padding:4px;" onclick="toggleDeckEquip(${idx})">
            ${inDeck ? inDeckLabel : toSlotLabel}
          </button>
          <button class="btn purple" style="font-size:8.5px; padding:4px 6px;" onclick="fuseFigure(${idx})">+CLv</button>
        ` : `
          <button class="btn secondary" style="flex:1; font-size:8.5px; padding:4px; color:#facc15; border-color:#ca8a04;" onclick="switchDrawerTab('shop')">
            ${unlockShopLabel}
          </button>
        `}
      </div>
    `;
    grid.appendChild(card);
  });
}

function selectDeckSlotToEdit(slotPos) {
  currentEditingDeckSlot = slotPos % 6;
  selectedCarouselSlot = currentEditingDeckSlot;
  playSfx("tick");
  const ind = document.getElementById("editing-slot-indicator");
  if (ind) ind.textContent = `Slot #${currentEditingDeckSlot + 1} Ativo (Destaque na Tela Inicial)`;
  renderHubAndCollection();
}

function switchDeckPreset(presetIdx) {
  activeDeckPresetIdx = presetIdx;
  state.deckP1 = [...DECK_PRESETS[presetIdx % DECK_PRESETS.length]];
  selectedCarouselSlot = 0;
  [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => {
    const b = document.getElementById("preset-deck-" + i);
    if (b) b.className = "btn " + (i === presetIdx ? "gold" : "secondary");
  });
  playSfx("portal");
  demoFullMatchState();
  renderHubAndCollection();
}

function filterFigureCase(rar) {
  figureCaseFilter = rar;
  playSfx("tick");
  renderHubAndCollection();
}

function togglePlateInDeck(pIdx) {
  const p = state.plates[pIdx];
  if (!p) return;
  p.disabledInDeck = !p.disabledInDeck;
  playSfx("tick");
  renderHubAndCollection();
}

function toggleDeckEquip(idx) {
  const editedSlot = currentEditingDeckSlot % 6;
  state.deckP1[editedSlot] = idx;
  DECK_PRESETS[activeDeckPresetIdx % DECK_PRESETS.length][editedSlot] = idx;
  selectedCarouselSlot = editedSlot; // Show this newly equipped team Pokémon in the center of the Home Screen!
  currentEditingDeckSlot = (editedSlot + 1) % 6;
  const ind = document.getElementById("editing-slot-indicator");
  if (ind) ind.textContent = `Slot #${currentEditingDeckSlot + 1} Ativo`;
  playSfx("portal");
  demoFullMatchState();
  renderHubAndCollection();
}

function fuseFigure(idx) {
  const f = FIGURES_DB[idx];
  ensureFigureUpgradeMetadata(f);
  if (f.clv >= 10) {
    playSfx("tick");
    return;
  }
  if (state.chainCubes > 0) {
    state.chainCubes--;
    f.clv = Math.min(10, f.clv + 1);
    const wgIdx = f.wheel.findIndex(w => w.color === "white" || w.color === "gold");
    if (wgIdx !== -1) f.clvAlloc[wgIdx] = (f.clvAlloc[wgIdx] || 0) + 1;
    playSfx("portal");
    demoFullMatchState();
    renderHubAndCollection();
  }
}





// 10B. AUTHENTIC POKÉMON DUEL 60 FPS 3D HOLOGRAPHIC DECK CAROUSEL & TABS
// ============================================================================
let carouselAngle = 0;
let carouselTargetAngle = 0;
let isDraggingCarousel = false;
let dragStartX = 0;
let selectedCarouselSlot = 0;
let userCoins = 415;
let userMaterial = 12500;

const homeCarouselCanvas = document.getElementById("home-carousel-canvas");
const hcCtx = homeCarouselCanvas ? homeCarouselCanvas.getContext("2d") : null;

let lastRenderedTeamSlots = [];
let pointerDownX = 0, pointerDownY = 0, pointerMovedDist = 0;
selectedCarouselSlot = 1; // Start highlighting Slot #2 of the player's team (`state.deckP1[1]`)

if (homeCarouselCanvas) {
  homeCarouselCanvas.addEventListener("pointerdown", e => {
    const rect = homeCarouselCanvas.getBoundingClientRect();
    const dpr = homeCarouselCanvas.width / (rect.width || 1);
    const tx = (e.clientX - rect.left) * dpr;
    const ty = (e.clientY - rect.top) * dpr;
    const S = homeCarouselCanvas.width / 415.0;

    // 1. Check if user tapped one of the 6 team Pokémon
    let hitSlot = -1;
    let bestD = 999999;
    lastRenderedTeamSlots.forEach(it => {
      const d = Math.hypot(tx - it.px, ty - (it.py - 16 * S * it.scale));
      if (d < 46 * S && d < bestD) {
        bestD = d;
        hitSlot = it.slot;
      }
    });

    if (hitSlot !== -1) {
      selectedCarouselSlot = hitSlot;
      activeCenterpieceKey = "team_slot";
      playSfx("tick");
      const f = FIGURES_DB[state.deckP1[selectedCarouselSlot] % FIGURES_DB.length];
      const msg = document.getElementById("chest-reward-msg");
      if (msg && f) msg.textContent = `★ Time em Destaque (Slot #${selectedCarouselSlot + 1}/6): [${f.rarity}] ${f.name} (MP ${f.mp})`;
      return;
    }

    // 2. Check if user tapped the Centerpiece on the main pedestal / stage
    const cx = homeCarouselCanvas.width * 0.5;
    const cy = homeCarouselCanvas.height * 0.50;
    const targetY = homeCenterpieceShowPedestal ? (cy - 45 * S) : (cy - 20 * S);
    if (Math.hypot(tx - cx, ty - targetY) < 95 * S) {
      const centerFigIdx = state.deckP1[selectedCarouselSlot % 6];
      openFigureDetailsModal(centerFigIdx);
      playSfx("tick");
      return;
    }
  });
}

function updateCarouselBanner() {
  const banner = null;
  if (!banner) return;
  const figIdx = state.deckP1[selectedCarouselSlot % 6];
  const f = FIGURES_DB[figIdx % FIGURES_DB.length];
  banner.textContent = `★ ${f.name} (${f.rarity} · MP ${f.mp} · Lv.${f.level} CLv+${f.clv}) — Arraste para girar`;
}

let homeLucaStep = 0;
const HOME_LUCA_LINES = [
  "This is where duels take place. These are figures for practicing with, so let's duel!",
  "The first spin decides who starts. Tap the yellow Play button below to begin!",
  ""
];
function advanceHomeLucaDialog() {
  playSfx("tick");
  homeLucaStep = (homeLucaStep + 1) % HOME_LUCA_LINES.length;
  const box = document.getElementById("home-luca-dialog");
  const txt = document.getElementById("home-luca-text");
  if (!HOME_LUCA_LINES[homeLucaStep]) {
    if (box) box.style.display = "none";
  } else if (txt) {
    txt.textContent = HOME_LUCA_LINES[homeLucaStep];
  }
}

// (HOME_V380_UI_ASSETS loaded from js/data/sprites.js)
const homeCenterpieceImg = new Image();
homeCenterpieceImg.src = HOME_V380_UI_ASSETS.greninja_centerpiece;
const homePedestal3DImg = new Image();
homePedestal3DImg.src = HOME_V380_UI_ASSETS.centerpiece_pedestal_3d;
let activeCenterpieceKey = "team_slot"; // Always reflects the player's active team (`state.deckP1[selectedCarouselSlot % 6]`)!
let playerProfileName = "Serebii";
let playerLeagueRating = 1664;
let playerKeyFragments = 0;

function initHomeV380Assets() {
  const mapIds = {
    "home-prof-emblem": "profile_emblem",
    "home-prof-avatar": "profile_avatar",
    "prof-modal-avatar": "profile_avatar",
    "home-locked-booster-img": "locked_booster_top",
    "home-training-btn-img": "new_training_btn",
    "home-black-pokeball-img": "black_pokeball_btn",
    "tb-img-0": "booster_silver",
    "tb-img-1": "booster_purple",
    "tb-img-2": "booster_silver",
    "tb-img-3": "booster_plus1",
    "nav-ico-back": "tab_back",
    "nav-ico-leagues": "tab_leagues",
    "nav-ico-decks": "tab_decks",
    "nav-ico-fusion": "tab_fusion",
    "nav-ico-shop": "tab_shop",
    "nav-ico-menu": "tab_menu"
  };
  Object.entries(mapIds).forEach(([elId, assetKey]) => {
    const el = document.getElementById(elId);
    if (el && HOME_V380_UI_ASSETS[assetKey]) el.src = HOME_V380_UI_ASSETS[assetKey];
  });
  if (typeof updatePedestalToggleButton === "function") updatePedestalToggleButton();
}
setTimeout(initHomeV380Assets, 0);

// PERSISTENT REAL-TIME TIME BOOSTERS ENGINE (`localStorage` + `Date.now()` Wall-Clock Timestamps!)
const TB_STORAGE_KEY = "pdr_realtime_boosters_v420";

function loadOrCreateRealTimeBoosters() {
  try {
    const raw = localStorage.getItem(TB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 4) return parsed;
    }
  } catch (e) {}
  const now = Date.now();
  const initial = [
    { id: 0, status: "unlocking", name: "Silver Time Booster (1h)", totalSec: 3600,  endTs: now + 3600 * 1000,  baseGems: 10, kind: "silver" },
    { id: 1, status: "unlocking", name: "Purple Time Booster (6h)", totalSec: 21600, endTs: now + 21600 * 1000, baseGems: 60, kind: "purple" },
    { id: 2, status: "unlocking", name: "Silver Time Booster (1h)", totalSec: 3600,  endTs: now + 3600 * 1000,  baseGems: 10, kind: "silver" },
    { id: 3, status: "locked_slot", name: "Extra Slot (+1)",        totalSec: 10800, endTs: 0,                  baseGems: 30, kind: "plus1" }
  ];
  try { localStorage.setItem(TB_STORAGE_KEY, JSON.stringify(initial)); } catch (e) {}
  return initial;
}

const timeBoostersState = loadOrCreateRealTimeBoosters();
let inspectedBoosterSlotIdx = -1;

function saveRealTimeBoosters() {
  try { localStorage.setItem(TB_STORAGE_KEY, JSON.stringify(timeBoostersState)); } catch (e) {}
}

function formatBoosterHMS(sec) {
  if (sec <= 0) return "READY!";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function tickRealTimeBoosters() {
  const now = Date.now();
  for (let idx = 0; idx < 3; idx++) {
    const tb = timeBoostersState[idx];
    const tEl = document.getElementById("tb-timer-" + idx);
    const cEl = document.getElementById("tb-cost-" + idx);
    const imgEl = document.getElementById("tb-img-" + idx);
    if (!tb || !tEl || !cEl) continue;

    if (tb.status === "empty") {
      tEl.textContent = "VAZIO";
      tEl.style.color = "#94a3b8";
      cEl.textContent = "DUEL";
      cEl.style.color = "#94a3b8";
      if (imgEl) imgEl.style.opacity = "0.22";
      continue;
    }

    if (imgEl) {
      imgEl.style.opacity = "1.0";
      imgEl.src = tb.kind === "purple" ? HOME_V380_UI_ASSETS.booster_purple : HOME_V380_UI_ASSETS.booster_silver;
    }

    const remSec = Math.max(0, Math.ceil((tb.endTs - now) / 1000));
    if (remSec === 0) {
      tb.status = "ready";
      tEl.textContent = "ABRIR!";
      tEl.style.color = "#4ade80";
      cEl.textContent = "GRÁTIS";
      cEl.style.color = "#fde047";
    } else {
      tEl.textContent = formatBoosterHMS(remSec);
      tEl.style.color = "#ffffff";
      const prorated = Math.max(1, Math.ceil((remSec / tb.totalSec) * tb.baseGems));
      cEl.textContent = String(prorated);
      cEl.style.color = state.rareMetals >= prorated ? "#ffffff" : "#f87171";
    }
  }

  // Also update the live clock inside `#time-booster-modal` if it is currently open!
  if (inspectedBoosterSlotIdx >= 0 && inspectedBoosterSlotIdx < 3) {
    const mEl = document.getElementById("time-booster-modal");
    if (mEl && mEl.style.display === "flex") {
      const tb = timeBoostersState[inspectedBoosterSlotIdx];
      const clkEl = document.getElementById("tbm-live-clock");
      const btnEl = document.getElementById("tbm-gem-open-btn");
      const errEl = document.getElementById("tbm-error-msg");
      if (tb && tb.status !== "empty") {
        const remSec = Math.max(0, Math.ceil((tb.endTs - now) / 1000));
        if (clkEl) clkEl.textContent = formatBoosterHMS(remSec);
        const gemCost = remSec === 0 ? 0 : Math.max(1, Math.ceil((remSec / tb.totalSec) * tb.baseGems));
        if (btnEl) {
          if (remSec === 0) {
            btnEl.textContent = "🎁 Abrir Grátis Agora!";
            btnEl.style.opacity = "1.0";
          } else {
            btnEl.textContent = `🔻 Abrir Agora (${gemCost} Gems)`;
            btnEl.style.opacity = state.rareMetals >= gemCost ? "1.0" : "0.55";
          }
        }
        if (errEl && remSec > 0 && state.rareMetals < gemCost) {
          errEl.textContent = `🔒 Você tem ${state.rareMetals}🔻 (precisa de ${gemCost}🔻 para pular o tempo). Aguarde o cronômetro real!`;
        } else if (errEl) {
          errEl.textContent = "";
        }
      }
    }
  }
}
setInterval(tickRealTimeBoosters, 1000);
setTimeout(tickRealTimeBoosters, 50);

function handleTimeBoosterClick(slotIdx) {
  playSfx("tick");
  const msgEl = document.getElementById("chest-reward-msg");
  if (slotIdx === 3) {
    // +1 Expansion Slot: checks if any of slots 0..2 is empty; if so, awards a new real-time booster!
    const emptyIdx = timeBoostersState.findIndex((x, i) => i < 3 && x.status === "empty");
    if (emptyIdx !== -1) {
      awardNewRealTimeBoosterToSlot(emptyIdx);
      if (msgEl) msgEl.textContent = `📦 Novo Time Booster colocado no Slot #${emptyIdx + 1} (contando em tempo real)!`;
    } else {
      if (msgEl) msgEl.textContent = "⏳ Todos os 3 slots já estão ocupados contando em tempo real!";
    }
    return;
  }

  const tb = timeBoostersState[slotIdx];
  if (!tb) return;

  if (tb.status === "empty") {
    if (msgEl) msgEl.textContent = `Slot #${slotIdx + 1} está vazio! Vença uma partida em [Play] ou toque no botão vermelho [+1] para receber um novo baú!`;
    return;
  }

  const now = Date.now();
  const remSec = Math.max(0, Math.ceil((tb.endTs - now) / 1000));

  // If the real-time countdown has reached 00:00:00, open immediately for FREE and mark slot empty!
  if (remSec === 0) {
    consumeAndUnboxTimeBooster(slotIdx, 0);
    return;
  }

  // Otherwise, DO NOT reset or open automatically! Show the Real-Time Countdown Modal!
  inspectedBoosterSlotIdx = slotIdx;
  const mEl = document.getElementById("time-booster-modal");
  const tEl = document.getElementById("tbm-title");
  const imgEl = document.getElementById("tbm-img");
  const hintEl = document.getElementById("tbm-contents-hint");
  if (tEl) tEl.textContent = tb.name.toUpperCase();
  if (imgEl) imgEl.src = tb.kind === "purple" ? HOME_V380_UI_ASSETS.booster_purple : HOME_V380_UI_ASSETS.booster_silver;
  if (hintEl) {
    hintEl.textContent = tb.kind === "purple"
      ? "Baú Roxo (06:00:00): Garante 2 Figuras (alta chance R/EX) + Material!"
      : "Baú Prateado (01:00:00): Garante Figura + Material + Moedas!";
  }
  if (mEl) mEl.style.display = "flex";
  tickRealTimeBoosters();
}

function closeTimeBoosterModal() {
  const mEl = document.getElementById("time-booster-modal");
  if (mEl) mEl.style.display = "none";
  inspectedBoosterSlotIdx = -1;
}

function confirmGemOpenTimeBooster() {
  if (inspectedBoosterSlotIdx < 0 || inspectedBoosterSlotIdx >= 3) return;
  const tb = timeBoostersState[inspectedBoosterSlotIdx];
  if (!tb || tb.status === "empty") return;
  const now = Date.now();
  const remSec = Math.max(0, Math.ceil((tb.endTs - now) / 1000));
  const gemCost = remSec === 0 ? 0 : Math.max(1, Math.ceil((remSec / tb.totalSec) * tb.baseGems));

  if (gemCost > 0 && state.rareMetals < gemCost) {
    playSfx("hit");
    const errEl = document.getElementById("tbm-error-msg");
    if (errEl) {
      errEl.textContent = `⚠️ Gemas insuficientes (${state.rareMetals}/${gemCost}🔻)! Aguarde o tempo real zerar ou ganhe gemas!`;
    }
    return;
  }

  const slotToOpen = inspectedBoosterSlotIdx;
  closeTimeBoosterModal();
  consumeAndUnboxTimeBooster(slotToOpen, gemCost);
}

function consumeAndUnboxTimeBooster(slotIdx, gemCostSpent) {
  const tb = timeBoostersState[slotIdx];
  if (!tb) return;
  if (gemCostSpent > 0) {
    state.rareMetals = Math.max(0, state.rareMetals - gemCostSpent);
    const rmEl = document.getElementById("rm-lbl");
    if (rmEl) rmEl.textContent = state.rareMetals;
  }

  const boxLabel = tb.name + (gemCostSpent > 0 ? ` (Acelerado por 🔻${gemCostSpent})` : " (Tempo Real Concluído!)");
  // Mark this slot as EMPTY so the opened chest is genuinely consumed!
  tb.status = "empty";
  tb.endTs = 0;
  saveRealTimeBoosters();
  tickRealTimeBoosters();

  // Unbox without adding free +50 Gems (awards Figures + Material + Coins + Cube!)
  playSfx("portal");
  state.chainCubes += 1;
  userMaterial += (tb.kind === "purple" ? 150 : 50);
  userCoins += (tb.kind === "purple" ? 12000 : 4500);
  const cLbl = document.getElementById("coins-lbl");
  if (cLbl) cLbl.textContent = userCoins.toLocaleString("en-US");
  const mLbl = document.getElementById("mat-lbl");
  if (mLbl) mLbl.textContent = userMaterial.toLocaleString("en-US");

  const f1 = FIGURES_DB[Math.floor(Math.random() * FIGURES_DB.length)];
  const f2 = FIGURES_DB[(FIGURES_DB.indexOf(f1) + 5) % FIGURES_DB.length];
  renderHubAndCollection();
  const msg = document.getElementById("chest-reward-msg");
  if (msg) msg.textContent = `🎉 ${boxLabel}: Ganhou [${f1.rarity}] ${f1.name}! (Slot #${slotIdx + 1} agora está vazio)`;
  showBoosterUnboxModal(
    `🎁 ${boxLabel}`,
    tb.kind === "purple" ? [f1, f2] : [f1],
    `+${tb.kind === "purple" ? 150 : 50} Material · +1 Cube · +${tb.kind === "purple" ? "12,000" : "4,500"} Coins`
  );
}

function awardNewRealTimeBoosterToSlot(slotIdx) {
  const now = Date.now();
  const isPurple = Math.random() < 0.4;
  timeBoostersState[slotIdx] = isPurple
    ? { id: slotIdx, status: "unlocking", name: "Purple Time Booster (6h)", totalSec: 21600, endTs: now + 21600 * 1000, baseGems: 60, kind: "purple" }
    : { id: slotIdx, status: "unlocking", name: "Silver Time Booster (1h)", totalSec: 3600,  endTs: now + 3600 * 1000,  baseGems: 10, kind: "silver" };
  saveRealTimeBoosters();
  tickRealTimeBoosters();
}

function openLockedBooster() {
  const msg = document.getElementById("chest-reward-msg");
  if (playerKeyFragments < 10) {
    playSfx("tick");
    if (msg) {
      msg.textContent = `🔒 Locked Booster requer 10 Key Fragments (você tem ${playerKeyFragments}/10 🔑). Jogue partidas em [Play] para ganhar +3🔑 por vitória!`;
    }
    return;
  }
  playSfx("portal");
  playerKeyFragments -= 10;
  const kEl = document.getElementById("prof-keys-val");
  if (kEl) kEl.textContent = playerKeyFragments;
  const kLbl = document.getElementById("key-frag-lbl");
  const kWrap = document.getElementById("locked-key-badge-wrap");
  if (kLbl) kLbl.textContent = playerKeyFragments;
  if (kWrap) kWrap.style.display = playerKeyFragments > 0 ? "block" : "none";
  openBoosterChest("Locked Booster (10/10 Keys Desbloqueado!)");
}

window.trainerProfileData = {
  trainerId: "948-204-182",
  nickname: "Serebii",
  titleBadge: "Carmonte High Roller",
  rankRating: 2150,
  highestRating: 2480,
  leagueTier: "Champion",
  monthlyRank: 412,
  duelStats: {
    totalDuels: 540,
    wins: 365,
    losses: 175,
    winRate: "67.5%",
    currentWinStreak: 8,
    highestWinStreak: 14
  },
  trophies: ["Gym Cup 11-0 Invincible Trophy", "Carmonte Carnival S-Rank", "Tournament Top 32"],
  badges: ["Electric Specialist", "Surround Master", "Goal Rusher"],
  equippedCosmetics: {
    avatarGender: "Male",
    hairStyle: "Spiky_Gold",
    maskOrGlasses: "Cyber_Visor_Red",
    outfit: "Carmonte_Suit_Black",
    pedestalSkin: "Royal_Crystal_Plate"
  },
  mainDisplayFigure: "Greninja",
  favoriteFigures: ["Charizard", "Mewtwo", "Zapdos"]
};

function openPlayerProfileModal() {
  playSfx("tick");
  const m = document.getElementById("player-profile-modal");
  const p = window.trainerProfileData;
  const setTxt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  setTxt("prof-header-nick", p.nickname);
  setTxt("prof-id-lbl", p.trainerId);
  setTxt("prof-title-badge", p.titleBadge);
  setTxt("prof-rating-val", p.rankRating);
  setTxt("prof-tier-lbl", p.leagueTier + " League");
  setTxt("prof-max-rating-val", p.highestRating);
  setTxt("prof-keys-val", playerKeyFragments);
  setTxt("pstat-total", p.duelStats.totalDuels);
  setTxt("pstat-wins", p.duelStats.wins);
  setTxt("pstat-losses", p.duelStats.losses);
  setTxt("pstat-wr", p.duelStats.winRate);
  setTxt("pstat-streak", p.duelStats.currentWinStreak + "🔥");
  setTxt("pstat-maxstreak", p.duelStats.highestWinStreak + "🏆");

  const sel = document.getElementById("prof-centerpiece-select");
  if (sel) {
    sel.innerHTML = state.deckP1.map((fIdx, sPos) => {
      const f = FIGURES_DB[fIdx % FIGURES_DB.length];
      return `<option value="${sPos}" ${sPos === (selectedCarouselSlot % 6) ? "selected" : ""}>Slot #${sPos + 1} do Meu Time: [${f.rarity}] ${f.name}</option>`;
    }).join("");
  }
  refreshCloudAccountUI();
  if (m) m.style.display = "flex";
}
function closePlayerProfileModal() {
  const m = document.getElementById("player-profile-modal");
  if (m) m.style.display = "none";
}
function savePlayerProfileSettings() {
  const p = window.trainerProfileData;
  const inp = document.getElementById("prof-name-input");
  const tSel = document.getElementById("prof-title-select");
  const pSel = document.getElementById("prof-pedestal-select");
  const sel = document.getElementById("prof-centerpiece-select");
  if (inp && inp.value.trim()) {
    playerProfileName = inp.value.trim();
    p.nickname = playerProfileName;
    const lbl = document.getElementById("trainer-name-lbl");
    if (lbl) lbl.textContent = playerProfileName;
    const hNick = document.getElementById("prof-header-nick");
    if (hNick) hNick.textContent = playerProfileName;
  }
  if (tSel && tSel.value) {
    p.titleBadge = tSel.value;
    const tb = document.getElementById("prof-title-badge");
    if (tb) tb.textContent = p.titleBadge;
  }
  if (pSel && pSel.value) {
    p.equippedCosmetics.pedestalSkin = pSel.value;
  }
  if (sel && sel.value !== "") {
    const slotNum = parseInt(sel.value, 10);
    if (!isNaN(slotNum)) {
      selectedCarouselSlot = ((slotNum % 6) + 6) % 6;
      activeCenterpieceKey = "team_slot";
      const cf = FIGURES_DB[state.deckP1[selectedCarouselSlot] % FIGURES_DB.length];
      if (cf) p.mainDisplayFigure = cf.name;
    }
  }
  playSfx("portal");
}

function cycleCenterpieceFigurine() {
  playSfx("portal");
  // Cycles through the 6 Pokémon of the player's own team (`state.deckP1[0..5]`)!
  selectedCarouselSlot = (selectedCarouselSlot + 1) % 6;
  activeCenterpieceKey = "team_slot";
  const f = FIGURES_DB[state.deckP1[selectedCarouselSlot] % FIGURES_DB.length];
  const msg = document.getElementById("chest-reward-msg");
  if (msg && f) msg.textContent = `★ Time em Destaque (Slot #${selectedCarouselSlot + 1}/6): [${f.rarity}] ${f.name} (MP ${f.mp})`;
}

let homeCenterpieceShowPedestal = (typeof localStorage !== "undefined" && localStorage.getItem("pokeduel_show_pedestal") === "false") ? false : true;

function toggleHomePedestalMode() {
  homeCenterpieceShowPedestal = !homeCenterpieceShowPedestal;
  try {
    localStorage.setItem("pokeduel_show_pedestal", homeCenterpieceShowPedestal ? "true" : "false");
  } catch (e) {}
  playSfx("tick");
  updatePedestalToggleButton();
  const msg = document.getElementById("chest-reward-msg");
  if (msg) {
    msg.textContent = homeCenterpieceShowPedestal 
      ? `🏛️ ${typeof t === "function" ? t("hub.pedestal_on", "Palco: Com Pedestal") : "Palco: Com Pedestal"}` 
      : `✨ ${typeof t === "function" ? t("hub.pedestal_off", "Palco: Só a Peça") : "Palco: Só a Peça"}`;
  }
}

function updatePedestalToggleButton() {
  const txt = document.getElementById("home-pedestal-toggle-text");
  const icon = document.getElementById("home-pedestal-toggle-icon");
  const btn = document.getElementById("home-pedestal-toggle-btn");
  if (!txt || !icon) return;
  if (homeCenterpieceShowPedestal) {
    icon.textContent = "🏛️";
    txt.textContent = (typeof t === "function" ? t("hub.pedestal_on", "Pedestal: 3D") : "Pedestal: 3D");
    if (btn) {
      btn.style.borderColor = "#38bdf8";
      btn.style.color = "#7dd3fc";
      btn.style.background = "rgba(15, 23, 42, 0.88)";
    }
  } else {
    icon.textContent = "✨";
    txt.textContent = (typeof t === "function" ? t("hub.pedestal_off", "Só a Peça") : "Só a Peça");
    if (btn) {
      btn.style.borderColor = "#c084fc";
      btn.style.color = "#e9d5ff";
      btn.style.background = "rgba(30, 16, 50, 0.88)";
    }
  }
}
window.toggleHomePedestalMode = toggleHomePedestalMode;
window.updatePedestalToggleButton = updatePedestalToggleButton;

function renderHomeCarouselLoop() {
  if (hcCtx && document.getElementById("drawer-modal").classList.contains("show") &&
      document.getElementById("dtab-hub").style.display !== "none") {
    // Dynamic 1:1 Native Retina Resolution (prevents ANY horizontal squishing or blurriness!)
    const rect = homeCarouselCanvas.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 2);
    const targetW = Math.max(300, Math.round((rect.width || 380) * dpr));
    const targetH = Math.max(240, Math.round((rect.height || 340) * dpr));
    if (homeCarouselCanvas.width !== targetW || homeCarouselCanvas.height !== targetH) {
      homeCarouselCanvas.width = targetW;
      homeCarouselCanvas.height = targetH;
    }

    const W = homeCarouselCanvas.width, H = homeCarouselCanvas.height;
    const S = W / 415.0;
    const t = performance.now() * 0.002;

    hcCtx.save();
    hcCtx.imageSmoothingEnabled = true;
    hcCtx.imageSmoothingQuality = "high";
    hcCtx.clearRect(0, 0, W, H);

    // 1. Exact Royal-Blue to Cyan-Horizon Sky & Dark Horizon Band (`1001314047.jpg`)
    const skyH = H * 0.63;
    const skyGrad = hcCtx.createLinearGradient(0, 0, 0, skyH);
    skyGrad.addColorStop(0.0, "#020617");
    skyGrad.addColorStop(0.35, "#06153d");
    skyGrad.addColorStop(0.75, "#153e90");
    skyGrad.addColorStop(0.94, "#3b82f6");
    skyGrad.addColorStop(1.0, "#93c5fd");
    hcCtx.fillStyle = skyGrad;
    hcCtx.fillRect(0, 0, W, skyH);

    // Dark atmospheric horizon band
    const darkBandGrad = hcCtx.createLinearGradient(0, skyH - 8 * S, 0, H * 0.82);
    darkBandGrad.addColorStop(0.0, "#060b16");
    darkBandGrad.addColorStop(0.5, "#090d16");
    darkBandGrad.addColorStop(1.0, "#111827");
    hcCtx.fillStyle = darkBandGrad;
    hcCtx.fillRect(0, skyH - 4 * S, W, H - skyH + 4 * S);

    // 2. Exact Angled Silver-White V-Shaped Stage Floor (`1001314047.jpg`)
    hcCtx.save();
    hcCtx.beginPath();
    hcCtx.moveTo(0, H * 0.67);
    hcCtx.lineTo(W * 0.24, H * 0.83);
    hcCtx.lineTo(W * 0.76, H * 0.83);
    hcCtx.lineTo(W, H * 0.67);
    hcCtx.lineTo(W, H);
    hcCtx.lineTo(0, H);
    hcCtx.closePath();
    const floorGrad = hcCtx.createLinearGradient(0, H * 0.67, 0, H);
    floorGrad.addColorStop(0.0, "#b8d0e6");
    floorGrad.addColorStop(0.35, "#dce8f4");
    floorGrad.addColorStop(0.75, "#94b0cb");
    floorGrad.addColorStop(1.0, "#6482a0");
    hcCtx.fillStyle = floorGrad;
    hcCtx.fill();

    // Crisp V-shaped inner bevel line on the stage floor
    hcCtx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    hcCtx.lineWidth = 2.2 * S;
    hcCtx.beginPath();
    hcCtx.moveTo(0, H * 0.75);
    hcCtx.lineTo(W * 0.31, H * 0.96);
    hcCtx.lineTo(W * 0.69, H * 0.96);
    hcCtx.lineTo(W, H * 0.75);
    hcCtx.stroke();
    hcCtx.restore();

    const cx = W * 0.50;
    const cy = H * 0.50;

    // 3. Centerpiece Figurine: displays the currently selected Pokémon from the player's 6-Pokémon Team
    const teamSlotIdx = ((selectedCarouselSlot % 6) + 6) % 6;
    const centerFigDbIdx = state.deckP1[teamSlotIdx] !== undefined ? state.deckP1[teamSlotIdx] : state.deckP1[0];
    const centerFig = FIGURES_DB[centerFigDbIdx % FIGURES_DB.length] || FIGURES_DB[0];

    hcCtx.save();
    if (homeCenterpieceShowPedestal) {
      // Floor shadow under centerpiece pedestal
      hcCtx.fillStyle = "rgba(0, 0, 0, 0.72)";
      hcCtx.beginPath();
      hcCtx.ellipse(cx, cy + 54 * S, 110 * S, 30 * S, 0, 0, Math.PI * 2);
      hcCtx.fill();

      // 3D Pedestal
      if (homePedestal3DImg.complete && homePedestal3DImg.naturalWidth > 0) {
        const pw = 224 * S;
        const ph = pw * (homePedestal3DImg.naturalHeight / homePedestal3DImg.naturalWidth);
        hcCtx.drawImage(homePedestal3DImg, cx - pw / 2, cy + 62 * S - ph, pw, ph);
      }

      // Contact shadow under Pokémon figure on the top stone surface
      const cImg = loadedFigImages[centerFig.spriteKey] || loadedFigImages[centerFig.id] || loadedFigImages["pikachu"];
      if (cImg && cImg.complete) {
        const cw = 162 * S;
        const ch = cw * (cImg.naturalHeight / (cImg.naturalWidth || 1));
        const figX = cx - cw / 2;
        const figY = cy - ch + 18 * S;

        hcCtx.fillStyle = "rgba(0, 0, 0, 0.45)";
        hcCtx.beginPath();
        hcCtx.ellipse(cx, figY + ch - 4 * S, 44 * S, 12 * S, 0, 0, Math.PI * 2);
        hcCtx.fill();

        hcCtx.drawImage(cImg, figX, figY, cw, ch);
      }
    } else {
      // Pedestal OFF: "Só a Peça" - Pokémon figure stands cleanly on the stadium floor with authentic glowing ring base
      hcCtx.fillStyle = "rgba(0, 0, 0, 0.65)";
      hcCtx.beginPath();
      hcCtx.ellipse(cx, cy + 38 * S, 58 * S, 16 * S, 0, 0, Math.PI * 2);
      hcCtx.fill();

      hcCtx.save();
      hcCtx.strokeStyle = "rgba(56, 189, 248, 0.85)";
      hcCtx.lineWidth = 3 * S;
      hcCtx.shadowColor = "#38bdf8";
      hcCtx.shadowBlur = 14 * S;
      hcCtx.beginPath();
      hcCtx.ellipse(cx, cy + 38 * S, 52 * S, 14 * S, 0, 0, Math.PI * 2);
      hcCtx.stroke();
      hcCtx.restore();

      const cImg = loadedFigImages[centerFig.spriteKey] || loadedFigImages[centerFig.id] || loadedFigImages["pikachu"];
      if (cImg && cImg.complete) {
        const cw = 175 * S;
        const ch = cw * (cImg.naturalHeight / (cImg.naturalWidth || 1));
        const figX = cx - cw / 2;
        const figY = cy - ch + 40 * S;
        hcCtx.drawImage(cImg, figX, figY, cw, ch);
      }
    }
    hcCtx.restore();

    // 4. The 6 Active Deck Figurines (`state.deckP1[0..5]`) arranged in a fixed, elegant framing layout along the V-Stage floor (no 360 rotation!)
    const slotCoords = [
      { x: W * 0.10, y: H * 0.74, scale: 0.82 },
      { x: W * 0.22, y: H * 0.81, scale: 0.90 },
      { x: W * 0.34, y: H * 0.87, scale: 0.98 },
      { x: W * 0.66, y: H * 0.87, scale: 0.98 },
      { x: W * 0.78, y: H * 0.81, scale: 0.90 },
      { x: W * 0.90, y: H * 0.74, scale: 0.82 }
    ];

    const items = [];
    for (let slot = 0; slot < 6; slot++) {
      const coord = slotCoords[slot];
      const figIdx = state.deckP1[slot % 6];
      const fig = FIGURES_DB[figIdx % FIGURES_DB.length];
      items.push({ slot, px: coord.x, py: coord.y, scale: coord.scale, fig });
    }

    lastRenderedTeamSlots = items.map(x => ({ ...x }));
    items.sort((a, b) => a.py - b.py);

    items.forEach(it => {
      const img = loadedFigImages[it.fig.spriteKey] || loadedFigImages[it.fig.id] || loadedFigImages["pikachu"];
      const isCenterSelected = (it.slot === teamSlotIdx);
      hcCtx.save();
      hcCtx.translate(it.px, it.py);

      // Floor shadow under each figurine's pedestal
      hcCtx.fillStyle = "rgba(0, 0, 0, 0.68)";
      hcCtx.beginPath();
      hcCtx.ellipse(0, 14 * S * it.scale, 30 * S * it.scale, 9 * S * it.scale, 0, 0, Math.PI * 2);
      hcCtx.fill();

      // Glowing active gold/cyan ring on the currently selected team member
      if (isCenterSelected) {
        hcCtx.save();
        hcCtx.strokeStyle = "#facc15";
        hcCtx.lineWidth = 2.8 * S;
        hcCtx.shadowColor = "#facc15";
        hcCtx.shadowBlur = 12 * S;
        hcCtx.beginPath();
        hcCtx.ellipse(0, 13 * S * it.scale, 29 * S * it.scale, 8.5 * S * it.scale, 0, 0, Math.PI * 2);
        hcCtx.stroke();
        hcCtx.restore();
      }

      if (img && img.complete) {
        const drawW = 74 * S * it.scale;
        const drawH = drawW * (img.naturalHeight / (img.naturalWidth || 1));
        const bob = isCenterSelected ? Math.sin(t * 2.2) * (2.2 * S) : 0;
        hcCtx.drawImage(img, -drawW / 2, -drawH + 18 * S * it.scale + bob, drawW, drawH);
      }
      hcCtx.restore();
    });

    hcCtx.restore();
  }
  requestAnimationFrame(renderHomeCarouselLoop);
}

function switchDrawerTab(tabId) {
  ["hub", "deck", "fusion", "p2p", "shop", "menu"].forEach(t => {
    const el = document.getElementById("dtab-" + t);
    const btn = (t === "p2p") ? null : document.getElementById("dtab-btn-" + t);
    if (el) el.style.display = (t === tabId) ? (t === "hub" ? "flex" : "block") : "none";
    if (btn) btn.className = "nav-metal-btn" + (t === tabId ? " active" : "");
  });
  if (tabId === "fusion") renderFusionChamber();
  if (tabId === "shop") renderShopExchange();
  if (tabId === "deck" || tabId === "hub") renderHubAndCollection();
  if (tabId === "p2p" && document.getElementById("host-room-code-display").textContent === "----") generateNewRoomCode();
}

function openMenuSection(sec) {
  ["quests", "p2p", "surface", "monaco", "code"].forEach(s => {
    const el = document.getElementById("msec-" + s);
    if (el) el.style.display = (s === sec) ? "block" : "none";
  });
}

function showMenuPopup(kind) {
  playSfx("tick");
  const msgEl = document.getElementById("chest-reward-msg");
  if (!msgEl) return;
  if (kind === "rankings") msgEl.textContent = "🏆 Monthly Ranking: #142 Uptodown (2890 pts — Master League)";
  else if (kind === "featured") msgEl.textContent = "📺 Featured Duel: Master Rosé vs Champion Cynthia (Toque em PLAY para jogar!)";
  else if (kind === "missions") {
    state.rareMetals += 25;
    renderHubAndCollection();
    msgEl.textContent = "✅ Daily Missions (3/3): +25 Gems & 3 Key Fragments resgatados!";
  }
}

let userCarmonite = 850;
const CARMONITE_COST_BY_RARITY = { C: 10, UC: 20, R: 50, EX: 100, UX: 150 };
const CUBE_REQ_BY_RARITY       = { C: 30, UC: 9,  R: 3,  EX: 1,   UX: 1 };
const EXP_REQ_LV5_BY_RARITY    = { C: 2000, UC: 4000, R: 18000, EX: 42000, UX: 102000 };

function ensureFigureUpgradeMetadata(f) {
  if (!f) return;
  f.level = Math.max(1, Math.min(10, f.level || 5));
  f.clv   = Math.max(0, Math.min(10, f.clv || 0));
  if (!f.baseWheelLv1) {
    // Normalize base Level 1 wheel so total size === 96 and Miss >= 8
    const rawCopy = f.wheel.map(w => ({ ...w }));
    const sum = rawCopy.reduce((a, s) => a + s.size, 0);
    if (sum !== 96 && rawCopy.length > 0) {
      rawCopy[0].size = Math.max(4, rawCopy[0].size + (96 - sum));
    }
    f.baseWheelLv1 = rawCopy.map(w => ({ ...w }));
    // Reset current wheel to baseWheelLv1 and tracks spent points cleanly
    f.wheel = f.baseWheelLv1.map(w => ({ ...w }));
    f.diskPointsSpent = 0;
    f.clvAlloc = f.wheel.map((w, i) => (i === 0 && (w.color === "white" || w.color === "gold")) ? f.clv : 0);
    f.shrinkDonorIdx = f.wheel.findIndex(w => w.color === "red");
    if (f.shrinkDonorIdx === -1) f.shrinkDonorIdx = f.wheel.length - 1;
  }
}

function getAvailableDiskPoints(f) {
  ensureFigureUpgradeMetadata(f);
  const maxPts = Math.max(0, Math.min(9, f.level - 1)); // Max 4 at Lv.5, Max 9 at Lv.10!
  return Math.max(0, maxPts - (f.diskPointsSpent || 0));
}

function getAvailableClvPoints(f) {
  ensureFigureUpgradeMetadata(f);
  const spent = (f.clvAlloc || []).reduce((a, v) => a + v, 0);
  return Math.max(0, Math.min(10, f.clv) - spent);
}

function selectShrinkDonorSlice(figIdx, donorIdx) {
  const f = FIGURES_DB[figIdx] || FIGURES_DB[0];
  ensureFigureUpgradeMetadata(f);
  if (f.wheel[donorIdx] && f.wheel[donorIdx].size > 4) {
    f.shrinkDonorIdx = donorIdx;
    playSfx("tick");
    renderFusionChamber();
  } else {
    const msg = document.getElementById("fusion-status-msg");
    if (msg) msg.textContent = "⚠️ Regra Oficial: Nenhuma fatia (nem Miss) pode ser reduzida abaixo de Size 4!";
  }
}

function allocateClvDamageToSlice(figIdx, sliceIdx) {
  const f = FIGURES_DB[figIdx] || FIGURES_DB[0];
  ensureFigureUpgradeMetadata(f);
  const target = f.wheel[sliceIdx];
  const msg = document.getElementById("fusion-status-msg");
  if (!target || (target.color !== "white" && target.color !== "gold")) {
    if (msg) msg.textContent = "⚠️ Regra Oficial CLv: Pontos de Chain Level (+1 DMG) só podem ser aplicados em ataques White ou Gold!";
    return;
  }
  const availClv = getAvailableClvPoints(f);
  if (availClv <= 0) {
    if (f.clv >= 10) {
      if (msg) msg.textContent = "🛑 CAP MÁXIMO CLv 10/10 ATINGIDO! Use [↺ Reset Disk & CLv] se quiser mudar de golpe.";
    } else {
      if (msg) msg.textContent = `⚠️ Sem pontos CLv livres (${f.clv}/10)! Use 🟩 Green Cube (${CUBE_REQ_BY_RARITY[f.rarity]||1} Cube para +1 CLv).`;
    }
    return;
  }
  f.clvAlloc[sliceIdx] = (f.clvAlloc[sliceIdx] || 0) + 1;
  playSfx("portal");
  if (msg) msg.textContent = `🟩 +1 DMG (CLv) aplicado em [${target.name}]! Dano base agora: ${target.dmg + f.clvAlloc[sliceIdx]} (Cap CLv ${f.clv}/10).`;
  renderFusionChamber();
  demoFullMatchState();
}

function expandWheelSlice(figIdx, sliceIdx) {
  const f = FIGURES_DB[figIdx] || FIGURES_DB[0];
  ensureFigureUpgradeMetadata(f);
  const target = f.wheel[sliceIdx];
  const msg = document.getElementById("fusion-status-msg");
  if (!target) return;
  if (target.color === "red") {
    // Tapping a red Miss slice sets it as the shrink donor if > 4!
    selectShrinkDonorSlice(figIdx, sliceIdx);
    return;
  }

  const availPts = getAvailableDiskPoints(f);
  if (availPts <= 0) {
    if (f.level < 5) {
      if (msg) msg.textContent = `🛑 Cap do Lv.${f.level} atingido (${f.level-1}/${f.level-1} pts)! Use 🟦 Blue Rare Metal para subir até o Soft Cap Lv.5!`;
    } else if (f.level < 10) {
      const cCost = CARMONITE_COST_BY_RARITY[f.rarity] || 100;
      if (msg) msg.textContent = `🛑 Soft Cap Lv.${f.level} atingido! Use 🟣 Carmonite (${cCost} Carmonite) para desbloquear Lv.${f.level+1} (Hard Cap Lv.10)!`;
    } else {
      if (msg) msg.textContent = `🏆 HARD CAP MÁXIMO LV.10 ATINGIDO (9/9 Pontos distribuídos · Soma 96/96)! Use [↺ Reset] para redistribuir.`;
    }
    return;
  }

  // Official Rule: Lv.1-5 shrinks Miss (> 4); Lv.6-10 (Carmonite) shrinks chosen donor (> 4) or any slice > 4!
  let donor = null;
  if (typeof f.shrinkDonorIdx === "number" && f.shrinkDonorIdx !== sliceIdx && f.wheel[f.shrinkDonorIdx] && f.wheel[f.shrinkDonorIdx].size > 4) {
    donor = f.wheel[f.shrinkDonorIdx];
  }
  if (!donor) {
    donor = f.wheel.find((w, i) => i !== sliceIdx && w.color === "red" && w.size > 4)
         || f.wheel.find((w, i) => i !== sliceIdx && w.size > 4);
  }

  if (!donor || donor.size <= 4) {
    if (msg) msg.textContent = "⚠️ Nenhuma fatia doadora possui Size > 4 (o piso mínimo oficial de qualquer fatia é 4/96)!";
    return;
  }

  donor.size -= 1;
  target.size += 1;
  f.diskPointsSpent = (f.diskPointsSpent || 0) + 1;
  playSfx("portal");
  if (msg) {
    msg.textContent = `⚙️ +1 Disk Point: [${target.name}] subiu para ${target.size}/96 e [${donor.name}] caiu para ${donor.size}/96 (Restam ${getAvailableDiskPoints(f)} pts)!`;
  }
  renderFusionChamber();
  demoFullMatchState();
}

function resetFigureDiskAllocation() {
  const sel = document.getElementById("fusion-target-select");
  const idx = parseInt(sel ? sel.value : "0", 10);
  const f = FIGURES_DB[idx] || FIGURES_DB[0];
  ensureFigureUpgradeMetadata(f);
  f.wheel = f.baseWheelLv1.map(w => ({ ...w }));
  f.diskPointsSpent = 0;
  f.clvAlloc = f.wheel.map(() => 0);
  lastExpandedSliceIdx = -1;
  playSfx("portal");
  const msg = document.getElementById("fusion-status-msg");
  if (msg) msg.textContent = `↺ Roleta de ${f.name} resetada para Base Lv.1 (96/96)! Você tem ${getAvailableDiskPoints(f)} Disk Pts e ${getAvailableClvPoints(f)} CLv Pts para distribuir!`;
  renderFusionChamber();
  demoFullMatchState();
}

function autoAllocateDiskAndClv() {
  const sel = document.getElementById("fusion-target-select");
  const idx = parseInt(sel ? sel.value : "0", 10);
  const f = FIGURES_DB[idx] || FIGURES_DB[0];
  ensureFigureUpgradeMetadata(f);
  // Expand primary slice (0) using all available Disk Points
  while (getAvailableDiskPoints(f) > 0) {
    const before = f.diskPointsSpent;
    expandWheelSlice(idx, 0);
    if (f.diskPointsSpent === before) break;
  }
  // Allocate all available CLv points to strongest White/Gold slice
  const wgIdx = f.wheel.findIndex(w => w.color === "white" || w.color === "gold");
  if (wgIdx !== -1) {
    while (getAvailableClvPoints(f) > 0) {
      allocateClvDamageToSlice(idx, wgIdx);
    }
  }
  renderFusionChamber();
}

let lastExpandedSliceIdx = -1;
function renderFusionChamber() {
  const sel = document.getElementById("fusion-target-select");
  if (!sel) return;
  if (!sel.innerHTML) {
    sel.innerHTML = FIGURES_DB.map((f, i) => `<option value="${i}">[${f.rarity}] ${f.name} (Lv.${f.level}/10 · CLv+${f.clv})</option>`).join("");
  }
  const idx = parseInt(sel.value || "0", 10);
  const f = FIGURES_DB[idx] || FIGURES_DB[0];
  const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];

  // Render Live Interactive Circular Data Disk on `#fusion-wheel-canvas`
  const fCanv = document.getElementById("fusion-wheel-canvas");
  if (fCanv) {
    const fCtx = fCanv.getContext("2d");
    fCtx.clearRect(0, 0, 136, 136);
    drawAuthenticDataDisk(fCtx, 68, 68, 54, f.wheel, 0, lastExpandedSliceIdx, 0, f.rarity === "UX" ? "#c084fc" : "#38bdf8");
    fCanv.onclick = (ev) => {
      const rect = fCanv.getBoundingClientRect();
      const dx = (ev.clientX - rect.left) * (136 / rect.width) - 68;
      const dy = (ev.clientY - rect.top) * (136 / rect.height) - 68;
      let clickAng = Math.atan2(dy, dx) + Math.PI / 2;
      if (clickAng < 0) clickAng += Math.PI * 2;
      const total = f.wheel.reduce((a, s) => a + s.size, 0) || 96;
      let acc = 0;
      for (let sIdx = 0; sIdx < f.wheel.length; sIdx++) {
        const span = (f.wheel[sIdx].size / total) * Math.PI * 2;
        if (clickAng >= acc && clickAng <= acc + span) {
          lastExpandedSliceIdx = sIdx;
          expandWheelSlice(idx, sIdx);
          break;
        }
        acc += span;
      }
    };
  }

  ensureFigureUpgradeMetadata(f);
  const carmEl = document.getElementById("carmonite-lbl");
  if (carmEl) carmEl.textContent = userCarmonite;

  const box = document.getElementById("fusion-preview-box");
  if (box) {
    const availDiskPts = getAvailableDiskPoints(f);
    const maxDiskPts   = Math.max(0, f.level - 1);
    const availClvPts  = getAvailableClvPoints(f);
    const clvDots      = `<span style="color:#4ade80;">${"●".repeat(Math.min(10, f.clv))}</span><span style="color:#334155;">${"●".repeat(Math.max(0, 10 - f.clv))}</span>`;
    const wheelSum     = f.wheel.reduce((a, s) => a + s.size, 0);
    const carmReq      = CARMONITE_COST_BY_RARITY[f.rarity] || 100;
    const cubeReq      = CUBE_REQ_BY_RARITY[f.rarity] || 1;
    const capTag       = f.level >= 10 ? `<span style="color:#facc15; font-weight:900;">${typeof t === "function" ? t("fusion.max_reached", "[MAX CAP LV.10]") : "[MAX CAP LV.10]"}</span>`
                       : (f.level >= 5 ? `<span style="color:#c084fc; font-weight:900;">${typeof t === "function" ? t("fusion.carmonite", `[Lv.5 Soft Cap ➔ Requer ${carmReq} Carmonite]`) : `[Lv.5 Soft Cap ➔ Requer ${carmReq} Carmonite]`}</span>`
                                       : `<span style="color:#38bdf8; font-weight:900;">${typeof t === "function" ? t("fusion.rare_metal", "[Rare Metal até Lv.5]") : "[Rare Metal até Lv.5]"}</span>`);

    const sliceBtns = f.wheel.map((w, sIdx) => {
      const sClv = (f.clvAlloc && f.clvAlloc[sIdx]) || 0;
      const isDonor = (f.shrinkDonorIdx === sIdx);
      const canClv = (w.color === "white" || w.color === "gold");
      const locMove = (typeof localizeMove === "function") ? localizeMove(w.name) : w.name;
      const donorBtnText = isDonor ? '➖Doador ✓' : '➖-1';
      return `<div style="display:flex; align-items:center; justify-content:space-between; gap:3px; background:#0f172a; border:1px solid ${isDonor?'#f43f5e':'#334155'}; border-radius:4px; padding:2px 4px; width:100%;">
        <button onclick="lastExpandedSliceIdx=${sIdx}; expandWheelSlice(${idx}, ${sIdx})" style="background:${lastExpandedSliceIdx===sIdx?'#0284c7':'#1e293b'}; border:1px solid #38bdf8; color:#fff; border-radius:3px; padding:2px 5px; font-size:8px; font-weight:800; cursor:pointer; flex:1; text-align:left;">
          ➕ ${locMove} (${w.size}/96)${sClv>0?` +${sClv}DMG`:''}
        </button>
        <button onclick="selectShrinkDonorSlice(${idx}, ${sIdx})" title="Escolher fatia > 4 para reduzir (-1)" style="background:${isDonor?'#be123c':'#1e293b'}; border:1px solid #f43f5e; color:#fecdd3; border-radius:3px; padding:2px 4px; font-size:7.5px; font-weight:900; cursor:pointer;">
          ${w.size > 4 ? donorBtnText : '🔒Min4'}
        </button>
        ${canClv ? `<button onclick="allocateClvDamageToSlice(${idx}, ${sIdx})" style="background:#14532d; border:1px solid #4ade80; color:#dcfce7; border-radius:3px; padding:2px 4px; font-size:7.5px; font-weight:900; cursor:pointer;">+1⚔️</button>` : ''}
      </div>`;
    }).join("");

    box.innerHTML = `
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
        <img src="${sp.uri}" style="width:38px; height:38px; object-fit:contain;">
        <div>
          <div style="display:flex; align-items:center; gap:4px;">
            ${getRarityBadgeHtml(f.rarity)}
            <strong style="font-size:11.5px; color:#facc15;">${f.name}</strong>
            <span style="font-size:8px; color:#94a3b8;">(${wheelSum}/96)</span>
          </div>
          <div style="font-size:8.5px; color:#e2e8f0;">Level: <strong>${f.level}/10</strong> ${capTag}</div>
          <div style="font-size:8px; color:#fde047; font-weight:800;">Disk Pts Livres: <strong>${availDiskPts}</strong> (Usados: ${f.diskPointsSpent}/${maxDiskPts} · Máx 9)</div>
          <div style="font-size:8px; color:#cbd5e1;">CLv <strong>${f.clv}/10</strong> (${cubeReq} Cube/CLv · Livres: <strong>${availClvPts}</strong>): ${clvDots}</div>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; gap:2.5px; max-height:112px; overflow-y:auto;">${sliceBtns}</div>
    `;
  }
}

function toggleGoldenFigures() {
  state.goldenFiguresActive = !state.goldenFiguresActive;
  playSfx("portal");
  const lbl = document.getElementById("golden-fig-lbl");
  if (lbl) lbl.textContent = state.goldenFiguresActive ? "ON (24K)" : "OFF";
}

function startBracketRound(roundNum) {
  state.bracketRound = roundNum;
  const oppDecks = {
    1: [5, 2, 8, 4, 3, 7],   // Quarterfinal: MX•Louis Water/Grass Deck
    2: [3, 6, 1, 4, 9, 12],  // Semifinal: N•OSR 5-Runner Trap + Gengar
    3: [10, 11, 12, 13, 14, 0] // Grand Final: Rocket Rob / Cynthia UX Deck
  };
  state.deckP2 = oppDecks[roundNum] || state.deckP2;
  if (roundNum === 3) state.goldenFiguresActive = true;
  const st = document.getElementById("comp-format-status");
  if (st) st.textContent = `🏆 Disputando Rodada ${roundNum} do Torneio Oficial Bo3!`;
  startVideoAuthenticMatch();
}

// ============================================================================
// OFFICIAL POKÉMON DUEL BGM & SOUNDTRACK ENGINE (Shota Kageyama OST)
// Tracks: Carmonte Island Lounge, League Match Duel, Pinch Alert, Fanfares
// ============================================================================
let bgmTimer = null;
let bgmEnabled = true;

function checkPinchDanger() {
  try {
    if (typeof state === "undefined" || !state || !state.units || !Array.isArray(state.units)) return false;
    if (typeof NODE_BFS_DIST === "undefined" || !NODE_BFS_DIST) return false;
    for (const u of state.units) {
      if (!u || u.location !== "board" || typeof u.nodeId !== "number" || !NODE_BFS_DIST[u.nodeId]) continue;
      // P1 Goal is Node 10, P2 Goal is Node 3
      if (u.owner === "p2" && NODE_BFS_DIST[u.nodeId][10] <= 2) return true;
      if (u.owner === "p1" && NODE_BFS_DIST[u.nodeId][3] <= 2) return true;
    }
  } catch (e) {}
  return false;
}

const BgmEngine = {
  enabled: true,
  isPlaying: false,
  currentTrack: "lobby", // "lobby", "battle", "pinch"
  step: 0,
  stepTimer: null,
  masterGain: null,
  filterNode: null,
  fanfareActiveUntil: 0,

  // YouTube Official OST Player Integration
  ytPlayer: null,
  ytReady: false,
  ytPlaying: false,
  ytInitPending: false,
  audioSource: "webaudio", // "webaudio" | "youtube"
  playlistId: "PLjrVBVlg13D5yAiEr6l25nA_1XjTLddnq",
  trackMap: {
    title: 0,
    booster: 1,      // Success Jingle (Booster Open / Victory Rewards)
    defeat: 2,       // Lose Jingle
    lobby: 3,        // Main Menu / Carmonte Island Hub (Carmonte Lounge)
    training_hub: 4, // Training Center / Hotel Map
    concierge: 5,    // Hotel Concierge Duel
    battle: 6,       // Online Duel (League Match Battle Theme)
    pinch: 7,        // Online Duel Pinch (Goal under threat)
    epic: 8,         // Epic Duel
    victory: 13      // Victory Fanfare
  },

  ensureYouTubePlayer() {
    if (typeof document === "undefined") return;
    let container = document.getElementById("pokeduel-yt-bgm-container");
    if (!container && document.body) {
      container = document.createElement("div");
      container.id = "pokeduel-yt-bgm-container";
      container.style.cssText = "position:fixed; bottom:0; left:0; width:1px; height:1px; opacity:0.001; pointer-events:none; z-index:-1;";
      document.body.appendChild(container);
    }
    if (this.ytPlayer || this.ytInitPending) return;
    if (!window.YT || !window.YT.Player) {
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        document.head.appendChild(tag);
      }
      return;
    }
    this.ytInitPending = true;
    const pVars = {
      listType: "playlist",
      list: this.playlistId,
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      enablejsapi: 1,
      fs: 0,
      loop: 1,
      modestbranding: 1,
      playsinline: 1
    };
    if (window.location && window.location.protocol && window.location.protocol.startsWith("http")) {
      pVars.origin = window.location.origin;
    }
    try {
      this.ytPlayer = new YT.Player("pokeduel-yt-bgm-container", {
        height: "1",
        width: "1",
        playerVars: pVars,
        events: {
          onReady: (event) => {
            this.ytInitPending = false;
            this.ytReady = true;
            try {
              if (typeof event.target.unMute === "function") event.target.unMute();
              if (typeof event.target.setVolume === "function") event.target.setVolume(85);
              if (this.enabled && this.audioSource === "youtube") {
                const drawerModal = document.getElementById("drawer-modal");
                const isLobby = drawerModal && drawerModal.classList.contains("show");
                this.syncYouTubeTrack(isLobby ? "lobby" : "battle");
              }
            } catch (e) {}
          },
          onStateChange: (event) => {
            if (!window.YT) return;
            if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.BUFFERING) {
              this.ytPlaying = true;
            } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.CUED) {
              this.ytPlaying = false;
            } else if (event.data === YT.PlayerState.ENDED) {
              this.ytPlaying = false;
              const targetIdx = this.trackMap[this.currentTrack] ?? 3;
              try {
                this.ytPlayer.playVideoAt(targetIdx);
                this.ytPlayer.playVideo();
              } catch (e) {}
            }
          },
          onError: () => {
            this.ytInitPending = false;
            this.ytPlaying = false;
            if (this.enabled && this.audioSource === "youtube" && this.ytPlayer && typeof this.ytPlayer.loadPlaylist === "function") {
              const targetIdx = this.trackMap[this.currentTrack] ?? 3;
              try {
                this.ytPlayer.loadPlaylist({
                  list: this.playlistId,
                  listType: "playlist",
                  index: targetIdx,
                  startSeconds: 0
                });
              } catch (e) {}
            }
          }
        }
      });
    } catch (e) {
      this.ytInitPending = false;
    }
  },

  cycleAudioSource() {
    this.audioSource = (this.audioSource === "youtube") ? "webaudio" : "youtube";
    try {
      localStorage.setItem("pokeduel_bgm_source", this.audioSource);
    } catch (e) {}
    if (this.audioSource === "webaudio") {
      this.ytPlaying = false;
      if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === "function") {
        try { this.ytPlayer.pauseVideo(); } catch (e) {}
      }
      if (this.enabled && !this.stepTimer) this.playStep();
    } else {
      if (!this.enabled) {
        this.enabled = true;
        bgmEnabled = true;
        try { localStorage.setItem("pokeduel_bgm_enabled", "1"); } catch (e) {}
      }
      this.ensureYouTubePlayer();
      const drawerModal = document.getElementById("drawer-modal");
      const isLobby = drawerModal && drawerModal.classList.contains("show");
      this.currentTrack = isLobby ? "lobby" : "battle";
      this.syncYouTubeTrack(this.currentTrack);
      if (!this.stepTimer) this.playStep();
    }
    this.syncUi();
  },

  syncYouTubeTrack(targetTrack) {
    if (this.audioSource !== "youtube" || !this.enabled) return;
    this.ensureYouTubePlayer();
    if (!this.ytReady || !this.ytPlayer) return;
    const targetIdx = this.trackMap[targetTrack] ?? 3;
    try {
      if (typeof this.ytPlayer.unMute === "function") this.ytPlayer.unMute();
      if (typeof this.ytPlayer.setVolume === "function") this.ytPlayer.setVolume(85);

      let currentIdx = -1;
      let playerState = -1;
      try {
        if (typeof this.ytPlayer.getPlaylistIndex === "function") currentIdx = this.ytPlayer.getPlaylistIndex();
        if (typeof this.ytPlayer.getPlayerState === "function") playerState = this.ytPlayer.getPlayerState();
      } catch (e) {}

      // If already set on this track:
      if (currentIdx === targetIdx) {
        this.currentTrack = targetTrack;
        // If already playing (1) or buffering (3), do NOT touch or restart playback!
        if (playerState === 1 || playerState === 3) {
          this.ytPlaying = true;
          return;
        }
        // If paused (2) or cued (5), just un-pause without resetting timeline
        if (typeof this.ytPlayer.playVideo === "function") {
          this.ytPlayer.playVideo();
        }
        return;
      }

      this.currentTrack = targetTrack;
      const pl = (typeof this.ytPlayer.getPlaylist === "function") ? this.ytPlayer.getPlaylist() : null;
      if (!pl || !Array.isArray(pl) || pl.length === 0) {
        if (typeof this.ytPlayer.loadPlaylist === "function") {
          this.ytPlayer.loadPlaylist({
            list: this.playlistId,
            listType: "playlist",
            index: targetIdx,
            startSeconds: 0
          });
        }
      } else if (typeof this.ytPlayer.playVideoAt === "function") {
        this.ytPlayer.playVideoAt(targetIdx);
        if (typeof this.ytPlayer.playVideo === "function") this.ytPlayer.playVideo();
      }
    } catch (e) {}
  },

  N: {
    C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, B2: 123.47,
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, B3: 246.94,
    C4: 261.63, Cs4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
    C5: 523.25, Cs5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98,
    _: 0
  },

  initNodes() {
    if (!sfxCtx) ensureAudio();
    if (!sfxCtx) return;
    audioCtx = sfxCtx;
    if (!this.masterGain) {
      try {
        this.masterGain = sfxCtx.createGain();
        this.masterGain.gain.setValueAtTime(0.16, sfxCtx.currentTime);
        this.filterNode = sfxCtx.createBiquadFilter();
        this.filterNode.type = "lowpass";
        this.filterNode.frequency.setValueAtTime(4200, sfxCtx.currentTime);
        this.filterNode.Q.setValueAtTime(1.0, sfxCtx.currentTime);
        this.masterGain.connect(this.filterNode);
        this.filterNode.connect(sfxCtx.destination);
      } catch (e) {}
    } else {
      try {
        this.masterGain.gain.setValueAtTime(0.16, sfxCtx.currentTime);
      } catch (e) {}
    }
  },

  // Carmonte Island Hub Theme (112 BPM lounge groove)
  getLobbyPattern() {
    const N = this.N;
    return [
      { l: N.F4,  b: N.F2,  c: [N.A3, N.C4, N.E4], r: "kick" },
      { l: N.A4,  b: N._,   c: null,               r: "hihat" },
      { l: N.C5,  b: N.F2,  c: null,               r: "snare" },
      { l: N.E5,  b: N._,   c: null,               r: "hihat" },
      { l: N.D5,  b: N.C3,  c: [N.A3, N.C4],       r: "kick" },
      { l: N.C5,  b: N._,   c: null,               r: "hihat" },
      { l: N.A4,  b: N.E3,  c: null,               r: "snare" },
      { l: N.G4,  b: N._,   c: null,               r: "hihat" },
      { l: N.A4,  b: N.A2,  c: [N.C4, N.E4, N.G4], r: "kick" },
      { l: N.C5,  b: N._,   c: null,               r: "hihat" },
      { l: N.D5,  b: N.A2,  c: null,               r: "snare" },
      { l: N.C5,  b: N._,   c: null,               r: "hihat" },
      { l: N.F5,  b: N.E3,  c: [N.C4, N.E4],       r: "kick" },
      { l: N.E5,  b: N._,   c: null,               r: "hihat" },
      { l: N.D5,  b: N.G3,  c: null,               r: "snare" },
      { l: N.C5,  b: N._,   c: null,               r: "hihat" },
      { l: N.Bb4, b: N.Bb2, c: [N.D4, N.F4, N.A4], r: "kick" },
      { l: N.D5,  b: N._,   c: null,               r: "hihat" },
      { l: N.F5,  b: N.Bb2, c: null,               r: "snare" },
      { l: N.G5,  b: N._,   c: null,               r: "hihat" },
      { l: N.F5,  b: N.F3,  c: [N.D4, N.F4],       r: "kick" },
      { l: N.D5,  b: N._,   c: null,               r: "hihat" },
      { l: N.C5,  b: N.A3,  c: null,               r: "snare" },
      { l: N.Bb4, b: N._,   c: null,               r: "hihat" },
      { l: N.C5,  b: N.C3,  c: [N.E4, N.G4, N.Bb4],r: "kick" },
      { l: N.E5,  b: N._,   c: null,               r: "hihat" },
      { l: N.G5,  b: N.C3,  c: null,               r: "snare" },
      { l: N.Bb5, b: N._,   c: null,               r: "hihat" },
      { l: N.A5,  b: N.G3,  c: [N.E4, N.G4],       r: "kick" },
      { l: N.G5,  b: N._,   c: null,               r: "hihat" },
      { l: N.F5,  b: N.Bb3, c: null,               r: "snare" },
      { l: N.E5,  b: N._,   c: null,               r: "hihat" }
    ];
  },

  // League Match Duel Theme (134 BPM energetic tournament battle)
  getBattlePattern() {
    const N = this.N;
    return [
      { l: N.D4,  b: N.D2,  c: [N.F3, N.A3], r: "kick" },
      { l: N.F4,  b: N.D2,  c: null,         r: "hihat" },
      { l: N.A4,  b: N.D2,  c: null,         r: "snare" },
      { l: N.D5,  b: N.F2,  c: null,         r: "hihat" },
      { l: N.A4,  b: N.D2,  c: [N.F3, N.A3], r: "kick" },
      { l: N.F4,  b: N.D2,  c: null,         r: "hihat" },
      { l: N.G4,  b: N.G2,  c: null,         r: "snare" },
      { l: N.A4,  b: N.A2,  c: null,         r: "hihat" },
      { l: N.F4,  b: N.D2,  c: [N.F3, N.A3], r: "kick" },
      { l: N.D4,  b: N.D2,  c: null,         r: "hihat" },
      { l: N.E4,  b: N.D2,  c: null,         r: "snare" },
      { l: N.F4,  b: N.F2,  c: null,         r: "hihat" },
      { l: N.D4,  b: N.D2,  c: [N.D3, N.F3], r: "kick" },
      { l: N.C4,  b: N.A2,  c: null,         r: "hihat" },
      { l: N.D4,  b: N.D2,  c: null,         r: "snare" },
      { l: N._,   b: N.D2,  c: null,         r: "hihat" },
      { l: N.Bb4, b: N.Bb2, c: [N.D4, N.F4], r: "kick" },
      { l: N.D5,  b: N.Bb2, c: null,         r: "hihat" },
      { l: N.F5,  b: N.Bb2, c: null,         r: "snare" },
      { l: N.Bb5, b: N.D3,  c: null,         r: "hihat" },
      { l: N.A5,  b: N.C3,  c: [N.E4, N.G4], r: "kick" },
      { l: N.F5,  b: N.C3,  c: null,         r: "hihat" },
      { l: N.G5,  b: N.C3,  c: null,         r: "snare" },
      { l: N.A5,  b: N.E3,  c: null,         r: "hihat" },
      { l: N.G5,  b: N.D2,  c: [N.F3, N.A3], r: "kick" },
      { l: N.E5,  b: N.D2,  c: null,         r: "hihat" },
      { l: N.F5,  b: N.D2,  c: null,         r: "snare" },
      { l: N.D5,  b: N.F2,  c: null,         r: "hihat" },
      { l: N.E5,  b: N.A2,  c: [N.E3, N.A3], r: "kick" },
      { l: N.Cs5, b: N.A2,  c: null,         r: "hihat" },
      { l: N.D5,  b: N.D2,  c: [N.D3, N.F3], r: "snare" },
      { l: N._,   b: N.D2,  c: null,         r: "hihat" }
    ];
  },

  // Pinch Battle Theme (156 BPM goal under threat alarm)
  getPinchPattern() {
    const N = this.N;
    return [
      { l: N.E5,  b: N.E2,  c: [N.G3, N.B3], r: "kick" },
      { l: N.Gs5, b: N._,   c: null,         r: "hihat" },
      { l: N.A5,  b: N.E2,  c: null,         r: "snare" },
      { l: N.Gs5, b: N._,   c: null,         r: "hihat" },
      { l: N.A5,  b: N.F2,  c: [N.A3, N.C4], r: "kick" },
      { l: N.B5,  b: N._,   c: null,         r: "hihat" },
      { l: N.C6,  b: N.Fs2, c: null,         r: "snare" },
      { l: N.B5,  b: N._,   c: null,         r: "hihat" },
      { l: N.A5,  b: N.E2,  c: [N.G3, N.B3], r: "kick" },
      { l: N.Gs5, b: N._,   c: null,         r: "hihat" },
      { l: N.F5,  b: N.D2,  c: null,         r: "snare" },
      { l: N.D5,  b: N._,   c: null,         r: "hihat" },
      { l: N.E5,  b: N.E2,  c: [N.Gs3, N.B3],r: "kick" },
      { l: N.Fs5, b: N._,   c: null,         r: "hihat" },
      { l: N.Gs5, b: N.E2,  c: null,         r: "snare" },
      { l: N.A5,  b: N._,   c: null,         r: "hihat" }
    ];
  },

  playStep() {
    if (!this.enabled || !sfxCtx) return;
    if (Date.now() < this.fanfareActiveUntil) {
      if (this.stepTimer) clearTimeout(this.stepTimer);
      this.stepTimer = setTimeout(() => this.playStep(), 250);
      return;
    }

    this.initNodes();
    const now = sfxCtx.currentTime;
    const drawerModal = document.getElementById("drawer-modal");
    const isLobby = drawerModal && drawerModal.classList.contains("show");

    let pattern, intervalMs, isPinch = false;
    const prevTrack = this.currentTrack;
    if (isLobby) {
      pattern = this.getLobbyPattern();
      intervalMs = 135;
      this.currentTrack = "lobby";
    } else {
      isPinch = checkPinchDanger();
      if (isPinch) {
        pattern = this.getPinchPattern();
        intervalMs = 96;
        this.currentTrack = "pinch";
      } else {
        pattern = this.getBattlePattern();
        intervalMs = 112;
        this.currentTrack = "battle";
      }
    }

    if (this.audioSource === "youtube") {
      if (this.currentTrack !== prevTrack) {
        this.syncYouTubeTrack(this.currentTrack);
      }
      if (this.stepTimer) clearTimeout(this.stepTimer);
      this.stepTimer = setTimeout(() => {
        this.playStep();
      }, 400);
      return;
    }

    const cur = pattern[this.step % pattern.length];
    this.step++;

    try {
      if (cur.l && cur.l > 0) {
        const osc = sfxCtx.createOscillator();
        const g = sfxCtx.createGain();
        osc.type = isLobby ? "triangle" : (isPinch ? "sawtooth" : "square");
        osc.frequency.setValueAtTime(cur.l, now);
        const leadVol = isLobby ? 0.08 : (isPinch ? 0.10 : 0.075);
        g.gain.setValueAtTime(leadVol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + (intervalMs * 0.001 * 0.95));
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + (intervalMs * 0.001));
      }

      if (cur.b && cur.b > 0) {
        const bOsc = sfxCtx.createOscillator();
        const bG = sfxCtx.createGain();
        bOsc.type = isLobby ? "triangle" : "sawtooth";
        bOsc.frequency.setValueAtTime(cur.b, now);
        bG.gain.setValueAtTime(isLobby ? 0.10 : 0.12, now);
        bG.gain.exponentialRampToValueAtTime(0.001, now + (intervalMs * 0.001 * 1.5));
        bOsc.connect(bG);
        bG.connect(this.masterGain);
        bOsc.start(now);
        bOsc.stop(now + (intervalMs * 0.001 * 1.55));
      }

      if (cur.c && Array.isArray(cur.c)) {
        cur.c.forEach(freq => {
          const cOsc = sfxCtx.createOscillator();
          const cG = sfxCtx.createGain();
          cOsc.type = "sine";
          cOsc.frequency.setValueAtTime(freq, now);
          cG.gain.setValueAtTime(0.035, now);
          cG.gain.exponentialRampToValueAtTime(0.001, now + (intervalMs * 0.001 * 3.8));
          cOsc.connect(cG);
          cG.connect(this.masterGain);
          cOsc.start(now);
          cOsc.stop(now + (intervalMs * 0.001 * 4.0));
        });
      }

      if (cur.r) {
        if (cur.r === "kick") {
          const kOsc = sfxCtx.createOscillator();
          const kG = sfxCtx.createGain();
          kOsc.type = "sine";
          kOsc.frequency.setValueAtTime(140, now);
          kOsc.frequency.exponentialRampToValueAtTime(38, now + 0.08);
          kG.gain.setValueAtTime(0.12, now);
          kG.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
          kOsc.connect(kG);
          kG.connect(this.masterGain);
          kOsc.start(now);
          kOsc.stop(now + 0.09);
        } else if (cur.r === "snare") {
          const sOsc = sfxCtx.createOscillator();
          const sG = sfxCtx.createGain();
          sOsc.type = "triangle";
          sOsc.frequency.setValueAtTime(210, now);
          sOsc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
          sG.gain.setValueAtTime(0.08, now);
          sG.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
          sOsc.connect(sG);
          sG.connect(this.masterGain);
          sOsc.start(now);
          sOsc.stop(now + 0.07);
        } else if (cur.r === "hihat") {
          const hOsc = sfxCtx.createOscillator();
          const hG = sfxCtx.createGain();
          hOsc.type = "square";
          hOsc.frequency.setValueAtTime(8500, now);
          hOsc.frequency.exponentialRampToValueAtTime(3200, now + 0.025);
          hG.gain.setValueAtTime(0.035, now);
          hG.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
          hOsc.connect(hG);
          hG.connect(this.masterGain);
          hOsc.start(now);
          hOsc.stop(now + 0.028);
        }
      }
    } catch (e) {}

    if (this.stepTimer) clearTimeout(this.stepTimer);
    this.stepTimer = setTimeout(() => {
      this.playStep();
    }, intervalMs);
  },

  playFanfare(type) {
    if (!this.enabled) return;
    if (this.audioSource === "youtube" && this.ytReady && this.ytPlayer) {
      const fanfareTrack = (type === "victory") ? "victory" : ((type === "defeat") ? "defeat" : "booster");
      this.syncYouTubeTrack(fanfareTrack);
    }
    this.initNodes();
    if (!sfxCtx) return;
    const now = sfxCtx.currentTime;
    const N = this.N;

    this.fanfareActiveUntil = Date.now() + 3200;

    try {
      if (type === "victory") {
        const notes = [
          { f: N.G4, t: 0.00, d: 0.12 },
          { f: N.C5, t: 0.12, d: 0.12 },
          { f: N.E5, t: 0.24, d: 0.12 },
          { f: N.G5, t: 0.36, d: 0.22 },
          { f: N.E5, t: 0.58, d: 0.12 },
          { f: N.G5, t: 0.70, d: 0.14 },
          { f: N.C6, t: 0.84, d: 1.40 }
        ];
        notes.forEach(n => {
          const osc = sfxCtx.createOscillator();
          const g = sfxCtx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(n.f, now + n.t);
          g.gain.setValueAtTime(0.12, now + n.t);
          g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
          osc.connect(g);
          g.connect(this.masterGain);
          osc.start(now + n.t);
          osc.stop(now + n.t + n.d + 0.05);
        });
        [N.C5, N.E5, N.G5, N.C6].forEach(f => {
          const hOsc = sfxCtx.createOscillator();
          const hG = sfxCtx.createGain();
          hOsc.type = "sine";
          hOsc.frequency.setValueAtTime(f, now + 0.84);
          hG.gain.setValueAtTime(0.07, now + 0.84);
          hG.gain.exponentialRampToValueAtTime(0.001, now + 2.3);
          hOsc.connect(hG);
          hG.connect(this.masterGain);
          hOsc.start(now + 0.84);
          hOsc.stop(now + 2.4);
        });
      } else if (type === "defeat") {
        const notes = [
          { f: N.D5,  t: 0.00, d: 0.25 },
          { f: N.Cs5, t: 0.25, d: 0.25 },
          { f: N.C5,  t: 0.50, d: 0.25 },
          { f: N.B4,  t: 0.75, d: 0.30 },
          { f: N.Bb4, t: 1.05, d: 0.30 },
          { f: N.A4,  t: 1.35, d: 1.20 }
        ];
        notes.forEach(n => {
          const osc = sfxCtx.createOscillator();
          const g = sfxCtx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(n.f, now + n.t);
          g.gain.setValueAtTime(0.08, now + n.t);
          g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
          osc.connect(g);
          g.connect(this.masterGain);
          osc.start(now + n.t);
          osc.stop(now + n.t + n.d + 0.05);
        });
      } else if (type === "booster") {
        const notes = [
          { f: N.C5, t: 0.00, d: 0.08 },
          { f: N.E5, t: 0.08, d: 0.08 },
          { f: N.G5, t: 0.16, d: 0.08 },
          { f: N.B5, t: 0.24, d: 0.08 },
          { f: N.D6, t: 0.32, d: 0.10 },
          { f: N.E6, t: 0.42, d: 0.12 },
          { f: N.G6, t: 0.54, d: 0.90 }
        ];
        notes.forEach(n => {
          const osc = sfxCtx.createOscillator();
          const g = sfxCtx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(n.f, now + n.t);
          g.gain.setValueAtTime(0.10, now + n.t);
          g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
          osc.connect(g);
          g.connect(this.masterGain);
          osc.start(now + n.t);
          osc.stop(now + n.t + n.d + 0.05);
        });
      }
    } catch (e) {}
  },

  start() {
    if (!this.enabled) return;
    if (this.isPlaying) {
      if (this.audioSource === "youtube") {
        if (this.ytPlaying) return;
        if (this.ytPlayer && typeof this.ytPlayer.getPlayerState === "function") {
          const s = this.ytPlayer.getPlayerState();
          if (s === 1 || s === 3) {
            this.ytPlaying = true;
            return;
          }
        }
      } else if (this.audioSource === "webaudio" && this.stepTimer) {
        return;
      }
    }
    this.initNodes();
    this.isPlaying = true;
    if (this.audioSource === "youtube" && this.ytReady && this.ytPlayer) {
      try {
        const isLobby = document.getElementById("drawer-modal")?.classList.contains("show");
        this.syncYouTubeTrack(isLobby ? "lobby" : "battle");
      } catch (e) {}
    }
    if (this.audioSource === "webaudio" || !this.ytReady) {
      if (!this.stepTimer) {
        this.playStep();
      }
    }
    this.syncUi();
  },

  stop() {
    this.isPlaying = false;
    if (this.stepTimer) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === "function") {
      try { this.ytPlayer.pauseVideo(); } catch (e) {}
    }
    this.syncUi();
  },

  toggle() {
    this.enabled = !this.enabled;
    bgmEnabled = this.enabled;
    try {
      localStorage.setItem("pokeduel_bgm_enabled", this.enabled ? "1" : "0");
    } catch (e) {}
    if (this.enabled) {
      this.start();
    } else {
      this.stop();
    }
    this.syncUi();
  },

  syncUi() {
    const mBtn = document.getElementById("menu-bgm-btn");
    if (mBtn) {
      mBtn.textContent = this.enabled ? "🎵 Música (BGM): ON" : "🔇 Música (BGM): OFF";
      mBtn.className = "btn " + (this.enabled ? "gold" : "secondary");
    }
    const sBtn = document.getElementById("menu-bgm-source-btn");
    if (sBtn) {
      sBtn.textContent = (this.audioSource === "youtube") ? "💿 Fonte: YouTube OST" : "🎛️ Fonte: Web Audio";
      sBtn.className = "btn " + (this.audioSource === "youtube" ? "gold" : "secondary");
    }
    const bBtn = document.getElementById("bgm-toggle-btn");
    if (bBtn) {
      bBtn.textContent = this.enabled ? "🎵ON" : "🔇OFF";
    }
  }
};

function toggleWebAudioBgm() {
  ensureAudio();
  BgmEngine.toggle();
}

function applyFusionMaterial(matType) {
  const sel = document.getElementById("fusion-target-select");
  const idx = parseInt(sel ? sel.value : "0", 10);
  const f = FIGURES_DB[idx] || FIGURES_DB[0];
  ensureFigureUpgradeMetadata(f);
  const msg = document.getElementById("fusion-status-msg");
  playSfx("portal");

  if (matType === "rare_metal") {
    // Official Rule: Blue Rare Metal can ONLY level a figure up to Level 5 (Soft Cap)!
    if (f.level >= 5) {
      msg.textContent = `🛑 SOFT CAP LV.5 ATINGIDO! Rare Metal só funciona do Lv.1 ao Lv.5. Para subir do Lv.6 ao Lv.10 (Hard Cap), use 🟣 Carmonite!`;
    } else {
      f.level += 1;
      userCoins = Math.max(0, userCoins - 2500);
      const cLbl = document.getElementById("coins-lbl");
      if (cLbl) cLbl.textContent = userCoins.toLocaleString("en-US");
      msg.textContent = `🟦 Rare Metal fundido (-2,500 Coins)! ${f.name} subiu para Lv.${f.level}/5 (+1 Disk Expansion Point liberado)!`;
    }
  } else if (matType === "carmonite") {
    // Official Rule: Carmonite can ONLY be used on figures at Level 5..9, up to the Level 10 Hard Cap!
    const carmReq = CARMONITE_COST_BY_RARITY[f.rarity] || 100;
    if (f.level < 5) {
      msg.textContent = `⚠️ Regra Oficial: ${f.name} está no Lv.${f.level}. Carmonite só pode ser usada a partir do Lv.5 (use 🟦 Rare Metal primeiro)!`;
    } else if (f.level >= 10) {
      msg.textContent = `🏆 HARD CAP MÁXIMO LV.10/10 JÁ ATINGIDO em ${f.name} (9/9 Disk Expansion Points totais)!`;
    } else if (userCarmonite < carmReq) {
      msg.textContent = `⚠️ Carmonite insuficiente (${userCarmonite}/${carmReq} necessários para raridade [${f.rarity}])!`;
    } else {
      userCarmonite -= carmReq;
      f.level += 1;
      msg.textContent = `🟣 -${carmReq} Carmonite aplicada! ${f.name} subiu para Lv.${f.level}/10 (+1 Disk Point liberado — escolha qual fatia expandir e qual > 4 reduzir)!`;
    }
  } else if (matType === "cube") {
    // Official Rule: CLv Hard Cap is 10! Requires C:30, UC:9, R:3, EX:1, UX:1 Cubes per CLv!
    const cubeReq = CUBE_REQ_BY_RARITY[f.rarity] || 1;
    if (f.clv >= 10) {
      msg.textContent = `🛑 CAP MÁXIMO CLv 10/10 ATINGIDO em ${f.name} (+10 DMG máximo oficial)!`;
    } else {
      if (state.chainCubes >= cubeReq) state.chainCubes -= cubeReq;
      f.clv = Math.min(10, f.clv + 1);
      // Automatically allocate +1 DMG to primary White/Gold slice if available
      const wgIdx = f.wheel.findIndex(w => w.color === "white" || w.color === "gold");
      if (wgIdx !== -1) f.clvAlloc[wgIdx] = (f.clvAlloc[wgIdx] || 0) + 1;
      msg.textContent = `🟩 Chain Level Up (-${cubeReq} Cube [${f.rarity}])! ${f.name} subiu para CLv ${f.clv}/10 (+1 DMG no ataque White/Gold)!`;
    }
  } else if (matType === "ingot") {
    // Official v7.0.14 doubled UX Ingot sale value = 360,000 Coins!
    userCoins += 360000;
    const cLbl = document.getElementById("coins-lbl");
    if (cLbl) cLbl.textContent = userCoins.toLocaleString("en-US");
    msg.textContent = `🟨 Gold Ingot [UX] vendido na loja da Tia! +360,000 Coins adicionadas!`;
  }
  sel.innerHTML = FIGURES_DB.map((fig, i) => `<option value="${i}" ${i === idx ? "selected" : ""}>[${fig.rarity}] ${fig.name} (Lv.${fig.level}/10 · CLv ${fig.clv}/10)</option>`).join("");
  renderFusionChamber();
  renderHubAndCollection();
  demoFullMatchState();
}

function claimDailyGems() {
  playSfx("portal");
  state.rareMetals += 50;
  userMaterial += 250;
  document.getElementById("rm-lbl").textContent = state.rareMetals;
  { const ml = document.getElementById("mat-lbl"); if (ml) ml.textContent = userMaterial.toLocaleString("en-US"); }
  const m = document.getElementById("shop-exchange-msg");
  if (m) m.textContent = "🎁 +50 Gems e +250 Material adicionados à sua conta!";
}

function buyShopBooster(count) {
  playSfx("portal");
  const cost = count === 10 ? 250 : 100;
  if (state.rareMetals >= cost) state.rareMetals -= cost;
  userMaterial += count * 50;
  state.chainCubes += 2;
  const pulledList = [];
  const showCount = count === 10 ? 6 : 4;
  for (let i = 0; i < showCount; i++) {
    pulledList.push(FIGURES_DB[(Math.floor(Math.random() * FIGURES_DB.length) + i * 3) % FIGURES_DB.length]);
  }
  document.getElementById("rm-lbl").textContent = state.rareMetals;
  { const ml = document.getElementById("mat-lbl"); if (ml) ml.textContent = userMaterial.toLocaleString("en-US"); }
  const m = document.getElementById("shop-exchange-msg");
  if (m) m.textContent = `🎉 Você abriu o ${count}-Pack Booster: ganhou [${pulledList[0].rarity}] ${pulledList[0].name} + ${count * 50} Material + 2 Cubes UX/EX!`;
  renderHubAndCollection();
  showBoosterUnboxModal(
    `📦 ${count}-PACK UX/EX BOOSTER OPENED!`,
    pulledList,
    `+${count * 50} Material (Total: ${userMaterial}) · +2 Cubes UX/EX · Garantido [UX]/[EX]!`
  );
}

const OFFICIAL_MATERIAL_COSTS = { UX: 5000, EX: 4000, R: 1800, UC: 450, C: 250 };

function renderShopExchange() {
  const grid = document.getElementById("shop-material-grid");
  if (!grid) return;
  const ml = document.getElementById("mat-lbl");
  if (ml) ml.textContent = userMaterial.toLocaleString("en-US");
  grid.innerHTML = FIGURES_DB.map((f, idx) => {
    const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
    const mCost = OFFICIAL_MATERIAL_COSTS[f.rarity] || 1800;
    return `
      <div class="card" style="margin-bottom:0; text-align:center;">
        <img src="${sp.uri}" style="width:44px; height:44px; object-fit:contain;">
        <div style="font-size:10px; font-weight:900;">${f.name}</div>
        <div style="font-size:8.5px; color:#facc15; margin-bottom:4px;">[${f.rarity}] · MP ${f.mp}</div>
        <button class="btn gold" style="width:100%; font-size:8.5px; padding:4px;" onclick="exchangeMaterialForFigure(${idx})">🔷 ${mCost.toLocaleString("en-US")} Mat</button>
      </div>
    `;
  }).join("");
}

function exchangeMaterialForFigure(idx) {
  playSfx("portal");
  const f = FIGURES_DB[idx] || FIGURES_DB[0];
  const mCost = OFFICIAL_MATERIAL_COSTS[f.rarity] || 1800;
  if (userMaterial >= mCost) {
    userMaterial -= mCost;
  }
  const ml = document.getElementById("mat-lbl");
  if (ml) ml.textContent = userMaterial.toLocaleString("en-US");
  toggleDeckEquip(idx);
  const m = document.getElementById("shop-exchange-msg");
  if (m) m.textContent = `✅ [${f.rarity}] ${f.name} adquirido por ${mCost.toLocaleString("en-US")} Material e equipado no seu Deck!`;
}


// ============================================================================


// SECTION 12: v4.5.0 OFFICIAL PROGRESSION ENGINE
// (1 STARTER TEAM -> UNLOCK POKÉMON IN MATCH-WON BOXES & SHOP!)
// ============================================================================
const PROGRESSION_STORAGE_KEY = "pdr_progression_v450";
const STARTER_TEAM_INDICES = [1, 2, 3, 4, 6, 0]; // Pikachu, Squirtle, Bulbasaur, Eevee, Charmander, Charizard

function createFreshProgressionState() {
  return {
    version: "4.5.0",
    unlockedFigures: [...STARTER_TEAM_INDICES],
    figureCopies: { 1: 1, 2: 1, 3: 1, 4: 1, 6: 1, 0: 1 },
    teams: [
      { name: "Time #1 (Inicial)", slots: [...STARTER_TEAM_INDICES] }
    ],
    activeTeamIdx: 0,
    victoryBoxesWon: 0,
    totalBoxesOpened: 0,
    matchesWon: 0
  };
}

function loadProgressionState() {
  try {
    const raw = localStorage.getItem(PROGRESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.unlockedFigures) && Array.isArray(parsed.teams) && parsed.teams.length >= 1) {
        return parsed;
      }
    }
  } catch (e) {}
  const fresh = createFreshProgressionState();
  try { localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(fresh)); } catch (e) {}
  return fresh;
}

let playerProgression = loadProgressionState();

function saveProgressionState() {
  try {
    localStorage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(playerProgression));
  } catch (e) {}
}

function isFigureUnlocked(figIdx) {
  return playerProgression.unlockedFigures.includes(figIdx);
}

// ============================================================================
// DECK BALANCE RULES (MAX 1 MEGA · 1 UX · 2 EX) & MULTI-UNIT QUANTITY ENGINE
// ============================================================================
const MAX_DECK_MEGAS = 1;
const MAX_DECK_UX    = 1;
const MAX_DECK_EX    = 2;

function ensureFigureCopiesMap() {
  if (!playerProgression.figureCopies || typeof playerProgression.figureCopies !== "object") {
    playerProgression.figureCopies = {};
  }
  if (Array.isArray(playerProgression.unlockedFigures)) {
    playerProgression.unlockedFigures.forEach(idx => {
      const cur = parseInt(playerProgression.figureCopies[idx], 10);
      if (!cur || cur < 1) playerProgression.figureCopies[idx] = 1;
    });
  }
}

function getOwnedFigureUnits(figIdx) {
  if (!isFigureUnlocked(figIdx)) return 0;
  ensureFigureCopiesMap();
  return Math.max(1, parseInt(playerProgression.figureCopies[figIdx], 10) || 1);
}

function getEquippedFigureCount(figIdx, deckArr) {
  const arr = Array.isArray(deckArr) ? deckArr : (state.deckP1 || []);
  let cnt = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === figIdx) cnt++;
  }
  return cnt;
}

function isMegaPokemonFigure(f) {
  if (!f) return false;
  const nm = String(f.name || "");
  const id = String(f.id || "");
  return Boolean(
    nm.startsWith("Mega ") ||
    nm.startsWith("Primal ") ||
    id.startsWith("mega") ||
    id.startsWith("primal_") ||
    (f.megaTurns && f.megaTurns > 0)
  );
}

function getFigureDeckCategory(f) {
  if (!f) return "STANDARD";
  if (isMegaPokemonFigure(f)) return "MEGA";
  if (f.rarity === "UX") return "UX";
  if (f.rarity === "EX") return "EX";
  return "STANDARD";
}

function countDeckBalanceStats(deckIndices) {
  const arr = Array.isArray(deckIndices) ? deckIndices : [];
  let megas = 0;
  let uxs = 0;
  let exs = 0;
  let standards = 0;
  for (let i = 0; i < arr.length; i++) {
    const f = FIGURES_DB[arr[i] % FIGURES_DB.length] || FIGURES_DB[0];
    const cat = getFigureDeckCategory(f);
    if (cat === "MEGA") megas++;
    else if (cat === "UX") uxs++;
    else if (cat === "EX") exs++;
    else standards++;
  }
  return {
    megas,
    uxs,
    exs,
    standards,
    valid: (megas <= MAX_DECK_MEGAS && uxs <= MAX_DECK_UX && exs <= MAX_DECK_EX)
  };
}

function sanitizeTeamSlotsForBalance(slots) {
  ensureFigureCopiesMap();
  const fallbackPool = [2, 3, 4, 6, 1, 0]; // Squirtle (UC), Bulbasaur (UC), Eevee (UC), Charmander (UC), Pikachu (EX), Charizard (EX)
  let megas = 0;
  let uxs = 0;
  let exs = 0;
  const usedCopies = {};

  for (let i = 0; i < 6; i++) {
    let idx = slots[i];
    if (typeof idx !== "number" || idx < 0 || idx >= FIGURES_DB.length || !isFigureUnlocked(idx)) {
      idx = STARTER_TEAM_INDICES[i % STARTER_TEAM_INDICES.length];
    }
    const f = FIGURES_DB[idx] || FIGURES_DB[0];
    const cat = getFigureDeckCategory(f);
    const owned = getOwnedFigureUnits(idx);
    const curUsed = usedCopies[idx] || 0;

    let violates = false;
    if (curUsed + 1 > owned) violates = true;
    if (cat === "MEGA" && megas + 1 > MAX_DECK_MEGAS) violates = true;
    if (cat === "UX" && uxs + 1 > MAX_DECK_UX) violates = true;
    if (cat === "EX" && exs + 1 > MAX_DECK_EX) violates = true;

    if (violates) {
      // Pick an unlocked figure that respects rarity caps & unit counts, or grant +1 unit of a UC starter if needed
      let replacement = -1;
      for (const cand of playerProgression.unlockedFigures) {
        const cf = FIGURES_DB[cand];
        if (!cf) continue;
        const cCat = getFigureDeckCategory(cf);
        if (cCat === "MEGA" && megas + 1 > MAX_DECK_MEGAS) continue;
        if (cCat === "UX" && uxs + 1 > MAX_DECK_UX) continue;
        if (cCat === "EX" && exs + 1 > MAX_DECK_EX) continue;
        if ((usedCopies[cand] || 0) + 1 <= getOwnedFigureUnits(cand)) {
          replacement = cand;
          break;
        }
      }
      if (replacement === -1) {
        const ucStarter = fallbackPool[i % 4]; // 2, 3, 4, 6 are all UC
        if (!isFigureUnlocked(ucStarter)) playerProgression.unlockedFigures.push(ucStarter);
        playerProgression.figureCopies[ucStarter] = Math.max(getOwnedFigureUnits(ucStarter), (usedCopies[ucStarter] || 0) + 1);
        replacement = ucStarter;
      }
      idx = replacement;
    }

    slots[i] = idx;
    usedCopies[idx] = (usedCopies[idx] || 0) + 1;
    const finalCat = getFigureDeckCategory(FIGURES_DB[idx]);
    if (finalCat === "MEGA") megas++;
    else if (finalCat === "UX") uxs++;
    else if (finalCat === "EX") exs++;
  }
}

window.getOwnedFigureUnits = getOwnedFigureUnits;
window.getEquippedFigureCount = getEquippedFigureCount;
window.isMegaPokemonFigure = isMegaPokemonFigure;
window.getFigureDeckCategory = getFigureDeckCategory;
window.countDeckBalanceStats = countDeckBalanceStats;

// Sync active team with state.deckP1 & DECK_PRESETS
function syncProgressionToDeckState() {
  ensureFigureCopiesMap();
  if (!playerProgression.teams || playerProgression.teams.length === 0) {
    playerProgression.teams = [{ name: "Time #1", slots: [...STARTER_TEAM_INDICES] }];
  }
  // Enforce maximum 3 teams limit!
  if (playerProgression.teams.length > 3) {
    playerProgression.teams = playerProgression.teams.slice(0, 3);
  }
  activeDeckPresetIdx = Math.max(0, Math.min(playerProgression.teams.length - 1, playerProgression.activeTeamIdx || 0));
  playerProgression.activeTeamIdx = activeDeckPresetIdx;
  // Ensure every team respects unlocked figures, owned unit quantities, and 1 Mega / 1 UX / 2 EX limits
  playerProgression.teams.forEach(t => {
    if (!Array.isArray(t.slots) || t.slots.length < 6) {
      t.slots = [...STARTER_TEAM_INDICES];
    }
    sanitizeTeamSlotsForBalance(t.slots);
  });
  const curSlots = playerProgression.teams[activeDeckPresetIdx].slots;
  state.deckP1 = [...curSlots];
  DECK_PRESETS.length = 0;
  playerProgression.teams.forEach(t => DECK_PRESETS.push([...t.slots]));
}

// On a fresh v4.5.0 profile (0 matches won & 0 boxes opened), start Hub Time Booster slots EMPTY so boxes are earned by winning matches!
const TB_V450_INIT_KEY = "pdr_tb_v450_empty_initialized";
if (!localStorage.getItem(TB_V450_INIT_KEY)) {
  try {
    localStorage.setItem(TB_V450_INIT_KEY, "1");
    timeBoostersState[0] = { id: 0, status: "empty", name: "Silver Time Booster (1h)", totalSec: 3600,  endTs: 0, baseGems: 10, kind: "silver" };
    timeBoostersState[1] = { id: 1, status: "empty", name: "Purple Time Booster (6h)", totalSec: 21600, endTs: 0, baseGems: 60, kind: "purple" };
    timeBoostersState[2] = { id: 2, status: "empty", name: "Silver Time Booster (1h)", totalSec: 3600,  endTs: 0, baseGems: 10, kind: "silver" };
    saveRealTimeBoosters();
  } catch (e) {}
}

/**
 * Smart Gacha Roll that balances unlocking new Pokémon (65%) and rolling duplicates (35%) so players can accumulate multiple units (x2, x3...)!
 */
function rollFiguresForBox(count, guaranteedHighRarity = false) {
  const lockedIndices = [];
  const unlockedIndices = [];
  for (let i = 0; i < FIGURES_DB.length; i++) {
    if (!isFigureUnlocked(i)) lockedIndices.push(i);
    else unlockedIndices.push(i);
  }
  const pulledIndices = [];
  for (let c = 0; c < count; c++) {
    // 65% chance to pull a NEW locked Pokémon if any remain; 35% chance to pull any Pokémon (including duplicates to gain +1 Unidade!)
    const pool = (lockedIndices.length > 0 && Math.random() < 0.65)
      ? lockedIndices
      : Array.from({ length: FIGURES_DB.length }, (_, k) => k);
    let chosenIdx = pool[Math.floor(Math.random() * pool.length)];
    if (guaranteedHighRarity && c === 0) {
      const highPool = pool.filter(idx => FIGURES_DB[idx].rarity === "UX" || FIGURES_DB[idx].rarity === "EX" || FIGURES_DB[idx].rarity === "R");
      if (highPool.length > 0) chosenIdx = highPool[Math.floor(Math.random() * highPool.length)];
    }
    pulledIndices.push(chosenIdx);
    const lPos = lockedIndices.indexOf(chosenIdx);
    if (lPos !== -1) lockedIndices.splice(lPos, 1);
  }
  return pulledIndices;
}

/**
 * Unlocks pulled figures (or adds +1 Unidade & +1 CLv if duplicate) and displays the Unboxing Modal with NEW / QUANTITY badges!
 */
function unlockAndShowBoosterModal(title, pulledIndices, bonusText) {
  if (typeof BgmEngine !== "undefined") {
    BgmEngine.playFanfare("booster");
  }
  ensureFigureCopiesMap();
  const cardData = pulledIndices.map(idx => {
    const f = FIGURES_DB[idx] || FIGURES_DB[0];
    const wasUnlocked = isFigureUnlocked(idx);
    if (!wasUnlocked) {
      playerProgression.unlockedFigures.push(idx);
      playerProgression.figureCopies[idx] = 1;
    } else {
      playerProgression.figureCopies[idx] = getOwnedFigureUnits(idx) + 1;
      ensureFigureUpgradeMetadata(f);
      if (f.clv < 10) {
        f.clv += 1;
        const wgIdx = f.wheel.findIndex(w => w.color === "white" || w.color === "gold");
        if (wgIdx !== -1) f.clvAlloc[wgIdx] = (f.clvAlloc[wgIdx] || 0) + 1;
      }
    }
    return { idx, fig: f, isNew: !wasUnlocked, copies: playerProgression.figureCopies[idx] };
  });
  playerProgression.totalBoxesOpened = (playerProgression.totalBoxesOpened || 0) + 1;
  saveProgressionState();
  renderHubAndCollection();
  renderShopExchange();

  const modal = document.getElementById("booster-unbox-modal");
  const tEl = document.getElementById("unbox-title");
  const gEl = document.getElementById("unbox-cards-grid");
  const bEl = document.getElementById("unbox-bonus-summary");
  if (tEl) tEl.textContent = title;
  if (bEl) {
    bEl.textContent = `${bonusText} · Coleção: ${playerProgression.unlockedFigures.length}/${FIGURES_DB.length} Desbloqueados!`;
  }
  if (gEl) {
    gEl.innerHTML = cardData.map(c => {
      const f = c.fig;
      const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
      const statusPill = c.isNew
        ? `<div style="background:#16a34a; color:#fff; font-size:8px; font-weight:900; padding:2px 5px; border-radius:4px; margin-top:3px;">✨ NOVO! (📦 x1 UNIDADE)</div>`
        : `<div style="background:#0284c7; color:#fff; font-size:7.8px; font-weight:900; padding:2px 5px; border-radius:4px; margin-top:3px;">📦 REPETIDO! AGORA TEM x${c.copies} UNIDADES! (+1 CLv)</div>`;
      return `<div style="background:linear-gradient(180deg,#1e293b,#090d16); border:2px solid ${c.isNew ? '#4ade80' : (f.rarity==='UX'?'#c084fc':'#facc15')}; border-radius:8px; padding:6px; text-align:center; box-shadow:${c.isNew ? '0 0 14px rgba(74,222,128,0.45)' : 'none'};">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
          ${getRarityBadgeHtml(f.rarity)}
          <span style="font-size:8px; color:#bae6fd; font-weight:900;">MP ${f.mp} · 📦x${c.copies}</span>
        </div>
        <img src="${sp.uri}" style="width:48px; height:48px; object-fit:contain;">
        <div style="font-size:10px; font-weight:900; color:#fff;">${f.name}</div>
        <div style="font-size:8px; color:#94a3b8;">${f.type}</div>
        ${statusPill}
      </div>`;
    }).join("");
  }
  const openStaticModal = () => {
    if (modal) modal.style.display = "flex";
  };
  const pulledFigures = cardData.map(c => c.fig);
  if (typeof BoosterCinematic !== "undefined") {
    BoosterCinematic.start(pulledFigures, pulledFigures.length > 1, title, bonusText, openStaticModal);
  } else {
    openStaticModal();
  }
}

function openEarnedVictoryBox() {
  if ((playerProgression.victoryBoxesWon || 0) <= 0) {
    playSfx("tick");
    const m = document.getElementById("shop-exchange-msg");
    if (m) m.textContent = "⚠️ Você tem 0 Caixas de Vitória! Vença uma partida em [Play] para ganhar Caixas de Pokémon!";
    const cm = document.getElementById("chest-reward-msg");
    if (cm) cm.textContent = "⚠️ Vença uma partida para ganhar uma Caixa de Vitória e desbloquear novos Pokémon!";
    return;
  }
  playSfx("portal");
  playerProgression.victoryBoxesWon -= 1;
  userMaterial += 100;
  userCoins += 3500;
  state.chainCubes += 1;
  const cLbl = document.getElementById("coins-lbl");
  if (cLbl) cLbl.textContent = userCoins.toLocaleString("en-US");
  const mLbl = document.getElementById("mat-lbl");
  if (mLbl) mLbl.textContent = userMaterial.toLocaleString("en-US");

  const pulled = rollFiguresForBox(2, true);
  saveProgressionState();
  unlockAndShowBoosterModal(
    "🏆 CAIXA DE VITÓRIA ABERTA!",
    pulled,
    "+100 Material · +3,500 Coins · +1 Cube"
  );
}

function openVictoryBoxFromWinScreen() {
  closeWinResultOverlay();
  openDrawer("deck");
  openEarnedVictoryBox();
}

// Override showWinResultScreen so winning a match awards +1 Victory Box + 1 Hub Time Booster + 3 Keys + 50 Gems!
showWinResultScreen = function(winner) {
  const didWin = (winner === getBottomRole());
  const ov = document.getElementById("win-result-overlay");
  const t = document.getElementById("win-result-title");
  if (t) {
    t.textContent = didWin ? "WIN" : "LOSE";
    t.style.color = didWin ? "#facc15" : "#f87171";
  }
  if (window.trainerProfileData) {
    const p = window.trainerProfileData;
    const oppRating = (remoteOpponentProfile && remoteOpponentProfile.rankRating) ? remoteOpponentProfile.rankRating : (window.trainerProfileData.rankRating || 1000);
    const expected = 1 / (1 + Math.pow(10, (oppRating - p.rankRating) / 400));
    const delta = Math.round(32 * ((didWin ? 1 : 0) - expected));
    p.rankRating = Math.max(800, p.rankRating + delta);
    if (p.rankRating > p.highestRating) p.highestRating = p.rankRating;
    p.leagueTier = p.rankRating >= 2700 ? "Legend" : (p.rankRating >= 2300 ? "Master" : (p.rankRating >= 1900 ? "Champion" : (p.rankRating >= 1500 ? "Leader" : "Beginner")));
    p.duelStats.totalDuels += 1;
    if (didWin) {
      p.duelStats.wins += 1;
      p.duelStats.currentWinStreak += 1;
      if (p.duelStats.currentWinStreak > p.duelStats.highestWinStreak) p.duelStats.highestWinStreak = p.duelStats.currentWinStreak;
    } else {
      p.duelStats.losses += 1;
      p.duelStats.currentWinStreak = 0;
    }
    p.duelStats.winRate = ((p.duelStats.wins / p.duelStats.totalDuels) * 100).toFixed(1) + "%";
    const rVal = document.getElementById("win-rating-val");
    const rDel = document.getElementById("win-rating-delta");
    const lPts = document.getElementById("league-pts-lbl");
    if (rVal) rVal.textContent = `${p.rankRating} (${p.leagueTier})`;
    if (rDel) {
      rDel.textContent = (delta >= 0 ? `+${delta} ↑` : `${delta} ↓`);
      rDel.style.color = delta >= 0 ? "#4ade80" : "#f87171";
    }
    if (lPts) lPts.textContent = p.rankRating;
  }

  playerKeyFragments = Math.min(10, playerKeyFragments + (didWin ? 3 : 1));
  const kLbl = document.getElementById("key-frag-lbl");
  const kWrap = document.getElementById("locked-key-badge-wrap");
  if (kLbl) kLbl.textContent = playerKeyFragments;
  if (kWrap) kWrap.style.display = playerKeyFragments > 0 ? "block" : "none";

  const keysValEl = document.getElementById("win-keys-val");
  const gemsValEl = document.getElementById("win-gems-val");
  const boxBadgeEl = document.getElementById("win-box-badge");
  const boxDescEl  = document.getElementById("win-box-desc");
  const boxBtnEl   = document.getElementById("win-open-box-btn");

  if (didWin) {
    playerProgression.matchesWon = (playerProgression.matchesWon || 0) + 1;
    playerProgression.victoryBoxesWon = (playerProgression.victoryBoxesWon || 0) + 1;
    state.rareMetals += 50;
    userCoins += 2500;
    const rmEl = document.getElementById("rm-lbl");
    if (rmEl) rmEl.textContent = state.rareMetals;
    const cLbl = document.getElementById("coins-lbl");
    if (cLbl) cLbl.textContent = userCoins.toLocaleString("en-US");

    const emptySlot = timeBoostersState.findIndex((x, i) => i < 3 && x.status === "empty");
    if (emptySlot !== -1) awardNewRealTimeBoosterToSlot(emptySlot);
    saveProgressionState();

    if (keysValEl) keysValEl.textContent = `+3 🔑 (${playerKeyFragments}/10)`;
    if (gemsValEl) gemsValEl.textContent = `+50 🔻`;
    if (boxBadgeEl) {
      boxBadgeEl.textContent = `🎁 +1 CAIXA DE VITÓRIA GANHA! (Total: ${playerProgression.victoryBoxesWon})`;
      boxBadgeEl.style.color = "#fde047";
    }
    if (boxDescEl) {
      boxDescEl.textContent = "Você venceu o duelo e ganhou 1 Caixa de Vitória para desbloquear novos Pokémon (+1 Time Booster colocado no Hub)!";
    }
    if (boxBtnEl) {
      boxBtnEl.style.display = "block";
      boxBtnEl.textContent = `⏱️ VER CRONÔMETRO NO HUB (${playerProgression.victoryBoxesWon})`;
    }
  } else {
    if (keysValEl) keysValEl.textContent = `+1 🔑 (${playerKeyFragments}/10)`;
    if (gemsValEl) gemsValEl.textContent = `+0 🔻`;
    if (boxBadgeEl) {
      boxBadgeEl.textContent = `❌ SEM CAIXA DE VITÓRIA NESTA PARTIDA`;
      boxBadgeEl.style.color = "#f87171";
    }
    if (boxDescEl) {
      boxDescEl.textContent = "As Caixas de Pokémon são ganhas apenas em partidas vencidas! Tente novamente ou visite a Loja.";
    }
    if (boxBtnEl) boxBtnEl.style.display = "none";
  }

  renderHubAndCollection();
  renderShopExchange();
  if (ov) ov.style.display = "flex";
};

// Override openBoosterChest (used by Locked Booster 10/10 Keys) to genuinely unlock figures!
openBoosterChest = function(boxName) {
  playSfx("portal");
  state.rareMetals += 50;
  state.chainCubes += 1;
  userCoins += 15000;
  const rmEl = document.getElementById("rm-lbl");
  if (rmEl) rmEl.textContent = state.rareMetals;
  const cLbl = document.getElementById("coins-lbl");
  if (cLbl) cLbl.textContent = userCoins.toLocaleString("en-US");

  const pulled = rollFiguresForBox(2, true);
  const f1 = FIGURES_DB[pulled[0]], f2 = FIGURES_DB[pulled[1]];
  const msg = document.getElementById("chest-reward-msg");
  if (msg) msg.textContent = `🎉 ${boxName}: Desbloqueou/Obteve [${f1.rarity}] ${f1.name} & [${f2.rarity}] ${f2.name}!`;
  unlockAndShowBoosterModal(
    `🎁 ${boxName.toUpperCase()}`,
    pulled,
    `+50 Gems · +1 Cube EX/UX · +15,000 Coins`
  );
};

// Override consumeAndUnboxTimeBooster so Hub Time Boosters won in matches genuinely unlock figures!
consumeAndUnboxTimeBooster = function(slotIdx, gemCostSpent) {
  const tb = timeBoostersState[slotIdx];
  if (!tb) return;
  if (gemCostSpent > 0) {
    state.rareMetals = Math.max(0, state.rareMetals - gemCostSpent);
    const rmEl = document.getElementById("rm-lbl");
    if (rmEl) rmEl.textContent = state.rareMetals;
  }

  const boxLabel = tb.name + (gemCostSpent > 0 ? ` (Acelerado por 🔻${gemCostSpent})` : " (Tempo Concluído!)");
  tb.status = "empty";
  tb.endTs = 0;
  saveRealTimeBoosters();
  tickRealTimeBoosters();

  playSfx("portal");
  state.chainCubes += 1;
  userMaterial += (tb.kind === "purple" ? 150 : 50);
  userCoins += (tb.kind === "purple" ? 12000 : 4500);
  const cLbl = document.getElementById("coins-lbl");
  if (cLbl) cLbl.textContent = userCoins.toLocaleString("en-US");
  const mLbl = document.getElementById("mat-lbl");
  if (mLbl) mLbl.textContent = userMaterial.toLocaleString("en-US");

  const pulled = rollFiguresForBox(tb.kind === "purple" ? 2 : 1, tb.kind === "purple");
  const f1 = FIGURES_DB[pulled[0]];
  const msg = document.getElementById("chest-reward-msg");
  if (msg) msg.textContent = `🎉 ${boxLabel}: Desbloqueou/Obteve [${f1.rarity}] ${f1.name}! (Slot #${slotIdx + 1} vazio — vença outra partida!)`;
  unlockAndShowBoosterModal(
    `🎁 ${boxLabel}`,
    pulled,
    `+${tb.kind === "purple" ? 150 : 50} Material · +1 Cube · +${tb.kind === "purple" ? "12,000" : "4,500"} Coins`
  );
};

// If player clicks an empty Time Booster slot in the Hub and has a Victory Box ready, offer to open it or remind them to win a match!
const _origHandleTimeBoosterClick = handleTimeBoosterClick;
handleTimeBoosterClick = function(slotIdx) {
  if (slotIdx === 3) {
    const msgEl = document.getElementById("chest-reward-msg");
    if ((playerProgression.victoryBoxesWon || 0) > 0) {
      openEarnedVictoryBox();
      return;
    }
    playSfx("tick");
    if (msgEl) msgEl.textContent = "🏆 As Caixas são ganhas vencendo partidas! Toque em [Play] e vença um duelo para ganhar sua Caixa!";
    return;
  }
  const tb = timeBoostersState[slotIdx];
  if (tb && tb.status === "empty" && (playerProgression.victoryBoxesWon || 0) > 0) {
    openEarnedVictoryBox();
    return;
  }
  _origHandleTimeBoosterClick(slotIdx);
};

// Override buyShopBooster so Shop Boosters (1x, 2x, 4x, 6x) genuinely unlock new Pokémon!
buyShopBooster = function(count) {
  const costMap = { 1: 50, 2: 100, 4: 200, 6: 300, 10: 250 };
  const cost = costMap[count] || (count * 50);
  const m = document.getElementById("shop-exchange-msg");
  if (state.rareMetals < cost) {
    playSfx("hit");
    const needed = cost - state.rareMetals;
    if (m) m.textContent = `⚠️ Gemas insuficientes (${state.rareMetals}/${cost}🔻)! Faltam ${needed} Gemas.`;
    const addGems = confirm(
      `⚠️ Gemas insuficientes para abrir este Booster Pack (${count}x)!\n\n` +
      `Você possui: 🔻 ${state.rareMetals} Gems\n` +
      `Custo: 🔻 ${cost} Gems (Faltam 🔻 ${needed} Gems)\n\n` +
      `Deseja adicionar +300 Gems bônus para abrir a caixa agora?`
    );
    if (addGems) {
      state.rareMetals += 300;
      saveEconomyAndUpgrades();
      syncAllCurrencyLabels();
      buyShopBooster(count);
    }
    return;
  }
  playSfx("portal");
  state.rareMetals -= cost;
  userMaterial += count * 50;
  state.chainCubes += (count >= 4 ? 2 : 1);
  saveEconomyAndUpgrades();
  syncAllCurrencyLabels();

  const pulledIndices = rollFiguresForBox(count, count >= 4);
  const firstFig = FIGURES_DB[pulledIndices[0]];
  if (m) m.textContent = `🎉 Você abriu o ${count}x Booster na Loja: desbloqueou/obteve [${firstFig.rarity}] ${firstFig.name} + ${count * 50} Material!`;
  unlockAndShowBoosterModal(
    `🛒 LOJA: ${count}x BOOSTER PACK ABERTO!`,
    pulledIndices,
    `+${count * 50} Material (Total: ${userMaterial}) · +${count >= 4 ? 2 : 1} Cube`
  );
};

// Override renderShopExchange & exchangeMaterialForFigure to show Locked vs Unlocked status and unlock on purchase!
renderShopExchange = function() {
  const grid = document.getElementById("shop-material-grid");
  if (!grid) return;
  const ml = document.getElementById("mat-lbl");
  if (ml) ml.textContent = userMaterial.toLocaleString("en-US");
  const vBoxLbl = document.getElementById("shop-victory-boxes-lbl");
  if (vBoxLbl) vBoxLbl.textContent = playerProgression.victoryBoxesWon || 0;
  const vBoxBtn = document.getElementById("shop-open-victory-btn");
  if (vBoxBtn) {
    const vCount = playerProgression.victoryBoxesWon || 0;
    vBoxBtn.textContent = vCount > 0 ? `🎁 Abrir Caixa (${vCount})` : `🔒 Vença 1 Partida`;
    vBoxBtn.style.opacity = vCount > 0 ? "1.0" : "0.65";
  }

  grid.innerHTML = FIGURES_DB.map((f, idx) => {
    const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
    const mCost = OFFICIAL_MATERIAL_COSTS[f.rarity] || 1800;
    const unlocked = isFigureUnlocked(idx);
    return `
      <div class="card" style="margin-bottom:0; text-align:center; border-color:${unlocked ? 'rgba(74,222,128,0.45)' : 'rgba(250,204,21,0.45)'};">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
          ${getRarityBadgeHtml(f.rarity)}
          <span style="font-size:7.5px; font-weight:900; color:${unlocked ? '#4ade80' : '#facc15'};">${unlocked ? '✅ DESBLOQUEADO' : '🔒 BLOQUEADO'}</span>
        </div>
        <img src="${sp.uri}" style="width:44px; height:44px; object-fit:contain; ${unlocked ? '' : 'filter:drop-shadow(0 0 6px rgba(250,204,21,0.35));'}">
        <div style="font-size:10px; font-weight:900;">${f.name}</div>
        <div style="font-size:8.5px; color:#bae6fd; margin-bottom:4px;">MP ${f.mp} · ${f.type}</div>
        <button class="btn ${unlocked ? 'secondary' : 'gold'}" style="width:100%; font-size:8.2px; padding:4px;" onclick="exchangeMaterialForFigure(${idx})">
          ${unlocked ? `⬆️ +1 CLv (🔷 ${mCost.toLocaleString("en-US")})` : `🔓 Desbloquear (🔷 ${mCost.toLocaleString("en-US")})`}
        </button>
      </div>
    `;
  }).join("");
};

exchangeMaterialForFigure = function(idx) {
  const f = FIGURES_DB[idx] || FIGURES_DB[0];
  const mCost = OFFICIAL_MATERIAL_COSTS[f.rarity] || 1800;
  const m = document.getElementById("shop-exchange-msg");
  if (userMaterial < mCost) {
    playSfx("hit");
    if (m) m.textContent = `⚠️ Material insuficiente (${userMaterial.toLocaleString("en-US")}/${mCost.toLocaleString("en-US")}🔷)! Abra Caixas ou resgate +500 Material no botão do topo!`;
    return;
  }
  playSfx("portal");
  userMaterial -= mCost;
  const ml = document.getElementById("mat-lbl");
  if (ml) ml.textContent = userMaterial.toLocaleString("en-US");

  const wasUnlocked = isFigureUnlocked(idx);
  unlockAndShowBoosterModal(
    wasUnlocked ? `📦 +1 UNIDADE NA LOJA: ${f.name.toUpperCase()}!` : `🔓 DESBLOQUEADO NA LOJA: ${f.name.toUpperCase()}!`,
    [idx],
    `Adquirido por ${mCost.toLocaleString("en-US")} Material`
  );
  const totalCopiesNow = getOwnedFigureUnits(idx);
  if (m) {
    m.textContent = wasUnlocked
      ? `📦 +1 Unidade de [${f.rarity}] ${f.name} adquirida! Agora você possui x${totalCopiesNow} unidades para usar no mesmo time (+1 CLv)!`
      : `✅ [${f.rarity}] ${f.name} foi DESBLOQUEADO (📦 x1 unidade)! Vá em [Decks] para equipar no seu Time!`;
  }
};

function createNewTeamSlot() {
  const maxTeams = 3;
  if (!playerProgression.teams) playerProgression.teams = [];
  if (playerProgression.teams.length >= maxTeams) {
    playSfx("hit");
    const ind = document.getElementById("editing-slot-indicator");
    if (ind) ind.textContent = "⚠️ Limite máximo de 3 times atingido!";
    return;
  }
  playSfx("portal");
  const newTeamNum = playerProgression.teams.length + 1;
  playerProgression.teams.push({
    name: `Time #${newTeamNum}`,
    slots: [...state.deckP1]
  });
  playerProgression.activeTeamIdx = playerProgression.teams.length - 1;
  saveProgressionState();
  syncProgressionToDeckState();
  demoFullMatchState();
  renderHubAndCollection();
  const ind = document.getElementById("editing-slot-indicator");
  if (ind) ind.textContent = `Time #${newTeamNum} criado com sucesso!`;
}

function promptRenameActiveTeam() {
  const actIdx = playerProgression.activeTeamIdx || 0;
  const team = (playerProgression.teams && playerProgression.teams[actIdx]) ? playerProgression.teams[actIdx] : null;
  if (!team) return;
  const modal = document.getElementById("rename-team-modal");
  const inp = document.getElementById("rename-team-input");
  if (modal && inp) {
    inp.value = team.name || `Time #${actIdx + 1}`;
    modal.style.display = "flex";
    setTimeout(() => { inp.focus(); inp.select(); }, 50);
  } else {
    const newName = window.prompt("Digite o novo nome para o time:", team.name);
    if (newName !== null) {
      applyRenameTeam(newName);
    }
  }
}

function applyRenameTeam(rawName) {
  const actIdx = playerProgression.activeTeamIdx || 0;
  const team = (playerProgression.teams && playerProgression.teams[actIdx]) ? playerProgression.teams[actIdx] : null;
  if (!team) return;
  const trimmed = (rawName || "").trim();
  if (!trimmed) {
    playSfx("hit");
    return;
  }
  team.name = trimmed.slice(0, 20);
  saveProgressionState();
  playSfx("portal");
  closeRenameTeamModal();
  renderHubAndCollection();
  const ind = document.getElementById("editing-slot-indicator");
  if (ind) ind.textContent = `Time renomeado para "${team.name}"!`;
}

function closeRenameTeamModal() {
  const m = document.getElementById("rename-team-modal");
  if (m) m.style.display = "none";
}

function deleteActiveTeamPrompt() {
  if (!playerProgression.teams || playerProgression.teams.length <= 1) {
    playSfx("hit");
    const ind = document.getElementById("editing-slot-indicator");
    if (ind) ind.textContent = "⚠️ Você precisa manter pelo menos 1 time ativo!";
    return;
  }
  const actIdx = playerProgression.activeTeamIdx || 0;
  const team = playerProgression.teams[actIdx];
  if (!team) return;

  const modal = document.getElementById("delete-team-modal");
  const desc = document.getElementById("delete-team-desc");
  if (modal && desc) {
    desc.textContent = `Tem certeza que deseja excluir o time "${team.name}"? Esta ação não pode ser desfeita.`;
    modal.style.display = "flex";
  } else {
    if (window.confirm(`Tem certeza que deseja excluir o time "${team.name}"?`)) {
      confirmDeleteActiveTeam();
    }
  }
}

function confirmDeleteActiveTeam() {
  if (!playerProgression.teams || playerProgression.teams.length <= 1) {
    playSfx("hit");
    return;
  }
  const actIdx = playerProgression.activeTeamIdx || 0;
  const deletedName = playerProgression.teams[actIdx].name;
  playerProgression.teams.splice(actIdx, 1);
  playerProgression.activeTeamIdx = Math.max(0, actIdx > 0 ? actIdx - 1 : 0);
  saveProgressionState();
  syncProgressionToDeckState();
  demoFullMatchState();
  renderHubAndCollection();
  closeDeleteTeamModal();
  playSfx("portal");
  const ind = document.getElementById("editing-slot-indicator");
  if (ind) ind.textContent = `Time "${deletedName}" excluído com sucesso!`;
}

function closeDeleteTeamModal() {
  const m = document.getElementById("delete-team-modal");
  if (m) m.style.display = "none";
}

switchDeckPreset = function(presetIdx) {
  if (presetIdx < 0 || presetIdx >= playerProgression.teams.length) return;
  playerProgression.activeTeamIdx = presetIdx;
  syncProgressionToDeckState();
  selectedCarouselSlot = 0;
  saveProgressionState();
  playSfx("portal");
  demoFullMatchState();
  renderHubAndCollection();
};

let _lastDeckStatusOverrideMsg = "";
let _lastDeckStatusOverrideColor = "";

function setDeckStatusBannerMsg(text, color = "#fde047") {
  _lastDeckStatusOverrideMsg = text || "";
  _lastDeckStatusOverrideColor = color || "#fde047";
  const ind = document.getElementById("editing-slot-indicator");
  if (ind && text) {
    ind.style.color = color;
    ind.textContent = text;
  }
}

toggleDeckEquip = function(idx) {
  const f = FIGURES_DB[idx] || FIGURES_DB[0];
  if (!isFigureUnlocked(idx)) {
    playSfx("hit");
    setDeckStatusBannerMsg(`🔒 ${f ? f.name : 'Pokémon'} bloqueado! Ganhe em Caixas de Vitória ou na Loja!`, "#f87171");
    return;
  }
  const editedSlot = currentEditingDeckSlot % 6;
  const ownedUnits = getOwnedFigureUnits(idx);

  if (state.deckP1[editedSlot] === idx) {
    selectedCarouselSlot = editedSlot;
    currentEditingDeckSlot = (editedSlot + 1) % 6;
    playSfx("tick");
    setDeckStatusBannerMsg(`Slot #${currentEditingDeckSlot + 1} Ativo (${f.name} mantido no Slot #${editedSlot + 1})`, "#38bdf8");
    renderHubAndCollection();
    return;
  }

  let otherSlotsCount = 0;
  for (let s = 0; s < 6; s++) {
    if (s !== editedSlot && state.deckP1[s] === idx) otherSlotsCount++;
  }

  // Case 1: Player owns enough units to equip into editedSlot (including 2nd, 3rd, ... 6th copy!)
  if (otherSlotsCount + 1 <= ownedUnits) {
    const nextDeck = [...state.deckP1];
    nextDeck[editedSlot] = idx;
    const stats = countDeckBalanceStats(nextDeck);
    if (stats.megas > MAX_DECK_MEGAS) {
      playSfx("hit");
      setDeckStatusBannerMsg(`⚠️ Limite do Deck: Máximo 1 Pokémon MEGA permitido (${stats.megas}/1)! Selecione o slot do Mega atual para substituí-lo.`, "#f87171");
      return;
    }
    if (stats.uxs > MAX_DECK_UX) {
      playSfx("hit");
      setDeckStatusBannerMsg(`⚠️ Limite do Deck: Máximo 1 Pokémon UX permitido (${stats.uxs}/1)! Selecione o slot do UX atual para substituí-lo.`, "#f87171");
      return;
    }
    if (stats.exs > MAX_DECK_EX) {
      playSfx("hit");
      setDeckStatusBannerMsg(`⚠️ Limite do Deck: Máximo 2 Pokémon EX permitidos (${stats.exs}/2)! Selecione o slot de um EX atual para substituí-lo.`, "#f87171");
      return;
    }

    state.deckP1 = nextDeck;
    if (playerProgression.teams[playerProgression.activeTeamIdx]) {
      playerProgression.teams[playerProgression.activeTeamIdx].slots = [...state.deckP1];
    }
    DECK_PRESETS[playerProgression.activeTeamIdx] = [...state.deckP1];
    saveProgressionState();
    selectedCarouselSlot = editedSlot;
    currentEditingDeckSlot = (editedSlot + 1) % 6;
    const newEquippedCnt = otherSlotsCount + 1;
    setDeckStatusBannerMsg(
      ownedUnits > 1
        ? `✅ ${f.name} equipado no Slot #${editedSlot + 1} (📦 ${newEquippedCnt}/${ownedUnits} unidades no time) ➔ Editando Slot #${currentEditingDeckSlot + 1}`
        : `✅ ${f.name} equipado no Slot #${editedSlot + 1} ➔ Editando Slot #${currentEditingDeckSlot + 1}`,
      "#4ade80"
    );
    playSfx("portal");
    demoFullMatchState();
    renderHubAndCollection();
    return;
  }

  // Case 2: Player only has 1 unit and it's in another slot -> swap slots so they can rearrange their team, and inform how to get more units!
  if (ownedUnits === 1) {
    const existingPos = state.deckP1.indexOf(idx);
    if (existingPos !== -1 && existingPos !== editedSlot) {
      state.deckP1[existingPos] = state.deckP1[editedSlot];
      state.deckP1[editedSlot] = idx;
      if (playerProgression.teams[playerProgression.activeTeamIdx]) {
        playerProgression.teams[playerProgression.activeTeamIdx].slots = [...state.deckP1];
      }
      DECK_PRESETS[playerProgression.activeTeamIdx] = [...state.deckP1];
      saveProgressionState();
      selectedCarouselSlot = editedSlot;
      currentEditingDeckSlot = (editedSlot + 1) % 6;
      setDeckStatusBannerMsg(`🔄 ${f.name} movido p/ Slot #${editedSlot + 1} (Você tem 📦x1 un. — pegue repetidos na Caixa/Loja p/ usar mais de 1 no time!)`, "#fde047");
      playSfx("portal");
      demoFullMatchState();
      renderHubAndCollection();
      return;
    }
  }

  // Case 3: Player owns multiple units (e.g. x2) and all owned units are already in the team
  playSfx("hit");
  setDeckStatusBannerMsg(`⚠️ Todas as suas 📦x${ownedUnits} unidades de ${f.name} já estão no time! Obtenha mais repetidos na Caixa ou Loja para adicionar outra.`, "#f87171");
};

// Override renderHubAndCollection to render 1 Starter Team + Locked/Unlocked Collection Cards!
renderHubAndCollection = function() {
  syncProgressionToDeckState();
  const rmEl = document.getElementById("rm-lbl");
  if (rmEl) rmEl.textContent = state.rareMetals;
  const ccEl = document.getElementById("cc-lbl");
  if (ccEl) ccEl.textContent = state.chainCubes;

  // Update Progression Banner & Dynamic Team Bar
  const progLbl = document.getElementById("collection-progress-lbl");
  if (progLbl) {
    progLbl.textContent = `🔓 Coleção: ${playerProgression.unlockedFigures.length}/${FIGURES_DB.length} Pokémon · ${playerProgression.teams.length} ${playerProgression.teams.length === 1 ? 'Time' : 'Times'} · 🏆 Vitórias: ${playerProgression.matchesWon || 0}`;
  }
  const vBtn = document.getElementById("deck-victory-box-btn");
  if (vBtn) {
    const vBoxes = playerProgression.victoryBoxesWon || 0;
    vBtn.style.display = vBoxes > 0 ? "inline-block" : "none";
    vBtn.textContent = `🎁 Abrir Caixa de Vitória (${vBoxes})`;
  }

  const pBarEl = document.getElementById("deck-presets-bar");
  if (pBarEl) {
    const teamBtns = playerProgression.teams.map((t, i) => {
      const isAct = (i === playerProgression.activeTeamIdx);
      return `<button class="btn ${isAct ? 'gold' : 'secondary'}" style="padding:3px 7px; font-size:8.5px;" onclick="switchDeckPreset(${i})">⚔️ ${t.name}</button>`;
    }).join("");
    const addBtn = playerProgression.teams.length < 3
      ? `<button class="btn secondary" style="padding:3px 7px; font-size:8px; border-style:dashed;" onclick="createNewTeamSlot()">➕ Novo Time</button>`
      : "";
    pBarEl.innerHTML = teamBtns + addBtn;
  }

  const showcase = document.getElementById("hub-deck-showcase");
  if (showcase) {
    showcase.innerHTML = state.deckP1.map((idx, slotPos) => {
      const f = FIGURES_DB[idx % FIGURES_DB.length];
      const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
      const evoTarget = (typeof getFigureEvolutionTarget === "function") ? getFigureEvolutionTarget(f) : null;
      const isSelSlot = (slotPos === currentEditingDeckSlot);
      return `<div class="deck-slot-box ${isSelSlot ? 'selected-slot' : ''}" onclick="selectDeckSlotToEdit(${slotPos})">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0 2px;">
          ${getRarityBadgeHtml(f.rarity)}
          <span onclick="event.stopPropagation(); openFigureDetailsModal(${idx});" style="font-size:8px; color:#7dd3fc; font-weight:900;">ⓘ</span>
        </div>
        <img src="${sp.uri}" style="width:36px; height:36px; object-fit:contain;">
        <div style="font-size:7.8px; font-weight:800; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${f.name}</div>
        <div style="font-size:7px; color:#facc15;">MP ${f.mp} · CLv+${f.clv}</div>
        <div class="evo-sub-slot" onclick="event.stopPropagation(); openFigureDetailsModal(${idx});" title="Evolução">${evoTarget ? '⬆ ' + evoTarget : '★ Final'}</div>
      </div>`;
    }).join("");
  }

  const pSel = document.getElementById("deck-plates-selector");
  const pBar = document.getElementById("plate-cost-bar");
  if (pSel) {
    const activePlates = state.plates.filter(p => !p.disabledInDeck);
    const usedCost = activePlates.reduce((a, p) => a + p.cost, 0);
    if (pBar) pBar.textContent = `COST ${Math.min(6, usedCost)}/6 ` + "◆".repeat(Math.min(6, usedCost)) + "◇".repeat(Math.max(0, 6 - usedCost));
    pSel.innerHTML = state.plates.map((p, pIdx) => {
      const active = !p.disabledInDeck;
      return `<button onclick="togglePlateInDeck(${pIdx})" style="background:${active?'#0284c7':'#0f172a'}; border:1px solid ${active?'#bae6fd':'#475569'}; color:#fff; border-radius:4px; padding:2px 6px; font-size:8.5px; font-weight:800; cursor:pointer;">
        ${active ? '✓ ' : ''}${p.name} [${p.cost}◆]
      </button>`;
    }).join("");
  }

  const qList = document.getElementById("hub-quests-list");
  if (qList) {
    qList.innerHTML = CARMONTE_HOTELS.map(h => `
      <div class="card" style="margin-bottom:0;">
        <strong style="font-size:10.5px; color:#facc15;">${h.name}</strong>
        <div class="small-muted" style="margin:3px 0;">Opponent: ${h.boss} · 🏆 Vitória = +1 Caixa de Pokémon!</div>
        <button class="btn" style="width:100%; font-size:9.5px; padding:4px;" onclick="setGameMode('ai'); setTableSurface('${h.surface}'); demoFullMatchState(); closeDrawer();">Iniciar Duelo (Ganhar Caixa)</button>
      </div>
    `).join("");
  }

  const grid = document.getElementById("collection-grid");
  if (!grid) return;
  grid.innerHTML = "";

  // Sort so Unlocked figures appear first, followed by Locked figures
  const orderedIndices = Array.from({ length: FIGURES_DB.length }, (_, i) => i).sort((a, b) => {
    const ua = isFigureUnlocked(a) ? 0 : 1;
    const ub = isFigureUnlocked(b) ? 0 : 1;
    return ua - ub || a - b;
  });

  orderedIndices.forEach(idx => {
    const f = FIGURES_DB[idx];
    if (figureCaseFilter !== "ALL" && f.rarity !== figureCaseFilter) return;
    const unlocked = isFigureUnlocked(idx);
    const inDeck = state.deckP1.includes(idx);
    const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "0";
    card.style.opacity = unlocked ? "1.0" : "0.78";
    card.style.borderColor = inDeck ? "#facc15" : (unlocked ? (f.rarity === "UX" ? "#c084fc" : "rgba(56,189,248,0.38)") : "#334155");
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="font-size:10px; color:${unlocked ? '#fff' : '#94a3b8'};">${unlocked ? '' : '🔒 '}${f.name}</strong>
        <div style="display:flex; align-items:center; gap:3px;">
          ${getRarityBadgeHtml(f.rarity)}
          <span style="font-size:8px; color:#bae6fd; font-weight:900;">MP ${f.mp}</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:7px; margin:5px 0; cursor:pointer;" onclick="openFigureDetailsModal(${idx})">
        <img src="${sp.uri}" style="width:44px; height:44px; object-fit:contain; ${unlocked ? '' : 'filter:grayscale(0.85) brightness(0.55);'}">
        <div class="small-muted">
          ${unlocked ? `<span style="color:#4ade80; font-weight:800;">✅ Desbloqueado</span> · Lv.${f.level}/10 · CLv+${f.clv}` : `<span style="color:#facc15; font-weight:800;">🔒 Bloqueado</span> · Ganhe em Caixas/Loja`}<br>
          ${f.type}<br><span style="color:#38bdf8; font-weight:800;">ⓘ Ver Roleta & Ability</span>
        </div>
      </div>
      <div style="display:flex; gap:4px;">
        ${unlocked ? `
          <button class="btn ${inDeck ? 'gold' : 'secondary'}" style="flex:1; font-size:8.5px; padding:4px;" onclick="toggleDeckEquip(${idx})">
            ${inDeck ? '★ No Time' : `➔ Slot #${currentEditingDeckSlot + 1}`}
          </button>
          <button class="btn purple" style="font-size:8.5px; padding:4px 6px;" onclick="fuseFigure(${idx})">+CLv</button>
        ` : `
          <button class="btn secondary" style="flex:1; font-size:8px; padding:4px; color:#fde047; border-color:#ca8a04;" onclick="switchDrawerTab('shop')">
            🔒 Obter em Caixas / Loja
          </button>
        `}
      </div>
    `;
    grid.appendChild(card);
  });
};

// Override renderFusionChamber so only UNLOCKED Pokémon appear in the Fusion selector!
const _origRenderFusionChamber = renderFusionChamber;
renderFusionChamber = function() {
  const sel = document.getElementById("fusion-target-select");
  if (sel) {
    const prevVal = sel.value;
    const unlockedList = FIGURES_DB.map((f, i) => ({ f, i })).filter(x => isFigureUnlocked(x.i));
    sel.innerHTML = unlockedList.map(({ f, i }) => `<option value="${i}">[${f.rarity}] ${f.name} (Lv.${f.level}/10 · CLv+${f.clv})</option>`).join("");
    if (prevVal && isFigureUnlocked(parseInt(prevVal, 10))) {
      sel.value = prevVal;
    }
  }
  _origRenderFusionChamber();
};

syncProgressionToDeckState();


// ============================================================================


let collectionSearchQuery = "";
let collectionCurrentPage = 0;
const COLLECTION_PAGE_SIZE = 24;

let shopSearchQuery = "";
let shopRarityFilter = "ALL";
let shopCurrentPage = 0;
const SHOP_PAGE_SIZE = 24;

function onCollectionSearchInput(val) {
  collectionSearchQuery = (val || "").trim().toLowerCase();
  collectionCurrentPage = 0;
  renderHubAndCollection();
}

function changeCollectionPage(delta) {
  playSfx("tick");
  collectionCurrentPage = Math.max(0, collectionCurrentPage + delta);
  renderHubAndCollection();
}

filterFigureCase = function(rar) {
  figureCaseFilter = rar;
  collectionCurrentPage = 0;
  playSfx("tick");
  renderHubAndCollection();
};

function onShopSearchInput(val) {
  shopSearchQuery = (val || "").trim().toLowerCase();
  shopCurrentPage = 0;
  renderShopExchange();
}

function setShopRarityFilter(rar) {
  shopRarityFilter = rar;
  shopCurrentPage = 0;
  playSfx("tick");
  renderShopExchange();
}

function changeShopPage(delta) {
  playSfx("tick");
  shopCurrentPage = Math.max(0, shopCurrentPage + delta);
  renderShopExchange();
}

// Override renderHubAndCollection to support fast 24-card pagination + search across all 217 Pokémon!
renderHubAndCollection = function() {
  syncProgressionToDeckState();
  const rmEl = document.getElementById("rm-lbl");
  if (rmEl) rmEl.textContent = state.rareMetals;
  const ccEl = document.getElementById("cc-lbl");
  if (ccEl) ccEl.textContent = state.chainCubes;

  const progLbl = document.getElementById("collection-progress-lbl");
  if (progLbl) {
    progLbl.textContent = `🔓 Coleção: ${playerProgression.unlockedFigures.length}/${FIGURES_DB.length} Pokémon · ${playerProgression.teams.length} ${playerProgression.teams.length === 1 ? 'Time' : 'Times'} · 🏆 Vitórias: ${playerProgression.matchesWon || 0}`;
  }
  const vBtn = document.getElementById("deck-victory-box-btn");
  if (vBtn) {
    const vBoxes = playerProgression.victoryBoxesWon || 0;
    vBtn.style.display = vBoxes > 0 ? "inline-block" : "none";
    vBtn.textContent = `🎁 Abrir Caixa de Vitória (${vBoxes})`;
  }

  const pBarEl = document.getElementById("deck-presets-bar");
  if (pBarEl) {
    const teamBtns = playerProgression.teams.map((t, i) => {
      const isAct = (i === playerProgression.activeTeamIdx);
      return `<button class="btn ${isAct ? 'gold' : 'secondary'}" style="padding:3px 7px; font-size:8.5px;" onclick="switchDeckPreset(${i})">⚔️ ${t.name}</button>`;
    }).join("");
    const addBtn = playerProgression.teams.length < 3
      ? `<button class="btn secondary" style="padding:3px 7px; font-size:8px; border-style:dashed;" onclick="createNewTeamSlot()">➕ Novo Time</button>`
      : "";
    pBarEl.innerHTML = teamBtns + addBtn;
  }

  const showcase = document.getElementById("hub-deck-showcase");
  if (showcase) {
    showcase.innerHTML = state.deckP1.map((idx, slotPos) => {
      const f = FIGURES_DB[idx % FIGURES_DB.length];
      const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
      const evoTarget = (typeof getFigureEvolutionTarget === "function") ? getFigureEvolutionTarget(f) : null;
      const isSelSlot = (slotPos === currentEditingDeckSlot);
      return `<div class="deck-slot-box ${isSelSlot ? 'selected-slot' : ''}" onclick="selectDeckSlotToEdit(${slotPos})">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0 2px;">
          ${getRarityBadgeHtml(f.rarity)}
          <span onclick="event.stopPropagation(); openFigureDetailsModal(${idx});" style="font-size:8px; color:#7dd3fc; font-weight:900;">ⓘ</span>
        </div>
        <img src="${sp.uri}" style="width:36px; height:36px; object-fit:contain;">
        <div style="font-size:7.8px; font-weight:800; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${f.name}</div>
        <div style="font-size:7px; color:#facc15;">MP ${f.mp} · CLv+${f.clv}</div>
        <div class="evo-sub-slot" onclick="event.stopPropagation(); openFigureDetailsModal(${idx});" title="Evolução">${evoTarget ? '⬆ ' + evoTarget : '★ Final'}</div>
      </div>`;
    }).join("");
  }

  const pSel = document.getElementById("deck-plates-selector");
  const pBar = document.getElementById("plate-cost-bar");
  if (pSel) {
    const activePlates = state.plates.filter(p => !p.disabledInDeck);
    const usedCost = activePlates.reduce((a, p) => a + p.cost, 0);
    if (pBar) pBar.textContent = `COST ${Math.min(6, usedCost)}/6 ` + "◆".repeat(Math.min(6, usedCost)) + "◇".repeat(Math.max(0, 6 - usedCost));
    pSel.innerHTML = state.plates.map((p, pIdx) => {
      const active = !p.disabledInDeck;
      return `<button onclick="togglePlateInDeck(${pIdx})" style="background:${active?'#0284c7':'#0f172a'}; border:1px solid ${active?'#bae6fd':'#475569'}; color:#fff; border-radius:4px; padding:2px 6px; font-size:8.5px; font-weight:800; cursor:pointer;">
        ${active ? '✓ ' : ''}${p.name} [${p.cost}◆]
      </button>`;
    }).join("");
  }

  const qList = document.getElementById("hub-quests-list");
  if (qList) {
    qList.innerHTML = CARMONTE_HOTELS.map(h => `
      <div class="card" style="margin-bottom:0;">
        <strong style="font-size:10.5px; color:#facc15;">${h.name}</strong>
        <div class="small-muted" style="margin:3px 0;">Opponent: ${h.boss} · 🏆 Vitória = +1 Caixa de Pokémon!</div>
        <button class="btn" style="width:100%; font-size:9.5px; padding:4px;" onclick="setGameMode('ai'); setTableSurface('${h.surface}'); demoFullMatchState(); closeDrawer();">Iniciar Duelo (Ganhar Caixa)</button>
      </div>
    `).join("");
  }

  const grid = document.getElementById("collection-grid");
  if (!grid) return;

  // Filter & sort across all 217 Pokémon
  const filteredIndices = [];
  for (let i = 0; i < FIGURES_DB.length; i++) {
    const f = FIGURES_DB[i];
    const unlocked = isFigureUnlocked(i);
    if (figureCaseFilter === "UNLOCKED" && !unlocked) continue;
    if (figureCaseFilter === "LOCKED" && unlocked) continue;
    if (figureCaseFilter !== "ALL" && figureCaseFilter !== "UNLOCKED" && figureCaseFilter !== "LOCKED" && f.rarity !== figureCaseFilter) continue;
    if (collectionSearchQuery) {
      const hay = `${f.name} ${f.type} ${f.rarity} #${f.dex || ''}`.toLowerCase();
      if (!hay.includes(collectionSearchQuery)) continue;
    }
    filteredIndices.push(i);
  }

  filteredIndices.sort((a, b) => {
    const ua = isFigureUnlocked(a) ? 0 : 1;
    const ub = isFigureUnlocked(b) ? 0 : 1;
    return ua - ub || a - b;
  });

  const totalPages = Math.max(1, Math.ceil(filteredIndices.length / COLLECTION_PAGE_SIZE));
  if (collectionCurrentPage >= totalPages) collectionCurrentPage = totalPages - 1;
  const pageStart = collectionCurrentPage * COLLECTION_PAGE_SIZE;
  const pageItems = filteredIndices.slice(pageStart, pageStart + COLLECTION_PAGE_SIZE);

  const pagBar = document.getElementById("collection-pagination-bar");
  if (pagBar) {
    const prevText = (typeof t === "function") ? t("deck.prev", "◀ Anterior") : "◀ Anterior";
    const nextText = (typeof t === "function") ? t("deck.next", "Próxima ▶") : "Próxima ▶";
    const pageInfo = (typeof t === "function")
      ? t("deck.page_info", `Mostrando ${pageItems.length} de ${filteredIndices.length} Pokémon (Pág ${collectionCurrentPage + 1}/${totalPages})`, { count: pageItems.length, total: filteredIndices.length, page: collectionCurrentPage + 1, max: totalPages })
      : `Mostrando ${pageItems.length} de ${filteredIndices.length} Pokémon (Pág ${collectionCurrentPage + 1}/${totalPages})`;
    pagBar.innerHTML = `
      <button class="btn secondary" style="padding:2px 7px; font-size:8px;" ${collectionCurrentPage <= 0 ? 'disabled style="opacity:0.4; padding:2px 7px; font-size:8px;"' : ''} onclick="changeCollectionPage(-1)">${prevText}</button>
      <span>${pageInfo}</span>
      <button class="btn secondary" style="padding:2px 7px; font-size:8px;" ${collectionCurrentPage + 1 >= totalPages ? 'disabled style="opacity:0.4; padding:2px 7px; font-size:8px;"' : ''} onclick="changeCollectionPage(1)">${nextText}</button>
    `;
  }

  grid.innerHTML = "";
  pageItems.forEach(idx => {
    const f = FIGURES_DB[idx];
    const unlocked = isFigureUnlocked(idx);
    const inDeck = state.deckP1.includes(idx);
    const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
    const locType = (typeof localizeType === "function") ? localizeType(f.type) : f.type;
    const unlockedLabel = (typeof t === "function") ? t("deck.unlocked_badge", "✅ Desbloqueado") : "✅ Desbloqueado";
    const lockedLabel = (typeof t === "function") ? t("deck.locked", "🔒 Bloqueado") : "🔒 Bloqueado";
    const viewWheelLabel = (typeof t === "function") ? t("deck.view_details", "ⓘ Ver Roleta & Habilidade") : "ⓘ Ver Roleta & Habilidade";
    const inDeckLabel = (typeof t === "function") ? t("deck.in_deck", "★ No Deck") : "★ No Deck";
    const toSlotLabel = (typeof t === "function") ? t("deck.to_slot", `➔ Slot #${currentEditingDeckSlot + 1}`, { slot: currentEditingDeckSlot + 1 }) : `➔ Slot #${currentEditingDeckSlot + 1}`;
    const unlockShopLabel = (typeof t === "function") ? t("deck.unlock_in_shop", "🔒 Desbloquear na Loja") : "🔒 Desbloquear na Loja";

    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "0";
    card.style.opacity = unlocked ? "1.0" : "0.80";
    card.style.borderColor = inDeck ? "#facc15" : (unlocked ? (f.rarity === "UX" ? "#c084fc" : "rgba(56,189,248,0.38)") : "#334155");
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="font-size:9.5px; color:${unlocked ? '#fff' : '#94a3b8'};">${unlocked ? '' : '🔒 '}${f.name}</strong>
        <div style="display:flex; align-items:center; gap:3px;">
          ${getRarityBadgeHtml(f.rarity)}
          <span style="font-size:8px; color:#bae6fd; font-weight:900;">MP ${f.mp}</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:7px; margin:5px 0; cursor:pointer;" onclick="openFigureDetailsModal(${idx})">
        <img src="${sp.uri}" style="width:44px; height:44px; object-fit:contain; ${unlocked ? '' : 'filter:grayscale(0.85) brightness(0.55);'}">
        <div class="small-muted">
          ${unlocked ? `<span style="color:#4ade80; font-weight:800;">${unlockedLabel}</span> · Lv.${f.level}/10 · CLv+${f.clv}` : `<span style="color:#facc15; font-weight:800;">${lockedLabel}</span>`}<br>
          ${locType}<br><span style="color:#38bdf8; font-weight:800;">${viewWheelLabel}</span>
        </div>
      </div>
      <div style="display:flex; gap:4px;">
        ${unlocked ? `
          <button class="btn ${inDeck ? 'gold' : 'secondary'}" style="flex:1; font-size:8.5px; padding:4px;" onclick="toggleDeckEquip(${idx})">
            ${inDeck ? inDeckLabel : toSlotLabel}
          </button>
          <button class="btn purple" style="font-size:8.5px; padding:4px 6px;" onclick="fuseFigure(${idx})">+CLv</button>
        ` : `
          <button class="btn secondary" style="flex:1; font-size:8px; padding:4px; color:#fde047; border-color:#ca8a04;" onclick="switchDrawerTab('shop')">
            ${unlockShopLabel}
          </button>
        `}
      </div>
    `;
    grid.appendChild(card);
  });
};

// Override renderShopExchange to support fast 24-card pagination + search across all 217 Pokémon!
renderShopExchange = function() {
  const grid = document.getElementById("shop-material-grid");
  if (!grid) return;
  const ml = document.getElementById("mat-lbl");
  if (ml) ml.textContent = userMaterial.toLocaleString("en-US");
  const vBoxLbl = document.getElementById("shop-victory-boxes-lbl");
  if (vBoxLbl) vBoxLbl.textContent = playerProgression.victoryBoxesWon || 0;
  const vBoxBtn = document.getElementById("shop-open-victory-btn");
  if (vBoxBtn) {
    const vCount = playerProgression.victoryBoxesWon || 0;
    const openBoxText = (typeof t === "function") ? t("shop.open_victory_btn", "🎁 Abrir Caixa") : "🎁 Abrir Caixa";
    const win1Text = (typeof t === "function") ? t("shop.win_1_match", "🔒 Vença 1 Partida") : "🔒 Vença 1 Partida";
    vBoxBtn.textContent = vCount > 0 ? `${openBoxText} (${vCount})` : win1Text;
    vBoxBtn.style.opacity = vCount > 0 ? "1.0" : "0.65";
  }

  const filtered = [];
  for (let i = 0; i < FIGURES_DB.length; i++) {
    const f = FIGURES_DB[i];
    if (shopRarityFilter !== "ALL" && f.rarity !== shopRarityFilter) continue;
    if (shopSearchQuery) {
      const hay = `${f.name} ${f.type} ${f.rarity} #${f.dex || ''}`.toLowerCase();
      if (!hay.includes(shopSearchQuery)) continue;
    }
    filtered.push(i);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / SHOP_PAGE_SIZE));
  if (shopCurrentPage >= totalPages) shopCurrentPage = totalPages - 1;
  const pageStart = shopCurrentPage * SHOP_PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + SHOP_PAGE_SIZE);

  const pagBar = document.getElementById("shop-pagination-bar");
  if (pagBar) {
    const prevText = (typeof t === "function") ? t("shop.prev", "◀ Anterior") : "◀ Anterior";
    const nextText = (typeof t === "function") ? t("shop.next", "Próxima ▶") : "Próxima ▶";
    const pageInfo = (typeof t === "function")
      ? t("shop.page_info", `Loja: ${pageItems.length} de ${filtered.length} Pokémon (Pág ${shopCurrentPage + 1}/${totalPages})`, { count: pageItems.length, total: filtered.length, page: shopCurrentPage + 1, max: totalPages })
      : `Loja: ${pageItems.length} de ${filtered.length} Pokémon (Pág ${shopCurrentPage + 1}/${totalPages})`;
    pagBar.innerHTML = `
      <button class="btn secondary" style="padding:2px 7px; font-size:8px;" ${shopCurrentPage <= 0 ? 'disabled style="opacity:0.4; padding:2px 7px; font-size:8px;"' : ''} onclick="changeShopPage(-1)">${prevText}</button>
      <span>${pageInfo}</span>
      <button class="btn secondary" style="padding:2px 7px; font-size:8px;" ${shopCurrentPage + 1 >= totalPages ? 'disabled style="opacity:0.4; padding:2px 7px; font-size:8px;"' : ''} onclick="changeShopPage(1)">${nextText}</button>
    `;
  }

  grid.innerHTML = pageItems.map(idx => {
    const f = FIGURES_DB[idx];
    const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
    const mCost = OFFICIAL_MATERIAL_COSTS[f.rarity] || 1800;
    const unlocked = isFigureUnlocked(idx);
    const ownedUnits = unlocked ? getOwnedFigureUnits(idx) : 0;
    const locType = (typeof localizeType === "function") ? localizeType(f.type) : f.type;
    const unlockedTag = unlocked ? `📦 x${ownedUnits} UNID.` : ((typeof t === "function") ? t("shop.locked", "🔒 BLOQUEADO") : "🔒 BLOQUEADO");
    const unlockBtnText = (typeof t === "function") ? t("shop.unlock_btn", "🔓 Desbloquear") : "🔓 Desbloquear";
    return `
      <div class="card" style="margin-bottom:0; text-align:center; border-color:${unlocked ? 'rgba(74,222,128,0.45)' : 'rgba(250,204,21,0.45)'};">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
          ${getRarityBadgeHtml(f.rarity)}
          <span style="font-size:7.5px; font-weight:900; color:${unlocked ? '#4ade80' : '#facc15'};">${unlockedTag}</span>
        </div>
        <img src="${sp.uri}" style="width:44px; height:44px; object-fit:contain; cursor:pointer;" onclick="openFigureDetailsModal(${idx})">
        <div style="font-size:9.5px; font-weight:900;">${f.name}</div>
        <div style="font-size:8px; color:#bae6fd; margin-bottom:4px;">MP ${f.mp} · ${locType}</div>
        <button class="btn ${unlocked ? 'secondary' : 'gold'}" style="width:100%; font-size:7.6px; padding:4px;" onclick="exchangeMaterialForFigure(${idx})">
          ${unlocked ? `➕ +1 Unid. [x${ownedUnits}➔x${ownedUnits + 1}] (🔷 ${mCost.toLocaleString("en-US")})` : `${unlockBtnText} (🔷 ${mCost.toLocaleString("en-US")})`}
        </button>
      </div>
    `;
  }).join("");
};


// ============================================================================


// SECTION 14: v4.7.0 STRICT FINANCIAL, FUSION & COIN ECONOMY ENGINE
// (NO INFINITE GEMS · NO FREE FUSION · REAL COIN VALUE & PERSISTENT WALLET!)
// ============================================================================
const ECONOMY_STORAGE_KEY = "pdr_economy_v470";

const COIN_COST_RARE_METAL_BASE = { C: 1500, UC: 3000, R: 5000, EX: 8000, UX: 12000 };
const COIN_COST_CARMONITE_STEP  = { C: 5000, UC: 10000, R: 18000, EX: 30000, UX: 45000 };
const COIN_COST_CLV_FUSION      = { C: 2500, UC: 5000,  R: 10000, EX: 20000, UX: 35000 };
const CUBE_COST_CLV_STRICT      = { C: 3,    UC: 2,     R: 2,     EX: 1,     UX: 1 };

let userRareMetalItems = 2;
let userIngots = 1;
let lastDailyBonusTs = 0;
let claimedMissionWinsCount = 0;

function getLvUpCoinCost(f) {
  const base = COIN_COST_RARE_METAL_BASE[f.rarity] || 5000;
  return base * Math.max(1, f.level || 1);
}

function getCarmoniteCoinCost(f) {
  return COIN_COST_CARMONITE_STEP[f.rarity] || 18000;
}

function getClvCoinCost(f) {
  return COIN_COST_CLV_FUSION[f.rarity] || 10000;
}

function getClvCubeCost(f) {
  return CUBE_COST_CLV_STRICT[f.rarity] || 1;
}

// Reset starter figures to clean Level 1, CLv 0 before applying saved upgrades from localStorage
FIGURES_DB.forEach(f => {
  f.level = 1;
  f.clv = 0;
  ensureFigureUpgradeMetadata(f);
});

function loadEconomyAndUpgrades() {
  try {
    const raw = localStorage.getItem(ECONOMY_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === "object") {
        state.rareMetals   = typeof data.gems === "number" ? Math.max(0, data.gems) : 100;
        userCoins          = typeof data.coins === "number" ? Math.max(0, data.coins) : 15000;
        userMaterial       = typeof data.material === "number" ? Math.max(0, data.material) : 250;
        userRareMetalItems = typeof data.rareMetalItems === "number" ? Math.max(0, data.rareMetalItems) : 2;
        userCarmonite      = typeof data.carmonite === "number" ? Math.max(0, data.carmonite) : 50;
        state.chainCubes   = typeof data.chainCubes === "number" ? Math.max(0, data.chainCubes) : 1;
        userIngots         = typeof data.ingots === "number" ? Math.max(0, data.ingots) : 1;
        lastDailyBonusTs   = typeof data.lastDailyBonusTs === "number" ? data.lastDailyBonusTs : 0;
        claimedMissionWinsCount = typeof data.claimedMissionWinsCount === "number" ? data.claimedMissionWinsCount : 0;

        if (data.figureUpgrades && typeof data.figureUpgrades === "object") {
          Object.keys(data.figureUpgrades).forEach(fid => {
            const f = FIGURES_DB.find(x => x.id === fid);
            const up = data.figureUpgrades[fid];
            if (f && up) {
              ensureFigureUpgradeMetadata(f);
              f.level = Math.max(1, Math.min(10, up.level || 1));
              f.clv   = Math.max(0, Math.min(10, up.clv || 0));
              f.diskPointsSpent = Math.max(0, up.diskPointsSpent || 0);
              if (Array.isArray(up.wheelSizes) && up.wheelSizes.length === f.wheel.length) {
                const sum = up.wheelSizes.reduce((a, b) => a + b, 0);
                if (sum === 96) {
                  up.wheelSizes.forEach((sz, idx) => { f.wheel[idx].size = sz; });
                }
              }
              if (Array.isArray(up.clvAlloc) && up.clvAlloc.length === f.wheel.length) {
                f.clvAlloc = [...up.clvAlloc];
              }
            }
          });
        }
        return;
      }
    }
  } catch (e) {}

  // Default balanced starter wallet on a fresh profile (exact 100 Gems & 15,000 Coins / Gold)
  state.rareMetals   = 100;   // 100 Gems apenas (Novo Balanceamento)
  userCoins          = 15000; // 15,000 Moedas de Ouro (Novo Balanceamento)
  userMaterial       = 250;   // 250 Material
  userRareMetalItems = 2;     // 2 Blue Rare Metals
  userCarmonite      = 50;    // 50 Carmonite
  state.chainCubes   = 1;     // 1 Green Cube
  userIngots         = 1;     // 1 Gold Ingot (can be sold once for +15,000 Coins)
  lastDailyBonusTs   = 0;
  claimedMissionWinsCount = 0;
  saveEconomyAndUpgrades();
}

function saveEconomyAndUpgrades() {
  try {
    const figureUpgrades = {};
    FIGURES_DB.forEach(f => {
      if ((f.level && f.level > 1) || (f.clv && f.clv > 0) || (f.diskPointsSpent && f.diskPointsSpent > 0)) {
        figureUpgrades[f.id] = {
          level: f.level,
          clv: f.clv,
          diskPointsSpent: f.diskPointsSpent || 0,
          wheelSizes: f.wheel.map(w => w.size),
          clvAlloc: f.clvAlloc || f.wheel.map(() => 0)
        };
      }
    });
    const payload = {
      gems: state.rareMetals,
      coins: userCoins,
      material: userMaterial,
      rareMetalItems: userRareMetalItems,
      carmonite: userCarmonite,
      chainCubes: state.chainCubes,
      ingots: userIngots,
      lastDailyBonusTs,
      claimedMissionWinsCount,
      figureUpgrades
    };
    localStorage.setItem(ECONOMY_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {}
}

function syncAllCurrencyLabels() {
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt("rm-lbl", state.rareMetals.toLocaleString("en-US"));
  setTxt("coins-lbl", userCoins.toLocaleString("en-US"));
  setTxt("mat-lbl", userMaterial.toLocaleString("en-US"));
  setTxt("fusion-coins-lbl", userCoins.toLocaleString("en-US"));
  setTxt("fusion-rm-item-lbl", userRareMetalItems);
  setTxt("carmonite-lbl", userCarmonite);
  setTxt("cc-lbl", state.chainCubes);
  setTxt("fusion-ingot-lbl", userIngots);
  setTxt("shop-coins-lbl", userCoins.toLocaleString("en-US"));
  setTxt("shop-rm-item-lbl", userRareMetalItems);
  setTxt("shop-carm-lbl", userCarmonite);
  setTxt("shop-cube-lbl", state.chainCubes);
  updateDailyBonusButtonUI();
}

function updateDailyBonusButtonUI() {
  const btn = document.getElementById("daily-bonus-btn");
  if (!btn) return;
  const now = Date.now();
  const elapsed = now - (lastDailyBonusTs || 0);
  const cooldownMs = 24 * 3600 * 1000;
  if (elapsed >= cooldownMs) {
    btn.textContent = "🎁 Bônus Diário (+50🔻 +1,500🪙)";
    btn.style.opacity = "1.0";
    btn.className = "btn gold";
  } else {
    const remSec = Math.ceil((cooldownMs - elapsed) / 1000);
    btn.textContent = `⏳ Bônus (${formatBoosterHMS(remSec)})`;
    btn.style.opacity = "0.6";
    btn.className = "btn secondary";
  }
}
setInterval(updateDailyBonusButtonUI, 1000);

// 1. STRICT 24-HOUR DAILY LOGIN BONUS (NO MORE INFINITE GEMS!)
claimDailyGems = function() {
  const now = Date.now();
  const cooldownMs = 24 * 3600 * 1000;
  const elapsed = now - (lastDailyBonusTs || 0);
  const m = document.getElementById("shop-exchange-msg");
  if (elapsed < cooldownMs) {
    playSfx("hit");
    const remSec = Math.ceil((cooldownMs - elapsed) / 1000);
    if (m) {
      m.style.color = "#f87171";
      m.textContent = `🔒 Bônus Diário já resgatado hoje! Próximo bônus disponível em ${formatBoosterHMS(remSec)}. Vença partidas em [Play] para ganhar Gemas e Moedas!`;
    }
    return;
  }
  playSfx("portal");
  lastDailyBonusTs = now;
  state.rareMetals += 50;
  userCoins += 1500;
  userRareMetalItems += 1;
  saveEconomyAndUpgrades();
  syncAllCurrencyLabels();
  if (m) {
    m.style.color = "#4ade80";
    m.textContent = "🎁 Bônus Diário de 24h resgatado: +50🔻 Gems, +1,500🪙 Coins e +1🟦 Rare Metal!";
  }
};

// Fix Daily Missions popup so it requires winning a new match instead of giving free Gems infinitely!
showMenuPopup = function(kind) {
  playSfx("tick");
  const msgEl = document.getElementById("chest-reward-msg");
  if (!msgEl) return;
  if (kind === "rankings") {
    openGlobalRankingsModal();
    return;
  } else if (kind === "featured") {
    msgEl.textContent = "📺 Featured Duel: Vença partidas em [Play] para ganhar Caixas de Vitória, Moedas (🪙) e Gemas (🔻)!";
  } else if (kind === "missions") {
    const totalWins = playerProgression.matchesWon || 0;
    if (totalWins <= claimedMissionWinsCount) {
      playSfx("hit");
      msgEl.textContent = `🔒 Missão Diária: Vença mais 1 partida em [Play] para liberar a recompensa de missão (Vitórias atuais: ${totalWins})!`;
      return;
    }
    playSfx("portal");
    claimedMissionWinsCount = totalWins;
    state.rareMetals += 20;
    userCoins += 2000;
    userRareMetalItems += 1;
    saveEconomyAndUpgrades();
    syncAllCurrencyLabels();
    msgEl.textContent = "✅ Missão de Vitória Concluída: +20🔻 Gems, +2,000🪙 Coins e +1🟦 Rare Metal!";
  }
};

// 2. COIN SHOP: SPEND COINS ON BOXES & FUSION MATERIALS!
function buyWithCoins(itemKind) {
  const msg = document.getElementById("coin-shop-msg");
  if (itemKind === "coin_box") {
    const price = 10000;
    if (userCoins < price) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#f87171";
        msg.textContent = `❌ Moedas insuficientes (${userCoins.toLocaleString("en-US")}/${price.toLocaleString("en-US")}🪙)! Vença partidas (+3,500🪙) ou venda Ingots!`;
      }
      return;
    }
    playSfx("portal");
    userCoins -= price;
    userRareMetalItems += 1;
    userMaterial += 25;
    const pulled = rollFiguresForBox(1, false);
    saveEconomyAndUpgrades();
    syncAllCurrencyLabels();
    if (msg) {
      msg.style.color = "#4ade80";
      msg.textContent = `🎉 Caixa de Moedas aberta (-10,000🪙): ganhou [${FIGURES_DB[pulled[0]].rarity}] ${FIGURES_DB[pulled[0]].name} + 1🟦 Rare Metal + 25🔷 Material!`;
    }
    unlockAndShowBoosterModal("🪙 CAIXA DE MOEDAS ABERTA!", pulled, "+1🟦 Rare Metal · +25🔷 Material");
  } else if (itemKind === "rare_metal") {
    const price = 4000;
    if (userCoins < price) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#f87171";
        msg.textContent = `❌ Moedas insuficientes (${userCoins.toLocaleString("en-US")}/${price.toLocaleString("en-US")}🪙) para comprar 🟦 Rare Metal!`;
      }
      return;
    }
    playSfx("portal");
    userCoins -= price;
    userRareMetalItems += 1;
    saveEconomyAndUpgrades();
    syncAllCurrencyLabels();
    if (msg) {
      msg.style.color = "#4ade80";
      msg.textContent = `✅ +1🟦 Rare Metal comprado por 4,000🪙 Coins! (Estoque: ${userRareMetalItems}🟦)`;
    }
  } else if (itemKind === "carmonite") {
    const price = 15000;
    if (userCoins < price) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#f87171";
        msg.textContent = `❌ Moedas insuficientes (${userCoins.toLocaleString("en-US")}/${price.toLocaleString("en-US")}🪙) para comprar 🟣 50 Carmonite!`;
      }
      return;
    }
    playSfx("portal");
    userCoins -= price;
    userCarmonite += 50;
    saveEconomyAndUpgrades();
    syncAllCurrencyLabels();
    if (msg) {
      msg.style.color = "#4ade80";
      msg.textContent = `✅ +50🟣 Carmonite comprada por 15,000🪙 Coins! (Estoque: ${userCarmonite}🟣)`;
    }
  } else if (itemKind === "cube") {
    const price = 22000;
    if (userCoins < price) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#f87171";
        msg.textContent = `❌ Moedas insuficientes (${userCoins.toLocaleString("en-US")}/${price.toLocaleString("en-US")}🪙) para comprar 🟩 Green Cube!`;
      }
      return;
    }
    playSfx("portal");
    userCoins -= price;
    state.chainCubes += 1;
    saveEconomyAndUpgrades();
    syncAllCurrencyLabels();
    if (msg) {
      msg.style.color = "#4ade80";
      msg.textContent = `✅ +1🟩 Green Cube comprado por 22,000🪙 Coins! (Estoque: ${state.chainCubes}🟩)`;
    }
  }
}

// 3. STRICT FUSION CHAMBER ENGINE (REQUIRES BOTH MATERIAL & COINS — NEVER EVOLVES FOR FREE!)
const _v460RenderFusionChamber = renderFusionChamber;
renderFusionChamber = function() {
  _v460RenderFusionChamber();
  syncAllCurrencyLabels();
  const sel = document.getElementById("fusion-target-select");
  const idx = parseInt(sel ? sel.value : "0", 10);
  const f = FIGURES_DB[idx] || FIGURES_DB[0];
  if (!f) return;
  ensureFigureUpgradeMetadata(f);

  const rmCoinCost   = getLvUpCoinCost(f);
  const carmReq      = CARMONITE_COST_BY_RARITY[f.rarity] || 100;
  const carmCoinCost = getCarmoniteCoinCost(f);
  const cubeReq      = getClvCubeCost(f);
  const cubeCoinCost = getClvCoinCost(f);

  const lRm = document.getElementById("lbl-cost-rm");
  if (lRm) {
    lRm.innerHTML = f.level >= 5
      ? `<span style="color:#facc15;">Lv.5 Atingido (Use 🟣 Carmonite)</span>`
      : `Custo: <strong>1🟦 + ${rmCoinCost.toLocaleString("en-US")}🪙 Coins</strong>`;
  }
  const lCarm = document.getElementById("lbl-cost-carm");
  if (lCarm) {
    lCarm.innerHTML = f.level >= 10
      ? `<span style="color:#facc15;">MAX LV.10 ATINGIDO!</span>`
      : `Custo: <strong>${carmReq}🟣 + ${carmCoinCost.toLocaleString("en-US")}🪙 Coins</strong>`;
  }
  const lCube = document.getElementById("lbl-cost-cube");
  if (lCube) {
    lCube.innerHTML = f.clv >= 10
      ? `<span style="color:#facc15;">MAX CLv 10 ATINGIDO!</span>`
      : `Custo: <strong>${cubeReq}🟩 + ${cubeCoinCost.toLocaleString("en-US")}🪙 Coins</strong>`;
  }
  const lIng = document.getElementById("lbl-cost-ingot");
  if (lIng) {
    lIng.innerHTML = userIngots > 0
      ? `Estoque: <strong>${userIngots}🟨</strong> ➔ Ganha <strong>+15,000🪙</strong>`
      : `<span style="color:#f87171;">0🟨 Ingots no estoque</span>`;
  }
};

applyFusionMaterial = function(matType) {
  const sel = document.getElementById("fusion-target-select");
  const idx = parseInt(sel ? sel.value : "0", 10);
  const f = FIGURES_DB[idx] || FIGURES_DB[0];
  ensureFigureUpgradeMetadata(f);
  const msg = document.getElementById("fusion-status-msg");

  if (!isFigureUnlocked(idx)) {
    playSfx("hit");
    if (msg) {
      msg.style.color = "#f87171";
      msg.textContent = `🔒 ${f.name} está bloqueado! Desbloqueie antes de fundir.`;
    }
    return;
  }

  if (matType === "rare_metal") {
    const coinCost = getLvUpCoinCost(f);
    if (f.level >= 5) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#facc15";
        msg.textContent = `🛑 SOFT CAP LV.5 ATINGIDO! Para subir do Lv.6 ao Lv.10, use 🟣 Carmonite + 🪙 Coins!`;
      }
      return;
    }
    if (userRareMetalItems < 1) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#f87171";
        msg.textContent = `❌ Você tem 0🟦 Rare Metals! Ganhe vencendo partidas ou compre por 4,000🪙 Coins na Loja!`;
      }
      return;
    }
    if (userCoins < coinCost) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#f87171";
        msg.textContent = `❌ Moedas insuficientes! Precisa de ${coinCost.toLocaleString("en-US")}🪙 Coins (você tem ${userCoins.toLocaleString("en-US")}🪙). Vença partidas ou venda Ingots!`;
      }
      return;
    }
    playSfx("portal");
    userRareMetalItems -= 1;
    userCoins -= coinCost;
    f.level += 1;
    if (msg) {
      msg.style.color = "#4ade80";
      msg.textContent = `🟦 Fusão Concluída (-1🟦 Rare Metal e -${coinCost.toLocaleString("en-US")}🪙 Coins)! ${f.name} subiu para Lv.${f.level}/5 (+1 Disk Point liberado — toque na fatia do disco)!`;
    }
  } else if (matType === "carmonite") {
    const carmReq  = CARMONITE_COST_BY_RARITY[f.rarity] || 100;
    const coinCost = getCarmoniteCoinCost(f);
    if (f.level < 5) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#facc15";
        msg.textContent = `⚠️ ${f.name} está no Lv.${f.level}. Suba até o Lv.5 usando 🟦 Rare Metal + 🪙 Coins primeiro!`;
      }
      return;
    }
    if (f.level >= 10) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#facc15";
        msg.textContent = `🏆 NÍVEL MÁXIMO LV.10/10 JÁ ATINGIDO em ${f.name}!`;
      }
      return;
    }
    if (userCarmonite < carmReq) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#f87171";
        msg.textContent = `❌ Carmonite insuficiente (${userCarmonite}/${carmReq}🟣)! Compre +50🟣 na Loja de Moedas (15,000🪙) ou abra Caixas!`;
      }
      return;
    }
    if (userCoins < coinCost) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#f87171";
        msg.textContent = `❌ Moedas insuficientes! Precisa de ${coinCost.toLocaleString("en-US")}🪙 Coins (você tem ${userCoins.toLocaleString("en-US")}🪙) para fundir Carmonite!`;
      }
      return;
    }
    playSfx("portal");
    userCarmonite -= carmReq;
    userCoins -= coinCost;
    f.level += 1;
    if (msg) {
      msg.style.color = "#4ade80";
      msg.textContent = `🟣 Fusão Carmonite Concluída (-${carmReq}🟣 e -${coinCost.toLocaleString("en-US")}🪙 Coins)! ${f.name} subiu para Lv.${f.level}/10 (+1 Disk Point liberado)!`;
    }
  } else if (matType === "cube") {
    const cubeReq  = getClvCubeCost(f);
    const coinCost = getClvCoinCost(f);
    if (f.clv >= 10) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#facc15";
        msg.textContent = `🛑 CAP MÁXIMO CLv 10/10 ATINGIDO em ${f.name} (+10 DMG máximo)!`;
      }
      return;
    }
    if (state.chainCubes < cubeReq) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#f87171";
        msg.textContent = `❌ Green Cubes insuficientes (${state.chainCubes}/${cubeReq}🟩)! Compre na Loja de Moedas (22,000🪙) ou abra Caixas!`;
      }
      return;
    }
    if (userCoins < coinCost) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#f87171";
        msg.textContent = `❌ Moedas insuficientes! Precisa de ${coinCost.toLocaleString("en-US")}🪙 Coins (você tem ${userCoins.toLocaleString("en-US")}🪙) para fundir CLv!`;
      }
      return;
    }
    playSfx("portal");
    state.chainCubes -= cubeReq;
    userCoins -= coinCost;
    f.clv = Math.min(10, f.clv + 1);
    const wgIdx = f.wheel.findIndex(w => w.color === "white" || w.color === "gold");
    if (wgIdx !== -1) f.clvAlloc[wgIdx] = (f.clvAlloc[wgIdx] || 0) + 1;
    if (msg) {
      msg.style.color = "#4ade80";
      msg.textContent = `🟩 Chain Level Up (-${cubeReq}🟩 Cube e -${coinCost.toLocaleString("en-US")}🪙 Coins)! ${f.name} subiu para CLv ${f.clv}/10 (+1 DMG)!`;
    }
  } else if (matType === "ingot") {
    if (userIngots < 1) {
      playSfx("hit");
      if (msg) {
        msg.style.color = "#f87171";
        msg.textContent = `❌ Você tem 0🟨 Gold Ingots no estoque! Ganhe Ingots vencendo partidas ou abrindo Caixas!`;
      }
      return;
    }
    playSfx("portal");
    userIngots -= 1;
    userCoins += 15000;
    if (msg) {
      msg.style.color = "#4ade80";
      msg.textContent = `🟨 1x Gold Ingot vendido por +15,000🪙 Coins! (Ingots restantes: ${userIngots}🟨)`;
    }
  }

  saveEconomyAndUpgrades();
  syncAllCurrencyLabels();
  renderFusionChamber();
  renderHubAndCollection();
  demoFullMatchState();
};

// Also make the `+CLv` button on Collection cards enforce the exact same strict Cube + Coin check!
fuseFigure = function(idx) {
  const f = FIGURES_DB[idx];
  if (!f || !isFigureUnlocked(idx)) return;
  ensureFigureUpgradeMetadata(f);
  const cubeReq  = getClvCubeCost(f);
  const coinCost = getClvCoinCost(f);
  const ind = document.getElementById("editing-slot-indicator");
  if (f.clv >= 10) {
    playSfx("hit");
    if (ind) ind.textContent = `🛑 ${f.name} já está no CLv 10/10!`;
    return;
  }
  if (state.chainCubes < cubeReq || userCoins < coinCost) {
    playSfx("hit");
    if (ind) {
      ind.textContent = `❌ Requer ${cubeReq}🟩 (${state.chainCubes}) + ${coinCost.toLocaleString("en-US")}🪙 (${userCoins.toLocaleString("en-US")})!`;
    }
    return;
  }
  state.chainCubes -= cubeReq;
  userCoins -= coinCost;
  f.clv = Math.min(10, f.clv + 1);
  const wgIdx = f.wheel.findIndex(w => w.color === "white" || w.color === "gold");
  if (wgIdx !== -1) f.clvAlloc[wgIdx] = (f.clvAlloc[wgIdx] || 0) + 1;
  saveEconomyAndUpgrades();
  syncAllCurrencyLabels();
  playSfx("portal");
  if (ind) ind.textContent = `✅ ${f.name} CLv+${f.clv} (-${cubeReq}🟩 -${coinCost.toLocaleString("en-US")}🪙)`;
  demoFullMatchState();
  renderHubAndCollection();
};

// Persist disk expansion & reset changes to localStorage too!
const _origExpandWheelSlice = expandWheelSlice;
expandWheelSlice = function(figIdx, sliceIdx) {
  _origExpandWheelSlice(figIdx, sliceIdx);
  saveEconomyAndUpgrades();
};
const _origResetFigureDiskAllocation = resetFigureDiskAllocation;
resetFigureDiskAllocation = function() {
  _origResetFigureDiskAllocation();
  saveEconomyAndUpgrades();
};
const _origAllocateClvDamageToSlice = allocateClvDamageToSlice;
allocateClvDamageToSlice = function(figIdx, sliceIdx) {
  _origAllocateClvDamageToSlice(figIdx, sliceIdx);
  saveEconomyAndUpgrades();
};

// Update match rewards & box openings so they also grant Rare Metals / Ingots / Coins and save to localStorage!
const _v460ShowWinResultScreen = showWinResultScreen;
showWinResultScreen = function(winner) {
  const didWin = (winner === getBottomRole());
  _v460ShowWinResultScreen(winner);
  if (didWin) {
    // Adjust win rewards: +35 Gems (realistic, not excessive), +3,500 Coins total, +1 Rare Metal, 35% chance +1 Ingot!
    state.rareMetals = Math.max(0, state.rareMetals - 15); // _v460 added +50, adjust net to +35🔻
    userCoins += 1000; // _v460 added +2,500, adjust net to +3,500🪙
    userRareMetalItems += 1;
    const gotIngot = Math.random() < 0.35;
    if (gotIngot) userIngots += 1;
    const gemsValEl = document.getElementById("win-gems-val");
    if (gemsValEl) {
      gemsValEl.textContent = `+35 🔻 · +3,500 🪙 · +1🟦${gotIngot ? ' · +1🟨 Ingot!' : ''}`;
    }
  } else {
    // Consolation Coins on loss so player can still progress toward Coin Shop items
    userCoins += 600;
    const gemsValEl = document.getElementById("win-gems-val");
    if (gemsValEl) gemsValEl.textContent = `+600 🪙 Coins`;
  }
  saveEconomyAndUpgrades();
  syncAllCurrencyLabels();
};

const _v460UnlockAndShowBoosterModal = unlockAndShowBoosterModal;
unlockAndShowBoosterModal = function(title, pulledIndices, bonusText) {
  userRareMetalItems += 1;
  _v460UnlockAndShowBoosterModal(title, pulledIndices, bonusText + " · +1🟦 Rare Metal");
  saveEconomyAndUpgrades();
  syncAllCurrencyLabels();
};

loadEconomyAndUpgrades();
syncAllCurrencyLabels();


// ============================================================================
// SECTION 15: v4.8.0 INDIVIDUAL TRAINER PROFILE (ZEROED STATS, UNIQUE ID PER
// PERSON, P2P OPPONENT SYNC, DYNAMIC ACHIEVEMENTS, CLEAN MENU & EXIT HANDLER)
// ============================================================================
const INDIVIDUAL_PROFILE_KEY = "pdr_individual_profile_v480";
let remoteOpponentProfile = { nickname: "Oponente", trainerId: "---", rankRating: 1000, leagueTier: "Beginner" };

function generateUniqueTrainerId() {
  const seg = () => String(Math.floor(100 + Math.random() * 900));
  return `${seg()}-${seg()}-${seg()}`;
}

function getTierForRating(elo) {
  if (elo >= 2700) return "Legend";
  if (elo >= 2300) return "Master";
  if (elo >= 1900) return "Champion";
  if (elo >= 1500) return "Leader";
  return "Beginner";
}

function createBlankIndividualProfile(customNick) {
  const cleanNick = (customNick || "").trim() || "Treinador";
  return {
    version: "4.8.0",
    isSetupDone: true,
    trainerId: generateUniqueTrainerId(),
    nickname: cleanNick,
    titleBadge: "Treinador Iniciante",
    rankRating: 1000,
    highestRating: 1000,
    leagueTier: "Beginner",
    duelStats: {
      totalDuels: 0,
      wins: 0,
      losses: 0,
      winRate: "0.0%",
      currentWinStreak: 0,
      highestWinStreak: 0
    },
    equippedCosmetics: {
      hairStyle: "Spiky_Gold",
      pedestalSkin: "Standard_Bronze"
    },
    mainDisplayFigure: "Pikachu"
  };
}

function loadIndividualProfile() {
  try {
    const raw = localStorage.getItem(INDIVIDUAL_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === "4.8.0" && parsed.trainerId && parsed.duelStats) {
        parsed.isSetupDone = true;
        return parsed;
      }
    }
  } catch (e) {}
  const fresh = createBlankIndividualProfile("");
  try { localStorage.setItem(INDIVIDUAL_PROFILE_KEY, JSON.stringify(fresh)); } catch (e) {}
  return fresh;
}

window.trainerProfileData = loadIndividualProfile();
playerProfileName = window.trainerProfileData.nickname;

function saveIndividualProfile() {
  try {
    localStorage.setItem(INDIVIDUAL_PROFILE_KEY, JSON.stringify(window.trainerProfileData));
  } catch (e) {}
}

const OFFICIAL_CREATOR_TRAINER_ID = "484-861-517";

function isOfficialCreatorProfile(p) {
  if (!p) return false;
  const tid = String(p.trainerId || "").trim();
  if (tid === OFFICIAL_CREATOR_TRAINER_ID) return true;
  const n = String(p.nickname || p.name || p.username || "").trim().toLowerCase();
  if (n === "wisper" || n === "wisper2904") return true;
  try {
    const sess = typeof getSavedCloudSession === "function" ? getSavedCloudSession() : null;
    if (p === window.trainerProfileData && sess && sess.username) {
      const su = String(sess.username).trim().toLowerCase();
      if (su === "wisper" || su === "wisper2904") return true;
    }
  } catch (e) {}
  return false;
}
window.isOfficialCreatorProfile = isOfficialCreatorProfile;

function computeEarnedAchievements(p) {
  const badges = [];
  const wins = (p.duelStats && p.duelStats.wins) || 0;
  const maxStreak = (p.duelStats && p.duelStats.highestWinStreak) || 0;
  const maxElo = p.highestRating || 1000;
  const unlockedCnt = (playerProgression && playerProgression.unlockedFigures) ? playerProgression.unlockedFigures.length : 6;

  if (isOfficialCreatorProfile(p)) {
    badges.push({ label: "👑 Criador Oficial do Jogo (Dev)", bg: "linear-gradient(90deg,#78350f,#b45309)", border: "#facc15", col: "#fef08a" });
    badges.push({ label: "🏆 Fundador do PokeDuel (ID 484-861-517)", bg: "#3b0764", border: "#e879f9", col: "#fae8ff" });
  }
  if (wins >= 1) badges.push({ label: "🏅 1ª Vitória Conquistada", bg: "#14532d", border: "#4ade80", col: "#dcfce7" });
  if (wins >= 5) badges.push({ label: "⚔️ 5 Vitórias em Duelos", bg: "#0c4a6e", border: "#38bdf8", col: "#bae6fd" });
  if (wins >= 15) badges.push({ label: "🏆 Campeão de Carmonte (15V)", bg: "#422006", border: "#facc15", col: "#fef08a" });
  if (maxStreak >= 3) badges.push({ label: `🔥 Série Invicta (${maxStreak}x)`, bg: "#7f1d1d", border: "#f87171", col: "#fecaca" });
  if (maxElo >= 1500) badges.push({ label: "👑 Liga Leader (1500+ Pts)", bg: "#312e81", border: "#818cf8", col: "#e0e7ff" });
  if (maxElo >= 1900) badges.push({ label: "🌟 Liga Champion (1900+ Pts)", bg: "#581c87", border: "#c084fc", col: "#f3e8ff" });
  if (unlockedCnt >= 10) badges.push({ label: `🔓 Colecionador (${unlockedCnt}/217)`, bg: "#1e1b4b", border: "#facc15", col: "#fef08a" });
  return badges;
}

function syncIndividualProfileUI() {
  const p = window.trainerProfileData;
  if (!p) return;
  if (isOfficialCreatorProfile(p)) {
    p.trainerId = OFFICIAL_CREATOR_TRAINER_ID;
    if (!p.titleBadge || p.titleBadge === "Treinador Iniciante") {
      p.titleBadge = "👑 Criador Oficial do Jogo";
    }
    const tSel = document.getElementById("prof-title-select");
    if (tSel && !Array.from(tSel.options).some(o => o.value === "👑 Criador Oficial do Jogo")) {
      const opt = document.createElement("option");
      opt.value = "👑 Criador Oficial do Jogo";
      opt.textContent = "👑 Criador Oficial do Jogo";
      tSel.insertBefore(opt, tSel.firstChild);
    }
  }
  p.leagueTier = getTierForRating(p.rankRating || 1000);
  playerProfileName = p.nickname || "Treinador";

  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt("league-pts-lbl", p.rankRating);
  setTxt("trainer-name-lbl", p.nickname);
  setTxt("prof-header-nick", p.nickname);
  setTxt("prof-id-lbl", p.trainerId);
  setTxt("prof-title-badge", p.titleBadge);
  setTxt("prof-rating-val", p.rankRating);
  setTxt("prof-tier-lbl", p.leagueTier + " League");
  setTxt("prof-max-rating-val", p.highestRating);
  setTxt("prof-keys-val", playerKeyFragments || 0);
  setTxt("prof-collection-count-lbl", `${playerProgression.unlockedFigures.length}/${FIGURES_DB.length} Pokémon`);

  const ds = p.duelStats || { totalDuels: 0, wins: 0, losses: 0, winRate: "0.0%", currentWinStreak: 0, highestWinStreak: 0 };
  setTxt("pstat-total", ds.totalDuels);
  setTxt("pstat-wins", ds.wins);
  setTxt("pstat-losses", ds.losses);
  setTxt("pstat-wr", ds.winRate);
  setTxt("pstat-streak", ds.currentWinStreak + "🔥");
  setTxt("pstat-maxstreak", ds.highestWinStreak + "🏆");

  setTxt("menu-profile-summary-lbl", `${p.nickname} · ${p.rankRating} Pts (${p.leagueTier}) · ${ds.wins}V / ${ds.losses}D (${ds.winRate})`);
  setTxt("menu-profile-id-pill", `ID: ${p.trainerId}`);

  const tCont = document.getElementById("prof-trophies-container");
  if (tCont) {
    const earned = computeEarnedAchievements(p);
    if (earned.length === 0) {
      tCont.innerHTML = `<span style="font-size:8.5px; color:#94a3b8;">🔒 Nenhuma insígnia ainda — vença partidas para desbloquear suas conquistas!</span>`;
    } else {
      tCont.innerHTML = earned.map(b =>
        `<span style="background:${b.bg}; border:1px solid ${b.border}; color:${b.col}; font-size:8px; font-weight:800; padding:2px 6px; border-radius:5px;">${b.label}</span>`
      ).join("");
    }
  }
}

openPlayerProfileModal = function() {
  playSfx("tick");
  syncIndividualProfileUI();
  const p = window.trainerProfileData;
  const inp = document.getElementById("prof-name-input");
  if (inp) inp.value = p.nickname || "Treinador";
  const tSel = document.getElementById("prof-title-select");
  if (tSel && p.titleBadge) tSel.value = p.titleBadge;
  const hSel = document.getElementById("prof-hair-select");
  if (hSel && p.equippedCosmetics && p.equippedCosmetics.hairStyle) hSel.value = p.equippedCosmetics.hairStyle;
  const pSel = document.getElementById("prof-pedestal-select");
  if (pSel && p.equippedCosmetics && p.equippedCosmetics.pedestalSkin) pSel.value = p.equippedCosmetics.pedestalSkin;

  const sel = document.getElementById("prof-centerpiece-select");
  if (sel) {
    sel.innerHTML = state.deckP1.map((fIdx, sPos) => {
      const f = FIGURES_DB[fIdx % FIGURES_DB.length];
      return `<option value="${sPos}" ${sPos === (selectedCarouselSlot % 6) ? "selected" : ""}>Slot #${sPos + 1} do Meu Time: [${f.rarity}] ${f.name}</option>`;
    }).join("");
  }
  const m = document.getElementById("player-profile-modal");
  if (m) m.style.display = "flex";
};

savePlayerProfileSettings = function() {
  const p = window.trainerProfileData;
  const inp = document.getElementById("prof-name-input");
  const tSel = document.getElementById("prof-title-select");
  const hSel = document.getElementById("prof-hair-select");
  const pSel = document.getElementById("prof-pedestal-select");
  const sel = document.getElementById("prof-centerpiece-select");

  if (inp && inp.value.trim()) {
    const rawNew = inp.value.trim().slice(0, 16);
    try {
      const activeSession = typeof getSavedCloudSession === "function" ? getSavedCloudSession() : null;
      const curNick = (p.nickname || "").trim().toLowerCase();
      const newNick = rawNew.trim().toLowerCase();
      if (newNick !== curNick && typeof getLocalAccountsVault === "function") {
        const vault = getLocalAccountsVault();
        const targetUserHash = sha256HexSync(utf8ToAsciiBytes("pokeduel_user_v560:" + newNick));
        const activeUserHash = activeSession ? activeSession.userHash : "";
        if (vault && vault[targetUserHash] && targetUserHash !== activeUserHash) {
          playSfx("hit");
          alert(`⚠️ O usuário "${rawNew}" já possui uma conta registrada com senha!\nPara acessar este perfil, use o botão "Gerenciar Conta" e faça login com sua senha.`);
          return;
        }
      }
    } catch (e) {}
    p.nickname = rawNew;
    p.isSetupDone = true;
  }
  if (tSel && tSel.value) p.titleBadge = tSel.value;
  if (!p.equippedCosmetics) p.equippedCosmetics = {};
  if (hSel && hSel.value) p.equippedCosmetics.hairStyle = hSel.value;
  if (pSel && pSel.value) p.equippedCosmetics.pedestalSkin = pSel.value;
  if (sel && sel.value !== "") {
    const slotNum = parseInt(sel.value, 10);
    if (!isNaN(slotNum)) {
      selectedCarouselSlot = ((slotNum % 6) + 6) % 6;
      activeCenterpieceKey = "team_slot";
      const cf = FIGURES_DB[state.deckP1[selectedCarouselSlot] % FIGURES_DB.length];
      if (cf) p.mainDisplayFigure = cf.name;
    }
  }
  saveIndividualProfile();
  syncIndividualProfileUI();
  try {
    const sess = typeof getSavedCloudSession === "function" ? getSavedCloudSession() : null;
    if (sess && sess.username && typeof publishRegisteredAccountToGlobalCloud === "function") {
      publishRegisteredAccountToGlobalCloud(buildRegisteredAccountPublicProfile(sess.username));
    }
  } catch (e) {}
  playSfx("portal");
};

function completeWelcomeProfileSetup() {
  const inp = document.getElementById("welcome-nick-inp");
  const nick = (inp && inp.value.trim()) ? inp.value.trim().slice(0, 16) : ("Treinador_" + Math.floor(100 + Math.random() * 900));
  window.trainerProfileData.nickname = nick;
  window.trainerProfileData.isSetupDone = true;
  saveIndividualProfile();
  syncIndividualProfileUI();
  const wm = document.getElementById("welcome-profile-modal");
  if (wm) wm.style.display = "none";
  playSfx("portal");
}

function confirmResetIndividualProfile() {
  playSfx("tick");
  closePlayerProfileModal();
  // Reset profile, progression & economy to a clean 0-duel state for this person
  window.trainerProfileData = createBlankIndividualProfile("");
  saveIndividualProfile();
  playerProgression = createFreshProgressionState();
  saveProgressionState();
  playerKeyFragments = 0;
  FIGURES_DB.forEach(f => {
    f.level = 1;
    f.clv = 0;
    f.diskPointsSpent = 0;
    if (f.baseWheelLv1) f.wheel = f.baseWheelLv1.map(w => ({ ...w }));
    f.clvAlloc = f.wheel.map(() => 0);
  });
  state.rareMetals   = 100;   // 100 Gems apenas (Novo Balanceamento)
  userCoins          = 15000; // 15,000 Coins / Ouro (Novo Balanceamento)
  userMaterial       = 250;
  userRareMetalItems = 2;
  userCarmonite      = 50;
  state.chainCubes   = 1;
  userIngots         = 1;
  lastDailyBonusTs   = 0;
  claimedMissionWinsCount = 0;
  saveEconomyAndUpgrades();
  syncProgressionToDeckState();
  syncAllCurrencyLabels();
  syncIndividualProfileUI();
  renderHubAndCollection();
  renderShopExchange();

  const wm = document.getElementById("welcome-profile-modal");
  const inp = document.getElementById("welcome-nick-inp");
  if (inp) inp.value = "";
  if (wm) wm.style.display = "flex";
}

function selectArenaThemeFromMenu(surfaceName) {
  setTableSurface(surfaceName);
  playSfx("portal");
  const names = {
    crystal: "💎 Cristal Original",
    banana: "🍌 Arena Dourada 3D",
    marble: "🏛️ Mármore Imperial",
    wood: "🪵 Madeira Nobre",
    stone: "🪨 Rocha Vulcânica",
    habitats: "🌿 4 Habitats Pokémon"
  };
  ["crystal", "banana", "marble", "wood", "stone", "habitats"].forEach(s => {
    const b = document.getElementById("surf-btn-" + s);
    if (b) b.className = "btn " + (s === surfaceName ? "gold" : "secondary");
  });
  const msg = document.getElementById("menu-arena-msg");
  if (msg) msg.textContent = `✅ Tema da Arena alterado para: ${names[surfaceName] || surfaceName}!`;
}

// Keep BGM button label in Menu synced with toggleWebAudioBgm
const _origToggleWebAudioBgm = toggleWebAudioBgm;
toggleWebAudioBgm = function() {
  _origToggleWebAudioBgm();
  const mBtn = document.getElementById("menu-bgm-btn");
  if (mBtn) mBtn.textContent = bgmEnabled ? "🎵 Música (BGM): ON" : "🔊 Música (BGM): OFF";
};

// Clean Exit Game Modal & Handler (also linked to Android Hardware Back Button!)
function openExitGameModal() {
  playSfx("tick");
  const m = document.getElementById("exit-game-modal");
  if (m) m.style.display = "flex";
}
function closeExitGameModal() {
  const m = document.getElementById("exit-game-modal");
  if (m) m.style.display = "none";
}
function executeExitGameNow() {
  saveIndividualProfile();
  saveProgressionState();
  saveEconomyAndUpgrades();
  closeExitGameModal();
  if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; bgmEnabled = false; }
  try { if (navigator.app && navigator.app.exitApp) navigator.app.exitApp(); } catch (e) {}
  try { window.close(); } catch (e) {}
  try { history.back(); } catch (e) {}
  document.body.innerHTML = `<div style="width:100vw;height:100vh;background:#020617;color:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:sans-serif;">
    <div style="font-size:42px;margin-bottom:10px;">👋</div>
    <h2 style="margin:0 0 8px;color:#facc15;">Jogo Salvo e Encerrado</h2>
    <p style="font-size:13px;color:#94a3b8;max-width:300px;margin:0 0 20px;">Todo o seu perfil individual, pontos e Pokémon foram salvos com segurança.</p>
    <button onclick="location.reload()" style="padding:10px 22px;border-radius:8px;background:linear-gradient(180deg,#fde047,#ca8a04);border:2px solid #fff;color:#090d16;font-weight:900;font-size:13px;cursor:pointer;">🔄 Entrar Novamente</button>
  </div>`;
}

window.handleAndroidBackButton = function() {
  const closeIfFlex = (id) => {
    const el = document.getElementById(id);
    if (el && el.style.display === "flex") { el.style.display = "none"; return true; }
    return false;
  };
  if (closeIfFlex("rename-team-modal")) return;
  if (closeIfFlex("delete-team-modal")) return;
  if (closeIfFlex("exit-game-modal")) return;
  if (closeIfFlex("player-profile-modal")) return;
  if (closeIfFlex("figure-details-modal")) return;
  if (closeIfFlex("booster-unbox-modal")) return;
  if (closeIfFlex("time-booster-modal")) return;
  if (closeIfFlex("play-mode-selector-modal")) return;

  const w = document.getElementById("wheel-overlay");
  if (w && w.classList.contains("show")) { w.classList.remove("show"); return; }
  const p = document.getElementById("plates-tray");
  if (p && p.classList.contains("show")) { p.classList.remove("show"); return; }

  const d = document.getElementById("drawer-modal");
  if (d && !d.classList.contains("show")) {
    // Player is on the match board -> return to the Hub (Leagues)!
    openDrawer("hub");
    return;
  }
  const hubTab = document.getElementById("dtab-hub");
  if (hubTab && hubTab.style.display === "none") {
    // Player is in Decks / Fusion / Shop / Config -> return to Leagues tab!
    switchDrawerTab("hub");
    return;
  }
  // Already on Leagues home screen -> ask if they want to exit the game!
  openExitGameModal();
};

// Sync P2P opponent profile so each player sees the other person's real Nickname & ELO Rating!
const _origSendP2PPacket = sendP2PPacket;
sendP2PPacket = function(obj) {
  if (obj && typeof obj === "object" && window.trainerProfileData) {
    obj.senderProfile = {
      nickname: window.trainerProfileData.nickname,
      trainerId: window.trainerProfileData.trainerId,
      rankRating: window.trainerProfileData.rankRating,
      leagueTier: window.trainerProfileData.leagueTier
    };
  }
  return _origSendP2PPacket(obj);
};

const _origHandleP2PPacket = handleP2PPacket;
handleP2PPacket = function(msg) {
  let parsed = msg;
  if (typeof msg === "string") {
    try { parsed = JSON.parse(msg); } catch (e) {}
  }
  if (parsed && parsed.senderProfile) {
    remoteOpponentProfile = parsed.senderProfile;
  }
  return _origHandleP2PPacket(msg);
};

// Update showWinResultScreen to use opponent's real ELO (in P2P) or AI ELO (1050) and update individual profile UI!
const _v470ShowWinResultScreen = showWinResultScreen;
showWinResultScreen = function(winner) {
  _v470ShowWinResultScreen(winner);
  saveIndividualProfile();
  syncIndividualProfileUI();
};

syncIndividualProfileUI();
if (!window.trainerProfileData || (!window.trainerProfileData.isSetupDone && !window.trainerProfileData.nickname)) {
  setTimeout(() => {
    const wm = document.getElementById("welcome-profile-modal");
    if (wm) wm.style.display = "flex";
  }, 350);
}



// ============================================================================
// SECTION 16: v5.0.0 STRICT TIME BOOSTER TIMER ENFORCEMENT & POKEDUEL LOGO
// - Eliminates any instant "Abrir Caixa Agora" bypass after winning a match!
// - Every box won from a match is placed into a Hub Time Booster slot (0..2)
//   and CANNOT be opened until its real-time countdown (01:00:00 or 06:00:00)
//   reaches 00:00:00!
// - Embeds the official Nano Banana "PokeDuel" 3D logo across the UI.
// ============================================================================
// (POKEDUEL_BANANA_LOGO_URI loaded from js/data/sprites.js)

// Reset any legacy instant victoryBoxesWon counter so no bypass button ever appears
playerProgression.victoryBoxesWon = 0;
saveProgressionState();

// Hide legacy instant-open buttons in Decks and update Shop banner to point to Hub Time Boosters
(function applyPokeDuelBrandingAndHideInstantButtons() {
  document.title = "PokeDuel";
  const deckVBtn = document.getElementById("deck-victory-box-btn");
  if (deckVBtn) deckVBtn.style.display = "none";

  // Inject Nano Banana PokeDuel logo into Welcome Modal, Menu Header, and Top Bar
  const wm = document.getElementById("welcome-profile-modal");
  if (wm) {
    const card = wm.querySelector("div");
    if (card && ! document.getElementById("wm-banana-logo")) {
      const img = document.createElement("img");
      img.id = "wm-banana-logo";
      img.src = POKEDUEL_BANANA_LOGO_URI;
      img.style.cssText = "width:84px;height:84px;border-radius:18px;margin:0 auto 8px;display:block;box-shadow:0 4px 16px rgba(56,189,248,0.45);border:1.5px solid #38bdf8;";
      card.insertBefore(img, card.firstChild);
    }
  }

  const cfgTab = document.getElementById("dtab-menu") || document.getElementById("dtab-config");
  if (cfgTab && !document.getElementById("cfg-banana-logo-banner")) {
    const banner = document.createElement("div");
    banner.id = "cfg-banana-logo-banner";
    banner.style.cssText = "display:flex;align-items:center;gap:10px;background:linear-gradient(90deg,#09152b,#0f2942);border:1.5px solid #38bdf8;border-radius:10px;padding:8px 12px;margin-bottom:8px;box-shadow:0 4px 12px rgba(0,0,0,0.5);";
    banner.innerHTML = `<img src="${POKEDUEL_BANANA_LOGO_URI}" style="width:48px;height:48px;border-radius:11px;border:1.5px solid #facc15;flex-shrink:0;">
      <div style="text-align:left;">
        <div style="font-size:13px;font-weight:900;color:#fde047;letter-spacing:0.5px;">POKEDUEL <span style="font-size:9px;color:#38bdf8;">v5.4.0</span></div>
        <div style="font-size:9px;color:#cbd5e1;">306 Figuras 3D Kaiyodo · Time Boosters em Tempo Real · Multiplayer P2P</div>
      </div>`;
    cfgTab.insertBefore(banner, cfgTab.firstChild);
  }
})();

// Override tickRealTimeBoosters so Hub slots show live timer & gem cost, and #time-booster-modal allows instant opening with Gems!
tickRealTimeBoosters = function() {
  const now = Date.now();
  let activeCount = 0;
  let readyCount = 0;
  for (let idx = 0; idx < 3; idx++) {
    const tb = timeBoostersState[idx];
    const tEl = document.getElementById("tb-timer-" + idx);
    const cEl = document.getElementById("tb-cost-" + idx);
    const imgEl = document.getElementById("tb-img-" + idx);
    if (!tb || !tEl || !cEl) continue;

    if (tb.status === "empty") {
      tEl.textContent = "VAZIO";
      tEl.style.color = "#94a3b8";
      cEl.textContent = "DUEL";
      cEl.style.color = "#94a3b8";
      if (imgEl) imgEl.style.opacity = "0.22";
      continue;
    }

    activeCount++;
    if (imgEl) {
      imgEl.style.opacity = "1.0";
      imgEl.src = tb.kind === "purple" ? HOME_V380_UI_ASSETS.booster_purple : HOME_V380_UI_ASSETS.booster_silver;
    }

    const remSec = Math.max(0, Math.ceil((tb.endTs - now) / 1000));
    if (remSec === 0) {
      tb.status = "ready";
      readyCount++;
      tEl.textContent = "ABRIR!";
      tEl.style.color = "#4ade80";
      cEl.textContent = "PRONTO";
      cEl.style.color = "#4ade80";
    } else {
      tb.status = "unlocking";
      tEl.textContent = formatBoosterHMS(remSec);
      tEl.style.color = "#ffffff";
      const gemCost = Math.max(1, Math.ceil((remSec / (tb.totalSec || 3600)) * (tb.baseGems || (tb.kind === "purple" ? 60 : 10))));
      cEl.textContent = gemCost;
      cEl.style.color = "#fde047";
    }
  }

  // Update Shop Time Booster status banner
  const vBoxLbl = document.getElementById("shop-victory-boxes-lbl");
  if (vBoxLbl) vBoxLbl.textContent = `${activeCount}/3 no Hub (${readyCount} pronta${readyCount === 1 ? '' : 's'})`;
  const vBoxBtn = document.getElementById("shop-open-victory-btn");
  if (vBoxBtn) {
    vBoxBtn.textContent = readyCount > 0 ? `🎁 Abrir no Hub (${readyCount})` : `⏱️ Ver Cronômetros (${activeCount}/3)`;
    vBoxBtn.style.opacity = "1.0";
  }
  const deckVBtn = document.getElementById("deck-victory-box-btn");
  if (deckVBtn) deckVBtn.style.display = "none";

  // Update #time-booster-modal live clock and gem open button
  if (inspectedBoosterSlotIdx >= 0 && inspectedBoosterSlotIdx < 3) {
    const mEl = document.getElementById("time-booster-modal");
    if (mEl && mEl.style.display === "flex") {
      const tb = timeBoostersState[inspectedBoosterSlotIdx];
      const clkEl = document.getElementById("tbm-live-clock");
      const btnEl = document.getElementById("tbm-gem-open-btn");
      const errEl = document.getElementById("tbm-error-msg");
      if (tb && tb.status !== "empty") {
        const remSec = Math.max(0, Math.ceil((tb.endTs - now) / 1000));
        if (clkEl) clkEl.textContent = formatBoosterHMS(remSec);
        const gemCost = remSec === 0 ? 0 : Math.max(1, Math.ceil((remSec / (tb.totalSec || 3600)) * (tb.baseGems || (tb.kind === "purple" ? 60 : 10))));
        if (btnEl) {
          if (remSec === 0) {
            btnEl.textContent = "🎁 Abrir Caixa Agora (Grátis!)";
            btnEl.style.opacity = "1.0";
            btnEl.style.background = "linear-gradient(180deg,#4ade80 0%,#16a34a 100%)";
            btnEl.style.color = "#ffffff";
          } else {
            btnEl.textContent = `🔻 Abrir (${gemCost} Gems)`;
            btnEl.style.opacity = "1.0";
            btnEl.style.background = "linear-gradient(180deg,#fef08a 0%,#facc15 50%,#ca8a04 100%)";
            btnEl.style.color = "#090d16";
          }
        }
        if (errEl) {
          if (remSec > 0) {
            errEl.style.color = "#bae6fd";
            errEl.textContent = `⚡ Acelere agora por 🔻${gemCost} Gemas ou aguarde o cronômetro zerar.`;
          } else {
            errEl.style.color = "#4ade80";
            errEl.textContent = `✅ Tempo concluído! Toque em Abrir Caixa para receber seus Pokémon!`;
          }
        }
      }
    }
  }
};

// consumeAndUnboxTimeBooster: opens chest when timer ends OR when unlocked via Gems!
consumeAndUnboxTimeBooster = function(slotIdx, forceGemBypass) {
  const tb = timeBoostersState[slotIdx];
  if (!tb || tb.status === "empty") return;
  const now = Date.now();
  const remSec = Math.max(0, Math.ceil((tb.endTs - now) / 1000));
  if (remSec > 0 && !forceGemBypass) {
    playSfx("hit");
    const errEl = document.getElementById("tbm-error-msg");
    if (errEl) {
      errEl.style.color = "#f87171";
      errEl.textContent = `🔒 Faltam ${formatBoosterHMS(remSec)}! Use gemas para abrir imediatamente.`;
    }
    return;
  }

  const boxLabel = tb.name + (forceGemBypass ? " (Acelerado com Gems!)" : "");
  const isPurple = (tb.kind === "purple");
  tb.status = "empty";
  tb.endTs = 0;
  saveRealTimeBoosters();
  tickRealTimeBoosters();

  playSfx("portal");
  state.chainCubes += 1;
  userMaterial += (isPurple ? 150 : 60);
  userCoins += (isPurple ? 8000 : 4000);
  const pulled = rollFiguresForBox(isPurple ? 2 : 1, isPurple);
  saveEconomyAndUpgrades();
  syncAllCurrencyLabels();
  const msg = document.getElementById("chest-reward-msg");
  if (msg) msg.textContent = `🎉 ${boxLabel} concluído e aberto! (Slot #${slotIdx + 1} livre)`;
  unlockAndShowBoosterModal(
    `🎁 ${boxLabel}`,
    pulled,
    `+${isPurple ? 150 : 60} Material · +${isPurple ? '8,000' : '4,000'} 🪙 Coins · +1🟩 Cube`
  );
};

confirmGemOpenTimeBooster = function() {
  if (inspectedBoosterSlotIdx < 0 || inspectedBoosterSlotIdx >= 3) return;
  const tb = timeBoostersState[inspectedBoosterSlotIdx];
  if (!tb || tb.status === "empty") return;
  const now = Date.now();
  const remSec = Math.max(0, Math.ceil((tb.endTs - now) / 1000));
  const gemCost = remSec === 0 ? 0 : Math.max(1, Math.ceil((remSec / (tb.totalSec || 3600)) * (tb.baseGems || (tb.kind === "purple" ? 60 : 10))));

  if (gemCost > 0) {
    if (state.rareMetals < gemCost) {
      playSfx("hit");
      const errEl = document.getElementById("tbm-error-msg");
      if (errEl) {
        errEl.style.color = "#f87171";
        errEl.textContent = `⚠️ Gemas insuficientes (${state.rareMetals}/${gemCost}🔻)!`;
      }
      const needed = gemCost - state.rareMetals;
      const addGems = confirm(
        `⚠️ Gemas insuficientes para abrir este Time Booster agora!\n\n` +
        `Você possui: 🔻 ${state.rareMetals} Gems\n` +
        `Custo: 🔻 ${gemCost} Gems (Faltam 🔻 ${needed} Gems)\n\n` +
        `Deseja adicionar +300 Gems bônus para abrir a caixa agora?`
      );
      if (addGems) {
        state.rareMetals += 300;
        saveEconomyAndUpgrades();
        syncAllCurrencyLabels();
        confirmGemOpenTimeBooster();
      }
      return;
    }
    state.rareMetals -= gemCost;
    saveEconomyAndUpgrades();
    syncAllCurrencyLabels();
  }

  const slotToOpen = inspectedBoosterSlotIdx;
  closeTimeBoosterModal();
  consumeAndUnboxTimeBooster(slotToOpen, true);
};

handleTimeBoosterClick = function(slotIdx) {
  playSfx("tick");
  const msgEl = document.getElementById("chest-reward-msg");
  if (slotIdx === 3) {
    if (msgEl) msgEl.textContent = "🏆 As caixas de Time Booster são ganhas vencendo partidas em [Play]!";
    return;
  }
  const tb = timeBoostersState[slotIdx];
  if (!tb) return;
  if (tb.status === "empty") {
    if (msgEl) msgEl.textContent = `📦 Slot #${slotIdx + 1} está vazio! Vença uma partida em [Play] para ganhar um Time Booster.`;
    return;
  }
  const now = Date.now();
  const remSec = Math.max(0, Math.ceil((tb.endTs - now) / 1000));
  if (remSec === 0) {
    consumeAndUnboxTimeBooster(slotIdx);
    return;
  }
  inspectedBoosterSlotIdx = slotIdx;
  const mEl = document.getElementById("time-booster-modal");
  const tEl = document.getElementById("tbm-title");
  const imgEl = document.getElementById("tbm-img");
  const hintEl = document.getElementById("tbm-contents-hint");
  if (tEl) tEl.textContent = tb.name.toUpperCase();
  if (imgEl) imgEl.src = tb.kind === "purple" ? HOME_V380_UI_ASSETS.booster_purple : HOME_V380_UI_ASSETS.booster_silver;
  if (hintEl) {
    hintEl.textContent = tb.kind === "purple"
      ? "Baú Roxo (06:00:00): Desbloqueia 2 Pokémon (alta chance R/EX/UX) + Material + Moedas!"
      : "Baú Prateado (01:00:00): Desbloqueia 1 Pokémon + Material + Moedas!";
  }
  if (mEl) mEl.style.display = "flex";
  tickRealTimeBoosters();
};

// Make openEarnedVictoryBox and openVictoryBoxFromWinScreen NEVER open a box directly; instead navigate to Hub Time Boosters!
let lastAwardedBoosterSlot = 0;

openEarnedVictoryBox = function() {
  openDrawer("hub");
  switchDrawerTab("hub");
  tickRealTimeBoosters();
  const readyIdx = timeBoostersState.findIndex((x, i) => i < 3 && x.status !== "empty" && Math.max(0, Math.ceil((x.endTs - Date.now()) / 1000)) === 0);
  if (readyIdx !== -1) {
    consumeAndUnboxTimeBooster(readyIdx);
    return;
  }
  const activeIdx = timeBoostersState.findIndex((x, i) => i < 3 && x.status !== "empty");
  if (activeIdx !== -1) {
    handleTimeBoosterClick(activeIdx);
  } else {
    const msgEl = document.getElementById("chest-reward-msg");
    if (msgEl) msgEl.textContent = "📦 Seus 3 slots estão vazios! Vença uma partida em [Play] para ganhar um Time Booster.";
  }
};

openVictoryBoxFromWinScreen = function() {
  closeWinResultOverlay();
  openDrawer("hub");
  switchDrawerTab("hub");
  tickRealTimeBoosters();
  if (lastAwardedBoosterSlot >= 0 && lastAwardedBoosterSlot < 3 && timeBoostersState[lastAwardedBoosterSlot] && timeBoostersState[lastAwardedBoosterSlot].status !== "empty") {
    handleTimeBoosterClick(lastAwardedBoosterSlot);
  }
};

// Override showWinResultScreen so winning a match places a Time Booster in the Hub with full timer and NEVER shows "Abrir Caixa Agora"!
const _v480ShowWinResultScreen = showWinResultScreen;
showWinResultScreen = function(winner) {
  const didWin = (winner === getBottomRole());
  // Check empty slot BEFORE _v480ShowWinResultScreen runs so we know which slot received the new Time Booster
  const emptyBefore = timeBoostersState.findIndex((x, i) => i < 3 && x.status === "empty");
  _v480ShowWinResultScreen(winner);

  // Always zero out legacy victoryBoxesWon so no instant-open counter exists
  playerProgression.victoryBoxesWon = 0;
  saveProgressionState();

  const boxBadgeEl = document.getElementById("win-box-badge");
  const boxDescEl  = document.getElementById("win-box-desc");
  const boxBtnEl   = document.getElementById("win-open-box-btn");

  if (didWin) {
    if (emptyBefore !== -1) {
      lastAwardedBoosterSlot = emptyBefore;
      const tb = timeBoostersState[emptyBefore];
      const durStr = tb ? formatBoosterHMS(tb.totalSec) : "01:00:00";
      if (boxBadgeEl) {
        boxBadgeEl.textContent = `📦 +1 TIME BOOSTER NO SLOT #${emptyBefore + 1} (${durStr})`;
        boxBadgeEl.style.color = "#fde047";
      }
      if (boxDescEl) {
        boxDescEl.textContent = `Caixa enviada ao Slot #${emptyBefore + 1} do Hub! O cronômetro de ${durStr} já começou — aguarde o tempo zerar para abrir.`;
      }
      if (boxBtnEl) {
        boxBtnEl.style.display = "block";
        boxBtnEl.textContent = `⏱️ VER CRONÔMETRO NO HUB (${durStr})`;
      }
    } else {
      lastAwardedBoosterSlot = 0;
      if (boxBadgeEl) {
        boxBadgeEl.textContent = `⏳ SLOTS DE TIME BOOSTER OCUPADOS (3/3)`;
        boxBadgeEl.style.color = "#38bdf8";
      }
      if (boxDescEl) {
        boxDescEl.textContent = `Seus 3 slots de caixa no Hub já estão em contagem regressiva! Aguarde uma caixa terminar o tempo para liberar espaço.`;
      }
      if (boxBtnEl) {
        boxBtnEl.style.display = "block";
        boxBtnEl.textContent = `🏠 VOLTAR AO HUB (VER CRONÔMETROS)`;
      }
    }
  }
  renderHubAndCollection();
  renderShopExchange();
  tickRealTimeBoosters();
};

const _v490RenderShopExchange = renderShopExchange;
renderShopExchange = function() {
  _v490RenderShopExchange();
  tickRealTimeBoosters();
};

const _v490RenderHubAndCollection = renderHubAndCollection;
renderHubAndCollection = function() {
  _v490RenderHubAndCollection();
  tickRealTimeBoosters();
};

tickRealTimeBoosters();



// ============================================================================
// SECTION 17: v5.1.0 ENERGY BAR (110/110), STRICT 6-COST PLATE CASE,
// NO-REWARD TRAINING CENTER & INTERACTIVE NEW-ACCOUNT TUTORIAL (MATCH + HUB)
// ============================================================================

// --- 17.1: GREEN ENERGY BAR (`⚡ 110/110` STAMINA SYSTEM FOR CARMONTE QUESTS) ---
const ENERGY_STORAGE_KEY = "pdr_energy_stamina_v510";
const MAX_STAMINA_ENERGY = 110;
const STAMINA_REGEN_SEC  = 150; // +1 Energy every 2m30s (150 seconds), authentic Pokémon Duel rate

let playerStamina = {
  energy: 110,
  lastTimestamp: Date.now()
};

function loadStaminaState() {
  try {
    const raw = localStorage.getItem(ENERGY_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p.energy === "number") {
        playerStamina.energy = Math.max(0, Math.min(MAX_STAMINA_ENERGY, p.energy));
        playerStamina.lastTimestamp = p.lastTimestamp || Date.now();
      }
    }
  } catch (e) {}
}

function saveStaminaState() {
  try {
    localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify(playerStamina));
  } catch (e) {}
}

function tickStaminaEnergy() {
  const now = Date.now();
  if (playerStamina.energy < MAX_STAMINA_ENERGY) {
    const elapsedSec = Math.floor((now - playerStamina.lastTimestamp) / 1000);
    if (elapsedSec >= STAMINA_REGEN_SEC) {
      const gained = Math.floor(elapsedSec / STAMINA_REGEN_SEC);
      playerStamina.energy = Math.min(MAX_STAMINA_ENERGY, playerStamina.energy + gained);
      playerStamina.lastTimestamp = playerStamina.lastTimestamp + gained * STAMINA_REGEN_SEC * 1000;
      saveStaminaState();
    }
  } else {
    playerStamina.lastTimestamp = now;
  }

  const pct = Math.max(0, Math.min(100, (playerStamina.energy / MAX_STAMINA_ENERGY) * 100));
  const fillEl = document.getElementById("top-energy-fill");
  const lblEl  = document.getElementById("top-energy-lbl");
  if (fillEl) fillEl.style.width = `calc(${pct.toFixed(1)}% - 4px)`;
  if (lblEl)  lblEl.textContent = `⚡ ${playerStamina.energy}/${MAX_STAMINA_ENERGY}`;

  const modalVal = document.getElementById("energy-modal-val");
  const modalTimer = document.getElementById("energy-modal-timer");
  if (modalVal) modalVal.textContent = `⚡ ${playerStamina.energy} / ${MAX_STAMINA_ENERGY}`;
  if (modalTimer) {
    if (playerStamina.energy >= MAX_STAMINA_ENERGY) {
      modalTimer.textContent = "✅ Energia Cheia (110/110)!";
    } else {
      const rem = Math.max(1, STAMINA_REGEN_SEC - Math.floor((now - playerStamina.lastTimestamp) / 1000));
      const m = Math.floor(rem / 60);
      const s = rem % 60;
      modalTimer.textContent = `⏱️ +1⚡ em ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} (1⚡ a cada 2m30s)`;
    }
  }
}

loadStaminaState();
setInterval(tickStaminaEnergy, 1000);
setTimeout(tickStaminaEnergy, 80);

function ensureV510ModalsInjected() {
  if (document.getElementById("energy-info-modal")) return;

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
  <!-- 1. GREEN ENERGY BAR (110/110) EXPLANATION & REFILL MODAL -->
  <div id="energy-info-modal" style="display:none; position:fixed; inset:0; z-index:290; background:rgba(2,6,23,0.88); align-items:center; justify-content:center; padding:14px;">
    <div style="width:100%; max-width:340px; background:linear-gradient(180deg,#0f2942 0%,#061024 100%); border:2px solid #22c55e; border-radius:12px; padding:14px; color:#f8fafc; box-shadow:0 12px 35px rgba(0,0,0,0.95); text-align:center;">
      <div style="font-size:14px; font-weight:900; color:#4ade80; margin-bottom:4px;">⚡ BARRA DE ENERGIA (110/110)</div>
      <div style="font-size:10px; color:#bae6fd; margin-bottom:10px;">Sistema Oficial de Stamina do Pokémon Duel</div>
      <div style="background:#040d1e; border:1.5px solid #15803d; border-radius:9px; padding:10px; margin-bottom:10px;">
        <div id="energy-modal-val" style="font-size:22px; font-weight:900; color:#4ade80; margin-bottom:3px;">⚡ 110 / 110</div>
        <div id="energy-modal-timer" style="font-size:9.5px; color:#fde047; font-weight:800;">✅ Energia Cheia (110/110)!</div>
      </div>
      <div style="text-align:left; font-size:9.5px; color:#e2e8f0; line-height:1.45; background:rgba(15,23,42,0.8); border:1px solid #334155; border-radius:8px; padding:8px 10px; margin-bottom:10px;">
        • <strong>Para que serve a barra verde?</strong> Ela é a sua <strong>Energia de Campanha (Stamina)</strong>.<br>
        • <strong>Onde é gasta:</strong> Cada duelo nas <strong>🗺️ Quests (Hotéis de Carmonte Island)</strong> consome <strong>15⚡</strong>.<br>
        • <strong>Partidas Grátis de Energia:</strong> <em>League Match</em>, <em>Room Match P2P</em> e <em>Training Center</em> custam <strong>0⚡</strong>.<br>
        • <strong>Recarga Automática:</strong> Regenera <strong>+1⚡ a cada 2m30s</strong> até o máximo de <strong>110/110</strong>.
      </div>
      <div id="energy-modal-msg" style="font-size:9px; font-weight:800; color:#fde047; min-height:13px; margin-bottom:6px;"></div>
      <div style="display:flex; gap:6px;">
        <button class="btn green" style="flex:1; padding:8px; font-size:10px;" onclick="refillStaminaWithCoins()">🪙 Recarregar Tudo (1.500 Coins)</button>
        <button class="btn secondary" style="padding:8px 12px; font-size:10px;" onclick="document.getElementById('energy-info-modal').style.display='none';">Fechar</button>
      </div>
    </div>
  </div>

  <!-- 2. CARMONTE ISLAND QUESTS MODAL (CONSUMES 15 GREEN ENERGY) -->
  <div id="carmonte-quests-modal" style="display:none; position:fixed; inset:0; z-index:288; background:rgba(2,6,23,0.90); align-items:center; justify-content:center; padding:14px;">
    <div style="width:100%; max-width:350px; max-height:88vh; overflow-y:auto; background:linear-gradient(180deg,#1e1b4b 0%,#090d16 100%); border:2px solid #a855f7; border-radius:12px; padding:14px; color:#f8fafc; box-shadow:0 12px 35px rgba(0,0,0,0.95);">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(168,85,247,0.35); padding-bottom:8px; margin-bottom:8px;">
        <div>
          <div style="font-size:13px; font-weight:900; color:#e9d5ff;">🗺️ QUESTS — CARMONTE ISLAND</div>
          <div style="font-size:9px; color:#cbd5e1;">Cada missão consome <strong style="color:#4ade80;">⚡15 de Energia</strong> da barra verde · Recompensa: +1.500 🪙</div>
        </div>
        <button onclick="document.getElementById('carmonte-quests-modal').style.display='none';" style="background:#1e293b; border:1px solid #94a3b8; color:#fff; border-radius:5px; width:26px; height:26px; font-weight:900; cursor:pointer;">✕</button>
      </div>
      <div id="carmonte-quest-err" style="font-size:9.5px; color:#f87171; font-weight:800; min-height:13px; margin-bottom:6px; text-align:center;"></div>
      <div id="carmonte-hotels-modal-list" style="display:flex; flex-direction:column; gap:6px;"></div>
    </div>
  </div>

  <!-- 3. INTERACTIVE BOARD TUTORIAL COACH HUD (PHASE 1: 6-STEP PRESENTATION MATCH) -->
  <div id="tutorial-coach-hud" style="display:none !important; position:fixed; top:44px; left:50%; transform:translateX(-50%); width:95%; max-width:410px; z-index:260; background:linear-gradient(180deg,rgba(15,35,71,0.97) 0%,rgba(6,16,36,0.98) 100%); border:2px solid #facc15; border-radius:11px; padding:9px 11px; color:#f8fafc; box-shadow:0 8px 26px rgba(0,0,0,0.92);">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
      <span id="tut-step-badge" style="background:#facc15; color:#090d16; font-size:9px; font-weight:900; padding:2px 6px; border-radius:4px;">🎓 TUTORIAL · PASSO 1/6</span>
      <div style="display:flex; gap:5px;">
        <button onclick="startGuidedHubTour()" style="background:#0284c7; border:1px solid #7dd3fc; color:#fff; font-size:8.5px; font-weight:800; padding:2px 6px; border-radius:4px; cursor:pointer;">⏭️ Ir ao Tour do Hub</button>
        <button onclick="exitInteractiveTutorial()" style="background:#334155; border:1px solid #94a3b8; color:#fff; font-size:8.5px; font-weight:800; padding:2px 6px; border-radius:4px; cursor:pointer;">✕ Sair</button>
      </div>
    </div>
    <div id="tut-step-title" style="font-size:11.5px; font-weight:900; color:#fde047; margin-bottom:3px;">1. Entrada em Campo (Entry Points & MP)</div>
    <div id="tut-step-desc" style="font-size:9.5px; color:#e2e8f0; line-height:1.38; margin-bottom:7px;"></div>
    <button id="tut-action-btn" onclick="executeCurrentTutorialStepAction()" style="width:100%; padding:7px 10px; border-radius:7px; background:linear-gradient(180deg,#4ade80 0%,#16a34a 100%); border:1.5px solid #ffffff; color:#052e16; font-size:11px; font-weight:900; cursor:pointer; box-shadow:0 3px 10px rgba(0,0,0,0.5);">
      ▶️ Executar Passo 1/6 Agora
    </button>
  </div>

  <!-- 4. INTERACTIVE HUB SPOTLIGHT TOUR HUD (PHASE 2: 5-STEP HUB PRESENTATION) -->
  <div id="tutorial-hub-tour-hud" style="display:none !important; position:fixed; bottom:64px; left:50%; transform:translateX(-50%); width:95%; max-width:410px; z-index:285; background:linear-gradient(180deg,#0f2347 0%,#040b1a 100%); border:2.5px solid #38bdf8; border-radius:12px; padding:11px 12px; color:#f8fafc; box-shadow:0 10px 32px rgba(0,0,0,0.95);">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
      <span id="hub-tour-badge" style="background:#38bdf8; color:#04112e; font-size:9px; font-weight:900; padding:2px 7px; border-radius:4px;">🏛️ TOUR DO HUB · ETAPA 1/5</span>
      <button onclick="finishGuidedHubTour()" style="background:#334155; border:1px solid #94a3b8; color:#fff; font-size:8.5px; font-weight:800; padding:2px 6px; border-radius:4px; cursor:pointer;">✕ Fechar Tour</button>
    </div>
    <div id="hub-tour-title" style="font-size:12px; font-weight:900; color:#fde047; margin-bottom:4px;">Bem-vindo ao Hub Central do PokeDuel!</div>
    <div id="hub-tour-desc" style="font-size:9.5px; color:#e2e8f0; line-height:1.42; margin-bottom:9px;"></div>
    <div style="display:flex; gap:6px;">
      <button id="hub-tour-prev-btn" onclick="stepGuidedHubTour(-1)" style="padding:7px 10px; border-radius:6px; background:#1e293b; border:1px solid #64748b; color:#fff; font-size:10px; font-weight:800; cursor:pointer;">◀ Anterior</button>
      <button id="hub-tour-next-btn" onclick="stepGuidedHubTour(1)" style="flex:1; padding:7px 12px; border-radius:6px; background:linear-gradient(180deg,#fde047 0%,#ca8a04 100%); border:1.5px solid #fff; color:#090d16; font-size:11px; font-weight:900; cursor:pointer;">Próxima Etapa (2/5) ➔</button>
    </div>
  </div>
  `;
  document.body.appendChild(wrapper);
}
ensureV510ModalsInjected();

function openEnergyInfoModal() {
  ensureV510ModalsInjected();
  playSfx("tick");
  tickStaminaEnergy();
  const msg = document.getElementById("energy-modal-msg");
  if (msg) msg.textContent = "";
  const m = document.getElementById("energy-info-modal");
  if (m) m.style.display = "flex";
}

function refillStaminaWithCoins() {
  const msg = document.getElementById("energy-modal-msg");
  if (playerStamina.energy >= MAX_STAMINA_ENERGY) {
    playSfx("tick");
    if (msg) { msg.style.color = "#4ade80"; msg.textContent = "✅ Sua barra de Energia já está em 110/110!"; }
    return;
  }
  if (userCoins < 1500) {
    playSfx("hit");
    if (msg) { msg.style.color = "#f87171"; msg.textContent = `⚠️ Moedas insuficientes (${userCoins.toLocaleString("en-US")}/1,500 🪙)!`; }
    return;
  }
  userCoins -= 1500;
  playerStamina.energy = MAX_STAMINA_ENERGY;
  playerStamina.lastTimestamp = Date.now();
  saveStaminaState();
  saveEconomyAndUpgrades();
  syncAllCurrencyLabels();
  tickStaminaEnergy();
  playSfx("portal");
  if (msg) { msg.style.color = "#4ade80"; msg.textContent = "⚡ Energia recarregada para 110/110 com sucesso!"; }
}

function openCarmonteQuestsModal() {
  ensureV510ModalsInjected();
  playSfx("tick");
  tickStaminaEnergy();
  const qSt = getStoredQuestStars();
  const errEl = document.getElementById("carmonte-quest-err");
  if (errEl) errEl.textContent = "";
  const listEl = document.getElementById("carmonte-hotels-modal-list");
  if (listEl && typeof CARMONTE_HOTELS !== "undefined") {
    listEl.innerHTML = CARMONTE_HOTELS.map((h, idx) => {
      const stars = qSt[idx] || 0;
      const starStr = "★".repeat(stars) + "☆".repeat(3 - stars);
      return `
      <div style="background:rgba(15,23,42,0.92); border:1px solid #6366f1; border-radius:8px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
        <div>
          <div style="font-size:11px; font-weight:900; color:#fde047;">${h.name}</div>
          <div style="font-size:8.5px; color:#cbd5e1;">Chefe: <strong>${h.boss}</strong> · Deck: ${h.deck || 'Hotel Staff'}</div>
          <div style="font-size:8px; color:#94a3b8; margin-top:1px;">${h.desc || 'Desafios 3-Star disponíveis.'}</div>
          <div style="font-size:9.5px; color:#facc15; font-weight:900; margin-top:2px;">Estrelas: <span style="letter-spacing:1px; color:${stars===3?'#4ade80':'#facc15'};">${starStr} (${stars}/3)</span></div>
        </div>
        <button class="btn green" style="padding:6px 10px; font-size:10px; white-space:nowrap; font-weight:900;" onclick="startCarmonteQuestMatch(${idx})">⚡15 Jogar</button>
      </div>
    `;}).join("");
  }
  const m = document.getElementById("carmonte-quests-modal");
  if (m) m.style.display = "flex";
}


// --- 17.2: STRICT 6-COST PLATE CASE LIMIT WITH DUPLICATE DOUBLED COST (`MAX_PLATE_COST = 6`) ---
const EQUIPPED_PLATES_KEY = "pdr_equipped_plates_v510";
const MAX_DECK_PLATE_COST = 6;

const BASE_PLATE_CATALOG = (Array.isArray(state.plates) ? state.plates : []).map(p => ({
  ...p,
  baseCost: p.baseCost || p.cost || 1
}));

function getPlateCopyCost(baseCost, copyIndex1Based) {
  const b = Math.max(1, Number(baseCost) || 1);
  const k = Math.max(1, parseInt(copyIndex1Based, 10) || 1);
  return b * Math.pow(2, k - 1);
}

function getSavedEquippedPlateIds() {
  try {
    const raw = localStorage.getItem(EQUIPPED_PLATES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) {}
  // Default 6-cost starter loadout: Hurdle Jump (2) + Double Chance (1) + X Attack (1) + Goal Block (2) = 6/6 ◆
  return ["hurdle", "double", "xatk", "goalblock"];
}

function saveEquippedPlateIds(explicitIds) {
  try {
    const activeIds = Array.isArray(explicitIds)
      ? explicitIds
      : state.plates.filter(p => !p.disabledInDeck).map(p => p.id);
    localStorage.setItem(EQUIPPED_PLATES_KEY, JSON.stringify(activeIds));
  } catch (e) {}
}

function enforceStrict6CostPlates() {
  if (!BASE_PLATE_CATALOG || BASE_PLATE_CATALOG.length === 0) return;
  const prevUsedMap = {};
  if (Array.isArray(state.plates)) {
    state.plates.forEach(p => {
      if (!p.disabledInDeck && p.id) {
        const key = `${p.id}#${p.copyNumber || 1}`;
        prevUsedMap[key] = { used: Boolean(p.used), usedP1: Boolean(p.usedP1), usedP2: Boolean(p.usedP2) };
      }
    });
  }

  const savedIds = getSavedEquippedPlateIds();
  const countsById = {};
  let runningCost = 0;
  const activeInstances = [];

  savedIds.forEach(pid => {
    const baseP = BASE_PLATE_CATALOG.find(x => x.id === pid);
    if (!baseP) return;
    const copyNum = (countsById[pid] || 0) + 1;
    const copyCost = getPlateCopyCost(baseP.baseCost, copyNum);
    if (runningCost + copyCost <= MAX_DECK_PLATE_COST) {
      countsById[pid] = copyNum;
      runningCost += copyCost;
      const prev = prevUsedMap[`${pid}#${copyNum}`] || { used: false, usedP1: false, usedP2: false };
      activeInstances.push({
        ...baseP,
        baseCost: baseP.baseCost,
        cost: copyCost,
        copyNumber: copyNum,
        disabledInDeck: false,
        used: prev.used,
        usedP1: prev.usedP1,
        usedP2: prev.usedP2
      });
    }
  });

  activeInstances.forEach(inst => {
    inst.totalCopiesEquipped = countsById[inst.id] || 1;
  });

  const disabledPlaceholders = [];
  BASE_PLATE_CATALOG.forEach(baseP => {
    if (!countsById[baseP.id]) {
      disabledPlaceholders.push({
        ...baseP,
        baseCost: baseP.baseCost,
        cost: baseP.baseCost,
        copyNumber: 0,
        totalCopiesEquipped: 0,
        disabledInDeck: true,
        used: false,
        usedP1: false,
        usedP2: false
      });
    }
  });

  state.plates = [...activeInstances, ...disabledPlaceholders];
  saveEquippedPlateIds(activeInstances.map(p => p.id));
}

function getEquippedPlateCopiesInfo(plateId) {
  const activeMatching = (state.plates || []).filter(p => !p.disabledInDeck && p.id === plateId);
  const count = activeMatching.length;
  const totalCost = activeMatching.reduce((s, p) => s + (p.cost || 0), 0);
  const baseP = BASE_PLATE_CATALOG.find(x => x.id === plateId);
  const baseCost = baseP ? baseP.baseCost : 1;
  const nextCopyCost = getPlateCopyCost(baseCost, count + 1);
  return { count, totalCost, baseCost, nextCopyCost, basePlate: baseP };
}

function ensurePlateWarningBanner() {
  let msgEl = document.getElementById("plate-limit-warning");
  if (!msgEl) {
    const pSel = document.getElementById("deck-plates-selector");
    if (pSel && pSel.parentNode) {
      msgEl = document.createElement("div");
      msgEl.id = "plate-limit-warning";
      msgEl.style.cssText = "font-size:8.8px; font-weight:800; margin-top:5px; min-height:14px; color:#fde047;";
      pSel.parentNode.appendChild(msgEl);
    }
  }
  return msgEl;
}

function addPlateCopyToDeck(plateId) {
  enforceStrict6CostPlates();
  const info = getEquippedPlateCopiesInfo(plateId);
  if (!info.basePlate) return;
  const msgEl = ensurePlateWarningBanner();
  const usedCost = state.plates.filter(x => !x.disabledInDeck).reduce((s, x) => s + x.cost, 0);

  if (usedCost + info.nextCopyCost > MAX_DECK_PLATE_COST) {
    playSfx("hit");
    if (msgEl) {
      msgEl.style.color = "#f87171";
      msgEl.textContent = info.count > 0
        ? `⚠️ A ${info.count + 1}ª cópia de [${info.basePlate.name}] tem custo dobrado (${info.nextCopyCost}◆) e você já usa ${usedCost}/6 ◆! Remova outra Plate primeiro.`
        : `⚠️ Limite 6/6 ◆ atingido! Você usa ${usedCost}/6 ◆ e [${info.basePlate.name}] custa ${info.nextCopyCost}◆.`;
    }
    return;
  }

  const nextIds = state.plates.filter(x => !x.disabledInDeck).map(x => x.id);
  nextIds.push(plateId);
  saveEquippedPlateIds(nextIds);
  enforceStrict6CostPlates();
  playSfx("portal");

  if (msgEl) {
    const newUsed = state.plates.filter(x => !x.disabledInDeck).reduce((s, x) => s + x.cost, 0);
    msgEl.style.color = "#4ade80";
    msgEl.textContent = info.count > 0
      ? `✅ ${info.count + 1}ª cópia de [${info.basePlate.name}] equipada com custo dobrado (${info.nextCopyCost}◆)! Total: ${newUsed}/6 ◆.`
      : `✅ [${info.basePlate.name} (${info.nextCopyCost}◆)] equipada no Deck! Total: ${newUsed}/6 ◆.`;
  }
  renderHubAndCollection();
  renderPlatesTray();
}

function removePlateCopyFromDeck(plateId) {
  enforceStrict6CostPlates();
  const nextIds = state.plates.filter(x => !x.disabledInDeck).map(x => x.id);
  const lastPos = nextIds.lastIndexOf(plateId);
  if (lastPos === -1) return;
  const baseP = BASE_PLATE_CATALOG.find(x => x.id === plateId);
  nextIds.splice(lastPos, 1);
  saveEquippedPlateIds(nextIds);
  enforceStrict6CostPlates();
  playSfx("tick");

  const msgEl = ensurePlateWarningBanner();
  if (msgEl && baseP) {
    const newUsed = state.plates.filter(x => !x.disabledInDeck).reduce((s, x) => s + x.cost, 0);
    const remCount = nextIds.filter(id => id === plateId).length;
    msgEl.style.color = "#94a3b8";
    msgEl.textContent = `➖ 1x [${baseP.name}] removida (${remCount}x no Deck). Custo atual: ${newUsed}/${MAX_DECK_PLATE_COST} ◆.`;
  }
  renderHubAndCollection();
  renderPlatesTray();
}

function clearAllDeckPlates() {
  saveEquippedPlateIds([]);
  enforceStrict6CostPlates();
  playSfx("tick");
  const msgEl = ensurePlateWarningBanner();
  if (msgEl) {
    msgEl.style.color = "#38bdf8";
    msgEl.textContent = "🔄 Todas as Plates foram desequipadas (0/6 ◆). Escolha suas Plates (cópias repetidas dobram de custo)!";
  }
  renderHubAndCollection();
  renderPlatesTray();
}

window.addPlateCopyToDeck = addPlateCopyToDeck;
window.removePlateCopyFromDeck = removePlateCopyFromDeck;
window.clearAllDeckPlates = clearAllDeckPlates;

enforceStrict6CostPlates();

// Ensure demoFullMatchState preserves the 6-cost Plate loadout, resets `used = false`, and cleans any stuck tutorial/anim locks
const _v500DemoFullMatchState = demoFullMatchState;
demoFullMatchState = function() {
  _v500DemoFullMatchState();
  enforceStrict6CostPlates();
  state.plates.forEach(p => {
    p.used = false;
    p.usedP1 = false;
    p.usedP2 = false;
  });
  state.isAnimating = false;
  activePieceAnim = null;
  state.preMatchAnim = null;
  state.winCelebrationAnim = null;
  state.selectedUnitId = null;
  state.reachableNodes = [];
  state.reachablePaths = {};
  state.attackTargets = [];
  state.postMoveAttackMode = false;
  state.pendingPostMoveTurn = null;

  if (state.mode === "p2p" || state.gameMode === "p2p") {
    state.matchKind = "p2p";
    state.mode = "p2p";
    state.gameMode = "p2p";
    tutorialStepBusy = false;
    currentTutorialStep = 0;
    hideTutorialCoachHud();
  } else if (state.mode === "pass" || state.gameMode === "pass") {
    state.matchKind = "pass";
    state.mode = "pass";
    state.gameMode = "pass";
    tutorialStepBusy = false;
    currentTutorialStep = 0;
    hideTutorialCoachHud();
  }

  renderPlatesTray();
};

// Override togglePlateInDeck so clicking a plate adds a copy (with doubled cost for duplicates) or removes if budget full!
togglePlateInDeck = function(plateIdOrIdx) {
  let plateId = plateIdOrIdx;
  if (typeof plateIdOrIdx === "number") {
    const baseP = BASE_PLATE_CATALOG[plateIdOrIdx] || (state.plates && state.plates[plateIdOrIdx]);
    if (!baseP) return;
    plateId = baseP.id;
  }
  if (!plateId) return;
  enforceStrict6CostPlates();
  const info = getEquippedPlateCopiesInfo(plateId);
  const usedCost = state.plates.filter(x => !x.disabledInDeck).reduce((s, x) => s + x.cost, 0);
  if (usedCost + info.nextCopyCost <= MAX_DECK_PLATE_COST) {
    addPlateCopyToDeck(plateId);
  } else if (info.count > 0) {
    removePlateCopyFromDeck(plateId);
  } else {
    addPlateCopyToDeck(plateId);
  }
};

// Upgrade Plate Case UI in renderHubAndCollection so unavailable plates over the remaining budget look clearly locked
function refreshStrictPlateCaseUI() {
  const pSel = document.getElementById("deck-plates-selector");
  const pBar = document.getElementById("plate-cost-bar");
  if (!pSel || !state.plates) return;
  const activePlates = state.plates.filter(p => !p.disabledInDeck);
  const usedCost = activePlates.reduce((a, p) => a + p.cost, 0);
  const remBudget = Math.max(0, MAX_DECK_PLATE_COST - usedCost);

  if (pBar) {
    pBar.textContent = `COST ${usedCost}/6 ` + "◆".repeat(Math.min(6, usedCost)) + "◇".repeat(remBudget);
    pBar.style.color = usedCost === 6 ? "#4ade80" : "#fde047";
  }

  pSel.innerHTML = state.plates.map((p, pIdx) => {
    const active = !p.disabledInDeck;
    const exceeds = !active && (p.cost > remBudget);
    const bg = active ? "linear-gradient(180deg,#0284c7,#0369a1)" : (exceeds ? "#090d16" : "#0f172a");
    const brd = active ? "#bae6fd" : (exceeds ? "#334155" : "#64748b");
    const col = active ? "#ffffff" : (exceeds ? "#64748b" : "#cbd5e1");
    return `<button onclick="togglePlateInDeck(${pIdx})" style="background:${bg}; border:1.5px solid ${brd}; color:${col}; opacity:${exceeds ? '0.52' : '1.0'}; border-radius:5px; padding:3px 7px; font-size:8.5px; font-weight:900; cursor:pointer;">
      ${active ? '✓ ' : (exceeds ? '🔒 ' : '+ ')}${p.name} [${p.cost}◆]
    </button>`;
  }).join("");
}

const _v500RenderHubAndCollection = renderHubAndCollection;
renderHubAndCollection = function() {
  enforceStrict6CostPlates();
  _v500RenderHubAndCollection();
  refreshStrictPlateCaseUI();
};

// Override renderPlatesTray so ONLY equipped plates (`!p.disabledInDeck`, max 6 cost) appear in the match!
renderPlatesTray = function() {
  if (typeof syncActivePlayerPlates === "function") syncActivePlayerPlates();
  const grid = document.getElementById("plates-grid");
  if (!grid) return;
  grid.innerHTML = "";
  const equipped = state.plates.map((p, idx) => ({ p, idx })).filter(item => !item.p.disabledInDeck);
  if (equipped.length === 0) return;

  if (typeof state.selectedPlateIdx !== "number" || !state.plates[state.selectedPlateIdx] || state.plates[state.selectedPlateIdx].disabledInDeck) {
    state.selectedPlateIdx = equipped[0].idx;
  }
  const selIdx = state.selectedPlateIdx;
  const curP = state.plates[selIdx] || equipped[0].p;

  const cCost = document.getElementById("pcard-cost");
  const cRar  = document.getElementById("pcard-rarity");
  const cBdg  = document.getElementById("pcard-badge");
  const cName = document.getElementById("pcard-name");
  const cDesc = document.getElementById("pcard-desc");
  const uBtn  = document.getElementById("plate-use-btn");
  if (cCost) cCost.textContent = "COST " + "◆".repeat(curP.cost);
  if (cRar)  cRar.textContent = curP.rarity || "C";
  if (cBdg)  cBdg.textContent = curP.badge || "+20";
  if (cName) cName.textContent = curP.name;
  if (cDesc) {
    cDesc.innerHTML = curP.sub || "";
  }
  if (uBtn)  uBtn.style.opacity = curP.used ? "0.4" : "1.0";

  equipped.forEach(({ p, idx }) => {
    const div = document.createElement("div");
    div.className = `plate-card ${p.used ? "used" : ""} ${selIdx === idx ? "active" : ""}`;
    div.style.minWidth = "78px";
    div.style.textAlign = "center";
    div.innerHTML = `
      <span class="p-cost">${p.cost}◆ · ${p.rarity || "C"}</span>
      <div style="font-size:12px; font-weight:900; color:#f97316; margin:2px 0;">${p.badge || "+20"}</div>
      <div class="p-title" style="font-size:8.5px;">${p.name}</div>
    `;
    div.onclick = () => {
      state.selectedPlateIdx = idx;
      playSfx("tick");
      renderPlatesTray();
    };
    grid.appendChild(div);
  });
};


// --- 17.3: MATCH MODES: LEAGUE vs QUEST (15⚡) vs TRAINING (0 REWARDS, 0 ELO) vs TUTORIAL ---
state.matchKind = "league";

function hideTutorialCoachHud() {
  const hud = document.getElementById("tutorial-coach-hud");
  if (hud) hud.style.display = "none";
}




// SECTION 19: v5.4.0 DECK TAB OVERHAUL (3x2 FULL-FIT 6-POKEMON SHOWCASE,
// NANO BANANA 3D TACTICAL PLATE CARDS & ORGANIZED FIGURE CASE WITH SORT/ROLE/VIEW)
// ============================================================================
const BANANA_PLATE_SPRITES = {"hurdle": "data:image/png;base64,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", "double": "data:image/png;base64,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", "xatk": "data:image/png;base64,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", "xspeed": "data:image/png;base64,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", "revive": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHAAAABwCAYAAADG4PRLAABhGElEQVR42sX9d3TdV3bniX7OOb9wc0AGCBIECeYsUlQOpVylkqpUOZftdlfZfu22xzPd0/G1evot97SXp/1mXo/HXc5lu2yXK0uVpCrlTFLMOYIgcroXN/7ieX/8LoALEKRUfrPWoxZFAsT9hbPP3meH7/5uEcv2axZ+CbTWCMH/Db80aAFi8cvownqFn9SAQABaRx/RS3506WfE/APq6LMakCK6glAaKaNrCCFBaMIQtI5+TgfRPZa+6+ILR99beQEEonG3xuvw//9fcvHBo8d6v8JbfEm95BUXrydAiOi6OpKd1jr6/vJraTH/ANFnG5KMbqHf++l1JCwR3RIpBKaUmEpgSoGhoh+VCKQUC88e/SmWvM/8n1ovu6/WC8KLnvmGK3OTteKGm2Olz0brdXM5GIsX/gX1a+HKomk/RjeMFlIg9KIm3Wxna9kQ4kpaTNi8z1b4CYEQGiECpBRIAUoKDBX9HQEyFAgEQaAJ51dfR5tsXgGXC6z5WbXWDfuwuNnlDbeWXvj8/DWbr33dxqDZ1Fz/DDcToBAiWpn3kvL70MeVX0U0duq8amhNYwmX7jDd9PgCxMKLz6uZaH7qxtciEoAAKUFKRpQQGEphq0jrTANsJTElGJJIqFIjZXhISL1swfTNrU3TOgvR2Jjva4O/j6OGlYQq3lOxtNYYi2bzxqp/o9250kMu3nBRG5vfXDQ9rJTzu7TxsIRND99krkSTKWkckgsGrXETJWSPkgJlCAypMVT0dzH/fkIgQggDSYjuFuH8U4ZN2iVuKMyFs7nxJ+JGJ6GOzt73KczFNeI9N9NKVsxY/gDNqn+jm7/f3bX0XotCEXrebDXvtnCZWWbpebqwU5u3/6KNFlJhKFAqRBoSJQWmKRq3VIRCo32QkTns0aFGB5qlW6pJmAv2f+m7iPe0PEs3t3iPs+lGynMjS7BcPvJGwmn+QfGPcks1yx2k+TNLX+f6NAQjBKJxuizdI/PPIRe81kgTFs2MkqCUwDIUlhJYlsYyBYYhkAoMKVASDCExkA2vVS+xYgIIdWMj6YW7LnnYlZ7rZht8ZQW4+dFzs19hGK7sxPyiWviLODuLu0wAAQi5xEou6p1csE9C66YNJK8Xt4y8zTCMzEokQDAMgWmAaUhsQ6C1ROODhhCJ1iFagy8FmhC57F0FomEdGmGNWOqZX29VlizvkvNrpbVcOEM1DefrF/NBVjChNxfeLy4ssaIZXbimkIRaN15TLHhaGt04Y26s9fOx3EIMJyVSChAhQkRCM6XANgSmEWmgRhAiCcMQQ2iCEJQWqDDaAEu8PT1vlgRa6Ou8z5Xf63qB3sgDvfk6N5+n4gYe6fXfM97LhC4Xyi8iYK1p2mFicfc2C61x/XmHZOG+jcB86b3mQ+noWpYFfhB912gIzTDAMMC0FLYRaZ0fhBhGpFWhIdE6QAWL66T1okYs2AIBoRYrLubiu4kbxMH6fR0xNz6Z9HXrfSNfRP6ibvDNhLdUa8SCliHEsh0rmh3lyFxpsfgJIZveQSxxZISUjVgvYO2qDKmYQEqwjEboYIJlSGIKzPnz0BCRdpoC2wBLSRQS2bAAUZSzuEhSgTRE46wNb+ggXr8W0deh/seEZuKm6621XnFjyOWfX56RuLEDI5ZmzfSNN9NST2/hmwvx1XzgP+88LNxXN3nrRGeXDgOkgursVXHn3g7a8iFS6RHDkNiGwpKNM9BU2IYibips2yBuG5GQDY1hgmEYUSAsZZTFWViwECU1piGvM5ECwXzSKJyPJ5qtU5MJFOLGPopuWq+VtOv6Y0g0/Z7XXrEYyDc/6XvZ7hU9KnGDNKeAEE0YhgsPKqVAKYmSsrGAYjEfKgRh9ImmeA+EjLQskqhG4Dx95+0b9G/9s0/y0Q9uJ2m6o6apMEyBZUosQ2IZAtuEeEyQtCUxA+KWxDJlI9wAoVjQPoRYMIm2JUnG1WKWJtRNZn0+XSeZ95mlFAgpGqd4I+2m58OQ67Mp83mNZuHcWOua/1yax9VaIyPNFA0T9Yu7tQsepl45+TsvCAFIGS2eJUJsQ2ObIbYEJXUj4F50auY/qtFI1dCUhkdamRn+j3t2bWTjztvZt3cbmZTYayqwLYltGsQsg3RMko0rcgmDTEySsBS2KbHMKNSIwgqJUAsmAC0jByuXNuhsiSFEENkOsTTnioiS54bU2AbEDIElNaZqdoxk01mn39NU3uj8u/nPaKRAg1y0Ve835luaaNVLKgQ0/i1EI6RY2LWG0sQMSMcVScP5Wsr0v5awBTEjyl3Om1uBQIfhglUQ0YM2tFyTalmrv/ujt575xp/+CV/7s2eoOCa2KbFNScwWpGKSfFKRtz3ylks+IUnFJJYJdiO8sEyJpQSB56DUvPELQQd0tsXY0N+CwH9iPvktROPJRKRxptIkLEHS0thUn8jEBDFTYEpQ82lDHS7kB+fXSzeZ5es89PcdGy4qW5TC14tprJWTrTfRvvkHbOxUrQM0QWMxGoUioVFCYylNMiZIKJc7dvV9Ze/m7q8kDZe4LbAaCejFnScbmhtpn1IKIWQj5lbUvQTf/sFbjEz4GEYMw9TEbUE6AW0pSdZ02bWzn1v3bSVrOLSkDJK2Im5J7JjEMDTpZMj9d/WRSoRICYYAU4U96/ry7N7WhWUEzypDIZVESokUkaUwpSZhQcrW9LRIHrprwzO5mEfaBssAqXRT2UkvOe/Q4RKHbtGb/UXCtUVTKpf6M3qJp8gNo6BF50KzqHG6Wd6y4VU2zKGUjJgGpGOKtKrwpS8+zgfu2kbGqJFJKGwrypjIhssj1GKcZ1oSwxQIQyCFQusQIcwnLgyVqdQ0MRPiSpC0JG1pk/Z0wJrePB/+8m/z+C//JuvXddEWD2hNGcRtQcIS2KYglzb4+EfuIWZFiQHTkqQTumftmhw7d6wiGw+G45bCUHohpypEZCqTtiRrh6zrsfmt3/oUfW2SjB1im/OmtGn1tF7mlS87D9+fQ7pEc+fNsryRexztnMZhHC5WDRZMp2gOOZtTKhJQ85JdCKMMJXssJUnb0NeRZN9tu9i1ZzOtSUEmJrANjSlChAgaDxbFdKYJbfkYibiJ0RCokFGZo1bzEIBtCuIxST4l6cgoWrMmj37mq2S7dyHjisc++zk6W206kppcQhKzIRlX1B3N7/6Xb1CuhBgqWvzWTHBw5/Ze9t+xk01rYz2mrD1jWRJphGgRYEiNpSBmQtby2DzQye479rFtUxdpwyNhRTVI0XTMNGUSF0zo0kzXCrXwFdJtS0qwer6spZtjrUWVFlosFC21bHaV5YLqaaGbKpu6kdtfrAEKGZ0FkqicEzMhLgP617TT0p5g2y1bWd2TI2X4JGywDTCUHhFSI5XCUgrbhg1rU+QzCtNSyEbOUwmBJMQyJbYlSCUE7RmTrOmx7wOPs3bXowRhFad0lq6BNu7+8BO0JEI6MwapmMI2BVIpEDaWIWhJCdb3hHzqye088PCDtPZs4Hd+52PcvSf5xKo2TcIMDxlSHzKVHrFNTcKGjOVzy75dKLuVDZv6SBg+cUNiKlBCj2jCRqlLgwijja41Yt5sao0O9XsUAvTKtcP542XBFs4XYcXixaM7Lf28bkr5RJX0BfHPe/kLAbJuXEMsFFo1tvTp6s5jmDXaV7ex+5ZtxIVDOiaxLYllGD2GAilDTFthG3UeuHuArlaBqQJMU2IIsBQYKnJIUnFJW8ogbTkMbN/Jvkc+h+9PIwkxdZ3q2JvsuHs/u++6lxY7oDVpkLIVttJYRkg2bbBlIM+vfuEe/qd/+avkO/rxfYNHn/oc/+pffYE79q4ml7H2mobaa5uiJ2FCytR0tCe45c7bAJ/e1T3EpI9haKTQUW5WNmuFXsyzzn97Ydsv827eJ0xFsDwTM5+F12GUC2xkFRY9S42QYcP+zpuHRvzTKL3IhmczvxGkkAihR+b/LmVAJp9C6wLoce588F7SMUiZELc0lqkxpcRQCkvWueuWHr7wpS/y1IdvozOvsW3REHQU08VtQXtK0RL36ers4O6P/QpCuRDWQcbQgUTUJnGmDnP3k0/Sv3EDOcsjlzRIxUxsQ6I1XB4q8Od/+xq///t/yuzEFQzD4Dtf/yv+xb/8Gs+/epFiyUfJ6N7JmIEdVrjl1h2sWt8FTJPK5ZBKYogoZl2SNlx2bi2kDWmul4YIuTTIv3lGLPrU0jNQNGdMIjMql+UhpQQhdXQzGTYO9+jmUtLQuIY2AypS9R4pNIaMbpiIJxDUqM8eZef+jWzbPkDW9MjGFQlTYBlgmwaG8Hns4dvo6NnIY4/ey/q1OQxCYpYkHlMkbEE+qejKSlqSivs//nnSrXFc5xpK2ZHHpwUygKB4Ce1c4MFPfZL2tiy5mE8mJbBjCkMp/EAxVbT50XNnePHnLzA5fIo/+8sfcnlMUXPjhEJhKYgbgoyl6cgbPPbUY4T+IDCMFIuprgWHR4JUIVI1vm4kDpRoyggQaaw0Gmu3UAzX18EqdEPo88qiF3z1JlzIouZEF2xguRCyOd02H0SKBYhD5FgselWCILL9cjHzIGVUFfAcD6lMfG8MIzbDhz7+IVpT0JlUZOOSuC1RIkSYSf7s6z/k3Te+z//+//kzzl6cwTKjlFgiLsnGJd15k3zM574PPcXqrRtwqgcxVEiTbSdwXSwF9fFDZNNzPPqZT5KJa9ozikxCELOjEEYjKVVNTp8d5M3X32BkKsDTFlqDpRQJW5FPRF70Q4/fx9pb+qkVTgIO1VIJHWi0DiKvO7JGIwK5ALgCjVSACBsJ/SgGF0o/A+EzQszH5HpJFNCctaFJ9kLcBC0UOSNiMa+n5s+y6OCU8/nDxv90MF8t0o06l0BI2Ug7ResZ+JpAK6an5whdjSk03txJdt27kTvv30dLrE5XziCTUFimQAiDkSnNt771Q86cm8ILYkgRmdF0XNKZM2mLuey57U52P/IIXvkQOHNIYaO1uxCLCt8nLFcwaiXmTj7PwPosDz35CDmrTmdWkYlH5hgd4gSSoaFpzpweYXYuIAyj54+bmnwC2pMeWzd28ZEvfQa/eArhFUArJsan8LQg0CE61COhED3zCDkpGJlPUCA0WoZRCUyFSBl+TQrRYwjRIxEjUWlMLyAUtFjqlepmSJwGI1JL3ZTHW+qozGtshL3UC9omABFGKbiwkQSI/gsPSSG6o2uGPSIKKgDwtI8vDIaujVOcKpFJmjjla6j4JZ788seZvDaMujKNq01CQupBiFYWbx0eo1IJCXVUsE3EBK0pk46UZmDDAA9++ot47mX8+ijKXgMihg48hPYJHBccn6BeQxqKcHKKyfIPuOvejzA6NMSbrx3DCy1qnsYLAqQ0GR4tEwQKL1DPCBk8YRmQTSi6s9CVDPnUP/ky6TZB6cIp7JiJdgKGBq8SYuD7EIaiRyBQQvRoNKEWPULKhkA0UkMoNEoIlDS+Mm/cdKPeDSCUWMCwiuZwTYslyFS5ADZqqiUueqPzJlE0AuxIAw0ZfXD+LFQCUGEDRyL3NtS9xxRRTKSkiISvNUiDmYkprpwbRaossu5TGz1LS7fFJ3/j11jbnaYvBx0ZRdJWGFIxW/RxXI0hNLapycQUrUnoaE3z+Jd/DSstIHAxEgMoax1axwEbISxCM4VX9wlKdbxClaAWEo6NMXnkJZ749EfYuKGL9rhPPqmwLYUUgpkZh+HRMlLIHtPQZOOK7pSkza7x4U8+yc4P7KM69BamHyDNLDPjDqOXRxCGDUIipB4xZDiiGqiBJkdlhDAShoJDSjBiCLFwJgqhR2QDZym0XCKT+bBh8dSK/q6MWP5p0YT+WikNoHW0W6J8psCUqmEiRRRIRtJsQkRTEkqklZBINFHsJNIxGRI3AjJWlDfcdesOvNlRwpKD51To2HwLPb1bGTp1CBG6hELh6RCpFIYhURISNnRmDbqzgk/8yq+xdtsAbuUCyjDwfYlhrSckhWGmcGaPEQZT4IMzdAnpa3QoMQNFba4Ats2mOz7A+XcPUa15VD2BF8xXoUN8L+jJJhRdGUFnvMrjH3mYJ77yS9Qm3kIWrhJ6PnbXVg69fomDLx+l6AiqNR+kSvshJT8kvVhxAK1JI0BqfchQots0VE9UsWk4kIJ0qCPvJwwXHcEl/uZ89aehscqM5Z9ehLYtryiLJZk2KcJDhgQpZXr+5xdTRqJRUdcjIHoE87tPYxkybauANZ1J1q/K4NWqmEGZgV27Sccl7vg4ulpFJELaN+xj1eoBRs8cIvDraGEg5XyZSJOLG7QnfT781OPc9th9OMW3sWQZrzaNUHmUtR6pkviVU9Qv/j3OyAms1gHCQFAZHsROZHAqdVpaW5m6eon2vjXkV63l9JHj1H1F3YOYKaNEtQmrsgbtsSpPfOxRPvrVf4Ize4Tg6ruIao1A2ejURn76188wOjpDMp+mu6eD8bEigTDTfhCFWLrhsESlYT1iCLnJNFVaKhYUYV7bAj1/NOllobtexKc2SUcZdv7pBXe1qUp+PYBOgBA90lDp+aSzlE2lWqEbEFyRBj0ipUxLIrCRaUDM0HTn4F/9u3/GxOgg3sw4phRsvP1uKuNX0KUaYVjHyCna+jazeu0A01dOIdwqlmVGkAkFKTNg9/Z1fObXv4pTPY30LiGCCtrzUYmdSGs1Yf0CtcHvYlXHEOUqE2cvozo3owwT7VQIHIEpBCL0GRkZZNvDjzM8eI3BKyNoaZJNKFpSirZEwKq0z5Of/igf/KXPEzgXqJ19BVWsUK9WyWzZz5G3znP8xTfxDPjNf/fPGb02zNnzw3jCwvNDao7zVd/3vqYM43NoUIKSacq0IeW84WpEE1E5IQhhHnjWXBS+UcJbIhb7Fm6EFJ7/cBBGleiwEZRKEYUSsnEOKinRC2ofjjTnSC3DolwsUaqV+K3//O9ZvbmfwcOHOHv4LPnNd+GFAd7YJO7IKbz6Ufp2ruGLv/Pb3LpnLf15n74Wg/a0QcIWpDM22i8gRAwj0U/g+QQijrJXob0R3MmfYboz1KoB9Sq4sxUOfv/H1NL9GGu3EwDTY1O4yRY6d91GdW6MuE2UDE8qunIGPWmPrWvTfPE3f50HP/9pfO8y/swJjFIBpzBDfFUfsyWDd5/5EfGE5Nf/7W+wcedmLp89TyJmg9YEQX3fzs2t/33LQMszvu88IYQeMZTqsQy5gBQ3RJTPlLKRFgvnKzjifWBnmsIIsfDFTcpHiCh3F0aOiWpUyg2lo69V5OAIIXrmPd2w4Vj5OkAIxbuvv0mmtYXP/6vfZu0tt/DW977DVDEgt2UPXnUOb3QUGU7i1t6ldU2cT/3Wb3PfQ/fQlxeszita0yZetYxbmaR6/lXcQh2Z2oK2NoDw8KpvYtglZDaJnc+iMglkMo6Bz5kXfo7O9EJvP8Gq1WQ3bWfs4EvUho5Tq5TJJU268pKuZJ3duzbwpX/xH9h2773UykchHMZwqziFAiKTRbav57k/+xuUqfjk//TrbL7jLo68fYjCdBktLUIkU5Njh+6/dye7dq6lMjv6rGmIHtsEU0T5XKkW11GJEEEwEga6Ef2EN8SPNsNdlBGLTOhSrL+8YSouDDWGFNgqqo9J2fCiGik10YD4SWRaE2VnTCkwlSAZU9hBib137CHTLhnYsw3fFbzz4x+zZvceUilFdWQQKxVDxeq4tVHMZCvrb3mYTDbP3NglLO1iG4Ite3cQL52lfukwnk6S7NmL7w8i9VUMIypnKSUIw4DQ9zCUQcLwmR29TOftD4Jpc+UnP8aqTpDeso0Th4fQrkcuGXLvI4/w6Jd+g3SrxC0dQqkyJpriqTME0ia1+VZ+9DffR0qTJ3/71+nsz6Ox+O7Xn+HUqSHmAouyq4kn80//5CeviMNHzv/Hlva+YcuQacsUkecul6IZAjQ1LzwX+KIncnrk+0JtLwhwCdBoJWhEUwFQCDCVwDDkgqckGtkaKcCU86BVPSLRJSlF2lSShG1g+CU62rIM7NpAbe4oa3dtIdu2ilPvHKJtbT+G9HEmxoglLKQM8eozaGHQtf4eVq/fSHHkIrpWYu22jSRFkXByGN+pYnUPINQUwp9Auy5BxaM8PUdppkx1zqFScVBSoIMKVksb5194GX9qlsyqFszuTs68e56YKXnoU59l/+MfQejLeHPvIihhxpJULl7GK3vYa7byxosHaOvt46EvP4UZm0ELk6vnSnz9j/6eWcem4IAfSmzTo701+bSKZXuUEumEbfQoGSHeQEe4OBkB+h0vpO7oHlANnJB+XwBf2Syk+erCcmjFfLZcNCB/ng9u5PtGcHVDopTElBFMwZgHFlmqRynI5dNIQ1F1AmqBxevP/5zieAXTtClc/BFrBzT3PvUoU7M1gvwqtJ2nMlRCFzyMeomgcAS39A7tff088LlfI55MUCpMg4wCZ2+uhF+ZIHRLiHKByugkUxdHmbpSYG7cpTzt4VQ1ThUCR4JbQ2pBaJjomEnoVAlrZe7/xOfYcd8H8Euv4Y+/DKVhDBnizU5QL82hetczOFFl5/0PcNvj+6iPvYFTGELJVr77F99kasah7ElCrajVKl99/LGd/Mkf/Q9k4+5XEjFjr2lFwosC+KiALQQEOqTuBc+EjdJSGOob4ksXG4vCpSb0Op1rgrKthMUIwwDTklimapiDKPfSSB0hpUbgQlh6yXXcssbqEVJgm4qwNkfo1Nh1712Ec1conDmEcsq0rV5LaGdJrxnAq/o4U9PEpELh4XtThFRItW/ErdapzV6mq92mPjZGrVjD7OzBVDXmLp1nbrhCcbxCaaLG9PAMM7Mh01MO5ak5VKhpW9PF5OAoQbVCe38bFdcHq4c7P/UlvLkXCUYOw8wcpmGgdYjnhMQ6BwjirXS2txF3JqicO4Bbr5BZfxev/OAgP/j755nxk8zWNI4v8DVPoB0mJsa5eq2AlApDRQXpqCjdaDQINZVaMOK4el9TxN6wdDcHNQkhUGa85en3j8lfhLkFYWQy45bCMFjwROehgjp02buzi3/3b76yaXZmrGdwqHBIGlYPBFi2xdS1K8QNm0133IY7NoQzOIwzMYbUIWamhViuFd/RuNNFVBggtUPgTaDiilSun6HTh+jqsAlmZ/DKAco2cGamGT5xlZErJcbHatRkK127H2Hro5+k79Z7COOtDF25il+YoV6qI0KP3nVtFKt1Vu97nFxngHPpRUShhq1jVIsVfCNGrGMToSvQY9eoXzyFMzqEj6B15/2cPTHD3/1f32SibDJVg6orcXyNEAYTk+VDZ85c+2oslvicUgolVSOHrGmkQKjWA8q18Fzoyx4aCZIl2Nj3ADUZ7xe7f115Qyhq9ZC6FZV3kBGGJdRRpp0wpKczzQceuot33z3Amweudgca6r6kUBMkTIuf/P0PsW246+EPMyffoj4yDBOjlGenEck0yVwHNV/iTtewPIkR1PEmjpDueYREqo16uYqKxwgkTJ+9xPBEkVV77iO3JsW6zg2s2roXI+GhK6fw/Tpdmx/k9o8/xSt/+n9SGX6DjnxUclJWhu71q3HH3kTPFjG9OOVCiTBuErczOEOXqQ9eJZiro6XG6Gijbe89XDo7ynf/8BuUqwIHEz/00AToMArIbdPcm0nGnzFUuCSrookyLY4bUqlr/EDsRYqlJaP3CXRSZrzl6ZXQ2M0CW9mxiVKbfhCMJGJG2rRkI+cZ/bZMg6mpGX787I85cmKYADsdBBolInhFNqHoaUtx9di7lKarrNt/N5nuTnynhKy7BMU5RK1GUKgQVOpYpgJCfL+Cle+gXLKoT12mLR+nOFXDsCxKs1VKdY+eW/axettu8M/jDH4fb+4yMp5l/PwYB7/3XerD50gamkzKJpk2CNo20bm+h9ql17HKMHWhgFMJiSXj1MdG0ZOj6FoFETNIb96CPXALh146wAt/9XeERpJKaDM241DxBf48GlKHJOOSRKwBAZERWs1oZF38UFMse5SrIY3AmiVFJLFy2LAcqa0MO/f0e7Uw3RCzIQShr9MISMdNbFM3CAUi0KwfKmbnAlzfQAoZlUgAUynSls8nP/9Rtt1+NyNnTnDl6HGCeCu5dRtQVoBy5wjrNfyKj1t1IfQxYxJCH2lJ4u3buHL0BN3tcUqFMkoZpJJxxq9cI9HWQevqNryx56E4jN2+jXNH5vjZH/xftMgi6/vzuNUq6WyKshfQvu8hbDGJGL/KzIU5Zkcr2LFY5Nz4Fay0idHVgdm/lWuFgDd/8DyTlwfZcPcj7H/kEd568zBjMy5O0EBo6xDTgFTCxDJYAGMZQmBIiUZQrPoUyuGI54v0QnK6ee3Fe7eWQcOJWbnN9ybh/MIhG+2ZwA8OxSzRk06aUWtzoz4ilUQaka03zMjh0TrakbYM8asTfOTLn+GWD32YfFcr5WKBYqFIvKudxKocIqzgzc1Rm62CFtgJC6k1nu+Q7N9GsWhQH79MMm5Tqzqk8hlmxgroTAert7YRTJ9A+x5W2y5e++arJCtT7LpvK37o4VU9Aq3xWzex/q7bCYYPUr82x+TVOWJJm3hSYbfaJDatxRzYRlFmGLk2Tb3kMHDLXm598nOs230/z3z9Lzl+9DKV0CbQDrlUECX8DYNY3MA0ZNQCJqJNLYWiWg+Zmg2o1nVaNOHsbya8G8lCmbH800IKVur4XiJY3Qxsaq49QaDpCcKQdNwkYQuU0ihDNjRx/remNWcR+D5+KIjZNmFlltEzBxjYso6O9avoWBXSmguQQQkrZWNmbczQw5uuU60EpDIZ3IqHYShCUadjx91cOTOMNzmMHY+hLJvR8QJbH/0oyeQUwewlwgDMti0MnhnHn7lG75oMbsWhWqpTslvZ9alfxqicxrtyjvJIHcNOku9pR2uHREcKs62FUISY2qGrJ0P32jyZ7nZUrIfv/vf/zivPvU5NpClWa+zd1cNv/dYXULrC2NgUpmlhNPwNpaKN6/iaiYLLbCVAa9FI+Efg5ZvFe4vhw1Jla4QRYkXBNyOIlyRWlzRoRA/heSEQksuYWJZAzQtPCQxlEGqfgbU5dmztYWyyRN0BQ9l4lTnGzh6jvaONXFsSv3SRcOYyzrXLOCMTyGqAX/bwyj5O1WdmokwiFscw62groHPHB7h6ZZrK+DVkEDCnWtn60N14M4cQlRIi0MhUJ1g9XDn0OhvXdTI6NE7J7mLPF75KypykevxV/EmPyZESYRii0Pi1CsKvExTH8OauIf0CgV9BJfJU6zm++7W/56WfvE5JJygHkppT5otffIyHn/xtSlOnOH7kFIYRi2CFQi8gy2eKLpMFb8TxSM+j9/5x/SjXZWJu3LS/RAubWiBEo4NVNwTpev4zpik25ZImhtRRQ0oDxymEpqM9yW/+81/lzJnzDI8V0MIEYYDrMnv+LGHFpaV3HbHWdpRlolA41Rqh5yIRuLUAp66plxwyqRjCm0XLKqv23ourMhw/dIoN9zxCe5/CnzyFcEKkkDhOhc5t9zA2OMHohfOY/dvZ99kvkpZjzL37IsyEjF0pUiu55PMJUC5WyoZMAtHSQqyjH6tzA16yj/Mnp/nR15/l8KHLTDsWjlbUXPD8kFRMUJw6yXM/foWaI5FKNmqoEmWYlCo+w5N1ylXSzet6Q/6cG3Y8i5U1cAmdBosMDos93cvtrFhCUhDoYJPnBc/kM/amdFyiVET3IRvnYmsuxcc+9Um0W+TE8TNoGcMPBY4T4js1jNIE3ugg9VIFlc5jda8ntW438f4B7LY46YTE0FAv1VFaYAkJtRnC+jXaN6xm1S130bamBV08gi4XkfP1OLeCMKF31x0YrW3sfnA/RvEMc4cP4I3VKU47VAoVMpk4me4siW2bSGzdQXzDrajuDVQcn7ELV7l04Cgn3jjG6YtzjFcNqp5AGBbTcy6Btrk2PM3J4+dwXYFQaiGtaJoSx4Oh8SpTxYBgATQtEfLmxQNBM63JUpT3QkV+5TBRLHhGC0ioZvRac3m/IXKBxAv0JlNCWy5G3IqghKZUSKFJxg1mJi+zsb+FUqFAcc6jWinTmjfZuqGb7tYU2Zime10/id6dqEQOz5/Gm7tCODeFVyiiwhDLtNC+oFr0qIzNISsl/LlBki0CEU4STF1DeiE0YJEqhPrUNWLxGu09cSrH3mbq3bNMXpylOFlBak02aSG0T6g9NCVUykHlWsHoxHdCFDV0aY6aZyKSeQoVB8f1mKsHVF2BFwhCLchn01jGfIlNY0qBxmBkus61ifoh15c9i51O4iZ8M03xenNIoReRaloLlLLzTy/PlomFnwgXYxKxiMAWC0XEJrxG4+tQCxzX+1ombezNpy2shhaahoHjeFy8cIVUXLKmN8fYtSHu3LOGPVs6wa9RrzsIBHa+lfyaTcTTKQQ1FAK3JtF2GplNYphQL5bxqy6V6QqlyTpesYbUNZQMqI3MYBk2PqCkAg+8qSphocDcuaucfeUShVEPp+JiyZCWjhiq1cbozGN15Il3tmG1ZDBSGVS8m1imh+L0BOdPnGOy6CGUyfr+Dtb3dzBbqDA2VcYLoC1n05JWSNnodjI0yjCYnvO5OFxlrqJ75kFJQi648oukDUvaevWSlod5RRHz2NF5vJKd6deLzsq8JjXRZC2H5Te1lMEi7G0+so+QxR7dbQb7traQT8xDAxShMKg7dbKxKr/65YdxKhWmJ4tMz8xRq3qYQpJUAdkYxJM2nX19tK1bh0olUQJct0DMDDEDF/fcWfRUmcqUS3nWw3HqtPTnSHTkqBWr5PrSqLQBSMJaQOVqmZmrMxSmK1TKAdlMClO45FpM8pvasfftx7UyOHWHMDAIQwPPDalMTTN66QK14ixeaFKs+wQIEkkT07JBJDh1qcirB86Rjhu0tlhRjjMIQCgKVTh2vsDQuHfI8+VeMc8RIG+iec1ACi1oZtNqZpPUGgwhmumjIsibXqGaoZu90gVGiSW9M9G5KQBtMDnjPz04XHo6N5AmbgmCICAIamxZ38LebVvRtSLpuMEMHm0tKaqxOlLGqFRDzkzNkZx2qZXOM3v5PGYmTbZnLfm16zFyWbzCKUhXSaRMrJxEXnapzApEzWdmcJpaKSSejhGPCYTUhDWYHqlSnKiRScSIU8Wyy8SyBi09Bq6YRYQuKtWF9KaZunyG0YtXmZsoMDPnUXANHAxaW+P0dGaxDQ8hBEPjFepOhQ2rs+zcfCfjE5Ocu3iFai0kEY9T8yQjY3OMTrrPuL54QujlJvNGtCJLacaWMFugFzjiGmdgy9MLKqkXu6UXLGQTGnh5j/c8Fch1To0QBJr7627wTCZtbEqYLqs64jz24HZu3d2HZQb4nkMyYZFMGCTiilgiyfGLFd4+M8NYwScIfGwTujqzbL7/fnpue4Jk+2YE04RugURHH0ZnP2E+Q7I9jmG4QICQCSaHZ1HCJJVPIqVibqzOtTPjtLUkyeQ0VqtJ661bad2/D3vDAGZPF9o2sBMtxNsGaO3fSkdPnnpxhvGiz3hFM14MGC94FOdKrOnOkUnZOI4T2Rbhk08Jtgx0sHVzL1q7jE3McWXM4eK1GsVKuCmkgYFZSE2K92izFtc3DOrryRNEM+Gr1CxyCYrowAznu2pWbIIXTZRXTTWsxmdqlaLYNWDq//GX9nHb3l5MW1Kv1zEMk9B30b5PKGIMjZcZm6jy1tExpucctqzNc/v2bvo7U5h4zNXrBDJFOt+OlbIwYxamECjLJN2WRrszWKagdvks/tAMFw+NEXrQv6OLXE+eMweuUhqfY82mLNa6XlpvuYNK1cVHELpVvHqNQIe4dRev7lOcKlIuztHRnieRyzBVqHD89DDnL81gmZrN/Z3MFatkszadrXGyKZNMNo5sYGMtK86xM9P8t68f4EcvnRdGapU2lRU1Cs3XWiOOzevWtZlbR4ilJnUlbpolAmzuuJ33QLW40V4RS2ijWCBTVVRqc1AbFY/cs10/+cA6tvRLBta1kkgn0Tog8EM8TzE4PMuZC1MUix69PVmS6QS5TIKezlZGx2a5MjhFuVghFTeo1auEPmRjBpYKaY0FZNOKtft3U718BLNlFdkdtxMOnWL4hWNMXiqTbU/S0dvJmcOXyORMVt27jez+B7j80otMH32bvnvvZOzyZWZmPSo6RrnuIwwDLUym5zzqNQ87btG/ro2tm1ah8an6PoMXRzlw8BrStFnfm2TvjlV0dsVRho/n+oyPzzE8XGF6zuTVd0f51k9PiYnJaWK59VrNV2wWOAaaHQu90Cmt9XJnRi+j6oq+b9xINjdKyy2nkJwvLSll4roOXumC2Ld7g/7ow4/rtatixEyHru4WUukYytQITKaKNa4MzTA8MouhPfbu6mT77g20dHRy6O0z/Nm33mZkMkRIk2zCpKtNYJgpPGGAYWEJF9sISYUVkDa5bBJn9CS1TJrMhj1kr0xSHD5LadalUh5DipD8hi7SW3dROPEmtaPv0N2aI5HJ4OoYZStDwTOZw436KELByJxgrmpSHXM5cmWQQ8eH+MAdfey9awd9a9poaUlx/Pg1KuU6lwenQeZY1ZvCMkNSyRitbZJSdZo7duTYsfF+/cLbV/mHHx4QItGr4/EUhH6jqi4bfZQscz5ujkabD/CN5cyK4nomxwVnZYH+QzQ1cypFEGgq5RnW9dp87pcf1vu2d2CbAd09razpzSD8Em41wKnC2NgUhZkqrhfS39/Cph395PIZzpwe48SpaUYnakxWY1SFIvQCKnMeZlLRFosxV3UxLIgbknIIjg+hDyqXxKpbQIlyYZLM1u2kzg4zPVTDCwKyHTHabtnNpaNHyFaukUrHSLZn8KSJS4waMeY8zUytQn9fnkQswblrFyi6Bp6wScXiyJjED2K8+tN3Kdcr3HH7ZrZu6eXixVHmJmcpTs7iV8tRbGbFyabjbN/Uw3TRZXyqzOc+vJH771irv/2TU7zw2kmhkmt0LBYjDPyVzSjvzYq4IMCwwQ+1JE0jmjtGF7lbBM0kNlCdvSgAvvq5e/UH7uwlm4H2jhY2bOwjaWuqhQJnzpd48dVLoAU71qVobbfYtHWAjrWrmbo2yZsvn2BoxCWUMfr6e1g3WeHd0zP4oQUYzFZCLMvB9Tww4iSSNskkWMLF8TzS+SRhax67vZfZc4eQqzeR3bCKwvAptA5YdevtTE8VmDl5iu77tlMeGUPFLTwdglSomI12PXwNq9f0smnDAG8fHmTWMbBNRSqlGehvoaUty1uHZxm6VmVi4jC37Oxi5+3b8JFMXTjP2JUZXn1njEujc9yzfx37dnezpidG35pWxqZqJBNl/sU/vYuH7tmk//q7hzh15pyw0mu0oeQCPVfkNC7Saa5EzH4dKm2JuWwmAm+QTotGJ+68AIWGwPdxy0Pig/dv1//yn97z9C3b8/SsbmPHLTtYv3ENpoShy5N879kT/OHfHOG1I7NU5yrs3dPBHR/eh51KcunoOYYujKFDC2nGqLk1chnBhoEuCoUC1WoAGOigzuZ1OdasyiKFJps0yaYUGcvDSqax29swMh2ULw6SqBVwK0Vi3Z04I9eItyXo2L+Xwz/4KatXpWnbtQ5tGlR9DyMWp151CGMp6n5E6iPcOc6dvcjIhEuoTeKWoK9DsG9LJxMzZc4MFrAsm3wmhvQ96qUZMvkUPZvXU5gp88PnznHkfJU3jo4wMlpgVWcL3V05Wlri5FvSeF6dXFJx1971tLfknn7rwFHhhcbTpmWjG9SZgpWJ2VeuyNv5pxFNSdPlubl5pqWGnRUiEp5fHRa/+6+f1E8+so7WzhS79+9iy/YNJJKS2YkCP3/uOP/Hn7zON5+7ynQ5RtIKeOjuHj77hXsozBS4dvICfj1EmNGDB6HG8yrs2n8LW277MJsG2jh78gTVekhrPs66NTnSMYN6pUrc0qRjPu2pEFPZZDc9SH30Kv6FUyTTScLyHMRNQiugbcsAwxfHcC5eYeCOTXilMayOHoyuTdSnJjFkGDEYhhEDxaquLHUXimWNYQgysTofemAnLRmLQyeGmC17pBOCloygvTVJzFK4xQKFiVn61vfR2pLhxPGrFGs2p67M8e6JIXzXZ3V3C5mMQUdnhpZ8ilp5jp62GI8/svfpS4MjXBspCTsWe3p5Rua9qhULudAFstVl2NDFxsQGcQECt3xV/MH/8km9b08nbT193HX/baTTIX51jiMHLvAH/+2n/PHfn+b0NUE8kSNrVHjq0V7+7b/9NN//ziscffMCq1e1o2yF7wcRJaTv0d4RY/XAJpS9CulNUJ0ZRhhx4jGL0uwscSOkq8WgNW+wqreFrg3r8DwPI9FFMHUOURpHGwY6qCG0g9XXhbZSDL96iM41rWTXdRBWS7ihILlqC6Wpcdq37CGeziLCKiIoobSPwCSWSJJLW+za0sXeWzdx+tQ5LlwroQyL9rSiPWeQsKNKS4DN669c4LmfHOLJj9zJjq09HHz7FKHKMjQT8PaxYc6fHyGXSpJJKVpaY6xb14kwFNNT0zx4107eOnT2K4WSTEvDeH+EhmIJMvsmiVS9yOojpcSp1njs3rVPf/rJLcRzq9h3z368yhjVYpFv/t1r/L/+txd56XANX7aQStikVYnH7+/k//n05/nG13/MN799goJjk8slaG+xkRLC0GPdpj5yre28+LNX0fUxVvemCZ0Sc1NzJC1BT6vF2r4822/Zwfod28h2tYMZh8o0xbFh8gNb8GcvAw5mOkbgVEitXkd1skIwMUHXLZsxkhLP16TW38705UuEpSHiXT0kc110962jq3cVMVMSejVMpTClS19vDtsSjE+WmZgqk0+qqK07Y2BZEqVinLkwyysHJjg/WOfg20d46hN3s2VLNwfeOkEgEpQDm3PX6rz29gVmpgqsXZWhpT1NV08eqWKUZqZpb82nX3ztkLASrU/fDGi2XLlugAvVy6Q+fyYqPKciPvX4wNMb1+dYt2kLCcvHkAEvPneYf/O7P+fsuIWdyGAZgozpsGeTye/+5y/y0x+/wV//1QFcs4OxgofnePT3JMjkDNbt3oYUgkPvnCOVbsGWLqZw6V3bhaUrdHbnueXeO9iwcwd+CCOXLjN28TzTg1cwQokuzkCqE7sljz97HjObxvd8zLa14IEK6sTXrSUIKhj5dXiyjYnjb9PW30dlbpqRi2eZuHYN07bp7N9AV996YmZI0nRYtSrPxNgkITFW9/ZgUaY9A8mEgTJMZgohz792lVNXHWqBSWku5Nzps/zSLz+GJTyOHx3E0TYhBgXH5NCJkZ6U4fyPd98xAEqQyaYZG54iHbd57q2x/+iH1tNLKapXpomZ/6ebcGYvDfwWJO9N09WexLRM4olY9O9ewNGTo5y/OiGy3Vu17zvYMYv2pMM/+42PcG1omL/5i1dwZAuz1RAtbM5cKXHq/Bi/9PAHqVQqTA0Nsa6vnXJdUSjMEFdj5LpWsfnOhzDjBpOjw7zw/YMMDk7juj6GaaME5JIB61sE7om3WXXn/ci2frRRQaWTeL6PzGWJ9/eiUjZeMUmsbTODb79OoJO89e40jrTIZHKE9RJjQwfJ5U7RsbaP7vXb6e7fCH6RuekyY7PTJNNJdu4aoFYYg6BO1TU4dHyIE5frTJclgR+QS8Y5c7HKn/3xj/jKrz/JwUMXefFQBUcqLEMxJ1Ijh85MUyjW6EinMKRJIpPC86tkU9bBkdkQ07gB869e7NSdjx2NGxvbxU5suYQYDVrzKYSyME2FxsXXITNzLlais1tojW0IbO1w/1197NzRz9P/5k8p1JNMBwI3FFgmKOlx5wO3UZicpTw+SmdbGxUnZHa2QEdrnM413cj0WpRpMzt8gAsHT/LS61OMly1CrTFkQC4pWZ2XyLpPf6vH7IXztGy8l/roy9gJh1AKVDqPMkI8x8Fu387MyARzU+NcmoIzV6vMOJK6N0IiFqM1l6A1NsceOYgyfNrW7MVM9NHa4+BV67j1KnEZI7duNZPDw1y6MMk7J2eZqkgqXgChwVw9IGal+NlL57j3A0N84XP3c+TEt6mHKbwG4LdU1TgOKMNEhBaWHScRD8ilrL3Xpv2GXi2fHqCbyP4WaapXRNKEC5jQpfm4+cbDTNpGGUZEzeF7EIa4vkajRoQQxC1FPunzkY/u58BbJzl+cpYqMeouIAxCp8jnP7ufRCbFX//Fy5hGLqIPUZrV3XF61nbSsvlO3PIE1979HplsB8MzNqcuFbg26VCsKqoezFWqGAmb7s1byG7ez+zYCOWCR7x7P76QCMNA2jlCZYLdiZYtDB19m+TqjazdvZuedaupOAFTRcGVsZB3zxS4NBEwXk3Svf5W8CfwqpdJrV5Px9peensSpGMhIqgRy3Vx8NgYY7MaN5BoqQiEwvUNSrWQQi3Gd771Gjt2rmH3thZs4TcQexLHCfD9aKSQVArDNrBiBum0JAyDZWN/mqo989Rc81xrEY2ZuKGz08wQT4NmuLOzpTuZtDBkiNRVtF9HBz7aDzAMA1NJTAI2b2xhYGMPP//ZMcq+RckJCYVCaJ+tA2k+9OHb+YtvvMaFUcnV0RKhEJgxyLRnaFm3C6cwwfHnfsjg6Sn+4S9/xoWLk2zatolytU697qDwuPeevWzaupXLQ7O89uoxRkbLjB87hLR6EalekAKtDUIRx86t49rRd5kem+XAmyc5dvg0re15Hv/QnbS1xXDqLvV6SFtnL8gEf/tHf4qqldAzxyleep1M/xasjg6EHTXHhLUAK5nHC0JMU0UsxCpin3ACjRsaHDs+zujIJB+4bytJ08c2I2BTEEDgBRCGBF4dQ4EdM0mnTAiDG/sjK7ijcqWZCAvIX70UPhgGPjHLOJhMWEjho705atVZAq8+TweEZRoo7bBr52oqlTLnL0wQKhuNxDINzLDEpz9+G9eGZzh+epJMWxvFUkBhpkI8FSPesRqUwfk3f8bly1XePRfwztFJiLVy5ORV0IJMIuRDj97B2Ngsf/ftV3jr0FWGJjWjFYvx0XGGTxzEbttFaLSjtcTODjA3NsnV08eZdGIMFyTHzxT5h++8zetvHOdDj97Buv4sfuDz7HPvMjjmksz38NLzB5m9WqZ05Qx+aQazbQvCTlMvw1uvHmPb1nXks4JM0iQdU8RtScw2UcrA14LZksepU1fZvmMtLRkj4hI1FF4oqLsBgVPFr80hwzqmCMimbAjCFRHYC7CVJo7xqIK0Au2hbkwvWSQrbahtEJKMmT3puInw6rilIn5tDs9zcIOIQiRilID+/jbGr01QLgWEgSbwHKRbYk2r4M7bB3jzpbdQnsuqtjiVUoXLF4YItcJMr6I6PsTU0Bg1neHadI22ng5OnLnG1ExAyhI89uA+jhw7zw+eP861WYPRkuLqTMCV6YChismVE0cpT1SwMtsIdRZ0krNvv85oAa4WBMOzIeMlmKnHeOfIJN///ss8eP8tpJMKw87yk+cP0t2/mYtjPm8dmaReD6lPXkKZ7QizjSsXR7lwZhSnOM7WviSyMk4iKBMPyki3hFebo1at4ria4WuztLTlaG9JRrB6pXADcGoebrVKfa4AfgXTDMlkYnDdcDDdxFgvriNKN24WMS5BVMiIhSiTNsmkLGanpilNT+P7LiITw3EiDVQyIjTP5RJUSjWCQNPVlWGVqdnQ38Ldt68h35pk7y0bGNi4kbaOHNKvk4h5iFQPiDR+tYQIwQ9DDFOwd+82Tpx7GUNJ1q7tIJ5IcOjYII5KUyp5lFyF6xkEYUioFcKXJA68zZ4ndhHLdHP+1e9y4cIEw5UEQzMB06WQuVpIseqjZIwrQ3OMjxfYsWMTL71+hnpNcPXqOHfdcztXTx4iEY8hdQVCj8BopXXDJu6yu7GTJv0bVrNn6yhCmfhhwFypxsRUjZnperSBKy6xeIxEwkJQB8BxNfWqQ2WmiFOr4parpPIWLdk46FDcbDrhcsihsbyRpXkAlWQZa1MQ0JJNk0jYTNTrFCam8YIATYpKxVlo0IgmZQpMywIlCBC4PowXHN49MsqJE0Mk0mlyLRliiQQz4xN0ZyHbmiXWFg3uaG+JM1yMWrNbWltIxE2k8jAMg0QiHqX0Qo0fQNUJFnoUwwDwDLQ3Ssf6A7T29nHojXe4WrQYLARMl0Mqdah7EGgZkZ8LA9O0sG0ficC2YwSeQ7U0jSV9YrZAigBEgFuepTgywejwHLm2LKE0GRopkrR8/smvPcoLzx/m9LlJanWJ1gLLkARBiOfrqDNEgOcH1GsBxekCtWqNet2jtb2FfDYG4QyI1vc1teW69rLlo2D0EnRo1FjS1pLCsCTVUh1f+TiOg52sU615Ee1WqAk0TEzP0bujCztmMTJVYbLscXawwmF7mnTMQBpT5FttHn3Q5szhS2zskMRkjfzqbZipVswkJOIR2fmFs+dZ39fF4Ngg14bGiMUs7r59M888f4y4nQWt8f2Acn1+gIhEaouDL7+Kbb3FpQkYKSkKpYCaA3XXxw+iwSAy9FjTm2b9utW8+vqPyCRjxJWL9AOGB0fpSMYJtUsobcBj+uIpjr9zgVdOTrN9z3omCx4vvHiF7qzLE08VeO6FM7xyYJZEMk5OueRaUpTm6swWXRAKITSeHx5yPW9vec6lWq1T93ykkLS0JJe0mOkbUE42V+uNm43MWcKZHcEMRWdHVguhKJUq2NKkWquSbHOoOd5C42coTS5dnOSxR7bS0ZGg4CligYkXGlSlwvHAUhblGYeiY1DFZrpqMD5Spn96jFhHP5mOHlqnxljdHmP48gUqFUE+YxOGmmeeeZlPfvKDKGnwwqvHCEILZVhRR5QWzNUFQ8LEuRRgyJAZ16ZQDfBCiRYBlpIYeBDW2dDfymc//RivvHqQYqFGJpkkn9BUZmfo7UywqsvAjLuYuT784hgXTg9ydUbgqxjZzj7ePnkMM55m4+Y4sXiGwZE68XSOdEySFB7r1nVy9eoUUwWHQMcRSIIQvBCqlSrVuTp1z8P3PDKpxBIu0KXYGM1KQyGNFSet6EVkdvP0FfQMHR0JAj/EqdYJRECp7OC4PhXHRyDwvIAgEePE6XGUinPLnjUMjlzBthLU6gGhHz2BU3chCDhxfpQ1q3o5d/ocmbhN25EDbH94gPzA/awq/5RExqdt451cvjSN8/wJChWD8bE5/uRrf8NHn3qM7VvX89aBo1y7Nonj+IRhgNSSqiMZCyVKSNzAhzDAViG29LGTinw+xY5de1jXv5YXXj7EqVPXSKfS5OMOe7Z10JGR9HbEybeC2dqHmV3FyRd+ytkrNc6OVIhlW7h4pcDgcBncMvfeu5dTZ0YYnXKxkyliMqAzb7Bpcx9//Y03KNckjhsS+BD64SE/CPY6dYdyuY4XeFRKJVpySRZm9zQghc1x+PJxBehlAmxWzQW6nsa0lfkPt+QS1Gp16lUXQwlqdQfP8Qn8eXi9JMDk0rUqh48O8dCje3n55QvUKlB1oR5Gz+f5IXHT5t0jl9n41D3EsgnCWBIZGJSuHCa9/kFW7X4UfeQnzF46ScboYGNXnHODE2zf1UpLR5Y3Xv4psWSOW3Zv5567tlGvuxRmi1RKZWo1Bx36iDBESkEsZhNPxcnlMqTTaVxfc+78MH/+F9/DDy3SqQx2MMcH7lrPBz96N6Onj2BJB6Ojj0TPboZOHOTgWxc4NxoyU1HUSkWOnp8m9AQbewx271rLv/oP30RZGZKWQVyUue/eTehQ8tJr53GFTc3zCLXA8/RI3fFxjZCqExCEAZVylUwyv3B4zYOXlsqkucIX+TrGit1ITRKWYjG0AEgkbNxajVrNwzQNPDcgQDBXriFVCi0VdR9qfpy/++ab/L//4Fe4/76NfP9Hl8klkkxXQtwgulnkAFn89OcH+cQTtxFWxjh8qsjUxAHWV+qs2vEwa/Z/grGTr3Py4FHW9rRzz0MPUBgfpH11Pw89fCdvv3WMUydP4AcBba2t5PItrF6zCsOMYlUReggEvh9QqblMTBU5duIy0zNztLa0cPddt3Dk8BlsUWPv1iwPPLyfQAckW2LEcpuwWzdz7cxRfvbsa1weVQzPuHjCpu6H+IHArwzzlV96iu89+w7Hz5VIp1tJGwGrOyyeeOpevvWt1xgc9aiGcXw/WtRaYfg/OnX36TCmcR0PTUit6tLSquhozVBwNUqtMEN3GfmBjsrdy6CHepFxIvpeNDSxQW9PcbaIHeuiVnMRxKg5PoHrcte+Ps5+4xTx1AYCFLVQcvxkgX/45qt84Vcf5/Spr+EPeuiYxUw9wNXghhGD7Vwl4JVXjrOpL8vg1AixPd1sFAGViaPEcgOs3v9Rkl29eJVpCjMTjF64xOG3z9De08P6bVvYunU9tXrA2ZNnuXTpMpW6xGtQVkUUYAqpIJdLkMlk2LxlE6mkScJWTIxOsLZNsyYv2dIvCIICvpcl2bsPKTJcOPAq77xykIvDAUOzHqGVpO54VGs+9cIov/6l2xgZL/Anf3OQZKqLrA0pVeLLv/I4U1Nlvv2DY7hGlkrJJ0RRnpsBYHVHjpkrIwQ+uH6AFhLTVqCDBkX5CrMFlxCjz6PSxMJU7iUM9KKpFUY0cWmfO3mR/Odup2ddF1dOjZLKZLh44gy/+tF9dHak+eNvnhgpOtke224lbef4xt8eZMu21fzOv/4U//5//jpizgClKNZDPC0RoUY7Zeqzc7TsiPOpjz1BNpfk2JFj+O+cZe+tE/hGlu71A0ijCzWUYss+i/bhCSbHZjnywqtIO46dy5GMJ1nbmYvanX2BHwbYSmAaNkZM0daaBB1Qmhxm7GKBsF4mYQVsWpViw4ZOutevJp5rIxQJRi9d4/zhI1y+PMGlMZeaTJJqizM5NEe16qLdOT7zkd14Qcjv/eGLxJOd5GKCDLN8+jO3sW3nAP/id/6YibkYNd/AdTwKM8NsWm3wb776OV0tjDAxXcO2Y5SqFTbu2srZMyNMzFSwMiyb7NkUl4tFKma5BBe6bCy8FhHQd36qmEbgFC+Jf/rhAf3IQ+t54pMP8aNv/YQrZ0bIptIo6TGwfYA5keXPvnuan70xQTrVyto2mzX5Mv/pdz+LFD7/5T99i/G5BGVtU6472KbLRx7awMee2odhWnzv+29TqngMrO2mNjvN7NQ0Tq3Kmt48G7aupX/zJrLtrWgk5UKV6eEppsYmmJkZx6vVcV0XLQz8wMeOQSqRoFyK+hmC0MUwDLLZLMlknGxrmtbOPKlchngygefWuXzqNGeOXebcpWnmagrsFOnWLiaKPqfOjzE7WyEuHO6+tY9yucSLb5wlm24la0mSTPPZT+/jw59+mN//T3/Lj14aY8pJcOXaOPlUjS98ZAsP7e1h5NJ5JkaLBD7UnSJPfv5xVq3p4s//27f4r9+8+sSkm3/GkOKGk1uaibMaAlwK5RbN4wkaWhgKiVO8JH7nM7fo8uQQG/Zu4p/82pMMXRrkwIvvYPjRpJVMPsbqjZs5cdXnj//+KOcvV1jTkWfTKs1/+E+fIBE3+IP/9Ttcm1TUg5Bbb+nkK/+Pj/LmW8f58796mdmSjWVZrF6VYc+2XrJxxezUDBNjo4ROlfacRf/aVvo2rKenf4B8Vy/StBAafLeO71Tw3BL1WhHbtojF0pQqJSwriWnZKNPGsLJ4oY9Xm2Fuapahi1eYHB8hnzU5d3aEUxerGJkuzGQaYSaYnCpx4eIliiWHllyGres6GB6dZHBoltZcFiusk6LIZ79wK489dT//9fe+zY+eG2asJJmeHfnahx9c95UvP7UTXRzjzPELVMo+1Wqdrv42Hn3yAaaKLt/682+RS+X5/e9c2TdVyx401fw4O319t1JzV0XUnaQX3FTRPFxCNA8oUNSLF8Vvf3q3Ntwyx86N0ru2lV/5yofYtqOfo2+9y+WTl7CEAhHS2dNBy6p+fvzmNf72B8fAtdkxkOBf/uvHGdjQw9e/9iNOHZsgnk5QrDlcHnOokgTDQsloPpLSdfp7Mmzb0kN3ZwZ8l8L0NE65hPBrpOOKfD5DMpshncsRTyVIpmMk45DOKlId60DlKYycwa161Ct1pqZm6OgbwFCKl575IeWyT7EcUqwFeNph354NTM2UeffUBLUwzfhMFbwKv/aF28i1Jnj1lbMcOTGOH5pk4ga6Nkt3i88v/eqDbNq+gf/yn7/NM88PMlOus3l9kl//0h2sb1ecPnSU6aky9bqHmbC4/dG7Wbu+j2d/8CrP/MNrdLckWbdhNb/7V6fFrJvTSi0HweimmVZNTbjN0Hqtl01toWkGkFA4xYvif/jMHq3cOS6P1ACJ68xx170b+ewvfRhLwps/f53ZsSJSGigVsmFrPzUjx19+5yiHD4+zpjPBb/zGgzz65B0ceOUwz33/TSZmBcUgzkQloOQEeFoSIjCVhMDDCF1as5HmrV/XRVdblphtEDhVyoUZyqU5qlUHz/PQIaRsSX+nYv8jd2OmO3jru89QKMNcLaBcD5GGQTwRY3ymzlwtpFILKFc9atUKLbEyH3tqH5NlzXefPUehHkNqn63rEjz04HZGrxZ48ZXzGCIkIUrcuq+XT335YYqFGv/b7z3LT1+9SCqt+NLH9/DA7b1cPXOOqxeH0YEm1AGbb9vBrQ/dx/Ej5/jbP/kuY8MVYvE0XS2C3t4O/tdvnN037WQOGkouGwDS3HC0iMSPBHhd27ReITVjUC9eEP/803u05c1xYaiKZdsYyiDw6sQTPh9+6nYeeHg/V89d4N03T6E9CfjkWhKs3byJk1cqfP/HJylOlXnssZ186dceJ2YaPPe9F3jtlYtMVUyqoU3B9Sm5IX4ISkkspSIarzDEMiGbMuhoTdHZnqK1JUkqbhCLW8RMm8NHzlOec2iNOXzoqVvpWLWK7/zZM5TqMWZrAVVX4zgOQgcEOsAPPCQByWScvtV5dm7vZNuuNRixFv7gvz7DgeNTxOIppPZRfo2kKUjZAZs25PjQU3ezecdGfvLDt/mjP3ye4bECD9zbzycf305p/BrHD58l9CVoj551ndz30UdxteTbf/kMx945j2VkkKbFXKVCT6uir6+b3/2bM09M17PPKHH99ACxfELcggY2Ic9WLPA2PB/fKYmvPrFax4MS54cqWKakLWuQShgUKz4zhRLdvWk+87kH2DDQw7tvHmPo0jimNBDSY83aLvI9a3n14Ag/ef4Y6USSz3zxQR55fB8jV8d47tm3OXz4KrMVSR2LeiiohRCEosEGD7bZ4KLRIUHoIXSULouZkkQ8hlIGQhoYQYlPfGw/AwM9/OUf/h2BTFELQqQhiMcMWltSdHRk6enO09KaIZlMUHdcLl0e4cChC5w8NY4fxhEqjtAaU3ukTIctAxke/uA+dt62g8uXJvn6nzzHz144Rl9fC597aiercnDwnaNMjJXQPiSyBg89fidrd2zjuR+9ykvPvo6pLQwpqLohgYjjOAFdrZLu3g7+89+c3TddTx80pLghoL6Z/EDEMv365sQyjZSalLjVMr/8wV46YzVOXy5iyZA7b+/moSfv4JWfH+TEsRFmilCpVbntzvV85tMfgMDl3bdP4Jbq2KbCiinWbuyjSopvPnuaQwcusW3Laj71mXvZs38jk5OzvPrCYQ4fvMzElIuDRSBjeEhcHSXKI2R/o9Cpw+i4lhIpJMoA2zIwvAofe2IPT37kNq6cOYM0E9FEUfwIAlL3KMxVmZipMjQ8zfDQFBMTc5QrIULamKZN6HuIoE42Dtu3tPHgI7vZcctmhkZK/ODbb/CTHx1AC83Hn9zN7TtauXTmLOdPX8X1NZ7vsmvfRu7/0H2cPnuNv//6D5mdKNOWTdDVneL+D97G4IlLvPDKFUp1SW+7Qbajnf/5/3xT2Jl1WorF0XU3w/YaiJW9GxbarBs93TqayT46XWNgSwIdToMyCQKXLbeuY8Oedbz+/AFe+OFhRscs3j0wzMlTf8lHP3ob93/oXkYGR7h4/DyEiitnrpJrTfDrn9nGyTv6+btvH+Lf/ftvsHXLah54ZAcPPX4nT3z8Xs6fGuTQgXNcvDhBoeBR9ww8aRJoiacFvo5Sd34YLtRO/FCAF+AHkpHhcd557TAvvfwuobCp1X0qVZda3cN1Q1w3QAgL2XCcDJkjn/YRgUPcrrOmJ82ePZvZfcsGcq15zpwd4fd/7we8+MpZZmaLPPKBDXz00S34xXEOvPwG5ZJHGAR0rsrx4BP3I+0Ef/zfv887b54lYVm05y3237GOBz76MC0DfThTk5hK44UhpmUwMxcskMnrhdnDNyd/FbHsWr28u1Zr3eTn6IjnTGv8MKQtXn/iNz+59ZnLFy8zNllnVafBww+t5YOfuJt4Tw8Tl2b5+bNvc+TgRQrFkFKpzNqBPJ/+3CP0re7ixMFjzI7NELctwKWztxUr284PX7zCD35yhnJVsK6vhVv3reUDH9jOxo29aKkYuTbJudNXuHxhhJGROaZna5SdKJ2lpYkyDLQUCGkgVJTR6O+y6Otq4Z3DV0DaEWqg0Z9uqMakUB00RsNCR1uMvr52Ngz00tffSTplMT4+y5tvneONty5z7NQU18am2bmthV/5zD76W+Hs8TNMT5TxPB8zrtj/0F2s37ye5597i+//w0uELuRTknUDWR796AfYfNteMCWX3zjIj/7+FY5frFKp1rjr1o1859URfn6kjJ1IrDi1bKXa7YIX2gxfA7EkmbrYryZx3Tq7+0w++8hGrl65ytXRAtmUwbYtKT781K1s2bcdzBRnj1/llZ++w+UzYxQqPnWvyh13buGJjz+IUypx7thZpOejhIdh+HSu7mGqnuAvv3eSV9+aIB7L0tVis7Y3zo5tq9m6s481/V20ZJMEgc/sTJGJsSnGx2aYmqxSKFap1V1qdRfHDSKmfBliW1CrBYRSIQ1JzDbIpOO0tmRoa0vT2pamraOF1nwGwzaoVRyGr01x/NQQR44OcvbcFBOFkPGZOTpbQr74sW3ct7uDsSuXGRmcxPcFXuixed9Wbn3gXi5eHuFbf/E9hi+NR9WVDot7HtrDnY/eg5lLUh0Z582fvs5bL59haNwDKdi9bYB3Lxb54+8fFrFsFNYtnSp+E6T2kg7d95ycHB2eTq3C+i7JJx4cICEDTp67Rt3z6WpV3HfPGh56Yj9t6wdwaoqjb5zglefeYGykwtxcHSsl+finHuDW23YwePYcw+fPE1My8gQzMbKr1vDOmQp//q0TXB3RtOZbSdpgCZ90UtLRatG7KkPvmnbW9HXR2ZEjk02RSCTQUuDrAB2G0dyhIESHbgQCMmRjGLNAhALHl5TLdYozJa6NTnH16gSDV6cYG6swNetQciROYDNVmMNzpvjIQ2v4/Ac3EBbGuXD2Km5d4Pp1OnrbuOfJR9DS5B++8ROOvnmSbNygvcVg6+5N3PHY3bStWwXFWc68c5if//gQx8/M4Lia1ata6eru4bmDI3z/pdML/oh+H6CK6zTw/TTcz6uvUgrHcQmqQ+Lxu7fo/ds6mZmaZmh4BlMF7Nic44NP7mXX3XtQ+R5mhiZ5+ccvc+LAeWZnPaaKRdZv6eIzn3+UzvYkF46eoDJdJGZIAnzautqRmR5++uYof/3d41ybgEQ8g2kYGCLEEiGGERIzBMmEIpuJkc0mSGcSUfNmMoZtGSgp8AMfz/dxaj6VWlR/q5QdKvWAciWgXA2oOxonBF9HfOCOF1Cr1fCcGfZtT/Nrn95Nf97j4qkLlGY9HMdDW5o7HtxP/85t/Py5d/jxd15EutCZsxjY1Mbtj95N/+6dIAMmT5/h9R+/wZtvDzIy7ZLLJhlYv5qJYsB3XrzMmWEPO5FZYP54TzVqQvQ2VHZlzMW8uzpfStKLXZ5IoQi1xqnOsaZVHHr0zv69va0W165NUC5X6Woz2b+/h7sevYPV27aAtDl35Cwv//A1LpweZWS6ShDWeeRD+/jYJ++jXilz6fgphONhmhJlKjpX91L00nzv55d45/gIM8U6NScgCKLBzCxMBVVE/zVYjGREuBr4Pl7gRz3p89z6IqIOjGj9Nbox2zZsjAc3FdiGYFVbgofvWsNdO9uYuXKRoStTuI6g6lbo37GO2x+5m0uXJvjrP/0B41emaM3EWLsmze0P3saOu/dj5zO4E8McfeUdXn7+KOculwiA9f092KkWfvLGID97+7yQiV5t2zbhApzwfRrE9zahSy/WHHss9nSDlArPdfGrQ+L2nf364dv6MXWVwcFRhA7pW5Pgtrs3sP/BW8mu6cedc3jrhbd5+SdvM3itTKFYpaM7yZd+5TH23b2HsQuXmbp0BaPRyB9P2mQ7OtGmSd0P8YKIDSqaHarQwiLEQEtrgTxPowCDMAjQ2iUMXYTwQAcIPKTWSB0itI8kRIowSt0JEKEPgY+Fpl4sMHFtnHq5TmGuQqw1x+2P3IOOZ/i7v3yWN186RkKZdLUqbr19I/d+5BFa+vvBqTB46DAv//B1Dh8fZ66q6e5soXd1N0fOzfDdV6+IiTmpY4n0QqZrKZmBWJHsTizMdFxsc1hRgM0a2VwR1ujGaIKwsZv1At0kCOpunZztiwf3dev9W9uZnpxieGSKREyzaVOO+x/Zzc47dmLk25i8MsGLP3yNQ29dYHzSpVovsf+eLXzmVz5BV3ueoVNHKY2NoQToMIgWWoEyFcJUmJaFYZsYlo1hx7BicVQsgRm3kXYCZSZBGdGzhlXw6wSug1ev4VZquJUq9WoNr+7iOy6B6xN4AZ4X4jl+hDLwAjzfIzAU6/fupntgPc//6A2+943nqZdc2rMmAxvyPPDhO9l2xy1gJZi9PMg7z73Gm6+fYWiiTjyeZMP6XsqeyXdfvMihU4PCSq3VhqEIwmCBDVI3MYPcjK3wusMtnlunF01l859Lh/HOf18vGSU5H2hGRlnKBoTOKdPfafLEPevozptcujLM7FyZ9pzi1lt7eOBD+1izfSNIm/OHL/LzZ9/k3LkJpqarxBKKR568l4effADL9CgMX6M2VyHwHcIwRAgV9bUrE2EolKkwTANlGJgxG8OKoew4hpkCZTdyhg6h7xL6Hr5Tpl6t4JRLePU6ruPiOw6BH6D9AB1GyDYtwYrFaF/dR76vn7MnL/DNP/8W508Mk46Z9HSY3Pfobu764B3E2rI4E7McfvEAr798kktDFbxAsG5tF6lsG8+/M8QPXjolZHyVjtmxBs3IwsC3JVlM0dTSsFCLXSqIJmjF+3BibkTHvOSizW0yQiC1wPU8guqQuHffRn3/vtX4tTKXroyA1qzttbj73g3c9dAecmv78cqCw28c5eWfvMmlS3NUa3V61uR4+KmHWb91HflMCtu2QUmEsBDSjuI9YSIa/M7z1IzRQAYDMBu/xSLaWWvAIQw9dOiA9gjDAAIXTdAYVRqhEbQI8DyP0avDvPrDFzj0xnEIbeKmz/Y93Tz2qYfp3twH9RrnDxznpR+9zbHj45Tqgo6OLOvX9XH2aonvvHBhZHCanlg8jRTRKCCEWDnn/I/49QuEEcuq+/MBZSO7qsXS4XXz3CT1WpV8IhSP3Nqjd21oZWxskpHRGZJx2LQhw0Mf3M0t992ByvYwcf4cf/R7f8XwaITITmVsKpUqUigy6ThW3CSesIkl4li2hWWaxOImdszEMkxMU2CaEtOysC0LZZhIoQjCkCDQeL7G93xc16Fer1Gr1ilXXOr1CFnnuUFUNQh8AtfD9+aw8Zkr+vjYeLU5Hn9iD4988SNgC2YvXuC1H73J66+eZ3jKIxaPs3nDKgIR4/svX+SNo1eEkVijbdtqmMubFAx+IQEsJl6M9xsDLtBdiGXTzIRGzAsznB/4KhcO2ng8ScUP9TdfHBJHL0zqD93Vz55deS5fGeXIyRJD117j5JGrPPTkvfRu30TPqnZOn7tALp/HNBNIAeVCDbdSxooJUnEbO1EmlbJIJwSqKjESJoEhEYZC2gppKQLbQisDgYjMehASBOC5Hr7r4dddgqqPXwmoVnzmSg6uE+LUo3QYOiQek2Q6skjToVZySBkBd96/O8rvfu9VXnr+EKcvzFIPFf1rO2lr7+Lt0xN844evC+xuHc8NaHRAEPiLtLjNm1+8v1jvZo3yN9HApTlS9HXlxetAp0LrxvzAxnxs3cw6pHDrdYL6sHjo9k36vltW49bKXBmaxHfq9K1Jsmnzao4fH2Z40iEVt2hpy1Atu1RLDvGYQSwGsYQik7XIJSQpE7K5FMKIJmYbNCZAz0+PiSZLRYBjIqi71pow0IS+jw5DKtU6lapPoSoplgKcmofjRkBb2xJ0dqSZnnGo1HzMsMI9d67B90PeOTTI5FxAe2uGgYFehiY9vvvz85y9Oi7sTL+W88CwJirOJRyr/zf80vr9mtCme6+k/s0g4AVPVS7zgnTUIBNqcGplurLse3j/6oM71ueZnp7m6sgMjh+CMjGVgW1CW1uGWsWlUnKIWYp4TBBLGrRmTdqTPh/7yqeItXYQhiGaEB36UQPkAixLzs+4RKOibg8pF8ZFC+0APj//xrOcPTPJTFVRrXj4rk/ddTHMkFVdGWYLDrW6xg9CRFinVq+RTsbYvKkPreI8++olfvb2BaFiPdqOxZc6KQvsZ2JJZV2I/98EN6/BhmjwfC5Rz1AvmyfYLDO9tMSxbEiTREbnYaiXaryIuksFgngizXQtOPg3zw2KLX3j+iP3rmf/7jxnLlxjZKoGRjRjyA90lBYLo8YQX+torI0fEjMNpF9ByRpmg1w8ipFUw5Fp/LnwInLRlITRO4aBRvse6VhEFxaEEOhoELIXRANVHB98rQmFolx3MYXPji1r6FnVzetHx/ijb70qMDt0LLNORxOHwsUNPT8EU7AwqnZpeCZ+QfPJEoLBSAOb6oHzIBqhVyaxX9o531SCeg+zMM+x3TyncD7sqNdrhLVh8djdm/UD+3opz81x+vwIVU+zurcD7QfUqi6WpbBMTTyhiNsG3TlFT6tJOp/AMBVRdKEwDBtpRK3LUqimXR8SBiGhF5lOz/MIfZ9apc610RrDBUGpoqnXfBzHxw1CEAEtuTilUp1qucSangw7tq7nyliVv/3JGU5eHBVWuk8byoi8yyaW/6a2yqVLs4T/musV5YaOzsKQ6abO6SYTKnTTj4vmc62J9O66SZ/vz5tqLoE00QNHTo+UaAH1SonObNjzwTvXjOwYaGFmZoqq41Mo1ikXXWzbwrAVdkxhGhJLadKpiKvFNBSmZWBZiphlYloWypSNaWGCUGt838UPAlzHx/c0jhPlNB03oFTV1J2oBaxeCXAcj7rvYsiAvp4sybhkXV8voYzxd8+d4rnXzwsV79V2LNYQ3PJ5DNev/fs9+5a3+DGfpWkq8y2htFvgzNZNWrWM7645yF9Cufx+x8ToZQZcNmP4IwCVFArP9/HKg2LLum790J1r2L2xDVMEFAtlHNch1DqK+ySoxqBEoVRU3zMVphkNoFSmhVQCKRS6McsIPyAMfbwAPC+qmIcB6FBGKbfGfODAC/D9aPJMPpegp6uFUjXkZ28P8RffPSSwu3QslljsWhY0hVPz7/feJhLNe47Z0XopVc+CAMXi9UUs26+XwAklSzpjmu2wECuzAr9nykcvzTI0406b0qqN3m+J4ziEtWuif02P3jGQZ93qDK0tCeIxhW0bmIbZGL5sRDMplMA0DWw74mKRhgJlYDQgjhqNDkKCIMB3Q/wgCtLDUOD7IWHj3zUS13VxPc1cyWVkvMTxs2O8cuCiwGrXlp1CqajVoDljohvHzlK/fOmGF8s8lyVNK4JlBK8rUy/rZeBrwTLW+uXo7EUi7RX0X/8C2tecgBXL2IEXND2KM8OGNhKNtsP3XQhcgTe94uXbOtqQUu+1DPkVZaivGDIaB6tFYyBl4xFCIicq8DWB1nhB8Ezo66+NjU49e2MmuRZQtjZtG1OphVTi/FGwoqMnbrAI+hcdbHWD6y6JCPSiE9N0NK3ItqVX9FRuJsVlu6epSLkcHqf1UuE2wzqUlE3TvTS6MWhZEpkqAQ1z2Rgy1YBMiMbZJ5o5+hvaEoaasOHph2Hk2YZaRDEjOvp7UyOJDsPmVaN5LoNuBApiGUvr9RDA90pSN8FYdIR+WPGMXHZdYyn+JXoQ3cxOPz+f8IbzDcQKrELLNl/zGJ/Gu+smvu/l50XzNYIwWHpnKQiahnHJxlsJEU0QnafpX0gGNWy2btxUE0100WEz40MTObgWhDpYOohxntxdNAO+9JI+vGa25HlG/2a/YiXSuqVrJZq82KWbpUlEzG/D+ec1kGIxg9mU4tGNHaiFeA+tv1GPvWjKsF8/HU2IlbjZViKPEks0NaotzwdYEDZeNoIZNp65MeGkCRTZREAsltF10EQ4vgJHp17kENd6cY5Dc/wsxPVO47zgbxQq3CjGWzHcuMFfxEJ/oBCNCnezGVs0q80b4h9nuFfuv1/OxN48gmaRH2yxR3F+Dq3WYon2zm/NcN4ZW2B91wtnlWZZfbPJ0izd/ct3WbNg9TKLwxKm+eXj21kWdt3cdN5kDcUNCOcXarEN+OByKTUPHVz+veVfrzQe9ObCvV5bmx9QCBpDEcWShYmSAvMJdH0zDEET/f4y8zRfVxPRyFQhxRIGJCGaCP4WEgG6SWvFsne4QUygVzad1492v9EyiWVrv6xfXuuFxttGD6B+T3VevouaX2zFKoZYrn03coauzw/Oa91KMP9mwSxAuWgeiLf05Zen4pcewPMCXfz+8ubK5sVr5vPUSxZZr8C1er3pvJH51Pp627lk3NEK6yDnD+pm/q3lbDEL3ph4n/Z7kfdwCTxuJQLvm1/qxqPQm029bKKKXrAISxY9bPzWi1jX5qEb4XImCNG0eOENBMkKjI4sZrB/sbLsdeaR97JnjeeXzaZTi6bGTtH0wCtsA72sr77ZzV3ciMuD0Ou1VYpmEjex7Jxe2Vw3Ow96xQdpsL8LvSK/ihAsmk7ZyH0jlpnf5Rqh33vzChk9o1x5fPuNkx36pg7Oip+L3O9GrWVFI6OvU2XRFHQ331eIZQ8i9PWJ8Kavrx/4KxrZdX1doeq9c4fL0rd6UXOvN6HiOqel2eqJZQXXG+UqV9IJ0Qwi0jc3lTd7j5UEtuJ1Gkssl9uz+YB0MegWC/HUQplLCJZNRVs8e8T7M4/Ltem6XfQLmaFGHNbkAC3JTy5ZCLEkTFpps7y/wcRLA8Ow8Qw3E9qN/+0fVxxcEnTp5btU3KgOpa//Z7GSP7j8bNArHuRLcI/vO165AUmtWG76r/eUV1Sg97l+i4XU688Ood8PxyDvy4T+Akcn/18a9hDxp6mPgAAAAABJRU5ErkJggg==", "goalblock": "data:image/png;base64,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", "megaplate": "data:image/png;base64,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", "longthrow": "data:image/png;base64,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", "pkmswitch": "data:image/png;base64,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"};

(function injectV540DeckTabStyles() {
  if (document.getElementById("v540-deck-styles")) return;
  const st = document.createElement("style");
  st.id = "v540-deck-styles";
  st.textContent = `
    #hub-deck-showcase {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 6px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      margin-bottom: 8px !important;
    }
    .deck-slot-card-v540 {
      background: linear-gradient(180deg, #15254a 0%, #091124 70%, #050914 100%);
      border: 1.5px solid rgba(56, 189, 248, 0.55);
      border-radius: 9px;
      padding: 5px 5px 4px;
      position: relative;
      cursor: pointer;
      box-sizing: border-box;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.14);
      transition: transform 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
    }
    .deck-slot-card-v540.selected-slot {
      border: 2px solid #facc15;
      background: linear-gradient(180deg, #1e3264 0%, #0d1832 70%, #070c1a 100%);
      box-shadow: 0 0 12px rgba(250, 204, 21, 0.68), inset 0 1px 0 rgba(254, 240, 138, 0.35);
      transform: translateY(-1px);
    }
    .deck-slot-top-row {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2px;
      margin-bottom: 2px;
    }
    .deck-slot-num-tag {
      font-size: 7.5px;
      font-weight: 900;
      color: #93c5fd;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 4px;
      padding: 0.5px 3.5px;
    }
    .deck-slot-card-v540.selected-slot .deck-slot-num-tag {
      background: #facc15;
      color: #090d16;
      border-color: #fef08a;
    }
    .deck-wheel-minibar {
      width: 94%;
      height: 4px;
      border-radius: 99px;
      overflow: hidden;
      display: flex;
      border: 1px solid rgba(255,255,255,0.22);
      margin: 2px 0 3px;
      background: #0f172a;
    }
    #deck-plates-selector {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 5px !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }
    .plate-card-v540 {
      background: linear-gradient(180deg, #131c31 0%, #090d18 100%);
      border: 1.5px solid #334155;
      border-radius: 8px;
      padding: 4px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      cursor: pointer;
      position: relative;
      min-width: 0;
      box-sizing: border-box;
      transition: transform 0.12s ease, border-color 0.12s ease;
    }
    .plate-card-v540.plate-equipped {
      background: linear-gradient(180deg, #0c3b60 0%, #082038 65%, #061324 100%);
      border: 1.5px solid #38bdf8;
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.45), inset 0 1px 0 rgba(186, 230, 253, 0.35);
    }
    .plate-card-v540.plate-exceeds {
      opacity: 0.48;
      border-color: #1e293b;
      background: #070b14;
    }
    .figcase-toolbar-v540 {
      background: rgba(7, 13, 25, 0.92);
      border: 1px solid rgba(56, 189, 248, 0.28);
      border-radius: 8px;
      padding: 6px;
      margin-bottom: 6px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .figcase-chip-row {
      display: flex;
      gap: 3px;
      flex-wrap: wrap;
      align-items: center;
    }
    .figcase-chip {
      background: #0f172a;
      border: 1px solid #334155;
      color: #cbd5e1;
      border-radius: 5px;
      padding: 2.5px 6px;
      font-size: 7.8px;
      font-weight: 800;
      cursor: pointer;
    }
    .figcase-chip.active-chip {
      background: linear-gradient(180deg, #0ea5e9, #0284c7);
      border-color: #bae6fd;
      color: #ffffff;
      box-shadow: 0 0 7px rgba(14, 165, 233, 0.5);
    }
    .collection-grid-3col {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 5px !important;
    }
    .collection-grid-2col {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 6px !important;
    }
    #plates-tray {
      display: none !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      inset: 0 !important;
      transform: none !important;
      width: 100vw !important;
      max-width: 100vw !important;
      height: 100vh !important;
      margin: 0 !important;
      padding: 18px 14px !important;
      box-sizing: border-box !important;
      border-radius: 0 !important;
      border: none !important;
      background: rgba(4, 8, 18, 0.90) !important;
      backdrop-filter: blur(4px) !important;
      z-index: 950 !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 12px !important;
    }
    #plates-tray.show {
      display: flex !important;
    }
    #plate-featured-card {
      width: 215px !important;
      min-height: 230px !important;
      margin: 0 auto !important;
      box-sizing: border-box !important;
      border: 2px solid #38bdf8 !important;
      box-shadow: 0 0 24px rgba(56, 189, 248, 0.38), 0 10px 30px rgba(0, 0, 0, 0.95) !important;
    }
    #plates-grid {
      display: flex !important;
      flex-wrap: wrap !important;
      justify-content: center !important;
      align-items: stretch !important;
      gap: 8px !important;
      width: 100% !important;
      max-width: 360px !important;
      margin: 4px auto !important;
      padding: 6px 4px !important;
      box-sizing: border-box !important;
      overflow-x: visible !important;
    }
  `;
  document.head.appendChild(st);
})();

let figureCaseRoleFilter = "ALL";   // ALL | MP3 | MP2 | MP1 | IN_DECK
let figureCaseSortMode   = "TEAM";  // TEAM | RARITY | DMG | LEVEL | MP | NAME
let figureCaseViewCols   = 3;       // 3 (compact 3-col) or 2 (detailed 2-col)

function setFigureCaseRoleFilter(role) {
  figureCaseRoleFilter = role;
  collectionCurrentPage = 0;
  playSfx("tick");
  renderHubAndCollection();
}

function setFigureCaseSortMode(mode) {
  figureCaseSortMode = mode;
  collectionCurrentPage = 0;
  playSfx("tick");
  renderHubAndCollection();
}

function toggleFigureCaseViewCols(cols) {
  figureCaseViewCols = cols;
  collectionCurrentPage = 0;
  playSfx("tick");
  renderHubAndCollection();
}

function getWheelColorBarHtml(wheel) {
  const wList = Array.isArray(wheel) ? wheel : [];
  const colorHex = {
    white: "#f8fafc",
    gold: "#facc15",
    purple: "#c084fc",
    blue: "#38bdf8",
    red: "#ef4444"
  };
  return `<div class="deck-wheel-minibar">` + wList.map(s => {
    const pct = Math.max(2, Math.round(((s.size || 8) / 96) * 100));
    const col = colorHex[s.color] || "#f8fafc";
    return `<div style="width:${pct}%; background:${col}; height:100%;"></div>`;
  }).join("") + `</div>`;
}

function getFigureMaxDmg(f) {
  if (!f || !Array.isArray(f.wheel)) return 0;
  const baseMax = f.wheel.reduce((m, s) => Math.max(m, s.dmg || 0), 0);
  const wBonus = (baseMax > 0 && typeof hasWeeklyTypeBuff === "function" && hasWeeklyTypeBuff(f)) ? 10 : 0;
  return baseMax + wBonus;
}

function getRarityRankScore(rar) {
  const map = { UX: 5, EX: 4, R: 3, UC: 2, C: 1 };
  return map[rar] || 0;
}

function autoBuildBalancedTeamV540() {
  playSfx("portal");
  ensureFigureCopiesMap();
  const unlockedIdxList = (playerProgression && Array.isArray(playerProgression.unlockedFigures))
    ? [...playerProgression.unlockedFigures]
    : [1, 2, 3, 4, 6, 0];

  const scored = [];
  unlockedIdxList.forEach(idx => {
    const f = FIGURES_DB[idx % FIGURES_DB.length] || FIGURES_DB[0];
    const maxDmg = getFigureMaxDmg(f);
    const rScore = getRarityRankScore(f.rarity);
    const goldSz = (f.wheel || []).filter(w => w.color === "gold").reduce((s, w) => s + (w.size || 0), 0);
    const purpSz = (f.wheel || []).filter(w => w.color === "purple").reduce((s, w) => s + (w.size || 0), 0);
    const totalScore = rScore * 28 + maxDmg * 0.65 + (f.level || 1) * 6 + (f.clv || 0) * 8 + goldSz * 0.4 + purpSz * 0.35;
    const owned = getOwnedFigureUnits(idx);
    for (let u = 0; u < owned; u++) {
      scored.push({ idx, f, mp: f.mp, totalScore: totalScore - u * 4, copyIdx: u });
    }
  });
  scored.sort((a, b) => b.totalScore - a.totalScore);

  const picked = [];
  let megas = 0, uxs = 0, exs = 0;
  const usedCounts = {};

  const canPickCandidate = (c) => {
    const curUsed = usedCounts[c.idx] || 0;
    if (curUsed + 1 > getOwnedFigureUnits(c.idx)) return false;
    const cat = getFigureDeckCategory(c.f);
    if (cat === "MEGA" && megas + 1 > MAX_DECK_MEGAS) return false;
    if (cat === "UX" && uxs + 1 > MAX_DECK_UX) return false;
    if (cat === "EX" && exs + 1 > MAX_DECK_EX) return false;
    return true;
  };

  const commitCandidate = (c) => {
    picked.push(c.idx);
    usedCounts[c.idx] = (usedCounts[c.idx] || 0) + 1;
    const cat = getFigureDeckCategory(c.f);
    if (cat === "MEGA") megas++;
    else if (cat === "UX") uxs++;
    else if (cat === "EX") exs++;
  };

  const pickBy = (fn, preferDistinct = true) => {
    for (const c of scored) {
      if (preferDistinct && (usedCounts[c.idx] || 0) > 0) continue;
      if (canPickCandidate(c) && fn(c)) {
        commitCandidate(c);
        return;
      }
    }
    if (preferDistinct) {
      for (const c of scored) {
        if (canPickCandidate(c) && fn(c)) {
          commitCandidate(c);
          return;
        }
      }
    }
  };

  pickBy(c => c.mp >= 3);
  pickBy(c => c.mp >= 3);
  pickBy(c => c.mp === 2);
  pickBy(c => c.mp === 2);
  pickBy(c => c.mp === 2);
  let guard = 0;
  while (picked.length < 6 && guard++ < 20) {
    pickBy(() => true, false);
  }
  while (picked.length < 6) {
    picked.push(STARTER_TEAM_INDICES[picked.length % STARTER_TEAM_INDICES.length]);
  }
  sanitizeTeamSlotsForBalance(picked);
  state.deckP1 = picked.slice(0, 6);

  if (playerProgression && playerProgression.teams && playerProgression.teams[playerProgression.activeTeamIdx]) {
    playerProgression.teams[playerProgression.activeTeamIdx].slots = [...state.deckP1];
    saveProgressionState();
  }
  setDeckStatusBannerMsg("⚡ Time Ideal Balanceado Montado (Respeitando Máx 1 Mega · 1 UX · 2 EX)!", "#4ade80");
  demoFullMatchState();
  renderHubAndCollection();
}

refreshStrictPlateCaseUI = function() {
  const pSel = document.getElementById("deck-plates-selector");
  const pBar = document.getElementById("plate-cost-bar");
  if (!pSel || !state.plates) return;
  const activePlates = state.plates.filter(p => !p.disabledInDeck);
  const usedCost = activePlates.reduce((a, p) => a + p.cost, 0);
  const remBudget = Math.max(0, MAX_DECK_PLATE_COST - usedCost);

  if (pBar) {
    pBar.innerHTML = `<span style="color:${usedCost === 6 ? '#4ade80' : '#fde047'};">COST ${usedCost}/6</span> <span style="letter-spacing:1px; color:#38bdf8;">${"◆".repeat(Math.min(6, usedCost))}${"◇".repeat(remBudget)}</span> <button onclick="event.stopPropagation(); clearAllDeckPlates();" style="margin-left:4px; background:#1e293b; border:1px solid #475569; color:#cbd5e1; border-radius:4px; padding:1px 5px; font-size:7px; font-weight:900; cursor:pointer;" title="Limpar todas as Plates equipadas">🔄 Limpar</button>`;
  }

  pSel.innerHTML = BASE_PLATE_CATALOG.map((baseP, pIdx) => {
    const info = getEquippedPlateCopiesInfo(baseP.id);
    const active = info.count > 0;
    const canAddNext = (usedCost + info.nextCopyCost) <= MAX_DECK_PLATE_COST;
    const exceeds = !active && !canAddNext;
    const spUri = BANANA_PLATE_SPRITES[baseP.id] || "";
    const statusBadge = active
      ? `<span style="background:#22c55e; color:#052e16; font-size:6.8px; font-weight:900; padding:0.5px 4px; border-radius:99px;">✓ x${info.count} (${info.totalCost}◆)</span>`
      : (exceeds
          ? `<span style="background:#334155; color:#94a3b8; font-size:6.8px; font-weight:900; padding:0.5px 4px; border-radius:99px;">🔒 ${info.nextCopyCost}◆</span>`
          : `<span style="background:#1e293b; color:#bae6fd; font-size:6.8px; font-weight:800; padding:0.5px 4px; border-radius:99px;">+ ${info.nextCopyCost}◆</span>`);

    const nextCostHint = info.count > 0
      ? (canAddNext
          ? `<span style="color:#fde047; font-weight:900;">+${info.count + 1}ª cópia: ${info.nextCopyCost}◆ (2x)</span>`
          : `<span style="color:#64748b;">+${info.count + 1}ª: ${info.nextCopyCost}◆ (2x)</span>`)
      : `<span style="color:#94a3b8;">1ª: ${baseP.baseCost}◆ · 2ª: ${baseP.baseCost * 2}◆</span>`;

    return `<div class="plate-card-v540 ${active ? 'plate-equipped' : ''} ${exceeds ? 'plate-exceeds' : ''}" onclick="togglePlateInDeck('${baseP.id}')">
      <div style="width:100%; display:flex; justify-content:space-between; align-items:center; margin-bottom:1px;">
        <span style="font-size:6.9px; font-weight:900; color:#fde047;">Base ${baseP.baseCost}◆</span>
        ${statusBadge}
      </div>
      <div style="width:38px; height:38px; display:flex; align-items:center; justify-content:center; margin:1px 0;">
        ${spUri
          ? `<img src="${spUri}" style="width:38px; height:38px; object-fit:contain; filter:drop-shadow(0 2px 5px rgba(0,0,0,0.85));">`
          : `<div style="font-size:15px;">${baseP.badge || '⚡'}</div>`}
      </div>
      <div style="font-size:7.8px; font-weight:900; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">${baseP.name}</div>
      <div style="font-size:6.4px; line-height:1.15; width:100%; margin:1px 0;">${nextCostHint}</div>
      <div style="display:flex; width:100%; gap:3px; margin-top:2px;">
        <button onclick="event.stopPropagation(); removePlateCopyFromDeck('${baseP.id}');" ${info.count > 0 ? '' : 'disabled'} style="flex:1; background:${info.count > 0 ? '#7f1d1d' : '#0f172a'}; border:1px solid ${info.count > 0 ? '#f87171' : '#334155'}; color:${info.count > 0 ? '#fff' : '#475569'}; border-radius:4px; font-size:7.2px; font-weight:900; padding:1.5px 0; cursor:${info.count > 0 ? 'pointer' : 'not-allowed'};">➖</button>
        <button onclick="event.stopPropagation(); addPlateCopyToDeck('${baseP.id}');" ${canAddNext ? '' : 'disabled'} style="flex:1.4; background:${canAddNext ? '#0284c7' : '#0f172a'}; border:1px solid ${canAddNext ? '#7dd3fc' : '#334155'}; color:${canAddNext ? '#fff' : '#475569'}; border-radius:4px; font-size:7px; font-weight:900; padding:1.5px 0; cursor:${canAddNext ? 'pointer' : 'not-allowed'};">+${info.nextCopyCost}◆</button>
      </div>
    </div>`;
  }).join("");
};

const _v531RenderPlatesTray = renderPlatesTray;
renderPlatesTray = function() {
  _v531RenderPlatesTray();
  const equipped = state.plates.map((p, idx) => ({ p, idx })).filter(item => !item.p.disabledInDeck);
  if (equipped.length === 0) return;
  const selIdx = state.selectedPlateIdx;
  const curP = state.plates[selIdx] || equipped[0].p;
  const cBdg = document.getElementById("pcard-badge");
  const cName = document.getElementById("pcard-name");
  if (cName && curP) {
    cName.textContent = (curP.totalCopiesEquipped > 1) ? `${curP.name} #${curP.copyNumber || 1}` : curP.name;
  }
  if (cBdg && curP && BANANA_PLATE_SPRITES[curP.id]) {
    cBdg.style.background = "radial-gradient(circle, rgba(56,189,248,0.28) 0%, rgba(15,23,42,0.95) 100%)";
    cBdg.style.borderColor = "#38bdf8";
    cBdg.innerHTML = `<img src="${BANANA_PLATE_SPRITES[curP.id]}" style="width:66px; height:66px; object-fit:contain; filter:drop-shadow(0 0 8px rgba(56,189,248,0.65));">`;
  }
  const grid = document.getElementById("plates-grid");
  if (grid) {
    grid.innerHTML = "";
    equipped.forEach(({ p, idx }) => {
      const spUri = BANANA_PLATE_SPRITES[p.id];
      const div = document.createElement("div");
      div.className = `plate-card ${p.used ? "used" : ""} ${selIdx === idx ? "active" : ""}`;
      div.style.minWidth = "80px";
      div.style.textAlign = "center";
      const copyTag = (p.totalCopiesEquipped > 1) ? ` #${p.copyNumber || 1}` : "";
      div.innerHTML = `
        <span class="p-cost">${p.cost}◆ · ${p.rarity || "C"}</span>
        <div style="height:36px; display:flex; align-items:center; justify-content:center; margin:2px 0;">
          ${spUri ? `<img src="${spUri}" style="width:34px; height:34px; object-fit:contain;">` : `<span style="font-size:12px; font-weight:900; color:#f97316;">${p.badge || "+20"}</span>`}
        </div>
        <div class="p-title" style="font-size:8.2px;">${p.name}${copyTag}</div>
      `;
      div.onclick = () => {
        state.selectedPlateIdx = idx;
        playSfx("tick");
        renderPlatesTray();
      };
      grid.appendChild(div);
    });
  }
};

function ensureV540FigureCaseToolbar() {
  const searchInp = document.getElementById("collection-search-inp");
  if (!searchInp || document.getElementById("v540-figcase-toolbar")) return;
  const parentCard = searchInp.closest(".card");
  if (!parentCard) return;

  const firstHeaderDiv = parentCard.querySelector("div");
  if (firstHeaderDiv) {
    firstHeaderDiv.style.display = "none";
  }

  const tb = document.createElement("div");
  tb.id = "v540-figcase-toolbar";
  tb.className = "figcase-toolbar-v540";
  parentCard.insertBefore(tb, searchInp.parentNode);
}

function renderWeeklyTypeBuffHubBadge() {
  if (typeof getWeeklyBuffState !== "function") return;
  const wb = getWeeklyBuffState();
  const badge = document.getElementById("weekly-type-buff-hub-badge");
  const iconEl = document.getElementById("wtb-hub-icon");
  const typeEl = document.getElementById("wtb-hub-type");
  const statsEl = document.getElementById("wtb-hub-stats");
  const timerEl = document.getElementById("wtb-hub-timer");
  if (badge) {
    badge.style.background = wb.meta.bg;
    badge.style.borderColor = wb.meta.border;
  }
  if (iconEl) iconEl.textContent = wb.meta.icon;
  if (typeEl) typeEl.textContent = `TIPO: ${wb.meta.pt.toUpperCase()}`;
  if (statsEl) statsEl.textContent = `+${wb.dmgBonus} DMG · +${wb.starBonus}★ · +${wb.mpBonus} MP`;
  if (timerEl) timerEl.textContent = `⏳ ${wb.remainingLabel} restantes`;
}

function openWeeklyBuffInfoModal() {
  if (typeof playSfx === "function") playSfx("tick");
  if (typeof getWeeklyBuffState !== "function") return;
  const wb = getWeeklyBuffState();
  const modal = document.getElementById("weekly-buff-info-modal");
  const card = document.getElementById("wtb-modal-card");
  const iconEl = document.getElementById("wtb-modal-icon");
  const titleEl = document.getElementById("wtb-modal-title");
  const subEl = document.getElementById("wtb-modal-subtitle");
  const bodyEl = document.getElementById("wtb-modal-body");
  if (!modal) return;
  if (card) {
    card.style.borderColor = wb.meta.border;
  }
  if (iconEl) iconEl.textContent = wb.meta.icon;
  if (titleEl) titleEl.textContent = `BUFF DA SEMANA: ${wb.meta.pt.toUpperCase()} (${wb.meta.id.toUpperCase()})`;
  if (subEl) subEl.textContent = `⏳ Tempo restante nesta semana: ${wb.remainingLabel}`;
  if (bodyEl) {
    const buffedFigs = (typeof FIGURES_DB !== "undefined" ? FIGURES_DB : [])
      .map((f, idx) => ({ f, idx }))
      .filter(item => typeof hasWeeklyTypeBuff === "function" && hasWeeklyTypeBuff(item.f));
    const listHtml = buffedFigs.map(({ f, idx }) => {
      const unlocked = isFigureUnlocked(idx);
      const inDeck = state.deckP1 && state.deckP1.includes(idx);
      const effMp = typeof getFigureEffectiveMp === "function" ? getFigureEffectiveMp(f) : (f.mp + 1);
      return `<span onclick="closeWeeklyBuffInfoModal(); openFigureDetailsModal(${idx});" style="cursor:pointer; padding:3px 6px; border-radius:5px; font-size:8.5px; font-weight:800; background:${inDeck ? '#713f12' : (unlocked ? '#1e293b' : '#090d16')}; border:1px solid ${inDeck ? '#facc15' : (unlocked ? '#4ade80' : '#334155')}; color:${unlocked ? '#ffffff' : '#64748b'};">
        ${inDeck ? '★ ' : (unlocked ? '✅ ' : '🔒 ')}${f.name} (MP ${f.mp}➔${effMp})
      </span>`;
    }).join("");
    bodyEl.innerHTML = `
      <div style="background:${wb.meta.bg}; border:1.5px solid ${wb.meta.border}; border-radius:8px; padding:9px 10px;">
        <div style="font-size:11px; font-weight:900; color:#fde047; margin-bottom:4px;">${wb.meta.icon} Todos os Pokémon de ${wb.meta.pt} ganham nesta semana:</div>
        <div style="display:flex; flex-direction:column; gap:4px; font-size:10px; font-weight:800; color:#ffffff;">
          <div>💥 <span style="color:#fef08a;">+10 de Dano Extra</span> em todos os ataques da roleta</div>
          <div>🟣 <span style="color:#e9d5ff;">+1 Estrela (★) Extra</span> em todos os ataques Roxos</div>
          <div>🏃 <span style="color:#86efac;">+1 MP Extra</span> de movimento no tabuleiro</div>
        </div>
      </div>
      <div style="font-size:9px; color:#cbd5e1; line-height:1.35; background:rgba(15,23,42,0.85); border:1px solid #334155; border-radius:6px; padding:7px 9px;">
        🔄 <strong>Como funciona:</strong> Ao final dos 7 dias (faltam <strong>${wb.remainingLabel}</strong>), os Pokémon de <strong>${wb.meta.pt}</strong> voltam aos atributos originais e um novo elemento é sorteado aleatoriamente para a próxima semana!
      </div>
      <div>
        <div style="font-size:9.5px; font-weight:900; color:#93c5fd; margin-bottom:5px;">Pokémon do Tipo ${wb.meta.pt} (${buffedFigs.length}):</div>
        <div style="display:flex; flex-wrap:wrap; gap:4px;">${listHtml}</div>
      </div>
    `;
  }
  modal.style.display = "flex";
}

function closeWeeklyBuffInfoModal() {
  const modal = document.getElementById("weekly-buff-info-modal");
  if (modal) modal.style.display = "none";
}

window.renderWeeklyTypeBuffHubBadge = renderWeeklyTypeBuffHubBadge;
window.openWeeklyBuffInfoModal = openWeeklyBuffInfoModal;
window.closeWeeklyBuffInfoModal = closeWeeklyBuffInfoModal;
setInterval(() => { renderWeeklyTypeBuffHubBadge(); }, 30000);

renderHubAndCollection = function() {
  syncProgressionToDeckState();
  enforceStrict6CostPlates();
  ensureV540FigureCaseToolbar();
  renderWeeklyTypeBuffHubBadge();

  const rmEl = document.getElementById("rm-lbl");
  if (rmEl) rmEl.textContent = state.rareMetals;
  const ccEl = document.getElementById("cc-lbl");
  if (ccEl) ccEl.textContent = state.chainCubes;

  const progLbl = document.getElementById("collection-progress-lbl");
  if (progLbl) {
    progLbl.textContent = `🔓 Coleção: ${playerProgression.unlockedFigures.length}/${FIGURES_DB.length} Pokémon · ${playerProgression.teams.length} ${playerProgression.teams.length === 1 ? 'Time' : 'Times'} · 🏆 Vitórias: ${playerProgression.matchesWon || 0}`;
  }
  const vBtn = document.getElementById("deck-victory-box-btn");
  if (vBtn) {
    const vBoxes = playerProgression.victoryBoxesWon || 0;
    vBtn.style.display = vBoxes > 0 ? "inline-block" : "none";
    vBtn.textContent = `🎁 Abrir Caixa de Vitória (${vBoxes})`;
  }

  const pBarEl = document.getElementById("deck-presets-bar");
  if (pBarEl) {
    const maxTeams = 3;
    const canAdd = playerProgression.teams.length < maxTeams;
    const canDelete = playerProgression.teams.length > 1;
    const curTeam = playerProgression.teams[playerProgression.activeTeamIdx] || playerProgression.teams[0] || { name: "Time #1" };
    const bal = countDeckBalanceStats(state.deckP1);

    const teamBtns = playerProgression.teams.map((t, i) => {
      const isAct = (i === playerProgression.activeTeamIdx);
      return `<button class="btn ${isAct ? 'gold' : 'secondary'}" style="padding:3px 7px; font-size:8px;" onclick="switchDeckPreset(${i})">⚔️ ${t.name}</button>`;
    }).join("");
    const addBtn = canAdd
      ? `<button class="btn secondary" style="padding:3px 6px; font-size:7.8px; border-style:dashed;" onclick="createNewTeamSlot()" title="Criar novo time (máximo 3)">➕ Time (${playerProgression.teams.length}/3)</button>`
      : `<span style="padding:3px 6px; font-size:7.5px; color:#94a3b8; font-weight:800; border:1px solid #334155; border-radius:4px; background:rgba(0,0,0,0.3);">🔒 3/3 Times</span>`;
    const autoBtn = `<button class="btn green" style="padding:3px 6px; font-size:7.8px;" onclick="autoBuildBalancedTeamV540()" title="Monta automaticamente o melhor time com seus Pokémon desbloqueados">⚡ Auto-Time</button>`;

    const wbDeck = (typeof getWeeklyBuffState === "function") ? getWeeklyBuffState() : null;
    const wbDeckRow = wbDeck ? `
      <div onclick="openWeeklyBuffInfoModal()" style="cursor:pointer; width:100%; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px; margin-top:4px; padding:3px 6px; border-radius:6px; background:${wbDeck.meta.bg}; border:1px solid ${wbDeck.meta.border};">
        <span style="font-size:7.6px; font-weight:900; color:#fde047;">${wbDeck.meta.icon} Buff Semanal: <strong>${wbDeck.meta.pt.toUpperCase()}</strong></span>
        <span style="font-size:7.2px; font-weight:900; color:#ffffff;">+${wbDeck.dmgBonus} DMG · +${wbDeck.starBonus}★ Roxo · +${wbDeck.mpBonus} MP (⏳${wbDeck.remainingLabel})</span>
      </div>
    ` : "";

    const manageBar = `
      <div style="width:100%; display:flex; justify-content:space-between; align-items:center; margin-top:3px; padding-top:3px; border-top:1px solid rgba(56,189,248,0.2);">
        <div style="display:flex; align-items:center; gap:4px;">
          <span style="font-size:8px; color:#93c5fd; font-weight:800; max-width:85px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${curTeam.name}">${curTeam.name}:</span>
          <button class="btn secondary" style="padding:2px 6px; font-size:7.8px; color:#38bdf8;" onclick="promptRenameActiveTeam()" title="Mudar nome do time atual">✏️ Renomear</button>
          <button class="btn" style="padding:2px 6px; font-size:7.8px; background:${canDelete ? '#991b1b' : '#334155'}; border:1px solid ${canDelete ? '#f87171' : '#475569'}; color:${canDelete ? '#fff' : '#64748b'}; cursor:${canDelete ? 'pointer' : 'not-allowed'};" onclick="deleteActiveTeamPrompt()" ${canDelete ? '' : 'disabled'} title="${canDelete ? 'Excluir este time' : 'Mínimo de 1 time obrigatório'}">🗑️ Excluir</button>
        </div>
        <span style="font-size:7.8px; color:#facc15; font-weight:800;">Limite: ${playerProgression.teams.length}/3</span>
      </div>
      <div style="width:100%; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px; margin-top:4px; padding:3px 6px; border-radius:6px; background:rgba(15,23,42,0.92); border:1px solid rgba(250,204,21,0.38);">
        <span style="font-size:7.6px; font-weight:900; color:#fde047;">⚖️ Regras do Deck:</span>
        <div style="display:flex; gap:4px; align-items:center; flex-wrap:wrap;">
          <span style="font-size:7.4px; font-weight:900; padding:1px 5px; border-radius:4px; background:${bal.megas >= MAX_DECK_MEGAS ? '#581c87' : '#1e293b'}; border:1px solid ${bal.megas >= MAX_DECK_MEGAS ? '#e879f9' : '#475569'}; color:#f5d0fe;">🔥 Mega: ${bal.megas}/${MAX_DECK_MEGAS}</span>
          <span style="font-size:7.4px; font-weight:900; padding:1px 5px; border-radius:4px; background:${bal.uxs >= MAX_DECK_UX ? '#3b0764' : '#1e293b'}; border:1px solid ${bal.uxs >= MAX_DECK_UX ? '#c084fc' : '#475569'}; color:#e9d5ff;">💎 UX: ${bal.uxs}/${MAX_DECK_UX}</span>
          <span style="font-size:7.4px; font-weight:900; padding:1px 5px; border-radius:4px; background:${bal.exs >= MAX_DECK_EX ? '#713f12' : '#1e293b'}; border:1px solid ${bal.exs >= MAX_DECK_EX ? '#facc15' : '#475569'}; color:#fef08a;">⭐ EX: ${bal.exs}/${MAX_DECK_EX}</span>
          <span style="font-size:7.2px; font-weight:800; color:#4ade80;">📦 R/UC/C & Repetidos: Livre</span>
        </div>
      </div>
      ${wbDeckRow}
    `;

    pBarEl.innerHTML = `<div style="display:flex; gap:4px; flex-wrap:wrap; align-items:center;">` + teamBtns + addBtn + autoBtn + `</div>` + manageBar;
  }

  const indEl = document.getElementById("editing-slot-indicator");
  if (indEl) {
    if (_lastDeckStatusOverrideMsg) {
      indEl.style.color = _lastDeckStatusOverrideColor || "#fde047";
      indEl.textContent = _lastDeckStatusOverrideMsg;
      _lastDeckStatusOverrideMsg = "";
    } else {
      const curFigIdx = state.deckP1[currentEditingDeckSlot % 6];
      const curFig = FIGURES_DB[curFigIdx % FIGURES_DB.length];
      indEl.style.color = "#fde047";
      indEl.textContent = `Editando Slot #${(currentEditingDeckSlot % 6) + 1} (${curFig ? curFig.name : ''})`;
    }
  }

  const showcase = document.getElementById("hub-deck-showcase");
  if (showcase) {
    const wbCur = (typeof getWeeklyBuffState === "function") ? getWeeklyBuffState() : null;
    showcase.innerHTML = state.deckP1.slice(0, 6).map((idx, slotPos) => {
      const f = FIGURES_DB[idx % FIGURES_DB.length] || FIGURES_DB[0];
      const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
      const evoTarget = (typeof getFigureEvolutionTarget === "function") ? getFigureEvolutionTarget(f) : null;
      const isSelSlot = (slotPos === (currentEditingDeckSlot % 6));
      const maxDmg = getFigureMaxDmg(f);
      const isWb = typeof hasWeeklyTypeBuff === "function" && hasWeeklyTypeBuff(f);
      const effMp = typeof getFigureEffectiveMp === "function" ? getFigureEffectiveMp(f) : f.mp;
      const roleIcon = effMp >= 3 ? "🏃" : (effMp === 2 ? "⚔️" : "🛡️");
      const zm = (typeof getFigureZMove === "function") ? getFigureZMove(f) : null;
      const zmPower = zm ? (zm.color === "purple" ? "★".repeat(zm.stars || 4) : `${zm.dmg || 200}`) : "";
      const isMega = isMegaPokemonFigure(f);
      const copiesInDeck = getEquippedFigureCount(idx, state.deckP1);
      const ownedUnits = getOwnedFigureUnits(idx);

      return `<div class="deck-slot-card-v540 ${isSelSlot ? 'selected-slot' : ''}" onclick="selectDeckSlotToEdit(${slotPos})">
        <div class="deck-slot-top-row">
          <span class="deck-slot-num-tag">#${slotPos + 1}</span>
          <div style="display:flex; align-items:center; gap:2px;">
            ${getRarityBadgeHtml(f.rarity)}
            ${isMega ? `<span style="background:#db2777; color:#fff; font-size:6.2px; font-weight:900; padding:0.5px 3px; border-radius:3px;">MEGA</span>` : ''}
            ${isWb && wbCur ? `<span style="background:#d97706; color:#fff; font-size:6.2px; font-weight:900; padding:0.5px 3px; border-radius:3px;" title="Buff da Semana Ativo (+10 DMG, +1★, +1 MP)">${wbCur.meta.icon}</span>` : ''}
            ${copiesInDeck > 1 ? `<span style="background:#0284c7; color:#fff; font-size:6.2px; font-weight:900; padding:0.5px 3px; border-radius:3px;">📦${copiesInDeck}/${ownedUnits}</span>` : ''}
          </div>
          <span onclick="event.stopPropagation(); openFigureDetailsModal(${idx});" style="font-size:8.5px; color:#7dd3fc; font-weight:900; padding:0 2px;">ⓘ</span>
        </div>
        <img src="${sp.uri}" style="width:44px; height:44px; object-fit:contain; margin:1px 0; filter:drop-shadow(0 3px 5px rgba(0,0,0,0.8));">
        <div style="font-size:8.6px; font-weight:900; color:#ffffff; width:100%; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${f.name}</div>
        <div style="font-size:7.2px; font-weight:800; color:#fde047; margin-top:0.5px;">${roleIcon} MP ${effMp}${isWb ? '⬆️' : ''} · 💥${maxDmg} · Lv.${f.level || 1}</div>
        ${getWheelColorBarHtml(f.wheel)}
        ${zm ? `<div class="zmove-sub-slot" onclick="event.stopPropagation(); openFigureDetailsModal(${idx});" title="⚡ Z-Move: ${zm.name} (${zmPower})">⚡ ${zm.name.replace(/^⚡\s*/, "")} <span style="color:#ffffff;">(${zmPower})</span></div>` : ''}
        <div class="evo-sub-slot" onclick="event.stopPropagation(); openFigureDetailsModal(${idx});" title="Evolução">${evoTarget ? '⬆ ' + evoTarget : '★ Forma Final'}</div>
      </div>`;
    }).join("");
  }

  refreshStrictPlateCaseUI();

  const totalCount = FIGURES_DB.length;
  const unlockedCount = (playerProgression && Array.isArray(playerProgression.unlockedFigures)) ? playerProgression.unlockedFigures.length : 6;
  const lockedCount = Math.max(0, totalCount - unlockedCount);

  const tb = document.getElementById("v540-figcase-toolbar");
  if (tb) {
    const rarBtns = [
      { id: "ALL",      lbl: `Todos (${totalCount})` },
      { id: "UNLOCKED", lbl: `✅ Meus (${unlockedCount})` },
      { id: "LOCKED",   lbl: `🔒 Faltam (${lockedCount})` },
      { id: "UX",       lbl: "UX" },
      { id: "EX",       lbl: "EX" },
      { id: "R",        lbl: "R" },
      { id: "UC",       lbl: "UC" },
      { id: "C",        lbl: "C" }
    ].map(b => `<button class="figcase-chip ${figureCaseFilter === b.id ? 'active-chip' : ''}" onclick="filterFigureCase('${b.id}')">${b.lbl}</button>`).join("");

    const roleBtns = [
      { id: "ALL",     lbl: "🌐 Todos Papéis" },
      { id: "IN_DECK", lbl: "⭐ No Time" },
      { id: "MP3",     lbl: "🏃 3 MP Runners" },
      { id: "MP2",     lbl: "⚔️ 2 MP Fighters" },
      { id: "MP1",     lbl: "🛡️ 1 MP Tanks" }
    ].map(r => `<button class="figcase-chip ${figureCaseRoleFilter === r.id ? 'active-chip' : ''}" onclick="setFigureCaseRoleFilter('${r.id}')">${r.lbl}</button>`).join("");

    const sortBtns = [
      { id: "TEAM",   lbl: "⭐ Time 1º" },
      { id: "RARITY", lbl: "💎 Raridade" },
      { id: "DMG",    lbl: "💥 Maior Dano" },
      { id: "MP",     lbl: "👟 MP" },
      { id: "LEVEL",  lbl: "⬆️ Nível/CLv" },
      { id: "NAME",   lbl: "🔤 Nome A-Z" }
    ].map(s => `<button class="figcase-chip ${figureCaseSortMode === s.id ? 'active-chip' : ''}" onclick="setFigureCaseSortMode('${s.id}')">${s.lbl}</button>`).join("");

    tb.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong style="color:#38bdf8; font-size:10.5px;">📦 FIGURE CASE (${unlockedCount}/${totalCount} Desbloqueados)</strong>
        <div style="display:flex; gap:3px;">
          <button class="figcase-chip ${figureCaseViewCols === 3 ? 'active-chip' : ''}" onclick="toggleFigureCaseViewCols(3)">⊞ Grade 3x</button>
          <button class="figcase-chip ${figureCaseViewCols === 2 ? 'active-chip' : ''}" onclick="toggleFigureCaseViewCols(2)">⊟ Detalhado 2x</button>
        </div>
      </div>
      <div class="figcase-chip-row">${rarBtns}</div>
      <div class="figcase-chip-row">${roleBtns}</div>
      <div class="figcase-chip-row"><span style="font-size:7.5px; color:#94a3b8; font-weight:800; margin-right:2px;">Ordenar:</span>${sortBtns}</div>
    `;
  }

  const searchInp = document.getElementById("collection-search-inp");
  if (searchInp && searchInp.placeholder && searchInp.placeholder.includes("217")) {
    searchInp.placeholder = `🔍 Buscar entre os ${FIGURES_DB.length} Pokémon (nome, tipo, raridade)...`;
  }

  const grid = document.getElementById("collection-grid");
  if (!grid) {
    tickRealTimeBoosters();
    return;
  }
  grid.className = (figureCaseViewCols === 3) ? "collection-grid-3col" : "collection-grid-2col";

  const filteredIndices = [];
  for (let i = 0; i < FIGURES_DB.length; i++) {
    const f = FIGURES_DB[i];
    const unlocked = isFigureUnlocked(i);
    const inDeck = state.deckP1.includes(i);
    if (figureCaseFilter === "UNLOCKED" && !unlocked) continue;
    if (figureCaseFilter === "LOCKED" && unlocked) continue;
    if (figureCaseFilter !== "ALL" && figureCaseFilter !== "UNLOCKED" && figureCaseFilter !== "LOCKED" && f.rarity !== figureCaseFilter) continue;

    if (figureCaseRoleFilter === "IN_DECK" && !inDeck) continue;
    if (figureCaseRoleFilter === "MP3" && f.mp < 3) continue;
    if (figureCaseRoleFilter === "MP2" && f.mp !== 2) continue;
    if (figureCaseRoleFilter === "MP1" && f.mp > 1) continue;

    if (collectionSearchQuery) {
      const hay = `${f.name} ${f.type} ${f.rarity} #${f.dex || ''}`.toLowerCase();
      if (!hay.includes(collectionSearchQuery)) continue;
    }
    filteredIndices.push(i);
  }

  filteredIndices.sort((a, b) => {
    const fa = FIGURES_DB[a], fb = FIGURES_DB[b];
    const ua = isFigureUnlocked(a) ? 1 : 0;
    const ub = isFigureUnlocked(b) ? 1 : 0;
    const da = state.deckP1.indexOf(a);
    const db = state.deckP1.indexOf(b);
    const inA = da !== -1 ? 1 : 0;
    const inB = db !== -1 ? 1 : 0;

    if (figureCaseSortMode === "TEAM") {
      if (inA !== inB) return inB - inA;
      if (inA && inB) return da - db;
      if (ua !== ub) return ub - ua;
      return getRarityRankScore(fb.rarity) - getRarityRankScore(fa.rarity) || a - b;
    }
    if (ua !== ub) return ub - ua;
    if (figureCaseSortMode === "RARITY") {
      return getRarityRankScore(fb.rarity) - getRarityRankScore(fa.rarity) || getFigureMaxDmg(fb) - getFigureMaxDmg(fa) || a - b;
    }
    if (figureCaseSortMode === "DMG") {
      return getFigureMaxDmg(fb) - getFigureMaxDmg(fa) || getRarityRankScore(fb.rarity) - getRarityRankScore(fa.rarity);
    }
    if (figureCaseSortMode === "MP") {
      return (fb.mp || 0) - (fa.mp || 0) || getRarityRankScore(fb.rarity) - getRarityRankScore(fa.rarity);
    }
    if (figureCaseSortMode === "LEVEL") {
      const lvA = (fa.level || 1) * 10 + (fa.clv || 0);
      const lvB = (fb.level || 1) * 10 + (fb.clv || 0);
      return lvB - lvA || getRarityRankScore(fb.rarity) - getRarityRankScore(fa.rarity);
    }
    if (figureCaseSortMode === "NAME") {
      return String(fa.name).localeCompare(String(fb.name));
    }
    return a - b;
  });

  const pageSize = (figureCaseViewCols === 3) ? 24 : 18;
  const totalPages = Math.max(1, Math.ceil(filteredIndices.length / pageSize));
  if (collectionCurrentPage >= totalPages) collectionCurrentPage = totalPages - 1;
  const pageStart = collectionCurrentPage * pageSize;
  const pageItems = filteredIndices.slice(pageStart, pageStart + pageSize);

  const pagBar = document.getElementById("collection-pagination-bar");
  if (pagBar) {
    const prevText = (typeof t === "function") ? t("deck.prev", "◀ Anterior") : "◀ Anterior";
    const nextText = (typeof t === "function") ? t("deck.next", "Próxima ▶") : "Próxima ▶";
    const pageInfo = (typeof t === "function")
      ? t("deck.page_info", `Mostrando ${pageItems.length} de ${filteredIndices.length} Pokémon (Pág ${collectionCurrentPage + 1}/${totalPages})`, { count: pageItems.length, total: filteredIndices.length, page: collectionCurrentPage + 1, max: totalPages })
      : `Mostrando ${pageItems.length} de ${filteredIndices.length} Pokémon (Pág ${collectionCurrentPage + 1}/${totalPages})`;
    pagBar.innerHTML = `
      <button class="btn secondary" style="padding:2px 7px; font-size:8px;" ${collectionCurrentPage <= 0 ? 'disabled style="opacity:0.4; padding:2px 7px; font-size:8px;"' : ''} onclick="changeCollectionPage(-1)">${prevText}</button>
      <span>${pageInfo}</span>
      <button class="btn secondary" style="padding:2px 7px; font-size:8px;" ${collectionCurrentPage + 1 >= totalPages ? 'disabled style="opacity:0.4; padding:2px 7px; font-size:8px;"' : ''} onclick="changeCollectionPage(1)">${nextText}</button>
    `;
  }

  grid.innerHTML = "";
  pageItems.forEach(idx => {
    const f = FIGURES_DB[idx];
    const unlocked = isFigureUnlocked(idx);
    const ownedUnits = unlocked ? getOwnedFigureUnits(idx) : 0;
    const equippedCount = getEquippedFigureCount(idx, state.deckP1);
    const deckSlotIdx = state.deckP1.indexOf(idx);
    const inDeck = equippedCount > 0;
    const canAddMoreCopiesToDeck = unlocked && (equippedCount < ownedUnits);
    const sp = AUTHENTIC_FIG_SPRITES[f.spriteKey] || AUTHENTIC_FIG_SPRITES["pikachu"];
    const maxDmg = getFigureMaxDmg(f);
    const isWb = typeof hasWeeklyTypeBuff === "function" && hasWeeklyTypeBuff(f);
    const effMp = typeof getFigureEffectiveMp === "function" ? getFigureEffectiveMp(f) : f.mp;
    const wbMeta = (isWb && typeof getWeeklyBuffState === "function") ? getWeeklyBuffState().meta : null;
    const locType = (typeof localizeType === "function") ? localizeType(f.type) : f.type;
    const lockedLabel = (typeof t === "function") ? t("deck.locked", "🔒 Bloqueado") : "🔒 Bloqueado";
    const unlockShopLabel = (typeof t === "function") ? t("deck.unlock_in_shop", "🔒 Desbloquear na Loja") : "🔒 Desbloquear na Loja";
    const isMega = isMegaPokemonFigure(f);

    const zm = (typeof getFigureZMove === "function") ? getFigureZMove(f) : null;
    const zmPower = zm ? (zm.color === "purple" ? "★".repeat(zm.stars || 4) : `${zm.dmg || 200}`) : "";
    const zmCol = zm ? (zm.color === "purple" ? "#c084fc" : (zm.color === "gold" ? "#facc15" : "#ffffff")) : "#fde047";

    const card = document.createElement("div");
    card.className = "card";
    card.style.marginBottom = "0";
    card.style.padding = (figureCaseViewCols === 3) ? "5px" : "7px";
    card.style.opacity = unlocked ? "1.0" : "0.78";
    card.style.borderColor = inDeck ? "#facc15" : (isWb ? "#fbbf24" : (unlocked ? (f.rarity === "UX" ? "#c084fc" : "rgba(56,189,248,0.38)") : "#334155"));

    if (figureCaseViewCols === 3) {
      let slotEquipText = "";
      if (inDeck) {
        if (canAddMoreCopiesToDeck) {
          slotEquipText = `★ ${equippedCount}/${ownedUnits} (+Slot #${(currentEditingDeckSlot % 6) + 1})`;
        } else if (ownedUnits > 1) {
          slotEquipText = `★ ${equippedCount}/${ownedUnits} No Time`;
        } else {
          slotEquipText = `★ Slot #${deckSlotIdx + 1}`;
        }
      } else {
        slotEquipText = `➔ Slot #${(currentEditingDeckSlot % 6) + 1}`;
      }
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:2px;">
          <div style="display:flex; align-items:center; gap:2px;">
            ${getRarityBadgeHtml(f.rarity)}
            ${isMega ? `<span style="background:#db2777; color:#fff; font-size:6px; font-weight:900; padding:0.5px 2.5px; border-radius:3px;">MEGA</span>` : ''}
            ${isWb && wbMeta ? `<span style="background:#d97706; color:#fff; font-size:6px; font-weight:900; padding:0.5px 2.5px; border-radius:3px;" title="Buff da Semana (+10 DMG, +1★, +1 MP)">${wbMeta.icon}</span>` : ''}
          </div>
          <span style="font-size:7px; color:#fde047; font-weight:900;">MP ${effMp}${isWb ? '⬆️' : ''} · 💥${maxDmg}</span>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; margin:2px 0; cursor:pointer;" onclick="openFigureDetailsModal(${idx})">
          <img src="${sp.uri}" style="width:40px; height:40px; object-fit:contain; ${unlocked ? '' : 'filter:grayscale(0.85) brightness(0.55);'}">
          <strong style="font-size:8.2px; color:${unlocked ? '#fff' : '#94a3b8'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; text-align:center;">${unlocked ? '' : '🔒 '}${f.name}</strong>
          <span style="font-size:6.8px; color:#94a3b8;">Lv.${f.level || 1} · CLv+${f.clv || 0}${unlocked ? ` · <strong style="color:#4ade80;">📦x${ownedUnits}</strong>` : ''}</span>
          ${getWheelColorBarHtml(f.wheel)}
          ${zm ? `<div class="figcase-zmove-badge" title="⚡ Z-Move: ${zm.name} (${zmPower})">⚡ ${zm.name.replace(/^⚡\s*/, "")} (${zmPower})</div>` : ''}
        </div>
        <div style="display:flex; gap:3px; margin-top:2px;">
          ${unlocked ? `
            <button class="btn ${inDeck ? 'gold' : 'secondary'}" style="flex:1; font-size:7.2px; padding:3px 2px;" onclick="toggleDeckEquip(${idx})">
              ${slotEquipText}
            </button>
            <button class="btn purple" style="font-size:7.2px; padding:3px 4px;" onclick="fuseFigure(${idx})" title="Fusão / +CLv">⚡</button>
          ` : `
            <button class="btn secondary" style="flex:1; font-size:7px; padding:3px 2px; color:#fde047; border-color:#ca8a04;" onclick="switchDrawerTab('shop')">
              ${unlockShopLabel}
            </button>
          `}
        </div>
      `;
    } else {
      let slotEquipText = "";
      if (inDeck) {
        if (canAddMoreCopiesToDeck) {
          slotEquipText = `★ ${equippedCount}/${ownedUnits} (+Equipar Slot #${(currentEditingDeckSlot % 6) + 1})`;
        } else if (ownedUnits > 1) {
          slotEquipText = `★ ${equippedCount}/${ownedUnits} Unidades no Time`;
        } else {
          slotEquipText = `★ No Slot #${deckSlotIdx + 1}`;
        }
      } else {
        slotEquipText = `➔ Equipar Slot #${(currentEditingDeckSlot % 6) + 1}`;
      }
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:9.2px; color:${unlocked ? '#fff' : '#94a3b8'};">${unlocked ? '' : '🔒 '}${f.name}</strong>
          <div style="display:flex; align-items:center; gap:3px;">
            ${getRarityBadgeHtml(f.rarity)}
            ${isMega ? `<span style="background:#db2777; color:#fff; font-size:6.5px; font-weight:900; padding:0.5px 3px; border-radius:3px;">MEGA</span>` : ''}
            ${isWb && wbMeta ? `<span style="background:#d97706; color:#fff; font-size:6.5px; font-weight:900; padding:0.5px 3px; border-radius:3px;">${wbMeta.icon} BUFF</span>` : ''}
            <span style="font-size:7.8px; color:${isWb ? '#fde047' : '#bae6fd'}; font-weight:900;">MP ${effMp}${isWb ? '⬆️' : ''}</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:6px; margin:4px 0; cursor:pointer;" onclick="openFigureDetailsModal(${idx})">
          <img src="${sp.uri}" style="width:42px; height:42px; object-fit:contain; ${unlocked ? '' : 'filter:grayscale(0.85) brightness(0.55);'}">
          <div class="small-muted" style="flex:1; min-width:0;">
            ${unlocked ? `<span style="color:#4ade80; font-weight:800;">✅ Lv.${f.level}/10 · CLv+${f.clv} · 📦x${ownedUnits} un.</span>` : `<span style="color:#facc15; font-weight:800;">${lockedLabel}</span>`}<br>
            ${locType} · 💥Máx ${maxDmg}<br>
            ${getWheelColorBarHtml(f.wheel)}
            ${zm ? `<div style="font-size:7.2px; font-weight:900; color:${zmCol}; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="⚡ Z-Move: ${zm.name} (${zmPower})">⚡ <strong>Z-Move:</strong> ${zm.name.replace(/^⚡\s*/, "")} <span style="color:#fde047;">(${zmPower})</span></div>` : ''}
          </div>
        </div>
        <div style="display:flex; gap:4px;">
          ${unlocked ? `
            <button class="btn ${inDeck ? 'gold' : 'secondary'}" style="flex:1; font-size:7.8px; padding:3.5px;" onclick="toggleDeckEquip(${idx})">
              ${slotEquipText}
            </button>
            <button class="btn purple" style="font-size:8px; padding:3.5px 6px;" onclick="fuseFigure(${idx})">+CLv</button>
          ` : `
            <button class="btn secondary" style="flex:1; font-size:7.8px; padding:3.5px; color:#fde047; border-color:#ca8a04;" onclick="switchDrawerTab('shop')">
              ${unlockShopLabel}
            </button>
          `}
        </div>
      `;
    }
    grid.appendChild(card);
  });

  tickRealTimeBoosters();
};


// ============================================================================


// SECTION 21: v5.6.0 CLOUD SAVE BY LOGIN & PASSWORD + MONOLITHIC GITHUB PAGES
// PUBLISHER + MULTIPLATFORM PWA ENGINE & CROSS-SAVE (.pokeduel)
// ============================================================================

let deferredPwaPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
  const btn = document.getElementById("pwa-install-btn");
  if (btn) btn.style.display = "inline-block";
});

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function triggerPwaInstallPrompt() {
  playSfx("portal");
  if (deferredPwaPrompt) {
    deferredPwaPrompt.prompt();
    deferredPwaPrompt.userChoice.finally(() => { deferredPwaPrompt = null; });
    return;
  }
  setCloudStatusMsg("📱 Para instalar como App: no iPhone (Safari) toque em [Compartilhar ➔ Adicionar à Tela de Início]; no Android/PC (Chrome) use o menu [Instalar aplicativo].", "#38bdf8");
}

function setCloudStatusMsg(text, color = "#4ade80") {
  ["cross-save-status-msg", "cloud-modal-status-msg"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.color = color;
      el.textContent = text;
    }
  });
}

// --- 21.1: PAYLOAD BUILDER & PORTABLE CROSS-SAVE (.pokeduel) ---
const CLOUD_EXCLUDED_KEYS = new Set([
  "pdr_cloud_session_v560",
  "pdr_accounts_vault_v560",
  "pdr_gh_deploy_cfg_v560"
]);

function buildCrossSavePayload() {
  const dump = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("pdr_") || k.startsWith("pokeduel_")) && !CLOUD_EXCLUDED_KEYS.has(k)) {
        dump[k] = localStorage.getItem(k);
      }
    }
  } catch (e) {}
  const nick = (window.trainerProfileData && window.trainerProfileData.nickname) ? window.trainerProfileData.nickname : "Treinador";
  const elo = (window.trainerProfileData && window.trainerProfileData.rankRating) ? window.trainerProfileData.rankRating : 1000;
  const unlockedCount = (window.progressionState && Array.isArray(window.progressionState.unlockedFigures))
    ? window.progressionState.unlockedFigures.length : 6;
  return {
    app: "PokeDuel",
    version: "5.6.0",
    exportedAt: new Date().toISOString(),
    summary: { nickname: nick, elo, unlockedCount },
    storage: dump
  };
}

function encodeCrossSaveString() {
  const payload = buildCrossSavePayload();
  const jsonStr = JSON.stringify(payload);
  return "POKEDUEL_SAVE_V560:" + btoa(unescape(encodeURIComponent(jsonStr)));
}

function copyCrossSaveCode() {
  playSfx("portal");
  const codeStr = encodeCrossSaveString();
  const area = document.getElementById("cross-save-textarea");
  if (area) {
    area.value = codeStr;
    area.select();
    try { document.execCommand("copy"); } catch (e) {}
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(codeStr).catch(() => {});
  }
  setCloudStatusMsg("✅ Código de Transferência gerado e copiado! Cole no site GitHub Pages, iPhone ou Android para sincronizar sua conta.", "#4ade80");
}

function downloadCrossSaveFile() {
  playSfx("portal");
  const codeStr = encodeCrossSaveString();
  const blob = new Blob([codeStr], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const nick = (window.trainerProfileData && window.trainerProfileData.nickname) ? window.trainerProfileData.nickname : "Treinador";
  a.href = url;
  a.download = `PokeDuel-Save-${nick}.pokeduel`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  setCloudStatusMsg("💾 Arquivo .pokeduel baixado com sucesso!", "#4ade80");
}

function restoreStorageFromPayloadObject(parsed) {
  if (!parsed || typeof parsed.storage !== "object") {
    throw new Error("Formato de save inválido");
  }
  Object.keys(parsed.storage).forEach(k => {
    if (!CLOUD_EXCLUDED_KEYS.has(k) && k !== "pdr_active_season_v656") {
      try { localStorage.setItem(k, parsed.storage[k]); } catch (e) {}
    }
  });
  try { localStorage.removeItem("pdr_active_season_v656"); } catch (e) {}
}

function scoreDecryptedSavePayload(dec) {
  if (!dec || typeof dec.storage !== "object") return -1;
  let unlockedCount = 6;
  let boxesOpened = 0;
  let matchesWon = 0;
  let rankRating = 1000;
  let highestRating = 1000;
  let wins = 0;
  let upgradesCount = 0;
  try {
    if (dec.storage["pdr_progression_v560"]) {
      const prog = JSON.parse(dec.storage["pdr_progression_v560"]);
      if (Array.isArray(prog.unlockedFigures)) unlockedCount = prog.unlockedFigures.length;
      boxesOpened = Number(prog.totalBoxesOpened) || 0;
      matchesWon = Number(prog.matchesWon) || 0;
    }
  } catch (e) {}
  try {
    if (dec.storage["pdr_trainer_profile_v560"]) {
      const prof = JSON.parse(dec.storage["pdr_trainer_profile_v560"]);
      rankRating = Number(prof.rankRating) || 1000;
      highestRating = Number(prof.highestRating) || rankRating;
      wins = (prof.duelStats && Number(prof.duelStats.wins)) || 0;
    }
  } catch (e) {}
  try {
    if (dec.storage["pokeduel_economy_v555"]) {
      const eco = JSON.parse(dec.storage["pokeduel_economy_v555"]);
      if (eco && eco.upgrades) {
        upgradesCount = Object.values(eco.upgrades).filter(u => (u.level || 1) > 1 || (u.clv || 0) > 0).length;
      }
    }
  } catch (e) {}

  const hadV656ResetFlag = Boolean(dec.storage["pdr_active_season_v656"]);
  let score =
    (unlockedCount * 100000) +
    (upgradesCount * 25000) +
    (boxesOpened * 5000) +
    (Math.max(matchesWon, wins) * 2000) +
    (Math.max(0, highestRating - 1000) * 100) +
    (Math.abs(rankRating - 1000) * 50);

  if (hadV656ResetFlag && unlockedCount <= 6 && rankRating === 1000) {
    score -= 500000;
  }
  return score;
}

function applyCrossSaveString(rawInput) {
  const trimmed = (rawInput || "").trim();
  if (!trimmed) {
    playSfx("hit");
    setCloudStatusMsg("⚠️ Cole um Código de Transferência válido no campo acima ou carregue um arquivo .pokeduel!", "#f87171");
    return;
  }
  try {
    const cleanB64 = trimmed.startsWith("POKEDUEL_SAVE_V560:")
      ? trimmed.slice("POKEDUEL_SAVE_V560:".length).trim()
      : trimmed;
    const jsonStr = decodeURIComponent(escape(atob(cleanB64)));
    const parsed = JSON.parse(jsonStr);
    restoreStorageFromPayloadObject(parsed);
    playSfx("portal");
    setCloudStatusMsg("✅ Conta importada com sucesso! Recarregando coleção, gemas, ELO e times...", "#4ade80");
    setTimeout(() => location.reload(), 650);
  } catch (err) {
    playSfx("hit");
    setCloudStatusMsg("❌ Código inválido ou corrompido. Use o botão [📋 Exportar Código] no aparelho de origem.", "#f87171");
  }
}

function onCrossSaveFileSelected(inp) {
  if (!inp || !inp.files || !inp.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = String(e.target.result || "");
    const area = document.getElementById("cross-save-textarea");
    if (area) area.value = content;
    applyCrossSaveString(content);
  };
  reader.readAsText(inp.files[0]);
}

// --- 21.2: CRYPTOGRAPHIC LOGIN & PASSWORD CLOUD SAVE ENGINE ---
// Deterministic SHA-256 (Pure JS + WebCrypto compatible so it works on file://, APK WebView, HTTP, and HTTPS)
function sha256HexSync(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i, j;
  let result = "";
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = sha256HexSync.h = sha256HexSync.h || [];
  const k = sha256HexSync.k = sha256HexSync.k || [];
  let primeCounter = k[lengthProperty];
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += "\x80";
  while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00";
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;
  let w = hash.slice(0, 8);
  for (j = 0; j < words[lengthProperty]; ) {
    const wSlice = words.slice(j, (j += 16));
    const oldW = w.slice(0);
    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = wSlice[i - 15], w2 = wSlice[i - 2];
      const a = w[0], e = w[4];
      const temp1 =
        w[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & w[5]) ^ (~e & w[6])) +
        k[i] +
        (wSlice[i] =
          i < 16
            ? wSlice[i]
            : (wSlice[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                wSlice[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & w[1]) ^ (a & w[2]) ^ (w[1] & w[2]));
      w = [(temp1 + temp2) | 0].concat(w);
      w[4] = (w[4] + temp1) | 0;
      w.pop();
    }
    for (i = 0; i < 8; i++) w[i] = (w[i] + oldW[i]) | 0;
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (w[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : "") + b.toString(16);
    }
  }
  return result;
}

function utf8ToAsciiBytes(str) {
  return unescape(encodeURIComponent(String(str || "")));
}

function deriveCloudCredentials(rawUsername, rawPassword) {
  const username = String(rawUsername || "").trim().toLowerCase();
  const password = String(rawPassword || "");
  const userHash = sha256HexSync(utf8ToAsciiBytes("pokeduel_user_v560:" + username));
  const authHash = sha256HexSync(utf8ToAsciiBytes("pokeduel_auth_v560:" + username + "::" + password));
  const verifier = sha256HexSync(utf8ToAsciiBytes("pokeduel_verify_v560:" + authHash));
  const cipherKey = sha256HexSync(utf8ToAsciiBytes("pokeduel_cipher_v560:" + authHash + "::" + password));
  const ntfySlotTopic = "pokeduel_vault_" + authHash.slice(0, 34);
  const ntfyUserTopic = "pokeduel_usr_" + userHash.slice(0, 34);
  return { username, userHash, authHash, verifier, cipherKey, ntfySlotTopic, ntfyUserTopic };
}

// Stream XOR + HMAC integrity seal using SHA-256 keystream blocks
function encryptCloudPayload(plainObj, cipherKeyHex, verifierHex) {
  const plainUtf8 = utf8ToAsciiBytes(JSON.stringify(plainObj));
  const salt = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const outBytes = new Uint8Array(plainUtf8.length);
  let blockIdx = 0;
  let keyStream = "";
  for (let i = 0; i < plainUtf8.length; i++) {
    if (i % 32 === 0) {
      const h = sha256HexSync(cipherKeyHex + ":" + salt + ":" + blockIdx++);
      keyStream = "";
      for (let c = 0; c < 64; c += 2) {
        keyStream += String.fromCharCode(parseInt(h.slice(c, c + 2), 16));
      }
    }
    outBytes[i] = plainUtf8.charCodeAt(i) ^ keyStream.charCodeAt(i % 32);
  }
  let bin = "";
  for (let i = 0; i < outBytes.length; i++) bin += String.fromCharCode(outBytes[i]);
  const b64Cipher = btoa(bin);
  const mac = sha256HexSync(cipherKeyHex + ":mac:" + salt + ":" + b64Cipher);
  return {
    v: "5.6.0",
    salt,
    verifier: verifierHex,
    mac,
    updatedAt: Date.now(),
    ct: b64Cipher
  };
}

function decryptCloudPayload(encEnvelope, cipherKeyHex, expectedVerifier) {
  if (!encEnvelope || !encEnvelope.ct || !encEnvelope.salt || !encEnvelope.mac) {
    throw new Error("Pacote criptografado inválido");
  }
  if (encEnvelope.verifier && expectedVerifier && encEnvelope.verifier !== expectedVerifier) {
    throw new Error("WRONG_PASSWORD");
  }
  const checkMac = sha256HexSync(cipherKeyHex + ":mac:" + encEnvelope.salt + ":" + encEnvelope.ct);
  if (checkMac !== encEnvelope.mac) {
    throw new Error("WRONG_PASSWORD");
  }
  const bin = atob(encEnvelope.ct);
  const outChars = [];
  let blockIdx = 0;
  let keyStream = "";
  for (let i = 0; i < bin.length; i++) {
    if (i % 32 === 0) {
      const h = sha256HexSync(cipherKeyHex + ":" + encEnvelope.salt + ":" + blockIdx++);
      keyStream = "";
      for (let c = 0; c < 64; c += 2) {
        keyStream += String.fromCharCode(parseInt(h.slice(c, c + 2), 16));
      }
    }
    outChars.push(String.fromCharCode(bin.charCodeAt(i) ^ keyStream.charCodeAt(i % 32)));
  }
  const plainUtf8 = outChars.join("");
  const jsonStr = decodeURIComponent(escape(plainUtf8));
  return JSON.parse(jsonStr);
}

function getSavedCloudSession() {
  try {
    const raw = localStorage.getItem("pdr_cloud_session_v560");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveCloudSession(sessionObj) {
  try {
    if (!sessionObj) {
      localStorage.removeItem("pdr_cloud_session_v560");
    } else {
      localStorage.setItem("pdr_cloud_session_v560", JSON.stringify(sessionObj));
    }
  } catch (e) {}
  refreshCloudAccountUI();
}

function getLocalAccountsVault() {
  try {
    const raw = localStorage.getItem("pdr_accounts_vault_v560");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveLocalAccountsVault(vault) {
  try {
    localStorage.setItem("pdr_accounts_vault_v560", JSON.stringify(vault));
  } catch (e) {}
}

function getGitHubDeployConfig() {
  const defaults = { owner: "wisper2904", repo: "pokeduel", branch: "main", token: "", gistId: "" };
  try {
    const raw = localStorage.getItem("pdr_gh_deploy_cfg_v560");
    if (raw) return Object.assign(defaults, JSON.parse(raw));
  } catch (e) {}
  return defaults;
}

function saveGitHubDeployConfig(partial) {
  const cur = getGitHubDeployConfig();
  const next = Object.assign({}, cur, partial);
  try {
    localStorage.setItem("pdr_gh_deploy_cfg_v560", JSON.stringify(next));
  } catch (e) {}
  return next;
}

// Push encrypted envelope to ntfy.sh (Split into chunks if > 3200 bytes so even huge saves work 100% reliably!)
async function pushEnvelopeToNtfyCloud(creds, envelope) {
  const serialized = JSON.stringify(envelope);
  const batchId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const chunkSize = 2800;
  const totalChunks = Math.ceil(serialized.length / chunkSize);

  for (let idx = 0; idx < totalChunks; idx++) {
    const part = serialized.slice(idx * chunkSize, (idx + 1) * chunkSize);
    const packet = JSON.stringify({
      b: batchId,
      i: idx,
      n: totalChunks,
      t: envelope.updatedAt,
      v: creds.verifier,
      d: part
    });
    const resp = await fetch(`https://ntfy.sh/${creds.ntfySlotTopic}`, {
      method: "POST",
      body: packet
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  }

  // Also broadcast user verifier header so wrong-password attempts on the same username are detected
  await fetch(`https://ntfy.sh/${creds.ntfyUserTopic}`, {
    method: "POST",
    body: JSON.stringify({ u: creds.userHash, v: creds.verifier, t: envelope.updatedAt })
  }).catch(() => {});
}

// Fetch latest encrypted envelope from ntfy.sh
async function fetchEnvelopeFromNtfyCloud(creds) {
  // 1. Check user verifier topic first to detect wrong password on existing username
  try {
    const uResp = await fetch(`https://ntfy.sh/${creds.ntfyUserTopic}/json?poll=1`);
    if (uResp.ok) {
      const uText = await uResp.text();
      const lines = uText.trim().split("\n").filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const msg = JSON.parse(lines[i]);
          if (msg && msg.event === "message" && msg.message) {
            const parsedMsg = JSON.parse(msg.message);
            if (parsedMsg && parsedMsg.v && parsedMsg.v !== creds.verifier) {
              return { status: "wrong_password" };
            }
            break;
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  // 2. Fetch encrypted chunks from the secret slot topic
  const sResp = await fetch(`https://ntfy.sh/${creds.ntfySlotTopic}/json?poll=1`);
  if (!sResp.ok) return { status: "not_found" };
  const sText = await sResp.text();
  const sLines = sText.trim().split("\n").filter(Boolean);
  if (!sLines.length) return { status: "not_found" };

  const batches = {};
  for (const line of sLines) {
    try {
      const msg = JSON.parse(line);
      if (msg && msg.event === "message" && msg.message) {
        const pkt = JSON.parse(msg.message);
        if (pkt && pkt.b && typeof pkt.i === "number" && typeof pkt.n === "number") {
          if (!batches[pkt.b]) batches[pkt.b] = { total: pkt.n, ts: pkt.t || msg.time || 0, parts: {} };
          batches[pkt.b].parts[pkt.i] = pkt.d;
        }
      }
    } catch (e) {}
  }

  const completeBatches = Object.values(batches).filter(b => Object.keys(b.parts).length === b.total);
  if (!completeBatches.length) return { status: "not_found" };
  completeBatches.sort((a, b) => b.ts - a.ts);

  // Evaluate all complete batches in ntfy history so that if the latest batch was an accidental
  // v656 season reset (6 figures, 1000 ELO), we automatically recover the richest pre-reset save!
  let bestEnv = null;
  let bestScore = -Infinity;
  for (const batch of completeBatches) {
    try {
      let fullJson = "";
      for (let i = 0; i < batch.total; i++) fullJson += batch.parts[i];
      const env = JSON.parse(fullJson);
      if (!bestEnv) bestEnv = env;
      const dec = decryptCloudPayload(env, creds.cipherKey, creds.verifier);
      const sc = scoreDecryptedSavePayload(dec);
      if (sc > bestScore) {
        bestScore = sc;
        bestEnv = env;
      }
    } catch (e) {}
  }

  if (!bestEnv) return { status: "not_found" };
  return { status: "ok", envelope: bestEnv };
}

// Optional Permanent GitHub Repository / Gist Cloud Storage (works automatically if token is configured, and public raw read works WITHOUT token!)
async function pushEnvelopeToGitHubVault(creds, envelope) {
  const cfg = getGitHubDeployConfig();
  if (!cfg.token || !cfg.owner || !cfg.repo) return false;
  const path = `saves/${creds.userHash.slice(0, 32)}.json`;
  const apiUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  const headers = {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${cfg.token}`,
    "Content-Type": "application/json"
  };
  let sha = undefined;
  try {
    const getR = await fetch(`${apiUrl}?ref=${encodeURIComponent(cfg.branch || "main")}`, { headers });
    if (getR.ok) {
      const info = await getR.json();
      sha = info.sha;
    }
  } catch (e) {}
  const bodyObj = {
    message: `Cloud Save sync @${creds.username}`,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(envelope)))),
    branch: cfg.branch || "main"
  };
  if (sha) bodyObj.sha = sha;
  const putR = await fetch(apiUrl, { method: "PUT", headers, body: JSON.stringify(bodyObj) });
  return putR.ok;
}

async function fetchEnvelopeFromGitHubVault(creds) {
  const cfg = getGitHubDeployConfig();
  const owner = cfg.owner || "wisper2904";
  const repo = cfg.repo || "pokeduel";
  const branch = cfg.branch || "main";
  const path = `saves/${creds.userHash.slice(0, 32)}.json`;
  try {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}?_t=${Date.now()}`;
    const r = await fetch(rawUrl);
    if (r.ok) {
      const env = await r.json();
      if (env && env.verifier && env.verifier !== creds.verifier) {
        return { status: "wrong_password" };
      }
      if (env && env.ct) return { status: "ok", envelope: env };
    }
  } catch (e) {}
  return { status: "not_found" };
}

async function cloudAuthSaveNow(silent = false) {
  const sess = getSavedCloudSession();
  const userInp = document.getElementById("cloud-login-user") || document.getElementById("modal-cloud-user");
  const passInp = document.getElementById("cloud-login-pass") || document.getElementById("modal-cloud-pass");
  const rawUser = (userInp && userInp.value.trim()) ? userInp.value.trim() : (sess ? sess.username : "");
  const rawPass = (passInp && passInp.value) ? passInp.value : (sess ? sess.password : "");

  if (!rawUser || !rawPass) {
    if (!silent) {
      playSfx("hit");
      setCloudStatusMsg("⚠️ Digite seu Login (Usuário) e Senha para salvar na nuvem!", "#f87171");
    }
    return false;
  }
  if (rawUser.length < 3 || rawPass.length < 4) {
    if (!silent) {
      playSfx("hit");
      setCloudStatusMsg("⚠️ O Login deve ter pelo menos 3 caracteres e a Senha pelo menos 4 caracteres.", "#f87171");
    }
    return false;
  }

  const creds = deriveCloudCredentials(rawUser, rawPass);
  const vault = getLocalAccountsVault();
  if (vault[creds.userHash] && vault[creds.userHash].verifier !== creds.verifier) {
    if (!silent) {
      playSfx("hit");
      setCloudStatusMsg(`❌ Senha incorreta para a conta @${creds.username}!`, "#f87171");
    }
    return false;
  }

  if (!silent) {
    playSfx("portal");
    setCloudStatusMsg(`⏳ Criptografando e salvando progresso de @${creds.username} na nuvem...`, "#38bdf8");
  }

  if (window.trainerProfileData && (!window.trainerProfileData.nickname || window.trainerProfileData.nickname === "Treinador" || window.trainerProfileData.nickname === "Serebii")) {
    window.trainerProfileData.nickname = rawUser.trim().slice(0, 16);
    saveIndividualProfile();
    syncIndividualProfileUI();
  }

  const payload = buildCrossSavePayload();
  const envelope = encryptCloudPayload(payload, creds.cipherKey, creds.verifier);
  const pubProf = typeof buildRegisteredAccountPublicProfile === "function"
    ? buildRegisteredAccountPublicProfile(creds.username)
    : null;

  // 1. Save in local multi-account vault
  vault[creds.userHash] = {
    username: creds.username,
    verifier: creds.verifier,
    envelope,
    publicProfile: pubProf,
    updatedAt: envelope.updatedAt
  };
  saveLocalAccountsVault(vault);
  if (pubProf && typeof publishRegisteredAccountToGlobalCloud === "function") {
    publishRegisteredAccountToGlobalCloud(pubProf);
  }

  // 2. Save active session
  const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  saveCloudSession({
    username: creds.username,
    password: rawPass,
    userHash: creds.userHash,
    lastSync: timeStr,
    autoSync: true
  });

  // 3. Push to Cloud (ntfy.sh + GitHub Vault if token present)
  let cloudOk = false;
  try {
    await pushEnvelopeToNtfyCloud(creds, envelope);
    cloudOk = true;
  } catch (e) {}
  try {
    const ghOk = await pushEnvelopeToGitHubVault(creds, envelope);
    if (ghOk) cloudOk = true;
  } catch (e) {}

  if (!silent) {
    if (cloudOk) {
      setCloudStatusMsg(`✅ Progresso de @${creds.username} salvo na Nuvem (${timeStr})! Use o mesmo Login e Senha em qualquer celular, iPhone ou PC.`, "#4ade80");
    } else {
      setCloudStatusMsg(`💾 Progresso de @${creds.username} salvo no Cofre Criptografado (${timeStr}). Sincronizará na nuvem assim que houver conexão.`, "#fde047");
    }
  }
  refreshCloudAccountUI();
  return true;
}

async function cloudAuthLoginAndLoad() {
  const userInp = document.getElementById("cloud-login-user") || document.getElementById("modal-cloud-user");
  const passInp = document.getElementById("cloud-login-pass") || document.getElementById("modal-cloud-pass");
  const rawUser = userInp ? userInp.value.trim() : "";
  const rawPass = passInp ? passInp.value : "";

  if (!rawUser || !rawPass) {
    playSfx("hit");
    setCloudStatusMsg("⚠️ Preencha seu Login (Usuário) e Senha para entrar ou baixar seu save!", "#f87171");
    return;
  }
  if (rawUser.length < 3 || rawPass.length < 4) {
    playSfx("hit");
    setCloudStatusMsg("⚠️ O Login deve ter pelo menos 3 caracteres e a Senha pelo menos 4 caracteres.", "#f87171");
    return;
  }

  playSfx("portal");
  const creds = deriveCloudCredentials(rawUser, rawPass);
  setCloudStatusMsg(`🔍 Buscando conta @${creds.username} na nuvem...`, "#38bdf8");

  // Check local vault first for wrong password check
  const vault = getLocalAccountsVault();
  const localEntry = vault[creds.userHash];
  if (localEntry && localEntry.verifier && localEntry.verifier !== creds.verifier) {
    playSfx("hit");
    setCloudStatusMsg(`❌ Senha incorreta para o usuário @${creds.username}!`, "#f87171");
    return;
  }

  // Check GitHub Vault & ntfy Cloud in parallel
  const [ghRes, ntfyRes] = await Promise.all([
    fetchEnvelopeFromGitHubVault(creds).catch(() => ({ status: "not_found" })),
    fetchEnvelopeFromNtfyCloud(creds).catch(() => ({ status: "not_found" }))
  ]);

  if (ghRes.status === "wrong_password" || ntfyRes.status === "wrong_password") {
    playSfx("hit");
    setCloudStatusMsg(`❌ Senha incorreta para o usuário @${creds.username}! Verifique sua senha.`, "#f87171");
    return;
  }

  // Pick newest envelope among GitHub Vault, ntfy Cloud, and Local Vault
  const candidates = [];
  if (ghRes.status === "ok" && ghRes.envelope) candidates.push({ src: "GitHub Cloud", env: ghRes.envelope });
  if (ntfyRes.status === "ok" && ntfyRes.envelope) candidates.push({ src: "Nuvem PokeDuel", env: ntfyRes.envelope });
  if (localEntry && localEntry.envelope) candidates.push({ src: "Cofre Local", env: localEntry.envelope });

  if (candidates.length === 0) {
    // New account! Register current progress under this Login + Password immediately
    const ok = await cloudAuthSaveNow(false);
    if (ok) {
      setCloudStatusMsg(`🎉 Nova conta @${creds.username} criada e vinculada na Nuvem com sucesso!`, "#4ade80");
    }
    return;
  }

  candidates.forEach(c => {
    try {
      const dec = decryptCloudPayload(c.env, creds.cipherKey, creds.verifier);
      c.score = scoreDecryptedSavePayload(dec);
    } catch (e) {
      c.score = -Infinity;
    }
  });
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.env.updatedAt || 0) - (a.env.updatedAt || 0);
  });
  const best = candidates[0];

  try {
    const decrypted = decryptCloudPayload(best.env, creds.cipherKey, creds.verifier);
    restoreStorageFromPayloadObject(decrypted);
    window.trainerProfileData = loadIndividualProfile();
    playerProgression = loadProgressionState();
    if (window.trainerProfileData && (!window.trainerProfileData.nickname || window.trainerProfileData.nickname === "Treinador" || window.trainerProfileData.nickname === "Serebii")) {
      window.trainerProfileData.nickname = rawUser.trim().slice(0, 16);
      saveIndividualProfile();
    }
    const pubProf = typeof buildRegisteredAccountPublicProfile === "function"
      ? buildRegisteredAccountPublicProfile(creds.username)
      : null;
    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    saveCloudSession({
      username: creds.username,
      password: rawPass,
      userHash: creds.userHash,
      lastSync: timeStr,
      autoSync: true
    });
    vault[creds.userHash] = {
      username: creds.username,
      verifier: creds.verifier,
      envelope: best.env,
      publicProfile: pubProf,
      updatedAt: best.env.updatedAt || Date.now()
    };
    saveLocalAccountsVault(vault);
    if (pubProf && typeof publishRegisteredAccountToGlobalCloud === "function") {
      publishRegisteredAccountToGlobalCloud(pubProf);
    }
    const summary = decrypted.summary || {};
    setCloudStatusMsg(
      `✅ Login efetuado em @${creds.username} (${best.src})! Restaurando ${summary.unlockedCount || ""} Pokémon e ${summary.elo || 1000} ELO...`,
      "#4ade80"
    );
    setTimeout(() => location.reload(), 650);
  } catch (err) {
    playSfx("hit");
    setCloudStatusMsg(`❌ Senha incorreta para o usuário @${creds.username}!`, "#f87171");
  }
}

function cloudAuthLogout() {
  playSfx("step");
  saveCloudSession(null);
  ["cloud-login-user", "cloud-login-pass", "modal-cloud-user", "modal-cloud-pass"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  setCloudStatusMsg("🚪 Você saiu da conta na nuvem. Seu progresso local permanece intacto.", "#fde047");
}

function toggleCloudPasswordVisibility(inputId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  inp.type = inp.type === "password" ? "text" : "password";
}

function syncCloudInputs(sourceUserElId, sourcePassElId) {
  const uVal = (document.getElementById(sourceUserElId) || {}).value || "";
  const pVal = (document.getElementById(sourcePassElId) || {}).value || "";
  ["cloud-login-user", "modal-cloud-user"].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.id !== sourceUserElId) el.value = uVal;
  });
  ["cloud-login-pass", "modal-cloud-pass"].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.id !== sourcePassElId) el.value = pVal;
  });
}

function refreshCloudAccountUI() {
  const sess = getSavedCloudSession();
  const badgeEls = [
    document.getElementById("cloud-account-status-pill"),
    document.getElementById("modal-cloud-status-pill"),
    document.getElementById("prof-cloud-status-pill")
  ];
  badgeEls.forEach(el => {
    if (!el) return;
    if (sess && sess.username) {
      el.style.background = "linear-gradient(90deg,#065f46,#047857)";
      el.style.borderColor = "#4ade80";
      el.style.color = "#ecfdf5";
      el.innerHTML = `🟢 @${sess.username}`;
    } else {
      el.style.background = "#0f172a";
      el.style.borderColor = "#38bdf8";
      el.style.color = "#bae6fd";
      el.innerHTML = `☁️ Desconectado`;
    }
  });

  const profDesc = document.getElementById("prof-cloud-desc-txt");
  const profBtnLbl = document.getElementById("prof-cloud-action-btn-lbl");
  if (profDesc && profBtnLbl) {
    if (sess && sess.username) {
      profDesc.textContent = `Sessão ativa como @${sess.username}. Seu progresso, gemas e troféus são salvos na nuvem.`;
      profBtnLbl.textContent = `Gerenciar Conta (@${sess.username})`;
    } else {
      profDesc.textContent = "Sincronize seu progresso, figuras Kaiyodo e gemas por Login e Senha para jogar no celular ou PC.";
      profBtnLbl.textContent = "Entrar ou Criar Conta na Nuvem";
    }
  }

  if (sess && sess.username) {
    ["cloud-login-user", "modal-cloud-user"].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = sess.username;
    });
    ["cloud-login-pass", "modal-cloud-pass"].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value && sess.password) el.value = sess.password;
    });
  }
}

// Auto-sync hook: whenever localStorage changes on an active logged-in session, debounce cloud sync!
let _cloudAutoSyncTimer = null;
function scheduleAutoCloudSync() {
  if (window._isRecoveringSaveV657) return;
  const sess = getSavedCloudSession();
  if (!sess || !sess.username || !sess.password || !sess.autoSync) return;
  if (_cloudAutoSyncTimer) clearTimeout(_cloudAutoSyncTimer);
  _cloudAutoSyncTimer = setTimeout(() => {
    if (window._isRecoveringSaveV657) return;
    cloudAuthSaveNow(true).catch(() => {});
  }, 4500);
}

(function hookLocalStorageForAutoCloudSync() {
  try {
    const origSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, val) {
      origSetItem.call(this, key, val);
      if (key && (key.startsWith("pdr_") || key.startsWith("pokeduel_")) && !CLOUD_EXCLUDED_KEYS.has(key)) {
        scheduleAutoCloudSync();
      }
    };
  } catch (e) {}
})();

// --- 21.3: 1-CLICK MONOLITHIC GITHUB PAGES PUBLISHER (GIT DATA BLOBS API — UP TO 100MB, NO SPRITE SPLITTING!) ---
async function publishMonolithicToGitHubPages() {
  const ownerInp = document.getElementById("gh-pub-owner");
  const repoInp = document.getElementById("gh-pub-repo");
  const tokenInp = document.getElementById("gh-pub-token");
  const statusEl = document.getElementById("gh-pub-status-msg");

  const owner = (ownerInp ? ownerInp.value.trim() : "wisper2904") || "wisper2904";
  const repo = (repoInp ? repoInp.value.trim() : "pokeduel") || "pokeduel";
  const token = tokenInp ? tokenInp.value.trim() : "";

  if (!token) {
    playSfx("hit");
    if (statusEl) {
      statusEl.style.color = "#f87171";
      statusEl.textContent = "⚠️ Cole seu Token do GitHub (ghp_... ou github_pat_...) para publicar automaticamente no GitHub Pages!";
    }
    return;
  }

  saveGitHubDeployConfig({ owner, repo, branch: "main", token });
  playSfx("portal");
  const setGhMsg = (msg, col = "#38bdf8") => {
    if (statusEl) {
      statusEl.style.color = col;
      statusEl.innerHTML = msg;
    }
  };

  try {
    setGhMsg("⏳ 1/4 Verificando/criando repositório <b>" + owner + "/" + repo + "</b> no GitHub...");
    const headers = {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const repoCheck = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (repoCheck.status === 404) {
      const createResp = await fetch(`https://api.github.com/user/repos`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: repo,
          description: "PokeDuel 3D (v5.6.0) - Multiplatform Web/PWA & P2P Edition",
          homepage: `https://${owner}.github.io/${repo}/`,
          private: false,
          auto_init: true
        })
      });
      if (!createResp.ok) {
        const errJ = await createResp.json().catch(() => ({}));
        throw new Error(errJ.message || `Erro ao criar repositório (${createResp.status})`);
      }
      await new Promise(r => setTimeout(r, 1500));
    } else if (!repoCheck.ok) {
      const errJ = await repoCheck.json().catch(() => ({}));
      throw new Error(errJ.message || `Erro de autenticação (${repoCheck.status})`);
    }

    setGhMsg("⏳ 2/4 Empacotando motor monolítico completo (4,53 MB · 27 Sprites Kaiyodo + 200 Nano Banana)...");
    const fullHtml = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
    const manifestJson = JSON.stringify({
      name: "PokeDuel — 3D Figure Game",
      short_name: "PokeDuel",
      start_url: "./index.html",
      display: "standalone",
      orientation: "portrait",
      background_color: "#03091e",
      theme_color: "#081d4a",
      icons: [
        { src: "icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "icon-512.png", sizes: "512x512", type: "image/png" }
      ]
    }, null, 2);

    const swJs = `const CACHE_NAME = "pokeduel-v560-monolithic";
const ASSETS = ["./", "./index.html", "./manifest.json"];
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(() => {})));
});
self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});`;

    // Helper to create Git Blob (supports up to 100 MB)
    async function createGitBlob(contentStr) {
      const b64 = btoa(unescape(encodeURIComponent(contentStr)));
      const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: b64, encoding: "base64" })
      });
      if (!r.ok) {
        // Repo might be completely empty (0 commits); initialize with .nojekyll via Contents API first
        await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.nojekyll`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ message: "init", content: "" })
        });
        const r2 = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
          method: "POST",
          headers,
          body: JSON.stringify({ content: b64, encoding: "base64" })
        });
        if (!r2.ok) throw new Error(`Falha ao enviar blob (${r2.status})`);
        return (await r2.json()).sha;
      }
      return (await r.json()).sha;
    }

    const indexBlobSha = await createGitBlob(fullHtml);
    const manifestBlobSha = await createGitBlob(manifestJson);
    const swBlobSha = await createGitBlob(swJs);
    const nojekyllBlobSha = await createGitBlob("");

    setGhMsg("⏳ 3/4 Criando árvore Git e commit na branch <b>main</b>...");
    let refResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, { headers });
    let branchName = "main";
    if (!refResp.ok) {
      refResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/master`, { headers });
      if (refResp.ok) branchName = "master";
    }
    const refData = await refResp.json();
    const latestCommitSha = refData.object.sha;

    const commitResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, { headers });
    const commitData = await commitResp.json();

    const treeResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        base_tree: commitData.tree.sha,
        tree: [
          { path: "index.html", mode: "100644", type: "blob", sha: indexBlobSha },
          { path: "manifest.json", mode: "100644", type: "blob", sha: manifestBlobSha },
          { path: "sw.js", mode: "100644", type: "blob", sha: swBlobSha },
          { path: ".nojekyll", mode: "100644", type: "blob", sha: nojekyllBlobSha }
        ]
      })
    });
    if (!treeResp.ok) throw new Error(`Falha ao criar Git Tree (${treeResp.status})`);
    const treeData = await treeResp.json();

    const newCommitResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: "🚀 Deploy PokeDuel v5.6.0 (Monolítico + Cloud Save Login/Senha)",
        tree: treeData.sha,
        parents: [latestCommitSha]
      })
    });
    if (!newCommitResp.ok) throw new Error(`Falha ao criar Commit (${newCommitResp.status})`);
    const newCommitData = await newCommitResp.json();

    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: newCommitData.sha, force: true })
    });

    setGhMsg("⏳ 4/4 Ativando GitHub Pages...");
    await fetch(`https://api.github.com/repos/${owner}/${repo}/pages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ source: { branch: branchName, path: "/" } })
    }).catch(() => {});

    // Also sync active cloud account to the repo if logged in!
    const sess = getSavedCloudSession();
    if (sess && sess.username && sess.password) {
      cloudAuthSaveNow(true).catch(() => {});
    }

    const pagesUrl = `https://${owner}.github.io/${repo}/`;
    playSfx("portal");
    setGhMsg(
      `✅ Publicado com sucesso! Site no ar em: <a href="${pagesUrl}" target="_blank" style="color:#fde047;text-decoration:underline;">${pagesUrl}</a> (pode levar ~40s para o GitHub atualizar o cache).`,
      "#4ade80"
    );
  } catch (err) {
    playSfx("hit");
    setGhMsg(`❌ Erro ao publicar: ${err.message || err}`, "#f87171");
  }
}

// --- 21.4: CLOUD LOGIN MODAL & CONFIG TAB UI INJECTION ---
function openCloudAccountModal() {
  playSfx("portal");
  let modal = document.getElementById("cloud-account-login-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "cloud-account-login-modal";
    modal.style.cssText = "display:none; position:fixed; inset:0; z-index:295; background:rgba(2,6,23,0.93); align-items:center; justify-content:center; padding:14px;";
    modal.innerHTML = `
      <div style="width:100%; max-width:355px; background:linear-gradient(180deg,#0c2444 0%,#051022 100%); border:2px solid #4ade80; border-radius:14px; padding:14px; color:#f8fafc; box-shadow:0 12px 40px rgba(0,0,0,0.95);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(74,222,128,0.35); padding-bottom:8px; margin-bottom:10px;">
          <div>
            <div style="font-size:13px; font-weight:900; color:#4ade80;">☁️ CONTA & SAVE NA NUVEM</div>
            <div style="font-size:8.5px; color:#bae6fd; font-weight:700;">Sincronize por Login e Senha entre APK, iPhone e PC</div>
          </div>
          <button onclick="closeCloudAccountModal()" style="background:#1e293b; border:1px solid #94a3b8; color:#fff; border-radius:6px; width:28px; height:28px; font-weight:900; cursor:pointer;">✕</button>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:9px; color:#cbd5e1; font-weight:800;">Status da Conta:</span>
          <span id="modal-cloud-status-pill" style="font-size:8.5px; font-weight:900; padding:2px 8px; border-radius:99px; border:1px solid #38bdf8; background:#0f172a; color:#bae6fd;">☁️ Desconectado</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:7px; margin-bottom:9px;">
          <div>
            <label style="font-size:8.5px; color:#7dd3fc; font-weight:800;">👤 Seu Login / Usuário:</label>
            <input id="modal-cloud-user" type="text" maxlength="24" placeholder="Ex: wisper2904" oninput="syncCloudInputs('modal-cloud-user','modal-cloud-pass')" style="width:100%; margin-top:3px; padding:7px 9px; border-radius:6px; background:#040812; border:1.5px solid #38bdf8; color:#fff; font-size:11px; font-weight:900;">
          </div>
          <div>
            <label style="font-size:8.5px; color:#7dd3fc; font-weight:800;">🔑 Sua Senha:</label>
            <div style="display:flex; gap:4px; margin-top:3px;">
              <input id="modal-cloud-pass" type="password" maxlength="32" placeholder="Digite sua senha..." oninput="syncCloudInputs('modal-cloud-user','modal-cloud-pass')" style="flex:1; padding:7px 9px; border-radius:6px; background:#040812; border:1.5px solid #38bdf8; color:#fff; font-size:11px; font-weight:900;">
              <button class="btn secondary" style="padding:0 9px; font-size:11px;" onclick="toggleCloudPasswordVisibility('modal-cloud-pass')" title="Mostrar/Ocultar Senha">👁️</button>
            </div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:7px;">
          <button class="btn green" style="padding:8px 5px; font-size:9.5px; font-weight:900;" onclick="cloudAuthLoginAndLoad()">📥 Entrar & Baixar Save</button>
          <button class="btn gold" style="padding:8px 5px; font-size:9.5px; font-weight:900;" onclick="cloudAuthSaveNow(false)">☁️ Salvar na Nuvem Agora</button>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <span style="font-size:8px; color:#94a3b8; font-weight:700;">🔒 Criptografia SHA-256 + Auto-Save ativo</span>
          <button class="btn secondary" style="padding:4px 8px; font-size:8px; color:#fca5a5; border-color:#ef4444;" onclick="cloudAuthLogout()">🚪 Sair da Conta</button>
        </div>
        <div id="cloud-modal-status-msg" style="font-size:8.5px; font-weight:800; color:#4ade80; margin-top:7px; min-height:14px; line-height:1.35;"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = "flex";
  refreshCloudAccountUI();
}

function closeCloudAccountModal() {
  const modal = document.getElementById("cloud-account-login-modal");
  if (modal) modal.style.display = "none";
  if (!window.trainerProfileData || !window.trainerProfileData.isSetupDone) {
    const wm = document.getElementById("welcome-profile-modal");
    if (wm) wm.style.display = "flex";
  }
}

function openCloudLoginFromWelcome() {
  const wm = document.getElementById("welcome-profile-modal");
  if (wm) wm.style.display = "none";
  openCloudAccountModal();
}

// --- 21.8: USERNAME RESERVATION & AUTHENTICATION ENFORCEMENT ---
async function checkUsernameExistence(rawUsername) {
  const username = String(rawUsername || "").trim().toLowerCase();
  if (!username) return { exists: false };

  // 1. Check local accounts vault
  try {
    const vault = getLocalAccountsVault();
    const userHash = sha256HexSync(utf8ToAsciiBytes("pokeduel_user_v560:" + username));
    if (vault && vault[userHash]) {
      return { exists: true, source: "local", verifier: vault[userHash].verifier };
    }
  } catch (e) {}

  // 2. Check ntfy cloud user broadcast
  try {
    const userHash = sha256HexSync(utf8ToAsciiBytes("pokeduel_user_v560:" + username));
    const ntfyUserTopic = "pokeduel_usr_" + userHash.slice(0, 34);
    const resp = await fetch(`https://ntfy.sh/${ntfyUserTopic}/json?poll=1`, { cache: "no-store" });
    if (resp.ok) {
      const text = await resp.text();
      const lines = text.trim().split("\n").filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const msg = JSON.parse(lines[i]);
          if (msg && msg.event === "message" && msg.message) {
            const parsed = JSON.parse(msg.message);
            if (parsed && (parsed.v || parsed.u)) {
              return { exists: true, source: "cloud", verifier: parsed.v };
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  return { exists: false };
}

let _welcomeInputDebounce = null;
async function onWelcomeUserInput(val) {
  const statusEl = document.getElementById("welcome-user-status");
  const btn = document.getElementById("welcome-submit-btn");
  const nick = String(val || "").trim().toLowerCase();

  if (!nick || nick.length < 3) {
    if (statusEl) statusEl.textContent = "";
    if (btn) btn.textContent = "🚀 Continuar";
    return;
  }

  if (statusEl) {
    statusEl.style.color = "#93c5fd";
    statusEl.textContent = "🔍 Verificando se o usuário já existe...";
  }

  if (_welcomeInputDebounce) clearTimeout(_welcomeInputDebounce);
  _welcomeInputDebounce = setTimeout(async () => {
    const res = await checkUsernameExistence(nick);
    if (res.exists) {
      if (statusEl) {
        statusEl.style.color = "#facc15";
        statusEl.textContent = `⚠️ Nome "@${nick}" já registrado! Digite a senha para entrar ou escolha outro nome.`;
      }
      if (btn) btn.textContent = `🔑 Entrar como @${nick}`;
    } else {
      if (statusEl) {
        statusEl.style.color = "#4ade80";
        statusEl.textContent = `✨ Nome "@${nick}" disponível! Crie uma senha para protegê-lo.`;
      }
      if (btn) btn.textContent = `🚀 Criar @${nick} e Iniciar`;
    }
  }, 350);
}

async function handleWelcomeAuthSubmit() {
  const userInp = document.getElementById("welcome-nick-inp");
  const passInp = document.getElementById("welcome-pass-inp");
  const feedbackEl = document.getElementById("welcome-feedback-msg");
  const btn = document.getElementById("welcome-submit-btn");

  const rawUser = userInp ? userInp.value.trim() : "";
  const rawPass = passInp ? passInp.value : "";

  const setMsg = (text, isError = true) => {
    if (feedbackEl) {
      feedbackEl.style.color = isError ? "#f87171" : "#4ade80";
      feedbackEl.textContent = text;
    }
  };

  if (!rawUser || rawUser.length < 3) {
    playSfx("hit");
    setMsg("⚠️ O nome de usuário deve ter pelo menos 3 caracteres.");
    if (userInp) userInp.focus();
    return;
  }

  if (!rawPass || rawPass.length < 4) {
    playSfx("hit");
    setMsg("⚠️ Digite uma senha com pelo menos 4 caracteres.");
    if (passInp) passInp.focus();
    return;
  }

  const originalBtnText = btn ? btn.textContent : "🚀 Continuar";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Verificando credenciais...";
  }

  try {
    const creds = deriveCloudCredentials(rawUser, rawPass);
    const vault = getLocalAccountsVault();
    const localEntry = vault[creds.userHash];

    // Check online ntfy and GitHub
    const [ghRes, ntfyRes] = await Promise.all([
      fetchEnvelopeFromGitHubVault(creds).catch(() => ({ status: "not_found" })),
      fetchEnvelopeFromNtfyCloud(creds).catch(() => ({ status: "not_found" }))
    ]);

    const userExists = !!localEntry || ghRes.status !== "not_found" || ntfyRes.status !== "not_found";

    if (userExists) {
      // 1. USER ALREADY EXISTS: MUST VERIFY PASSWORD!
      let passWrong = false;
      if (localEntry && localEntry.verifier && localEntry.verifier !== creds.verifier) {
        passWrong = true;
      }
      if (ghRes.status === "wrong_password" || ntfyRes.status === "wrong_password") {
        passWrong = true;
      }

      if (passWrong) {
        playSfx("hit");
        setMsg(`❌ Senha incorreta! O usuário "@${rawUser}" já existe. Digite a senha correta ou crie outro usuário.`);
        if (btn) {
          btn.disabled = false;
          btn.textContent = `🔑 Entrar como @${rawUser}`;
        }
        return;
      }

      // Password matches! Restore candidate save
      const candidates = [];
      if (ghRes.status === "ok" && ghRes.envelope) candidates.push({ src: "GitHub Cloud", env: ghRes.envelope });
      if (ntfyRes.status === "ok" && ntfyRes.envelope) candidates.push({ src: "Nuvem PokeDuel", env: ntfyRes.envelope });
      if (localEntry && localEntry.envelope) candidates.push({ src: "Cofre Local", env: localEntry.envelope });

      if (candidates.length > 0) {
        candidates.forEach(c => {
          try {
            const dec = decryptCloudPayload(c.env, creds.cipherKey, creds.verifier);
            c.score = scoreDecryptedSavePayload(dec);
          } catch (e) {
            c.score = -Infinity;
          }
        });
        candidates.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return (b.env.updatedAt || 0) - (a.env.updatedAt || 0);
        });
        const best = candidates[0];
        const decrypted = decryptCloudPayload(best.env, creds.cipherKey, creds.verifier);
        restoreStorageFromPayloadObject(decrypted);
        window.trainerProfileData = loadIndividualProfile();
        playerProgression = loadProgressionState();

        const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        saveCloudSession({
          username: creds.username,
          password: rawPass,
          userHash: creds.userHash,
          lastSync: timeStr,
          autoSync: true
        });

        playSfx("portal");
        setMsg(`✅ Senha correta! Carregando save de @${creds.username}...`, false);
        setTimeout(() => location.reload(), 600);
        return;
      }
    }

    // 2. USER DOES NOT EXIST: REGISTER AS NEW USER WITH THIS PASSWORD!
    window.trainerProfileData = createBlankIndividualProfile(rawUser.slice(0, 16));
    window.trainerProfileData.isSetupDone = true;
    saveIndividualProfile();

    // Clean initial starter progression & starter figures:
    playerProgression = createFreshProgressionState();
    saveProgressionState();
    playerKeyFragments = 0;
    FIGURES_DB.forEach(f => {
      f.level = 1;
      f.clv = 0;
      f.diskPointsSpent = 0;
      if (f.baseWheelLv1) f.wheel = f.baseWheelLv1.map(w => ({ ...w }));
      f.clvAlloc = f.wheel.map(() => 0);
    });

    // Exact starter wallet: 100 Gems & 15,000 Coins / Gold
    state.rareMetals   = 100;   // 100 Gems apenas (Novo Balanceamento)
    userCoins          = 15000; // 15,000 Coins / Ouro (Novo Balanceamento)
    userMaterial       = 250;
    userRareMetalItems = 2;
    userCarmonite      = 50;
    state.chainCubes   = 1;
    userIngots         = 1;
    lastDailyBonusTs   = 0;
    claimedMissionWinsCount = 0;
    saveEconomyAndUpgrades();

    syncProgressionToDeckState();
    syncAllCurrencyLabels();
    syncIndividualProfileUI();
    renderHubAndCollection();
    renderShopExchange();

    const timeStr = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    saveCloudSession({
      username: creds.username,
      password: rawPass,
      userHash: creds.userHash,
      lastSync: timeStr,
      autoSync: true
    });

    await cloudAuthSaveNow(true).catch(() => {});

    playSfx("portal");
    setMsg(`🎉 Conta criada com sucesso para @${creds.username}!`, false);
    const wm = document.getElementById("welcome-profile-modal");
    if (wm) wm.style.display = "none";
    try { localStorage.setItem(TUTORIAL_COMPLETED_KEY, "1"); } catch (e) {}
    openDrawer("hub");
    switchDrawerTab("hub");

  } catch (err) {
    console.error("handleWelcomeAuthSubmit error:", err);
    if (err && err.message === "WRONG_PASSWORD") {
      playSfx("hit");
      setMsg(`❌ Senha incorreta! O usuário "@${rawUser}" já existe. Digite a senha correta ou crie outro usuário.`);
    } else {
      setMsg("❌ Ocorreu um erro ao verificar a conta. Tente novamente.");
    }
    if (btn) { btn.disabled = false; btn.textContent = originalBtnText; }
  }
}

(function injectCloudSaveAndGitHubPagesCards() {
  // Clean up any old floating cloud pill if present
  const oldPill = document.getElementById("hub-top-cloud-pill");
  if (oldPill) oldPill.remove();

  // Inject full Cloud Save (Login & Password) + 1-Click GitHub Pages Publisher into Config Tab (#dtab-menu)

  // 2. Inject full Cloud Save (Login & Password) + 1-Click GitHub Pages Publisher into Config Tab (#dtab-menu)
  const cfgTab = document.getElementById("dtab-menu") || document.getElementById("dtab-config");
  if (!cfgTab || document.getElementById("cfg-cross-save-pwa-card")) return;

  const ghCfg = getGitHubDeployConfig();
  const card = document.createElement("div");
  card.id = "cfg-cross-save-pwa-card";
  card.className = "card";
  card.style.cssText = "border:1.5px solid #4ade80; margin-bottom:8px; padding:10px; background:linear-gradient(180deg, rgba(6,34,26,0.95), rgba(7,13,25,0.98));";
  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; gap:4px; flex-wrap:wrap;">
      <strong style="color:#4ade80; font-size:11px;">☁️ SAVE NA NUVEM (LOGIN E SENHA)</strong>
      <div style="display:flex; gap:4px; align-items:center;">
        <span id="cloud-account-status-pill" style="font-size:8px; font-weight:900; padding:2px 7px; border-radius:99px; border:1px solid #38bdf8; background:#0f172a; color:#bae6fd;">☁️ Desconectado</span>
        <button id="pwa-install-btn" class="btn gold" style="padding:2px 6px; font-size:7.8px;" onclick="triggerPwaInstallPrompt()">📲 Instalar App</button>
      </div>
    </div>
    <div class="small-muted" style="margin-bottom:6px; line-height:1.35;">
      Crie ou acesse sua conta apenas com <b>Login e Senha</b> para sincronizar seus 306 Pokémon, Decks, Gemas, ELO e Time Boosters entre o <b>.APK</b>, <b>iPhone (PWA)</b> e <b>PC (GitHub Pages)</b>:
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; margin-bottom:6px;">
      <div>
        <label style="font-size:8px; color:#7dd3fc; font-weight:800;">👤 Login (Usuário):</label>
        <input id="cloud-login-user" type="text" maxlength="24" placeholder="Ex: wisper2904" oninput="syncCloudInputs('cloud-login-user','cloud-login-pass')" style="width:100%; margin-top:2px; padding:5px 7px; border-radius:5px; background:#040812; border:1px solid #38bdf8; color:#fff; font-size:9.5px; font-weight:900;">
      </div>
      <div>
        <label style="font-size:8px; color:#7dd3fc; font-weight:800;">🔑 Senha:</label>
        <div style="display:flex; gap:3px; margin-top:2px;">
          <input id="cloud-login-pass" type="password" maxlength="32" placeholder="Sua senha..." oninput="syncCloudInputs('cloud-login-user','cloud-login-pass')" style="flex:1; min-width:0; padding:5px 7px; border-radius:5px; background:#040812; border:1px solid #38bdf8; color:#fff; font-size:9.5px; font-weight:900;">
          <button class="btn secondary" style="padding:0 6px; font-size:9px;" onclick="toggleCloudPasswordVisibility('cloud-login-pass')">👁️</button>
        </div>
      </div>
    </div>
    <div style="display:grid; grid-template-columns:1.15fr 1.15fr 0.7fr; gap:4px; margin-bottom:6px;">
      <button class="btn green" style="padding:6px 4px; font-size:8.5px; font-weight:900;" onclick="cloudAuthLoginAndLoad()">📥 Entrar / Baixar Save</button>
      <button class="btn gold" style="padding:6px 4px; font-size:8.5px; font-weight:900;" onclick="cloudAuthSaveNow(false)">☁️ Salvar na Nuvem</button>
      <button class="btn secondary" style="padding:6px 4px; font-size:8px; color:#fca5a5; border-color:#ef4444;" onclick="cloudAuthLogout()">🚪 Sair</button>
    </div>

    <div id="cross-save-status-msg" style="font-size:8.5px; font-weight:800; color:#bae6fd; margin:4px 0 6px; min-height:13px; line-height:1.35;"></div>

    <!-- 1-CLICK GITHUB PAGES MONOLITHIC PUBLISHER -->
    <details style="background:#050c1a; border:1px solid #38bdf8; border-radius:7px; padding:6px 8px; margin-bottom:6px;">
      <summary style="cursor:pointer; font-size:9.5px; font-weight:900; color:#fde047;">
        🚀 Publicar / Atualizar Site no GitHub Pages (1 Toque · Monolítico Seguro)
      </summary>
      <div style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(56,189,248,0.25);">
        <div class="small-muted" style="margin-bottom:5px;">
          Envia o <b>index.html monolítico completo (4,53 MB)</b> com todos os 27 sprites Kaiyodo e 200 Nano Banana via Git Data Blobs API direto para o seu GitHub Pages:
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; margin-bottom:5px;">
          <input id="gh-pub-owner" type="text" value="${ghCfg.owner || "wisper2904"}" placeholder="Usuário GitHub" style="padding:4px 6px; border-radius:4px; background:#030712; border:1px solid #38bdf8; color:#fff; font-size:8.5px; font-weight:800;">
          <input id="gh-pub-repo" type="text" value="${ghCfg.repo || "pokeduel"}" placeholder="Repositório" style="padding:4px 6px; border-radius:4px; background:#030712; border:1px solid #38bdf8; color:#fff; font-size:8.5px; font-weight:800;">
        </div>
        <div style="display:flex; gap:4px; margin-bottom:5px;">
          <input id="gh-pub-token" type="password" value="${ghCfg.token || ""}" placeholder="Cole seu Token GitHub (ghp_...)" style="flex:1; padding:5px 7px; border-radius:4px; background:#030712; border:1px solid #facc15; color:#fff; font-size:8.5px; font-family:monospace;">
          <a href="https://github.com/settings/tokens/new?description=PokeDuel-GitHub-Pages&scopes=repo,gist" target="_blank" class="btn secondary" style="padding:4px 6px; font-size:7.8px; text-decoration:none; display:flex; align-items:center;">🔑 Gerar Token</a>
        </div>
        <button class="btn gold" style="width:100%; padding:6px; font-size:9px; font-weight:900;" onclick="publishMonolithicToGitHubPages()">
          🚀 Publicar Agora em https://${ghCfg.owner || "wisper2904"}.github.io/${ghCfg.repo || "pokeduel"}/
        </button>
        <div id="gh-pub-status-msg" style="font-size:8px; font-weight:800; color:#bae6fd; margin-top:4px;"></div>
      </div>
    </details>

    <!-- PORTABLE BACKUP (.pokeduel / CODE) -->
    <details style="background:#050c1a; border:1px solid #334155; border-radius:7px; padding:6px 8px;">
      <summary style="cursor:pointer; font-size:9px; font-weight:800; color:#94a3b8;">
        📦 Backup Offline por Arquivo (.pokeduel) ou Código de Transferência
      </summary>
      <div style="margin-top:6px;">
        <textarea id="cross-save-textarea" rows="2" placeholder="Cole aqui seu Código POKEDUEL_SAVE_V560:... para importar manualmente" style="width:100%; background:#050914; border:1px solid #38bdf8; color:#bae6fd; border-radius:6px; padding:5px; font-size:8px; font-family:monospace; resize:none; margin-bottom:5px;"></textarea>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px; margin-bottom:4px;">
          <button class="btn" style="padding:5px 3px; font-size:8px;" onclick="copyCrossSaveCode()">📋 Exportar Código</button>
          <button class="btn secondary" style="padding:5px 3px; font-size:8px;" onclick="downloadCrossSaveFile()">💾 Baixar .pokeduel</button>
          <button class="btn green" style="padding:5px 3px; font-size:8px;" onclick="applyCrossSaveString(document.getElementById('cross-save-textarea').value)">📥 Importar Código</button>
        </div>
        <label class="btn secondary" style="padding:3px 7px; font-size:7.8px; cursor:pointer; display:inline-block;">
          📂 Carregar Arquivo .pokeduel
          <input type="file" accept=".pokeduel,.txt" style="display:none;" onchange="onCrossSaveFileSelected(this)">
        </label>
      </div>
    </details>
  `;

  const banner = document.getElementById("cfg-banana-logo-banner");
  if (banner && banner.nextSibling) {
    cfgTab.insertBefore(card, banner.nextSibling);
  } else {
    cfgTab.insertBefore(card, cfgTab.firstChild);
  }
  refreshCloudAccountUI();
})();

// --- 21.6: IN-GAME UPDATER & CHANGELOG MODAL (v5.6.1) ---
function openChangelogModal() {
  const m = document.getElementById("changelog-modal");
  if (m) m.style.display = "flex";
  try {
    localStorage.setItem("pdr_viewed_changelog_v561", "true");
  } catch (e) {}
}

function closeChangelogModal() {
  const m = document.getElementById("changelog-modal");
  if (m) m.style.display = "none";
}

// --- MINI TUTORIAL MODAL CONTROLS ---
function openMiniTutorialModal() {
  try { playSfx("select"); } catch (e) {}
  const m = document.getElementById("mini-tutorial-modal");
  if (m) m.style.display = "flex";
  const bEl = document.getElementById("mini-tutorial-body");
  if (bEl) bEl.scrollTop = 0;
}

function closeMiniTutorialModal() {
  try { playSfx("back"); } catch (e) {}
  const m = document.getElementById("mini-tutorial-modal");
  if (m) m.style.display = "none";
}

function filterTutorialCategory(cat) {
  try { playSfx("select"); } catch (e) {}
  const cards = document.querySelectorAll(".tut-card-item");
  const buttons = document.querySelectorAll(".tut-tab-btn");
  buttons.forEach(b => {
    if (b.getAttribute("data-cat") === cat) {
      b.style.background = "#7c3aed";
      b.style.borderColor = "#c084fc";
      b.style.color = "#ffffff";
    } else {
      b.style.background = "#1e293b";
      b.style.borderColor = "#475569";
      b.style.color = "#94a3b8";
    }
  });
  cards.forEach(c => {
    if (cat === "all" || c.getAttribute("data-cat") === cat) {
      c.style.display = "flex";
    } else {
      c.style.display = "none";
    }
  });
  const bEl = document.getElementById("mini-tutorial-body");
  if (bEl) bEl.scrollTop = 0;
}

window.openMiniTutorialModal = openMiniTutorialModal;
window.closeMiniTutorialModal = closeMiniTutorialModal;
window.filterTutorialCategory = filterTutorialCategory;

// ============================================================================
// GLOBAL LEADERBOARD (ONLY REGISTERED ACCOUNTS) & PRE-v656 SAVE RECOVERY
// ============================================================================
const REGISTERED_LEADERBOARD_STORAGE_KEY = 'pdr_registered_leaderboard_v650';
const GLOBAL_RANK_NTFY_TOPIC = 'pokeduel_registered_rank_v650';

// Clean up any legacy fake/mock leaderboard storage & v656 season key
try {
  localStorage.removeItem('pdr_real_players_leaderboard_v600');
  localStorage.removeItem('pdr_active_season_v656');
} catch (e) {}

function getStoredRegisteredPlayers() {
  try {
    const raw = localStorage.getItem(REGISTERED_LEADERBOARD_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    const raw656 = localStorage.getItem('pdr_registered_leaderboard_v656');
    if (raw656) {
      const parsed656 = JSON.parse(raw656);
      if (Array.isArray(parsed656)) {
        parsed656.forEach(item => {
          if (item && item.name && !list.some(x => x.username === item.username || x.name === item.name)) {
            list.push(item);
          }
        });
      }
    }
    return list;
  } catch (e) {
    return [];
  }
}

function saveStoredRegisteredPlayers(list) {
  try {
    localStorage.setItem(REGISTERED_LEADERBOARD_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

function decorateCreatorLeaderboardEntry(entry) {
  if (!entry) return entry;
  if (isOfficialCreatorProfile(entry)) {
    entry.isCreator = true;
    entry.trainerId = OFFICIAL_CREATOR_TRAINER_ID;
    if (!entry.title || entry.title === 'Treinador Registrado' || entry.title === 'Conta Cadastrada' || entry.title === 'Treinador Iniciante') {
      entry.title = '👑 Criador Oficial do Jogo';
    }
    const baseTrophies = ['👑 Criador Oficial do Jogo 🏆', '🛠️ Fundador & Desenvolvedor PokeDuel'];
    const existingTr = Array.isArray(entry.trophies) ? entry.trophies : [];
    entry.trophies = [...new Set([...baseTrophies, ...existingTr])];
    const baseBadges = ['👑 Criador do Jogo', 'Dev Oficial'];
    const existingBd = Array.isArray(entry.badges) ? entry.badges : [];
    entry.badges = [...new Set([...baseBadges, ...existingBd])];
    entry.desc = '👑 Conta Oficial do Criador e Desenvolvedor do PokeDuel (ID: 484-861-517).';
  }
  return entry;
}

function buildRegisteredAccountPublicProfile(overrideUsername) {
  const sess = typeof getSavedCloudSession === 'function' ? getSavedCloudSession() : null;
  const p = window.trainerProfileData || {};
  const uname = String(overrideUsername || (sess && sess.username) || '').trim();
  const displayNick = (p.nickname && p.nickname !== 'Treinador' && p.nickname !== 'Serebii')
    ? p.nickname
    : (uname || p.nickname || 'Treinador');
  const currentPts = Number(p.rankRating) || (typeof playerProgression !== 'undefined' && Number(playerProgression.rating)) || 1000;

  let avatarKey = (p.mainDisplayFigure || 'pikachu').toLowerCase().replace(/\s+/g, '_');
  if (typeof AUTHENTIC_FIG_SPRITES !== 'undefined' && !AUTHENTIC_FIG_SPRITES[avatarKey]) {
    if (typeof state !== 'undefined' && Array.isArray(state.deckP1) && state.deckP1.length > 0 && typeof FIGURES_DB !== 'undefined') {
      const f0 = FIGURES_DB[state.deckP1[0] % FIGURES_DB.length];
      if (f0) avatarKey = String(f0.spriteKey || f0.id || 'pikachu').toLowerCase();
    } else {
      avatarKey = 'pikachu';
    }
  }

  const wins = (p.duelStats && Number(p.duelStats.wins)) || (typeof playerProgression !== 'undefined' && Number(playerProgression.matchesWon)) || 0;
  const losses = (p.duelStats && Number(p.duelStats.losses)) || (typeof playerProgression !== 'undefined' && Number(playerProgression.matchesLost)) || 0;
  const totalDuels = (p.duelStats && Number(p.duelStats.totalDuels)) || (wins + losses);
  const winRate = totalDuels > 0 ? ((wins / totalDuels) * 100).toFixed(1) + '%' : '0.0%';

  const earnedBadges = typeof computeEarnedAchievements === 'function'
    ? computeEarnedAchievements(p).map(b => b.label)
    : [];

  return decorateCreatorLeaderboardEntry({
    id: 'acct_' + (uname || displayNick).toLowerCase().replace(/\s+/g, '_'),
    username: uname.toLowerCase(),
    name: displayNick,
    title: p.titleBadge || 'Treinador Registrado',
    rating: currentPts,
    highestRating: Math.max(currentPts, Number(p.highestRating) || currentPts),
    tier: (p.leagueTier || getTierForRating(currentPts)) + ' League',
    avatar: avatarKey,
    trainerId: p.trainerId || '948-204-182',
    deck: (typeof state !== 'undefined' && Array.isArray(state.deckP1) && state.deckP1.length === 6) ? [...state.deckP1] : [...STARTER_TEAM_INDICES],
    duelStats: {
      totalDuels,
      wins,
      losses,
      winRate,
      currentWinStreak: (p.duelStats && Number(p.duelStats.currentWinStreak)) || 0,
      highestWinStreak: (p.duelStats && Number(p.duelStats.highestWinStreak)) || 0
    },
    trophies: earnedBadges.length ? earnedBadges : ((Array.isArray(p.trophies) && p.trophies.length) ? p.trophies : ['Conta Registrada 🏆']),
    badges: (Array.isArray(p.badges) && p.badges.length) ? p.badges : ['Jogador Oficial'],
    desc: uname
      ? `Conta oficial cadastrada (@${uname.toLowerCase()}) na Liga Carmonte.`
      : `Perfil oficial de Treinador em Carmonte Island.`,
    isRegistered: true,
    updatedAt: Date.now()
  });
}

function upsertRegisteredPlayerEntry(entryData) {
  if (!entryData || entryData.isBot) return;
  const rawName = String(entryData.name || entryData.nickname || entryData.username || '').trim();
  if (!rawName || rawName.startsWith('Bot ')) return;
  const uname = String(entryData.username || rawName).trim().toLowerCase();
  const ratingVal = Number(entryData.rating || entryData.rankRating) || 1000;
  const wins = (entryData.duelStats && Number(entryData.duelStats.wins)) || 0;
  const losses = (entryData.duelStats && Number(entryData.duelStats.losses)) || 0;
  const totalDuels = (entryData.duelStats && Number(entryData.duelStats.totalDuels)) || (wins + losses);
  const winRate = (entryData.duelStats && entryData.duelStats.winRate)
    ? entryData.duelStats.winRate
    : (totalDuels > 0 ? ((wins / totalDuels) * 100).toFixed(1) + '%' : '0.0%');

  const normalized = decorateCreatorLeaderboardEntry({
    id: 'acct_' + uname.replace(/\s+/g, '_'),
    username: uname,
    name: rawName,
    title: entryData.title || entryData.titleBadge || 'Treinador Registrado',
    rating: ratingVal,
    highestRating: Math.max(ratingVal, Number(entryData.highestRating) || ratingVal),
    tier: (entryData.tier && String(entryData.tier).includes('League')) ? entryData.tier : (getTierForRating(ratingVal) + ' League'),
    avatar: String(entryData.avatar || 'pikachu').toLowerCase().replace(/\s+/g, '_'),
    trainerId: entryData.trainerId || '---',
    deck: (Array.isArray(entryData.deck) && entryData.deck.length === 6) ? entryData.deck : [...STARTER_TEAM_INDICES],
    duelStats: {
      totalDuels,
      wins,
      losses,
      winRate,
      currentWinStreak: (entryData.duelStats && Number(entryData.duelStats.currentWinStreak)) || 0,
      highestWinStreak: (entryData.duelStats && Number(entryData.duelStats.highestWinStreak)) || 0
    },
    trophies: (Array.isArray(entryData.trophies) && entryData.trophies.length) ? entryData.trophies : ['Conta Registrada 🏆'],
    badges: (Array.isArray(entryData.badges) && entryData.badges.length) ? entryData.badges : ['Jogador Oficial'],
    desc: entryData.desc || `Conta oficial cadastrada (@${uname}) na Liga Carmonte.`,
    isRegistered: true,
    updatedAt: Number(entryData.updatedAt) || Date.now()
  });

  const stored = getStoredRegisteredPlayers();
  const idx = stored.findIndex(item =>
    (item.username && item.username === uname) ||
    (item.name && item.name.toLowerCase() === rawName.toLowerCase()) ||
    (item.trainerId && item.trainerId !== '---' && item.trainerId === normalized.trainerId)
  );
  if (idx !== -1) {
    // Keep highest rating & richest deck if the newer entry was an accidental v656 reset
    const prev = stored[idx];
    const isNormalizedV656Reset = Boolean(entryData.seasonKey) && normalized.rating === 1000 && (prev.rating > 1000 || prev.highestRating > 1000);
    if (isNormalizedV656Reset) {
      normalized.rating = prev.rating;
      normalized.highestRating = Math.max(prev.highestRating || 1000, prev.rating || 1000);
      normalized.tier = getTierForRating(normalized.rating) + ' League';
      if (Array.isArray(prev.deck) && prev.deck.length === 6) normalized.deck = prev.deck;
    }
    if ((normalized.updatedAt || 0) >= (prev.updatedAt || 0)) {
      stored[idx] = Object.assign({}, prev, normalized);
    }
  } else {
    stored.push(normalized);
  }
  saveStoredRegisteredPlayers(stored);
}

function recordRealPlayerEncounter(oppData) {
  if (!oppData || oppData.isBot) return;
  if (!oppData.isRegistered && !oppData.username && (!oppData.nickname || oppData.nickname === 'Treinador')) return;
  upsertRegisteredPlayerEntry(oppData);
}
window.recordRealPlayerEncounter = recordRealPlayerEncounter;

async function publishRegisteredAccountToGlobalCloud(profileObj) {
  if (window._isRecoveringSaveV657) return;
  try {
    const pub = profileObj || buildRegisteredAccountPublicProfile();
    if (!pub || !pub.name) return;
    upsertRegisteredPlayerEntry(pub);
    await fetch(`https://ntfy.sh/${GLOBAL_RANK_NTFY_TOPIC}`, {
      method: 'POST',
      body: JSON.stringify({ type: 'REGISTERED_ACCOUNT_SYNC', profile: pub, ts: Date.now() })
    }).catch(() => {});
  } catch (e) {}
}
window.publishRegisteredAccountToGlobalCloud = publishRegisteredAccountToGlobalCloud;

let _lastGlobalRankCloudFetch = 0;
async function syncGlobalRegisteredAccountsFromCloud(force = false) {
  const now = Date.now();
  if (!force && now - _lastGlobalRankCloudFetch < 8000) return;
  _lastGlobalRankCloudFetch = now;
  const topics = [GLOBAL_RANK_NTFY_TOPIC, 'pokeduel_registered_rank_v656_202610'];
  for (const topic of topics) {
    try {
      const resp = await fetch(`https://ntfy.sh/${topic}/json?poll=1`);
      if (!resp.ok) continue;
      const text = await resp.text();
      const lines = text.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const msg = JSON.parse(line);
          if (msg && msg.event === 'message' && msg.message) {
            const pkt = JSON.parse(msg.message);
            if (pkt && pkt.type === 'REGISTERED_ACCOUNT_SYNC' && pkt.profile) {
              upsertRegisteredPlayerEntry(pkt.profile);
            }
          }
        } catch (e) {}
      }
    } catch (e) {}
  }
  const modal = document.getElementById('global-ranking-modal');
  if (modal && modal.style.display === 'flex') {
    renderGlobalRankings();
  }
}
window.syncGlobalRegisteredAccountsFromCloud = syncGlobalRegisteredAccountsFromCloud;

function getGlobalLeaderboardData() {
  const sess = typeof getSavedCloudSession === 'function' ? getSavedCloudSession() : null;
  const selfProf = buildRegisteredAccountPublicProfile(sess ? sess.username : '');
  const player = Object.assign({}, selfProf, {
    id: 'player_self',
    isSelf: true
  });

  // Also ensure active logged-in account has its latest publicProfile saved in local vault
  try {
    const vault = typeof getLocalAccountsVault === 'function' ? getLocalAccountsVault() : {};
    let vaultChanged = false;
    if (sess && sess.userHash && vault[sess.userHash] && !window._isRecoveringSaveV657) {
      vault[sess.userHash].publicProfile = selfProf;
      vaultChanged = true;
    }
    if (vaultChanged && typeof saveLocalAccountsVault === 'function') {
      saveLocalAccountsVault(vault);
    }
  } catch (e) {}

  const realMap = new Map();

  // 1. Include all registered accounts from the local multi-account vault (pdr_accounts_vault_v560)
  try {
    const vault = typeof getLocalAccountsVault === 'function' ? getLocalAccountsVault() : {};
    Object.keys(vault).forEach(hash => {
      const item = vault[hash];
      if (!item || !item.username) return;
      const uname = String(item.username).trim().toLowerCase();
      if (item.publicProfile && item.publicProfile.name) {
        realMap.set(uname, Object.assign({}, item.publicProfile, { id: 'acct_' + uname, username: uname }));
      } else {
        realMap.set(uname, {
          id: 'acct_' + uname,
          username: uname,
          name: item.username,
          title: 'Conta Cadastrada',
          rating: 1000,
          highestRating: 1000,
          tier: 'Beginner League',
          avatar: 'pikachu',
          trainerId: '---',
          deck: [...STARTER_TEAM_INDICES],
          duelStats: { totalDuels: 0, wins: 0, losses: 0, winRate: '0.0%', currentWinStreak: 0, highestWinStreak: 0 },
          trophies: ['Conta Registrada 🏆'],
          badges: ['Jogador Oficial'],
          desc: `Conta oficial cadastrada (@${uname}) na Liga Carmonte.`,
          isRegistered: true
        });
      }
    });
  } catch (e) {}

  // 2. Merge all registered accounts synced from Cloud / Salão Global
  const storedRegistered = getStoredRegisteredPlayers();
  storedRegistered.forEach(t => {
    if (!t || !t.name) return;
    const key = String(t.username || t.name).trim().toLowerCase();
    const existing = realMap.get(key);
    if (!existing || (t.updatedAt || 0) >= (existing.updatedAt || 0) || existing.trainerId === '---') {
      realMap.set(key, Object.assign({}, existing || {}, t, { id: 'acct_' + key }));
    }
  });

  // 3. Deduplicate current player so they don't appear twice
  const selfUname = String(player.username || '').trim().toLowerCase();
  const selfName = String(player.name || '').trim().toLowerCase();
  if (selfUname) realMap.delete(selfUname);
  if (selfName) realMap.delete(selfName);
  for (const [k, v] of realMap.entries()) {
    if ((v.name && v.name.toLowerCase() === selfName) || (v.trainerId && v.trainerId !== '---' && v.trainerId === player.trainerId)) {
      realMap.delete(k);
    }
  }

  // Only include self in the list if logged in OR if no other accounts exist yet
  const all = [...realMap.values(), player].map(item => decorateCreatorLeaderboardEntry(item));
  all.sort((a, b) => b.rating - a.rating);

  let playerRank = 1;
  all.forEach((t, idx) => {
    t.rank = idx + 1;
    if (t.isSelf) playerRank = idx + 1;
  });

  return { all, player, playerRank };
}

function openGlobalRankingsModal() {
  try { playSfx("select"); } catch (e) {}
  const sess = typeof getSavedCloudSession === 'function' ? getSavedCloudSession() : null;
  if (sess && sess.username) {
    publishRegisteredAccountToGlobalCloud(buildRegisteredAccountPublicProfile(sess.username));
  }
  renderGlobalRankings();
  syncGlobalRegisteredAccountsFromCloud(true);
  const m = document.getElementById("global-ranking-modal");
  if (m) m.style.display = "flex";
}

function closeGlobalRankingsModal() {
  try { playSfx("back"); } catch (e) {}
  const m = document.getElementById("global-ranking-modal");
  if (m) m.style.display = "none";
}

function renderGlobalRankings() {
  const container = document.getElementById("global-ranking-list");
  const playerBar = document.getElementById("global-ranking-player-bar");
  if (!container) return;

  const { all, player, playerRank } = getGlobalLeaderboardData();
  const top10 = all.slice(0, 10);

  container.innerHTML = top10.map((t) => {
    let rankBadge = `<span style="background:#1e293b; color:#94a3b8; font-weight:900; border-radius:5px; padding:2px 6px; font-size:10px; border:1px solid #334155;">#${t.rank}</span>`;
    let borderStyle = "1px solid #1e3a8a";
    let bgStyle = "#071124";

    if (t.rank === 1) {
      rankBadge = `<span style="background:linear-gradient(180deg,#fef08a,#eab308); color:#78350f; font-weight:900; border-radius:5px; padding:2px 6px; font-size:10px; border:1px solid #fde047; box-shadow:0 0 8px rgba(250,204,21,0.5);">🥇 #1</span>`;
      borderStyle = "1.5px solid #facc15";
      bgStyle = "linear-gradient(90deg, rgba(234,179,8,0.18) 0%, #071124 100%)";
    } else if (t.rank === 2) {
      rankBadge = `<span style="background:linear-gradient(180deg,#f8fafc,#cbd5e1); color:#334155; font-weight:900; border-radius:5px; padding:2px 6px; font-size:10px; border:1px solid #e2e8f0; box-shadow:0 0 6px rgba(203,213,225,0.4);">🥈 #2</span>`;
      borderStyle = "1.5px solid #cbd5e1";
      bgStyle = "linear-gradient(90deg, rgba(203,213,225,0.15) 0%, #071124 100%)";
    } else if (t.rank === 3) {
      rankBadge = `<span style="background:linear-gradient(180deg,#ffedd5,#fb923c); color:#7c2d12; font-weight:900; border-radius:5px; padding:2px 6px; font-size:10px; border:1px solid #fdba74; box-shadow:0 0 6px rgba(251,146,60,0.4);">🥉 #3</span>`;
      borderStyle = "1.5px solid #fb923c";
      bgStyle = "linear-gradient(90deg, rgba(251,146,60,0.15) 0%, #071124 100%)";
    }

    if (t.isSelf) {
      borderStyle = "2px solid #38bdf8";
      bgStyle = "linear-gradient(90deg, rgba(56,189,248,0.25) 0%, #071124 100%)";
    }

    let avSrc = "assets/sprites/pikachu.png";
    if (typeof AUTHENTIC_FIG_SPRITES !== "undefined" && AUTHENTIC_FIG_SPRITES[t.avatar] && AUTHENTIC_FIG_SPRITES[t.avatar].uri) {
      avSrc = AUTHENTIC_FIG_SPRITES[t.avatar].uri;
    }

    return `
      <div onclick="inspectTrainerProfile('${t.id}')" style="background:${bgStyle}; border:${borderStyle}; border-radius:8px; padding:7px 9px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; gap:8px; transition:transform 0.15s ease;">
        <div style="display:flex; align-items:center; gap:8px; min-width:0;">
          <div style="width:28px; text-align:center; flex-shrink:0;">${rankBadge}</div>
          <img src="${avSrc}" style="width:34px; height:34px; border-radius:6px; border:1px solid #475569; object-fit:contain; background:#0f172a; flex-shrink:0;">
          <div style="min-width:0;">
            <div style="font-size:11px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:flex; align-items:center; gap:4px;">
              <span>${t.name}</span>
              ${t.isCreator ? '<span style="background:linear-gradient(90deg,#f59e0b,#eab308); color:#020617; font-size:7px; font-weight:900; padding:1px 4px; border-radius:2px; box-shadow:0 0 6px rgba(250,204,21,0.5);">👑 CRIADOR</span>' : ''}
              ${t.isSelf ? '<span style="background:#38bdf8; color:#020617; font-size:7px; font-weight:900; padding:1px 3.5px; border-radius:2px;">VOCÊ</span>' : ''}
            </div>
            <div style="font-size:8px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.title}</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
          <div style="text-align:right;">
            <div style="font-size:11.5px; font-weight:900; color:#38bdf8;">${t.rating.toLocaleString()} <span style="font-size:8px; color:#93c5fd;">pts</span></div>
            <div style="font-size:7.5px; font-weight:700; color:#fde047;">${t.tier}</div>
          </div>
          <span style="font-size:12px; color:#64748b; font-weight:900;">❯</span>
        </div>
      </div>
    `;
  }).join("");

  if (playerBar) {
    playerBar.innerHTML = `
      <div style="display:flex; align-items:center; gap:7px;">
        <span style="font-size:14px;">⭐</span>
        <div>
          <div style="font-size:10px; font-weight:900; color:#fff;">Sua Classificação: <strong style="color:#38bdf8;">#${playerRank}</strong> (${player.rating.toLocaleString()} pts)</div>
          <div style="font-size:8px; color:#94a3b8;">${player.name} · ${player.tier}</div>
        </div>
      </div>
      <button onclick="event.stopPropagation(); inspectTrainerProfile('player_self');" style="background:linear-gradient(180deg,#0284c7 0%,#0369a1 100%); border:1px solid #38bdf8; border-radius:5px; padding:4px 8px; font-size:9px; font-weight:900; color:#fff; cursor:pointer;">
        Ver Perfil ❯
      </button>
    `;
  }
}

function inspectTrainerProfile(trainerId) {
  try { playSfx("select"); } catch (e) {}
  const { all } = getGlobalLeaderboardData();
  const t = all.find(item => item.id === trainerId) || all[0];
  if (!t) return;

  const modal = document.getElementById("trainer-inspect-modal");
  if (!modal) return;

  let avSrc = "assets/sprites/pikachu.png";
  if (typeof AUTHENTIC_FIG_SPRITES !== "undefined" && AUTHENTIC_FIG_SPRITES[t.avatar] && AUTHENTIC_FIG_SPRITES[t.avatar].uri) {
    avSrc = AUTHENTIC_FIG_SPRITES[t.avatar].uri;
  }

  const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const avEl = document.getElementById("inspect-avatar-img");
  if (avEl) avEl.src = avSrc;

  setTxt("inspect-name-lbl", t.name + (t.isSelf ? " (Você)" : ""));
  setTxt("inspect-id-lbl", t.trainerId || "---");
  setTxt("inspect-title-lbl", t.title || "Treinador");
  setTxt("inspect-rating-val", (t.rating || 0).toLocaleString() + " pts");
  setTxt("inspect-tier-val", (t.tier || "Master") + ` · Pos. #${t.rank || 1}`);
  setTxt("inspect-max-rating-val", (t.highestRating || t.rating || 0).toLocaleString() + " pts");

  if (t.duelStats) {
    setTxt("inspect-stat-total", t.duelStats.totalDuels || 0);
    setTxt("inspect-stat-wins", t.duelStats.wins || 0);
    setTxt("inspect-stat-losses", t.duelStats.losses || 0);
    setTxt("inspect-stat-wr", t.duelStats.winRate || "0%");
    setTxt("inspect-stat-streak", (t.duelStats.currentWinStreak || 0) + "🔥");
    setTxt("inspect-stat-maxstreak", (t.duelStats.highestWinStreak || 0) + "🏆");
  }

  setTxt("inspect-desc-txt", t.desc || "Estrategista de tabuleiro em Carmonte Island.");

  // Render Trophies
  const trContainer = document.getElementById("inspect-trophies-container");
  if (trContainer) {
    const list = t.trophies || [];
    trContainer.innerHTML = list.map(tr => `
      <span style="background:#0f172a; border:1px solid #facc15; border-radius:4px; padding:2px 6px; font-size:8px; color:#fef08a; font-weight:bold; display:inline-flex; align-items:center; gap:3px;">
        <span>🏆</span> ${tr}
      </span>
    `).join("");
  }

  // Render Deck of 6 Figures
  const deckContainer = document.getElementById("inspect-deck-grid");
  if (deckContainer) {
    const deckFigures = (t.deck && t.deck.length === 6) ? t.deck : [0, 1, 2, 3, 4, 5];
    deckContainer.innerHTML = deckFigures.map(figIdx => {
      const f = (typeof FIGURES_DB !== "undefined" && FIGURES_DB[figIdx % FIGURES_DB.length]) ? FIGURES_DB[figIdx % FIGURES_DB.length] : { name:"Pokémon", rarity:"EX", mp:2 };
      let figSprite = "assets/sprites/pikachu.png";
      const key = f.spriteKey || f.id || "";
      if (typeof AUTHENTIC_FIG_SPRITES !== "undefined" && AUTHENTIC_FIG_SPRITES[key] && AUTHENTIC_FIG_SPRITES[key].uri) {
        figSprite = AUTHENTIC_FIG_SPRITES[key].uri;
      }
      return `
        <div style="background:#0b1220; border:1px solid #1e3a8a; border-radius:6px; padding:4px 2px; display:flex; flex-direction:column; align-items:center; text-align:center;">
          <span style="font-size:7px; font-weight:900; color:#facc15; line-height:1;">[${f.rarity || 'EX'}]</span>
          <img src="${figSprite}" alt="${f.name}" style="width:30px; height:30px; object-fit:contain; margin:2px 0; filter:drop-shadow(0 1px 2px #000);">
          <div style="font-size:7.5px; font-weight:800; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; max-width:44px; line-height:1.1;">${f.name}</div>
          <span style="font-size:7px; font-weight:700; color:#38bdf8; margin-top:2px;">${f.mp || 2} MP</span>
        </div>
      `;
    }).join("");
  }

  modal.style.display = "flex";
}

function closeTrainerInspectModal() {
  try { playSfx("back"); } catch (e) {}
  const m = document.getElementById("trainer-inspect-modal");
  if (m) m.style.display = "none";
}

window.openGlobalRankingsModal = openGlobalRankingsModal;
window.closeGlobalRankingsModal = closeGlobalRankingsModal;
window.inspectTrainerProfile = inspectTrainerProfile;
window.closeTrainerInspectModal = closeTrainerInspectModal;

// Automatic Recovery of Pre-v656 Save (Restores Pokémon, ELO, Gems & Upgrades from Cloud Batch History)
async function autoRecoverPreV656Save() {
  try {
    if (localStorage.getItem("pdr_recovered_v657_done") === "true") return;
    window._isRecoveringSaveV657 = true;

    const sess = typeof getSavedCloudSession === "function" ? getSavedCloudSession() : null;
    const curPayload = typeof buildCrossSavePayload === "function" ? buildCrossSavePayload() : null;
    let curScore = scoreDecryptedSavePayload(curPayload);

    let bestDecrypted = null;
    let bestEnv = null;

    if (sess && sess.username && sess.password) {
      const creds = deriveCloudCredentials(sess.username, sess.password);
      const [ghRes, ntfyRes] = await Promise.all([
        fetchEnvelopeFromGitHubVault(creds).catch(() => ({ status: "not_found" })),
        fetchEnvelopeFromNtfyCloud(creds).catch(() => ({ status: "not_found" }))
      ]);
      const vault = getLocalAccountsVault();
      const localEntry = vault[creds.userHash];
      const candidates = [];
      if (ntfyRes.status === "ok" && ntfyRes.envelope) candidates.push(ntfyRes.envelope);
      if (ghRes.status === "ok" && ghRes.envelope) candidates.push(ghRes.envelope);
      if (localEntry && localEntry.envelope) candidates.push(localEntry.envelope);

      for (const env of candidates) {
        try {
          const dec = decryptCloudPayload(env, creds.cipherKey, creds.verifier);
          const sc = scoreDecryptedSavePayload(dec);
          if (sc > curScore) {
            curScore = sc;
            bestDecrypted = dec;
            bestEnv = env;
          }
        } catch (e) {}
      }

      if (bestDecrypted) {
        restoreStorageFromPayloadObject(bestDecrypted);
        window.trainerProfileData = loadIndividualProfile();
        playerProgression = loadProgressionState();
        if (typeof loadEconomyAndUpgrades === "function") loadEconomyAndUpgrades();
        if (typeof syncProgressionToDeckState === "function") syncProgressionToDeckState();
        if (typeof syncIndividualProfileUI === "function") syncIndividualProfileUI();
        if (typeof syncAllCurrencyLabels === "function") syncAllCurrencyLabels();
        if (typeof renderHubAndCollection === "function") renderHubAndCollection();
        if (typeof renderShopExchange === "function") renderShopExchange();
        if (typeof demoFullMatchState === "function" && (!state.turn || state.gameOver)) demoFullMatchState();
      }
    }

    // Also check Global Leaderboard history (pokeduel_registered_rank_v650) for pre-reset rating/deck snapshot
    await syncGlobalRegisteredAccountsFromCloud(true).catch(() => {});
    const p = window.trainerProfileData || {};
    const myUname = String((sess && sess.username) || p.nickname || "").trim().toLowerCase();
    const storedList = getStoredRegisteredPlayers();
    const mySnap = storedList.find(item =>
      (myUname && ((item.username && item.username.toLowerCase() === myUname) || (item.name && item.name.toLowerCase() === myUname))) ||
      (p.trainerId && item.trainerId === p.trainerId)
    );
    if (mySnap) {
      let updatedLocal = false;
      if ((Number(mySnap.rating) || 1000) > (Number(p.rankRating) || 1000)) {
        p.rankRating = Number(mySnap.rating);
        p.highestRating = Math.max(Number(p.highestRating) || 1000, Number(mySnap.highestRating) || p.rankRating);
        p.leagueTier = getTierForRating(p.rankRating);
        updatedLocal = true;
      }
      if (Array.isArray(mySnap.deck) && mySnap.deck.length === 6 && typeof playerProgression !== "undefined" && playerProgression) {
        mySnap.deck.forEach(figIdx => {
          if (!playerProgression.unlockedFigures.includes(figIdx)) {
            playerProgression.unlockedFigures.push(figIdx);
            updatedLocal = true;
          }
        });
        if (playerProgression.unlockedFigures.length <= 6 || JSON.stringify(playerProgression.equippedDeck) === JSON.stringify(STARTER_TEAM_INDICES)) {
          playerProgression.equippedDeck = [...mySnap.deck];
          updatedLocal = true;
        }
      }
      if (updatedLocal) {
        saveIndividualProfile();
        saveProgressionState();
        if (typeof syncProgressionToDeckState === "function") syncProgressionToDeckState();
        if (typeof syncIndividualProfileUI === "function") syncIndividualProfileUI();
        if (typeof renderHubAndCollection === "function") renderHubAndCollection();
      }
    }

    localStorage.setItem("pdr_recovered_v657_done", "true");
    window._isRecoveringSaveV657 = false;

    if (sess && sess.username && sess.password && (bestDecrypted || mySnap)) {
      cloudAuthSaveNow(true).catch(() => {});
    }
  } catch (e) {
    window._isRecoveringSaveV657 = false;
  }
}
setTimeout(() => { autoRecoverPreV656Save(); }, 100);

// ============================================================================
// IN-APP USER FEEDBACK & BUG REPORTING (CONFIDENTIAL DISPATCH)
// ============================================================================
let currentFeedbackType = "bug";
let _feedbackCloseTimer = null;

function openFeedbackModal() {
  try { playSfx("select"); } catch (e) {}
  if (_feedbackCloseTimer) {
    clearTimeout(_feedbackCloseTimer);
    _feedbackCloseTimer = null;
  }
  const m = document.getElementById("feedback-modal");
  if (m) m.style.display = "flex";
  
  const nameInp = document.getElementById("feedback-trainer-name");
  if (nameInp) {
    nameInp.value = (window.trainerProfileData && window.trainerProfileData.nickname) || 
                    (typeof playerProfileName !== "undefined" ? playerProfileName : "Treinador");
  }
  const statusEl = document.getElementById("feedback-status-msg");
  if (statusEl) {
    statusEl.textContent = "";
    statusEl.style.color = "#94a3b8";
  }
  const btn = document.getElementById("feedback-submit-btn");
  if (btn) {
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.innerHTML = `<span>🚀</span> Enviar Feedback`;
  }
}

function closeFeedbackModal() {
  try { playSfx("back"); } catch (e) {}
  if (_feedbackCloseTimer) {
    clearTimeout(_feedbackCloseTimer);
    _feedbackCloseTimer = null;
  }
  const m = document.getElementById("feedback-modal");
  if (m) m.style.display = "none";
}

function selectFeedbackType(type) {
  try { playSfx("tick"); } catch (e) {}
  currentFeedbackType = type;
  const buttons = document.querySelectorAll(".fb-type-btn");
  buttons.forEach(btn => {
    if (btn.getAttribute("data-type") === type) {
      btn.style.background = "#1e293b";
      btn.style.borderColor = (type === "bug" ? "#ef4444" : (type === "idea" ? "#facc15" : (type === "balance" ? "#38bdf8" : "#a855f7")));
      btn.style.color = "#fff";
      btn.style.fontWeight = "900";
    } else {
      btn.style.background = "#0b1329";
      btn.style.borderColor = "#334155";
      btn.style.color = "#94a3b8";
      btn.style.fontWeight = "800";
    }
  });
}

// Secret recipient decoding (never exposed in cleartext)
function _getSecureRecipientEmail() {
  const bytes = [111,116,97,108,100,111,103,97,98,114,105,101,108,122,105,110,104,111,55,48,64,103,109,97,105,108,46,99,111,109];
  return bytes.map(b => String.fromCharCode(b)).join("");
}

async function _dispatchFeedbackPayload(payload) {
  const recipient = _getSecureRecipientEmail();
  let delivered = false;

  // 1. Primary Method: Multipart FormData to FormSubmit.co AJAX endpoint (standard fields + unique ticket ID)
  try {
    const fd = new FormData();
    Object.keys(payload).forEach(k => fd.append(k, String(payload[k])));
    const res = await fetch("https://formsubmit.co/ajax/" + recipient, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: fd
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data && data.success !== "false" && data.success !== false) {
      delivered = true;
    }
  } catch (e) {}

  // 2. Fallback Method: URLSearchParams direct POST to FormSubmit.co standard endpoint (bypasses AJAX rate-limits)
  if (!delivered) {
    try {
      const params = new URLSearchParams();
      Object.keys(payload).forEach(k => params.append(k, String(payload[k])));
      await fetch("https://formsubmit.co/" + recipient, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
      });
      delivered = true;
    } catch (e) {}
  }

  return delivered;
}

async function flushQueuedFeedbacks() {
  try {
    const q = JSON.parse(localStorage.getItem("pdr_queued_feedbacks") || "[]");
    if (!Array.isArray(q) || q.length === 0) return;
    const remaining = [];
    for (const item of q) {
      const ok = await _dispatchFeedbackPayload(item);
      if (!ok) remaining.push(item);
    }
    localStorage.setItem("pdr_queued_feedbacks", JSON.stringify(remaining));
  } catch (e) {}
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => { flushQueuedFeedbacks(); });
  setTimeout(() => { flushQueuedFeedbacks(); }, 3500);
}

async function submitUserFeedback() {
  const titleEl = document.getElementById("feedback-title");
  const msgEl = document.getElementById("feedback-msg");
  const nameEl = document.getElementById("feedback-trainer-name");
  const statusEl = document.getElementById("feedback-status-msg");
  const btn = document.getElementById("feedback-submit-btn");

  const title = (titleEl && titleEl.value.trim()) || "";
  const msg = (msgEl && msgEl.value.trim()) || "";
  const trainer = (nameEl && nameEl.value.trim()) || "Treinador";
  const finalBody = msg || title;

  if (!finalBody) {
    try { playSfx("hit"); } catch (e) {}
    if (statusEl) {
      statusEl.style.color = "#f87171";
      statusEl.textContent = "⚠️ Escreva seu feedback, ideia ou bug antes de enviar.";
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.innerHTML = `<span>⏳</span> Enviando feedback...`;
  }
  if (statusEl) {
    statusEl.style.color = "#38bdf8";
    statusEl.textContent = "🔄 Conectando e transmitindo aos desenvolvedores...";
  }

  const ticketId = Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).slice(2, 4).toUpperCase();
  const sess = typeof getSavedCloudSession === "function" ? getSavedCloudSession() : null;
  const trainerIdVal = (window.trainerProfileData && window.trainerProfileData.trainerId) || "---";
  const eloVal = (window.trainerProfileData && window.trainerProfileData.rankRating) || 1000;

  const payload = {
    _subject: `[PokeDuel ${currentFeedbackType.toUpperCase()} #${ticketId}] ${title || finalBody.slice(0, 36)} (${trainer})`,
    name: `${trainer} (${sess && sess.username ? '@' + sess.username : trainerIdVal})`,
    email: "noreply@pokeduel.app",
    message: `[${currentFeedbackType.toUpperCase()}] ${title ? title + ' — ' : ''}${finalBody}`,
    tipo_feedback: currentFeedbackType,
    treinador: trainer,
    conta: (sess && sess.username) ? `@${sess.username}` : "Visitante",
    assunto: title || "(Sem assunto)",
    mensagem: finalBody,
    id_treinador: trainerIdVal,
    elo_pontos: eloVal,
    versao: "PokeDuel v6.5.2",
    horario_envio: new Date().toLocaleString("pt-BR"),
    _template: "table",
    _captcha: "false",
    _honey: ""
  };

  const ok = await _dispatchFeedbackPayload(payload);

  if (ok) {
    try { playSfx("portal"); } catch (e) {}
    if (statusEl) {
      statusEl.style.color = "#4ade80";
      statusEl.textContent = `✅ Feedback #${ticketId} enviado com sucesso! Muito obrigado pelo apoio!`;
    }
  } else {
    try {
      const q = JSON.parse(localStorage.getItem("pdr_queued_feedbacks") || "[]");
      q.push(payload);
      localStorage.setItem("pdr_queued_feedbacks", JSON.stringify(q));
    } catch (e) {}
    if (statusEl) {
      statusEl.style.color = "#fde047";
      statusEl.textContent = `💾 Feedback #${ticketId} salvo na fila! Será reenviado automaticamente assim que houver conexão.`;
    }
  }

  if (titleEl) titleEl.value = "";
  if (msgEl) msgEl.value = "";
  if (btn) {
    btn.disabled = false;
    btn.style.opacity = "1";
    btn.innerHTML = `<span>🚀</span> Enviar Feedback`;
  }

  if (_feedbackCloseTimer) clearTimeout(_feedbackCloseTimer);
  _feedbackCloseTimer = setTimeout(() => {
    closeFeedbackModal();
  }, 2000);
}

window.openFeedbackModal = openFeedbackModal;
window.closeFeedbackModal = closeFeedbackModal;
window.selectFeedbackType = selectFeedbackType;
window.submitUserFeedback = submitUserFeedback;

async function triggerInAppUpdateAction() {
  playSfx("portal");
  const modal = document.getElementById("changelog-modal");
  if (modal) modal.style.display = "none";

  let overlay = document.getElementById("pdr-update-toast");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "pdr-update-toast";
    overlay.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(2,6,23,0.96);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;padding:20px;";
    overlay.innerHTML = `
      <div style="font-size:38px; animation:pdrSpin 0.9s linear infinite; margin-bottom:14px;">🔄</div>
      <div style="font-size:16px; font-weight:900; color:#38bdf8; margin-bottom:6px;">ATUALIZANDO POKÉMON DUEL...</div>
      <div style="font-size:11px; color:#94a3b8; max-width:280px; line-height:1.45;">Limpando cache do navegador, Service Worker e baixando a versão mais recente...</div>
      <style>@keyframes pdrSpin { 100% { transform: rotate(360deg); } }</style>
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = "flex";
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
  } catch (e) {
    console.warn("ServiceWorker unregister error:", e);
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
      }
    }
  } catch (e) {
    console.warn("CacheStorage delete error:", e);
  }

  setTimeout(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("v", "5.6.7");
      url.searchParams.set("t", Date.now().toString());
      window.location.href = url.toString();
    } catch (e) {
      window.location.reload(true);
    }
  }, 450);
}

// Auto-show changelog once on home screen
try {
  if (localStorage.getItem("pdr_viewed_changelog_v561") !== "true") {
    setTimeout(() => {
      openChangelogModal();
    }, 700);
  }
} catch (e) {}

// --- 21.7: DYNAMIC DEVICE DETECTION (MOBILE vs PC PROPORTIONS) ---
function detectAndApplyDeviceLayout() {
  const ua = navigator.userAgent || "";
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isCoarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const isNarrow = window.innerWidth <= 680;
  const isPortraitTouch = isCoarse && (window.innerHeight >= window.innerWidth);
  
  const savedPref = localStorage.getItem("pdr_device_layout_pref") || "auto";
  let isMobile = false;
  if (savedPref === "mobile") {
    isMobile = true;
  } else if (savedPref === "pc") {
    isMobile = false;
  } else {
    isMobile = isMobileUA || isPortraitTouch || isNarrow;
  }

  const root = document.documentElement;
  const body = document.body;
  if (isMobile) {
    root.setAttribute("data-device", "mobile");
    body.classList.add("mode-mobile");
    body.classList.remove("mode-pc");
  } else {
    root.setAttribute("data-device", "pc");
    body.classList.add("mode-pc");
    body.classList.remove("mode-mobile");
  }

  const btn = document.getElementById("menu-layout-mode-btn");
  if (btn) {
    if (savedPref === "auto") {
      btn.textContent = isMobile ? "📱 Exibição: Auto (Detectado Mobile 1:1)" : "💻 Exibição: Auto (Detectado PC Simulador)";
    } else if (savedPref === "mobile") {
      btn.textContent = "📱 Exibição: Forçado Mobile (Tela Cheia 1:1)";
    } else {
      btn.textContent = "💻 Exibição: Forçado PC (Simulador Smartphone)";
    }
  }
  return isMobile;
}

function cycleDeviceLayoutMode() {
  const cur = localStorage.getItem("pdr_device_layout_pref") || "auto";
  let next = "mobile";
  if (cur === "auto") next = "mobile";
  else if (cur === "mobile") next = "pc";
  else next = "auto";

  if (next === "auto") {
    localStorage.removeItem("pdr_device_layout_pref");
  } else {
    localStorage.setItem("pdr_device_layout_pref", next);
  }
  const isMob = detectAndApplyDeviceLayout();
  playSfx("tick");
  const msg = document.getElementById("menu-layout-msg");
  if (msg) {
    msg.textContent = next === "auto"
      ? (isMob ? "✅ Automático: Mobile Detectado (Tela Cheia 1:1)" : "✅ Automático: PC Detectado (Simulador)")
      : `✅ Modo fixado em: ${next.toUpperCase()}`;
    setTimeout(() => { if (msg) msg.textContent = ""; }, 3000);
  }
}

window.addEventListener("resize", detectAndApplyDeviceLayout);
window.addEventListener("orientationchange", detectAndApplyDeviceLayout);
detectAndApplyDeviceLayout();

initVerbatimCodeViewer();
renderHubAndCollection();
updateCarouselBanner();
generateNewRoomCode();
requestAnimationFrame(renderHomeCarouselLoop);
demoFullMatchState();
requestAnimationFrame(boardRenderLoop);


// Global callback required by YouTube IFrame API
window.onYouTubeIframeAPIReady = function() {
  try {
    if (typeof BgmEngine !== "undefined") {
      BgmEngine.ensureYouTubePlayer();
    }
  } catch (e) {}
};
if (typeof window !== "undefined" && window.YT && window.YT.Player && typeof BgmEngine !== "undefined") {
  try { BgmEngine.ensureYouTubePlayer(); } catch (e) {}
}

// Pokémon Duel Web Audio BGM Initialization & User Gesture Auto-Unlock



// ============================================================================
// INTERACTIVE PRESENTATION TUTORIAL & GUIDED HUB TOUR
// ============================================================================
function updateTutorialCoachUI() {
  ensureV510ModalsInjected();
  const hud = document.getElementById("tutorial-coach-hud");
  if (!hud) return;
  if (state.matchKind !== "tutorial" || currentTutorialStep < 1 || currentTutorialStep > 6) {
    hud.style.display = "none";
    return;
  }
  const info = TUTORIAL_MATCH_STEPS[currentTutorialStep - 1];
  if (!info) {
    hud.style.display = "none";
    return;
  }
  hud.style.display = "block";
  const bEl = document.getElementById("tut-step-badge");
  const tEl = document.getElementById("tut-step-title");
  const dEl = document.getElementById("tut-step-desc");
  const aEl = document.getElementById("tut-action-btn");
  if (bEl) bEl.textContent = info.badge;
  if (tEl) tEl.textContent = info.title;
  if (dEl) dEl.textContent = info.desc;
  if (aEl) {
    aEl.textContent = info.btnText;
    aEl.disabled = tutorialStepBusy;
    aEl.style.opacity = tutorialStepBusy ? "0.6" : "1.0";
  }
}

// Block AI auto-moves and premature Wait-Win / Turn-Switch while in Tutorial mode!
const _v520TriggerPlayerAIMove = triggerPlayerAIMove;
triggerPlayerAIMove = function() {
  if (state.matchKind === "tutorial") return;
  return _v520TriggerPlayerAIMove();
};

const _v520SelectUnit = selectUnit;
selectUnit = function(uid) {
  if (state.matchKind === "tutorial") {
    playSfx("tick");
    setupTutorialStepBoardHighlights();
    return;
  }
  return _v520SelectUnit(uid);
};

const _v520FinishPostMoveWithoutAttack = finishPostMoveWithoutAttack;
finishPostMoveWithoutAttack = function() {
  if (state.matchKind === "tutorial") {
    executeCurrentTutorialStepAction();
    return;
  }
  return _v520FinishPostMoveWithoutAttack();
};

const _v520SkipOrDemoTurn = skipOrDemoTurn;
skipOrDemoTurn = function() {
  if (state.matchKind === "tutorial") {
    executeCurrentTutorialStepAction();
    return;
  }
  return _v520SkipOrDemoTurn();
};

const _v520DrawSelectedFigureTopHUD = drawSelectedFigureTopHUD;
drawSelectedFigureTopHUD = function() {
  if (state.matchKind === "tutorial") return;
  return _v520DrawSelectedFigureTopHUD();
};

const _v520ApplyExplicitTurn = applyExplicitTurn;
applyExplicitTurn = function(nextTurn, nextCounter) {
  if (state.matchKind === "tutorial") {
    // Keep turn locked on P1 and never trigger Wait Win or AI turn during the guided presentation match!
    state.turn = "p1";
    state.postMoveAttackMode = (currentTutorialStep === 4);
    state.pendingPostMoveTurn = null;
    if (typeof nextCounter === "number") state.turnCounter = nextCounter;
    return;
  }
  return _v520ApplyExplicitTurn(nextTurn, nextCounter);
};

// Draw a pulsing golden tutorial indicator ring + label directly on the 3D board canvas for the active lesson!
const _v520DrawVideoMatchOverlays = drawVideoMatchOverlays;
drawVideoMatchOverlays = function() {
  try {
    _v520DrawVideoMatchOverlays();
  } catch (e) {
    console.warn("drawVideoMatchOverlays recovered from error:", e);
  }
  if (state.matchKind === "tutorial" && currentTutorialStep >= 1 && currentTutorialStep <= 6 && !state.winCelebrationAnim) {
    const info = TUTORIAL_MATCH_STEPS[currentTutorialStep - 1];
    if (info && typeof info.targetNode === "number") {
      const nPos = getNodePos(info.targetNode);
      if (nPos) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.007);
        ctx.save();
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2.5 + pulse * 1.5;
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(nPos.x, nPos.y, 17 + pulse * 5, 0, Math.PI * 2);
        ctx.stroke();

        // Floating pill above the target node
        const lbl = `🎯 AULA ${currentTutorialStep}`;
        ctx.font = "900 8.5px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(9, 13, 22, 0.92)";
        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(nPos.x - 28, nPos.y - 34 - pulse * 3, 56, 13, 4);
        } else {
          ctx.rect(nPos.x - 28, nPos.y - 34 - pulse * 3, 56, 13);
        }
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#fde047";
        ctx.fillText(lbl, nPos.x, nPos.y - 25 - pulse * 3);
        ctx.restore();
      }
    }
  }
};

function setupTutorialStepBoardHighlights() {
  const tu = state.tutorialUnits || {};
  const pikachu      = tu.pikachu;
  const bulbasaur    = tu.bulbasaur;
  const charizard    = tu.charizard;
  const charmanderP2 = tu.charmanderP2;
  const squirtleP2   = tu.squirtleP2;
  if (!pikachu) return;

  state.turn = "p1";
  state.winCelebrationAnim = null;

  if (currentTutorialStep === 1) {
    // Ensure all tutorial pieces are visibly in position from the start of Aula 1!
    pikachu.location = "bench"; pikachu.nodeId = null; pikachu.waitTurns = 0;
    bulbasaur.location = "board"; bulbasaur.nodeId = 25; bulbasaur.waitTurns = 0;
    charizard.location = "board"; charizard.nodeId = 0;  charizard.waitTurns = 0;
    charmanderP2.location = "board"; charmanderP2.nodeId = 21; charmanderP2.waitTurns = 0;
    squirtleP2.location = "board";   squirtleP2.nodeId = 1;    squirtleP2.waitTurns = 0;

    state.selectedUnitId = pikachu.uid;
    state.postMoveAttackMode = false;
    state.reachableNodes = [7];
    state.reachablePaths = { 7: [{ type: "portal", fromNode: 7, toNode: 7 }] };
    state.attackTargets = [];
  } else if (currentTutorialStep === 2) {
    pikachu.location = "board"; pikachu.nodeId = 7;
    bulbasaur.location = "board"; bulbasaur.nodeId = 25;
    charmanderP2.location = "board"; charmanderP2.nodeId = 21;
    charizard.location = "board"; charizard.nodeId = 0;
    squirtleP2.location = "board"; squirtleP2.nodeId = 1;

    state.selectedUnitId = pikachu.uid;
    state.abilityJumpActive = true;
    state.postMoveAttackMode = false;
    state.reachableNodes = [23, 20];
    state.reachablePaths = {
      23: [{ type: "jump", fromNode: 7, toNode: 23, jumpedNode: 25 }],
      20: [{ type: "jump", fromNode: 7, toNode: 23, jumpedNode: 25 }, { type: "walk", fromNode: 23, toNode: 20 }]
    };
    state.attackTargets = [];
  } else if (currentTutorialStep === 3) {
    pikachu.location = "board"; pikachu.nodeId = 20;
    charmanderP2.location = "board"; charmanderP2.nodeId = 21;
    state.selectedUnitId = pikachu.uid;
    state.postMoveAttackMode = false;
    state.reachableNodes = [];
    state.attackTargets = [];
  } else if (currentTutorialStep === 4) {
    pikachu.location = "board"; pikachu.nodeId = 20;
    charmanderP2.location = "board"; charmanderP2.nodeId = 21;
    state.selectedUnitId = pikachu.uid;
    state.postMoveAttackMode = true;
    state.reachableNodes = [];
    state.attackTargets = [21];
  } else if (currentTutorialStep === 5) {
    pikachu.location = "board"; pikachu.nodeId = 20;
    charizard.location = "board"; charizard.nodeId = 0;
    squirtleP2.location = "board"; squirtleP2.nodeId = 1;
    state.selectedUnitId = pikachu.uid;
    state.postMoveAttackMode = false;
    state.reachableNodes = [21, 2];
    state.reachablePaths = {
      21: [{ type: "walk", fromNode: 20, toNode: 21 }],
      2:  [{ type: "walk", fromNode: 20, toNode: 21 }, { type: "walk", fromNode: 21, toNode: 2 }]
    };
    state.attackTargets = [];
  } else if (currentTutorialStep === 6) {
    pikachu.location = "board"; pikachu.nodeId = 2;
    state.selectedUnitId = pikachu.uid;
    state.postMoveAttackMode = false;
    state.reachableNodes = [3];
    state.reachablePaths = {
      3: [{ type: "walk", fromNode: 2, toNode: 3 }]
    };
    state.attackTargets = [];
  }
  updateTutorialCoachUI();
}

function startInteractiveTutorialMatch() {
  hideTutorialCoachHud();
  const tourHud = document.getElementById("tutorial-hub-tour-hud");
  if (tourHud) tourHud.style.display = "none";
  try { localStorage.setItem(TUTORIAL_COMPLETED_KEY, "1"); } catch (e) {}
  state.matchKind = "league";
  state.mode = "ai";
  openDrawer("hub");
  switchDrawerTab("hub");
}

function executeCurrentTutorialStepAction() {
  if (state.matchKind !== "tutorial" || tutorialStepBusy || state.isAnimating) return;
  const tu = state.tutorialUnits || {};
  const pikachu      = tu.pikachu;
  const bulbasaur    = tu.bulbasaur;
  const charizard    = tu.charizard;
  const charmanderP2 = tu.charmanderP2;
  const squirtleP2   = tu.squirtleP2;
  if (!pikachu) return;

  if (currentTutorialStep === 1) {
    tutorialStepBusy = true;
    updateTutorialCoachUI();
    pikachu.location = "board";
    pikachu.nodeId = 7;
    animatePieceAlongSegments(pikachu, [{ type: "portal", fromNode: 7, toNode: 7 }], () => {
      tutorialStepBusy = false;
      currentTutorialStep = 2;
      setupTutorialStepBoardHighlights();
      setLogText("🎓 AULA 2/6 — Salte sobre o Bulbasaur (Nó 25) até o Nó 20 (2 MP + 1 MP)!");
    });
  } else if (currentTutorialStep === 2) {
    tutorialStepBusy = true;
    updateTutorialCoachUI();
    pikachu.location = "board";
    pikachu.nodeId = 20;
    animatePieceAlongSegments(pikachu, [
      { type: "jump", fromNode: 7, toNode: 23, jumpedNode: 25 },
      { type: "walk", fromNode: 23, toNode: 20 }
    ], () => {
      state.abilityJumpActive = false;
      tutorialStepBusy = false;
      currentTutorialStep = 3;
      setupTutorialStepBoardHighlights();
      setLogText("🎓 AULA 3/6 — Ative a Plate [X Attack +30 DMG] antes de atacar o Charmander!");
    });
  } else if (currentTutorialStep === 3) {
    playSfx("portal");
    const xAtkPlate = state.plates.find(p => p.id === "xatk");
    if (xAtkPlate) xAtkPlate.used = true;
    state.activePlate = "xatk";
    spawnPortalParticles(BOARD_NODES[20].x, BOARD_NODES[20].y, "#fde047");
    renderPlatesTray();
    currentTutorialStep = 4;
    setupTutorialStepBoardHighlights();
    setLogText("⚡ [X Attack +30 DMG] ativo! Agora toque no Charmander (Nó 21) para girar a Roleta!");
  } else if (currentTutorialStep === 4) {
    tutorialStepBusy = true;
    updateTutorialCoachUI();
    state.postMoveAttackMode = false;
    state.attackTargets = [];
    const pWheel = getActiveWheel(pikachu);
    const cWheel = getActiveWheel(charmanderP2);
    const atkChosen = { ...(pWheel[0] || { name: "Thunderbolt", color: "white", dmg: 100, stars: 0, size: 32 }), color: "white", dmg: 130, stars: 0, name: "Thunderbolt (+30 X Attack)" };
    const defChosen = { ...(cWheel[0] || { name: "Scratch", color: "white", dmg: 40, stars: 0, size: 48 }), color: "white", dmg: 40, stars: 0, name: "Scratch" };
    triggerCombat(pikachu, charmanderP2, false, {
      atkSpin: { chosen: atkChosen, chosenIdx: 0, sliceFrac: 0.5 },
      defSpin: { chosen: defChosen, chosenIdx: 0, sliceFrac: 0.5 },
      nextTurn: "p1",
      nextTurnCounter: 296
    });
  } else if (currentTutorialStep === 5) {
    tutorialStepBusy = true;
    updateTutorialCoachUI();
    const wOverlay = document.getElementById("wheel-overlay");
    if (wOverlay && wOverlay.classList.contains("show")) {
      wOverlay.classList.remove("show");
      if (ddAnimId) cancelAnimationFrame(ddAnimId);
    }
    pikachu.location = "board";
    pikachu.nodeId = 2;
    animatePieceAlongSegments(pikachu, [
      { type: "walk", fromNode: 20, toNode: 21 },
      { type: "walk", fromNode: 21, toNode: 2 }
    ], () => {
      // Trigger authentic Surround KO on Squirtle at Node 1 (surrounded by Charizard at Node 0 and Pikachu at Node 2)!
      checkSurroundKOs();
      tutorialStepBusy = false;
      currentTutorialStep = 6;
      setupTutorialStepBoardHighlights();
      setLogText("💥 SURROUND KO! O Squirtle no Nó 1 foi cercado! Agora avance ao Goal Point (Nó 3)!");
    });
  } else if (currentTutorialStep === 6) {
    tutorialStepBusy = true;
    hideTutorialCoachHud();
    pikachu.location = "board";
    pikachu.nodeId = 3;
    animatePieceAlongSegments(pikachu, [
      { type: "walk", fromNode: 2, toNode: 3 }
    ], () => {
      tutorialStepBusy = false;
      setLogText("🏆 GOAL POINT CONQUISTADO! Partida de Apresentação concluída!");
      spawnPortalParticles(176, 185, "#facc15");
      state.winCelebrationAnim = { winner: "p1", t0: performance.now() };
    });
  }
}

// Hook closeBattleOverlay so closing the Data Disk roulette in Aula 4 automatically transitions to Aula 5!
const _v520CloseBattleOverlay = closeBattleOverlay;
closeBattleOverlay = function() {
  _v520CloseBattleOverlay();
  if (state.matchKind === "tutorial" && currentTutorialStep === 4) {
    tutorialStepBusy = false;
    currentTutorialStep = 5;
    setupTutorialStepBoardHighlights();
    setLogText("🎓 AULA 5/6 — Mova o Pikachu ao Nó 2 para cercar o Squirtle no Nó 1 (Surround KO)!");
  }
};

// Hook onNodeClicked and confirmUseSelectedPlate so tapping directly on the board nodes or Plates Tray executes the tutorial lesson!
const _v520OnNodeClicked = onNodeClicked;
onNodeClicked = function(nodeId) {
  if (state.matchKind === "tutorial") {
    if (currentTutorialStep === 1 && nodeId === 7)  { executeCurrentTutorialStepAction(); return; }
    if (currentTutorialStep === 2 && (nodeId === 20 || nodeId === 23)) { executeCurrentTutorialStepAction(); return; }
    if (currentTutorialStep === 4 && nodeId === 21) { executeCurrentTutorialStepAction(); return; }
    if (currentTutorialStep === 5 && (nodeId === 2 || nodeId === 21))  { executeCurrentTutorialStepAction(); return; }
    if (currentTutorialStep === 6 && nodeId === 3)  { executeCurrentTutorialStepAction(); return; }
    playSfx("tick");
    const info = TUTORIAL_MATCH_STEPS[currentTutorialStep - 1];
    if (info) setLogText(`👆 Toque no Nó ${info.targetNode} destacado em dourado ou no botão verde da ${info.badge}!`);
    return;
  }
  return _v520OnNodeClicked(nodeId);
};

const _v520ConfirmUseSelectedPlate = confirmUseSelectedPlate;
confirmUseSelectedPlate = function() {
  if (state.matchKind === "tutorial") {
    togglePlatesTray(false);
    if (currentTutorialStep === 3) {
      executeCurrentTutorialStepAction();
    }
    return;
  }
  return _v520ConfirmUseSelectedPlate();
};

function exitInteractiveTutorial() {
  tutorialStepBusy = false;
  currentTutorialStep = 0;
  hideTutorialCoachHud();
  const tourHud = document.getElementById("tutorial-hub-tour-hud");
  if (tourHud) tourHud.style.display = "none";
  state.matchKind = "league";
  state.mode = "ai";
  openDrawer("hub");
  switchDrawerTab("hub");
}

// PHASE 2: 5-STEP GUIDED HUB TOUR
const HUB_TOUR_STEPS = [
  {
    badge: "🏛️ TOUR DO HUB · ETAPA 1/5",
    tab: "hub",
    title: "1. Barra Verde de Energia (⚡110/110), Moedas e Palco 3D",
    desc: "• No topo esquerdo está a Barra Verde (⚡ 110/110): é a sua Energia de Campanha, usada para jogar as Quests dos hotéis de Carmonte Island (regenera +1⚡ a cada 2m30s; toque nela para ver detalhes!).\n• Ao lado ficam suas Moedas (🪙, usadas na Fusão e na Loja) e Gemas (🔻).\n• No centro estão as 6 miniaturas 3D Kaiyodo do seu time e seu Perfil Individual com ELO!"
  },
  {
    badge: "🏛️ TOUR DO HUB · ETAPA 2/5",
    tab: "hub",
    title: "2. Time Boosters (Cronômetro Real) & Locked Booster",
    desc: "• Na parte inferior do Hub ficam os 3 Slots de Time Booster: sempre que você vence uma partida ranqueada (League Match), você ganha uma caixa (1h Prata ou 6h Roxo) que abre quando o cronômetro chega a 00:00:00.\n• No canto direito superior fica o Locked Booster: junte 10/10 Key Fragments (🔑) em partidas de Liga para abri-lo!"
  },
  {
    badge: "🏛️ TOUR DO HUB · ETAPA 3/5",
    tab: "deck",
    title: "3. Aba [Decks] — 306 Pokémon e Limite de Custo 6/6 ◆ nas Plates",
    desc: "• Aqui em [Decks] você monta seu time com até 6 Pokémon desbloqueados e configura suas Evoluções/Mega UX.\n• Na seção ⚡ PLATE CASE logo abaixo do time, cada carta tática tem um custo em diamantes (1◆ ou 2◆). O limite máximo oficial é 6/6 ◆ — escolha a combinação tática ideal até somar 6◆!"
  },
  {
    badge: "🏛️ TOUR DO HUB · ETAPA 4/5",
    tab: "fusion",
    title: "4. Aba [Fusion] — Evolução Real com Moedas e Materiais",
    desc: "• Em [Fusion], você fortalece a roleta de 96 fatias dos seus Pokémon:\n  1) Lv.1 a Lv.5: exige 🟦 Rare Metal + 🪙 Moedas (expande 1 fatia de ataque e reduz 1 fatia de Miss vermelho).\n  2) Lv.6 a Lv.10: exige 🟣 Carmonite + 🪙 Moedas.\n  3) Chain Level (CLv 1–10): exige 🟩 Green Cube + 🪙 Moedas para somar +1 de Dano!"
  },
  {
    badge: "🏛️ TOUR DO HUB · ETAPA 5/5",
    tab: "shop",
    title: "5. Aba [Shop] e Modos de Jogo no Botão [Play]",
    desc: "• Na [Shop], você pode abrir Boosters com Gemas, usar a Loja de Moedas (Coin Shop) ou trocar Material por qualquer um dos 306 Pokémon.\n• Ao tocar em [Play] no Hub, escolha entre: 🏆 League Match (Ranqueado), 🌐 Room Match P2P (2 celulares em mesa oposta), 🗺️ Quests (usa ⚡15 da barra verde) ou 🏋️ Training Center (treino livre sem pontos ou recompensas)!"
  }
];

function renderGuidedHubTourStep() {
  ensureV510ModalsInjected();
  const hud = document.getElementById("tutorial-hub-tour-hud");
  if (!hud) return;
  const info = HUB_TOUR_STEPS[currentHubTourStep];
  if (!info) {
    finishGuidedHubTour();
    return;
  }
  openDrawer(info.tab);
  switchDrawerTab(info.tab);
  hud.style.display = "block";

  const bEl = document.getElementById("hub-tour-badge");
  const tEl = document.getElementById("hub-tour-title");
  const dEl = document.getElementById("hub-tour-desc");
  const prevBtn = document.getElementById("hub-tour-prev-btn");
  const nextBtn = document.getElementById("hub-tour-next-btn");

  if (bEl) bEl.textContent = info.badge;
  if (tEl) tEl.textContent = info.title;
  if (dEl) dEl.innerHTML = info.desc.replace(/\n/g, "<br>");
  if (prevBtn) prevBtn.style.display = currentHubTourStep > 0 ? "inline-block" : "none";
  if (nextBtn) {
    if (currentHubTourStep < HUB_TOUR_STEPS.length - 1) {
      nextBtn.textContent = `Próxima Etapa (${currentHubTourStep + 2}/${HUB_TOUR_STEPS.length}) ➔`;
    } else {
      nextBtn.textContent = "✅ Concluir Tutorial e Jogar!";
    }
  }
}

function startGuidedHubTour() {
  hideTutorialCoachHud();
  const tourHud = document.getElementById("tutorial-hub-tour-hud");
  if (tourHud) tourHud.style.display = "none";
  try { localStorage.setItem(TUTORIAL_COMPLETED_KEY, "1"); } catch (e) {}
  openDrawer("hub");
  switchDrawerTab("hub");
}

function stepGuidedHubTour(delta) {
  finishGuidedHubTour();
}

function finishGuidedHubTour() {
  const hud = document.getElementById("tutorial-hub-tour-hud");
  if (hud) hud.style.display = "none";
  try { localStorage.setItem(TUTORIAL_COMPLETED_KEY, "1"); } catch (e) {}
  state.matchKind = "league";
  state.mode = "ai";
  openDrawer("hub");
  switchDrawerTab("hub");
}

// Tutorial removed: completeWelcomeProfileSetup opens the Hub directly!
const _v500CompleteWelcomeProfileSetup = completeWelcomeProfileSetup;
completeWelcomeProfileSetup = function() {
  _v500CompleteWelcomeProfileSetup();
  try { localStorage.setItem(TUTORIAL_COMPLETED_KEY, "1"); } catch (e) {}
  openDrawer("hub");
  switchDrawerTab("hub");
};

// Tutorial disabled: do not inject replay card in config menu
(function injectTutorialButtonInConfigMenu() {
  // no-op
})();

refreshStrictPlateCaseUI();
renderPlatesTray();






// ============================================================================

