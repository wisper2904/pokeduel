// v708 · Habilidades oficiais restantes — mapeamento manual (texto → mecânica) + motor estendido
// Gerado de /home/claude/gen/abil_manual.py. Chave = officialDuelId. Substitui o 'ef' automático dessas habilidades.
const OFFICIAL_DUEL_ABILITIES_MANUAL = {"1": [{"k": "koToBench"}], "53": [{"k": "koToBench"}], "3": [{"k": "mp", "n": 1, "c": {"adjHas": {"types": ["Water"]}}}], "252": [{"k": "mp", "n": 1, "c": {"adjHas": {"types": ["Water"]}}}], "263": [{"k": "mp", "n": 1, "c": {"adjHas": {"types": ["Water"]}}}], "50": [{"k": "mp", "n": 1, "c": {"evolved": true}}], "60": [{"k": "mp", "n": 1, "c": {"evolved": true}}], "118": [{"k": "mp", "n": 1, "c": {"evolved": true}}], "163": [{"k": "mp", "n": 1, "c": {"evolved": true}}], "281": [{"k": "mp", "n": 1, "c": {"evolved": true}}], "387": [{"k": "mp", "n": 1, "c": {"evolved": true}}], "594": [{"k": "mp", "n": 1, "c": {"evolved": true}}], "218": [{"k": "mp", "n": 1, "c": {"onBench": true}}], "207": [{"k": "mp", "n": 1, "c": {"onBench": true}}, {"k": "noPassOver"}], "602": [{"k": "mp", "n": 1, "c": {"onBench": true}}, {"k": "noPassOver"}], "244": [{"k": "passSel", "any": true, "st": ["burn"]}, {"k": "mp", "n": 1, "c": {"onBench": true}}], "290": [{"k": "passSel", "any": true, "wait": true}, {"k": "mp", "n": 1, "c": {"onBench": true, "evolved": true}}], "241": [{"k": "mp", "n": 1, "c": {"fieldHas": {"side": "opp", "st": ["any"]}}}], "466": [{"k": "mpSet", "n": 3, "c": {"noOppWithin2": true}}], "430": [{"k": "mpSet", "n": 3, "c": {"confused": true}}], "426": [{"k": "mp", "n": 1, "per": {"where": "field", "names": ["Regirock", "Regice", "Registeel"]}}, {"k": "immovable"}], "526": [{"k": "mpMin", "n": 3}, {"k": "evolveOnRevive"}], "497": [{"k": "mp", "n": 1, "c": {"first": true}}], "93": [{"k": "mpAura", "n": -1, "side": "all", "st": ["poison", "badpoison"], "tag": "pollen"}], "168": [{"k": "mpAura", "n": 1, "side": "own", "types": ["Ground"], "maxMp": 1, "c": {"fieldHas": {"side": "all", "types": ["Water"], "min": 3}}, "tag": "mud"}], "189": [{"k": "mpAura", "n": 1, "side": "own", "types": ["Ground"], "maxMp": 1, "c": {"fieldHas": {"side": "all", "types": ["Water"], "min": 3}}, "tag": "mud"}], "260": [{"k": "mpAura", "n": 1, "side": "own", "types": ["Water"], "notNames": ["Corsola"], "maxMp": 1, "c": {"notSt": ["poison", "badpoison"]}, "tag": "coral"}], "367": [{"k": "mpAura", "n": 1, "side": "own", "types": ["Grass"], "maxMp": 1, "c": {"noStatus": true}, "tag": "turf"}], "373": [{"k": "mpAura", "n": 1, "side": "own", "types": ["Electric"], "range": 1, "cap": 3, "tag": "battery"}], "138": [{"k": "mpAura", "set": 2, "side": "own", "maxMp": 1, "range": 1, "tag": "balance1"}, {"k": "mpAura", "set": 2, "side": "opp", "minMp": 3, "range": 1, "tag": "balance2"}], "473": [{"k": "mpAura", "n": -1, "side": "opp", "types": ["Ice"], "c": {"noStatus": true}, "nearOwnTypes": ["Ice"], "tag": "frosttag"}], "599": [{"k": "mpAura", "n": -1, "side": "opp", "types": ["Flying", "Dragon"], "range": 2, "tag": "whiteout"}], "612": [{"k": "mpAura", "n": -1, "side": "opp", "types": ["Flying", "Dragon"], "range": 2, "tag": "whiteout"}], "601": [{"k": "mpAura", "n": -1, "side": "opp", "types": ["Grass", "Fairy"], "range": 2, "tag": "stench"}], "614": [{"k": "mpAura", "n": -1, "side": "opp", "types": ["Grass", "Fairy"], "range": 2, "tag": "stench"}], "265": [{"k": "mpAura", "set": 0, "side": "opp", "notTypes": ["Flying"], "range": 1, "tag": "arenatrap"}], "485": [{"k": "mp", "n": -1}, {"k": "markerShield"}], "38": [{"k": "passSel", "any": true, "types": ["Grass"]}], "179": [{"k": "passSel", "any": true, "types": ["Grass"]}], "188": [{"k": "passSel", "any": true, "st": ["paralyze"]}], "348": [{"k": "passSel", "any": true, "types": ["Ghost"], "st": ["any"]}], "449": [{"k": "passSel", "any": true, "types": ["Fire"], "st": ["burn"]}, {"k": "oppShift", "n": 1, "c": {"oppHasStatus": true}}], "475": [{"k": "passSel", "any": true, "types": ["Ice"]}, {"k": "dodgeUnder"}], "496": [{"k": "passSel", "any": true, "types": ["Ice"]}, {"k": "dodgeUnder"}], "345": [{"k": "pass"}, {"k": "passKill", "st": ["poison", "badpoison", "sleep"]}], "362": [{"k": "pass"}, {"k": "auraDmg", "n": -1, "side": "opp", "tag": "hacking"}], "235": [{"k": "passSel", "own": true}], "315": [{"k": "whiteToGold", "c": {"adjHas": {"names": ["Durant"], "side": "own"}}}, {"k": "passSel", "names": ["Durant"], "any": true}], "371": [{"k": "allyPassTypes", "types": ["Water"], "c": {"noStatus": true}}], "153": [{"k": "pass"}, {"k": "surroundImmune"}, {"k": "noSurround"}], "361": [{"k": "pass"}, {"k": "surroundImmune"}, {"k": "noSurround"}], "358": [{"k": "surroundImmune"}], "161": [{"k": "allowPass", "side": "own"}], "230": [{"k": "allowPass", "side": "own"}], "293": [{"k": "allowPass", "side": "own"}], "600": [{"k": "allowPass", "side": "own"}, {"k": "battleOppNullAbility", "notTypes": ["Ghost", "Dark"], "c": {"noStatus": true}}], "324": [{"k": "allowPass", "side": "own"}], "379": [{"k": "allowPass", "side": "own"}, {"k": "evolveOnInflict", "st": ["burn"]}], "394": [{"k": "allowPass", "side": "own", "types": ["Bug"]}], "328": [{"k": "allowPass", "side": "own", "types": ["Ice"]}], "311": [{"k": "allowPass", "side": "all", "paralyzeOpp": true}], "331": [{"k": "allowPass", "side": "own"}], "14": [{"k": "noPassOver"}], "211": [{"k": "noPassOver"}], "215": [{"k": "noPassOver"}], "217": [{"k": "noPassOver"}], "212": [{"k": "noPassOver"}], "228": [{"k": "noPassOver", "chain": true}], "139": [{"k": "noPassOver", "byTypes": ["Ghost"], "protectTypes": ["Dark"]}], "551": [{"k": "noPassOver"}, {"k": "oppBlueMiss", "c": {"oppHasStatus": true}}], "310": [{"k": "flyOverParalyze"}], "45": [{"k": "dmg", "n": 50, "scope": "self", "c": {"hasStatus": true}}], "167": [{"k": "dmg", "n": 50, "scope": "self", "c": {"hasStatus": true}}], "46": [{"k": "dmg", "n": 20, "scope": "self", "c": {"fieldHas": {"side": "opp", "names": ["Groudon", "Kyogre", "Rayquaza", "Primal Groudon", "Primal Kyogre", "Mega Rayquaza"]}}}], "80": [{"k": "dmg", "n": 20, "scope": "self", "c": {"fieldHas": {"side": "opp", "names": ["Groudon", "Kyogre", "Rayquaza", "Primal Groudon", "Primal Kyogre", "Mega Rayquaza"]}}}], "112": [{"k": "dmg", "n": 20, "scope": "self", "c": {"fieldHas": {"side": "opp", "names": ["Groudon", "Kyogre", "Rayquaza", "Primal Groudon", "Primal Kyogre", "Mega Rayquaza"]}}}], "119": [{"k": "dmg", "n": 10, "scope": "allies", "types": ["Ground"], "c": {"noStatus": true}}], "137": [{"k": "dmg", "n": 20, "scope": "self", "move": "Ember", "per": {"where": "pc", "side": "own"}}], "245": [{"k": "dmg", "n": 20, "scope": "self", "move": "Ember", "per": {"where": "pc", "side": "own"}}], "303": [{"k": "dmg", "n": 30, "scope": "self", "c": {"atEntry": true}}], "304": [{"k": "dmg", "n": 30, "scope": "self", "c": {"atEntry": true}}], "306": [{"k": "dmgMult", "n": 2, "c": {"adjHas": {"names": ["Reuniclus", "Duosion", "Solosis"], "side": "own"}}}], "307": [{"k": "dmgMult", "n": 2, "c": {"adjHas": {"names": ["Reuniclus", "Duosion", "Solosis"], "side": "own"}}}], "375": [{"k": "dmg", "n": 1, "scope": "allies", "types": ["Electric"], "per": {"where": "field", "types": ["Electric"]}}], "406": [{"k": "dmg", "n": 29, "scope": "self", "per": {"where": "ultra"}}], "428": [{"k": "dmg", "n": 30, "scope": "allies", "move": "Sacred Sword", "c": {"myturn": true}}], "432": [{"k": "dmg", "n": 50, "scope": "allies", "move": "Moonblast", "c": {"noStatus": true}, "tag": "crescent"}], "259": [{"k": "stars", "n": 1}], "108": [{"k": "whiteToGold", "c": {"adjHas": {"names": ["Carvanha"], "side": "own"}}}], "91": [{"k": "auraDmg", "n": -20, "side": "all", "st": ["poison"], "tag": "diffuse"}], "240": [{"k": "auraDmg", "n": -20, "side": "all", "st": ["poison"], "tag": "diffuse"}], "456": [{"k": "auraDmg", "n": -10, "side": "all", "notTypes": ["Poison", "Steel"], "tag": "indiscriminate"}], "176": [{"k": "lessInFrom", "n": 20, "fromTypes": ["Dark"]}], "478": [{"k": "protect", "n": 10, "types": ["Normal", "Flying"], "tag": "cotton"}], "477": [{"k": "protect", "n": 30, "types": ["Fire"], "fromTypes": ["Fire"], "c": {"noStatus": true}, "tag": "thermo"}], "452": [{"k": "lessIn", "n": 50, "c": {"hasStatus": true}}, {"k": "onEnterCleanse", "st": ["burn"]}], "143": [{"k": "oppShift", "n": 2}], "385": [{"k": "oppGoldMiss"}], "587": [{"k": "oppGoldMiss"}], "196": [{"k": "oppBlueMiss"}], "525": [{"k": "oppGoldToWhite", "c": {"first": true}}, {"k": "nullOppDmg", "c": {"first": true}}], "115": [{"k": "nullOppDmg"}], "312": [{"k": "nullOppDmg"}], "468": [{"k": "nullOppDmg", "c": {"noStatus": true}}], "47": [{"k": "oppRespin", "when": "purple"}], "62": [{"k": "oppRespin", "when": "dmg10"}], "224": [{"k": "oppRespin", "when": "any"}], "308": [{"k": "selfRespin", "per": {"where": "field", "names": ["Reuniclus"], "side": "own"}, "c": {"myturn": true}}], "87": [{"k": "battleOppStatus", "st": "burn", "types": ["Grass", "Bug"]}], "254": [{"k": "battleOppStatus", "st": "burn", "types": ["Grass", "Bug"]}], "610": [{"k": "battleOppStatus", "st": "paralyze"}], "494": [{"k": "battleOppStatus", "st": "burn"}, {"k": "selfStatusAfter", "st": "burn"}], "74": [{"k": "battleOppWait", "n": 1}], "239": [{"k": "battleOppWait", "n": 1}], "98": [{"k": "whiteStatusImmune"}], "256": [{"k": "synchronize"}], "64": [{"k": "immune", "st": ["poison", "badpoison"], "scope": "allies", "types": ["Grass", "Poison"]}], "199": [{"k": "immune", "st": ["poison", "badpoison"], "scope": "allies", "types": ["Grass", "Poison"]}], "183": [{"k": "immune", "st": ["all"], "scope": "alliesAdj"}], "221": [{"k": "immune", "st": ["sleep"]}], "249": [{"k": "selfCleanseStart"}], "280": [{"k": "selfCleanseStart"}], "67": [{"k": "badDreams"}], "253": [{"k": "magicTrick"}], "451": [{"k": "noKoEffect"}], "620": [{"k": "noKoEffect", "c": {"noStatus": true}}], "605": [{"k": "noKoEffect", "c": {"noStatus": true}}], "229": [{"k": "noKoEffect", "scope": "selfAdj"}], "457": [{"k": "noKo", "c": {"vsPureType": "Water"}}], "481": [{"k": "noKo", "c": {"vsPureType": "Water"}}], "560": [{"k": "noKo", "c": {"noStatus": true, "vsType": "Ghost"}}], "582": [{"k": "noKo", "c": {"noStatus": true, "oppNotEvolved": true}}, {"k": "koExile"}], "483": [{"k": "noKo", "c": {"oppDmgMin": 130}}], "577": [{"k": "reflectKoWhite"}], "370": [{"k": "voltAbsorb"}], "393": [{"k": "voltAbsorb"}], "586": [{"k": "fairyGuard"}], "555": [{"k": "koToEntry"}], "234": [{"k": "koExile"}], "237": [{"k": "koExile"}], "552": [{"k": "koExile"}, {"k": "battleOppNullAbility"}], "458": [{"k": "koExile"}], "459": [{"k": "koExile"}], "198": [{"k": "koEvolve"}], "495": [{"k": "koEvolve"}], "617": [{"k": "koEvolve"}], "289": [{"k": "startWait", "n": 10}, {"k": "koEvolve", "revive": 1}], "155": [{"k": "evolveSurvive"}], "205": [{"k": "evolveSurvive"}], "609": [{"k": "evolveSurvive"}], "618": [{"k": "evolveSurvive"}], "619": [{"k": "evolveSurvive"}], "480": [{"k": "evolveOnInflict", "st": ["poison", "badpoison"]}], "57": [{"k": "evolveOnRevive"}], "321": [{"k": "evolveOnRevive"}], "42": [{"k": "koRevivePC"}], "488": [{"k": "regenerator"}], "222": [{"k": "onEnterCleanse"}], "299": [{"k": "onEnterCleanse"}], "604": [{"k": "onEnterCleanse"}], "621": [{"k": "onEnterCleanse"}], "231": [{"k": "onEnterCleanse", "scope": "all"}], "329": [{"k": "onEnterClearWait"}], "232": [{"k": "startWait", "n": 9}], "261": [{"k": "startWait", "n": 9}], "51": [{"k": "noAttack"}], "127": [{"k": "noAttackAfterMove"}], "206": [{"k": "blockOppPlates"}], "210": [{"k": "blockOppPlates", "c": {"fieldHas": {"side": "own", "names": ["Politoed"], "min": 2}}}], "92": [{"k": "fleeToBench"}], "116": [{"k": "fleeToBench"}], "16": [{"k": "dodgeUnder"}], "77": [{"k": "dodgeUnder"}], "190": [{"k": "dodgeUnder"}], "359": [{"k": "fleeSwap"}], "376": [{"k": "fleeSwap"}], "158": [{"k": "info"}], "646": [{"k": "info"}], "322": [{"k": "info"}]};

// ---------------------------------------------------------------------------
// Motor estendido (v708). Carrega logo depois de abilities.js.
// ---------------------------------------------------------------------------
(function setupManualAbilities() {
  if (typeof FIGURES_DB === "undefined") return;
  Object.keys(OFFICIAL_DUEL_ABILITIES_MANUAL).forEach((id) => {
    const ab = OFFICIAL_DUEL_ABILITIES[id];
    if (ab) ab.ef = OFFICIAL_DUEL_ABILITIES_MANUAL[id];
  });
  FIGURES_DB.forEach((f) => {
    const ef = f.officialDuelId != null ? OFFICIAL_DUEL_ABILITIES_MANUAL[f.officialDuelId] : null;
    if (!ef) return;
    f.abilityEf = ef;
    ef.forEach((e) => {
      const plain = !e.c || !Object.keys(e.c).length;
      if (e.k === "pass" && plain) f.canPassThrough = true;
      if (e.k === "mp" && plain && !e.per) f.mp = Math.max(1, Math.min(4, (f.mp || 1) + (e.n || 1)));
    });
  });
})();

const AB_ST_ALL = ["burn", "panic", "freeze", "paralyze", "poison", "badpoison", "sleep"];
function abStatusOf(u) { return (u && typeof ABIL_COND_TO_STATUS !== "undefined") ? ABIL_COND_TO_STATUS[u.condition] || null : null; }
function abHasStatus(u) { return !!abStatusOf(u); }
function abStMatch(u, list) {
  if (!list || !list.length) return true;
  const s = abStatusOf(u);
  if (list.includes("any")) return !!s;
  return !!s && list.includes(s);
}
function abNameMatch(u, names) { return !names || !names.length || names.some((nm) => String(u.name).replace(/\s*\(N.\d+\)$/, "") === nm || String(u.name).indexOf(nm + " ") === 0 || String(u.name) === nm); }
function abIsEntry(u) { const n = u && u.location === "board" && typeof BOARD_NODES !== "undefined" ? BOARD_NODES[u.nodeId] : null; return !!(n && n.role === (u.owner === "p1" ? "entry_p1" : "entry_p2")); }
function abDist(a, b) {
  if (!a || !b || a.location !== "board" || b.location !== "board") return 99;
  if (a.nodeId === b.nodeId) return 0;
  const seen = { [a.nodeId]: 0 }, q = [a.nodeId];
  while (q.length) {
    const x = q.shift(); const d = seen[x];
    if (d >= 3) break;
    for (const y of (ADJ[x] || [])) { if (seen[y] == null) { seen[y] = d + 1; if (y === b.nodeId) return d + 1; q.push(y); } }
  }
  return 99;
}
function abSideOk(src, u, side) {
  if (!side || side === "all") return true;
  if (side === "own") return u.owner === src.owner;
  if (side === "opp") return u.owner !== src.owner;
  return true;
}
function abMatches(src, u, e) {
  if (!abSideOk(src, u, e.side)) return false;
  if (e.types && e.types.length && !abilityTypesMatch(u, e.types)) return false;
  if (e.notTypes && e.notTypes.length && abilityTypesMatch(u, e.notTypes)) return false;
  if (e.names && e.names.length && !abNameMatch(u, e.names)) return false;
  if (e.notNames && e.notNames.length && abNameMatch(u, e.notNames)) return false;
  if (e.st && e.st.length && !abStMatch(u, e.st)) return false;
  return true;
}

// Um Pokémon com habilidade anulada (Enforcer, Mummy) perde a habilidade enquanto está em campo
const _v708AbilityEfOf = abilityEfOf;
abilityEfOf = function (unit) {
  if (unit && unit._abNull && unit.location === "board") return null;
  return _v708AbilityEfOf(unit);
};

// Condições novas
const _v708CondOk = abilityCondOk;
abilityCondOk = function (c, unit, opp) {
  if (!c) return true;
  if (!_v708CondOk(c, unit, opp)) return false;
  if (c.hasStatus && !abHasStatus(unit)) return false;
  if (c.notSt && abStMatch(unit, c.notSt)) return false;
  if (c.confused && abStatusOf(unit) !== "panic") return false;
  if (c.onBench && unit.location !== "bench") return false;
  if (c.atEntry && !abIsEntry(unit)) return false;
  if (c.adjHas) {
    const a = c.adjHas;
    if (!state.units.some((u) => u !== unit && abilityAdjacent(u, unit) && abMatches(unit, u, a))) return false;
  }
  if (c.fieldHas) {
    const fh = c.fieldHas; const min = fh.min || 1;
    const cnt = state.units.filter((u) => u.location === "board" && (u !== unit || fh.self) && abMatches(unit, u, fh)).length;
    if (cnt < min) return false;
  }
  if (c.noOppWithin2 && state.units.some((u) => u.owner !== unit.owner && abDist(u, unit) <= 2)) return false;
  if (c.vsPureType) { if (!opp) return false; const tp = String(abilityUnitTypes(opp)); if (tp !== c.vsPureType) return false; }
  if (c.oppHasStatus) { if (!opp || !abHasStatus(opp)) return false; }
  if (c.oppNotEvolved) { if (!opp || abilityIsEvolved(opp)) return false; }
  if (c.oppDmgMin) { const d = state.__abCtx && state.__abCtx.oppDmg; if (!(d >= c.oppDmgMin)) return false; }
  return true;
};

// Contagem por "ultra" (Ultra Space)
const _v708PerCount = abilityPerCount;
abilityPerCount = function (per, unit) {
  if (per && per.where === "ultra") return state.units.filter((u) => u.location === "ultra_space").length;
  return _v708PerCount(per, unit);
};

// Dano de habilidade restrito a um golpe (move) não entra no bônus geral
const _v708DmgBonus = abilityDamageBonus;
abilityDamageBonus = function (unit, opp, nullSelf) {
  const ef = abilityEfOf(unit);
  const hasMove = (list) => list && list.some((e) => e.k === "dmg" && e.move);
  if (!hasMove(ef) && !state.units.some((s) => s !== unit && s.location === "board" && hasMove(abilityEfOf(s)))) return _v708DmgBonus(unit, opp, nullSelf);
  // recalcula sem as cláusulas com "move"
  const strip = new Map();
  state.units.forEach((s) => { const f = FIGURES_DB[s.baseIdx]; if (f && f.abilityEf && hasMove(f.abilityEf)) { strip.set(f, f.abilityEf); f.abilityEf = f.abilityEf.filter((e) => !(e.k === "dmg" && e.move)); } });
  try { return _v708DmgBonus(unit, opp, nullSelf); } finally { strip.forEach((v, f) => { f.abilityEf = v; }); }
};
function abMoveDmg(unit, segName) {
  let add = 0;
  const base = String(segName || "").replace(/\*$/, "");
  const own = abilityEfOf(unit);
  if (own) own.forEach((e) => { if (e.k === "dmg" && e.move && e.scope === "self" && base === e.move && abilityCondOk(e.c, unit, null)) add += (e.n || 0) * abilityPerCount(e.per, unit); });
  const seenTag = {};
  state.units.forEach((src) => {
    if (src === unit || src.location !== "board" || src.owner !== unit.owner) return;
    const ef = abilityEfOf(src); if (!ef) return;
    ef.forEach((e) => {
      if (e.k !== "dmg" || !e.move || e.scope !== "allies" || base !== e.move || !abilityCondOk(e.c, src, null)) return;
      if (e.tag) { if (seenTag[e.tag]) return; seenTag[e.tag] = true; }
      add += (e.n || 0);
    });
  });
  if (own) own.forEach((e) => { if (e.k === "dmg" && e.move && e.scope === "allies" && base === e.move && abilityCondOk(e.c, unit, null) && !(e.tag && seenTag[e.tag])) add += (e.n || 0); });
  return add;
}

// --------------------------------------------------------------------------- MP
function abMpAuraFor(unit, mp) {
  const seenTag = {};
  state.units.forEach((src) => {
    if (src.location !== "board") return;
    const ef = abilityEfOf(src); if (!ef) return;
    ef.forEach((e) => {
      if (e.k !== "mpAura" || !abilityCondOk(e.c, src, null)) return;
      if (src === unit && e.side !== "all" && e.side !== "own") return;
      if (!abMatches(src, unit, e)) return;
      if (e.range && abDist(src, unit) > e.range) return;
      if (e.maxMp != null && mp > e.maxMp) return;
      if (e.minMp != null && mp < e.minMp) return;
      if (e.nearOwnTypes && !state.units.some((o) => o.owner === src.owner && o !== unit && abilityAdjacent(o, unit) && abilityTypesMatch(o, e.nearOwnTypes))) return;
      if (e.tag) { if (seenTag[e.tag]) return; seenTag[e.tag] = true; }
      if (e.set != null) mp = e.set; else mp = (e.n || 0) < 0 ? Math.max(Math.min(mp, 1), mp + e.n) : mp + (e.n || 0);
      if (e.cap != null) mp = Math.min(e.cap, mp);
    });
  });
  return mp;
}
if (typeof getEffectiveUnitMp === "function") {
  const _v708Mp = getEffectiveUnitMp;
  getEffectiveUnitMp = function (unit) {
    let mp = _v708Mp(unit);
    if (!unit) return mp;
    const ef = abilityEfOf(unit);
    if (ef) ef.forEach((e) => {
      if (e.k === "mp" && e.per && abilityCondOk(e.c, unit, null)) mp += (e.n || 1) * abilityPerCount(e.per, unit);
      if (e.k === "mpSet" && abilityCondOk(e.c, unit, null)) mp = e.n;
      if (e.k === "mpMin" && abilityCondOk(e.c, unit, null)) mp = Math.max(mp, e.n);
    });
    mp = abMpAuraFor(unit, mp);
    return Math.max(0, Math.min(4, mp));
  };
}

// --------------------------------------------------------------------------- Roleta (dano, ★, auras)
if (typeof getActiveWheel === "function") {
  const _v708Gaw = getActiveWheel;
  getActiveWheel = function (unit) {
    const segs = _v708Gaw(unit);
    if (!Array.isArray(segs) || !unit || !state || !Array.isArray(state.units)) return segs;
    const ef = abilityEfOf(unit) || [];
    let stars = 0;
    ef.forEach((e) => { if (e.k === "stars" && abilityCondOk(e.c, unit, null)) stars += (e.n || 1); });
    // auras de dano de outras peças (Diffuse Poison, Indiscriminate Poison, Hacking Gems)
    let aura = 0; const seenTag = {};
    state.units.forEach((src) => {
      if (src.location !== "board") return;
      const sef = abilityEfOf(src); if (!sef) return;
      sef.forEach((e) => {
        if (e.k !== "auraDmg" || !abilityCondOk(e.c, src, null) || !abMatches(src, unit, e)) return;
        if (src === unit && e.side === "opp") return;
        if (e.tag) { if (seenTag[e.tag]) return; seenTag[e.tag] = true; }
        aura += (e.n || 0);
      });
    });
    const anyMove = ef.some((e) => e.k === "dmg" && e.move) || state.units.some((s) => s.location === "board" && s.owner === unit.owner && (abilityEfOf(s) || []).some((e) => e.k === "dmg" && e.move));
    if (!stars && !aura && !anyMove) return segs;
    return segs.map((s) => {
      if (!s || s.isZMove) return s;
      const o = Object.assign({}, s);
      if ((o.color === "white" || o.color === "gold") && o.dmg > 0) {
        if (anyMove) o.dmg += abMoveDmg(unit, o.name);
        if (aura) o.dmg = Math.max(0, o.dmg + aura);
      }
      if (o.color === "purple" && stars) o.stars = (o.stars || 1) + stars;
      return o;
    });
  };
}

// --------------------------------------------------------------------------- Batalha
function abProtectFor(def, atk) {
  let less = 0; const seenTag = {};
  state.units.forEach((src) => {
    if (src.location !== "board" || src.owner !== def.owner) return;
    const ef = abilityEfOf(src); if (!ef) return;
    ef.forEach((e) => {
      if (e.k !== "protect" || !abilityCondOk(e.c, src, null)) return;
      if (e.types && !abilityTypesMatch(def, e.types)) return;
      if (e.fromTypes && !abilityTypesMatch(atk, e.fromTypes)) return;
      if (e.tag) { if (seenTag[e.tag]) return; seenTag[e.tag] = true; }
      less += (e.n || 0);
    });
  });
  return less;
}
function abRespinOf(unit, spin) {
  // novo giro aleatório (determinístico na partida P2P)
  try {
    const segs = (Array.isArray(spin.segs) && spin.segs.length) ? spin.segs : getActiveWheel(unit);
    const tot = segs.reduce((a, x) => a + (x.size || 0), 0);
    const rnd = (typeof nextDeterministicRandom === "function") ? nextDeterministicRandom() : Math.random();
    let r = rnd * tot, k = segs.length - 1;
    for (let i = 0; i < segs.length; i++) { r -= segs[i].size || 0; if (r < 0) { k = i; break; } }
    spin.chosenIdx = k; spin.chosen = Object.assign({}, segs[k]);
    if (spin.spinSteps && spin.spinSteps[0]) { spin.spinSteps[0].idx = k; spin.spinSteps[0].landedName = segs[k].name; }
    return true;
  } catch (e) { return false; }
}
function abStatusFromEffect(eff) {
  const map = { spore: "sleep", toxic: "badpoison", confuse: "panic", noxious: "badpoison" };
  const s = map[eff] || eff;
  return AB_ST_ALL.includes(s) ? s : null;
}
function abImmuneScoped(unit, st) {
  // imunidade dada por aliados (Healing Seed: aliados de tipo; Refraction: vizinhos)
  return state.units.some((src) => {
    if (src === unit || src.location !== "board" || src.owner !== unit.owner) return false;
    const ef = abilityEfOf(src); if (!ef) return false;
    return ef.some((e) => e.k === "immune" && e.scope && abilityCondOk(e.c, src, null) && (e.st || []).some((x) => x === "all" || x === st) &&
      (!e.types || abilityTypesMatch(unit, e.types)) && (e.scope !== "alliesAdj" || abilityAdjacent(src, unit)));
  });
}
const _v708ImmuneTo = abilityImmuneTo;
abilityImmuneTo = function (unit, eff, isNull) {
  if (_v708ImmuneTo(unit, eff, isNull)) return true;
  const st = abStatusFromEffect(eff);
  return !!(st && unit && abImmuneScoped(unit, st));
};

if (typeof evaluateCombat === "function") {
  const _v708Ec = evaluateCombat;
  evaluateCombat = function (atk, def, as, ds) {
    if (!as || !ds || !as.chosen || !ds.chosen) return _v708Ec(atk, def, as, ds);
    const isReal = ("multiHits" in as) && ("multiHits" in ds);
    const has = (u, k, o) => abilityHas(u, k, o);
    // 1) mexe nas roletas antes de comparar
    [[as, atk, def], [ds, def, atk]].forEach(([spin, unit, opp]) => {
      if (spin.chosen._ab708) return;
      const mine = abilityEfOf(unit) || [];
      // a habilidade do oponente desloca/troca o meu resultado
      const sh = has(opp, "oppShift", unit);
      if (sh && Array.isArray(spin.segs) && spin.segs.length > 1 && typeof spin.chosenIdx === "number") {
        const k = (spin.chosenIdx + (sh.n || 1)) % spin.segs.length;
        spin.chosenIdx = k; spin.chosen = Object.assign({}, spin.segs[k]);
      }
      let c = Object.assign({}, spin.chosen);
      if (c.color === "gold" && has(opp, "oppGoldMiss", unit)) c = Object.assign(c, { color: "red", name: "Miss", dmg: 0 });
      if ((c.color === "white" || c.color === "gold") && c.dmg > 0) {
        let d = c.dmg;
        // Mold Breaker: o oponente anula os bônus de habilidade do meu dano
        if (has(opp, "nullOppDmg", unit)) d = Math.max(0, d - Math.max(0, _v708DmgBonus(unit, null, false)));
        const mult = mine.find((e) => e.k === "dmgMult" && abilityCondOk(e.c, unit, opp));
        if (mult) d = d * (mult.n || 2);
        const lf = has(opp, "lessInFrom", unit);
        if (lf && abilityTypesMatch(unit, lf.fromTypes)) d = Math.max(0, d - (lf.n || 0));
        d = Math.max(0, d - abProtectFor(opp, unit));
        c.dmg = d;
      }
      c._ab708 = true;
      spin.chosen = c;
    });
    let out = _v708Ec(atk, def, as, ds);
    if (!out) return out;
    // 2) forçar re-giro do oponente uma vez por turno (Migraine, Battle Armor, Reflective Laser)
    if (isReal && (out.winner === "atk" || out.winner === "def")) {
      const loseU = out.winner === "atk" ? def : atk, winSpin = out.winner === "atk" ? as : ds, winU = out.winner === "atk" ? atk : def;
      const rr = has(loseU, "oppRespin", winU);
      if (rr && loseU._respinTurn !== state.turnCounter) {
        const w = winSpin.chosen;
        const ok = rr.when === "any" || (rr.when === "purple" && w.color === "purple") || (rr.when === "dmg10" && (w.dmg || 0) >= 10);
        if (ok && abRespinOf(winU, winSpin)) {
          loseU._respinTurn = state.turnCounter;
          winSpin.chosen._ab708 = false;
          out = evaluateCombat(atk, def, as, ds);
          out.reason = (out.reason || "") + ` 🔁 ${loseU.name} forçou novo giro!`;
          return out;
        }
      }
    }
    // re-giro próprio (Psychic Net) quando perderia
    if (isReal && (out.winner === "atk" || out.winner === "def")) {
      const loseU = out.winner === "atk" ? def : atk, loseSpin = out.winner === "atk" ? ds : as;
      const sr = has(loseU, "selfRespin", null);
      const left = sr ? abilityPerCount(sr.per, loseU) - (loseU._selfRespinUsed === state.turnCounter ? (loseU._selfRespinCnt || 0) : 0) : 0;
      if (sr && left > 0) {
        loseU._selfRespinCnt = (loseU._selfRespinUsed === state.turnCounter ? (loseU._selfRespinCnt || 0) : 0) + 1;
        loseU._selfRespinUsed = state.turnCounter;
        if (abRespinOf(loseU, loseSpin)) { loseSpin.chosen._ab708 = false; return evaluateCombat(atk, def, as, ds); }
      }
    }
    const pend = (fn) => { if (isReal) { state.__sliceFxPending = state.__sliceFxPending || []; state.__sliceFxPending.push(fn); } };
    // efeitos depois da batalha para os dois lados
    [[atk, def, as], [def, atk, ds]].forEach(([u, o, sp]) => {
      const ef = abilityEfOf(u) || [];
      ef.forEach((e) => {
        if (!abilityCondOk(e.c, u, o)) return;
        if (e.k === "battleOppWait") pend(() => { if (o.location === "board" || o.location === "bench") o.waitTurns = Math.max(o.waitTurns || 0, (e.n || 1) + 1); });
        if (e.k === "selfStatusAfter" && ABIL_STATUS_TO_COND[e.st]) pend(() => { if (u.location === "board" && !abilityImmuneTo(u, e.st)) u.condition = PokemonCondition[ABIL_STATUS_TO_COND[e.st]]; });
        if (e.k === "battleOppNullAbility" && abMatches(u, o, Object.assign({}, e, { side: "opp" }))) pend(() => { if (o.location === "board") o._abNull = true; });
        if (e.k === "magicTrick" && sp.chosen && sp.chosen.color === "red") pend(() => {
          const pl = (state.plates || []).find((p) => !p.disabledInDeck && (u.owner === "p2" ? p.usedP2 : p.usedP1));
          if (pl) { if (u.owner === "p2") pl.usedP2 = false; else pl.usedP1 = false; pl.used = false; try { renderPlatesTray(); } catch (er) {} setLogText(`🎩 ${u.name}: Magic Trick recuperou a Plate ${pl.name}!`); }
        });
      });
    });
    if (out.winner !== "atk" && out.winner !== "def") {
      [atk, def].forEach((u) => { if (has(u, "evolveSurvive", null)) pend(() => { if (u.location === "board" && typeof evolveUnitInMatch === "function") evolveUnitInMatch(u); }); });
      return out;
    }
    const winU = out.winner === "atk" ? atk : def, loseU = out.winner === "atk" ? def : atk;
    const winC = (out.winner === "atk" ? as : ds).chosen || {};
    const eff = out.effect || "ko";
    const tag = (t2) => { out.reason = (out.reason || "") + " 🛡️ " + t2; };
    state.__abCtx = { oppDmg: winC.dmg || 0 };
    const byDmg = (winC.color === "white" || winC.color === "gold");
    try {
      // quem perdeu
      if (eff === "ko") {
        const noKoE = byDmg ? null : (has(loseU, "noKoEffect", winU) || state.units.some((s) => s !== loseU && s.owner === loseU.owner && s.location === "board" && abilityAdjacent(s, loseU) && (abilityEfOf(s) || []).some((e) => e.k === "noKoEffect" && e.scope === "selfAdj" && abilityCondOk(e.c, s, null))));
        const fairy = abilityTypesMatch(loseU, ["Fairy"]) && !abHasStatus(loseU) && state.units.some((s) => s.owner === loseU.owner && s.location === "board" && has(s, "fairyGuard", null)) &&
          ((byDmg && abilityTypesMatch(winU, ["Dragon"])) || (!byDmg && abilityTypesMatch(winU, ["Dark"])));
        const noKoDmg = has(loseU, "noKo", winU);
        if (noKoE || fairy || (noKoDmg && noKoDmg.c && noKoDmg.c.oppDmgMin)) { out.winner = "none"; tag(`${loseU.name} não foi nocauteado (Habilidade).`); return out; }
        if (byDmg && winC.color === "white" && has(loseU, "reflectKoWhite", winU)) {
          out.winner = out.winner === "atk" ? "def" : "atk"; out.effect = "ko"; tag(`${loseU.name}: Double-Edged Axe! ${winU.name} é quem cai.`); return out;
        }
        if ((has(loseU, "voltAbsorb", null) && loseU._voltMarker) || loseU._shieldMarker) {
          out.winner = "none"; loseU._voltMarker = false; loseU._shieldMarker = false;
          pend(() => { loseU.condition = PokemonCondition.Normal; });
          tag(`${loseU.name} usou o marcador e não foi nocauteado.`); return out;
        }
        const ke = has(loseU, "koEvolve", winU);
        if (ke) {
          out.effect = "none"; tag(`${loseU.name} evolui em vez de ir ao P.C.!`);
          pend(() => {
            if (typeof applyUnitEvolutionNow === "function") { const tg = loseU.deckTargetName; loseU.deckTargetName = null; loseU._justEvolvedTurn = -1; try { applyUnitEvolutionNow(loseU); } finally { if (tg && tg !== loseU.name) loseU.deckTargetName = tg; } }
            if (ke.revive) { const pcU = state.units.find((x) => x.owner === loseU.owner && x.location === "pc"); if (pcU) { pcU.location = "bench"; pcU.waitTurns = 0; } }
          });
          return out;
        }
        if (byDmg && has(loseU, "koToEntry", winU)) {
          out.effect = "none"; tag(`${loseU.name}: Space Slide!`);
          pend(() => {
            const role = loseU.owner === "p1" ? "entry_p1" : "entry_p2";
            const n = BOARD_NODES.find((x) => x.role === role && !unitAtNode(x.id));
            if (n) { loseU.nodeId = n.id; loseU.condition = PokemonCondition.Normal; loseU.waitTurns = Math.max(loseU.waitTurns || 0, 2); } else sendToPC(loseU);
          });
          return out;
        }
        if (has(loseU, "koExile", winU)) { out.effect = "banish"; tag(`${loseU.name} é excluído do duelo.`); }
        if (has(loseU, "koRevivePC", null)) pend(() => { state.units.forEach((x) => { if (x !== loseU && x.owner === loseU.owner && x.location === "pc") { x.location = "bench"; x.waitTurns = 0; } }); setLogText(`🔥 ${loseU.name}: Serene Light trouxe o P.C. de volta ao banco!`); });
        // Regenerator: outro Pokémon nocauteado → este sai do P.C.
        pend(() => { state.units.forEach((x) => { if (x !== loseU && x.owner === loseU.owner && x.location === "pc" && has(x, "regenerator", null)) { x.location = "bench"; x.waitTurns = 0; setLogText(`♻️ ${x.name}: Regenerator voltou ao banco!`); } }); });
      }
      // condição aplicada
      const st = abStatusFromEffect(out.effect || "ko");
      if (st) {
        if (winC.color === "white" && has(loseU, "whiteStatusImmune", winU)) { out.effect = "none"; tag("Slime Barrier anulou a condição."); }
        else {
          if (has(loseU, "synchronize", winU)) pend(() => { if (winU.location === "board" && !abilityImmuneTo(winU, st)) winU.condition = PokemonCondition[ABIL_STATUS_TO_COND[st]]; });
          const ei = has(winU, "evolveOnInflict", loseU);
          if (ei && (ei.st || []).includes(st)) pend(() => { if (winU.location === "board" && typeof evolveUnitInMatch === "function") evolveUnitInMatch(winU); });
        }
      }
      if (has(winU, "evolveSurvive", null)) pend(() => { if (winU.location === "board" && typeof evolveUnitInMatch === "function") evolveUnitInMatch(winU); });
    } finally { state.__abCtx = null; }
    return out;
  };
}

// --------------------------------------------------------------------------- Movimento
function abJumpAllowed(mover, occ) {
  if (!occ) return true;
  // a peça pulada permite (Cornerstone, Water Weed, Electric Mat...)
  const oef = abilityEfOf(occ) || [];
  if (oef.some((e) => e.k === "allowPass" && abilityCondOk(e.c, occ, null) && (e.side === "all" || (e.side === "own" && occ.owner === mover.owner)) && (!e.types || abilityTypesMatch(mover, e.types)))) return true;
  const mef = abilityEfOf(mover) || [];
  for (const e of mef) {
    if (e.k !== "passSel" || !abilityCondOk(e.c, mover, null)) continue;
    if (e.own && occ.owner === mover.owner) return true;
    if (e.any || occ.owner !== mover.owner) {
      let ok = true, any = false;
      if (e.types && e.types.length) { any = true; ok = abilityTypesMatch(occ, e.types); }
      if (e.st && e.st.length) { const s = abStMatch(occ, e.st); ok = any ? (ok || s) : s; any = true; }
      if (e.wait) { const w = (occ.waitTurns || 0) > 0; ok = any ? (ok || w) : w; any = true; }
      if (e.names && e.names.length) { const nm = abNameMatch(occ, e.names); ok = any ? (ok || nm) : nm; any = true; }
      if (any && ok && (e.any || occ.owner !== mover.owner)) return true;
    }
  }
  // Sprinkler: aliados Water passam por Water
  if (abilityTypesMatch(mover, ["Water"]) && abilityTypesMatch(occ, ["Water"]) && state.units.some((s) => s.owner === mover.owner && s.location === "board" && (abilityEfOf(s) || []).some((e) => e.k === "allyPassTypes" && abilityCondOk(e.c, s, null)))) return true;
  return false;
}
function abBlocksPass(mover, occ) {
  if (!occ || occ.owner === mover.owner) return false;
  const ef = abilityEfOf(occ) || [];
  for (const e of ef) {
    if (e.k !== "noPassOver" || !abilityCondOk(e.c, occ, null)) continue;
    if (e.byTypes && !abilityTypesMatch(mover, e.byTypes)) continue;
    if (e.protectTypes) continue; // Darkness Shield protege outras peças (tratado abaixo)
    return true;
  }
  // Darkness Shield / Invisible Wall (corrente de aliados)
  return state.units.some((s) => s.owner === occ.owner && s.location === "board" && (abilityEfOf(s) || []).some((e) => e.k === "noPassOver" && abilityCondOk(e.c, s, null) &&
    ((e.protectTypes && abilityTypesMatch(occ, e.protectTypes) && (!e.byTypes || abilityTypesMatch(mover, e.byTypes))) || (e.chain && abilityAdjacent(s, occ)))));
}
if (typeof computeReachableWithPaths === "function") {
  const _v708Reach = computeReachableWithPaths;
  computeReachableWithPaths = function (unit) {
    const base = _v708Reach(unit);
    const fig = unit && FIGURES_DB[unit.baseIdx];
    if (!base || !fig) return base;
    // 1) libera pulos permitidos (passSel ampliado, allowPass, Sprinkler)
    let res = base;
    const needs = state.units.some((o) => o !== unit && o.location === "board" && abJumpAllowed(unit, o));
    if (needs && !fig.canPassThrough) {
      let wide;
      fig.canPassThrough = true;
      try { wide = _v708Reach(unit); } finally { fig.canPassThrough = false; }
      if (wide && wide.paths) {
        const nodes = new Set(base.nodes || []); const paths = Object.assign({}, base.paths || {});
        (wide.nodes || []).forEach((n) => {
          if (nodes.has(n)) return;
          const p = wide.paths[n] || [];
          if (p.every((seg) => seg.type !== "jump" || abJumpAllowed(unit, unitAtNode(seg.jumpedNode)))) { nodes.add(n); paths[n] = p; }
        });
        res = Object.assign({}, base, { nodes: [...nodes], paths });
      }
    }
    // 2) peças do oponente que não deixam passar por cima
    if (res && res.paths && state.units.some((o) => o.owner !== unit.owner && o.location === "board" && (abilityEfOf(o) || []).some((e) => e.k === "noPassOver") || state.units.some((s) => (abilityEfOf(s) || []).some((e) => e.k === "noPassOver" && (e.protectTypes || e.chain))))) {
      const ok = (res.nodes || []).filter((n) => (res.paths[n] || []).every((seg) => seg.type !== "jump" || !abBlocksPass(unit, unitAtNode(seg.jumpedNode))));
      const paths = {}; ok.forEach((n) => { paths[n] = res.paths[n]; });
      res = Object.assign({}, res, { nodes: ok, paths });
    }
    return res;
  };
}
// Depois de mover: entrar em campo (limpar condições/Espera), pulos com efeito (Night Stalker, Electric Web/Mat), Truant
if (typeof executeMove === "function") {
  const _v708Move = executeMove;
  executeMove = function (uid, targetNodeId) {
    const u = state.units && state.units.find((x) => x.uid === uid);
    const fromBench = !!(u && u.location === "bench");
    const path = (state.reachablePaths && state.reachablePaths[targetNodeId]) || [];
    const r = _v708Move.apply(this, arguments);
    if (!u) return r;
    u._movedTurn = state.turnCounter;
    try {
      const ef = abilityEfOf(u) || [];
      if (fromBench) {
        ef.forEach((e) => {
          if (e.k === "onEnterCleanse") state.units.forEach((x) => { if (x.owner === u.owner && (e.scope === "all" || x.location === "board") && (!e.st || abStMatch(x, e.st))) x.condition = PokemonCondition.Normal; });
          if (e.k === "onEnterClearWait") state.units.forEach((x) => { if (x.owner === u.owner && x.location === "board") x.waitTurns = 0; });
          if (e.k === "markerShield") u._shieldMarker = true;
        });
      }
      path.forEach((seg) => {
        if (seg.type !== "jump") return;
        const o = unitAtNode(seg.jumpedNode); if (!o || o.owner === u.owner) return;
        const pk = ef.find((e) => e.k === "passKill");
        if (pk && abStMatch(o, pk.st)) { setLogText(`🌙 ${u.name}: ${o.name} desmaiou ao ser atravessado!`); sendToPC(o); }
        const oef = abilityEfOf(o) || [];
        if (oef.some((e) => e.k === "flyOverParalyze" || (e.k === "allowPass" && e.paralyzeOpp))) { if (!abilityImmuneTo(u, "paralyze")) u.condition = PokemonCondition.Paralyze; setLogText(`⚡ ${u.name} ficou paralisado ao passar por ${o.name}!`); }
      });
    } catch (e) {}
    return r;
  };
}
// Volt Absorb: ao ficar paralisado ganha o marcador
setInterval(() => {
  try { state.units.forEach((u) => { if (u.condition === PokemonCondition.Paralyze && !u._voltGot && (abilityEfOf(u) || []).some((e) => e.k === "voltAbsorb")) { u._voltGot = true; u._voltMarker = true; } }); } catch (e) {}
}, 500);

// Ataque proibido (Bide) / depois de mover (Truant)
function abCannotAttack(u) {
  const ef = abilityEfOf(u) || [];
  if (ef.some((e) => e.k === "noAttack")) return true;
  if (ef.some((e) => e.k === "noAttackAfterMove") && u._movedTurn === state.turnCounter) return true;
  return false;
}
if (typeof selectUnit === "function") {
  const _v708Sel = selectUnit;
  selectUnit = function (uid) {
    const r = _v708Sel.apply(this, arguments);
    const u = state.units && state.units.find((x) => x.uid === uid);
    if (u && state.selectedUnitId === uid && abCannotAttack(u)) state.attackTargets = [];
    return r;
  };
}
if (typeof triggerCombat === "function") {
  const _v708Trig = triggerCombat;
  triggerCombat = function (atk, def, broadcast, forced) {
    if (atk && def && !forced && abCannotAttack(atk)) {
      setLogText(`🚫 ${atk.name} não pode atacar (Habilidade).`);
      if (typeof endTurn === "function") endTurn(true);
      return;
    }
    // Fugir do ataque (Run Away / Sand Veil / Emergency Exit) — automático fora do P2P quando a batalha parece ruim
    if (atk && def && !forced && state.mode !== "p2p" && abShouldFlee(atk, def)) {
      const ef = abilityEfOf(def) || [];
      const fl = ef.find((e) => e.k === "fleeToBench" || e.k === "dodgeUnder" || e.k === "fleeSwap");
      if (fl && abFlee(def, atk, fl.k)) { if (typeof endTurn === "function") endTurn(true); return; }
    }
    return _v708Trig.apply(this, arguments);
  };
  window.triggerCombat = triggerCombat;
}
function abBest(u) {
  try { const w = getActiveWheel(u) || []; let best = 0; w.forEach((s) => { const v = s.color === "purple" ? 120 + (s.stars || 1) * 20 : (s.color === "gold" ? (s.dmg || 0) + 40 : (s.dmg || 0)); best = Math.max(best, v * (s.size || 0) / 96); }); return best; } catch (e) { return 0; }
}
function abShouldFlee(atk, def) {
  const ef = abilityEfOf(def) || [];
  if (!ef.some((e) => e.k === "fleeToBench" || e.k === "dodgeUnder" || e.k === "fleeSwap")) return false;
  return abBest(atk) > abBest(def) * 1.15;
}
function abFlee(def, atk, kind) {
  if (kind === "fleeToBench") {
    const used = state.units.filter((u) => u.owner === def.owner && u.location === "bench").map((u) => u.benchSlot);
    let s = 0; while (used.includes(s)) s++;
    def.location = "bench"; def.nodeId = null; def.benchSlot = s; def.waitTurns = 2;
    setLogText(`💨 ${def.name} fugiu para o banco (Run Away)!`); return true;
  }
  if (kind === "dodgeUnder") {
    const free = (ADJ[atk.nodeId] || []).find((n) => !unitAtNode(n) && n !== def.nodeId);
    if (free == null) return false;
    def.nodeId = free; setLogText(`🌀 ${def.name} escapou por baixo de ${atk.name} (sem batalha)!`); return true;
  }
  if (kind === "fleeSwap") {
    const b = state.units.find((u) => u.owner === def.owner && u.location === "bench" && !/Wimpod|Golisopod/.test(u.name));
    if (!b) return false;
    const nid = def.nodeId, slot = b.benchSlot;
    b.location = "board"; b.nodeId = nid; b.waitTurns = 2;
    def.location = "bench"; def.nodeId = null; def.benchSlot = slot; def.waitTurns = 2;
    setLogText(`🔁 ${def.name} trocou de lugar com ${b.name} (Emergency Exit)!`); return true;
  }
  return false;
}

// Plates do oponente bloqueadas (Hypnotic Voice, Big Chorus)
if (typeof confirmUseSelectedPlate === "function") {
  const _v708Plate = confirmUseSelectedPlate;
  confirmUseSelectedPlate = function () {
    const blocker = state.units.find((u) => u.owner !== state.turn && u.location === "board" && abilityHas(u, "blockOppPlates", null));
    if (blocker) { setLogText(`🔇 ${blocker.name} impede o uso de Plates!`); try { playSfx("hit"); } catch (e) {} return; }
    return _v708Plate.apply(this, arguments);
  };
  window.confirmUseSelectedPlate = confirmUseSelectedPlate;
}

// Cerco: Gaseous Form / Black Core não são cercados; Gaseous Form não cerca
if (typeof checkSurroundKOs === "function") {
  const _v708Surr = checkSurroundKOs;
  checkSurroundKOs = function () {
    const hidden = [];
    // esconde temporariamente quem não pode ser cercado / quem não cerca
    state.units.forEach((u) => {
      if (u.location !== "board") return;
      const ef = abilityEfOf(u) || [];
      if (ef.some((e) => e.k === "surroundImmune")) { hidden.push([u, "imm"]); }
    });
    if (!hidden.length && !state.units.some((u) => u.location === "board" && (abilityEfOf(u) || []).some((e) => e.k === "noSurround"))) return _v708Surr.apply(this, arguments);
    const before = new Map(state.units.map((u) => [u, u.location]));
    const imm = new Set(hidden.map((h) => h[0]));
    // roda a regra normal e desfaz os nocautes inválidos
    const snap = state.units.map((u) => ({ u, loc: u.location, node: u.nodeId, cond: u.condition, wait: u.waitTurns }));
    const qa = state.reviverQueueP1.slice(), qb = state.reviverQueueP2.slice();
    _v708Surr.apply(this, arguments);
    let undo = false;
    snap.forEach((s) => {
      if (s.loc === "board" && s.u.location === "pc") {
        const surroundedBy = (ADJ[s.node] || []).map((n) => snap.find((x) => x.loc === "board" && x.node === n)).filter(Boolean).map((x) => x.u);
        const invalid = imm.has(s.u) || surroundedBy.some((o) => (abilityEfOf(o) || []).some((e) => e.k === "noSurround"));
        if (invalid) undo = true;
      }
    });
    if (undo) {
      snap.forEach((s) => {
        const surroundedBy = (ADJ[s.node] || []).map((n) => snap.find((x) => x.loc === "board" && x.node === n)).filter(Boolean).map((x) => x.u);
        const invalid = imm.has(s.u) || surroundedBy.some((o) => (abilityEfOf(o) || []).some((e) => e.k === "noSurround"));
        if (s.loc === "board" && s.u.location !== "board" && invalid) { s.u.location = "board"; s.u.nodeId = s.node; s.u.condition = s.cond; s.u.waitTurns = s.wait;
          const q = s.u.owner === "p1" ? state.reviverQueueP1 : state.reviverQueueP2; const i = q.indexOf(s.u.uid); if (i >= 0) q.splice(i, 1);
          setLogText(`🛡️ ${s.u.name} não pode ser cercado (Habilidade)!`); }
      });
    }
    return;
  };
}

// Turnos: Bad Dreams, Shed Skin, voltar do P.C. evoluindo, Espera inicial
if (typeof endTurn === "function") {
  const _v708End = endTurn;
  endTurn = function () {
    const locs = new Map((state.units || []).map((u) => [u, u.location]));
    const r = _v708End.apply(this, arguments);
    try {
      state.units.forEach((u) => {
        const ef = abilityEfOf(u) || [];
        if (u.location === "board" && ef.some((e) => e.k === "badDreams")) {
          state.units.filter((o) => o.owner !== u.owner && abilityAdjacent(o, u) && abStatusOf(o) === "sleep").forEach((o) => { setLogText(`😈 ${u.name}: Bad Dreams nocauteou ${o.name}!`); sendToPC(o); });
        }
        // começo do turno do dono: Shed Skin limpa condições
        if (u.owner === state.turn && ef.some((e) => e.k === "selfCleanseStart") && abHasStatus(u)) { u.condition = PokemonCondition.Normal; setLogText(`🐍 ${u.name}: Shed Skin removeu as condições!`); }
        // voltou do P.C. para o banco → pode evoluir
        if (locs.get(u) === "pc" && u.location === "bench" && ef.some((e) => e.k === "evolveOnRevive") && typeof applyUnitEvolutionNow === "function") { u._justEvolvedTurn = -1; applyUnitEvolutionNow(u); }
      });
    } catch (e) {}
    return r;
  };
}
if (typeof demoFullMatchState === "function") {
  const _v708Demo = demoFullMatchState;
  demoFullMatchState = function () {
    const r = _v708Demo.apply(this, arguments);
    try { state.units.forEach((u) => { const e = (abilityEfOf(u) || []).find((x) => x.k === "startWait"); if (e && u.location === "bench") u.waitTurns = e.n; u._abNull = false; u._voltGot = false; u._voltMarker = false; u._shieldMarker = false; }); } catch (e) {}
    return r;
  };
}
