import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity({ name: "redington_sap_config" })
export class RedingtonSapConfig {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "varchar", nullable: true })
  api_url: string | null

  @Column({ type: "varchar", nullable: true })
  client_id: string | null

  @Column({ type: "varchar", nullable: true })
  client_secret: string | null

  @Column({ type: "varchar", nullable: true })
  invoice_api_url: string | null

  @Column({ type: "varchar", nullable: true })
  invoice_pdf_api_url: string | null

  @Column({ type: "varchar", nullable: true })
  invoice_client_id: string | null

  @Column({ type: "varchar", nullable: true })
  invoice_client_secret: string | null

  @Column({ type: "varchar", nullable: true })
  domain_url: string | null

  @Column({ type: "text", array: true, default: "{}" })
  company_codes: string[]

  @Column({ type: "text", array: true, default: "{}" })
  notification_emails: string[]

  @Column({ type: "varchar", nullable: true })
  updated_by: string | null

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date
}
