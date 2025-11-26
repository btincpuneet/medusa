import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// GET – Fetch all customers
// ====================================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    const search = req.query.q ? String(req.query.q).trim() : "";

    let result;

    if (search !== "") {
      result = await db.query(
        `
        SELECT * FROM customers
        WHERE 
          LOWER(email) LIKE LOWER($1)
          OR LOWER(first_name) LIKE LOWER($1)
          OR LOWER(last_name) LIKE LOWER($1)
          OR phone LIKE $1
        ORDER BY id DESC
        `,
        [`%${search}%`]
      );
    } else {
      result = await db.query(
        "SELECT * FROM customers ORDER BY id DESC"
      );
    }

    await db.end();

    return res.json({ success: true, customers: result.rows });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: err.message,
    });
  }
}



// ====================================
// POST – Create customer
// ====================================
// export async function POST(req: MedusaRequest, res: MedusaResponse) {
//   const {
//     email,
//     password_hash,
//     password_salt,
//     first_name,
//     last_name,
//     phone,
//     date_of_birth,
//     gender,
//     account_status,
//     email_verified,
//     verification_token,
//     verification_token_expires_at,
//     accepts_marketing,
//     newsletter_subscribed,
//     preferences,
//     last_login_at,
//     failed_login_attempts,
//     lock_until,
//     password_reset_token,
//     password_reset_expires_at,
//     external_customer_id,
//     source_platform,
//   } = req.body;

//   const db = client();
//   await db.connect();

//   try {
//     await db.query("BEGIN");

//     // Insert customer
//     const customerResult = await db.query(
//       `
//       INSERT INTO customers (
//         email,
//         password_hash,
//         password_salt,
//         first_name,
//         last_name,
//         phone,
//         date_of_birth,
//         gender,
//         account_status,
//         email_verified,
//         verification_token,
//         verification_token_expires_at,
//         accepts_marketing,
//         newsletter_subscribed,
//         preferences,
//         last_login_at,
//         failed_login_attempts,
//         lock_until,
//         password_reset_token,
//         password_reset_expires_at,
//         external_customer_id,
//         source_platform,
//         created_at,
//         updated_at,
//         last_activity_at
//       ) VALUES (
//         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
//         $13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
//         NOW(),NOW(),NOW()
//       )
//       RETURNING *
//       `,
//       [
//         email,
//         password_hash,
//         password_salt,
//         first_name,
//         last_name,
//         phone,
//         date_of_birth,
//         gender,
//         account_status ?? "active",
//         email_verified ?? false,
//         verification_token,
//         verification_token_expires_at,
//         accepts_marketing ?? false,
//         newsletter_subscribed ?? false,
//         preferences ?? {},
//         last_login_at,
//         failed_login_attempts ?? 0,
//         lock_until,
//         password_reset_token,
//         password_reset_expires_at,
//         external_customer_id,
//         source_platform ?? "medusa",
//       ]
//     );

//     const customer = customerResult.rows[0];

//     await db.query("COMMIT");
//     await db.end();

//     return res.json({
//       success: true,
//       customer,
//       message: "Customer created successfully",
//     });

//   } catch (err) {
//     await db.query("ROLLBACK");
//     await db.end();
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create customer",
//       error: err.message,
//     });
//   }
// }



export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const {
    first_name,
    last_name,
    email,
    phone,
    // Remove account_status from request body since Medusa doesn't accept it
  } = req.body

  // Validate required fields
  if (!email || !first_name || !last_name) {
    return res.status(400).json({
      success: false,
      message: "Email, first name, and last name are required",
    })
  }

  const db = client()
  await db.connect()

  try {
    await db.query("BEGIN")

    // Generate a unique verification token
    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

    // Use default 'active' status since we can't pass it from the UI
    const accountStatus = 'active'

    const result = await db.query(
      `
      INSERT INTO customers (
        email,
        password_hash,
        password_salt,
        first_name,
        last_name,
        phone,
        account_status,
        email_verified,
        verification_token,
        verification_token_expires_at,
        preferences,
        created_at,
        updated_at,
        last_activity_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW(), NOW()
      )
      RETURNING id, email, first_name, last_name, phone, account_status, created_at
      `,
      [
        email,
        'dummyhash',
        'dummysalt',
        first_name,
        last_name,
        phone || null,
        accountStatus, // Use default value
        false,
        verificationToken,
        verificationTokenExpiresAt,
        JSON.stringify({})
      ]
    )

    await db.query("COMMIT")
    await db.end()

    return res.json({
      success: true,
      customer: result.rows[0],
      message: "Customer created successfully",
    })
  } catch (err: any) {
    await db.query("ROLLBACK")
    await db.end()

    if (err.code === '23505') {
      return res.status(400).json({
        success: false,
        message: "A customer with this email already exists",
        error: err.message,
      })
    }

    return res.status(500).json({
      success: false,
      message: "Error creating customer",
      error: err.message,
    })
  }
}


