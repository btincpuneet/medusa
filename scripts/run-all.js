// scripts/run-all.js
const path = require("path");
const { spawn } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");

function resolveScriptFn(scriptPath) {
  const mod = require(scriptPath);
  if (typeof mod === "function") {
    return mod;
  }
  if (mod && typeof mod.default === "function") {
    return mod.default;
  }
  throw new Error(`Script ${scriptPath} does not export a runnable function`);
}

async function runScript(scriptPath, args = {}) {
  const fn = resolveScriptFn(scriptPath);
  await fn(args);
}

function runMedusaExec(scriptRelativePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      ["medusa", "exec", scriptRelativePath],
      {
        cwd: projectRoot,
        stdio: "inherit",
        env: process.env,
      }
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `medusa exec ${scriptRelativePath} exited with code ${code}`
          )
        );
      }
    });
  });
}

(async () => {
  try {
    await runScript("./categories");
    await runMedusaExec("scripts/product.js");
    await runScript("./customers");
    await runScript("./inventory");
    await runScript("./prices");
    await runScript("./promotions");
    await runScript("./orders", { logger: console });
    console.log("🎉 All migrations finished.");
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  }
})();
