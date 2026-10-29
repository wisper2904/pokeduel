// ============================================================================
// POKÉMON DUEL DATA DISK COMBAT, ROULETTE & Z-MOVE 7.0 ENGINE
// ============================================================================
// ============================================================================
// 9. AUTHENTIC POKÉMON DUEL FULL-SCREEN 3x HD DATA DISK COMBAT OVERLAY
// ============================================================================
const bananaWheelImg = new Image();
bananaWheelImg.src = typeof BANANA_WHEEL_B64 !== "undefined" ? BANANA_WHEEL_B64 : "assets/ui/banana_wheel.jpg";
function getActiveWheel(unit) {
  const fig = FIGURES_DB[unit.baseIdx] || FIGURES_DB[0];
  ensureFigureUpgradeMetadata(fig);
  const meadowBonus = (state.meadowPowerActive && unit.type && unit.type.includes('Grass')) ? 20 : 0;
  const xAtkBonus = (state.xAttackArmed && state.turn === unit.owner) ? 30 : 0;
  const gymCupBonus = (state.matchKind === "gym_cup" && unit.type && unit.type.includes("Fire")) ? 20 : 0;
  const evoDmgBonus = (unit.evoStage || 0) * 10 + ((unit.megaTurns && unit.megaTurns > 0) ? 20 : 0);
  const evoStarBonus = (unit.evoStage || 0);
  const isWeeklyBuffed = (typeof hasWeeklyTypeBuff === "function") && hasWeeklyTypeBuff(unit);
  const weeklyDmgBonus = isWeeklyBuffed ? 10 : 0;
  const weeklyStarBonus = isWeeklyBuffed ? 1 : 0;
  const lucarioBonus = (unit.baseId === "lucario" || unit.name === "Lucario") ? (unit.lucarioBonus || 0) : 0;
  const segs = fig.wheel.map((seg, sIdx) => {
    const sliceClv = (fig.clvAlloc && typeof fig.clvAlloc[sIdx] === "number") ? fig.clvAlloc[sIdx] : (sIdx === 0 ? Math.min(10, unit.clv || 0) : 0);
    let color = seg.color;
    let name = seg.name;
    if (state.xSpeedArmed && state.turn === unit.owner && color === "white") {
      color = "gold";
      name = name + " ⚡";
    }
    return {
      ...seg,
      name,
      color,
      dmg: seg.dmg > 0 ? seg.dmg + sliceClv + meadowBonus + evoDmgBonus + xAtkBonus + gymCupBonus + weeklyDmgBonus + lucarioBonus : 0,
      stars: color === "purple" ? (seg.stars || 1) + evoStarBonus + weeklyStarBonus : 0
    };
  });

  // Section 2.5: Z-Move 7.0 Whole-Wheel Transformation (100% Whole Wheel becomes Z-Move!)
  const isZMoveForThisUnit = Boolean(
    state.zMoveArmed && (
      (unit.owner === "p1" && state.turn === "p1" && !state.zMoveUsedP1) ||
      (unit.owner === "p2" && !state.zMoveUsedP2 && (state.zGaugeP2 || 0) >= 100)
    )
  );

  if (isZMoveForThisUnit) {
    const zm = typeof getFigureZMove === "function" ? getFigureZMove(unit) : null;
    if (zm) {
      return [{
        name: "⚡ " + zm.name,
        color: zm.color,
        dmg: zm.dmg || 0,
        stars: zm.stars || (zm.color === "purple" ? 4 : 0),
        effect: zm.effect,
        size: 96,
        isZMove: true
      }];
    }
  }

  // Section 3: Exact Status Condition Math
  if (unit.condition === PokemonCondition.Poison) {
    segs.forEach(s => { if (s.dmg > 0) s.dmg = Math.max(0, s.dmg - 20); });
  } else if (unit.condition === PokemonCondition.BadPoison) {
    segs.forEach(s => { if (s.dmg > 0) s.dmg = Math.max(0, s.dmg - 40); });
  } else if (unit.condition === PokemonCondition.Burn) {
    // Burn: -10 de dano em todos os ataques + menor segmento vira Miss!
    segs.forEach(s => { if (s.dmg > 0) s.dmg = Math.max(0, s.dmg - 10); });
  }
  if (unit.condition === PokemonCondition.Paralyze || unit.condition === PokemonCondition.Burn) {
    let minIdx = -1, minSize = 999;
    segs.forEach((s, idx) => {
      if (s.color !== "red" && s.size < minSize) { minSize = s.size; minIdx = idx; }
    });
    if (minIdx !== -1) {
      segs[minIdx] = { name: "Miss", color: "red", dmg: 0, stars: 0, size: segs[minIdx].size };
    }
  }
  if (unit.condition === PokemonCondition.Sleep) {
    // Sleep: Qualquer giro de combate enquanto dorme vira Miss!
    segs.forEach(s => { s.name = "Miss (Sleep)"; s.color = "red"; s.dmg = 0; s.stars = 0; });
  }
  if (unit.condition === PokemonCondition.Freeze) {
    // Frozen: Todos os giros viram Miss!
    segs.forEach(s => { s.name = "Miss (Freeze)"; s.color = "red"; s.dmg = 0; s.stars = 0; });
  }
  return segs;
}

function spinWheelForUnit(unit, applyPlate) {
  const segs = getActiveWheel(unit);
  let plateFlatBonus = 0;
  if (applyPlate && unit.owner === state.turn) {
    if (state.activePlate === "xspeed") segs.forEach(s => { if (s.color === "white") s.color = "gold"; });
    if (state.activePlate === "xatk") {
      plateFlatBonus = 30;
      segs.forEach(s => {
        const isM = Boolean(s.multiHit || /\d+x\b/i.test(s.name));
        if (s.dmg > 0 && !isM) s.dmg += 30;
      });
    }
  }
  const total = segs.reduce((acc, s) => acc + s.size, 0) || 96;
  const pickOneRoll = () => {
    const rawR = nextDeterministicRandom() * total;
    let rem = rawR;
    let idx = 0;
    for (let i = 0; i < segs.length; i++) {
      if (rem < segs[i].size || i === segs.length - 1) {
        idx = i;
        break;
      }
      rem -= segs[i].size;
    }
    let sliceFrac = segs[idx].size > 0 ? (rem / segs[idx].size) : 0.5;
    sliceFrac = 0.18 + Math.max(0, Math.min(1, sliceFrac)) * 0.64;

    if (unit.condition === PokemonCondition.Panic && segs.length > 1) {
      idx = (idx + 1) % segs.length;
    }
    const extraTurns = 5 + Math.floor(nextDeterministicRandom() * 4);
    return { idx, sliceFrac, extraTurns };
  };

  // Helper to pick a non-multiplier slice when a multiplier chain terminates
  const pickNonMultiplierRoll = (multiName) => {
    const nonMultiIndices = [];
    let nonMultiTotal = 0;
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].name !== multiName && !segs[i].multiHit) {
        nonMultiIndices.push(i);
        nonMultiTotal += segs[i].size;
      }
    }
    if (nonMultiIndices.length === 0) {
      return { idx: 0, sliceFrac: 0.5, extraTurns: 4 };
    }
    let rem = nextDeterministicRandom() * nonMultiTotal;
    let chosenNonIdx = nonMultiIndices[0];
    for (const i of nonMultiIndices) {
      if (rem < segs[i].size) {
        chosenNonIdx = i;
        break;
      }
      rem -= segs[i].size;
    }
    const sliceFrac = 0.22 + nextDeterministicRandom() * 0.56;
    const extraTurns = 4 + Math.floor(nextDeterministicRandom() * 3);
    return { idx: chosenNonIdx, sliceFrac, extraTurns };
  };

  const firstRoll = pickOneRoll();
  const chosenIdx = firstRoll.idx;
  const baseChosen = segs[chosenIdx];
  const isPanic = (unit.condition === PokemonCondition.Panic);
  const isMulti = Boolean(baseChosen && (baseChosen.multiHit || /\d+x\b/i.test(baseChosen.name)) && baseChosen.dmg > 0);

  // Rule 3: Multi-Hit Multiplier Attack Loop (e.g. Fire Spin 50x, Vine Whip 40x, Rapid Spin 30x, Water Shuriken 20x)
  // As long as the wheel lands on the multiplier slice, it spins again and adds `baseChosen.dmg` to the running total,
  // stopping only when a re-spin lands outside the multiplier slice!
  if (isMulti) {
    const unitBaseDmg = baseChosen.dmg;
    let hits = 1;
    let runningDmg = unitBaseDmg + plateFlatBonus;
    const spinSteps = [{
      idx: chosenIdx,
      sliceFrac: firstRoll.sliceFrac,
      extraTurns: firstRoll.extraTurns,
      isMultiHit: true,
      stoppedChain: false,
      hits: 1,
      unitDmg: unitBaseDmg,
      accumDmg: runningDmg,
      landedName: baseChosen.name
    }];

    const naturalProb = Math.max(0.38, (baseChosen.size || 36) / total);
    while (hits < 8) {
      // Deterministic roll for whether this re-spin lands on the multiplier slice again
      const chainChance = hits === 1 ? Math.max(0.58, naturalProb) : (hits === 2 ? Math.max(0.48, naturalProb) : naturalProb);
      const rollContinues = (nextDeterministicRandom() < chainChance);
      if (rollContinues) {
        hits++;
        runningDmg = (unitBaseDmg * hits) + plateFlatBonus;
        const nextSliceFrac = 0.18 + nextDeterministicRandom() * 0.64;
        const nextExtraTurns = 4 + Math.floor(nextDeterministicRandom() * 3);
        spinSteps.push({
          idx: chosenIdx,
          sliceFrac: nextSliceFrac,
          extraTurns: nextExtraTurns,
          isMultiHit: true,
          stoppedChain: false,
          hits: hits,
          unitDmg: unitBaseDmg,
          accumDmg: runningDmg,
          landedName: baseChosen.name
        });
      } else {
        // Re-spin landed OUTSIDE the multiplier ("parou de cair no multiplicador")!
        // Record this final re-spin step so the player visually sees the wheel spin and land outside the multiplier!
        const stopRoll = pickNonMultiplierRoll(baseChosen.name);
        const stopSeg = segs[stopRoll.idx] || baseChosen;
        spinSteps.push({
          idx: stopRoll.idx,
          sliceFrac: stopRoll.sliceFrac,
          extraTurns: stopRoll.extraTurns,
          isMultiHit: false,
          stoppedChain: true,
          hits: hits,
          unitDmg: unitBaseDmg,
          accumDmg: runningDmg,
          landedName: stopSeg.name
        });
        break;
      }
    }

    const cleanBaseName = baseChosen.name.replace(/\s*\(\d+x.*\)$/i, "");
    const accumChosen = {
      ...baseChosen,
      baseDmg: unitBaseDmg,
      dmg: runningDmg,
      name: `${cleanBaseName} (${hits}x = ${runningDmg})`
    };
    return {
      segs,
      chosen: accumChosen,
      chosenIdx,
      sliceFrac: firstRoll.sliceFrac,
      extraTurns: firstRoll.extraTurns,
      isPanic,
      isMulti: true,
      baseMultiName: cleanBaseName,
      unitBaseDmg,
      multiHits: hits,
      spinSteps
    };
  }

  return {
    segs,
    chosen: { ...baseChosen },
    chosenIdx,
    sliceFrac: firstRoll.sliceFrac,
    extraTurns: firstRoll.extraTurns,
    isPanic,
    isMulti: false,
    baseMultiName: baseChosen ? baseChosen.name : "",
    unitBaseDmg: baseChosen ? baseChosen.dmg : 0,
    multiHits: 1,
    spinSteps: [{
      idx: chosenIdx,
      sliceFrac: firstRoll.sliceFrac,
      extraTurns: firstRoll.extraTurns,
      isMultiHit: false,
      stoppedChain: false,
      hits: 1,
      unitDmg: baseChosen ? baseChosen.dmg : 0,
      accumDmg: baseChosen ? baseChosen.dmg : 0,
      landedName: baseChosen ? baseChosen.name : ""
    }]
  };
}

function getTargetAngleForSegment(segs, chosenIdx, pinAngleRad = -Math.PI / 2, sliceFrac = 0.5) {
  const total = segs.reduce((a, s) => a + s.size, 0) || 96;
  let cum = 0;
  for (let i = 0; i < chosenIdx; i++) cum += segs[i].size;
  const f = (typeof sliceFrac === "number") ? sliceFrac : 0.5;
  const chosenUnits = cum + (segs[chosenIdx] ? segs[chosenIdx].size * f : 0);
  // In drawAuthenticDataDisk, unit `u` is drawn at angle: `-Math.PI/2 + rotAngle + (u/total)*2*PI`.
  // Setting that equal to `pinAngleRad` gives:
  // rotAngle = pinAngleRad + Math.PI/2 - (chosenUnits / total) * 2 * Math.PI
  return (pinAngleRad + Math.PI / 2) - ((chosenUnits / total) * Math.PI * 2);
}

function evaluateCombat(atkUnit, defUnit, atkSpin, defSpin) {
  const a = atkSpin.chosen, d = defSpin.chosen;
  const aName = (typeof localizeMove === "function") ? localizeMove(a.name) : a.name;
  const dName = (typeof localizeMove === "function") ? localizeMove(d.name) : d.name;

  if (a.color === "blue" || d.color === "blue") {
    return { winner:"none", reason: typeof t === "function" ? t("combat.blue_defense", "Blue Defense! Both hold ground.") : "Blue Defense! Both hold ground." };
  }
  if (a.color === "red" && d.color === "red") {
    return { winner:"none", reason: typeof t === "function" ? t("combat.miss_both", "Both spun Miss!") : "Both spun Miss!" };
  }
  if (a.color === "red") {
    return { winner:"def", effect:d.color==="purple"?d.effect:"ko", reason: typeof t === "function" ? t("combat.miss_win", { loser: atkUnit.name, winner: defUnit.name }) : `${atkUnit.name} spun Miss! ${defUnit.name} wins!` };
  }
  if (d.color === "red") {
    return { winner:"atk", effect:a.color==="purple"?a.effect:"ko", reason: typeof t === "function" ? t("combat.miss_win", { loser: defUnit.name, winner: atkUnit.name }) : `${defUnit.name} spun Miss! ${atkUnit.name} wins!` };
  }
  if (a.color === "gold" && d.color === "purple") {
    return { winner:"atk", effect:"ko", reason: typeof t === "function" ? t("combat.gold_beats_purple", { gold: aName, purple: dName }) : `Gold (${aName}) beats Purple (${dName})!` };
  }
  if (d.color === "gold" && a.color === "purple") {
    return { winner:"def", effect:"ko", reason: typeof t === "function" ? t("combat.gold_beats_purple", { gold: dName, purple: aName }) : `Gold (${dName}) beats Purple (${aName})!` };
  }
  // Z-Move brute force overpowers weak 1-2★ purple moves!
  if ((a.isZMove || a.name.startsWith("⚡ ")) && d.color === "purple" && (d.stars || 1) <= 2) {
    return { winner:"atk", effect:a.effect||"ko", reason: `⚡ Z-POWER: ${aName} sobrepujou o movimento roxo (${dName} ★${d.stars || 1}) pela força bruta!` };
  }
  if ((d.isZMove || d.name.startsWith("⚡ ")) && a.color === "purple" && (a.stars || 1) <= 2) {
    return { winner:"def", effect:d.effect||"ko", reason: `⚡ Z-POWER: ${dName} sobrepujou o movimento roxo (${aName} ★${a.stars || 1}) pela força bruta!` };
  }
  if (a.color === "purple" && d.color === "white") {
    return { winner:"atk", effect:a.effect||"ko", reason: typeof t === "function" ? t("combat.purple_beats_white", { purple: aName, stars: a.stars || 1 }) : `Purple (${aName} ★${a.stars}) beats White!` };
  }
  if (d.color === "purple" && a.color === "white") {
    return { winner:"def", effect:d.effect||"ko", reason: typeof t === "function" ? t("combat.purple_beats_white", { purple: dName, stars: d.stars || 1 }) : `Purple (${dName} ★${d.stars}) beats White!` };
  }
  if (a.color === "purple" && d.color === "purple") {
    if (a.stars > d.stars) return { winner:"atk", effect:a.effect||"ko", reason: typeof t === "function" ? t("combat.star_beats_star", { highStars: a.stars, lowStars: d.stars }) : `★${a.stars} beats ★${d.stars}!` };
    if (d.stars > a.stars) return { winner:"def", effect:d.effect||"ko", reason: typeof t === "function" ? t("combat.star_beats_star", { highStars: d.stars, lowStars: a.stars }) : `★${d.stars} beats ★${a.stars}!` };
    return { winner:"none", reason: typeof t === "function" ? t("combat.star_tie", { stars: a.stars }) : `Purple Star Tie (★${a.stars})!` };
  }

  // === HYPER SONIC IMMUNITY RULE (Mew / Official Pokémon Duel Rule) ===
  const isHyperSonicMove = (s) => s && typeof s.name === "string" && s.name.toLowerCase().replace(/[\s\-_]/g, "") === "hypersonic";
  if (isHyperSonicMove(a) && (d.color === "white" || d.color === "gold") && (d.dmg || 0) >= 100) {
    return { winner: "none", reason: typeof t === "function" ? t("combat.hyper_sonic", { name: atkUnit.name }) : `🛡️ Hyper Sonic (${atkUnit.name}): Imune a nocaute contra 100+ DANO!` };
  }
  if (isHyperSonicMove(d) && (a.color === "white" || a.color === "gold") && (a.dmg || 0) >= 100) {
    return { winner: "none", reason: typeof t === "function" ? t("combat.hyper_sonic", { name: defUnit.name }) : `🛡️ Hyper Sonic (${defUnit.name}): Imune a nocaute contra 100+ DANO!` };
  }

  if (a.dmg > d.dmg) {
    return { winner:"atk", effect:"ko", reason: typeof t === "function" ? t("combat.dmg_beats_dmg", { winner: aName, winDmg: a.dmg, loser: dName, loseDmg: d.dmg }) : `${aName} (${a.dmg}) defeats ${dName} (${d.dmg})!` };
  }
  if (d.dmg > a.dmg) {
    return { winner:"def", effect:"ko", reason: typeof t === "function" ? t("combat.dmg_beats_dmg", { winner: dName, winDmg: d.dmg, loser: aName, loseDmg: a.dmg }) : `${dName} (${d.dmg}) defeats ${aName} (${a.dmg})!` };
  }
  return { winner:"none", reason: typeof t === "function" ? t("combat.dmg_tie", { dmg: a.dmg }) : `Damage Tie (${a.dmg} vs ${d.dmg})!` };
}

function drawAuthenticDataDisk(dctx, cx, cy, radius, segs, rotAngle, highlightIdx, needleWobble, borderCol, showTopPin = true, customPinAngle = null) {
  const total = segs.reduce((a, s) => a + s.size, 0) || 96;
  let angle = -Math.PI / 2 + rotAngle;

  dctx.save();
  dctx.beginPath(); dctx.arc(cx, cy, radius + 9, 0, Math.PI * 2);
  const rimGrad = dctx.createRadialGradient(cx, cy, radius - 4, cx, cy, radius + 10);
  rimGrad.addColorStop(0, "#1e293b");
  rimGrad.addColorStop(0.6, "#64748b");
  rimGrad.addColorStop(0.85, borderCol);
  rimGrad.addColorStop(1, "#090d16");
  dctx.fillStyle = rimGrad; dctx.fill();

  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2 + rotAngle * 0.25;
    dctx.strokeStyle = i % 3 === 0 ? "#f8fafc" : "rgba(148,163,184,0.45)";
    dctx.lineWidth = i % 3 === 0 ? 1.6 : 1;
    dctx.beginPath();
    dctx.moveTo(cx + Math.cos(a) * (radius + 2), cy + Math.sin(a) * (radius + 2));
    dctx.lineTo(cx + Math.cos(a) * (radius + 7), cy + Math.sin(a) * (radius + 7));
    dctx.stroke();
  }

  const sliceColors = {
    white:  ["#ffffff", "#cbd5e1"],
    gold:   ["#fef08a", "#ca8a04"],
    purple: ["#d8b4fe", "#7e22ce"],
    blue:   ["#7dd3fc", "#0284c7"],
    red:    ["#fca5a5", "#dc2626"]
  };

  // Section 2.6: Whole-Wheel Z-Move Transformation Rendering (100% Solid Wheel with Sunburst Rays & Crest)
  const isWholeWheelZMove = segs.length === 1 && (segs[0].isZMove || (typeof segs[0].name === "string" && segs[0].name.startsWith("⚡ ")));
  if (isWholeWheelZMove) {
    const s = segs[0];
    const cols = sliceColors[s.color] || sliceColors.purple;

    // 1. Draw 360-degree Solid Attack Base (Purple / Gold / White / etc.)
    dctx.beginPath();
    dctx.arc(cx, cy, radius, 0, Math.PI * 2);
    const sGrad = dctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius);
    sGrad.addColorStop(0, cols[0]);
    sGrad.addColorStop(1, cols[1]);
    dctx.fillStyle = sGrad;
    dctx.fill();
    dctx.strokeStyle = "#090d16";
    dctx.lineWidth = 2.0;
    dctx.stroke();

    // 2. Rotating Sunburst Cosmic Rays (Spin with rotAngle)
    dctx.save();
    dctx.translate(cx, cy);
    dctx.rotate(rotAngle);
    const numRays = 16;
    for (let r = 0; r < numRays; r++) {
      const rayA = (r / numRays) * Math.PI * 2;
      dctx.beginPath();
      dctx.moveTo(0, 0);
      dctx.arc(0, 0, radius - 1, rayA - 0.09, rayA + 0.09);
      dctx.closePath();
      dctx.fillStyle = (r % 2 === 0) ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.14)";
      dctx.fill();
    }
    // Subtle inner energy ring
    dctx.beginPath();
    dctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
    dctx.strokeStyle = (s.color === "purple") ? "rgba(232, 121, 249, 0.7)" : "rgba(254, 240, 138, 0.7)";
    dctx.lineWidth = 2.2;
    dctx.stroke();
    dctx.restore();

    // 3. Move Name & Stars / Damage positioned at midA (which lines up with pointer when stopped!)
    const midA = -Math.PI / 2 + rotAngle + Math.PI;
    const tx = cx + Math.cos(midA) * (radius * 0.58);
    const ty = cy + Math.sin(midA) * (radius * 0.58);

    dctx.save();
    dctx.translate(tx, ty);
    // Align text angle with pointer for crisp legibility
    dctx.rotate(midA + Math.PI / 2);

    const darkText = (s.color === "white" || s.color === "gold");
    dctx.textAlign = "center";
    dctx.textBaseline = "middle";

    const locName = (typeof localizeMove === "function") ? localizeMove(s.name) : s.name;
    const cleanName = locName.replace(/^⚡\s*/, "");

    // Main Value: Stars if purple, DMG if white/gold
    if (s.color === "purple") {
      dctx.fillStyle = "#ffffff";
      dctx.shadowColor = "#f0abfc";
      dctx.shadowBlur = 10;
      const starCount = s.stars || 4;
      dctx.font = `900 ${radius > 75 ? 20 : 13}px sans-serif`;
      dctx.fillText("★".repeat(starCount), 0, radius > 75 ? -8 : -5);
    } else {
      dctx.fillStyle = darkText ? "#090d16" : "#ffffff";
      dctx.shadowColor = darkText ? "#fef08a" : "#facc15";
      dctx.shadowBlur = 10;
      dctx.font = `900 ${radius > 75 ? 22 : 14}px sans-serif`;
      dctx.fillText(String(s.dmg || 200), 0, radius > 75 ? -8 : -5);
    }

    // Move Title
    dctx.shadowBlur = 4;
    dctx.shadowColor = darkText ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.85)";
    dctx.fillStyle = darkText ? "#090d16" : "#ffffff";
    dctx.font = `900 ${radius > 75 ? 10 : 7.5}px sans-serif`;
    dctx.fillText("⚡ " + cleanName.toUpperCase().slice(0, 18), 0, radius > 75 ? 8 : 5);

    dctx.restore();

    // 4. Glow outer border when stopped / highlighted
    if (highlightIdx >= 0) {
      dctx.save();
      dctx.beginPath();
      dctx.arc(cx, cy, radius + 1, 0, Math.PI * 2);
      dctx.strokeStyle = (s.color === "purple") ? "#c084fc" : "#facc15";
      dctx.lineWidth = 4.5;
      dctx.shadowColor = (s.color === "purple") ? "#c084fc" : "#facc15";
      dctx.shadowBlur = 18;
      dctx.stroke();
      dctx.restore();
    }

    // 5. Center Hub Cap with ⚡ Crest
    dctx.beginPath(); dctx.arc(cx, cy, radius * 0.22, 0, Math.PI * 2);
    dctx.fillStyle = "#0f172a"; dctx.fill();
    dctx.strokeStyle = (s.color === "purple") ? "#c084fc" : (borderCol || "#38bdf8"); dctx.lineWidth = 2.8; dctx.stroke();
    dctx.beginPath(); dctx.arc(cx, cy, radius * 0.12, 0, Math.PI * 2);
    dctx.fillStyle = (s.color === "purple") ? "#9333ea" : "#ca8a04"; dctx.fill();
    dctx.fillStyle = "#ffffff";
    dctx.font = `900 ${radius > 75 ? 12 : 8.5}px sans-serif`;
    dctx.textAlign = "center";
    dctx.textBaseline = "middle";
    dctx.fillText("⚡", cx, cy);

    // 6. SINGLE UNAMBIGUOUS PIN (if showTopPin or customPinAngle)
    if (showTopPin || customPinAngle !== null) {
      const pAng = (customPinAngle !== null) ? customPinAngle : -Math.PI / 2;
      const px = cx + Math.cos(pAng) * (radius + 5);
      const py = cy + Math.sin(pAng) * (radius + 5);
      dctx.save();
      dctx.translate(px, py);
      dctx.rotate(pAng + Math.PI / 2 + (needleWobble || 0));
      dctx.beginPath();
      dctx.moveTo(0, 14);
      dctx.lineTo(-8, -6);
      dctx.lineTo(8, -6);
      dctx.closePath();
      dctx.fillStyle = "#facc15"; dctx.fill();
      dctx.strokeStyle = "#090d16"; dctx.lineWidth = 2; dctx.stroke();
      dctx.restore();
    }

    dctx.restore();
    return;
  }

  // First draw all slices
  segs.forEach((s, idx) => {
    const slice = (s.size / total) * Math.PI * 2;
    const cols = sliceColors[s.color] || sliceColors.white;
    const sGrad = dctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius);
    sGrad.addColorStop(0, cols[0]);
    sGrad.addColorStop(1, cols[1]);

    dctx.beginPath();
    dctx.moveTo(cx, cy);
    dctx.arc(cx, cy, radius, angle, angle + slice);
    dctx.closePath();
    dctx.fillStyle = sGrad;
    dctx.fill();
    dctx.strokeStyle = "#090d16";
    dctx.lineWidth = 1.6;
    dctx.stroke();

    if (s.size >= 6) {
      const midA = angle + slice / 2;
      const tx = cx + Math.cos(midA) * (radius * 0.64);
      const ty = cy + Math.sin(midA) * (radius * 0.64);
      dctx.save();
      dctx.translate(tx, ty);
      const darkText = (s.color === "white" || s.color === "gold");
      dctx.fillStyle = darkText ? "#090d16" : "#ffffff";
      dctx.font = `900 ${radius > 75 ? 13.5 : 9}px sans-serif`;
      dctx.textAlign = "center";
      dctx.textBaseline = "middle";
      const isMultiSlice = Boolean(s.multiHit || /\d+x\b/i.test(s.name));
      const locName = (typeof localizeMove === "function") ? localizeMove(s.name) : s.name;
      const mainLbl = s.color === "purple" ? "★".repeat(s.stars || 1) : (s.dmg > 0 ? (String(s.dmg) + (isMultiSlice ? "x" : "")) : locName.slice(0, 5));
      dctx.fillText(mainLbl, 0, radius > 75 ? -4 : 0);

      if (radius > 75 && s.size >= 12) {
        dctx.font = "bold 7.8px sans-serif";
        dctx.fillText(locName.slice(0, 14), 0, 7);
      }
      dctx.restore();
    }
    angle += slice;
  });

  // Draw glowing highlight border ON TOP of the winning slice when stopped (`highlightIdx >= 0`)!
  if (highlightIdx >= 0 && highlightIdx < segs.length) {
    let hAng = -Math.PI / 2 + rotAngle;
    for (let i = 0; i < highlightIdx; i++) {
      hAng += (segs[i].size / total) * Math.PI * 2;
    }
    const hSpan = (segs[highlightIdx].size / total) * Math.PI * 2;
    dctx.save();
    dctx.beginPath();
    dctx.moveTo(cx, cy);
    dctx.arc(cx, cy, radius + 1, hAng, hAng + hSpan);
    dctx.closePath();
    dctx.strokeStyle = "#00f5ff";
    dctx.lineWidth = 4.2;
    dctx.shadowColor = "#00f5ff";
    dctx.shadowBlur = 12;
    dctx.stroke();
    dctx.restore();
  }

  // Center Hub Cap
  dctx.beginPath(); dctx.arc(cx, cy, radius * 0.22, 0, Math.PI * 2);
  dctx.fillStyle = "#0f172a"; dctx.fill();
  dctx.strokeStyle = borderCol || "#38bdf8"; dctx.lineWidth = 2.5; dctx.stroke();
  dctx.beginPath(); dctx.arc(cx, cy, radius * 0.09, 0, Math.PI * 2);
  dctx.fillStyle = "#f8fafc"; dctx.fill();

  // SINGLE UNAMBIGUOUS PIN:
  // Only draw the top 12-o'clock pin in single-wheel views (`showTopPin === true`, e.g. Fusion/Details),
  // OR if `customPinAngle` is passed, draw the single rim pointer at `customPinAngle`!
  if (showTopPin || customPinAngle !== null) {
    const pAng = (customPinAngle !== null) ? customPinAngle : -Math.PI / 2;
    const px = cx + Math.cos(pAng) * (radius + 5);
    const py = cy + Math.sin(pAng) * (radius + 5);
    dctx.save();
    dctx.translate(px, py);
    dctx.rotate(pAng + Math.PI / 2 + (needleWobble || 0));
    dctx.beginPath();
    dctx.moveTo(0, 14);
    dctx.lineTo(-8, -6);
    dctx.lineTo(8, -6);
    dctx.closePath();
    dctx.fillStyle = "#facc15"; dctx.fill();
    dctx.strokeStyle = "#090d16"; dctx.lineWidth = 2; dctx.stroke();
    dctx.restore();
  }

  dctx.restore();
}

let ddAnimId = null;
let pendingCombatTurnInfo = null;
const ddCanvas = document.getElementById("datadisk-canvas");
const ddCtx = ddCanvas.getContext("2d");

let activeBattleRespinFn = null;
let activeBattleAcceptFn = null;
let pendingP2PDoubleChanceMsg = null;
let currentCombatDoubleChanceHandler = null;

window.handleP2PDoubleChanceChoice = function(msg) {
  if (typeof currentCombatDoubleChanceHandler === "function") {
    currentCombatDoubleChanceHandler(msg);
  } else {
    pendingP2PDoubleChanceMsg = msg;
  }
};
ddCanvas.addEventListener("pointerdown", (e) => {
  const rect = ddCanvas.getBoundingClientRect();
  const sx = (e.clientX - rect.left) * (LOGICAL_W / rect.width);
  const sy = (e.clientY - rect.top) * (LOGICAL_H / rect.height);
  if (state.doubleChanceWaitingChoice && activeBattleRespinFn) {
    if (sx >= 180 && sy >= 460 && sy <= 530) {
      activeBattleRespinFn();
      return;
    }
    if (sx < 180 && sy >= 460 && sy <= 530 && activeBattleAcceptFn) {
      activeBattleAcceptFn();
      return;
    }
    return;
  }
  if (ddCanClose) closeBattleOverlay();
});
let ddCanClose = false;

// ============================================================================
// POKÉMON DUEL 7.0 AUTHENTIC Z-MOVE DATABASE & REGISTRATION
// ============================================================================
const Z_MOVES_DB = {
  Grass: { name: "Bloom Doom", color: "white", dmg: 180, stars: 0, effect: "spore" },
  Fire: { name: "Inferno Overdrive", color: "white", dmg: 190, stars: 0, effect: "burn" },
  Water: { name: "Hydro Vortex", color: "white", dmg: 180, stars: 0, effect: "bench" },
  Electric: { name: "Gigavolt Havoc", color: "gold", dmg: 170, stars: 0, effect: "paralyze" },
  Psychic: { name: "Shattered Psyche", color: "purple", dmg: 0, stars: 4, effect: "bench" },
  Ghost: { name: "Never-Ending Nightmare", color: "purple", dmg: 0, stars: 4, effect: "curse" },
  Dragon: { name: "Devastating Drake", color: "white", dmg: 210, stars: 0, effect: "ko" },
  Fighting: { name: "All-Out Pummeling", color: "gold", dmg: 180, stars: 0, effect: "ko" },
  Steel: { name: "Corkscrew Crash", color: "white", dmg: 190, stars: 0, effect: "ko" },
  Rock: { name: "Continental Crush", color: "white", dmg: 180, stars: 0, effect: "push" },
  Ground: { name: "Tectonic Rage", color: "white", dmg: 190, stars: 0, effect: "ko" },
  Flying: { name: "Supersonic Skystrike", color: "gold", dmg: 180, stars: 0, effect: "ko" },
  Ice: { name: "Subzero Slammer", color: "white", dmg: 180, stars: 0, effect: "freeze" },
  Poison: { name: "Acid Downpour", color: "purple", dmg: 0, stars: 4, effect: "toxic" },
  Bug: { name: "Savage Spin-Out", color: "purple", dmg: 0, stars: 4, effect: "push" },
  Dark: { name: "Black Hole Eclipse", color: "white", dmg: 190, stars: 0, effect: "ko" },
  Fairy: { name: "Twinkle Tackle", color: "white", dmg: 180, stars: 0, effect: "heal" },
  Normal: { name: "Breakneck Blitz", color: "white", dmg: 170, stars: 0, effect: "ko" }
};

const SIGNATURE_Z_MOVES = {
  "pikachu": { name: "Catastropika", color: "gold", dmg: 220, stars: 0, effect: "paralyze" },
  "snorlax": { name: "Pulverizing Pancake", color: "white", dmg: 220, stars: 0, effect: "ko" },
  "mew": { name: "Genesis Supernova", color: "purple", dmg: 0, stars: 4, effect: "banish" },
  "mewtwo": { name: "Psystrike Overdrive", color: "purple", dmg: 0, stars: 4, effect: "ko" },
  "decidueye": { name: "Sinister Arrow Raid", color: "gold", dmg: 190, stars: 0, effect: "ko" },
  "incineroar": { name: "Malicious Moonsault", color: "white", dmg: 200, stars: 0, effect: "burn" },
  "primarina": { name: "Oceanic Operetta", color: "purple", dmg: 0, stars: 4, effect: "bench" },
  "charizard": { name: "Inferno Overdrive Plus", color: "white", dmg: 210, stars: 0, effect: "burn" },
  "blastoise": { name: "Hydro Vortex Plus", color: "white", dmg: 200, stars: 0, effect: "bench" },
  "venusaur": { name: "Bloom Doom Plus", color: "white", dmg: 200, stars: 0, effect: "spore" },
  "gengar": { name: "Never-Ending Nightmare Plus", color: "purple", dmg: 0, stars: 4, effect: "curse" },
  "lucario": { name: "All-Out Aura Pummeling", color: "gold", dmg: 200, stars: 0, effect: "ko" },
  "solgaleo": { name: "Searing Sunraze Smash", color: "white", dmg: 240, stars: 0, effect: "ultraspace" },
  "lunala": { name: "Menacing Moonraze Maelstrom", color: "purple", dmg: 0, stars: 4, effect: "ultraspace" },
  "necrozma": { name: "Light That Burns the Sky", color: "white", dmg: 260, stars: 0, effect: "ko" },
  "tapu_koko": { name: "Guardian of Alola", color: "gold", dmg: 220, stars: 0, effect: "paralyze" },
  "tapu_lele": { name: "Guardian of Alola (Psychic)", color: "gold", dmg: 220, stars: 0, effect: "wait" },
  "tapu_bulu": { name: "Guardian of Alola (Grass)", color: "gold", dmg: 220, stars: 0, effect: "ko" },
  "tapu_fini": { name: "Guardian of Alola (Water)", color: "gold", dmg: 220, stars: 0, effect: "bench" },
  "dialga": { name: "Roar of Time Z", color: "purple", dmg: 0, stars: 4, effect: "wait" },
  "palkia": { name: "Spacial Rend Z", color: "purple", dmg: 0, stars: 4, effect: "banish" },
  "giratina": { name: "Shadow Force Z", color: "purple", dmg: 0, stars: 4, effect: "bench" },
  "deoxys": { name: "Psycho Boost Z", color: "white", dmg: 240, stars: 0, effect: "ko" },
  "reshiram": { name: "Fusion Flare Z", color: "white", dmg: 230, stars: 0, effect: "burn" },
  "zekrom": { name: "Fusion Bolt Z", color: "gold", dmg: 230, stars: 0, effect: "paralyze" },
  "marshadow": { name: "Soul-Stealing 7-Star Strike", color: "purple", dmg: 0, stars: 4, effect: "ko" },
  "zeraora": { name: "Plasma Fists Z", color: "gold", dmg: 220, stars: 0, effect: "paralyze" }
};

function getFigureZMove(unit) {
  if (!unit) return { name: "Breakneck Blitz", color: "white", dmg: 180, stars: 0, effect: "ko" };
  const cleanId = (unit.baseId || unit.id || "").toLowerCase().replace(/[\s\-_]/g, "");
  const cleanName = (unit.name || "").toLowerCase().replace(/[\s\-_]/g, "");
  for (const [sigKey, zData] of Object.entries(SIGNATURE_Z_MOVES)) {
    if (cleanId.includes(sigKey) || cleanName.includes(sigKey)) return zData;
  }
  const typeStr = Array.isArray(unit.types) ? unit.types.join("/") : (unit.type || "Normal");
  const types = typeStr.split(/[\/,]/).map(t => t.trim());
  for (const t of types) {
    if (Z_MOVES_DB[t]) return Z_MOVES_DB[t];
  }
  return Z_MOVES_DB.Normal;
}
window.Z_MOVES_DB = Z_MOVES_DB;
window.SIGNATURE_Z_MOVES = SIGNATURE_Z_MOVES;
window.getFigureZMove = getFigureZMove;

function triggerCombat(atkUnit, defUnit, broadcast, forcedSpins) {
  // Check if Bot (owner === 'p2') should auto-trigger Z-Move when charged (1x per match limit)!
  if (atkUnit.owner === "p2" && !state.zMoveUsedP2 && (state.zGaugeP2 || 0) >= 100) {
    state.zMoveArmed = true;
  }

  const hasManualSpin = forcedSpins && forcedSpins.manualSpin;
  let atkSpin = (forcedSpins && forcedSpins.atkSpin) ? forcedSpins.atkSpin : spinWheelForUnit(atkUnit, true);
  let defSpin = (forcedSpins && forcedSpins.defSpin) ? forcedSpins.defSpin : spinWheelForUnit(defUnit, false);

  // Z-Move 7.0 Resolution: Unleash Z-Power and break defender's Blue defense slices into Miss!
  const isZMove = Boolean(
    state.zMoveArmed && (
      (atkUnit.owner === "p1" && state.turn === "p1" && !state.zMoveUsedP1) ||
      (atkUnit.owner === "p2" && !state.zMoveUsedP2)
    )
  );
  if (isZMove) {
    state.zMoveArmed = false;
    if (atkUnit.owner === "p1") {
      state.zMoveUsedP1 = true;
      state.zGaugeP1 = 0;
    } else {
      state.zMoveUsedP2 = true;
      state.zGaugeP2 = 0;
    }
    const zData = getFigureZMove(atkUnit);
    const zMoveSlice = {
      name: "⚡ " + zData.name,
      color: zData.color,
      dmg: zData.dmg || 0,
      stars: zData.stars || (zData.color === "purple" ? 4 : 0),
      effect: zData.effect,
      size: 96,
      isZMove: true
    };
    atkSpin.segs = [zMoveSlice];
    atkSpin.chosen = zMoveSlice;
    atkSpin.chosenIdx = 0;
    if (atkSpin.spinSteps && atkSpin.spinSteps[0]) {
      atkSpin.spinSteps[0].idx = 0;
      atkSpin.spinSteps[0].landedName = zMoveSlice.name;
    }
    // Z-Break mechanic: Z-Move breaks defender's Blue defense slices into Miss!
    defSpin.segs.forEach(s => {
      if (s.color === "blue") {
        s.color = "red";
        s.name = "Miss (Z-Break)";
        s.dmg = 0;
      }
    });
    if (defSpin.chosen.color === "blue") {
      defSpin.chosen = { name: "Miss (Z-Break)", color: "red", dmg: 0, stars: 0, size: defSpin.chosen.size };
    }
    playSfx("portal");
    setLogText(`⚡ Z-MOVE: [${zData.name}] ativado por ${atkUnit.name}! Quebrou Blue do defensor em Miss!`);
    const zb = document.getElementById("zmove-combat-banner");
    if (zb) {
      zb.innerHTML = `⚡ Z-MOVE: <strong>${zData.name.toUpperCase()}</strong> (${zData.dmg > 0 ? zData.dmg + ' DANO' : '★' + (zData.stars || 4) + ' PURPLE'} · Z-BREAK BLUE)!`;
      zb.style.display = "block";
      setTimeout(() => { if (zb) zb.style.display = "none"; }, 3000);
    }
  } else {
    if (!state.zMoveUsedP1) state.zGaugeP1 = Math.min(100, (state.zGaugeP1 || 0) + 15);
    else state.zGaugeP1 = 0;
    if (!state.zMoveUsedP2) state.zGaugeP2 = Math.min(100, (state.zGaugeP2 || 0) + 15);
    else state.zGaugeP2 = 0;
  }

  const antiRespinOnField = state.units.some(u => u.location === "board" && (u.baseId === "dialga_o" || u.baseId === "metagross"));
  const isDoubleChanceArmed = Boolean(state.doubleChanceArmed || (forcedSpins && forcedSpins.doubleChanceArmed));
  if (isDoubleChanceArmed && antiRespinOnField) {
    setLogText("🛡️ Re-Spin bloqueado pela passiva Hyper Sonic / Temporal Lock em campo!");
  }
  const isDoubleChanceActive = isDoubleChanceArmed && !antiRespinOnField;
  state.doubleChanceArmed = false;
  state.doubleChanceWaitingChoice = false;
  state.doubleChanceUsedOnce = false;
  state.activePlate = null;
  renderPlatesTray();

  const nextTurnVal = (forcedSpins && forcedSpins.nextTurn) ? forcedSpins.nextTurn : (state.turn === "p1" ? "p2" : "p1");
  const nextCounterVal = (forcedSpins && typeof forcedSpins.nextTurnCounter === "number")
    ? forcedSpins.nextTurnCounter
    : Math.max(0, state.turnCounter - 1);
  pendingCombatTurnInfo = { nextTurn: nextTurnVal, nextTurnCounter: nextCounterVal };

  if (broadcast && state.mode === "p2p") {
    appendTcpLog(`> Record Combat atk=${atkUnit.uid} def=${defUnit.uid}`);
    sendP2PPacket({
      type: "Record",
      atkUid: atkUnit.uid,
      defUid: defUnit.uid,
      atkSpin,
      defSpin,
      doubleChanceArmed: isDoubleChanceActive,
      nextTurn: nextTurnVal,
      nextTurnCounter: nextCounterVal
    });
  }

  const outcome = evaluateCombat(atkUnit, defUnit, atkSpin, defSpin);
  const overlay = document.getElementById("wheel-overlay");
  overlay.classList.add("show");
  ddCanClose = false;

  // CRITICAL FIX: Always map the Local Viewer (`getBottomRole()`) to the Bottom-Left Blue Wheel,
  // and the Opponent across the table to the Top-Right Red Wheel — even when the Opponent is the Attacker!
  // Previously, when the Opponent attacked the Player, `atkSpin` (Opponent's roll, e.g. 70) was drawn in
  // the Player's Blue Bottom-Left corner and `defSpin` (Player's roll, e.g. 71) was drawn in the Opponent's Red Top-Left corner!
  const botRole = getBottomRole();
  const isMyUnitAttacker = (atkUnit.owner === botRole);
  const myUnit  = isMyUnitAttacker ? atkUnit : defUnit;
  const oppUnit = isMyUnitAttacker ? defUnit : atkUnit;
  const canInteractiveDoubleChance = isDoubleChanceActive && isMyUnitAttacker;
  let isRespinningAttacker = false;
  let aiRespinTimeout = null;

  function triggerAttackerRespin(newSpin) {
    state.doubleChanceWaitingChoice = false;
    state.doubleChanceUsedOnce = true;
    activeBattleRespinFn = null;
    activeBattleAcceptFn = null;
    playSfx("portal");
    atkSpin = newSpin;
    Object.assign(outcome, evaluateCombat(atkUnit, defUnit, atkSpin, defSpin));
    isRespinningAttacker = true;
    stageIdx = 0;
    stageStart = performance.now();
    stageHoldAnnounced = false;
    allSpinStagesFinished = false;
  }

  currentCombatDoubleChanceHandler = function(msg) {
    if (!state.doubleChanceWaitingChoice && !allSpinStagesFinished) {
      pendingP2PDoubleChanceMsg = msg;
      return;
    }
    if (msg.action === "keep") {
      state.doubleChanceWaitingChoice = false;
      state.doubleChanceUsedOnce = true;
      activeBattleRespinFn = null;
      activeBattleAcceptFn = null;
      postSpinStart = performance.now();
    } else if (msg.action === "respin" && msg.newAtkSpin) {
      triggerAttackerRespin(msg.newAtkSpin);
    }
  };

  // Exact contact angles from each wheel's center to the Central Clash Point (176.5, 265):
  // Top-Right Opponent Wheel center = (220, 146) -> ray to (176.5, 265) is atan2(119, -43.5) = +1.9337 rad
  // Bottom-Left Player Wheel center = (133, 384) -> ray to (176.5, 265) is atan2(-119, 43.5) = -1.2079 rad
  const OPP_WHEEL_CX = 220, OPP_WHEEL_CY = 146;
  const MY_WHEEL_CX  = 133, MY_WHEEL_CY  = 384;
  const CLASH_X = 176.5, CLASH_Y = 265;
  const oppContactAngle = Math.atan2(CLASH_Y - OPP_WHEEL_CY, CLASH_X - OPP_WHEEL_CX);
  const myContactAngle  = Math.atan2(CLASH_Y - MY_WHEEL_CY,  CLASH_X - MY_WHEEL_CX);

  let stageIdx = 0;
  let stageStart = performance.now();
  let stageHoldAnnounced = false;
  let allSpinStagesFinished = false;
  let postSpinStart = 0;
  let lastTick = 0, impactTriggered = false;
  const clashParticles = [];
  const vsFloatingTexts = [];
  const vsSparks = [];
  let screenShakeMagnitude = 0;

  function playComboSfx(hits, isStop) {
    try {
      ensureAudio();
      if (!sfxCtx) return;
      const now = sfxCtx.currentTime;
      const osc = sfxCtx.createOscillator();
      const g = sfxCtx.createGain();
      osc.connect(g);
      g.connect(sfxCtx.destination);
      if (isStop) {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(960, now + 0.22);
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        const baseFreq = 420 + Math.min(hits, 8) * 85;
        osc.type = "square";
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, now + 0.12);
        g.gain.setValueAtTime(0.07, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch (e) {}
  }

  function triggerVsMultiplierHit({ wheelCx, wheelCy, step, side }) {
    const isPlayer = (side === "player");
    const isStop = Boolean(step.stoppedChain);
    const spawnX = isPlayer ? (wheelCx + 12) : (wheelCx - 12);
    const spawnY = isPlayer ? (wheelCy - 52) : (wheelCy + 52);

    const mainColor = isStop ? (isPlayer ? "#4ade80" : "#fb7185") : (isPlayer ? "#fde047" : "#f43f5e");
    const glowColor = isPlayer ? "#eab308" : "#e11d48";

    const mainText = isStop ? `TOTAL: ${step.accumDmg}` : `+${step.unitDmg}!`;
    const comboBadge = `${step.hits}x COMBO`;
    const sumText = isStop ? `(FINALIZADO)` : `➔ ${step.accumDmg} DANO`;

    vsFloatingTexts.push({
      x: spawnX + (Math.random() - 0.5) * 8,
      y: spawnY,
      startX: spawnX,
      startY: spawnY,
      vx: (Math.random() - 0.5) * 0.8,
      vy: isStop ? -1.2 : -2.2,
      scale: 2.35,
      targetScale: 1.0,
      life: 1.0,
      decay: isStop ? 0.012 : 0.015,
      mainText,
      comboBadge,
      sumText,
      mainColor,
      strokeColor: "#000000",
      glowColor,
      isStop,
      shockwaveR: 10,
      shockwaveAlpha: 0.95
    });

    screenShakeMagnitude = Math.min(7.5, 3.2 + step.hits * 1.0);

    const burstCount = isStop ? 24 : 18;
    for (let i = 0; i < burstCount; i++) {
      const ang = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.45;
      const spd = 2.4 + Math.random() * 4.6;
      const colPalette = isPlayer
        ? ["#ffffff", "#fef08a", "#fde047", "#f59e0b", "#38bdf8"]
        : ["#ffffff", "#fecdd3", "#fb7185", "#f43f5e", "#fb923c"];
      vsSparks.push({
        x: spawnX,
        y: spawnY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 0.7,
        size: 3.5 + Math.random() * 3.5,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.3,
        color: colPalette[Math.floor(Math.random() * colPalette.length)],
        life: 1.0,
        decay: 0.022 + Math.random() * 0.018,
        shape: Math.random() < 0.65 ? "star" : "diamond"
      });
    }

    playComboSfx(step.hits, isStop);
  }

  // Track the angle at which each wheel finished its previous stage so re-spins start smoothly from there!
  let prevMyRot = 0;
  let prevOppRot = 0;

  if (ddAnimId) cancelAnimationFrame(ddAnimId);

  function renderDataDiskFrame(now) {
    try {
    const mySpin  = isMyUnitAttacker ? atkSpin : defSpin;
    const oppSpin = isMyUnitAttacker ? defSpin : atkSpin;
    const mySteps  = (mySpin.spinSteps && mySpin.spinSteps.length > 0) ? mySpin.spinSteps : [{ idx: mySpin.chosenIdx, sliceFrac: mySpin.sliceFrac, extraTurns: 6, isMultiHit: false, stoppedChain: false, hits: 1, unitDmg: mySpin.chosen.dmg, accumDmg: mySpin.chosen.dmg, landedName: mySpin.chosen.name }];
    const oppSteps = (oppSpin.spinSteps && oppSpin.spinSteps.length > 0) ? oppSpin.spinSteps : [{ idx: oppSpin.chosenIdx, sliceFrac: oppSpin.sliceFrac, extraTurns: 6, isMultiHit: false, stoppedChain: false, hits: 1, unitDmg: oppSpin.chosen.dmg, accumDmg: oppSpin.chosen.dmg, landedName: oppSpin.chosen.name }];
    const totalStages = isRespinningAttacker
      ? (isMyUnitAttacker ? mySteps.length : oppSteps.length)
      : Math.max(mySteps.length, oppSteps.length);

    const curStageIdx = Math.min(stageIdx, totalStages - 1);
    const myActiveStep  = mySteps[Math.min(curStageIdx, mySteps.length - 1)];
    const oppActiveStep = oppSteps[Math.min(curStageIdx, oppSteps.length - 1)];
    const isMyWheelSpinningThisStage  = !allSpinStagesFinished && (isRespinningAttacker ? isMyUnitAttacker : (curStageIdx < mySteps.length));
    const isOppWheelSpinningThisStage = !allSpinStagesFinished && (isRespinningAttacker ? !isMyUnitAttacker : (curStageIdx < oppSteps.length));

    const stageSpinDur = (curStageIdx === 0) ? 1420 : 1020;
    const stageHoldDur = (totalStages > 1) ? 880 : 0;
    const stageElapsed = now - stageStart;
    const p = allSpinStagesFinished ? 1 : Math.min(1, stageElapsed / stageSpinDur);
    const ease = 1 - Math.pow(1 - p, 3.5);
    const wobble = p < 0.97 ? Math.sin(p * 52) * 0.14 * (1 - p) : 0;

    if (!allSpinStagesFinished && now - lastTick > 55 + p * 165 && p < 0.97) {
      playSfx("tick");
      lastTick = now;
    }

    // Compute exact wheel rotations for the current stage (`curStageIdx`):
    const myDir  = mySpin.isPanic ? -1 : 1;
    const oppDir = oppSpin.isPanic ? 1 : -1;
    const myTargetRot  = getTargetAngleForSegment(mySpin.segs,  myActiveStep.idx,  myContactAngle,  myActiveStep.sliceFrac);
    const oppTargetRot = getTargetAngleForSegment(oppSpin.segs, oppActiveStep.idx, oppContactAngle, oppActiveStep.sliceFrac);

    let curMyRot = myTargetRot;
    if (isMyWheelSpinningThisStage) {
      const revs = (myActiveStep.extraTurns || 5) * Math.PI * 2 * myDir;
      curMyRot = myTargetRot - (1 - ease) * revs;
    }
    let curOppRot = oppTargetRot;
    if (isOppWheelSpinningThisStage) {
      const revs = (oppActiveStep.extraTurns || 5) * Math.PI * 2 * oppDir;
      curOppRot = oppTargetRot - (1 - ease) * revs;
    }

    // When a stage finishes spinning (`p >= 1`), play feedback sound once and hold for `stageHoldDur` before launching next re-spin!
    if (!allSpinStagesFinished && p >= 1) {
      if (!stageHoldAnnounced) {
        stageHoldAnnounced = true;
        const anyMultiHitThisStage = (isMyWheelSpinningThisStage && myActiveStep.isMultiHit) || (isOppWheelSpinningThisStage && oppActiveStep.isMultiHit);
        playSfx(anyMultiHitThisStage ? "portal" : "hit");

        // Vampire Survivors Style: Floating Combat Text & Particle Bursts for Multiplier Hits & Chain End!
        if (isMyWheelSpinningThisStage && (myActiveStep.isMultiHit || myActiveStep.stoppedChain)) {
          triggerVsMultiplierHit({
            wheelCx: MY_WHEEL_CX,
            wheelCy: MY_WHEEL_CY,
            step: myActiveStep,
            side: "player"
          });
        }
        if (isOppWheelSpinningThisStage && (oppActiveStep.isMultiHit || oppActiveStep.stoppedChain)) {
          triggerVsMultiplierHit({
            wheelCx: OPP_WHEEL_CX,
            wheelCy: OPP_WHEEL_CY,
            step: oppActiveStep,
            side: "opp"
          });
        }
      }
      if (stageElapsed >= stageSpinDur + stageHoldDur) {
        if (stageIdx + 1 < totalStages) {
          stageIdx++;
          stageStart = now;
          stageHoldAnnounced = false;
          return requestAnimationFrame(renderDataDiskFrame);
        } else {
          allSpinStagesFinished = true;
          postSpinStart = now;
        }
      }
    }

    const postElapsed = allSpinStagesFinished ? (now - postSpinStart) : 0;

    ddCtx.save();
    ddCtx.imageSmoothingEnabled = (window.pixelArtMode === 'hd');
    ddCtx.imageSmoothingQuality = "high";
    const curS = window.ACTIVE_SCALE || HD_SCALE;
    ddCtx.scale(curS, curS);
    if (screenShakeMagnitude > 0.1) {
      const shakeX = (Math.random() - 0.5) * screenShakeMagnitude;
      const shakeY = (Math.random() - 0.5) * screenShakeMagnitude;
      ddCtx.translate(shakeX, shakeY);
      screenShakeMagnitude *= 0.88;
    }
    ddCtx.clearRect(-10, -10, LOGICAL_W + 20, LOGICAL_H + 20);

    // Interactive Double Chance prompt once all initial spin stages finish!
    if (allSpinStagesFinished && !impactTriggered && isDoubleChanceActive && !state.doubleChanceUsedOnce) {
      if (pendingP2PDoubleChanceMsg) {
        const pm = pendingP2PDoubleChanceMsg;
        pendingP2PDoubleChanceMsg = null;
        window.handleP2PDoubleChanceChoice(pm);
        return requestAnimationFrame(renderDataDiskFrame);
      }

      state.doubleChanceWaitingChoice = true;
      if (canInteractiveDoubleChance) {
        activeBattleRespinFn = () => {
          const freshSpin = spinWheelForUnit(atkUnit, true);
          if (state.mode === "p2p" && typeof sendP2PPacket === "function") {
            sendP2PPacket({ type: "P2P_DOUBLE_CHANCE_CHOICE", action: "respin", newAtkSpin: freshSpin });
          }
          triggerAttackerRespin(freshSpin);
        };
        activeBattleAcceptFn = () => {
          state.doubleChanceWaitingChoice = false;
          state.doubleChanceUsedOnce = true;
          activeBattleRespinFn = null;
          activeBattleAcceptFn = null;
          if (state.mode === "p2p" && typeof sendP2PPacket === "function") {
            sendP2PPacket({ type: "P2P_DOUBLE_CHANCE_CHOICE", action: "keep" });
          }
          postSpinStart = performance.now();
        };
      } else if (state.mode === "ai" && !isMyUnitAttacker) {
        if (!aiRespinTimeout) {
          aiRespinTimeout = setTimeout(() => {
            aiRespinTimeout = null;
            if (outcome.winner !== "atk") {
              const aiFreshSpin = spinWheelForUnit(atkUnit, true);
              triggerAttackerRespin(aiFreshSpin);
            } else {
              state.doubleChanceWaitingChoice = false;
              state.doubleChanceUsedOnce = true;
              postSpinStart = performance.now();
            }
          }, 650);
        }
      }
    }

    // Trigger outcome resolution once all spin stages (including Double Chance re-spin!) are complete
    if (allSpinStagesFinished && !impactTriggered && !state.doubleChanceWaitingChoice) {
      if (isRespinningAttacker) {
        isRespinningAttacker = false;
      }
      impactTriggered = true;
      state.doubleChanceUsedOnce = false;
      playSfx("hit");
      ddCanClose = true;
      const winUnit = outcome.winner === "atk" ? atkUnit : (outcome.winner === "def" ? defUnit : null);
      const loser   = outcome.winner === "atk" ? defUnit : (outcome.winner === "def" ? atkUnit : null);
      const winSpin = outcome.winner === "atk" ? atkSpin.chosen : (outcome.winner === "def" ? defSpin.chosen : null);

      // Ditto Transform Mirror ability: Se vencer o combate usando Transform Mirror, transforma-se no oponente por 3 turnos!
      const isTransformSpin = winSpin && (winSpin.name.toLowerCase().includes("transform") || winSpin.effect === "transform");
      const isDittoFigure = winUnit && (winUnit.baseId === "ditto" || (winUnit.origDittoData && winUnit.origDittoData.baseId === "ditto") || (winUnit.name && winUnit.name.toLowerCase().includes("ditto")));
      if (winUnit && loser && (isTransformSpin || isDittoFigure && winSpin && winSpin.name.toLowerCase().includes("transform"))) {
        if (typeof applyDittoTransformation === "function") {
          applyDittoTransformation(winUnit, loser);
        } else if (typeof window.applyDittoTransformation === "function") {
          window.applyDittoTransformation(winUnit, loser);
        }
      }

      // Lucario Inner Focus / Steadfast victory aura: ganha +10 DMG de vitória acumulado
      if (winUnit && (winUnit.baseId === "lucario" || winUnit.name === "Lucario")) {
        winUnit.lucarioBonus = (winUnit.lucarioBonus || 0) + 10;
        setLogText(`✨ Lucario fortaleceu sua Aura com a vitória (+${winUnit.lucarioBonus} DANO acumulado)!`);
      }

      const defWasFrozen = (defUnit.condition === PokemonCondition.Freeze);
      if (atkSpin.chosen.color === "blue") atkUnit.condition = PokemonCondition.Normal;
      if (defSpin.chosen.color === "blue") defUnit.condition = PokemonCondition.Normal;

      if (loser && winUnit) {
        if (state.meadowPowerActive && outcome.winner === "atk") state.meadowPowerActive = false;
        const effMap = {
          sleep: PokemonCondition.Sleep, spore: PokemonCondition.Sleep,
          panic: PokemonCondition.Panic, freeze: PokemonCondition.Freeze,
          poison: PokemonCondition.Poison, badpoison: PokemonCondition.BadPoison, toxic: PokemonCondition.BadPoison,
          paralyze: PokemonCondition.Paralyze, burn: PokemonCondition.Burn
        };
        if (effMap[outcome.effect]) {
          if (loser.baseId === "snorlax" && (outcome.effect.includes("poison") || outcome.effect === "burn")) {
            setLogText(`🛡️ Snorlax resistiu a ${outcome.effect} por sua Habilidade Imunidade/Corpo Robusto!`);
          } else {
            loser.condition = effMap[outcome.effect];
          }
          evolveUnitInMatch(winUnit);
        } else if (outcome.effect === "bench") {
          loser.location = "bench"; loser.nodeId = null; loser.waitTurns = 2;
          if (loser.baseId === "lucario") {
            loser.waitTurns = 0;
            setLogText(`🛡️ Lucario resistiu à condição de Espera com Foco Interno!`);
          }
          spawnPortalParticles(BOARD_NODES[winUnit.nodeId || 0].x, BOARD_NODES[winUnit.nodeId || 0].y, "#38bdf8");
          evolveUnitInMatch(winUnit);
        } else if (outcome.effect === "heal") {
          if (winUnit) winUnit.condition = PokemonCondition.Normal;
          sendToPC(loser);
          evolveUnitInMatch(winUnit);
        } else if (outcome.effect === "push") {
          const openAdj = (ADJ[loser.nodeId] || []).find(nid => !unitAtNode(nid));
          if (openAdj !== undefined) {
            loser.nodeId = openAdj;
            loser.waitTurns = 2;
            if (loser.baseId === "lucario") {
              loser.waitTurns = 0;
              setLogText(`🛡️ Lucario resistiu à condição de Espera com Foco Interno!`);
            }
            spawnPortalParticles(BOARD_NODES[openAdj].x, BOARD_NODES[openAdj].y, "#c084fc");
          } else {
            loser.location = "bench"; loser.nodeId = null; loser.waitTurns = 2;
            if (loser.baseId === "lucario") {
              loser.waitTurns = 0;
              setLogText(`🛡️ Lucario resistiu à condição de Espera com Foco Interno!`);
            }
          }
          evolveUnitInMatch(winUnit);
        } else if (outcome.effect === "swap") {
          const tmpNode = atkUnit.nodeId;
          atkUnit.nodeId = defUnit.nodeId;
          defUnit.nodeId = tmpNode;
          evolveUnitInMatch(winUnit);
        } else if (outcome.effect === "banish") {
          banishToUltraSpace(loser);
          evolveUnitInMatch(winUnit);
        } else {
          if (loser.baseId === "magikarp") {
            applyUnitEvolutionNow(loser);
            setLogText(`🌊 Magikarp sobreviveu ao nocaute pela Habilidade Especial e evoluiu para Gyarados!`);
          } else {
            sendToPC(loser);
          }
          evolveUnitInMatch(winUnit);
        }
      }
      if (defWasFrozen && defUnit.location === "board") {
        defUnit.condition = PokemonCondition.Normal;
      }
      checkSurroundKOs();
      state.attackTargets = [];
      state.reachableNodes = [];
      setLogText(outcome.reason);
    }

    const didMyUnitWin  = (outcome.winner === "atk" && isMyUnitAttacker)  || (outcome.winner === "def" && !isMyUnitAttacker);
    const didOppUnitWin = (outcome.winner === "atk" && !isMyUnitAttacker) || (outcome.winner === "def" && isMyUnitAttacker);

    // ======================================================================
    // PURE BATTLE ROULETTE: TWO INTERLOCKING DATA DISKS & CENTRAL CLASH PIN!
    // Clean, authentic Pokémon Duel roulette without intrusive popups or message boxes!
    // ======================================================================
    ddCtx.fillStyle = "#04060b";
    ddCtx.fillRect(0, 0, 353, 530);
    if (typeof bananaWheelImg !== "undefined" && bananaWheelImg && bananaWheelImg.complete && bananaWheelImg.naturalWidth > 0) {
      ddCtx.save();
      ddCtx.globalAlpha = 0.22;
      ddCtx.drawImage(bananaWheelImg, 0, 88, 353, 353);
      ddCtx.restore();
    }

    // Golden friction sparks flying out from the central contact point (176.5, 265) while spinning
    if (p < 1 && clashParticles.length < 28) {
      const ang = (Math.random() < 0.5 ? -0.35 : 2.79) + (Math.random() - 0.5) * 0.7;
      const spd = 2.5 + Math.random() * 5.5;
      clashParticles.push({
        x: CLASH_X, y: CLASH_Y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        r: 2 + Math.random() * 2.5, life: 1.0, col: Math.random() < 0.6 ? "#facc15" : "#fb923c"
      });
    }
    for (let i = clashParticles.length - 1; i >= 0; i--) {
      const cp = clashParticles[i];
      cp.x += cp.vx; cp.y += cp.vy; cp.life -= 0.05;
      if (cp.life <= 0) { clashParticles.splice(i, 1); continue; }
      ddCtx.strokeStyle = cp.col; ddCtx.globalAlpha = cp.life; ddCtx.lineWidth = 2;
      ddCtx.beginPath(); ddCtx.moveTo(cp.x, cp.y); ddCtx.lineTo(cp.x - cp.vx * 2.5, cp.y - cp.vy * 2.5); ddCtx.stroke();
    }
    ddCtx.globalAlpha = 1;

    const oppHighlightIdx = (p >= 1 || !isOppWheelSpinningThisStage) ? oppActiveStep.idx : -1;
    const myHighlightIdx  = (p >= 1 || !isMyWheelSpinningThisStage)  ? myActiveStep.idx  : -1;

    // 1. Draw Opponent's Giant Data Disk at Top-Right (cx=220, cy=146, r=122) — showTopPin = FALSE!
    drawAuthenticDataDisk(
      ddCtx, OPP_WHEEL_CX, OPP_WHEEL_CY, 122,
      oppSpin.segs, curOppRot,
      oppHighlightIdx,
      0, "#f43f5e", false, null
    );

    // 2. Draw Player's Giant Data Disk at Bottom-Left (cx=133, cy=384, r=122) — showTopPin = FALSE!
    drawAuthenticDataDisk(
      ddCtx, MY_WHEEL_CX, MY_WHEEL_CY, 122,
      mySpin.segs, curMyRot,
      myHighlightIdx,
      0, "#38bdf8", false, null
    );

    // 3. THE SINGLE UNAMBIGUOUS CENTRAL CLASH PIN (`176.5, 265`) WITH DUAL ARROWS POINTING INTO EACH WHEEL!
    ddCtx.save();
    ddCtx.translate(CLASH_X, CLASH_Y);
    ddCtx.rotate(oppContactAngle + Math.PI / 2 + wobble);
    ddCtx.strokeStyle = "#facc15";
    ddCtx.lineWidth = 2.5;
    ddCtx.shadowColor = "#facc15";
    ddCtx.shadowBlur = 10;
    ddCtx.beginPath();
    ddCtx.moveTo(0, -22);
    ddCtx.lineTo(0, 22);
    ddCtx.stroke();

    // Top Arrowhead pointing directly into Opponent's winning slice
    ddCtx.beginPath();
    ddCtx.moveTo(0, -24);
    ddCtx.lineTo(-8, -9);
    ddCtx.lineTo(8, -9);
    ddCtx.closePath();
    ddCtx.fillStyle = "#fb7185";
    ddCtx.fill();
    ddCtx.strokeStyle = "#ffffff";
    ddCtx.lineWidth = 1.5;
    ddCtx.stroke();

    // Bottom Arrowhead pointing directly into Player's winning slice
    ddCtx.beginPath();
    ddCtx.moveTo(0, 24);
    ddCtx.lineTo(-8, 9);
    ddCtx.lineTo(8, 9);
    ddCtx.closePath();
    ddCtx.fillStyle = "#38bdf8";
    ddCtx.fill();
    ddCtx.strokeStyle = "#ffffff";
    ddCtx.lineWidth = 1.5;
    ddCtx.stroke();

    // Central Gold Hub Gem
    ddCtx.beginPath();
    ddCtx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ddCtx.fillStyle = "#facc15";
    ddCtx.fill();
    ddCtx.strokeStyle = "#090d16";
    ddCtx.lineWidth = 2;
    ddCtx.stroke();
    ddCtx.restore();

    // Interactive Double Chance Buttons or Waiting Banner (Clean bottom placement outside wheels)
    if (state.doubleChanceWaitingChoice) {
      ddCtx.save();
      if (canInteractiveDoubleChance) {
        ddCtx.fillStyle = "rgba(9, 13, 22, 0.94)";
        ddCtx.fillRect(18, 466, 317, 56);
        ddCtx.strokeStyle = "#facc15"; ddCtx.lineWidth = 1.5;
        ddCtx.strokeRect(18, 466, 317, 56);
        ddCtx.fillStyle = "#fde047"; ddCtx.font = "900 10px sans-serif"; ddCtx.textAlign = "center";
        const dcTitle = (typeof t === "function") ? t("battle.double_chance_title", "DOUBLE CHANCE — Aceitar giro atual ou Re-girar?") : "DOUBLE CHANCE — Aceitar giro atual ou Re-girar?";
        ddCtx.fillText(dcTitle, 176.5, 479);

        ddCtx.fillStyle = "#15803d"; ddCtx.strokeStyle = "#86efac"; ddCtx.lineWidth = 1.5;
        ddCtx.beginPath(); ddCtx.roundRect(28, 486, 138, 30, 5); ddCtx.fill(); ddCtx.stroke();
        ddCtx.fillStyle = "#ffffff"; ddCtx.font = "900 11px sans-serif";
        const keepTxt = (typeof t === "function") ? t("battle.keep", "✓ Manter") : "✓ Manter";
        ddCtx.fillText(keepTxt, 97, 501.5);

        ddCtx.fillStyle = "#b45309"; ddCtx.strokeStyle = "#fde047"; ddCtx.lineWidth = 1.5;
        ddCtx.beginPath(); ddCtx.roundRect(186, 486, 138, 30, 5); ddCtx.fill(); ddCtx.stroke();
        ddCtx.fillStyle = "#fef08a"; ddCtx.font = "900 11px sans-serif";
        const respinTxt = (typeof t === "function") ? t("battle.respin", "↻ Re-Girar") : "↻ Re-Girar";
        ddCtx.fillText(respinTxt, 255, 501.5);
      } else {
        ddCtx.fillStyle = "rgba(9, 13, 22, 0.94)";
        ddCtx.fillRect(18, 474, 317, 38);
        ddCtx.strokeStyle = "#38bdf8"; ddCtx.lineWidth = 1.5;
        ddCtx.strokeRect(18, 474, 317, 38);
        ddCtx.fillStyle = "#38bdf8"; ddCtx.font = "900 11px sans-serif"; ddCtx.textAlign = "center";
        const oppEvalTxt = (typeof t === "function") ? t("battle.opp_evaluating", "⏳ Oponente avaliando Double Chance...") : "⏳ Oponente avaliando Double Chance...";
        ddCtx.fillText(oppEvalTxt, 176.5, 497);
      }
      ddCtx.restore();
    }

    // ======================================================================
    // VAMPIRE SURVIVORS STYLE: FLOATING COMBAT TEXT & COMBO DAMAGE SUMMING
    // ======================================================================
    // (Top-left HUD message removed per user request: wheel arena is 100% clean!)

    // 2. Shockwave Expanding Rings
    for (let i = vsFloatingTexts.length - 1; i >= 0; i--) {
      const ft = vsFloatingTexts[i];
      if (ft.shockwaveAlpha > 0.05) {
        ddCtx.save();
        ddCtx.beginPath();
        ddCtx.arc(ft.startX, ft.startY, ft.shockwaveR, 0, Math.PI * 2);
        ddCtx.strokeStyle = ft.mainColor;
        ddCtx.lineWidth = 3 * ft.shockwaveAlpha;
        ddCtx.globalAlpha = ft.shockwaveAlpha;
        ddCtx.stroke();
        ddCtx.restore();
        ft.shockwaveR += 3.8;
        ft.shockwaveAlpha *= 0.88;
      }
    }

    // 3. Spark Particles (Stars & Diamonds)
    for (let i = vsSparks.length - 1; i >= 0; i--) {
      const sp = vsSparks[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += 0.08; // gentle gravity
      sp.rot += sp.vrot;
      sp.life -= sp.decay;
      if (sp.life <= 0) {
        vsSparks.splice(i, 1);
        continue;
      }

      ddCtx.save();
      ddCtx.translate(sp.x, sp.y);
      ddCtx.rotate(sp.rot);
      ddCtx.globalAlpha = Math.max(0, sp.life);
      ddCtx.fillStyle = sp.color;

      if (sp.shape === "star") {
        const rOut = sp.size;
        const rIn = sp.size * 0.32;
        ddCtx.beginPath();
        for (let s = 0; s < 4; s++) {
          const a1 = (s * Math.PI) / 2;
          const a2 = a1 + Math.PI / 4;
          if (s === 0) ddCtx.moveTo(Math.cos(a1) * rOut, Math.sin(a1) * rOut);
          else ddCtx.lineTo(Math.cos(a1) * rOut, Math.sin(a1) * rOut);
          ddCtx.lineTo(Math.cos(a2) * rIn, Math.sin(a2) * rIn);
        }
        ddCtx.closePath();
        ddCtx.fill();
      } else {
        const r = sp.size * 0.9;
        ddCtx.beginPath();
        ddCtx.moveTo(0, -r);
        ddCtx.lineTo(r * 0.7, 0);
        ddCtx.lineTo(0, r);
        ddCtx.lineTo(-r * 0.7, 0);
        ddCtx.closePath();
        ddCtx.fill();
      }
      ddCtx.restore();
    }

    // 4. Vampire Survivors Floating Combat Texts
    for (let i = vsFloatingTexts.length - 1; i >= 0; i--) {
      const ft = vsFloatingTexts[i];
      ft.x += ft.vx;
      ft.y += ft.vy;
      ft.scale += (ft.targetScale - ft.scale) * 0.24;
      ft.life -= ft.decay;
      if (ft.life <= 0) {
        vsFloatingTexts.splice(i, 1);
        continue;
      }

      const alpha = Math.min(1, ft.life * 1.5);
      ddCtx.save();
      ddCtx.translate(ft.x, ft.y);
      ddCtx.scale(ft.scale, ft.scale);
      ddCtx.globalAlpha = alpha;
      ddCtx.textAlign = "center";
      ddCtx.textBaseline = "middle";
      ddCtx.lineJoin = "round";

      // Glow / Shadow
      ddCtx.shadowColor = ft.glowColor;
      ddCtx.shadowBlur = 12;

      // Primary Pop Number (e.g. "+50!" or "TOTAL: 150")
      const mainFontSize = ft.isStop ? 19 : 25;
      ddCtx.font = `900 ${mainFontSize}px Impact, system-ui, sans-serif`;
      ddCtx.strokeStyle = "#000000";
      ddCtx.lineWidth = 5;
      ddCtx.strokeText(ft.mainText, 0, -8);
      ddCtx.fillStyle = ft.mainColor;
      ddCtx.fillText(ft.mainText, 0, -8);

      // Sub-label: Combo & Progressive Sum ("2x COMBO ➔ 100 DANO")
      ddCtx.shadowBlur = 6;
      ddCtx.font = "900 11px system-ui, -apple-system, sans-serif";
      const fullSub = `${ft.comboBadge} ${ft.sumText}`;
      ddCtx.lineWidth = 3.5;
      ddCtx.strokeStyle = "#000000";
      ddCtx.strokeText(fullSub, 0, 11);
      ddCtx.fillStyle = "#ffffff";
      ddCtx.fillText(fullSub, 0, 11);

      ddCtx.restore();
    }

    // ======================================================================
    // CINEMATIC ATTACK IMPACT ANIMATION (Elemental Slash / Sonic Beam / Shield FX)
    // ======================================================================
    if (allSpinStagesFinished && postElapsed > 50 && postElapsed < 1250 && outcome && !state.doubleChanceWaitingChoice && !isRespinningAttacker) {
      const isWinnerAtk = (outcome.winner === "atk");
      const isWinnerDef = (outcome.winner === "def");
      const hasWinner = (isWinnerAtk || isWinnerDef);

      const winUnit = isWinnerAtk ? atkUnit : (isWinnerDef ? defUnit : null);
      const loseUnit = isWinnerAtk ? defUnit : (isWinnerDef ? atkUnit : null);
      const winSlice = isWinnerAtk ? atkSpin.chosen : (isWinnerDef ? defSpin.chosen : null);

      const targetX = isWinnerAtk ? OPP_WHEEL_CX : MY_WHEEL_CX;
      const targetY = isWinnerAtk ? OPP_WHEEL_CY : MY_WHEEL_CY;
      const sourceX = isWinnerAtk ? MY_WHEEL_CX : OPP_WHEEL_CX;
      const sourceY = isWinnerAtk ? MY_WHEEL_CY : OPP_WHEEL_CY;

      const animProg = Math.min(1.0, (postElapsed - 50) / 450);
      const fadeAlpha = 1.0 - Math.max(0, (postElapsed - 600) / 600);

      ddCtx.save();
      ddCtx.globalAlpha = Math.max(0, fadeAlpha);

      if (hasWinner && winSlice) {
        if (winSlice.color === "gold") {
          // GOLD SONIC LASER BEAM (Hyper Sonic / Gold Attacks)
          ddCtx.strokeStyle = "#facc15";
          ddCtx.lineWidth = 14 * (1.0 - animProg * 0.4);
          ddCtx.shadowColor = "#fde047";
          ddCtx.shadowBlur = 25;
          ddCtx.beginPath();
          ddCtx.moveTo(sourceX, sourceY);
          ddCtx.lineTo(targetX, targetY);
          ddCtx.stroke();

          // Sonic Shockwave Rings on Target
          ddCtx.beginPath();
          ddCtx.arc(targetX, targetY, 20 + animProg * 65, 0, Math.PI * 2);
          ddCtx.strokeStyle = "#ffffff";
          ddCtx.lineWidth = 3;
          ddCtx.stroke();

        } else if (winSlice.color === "purple") {
          // PURPLE MYSTIC PLASMA BURST (Aura Sphere / Status / Special Moves)
          const plasmaR = 15 + animProg * 80;
          const pGrad = ddCtx.createRadialGradient(targetX, targetY, 5, targetX, targetY, plasmaR);
          pGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          pGrad.addColorStop(0.4, "rgba(192, 132, 252, 0.85)");
          pGrad.addColorStop(1, "rgba(126, 34, 206, 0)");
          ddCtx.fillStyle = pGrad;
          ddCtx.beginPath();
          ddCtx.arc(targetX, targetY, plasmaR, 0, Math.PI * 2);
          ddCtx.fill();

        } else {
          // WHITE / PHYSICAL FLAMING SLASH CUT (Fire Spin / Iron Tail / Tackle)
          ddCtx.save();
          ddCtx.translate(targetX, targetY);
          ddCtx.rotate(Math.PI / 4);

          // 3 diagonal slash cuts
          [-22, 0, 22].forEach(offset => {
            ddCtx.beginPath();
            ddCtx.moveTo(-75 * animProg, offset);
            ddCtx.lineTo(75 * animProg, offset);
            ddCtx.strokeStyle = (offset === 0) ? "#ffffff" : "#fb923c";
            ddCtx.lineWidth = (offset === 0) ? 6 : 3.5;
            ddCtx.shadowColor = "#ef4444";
            ddCtx.shadowBlur = 18;
            ddCtx.stroke();
          });
          ddCtx.restore();
        }
      } else {
        // BLUE DEFENSE OR HYPER SONIC IMMUNITY SHIELD
        const isMewShield = outcome.reason && outcome.reason.includes("Hyper Sonic");
        const shieldR = 25 + animProg * 50;
        ddCtx.save();
        ddCtx.translate(CLASH_X, CLASH_Y);
        ddCtx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const sx = Math.cos(a) * shieldR;
          const sy = Math.sin(a) * shieldR;
          if (i === 0) ddCtx.moveTo(sx, sy);
          else ddCtx.lineTo(sx, sy);
        }
        ddCtx.closePath();
        ddCtx.fillStyle = isMewShield ? "rgba(250, 204, 21, 0.28)" : "rgba(56, 189, 248, 0.28)";
        ddCtx.fill();
        ddCtx.strokeStyle = isMewShield ? "#fde047" : "#e0f2fe";
        ddCtx.lineWidth = 4;
        ddCtx.shadowColor = isMewShield ? "#facc15" : "#38bdf8";
        ddCtx.shadowBlur = 20;
        ddCtx.stroke();
        ddCtx.restore();
      }

      ddCtx.restore();
    }

    ddCtx.restore();

    // Auto-close battle screen after wheels finish spinning and outcome is clearly shown
    const closeWaitMs = (totalStages > 1) ? 1900 : 1500;
    if (allSpinStagesFinished && postElapsed > closeWaitMs && ddCanClose && !state.doubleChanceWaitingChoice && !isRespinningAttacker) {
      closeBattleOverlay();
      return;
    }

    if (overlay.classList.contains("show")) {
      ddAnimId = requestAnimationFrame(renderDataDiskFrame);
    }
    } catch (err) {
      console.error("renderDataDiskFrame caught error:", err);
      try { ddCtx.restore(); } catch (e2) {}
      closeBattleOverlay();
    }
  }

  ddAnimId = requestAnimationFrame(renderDataDiskFrame);
}

function closeBattleOverlay() {
  document.getElementById("wheel-overlay").classList.remove("show");
  if (ddAnimId) cancelAnimationFrame(ddAnimId);
  activeBattleRespinFn = null;
  activeBattleAcceptFn = null;
  currentCombatDoubleChanceHandler = null;
  pendingP2PDoubleChanceMsg = null;
  state.doubleChanceWaitingChoice = false;
  if (pendingCombatTurnInfo) {
    const info = pendingCombatTurnInfo;
    pendingCombatTurnInfo = null;
    applyExplicitTurn(info.nextTurn, info.nextTurnCounter);
  }
}

function applyExplicitTurn(nextTurn, nextCounter) {
  const prevTurn = state.turn;
  state.postMoveAttackMode = false;
  state.pendingPostMoveTurn = null;
  state.units.filter(u => u.owner === prevTurn).forEach(u => {
    if (u.waitTurns > 0) u.waitTurns = Math.max(0, u.waitTurns - 1);
    if (u.megaTurns && u.megaTurns > 0) {
      u.megaTurns--;
      if (u.megaTurns === 0) {
        if (typeof revertMegaEvolution === "function") {
          revertMegaEvolution(u);
        } else if (typeof window.revertMegaEvolution === "function") {
          window.revertMegaEvolution(u);
        } else {
          u.name = (u.preMegaName || u.name).replace(/^Mega\s+/, "");
          u.mp = u.baseMp || u.mp;
        }
      }
    }
    if (u.transformTurns && u.transformTurns > 0) {
      u.transformTurns--;
      if (u.transformTurns === 0) {
        if (typeof revertDittoTransformation === "function") {
          revertDittoTransformation(u);
        } else if (typeof window.revertDittoTransformation === "function") {
          window.revertDittoTransformation(u);
        }
      }
    }
  });
  state.selectedUnitId = null;
  state.reachableNodes = [];
  state.reachablePaths = {};
  state.attackTargets = [];
  state.xAttackArmed = false;
  state.xSpeedArmed = false;
  state.doubleChanceArmed = false;
  state.abilityJumpActive = false;
  state.activePlate = null;
  state.pendingPlateAction = null;
  if (!state.zMoveUsedP1) state.zGaugeP1 = Math.min(100, (state.zGaugeP1 || 0) + 10);
  else state.zGaugeP1 = 0;
  if (!state.zMoveUsedP2) state.zGaugeP2 = Math.min(100, (state.zGaugeP2 || 0) + 10);
  else state.zGaugeP2 = 0;
  state.zMoveArmed = false;
  state.turn = nextTurn;
  if (typeof syncActivePlayerPlates === "function") syncActivePlayerPlates();
  if (typeof renderPlatesTray === "function") renderPlatesTray();
  state.turnBannerAnim = { turn: nextTurn, t0: performance.now() };
  if (typeof nextCounter === "number") state.turnCounter = nextCounter;

  // Rule 2: 300-Turn Limit Check
  if (state.turnCounter <= 0 && !state.winCelebrationAnim) {
    const w = nextTurn === "p1" ? "p2" : "p1";
    setLogText("⏰ LIMITE DE 300 TURNOS ATINGIDO! Fim de partida!");
    state.winCelebrationAnim = { winner: w, t0: performance.now() };
    return;
  }

  // Section 8: ENTRY BLOCK & WAIT WIN CHECK
  // If the player whose turn just started has ZERO legal moves (e.g. both Entry Points blocked and no movable figures on the board) and ZERO legal attacks, they immediately lose by Wait Win!
  if (!state.winCelebrationAnim) {
    const activeUnits = state.units.filter(u => u.owner === nextTurn && u.location !== "pc" && u.location !== "ultra_space");
    let legalMovesCount = 0;
    let legalAttacksCount = 0;
    activeUnits.forEach(u => {
      const r = computeReachableWithPaths(u);
      legalMovesCount += r.nodes.length;
      if (u.location === "board" && u.waitTurns === 0 && u.condition !== PokemonCondition.Sleep && u.condition !== PokemonCondition.Freeze) {
        (ADJ[u.nodeId] || []).forEach(nid => {
          const occ = unitAtNode(nid);
          if (occ && occ.owner !== nextTurn) legalAttacksCount++;
        });
      }
    });
    if (legalMovesCount === 0 && legalAttacksCount === 0) {
      const waitWinner = nextTurn === "p1" ? "p2" : "p1";
      setLogText(`🏆 WAIT WIN! ${nextTurn.toUpperCase()} está com os Entry Points bloqueados e sem movimentos legais!`);
      spawnPortalParticles(176, 264, "#facc15");
      state.winCelebrationAnim = { winner: waitWinner, t0: performance.now() };
      return;
    }
  }

  if (state.mode === "p2p") {
    const isMine = (state.turn === state.myRole);
    const sideLbl = state.myRole === "p1" ? "P1 Azul · Sua Mesa Embaixo" : "P2 Vermelho · Sua Mesa Embaixo (Visão Oposta 180°)";
    setLogText(isMine ? `🟢 SUA VEZ! (${sideLbl}) Toque numa figura no banco.` : `⏳ Vez do Oponente... (${sideLbl}) Aguarde a jogada.`);
    state.turnBannerAnim = { turn: nextTurn, t0: performance.now() };
    if (isMine) playSfx("portal");
  } else if (state.mode === "pass") {
    const curP = state.turn === "p1" ? "Jogador 1 (Azul · Embaixo)" : "Jogador 2 (Vermelho · Embaixo)";
    setLogText(`👥 VEZ DE: ${curP} Toque numa figura.`);
    state.turnBannerAnim = { turn: nextTurn, t0: performance.now() };
    playSfx("portal");
  }

  if (state.mode === "ai" && state.turn === "p2") {
    setTimeout(triggerPlayerAIMove, 520);
  }
}

function endTurn(broadcast, explicitNextTurn, explicitNextCounter) {
  const nextT = explicitNextTurn || (state.turn === "p1" ? "p2" : "p1");
  const nextC = (typeof explicitNextCounter === "number") ? explicitNextCounter : Math.max(0, state.turnCounter - 1);
  if (broadcast && state.mode === "p2p") {
    sendP2PPacket({ type: "StockGo", nextTurn: nextT, turnCounter: nextC });
  }
  applyExplicitTurn(nextT, nextC);
}


