import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { Client } from "pg";
import multer from 'multer';
import fs from 'fs';
import path from 'path';
function client() {
  return new Client({ connectionString: process.env.DATABASE_URL });
}

// ====================================
// GET – Fetch all products
// ====================================
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const db = client();
    await db.connect();

    // Read query parameter “q”
    const search = req.query.q ? String(req.query.q).trim() : "";

    let result;

    if (search !== "") {
      // 🔍 Filter by name or product_code
      result = await db.query(
        `
        SELECT * FROM mp_products
        WHERE 
          LOWER(name) LIKE LOWER($1)
          OR LOWER(product_code) LIKE LOWER($1)
        ORDER BY id DESC
        `,
        [`%${search}%`]
      );
    } else {
      // No search → return all products
      result = await db.query(
        "SELECT * FROM mp_products ORDER BY id DESC"
      );
    }

    await db.end();

    return res.json({ success: true, products: result.rows });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message
    });
  }
}


// ====================================
// POST – Create product (multi-table insert)
// ====================================




// // Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'products');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware to handle multer processing
const processFormData = (req, res) => {
  return new Promise((resolve, reject) => {
    upload.any()(req, res, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const db = client();
  await db.connect();

  try {
    // Process form data with multer
    await processFormData(req, res);

    // Extract form fields from req.body
    const product_code = req.body.product_code;
    const name = req.body.name;
    const short_desc = req.body.short_desc;
    const long_desc = req.body.long_desc;
    const base_price = req.body.base_price;
    const status = req.body.status || 'active';
    
    // Extract arrays - handle both string and array formats
    let categories = [];
    if (req.body.categories) {
      if (Array.isArray(req.body.categories)) {
        categories = req.body.categories.map(id => parseInt(id));
      } else if (typeof req.body.categories === 'string') {
        categories = [parseInt(req.body.categories)];
      }
    }

    // Handle categories[] format
    if (req.body['categories[]']) {
      if (Array.isArray(req.body['categories[]'])) {
        categories = req.body['categories[]'].map(id => parseInt(id));
      } else {
        categories = [parseInt(req.body['categories[]'])];
      }
    }

    // Parse attributes
    let attributes = [];
    if (req.body.attributes) {
      if (Array.isArray(req.body.attributes)) {
        attributes = req.body.attributes.map(attr => {
          try {
            return typeof attr === 'string' ? JSON.parse(attr) : attr;
          } catch (e) {
            console.error('Failed to parse attribute:', attr);
            return null;
          }
        }).filter(attr => attr !== null);
      } else if (typeof req.body.attributes === 'string') {
        try {
          attributes = [JSON.parse(req.body.attributes)];
        } catch (e) {
          console.error('Failed to parse attributes string:', e);
        }
      }
    }

    // Handle gallery files from req.files
    const galleryFiles = req.files || [];
    const gallery = [];
    
    // Process gallery files and save to local storage
    for (const file of galleryFiles) {
      if (file.fieldname === 'gallery' || file.fieldname.startsWith('gallery_')) {
        // File is already saved by multer, now we just need the path/URL
        const fileUrl = `/uploads/products/${file.filename}`;
        
        gallery.push({
          image_type: "gallery",
          label: file.originalname || 'gallery_image',
          image: fileUrl,
        });
      }
    }

    // Validate required fields
    if (!product_code || !name || !base_price) {
      // Clean up uploaded files if validation fails
      galleryFiles.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      
      return res.status(400).json({
        success: false,
        message: "Missing required fields: product_code, name, and base_price are required"
      });
    }

    await db.query("BEGIN");

    // Insert product - FIXED: Using correct table name and columns
    const productResult = await db.query(
      `INSERT INTO mp_products
        (product_code, name, short_desc, long_desc, base_price, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
       RETURNING *`,
      [product_code, name, short_desc, long_desc, parseFloat(base_price), status]
    );

    const product = productResult.rows[0];
    const productId = product.id;

    // Insert gallery - FIXED: Using correct columns for mp_product_gallery
    for (const g of gallery) {
      await db.query(
        `INSERT INTO mp_product_gallery
          (product_id, image_type, label, image, created_at, updated_at)
         VALUES ($1,$2,$3,$4,NOW(),NOW())`,
        [productId, g.image_type, g.label, g.image]
      );
    }

    // Insert categories - FIXED: Using correct table name mp_product_categories
    for (const catId of categories) {
      await db.query(
        `INSERT INTO mp_product_categories
          (product_id, category_id, created_at)
         VALUES ($1,$2,NOW())`,
        [productId, catId]
      );
    }

    // Insert attributes - FIXED: Using correct table name mp_product_attributes
    for (const attr of attributes) {
      await db.query(
        `INSERT INTO mp_product_attributes
          (product_id, attribute_id, attribute_value_id, text_value, decimal_value, integer_value, boolean_value, date_value, datetime_value, media_path, sort_order, is_variant, locale, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
        [
          productId,
          attr.attribute_id,
          attr.attribute_value_id || null,
          attr.text_value || null,
          attr.decimal_value || null,
          attr.integer_value || null,
          (attr.boolean_value === false || attr.boolean_value === true) ? attr.boolean_value : null,
          attr.date_value || null,
          attr.datetime_value || null,
          attr.media_path || null,
          attr.sort_order || 0,
          attr.is_variant ?? false,
          attr.locale || "en"
        ]
      );
    }

    await db.query("COMMIT");
    await db.end();

    return res.json({
      success: true,
      product,
      gallery: gallery.map(g => ({ image: g.image, label: g.label })),
      message: "Product created successfully"
    });

  } catch (err) {
    await db.query("ROLLBACK");
    await db.end();
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    console.error("Product creation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: err.message
    });
  }
}



// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = path.join(process.cwd(), 'uploads', 'products');
    
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
    
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const ext = path.extname(file.originalname);
//     cb(null, 'product-' + uniqueSuffix + ext);
//   }
// });

// const upload = multer({ 
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024,
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   }
// });

// const processFormData = (req, res) => {
//   return new Promise((resolve, reject) => {
//     upload.any()(req, res, (err) => {
//       if (err) reject(err);
//       else resolve(true);
//     });
//   });
// };

// export async function PUT(req: MedusaRequest, res: MedusaResponse) {
//   const { id } = req.params;
//   const db = client();
//   await db.connect();

//   try {
//     // Process form data with multer
//     await processFormData(req, res);

//     // Extract form fields from req.body
//     const product_code = req.body.product_code;
//     const name = req.body.name;
//     const short_desc = req.body.short_desc || null;
//     const long_desc = req.body.long_desc || null;
//     const base_price = req.body.base_price;
//     const status = req.body.status || 'active';
//     const visibility = req.body.visibility || 'catalogsearch'; // Add this field
//     const attribute_set = req.body.attribute_set || null; // Add this field
    
//     // Extract categories
//     let categories = [];
    
//     // Check multiple possible formats for categories
//     if (req.body.categories && Array.isArray(req.body.categories)) {
//       categories = req.body.categories.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
//     } else if (req.body.categories && typeof req.body.categories === 'string') {
//       const parsed = parseInt(req.body.categories, 10);
//       if (!isNaN(parsed)) categories = [parsed];
//     }
    
//     // Check for 'categories[]' format (common in form submissions)
//     if (req.body['categories[]']) {
//       if (Array.isArray(req.body['categories[]'])) {
//         categories = req.body['categories[]']
//           .map(id => parseInt(id, 10))
//           .filter(id => !isNaN(id));
//       } else if (typeof req.body['categories[]'] === 'string') {
//         const parsed = parseInt(req.body['categories[]'], 10);
//         if (!isNaN(parsed)) categories = [parsed];
//       }
//     }
    
//     // Also check for 'categories' as comma-separated string
//     if (!categories.length && req.body.categories && typeof req.body.categories === 'string' && req.body.categories.includes(',')) {
//       categories = req.body.categories
//         .split(',')
//         .map(id => parseInt(id.trim(), 10))
//         .filter(id => !isNaN(id));
//     }

//     // Parse attributes
//     let attributes = [];
//     if (req.body.attributes) {
//       if (Array.isArray(req.body.attributes)) {
//         attributes = req.body.attributes.map(attr => {
//           try {
//             if (typeof attr === 'string') {
//               return JSON.parse(attr);
//             }
//             return attr;
//           } catch (e) {
//             console.error('Failed to parse attribute:', attr);
//             return null;
//           }
//         }).filter(attr => attr !== null);
//       } else if (typeof req.body.attributes === 'string') {
//         try {
//           // Try to parse as JSON array
//           const parsed = JSON.parse(req.body.attributes);
//           if (Array.isArray(parsed)) {
//             attributes = parsed;
//           } else if (parsed && typeof parsed === 'object') {
//             attributes = [parsed];
//           }
//         } catch (e) {
//           console.error('Failed to parse attributes string:', e);
//         }
//       }
//     }

//     // Handle existing gallery images
//     let existingGallery = [];
//     if (req.body.existing_gallery) {
//       try {
//         existingGallery = typeof req.body.existing_gallery === 'string' 
//           ? JSON.parse(req.body.existing_gallery) 
//           : req.body.existing_gallery;
          
//         // Ensure it's an array
//         if (!Array.isArray(existingGallery)) {
//           existingGallery = [];
//         }
//       } catch (e) {
//         console.error('Failed to parse existing gallery:', e);
//         existingGallery = [];
//       }
//     }

//     // Handle new gallery files from req.files
//     const galleryFiles = Array.isArray(req.files) ? req.files : [];
//     const newGallery = [];
    
//     // Process new gallery files
//     for (const file of galleryFiles) {
//       // Check if it's a gallery image (could be named gallery_0, gallery_1, etc. or just 'gallery')
//       if (file.fieldname.startsWith('gallery') || file.fieldname === 'gallery') {
//         const fileUrl = `/uploads/products/${file.filename}`;
        
//         newGallery.push({
//           image_type: "gallery",
//           label: file.originalname || 'gallery_image',
//           image: fileUrl,
//         });
//       }
//     }

//     // Validate required fields
//     if (!product_code || !name || !base_price) {
//       // Clean up uploaded files if validation fails
//       galleryFiles.forEach(file => {
//         if (fs.existsSync(file.path)) {
//           fs.unlinkSync(file.path);
//         }
//       });
      
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: product_code, name, and base_price are required"
//       });
//     }

//     await db.query("BEGIN");

//     // 1. Update product - ADD MISSING FIELDS
//     const productResult = await db.query(
//       `UPDATE mp_products SET
//         product_code = $1,
//         name = $2,
//         short_desc = $3,
//         long_desc = $4,
//         base_price = $5,
//         status = $6,
//         visibility = $7,
//         attribute_set = $8,
//         updated_at = NOW()
//        WHERE id = $9
//        RETURNING *`,
//       [
//         product_code, 
//         name, 
//         short_desc, 
//         long_desc, 
//         parseFloat(base_price), 
//         status,
//         visibility,
//         attribute_set,
//         id
//       ]
//     );

//     const product = productResult.rows[0];

//     if (!product) {
//       throw new Error("Product not found");
//     }

//     // 2. Handle gallery - delete all existing and insert combined gallery
//     await db.query("DELETE FROM mp_product_gallery WHERE product_id = $1", [id]);
    
//     // Combine existing and new gallery images
//     const allGallery = [...existingGallery, ...newGallery];
//     if (allGallery.length > 0) {
//       for (const g of allGallery) {
//         await db.query(
//           `INSERT INTO mp_product_gallery
//             (product_id, image_type, label, image, created_at, updated_at)
//            VALUES ($1,$2,$3,$4,NOW(),NOW())`,
//           [id, g.image_type || 'gallery', g.label || 'Image', g.image]
//         );
//       }
//     }

//     // 3. Reset & insert categories
//     await db.query("DELETE FROM mp_product_categories WHERE product_id = $1", [id]);
//     if (categories.length > 0) {
//       for (const catId of categories) {
//         await db.query(
//           `INSERT INTO mp_product_categories
//             (product_id, category_id, created_at)
//            VALUES ($1,$2,NOW())`,
//           [id, catId]
//         );
//       }
//     }

//     // 4. Reset & insert attributes (supports ALL types)
//     await db.query("DELETE FROM mp_product_attributes WHERE product_id = $1", [id]);
//     if (attributes.length > 0) {
//       for (const attr of attributes) {
//         // Handle attribute_value_ids for multiselect
//         if (attr.attribute_value_ids && Array.isArray(attr.attribute_value_ids)) {
//           // For multiselect, insert multiple rows
//           for (const valueId of attr.attribute_value_ids) {
//             await db.query(
//               `INSERT INTO mp_product_attributes
//                 (product_id, attribute_id, attribute_value_id, text_value, decimal_value, integer_value, boolean_value, date_value, datetime_value, media_path, sort_order, is_variant, locale, created_at, updated_at)
//                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
//               [
//                 id,
//                 attr.attribute_id,
//                 valueId, // Use the individual valueId
//                 null, // text_value
//                 null, // decimal_value
//                 null, // integer_value
//                 null, // boolean_value
//                 null, // date_value
//                 null, // datetime_value
//                 null, // media_path
//                 attr.sort_order || 0,
//                 attr.is_variant ?? false,
//                 attr.locale || "en"
//               ]
//             );
//           }
//         } else {
//           // For single value attributes
//           await db.query(
//             `INSERT INTO mp_product_attributes
//               (product_id, attribute_id, attribute_value_id, text_value, decimal_value, integer_value, boolean_value, date_value, datetime_value, media_path, sort_order, is_variant, locale, created_at, updated_at)
//              VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
//             [
//               id,
//               attr.attribute_id,
//               attr.attribute_value_id || null,
//               attr.text_value || null,
//               attr.decimal_value || null,
//               attr.integer_value || null,
//               (attr.boolean_value === false || attr.boolean_value === true) ? attr.boolean_value : null,
//               attr.date_value || null,
//               attr.datetime_value || null,
//               attr.media_path || null,
//               attr.sort_order || 0,
//               attr.is_variant ?? false,
//               attr.locale || "en"
//             ]
//           );
//         }
//       }
//     }

//     await db.query("COMMIT");
//     await db.end();

//     return res.json({
//       success: true,
//       product,
//       message: "Product updated successfully"
//     });

//   } catch (err) {
//     // Ensure we rollback and end connection
//     try {
//       await db.query("ROLLBACK");
//     } catch (rollbackErr) {
//       console.error("Rollback error:", rollbackErr);
//     }
    
//     try {
//       await db.end();
//     } catch (endErr) {
//       console.error("Connection end error:", endErr);
//     }
    
//     // Clean up uploaded files on error
//     if (req.files && Array.isArray(req.files)) {
//       req.files.forEach(file => {
//         if (file && file.path && fs.existsSync(file.path)) {
//           try {
//             fs.unlinkSync(file.path);
//           } catch (unlinkErr) {
//             console.error("Failed to delete file:", unlinkErr);
//           }
//         }
//       });
//     }
    
//     console.error("Product update error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update product",
//       error: err.message
//     });
//   }
// }


