# Testing Migrated Customer Logins

Use `scripts/test-customer-login.js` to quickly verify whether a Magento-migrated customer can authenticate against the Medusa storefront using their plain text password.

## Prerequisites

- `.env` configured with your Medusa host. The script reads `MEDUSA_STORE_URL` or `MEDUSA_BASE_URL` (falls back to `http://localhost:9000`).
- Optional: `MEDUSA_PUBLISHABLE_KEY`/`MEDUSA_PUB_KEY` if your store API requires a publishable key header.
- Node dependencies installed (`axios` is already part of the workspace).

## Running the Script

```bash
node scripts/test-customer-login.js --email user@example.com
```

You can pass the password via `--password`, or omit it to be prompted (input is masked). The script accepts these environment fallbacks so you can avoid passing secrets on the command line:

- `TEST_LOGIN_EMAIL` / `LOGIN_EMAIL`
- `TEST_LOGIN_PASSWORD` / `LOGIN_PASSWORD`

Other optional env overrides:

- `CUSTOMER_LOGIN_PATH` (default `/store/migrate-login`)
- `LOGIN_TIMEOUT_MS` (default `10000`)

Pass `--json` to dump the raw response from Medusa if you need to inspect the returned token/customer payload.

Exit code is `0` on success, `1` on failed authentication (it also prints the status/message returned by the backend for easier debugging).
