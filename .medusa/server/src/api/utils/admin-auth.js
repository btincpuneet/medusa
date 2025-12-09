"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAdmin = void 0;
/**
  Lightweight admin guard:
  - Accepts existing Medusa admin sessions (req.auth_context or req.session.auth_context)
  - OR an Authorization: Bearer <ADMIN_BEARER_TOKEN> header (env ADMIN_BEARER_TOKEN)
*/
const ensureAdmin = (req, res, next) => {
    const authContext = req.auth_context || req.session?.auth_context;
    if (authContext && (authContext.actor_type === "user" || authContext.user_id)) {
        return next();
    }
    const header = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    const adminToken = process.env.ADMIN_BEARER_TOKEN || process.env.ADMIN_TOKEN;
    if (adminToken && header === adminToken) {
        return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
};
exports.ensureAdmin = ensureAdmin;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRtaW4tYXV0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9hcGkvdXRpbHMvYWRtaW4tYXV0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFNQTs7OztFQUlFO0FBQ0ssTUFBTSxXQUFXLEdBQUcsQ0FDekIsR0FBa0IsRUFDbEIsR0FBbUIsRUFDbkIsSUFBd0IsRUFDeEIsRUFBRTtJQUNGLE1BQU0sV0FBVyxHQUNkLEdBQVcsQ0FBQyxZQUFZLElBQUssR0FBVyxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUE7SUFFakUsSUFBSSxXQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxLQUFLLE1BQU0sSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUM5RSxPQUFPLElBQUksRUFBRSxDQUFBO0lBQ2YsQ0FBQztJQUVELE1BQU0sTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxhQUFhLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUNsRixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFBO0lBQzVFLElBQUksVUFBVSxJQUFJLE1BQU0sS0FBSyxVQUFVLEVBQUUsQ0FBQztRQUN4QyxPQUFPLElBQUksRUFBRSxDQUFBO0lBQ2YsQ0FBQztJQUVELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTtBQUMxRCxDQUFDLENBQUE7QUFuQlksUUFBQSxXQUFXLGVBbUJ2QiJ9