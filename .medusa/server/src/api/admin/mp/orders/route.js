"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pg_1 = require("pg");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function client() {
    return new pg_1.Client({ connectionString: process.env.DATABASE_URL });
}
// ====================================
// GET – Fetch all Orders
// ====================================
async function GET(req, res) {
    try {
        const db = client();
        await db.connect();
        // Read query parameter “q”
        const search = req.query.q ? String(req.query.q).trim() : "";
        let result;
        if (search !== "") {
            // 🔍 Filter by order ID, customer name, or customer email
            result = await db.query(`
        SELECT 
          o.*,
          COUNT(oi.id) as items_count
        FROM mp_orders o
        LEFT JOIN mp_order_items oi ON o.id = oi.order_id
        WHERE 
          o.id::TEXT LIKE $1
          OR LOWER(o.customer_first_name) LIKE LOWER($1)
          OR LOWER(o.customer_last_name) LIKE LOWER($1)
          OR LOWER(o.customer_email) LIKE LOWER($1)
        GROUP BY o.id
        ORDER BY o.id DESC
        `, [`%${search}%`]);
        }
        else {
            // No search → return all orders with item count
            result = await db.query(`
        SELECT 
          o.*,
          COUNT(oi.id) as items_count
        FROM mp_orders o
        LEFT JOIN mp_order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.id DESC
        `);
        }
        await db.end();
        return res.json({ success: true, orders: result.rows });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
            error: err.message
        });
    }
}
// ====================================
// POST – Create product (multi-table insert)
// ====================================
// Configure multer for disk storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'products');
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});
// Middleware to handle multer processing
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
async function POST(req, res) {
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
        // Insert product - FIXED: Using correct table name and columns
        const productResult = await db.query(`INSERT INTO mp_products
        (product_code, name, short_desc, long_desc, base_price, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
       RETURNING *`, [product_code, name, short_desc, long_desc, parseFloat(base_price), status]);
        const product = productResult.rows[0];
        const productId = product.id;
        // Insert gallery - FIXED: Using correct columns for mp_product_gallery
        for (const g of gallery) {
            await db.query(`INSERT INTO mp_product_gallery
          (product_id, image_type, label, image, created_at, updated_at)
         VALUES ($1,$2,$3,$4,NOW(),NOW())`, [productId, g.image_type, g.label, g.image]);
        }
        // Insert categories - FIXED: Using correct table name mp_product_categories
        for (const catId of categories) {
            await db.query(`INSERT INTO mp_product_categories
          (product_id, category_id, created_at)
         VALUES ($1,$2,NOW())`, [productId, catId]);
        }
        // Insert attributes - FIXED: Using correct table name mp_product_attributes
        for (const attr of attributes) {
            await db.query(`INSERT INTO mp_product_attributes
          (product_id, attribute_id, attribute_value_id, text_value, decimal_value, integer_value, boolean_value, date_value, datetime_value, media_path, sort_order, is_variant, locale, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`, [
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
            ]);
        }
        await db.query("COMMIT");
        await db.end();
        return res.json({
            success: true,
            product,
            gallery: gallery.map(g => ({ image: g.image, label: g.label })),
            message: "Product created successfully"
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
        console.error("Product creation error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to create product",
            error: err.message
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL21wL29yZGVycy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQWFBLGtCQXVEQztBQXVERCxvQkFpTEM7QUExU0QsMkJBQTRCO0FBQzVCLG9EQUE0QjtBQUM1Qiw0Q0FBb0I7QUFDcEIsZ0RBQXdCO0FBQ3hCLFNBQVMsTUFBTTtJQUNiLE9BQU8sSUFBSSxXQUFNLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7QUFDcEUsQ0FBQztBQUVELHVDQUF1QztBQUN2Qyx5QkFBeUI7QUFDekIsdUNBQXVDO0FBQ2hDLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsR0FBRyxNQUFNLEVBQUUsQ0FBQztRQUNwQixNQUFNLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVuQiwyQkFBMkI7UUFDM0IsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFFN0QsSUFBSSxNQUFNLENBQUM7UUFFWCxJQUFJLE1BQU0sS0FBSyxFQUFFLEVBQUUsQ0FBQztZQUNsQiwwREFBMEQ7WUFDMUQsTUFBTSxHQUFHLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FDckI7Ozs7Ozs7Ozs7Ozs7U0FhQyxFQUNELENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUNoQixDQUFDO1FBQ0osQ0FBQzthQUFNLENBQUM7WUFDTixnREFBZ0Q7WUFDaEQsTUFBTSxHQUFHLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FDckI7Ozs7Ozs7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