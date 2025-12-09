"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerService = void 0;
const argon2_1 = __importDefault(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const utils_1 = require("@medusajs/framework/utils");
const seller_1 = require("../repositories/seller");
// Subscription plan drives the default visible tabs/services for a seller dashboard.
const DEFAULT_ALLOWED_SERVICES = {
    FREE: ["Orders"],
    BASIC: ["Orders", "Products"],
    PRO: ["Orders", "Products", "Analytics"],
    ENTERPRISE: ["Orders", "Products", "Analytics", "Payouts", "Settings"],
};
const normalizeEmail = (value) => (value || "").trim().toLowerCase();
const sanitizeServices = (services) => {
    if (!Array.isArray(services)) {
        return [];
    }
    const set = new Set(services
        .map((entry) => (entry || "").trim())
        .filter((entry) => entry.length > 0));
    return Array.from(set.values());
};
class SellerService {
    constructor(manager) {
        this.manager = manager;
        this.repository = (0, seller_1.getSellerRepository)(manager);
    }
    static fromRequest(req) {
        let manager = null;
        try {
            manager = req.scope.resolve(utils_1.ContainerRegistrationKeys.MANAGER);
        }
        catch {
            try {
                manager = req.scope.resolve("manager");
            }
            catch {
                manager = null;
            }
        }
        if (!manager) {
            throw new Error("Database manager is not available for seller service.");
        }
        return new SellerService(manager);
    }
    getDefaultServices(plan) {
        return DEFAULT_ALLOWED_SERVICES[plan] ?? DEFAULT_ALLOWED_SERVICES.FREE;
    }
    async getById(id) {
        return this.repository.findOne({
            where: { id },
        });
    }
    async getByEmail(email) {
        const normalized = normalizeEmail(email);
        if (!normalized) {
            return null;
        }
        return this.repository.findOne({
            where: { email: normalized },
        });
    }
    async listAll() {
        return this.repository.find({
            order: { created_at: "DESC" },
        });
    }
    async createSeller(input) {
        const normalizedEmail = normalizeEmail(input.email);
        if (!normalizedEmail) {
            throw new Error("Seller email is required.");
        }
        const existing = await this.getByEmail(normalizedEmail);
        if (existing) {
            throw new Error("A seller with this email already exists.");
        }
        const plan = input.subscription_plan ?? "FREE";
        const allowed = sanitizeServices(input.allowed_services) || this.getDefaultServices(plan);
        const seller = this.repository.create({
            name: input.name || input.vendor_name || input.contact_name || normalizedEmail,
            vendor_name: input.vendor_name ?? input.name ?? null,
            contact_name: input.contact_name ?? null,
            phone: input.phone ?? null,
            role: input.role ?? "OWNER",
            email: normalizedEmail,
            admin_user_id: input.admin_user_id ?? null,
            status: input.status ?? "active",
            subscription_plan: plan,
            allowed_services: allowed.length ? allowed : this.getDefaultServices(plan),
            password_hash: null,
        });
        if (input.password) {
            seller.password_hash = await argon2_1.default.hash(input.password);
        }
        return this.repository.save(seller);
    }
    async updateSeller(id, data) {
        const seller = await this.getById(id);
        if (!seller) {
            throw new Error("Seller not found.");
        }
        if (data.email) {
            const normalized = normalizeEmail(data.email);
            if (!normalized) {
                throw new Error("A valid email is required.");
            }
            if (normalized !== seller.email) {
                const conflict = await this.getByEmail(normalized);
                if (conflict && conflict.id !== seller.id) {
                    throw new Error("A seller with this email already exists.");
                }
            }
            seller.email = normalized;
        }
        if (data.name)
            seller.name = data.name;
        if (data.vendor_name !== undefined)
            seller.vendor_name = data.vendor_name;
        if (data.contact_name !== undefined)
            seller.contact_name = data.contact_name;
        if (data.phone !== undefined)
            seller.phone = data.phone;
        if (data.role)
            seller.role = data.role;
        if (data.status) {
            seller.status = data.status;
        }
        if (data.subscription_plan) {
            seller.subscription_plan = data.subscription_plan;
        }
        if (Array.isArray(data.allowed_services)) {
            const services = sanitizeServices(data.allowed_services);
            seller.allowed_services = services.length
                ? services
                : this.getDefaultServices(seller.subscription_plan);
        }
        if (data.admin_user_id !== undefined) {
            seller.admin_user_id = data.admin_user_id;
        }
        return this.repository.save(seller);
    }
    async updateAllowedServices(id, services) {
        return this.updateSeller(id, {
            allowed_services: sanitizeServices(services),
        });
    }
    async updateSubscriptionPlan(id, plan) {
        const seller = await this.getById(id);
        if (!seller) {
            throw new Error("Seller not found.");
        }
        seller.subscription_plan = plan;
        seller.allowed_services = this.getDefaultServices(plan);
        return this.repository.save(seller);
    }
    async setPassword(id, password) {
        const seller = await this.getById(id);
        if (!seller) {
            throw new Error("Seller not found.");
        }
        seller.password_hash = await argon2_1.default.hash(password);
        return this.repository.save(seller);
    }
    async authenticate(email, password) {
        const seller = await this.getByEmail(email);
        if (!seller) {
            throw new Error("Seller not found.");
        }
        if (!seller.password_hash) {
            throw new Error("Seller password is not set. Ask an admin to set a password.");
        }
        if (seller.status !== "active") {
            throw new Error("Seller account is inactive.");
        }
        const isValid = await argon2_1.default.verify(seller.password_hash, password);
        if (!isValid) {
            throw new Error("Invalid email or password.");
        }
        return seller;
    }
    async verifyPassword(seller, password) {
        if (!seller.password_hash)
            return false;
        return argon2_1.default.verify(seller.password_hash, password);
    }
    issueToken(seller) {
        const payload = {
            seller_id: seller.id,
            email: seller.email,
            subscription_plan: seller.subscription_plan,
            allowed_services: seller.allowed_services,
            status: seller.status,
        };
        const secret = process.env.SELLER_JWT_SECRET ||
            process.env.JWT_SECRET ||
            "seller-jwt-secret";
        // Seller JWT deliberately scoped to seller payload only; no admin claims leak here.
        const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: "7d" });
        return { token, payload };
    }
    verifyToken(token) {
        const secret = process.env.SELLER_JWT_SECRET ||
            process.env.JWT_SECRET ||
            "seller-jwt-secret";
        return jsonwebtoken_1.default.verify(token, secret);
    }
}
exports.SellerService = SellerService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsbGVyLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc2VydmljZXMvc2VsbGVyLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0RBQTJCO0FBQzNCLGdFQUE4QjtBQUU5QixxREFBcUU7QUFJckUsbURBRytCO0FBRS9CLHFGQUFxRjtBQUNyRixNQUFNLHdCQUF3QixHQUE2QztJQUN6RSxJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUM7SUFDaEIsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQztJQUM3QixHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQztJQUN4QyxVQUFVLEVBQUUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDO0NBQ3ZFLENBQUE7QUFFRCxNQUFNLGNBQWMsR0FBRyxDQUFDLEtBQXFCLEVBQUUsRUFBRSxDQUMvQyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUVwQyxNQUFNLGdCQUFnQixHQUFHLENBQUMsUUFBbUIsRUFBWSxFQUFFO0lBQ3pELElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDN0IsT0FBTyxFQUFFLENBQUE7SUFDWCxDQUFDO0lBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQ2pCLFFBQVE7U0FDTCxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ3BDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FDdkMsQ0FBQTtJQUVELE9BQU8sS0FBSyxDQUFD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