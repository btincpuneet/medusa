"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCurrencyMapping1678886400000 = void 0;
const typeorm_1 = require("typeorm");
class CreateCurrencyMapping1678886400000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: "currency_mapping",
            columns: [
                {
                    name: "id",
                    type: "varchar",
                    isPrimary: true,
                },
                {
                    name: "country_code",
                    type: "varchar",
                },
                {
                    name: "currency_code",
                    type: "varchar",
                },
                {
                    name: "shipment_tracking_url",
                    type: "varchar",
                },
                {
                    name: "payment_method",
                    type: "varchar",
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()",
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "now()",
                },
            ],
        }), true);
    }
    async down(queryRunner) {
        await queryRunner.dropTable("currency_mapping");
    }
}
exports.CreateCurrencyMapping1678886400000 = CreateCurrencyMapping1678886400000;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMTY3ODg4NjQwMDAwMC1DcmVhdGVDdXJyZW5jeU1hcHBpbmcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbWlncmF0aW9ucy8xNjc4ODg2NDAwMDAwLUNyZWF0ZUN1cnJlbmN5TWFwcGluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxxQ0FBaUU7QUFFakUsTUFBYSxrQ0FBa0M7SUFDdEMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxXQUF3QjtRQUN0QyxNQUFNLFdBQVcsQ0FBQyxXQUFXLENBQzNCLElBQUksZUFBSyxDQUFDO1lBQ1IsSUFBSSxFQUFFLGtCQUFrQjtZQUN4QixPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsSUFBSSxFQUFFLElBQUk7b0JBQ1YsSUFBSSxFQUFFLFNBQVM7b0JBQ2YsU0FBUyxFQUFFLElBQUk7aUJBQ2hCO2dCQUNEO29CQUNFLElBQUksRUFBRSxjQUFjO29CQUNwQixJQUFJLEVBQUUsU0FBUztpQkFDaEI7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLGVBQWU7b0JBQ3JCLElBQUksRUFBRSxTQUFTO2lCQUNoQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsdUJBQXVCO29CQUM3QixJQUFJLEVBQUUsU0FBUztpQkFDaEI7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLGdCQUFnQjtvQkFDdEIsSUFBSSxFQUFFLFNBQVM7aUJBQ2hCO2dCQUNEO29CQUNFLElBQUksRUFBRSxZQUFZO29CQUNsQixJQUFJLEVBQUUsV0FBVztvQkFDakIsT0FBTyxFQUFFLE9BQU87aUJBQ2pCO2dCQUNEO29CQUNFLElBQUksRUFBRSxZQUFZO29CQUNsQixJQUFJLEVBQUUsV0FBVztvQkFDakIsT0FBTyxFQUFFLE9BQU87aUJBQ2pCO2FBQ0Y7U0FDRixDQUFDLEVBQ0YsSUFBSSxDQUNMLENBQUM7SUFDSixDQUFDO0lBRU0sS0FBSyxDQUFDLElBQUksQ0FBQyxXQUF3QjtRQUN4QyxNQUFNLFdBQVcsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNsRCxDQUFDO0NBQ0Y7QUE5Q0QsZ0ZBOENDIn0=