import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// GET – Fetch single customer with addresses
// ====================================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;

  try {
    const db = client();
    await db.connect();

    // Fetch customer
    const customerRes = await db.query("SELECT * FROM mp_customers WHERE id = $1", [id]);
    if (customerRes.rows.length === 0) {
      await db.end();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
    const customer = customerRes.rows[0];

    // Fetch addresses
    const addressesRes = await db.query(
      "SELECT * FROM mp_customer_addresses WHERE customer_id = $1",
      [id]
    );
    const addresses = addressesRes.rows;

    await db.end();

    return res.json({
      success: true,
      customer: { ...customer, addresses },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
      error: err.message,
    });
  }
}

// ====================================
// PUT – Update customer + addresses
// ====================================
// export async function PUT(req: MedusaRequest, res: MedusaResponse) {
//   const { id } = req.params;

//   const {
//     first_name,
//     last_name,
//     email,
//     phone,
//     gender,
//     date_of_birth,
//     name_prefix,
//     addresses = []
//   } = req.body;

//   const db = client();
//   await db.connect();

//   try {
//     await db.query("BEGIN");

//     // 1. Update customer
//     await db.query(
//       `UPDATE customers SET
//         first_name = $1,
//         last_name = $2,
//         email = $3,
//         phone = $4,
//         gender = $5,
//         date_of_birth = $6,
//         name_prefix = $7,
//         updated_at = NOW()
//        WHERE id = $9`,
//       [first_name, last_name, email, phone, gender, date_of_birth, name_prefix, id]
//     );

//     // 2. Reset & insert addresses
//     await db.query("DELETE FROM customer_addresses WHERE customer_id = $1", [id]);
//     for (const addr of addresses) {
//       await db.query(
//         `INSERT INTO customer_addresses (
//           customer_id, address_type, label, is_default_shipping, is_default_billing,
//           first_name, last_name, company, phone, address_line_1, address_line_2,
//           city, state, country_code, postal_code, latitude, longitude, is_validated,
//           validation_response, instructions, neighborhood, is_active, metadata, created_at, updated_at
//         ) VALUES (
//           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,NOW(),NOW()
//         )`,
//         [
//           id,
//           addr.address_type || "shipping",
//           addr.label || "Primary Address",
//           addr.is_default_shipping ?? true,
//           addr.is_default_billing ?? true,
//           addr.first_name || first_name,
//           addr.last_name || last_name,
//           addr.company || null,
//           addr.phone || phone,
//           addr.address_line_1,
//           addr.address_line_2 || null,
//           addr.city,
//           addr.state || null,
//           addr.country_code,
//           addr.postal_code,
//           addr.latitude || null,
//           addr.longitude || null,
//           addr.is_validated || false,
//           addr.validation_response || null,
//           addr.instructions || null,
//           addr.neighborhood || null,
//           addr.is_active ?? true,
//           addr.metadata ? JSON.stringify(addr.metadata) : JSON.stringify({})
//         ]
//       );
//     }

//     await db.query("COMMIT");
//     await db.end();

//     return res.json({
//       success: true,
//       message: "Customer updated successfully"
//     });

//   } catch (err: any) {
//     await db.query("ROLLBACK");
//     await db.end();
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update customer",
//       error: err.message
//     });
//   }
// }


export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  const {
    first_name,
    last_name,
    email,
    phone,
    gender,
    date_of_birth,
    name_prefix,
    phone_country_code,
    address_name,
    address_line_1,
    address_line_2,
    city,
    region_id,
    postal_code,
    address_phone,
    metadata,
  } = req.body

  const db = client()
  await db.connect()

  try {
    await db.query("BEGIN")

    // =========================
    // Update customer
    // =========================
    await db.query(
      `UPDATE mp_customers SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        gender = $5,
        date_of_birth = $6,
        name_prefix = $7,
        phone_country_code = $8,
        updated_at = NOW()
      WHERE id = $9`,
      [
        first_name,
        last_name,
        email,
        phone,
        gender,
        date_of_birth,
        name_prefix,
        phone_country_code,
        id,
      ]
    )

    // =========================
    // Delete old addresses
    // =========================
    await db.query(`DELETE FROM mp_customer_addresses WHERE customer_id = $1`, [id])

    // =========================
    // Insert new enriched address
    // =========================
    await db.query(
      `
      INSERT INTO mp_customer_addresses (
        customer_id,
        address_type,
        label,
        is_default_shipping,
        is_default_billing,
        first_name,
        last_name,
        phone,
        address_line_1,
        address_line_2,
        city,
        region_id,
        region_name,
        region_code,
        country_id,
        country_name,
        postal_code,
        phone_country_code,
        is_active,
        metadata,
        created_at,
        updated_at,
        address_name
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW(),NOW(),$21
      )
      `,
      [
        id,
        "shipping",
        address_name || "Primary Address",
        true,
        true,
        first_name,
        last_name,
        address_phone || phone,
        address_line_1,
        address_line_2,
        city,
        region_id,
        postal_code,
        phone_country_code,
        true,
        metadata ? JSON.stringify(metadata) : "{}",
        address_name || "Primary Address",
      ]
    )

    await db.query("COMMIT")
    await db.end()

    return res.json({
      success: true,
      message: "Customer updated successfully",
    })
  } catch (err: any) {
    await db.query("ROLLBACK")
    await db.end()
    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: err.message,
    })
  }
}

// ====================================
// DELETE – Remove customer
// ====================================
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;

  try {
    const db = client();
    await db.connect();

    const result = await db.query(
      "DELETE FROM mp_customers WHERE id = $1 RETURNING id",
      [id]
    );

    await db.query("DELETE FROM customer_addresses WHERE customer_id = $1", [id]);
    await db.end();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    return res.json({
      success: true,
      message: "Customer deleted",
      id: result.rows[0].id
    });

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      error: err.message
    });
  }
}
