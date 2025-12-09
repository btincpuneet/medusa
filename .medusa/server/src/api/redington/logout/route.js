"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const session_1 = require("../utils/session");
const POST = async (_req, res) => {
    (0, session_1.clearCustomerSession)(res);
    return res.json({ success: true });
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3JlZGluZ3Rvbi9sb2dvdXQvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsOENBQXVEO0FBRWhELE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxJQUFtQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNyRSxJQUFBLDhCQUFvQixFQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ3pCLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0FBQ3BDLENBQUMsQ0FBQTtBQUhZLFFBQUEsSUFBSSxRQUdoQiJ9