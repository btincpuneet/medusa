"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("pg");
const node_fetch_1 = __importDefault(require("node-fetch"));
function client() {
    return new pg_1.Client({ connectionString: process.env.DATABASE_URL });
}
// ====================================
// GET – Fetch all customers
// ====================================
async function GET(req, res) {
    try {
        const db = client();
        await db.connect();
        const search = req.query.q ? String(req.query.q).trim() : "";
        let result;
        if (search !== "") {
            result = await db.query(`
        SELECT * FROM mp_customers
        WHERE 
          LOWER(email) LIKE LOWER($1)
          OR LOWER(first_name) LIKE LOWER($1)
          OR LOWER(last_name) LIKE LOWER($1)
          OR phone LIKE $1
        ORDER BY id DESC
        `, [`%${search}%`]);
        }
        else {
            result = await db.query("SELECT * FROM mp_customers ORDER BY id DESC");
        }
        await db.end();
        return res.json({ success: true, customers: result.rows });
    }
    catch (err) {
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
async function getLatLong(address) {
    const API_KEY = process.env.OPENCAGE_API_KEY; // <--- IMPORTANT
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${API_KEY}`;
    const res = await (0, node_fetch_1.default)(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
        return {
            latitude: data.results[0].geometry.lat,
            longitude: data.results[0].geometry.lng,
        };
    }
    return { latitude: null, longitude: null };
}
async function POST(req, res) {
    const { first_name, last_name, email, phone, gender, dob, name_prefix, 
    // address fields
    address_name, address_1, address_2, city, country_id, region_id, postal_code, address_phone, phone_country_code, metadata, } = req.body;
    if (!email || !first_name || !last_name) {
        return res.status(400).json({
            success: false,
            message: "Email, first name, and last name are required",
        });
    }
    const db = client();
    await db.connect();
    try {
        await db.query("BEGIN");
        // Generate token
        const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const verificationTokenExpiresAt = new Date(Date.now() + 24 * 3600 * 1000);
        // Insert Customer
        const result = await db.query(`
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
      `, [
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
        ]);
        const customerId = result.rows[0].id;
        // Country Name
        const countryRes = await db.query(`SELECT name FROM mp_countries WHERE id = $1`, [country_id]);
        if (countryRes.rowCount === 0)
            throw new Error("Invalid country_id");
        const countryName = countryRes.rows[0].name;
        // Region Name
        const regionRes = await db.query(`SELECT name, code FROM mp_regions WHERE id = $1`, [region_id]);
        if (regionRes.rowCount === 0)
            throw new Error("Invalid region_id");
        const regionName = regionRes.rows[0].name;
        const regionCode = regionRes.rows[0].code;
        /* -----------------------------------------
            ⭐ GET Latitude + Longitude
        ----------------------------------------- */
        const fullAddress = `${address_1 || ""} ${address_2 || ""}, ${city || ""}, ${regionName}, ${countryName}, ${postal_code}`;
        const { latitude, longitude } = await getLatLong(fullAddress);
        console.log("GEOCODED:", { fullAddress, latitude, longitude });
        // Insert Address with lat/long
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
      `, [
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
        ]);
        await db.query("COMMIT");
        await db.end();
        return res.json({
            success: true,
            message: "Customer & Address created successfully",
            geo: { latitude, longitude },
        });
    }
    catch (err) {
        await db.query("ROLLBACK");
        await db.end();
        return res.status(500).json({
            success: false,
            message: "Error creating customer or address",
            error: err.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL3JlZGluZ3Rvbi1jdXN0b21lcnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFZQSxrQkF1Q0M7QUFzWEQsb0JBNExDO0FBbm1CRCwyQkFBNEI7QUFFNUIsNERBQThCO0FBQzlCLFNBQVMsTUFBTTtJQUNiLE9BQU8sSUFBSSxXQUFNLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7QUFDcEUsQ0FBQztBQUVELHVDQUF1QztBQUN2Qyw0QkFBNEI7QUFDNUIsdUNBQXVDO0FBQ2hDLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsR0FBRyxNQUFNLEVBQUUsQ0FBQztRQUNwQixNQUFNLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVuQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUU3RCxJQUFJLE1BQU0sQ0FBQztRQUVYLElBQUksTUFBTSxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQ2xCLE1BQU0sR0FBRyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQ3JCOzs7Ozs7OztTQVFDLEVBQ0QsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQ2hCLENBQUM7UUFDSixDQUFDO2FBQU0sQ0FBQztZQUNOLE1BQU0sR0FBRyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQ3JCLDZDQUE2QyxDQUM5QyxDQUFDO1FBQ0osQ0FBQztRQUVELE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFD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