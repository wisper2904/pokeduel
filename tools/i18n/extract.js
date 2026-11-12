// Extrai textos visíveis (literais, templates, concatenações) de arquivos JS e do HTML
const fs = require("fs");
const acorn = require("acorn");
const walk = require("acorn-walk");

const SKIP_CALLEE = new Set(["getElementById", "querySelector", "querySelectorAll", "addEventListener", "removeEventListener", "getItem", "setItem", "removeItem",
  "add", "remove", "toggle", "contains", "require", "playSfx", "play", "createElement", "RegExp", "importScripts", "fetch", "Audio", "postMessage", "getContext", "matchMedia", "closest", "localizeMove", "localizeType", "localizeCondition", "findFigureByName", "abNameMatch", "dispatchEvent", "Event", "CustomEvent", "open", "put", "match", "test", "split", "startsWith", "endsWith", "indexOf", "includes", "replace", "load"]);
const out = new Map();
function addT(tpl, file) {
  // atributos visíveis dentro de HTML montado no JS
  String(tpl).replace(/(?:placeholder|title|aria-label|alt)="([^"]{3,})"/g, (_, v) => { if (!/[{}]/.test(v) || /\{\d+\}/.test(v)) addSeg(v, file); return _; });
  addSegs(tpl, file);
}
function addSeg(s, file) { addSegs(s, file); }
function addSegs(tpl, file) {
  // separa por tags HTML
  const segs = tpl.split(/<[^>]*>|&nbsp;|\n/g).map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);
  segs.forEach((s) => {
    const plain = s.replace(/\{\d+\}/g, "").trim();
    if (!/[A-Za-zÀ-ÿ]{2,}/.test(plain)) return;
    if (/^[a-z0-9_\-.]+$/.test(plain) && !/\s/.test(plain)) return; // chaves/ids/classes
    if (/[{};]/.test(plain) && /:/.test(plain) && /(px|rgba?\(|#[0-9a-f]{3}|solid|flex|grid|none|var\()/i.test(plain)) return; // css
    if (/^(#|\.|\[)[\w\-]/.test(plain) && !/\s{1}[A-ZÀ-Ú]/.test(plain)) return; // seletor
    if (/^(https?:|data:|\.\/|\/)/.test(plain)) return;
    if (/^[\w\-]+(\s[\w\-]+)*$/.test(plain) && /^[a-z]/.test(plain) && /-/.test(plain)) return; // "btn gold-x"
    if (/^(btn|dk|sh|fz|pd|ds)[\s\-]/.test(plain)) return;
    if (/=>|function\s*\(|\bconst\b|\breturn\b|===/.test(plain)) return;
    if (!/\s/.test(plain) && !/^[A-ZÀ-Ú0-9⚡🔥]/.test(plain) && !/[À-ÿ]/.test(plain)) return; // palavra solta minúscula = código
    if (!out.has(s)) out.set(s, new Set());
    out.get(s).add(file);
  });
}
function strOf(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") return { parts: [node.value], n: 0 };
  if (node.type === "TemplateLiteral") {
    let s = "", n = 0;
    node.quasis.forEach((q, i) => { s += q.value.cooked == null ? q.value.raw : q.value.cooked; if (i < node.expressions.length) s += "{" + (n++) + "}"; });
    return { parts: [s], n };
  }
  return null;
}
function flattenPlus(node, acc) {
  if (node.type === "BinaryExpression" && node.operator === "+") { flattenPlus(node.left, acc); flattenPlus(node.right, acc); return acc; }
  acc.push(node); return acc;
}
function calleeName(c) { if (!c) return ""; if (c.type === "Identifier") return c.name; if (c.type === "MemberExpression" && !c.computed) return c.property.name; return ""; }

function processJs(src, file) {
  let ast;
  try { ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "script", allowHashBang: true, allowReturnOutsideFunction: true }); }
  catch (e) { console.error("parse fail", file, e.message); return; }
  const handled = new Set();
  walk.fullAncestor(ast, (node, st, anc) => {
    if (handled.has(node)) return;
    const parent = anc[anc.length - 2];
    if (node.type === "BinaryExpression" && node.operator === "+") {
      if (parent && parent.type === "BinaryExpression" && parent.operator === "+") return; // só a raiz
      const items = flattenPlus(node, []);
      if (!items.some((x) => strOf(x))) return;
      let s = "", n = 0;
      items.forEach((x) => { const v = strOf(x); if (v && x.type === "Literal") s += v.parts[0]; else if (v && x.type === "TemplateLiteral") { s += v.parts[0].replace(/\{(\d+)\}/g, (_, d) => "{" + (n + +d) + "}"); n += v.n; } else s += "{" + (n++) + "}"; handled.add(x); });
      if (ctxSkip(anc, node)) return;
      addT(s, file); return;
    }
    if (node.type === "Literal" || node.type === "TemplateLiteral") {
      const v = strOf(node); if (!v) return;
      if (ctxSkip(anc, node)) return;
      addT(v.parts[0], file);
    }
  });
}
function ctxSkip(anc, node) {
  const parent = anc[anc.length - 2];
  if (!parent) return false;
  if (parent.type === "Property" && parent.key === node) return true;
  if (parent.type === "MemberExpression" && parent.property === node) return true;
  if (parent.type === "BinaryExpression" && ["===", "!==", "==", "!=", "in", "instanceof"].includes(parent.operator)) return true;
  if (parent.type === "SwitchCase") return true;
  if (parent.type === "ImportDeclaration") return true;
  if (parent.type === "CallExpression" && parent.arguments[0] === node && SKIP_CALLEE.has(calleeName(parent.callee))) return true;
  if (parent.type === "CallExpression" && calleeName(parent.callee) === "setAttribute" && parent.arguments[0] === node) return true;
  if (parent.type === "CallExpression" && ["t", "tt"].includes(calleeName(parent.callee)) && parent.arguments[0] === node) return true; // chave
  if (parent.type === "NewExpression" && calleeName(parent.callee) === "RegExp") return true;
  // propriedades de estilo
  if (parent.type === "AssignmentExpression" && parent.left.type === "MemberExpression") {
    const p = parent.left.property && parent.left.property.name;
    if (["cssText", "className", "id", "src", "href", "background", "color", "display", "transform", "border", "boxShadow", "width", "height", "position", "zIndex", "font", "fillStyle", "strokeStyle", "textAlign", "textBaseline", "globalCompositeOperation", "lineCap", "lineJoin", "type", "location", "cursor", "opacity", "filter"].includes(p)) return true;
    if (parent.left.object && parent.left.object.type === "MemberExpression" && parent.left.object.property && parent.left.object.property.name === "style") return true;
  }
  return false;
}
const files = process.argv.slice(2);
files.forEach((f) => {
  const src = fs.readFileSync(f, "utf8");
  if (f.endsWith(".html")) {
    // scripts inline + texto do HTML
    const scripts = [...src.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    scripts.forEach((s) => processJs(s, f));
    const body = src.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
    addT(body, f);
    [...body.matchAll(/(?:placeholder|title|aria-label|alt)="([^"]+)"/g)].forEach((m) => addT(m[1], f));
  } else processJs(src, f);
});
const arr = [...out.entries()].map(([s, fs]) => [s, [...fs].map((x) => x.replace(/^.*\/js\//, "js/"))]);
fs.writeFileSync(process.env.OUT || "/tmp/segs.json", JSON.stringify(arr, null, 0));
console.log(arr.length);
