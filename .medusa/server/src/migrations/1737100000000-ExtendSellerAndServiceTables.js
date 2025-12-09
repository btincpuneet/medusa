"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtendSellerAndServiceTables1737100000000 = void 0;
class ExtendSellerAndServiceTables1737100000000 {
    constructor() {
        this.name = "ExtendSellerAndServiceTables1737100000000";
    }
    async up(queryRunner) {
        // Add new seller columns if they don't already exist
        await queryRunner.query(`ALTER TABLE seller ADD COLUMN IF NOT EXISTS vendor_name varchar`);
        await queryRunner.query(`ALTER TABLE seller ADD COLUMN IF NOT EXISTS contact_name varchar`);
        await queryRunner.query(`ALTER TABLE seller ADD COLUMN IF NOT EXISTS phone varchar`);
        await queryRunner.query(`ALTER TABLE seller ADD COLUMN IF NOT EXISTS role varchar NOT NULL DEFAULT 'OWNER'`);
        // Create service table
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        code varchar UNIQUE NOT NULL,
        name varchar NOT NULL,
        description text,
        route_path varchar,
        icon_name varchar,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
        // Create seller_service join table
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS seller_service (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        seller_id uuid NOT NULL REFERENCES seller(id) ON DELETE CASCADE,
        service_id uuid NOT NULL REFERENCES service(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (seller_id, service_id)
      );
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS seller_service`);
        await queryRunner.query(`DROP TABLE IF EXISTS service`);
        await queryRunner.query(`ALTER TABLE seller DROP COLUMN IF EXISTS role`);
        await queryRunner.query(`ALTER TABLE seller DROP COLUMN IF EXISTS phone`);
        await queryRunner.query(`ALTER TABLE seller DROP COLUMN IF EXISTS contact_name`);
        await queryRunner.query(`ALTER TABLE seller DROP COLUMN IF EXISTS vendor_name`);
    }
}
exports.ExtendSellerAndServiceTables1737100000000 = ExtendSellerAndServiceTables1737100000000;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMTczNzEwMDAwMDAwMC1FeHRlbmRTZWxsZXJBbmRTZXJ2aWNlVGFibGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL21pZ3JhdGlvbnMvMTczNzEwMDAwMDAwMC1FeHRlbmRTZWxsZXJBbmRTZXJ2aWNlVGFibGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLE1BQWEseUNBQXlDO0lBQXREO1FBQ0UsU0FBSSxHQUFHLDJDQUEyQyxDQUFBO0lBb0RwRCxDQUFDO0lBbERRLEtBQUssQ0FBQyxFQUFFLENBQUMsV0FBd0I7UUFDdEMscURBQXFEO1FBQ3JELE1BQU0sV0FBVyxDQUFDLEtBQUssQ0FDckIsaUVBQWlFLENBQ2xFLENBQUE7UUFDRCxNQUFNLFdBQVcsQ0FBQyxLQUFLLENBQ3JCLGtFQUFrRSxDQUNuRSxDQUFBO1FBQ0QsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUNyQiwyREFBMkQsQ0FDNUQsQ0FBQTtRQUNELE1BQU0sV0FBVyxDQUFDLEtBQUssQ0FDckIsbUZBQW1GLENBQ3BGLENBQUE7UUFFRCx1QkFBdUI7UUFDdkIsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUFDOzs7Ozs7Ozs7Ozs7S0FZdkIsQ0FBQyxDQUFBO1FBRUYsbUNBQW1DO1FBQ25DLE1BQU0sV0FBVyxDQUFDLEtBQUssQ0FBQzs7Ozs7Ozs7S0FRdkIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVNLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBd0I7UUFDeEMsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxDQUFDLENBQUE7UUFDOUQsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUE7UUFDdkQsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUE7UUFDeEUsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUFDLGdEQUFnRCxDQUFDLENBQUE7UUFDekUsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUFDLHVEQUF1RCxDQUFDLENBQUE7UUFDaEYsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUE7SUFDakYsQ0FBQztDQUNGO0FBckRELDhGQXFEQyJ9