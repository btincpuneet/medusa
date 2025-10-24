# Admin Customizations

You can extend the Medusa Admin to add widgets and new pages. Your customizations interact with API routes to provide merchants with custom functionalities.

> Learn more about Admin Extensions in [this documentation](https://docs.medusajs.com/learn/fundamentals/admin).

## Role-based Admin Login

The admin dashboard now enforces role-based access. A session is only created when the signed-in user has at least one admin role flagged with `can_login = true`. On first successful login the user is provisioned with a **Super Admin** role that grants full access (`*` permission).

Manage roles from **Admin Roles** in the sidebar:

- Create roles and define whether they grant dashboard access.
- Assign permissions (comma or newline separated strings) that can be checked inside custom pages.
- Map users to roles by email. Each assignment is idempotent and can be revoked from the same screen.

Relevant API endpoints:

- `GET /admin/redington/admin-roles` – list roles.
- `POST /admin/redington/admin-roles` – create roles.
- `PUT /admin/redington/admin-roles/:id` / `DELETE /admin/redington/admin-roles/:id` – update or remove roles.
- `GET|POST /admin/redington/admin-roles/assignments` – list or assign roles to users.
- `DELETE /admin/redington/admin-roles/assignments/:id` – revoke a role assignment.
- `GET /admin/redington/admin-roles/me` – read the currently signed-in user's roles and permissions.

Use the returned `permissions` array to gate features inside admin routes as needed.

## Example: Create a Widget

A widget is a React component that can be injected into an existing page in the admin dashboard.

For example, create the file `src/admin/widgets/product-widget.tsx` with the following content:

```tsx title="src/admin/widgets/product-widget.tsx"
import { defineWidgetConfig } from "@medusajs/admin-sdk"

// The widget
const ProductWidget = () => {
  return (
    <div>
      <h2>Product Widget</h2>
    </div>
  )
}

// The widget's configurations
export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductWidget
```

This inserts a widget with the text “Product Widget” at the end of a product’s details page.
