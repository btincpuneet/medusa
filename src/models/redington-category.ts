import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity({ name: "redington_category" })
export class RedingtonCategory {
  @PrimaryColumn({ type: "int" })
  id: number

  @Column({ type: "int", nullable: true })
  parent_id: number | null

  @ManyToOne(() => RedingtonCategory, (category) => category.children, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "parent_id" })
  parent?: RedingtonCategory | null

  @OneToMany(() => RedingtonCategory, (category) => category.parent)
  children?: RedingtonCategory[]

  @Column({ type: "varchar" })
  name: string

  @Column({ type: "boolean", default: true })
  is_active: boolean

  @Column({ type: "int", default: 0 })
  position: number

  @Column({ type: "int", default: 0 })
  level: number

  @Column({ type: "int", default: 0 })
  product_count: number

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date
}
