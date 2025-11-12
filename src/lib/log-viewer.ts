import { createReadStream } from "fs"
import { promises as fs } from "fs"
import path from "path"

const DEFAULT_LOG_EXTENSIONS = [".log", ".txt", ".out", ".json"]
const LOG_NAME_PATTERN = /^[A-Za-z0-9._-]+$/
const DEFAULT_LINE_LIMIT = Math.max(
  50,
  Math.min(500, Number(process.env.REDINGTON_LOG_LINE_LIMIT) || 400)
)
const DEFAULT_MAX_BYTES = Math.max(
  64 * 1024,
  Math.min(2 * 1024 * 1024, Number(process.env.REDINGTON_LOG_MAX_BYTES) || 512 * 1024)
)

const normalizeExt = (ext: string) => {
  if (!ext.length) {
    return ""
  }
  return ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`
}

const allowedExtensions = new Set<string>()
DEFAULT_LOG_EXTENSIONS.forEach((ext) => allowedExtensions.add(ext))

const configuredExtensions = (process.env.REDINGTON_LOG_EXTENSIONS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)

configuredExtensions.forEach((ext) => allowedExtensions.add(normalizeExt(ext)))

const getLogRoot = () => {
  const configured = process.env.REDINGTON_LOG_ROOT
  if (configured) {
    return path.resolve(configured)
  }
  return path.resolve(process.cwd(), "logs")
}

export class LogViewerError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

const ensureExtensionAllowed = (name: string) => {
  const ext = normalizeExt(path.extname(name))
  if (!ext || !allowedExtensions.has(ext)) {
    throw new LogViewerError("Unsupported log file extension.", 403)
  }
}

const sanitizeName = (name: string) => {
  const trimmed = String(name ?? "").trim()
  if (!trimmed.length) {
    throw new LogViewerError("Log file name is required.", 400)
  }
  if (!LOG_NAME_PATTERN.test(trimmed)) {
    throw new LogViewerError("Log file name contains invalid characters.", 400)
  }
  ensureExtensionAllowed(trimmed)
  return trimmed
}

const resolveLogFile = async (name: string) => {
  const baseName = sanitizeName(name)
  const root = getLogRoot()
  await fs.mkdir(root, { recursive: true })
  const filePath = path.join(root, baseName)
  const stats = await fs.stat(filePath).catch((err: NodeJS.ErrnoException) => {
    if (err.code === "ENOENT") {
      throw new LogViewerError("Log file not found.", 404)
    }
    throw err
  })

  if (!stats.isFile()) {
    throw new LogViewerError("Log file not found.", 404)
  }

  return {
    filePath,
    stats,
    name: baseName,
    extension: normalizeExt(path.extname(baseName)),
    updated_at: stats.mtime.toISOString(),
  }
}

export type LogFileSummary = {
  name: string
  size: number
  updated_at: string
  extension: string
}

export const listLogFiles = async (): Promise<LogFileSummary[]> => {
  const root = getLogRoot()
  await fs.mkdir(root, { recursive: true })
  const entries = await fs.readdir(root, { withFileTypes: true })

  const summaries: LogFileSummary[] = []

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue
    }
    const name = entry.name
    try {
      ensureExtensionAllowed(name)
    } catch {
      continue
    }
    const filePath = path.join(root, name)
    const stats = await fs.stat(filePath).catch(() => null)
    if (!stats) {
      continue
    }

    summaries.push({
      name,
      size: stats.size,
      updated_at: stats.mtime.toISOString(),
      extension: normalizeExt(path.extname(name)),
    })
  }

  summaries.sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  return summaries
}

const clampLines = (value?: number) => {
  if (!value || !Number.isFinite(value)) {
    return DEFAULT_LINE_LIMIT
  }
  return Math.min(2000, Math.max(50, Math.floor(value)))
}

const clampBytes = (value?: number) => {
  if (!value || !Number.isFinite(value)) {
    return DEFAULT_MAX_BYTES
  }
  return Math.min(5 * 1024 * 1024, Math.max(64 * 1024, Math.floor(value)))
}

export type LogTailResult = {
  name: string
  lines: string[]
  truncated: boolean
  size: number
  updated_at: string
  extension: string
}

export const tailLogFile = async (
  name: string,
  options?: { lines?: number; maxBytes?: number }
): Promise<LogTailResult> => {
  const { filePath, stats, name: baseName, extension, updated_at } =
    await resolveLogFile(name)

  const lineLimit = clampLines(options?.lines)
  const maxBytes = clampBytes(options?.maxBytes)

  const startPosition = Math.max(0, stats.size - maxBytes)
  const length = stats.size - startPosition
  const handle = await fs.open(filePath, "r")
  try {
    const buffer = Buffer.alloc(length)
    await handle.read(buffer, 0, length, startPosition)
    const raw = buffer.toString("utf8")
    const split = raw.split(/\r?\n/)
    const trimmed = split[split.length - 1] === "" ? split.slice(0, -1) : split
    const limited =
      trimmed.length > lineLimit
        ? trimmed.slice(trimmed.length - lineLimit)
        : trimmed
    const truncated = trimmed.length > limited.length || startPosition > 0

    return {
      name: baseName,
      lines: limited,
      truncated,
      size: stats.size,
      updated_at,
      extension,
    }
  } finally {
    await handle.close()
  }
}

export const getLogDownloadHandle = async (name: string) => {
  const { filePath, stats, name: baseName, extension, updated_at } =
    await resolveLogFile(name)

  return {
    stream: createReadStream(filePath),
    size: stats.size,
    name: baseName,
    extension,
    updated_at,
  }
}
