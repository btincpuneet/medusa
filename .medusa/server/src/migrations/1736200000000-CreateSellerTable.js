"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSellerTable1736200000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateSellerTable1736200000000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: "seller",
            columns: [
                {
                    name: "id",
                    type: "varchar",
                    isPrimary: true,
                },
                {
                    name: "name",
                    type: "varchar",
                    isNullable: false,
                },
                {
                    name: "email",
                    type: "varchar",
                    isNullable: false,
                    isUnique: true,
                },
                {
                    name: "password_hash",
                    type: "text",
                    isNullable: true,
                },
                {
                    name: "admin_user_id",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "status",
                    type: "varchar",
                    isNullable: false,
                    default: "'active'",
                },
                {
                    name: "subscription_plan",
                    type: "varchar",
                    isNullable: false,
                    default: "'FREE'",
                },
                {
                    name: "allowed_services",
                    type: "text",
                    isArray: true,
                    isNullable: false,
                    default: "'{}'",
                },
                {
                    name: "created_at",
                    type: "timestamptz",
                    default: "now()",
                },
                {
                    name: "updated_at",
                    type: "timestamptz",
                    default: "now()",
                },
                {
                    name: "deleted_at",
                    type: "timestamptz",
                    isNullable: true,
                },
            ],
        }), true);
        await queryRunner.createIndex("seller", new typeorm_1.TableIndex({
            name: "IDX_seller_email_unique",
            columnNames: ["email"],
            isUnique: true,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropIndex("seller", "IDX_seller_email_unique");
        await queryRunner.dropTable("seller");
    }
}
exports.CreateSellerTable1736200000000 = CreateSellerTable1736200000000;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMTczNjIwMDAwMDAwMC1DcmVhdGVTZWxsZXJUYWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9taWdyYXRpb25zLzE3MzYyMDAwMDAwMDAtQ3JlYXRlU2VsbGVyVGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUNBS2dCO0FBRWhCLE1BQWEsOEJBQThCO0lBQ2xDLEtBQUssQ0FBQyxFQUFFLENBQUMsV0FBd0I7UUFDdEMsTUFBTSxXQUFXLENBQUMsV0FBVyxDQUMzQixJQUFJLGVBQUssQ0FBQztZQUNSLElBQUksRUFBRSxRQUFRO1lBQ2QsT0FBTyxFQUFFO2dCQUNQO29CQUNFLElBQUksRUFBRSxJQUFJO29CQUNWLElBQUksRUFBRSxTQUFTO29CQUNmLFNBQVMsRUFBRSxJQUFJO2lCQUNoQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsTUFBTTtvQkFDWixJQUFJLEVBQUUsU0FBUztvQkFDZixVQUFVLEVBQUUsS0FBSztpQkFDbEI7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLE9BQU87b0JBQ2IsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsVUFBVSxFQUFFLEtBQUs7b0JBQ2pCLFFBQVEsRUFBRSxJQUFJO2lCQUNmO2dCQUNEO29CQUNFLElBQUksRUFBRSxlQUFlO29CQUNyQixJQUFJLEVBQUUsTUFBTTtvQkFDWixVQUFVLEVBQUUsSUFBSTtpQkFDakI7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLGVBQWU7b0JBQ3JCLElBQUksRUFBRSxTQUFTO29CQUNmLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsUUFBUTtvQkFDZCxJQUFJLEVBQUUsU0FBUztvQkFDZixVQUFVLEVBQUUsS0FBSztvQkFDakIsT0FBTyxFQUFFLFVBQVU7aUJBQ3BCO2dCQUNEO29CQUNFLElBQUksRUFBRSxtQkFBbUI7b0JBQ3pCLElBQUksRUFBRSxTQUFTO29CQUNmLFVBQVUsRUFBRSxLQUFLO29CQUNqQixPQUFPLEVBQUUsUUFBUTtpQkFDbEI7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLGtCQUFrQjtvQkFDeEIsSUFBSSxFQUFFLE1BQU07b0JBQ1osT0FBTyxFQUFFLElBQUk7b0JBQ2IsVUFBVSxFQUFFLEtBQUs7b0JBQ2pCLE9BQU8sRUFBRSxNQUFNO2lCQUNoQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsWUFBWTtvQkFDbEIsSUFBSSxFQUFFLGFBQWE7b0JBQ25CLE9BQU8sRUFBRSxPQUFPO2lCQUNqQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsWUFBWTtvQkFDbEIsSUFBSSxFQUFFLGFBQWE7b0JBQ25CLE9BQU8sRUFBRSxPQUFPO2lCQUNqQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsWUFBWTtvQkFDbEIsSUFBSSxFQUFFLGFBQWE7b0JBQ25CLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjthQUNGO1NBQ0YsQ0FBQyxFQUNGLElBQUksQ0FDTCxDQUFBO1FBRUQsTUFBTSxXQUFXLENBQUMsV0FBVyxDQUMzQixRQUFRLEVBQ1IsSUFBSSxvQkFBVSxDQUFDO1lBQ2IsSUFBSSxFQUFFLHlCQUF5QjtZQUMvQixXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUM7WUFDdEIsUUFBUSxFQUFFLElBQUk7U0FDZixDQUFDLENBQ0gsQ0FBQTtJQUNILENBQUM7SUFFTSxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQXdCO1FBQ3hDLE1BQU0sV0FBVyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUseUJBQXlCLENBQUMsQ0FBQTtRQUNoRSxNQUFNLFdBQVcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUE7SUFDdkMsQ0FBQztDQUNGO0FBckZELHdFQXFGQyJ9