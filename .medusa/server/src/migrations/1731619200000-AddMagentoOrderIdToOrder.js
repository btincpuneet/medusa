"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMagentoOrderIdToOrder1731619200000 = void 0;
// @ts-nocheck
const typeorm_1 = require("typeorm");
class AddMagentoOrderIdToOrder1731619200000 {
    async up(queryRunner) {
        const hasColumn = await queryRunner.hasColumn("order", "magento_order_id");
        if (!hasColumn) {
            await queryRunner.addColumn("order", new typeorm_1.TableColumn({
                name: "magento_order_id",
                type: "varchar",
                length: "191",
                isNullable: true,
            }));
        }
        await queryRunner.createIndex("order", new typeorm_1.TableIndex({
            name: "IDX_order_magento_order_id",
            columnNames: ["magento_order_id"],
        }));
    }
    async down(queryRunner) {
        const hasIndex = await queryRunner.hasIndex("order", "IDX_order_magento_order_id");
        if (hasIndex) {
            await queryRunner.dropIndex("order", "IDX_order_magento_order_id");
        }
        const hasColumn = await queryRunner.hasColumn("order", "magento_order_id");
        if (hasColumn) {
            await queryRunner.dropColumn("order", "magento_order_id");
        }
    }
}
exports.AddMagentoOrderIdToOrder1731619200000 = AddMagentoOrderIdToOrder1731619200000;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMTczMTYxOTIwMDAwMC1BZGRNYWdlbnRvT3JkZXJJZFRvT3JkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbWlncmF0aW9ucy8xNzMxNjE5MjAwMDAwLUFkZE1hZ2VudG9PcmRlcklkVG9PcmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxjQUFjO0FBQ2QscUNBS2dCO0FBRWhCLE1BQWEscUNBQXFDO0lBR3pDLEtBQUssQ0FBQyxFQUFFLENBQUMsV0FBd0I7UUFDdEMsTUFBTSxTQUFTLEdBQUcsTUFBTSxXQUFXLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxDQUFBO1FBQzFFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNmLE1BQU0sV0FBVyxDQUFDLFNBQVMsQ0FDekIsT0FBTyxFQUNQLElBQUkscUJBQVcsQ0FBQztnQkFDZCxJQUFJLEVBQUUsa0JBQWtCO2dCQUN4QixJQUFJLEVBQUUsU0FBUztnQkFDZixNQUFNLEVBQUUsS0FBSztnQkFDYixVQUFVLEVBQUUsSUFBSTthQUNqQixDQUFDLENBQ0gsQ0FBQTtRQUNILENBQUM7UUFFRCxNQUFNLFdBQVcsQ0FBQyxXQUFXLENBQzNCLE9BQU8sRUFDUCxJQUFJLG9CQUFVLENBQUM7WUFDYixJQUFJLEVBQUUsNEJBQTRCO1lBQ2xDLFdBQVcsRUFBRSxDQUFDLGtCQUFrQixDQUFDO1NBQ2xDLENBQUMsQ0FDSCxDQUFBO0lBQ0gsQ0FBQztJQUVNLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBd0I7UUFDeEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxXQUFXLENBQUMsUUFBUSxDQUN6QyxPQUFPLEVBQ1AsNEJBQTRCLENBQzdCLENBQUE7UUFDRCxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQ2IsTUFBTSxXQUFXLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSw0QkFBNEIsQ0FBQyxDQUFBO1FBQ3BFLENBQUM7UUFFRCxNQUFNLFNBQVMsR0FBRyxNQUFNLFdBQVcsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLGtCQUFrQixDQUFDLENBQUE7UUFDMUUsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNkLE1BQU0sV0FBVyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQTtRQUMzRCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBeENELHNGQXdDQyJ9