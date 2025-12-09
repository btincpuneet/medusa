"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SellerService = void 0;
const typeorm_1 = require("typeorm");
const seller_1 = require("./seller");
const service_1 = require("./service");
let SellerService = class SellerService {
};
exports.SellerService = SellerService;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SellerService.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => seller_1.Seller, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "seller_id" }),
    __metadata("design:type", seller_1.Seller)
], SellerService.prototype, "seller", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SellerService.prototype, "seller_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_1.Service, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "service_id" }),
    __metadata("design:type", service_1.Service)
], SellerService.prototype, "service", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SellerService.prototype, "service_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SellerService.prototype, "created_at", void 0);
exports.SellerService = SellerService = __decorate([
    (0, typeorm_1.Entity)()
], SellerService);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsbGVyLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbW9kZWxzL3NlbGxlci1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLHFDQU9nQjtBQUVoQixxQ0FBaUM7QUFDakMsdUNBQW1DO0FBRzVCLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWE7Q0FvQnpCLENBQUE7QUFwQlksc0NBQWE7QUFFeEI7SUFEQyxJQUFBLGdDQUFzQixFQUFDLE1BQU0sQ0FBQzs7eUNBQ3JCO0FBSVY7SUFGQyxJQUFBLG1CQUFTLEVBQUMsR0FBRyxFQUFFLENBQUMsZUFBTSxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBQ2hELElBQUEsb0JBQVUsRUFBQyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsQ0FBQzs4QkFDMUIsZUFBTTs2Q0FBQTtBQUdkO0lBREMsSUFBQSxnQkFBTSxHQUFFOztnREFDUTtBQUlqQjtJQUZDLElBQUEsbUJBQVMsRUFBQyxHQUFHLEVBQUUsQ0FBQyxpQkFBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBQ2pELElBQUEsb0JBQVUsRUFBQyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsQ0FBQzs4QkFDMUIsaUJBQU87OENBQUE7QUFHaEI7SUFEQyxJQUFBLGdCQUFNLEdBQUU7O2lEQUNTO0FBR2xCO0lBREMsSUFBQSwwQkFBZ0IsR0FBRTs4QkFDUCxJQUFJO2lEQUFBO3dCQW5CTCxhQUFhO0lBRHpCLElBQUEsZ0JBQU0sR0FBRTtHQUNJLGFBQWEsQ0FvQnpCIn0=