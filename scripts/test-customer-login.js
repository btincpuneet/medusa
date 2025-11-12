#!/usr/bin/env node
/**
 * scripts/test-customer-login.js
 *
 * Quick helper to verify whether a migrated customer can authenticate against
 * the storefront login endpoint using their real (plain text) password.
 *
 * Usage examples:
 *   node scripts/test-customer-login.js --email user@example.com
 *   node scripts/test-customer-login.js -e user@example.com -p "PlaintextPassword"
 *
 * Env shortcuts:
 *   TEST_LOGIN_EMAIL=foo@bar.com TEST_LOGIN_PASSWORD=secret node ...
 *
 * Optional env overrides:
 *   MEDUSA_STORE_URL / MEDUSA_BASE_URL   → host (defaults to http://localhost:9000)
 *   CUSTOMER_LOGIN_PATH                  → path (defaults to /store/migrate-login)
 *   MEDUSA_PUBLISHABLE_KEY               → used if your store API requires it
 *
 * The script never stores or hashes the password; it simply forwards the
 * plaintext payload to the Medusa endpoint and reports whether auth succeeded.
 */

const path = require("path");
const axios = require("axios");
const readline = require("readline");

require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const DEFAULT_BASE =
  (process.env.MEDUSA_STORE_URL || process.env.MEDUSA_BASE_URL || "").trim() ||
  "http://localhost:9000";
const LOGIN_PATH =
  (process.env.CUSTOMER_LOGIN_PATH || "/store/migrate-login").trim();
const PUBLISHABLE_KEY =
  process.env.MEDUSA_PUBLISHABLE_KEY ||
  process.env.MEDUSA_PUB_KEY ||
  process.env.MEDUSA_STORE_PUBLISHABLE_KEY ||
  null;

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { json: false };
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (token === "--email" || token === "-e") {
      result.email = args[++i];
    } else if (token === "--password" || token === "-p") {
      result.password = args[++i];
    } else if (token === "--json") {
      result.json = true;
    } else if (token === "--help" || token === "-h") {
      result.help = true;
    }
  }
  return result;
}

function printHelp() {
  console.log(`Usage:
  node scripts/test-customer-login.js --email user@example.com [--password plainText]

Flags:
  -e, --email       Email address to test. Required (or set TEST_LOGIN_EMAIL).
  -p, --password    Plain text password. If omitted, you'll be prompted securely.
      --json        Print the raw JSON response instead of a summary.
  -h, --help        Show this help text.

Environment:
  MEDUSA_STORE_URL / MEDUSA_BASE_URL   → server host (default http://localhost:9000)
  CUSTOMER_LOGIN_PATH                  → login path (default /store/migrate-login)
  MEDUSA_PUBLISHABLE_KEY               → optional publishable key header
  TEST_LOGIN_EMAIL / TEST_LOGIN_PASSWORD → fallback creds
`);
}

function question(prompt, { mask = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (mask && rl.output && typeof rl._writeToOutput === "function") {
      rl.stdoutMuted = true;
      rl._writeToOutput = function (stringToWrite) {
        if (rl.stdoutMuted) {
          rl.output.write("*");
        } else {
          rl.output.write(stringToWrite);
        }
      };
    }

    rl.question(prompt, (answer) => {
      rl.close();
      if (mask && rl.output) rl.output.write("\n");
      resolve(answer.trim());
    });
  });
}

async function collectCredentials(cliArgs) {
  const email =
    cliArgs.email ||
    process.env.TEST_LOGIN_EMAIL ||
    process.env.LOGIN_EMAIL ||
    "";
  const password =
    cliArgs.password ||
    process.env.TEST_LOGIN_PASSWORD ||
    process.env.LOGIN_PASSWORD ||
    "";

  if (!email && !process.stdin.isTTY) {
    throw new Error(
      "Email is required. Pass --email or set TEST_LOGIN_EMAIL (stdin is not interactive)."
    );
  }

  const finalEmail = email || (await question("Customer email: "));
  if (!finalEmail) {
    throw new Error("Email is required.");
  }

  const finalPassword =
    password ||
    (await question("Plain text password: ", {
      mask: true,
    }));

  if (!finalPassword) {
    throw new Error("Password cannot be empty.");
  }

  return { email: finalEmail, password: finalPassword };
}

async function run() {
  const cliArgs = parseArgs();
  if (cliArgs.help) {
    printHelp();
    return;
  }

  const baseUrl = DEFAULT_BASE.replace(/\/+$/, "");
  const pathSegment = LOGIN_PATH.startsWith("/")
    ? LOGIN_PATH
    : `/${LOGIN_PATH}`;
  const url = `${baseUrl}${pathSegment}`;

  const { email, password } = await collectCredentials(cliArgs);

  console.log(`🔐 Testing login for ${email} via ${url}`);

  const headers = {
    "Content-Type": "application/json",
  };
  if (PUBLISHABLE_KEY) {
    headers["x-publishable-api-key"] = PUBLISHABLE_KEY;
  }

  try {
    const { data } = await axios.post(
      url,
      { email, password },
      { headers, timeout: Number(process.env.LOGIN_TIMEOUT_MS || 10000) }
    );

    if (cliArgs.json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      const token = data?.token || data?.access_token || null;
      const customer = data?.customer || data?.customer_id || null;
      console.log("✅ Login succeeded.");
      if (token) {
        console.log(`  Token: ${token}`);
      }
      if (customer) {
        console.log(
          `  Customer: ${
            typeof customer === "string"
              ? customer
              : customer.email || customer.id || JSON.stringify(customer)
          }`
        );
      }
    }
  } catch (error) {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    console.error("❌ Login failed.");
    if (status) {
      console.error(`  Status: ${status}`);
    }
    if (message) {
      console.error(`  Message: ${message}`);
    }
    if (process.env.DEBUG) {
      console.error("  Debug:", error.response?.data || error.stack);
    }
    process.exitCode = 1;
  }
}

run();
