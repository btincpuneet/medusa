// scripts/categories.js
const { mg, md } = require("./clients")
const { loadMap, saveMap } = require("./id-map")
const { toHandle } = require("./utils")

function flattenTree(root) {
  const out = []
  ;(function walk(node, ancestors = []) {
    if (!node) return
    out.push({ ...node, __ancestors: ancestors })
    for (const ch of node.children_data || []) {
      walk(ch, [...ancestors, node])
    }
  })(root, [])
  return out
}

function pathHandle(cat) {
  const parts = [...(cat.__ancestors || []), cat]
    .map((n) => toHandle(n?.name || ""))
    .filter(Boolean)
  // ensure something
  const base = parts.length ? parts.join("/") : `cat-${cat.id}`
  return base.replace(/\/+/g, "/")
}

async function findCollectionByHandle(handle) {
  try {
    const { data } = await md.get(`/collections?handle=${encodeURIComponent(handle)}&limit=1`)
    const col = (data?.collections || [])[0]
    return col || null
  } catch (_) {
    return null
  }
}

async function run() {
  const map = loadMap()

  console.log("📁 Fetching Magento categories...")
  const { data: root } = await mg.get("/categories") // full tree
  const flat = flattenTree(root)
  console.log(`➡️  Found ${flat.length} category nodes`)

  let created = 0, skipped = 0, reused = 0

  for (const cat of flat) {
    // skip Magento root (often id=1) and inactive nodes
    if (!cat.is_active || !cat.name || String(cat.id) === "1") {
      skipped++
      continue
    }

    const key = String(cat.id)
    if (map.collections[key]) {
      skipped++
      continue
    }

    const handle = pathHandle(cat)

    try {
      // try create
      const payload = {
        title: cat.name,
        handle,
        metadata: {
          magento_id: cat.id,
          parent_id: cat.parent_id ?? null,
          level: cat.level ?? null,
          product_count: cat.product_count ?? null,
          magento_path: handle,
        },
      }

      const { data } = await md.post("/collections", payload)
      map.collections[key] = data.collection.id
      saveMap(map)
      created++
      console.log(`✔ Created collection ${cat.id} → ${data.collection.id} (${handle})`)
    } catch (e) {
      const msg = e.response?.data || e.message

      // Handle conflict (handle already exists) → fetch & reuse
      if (e.response?.status === 409 || /already exists|duplicate/i.test(String(msg))) {
        const existing = await findCollectionByHandle(handle)
        if (existing?.id) {
          map.collections[key] = existing.id
          saveMap(map)
          reused++
          console.log(`↺ Reused existing collection for ${cat.id} (${handle}) → ${existing.id}`)
          continue
        }
      }

      console.error("❌ Collection", cat.id, msg)
    }
  }

  console.log(`\n✅ Categories done. created=${created}, reused=${reused}, skipped=${skipped}`)
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

module.exports = run
