# Manage Domain (Medusa)

This Medusa backend now exposes CRUD endpoints that mirror the Magento
“Manage Domain” admin screen. The data is stored in a new Postgres table
`redington_domain`, created automatically on first use.

## Endpoints

All endpoints live under the admin namespace and require an authenticated
admin session/token.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/admin/redington/domains` | List all domains (newest first) |
| `POST` | `/admin/redington/domains` | Create a domain (`{ domain_name, is_active? }`) |
| `GET` | `/admin/redington/domains/:id` | Retrieve a single domain |
| `PUT` | `/admin/redington/domains/:id` | Update `domain_name` and/or `is_active` |
| `DELETE` | `/admin/redington/domains/:id` | Remove the domain |

### Payloads

```jsonc
// POST /admin/redington/domains
{
  "domain_name": "redington-ksa",
  "is_active": true // optional, defaults to true
}

// PUT /admin/redington/domains/:id
{
  "domain_name": "new-name",      // optional
  "is_active": false              // optional
}
```

### Response shape

```json
{
  "domain": {
    "id": 1,
    "domain_name": "redington-ksa",
    "is_active": true,
    "created_at": "2024-10-07T13:00:00.000Z",
    "updated_at": "2024-10-07T13:00:00.000Z"
  }
}
```

## Environment

The endpoints rely on `DATABASE_URL` (already required by Medusa). On first call
they create the `redington_domain` table with the following structure:

```sql
CREATE TABLE redington_domain (
  id SERIAL PRIMARY KEY,
  domain_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Next steps

You can call these endpoints from the Medusa Admin UI or your storefront to
display and manage domains, replacing the Magento “Manage Domain” screen. If
you need migrations from Magento’s `epp_domain` table, create a one-time job
that reads from Magento’s API (`/V1/access-mapping/getDomainDetails/`) and
persists the results using the `POST` endpoint above. A ready-made script is
available:

```bash
npx ts-node scripts/migrate-domains.ts
```

It fetches all Magento domain rows (using `countryCode: "ALL"`) and upserts them
into the `redington_domain` table.
