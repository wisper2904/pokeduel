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
  const tt = (k, fb) => (typeof t === "function" ? t(k, fb) : fb);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function spriteOf(key) {
    const k = String(key || "pikachu").toLowerCase();
    const sp = (typeof AUTHENTIC_FIG_SPRITES !== "undefined") && (AUTHENTIC_FIG_SPRITES[k] || AUTHENTIC_FIG_SPRITES.pikachu);
    return sp ? sp.uri : "";
  }
  function online(id) { try { return (typeof pdrSalaoOnlineByTrainerId === "function") ? pdrSalaoOnlineByTrainerId(id) : null; } catch (e) { return null; } }
  function inMatch() {
    if (typeof state !== "undefined" && state && state.isMatchActive) return true;
    const ov = document.getElementById("wheel-overlay");
    return !!(ov && ov.classList.contains("show"));
  }
  function sfx(n) { try { if (window.PDRSound) PDRSound.play(n); } catch (e) {} }
  function log(msg) { try { if (typeof setLogText === "function") setLogText(msg); } catch (e) {} }

  // ============================================================= 3. CSS dos pop-ups e da aba
  const CSS = `
  .pf-modal{position:fixed;inset:0;z-index:300;background:rgba(2,6,15,.78);display:flex;align-items:center;justify-content:center;padding:12px}
  .pf-panel{width:100%;max-width:340px;background:#0b0f17;border:2px solid #38bdf8;border-radius:12px;padding:12px;color:#fff;box-shadow:0 0 40px rgba(0,0,0,.8)}
  .pf-panel h3{margin:0 0 8px;font-size:14px;font-weight:900;color:#fde047;text-align:center;letter-spacing:.5px}
  .pf-who{display:flex;align-items:center;gap:10px;background:#111827;border:1px solid #334155;border-radius:10px;padding:8px}
  .pf-who img{width:52px;height:52px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,.6))}
  .pf-who b{font-size:14px;display:block}.pf-who small{color:#94a3b8;font-size:10px}
  .pf-msg{font-size:11.5px;color:#cbd5e1;margin:10px 2px 4px;text-align:center}
  .pf-yn{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
  .pf-yn button{height:40px;border-radius:7px;border:2px solid #fef9c3;background:linear-gradient(180deg,#fde047,#eab308);color:#1c1917;font-weight:900;font-size:14px;cursor:pointer;box-shadow:0 3px 0 #854d0e}
  .pf-yn button.sec{background:#1e293b;border-color:#475569;color:#e2e8f0;box-shadow:0 3px 0 #0f172a}
  .pf-toast{position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:301;background:#0b0f17;border:1.5px solid #4ade80;color:#e2e8f0;font-size:11px;font-weight:800;padding:8px 14px;border-radius:99px;box-shadow:0 6px 20px rgba(0,0,0,.6);pointer-events:none;animation:pfToast 2.6s forwards}
  @keyframes pfToast{0%{opacity:0;transform:translate(-50%,-8px)}12%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0}}
  `;
  function injectCss() { if (document.getElementById("pf-css")) return; const st = document.createElement("style"); st.id = "pf-css"; st.textContent = CSS; document.head.appendChild(st); }
  function toast(msg) { injectCss(); const d = document.createElement("div"); d.className = "pf-toast"; d.textContent = msg; document.body.appendChild(d); setTimeout(() => d.remove(), 2700); }
  function closeModal(id) { const m = document.getElementById(id); if (m) m.remove(); }
  function openModal(id, html) {
    injectCss(); closeModal(id);
    const m = document.createElement("div"); m.id = id; m.className = "pf-modal"; m.innerHTML = `<div class="pf-panel">${html}</div>`;
    document.body.appendChild(m); sfx("confirm"); return m;
  }
  const whoHtml = (f) => `<div class="pf-who"><img src="${esc(spriteOf(f.avatar))}" alt=""><div><b>${esc(f.nickname || f.trainerId)}</b><small>ID ${esc(f.trainerId)} · ★ ${esc(f.rating || 1000)}</small></div></div>`;

  // ============================================================= 4. REDE (pacotes FRIEND_* pelo Salão)
  const seenNonce = new Set();
  const resentAccept = new Set();
  function me() { const p = window.trainerProfileData || {}; return { id: myId(), nick: p.nickname || "Treinador", avatar: String(p.mainDisplayFigure || "pikachu").toLowerCase().replace(/\s+/g, "_"), rating: p.rankRating || 1000 }; }
  function basePacket(type, toTrainerId) {
    const m = me();
    return { type, toTrainerId, fromTrainerId: m.id, fromNick: m.nick, fromAvatar: m.avatar, fromRating: m.rating, ts: Date.now(), nonce: Math.random().toString(36).slice(2, 10) };
  }
  function send(pk) { try { if (typeof publishSalaoPacket === "function") publishSalaoPacket(pk); } catch (e) {} }
  function fromInfo(msg) { return { trainerId: msg.fromTrainerId, nickname: msg.fromNick, avatar: msg.fromAvatar, rating: msg.fromRating }; }

  function sendRequest(toTrainerId, toNick) {
    addOutgoing({ trainerId: toTrainerId, nickname: toNick });
    send(basePacket("FRIEND_REQUEST", toTrainerId));
  }
  function sendAccept(toTrainerId) { send(basePacket("FRIEND_ACCEPT", toTrainerId)); }
  function sendDecline(toTrainerId) { send(basePacket("FRIEND_DECLINE", toTrainerId)); }
  function sendRemove(toTrainerId) { removeFriend(toTrainerId); send(basePacket("FRIEND_REMOVE", toTrainerId)); }
  function acceptIncoming(trainerId) {
    const r = load().incoming.find((x) => x.trainerId === trainerId);
    upsertFriend(Object.assign({}, r || { trainerId }, { confirmed: false }));
    removeIncoming(trainerId); removeOutgoing(trainerId);
    sendAccept(trainerId); closeModal("pdr-friend-req-modal");
  }
  function declineIncoming(trainerId) { removeIncoming(trainerId); sendDecline(trainerId); closeModal("pdr-friend-req-modal"); }

  function showRequestModal(f) {
    if (inMatch()) return;
    const m = openModal("pdr-friend-req-modal", `<h3>👥 ${tt("pf.req_title", "Pedido de amizade")}</h3>${whoHtml(f)}
      <div class="pf-msg">${esc(f.nickname || f.trainerId)} ${tt("pf.req_msg", "quer ser seu amigo.")}</div>
      <div class="pf-yn"><button id="pf-req-yes">${tt("pf.accept", "Aceitar")}</button><button id="pf-req-no" class="sec">${tt("pf.later", "Depois")}</button></div>`);
    m.querySelector("#pf-req-yes").onclick = () => acceptIncoming(f.trainerId);
    m.querySelector("#pf-req-no").onclick = () => closeModal("pdr-friend-req-modal");
  }

  // Retorna true quando o pacote era FRIEND_* (tratado ou descartado). SALAO_PRESENCE é só observado (retorna false).
  function handle(msg) {
    if (!msg || typeof msg !== "object" || typeof msg.type !== "string") return false;
    const my = myId();
    if (msg.type === "SALAO_PRESENCE") {
      const id = msg.trainerId;
      if (typeof id === "string" && id !== my) {
        const f = getFriend(id);
        if (f) {
          touchSeen(id, Date.now());
          if (f.confirmed === false && !resentAccept.has(id)) { resentAccept.add(id); sendAccept(id); }
        }
      }
      return false;
    }
    if (msg.type.indexOf("FRIEND_") !== 0) return false;
    const from = msg.fromTrainerId;
    if (typeof from !== "string" || !ID_RE.test(from) || from === my || msg.toTrainerId !== my) return true;
    const key = from + ":" + (msg.nonce || msg.ts || "");
    if (seenNonce.has(key)) return true;
    seenNonce.add(key); if (seenNonce.size > 500) seenNonce.clear();
    const d = load();
    const isFriend = d.friends.some((x) => x.trainerId === from);
    const inOut = d.outgoing.some((x) => x.trainerId === from);
    try {
      if (msg.type === "FRIEND_REQUEST") {
        if (isFriend) { upsertFriend(Object.assign(fromInfo(msg), { confirmed: true })); sendAccept(from); return true; }
        if (inOut) { // os dois pediram ao mesmo tempo: vira amizade
          upsertFriend(Object.assign(fromInfo(msg), { confirmed: true })); removeOutgoing(from); sendAccept(from); return true;
        }
        addIncoming(fromInfo(msg));
        showRequestModal(fromInfo(msg));
      } else if (msg.type === "FRIEND_ACCEPT") {
        if (!isFriend && !inOut) return true;
        const was = getFriend(from);
        upsertFriend(Object.assign(fromInfo(msg), { confirmed: true }));
        removeOutgoing(from); removeIncoming(from);
        if (inOut || (was && was.confirmed === false)) { sendAccept(from); }
        if (!was || was.confirmed === false) { toast(`🤝 ${msg.fromNick || from} ${tt("pf.now_friends", "agora é seu amigo!")}`); sfx("ab_pos"); }
      } else if (msg.type === "FRIEND_DECLINE") {
        if (inOut) { removeOutgoing(from); toast(`${msg.fromNick || from} ${tt("pf.declined", "recusou o pedido.")}`); }
      } else if (msg.type === "FRIEND_REMOVE") {
        if (isFriend) removeFriend(from);
      } else if (window.PDRFriendsNet && typeof PDRFriendsNet._handleInvite === "function") {
        PDRFriendsNet._handleInvite(msg, isFriend);
      }
    } catch (e) { try { console.warn("[friends] handle", e); } catch (x) {} }
    return true;
  }
  window.PDRFriendsNet = { basePacket, handle, sendRequest, sendAccept, sendDecline, sendRemove, acceptIncoming, declineIncoming, toast, openModal, closeModal, whoHtml, online, inMatch, me };

  // ============================================================= 5. CONVITE PARA DUELAR
  const INVITE_MS = 45000;
  let pending = null;        // anfitrião: { trainerId, nickname, code, t0, timer }
  let incomingInvite = null; // convidado: { trainerId, code }
  let cancelling = false;
  function fireInviteState() { try { document.dispatchEvent(new CustomEvent("pdr-friends-invite-state")); } catch (e) {} }
  function status(title, sub, badge, col) { try { if (typeof updateP2PStatusUI === "function") updateP2PStatusUI(title, sub, badge, col); } catch (e) {} }
  function clearPending() { if (pending && pending.timer) clearTimeout(pending.timer); pending = null; fireInviteState(); }
  function invite(trainerId) {
    if (pending) return false;
    const f = getFriend(trainerId);
    if (!f || !online(trainerId)) return false;
    if (typeof createIntuitiveP2PRoom !== "function") return false;
    try { createIntuitiveP2PRoom(); } catch (e) { return false; }
    const el = document.getElementById("host-room-code-display");
    const code = el ? String(el.textContent || "").trim() : "";
    if (!/^\d{4,8}$/.test(code)) return false;
    pending = { trainerId, nickname: f.nickname || trainerId, code, t0: Date.now(), timer: null };
    pending.timer = setTimeout(() => {
      toast(`⏳ ${pending ? pending.nickname : ""} ${tt("pf.inv_noanswer", "não respondeu ao convite.")}`);
      cancelInvite(true);
    }, INVITE_MS);
    const pk = basePacket("FRIEND_INVITE", trainerId); pk.roomCode = code; send(pk);
    status(`⚔️ ${tt("pf.inv_sent", "CONVITE ENVIADO A")} ${String(pending.nickname).toUpperCase()}`, tt("pf.inv_wait", "Aguardando a resposta do seu amigo..."), tt("pf.waiting", "AGUARDANDO"), "#facc15");
    sfx("confirm"); fireInviteState();
    return true;
  }
  function cancelInvite(notify) {
    if (!pending || cancelling) return;
    cancelling = true;
    const to = pending.trainerId;
    clearPending();
    if (notify) { const pk = basePacket("FRIEND_INVITE_REPLY", to); pk.reply = "cancel"; send(pk); }
    try { if (typeof cleanupActiveP2PSession === "function") cleanupActiveP2PSession(tt("pf.inv_cancelled", "Convite cancelado")); } catch (e) {}
    cancelling = false;
  }
  function reply(to, r) { const pk = basePacket("FRIEND_INVITE_REPLY", to); pk.reply = r; send(pk); }
  function showInviteModal(f, code) {
    incomingInvite = { trainerId: f.trainerId, code };
    const m = openModal("pdr-friend-invite-modal", `<h3>⚔️ ${tt("pf.inv_title", "Convite para duelar")}</h3>${whoHtml(f)}
      <div class="pf-msg">${esc(f.nickname || f.trainerId)} ${tt("pf.inv_msg", "te convidou para um duelo online.")}</div>
      <div class="pf-yn"><button id="pf-inv-yes">${tt("pf.accept", "Aceitar")}</button><button id="pf-inv-no" class="sec">${tt("pf.decline", "Recusar")}</button></div>`);
    m.querySelector("#pf-inv-yes").onclick = () => {
      const inv = incomingInvite; incomingInvite = null; closeModal("pdr-friend-invite-modal");
      if (!inv) return;
      reply(inv.trainerId, "accept");
      const inp = document.getElementById("room-code-input");
      if (inp) inp.value = inv.code;
      try { if (typeof joinIntuitiveP2PRoom === "function") joinIntuitiveP2PRoom(); } catch (e) {}
    };
    m.querySelector("#pf-inv-no").onclick = () => {
      const inv = incomingInvite; incomingInvite = null; closeModal("pdr-friend-invite-modal");
      if (inv) reply(inv.trainerId, "decline");
    };
  }
  function handleInvite(msg, isFriend) {
    const from = msg.fromTrainerId;
    if (msg.type === "FRIEND_INVITE") {
      if (!isFriend) return;
      const code = String(msg.roomCode || "");
      if (!/^\d{4,8}$/.test(code)) return;
      if (inMatch() || pending) { reply(from, "busy"); return; }
      showInviteModal(fromInfo(msg), code);
    } else if (msg.type === "FRIEND_INVITE_REPLY") {
      const r = msg.reply;
      if (r === "cancel") {
        if (incomingInvite && incomingInvite.trainerId === from) { incomingInvite = null; closeModal("pdr-friend-invite-modal"); toast(`${msg.fromNick || from} ${tt("pf.inv_cancel_rx", "cancelou o convite.")}`); }
        return;
      }
      if (!pending || pending.trainerId !== from) return;
      if (r === "accept") {
        status(`✅ ${String(msg.fromNick || from).toUpperCase()} ${tt("pf.inv_accepted", "ACEITOU! CONECTANDO...")}`, tt("pf.inv_connecting", "Sincronizando tabuleiro com seu amigo..."), tt("pf.connecting", "CONECTANDO"), "#4ade80");
        if (pending.timer) clearTimeout(pending.timer);
        pending.timer = setTimeout(() => cancelInvite(false), 20000);
      } else if (r === "decline" || r === "busy") {
        toast(r === "busy" ? `${msg.fromNick || from} ${tt("pf.inv_busy", "está em uma partida agora.")}` : `${msg.fromNick || from} ${tt("pf.inv_declined", "recusou o convite.")}`);
        cancelInvite(false);
      }
    }
  }
  // Partida começou: o convite cumpriu o papel
  if (typeof startP2PMatch === "function") {
    const _st = startP2PMatch;
    const st2 = function () { clearPending(); incomingInvite = null; closeModal("pdr-friend-invite-modal"); return _st.apply(this, arguments); };
    try { startP2PMatch = st2; } catch (e) {}
    window.startP2PMatch = st2;
  }
  // Sala fechada pelo usuário (botão vermelho) também encerra o convite
  if (typeof cleanupActiveP2PSession === "function") {
    const _cl = cleanupActiveP2PSession;
    const cl2 = function () { if (pending && !cancelling) { const to = pending.trainerId; clearPending(); reply(to, "cancel"); } return _cl.apply(this, arguments); };
    try { cleanupActiveP2PSession = cl2; } catch (e) {}
    window.cleanupActiveP2PSession = cl2;
  }
  Object.assign(window.PDRFriendsNet, { invite, cancelInvite, pendingInvite: () => (pending ? { trainerId: pending.trainerId, nickname: pending.nickname, code: pending.code, t0: pending.t0, ms: INVITE_MS } : null), _handleInvite: handleInvite });

  if (typeof handleIncomingSalaoMessage === "function") {
    const _h = handleIncomingSalaoMessage;
    const h2 = function (msg) { try { if (handle(msg)) return; } catch (e) {} return _h.apply(this, arguments); };
    try { handleIncomingSalaoMessage = h2; } catch (e) {}
    window.handleIncomingSalaoMessage = h2;
  }
})();
