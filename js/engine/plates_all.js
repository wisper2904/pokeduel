// ============================================================================
// v715 · Todas as Plates do Pokémon Duel original (lista do Serebii, 152 plates)
//  - Marca as 41 que já existiam com ID oficial, cor e custo, e adiciona as 111 que faltavam.
//  - Ícones: fundo oficial da cor da plate (assets/plates/plate<cor>.png) + símbolo desenhado por cima.
//  - Efeitos por turno em state.__pa.turn[chave][uid] = turnCounter; efeitos do duelo em state.__pa.duel[dono].
//  - Marcas na peça: _paItem (+dano no campo), _paSph {esfera:true}, _paBlade, _paSticky, _paMetalCoat,
//    _paOverdrive, _paLongBarrel, _paMeteor, _paTherian, _paRet (plate que volta se a peça for nocauteada).
//  - P2P: pacote P2P_PLATE3 {plateId, uids, owner, ends}. Tudo determinístico (sem Math.random).
//  - Bot: ganha 2 plates que combinam com o deck dele e usa quando vale a pena.
// Carrega depois de slice_effects.js.
// ============================================================================
(function () {
  "use strict";
  if (typeof FIGURES_DB === "undefined" || typeof BASE_PLATE_CATALOG === "undefined") return;
  const tt = (k, fb) => (typeof t === "function" ? t(k, fb) : fb);
  const log = (s) => { try { setLogText(s); } catch (e) {} };
  const snd = (k) => { try { if (window.PDRSound) PDRSound.play(k); else playSfx("portal"); } catch (e) {} };
  const at = (n) => unitAtNode(n);
  const onB = (u) => !!(u && u.location === "board");
  const opp = (o) => (o === "p1" ? "p2" : "p1");
  const TC = () => state.turnCounter || 0;
  const isT = (u, ts) => !!u && abilityTypesMatch(u, ts);
  const stOf = (u) => (typeof abStatusOf === "function" ? abStatusOf(u) : null);
  const hasSt = (u) => !!stOf(u);
  const dist = (a, b) => (NODE_BFS_DIST[a] && NODE_BFS_DIST[a][b] != null ? NODE_BFS_DIST[a][b] : 99);
  const adjU = (u) => (onB(u) ? (ADJ[u.nodeId] || []).map(at).filter(Boolean) : []);
  const fx = (u, col) => { try { if (onB(u)) { const p = getNodePos(u.nodeId); spawnPortalParticles(p.x, p.y, col); } } catch (e) {} };
  const nm = (c) => String((c && c.name) || "").replace(/\*$/, "").replace(/ ➔ .*$/, "");
  const baseName = (u) => String((u && u.name) || "").replace(/\s*\(N.\d+\)$/, "").replace(/^Shiny /, "");
  const figIdx = (name) => FIGURES_DB.findIndex((f) => f.name === name);
  const rng = (seed) => { let s = (seed >>> 0) || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  const ENTRY = { p1: [7, 13], p2: [0, 6] };
  const Q = (o) => (o === "p1" ? state.reviverQueueP1 : state.reviverQueueP2) || [];
  const EXC = (o) => (o === "p1" ? state.excludedP1 : state.excludedP2) || [];
  const S = () => (state.__pa = state.__pa || { turn: {}, duel: { p1: {}, p2: {} }, rotom: null, eon: {}, battle: null });
  const markT = (k, u) => { const s = S(); (s.turn[k] = s.turn[k] || {})[u.uid] = TC(); };
  const hasT = (k, u) => !!(u && S().turn[k] && S().turn[k][u.uid] === TC());
  const duelOn = (o, k) => !!S().duel[o][k];
  const RESTORED = ["Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Mega Aerodactyl", "Lileep", "Cradily", "Anorith", "Armaldo", "Cranidos", "Rampardos", "Shieldon", "Bastiodon", "Tirtouga", "Carracosta", "Archen", "Archeops", "Tyrunt", "Tyrantrum", "Amaura", "Aurorus"];
  const isRestored = (u) => RESTORED.includes(baseName(u));
  function stage(u) {
    if (typeof POKEMON_EVOLUTION_FAMILIES === "undefined") return 0;
    const n = baseName(u).toLowerCase();
    for (const f of POKEMON_EVOLUTION_FAMILIES) { const i = f.findIndex((x) => x.toLowerCase() === n); if (i >= 0) return i; }
    return /^Mega /.test(baseName(u)) ? 2 : 0;
  }
  function freeBench(o) {
    const used = state.units.filter((u) => u.owner === o && u.location === "bench").map((u) => u.benchSlot);
    let s = 0; while (used.includes(s)) s++; return s;
  }
  function toBench(u, wait) {
    const q = Q(u.owner), i = q.indexOf(u.uid); if (i >= 0) q.splice(i, 1);
    const e = EXC(u.owner), j = e.indexOf(u.uid); if (j >= 0) e.splice(j, 1);
    fx(u, "#14b8a6");
    u.benchSlot = freeBench(u.owner); u.location = "bench"; u.nodeId = null; u.waitTurns = wait || 0;
  }
  function exclude(u) {
    const q = Q(u.owner), i = q.indexOf(u.uid); if (i >= 0) q.splice(i, 1);
    if (typeof banishToUltraSpace === "function") banishToUltraSpace(u); else { u.location = "ultra_space"; u.nodeId = null; }
  }
  function heal(u, list) { if (u && (!list || list.includes(stOf(u)))) u.condition = PokemonCondition.Normal; }
  function setForm(u, idx, keep) {
    const f = FIGURES_DB[idx]; if (!f || !u) return false;
    if (keep && !u.__paPrev) u.__paPrev = { name: u.name, baseIdx: u.baseIdx, baseId: u.baseId, spriteKey: u.spriteKey, type: u.type, rarity: u.rarity, mp: u.mp };
    u.name = f.name; u.baseIdx = idx; u.baseId = f.id; u.spriteKey = f.spriteKey; u.type = f.type; u.rarity = f.rarity;
    if (f.mp) { u.mp = f.mp; if (!keep) u.baseMp = f.mp; }
    fx(u, "#f0abfc"); try { if (window.Juice) Juice.onEvolution(u, true); } catch (e) {}
    return true;
  }
  function restoreForm(u) {
    const p = u.__paPrev; if (!p) return;
    Object.assign(u, p); u.__paPrev = null; u._paFormEnd = null; fx(u, "#38bdf8");
    log(`⏳ ${u.name}: ${tt("pa.form_end", "a forma temporária acabou.")}`);
  }
  const hasMega = (o) => state.units.some((u) => u.owner === o && ((u.megaTurns || 0) > 0 || (u.megaPowerTurns || 0) > 0 || /^Mega /.test(baseName(u))));
  function realMega(u, idx) {
    const mf = FIGURES_DB[idx];
    u.preMegaName = u.name; u.preMegaBaseIdx = u.baseIdx; u.preMegaBaseId = u.baseId; u.preMegaSpriteKey = u.spriteKey;
    u.preMegaMp = u.mp; u.preMegaRarity = u.rarity; u.preMegaType = u.type; u.preMegaEvoStep = u.evoStep;
    u.name = mf.name; u.baseIdx = idx; u.baseId = mf.id; u.spriteKey = mf.spriteKey; u.type = mf.type; u.rarity = mf.rarity; u.mp = mf.mp || u.mp;
    u.megaTurns = 7; u.condition = PokemonCondition.Normal;
    try { if (window.Juice) Juice.onEvolution(u, true); } catch (e) {}
  }

  // ------------------------------------------------------------------ esferas (Frost Sphere anula perto dela)
  function sphereOn(owner, key, affected) {
    if (!state.units.some((h) => h.owner === owner && onB(h) && h._paSph && h._paSph[key])) return false;
    if (key !== "frost" && affected && onB(affected) && state.units.some((h) => h.owner !== owner && onB(h) && h._paSph && h._paSph.frost && dist(h.nodeId, affected.nodeId) <= 3)) return false;
    return true;
  }

  // ------------------------------------------------------------------ definições
  // tgt(u, owner): pode receber a plate? · cond(owner): pode usar agora? · apply(owner, units) → true = turno acaba
  const own = (fn) => (u, o) => !!u && u.owner === o && fn(u);
  const field = (fn) => own((u) => onB(u) && (!fn || fn(u)));
  const anyLoc = (fn) => own((u) => (onB(u) || u.location === "bench") && (!fn || fn(u)));
  const bench = (fn) => own((u) => u.location === "bench" && (!fn || fn(u)));
  const named = (...ns) => (u) => ns.includes(baseName(u));
  const typed = (...ts) => (u) => isT(u, ts);
  const D = {};
  function def(id, o) { D[id] = Object.assign({ id }, o); }

  // ---- simples
  def("brightpowder", { off: 2, color: "gold", rar: "EX", cost: 1, name: "Bright Powder", glyph: "✨", tgt: field(), sub: "Escolha um Pokémon seu no campo. Neste turno, se o oponente de batalha dele tirar um resultado melhor, ele gira de novo uma vez.",
    apply: (o, [u]) => { markT("bright", u); } });
  def("clearwait", { off: 8, color: "pink", rar: "R", cost: 2, name: "Clear Wait", glyph: "⏱", tgt: anyLoc(), sub: "Escolha um Pokémon seu no campo ou no banco. Ele perde a Espera e não pode receber Espera até o fim do seu próximo turno.",
    apply: (o, [u]) => { u.waitTurns = 0; u._paNoWait = TC() - 2; } });
  def("swapspot", { off: 14, color: "purple", rar: "UC", cost: 1, name: "Swap Spot", glyph: "⇄", tgt: field(), tgt2: true, sub: "Troca de lugar dois Pokémon seus que estão no campo.",
    apply: (o, [a, b]) => { if (a && b && onB(a) && onB(b)) { const n = a.nodeId; a.nodeId = b.nodeId; b.nodeId = n; fx(a, "#c084fc"); fx(b, "#c084fc"); } } });
  def("noguard", { off: 16, color: "blue", rar: "UC", cost: 1, name: "No Guard", glyph: "⛨", tgt: anyLoc(), sub: "Escolha um Pokémon seu no campo ou no banco. Neste turno, se ele tirar um ataque Azul, gira de novo uma vez.",
    apply: (o, [u]) => { markT("noguard", u); } });
  def("quickcare", { off: 17, color: "purple", rar: "UC", cost: 1, name: "Quick Care", glyph: "✚", tgt: field(), ends: true, cond: (o) => Q(o).length < 2, condMsg: "O P.C. está cheio.",
    sub: "Escolha um Pokémon seu no campo. Se houver espaço no seu P.C., ele vai para lá. Seu turno acaba.",
    apply: (o, [u]) => { if (Q(o).length < 2) sendToPC(u); } });
  def("priorityrec", { off: 18, color: "purple", rar: "C", cost: 1, name: "Priority Recovery", glyph: "⇅", tgt: null, ends: true, cond: (o) => Q(o).length >= 2, condMsg: "Precisa de 2 Pokémon no P.C.",
    sub: "Inverte a ordem dos seus Pokémon no P.C. Precisa de 2 Pokémon lá. Seu turno acaba.",
    apply: (o) => { Q(o).reverse(); } });
  def("ballast", { off: 19, color: "gold", rar: "C", cost: 1, name: "Ballast", glyph: "⚓", tgt: field(), sub: "Escolha um Pokémon seu no campo. Neste turno, ele não pode ser empurrado nem mandado ao banco por ataques (Whirlwind e parecidos).",
    apply: (o, [u]) => { markT("ballast", u); } });
  [["awakening", 20, "Awakening", ["sleep"], "Acorda um Pokémon seu no campo que está dormindo.", "♥"],
    ["paralyzheal", 21, "Paralyz Heal", ["paralyze"], "Remove a paralisia de um Pokémon seu no campo.", "♥"],
    ["confuseheal", 22, "Confuse Heal", ["panic"], "Remove a confusão de um Pokémon seu no campo.", "♥"],
    ["antidote", 23, "Antidote", ["poison", "badpoison"], "Remove o veneno (normal ou grave) de um Pokémon seu no campo.", "♥"],
    ["iceheal", 80, "Ice Heal", ["freeze"], "Descongela um Pokémon seu no campo.", "♥"],
    ["burnheal", 90, "Burn Heal", ["burn"], "Remove a queimadura de um Pokémon seu no campo.", "♥"]].forEach(([id, off, name, sts, sub, g]) =>
    def(id, { off, color: off >= 80 ? "red" : "pink", rar: "C", cost: 1, name, glyph: g, heal: sts, tgt: field((u) => sts.includes(stOf(u))), sub,
      apply: (o, [u]) => { heal(u, sts); snd("cured"); } }));
  def("invcape", { off: 39, color: "purple", rar: "EX", cost: 3, name: "Invisibility Cape", glyph: "👻", tgt: bench(), sub: "Escolha um Pokémon seu no banco. Neste turno, ele pode passar por cima de outros Pokémon no movimento.",
    apply: (o, [u]) => { markT("cape", u); } });
  def("powerbattle", { off: 40, color: "blue", rar: "UC", cost: 2, name: "Power Battle", glyph: "⚔", tgt: anyLoc(), sub: "Escolha um Pokémon seu no campo ou no banco. Neste turno, se ele ou o oponente tirar um ataque Roxo na batalha, os dois giram de novo uma vez.",
    apply: (o, [u]) => { markT("pbattle", u); } });
  def("switcheroo", { off: 53, color: "purple", rar: "R", cost: 1, name: "Switcheroo", glyph: "⇆", tgt: bench(), ends: true, cond: (o) => Q(o).length >= 1, condMsg: "Seu P.C. está vazio.",
    sub: "Escolha um Pokémon seu no banco e troque-o com o primeiro Pokémon do seu P.C. Seu turno acaba.",
    apply: (o, [u]) => {
      const q = Q(o); const pcU = state.units.find((x) => x.uid === q[0]); if (!pcU) return;
      const slot = u.benchSlot; q[0] = u.uid;
      u.location = "pc"; u.nodeId = null; u.waitTurns = 0; u.condition = PokemonCondition.Normal;
      pcU.location = "bench"; pcU.benchSlot = slot; pcU.waitTurns = 0;
    } });
  def("forceremove", { off: 303, color: "gold", rar: "EX", cost: 1, name: "Force Remove", glyph: "⊘", tgt: anyLoc(),
    cond: (o) => ENTRY[opp(o)].every((n) => { const x = at(n); return x && x.owner === o; }), condMsg: "Precisa ter Pokémon seus em todos os Pontos de Entrada do oponente.",
    sub: "Só pode ser usada com Pokémon seus em todos os Pontos de Entrada do oponente. Neste turno, quem o Pokémon escolhido nocautear em batalha é excluído do duelo.",
    apply: (o, [u]) => { markT("force", u); } });
  def("counterattack", { off: 304, color: "purple", rar: "EX", cost: 1, name: "Counter Attack", glyph: "↻", tgt: field(),
    cond: (o) => ENTRY[o].every((n) => { const x = at(n); return x && x.owner !== o; }), condMsg: "Precisa ter Pokémon do oponente em todos os seus Pontos de Entrada.",
    sub: "Só pode ser usada com Pokémon do oponente em todos os seus Pontos de Entrada. Neste turno, o Pokémon escolhido tem MP +1.",
    apply: (o, [u]) => { markT("counter", u); } });

  // ---- Genesect
  const DRIVEX = { burndrivex: [316, "Burn Drive EX", ["Grass", "Ice", "Bug", "Steel"]], dousedrivex: [317, "Douse Drive EX", ["Fire", "Ground", "Rock"]],
    chilldrivex: [318, "Chill Drive EX", ["Grass", "Ground", "Flying", "Dragon"]], shockdrivex: [319, "Shock Drive EX", ["Water", "Flying"]] };
  const TYPE_PT = { Fire: "Fogo", Water: "Água", Grass: "Planta", Electric: "Elétrico", Psychic: "Psíquico", Poison: "Venenoso", Dragon: "Dragão", Ground: "Terrestre", Ghost: "Fantasma", Steel: "Aço", Dark: "Sombrio",
    Ice: "Gelo", Bug: "Inseto", Rock: "Pedra", Flying: "Voador", Fairy: "Fada", Fighting: "Lutador", Normal: "Normal" };
  const tpt = (a) => a.map((x) => TYPE_PT[x] || x).join("/");
  Object.keys(DRIVEX).forEach((id) => { const [off, name, types] = DRIVEX[id]; def(id, { off, color: "gold", rar: "R", cost: 1, name, glyph: "⚙", tgt: anyLoc((u) => /^Genesect/.test(baseName(u))),
    sub: `Escolha seu Genesect no campo ou no banco. Neste turno, ele pode girar de novo uma vez na batalha; se nocautear um Pokémon ${tpt(types)}, esse Pokémon é excluído do duelo.`,
    apply: (o, [u]) => { (S().drivex = S().drivex || {})[u.uid] = { tc: TC(), types }; } }); });
  def("goldenmodule", { off: 372, color: "gold", rar: "EX", cost: 2, name: "Golden Module", glyph: "★", tgt: anyLoc((u) => /^Genesect/.test(baseName(u))),
    sub: "Escolha seu Genesect no campo ou no banco. Neste turno, o ataque Roxo dele vira o ataque Dourado Extreme Speed 100; se nocautear um Pokémon Sombrio ou Fada, esse Pokémon é excluído do duelo.",
    apply: (o, [u]) => { markT("golden", u); } });

  // ---- Energy (duelo inteiro)
  def("cosmoenergy", { off: 320, color: "gold", rar: "R", cost: 1, name: "Cosmo Energy", glyph: "⚡", energy: true, tgt: null, ends: true,
    sub: "Durante o duelo, quando seu Deoxys for atacado, antes da batalha ele troca de lugar com outro Deoxys seu (do campo ou do banco) que lute melhor. Seu turno acaba.",
    apply: (o) => { S().duel[o].cosmo = true; } });
  def("landsenergy", { off: 324, color: "gold", rar: "R", cost: 1, name: "Land's Energy", glyph: "⚡", energy: true, tgt: null, ends: true,
    sub: "Durante o duelo, quando o Land's Wrath do seu Zygarde vencer, gire por cada Pokémon do oponente no campo (menos Voadores): se cair num ataque Roxo, ele é nocauteado. Seu turno acaba.",
    apply: (o) => { S().duel[o].lands = true; } });
  def("mudenergy", { off: 339, color: "gold", rar: "R", cost: 1, name: "Mud Energy", glyph: "⚡", energy: true, tgt: null, ends: true,
    sub: "Durante o duelo, se você tiver 2+ Pokémon de Água e 2+ Terrestres no campo, os Pokémon do oponente no campo recebem +1 em toda Espera que ganharem. Seu turno acaba.",
    apply: (o) => { S().duel[o].mud = true; } });

  // ---- assinaturas
  def("overdrive", { off: 323, color: "red", rar: "R", cost: 1, name: "Overdrive", glyph: "☯", tgt: field(named("Reshiram", "Zekrom", "Black Kyurem", "White Kyurem")),
    sub: "Escolha seu Reshiram, Zekrom, Kyurem Negro ou Kyurem Branco no campo. Remove as condições especiais dele (menos Espera) e, enquanto estiver no campo, ele causa +30 de dano.",
    apply: (o, [u]) => { heal(u); u._paOverdrive = true; } });
  def("longbarrel", { off: 325, color: "gold", rar: "R", cost: 1, name: "Long Barrel", glyph: "➶", tgt: anyLoc(named("Rhyperior")), ends: true,
    sub: "Escolha seu Rhyperior no campo ou no banco. Até o fim do duelo, o Rock Wrecker dele alcança Pokémon a até 3 passos. Seu turno acaba.",
    apply: (o, [u]) => { u._paLongBarrel = true; } });
  def("fertilizer", { off: 328, color: "gold", rar: "UC", cost: 1, name: "Concentrated Fertilizer", glyph: "🌱", tgt: anyLoc(typed("Grass")),
    sub: "Escolha um Pokémon Planta seu no campo ou no banco. Neste turno, ele ganha ★+1 e +20 de dano.",
    apply: (o, [u]) => { markT("fert", u); } });
  def("stickygrass", { off: 329, color: "gold", rar: "UC", cost: 1, name: "Sticky Grass", glyph: "🌿", tgt: field(typed("Grass")),
    sub: "Escolha um Pokémon Planta seu no campo. Enquanto ele estiver no campo, o oponente de batalha dele não pode girar de novo.",
    apply: (o, [u]) => { u._paSticky = true; } });
  def("poisonblade", { off: 336, color: "gold", rar: "EX", cost: 1, name: "Poison Blade", glyph: "🗡", tgt: field(typed("Steel")),
    sub: "Escolha um Pokémon de Aço seu no campo. Enquanto ele estiver no campo, quando vencer com um ataque Branco, o oponente de batalha fica envenenado.",
    apply: (o, [u]) => { u._paBlade = true; } });
  def("eonflute", { off: 343, color: "gold", rar: "EX", cost: 2, name: "Eon Flute", glyph: "🎵", tgt: null,
    cond: (o) => state.units.some((u) => u.owner === o && u.location === "ultra_space" && /^(Mega )?Lati(as|os)$/.test(baseName(u))), condMsg: "Seu Latias ou Latios precisa estar excluído do duelo.",
    sub: "Só pode ser usada se seu Latias ou Latios foi excluído do duelo. Ele volta para o banco e é excluído de novo quando seu próximo turno acabar.",
    apply: (o) => {
      const u = state.units.find((x) => x.owner === o && x.location === "ultra_space" && /^(Mega )?Lati(as|os)$/.test(baseName(x))); if (!u) return;
      toBench(u, 0); S().eon[u.uid] = TC() - 3;
    } });
  def("metalcoat", { off: 371, color: "gold", rar: "EX", cost: 1, name: "Metal Coat", glyph: "⛓", ends: true, tgt: field((u) => named("Onix", "Scyther")(u) || isT(u, ["Steel"])),
    sub: "Escolha seu Onix, Scyther ou um Pokémon de Aço no campo. Onix e Scyther evoluem (Steelix/Scizor). Até o fim do duelo, as Habilidades que mudam dano dos oponentes de batalha dele ficam anuladas. Seu turno acaba.",
    apply: (o, [u]) => {
      const to = { Onix: "Steelix", Scyther: "Scizor" }[baseName(u)];
      if (to) { const i = figIdx(to); if (i >= 0) setForm(u, i, false); }
      u._paMetalCoat = true;
    } });
  def("dnasplicers", { off: 390, color: "gold", rar: "EX", cost: 1, name: "DNA Splicers", glyph: "🧬", tgt: field(named("Kyurem")),
    cond: (o) => state.units.some((u) => u.owner === o && ["board", "bench", "pc"].includes(u.location) && named("Zekrom", "Reshiram")(u)), condMsg: "Precisa de um Zekrom ou Reshiram seu no campo, banco ou P.C.",
    sub: "Escolha seu Kyurem no campo. Um Zekrom ou Reshiram seu (campo, banco ou P.C.) é excluído do duelo e o Kyurem vira Kyurem Negro ou Kyurem Branco.",
    apply: (o, [u]) => {
      const mates = state.units.filter((x) => x.owner === o && ["board", "bench", "pc"].includes(x.location) && named("Zekrom", "Reshiram")(x));
      const m = mates.find((x) => baseName(x) === "Zekrom") || mates[0]; if (!m) return;
      exclude(m); const i = figIdx(baseName(m) === "Zekrom" ? "Black Kyurem" : "White Kyurem"); if (i >= 0) setForm(u, i, false);
    } });
  const ROTOM = { microwave: [393, "Microwave Oven", "Heat Rotom", "Fire", ["burn"], "Remove a queimadura de todos", "🔥"], washer: [394, "Washing Machine", "Wash Rotom", "Water", ["poison", "badpoison"], "Remove o veneno de todos", "💧"],
    fridge: [395, "Refrigerator", "Frost Rotom", "Ice", ["burn"], "Remove a queimadura de todos", "❄"], efan: [396, "Electric Fan", "Fan Rotom", "Flying", "wait", "Remove a Espera de todos", "🌀"],
    lawnmower: [397, "Lawnmower", "Mow Rotom", "Grass", ["sleep"], "Acorda todos", "🌿"] };
  const ROTOMS = ["Rotom", "Heat Rotom", "Wash Rotom", "Frost Rotom", "Fan Rotom", "Mow Rotom"];
  Object.keys(ROTOM).forEach((id) => { const [off, name, form, type, cure, txt, g] = ROTOM[id];
    def(id, { off, color: "gold", rar: "EX", cost: 1, name, glyph: g, tgt: field((u) => ROTOMS.includes(baseName(u)) && baseName(u) !== form),
      sub: `Escolha seu Rotom (qualquer forma) no campo: ele vira ${form}. ${txt} os Pokémon e, por 9 turnos, todos os Pokémon passam a ser do tipo ${TYPE_PT[type]}.`,
      apply: (o, [u]) => {
        const i = figIdx(form); if (i >= 0) setForm(u, i, false);
        state.units.forEach((x) => { if (cure === "wait") x.waitTurns = 0; else heal(x, cure); });
        S().rotom = { type, end: TC() - 9 };
      } }); });
  def("gracidea", { off: 400, color: "gold", rar: "EX", cost: 2, name: "Gracidea", glyph: "🌸", tgt: field(named("Shaymin (Land)", "Shaymin")),
    sub: "Escolha seu Shaymin no campo: ele vira a Forma Céu. Se um Shaymin seu for nocauteado, esta plate volta a poder ser usada.",
    apply: (o, [u]) => { const i = figIdx("Shaymin (Sky)"); if (i >= 0) setForm(u, i, false); u._paRet = "gracidea"; } });
  def("meteoric", { off: 406, color: "gold", rar: "EX", cost: 2, name: "Meteoric Teachings", glyph: "☄", tgt: field(named("Rayquaza")), cond: (o) => !hasMega(o), condMsg: "Você já tem um Pokémon Mega Evoluído.",
    sub: "Só sem nenhum Pokémon seu Mega Evoluído. Escolha seu Rayquaza no campo: ele Mega Evolui por 7 turnos e o Break Energy dele vira Dragon Ascent 90 até o fim do duelo. Se um Rayquaza seu for nocauteado, esta plate volta a poder ser usada.",
    apply: (o, [u]) => { const i = figIdx("Mega Rayquaza"); if (i >= 0) realMega(u, i); u._paMeteor = true; u._paRet = "meteoric"; } });
  def("blueorb", { off: 410, color: "gold", rar: "EX", cost: 2, name: "Blue Orb", glyph: "🔵", tgt: bench(named("Kyogre")), sub: "Escolha seu Kyogre no banco: ele faz a Reversão Primitiva (Primal Kyogre).",
    apply: (o, [u]) => { const i = figIdx("Primal Kyogre"); if (i >= 0) setForm(u, i, false); } });
  def("redorb", { off: 411, color: "gold", rar: "EX", cost: 2, name: "Red Orb", glyph: "🔴", tgt: bench(named("Groudon")), sub: "Escolha seu Groudon no banco: ele faz a Reversão Primitiva (Primal Groudon).",
    apply: (o, [u]) => { const i = figIdx("Primal Groudon"); if (i >= 0) setForm(u, i, false); } });
  def("souldew", { off: 419, color: "red", rar: "R", cost: 1, name: "Soul Dew", glyph: "💧", ends: true, tgt: field(named("Latias", "Latios", "Mega Latias", "Mega Latios")),
    sub: "Escolha seu Latias ou Latios no campo. Enquanto ele estiver no campo, causa +30 de dano. Seu turno acaba.",
    apply: (o, [u]) => { u._paItem = 30; } });
  def("necroizer", { off: 424, color: "gold", rar: "EX", cost: 1, name: "Necroizer", glyph: "🌑", tgt: field(named("Necrozma")),
    cond: (o) => state.units.some((u) => u.owner === o && ["board", "bench", "pc"].includes(u.location) && named("Solgaleo", "Lunala")(u)), condMsg: "Precisa de um Solgaleo ou Lunala seu no campo, banco ou P.C.",
    sub: "Escolha seu Necrozma no campo. Um Solgaleo ou Lunala seu (campo, banco ou P.C.) vai para a Ultra Space e o Necrozma vira Dusk Mane ou Dawn Wings Necrozma.",
    apply: (o, [u]) => {
      const mates = state.units.filter((x) => x.owner === o && ["board", "bench", "pc"].includes(x.location) && named("Solgaleo", "Lunala")(x));
      const m = mates[0]; if (!m) return;
      exclude(m); const i = figIdx(baseName(m) === "Solgaleo" ? "Dusk Mane Necrozma" : "Dawn Wings Necrozma"); if (i >= 0) setForm(u, i, false);
    } });
  def("ultraburst", { off: 435, color: "gold", rar: "EX", cost: 1, name: "Ultra Burst", glyph: "✴", tgt: field(named("Dusk Mane Necrozma", "Dawn Wings Necrozma")),
    sub: "Escolha seu Dusk Mane ou Dawn Wings Necrozma no campo: ele vira Ultra Necrozma por 4 turnos.",
    apply: (o, [u]) => { const i = figIdx("Ultra Necrozma"); if (i >= 0 && setForm(u, i, true)) u._paFormEnd = TC() - 4; } });
  def("restorer", { off: 440, color: "pink", rar: "R", cost: 1, name: "Restorer", glyph: "🦴", tgt: null,
    cond: (o) => state.units.some((u) => u.owner === o && ["pc", "ultra_space"].includes(u.location) && isRestored(u)), condMsg: "Nenhum Pokémon Restaurado seu no P.C. ou excluído.",
    sub: "Um Pokémon Restaurado (fóssil) do seu P.C. vai para o banco sem Espera, e um Pokémon Restaurado seu excluído do duelo vai para o seu P.C.",
    apply: (o) => {
      const pcU = state.units.find((u) => u.owner === o && u.location === "pc" && isRestored(u));
      if (pcU) toBench(pcU, 0);
      const ex = state.units.find((u) => u.owner === o && u.location === "ultra_space" && isRestored(u));
      if (ex) { const e = EXC(o), j = e.indexOf(ex.uid); if (j >= 0) e.splice(j, 1); sendToPC(ex); }
    } });
  def("revealglass", { off: 447, color: "green", rar: "EX", cost: 1, name: "Reveal Glass", glyph: "🔮", tgt: null, ends: true,
    cond: () => state.units.some((u) => onB(u) && named("Tornadus", "Thundurus", "Landorus")(u)), condMsg: "Nenhum Tornadus, Thundurus ou Landorus no campo.",
    sub: "Muda a forma de cada Tornadus, Thundurus e Landorus no campo (Forma Therian: +20 de dano; usar de novo volta à forma normal). Pode ser usada de novo quando o oponente usar outra plate. Seu turno acaba.",
    apply: () => { state.units.forEach((u) => { if (onB(u) && named("Tornadus", "Thundurus", "Landorus")(u)) { u._paTherian = !u._paTherian; fx(u, "#4ade80"); } }); } });

  // ---- itens de tipo (+20 enquanto estiver no campo; turno acaba)
  [["magnet", 388, "Magnet", "Electric", "🧲"], ["sharpbeak", 389, "Sharp Beak", "Flying", "🪶"], ["miracleseed", 391, "Miracle Seed", "Grass", "🌱"], ["nevermeltice", 392, "Never-Melt Ice", "Ice", "❄"],
    ["hardstone", 402, "Hard Stone", "Rock", "🪨"], ["charcoal", 405, "Charcoal", "Fire", "🔥"], ["dragonfang", 408, "Dragon Fang", "Dragon", "🐉"], ["mysticwater", 412, "Mystic Water", "Water", "💧"],
    ["poisonbarb", 421, "Poison Barb", "Poison", "☠"], ["spelltag", 425, "Spell Tag", "Ghost", "👻"], ["oddincense", 426, "Odd Incense", "Psychic", "🔮"], ["blackglasses", 430, "Black Glasses", "Dark", "🕶"],
    ["silverpowder", 451, "Silver Powder", "Bug", "🐛"], ["silkscarf", 452, "Silk Scarf", "Normal", "🧣"], ["karatebelt", 453, "Karate Belt", "Fighting", "🥋"], ["softsand", 454, "Soft Sand", "Ground", "⏳"]]
    .forEach(([id, off, name, type, g]) => def(id, { off, color: "red", rar: "UC", cost: 1, name, glyph: g, item: type, ends: true, tgt: field(typed(type)),
      sub: `Escolha um Pokémon ${TYPE_PT[type]} seu no campo. Enquanto ele estiver no campo, causa +20 de dano. Seu turno acaba.`,
      apply: (o, [u]) => { u._paItem = 20; } }));

  // ---- Mega Stones (7 turnos)
  [["salamencite", 344, "Salamencite", "Salamence", "Mega Salamence"], ["charizarditex", 345, "Charizardite X", "Charizard", "Mega Charizard X"], ["charizarditey", 346, "Charizardite Y", "Charizard", "Mega Charizard Y"],
    ["beedrillite", 347, "Beedrillite", "Beedrill", "Mega Beedrill"], ["venusaurite", 365, "Venusaurite", "Venusaur", "Mega Venusaur"], ["blastoisinite", 366, "Blastoisinite", "Blastoise", "Mega Blastoise"],
    ["gengarite", 367, "Gengarite", "Gengar", "Mega Gengar"], ["sceptilite", 368, "Sceptilite", "Sceptile", "Mega Sceptile"], ["blazikenite", 369, "Blazikenite", "Blaziken", "Mega Blaziken"],
    ["swampertite", 370, "Swampertite", "Swampert", "Mega Swampert"], ["scizorite", 373, "Scizorite", "Scizor", "Mega Scizor"], ["mewtwonitex", 378, "Mewtwonite X", "Mewtwo", "Mega Mewtwo X"],
    ["galladite", 380, "Galladite", "Gallade", "Mega Gallade"], ["sablenite", 382, "Sablenite", "Sableye", "Mega Sableye"], ["mewtwonitey", 383, "Mewtwonite Y", "Mewtwo", "Mega Mewtwo Y"],
    ["altarianite", 386, "Altarianite", "Altaria", "Mega Altaria"], ["ampharosite", 387, "Ampharosite", "Ampharos", "Mega Ampharos"], ["tyranitarite", 398, "Tyranitarite", "Tyranitar", "Mega Tyranitar"],
    ["aggronite", 399, "Aggronite", "Aggron", "Mega Aggron"], ["lucarionite", 403, "Lucarionite", "Lucario", "Mega Lucario"], ["houndoominite", 404, "Houndoominite", "Houndoom", "Mega Houndoom"],
    ["glalitite", 407, "Glalitite", "Glalie", "Mega Glalie"], ["gyaradosite", 414, "Gyaradosite", "Gyarados", "Mega Gyarados"], ["latiasite", 416, "Latiasite", "Latias", "Mega Latias"],
    ["gardevoirite", 417, "Gardevoirite", "Gardevoir", "Mega Gardevoir"], ["latiosite", 418, "Latiosite", "Latios", "Mega Latios"], ["alakazite", 431, "Alakazite", "Alakazam", "Mega Alakazam"],
    ["kangaskhanite", 432, "Kangaskhanite", "Kangaskhan", "Mega Kangaskhan"], ["mawilite", 436, "Mawilite", "Mawile", "Mega Mawile"], ["diancite", 437, "Diancite", "Diancie", "Mega Diancie"],
    ["metagrossite", 438, "Metagrossite", "Metagross", "Mega Metagross"], ["steelixite", 439, "Steelixite", "Steelix", "Mega Steelix"]]
    .forEach(([id, off, name, sp, form]) => {
      const has = figIdx(form) >= 0;
      def(id, { off, color: "gold", rar: "EX", cost: 0, name, glyph: "🧬", mega: sp, tgt: field(named(sp)), cond: (o) => !hasMega(o), condMsg: "Você já tem um Pokémon Mega Evoluído.",
        sub: has ? `Só sem nenhum Pokémon seu Mega Evoluído. Escolha seu ${sp} no campo: ele Mega Evolui para ${form} por 7 turnos.`
          : `Só sem nenhum Pokémon seu Mega Evoluído. Escolha seu ${sp} no campo: Poder Mega por 7 turnos (+30 de dano e ★+1), porque o jogo ainda não tem a figura ${form}.`,
        apply: (o, [u]) => { const i = figIdx(form); if (i >= 0) realMega(u, i); else u.megaPowerTurns = 7; } });
    });

  // ---- Spheres (duelo inteiro, enquanto o Pokémon escolhido estiver no campo; turno acaba)
  [["metalsphere", 374, "Metal Sphere", "metal", ["Steel"], "Seus Pokémon de Aço não ficam envenenados e os ataques Brancos deles de 10+ de dano causam +10."],
    ["phantomsphere", 375, "Phantom Sphere", "phantom", ["Ghost"], "Seus Pokémon Fantasma do banco podem passar por cima de Fantasmas e de Pokémon com condição especial."],
    ["flamesphere", 376, "Flame Sphere", "flame", ["Fire"], "Seus Pokémon de Fogo não ficam congelados nem queimados e passam por cima de Pokémon queimados."],
    ["electrosphere", 377, "Electro Sphere", "electro", ["Electric"], "Seus Pokémon Elétricos causam +10 de dano por Elétrico vizinho e passam por cima de Pokémon com Espera."],
    ["wingedsphere", 379, "Winged Sphere", "winged", ["Bug", "Flying"], "Seus Pokémon Inseto ou Voador de Estágio 1+ passam por cima de Pokémon do oponente que não são Voadores."],
    ["mysticsphere", 381, "Mystic Sphere", "mystic", ["Fairy"], "Seus Pokémon Fada não recebem marcadores dos ataques de outros Pokémon."],
    ["mightysphere", 384, "Mighty Sphere", "mighty", ["Fighting"], "Pokémon do oponente sem casa livre ao redor e vizinhos de 2+ Lutadores seus vão para o P.C."],
    ["darksphere", 385, "Dark Sphere", "dark", ["Dark"], "Pokémon Fantasma e Psíquicos do oponente não passam por cima dos seus Pokémon Sombrios."],
    ["stonysphere", 401, "Stony Sphere", "stony", ["Rock"], "Pokémon Voadores e Fada do oponente não passam por cima dos seus Pokémon de Pedra."],
    ["dragonsphere", 409, "Dragon Sphere", "dragon", ["Dragon"], "Seus Dragões com MP 1 ou menos ganham +1 MP; sem condição especial, passam por cima de outros Pokémon."],
    ["aquasphere", 413, "Aqua Sphere", "aqua", ["Water"], "Seus Pokémon de Água vizinhos de outro Pokémon de Água ganham +1 MP (máx. 3)."],
    ["grasssphere", 415, "Grass Sphere", "grass", ["Grass"], "Seus Pokémon Planta não são mandados ao banco, ao P.C. ou à Ultra Space por efeitos de ataques Roxos do oponente."],
    ["venomsphere", 420, "Venom Sphere", "venom", ["Poison"], "As Habilidades que mudam dano dos Pokémon envenenados do oponente ficam anuladas."],
    ["primalsphere", 441, "Primal Sphere", "primal", null, "Se você tiver menos Pokémon (campo + banco + P.C.) que o oponente, seus Pokémon Restaurados causam +30 de dano e ganham +1 MP."],
    ["frostsphere", 442, "Frost Sphere", "frost", ["Ice"], "Plates Sphere do oponente (menos Frost Sphere) não funcionam nos Pokémon dele a até 3 passos deste Pokémon."],
    ["silksphere", 448, "Silk Sphere", "silk", ["Bug"], "As Habilidades dos Pokémon do oponente com marcador de MP ficam anuladas."]]
    .forEach(([id, off, name, key, types, txt]) => def(id, { off, color: "gold", rar: "R", cost: 1, name, glyph: "◉", sphere: key, ends: true,
      tgt: anyLoc((u) => (types ? isT(u, types) : isRestored(u))),
      sub: `Escolha um Pokémon ${types ? tpt(types) : "Restaurado"} seu. Até o fim do duelo, enquanto ele estiver no campo: ${txt} Não acumula. Seu turno acaba.`,
      apply: (o, [u]) => { u._paSph = Object.assign({}, u._paSph, { [key]: true }); } }));

  // ------------------------------------------------------------------ catálogo: marca as antigas e adiciona as novas
  const OLD = { longthrow: [1, "purple", "EX", 2], recycle: [3, "green", "EX", 2], xspatk: [4, "gold", "EX", 1], revive: [5, "pink", "R", 2], desperate: [6, "red", "R", 2],
    double: [7, "blue", "R", 1], focusband: [9, "gold", "R", 2], fullheal: [10, "gold", "R", 1], scoopup: [11, "purple", "UC", 1], xatk: [12, "red", "UC", 1], pkmswitch: [13, "purple", "UC", 1],
    xdefend: [15, "gold", "UC", 1], ironpower: [24, "red", "C", 2], dreadpower: [25, "red", "C", 2], flamepower: [26, "red", "C", 2], meadowpower: [27, "red", "C", 2], splashpower: [28, "red", "C", 2],
    hurdle: [41, "purple", "UC", 2], mindpower: [42, "red", "C", 2], toxicpower: [49, "red", "C", 2], dracopower: [50, "red", "C", 2], goalblock: [56, "purple", "R", 2], claypower: [57, "red", "C", 2],
    spookypower: [61, "red", "C", 2], zappower: [73, "red", "C", 2], xspeed: [91, "blue", "R", 1], xaccuracy: [306, "blue", "UC", 1], burndrive: [312, "gold", "UC", 1], dousedrive: [313, "gold", "UC", 1],
    chilldrive: [314, "gold", "UC", 1], shockdrive: [315, "gold", "UC", 1], flameenergy: [321, "gold", "R", 1], tropicalenergy: [331, "gold", "R", 1], darkenergy: [332, "gold", "R", 1],
    phantomenergy: [333, "gold", "R", 1], steelenergy: [335, "gold", "R", 1], muscleenergy: [338, "gold", "R", 1], electroenergy: [340, "gold", "R", 1], moltingenergy: [341, "gold", "R", 1],
    twistedspoon: [433, "gold", "R", 1], megaplate: [9000, "gold", "UX", 0] };
  BASE_PLATE_CATALOG.forEach((p) => { const o = OLD[p.id]; if (o) { p.off = o[0]; p.color = o[1]; if (p.id !== "megaplate") p.rarity = o[2]; p.ocost = o[3]; } });
  Object.values(D).forEach((d) => {
    if (BASE_PLATE_CATALOG.find((x) => x.id === d.id)) return;
    BASE_PLATE_CATALOG.push({ id: d.id, name: d.name, rarity: d.rar, badge: d.glyph, sub: d.sub, off: d.off, color: d.color, ocost: d.cost, target: d.tgt ? "own_any" : null });
  });
  BASE_PLATE_CATALOG.sort((a, b) => (a.off || 9999) - (b.off || 9999));
  // ui.js validou o save antes destas plates existirem: restaura a cópia completa
  try {
    const bk = JSON.parse(localStorage.getItem("pdr_plates_full_v706") || "null");
    if (Array.isArray(bk) && bk.length) saveEquippedPlateIds(bk);
    enforceStrict6CostPlates();
  } catch (e) {}

  // ------------------------------------------------------------------ ícones: fundo oficial + símbolo
  const BG = (c) => `assets/plates/plate${c}.png`;
  if (typeof BANANA_PLATE_SPRITES !== "undefined") {
    const imgs = {};
    const draw = (p, glyph) => {
      const im = imgs[p.color]; if (!im || !im.complete || !im.naturalWidth) return;
      try {
        const cv = document.createElement("canvas"); cv.width = 112; cv.height = 112; const g = cv.getContext("2d");
        const sc = Math.min(104 / im.naturalWidth, 104 / im.naturalHeight), w = im.naturalWidth * sc, h = im.naturalHeight * sc;
        g.drawImage(im, (112 - w) / 2, (112 - h) / 2, w, h);
        const txt = String(glyph || "★"); const big = [...txt].length <= 2;
        g.font = `900 ${big ? 42 : 28}px Arial, "Segoe UI Emoji", "Noto Color Emoji", sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
        g.lineWidth = 6; g.strokeStyle = "rgba(15,23,42,.85)"; g.strokeText(txt, 56, 58); g.fillStyle = "#fff"; g.fillText(txt, 56, 58);
        BANANA_PLATE_SPRITES[p.id] = cv.toDataURL("image/png");
      } catch (e) {}
    };
    const todo = BASE_PLATE_CATALOG.filter((p) => p.color && (!BANANA_PLATE_SPRITES[p.id] || /^data:image\/svg/.test(BANANA_PLATE_SPRITES[p.id])));
    todo.forEach((p) => { BANANA_PLATE_SPRITES[p.id] = BG(p.color); });
    const GLY = { ironpower: "+20", dreadpower: "+20", flamepower: "+20", meadowpower: "+20", splashpower: "+20", mindpower: "+20", toxicpower: "+20", dracopower: "+20", claypower: "+20", spookypower: "+20", zappower: "+20",
      burndrive: "⚙", dousedrive: "⚙", chilldrive: "⚙", shockdrive: "⚙", twistedspoon: "🥄", fullheal: "✚", focusband: "✊", xdefend: "🛡", xspatk: "★", xaccuracy: "◎", scoopup: "↩", desperate: "‼", recycle: "♻" };
    const GLY0 = { hurdle: "⤴", double: "↻", xatk: "30", xspeed: "»", revive: "✚", goalblock: "⛉", megaplate: "🧬", longthrow: "➚", pkmswitch: "↷" };
    BASE_PLATE_CATALOG.forEach((p) => { p.glyph = (D[p.id] && D[p.id].glyph) || GLY[p.id] || GLY0[p.id] || (/energy$/.test(p.id) ? "⚡" : p.badge); });
    ["purple", "gold", "green", "pink", "red", "blue"].forEach((c) => {
      const im = new Image(); imgs[c] = im;
      im.onload = () => { todo.filter((p) => p.color === c).forEach((p) => draw(p, (D[p.id] && D[p.id].glyph) || GLY[p.id] || (/energy$/.test(p.id) ? "⚡" : p.badge))); };
      im.src = BG(c);
    });
  }
  window.PDR_PLATE_RARITY_ICON = (r) => ({ C: "assets/plates/c.png", UC: "assets/plates/uc.png", R: "assets/plates/r.png", EX: "assets/plates/ex.png", UX: "assets/plates/ux.png" })[r] || null;

  // ------------------------------------------------------------------ uso
  const send = (pkt) => { try { if (state.mode === "p2p" && typeof sendP2PPacket === "function") sendP2PPacket(pkt); } catch (e) {} };
  function doApply(id, owner, units, remote) {
    const d = D[id]; if (!d) return false;
    const who = remote ? tt("px.opp", "Oponente") : tt("px.you", "Você");
    let r;
    try { r = d.apply(owner, units || []); } catch (e) { console.warn("[plates_all]", id, e); }
    (units || []).forEach((u) => fx(u, "#facc15"));
    snd(d.heal ? "cured" : "buff");
    const tgtN = (units || []).filter(Boolean).map((u) => u.name).join(" ⇄ ");
    log(`🎴 ${who}: ${d.name}${tgtN ? " → " + tgtN : ""}`);
    // Reveal Glass volta quando o OUTRO jogador usa outra plate
    if (id !== "revealglass") resetReveal(opp(owner));
    return r === true || (r !== false && !!d.ends);
  }
  function resetReveal(owner) {
    (state.plates || []).forEach((p) => { if (p.id === "revealglass") { if (owner === "p2") p.usedP2 = false; else p.usedP1 = false; } });
    if (owner === "p2" && Array.isArray(state.aiPlates)) state.aiPlates.forEach((p) => { if (p.id === "revealglass") p.used = false; });
    try { syncActivePlayerPlates(); } catch (e) {}
  }
  function finish(p, id, owner, units) {
    markPlateUsedForCurrentOwner(p, true);
    try { renderPlatesTray(); } catch (e) {}
    const ends = doApply(id, owner, units, false);
    send({ type: "P2P_PLATE3", plateId: id, uids: units.map((u) => u && u.uid), owner, ends });
    if (ends) endTurn(true);
  }
  const blocked = () => state.units.some((u) => u.owner !== state.turn && onB(u) && typeof abilityHas === "function" && abilityHas(u, "blockOppPlates", null));
  if (typeof confirmUseSelectedPlate === "function") {
    const _c = confirmUseSelectedPlate;
    const c2 = function () {
      try { syncActivePlayerPlates(); } catch (e) {}
      const idx = state.selectedPlateIdx || 0, p = state.plates[idx];
      if (!p || !D[p.id]) return _c.apply(this, arguments);
      if (!canControlTurn() || p.used || state.isAnimating) return;
      if (blocked()) { log(tt("pa.blocked", "🔇 Plates bloqueadas pela Habilidade do oponente.")); return; }
      const d = D[p.id], owner = state.turn;
      if (d.cond && !d.cond(owner)) { log("⚠️ " + d.name + ": " + tt("pa.cond." + p.id, d.condMsg || "não dá para usar agora.")); return; }
      togglePlatesTray(false);
      if (!d.tgt) { finish(p, p.id, owner, []); return; }
      if (!state.units.some((u) => d.tgt(u, owner))) { log(tt("px2.none", "⚠️ Nenhum Pokémon seu pode receber esta Plate agora.")); return; }
      state.__paPick = { id: p.id, idx, first: null };
      const sel = state.units.find((u) => u.uid === state.selectedUnitId);
      if (sel && d.tgt(sel, owner) && !d.tgt2) { state.__paPick = null; finish(p, p.id, owner, [sel]); return; }
      state.pendingPlateAction = "pa:" + p.id;
      snd("plate_sel");
      log(`🎴 ${d.name}: ${d.tgt2 ? tt("pa.pick2", "toque nos dois Pokémon seus que vão trocar de lugar.") : tt("px.tap_target", "toque no Pokémon que vai receber a carta.")}`);
    };
    try { confirmUseSelectedPlate = c2; } catch (e) {}
    window.confirmUseSelectedPlate = c2;
  }
  if (typeof selectUnit === "function") {
    const _s = selectUnit;
    const s2 = function (uid) {
      const pend = state.pendingPlateAction, pk = state.__paPick;
      if (typeof pend === "string" && pend.indexOf("pa:") === 0 && pk) {
        const d = D[pk.id], u = state.units.find((x) => x.uid === uid), owner = state.turn;
        if (u && d.tgt(u, owner) && u !== pk.first) {
          if (d.tgt2 && !pk.first) { pk.first = u; fx(u, "#c084fc"); log(`🎴 ${d.name}: ${u.name} ⇄ ?`); return; }
          const p = state.plates[pk.idx];
          state.pendingPlateAction = null; state.__paPick = null;
          if (p && p.id === pk.id && !p.used) finish(p, pk.id, owner, d.tgt2 ? [pk.first, u] : [u]);
          return;
        }
        if (u && u.owner !== owner) { log(tt("px.own_only", "⚠️ Escolha um Pokémon seu.")); return; }
        if (u) { log(tt("pa.invalid", "⚠️ Este Pokémon não pode receber esta Plate.")); return; }
      }
      return _s.apply(this, arguments);
    };
    try { selectUnit = s2; } catch (e) {}
  }
  if (typeof handleP2PPacket === "function") {
    const _h = handleP2PPacket;
    const h2 = function (raw) {
      let msg = raw;
      if (typeof raw === "string") { try { msg = JSON.parse(raw); } catch (e) { return _h.apply(this, arguments); } }
      if (msg && msg.type === "P2P_PLATE3" && D[msg.plateId]) {
        if (msg._fromPeer && typeof getMyUniquePeerId === "function" && msg._fromPeer === getMyUniquePeerId()) return;
        const us = (msg.uids || []).map((id) => state.units.find((x) => x.uid === id));
        doApply(msg.plateId, msg.owner, us, true);
        return;
      }
      return _h.apply(this, arguments);
    };
    try { handleP2PPacket = h2; } catch (e) {}
    window.handleP2PPacket = h2;
  }

  // ------------------------------------------------------------------ tipo global (Rotom) e anulação de Habilidades
  if (typeof abilityUnitTypes === "function") {
    const _ut = abilityUnitTypes;
    abilityUnitTypes = function (unit) {
      const r = S().rotom;
      if (r && TC() > r.end && unit && (unit.location === "board" || unit.location === "bench")) return r.type;
      return _ut.apply(this, arguments);
    };
  }
  function nullNow(u) {
    if (!u || u._abNull) return false;
    const b = S().battle;
    if (b && (b.a === u || b.b === u)) { const o = b.a === u ? b.b : b.a; if (o && o._paMetalCoat && o.owner !== u.owner && onB(o)) return true; }
    if (["poison", "badpoison"].includes(stOf(u)) && sphereOn(opp(u.owner), "venom", u)) return true;
    if ((u._mpMk || 0) > 0 && sphereOn(opp(u.owner), "silk", u)) return true;
    return false;
  }
  function withNull(units, fn) {
    const set = units.filter((u) => nullNow(u));
    set.forEach((u) => { u._abNull = true; });
    try { return fn(); } finally { set.forEach((u) => { u._abNull = false; }); }
  }

  // ------------------------------------------------------------------ roleta
  if (typeof getActiveWheel === "function") {
    const _g = getActiveWheel;
    getActiveWheel = function (u) {
      const self = this, args = arguments;
      const segs = withNull([u], () => _g.apply(self, args));
      if (!Array.isArray(segs) || !u) return segs;
      let add = 0, stars = 0, whiteAdd = 0;
      const b = onB(u);
      if (b && u._paItem) add += u._paItem;
      if (b && u._paOverdrive) add += 30;
      if (b && u._paTherian) add += 20;
      if (hasT("fert", u)) { add += 20; stars += 1; }
      if (isT(u, ["Steel"]) && sphereOn(u.owner, "metal", u)) whiteAdd += 10;
      if (b && isT(u, ["Electric"]) && sphereOn(u.owner, "electro", u)) add += 10 * adjU(u).filter((x) => x.owner === u.owner && isT(x, ["Electric"])).length;
      if (isRestored(u) && primalOn(u.owner, u)) add += 30;
      const golden = hasT("golden", u), meteor = !!u._paMeteor;
      if (!add && !stars && !whiteAdd && !golden && !meteor) return segs;
      return segs.map((s) => {
        if (!s || s.isZMove) return s;
        let o = s;
        if (golden && o.color === "purple") o = Object.assign({}, o, { name: "Extreme Speed", color: "gold", dmg: 100, stars: 0, effect: undefined, effectText: "" });
        if (meteor && nm(o) === "Break Energy") o = Object.assign({}, o, { name: "Dragon Ascent", dmg: 90, effectText: "" });
        if ((o.color === "white" || o.color === "gold") && o.dmg > 0 && (add || (whiteAdd && o.color === "white" && o.dmg >= 10))) o = Object.assign({}, o, { dmg: o.dmg + add + (o.color === "white" && o.dmg >= 10 ? whiteAdd : 0) });
        if (o.color === "purple" && stars) o = Object.assign({}, o, { stars: (o.stars || 1) + stars });
        return o;
      });
    };
  }
  function countAll(o) { return state.units.filter((u) => u.owner === o && ["board", "bench", "pc"].includes(u.location)).length; }
  function primalOn(o, u) { return sphereOn(o, "primal", u) && countAll(o) < countAll(opp(o)); }

  // ------------------------------------------------------------------ MP
  if (typeof getEffectiveUnitMp === "function") {
    const _mp = getEffectiveUnitMp;
    getEffectiveUnitMp = function (u) {
      const self = this, args = arguments;
      let mp = withNull([u], () => _mp.apply(self, args));
      if (!u || typeof mp !== "number") return mp;
      if (hasT("counter", u)) mp = Math.min(4, mp + 1);
      if (isT(u, ["Dragon"]) && mp <= 1 && sphereOn(u.owner, "dragon", u)) mp += 1;
      if (onB(u) && isT(u, ["Water"]) && mp < 3 && sphereOn(u.owner, "aqua", u) && adjU(u).some((x) => x.owner === u.owner && isT(x, ["Water"]))) mp += 1;
      if (isRestored(u) && primalOn(u.owner, u)) mp = Math.min(4, mp + 1);
      return mp;
    };
  }

  // ------------------------------------------------------------------ movimento: passar por cima / bloqueios
  if (typeof abJumpAllowed === "function") {
    const _j = abJumpAllowed;
    abJumpAllowed = function (mover, occ) {
      if (!occ || !mover) return _j.apply(this, arguments);
      if (blockedBySphere(mover, occ)) return false;
      if (_j.apply(this, arguments)) return true;
      const o = mover.owner;
      if (hasT("cape", mover)) return true;
      if (isT(mover, ["Ghost"]) && mover.location === "bench" && (isT(occ, ["Ghost"]) || hasSt(occ)) && sphereOn(o, "phantom")) return true;
      if (isT(mover, ["Fire"]) && stOf(occ) === "burn" && sphereOn(o, "flame")) return true;
      if (isT(mover, ["Electric"]) && (occ.waitTurns || 0) > 0 && sphereOn(o, "electro")) return true;
      if (isT(mover, ["Bug", "Flying"]) && stage(mover) >= 1 && occ.owner !== o && !isT(occ, ["Flying"]) && sphereOn(o, "winged")) return true;
      if (isT(mover, ["Dragon"]) && !hasSt(mover) && sphereOn(o, "dragon")) return true;
      return false;
    };
  }
  function blockedBySphere(mover, occ) {
    if (!occ || occ.owner === mover.owner) return false;
    if (isT(occ, ["Dark"]) && isT(mover, ["Ghost", "Psychic"]) && sphereOn(occ.owner, "dark", mover)) return true;
    if (isT(occ, ["Rock"]) && isT(mover, ["Flying", "Fairy"]) && sphereOn(occ.owner, "stony", mover)) return true;
    return false;
  }
  if (typeof computeReachableWithPaths === "function") {
    const _r = computeReachableWithPaths;
    computeReachableWithPaths = function (unit) {
      const res = _r.apply(this, arguments);
      if (!res || !res.paths || !unit) return res;
      const any = state.units.some((h) => h.owner !== unit.owner && onB(h) && h._paSph && (h._paSph.dark || h._paSph.stony));
      if (!any) return res;
      const ok = (res.nodes || []).filter((n) => (res.paths[n] || []).every((sg) => sg.type !== "jump" || !blockedBySphere(unit, at(sg.jumpedNode))));
      if (ok.length === (res.nodes || []).length) return res;
      const paths = {}; ok.forEach((n) => { paths[n] = res.paths[n]; });
      return Object.assign({}, res, { nodes: ok, paths });
    };
  }
  // imunidades
  if (typeof abilityImmuneTo === "function") {
    const _im = abilityImmuneTo;
    abilityImmuneTo = function (unit, eff) {
      if (_im.apply(this, arguments)) return true;
      if (!unit) return false;
      const st = typeof abStatusFromEffect === "function" ? abStatusFromEffect(eff) : eff;
      if ((st === "poison" || st === "badpoison") && isT(unit, ["Steel"]) && sphereOn(unit.owner, "metal", unit)) return true;
      if ((st === "burn" || st === "freeze") && isT(unit, ["Fire"]) && sphereOn(unit.owner, "flame", unit)) return true;
      return false;
    };
  }

  // ------------------------------------------------------------------ batalha
  if (typeof triggerCombat === "function") {
    const _tc = triggerCombat;
    triggerCombat = function (atkUnit, defUnit) {
      try {
        // Cosmo Energy: o Deoxys atacado troca com outro Deoxys melhor
        if (defUnit && atkUnit && /^Deoxys/.test(baseName(defUnit)) && duelOn(defUnit.owner, "cosmo") && onB(defUnit)) {
          const score = (u) => (typeof abBest === "function" ? abBest(u) : 0);
          const alt = state.units.filter((x) => x !== defUnit && x.owner === defUnit.owner && /^Deoxys/.test(baseName(x)) && (onB(x) || x.location === "bench") && !(x.waitTurns > 0))
            .sort((a, b) => score(b) - score(a))[0];
          if (alt && score(alt) > score(defUnit)) {
            const node = defUnit.nodeId;
            if (onB(alt)) { defUnit.nodeId = alt.nodeId; alt.nodeId = node; }
            else { const slot = alt.benchSlot; alt.location = "board"; alt.nodeId = node; defUnit.location = "bench"; defUnit.nodeId = null; defUnit.benchSlot = slot; }
            fx(alt, "#f472b6"); log(`🌌 Cosmo Energy: ${defUnit.name} ⇄ ${alt.name}`);
            arguments[1] = alt; defUnit = alt;
          }
        }
        S().battle = { a: atkUnit, b: defUnit };
      } catch (e) {}
      return _tc.apply(this, arguments);
    };
  }
  const RANK = (c) => (!c ? 0 : c.color === "red" ? 0 : c.color === "blue" ? 1 : 2);
  function loses(mine, theirs) {
    if (!mine) return true;
    if (mine.color === "red") return theirs && theirs.color !== "red";
    if (!theirs || theirs.color === "red" || mine.color === "blue" || theirs.color === "blue") return false;
    const m = mine.color, o = theirs.color;
    if (m === "purple" && o === "purple") return (mine.stars || 0) < (theirs.stars || 0);
    if (m === "purple") return o === "gold";
    if (o === "purple") return m === "white";
    return (mine.dmg || 0) < (theirs.dmg || 0);
  }
  function spinFrom(u, sp, r) {
    const segs = (Array.isArray(sp.segs) && sp.segs.length) ? sp.segs : (getActiveWheel(u) || []);
    const tot = segs.reduce((a, s) => a + (s.size || 1), 0); let p = r() * tot;
    for (let i = 0; i < segs.length; i++) { p -= (segs[i].size || 1); if (p <= 0) { sp.chosen = Object.assign({}, segs[i]); sp.chosenIdx = i; return sp.chosen; } }
    sp.chosen = Object.assign({}, segs[segs.length - 1]); sp.chosenIdx = segs.length - 1; return sp.chosen;
  }
  const PUSHY = ["push", "bench", "swap", "banish"];
  if (typeof evaluateCombat === "function") {
    const _e = evaluateCombat;
    evaluateCombat = function (atk, def2, as, ds) {
      const self = this, args = arguments;
      const real = !!(as && ds && "multiHits" in as && as.chosen && ds.chosen);
      if (!real) return withNull([atk, def2], () => _e.apply(self, args));
      const r = rng(TC() * 4111 + (atk.uid || 1) * 97 + (def2.uid || 1) * 13 + 5);
      const notes = [];
      const canRespin = (u, o) => !(o && o._paSticky && onB(o) && o.owner !== u.owner);
      const pairs = [[atk, as, def2, ds], [def2, ds, atk, as]];
      // Power Battle: Roxo de qualquer lado → os dois giram de novo
      if (pairs.some(([u]) => hasT("pbattle", u)) && (as.chosen.color === "purple" || ds.chosen.color === "purple")) {
        pairs.forEach(([u, sp, o]) => { if (canRespin(u, o)) spinFrom(u, sp, r); }); notes.push("Power Battle");
      }
      pairs.forEach(([u, sp, o, osp]) => {
        if (hasT("noguard", u) && sp.chosen.color === "blue" && canRespin(u, o)) { spinFrom(u, sp, r); notes.push("No Guard"); }
        const dx = S().drivex && S().drivex[u.uid];
        if (dx && dx.tc === TC() && loses(sp.chosen, osp.chosen) && canRespin(u, o)) { spinFrom(u, sp, r); notes.push("Drive EX"); }
      });
      pairs.forEach(([u, sp, o, osp]) => {
        if (hasT("bright", u) && onB(u) && loses(sp.chosen, osp.chosen)) { spinFrom(o, osp, r); notes.push("Bright Powder"); }
      });
      const out = withNull([atk, def2], () => _e.apply(self, args));
      if (!out) return out;
      if (notes.length) out.reason = (out.reason || "") + " 🎴 " + notes.join(" · ");
      if (out.winner !== "atk" && out.winner !== "def") return out;
      const wU = out.winner === "atk" ? atk : def2, lU = out.winner === "atk" ? def2 : atk;
      const wC = (out.winner === "atk" ? as : ds).chosen || {};
      const pend = (fn) => { state.__sliceFxPending = state.__sliceFxPending || []; state.__sliceFxPending.push(fn); };
      let eff = out.effect || "ko";
      if (hasT("ballast", lU) && (eff === "push" || eff === "bench")) { out.effect = "none"; out.reason = (out.reason || "") + " ⚓ Ballast!"; return out; }
      if (isT(lU, ["Grass"]) && sphereOn(lU.owner, "grass", lU) && (PUSHY.includes(eff) || (eff === "ko" && wC.color === "purple"))) { out.effect = "none"; out.reason = (out.reason || "") + " 🌿 Grass Sphere!"; return out; }
      if (eff === "ko") {
        const dx = S().drivex && S().drivex[wU.uid];
        if (hasT("force", wU) || (dx && dx.tc === TC() && isT(lU, dx.types)) || (hasT("golden", wU) && isT(lU, ["Dark", "Fairy"]))) out.effect = eff = "banish";
      }
      if (wU._paBlade && onB(wU) && wC.color === "white") pend(() => { if (onB(lU) && !(typeof abilityImmuneTo === "function" && abilityImmuneTo(lU, "poison"))) { lU.condition = PokemonCondition.Poison; log(`🗡 Poison Blade: ${lU.name} ☠`); } });
      if (nm(wC) === "Sphere Trick" && lU._paSph) pend(() => { wU._paSph = Object.assign({}, wU._paSph, lU._paSph); log(`🔁 Sphere Trick: ${wU.name} ◉`); });
      if (nm(wC) === "Land's Wrath" && /^Zygarde/.test(baseName(wU)) && duelOn(wU.owner, "lands")) pend(() => {
        const r2 = rng(TC() * 31 + wU.uid * 7);
        state.units.filter((x) => onB(x) && x.owner !== wU.owner && !isT(x, ["Flying"])).forEach((x) => {
          const sp = { segs: getActiveWheel(x) }; const s = spinFrom(x, sp, r2);
          if (s && s.color === "purple") { log(`🌍 Land's Energy: ${x.name} → P.C.`); sendToPC(x); }
        });
      });
      [wU, lU].forEach((u) => { if (isT(u, ["Fairy"]) && sphereOn(u.owner, "mystic", u)) pend(() => { if (window.PDRSlice) PDRSlice.clearMarkers(u); }); });
      return out;
    };
  }
  // Rock Wrecker com Long Barrel: alcance 3
  window.PDRPlatesAll = window.PDRPlatesAll || {};
  window.PDRPlatesAll.rockRange = (u) => (u && u._paLongBarrel ? 3 : 2);

  // ------------------------------------------------------------------ fim de turno
  if (typeof endTurn === "function") {
    const _end = endTurn;
    endTurn = function () {
      try {
        // Mud Energy: Espera ganha neste turno +1
        ["p1", "p2"].forEach((o) => {
          if (!duelOn(o, "mud")) return;
          const mine = state.units.filter((u) => u.owner === o && onB(u));
          if (mine.filter((u) => isT(u, ["Water"])).length < 2 || mine.filter((u) => isT(u, ["Ground"])).length < 2) return;
          state.units.forEach((u) => { if (u.owner !== o && onB(u) && (u.waitTurns || 0) > (u._paW || 0)) u.waitTurns += 1; });
        });
      } catch (e) {}
      const r = _end.apply(this, arguments);
      try {
        const tc = TC();
        state.units.forEach((u) => {
          if (u._paNoWait != null) { if (tc >= u._paNoWait) u.waitTurns = 0; else u._paNoWait = null; }
          if (u.location !== "board") { u._paItem = 0; u._paOverdrive = false; u._paSticky = false; u._paBlade = false; u._paTherian = false; }
          if (u._paRet && (u.location === "pc" || u.location === "ultra_space")) {
            const id = u._paRet; u._paRet = null;
            (state.plates || []).forEach((p) => { if (p.id === id) { if (u.owner === "p2") p.usedP2 = false; else p.usedP1 = false; } });
            if (u.owner === "p2" && Array.isArray(state.aiPlates)) state.aiPlates.forEach((p) => { if (p.id === id) p.used = false; });
            log(`🎴 ${D[id] ? D[id].name : id}: ${tt("pa.returned", "pode ser usada de novo.")}`);
          }
          if (u._paFormEnd != null && tc <= u._paFormEnd) restoreForm(u);
          const eu = S().eon[u.uid];
          if (eu != null && tc <= eu) { delete S().eon[u.uid]; if (u.location !== "ultra_space") { log(`🎵 Eon Flute: ${u.name} → Ultra Space`); exclude(u); } }
        });
        if (S().rotom && tc <= S().rotom.end) { S().rotom = null; log(tt("pa.rotom_end", "🔌 Os tipos dos Pokémon voltaram ao normal.")); }
        // Mighty Sphere
        ["p1", "p2"].forEach((o) => {
          state.units.filter((u) => u.owner !== o && onB(u) && sphereOn(o, "mighty", u)).forEach((u) => {
            const ns = ADJ[u.nodeId] || [];
            if (ns.length && ns.every((n) => at(n)) && ns.map(at).filter((x) => x.owner === o && isT(x, ["Fighting"])).length >= 2) { log(`🥊 Mighty Sphere: ${u.name} → P.C.`); sendToPC(u); }
          });
        });
        S().battle = null;
        state.units.forEach((u) => { u._paW = u.waitTurns || 0; });
      } catch (e) { console.warn("[plates_all endTurn]", e); }
      if (typeof syncActivePlayerPlates === "function") { try { syncActivePlayerPlates(); } catch (e) {} }
      return r;
    };
  }
  if (typeof demoFullMatchState === "function") {
    const _d = demoFullMatchState;
    demoFullMatchState = function () {
      const r = _d.apply(this, arguments);
      state.__pa = null; state.__paBot = null;
      try { state.units.forEach((u) => { ["_paItem", "_paSph", "_paBlade", "_paSticky", "_paMetalCoat", "_paOverdrive", "_paLongBarrel", "_paMeteor", "_paTherian", "_paRet", "_paNoWait", "_paFormEnd", "__paPrev", "_paW"].forEach((k) => { u[k] = null; }); }); } catch (e) {}
      return r;
    };
  }

  // ------------------------------------------------------------------ bot
  function botPickPlates(owner) {
    const mine = state.units.filter((u) => u.owner === owner);
    const picks = [];
    const add = (id) => { if (D[id] && !picks.includes(id) && !(state.aiPlates || []).some((p) => p.id === id)) picks.push(id); };
    Object.values(D).forEach((d) => { if (d.mega && mine.some((u) => baseName(u) === d.mega)) add(d.id); });
    const tc = {}; mine.forEach((u) => String(abilityUnitTypes(u)).split("/").forEach((x) => { tc[x] = (tc[x] || 0) + 1; }));
    const top = Object.keys(tc).sort((a, b) => tc[b] - tc[a] || a.localeCompare(b))[0];
    Object.values(D).forEach((d) => { if (d.item && d.item === top) add(d.id); });
    ["clearwait", "awakening", "paralyzheal", "antidote"].forEach(add);
    return picks.slice(0, 2);
  }
  function botScore(d, owner) {
    if (d.cond && !d.cond(owner)) return null;
    const cands = d.tgt ? state.units.filter((u) => d.tgt(u, owner)) : [null];
    if (!cands.length) return null;
    const threat = state.units.some((e) => e.owner !== owner && onB(e) && dist(e.nodeId, owner === "p1" ? 10 : 3) <= 3);
    let best = null;
    cands.forEach((u) => {
      let s = 0;
      if (d.heal) s = u && (onB(u) ? 70 : 0);
      else if (d.mega) s = 90;
      else if (d.id === "clearwait") s = u && (u.waitTurns || 0) > 0 ? 60 : 0;
      else if (d.id === "counterattack" || d.id === "forceremove") s = 55;
      else if (d.ends && !threat && TC() > 200) s = d.item || d.sphere ? 45 : 35;
      if (s > 0 && (!best || s > best.s)) best = { s, u };
    });
    return best;
  }
  if (typeof triggerPlayerAIMove === "function") {
    const _ai = triggerPlayerAIMove;
    const ai2 = function () {
      try {
        if (state.mode === "ai" && state.turn === "p2" && !state.isAnimating && !state.winCelebrationAnim && state.matchKind !== "tutorial" && !state.postMoveAttackMode && state.__paBotTurn !== TC()) {
          state.__paBotTurn = TC();
          if (!state.__paBot && Array.isArray(state.aiPlates)) { state.__paBot = true; botPickPlates("p2").forEach((id) => state.aiPlates.push({ id, name: D[id].name, cost: D[id].cost, used: false })); }
          const blockedP2 = state.units.some((u) => u.owner === "p1" && onB(u) && typeof abilityHas === "function" && abilityHas(u, "blockOppPlates", null));
          let pick = null;
          if (!blockedP2) (state.aiPlates || []).forEach((p) => { if (p.used || !D[p.id]) return; const b = botScore(D[p.id], "p2"); if (b && (!pick || b.s > pick.b.s)) pick = { p, b }; });
          if (pick && pick.b.s >= 35) {
            pick.p.used = true;
            const ends = doApply(pick.p.id, "p2", pick.b.u ? [pick.b.u] : [], false);
            log(`🤖 ${window.adaptiveAIOpponentName || "Bot"}: ${pick.p.name}`);
            if (ends) { state.aiExecutingNow = true; try { endTurn(true); } finally { state.aiExecutingNow = false; } return; }
          }
        }
      } catch (e) { console.warn("[bot plates]", e); }
      return _ai.apply(this, arguments);
    };
    try { triggerPlayerAIMove = ai2; } catch (e) {}
    window.triggerPlayerAIMove = ai2;
  }

  // ------------------------------------------------------------------ carta no formato do original (deck e partida)
  const PCOL = { purple: "#e879f9", gold: "#facc15", green: "#4ade80", pink: "#f9a8d4", red: "#f87171", blue: "#22d3ee" };
  const escH = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function plateCard(p, o) {
    o = o || {};
    const cat = BASE_PLATE_CATALOG.find((x) => x.id === p.id) || p;
    const col = PCOL[cat.color] || "#e2e8f0", g = cat.glyph, cost = cat.ocost != null ? cat.ocost : 1;
    const num = g && /^\+?\d+$/.test(g);
    const icon = g ? `<span class="pk-ic ${num ? "num" : ""}">${escH(g.replace(/^\+/, ""))}</span>` : `<img class="pk-img" src="${escH(BANANA_PLATE_SPRITES[p.id] || "")}" alt="">`;
    const segs = Array.from({ length: 6 }, (_, i) => `<i class="${i < cost ? "f" : ""}"></i>`).join("");
    const name = tt("plate." + p.id + ".name", cat.name || p.name);
    return `<div class="pk-card ${o.big ? "big" : ""} ${o.on ? "on" : ""} ${o.sel ? "sel" : ""} ${o.used ? "used" : ""} ${o.dim ? "dim" : ""}" data-p="${escH(p.id)}"${o.idx != null ? ` data-ix="${o.idx}"` : ""} style="--pc:${col}"><div class="pk-in">${icon}
      <span class="pk-r">${escH(cat.rarity || "C")}</span><div class="pk-nm">${escH(name)}${o.copy ? " #" + o.copy : ""}</div>${o.big ? `<div class="pk-ds">${o.desc || ""}</div>` : ""}
      <div class="pk-seg">${segs}</div>${o.on ? `<span class="pk-ck">✓</span>` : ""}${o.cnt > 1 ? `<span class="pk-n">x${o.cnt}</span>` : ""}${o.used ? `<span class="pk-used">${escH(tt("pa.used", "USADA"))}</span>` : ""}</div></div>`;
  }
  window.PDRPlateCard = plateCard;
  const PK_CSS = document.createElement("style");
  PK_CSS.textContent = `
  .pk-card{position:relative;aspect-ratio:3/4.2;background:#52525b;padding:1.5px;cursor:pointer;clip-path:polygon(0 0,80% 0,100% 11%,100% 100%,14% 100%,0 91%);transition:transform .1s;box-sizing:border-box}
  .pk-card:active{transform:scale(.95)}
  .pk-in{position:relative;height:100%;background:linear-gradient(160deg,#2e2e33 0%,#0a0a0c 55%,#1c1c20 56%,#060607 100%);clip-path:polygon(0 0,80% 0,100% 11%,100% 100%,14% 100%,0 91%);overflow:hidden;container-type:inline-size}
  .pk-card.sel{background:#67e8f9;filter:drop-shadow(0 0 6px #22d3ee)}
  .pk-card.dim,.pk-card.used{opacity:.42}
  .pk-ic{position:absolute;left:6%;top:6%;width:44%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;color:var(--pc);font-weight:900;font-size:26cqw;line-height:1;text-shadow:0 0 6px color-mix(in srgb,var(--pc) 55%,transparent)}
  .pk-ic.num{color:#fff;font-size:15cqw;background:radial-gradient(circle,#fb923c,#dc2626 70%);clip-path:polygon(50% 0,61% 22%,85% 12%,78% 38%,100% 50%,78% 62%,85% 88%,61% 78%,50% 100%,39% 78%,15% 88%,22% 62%,0 50%,22% 38%,15% 12%,39% 22%);text-shadow:0 1px 2px #000}
  .pk-img{position:absolute;left:5%;top:5%;width:46%;aspect-ratio:1;object-fit:contain}
  .pk-r{position:absolute;right:15%;top:5%;color:#fff;font:900 14cqw/1 Arial,sans-serif;text-shadow:0 1px 0 #000}
  .pk-nm{position:absolute;left:7%;right:3%;top:52%;color:var(--pc);font-weight:900;font-size:12.5cqw;line-height:1.1;letter-spacing:-.02em;overflow:hidden;max-height:3.4em;word-break:break-word}
  .pk-seg{position:absolute;left:16%;right:5%;bottom:4.5%;display:flex;gap:2.5%}
  .pk-seg i{flex:1;height:3.5cqw;min-height:2px;background:#27272a;border:1px solid #3f3f46}
  .pk-seg i.f{background:var(--pc);border-color:var(--pc)}
  .pk-ck{position:absolute;right:8%;bottom:13%;width:32%;aspect-ratio:1;border-radius:50%;background:#e4e4e7;border:2px solid #71717a;color:#27272a;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:18cqw}
  .pk-n{position:absolute;left:7%;bottom:14%;font-size:11cqw;font-weight:900;color:#fff}
  .pk-used{position:absolute;left:0;right:0;top:38%;text-align:center;font-weight:900;font-size:11cqw;color:#fff;background:rgba(0,0,0,.6)}
  .pk-card.big{width:min(74vw,290px);cursor:default}
  .pk-card.big .pk-nm{top:33%;font-size:9cqw;max-height:none}
  .pk-card.big .pk-ic{width:36%;font-size:20cqw}.pk-card.big .pk-ic.num{font-size:12cqw}.pk-card.big .pk-img{width:36%}
  .pk-card.big .pk-r{font-size:13cqw}
  .pk-ds{position:absolute;left:8%;right:7%;top:47%;bottom:12%;color:#fff;font-size:5.4cqw;line-height:1.3;overflow:auto}
  .pk-ds div{font-size:4.3cqw!important}
  #plates-tray.pk-tray{flex-direction:column!important;justify-content:flex-end!important;align-items:center!important;padding:0 0 16px!important}
  #plates-tray.pk-tray #plate-featured-card{display:none!important}
  #pk-big{display:flex;justify-content:center;margin-bottom:10px}
  #plates-tray.pk-tray #plates-grid{display:flex!important;flex-wrap:nowrap!important;justify-content:flex-start!important;overflow-x:auto!important;gap:8px!important;max-width:100%!important;width:100%!important;padding:8px 10px!important;margin:0!important;background:linear-gradient(#0a0a0c,#000);border-top:2px solid #27272a;border-bottom:2px solid #27272a;scroll-snap-type:x mandatory}
  #plates-tray.pk-tray #plates-grid .pk-card{flex:0 0 min(23vw,96px);scroll-snap-align:center}
  `;
  document.head.appendChild(PK_CSS);
  if (typeof renderPlatesTray === "function") {
    const _rt = renderPlatesTray;
    const rt = function () {
      const r = _rt.apply(this, arguments);
      try {
        const tray = document.getElementById("plates-tray"), grid = document.getElementById("plates-grid");
        if (!tray || !grid) return r;
        tray.classList.add("pk-tray");
        const eqd = state.plates.map((p, idx) => ({ p, idx })).filter((x) => !x.p.disabledInDeck);
        if (!eqd.length) return r;
        let sel = state.selectedPlateIdx;
        if (!eqd.some((x) => x.idx === sel)) { sel = eqd[0].idx; state.selectedPlateIdx = sel; }
        const cur = state.plates[sel];
        const descEl = document.getElementById("pcard-desc");
        let big = document.getElementById("pk-big");
        if (!big) { big = document.createElement("div"); big.id = "pk-big"; tray.insertBefore(big, grid); }
        big.innerHTML = plateCard(cur, { big: true, desc: descEl ? descEl.innerHTML : escH(cur.sub || ""), used: cur.used, copy: cur.totalCopiesEquipped > 1 ? cur.copyNumber : null });
        grid.innerHTML = eqd.map(({ p, idx }) => plateCard(p, { idx, sel: idx === sel, used: p.used, copy: p.totalCopiesEquipped > 1 ? p.copyNumber : null })).join("");
        grid.querySelectorAll("[data-ix]").forEach((c) => { c.onclick = () => { state.selectedPlateIdx = Number(c.dataset.ix); try { playSfx("tick"); } catch (e) {} renderPlatesTray(); }; });
        const sc = grid.querySelector(".pk-card.sel"); if (sc && sc.scrollIntoView) sc.scrollIntoView({ block: "nearest", inline: "center" });
      } catch (e) { console.warn("[plate tray]", e); }
      return r;
    };
    try { renderPlatesTray = rt; } catch (e) {}
    window.renderPlatesTray = rt;
  }

  // ------------------------------------------------------------------ limite de custo 6 ◆ (regra do original)
  const LIM = typeof MAX_DECK_PLATE_COST !== "undefined" ? MAX_DECK_PLATE_COST : 6;
  const pcost = (id) => { const p = BASE_PLATE_CATALOG.find((x) => x.id === id); return p && p.ocost != null ? p.ocost : 1; };
  const deckCost = (ids) => ids.reduce((a, id) => a + pcost(id), 0);
  function trimToLimit(ids) { const out = []; let c = 0; ids.forEach((id) => { const k = pcost(id); if (c + k <= LIM && out.length < 6) { out.push(id); c += k; } }); return out; }
  try {
    const ids = getSavedEquippedPlateIds();
    if (deckCost(ids) > LIM) { saveEquippedPlateIds(trimToLimit(ids)); enforceStrict6CostPlates(); }
  } catch (e) {}
  if (typeof addCurrentModalPlateToDeck === "function") {
    const _add = addCurrentModalPlateToDeck;
    const add2 = function () {
      const id = currentDetailedPlateId;
      if (id && deckCost(getSavedEquippedPlateIds()) + pcost(id) > LIM) { try { playSfx("hit"); } catch (e) {} return; }
      return _add.apply(this, arguments);
    };
    try { addCurrentModalPlateToDeck = add2; } catch (e) {}
    window.addCurrentModalPlateToDeck = add2;
  }
  if (typeof openPlateDetailsModal === "function") {
    const _op = openPlateDetailsModal;
    const op2 = function (id) {
      const r = _op.apply(this, arguments);
      try {
        const ids = getSavedEquippedPlateIds(), used = deckCost(ids), c = pcost(id);
        const b = document.getElementById("pldet-use-btn");
        if (b && ids.length < 6 && used + c > LIM) { b.disabled = true; b.style.opacity = "0.5"; b.textContent = `⚠️ ${tt("pa.cost_full", "Custo do deck")} ${used}/${LIM} ◆`; }
        const d = document.getElementById("pldet-deck-badge");
        if (d) d.textContent += ` · ${tt("dk.cost", "Custo")} ${"◆".repeat(c) || "0"} (${used}/${LIM})`;
      } catch (e) {}
      return r;
    };
    try { openPlateDetailsModal = op2; } catch (e) {}
    window.openPlateDetailsModal = op2;
  }

  Object.assign(window.PDRPlatesAll, { D, doApply, sphereOn, botPickPlates, count: () => BASE_PLATE_CATALOG.length });
})();
