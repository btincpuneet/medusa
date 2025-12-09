"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
exports.DELETE = DELETE;
const pg_1 = require("pg");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function client() {
    return new pg_1.Client({ connectionString: process.env.DATABASE_URL });
}
// ====================================
// GET – Fetch single product with relations (fixed)
// ====================================
// export async function GET(req: MedusaRequest, res: MedusaResponse) {
//   const { id } = req.params;
//   try {
//     const db = client();
//     await db.connect();
//     const product = await db.query("SELECT * FROM mp_products WHERE id = $1", [id]);
//     if (product.rows.length === 0) {
//       return res.status(404).json({ success: false, message: "Product not found" });
//     }
//     const categories = await db.query(
//       `SELECT c.id, c.name FROM mp_categories c 
//        JOIN mp_product_categories pc ON pc.category_id = c.id
//        WHERE pc.product_id = $1`,
//       [id]
//     );
//     const gallery = await db.query("SELECT * FROM mp_product_gallery WHERE product_id = $1", [id]);
//     const attributes = await db.query(
//       `SELECT pa.*, a.label, av.value 
//        FROM mp_product_attributes pa
//        JOIN mp_attributes a ON a.id = pa.attribute_id
//        JOIN mp_attribute_values av ON av.id = pa.attribute_value_id
//        WHERE pa.product_id = $1`,
//       [id]
//     );
//     await db.end();
//     return res.json({
//       success: true,
//       product: product.rows[0],
//       gallery: gallery.rows,
//       categories: categories.rows,
//       categoryIds: categories.rows.map((c) => c.id), // <<< THIS LINE FIXES YOUR ISSUE
//       attributes: attributes.rows
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch product",
//       error: err.message
//     });
//   }
// }
// Also update your GET endpoint to fetch product with attributes and gallery
async function GET(req, res) {
    const { id } = req.params;
    const db = client();
    await db.connect();
    try {
        // Get product
        const productResult = await db.query(`SELECT * FROM mp_products WHERE id = $1`, [id]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        const product = productResult.rows[0];
        console.log('products', product);
        // Get categories
        const categoriesResult = await db.query(`SELECT category_id FROM mp_product_categories WHERE product_id = $1`, [id]);
        const categoryIds = categoriesResult.rows.map(row => row.category_id);
        console.log('categoryIDS', categoryIds);
        // Get gallery
        const galleryResult = await db.query(`SELECT * FROM mp_product_gallery WHERE product_id = $1`, [id]);
        const gallery = galleryResult.rows;
        console.log('gallery', gallery);
        // Get attributes
        const attributesResult = await db.query(`SELECT * FROM mp_product_attributes WHERE product_id = $1`, [id]);
        const attributes = attributesResult.rows;
        console.log('attributes', attributes);
        await db.end();
        return res.json({
            success: true,
            product,
            categoryIds,
            gallery,
            attributes
        });
    }
    catch (err) {
        await db.end();
        console.error("Product fetch error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch product",
            error: err.message
        });
    }
}
// ====================================
// PUT – Update product + relations
// ====================================
// export async function PUT(req: MedusaRequest, res: MedusaResponse) {
//   const { id } = req.params;
//   const {
//     product_code,
//     name,
//     short_desc,
//     long_desc,
//     base_price,
//     status,
//     gallery = [],
//     categories = [],
//     attributes = []
//   } = req.body;
//   const db = client();
//   await db.connect();
//   try {
//     await db.query("BEGIN");
//     // 1. Update product
//     await db.query(
//       `UPDATE mp_products SET
//         product_code = $1,
//         name = $2,
//         short_desc = $3,
//         long_desc = $4,
//         base_price = $5,
//         status = $6,
//         updated_at = NOW()
//        WHERE id = $7`,
//       [product_code, name, short_desc, long_desc, base_price, status, id]
//     );
//     // 2. Reset & insert gallery
//     await db.query("DELETE FROM mp_product_gallery WHERE product_id = $1", [id]);
//     for (const g of gallery) {
//       await db.query(
//         `INSERT INTO mp_product_gallery (product_id, image_type, label, image_url, created_at, updated_at)
//          VALUES ($1,$2,$3,$4,NOW(),NOW())`,
//         [id, g.image_type, g.label, g.image_url]
//       );
//     }
//     // 3. Reset & insert categories
//     await db.query("DELETE FROM mp_product_categories WHERE product_id = $1", [id]);
//     for (const catId of categories) {
//       await db.query(
//         `INSERT INTO mp_product_categories (product_id, category_id, created_at)
//          VALUES ($1,$2,NOW())`,
//         [id, catId]
//       );
//     }
//     // 4. Reset & insert attributes
//     await db.query("DELETE FROM mp_product_attributes WHERE product_id = $1", [id]);
//     for (const a of attributes) {
//       await db.query(
//         `INSERT INTO mp_product_attributes (product_id, attribute_id, attribute_value_id, created_at, updated_at)
//          VALUES ($1,$2,$3,NOW(),NOW())`,
//         [id, a.attribute_id, a.attribute_value_id]
//       );
//     }
//     await db.query("COMMIT");
//     await db.end();
//     return res.json({
//       success: true,
//       message: "Product updated successfully"
//     });
//   } catch (err) {
//     await db.query("ROLLBACK");
//     await db.end();
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update product",
//       error: err.message
//     });
//   }
// }
// Configure multer for disk storage (same as POST)
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'products');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});
const processFormData = (req, res) => {
    return new Promise((resolve, reject) => {
        upload.any()(req, res, (err) => {
            if (err)
                reject(err);
            else
                resolve(true);
        });
    });
};
async function PUT(req, res) {
    const { id } = req.params;
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
        // Extract categories
        let categories = [];
        if (req.body.categories) {
            if (Array.isArray(req.body.categories)) {
                categories = req.body.categories.map(id => parseInt(id));
            }
            else if (typeof req.body.categories === 'string') {
                categories = [parseInt(req.body.categories)];
            }
        }
        // Handle categories[] format
        if (req.body['categories[]']) {
            if (Array.isArray(req.body['categories[]'])) {
                categories = req.body['categories[]'].map(id => parseInt(id));
            }
            else {
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
                    }
                    catch (e) {
                        console.error('Failed to parse attribute:', attr);
                        return null;
                    }
                }).filter(attr => attr !== null);
            }
            else if (typeof req.body.attributes === 'string') {
                try {
                    attributes = [JSON.parse(req.body.attributes)];
                }
                catch (e) {
                    console.error('Failed to parse attributes string:', e);
                }
            }
        }
        // Handle existing gallery images
        let existingGallery = [];
        if (req.body.existing_gallery) {
            try {
                existingGallery = typeof req.body.existing_gallery === 'string'
                    ? JSON.parse(req.body.existing_gallery)
                    : req.body.existing_gallery;
            }
            catch (e) {
                console.error('Failed to parse existing gallery:', e);
            }
        }
        // Handle new gallery files from req.files
        const galleryFiles = req.files || [];
        const newGallery = [];
        // Process new gallery files
        for (const file of galleryFiles) {
            if (file.fieldname === 'gallery') {
                const fileUrl = `/uploads/products/${file.filename}`;
                newGallery.push({
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
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            });
            return res.status(400).json({
                success: false,
                message: "Missing required fields: product_code, name, and base_price are required"
            });
        }
        await db.query("BEGIN");
        // 1. Update product
        const productResult = await db.query(`UPDATE mp_products SET
        product_code = $1,
        name = $2,
        short_desc = $3,
        long_desc = $4,
        base_price = $5,
        status = $6,
        updated_at = NOW()
       WHERE id = $7
       RETURNING *`, [product_code, name, short_desc, long_desc, parseFloat(base_price), status, id]);
        const product = productResult.rows[0];
        if (!product) {
            throw new Error("Product not found");
        }
        // 2. Handle gallery - delete all existing and insert combined gallery
        await db.query("DELETE FROM mp_product_gallery WHERE product_id = $1", [id]);
        // Combine existing and new gallery images
        const allGallery = [...existingGallery, ...newGallery];
        for (const g of allGallery) {
            await db.query(`INSERT INTO mp_product_gallery
          (product_id, image_type, label, image, created_at, updated_at)
         VALUES ($1,$2,$3,$4,NOW(),NOW())`, [id, g.image_type, g.label, g.image]);
        }
        // 3. Reset & insert categories
        await db.query("DELETE FROM mp_product_categories WHERE product_id = $1", [id]);
        for (const catId of categories) {
            await db.query(`INSERT INTO mp_product_categories
          (product_id, category_id, created_at)
         VALUES ($1,$2,NOW())`, [id, catId]);
        }
        // 4. Reset & insert attributes (supports ALL types)
        await db.query("DELETE FROM mp_product_attributes WHERE product_id = $1", [id]);
        for (const attr of attributes) {
            await db.query(`INSERT INTO mp_product_attributes
          (product_id, attribute_id, attribute_value_id, text_value, decimal_value, integer_value, boolean_value, date_value, datetime_value, media_path, sort_order, is_variant, locale, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`, [
                id,
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
            ]);
        }
        await db.query("COMMIT");
        await db.end();
        return res.json({
            success: true,
            product,
            message: "Product updated successfully"
        });
    }
    catch (err) {
        await db.query("ROLLBACK");
        await db.end();
        // Clean up uploaded files on error
        if (req.files) {
            req.files.forEach(file => {
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            });
        }
        console.error("Product update error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to update product",
            error: err.message
        });
    }
}
// ====================================
// DELETE – Remove product
// ====================================
async function DELETE(req, res) {
    const { id } = req.params;
    try {
        const db = client();
        await db.connect();
        const result = await db.query("DELETE FROM mp_products WHERE id = $1 RETURNING id", [id]);
        await db.end();
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        return res.json({
            success: true,
            message: "Product deleted",
            id: result.rows[0].id
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete product",
            error: err.message
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL3Byb2R1Y3QvcHJvZHVjdHMvW2lkXS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQWlFQSxrQkE4REM7QUF1SUQsa0JBMk1DO0FBT0Qsd0JBK0JDO0FBcmZELDJCQUE0QjtBQUM1QixvREFBNEI7QUFDNUIsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQUN4QixTQUFTLE1BQU07SUFDYixPQUFPLElBQUksV0FBTSxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFRCx1Q0FBdUM7QUFDdkMsb0RBQW9EO0FBQ3BELHVDQUF1QztBQUV2Qyx1RUFBdUU7QUFDdkUsK0JBQStCO0FBRS9CLFVBQVU7QUFDViwyQkFBMkI7QUFDM0IsMEJBQTBCO0FBRTFCLHVGQUF1RjtBQUN2Rix1Q0FBdUM7QUFDdkMsdUZBQXVGO0FBQ3ZGLFFBQVE7QUFFUix5Q0FBeUM7QUFDekMsbURBQW1EO0FBQ25ELGdFQUFnRTtBQUNoRSxvQ0FBb0M7QUFDcEMsYUFBYTtBQUNiLFNBQVM7QUFFVCxzR0FBc0c7QUFFdEcseUNBQXlDO0FBQ3pDLHlDQUF5QztBQUN6Qyx1Q0FBdUM7QUFDdkMsd0RBQXdEO0FBQ3hELHNFQUFzRTtBQUN0RSxvQ0FBb0M7QUFDcEMsYUFBYTtBQUNiLFNBQVM7QUFFVCxzQkFBc0I7QUFFdEIsd0JBQXdCO0FBQ3hCLHVCQUF1QjtBQUN2QixrQ0FBa0M7QUFDbEMsK0JBQStCO0FBQy9CLHFDQUFxQztBQUNyQyx5RkFBeUY7QUFDekYsb0NBQW9DO0FBQ3BDLFVBQVU7QUFFVixvQkFBb0I7QUFDcEIsb0NBQW9DO0FBQ3BDLHdCQUF3QjtBQUN4Qiw0Q0FBNEM7QUFDNUMsMkJBQTJCO0FBQzNCLFVBQVU7QUFDVixNQUFNO0FBQ04s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