import { redingtonConfig } from "../redington-config"
import {
  listActiveDomainExtensionNames,
  listActiveDomainNames,
} from "../../lib/pg"

const normalizeList = (values: string[]): string[] => {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
}

export type AllowedGuestDomainSummary = {
  allowed: string[]
  config: string[]
  database: string[]
  extensions: string[]
}

export const collectAllowedGuestDomains =
  async (): Promise<AllowedGuestDomainSummary> => {
    const configDomains = normalizeList(
      redingtonConfig.guestUsers.allowedDomains ?? []
    )

    const databaseDomains = normalizeList(await listActiveDomainNames())
    const extensionNames = normalizeList(
      await listActiveDomainExtensionNames()
    )

    const allowedSet = new Set<string>()
    for (const domain of configDomains) {
      allowedSet.add(domain.toLowerCase())
    }
    for (const domain of databaseDomains) {
      allowedSet.add(domain.toLowerCase())
    }

    const allowed = Array.from(allowedSet)
      .map((domain) => domain.trim())
      .filter((domain) => domain.length > 0)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))

    return {
      allowed,
      config: configDomains,
      database: databaseDomains,
      extensions: extensionNames,
    }
  }

