"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
exports.DELETE = DELETE;
const pg_1 = require("pg");
function client() {
    return new pg_1.Client({ connectionString: process.env.DATABASE_URL });
}
// ====================================
// GET – Fetch single customer with addresses
// ====================================
async function GET(req, res) {
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
        const addressesRes = await db.query("SELECT * FROM mp_customer_addresses WHERE customer_id = $1", [id]);
        const addresses = addressesRes.rows;
        await db.end();
        return res.json({
            success: true,
            customer: { ...customer, addresses },
        });
    }
    catch (err) {
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
async function PUT(req, res) {
    const { id } = req.params;
    const { first_name, last_name, email, phone, gender, date_of_birth, name_prefix, phone_country_code, address_name, address_line_1, address_line_2, city, region_id, postal_code, address_phone, metadata, } = req.body;
    const db = client();
    await db.connect();
    try {
        await db.query("BEGIN");
        // =========================
        // Update customer
        // =========================
        await db.query(`UPDATE mp_customers SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        gender = $5,
        date_of_birth = $6,
        name_prefix = $7,
        phone_country_code = $8,
        updated_at = NOW()
      WHERE id = $9`, [
            first_name,
            last_name,
            email,
            phone,
            gender,
            date_of_birth,
            name_prefix,
            phone_country_code,
            id,
        ]);
        // =========================
        // Delete old addresses
        // =========================
        await db.query(`DELETE FROM mp_customer_addresses WHERE customer_id = $1`, [id]);
        // =========================
        // Insert new enriched address
        // =========================
        await db.query(`
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
      `, [
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
        ]);
        await db.query("COMMIT");
        await db.end();
        return res.json({
            success: true,
            message: "Customer updated successfully",
        });
    }
    catch (err) {
        await db.query("ROLLBACK");
        await db.end();
        return res.status(500).json({
            success: false,
            message: "Failed to update customer",
            error: err.message,
        });
    }
}
// ====================================
// DELETE – Remove customer
// ====================================
async function DELETE(req, res) {
    const { id } = req.params;
    try {
        const db = client();
        await db.connect();
        const result = await db.query("DELETE FROM mp_customers WHERE id = $1 RETURNING id", [id]);
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
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete customer",
            error: err.message
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL3JlZGluZ3Rvbi1jdXN0b21lcnMvW2lkXS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVdBLGtCQW1DQztBQW9HRCxrQkFvSUM7QUFLRCx3QkFnQ0M7QUF6VEQsMkJBQTRCO0FBRTVCLFNBQVMsTUFBTTtJQUNiLE9BQU8sSUFBSSxXQUFNLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7QUFDcEUsQ0FBQztBQUVELHVDQUF1QztBQUN2Qyw2Q0FBNkM7QUFDN0MsdUNBQXVDO0FBQ2hDLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztJQUUxQixJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsR0FBRyxNQUFNLEVBQUUsQ0FBQztRQUNwQixNQUFNLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVuQixpQkFBaUI7UUFDakIsTUFBTSxXQUFXLEdBQUcsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyRixJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ2xDLE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLG9CQUFvQixFQUFFLENBQUMsQ0FBQztRQUNqRixDQUFDO1FBQ0QsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMs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