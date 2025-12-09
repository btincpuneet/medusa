import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";

import fetch from "node-fetch"
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
        SELECT * FROM mp_customers
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
        "SELECT * FROM mp_customers ORDER BY id DESC"
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
//     first_name,
//     last_name,
//     email,
//     phone,
//     gender,
//     dob,
//     name_prefix,

//     // address fields
//     address_name,
//     address_1,
//     address_2,
//     city,
//     country_code,
//     province,
//     postal_code,
//     address_phone,
//     metadata,

//     // ignore unwanted Magento fields
//     ...rest
//   } = req.body

//   // Validate required fields
//   if (!email || !first_name || !last_name) {
//     return res.status(400).json({
//       success: false,
//       message: "Email, first name, and last name are required",
//     })
//   }

//   const db = client()
//   await db.connect()

//   try {
//     await db.query("BEGIN")

//     const verificationToken =
//       Math.random().toString(36).substring(2) + Date.now().toString(36)
//     const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

//     // Insert into Customers table
//     const result = await db.query(
//       `
//       INSERT INTO customers (
//         email, password_hash, password_salt,
//         first_name, last_name, phone,
//         gender, date_of_birth, name_prefix,
//         account_status, email_verified,
//         verification_token, verification_token_expires_at,
//         preferences, created_at, updated_at, last_activity_at
//       )
//       VALUES (
//         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW(),NOW()
//       )
//       RETURNING id, email, first_name, last_name, phone, gender, date_of_birth
//       `,
//       [
//         email,
//         "dummyhash",
//         "dummysalt",
//         first_name,
//         last_name,
//         phone || null,
//         gender || null,
//         dob || null,
//         name_prefix || null,
//         "active",
//         false,
//         verificationToken,
//         verificationTokenExpiresAt,
//         JSON.stringify({})
//       ]
//     )

//     const customerId = result.rows[0].id

//     // Insert into customer_addresses table
// await db.query(
//   `
//   INSERT INTO customer_addresses (
//     customer_id,
//     address_type,
//     label,
//     is_default_shipping,
//     is_default_billing,
//     first_name,
//     last_name,
//     company,
//     phone,
//     address_line_1,
//     address_line_2,
//     city,
//     state,
//     country_code,
//     postal_code,
//     latitude,
//     longitude,
//     is_validated,
//     validation_response,
//     instructions,
//     neighborhood,
//     is_active,
//     metadata,
//     created_at,
//     updated_at,
//     address_name
//   )
//   VALUES (
//     $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,NOW(),NOW(),$24
//   )
//   `,
//   [
//     customerId,
//     "shipping",                  // address_type
//     address_name || "Primary Address", // label
//     true,                         // is_default_shipping
//     true,                         // is_default_billing
//     first_name,
//     last_name,
//     null,                         // company
//     address_phone || phone,
//     address_1 || 'address1',
//     address_2 || 'address2',
//     city || 'city',
//     province || null,
//     country_code || '12',
//     postal_code,
//     null,                         // latitude
//     null,                         // longitude
//     false,                        // is_validated
//     null,                         // validation_response
//     null,                         // instructions
//     null,                         // neighborhood
//     true,                         // is_active
//     metadata ? JSON.stringify(metadata) : JSON.stringify({}),
//     address_name || "Primary Address" // address_name
//   ]
// )


//     await db.query("COMMIT")
//     await db.end()

//     return res.json({
//       success: true,
//       customer: result.rows[0],
//       message: "Customer and address created successfully"
//     })

//   } catch (err: any) {
//     await db.query("ROLLBACK")
//     await db.end()
//     return res.status(500).json({
//       success: false,
//       message: "Error creating customer or address",
//       error: err.message,
//     })
//   }
// }

// export async function POST(req: MedusaRequest, res: MedusaResponse) {
//   const {
//     first_name,
//     last_name,
//     email,
//     phone,
//     gender,
//     dob,
//     name_prefix,

//     // address fields
//     address_name,
//     address_1,
//     address_2,
//     city,
//     country_id,
//     region_id,
//     postal_code,
//     address_phone,
//     phone_country_code,
//     metadata,
//   } = req.body;

//   if (!email || !first_name || !last_name) {
//     return res.status(400).json({
//       success: false,
//       message: "Email, first name, and last name are required",
//     });
//   }

//   const db = client();
//   await db.connect();

//   try {
//     await db.query("BEGIN");

//     // Verification token
//     const verificationToken =
//       Math.random().toString(36).substring(2) + Date.now().toString(36);
//     const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

//     // Insert into customers
//     const result = await db.query(
//       `
//       INSERT INTO mp_customers (
//         email, password_hash, password_salt,
//         first_name, last_name, phone,
//         gender, date_of_birth, name_prefix,
//         account_status, email_verified,
//         verification_token, verification_token_expires_at,
//         phone_country_code,
//         preferences,
//         created_at, updated_at, last_activity_at
//       )
//       VALUES (
//         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW(),NOW()
//       )
//       RETURNING id
//       `,
//       [
//         email,
//         "dummyhash",
//         "dummysalt",
//         first_name,
//         last_name,
//         phone || null,
//         gender || null,
//         dob || null,
//         name_prefix || null,
//         "active",
//         false,
//         verificationToken,
//         verificationTokenExpiresAt,
//         phone_country_code || null,
//         JSON.stringify({}),
//       ]
//     );

//     const customerId = result.rows[0].id;

//     // Fetch country name
//     const countryRes = await db.query(
//       `SELECT name FROM mp_countries WHERE id = $1`,
//       [country_id]
//     );

//     if (countryRes.rowCount === 0) throw new Error("Invalid country_id");

//     const countryName = countryRes.rows[0].name;

//     // Fetch region name + code
//     const regionRes = await db.query(
//       `SELECT name, code FROM mp_regions WHERE id = $1`,
//       [region_id]
//     );

//     if (regionRes.rowCount === 0) throw new Error("Invalid region_id");

//     const regionName = regionRes.rows[0].name;
//     const regionCode = regionRes.rows[0].code;

//     // Insert Address
//     await db.query(
//       `
//       INSERT INTO mp_customer_addresses (
//         customer_id,
//         address_type,
//         label,
//         is_default_shipping,
//         is_default_billing,
//         first_name,
//         last_name,
//         phone,
//         address_line_1,
//         address_line_2,
//         city,
//         region_id,
//         region_name,
//         region_code,
//         country_id,
//         country_name,
//         postal_code,
//         phone_country_code,
//         is_active,
//         metadata,
//         created_at,
//         updated_at,
//         address_name
//       )
//       VALUES (
//         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW(),NOW(),$21
//       )
//       `,
//       [
//         customerId,
//         "shipping",
//         address_name || "Primary Address",
//         true,
//         true,
//         first_name,
//         last_name,
//         address_phone || phone,
//         address_1 || 'address1',
//         address_2 || 'address2',
//         city || 'city',
//         region_id,
//         regionName,
//         regionCode,
//         country_id,
//         countryName,
//         postal_code,
//         phone_country_code,
//         true,
//         metadata ? JSON.stringify(metadata) : "{}",
//         address_name || "Primary Address",
//       ]
//     );

//     await db.query("COMMIT");
//     await db.end();

//     return res.json({
//       success: true,
//       message: "Customer & Address created successfully",
//     });

//   } catch (err: any) {
//     await db.query("ROLLBACK");
//     await db.end();
//     return res.status(500).json({
//       success: false,
//       message: "Error creating customer or address",
//       error: err.message,
//     });
//   }
// }



// Utility function → Get Lat & Lng
async function getLatLong(address: string) {
  const API_KEY = process.env.OPENCAGE_API_KEY  // <--- IMPORTANT

  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
    address
  )}&key=${API_KEY}`

  const res = await fetch(url)
  const data = await res.json()

  if (data.results && data.results.length > 0) {
    return {
      latitude: data.results[0].geometry.lat,
      longitude: data.results[0].geometry.lng,
    }
  }

  return { latitude: null, longitude: null }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const {
    first_name,
    last_name,
    email,
    phone,
    gender,
    dob,
    name_prefix,

    // address fields
    address_name,
    address_1,
    address_2,
    city,
    country_id,
    region_id,
    postal_code,
    address_phone,
    phone_country_code,
    metadata,
  } = req.body

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

    // Generate token
    const verificationToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36)
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 3600 * 1000)

    // Insert Customer
    const result = await db.query(
      `
      INSERT INTO mp_customers (
        email, password_hash, password_salt,
        first_name, last_name, phone,
        gender, date_of_birth, name_prefix,
        account_status, email_verified,
        verification_token, verification_token_expires_at,
        phone_country_code,
        preferences,
        created_at, updated_at, last_activity_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW(),NOW()
      )
      RETURNING id
      `,
      [
        email,
        "dummyhash",
        "dummysalt",
        first_name,
        last_name,
        phone || null,
        gender || null,
        dob || null,
        name_prefix || null,
        "active",
        false,
        verificationToken,
        verificationTokenExpiresAt,
        phone_country_code || null,
        JSON.stringify({}),
      ]
    )

    const customerId = result.rows[0].id

    // Country Name
    const countryRes = await db.query(
      `SELECT name FROM mp_countries WHERE id = $1`,
      [country_id]
    )

    if (countryRes.rowCount === 0) throw new Error("Invalid country_id")
    const countryName = countryRes.rows[0].name

    // Region Name
    const regionRes = await db.query(
      `SELECT name, code FROM mp_regions WHERE id = $1`,
      [region_id]
    )

    if (regionRes.rowCount === 0) throw new Error("Invalid region_id")
    const regionName = regionRes.rows[0].name
    const regionCode = regionRes.rows[0].code

    /* -----------------------------------------
        ⭐ GET Latitude + Longitude
    ----------------------------------------- */
    const fullAddress = `${address_1 || ""} ${address_2 || ""}, ${city || ""}, ${regionName}, ${countryName}, ${postal_code}`

    const { latitude, longitude } = await getLatLong(fullAddress)

    console.log("GEOCODED:", { fullAddress, latitude, longitude })

    // Insert Address with lat/long
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
        latitude,
        longitude,
        is_active,
        metadata,
        created_at,
        updated_at,
        address_name
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21,$22,NOW(),NOW(),$23
      )
      `,
      [
        customerId,
        "shipping",
        address_name || "Primary Address",
        true,
        true,
        first_name,
        last_name,
        address_phone || phone,
        address_1 || "address1",
        address_2 || "address2",
        city || "city",
        region_id,
        regionName,
        regionCode,
        country_id,
        countryName,
        postal_code,
        phone_country_code,
        latitude, // ⭐
        longitude, // ⭐
        true,
        metadata ? JSON.stringify(metadata) : "{}",
        address_name || "Primary Address",
      ]
    )

    await db.query("COMMIT")
    await db.end()

    return res.json({
      success: true,
      message: "Customer & Address created successfully",
      geo: { latitude, longitude },
    })
  } catch (err: any) {
    await db.query("ROLLBACK")
    await db.end()

    return res.status(500).json({
      success: false,
      message: "Error creating customer or address",
      error: err.message,
    })
  }
}







