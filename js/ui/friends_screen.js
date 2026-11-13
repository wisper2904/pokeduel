// ============================================================================
// v728 · Amigos e convite no Multijogador P2P
// Lista de amigos (pedido + aceite), presença pelo Salão e convite para duelar que abre a sala por código sozinho.
// Carrega por último (depois de battle_scene.js). Tudo em um arquivo: store (PDRFriends), rede (PDRFriendsNet)
// e tela (PDRFriendsUI). Spec: docs/superpowers/specs/2026-11-13-amigos-p2p-design.md
// ============================================================================
(function () {
  "use strict";
  const KEY = "pdr_friends_v728";
  const OUTGOING_TTL = 24 * 3600 * 1000;
  const ID_RE = /^\d{3}-\d{3}-\d{3}$/;

  // ============================================================= 1. STORE
  function blank() { return { friends: [], outgoing: [], incoming: [] }; }
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { d = null; }
    if (!d || typeof d !== "object") d = blank();
    ["friends", "outgoing", "incoming"].forEach((k) => { if (!Array.isArray(d[k])) d[k] = []; });
    const now = Date.now();
    d.outgoing = d.outgoing.filter((o) => o && ID_RE.test(String(o.trainerId)) && now - (o.sentAt || 0) < OUTGOING_TTL);
    d.friends = d.friends.filter((f) => f && ID_RE.test(String(f.trainerId)));
    d.incoming = d.incoming.filter((f) => f && ID_RE.test(String(f.trainerId)));
    return d;
  }
  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent("pdr-friends-changed")); } catch (e) {}
  }
  function myId() { const p = window.trainerProfileData || {}; return String(p.trainerId || ""); }
  function isValidId(s) { return ID_RE.test(String(s || "").trim()); }
  function getFriend(id) { return load().friends.find((f) => f.trainerId === id) || null; }
  function upsertFriend(info) {
    const d = load(), id = String(info.trainerId);
    let f = d.friends.find((x) => x.trainerId === id);
    if (!f) { f = { trainerId: id, addedAt: Date.now(), lastSeen: 0, confirmed: false }; d.friends.push(f); }
    ["nickname", "avatar", "rating", "username", "lastSeen"].forEach((k) => { if (info[k] != null) f[k] = info[k]; });
    if (typeof info.confirmed === "boolean") f.confirmed = info.confirmed;
    save(d);
    return f;
  }
  function removeFriend(id) { const d = load(); d.friends = d.friends.filter((f) => f.trainerId !== id); save(d); }
  function addIncoming(info) {
    const d = load(), id = String(info.trainerId);
    let r = d.incoming.find((x) => x.trainerId === id);
    if (!r) { r = { trainerId: id, receivedAt: Date.now() }; d.incoming.push(r); }
    ["nickname", "avatar", "rating", "username"].forEach((k) => { if (info[k] != null) r[k] = info[k]; });
    save(d);
  }
  function removeIncoming(id) { const d = load(); d.incoming = d.incoming.filter((f) => f.trainerId !== id); save(d); }
  function addOutgoing(info) {
    const d = load(), id = String(info.trainerId);
    let o = d.outgoing.find((x) => x.trainerId === id);
    if (!o) { o = { trainerId: id }; d.outgoing.push(o); }
    o.nickname = info.nickname || o.nickname || id; o.sentAt = Date.now();
    save(d);
  }
  function removeOutgoing(id) { const d = load(); d.outgoing = d.outgoing.filter((f) => f.trainerId !== id); save(d); }
  function touchSeen(id, ts) {
    const d = load(), f = d.friends.find((x) => x.trainerId === id);
    if (!f) return;
    f.lastSeen = ts || Date.now(); save(d);
  }
  window.PDRFriends = { load, save, myId, isValidId, getFriend, upsertFriend, removeFriend, addIncoming, removeIncoming, addOutgoing, removeOutgoing, touchSeen, KEY };

  // ============================================================= 2. PRESENÇA (Salão)
  // O Salão já conecta 1 s depois de abrir o jogo (p2p_matchmaker.js, fim do arquivo); a presença e o canal local
  // vêm de lá. Aqui não há nada a ligar.
})();
