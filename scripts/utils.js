// scripts/utils.js
const pLimit = require("p-limit");

// Safer slugify: trims, collapses spaces, strips non-url chars, and removes leading/trailing dashes
function toHandle(s) {
  const out = (s || "")
    .toString()
    .normalize("NFKD")              // split accents
    .replace(/[\u0300-\u036f]/g, "")// remove diacritics
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")    // non-alnum -> dash
    .replace(/-+/g, "-")            // collapse dashes
    .replace(/^-|-$/g, "");         // <-- fixed: remove only leading/trailing dash
  return out || "item";             // fallback so handle never empty
}

function cents(num) {
  const n = parseFloat(num);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function attr(entity, code, fb = null) {
  const a = (entity.custom_attributes || []).find(a => a.attribute_code === code);
  return (a && a.value != null) ? a.value : fb;
}

function getConcurrency() {
  return Number(process.env.CONCURRENCY || 6);
}

function limiter() {
  return pLimit(getConcurrency());
}

module.exports = { toHandle, cents, attr, limiter };
