import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity({ name: "redington_sap_sync_log" })
export class RedingtonSapSyncLog {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "varchar" })
  run_type: string

  @Column({ type: "varchar", nullable: true })
  order_id: string | null

  @Column({ type: "varchar", nullable: true })
  sap_order_number: string | null

  @Column({ type: "varchar", default: "pending" })
  status: string

  @Column({ type: "text", nullable: true })
  message: string | null

  @Column({ type: "jsonb", nullable: true })
  payload: Record<string, unknown> | null

  @Column({ type: "varchar", nullable: true })
  actor_id: string | null

  @Column({ type: "integer", nullable: true })
  duration_ms: number | null

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date
}
