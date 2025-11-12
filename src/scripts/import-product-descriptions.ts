import "dotenv/config"

import fs from "fs/promises"
import path from "path"

const { md, assertMedusa } = require("../../scripts/clients")

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error("Usage: npm run import:product-descriptions -- <path-to-zip-or-csv> [notes]")
    process.exit(1)
  }

  await assertMedusa()

  const resolvedPath = path.resolve(filePath)
  const filename = path.basename(resolvedPath)
  const notes = process.argv[3] || undefined

  console.log(`Reading ${resolvedPath}...`)
  const buffer = await fs.readFile(resolvedPath)
  const content = buffer.toString("base64")

  console.log("Uploading descriptions to Medusa...")
  const { data } = await md.post("/redington/product-desc/imports", {
    filename,
    content,
    notes,
  })

  console.log("✅ Import complete.")
  console.log(`   ID: ${data.import_id}`)
  console.log(
    `   Summary: ${data.summary?.updated ?? 0} updated, ${data.summary?.skipped ?? 0} skipped, ${data.summary?.failed ?? 0} failed`
  )
}

main().catch((error) => {
  console.error("❌ Failed to import product descriptions:", error.message || error)
  process.exit(1)
})
