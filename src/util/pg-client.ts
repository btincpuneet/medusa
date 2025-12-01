import { Client } from "pg"

export default function client() {
  return new Client({
    connectionString: process.env.DATABASE_URL
  })
}
