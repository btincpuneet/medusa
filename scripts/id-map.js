// scripts/id-map.js
const fs = require("fs");
const path = require("path");

const FILE = path.resolve(__dirname, ".idmap.json");

function ensureFile() {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(
      FILE,
      JSON.stringify({
        products: {},
        variants: {},
        collections: {},
        customers: {},
        orders: {},
        locations: {},
      }, null, 2)
    );
  }
}

function loadMap() {
  ensureFile();
  try {
    const json = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return json;
  } catch (err) {
    console.warn("⚠️  Could not parse .idmap.json, starting fresh.", err.message);
    return { products: {}, variants: {}, collections: {}, customers: {}, orders: {}, locations: {} };
  }
}

function saveMap(map) {
  ensureFile();
  fs.writeFileSync(FILE, JSON.stringify(map, null, 2));
}

function updateMap(section, key, value) {
  const map = loadMap();
  if (!map[section]) map[section] = {};
  map[section][key] = value;
  saveMap(map);
  return map;
}

module.exports = { loadMap, saveMap, updateMap };
