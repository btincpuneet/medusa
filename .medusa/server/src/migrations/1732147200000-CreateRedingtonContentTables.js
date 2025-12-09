"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRedingtonContentTables1732147200000 = void 0;
const typeorm_1 = require("typeorm");
class CreateRedingtonContentTables1732147200000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: "redington_category",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                },
                {
                    name: "parent_id",
                    type: "int",
                    isNullable: true,
                },
                {
                    name: "name",
                    type: "varchar",
                },
                {
                    name: "is_active",
                    type: "boolean",
                    default: true,
                },
                {
                    name: "position",
                    type: "int",
                    default: 0,
                },
                {
                    name: "level",
                    type: "int",
                    default: 0,
                },
                {
                    name: "product_count",
                    type: "int",
                    default: 0,
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
            ],
            foreignKeys: [
                {
                    columnNames: ["parent_id"],
                    referencedColumnNames: ["id"],
                    referencedTableName: "redington_category",
                    onDelete: "SET NULL",
                },
            ],
        }));
        await queryRunner.createIndex("redington_category", new typeorm_1.TableIndex({
            name: "IDX_redington_category_parent_id",
            columnNames: ["parent_id"],
        }));
        await queryRunner.createTable(new typeorm_1.Table({
            name: "redington_banner_slider",
            columns: [
                {
                    name: "slider_id",
                    type: "int",
                    isPrimary: true,
                },
                {
                    name: "name",
                    type: "varchar",
                },
                {
                    name: "status",
                    type: "int",
                    default: 0,
                },
                {
                    name: "location",
                    type: "varchar",
                },
                {
                    name: "store_ids",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "customer_group_ids",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "priority",
                    type: "int",
                    default: 0,
                },
                {
                    name: "effect",
                    type: "varchar",
                    default: "'slider'",
                },
                {
                    name: "auto_width",
                    type: "boolean",
                    isNullable: true,
                },
                {
                    name: "auto_height",
                    type: "boolean",
                    isNullable: true,
                },
                {
                    name: "design",
                    type: "int",
                    default: 0,
                },
                {
                    name: "loop",
                    type: "boolean",
                    isNullable: true,
                },
                {
                    name: "lazy_load",
                    type: "boolean",
                    isNullable: true,
                },
                {
                    name: "autoplay",
                    type: "boolean",
                    isNullable: true,
                },
                {
                    name: "autoplay_timeout",
                    type: "int",
                    default: 0,
                },
                {
                    name: "nav",
                    type: "boolean",
                    isNullable: true,
                },
                {
                    name: "dots",
                    type: "boolean",
                    isNullable: true,
                },
                {
                    name: "is_responsive",
                    type: "boolean",
                    isNullable: true,
                },
                {
                    name: "responsive_items",
                    type: "text",
                    default: "'[]'",
                },
                {
                    name: "from_date",
                    type: "date",
                    isNullable: true,
                },
                {
                    name: "to_date",
                    type: "date",
                    isNullable: true,
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
            ],
        }));
        await queryRunner.createIndex("redington_banner_slider", new typeorm_1.TableIndex({
            name: "IDX_redington_banner_slider_location",
            columnNames: ["location"],
        }));
        await queryRunner.createTable(new typeorm_1.Table({
            name: "redington_banner",
            columns: [
                {
                    name: "banner_id",
                    type: "int",
                    isPrimary: true,
                },
                {
                    name: "slider_id",
                    type: "int",
                },
                {
                    name: "name",
                    type: "varchar",
                },
                {
                    name: "status",
                    type: "int",
                    default: 0,
                },
                {
                    name: "type",
                    type: "int",
                    default: 0,
                },
                {
                    name: "content",
                    type: "text",
                    isNullable: true,
                },
                {
                    name: "image_url",
                    type: "varchar",
                },
                {
                    name: "url_banner",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "title",
                    type: "varchar",
                    isNullable: true,
                },
                {
                    name: "newtab",
                    type: "int",
                    default: 0,
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
            ],
            foreignKeys: [
                {
                    columnNames: ["slider_id"],
                    referencedTableName: "redington_banner_slider",
                    referencedColumnNames: ["slider_id"],
                    onDelete: "CASCADE",
                },
            ],
        }));
        await queryRunner.createIndex("redington_banner", new typeorm_1.TableIndex({
            name: "IDX_redington_banner_slider_id",
            columnNames: ["slider_id"],
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropIndex("redington_banner", "IDX_redington_banner_slider_id");
        await queryRunner.dropTable("redington_banner");
        await queryRunner.dropIndex("redington_banner_slider", "IDX_redington_banner_slider_location");
        await queryRunner.dropTable("redington_banner_slider");
        await queryRunner.dropIndex("redington_category", "IDX_redington_category_parent_id");
        await queryRunner.dropTable("redington_category");
    }
}
exports.CreateRedingtonContentTables1732147200000 = CreateRedingtonContentTables1732147200000;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMTczMjE0NzIwMDAwMC1DcmVhdGVSZWRpbmd0b25Db250ZW50VGFibGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL21pZ3JhdGlvbnMvMTczMjE0NzIwMDAwMC1DcmVhdGVSZWRpbmd0b25Db250ZW50VGFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUtnQjtBQUVoQixNQUFhLHlDQUF5QztJQUc3QyxLQUFLLENBQUMsRUFBRSxDQUFDLFdBQXdCO1FBQ3RDLE1BQU0sV0FBVyxDQUFDLFdBQVcsQ0FDM0IsSUFBSSxlQUFLLENBQUM7WUFDUixJQUFJLEVBQUUsb0JBQW9CO1lBQzFCLE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxJQUFJLEVBQUUsSUFBSTtvQkFDVixJQUFJLEVBQUUsS0FBSztvQkFDWCxTQUFTLEVBQUUsSUFBSTtpQkFDaEI7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLFdBQVc7b0JBQ2pCLElBQUksRUFBRSxLQUFLO29CQUNYLFVBQVUsRUFBRSxJQUFJO2lCQUNqQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsTUFBTTtvQkFDWixJQUFJLEVBQUUsU0FBUztpQkFDaEI7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLFdBQVc7b0JBQ2pCLElBQUksRUFBRSxTQUFTO29CQUNmLE9BQU8sRUFBRSxJQUFJO2lCQUNkO2dCQUNEO29CQUNFLElBQUksRUFBRSxVQUFVO29CQUNoQixJQUFJLEVBQUUsS0FBSztvQkFDWCxPQUFPLEVBQUUsQ0FBQztpQkFDWDtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsT0FBTztvQkFDYixJQUFJLEVBQUUsS0FBSztvQkFDWCxPQUFPLEVBQUUsQ0FBQztpQkFDWDtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsZUFBZTtvQkFDckIsSUFBSSxFQUFFLEtBQUs7b0JBQ1gsT0FBTyxFQUFFLENBQUM7aUJBQ1g7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLFlBQVk7b0JBQ2xCLElBQUksRUFBRSxh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